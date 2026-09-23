'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/frontend/reusable-elements/dialogs/Dialog';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { Loader2 } from 'lucide-react';

interface SendTestRunReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function SendTestRunReportDialog({
  open,
  onOpenChange,
  onConfirm,
}: SendTestRunReportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отправить отчёт по тест-рану</DialogTitle>
          <DialogDescription>
            Отправить отчёт по тест-рану администраторам, менеджерам проектов и исполнителям дефектов?
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="glass"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            buttonName="Send Test Run Report Dialog - Cancel"
          >
            No
          </Button>
          <ButtonPrimary
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-2"
            buttonName="Send Test Run Report Dialog - Send Report"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Sending...' : 'Yes, Send Report'}
          </ButtonPrimary>
        </div>
      </DialogContent>
    </Dialog>
  );
}

