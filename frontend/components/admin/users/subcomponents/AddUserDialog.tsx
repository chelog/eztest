'use client';

import { BaseDialog, type BaseDialogField } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { Role, UserFormData } from '../types';
import { getRoleLabel } from '@/lib/role-labels';

interface AddUserDialogProps {
  open: boolean;
  roles: Role[];
  onOpenChange: (open: boolean) => void;
  onAdd: (data: UserFormData) => Promise<void>;
}

export function AddUserDialog({ open, roles, onOpenChange, onAdd }: AddUserDialogProps) {
  // Find TESTER role or default to first role
  const testerRole = roles.find((role) => role.name === 'TESTER');
  const defaultRoleId = testerRole ? testerRole.id : (roles.length > 0 ? roles[0].id : '');

  const fields: BaseDialogField[] = [
    {
      name: 'name',
      label: 'Имя',
      placeholder: 'John Doe',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      placeholder: 'john@example.com',
      type: 'email',
      required: true,
    },
    {
      name: 'password',
      label: 'Пароль',
      placeholder: '••••••••',
      type: 'password',
      required: true,
    },
    {
      name: 'roleId',
      label: 'Роль пользователя',
      type: 'select',
      required: true,
      defaultValue: defaultRoleId,
      options: roles.map((role) => ({
        value: role.id,
        label: getRoleLabel(role.name),
      })),
    },
  ];

  const handleSubmit = async (formData: Record<string, string>) => {
    const userData: UserFormData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      roleId: formData.roleId,
    };
    await onAdd(userData);
  };

  return (
    <BaseDialog
      title="Добавить пользователя"
      description="Создание новой учетной записи с ролью на уровне приложения"
      fields={fields}
      submitLabel="Добавить пользователя"
      cancelLabel="Отмена"
      triggerOpen={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
    />
  );
}
