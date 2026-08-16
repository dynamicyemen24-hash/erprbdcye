import React, { useState } from 'react';
import { 
  Zap, 
  RotateCcw, 
  CheckCircle2, 
  Layers, 
  Coins, 
  Building2, 
  FolderGit2, 
  Clock, 
  Sliders, 
  Play, 
  ShieldCheck, 
  Sparkles,
  ArrowRightLeft,
  CheckSquare,
  AlertCircle
} from 'lucide-react';

interface BatchLedgerAutomationEngineProps {
  lang: 'ar' | 'en';
}

export default function BatchLedgerAutomationEngine({ lang }: BatchLedgerAutomationEngineProps) {
  const isRtl = lang === 'ar';

  const [isExecutingBatch, setIsExecutingBatch] = useState(false);
  const [lastBatchStatus, setLastBatchStatus] = useState<'IDLE' | 'SUCCESS' | 'RUNNING'>('IDLE');

  // Scheduled Batch Jobs Config
  const [autoPostPayroll, setAutoPostPayroll] = useState(true);
  const [autoPostInventory, setAutoPostInventory] = useState(true);
  const [autoRevalueCurrencies, setAutoRevalueCurrencies] = useState(true);
  const [autoAllocateWbs, setAutoAllocateWbs] = useState(true);

  const runBatchProcessing = () => {
    setIsExecutingBatch(true);
    setLastBatchStatus('RUNNING');

    setTimeout(() => {
      setIsExecutingBatch(false);
      setLastBatchStatus('SUCCESS');
    }, 2500);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
      
      {/* ENGINE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{isRtl ? 'محرك الأتمتة والمعالجة المجمعة المتكاملة (Batch & Multi-Entity Ledger Engine)' : 'Enterprise Batch Automation & Multi-Entity Ledger Engine'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isRtl ? 'أتمتة القيود الجماعية، إعادة تقويم العملات، الربط بأنشطة WBS ومراكز التكلفة آلياً' : 'Automated batch posting, currency revaluations, and WBS/Cost-Center auto-allocations.'}
            </p>
          </div>
        </div>

        <button
          onClick={runBatchProcessing}
          disabled={isExecutingBatch}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isExecutingBatch ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>{isRtl ? 'جاري تنفيذ المعالجة الجماعية...' : 'Executing Batch Jobs...'}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{isRtl ? 'تشغيل الدفعة المجمعة الآن (Run Batch Jobs)' : 'Execute Batch Jobs Now'}</span>
            </>
          )}
        </button>
      </div>

      {/* BATCH STATUS NOTIFICATION */}
      {lastBatchStatus === 'SUCCESS' && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{isRtl ? 'تمت المعالجة الجماعية بنجاح: تم ترحيل 42 قيد يومية، إعادة تقويم 3 عملات، وربط 18 نشاط WBS.' : 'Batch processing completed: 42 GL vouchers posted, 3 currencies revalued, 18 WBS activities updated.'}</span>
          </div>
          <span className="font-mono text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg">
            2026-08-13 02:17 OK
          </span>
        </div>
      )}

      {/* AUTOMATION MATRIX & PIPELINES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* PIPELINE 1: MULTI-CURRENCY TRIANGULATION */}
        <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'محرك تعدد العملات والمقاصة' : 'Multi-Currency Triangulation'}</span>
            </h4>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-mono font-bold rounded">Live Rates</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <span>USD ➡️ YER</span>
              <span className="font-bold text-emerald-600">1 USD = 535.00 YER</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <span>SAR ➡️ YER</span>
              <span className="font-bold text-emerald-600">1 SAR = 142.50 YER</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <span>EUR ➡️ USD</span>
              <span className="font-bold text-blue-600">1 EUR = 1.085 USD</span>
            </div>
          </div>
        </div>

        {/* PIPELINE 2: WBS & COST CENTER ALLOCATION */}
        <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-purple-600" />
              <span>{isRtl ? 'ربط WBS ومراكز التكلفة' : 'WBS & Cost Center Allocation'}</span>
            </h4>
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 text-[9px] font-mono font-bold rounded">Auto Link</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                <span>مركز تكلفة: CC-101 (حفر آبار تعز)</span>
                <span className="text-purple-600 font-mono">100%</span>
              </div>
              <p className="text-[10px] text-slate-400">مربوط بنشاط WBS: WBS-2026-WASH-04</p>
            </div>

            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                <span>مركز تكلفة: CC-204 (كفالة أيتام الحديدة)</span>
                <span className="text-purple-600 font-mono">100%</span>
              </div>
              <p className="text-[10px] text-slate-400">مربوط بنشاط WBS: WBS-2026-ORPH-01</p>
            </div>
          </div>
        </div>

        {/* PIPELINE 3: SCHEDULED BATCH JOBS CONFIG */}
        <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{isRtl ? 'جدولة المهام الدورية الآلية' : 'Scheduled Batch Jobs'}</span>
            </h4>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-mono font-bold rounded">Cron Active</span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <span className="font-bold text-slate-700 dark:text-zinc-300">{isRtl ? 'ترحيل مسير المرتبات آلياً' : 'Auto-Post HR Payroll'}</span>
              <input
                type="checkbox"
                checked={autoPostPayroll}
                onChange={(e) => setAutoPostPayroll(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <span className="font-bold text-slate-700 dark:text-zinc-300">{isRtl ? 'ترحيل حركات صرف المخزون' : 'Auto-Post Inventory Issues'}</span>
              <input
                type="checkbox"
                checked={autoPostInventory}
                onChange={(e) => setAutoPostInventory(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <span className="font-bold text-slate-700 dark:text-zinc-300">{isRtl ? 'إعادة تقويم فروق العملات شهرياً' : 'Monthly FX Revaluations'}</span>
              <input
                type="checkbox"
                checked={autoRevalueCurrencies}
                onChange={(e) => setAutoRevalueCurrencies(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>
          </div>
        </div>

      </div>

    </div>
  );
}
