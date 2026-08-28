import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  LayoutDashboard, 
  Sparkles, 
  Check, 
  SlidersHorizontal, 
  ShieldCheck, 
  TrendingUp, 
  Briefcase, 
  Clock, 
  Layers, 
  ArrowRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { triggerHaptic } from '../../helpers/hapticSwipe';
import { showToast } from '../enterprise/EnterpriseToastContainer';

interface EnterpriseExperienceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  currentMode: 'work_first' | 'classic_analytics';
  onSelectMode: (mode: 'work_first' | 'classic_analytics', persistDefault?: boolean) => void;
  currentUserRole?: string;
}

export const EnterpriseExperienceModeModal: React.FC<EnterpriseExperienceModeModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentMode,
  onSelectMode,
  currentUserRole = 'مدير عام / مسؤول تنفيذي'
}) => {
  if (!isOpen) return null;
  const isRtl = lang === 'ar';

  const [selectedMode, setSelectedMode] = useState<'work_first' | 'classic_analytics'>(currentMode);
  const [persistAsDefault, setPersistAsDefault] = useState(true);
  const [showQuickPillInRibbon, setShowQuickPillInRibbon] = useState(() => {
    try {
      const val = localStorage.getItem('uamex_show_mode_pill_in_ribbon');
      return val !== 'false';
    } catch {
      return true;
    }
  });

  const handleApply = (modeToApply: 'work_first' | 'classic_analytics', isTemporary = false) => {
    triggerHaptic('success');
    try {
      localStorage.setItem('uamex_show_mode_pill_in_ribbon', String(showQuickPillInRibbon));
      if (!isTemporary && persistAsDefault) {
        localStorage.setItem('uamex_home_experience_mode', modeToApply);
      }
    } catch {}

    onSelectMode(modeToApply, !isTemporary && persistAsDefault);

    showToast({
      type: 'success',
      title: isRtl ? 'تم تحديث نمط بيئة العمل' : 'Experience Mode Updated',
      message: isRtl
        ? `تم تفعيل [${modeToApply === 'work_first' ? 'قمرة الإنجاز الفوري' : 'النمط التحليلي الكلاسيكي'}] ${isTemporary ? '(معاينة مؤقتة)' : 'كنمط معتمد'}`
        : `Switched to [${modeToApply === 'work_first' ? 'Quantum Work-First' : 'Classic Analytics'}] ${isTemporary ? '(Preview)' : 'as default'}`,
      duration: 4000
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header Strip */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {isRtl ? 'مركز إدارة أنماط بيئة العمل المؤسسية' : 'Enterprise Experience Mode Controller'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                  UAMEX Multi-Cockpit™
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {isRtl 
                  ? 'اختر النمط المناسب لطبيعة دورك اليومي لتفادي أي تشتيت ولضمان أعلى سرعة في الإنجاز'
                  : 'Select the optimal operational experience tailored for your role and task frequency'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          
          {/* AI Recommendation Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black text-emerald-800 dark:text-emerald-300">
                  {isRtl ? 'توصية الذكاء الاصطناعي الذكية (UAMEX AI Recommendation): ' : 'AI Role Recommendation: '}
                </span>
                <span className="text-slate-700 dark:text-zinc-300 font-medium">
                  {isRtl 
                    ? `بناءً على دورك التشغيلي (${currentUserRole})، نوصي بالاعتماد على [قمرة الإنجاز الفوري] لإنهاء قرارات الصرف والمشاريع بأعلى كفاءة.`
                    : `Based on your profile (${currentUserRole}), the Quantum Work-First Cockpit is recommended for high-speed approvals.`}
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Quantum Work-First Cockpit */}
            <div 
              onClick={() => {
                triggerHaptic('light');
                setSelectedMode('work_first');
              }}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedMode === 'work_first'
                  ? 'border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
              }`}
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-xl border ${
                      selectedMode === 'work_first'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                    }`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{isRtl ? 'قمرة الإنجاز الفوري المؤسسي' : 'Quantum Work-First Cockpit™'}</span>
                      </h4>
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {isRtl ? 'نمط العمل السريع والإنتاجية اليومية' : 'High-Speed Operational Execution'}
                      </p>
                    </div>
                  </div>

                  {currentMode === 'work_first' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                      {isRtl ? 'الوضع النشط حالياً' : 'Current Active'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-4">
                  {isRtl 
                    ? 'يركز كلياً على المهام الميدانية أولاً، مع طابور القرارات العاجلة، الإجراءات السريعة بنقرة واحدة، واستئناف العمل دون أي تشتيت بصري.'
                    : 'Puts operational execution first: urgent approval queue, 1-click frequent actions, and instant resume intelligence.'}
                </p>

                {/* Features List */}
                <div className="space-y-2 border-t border-slate-100 dark:border-zinc-800/80 pt-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{isRtl ? 'طابور قرارات عاجلة مع فحص الذكاء الاصطناعي واعتماد بنقرة' : 'Action Stream queue with ambient AI verification'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{isRtl ? 'استئناف فوري لآخر 4 سجلات ومشروعات نشطة' : 'Resume Intelligence for recent projects'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{isRtl ? 'جدول تدفق المعاملات اللحظية لفروع الجمعية' : 'Live operational stream across field branches'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{isRtl ? 'فحص ومطابقة قيود الأستاذ العام IPSAS في الخلفية' : 'Ambient AI Guardian auditing double-entry rules'}</span>
                  </div>
                </div>
              </div>

              {/* Selection Radio / Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">
                  {isRtl ? 'يوصى به لمدراء المشاريع والمالية والمشتريات' : 'Ideal for Field, Finance & Procurement'}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedMode === 'work_first'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 dark:border-zinc-700'
                }`}>
                  {selectedMode === 'work_first' && <Check className="w-3 h-3" />}
                </div>
              </div>
            </div>

            {/* Card 2: Classic Strategic Analytics Hub */}
            <div 
              onClick={() => {
                triggerHaptic('light');
                setSelectedMode('classic_analytics');
              }}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedMode === 'classic_analytics'
                  ? 'border-amber-500 bg-amber-500/[0.03] dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
              }`}
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-xl border ${
                      selectedMode === 'classic_analytics'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                    }`}>
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{isRtl ? 'النمط الاستراتيجي التحليلي الكلاسيكي' : 'Classic Strategic Analytics Hub™'}</span>
                      </h4>
                      <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        {isRtl ? 'نمط الرؤية الشاملة والمؤشرات التراكمية' : 'Comprehensive Analytics & Governance'}
                      </p>
                    </div>
                  </div>

                  {currentMode === 'classic_analytics' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                      {isRtl ? 'الوضع النشط حالياً' : 'Current Active'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-4">
                  {isRtl 
                    ? 'يوفر لوحة القيادة التحليلية الشاملة مع بطاقات الأداء المتوازن (BSC)، مصفوفة SWOT، ومطابقة المعايير الدولية (Sphere, CHS, IATI).'
                    : 'Provides holistic executive analytics: Balanced Scorecards (BSC), SWOT analysis, and international standard benchmarks.'}
                </p>

                {/* Features List */}
                <div className="space-y-2 border-t border-slate-100 dark:border-zinc-800/80 pt-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{isRtl ? 'بطاقات الأداء المتوازن (BSC) والمصفوفة الرباعية SWOT' : 'Balanced Scorecard (BSC) and SWOT analysis'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{isRtl ? 'مساحات عمل الأدوار المؤسسية الـ 8 المستقلة' : '8 Institutional Role Workspaces'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{isRtl ? 'الرسوم البيانية التراكمية لتوزيع الموازنات والمستفيدين' : 'Cumulative budget & beneficiary chart breakdowns'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{isRtl ? 'مؤشرات الامتثال للمعايير الدولية (Sphere & CHS 9)' : 'Compliance telemetry for Sphere & CHS standards'}</span>
                  </div>
                </div>
              </div>

              {/* Selection Radio / Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">
                  {isRtl ? 'يوصى به لأعضاء مجلس الإدارة والتخطيط والمراجعة' : 'Ideal for Board, Executive & Audit'}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedMode === 'classic_analytics'
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-slate-300 dark:border-zinc-700'
                }`}>
                  {selectedMode === 'classic_analytics' && <Check className="w-3 h-3" />}
                </div>
              </div>
            </div>

          </div>

          {/* Preferences and Behavior Controls */}
          <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-700/80 space-y-3 text-xs">
            <div className="font-extrabold text-slate-800 dark:text-zinc-200 mb-1">
              {isRtl ? 'إعدادات الثبات والتحكم الذكي:' : 'Preferences & Experience Behavior:'}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={persistAsDefault}
                onChange={(e) => setPersistAsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
              />
              <span className="text-slate-700 dark:text-zinc-300 font-bold">
                {isRtl 
                  ? 'حفظ وتثبيت هذا النمط كشاشة رئيسية دائمة عند تسجيل الدخول لحسابي'
                  : 'Remember and set this mode as my permanent startup default'}
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showQuickPillInRibbon}
                onChange={(e) => setShowQuickPillInRibbon(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
              />
              <span className="text-slate-700 dark:text-zinc-300 font-medium">
                {isRtl 
                  ? 'إظهار شريط التبديل السريع المقتضب أعلى لوحة القيادة لسهولة التبديل'
                  : 'Display compact mode switcher pill in top context ribbon'}
              </span>
            </label>

            <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span>
                {isRtl ? '💡 اختصار لوحة المفاتيح المباشر للتبديل اللحظي:' : 'Direct global keyboard shortcut:'}
              </span>
              <kbd className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Alt + X
              </kbd>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => handleApply(selectedMode, true)}
            className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
          >
            {isRtl ? 'معاينة تجريبية مؤقتة (دون حفظ الافتراضي)' : 'Quick Temporary Preview'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              onClick={() => handleApply(selectedMode, false)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isRtl ? 'تطبيق واعتماد النمط المؤسسي' : 'Apply & Save Experience Mode'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseExperienceModeModal;
