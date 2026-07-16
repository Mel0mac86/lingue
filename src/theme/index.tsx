import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { AgeBand } from '../types';

// Palette: modern blue / teal / white as requested, with a dark counterpart.
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryDark: string;
  teal: string;
  tealSoft: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  gold: string;
  onPrimary: string;
}

const light: ThemeColors = {
  background: '#F7FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF4FB',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  teal: '#0FA3A3',
  tealSoft: '#D9F4F2',
  text: '#0F1E33',
  textMuted: '#5B6B80',
  border: '#DDE6F0',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  gold: '#EAB308',
  onPrimary: '#FFFFFF',
};

const dark: ThemeColors = {
  background: '#0B1220',
  surface: '#121C2E',
  surfaceAlt: '#1A2740',
  primary: '#4F8AFA',
  primaryDark: '#2563EB',
  teal: '#2DD4BF',
  tealSoft: '#123B3B',
  text: '#EDF2F9',
  textMuted: '#93A3B8',
  border: '#233350',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  gold: '#FACC15',
  onPrimary: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** Seniors get bigger type, kids slightly bigger and rounder UI. */
export function fontScaleFor(band: AgeBand | undefined): number {
  switch (band) {
    case 'seniors': return 1.22;
    case 'kids': return 1.08;
    default: return 1;
  }
}

export interface Theme {
  colors: ThemeColors;
  dark: boolean;
  spacing: typeof spacing;
  fontScale: number;
  radius: number;
}

const ThemeCtx = createContext<Theme>({
  colors: light, dark: false, spacing, fontScale: 1, radius: 16,
});

export function ThemeProvider({
  mode, ageBand, children,
}: {
  mode: 'light' | 'dark' | 'system';
  ageBand?: AgeBand;
  children: React.ReactNode;
}) {
  const system = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  const value = useMemo<Theme>(() => ({
    colors: isDark ? dark : light,
    dark: isDark,
    spacing,
    fontScale: fontScaleFor(ageBand),
    radius: ageBand === 'kids' ? 22 : 16,
  }), [isDark, ageBand]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
