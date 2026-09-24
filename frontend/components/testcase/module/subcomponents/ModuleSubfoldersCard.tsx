'use client';

import Link from 'next/link';
import { ChevronRight, Folder, FolderPlus } from 'lucide-react';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { ButtonSecondary } from '@/frontend/reusable-elements/buttons/ButtonSecondary';

export interface SubfolderItem {
  id: string;
  name: string;
  _count?: { testCases?: number; children?: number };
}

interface ModuleSubfoldersCardProps {
  projectId: string;
  subfolders: SubfolderItem[];
  canCreate: boolean;
  onCreateClick: () => void;
}

/** Subfolders of a folder: each opens its own folder page. */
export function ModuleSubfoldersCard({ projectId, subfolders, canCreate, onCreateClick }: ModuleSubfoldersCardProps) {
  const headerAction = canCreate ? (
    <ButtonSecondary size="sm" onClick={onCreateClick}>
      <FolderPlus className="w-4 h-4 mr-1.5" />
      Новая подпапка
    </ButtonSecondary>
  ) : undefined;

  return (
    <DetailCard title={`Подпапки (${subfolders.length})`} headerAction={headerAction} contentClassName="p-2">
      {subfolders.length === 0 ? (
        <p className="px-3 py-3 text-sm text-white/40">Подпапок нет</p>
      ) : (
        <div className="space-y-0.5">
          {subfolders.map((folder) => (
            <Link
              key={folder.id}
              href={`/projects/${projectId}/modules/${folder.id}`}
              className="group flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
            >
              <Folder className="h-4 w-4 shrink-0 text-white/45" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{folder.name}</span>
              {!!folder._count?.children && (
                <span className="shrink-0 text-xs text-white/40">подпапок: {folder._count.children}</span>
              )}
              <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-xs tabular-nums text-white/50">
                {folder._count?.testCases ?? 0}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-white/60" />
            </Link>
          ))}
        </div>
      )}
    </DetailCard>
  );
}
