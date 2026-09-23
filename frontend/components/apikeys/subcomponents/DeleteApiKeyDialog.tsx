'use client';

import { BaseConfirmDialog, BaseConfirmDialogConfig } from '@/frontend/reusable-components/dialogs/BaseConfirmDialog';
import { ApiKey } from '../ApiKeysManagement';

interface DeleteApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: ApiKey;
  onApiKeyDeleted: (apiKeyId: string) => void;
}

export function DeleteApiKeyDialog({
  open,
  onOpenChange,
  apiKey,
  onApiKeyDeleted,
}: DeleteApiKeyDialogProps) {
  const handleDelete = async () => {
    const response = await fetch(`/api/apikeys/${apiKey.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to delete API key');
    }

    onApiKeyDeleted(apiKey.id);
  };

  const config: BaseConfirmDialogConfig = {
    title: 'Удалить API-ключ',
    description: `Удалить API-ключ «${apiKey.name}»? Действие нельзя отменить: всё, что использует этот ключ, сразу перестанет работать.`,
    submitLabel: 'Удалить API-ключ',
    cancelLabel: 'Отмена',
    triggerOpen: open,
    onOpenChange,
    onSubmit: handleDelete,
    onSuccess: () => {
      // Dialog will close automatically after successful deletion
    },
    destructive: true,
    dialogName: 'Delete API Key Dialog',
    submitButtonName: 'Delete API Key Dialog - Delete',
    cancelButtonName: 'Delete API Key Dialog - Cancel',
  };

  return <BaseConfirmDialog {...config} />;
}

