'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../buttons/Button';
import { cn } from '@/lib/utils';
import { PAGE_SIZE_OPTIONS } from '@/lib/pagination-config';
import { useIsNewTheme } from '@/frontend/context/UiThemeContext';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  showItemsPerPage?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = PAGE_SIZE_OPTIONS,
  showItemsPerPage = true,
  className,
}: PaginationProps) {
  const isNewTheme = useIsNewTheme();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = React.useState(false);

  // Callers wrap the bar in a sticky container; it gets a backdrop only while it is
  // actually pinned to the bottom edge, otherwise it blends into its card
  React.useEffect(() => {
    const target = rootRef.current?.parentElement;
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.bottom >= window.innerHeight - 1),
      { rootMargin: '0px 0px -1px 0px', threshold: [1] }
    );
    observer.observe(target);
    return () => observer.disconnect();
    // Re-attach when the bar appears (it renders nothing for short lists)
  }, [isNewTheme, totalItems]);

  // Everything fits on the smallest page — pagination would be empty chrome
  const smallestPageSize = Math.min(...itemsPerPageOptions);
  if (totalItems <= smallestPageSize && currentPage === 1) {
    return null;
  }
  // Page sizes beyond the first one that already shows everything add nothing
  const firstCoveringIndex = itemsPerPageOptions.findIndex((option) => option >= totalItems);
  const usefulPageSizes =
    firstCoveringIndex === -1 ? itemsPerPageOptions : itemsPerPageOptions.slice(0, firstCoveringIndex + 1);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (isNewTheme) {
    const pageButton = (active = false) =>
      cn(
        'h-9 min-w-9 px-2.5 inline-flex items-center justify-center rounded-[10px] text-sm font-semibold tabular-nums transition-colors cursor-pointer',
        'disabled:opacity-30 disabled:pointer-events-none',
        active
          ? 'bg-[var(--nt-accent)] text-[var(--nt-on-accent)]'
          : 'bg-[var(--nt-surface-2)] text-[var(--nt-text-2)] hover:bg-[var(--nt-surface-4)] hover:text-white'
      );

    return (
      <div
        ref={rootRef}
        data-ui="nt-pagination"
        className={cn(
          'flex flex-col sm:flex-row items-center justify-between gap-4 py-2 transition-[background-color,box-shadow,padding] duration-150',
          stuck &&
            'py-3 px-4 -mx-4 rounded-t-[14px] bg-[#161617]/95 backdrop-blur-md shadow-[0_-16px_32px_-16px_rgba(0,0,0,0.9)]',
          className
        )}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--nt-text-3)]">
          <span>
            <span className="text-white font-semibold tabular-nums">
              {startItem}–{endItem}
            </span>{' '}
            из <span className="tabular-nums">{totalItems}</span>
          </span>
          {showItemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <span>На странице</span>
              <div className="flex items-center gap-1 p-1 rounded-[12px] bg-[var(--nt-surface-2)]">
                {usefulPageSizes.filter((option) => option <= 100 || option === itemsPerPage).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onItemsPerPageChange(option)}
                    className={cn(
                      'h-7 px-2.5 rounded-[8px] text-[13px] font-semibold tabular-nums transition-colors cursor-pointer',
                      option === itemsPerPage ? 'bg-[var(--nt-surface-4)] text-white' : 'text-[var(--nt-text-3)] hover:text-white'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button type="button" className={pageButton()} onClick={() => handlePageChange(1)} disabled={currentPage === 1} title="Первая страница">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button type="button" className={pageButton()} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} title="Назад">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {getPageNumbers().map((page, index) =>
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-1.5 text-[var(--nt-text-3)]">…</span>
              ) : (
                <button key={page} type="button" className={pageButton(currentPage === page)} onClick={() => handlePageChange(page as number)}>
                  {page}
                </button>
              )
            )}
            <button type="button" className={pageButton()} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} title="Вперёд">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button type="button" className={pageButton()} onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} title="Последняя страница">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-white/10 bg-[#0b0b0d]/90 backdrop-blur-xl',
        className
      )}
    >
      {/* Items count and per-page selector */}
      <div className="flex items-center gap-4 text-sm text-white/70">
        <span>
          Показано {startItem}–{endItem} из {totalItems}
        </span>
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span>Показывать</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-1.5 rounded border border-white/10 bg-[#0f0f12] text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer hover:bg-[#1f2937] transition-colors"
            >
              {usefulPageSizes.map((option) => (
                <option key={option} value={option} className="bg-[#0f0f12] text-white">
                  {option}
                </option>
              ))}
            </select>
            <span>на странице</span>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* First page */}
        <Button
          variant="glass"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="px-2 !cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="glass"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 !cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-white/40">
                  ...
                </span>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? 'glass-primary' : 'glass'}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                className="min-w-[36px] !cursor-pointer"
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next page */}
        <Button
          variant="glass"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 !cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="glass"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-2 !cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

