import React from 'react';
import { Sparkles, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { Tooltip } from '../Tooltip';

interface ExecutiveSummaryModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  summaryOutput: string | null;
  lang: 'ar' | 'en';
  orgName?: string;
  onClose: () => void;
  onRetry: () => void;
}

export const ExecutiveSummaryModal: React.FC<ExecutiveSummaryModalProps> = ({
  isOpen,
  isLoading,
  error,
  summaryOutput,
  lang,
  orgName,
  onClose,
  onRetry
}) => {
  if (!isOpen) return null;

  const renderFormattedText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part}</strong>;
      }
      return part;
    });
  };

  const parseMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-black text-slate-800 dark:text-zinc-100 mt-4 mb-2 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-1">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-5 mb-2.5">
            {trimmed.replace('## ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-lg font-black text-emerald-700 dark:text-emerald-500 mt-6 mb-3.5">
            {trimmed.replace('# ', '')}
          </h2>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        return (
          <li key={idx} className="text-xs md:text-sm text-slate-600 dark:text-zinc-300 ml-4 mr-4 list-disc mb-1.5 leading-relaxed">
            {renderFormattedText(content)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s/, '');
        return (
          <li key={idx} className="text-xs md:text-sm text-slate-600 dark:text-zinc-300 ml-4 mr-4 list-decimal mb-1.5 leading-relaxed">
            {renderFormattedText(content)}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs md:text-sm text-slate-600 dark:text-zinc-300 mb-2 leading-relaxed">
          {renderFormattedText(line)}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-fade-in" id="executive-summary-modal">
      <div 
        className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {lang === 'ar' ? 'تقرير الملخص التنفيذي الذكي لـ NexoraOS™' : 'NexoraOS™ Executive Summary'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {orgName}
              </p>
            </div>
          </div>
          <Tooltip 
            content={lang === 'ar' ? 'إغلاق نافذة التقرير' : 'Close report window'}
            position="bottom"
          >
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-500" />
                <span>
                  {lang === 'ar' 
                    ? 'يجري الآن تحليل بيانات المشاريع، وتدقيق النفقات المالية، وتجميع مؤشرات الأداء الحالية لـ NexoraOS™...' 
                    : 'Analyzing project data, auditing financial expenditures, and compiling active KPIs via NexoraOS™...'}
                </span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-zinc-900 rounded-md w-3/4"></div>
              <div className="h-4 bg-slate-100 dark:bg-zinc-900 rounded-md w-5/6"></div>
              <div className="h-4 bg-slate-100 dark:bg-zinc-900 rounded-md w-1/2"></div>
              <div className="space-y-2 pt-4">
                <div className="h-3 bg-slate-100 dark:bg-zinc-900 rounded-md w-full"></div>
                <div className="h-3 bg-slate-100 dark:bg-zinc-900 rounded-md w-full"></div>
                <div className="h-3 bg-slate-100 dark:bg-zinc-900 rounded-md w-2/3"></div>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl flex flex-col gap-3">
              <div className="flex gap-2.5 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold">
                    {lang === 'ar' ? 'تعذّر إنشاء التقرير' : 'Report Generation Failed'}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    {lang === 'ar'
                      ? 'لم يتمكن النظام من إنشاء الملخص التنفيذي في الوقت الحالي. يرجى التحقق من الاتصال بالشبكة والمحاولة مرة أخرى.'
                      : 'The system could not generate the executive summary at this time. Please check your network connection and try again.'}
                  </p>
                </div>
              </div>
              <button
                onClick={onRetry}
                className="self-end px-3 py-1.5 text-xs font-black text-rose-700 hover:text-white hover:bg-rose-600 dark:text-rose-400 dark:hover:text-white dark:hover:bg-rose-900 border border-rose-300 dark:border-rose-800 rounded-lg transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </button>
            </div>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-zinc-300 space-y-2">
              {summaryOutput ? parseMarkdown(summaryOutput) : (
                <p className="text-xs text-slate-400 dark:text-zinc-500 text-center">
                  {lang === 'ar' ? 'لا يوجد محتوى متاح.' : 'No content available.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800/80 flex justify-between items-center bg-slate-50 dark:bg-zinc-900/30 shrink-0">
          <p className="text-[10px] text-slate-400 dark:text-zinc-500">
            {lang === 'ar' 
              ? 'مُنتج تلقائياً بواسطة محرك الذكاء الاصطناعي لـ NexoraOS™' 
              : 'Automatically compiled by NexoraOS™ AI engine'}
          </p>
          <div className="flex gap-2">
            {summaryOutput && !isLoading && (
              <Tooltip 
                content={lang === 'ar' ? 'نسخ كامل نص التقرير التنفيذي إلى الحافظة لاستخدامه خارج المنصة' : 'Copy the entire executive report text to the clipboard for external use'}
                position="top"
              >
                <button
                  onClick={() => {
                    if (summaryOutput) {
                      navigator.clipboard.writeText(summaryOutput);
                      const btn = document.getElementById('copy-summary-btn');
                      if (btn) {
                        const origText = btn.innerText;
                        btn.innerText = lang === 'ar' ? 'تم النسخ ✓' : 'Copied ✓';
                        btn.className = btn.className.replace('text-slate-700', 'text-emerald-600').replace('dark:text-zinc-200', 'dark:text-emerald-400');
                        setTimeout(() => {
                          btn.innerText = origText;
                          btn.className = btn.className.replace('text-emerald-600', 'text-slate-700').replace('dark:text-emerald-400', 'dark:text-zinc-200');
                        }, 2000);
                      }
                    }
                  }}
                  id="copy-summary-btn"
                  className="px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg shadow-3xs transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'نسخ التقرير' : 'Copy Summary'}
                </button>
              </Tooltip>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-extrabold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
