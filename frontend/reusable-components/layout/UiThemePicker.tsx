'use client';

import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiTheme } from '@/frontend/context/UiThemeContext';
import { UI_THEMES, UI_THEME_LABELS, UI_THEME_SWITCH_ENABLED } from '@/lib/ui-theme';

interface UiThemePickerProps {
  /** Icon-only button that toggles the theme (collapsed sidebar). */
  compact?: boolean;
  /** Small label-less segmented control (auth screens) */
  variant?: 'default' | 'inline';
  className?: string;
}

/**
 * Picker between the classic and the new design.
 * Renders nothing once UI_THEME_SWITCH_ENABLED is turned off.
 */
export function UiThemePicker({ compact = false, variant = 'default', className }: UiThemePickerProps) {
  const { uiTheme, setUiTheme } = useUiTheme();

  if (!UI_THEME_SWITCH_ENABLED) return null;

  if (compact) {
    const next = uiTheme === 'new' ? 'classic' : 'new';
    return (
      <button
        type="button"
        onClick={() => setUiTheme(next)}
        title={`Тема: ${UI_THEME_LABELS[uiTheme]} — переключить на «${UI_THEME_LABELS[next]}»`}
        className={cn(
          'flex items-center justify-center p-2.5 rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer',
          className
        )}
      >
        <Palette className="w-4 h-4" />
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        data-ui="theme-picker"
        title="Тема оформления"
        className={cn('inline-flex items-center gap-1 p-1 rounded-[10px] bg-white/[0.04]', className)}
      >
        <Palette className="w-3.5 h-3.5 mx-1.5 text-white/35" />
        {UI_THEMES.map((theme) => (
          <button
            key={theme}
            type="button"
            aria-pressed={uiTheme === theme}
            onClick={() => setUiTheme(theme)}
            className={cn(
              'h-7 px-3 rounded-[7px] text-xs font-semibold transition-colors cursor-pointer',
              uiTheme === theme ? 'bg-white/[0.1] text-white' : 'text-white/45 hover:text-white'
            )}
          >
            {UI_THEME_LABELS[theme]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div data-ui="theme-picker" className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5 px-1 text-[11px] uppercase tracking-wider text-white/40">
        <Palette className="w-3 h-3" />
        Тема
      </div>
      <div className="grid grid-cols-2 gap-0.5 p-0.5 rounded-[9px] bg-white/[0.04]">
        {UI_THEMES.map((theme) => {
          const active = uiTheme === theme;
          return (
            <button
              key={theme}
              type="button"
              aria-pressed={active}
              data-active={active || undefined}
              onClick={() => setUiTheme(theme)}
              className={cn(
                'h-7 px-2 rounded-[7px] text-[11px] font-semibold transition-colors cursor-pointer',
                active ? 'bg-primary text-primary-foreground' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              {UI_THEME_LABELS[theme]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
