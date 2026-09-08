import React, { useState, useCallback, useMemo } from 'react';
import {
  BookOpen, FileText, Search, Filter, Plus, Download, Printer,
  Folder, FolderOpen, ChevronRight, ChevronDown, Clock, User,
  Tag, Eye, Edit3, Trash2, ExternalLink, Lock, Unlock, Star,
  Grid, List, SortAsc, SortDesc, Archive, AlertCircle, CheckCircle2,
  Globe, Shield, Scale, BookMarked, Lightbulb, Zap
} from 'lucide-react';
import { EnterpriseButton } from './common/EnterpriseButton';
import { Spinner } from '../design-system/components/Spinner';
import { EmptyState } from '../design-system/components/EmptyState';
import { ErrorState } from '../design-system/components/ErrorState';

type DocLang = 'ar' | 'en';
type ViewMode = 'grid' | 'list';
type SortBy = 'title' | 'date' | 'category' | 'status';

interface Document {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  category: string;
  type: 'policy' | 'procedure' | 'guideline' | 'template' | 'report' | 'form';
  status: 'draft' | 'review' | 'approved' | 'archived';
  version: string;
  author: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  is_public: boolean;
  file_url?: string;
  language: 'ar' | 'en' | 'bilingual';
}

interface DocumentationViewProps {
  lang?: DocLang;
}

const t = (ar: string, en: string, lang: DocLang) => lang === 'ar' ? ar : en;

const DOC_CATEGORIES = [
  { id: 'all', icon: BookOpen, ar: 'الكل', en: 'All' },
  { id: 'policies', icon: Shield, ar: 'السياسات', en: 'Policies' },
  { id: 'procedures', icon: Zap, ar: 'الإجراءات', en: 'Procedures' },
  { id: 'guidelines', icon: Lightbulb, ar: 'الإرشادات', en: 'Guidelines' },
  { id: 'templates', icon: FileText, ar: 'القوالب', en: 'Templates' },
  { id: 'reports', icon: BookMarked, ar: 'التقارير', en: 'Reports' },
  { id: 'forms', icon: Edit3, ar: 'النماذج', en: 'Forms' },
  { id: 'legal', icon: Scale, ar: 'القانونية', en: 'Legal' },
];

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  policy: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  procedure: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  guideline: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  template: { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  report: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  form: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  draft: { color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800', icon: Edit3 },
  review: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
  approved: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle2 },
  archived: { color: 'text-slate-500 dark:text-zinc-500', bg: 'bg-slate-100 dark:bg-zinc-800', icon: Archive },
};

