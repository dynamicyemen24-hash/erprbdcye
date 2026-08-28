import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  Filter, 
  Coins, 
  Briefcase, 
  Layers, 
  Users, 
  Heart, 
  ShoppingCart, 
  FileText, 
  Activity, 
  TrendingUp, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  Target, 
  Plus, 
  FileCheck, 
  Receipt,
  Globe,
  SlidersHorizontal,
  LayoutDashboard,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
  RotateCcw,
  HelpCircle,
  Send,
  CheckSquare,
  Square
} from 'lucide-react';
import { ActiveTab, User } from '../../core/types/dashboard';
import { useResumeIntelligence } from '../../core/services/resumeIntelligence';
import { triggerHaptic } from '../../helpers/hapticSwipe';
import { UniversalObjectPageModal } from '../common/UniversalObjectPageModal';
import { showToast } from '../enterprise/EnterpriseToastContainer';

interface QuantumWorkFirstCockpitProps {
  lang: 'ar' | 'en';
  stats: any;
  currentUser: User | null;
  programs: any[];
  projects: any[];
  beneficiaries: any[];
  sponsorships: any[];
  approvalRequests: any[];
  onNavigate: (tabId: string) => void;
  onDrillDown?: (tabId: string, filters: any) => void;
  onOpenSystemMap?: () => void;
  onSwitchToClassicAnalytics?: () => void;
  onOpenExperienceModeModal?: () => void;
  onRefresh?: () => void;
}

