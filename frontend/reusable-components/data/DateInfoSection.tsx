'use client';

import { formatDateTime } from '@/lib/date-utils';

export interface DateInfoSectionProps {
  label: string;
  date: string | Date;
  className?: string;
}

/**
 * Reusable component for displaying date information
 * 
 * @example
 * ```tsx
 * <DateInfoSection
 *   label="Создан"
 *   date={testCase.createdAt}
 * />
 * ```
 */
export function DateInfoSection({
  label,
  date,
  className = '',
}: DateInfoSectionProps) {
  if (!date) {
    return null;
  }

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-white/60 mb-1">{label}</h4>
      <p className="text-white/90 text-sm">
        {formatDateTime(date)}
      </p>
    </div>
  );
}