const generateMockDocs = (): Document[] => [
  { id: '1', title_ar: 'سياسة حماية البيانات الشخصية', title_en: 'Personal Data Protection Policy', description_ar: 'سياسة شاملة لحماية البيانات الشخصية للموظفين والمستفيدين', description_en: 'Comprehensive policy for protecting personal data of employees and beneficiaries', category: 'policies', type: 'policy', status: 'approved', version: '2.1', author: 'إدارة القانونية', created_at: '2024-01-15', updated_at: '2024-06-20', tags: ['data', 'privacy', 'GDPR'], is_public: true, language: 'bilingual' },
  { id: '2', title_ar: 'إجراءات الشراء والمناقصات', title_en: 'Procurement & Tender Procedures', description_ar: 'دليل شامل لإجراءات الشراء والمناقصات المتوافقة مع المعايير الدولية', description_en: 'Comprehensive guide for procurement and tender procedures aligned with international standards', category: 'procedures', type: 'procedure', status: 'approved', version: '3.0', author: 'قسم المشتريات', created_at: '2024-02-10', updated_at: '2024-07-15', tags: ['procurement', 'tenders', 'compliance'], is_public: true, language: 'bilingual' },
  { id: '3', title_ar: 'إرشادات تقييم الأثر', title_en: 'Impact Assessment Guidelines', description_ar: 'إرشادات لتنفيذ تقييمات الأثر في المشاريع الإنسانية', description_en: 'Guidelines for conducting impact assessments in humanitarian projects', category: 'guidelines', type: 'guideline', status: 'review', version: '1.2', author: 'قسم المتابعة', created_at: '2024-03-05', updated_at: '2024-08-01', tags: ['impact', 'M&E', 'humanitarian'], is_public: true, language: 'en' },
  { id: '4', title_ar: 'قالب تقرير الميزانية', title_en: 'Budget Report Template', description_ar: 'قالب موحد لإعداد تقارير الميزانية الشهرية والربع سنوية', description_en: 'Unified template for monthly and quarterly budget reports', category: 'templates', type: 'template', status: 'approved', version: '1.0', author: 'الإدارة المالية', created_at: '2024-01-20', updated_at: '2024-05-10', tags: ['budget', 'template', 'finance'], is_public: true, language: 'ar' },
  { id: '5', title_ar: 'تقرير الأثر السنوي 2024', title_en: 'Annual Impact Report 2024', description_ar: 'التقرير السنوي الشامل لأثر البرامج والمشاريع', description_en: 'Comprehensive annual report on program and project impact', category: 'reports', type: 'report', status: 'draft', version: '0.9', author: 'قسم الذكاء', created_at: '2024-06-01', updated_at: '2024-09-01', tags: ['impact', 'annual', 'report'], is_public: false, language: 'bilingual' },
  { id: '6', title_ar: 'نموذج طلب الشراء', title_en: 'Purchase Request Form', description_ar: 'نموذج إلكتروني لطلب المشتريات مع سير عمل الموافقات', description_en: 'Electronic purchase request form with approval workflow', category: 'forms', type: 'form', status: 'approved', version: '2.0', author: 'قسم المشتريات', created_at: '2024-02-28', updated_at: '2024-07-20', tags: ['purchase', 'form', 'procurement'], is_public: true, language: 'ar' },
  { id: '7', title_ar: 'سياسة الموارد البشرية', title_en: 'Human Resources Policy', description_ar: 'السياسات والإجراءات المتعلقة بالموارد البشرية والتوظيف', description_en: 'Policies and procedures related to human resources and recruitment', category: 'policies', type: 'policy', status: 'approved', version: '4.1', author: 'إدارة الموارد البشرية', created_at: '2023-11-01', updated_at: '2024-08-15', tags: ['HR', 'policy', 'recruitment'], is_public: true, language: 'bilingual' },
  { id: '8', title_ar: 'دليل السلامة المهنية', title_en: 'Occupational Safety Guide', description_ar: 'إرشادات السلامة والصحة المهنية في بيئة العمل', description_en: 'Occupational safety and health guidelines in the workplace', category: 'guidelines', type: 'guideline', status: 'approved', version: '1.5', author: 'إدارة السلامة', created_at: '2024-01-10', updated_at: '2024-06-05', tags: ['safety', 'health', 'workplace'], is_public: true, language: 'bilingual' },
];

