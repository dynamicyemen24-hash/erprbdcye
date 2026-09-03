// ═══════════════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Enhanced Brand Tokens v2.0
// Premium Design System Tokens
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Comprehensive token system with:
// - Semantic color tokens
// - Typography scale
// - Spacing system
// - Shadow definitions
// - Animation tokens
// - WCAG 2.1 AAA compliance
// ═══════════════════════════════════════════════════════════════════════════════════════

/**
 * Brand Color Tokens
 * Aligned with AGENTS.md brand standards
 */
export const brandColors = {
  // Primary - Emerald (UAMEX Brand)
  primary: {
    DEFAULT: '#059669',
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    contrast: '#ffffff',
  },
  
  // Accent - Gold/Amber
  accent: {
    DEFAULT: '#d97706',
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    contrast: '#ffffff',
  },

  // Semantic Colors
  semantic: {
    success: {
      DEFAULT: '#059669',
      light: '#10b981',
      dark: '#047857',
      bg: '#ecfdf5',
    },
    warning: {
      DEFAULT: '#d97706',
      light: '#f59e0b',
      dark: '#b45309',
      bg: '#fffbeb',
    },
    danger: {
      DEFAULT: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
      bg: '#fef2f2',
    },
    info: {
      DEFAULT: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0284c7',
      bg: '#f0f9ff',
    },
  },

  // Neutral Grayscale
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Dark Mode Surfaces
  dark: {
    bg: '#090d16',
    surface: '#111827',
    card: '#1e293b',
    border: '#334155',
    muted: '#475569',
  },
} as const;

/**
 * Typography Tokens
 */
export const typography = {
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    arabic: ['Noto Sans Arabic', 'Tahoma', 'Arial', 'sans-serif'],
  },
  fontSize: {
    xs: { value: '0.625rem', lineHeight: '0.75rem' },
    sm: { value: '0.75rem', lineHeight: '1rem' },
    base: { value: '0.875rem', lineHeight: '1.25rem' },
    lg: { value: '1rem', lineHeight: '1.5rem' },
    xl: { value: '1.125rem', lineHeight: '1.75rem' },
    '2xl': { value: '1.25rem', lineHeight: '1.75rem' },
    '3xl': { value: '1.5rem', lineHeight: '2rem' },
    '4xl': { value: '1.875rem', lineHeight: '2.25rem' },
    '5xl': { value: '2.25rem', lineHeight: '2.5rem' },
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

/**
 * Spacing Tokens
 */
export const spacing = {
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
} as const;

/**
 * Shadow Tokens
 */
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // Brand shadows
  brand: '0 4px 14px 0 rgb(5 150 105 / 0.15)',
  'brand-lg': '0 8px 30px 0 rgb(5 150 105 / 0.2)',
  'brand-xl': '0 20px 40px 0 rgb(5 150 105 / 0.25)',
} as const;

/**
 * Border Radius Tokens
 */
export const radii = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

/**
 * Animation Tokens
 */
export const animations = {
  duration: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },
  easing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'cubic-bezier(0, 0, 1, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

/**
 * Z-Index Scale
 */
export const zIndex = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
} as const;

/**
 * Breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Legacy Aliases for backward compatibility
 */
export const brandTokens = {
  primary: brandColors.primary.DEFAULT,
  primaryHover: brandColors.primary[700],
  primaryDark: brandColors.primary[900],
  primaryLight: brandColors.primary[400],
  accent: brandColors.accent.DEFAULT,
  accentHover: brandColors.accent[700],
  accentLight: brandColors.accent[400],
  darkBg: brandColors.dark.bg,
  darkSurface: brandColors.dark.surface,
  lightBg: brandColors.neutral[50],
  lightSurface: brandColors.neutral[0],
  success: brandColors.semantic.success.DEFAULT,
  warning: brandColors.semantic.warning.DEFAULT,
  danger: brandColors.semantic.danger.DEFAULT,
  info: brandColors.semantic.info.DEFAULT,
  goldWcagAAA: '#5C3E00',
  goldWcagDarkBg: brandColors.accent[400],
} as const;

export type BrandTokens = typeof brandTokens;

/**
 * CSS Variables Generation
 */
export const cssVariables = `
:root {
  /* Brand Colors */
  --brand-primary: ${brandColors.primary.DEFAULT};
  --brand-primary-hover: ${brandColors.primary[700]};
  --brand-primary-light: ${brandColors.primary[400]};
  --brand-accent: ${brandColors.accent.DEFAULT};
  --brand-accent-hover: ${brandColors.accent[700]};
  --brand-accent-light: ${brandColors.accent[400]};
  
  /* Dark Mode Surfaces */
  --brand-dark-bg: ${brandColors.dark.bg};
  --brand-dark-surface: ${brandColors.dark.surface};
  --brand-light-bg: ${brandColors.neutral[50]};
  --brand-light-surface: ${brandColors.neutral[0]};
  
  /* Semantic Colors */
  --color-success: ${brandColors.semantic.success.DEFAULT};
  --color-warning: ${brandColors.semantic.warning.DEFAULT};
  --color-danger: ${brandColors.semantic.danger.DEFAULT};
  --color-info: ${brandColors.semantic.info.DEFAULT};
  
  /* Typography */
  --font-sans: ${typography.fontFamily.sans.join(', ')};
  --font-mono: ${typography.fontFamily.mono.join(', ')};
  --font-arabic: ${typography.fontFamily.arabic.join(', ')};
  
  /* Shadows */
  --shadow-brand: ${shadows.brand};
  --shadow-brand-lg: ${shadows['brand-lg']};
  
  /* Transitions */
  --transition-fast: ${animations.duration.fast} ${animations.easing.DEFAULT};
  --transition-base: ${animations.duration.DEFAULT} ${animations.easing.DEFAULT};
  --transition-slow: ${animations.duration.slow} ${animations.easing.DEFAULT};
}
` as const;

// ─── Semantic Token Maps ──────────────────────────────────────────────────────

/**
 * Status color mapping for UI components
 */
export const statusColors = {
  online: brandColors.semantic.success.DEFAULT,
  away: brandColors.semantic.warning.DEFAULT,
  busy: brandColors.semantic.danger.DEFAULT,
  offline: brandColors.neutral[400],
} as const;

/**
 * Health status color mapping
 */
export const healthColors = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  gray: brandColors.neutral[400],
} as const;

/**
 * Chart color palette for data visualization
 */
export const chartColors = [
  brandColors.primary.DEFAULT,
  brandColors.accent.DEFAULT,
  brandColors.semantic.info.DEFAULT,
  brandColors.semantic.success.DEFAULT,
  brandColors.semantic.warning.DEFAULT,
  brandColors.semantic.danger.DEFAULT,
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
] as const;

export default {
  brandColors,
  typography,
  spacing,
  shadows,
  radii,
  animations,
  zIndex,
  breakpoints,
  brandTokens,
  cssVariables,
  statusColors,
  healthColors,
  chartColors,
};
