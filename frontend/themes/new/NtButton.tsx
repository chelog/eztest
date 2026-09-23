'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type NtButtonTone = 'primary' | 'soft' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type NtButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface NtButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: NtButtonTone;
  size?: NtButtonSize;
}

const toneClasses: Record<NtButtonTone, string> = {
  primary: 'bg-[var(--nt-accent)] text-[var(--nt-on-accent)] hover:bg-[var(--nt-accent-hover)]',
  soft: 'bg-[var(--nt-accent-deep)] text-white/90 hover:bg-[var(--nt-accent-deep-hover)]',
  secondary: 'bg-[var(--nt-surface-3)] text-[var(--nt-text)] hover:bg-[var(--nt-surface-4)]',
  outline: 'bg-transparent text-[var(--nt-text)] border border-[var(--nt-border-strong)] hover:bg-[var(--nt-surface-3)]',
  ghost: 'bg-transparent text-[var(--nt-text-2)] hover:text-[var(--nt-text)] hover:bg-[var(--nt-surface-3)]',
  danger: 'bg-[var(--nt-red-deep)] text-[#ffb4b0] hover:bg-[var(--nt-red-deep-hover)] hover:text-white',
};

const sizeClasses: Record<NtButtonSize, string> = {
  // Same height as default so mixed toolbars line up
  sm: 'h-9 px-3 text-[13px] rounded-[var(--nt-radius-sm)]',
  default: 'h-9 px-4 text-[13px] rounded-[var(--nt-radius-sm)]',
  lg: 'h-11 px-6 text-sm rounded-[12px]',
  icon: 'h-9 w-9 p-0 rounded-[var(--nt-radius-sm)]',
};

/** Solid button of the new theme. Used by ButtonPrimary/Secondary/Destructive when the new theme is on. */
export const NtButton = React.forwardRef<HTMLButtonElement, NtButtonProps>(
  ({ tone = 'primary', size = 'default', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      data-nt-button={tone}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[0.01em] cursor-pointer',
        'transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--nt-accent)]/50',
        'disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        toneClasses[tone],
        sizeClasses[size],
        className
      )}
      suppressHydrationWarning
      {...props}
    />
  )
);
NtButton.displayName = 'NtButton';
