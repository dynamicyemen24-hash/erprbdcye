import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, RefreshCw, AlertTriangle, Ban, Info, Clock,
  Users, BarChart3, TrendingUp, Eye, ChevronDown, ChevronRight,
  Activity, ShieldAlert, ShieldCheck, Globe
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface PolicyDashboardProps {
  lang: 'ar' | 'en';
}

interface ViolationByDomain {
  domain: string;
  totalViolations: number;
  blockCount: number;
  warnCount: number;
  lastViolationAt: string;
}

interface RecentViolation {
  id: string;
  action: string;
  userId: string;
  domain: string;
  actionType: string;
  blockCount: number;
  warnCount: number;
  violations: any[];
  environmentMode: string;
  createdAt: string;
}

interface TopViolator {
  userId: string;
  violationCount: number;
  blocks: number;
  lastViolationAt: string;
}

interface TrendPoint {
  date: string;
  violations: number;
}

interface DashboardData {
  status: string;
  period: { days: number; since: string };
  summary: {
    totalViolations: number;
    totalBlocks: number;
    totalWarns: number;
    uniqueDomains: number;
    activeViolators: number;
  };
  byDomain: ViolationByDomain[];
  recentViolations: RecentViolation[];
  topViolators: TopViolator[];
  trend: TrendPoint[];
}

const DOMAIN_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  finance: { ar: 'المالية', en: 'Finance', color: '#059669' },
  transactions: { ar: 'المعاملات', en: 'Transactions', color: '#10b981' },
  beneficiaries: { ar: 'المستفيدون', en: 'Beneficiaries', color: '#3b82f6' },
  activities: { ar: 'الأنشطة', en: 'Activities', color: '#8b5cf6' },
  sponsorships: { ar: 'الرعاية', en: 'Sponsorships', color: '#f59e0b' },
  disbursements: { ar: 'الصرف', en: 'Disbursements', color: '#ef4444' },
  projects: { ar: 'المشاريع', en: 'Projects', color: '#06b6d4' },
  donors: { ar: 'المانحون', en: 'Donors', color: '#ec4899' },
  procurement: { ar: 'المشتريات', en: 'Procurement', color: '#f97316' },
  hr: { ar: 'الموارد البشرية', en: 'HR', color: '#14b8a6' },
  audit: { ar: 'التدقيق', en: 'Audit', color: '#6366f1' },
  field_sync: { ar: 'المزامنة الميدانية', en: 'Field Sync', color: '#84cc16' },
};

