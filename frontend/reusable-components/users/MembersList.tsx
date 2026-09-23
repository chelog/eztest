'use client';

import * as React from 'react';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { UserCard } from '@/frontend/reusable-components/cards/UserCard';
import { EmptyStateCard } from '@/frontend/reusable-components/cards/EmptyStateCard';
import { getRoleBadgeColor, getRoleIcon } from './RoleBadgeUtils';
import { Users, LucideIcon } from 'lucide-react';

export interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: {
      name: string;
    } | string; // Support both object and string for role
  };
  createdAt: string;
}

export interface MembersListProps {
  members: Member[];
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  onDelete?: (memberId: string, memberName: string) => void;
  onEdit?: (memberId: string) => void;
  viewHref?: (memberId: string) => string;
  showProjects?: boolean;
  getRoleBadgeColor?: (roleName: string) => string;
  getRoleIcon?: (roleName: string) => React.ReactNode;
  className?: string;
}

/**
 * Reusable component for displaying a list of members/users
 * Used in: Project Members, User Management, and similar pages
 * 
 * @example
 * ```tsx
 * <MembersList
 *   members={members}
 *   title="Участники проекта"
 *   description="Люди с доступом к проекту"
 *   onDelete={(id, name) => handleRemove(id, name)}
 *   emptyTitle="No members yet"
 *   emptyDescription="Добавьте участников для совместной работы"
 * />
 * ```
 */
export function MembersList({
  members,
  title,
  description,
  emptyTitle = 'No members yet',
  emptyDescription,
  emptyIcon = Users,
  onDelete,
  onEdit,
  viewHref,
  showProjects = false,
  getRoleBadgeColor: customGetRoleBadgeColor,
  getRoleIcon: customGetRoleIcon,
  className,
}: MembersListProps) {
  const badgeColorFn = customGetRoleBadgeColor || getRoleBadgeColor;
  const roleIconFn = customGetRoleIcon || getRoleIcon;

  return (
    <DetailCard
      title={title || 'Members'}
      description={description}
      contentClassName=""
      className={className}
    >
      {members.length === 0 ? (
        <EmptyStateCard
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const role = typeof member.user.role === 'string' 
              ? { name: member.user.role } 
              : member.user.role;
            
            return (
              <UserCard
                key={member.id}
                user={{
                  id: member.user.id,
                  name: member.user.name,
                  email: member.user.email,
                  avatar: member.user.avatar,
                  role,
                  createdAt: member.createdAt,
                }}
                onDelete={onDelete ? () => onDelete(member.id, member.user.name) : undefined}
                onEdit={onEdit ? () => onEdit(member.id) : undefined}
                viewHref={viewHref ? viewHref(member.id) : undefined}
                showProjects={showProjects}
                getRoleBadgeColor={badgeColorFn}
                getRoleIcon={roleIconFn}
              />
            );
          })}
        </div>
      )}
    </DetailCard>
  );
}

