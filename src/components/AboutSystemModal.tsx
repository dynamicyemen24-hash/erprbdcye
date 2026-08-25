import React, { useState, useEffect } from 'react';
import { useEnterprise } from '../core/context/EnterpriseContext';
import { 
  Cpu, 
  ShieldCheck, 
  Globe2, 
  BookOpen, 
  Keyboard, 
  LifeBuoy, 
  Activity, 
  Database, 
  Server, 
  Lock, 
  X,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Video,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Layers,
  Award,
  TrendingUp
} from 'lucide-react';
import { STORAGE_KEYS } from '../lib/constants';

interface AboutSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  currentUser?: { name: string; role: string; email: string };
  isOnline: boolean;
  onOpenDocs: () => void;
  onOpenShortcuts: () => void;
}

const CAROUSEL_STEP_INTERVAL = 3500;

const SCENARIO_STEPS = [
  {
    step: 1,
    domain: 'التخطيط',
    titleAr: '🚀 وضع الخطة وتحديد الأهداف',
    titleEn: '🚀 Planning & Setting Goals',
    descAr: 'تبدأ بتحديد أهداف مؤسستك ومؤشرات نجاحها، وتوزيع المسؤوليات على الفرق بشكل واضح ومنظم.',
    descEn: 'Define your organizational goals and success indicators, then assign responsibilities to your teams clearly and efficiently.',
    badge: 'التخطيط',
    color: 'from-emerald-500 to-teal-600',
    metric: 'أهداف واضحة'
  },
  {
    step: 2,
    domain: 'المالية',
    titleAr: '💰 تخصيص الميزانيات ومتابعة الصرف',
    titleEn: '💰 Budget Allocation & Expenditure Tracking',
    descAr: 'خصص ميزانيات البرامج والمشاريع، وتابع عمليات الصرف بدقة مع ضمان الشفافية الكاملة في كل معاملة.',
    descEn: 'Allocate program budgets, track expenditures accurately, and ensure full transparency across every financial transaction.',
    badge: 'المالية',
    color: 'from-amber-500 to-orange-600',
    metric: 'ميزانية منظمة'
  },
  {
    step: 3,
    domain: 'الميدان',
    titleAr: '📦 تنفيذ الأنشطة ومتابعة الفرق',
    titleEn: '📦 Field Execution & Team Follow-Up',
    descAr: 'وثّق الأنشطة الميدانية وأسند المهام للفرق، وتابع التقدم الفعلي مقارنةً بالخطة المعتمدة.',
    descEn: 'Document field activities, assign tasks to teams, and track real progress against the approved plan.',
    badge: 'الميدان',
    color: 'from-blue-500 to-cyan-600',
    metric: 'تنفيذ منظم'
  },
  {
    step: 4,
    domain: 'المستفيدون',
    titleAr: '👥 خدمة المستفيدين وتوصيل الدعم',
    titleEn: '👥 Serving Beneficiaries & Delivering Support',
    descAr: 'تابع بيانات الأسر والمستحقين، وأصدر سندات الكفالة والدعم بدقة وعدالة.',
    descEn: 'Manage beneficiary and family records, and issue support and sponsorship vouchers accurately and fairly.',
    badge: 'الخدمات',
    color: 'from-purple-500 to-indigo-600',
    metric: 'وصول عادل'
  },
  {
    step: 5,
    domain: 'التقارير',
    titleAr: '📊 مراجعة النتائج وإعداد التقارير',
    titleEn: '📊 Reviewing Results & Generating Reports',
    descAr: 'راجع ما تحقق، واستخرج تقارير شاملة وموثوقة تعكس الأثر الفعلي لأعمال مؤسستك.',
    descEn: 'Review achievements and generate comprehensive, reliable reports that reflect the real impact of your work.',
    badge: 'التقارير',
    color: 'from-emerald-600 to-green-500',
    metric: 'رؤية واضحة'
  }
];

