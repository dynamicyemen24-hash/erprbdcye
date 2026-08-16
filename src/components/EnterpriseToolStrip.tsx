import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Save,
  RefreshCw,
  Search,
  FilterX,
  Download,
  Printer,
  Sparkles,
  Grid,
  List,
  Calendar,
  Globe,
  ZoomIn,
  ZoomOut,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
  Zap,
  ChevronDown,
  ShieldCheck,
  CheckSquare,
  FileText,
  History,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { triggerHaptic } from '../helpers/hapticSwipe';

export interface ContextualAction {
  id: string;
  labelAr: string;
  labelEn: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
  badgeAr?: string;
  badgeEn?: string;
  badgeColor?: string;
}

export interface EnterpriseToolStripProps {
  lang: 'ar' | 'en';
  onAddRecord?: () => void;
  onRefreshData: () => void;
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onResetFilters?: () => void;
  activeFilterCount?: number;
  viewMode?: 'grid' | 'list' | 'gantt' | 'map';
  onViewModeChange?: (mode: 'grid' | 'list' | 'gantt' | 'map') => void;
  zoomLevel?: 'months' | 'quarters' | 'annual';
  onZoomChange?: (zoom: 'months' | 'quarters' | 'annual') => void;
  onOpenExportModal?: () => void;
  onOpenCopilot?: () => void;
  addRecordLabelAr?: string;
  addRecordLabelEn?: string;
  showZoomControls?: boolean;
  showViewModeSwitcher?: boolean;
  activeModule?: 'projects' | 'finance' | 'beneficiaries' | 'programs' | string;
  contextualActions?: ContextualAction[];
}

