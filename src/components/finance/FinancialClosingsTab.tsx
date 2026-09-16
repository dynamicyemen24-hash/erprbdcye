import React, { useState } from 'react';
import { Sliders, CheckCircle, AlertCircle, RefreshCw, Scale, Lock, Unlock, Calendar, ShieldCheck } from 'lucide-react';
import { Account, Transaction } from './FinanceTypes';
import { generateNumericCode } from '../../lib/idGenerator';
import { Spinner } from '../../design-system/components/Spinner';

interface MonthlyPeriod {
  id: number;
  nameAr: string;
  nameEn: string;
  isLocked: boolean;
  closingDate?: string;
  closedBy?: string;
}

const INITIAL_MONTHS: MonthlyPeriod[] = [
  { id: 1, nameAr: 'يناير', nameEn: 'January', isLocked: true, closingDate: '2026-01-31', closedBy: 'مدير الحسابات' },
  { id: 2, nameAr: 'فبراير', nameEn: 'February', isLocked: true, closingDate: '2026-02-28', closedBy: 'مدير الحسابات' },
  { id: 3, nameAr: 'مارس', nameEn: 'March', isLocked: false },
  { id: 4, nameAr: 'أبريل', nameEn: 'April', isLocked: false },
  { id: 5, nameAr: 'مايو', nameEn: 'May', isLocked: false },
  { id: 6, nameAr: 'يونيو', nameEn: 'June', isLocked: false },
  { id: 7, nameAr: 'يوليو', nameEn: 'July', isLocked: false },
  { id: 8, nameAr: 'أغسطس', nameEn: 'August', isLocked: false },
  { id: 9, nameAr: 'سبتمبر', nameEn: 'September', isLocked: false },
  { id: 10, nameAr: 'أكتوبر', nameEn: 'October', isLocked: false },
  { id: 11, nameAr: 'نوفمبر', nameEn: 'November', isLocked: false },
  { id: 12, nameAr: 'ديسمبر', nameEn: 'December', isLocked: false },
];

interface FinancialClosingsTabProps {
  accounts: Account[];
  lang: 'ar' | 'en';
  onRefresh: () => void;
}

