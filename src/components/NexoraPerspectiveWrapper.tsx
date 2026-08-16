import React from 'react';
import { 
  ShieldCheck, 
  Briefcase, 
  Users, 
  Coins, 
  Layers, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  MapPin, 
  FileText, 
  Award, 
  Sparkles,
  Zap,
  Filter,
  Eye,
  Settings,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export type PerspectiveRole = 'executive' | 'manager' | 'field';

export interface PerspectiveConfig {
  id: PerspectiveRole;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  badgeAr: string;
  badgeEn: string;
  icon: React.ElementType;
  primaryColor: string;
  gradientBg: string;
  focusMetricsAr: string[];
  focusMetricsEn: string[];
}

export const PERSPECTIVE_CONFIGS: Record<PerspectiveRole, PerspectiveConfig> = {
  executive: {
    id: 'executive',
    titleAr: 'منظور القيادة التنفيذية والحوكمة الاستراتيجية',
    titleEn: 'Executive Leadership & Strategic Governance Perspective',
    subtitleAr: 'رؤية عالية المستوى (C-Suite): رأس المال الموحد، سلامة سجل IPSAS، أداء المانحين وأثر CHS',
    subtitleEn: 'High-level C-Suite view: Consolidated Capital, IPSAS Ledger Integrity, Donor Performance & CHS Impact',
    badgeAr: '👑 القيادة التنفيذية (C-Suite)',
    badgeEn: '👑 Executive C-Suite',
    icon: ShieldCheck,
    primaryColor: 'emerald',
    gradientBg: 'from-emerald-950 via-zinc-900 to-emerald-950',
    focusMetricsAr: [
      'التفاصيل الديموغرافية والمنطقة',
      'معدل الامتثال المحاسبي لمعايير IPSAS',
      'مؤشر الأثر الإنساني CHS / Sphere',
      'مجلد الموافقات التنفيذية والحوكمة'
    ],
    focusMetricsEn: [
      'Total Approved Strategic Capital',
      'IPSAS Accounting Compliance Rate',
      'CHS / Sphere Humanitarian Impact Index',
      'Executive Approvals & Governance Deck'
    ]
  },
  manager: {
    id: 'manager',
    titleAr: 'منظور إدارة البرامج والمشاريع',
    titleEn: 'Program & Project Management Perspective',
    subtitleAr: 'رؤية مدير القطاع: مصفوفة تنفيذ البرامج، سرعة استهلاك الميزانية، جداول WBS وقائمة الموافقات',
    subtitleEn: 'Sectoral Manager View: Program Execution Matrix, Budget Burn Velocity, WBS Timelines & Approvals Queue',
    badgeAr: '📁 مدير البرامج والمشاريع',
    badgeEn: '📁 Program & Project Manager',
    icon: Briefcase,
    primaryColor: 'amber',
    gradientBg: 'from-amber-950 via-zinc-900 to-amber-950',
    focusMetricsAr: [
      'عدد المشاريع الميدانية النشطة',
      'مدير الرقابة والمتابعة الميدانية',
      'نسبة إنجاز أنشطة WBS',
      'طلبات الموافقة المالية المعلقة'
    ],
    focusMetricsEn: [
      'Active Field Project Count',
      'Operating Budget Burn Rate',
      'WBS Activity Completion %',
      'Pending Operational Voucher Requests'
    ]
  },
  field: {
    id: 'field',
    titleAr: 'منظور العمليات الميدانية وتقييم الحالات',
    titleEn: 'Field Operations & Case Assessment Perspective',
    subtitleAr: 'رؤية المراجع الميداني والأخصائي الاجتماعي: استقبال سريع للمستفيدين، مسوح الأسر، كفالات رعاية الأيتام وسجلات المواقع',
    subtitleEn: 'Field Auditor & Social Worker View: Rapid Beneficiary Intake, Household Surveys, Orphan Care Stipends & Site Logs',
    badgeAr: '📋 العمليات الميدانية والرعاية',
    badgeEn: '📋 Field Operations & Welfare',
    icon: Users,
    primaryColor: 'rose',
    gradientBg: 'from-rose-950 via-zinc-900 to-rose-950',
    focusMetricsAr: [
      'استقبال الأسر المحققة',
      'الكفالات النشطة للأيتام والأسر',
      'الإدخال الميداني السريع والمسوح',
      'المستفيدين والكفالات والتحصيل'
    ],
    focusMetricsEn: [
      'Verified Households Intake',
      'Active Orphan & Family Stipends',
      'Rapid Field Entry & Surveys',
      'Site Logistics & Direct Relief'
    ]
  }
};

interface NexoraPerspectiveWrapperProps {
  activeRolePerspective: PerspectiveRole;
  targetPerspective?: PerspectiveRole | PerspectiveRole[] | 'all';
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  badgeAr?: string;
  badgeEn?: string;
  icon?: React.ElementType;
  accentColor?: 'emerald' | 'amber' | 'blue' | 'rose' | 'zinc';
  layoutMode?: 'grid-4' | 'grid-3' | 'grid-2' | 'stacked' | 'flex' | 'none';
  className?: string;
  lang?: 'ar' | 'en';
  children: React.ReactNode;
}

export default function NexoraPerspectiveWrapper({
  activeRolePerspective,
  targetPerspective = 'all',
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  badgeAr,
  badgeEn,
  icon: Icon = Activity,
  accentColor = 'emerald',
  layoutMode = 'none',
  className = '',
  lang = 'ar',
  children
}: NexoraPerspectiveWrapperProps) {
  // Check if this wrapper should be visible in the current active perspective
  const isVisible = React.useMemo(() => {
    if (targetPerspective === 'all') return true;
    if (Array.isArray(targetPerspective)) {
      return targetPerspective.includes(activeRolePerspective);
    }
    return targetPerspective === activeRolePerspective;
  }, [activeRolePerspective, targetPerspective]);

  if (!isVisible) return null;

  // Compute color styles
  const colorStyles = {
    emerald: {
      border: 'border-emerald-500/20 dark:border-emerald-500/30',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      iconBg: 'p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40',
      highlightBar: 'bg-gradient-to-r from-emerald-500 to-teal-500'
    },
    amber: {
      border: 'border-amber-500/20 dark:border-amber-500/30',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      iconBg: 'p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40',
      highlightBar: 'bg-gradient-to-r from-amber-500 to-orange-500'
    },
    blue: {
      border: 'border-blue-500/20 dark:border-blue-500/30',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      iconBg: 'p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40',
      highlightBar: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    },
    rose: {
      border: 'border-rose-500/20 dark:border-rose-500/30',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      iconBg: 'p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40',
      highlightBar: 'bg-gradient-to-r from-rose-500 to-pink-500'
    },
    zinc: {
      border: 'border-zinc-300 dark:border-zinc-700',
      badgeBg: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
      iconBg: 'p-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700',
      highlightBar: 'bg-gradient-to-r from-zinc-500 to-zinc-700'
    }
  }[accentColor];

  // Compute layout grid style
  const layoutClass = {
    'grid-4': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
    'grid-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5',
    'grid-2': 'grid grid-cols-1 md:grid-cols-2 gap-5',
    'stacked': 'space-y-4',
    'flex': 'flex flex-wrap gap-4',
    'none': ''
  }[layoutMode];

  const hasHeader = titleAr || titleEn;

  return (
    <div className={`relative transition-all duration-300 ${className}`}>
      {/* Perspective Wrapper Section Frame if title exists */}
      {hasHeader && (
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className={`rounded-xl ${colorStyles.iconBg}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                  {lang === 'ar' ? titleAr : titleEn}
                </h3>
                {(badgeAr || badgeEn) && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono border ${colorStyles.badgeBg}`}>
                    {lang === 'ar' ? badgeAr : badgeEn}
                  </span>
                )}
              </div>
              {(subtitleAr || subtitleEn) && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  {lang === 'ar' ? subtitleAr : subtitleEn}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[10px] font-black text-zinc-400 font-mono uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-500" />
              <span>{activeRolePerspective.toUpperCase()} PERSPECTIVE</span>
            </span>
          </div>
        </div>
      )}

      {/* Children content within layout grid or container */}
      <div className={layoutClass}>
        {children}
      </div>
    </div>
  );
}

