// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Premium Dashboard Experience
// Executive Quantum Cockpit with Real-Time KPIs
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Users, Briefcase, Heart, DollarSign, TrendingUp,
  TrendingDown, Activity, Sparkles, Zap, ChevronRight, Bell,
  Search, Settings, ChevronDown, ArrowUpRight, ArrowDownRight,
  Calendar, Target, Award, AlertTriangle, CheckCircle2, Clock,
  Globe, BarChart3, PieChart as PieIcon, LineChart as LineIcon,
  Building2, Shield, Cpu, Eye
} from 'lucide-react';
import { StatCard, Skeleton, ProgressBar, Badge, Alert, Tabs } from '../../shared/components';

type Lang = 'ar' | 'en';
type Theme = 'light' | 'dark';

interface UAMEXDashboardExperienceProps {
  lang: Lang;
  theme: Theme;
  user?: { id: string; name: string; role: string };
  onNavigate: (workspace: string) => void;
  onLogout: () => void;
  onToggleLang: () => void;
  onToggleTheme: () => void;
}

const t = (ar: string, en: string, lang: Lang) => (lang === 'ar' ? ar : en);

// Animated counter hook (inline to avoid import issues)
const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

export const UAMEXDashboardExperience: React.FC<UAMEXDashboardExperienceProps> = ({
  lang,
  theme,
  user,
  onNavigate,
  onLogout,
  onToggleLang,
  onToggleTheme,
}) => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'finance' | 'programs' | 'operations'>('overview');

  useEffect(() => {
    const tm = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(tm);
  }, []);

  const kpis = useMemo(() => ([
    {
      title: t('إجمالي البرامج النشطة', 'Active Programs', lang),
      value: 47,
      change: 12.4,
      trend: 'up' as const,
      icon: Target,
      tone: 'emerald' as const,
      sparkline: [12, 18, 15, 22, 28, 25, 32, 38, 42, 47],
    },
    {
      title: t('المستفيدون النشطون', 'Active Beneficiaries', lang),
      value: 128450,
      change: 8.7,
      trend: 'up' as const,
      icon: Heart,
      tone: 'amber' as const,
      sparkline: [98, 102, 110, 115, 118, 120, 122, 125, 127, 128],
      suffix: '',
    },
    {
      title: t('الميزانية المنفذة', 'Budget Executed', lang),
      value: 8450000,
      change: -2.3,
      trend: 'down' as const,
      icon: DollarSign,
      tone: 'emerald' as const,
      sparkline: [82, 85, 88, 90, 92, 89, 86, 85, 84, 84],
      prefix: '$',
    },
    {
      title: t('المشاريع قيد التنفيذ', 'Ongoing Projects', lang),
      value: 124,
      change: 5.1,
      trend: 'up' as const,
      icon: Briefcase,
      tone: 'sky' as const,
      sparkline: [100, 105, 110, 115, 118, 120, 121, 122, 123, 124],
    },
  ]), [lang]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <UAMEXHeader
        lang={lang}
        theme={theme}
        user={user}
        onToggleLang={onToggleLang}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-transparent to-amber-600/5 dark:from-emerald-500/10 dark:via-transparent dark:to-amber-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          {/* Welcome banner */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="success" size="sm" pulse lang={lang} icon={<Sparkles />}>
                  {t('منصة ذكية', 'Intelligent Platform', lang)}
                </Badge>
                <Badge variant="warning" size="sm" lang={lang}>
                  {t('مباشر', 'LIVE', lang)}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {t('مرحباً', 'Welcome back', lang)}{user ? `, ${user.name}` : ''} 👋
              </h1>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
                {t('إليك نظرة شاملة على أداء المؤسسة اليوم', "Here's your enterprise performance overview for today", lang)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 text-xs font-black text-slate-700 dark:text-zinc-300 flex items-center gap-2 transition-all shadow-sm">
                <Calendar className="w-3.5 h-3.5" />
                {t('اليوم', 'Today', lang)}
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30">
                <Zap className="w-3.5 h-3.5" />
                {t('تقرير ذكي', 'AI Insight', lang)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Critical alert (conditional) */}
        <div className="mb-4">
          <Alert
            type="info"
            title={t('تحديثات ذكية متاحة', 'Smart updates available', lang)}
            titleAr={t('تحديثات ذكية متاحة', 'Smart updates available', lang)}
            description={t('لديك 3 توصيات جديدة من المساعد الذكي لتحسين الأداء التشغيلي', 'You have 3 new AI recommendations to improve operational performance', lang)}
            descriptionAr={t('لديك 3 توصيات جديدة من المساعد الذكي لتحسين الأداء التشغيلي', 'You have 3 new AI recommendations to improve operational performance', lang)}
            dismissible
            lang={lang}
          />
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            [1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" height={140} />)
          ) : (
            kpis.map((kpi, i) => (
              <KPIWidget key={i} {...kpi} lang={lang} />
            ))
          )}
        </div>

        {/* View tabs */}
        <div className="mb-4">
          <Tabs
            items={[
              { id: 'overview', labelAr: t('النظرة العامة', 'Overview', lang), labelEn: 'Overview', icon: LayoutDashboard },
              { id: 'finance', labelAr: t('المالية', 'Finance', lang), labelEn: 'Finance', icon: DollarSign },
              { id: 'programs', labelAr: t('البرامج', 'Programs', lang), labelEn: 'Programs', icon: Target },
              { id: 'operations', labelAr: t('العمليات', 'Operations', lang), labelEn: 'Operations', icon: Activity },
            ]}
            activeTab={activeView}
            onChange={v => setActiveView(v as any)}
            variant="pill"
            lang={lang}
          />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main charts */}
          <div className="lg:col-span-2 space-y-4">
            {/* Performance trend */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('اتجاه الأداء', 'Performance Trend', lang)}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">
                    {t('آخر 12 شهراً', 'Last 12 months', lang)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm" lang={lang} icon={<TrendingUp />}>
                    +18.4%
                  </Badge>
                </div>
              </div>
              <PerformanceChart lang={lang} />
            </div>

            {/* Recent activity */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {t('النشاط الأخير', 'Recent Activity', lang)}
                </h3>
                <button className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                  {t('عرض الكل', 'View all', lang)}
                </button>
              </div>
              <ActivityList lang={lang} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-sm font-black">{t('إجراءات سريعة', 'Quick Actions', lang)}</h3>
              </div>
              <div className="space-y-2">
                {[
                  { icon: Target, label: t('برنامج جديد', 'New Program', lang), workspace: 'programs' },
                  { icon: Users, label: t('إضافة مستفيد', 'Add Beneficiary', lang), workspace: 'beneficiaries' },
                  { icon: DollarSign, label: t('تحصيل إيراد', 'Collect Revenue', lang), workspace: 'finance' },
                  { icon: Briefcase, label: t('مشروع جديد', 'New Project', lang), workspace: 'projects' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigate(action.workspace)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-start flex items-center gap-3 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black flex-1">{action.label}</span>
                    {lang === 'ar' ? (
                      <ArrowUpRight className="w-3.5 h-3.5 -rotate-90 group-hover:-translate-x-1 transition-transform" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* System health */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">
                {t('صحة النظام', 'System Health', lang)}
              </h3>
              <div className="space-y-3">
                {[
                  { labelAr: t('قاعدة البيانات', 'Database', lang), labelEn: 'Database', value: 98, status: 'success' as const, icon: Cpu },
                  { labelAr: t('الخدمات API', 'API Services', lang), labelEn: 'API Services', value: 95, status: 'success' as const, icon: Activity },
                  { labelAr: t('التخزين', 'Storage', lang), labelEn: 'Storage', value: 67, status: 'warning' as const, icon: Globe },
                  { labelAr: t('المستخدمون النشطون', 'Active Users', lang), labelEn: 'Active Users', value: 82, status: 'success' as const, icon: Users },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-bold">
                        <m.icon className="w-3 h-3 text-emerald-600" />
                        {lang === 'ar' ? m.labelAr : m.labelEn}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">{m.value}%</span>
                    </div>
                    <ProgressBar value={m.value} status={m.status} size="sm" lang={lang} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const KPIWidget: React.FC<{
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  tone: 'emerald' | 'amber' | 'sky' | 'rose';
  sparkline: number[];
  prefix?: string;
  suffix?: string;
  lang: Lang;
}> = ({ title, value, change, trend, icon: Icon, tone, sparkline, prefix, suffix, lang }) => {
  const animatedValue = useCountUp(value);
  const formatValue = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v.toLocaleString();
  };

  const toneClasses = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400' },
    sky: { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-600 dark:text-sky-400' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400' },
  }[tone];

  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Background decoration */}
      <div className={`absolute -top-8 -end-8 w-24 h-24 rounded-full ${toneClasses.bg} blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${toneClasses.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${toneClasses.text}`} />
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
            trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        </div>

        <div className="text-2xl font-black text-slate-900 dark:text-white mb-1 tabular-nums">
          {prefix}{formatValue(animatedValue)}{suffix}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-bold">
          {title}
        </div>

        {/* Mini sparkline */}
        <div className="mt-3 h-8 flex items-end gap-0.5">
          {sparkline.map((v, i) => {
            const max = Math.max(...sparkline);
            const height = (v / max) * 100;
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm ${toneClasses.text.replace('text-', 'bg-')} opacity-${30 + i * 7}`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const PerformanceChart: React.FC<{ lang: Lang }> = ({ lang }) => {
  const data = useMemo(() => {
    const months = lang === 'ar'
      ? ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const values = [65, 72, 68, 78, 82, 79, 88, 92, 87, 95, 98, 102];
    return months.map((m, i) => ({ label: m, value: values[i] }));
  }, [lang]);

  const max = Math.max(...data.map(d => d.value));

  return (
    <div className="h-48 flex items-end gap-1.5">
      {data.map((d, i) => {
        const height = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md group-hover:from-emerald-400 group-hover:to-amber-400 transition-all cursor-pointer relative"
                style={{ height: `${height}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded transition-opacity">
                  {d.value}
                </div>
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-500">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const ActivityList: React.FC<{ lang: Lang }> = ({ lang }) => {
  const activities = [
    { icon: CheckCircle2, color: 'emerald', text: t('تم اعتماد مشروع "إغاثة الشتاء"', 'Winter Relief project approved', lang), time: '2 ' + t('د', 'm', lang) },
    { icon: Users, color: 'sky', text: t('+128 مستفيد جديد مسجل', '+128 new beneficiaries registered', lang), time: '15 ' + t('د', 'm', lang) },
    { icon: DollarSign, color: 'amber', text: t('تم تحصيل دفعة $45,000', 'Received payment of $45,000', lang), time: '1 ' + t('س', 'h', lang) },
    { icon: AlertTriangle, color: 'rose', text: t('مخاطرة عالية في مخيم أبين', 'High risk in Abian camp', lang), time: '3 ' + t('س', 'h', lang) },
  ];

  const colorMap = {
    emerald: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600',
    sky: 'bg-sky-100 dark:bg-sky-950/30 text-sky-600',
    amber: 'bg-amber-100 dark:bg-amber-950/30 text-amber-600',
    rose: 'bg-rose-100 dark:bg-rose-950/30 text-rose-600',
  };

  return (
    <div className="space-y-3">
      {activities.map((a, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
          <div className={`w-8 h-8 rounded-lg ${colorMap[a.color as keyof typeof colorMap]} flex items-center justify-center flex-shrink-0`}>
            <a.icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate">{a.text}</p>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold flex-shrink-0">{a.time}</span>
        </div>
      ))}
    </div>
  );
};

const UAMEXHeader: React.FC<{
  lang: Lang;
  theme: Theme;
  user?: { id: string; name: string; role: string };
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
}> = ({ lang, theme, user, onToggleLang, onToggleTheme, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/UAMEX_ERPLOGO.png" alt="UAMEX" className="h-9 w-9 object-contain" />
          <div className="hidden sm:block">
            <div className="text-sm font-black text-slate-900 dark:text-white">UAMEX ERP™</div>
            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wider uppercase">One Platform · One Vision</div>
          </div>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-3.5 h-3.5 text-slate-400" />
            <input
              type="search"
              placeholder={t('بحث ذكي...', 'Smart search...', lang)}
              className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 text-xs outline-none transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors relative" aria-label="Notifications">
            <Bell className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
            <span className="absolute top-1 end-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {/* User */}
          <div className="flex items-center gap-2 ps-2 border-s border-slate-200 dark:border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white text-xs font-black">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <div className="text-[11px] font-black text-slate-900 dark:text-white">{user?.name || 'User'}</div>
              <div className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider">{user?.role || 'guest'}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default UAMEXDashboardExperience;
