'use client';

import { ButtonDestructive } from '@/frontend/reusable-elements/buttons/ButtonDestructive';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { Trash2 } from 'lucide-react';
import { Project } from '../types';

interface DangerZoneCardProps {
  project: Project;
  deleting: boolean;
  onDelete: () => void;
}

export function DangerZoneCard({ project, deleting, onDelete }: DangerZoneCardProps) {
  return (
    <DetailCard
      title="Опасная зона"
      description="Необратимые действия"
      contentClassName=""
    >
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-red-300">Удалить проект</h4>
            <p className="mt-1 text-sm text-white/50">
              Проект и все его данные будут удалены безвозвратно.
            </p>
          </div>
          <ButtonDestructive
            onClick={onDelete}
            disabled={deleting}
            buttonName={`Project Settings - Delete Project (${project.name})`}
            className="w-full"
          >
            <Trash2 className="w-4 h-4" />
            Удалить проект
          </ButtonDestructive>
        </div>
    </DetailCard>
  );
}
