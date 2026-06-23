import { useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination-config';

const STORAGE_KEY = 'global-items-per-page';

export function useItemsPerPage() {
  const [itemsPerPage, setItemsPerPageState] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_PAGE_SIZE;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = Number(saved);
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE_SIZE;
  });

  const setItemsPerPage = (value: number) => {
    setItemsPerPageState(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    }
  };

  return [itemsPerPage, setItemsPerPage] as const;
}
