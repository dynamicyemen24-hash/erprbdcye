import React, { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Download, Printer,
  FileText, Filter, RefreshCw, Eye, Plus,
  Clock, CheckCircle2, ArrowUpRight, ArrowDownRight,
  DollarSign, Users, Target, Activity, Layers, Globe
} from 'lucide-react';
import { EnterpriseButton } from './common/EnterpriseButton';
import InstitutionalReportHeader, { type InstitutionalHeaderData } from './InstitutionalReportHeader';
import { InstitutionalReportViewer } from './InstitutionalReportViewer';
import {
  useConsolidatedKpis,
  useExecutiveBrief,
  mapConsolidatedToKpiCards,
  buildLiveReportCards,
  type DataSource,
} from '../shared/hooks/useInstitutionalReports';
import { REPORT_WORKSPACE_REGISTRY } from '../config/reportWorkspaceRegistry';
import { WORKSPACE_OPERATIONAL_MAP } from '../config/workspaceRegistry';

type ReportLang = 'ar' | 'en';

interface ReportCard {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  category: 'financial' | 'operational' | 'impact' | 'compliance' | 'hr' | 'project';
  status: 'ready' | 'generating' | 'scheduled' | 'failed';
  last_generated: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  format: string[];
  size?: string;
}

interface KPICard {
  label_ar: string;
  label_en: string;
  value: string;
  change: number;
  icon: any;
  color: string;
  bgColor: string;
}

const t = (ar: string, en: string, lang: ReportLang) => lang === 'ar' ? ar : en;

const REPORT_CATEGORIES = [
  { id: 'all', ar: 'الكل', en: 'All', icon: Layers },
  { id: 'financial', ar: 'المالية', en: 'Financial', icon: DollarSign },
  { id: 'operational', ar: 'التشغيلية', en: 'Operational', icon: Activity },
  { id: 'impact', ar: 'الأثر', en: 'Impact', icon: Target },
  { id: 'compliance', ar: 'الامتثال', en: 'Compliance', icon: CheckCircle2 },
  { id: 'hr', ar: 'الموارد البشرية', en: 'HR', icon: Users },
  { id: 'project', ar: 'المشاريع', en: 'Projects', icon: Globe },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label_ar: string; label_en: string }> = {
  ready: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label_ar: 'جاهز', label_en: 'Ready' },
  generating: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', label_ar: 'قيد الإنشاء', label_en: 'Generating' },
  scheduled: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', label_ar: 'مجدول', label_en: 'Scheduled' },
  failed: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', label_ar: 'فشل', label_en: 'Failed' },
};

/**
 * HONESTY (DEBT PAID): no fabricated ledgers.
 * Empty DB stays empty — screens report unknown/zero instead of invented
 * $2.4M / 14,523 / 47 fallbacks. Live institutional reports are the only source.
 */
function buildHonestKpis(
  lang: ReportLang,
  projects: Array<{ progress_percent?: number; status_code?: string }>,
  beneficiaries: unknown[],
): KPICard[] {
  const base = (label_ar: string, label_en: string, icon: any, color: string, bgColor: string): KPICard => ({
    label_ar, label_en, value: '—', change: 0, icon, color, bgColor,
  });
  const cards = [
    base('إجمالي الإيرادات', 'Total Revenue', DollarSign, 'text-emerald-500', 'bg-emerald-500/10'),
    base('المستفيدين', 'Beneficiaries', Users, 'text-blue-500', 'bg-blue-500/10'),
    base('المشاريع النشطة', 'Active Projects', Target, 'text-violet-500', 'bg-violet-500/10'),
    base('نسبة الإنجاز', 'Completion Rate', TrendingUp, 'text-amber-500', 'bg-amber-500/10'),
    base('الصحة المالية', 'Financial Health', Activity, 'text-rose-500', 'bg-rose-500/10'),
    base('معدل الالتزام', 'Compliance Rate', CheckCircle2, 'text-cyan-500', 'bg-cyan-500/10'),
  ];
  if (beneficiaries.length > 0) cards[1] = { ...cards[1], value: String(beneficiaries.length) };
  if (projects.length > 0) {
    const active = projects.filter((p) => p?.status_code === 'ACTIVE').length;
    cards[2] = { ...cards[2], value: String(active) };
  }
  void lang;
  return cards;
}

export interface ReportsViewProps {
  lang?: ReportLang;
  programs?: unknown[];
  projects?: Array<{ progress_percent?: number; status_code?: string }>;
  beneficiaries?: unknown[];
  sponsorships?: unknown[];
  currencies?: unknown[];
  activities?: unknown[];
  organizations?: unknown[];
  onNavigate?: (tab: string) => void;
}

