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

// Idle: neutral chip with a colored icon. Active: calm fill in the status color, no glow.
const STATUS_BUTTON_STYLES: Record<string, { idle: string; active: string }> = {
  PASSED: {
    idle: 'border-transparent bg-white/[0.04] text-white/70 hover:bg-white/[0.07] [&_svg]:text-emerald-400',
    active: 'border-transparent bg-emerald-500/20 text-emerald-200 [&_svg]:text-emerald-300',
  },
  FAILED: {
    idle: 'border-transparent bg-white/[0.04] text-white/70 hover:bg-white/[0.07] [&_svg]:text-red-400',
    active: 'border-transparent bg-red-500/20 text-red-200 [&_svg]:text-red-300',
  },
  BLOCKED: {
    idle: 'border-transparent bg-white/[0.04] text-white/70 hover:bg-white/[0.07] [&_svg]:text-amber-400',
    active: 'border-transparent bg-amber-500/20 text-amber-200 [&_svg]:text-amber-300',
  },
  RETEST: {
    idle: 'border-transparent bg-white/[0.04] text-white/70 hover:bg-white/[0.07] [&_svg]:text-violet-400',
    active: 'border-transparent bg-violet-500/20 text-violet-200 [&_svg]:text-violet-300',
  },
  NOT_RUN: {
    idle: 'border-transparent bg-white/[0.04] text-white/70 hover:bg-white/[0.07] [&_svg]:text-white/40',
    active: 'border-transparent bg-white/[0.12] text-white [&_svg]:text-white/70',
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
      setUploadError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
      e.currentTarget.value = '';
    }
  };

  return (
    <aside className="fixed right-0 top-0 z-[70] h-screen w-full max-w-lg border-l border-white/[0.06] bg-[#141415] shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.8)]">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            {canOpenTestCase ? (
              <Link
                href={`/projects/${projectId}/testcases/${testCase.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-white/50 transition-colors hover:text-white"
                title="Открыть тест-кейс в новой вкладке"
                aria-label="Открыть тест-кейс в новой вкладке"
              >
                {testCase.tcId || '-'}
                <ExternalLink className="h-3 w-3 opacity-80" />
              </Link>
            ) : (
              <p className="text-xs font-mono text-white/60">{testCase.tcId || '-'}</p>
            )}
            <h3
              className="mt-1 text-lg font-semibold leading-snug text-white"
              title={testCase.title || testCase.name || 'Тест-кейс'}
            >
              {testCase.title || testCase.name || 'Тест-кейс'}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 custom-scrollbar">
          {testCase.description && cleanDescription(testCase.description) && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-white/40">Описание</h4>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {cleanDescription(testCase.description)}
              </p>
            </div>
          )}

          {testCase.preconditions && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-white/40">Предусловия</h4>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {testCase.preconditions}
              </p>
            </div>
          )}

          {testCase.steps && testCase.steps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-white/40">Шаги</h4>
              <ol className="mt-2 space-y-1.5">
                {testCase.steps.map((step) => (
                  <li key={step.id} className="flex gap-3 rounded-[10px] bg-white/[0.03] px-3 py-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-white/70">
                      {step.stepNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-white/85 whitespace-pre-wrap">{step.action}</p>
                      {step.expectedResult && (
                        <p className="mt-1 text-xs text-white/50 whitespace-pre-wrap">→ {step.expectedResult}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {QUICK_STATUS_VALUES.map((statusValue) => (
                <Button
                  key={statusValue}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  data-ui="status-choice"
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

        <div className="grid grid-cols-2 gap-2 border-t border-white/[0.06] px-5 py-4">
          <Button variant="glass" onClick={onClose} className="w-full">
            Закрыть
          </Button>
          <ButtonPrimary onClick={onSave} disabled={saving || !formData.status} className="w-full">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </ButtonPrimary>
        </div>
      </div>
    </aside>
  );
}
