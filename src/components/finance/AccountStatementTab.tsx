import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Calendar, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Download,
  BarChart3,
  Eye,
  EyeOff,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Scale
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Account, Transaction, TransactionLine } from './FinanceTypes';
import { printHTML, createPrintDocument } from '../../lib/printUtils';
import { generateNumericCode } from '../../lib/idGenerator';

interface AccountStatementTabProps {
  accounts: Account[];
  transactions: Transaction[];
  lines: TransactionLine[];
  lang: 'ar' | 'en';
  initialAccountId?: string;
}

export default function AccountStatementTab({ accounts, transactions, lines, lang, initialAccountId }: AccountStatementTabProps) {
  const isRtl = lang === 'ar';
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId || '');
  const [showVisualCharts, setShowVisualCharts] = useState(true);

  React.useEffect(() => {
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
    }
  }, [initialAccountId]);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const selectedAcc = accounts.find(a => a.id === selectedAccountId);

  // Quick Date Filter Presets
  const applyDatePreset = (preset: 'today' | 'month' | 'quarter' | 'year' | 'all') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(todayStr);
    } else if (preset === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(todayStr);
    } else if (preset === 'year') {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate(todayStr);
    }
  };

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

  // Recharts Visual Progression Data
  const chartData = useMemo(() => {
    return statementRows.map((r, idx) => ({
      name: `${r.date.slice(5)} #${idx + 1}`,
      date: r.date,
      txNumber: r.txNumber,
      debit: r.debit,
      credit: r.credit,
      runningBalance: r.runningBalance
    }));
  }, [statementRows]);

  // Export to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (!selectedAcc || statementRows.length === 0) return;
    const headers = [
      '#',
      isRtl ? 'التاريخ' : 'Date',
      isRtl ? 'رقم المستند' : 'Voucher No',
      isRtl ? 'البيان والشرح' : 'Description',
      isRtl ? 'مدين (ر.ي)' : 'Debit (YER)',
      isRtl ? 'دائن (ر.ي)' : 'Credit (YER)',
      isRtl ? 'الرصيد الجاري (ر.ي)' : 'Running Balance (YER)'
    ];

    const rows = [
      ['0', startDate, 'OPE-BAL', isRtl ? 'رصيد افتتاحي/مرحل للفترة' : 'Opening Carried Balance', '0', '0', String(startingBalance)],
      ...statementRows.map((r, idx) => [
        String(idx + 1),
        r.date,
        r.txNumber,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        String(r.debit),
        String(r.credit),
        String(r.runningBalance)
      ]),
      ['', '', '', isRtl ? 'الإجمالي وصافي الرصيد الختامي' : 'Total & Closing Balance', String(totalDebit), String(totalCredit), String(endingBalance)]
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Account_Statement_${selectedAcc.account_code}_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!selectedAcc) return;

    // Resilient print writer — popup window when allowed, sandbox-safe iframe fallback
    const printDoc = createPrintDocument();

    const dir = isRtl ? 'rtl' : 'ltr';
    const verificationRef = `ROHAMAA-STM-${selectedAcc.account_code}-${generateNumericCode(100000, 999999)}`;
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
            font-family: ${isRtl ? "'Tajawal', sans-serif" : "'Plus Jakarta Sans', sans-serif"};
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
          <span class="text-xs font-bold text-slate-500">${isRtl ? 'جاهز للطباعة أو التصدير الرسمي' : 'Ready to print account ledger'}</span>
          <button onclick="window.print()" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg cursor-pointer">
            ${isRtl ? 'إطلاق أمر الطباعة الرسمية' : 'Print Official Statement'}
          </button>
        </div>

        <div class="max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl p-10 shadow-lg min-h-[297mm] relative">
          <!-- Institutional Header -->
          <div class="flex justify-between items-center pb-6 border-b-2 border-emerald-600">
            <div class="flex items-center gap-3">
              <img src="/UAMEX_ERPLOGO.png" style="height: 55px; max-width: 75px; object-fit: contain;" alt="UAMEX ERP" />
              <img src="/LogoRohamaab.png" style="height: 55px; max-width: 75px; object-fit: contain;" alt="Logo Rohamaab" />
              <div>
                <h1 class="font-black text-sm text-slate-900 leading-tight">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h1>
                <p class="text-[11px] font-bold text-emerald-700">نظام يو امكس المؤسسي الشامل - UAMEX_ERP™</p>
                <p class="text-[9px] text-slate-500 font-mono">One Platform. One Organization. One Vision.</p>
              </div>
            </div>
            <div class="text-left text-[11px] text-slate-600 font-mono space-y-0.5">
              <div><strong>Doc No:</strong> STM-${selectedAcc.account_code}-${new Date().getFullYear()}</div>
              <div><strong>Date:</strong> ${new Date().toISOString().split('T')[0]}</div>
              <div><strong>Standard:</strong> IPSAS Reporting</div>
            </div>
          </div>

          <div class="my-6 text-center">
            <h2 class="text-lg font-black text-slate-900 border border-slate-900 px-5 py-1.5 rounded-lg inline-block">
              ${isRtl ? 'كشف حساب تفصيلي معتمد' : 'Detailed Certified Account Statement'}
            </h2>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-6">
            <div>
              <p class="text-slate-400 font-bold">${isRtl ? 'رمز الحساب' : 'Code'}</p>
              <p class="font-mono font-black text-slate-900 text-sm">${selectedAcc.account_code}</p>
            </div>
            <div>
              <p class="text-slate-400 font-bold">${isRtl ? 'اسم الحساب' : 'Account Name'}</p>
              <p class="font-bold text-slate-900">${isRtl ? selectedAcc.name_ar : selectedAcc.name_en}</p>
            </div>
            <div>
              <p class="text-slate-400 font-bold">${isRtl ? 'الرصيد الافتتاحي للفترة' : 'Opening Bal for Period'}</p>
              <p class="font-mono font-bold text-slate-900">${startingBalance.toLocaleString()} YER</p>
            </div>
            <div>
              <p class="text-slate-400 font-bold">${isRtl ? 'الفترة الزمنية' : 'Period'}</p>
              <p class="font-mono font-bold text-slate-800 text-[10px]">${startDate} - ${endDate}</p>
            </div>
          </div>

          <table class="w-full text-xs text-right border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-900 text-white font-extrabold uppercase">
                <th class="p-2 border border-slate-200 text-center w-10">#</th>
                <th class="p-2 border border-slate-200 w-24">${isRtl ? 'التاريخ' : 'Date'}</th>
                <th class="p-2 border border-slate-200 w-28">${isRtl ? 'رقم القيد' : 'Voucher No'}</th>
                <th class="p-2 border border-slate-200">${isRtl ? 'الشرح والبيان' : 'Narration'}</th>
                <th class="p-2 border border-slate-200 text-right w-28">${isRtl ? 'مدين' : 'Debit'}</th>
                <th class="p-2 border border-slate-200 text-right w-28">${isRtl ? 'دائن' : 'Credit'}</th>
                <th class="p-2 border border-slate-200 text-right w-32 bg-slate-800 text-white">${isRtl ? 'الرصيد الجاري' : 'Balance'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="p-2 border border-slate-200 text-center font-bold text-slate-400">-</td>
                <td class="p-2 border border-slate-200 font-mono text-slate-500">${startDate}</td>
                <td class="p-2 border border-slate-200 font-mono font-bold text-slate-500">OPE-BAL</td>
                <td class="p-2 border border-slate-200 font-bold text-slate-600">${isRtl ? 'رصيد افتتاحي/مرحل للفترة' : 'Carried forward opening balance'}</td>
                <td class="p-2 border border-slate-200 text-right font-mono">-</td>
                <td class="p-2 border border-slate-200 text-right font-mono">-</td>
                <td class="p-2 border border-slate-200 text-right font-mono font-black text-slate-900 bg-slate-50">${startingBalance.toLocaleString()}</td>
              </tr>
              ${rowsHTML}
              <tr class="bg-slate-100 font-black text-slate-900">
                <td colspan="4" class="p-3 border border-slate-200 text-center">${isRtl ? 'إجماليات حركة الفترة وصافي الرصيد الجاري' : 'Totals and Final Statement Balance'}</td>
                <td class="p-3 border border-slate-200 text-right font-mono text-rose-600">${totalDebit.toLocaleString()}</td>
                <td class="p-3 border border-slate-200 text-right font-mono text-emerald-600">${totalCredit.toLocaleString()}</td>
                <td class="p-3 border border-slate-200 text-right font-mono font-black text-sm text-slate-950 bg-emerald-50">${endingBalance.toLocaleString()} YER</td>
              </tr>
            </tbody>
          </table>

          <!-- Signatures Box -->
          <div class="mt-8 pt-4 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-center text-[10px] font-bold text-slate-700">
            <div>
              <p class="border-b border-slate-300 pb-1 mb-6">${isRtl ? 'إعداد: المحاسب المالي المختص' : 'Prepared: Accountant'}</p>
              <span class="text-slate-400 font-mono">${isRtl ? 'التوقيع: ____________' : 'Sign: ____________'}</span>
            </div>
            <div>
              <p class="border-b border-slate-300 pb-1 mb-6">${isRtl ? 'مراجعة: إدارة الرقابة المالية والتدقيق' : 'Audited: Internal Auditor'}</p>
              <span class="text-slate-400 font-mono">${isRtl ? 'التوقيع: ____________' : 'Sign: ____________'}</span>
            </div>
            <div>
              <p class="border-b border-slate-300 pb-1 mb-6">${isRtl ? 'اعتماد: المدير المالي والختم الرسمي' : 'Approved: CFO & Official Seal'}</p>
              <span class="text-slate-400 font-mono">${isRtl ? 'التوقيع: ____________' : 'Sign: ____________'}</span>
            </div>
          </div>

          <!-- Official Stamp Seal -->
          <div class="mt-6 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-[9px] font-mono text-emerald-900">
            <div class="flex items-center gap-2">
              <span class="font-black text-xs">UAMEX-VERIFIED-SEAL</span>
              <span>REF: ${verificationRef}</span>
            </div>
            <span>${isRtl ? 'معتمد وصادر رقمياً وفق معايير الحوكمة المالية الدولية IPSAS' : 'Digitally Certified per IPSAS Standards'}</span>
          </div>
        </div>
      </body>
      </html>
    `);
    printDoc.close();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-6">
      {/* Top Filter & Preset Controls */}
      <div className="space-y-3 bg-slate-50/70 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Account Selector */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black">
              {isRtl ? 'اختر الحساب المالي*' : 'Select Ledger Account*'}
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
            >
              <option value="">{isRtl ? '--- اختر حساباً أستاذ ---' : '--- Select Account ---'}</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_code} - {isRtl ? acc.name_ar : acc.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black">
              {isRtl ? 'تاريخ البدء*' : 'Start Date*'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black">
              {isRtl ? 'تاريخ النهاية*' : 'End Date*'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Quick Date Presets Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-zinc-700">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {isRtl ? 'فترات سريعة:' : 'Quick Presets:'}
          </span>
          <button
            type="button"
            onClick={() => applyDatePreset('today')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors"
          >
            {isRtl ? 'اليوم' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => applyDatePreset('month')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors"
          >
            {isRtl ? 'هذا الشهر' : 'This Month'}
          </button>
          <button
            type="button"
            onClick={() => applyDatePreset('quarter')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors"
          >
            {isRtl ? 'هذا الربع' : 'This Quarter'}
          </button>
          <button
            type="button"
            onClick={() => applyDatePreset('year')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors"
          >
            {isRtl ? 'هذه السنة' : 'This Year'}
          </button>
          <button
            type="button"
            onClick={() => applyDatePreset('all')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors"
          >
            {isRtl ? 'كل الفترات' : 'All Time'}
          </button>
        </div>
      </div>

      {selectedAcc ? (
        <div className="space-y-4">
          {/* Action Ribbon & Info */}
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-100">
                {isRtl ? 'استعلام كشف الحساب المتزن للفترة:' : 'Ledger Account Query Output for:'}{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">{selectedAcc.account_code}</span> - {isRtl ? selectedAcc.name_ar : selectedAcc.name_en}
              </h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                {isRtl ? 'الرصيد في مطلع الفترة متضمن كافة التسويات والقيود.' : 'Prior transactions and adjustments reconciled dynamically.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowVisualCharts(prev => !prev)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{showVisualCharts ? (isRtl ? 'إخفاء المخطط' : 'Hide Chart') : (isRtl ? 'عرض المخطط' : 'Show Chart')}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={statementRows.length === 0}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تصدير Excel (CSV)' : 'Export CSV'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 shrink-0" />
                <span>{isRtl ? 'طباعة كشف رسمي معتمد' : 'Print Statement'}</span>
              </button>
            </div>
          </div>

          {/* Visual Analytics Chart (Recharts Composed) */}
          {showVisualCharts && chartData.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {isRtl ? 'تحليل تطور الرصيد الجاري وحركة المدين/الدائن' : 'Running Balance Progression & Debit/Credit Movements'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {statementRows.length} {isRtl ? 'حركة مرحلة' : 'movements'}
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="bars" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="line" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toLocaleString()} YER`, '']}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="bars" dataKey="debit" name={isRtl ? 'مدين' : 'Debit'} fill="#f43f5e" barSize={12} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="bars" dataKey="credit" name={isRtl ? 'دائن' : 'Credit'} fill="#10b981" barSize={12} radius={[4, 4, 0, 0]} />
                    <Area yAxisId="line" type="monotone" dataKey="runningBalance" name={isRtl ? 'الرصيد الجاري' : 'Running Balance'} stroke="#059669" fill="#059669" fillOpacity={0.12} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-slate-100 dark:border-zinc-700">
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold block uppercase">
                {isRtl ? 'رصيد أول الفترة' : 'Carried Forward Bal'}
              </span>
              <span className="text-xs font-mono font-black text-slate-800 dark:text-zinc-100 block mt-1">
                {startingBalance.toLocaleString()} YER
              </span>
            </div>
            <div className="bg-rose-50/40 dark:bg-rose-950/20 rounded-xl p-3 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[9px] text-rose-500 dark:text-rose-400 font-bold block uppercase">
                {isRtl ? 'إجمالي المدين' : 'Total Period Debit'}
              </span>
              <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 block mt-1">
                {totalDebit.toLocaleString()} YER
              </span>
            </div>
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-bold block uppercase">
                {isRtl ? 'إجمالي الدائن' : 'Total Period Credit'}
              </span>
              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                {totalCredit.toLocaleString()} YER
              </span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
              <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold block uppercase">
                {isRtl ? 'الرصيد الختامي' : 'Final Closing Balance'}
              </span>
              <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 block mt-1">
                {endingBalance.toLocaleString()} YER
              </span>
            </div>
          </div>

          {/* Statement Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr className="bg-zinc-900 dark:bg-zinc-950 text-amber-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                    <th className="p-3 w-24">{isRtl ? 'التاريخ' : 'Date'}</th>
                    <th className="p-3 w-28">{isRtl ? 'المستند' : 'Voucher No'}</th>
                    <th className="p-3">{isRtl ? 'الشرح والبيان العام والسطري' : 'Description'}</th>
                    <th className="p-3 text-right w-28">{isRtl ? 'مدين YER' : 'Debit'}</th>
                    <th className="p-3 text-right w-28">{isRtl ? 'دائن YER' : 'Credit'}</th>
                    <th className="p-3 text-right w-32 bg-zinc-800/80 text-white">{isRtl ? 'الرصيد الجاري' : 'Running Balance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold font-mono">
                  <tr className="bg-slate-50/50 dark:bg-zinc-800/30">
                    <td className="p-3 text-slate-400 dark:text-zinc-500 font-mono">-</td>
                    <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">OPE-BAL</td>
                    <td className="p-3 text-slate-500 dark:text-zinc-400 font-sans">
                      {isRtl ? 'رصيد منقول للمطابقة الحسابية' : 'Brought forward initial balance'}
                    </td>
                    <td className="p-3 text-right">-</td>
                    <td className="p-3 text-right">-</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-800/60">
                      {startingBalance.toLocaleString()}
                    </td>
                  </tr>
                  {statementRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400 dark:text-zinc-500 font-sans">
                        {isRtl ? 'لا توجد قيود مرحلة لهذا الحساب خلال هذه الفترة الزمنية.' : 'No active posted transactions found for this period.'}
                      </td>
                    </tr>
                  ) : (
                    statementRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3">{row.date}</td>
                        <td className="p-3 text-slate-900 dark:text-zinc-100 font-bold">{row.txNumber}</td>
                        <td className="p-3 font-sans text-slate-800 dark:text-zinc-200 text-xs text-wrap">{row.description}</td>
                        <td className="p-3 text-right text-rose-600 dark:text-rose-400 font-bold">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                        <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-800/60">{row.runningBalance.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 font-bold border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
          <FileText className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
          <p className="text-xs">
            {isRtl ? 'يرجى اختيار حساب مالي لاستعراض كشف الحركة التفصيلي' : 'Please select a ledger account to populate statement ledger query.'}
          </p>
        </div>
      )}
    </div>
  );
}
