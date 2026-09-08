import React, { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Download, Printer,
  FileText, Filter, RefreshCw, Eye, Plus,
  Clock, CheckCircle2, ArrowUpRight, ArrowDownRight,
  DollarSign, Users, Target, Activity, Layers, Globe
} from 'lucide-react';
import { EnterpriseButton } from './common/EnterpriseButton';

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

const generateMockReports = (): ReportCard[] => [
  { id: 'r1', title_ar: 'تقرير الميزانية الشهرية', title_en: 'Monthly Budget Report', description_ar: 'ملخص شامل للمصروفات والإيرادات الشهرية', description_en: 'Comprehensive summary of monthly expenses and revenue', category: 'financial', status: 'ready', last_generated: '2024-09-01', frequency: 'monthly', format: ['PDF', 'Excel'], size: '2.4 MB' },
  { id: 'r2', title_ar: 'تقرير الأثر الميداني', title_en: 'Field Impact Report', description_ar: 'تقييم شامل لأثر المشاريع على المجتمعات المستهدفة', description_en: 'Comprehensive assessment of project impact on target communities', category: 'impact', status: 'ready', last_generated: '2024-08-15', frequency: 'quarterly', format: ['PDF', 'Word'], size: '5.1 MB' },
  { id: 'r3', title_ar: 'تقرير الامتثال القانوني', title_en: 'Legal Compliance Report', description_ar: 'حالة الامتثال للأنظمة واللوائح الداخلية والخارجية', description_en: 'Compliance status with internal and external regulations', category: 'compliance', status: 'generating', last_generated: '2024-09-05', frequency: 'monthly', format: ['PDF'] },
  { id: 'r4', title_ar: 'تقرير الموارد البشرية', title_en: 'HR Analytics Report', description_ar: 'تحليل شامل لأداء و….. الموارد البشرية', description_en: 'Comprehensive analysis of HR performance and metrics', category: 'hr', status: 'ready', last_generated: '2024-09-01', frequency: 'monthly', format: ['PDF', 'Excel'], size: '1.8 MB' },
  { id: 'r5', title_ar: 'تقرير تقدم المشاريع', title_en: 'Project Progress Report', description_ar: 'حالة جميع المشاريع الجارية ومدى التقدم', description_en: 'Status of all ongoing projects and progress', category: 'project', status: 'scheduled', last_generated: '2024-08-30', frequency: 'weekly', format: ['PDF'] },
  { id: 'r6', title_ar: 'تقرير الذكاء المالي', title_en: 'Financial BI Dashboard', description_ar: 'لوحات الذكاء المالي التفاعلية مع التحليلات التنبؤية', description_en: 'Interactive financial BI dashboards with predictive analytics', category: 'financial', status: 'ready', last_generated: '2024-09-07', frequency: 'daily', format: ['PDF', 'Excel', 'PowerBI'], size: '3.2 MB' },
];

const generateKPIs = (lang: ReportLang): KPICard[] => [
  { label_ar: 'إجمالي الإيرادات', label_en: 'Total Revenue', value: '$2.4M', change: 12.5, icon: DollarSign, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { label_ar: 'المستفيدين', label_en: 'Beneficiaries', value: '14,523', change: 8.3, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { label_ar: 'المشاريع النشطة', label_en: 'Active Projects', value: '47', change: 3, icon: Target, color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
  { label_ar: 'نسبة الإنجاز', label_en: 'Completion Rate', value: '87%', change: 5.2, icon: TrendingUp, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { label_ar: 'الصحة المالية', label_en: 'Financial Health', value: '92%', change: 2.1, icon: Activity, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
  { label_ar: 'معدل الالتزام', label_en: 'Compliance Rate', value: '98%', change: 0.5, icon: CheckCircle2, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
];

export function ReportsView({ lang = 'en' }: { lang?: ReportLang }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const reports = useMemo(() => generateMockReports(), []);
  const kpis = useMemo(() => generateKPIs(lang), [lang]);

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
          </div>
          <div className="flex items-center gap-2">
            <EnterpriseButton variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />}>{t('تحديث', 'Refresh', lang)}</EnterpriseButton>
            <EnterpriseButton variant="ghost" size="sm" icon={<Printer className="w-4 h-4" />}>{t('طباعة', 'Print', lang)}</EnterpriseButton>
            <EnterpriseButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>{t('تقرير جديد', 'New Report', lang)}</EnterpriseButton>
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

        {/* Reports Grid */}
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
                  <EnterpriseButton variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} className="flex-1">{t('عرض', 'View', lang)}</EnterpriseButton>
                  <EnterpriseButton variant="primary" size="sm" icon={<Download className="w-4 h-4" />} className="flex-1">{t('تحميل', 'Download', lang)}</EnterpriseButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ReportsView;
