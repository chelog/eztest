'use client';

import { SessionProvider } from 'next-auth/react';
import { SidebarProvider } from '@/lib/sidebar-context';
import { TimezoneProvider } from '@/frontend/context/TimezoneContext';
import { ThemeProvider } from '@/app/components/layout/ThemeProvider';
import { FirebaseAnalytics } from './FirebaseAnalytics';
import { UiThemeProvider } from '@/frontend/context/UiThemeContext';
import type { UiAccent, UiTheme } from '@/lib/ui-theme';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
  uiTheme: UiTheme;
  uiAccent: UiAccent;
}

export function Providers({ children, uiTheme, uiAccent }: ProvidersProps) {
  return (
    <SessionProvider>
      <UiThemeProvider initialTheme={uiTheme} initialAccent={uiAccent}>
      <ThemeProvider>
        <TimezoneProvider>
          <SidebarProvider>
            <FirebaseAnalytics />
            {children}
          </SidebarProvider>
        </TimezoneProvider>
      </ThemeProvider>
      </UiThemeProvider>
    </SessionProvider>
  );
}
