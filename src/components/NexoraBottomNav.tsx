import React from 'react';
import { 
  Home, 
  Briefcase, 
  Layers, 
  Sparkles, 
  BookOpen, 
  Bell, 
  ShieldCheck,
  Brain,
  Grid
} from 'lucide-react';
import { TabId } from '../types';

interface NexoraBottomNavProps {
  activeTab: TabId;
  onNavigate: (tab: TabId) => void;
  lang: 'ar' | 'en';
  onOpenCopilot: () => void;
  onOpenDocs: () => void;
  onOpenLauncher?: () => void;
  pendingApprovalsCount?: number;
}

export default function NexoraBottomNav({
  activeTab,
  onNavigate,
  lang,
  onOpenCopilot,
  onOpenDocs,
  onOpenLauncher,
  pendingApprovalsCount = 0
}: NexoraBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 flex items-center justify-around px-2 pb-safe z-50 lg:hidden shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-none">
      
      {/* 1. Command Center / Home */}
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1 ${
          activeTab === 'dashboard' 
            ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105' 
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
      </button>

      {/* 2. App & Systems Matrix Launcher */}
      <button
        onClick={onOpenLauncher}
        className="flex flex-col items-center justify-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-all flex-1 py-1"
        title={lang === 'ar' ? 'مصفوفة الأنظمة المؤسسية' : 'Enterprise Systems Matrix'}
      >
        <Grid className="w-5 h-5" />
        <span className="text-[10px] font-medium">{lang === 'ar' ? 'المصفوفة' : 'Matrix'}</span>
      </button>

      {/* 3. AI Copilot Drawer Trigger */}
      <button
        onClick={onOpenCopilot}
        className="flex flex-col items-center justify-center gap-1 -mt-6 bg-gradient-to-tr from-emerald-600 to-amber-500 text-white p-3.5 rounded-full shadow-lg shadow-emerald-600/30 dark:shadow-emerald-950/60 border-[3px] border-white dark:border-zinc-950 hover:scale-105 transition-all cursor-pointer"
        title="Nexora AI Copilot"
      >
        <Brain className="w-6 h-6 animate-pulse" />
      </button>

      {/* 4. Nexora Enterprise Domains View */}
      <button
        onClick={() => onNavigate('domains')}
        className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1 ${
          activeTab === 'domains' || activeTab === 'programs' || activeTab === 'projects' || activeTab === 'activities'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105' 
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
        }`}
      >
        <Layers className={`w-5 h-5 ${activeTab === 'domains' ? '' : 'text-amber-500'}`} />
        <span className="text-[10px] font-medium">{lang === 'ar' ? 'الأنظمة' : 'Systems'}</span>
      </button>

      {/* 5. Knowledge Center Modal */}
      <button
        onClick={onOpenDocs}
        className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex-1 py-1"
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-[10px] font-medium">{lang === 'ar' ? 'الدليل' : 'Docs'}</span>
      </button>

    </nav>
  );
}
