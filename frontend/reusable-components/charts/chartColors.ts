/** Status palette shared by all charts (matches the new theme's status colors). */
export const STATUS_COLORS = {
  passed: '#34d399',
  failed: '#e5534b',
  blocked: '#f5a524',
  retest: '#a970ff',
  skipped: '#6b6b72',
  info: '#4a8fe7',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  passed: 'Пройдено',
  failed: 'Провалено',
  blocked: 'Заблокировано',
  retest: 'Перепроверка',
  skipped: 'Не выполнено',
};

/** Soft grey used for axes / gridlines */
export const GRID_COLOR = 'rgba(255,255,255,0.06)';
export const AXIS_TEXT_COLOR = 'rgba(255,255,255,0.45)';
