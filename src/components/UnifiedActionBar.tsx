import React from 'react';
import { 
  Building2, Target, ShieldCheck, Sparkles, Eye, Maximize2, RefreshCw, MoreHorizontal, Settings, History, Printer, FileText, Download, Copy, Zap, Filter, LayoutDashboard
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { printElement, exportToPDF, exportToExcel } from '../lib/printUtils';

import { GlobalFilterBar } from './dashboard/GlobalFilterBar';

export interface UnifiedActionBarProps {
  lang: 'ar' | 'en';
  activeSubTab: 'overview' | 'performance' | 'readiness';
  setActiveSubTab: (tab: 'overview' | 'performance' | 'readiness') => void;
  isViewDropdownOpen: boolean;
  setIsViewDropdownOpen: (open: boolean) => void;
  isMoreDropdownOpen: boolean;
  setIsMoreDropdownOpen: (open: boolean) => void;
  setIsCustomizerOpen: (open: boolean) => void;
  handleGenerateSummary: () => void;
  onRefresh?: () => void;
  onNavigate: (tabId: string) => void;
  handleResetLayout: () => void;
  programs: any[];
  projects: any[];
  approvalRequests: any[];
}

export const UnifiedActionBar: React.FC<UnifiedActionBarProps> = ({
  lang,
  activeSubTab,
  setActiveSubTab,
  isViewDropdownOpen,
  setIsViewDropdownOpen,
  isMoreDropdownOpen,
  setIsMoreDropdownOpen,
  setIsCustomizerOpen,
  handleGenerateSummary,
  onRefresh,
  onNavigate,
  handleResetLayout,
  programs,
  projects,
  approvalRequests
}) => {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  return (
    <div className="unified-action-bar flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 py-2 px-1">
      
      {/* Primary Page Title & Top-Level Navigation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 w-full lg:w-auto">
        {/* Exclusive Page Title Block */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 shadow-2xs">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {lang === 'ar' ? 'بيئة تشغيلية مباشرة' : 'Live Enterprise Workspace'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              {lang === 'ar' ? 'لوحة القيادة الاستراتيجية والأداء' : 'Strategy & Performance Dashboard'}
            </h1>
          </div>
        </div>

        {/* Top-Level Navigation Subtab Controls */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'overview'
                ? 'bg-white text-emerald-700 dark:bg-zinc-700 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الكونسول التشغيلي' : 'Command Console'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('performance')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'performance'
                ? 'bg-white text-emerald-700 dark:bg-zinc-700 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'مؤشرات الأداء' : 'Performance'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('readiness')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'readiness'
                ? 'bg-white text-emerald-700 dark:bg-zinc-700 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'جاهزية النظام' : 'Readiness'}</span>
          </button>
        </div>
      </div>

      {/* Unified Professional Action Toolbar */}
      <div className="flex items-center gap-2.5 flex-wrap shrink-0 relative w-full lg:w-auto justify-end">
        <Tooltip 
          content={lang === 'ar' ? 'عرض التقرير التنفيذي الشامل والتحليلات البيئية والميدانية (15 باباً معمارياً)' : 'View comprehensive 15-part executive report & analytics'}
          position="bottom"
        >
          <button
            onClick={() => onNavigate('reports')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-slate-950 dark:text-white rounded-lg shadow-2xs transition-all cursor-pointer font-bold"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'التقرير التنفيذي الشامل' : 'Comprehensive Executive Report'}</span>
          </button>
        </Tooltip>

        <Tooltip 
          content={lang === 'ar' ? 'توليد تقرير ملخص تنفيذي ذكي (Gemini)' : 'Generate AI executive summary'}
          position="bottom"
        >
          <button
            onClick={handleGenerateSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
            <span>{lang === 'ar' ? 'ملخص ذكي' : 'AI Summary'}</span>
          </button>
        </Tooltip>

        {/* Global Filters Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setIsFilterOpen(!isFilterOpen); setIsViewDropdownOpen(false); setIsMoreDropdownOpen(false); }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-extrabold rounded-lg shadow-2xs transition-all cursor-pointer border ${
              isFilterOpen 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' 
                : 'bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200'
            }`}
            title={lang === 'ar' ? 'تصفية البيانات' : 'Filter Data'}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصفية' : 'Filter'}</span>
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 sm:left-auto sm:right-0 mt-1.5 w-screen max-w-[800px] z-50">
              <GlobalFilterBar lang={lang} onRefresh={onRefresh} />
            </div>
          )}
        </div>

        {/* View Tools Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setIsViewDropdownOpen(!isViewDropdownOpen); setIsMoreDropdownOpen(false); }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-extrabold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-2xs transition-all cursor-pointer"
            title={lang === 'ar' ? 'أدوات العرض' : 'View options'}
          >
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{lang === 'ar' ? 'العرض' : 'View'}</span>
          </button>

          {isViewDropdownOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1.5 text-xs space-y-1 text-right rtl:text-right">
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                  setIsViewDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center justify-between transition-all cursor-pointer font-bold"
              >
                <span className="flex items-center gap-2"><Maximize2 className="w-3.5 h-3.5 text-blue-600" /> {lang === 'ar' ? 'ملء الشاشة' : 'Fullscreen'}</span>
              </button>
              <button
                onClick={() => { if (onRefresh) onRefresh(); setIsViewDropdownOpen(false); }}
                className="w-full px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center justify-between transition-all cursor-pointer font-bold"
              >
                <span className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}</span>
              </button>
            </div>
          )}
        </div>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setIsMoreDropdownOpen(!isMoreDropdownOpen); setIsViewDropdownOpen(false); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-2xs transition-all cursor-pointer"
            title={lang === 'ar' ? 'المزيد من الإجراءات والخيارات' : 'More options & settings'}
          >
            <MoreHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'ar' ? 'المزيد' : 'More'}</span>
          </button>

          {isMoreDropdownOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1.5 text-xs space-y-1 text-right rtl:text-right">
              {/* Secondary Control: Settings */}
              <button
                onClick={() => { setIsCustomizerOpen(true); setIsMoreDropdownOpen(false); }}
                className="w-full px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-bold"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'ar' ? 'إعدادات وتخصيص الودجات' : 'Dashboard Settings'}</span>
              </button>

              {/* Secondary Control: Reports & Analytics */}
              <button
                onClick={() => { onNavigate('reports'); setIsMoreDropdownOpen(false); }}
                className="w-full px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-bold"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'ar' ? 'شاشة التقارير والتحليلات الشاملة' : 'Reports & Analytics Center'}</span>
              </button>

              {/* Secondary Control: History & Audit Log */}
              <button
                onClick={() => { onNavigate('governance'); setIsMoreDropdownOpen(false); }}
                className="w-full px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-bold"
              >
                <History className="w-3.5 h-3.5 text-blue-500" />
                <span>{lang === 'ar' ? 'سجل العمليات والتدقيق' : 'History & Audit Log'}</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

              {/* Secondary Control: Print */}
              <button
                onClick={() => { printElement('dashboard-content'); setIsMoreDropdownOpen(false); }}
                className="w-full px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-bold"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'ar' ? 'طباعة التقرير' : 'Print Report'}</span>
              </button>

              {/* Export Controls */}
              <button
                onClick={() => { exportToPDF('dashboard-content', 'dashboard-report'); setIsMoreDropdownOpen(false); }}
                className="w-full px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-bold"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>{lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}</span>
              </button>

              <button
                onClick={() => { exportToExcel(programs, projects, approvalRequests, lang); setIsMoreDropdownOpen(false); }}
                className="w-full px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-bold"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'ar' ? 'تصدير Excel' : 'Export Excel'}</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert(lang === 'ar' ? 'تم نسخ رابط اللوحة إلى الحافظة' : 'Dashboard link copied');
                  setIsMoreDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-bold"
              >
                <Copy className="w-3.5 h-3.5 text-blue-500" />
                <span>{lang === 'ar' ? 'نسخ رابط اللوحة' : 'Copy Dashboard Link'}</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

              <button
                onClick={() => {
                  handleResetLayout();
                  setIsMoreDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-bold"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'ar' ? 'إعادة ضبط التخطيط' : 'Reset Layout'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default UnifiedActionBar;

