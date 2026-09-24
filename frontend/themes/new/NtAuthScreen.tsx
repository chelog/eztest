'use client';

import * as React from 'react';
import { Eye, EyeOff, FlaskConical, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UiThemePicker } from '@/frontend/reusable-components/layout/UiThemePicker';

/**
 * Partner projects shown at the bottom of the auth screen.
 * `logo` is a path under /public; while it is missing the name is shown as a wordmark.
 */
// height / offsetY tuned per logo so they read as the same visual size on one center line
// (GTA5RP carries a star above the text, Majestic has a descender on the "j").
const PARTNER_BRANDS: Array<{ name: string; logo?: string; height: number; offsetY?: number }> = [
  // Letters sit at 47–73 of 76px in the PNG (star above): lift so the text line is centered
  { name: 'GTA5RP', logo: '/brands/gta5rp.png', height: 40, offsetY: -12 },
  { name: 'Majestic RP', logo: '/brands/majestic.svg', height: 23, offsetY: 2 },
  { name: 'Россия Онлайн', logo: '/brands/russia-online.svg', height: 19 },
];

// Faint repeated flask pattern for the page background (inline SVG, no extra request)
const PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M26 18v10L18 44a3 3 0 0 0 2.7 4.3h22.6A3 3 0 0 0 46 44l-8-16V18"/><path d="M23 18h18"/></svg>'
)}")`;

interface NtAuthScreenProps {
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Auth layout of the new theme: centered minimal form over the flask pattern, partner logos at the bottom. */
export function NtAuthScreen({ subtitle, children, footer }: NtAuthScreenProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--nt-bg)] overflow-hidden">
      {/* Flask pattern that fades out towards the center, keeping the form area clean */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: PATTERN,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 620px 520px at 50% 46%, transparent 35%, black 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 620px 520px at 50% 46%, transparent 35%, black 85%)',
        }}
        aria-hidden="true"
      />
      {/* Soft red glow behind the form */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(480px 380px at 50% 42%, color-mix(in srgb, var(--nt-accent) 12%, transparent), transparent 70%)' }}
        aria-hidden="true"
      />

      <main className="relative flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-3">
              <FlaskConical className="w-9 h-9 text-[var(--nt-brand)]" strokeWidth={2} />
              <span
                className="text-[34px] leading-none font-bold text-white"
                style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.02em' }}
              >
                EZTest
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--nt-text-2)]">{subtitle}</p>
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-[var(--nt-text-3)]">{footer}</div>}
          <div className="mt-10 flex justify-center">
            <UiThemePicker variant="inline" />
          </div>
        </div>
      </main>

      <footer
        className="relative pt-12 pb-8 px-6 flex flex-wrap items-center justify-center"
        style={{ gap: '12px 0', background: 'linear-gradient(to top, var(--nt-bg) 60%, transparent)' }}
      >
        {PARTNER_BRANDS.map((brand, index) => (
          <React.Fragment key={brand.name}>
            {index > 0 && <span className="mx-4 h-5 w-px bg-white/10" aria-hidden="true" />}
            {brand.logo ? (
              <span className="flex h-10 w-[150px] items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.logo}
                  alt={brand.name}
                  style={{ height: brand.height, transform: brand.offsetY ? `translateY(${brand.offsetY}px)` : undefined }}
                  className="w-auto max-w-full object-contain opacity-45 grayscale hover:grayscale-0 hover:opacity-100 transition"
                />
              </span>
            ) : (
              <span className="text-sm font-extrabold uppercase tracking-wider text-white/30 whitespace-nowrap">{brand.name}</span>
            )}
          </React.Fragment>
        ))}
      </footer>
    </div>
  );
}

interface NtAuthFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  icon: LucideIcon;
  type?: 'text' | 'email' | 'password';
  error?: string;
  /** Autocomplete options shown under the field (e.g. allowed email domains) */
  suggestions?: string[];
  onSuggestionPick?: (value: string) => void;
}

/** Auth input with a leading icon; password fields get a show/hide toggle. */
export function NtAuthField({
  icon: Icon,
  type = 'text',
  error,
  className,
  suggestions = [],
  onSuggestionPick,
  ...props
}: NtAuthFieldProps) {
  const [visible, setVisible] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const isPassword = type === 'password';
  const showSuggestions = focused && suggestions.length > 0 && !!onSuggestionPick;

  React.useEffect(() => setHighlight(0), [suggestions.length]);

  const pick = (value: string) => {
    onSuggestionPick?.(value);
    setFocused(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setHighlight((h) => (h + step + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        pick(suggestions[highlight]);
        return;
      }
      if (event.key === 'Escape') {
        setFocused(false);
        return;
      }
    }
    props.onKeyDown?.(event);
  };

  return (
    <div className="relative">
      <label
        className={cn(
          'flex items-center gap-3 h-12 px-4 rounded-[12px] bg-[var(--nt-surface-2)] border border-transparent focus-within:border-[var(--nt-border-strong)] transition-colors',
          error && 'border-red-500/40',
          className
        )}
      >
        <Icon className="w-[18px] h-[18px] shrink-0 text-[var(--nt-text-3)]" />
        <input
          {...props}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            // Delay so a click on a suggestion lands before the list closes
            setTimeout(() => setFocused(false), 120);
            props.onBlur?.(event);
          }}
          onKeyDown={onKeyDown}
          autoComplete={onSuggestionPick ? 'off' : props.autoComplete}
          type={isPassword && visible ? 'text' : type}
          data-ui="nt-auth-input"
          className="flex-1 min-w-0 bg-transparent text-[15px] text-white outline-none placeholder:text-[var(--nt-text-3)]"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="shrink-0 text-[var(--nt-text-3)] hover:text-white transition-colors cursor-pointer"
            aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {visible ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
          </button>
        )}
      </label>
      {showSuggestions && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[52px] z-20 overflow-hidden rounded-[12px] border border-white/[0.08] bg-[var(--nt-surface-2)] p-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]"
        >
          {suggestions.map((suggestion, index) => {
            const at = suggestion.indexOf('@');
            return (
              <button
                key={suggestion}
                type="button"
                role="option"
                aria-selected={index === highlight}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => pick(suggestion)}
                className={cn(
                  'flex w-full items-center rounded-[8px] px-3 h-9 text-left text-sm transition-colors cursor-pointer',
                  index === highlight ? 'bg-[var(--nt-surface-4)] text-white' : 'text-white/75'
                )}
              >
                <span className="truncate">{suggestion.slice(0, at)}</span>
                <span className="text-[var(--nt-accent)]">{suggestion.slice(at)}</span>
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="mt-1.5 px-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

/** Big full-width submit button of the auth screens. */
export function NtAuthSubmit({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full h-12 rounded-[12px] bg-[var(--nt-accent-deep)] hover:bg-[var(--nt-accent)] hover:text-[var(--nt-on-accent)] text-[15px] font-extrabold uppercase tracking-wide text-white transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}

export function NtAuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-300">{message}</div>
  );
}
