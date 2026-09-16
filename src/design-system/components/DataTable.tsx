/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — DataTable Component v3.0
 * Enterprise data table with sorting, selection, empty/loading states, RTL
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * Architecture: DataTable → DataTableColumn, DataTableRow, DataTableCell
 *
 * Features:
 * — Column sorting (ascending/descending/none) with icons
 * — Row selection (single/multi) with checkbox
 * — Row click handler
 * — Empty state with action
 * — Loading skeleton state
 * — Sticky header
 * — RTL-aware (reverses sort icons, aligns text)
 * — Responsive (horizontal scroll on mobile)
 * — Zebra striping
 * — Compact/comfortable/spacious density
 * — Column alignment (start/center/end)
 * — Bilingual headers
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo, useCallback, createContext, useContext } from 'react';
import { cn } from '../utils/cn';
import { useDirection } from '../theme/ThemeContext';

// ─── Types ────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc' | null;
export type SelectionMode = 'none' | 'single' | 'multi';
export type TableDensity = 'compact' | 'comfortable' | 'spacious';
export type ColumnAlign = 'start' | 'center' | 'end';

export interface DataTableColumn<T = any> {
  id: string;
  header: string;
  headerAr?: string;
  accessor: (row: T, index: number) => React.ReactNode;
  /** Plain-text extractor for CSV export (defaults to primitive unwrapping) */
  exportValue?: (row: T, index: number) => string | number | boolean | null | undefined;
  sortable?: boolean;
  align?: ColumnAlign;
  width?: string | number;
  minWidth?: string;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Unique key extractor for each row */
  keyExtractor: (row: T, index: number) => string;
  /** Selection mode */
  selectionMode?: SelectionMode;
  /** Selected row keys (controlled) */
  selectedKeys?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Sort state (controlled) */
  sortColumn?: string;
  sortDirection?: SortDirection;
  /** Sort change handler */
  onSortChange?: (column: string, direction: SortDirection) => void;
  /** Default sort */
  defaultSortColumn?: string;
  defaultSortDirection?: SortDirection;
  /** Density */
  density?: TableDensity;
  /** Zebra striping */
  striped?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Max height (enables vertical scroll) */
  maxHeight?: string | number;
  /** Loading state */
  loading?: boolean;
  /** Empty state */
  emptyTitle?: string;
  emptyTitleAr?: string;
  emptyDescription?: string;
  emptyDescriptionAr?: string;
  emptyAction?: { label: string; labelAr?: string; onClick: () => void };
  emptyIcon?: React.ReactNode;
  /** Language */
  lang?: 'ar' | 'en';
  /** Table className */
  className?: string;
  /** Show CSV export toolbar (exports current sort; selected rows when any) */
  exportable?: boolean;
  /** Export filename without extension */
  exportFilename?: string;
}

// ─── Context ──────────────────────────────────────────────────

interface TableContextValue {
  density: TableDensity;
  lang: 'ar' | 'en';
  isRtl: boolean;
}

const TableContext = createContext<TableContextValue>({ density: 'comfortable', lang: 'ar', isRtl: true });

// ─── Density Config ───────────────────────────────────────────

const DENSITY_CLASSES: Record<TableDensity, { cell: string; header: string }> = {
  compact: { cell: 'px-3 py-2 text-xs', header: 'px-3 py-2 text-xs' },
  comfortable: { cell: 'px-4 py-3 text-sm', header: 'px-4 py-3 text-xs' },
  spacious: { cell: 'px-5 py-4 text-sm', header: 'px-5 py-4 text-xs' },
};

// ─── Sort Icon ────────────────────────────────────────────────

