import { testRunController } from '@/backend/controllers/testrun/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * POST /api/projects/[id]/testruns/[testrunId]/duplicate
 * Create a new PLANNED test run with the same test cases (results are not copied)
 * Required permission: testruns:create
 */
export const POST = hasPermission(
  async (request, context) => {
    const { id, testrunId } = await context.params;
    return testRunController.duplicateTestRun(testrunId, id, request.userInfo.id);
  },
  'testruns',
  'create'
);