export function DocumentationView({ lang = 'en' }: DocumentationViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const docs = useMemo(() => generateMockDocs(), []);

  const filteredDocs = useMemo(() => {
    let result = docs;
    if (selectedCategory !== 'all') {
      result = result.filter(d => d.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.title_ar.toLowerCase().includes(q) ||
        d.title_en.toLowerCase().includes(q) ||
        d.description_ar.toLowerCase().includes(q) ||
        d.description_en.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      const modifier = sortDesc ? -1 : 1;
      switch (sortBy) {
        case 'title': return modifier * (lang === 'ar' ? a.title_ar : a.title_en).localeCompare(lang === 'ar' ? b.title_ar : b.title_en);
        case 'date': return modifier * new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'category': return modifier * a.category.localeCompare(b.category);
        case 'status': return modifier * a.status.localeCompare(b.status);
        default: return 0;
      }
    });
    return result;
  }, [docs, searchQuery, selectedCategory, sortBy, sortDesc, lang]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: docs.length };
    docs.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
    return counts;
  }, [docs]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <BookOpen className="w-7 h-7 text-emerald-500" />
              </div>
              {t('المستندات والإرشادات', 'Documentation & Guidelines', lang)}
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              {t(`${filteredDocs.length} مستند متاح`, `${filteredDocs.length} documents available`, lang)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <EnterpriseButton variant="ghost" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              {t('طباعة', 'Print', lang)}
            </EnterpriseButton>
            <EnterpriseButton variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
              {t('تصدير', 'Export', lang)}
            </EnterpriseButton>
            <EnterpriseButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              {t('مستند جديد', 'New Document', lang)}
            </EnterpriseButton>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('بحث في المستندات...', 'Search documents...', lang)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-sm"
              >
                <option value="date">{t('التاريخ', 'Date', lang)}</option>
                <option value="title">{t('العنوان', 'Title', lang)}</option>
                <option value="category">{t('الفئة', 'Category', lang)}</option>
                <option value="status">{t('الحالة', 'Status', lang)}</option>
              </select>
              <button onClick={() => setSortDesc(!sortDesc)} className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800">
                {sortDesc ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
              </button>
              <div className="flex rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`p-2.5 ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-zinc-800'}`}>
                  <Grid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-zinc-800'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DOC_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat[lang]}
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/10 text-[10px]">{categoryCounts[cat.id] || 0}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Grid/List */}
        {filteredDocs.length === 0 ? (
          <EmptyState
            variant="search"
            title={t('لا توجد نتائج', 'No results found', lang)}
            lang={lang}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800"
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => {
              const typeConfig = TYPE_CONFIG[doc.type] || TYPE_CONFIG.policy;
              const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
              const StatusIcon = statusConfig.icon;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="group bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${typeConfig.bg} ${typeConfig.color}`}>
                      {t(DOC_CATEGORIES.find(c => c.id === doc.category)?.ar || doc.category, doc.category, lang)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {t(doc.status === 'draft' ? 'مسودة' : doc.status === 'review' ? 'مراجعة' : doc.status === 'approved' ? 'معتمد' : 'أرشيف', doc.status, lang)}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {lang === 'ar' ? doc.title_ar : doc.title_en}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-3">
                    {lang === 'ar' ? doc.description_ar : doc.description_en}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] text-slate-500 dark:text-zinc-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {doc.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {doc.updated_at}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">v{doc.version}</span>
                    <div className="flex items-center gap-1">
                      {doc.is_public ? <Globe className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3 text-amber-500" />}
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">{doc.language}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-zinc-400">{t('العنوان', 'Title', lang)}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 hidden md:table-cell">{t('الفئة', 'Category', lang)}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 hidden lg:table-cell">{t('الحالة', 'Status', lang)}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 hidden lg:table-cell">{t('الإصدار', 'Version', lang)}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 hidden xl:table-cell">{t('آخر تحديث', 'Updated', lang)}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 dark:text-zinc-400">{t('إجراءات', 'Actions', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => {
                  const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={doc.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{lang === 'ar' ? doc.title_ar : doc.title_en}</p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{doc.author}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-600 dark:text-zinc-400">{t(DOC_CATEGORIES.find(c => c.id === doc.category)?.ar || '', doc.category, lang)}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {t(doc.status === 'draft' ? 'مسودة' : doc.status === 'review' ? 'مراجعة' : doc.status === 'approved' ? 'معتمد' : 'أرشيف', doc.status, lang)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500 dark:text-zinc-400">v{doc.version}</td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-slate-400 dark:text-zinc-500">{doc.updated_at}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"><Eye className="w-3.5 h-3.5 text-slate-400" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"><Edit3 className="w-3.5 h-3.5 text-slate-400" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"><Download className="w-3.5 h-3.5 text-slate-400" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('إجمالي المستندات', 'Total Documents', lang), value: docs.length, color: 'text-emerald-500' },
            { label: t('المعتمدة', 'Approved', lang), value: docs.filter(d => d.status === 'approved').length, color: 'text-blue-500' },
            { label: t('قيد المراجعة', 'In Review', lang), value: docs.filter(d => d.status === 'review').length, color: 'text-amber-500' },
            { label: t('المسودات', 'Drafts', lang), value: docs.filter(d => d.status === 'draft').length, color: 'text-slate-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DocumentationView;
