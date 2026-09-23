'use client';

import * as React from 'react';

export interface RingItem {
  label: string;
  value: number;
  color: string;
}

/**
 * Concentric progress rings — one ring per item, arc length = share of the total.
 * Mirrors the "исходы" ring chart from the reference design.
 */
export function RingsChart({ items, size = 260, centerLabel }: { items: RingItem[]; size?: number; centerLabel?: React.ReactNode }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const stroke = 14;
  const gap = 8;
  const center = size / 2;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {items.map((item, index) => {
          const r = center - stroke / 2 - index * (stroke + gap);
          if (r <= stroke) return null;
          const circumference = 2 * Math.PI * r;
          const share = total > 0 ? item.value / total : 0;
          return (
            <g key={item.label} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}>
              <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={item.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(share * circumference, share > 0 ? 0.1 : 0)} ${circumference}`}
                opacity={hover === null || hover === index ? 1 : 0.35}
                className="transition-[stroke-dasharray,opacity] duration-500"
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {hover !== null ? (
          <>
            <span className="text-2xl font-extrabold text-white tabular-nums">{items[hover].value}</span>
            <span className="text-xs text-white/55">{items[hover].label}</span>
          </>
        ) : (
          centerLabel
        )}
      </div>
    </div>
  );
}
