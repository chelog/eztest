import { testRunController } from '@/backend/controllers/testrun/controller';
import { hasProjectMemberAccess } from '@/lib/rbac/hasProjectMemberAccess';

/**
 * POST /api/projects/[id]/testruns/[testrunId]/results/add
 * Add many test cases to a run in one request: { testCaseIds }
 */
export const POST = hasProjectMemberAccess(
  async (request, context) => {
    const { testrunId } = await context.params;
    const body = await request.json();
    return testRunController.addTestCasesToRun(body, testrunId);
  },
  'testruns',
  'update'
);
