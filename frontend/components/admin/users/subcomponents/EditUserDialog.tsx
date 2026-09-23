'use client';

import { useEffect, useState } from 'react';
import { BaseDialog, type BaseDialogField } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { Role, User, EditUserFormData } from '../types';
import { getRoleLabel } from '@/lib/role-labels';

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  roles: Role[];
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: EditUserFormData) => Promise<void>;
}

export function EditUserDialog({ open, user, roles, onOpenChange, onUpdate }: EditUserDialogProps) {
  const [key, setKey] = useState(0);

  // Reset the dialog when user changes or dialog opens
  useEffect(() => {
    if (open && user) {
      setKey((prev) => prev + 1);
    }
  }, [open, user?.id]);

  const fields: BaseDialogField[] = [
    {
      name: 'name',
      label: 'Полное имя',
      type: 'text',
      required: true,
      defaultValue: user?.name || '',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      defaultValue: user?.email || '',
    },
    {
      name: 'roleId',
      label: 'Роль в приложении',
      type: 'select',
      required: true,
      defaultValue: user?.role.id || '',
      options: roles.map((role) => ({
        value: role.id,
        label: getRoleLabel(role.name),
      })),
    },
  ];

  const handleSubmit = async (formData: Record<string, string>) => {
    if (!user) return;

    // Only include fields that have actually changed
    const userData: Partial<EditUserFormData> = {};
    
    if (formData.name && formData.name !== user.name) {
      userData.name = formData.name;
    }
    if (formData.email && formData.email !== user.email) {
      userData.email = formData.email;
    }
    // For roleId, ensure we have a value and it's different from current role
    if (formData.roleId && formData.roleId !== user.role.id) {
      userData.roleId = formData.roleId;
    }
    
    await onUpdate(userData as EditUserFormData);
  };

  return (
    <BaseDialog
      key={key}
      title="Редактировать пользователя"
      description="Обновление данных пользователя и его роли"
      fields={fields}
      submitLabel="Сохранить изменения"
      cancelLabel="Отмена"
      triggerOpen={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      disablePersistence={true}
    />
  );
}
