// ═══════════════════════════════════════════════════════════════════════════════
// NexoraOS™ Enterprise Export Engine
// Multi-format export: PDF, Excel (.xlsx), CSV, JSON with formatting,
// headers, auto-column detection, IPSAS compliance, and batch operations.
// ═══════════════════════════════════════════════════════════════════════════════

import type { PrintColumn, PrintConfig } from './printEngine';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'print';

export interface ExportOptions {
  fileName: string;
  sheetName?: string;
  lang: 'ar' | 'en';
  titleAr: string;
  titleEn: string;
  columns?: PrintColumn[];
  includeHeaders?: boolean;
  numberFormat?: boolean;
  dateStamp?: boolean;
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  fileName: string;
  timestamp: Date;
  error?: string;
}

// ─── Column auto-detection ───────────────────────────────────────────────────
function autoColumns(data: any[]): PrintColumn[] {
  if (!data || data.length === 0) return [];
  return Object.keys(data[0]).filter(k => !k.startsWith('_') && k !== 'id').map(key => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    format: typeof data[0][key] === 'number' ? 'number' as const : 'text' as const,
  }));
}

// ─── Format date stamp for filename ──────────────────────────────────────────
function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXCEL EXPORT — formatted .xlsx with auto-columns, headers, styling
// ═══════════════════════════════════════════════════════════════════════════════

export async function exportToExcel(
  data: any[],
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const XLSX = await import('xlsx');
    const columns = options.columns || autoColumns(data);
    const isRtl = options.lang === 'ar';

    // Build formatted rows
    const formattedData = data.map((row, idx) => {
      const obj: Record<string, any> = {
        [isRtl ? '#' : '#']: idx + 1,
      };
      columns.forEach(col => {
        const label = isRtl && col.labelAr ? col.labelAr : col.label;
        const val = row[col.key];
        if (val == null) {
          obj[label] = '—';
        } else if (col.format === 'number' || col.format === 'currency') {
          obj[label] = Number(val);
        } else if (col.format === 'date') {
          try { obj[label] = new Date(val).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US'); }
          catch { obj[label] = String(val); }
        } else if (col.format === 'percent') {
          obj[label] = `${Number(val).toFixed(1)}%`;
        } else {
          obj[label] = String(val);
        }
      });
      return obj;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Auto-size columns
    const colWidths = columns.map(col => ({
      wch: Math.max(
        (isRtl && col.labelAr ? col.labelAr : col.label).length + 2,
        ...data.slice(0, 50).map(r => String(r[col.key] || '').length + 2)
      ),
    }));
    ws['!cols'] = [{ wch: 6 }, ...colWidths]; // # column + data columns

    // Add header row styling metadata
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cell]) {
        ws[cell].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '059669' } } };
      }
    }

    const wb = XLSX.utils.book_new();

    // Main data sheet
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName || (isRtl ? 'البيانات' : 'Data'));

    // Summary sheet
    const summaryData = [
      { [isRtl ? 'البيان' : 'Metric']: isRtl ? 'عنوان التقرير' : 'Report Title', [isRtl ? 'القيمة' : 'Value']: isRtl ? options.titleAr : options.titleEn },
      { [isRtl ? 'البيان' : 'Metric']: isRtl ? 'إجمالي السجلات' : 'Total Records', [isRtl ? 'القيمة' : 'Value']: data.length },
      { [isRtl ? 'البيان' : 'Metric']: isRtl ? 'عدد الأعمدة' : 'Columns', [isRtl ? 'القيمة' : 'Value']: columns.length },
      { [isRtl ? 'البيان' : 'Metric']: isRtl ? 'تاريخ التصدير' : 'Export Date', [isRtl ? 'القيمة' : 'Value']: new Date().toLocaleString(isRtl ? 'ar-YE' : 'en-US') },
      { [isRtl ? 'البيان' : 'Metric']: isRtl ? 'النظام' : 'System', [isRtl ? 'القيمة' : 'Value']: 'NexoraOS™ Enterprise' },
      { [isRtl ? 'البيان' : 'Metric']: isRtl ? 'المعايير' : 'Standards', [isRtl ? 'القيمة' : 'Value']: 'IPSAS & Sphere CHS' },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, isRtl ? 'ملخص' : 'Summary');

    // Generate filename with date
    const fn = options.dateStamp ? `${options.fileName}_${dateStamp()}` : options.fileName;
    XLSX.writeFile(wb, `${fn}.xlsx`);

    return { success: true, format: 'excel', fileName: `${fn}.xlsx`, timestamp: new Date() };
  } catch (err: any) {
    console.error('[ExportEngine] Excel export failed:', err);
    return { success: false, format: 'excel', fileName: options.fileName, timestamp: new Date(), error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV EXPORT — UTF-8 BOM encoded, RTL-compatible
// ═══════════════════════════════════════════════════════════════════════════════

export async function exportToCSV(
  data: any[],
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const XLSX = await import('xlsx');
    const columns = options.columns || autoColumns(data);
    const isRtl = options.lang === 'ar';

    const formattedData = data.map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach(col => {
        const label = isRtl && col.labelAr ? col.labelAr : col.label;
        const val = row[col.key];
        if (val == null) { obj[label] = '—'; return; }
        if (col.format === 'number' || col.format === 'currency') { obj[label] = Number(val); return; }
        if (col.format === 'date') {
          try { obj[label] = new Date(val).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US'); }
          catch { obj[label] = String(val); }
          return;
        }
        obj[label] = String(val);
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fn = options.dateStamp ? `${options.fileName}_${dateStamp()}` : options.fileName;
    link.download = `${fn}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    return { success: true, format: 'csv', fileName: `${fn}.csv`, timestamp: new Date() };
  } catch (err: any) {
    console.error('[ExportEngine] CSV export failed:', err);
    return { success: false, format: 'csv', fileName: options.fileName, timestamp: new Date(), error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSON EXPORT — structured, pretty-printed, metadata-enriched
// ═══════════════════════════════════════════════════════════════════════════════

export async function exportToJSON(
  data: any[],
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const isRtl = options.lang === 'ar';
    const payload = {
      meta: {
        system: 'NexoraOS™ Enterprise',
        report: isRtl ? options.titleAr : options.titleEn,
        exportedAt: new Date().toISOString(),
        records: data.length,
        compliance: 'IPSAS & Sphere CHS',
      },
      data,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fn = options.dateStamp ? `${options.fileName}_${dateStamp()}` : options.fileName;
    link.download = `${fn}.json`;
    link.click();
    URL.revokeObjectURL(link.href);

    return { success: true, format: 'json', fileName: `${fn}.json`, timestamp: new Date() };
  } catch (err: any) {
    console.error('[ExportEngine] JSON export failed:', err);
    return { success: false, format: 'json', fileName: options.fileName, timestamp: new Date(), error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH EXPORT — export to multiple formats at once
// ═══════════════════════════════════════════════════════════════════════════════

export async function batchExport(
  data: any[],
  formats: ExportFormat[],
  options: ExportOptions
): Promise<ExportResult[]> {
  const results: ExportResult[] = [];
  for (const format of formats) {
    if (format === 'print') continue;
    const exporter = { excel: exportToExcel, csv: exportToCSV, json: exportToJSON }[format];
    if (exporter) {
      results.push(await exporter(data, options));
    }
  }
  return results;
}
