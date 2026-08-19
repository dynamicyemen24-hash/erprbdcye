import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Activity, 
  User, 
  Command, 
  ChevronRight,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useEnterprise } from '../../core/context/EnterpriseContext';
import { TemporalPulseItem } from '../../core/services/temporalIntelligence';

interface CockpitHeaderStripProps {
  lang: 'ar' | 'en';
  temporalPulse: TemporalPulseItem[];
  overallHealthScore: number;
  overallHealthStatus: 'HEALTHY' | 'ATTENTION' | 'WARNING' | 'CRITICAL';
  onOpenUniversalCommand: () => void;
  onNavigate: (tabId: string) => void;
  onRefresh?: () => void;
}

export const CockpitHeaderStrip: React.FC<CockpitHeaderStripProps> = ({
  lang,
  temporalPulse,
  overallHealthScore,
  overallHealthStatus,
  onOpenUniversalCommand,
  onNavigate,
  onRefresh
}) => {
  const { 
    orgName, 
    logoUrl, 
    licenseText, 
    selectedBranchCode, 
    fiscalYear, 
    activeRolePerspective, 
    setActiveRolePerspective,
    isOnline 
  } = useEnterprise();

  const [isPulseExpanded, setIsPulseExpanded] = useState(false);

  const getStatusBadge = () => {
    if (overallHealthStatus === 'HEALTHY') {
      return {
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-500',
        labelAr: 'جاهزية مؤسسية كاملة',
        labelEn: 'Nominal Readiness'
      };
    } else if (overallHealthStatus === 'ATTENTION') {
      return {
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        dot: 'bg-blue-500',
        labelAr: 'مستقر قيد المتابعة',
        labelEn: 'Stable Monitoring'
      };
    } else if (overallHealthStatus === 'WARNING') {
      return {
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        dot: 'bg-amber-500',
        labelAr: 'استثناءات تتطلب انتباهاً',
        labelEn: 'Action Required'
      };
    }
    return {
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      dot: 'bg-rose-500 animate-pulse',
      labelAr: 'تنبيه تدبير عاجل',
      labelEn: 'Critical Alert'
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Primary Operating Strip */}
      <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left: Organization Identity & Operational Pulse Context */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
            <img 
              src={logoUrl || '/LogoRohamaab.png'} 
              alt="Organization Logo" 
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {orgName}
              </h1>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${statusBadge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                <span>{lang === 'ar' ? statusBadge.labelAr : statusBadge.labelEn}</span>
                <span className="font-mono font-black opacity-80">({overallHealthScore}%)</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1 flex-wrap font-medium">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{licenseText}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'ar' ? 'الفرع الرئيسي:' : 'Branch:'} <strong className="text-slate-700 dark:text-zinc-200">{selectedBranchCode}</strong></span>
              </span>
              <span>•</span>
              <span>{lang === 'ar' ? 'السنة المالية:' : 'FY:'} <strong className="text-slate-700 dark:text-zinc-200">{fiscalYear}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'متصل' : 'Online'}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'الوضع الميداني (Offline)' : 'Field Mode (Offline)'}</span>
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Universal Command Launcher & Adaptive Role Perspective Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap lg:justify-end shrink-0">
          
          {/* Role Perspective Selector */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700/70 text-xs">
            <button
              onClick={() => setActiveRolePerspective('executive')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeRolePerspective === 'executive' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'المنظور التنفيذي' : 'Executive'}
            </button>
            <button
              onClick={() => setActiveRolePerspective('manager')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeRolePerspective === 'manager' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'التشغيل والمشاريع' : 'Operations'}
            </button>
            <button
              onClick={() => setActiveRolePerspective('field')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeRolePerspective === 'field' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'الميدان والخدمات' : 'Field Client'}
            </button>
          </div>

          {/* Universal Command Bar Button */}
          <button
            onClick={onOpenUniversalCommand}
            className="flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-3 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-xs text-slate-500 dark:text-zinc-400 transition-all shadow-2xs hover:border-emerald-500/30 group cursor-pointer"
            aria-label="Open Universal Command"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-700 dark:text-zinc-200">
                {lang === 'ar' ? 'البحث والأوامر المؤسسية...' : 'Search records & commands...'}
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 rounded-md shadow-3xs">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>
      </div>

      {/* Temporal Pulse: "What happened since your last visit?" (Collapsible Drawer) */}
      <div className="w-full bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/80 rounded-xl px-4 py-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'ar' ? 'نبض العمليات منذ آخر زيارة لك:' : 'Activity pulse since your last visit:'}</span>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono px-2 py-0.2 rounded-full font-black">
              {temporalPulse.length} {lang === 'ar' ? 'تحديثات' : 'events'}
            </span>
          </div>

          <button
            onClick={() => setIsPulseExpanded(!isPulseExpanded)}
            className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{isPulseExpanded ? (lang === 'ar' ? 'طي' : 'Collapse') : (lang === 'ar' ? 'عرض التفاصيل' : 'Expand')}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPulseExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Compact Single Line Summary when collapsed */}
        {!isPulseExpanded && temporalPulse.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-zinc-200 shrink-0">
              {lang === 'ar' ? temporalPulse[0].relativeTimeAr : temporalPulse[0].relativeTimeEn}:
            </span>
            <span className="truncate">
              {lang === 'ar' ? temporalPulse[0].titleAr : temporalPulse[0].titleEn}
            </span>
          </div>
        )}

        {/* Expanded Pulse List */}
        {isPulseExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800 animate-fade-in">
            {temporalPulse.map(item => (
              <div 
                key={item.id}
                onClick={() => onNavigate(item.targetTab)}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-white dark:bg-zinc-800/70 border border-slate-200/60 dark:border-zinc-700/60 hover:border-emerald-500/40 transition-colors cursor-pointer group"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {lang === 'ar' ? item.badgeAr : item.badgeEn}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {lang === 'ar' ? item.relativeTimeAr : item.relativeTimeEn}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {lang === 'ar' ? item.titleAr : item.titleEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
