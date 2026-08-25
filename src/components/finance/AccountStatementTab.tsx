import React, { useState } from 'react';
import { Search, Printer, Calendar, RefreshCw, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Account, Transaction, TransactionLine } from './FinanceTypes';
import { printHTML, createPrintDocument } from '../../lib/printUtils';

interface AccountStatementTabProps {
  accounts: Account[];
  transactions: Transaction[];
  lines: TransactionLine[];
  lang: 'ar' | 'en';
}

export default function AccountStatementTab({ accounts, transactions, lines, lang }: AccountStatementTabProps) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const selectedAcc = accounts.find(a => a.id === selectedAccountId);

  // Compute ledger lines
  const computeStatement = () => {
    if (!selectedAcc) return { startingBalance: 0, statementRows: [], totalDebit: 0, totalCredit: 0, endingBalance: 0 };

    const accCode = selectedAcc.account_code;
    const accType = selectedAcc.account_type?.toUpperCase();
    const isDebitType = accType === 'ASSET' || accType === 'EXPENSE';

    const accountLines = lines.filter(l => l.account_id === selectedAccountId || l.account_code === accCode);

    // Join with transactions to get dates & statuses
    const enrichedLines = accountLines.map(l => {
      const tx = transactions.find(t => t.id === l.transaction_id);
      return {
        ...l,
        date: tx ? tx.transaction_date : '2026-01-01',
        txNumber: tx ? tx.transaction_number : 'JV-000000',
        description: l.description || (tx ? tx.description : ''),
        type: tx ? tx.transaction_type : 'JV',
        isPosted: tx ? tx.is_posted : false
      };
    }).filter(l => l.isPosted);

    // Separate before and during dates
    const priorLines = enrichedLines.filter(l => l.date < startDate);
    const periodLines = enrichedLines.filter(l => l.date >= startDate && l.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date) || a.txNumber.localeCompare(b.txNumber));

    // Calculate Prior (Starting) Balance
    let startingBalance = parseFloat(String(selectedAcc.opening_balance || 0));
    priorLines.forEach(line => {
      const deb = parseFloat(String(line.debit_amount || 0));
      const cred = parseFloat(String(line.credit_amount || 0));
      if (isDebitType) {
        startingBalance += (deb - cred);
      } else {
        startingBalance += (cred - deb);
      }
    });

    // Generate Running Balance Rows
    let running = startingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    const statementRows = periodLines.map(line => {
      const deb = parseFloat(String(line.debit_amount || 0));
      const cred = parseFloat(String(line.credit_amount || 0));
      totalDebit += deb;
      totalCredit += cred;

      if (isDebitType) {
        running += (deb - cred);
      } else {
        running += (cred - deb);
      }

      return {
        ...line,
        debit: deb,
        credit: cred,
        runningBalance: running
      };
    });

    return {
      startingBalance,
      statementRows,
      totalDebit,
      totalCredit,
      endingBalance: running
    };
  };

  const { startingBalance, statementRows, totalDebit, totalCredit, endingBalance } = computeStatement();

  const handlePrint = () => {
    if (!selectedAcc) return;

    // Resilient print writer — popup window when allowed, sandbox-safe iframe fallback
    const printDoc = createPrintDocument();

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const rowsHTML = statementRows.map((row, idx) => `
      <tr class="border-b border-slate-200">
        <td class="p-2.5 text-center font-mono text-slate-500">${idx + 1}</td>
        <td class="p-2.5 font-mono text-slate-800">${row.date}</td>
        <td class="p-2.5 font-mono font-bold text-slate-900">${row.txNumber}</td>
        <td class="p-2.5">${row.description}</td>
        <td class="p-2.5 text-right font-mono font-bold text-slate-900">${row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
        <td class="p-2.5 text-right font-mono font-bold text-slate-900">${row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
        <td class="p-2.5 text-right font-mono font-black text-slate-900 bg-slate-50">${row.runningBalance.toLocaleString()}</td>
      </tr>
    `).join('');

    printDoc.write(`
      <!DOCTYPE html>
      <html lang="${lang}" dir="${dir}">
      <head>
        <meta charset="UTF-8">
        <title>Account Statement - ${selectedAcc.account_code}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;900&display=swap');
          body {
            font-family: ${lang === 'ar' ? "'Tajawal', sans-serif" : "'Plus Jakarta Sans', sans-serif"};
          }
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; color: black !important; }
            @page { size: A4; margin: 15mm; }
          }
        </style>
      </head>
      <body class="bg-slate-100 text-slate-900 p-8">
        <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
          <span class="text-xs font-bold text-slate-500">${lang === 'ar' ? 'جاهز للطباعة أو التصدير الرسمي' : 'Ready to print account ledger'}</span>
          <button onclick="window.print()" class="px-5 py-2 bg-emerald-600 text-white font-black text-xs rounded-lg cursor-pointer">
            ${lang === 'ar' ? 'إطلاق أمر الطباعة 🖨️' : 'Print Statement 🖨️'}
          </button>
        </div>

        <div class="max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl p-10 shadow-lg min-h-[297mm] relative">
          <div class="flex justify-between items-start pb-6 border-b-2 border-slate-950">
            <div class="text-right space-y-1">
              <h1 class="font-black text-base text-slate-900">جمعية رحماء الخيرية للتنمية</h1>
              <p class="text-xs font-bold text-slate-500">إدارة الشؤون المالية</p>
            </div>
            <div class="text-center font-black border border-slate-900 px-3 py-1 rounded bg-slate-50">NexoraOS™</div>
            <div class="text-left space-y-1">
              <h1 class="font-black text-base text-slate-900">Rohamaa Charity Foundation</h1>
              <p class="text-xs font-bold text-slate-500">Financial Department</p>
            </div>
          </div>

          <div class="my-6 text-center">
            <h2 class="text-lg font-black text-slate-900 border border-slate-900 px-5 py-1.5 rounded-lg inline-block">
              ${lang === 'ar' ? 'كشف حساب تفصيلي' : 'Detailed Account Statement'}
            </h2>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-6">
            <div>
              <p class="text-slate-400 font-bold">${lang === 'ar' ? 'رمز الحساب' : 'Code'}</p>
              <p class="font-mono font-black text-slate-900 text-sm">${selectedAcc.account_code}</p>
            </div>
            <div>
              <p class="text-slate-400 font-bold">${lang === 'ar' ? 'اسم الحساب' : 'Account Name'}</p>
              <p class="font-bold text-slate-900">${lang === 'ar' ? selectedAcc.name_ar : selectedAcc.name_en}</p>
            </div>
            <div>
              <p class="text-slate-400 font-bold">${lang === 'ar' ? 'الرصيد الافتتاحي للفترة' : 'Opening Bal for Period'}</p>
              <p class="font-mono font-bold text-slate-900">${startingBalance.toLocaleString()} YER</p>
            </div>
            <div>
              <p class="text-slate-400 font-bold">${lang === 'ar' ? 'الفترة الزمنية' : 'Period'}</p>
              <p class="font-mono font-bold text-slate-800 text-[10px]">${startDate} - ${endDate}</p>
            </div>
          </div>

          <table class="w-full text-xs text-right border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-900 text-white font-extrabold uppercase">
                <th class="p-2 border border-slate-200 text-center w-10">#</th>
                <th class="p-2 border border-slate-200 w-24">${lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th class="p-2 border border-slate-200 w-28">${lang === 'ar' ? 'رقم القيد' : 'Voucher No'}</th>
                <th class="p-2 border border-slate-200">${lang === 'ar' ? 'الشرح والبيان' : 'Narration'}</th>
                <th class="p-2 border border-slate-200 text-right w-28">${lang === 'ar' ? 'مدين' : 'Debit'}</th>
                <th class="p-2 border border-slate-200 text-right w-28">${lang === 'ar' ? 'دائن' : 'Credit'}</th>
                <th class="p-2 border border-slate-200 text-right w-32 bg-slate-800 text-white">${lang === 'ar' ? 'الرصيد الجاري' : 'Balance'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="p-2 border border-slate-200 text-center font-bold text-slate-400">-</td>
                <td class="p-2 border border-slate-200 font-mono text-slate-500">${startDate}</td>
                <td class="p-2 border border-slate-200 font-mono font-bold text-slate-500">OPE-BAL</td>
                <td class="p-2 border border-slate-200 font-bold text-slate-600">${lang === 'ar' ? 'رصيد افتتاحي/مرحل للفترة' : 'Carried forward opening balance'}</td>
                <td class="p-2 border border-slate-200 text-right font-mono">-</td>
                <td class="p-2 border border-slate-200 text-right font-mono">-</td>
                <td class="p-2 border border-slate-200 text-right font-mono font-black text-slate-900 bg-slate-50">${startingBalance.toLocaleString()}</td>
              </tr>
              ${rowsHTML}
              <tr class="bg-slate-100 font-black text-slate-900">
                <td colspan="4" class="p-3 border border-slate-200 text-center">${lang === 'ar' ? 'إجماليات حركة الفترة وصافي الرصيد الجاري' : 'Totals and Final Statement Balance'}</td>
                <td class="p-3 border border-slate-200 text-right font-mono text-rose-600">${totalDebit.toLocaleString()}</td>
                <td class="p-3 border border-slate-200 text-right font-mono text-emerald-600">${totalCredit.toLocaleString()}</td>
                <td class="p-3 border border-slate-200 text-right font-mono font-black text-sm text-slate-950 bg-emerald-50">${endingBalance.toLocaleString()} YER</td>
              </tr>
            </tbody>
          </table>

          <div class="absolute bottom-10 left-10 right-10 grid grid-cols-3 gap-6 text-center text-[10px] font-bold text-slate-600 border-t border-slate-200 pt-4">
            <div>
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'المحاسب المالي' : 'Accountant'}</p>
            </div>
            <div>
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'المراجع الداخلي' : 'Internal Auditor'}</p>
            </div>
            <div>
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'المدير المالي واعتماد الختم' : 'Financial Director & Stamp'}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printDoc.close();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Account Selector */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'اختر الحساب المالي*' : 'Select Ledger Account*'}</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
          >
            <option value="">{lang === 'ar' ? '--- اختر حساباً أستاذ ---' : '--- Select Account ---'}</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.account_code} - {lang === 'ar' ? acc.name_ar : acc.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'تاريخ البدء*' : 'Start Date*'}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          />
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'تاريخ النهاية*' : 'End Date*'}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          />
        </div>
      </div>

      {selectedAcc ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black text-slate-800">
                {lang === 'ar' ? 'استعلام كشف الحساب المتزن للفترة:' : 'Ledger Account Query Output for:'} {selectedAcc.name_ar} ({selectedAcc.account_code})
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{lang === 'ar' ? 'الرصيد في مطلع الفترة متضمن كافة التسويات والقيود.' : 'Prior transactions and adjustments reconciled dynamically.'}</p>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>{lang === 'ar' ? 'طباعة كشف رسمي معتمد' : 'Print Statement'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[9px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'رصيد أول الفترة' : 'Carried Forward Bal'}</span>
              <span className="text-xs font-mono font-black text-slate-800 block mt-1">{startingBalance.toLocaleString()} YER</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[9px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'إجمالي المدين' : 'Total Period Debit'}</span>
              <span className="text-xs font-mono font-black text-rose-600 block mt-1">{totalDebit.toLocaleString()} YER</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[9px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'إجمالي الدائن' : 'Total Period Credit'}</span>
              <span className="text-xs font-mono font-black text-emerald-600 block mt-1">{totalCredit.toLocaleString()} YER</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <span className="text-[9px] text-emerald-600 font-bold block uppercase">{lang === 'ar' ? 'الرصيد الختامي' : 'Final Closing Balance'}</span>
              <span className="text-xs font-mono font-black text-emerald-700 block mt-1">{endingBalance.toLocaleString()} YER</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse" style={{ textAlign: lang === 'en' ? 'left' : 'right' }}>
                <thead>
                  <tr className="bg-zinc-900 text-amber-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                    <th className="p-3 w-24">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th className="p-3 w-28">{lang === 'ar' ? 'المستند' : 'Voucher No'}</th>
                    <th className="p-3">{lang === 'ar' ? 'الشرح والبيان العام والسطري' : 'Description'}</th>
                    <th className="p-3 text-right w-28">{lang === 'ar' ? 'مدين YER' : 'Debit'}</th>
                    <th className="p-3 text-right w-28">{lang === 'ar' ? 'دائن YER' : 'Credit'}</th>
                    <th className="p-3 text-right w-32 bg-slate-50">{lang === 'ar' ? 'الرصيد الجاري' : 'Running Balance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold font-mono">
                  <tr>
                    <td className="p-3 text-slate-400 font-mono">-</td>
                    <td className="p-3 font-mono text-zinc-400 font-bold">OPE-BAL</td>
                    <td className="p-3 text-slate-500 font-sans">{lang === 'ar' ? 'رصيد منقول للمطابقة الحسابية' : 'Brought forward initial balance'}</td>
                    <td className="p-3 text-right">-</td>
                    <td className="p-3 text-right">-</td>
                    <td className="p-3 text-right font-black text-slate-900 bg-slate-50">{startingBalance.toLocaleString()}</td>
                  </tr>
                  {statementRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400 font-sans">
                        {lang === 'ar' ? 'لا توجد قيود مرحلة لهذا الحساب خلال هذه الفترة الزمنية.' : 'No active posted transactions found for this period.'}
                      </td>
                    </tr>
                  ) : (
                    statementRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">{row.date}</td>
                        <td className="p-3 text-slate-900 font-bold">{row.txNumber}</td>
                        <td className="p-3 font-sans text-slate-800 text-xs text-wrap">{row.description}</td>
                        <td className="p-3 text-right text-rose-600 font-bold">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                        <td className="p-3 text-right text-emerald-600 font-bold">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                        <td className="p-3 text-right font-black text-slate-900 bg-slate-50">{row.runningBalance.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-zinc-400 font-bold border border-dashed border-slate-200 rounded-xl">
          <FileText className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
          <p className="text-xs">{lang === 'ar' ? 'يرجى اختيار حساب مالي لاستعراض كشف الحركة التفصيلي' : 'Please select a ledger account to populate statement ledger query.'}</p>
        </div>
      )}
    </div>
  );
}
