import { prisma } from '@/lib/prisma';

interface CreateModuleInput {
  projectId: string;
  parentId?: string | null;
  name: string;
  description?: string;
  order?: number;
}

interface UpdateModuleInput {
  name?: string;
  description?: string;
  order?: number;
  /** Move the folder: another folder id, or null for the top level */
  parentId?: string | null;
}

/** Business-rule violation with a user-facing (Russian) message */
export class ModuleRuleError extends Error {}

export class ModuleService {
  /**
   * Name must be unique among siblings (folders with the same parent)
   */
  private async assertNameFree(projectId: string, parentId: string | null, name: string, exceptId?: string) {
    const duplicate = await prisma.module.findFirst({
      where: { projectId, parentId, name, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
    if (duplicate) {
      throw new Error('Module with this name already exists in the project');
    }
  }

  /**
   * The target parent must be a folder of the same project
   */
  private async assertParentInProject(projectId: string, parentId: string) {
    const parent = await prisma.module.findFirst({ where: { id: parentId, projectId }, select: { id: true } });
    if (!parent) {
      throw new ModuleRuleError('Родительская папка не найдена');
    }
  }

  /**
   * Ids of the folder's ancestors, nearest first
   */
  private async getAncestorIds(projectId: string, moduleId: string): Promise<string[]> {
    const all = await prisma.module.findMany({ where: { projectId }, select: { id: true, parentId: true } });
    const parentOf = new Map(all.map((m) => [m.id, m.parentId]));
    const ancestors: string[] = [];
    let current = parentOf.get(moduleId) ?? null;
    while (current && !ancestors.includes(current)) {
      ancestors.push(current);
      current = parentOf.get(current) ?? null;
    }
    return ancestors;
  }

  /**
   * Get all modules for a project
   */
  async getProjectModules(projectId: string) {
    const modules = await prisma.module.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            testCases: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return modules;
  }

  /**
   * Get module by ID
   */
  async getModuleById(moduleId: string, projectId: string) {
    const mod = await prisma.module.findFirst({
      where: {
        id: moduleId,
        projectId,
      },
      include: {
        testCases: {
          select: {
            id: true,
            tcId: true,
            title: true,
            priority: true,
            status: true,
          },
        },
        _count: {
          select: {
            testCases: true,
          },
        },
      },
    });

    if (!mod) {
      throw new Error('Module not found');
    }

    const [ancestorIds, children] = await Promise.all([
      this.getAncestorIds(projectId, moduleId),
      prisma.module.findMany({
        where: { projectId, parentId: moduleId },
        include: { _count: { select: { testCases: true, children: true } } },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      }),
    ]);
    const ancestors = ancestorIds.length
      ? await prisma.module.findMany({ where: { id: { in: ancestorIds } }, select: { id: true, name: true } })
      : [];
    const byId = new Map(ancestors.map((a) => [a.id, a]));
    // Root first, direct parent last
    const path = ancestorIds.slice().reverse().map((id) => byId.get(id)).filter(Boolean);

    return { ...mod, path, children };
  }

  /**
   * Create a new module
   */
  async createModule(data: CreateModuleInput) {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project || project.isDeleted) {
      throw new Error('Project not found');
    }

    const parentId = data.parentId ?? null;
    if (parentId) {
      await this.assertParentInProject(data.projectId, parentId);
    }
    await this.assertNameFree(data.projectId, parentId, data.name);

    // Get the next order number
    const lastModule = await prisma.module.findFirst({
      where: { projectId: data.projectId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = (lastModule?.order ?? -1) + 1;

    const mod = await prisma.module.create({
      data: {
        projectId: data.projectId,
        parentId,
        name: data.name,
        description: data.description,
        order: data.order ?? nextOrder,
      },
      include: {
        _count: {
          select: {
            testCases: true,
          },
        },
      },
    });

    return mod;
  }

  /**
   * Update module
   */
  async updateModule(moduleId: string, projectId: string, data: UpdateModuleInput) {
    // Check if module exists
    const existingModule = await prisma.module.findFirst({
      where: {
        id: moduleId,
        projectId,
      },
    });

    if (!existingModule) {
      throw new Error('Module not found');
    }

    const isMoving = data.parentId !== undefined && data.parentId !== existingModule.parentId;
    const targetParentId = data.parentId !== undefined ? data.parentId : existingModule.parentId;

    if (isMoving && targetParentId) {
      if (targetParentId === moduleId) {
        throw new ModuleRuleError('Нельзя переместить папку в саму себя');
      }
      await this.assertParentInProject(projectId, targetParentId);
      // Moving into own subfolder would cut the branch off the tree
      const targetAncestors = await this.getAncestorIds(projectId, targetParentId);
      if (targetAncestors.includes(moduleId)) {
        throw new ModuleRuleError('Нельзя переместить папку в её же подпапку');
      }
    }

    // Name must stay unique among the (new) siblings
    if ((data.name && data.name !== existingModule.name) || isMoving) {
      await this.assertNameFree(projectId, targetParentId, data.name ?? existingModule.name, moduleId);
    }

    const updateData: Record<string, unknown> = {};
    if (isMoving) updateData.parentId = targetParentId;

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.order !== undefined) updateData.order = data.order;

    const mod = await prisma.module.update({
      where: { id: moduleId },
      data: updateData,
      include: {
        _count: {
          select: {
            testCases: true,
          },
        },
      },
    });

    return mod;
  }

  /**
   * Delete module
   */
  async deleteModule(moduleId: string, projectId: string) {
    // Check if module exists
    const existingModule = await prisma.module.findFirst({
      where: {
        id: moduleId,
        projectId,
      },
      include: {
        _count: {
          select: {
            testCases: true,
          },
        },
      },
    });

    if (!existingModule) {
      throw new Error('Module not found');
    }

    if (existingModule._count.testCases > 0) {
      throw new Error('Cannot delete module with associated test cases');
    }

    const childCount = await prisma.module.count({ where: { parentId: moduleId } });
    if (childCount > 0) {
      throw new ModuleRuleError('Сначала переместите или удалите подпапки');
    }

    await prisma.module.delete({
      where: { id: moduleId },
    });

    return existingModule;
  }

  /**
   * Reorder modules
   */
  async reorderModules(projectId: string, moduleOrders: Array<{ id: string; order: number }>) {
    // Verify all modules belong to the project
    const modules = await prisma.module.findMany({
      where: { projectId },
    });

    const moduleIds = modules.map((m: { id: string; }) => m.id);

    for (const item of moduleOrders) {
      if (!moduleIds.includes(item.id)) {
        throw new Error('Invalid module ID');
      }
    }

    // Update all modules
    const updatePromises = moduleOrders.map(item =>
      prisma.module.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    );

    await Promise.all(updatePromises);

    // Return updated modules
    return await prisma.module.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            testCases: true,
          },
        },
      },
    });
  }

  /**
   * Get test cases for a specific module
   */
  async getModuleTestCases(moduleId: string, projectId: string) {
    // Verify module exists and belongs to project
    const mod = await prisma.module.findFirst({
      where: {
        id: moduleId,
        projectId,
      },
    });

    if (!mod) {
      throw new Error('Module not found');
    }

    // Get test cases
    const testCases = await prisma.testCase.findMany({
      where: { moduleId },
      select: {
        id: true,
        tcId: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        estimatedTime: true,
        suiteId: true,
        _count: {
          select: {
            steps: true,
          },
        },
        module: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        suite: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        tcId: 'asc',
      },
    });

    return {
      testCases,
      module: {
        id: mod.id,
        name: mod.name,
        description: mod.description,
      },
      total: testCases.length,
    };
  }
}

export const moduleService = new ModuleService();
