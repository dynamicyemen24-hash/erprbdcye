import React from 'react';
import { Inbox, RefreshCw, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  titleAr: string;
  titleEn: string;
  descAr?: string;
  descEn?: string;
  actionLabelAr?: string;
  actionLabelEn?: string;
  onAction?: () => void;
  lang: 'ar' | 'en';
  compact?: boolean;
}

/**
 * Unified bilingual empty-state for all enterprise grids, widgets and reports.
 * Replaces ad-hoc inline empty markup across views.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  titleAr,
  titleEn,
  descAr,
  descEn,
  actionLabelAr,
  actionLabelEn,
  onAction,
  lang,
  compact = false
}) => {
  const isRtl = lang === 'ar';
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-12 px-6'}`}>
      <div className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded-2xl bg-slate-100 dark:bg-zinc-800/80 text-slate-400 dark:text-zinc-500 flex items-center justify-center mb-3`}>
        <Icon className={compact ? 'w-5 h-5' : 'w-7 h-7'} />
      </div>
      <p className={`${compact ? 'text-xs' : 'text-sm'} font-black text-slate-700 dark:text-zinc-300`}>
        {isRtl ? titleAr : titleEn}
      </p>
      {(isRtl ? descAr : descEn) && (
        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mt-1 max-w-xs leading-relaxed">
          {isRtl ? descAr : descEn}
        </p>
      )}
      {onAction && (isRtl ? actionLabelAr : actionLabelEn) && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isRtl ? actionLabelAr : actionLabelEn}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
