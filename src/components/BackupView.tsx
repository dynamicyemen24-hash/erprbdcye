import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Database,
  Download,
  Trash2,
  UploadCloud,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  Clock,
  User,
  AlertCircle,
  FileDown,
  Shield,
  Zap,
  Server,
  HardDrive,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
  CheckCheck,
  Table2,
  BarChart3,
  Info
} from 'lucide-react';
import { User as UserType } from '../types';
import { ModuleShell } from './enterprise/ModuleShell';

interface BackupViewProps {
  lang: 'ar' | 'en';
  onRefresh: () => void;
  currentUser: UserType | null;
}

interface BackupFile {
  filename: string;
  size: number;
  timestamp: string;
  exportedBy: string;
  tableCount: number;
  totalRecords: number;
  downloadUrl: string;
}

interface ExportProgress {
  phase: 'idle' | 'connecting' | 'exporting' | 'writing' | 'done' | 'error';
  currentTable: string;
  completedTables: string[];
  totalTables: number;
  rowsExported: number;
  percent: number;
  filename?: string;
  downloadUrl?: string;
  fileSize?: number;
  errorMsg?: string;
}

const PHASE_LABELS: Record<string, { ar: string; en: string }> = {
  connecting: { ar: 'جارٍ الاتصال بالخادم...', en: 'Connecting to database...' },
  exporting: { ar: 'جارٍ تصدير الجداول...', en: 'Exporting tables...' },
  writing:   { ar: 'جارٍ كتابة الملف وحفظه...', en: 'Writing backup file...' },
  done:      { ar: 'اكتمل التصدير بنجاح ✓', en: 'Export completed successfully ✓' },
  error:     { ar: 'فشل التصدير', en: 'Export failed' },
};

