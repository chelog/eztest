import { cva } from 'class-variance-authority';

/**
 * New-theme counterpart of `buttonVariants` (reusable-elements/buttons/Button).
 * Same variant/size names so every existing <Button variant="glass"…> maps 1:1.
 */
export const ntButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--nt-radius-sm)] text-sm font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--nt-accent)]/50 cursor-pointer",
  {
    variants: {
      variant: {
        default: 'bg-[var(--nt-accent)] text-[var(--nt-on-accent)] hover:bg-[var(--nt-accent-hover)]',
        accent: 'bg-[var(--nt-surface-3)] text-[var(--nt-amber)] hover:bg-[var(--nt-surface-4)]',
        destructive: 'bg-[var(--nt-red-deep)] text-[#ffb4b0] hover:bg-[var(--nt-red-deep-hover)] hover:text-white',
        outline: 'border border-[var(--nt-border-strong)] bg-transparent text-[var(--nt-text)] hover:bg-[var(--nt-surface-3)]',
        secondary: 'bg-[var(--nt-surface-3)] text-[var(--nt-text)] hover:bg-[var(--nt-surface-4)]',
        ghost: 'text-[var(--nt-text-2)] hover:text-white hover:bg-[var(--nt-surface-3)]',
        link: 'text-[var(--nt-blue)] underline-offset-4 hover:underline',
        glass: 'bg-[var(--nt-surface-2)] text-[var(--nt-text)] hover:bg-[var(--nt-surface-4)]',
        'glass-primary': 'bg-[var(--nt-accent)] text-[var(--nt-on-accent)] hover:bg-[var(--nt-accent-hover)]',
        'glass-accent': 'bg-[var(--nt-surface-3)] text-[var(--nt-amber)] hover:bg-[var(--nt-surface-4)]',
        'glass-destructive': 'bg-[var(--nt-red-deep)] text-[#ffb4b0] hover:bg-[var(--nt-red-deep-hover)] hover:text-white',
        'glass-blue': 'bg-[var(--nt-surface-3)] text-[var(--nt-blue)] hover:bg-[var(--nt-surface-4)]',
        'glass-orange': 'bg-[var(--nt-surface-3)] text-[var(--nt-orange)] hover:bg-[var(--nt-surface-4)]',
      },
      size: {
        // One height for regular buttons so mixed toolbars line up
        default: 'h-9 px-4 text-[13px]',
        sm: 'h-9 gap-1.5 px-3 text-[13px]',
        lg: 'h-11 px-6 text-sm',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
