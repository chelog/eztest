import { testRunController } from '@/backend/controllers/testrun/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * POST /api/projects/[id]/testruns/[testrunId]/send-report
 * Send test run report
 */
export const POST = hasPermission(
  async (request, context) => {
    const { testrunId } = await context.params;
    return testRunController.sendTestRunReport(testrunId, request.userInfo.id);
  },
  'testruns',
  'read'
);


/**
 * GET /api/projects/[id]/testruns/[testrunId]/send-report
 * Who will receive the report email
 */
export const GET = hasPermission(
  async (request, context) => {
    const { testrunId } = await context.params;
    return testRunController.getTestRunReportRecipients(testrunId);
  },
  'testruns',
  'read'
);
