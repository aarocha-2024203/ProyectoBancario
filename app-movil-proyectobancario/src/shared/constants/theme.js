// src/shared/constants/theme.js
import { Platform } from 'react-native';

export const COLORS = {
  primary: '#08316D',
  primaryLight: '#0a4a9e',
  primaryDark: '#03193a',
  primaryDeep: '#020f25',
  accent: '#00BCD4',
  accentDark: '#0097a7',
  accentLight: 'rgba(0,188,212,0.15)',
  gold: '#B8860B',
  goldLight: '#DAA520',
  background: '#f0f4f8',
  surface: '#ffffff',
  surfaceAlpha: 'rgba(255,255,255,0.08)',
  surfaceAlpha2: 'rgba(255,255,255,0.15)',
  text: '#0f172a',
  textLight: '#64748b',
  textMuted: '#94a3b8',
  textOnDark: '#ffffff',
  textOnDarkMuted: 'rgba(255,255,255,0.5)',
  textOnDarkLight: 'rgba(255,255,255,0.85)',
  error: '#ef4444',
  errorLight: '#fef2f2',
  errorOnDark: '#ff6b6b',
  success: '#10b981',
  successLight: '#f0fdf4',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  border: '#e2e8f0',
  borderOnDark: 'rgba(255,255,255,0.15)',
  borderFocus: '#00BCD4',
  disabled: '#cbd5e1',
  overlay: 'rgba(0,0,0,0.5)',
  secondary: '#64748b',
  // Dashboard
  cardBg: '#ffffff',
  dashBg: '#f0f4f8',
  statCard: '#ffffff',
};

export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64,
};

export const FONT_SIZE = {
  xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 30, display: 38,
};

export const FONT_WEIGHT = {
  regular: '400', medium: '500', semibold: '600', bold: '700',
};

export const BORDER_RADIUS = {
  sm: 6, md: 10, lg: 16, xl: 24, full: 9999,
};

const isWeb = Platform.OS === 'web';

export const SHADOWS = {
  sm: isWeb
    ? { boxShadow: '0px 1px 3px rgba(0,0,0,0.08)' }
    : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  md: isWeb
    ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.10)' }
    : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 },
  lg: isWeb
    ? { boxShadow: '0px 8px 24px rgba(8,49,109,0.15)' }
    : { shadowColor: '#08316D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  accent: isWeb
    ? { boxShadow: '0px 4px 16px rgba(0,188,212,0.35)' }
    : { shadowColor: '#00BCD4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
};
