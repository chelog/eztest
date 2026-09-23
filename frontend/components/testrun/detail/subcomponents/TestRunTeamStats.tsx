'use client';

import { useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { TestRunStats } from '../types';

interface TestRunTeamStatsProps {
  stats: TestRunStats;
}

const STATUS_COLORS = {
  passed: 'bg-green-500',
  failed: 'bg-red-500',
  blocked: 'bg-orange-500',
  retest: 'bg-purple-500',
};

export function TestRunTeamStats({ stats }: TestRunTeamStatsProps) {
  const [open, setOpen] = useState(true);

  if (!stats.perUserStats || stats.perUserStats.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] mb-6">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors rounded-xl"
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
        <div className="px-4 pb-4 space-y-3">
          {stats.perUserStats.map((user) => {
            const total = user.passed + user.failed + user.blocked + user.retest;
            const passedPct = total > 0 ? (user.passed / total) * 100 : 0;
            const failedPct = total > 0 ? (user.failed / total) * 100 : 0;
            const blockedPct = total > 0 ? (user.blocked / total) * 100 : 0;
            const retestPct = total > 0 ? (user.retest / total) * 100 : 0;

            return (
              <div key={user.userId} className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/70 uppercase">
                  {user.name.charAt(0)}
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/80 truncate">{user.name}</span>
                    <span className="text-xs text-white/40 ml-2 flex-shrink-0">{total} кейсов</span>
                  </div>

                  {/* Stacked bar */}
                  <div className="h-2 w-full rounded-full overflow-hidden bg-white/10 flex">
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
                    <span className="text-green-400">{user.passed}✓</span>
                  )}
                  {user.failed > 0 && (
                    <span className="text-red-400">{user.failed}✗</span>
                  )}
                  {user.blocked > 0 && (
                    <span className="text-orange-400">{user.blocked}⊘</span>
                  )}
                  {user.retest > 0 && (
                    <span className="text-purple-400">{user.retest}↺</span>
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
