import { testRunController } from '@/backend/controllers/testrun/controller';
import { hasPermission } from '@/lib/rbac';

/**
 * GET /api/testruns/[id]/step-checks
 * Ids of test steps marked as done in the test run
 * Required permission: testruns:read
 */
export const GET = hasPermission(
  async (request, context) => {
    const { id } = await context!.params;
    return testRunController.getStepChecks(id);
  },
  'testruns',
  'read'
);

/**
 * PUT /api/testruns/[id]/step-checks
 * Mark / unmark a test step as done: { testStepId, checked }
 * Required permission: testruns:update
 */
export const PUT = hasPermission(
  async (request, context) => {
    const { id } = await context!.params;
    const body = await request.json();
    return testRunController.setStepCheck(body, id, request.userInfo.id);
  },
  'testruns',
  'update'
);
