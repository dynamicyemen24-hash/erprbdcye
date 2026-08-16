import React, { useState } from 'react';
import { X, RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

interface ReverseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  onExecuteReverse: (refNumber: string, reason: string) => void;
}

export default function ReverseEntryModal({
  isOpen,
  onClose,
  lang,
  onExecuteReverse
}: ReverseEntryModalProps) {
  const isRtl = lang === 'ar';
  const [refNumber, setRefNumber] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNumber || !reason) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onExecuteReverse(refNumber, reason);
      setIsSubmitting(false);
      setSuccessMessage(isRtl ? `تم التوليد التلقائي للقيد العكسي بنجاح برقم REV-${refNumber}` : `Reverse entry REV-${refNumber} generated successfully!`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1800);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden space-y-4">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-200" />
            <h3 className="font-black text-sm">{isRtl ? 'إنشاء قيد محاسبي عكسي (IPSAS Reverse Entry)' : 'Generate Reverse Journal Entry'}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-amber-800/40 rounded-lg cursor-pointer">
            <X className="w-4 h-4 text-amber-100" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {successMessage ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{isRtl ? 'تعليمات القيد العكسي المعياري:' : 'Standard Reversal Rules:'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isRtl 
                    ? 'سيقوم النظام بإنشاء قيد عكسي جديد يقوم بعكس جميع أطراف القيد الأصلي (المدين يصبح دائن والعكس) لحفظ التاريخ والتوافق مع IPSAS.' 
                    : 'System will generate a mirror opposite entry (Debit ↔ Credit) preserving original GL audit history.'
                  }
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {isRtl ? 'رقم القيد أو السند المراد عكسه (Ref Number):' : 'Original Voucher Reference Number:'}
                </label>
                <input
                  type="text"
                  required
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder={isRtl ? 'مثال: JV-2026-0042' : 'e.g. JV-2026-0042'}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {isRtl ? 'مبرر وأسباب العكس والتصحيح:' : 'Reversal Rationale & Audit Note:'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={isRtl ? 'اكتب مبرر العكس بالتفصيل ليتم تضمينه في تقرير التدقيق...' : 'Enter formal justification for external audit record...'}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                />
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isRtl ? 'جاري العكس...' : 'Generating...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إنشاء وتوثيق القيد العكسي' : 'Post Reverse Entry'}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </form>

      </div>
    </div>
  );
}
