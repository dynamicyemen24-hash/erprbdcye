import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  SlidersHorizontal, 
  Columns, 
  MoreHorizontal,
  FileSpreadsheet,
  Copy,
  Check,
  ArrowUpDown,
  RefreshCw,
  Maximize2,
  Minimize2,
  Table as TableIcon
} from 'lucide-react';
import { enterpriseTokens } from '../../../core/theme/enterpriseDesignTokens';
import { normalizeArabicText } from '../../../core/utils/arabicSearch';
import { showToast } from '../EnterpriseToastContainer';

export interface ColumnDef<T> {
  key: Extract<keyof T, string>;
  header: string;
  render?: (value: T[keyof T], record: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  hidden?: boolean;
  isNumeric?: boolean;
}

export interface EnterpriseDataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (record: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (record: T) => void;
  searchable?: boolean;
  exportable?: boolean;
  defaultSortKey?: Extract<keyof T, string>;
  defaultSortDir?: 'asc' | 'desc';
  maxHeight?: string;
  lang?: 'ar' | 'en';
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  density?: 'compact' | 'comfortable' | 'spacious';
  onDensityChange?: (density: 'compact' | 'comfortable' | 'spacious') => void;
}

export function EnterpriseDataGrid<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage,
  onRowClick,
  searchable = true,
  exportable = true,
  defaultSortKey,
  defaultSortDir = 'asc',
  maxHeight = '600px',
  lang = 'ar',
  title,
  subtitle,
  actions,
  density: externalDensity,
  onDensityChange
}: EnterpriseDataGridProps<T>) {
  const isRtl = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [internalDensity, setInternalDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(
    new Set(columns.filter(c => c.hidden).map(c => c.key))
  );
  const [copiedToast, setCopiedToast] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeDensity = externalDensity || internalDensity;

  const [sortConfig, setSortConfig] = useState<{ key: Extract<keyof T, string>; dir: 'asc' | 'desc' } | null>(
    defaultSortKey ? { key: defaultSortKey, dir: defaultSortDir } : null
  );

  const handleSort = (key: Extract<keyof T, string>) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  };

  const processedData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const normalizedQuery = normalizeArabicText(searchTerm.trim().toLowerCase());
      result = result.filter(item => 
        Object.values(item as any).some(val => {
          if (val === null || val === undefined) return false;
          const normalizedVal = normalizeArabicText(String(val).toLowerCase());
          return normalizedVal.includes(normalizedQuery);
        })
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        const numA = typeof valA === 'number' ? valA : parseFloat(String(valA));
        const numB = typeof valB === 'number' ? valB : parseFloat(String(valB));

        let comp = 0;
        if (!isNaN(numA) && !isNaN(numB)) {
          comp = numA > numB ? 1 : -1;
        } else {
          comp = String(valA).localeCompare(String(valB), lang === 'ar' ? 'ar' : 'en');
        }

        return sortConfig.dir === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig, lang]);

  const visibleColumns = useMemo(() => {
    return columns.filter(c => !hiddenColumnKeys.has(c.key));
  }, [columns, hiddenColumnKeys]);

  const toggleColumnVisibility = (key: string) => {
    setHiddenColumnKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (columns.length - next.size > 1) {
          next.add(key);
        }
      }
      return next;
    });
  };

  const handleExportCSV = () => {
    if (processedData.length === 0) return;

    const headers = visibleColumns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = processedData.map(record => {
      return visibleColumns.map(col => {
        const val = record[col.key];
        const strVal = val === null || val === undefined ? '' : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      title: isRtl ? 'تصدير السجلات' : 'Export Data',
      message: isRtl ? 'تم تصدير ملف CSV بنجاح وبصيغة متوافقة مع Excel' : 'CSV exported successfully with Excel UTF-8 compatibility',
      type: 'success'
    });
  };

  const handleCopyClipboard = async () => {
    if (processedData.length === 0) return;
    const tsvHeaders = visibleColumns.map(c => c.header).join('\t');
    const tsvRows = processedData.map(record => {
      return visibleColumns.map(col => String(record[col.key] ?? '')).join('\t');
    }).join('\n');
    
    await navigator.clipboard.writeText(`${tsvHeaders}\n${tsvRows}`);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
    showToast({
      title: isRtl ? 'نسخ السجلات' : 'Copy Table',
      message: isRtl ? 'تم نسخ السجلات إلى الحافظة بنجاح' : 'Copied records to clipboard successfully',
      type: 'info'
    });
  };

  const handleDensityToggle = (newDensity: 'compact' | 'comfortable' | 'spacious') => {
    if (onDensityChange) {
      onDensityChange(newDensity);
    } else {
      setInternalDensity(newDensity);
    }
  };

  // Keyboard navigation across rows
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (processedData.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, processedData.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < processedData.length) {
      e.preventDefault();
      onRowClick?.(processedData[selectedIndex]);
    }
  };

  const densityPadding = activeDensity === 'compact' 
    ? 'px-3 py-1.5 text-xs' 
    : activeDensity === 'spacious' 
    ? 'px-5 py-4 text-sm' 
    : 'px-4 py-2.5 text-xs';

  const defaultEmptyMsg = isRtl 
    ? 'لم يتم العثور على أي سجلات مطابقة لمعايير البحث' 
    : 'No matching records found.';

  return (
    <div 
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`flex flex-col w-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'h-full'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── TOOLBAR HEADER ───────────────────────────────────────────────── */}
      <div className="p-3 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/70 flex flex-wrap items-center justify-between gap-3">
        
        {/* Title or Search */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          {title && (
            <div className="shrink-0">
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{title}</span>
              </h3>
              {subtitle && <p className="text-[10px] text-slate-500 dark:text-zinc-400">{subtitle}</p>}
            </div>
          )}

          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className={`w-3.5 h-3.5 text-slate-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5`} />
              <input 
                type="text" 
                placeholder={isRtl ? 'البحث الذكي الفوري في كافة الأعمدة...' : 'Filter and instant search across records...'} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} top-2 text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200`}
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons & Density Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {actions}

          {/* Density Selector */}
          <div className="flex items-center bg-slate-200/60 dark:bg-zinc-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => handleDensityToggle('compact')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                activeDensity === 'compact' ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-extrabold' : 'text-slate-600 dark:text-zinc-400'
              }`}
              title={isRtl ? 'عرض مكثف' : 'Compact Density'}
            >
              {isRtl ? 'مكثف' : 'Compact'}
            </button>
            <button
              type="button"
              onClick={() => handleDensityToggle('comfortable')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                activeDensity === 'comfortable' ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-extrabold' : 'text-slate-600 dark:text-zinc-400'
              }`}
              title={isRtl ? 'عرض مريح' : 'Comfortable Density'}
            >
              {isRtl ? 'مريح' : 'Normal'}
            </button>
            <button
              type="button"
              onClick={() => handleDensityToggle('spacious')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                activeDensity === 'spacious' ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-extrabold' : 'text-slate-600 dark:text-zinc-400'
              }`}
              title={isRtl ? 'عرض واسع' : 'Spacious Density'}
            >
              {isRtl ? 'واسع' : 'Spacious'}
            </button>
          </div>

          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/70 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-zinc-700"
              title={isRtl ? 'تخصيص الأعمدة' : 'Customize Columns'}
            >
              <Columns className="w-4 h-4" />
            </button>

            {showColumnPicker && (
              <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-1.5 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 z-30 text-xs space-y-1 animate-scale-in`}>
                <div className="font-extrabold text-[10px] uppercase text-slate-400 dark:text-zinc-500 px-2 py-1 border-b border-slate-100 dark:border-zinc-800">
                  {isRtl ? 'الأعمدة المعروضة' : 'Visible Columns'}
                </div>
                {columns.map(col => {
                  const isVisible = !hiddenColumnKeys.has(col.key);
                  return (
                    <label 
                      key={col.key}
                      className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-lg cursor-pointer text-slate-700 dark:text-zinc-300 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumnVisibility(col.key)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate">{col.header}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Copy to Clipboard */}
          <button
            type="button"
            onClick={handleCopyClipboard}
            className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/70 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-zinc-700"
            title={isRtl ? 'نسخ الجدول إلى الحافظة' : 'Copy Table to Clipboard'}
          >
            {copiedToast ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Export to CSV */}
          {exportable && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-emerald-300 dark:hover:border-emerald-800"
              title={isRtl ? 'تصدير ملف CSV / Excel' : 'Export to CSV / Excel'}
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/70 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-zinc-700"
            title={isFullscreen ? (isRtl ? 'تصغير' : 'Exit Fullscreen') : (isRtl ? 'ملء الشاشة' : 'Fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── TABLE DATA BODY ──────────────────────────────────────────────── */}
      <div 
        className="flex-1 overflow-auto custom-scrollbar" 
        style={{ maxHeight: isFullscreen ? 'calc(100vh - 140px)' : maxHeight }}
      >
        <table className="w-full text-start border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-zinc-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400 shadow-2xs">
            <tr>
              {visibleColumns.map((col) => (
                <th 
                  key={col.key}
                  className={`${densityPadding} font-extrabold whitespace-nowrap select-none ${col.sortable ? 'cursor-pointer hover:bg-slate-200/70 dark:hover:bg-zinc-800 transition-colors' : ''}`}
                  style={{ width: col.width, textAlign: col.align || (isRtl ? 'right' : 'left') }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={`flex items-center gap-1.5 ${
                    col.align === 'right' 
                      ? (isRtl ? 'justify-start' : 'justify-end') 
                      : col.align === 'center' 
                      ? 'justify-center' 
                      : (isRtl ? 'justify-end' : 'justify-start')
                  }`}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="shrink-0 text-slate-400">
                        {sortConfig?.key === col.key ? (
                          sortConfig.dir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {onRowClick && <th className="px-3 py-2.5 w-10 text-center"></th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (onRowClick ? 1 : 0)} className="px-4 py-16 text-center">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>{isRtl ? 'جاري جلب وتحديث السجلات...' : 'Loading and calculating records...'}</span>
                  </div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (onRowClick ? 1 : 0)} className="px-4 py-16 text-center text-slate-400 dark:text-zinc-500 font-medium text-xs">
                  {emptyMessage || defaultEmptyMsg}
                </td>
              </tr>
            ) : (
              processedData.map((record, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <tr 
                    key={keyExtractor(record)}
                    onClick={() => {
                      setSelectedIndex(index);
                      onRowClick?.(record);
                    }}
                    className={`group transition-colors ${
                      isSelected 
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/40 text-slate-900 dark:text-white' 
                        : index % 2 === 0 
                        ? 'bg-white dark:bg-zinc-900 hover:bg-slate-50/90 dark:hover:bg-zinc-800/60' 
                        : 'bg-slate-50/40 dark:bg-zinc-900/40 hover:bg-slate-100/70 dark:hover:bg-zinc-800/80'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {visibleColumns.map((col) => (
                      <td 
                        key={col.key} 
                        className={`${densityPadding} whitespace-nowrap ${col.isNumeric ? 'font-mono tabular-nums font-bold' : ''}`}
                        style={{ textAlign: col.align || (isRtl ? 'right' : 'left') }}
                      >
                        {col.render ? col.render(record[col.key], record) : String(record[col.key] ?? '—')}
                      </td>
                    ))}
                    {onRowClick && (
                      <td className="px-3 py-2 text-center">
                        <MoreHorizontal className="w-4 h-4 text-slate-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── SUMMARY STATS FOOTER BAR ─────────────────────────────────────── */}
      {!loading && processedData.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-950/80 text-[11px] text-slate-600 dark:text-zinc-400 font-bold flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span>
              {isRtl ? `إجمالي السجلات المعروضة: ` : `Showing records: `}
              <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-black">{processedData.length}</strong>
              {data.length !== processedData.length && (
                <span className="text-slate-400 font-normal">
                  {isRtl ? ` (مصفاة من أصل ${data.length})` : ` (filtered from ${data.length})`}
                </span>
              )}
            </span>
            {searchTerm && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px]">
                {isRtl ? `تصفية نشطة: "${searchTerm}"` : `Active query: "${searchTerm}"`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>{isRtl ? 'استخدم الأسهم ⬆ ⬇ و Enter للتنقل السريع' : 'Use ⬆ ⬇ and Enter for keyboard navigation'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnterpriseDataGrid;
