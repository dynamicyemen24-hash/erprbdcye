import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  Sliders, 
  Maximize, 
  Minimize, 
  Keyboard, 
  Download, 
  PlayCircle, 
  Calculator, 
  Lock, 
  RefreshCw, 
  Layers, 
  Check, 
  Sparkles,
  BookOpen,
  Command,
  Shield
} from 'lucide-react';

interface HeaderQuickMenuProps {
  lang: 'ar' | 'en';
  density: 'compact' | 'comfortable' | 'spacious';
  onDensityChange: (density: 'compact' | 'comfortable' | 'spacious') => void;
  onRefreshData: () => void;
  isLoading?: boolean;
  onOpenShortcuts: () => void;
  onOpenExportModal: () => void;
  onOpenScenarios: () => void;
  onOpenHelpers: () => void;
  onOpenDocs: () => void;
  isSystemsDockPinned: boolean;
  onToggleDockPin: () => void;
  onOpenCommandCenter: () => void;
  onLockSession?: () => void;
}

export const HeaderQuickMenu: React.FC<HeaderQuickMenuProps> = ({
  lang,
  density,
  onDensityChange,
  onRefreshData,
  isLoading = false,
  onOpenShortcuts,
  onOpenExportModal,
  onOpenScenarios,
  onOpenHelpers,
  onOpenDocs,
  isSystemsDockPinned,
  onToggleDockPin,
  onOpenCommandCenter,
  onLockSession
}) => {
  const isRtl = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
            : 'bg-emerald-900/40 hover:bg-emerald-900/80 text-emerald-200 hover:text-white border-emerald-800'
        }`}
        title={isRtl ? 'الأدوات السريعة والقائمة الفرعية' : 'Quick Tools & Overflow Menu'}
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div 
          className={`absolute top-full mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl z-[1000] p-2 space-y-1 text-slate-800 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-150 ${
            isRtl ? 'left-0' : 'right-0'
          }`}
        >
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {isRtl ? 'أدوات التشغيل السريع' : 'Quick Operations Menu'}
            </span>
            <span className="text-[9px] text-zinc-400 font-mono">NexoraOS™</span>
          </div>

          {/* Density Selector */}
          <div className="p-2 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 block mb-1.5">
              {isRtl ? 'كثافة أبعاد الشاشة (Density)' : 'Workspace Layout Density'}
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => onDensityChange(d)}
                  className={`py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer capitalize flex items-center justify-center gap-1 ${
                    density === d
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {density === d && <Check className="w-2.5 h-2.5 text-white" />}
                  {d === 'compact' ? (isRtl ? 'مدمج' : 'Compact') : d === 'comfortable' ? (isRtl ? 'مريح' : 'Normal') : (isRtl ? 'واسع' : 'Spacious')}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5 pt-1">
            
            <button
              onClick={() => { onOpenCommandCenter(); setIsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Command className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? 'مركز الأوامر الشامل' : 'Command Center'}</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700">
                ⌘K
              </span>
            </button>

            <button
              onClick={() => { onToggleDockPin(); setIsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? 'شريط الأنظمة والعمليات' : 'Systems Dock Panel'}</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isSystemsDockPinned ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                {isSystemsDockPinned ? (isRtl ? 'مثبت' : 'Pinned') : (isRtl ? 'مطوي' : 'Hidden')}
              </span>
            </button>

            <button
              onClick={() => { onRefreshData(); setIsOpen(false); }}
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className={`w-4 h-4 text-blue-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isRtl ? 'تحديث ومزامنة البيانات' : 'Sync & Refresh Ledger'}</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-400">F5 / Ctrl+S</span>
            </button>

            <button
              onClick={() => { toggleFullscreen(); setIsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isFullscreen ? <Minimize className="w-4 h-4 text-purple-500" /> : <Maximize className="w-4 h-4 text-purple-500" />}
                <span>{isFullscreen ? (isRtl ? 'إنهاء الشاشة الكاملة' : 'Exit Fullscreen') : (isRtl ? 'عرض ملء الشاشة' : 'Fullscreen View')}</span>
              </div>
            </button>

            <button
              onClick={() => { onOpenExportModal(); setIsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'تصدير التقارير والسجلات' : 'Export Reports & Data'}</span>
              </div>
            </button>

            <button
              onClick={() => { onOpenDocs(); setIsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-sky-500" />
                <span>{isRtl ? 'دليل الاستخدام والتشغيل' : 'Operational User Manual'}</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-400">F1</span>
            </button>

            <button
              onClick={() => { onOpenScenarios(); setIsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <PlayCircle className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? 'سيناريوهات العمليات (SOP)' : 'SOP Playbooks'}</span>
              </div>
            </button>

            <button
              onClick={() => { onOpenHelpers(); setIsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? 'أدوات الإغاثة والترميز' : 'Relief & Math Tools'}</span>
              </div>
            </button>

            <button
              onClick={() => { onOpenShortcuts(); setIsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-400">?</span>
            </button>

            {onLockSession && (
              <button
                onClick={() => { onLockSession(); setIsOpen(false); }}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-between transition-colors border-t border-slate-100 dark:border-zinc-800 mt-1 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-rose-500" />
                  <span>{isRtl ? 'قفل الجلسة آمن' : 'Lock Security Session'}</span>
                </div>
              </button>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderQuickMenu;
