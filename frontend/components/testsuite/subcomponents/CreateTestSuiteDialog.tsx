'use client';

import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { TestSuite } from '../types';

export interface CreateTestSuiteDialogProps {
  projectId: string;
  testSuites: TestSuite[];
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTestSuiteCreated: (suite: TestSuite) => void;
}

function buildPathLabel(suiteId: string, suites: TestSuite[], visited = new Set<string>()): string {
  if (visited.has(suiteId)) return '...';
  visited.add(suiteId);
  const suite = suites.find(s => s.id === suiteId);
  if (!suite) return '';
  if (!suite.parentId) return suite.name;
  return buildPathLabel(suite.parentId, suites, visited) + ' > ' + suite.name;
}

export function CreateTestSuiteDialog({
  projectId,
  testSuites,
  triggerOpen,
  onOpenChange,
  onTestSuiteCreated,
}: CreateTestSuiteDialogProps) {
  const parentOptions = testSuites.map((suite) => ({
    value: suite.id,
    label: buildPathLabel(suite.id, testSuites),
  }));

  const fields: BaseDialogField[] = [
    {
      name: 'name',
      label: 'Название тест-сьюта',
      placeholder: 'Авторизация',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 50,
    },
    {
      name: 'description',
      label: 'Описание',
      placeholder: 'Краткое описание тест-сьюта...',
      type: 'textarea',
      rows: 3,
      maxLength: 250,
    },
    {
      name: 'parentId',
      label: 'Родительский сьют',
      type: 'select',
      placeholder: 'Выберите родительский сьют',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'Нет (корневой уровень)' },
        ...parentOptions,
      ],
    },
  ];

  const handleSubmit = async (formData: Record<string, string>) => {
    const response = await fetch(`/api/projects/${projectId}/testsuites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        description: formData.description || undefined,
        parentId: formData.parentId !== 'none' ? formData.parentId : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to create test suite');
    }

    return data.data;
  };

  const config: BaseDialogConfig<TestSuite> = {
    title: 'Создать тест-сьют',
    description: 'Объединяйте тест-кейсы в сьюты, чтобы тестирование было структурированным.',
    fields,
    submitLabel: 'Создать тест-сьют',
    cancelLabel: 'Отмена',
    triggerOpen,
    onOpenChange,
    onSubmit: handleSubmit,
    onSuccess: (suite) => {
      if (suite) {
        onTestSuiteCreated(suite);
      }
    },
    submitButtonName: 'Create Test Suite Dialog - Create Test Suite',
    cancelButtonName: 'Create Test Suite Dialog - Cancel',
  };

  return <BaseDialog {...config} />;
}
