import React, { useState } from 'react';
import { AlertTriangle, UserCheck, ShieldCheck, CheckCircle2, X, Eye } from 'lucide-react';
import { Anomaly } from '../core/services/anomalyDetection';

interface AnomalyAlertDockProps {
  anomalies: Anomaly[];
  lang: 'ar' | 'en';
  onReview?: (entryId: string) => void;
}

export default function AnomalyAlertDock({ anomalies, lang, onReview }: AnomalyAlertDockProps) {
  const isRtl = lang === 'ar';
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const activeAnomalies = anomalies.filter(a => !reviewedIds.has(a.entryId));

  // If no anomalies exist, display an authoritative and reassuring IPSAS verification status
  if (activeAnomalies.length === 0) {
    return (
      <div className="bg-emerald-50/90 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl p-4 mb-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <span>{isRtl ? 'التدقيق الذكي IPSAS: سلامة القيود والمعاملات المالية' : 'IPSAS Intelligent Audit: Transactions Verified'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </h4>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              {isRtl 
                ? 'كافة معاملات وقيود اليومية العامة متوازنة ومطابقة للضوابط المحاسبية وسقوف الصرف المعتمدة دون انحرافات شاذة.' 
                : 'All journal entries and ledger disbursements conform to internal controls with zero abnormal variances.'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-mono font-bold shrink-0">
          {isRtl ? 'سليم 100%' : '100% VERIFIED'}
        </span>
      </div>
    );
  }

  const handleReviewClick = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    onReview?.(anomaly.entryId);
  };

  const handleConfirmAuditReview = (entryId: string) => {
    setReviewedIds(prev => new Set(prev).add(entryId));
    setSelectedAnomaly(null);
  };

  return (
    <>
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-amber-200/60 dark:border-amber-800/40 pb-2">
          <h3 className="text-amber-800 dark:text-amber-300 font-black text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{isRtl ? 'تنبيهات الرقابة المالية: معاملات تستوجب التحقق' : 'Financial Governance Alerts: Items Requiring Verification'}</span>
          </h3>
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-md font-mono">
            {activeAnomalies.length} {isRtl ? 'حالات للمراجعة' : 'Audit Items'}
          </span>
        </div>

        <div className="space-y-2">
          {activeAnomalies.map(anomaly => (
            <div 
              key={anomaly.entryId} 
              className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-amber-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[10px] font-bold rounded">
                    {anomaly.voucherNumber || anomaly.entryId}
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                    {anomaly.amount.toLocaleString()} {anomaly.currency || 'YER'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 font-medium">
                  {isRtl ? (anomaly.reasonAr || anomaly.reason) : anomaly.reason}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleReviewClick(anomaly)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'مراجعة وتدقيق' : 'Review & Audit'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? 'محضر تدقيق المعاملة المالية' : 'Transaction Audit Review'}</span>
              </h4>
              <button 
                onClick={() => setSelectedAnomaly(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl space-y-1.5">
                <div className="text-zinc-400 text-[10px] font-bold">{isRtl ? 'رقم السند المرجعي:' : 'Voucher Ref:'}</div>
                <div className="font-mono font-black text-slate-800 dark:text-zinc-200">{selectedAnomaly.voucherNumber}</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl space-y-1.5">
                <div className="text-zinc-400 text-[10px] font-bold">{isRtl ? 'المبلغ الإجمالي المسجل:' : 'Recorded Amount:'}</div>
                <div className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                  {selectedAnomaly.amount.toLocaleString()} {selectedAnomaly.currency || 'YER'}
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                <div className="text-amber-800 dark:text-amber-300 font-bold text-[10px]">{isRtl ? 'ملاحظة الذكاء الاصطناعي:' : 'AI Diagnostic:'}</div>
                <div className="text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                  {isRtl ? (selectedAnomaly.reasonAr || selectedAnomaly.reason) : selectedAnomaly.reason}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleConfirmAuditReview(selectedAnomaly.entryId)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isRtl ? 'اعتماد ومطابقة القيد' : 'Verify & Approve'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
