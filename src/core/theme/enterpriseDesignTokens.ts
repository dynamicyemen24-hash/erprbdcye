/**
 * UAMEX ERP™ — Quantum Enterprise Design Tokens 4.0
 *
 * Centralized semantic source of truth for:
 * — Visual hierarchy, color, surface, border, typography
 * — Interactive state, status, alerts, tables, inputs, animations
 * — WCAG 2.1 AA/AAA accessible color pairings throughout
 *
 * Organization: جمعية رُحماء بينهم للعمل الإنساني والتنمية
 * System: UAMEX ERP™ Intelligent Enterprise Operating System
 */

// ── Palette Primitives ────────────────────────────────────────────────────────
const palette = {
  // Primary — Emerald (Brand)
  emerald50:  '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald300: '#6ee7b7',
  emerald400: '#34d399',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065f46',
  emerald900: '#064e3b',
  emerald950: '#022c22',

  // Accent — Amber (Gold)
  amber50:  '#fffbeb',
  amber100: '#fef3c7',
  amber200: '#fde68a',
  amber300: '#fcd34d',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber700: '#b45309',
  amber800: '#92400e',
  amber900: '#78350f',

  // Semantic — Rose (Danger)
  rose50:  '#fff1f2',
  rose500: '#f43f5e',
  rose600: '#e11d48',
  rose700: '#be123c',

  // Semantic — Sky (Info)
  sky50:   '#f0f9ff',
  sky500:  '#0ea5e9',
  sky600:  '#0284c7',

  // Semantic — Violet (AI/Intelligence)
  violet50:   '#f5f3ff',
  violet500:  '#8b5cf6',
  violet600:  '#7c3aed',
  violet800:  '#5b21b6',
  violet950:  '#2e1065',

  // Neutrals — Slate (Light Mode)
  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  // Neutrals — Zinc (Dark Mode)
  zinc50:  '#fafafa',
  zinc100: '#f4f4f5',
  zinc200: '#e4e4e7',
  zinc700: '#3f3f46',
  zinc800: '#27272a',
  zinc900: '#18181b',
  zinc950: '#09090b',

  // Deep Brand Dark
  obsidian: '#090d16',
};

