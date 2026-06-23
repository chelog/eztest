import { formatDateTime } from '@/lib/date-utils';
import { StatCard } from '@/frontend/reusable-components/cards/StatCard';
import { ResponsiveGrid } from '@/frontend/reusable-components/layout/ResponsiveGrid';
import { CheckCircle, XCircle, Circle, Calendar, Clock, User } from 'lucide-react';
import { TestRunStats } from '../types';

interface TestRunStatsCardsProps {
  stats: TestRunStats;
  progressPercentage: number;
  passRate: number;
  testRun: {
    assignedTo?: {
      name: string;
    };
    createdAt: string;
    startedAt?: string;
  };
}

export function TestRunStatsCards({
  stats,
  progressPercentage,
  passRate,
  testRun,
}: TestRunStatsCardsProps) {
  const hasPerUserStats = stats.perUserStats && stats.perUserStats.length > 0;

  return (
    <div className="mb-6 space-y-3">
      <ResponsiveGrid
        columns={{ default: 1, md: 2, lg: 5 }}
        gap="md"
      >
        <StatCard
          label="Прогресс"
          value={`${progressPercentage}%`}
          helpText={`${stats.total - stats.pending} из ${stats.total} выполнено`}
        />

        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Успешно"
          value={stats.passed}
          helpText={`${passRate}% успешных`}
          borderColor="border-l-green-500/30"
        />

        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          label="Провалено"
          value={stats.failed}
          helpText={`${stats.blocked} заблокировано`}
          borderColor="border-l-red-500/30"
        />

        <StatCard
          icon={<Circle className="w-5 h-5" />}
          label="Не запускался"
          value={stats.pending}
          helpText="Еще не выполнялись"
          borderColor="border-l-gray-500/30"
        />

        <StatCard
          icon={<User className="w-5 h-5" />}
          label={testRun.assignedTo?.name || 'Не назначен'}
          value={
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Calendar className="w-3 h-3" />
                Создан {formatDateTime(testRun.createdAt)}
              </div>
              {testRun.startedAt && (
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Clock className="w-3 h-3" />
                  Запущен {formatDateTime(testRun.startedAt)}
                </div>
              )}
            </div>
          }
        />
      </ResponsiveGrid>

      {hasPerUserStats && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-semibold text-white/50 mb-2">Выполнено по исполнителям</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {stats.perUserStats!.map((u) => (
              <div key={u.userId} className="flex items-center gap-2 text-sm text-white/80">
                <span className="font-medium">{u.name}:</span>
                <span className="text-white/60">{u.total} закрыто</span>
                {u.passed > 0 && <span className="text-green-400 text-xs">✓{u.passed}</span>}
                {u.failed > 0 && <span className="text-red-400 text-xs">✗{u.failed}</span>}
                {u.blocked > 0 && <span className="text-orange-400 text-xs">⊘{u.blocked}</span>}
                {u.retest > 0 && <span className="text-purple-400 text-xs">↺{u.retest}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
