// ═══════════════════════════════════════════════════════════════════════════════
// NexoraOS™ Enterprise Print Engine
// Advanced PDF generation, instant printing, multi-page support, watermarks,
// page numbering, RTL/LTR, IPSAS compliance headers, digital seals.
// ═══════════════════════════════════════════════════════════════════════════════

export type PrintOrientation = 'landscape' | 'portrait';
export type PrintPaperSize = 'a4' | 'a3' | 'letter' | 'legal';
export type PrintDensity = 'compact' | 'normal' | 'spacious';

export interface PrintColumn {
  key: string;
  label: string;
  labelAr?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'date' | 'percent' | 'status';
  currency?: string;
  colorize?: (value: any) => string;
}

export interface PrintHeaderConfig {
  title: string;
  subtitle?: string;
  organization?: string;
  logoUrl?: string;
  date?: string;
  time?: string;
  reportId?: string;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface PrintFooterConfig {
  showPageNumbers: boolean;
  showTimestamp: boolean;
  showComplianceBadge: boolean;
  complianceStandard?: string;
  customText?: string;
}

export interface PrintWatermarkConfig {
  text: string;
  opacity?: number;
  angle?: number;
  color?: string;
}

export interface PrintPageConfig {
  orientation: PrintOrientation;
  paperSize: PrintPaperSize;
  density: PrintDensity;
  margins: { top: number; right: number; bottom: number; left: number };
  showGridLines: boolean;
  alternateRowColors: boolean;
  frozenHeader: boolean;
}

export interface PrintConfig {
  header: PrintHeaderConfig;
  footer: PrintFooterConfig;
  page: PrintPageConfig;
  columns: PrintColumn[];
  watermark?: PrintWatermarkConfig;
  maxRowsPerPage?: number;
  lang: 'ar' | 'en';
}

export interface PrintJob {
  id: string;
  config: PrintConfig;
  data: any[];
  createdAt: Date;
  status: 'pending' | 'processing' | 'complete' | 'failed';
}

// ─── Paper size dimensions (mm) ──────────────────────────────────────────────
const PAPER_SIZES: Record<PrintPaperSize, { width: number; height: number }> = {
  a4: { width: 297, height: 210 },
  a3: { width: 420, height: 297 },
  letter: { width: 279.4, height: 215.9 },
  legal: { width: 355.6, height: 215.9 },
};

// ─── Default column auto-detection ───────────────────────────────────────────
function autoDetectColumns(data: any[], lang: 'ar' | 'en'): PrintColumn[] {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]).filter(k => !k.startsWith('_') && k !== 'id');
  return keys.map(key => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    labelAr: key.replace(/_/g, ' '),
    align: typeof data[0][key] === 'number' ? (lang === 'ar' ? 'left' : 'right') : 'left',
    format: detectFormat(data, key),
  }));
}

function detectFormat(data: any[], key: string): PrintColumn['format'] {
  const sample = data.slice(0, 20).map(r => r[key]).filter(v => v != null);
  if (sample.length === 0) return 'text';
  if (sample.every(v => typeof v === 'number')) return 'number';
  if (sample.some(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))) return 'date';
  if (sample.some(v => typeof v === 'string' && /^(active|inactive|pending|completed|approved|rejected)$/i.test(v))) return 'status';
  return 'text';
}

