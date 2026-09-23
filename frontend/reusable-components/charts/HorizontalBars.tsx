export interface HorizontalBarItem {
  label: string;
  value: number;
  color?: string;
}

/** "По типам"-style list: label, count (share %) and a full-width bar. */
export function HorizontalBars({ items, emptyText = 'Нет данных' }: { items: HorizontalBarItem[]; emptyText?: string }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(1, ...items.map((i) => i.value));

  if (items.length === 0 || total === 0) {
    return <div className="py-6 text-sm text-white/40">{emptyText}</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className="text-[15px] text-white/90 truncate">{item.label}</span>
            <span className="shrink-0 text-[15px] font-bold text-white tabular-nums">
              {item.value}
              <span className="ml-1.5 text-xs font-normal text-white/45">({Math.round((item.value / total) * 100)}%)</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color ?? '#8a8a90' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