export const AboutSystemModal: React.FC<AboutSystemModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentUser,
  isOnline,
  onOpenDocs,
  onOpenShortcuts
}) => {
  const { organizationName } = useEnterprise();
  const [activeTab, setActiveTab] = useState<'overview' | 'video' | 'health' | 'guide'>('overview');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex(prev => (prev + 1) % SCENARIO_STEPS.length);
      }, CAROUSEL_STEP_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'مدير النظام';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-zinc-950 p-6 text-white relative overflow-hidden flex items-center justify-between shrink-0">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 border border-emerald-400/40 flex items-center justify-center text-white shadow-lg">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Nexora<span className="text-amber-400">OS</span>™ Enterprise
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v2.6 Production
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 font-medium">
                {isRtl ? 'نظام التشغيل المؤسسي الذكي - الرابطة التشغيلية الموحدة' : 'Intelligent Enterprise Operating System'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800'
            }`}
          >
            {isRtl ? 'نظرة عامة وهوية النظام' : 'System Overview'}
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-3 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'video'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-amber-500" />
            <span>{isRtl ? 'فيديو تعريفي بالنظام' : 'Introductory Video'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[8px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold">جديد</span>
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`pb-3 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'health'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800'
            }`}
          >
            {isRtl ? 'حالة الخدمات والصحة التقنية' : 'Service Health & Telemetry'}
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800'
            }`}
          >
            {isRtl ? 'الدعم والاختصارات' : 'Support & Shortcuts'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-zinc-300">
          
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-emerald-600" />
                  <span>{organizationName || (isRtl ? 'المنظومة القياسية المتكاملة' : 'Universal Enterprise OS')}</span>
                </h4>
                <p className="leading-relaxed text-slate-600 dark:text-zinc-400">
                  {isRtl
                    ? 'منصة عمل موحدة لإدارة البرامج والمشاريع والعمليات الميدانية وخدمة المستفيدين والمعاملات المالية وإعداد التقارير — كل ذلك في مكان واحد.'
                    : 'A unified workspace for managing programs, field operations, beneficiaries, financial transactions, and reporting — all in one place.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? 'المستخدم الحالي' : 'Current User'}</span>
                  <p className="font-extrabold text-slate-900 dark:text-zinc-100">{currentUser?.name || (isRtl ? 'مستخدم النظام' : 'System User')}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? 'الدور الوظيفي' : 'Role'}</span>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400">{currentUser?.role || (isRtl ? 'موظف' : 'Staff')}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? 'بيئة العمل' : 'Workspace'}</span>
                  <p className="font-extrabold text-slate-900 dark:text-zinc-100">{organizationName || (isRtl ? 'جمعية رُحماء بينهم' : 'Rohamaab Foundation')}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? 'حالة الاتصال' : 'Connection'}</span>
                  <p className={`font-extrabold ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {isOnline ? (isRtl ? 'متصل' : 'Online') : (isRtl ? 'غير متصل' : 'Offline')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-4 animate-fade-in">
              {/* Kinetic Motion Interactive Operational Scenario Showcase Player */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
                
                {/* Header Strip with Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-extrabold text-xs">
                      {SCENARIO_STEPS[currentStepIndex].step}/5
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{isRtl ? 'العرض التفاعلي الحركي للسيناريو التشغيلي' : 'Kinetic Motion Operational Showcase'}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {isRtl ? SCENARIO_STEPS[currentStepIndex].domain : SCENARIO_STEPS[currentStepIndex].domain}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isRtl ? 'محاكاة حركية تفاعلية مدتها 5 مراحل تشغيلية تغطي دورة العمل في المنظومة' : 'Interactive 5-stage motion simulator demonstrating the full operational workflow'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentStepIndex(prev => (prev > 0 ? prev - 1 : SCENARIO_STEPS.length - 1))}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer"
                      title={isRtl ? 'المرحلة السابقة' : 'Previous Step'}
                    >
                      <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
                        isPlaying 
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      <span>{isPlaying ? (isRtl ? 'إيقاف مؤقت' : 'Pause') : (isRtl ? 'تشغيل حركي' : 'Play Showcase')}</span>
                    </button>

                    <button
                      onClick={() => setCurrentStepIndex(prev => (prev + 1) % SCENARIO_STEPS.length)}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer"
                      title={isRtl ? 'المرحلة التالية' : 'Next Step'}
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicators Bar */}
                <div className="grid grid-cols-5 gap-2">
                  {SCENARIO_STEPS.map((s, idx) => (
                    <button
                      key={s.step}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentStepIndex 
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-sm shadow-emerald-500/50 scale-y-125' 
                          : idx < currentStepIndex 
                          ? 'bg-emerald-500/50' 
                          : 'bg-slate-300 dark:bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Animated Kinetic Card Display */}
                <div className="relative rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-zinc-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 p-6 min-h-[190px] flex flex-col justify-between overflow-hidden shadow-inner group">
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono text-white bg-gradient-to-r ${SCENARIO_STEPS[currentStepIndex].color} shadow-sm`}>
                        {SCENARIO_STEPS[currentStepIndex].badge}
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                        {SCENARIO_STEPS[currentStepIndex].metric}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight animate-in fade-in duration-300">
                      {isRtl ? SCENARIO_STEPS[currentStepIndex].titleAr : SCENARIO_STEPS[currentStepIndex].titleEn}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl animate-in fade-in duration-300">
                      {isRtl ? SCENARIO_STEPS[currentStepIndex].descAr : SCENARIO_STEPS[currentStepIndex].descEn}
                    </p>
                  </div>

                  {/* Ambient Glow Background Effect */}
                  <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
                </div>

                {/* Footer Step Selector Pills */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  {SCENARIO_STEPS.map((s, idx) => (
                    <button
                      key={s.step}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                        idx === currentStepIndex
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200'
                      }`}
                    >
                      {isRtl ? `تحويل ${s.step}` : `Stage ${s.step}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700/50 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-zinc-100 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isRtl ? 'المجالات الـ15' : '15 NEB Domains'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {isRtl ? 'إدارة استراتيجية، برامج، أصول، ومالية موحدة.' : 'Unified strategic, operational & fund accounting.'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700/50 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-zinc-100 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isRtl ? 'جاهزية استيراد البيانات' : 'Data Import Ready'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {isRtl ? 'رفع شجرة الحسابات والافتتاحيات بضغط زر.' : 'Instant CSV/Excel chart of accounts setup.'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700/50 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-zinc-100 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isRtl ? 'معايير IPSAS وميثاق إسفير' : 'IPSAS & Sphere Compliant'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {isRtl ? 'امتثال دولي كامل وتقارير تدقيقية معتمدة.' : 'Full international accounting & NGO reporting standards.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-zinc-100">
                      {isRtl ? 'حالة البنية التحتية والخدمات السحابية' : 'Infrastructure & Cloud Services Status'}
                    </h4>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                      {isRtl ? 'جميع الأنظمة الـ15 تعمل بكفاءة تامة دون أخطاء' : 'All 15 enterprise domains operating normally'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black font-mono">
                  {isRtl ? 'مستقر 100%' : '100% HEALTHY'}
                </span>
              </div>

              {isAdmin ? (
                <div className="space-y-2">
                  <span className="font-black text-[11px] text-slate-400 uppercase tracking-wider block">
                    {isRtl ? 'خدمات النظام الداخلية (للمستخدمين المخولين فقط)' : 'Internal Service Registry (Authorized Only)'}
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
                      <span className="font-bold flex items-center gap-2 text-xs"><Database className="w-3.5 h-3.5 text-emerald-600" />{isRtl ? 'قاعدة البيانات المركزية' : 'Central Database'}</span>
                      <span className="text-emerald-600 font-black text-[10px]">{isRtl ? 'نشط ومتصل' : 'ACTIVE'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
                      <span className="font-bold flex items-center gap-2 text-xs"><Server className="w-3.5 h-3.5 text-blue-600" />{isRtl ? 'خادم الخدمات' : 'Application Services'}</span>
                      <span className="text-emerald-600 font-black text-[10px]">{isRtl ? 'يعمل' : 'RUNNING'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
                      <span className="font-bold flex items-center gap-2 text-xs"><ShieldCheck className="w-3.5 h-3.5 text-amber-600" />{isRtl ? 'نظام الصلاحيات والحماية' : 'Access Control & Security'}</span>
                      <span className="text-emerald-600 font-black text-[10px]">{isRtl ? 'مفعّل' : 'ENFORCED'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-amber-800 dark:text-amber-300 font-medium">
                    {isRtl ? 'تفاصيل الخدمات الداخلية الدقيقة متاحة للمستخدمين ذوي صلاحية الإدارة والتدقيق.' : 'Detailed internal service diagnostics restricted to Admin & Audit roles.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => { onClose(); onOpenDocs(); }}
                  className="p-4 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-2xl flex items-center justify-between transition-all cursor-pointer group text-right rtl:text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 dark:text-zinc-100">{isRtl ? 'دليل الاستخدام والتوثيق' : 'User Manual & Docs'}</h5>
                      <p className="text-[10px] text-slate-500">{isRtl ? 'دليل تشغيل الأنظمة الـ15' : '15 Domains operational guide'}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </button>

                <button
                  onClick={() => { onClose(); onOpenShortcuts(); }}
                  className="p-4 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-2xl flex items-center justify-between transition-all cursor-pointer group text-right rtl:text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <Keyboard className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 dark:text-zinc-100">{isRtl ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}</h5>
                      <p className="text-[10px] text-slate-500">{isRtl ? 'التنقل السريع وأوامر النظام' : 'Fast navigation & commands'}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </button>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
                <h5 className="font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? 'الدعم الفني والمساندة المؤسسية' : 'Technical Support & Assistance'}</span>
                </h5>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {isRtl
                    ? 'للحصول على مساعدة تشغيلية أو الإبلاغ عن أي ملاحظة في القيود المحاسبية أو الميدانية، يمكنك التواصل مع فريق الدعم الفني المركزي المباشر.'
                    : 'For technical assistance or accounting/field inquiries, contact direct enterprise IT support.'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            NexoraOS? ? ????? ?????? ????? ????? ???????? ???????? ? 2026
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AboutSystemModal;