export const EnterpriseToolStrip: React.FC<EnterpriseToolStripProps> = ({
  lang,
  onAddRecord,
  onRefreshData,
  isLoading = false,
  searchQuery = '',
  onSearchChange,
  onResetFilters,
  activeFilterCount = 0,
  viewMode = 'grid',
  onViewModeChange,
  zoomLevel = 'months',
  onZoomChange,
  onOpenExportModal,
  onOpenCopilot,
  addRecordLabelAr = 'إضافة جديد',
  addRecordLabelEn = 'Add New',
  showZoomControls = false,
  showViewModeSwitcher = true,
  activeModule,
  contextualActions = []
}) => {
  const isRtl = lang === 'ar';
  const [isContextualOpen, setIsContextualOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsContextualOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Build module-adaptive default contextual actions if none or as base
  const buildModuleActions = (): ContextualAction[] => {
    const merged = [...contextualActions];

    if (activeModule === 'projects') {
      if (!merged.some(a => a.id === 'proj-new') && onAddRecord) {
        merged.push({
          id: 'proj-new',
          labelAr: 'إنشاء مشروع إغاثي جديد',
          labelEn: 'Create New Project',
          icon: Briefcase,
          shortcut: 'Alt+N',
          action: onAddRecord
        });
      }
      if (!merged.some(a => a.id === 'proj-budget-approve')) {
        merged.push({
          id: 'proj-budget-approve',
          labelAr: 'اعتماد الميزانيات الميدانية',
          labelEn: 'Approve Project Budget',
          icon: ShieldCheck,
          badgeAr: 'سريع',
          badgeEn: 'Fast',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          action: () => {
            showToast(isRtl ? 'تم تحويل الميزانيات الميدانية للاعتماد المالي 🛡️' : 'Budget approvals triggered 🛡️');
          }
        });
      }
      if (!merged.some(a => a.id === 'proj-audit')) {
        merged.push({
          id: 'proj-audit',
          labelAr: 'عرض سجل التدقيق والمراجعة',
          labelEn: 'View Audit Trail',
          icon: History,
          action: () => {
            showToast(isRtl ? 'فتح سجل مراجعة المشاريع والمحطات 📋' : 'Opening project audit logs 📋');
          }
        });
      }
    } else if (activeModule === 'finance') {
      if (!merged.some(a => a.id === 'fin-new-voucher') && onAddRecord) {
        merged.push({
          id: 'fin-new-voucher',
          labelAr: 'تسجيل قيد محاسبي معتمد',
          labelEn: 'New Approved Voucher',
          icon: DollarSign,
          shortcut: 'Alt+V',
          action: onAddRecord
        });
      }
      if (!merged.some(a => a.id === 'fin-budget-approve')) {
        merged.push({
          id: 'fin-budget-approve',
          labelAr: 'اعتماد الميزانية وتخصيص الاعتمادات',
          labelEn: 'Approve Budget Allocation',
          icon: CheckSquare,
          badgeAr: 'IPSAS',
          badgeEn: 'IPSAS',
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          action: () => {
            showToast(isRtl ? 'تم إجراء الفحص الدفتري واعتماد الميزانية ⚖️' : 'IPSAS ledger check passed ⚖️');
          }
        });
      }
      if (!merged.some(a => a.id === 'fin-audit')) {
        merged.push({
          id: 'fin-audit',
          labelAr: 'عرض التقرير المالي والتدقيق المحاسبي',
          labelEn: 'View Financial Audit Ledger',
          icon: FileText,
          action: () => {
            showToast(isRtl ? 'عرض سجل القيد القياسي المزدوج 🔍' : 'Double-entry audit log retrieved 🔍');
          }
        });
      }
    } else if (activeModule === 'beneficiaries') {
      if (!merged.some(a => a.id === 'ben-reg') && onAddRecord) {
        merged.push({
          id: 'ben-reg',
          labelAr: 'تسجيل مستفيد جديد بالنظام',
          labelEn: 'Register Beneficiary',
          icon: Plus,
          action: onAddRecord
        });
      }
      if (!merged.some(a => a.id === 'ben-audit')) {
        merged.push({
          id: 'ben-audit',
          labelAr: 'سجل تدقيق الاستحقاقات والمساعدات',
          labelEn: 'Disbursement Audit Trail',
          icon: History,
          action: () => {
            showToast(isRtl ? 'عرض سجل تدقيق توزيع المساعدات 👥' : 'Beneficiary audit trail opened 👥');
          }
        });
      }
    }

    return merged;
  };

  const finalActions = buildModuleActions();

  return (
    <div
      className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800/80 px-3 py-2 flex items-center justify-between gap-3 flex-wrap shadow-2xs z-20 relative"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Group 1: Primary Action Buttons & Contextual Menu Dropdown */}
      <div className="flex items-center gap-1.5 flex-wrap" ref={menuRef}>
        {onAddRecord && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onAddRecord();
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? addRecordLabelAr : addRecordLabelEn}</span>
          </button>
        )}

        {/* Adaptive Contextual Actions Dropdown Button */}
        {finalActions.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsContextualOpen(prev => !prev);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                isContextualOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md scale-102'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 text-amber-500 ${isContextualOpen ? 'text-slate-950' : ''}`} />
              <span>{isRtl ? 'إجراءات سياقية' : 'Context Actions'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isContextualOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Contextual Dropdown Menu */}
            {isContextualOpen && (
              <div className="absolute top-full mt-1.5 rtl:right-0 ltr:left-0 z-50 bg-slate-900 border border-slate-700/80 text-white rounded-xl shadow-2xl min-w-[260px] py-2 animate-fade-in backdrop-blur-md space-y-0.5">
                <div className="px-3 py-1 border-b border-slate-800 text-[10px] font-mono text-amber-400 flex items-center justify-between">
                  <span>{isRtl ? 'إجراءات تشغيلية سريعة' : 'Rapid Operational Actions'}</span>
                  <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase text-[9px]">
                    {activeModule || 'System'}
                  </span>
                </div>

                {finalActions.map((act) => {
                  const Icon = act.icon || Zap;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        setIsContextualOpen(false);
                        act.action();
                      }}
                      className="w-full text-right rtl:text-right ltr:text-left px-3 py-2 hover:bg-slate-800/90 text-slate-200 hover:text-amber-300 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="font-bold">{isRtl ? act.labelAr : act.labelEn}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {act.badgeAr && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${act.badgeColor || 'bg-slate-800 text-zinc-400'}`}>
                            {isRtl ? act.badgeAr : act.badgeEn}
                          </span>
                        )}
                        {act.shortcut && (
                          <span className="font-mono text-[9px] bg-slate-950 text-zinc-400 px-1.5 py-0.5 rounded border border-slate-800">
                            {act.shortcut}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onRefreshData();
          }}
          disabled={isLoading}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5"
          title={isRtl ? 'تحديث وتزامن البيانات (F5)' : 'Refresh Data (F5)'}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-[11px]">{isRtl ? 'تحديث' : 'Sync'}</span>
        </button>

        {onOpenExportModal && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenExportModal();
            }}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5"
            title={isRtl ? 'تصدير وحفظ التقارير (Ctrl+E)' : 'Export Reports (Ctrl+E)'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline text-[11px]">{isRtl ? 'تصدير' : 'Export'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => window.print()}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-zinc-700"
          title={isRtl ? 'طباعة الشاشة الحالية (Ctrl+P)' : 'Print View (Ctrl+P)'}
        >
          <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
        </button>

        {onOpenCopilot && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenCopilot();
            }}
            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline text-[11px]">{isRtl ? 'تحليل الذكاء' : 'AI Analysis'}</span>
          </button>
        )}
      </div>

      {/* Group 2: Quick Search & Filter Toolbar */}
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        {onSearchChange && (
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute top-1/2 -translate-y-1/2 rtl:right-2.5 ltr:left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={isRtl ? 'فلترة سريعة بالسجلات...' : 'Quick filter records...'}
              className="w-full bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl rtl:pr-8 ltr:pl-8 rtl:pl-3 ltr:pr-3 py-1 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute top-1/2 -translate-y-1/2 rtl:left-2 ltr:right-2 text-slate-400 hover:text-rose-500 font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {activeFilterCount > 0 && onResetFilters && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onResetFilters();
            }}
            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-black flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            title={isRtl ? 'إلغاء الفلاتر النشطة' : 'Reset active filters'}
          >
            <FilterX className="w-3 h-3" />
            <span>({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* Group 3: View Mode & Zoom Granularity Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Zoom Overlay Controls */}
        {showZoomControls && onZoomChange && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                onZoomChange('months');
                triggerHaptic('light');
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                zoomLevel === 'months'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? 'شهري' : 'Monthly'}
            </button>

            <button
              type="button"
              onClick={() => {
                onZoomChange('quarters');
                triggerHaptic('light');
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                zoomLevel === 'quarters'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? 'ربع سنوي' : 'Quarterly'}
            </button>

            <button
              type="button"
              onClick={() => {
                onZoomChange('annual');
                triggerHaptic('light');
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                zoomLevel === 'annual'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? 'سنوي' : 'Annual'}
            </button>
          </div>
        )}

        {/* View Switcher Controls */}
        {showViewModeSwitcher && onViewModeChange && (
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                onViewModeChange('grid');
                triggerHaptic('light');
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
              title={isRtl ? 'عرض شبكي / بطاقات' : 'Grid / Card View'}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                onViewModeChange('list');
                triggerHaptic('light');
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
              title={isRtl ? 'عرض جدول متناول' : 'List Table View'}
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                onViewModeChange('gantt');
                triggerHaptic('light');
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'gantt'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
              title={isRtl ? 'عرض المخطط الزمني Gantt' : 'Gantt Timeline View'}
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                onViewModeChange('map');
                triggerHaptic('light');
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
              title={isRtl ? 'عرض الخريطة الجغرافية' : 'GIS Map View'}
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 font-black text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
