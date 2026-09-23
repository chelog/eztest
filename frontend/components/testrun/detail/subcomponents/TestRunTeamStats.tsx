'use client';

import { useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { TestRunStats } from '../types';

interface TestRunTeamStatsProps {
  stats: TestRunStats;
}

const STATUS_COLORS = {
  passed: 'bg-emerald-400/80',
  failed: 'bg-red-400/80',
  blocked: 'bg-amber-400/80',
  retest: 'bg-violet-400/80',
};

export function TestRunTeamStats({ stats }: TestRunTeamStatsProps) {
  const [open, setOpen] = useState(true);

  if (!stats.perUserStats || stats.perUserStats.length === 0) return null;

  return (
    <div className="rounded-[14px] bg-white/[0.035]">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors rounded-[14px]"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Users className="w-4 h-4 text-white/50" />
          Команда
          <span className="text-xs font-normal text-white/40">
            ({stats.perUserStats.length} {stats.perUserStats.length === 1 ? 'участник' : 'участников'})
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-3.5 space-y-2.5">
          {stats.perUserStats.map((user) => {
            const total = user.passed + user.failed + user.blocked + user.retest;
            const passedPct = total > 0 ? (user.passed / total) * 100 : 0;
            const failedPct = total > 0 ? (user.failed / total) * 100 : 0;
            const blockedPct = total > 0 ? (user.blocked / total) * 100 : 0;
            const retestPct = total > 0 ? (user.retest / total) * 100 : 0;

            return (
              <div key={user.userId} className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-semibold text-white/70 uppercase">
                  {user.name.charAt(0)}
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/80 truncate">{user.name}</span>
                    <span className="text-xs text-white/40 ml-2 flex-shrink-0">{total} кейсов</span>
                  </div>

                  {/* Stacked bar */}
                  <div className="h-1 w-full rounded-full overflow-hidden bg-white/[0.08] flex">
                    {user.passed > 0 && (
                      <div
                        className={`h-full ${STATUS_COLORS.passed} transition-all`}
                        style={{ width: `${passedPct}%` }}
                        title={`Успешно: ${user.passed}`}
                      />
                    )}
                    {user.failed > 0 && (
                      <div
                        className={`h-full ${STATUS_COLORS.failed} transition-all`}
                        style={{ width: `${failedPct}%` }}
                        title={`Провалено: ${user.failed}`}
                      />
                    )}
                    {user.blocked > 0 && (
                      <div
                        className={`h-full ${STATUS_COLORS.blocked} transition-all`}
                        style={{ width: `${blockedPct}%` }}
                        title={`Заблокировано: ${user.blocked}`}
                      />
                    )}
                    {user.retest > 0 && (
                      <div
                        className={`h-full ${STATUS_COLORS.retest} transition-all`}
                        style={{ width: `${retestPct}%` }}
                        title={`Ретест: ${user.retest}`}
                      />
                    )}
                  </div>
                </div>

                {/* Counts */}
                <div className="flex-shrink-0 flex items-center gap-2 text-xs">
                  {user.passed > 0 && (
                    <span className="text-emerald-400/90 tabular-nums">{user.passed}</span>
                  )}
                  {user.failed > 0 && (
                    <span className="text-red-400/90 tabular-nums">{user.failed}</span>
                  )}
                  {user.blocked > 0 && (
                    <span className="text-amber-400/90 tabular-nums">{user.blocked}</span>
                  )}
                  {user.retest > 0 && (
                    <span className="text-violet-400/90 tabular-nums">{user.retest}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
