import React, { ReactNode } from 'react';
import { designTokens } from '../../lib/designTokens';
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
  Layers
} from 'lucide-react';

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
  icon: React.ComponentType<any>;
  /** Primary accent color class (e.g. 'emerald', 'amber', 'blue') */
  accent?: string;
  /** Breadcrumb items */
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  /** Right-side action buttons */
  actions?: ReactNode;
  /** Filter bar content */
  filters?: ReactNode;
  /** Status bar content (overrides default) */
  statusBar?: ReactNode;
  /** Whether the module is currently loading */
  isLoading?: boolean;
  /** Record count for status bar */
  recordCount?: number;
  /** Whether online */
  isOnline?: boolean;
  /** Language */
  lang: 'ar' | 'en';
  /** Content children */
  children: ReactNode;
  /** Optional refresh callback */
  onRefresh?: () => void;
  /** Navigate callback */
  onNavigate?: (tab: string) => void;
}

const accentColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', glow: 'bg-emerald-500/5' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', glow: 'bg-amber-500/5' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', glow: 'bg-blue-500/5' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', glow: 'bg-indigo-500/5' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', glow: 'bg-purple-500/5' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20', glow: 'bg-cyan-500/5' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', glow: 'bg-rose-500/5' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20', glow: 'bg-slate-500/5' },
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
  onNavigate,
}: ModuleShellProps) {
  const isRtl = lang === 'ar';
  const colors = accentColors[accent] || accentColors.emerald;
  const { isTrainingMode, currentConfig } = useEnvironmentMode();
  const now = new Date();

  return (
    <div
      className={`flex flex-col bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-zinc-800 animate-in fade-in duration-300 relative min-h-[calc(100vh-180px)]`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Module Header */}
      <div className={`px-5 py-4 md:px-7 md:py-5 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 sticky top-0 z-20 backdrop-blur-md`}>
        {/* Breadcrumb */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-3">
            <Layers className="w-3 h-3" />
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && (isRtl ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}
                <button
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
          <div className="flex items-center gap-3">
            <EnterpriseLogo className="h-8 w-auto object-contain bg-white/90 dark:bg-zinc-800 p-0.5 rounded-lg shrink-0" />
            <div className={`p-2.5 ${colors.bg} ${colors.text} rounded-xl shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {isRtl ? titleAr : titleEn}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${colors.bg} ${colors.text} ${colors.border} border flex items-center gap-1`}>
                  <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                  {domainCode}
                </span>
                {isLoading && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    {isRtl ? 'جاري التحميل' : 'Loading'}
                  </span>
                )}
              </div>
              {(descAr || descEn) && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                  {isRtl ? descAr : descEn}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title={isRtl ? 'تحديث البيانات' : 'Refresh Data'}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {actions}
          </div>
        </div>

        {/* Filter Bar */}
        {filters && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
            {filters}
          </div>
        )}
      </div>

      {/* Module Body */}
      <div className="flex-1 p-4 md:p-6 relative overflow-y-auto">
        {children}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-1.5 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 text-[10px] text-slate-500 dark:text-zinc-400 flex items-center justify-between sticky bottom-0 z-10 backdrop-blur-md">
        {statusBar || (
          <>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
                {isOnline ? (isRtl ? 'متصل' : 'Connected') : (isRtl ? 'غير متصل' : 'Offline')}
              </span>
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                isTrainingMode
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isTrainingMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {isRtl ? currentConfig.labelAr : currentConfig.labelEn}
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                {recordCount !== undefined ? `${recordCount.toLocaleString()} ${isRtl ? 'سجل' : 'records'}` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-500" />
                {domainCode}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {now.toLocaleTimeString(isRtl ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
