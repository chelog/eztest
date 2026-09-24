'use client';

import type { FormFieldConfig } from '../subcomponents/TestCaseFormField';
import { Module } from '../types';
import { moduleSelectOptions } from '@/lib/module-tree';

export const PRIORITY_OPTIONS = [
  { label: 'Критический', value: 'CRITICAL' },
  { label: 'Высокий', value: 'HIGH' },
  { label: 'Средний', value: 'MEDIUM' },
  { label: 'Низкий', value: 'LOW' },
];

export const STATUS_OPTIONS = [
  { label: 'Активен', value: 'ACTIVE' },
  { label: 'Черновик', value: 'DRAFT' },
  { label: 'Устарел', value: 'DEPRECATED' },
];

export function getTestCaseFormFields(modules: Module[] = []): FormFieldConfig[] {
  // Nested folders are shown with their full path
  const moduleOptions = moduleSelectOptions(modules);

  return [
    {
      name: 'title',
      label: 'Название',
      type: 'text',
      placeholder: 'Введите название тест-кейса',
      required: true,
      maxLength: 200,
    },
    {
      name: 'priority',
      label: 'Приоритет',
      type: 'select',
      options: PRIORITY_OPTIONS,
    },
    {
      name: 'moduleId',
      label: 'Модуль',
      type: 'select',
      placeholder: 'Выберите модуль',
      options: [
        { label: 'Без модуля', value: 'none' },
        ...moduleOptions,
      ],
    },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      options: STATUS_OPTIONS,
    },
    {
      name: 'estimatedTime',
      label: 'Оценка времени (мин)',
      type: 'number',
      placeholder: 'Введите оценку времени',
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      placeholder: 'Введите описание тест-кейса',
      rows: 3,
      maxLength: 5000,
    },
    {
      name: 'preconditions',
      label: 'Предусловия',
      type: 'textarea',
      placeholder: 'Введите предусловия',
      rows: 2,
      maxLength: 5000,
    },
    {
      name: 'postconditions',
      label: 'Постусловия',
      type: 'textarea',
      placeholder: 'Введите постусловия',
      rows: 2,
      maxLength: 5000,
    },
    {
      name: 'expectedResult',
      label: 'Ожидаемый результат',
      type: 'textarea',
      placeholder: 'Введите ожидаемый результат',
      rows: 3,
      maxLength: 5000,
    },
  ];
}

export function getCreateTestCaseFormFields(
  modules: Module[] = []
): FormFieldConfig[] {
  return getTestCaseFormFields(modules);
}

export function getEditTestCaseFormFields(
  modules: Module[] = []
): FormFieldConfig[] {
  // Same as create, but could be extended for edit-specific fields
  return getTestCaseFormFields(modules);
}
