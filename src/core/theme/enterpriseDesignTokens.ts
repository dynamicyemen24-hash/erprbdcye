/**
 * UAMEX ERP™ — Centralized Enterprise Semantic Design Tokens
 * 
 * Standardized single source of truth for visual hierarchy, typography,
 * surfaces, borders, interactive states, and status badges across the system.
 * Compliant with WCAG 2.1 AA/AAA accessibility standards.
 */

export const enterpriseTokens = {
  // ── Brand Identity & Palette ─────────────────────────────────────────────
  brand: {
    nameAr: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
    nameEn: "Rohamā'a Baynahum Charity Foundation",
    systemName: 'UAMEX ERP™',
    primary: '#059669', // Emerald 600
    primaryHover: '#047857', // Emerald 700
    primaryLight: '#ecfdf5', // Emerald 50
    primaryDark: '#064e3b', // Emerald 900
    accent: '#d97706', // Amber 600
    accentHover: '#b45309', // Amber 700
    accentLight: '#fffbeb', // Amber 50
    accentDark: '#78350f', // Amber 900
    bgDark: '#090d16', // Deep Obsidian Dark
    bgLight: '#f8fafc', // Clean Slate Light
  },

  // ── Surface & Panel Styles ───────────────────────────────────────────────
  surfaces: {
    base: 'bg-slate-50 dark:bg-[#090d16]',
    card: 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs',
    cardElevated: 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm',
    panel: 'bg-slate-50/70 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl',
    modal: 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl',
    dropdown: 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg',
    subtle: 'bg-slate-100/80 dark:bg-zinc-800/50',
    hover: 'hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors',
  },

  // ── Borders & Outlines ───────────────────────────────────────────────────
  borders: {
    subtle: 'border-slate-200/80 dark:border-zinc-800',
    default: 'border-slate-200 dark:border-zinc-800',
    strong: 'border-slate-300 dark:border-zinc-700',
    focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
    divider: 'border-slate-100 dark:border-zinc-800/80',
  },

  // ── Typography Ramps ─────────────────────────────────────────────────────
  typography: {
    pageTitle: 'text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight',
    pageSubtitle: 'text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5',
    sectionTitle: 'text-sm font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight flex items-center gap-2',
    cardTitle: 'text-xs font-bold text-slate-700 dark:text-zinc-200',
    label: 'block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider',
    body: 'text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed',
    bodySmall: 'text-[11px] text-slate-500 dark:text-zinc-400',
    numeric: 'font-mono font-bold tabular-nums',
    currency: 'font-mono font-black text-emerald-700 dark:text-emerald-400 tabular-nums',
    code: 'font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200',
  },

  // ── Interactive Buttons ──────────────────────────────────────────────────
  buttons: {
    primary: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed select-none',
    secondary: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed select-none',
    danger: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed select-none',
    accent: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed select-none',
    ghost: 'inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-xs font-bold rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 select-none',
    iconOnly: 'p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
  },

  // ── Form Inputs ──────────────────────────────────────────────────────────
  inputs: {
    standard: 'w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all',
    select: 'w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer',
    textarea: 'w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none',
    checkbox: 'h-4 w-4 rounded border-slate-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer',
    error: 'border-rose-500 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
  },

  // ── Status Badges (Semantic, accessible, non-color-only) ───────────────────
  status: {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-200 dark:border-emerald-800/80',
      text: 'text-emerald-700 dark:text-emerald-300',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-200 dark:border-amber-800/80',
      text: 'text-amber-700 dark:text-amber-300',
      iconClass: 'text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    danger: {
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      border: 'border-rose-200 dark:border-rose-800/80',
      text: 'text-rose-700 dark:text-rose-300',
      iconClass: 'text-rose-600 dark:text-rose-400',
      dot: 'bg-rose-500',
    },
    info: {
      bg: 'bg-sky-50 dark:bg-sky-950/60',
      border: 'border-sky-200 dark:border-sky-800/80',
      text: 'text-sky-700 dark:text-sky-300',
      iconClass: 'text-sky-600 dark:text-sky-400',
      dot: 'bg-sky-500',
    },
    neutral: {
      bg: 'bg-slate-100 dark:bg-zinc-800',
      border: 'border-slate-200 dark:border-zinc-700',
      text: 'text-slate-700 dark:text-zinc-300',
      iconClass: 'text-slate-500 dark:text-zinc-400',
      dot: 'bg-slate-400',
    },
  },

  // ── Tabular Design Ramps ─────────────────────────────────────────────────
  tables: {
    container: 'w-full overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900',
    table: 'w-full text-start border-collapse',
    header: 'sticky top-0 bg-slate-100/95 dark:bg-zinc-900/95 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400',
    th: 'px-4 py-3 text-start font-extrabold whitespace-nowrap',
    row: 'border-b border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors',
    td: 'px-4 py-3 text-xs text-slate-800 dark:text-zinc-200 font-medium whitespace-nowrap',
    numericTd: 'px-4 py-3 text-xs text-slate-900 dark:text-white font-mono font-bold tabular-nums text-end whitespace-nowrap',
  },
};
