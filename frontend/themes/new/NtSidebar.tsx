'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ENTITY_ICONS } from '@/lib/entity-icons';
import { clearAllPersistedForms } from '@/hooks/useFormPersistence';
import { UiThemePicker } from '@/frontend/reusable-components/layout/UiThemePicker';
import { AccentPicker } from './AccentPicker';
import type { SidebarItem } from '@/frontend/reusable-components/layout/Sidebar';
import { setActiveProjectId } from '@/lib/active-project';
import { getProjectBrand } from '@/lib/project-brand';
import { ProjectBrandIcon } from '@/frontend/reusable-components/project/ProjectBrandIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/frontend/reusable-elements/dropdowns/DropdownMenu';

interface ProjectOption {
  id: string;
  name: string;
  key: string;
}

/** Sidebar project switcher: picks the project pinned in the sidebar (persisted per user). */
function ProjectSwitcher({ projectId, projectName }: { projectId?: string; projectName: string | null }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = React.useState<ProjectOption[] | null>(null);

  const loadProjects = () => {
    if (projects) return;
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setProjects(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setProjects([]));
  };

  // The trigger shows the current project's brand mark, so the list is needed right away
  React.useEffect(() => {
    if (projectId) loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
  const currentKey = projects?.find((p) => p.id === projectId)?.key;

  const choose = (project: ProjectOption) => {
    setActiveProjectId(session?.user?.email, project.id);
    router.push(`/projects/${project.id}`);
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && loadProjects()}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-2.5 px-3 h-10 rounded-[12px] border border-[var(--nt-border)] hover:bg-[var(--nt-surface-2)] transition-colors cursor-pointer text-left"
          title="Сменить проект"
        >
          {getProjectBrand(currentKey) ? (
            <ProjectBrandIcon projectKey={currentKey} size="sm" />
          ) : (
            <span className={cn('w-2 h-2 rounded-full shrink-0', projectId ? 'bg-[var(--nt-accent)]' : 'bg-white/25')} />
          )}
          <span className={cn('flex-1 text-sm font-semibold truncate', projectId ? 'text-white' : 'text-[var(--nt-text-3)]')}>
            {projectId ? projectName ?? '…' : 'Выбрать проект'}
          </span>
          <ChevronsUpDown className="w-4 h-4 shrink-0 text-[var(--nt-text-3)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[13.5rem]">
        <DropdownMenuLabel className="text-xs text-white/45">Проекты</DropdownMenuLabel>
        {projects === null ? (
          <div className="px-2 py-2 text-sm text-white/45">Загрузка…</div>
        ) : projects.length === 0 ? (
          <div className="px-2 py-2 text-sm text-white/45">Проектов нет</div>
        ) : (
          projects.map((project) => (
            <DropdownMenuItem key={project.id} onSelect={() => choose(project)} className="gap-2 cursor-pointer">
              {getProjectBrand(project.key) ? (
                <span className="w-10 shrink-0">
                  <ProjectBrandIcon projectKey={project.key} size="sm" />
                </span>
              ) : (
                <span className="text-[11px] font-bold text-white/40 w-10 shrink-0 truncate">{project.key}</span>
              )}
              <span className="flex-1 truncate">{project.name}</span>
              {project.id === projectId && <Check className="w-4 h-4 text-[var(--nt-accent)]" />}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { ROLE_LABELS } from '@/lib/role-labels';
import { getAvatarColor } from '@/lib/avatar-color';

const iconByLabel: Record<string, React.ComponentType<{ className?: string }>> = {
  'Проекты': ENTITY_ICONS.project,
  'Обзор': LayoutDashboard,
  'Статистика': ENTITY_ICONS.statistics,
  'Тест-сьюты': ENTITY_ICONS.testSuite,
  'Тест-кейсы': ENTITY_ICONS.testCase,
  'Тест-раны': ENTITY_ICONS.testRun,
  'Дефекты': ENTITY_ICONS.defect,
  'Участники': ENTITY_ICONS.members,
  'Настройки': ENTITY_ICONS.settings,
  'Админка': ENTITY_ICONS.admin,
};


export interface NtSidebarProps {
  items: SidebarItem[];
  projectId?: string;
  projectName: string | null;
  isCollapsed: boolean;
  expandedItems: Set<string>;
  onToggleExpanded: (label: string) => void;
  onToggleSidebar: () => void;
}

/** Sidebar of the new theme: flat panel, menu search, profile + theme picker at the bottom. */
export function NtSidebar({
  items,
  projectId,
  projectName,
  isCollapsed,
  expandedItems,
  onToggleExpanded,
  onToggleSidebar,
}: NtSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [query, setQuery] = React.useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const visibleItems = React.useMemo(() => {
    if (!normalizedQuery) return items;
    return items
      .map((item) => {
        const selfMatch = item.label.toLowerCase().includes(normalizedQuery);
        const children = item.children?.filter((child) => child.label.toLowerCase().includes(normalizedQuery));
        if (selfMatch) return item;
        if (children && children.length > 0) return { ...item, children };
        return null;
      })
      .filter(Boolean) as SidebarItem[];
  }, [items, normalizedQuery]);

  const isActiveHref = (href?: string) => {
    if (!href || href === '#') return false;
    return pathname === href || (href !== '/projects' && pathname?.startsWith(`${href}/`));
  };

  const renderItem = (item: SidebarItem, level = 0) => {
    const Icon = iconByLabel[item.label];
    const hasChildren = item.children !== undefined && item.children !== null;
    // Search results show matching children expanded
    const isExpanded = expandedItems.has(item.label) || (!!normalizedQuery && hasChildren);
    const active = level === 0 ? isActiveHref(item.href) : pathname === item.href;

    if (isCollapsed && level === 0) {
      return (
        <Link
          key={`${item.label}-${item.href}`}
          href={item.href || '#'}
          title={item.label}
          className={cn(
            'flex items-center justify-center h-10 rounded-[12px] transition-colors',
            active ? 'bg-[var(--nt-surface-3)] text-white' : 'text-[var(--nt-text-3)] hover:text-white hover:bg-[var(--nt-surface-2)]'
          )}
        >
          {Icon ? <Icon className="w-[18px] h-[18px]" /> : <span className="text-sm font-bold">{item.label[0]}</span>}
        </Link>
      );
    }

    const rowClass = cn(
      'flex items-center gap-3 rounded-[12px] transition-colors min-w-0',
      level === 0 ? 'h-10 px-3 text-[15px]' : 'h-8 pl-10 pr-3 text-[14px]',
      active
        ? 'bg-[var(--nt-surface-3)] text-white font-semibold'
        : 'text-[var(--nt-text-2)] hover:text-white hover:bg-[var(--nt-surface-2)]'
    );

    const content = (
      <>
        {level === 0 &&
          (Icon ? (
            <Icon className={cn('w-[18px] h-[18px] shrink-0', active ? 'text-white' : 'text-[var(--nt-text-3)]')} />
          ) : (
            <span className="w-[18px] shrink-0" />
          ))}
        <span className="truncate flex-1">{item.label}</span>
        {item.count !== undefined && (
          <span className="text-xs text-[var(--nt-text-3)] tabular-nums">{item.count}</span>
        )}
      </>
    );

    return (
      <div key={`${level}-${item.label}-${item.href}`}>
        <div className="flex items-center gap-1">
          {item.href && item.href !== '#' ? (
            <Link href={item.href} className={cn(rowClass, 'flex-1')}>
              {content}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => hasChildren && onToggleExpanded(item.label)}
              className={cn(rowClass, 'flex-1 text-left cursor-pointer')}
            >
              {content}
            </button>
          )}
          {hasChildren && (
            <button
              type="button"
              onClick={() => onToggleExpanded(item.label)}
              className="h-10 w-8 flex items-center justify-center rounded-[10px] text-[var(--nt-text-3)] hover:text-white hover:bg-[var(--nt-surface-2)] cursor-pointer"
              title="Открыть/закрыть список"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-0.5 mb-1 space-y-0.5">
            {item.children && item.children.length > 0 ? (
              item.children.map((child) => renderItem(child, level + 1))
            ) : (
              <div className="pl-10 pr-3 py-1.5 text-sm text-[var(--nt-text-3)]">Нет элементов</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleSignOut = () => {
    clearAllPersistedForms();
    sessionStorage.removeItem('lastProjectId');
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('defects-filters-')) sessionStorage.removeItem(key);
    });
    signOut({ callbackUrl: '/auth/login', redirect: true });
  };

  const userName = session?.user?.name || session?.user?.email || 'Пользователь';
  const roleLabel = ROLE_LABELS[session?.user?.roleName ?? ''] ?? session?.user?.roleName ?? '';

  return (
    <aside
      data-ui="nt-sidebar"
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[var(--nt-surface-1)] border-r border-[var(--nt-border)] transition-[width] duration-300',
        isCollapsed ? 'w-[4.5rem]' : 'w-[15rem]'
      )}
    >
      {/* Brand */}
      <div className={cn('flex items-center gap-2 pt-5 pb-4', isCollapsed ? 'px-3 flex-col' : 'px-4')}>
        <Link href="/projects" className="flex items-center gap-2.5 min-w-0 flex-1">
          <FlaskConical className="w-6 h-6 shrink-0 text-[var(--nt-brand)]" strokeWidth={2} />
          {!isCollapsed && <span className="text-lg font-bold text-white truncate">EZTest</span>}
        </Link>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-[10px] text-[var(--nt-text-3)] hover:text-white hover:bg-[var(--nt-surface-3)] cursor-pointer"
          title={isCollapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Menu search */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <label className="flex items-center gap-2 h-10 px-3 rounded-[12px] bg-[var(--nt-surface-2)] text-[var(--nt-text-3)] focus-within:text-white">
            <Search className="w-4 h-4 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по меню..."
              className="nt-bare-input flex-1 min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-[var(--nt-text-3)]"
            />
          </label>
        </div>
      )}

      {/* Pinned project (switcher) */}
      {!isCollapsed && (
        <div className="px-3 pb-2">
          <ProjectSwitcher projectId={projectId} projectName={projectName} />
        </div>
      )}

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto pb-3 space-y-0.5', isCollapsed ? 'px-2.5' : 'px-3')}>
        {!isCollapsed && (
          <div className="px-3 pt-2 pb-1.5 text-[12px] font-bold uppercase tracking-wider text-[var(--nt-text-3)]">
            {projectId ? 'Проект' : 'Навигация'}
          </div>
        )}
        {visibleItems.map((item) => renderItem(item))}
        {visibleItems.length === 0 && (
          <div className="px-3 py-2 text-sm text-[var(--nt-text-3)]">Ничего не найдено</div>
        )}
      </nav>

      {/* Bottom: theme + profile */}
      <div className={cn('border-t border-[var(--nt-border)] pt-3 pb-4 space-y-3', isCollapsed ? 'px-2.5 flex flex-col items-center' : 'px-3')}>
        {!isCollapsed && <AccentPicker />}
        <UiThemePicker compact={isCollapsed} />
        {isCollapsed ? (
          <Link
            href="/settings/profile"
            title="Аккаунт"
            className="w-10 h-10 flex items-center justify-center rounded-[12px] text-[var(--nt-text-3)] hover:text-white hover:bg-[var(--nt-surface-2)]"
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/settings/profile"
              className="flex-1 min-w-0 flex items-center gap-2.5 px-2 py-1.5 rounded-[12px] hover:bg-[var(--nt-surface-2)] transition-colors"
              title="Настройки аккаунта"
            >
              <span
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: getAvatarColor(session?.user?.email || userName) }}
              >
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white truncate">{userName}</span>
                <span className="block text-xs text-[var(--nt-text-3)] truncate">{roleLabel}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-[10px] text-[var(--nt-text-3)] hover:text-white hover:bg-[var(--nt-surface-3)] cursor-pointer"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
