/**
 * UI theme (visual design).
 *
 * The new solid dark design (frontend/themes/new) is the only theme for everyone:
 * the switch is off, so a stored 'classic' cookie is ignored and every page renders the new theme.
 *
 * Remaining cleanup: delete the `classic` branches (search for `isNewTheme` / `useIsNewTheme`)
 * and the classic-only styles.
 */

export const UI_THEMES = ['classic', 'new'] as const;
export type UiTheme = (typeof UI_THEMES)[number];

/** Theme used when the user has not chosen one. Flip to 'new' to roll out. */
export const DEFAULT_UI_THEME: UiTheme = 'new';

/** Show the theme picker in the sidebar. Turn off once the classic theme is removed. */
export const UI_THEME_SWITCH_ENABLED = false;

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
