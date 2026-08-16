import React from 'react';
import { Coins } from 'lucide-react';

interface HRPayrollIPSASViewProps {
  lang: 'ar' | 'en';
}

export default function HRPayrollIPSASView({ lang }: HRPayrollIPSASViewProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            <span>{isRtl ? 'مسير المرتبات والربط المالي والمحاسبي' : 'Compensation & Financial Payroll Ledger'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {isRtl ? 'إغلاق فترة الرواتب، حساب البدلات والاستقطاعات، والترحيل التلقائي لدفتر الأستاذ العام' : 'Payroll run validation, automated allowances/deductions calculation, and IPSAS double-entry ledger posting.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-mono font-bold">
            {isRtl ? 'فترة أغسطس 2026 | مغلقة ومتزنة' : 'FY2026-M08 | Locked & Balanced'}
          </span>
          <button className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
            {isRtl ? 'اعتماد وترحيل المسير' : 'Post Payroll Ledger'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
        <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'ملخص الحركة المحاسبية للرواتب' : 'IPSAS Double-Entry Payroll Summary'}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <span className="text-[10px] text-slate-400 block">{isRtl ? 'إجمالي الأجور الأساسية (Debit)' : 'Gross Salary Debit'}</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">$12,500.00</span>
          </div>
          <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <span className="text-[10px] text-slate-400 block">{isRtl ? 'إجمالي البدلات والمكافآت (Debit)' : 'Allowances Debit'}</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">$1,750.00</span>
          </div>
          <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <span className="text-[10px] text-slate-400 block">{isRtl ? 'صافي الحسابات الجارية البنكية (Credit)' : 'Net Bank Payable Credit'}</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">$14,250.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
