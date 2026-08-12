'use client';

import * as React from 'react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/frontend/reusable-elements/dropdowns/DropdownMenu';
import { Eye, EyeOff, Settings, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react';

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string; // e.g. '40px', '2fr', '1fr'
  minWidth?: number; // minimum px during resize
  hideable?: boolean; // Allow column to be hidden
  sortable?: boolean; // Allow column header click sorting
  sortKey?: string; // override key used for sorting (defaults to col.key)
  sortValue?: (row: T) => string | number | null | undefined; // client-side sort comparator
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  getRowHref?: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  rowClassName?: string | ((row: T) => string);
  resizable?: boolean;
  activeRowKey?: string;
  getRowKey?: (row: T) => string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  getRowHref,
  isLoading = false,
  emptyMessage = 'No data available',
  rowClassName = 'cursor-pointer hover:bg-white/5',
  resizable = false,
  activeRowKey,
  getRowKey,
  sortBy,
  sortDir,
  onSort,
}: DataTableProps<T>) {
  const router = useRouter();
  const [colWidths, setColWidths] = useState<Record<number, number>>({});
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const resizingRef = useRef<{ colIdx: number; startX: number; startWidth: number } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const visibleColumns = columns.filter((col) => !hiddenColumns.has(String(col.key)));
  const visibleColumnIndices = columns
    .map((col, idx) => ({ col, idx }))
    .filter(({ col }) => !hiddenColumns.has(String(col.key)))
    .map(({ idx }) => idx);

  const getGridColumns = () =>
    visibleColumns
      .map((col, idx) => {
        const originalIdx = visibleColumnIndices[idx];
        if (colWidths[originalIdx] !== undefined) return `${colWidths[originalIdx]}px`;
        return col.width || '1fr';
      })
      .join(' ');

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

  const gridColumns = getGridColumns();

  const getRowClass = (row: T) => {
    if (typeof rowClassName === 'function') return rowClassName(row);
    return rowClassName || '';
  };

  const hideableColumns = columns.filter((col) => col.hideable !== false && col.key !== 'select' && col.key !== 'id');

  return (
    <div className="space-y-0">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-white/60">Loading...</div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-white/60">{emptyMessage}</div>
        </div>
      ) : (
        <>
          {/* Header Row with Column Visibility Menu */}
          <div className="flex items-center justify-between px-3 py-2 mb-1">
            <div className="text-xs font-semibold text-white/60">
              {visibleColumns.length} видимых столбцов
            </div>
            {hideableColumns.length > 0 && (
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
                      key={String(col.key)}
                      checked={!hiddenColumns.has(String(col.key))}
                      onCheckedChange={() => toggleColumnVisibility(String(col.key))}
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
                        onClick={() =>
                          setHiddenColumns(
                            new Set(hideableColumns.map((c) => String(c.key)))
                          )
                        }
                        className="text-xs"
                      >
                        <EyeOff className="w-3 h-3 mr-2" />
                        Скрыть все
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Header Row */}
          <div
            ref={headerRef}
            className="grid gap-0 px-3 py-2 text-xs font-semibold text-white/60 border-b border-white/10 rounded-t-md"
            style={{ gridTemplateColumns: gridColumns }}
          >
            {visibleColumns.map((col, visibleIdx) => {
              const isLastColumn = visibleIdx === visibleColumns.length - 1;
              const colSortKey = col.sortKey || String(col.key);
              const isColSorted = col.sortable && sortBy === colSortKey;
              return (
                <div
                  key={String(col.key)}
                  className={`relative overflow-hidden px-3 py-1 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : ''
                  } ${
                    resizable && !isLastColumn
                      ? 'group'
                      : ''
                  } ${!isLastColumn ? 'border-r border-white/5' : ''} ${
                    col.sortable ? 'cursor-pointer select-none hover:text-white/90' : ''
                  }`}
                  onClick={() => {
                    if (!col.sortable || !onSort) return;
                    const newDir = isColSorted && sortDir === 'asc' ? 'desc' : 'asc';
                    onSort(colSortKey, newDir);
                  }}
                >
                  <span className="truncate flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="flex flex-col -space-y-1 flex-shrink-0">
                        <ChevronUp className={`w-3 h-3 ${isColSorted && sortDir === 'asc' ? 'text-primary' : 'text-white/20'}`} />
                        <ChevronDownIcon className={`w-3 h-3 ${isColSorted && sortDir === 'desc' ? 'text-primary' : 'text-white/20'}`} />
                      </span>
                    )}
                  </span>
                  {resizable && !isLastColumn && (
                    <div
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 bg-white/20 hover:bg-primary/60 rounded transition-colors z-10"
                      onMouseDown={(e) => handleResizeStart(visibleIdx, e)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Data Rows */}
          {data.map((row, idx) => {
            const rowKey = getRowKey?.(row);
            const isActive = activeRowKey !== undefined && rowKey === activeRowKey;
            const rowHref = getRowHref?.(row);

            const rowClass = `grid gap-0 px-3 py-2.5 transition-colors items-center text-sm rounded-sm ${
              isActive
                ? 'bg-primary/20 ring-1 ring-inset ring-primary/40'
                : idx % 2 === 0
                ? 'bg-transparent hover:bg-accent/20'
                : 'bg-white/[0.04] border-b border-white/10 hover:bg-accent/20'
            } ${idx === data.length - 1 ? 'rounded-b-md' : ''} ${
              rowHref || onRowClick ? 'cursor-pointer' : ''
            } ${getRowClass(row)}`;

            const cells = visibleColumns.map((col, visibleIdx) => {
              const isLastColumn = visibleIdx === visibleColumns.length - 1;
              return (
                <div
                  key={`${idx}-${String(col.key)}`}
                  className={`overflow-hidden px-3 py-1 min-w-0 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : col.className
                  } ${!isLastColumn ? 'border-r border-white/5' : ''}`}
                >
                  {col.render
                    ? col.render(
                        (row as Record<string, unknown>)[String(col.key)] as unknown,
                        row
                      )
                    : String(
                        (row as Record<string, unknown>)[String(col.key)] ?? ''
                      )}
                </div>
              );
            });

            if (rowHref) {
              return (
                <div
                  key={idx}
                  className={rowClass}
                  style={{ gridTemplateColumns: gridColumns }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, [role="button"], [data-radix-popper-content-wrapper]')) return;
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && onRowClick) {
                      onRowClick(row);
                      return;
                    }
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                      window.open(rowHref, '_blank');
                      return;
                    }
                    router.push(rowHref);
                  }}
                  onAuxClick={(e) => {
                    if (e.button !== 1) return;
                    if ((e.target as HTMLElement).closest('button, [role="button"], [data-radix-popper-content-wrapper]')) return;
                    e.preventDefault();
                    window.open(rowHref, '_blank');
                  }}
                >
                  {cells}
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={rowClass}
                style={{ gridTemplateColumns: gridColumns }}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button, [role="button"], [data-radix-popper-content-wrapper]')) {
                    return;
                  }
                  onRowClick?.(row);
                }}
              >
                {cells}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default DataTable;