// ── Semantic Design Tokens ────────────────────────────────────────────────────
export const enterpriseTokens = {

  // ── Brand Identity & Palette ────────────────────────────────────────────────
  brand: {
    nameAr:     'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
    nameEn:     "Rohamā'a Baynahum Charity Foundation",
    systemName: 'UAMEX ERP™',
    tagline:    'One Platform. One Organization. One Vision.',
    primary:        palette.emerald600,
    primaryHover:   palette.emerald700,
    primaryLight:   palette.emerald50,
    primaryDark:    palette.emerald900,
    accent:         palette.amber600,
    accentHover:    palette.amber700,
    accentLight:    palette.amber50,
    accentDark:     palette.amber900,
    bgDark:         palette.obsidian,
    bgLight:        palette.slate50,
    aiColor:        palette.violet600,
  },

  // ── Surface & Panel Styles ──────────────────────────────────────────────────
  surfaces: {
    base:          'bg-slate-50 dark:bg-[#090d16]',
    card:          'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs',
    cardElevated:  'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm',
    cardSubtle:    'bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 rounded-xl',
    panel:         'bg-slate-50/70 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl',
    modal:         'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl',
    drawer:        'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl',
    dropdown:      'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg',
    sectionHeader: 'bg-slate-100/60 dark:bg-zinc-900/80 border-b border-slate-100 dark:border-zinc-800/80',
    subtle:        'bg-slate-100/80 dark:bg-zinc-800/50',
    hover:         'hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors',
    glass:         'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-white/20 dark:border-zinc-700/40',
    aiPanel:       'bg-violet-950/40 border border-violet-500/30 rounded-2xl',
  },

  // ── Borders & Outlines ──────────────────────────────────────────────────────
  borders: {
    subtle:    'border-slate-200/80 dark:border-zinc-800',
    default:   'border-slate-200 dark:border-zinc-800',
    strong:    'border-slate-300 dark:border-zinc-700',
    emphasis:  'border-emerald-500/50 dark:border-emerald-500/40',
    danger:    'border-rose-300 dark:border-rose-800',
    ai:        'border-violet-500/40 dark:border-violet-500/30',
    focus:     'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
    focusDanger: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2',
    divider:   'border-slate-100 dark:border-zinc-800/80',
  },

  // ── Typography Scale ────────────────────────────────────────────────────────
  typography: {
    displayTitle:  'text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight',
    pageTitle:     'text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight',
    pageSubtitle:  'text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5 leading-relaxed',
    sectionTitle:  'text-sm font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight flex items-center gap-2',
    cardTitle:     'text-xs font-bold text-slate-700 dark:text-zinc-200',
    label:         'block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider',
    labelInline:   'text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider',
    body:          'text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed',
    bodySmall:     'text-[11px] text-slate-500 dark:text-zinc-400',
    muted:         'text-[10px] text-slate-400 dark:text-zinc-500',
    numeric:       'font-mono font-bold tabular-nums',
    currency:      'font-mono font-black text-emerald-700 dark:text-emerald-400 tabular-nums',
    currencyLarge: 'font-mono font-black text-2xl text-emerald-700 dark:text-emerald-400 tabular-nums',
    code:          'font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200',
    ai:            'text-xs text-violet-700 dark:text-violet-300 font-medium',
    positive:      'text-emerald-700 dark:text-emerald-400 font-bold',
    negative:      'text-rose-600 dark:text-rose-400 font-bold',
    neutral:       'text-slate-500 dark:text-zinc-400',
    link:          'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 font-semibold underline-offset-2 hover:underline cursor-pointer transition-colors',
  },

  // ── Interactive Buttons ─────────────────────────────────────────────────────
  buttons: {
    primary:   [
      'inline-flex items-center justify-center gap-1.5',
      'px-3.5 py-2 rounded-xl',
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
      'text-white text-xs font-bold shadow-xs',
      'transition-all cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ].join(' '),

    secondary: [
      'inline-flex items-center justify-center gap-1.5',
      'px-3.5 py-2 rounded-xl',
      'bg-slate-100 hover:bg-slate-200 active:bg-slate-300',
      'dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-600',
      'text-slate-700 dark:text-zinc-200 text-xs font-bold',
      'border border-slate-200 dark:border-zinc-700 shadow-2xs',
      'transition-all cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ].join(' '),

    danger: [
      'inline-flex items-center justify-center gap-1.5',
      'px-3.5 py-2 rounded-xl',
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800',
      'text-white text-xs font-bold shadow-xs',
      'transition-all cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ].join(' '),

    accent: [
      'inline-flex items-center justify-center gap-1.5',
      'px-3.5 py-2 rounded-xl',
      'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
      'text-white text-xs font-bold shadow-xs',
      'transition-all cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ].join(' '),

    ghost: [
      'inline-flex items-center justify-center gap-1.5',
      'px-2.5 py-1.5 rounded-lg',
      'text-slate-600 dark:text-zinc-400',
      'hover:text-slate-900 dark:hover:text-zinc-100',
      'hover:bg-slate-100 dark:hover:bg-zinc-800/80',
      'text-xs font-bold transition-colors cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
      'disabled:opacity-50',
    ].join(' '),

    iconOnly: [
      'p-2 rounded-xl',
      'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100',
      'hover:bg-slate-100 dark:hover:bg-zinc-800',
      'transition-colors cursor-pointer',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
      'disabled:opacity-50',
    ].join(' '),

    ai: [
      'inline-flex items-center justify-center gap-1.5',
      'px-3.5 py-2 rounded-xl',
      'bg-violet-700 hover:bg-violet-600 active:bg-violet-800',
      'text-white text-xs font-bold shadow-xs',
      'transition-all cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ].join(' '),
  },

  // ── Form Inputs ─────────────────────────────────────────────────────────────
  inputs: {
    standard:  'w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all',
    search:    'w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all',
    select:    'w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer appearance-none',
    textarea:  'w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none',
    checkbox:  'h-4 w-4 rounded border-slate-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer',
    radio:     'h-4 w-4 border-slate-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer',
    error:     'border-rose-500 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
    disabled:  'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-zinc-900',
    group:     'space-y-1.5 mb-4',
    groupRow:  'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4',
  },

  // ── Status Badges (Accessible — color + icon + text, never color alone) ─────
  status: {
    success: {
      bg:        'bg-emerald-50 dark:bg-emerald-950/60',
      border:    'border-emerald-200 dark:border-emerald-800/80',
      text:      'text-emerald-700 dark:text-emerald-300',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      dot:       'bg-emerald-500',
      ring:      'ring-emerald-500/40',
    },
    warning: {
      bg:        'bg-amber-50 dark:bg-amber-950/60',
      border:    'border-amber-200 dark:border-amber-800/80',
      text:      'text-amber-700 dark:text-amber-300',
      iconClass: 'text-amber-600 dark:text-amber-400',
      dot:       'bg-amber-500',
      ring:      'ring-amber-500/40',
    },
    danger: {
      bg:        'bg-rose-50 dark:bg-rose-950/60',
      border:    'border-rose-200 dark:border-rose-800/80',
      text:      'text-rose-700 dark:text-rose-300',
      iconClass: 'text-rose-600 dark:text-rose-400',
      dot:       'bg-rose-500',
      ring:      'ring-rose-500/40',
    },
    info: {
      bg:        'bg-sky-50 dark:bg-sky-950/60',
      border:    'border-sky-200 dark:border-sky-800/80',
      text:      'text-sky-700 dark:text-sky-300',
      iconClass: 'text-sky-600 dark:text-sky-400',
      dot:       'bg-sky-500',
      ring:      'ring-sky-500/40',
    },
    neutral: {
      bg:        'bg-slate-100 dark:bg-zinc-800',
      border:    'border-slate-200 dark:border-zinc-700',
      text:      'text-slate-700 dark:text-zinc-300',
      iconClass: 'text-slate-500 dark:text-zinc-400',
      dot:       'bg-slate-400',
      ring:      'ring-slate-500/40',
    },
    ai: {
      bg:        'bg-violet-50 dark:bg-violet-950/60',
      border:    'border-violet-200 dark:border-violet-800/80',
      text:      'text-violet-700 dark:text-violet-300',
      iconClass: 'text-violet-600 dark:text-violet-400',
      dot:       'bg-violet-500',
      ring:      'ring-violet-500/40',
    },
  },

  // ── Table Design Ramps ──────────────────────────────────────────────────────
  tables: {
    container: 'w-full overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900',
    table:     'w-full text-start border-collapse',
    header:    'sticky top-0 bg-slate-100/95 dark:bg-zinc-900/95 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400',
    th:        'px-4 py-3 text-start font-extrabold whitespace-nowrap',
    thRight:   'px-4 py-3 text-end font-extrabold whitespace-nowrap',
    row:       'border-b border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors',
    rowAlt:    'border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/40 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 transition-colors',
    rowSelected: 'bg-emerald-500/10 dark:bg-emerald-950/40 border-b border-emerald-500/20',
    td:        'px-4 py-3 text-xs text-slate-800 dark:text-zinc-200 font-medium whitespace-nowrap',
    numericTd: 'px-4 py-3 text-xs text-slate-900 dark:text-white font-mono font-bold tabular-nums text-end whitespace-nowrap',
    footer:    'px-4 py-2 bg-slate-50/90 dark:bg-zinc-950/80 border-t border-slate-200/80 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 font-bold',
  },

  // ── Animation & Motion ──────────────────────────────────────────────────────
  animation: {
    fadeIn:   'animate-in fade-in duration-200',
    slideUp:  'animate-in slide-in-from-bottom-3 fade-in duration-200',
    slideDown: 'animate-in slide-in-from-top-3 fade-in duration-200',
    scaleIn:  'animate-in zoom-in-95 fade-in duration-150',
    spin:     'animate-spin',
    pulse:    'animate-pulse',
    ping:     'animate-ping',
  },

  // ── Spacing & Layout ────────────────────────────────────────────────────────
  layout: {
    pageWrapper:   'min-h-screen bg-slate-50 dark:bg-[#090d16]',
    contentWrapper: 'p-4 md:p-6 space-y-6 max-w-screen-2xl mx-auto',
    section:       'space-y-4',
    row:           'flex flex-col md:flex-row items-start md:items-center gap-4',
    grid2:         'grid grid-cols-1 md:grid-cols-2 gap-4',
    grid3:         'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    grid4:         'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
    statsRow:      'grid grid-cols-2 md:grid-cols-4 gap-4',
  },
};

// ── Semantic Color Utilities ──────────────────────────────────────────────────
export type StatusTheme = typeof enterpriseTokens.status.success;
export type ButtonVariant = keyof typeof enterpriseTokens.buttons;
export type SurfaceVariant = keyof typeof enterpriseTokens.surfaces;

export default enterpriseTokens;
