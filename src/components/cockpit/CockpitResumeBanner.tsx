import React from 'react';
import { PlayCircle, X, FileText, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { WorkspaceResumeState } from '../../core/services/resumeIntelligence';

interface CockpitResumeBannerProps {
  lang: 'ar' | 'en';
  resumeState: WorkspaceResumeState | null;
  onNavigate: (tabId: string) => void;
  onDismiss: () => void;
}

export const CockpitResumeBanner: React.FC<CockpitResumeBannerProps> = ({
  lang,
  resumeState,
  onNavigate,
  onDismiss
}) => {
  if (!resumeState || !resumeState.lastActiveTab) return null;

  const handleResume = () => {
    onNavigate(resumeState.lastActiveTab);
  };

  return (
    <div className="w-full bg-emerald-500/10 border border-emerald-500/30 dark:bg-emerald-950/30 dark:border-emerald-500/20 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <PlayCircle className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              {lang === 'ar' ? 'استئناف العمل غير المكتمل' : 'Resume Incomplete Work'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 mt-0.5">
            {lang === 'ar' 
              ? `كنت تعمل على: ${resumeState.viewTitleAr || resumeState.lastActiveTab}` 
              : `You were working on: ${resumeState.viewTitleEn || resumeState.lastActiveTab}`}
            {resumeState.lastOpenedRecord?.code && (
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mx-1">
                ({resumeState.lastOpenedRecord.code})
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          onClick={handleResume}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>{lang === 'ar' ? 'متابعة من حيث توقفت' : 'Resume Session'}</span>
          <ArrowRight className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={onDismiss}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title={lang === 'ar' ? 'إخفاء' : 'Dismiss'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
