'use client';

import { BaseConfirmDialog, BaseConfirmDialogConfig } from '@/frontend/reusable-components/dialogs/BaseConfirmDialog';

interface DeleteTestSuiteDialogProps {
  open: boolean;
  testSuiteName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteTestSuiteDialog({
  open,
  testSuiteName,
  onOpenChange,
  onConfirm,
}: DeleteTestSuiteDialogProps) {
  const content = (
    <p className="text-sm text-gray-300">
      Тест-кейсы сьюта не удалятся, но останутся без сьюта.
    </p>
  );

  const config: BaseConfirmDialogConfig = {
    title: 'Удалить тест-сьют',
    description: `Удалить «${testSuiteName}»? Действие нельзя отменить.`,
    content,
    submitLabel: 'Удалить',
    cancelLabel: 'Отмена',
    triggerOpen: open,
    onOpenChange,
    onSubmit: onConfirm,
    destructive: true,
    dialogName: 'Delete Test Suite Dialog (Detail)',
    submitButtonName: 'Delete Test Suite Dialog (Detail) - Delete',
    cancelButtonName: 'Delete Test Suite Dialog (Detail) - Cancel',
  };

  return <BaseConfirmDialog {...config} />;
}
