'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  getRowHref?: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  rowClassName?: string;
}

/**
 * Reusable DataTable component for displaying tabular data
 * Uses CSS Grid for consistent styling with DefectTable and GroupedDataTable
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<TestCase>[] = [
 *   { key: 'title', label: 'Title' },
 *   { key: 'priority', label: 'Priority', render: (val, row) => <Badge>{row.priority}</Badge> },
 *   { key: 'status', label: 'Status' }
 * ];
 *
 * <DataTable columns={columns} data={testCases} onRowClick={(row) => handleClick(row.id)} />
 * ```
 */
export function DataTable<T>({
  columns,
  data,
  onRowClick,
  getRowHref,
  isLoading = false,
  emptyMessage = 'No data available',
  rowClassName = 'cursor-pointer hover:bg-white/5',
}: DataTableProps<T>) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleHeaderClick = (col: ColumnDef<T>) => {
    if (!col.sortable) return;
    const key = String(col.key);
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find(c => String(c.key) === sortKey);
    if (!col) return data;

    return [...data].sort((a, b) => {
      const aVal = col.sortValue
        ? col.sortValue(a)
        : (a as Record<string, unknown>)[sortKey];
      const bVal = col.sortValue
        ? col.sortValue(b)
        : (b as Record<string, unknown>)[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === 'asc' ? 1 : -1;
      if (bVal == null) return sortDir === 'asc' ? -1 : 1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortDir === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir, columns]);

  // Calculate grid columns - use auto for flexible sizing
  const gridColumns = columns.map(() => '1fr').join(' ');

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
            className="grid gap-3 px-3 py-2 text-xs font-semibold text-white/60 border-b border-white/10 rounded-t-md"
            style={{ gridTemplateColumns: gridColumns }}
          >
            {columns.map((col, idx) => {
              const isSorted = col.sortable && sortKey === String(col.key);
              return (
                <div
                  key={idx}
                  className={[
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '',
                    col.sortable ? 'cursor-pointer select-none hover:text-white/90 flex items-center gap-1' : '',
                  ].join(' ')}
                  onClick={() => handleHeaderClick(col)}
                >
                  {col.label}
                  {col.sortable && (
                    isSorted
                      ? sortDir === 'asc'
                        ? <ChevronUp className="w-3 h-3 flex-shrink-0" />
                        : <ChevronDown className="w-3 h-3 flex-shrink-0" />
                      : <ChevronsUpDown className="w-3 h-3 flex-shrink-0 opacity-40" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Data Rows */}
          {sortedData.map((row, idx) => {
            const rowHref = getRowHref?.(row);
            const rowClass = `grid gap-3 px-3 py-2.5 transition-colors items-center text-sm rounded-sm hover:bg-accent/20 ${
              idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.04] border-b border-white/10'
            } ${
              idx === sortedData.length - 1 ? 'rounded-b-md' : ''
            } ${
              rowHref || onRowClick ? 'cursor-pointer' : ''
            } ${rowClassName || ''}`;

            const cells = columns.map((col, colIdx) => (
              <div
                key={`${idx}-${colIdx}`}
                className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : col.className}
              >
                {col.render ? col.render((row as Record<string, unknown>)[String(col.key)] as unknown, row) : String((row as Record<string, unknown>)[String(col.key)])}
              </div>
            ));

            if (rowHref) {
              return (
                <div
                  key={idx}
                  className={rowClass}
                  style={{ gridTemplateColumns: gridColumns }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, [role="button"], a')) return;
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                      window.open(rowHref, '_blank');
                      return;
                    }
                    router.push(rowHref);
                  }}
                  onAuxClick={(e) => {
                    if (e.button !== 1) return;
                    if ((e.target as HTMLElement).closest('button, [role="button"], a')) return;
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
                  if ((e.target as HTMLElement).closest('button, [role="button"]')) return;
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
