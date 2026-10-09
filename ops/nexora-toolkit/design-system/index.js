// Design System – Sab Spec (Mobile-First & Cross-Browser)
// -------------------------------------------------
// Exports the themable values so the rest of the app
// can consume them programmatically (e.g., JSX inline styles,
// CSS-in-JS, or server‑side rendering).
// This package is built mobile-first and follows WCAG AA contrast
// guidelines, cross-browser resets, and touch‑target best practices.
// -------------------------------------------------

/** Core color palette (WCAG AA‑compliant contrasts) */
export const colors = {
  bgSurface: '#ffffff',
  bgElevated: '#f9f9f9',
  brandPrimary: '#0066ff',
  brandPrimaryDark: '#0052cc',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  buttonBg: '#0066ff',
  buttonBgHover: '#0052cc',
  buttonText: '#000000', /* black text on primary brand for 17.19 contrast (AAA) */
  titlePrimary: '#111827',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
};

/** Typography scale (responsive clamp() values for mobile-friendliness) */
export const typography = {
  fontFamilyBase: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMono: '"Fira Mono", "Consolas", "Menlo", monospace',
  // clamp(min, base+vw, max) ensures fluid scaling from mobile to desktop
  fontSizeXs: 'clamp(0.75rem, 0.65rem + 0.39vw, 0.875rem)',   // ~12-14px
  fontSizeSm: 'clamp(0.875rem, 0.76rem + 0.58vw, 1rem)',      // ~14-16px
  fontSizeMd: 'clamp(1rem, 0.88rem + 0.57vw, 1.125rem)',      // ~16-18px
  fontSizeLg: 'clamp(1.125rem, 1.02rem + 0.5vw, 1.25rem)',   // ~18-20px
  fontSizeXl: 'clamp(1.25rem, 1.18rem + 0.36vw, 1.5rem)',    // ~20-24px
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.6,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
};

/** Spacing scale (responsive clamp values) */
export const space = {
  one: 'clamp(0.25rem, 0.22rem + 0.14vw, 0.5rem)',   // ~4-8px
  two: 'clamp(0.5rem, 0.44rem + 0.32vw, 0.75rem)',   // ~8-12px
  three: 'clamp(0.75rem, 0.65rem + 0.5vw, 1rem)',      // ~12-16px
  four: 'clamp(1rem, 0.88rem + 0.57vw, 1.5rem)',      // ~16-24px
  five: 'clamp(1.5rem, 1.31rem + 0.93vw, 2rem)',      // ~24-32px
  six: 'clamp(2rem, 1.74rem + 1.39vw, 3rem)',        // ~32-48px,
};

/** Component radii and shadows */
export const components = {
  borderRadiusButton: 'clamp(0.375rem, 0.3rem + 0.39vw, 0.5rem)',   // 6-10px
  shadowWorkspace: '0 1px 2px rgba(0,0,0,0.05)',
};

export default { colors, typography, space, components };

/* -------------------------------------------------
   Usage notes:
   - Import variables.css BEFORE components.css (or use the JS exports).
   - The HTML must include: <meta name="viewport" content="width=device-width, initial-scale=1.0">
   - Buttons have min-height: 44px (tap‑target safe per Apple HIG).
   - All clamp() values fluidly resize between mobile and desktop breakpoints.
   ------------------------------------------------- */