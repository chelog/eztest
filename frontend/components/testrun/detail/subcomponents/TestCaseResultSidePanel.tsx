'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ExternalLink, X, UserCheck, Paperclip, Upload } from 'lucide-react';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { Label } from '@/frontend/reusable-elements/labels/Label';
import { Textarea } from '@/frontend/reusable-elements/textareas/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/reusable-elements/selects/Select';
import { AttachmentDisplay } from '@/frontend/reusable-components/attachments/AttachmentDisplay';
import type { Attachment } from '@/lib/s3';
import { TestCase, ResultFormData } from '../types';

interface Member {
  id: string;
  name: string;
}

interface TestCaseResultSidePanelProps {
  open: boolean;
  testCase: TestCase | null;
  projectId?: string;
  formData: ResultFormData;
  saving?: boolean;
  currentUserId?: string;
  executedBy?: { id?: string; name: string } | null;
  members?: Member[];
  attachments?: Attachment[];
  onClose: () => void;
  onFormChange: (data: Partial<ResultFormData>) => void;
  onSave: () => void;
  onAutoSave?: (status: string) => void;
  onSelfAssign?: () => void;
  onAssign?: (userId: string) => void;
  onAttachmentUploaded?: (attachment: Attachment) => void;
  onAttachmentDeleted?: (attachmentId: string) => void;
  getStatusIcon: (status?: string) => React.JSX.Element;
}

const MIGRATION_METADATA_RE = /^(Source system|Source testcase ID|Original folder path|Owner|Created at|Created by|Modified at|Modified by)\s*:/i;

function cleanDescription(text: string): string {
  return text
    .split('\n')
    .filter((line) => !MIGRATION_METADATA_RE.test(line.trim()))
    .join('\n')
    .trim();
}

const STATUS_LABELS: Record<string, string> = {
  PASSED: 'Успешно',
  FAILED: 'Провалено',
  BLOCKED: 'Заблокировано',
  RETEST: 'Ретест',
  NOT_RUN: 'Не запускался',
};

const QUICK_STATUS_VALUES = ['PASSED', 'FAILED', 'BLOCKED', 'RETEST', 'NOT_RUN'] as const;

const STATUS_BUTTON_STYLES: Record<string, { idle: string; active: string }> = {
  PASSED: {
    idle: 'border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/15',
    active: 'border-2 border-green-300 bg-green-500/25 text-green-100 ring-2 ring-green-300/40 shadow-[0_0_0_1px_rgba(74,222,128,0.55)]',
  },
  FAILED: {
    idle: 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15',
    active: 'border-2 border-red-300 bg-red-500/25 text-red-100 ring-2 ring-red-300/40 shadow-[0_0_0_1px_rgba(248,113,113,0.55)]',
  },
  BLOCKED: {
    idle: 'border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/15',
    active: 'border-2 border-orange-300 bg-orange-500/25 text-orange-100 ring-2 ring-orange-300/40 shadow-[0_0_0_1px_rgba(251,146,60,0.55)]',
  },
  RETEST: {
    idle: 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15',
    active: 'border-2 border-purple-300 bg-purple-500/25 text-purple-100 ring-2 ring-purple-300/40 shadow-[0_0_0_1px_rgba(196,181,253,0.55)]',
  },
  NOT_RUN: {
    idle: 'border-slate-500/30 bg-slate-500/10 text-slate-300 hover:bg-slate-500/15',
    active: 'border-2 border-slate-300 bg-slate-500/25 text-slate-100 ring-2 ring-slate-300/40 shadow-[0_0_0_1px_rgba(203,213,225,0.55)]',
  },
};

