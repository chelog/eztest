'use client';

import * as React from 'react';
import Link from 'next/link';
import { Avatar } from '@/frontend/reusable-elements/avatars/Avatar';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { Mail, Calendar, Briefcase, Pencil, Trash2, Eye } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { ROLE_LABELS, getRoleTextColor } from '@/lib/role-labels';
import { getAvatarColor } from '@/lib/avatar-color';


export interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: {
      name: string;
    };
    createdAt: string;
    _count?: {
      createdProjects?: number;
    };
  };
  onEdit?: () => void;
  onDelete?: () => void;
  viewHref?: string;
  showProjects?: boolean;
  /** @deprecated role is shown as a neutral label with a colored dot */
  getRoleBadgeColor?: (roleName: string) => string;
  /** @deprecated role is shown as a neutral label with a colored dot */
  getRoleIcon?: (roleName: string) => React.ReactNode;
}

/**
 * Reusable UserCard component for displaying user information in a consistent card format
 * Used in: UserManagement, ProjectMembers, and similar pages
 * 
 * @example
 * ```tsx
 * <UserCard
 *   user={user}
 *   onEdit={() => handleEdit(user)}
 *   onDelete={() => handleDelete(user)}
 *   viewHref={`/admin/users/${user.id}`}
 *   showProjects={true}
 * />
 * ```
 */
export function UserCard({
  user,
  onEdit,
  onDelete,
  viewHref,
  showProjects = true,
}: UserCardProps) {
  const roleLabel = ROLE_LABELS[user.role.name] ?? user.role.name;
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const iconButton =
    'h-9 w-9 rounded-[10px] text-white/40 hover:bg-white/[0.07] transition-colors';

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-[12px] bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
      <Avatar className="w-10 h-10 shrink-0">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-semibold text-sm"
            style={{ backgroundColor: getAvatarColor(user.email || user.name) }}
          >
            {initials}
          </div>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-semibold text-white truncate">{user.name}</span>
          <span className={`text-xs font-semibold whitespace-nowrap ${getRoleTextColor(user.role.name)}`}>{roleLabel}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-white/45">
          <span className="flex items-center gap-1.5 truncate">
            <Mail className="w-3 h-3" />
            {user.email}
          </span>
          {showProjects && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3 h-3" />
              Проектов: {user._count?.createdProjects || 0}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            С {formatDate(user.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {viewHref && (
          <Button asChild variant="ghost" size="icon" className={`${iconButton} hover:text-white`} title="Открыть">
            <Link href={viewHref}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
        )}
        {onEdit && (
          <Button variant="ghost" size="icon" onClick={onEdit} className={`${iconButton} hover:text-white`} title="Редактировать">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" onClick={onDelete} className={`${iconButton} hover:text-red-400`} title="Удалить">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default UserCard;

