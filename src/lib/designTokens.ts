/**
 * Layout shorthand map (spacing/radius/type/surface literals).
 * NOTE: the `enterpriseTokens` re-export that lived here is deleted — zero
 * consumers remain; status/button/surface vocabularies are owned by the
 * Design System closed maps (`Badge`/`Alert`/`Button`/…), not by a parallel
 * token object.
 */
export const designTokens = {
  spacing: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-12',
  },
  borderRadius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
  },
  typography: {
    titleDisplay: 'text-4xl font-black tracking-tight',
    sectionTitle: 'text-lg font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400',
    cardTitle: 'text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400',
    body: 'text-sm text-zinc-700 dark:text-zinc-300',
    numeric: 'font-mono font-black tabular-nums',
    buttonText: 'text-[10px] font-bold tracking-tight',
  },
  colors: {
    primary: 'text-emerald-600',
    accent: 'text-amber-500',
    bgBase: 'bg-zinc-50 dark:bg-zinc-950',
    bgCard: 'bg-white dark:bg-zinc-900',
    border: 'border-zinc-100 dark:border-zinc-800',
    bgPrimarySubtle: 'bg-emerald-50 dark:bg-emerald-900/20',
    bgSecondarySubtle: 'bg-amber-50 dark:bg-amber-900/20',
  }
};
