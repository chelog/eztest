'use client';

import type { FormFieldConfig } from '../../testcase/subcomponents/TestCaseFormField';
import { TestSuite } from '../types';

export function getTestSuiteFormFields(parentSuites: TestSuite[] = []): FormFieldConfig[] {
  const parentOptions = parentSuites
    .filter(s => !s.parentId) // Only root level suites can be parents
    .map((suite) => ({
      label: suite.name,
      value: suite.id,
    }));

  return [
    {
      name: 'name',
      label: 'Название сьюта',
      type: 'text',
      placeholder: 'Введите название тест-сьюта',
      required: true,
      maxLength: 50,
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      placeholder: 'Введите описание сьюта',
      rows: 3,
      maxLength: 250,
    },
    {
      name: 'parentId',
      label: 'Родительский сьют',
      type: 'select',
      placeholder: 'Выберите родительский сьют',
      options: [
        { label: 'Нет (корневой уровень)', value: 'none' },
        ...parentOptions,
      ],
    },
  ];
}

export function getCreateTestSuiteFormFields(
  parentSuites: TestSuite[] = []
): FormFieldConfig[] {
  return getTestSuiteFormFields(parentSuites);
}

export function getEditTestSuiteFormFields(
  parentSuites: TestSuite[] = []
): FormFieldConfig[] {
  return getTestSuiteFormFields(parentSuites);
}
