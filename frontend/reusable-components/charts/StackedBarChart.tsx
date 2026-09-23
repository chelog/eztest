'use client';

import * as React from 'react';
import { AXIS_TEXT_COLOR, GRID_COLOR } from './chartColors';

export interface StackedSeries {
  key: string;
  label: string;
  color: string;
}

export interface StackedDatum {
  label: string;
  /** Tooltip heading (defaults to label) */
  title?: string;
  values: Record<string, number>;
}

interface StackedBarChartProps {
  data: StackedDatum[];
  series: StackedSeries[];
  height?: number;
  /** Rotate x-axis labels (for long names) */
  rotateLabels?: boolean;
  /** Show every n-th x label (dense day axes) */
  labelEvery?: number;
  emptyText?: string;
}

function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => value / s <= 4) ?? magnitude * 10;
  return Math.ceil(value / step) * step;
}

/** Vertical stacked bars with y-grid and a hover tooltip. */
export function StackedBarChart({
  data,
  series,
  height = 240,
  rotateLabels = false,
  labelEvery = 1,
  emptyText = 'Нет данных за период',
}: StackedBarChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(600);
  const [hover, setHover] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const totals = data.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0));
  const max = niceMax(Math.max(0, ...totals));
  const hasData = totals.some((t) => t > 0);

  const axisWidth = 32;
  const bottom = rotateLabels ? 64 : 26;
  const top = 8;
  const plotW = Math.max(width - axisWidth, 10);
  const plotH = height - bottom - top;
  const slot = plotW / Math.max(data.length, 1);
  const barW = Math.max(4, Math.min(28, slot * 0.55));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <div ref={containerRef} className="relative w-full select-none" style={{ height }}>
      <svg width={width} height={height} className="block overflow-visible">
        {ticks.map((tick) => {
          const y = top + plotH - (tick / max) * plotH;
          return (
            <g key={tick}>
              <line x1={axisWidth} x2={width} y1={y} y2={y} stroke={GRID_COLOR} strokeDasharray="3 4" />
              <text x={axisWidth - 8} y={y + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT_COLOR}>
                {tick}
              </text>
            </g>
          );
        })}
        {data.map((datum, i) => {
          const cx = axisWidth + slot * i + slot / 2;
          let y = top + plotH;
          const isHover = hover === i;
          return (
            <g key={`${datum.label}-${i}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={cx - slot / 2} y={top} width={slot} height={plotH} fill={isHover ? 'rgba(255,255,255,0.035)' : 'transparent'} />
              {series.map((s, si) => {
                const value = datum.values[s.key] ?? 0;
                if (!value) return null;
                const h = (value / max) * plotH;
                y -= h;
                const isTop = series.slice(si + 1).every((next) => !(datum.values[next.key] ?? 0));
                return (
                  <rect
                    key={s.key}
                    x={cx - barW / 2}
                    y={y}
                    width={barW}
                    height={Math.max(h, 1)}
                    rx={isTop ? Math.min(4, barW / 3) : 0}
                    fill={s.color}
                    opacity={hover === null || isHover ? 1 : 0.55}
                  />
                );
              })}
              {i % labelEvery === 0 && (
                <text
                  x={cx}
                  y={top + plotH + 16}
                  fontSize={11}
                  fill={AXIS_TEXT_COLOR}
                  textAnchor={rotateLabels ? 'end' : 'middle'}
                  transform={rotateLabels ? `rotate(-40 ${cx} ${top + plotH + 12})` : undefined}
                >
                  {datum.label.length > 16 ? `${datum.label.slice(0, 15)}…` : datum.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40" style={{ paddingBottom: bottom }}>
          {emptyText}
        </div>
      )}

      {hover !== null && hasData && (
        <div
          className="pointer-events-none absolute z-10 min-w-[150px] rounded-[12px] border border-white/10 bg-[#1b1b1c] px-3.5 py-2.5 shadow-xl"
          style={{
            left: Math.min(axisWidth + slot * hover + slot / 2 + 12, width - 170),
            top: 8,
          }}
        >
          <div className="text-sm font-bold text-white mb-1.5">{data[hover].title ?? data[hover].label}</div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-4 text-xs leading-5">
              <span className="flex items-center gap-1.5 text-white/60">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="font-semibold text-white tabular-nums">{data[hover].values[s.key] ?? 0}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
