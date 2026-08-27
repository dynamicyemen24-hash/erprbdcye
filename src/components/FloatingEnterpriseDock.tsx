import React, { useState } from 'react';
import { 
  Coins, 
  DollarSign, 
  Calendar, 
  QrCode, 
  Command, 
  Printer, 
  BookOpen, 
  RefreshCw, 
  Maximize, 
  Minimize, 
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

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleDockMinimize = () => {
    setIsMinimized(prev => {
      const next = !prev;
      try {
        localStorage.setItem('uamex_dock_minimized', String(next));
      } catch {}
      return next;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 hidden sm:flex items-center gap-1 p-1.5 bg-zinc-950/90 hover:bg-zinc-950/95 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl shadow-2xl shadow-emerald-950/50 transition-all duration-200 select-none animate-in fade-in slide-in-from-bottom-2">
      
      {/* 1. All Helpers Suite Button */}
      <button
        onClick={() => onOpenHelpers()}
        className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl border border-emerald-500/30 hover:border-emerald-500 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer group relative"
        title={isRtl ? 'مصفوفة الأدوات والمقاييس (12 أداة) [Alt+H]' : 'Helper Tools Suite (12 Tools) [Alt+H]'}
      >
        <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:text-white transition-colors" />
        <span className="hidden md:inline">{isRtl ? 'الأدوات المساعدة' : 'Helpers'}</span>
        <span className="px-1.5 py-0.2 bg-emerald-500/30 group-hover:bg-emerald-700 rounded text-[9px] font-mono">12</span>
      </button>

      {/* 2. Direct Zakat Calculator */}
      <button
        onClick={() => onOpenHelpers('zakat_calculator')}
        className="p-2 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 rounded-xl transition-all cursor-pointer relative group"
        title={isRtl ? 'حاسبة الزكاة الشرعية والمصارف' : 'Zakat Assessment Engine'}
      >
        <Coins className="w-4 h-4" />
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
          {isRtl ? 'حاسبة الزكاة والمصارف' : 'Zakat Engine'}
        </div>
      </button>

      {/* 3. Direct FX & Hedging Converter */}
      <button
        onClick={() => onOpenHelpers('fx_hedging')}
        className="p-2 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl transition-all cursor-pointer relative group"
        title={isRtl ? 'محول ومراقب أسعار الصرف والتحوط' : 'Multi-Currency FX & Hedging'}
      >
        <DollarSign className="w-4 h-4" />
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
          {isRtl ? 'محول الصرف والتحوط' : 'FX & Hedging'}
        </div>
      </button>

      {/* 4. Direct Hijri & Seasonal Scheduler */}
      <button
        onClick={() => onOpenHelpers('hijri_converter')}
        className="p-2 hover:bg-teal-500/20 text-slate-300 hover:text-teal-400 rounded-xl transition-all cursor-pointer relative group"
        title={isRtl ? 'محول التقويم وجدولة المواسم الإنسانية' : 'Hijri & Seasonal Scheduler'}
      >
        <Calendar className="w-4 h-4" />
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
          {isRtl ? 'التقويم والمواسم' : 'Hijri Scheduler'}
        </div>
      </button>

      {/* 5. Direct QR & Security Stamper */}
      <button
        onClick={() => onOpenHelpers('qr_stamp_generator')}
        className="p-2 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 rounded-xl transition-all cursor-pointer relative group"
        title={isRtl ? 'مولد الأختام والتحقق الرقمي QR' : 'QR & Digital Audit Stamper'}
      >
        <QrCode className="w-4 h-4" />
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
          {isRtl ? 'الختم والتحقق الرقمي' : 'QR Stamper'}
        </div>
      </button>

      <div className="w-[1px] h-5 bg-zinc-800 mx-1"></div>

      {/* 6. Universal Command Center */}
      <button
        onClick={onOpenCommandCenter}
        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer group"
        title={isRtl ? 'مركز الأوامر الموحد والبحث [Ctrl+K]' : 'Universal Command Center [Ctrl+K]'}
      >
        <Command className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden lg:inline">{isRtl ? 'مركز الأوامر' : 'Commands'}</span>
        <span className="px-1 py-0.2 bg-zinc-800 text-[9px] font-mono text-zinc-400 rounded">⌘K</span>
      </button>

      {/* 7. UAMEX AI Sovereign Engine */}
      <button
        onClick={onOpenCopilot}
        className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-900/40 to-amber-900/40 hover:from-emerald-900/60 hover:to-amber-900/60 text-emerald-300 hover:text-white rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer group"
        title={isRtl ? 'محرك يوماكس إي آي السيادي UAMEX AI™ [Alt+A]' : 'UAMEX AI™ Sovereign Engine [Alt+A]'}
      >
        <Brain className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="hidden lg:inline">{isRtl ? 'يوماكس إي آي' : 'UAMEX AI™'}</span>
      </button>

      {/* 8. Certified Print Suite */}
      <button
        onClick={onOpenPrint}
        className="p-2 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl transition-all cursor-pointer relative group"
        title={isRtl ? 'طباعة التقارير المعمدة A4 [Alt+P]' : 'Print Certified Reports [Alt+P]'}
      >
        <Printer className="w-4 h-4" />
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
          {isRtl ? 'طباعة معتمدة A4' : 'Certified Print'}
        </div>
      </button>

      {/* 9. Master SOP & Governance Playbooks */}
      <button
        onClick={onOpenSOP}
        className="p-2 hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 rounded-xl transition-all cursor-pointer relative group"
        title={isRtl ? 'دليل الإجراءات المعيارية واللوائح (Master SOP)' : 'Master SOP & Governance Bylaws'}
      >
        <BookOpen className="w-4 h-4" />
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
          {isRtl ? 'اللوائح والإجراءات' : 'Master SOP'}
        </div>
      </button>

      <div className="w-[1px] h-5 bg-zinc-800 mx-1"></div>

      {/* 10. Live Sync */}
      {onRefreshData && (
        <button
          onClick={onRefreshData}
          className="p-2 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 rounded-xl transition-all cursor-pointer relative group"
          title={isRtl ? 'تحديث ومزامنة السجلات الحية مع Neon DB' : 'Refresh Data with Neon DB'}
        >
          <RefreshCw className="w-4 h-4" />
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
            {isRtl ? 'مزامنة السجلات' : 'Live Sync'}
          </div>
        </button>
      )}

      {/* 11. Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        className="p-2 hover:bg-zinc-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer relative group"
        title={isRtl ? 'تبديل وضع الشاشة الكاملة (F11)' : 'Toggle Fullscreen'}
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-50">
          {isRtl ? 'ملء الشاشة' : 'Fullscreen'}
        </div>
      </button>

      {/* 12. Minimize Dock */}
      <button
        onClick={toggleDockMinimize}
        className="p-2 hover:bg-zinc-800 text-slate-500 hover:text-slate-300 rounded-xl transition-all cursor-pointer"
        title={isRtl ? 'تصغير الشريط السفلي' : 'Minimize Dock'}
      >
        <ChevronDown className="w-4 h-4" />
      </button>

    </div>
  );
};

export default FloatingEnterpriseDock;
