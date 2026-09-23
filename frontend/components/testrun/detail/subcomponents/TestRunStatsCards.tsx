import { TestRunStats } from '../types';

interface TestRunStatsCardsProps {
  stats: TestRunStats;
  progressPercentage: number;
  passRate: number;
  /** @deprecated assignee and dates moved to the header */
  testRun?: unknown;
}

function Tile({ label, value, caption, color, children }: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  color?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] bg-white/[0.035] px-4 py-3.5 min-w-0">
      <div className="text-[13px] text-white/55 truncate">{label}</div>
      <div className="mt-1.5 text-[26px] leading-none font-bold tabular-nums" style={{ color: color ?? '#fff' }}>
        {value}
      </div>
      {children}
      {caption && <div className="mt-2 text-xs text-white/40 truncate">{caption}</div>}
    </div>
  );
}

export function TestRunStatsCards({ stats, progressPercentage, passRate }: TestRunStatsCardsProps) {
  const executed = stats.total - stats.pending;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <Tile label="Прогресс" value={`${progressPercentage}%`}>
        <div className="mt-2.5 h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <div className="h-full rounded-full bg-white/60" style={{ width: `${progressPercentage}%` }} />
        </div>
        <div className="mt-1.5 text-xs text-white/40">
          {executed} из {stats.total}
        </div>
      </Tile>
      <Tile label="Пройдено" value={stats.passed} caption={`${passRate}% успешных`} color="#34d399" />
      <Tile label="Провалено" value={stats.failed} color="#f0625b" />
      <Tile label="Заблокировано" value={stats.blocked} color="#f5a524" />
      <Tile label="Не запускались" value={stats.pending} color="rgba(255,255,255,0.55)" />
    </div>
  );
}