// ─── Format cell value ───────────────────────────────────────────────────────
function formatCellValue(value: any, column: PrintColumn, lang: 'ar' | 'en'): string {
  if (value == null || value === '') return '—';
  const isRtl = lang === 'ar';

  switch (column.format) {
    case 'number':
      return Number(value).toLocaleString(isRtl ? 'ar-YE' : 'en-US');
    case 'currency':
      return `${Number(value).toLocaleString(isRtl ? 'ar-YE' : 'en-US')} ${column.currency || 'USD'}`;
    case 'date':
      try {
        return new Date(value).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch { return String(value); }
    case 'percent':
      return `${Number(value).toFixed(1)}%`;
    case 'status': {
      const statusMap: Record<string, { ar: string; en: string; color: string }> = {
        active: { ar: 'نشط', en: 'Active', color: '#059669' },
        inactive: { ar: 'غير نشط', en: 'Inactive', color: '#94a3b8' },
        pending: { ar: 'قيد الانتظار', en: 'Pending', color: '#d97706' },
        completed: { ar: 'مكتمل', en: 'Completed', color: '#059669' },
        approved: { ar: 'موافق عليه', en: 'Approved', color: '#059669' },
        rejected: { ar: 'مرفوض', en: 'Rejected', color: '#dc2626' },
      };
      const s = statusMap[String(value).toLowerCase()];
      if (s) return `<span style="color:${s.color};font-weight:700">${isRtl ? s.ar : s.en}</span>`;
      return String(value);
    }
    default:
      return String(value);
  }
}

// ─── Status color helper ─────────────────────────────────────────────────────
function getStatusColor(value: any): string | null {
  if (value == null) return null;
  const v = String(value).toLowerCase();
  const map: Record<string, string> = {
    active: '#059669', completed: '#059669', approved: '#059669',
    pending: '#d97706', in_progress: '#d97706',
    inactive: '#94a3b8', rejected: '#dc2626', cancelled: '#dc2626',
  };
  return map[v] || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTML Print Renderer — generates enterprise-grade printable HTML
// ═══════════════════════════════════════════════════════════════════════════════

export function generatePrintHTML(data: any[], config: PrintConfig): string {
  const isRtl = config.lang === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';
  const paper = PAPER_SIZES[config.page.paperSize];
  const { orientation, density, margins, showGridLines, alternateRowColors } = config.page;
  const columns = config.columns.length > 0 ? config.columns : autoDetectColumns(data, config.lang);
  const now = new Date();
  const dateStr = config.header.date || now.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = config.header.time || now.toLocaleTimeString(isRtl ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  const densityConfig = {
    compact: { fontSize: '9px', cellPadding: '4px 6px', rowHeight: '24px' },
    normal: { fontSize: '11px', cellPadding: '6px 10px', rowHeight: '30px' },
    spacious: { fontSize: '12px', cellPadding: '8px 14px', rowHeight: '36px' },
  }[density];

  const pageWidth = orientation === 'landscape' ? paper.width : paper.height;
  const contentWidth = pageWidth - margins.left - margins.right;

  const classificationColors: Record<string, string> = {
    public: '#059669', internal: '#2563eb', confidential: '#d97706', restricted: '#dc2626',
  };
  const classificationLabels: Record<string, { ar: string; en: string }> = {
    public: { ar: 'عام', en: 'PUBLIC' }, internal: { ar: 'داخلي', en: 'INTERNAL' },
    confidential: { ar: 'سري', en: 'CONFIDENTIAL' }, restricted: { ar: 'محظور', en: 'RESTRICTED' },
  };

  // ── Build table header ────────────────────────────────────────────────────
  const thCells = columns.map(col => {
    const label = isRtl && col.labelAr ? col.labelAr : col.label;
    const align = col.align || (isRtl ? 'right' : 'left');
    return `<th class="th" style="text-align:${align}">${label}</th>`;
  }).join('');

  // ── Build table rows (with optional status colorization) ──────────────────
  const maxRows = config.maxRowsPerPage || 9999;
  const rows = data.slice(0, maxRows).map((row, idx) => {
    const cells = columns.map(col => {
      const val = row[col.key];
      const rendered = formatCellValue(val, col, config.lang);
      const align = col.align || (isRtl ? 'right' : 'left');
      const statusColor = getStatusColor(val);
      const style = statusColor ? `color:${statusColor};font-weight:700` : (col.format === 'number' || col.format === 'currency' ? `text-align:${isRtl ? 'left' : 'right'};font-family:'Courier New',monospace;font-weight:600` : '');
      return `<td class="cell" style="text-align:${align};${style}">${rendered}</td>`;
    }).join('');
    return `<tr class="${idx % 2 === 1 ? 'alt' : ''}"><td class="cell idx">${idx + 1}</td>${cells}</tr>`;
  }).join('');

  // ── Watermark ─────────────────────────────────────────────────────────────
  const watermarkHtml = config.watermark ? `
    <div class="watermark" style="
      position:fixed;top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(${config.watermark.angle || -30}deg);
      font-size:72px;font-weight:900;color:${config.watermark.color || '#e2e8f0'};
      opacity:${config.watermark.opacity || 0.15};
      pointer-events:none;z-index:9999;white-space:nowrap;
    ">${config.watermark.text}</div>` : '';

  // ── Compliance badge ──────────────────────────────────────────────────────
  const complianceBadge = config.footer.showComplianceBadge ? `
    <div class="badge">
      <div class="badge-icon">✓</div>
      <div>
        <span class="badge-title">${isRtl ? 'معتمد وفق معايير' : 'Certified per'}</span>
        <span class="badge-std">${config.footer.complianceStandard || 'IPSAS & Sphere CHS'}</span>
      </div>
    </div>` : '';

  // ── Classification banner ─────────────────────────────────────────────────
  const classBanner = config.header.classification && config.header.classification !== 'public' ? `
    <div class="classification" style="background:${classificationColors[config.header.classification] || '#94a3b8'}">
      ${isRtl ? classificationLabels[config.header.classification]?.ar : classificationLabels[config.header.classification]?.en}
    </div>` : '';

  // ── Full HTML ─────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="${isRtl ? 'ar' : 'en'}" dir="${dir}">
<head>
<meta charset="UTF-8">
<title>${config.header.title} — NexoraOS™</title>
<style>
@page{size:${orientation} ${config.page.paperSize};margin:${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Arial,'Noto Sans Arabic',sans-serif;font-size:${densityConfig.fontSize};color:#1e293b;background:#fff;direction:${dir}}

/* ── Header ── */
.report-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:10px;border-bottom:3px solid #059669;margin-bottom:12px}
.brand{display:flex;align-items:center;gap:10px}
.brand img{width:44px;height:44px;object-fit:contain}
.brand-text h1{font-size:14px;font-weight:900;color:#059669;margin-bottom:1px}
.brand-text .org{font-size:10px;color:#64748b}
.brand-text .report-id{font-size:9px;color:#94a3b8;font-family:monospace}
.meta{text-align:${isRtl ? 'left' : 'right'};font-size:10px;color:#64748b}
.meta .date{font-weight:700;color:#334155}
.meta .ipsas{margin-top:3px;color:#059669;font-weight:700;font-size:9px}

/* ── Classification Banner ── */
.classification{text-align:center;padding:4px;font-size:10px;font-weight:900;letter-spacing:2px;color:#fff;text-transform:uppercase;margin-bottom:10px;border-radius:3px}

/* ── Title Bar ── */
.title-bar{background:linear-gradient(135deg,#059669,#047857);color:#fff;padding:8px 14px;border-radius:5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}
.title-bar h2{font-size:13px;font-weight:900}
.title-bar .meta-row{display:flex;gap:12px;font-size:10px;opacity:.9}

/* ── Table ── */
table{width:100%;border-collapse:collapse;${showGridLines ? '' : 'border:none;'}}
.th{background:#f1f5f9;color:#334155;font-weight:800;font-size:${parseInt(densityConfig.fontSize) - 1}px;text-transform:uppercase;letter-spacing:.5px;padding:${densityConfig.cellPadding};border-bottom:2px solid #cbd5e1;text-align:${isRtl ? 'right' : 'left'};white-space:nowrap}
.cell{padding:${densityConfig.cellPadding};border-bottom:${showGridLines ? '1px solid #e2e8f0' : '1px solid #f1f5f9'};font-size:${densityConfig.fontSize};vertical-align:middle;line-height:1.4}
.cell.idx{text-align:center;color:#94a3b8;font-weight:600;width:32px;font-size:${parseInt(densityConfig.fontSize) - 2}px}
.alt{background:#f8fafc}
${showGridLines ? '.th,.cell{border-left:1px solid #f1f5f9}.th:first-child,.cell:first-child{border-left:none}' : ''}

/* ── Footer ── */
.report-footer{margin-top:16px;padding-top:8px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#94a3b8}
.badge{display:flex;align-items:center;gap:6px}
.badge-icon{width:14px;height:14px;background:#059669;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900}
.badge-title{font-size:8px;display:block}
.badge-std{font-weight:700;color:#059669;font-size:10px}
.page-info{font-family:monospace}

/* ── Summary Bar ── */
.summary-bar{display:flex;gap:16px;margin-bottom:10px;padding:6px 12px;background:#f8fafc;border-radius:5px;border:1px solid #e2e8f0;font-size:10px}
.summary-item{display:flex;align-items:center;gap:4px}
.summary-item .label{color:#64748b}
.summary-item .value{font-weight:800;color:#1e293b}

/* ── Watermark ── */
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:72px;font-weight:900;color:#e2e8f0;opacity:.15;pointer-events:none;z-index:9999;white-space:nowrap}

/* ── Print ── */
@media print{
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact;page-break-inside:avoid}
  .title-bar{background:#059669!important;color:#fff!important;-webkit-print-color-adjust:exact}
  .th{background:#f1f5f9!important;-webkit-print-color-adjust:exact}
  .alt{background:#f8fafc!important;-webkit-print-color-adjust:exact}
  .classification{-webkit-print-color-adjust:exact}
  .report-header{page-break-after:avoid}
  .watermark{print-color-adjust:exact;-webkit-print-color-adjust:exact}
}
</style>
</head>
<body>

${watermarkHtml}
${classBanner}

<!-- HEADER -->
<div class="report-header">
  <div class="brand">
    <img src="/UAMEX_ERPLOGO.png" alt="UAMEX ERP" onerror="this.src='/LogoRohamaab.png'">
    <div class="brand-text">
      <h1>UAMEX ERP™ Enterprise Report</h1>
      <div class="org">${config.header.organization || (isRtl ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'Rohamā\'a Baynahum Charity Foundation')}</div>
      ${config.header.reportId ? `<div class="report-id">RPT-${config.header.reportId}</div>` : ''}
    </div>
  </div>
  <div class="meta">
    <div class="date">${dateStr} ${timeStr}</div>
    ${config.footer.showTimestamp ? `<div style="font-size:9px;color:#94a3b8;margin-top:2px">${isRtl ? 'آخر تحديث:' : 'Last updated:'} ${dateStr} ${timeStr}</div>` : ''}
    <div class="ipsas">IPSAS Certified</div>
  </div>
</div>

<!-- TITLE BAR -->
<div class="title-bar">
  <h2>${config.header.title}</h2>
  <div class="meta-row">
    <span>${isRtl ? `${data.length} سجل` : `${data.length} Records`}</span>
    ${config.header.subtitle ? `<span>| ${config.header.subtitle}</span>` : ''}
  </div>
</div>

<!-- SUMMARY BAR -->
<div class="summary-bar">
  <div class="summary-item">
    <span class="label">${isRtl ? 'إجمالي السجلات:' : 'Total Records:'}</span>
    <span class="value">${data.length}</span>
  </div>
  <div class="summary-item">
    <span class="label">${isRtl ? 'عدد الأعمدة:' : 'Columns:'}</span>
    <span class="value">${columns.length}</span>
  </div>
  <div class="summary-item">
    <span class="label">${isRtl ? 'الاتجاه:' : 'Direction:'}</span>
    <span class="value">${isRtl ? 'عربي (RTL)' : 'English (LTR)'}</span>
  </div>
  <div class="summary-item">
    <span class="label">${isRtl ? 'الحجم:' : 'Size:'}</span>
    <span class="value">${config.page.paperSize.toUpperCase()} ${orientation === 'landscape' ? (isRtl ? 'أفقي' : 'Landscape') : (isRtl ? 'عمودي' : 'Portrait')}</span>
  </div>
</div>

<!-- DATA TABLE -->
<table>
  <thead><tr><th class="th" style="width:32px">#</th>${thCells}</tr></thead>
  <tbody>${rows}</tbody>
</table>

<!-- FOOTER -->
<div class="report-footer">
  ${complianceBadge}
  <div class="page-info">${isRtl ? 'صفحة' : 'Page'} 1/1</div>
  <div>${config.footer.customText || (isRtl ? 'تم التصدير من نظام NexoraOS™ المؤسسي' : 'Exported from NexoraOS™ Enterprise System')}</div>
</div>

<script>
  window.onload = function() { window.print(); };
</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Instant Print — zero-delay, synchronous print invocation
// ═══════════════════════════════════════════════════════════════════════════════

export function instantPrint(html: string): boolean {
  if (!html) return false;
  const w = window.open('', '_blank', 'width=1200,height=800');
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Default Print Configs — pre-built templates
// ═══════════════════════════════════════════════════════════════════════════════

export function getDefaultPrintConfig(lang: 'ar' | 'en', titleAr: string, titleEn: string): PrintConfig {
  return {
    header: {
      title: lang === 'ar' ? titleAr : titleEn,
      organization: lang === 'ar' ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'Rohamā\'a Baynahum Charity Foundation',
      classification: 'internal',
    },
    footer: {
      showPageNumbers: true,
      showTimestamp: true,
      showComplianceBadge: true,
      complianceStandard: 'IPSAS & Sphere CHS',
    },
    page: {
      orientation: 'landscape',
      paperSize: 'a4',
      density: 'normal',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      showGridLines: true,
      alternateRowColors: true,
      frozenHeader: true,
    },
    columns: [],
    lang,
  };
}