function SortIcon({ direction, className }: { direction: SortDirection; className?: string }) {
  return (
    <span className={cn('inline-flex flex-col -space-y-1', className)}>
      <svg className={cn('w-3 h-3', direction === 'asc' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-300 dark:text-zinc-600')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
      <svg className={cn('w-3 h-3', direction === 'desc' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-300 dark:text-zinc-600')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </span>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────

function TableSkeleton({ columns, rows = 5, density }: { columns: number; rows?: number; density: TableDensity }) {
  const cellClass = DENSITY_CLASSES[density].cell;
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-zinc-100 dark:border-zinc-800" role="row">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className={cellClass} role="cell">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" style={{ width: `${60 + ((rowIdx * 7 + colIdx * 13) % 40)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────

function EmptyState({ columns, emptyTitle, emptyTitleAr, emptyDescription, emptyDescriptionAr, emptyAction, emptyIcon, lang }: { columns: number } & Pick<DataTableProps, 'emptyTitle' | 'emptyTitleAr' | 'emptyDescription' | 'emptyDescriptionAr' | 'emptyAction' | 'emptyIcon' | 'lang'>) {
  const title = lang === 'ar' ? (emptyTitleAr || 'لا توجد بيانات') : (emptyTitle || 'No data');
  const desc = lang === 'ar' ? (emptyDescriptionAr || 'لم يتم العثور على أي نتائج') : (emptyDescription || 'No results found');

  return (
    <tr role="row">
      <td colSpan={columns} className="px-6 py-16 text-center" role="cell">
        <div className="flex flex-col items-center gap-3">
          {emptyIcon || (
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5" />
              </svg>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{desc}</p>
          </div>
          {emptyAction && (
            <button
              type="button"
              onClick={emptyAction.onClick}
              className="mt-2 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {lang === 'ar' ? (emptyAction.labelAr || emptyAction.label) : emptyAction.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main DataTable ───────────────────────────────────────────

export function DataTable<T = any>({
  columns,
  data,
  keyExtractor,
  selectionMode = 'none',
  selectedKeys: controlledSelected,
  onSelectionChange,
  onRowClick,
  sortColumn: controlledSortColumn,
  sortDirection: controlledSortDirection,
  onSortChange,
  defaultSortColumn,
  defaultSortDirection = null,
  density = 'comfortable',
  striped = true,
  stickyHeader = true,
  maxHeight,
  loading = false,
  emptyTitle,
  emptyTitleAr,
  emptyDescription,
  emptyDescriptionAr,
  emptyAction,
  emptyIcon,
  lang = 'ar',
  className,
  exportable = false,
  exportFilename = 'export',
}: DataTableProps<T>) {
  const { direction } = useDirection();
  const isRtl = direction === 'rtl';

  // Internal sort state
  const [internalSortColumn, setInternalSortColumn] = useState<string | undefined>(defaultSortColumn);
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>(defaultSortDirection);

  const sortColumn = controlledSortColumn ?? internalSortColumn;
  const sortDirection = controlledSortDirection ?? internalSortDirection;

  const handleSort = useCallback(
    (columnId: string) => {
      const newDirection: SortDirection =
        sortColumn === columnId
          ? sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
          : 'asc';

      if (controlledSortColumn === undefined) {
        setInternalSortColumn(newDirection ? columnId : undefined);
        setInternalSortDirection(newDirection);
      }
      onSortChange?.(columnId, newDirection);
    },
    [sortColumn, sortDirection, controlledSortColumn, onSortChange]
  );

  // Internal selection state
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const selectedKeys = controlledSelected ?? internalSelected;

  const handleSelectAll = useCallback(() => {
    const allKeys = data.map((row, i) => keyExtractor(row, i));
    const allSelected = allKeys.every((k) => selectedKeys.has(k));
    const next = allSelected ? new Set<string>() : new Set(allKeys);
    if (controlledSelected === undefined) setInternalSelected(next);
    onSelectionChange?.(next);
  }, [data, keyExtractor, selectedKeys, controlledSelected, onSelectionChange]);

  const handleSelectRow = useCallback(
    (key: string) => {
      const next = new Set(selectedKeys);
      if (selectionMode === 'single') {
        next.clear();
        next.add(key);
      } else {
        if (next.has(key)) next.delete(key);
        else next.add(key);
      }
      if (controlledSelected === undefined) setInternalSelected(next);
      onSelectionChange?.(next);
    },
    [selectedKeys, selectionMode, controlledSelected, onSelectionChange]
  );

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col) return data;

    return [...data].sort((a, b) => {
      const aVal = col.accessor(a, 0);
      const bVal = col.accessor(b, 0);
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      const cmp = aStr.localeCompare(bStr, lang === 'ar' ? 'ar' : 'en', { numeric: true });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [data, sortColumn, sortDirection, columns, lang]);

  const allKeys = useMemo(() => data.map((row, i) => keyExtractor(row, i)), [data, keyExtractor]);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k));
  const someSelected = allKeys.some((k) => selectedKeys.has(k));

  const cellClass = DENSITY_CLASSES[density].cell;
  const headerClass = DENSITY_CLASSES[density].header;

  // CSV export — honors current sort; exports the selection when any rows
  // are checked, otherwise the full sorted view. A BOM prefix keeps Arabic
  // intact when the file is opened in Excel.
  const BOM = '﻿';
  const handleExportCsv = useCallback(() => {
    const rows =
      selectionMode === 'multi' && selectedKeys.size > 0
        ? sortedData.filter((row, i) => selectedKeys.has(keyExtractor(row, i)))
        : sortedData;
    const escapeCell = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const text = String(value).replace(/\r?\n/g, ' ');
      return /[",;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const cellText = (col: DataTableColumn<T>, row: T, idx: number): string => {
      try {
        if (col.exportValue) {
          const v = col.exportValue(row, idx);
          return v === null || v === undefined ? '' : String(v);
        }
        const v = col.accessor(row, idx) as unknown;
        if (v === null || v === undefined) return '';
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
        return '';
      } catch {
        return '';
      }
    };
    const headerLine = columns
      .map((col) => escapeCell(lang === 'ar' ? col.headerAr || col.header : col.header))
      .join(',');
    const bodyLines = rows.map((row, i) =>
      columns.map((col) => escapeCell(cellText(col, row, i))).join(',')
    );
    const csv = BOM + [headerLine, ...bodyLines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFilename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sortedData, selectedKeys, selectionMode, columns, keyExtractor, lang, exportFilename]);

  return (
    <TableContext.Provider value={{ density, lang, isRtl }}>
      <div
        className={cn(
          'w-full rounded-xl border border-zinc-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 overflow-hidden',
          'shadow-sm',
          className
        )}
      >
        {exportable && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-700/50 bg-zinc-50/60 dark:bg-zinc-800/30">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {selectionMode === 'multi' && selectedKeys.size > 0
                ? isRtl
                  ? `سيتم تصدير ${selectedKeys.size} صفوف محددة`
                  : `Will export ${selectedKeys.size} selected rows`
                : isRtl
                  ? `${sortedData.length} صفوف — مرتبة حسب العرض الحالي`
                  : `${sortedData.length} rows — current sort order`}
            </p>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={sortedData.length === 0}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                'border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300',
                'hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {isRtl ? 'تصدير CSV' : 'Export CSV'}
            </button>
          </div>
        )}
        <div
          className="overflow-auto"
          style={{ maxHeight: maxHeight || undefined }}
        >
          <table className="w-full border-collapse min-w-[600px]" dir={direction} role="table">
            <thead role="rowgroup">
              <tr className={cn(
                'border-b border-zinc-200 dark:border-zinc-700/50',
                'bg-zinc-50 dark:bg-zinc-800/50',
                stickyHeader && 'sticky top-0 z-10'
              )} role="row">
                {/* Selection header */}
                {selectionMode === 'multi' && (
                  <th className={cn(headerClass, 'w-10')} role="columnheader">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 bg-white dark:bg-zinc-800"
                      aria-label={isRtl ? 'تحديد الكل' : 'Select all'}
                    />
                  </th>
                )}
                {selectionMode === 'single' && <th className={cn(headerClass, 'w-10')} role="columnheader" />}

                {/* Column headers */}
                {columns.map((col) => (
                  <th
                    key={col.id}
                    role="columnheader"
                    aria-sort={col.sortable ? (sortColumn === col.id ? (sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none') : 'none') : undefined}
                    className={cn(
                      headerClass,
                      'font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap',
                      col.sortable && 'cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors',
                      col.align === 'center' && 'text-center',
                      col.align === 'end' && (isRtl ? 'text-left' : 'text-right'),
                      col.headerClassName
                    )}
                    style={{ width: col.width, minWidth: col.minWidth }}
                    onClick={col.sortable ? () => handleSort(col.id) : undefined}
                    scope="col"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {lang === 'ar' ? (col.headerAr || col.header) : col.header}
                      {col.sortable && (
                        <SortIcon
                          direction={sortColumn === col.id ? sortDirection : null}
                          className="shrink-0"
                        />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50" role="rowgroup">
              {loading ? (
                <TableSkeleton columns={columns.length + (selectionMode !== 'none' ? 1 : 0)} density={density} />
              ) : sortedData.length === 0 ? (
                <EmptyState
                  columns={columns.length + (selectionMode !== 'none' ? 1 : 0)}
                  emptyTitle={emptyTitle}
                  emptyTitleAr={emptyTitleAr}
                  emptyDescription={emptyDescription}
                  emptyDescriptionAr={emptyDescriptionAr}
                  emptyAction={emptyAction}
                  emptyIcon={emptyIcon}
                  lang={lang}
                />
              ) : (
                sortedData.map((row, rowIdx) => {
                  const rowKey = keyExtractor(row, rowIdx);
                  const isSelected = selectedKeys.has(rowKey);
                  return (
                    <tr
                      key={rowKey}
                      role="row"
                      className={cn(
                        'transition-colors',
                        striped && rowIdx % 2 === 1 && 'bg-zinc-50/50 dark:bg-zinc-800/20',
                        isSelected && 'bg-emerald-50 dark:bg-emerald-950/20',
                        onRowClick && 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                        onRowClick && isSelected && 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                      )}
                      onClick={() => onRowClick?.(row, rowIdx)}
                    >
                      {/* Selection cell */}
                      {selectionMode === 'multi' && (
                        <td className={cn(cellClass, 'w-10')} role="cell">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(rowKey)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 bg-white dark:bg-zinc-800"
                            aria-label={isRtl ? `تحديد الصف ${rowIdx + 1}` : `Select row ${rowIdx + 1}`}
                          />
                        </td>
                      )}
                      {selectionMode === 'single' && (
                        <td className={cn(cellClass, 'w-10')} role="cell">
                          <div className={cn(
                            'w-2 h-2 rounded-full transition-colors',
                            isSelected ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
                          )} />
                        </td>
                      )}

                      {/* Data cells */}
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          role="cell"
                          className={cn(
                            cellClass,
                            'text-zinc-700 dark:text-zinc-300',
                            col.align === 'center' && 'text-center',
                            col.align === 'end' && (isRtl ? 'text-left' : 'text-right'),
                            col.className
                          )}
                        >
                          {col.accessor(row, rowIdx)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TableContext.Provider>
  );
}
