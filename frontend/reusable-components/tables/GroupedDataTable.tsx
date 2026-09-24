'use client';

import { useState, useRef, ReactNode } from 'react';
import Link from 'next/link';
import { ActionMenu } from '@/frontend/reusable-components/menus/ActionMenu';
import { Checkbox } from '@/frontend/reusable-elements/checkboxes/Checkbox';
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
  getGroupHref?: (groupId: string) => string | undefined;
  renderGroupHeader?: (groupId: string, groupName: string, count: number) => ReactNode;
  emptyGroups?: Array<{ id: string; name: string; count?: number }>;
  /** Enables nested groups (folders in folders): parent group id, or null for top level */
  getParentGroupId?: (groupId: string) => string | null;
  /** Extra controls on the right side of a group header (e.g. a folder menu) */
  renderGroupActions?: (groupId: string) => ReactNode;
  /** Drag & drop: row dropped on a group header, or on the top-level zone (null) */
  onRowDrop?: (row: T, targetGroupId: string | null) => void;
  /** Drag & drop: group dropped on another group header, or on the top-level zone (null) */
  onGroupDrop?: (groupId: string, targetGroupId: string | null) => void;
  /** Groups that are not real folders: can't be dragged and don't accept groups */
  isVirtualGroup?: (groupId: string) => boolean;
}

type DragPayload<T> = { kind: 'row'; row: T; groupId: string } | { kind: 'group'; groupId: string };
const ROOT_DROP_ZONE = '__root__';

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

export interface RowSelectionConfig<T> {
  getRowId: (row: T) => string;
  selectedIds: Set<string>;
  onChange: (selectedIds: Set<string>) => void;
}

