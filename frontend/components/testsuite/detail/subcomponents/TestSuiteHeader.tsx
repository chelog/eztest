import { DetailPageHeader } from '@/frontend/reusable-components/layout/DetailPageHeader';
import { Trash2, Pencil } from 'lucide-react';

interface TestSuiteHeaderProps {
  testSuite: {
    name: string;
    project: {
      id: string;
      name: string;
      key: string;
    };
  };
  isEditing: boolean;
  formData: { name: string };
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onNameChange: (name: string) => void;
  onBack?: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function TestSuiteHeader({
  testSuite,
  isEditing,
  formData,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onNameChange,
  canUpdate = false,
  canDelete = false,
}: TestSuiteHeaderProps) {
  return (
    <DetailPageHeader
      title={testSuite.name}
      subtitle={`${testSuite.project.name} (${testSuite.project.key})`}
      isEditing={isEditing}
      editTitle={formData.name}
      onTitleChange={onNameChange}
      badges={[]}
      actions={[
        { 
          label: 'Редактировать', 
          icon: Pencil, 
          onClick: onEdit, 
          show: canUpdate,
          buttonName: 'Test Suite Detail - Edit',
        },
        { 
          label: 'Удалить', 
          icon: Trash2, 
          onClick: onDelete, 
          variant: 'destructive', 
          show: canDelete,
          buttonName: 'Test Suite Detail - Delete',
        },
      ]}
      editActions={{
        onSave,
        onCancel: onCancelEdit,
      }}
    />
  );
}