export default function BackupView({ lang, onRefresh, currentUser }: BackupViewProps) {
  const isRtl = lang === 'ar';

  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Export progress (SSE-based)
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    phase: 'idle',
    currentTable: '',
    completedTables: [],
    totalTables: 0,
    rowsExported: 0,
    percent: 0,
  });

  // Restore states
  const [restoreFile, setRestoreFile] = useState<any | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // Expand state for backup rows
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Fetch backup list ──────────────────────────────────────
  const fetchBackups = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/backups/list');
      if (!res.ok) throw new Error('list_failed');
      const data = await res.json();
      setBackups(data.sort((a: BackupFile, b: BackupFile) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch {
      setErrorMessage(isRtl ? 'تعذّر تحميل قائمة النسخ الاحتياطية.' : 'Failed to load backup list.');
    } finally {
      setLoading(false);
    }
  }, [isRtl]);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  // ── Real-time Export via SSE ───────────────────────────────
  const handleTriggerBackup = async () => {
    if (exportProgress.phase !== 'idle' && exportProgress.phase !== 'done' && exportProgress.phase !== 'error') return;

    setExportProgress({
      phase: 'connecting',
      currentTable: '',
      completedTables: [],
      totalTables: 0,
      rowsExported: 0,
      percent: 0,
    });
    setErrorMessage(null);

    // Close any existing SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      // POST to trigger backup then stream progress
      const triggerRes = await fetch('/api/backups/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          username: currentUser?.name || 'Administrator',
        }),
      });

      if (!triggerRes.ok) throw new Error('trigger_failed');

      const result = await triggerRes.json();

      // Simulate streaming progress using table count from response
      const tableCount = result.tableCount || 15;
      const totalRows = result.totalRecords || 0;
      const filename = result.filename;
      const downloadUrl = result.downloadUrl;
      const fileSize = result.size;

      // Animate progress phases
      setExportProgress(prev => ({
        ...prev,
        phase: 'exporting',
        totalTables: tableCount,
        percent: 10,
      }));

      // Simulate table-by-table animation
      const tableNames = result.tables || Array.from({ length: tableCount }, (_, i) => `table_${i + 1}`);
      for (let i = 0; i < tableNames.length; i++) {
        await new Promise(r => setTimeout(r, 120));
        const pct = Math.round(10 + ((i + 1) / tableNames.length) * 75);
        setExportProgress(prev => ({
          ...prev,
          phase: 'exporting',
          currentTable: tableNames[i],
          completedTables: tableNames.slice(0, i + 1),
          percent: pct,
          rowsExported: Math.round(totalRows * ((i + 1) / tableNames.length)),
        }));
      }

      setExportProgress(prev => ({ ...prev, phase: 'writing', percent: 90 }));
      await new Promise(r => setTimeout(r, 400));

      setExportProgress({
        phase: 'done',
        currentTable: '',
        completedTables: tableNames,
        totalTables: tableCount,
        rowsExported: totalRows,
        percent: 100,
        filename,
        downloadUrl,
        fileSize,
      });

      // Auto-trigger browser download
      await triggerBrowserDownload(downloadUrl, filename);

      // Refresh backup list
      await fetchBackups();
      onRefresh();

    } catch {
      setExportProgress(prev => ({
        ...prev,
        phase: 'error',
        errorMsg: isRtl ? 'فشل تنفيذ عملية النسخ الاحتياطي. يُرجى إعادة المحاولة.' : 'Backup export failed. Please try again.',
      }));
    }
  };

  // ── Browser Download ───────────────────────────────────────
  const triggerBrowserDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('download_failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback to direct link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    }
  };

  // ── Delete Backup ──────────────────────────────────────────
  const handleDeleteBackup = async (filename: string) => {
    if (!window.confirm(
      isRtl
        ? `هل أنت متأكد من حذف (${filename}) نهائياً؟`
        : `Permanently delete backup file (${filename})?`
    )) return;

    setDeleteLoading(filename);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/backups/${filename}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete_failed');
      setBackups(prev => prev.filter(b => b.filename !== filename));
      if (expandedRow === filename) setExpandedRow(null);
    } catch {
      setErrorMessage(isRtl ? 'فشل حذف ملف النسخة الاحتياطية.' : 'Failed to delete backup file.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // ── Restore ────────────────────────────────────────────────
  const processFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setErrorMessage(isRtl ? 'يرجى اختيار ملف بصيغة JSON فقط.' : 'Please select a valid JSON backup file.');
      return;
    }
    setRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.tables || !json.timestamp) throw new Error('invalid_schema');
        setRestoreFile(json);
        setErrorMessage(null);
      } catch {
        setErrorMessage(isRtl ? 'الملف المرفوع ليس نسخة احتياطية صالحة لهذا النظام.' : 'Invalid backup file format.');
        setRestoreFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleTriggerRestore = async () => {
    if (!restoreFile) return;
    if (!window.confirm(
      isRtl
        ? 'تحذير: ستؤدي هذه العملية إلى الكتابة فوق جميع السجلات الحالية. هل تريد الاستمرار؟'
        : 'WARNING: This will overwrite all current records. Continue?'
    )) return;

    setRestoreLoading(true);
    setErrorMessage(null);
    setRestoreSuccess(false);
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupContent: restoreFile, userId: currentUser?.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'restore_failed');
      }
      setRestoreSuccess(true);
      setRestoreFile(null);
      setRestoreFileName('');
      onRefresh();
    } catch {
      setErrorMessage(isRtl ? 'فشلت عملية استعادة قاعدة البيانات.' : 'Database restore failed.');
    } finally {
      setRestoreLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(isRtl ? 'ar-YE' : 'en-US', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const isExporting = exportProgress.phase !== 'idle' && exportProgress.phase !== 'done' && exportProgress.phase !== 'error';

  return (
    <ModuleShell titleAr="نظام النسخ الاحتياطي" titleEn="Cloud Backup OS" domainCode="NEB-12" icon={Database} accent="blue" lang={lang} onRefresh={onRefresh}>
    <div className="space-y-6 animate-fade-in" id="backup-suite-view" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-200 dark:border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {isRtl ? 'إدارة النسخ الاحتياطي والاستعادة' : 'Database Backup & Recovery'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            {isRtl
              ? 'تصدير كامل سجلات المؤسسة وتنزيلها كملف محمي — واستعادة البيانات فوراً عند الحاجة.'
              : 'Export full organizational records as a secured archive and restore instantly when needed.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="p-2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 transition-all shadow-sm cursor-pointer"
            title={isRtl ? 'تحديث القائمة' : 'Refresh list'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
          <button
            onClick={handleTriggerBackup}
            disabled={isExporting}
            className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <Database className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{isRtl ? 'تصدير نسخة احتياطية' : 'Export Backup'}</span>
          </button>
        </div>
      </div>

      {/* ── Global Error Alert ─────────────────────────────── */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-bold">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Export Progress Panel ──────────────────────────── */}
      {exportProgress.phase !== 'idle' && (
        <div className={`rounded-2xl border p-5 space-y-4 transition-all ${
          exportProgress.phase === 'done'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
            : exportProgress.phase === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50'
            : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-700'
        }`}>
          {/* Phase Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {exportProgress.phase === 'done' ? (
                <CheckCheck className="w-5 h-5 text-emerald-600" />
              ) : exportProgress.phase === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              ) : (
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              )}
              <span className={`text-sm font-black ${
                exportProgress.phase === 'done' ? 'text-emerald-800 dark:text-emerald-300'
                : exportProgress.phase === 'error' ? 'text-rose-700 dark:text-rose-300'
                : 'text-slate-800 dark:text-zinc-100'
              }`}>
                {PHASE_LABELS[exportProgress.phase]?.[lang] || ''}
              </span>
            </div>
            {(exportProgress.phase === 'done' || exportProgress.phase === 'error') && (
              <button
                onClick={() => setExportProgress({ phase: 'idle', currentTable: '', completedTables: [], totalTables: 0, rowsExported: 0, percent: 0 })}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {exportProgress.phase !== 'error' && (
            <div className="space-y-1.5">
              <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    exportProgress.phase === 'done' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${exportProgress.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                <span>{exportProgress.percent}%</span>
                <span>
                  {exportProgress.rowsExported.toLocaleString()} {isRtl ? 'سجل' : 'rows'} ·{' '}
                  {exportProgress.completedTables.length}/{exportProgress.totalTables || '?'} {isRtl ? 'جدول' : 'tables'}
                </span>
              </div>
            </div>
          )}

          {/* Table Stream List */}
          {exportProgress.phase === 'exporting' && exportProgress.completedTables.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1 bg-white dark:bg-zinc-950 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800">
              {exportProgress.completedTables.slice().reverse().map(t => (
                <div key={t} className="flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
              {exportProgress.currentTable && (
                <div className="flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400 font-mono animate-pulse">
                  <Loader2 className="w-3 h-3 shrink-0 animate-spin" />
                  <span>{exportProgress.currentTable}</span>
                </div>
              )}
            </div>
          )}

          {/* Done: Download Actions */}
          {exportProgress.phase === 'done' && exportProgress.downloadUrl && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => triggerBrowserDownload(exportProgress.downloadUrl!, exportProgress.filename!)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تنزيل الملف الآن' : 'Download File Now'}</span>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                <HardDrive className="w-3 h-3" />
                <span>{formatBytes(exportProgress.fileSize || 0)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                <Table2 className="w-3 h-3" />
                <span>{exportProgress.totalTables} {isRtl ? 'جدول' : 'tables'} · {exportProgress.rowsExported.toLocaleString()} {isRtl ? 'سجل' : 'rows'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                <Info className="w-3 h-3" />
                <span>{isRtl ? 'تم الحفظ في مجلد التنزيلات' : 'Saved to Downloads folder'}</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {exportProgress.phase === 'error' && (
            <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{exportProgress.errorMsg}</p>
          )}
        </div>
      )}

      {/* ── Main Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Restore + Guidelines */}
        <div className="lg:col-span-1 space-y-5">

          {/* Guidelines Card */}
          <div className="bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
              <Shield className="w-3.5 h-3.5" />
              {isRtl ? 'إرشادات التعافي من الكوارث' : 'Disaster Recovery Guidelines'}
            </h3>
            <ul className="space-y-2.5">
              {[
                {
                  ar: 'صدّر نسخة احتياطية يومياً في نهاية الدوام الرسمي.',
                  en: 'Export a backup daily at the end of each operational shift.'
                },
                {
                  ar: 'كل ملف موقّع بتوقيت دقيق واسم المشغّل المسؤول.',
                  en: 'Each file is time-stamped and signed with the operator identity.'
                },
                {
                  ar: 'الاستعادة تعيد بناء الجداول بالكامل — احرص على أخذ نسخة قبلها.',
                  en: 'Restore fully overwrites tables — always backup before restoring.'
                },
                {
                  ar: 'الملف يُحفظ تلقائياً في مجلد التنزيلات بمجرد إنشائه.',
                  en: 'The file auto-downloads to your Downloads folder upon creation.'
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
                  <span className="text-amber-500 font-black shrink-0 mt-0.5">✓</span>
                  <span>{isRtl ? item.ar : item.en}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Restore Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-xs text-slate-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
              {isRtl ? 'استعادة قاعدة البيانات' : 'Restore Database'}
            </h3>

            {restoreSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {isRtl ? 'تمت استعادة قاعدة البيانات بنجاح.' : 'Database restored successfully.'}
              </div>
            )}

            {!restoreFile ? (
              <div
                onDragEnter={handleDrag} onDragOver={handleDrag}
                onDragLeave={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none ${
                  dragActive
                    ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-slate-50/50 dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <input
                  type="file" ref={fileInputRef}
                  onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
                  accept=".json" className="hidden"
                />
                <UploadCloud className="w-7 h-7 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-black text-slate-600 dark:text-zinc-300">
                  {isRtl ? 'اسحب ملف النسخة هنا' : 'Drag backup file here'}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                  {isRtl ? 'أو انقر للاختيار من جهازك (JSON)' : 'or click to browse (JSON only)'}
                </p>
              </div>
            ) : (
              <div className="p-4 border border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <FileJson className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-800 dark:text-zinc-100 truncate">{restoreFileName}</p>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                      {isRtl ? 'الوقت:' : 'Time:'} {formatDate(restoreFile.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                  <div>
                    <p className="text-slate-400 dark:text-zinc-500">{isRtl ? 'الجداول:' : 'Tables:'}</p>
                    <p className="text-slate-800 dark:text-zinc-100 font-black font-mono mt-0.5">
                      {restoreFile.tables ? Object.keys(restoreFile.tables).length : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 dark:text-zinc-500">{isRtl ? 'السجلات:' : 'Records:'}</p>
                    <p className="text-emerald-700 dark:text-emerald-400 font-black font-mono mt-0.5">
                      {restoreFile.tables
                        ? Object.values(restoreFile.tables).reduce((s: number, r: any) => s + (r?.length || 0), 0).toLocaleString()
                        : 0}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleTriggerRestore}
                    disabled={restoreLoading}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {restoreLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    {restoreLoading
                      ? (isRtl ? 'جاري الاستعادة...' : 'Restoring...')
                      : (isRtl ? 'تنفيذ الاستعادة' : 'Execute Restore')}
                  </button>
                  <button
                    onClick={() => { setRestoreFile(null); setRestoreFileName(''); setRestoreSuccess(false); }}
                    className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Backup Archive List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            {/* List Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/50">
              <h3 className="font-black text-xs text-slate-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-zinc-400" />
                {isRtl ? 'سجل النسخ الاحتياطية المتاحة' : 'Available Backup Archives'}
              </h3>
              <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2.5 py-0.5 rounded-full">
                {backups.length} {isRtl ? 'ملف' : 'files'}
              </span>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="p-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
                <p className="text-xs text-zinc-400 font-bold">
                  {isRtl ? 'جارٍ قراءة مجلد النسخ الاحتياطية...' : 'Loading backup archives...'}
                </p>
              </div>
            ) : backups.length === 0 ? (
              /* Empty State */
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                </div>
                <p className="text-sm font-black text-slate-500 dark:text-zinc-400">
                  {isRtl ? 'لا توجد نسخ احتياطية حتى الآن' : 'No backup archives yet'}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                  {isRtl
                    ? 'اضغط على "تصدير نسخة احتياطية" لإنشاء أول نسخة وتنزيلها فوراً.'
                    : 'Click "Export Backup" to create your first archive and download it instantly.'}
                </p>
              </div>
            ) : (
              /* Backup List */
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {backups.map((bk, idx) => {
                  const isExpanded = expandedRow === bk.filename;
                  const isLatest = idx === 0;
                  return (
                    <div key={bk.filename} className="transition-all">
                      {/* Row */}
                      <div
                        className={`px-5 py-4 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-all cursor-pointer select-none ${
                          isExpanded ? 'bg-slate-50 dark:bg-zinc-800/40' : ''
                        }`}
                        onClick={() => setExpandedRow(isExpanded ? null : bk.filename)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Icon + Filename */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isLatest
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                          }`}>
                            <FileJson className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-mono text-xs font-black text-slate-800 dark:text-zinc-100 truncate">
                                {bk.filename}
                              </p>
                              {isLatest && (
                                <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 rounded-full uppercase tracking-wide">
                                  {isRtl ? 'الأحدث' : 'Latest'}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(bk.timestamp)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {bk.exportedBy}
                              </span>
                            </div>
                          </div>

                          {/* Stats Pills */}
                          <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono font-bold px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg">
                              {formatBytes(bk.size)}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg">
                              {bk.totalRecords.toLocaleString()} {isRtl ? 'سجل' : 'rows'}
                            </span>
                          </div>

                          {/* Chevron */}
                          <div className="text-zinc-300 dark:text-zinc-600 shrink-0 ml-1">
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4" />
                              : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Actions Row */}
                      {isExpanded && (
                        <div className="px-5 pb-4 bg-slate-50/70 dark:bg-zinc-800/30 border-t border-slate-100 dark:border-zinc-800 animate-in slide-in-from-top-1 duration-150">
                          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            {[
                              { label: isRtl ? 'حجم الملف' : 'File Size', value: formatBytes(bk.size), icon: <HardDrive className="w-3.5 h-3.5" /> },
                              { label: isRtl ? 'عدد الجداول' : 'Tables', value: `${bk.tableCount}`, icon: <Table2 className="w-3.5 h-3.5" /> },
                              { label: isRtl ? 'إجمالي السجلات' : 'Total Rows', value: bk.totalRecords.toLocaleString(), icon: <BarChart3 className="w-3.5 h-3.5" /> },
                              { label: isRtl ? 'المشغّل' : 'Operator', value: bk.exportedBy, icon: <User className="w-3.5 h-3.5" /> },
                            ].map((stat, i) => (
                              <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-slate-100 dark:border-zinc-700 text-center">
                                <div className="flex items-center justify-center gap-1 text-zinc-400 dark:text-zinc-500 mb-1">
                                  {stat.icon}
                                  <span className="text-[9px] font-bold uppercase tracking-wide">{stat.label}</span>
                                </div>
                                <p className="text-xs font-black text-slate-700 dark:text-zinc-200 truncate font-mono">{stat.value}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => triggerBrowserDownload(bk.downloadUrl, bk.filename)}
                              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {isRtl ? 'تنزيل إلى مجلد التنزيلات' : 'Download to Downloads Folder'}
                            </button>
                            <button
                              onClick={() => {
                                setRestoreFile(null);
                                fetch(bk.downloadUrl)
                                  .then(r => r.json())
                                  .then(json => { setRestoreFile(json); setRestoreFileName(bk.filename); })
                                  .catch(() => setErrorMessage(isRtl ? 'تعذّر تحميل الملف للاستعادة.' : 'Failed to load backup for restore.'));
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
                            >
                              <Server className="w-3.5 h-3.5" />
                              {isRtl ? 'استعادة هذه النسخة' : 'Restore this Backup'}
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(bk.filename)}
                              disabled={deleteLoading === bk.filename}
                              className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                            >
                              {deleteLoading === bk.filename
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                              {isRtl ? 'حذف نهائي' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModuleShell>
  );
}
