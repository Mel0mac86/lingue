import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { AgeBand } from '../types';

/**
 * Duolingo-inspired palette: bold flat colours, white surfaces, chunky
 * rounded corners and "3D" buttons (solid fill + darker bottom edge).
 */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  /** Main CTA green (feather). */
  primary: string;
  primaryEdge: string;
  /** Secondary actions (macaw blue). */
  blue: string;
  blueEdge: string;
  teal: string;
  tealSoft: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  successSoft: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  gold: string;
  onPrimary: string;
  locked: string;
}

const light: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F7',
  primary: '#58CC02',
  primaryEdge: '#46A302',
  blue: '#1CB0F6',
  blueEdge: '#1899D6',
  teal: '#00CD9C',
  tealSoft: '#D7FFF1',
  text: '#3C3C3C',
  textMuted: '#777777',
  border: '#E5E5E5',
  success: '#58CC02',
  successSoft: '#D7FFB8',
  warning: '#FFC800',
  danger: '#FF4B4B',
  dangerSoft: '#FFDFE0',
  gold: '#FFC800',
  onPrimary: '#FFFFFF',
  locked: '#E5E5E5',
};

const dark: ThemeColors = {
  background: '#131F24',
  surface: '#1B2A32',
  surfaceAlt: '#233842',
  primary: '#58CC02',
  primaryEdge: '#3E9A02',
  blue: '#1CB0F6',
  blueEdge: '#1487BD',
  teal: '#2DD4BF',
  tealSoft: '#12403B',
  text: '#F1F7FB',
  textMuted: '#9DB2BD',
  border: '#37505C',
  success: '#79E135',
  successSoft: '#20390D',
  warning: '#FFC800',
  danger: '#FF6B6B',
  dangerSoft: '#4A1F22',
  gold: '#FFD335',
  onPrimary: '#FFFFFF',
  locked: '#37505C',
};

/** Cycling accent colours for path units, Duolingo-style. */
export const UNIT_COLORS = [
  { main: '#58CC02', edge: '#46A302' }, // green
  { main: '#1CB0F6', edge: '#1899D6' }, // blue
  { main: '#CE82FF', edge: '#A568CC' }, // purple
  { main: '#FF9600', edge: '#CC7800' }, // orange
  { main: '#00CD9C', edge: '#00A47D' }, // teal
  { main: '#FF86D0', edge: '#D66BAE' }, // pink
  { main: '#FF4B4B', edge: '#D63C3C' }, // red
  { main: '#FFC800', edge: '#D6A800' }, // yellow
];

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
