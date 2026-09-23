"use client";

import { Button } from "@/frontend/reusable-elements/buttons/Button";
import { ButtonPrimary } from "@/frontend/reusable-elements/buttons/ButtonPrimary";
import { DetailCard } from "@/frontend/reusable-components/cards/DetailCard";
import { Input } from "@/frontend/reusable-elements/inputs/Input";
import { Label } from "@/frontend/reusable-elements/labels/Label";
import { Textarea } from "@/frontend/reusable-elements/textareas/Textarea";
import { Save } from "lucide-react";
import { Project, ProjectFormData } from "../types";

interface GeneralSettingsCardProps {
  project: Project;
  formData: ProjectFormData;
  saving: boolean;
  onFormChange: (data: ProjectFormData) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  canUpdate?: boolean;
}

export function GeneralSettingsCard({
  project,
  formData,
  saving,
  onFormChange,
  onSave,
  onCancel,
  canUpdate = true,
}: GeneralSettingsCardProps) {
  return (
    <DetailCard
      title="Основное"
      description="Название и описание проекта"
      contentClassName="space-y-4"
    >
      <form onSubmit={onSave} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="block text-sm font-medium text-muted-foreground"
          >
            Название проекта *
          </Label>
          <Input
            id="name"
            variant="glass"
            value={formData.name}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
            ) => onFormChange({ ...formData, name: e.target.value })}
            disabled={!canUpdate}
            required
            minLength={3}
            maxLength={255}
            placeholder="Название проекта"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="key"
            className="block text-sm font-medium text-muted-foreground"
          >
            Ключ проекта
          </Label>
          <Input id="key" variant="glass" value={project.key} disabled />
          <p className="text-xs text-muted-foreground">
            Ключ проекта нельзя изменить после создания
          </p>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="block text-sm font-medium text-muted-foreground"
          >
            Описание
          </Label>
          <Textarea
            id="description"
            variant="glass"
            value={formData.description}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
            ) => onFormChange({ ...formData, description: e.target.value })}
            disabled={!canUpdate}
            rows={4}
            placeholder="Коротко о проекте"
          />
        </div>

        {canUpdate && (
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="glass" onClick={onCancel}>
              Отмена
            </Button>
            <ButtonPrimary type="submit" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Сохранение..." : "Сохранить"}
            </ButtonPrimary>
          </div>
        )}
      </form>
    </DetailCard>
  );
}
