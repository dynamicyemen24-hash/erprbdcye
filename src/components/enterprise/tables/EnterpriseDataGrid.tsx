import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Download, Filter, Columns, MoreHorizontal } from 'lucide-react';

export interface ColumnDef<T> {
  key: Extract<keyof T, string>;
  header: string;
  render?: (value: T[keyof T], record: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  hidden?: boolean;
}

interface EnterpriseDataGridProps<T> {
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
}

export function EnterpriseDataGrid<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  searchable = true,
  exportable = true,
  defaultSortKey,
  defaultSortDir = 'asc',
  maxHeight = '600px'
}: EnterpriseDataGridProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
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

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        Object.values(item as any).some(val => 
          String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA === valB) return 0;
        const comp = valA > valB ? 1 : -1;
        return sortConfig.dir === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const visibleColumns = columns.filter(c => !c.hidden);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      
      <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950/50">
        {searchable ? (
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search records..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow"
            />
          </div>
        ) : <div />}
        
        <div className="flex items-center gap-1.5">
          <button className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md transition-colors" title="Filter">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md transition-colors" title="Columns">
            <Columns className="w-4 h-4" />
          </button>
          {exportable && (
            <button className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md transition-colors" title="Export CSV">
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar" style={{ maxHeight }}>
        <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-400 border-collapse">
          <thead className="bg-slate-50 dark:bg-zinc-950 sticky top-0 z-10 shadow-[0_1px_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_rgba(39,39,42,1)]">
            <tr>
              {visibleColumns.map((col) => (
                <th 
                  key={col.key}
                  className={`px-4 py-3 font-bold text-slate-700 dark:text-zinc-300 whitespace-nowrap select-none ${col.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800' : ''}`}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    <span>{col.header}</span>
                    {col.sortable && sortConfig?.key === col.key && (
                      sortConfig.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              {onRowClick && <th className="px-4 py-3 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (onRowClick ? 1 : 0)} className="px-4 py-12 text-center">
                  <div className="inline-block w-5 h-5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin"></div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (onRowClick ? 1 : 0)} className="px-4 py-12 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((record) => (
                <tr 
                  key={keyExtractor(record)}
                  onClick={() => onRowClick?.(record)}
                  className={`group bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {visibleColumns.map((col) => (
                    <td 
                      key={col.key} 
                      className="px-4 py-3 whitespace-nowrap"
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render ? col.render(record[col.key], record) : String(record[col.key] ?? '')}
                    </td>
                  ))}
                  {onRowClick && (
                    <td className="px-4 py-3 text-right">
                      <MoreHorizontal className="w-4 h-4 text-slate-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && processedData.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 text-[10px] text-slate-500 flex justify-between items-center">
          <span>Showing {processedData.length} records</span>
        </div>
      )}
    </div>
  );
}
