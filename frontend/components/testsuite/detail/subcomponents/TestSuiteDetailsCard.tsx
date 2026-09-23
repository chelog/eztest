import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { FormBuilder, FormFieldConfig } from '@/frontend/reusable-components';
import { TestSuiteFormData } from '../types';

interface TestSuiteDetailsCardProps {
  isEditing: boolean;
  description?: string;
  formData: TestSuiteFormData;
  onFormChange: (data: TestSuiteFormData) => void;
  errors?: Record<string, string>;
}

export function TestSuiteDetailsCard({
  isEditing,
  description,
  formData,
  onFormChange,
  errors = {},
}: TestSuiteDetailsCardProps) {
  const fields: FormFieldConfig[] = [
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      placeholder: 'Введите описание',
      rows: 3,
      cols: 1,
    },
  ];

  const handleFieldChange = (field: keyof TestSuiteFormData, value: string | number | null) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <DetailCard title="Подробности" contentClassName="space-y-4">
      {isEditing ? (
        <FormBuilder
          fields={fields}
          formData={formData}
          errors={errors}
          onFieldChange={handleFieldChange}
          variant="glass"
        />
      ) : (
        <>
          {description ? (
            <div>
              <h4 className="text-sm font-medium text-white/60 mb-1">
                Описание
              </h4>
              <p className="text-white/90 whitespace-pre-wrap break-words">
                {description}
              </p>
            </div>
          ) : (
            <p className="text-white/60 text-sm">Без описания</p>
          )}
        </>
      )}
    </DetailCard>
  );
}
