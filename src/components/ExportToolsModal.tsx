import React, { useState, useMemo, useCallback } from 'react';
import {
  X, FileSpreadsheet, FileText, Download, Printer, CheckCircle2, ShieldCheck,
  Award, Settings, ChevronDown, Eye, FileJson, Package, Zap
} from 'lucide-react';
import {
  generatePrintHTML, instantPrint, getDefaultPrintConfig,
  exportToExcel, exportToCSV, exportToJSON, batchExport,
  detectTemplate, templateToPrintConfig,
} from '../core/export';
import type { PrintConfig, ExportFormat, ExportResult, ReportTemplateId } from '../core/export';

interface ExportToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleAr: string;
  titleEn: string;
  data: any[];
  fileName: string;
  lang: 'ar' | 'en';
  tabName?: string;
}

type ExportStatus = 'idle' | 'exporting' | 'done' | 'error';

export default function ExportToolsModal({
  isOpen, onClose, titleAr, titleEn, data, fileName, lang, tabName,
}: ExportToolsModalProps) {
  const isRtl = lang === 'ar';

  // ── State ──────────────────────────────────────────────────────────────────
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [exportHistory, setExportHistory] = useState<ExportResult[]>([]);

  // ── Auto-detect template ───────────────────────────────────────────────────
  const detectedTemplate = useMemo(() => detectTemplate(tabName || '', data), [tabName, data]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateId>(detectedTemplate);

  // ── Build print config ─────────────────────────────────────────────────────
  const printConfig = useMemo((): PrintConfig => {
    const base = templateToPrintConfig(
      { id: selectedTemplate } as any, lang, titleAr, titleEn
    );
    base.page.orientation = orientation;
    base.page.density = density;
    return base;
  }, [selectedTemplate, lang, titleAr, titleEn, orientation, density]);

  const showStatus = useCallback((msg: string, duration = 3000) => {
    setStatusMsg(msg);
    setStatus('done');
    setTimeout(() => { setStatus('idle'); setStatusMsg(''); }, duration);
  }, []);

  if (!isOpen) return null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePrint = () => {
    setStatus('exporting');
    const html = generatePrintHTML(data, printConfig);
    const ok = instantPrint(html);
    if (ok) showStatus(isRtl ? 'تم إرسال التقرير للطابعة' : 'Report sent to printer');
    else showStatus(isRtl ? 'يرجى السماح النوافذ المنبثقة' : 'Please allow pop-ups');
    setStatus('idle');
  };

  const handleExcel = async () => {
    setStatus('exporting');
    const result = await exportToExcel(data, {
      fileName, lang, titleAr, titleEn,
      columns: printConfig.columns,
      sheetName: isRtl ? titleAr : titleEn,
    });
    setExportHistory(prev => [result, ...prev.slice(0, 9)]);
    showStatus(result.success
      ? (isRtl ? 'تم تصدير Excel بنجاح' : 'Excel exported successfully')
      : (isRtl ? 'خطأ في التصدير' : 'Export failed'));
  };

  const handleCSV = async () => {
    setStatus('exporting');
    const result = await exportToCSV(data, { fileName, lang, titleAr, titleEn, columns: printConfig.columns });
    setExportHistory(prev => [result, ...prev.slice(0, 9)]);
    showStatus(result.success
      ? (isRtl ? 'تم تصدير CSV بنجاح' : 'CSV exported successfully')
      : (isRtl ? 'خطأ في التصدير' : 'Export failed'));
  };

  const handleJSON = async () => {
    setStatus('exporting');
    const result = await exportToJSON(data, { fileName, lang, titleAr, titleEn });
    setExportHistory(prev => [result, ...prev.slice(0, 9)]);
    showStatus(result.success
      ? (isRtl ? 'تم تصدير JSON بنجاح' : 'JSON exported successfully')
      : (isRtl ? 'خطأ في التصدير' : 'Export failed'));
  };

  const handleBatch = async () => {
    setStatus('exporting');
    const results = await batchExport(data, ['excel', 'csv', 'json'], {
      fileName, lang, titleAr, titleEn, columns: printConfig.columns,
    });
    setExportHistory(prev => [...results, ...prev].slice(0, 15));
    const ok = results.every(r => r.success);
    showStatus(ok
      ? (isRtl ? `تم تصدير ${results.length} ملفات بنجاح` : `${results.length} files exported`)
      : (isRtl ? 'خطأ في بعض التصديرات' : 'Some exports failed'));
  };

  // ── Template list ──────────────────────────────────────────────────────────
  const templateOptions: { id: ReportTemplateId; ar: string; en: string }[] = [
    { id: 'general', ar: 'تقرير عام', en: 'General' },
    { id: 'finance_ledger', ar: 'دفتر الأستاذ', en: 'Financial Ledger' },
    { id: 'finance_trial_balance', ar: 'ميزان المراجعة', en: 'Trial Balance' },
    { id: 'projects', ar: 'المشاريع', en: 'Projects' },
    { id: 'programs', ar: 'البرامج', en: 'Programs' },
    { id: 'beneficiaries', ar: 'المستفيدون', en: 'Beneficiaries' },
    { id: 'procurement', ar: 'المشتريات', en: 'Procurement' },
    { id: 'hr', ar: 'الموارد البشرية', en: 'HR' },
    { id: 'inventory', ar: 'المخزون', en: 'Inventory' },
    { id: 'audit_log', ar: 'سجل التدقيق', en: 'Audit Log' },
    { id: 'approvals', ar: 'الموافقات', en: 'Approvals' },
    { id: 'sponsorships', ar: 'الكفالات', en: 'Sponsorships' },
    { id: 'sales', ar: 'المبيعات', en: 'Sales' },
    { id: 'strategy_kpi', ar: 'KPI الاستراتيجي', en: 'Strategy KPI' },
  ];

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-between border-b border-emerald-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                NexoraOS™ Export & Reporting Suite
              </span>
              <h3 className="font-black text-sm text-white">{isRtl ? titleAr : titleEn}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">

          {/* Status Banner */}
          {status !== 'idle' && statusMsg && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce ${
              status === 'done'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            }`}>
              {status === 'done' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Zap className="w-4 h-4 shrink-0 animate-pulse" />}
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Record Count */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{isRtl ? `${data.length} سجل جاهز` : `${data.length} records ready`}</span>
            <span className="font-mono text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              {isRtl ? `قوالب: ${selectedTemplate}` : `Template: ${selectedTemplate}`}
            </span>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PRIMARY: Instant Print Button */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <button
            onClick={handlePrint}
            disabled={data.length === 0 || status === 'exporting'}
            className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-600/25"
          >
            <Printer className="w-5 h-5" />
            <span className="font-black text-sm">
              {status === 'exporting' ? (isRtl ? 'جاري...' : 'Processing...') : (isRtl ? 'طباعة مباشرة' : 'Print Now')}
            </span>
          </button>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECONDARY: Export Format Buttons */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleExcel} disabled={data.length === 0 || status === 'exporting'}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer group disabled:opacity-50">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200 block">Excel</span>
                <span className="text-[10px] text-emerald-700/60 dark:text-emerald-400/60 block">.xlsx</span>
              </div>
            </button>

            <button onClick={handleCSV} disabled={data.length === 0 || status === 'exporting'}
              className="p-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer group disabled:opacity-50">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-xs text-amber-900 dark:text-amber-200 block">CSV</span>
                <span className="text-[10px] text-amber-700/60 dark:text-amber-400/60 block">.csv</span>
              </div>
            </button>

            <button onClick={handleJSON} disabled={data.length === 0 || status === 'exporting'}
              className="p-3 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/60 border border-violet-200 dark:border-violet-800/80 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer group disabled:opacity-50">
              <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <FileJson className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-xs text-violet-900 dark:text-violet-200 block">JSON</span>
                <span className="text-[10px] text-violet-700/60 dark:text-violet-400/60 block">.json</span>
              </div>
            </button>

            <button onClick={handleBatch} disabled={data.length === 0 || status === 'exporting'}
              className="p-3 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer group disabled:opacity-50">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Package className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-xs text-sky-900 dark:text-sky-200 block">
                  {isRtl ? 'الكل' : 'All Formats'}
                </span>
                <span className="text-[10px] text-sky-700/60 dark:text-sky-400/60 block">Excel + CSV + JSON</span>
              </div>
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ADVANCED SETTINGS TOGGLE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <button
            onClick={() => setShowAdvanced(p => !p)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>{isRtl ? 'إعدادات متقدمة' : 'Advanced Settings'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ADVANCED SETTINGS PANEL */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {showAdvanced && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200 dark:border-zinc-700/50 rounded-xl animate-in fade-in duration-150">

              {/* Template Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                  {isRtl ? 'قالب التقرير' : 'Report Template'}
                </label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value as ReportTemplateId)}
                  className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-emerald-500/40"
                >
                  {templateOptions.map(t => (
                    <option key={t.id} value={t.id}>{isRtl ? t.ar : t.en}</option>
                  ))}
                </select>
              </div>

              {/* Orientation & Density */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                    {isRtl ? 'الاتجاه' : 'Orientation'}
                  </label>
                  <div className="flex gap-1.5">
                    {(['landscape', 'portrait'] as const).map(o => (
                      <button key={o} onClick={() => setOrientation(o)}
                        className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          orientation === o
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
                        }`}>
                        {o === 'landscape' ? (isRtl ? 'أفقي' : 'Landscape') : (isRtl ? 'عمودي' : 'Portrait')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                    {isRtl ? 'الكثافة' : 'Density'}
                  </label>
                  <div className="flex gap-1.5">
                    {(['compact', 'normal', 'spacious'] as const).map(d => (
                      <button key={d} onClick={() => setDensity(d)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          density === d
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
                        }`}>
                        {d === 'compact' ? (isRtl ? 'ضيق' : 'Compact') : d === 'normal' ? (isRtl ? 'عادي' : 'Normal') : (isRtl ? 'واسع' : 'Spacious')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* EXPORT HISTORY */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {exportHistory.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                {isRtl ? 'سجل التصدير' : 'Export History'}
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {exportHistory.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] py-1 px-2 rounded bg-slate-50 dark:bg-zinc-800/50">
                    <span className="font-mono text-slate-600 dark:text-zinc-300">{r.fileName}</span>
                    <span className={`font-bold ${r.success ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {r.success ? '✓' : '✗'} {r.format.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seal */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/80 rounded-xl flex items-center gap-2 text-[11px] text-slate-600 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{isRtl ? 'موثق وفق معايير الحوكمة IPSAS & Sphere' : 'Certified per IPSAS & Sphere'}</span>
            <Award className="w-4 h-4 text-amber-500 ml-auto shrink-0" />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-800/80 border-t border-slate-200 dark:border-zinc-800 flex justify-end shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-zinc-200 font-bold rounded-xl text-xs transition-colors cursor-pointer">
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
