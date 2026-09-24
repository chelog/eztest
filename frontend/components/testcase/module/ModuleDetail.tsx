'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/frontend/reusable-components/layout/Navbar';
import { Breadcrumbs } from '@/frontend/reusable-components/layout/Breadcrumbs';
import { ButtonDestructive } from '@/frontend/reusable-elements/buttons/ButtonDestructive';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { ActionButtonGroup } from '@/frontend/reusable-components/layout/ActionButtonGroup';
import { Folder, FileCheck, FolderInput, FolderPlus } from 'lucide-react';
import { FloatingAlert, type FloatingAlertMessage } from '@/frontend/reusable-components/alerts/FloatingAlert';
import { usePermissions } from '@/hooks/usePermissions';
import { Module, TestCase } from '../types';
import { CreateTestCaseDialog } from '../subcomponents/CreateTestCaseDialog';
import { DeleteTestCaseDialog } from '../subcomponents/DeleteTestCaseDialog';
import { DeleteModuleDialog } from './DeleteModuleDialog';
import { AddTestCaseDialog } from './AddTestCaseDialog';
import { ModuleHeader } from './subcomponents/ModuleHeader';
import { ModuleDetailsCard } from './subcomponents/ModuleDetailsCard';
import { ModuleTestCasesCard } from './subcomponents/ModuleTestCasesCard';
import { ModuleInfoCard } from './subcomponents/ModuleInfoCard';
import { ModuleStatisticsCard } from './subcomponents/ModuleStatisticsCard';
import { clearAllPersistedForms } from '@/hooks/useFormPersistence';
import { ModuleSubfoldersCard, type SubfolderItem } from './subcomponents/ModuleSubfoldersCard';
import { MoveToFolderDialog } from './MoveToFolderDialog';
import { CreateModuleDialog } from '../subcomponents/CreateModuleDialog';
import { getDescendantIds, getModulePath } from '@/lib/module-tree';

// Folder page data: the folder with its path (ancestors, top first) and direct subfolders
type FolderDetail = Module & { path?: Array<{ id: string; name: string }>; children?: SubfolderItem[] };

interface ModuleDetailProps {
  projectId: string;
  moduleId: string;
}

