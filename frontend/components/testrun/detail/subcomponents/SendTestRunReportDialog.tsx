'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/frontend/reusable-elements/dialogs/Dialog';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { AlertTriangle, Loader2, Mail } from 'lucide-react';
import { getAvatarColor } from '@/lib/avatar-color';

interface ReportRecipient {
  id: string;
  name: string;
  email: string;
  reason: string;
}

interface SendTestRunReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  projectId?: string;
  testRunId: string;
}

export function SendTestRunReportDialog({
  open,
  onOpenChange,
  onConfirm,
  projectId,
  testRunId,
}: SendTestRunReportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ emailEnabled: boolean; recipients: ReportRecipient[] } | null>(null);

  // Show who gets the email before sending
  useEffect(() => {
    if (!open || !projectId) return;
    let cancelled = false;
    setPreview(null);
    setError('');
    fetch(`/api/projects/${projectId}/testruns/${testRunId}/send-report`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!cancelled && body?.data) setPreview(body.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, projectId, testRunId]);

  const handleConfirm = async () => {
    setError('');
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось отправить отчёт';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const recipients = preview?.recipients ?? [];
  const canSend = preview !== null && preview.emailEnabled && recipients.length > 0 && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Отправить отчёт по тест-рану</DialogTitle>
          <DialogDescription>
            Итоги рана (статистика, проваленные кейсы, связанные дефекты) уйдут письмом на почту. Получают все
            администраторы, менеджеры проекта и исполнители дефектов по проваленным кейсам.
          </DialogDescription>
        </DialogHeader>

        {preview === null ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Собираем список получателей...
          </div>
        ) : (
          <div className="space-y-3">
            {!preview.emailEnabled && (
              <div className="flex gap-2.5 rounded-[12px] bg-amber-500/10 px-3.5 py-3 text-sm text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Почта на сервере не настроена (SMTP выключен), поэтому письма сейчас не отправятся. Обратитесь к
                  администратору.
                </span>
              </div>
            )}

            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                <Mail className="h-3.5 w-3.5" />
                Получатели ({recipients.length})
              </p>
              {recipients.length === 0 ? (
                <p className="rounded-[12px] bg-white/[0.03] px-3.5 py-3 text-sm text-white/50">
                  Получателей нет: в проекте нет менеджеров, а администраторы не найдены.
                </p>
              ) : (
                <div className="max-h-[240px] space-y-0.5 overflow-y-auto custom-scrollbar rounded-[12px] bg-white/[0.03] p-1.5">
                  {recipients.map((recipient) => (
                    <div key={recipient.id} className="flex items-center gap-3 rounded-[8px] px-2 py-1.5">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: getAvatarColor(recipient.email || recipient.name) }}
                      >
                        {(recipient.name || recipient.email).charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">{recipient.name}</p>
                        <p className="truncate text-xs text-white/45">{recipient.email}</p>
                      </div>
                      <span className="shrink-0 text-xs text-white/40">{recipient.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[12px] bg-red-500/10 px-3.5 py-3 text-sm text-red-300">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="glass"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full"
            buttonName="Send Test Run Report Dialog - Cancel"
          >
            Не отправлять
          </Button>
          <ButtonPrimary
            onClick={handleConfirm}
            disabled={!canSend}
            className="w-full flex items-center gap-2"
            buttonName="Send Test Run Report Dialog - Send Report"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Отправка...' : 'Отправить отчёт'}
          </ButtonPrimary>
        </div>
      </DialogContent>
    </Dialog>
  );
}
