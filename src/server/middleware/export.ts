/**
 * NexoraOS™ — Export Engine (PDF + Excel)
 * Server-side report generation with Arabic support
 */

import { Request, Response } from 'express';
import { ReportExportEngine } from '../engines/reporting.engine';
import { extractTenantId } from '../core/helpers';
import { escapeHtml } from '../../lib/htmlSanitizer';

// ─── PDF Export ────────────────────────────────────────

export async function exportPDF(req: Request, res: Response) {
  try {
    const orgId = extractTenantId(req);
    const { reportType } = req.params;

    const report = await ReportExportEngine.generateReport(orgId, reportType, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      projectId: req.query.projectId as string,
    });

    // Generate HTML for PDF
    const html = generateReportHTML(report);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.html"`);

    // Wrap in print-friendly HTML
    res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(report.title || report.titleEn || 'Report')}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Kufi Arabic', sans-serif; direction: rtl; padding: 20px; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 3px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { width: 80px; height: 80px; margin: 0 auto 10px; }
          .org-name { font-size: 18px; font-weight: bold; color: #059669; }
          .report-title { font-size: 22px; font-weight: bold; margin: 10px 0; color: #1a1a1a; }
          .meta { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
          th { background: #059669; color: white; padding: 8px 12px; text-align: right; }
          td { padding: 6px 12px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          .summary { display: flex; gap: 20px; flex-wrap: wrap; margin: 15px 0; }
          .summary-card { flex: 1; min-width: 150px; background: #f0fdf4; border: 1px solid #059669; border-radius: 8px; padding: 12px; text-align: center; }
          .summary-card .value { font-size: 24px; font-weight: bold; color: #059669; }
          .summary-card .label { font-size: 12px; color: #666; }
          .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="org-name">جمعية رُحماء بينهم للعمل الإنساني والتنمية</div>
          <div class="report-title">${escapeHtml(report.title || report.titleEn || 'Report')}</div>
          <div class="meta">${report.titleEn || ''} | ${report.generatedAt || new Date().toISOString()}</div>
        </div>
        ${html}
        <div class="footer">
          NexoraOS™ Intelligent Enterprise Operating System | Generated: ${new Date().toLocaleString('ar-YE')}
        </div>
      </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── Excel Export ──────────────────────────────────────

export async function exportExcel(req: Request, res: Response) {
  try {
    const orgId = extractTenantId(req);
    const { reportType } = req.params;

    const report = await ReportExportEngine.generateReport(orgId, reportType, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      projectId: req.query.projectId as string,
    });

    // Generate CSV-compatible Excel
    const csv = generateCSV(report);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel Arabic support
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ─── HTML Generator ────────────────────────────────────

function generateReportHTML(report: any): string {
  let html = '';

  if (report.summary) {
    html += '<div class="summary">';
    for (const [key, value] of Object.entries(report.summary)) {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      html += `<div class="summary-card"><div class="value">${escapeHtml(String(value))}</div><div class="label">${escapeHtml(label)}</div></div>`;
    }
    html += '</div>';
  }

  // Dynamic tables
  for (const [key, value] of Object.entries(report)) {
    if (Array.isArray(value) && value.length > 0) {
      const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      html += `<h3 style="margin: 15px 0 5px; color: #059669;">${title}</h3>`;
      html += '<table>';
      html += '<tr>' + Object.keys(value[0] as object).map(k => '<th>' + escapeHtml(k) + '</th>').join('') + '</tr>';
      for (const row of value as any[]) {
        html += '<tr>' + Object.values(row).map(v => '<td>' + escapeHtml(String(v ?? '')) + '</td>').join('') + '</tr>';
      }
      html += '</table>';
    }
  }

  return html || '<p>No data available</p>';
}

// ─── CSV Generator ─────────────────────────────────────

function generateCSV(report: any): string {
  let csv = '';

  for (const [key, value] of Object.entries(report)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      csv += `\n${title}\n`;
      const headers = Object.keys(value[0] as object);
      csv += headers.join(',') + '\n';
      for (const row of value as any[]) {
        csv += headers.map(h => `"${String((row as any)[h] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
      }
      csv += '\n';
    }
  }

  return csv || 'No data';
}
