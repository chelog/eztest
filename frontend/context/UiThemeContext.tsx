'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { UI_ACCENT_COOKIE, UI_THEME_COOKIE, type UiAccent, type UiTheme } from '@/lib/ui-theme';

interface UiThemeContextValue {
  uiTheme: UiTheme;
  setUiTheme: (theme: UiTheme) => void;
  uiAccent: UiAccent;
  setUiAccent: (accent: UiAccent) => void;
}

const UiThemeContext = createContext<UiThemeContextValue | undefined>(undefined);

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function UiThemeProvider({
  initialTheme,
  initialAccent,
  children,
}: {
  initialTheme: UiTheme;
  initialAccent: UiAccent;
  children: ReactNode;
}) {
  const [uiTheme, setUiThemeState] = useState<UiTheme>(initialTheme);
  const [uiAccent, setUiAccentState] = useState<UiAccent>(initialAccent);

  const setUiTheme = useCallback((theme: UiTheme) => {
    setUiThemeState(theme);
    document.documentElement.dataset.theme = theme;
    document.cookie = `${UI_THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }, []);

  const setUiAccent = useCallback((accent: UiAccent) => {
    setUiAccentState(accent);
    document.documentElement.dataset.accent = accent;
    document.cookie = `${UI_ACCENT_COOKIE}=${accent}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }, []);

  const value = useMemo(
    () => ({ uiTheme, setUiTheme, uiAccent, setUiAccent }),
    [uiTheme, setUiTheme, uiAccent, setUiAccent]
  );

  return <UiThemeContext.Provider value={value}>{children}</UiThemeContext.Provider>;
}

export function useUiTheme() {
  const context = useContext(UiThemeContext);
  if (!context) {
    throw new Error('useUiTheme must be used within UiThemeProvider');
  }
  return context;
}

/** True when the new design is active. Remove call sites' classic branches when rolling out. */
export function useIsNewTheme() {
  return useUiTheme().uiTheme === 'new';
}