export interface GroupedDataTableProps<T> {
  data: T[];
  /** Checkboxes on rows and group headers (a group checkbox selects everything inside it) */
  selection?: RowSelectionConfig<T>;
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  getRowHref?: (row: T) => string | undefined;
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
 *   { key: 'title', label: 'Название', render: (row) => <span>{row.title}</span> },
 *   { key: 'priority', label: 'Приоритет', render: (row) => <PriorityBadge priority={row.priority} /> },
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
 *       { label: 'Удалить', icon: Trash2, onClick: handleDelete, variant: 'destructive' }
 *     ]
 *   }}
 * />
 * ```
 */
export function GroupedDataTable<T = Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  getRowHref,
  grouped = false,
  groupConfig,
  actions,
  headerClassName = '',
  rowClassName = '',
  emptyMessage = 'Нет данных',
  gridTemplateColumns,
  resizable = false,
  selection,
}: GroupedDataTableProps<T>) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const dragRef = useRef<DragPayload<T> | null>(null);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragKind, setDragKind] = useState<DragPayload<T>['kind'] | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
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

  const isVirtual = (groupId: string) => groupConfig?.isVirtualGroup?.(groupId) ?? false;

  // true when `groupId` is `ancestorId` or lies inside it
  const isInside = (groupId: string, ancestorId: string) => {
    const seen = new Set<string>();
    for (let current: string | null = groupId; current && !seen.has(current); current = groupConfig?.getParentGroupId?.(current) ?? null) {
      if (current === ancestorId) return true;
      seen.add(current);
    }
    return false;
  };

  const canDropOn = (target: string) => {
    const payload = dragRef.current;
    if (!payload) return false;
    if (payload.kind === 'row') {
      if (!groupConfig?.onRowDrop) return false;
      // Dropping a row where it already is does nothing
      return target === ROOT_DROP_ZONE ? payload.groupId !== ROOT_DROP_ZONE : target !== payload.groupId;
    }
    if (!groupConfig?.onGroupDrop) return false;
    if (target === ROOT_DROP_ZONE) return (groupConfig.getParentGroupId?.(payload.groupId) ?? null) !== null;
    return !isVirtual(target) && !isInside(target, payload.groupId) && groupConfig.getParentGroupId?.(payload.groupId) !== target;
  };

  const startDrag = (event: React.DragEvent, payload: DragPayload<T>) => {
    event.stopPropagation();
    dragRef.current = payload;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', payload.kind);
    setDragKind(payload.kind);
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragKind(null);
    setDropTarget(null);
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
  };

  const dropHandlers = (target: string) => ({
    onDragOver: (event: React.DragEvent) => {
      if (!canDropOn(target)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (dropTarget !== target) {
        setDropTarget(target);
        // Hovering a collapsed folder while dragging opens it
        if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
        if (target !== ROOT_DROP_ZONE && !expandedGroups.has(target)) {
          expandTimerRef.current = setTimeout(() => {
            setExpandedGroups((prev) => new Set(prev).add(target));
          }, 700);
        }
      }
    },
    onDragLeave: (event: React.DragEvent) => {
      if (event.currentTarget.contains(event.relatedTarget as Node)) return;
      if (dropTarget === target) setDropTarget(null);
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      const payload = dragRef.current;
      const allowed = canDropOn(target);
      endDrag();
      if (!payload || !allowed) return;
      const targetId = target === ROOT_DROP_ZONE ? null : target;
      if (payload.kind === 'row') groupConfig?.onRowDrop?.(payload.row, targetId);
      else groupConfig?.onGroupDrop?.(payload.groupId, targetId);
    },
  });

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
    // The selection checkbox occupies the first header cell
    const cellWidth = (headerCells[visibleIdx + (selection ? 1 : 0)] as HTMLElement).offsetWidth;
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

  // Checkbox for a set of rows: checked when all are selected, dash when some are
  const renderCheckbox = (rowIds: string[], label: string) => {
    if (!selection) return null;
    const selectedCount = rowIds.filter((id) => selection.selectedIds.has(id)).length;
    const state: boolean | 'indeterminate' =
      rowIds.length > 0 && selectedCount === rowIds.length ? true : selectedCount > 0 ? 'indeterminate' : false;
    return (
      <Checkbox
        checked={state}
        disabled={rowIds.length === 0}
        aria-label={label}
        className="size-4"
        onClick={(event) => event.stopPropagation()}
        onCheckedChange={() => {
          const next = new Set(selection.selectedIds);
          if (state === true) rowIds.forEach((id) => next.delete(id));
          else rowIds.forEach((id) => next.add(id));
          selection.onChange(next);
        }}
      />
    );
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
    const selectColumn = selection ? '20px' : '';
    return [selectColumn, ...columnWidths, actionColumn].filter(Boolean).join(' ');
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

  // Group nesting (tree mode): children lists and top-level groups, in emptyGroups order
  const groupTree = (() => {
    if (!groupedData || !groupConfig?.getParentGroupId) return null;
    const childrenOf = new Map<string, string[]>();
    const roots: string[] = [];
    Object.keys(groupedData).forEach((groupId) => {
      const parentId = groupConfig.getParentGroupId?.(groupId) ?? null;
      if (parentId && parentId !== groupId && groupedData[parentId]) {
        childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), groupId]);
      } else {
        roots.push(groupId);
      }
    });
    // Keep the order given by emptyGroups (tree order); unknown groups go last
    const position = new Map((groupConfig.emptyGroups ?? []).map((g, index) => [g.id, index]));
    const byPosition = (a: string, b: string) =>
      (position.get(a) ?? Number.MAX_SAFE_INTEGER) - (position.get(b) ?? Number.MAX_SAFE_INTEGER);
    roots.sort(byPosition);
    childrenOf.forEach((list) => list.sort(byPosition));
    return { childrenOf, roots };
  })();

  // Row ids of a group including its sub-groups (for the group checkbox)
  const groupRowIds = (groupId: string, seen = new Set<string>()): string[] => {
    if (!selection || !groupedData?.[groupId] || seen.has(groupId)) return [];
    seen.add(groupId);
    return [
      ...groupedData[groupId].items.map((row) => selection.getRowId(row)),
      ...(groupTree?.childrenOf.get(groupId) ?? []).flatMap((childId) => groupRowIds(childId, seen)),
    ];
  };

  // Render header row
  const renderHeader = () => (
    <div
      ref={headerRef}
      className={`grid gap-3 px-3 py-1.5 text-xs font-semibold text-white/60 border-b border-white/10 ${headerClassName}`}
      style={{ gridTemplateColumns: getGridColumns() }}
    >
      {selection && (
        <div className="flex items-center">
          {renderCheckbox(
            data.map((row) => selection.getRowId(row)),
            'Выделить все'
          )}
        </div>
      )}
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
  const renderRow = (row: T, index: number, depth = 0, groupId = ROOT_DROP_ZONE) => {
    const actionItems = actions?.items.filter((item) => {
      if (item.show === false) return false;
      if (typeof item.show === 'function') return item.show(row);
      return true;
    }) || [];

    const rowHref = getRowHref?.(row);
    const rowClass = `grid gap-3 px-3 py-1.5 cursor-pointer transition-colors items-center text-sm rounded-sm hover:bg-accent/20 ${
      index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.04] border-b border-white/10'
    } ${rowClassName}`;
    const selectedClass = 'bg-[color-mix(in_srgb,var(--nt-accent,#10b981)_10%,transparent)]';

    // Data cells only — no ActionMenu inside; used for both Link and div variants
    const rowId = selection?.getRowId(row);
    const isSelected = rowId !== undefined && selection!.selectedIds.has(rowId);
    // Checkbox sits outside the row link (absolute), over this empty first grid cell
    const selectCell = selection ? <div aria-hidden="true" /> : null;
    const rowCheckbox = selection && rowId !== undefined ? (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex">
        {renderCheckbox([rowId], 'Выделить')}
      </div>
    ) : null;

    const dataCells = visibleColumns.map((col, colIdx) => (
      <div
        key={col.key}
        className={`${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
        // Nested rows are indented under their folder
        style={colIdx === 0 && depth > 0 ? { paddingLeft: depth * 18 } : undefined}
      >
        {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] || '')}
      </div>
    ));

    // Shared ActionMenu config
    const actionMenuItems = actionItems.map((item) => ({
      label: item.label,
      icon: item.icon as LucideIcon,
      onClick: () => item.onClick(row),
      variant: item.variant,
      buttonName: typeof item.buttonName === 'function'
        ? item.buttonName(row)
        : item.buttonName || item.label,
    }));

    const dragProps = groupConfig?.onRowDrop
      ? {
          draggable: true,
          onDragStart: (event: React.DragEvent) => startDrag(event, { kind: 'row', row, groupId }),
          onDragEnd: endDrag,
        }
      : {};

    if (rowHref) {
      return (
        <div key={index} className="relative">
          {/* Link contains only data cells — no buttons inside <a> */}
          <Link
            href={rowHref}
            className={`${rowClass} ${isSelected ? selectedClass : ''}`}
            style={{ gridTemplateColumns: getGridColumns() }}
            {...dragProps}
          >
            {selectCell}
            {dataCells}
            {/* Empty placeholder preserves action column width in the grid */}
            {actions && <div aria-hidden="true" />}
          </Link>
          {rowCheckbox}
          {/* ActionMenu rendered outside the Link as an absolute sibling */}
          {actionItems.length > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
              <ActionMenu
                items={actionMenuItems}
                align={actions!.align || 'end'}
                iconSize={actions!.iconSize || 'w-3 h-3'}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={index} className="relative">
      <div
        className={`${rowClass} ${isSelected ? selectedClass : ''}`}
        style={{ gridTemplateColumns: getGridColumns() }}
        onClick={() => onRowClick?.(row)}
        {...dragProps}
      >
        {selectCell}
        {dataCells}
        {actions && (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            {actionItems.length > 0 && (
              <ActionMenu
                items={actionMenuItems}
                align={actions.align || 'end'}
                iconSize={actions.iconSize || 'w-3 h-3'}
              />
            )}
          </div>
        )}
      </div>
      {rowCheckbox}
      </div>
    );
  };

  // Render group header
  const renderGroupHeader = (groupId: string, groupName: string, count: number, groupIndex: number = 0, depth = 0) => {
    const isExpanded = expandedGroups.has(groupId);
    const displayCount = count;

    if (groupConfig?.renderGroupHeader) {
      return groupConfig.renderGroupHeader(groupId, groupName, displayCount);
    }

    const draggableGroup = Boolean(groupConfig?.onGroupDrop) && !isVirtual(groupId);
    const isDropTarget = dropTarget === groupId;

    return (
      <div
        className={`group/header w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/20 rounded transition-colors overflow-hidden ${
          groupIndex % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.04] border-b border-white/10'
        } ${isDropTarget ? 'ring-1 ring-inset ring-[var(--nt-accent,#10b981)] bg-[color-mix(in_srgb,var(--nt-accent,#10b981)_12%,transparent)]' : ''}`}
        style={depth > 0 ? { paddingLeft: 12 + depth * 18 } : undefined}
        draggable={draggableGroup}
        onDragStart={draggableGroup ? (event) => startDrag(event, { kind: 'group', groupId }) : undefined}
        onDragEnd={draggableGroup ? endDrag : undefined}
        {...dropHandlers(groupId)}
      >
        {selection && (
          <span className="flex flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {renderCheckbox(groupRowIds(groupId), `Выделить всё в ${groupName}`)}
          </span>
        )}
        {/* Toggle button — only the chevron icon; no Link inside */}
        <button
          onClick={() => toggleGroup(groupId)}
          className="flex-shrink-0 cursor-pointer"
          aria-label={isExpanded ? `Свернуть ${groupName}` : `Развернуть ${groupName}`}
        >
          <ChevronDown
            className={`w-4 h-4 text-white/60 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
        {/* Group name — sibling of the toggle button, not nested inside it */}
        <span className="min-w-0 flex-1 overflow-hidden max-w-[360px]">
          {(() => {
            const groupHref = groupConfig?.getGroupHref?.(groupId);
            if (groupHref) {
              return (
                <Link
                  href={groupHref}
                  className="text-sm font-semibold text-white hover:text-white/70 truncate block transition-colors"
                  title={groupName}
                >
                  {groupName}
                </Link>
              );
            }
            if (groupConfig?.onGroupClick) {
              return (
                <button
                  type="button"
                  onClick={() => groupConfig.onGroupClick?.(groupId)}
                  className="text-sm font-semibold text-white hover:text-white/70 cursor-pointer truncate block w-full text-left transition-colors"
                  title={groupName}
                >
                  {groupName}
                </button>
              );
            }
            return (
              <span className="text-sm font-semibold text-white/80 truncate block" title={groupName}>
                {groupName}
              </span>
            );
          })()}
        </span>
        <span className="text-xs text-white/50 flex-shrink-0 whitespace-nowrap tabular-nums px-1.5 py-0.5 rounded-md bg-white/[0.06]">
          {displayCount}
        </span>
        {groupConfig?.renderGroupActions && (
          <span className="ml-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {groupConfig.renderGroupActions(groupId)}
          </span>
        )}
      </div>
    );
  };

  // Nested (tree) rendering: sub-groups first, then the group's own rows
  const renderGroupTree = (
    groups: Record<string, { items: T[]; name: string; count?: number }>,
    childrenOf: Map<string, string[]>,
    groupId: string,
    groupIndex: number,
    depth: number
  ): ReactNode => {
    const { items, name, count } = groups[groupId];
    const isExpanded = expandedGroups.has(groupId);
    const childIds = childrenOf.get(groupId) ?? [];
    return (
      <div key={groupId} className="space-y-0">
        {renderGroupHeader(groupId, name, count !== undefined ? count : items.length, groupIndex, depth)}
        {isExpanded && (
          <div className="space-y-0">
            {childIds.map((childId, childIndex) => renderGroupTree(groups, childrenOf, childId, childIndex + 1, depth + 1))}
            {items.map((row, index) => renderRow(row, index, depth + 1, groupId))}
          </div>
        )}
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

      {dragKind && (groupConfig?.onGroupDrop || groupConfig?.onRowDrop) && (
        <div
          {...dropHandlers(ROOT_DROP_ZONE)}
          className={`my-1 flex items-center justify-center rounded-md border border-dashed px-3 py-2 text-xs transition-colors ${
            dropTarget === ROOT_DROP_ZONE
              ? 'border-[var(--nt-accent,#10b981)] text-white bg-white/[0.04]'
              : 'border-white/15 text-white/45'
          }`}
        >
          {dragKind === 'group' ? 'Отпустите здесь, чтобы вынести папку на верхний уровень' : 'Отпустите здесь, чтобы убрать из папки'}
        </div>
      )}

      {groupedData && groupTree ? (
        // Tree view: top-level groups, their sub-groups nested inside
        groupTree.roots.map((groupId, groupIndex) =>
          renderGroupTree(groupedData, groupTree.childrenOf, groupId, groupIndex, 0)
        )
      ) : groupedData ? (
        // Grouped view
        Object.entries(groupedData).map(([groupId, { items, name, count }], groupIndex) => {
          const isExpanded = expandedGroups.has(groupId);
          const displayCount = count !== undefined ? count : items.length;

          return (
            <div key={groupId} className="space-y-0">
              {renderGroupHeader(groupId, name, displayCount, groupIndex)}
              {isExpanded && items.length > 0 && (
                <div className="space-y-0">
                  {items.map((row, index) => renderRow(row, index, 0, groupId))}
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
