import React, { useState } from 'react';
import { 
  Command, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Brain
} from 'lucide-react';

export interface FloatingEnterpriseDockProps {
  lang: 'ar' | 'en';
  onOpenHelpers: (toolId?: string) => void;
  onOpenCommandCenter: () => void;
  onOpenCopilot: () => void;
  onOpenPrint: () => void;
  onOpenSOP: () => void;
  onRefreshData?: () => void;
}

export const FloatingEnterpriseDock: React.FC<FloatingEnterpriseDockProps> = ({
  lang,
  onOpenHelpers,
  onOpenCommandCenter,
  onOpenCopilot,
  onOpenPrint,
  onOpenSOP,
  onRefreshData
}) => {
  const isRtl = lang === 'ar';
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('uamex_dock_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDockMinimize = () => {
    setIsMinimized(prev => {
      const next = !prev;
      try {
        localStorage.setItem('uamex_dock_minimized', String(next));
      } catch {}
      return next;
    });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 hidden sm:block animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={toggleDockMinimize}
          className="px-3 py-1.5 bg-zinc-950/90 hover:bg-zinc-900 border border-emerald-500/40 hover:border-emerald-500 rounded-full shadow-2xl text-emerald-400 text-xs font-black flex items-center gap-2 cursor-pointer transition-all hover:scale-105 backdrop-blur-md"
          title={isRtl ? 'إظهار شريط الأدوات السريعة والمساعدات' : 'Show Enterprise Quick Dock'}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{isRtl ? 'الأدوات السريعة' : 'Quick Dock'}</span>
          <ChevronUp className="w-3 h-3 text-emerald-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden sm:flex items-center gap-1 p-1.5 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-xl transition-all duration-200 select-none animate-in fade-in slide-in-from-bottom-2">
      {/* 1. Helpers Suite (single calm entry) */}
      <button
        onClick={() => onOpenHelpers()}
        className="px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        title={isRtl ? 'الأدوات والمقاييس (12 أداة) [Alt+H]' : 'Helper Tools (12) [Alt+H]'}
      >
        <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="hidden md:inline">{isRtl ? 'الأدوات' : 'Tools'}</span>
      </button>

      <div className="w-px h-5 bg-zinc-800 mx-1" />

      {/* 2. Command Center */}
      <button
        onClick={onOpenCommandCenter}
        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        title={isRtl ? 'مركز الأوامر [Ctrl+K]' : 'Command Center [Ctrl+K]'}
      >
        <Command className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden lg:inline">{isRtl ? 'الأوامر' : 'Commands'}</span>
      </button>

      {/* 3. UAMEX AI */}
      <button
        onClick={onOpenCopilot}
        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        title={isRtl ? 'المساعد الذكي [Alt+A]' : 'UAMEX AI [Alt+A]'}
      >
        <Brain className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">{isRtl ? 'المساعد' : 'AI'}</span>
      </button>

      <div className="w-px h-5 bg-zinc-800 mx-1" />

      {/* 4. Refresh */}
      {onRefreshData && (
        <button onClick={onRefreshData} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer" title={isRtl ? 'تحديث البيانات' : 'Refresh'}>
          <RefreshCw className="w-4 h-4" />
        </button>
      )}

      {/* 5. Minimize */}
      <button onClick={toggleDockMinimize} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer" title={isRtl ? 'تصغير' : 'Minimize'}>
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FloatingEnterpriseDock;
