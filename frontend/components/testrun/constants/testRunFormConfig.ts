import { FormFieldConfig } from '../../testcase/subcomponents/TestCaseFormField';

export const ENVIRONMENT_OPTIONS = [
  { label: 'Продакшн', value: 'Production' },
  { label: 'Стейджинг', value: 'Staging' },
  { label: 'QA', value: 'QA' },
  { label: 'Разработка', value: 'Development' },
];

export const STATUS_OPTIONS = [
  { label: 'Запланирован', value: 'PLANNED' },
  { label: 'В работе', value: 'IN_PROGRESS' },
  { label: 'Завершён', value: 'COMPLETED' },
  { label: 'Отменён', value: 'CANCELLED' },
];

/**
 * Get all available test run form fields
 */
export function getTestRunFormFields(): FormFieldConfig[] {
  return [
    {
      name: 'name',
      label: 'Название',
      type: 'text',
      required: true,
      placeholder: 'Введите название тест-рана',
      maxLength: 50,
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      required: false,
      placeholder: 'Введите описание тест-рана',
      maxLength: 250,
    },
    {
      name: 'environment',
      label: 'Окружение',
      type: 'select',
      required: false,
      options: ENVIRONMENT_OPTIONS,
      placeholder: 'Выберите окружение',
    },
  ];
}

/**
 * Get form fields for creating a new test run
 */
export function getCreateTestRunFormFields(): FormFieldConfig[] {
  return getTestRunFormFields();
}

/**
 * Get form fields for editing an existing test run
 */
export function getEditTestRunFormFields(): FormFieldConfig[] {
  return getTestRunFormFields();
}
