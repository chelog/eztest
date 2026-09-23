'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { ENTITY_ICONS } from '@/lib/entity-icons';
import { cn } from '@/lib/utils';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import {
  ChartLegend,
  HeatmapGrid,
  HorizontalBars,
  RingsChart,
  StackedBarChart,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/frontend/reusable-components/charts';
import type { ProjectStatistics as ProjectStatisticsData, StatusCounts } from '@/backend/services/statistics/services';

const PERIODS = [
  { days: 7, label: '7 дней' },
  { days: 14, label: '14 дней' },
  { days: 30, label: '30 дней' },
  { days: 90, label: '90 дней' },
];

const RESULT_SERIES = [
  { key: 'passed', label: STATUS_LABELS.passed, color: STATUS_COLORS.passed },
  { key: 'failed', label: STATUS_LABELS.failed, color: STATUS_COLORS.failed },
  { key: 'blocked', label: STATUS_LABELS.blocked, color: STATUS_COLORS.blocked },
  { key: 'retest', label: STATUS_LABELS.retest, color: STATUS_COLORS.retest },
];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#e5534b',
  HIGH: '#f0883e',
  MEDIUM: '#f5a524',
  LOW: '#4a8fe7',
};
const DEFECT_STATUS_COLORS: Record<string, string> = {
  NEW: '#4a8fe7',
  IN_PROGRESS: '#f5a524',
  FIXED: '#34d399',
  TESTED: '#a970ff',
  CLOSED: '#6b6b72',
};
const RUN_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Запланирован',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/** "2026-09-21" → "21.09" */
const shortDate = (key: string) => `${key.slice(8, 10)}.${key.slice(5, 7)}`;

function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section data-ui="stat-panel" className={cn('rounded-[14px] bg-white/[0.035] p-5', className)}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 data-ui="section-title" className="text-[15px] font-extrabold uppercase tracking-wide text-white">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatTile({
  label,
  value,
  caption,
  color,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  caption: string;
  color?: string;
  hint?: string;
}) {
  return (
    <div data-ui="stat-tile" className="rounded-[14px] bg-white/[0.035] px-5 py-4 min-w-0" title={hint}>
      <div className="text-[15px] font-semibold text-white/85 truncate">{label}</div>
      <div className="mt-3 text-[28px] leading-none font-extrabold tabular-nums" style={{ color: color ?? '#fff' }}>
        {value}
      </div>
      <div className="mt-3 text-xs text-white/40 truncate">{caption}</div>
    </div>
  );
}

/** 5 → "5 ч", 60 → "2,5 дн" */
const formatHours = (hours: number | null) => {
  if (hours === null) return '—';
  if (hours < 48) return `${hours} ч`;
  return `${(hours / 24).toFixed(1).replace('.', ',')} дн`;
};

const efficiencyColor = (rate: number) => (rate >= 80 ? STATUS_COLORS.passed : rate >= 50 ? STATUS_COLORS.blocked : STATUS_COLORS.failed);