export function ReportsView({ lang = 'en', projects = [], beneficiaries = [], onNavigate }: ReportsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const liveKpis = useConsolidatedKpis();
  const brief = useExecutiveBrief();

  const reports = useMemo(() => {
    if (liveKpis.data || brief.data) return buildLiveReportCards(brief.data);
    return [] as ReportCard[];
  }, [liveKpis.data, brief.data]);

  const kpis = useMemo(() => {
    if (liveKpis.data) return mapConsolidatedToKpiCards(liveKpis.data);
    return buildHonestKpis(lang, projects, beneficiaries);
  }, [lang, liveKpis.data, projects, beneficiaries]);

  const dataSource: DataSource = liveKpis.data || brief.data ? 'live' : 'fallback';
  const liveLoading = liveKpis.loading || brief.loading;
  const liveError = liveKpis.error ?? brief.error;
  const retryLive = () => {
    liveKpis.retry();
    brief.retry();
  };

  const filteredReports = useMemo(() => {
    let result = reports;
    if (selectedCategory !== 'all') result = result.filter(r => r.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.title_ar.toLowerCase().includes(q) || r.title_en.toLowerCase().includes(q));
    }
    return result;
  }, [reports, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10"><BarChart3 className="w-7 h-7 text-emerald-500" /></div>
              {t('التقارير والتحليلات', 'Reports & Analytics', lang)}
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{t(`${filteredReports.length} تقرير متاح`, `${filteredReports.length} reports available`, lang)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${dataSource === 'live' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dataSource === 'live' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {dataSource === 'live' ? t('بيانات مباشرة', 'Live data', lang) : t('وضع محلي', 'Local mode', lang)}
              </span>
              {liveLoading && <span className="text-[10px] text-slate-400">{t('جارٍ المزامنة...', 'Syncing...', lang)}</span>}
              {liveError && !liveLoading && (
                <button onClick={retryLive} className="text-[10px] font-bold text-blue-500 hover:underline">
                  {t('إعادة المحاولة', 'Retry', lang)}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <EnterpriseButton variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />}>{t('تحديث', 'Refresh', lang)}</EnterpriseButton>
            <EnterpriseButton variant="ghost" size="sm" icon={<Printer className="w-4 h-4" />}>{t('طباعة', 'Print', lang)}</EnterpriseButton>
            <EnterpriseButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>{t('تقرير جديد', 'New Report', lang)}</EnterpriseButton>
          </div>
        </div>

        {/* Institutional letterhead — live tenant header when the API is reachable */}
        {brief.data?.header ? (
          <InstitutionalReportHeader
            title={t('التقارير والتحليلات', 'Reports & Analytics', lang)}
            lang={lang}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            header={brief.data.header as InstitutionalHeaderData}
          />
        ) : null}

        {/* NEB-01..15 coverage — every operational workspace has an official printable document (SAP-style) */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              {t('تغطية النطاقات المؤسسية NEB-01..15', 'NEB-01..15 Domain Coverage', lang)}
            </h2>
            <span className="text-[10px] font-mono font-bold text-emerald-600">
              {REPORT_WORKSPACE_REGISTRY.length}/18 {t('تقريراً رسمياً مرتبطاً', 'linked official reports', lang)}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {REPORT_WORKSPACE_REGISTRY.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  if (onNavigate && (WORKSPACE_OPERATIONAL_MAP as any)[r.id]) {
                    const link = (WORKSPACE_OPERATIONAL_MAP as any)[r.id];
                    if (link?.activeTab) onNavigate(link.activeTab);
                  } else if (onNavigate) {
                    onNavigate(r.workspaceTab);
                  }
                }}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 hover:border-emerald-500/40 text-right transition-all cursor-pointer group"
                title={`${lang === 'ar' ? r.documentAr : r.documentEn} — ${r.nebCodes.join('/')}`}
              >
                <div className="text-[9px] font-mono font-black text-emerald-600">{r.nebCodes.join(' • ')}</div>
                <div className="text-[11px] font-black text-slate-800 dark:text-zinc-100 truncate">{lang === 'ar' ? r.titleAr : r.titleEn}</div>
                <div className="text-[9px] text-slate-400 truncate">{lang === 'ar' ? r.documentAr : r.documentEn}</div>
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${kpi.bgColor}`}><Icon className={`w-4 h-4 ${kpi.color}`} /></div>
                  <span className={`flex items-center gap-0.5 text-[10px] font-bold ${kpi.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {kpi.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(kpi.change)}%
                  </span>
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-zinc-100">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mt-1">{kpi[lang === 'ar' ? 'label_ar' : 'label_en']}</p>
              </div>
            );
          })}
        </div>

        {/* Search + Category Filter */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('بحث في التقارير...', 'Search reports...', lang)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {REPORT_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat[lang]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reports Grid — honest empty state (no fabricated rows) */}
        {filteredReports.length === 0 && !liveLoading && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-8 text-center">
            <FileText className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-black text-slate-700 dark:text-zinc-200">
              {t('لا توجد تقارير حية بعد', 'No live reports yet', lang)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {t('اربط قاعدة البيانات وسجل عمليات حقيقية لظهور التقارير هنا', 'Connect the database and record real operations for reports to appear', lang)}
            </p>
            {liveError && (
              <button onClick={retryLive} className="mt-3 text-[11px] font-black text-emerald-600 hover:underline cursor-pointer">
                {t('إعادة محاولة الاتصال', 'Retry connection', lang)}
              </button>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map(report => {
            const statusConfig = STATUS_CONFIG[report.status];
            return (
              <div key={report.id} className="group bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800">
                    <FileText className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                    {report.status === 'generating' && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {statusConfig[`label_${lang}` as keyof typeof statusConfig]}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {lang === 'ar' ? report.title_ar : report.title_en}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-3">
                  {lang === 'ar' ? report.description_ar : report.description_en}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  {report.format.map(f => (
                    <span key={f} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400">{f}</span>
                  ))}
                  {report.size && <span className="text-[10px] text-slate-400 dark:text-zinc-500">{report.size}</span>}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{report.last_generated}</span>
                  <span>{report.frequency}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <EnterpriseButton
                    variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} className="flex-1"
                    onClick={() => {
                      if ('endpoint' in report && typeof report.endpoint === 'string') setSelectedEndpoint(report.endpoint);
                    }}
                  >{t('عرض', 'View', lang)}</EnterpriseButton>
                  <EnterpriseButton variant="primary" size="sm" icon={<Download className="w-4 h-4" />} className="flex-1">{t('تحميل', 'Download', lang)}</EnterpriseButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedEndpoint && (
        <InstitutionalReportViewer endpoint={selectedEndpoint} lang={lang} onClose={() => setSelectedEndpoint(null)} />
      )}
    </div>
  );
}

export default ReportsView;
