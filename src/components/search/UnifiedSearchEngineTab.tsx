import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, Sparkles, Save, Trash2, Pin, Star, X, ChevronDown, ChevronUp,
  TrendingUp, Clock, Target, Database, BarChart3, Filter, Layers,
  Activity, Users, Briefcase, DollarSign, FileText, Award, Heart, Truck,
  Building, BookOpen, Zap, Eye, History, Bookmark, Lightbulb, Globe
} from 'lucide-react';
import { Spinner } from '../../design-system/components/Spinner';

// ─── Types ───────────────────────────────────────────────

type SearchableDomain =
  | 'project' | 'program' | 'activity' | 'task'
  | 'beneficiary' | 'sponsorship' | 'service_delivery'
  | 'volunteer' | 'donor' | 'grant' | 'proposal'
  | 'staff' | 'asset' | 'inventory' | 'warehouse'
  | 'account' | 'voucher' | 'invoice' | 'donation'
  | 'revenue' | 'expense' | 'tender' | 'po' | 'rfq'
  | 'document' | 'policy' | 'audit_log';

interface UnifiedSearchHit {
  domain: SearchableDomain;
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  score: number;
  highlights?: string[];
  meta?: Record<string, any>;
}

interface UnifiedSearchResult {
  query: string;
  normalizedQuery: string;
  totalHits: number;
  executionMs: number;
  hits: UnifiedSearchHit[];
  facets: Record<string, Array<{ value: string; count: number }>>;
  nlIntent?: any;
}

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: string;
  domains?: string[];
  filters?: Record<string, any>;
  is_public?: boolean;
  is_pinned?: boolean;
  tags?: string[];
  use_count?: number;
}

interface SearchStats {
  totalSearches: number;
  uniqueUsers: number;
  avgDurationMs: number;
  avgHits: number;
  zeroHitRate: number;
  clickThroughRate: number;
}

interface UnifiedSearchEngineTabProps {
  lang: 'ar' | 'en';
}