export function PolicyDashboardView({ lang }: PolicyDashboardProps) {
  const isRtl = lang === 'ar';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/policies/dashboard?days=${days}`, {
        headers: { 'x-environment-mode': localStorage.getItem('nexora_environment_mode') || 'production' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const getDomainLabel = (domain: string) => {
    const labels = DOMAIN_LABELS[domain];
    if (!labels) return domain;
    return isRtl ? labels.ar : labels.en;
  };

  const getDomainColor = (domain: string) => {
    return DOMAIN_LABELS[domain]?.color || '#6b7280';
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', { month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
        <span className="ml-2 text-sm text-slate-500 dark:text-zinc-400">
          {isRtl ? 'جاري تحميل لوحة السياسات...' : 'Loading policy dashboard...'}
        </span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>
        <button onClick={fetchDashboard} className="mt-3 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition">
          {isRtl ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  const d = data!;

  const domainChartData = d.byDomain.map(r => ({
    name: getDomainLabel(r.domain),
    violations: r.totalViolations,
    blocks: r.blockCount,
    warns: r.warnCount,
    fill: getDomainColor(r.domain),
  }));

  const trendChartData = [...d.trend].reverse().map(t => ({
    date: formatShortDate(t.date),
    violations: t.violations,
  }));

  const summaryCards = [
    {
      label: isRtl ? 'إجمالي المخالفات' : 'Total Violations',
      value: d.summary.totalViolations,
      icon: <AlertTriangle className="w-4 h-4" />,
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: isRtl ? 'محظور' : 'Blocked',
      value: d.summary.totalBlocks,
      icon: <Ban className="w-4 h-4" />,
      bgClass: 'bg-red-500/10',
      textClass: 'text-red-600 dark:text-red-400',
    },
    {
      label: isRtl ? 'تحذيرات' : 'Warnings',
      value: d.summary.totalWarns,
      icon: <Info className="w-4 h-4" />,
      bgClass: 'bg-yellow-500/10',
      textClass: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: isRtl ? 'النطاقات النشطة' : 'Active Domains',
      value: d.summary.uniqueDomains,
      icon: <Globe className="w-4 h-4" />,
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: isRtl ? 'مخالفون نشطون' : 'Active Violators',
      value: d.summary.activeViolators,
      icon: <Users className="w-4 h-4" />,
      bgClass: 'bg-purple-500/10',
      textClass: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
              {isRtl ? 'لوحة مراقبة السياسات' : 'Policy Enforcement Dashboard'}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              {isRtl ? 'إحصائيات المخالفات ونفاذ السياسات' : 'Violation statistics and policy enforcement'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="text-[10px] bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-slate-700 dark:text-zinc-300 outline-none focus:border-emerald-500"
          >
            <option value={7}>{isRtl ? '7 أيام' : '7 Days'}</option>
            <option value={14}>{isRtl ? '14 يوم' : '14 Days'}</option>
            <option value={30}>{isRtl ? '30 يوم' : '30 Days'}</option>
            <option value={90}>{isRtl ? '90 يوم' : '90 Days'}</option>
          </select>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
            <div className={`flex items-center gap-1.5 mb-1.5 ${card.textClass}`}>
              {card.icon}
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">{card.label}</span>
            </div>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white">
              {card.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            {isRtl ? 'المخالفات حسب النطاق' : 'Violations by Domain'}
          </h4>
          {domainChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={domainChartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                <ReTooltip
                  contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="violations" fill="#059669" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-xs text-slate-400 dark:text-zinc-500">
              <ShieldCheck className="w-5 h-5 mr-1.5" />
              {isRtl ? 'لا توجد مخالفات' : 'No violations'}
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            {isRtl ? 'المخالفات خلال 14 يوم' : '14-Day Violation Trend'}
          </h4>
          {trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendChartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ReTooltip
                  contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="violations"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-xs text-slate-400 dark:text-zinc-500">
              <TrendingUp className="w-5 h-5 mr-1.5" />
              {isRtl ? 'لا توجد بيانات اتجاه' : 'No trend data'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-500" />
            {isRtl ? 'أكثر المخالفين' : 'Top Violators'}
          </h4>
          {d.topViolators.length > 0 ? (
            <div className="space-y-2">
              {d.topViolators.map((v, i) => (
                <div key={v.userId || i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 w-4">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate">
                      {v.userId?.slice(0, 8) || 'System'}
                    </p>
                    <p className="text-[9px] text-slate-400 dark:text-zinc-500">
                      <Clock className="inline w-2.5 h-2.5 mr-0.5" />
                      {formatDate(v.lastViolationAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-slate-800 dark:text-white">{v.violationCount}</span>
                    {v.blocks > 0 && (
                      <span className="ml-1 text-[9px] font-bold text-red-500">
                        ({v.blocks} {isRtl ? 'محظور' : 'blk'})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-xs text-slate-400 dark:text-zinc-500">
              {isRtl ? 'لا يوجد مخالفون' : 'No violators'}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            {isRtl ? 'أخリー المخالفات' : 'Recent Violations'}
          </h4>
          {d.recentViolations.length > 0 ? (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
              {d.recentViolations.map((v) => (
                <div
                  key={v.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                  onClick={() => setExpandedViolation(expandedViolation === v.id ? null : v.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedViolation === v.id ? (
                      <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-extrabold text-white shrink-0"
                      style={{ backgroundColor: v.blockCount > 0 ? '#ef4444' : '#f59e0b' }}
                    >
                      {v.blockCount > 0 ? 'BLOCK' : 'WARN'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                      {getDomainLabel(v.domain)}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                      {v.actionType}
                    </span>
                    <span className="ml-auto text-[9px] text-slate-400 dark:text-zinc-500 shrink-0">
                      {formatDate(v.createdAt)}
                    </span>
                  </div>
                  {expandedViolation === v.id && v.violations && (
                    <div className="mt-2 ml-5 space-y-1">
                      {v.violations.map((vi: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span
                            className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: vi.severity === 'BLOCK' ? '#ef4444' : vi.severity === 'WARN' ? '#f59e0b' : '#3b82f6' }}
                          />
                          <span className="text-[9px] text-slate-600 dark:text-zinc-400">
                            {vi.messageEn}
                          </span>
                        </div>
                      ))}
                      {v.environmentMode && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
                          {v.environmentMode === 'training' ? 'TRAINING' : 'PRODUCTION'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-xs text-slate-400 dark:text-zinc-500">
              <ShieldCheck className="w-5 h-5 mr-1.5" />
              {isRtl ? 'لا توجد مخالفات حديثة' : 'No recent violations'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