/**
 * Header Banner Component for Perspective Switching & Persona Identity
 */
export function NexoraPerspectiveHeaderBanner({
  activeRolePerspective,
  setActiveRolePerspective,
  currentUser,
  lang = 'ar'
}: {
  activeRolePerspective: PerspectiveRole;
  setActiveRolePerspective: (role: PerspectiveRole) => void;
  currentUser?: any;
  lang?: 'ar' | 'en';
}) {
  const currentConfig = PERSPECTIVE_CONFIGS[activeRolePerspective];
  const Icon = currentConfig.icon;

  // Role detection helper
  const userRoleBadge = React.useMemo(() => {
    if (!currentUser) return lang === 'ar' ? 'مستخدم النظام' : 'System User';
    const role = (currentUser.role || currentUser.role_code || '').toUpperCase();
    if (role.includes('EXECUTIVE') || role.includes('ADMIN') || role.includes('CEO') || role.includes('BOARD')) {
      return lang === 'ar' ? 'دور تنفيذي (C-Suite)' : 'Executive Role';
    }
    if (role.includes('MANAGER') || role.includes('PROGRAM') || role.includes('PROJECT')) {
      return lang === 'ar' ? 'دور مدير' : 'Manager Role';
    }
    return lang === 'ar' ? 'دور عامل ميداني' : 'Field Worker Role';
  }, [currentUser, lang]);

  return (
    <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-5 rounded-xl text-white shadow-xl space-y-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Active Perspective Info */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{lang === 'ar' ? currentConfig.badgeAr : currentConfig.badgeEn}</span>
            </span>

            {currentUser && (
              <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" />
                <span>{currentUser.name || currentUser.email} ({userRoleBadge})</span>
              </span>
            )}
          </div>

          <h2 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{lang === 'ar' ? currentConfig.titleAr : currentConfig.titleEn}</span>
          </h2>
          <p className="text-xs text-zinc-400 font-medium max-w-2xl">
            {lang === 'ar' ? currentConfig.subtitleAr : currentConfig.subtitleEn}
          </p>
        </div>

        {/* Perspective Switcher Controls */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 self-stretch md:self-auto shrink-0 shadow-inner">
          <span className="text-[10px] font-black text-zinc-400 px-2 uppercase tracking-wider hidden sm:inline">
            {lang === 'ar' ? 'منظور:' : 'Perspective:'}
          </span>
          {(['executive', 'manager', 'field'] as PerspectiveRole[]).map((rKey) => {
            const conf = PERSPECTIVE_CONFIGS[rKey];
            const isActive = activeRolePerspective === rKey;
            return (
              <button
                key={rKey}
                onClick={() => setActiveRolePerspective(rKey)}
                className={`px-3 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 via-amber-600 to-emerald-700 text-white shadow-lg ring-1 ring-amber-400/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                <span>{rKey === 'executive' ? '👑' : rKey === 'manager' ? '📁' : '📋'}</span>
                <span>
                  {lang === 'ar' 
                    ? (rKey === 'executive' ? 'تنفيذي' : rKey === 'manager' ? 'مدير' : 'ميداني')
                    : (rKey === 'executive' ? 'Executive' : rKey === 'manager' ? 'Manager' : 'Field')}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Perspective Focal Metrics Pill Bar */}
      <div className="relative z-10 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{lang === 'ar' ? 'مجالات التركيز الرئيسية:' : 'Key Focal Areas:'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(lang === 'ar' ? currentConfig.focusMetricsAr : currentConfig.focusMetricsEn).map((m, idx) => (
            <span 
              key={idx} 
              className="px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 text-zinc-300 rounded-lg font-bold text-[10px] flex items-center gap-1 font-sans hover:border-amber-500/40 transition-colors"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{m}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
