/**
 * UAMEX ERP™ — Module Shell 4.0
 *
 * The universal container for all 15 NEB enterprise domain screens.
 * Features:
 * — Sticky glassy header with breadcrumb, domain badge, and action bar
 * — Adaptive filter/search bar slot
 * — Live status bar: connectivity, environment mode, record count, timestamp
 * — Training/Production mode awareness with color-coded badge
 * — Responsive, RTL/LTR, accessibility-first (WCAG 2.1 AA)
 */

import React, { ReactNode } from 'react';
import { EnterpriseLogo } from '../EnterpriseLogo';
import { useEnvironmentMode } from '../../core/context/EnvironmentModeContext';
import {
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Activity,
  Wifi,
  WifiOff,
  Clock,
  Database,
  Layers,
} from 'lucide-react';
import { enterpriseTokens } from '../../core/theme/enterpriseDesignTokens';

export interface ModuleShellProps {
  /** Module title in Arabic */
  titleAr: string;
  /** Module title in English */
  titleEn: string;
  /** Module description in Arabic */
  descAr?: string;
  /** Module description in English */
  descEn?: string;
  /** NEB domain code (e.g. 'NEB-06') */
  domainCode: string;
  /** Module icon (Lucide component) */
  icon: React.ComponentType<{ className?: string }>;
  /** Accent color class (e.g. 'emerald', 'amber', 'blue') */
  accent?: string;
  /** Breadcrumb items */
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  /** Right-side action buttons */
  actions?: ReactNode;
  /** Filter/search bar content */
  filters?: ReactNode;
  /** Override for the entire status bar */
  statusBar?: ReactNode;
  /** Whether the module is loading */
  isLoading?: boolean;
  /** Record count for status bar */
  recordCount?: number;
  /** Online state */
  isOnline?: boolean;
  /** Language */
  lang: 'ar' | 'en';
  /** Page content */
  children: ReactNode;
  /** Refresh callback */
  onRefresh?: () => void;
  /** Navigation callback */
  onNavigate?: (tab: string) => void;
}

const accentColors: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/25' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-500/25' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',       border: 'border-blue-500/25' },
  indigo:  { bg: 'bg-indigo-500/10',  text: 'text-indigo-600 dark:text-indigo-400',   border: 'border-indigo-500/25' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-600 dark:text-purple-400',   border: 'border-purple-500/25' },
  cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-600 dark:text-cyan-400',       border: 'border-cyan-500/25' },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-500/25' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400',   border: 'border-violet-500/25' },
  slate:   { bg: 'bg-slate-500/10',   text: 'text-slate-600 dark:text-slate-400',     border: 'border-slate-500/25' },
};

export function ModuleShell({
  titleAr,
  titleEn,
  descAr,
  descEn,
  domainCode,
  icon: Icon,
  accent = 'emerald',
  breadcrumbs,
  actions,
  filters,
  statusBar,
  isLoading = false,
  recordCount,
  isOnline = true,
  lang,
  children,
  onRefresh,
}: ModuleShellProps) {
  const isRtl = lang === 'ar';
  const colors = accentColors[accent] ?? accentColors.emerald;
  const { isTrainingMode, currentConfig } = useEnvironmentMode();
  const now = new Date();

  return (
    <div
      className="flex flex-col bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-zinc-800 animate-in fade-in duration-300 relative min-h-[calc(100vh-180px)]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── STICKY MODULE HEADER ───────────────────────────────────────────── */}
      <div className="px-5 py-4 md:px-7 md:py-5 border-b border-slate-100 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 sticky top-0 z-20 backdrop-blur-md">

        {/* Breadcrumb */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-3">
            <Layers className="w-3 h-3" aria-hidden="true" />
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  isRtl
                    ? <ChevronLeft  className="w-3 h-3" aria-hidden="true" />
                    : <ChevronRight className="w-3 h-3" aria-hidden="true" />
                )}
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${crumb.onClick ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* System Logo */}
            <EnterpriseLogo className="h-8 w-auto object-contain bg-white/90 dark:bg-zinc-800 p-0.5 rounded-lg shrink-0" />

            {/* Domain Icon */}
            <div className={`p-2.5 ${colors.bg} ${colors.text} rounded-xl shrink-0 border ${colors.border}`}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>

            {/* Title Block */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {isRtl ? titleAr : titleEn}
                </h1>

                {/* Domain Code Badge */}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${colors.bg} ${colors.text} ${colors.border} border flex items-center gap-1 shrink-0`}>
                  <span className="w-1 h-1 rounded-full bg-current animate-pulse" aria-hidden="true" />
                  {domainCode}
                </span>

                {/* Loading Indicator */}
                {isLoading && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 shrink-0">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" aria-hidden="true" />
                    {isRtl ? 'جاري التحميل' : 'Loading'}
                  </span>
                )}
              </div>

              {(descAr || descEn) && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5 truncate">
                  {isRtl ? descAr : descEn}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className={enterpriseTokens.buttons.iconOnly}
                title={isRtl ? 'تحديث البيانات' : 'Refresh Data'}
                aria-label={isRtl ? 'تحديث البيانات' : 'Refresh Data'}
              >
                <RefreshCw className="w-4 h-4" aria-label={isRtl ? 'تحديث' : 'Refresh'} />
              </button>
            )}
            {actions}
          </div>
        </div>

        {/* Filter Bar Slot */}
        {filters && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
            {filters}
          </div>
        )}
      </div>

      {/* ── MODULE BODY ───────────────────────────────────────────────────── */}
      <div className="flex-1 p-4 md:p-6 relative overflow-y-auto">
        {children}
      </div>

      {/* ── STICKY STATUS BAR ─────────────────────────────────────────────── */}
      <div className="px-4 py-1.5 bg-slate-50/95 dark:bg-zinc-900/95 border-t border-slate-200 dark:border-zinc-800 text-[10px] text-slate-500 dark:text-zinc-400 flex items-center justify-between sticky bottom-0 z-10 backdrop-blur-md">
        {statusBar || (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Connectivity */}
              <span className="hidden sm:flex items-center gap-1 font-bold">
                {isOnline
                  ? <Wifi    className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                  : <WifiOff className="w-3 h-3 text-rose-500"    aria-hidden="true" />}
                {isOnline ? (isRtl ? 'متصل' : 'Online') : (isRtl ? 'غير متصل' : 'Offline')}
              </span>

              {/* Environment Mode */}
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                isTrainingMode
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isTrainingMode ? 'bg-amber-500' : 'bg-emerald-500'}`} aria-hidden="true" />
                {isRtl ? currentConfig.labelAr : currentConfig.labelEn}
              </span>

              {/* Record Count */}
              <span className="flex items-center gap-1 font-mono font-bold tabular-nums">
                <Database className="w-3 h-3" aria-hidden="true" />
                {recordCount !== undefined
                  ? `${recordCount.toLocaleString()} ${isRtl ? 'سجل' : 'records'}`
                  : '—'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Domain Code */}
              <span className="hidden md:flex items-center gap-1 font-bold">
                <Activity className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                {domainCode}
              </span>

              {/* Live Time */}
              <span className="flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {now.toLocaleTimeString(isRtl ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ModuleShell;
