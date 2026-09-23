'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiTheme } from '@/frontend/context/UiThemeContext';
import { UI_ACCENTS, UI_ACCENT_OPTIONS } from '@/lib/ui-theme';

/** Accent color picker of the new theme (sidebar bottom). */
export function AccentPicker({ className }: { className?: string }) {
  const { uiAccent, setUiAccent } = useUiTheme();

  return (
    <div data-ui="accent-picker" className={cn('flex items-center justify-between gap-2 px-1', className)}>
      <span className="text-[11px] uppercase tracking-wider text-white/40">Цвет</span>
      <div className="flex items-center gap-2">
        {UI_ACCENTS.map((accent) => {
          const { label, swatch } = UI_ACCENT_OPTIONS[accent];
          const active = accent === uiAccent;
          return (
            <button
              key={accent}
              type="button"
              onClick={() => setUiAccent(accent)}
              title={label}
              aria-label={`Цвет: ${label}`}
              aria-pressed={active}
              className={cn(
                'w-[18px] h-[18px] rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110',
                active && 'ring-[1.5px] ring-white/60 ring-offset-2 ring-offset-[var(--nt-surface-1)]'
              )}
              style={{ backgroundColor: swatch }}
            >
              {active && <Check className="w-3 h-3" strokeWidth={3} style={{ color: accent === 'graphite' ? '#111' : '#fff' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