// Domain display metadata
const DOMAIN_META: Record<string, { labelAr: string; labelEn: string; icon: any; color: string }> = {
  project:          { labelAr: 'المشاريع',         labelEn: 'Projects',          icon: Briefcase,  color: 'emerald' },
  program:          { labelAr: 'البرامج',          labelEn: 'Programs',          icon: Layers,     color: 'blue' },
  activity:         { labelAr: 'الأنشطة',          labelEn: 'Activities',        icon: Activity,   color: 'cyan' },
  task:             { labelAr: 'المهام',           labelEn: 'Tasks',             icon: Target,     color: 'orange' },
  beneficiary:      { labelAr: 'المستفيدون',       labelEn: 'Beneficiaries',     icon: Heart,      color: 'pink' },
  sponsorship:      { labelAr: 'الكفالات',         labelEn: 'Sponsorships',      icon: Award,      color: 'amber' },
  service_delivery: { labelAr: 'تسليم الخدمات',   labelEn: 'Service Delivery',  icon: Truck,      color: 'teal' },
  volunteer:        { labelAr: 'المتطوعون',        labelEn: 'Volunteers',        icon: Users,      color: 'violet' },
  donor:            { labelAr: 'الجهات المانحة',  labelEn: 'Donors',            icon: Heart,      color: 'rose' },
  grant:            { labelAr: 'المنح',            labelEn: 'Grants',            icon: Award,      color: 'fuchsia' },
  proposal:         { labelAr: 'المقترحات',        labelEn: 'Proposals',         icon: FileText,   color: 'indigo' },
  staff:            { labelAr: 'الموظفون',         labelEn: 'Staff',             icon: Users,      color: 'sky' },
  asset:            { labelAr: 'الأصول',           labelEn: 'Assets',            icon: Building,   color: 'lime' },
  inventory:        { labelAr: 'المخزون',          labelEn: 'Inventory',         icon: Database,   color: 'yellow' },
  warehouse:        { labelAr: 'المستودعات',       labelEn: 'Warehouses',        icon: Building,   color: 'green' },
  account:          { labelAr: 'دليل الحسابات',    labelEn: 'Chart of Accounts', icon: BookOpen,   color: 'slate' },
  voucher:          { labelAr: 'القيود',           labelEn: 'Vouchers',          icon: FileText,   color: 'zinc' },
  invoice:          { labelAr: 'الفواتير',         labelEn: 'Invoices',          icon: DollarSign, color: 'emerald' },
  donation:         { labelAr: 'التبرعات',         labelEn: 'Donations',         icon: Heart,      color: 'rose' },
  revenue:          { labelAr: 'الإيرادات',        labelEn: 'Revenue',           icon: TrendingUp, color: 'green' },
  expense:          { labelAr: 'المصروفات',        labelEn: 'Expenses',          icon: DollarSign, color: 'red' },
  tender:           { labelAr: 'المناقصات',        labelEn: 'Tenders',           icon: Award,      color: 'orange' },
  po:               { labelAr: 'أوامر الشراء',     labelEn: 'Purchase Orders',   icon: FileText,   color: 'amber' },
  rfq:              { labelAr: 'طلبات العروض',     labelEn: 'RFQs',              icon: Target,     color: 'cyan' },
  document:         { labelAr: 'المستندات',        labelEn: 'Documents',         icon: BookOpen,   color: 'blue' },
  policy:           { labelAr: 'السياسات',         labelEn: 'Policies',          icon: FileText,   color: 'indigo' },
  audit_log:        { labelAr: 'سجل التدقيق',     labelEn: 'Audit Log',         icon: Eye,        color: 'zinc' },
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; }> = {
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
  blue:    { bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-300',       border: 'border-blue-300 dark:border-blue-700' },
  cyan:    { bg: 'bg-cyan-100 dark:bg-cyan-900/30',       text: 'text-cyan-700 dark:text-cyan-300',       border: 'border-cyan-300 dark:border-cyan-700' },
  orange:  { bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-700 dark:text-orange-300',   border: 'border-orange-300 dark:border-orange-700' },
  pink:    { bg: 'bg-pink-100 dark:bg-pink-900/30',       text: 'text-pink-700 dark:text-pink-300',       border: 'border-pink-300 dark:border-pink-700' },
  amber:   { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-300',     border: 'border-amber-300 dark:border-amber-700' },
  teal:    { bg: 'bg-teal-100 dark:bg-teal-900/30',       text: 'text-teal-700 dark:text-teal-300',       border: 'border-teal-300 dark:border-teal-700' },
  violet:  { bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-700 dark:text-violet-300',   border: 'border-violet-300 dark:border-violet-700' },
  rose:    { bg: 'bg-rose-100 dark:bg-rose-900/30',       text: 'text-rose-700 dark:text-rose-300',       border: 'border-rose-300 dark:border-rose-700' },
  fuchsia: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-300 dark:border-fuchsia-700' },
  indigo:  { bg: 'bg-indigo-100 dark:bg-indigo-900/30',   text: 'text-indigo-700 dark:text-indigo-300',   border: 'border-indigo-300 dark:border-indigo-700' },
  sky:     { bg: 'bg-sky-100 dark:bg-sky-900/30',         text: 'text-sky-700 dark:text-sky-300',         border: 'border-sky-300 dark:border-sky-700' },
  lime:    { bg: 'bg-lime-100 dark:bg-lime-900/30',       text: 'text-lime-700 dark:text-lime-300',       border: 'border-lime-300 dark:border-lime-700' },
  yellow:  { bg: 'bg-yellow-100 dark:bg-yellow-900/30',   text: 'text-yellow-700 dark:text-yellow-300',   border: 'border-yellow-300 dark:border-yellow-700' },
  green:   { bg: 'bg-green-100 dark:bg-green-900/30',     text: 'text-green-700 dark:text-green-300',     border: 'border-green-300 dark:border-green-700' },
  slate:   { bg: 'bg-slate-100 dark:bg-zinc-900/30',     text: 'text-slate-700 dark:text-zinc-300',     border: 'border-slate-300 dark:border-zinc-700' },
  zinc:    { bg: 'bg-zinc-100 dark:bg-zinc-900/30',       text: 'text-zinc-700 dark:text-zinc-300',       border: 'border-zinc-300 dark:border-zinc-700' },
  red:     { bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-300',         border: 'border-red-300 dark:border-red-700' },
};

// ─── Component ────────────────────────────────────────────

export default function UnifiedSearchEngineTab({ lang }: UnifiedSearchEngineTabProps) {
  const isAr = lang === 'ar';

  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [trending, setTrending] = useState<Array<{ query: string; count: number }>>([]);
  const [recommendations, setRecommendations] = useState<UnifiedSearchHit[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'analytics' | 'trends'>('search');
  const debounceRef = useRef<any>(null);

  // ── API helper ────────────────────────────────────────────
  const api = useCallback(async (path: string, init?: RequestInit) => {
    const token = (typeof window !== 'undefined' && (window as any).__uamex_token) || '';
    const orgId = (typeof window !== 'undefined' && (window as any).__uamex_org) || '';
    const res = await fetch(`/api/v2${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId,
        ...(init?.headers || {}),
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error?.message || 'Request failed');
    return json.data;
  }, []);

  // ── Search execution ──────────────────────────────────────
  const runSearch = useCallback(async (q: string, domains?: string[]) => {
    if (!q || q.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const r = await api('/search', {
        method: 'POST',
        body: JSON.stringify({
          query: q,
          domains: domains && domains.length > 0 ? domains : undefined,
          limit: 50,
          fuzzy: true,
          threshold: 30,
          includeHighlights: true,
        })
      });
      setResults(r);
    } catch (err: any) {
      console.error('[Search] failed:', err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(query, domainFilter);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, domainFilter, runSearch]);

  // ── Initial data load ─────────────────────────────────────
  useEffect(() => {
    api('/search/saved?includePublic=true').then(setSavedSearches).catch(() => {});
    api('/search/trending?days=7&limit=10').then(setTrending).catch(() => {});
    api('/search/recommendations?limit=10').then(setRecommendations).catch(() => {});
    api('/search/stats?days=30').then(setStats).catch(() => {});
  }, [api]);

  // ── Handlers ──────────────────────────────────────────────
  const saveCurrentSearch = async (name: string, isPublic: boolean) => {
    try {
      await api('/search/saved', {
        method: 'POST',
        body: JSON.stringify({
          name,
          query,
          domains: domainFilter,
          isPublic,
          isPinned: false,
        })
      });
      const list = await api('/search/saved?includePublic=true');
      setSavedSearches(list);
      setShowSaveDialog(false);
    } catch (err: any) {
      console.error('Save failed', err);
    }
  };

  const deleteSaved = async (id: string) => {
    try {
      await api(`/search/saved/${id}`, { method: 'DELETE' });
      setSavedSearches(prev => prev.filter(s => s.id !== id));
    } catch (err) { console.error(err); }
  };

  const pinSaved = async (s: SavedSearch) => {
    try {
      await api(`/search/saved/${s.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPinned: !s.is_pinned })
      });
      const list = await api('/search/saved?includePublic=true');
      setSavedSearches(list);
    } catch (err) { console.error(err); }
  };

  const loadSaved = (s: SavedSearch) => {
    setQuery(s.query);
    setDomainFilter(s.domains || []);
    api(`/search/saved/${s.id}/touch`, { method: 'POST' }).catch(() => {});
  };

  const recordClick = (hit: UnifiedSearchHit) => {
    if (query) {
      api('/search/click', {
        method: 'POST',
        body: JSON.stringify({ query, domain: hit.domain, recordId: hit.id })
      }).catch(() => {});
    }
  };

  // ── Style helpers ─────────────────────────────────────────
  const inputCls = 'w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all';

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-800 dark:text-zinc-100">
                {isAr ? 'محرك البحث الموحد' : 'Unified Search & Query Engine'}
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium">
                {isAr ? 'بحث ذكي عبر جميع الوحدات الـ 15 (NEB-12 + NEB-13)' : 'Cross-domain intelligent search across all 15 NEB domains'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            {stats && (
              <>
                <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                  {stats.totalSearches} {isAr ? 'بحث' : 'searches'}
                </span>
                <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                  {stats.avgDurationMs}ms {isAr ? 'متوسط' : 'avg'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isAr ? 'ابحث في المشاريع، المستفيدين، السندات، المنح، الموظفين…' : 'Search projects, beneficiaries, vouchers, grants, staff…'}
            className={`${inputCls} ps-10 pe-24 py-3 text-sm`}
          />
          <div className="absolute top-1/2 -translate-y-1/2 end-2 flex items-center gap-1">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
                title={isAr ? 'مسح' : 'Clear'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={!query || query.length < 2}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-[10px] font-bold flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-3 -mb-4 pb-0">
          {[
            { k: 'search',   labelAr: 'البحث',   labelEn: 'Search',    icon: Search },
            { k: 'saved',    labelAr: 'المحفوظات', labelEn: 'Saved',   icon: Bookmark },
            { k: 'trends',   labelAr: 'الرائج',  labelEn: 'Trending',  icon: TrendingUp },
            { k: 'analytics',labelAr: 'التحليلات', labelEn: 'Analytics', icon: BarChart3 },
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setActiveTab(t.k as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-t-lg border-b-2 transition-all ${
                  active
                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {isAr ? t.labelAr : t.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ─── SEARCH TAB ─── */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Domain chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDomainFilter([])}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  domainFilter.length === 0
                    ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                <Globe className="w-3 h-3 inline-block me-1" />
                {isAr ? 'الكل' : 'All'}
              </button>
              {Object.entries(DOMAIN_META).map(([key, m]) => {
                const Icon = m.icon;
                const c = COLOR_CLASSES[m.color] || COLOR_CLASSES.zinc;
                const active = domainFilter.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => setDomainFilter(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                      active
                        ? `${c.bg} ${c.text} ${c.border} border`
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {isAr ? m.labelAr : m.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Results */}
            {!results && !loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                {/* Trending */}
                {trending.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200 dark:border-zinc-800">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                      {isAr ? 'عمليات البحث الرائجة' : 'Trending Searches'}
                    </h3>
                    <div className="space-y-1.5">
                      {trending.slice(0, 8).map((t, i) => (
                        <button
                          key={i}
                          onClick={() => setQuery(t.query)}
                          className="w-full flex items-center justify-between text-[11px] hover:bg-slate-50 dark:hover:bg-zinc-800 p-1.5 rounded-lg"
                        >
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">{t.query}</span>
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">{t.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200 dark:border-zinc-800">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />
                      {isAr ? 'مقترح لك' : 'Recommended for you'}
                    </h3>
                    <div className="space-y-1.5">
                      {recommendations.slice(0, 6).map((r, i) => (
                        <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200 truncate">{r.title}</div>
                            {r.subtitle && <div className="text-[9px] text-slate-500 dark:text-zinc-500 truncate">{r.subtitle}</div>}
                          </div>
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{r.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <Spinner size="lg" variant="primary" />
                <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-2 font-bold">
                  {isAr ? 'جاري البحث…' : 'Searching…'}
                </p>
              </div>
            )}

            {results && !loading && (
              <div>
                <div className="flex items-center justify-between mb-3 text-[10px] text-slate-500 dark:text-zinc-500 font-bold">
                  <div>
                    {isAr ? `${results.totalHits} نتيجة` : `${results.totalHits} results`} • {results.executionMs}ms
                  </div>
                  {results.nlIntent && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-3 h-3" />
                      {results.nlIntent.explanationAr || results.nlIntent.explanationEn}
                    </div>
                  )}
                </div>

                {/* Facets */}
                {results.facets?.domain && results.facets.domain.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {results.facets.domain.map((f, i) => {
                      const m = DOMAIN_META[f.value];
                      const c = m ? (COLOR_CLASSES[m.color] || COLOR_CLASSES.zinc) : COLOR_CLASSES.zinc;
                      return (
                        <span key={i} className={`px-2 py-0.5 text-[10px] font-bold rounded ${c.bg} ${c.text}`}>
                          {m ? (isAr ? m.labelAr : m.labelEn) : f.value} • {f.count}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Hits */}
                <div className="space-y-2">
                  {results.hits.map((hit, i) => {
                    const m = DOMAIN_META[hit.domain];
                    const Icon = m?.icon || Database;
                    const c = m ? (COLOR_CLASSES[m.color] || COLOR_CLASSES.zinc) : COLOR_CLASSES.zinc;
                    return (
                      <a
                        key={i}
                        href={hit.url || '#'}
                        onClick={() => recordClick(hit)}
                        className="block bg-white dark:bg-zinc-900 rounded-xl p-3 border border-slate-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 w-9 h-9 rounded-lg ${c.bg} ${c.text} flex items-center justify-center`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${c.bg} ${c.text}`}>
                                {m ? (isAr ? m.labelAr : m.labelEn) : hit.domain}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold">
                                {hit.score}{isAr ? '٪ تطابق' : '% match'}
                              </span>
                            </div>
                            <div className="text-[12px] font-bold text-slate-800 dark:text-zinc-200 truncate">
                              {hit.title}
                            </div>
                            {hit.subtitle && (
                              <div className="text-[10px] text-slate-500 dark:text-zinc-500 truncate">
                                {hit.subtitle}
                              </div>
                            )}
                            {hit.highlights && hit.highlights[0] && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 italic">
                                {hit.highlights[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>

                {results.hits.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-[11px] font-bold">
                      {isAr ? 'لا توجد نتائج' : 'No results found'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── SAVED TAB ─── */}
        {activeTab === 'saved' && (
          <div className="space-y-2">
            {savedSearches.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-[11px] font-bold">{isAr ? 'لا توجد عمليات بحث محفوظة' : 'No saved searches yet'}</p>
              </div>
            ) : (
              savedSearches.map(s => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-slate-200 dark:border-zinc-800 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadSaved(s)}>
                      <div className="flex items-center gap-2 mb-0.5">
                        {s.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
                        <h3 className="text-[12px] font-bold text-slate-800 dark:text-zinc-200">{s.name}</h3>
                        {s.use_count !== undefined && s.use_count > 0 && (
                          <span className="text-[9px] text-slate-400 font-bold">×{s.use_count}</span>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-[10px] text-slate-500 dark:text-zinc-500">{s.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-1.5">
                        <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono rounded text-emerald-700 dark:text-emerald-300">
                          {s.query}
                        </code>
                        {s.domains && s.domains.length > 0 && (
                          <span className="text-[9px] text-slate-500">→ {s.domains.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => pinSaved(s)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800"
                        title={s.is_pinned ? (isAr ? 'إلغاء التثبيت' : 'Unpin') : (isAr ? 'تثبيت' : 'Pin')}
                      >
                        <Pin className={`w-3.5 h-3.5 ${s.is_pinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                      </button>
                      <button
                        onClick={() => deleteSaved(s.id)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TRENDING TAB ─── */}
        {activeTab === 'trends' && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              {isAr ? 'عمليات البحث الأكثر رواجاً (آخر 7 أيام)' : 'Most trending searches (last 7 days)'}
            </h3>
            {trending.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-6">{isAr ? 'لا توجد بيانات' : 'No data yet'}</p>
            ) : (
              <div className="space-y-2">
                {trending.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(t.query); setActiveTab('search'); }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800"
                  >
                    <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[11px] font-bold">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-start text-[12px] font-semibold text-slate-800 dark:text-zinc-200">{t.query}</span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{t.count} {isAr ? 'مرة' : 'times'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ANALYTICS TAB ─── */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats && (
              <>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">{isAr ? 'إجمالي البحث' : 'Total Searches'}</div>
                  <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200">{stats.totalSearches}</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 mb-1">{isAr ? 'المستخدمون الفريدون' : 'Unique Users'}</div>
                  <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-200">{stats.uniqueUsers}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-1">{isAr ? 'متوسط الزمن (مللي)' : 'Avg Duration (ms)'}</div>
                  <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-200">{stats.avgDurationMs}</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-900/10 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800">
                  <div className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 mb-1">{isAr ? 'متوسط النتائج' : 'Avg Hits'}</div>
                  <div className="text-2xl font-extrabold text-cyan-900 dark:text-cyan-200">{stats.avgHits}</div>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-900/10 rounded-xl p-4 border border-rose-200 dark:border-rose-800">
                  <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 mb-1">{isAr ? 'معدل صفر نتائج' : 'Zero-Hit Rate'}</div>
                  <div className="text-2xl font-extrabold text-rose-900 dark:text-rose-200">{(stats.zeroHitRate * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-900/10 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
                  <div className="text-[10px] font-bold text-violet-700 dark:text-violet-300 mb-1">{isAr ? 'معدل النقر' : 'Click-Through Rate'}</div>
                  <div className="text-2xl font-extrabold text-violet-900 dark:text-violet-200">{(stats.clickThroughRate * 100).toFixed(1)}%</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <SaveSearchDialog
          isAr={isAr}
          query={query}
          onSave={saveCurrentSearch}
          onClose={() => setShowSaveDialog(false)}
        />
      )}
    </div>
  );
}

function SaveSearchDialog({
  isAr, query, onSave, onClose
}: {
  isAr: boolean;
  query: string;
  onSave: (name: string, isPublic: boolean) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-zinc-800 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">
            {isAr ? 'حفظ البحث' : 'Save Search'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-zinc-500 mb-3 font-mono">{query}</div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isAr ? 'اسم البحث' : 'Search name'}
          className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 mb-2"
        />
        <label className="flex items-center gap-2 mb-3 text-[11px] text-slate-700 dark:text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            className="rounded"
          />
          {isAr ? 'عام (متاح للجميع)' : 'Public (share with org)'}
        </label>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim(), isPublic)}
            disabled={!name.trim()}
            className="flex-1 px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white"
          >
            {isAr ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
