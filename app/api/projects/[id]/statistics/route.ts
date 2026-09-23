import { statisticsController } from '@/backend/controllers/statistics/controller';
import { hasPermission } from '@/lib/rbac';

/**
 * GET /api/projects/[id]/statistics
 * Aggregated execution / defect statistics for the project dashboard
 * Query: days (7|14|30|90), tz (viewer UTC offset in minutes)
 * Required permission: testruns:read
 */
export const GET = hasPermission(
  async (request, context) => {
    const { id } = await context!.params;
    return statisticsController.getProjectStatistics(request, id);
  },
  'testruns',
  'read'
);
