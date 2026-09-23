import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Result statuses that mean a test case was actually executed */
const EXECUTED_STATUSES = ['PASSED', 'FAILED', 'BLOCKED', 'RETEST'] as const;
type ExecutedStatus = (typeof EXECUTED_STATUSES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

export interface StatusCounts {
  passed: number;
  failed: number;
  blocked: number;
  retest: number;
  total: number;
}

export interface ProjectStatistics {
  period: { from: string; to: string; days: number };
  summary: StatusCounts & {
    passRate: number;
    runsTotal: number;
    runsInProgress: number;
    runsCompleted: number;
    notExecuted: number;
    defectsOpen: number;
    defectsCreated: number;
    defectsResolved: number;
  };
  daily: Array<StatusCounts & { date: string }>;
  byTester: Array<
    StatusCounts & {
      userId: string;
      name: string;
      passRate: number;
      days: Record<string, StatusCounts>;
    }
  >;
  heatmap: { cells: number[][]; peak: { day: number; hour: number; count: number } | null };
  defectsBySeverity: Array<{ key: string; count: number }>;
  defectsByStatus: Array<{ key: string; count: number }>;
  runs: Array<{ id: string; name: string; status: string; total: number; executed: number } & StatusCounts>;
  topFailing: Array<{ testCaseId: string; tcId: string; title: string; failures: number }>;
  /** Industry-standard QA metrics */
  kpi: {
    /** % of project test cases executed at least once in the period */
    coverage: number;
    executedCases: number;
    totalCases: number;
    /** % of executions that came from automation runs */
    automationShare: number;
    /** Mean time to resolve defects resolved in the period, hours (null if none) */
    mttrHours: number | null;
    /** Average executions per day over the period */
    velocity: number;
    /** Defects created in the period per 100 executions */
    defectDensity: number | null;
  };
  /** Pass rate of the latest runs, oldest → newest */
  runTrend: Array<{ id: string; name: string; passRate: number; executed: number; date: string }>;
  failuresByModule: Array<{ key: string; count: number }>;
  defectAging: Array<{ key: string; count: number }>;
  /** Test cases not executed for 30+ days (or never) */
  stale: { count: number; sample: Array<{ id: string; tcId: string; title: string; lastRun: string | null }> };
}

const emptyCounts = (): StatusCounts => ({ passed: 0, failed: 0, blocked: 0, retest: 0, total: 0 });

/** yyyy-mm-dd of a moment in the viewer's timezone (offset in minutes, as from Date#getTimezoneOffset negated) */
function localDateKey(date: Date, offsetMinutes: number) {
  return new Date(date.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

const CLOSED_DEFECT_STATUSES = ['CLOSED', 'FIXED', 'TESTED', 'RESOLVED', 'VERIFIED', 'REJECTED', 'DUPLICATE'];

export class StatisticsService {
  async getProjectStatistics(projectId: string, days: number, offsetMinutes: number): Promise<ProjectStatistics> {
    const now = new Date();
    // Period covers `days` whole local days ending today
    const todayKey = localDateKey(now, offsetMinutes);
    const fromLocalMidnight = Date.parse(`${todayKey}T00:00:00.000Z`) - (days - 1) * DAY_MS;
    const from = new Date(fromLocalMidnight - offsetMinutes * 60_000);

    const executedList = Prisma.join([...EXECUTED_STATUSES]);
    const offset = Prisma.sql`make_interval(mins => ${offsetMinutes}::int)`;

    // Aggregated in SQL: one row per (local day, weekday, hour, status, executor, automation)
    const [buckets, executedCasesRow, failureRows, runs, defects, notExecuted] = await Promise.all([
      prisma.$queryRaw<
        Array<{ day: string; dow: number; hour: number; status: ExecutedStatus; userId: string | null; auto: boolean; n: number }>
      >`
        SELECT to_char(r."executedAt" + ${offset}, 'YYYY-MM-DD') AS day,
               extract(isodow FROM r."executedAt" + ${offset})::int AS dow,
               extract(hour FROM r."executedAt" + ${offset})::int AS hour,
               r.status AS status,
               r."executedById" AS "userId",
               (tr."executionType" = 'AUTOMATION') AS auto,
               count(*)::int AS n
        FROM "TestResult" r
        JOIN "TestRun" tr ON tr.id = r."testRunId"
        WHERE tr."projectId" = ${projectId}
          AND r.status IN (${executedList})
          AND r."executedAt" >= ${from}
        GROUP BY 1, 2, 3, 4, 5, 6`,
      prisma.$queryRaw<Array<{ n: number }>>`
        SELECT count(DISTINCT r."testCaseId")::int AS n
        FROM "TestResult" r
        JOIN "TestRun" tr ON tr.id = r."testRunId"
        WHERE tr."projectId" = ${projectId}
          AND r.status IN (${executedList})
          AND r."executedAt" >= ${from}`,
      prisma.$queryRaw<Array<{ testCaseId: string; tcId: string; title: string; module: string | null; n: number }>>`
        SELECT r."testCaseId" AS "testCaseId", tc."tcId" AS "tcId", tc.title AS title, m.name AS module, count(*)::int AS n
        FROM "TestResult" r
        JOIN "TestRun" tr ON tr.id = r."testRunId"
        JOIN "TestCase" tc ON tc.id = r."testCaseId"
        LEFT JOIN "Module" m ON m.id = tc."moduleId"
        WHERE tr."projectId" = ${projectId}
          AND r.status = 'FAILED'
          AND r."executedAt" >= ${from}
        GROUP BY 1, 2, 3, 4`,
      prisma.testRun.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, name: true, status: true },
      }),
      prisma.defect.findMany({
        where: { projectId },
        select: { severity: true, status: true, createdAt: true, resolvedAt: true },
      }),
      prisma.testResult.count({
        where: { testRun: { projectId, status: { not: 'COMPLETED' } }, status: 'SKIPPED' },
      }),
    ]);

    const [testCases, lastRuns, trendRuns] = await Promise.all([
      prisma.testCase.findMany({
        where: { projectId },
        select: { id: true, tcId: true, title: true, status: true },
      }),
      prisma.testResult.groupBy({
        by: ['testCaseId'],
        where: { testRun: { projectId }, status: { in: [...EXECUTED_STATUSES] } },
        _max: { executedAt: true },
      }),
      prisma.testRun.findMany({
        where: { projectId, status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, createdAt: true, completedAt: true },
      }),
    ]);

    // Per-run status counts for the run lists, counted in SQL
    const runIds = [...new Set([...runs.map((r) => r.id), ...trendRuns.map((r) => r.id)])];
    const [runCounts, runStatusCounts, executors] = await Promise.all([
      prisma.testRun.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { _all: true },
      }),
      runIds.length
        ? prisma.testResult.groupBy({
            by: ['testRunId', 'status'],
            where: { testRunId: { in: runIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      prisma.user.findMany({
        where: { id: { in: [...new Set(buckets.map((b) => b.userId).filter((id): id is string => !!id))] } },
        select: { id: true, name: true },
      }),
    ]);
    const executorNames = new Map(executors.map((u) => [u.id, u.name]));

    const runResultCounts = new Map<string, { counts: StatusCounts; total: number }>();
    for (const row of runStatusCounts) {
      const entry = runResultCounts.get(row.testRunId) ?? { counts: emptyCounts(), total: 0 };
      entry.total += row._count._all;
      if ((EXECUTED_STATUSES as readonly string[]).includes(row.status)) {
        entry.counts[row.status.toLowerCase() as keyof Omit<StatusCounts, 'total'>] += row._count._all;
        entry.counts.total += row._count._all;
      }
      runResultCounts.set(row.testRunId, entry);
    }

    // Daily buckets
    const dayKeys: string[] = [];
    for (let i = 0; i < days; i++) {
      dayKeys.push(new Date(fromLocalMidnight + i * DAY_MS).toISOString().slice(0, 10));
    }
    const daily = new Map(dayKeys.map((key) => [key, emptyCounts()]));

    const summary = emptyCounts();
    let automationExecutions = 0;
    const testers = new Map<string, ProjectStatistics['byTester'][number]>();
    const heat = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

    const addCount = (counts: StatusCounts, status: ExecutedStatus, n: number) => {
      counts[status.toLowerCase() as keyof Omit<StatusCounts, 'total'>] += n;
      counts.total += n;
    };

    for (const bucket of buckets) {
      addCount(summary, bucket.status, bucket.n);
      if (bucket.auto) automationExecutions += bucket.n;

      const day = daily.get(bucket.day);
      if (day) addCount(day, bucket.status, bucket.n);

      // ISO weekday: Monday = 1 … Sunday = 7 → row 0…6
      heat[bucket.dow - 1][bucket.hour] += bucket.n;

      const userId = bucket.userId ?? 'unknown';
      let tester = testers.get(userId);
      if (!tester) {
        tester = { userId, name: executorNames.get(userId) ?? 'Неизвестно', passRate: 0, days: {}, ...emptyCounts() };
        testers.set(userId, tester);
      }
      addCount(tester, bucket.status, bucket.n);
      tester.days[bucket.day] ??= emptyCounts();
      addCount(tester.days[bucket.day], bucket.status, bucket.n);
    }

    const moduleFailures = new Map<string, number>();
    const failures = new Map<string, { tcId: string; title: string; failures: number }>();
    for (const row of failureRows) {
      const moduleName = row.module ?? 'Без модуля';
      moduleFailures.set(moduleName, (moduleFailures.get(moduleName) ?? 0) + row.n);
      failures.set(row.testCaseId, { tcId: row.tcId, title: row.title, failures: row.n });
    }
    const executedCaseCount = executedCasesRow[0]?.n ?? 0;

    const rate = (c: StatusCounts) => (c.total > 0 ? Math.round((c.passed / c.total) * 100) : 0);

    let peak: ProjectStatistics['heatmap']['peak'] = null;
    heat.forEach((row, day) =>
      row.forEach((count, hour) => {
        if (count > 0 && (!peak || count > peak.count)) peak = { day, hour, count };
      })
    );

    const countBy = (values: string[]) => {
      const map = new Map<string, number>();
      values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
      return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
    };

    const runsByStatus = Object.fromEntries(runCounts.map((r) => [r.status, r._count._all]));

    // KPIs
    const activeCases = testCases.filter((tc) => tc.status !== 'DEPRECATED');
    // Records with resolvedAt before createdAt are data errors and would skew the average
    const resolvedInPeriod = defects.filter((d) => d.resolvedAt && d.resolvedAt >= from && d.resolvedAt >= d.createdAt);
    const mttrHours = resolvedInPeriod.length
      ? Math.round(
          resolvedInPeriod.reduce((sum, d) => sum + (d.resolvedAt!.getTime() - d.createdAt.getTime()), 0) /
            resolvedInPeriod.length /
            3_600_000
        )
      : null;
    const defectsCreatedInPeriod = defects.filter((d) => d.createdAt >= from).length;

    // Defect aging (open defects only)
    const agingBuckets = [
      { key: 'До 7 дней', max: 7 },
      { key: '7–30 дней', max: 30 },
      { key: 'Больше 30 дней', max: Infinity },
    ].map((bucket) => ({ ...bucket, count: 0 }));
    defects
      .filter((d) => !CLOSED_DEFECT_STATUSES.includes(d.status))
      .forEach((d) => {
        const ageDays = (now.getTime() - d.createdAt.getTime()) / DAY_MS;
        const bucket = agingBuckets.find((b) => ageDays < b.max) ?? agingBuckets[agingBuckets.length - 1];
        bucket.count += 1;
      });

    // Stale test cases: last execution older than 30 days, or never executed
    const lastRunById = new Map(lastRuns.map((r) => [r.testCaseId, r._max.executedAt]));
    const staleBefore = now.getTime() - 30 * DAY_MS;
    const staleCases = activeCases
      .map((tc) => ({ ...tc, lastRun: lastRunById.get(tc.id) ?? null }))
      .filter((tc) => !tc.lastRun || tc.lastRun.getTime() < staleBefore)
      .sort((a, b) => (a.lastRun?.getTime() ?? 0) - (b.lastRun?.getTime() ?? 0));

    return {
      period: { from: from.toISOString(), to: now.toISOString(), days },
      summary: {
        ...summary,
        passRate: rate(summary),
        runsTotal: runCounts.reduce((sum, r) => sum + r._count._all, 0),
        runsInProgress: runsByStatus.IN_PROGRESS ?? 0,
        runsCompleted: runsByStatus.COMPLETED ?? 0,
        notExecuted,
        defectsOpen: defects.filter((d) => !CLOSED_DEFECT_STATUSES.includes(d.status)).length,
        defectsCreated: defects.filter((d) => d.createdAt >= from).length,
        defectsResolved: defects.filter((d) => d.resolvedAt && d.resolvedAt >= from).length,
      },
      daily: dayKeys.map((date) => ({ date, ...daily.get(date)! })),
      byTester: [...testers.values()]
        .map((tester) => ({ ...tester, passRate: rate(tester) }))
        .sort((a, b) => b.total - a.total),
      heatmap: { cells: heat, peak },
      defectsBySeverity: countBy(defects.map((d) => d.severity)),
      defectsByStatus: countBy(defects.map((d) => d.status)),
      runs: runs.map((run) => {
        const entry = runResultCounts.get(run.id) ?? { counts: emptyCounts(), total: 0 };
        return { id: run.id, name: run.name, status: run.status, ...entry.counts, total: entry.total, executed: entry.counts.total };
      }),
      kpi: {
        coverage: activeCases.length ? Math.round((executedCaseCount / activeCases.length) * 100) : 0,
        executedCases: executedCaseCount,
        totalCases: activeCases.length,
        automationShare: summary.total ? Math.round((automationExecutions / summary.total) * 100) : 0,
        mttrHours,
        velocity: Math.round((summary.total / days) * 10) / 10,
        defectDensity: summary.total ? Math.round((defectsCreatedInPeriod / summary.total) * 1000) / 10 : null,
      },
      runTrend: trendRuns
        .map((run) => {
          const counts = runResultCounts.get(run.id)?.counts ?? emptyCounts();
          return {
            id: run.id,
            name: run.name,
            passRate: counts.total ? Math.round((counts.passed / counts.total) * 100) : 0,
            executed: counts.total,
            date: (run.completedAt ?? run.createdAt).toISOString(),
          };
        })
        .reverse(),
      failuresByModule: [...moduleFailures.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      defectAging: agingBuckets.map(({ key, count }) => ({ key, count })),
      stale: {
        count: staleCases.length,
        sample: staleCases.slice(0, 6).map((tc) => ({
          id: tc.id,
          tcId: tc.tcId,
          title: tc.title,
          lastRun: tc.lastRun ? tc.lastRun.toISOString() : null,
        })),
      },
      topFailing: [...failures.entries()]
        .map(([testCaseId, entry]) => ({ testCaseId, ...entry }))
        .sort((a, b) => b.failures - a.failures)
        .slice(0, 8),
    };
  }
}

export const statisticsService = new StatisticsService();
