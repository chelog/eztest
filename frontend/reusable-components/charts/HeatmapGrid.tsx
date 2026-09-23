'use client';

import * as React from 'react';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface HeatmapGridProps {
  /** 7 rows (Mon..Sun) × 24 columns (hours) */
  cells: number[][];
  /** Base color of the scale (hex) */
  color?: string;
  unitLabel?: string;
}

/** Weekday × hour activity heatmap ("нагрузка по часам"). */
export function HeatmapGrid({ cells, color = '#e0506e', unitLabel = 'выполнений' }: HeatmapGridProps) {
  const [hover, setHover] = React.useState<{ day: number; hour: number } | null>(null);
  const max = Math.max(1, ...cells.flat());
  const levels = [0.18, 0.38, 0.6, 0.82, 1];

  const cellColor = (value: number) => {
    if (value === 0) return 'rgba(255,255,255,0.05)';
    const level = levels.find((l) => value / max <= l) ?? 1;
    return `color-mix(in srgb, ${color} ${Math.round(level * 100)}%, #1b1b1c)`;
  };

  return (
    <div className="w-full">
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: '28px repeat(24, minmax(0, 1fr))' }}>
        <div />
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="text-[10px] text-white/35 text-center h-4">
            {hour % 6 === 0 ? String(hour).padStart(2, '0') : ''}
          </div>
        ))}
        {cells.map((row, day) => (
          <React.Fragment key={day}>
            <div className="text-[11px] text-white/45 flex items-center">{DAY_LABELS[day]}</div>
            {row.map((value, hour) => (
              <div
                key={hour}
                onMouseEnter={() => setHover({ day, hour })}
                onMouseLeave={() => setHover(null)}
                className="aspect-square rounded-[4px] transition-transform hover:scale-110"
                style={{ backgroundColor: cellColor(value) }}
                title={`${DAY_LABELS[day]}, ${String(hour).padStart(2, '0')}:00 — ${value} ${unitLabel}`}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/45">
        <span className="h-4">
          {hover
            ? `${DAY_LABELS[hover.day]}, ${String(hover.hour).padStart(2, '0')}:00 — ${cells[hover.day][hover.hour]} ${unitLabel}`
            : ''}
        </span>
        <span className="flex items-center gap-1">
          меньше
          {[0, ...levels].map((l) => (
            <span
              key={l}
              className="w-3 h-3 rounded-[3px]"
              style={{ backgroundColor: l === 0 ? 'rgba(255,255,255,0.05)' : `color-mix(in srgb, ${color} ${l * 100}%, #1b1b1c)` }}
            />
          ))}
          больше
        </span>
      </div>
    </div>
  );
}
