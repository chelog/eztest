'use client';

import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/frontend/reusable-elements/hover-cards/HoverCard';
import { FolderInput, Trash2 } from 'lucide-react';
import { PriorityBadge } from '@/frontend/reusable-components/badges/PriorityBadge';
import { GroupedDataTable, ColumnDef, GroupConfig, ActionConfig } from '@/frontend/reusable-components/tables/GroupedDataTable';
import { TestCase, Module } from '../types';
import { useRouter } from 'next/navigation';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { getDynamicBadgeProps } from '@/lib/badge-color-utils';
import { groupChildren } from '@/lib/module-tree';

interface TestCaseTableProps {
  testCases: TestCase[];
  groupedByModule?: boolean;
  modules?: Module[];
  onDelete?: (testCase: TestCase) => void;
  onClick: (testCaseId: string) => void;
  canDelete?: boolean;
  projectId?: string;
  enableModuleLink?: boolean;
  /** Show folders nested in folders (modules must include the subfolders) */
  nested?: boolean;
  /** Row menu "Переместить в папку…" */
  onMoveRequest?: (testCase: TestCase) => void;
  /** Drag & drop of a test case onto a folder (null = out of folders) */
  onMoveTestCase?: (testCase: TestCase, targetModuleId: string | null) => void;
  /** Drag & drop of a folder onto a folder (null = top level) */
  onMoveFolder?: (moduleId: string, targetParentId: string | null) => void;
  /** Controls on a folder row (e.g. its menu) */
  renderFolderActions?: (moduleId: string) => React.ReactNode;
  /** Checkboxes for bulk actions (ids of selected test cases) */
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

/**
 * Test case table component with module grouping and collapsible sections
 * Uses the reusable GroupedDataTable component internally
 * 
 * @example
 * // Basic usage
 * <TestCaseTable
 *   testCases={testCases}
 *   onClick={(id) => router.push(`/testcases/${id}`)}
 * />
 * 
 * @example
 * // With module grouping and actions
 * <TestCaseTable
 *   testCases={testCases}
 *   groupedByModule={true}
 *   modules={modules}
 *   onClick={handleClick}
 *   onDelete={handleDelete}
 *   canDelete={true}
 *   projectId={projectId}
 *   enableModuleLink={true}
 * />
 */
export function TestCaseTable({
  testCases,
  groupedByModule = false,
  modules = [],
  onDelete,
  onClick,
  canDelete = true,
  projectId,
  enableModuleLink = false,
  nested = false,
  onMoveRequest,
  onMoveTestCase,
  onMoveFolder,
  renderFolderActions,
  selectedIds,
  onSelectionChange,
}: TestCaseTableProps) {
  const router = useRouter();
  const { options: priorityOptions } = useDropdownOptions('TestCase', 'priority');
  const { options: statusOptions } = useDropdownOptions('TestCase', 'status');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'DRAFT':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DEPRECATED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Define columns
  const columns: ColumnDef<TestCase>[] = [
    {
      key: 'tcId',
      label: 'ID',
      width: '70px',
      hideable: false,
      render: (row) => (
        <p className="text-xs font-mono text-white/70 truncate">{row.tcId}</p>
      ),
    },
    {
      key: 'title',
      label: 'Название',
      className: 'min-w-0',
      minWidth: 150,
      hideable: false,
      render: (row) => (
        <div className="min-w-0 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{row.title}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Приоритет',
      width: '100px',
      minWidth: 80,
      hideable: true,
      render: (row) => {
        const badgeProps = getDynamicBadgeProps(row.priority, priorityOptions);
        const priorityLabel = priorityOptions.find(opt => opt.value === row.priority)?.label || row.priority;
        return (
          <PriorityBadge
            priority={row.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical'}
            dynamicClassName={badgeProps.className}
            dynamicStyle={badgeProps.style}
          >
            {priorityLabel}
          </PriorityBadge>
        );
      },
    },
    {
      key: 'status',
      label: 'Статус',
      width: '90px',
      minWidth: 70,
      hideable: true,
      render: (row) => {
        const badgeProps = getDynamicBadgeProps(row.status, statusOptions);
        const label = statusOptions.find(opt => opt.value === row.status)?.label || row.status;
        return (
          <Badge
            variant="outline"
            className={`w-fit text-xs px-2 py-0.5 ${badgeProps.className}`}
            style={badgeProps.style}
          >
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'owner',
      label: 'Автор',
      width: '140px',
      minWidth: 80,
      hideable: true,
      render: (row) => (
        <div className="min-w-0">
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <span className="text-xs text-white/70 truncate block cursor-pointer">
                {row.createdBy?.name ?? '-'}
              </span>
            </HoverCardTrigger>
            {row.createdBy?.name && row.createdBy.name.length > 20 && (
              <HoverCardContent side="top" className="w-60">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-white/60">Автор</h4>
                  <p className="text-sm text-white/90">{row.createdBy.name}</p>
                </div>
              </HoverCardContent>
            )}
          </HoverCard>
        </div>
      ),
    },
    {
      key: 'runs',
      label: 'Запуски',
      width: '70px',
      minWidth: 50,
      hideable: true,
      render: (row) => (
        <span className="text-xs text-white/60">{row._count.results}</span>
      ),
    },
  ];

  // Folder totals include subfolders when nested
  const totalCountOf = (() => {
    if (!nested) return (moduleId: string) => modules.find((m) => m.id === moduleId)?._count?.testCases;
    const children = groupChildren(modules);
    const cache = new Map<string, number>();
    const total = (moduleId: string, seen = new Set<string>()): number => {
      if (cache.has(moduleId)) return cache.get(moduleId)!;
      if (seen.has(moduleId)) return 0;
      seen.add(moduleId);
      const own = modules.find((m) => m.id === moduleId)?._count?.testCases ?? 0;
      const sum = own + (children.get(moduleId) ?? []).reduce((acc, child) => acc + total(child.id, seen), 0);
      cache.set(moduleId, sum);
      return sum;
    };
    return (moduleId: string) => (modules.some((m) => m.id === moduleId) ? total(moduleId) : undefined);
  })();

  // Group configuration
  const groupConfig: GroupConfig<TestCase> | undefined = groupedByModule
    ? {
        getGroupId: (row) => row.moduleId || 'no-module',
        getGroupName: (groupId) => {
          if (groupId === 'no-module') return 'Без модуля';
          const moduleItem = modules.find((m) => m.id === groupId);
          return moduleItem?.name || 'Без модуля';
        },
        getGroupCount: (groupId) => totalCountOf(groupId),
        onGroupClick: enableModuleLink && projectId
          ? (groupId) => {
              if (groupId !== 'no-module') {
                router.push(`/projects/${projectId}/modules/${groupId}`);
              }
            }
          : undefined,
        getGroupHref: enableModuleLink && projectId
          ? (groupId) => groupId !== 'no-module' ? `/projects/${projectId}/modules/${groupId}` : undefined
          : undefined,
        emptyGroups: modules.map((moduleItem) => ({
          id: moduleItem.id,
          name: moduleItem.name,
          count: totalCountOf(moduleItem.id),
        })),
        ...(nested
          ? {
              getParentGroupId: (groupId: string) => modules.find((m) => m.id === groupId)?.parentId ?? null,
              isVirtualGroup: (groupId: string) => groupId === 'no-module',
              renderGroupActions: renderFolderActions
                ? (groupId: string) => (groupId === 'no-module' ? null : renderFolderActions(groupId))
                : undefined,
              onRowDrop: onMoveTestCase
                ? (row: TestCase, targetGroupId: string | null) =>
                    onMoveTestCase(row, targetGroupId === 'no-module' ? null : targetGroupId)
                : undefined,
              onGroupDrop: onMoveFolder,
            }
          : {}),
      }
    : undefined;

  // Action configuration
  const actionItems: ActionConfig<TestCase>['items'] = [
    ...(onMoveRequest
      ? [
          {
            label: 'Переместить в папку',
            icon: FolderInput,
            onClick: onMoveRequest,
            buttonName: (row: TestCase) => `Test Case Table - Move (${row.tcId || row.title})`,
          },
        ]
      : []),
    ...(onDelete && canDelete
      ? [
          {
            label: 'Удалить',
            icon: Trash2,
            onClick: onDelete,
            variant: 'destructive' as const,
            buttonName: (row: TestCase) => `Test Case Table - Delete (${row.tcId || row.title})`,
          },
        ]
      : []),
  ];
  const actions: ActionConfig<TestCase> | undefined =
    actionItems.length > 0 ? { items: actionItems, align: 'end', iconSize: 'w-3 h-3' } : undefined;

  return (
    <GroupedDataTable
      data={testCases}
      columns={columns}
      getRowHref={projectId ? (row) => `/projects/${projectId}/testcases/${row.id}` : undefined}
      onRowClick={!projectId ? (row) => onClick(row.id) : undefined}
      grouped={groupedByModule}
      groupConfig={groupConfig}
      actions={actions}
      selection={
        selectedIds && onSelectionChange
          ? { getRowId: (row) => row.id, selectedIds, onChange: onSelectionChange }
          : undefined
      }
      resizable={true}
      emptyMessage="Нет тест-кейсов"
    />
  );
}