export default function ModuleDetail({ projectId, moduleId }: ModuleDetailProps) {
  const router = useRouter();
  const { hasPermission: hasPermissionCheck } = usePermissions();

  const [project, setProject] = useState<{ id: string; name: string; key: string } | null>(null);
  const [module, setModule] = useState<FolderDetail | null>(null);
  // All folders of the project (for moving and creating subfolders)
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [createSubfolderOpen, setCreateSubfolderOpen] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [createTestCaseDialogOpen, setCreateTestCaseDialogOpen] = useState(false);
  const [addTestCaseDialogOpen, setAddTestCaseDialogOpen] = useState(false);
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false);
  const [deleteTestCaseDialogOpen, setDeleteTestCaseDialogOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [alert, setAlert] = useState<FloatingAlertMessage | null>(null);

  const navbarActions = useMemo(() => {
    return [
      {
        type: 'signout' as const,
        showConfirmation: true,
      },
    ];
  }, []);

  useEffect(() => {
    fetchProject();
    fetchModule();
    fetchTestCases();
    fetchAllModules();
  }, [projectId, moduleId]);

  useEffect(() => {
    if (module) {
      document.title = `${module.name} - Папка | EZTest`;
      setFormData({
        name: module.name,
        description: module.description || '',
      });
    }
  }, [module]);

  const canCreateTestCase = hasPermissionCheck('testcases:create');
  const canUpdateModule = hasPermissionCheck('testcases:update');
  const canDeleteModule = hasPermissionCheck('testcases:delete');
  const canDeleteTestCase = hasPermissionCheck('testcases:delete');

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      if (data.data) {
        setProject(data.data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchModule = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/modules/${moduleId}`);
      const data = await response.json();
      if (data.data) {
        setModule(data.data);
      } else if (response.status === 404) {
        setAlert({
          type: 'error',
          title: 'Ошибка',
          message: 'Модуль не найден',
        });
        setTimeout(() => router.push(`/projects/${projectId}/testcases`), 2000);
      }
    } catch (error) {
      console.error('Error fetching module:', error);
      setAlert({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось загрузить модуль',
      });
    }
  };

  const fetchAllModules = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/modules`, { cache: 'no-store' });
      const data = await response.json();
      if (Array.isArray(data.data)) setAllModules(data.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchTestCases = async () => {
    try {
      setLoading(true);
      // Only this folder's test cases (subfolders are listed separately)
      const params = new URLSearchParams({ moduleId, groupBy: 'none', page: '1', limit: '10000' });
      const response = await fetch(`/api/projects/${projectId}/testcases?${params}`, {
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.data) {
        setTestCases(data.data);
      }
    } catch (error) {
      console.error('Error fetching test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!module) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModule(data.data);
        setIsEditing(false);
        setAlert({
          type: 'success',
          title: 'Успешно',
          message: `Модуль «${data.data.name}» успешно обновлен`,
        });
      } else {
        setAlert({
          type: 'error',
          title: 'Ошибка',
          message: data.error || data.message || 'Не удалось обновить папку',
        });
      }
    } catch (error) {
      console.error('Error updating module:', error);
      setAlert({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось обновить модуль',
      });
    }
  };

  const handleMoveFolder = async (targetParentId: string | null) => {
    const response = await fetch(`/api/projects/${projectId}/modules/${moduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId: targetParentId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Не удалось переместить папку');
    }
    setAlert({
      type: 'success',
      title: 'Перемещено',
      message: targetParentId
        ? `Папка перемещена в «${getModulePath(targetParentId, allModules)}»`
        : 'Папка вынесена на верхний уровень',
    });
    fetchModule();
    fetchAllModules();
  };

  const handleTestCaseClick = (testCaseId: string) => {
    router.push(`/projects/${projectId}/testcases/${testCaseId}`);
  };

  const handleTestCaseCreated = (newTestCase: TestCase) => {
    setAlert({
      type: 'success',
      title: 'Успешно',
      message: `Тест-кейс «${newTestCase.title}» успешно создан`,
    });
    fetchTestCases();
  };

  const handleTestCasesAdded = () => {
    setAlert({
      type: 'success',
      title: 'Успешно',
      message: 'Тест-кейсы успешно добавлены в модуль',
    });
    fetchTestCases();
  };

  const handleDeleteClick = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setDeleteTestCaseDialogOpen(true);
  };

  const handleDeleteTestCase = async () => {
    if (!selectedTestCase) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/testcases/${selectedTestCase.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const deletedTestCaseName = selectedTestCase.title;
        setDeleteTestCaseDialogOpen(false);
        setSelectedTestCase(null);
        setAlert({
          type: 'success',
          title: 'Успешно',
          message: `Тест-кейс «${deletedTestCaseName}» успешно удален`,
        });
        fetchTestCases();
      } else {
        const data = await response.json();
        setAlert({
          type: 'error',
          title: 'Ошибка',
          message: data.error || 'Не удалось удалить тест-кейс',
        });
      }
    } catch (error) {
      console.error('Error deleting test case:', error);
      setAlert({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось удалить тест-кейс',
      });
    }
  };

  const handleDeleteModule = async () => {
    if (!module) return;

    const response = await fetch(`/api/projects/${projectId}/modules/${moduleId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setDeleteModuleDialogOpen(false);
      setAlert({
        type: 'success',
        title: 'Успешно',
        message: `Модуль «${module.name}» успешно удален`,
      });
      setTimeout(() => {
        router.push(`/projects/${projectId}/testcases`);
      }, 1000);
    } else {
      const data = await response.json();
      throw new Error(data.error || data.message || 'Не удалось удалить папку');
    }
  };

  if (loading || !module) {
    return <Loader fullScreen text="Загрузка модуля..." />;
  }

  if (!project) {
    return <Loader fullScreen text="Загрузка проекта..." />;
  }

  return (
    <div className="flex-1">
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />

      <Navbar
        brandLabel={null}
        items={[]}
        breadcrumbs={
          <Breadcrumbs 
            items={[
              { label: 'Проекты', href: '/projects' },
              { label: project.name, href: `/projects/${projectId}` },
              { label: 'Тест-кейсы', href: `/projects/${projectId}/testcases` },
              ...(module.path ?? []).map((folder) => ({
                label: folder.name,
                href: `/projects/${projectId}/modules/${folder.id}`,
              })),
              { label: module.name, href: `/projects/${projectId}/modules/${module.id}` },
            ]}
          />
        }
        actions={navbarActions}
      />

      <div className="p-4 md:p-6 lg:p-8 pt-8">
        <ModuleHeader
          module={module}
          projectName={project.name}
          projectKey={project.key}
          testCaseCount={testCases.length}
          isEditing={isEditing}
          formData={formData}
          onEdit={() => setIsEditing(true)}
          onCancel={() => {
            setIsEditing(false);
            setFormData({
              name: module.name,
              description: module.description || '',
            });
          }}
          onSave={handleSave}
          onDelete={() => setDeleteModuleDialogOpen(true)}
          onFormChange={setFormData}
          canUpdate={canUpdateModule}
          canDelete={canDeleteModule}
        />

        <ActionButtonGroup
          buttons={[
            {
              label: 'Все тест-кейсы',
              icon: FileCheck,
              onClick: () => router.push(`/projects/${projectId}/testcases`),
              variant: 'secondary',
              buttonName: 'Module Detail - View All Test Cases',
            },
            {
              label: 'Все наборы тестов',
              icon: Folder,
              onClick: () => router.push(`/projects/${projectId}/testsuites`),
              variant: 'secondary',
              buttonName: 'Module Detail - View All Test Suites',
            },
            ...(canCreateTestCase
              ? [{
                  label: 'Новая подпапка',
                  icon: FolderPlus,
                  onClick: () => setCreateSubfolderOpen(true),
                  variant: 'secondary' as const,
                  buttonName: 'Module Detail - New Subfolder',
                }]
              : []),
            ...(canUpdateModule
              ? [{
                  label: 'Переместить папку',
                  icon: FolderInput,
                  onClick: () => setMoveDialogOpen(true),
                  variant: 'secondary' as const,
                  buttonName: 'Module Detail - Move Folder',
                }]
              : []),
          ]}
          className="mb-6"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ModuleDetailsCard
              module={module}
              isEditing={isEditing}
              formData={formData}
              onFormChange={setFormData}
            />

            <ModuleSubfoldersCard
              projectId={projectId}
              subfolders={module.children ?? []}
              canCreate={canCreateTestCase}
              onCreateClick={() => setCreateSubfolderOpen(true)}
            />

            <ModuleTestCasesCard
              testCases={testCases}
              testCasesCount={testCases.length}
              onCreateClick={() => setCreateTestCaseDialogOpen(true)}
              onAddExistingClick={() => setAddTestCaseDialogOpen(true)}
              onTestCaseClick={handleTestCaseClick}
              onDeleteClick={handleDeleteClick}
              canCreate={canCreateTestCase}
              canDelete={canDeleteTestCase}
              projectId={projectId}
            />
          </div>

          <div className="space-y-6">
            <ModuleInfoCard module={module} testCaseCount={testCases.length} />
            <ModuleStatisticsCard testCases={testCases} />
          </div>
        </div>

        {canCreateTestCase && (
          <CreateTestCaseDialog
            open={createTestCaseDialogOpen}
            onOpenChange={setCreateTestCaseDialogOpen}
            projectId={projectId}
            defaultModuleId={moduleId}
            onTestCaseCreated={handleTestCaseCreated}
          />
        )}

        {canCreateTestCase && (
          <AddTestCaseDialog
            open={addTestCaseDialogOpen}
            onOpenChange={setAddTestCaseDialogOpen}
            projectId={projectId}
            moduleId={moduleId}
            onTestCasesAdded={handleTestCasesAdded}
          />
        )}

        {canDeleteModule && module && (
          <DeleteModuleDialog
            open={deleteModuleDialogOpen}
            onOpenChange={setDeleteModuleDialogOpen}
            module={module}
            testCaseCount={testCases.length}
            onConfirm={handleDeleteModule}
          />
        )}

        <MoveToFolderDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          title={`Переместить папку «${module.name}»`}
          description="Папка переедет вместе со всеми подпапками и тест-кейсами."
          modules={allModules}
          currentFolderId={module.parentId ?? null}
          disabledIds={getDescendantIds(module.id, allModules)}
          rootLabel="Верхний уровень"
          onConfirm={handleMoveFolder}
        />

        {canCreateTestCase && (
          <CreateModuleDialog
            projectId={projectId}
            modules={allModules}
            defaultParentId={moduleId}
            triggerOpen={createSubfolderOpen}
            onOpenChange={setCreateSubfolderOpen}
            onModuleCreated={(created) => {
              setCreateSubfolderOpen(false);
              setAlert({ type: 'success', title: 'Успешно', message: `Подпапка «${created.name}» создана` });
              fetchModule();
              fetchAllModules();
            }}
          />
        )}

        <DeleteTestCaseDialog
          triggerOpen={deleteTestCaseDialogOpen}
          onOpenChange={setDeleteTestCaseDialogOpen}
          testCase={selectedTestCase}
          onConfirm={handleDeleteTestCase}
        />
      </div>
    </div>
  );
}
