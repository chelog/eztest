'use client';

import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { TestRun } from '../types';

interface DuplicateTestRunDialogProps {
  projectId: string;
  testRun: TestRun | null;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTestRunDuplicated: (testRun: TestRun) => void;
}

export type { DuplicateTestRunDialogProps };

export function DuplicateTestRunDialog({
  projectId,
  testRun,
  triggerOpen,
  onOpenChange,
  onTestRunDuplicated,
}: DuplicateTestRunDialogProps) {
  const fields: BaseDialogField[] = [
    {
      name: 'name',
      label: 'Название нового тест-рана',
      placeholder: 'Например: Login Feature - Build #124',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 255,
      defaultValue: testRun ? `${testRun.name} (копия)` : '',
      cols: 2,
    },
  ];

  const handleSubmit = async (formData: Record<string, string>) => {
    if (!testRun) {
      throw new Error('Тест-ран не выбран');
    }

    const response = await fetch(`/api/projects/${projectId}/testruns/${testRun.id}/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: formData.name.trim() }),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 404 ? 'Тест-ран не найден' : 'Не удалось дублировать тест-ран'
      );
    }

    const data = await response.json();
    return data.data;
  };

  const config: BaseDialogConfig<TestRun> = {
    title: 'Дублировать тест-ран',
    description: 'Будет создан новый тест-ран с теми же тест-кейсами. Результаты и статусы не переносятся.',
    fields,
    submitLabel: 'Дублировать',
    cancelLabel: 'Отмена',
    triggerOpen,
    onOpenChange,
    onSubmit: handleSubmit,
    onSuccess: (newTestRun) => {
      if (newTestRun) {
        onTestRunDuplicated(newTestRun);
      }
    },
    disablePersistence: true,
    resetFieldsOnOpen: ['name'],
    submitButtonName: 'Диалог дублирования тест-рана - Дублировать',
    cancelButtonName: 'Диалог дублирования тест-рана - Отмена',
  };

  return <BaseDialog {...config} />;
}
