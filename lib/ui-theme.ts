/**
 * UI theme (visual design) selection.
 *
 * Two designs live side by side during the transition:
 *  - 'classic' — the original glass design (current default for everyone)
 *  - 'new'     — the new solid dark design (frontend/themes/new)
 *
 * Rolling the new design out to everyone:
 *  1. Set DEFAULT_UI_THEME = 'new' and UI_THEME_SWITCH_ENABLED = false.
 *  2. Later, delete the `classic` branches (search for `isNewTheme` / `useIsNewTheme`)
 *     and the classic-only styles; the new design then becomes the only one.
 *
 * The choice is stored per browser in a cookie so the server renders the right
 * design on the first paint (no flash of the other theme).
 */

export const UI_THEMES = ['classic', 'new'] as const;
export type UiTheme = (typeof UI_THEMES)[number];

/** Theme used when the user has not chosen one. Flip to 'new' to roll out. */
export const DEFAULT_UI_THEME: UiTheme = 'classic';

/** Show the theme picker in the sidebar. Turn off once the classic theme is removed. */
export const UI_THEME_SWITCH_ENABLED = true;

export const UI_THEME_COOKIE = 'eztest-ui-theme';

export const UI_THEME_LABELS: Record<UiTheme, string> = {
  classic: 'Классическая',
  new: 'Новая',
};

export function resolveUiTheme(value: string | null | undefined): UiTheme {
  if (!UI_THEME_SWITCH_ENABLED) return DEFAULT_UI_THEME;
  return (UI_THEMES as readonly string[]).includes(value ?? '') ? (value as UiTheme) : DEFAULT_UI_THEME;
}

/** Accent color of the new theme (user-selectable in the sidebar). */
export const UI_ACCENTS = ['emerald', 'graphite', 'red', 'blue'] as const;
export type UiAccent = (typeof UI_ACCENTS)[number];

export const DEFAULT_UI_ACCENT: UiAccent = 'emerald';
export const UI_ACCENT_COOKIE = 'eztest-ui-accent';

export const UI_ACCENT_OPTIONS: Record<UiAccent, { label: string; swatch: string }> = {
  emerald: { label: 'Изумрудный', swatch: '#159a6e' },
  graphite: { label: 'Графит', swatch: '#e6e6e6' },
  red: { label: 'Красный', swatch: '#b8332f' },
  blue: { label: 'Синий', swatch: '#3b7ddd' },
};

export function resolveUiAccent(value: string | null | undefined): UiAccent {
  return (UI_ACCENTS as readonly string[]).includes(value ?? '') ? (value as UiAccent) : DEFAULT_UI_ACCENT;
}
