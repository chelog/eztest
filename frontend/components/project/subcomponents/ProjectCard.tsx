'use client';

import { formatDateTime } from '@/lib/date-utils';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { ItemCard } from '@/frontend/reusable-components/cards/ItemCard';
import { ActionMenu } from '@/frontend/reusable-components/menus/ActionMenu';
import { AvatarStack } from '@/frontend/reusable-components/users/AvatarStack';
import { Folder, Settings, Users, Trash2 } from 'lucide-react';
import { ENTITY_ICONS } from '@/lib/entity-icons';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    key: string;
    description: string | null;
    updatedAt: string;
    members: Array<{
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
      };
    }>;
    _count?: {
      testCases: number;
      testRuns: number;
      testSuites: number;
    };
  };
  onNavigate: (path: string) => void;
  onDelete: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canManageMembers?: boolean;
}

export const ProjectCard = ({ project, onNavigate, onDelete, canUpdate = false, canDelete = false, canManageMembers = false }: ProjectCardProps) => {
  // If user can't perform any actions, show simplified card
  const hasActionPermissions = canUpdate || canDelete || canManageMembers;

  const badges = (
    <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 border-primary/40 bg-primary/10 text-primary">
      {project.key}
    </Badge>
  );

  const header = hasActionPermissions && (
    <ActionMenu
      items={[
        {
          label: 'Открыть проект',
          icon: Folder,
          onClick: () => onNavigate(`/projects/${project.id}`),
        },
        {
          label: 'Настройки',
          icon: Settings,
          onClick: () => onNavigate(`/projects/${project.id}/settings`),
          show: canUpdate,
        },
        {
          label: 'Участники',
          icon: Users,
          onClick: () => onNavigate(`/projects/${project.id}/members`),
          show: canManageMembers,
        },
        {
          label: 'Удалить',
          icon: Trash2,
          onClick: onDelete,
          variant: 'destructive',
          show: canDelete,
          buttonName: `Project Card - Delete (${project.name})`,
        },
      ]}
    />
  );

  const stats = [
    { icon: ENTITY_ICONS.testCase, value: project._count?.testCases || 0, label: 'Тест-кейсы', href: `/projects/${project.id}/testcases` },
    { icon: ENTITY_ICONS.testRun, value: project._count?.testRuns || 0, label: 'Тест-раны', href: `/projects/${project.id}/testruns` },
    { icon: ENTITY_ICONS.testSuite, value: project._count?.testSuites || 0, label: 'Тест-сьюты', href: `/projects/${project.id}/testsuites` },
  ];

  const content = (
    <div className="grid grid-cols-3 gap-1.5 mb-2.5">
      {stats.map((stat) => (
        <button
          key={stat.label}
          type="button"
          onClick={(e) => {
            // The whole card is a link to the project; stat tiles jump straight to the section
            e.preventDefault();
            e.stopPropagation();
            onNavigate(stat.href);
          }}
          className="flex flex-col items-center gap-1 rounded-[12px] py-2.5 hover:bg-white/[0.06] transition-colors cursor-pointer"
          title={`Открыть: ${stat.label}`}
        >
          <stat.icon className="w-4 h-4 text-white/40" strokeWidth={1.75} />
          <span className="text-2xl font-bold text-white tabular-nums leading-none">{stat.value}</span>
          <span className="text-xs text-white/50">{stat.label}</span>
        </button>
      ))}
    </div>
  );

  const footer = (
    <>
      <div className="flex items-center gap-2">
        <AvatarStack
          avatars={project.members.map((member) => ({
            id: member.id,
            name: member.user.name,
            avatar: member.user.avatar,
            email: member.user.email,
          }))}
          maxVisible={3}
          size="md"
          showCount={true}
        />
        <span className="text-xs text-white/60">
          {project.members.length} участник{project.members.length !== 1 ? 'а' : ''}
        </span>
      </div>
      <span className="text-xs text-white/50">
        Обновлен: {formatDateTime(project.updatedAt)}
      </span>
    </>
  );

  return (
    <ItemCard
      title={project.name}
      description={project.description || undefined}
      descriptionClassName="line-clamp-2 break-words text-sm text-white/60 min-h-5"
      badges={badges}
      inlineBadges
      header={header}
      content={content}
      footer={footer}
      href={`/projects/${project.id}`}
      borderColor="primary"
    />
  );
};
