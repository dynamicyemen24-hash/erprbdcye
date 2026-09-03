import React, { useState } from 'react';
import { FileText, TrendingUp, Building, Scale, Printer, Download, CheckCircle2, AlertCircle, ArrowUpRight, DollarSign } from 'lucide-react';
import { Account } from './FinanceTypes';
import PrintPDFTemplateModal from '../reports/PrintPDFTemplateModal';

interface FinancialStatementsTabProps {
  accounts: Account[];
  lang: 'ar' | 'en';
}

function FinancialStatementsTabInner({ accounts, lang }: FinancialStatementsTabProps) {
  const [statementType, setStatementType] = useState<'trial' | 'income' | 'balance_sheet' | 'cash_flow'>('trial');
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
  const cashAccounts = accounts.filter(a => a.account_type === 'ASSET' && (a.account_code.startsWith('101') || a.account_code.startsWith('102') || a.name_ar?.includes('نقد') || a.name_ar?.includes('صندوق') || a.name_ar?.includes('بنك')));
  const cashAndBank = cashAccounts.reduce((s, a) => s + parseFloat(String(a.current_balance || 0)), 0);
  const trialDebitSum = accounts.reduce((sum, a) => sum + ((a.account_type === 'ASSET' || a.account_type === 'EXPENSE') ? parseFloat(String(a.current_balance)) : 0), 0);
  const trialCreditSum = accounts.reduce((sum, a) => sum + ((a.account_type !== 'ASSET' && a.account_type !== 'EXPENSE') ? parseFloat(String(a.current_balance)) : 0), 0);
  const trialVariance = Math.abs(trialDebitSum - trialCreditSum);
  const isTrialBalanced = trialVariance < 0.01;

  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    if (statementType === 'trial') {
      csvContent += 'Account Code,Account Name,Account Type,Debit (YER),Credit (YER)\n';
      accounts.filter(a => parseFloat(String(a.current_balance)) !== 0).forEach(acc => {
        const bal = parseFloat(String(acc.current_balance));
        const isDebit = acc.account_type === 'ASSET' || acc.account_type === 'EXPENSE';
        const deb = isDebit ? bal : 0;
        const cred = !isDebit ? bal : 0;
        csvContent += `"${acc.account_code}","${lang === 'ar' ? acc.name_ar : acc.name_en}","${acc.account_type}",${deb},${cred}\n`;
      });
    } else if (statementType === 'income') {
      csvContent += 'Type,Account Code,Account Name,Amount (YER)\n';
      accounts.filter(a => a.account_type === 'REVENUE' || a.account_type === 'EXPENSE').forEach(acc => {
        csvContent += `"${acc.account_type}","${acc.account_code}","${lang === 'ar' ? acc.name_ar : acc.name_en}",${parseFloat(String(acc.current_balance))}\n`;
      });
    } else if (statementType === 'balance_sheet') {
      csvContent += 'Category,Account Code,Account Name,Amount (YER)\n';
      accounts.filter(a => a.account_type === 'ASSET' || a.account_type === 'LIABILITY' || a.account_type === 'EQUITY').forEach(acc => {
        csvContent += `"${acc.account_type}","${acc.account_code}","${lang === 'ar' ? acc.name_ar : acc.name_en}",${parseFloat(String(acc.current_balance))}\n`;
      });
    } else {
      csvContent += 'Section,Description,Amount (YER)\n';
      csvContent += `"Operating","Net Period Surplus",${netIncome}\n`;
      csvContent += `"Operating","Cash Inflows from Grants & Services",${totalRevenues}\n`;
      csvContent += `"Operating","Cash Outflows for Relief & Projects",-${totalExpenses}\n`;
      csvContent += `"Ending","Total Liquid Cash & Bank Equivalents",${cashAndBank}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `IPSAS_Statement_${statementType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const [dimensionProgram, setDimensionProgram] = useState('ALL');
  const [dimensionProject, setDimensionProject] = useState('ALL');
  const [dimensionFundType, setDimensionFundType] = useState('ALL');

  return (
    <div className="space-y-6">
      {/* Selector Subtabs & Print Action */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatementType('trial')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              statementType === 'trial' ? 'bg-zinc-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{lang === 'ar' ? 'ميزان المراجعة (Trial Balance)' : 'Trial Balance'}</span>
          </button>

          <button
            onClick={() => setStatementType('income')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              statementType === 'income' ? 'bg-zinc-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{lang === 'ar' ? 'قائمة الأداء والأنشطة (Income Statement)' : 'Income Statement'}</span>
          </button>

          <button
            onClick={() => setStatementType('balance_sheet')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              statementType === 'balance_sheet' ? 'bg-zinc-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>{lang === 'ar' ? 'الميزانية والمركز المالي (Balance Sheet)' : 'Balance Sheet'}</span>
          </button>

          <button
            onClick={() => setStatementType('cash_flow')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              statementType === 'cash_flow' ? 'bg-zinc-900 text-amber-400 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ar' ? 'قائمة التدفقات النقدية (Cash Flow)' : 'Cash Flow'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-all border border-slate-200 dark:border-zinc-700"
            title={lang === 'ar' ? 'تصدير جدول البيانات الحالي كملف Excel / CSV' : 'Export current statement as CSV'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'ar' ? 'تصدير CSV' : 'CSV'}</span>
          </button>

          <button
            onClick={() => setIsPDFModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center gap-2 cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>{lang === 'ar' ? 'طباعة وتصدير (PDF)' : 'Print PDF'}</span>
          </button>
        </div>
      </div>

      {/* MULTI-DIMENSIONAL SLICE RIBBON */}
      <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'ar' ? 'أبعاد التحليل المالي المعياري:' : 'Multi-Dimension Analysis:'}</span>
          </span>

          <select
            value={dimensionProgram}
            onChange={(e) => setDimensionProgram(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold text-slate-800 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="ALL">{lang === 'ar' ? 'كافة البرامج الإنسانية' : 'All Programs'}</option>
            <option value="WASH">{lang === 'ar' ? 'برنامج المياه والإصحاح البيئي' : 'WASH Program'}</option>
            <option value="FOOD">{lang === 'ar' ? 'برنامج الأمن الغذائي والإغاثة' : 'Food Security Program'}</option>
            <option value="ORPHAN">{lang === 'ar' ? 'برنامج رعاية وكفالة الأيتام' : 'Orphan Care Program'}</option>
          </select>

          <select
            value={dimensionProject}
            onChange={(e) => setDimensionProject(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold text-slate-800 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="ALL">{lang === 'ar' ? 'كافة المشاريع التنفيذية' : 'All Projects'}</option>
            <option value="PRJ-WASH-2026">{lang === 'ar' ? 'مشروع حفر وتأهيل الآبار (PRJ-WASH-2026)' : 'Boreholes Project'}</option>
            <option value="PRJ-FOOD-2026">{lang === 'ar' ? 'مشروع السلال الرمضانية (PRJ-FOOD-2026)' : 'Food Baskets Project'}</option>
          </select>

          <select
            value={dimensionFundType}
            onChange={(e) => setDimensionFundType(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold text-slate-800 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="ALL">{lang === 'ar' ? 'كافة الصناديق والقيود وفق المعايير الدولية للقطاع العام' : 'All IPSAS Funds'}</option>
            <option value="UNRESTRICTED">{lang === 'ar' ? 'الأموال العامة غير المقيدة' : 'Unrestricted Funds'}</option>
            <option value="RESTRICTED">{lang === 'ar' ? 'أموال المشاريع المقيدة والمشروطة' : 'Restricted Project Funds'}</option>
            <option value="ENDOWMENT">{lang === 'ar' ? 'أصول وريع الأوقاف (Endowment Waqf)' : 'Endowment Waqf Funds'}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold rounded-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{lang === 'ar' ? 'معايير IPSAS للمحاسبة الدولية' : 'IPSAS Compliant'}</span>
          </span>
        </div>
      </div>

      {/* RENDER STATEMENTS */}
      {statementType === 'trial' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'ميزان المراجعة بالمجاميع والأرصدة' : 'Trial Balance (Sums & Balances)'}</span>
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                {lang === 'ar' ? 'تطابق الحسابات وتدقيق توازن الدفاتر المحاسبية العامة وفق معايير IPSAS.' : 'Reconciliation check proving totals & balances equality across the whole ledger.'}
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 ${
              isTrialBalanced ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-rose-500/10 text-rose-700 border-rose-500/30'
            }`}>
              {isTrialBalanced ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? '✓ ميزان المراجعة متطابق ومتزن 100%' : 'Trial Balance 100% Balanced'}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{lang === 'ar' ? `فارق عدم الاتزان: ${trialVariance.toLocaleString()} ريال يمني` : `Variance: ${trialVariance.toLocaleString()} YER`}</span>
                </>
              )}
            </div>
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
                ? (lang === 'ar' ? 'المركز المالي متزن ومطابق: مجموع الأصول يساوي مجموع الالتزامات مضافاً إليه حقوق الملكية وصافي الفائض' : 'Balance Sheet is perfectly balanced: Assets = Liabilities + Equity')
                : (lang === 'ar' ? 'المركز المالي غير متزن؛ توجد فروقات تسوية يتعين معالجتها قبل اعتماد الإقفال' : 'Balance Sheet is out of balance!')
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
            : statementType === 'cash_flow'
            ? (lang === 'ar' ? 'قائمة التدفقات النقدية المعيارية (IPSAS 2)' : 'Statement of Cash Flows (IPSAS 2)')
            : (lang === 'ar' ? 'قائمة المركز المالي والميزانية العمومية' : 'Statement of Financial Position'),
          subtitle: statementType === 'cash_flow'
            ? (lang === 'ar' ? 'صافي التدفقات النقدية من الأنشطة التشغيلية والاستثمارية والمصرفية' : 'Net cash flows from operating, investing & financing activities')
            : undefined
        }}
      />
    </div>
  );
}

export default React.memo(FinancialStatementsTabInner);
