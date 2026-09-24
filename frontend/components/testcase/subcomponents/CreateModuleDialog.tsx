'use client';

import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { Module } from '../types';
import { moduleSelectOptions } from '@/lib/module-tree';

const TOP_LEVEL = '__root__';

export interface CreateModuleDialogProps {
  projectId: string;
  triggerOpen?: boolean;
  onOpenChange: (open: boolean) => void;
  onModuleCreated: (module: Module) => void;
  /** All folders of the project; enables choosing a parent folder */
  modules?: Module[];
  /** Parent preselected when the dialog opens (e.g. "Новая подпапка") */
  defaultParentId?: string | null;
}

export function CreateModuleDialog({
  projectId,
  triggerOpen,
  onOpenChange,
  onModuleCreated,
  modules = [],
  defaultParentId = null,
}: CreateModuleDialogProps) {
  const fields: BaseDialogField[] = [
    ...(modules.length > 0
      ? [
          {
            name: 'parentId',
            label: 'Где создать',
            type: 'select' as const,
            defaultValue: defaultParentId ?? TOP_LEVEL,
            options: [{ value: TOP_LEVEL, label: 'Верхний уровень' }, ...moduleSelectOptions(modules)],
            cols: 2,
          },
        ]
      : []),
    {
      name: 'name',
      label: 'Название папки',
      placeholder: 'Введите название папки',
      type: 'text',
      required: true,
      minLength: 1,
      maxLength: 150,
      cols: 2,
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      placeholder: 'Введите описание папки (необязательно)',
      rows: 3,
      cols: 2,
      maxLength: 250,
    },
  ];

  const handleSubmit = async (data: Record<string, unknown>) => {
    const response = await fetch(`/api/projects/${projectId}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        description: data.description || undefined,
        parentId: data.parentId && data.parentId !== TOP_LEVEL ? data.parentId : null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Не удалось создать папку');
    }

    const result = await response.json();
    return result.data;
  };

  const config: BaseDialogConfig = {
    title: defaultParentId ? 'Новая подпапка' : 'Создать папку',
    description: 'Организуйте тест-кейсы по папкам для удобной структуры и управления.',
    fields,
    submitLabel: 'Создать папку',
    cancelLabel: 'Отмена',
    triggerOpen,
    onOpenChange,
    onSubmit: handleSubmit,
    // The parent depends on where the dialog was opened from
    resetFieldsOnOpen: ['parentId'],
    onSuccess: (module) => {
      if (module && typeof module === 'object') {
        onModuleCreated(module as Module);
      }
    },
    submitButtonName: 'Диалог создания папки - Создать',
    cancelButtonName: 'Диалог создания папки - Отмена',
  };

  return <BaseDialog {...config} />;
}