export function ProjectStatistics({ projectId }: { projectId: string }) {
  const [days, setDays] = React.useState(14);
  const [data, setData] = React.useState<ProjectStatisticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const { options: severityOptions } = useDropdownOptions('Defect', 'severity');
  const { options: defectStatusOptions } = useDropdownOptions('Defect', 'status');

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    // Viewer's UTC offset so days and hours match their local clock
    const tz = -new Date().getTimezoneOffset();
    fetch(`/api/projects/${projectId}/statistics?days=${days}&tz=${tz}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json) => !cancelled && setData(json.data))
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectId, days]);

  const periodCaption = `за ${PERIODS.find((p) => p.days === days)?.label ?? `${days} дней`}`;
  const labelOf = (options: { value: string; label: string }[], key: string) =>
    options.find((o) => o.value === key)?.label ?? key.replace(/_/g, ' ');

  const periodSwitch = (
    <div className="flex items-center gap-1 p-1 rounded-[12px] bg-white/[0.035]">
      {PERIODS.map((period) => (
        <button
          key={period.days}
          type="button"
          onClick={() => setDays(period.days)}
          className={cn(
            'h-8 px-3 rounded-[9px] text-[13px] font-semibold transition-colors cursor-pointer',
            days === period.days ? 'bg-primary text-primary-foreground' : 'text-white/55 hover:text-white'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h2 data-ui="section-title" className="flex items-center gap-2 text-xl font-extrabold uppercase tracking-wide text-white">
        <ENTITY_ICONS.statistics className="w-5 h-5 text-white/50" />
        Статистика
      </h2>
      {periodSwitch}
    </div>
  );

  if (error) {
    return (
      <div>
        {header}
        <div className="rounded-[14px] bg-white/[0.035] p-6 text-sm text-white/50 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Не удалось загрузить статистику
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        {header}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[112px] rounded-[14px] bg-white/[0.035] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const s = data.summary;
  const dailyData = data.daily.map((d) => ({ label: shortDate(d.date), title: shortDate(d.date), values: d as unknown as Record<string, number> }));
  const testerData = data.byTester.map((t) => ({ label: t.name, values: t as unknown as Record<string, number> }));
  const lastDays = data.daily.slice(-7).map((d) => d.date);

  const busiestDay = (() => {
    const totals = data.heatmap.cells.map((row) => row.reduce((a, b) => a + b, 0));
    const max = Math.max(...totals);
    return max > 0 ? WEEKDAYS[totals.indexOf(max)] : '—';
  })();
  const busiestHour = (() => {
    const totals = Array.from({ length: 24 }, (_, h) => data.heatmap.cells.reduce((sum, row) => sum + row[h], 0));
    const max = Math.max(...totals);
    return max > 0 ? `${String(totals.indexOf(max)).padStart(2, '0')}:00` : '—';
  })();

  const cell = (counts: StatusCounts | undefined, key: 'passed' | 'failed' | 'blocked') => {
    const value = counts?.[key] ?? 0;
    return (
      <td key={key} className="px-1.5 py-3 text-center tabular-nums text-sm" style={{ color: value ? STATUS_COLORS[key] : 'rgba(255,255,255,0.2)' }}>
        {value || '—'}
      </td>
    );
  };

  return (
    <div data-ui="project-statistics" className={cn('space-y-3 transition-opacity', loading && 'opacity-60')}>
      {header}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatTile label="Выполнено" value={s.total} caption={periodCaption} />
        <StatTile label="Пройдено" value={s.passed} caption={periodCaption} color={STATUS_COLORS.passed} />
        <StatTile label="Провалено" value={s.failed} caption={periodCaption} color={STATUS_COLORS.failed} />
        <StatTile label="Заблокировано" value={s.blocked} caption={periodCaption} color={STATUS_COLORS.blocked} />
        <StatTile label="Открытые дефекты" value={s.defectsOpen} caption={`+${s.defectsCreated} новых ${periodCaption}`} color={STATUS_COLORS.retest} />
        <StatTile label="Успешность" value={`${s.passRate}%`} caption={periodCaption} color={s.total ? efficiencyColor(s.passRate) : undefined} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatTile
          label="Покрытие"
          value={`${data.kpi.coverage}%`}
          caption={`${data.kpi.executedCases} из ${data.kpi.totalCases} кейсов`}
          color={data.kpi.totalCases ? efficiencyColor(data.kpi.coverage) : undefined}
          hint="Доля актуальных тест-кейсов проекта, выполненных хотя бы раз за период"
        />
        <StatTile
          label="Автоматизация"
          value={`${data.kpi.automationShare}%`}
          caption="доля авто-выполнений"
          hint="Доля выполнений, пришедших из автоматических тест-ранов"
        />
        <StatTile
          label="Время исправления"
          value={formatHours(data.kpi.mttrHours)}
          caption="среднее, MTTR"
          hint="Среднее время от создания дефекта до его исправления (дефекты, исправленные за период)"
        />
        <StatTile
          label="Скорость"
          value={data.kpi.velocity.toString().replace('.', ',')}
          caption="выполнений в день"
          hint="Среднее число выполненных тест-кейсов в день за период"
        />
        <StatTile
          label="Плотность дефектов"
          value={data.kpi.defectDensity === null ? '—' : data.kpi.defectDensity.toString().replace('.', ',')}
          caption="на 100 выполнений"
          hint="Сколько новых дефектов приходится на 100 выполненных тест-кейсов"
        />
        <StatTile
          label="Без запусков"
          value={data.stale.count}
          caption="кейсов 30+ дней"
          color={data.stale.count ? STATUS_COLORS.blocked : undefined}
          hint="Актуальные тест-кейсы, которые не выполнялись больше 30 дней или ни разу"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Panel title="Результаты по дням" className="xl:col-span-2" action={<ChartLegend items={RESULT_SERIES} />}>
          <StackedBarChart data={dailyData} series={RESULT_SERIES} height={260} labelEvery={days > 30 ? 7 : days > 14 ? 3 : 1} />
        </Panel>
        <Panel title="Исходы">
          <RingsChart
            size={230}
            items={RESULT_SERIES.map((series) => ({ label: series.label, color: series.color, value: s[series.key as keyof StatusCounts] }))}
            centerLabel={
              <>
                <span className="text-3xl font-extrabold text-white tabular-nums">{s.total}</span>
                <span className="text-xs text-white/50">выполнений</span>
              </>
            }
          />
          <ChartLegend items={RESULT_SERIES} className="justify-center mt-4" />
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel title="По исполнителям">
          <StackedBarChart data={testerData} series={RESULT_SERIES} height={260} rotateLabels emptyText="За период никто не выполнял тесты" />
        </Panel>
        <Panel title="Нагрузка по часам">
          <HeatmapGrid cells={data.heatmap.cells} />
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/45">
            <span>
              Пик:{' '}
              <b className="text-white">
                {data.heatmap.peak
                  ? `${data.heatmap.peak.count} — ${WEEKDAYS[data.heatmap.peak.day]} ${String(data.heatmap.peak.hour).padStart(2, '0')}:00`
                  : '—'}
              </b>
            </span>
            <span>
              Активный день: <b className="text-white">{busiestDay}</b>
            </span>
            <span>
              Час пик: <b className="text-white">{busiestHour}</b>
            </span>
          </div>
        </Panel>
      </div>

      <Panel title="Детальная статистика" action={<span className="text-xs text-white/40">{data.byTester.length} исполнителей</span>}>
        {data.byTester.length === 0 ? (
          <div className="py-6 text-sm text-white/40">За период никто не выполнял тесты</div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[900px] border-separate border-spacing-x-0 border-spacing-y-1">
              <thead>
                <tr className="text-xs text-white/45">
                  <th rowSpan={2} className="text-left font-semibold px-3 pb-2 align-bottom">Исполнитель</th>
                  {lastDays.map((day) => (
                    <th key={day} colSpan={3} className="font-semibold pb-1 text-center">
                      {shortDate(day)}
                    </th>
                  ))}
                  <th rowSpan={2} className="font-semibold px-2 pb-2 align-bottom" style={{ color: STATUS_COLORS.passed }}>Пройдено</th>
                  <th rowSpan={2} className="font-semibold px-2 pb-2 align-bottom" style={{ color: STATUS_COLORS.failed }}>Провалено</th>
                  <th rowSpan={2} className="font-semibold px-2 pb-2 align-bottom">Всего</th>
                  <th rowSpan={2} className="font-semibold px-3 pb-2 align-bottom text-right">Успешность</th>
                </tr>
                <tr className="text-[11px]">
                  {lastDays.map((day) => (
                    <React.Fragment key={day}>
                      <th className="font-semibold pb-2" style={{ color: STATUS_COLORS.passed }} title={STATUS_LABELS.passed}>П</th>
                      <th className="font-semibold pb-2" style={{ color: STATUS_COLORS.failed }} title={STATUS_LABELS.failed}>Пр</th>
                      <th className="font-semibold pb-2" style={{ color: STATUS_COLORS.blocked }} title={STATUS_LABELS.blocked}>Б</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.byTester.map((tester) => (
                  <tr key={tester.userId} className="bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                    <td className="px-3 py-3 rounded-l-[10px] text-sm font-semibold text-white whitespace-nowrap">{tester.name}</td>
                    {lastDays.map((day) => (
                      <React.Fragment key={day}>
                        {cell(tester.days[day], 'passed')}
                        {cell(tester.days[day], 'failed')}
                        {cell(tester.days[day], 'blocked')}
                      </React.Fragment>
                    ))}
                    <td className="px-2 py-3 text-center text-sm font-semibold tabular-nums" style={{ color: STATUS_COLORS.passed }}>{tester.passed}</td>
                    <td className="px-2 py-3 text-center text-sm font-semibold tabular-nums" style={{ color: STATUS_COLORS.failed }}>{tester.failed}</td>
                    <td className="px-2 py-3 text-center text-sm font-bold text-white tabular-nums">{tester.total}</td>
                    <td className="px-3 py-3 rounded-r-[10px] text-right text-sm font-bold tabular-nums" style={{ color: efficiencyColor(tester.passRate) }}>
                      {tester.passRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Panel title="Успешность по ранам" className="xl:col-span-2">
          <StackedBarChart
            data={data.runTrend.map((run) => ({
              label: run.name,
              title: `${run.name} · ${shortDate(run.date.slice(0, 10))} · ${run.executed} выполнено`,
              values: { passRate: run.passRate },
            }))}
            series={[{ key: 'passRate', label: 'Успешность, %', color: STATUS_COLORS.passed }]}
            height={240}
            rotateLabels
            emptyText="Нет запущенных тест-ранов"
          />
        </Panel>
        <Panel title="Возраст открытых дефектов">
          <HorizontalBars
            emptyText="Открытых дефектов нет"
            items={data.defectAging.map((bucket, index) => ({
              label: bucket.key,
              value: bucket.count,
              color: [STATUS_COLORS.passed, STATUS_COLORS.blocked, STATUS_COLORS.failed][index],
            }))}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel title="Падения по модулям">
          <HorizontalBars
            emptyText="За период падений не было"
            items={data.failuresByModule.map((m) => ({ label: m.key, value: m.count, color: STATUS_COLORS.failed }))}
          />
        </Panel>
        <Panel
          title="Давно не запускались"
          action={<span className="text-xs text-white/40">{data.stale.count} кейсов</span>}
        >
          {data.stale.count === 0 ? (
            <div className="py-6 text-sm text-white/40">Все актуальные кейсы запускались за последние 30 дней</div>
          ) : (
            <div className="space-y-1">
              {data.stale.sample.map((tc) => (
                <Link
                  key={tc.id}
                  href={`/projects/${projectId}/testcases/${tc.id}`}
                  className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
                >
                  <span className="shrink-0 px-2 py-0.5 rounded-[7px] bg-white/[0.06] text-xs font-semibold text-white/70">{tc.tcId}</span>
                  <span className="flex-1 text-sm text-white truncate">{tc.title}</span>
                  <span className="shrink-0 text-xs text-white/40">
                    {tc.lastRun ? shortDate(tc.lastRun.slice(0, 10)) : 'ни разу'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel title="Дефекты по критичности">
          <HorizontalBars
            emptyText="Дефектов нет"
            items={data.defectsBySeverity.map((d) => ({
              label: labelOf(severityOptions, d.key),
              value: d.count,
              color: SEVERITY_COLORS[d.key],
            }))}
          />
        </Panel>
        <Panel title="Дефекты по статусам">
          <HorizontalBars
            emptyText="Дефектов нет"
            items={data.defectsByStatus.map((d) => ({
              label: labelOf(defectStatusOptions, d.key),
              value: d.count,
              color: DEFECT_STATUS_COLORS[d.key],
            }))}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel title="Последние тест-раны">
          {data.runs.length === 0 ? (
            <div className="py-6 text-sm text-white/40">Тест-ранов пока нет</div>
          ) : (
            <div className="space-y-1">
              {data.runs.map((run) => {
                const progress = run.total ? Math.round((run.executed / run.total) * 100) : 0;
                return (
                  <Link
                    key={run.id}
                    href={`/projects/${projectId}/testruns/${run.id}`}
                    className="block rounded-[10px] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-sm font-semibold text-white truncate">{run.name}</span>
                      <span className="shrink-0 text-xs text-white/45">
                        {RUN_STATUS_LABELS[run.status] ?? run.status} · {run.executed}/{run.total}
                      </span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.06]" title={`${progress}% выполнено`}>
                      {RESULT_SERIES.map((series) => {
                        const value = run[series.key as keyof StatusCounts];
                        return value && run.total ? (
                          <div key={series.key} style={{ width: `${(value / run.total) * 100}%`, backgroundColor: series.color }} />
                        ) : null;
                      })}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
        <Panel title="Чаще всего падают">
          {data.topFailing.length === 0 ? (
            <div className="py-6 text-sm text-white/40">За период падений не было</div>
          ) : (
            <div className="space-y-1">
              {data.topFailing.map((tc, index) => (
                <Link
                  key={tc.testCaseId}
                  href={`/projects/${projectId}/testcases/${tc.testCaseId}`}
                  className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
                >
                  <span className="w-5 text-sm font-bold text-white/35 tabular-nums">{index + 1}</span>
                  <span className="shrink-0 px-2 py-0.5 rounded-[7px] bg-white/[0.06] text-xs font-semibold text-white/70">{tc.tcId}</span>
                  <span className="flex-1 text-sm text-white truncate">{tc.title}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: STATUS_COLORS.failed }}>
                    {tc.failures}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