export default function FinancialClosingsTab({ accounts, lang, onRefresh }: FinancialClosingsTabProps) {
  const [fiscalYear, setFiscalYear] = useState('2026');
  const [retainedEarningsId, setRetainedEarningsId] = useState('');
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [monthlyPeriods, setMonthlyPeriods] = useState<MonthlyPeriod[]>(INITIAL_MONTHS);

  const toggleMonthStatus = (monthId: number) => {
    setMonthlyPeriods(prev => prev.map(m => {
      if (m.id === monthId) {
        const willLock = !m.isLocked;
        return {
          ...m,
          isLocked: willLock,
          closingDate: willLock ? new Date().toISOString().split('T')[0] : undefined,
          closedBy: willLock ? (lang === 'ar' ? 'المسؤول المالي' : 'Finance Officer') : undefined
        };
      }
      return m;
    }));
  };

  const equityAccounts = accounts.filter(a => a.account_type === 'EQUITY');
  const revenueAccounts = accounts.filter(a => a.account_type === 'REVENUE' && parseFloat(String(a.current_balance)) !== 0);
  const expenseAccounts = accounts.filter(a => a.account_type === 'EXPENSE' && parseFloat(String(a.current_balance)) !== 0);

  const totalRevenues = revenueAccounts.reduce((sum, a) => sum + parseFloat(String(a.current_balance || 0)), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + parseFloat(String(a.current_balance || 0)), 0);
  const netProfitLoss = totalRevenues - totalExpenses;

  const handleClosePeriod = async () => {
    setMessage(null);
    if (!retainedEarningsId) {
      setMessage({
        type: 'error',
        text: lang === 'ar' ? 'يرجى اختيار حساب الأرباح والخسائر المدورة.' : 'Please select the Retained Earnings account.'
      });
      return;
    }

    setClosing(true);
    try {
      // 1. Create the Closing Transaction
      const txRes = await fetch('/api/tables/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_number: `CL-${fiscalYear}-${generateNumericCode(1000, 9999)}`,
          transaction_date: new Date().toISOString().split('T')[0],
          transaction_type: 'CLOSING',
          description: lang === 'ar' 
            ? `قيد الإقفال السنوي للحسابات المؤقتة للسنة المالية ${fiscalYear}` 
            : `Annual period-closing journal entry for FY ${fiscalYear}`,
          total_debit: totalRevenues + (netProfitLoss < 0 ? Math.abs(netProfitLoss) : 0),
          total_credit: totalExpenses + (netProfitLoss > 0 ? netProfitLoss : 0),
          is_posted: true,
          branch_code: 'HQ',
          security_level: 4
        })
      });

      if (!txRes.ok) throw new Error('Failed to post closing header');
      const txResult = await txRes.json();

      // 2. Post closing transaction lines for each account to make its balance 0
      let lineNum = 1;

      // Revenue lines (Debit each revenue to make balance 0)
      for (const rev of revenueAccounts) {
        const bal = parseFloat(String(rev.current_balance));
        await fetch('/api/tables/transaction_lines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: txResult.id,
            line_number: lineNum++,
            account_id: rev.id,
            account_code: rev.account_code,
            description: `${lang === 'ar' ? 'إقفال حساب' : 'Closing account'} ${rev.name_ar}`,
            debit_amount: bal,
            credit_amount: 0,
            currency_code: 'YER'
          })
        });

        // Reset the account balance in DB to 0
        await fetch(`/api/tables/chart_of_accounts/${rev.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_balance: 0 })
        });
      }

      // Expense lines (Credit each expense to make balance 0)
      for (const exp of expenseAccounts) {
        const bal = parseFloat(String(exp.current_balance));
        await fetch('/api/tables/transaction_lines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: txResult.id,
            line_number: lineNum++,
            account_id: exp.id,
            account_code: exp.account_code,
            description: `${lang === 'ar' ? 'إقفال حساب مصروف' : 'Closing expense account'} ${exp.name_ar}`,
            debit_amount: 0,
            credit_amount: bal,
            currency_code: 'YER'
          })
        });

        // Reset the account balance in DB to 0
        await fetch(`/api/tables/chart_of_accounts/${exp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_balance: 0 })
        });
      }

      // 3. Post to Retained earnings equity account
      const selectedRetained = accounts.find(a => a.id === retainedEarningsId);
      if (selectedRetained) {
        await fetch('/api/tables/transaction_lines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: txResult.id,
            line_number: lineNum++,
            account_id: selectedRetained.id,
            account_code: selectedRetained.account_code,
            description: lang === 'ar' ? `ترحيل الأرباح والخسائر للفترة ${fiscalYear}` : `Posting net surplus/deficit for FY ${fiscalYear}`,
            debit_amount: netProfitLoss < 0 ? Math.abs(netProfitLoss) : 0,
            credit_amount: netProfitLoss > 0 ? netProfitLoss : 0,
            currency_code: 'YER'
          })
        });

        const currentBal = parseFloat(String(selectedRetained.current_balance || 0));
        // Add profit (credit) or subtract loss (debit) from retained earnings
        const nextBal = currentBal + netProfitLoss; 
        await fetch(`/api/tables/chart_of_accounts/${selectedRetained.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_balance: nextBal })
        });
      }

      setMessage({
        type: 'success',
        text: lang === 'ar' 
          ? `تم إقفال السنة المالية ${fiscalYear} بنجاح! تم تصفير حسابات الإيرادات والمصروفات وترحيل صافي الرصيد إلى الأرباح المدورة.` 
          : `Fiscal year ${fiscalYear} successfully closed! Revenue & Expense accounts zeroed and transferred to Equity.`
      });
      onRefresh();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Error processing financial closing.'
      });
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-6">
      {/* Tab Header */}
      <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3">
        <div>
          <h3 className="font-black text-sm text-slate-800 dark:text-zinc-100">
            {lang === 'ar' ? 'إجراءات الإقفال المالي السنوي والدوري' : 'Annual & Period Financial Closings'}
          </h3>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
            {lang === 'ar' 
              ? 'إقفال حسابات قائمة الدخل (إيرادات ومصاريف) والتحكم بحالة الفترات المحاسبية الشهرية.' 
              : 'Zeroes out temporary ledger accounts, posts net equity, and controls monthly period locking.'}
          </p>
        </div>
        <Sliders className="w-5 h-5 text-amber-500" />
      </div>

      {/* Monthly Period Control Grid (Jan - Dec) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100">
              {lang === 'ar' ? `حالة الفترات المحاسبية الشهرية (${fiscalYear})` : `Monthly Accounting Periods Status (${fiscalYear})`}
            </h4>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            {lang === 'ar' ? 'إقفال الشهر يمنع التعديل والترحيل بالتواريخ السابقة' : 'Locking prevents backdated entries'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {monthlyPeriods.map((period) => (
            <div
              key={period.id}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                period.isLocked
                  ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-300/50 dark:border-amber-600/30'
                  : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-300/50 dark:border-emerald-600/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800 dark:text-zinc-100">
                  {lang === 'ar' ? period.nameAr : period.nameEn}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                  period.isLocked
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {period.isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  <span>{period.isLocked ? (lang === 'ar' ? 'مغلق' : 'Locked') : (lang === 'ar' ? 'مفتوح' : 'Open')}</span>
                </span>
              </div>

              {period.isLocked && period.closingDate && (
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mb-2 truncate">
                  {period.closingDate} {period.closedBy ? `• ${period.closedBy}` : ''}
                </p>
              )}

              <button
                type="button"
                onClick={() => toggleMonthStatus(period.id)}
                className={`w-full py-1 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  period.isLocked
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-400/40'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40'
                }`}
              >
                {period.isLocked ? (
                  <>
                    <Unlock className="w-2.5 h-2.5" />
                    <span>{lang === 'ar' ? 'فتح الفترة' : 'Unlock Period'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-2.5 h-2.5" />
                    <span>{lang === 'ar' ? 'إقفال الفترة' : 'Lock Period'}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Annual Closing Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black block uppercase">
            {lang === 'ar' ? 'السنة المالية المستهدفة' : 'Target Fiscal Year'}
          </label>
          <input
            type="text"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black block uppercase">
            {lang === 'ar' ? 'حساب الأرباح المدورة (الملكية)*' : 'Retained Earnings (Equity)*'}
          </label>
          <select
            value={retainedEarningsId}
            onChange={(e) => setRetainedEarningsId(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
          >
            <option value="">{lang === 'ar' ? '--- اختر حساب ملكية للأرباح ---' : '--- Select Retained Earnings Account ---'}</option>
            {equityAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.account_code} - {lang === 'ar' ? acc.name_ar : acc.name_en}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleClosePeriod}
            disabled={closing || (revenueAccounts.length === 0 && expenseAccounts.length === 0)}
            className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {closing ? (
              <Spinner size="sm" />
            ) : (
              <Scale className="w-4 h-4" />
            )}
            <span>{lang === 'ar' ? 'ترحيل وإقفال السنة المالية' : 'Execute Period Closing'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
            {lang === 'ar' ? 'ملخص الحسابات قبل الإقفال' : 'Accounts Closing Summary'}
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400 font-bold">{lang === 'ar' ? 'إجمالي الإيرادات المفتوحة:' : 'Open Revenues:'}</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{totalRevenues.toLocaleString()} YER</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400 font-bold">{lang === 'ar' ? 'إجمالي المصروفات المفتوحة:' : 'Open Expenses:'}</span>
              <span className="font-mono font-black text-rose-600 dark:text-rose-400">{totalExpenses.toLocaleString()} YER</span>
            </div>
            <div className="border-t border-slate-200 dark:border-zinc-800 pt-2 flex justify-between font-black">
              <span className="text-slate-700 dark:text-zinc-200">{lang === 'ar' ? 'صافي أرباح (خسائر) العام:' : 'Net Surplus/Deficit:'}</span>
              <span className={`font-mono text-sm ${netProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {netProfitLoss.toLocaleString()} YER
              </span>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-col justify-center items-center text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <h5 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100">{lang === 'ar' ? 'تدشين وحفظ النشاط المحاسبي' : 'Accounting Integrity Notice'}</h5>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold px-4 leading-relaxed">
            {lang === 'ar' 
              ? 'إن عملية الإقفال المالي نهائية وتقوم بتصفير كافة الأرصدة الإيرادية والمصروفية، يرجى مراجعة ميزان المراجعة بالكامل قبل التنفيذ.'
              : 'Executing period closing will zero out revenue & expense ledgers. Reconcile trial balance first.'}
          </p>
        </div>
      </div>
    </div>
  );
}
