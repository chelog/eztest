'use client';

import { BaseConfirmDialog, BaseConfirmDialogConfig } from '@/frontend/reusable-components/dialogs/BaseConfirmDialog';
import { TestCase } from '../types';

interface DeleteTestCaseDialogProps {
  testCase: TestCase | null;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export type { DeleteTestCaseDialogProps };

export function DeleteTestCaseDialog({
  testCase,
  triggerOpen,
  onOpenChange,
  onConfirm,
}: DeleteTestCaseDialogProps) {
  const config: BaseConfirmDialogConfig = {
    title: 'Удалить тест-кейс',
    description: `Удалить «${testCase?.title}»? Действие нельзя отменить.`,
    submitLabel: 'Удалить',
    cancelLabel: 'Отмена',
    triggerOpen,
    onOpenChange,
    onSubmit: onConfirm,
    destructive: true,
    dialogName: 'Delete Test Case Dialog',
    submitButtonName: 'Delete Test Case Dialog - Delete',
    cancelButtonName: 'Delete Test Case Dialog - Cancel',
  };

  return <BaseConfirmDialog {...config} />;
}
