// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Unified Workspace Shell
// Premium operational workspace for all 15 NEB domains
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Search, Filter, Plus, Download, RefreshCw, Settings, Bell,
  ChevronRight, ChevronLeft, MoreVertical, Sparkles, Zap,
  LayoutGrid, List, Calendar, BarChart3, FileText, Users,
  ArrowUpDown, Eye, Edit, Trash2, Send, CheckCircle2
} from 'lucide-react';
import { Badge, Skeleton } from '../../shared/components';

type Lang = 'ar' | 'en';
type Theme = 'light' | 'dark';

export interface WorkspaceColumn<T = any> {
  key: string;
  labelAr: string;
  labelEn: string;
  type?: 'text' | 'number' | 'date' | 'status' | 'currency' | 'actions';
  width?: string;
  align?: 'start' | 'center' | 'end';
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface WorkspaceAction {
  id: string;
  labelAr: string;
  labelEn: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (selectedIds: string[]) => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface UAMEXWorkspaceShellProps<T = any> {
  // Identity
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  icon?: React.ComponentType<{ className?: string }>;
  domainCode: string; // e.g. 'NEB-04' (PMO)

  // Data
  data: T[];
  columns: WorkspaceColumn<T>[];
  loading?: boolean;

  // Actions
  actions?: WorkspaceAction[];
  onCreate?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;

  // Search/Filter
  searchPlaceholderAr?: string;
  searchPlaceholderEn?: string;
  filters?: React.ReactNode;

  // UI state
  lang: Lang;
  theme: Theme;
  view?: 'table' | 'grid' | 'list';
  emptyMessageAr?: string;
  emptyMessageEn?: string;

  // Multi-select
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;

  // Identity function for rows
  getRowId?: (row: T) => string;
}

export function UAMEXWorkspaceShell<T extends Record<string, any>>({
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  icon: Icon,
  domainCode,
  data,
  columns,
  loading = false,
  actions = [],
  onCreate,
  onRefresh,
  onExport,
  searchPlaceholderAr = 'ابحث...',
  searchPlaceholderEn = 'Search...',
  filters,
  lang,
  theme,
  view = 'table',
  emptyMessageAr = 'لا توجد بيانات',
  emptyMessageEn = 'No data available',
  selectable = true,
  onSelectionChange,
  getRowId = (row: T) => row.id,
}: UAMEXWorkspaceShellProps<T>) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentView, setCurrentView] = useState(view);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // Filter & sort
  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(v =>
          String(v).toLowerCase().includes(s)
        )
      );
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, sortKey, sortDir]);

  // Selection helpers
  const toggleRow = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    onSelectionChange?.(next);
  };

  const toggleAll = () => {
    const next = selectedIds.length === filteredData.length
      ? []
      : filteredData.map(r => getRowId(r));
    setSelectedIds(next);
    onSelectionChange?.(next);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="min-h-full" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Workspace Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Title block */}
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="xs" lang={lang}>{domainCode}</Badge>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white">
                    {t(titleAr, titleEn)}
                  </h1>
                </div>
                {(subtitleAr || subtitleEn) && (
                  <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                    {t(subtitleAr || '', subtitleEn || '')}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label={t('تحديث', 'Refresh')}
                >
                  <RefreshCw className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                </button>
              )}
              {onExport && (
                <button
                  onClick={onExport}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label={t('تصدير', 'Export')}
                >
                  <Download className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                </button>
              )}
              {onCreate && (
                <button
                  onClick={onCreate}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('إنشاء جديد', 'Create New')}
                </button>
              )}
            </div>
          </div>

          {/* Search + filters bar */}
          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t(searchPlaceholderAr, searchPlaceholderEn)}
                className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 text-sm outline-none transition-all"
              />
            </div>

            {/* View switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/50">
              {[
                { id: 'table', icon: List, label: t('جدول', 'Table') },
                { id: 'grid', icon: LayoutGrid, label: t('شبكة', 'Grid') },
                { id: 'list', icon: BarChart3, label: t('قائمة', 'List') },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setCurrentView(v.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 transition-all ${
                    currentView === v.id
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
                  }`}
                >
                  <v.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>

            {filters}
          </div>
        </div>

        {/* Selection bar */}
        {selectable && selectedIds.length > 0 && (
          <div className="px-4 sm:px-6 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-t border-emerald-200 dark:border-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
              {selectedIds.length} {t('محدد', 'selected')}
            </span>
            <div className="flex items-center gap-2 ms-auto">
              {actions.map(a => (
                <button
                  key={a.id}
                  onClick={() => a.onClick(selectedIds)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 transition-all ${
                    a.variant === 'primary'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : a.variant === 'danger'
                      ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50'
                  }`}
                >
                  {a.icon && <a.icon className="w-3.5 h-3.5" />}
                  {t(a.labelAr, a.labelEn)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton variant="text" lines={2} />
            <Skeleton variant="card" height={200} />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-zinc-400">
              {t(emptyMessageAr, emptyMessageEn)}
            </p>
          </div>
        ) : (
          <WorkspaceTable
            data={filteredData}
            columns={columns}
            selectable={selectable}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onSort={handleSort}
            sortKey={sortKey}
            sortDir={sortDir}
            lang={lang}
            getRowId={getRowId}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Table Renderer
// ─────────────────────────────────────────────────────────────────────────────

interface WorkspaceTableProps<T> {
  data: T[];
  columns: WorkspaceColumn<T>[];
  selectable: boolean;
  selectedIds: string[];
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onSort: (key: string) => void;
  sortKey: string | null;
  sortDir: 'asc' | 'desc';
  lang: Lang;
  getRowId: (row: T) => string;
}

function WorkspaceTable<T extends Record<string, any>>({
  data, columns, selectable, selectedIds, onToggleRow, onToggleAll,
  onSort, sortKey, sortDir, lang, getRowId,
}: WorkspaceTableProps<T>) {
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-700">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={onToggleAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-3 py-3 text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider ${
                    col.align === 'center' ? 'text-center' : col.align === 'end' ? 'text-end' : 'text-start'
                  } ${col.sortable ? 'cursor-pointer hover:text-emerald-600' : ''}`}
                  onClick={() => col.sortable && onSort(col.key)}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1">
                    {t(col.labelAr, col.labelEn)}
                    {col.sortable && sortKey === col.key && (
                      <ArrowUpDown className={`w-3 h-3 ${sortDir === 'asc' ? 'rotate-180' : ''} transition-transform`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {data.map(row => {
              const id = getRowId(row);
              const selected = selectedIds.includes(id);
              return (
                <tr
                  key={id}
                  className={`group transition-colors ${
                    selected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/30'
                  }`}
                >
                  {selectable && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleRow(id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        aria-label={`Select row ${id}`}
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`px-3 py-3 text-slate-700 dark:text-zinc-300 ${
                        col.align === 'center' ? 'text-center' : col.align === 'end' ? 'text-end' : 'text-start'
                      }`}
                    >
                      {col.render ? col.render(row) : (
                        <span className="font-bold">{String(row[col.key] ?? '')}</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination placeholder */}
      <div className="px-3 py-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500">
        <span className="font-bold">
          {t('إجمالي السجلات', 'Total records')}: <span className="text-slate-900 dark:text-white font-black">{data.length}</span>
        </span>
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
            {t('السابق', 'Previous')}
          </button>
          <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-black">1</span>
          <button className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
            {t('التالي', 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UAMEXWorkspaceShell;
