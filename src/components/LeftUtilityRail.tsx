import React from 'react';
import { Sparkles, Brain, BookOpen, PlayCircle, Calculator } from 'lucide-react';

export interface LeftUtilityRailProps {
  lang: 'ar' | 'en';
  setShowCopilotDrawer: (open: boolean) => void;
  setShowDocsModal: (open: boolean) => void;
  setShowScenariosModal: (open: boolean) => void;
  setShowHelpersModal: (open: boolean) => void;
}

export const LeftUtilityRail: React.FC<LeftUtilityRailProps> = ({
  lang,
  setShowCopilotDrawer,
  setShowDocsModal,
  setShowScenariosModal,
  setShowHelpersModal
}) => {
  return (
    <aside className="hidden lg:flex w-14 hover:w-52 flex-col bg-white dark:bg-zinc-950 border-r rtl:border-r-0 rtl:border-l border-slate-200 dark:border-zinc-800 transition-all duration-300 z-10 shadow-sm group shrink-0 overflow-hidden">
      <div className="h-10 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-center group-hover:justify-start group-hover:px-3 shrink-0">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs font-black text-slate-700 dark:text-zinc-300 ml-2 rtl:mr-2 rtl:ml-0 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
          {lang === 'ar' ? 'الأدوات المساعدة' : 'Helper Tools'}
        </span>
      </div>
      
      <div className="flex-1 flex flex-col gap-1.5 p-1.5">
        <button
          onClick={() => setShowCopilotDrawer(true)}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors w-full group/btn cursor-pointer"
          title={lang === 'ar' ? 'مساعد الذكاء الاصطناعي Nexora AI Copilot' : 'Nexora AI Copilot'}
        >
          <Brain className="w-4 h-4 shrink-0 text-emerald-600 group-hover/btn:animate-pulse" />
          <span className="text-xs font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap">
            Copilot AI
          </span>
        </button>

        <button
          onClick={() => setShowDocsModal(true)}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors w-full cursor-pointer"
          title={lang === 'ar' ? 'الوثائق التشغيلية' : 'System Docs'}
        >
          <BookOpen className="w-4 h-4 shrink-0 text-sky-500" />
          <span className="text-xs font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap">
            {lang === 'ar' ? 'دليل الاستخدام' : 'User Manual'}
          </span>
        </button>

        <button
          onClick={() => setShowScenariosModal(true)}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors w-full cursor-pointer"
          title={lang === 'ar' ? 'السيناريوهات التشغيلية (SOP)' : 'Playbooks'}
        >
          <PlayCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <span className="text-xs font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap">
            {lang === 'ar' ? 'السيناريوهات (SOP)' : 'SOP Playbooks'}
          </span>
        </button>

        <button
          onClick={() => setShowHelpersModal(true)}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors w-full cursor-pointer"
          title={lang === 'ar' ? 'أدوات ومقاييس الإغاثة والترميز' : 'Relief & Math Tools'}
        >
          <Calculator className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="text-xs font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap">
            {lang === 'ar' ? 'أدوات الإغاثة والترميز' : 'Relief & DAC Tools'}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default LeftUtilityRail;
