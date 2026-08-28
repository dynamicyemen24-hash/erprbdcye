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
  CheckCircle2,
  Eye,
  Laptop,
  Sun,
  Moon,
  Users,
  Activity,
  AlertTriangle
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

  const [activeTab, setActiveTab] = useState<'comparison' | 'interactive_preview'>('comparison');
  const [selectedMode, setSelectedMode] = useState<'work_first' | 'classic_analytics'>(currentMode);
  const [persistAsDefault, setPersistAsDefault] = useState(true);
  const [adaptiveCadence, setAdaptiveCadence] = useState(() => {
    try {
      return localStorage.getItem('uamex_adaptive_cadence') === 'true';
    } catch {
      return false;
    }
  });
  const [showQuickPillInRibbon, setShowQuickPillInRibbon] = useState(() => {
    try {
      const val = localStorage.getItem('uamex_show_mode_pill_in_ribbon');
      return val !== 'false';
    } catch {
      return true;
    }
  });

  const handleApplyPersona = (persona: 'executive' | 'field_pm' | 'auditor') => {
    triggerHaptic('medium');
    if (persona === 'executive') {
      setSelectedMode('classic_analytics');
      showToast({
        type: 'info',
        title: isRtl ? 'تم تخصيص النمط لدور الإدارة العليا' : 'Persona Applied: Executive',
        message: isRtl ? 'تم تفعيل النمط التحليلي الشامل وبطاقات الأداء المتوازن' : 'Strategic Analytics Hub & BSC scorecards selected'
      });
    } else {
      setSelectedMode('work_first');
      showToast({
        type: 'info',
        title: isRtl ? 'تم تخصيص النمط للدور الميداني والتنفيذي' : 'Persona Applied: Operations',
        message: isRtl ? 'تم تفعيل قمرة الإنجاز الفوري لسرعة المعاملات الميدانية' : 'Quantum Work-First Cockpit selected for high throughput'
      });
    }
  };

  const handleApply = (modeToApply: 'work_first' | 'classic_analytics', isTemporary = false) => {
    triggerHaptic('success');
    try {
      localStorage.setItem('uamex_show_mode_pill_in_ribbon', String(showQuickPillInRibbon));
      localStorage.setItem('uamex_adaptive_cadence', String(adaptiveCadence));
      if (!isTemporary && persistAsDefault) {
        localStorage.setItem('uamex_home_experience_mode', modeToApply);
      }
    } catch {}

    onSelectMode(modeToApply, !isTemporary && persistAsDefault);

    showToast({
      type: 'success',
      title: isRtl ? 'تم اعتماد وتحديث نمط بيئة العمل' : 'Experience Mode Updated',
      message: isRtl
        ? `تم تفعيل [${modeToApply === 'work_first' ? 'قمرة الإنجاز الفوري المؤسسي' : 'النمط الاستراتيجي التحليلي الكلاسيكي'}] ${isTemporary ? '(معاينة مؤقتة)' : 'كنمط معتمد'}`
        : `Switched to [${modeToApply === 'work_first' ? 'Quantum Work-First' : 'Classic Analytics'}] ${isTemporary ? '(Preview)' : 'as default'}`,
      duration: 4000
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#090d16] border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header Strip */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {isRtl ? 'مركز إدارة أنماط بيئة العمل المؤسسية العالمية' : 'World-Class Experience Mode Controller'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                  UAMEX Multi-Cockpit™
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {isRtl 
                  ? 'مواءمة بيئة العمل التفاعلية مع دورك الوظيفي اليومي لضمان أعلى تركيز وأقصى سرعة إنجاز'
                  : 'Align enterprise operational experience with your role for maximum throughput and zero cognitive fatigue'}
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

        {/* Top Segmented Sub-Tabs & Persona Quick Select */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-100/40 dark:bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Sub-Tabs: Comparison vs Live Interactive Wireframe */}
          <div className="flex items-center bg-slate-200/80 dark:bg-zinc-800 p-1 rounded-xl border border-slate-300/80 dark:border-zinc-700 text-xs">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('comparison');
              }}
              className={`px-3 py-1 rounded-lg font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'comparison'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مقارنة الخصائص والأدوار' : 'Feature Comparison'}</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('interactive_preview');
              }}
              className={`px-3 py-1 rounded-lg font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'interactive_preview'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isRtl ? 'معاينة تفاعلية حية (Live Wireframe)' : 'Interactive Wireframe'}</span>
            </button>
          </div>

          {/* Quick Role Personas */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 dark:text-zinc-500 text-[11px] font-bold">
              {isRtl ? 'تخصيص سريع بالدور:' : 'Fast Preset:'}
            </span>
            <button
              onClick={() => handleApplyPersona('executive')}
              className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-black transition-all cursor-pointer"
            >
              {isRtl ? 'مجلس الإدارة' : 'Board/Exec'}
            </button>
            <button
              onClick={() => handleApplyPersona('field_pm')}
              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-black transition-all cursor-pointer"
            >
              {isRtl ? 'مدير مشاريع' : 'Project Lead'}
            </button>
            <button
              onClick={() => handleApplyPersona('auditor')}
              className="px-2 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[11px] font-black transition-all cursor-pointer"
            >
              {isRtl ? 'مدقق مالي IPSAS' : 'IPSAS Auditor'}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          
          {/* AI Recommendation Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black text-emerald-800 dark:text-emerald-300">
                  {isRtl ? 'توصية الذكاء الاصطناعي الذكية (UAMEX AI Adaptive Intelligence): ' : 'Adaptive AI Role Recommendation: '}
                </span>
                <span className="text-slate-700 dark:text-zinc-300 font-medium">
                  {isRtl 
                    ? `بناءً على دورك التشغيلي (${currentUserRole}) وتكرار قراراتك، نوصي باعتماد [قمرة الإنجاز الفوري] لتقليص وقت اعتماد الصرف بنسبة 70%.`
                    : `Based on your profile (${currentUserRole}) and workflow frequency, Quantum Work-First Cockpit reduces approval latency by 70%.`}
                </span>
              </div>
            </div>
          </div>

          {activeTab === 'comparison' ? (
            /* Comparison View */
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
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl border ${
                        selectedMode === 'work_first'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
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
                      ? 'يركز كلياً على المهام الميدانية أولاً: طابور القرارات العاجلة، الإجراءات السريعة بنقرة واحدة، واستئناف العمل الفوري دون تشتيت بصري.'
                      : 'Puts operational execution first: urgent approval queue, 1-click frequent actions, and instant resume intelligence.'}
                  </p>

                  <div className="space-y-2 border-t border-slate-100 dark:border-zinc-800/80 pt-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isRtl ? 'طابور قرارات عاجلة مع فحص الذكاء الاصطناعي واعتماد فوري بلمسة' : 'Action Stream queue with ambient AI verification'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isRtl ? 'استئناف فوري لآخر 4 مشاريع وسجلات نشطة' : 'Resume Intelligence for recent projects'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isRtl ? 'جدول تدفق المعاملات اللحظية للفروع الميدانية' : 'Live operational stream across field branches'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isRtl ? 'الحارس الرقابي الذكي لتدقيق قيود الأستاذ العام IPSAS' : 'Ambient AI Guardian auditing double-entry rules'}</span>
                    </div>
                  </div>
                </div>

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
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl border ${
                        selectedMode === 'classic_analytics'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
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
          ) : (
            /* Interactive Live Wireframe Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-zinc-800/80 p-2 rounded-xl text-xs font-bold">
                <span className="text-slate-600 dark:text-zinc-300">
                  {isRtl ? 'معاينة مباشرة لهيكل الواجهة في النمط المحدد:' : 'Interactive preview of layout structure:'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMode('work_first')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      selectedMode === 'work_first' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {isRtl ? 'قمرة الإنجاز الفوري' : 'Work-First'}
                  </button>
                  <button
                    onClick={() => setSelectedMode('classic_analytics')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      selectedMode === 'classic_analytics' 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {isRtl ? 'النمط التحليلي الكلاسيكي' : 'Classic Analytics'}
                  </button>
                </div>
              </div>

              {/* Wireframe Mock Canvas */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50 dark:bg-zinc-950 space-y-3 font-mono text-[11px]">
                {selectedMode === 'work_first' ? (
                  <div className="space-y-2.5">
                    {/* Wireframe Tier 1 */}
                    <div className="p-3 bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                        <span className="font-black text-slate-800 dark:text-zinc-200 font-sans">
                          {isRtl ? 'Tier 1: طابور القرارات العاجلة (3 معاملات بحاجة للاعتماد)' : 'Tier 1: Action Stream (3 approvals pending)'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-sans font-black">
                        {isRtl ? 'زر فحص السند + اعتماد بلمسة' : 'Review & 1-Click Approve'}
                      </span>
                    </div>

                    {/* Wireframe Tier 2 */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                        <div className="text-amber-500 font-black text-sm">3</div>
                        <div className="text-[10px] text-slate-500 font-sans">{isRtl ? 'طلبات معلقة' : 'Pending'}</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                        <div className="text-emerald-500 font-black text-sm">18</div>
                        <div className="text-[10px] text-slate-500 font-sans">{isRtl ? 'مشاريع نشطة' : 'Projects'}</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                        <div className="text-blue-500 font-black text-sm">14,250</div>
                        <div className="text-[10px] text-slate-500 font-sans">{isRtl ? 'مستفيدين' : 'Beneficiaries'}</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                        <div className="text-purple-500 font-black text-sm">1,420</div>
                        <div className="text-[10px] text-slate-500 font-sans">{isRtl ? 'كفالة أيتام' : 'Sponsors'}</div>
                      </div>
                    </div>

                    {/* Wireframe Tier 3 */}
                    <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between text-slate-500 font-sans text-[11px]">
                      <span>{isRtl ? 'Tier 3: 6 أزرار سريعة للإجراءات المتكررة (إضافة مشروع، قيد مالي، مستفيد، أمر شراء)' : 'Tier 3: 6 Frequent Action Triggers'}</span>
                      <span className="text-emerald-600 font-black font-mono">1-Click Launch</span>
                    </div>

                    {/* Wireframe Tier 4 & 5 */}
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-sans text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-black">{isRtl ? 'Tier 5: Ambient AI Guardian' : 'Tier 5: Ambient AI Guardian'}</span>
                      </div>
                      <span>{isRtl ? 'موازين المراجعة متزنة 100% وفق IPSAS' : 'IPSAS double-entry rules valid'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Wireframe Analytics Header */}
                    <div className="p-3 bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-amber-500" />
                        <span className="font-black text-slate-800 dark:text-zinc-200 font-sans">
                          {isRtl ? 'Executive Quantum Cockpit: المؤشرات الاستراتيجية المركبة' : 'Executive Composite KPIs'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-sans font-black">
                        {isRtl ? 'بطاقة الأداء المتوازن BSC' : 'BSC Scorecard'}
                      </span>
                    </div>

                    {/* Wireframe Charts Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-center">
                        <div className="text-[10px] text-slate-500 font-sans mb-1">{isRtl ? 'توزيع الموازنات على المحافظ' : 'Portfolio Budgets'}</div>
                        <div className="h-12 bg-slate-100 dark:bg-zinc-800 rounded flex items-end justify-center gap-1 p-1">
                          <div className="w-3 bg-emerald-500 h-6 rounded-t" />
                          <div className="w-3 bg-teal-500 h-10 rounded-t" />
                          <div className="w-3 bg-amber-500 h-8 rounded-t" />
                          <div className="w-3 bg-blue-500 h-5 rounded-t" />
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-center">
                        <div className="text-[10px] text-slate-500 font-sans mb-1">{isRtl ? 'مصفوفة SWOT وتحليل الأثر' : 'SWOT & Sphere Impact'}</div>
                        <div className="h-12 bg-slate-100 dark:bg-zinc-800 rounded flex items-center justify-center text-[10px] font-sans text-amber-600 font-black">
                          {isRtl ? 'امتثال CHS 9: 96.4%' : 'CHS 9 Compliance: 96.4%'}
                        </div>
                      </div>
                    </div>

                    {/* Wireframe 8 Workspaces */}
                    <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-500 font-sans text-[11px] flex items-center justify-between">
                      <span>{isRtl ? 'بوابات مساحات العمل الـ 8 المستقلة لكافة إدارات الجمعية' : '8 Institutional Role Workspaces'}</span>
                      <span className="text-amber-600 font-black font-mono">Role Workspaces</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preferences and Behavior Controls */}
          <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-700/80 space-y-3 text-xs">
            <div className="font-extrabold text-slate-800 dark:text-zinc-200 mb-1">
              {isRtl ? 'إعدادات الثبات والتحكم الذكي:' : 'Preferences & Adaptive Experience:'}
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

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={adaptiveCadence}
                onChange={(e) => setAdaptiveCadence(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
              />
              <span className="text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {isRtl 
                    ? 'الجدولة الذكية التكيفية (ساعات العمل الميداني 8ص-3م: إنجاز فوري | بعد 3م: تحليلات استراتيجية)'
                    : 'Smart Adaptive Cadence (8am-3pm: Work-First | after 3pm: Strategic Analytics)'}
                </span>
              </span>
            </label>

            <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span>
                {isRtl ? 'اختصار لوحة المفاتيح المباشر للتبديل اللحظي:' : 'Direct global keyboard shortcut:'}
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
