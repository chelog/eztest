'use client';

import {
  BaseConfirmDialog,
  BaseConfirmDialogConfig,
} from '@/frontend/reusable-components/dialogs/BaseConfirmDialog';
import { Defect } from '../types';

interface DeleteDefectDialogProps {
  open: boolean;
  defect: Defect | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteDefectDialog({
  open,
  defect,
  onOpenChange,
  onConfirm,
}: DeleteDefectDialogProps) {
  if (!defect) return null;

  const config: BaseConfirmDialogConfig = {
    title: 'Удалить дефект',
    description: `Удалить дефект «${defect.defectId}: ${defect.title}»? Действие нельзя отменить.`,
    submitLabel: 'Удалить',
    cancelLabel: 'Отмена',
    triggerOpen: open,
    onOpenChange,
    onSubmit: onConfirm,
    destructive: true,
    dialogName: 'Delete Defect Dialog',
    submitButtonName: 'Delete Defect Dialog - Delete',
    cancelButtonName: 'Delete Defect Dialog - Cancel',
  };

  return <BaseConfirmDialog {...config} />;
}
