'use client';

import { formatDateTime } from '@/lib/date-utils';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { Label } from '@/frontend/reusable-elements/labels/Label';
import { Project } from '../types';

interface ProjectInfoCardProps {
  project: Project;
}

export function ProjectInfoCard({ project }: ProjectInfoCardProps) {
  return (
    <DetailCard
      title="О проекте"
      description="Данные проекта (только чтение)"
      contentClassName="space-y-3"
    >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white/60 text-xs">Создан</Label>
            <p className="text-sm font-medium text-white">
              {formatDateTime(project.createdAt)}
            </p>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Обновлён</Label>
            <p className="text-sm font-medium text-white">
              {formatDateTime(project.updatedAt)}
            </p>
          </div>
          <div>
            <Label className="text-white/60 text-xs">ID проекта</Label>
            <p className="text-sm font-mono text-white/80 break-all">{project.id}</p>
          </div>
        </div>
    </DetailCard>
  );
}