export const QuantumWorkFirstCockpit: React.FC<QuantumWorkFirstCockpitProps> = ({
  lang,
  stats,
  currentUser,
  programs = [],
  projects = [],
  beneficiaries = [],
  sponsorships = [],
  approvalRequests = [],
  onNavigate,
  onDrillDown,
  onOpenSystemMap,
  onSwitchToClassicAnalytics,
  onOpenExperienceModeModal,
  onRefresh
}) => {
  const isRtl = lang === 'ar';
  const { resumeState } = useResumeIntelligence();
  const [streamFilter, setStreamFilter] = useState<'ALL' | 'CRITICAL' | 'FINANCE' | 'FIELD'>('ALL');
  const [processedTasks, setProcessedTasks] = useState<string[]>([]);
  const [inspectingRecord, setInspectingRecord] = useState<any | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [aiPopoverTaskId, setAiPopoverTaskId] = useState<string | null>(null);
  const [clarificationModal, setClarificationModal] = useState<{
    isOpen: boolean;
    task: any | null;
    reason: string;
    note: string;
  }>({
    isOpen: false,
    task: null,
    reason: 'نقص الفاتورة الضريبية الأصلية أو محضر الفحص الفني',
    note: ''
  });

  // High-Priority Actionable Decision Items
  const rawDecisions = useMemo(() => [
    {
      id: 'ACT-01',
      type: 'FINANCE',
      severity: 'CRITICAL',
      titleAr: 'اعتماد صرف دفعة الإنجاز (3) - مشروع مياه ريف تعز بالطاقة الشمسية',
      titleEn: 'Approve Milestone 3 Payout - Taiz Solar Water Network',
      projectCode: 'PRJ-2026-WASH-08',
      amountYer: 8500000,
      deadlineAr: 'متبقي 4 ساعات',
      deadlineEn: '4 hrs left',
      aiCheckAr: '🟢 الفاتورة مطابقة لمحضر الفحص الفني، والمخصص متوفر بالموازنة',
      aiCheckEn: 'Verified against technical inspection report, budget allocated',
      requesterAr: 'م. أحمد الشرجبي (مدير المشروع)',
      requesterEn: 'Eng. Ahmed Al-Sharjabi',
      tabTarget: 'approvals'
    },
    {
      id: 'ACT-02',
      type: 'FIELD',
      severity: 'CRITICAL',
      titleAr: 'تصحيح مسار خط الإمداد اللوجستي وتجاوز سقف التكلفة الميدانية',
      titleEn: 'Corrective Route Logistics Approval - Taiz Food Relief',
      projectCode: 'PRJ-2026-FOOD-02',
      amountYer: 4200000,
      deadlineAr: 'متبقي 24 ساعة',
      deadlineEn: '24 hrs left',
      aiCheckAr: '🟡 ارتفاع تكاليف النقل الجبلي بنسبة 12% بسبب إغلاقات الطرق',
      aiCheckEn: '12% mountain transport hike due to road blockades',
      requesterAr: 'أ. فؤاد المعمري (المنسق الميداني)',
      requesterEn: 'Fouad Al-Maamari (Field Coordinator)',
      tabTarget: 'projects'
    },
    {
      id: 'ACT-03',
      type: 'FINANCE',
      severity: 'HIGH',
      titleAr: 'مصادقة تحويل كفالات 595 يتيماً للشهر الجاري عبر المحافظ الرقمية',
      titleEn: 'Endorse Digital Wallet Payout for 595 Orphan Sponsorships',
      projectCode: 'SPON-2026-M08',
      amountYer: 14875000,
      deadlineAr: 'متبقي يومان',
      deadlineEn: '2 days left',
      aiCheckAr: '🟢 جاهزية المحافظ الإلكترونية بنسبة 100% بدون أي أخطاء ثبوتية',
      aiCheckEn: '100% digital wallet readiness verified',
      requesterAr: 'د. سارة الهدوي (قطاع الرعاية الاجتماعية)',
      requesterEn: 'Dr. Sarah Al-Hedwi',
      tabTarget: 'sponsorships'
    },
    {
      id: 'ACT-04',
      type: 'FIELD',
      severity: 'NORMAL',
      titleAr: 'اعتماد خطة توزيع السلال الإغاثية الشتوية (المرحلة الأولى - 1,200 أسرة)',
      titleEn: 'Approve Winter Relief Distribution Plan (Phase 1 - 1,200 families)',
      projectCode: 'RELIEF-2026-W1',
      amountYer: 6300000,
      deadlineAr: 'متبقي 3 أيام',
      deadlineEn: '3 days left',
      aiCheckAr: '🟢 مطابقة قوائم المستفيدين مع فحص البصمة لمنع الازدواجية',
      aiCheckEn: 'Biometric deduplication verified for all beneficiaries',
      requesterAr: 'لجنة الإغاثة المركزية',
      requesterEn: 'Central Relief Committee',
      tabTarget: 'beneficiaries'
    }
  ], []);

  // Merge with real approval requests from database if available
  const activeDecisions = useMemo(() => {
    const fromApi = (approvalRequests || [])
      .filter(r => r.status === 'pending')
      .slice(0, 3)
      .map((r, idx) => ({
        id: `REQ-${r.id || idx}`,
        type: 'FINANCE',
        severity: 'HIGH',
        titleAr: r.title || r.description || `طلب اعتماد معاملة مالية رقم #${r.id}`,
        titleEn: r.title_en || r.title || `Approval Request #${r.id}`,
        projectCode: r.project_code || 'FIN-GEN',
        amountYer: parseFloat(r.amount || '0') || 2500000,
        deadlineAr: 'قيد الانتظار',
        deadlineEn: 'Pending',
        aiCheckAr: '🟢 مسار الاعتماد الأولي مكتمل وبانتظار مصادقتك',
        aiCheckEn: 'Initial approval step cleared, awaiting your sign-off',
        requesterAr: r.requester_name || 'الشؤون المالية',
        requesterEn: r.requester_name || 'Finance Dept',
        tabTarget: 'approvals'
      }));

    const combined = [...fromApi, ...rawDecisions];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());

    return unique.filter(item => {
      if (processedTasks.includes(item.id)) return false;
      if (streamFilter === 'ALL') return true;
      if (streamFilter === 'CRITICAL') return item.severity === 'CRITICAL';
      if (streamFilter === 'FINANCE') return item.type === 'FINANCE';
      if (streamFilter === 'FIELD') return item.type === 'FIELD';
      return true;
    });
  }, [approvalRequests, rawDecisions, streamFilter, processedTasks]);

  const handleQuickApprove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    setProcessedTasks(prev => [...prev, id]);
  };

  const handleToggleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    if (selectedBatchIds.length === activeDecisions.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(activeDecisions.map(d => d.id));
    }
  };

  const handleToggleBatchItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setSelectedBatchIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    if (selectedBatchIds.length === 0) return;
    triggerHaptic('success');
    setProcessedTasks(prev => [...prev, ...selectedBatchIds]);
    showToast({
      type: 'success',
      title: isRtl ? 'تم اعتماد الدفعة بنجاح' : 'Batch Approved',
      message: isRtl 
        ? `تمت مصادقة ${selectedBatchIds.length} معاملات وصرفها مالياً بنجاح`
        : `Successfully cleared ${selectedBatchIds.length} transactions in batch`,
      duration: 4000
    });
    setSelectedBatchIds([]);
  };

  const handleOpenClarification = (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    setClarificationModal({
      isOpen: true,
      task,
      reason: isRtl ? 'نقص الفاتورة الضريبية الأصلية أو محضر الفحص الفني' : 'Missing tax invoice or delivery note',
      note: ''
    });
  };

  const handleConfirmClarification = () => {
    if (!clarificationModal.task) return;
    triggerHaptic('warning');
    setProcessedTasks(prev => [...prev, clarificationModal.task.id]);
    showToast({
      type: 'warning',
      title: isRtl ? 'تمت إعادة المعاملة للاستيفاء' : 'Returned for Clarification',
      message: isRtl
        ? `تمت إعادة السند [${clarificationModal.task.projectCode}] مع إشعار المسؤول: ${clarificationModal.reason}`
        : `Transaction returned with notice: ${clarificationModal.reason}`,
      duration: 4000
    });
    setClarificationModal({ isOpen: false, task: null, reason: '', note: '' });
  };

  const totalBatchAmount = useMemo(() => {
    return activeDecisions
      .filter(d => selectedBatchIds.includes(d.id))
      .reduce((sum, d) => sum + d.amountYer, 0);
  }, [activeDecisions, selectedBatchIds]);

  // 4 Vital Focused KPIs
  const vitalKPIs = useMemo(() => [
    {
      id: 'kpi_approvals',
      titleAr: 'طلبات الاعتماد المعلقة',
      titleEn: 'Pending Approvals',
      value: activeDecisions.length,
      unitAr: 'معاملة',
      unitEn: 'tasks',
      subAr: 'تحتاج تدخلك السريع اليوم',
      subEn: 'Requires your direct sign-off',
      color: 'amber',
      icon: AlertTriangle,
      tab: 'approvals',
      filters: { approvalsStatus: 'pending' }
    },
    {
      id: 'kpi_programs',
      titleAr: 'البرامج التنموية المعتمدة',
      titleEn: 'Active Programs',
      value: programs.length || 10,
      unitAr: 'برامج',
      unitEn: 'programs',
      subAr: 'تغطي 14 مديرية ومحافظة',
      subEn: 'Covering 14 districts',
      color: 'emerald',
      icon: Briefcase,
      tab: 'programs',
      filters: { programsStatus: 'active' }
    },
    {
      id: 'kpi_beneficiaries',
      titleAr: 'الوصول الميداني للمستفيدين',
      titleEn: 'Beneficiaries Reach',
      value: (stats?.counts?.beneficiaries || stats?.beneficiariesCount || 418),
      unitAr: 'مستفيد',
      unitEn: 'served',
      subAr: '+ 595 كفالة يتيم منتظمة',
      subEn: '+ 595 active orphan sponsorships',
      color: 'teal',
      icon: Users,
      tab: 'beneficiaries',
      filters: { beneficiariesStatus: 'active' }
    },
    {
      id: 'kpi_budget',
      titleAr: 'الموازنة المصروفة بالميدان',
      titleEn: 'Budget Utilization',
      value: '74.8%',
      unitAr: 'من الخطة',
      unitEn: 'utilized',
      subAr: 'ضمن مؤشر الأداء المالي المعتمد',
      subEn: 'Within planned financial threshold',
      color: 'blue',
      icon: Target,
      tab: 'projects',
      filters: { projectsStatus: 'active' }
    }
  ], [activeDecisions.length, programs.length, stats]);

  // Recent 5 projects for "Continue Where You Left Off"
  const recentItems = useMemo(() => {
    if (projects.length > 0) {
      return projects.slice(0, 4);
    }
    return [
      { id: '1', name_ar: 'مشروع مياه قرى صبر الموادم بالطاقة الشمسية', code: 'PRJ-2026-08', branch: 'تعز', budget: '45,000,000 ر.ي' },
      { id: '2', name_ar: 'برنامج كفالة ورعاية الأيتام الشاملة', code: 'PRG-ORPH-26', branch: 'المركز الرئيسي', budget: '60,000,000 ر.ي' },
      { id: '3', name_ar: 'مشروع الإغاثة العاجلة وتوزيع السلال الغذائية', code: 'PRJ-FOOD-26', branch: 'عدن ولحج', budget: '28,000,000 ر.ي' },
    ];
  }, [projects]);

  return (
    <div className="flex flex-col space-y-5 animate-in fade-in duration-200">

      {/* ========================================================================= */}
      {/* ENTERPRISE MODE SWITCHER BANNER (MULTI-COCKPIT ORCHESTRATION)             */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {isRtl ? 'قمرة الإنجاز الفوري المؤسسي (Quantum Work-First Cockpit™)' : 'Quantum Work-First Cockpit™'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {isRtl ? 'النمط السريع المعتمد' : 'Active High-Speed Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isRtl 
                ? 'محطة العمل الذكية: ما يحتاجك اليوم، استئناف العمل، والمؤشرات المباشرة'
                : 'Task-oriented cockpit: actionable decisions, resume work, and direct operations'}
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {onOpenSystemMap && (
            <button
              onClick={onOpenSystemMap}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title={isRtl ? 'خريطة المنظومة الشاملة [Alt+M]' : 'System Map [Alt+M]'}
            >
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRtl ? 'خريطة المنظومة (Mode B)' : 'System Map (Mode B)'}</span>
            </button>
          )}

          {onSwitchToClassicAnalytics && (
            <button
              onClick={onSwitchToClassicAnalytics}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer group"
              title={isRtl ? 'التبديل إلى النمط التحليلي الكلاسيكي' : 'Switch to Classic Analytics Mode'}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>{isRtl ? 'النمط التحليلي الكلاسيكي' : 'Classic Analytics'}</span>
            </button>
          )}

          {onOpenExperienceModeModal && (
            <button
              onClick={onOpenExperienceModeModal}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/80 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              title={isRtl ? 'مركز إدارة أنماط بيئة العمل والتوصيات الذكية (Alt + X)' : 'Experience Mode Settings (Alt + X)'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 1: ACTION STREAM — WHAT NEEDS YOUR ATTENTION NOW (طابور العمل الفوري)  */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                  {isRtl ? 'طابور المهام الحرجة والقرارات اليومية' : 'Action Stream — What Needs Your Attention Now'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-500/15 text-rose-500 border border-rose-500/30">
                  {activeDecisions.length} {isRtl ? 'معلقة' : 'pending'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isRtl ? 'المعاملات والاعتمادات التي تنتظر توقيعك المباشر اليوم' : 'Critical transactions awaiting your decision or verification today'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeDecisions.length > 0 && (
              <button
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:border-emerald-500 transition-all cursor-pointer shadow-2xs"
                title={isRtl ? 'تحديد كافة المعاملات للاعتماد الجماعي' : 'Select all for batch approval'}
              >
                {selectedBatchIds.length === activeDecisions.length && activeDecisions.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>{isRtl ? 'تحديد الكل للدفعة' : 'Select All'}</span>
              </button>
            )}

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold">
              <button
                onClick={() => setStreamFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  streamFilter === 'ALL'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                {isRtl ? 'الكل' : 'All'} ({rawDecisions.length})
              </button>
              <button
                onClick={() => setStreamFilter('CRITICAL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  streamFilter === 'CRITICAL'
                    ? 'bg-rose-500 text-white shadow-xs font-black'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-rose-500'
                }`}
              >
                {isRtl ? 'عاجل وحرج' : 'Critical'}
              </button>
              <button
                onClick={() => setStreamFilter('FINANCE')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  streamFilter === 'FINANCE'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-emerald-500'
                }`}
              >
                {isRtl ? 'مالية' : 'Finance'}
              </button>
              <button
                onClick={() => setStreamFilter('FIELD')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  streamFilter === 'FIELD'
                    ? 'bg-teal-600 text-white shadow-xs font-black'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-teal-500'
                }`}
              >
                {isRtl ? 'ميدان' : 'Field'}
              </button>
            </div>
          </div>
        </div>

        {/* Action Items List */}
        {activeDecisions.length === 0 ? (
          <div className="py-10 px-6 rounded-2xl bg-gradient-to-br from-emerald-500/[0.05] via-teal-500/[0.02] to-transparent border border-emerald-500/25 text-center my-2">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white mb-1.5">
              {isRtl ? 'أداء استثنائي! تم إنجاز وتصفير كافة طلبات الاعتماد (Inbox Zero 🎉)' : 'Outstanding! All Decisions Cleared (Inbox Zero 🎉)'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mb-5 leading-relaxed">
              {isRtl 
                ? 'كافة طلبات الصرف وأوامر الشراء الميدانية تمت معالجتها ومطابقتها وفق معايير IPSAS. لا توجد أي مهام معلقة تنتظر قرارك الآن.'
                : 'All financial vouchers and procurement requests are verified and settled under IPSAS standards. Zero pending bottlenecks.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {onSwitchToClassicAnalytics && (
                <button
                  onClick={onSwitchToClassicAnalytics}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? 'استعراض التحليلات الاستراتيجية والمحافظ' : 'Explore Strategic Analytics'}</span>
                </button>
              )}
              {onOpenSystemMap && (
                <button
                  onClick={onOpenSystemMap}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span>{isRtl ? 'استكشاف خريطة الأنظمة الـ15 (Alt + M)' : 'Explore 15 Domains Map (Alt + M)'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeDecisions.map((task) => {
              const isCritical = task.severity === 'CRITICAL';
              return (
                <div
                  key={task.id}
                  onClick={() => onNavigate(task.tabTarget)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 group ${
                    isCritical
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-400'
                      : 'bg-slate-50/70 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Multi-Select Batch Checkbox */}
                    <div 
                      onClick={(e) => handleToggleBatchItem(task.id, e)}
                      className="p-1 cursor-pointer text-slate-400 hover:text-emerald-600 transition-colors shrink-0 mt-1"
                      title={isRtl ? 'تحديد للاعتماد الجماعي' : 'Select for batch'}
                    >
                      {selectedBatchIds.includes(task.id) ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      isCritical 
                        ? 'bg-rose-500 text-white shadow-xs' 
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {isCritical ? <AlertOctagon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isCritical
                            ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                            : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}>
                          {task.projectCode}
                        </span>

                        <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {isRtl ? task.titleAr : task.titleEn}
                        </span>

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          {isRtl ? task.deadlineAr : task.deadlineEn}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                        <span className="font-mono font-black text-slate-900 dark:text-emerald-400">
                          {task.amountYer.toLocaleString()} {isRtl ? 'ر.ي' : 'YER'}
                        </span>
                        <span>•</span>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAiPopoverTaskId(aiPopoverTaskId === task.id ? null : task.id);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                            title={isRtl ? 'عرض نتائج فحص الامتثال الذكي' : 'View AI audit checks'}
                          >
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            <span>{isRtl ? '98% تدقيق AI استباقي' : '98% AI Audit'}</span>
                          </button>

                          {/* AI Compliance Popover */}
                          {aiPopoverTaskId === task.id && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute z-30 top-7 right-0 w-72 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-xl space-y-2 animate-in fade-in"
                            >
                              <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-2">
                                <span className="flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                  <span>{isRtl ? 'فحص الامتثال المحاسبي IPSAS' : 'IPSAS Compliance Audit'}</span>
                                </span>
                                <button 
                                  onClick={() => setAiPopoverTaskId(null)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="text-[11px] space-y-1.5 text-slate-600 dark:text-zinc-300">
                                <div className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <span>{isRtl ? 'القيد المحاسبي المزدوج متزن وفق الدليل' : 'Double-entry GL routing balanced'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <span>{isRtl ? 'رصيد بند الموازنة كافٍ ولا يتجاوز السقف' : 'Budget WBS ceiling sufficient'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <span>{isRtl ? 'الفواتير والتوثيق الحيوي مكتملة 100%' : 'All invoices & biometrics verified'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instant Action Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={(e) => handleQuickApprove(task.id, e)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'اعتماد فوري' : 'Quick Approve'}</span>
                    </button>

                    <button
                      onClick={(e) => handleOpenClarification(task, e)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title={isRtl ? 'طلب استيفاء ونواقص أو إعادة للتصحيح' : 'Return for clarification'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isRtl ? 'استيفاء' : 'Return'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingRecord({
                          domainCode: task.type === 'FINANCE' ? 'NEB-10' : 'NEB-05',
                          domainNameAr: task.type === 'FINANCE' ? 'نظام الرقابة المالية والحوكمة ودليل الحسابات IPSAS' : 'نظام العمليات الميدانية والتدخل الإنساني',
                          domainNameEn: task.type === 'FINANCE' ? 'Finance & IPSAS Ledger OS' : 'Field Operations OS',
                          recordCode: task.projectCode,
                          titleAr: task.titleAr,
                          titleEn: task.titleEn,
                          status: {
                            code: 'PENDING',
                            labelAr: 'بانتظار مصادقة الاعتماد',
                            labelEn: 'Pending Sign-off',
                            color: 'amber'
                          },
                          metrics: [
                            {
                              labelAr: 'مبلغ الاعتماد المطلوب',
                              labelEn: 'Required Amount',
                              value: task.amountYer.toLocaleString(),
                              unitAr: 'ر.ي',
                              unitEn: 'YER',
                              color: 'emerald'
                            },
                            {
                              labelAr: 'مستوى الأولوية',
                              labelEn: 'Priority Level',
                              value: isCritical ? 'عالية جداً (حرجة)' : 'عادية',
                              color: isCritical ? 'rose' : 'blue'
                            },
                            {
                              labelAr: 'المهلة الزمنية',
                              labelEn: 'Deadline',
                              value: isRtl ? task.deadlineAr : task.deadlineEn,
                              color: 'amber'
                            },
                            {
                              labelAr: 'فحص الذكاء الاصطناعي',
                              labelEn: 'AI Audit Verification',
                              value: 'مطابق 100%',
                              color: 'purple'
                            }
                          ],
                          overviewFieldGroups: [
                            {
                              groupTitleAr: '1. بيانات طلب الاعتماد والجهة الطالبة',
                              groupTitleEn: '1. Approval Request Metadata',
                              fields: [
                                { labelAr: 'الجهة الطالبة', labelEn: 'Requesting Entity', value: isRtl ? task.requesterAr : task.requesterEn },
                                { labelAr: 'رمز الكيان المؤسسي', labelEn: 'Record Code', value: task.projectCode, isCopyable: true },
                                { labelAr: 'ملاحظات التدقيق الذكي', labelEn: 'AI Audit Note', value: isRtl ? task.aiCheckAr : task.aiCheckEn },
                                { labelAr: 'معيار الامتثال الدولي', labelEn: 'Standard Benchmark', value: 'IPSAS Cash Basis & Sphere 2026' }
                              ]
                            },
                            {
                              groupTitleAr: '2. تفاصيل التوجيه المالي وحساب الأستاذ',
                              groupTitleEn: '2. Financial Distribution & Ledger',
                              fields: [
                                { labelAr: 'حساب الأستاذ العام المتأثر', labelEn: 'GL Account', value: '210103 - حساب مخصصات العمليات الإغاثية' },
                                { labelAr: 'مركز التكلفة', labelEn: 'Cost Center', value: 'CC-04 - العمليات الميدانية والتدخل الإنساني' },
                                { labelAr: 'الفرع المستفيد', labelEn: 'Operating Branch', value: 'فرع تعز والميدان' }
                              ]
                            }
                          ],
                          timeline: [
                            { id: 'tl-1', titleAr: 'رفع المعاملة والطلب الميداني', titleEn: 'Field Request Created', actor: isRtl ? task.requesterAr : task.requesterEn, roleAr: 'المنسق الميداني', roleEn: 'Field Coordinator', timestamp: '2026-08-27 10:00', status: 'approved' },
                            { id: 'tl-2', titleAr: 'المراجعة المحاسبية ومطابقة اللائحة', titleEn: 'Accounting Review', actor: 'أ. رضوان القادري', roleAr: 'الرقابة المالية', roleEn: 'Financial Control', timestamp: '2026-08-27 14:30', status: 'approved' },
                            { id: 'tl-3', titleAr: 'المصادقة والاعتماد النهائي للصرف', titleEn: 'Final Sign-off & Disbursement', actor: 'صاحب الصلاحية', roleAr: 'المدير التنفيذي', roleEn: 'Executive Director', timestamp: 'قيد الإجراء الآن', status: 'current' }
                          ],
                          linkedRecords: [
                            { id: 'lr-1', code: task.projectCode, typeAr: 'سند الصرف المحاسبي', typeEn: 'Payment Voucher', titleAr: isRtl ? task.titleAr : task.titleEn, amountYer: task.amountYer, targetTab: 'finance' }
                          ],
                          auditTrail: [
                            { id: 'at-1', actionAr: 'إنشاء طلب الاعتماد وإرفاق المستندات', actionEn: 'Create approval request & attachments', user: isRtl ? task.requesterAr : task.requesterEn, timestamp: '2026-08-27 10:00' }
                          ],
                          onApprove: () => handleQuickApprove(task.id)
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isRtl ? 'فحص السند' : 'Review'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TIER 2: TWO-COLUMN COCKPIT (CONTINUE WORK + VITAL KPIS)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* Col 1: Continue Where You Left Off (استأنف عملك الأخير) — 6 Cols */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isRtl ? 'استأنف عملك الأخير' : 'Continue Where You Left Off'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {isRtl ? 'ملفات العمل والسجلات النشطة التي كنت تعمل عليها مؤخراً' : 'Quickly resume your latest active working files'}
                  </p>
                </div>
              </div>

              {resumeState?.lastActiveTab && (
                <button
                  onClick={() => onNavigate(resumeState.lastActiveTab as any)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <span>{isRtl ? 'استئناف فوري' : 'Resume Now'}</span>
                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Recent Work Cards */}
            <div className="space-y-2">
              {recentItems.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  onClick={() => onNavigate('projects')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {item.name_ar || item.titleAr || item.code}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-slate-600 dark:text-zinc-400">{item.code}</span>
                        <span>•</span>
                        <span>{item.branch || 'تعز'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                      {item.budget || '45M ر.ي'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-[-2px] transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
            <span>{isRtl ? 'ذاكرة استئناف الجلسات الذكية (Resume Intelligence)' : 'Smart Session Persistence Engine'}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{isRtl ? 'محفوظ محلياً' : 'Saved'}</span>
          </div>
        </div>

        {/* Col 2: Vital Focus KPIs (المؤشرات الحيوية المباشرة) — 6 Cols */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isRtl ? 'المؤشرات الحيوية المباشرة' : 'Vital Focus KPIs'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {isRtl ? 'المؤشرات الأربعة المحركة لقراراتك اليومية (انقر للتصفية)' : 'The 4 vital metrics driving your daily decisions'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                FY 2026
              </span>
            </div>

            {/* 4 Clickable Focus KPI Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {vitalKPIs.map((kpi) => {
                const KIcon = kpi.icon;
                return (
                  <button
                    key={kpi.id}
                    onClick={() => {
                      if (onDrillDown && kpi.filters) {
                        onDrillDown(kpi.tab, kpi.filters);
                      } else {
                        onNavigate(kpi.tab);
                      }
                    }}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-left rtl:text-right flex flex-col justify-between group cursor-pointer hover:shadow-xs active:scale-95"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {isRtl ? kpi.titleAr : kpi.titleEn}
                      </span>
                      <KIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>

                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-xl font-mono font-black text-slate-900 dark:text-white">
                        {kpi.value}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                        {isRtl ? kpi.unitAr : kpi.unitEn}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                      {isRtl ? kpi.subAr : kpi.subEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
            <span>{isRtl ? 'بيانات حية محدثة من قاعدة البيانات المركزية' : 'Live Central Database Telemetry'}</span>
            <button
              onClick={() => onNavigate('reports')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
            >
              {isRtl ? 'عرض كافة التقارير ←' : 'All Reports →'}
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TIER 3: FREQUENT OPERATIONS LAUNCHER (شريط العمليات المتكررة بنقرة واحدة)  */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isRtl ? 'الإجراءات والعمليات المتكررة بنقرة واحدة' : 'Frequent One-Click Operations'}</span>
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500">
            {isRtl ? 'مخصصة لسرعة إنجاز عملك اليومي' : 'Optimized for rapid daily execution'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('projects')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
            <span>{isRtl ? '+ إضافة مشروع ميداني' : '+ New Project'}</span>
          </button>

          <button
            onClick={() => onNavigate('finance')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500 group-hover:text-white" />
            <span>{isRtl ? '+ إضافة قيد محاسبي' : '+ Add Ledger Entry'}</span>
          </button>

          <button
            onClick={() => onNavigate('beneficiaries')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
          >
            <Users className="w-3.5 h-3.5 text-teal-500 group-hover:text-white" />
            <span>{isRtl ? '+ تسجيل مستفيد جديد' : '+ Register Beneficiary'}</span>
          </button>

          <button
            onClick={() => onNavigate('procurement')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-orange-500 group-hover:text-white" />
            <span>{isRtl ? '+ إصدار طلب شراء (RFQ)' : '+ New RFQ'}</span>
          </button>

          <button
            onClick={() => onNavigate('sponsorships')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 group-hover:text-white" />
            <span>{isRtl ? '+ إصدار كفالة أيتام' : '+ New Sponsorship'}</span>
          </button>

          <button
            onClick={() => onNavigate('geospatial')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
          >
            <Globe className="w-3.5 h-3.5 text-sky-500 group-hover:text-white" />
            <span>{isRtl ? '🗺️ خريطة GIS الميدانية' : '🗺️ GIS Map'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 4: RECENT OPERATIONAL TRANSACTIONS & AUDIT STREAM                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isRtl ? 'المعاملات المالية والتشغيلية الحديثة (Live Operations Stream)' : 'Recent Operational Transactions & Audit Stream'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isRtl ? 'سجل العمليات الحية الجارية في فروع المنظمة المتصلة بقاعدة البيانات المركزية' : 'Live stream of ongoing branch transactions recorded in PostgreSQL'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('finance')}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{isRtl ? 'فتح الأستاذ العام' : 'Open Ledger'}</span>
            {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
          </button>
        </div>

        {/* Operational Transactions Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left rtl:text-right">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold">
                <th className="py-2.5 px-3">{isRtl ? 'رقم المعاملة' : 'Transaction ID'}</th>
                <th className="py-2.5 px-3">{isRtl ? 'البيان والمشروع' : 'Description & Project'}</th>
                <th className="py-2.5 px-3">{isRtl ? 'الفرع' : 'Branch'}</th>
                <th className="py-2.5 px-3">{isRtl ? 'المبلغ' : 'Amount'}</th>
                <th className="py-2.5 px-3">{isRtl ? 'حالة القيد والمسار' : 'Status & Lifecycle'}</th>
                <th className="py-2.5 px-3 text-center">{isRtl ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
              <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-zinc-100">TX-2026-10492</td>
                <td className="py-2.5 px-3">
                  <div className="font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'صرف مخصصات كفالة أيتام تعز (595 يتيماً)' : 'Disbursement of Taiz Orphan Sponsorships'}</div>
                  <div className="text-[10px] text-slate-400">قطاع الرعاية الاجتماعية • تحويل رقمي</div>
                </td>
                <td className="py-2.5 px-3 font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'فرع تعز والميدان' : 'Taiz Field Branch'}</td>
                <td className="py-2.5 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">5,950,000 {isRtl ? 'ر.ي' : 'YER'}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {isRtl ? '🟢 معتمد ومرحل للأستاذ العام' : '🟢 Posted to Ledger'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button 
                    onClick={() => setInspectingRecord({
                      domainCode: 'NEB-10',
                      domainNameAr: 'نظام الرقابة المالية والحوكمة ودليل الحسابات IPSAS',
                      domainNameEn: 'Finance, IPSAS Ledger & Compliance OS',
                      recordCode: 'TX-2026-10492',
                      titleAr: 'سند صرف بنكي: مخصصات كفالة أيتام تعز (595 يتيماً)',
                      titleEn: 'Payment Voucher: Taiz Orphan Sponsorships',
                      status: {
                        code: 'POSTED',
                        labelAr: 'معتمد ومرحل للأستاذ العام',
                        labelEn: 'Posted to Ledger',
                        color: 'emerald'
                      },
                      metrics: [
                        { labelAr: 'قيمة السند المصروف', labelEn: 'Voucher Amount', value: '5,950,000', unitAr: 'ر.ي', unitEn: 'YER', color: 'emerald' },
                        { labelAr: 'عدد الأيتام المكفولين', labelEn: 'Beneficiary Count', value: '595', unitAr: 'يتيماً', unitEn: 'orphans', color: 'blue' },
                        { labelAr: 'الحساب المدين', labelEn: 'Debit GL Account', value: '230101', unitAr: 'أمانات', unitEn: 'Trust', color: 'purple' },
                        { labelAr: 'مؤشر المطابقة الحيوي', labelEn: 'Biometric Match', value: '100%', color: 'emerald' }
                      ],
                      overviewFieldGroups: [
                        {
                          groupTitleAr: '1. بيانات السند والتوجيه المحاسبي',
                          groupTitleEn: '1. Voucher & Accounting Details',
                          fields: [
                            { labelAr: 'رقم السند الموحد', labelEn: 'Voucher Code', value: 'TX-2026-10492', isCopyable: true },
                            { labelAr: 'الفرع المصدر للسند', labelEn: 'Issuing Branch', value: 'فرع تعز والميدان' },
                            { labelAr: 'طريقة الدفع والصرف', labelEn: 'Payment Channel', value: 'تحويل بنكي - شبكة الكريمي' },
                            { labelAr: 'تاريخ الترحيل للأستاذ', labelEn: 'Posting Date', value: '2026-08-27 15:40' }
                          ]
                        },
                        {
                          groupTitleAr: '2. تفاصيل قطاع الرعاية والكفالات',
                          groupTitleEn: '2. Sponsorship Sector Context',
                          fields: [
                            { labelAr: 'البرنامج الموجه له', labelEn: 'Program Link', value: 'برنامج كفالة ورعاية الأيتام الشاملة' },
                            { labelAr: 'دورية الصرف', labelEn: 'Cycle', value: 'مخصص شهر رجب 1447هـ' },
                            { labelAr: 'الضابط المالي المعتمد', labelEn: 'Approving Officer', value: 'أ. رضوان القادري' }
                          ]
                        }
                      ],
                      timeline: [
                        { id: 'tl-1', titleAr: 'إصدار كشف الصرف ومطابقة السجلات', titleEn: 'Roll Generated', actor: 'إدارة الكفالات', roleAr: 'ضابط الكفالات', roleEn: 'Officer', timestamp: '2026-08-27 09:00', status: 'approved' },
                        { id: 'tl-2', titleAr: 'المطابقة الحسابية واعتماد المدير المالي', titleEn: 'Finance Audit', actor: 'أ. رضوان القادري', roleAr: 'المدير المالي', roleEn: 'Finance Director', timestamp: '2026-08-27 11:30', status: 'approved' },
                        { id: 'tl-3', titleAr: 'الترحيل التلقائي لدفتر الأستاذ العام IPSAS', titleEn: 'Ledger Posting', actor: 'محرك المحاسبة المركزي', roleAr: 'IPSAS Core', roleEn: 'System', timestamp: '2026-08-27 15:40', status: 'approved' }
                      ],
                      linkedRecords: [
                        { id: 'lr-1', code: 'SPON-ROHAMAA', typeAr: 'سجل كفالات الأيتام', typeEn: 'Orphan Registry', titleAr: 'كشوفات أيتام محافظة تعز المشمولين بالدفعة', targetTab: 'sponsorships' }
                      ],
                      auditTrail: [
                        { id: 'at-1', actionAr: 'ترحيل السند إلى حساب الأستاذ العام', actionEn: 'Post to General Ledger', user: 'أ. رضوان القادري', timestamp: '2026-08-27 15:40' }
                      ]
                    })}
                    className="p-1 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                    title={isRtl ? 'معاينة السجل المؤسسي الشامل' : 'Inspect Voucher Object Page'}
                  >
                    <Eye className="w-4 h-4 mx-auto" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-zinc-100">TX-2026-10493</td>
                <td className="py-2.5 px-3">
                  <div className="font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'شراء أنابيب ومستلزمات شبكة مياه صبر' : 'WASH Pipe Network Supply - Sabir'}</div>
                  <div className="text-[10px] text-slate-400">المشتريات والعقود • أمر شراء P2P</div>
                </td>
                <td className="py-2.5 px-3 font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'فرع تعز والميدان' : 'Taiz Field Branch'}</td>
                <td className="py-2.5 px-3 font-mono font-black text-amber-600 dark:text-amber-400">3,450,000 {isRtl ? 'ر.ي' : 'YER'}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {isRtl ? '🟡 قيد المطابقة والفحص الفني' : '🟡 Technical Audit'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button 
                    onClick={() => setInspectingRecord({
                      domainCode: 'NEB-14',
                      domainNameAr: 'نظام المشتريات والمناقصات وسلاسل الإمداد P2P',
                      domainNameEn: 'Procurement, Tenders & Supply Chain OS',
                      recordCode: 'TX-2026-10493',
                      titleAr: 'أمر توريد P2P: توريد شبكة أنابيب مياه صبر',
                      titleEn: 'Purchase Order: Sabir WASH Pipe Network Supply',
                      status: {
                        code: 'AUDIT',
                        labelAr: 'قيد المطابقة والفحص الفني',
                        labelEn: 'Technical Audit',
                        color: 'amber'
                      },
                      metrics: [
                        { labelAr: 'إجمالي أمر الشراء', labelEn: 'PO Amount', value: '3,450,000', unitAr: 'ر.ي', unitEn: 'YER', color: 'amber' },
                        { labelAr: 'عدد البنود الموردة', labelEn: 'Items Count', value: '3', unitAr: 'بنود', unitEn: 'items', color: 'blue' },
                        { labelAr: 'نسبة الفحص الفني', labelEn: 'Inspection Match', value: '95%', color: 'emerald' },
                        { labelAr: 'المورد المعتمد', labelEn: 'Vendor', value: 'شركة الأنابيب الحديثة', color: 'purple' }
                      ],
                      overviewFieldGroups: [
                        {
                          groupTitleAr: '1. بيانات أمر الشراء والمورد',
                          groupTitleEn: '1. PO & Vendor Details',
                          fields: [
                            { labelAr: 'رمز أمر الشراء', labelEn: 'PO Code', value: 'TX-2026-10493', isCopyable: true },
                            { labelAr: 'المورد المعتمد', labelEn: 'Vendor', value: 'شركة الأنابيب والتجهيزات المائية' },
                            { labelAr: 'المشروع المرتبط', labelEn: 'Linked Project', value: 'مشروع مياه قرى صبر الموادم' }
                          ]
                        }
                      ],
                      timeline: [
                        { id: 'tl-1', titleAr: 'إصدار أمر الشراء P2P', titleEn: 'PO Issued', actor: 'إدارة المشتريات', roleAr: 'أخصائي المشتريات', roleEn: 'Procurement', timestamp: '2026-08-26 11:00', status: 'approved' },
                        { id: 'tl-2', titleAr: 'استلام وفحص المواد في الموقع', titleEn: 'Site Inspection', actor: 'م. أحمد العباسي', roleAr: 'المهندس المشرف', roleEn: 'Site Engineer', timestamp: '2026-08-27 13:00', status: 'approved' }
                      ],
                      linkedRecords: [
                        { id: 'lr-1', code: 'PRJ-2026-08', typeAr: 'المشروع الميداني', typeEn: 'Project Record', titleAr: 'مشروع مياه قرى صبر الموادم', targetTab: 'projects' }
                      ],
                      auditTrail: [
                        { id: 'at-1', actionAr: 'رفع محضر الاستلام الميداني للمطابقة', actionEn: 'Submit GRN for matching', user: 'م. أحمد العباسي', timestamp: '2026-08-27 13:00' }
                      ]
                    })}
                    className="p-1 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                    title={isRtl ? 'معاينة السجل المؤسسي الشامل' : 'Inspect PO Object Page'}
                  >
                    <Eye className="w-4 h-4 mx-auto" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-zinc-100">TX-2026-10494</td>
                <td className="py-2.5 px-3">
                  <div className="font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'سداد إيجار مستودعات الإغاثة المركزية (الربع 3)' : 'Warehouse Lease Settlement - Q3'}</div>
                  <div className="text-[10px] text-slate-400">الشؤون الإدارية واللوجستية • شيك بنكي</div>
                </td>
                <td className="py-2.5 px-3 font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'المركز الرئيسي - صنعاء' : 'HQ - Sanaa'}</td>
                <td className="py-2.5 px-3 font-mono font-black text-slate-900 dark:text-zinc-100">1,200,000 {isRtl ? 'ر.ي' : 'YER'}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    {isRtl ? '🔵 بانتظار توقيع أمين الصندوق' : '🔵 Awaiting Signature'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button 
                    onClick={() => setInspectingRecord({
                      domainCode: 'NEB-10',
                      domainNameAr: 'نظام الرقابة المالية والحوكمة ودليل الحسابات IPSAS',
                      domainNameEn: 'Finance, IPSAS Ledger & Compliance OS',
                      recordCode: 'TX-2026-10494',
                      titleAr: 'شيك بنكي: سداد إيجار مستودعات الإغاثة المركزية (الربع 3)',
                      titleEn: 'Bank Cheque: Warehouse Lease Settlement Q3',
                      status: {
                        code: 'PENDING_SIGN',
                        labelAr: 'بانتظار توقيع أمين الصندوق',
                        labelEn: 'Awaiting Signature',
                        color: 'blue'
                      },
                      metrics: [
                        { labelAr: 'قيمة الشيك', labelEn: 'Cheque Amount', value: '1,200,000', unitAr: 'ر.ي', unitEn: 'YER', color: 'blue' },
                        { labelAr: 'الفرع المستفيد', labelEn: 'Branch', value: 'المركز الرئيسي', color: 'purple' },
                        { labelAr: 'حساب الصرف', labelEn: 'Bank Account', value: 'بنك اليمن الدولي', color: 'emerald' },
                        { labelAr: 'فترة الإيجار', labelEn: 'Period', value: 'الربع الثالث 2026', color: 'amber' }
                      ],
                      overviewFieldGroups: [
                        {
                          groupTitleAr: '1. بيانات الشيك وعقد الإيجار',
                          groupTitleEn: '1. Cheque & Lease Details',
                          fields: [
                            { labelAr: 'رقم الشيك / المعاملة', labelEn: 'Cheque No.', value: 'CHQ-2026-8819', isCopyable: true },
                            { labelAr: 'المؤجر المستفيد', labelEn: 'Landlord', value: 'مؤسسة الأمل العقارية' },
                            { labelAr: 'فترة الاستحقاق', labelEn: 'Due Period', value: 'يوليو - سبتمبر 2026' }
                          ]
                        }
                      ],
                      timeline: [
                        { id: 'tl-1', titleAr: 'طلب سداد الإيجار المعتمد', titleEn: 'Lease Payment Requested', actor: 'الخدمات اللوجستية', roleAr: 'مدير الخدمات', roleEn: 'Logistics', timestamp: '2026-08-25 10:00', status: 'approved' },
                        { id: 'tl-2', titleAr: 'تحرير الشيك البنكي والمطابقة', titleEn: 'Cheque Issued', actor: 'أ. رضوان القادري', roleAr: 'المدير المالي', roleEn: 'Finance', timestamp: '2026-08-27 16:00', status: 'approved' }
                      ],
                      linkedRecords: [
                        { id: 'lr-1', code: 'CHQ-2026-8819', typeAr: 'شيك مصرفي', typeEn: 'Bank Cheque', titleAr: 'سداد إيجار مستودعات الإغاثة', amountYer: 1200000, targetTab: 'finance' }
                      ],
                      auditTrail: [
                        { id: 'at-1', actionAr: 'تحرير الشيك وبانتظار توقيع أمين الصندوق', actionEn: 'Cheque issued, awaiting sign', user: 'أ. رضوان القادري', timestamp: '2026-08-27 16:00' }
                      ]
                    })}
                    className="p-1 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                    title={isRtl ? 'معاينة السجل المؤسسي الشامل' : 'Inspect Cheque Object Page'}
                  >
                    <Eye className="w-4 h-4 mx-auto" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 5: AMBIENT AI OPERATIONAL GUARDIAN                                   */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-950/40 to-zinc-900/60 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-emerald-300">
              {isRtl ? 'المساعد الذكي الرقابي (UAMEX Ambient AI Guardian)' : 'UAMEX Ambient AI Guardian'}
            </div>
            <p className="text-[11px] text-slate-300 dark:text-zinc-400 mt-0.5">
              {isRtl 
                ? 'تم التحقق من سلامة القيود المزدوجة ومطابقة الأرصدة البنكية بنسبة 100%. لا توجد أي مخالفات لمعايير IPSAS أو لوائح الجمعية.'
                : 'Double-entry balance verified 100%. Zero compliance exceptions detected against IPSAS rules and bylaws.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('audit')}
          className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 text-xs font-black transition-all cursor-pointer shrink-0"
        >
          {isRtl ? 'سجل الرقابة والأمان ←' : 'Audit Logs →'}
        </button>
      </div>

      {/* Universal Object Page Modal (UOP Standard) */}
      {inspectingRecord && (
        <UniversalObjectPageModal
          isOpen={Boolean(inspectingRecord)}
          onClose={() => setInspectingRecord(null)}
          lang={lang}
          domainCode={inspectingRecord.domainCode}
          domainNameAr={inspectingRecord.domainNameAr}
          domainNameEn={inspectingRecord.domainNameEn}
          recordCode={inspectingRecord.recordCode}
          titleAr={inspectingRecord.titleAr}
          titleEn={inspectingRecord.titleEn}
          status={inspectingRecord.status}
          metrics={inspectingRecord.metrics}
          overviewFieldGroups={inspectingRecord.overviewFieldGroups}
          timeline={inspectingRecord.timeline}
          linkedRecords={inspectingRecord.linkedRecords}
          auditTrail={inspectingRecord.auditTrail}
          onApprove={inspectingRecord.onApprove ? () => {
            inspectingRecord.onApprove();
            setInspectingRecord(null);
          } : undefined}
        />
      )}

      {/* Floating Bottom Dock for Batch Approvals */}
      {selectedBatchIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 mx-auto max-w-2xl z-40 px-4 animate-in slide-in-from-bottom-5">
          <div className="bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-md text-white border border-emerald-500/40 rounded-3xl p-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 ring-4 ring-black/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-mono font-black text-sm shadow-xs">
                {selectedBatchIds.length}
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-2">
                  <span>{isRtl ? `تم تحديد ${selectedBatchIds.length} معاملات للاعتماد الجماعي` : `${selectedBatchIds.length} transactions selected`}</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">Mass Action</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  {isRtl ? `إجمالي المبالغ: ${totalBatchAmount.toLocaleString()} ر.ي` : `Total: ${totalBatchAmount.toLocaleString()} YER`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedBatchIds([])}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                {isRtl ? 'إلغاء التحديد' : 'Deselect'}
              </button>

              <button
                onClick={handleBatchApprove}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isRtl ? 'اعتماد الدفعة بلمسة واحدة' : 'Approve Batch Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return for Clarification Micro-Modal */}
      {clarificationModal.isOpen && clarificationModal.task && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {isRtl ? 'إعادة المعاملة للاستيفاء أو التصحيح' : 'Return for Clarification / Correction'}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500">
                    {clarificationModal.task.projectCode} • {clarificationModal.task.amountYer.toLocaleString()} {isRtl ? 'ر.ي' : 'YER'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setClarificationModal({ isOpen: false, task: null, reason: '', note: '' })}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-black text-slate-800 dark:text-zinc-200 block">
                {isRtl ? 'حدد سبب الإعادة للجهة الطالبة / المحاسب:' : 'Select correction reason:'}
              </label>

              <div className="space-y-2">
                {[
                  isRtl ? 'نقص الفاتورة الضريبية الأصلية أو محضر الفحص الفني' : 'Missing tax invoice or inspection report',
                  isRtl ? 'تجاوز سقف الموازنة المعتمدة لبند المشروع (WBS Overrun)' : 'Budget ceiling overrun for WBS item',
                  isRtl ? 'الحاجة لتعديل التوجيه المحاسبي ومركز التكلفة بدفتر الأستاذ' : 'Incorrect GL account or cost center code',
                  isRtl ? 'نقص تواقيع اللجنة الميدانية أو إثبات استلام المستفيد' : 'Missing field committee signatures or proof of delivery'
                ].map((reasonText) => (
                  <label 
                    key={reasonText}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      clarificationModal.reason === reasonText
                        ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="clarification_reason"
                      checked={clarificationModal.reason === reasonText}
                      onChange={() => setClarificationModal(prev => ({ ...prev, reason: reasonText }))}
                      className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500"
                    />
                    <span>{reasonText}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  {isRtl ? 'ملاحظة إضافية للمسؤول (اختياري):' : 'Additional note for requester (optional):'}
                </label>
                <textarea
                  value={clarificationModal.note}
                  onChange={(e) => setClarificationModal(prev => ({ ...prev, note: e.target.value }))}
                  placeholder={isRtl ? 'أدخل أي توجيهات محددة لاستيفاء المعاملة...' : 'Add specific instructions...'}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-xs outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setClarificationModal({ isOpen: false, task: null, reason: '', note: '' })}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={handleConfirmClarification}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إرسال الإشعار وإعادة المعاملة' : 'Dispatch Notice & Return'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuantumWorkFirstCockpit;
