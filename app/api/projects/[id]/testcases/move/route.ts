import { testCaseController } from '@/backend/controllers/testcase/controller';
import { hasPermission } from '@/lib/rbac';

/**
 * POST /api/projects/[id]/testcases/move
 * Move test cases into a folder: { testCaseIds, moduleId } (moduleId = null → out of folders)
 * Required permission: testcases:update
 */
export const POST = hasPermission(
  async (request, context) => {
    const { id: projectId } = await context.params;
    return testCaseController.moveTestCases(request, projectId);
  },
  'testcases',
  'update'
);
