import { statisticsService } from '@/backend/services/statistics/services';

const ALLOWED_PERIODS = [7, 14, 30, 90];
const MAX_TZ_OFFSET_MINUTES = 14 * 60;

export class StatisticsController {
  /**
   * GET /api/projects/[id]/statistics?days=14&tz=180
   * `tz` is the viewer's UTC offset in minutes (e.g. 180 for MSK) so days/hours match their clock.
   */
  async getProjectStatistics(request: Request, projectId: string) {
    const { searchParams } = new URL(request.url);
    const requestedDays = Number(searchParams.get('days'));
    const days = ALLOWED_PERIODS.includes(requestedDays) ? requestedDays : 14;
    const tz = Number(searchParams.get('tz'));
    const offset = Number.isFinite(tz) && Math.abs(tz) <= MAX_TZ_OFFSET_MINUTES ? Math.round(tz) : 0;

    const data = await statisticsService.getProjectStatistics(projectId, days, offset);
    return { data };
  }
}

export const statisticsController = new StatisticsController();
