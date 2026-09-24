'use client';

import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { ActionButtonGroup } from '@/frontend/reusable-components/layout/ActionButtonGroup';
import { Play, CircleCheckBig, Pencil, X, Check, User, Calendar, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/date-utils';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { getDynamicBadgeProps } from '@/lib/badge-color-utils';
import { useState } from 'react';
import { Input } from '@/frontend/reusable-elements/inputs/Input';

interface TestRunHeaderProps {
  testRun: {
    name: string;
    description?: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    environment?: string;
    project: {
      id: string;
    };
  };
  executionTypeLabel?: string;
  actionLoading: boolean;
  canUpdate?: boolean;
  onStartTestRun: () => void;
  onCompleteTestRun: () => void;
  onNameUpdate?: (name: string) => Promise<void>;
  assigneeName?: string;
  createdAt?: string;
  startedAt?: string;
}

export function TestRunHeader({
  testRun,
  executionTypeLabel,
  actionLoading,
  canUpdate = true,
  onStartTestRun,
  onCompleteTestRun,
  onNameUpdate,
  assigneeName,
  createdAt,
  startedAt,
}: TestRunHeaderProps) {
  const { options: statusOptions } = useDropdownOptions('TestRun', 'status');
  const { options: environmentOptions } = useDropdownOptions('TestRun', 'environment');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  const handleEditClick = () => {
    setNameValue(testRun.name);
    setEditingName(true);
  };

  const handleNameSave = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === testRun.name || !onNameUpdate) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await onNameUpdate(trimmed);
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') setEditingName(false);
  };

  const statusBadgeProps = getDynamicBadgeProps(testRun.status, statusOptions);
  const environmentBadgeProps = testRun.environment
    ? getDynamicBadgeProps(testRun.environment, environmentOptions)
    : null;

  // Get labels from dropdown options
  const statusLabel = statusOptions.find(opt => opt.value === testRun.status)?.label || testRun.status.replace('_', ' ');
  const environmentLabel = testRun.environment
    ? (environmentOptions.find(opt => opt.value === testRun.environment)?.label || testRun.environment.toUpperCase())
    : null;

  // Determine execution type badge color based on label
  const executionTypeBadgeClassName = executionTypeLabel === 'Авто'
    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    : 'bg-blue-500/10 text-blue-500 border-blue-500/20';

  const titleContent = editingName ? (
    <div className="flex items-center gap-2">
      <Input
        variant="glass"
        value={nameValue}
        onChange={(e) => setNameValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        maxLength={255}
        className="text-xl font-bold"
        disabled={savingName}
      />
      <button
        onClick={handleNameSave}
        disabled={savingName}
        className="p-1.5 rounded text-green-400 hover:text-green-300 hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={() => setEditingName(false)}
        disabled={savingName}
        className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2 group min-w-0">
      <h1 className="text-2xl font-bold text-white truncate">{testRun.name}</h1>
      {canUpdate && onNameUpdate && (
        <button
          onClick={handleEditClick}
          className="p-1 rounded opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/90 hover:bg-white/10 transition-all"
          title="Редактировать название"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  const meta = (label: string, content: React.ReactNode) => (
    <div className="flex items-center gap-1.5">
      <span className="text-white/45">{label}</span>
      {content}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="min-w-0 space-y-2">
        {titleContent}
        {testRun.description && <p className="text-sm text-white/55 max-w-3xl">{testRun.description}</p>}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          {meta(
            'Статус',
            <Badge variant="outline" className={statusBadgeProps.className} style={statusBadgeProps.style}>
              {statusLabel}
            </Badge>
          )}
          {executionTypeLabel &&
            meta(
              'Запуск',
              <Badge variant="outline" className={executionTypeBadgeClassName}>
                {executionTypeLabel}
              </Badge>
            )}
          {testRun.environment &&
            environmentBadgeProps &&
            meta(
              'Окружение',
              <Badge variant="outline" className={environmentBadgeProps.className} style={environmentBadgeProps.style}>
                {environmentLabel}
              </Badge>
            )}
          <span className="flex items-center gap-1.5 text-white/55">
            <User className="w-3.5 h-3.5 text-white/35" />
            {assigneeName || 'Не назначен'}
          </span>
          {createdAt && (
            <span className="flex items-center gap-1.5 text-white/55">
              <Calendar className="w-3.5 h-3.5 text-white/35" />
              {formatDateTime(createdAt)}
            </span>
          )}
          {startedAt && (
            <span className="flex items-center gap-1.5 text-white/55" title="Запущен">
              <Clock className="w-3.5 h-3.5 text-white/35" />
              Запущен {formatDateTime(startedAt)}
            </span>
          )}
        </div>
      </div>
      {canUpdate && (
        <ActionButtonGroup
          buttons={[
            {
              label: 'Запустить',
              icon: Play,
              onClick: onStartTestRun,
              variant: 'primary',
              show: testRun.status === 'PLANNED',
              loading: actionLoading && testRun.status === 'PLANNED',
            },
            {
              label: 'Завершить',
              icon: CircleCheckBig,
              onClick: onCompleteTestRun,
              variant: 'primary',
              show: testRun.status === 'IN_PROGRESS',
              loading: actionLoading && testRun.status === 'IN_PROGRESS',
            },
          ]}
        />
      )}
    </div>
  );
}
