import React, { useState } from 'react';
import { FileText, TrendingUp, Building, Scale, Printer } from 'lucide-react';
import { Account } from './FinanceTypes';
import PrintPDFTemplateModal from '../reports/PrintPDFTemplateModal';

interface FinancialStatementsTabProps {
  accounts: Account[];
  lang: 'ar' | 'en';
}

export default function FinancialStatementsTab({ accounts, lang }: FinancialStatementsTabProps) {
  const [statementType, setStatementType] = useState<'trial' | 'income' | 'balance_sheet'>('trial');
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

  // Compute Statement Totals
  const totalRevenues = accounts.filter(a => a.account_type === 'REVENUE').reduce((s, a) => s + parseFloat(String(a.current_balance || 0)), 0);
  const totalExpenses = accounts.filter(a => a.account_type === 'EXPENSE').reduce((s, a) => s + parseFloat(String(a.current_balance || 0)), 0);
  const netIncome = totalRevenues - totalExpenses;

  const totalAssets = accounts.filter(a => a.account_type === 'ASSET').reduce((s, a) => s + parseFloat(String(a.current_balance || 0)), 0);
  const totalLiabilities = accounts.filter(a => a.account_type === 'LIABILITY').reduce((s, a) => s + parseFloat(String(a.current_balance || 0)), 0);
  const totalEquity = accounts.filter(a => a.account_type === 'EQUITY').reduce((s, a) => s + parseFloat(String(a.current_balance || 0)), 0);

  const liabilityAndEquityAndProfit = totalLiabilities + totalEquity + netIncome;
  const isBalanceSheetBalanced = Math.abs(totalAssets - liabilityAndEquityAndProfit) < 0.1;

  return (
    <div className="space-y-6">
      {/* Selector Subtabs & Print Action */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setStatementType('trial')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              statementType === 'trial' ? 'bg-zinc-900 text-amber-400' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{lang === 'ar' ? 'ميزان المراجعة (Trial Balance)' : 'Trial Balance'}</span>
          </button>

          <button
            onClick={() => setStatementType('income')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              statementType === 'income' ? 'bg-zinc-900 text-amber-400' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{lang === 'ar' ? 'قائمة الدخل (Income Statement)' : 'Income Statement'}</span>
          </button>

          <button
            onClick={() => setStatementType('balance_sheet')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              statementType === 'balance_sheet' ? 'bg-zinc-900 text-amber-400' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>{lang === 'ar' ? 'الميزانية والمركز المالي (Balance Sheet)' : 'Balance Sheet'}</span>
          </button>
        </div>

        <button
          onClick={() => setIsPDFModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center gap-2 cursor-pointer transition-all"
        >
          <Printer className="w-4 h-4 text-amber-300" />
          <span>{lang === 'ar' ? 'طباعة وتصدير القائمة المالية (PDF)' : 'Print / Export PDF Statement'}</span>
        </button>
      </div>

      {/* RENDER STATEMENTS */}
      {statementType === 'trial' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-100 p-4">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'ميزان المراجعة بالمجاميع والأرصدة' : 'Trial Balance (Sums & Balances)'}</span>
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
              {lang === 'ar' ? 'تطابق الحسابات وتدقيق توازن الدفاتر المحاسبية العامة.' : 'Reconciliation check proving totals & balances equality across the whole ledger.'}
            </p>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse" style={{ textAlign: lang === 'en' ? 'left' : 'right' }}>
              <thead>
                <tr className="bg-zinc-900 text-emerald-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                  <th className="p-3 w-28">{lang === 'ar' ? 'رقم الحساب' : 'Account Code'}</th>
                  <th className="p-3">{lang === 'ar' ? 'اسم الحساب في الدليل' : 'Account Name'}</th>
                  <th className="p-3 text-right w-32">{lang === 'ar' ? 'أرصدة مدينة' : 'Debit Bal'}</th>
                  <th className="p-3 text-right w-32">{lang === 'ar' ? 'أرصدة دائنة' : 'Credit Bal'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono font-semibold">
                {accounts.filter(a => parseFloat(String(a.current_balance)) !== 0).map(acc => {
                  const bal = parseFloat(String(acc.current_balance));
                  const isDebit = acc.account_type === 'ASSET' || acc.account_type === 'EXPENSE';
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">{acc.account_code}</td>
                      <td className="p-3 font-sans text-slate-900">{lang === 'ar' ? acc.name_ar : acc.name_en}</td>
                      <td className="p-3 text-right text-rose-600">{isDebit ? bal.toLocaleString() : '-'}</td>
                      <td className="p-3 text-right text-emerald-600">{!isDebit ? bal.toLocaleString() : '-'}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-100 font-black text-slate-900 border-t border-slate-300">
                  <td colSpan={2} className="p-3 text-center">{lang === 'ar' ? 'إجمالي الأرصدة المتطابقة' : 'Balanced Totals'}</td>
                  <td className="p-3 text-right text-rose-600">
                    {accounts.reduce((sum, a) => sum + ((a.account_type === 'ASSET' || a.account_type === 'EXPENSE') ? parseFloat(String(a.current_balance)) : 0), 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-emerald-600">
                    {accounts.reduce((sum, a) => sum + ((a.account_type !== 'ASSET' && a.account_type !== 'EXPENSE') ? parseFloat(String(a.current_balance)) : 0), 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {statementType === 'income' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'تفصيل الإيرادات والأرباح' : 'Operating Revenue Summary'}</span>
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {accounts.filter(a => a.account_type === 'REVENUE').map(acc => (
                  <div key={acc.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-50 last:border-0 font-semibold">
                    <span className="text-slate-700">{lang === 'ar' ? acc.name_ar : acc.name_en}</span>
                    <span className="font-mono text-emerald-600 font-bold">{parseFloat(String(acc.current_balance)).toLocaleString()} YER</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-emerald-50 border-t border-emerald-100 font-black text-xs flex justify-between">
              <span>{lang === 'ar' ? 'مجموع الإيرادات:' : 'Total Revenues:'}</span>
              <span className="font-mono text-emerald-700">{totalRevenues.toLocaleString()} YER</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                  <span>{lang === 'ar' ? 'تفصيل المصروفات والبرامج' : 'Operating Expenses & Grants'}</span>
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {accounts.filter(a => a.account_type === 'EXPENSE').map(acc => (
                  <div key={acc.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-50 last:border-0 font-semibold">
                    <span className="text-slate-700">{lang === 'ar' ? acc.name_ar : acc.name_en}</span>
                    <span className="font-mono text-rose-600 font-bold">{parseFloat(String(acc.current_balance)).toLocaleString()} YER</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-rose-50 border-t border-rose-100 font-black text-xs flex justify-between">
              <span>{lang === 'ar' ? 'مجموع المصروفات:' : 'Total Expenses:'}</span>
              <span className="font-mono text-rose-700">{totalExpenses.toLocaleString()} YER</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-zinc-900 rounded-xl p-5 text-white flex justify-between items-center shadow-md">
            <div>
              <h4 className="text-xs font-black text-amber-400">{lang === 'ar' ? 'الفائض أو العجز المتراكم للفترة' : 'Cumulative Period Surplus (Deficit)'}</h4>
              <p className="text-[10px] text-zinc-400 font-bold mt-1">{lang === 'ar' ? 'الناتج الختامي لمعادلة قائمة الدخل التشغيلية.' : 'Final bottom-line result of the net operating revenue statement.'}</p>
            </div>
            <div className={`text-xl font-black font-mono ${netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netIncome.toLocaleString()} YER
            </div>
          </div>
        </div>
      )}

      {statementType === 'balance_sheet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assets */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'الأصول والموجودات (Assets)' : 'Assets'}</span>
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {accounts.filter(a => a.account_type === 'ASSET').map(acc => (
                  <div key={acc.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-50 last:border-0 font-semibold">
                    <span className="text-slate-700">{lang === 'ar' ? acc.name_ar : acc.name_en}</span>
                    <span className="font-mono text-slate-900">{parseFloat(String(acc.current_balance)).toLocaleString()} YER</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-emerald-50 border-t border-emerald-100 font-black text-xs flex justify-between">
              <span>{lang === 'ar' ? 'إجمالي الأصول:' : 'Total Assets:'}</span>
              <span className="font-mono text-emerald-700">{totalAssets.toLocaleString()} YER</span>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'ar' ? 'الالتزامات وحقوق الملكية (Liabilities & Equity)' : 'Liabilities & Equity'}</span>
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {accounts.filter(a => a.account_type === 'LIABILITY' || a.account_type === 'EQUITY').map(acc => (
                  <div key={acc.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-50 last:border-0 font-semibold">
                    <span className="text-slate-700">{lang === 'ar' ? acc.name_ar : acc.name_en}</span>
                    <span className="font-mono text-slate-900">{parseFloat(String(acc.current_balance)).toLocaleString()} YER</span>
                  </div>
                ))}
                {/* Include Current Period Net Income */}
                <div className="flex justify-between items-center text-xs py-2 border-b border-slate-50 font-bold bg-slate-50 px-2 rounded">
                  <span className="text-slate-700">{lang === 'ar' ? 'أرباح (خسائر) الفترة الحالية' : 'Current Period Profit/Loss'}</span>
                  <span className={`font-mono ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{netIncome.toLocaleString()} YER</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-amber-50 border-t border-amber-100 font-black text-xs flex justify-between font-bold">
              <span>{lang === 'ar' ? 'إجمالي الالتزامات وحقوق الملكية:' : 'Total Liabilities & Equity:'}</span>
              <span className="font-mono text-amber-700">{liabilityAndEquityAndProfit.toLocaleString()} YER</span>
            </div>
          </div>

          <div className={`md:col-span-2 p-4 rounded-xl border text-center text-xs font-black ${
            isBalanceSheetBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span>
              {isBalanceSheetBalanced 
                ? (lang === 'ar' ? '✔ موازنة المركز المالي ممتازة ومتطابقة: الأصول = الالتزامات + حقوق الملكية' : '✔ Balance Sheet is perfectly balanced: Assets = Liabilities + Equity')
                : (lang === 'ar' ? '✘ موازنة غير متطابقة! هنالك فروقات تسوية في المركز المالي.' : '✘ Balance Sheet is out of balance!')
              }
            </span>
          </div>
        </div>
      )}

      {/* PDF Print Template Modal */}
      <PrintPDFTemplateModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        lang={lang}
        type="financial"
        data={{
          accounts,
          financialType: statementType,
          title: statementType === 'trial' 
            ? (lang === 'ar' ? 'ميزان المراجعة بالمجاميع والأرصدة' : 'Trial Balance Statement')
            : statementType === 'income'
            ? (lang === 'ar' ? 'قائمة الأداء المالي والأنشطة (قائمة الدخل)' : 'Statement of Financial Performance')
            : (lang === 'ar' ? 'قائمة المركز المالي والميزانية العمومية' : 'Statement of Financial Position')
        }}
      />
    </div>
  );
}
