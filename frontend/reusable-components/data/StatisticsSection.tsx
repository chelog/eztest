'use client';

export interface Statistic {
  label: string;
  value: string | number;
}

export interface StatisticsSectionProps {
  label?: string;
  statistics: Statistic[];
  className?: string;
}

/**
 * Reusable component for displaying statistics in key-value pairs
 * 
 * @example
 * ```tsx
 * <StatisticsSection
 *   label="Статистика"
 *   statistics={[
 *     { label: 'Тест-раны', value: 10 },
 *     { label: 'Комментарии', value: 5 },
 *     { label: 'Вложения', value: 3 },
 *   ]}
 * />
 * ```
 */
export function StatisticsSection({
  label = 'Статистика',
  statistics,
  className = '',
}: StatisticsSectionProps) {
  if (statistics.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-white/60 mb-1">{label}</h4>
      <div className="space-y-1 text-sm">
        {statistics.map((stat, index) => (
          <div key={index} className="flex justify-between text-white/90">
            <span>{stat.label}</span>
            <span>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

