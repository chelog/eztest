'use client';

import { useState, useRef, ReactNode } from 'react';
import { ActionMenu } from '@/frontend/reusable-components/menus/ActionMenu';
import { ChevronDown, LucideIcon, Settings, Eye, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/frontend/reusable-elements/dropdowns/DropdownMenu';

export interface ColumnDef<T> {
  key: string;
  label: string;
  width?: string;
  minWidth?: number;
  hideable?: boolean;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface GroupConfig<T> {
  getGroupId: (row: T) => string;
  getGroupName: (groupId: string, row?: T) => string;
  getGroupCount?: (groupId: string) => number | undefined;
  onGroupClick?: (groupId: string) => void;
  renderGroupHeader?: (groupId: string, groupName: string, count: number) => ReactNode;
  emptyGroups?: Array<{ id: string; name: string; count?: number }>;
}

export interface ActionConfig<T> {
  items: Array<{
    label: string;
    icon: LucideIcon;
    onClick: (row: T) => void;
    variant?: 'default' | 'destructive';
    show?: boolean | ((row: T) => boolean);
    /** Button name for analytics tracking (defaults to label if not provided) */
    buttonName?: string | ((row: T) => string);
  }>;
  align?: 'start' | 'end';
  iconSize?: string;
}

export interface GroupedDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  grouped?: boolean;
  groupConfig?: GroupConfig<T>;
  actions?: ActionConfig<T>;
  headerClassName?: string;
  rowClassName?: string;
  emptyMessage?: string;
  gridTemplateColumns?: string;
  resizable?: boolean;
}

/**
 * Fully reusable grouped data table component
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<TestCase>[] = [
 *   { key: 'id', label: 'ID', width: '80px' },
 *   { key: 'title', label: 'Title', render: (row) => <span>{row.title}</span> },
 *   { key: 'priority', label: 'Priority', render: (row) => <PriorityBadge priority={row.priority} /> },
 * ];
 *
 * <GroupedDataTable
 *   data={testCases}
 *   columns={columns}
 *   onRowClick={(row) => handleClick(row.id)}
 *   grouped={true}
 *   groupConfig={{
 *     getGroupId: (row) => row.moduleId || 'no-module',
 *     getGroupName: (id) => modules.find(m => m.id === id)?.name || 'Ungrouped',
 *   }}
 *   actions={{
 *     items: [
 *       { label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'destructive' }
 *     ]
 *   }}
 * />
 * ```
 */
export function GroupedDataTable<T = Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  grouped = false,
  groupConfig,
  actions,
  headerClassName = '',
  rowClassName = '',
  emptyMessage = 'No data available',
  gridTemplateColumns,
  resizable = false,
}: GroupedDataTableProps<T>) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<Record<number, number>>({});
  const resizingRef = useRef<{ colIdx: number; startX: number; startWidth: number } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const hideableColumns = columns.filter((col) => col.hideable !== false);
  const visibleColumns = columns.filter((col) => !hiddenColumns.has(col.key));
  const visibleColumnIndices = columns
    .map((col, idx) => ({ col, idx }))
    .filter(({ col }) => !hiddenColumns.has(col.key))
    .map(({ idx }) => idx);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      return newExpanded;
    });
  };

  const toggleColumnVisibility = (colKey: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colKey)) {
        next.delete(colKey);
      } else {
        next.add(colKey);
      }
      return next;
    });
  };

  const handleResizeStart = (visibleIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const headerCells = headerRef.current?.children;
    if (!headerCells) return;
    const cellWidth = (headerCells[visibleIdx] as HTMLElement).offsetWidth;
    const originalIdx = visibleColumnIndices[visibleIdx];

    resizingRef.current = { colIdx: originalIdx, startX: e.clientX, startWidth: cellWidth };

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colIdx: ci, startX, startWidth } = resizingRef.current;
      const minW = columns[ci].minWidth ?? 40;
      const newWidth = Math.max(minW, startWidth + (ev.clientX - startX));
      setColWidths((prev) => ({ ...prev, [ci]: newWidth }));
    };

    const onMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Calculate grid template columns
  const getGridColumns = () => {
    if (gridTemplateColumns && !resizable && hiddenColumns.size === 0) return gridTemplateColumns;

    const columnWidths = visibleColumns.map((col, idx) => {
      const originalIdx = visibleColumnIndices[idx];
      if (colWidths[originalIdx] !== undefined) return `${colWidths[originalIdx]}px`;
      return col.width || '1fr';
    });
    const actionColumn = actions ? '50px' : '';
    return [...columnWidths, actionColumn].filter(Boolean).join(' ');
  };

  // Group data if grouping is enabled
  const groupedData = grouped && groupConfig
    ? (() => {
        const groups: Record<string, { items: T[]; name: string; count?: number }> = {};

        // Group items from data
        data.forEach((row) => {
          const groupId = groupConfig.getGroupId(row);
          if (!groups[groupId]) {
            groups[groupId] = {
              items: [],
              name: groupConfig.getGroupName(groupId, row),
            };
          }
          groups[groupId].items.push(row);
        });

        // Add empty groups if provided
        if (groupConfig.emptyGroups) {
          groupConfig.emptyGroups.forEach((emptyGroup) => {
            if (!groups[emptyGroup.id]) {
              groups[emptyGroup.id] = {
                items: [],
                name: groupConfig.getGroupName(emptyGroup.id),
                count: emptyGroup.count,
              };
            } else if (emptyGroup.count !== undefined) {
              groups[emptyGroup.id].count = emptyGroup.count;
            }
          });
        }

        // Set counts for groups that have items
        Object.keys(groups).forEach((groupId) => {
          if (groups[groupId].count === undefined) {
            groups[groupId].count = groups[groupId].items.length;
          }
        });

        return groups;
      })()
    : null;

  // Render header row
  const renderHeader = () => (
    <div
      ref={headerRef}
      className={`grid gap-3 px-3 py-1.5 text-xs font-semibold text-white/60 border-b border-white/10 ${headerClassName}`}
      style={{ gridTemplateColumns: getGridColumns() }}
    >
      {visibleColumns.map((col, visibleIdx) => {
        const isLastCol = visibleIdx === visibleColumns.length - 1 && !actions;
        return (
          <div
            key={col.key}
            className={`relative ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${resizable && !isLastCol ? 'group' : ''}`}
          >
            {col.label}
            {resizable && !isLastCol && (
              <div
                className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 bg-white/20 hover:bg-primary/60 rounded transition-colors z-10"
                onMouseDown={(e) => handleResizeStart(visibleIdx, e)}
              />
            )}
          </div>
        );
      })}
      {actions && <div></div>}
    </div>
  );

  // Render a single row
  const renderRow = (row: T, index: number) => {
    const actionItems = actions?.items.filter((item) => {
      if (item.show === false) return false;
      if (typeof item.show === 'function') return item.show(row);
      return true;
    }) || [];

    return (
      <div
        key={index}
        className={`grid gap-3 px-3 py-1.5 cursor-pointer transition-colors items-center text-sm rounded-sm hover:bg-accent/20 ${
          index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.04] border-b border-white/10'
        } ${rowClassName}`}
        style={{ gridTemplateColumns: getGridColumns() }}
        onClick={() => onRowClick?.(row)}
      >
        {visibleColumns.map((col) => (
          <div
            key={col.key}
            className={`${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
          >
            {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] || '')}
          </div>
        ))}
        {actions && (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            {actionItems.length > 0 && (
              <ActionMenu
                items={actionItems.map((item) => ({
                  label: item.label,
                  icon: item.icon as LucideIcon,
                  onClick: () => item.onClick(row),
                  variant: item.variant,
                  buttonName: typeof item.buttonName === 'function'
                    ? item.buttonName(row)
                    : item.buttonName || item.label,
                }))}
                align={actions.align || 'end'}
                iconSize={actions.iconSize || 'w-3 h-3'}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  // Render group header
  const renderGroupHeader = (groupId: string, groupName: string, count: number, groupIndex: number = 0) => {
    const isExpanded = expandedGroups.has(groupId);
    const displayCount = count;

    if (groupConfig?.renderGroupHeader) {
      return groupConfig.renderGroupHeader(groupId, groupName, displayCount);
    }

    return (
      <div className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/20 rounded transition-colors overflow-hidden ${
        groupIndex % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.04] border-b border-white/10'
      }`}>
        <button
          onClick={() => toggleGroup(groupId)}
          className="flex items-center gap-2 flex-1 text-left cursor-pointer min-w-0 overflow-hidden"
        >
          <ChevronDown
            className={`w-4 h-4 text-white/60 transition-transform flex-shrink-0 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
          <span className="min-w-0 flex-1 overflow-hidden max-w-[200px]">
            {groupConfig?.onGroupClick ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  groupConfig.onGroupClick?.(groupId);
                }}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 cursor-pointer truncate block"
                title={groupName}
              >
                {groupName}
              </span>
            ) : (
              <span className="text-sm font-semibold text-white/80 truncate block" title={groupName}>
                {groupName}
              </span>
            )}
          </span>
        </button>
        <span className="text-xs text-white/50 flex-shrink-0 whitespace-nowrap">
          ({displayCount} item{displayCount !== 1 ? 's' : ''})
        </span>
      </div>
    );
  };

  if (data.length === 0 && !groupedData) {
    return (
      <div className="text-center py-8 text-white/60">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Column visibility toolbar */}
      {hideableColumns.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 mb-1">
          <div className="text-xs font-semibold text-white/60">
            {visibleColumns.length} видимых столбцов
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Показать/скрыть столбцы">
                <Settings className="w-4 h-4 text-white/60 hover:text-white/90" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium text-white/70">
                Видимость столбцов
              </div>
              <DropdownMenuSeparator />
              {hideableColumns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={!hiddenColumns.has(col.key)}
                  onCheckedChange={() => toggleColumnVisibility(col.key)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
              {hideableColumns.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setHiddenColumns(new Set())}
                    className="text-xs"
                  >
                    <Eye className="w-3 h-3 mr-2" />
                    Показать все
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setHiddenColumns(new Set(hideableColumns.map((c) => c.key)))}
                    className="text-xs"
                  >
                    <EyeOff className="w-3 h-3 mr-2" />
                    Скрыть все
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {renderHeader()}

      {groupedData ? (
        // Grouped view
        Object.entries(groupedData).map(([groupId, { items, name, count }], groupIndex) => {
          const isExpanded = expandedGroups.has(groupId);
          const displayCount = count !== undefined ? count : items.length;

          return (
            <div key={groupId} className="space-y-0">
              {renderGroupHeader(groupId, name, displayCount, groupIndex)}
              {isExpanded && items.length > 0 && (
                <div className="space-y-0">
                  {items.map((row, index) => renderRow(row, index))}
                </div>
              )}
            </div>
          );
        })
      ) : (
        // Ungrouped view
        data.map((row, index) => renderRow(row, index))
      )}
    </div>
  );
}
