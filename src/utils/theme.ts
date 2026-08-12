import type { ThemeColor } from '../types';

export interface ThemeConfig {
  id: ThemeColor;
  name: string;
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  primaryBorder: string;
  primaryLightBg: string;
  hexPrimary: [number, number, number]; // RGB array for jsPDF
  hexAccent: string; // Hex string
  hexHover: string;
  hexLight: string;
}

export const THEMES: Record<ThemeColor, ThemeConfig> = {
  blue: {
    id: 'blue',
    name: 'Blu Istituzionale',
    primaryBg: 'bg-blue-600',
    primaryHoverBg: 'hover:bg-blue-700',
    primaryText: 'text-blue-600',
    primaryBorder: 'border-blue-600',
    primaryLightBg: 'bg-blue-50',
    hexPrimary: [37, 99, 235],
    hexAccent: '#2563eb',
    hexHover: '#1d4ed8',
    hexLight: '#eff6ff',
  },
  emerald: {
    id: 'emerald',
    name: 'Verde Smeraldo',
    primaryBg: 'bg-emerald-600',
    primaryHoverBg: 'hover:bg-emerald-700',
    primaryText: 'text-emerald-600',
    primaryBorder: 'border-emerald-600',
    primaryLightBg: 'bg-emerald-50',
    hexPrimary: [5, 150, 105],
    hexAccent: '#059669',
    hexHover: '#047857',
    hexLight: '#ecfdf5',
  },
  violet: {
    id: 'violet',
    name: 'Viola Elegante',
    primaryBg: 'bg-violet-600',
    primaryHoverBg: 'hover:bg-violet-700',
    primaryText: 'text-violet-600',
    primaryBorder: 'border-violet-600',
    primaryLightBg: 'bg-violet-50',
    hexPrimary: [124, 58, 237],
    hexAccent: '#7c3aed',
    hexHover: '#6d28d9',
    hexLight: '#f5f3ff',
  },
  slate: {
    id: 'slate',
    name: 'Grigio Ardesia',
    primaryBg: 'bg-slate-700',
    primaryHoverBg: 'hover:bg-slate-800',
    primaryText: 'text-slate-700',
    primaryBorder: 'border-slate-700',
    primaryLightBg: 'bg-slate-100',
    hexPrimary: [51, 65, 85],
    hexAccent: '#334155',
    hexHover: '#1e293b',
    hexLight: '#f1f5f9',
  },
  rose: {
    id: 'rose',
    name: 'Bordeaux Rose',
    primaryBg: 'bg-rose-700',
    primaryHoverBg: 'hover:bg-rose-800',
    primaryText: 'text-rose-700',
    primaryBorder: 'border-rose-700',
    primaryLightBg: 'bg-rose-50',
    hexPrimary: [190, 18, 60],
    hexAccent: '#be123c',
    hexHover: '#9f1239',
    hexLight: '#fff1f2',
  },
};

export function getTheme(themeColor?: ThemeColor): ThemeConfig {
  return THEMES[themeColor || 'blue'] || THEMES.blue;
}

export function applyThemeToDOM(themeColor?: ThemeColor): void {
  if (typeof document === 'undefined') return;
  const theme = getTheme(themeColor);
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.hexAccent);
  root.style.setProperty('--color-primary-hover', theme.hexHover);
  root.style.setProperty('--color-primary-light', theme.hexLight);
  root.setAttribute('data-theme', theme.id);
}
