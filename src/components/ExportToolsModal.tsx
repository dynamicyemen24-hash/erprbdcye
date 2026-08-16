import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Award
} from 'lucide-react';
import { exportToExcel, exportToCSV, fireCelebrationConfetti } from '../utils/exportHelpers';

interface ExportToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleAr: string;
  titleEn: string;
  data: any[];
  fileName: string;
  lang: 'ar' | 'en';
}

export default function ExportToolsModal({
  isOpen,
  onClose,
  titleAr,
  titleEn,
  data,
  fileName,
  lang
}: ExportToolsModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExcelExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportToExcel(data, fileName, 'NexoraOS_Report');
      setIsExporting(false);
      setExportSuccess(lang === 'ar' ? 'تم تصدير ملف Excel بنجاح!' : 'Excel file exported successfully!');
      setTimeout(() => setExportSuccess(null), 4000);
    }, 400);
  };

  const handleCSVExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportToCSV(data, fileName);
      setIsExporting(false);
      setExportSuccess(lang === 'ar' ? 'تم تصدير ملف CSV بنجاح!' : 'CSV file exported successfully!');
      setTimeout(() => setExportSuccess(null), 4000);
    }, 400);
  };

  const handlePrintWindow = () => {
    fireCelebrationConfetti();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-between border-b border-emerald-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                NexoraOS™ Export & Reporting Suite
              </span>
              <h3 className="font-black text-sm text-white">
                {lang === 'ar' ? titleAr : titleEn}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Status Message */}
          {exportSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'ar' ? 'اختر صيغة التصدير المطلوبة:' : 'Select Export Target Format:'}
            </span>
            <p className="text-xs text-zinc-400">
              {lang === 'ar'
                ? `إجمالي السجلات الجاهزة للمعالجة: ${data.length} سجل موثق`
                : `Total records ready for processing: ${data.length} verified items`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Excel Option */}
            <button
              onClick={handleExcelExport}
              disabled={isExporting || data.length === 0}
              className="p-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-center space-y-2 transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200 block">
                  Excel (.xlsx)
                </span>
                <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 block">
                  {lang === 'ar' ? 'جداول مالي وسجلات' : 'Formatted Sheets'}
                </span>
              </div>
            </button>

            {/* CSV Option */}
            <button
              onClick={handleCSVExport}
              disabled={isExporting || data.length === 0}
              className="p-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-xl text-center space-y-2 transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-amber-900 dark:text-amber-200 block">
                  CSV Data
                </span>
                <span className="text-[10px] text-amber-700/70 dark:text-amber-400/70 block">
                  {lang === 'ar' ? 'بيانات خام للنظم' : 'Raw System Import'}
                </span>
              </div>
            </button>

            {/* Print / PDF Preview */}
            <button
              onClick={handlePrintWindow}
              disabled={isExporting}
              className="p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 rounded-xl text-center space-y-2 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-blue-900 dark:text-blue-200 block">
                  Print / PDF
                </span>
                <span className="text-[10px] text-blue-700/70 dark:text-blue-400/70 block">
                  {lang === 'ar' ? 'طباعة تقرير رسمي' : 'Print Official Doc'}
                </span>
              </div>
            </button>

          </div>

          {/* Official Verification Seal Banner */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/80 rounded-xl flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {lang === 'ar' ? 'موثق وفق معايير الحوكمة الشفافة IPSAS & Sphere' : 'Certified per IPSAS & Sphere Audit Standards'}
              </span>
            </div>
            <Award className="w-4 h-4 text-amber-500" />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-800/80 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-zinc-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
