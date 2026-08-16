import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Save, 
  Lock, 
  ShieldCheck, 
  Building2, 
  Coins, 
  Filter, 
  Info, 
  Printer, 
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

interface FinanceOperationsControlBarProps {
  lang: 'ar' | 'en';
  onNewVoucher: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  selectedCurrency: string;
  onCurrencyChange: (curr: string) => void;
  onOpenReverseModal: () => void;
  userPermissions?: {
    canPost?: boolean;
    canReverse?: boolean;
    canEdit?: boolean;
  };
}

export default function FinanceOperationsControlBar({
  lang,
  onNewVoucher,
  onRefresh,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedBranch,
  onBranchChange,
  selectedCurrency,
  onCurrencyChange,
  onOpenReverseModal,
  userPermissions = { canPost: true, canReverse: true, canEdit: true }
}: FinanceOperationsControlBarProps) {
  const isRtl = lang === 'ar';
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-visible">
      
      {/* TOP STRIP: MULTI-TENANT BRANCH & CURRENCY SELECTORS WITH SECURITY GUARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800 text-xs">
        
        {/* BRANCH & ORGANIZATION SELECTOR */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            <span className="font-bold text-[11px]">{isRtl ? 'الفيلق / الفرع:' : 'Branch / Tenant:'}</span>
          </div>
          <select
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="ALL">{isRtl ? 'جميع الفروع والجمعيات الشريكة' : 'All Tenants & Branches'}</option>
            <option value="HQ_SANAA">{isRtl ? '🏢 المركز الرئيسي - صنعاء (HQ)' : 'Main HQ - Sanaa'}</option>
            <option value="BR_ADEN">{isRtl ? '🌊 فرع المحافظات الجنوبية - عدن' : 'Aden South Branch'}</option>
            <option value="BR_TAIZ">{isRtl ? '🏔️ فرع تعز والمناطق الميدانية' : 'Taiz Field Branch'}</option>
          </select>
        </div>

        {/* MULTI-CURRENCY SELECTOR & SECURITY LEVEL BADGE */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-zinc-400 text-[11px]">{isRtl ? 'عملة الحركة:' : 'Tx Currency:'}</span>
            <select
              value={selectedCurrency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-amber-400 outline-none cursor-pointer"
            >
              <option value="YER">YER (ريال يمني)</option>
              <option value="USD">USD (دولار أمريكي)</option>
              <option value="SAR">SAR (ريال سعودي)</option>
              <option value="EUR">EUR (يورو أوروبي)</option>
            </select>
          </div>

          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{isRtl ? 'صلاحيات مفعلة: مستوى 4' : 'Security L4 Active'}</span>
          </span>
        </div>
      </div>

      {/* BOTTOM ACTION BAR: SEARCH, ADD, REVERSE ENTRY, REFRESH WITH ENHANCED TOOLTIPS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
        
        {/* SEARCH INPUT WITH TOOLTIP */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute top-2.5 right-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isRtl ? 'بحث بكود القيد، رقم السند، أو بيان الحركة...' : 'Search vouchers by ref code, title or desc...'}
            className="w-full pr-9 pl-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-100 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* TOOLBAR ACTIONS BUTTON GROUP */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          
          {/* NEW JOURNAL VOUCHER BUTTON */}
          <div className="relative">
            <button
              onClick={onNewVoucher}
              onMouseEnter={() => setShowTooltip('new_voucher')}
              onMouseLeave={() => setShowTooltip(null)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة قيد / سند جديد' : 'New Journal Voucher'}</span>
            </button>
            {showTooltip === 'new_voucher' && (
              <div className="absolute bottom-full mb-2 right-0 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] p-2 rounded-lg shadow-xl w-48 z-50 animate-in fade-in">
                {isRtl ? 'إنشاء قيد يومية جديد أو سند قبض/صرف مزدوج متزن' : 'Create new balanced journal, receipt or payment voucher.'}
              </div>
            )}
          </div>

          {/* REVERSE ENTRY (قيد عكسي تسويق آلي) BUTTON */}
          <div className="relative">
            <button
              onClick={onOpenReverseModal}
              disabled={!userPermissions.canReverse}
              onMouseEnter={() => setShowTooltip('reverse_entry')}
              onMouseLeave={() => setShowTooltip(null)}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isRtl ? 'إنشاء قيد عكسي' : 'Reverse Entry'}</span>
            </button>
            {showTooltip === 'reverse_entry' && (
              <div className="absolute bottom-full mb-2 right-0 bg-zinc-900 border border-zinc-700 text-amber-300 text-[10px] p-2 rounded-lg shadow-xl w-52 z-50 animate-in fade-in">
                {isRtl ? 'إلغاء وتصحيح قيد مرحّل سابقاً عبر إنشاء قيد عكسي آلي معتمد' : 'Reverse a posted transaction with automated opposite debit/credit lines.'}
              </div>
            )}
          </div>

          {/* REFRESH DATA BUTTON */}
          <div className="relative">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              onMouseEnter={() => setShowTooltip('refresh')}
              onMouseLeave={() => setShowTooltip(null)}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
            </button>
            {showTooltip === 'refresh' && (
              <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] p-2 rounded-lg shadow-xl w-40 z-50 animate-in fade-in">
                {isRtl ? 'تحديث كشوفات الدفتر العام والقيود من قاعدة البيانات' : 'Re-fetch latest ledger records from database.'}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