export function TestCaseResultSidePanel({
  open,
  testCase,
  projectId,
  formData,
  saving = false,
  currentUserId,
  executedBy,
  members = [],
  attachments = [],
  onClose,
  onFormChange,
  onSave,
  onAutoSave,
  onSelfAssign,
  onAssign,
  onAttachmentUploaded,
  onAttachmentDeleted,
  getStatusIcon,
}: TestCaseResultSidePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!open || !testCase) {
    return null;
  }

  const canOpenTestCase = Boolean(projectId && testCase.id);

  const handleStatusClick = (statusValue: string) => {
    onFormChange({ status: statusValue });
    if (onAutoSave) {
      onAutoSave(statusValue);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0 || !testCase.id) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('testCaseId', testCase.id);
        fd.append('fieldName', 'attachment');
        const res = await fetch('/api/attachments/local-upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Upload failed');
        }
        const { data } = await res.json();
        onAttachmentUploaded?.({ ...data, entityType: 'testcase' });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.currentTarget.value = '';
    }
  };

  return (
    <aside className="fixed right-0 top-0 z-[70] h-screen w-full max-w-xl border-l border-white/10 bg-[#0f0f12] shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-white/10 p-4">
          <div className="min-w-0">
            {canOpenTestCase ? (
              <Link
                href={`/projects/${projectId}/testcases/${testCase.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-blue-300 transition-colors hover:text-blue-200 hover:underline"
                title="Открыть тест-кейс в новой вкладке"
                aria-label="Открыть тест-кейс в новой вкладке"
              >
                {testCase.tcId || '-'}
                <ExternalLink className="h-3 w-3 opacity-80" />
              </Link>
            ) : (
              <p className="text-xs font-mono text-white/60">{testCase.tcId || '-'}</p>
            )}
            {canOpenTestCase && (
              <p className="mt-1 text-[11px] text-white/45">
                Cmd/Ctrl+Click, чтобы открыть в новой вкладке
              </p>
            )}
            <h3
              className="mt-1 text-base font-semibold text-white/90"
              title={testCase.title || testCase.name || 'Тест-кейс'}
            >
              {testCase.title || testCase.name || 'Тест-кейс'}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar">
          {testCase.description && cleanDescription(testCase.description) && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <h4 className="text-sm font-medium text-white/90">Описание</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">
                {cleanDescription(testCase.description)}
              </p>
            </div>
          )}

          {testCase.preconditions && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <h4 className="text-sm font-medium text-white/90">Предусловия</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">
                {testCase.preconditions}
              </p>
            </div>
          )}

          {testCase.steps && testCase.steps.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <h4 className="text-sm font-medium text-white/90">Шаги</h4>
              <div className="mt-3 space-y-2">
                {testCase.steps.map((step) => (
                  <div key={step.id} className="rounded-md border border-white/10 bg-black/10 p-2">
                    <p className="text-xs text-white/60">Шаг {step.stepNumber}</p>
                    <p className="mt-1 text-sm text-white/80 whitespace-pre-wrap">{step.action}</p>
                    <p className="mt-1 text-xs text-white/60 whitespace-pre-wrap">
                      Ожидаемый результат: {step.expectedResult}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" />
                Вложения
                {attachments.length > 0 && (
                  <span className="text-xs text-white/40">({attachments.length})</span>
                )}
              </Label>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  variant="glass"
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-3 h-3" />
                  {uploading ? 'Загрузка...' : 'Добавить'}
                </Button>
              </div>
            </div>
            {uploadError && (
              <p className="text-xs text-red-400">{uploadError}</p>
            )}
            {attachments.length > 0 && (
              <AttachmentDisplay
                attachments={attachments}
                showPreview
                showDelete={!!onAttachmentDeleted}
                onDelete={onAttachmentDeleted}
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="panel-status">Статус результата</Label>
              {onAutoSave && (
                <span className="text-xs text-white/40">Клик = авто-сохранение</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_STATUS_VALUES.map((statusValue) => (
                <Button
                  key={statusValue}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  className={
                    formData.status === statusValue
                      ? STATUS_BUTTON_STYLES[statusValue].active
                      : STATUS_BUTTON_STYLES[statusValue].idle
                  }
                  onClick={() => handleStatusClick(statusValue)}
                >
                  {getStatusIcon(statusValue)}
                  <span className="ml-1">{STATUS_LABELS[statusValue] || statusValue}</span>
                </Button>
              ))}
            </div>
          </div>

          {(onSelfAssign || onAssign) && members.length > 0 && (
            <div className="space-y-2">
              <Label>Исполнитель</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={executedBy?.id || ''}
                  onValueChange={(v) => onAssign?.(v)}
                  disabled={saving}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Не назначен" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {onSelfAssign && currentUserId && executedBy?.id !== currentUserId && (
                  <Button
                    variant="glass"
                    size="sm"
                    className="flex-shrink-0 flex items-center gap-1"
                    onClick={onSelfAssign}
                    disabled={saving}
                    title="Назначить на себя"
                  >
                    <UserCheck className="w-4 h-4" />
                    На себя
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="panel-comment">Комментарий</Label>
            <Textarea
              id="panel-comment"
              variant="glass"
              value={formData.comment}
              onChange={(event) => onFormChange({ comment: event.target.value })}
              placeholder="Добавьте комментарий к выполнению"
              rows={6}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 p-4">
          <Button variant="glass" onClick={onClose}>
            Закрыть
          </Button>
          <ButtonPrimary onClick={onSave} disabled={saving || !formData.status}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </ButtonPrimary>
        </div>
      </div>
    </aside>
  );
}

  id: string;
  name: string;
}

interface TestCaseResultSidePanelProps {
  open: boolean;
  testCase: TestCase | null;
  projectId?: string;
  formData: ResultFormData;
  saving?: boolean;
  currentUserId?: string;
  executedBy?: { id?: string; name: string } | null;
  members?: Member[];
  onClose: () => void;
  onFormChange: (data: Partial<ResultFormData>) => void;
  onSave: () => void;
  onAutoSave?: (status: string) => void;
  onSelfAssign?: () => void;
  onAssign?: (userId: string) => void;
  getStatusIcon: (status?: string) => React.JSX.Element;
}

const MIGRATION_METADATA_RE = /^(Source system|Source testcase ID|Original folder path|Owner|Created at|Created by|Modified at|Modified by)\s*:/i;

function cleanDescription(text: string): string {
  return text
    .split('\n')
    .filter((line) => !MIGRATION_METADATA_RE.test(line.trim()))
    .join('\n')
    .trim();
}

const STATUS_LABELS: Record<string, string> = {
  PASSED: 'Успешно',
  FAILED: 'Провалено',
  BLOCKED: 'Заблокировано',
  RETEST: 'Ретест',
  NOT_RUN: 'Не запускался',
};

const QUICK_STATUS_VALUES = ['PASSED', 'FAILED', 'BLOCKED', 'RETEST', 'NOT_RUN'] as const;

const STATUS_BUTTON_STYLES: Record<string, { idle: string; active: string }> = {
  PASSED: {
    idle: 'border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/15',
    active: 'border-2 border-green-300 bg-green-500/25 text-green-100 ring-2 ring-green-300/40 shadow-[0_0_0_1px_rgba(74,222,128,0.55)]',
  },
  FAILED: {
    idle: 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15',
    active: 'border-2 border-red-300 bg-red-500/25 text-red-100 ring-2 ring-red-300/40 shadow-[0_0_0_1px_rgba(248,113,113,0.55)]',
  },
  BLOCKED: {
    idle: 'border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/15',
    active: 'border-2 border-orange-300 bg-orange-500/25 text-orange-100 ring-2 ring-orange-300/40 shadow-[0_0_0_1px_rgba(251,146,60,0.55)]',
  },
  RETEST: {
    idle: 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15',
    active: 'border-2 border-purple-300 bg-purple-500/25 text-purple-100 ring-2 ring-purple-300/40 shadow-[0_0_0_1px_rgba(196,181,253,0.55)]',
  },
  NOT_RUN: {
    idle: 'border-slate-500/30 bg-slate-500/10 text-slate-300 hover:bg-slate-500/15',
    active: 'border-2 border-slate-300 bg-slate-500/25 text-slate-100 ring-2 ring-slate-300/40 shadow-[0_0_0_1px_rgba(203,213,225,0.55)]',
  },
};

export function TestCaseResultSidePanel({
  open,
  testCase,
  projectId,
  formData,
  saving = false,
  currentUserId,
  executedBy,
  members = [],
  onClose,
  onFormChange,
  onSave,
  onAutoSave,
  onSelfAssign,
  onAssign,
  getStatusIcon,
}: TestCaseResultSidePanelProps) {
  if (!open || !testCase) {
    return null;
  }

  const canOpenTestCase = Boolean(projectId && testCase.id);

  const handleStatusClick = (statusValue: string) => {
    onFormChange({ status: statusValue });
    if (onAutoSave) {
      onAutoSave(statusValue);
    }
  };

  return (
    <aside className="fixed right-0 top-0 z-[70] h-screen w-full max-w-xl border-l border-white/10 bg-[#0f0f12] shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-white/10 p-4">
          <div className="min-w-0">
            {canOpenTestCase ? (
              <Link
                href={`/projects/${projectId}/testcases/${testCase.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-blue-300 transition-colors hover:text-blue-200 hover:underline"
                title="Открыть тест-кейс в новой вкладке"
                aria-label="Открыть тест-кейс в новой вкладке"
              >
                {testCase.tcId || '-'}
                <ExternalLink className="h-3 w-3 opacity-80" />
              </Link>
            ) : (
              <p className="text-xs font-mono text-white/60">{testCase.tcId || '-'}</p>
            )}
            {canOpenTestCase && (
              <p className="mt-1 text-[11px] text-white/45">
                Cmd/Ctrl+Click, чтобы открыть в новой вкладке
              </p>
            )}
            <h3
              className="mt-1 text-base font-semibold text-white/90"
              title={testCase.title || testCase.name || 'Тест-кейс'}
            >
              {testCase.title || testCase.name || 'Тест-кейс'}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar">
          {testCase.description && cleanDescription(testCase.description) && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <h4 className="text-sm font-medium text-white/90">Описание</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">
                {cleanDescription(testCase.description)}
              </p>
            </div>
          )}

          {testCase.preconditions && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <h4 className="text-sm font-medium text-white/90">Предусловия</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">
                {testCase.preconditions}
              </p>
            </div>
          )}

          {testCase.steps && testCase.steps.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <h4 className="text-sm font-medium text-white/90">Шаги</h4>
              <div className="mt-3 space-y-2">
                {testCase.steps.map((step) => (
                  <div key={step.id} className="rounded-md border border-white/10 bg-black/10 p-2">
                    <p className="text-xs text-white/60">Шаг {step.stepNumber}</p>
                    <p className="mt-1 text-sm text-white/80 whitespace-pre-wrap">{step.action}</p>
                    <p className="mt-1 text-xs text-white/60 whitespace-pre-wrap">
                      Ожидаемый результат: {step.expectedResult}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="panel-status">Статус результата</Label>
              {onAutoSave && (
                <span className="text-xs text-white/40">Клик = авто-сохранение</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_STATUS_VALUES.map((statusValue) => (
                <Button
                  key={statusValue}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  className={
                    formData.status === statusValue
                      ? STATUS_BUTTON_STYLES[statusValue].active
                      : STATUS_BUTTON_STYLES[statusValue].idle
                  }
                  onClick={() => handleStatusClick(statusValue)}
                >
                  {getStatusIcon(statusValue)}
                  <span className="ml-1">{STATUS_LABELS[statusValue] || statusValue}</span>
                </Button>
              ))}
            </div>
          </div>

          {(onSelfAssign || onAssign) && members.length > 0 && (
            <div className="space-y-2">
              <Label>Исполнитель</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={executedBy?.id || ''}
                  onValueChange={(v) => onAssign?.(v)}
                  disabled={saving}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Не назначен" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {onSelfAssign && currentUserId && executedBy?.id !== currentUserId && (
                  <Button
                    variant="glass"
                    size="sm"
                    className="flex-shrink-0 flex items-center gap-1"
                    onClick={onSelfAssign}
                    disabled={saving}
                    title="Назначить на себя"
                  >
                    <UserCheck className="w-4 h-4" />
                    На себя
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="panel-comment">Комментарий</Label>
            <Textarea
              id="panel-comment"
              variant="glass"
              value={formData.comment}
              onChange={(event) => onFormChange({ comment: event.target.value })}
              placeholder="Добавьте комментарий к выполнению"
              rows={6}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 p-4">
          <Button variant="glass" onClick={onClose}>
            Закрыть
          </Button>
          <ButtonPrimary onClick={onSave} disabled={saving || !formData.status}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </ButtonPrimary>
        </div>
      </div>
    </aside>
  );
}
