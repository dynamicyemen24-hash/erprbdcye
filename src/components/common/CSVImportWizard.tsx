import React, { useState, useMemo, useRef } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../design-system/components/Modal';
import { Stepper } from '../../design-system/components/Stepper';
import { EmptyState } from '../../design-system/components/EmptyState';
import { parseCSV, autoMapColumns, validateRows, downloadCsvTemplate, type ImportFieldDef } from '../../lib/csv';

export interface ImportResult {
  ok: number;
  failed: { index: number; error: string }[];
}

interface CSVImportWizardProps {
  open: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  title: string;
  titleAr?: string;
  fields: ImportFieldDef[];
  templateFilename?: string;
  maxRows?: number;
  onImportRows: (
    rows: Record<string, unknown>[],
    onProgress: (done: number, total: number) => void
  ) => Promise<ImportResult>;
  onComplete?: (result: ImportResult) => void;
}

type Step = 0 | 1 | 2 | 3 | 4;

export default function CSVImportWizard({
  open,
  onClose,
  lang,
  title,
  titleAr,
  fields,
  templateFilename = 'template.csv',
  maxRows = 2000,
  onImportRows,
  onComplete,
}: CSVImportWizardProps) {
  const isRtl = lang === 'ar';
  const [step, setStep] = useState<Step>(0);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<(string | null)[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const requiredKeys = useMemo(() => fields.filter((f) => f.required).map((f) => f.key), [fields]);

  const reset = () => {
    setStep(0);
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping([]);
    setParseError(null);
    setImporting(false);
    setProgress({ done: 0, total: 0 });
    setResult(null);
  };

  const handleClose = () => {
    if (importing) return;
    reset();
    onClose();
  };

  const loadFile = async (file: File) => {
    setParseError(null);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.headers.length === 0) {
        throw new Error(isRtl ? 'الملف فارغ أو لا يحتوي ترويسة أعمدة' : 'File is empty or has no header row');
      }
      if (parsed.rows.length > maxRows) {
        throw new Error(
          isRtl ? `تجاوز الحد الأقصى (${maxRows} صف)` : `Exceeds the ${maxRows}-row limit`
        );
      }
      setFileName(file.name);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(autoMapColumns(parsed.headers, fields));
      setStep(1);
    } catch (err: any) {
      setParseError(err.message);
    }
  };

  const validated = useMemo(
    () => (headers.length > 0 ? validateRows(headers, rows, mapping, fields, lang) : []),
    [headers, rows, mapping, fields, lang]
  );
  const validRows = useMemo(() => validated.filter((r) => r.errors.length === 0), [validated]);
  const invalidRows = useMemo(() => validated.filter((r) => r.errors.length > 0), [validated]);
  const unmappedRequired = requiredKeys.filter((k) => !mapping.includes(k));

  const canProceedFromMap = unmappedRequired.length === 0;
  const canImport = validRows.length > 0 && !importing;

  const startImport = async () => {
    setImporting(true);
    setProgress({ done: 0, total: validRows.length });
    try {
      const res = await onImportRows(
        validRows.map((r) => r.mapped),
        (done, total) => setProgress({ done, total })
      );
      setResult(res);
      setStep(4);
      onComplete?.(res);
    } finally {
      setImporting(false);
    }
  };

  const nextIcon = isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />;

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) handleClose(); }} size="lg">
      <ModalHeader
        subtitle={isRtl ? `${rows.length} صفوف من ${fileName || '—'}` : `${rows.length} rows from ${fileName || '—'}`}
      >
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          {isRtl ? titleAr || title : title}
        </div>
      </ModalHeader>

      <ModalBody>
        <Stepper
          steps={[
            { id: 'upload', titleAr: 'رفع الملف', titleEn: 'Upload' },
            { id: 'map', titleAr: 'مطابقة الأعمدة', titleEn: 'Map columns' },
            { id: 'review', titleAr: 'المراجعة والتحقق', titleEn: 'Review' },
            { id: 'import', titleAr: 'الاستيراد', titleEn: 'Import' },
            { id: 'done', titleAr: 'النتيجة', titleEn: 'Done' },
          ]}
          currentStep={step}
          lang={lang}
        />

        {/* STEP 0 — Upload */}
        {step === 0 && (
          <div className="space-y-4 pt-2">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void loadFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
              aria-label={isRtl ? 'اختر ملف CSV' : 'Choose CSV file'}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-zinc-700 hover:border-emerald-400 hover:bg-emerald-50/40'
              }`}
            >
              <Upload className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-black text-slate-800 dark:text-white">
                {isRtl ? 'اسحب ملف CSV هنا أو انقر للاختيار' : 'Drag a CSV file here or click to browse'}
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-1">
                {isRtl ? `بترميز UTF-8 — بحد أقصى ${maxRows} صف` : `UTF-8 encoded — up to ${maxRows} rows`}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void loadFile(f);
                  e.target.value = '';
                }}
              />
            </div>
            {parseError && (
              <p role="alert" className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />{parseError}
              </p>
            )}
            <button
              type="button"
              onClick={() => downloadCsvTemplate(templateFilename, fields.map((f) => f.key))}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {isRtl ? 'تحميل قالب CSV جاهز' : 'Download CSV template'}
            </button>
          </div>
        )}

        {/* STEP 1 — Column mapping */}
        {step === 1 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-500 font-bold">
              {isRtl ? 'طابق كل عمود في ملفك مع حقل النظام (الحقول الإلزامية مميزة بـ *)' : 'Match each file column to a system field (required fields marked *)'}
            </p>
            {unmappedRequired.length > 0 && (
              <p role="alert" className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {isRtl ? `حقول إلزامية بلا مطابقة: ${unmappedRequired.join('، ')}` : `Unmapped required fields: ${unmappedRequired.join(', ')}`}
              </p>
            )}
            <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 min-w-0 truncate font-mono font-bold bg-slate-100 dark:bg-zinc-800 rounded-lg px-2.5 py-2" dir="ltr">{h}</span>
                  <ArrowRight className={`w-4 h-4 shrink-0 text-slate-400 ${isRtl ? 'rotate-180' : ''}`} />
                  <select
                    value={mapping[i] || ''}
                    onChange={(e) => {
                      const next = [...mapping];
                      next[i] = e.target.value || null;
                      setMapping(next);
                    }}
                    aria-label={`${isRtl ? 'مطابقة العمود' : 'Map column'} ${h}`}
                    className="flex-1 min-w-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{isRtl ? '— تجاهل العمود —' : '— Ignore column —'}</option>
                    {fields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {isRtl ? f.labelAr || f.label : f.label}{f.required ? ' *' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Review */}
        {(step === 2 || step === 3) && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-black">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                {isRtl ? `${validRows.length} صفوف صالحة` : `${validRows.length} valid rows`}
              </span>
              {invalidRows.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600">
                  {isRtl ? `${invalidRows.length} صفوف مرفوضة` : `${invalidRows.length} rejected rows`}
                </span>
              )}
            </div>

            {step === 3 && (
              <div className="space-y-2">
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden" role="progressbar" aria-valuenow={progress.done} aria-valuemin={0} aria-valuemax={progress.total}>
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: progress.total > 0 ? `${Math.round((progress.done / progress.total) * 100)}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-slate-500 font-bold text-center" aria-live="polite">
                  {isRtl ? `جارٍ الاستيراد... ${progress.done}/${progress.total}` : `Importing... ${progress.done}/${progress.total}`}
                </p>
              </div>
            )}

            <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-800">
                    <tr>
                      <th className="p-2 text-start font-black text-slate-500">#</th>
                      {fields.filter((f) => mapping.includes(f.key)).map((f) => (
                        <th key={f.key} className="p-2 text-start font-black text-slate-500">
                          {isRtl ? f.labelAr || f.label : f.label}
                        </th>
                      ))}
                      <th className="p-2 text-start font-black text-slate-500">{isRtl ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {validated.slice(0, 50).map((r) => (
                      <tr key={r.index} className={r.errors.length > 0 ? 'bg-rose-50/50 dark:bg-rose-950/10' : ''}>
                        <td className="p-2 font-mono text-slate-400">{r.index}</td>
                        {fields.filter((f) => mapping.includes(f.key)).map((f) => (
                          <td key={f.key} className="p-2 font-bold text-slate-700 dark:text-zinc-300 max-w-[160px] truncate">
                            {String(r.mapped[f.key] ?? r.values[f.key] ?? '—')}
                          </td>
                        ))}
                        <td className="p-2">
                          {r.errors.length > 0 ? (
                            <span className="text-rose-600 font-bold" title={r.errors.join('؛ ')}>✕ {r.errors.length}</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {validated.length > 50 && (
                <p className="p-2 text-center text-[11px] text-slate-400 font-bold border-t border-slate-100 dark:border-zinc-800">
                  {isRtl ? `عرض أول 50 من ${validated.length} صفاً` : `Showing first 50 of ${validated.length} rows`}
                </p>
              )}
            </div>

            {invalidRows.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer font-black text-rose-600">
                  {isRtl ? 'عرض أسباب الرفض' : 'Show rejection reasons'}
                </summary>
                <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {invalidRows.slice(0, 20).map((r) => (
                    <li key={r.index} className="text-slate-600 dark:text-zinc-400">
                      <span className="font-mono font-bold">#{r.index}:</span> {r.errors.join('؛ ')}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* STEP 4 — Done */}
        {step === 4 && result && (
          <div className="pt-2">
            {result.failed.length === 0 ? (
              <EmptyState
                variant="empty"
                titleAr="اكتمل الاستيراد بنجاح"
                title="Import completed"
                descriptionAr={`تم استيراد ${result.ok} صفوف بنجاح`}
                description={`${result.ok} rows imported successfully`}
                icon={<CheckCircle2 className="w-8 h-8" />}
                lang={lang}
              />
            ) : (
              <div className="space-y-3">
                <div className="p-4 border border-amber-200 dark:border-amber-900 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 text-xs font-bold text-amber-700 dark:text-amber-300">
                  {isRtl
                    ? `نجح ${result.ok} وفشل ${result.failed.length} — راجع الأخطاء أدناه`
                    : `${result.ok} succeeded, ${result.failed.length} failed — see below`}
                </div>
                <ul className="space-y-1 max-h-48 overflow-y-auto text-xs">
                  {result.failed.slice(0, 30).map((f) => (
                    <li key={f.index} className="text-slate-600 dark:text-zinc-400">
                      <span className="font-mono font-bold">#{f.index}:</span> {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center gap-2 w-full">
          {step === 0 && (
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
          )}
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                {isRtl ? 'رجوع' : 'Back'}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedFromMap}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isRtl ? 'مراجعة الصفوف' : 'Review rows'}{nextIcon}
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={importing}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isRtl ? 'رجوع للمطابقة' : 'Back to mapping'}
              </button>
              <button
                type="button"
                onClick={() => { setStep(3); void startImport(); }}
                disabled={!canImport}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isRtl ? `استيراد ${validRows.length} صفاً` : `Import ${validRows.length} rows`}{nextIcon}
              </button>
            </>
          )}
          {step === 3 && (
            <p className="w-full text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isRtl ? 'لا تغلق النافذة أثناء الاستيراد...' : 'Keep this dialog open while importing...'}
            </p>
          )}
          {step === 4 && (
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer"
            >
              {isRtl ? 'إغلاق' : 'Close'}
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
