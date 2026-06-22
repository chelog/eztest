'use client';

import * as React from 'react';
import { useRef, useState } from 'react';

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string; // e.g. '40px', '2fr', '1fr'
  minWidth?: number; // minimum px during resize
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  rowClassName?: string | ((row: T) => string);
  resizable?: boolean;
  activeRowKey?: string;
  getRowKey?: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  rowClassName = 'cursor-pointer hover:bg-white/5',
  resizable = false,
  activeRowKey,
  getRowKey,
}: DataTableProps<T>) {
  const [colWidths, setColWidths] = useState<Record<number, number>>({});
  const resizingRef = useRef<{ colIdx: number; startX: number; startWidth: number } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const getGridColumns = () =>
    columns
      .map((col, idx) => {
        if (colWidths[idx] !== undefined) return `${colWidths[idx]}px`;
        return col.width || '1fr';
      })
      .join(' ');

  const handleResizeStart = (colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const headerCells = headerRef.current?.children;
    if (!headerCells) return;
    const cellWidth = (headerCells[colIdx] as HTMLElement).offsetWidth;

    resizingRef.current = { colIdx, startX: e.clientX, startWidth: cellWidth };

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

  const gridColumns = getGridColumns();

  const getRowClass = (row: T) => {
    if (typeof rowClassName === 'function') return rowClassName(row);
    return rowClassName || '';
  };

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
          {/* Header Row */}
          <div
            ref={headerRef}
            className="grid gap-3 px-3 py-2 text-xs font-semibold text-white/60 border-b border-white/10 rounded-t-md"
            style={{ gridTemplateColumns: gridColumns }}
          >
            {columns.map((col, idx) => (
              <div
                key={idx}
                className={`relative ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${resizable && idx < columns.length - 1 ? 'group' : ''}`}
              >
                {col.label}
                {resizable && idx < columns.length - 1 && (
                  <div
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 bg-white/20 hover:bg-primary/60 rounded transition-colors z-10"
                    onMouseDown={(e) => handleResizeStart(idx, e)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {data.map((row, idx) => {
            const rowKey = getRowKey?.(row);
            const isActive = activeRowKey !== undefined && rowKey === activeRowKey;
            return (
              <div
                key={idx}
                className={`grid gap-3 px-3 py-2.5 transition-colors items-center text-sm rounded-sm ${
                  isActive
                    ? 'bg-primary/20 ring-1 ring-inset ring-primary/40'
                    : idx % 2 === 0
                    ? 'bg-transparent hover:bg-accent/20'
                    : 'bg-white/[0.04] border-b border-white/10 hover:bg-accent/20'
                } ${idx === data.length - 1 ? 'rounded-b-md' : ''} ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${getRowClass(row)}`}
                style={{ gridTemplateColumns: gridColumns }}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button, [role="button"], [data-radix-popper-content-wrapper]')) {
                    return;
                  }
                  onRowClick?.(row);
                }}
              >
                {columns.map((col, colIdx) => (
                  <div
                    key={`${idx}-${colIdx}`}
                    className={
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : col.className
                    }
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
                ))}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default DataTable;
