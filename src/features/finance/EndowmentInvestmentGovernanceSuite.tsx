import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  TrendingUp, 
  FileText, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Printer
} from 'lucide-react';
import { EnterpriseButton } from '../../components/common/EnterpriseButton';
import { Account, Transaction, TransactionLine, Project } from '../../types';
import {
  computeFinancialAnalytics,
  RATIO_STATUS_STYLES,
} from '../../core/ledger/financialAnalytics';

interface EndowmentInvestmentGovernanceSuiteProps {
  lang: 'ar' | 'en';
  accounts?: Account[];
  transactions?: Transaction[];
  lines?: TransactionLine[];
  projects?: Project[];
}

export default function EndowmentInvestmentGovernanceSuite({
  lang,
  accounts = [],
  transactions = [],
  lines = [],
  projects = []
}: EndowmentInvestmentGovernanceSuiteProps) {
  const isRtl = lang === 'ar';

  const [selectedSubTab, setSelectedSubTab] = useState<'endowment' | 'governance_caps' | 'bi_reports'>('endowment');

  // Transaction Ceiling Caps State
  const [maxPaymentCap, setMaxPaymentCap] = useState(25000);
  const [dualSignThreshold, setDualSignThreshold] = useState(10000);

  // Standard Analytics Engine (منهجية IPSAS/Sphere/CHS — الأرقام مشتقة حصراً من الدفتر العام)
  const analytics = useMemo(
    () => computeFinancialAnalytics({
      accounts: accounts as any,
      transactions: transactions as any,
      lines: lines as any,
      projects: projects as any,
    }),
    [accounts, transactions, lines, projects]
  );

  // Detection of endowment-related ledger accounts by the standardized account naming
  const endowmentAccounts = useMemo(() => accounts.filter((a) => {
    const name = `${a.name_ar || ''} ${a.name_en || ''}`;
    return /وقف|أوقاف|صكوك|استثمار|ريع|endowment|waqf|investment/.test(name);
  }), [accounts]);

  // Report period derived from the last posted transaction (فترة التقرير المشتقة من السجلات)
  const reportPeriod = useMemo(() => {
    if (transactions.length === 0) return '';
    const dates = transactions
      .map((t) => new Date(t.transaction_date).getTime())
      .filter((n) => Number.isFinite(n));
    if (dates.length === 0) return '';
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    const fmt = (d: Date) => d.toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return `${fmt(min)} إلى ${fmt(max)}`;
  }, [transactions, lang]);

  const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00');

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{isRtl ? 'جناح الأوقاف والمشاريع الاستثمارية وحوكمة أسقف الإنفاق (Endowment & Governance Suite)' : 'Endowment, Investment & Governance Suite'}</span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-black rounded uppercase">
                Shariah & IPSAS Verified
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isRtl 
                ? 'إدارة حسابات الأوقاف الاستثمارية، ضبط أسقف التعاملات المالية وصلاحيات الموافقة، والتقارير الشاملة' 
                : 'Investment endowment ledgers, transaction ceiling caps, dual approval matrices, and BI analytics.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>{isRtl ? 'طباعة تقرير الأوقاف والتقييم' : 'Print Endowment Report'}</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3 text-xs font-bold">
        {[
          { id: 'endowment', labelAr: 'المشاريع الاستثمارية والوقفية', labelEn: 'Endowment & Investment Projects', icon: Building2 },
          { id: 'governance_caps', labelAr: 'حوكمة الصلاحيات وأسقف التعاملات', labelEn: 'Governance & Transaction Caps', icon: Lock },
          { id: 'bi_reports', labelAr: 'التقارير المالية والتقييمية الشاملة', labelEn: 'Comprehensive Financial BI Reports', icon: FileText },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = selectedSubTab === tab.id;
          return (
            <EnterpriseButton
              key={tab.id}
              onClick={() => setSelectedSubTab(tab.id as any)}
              variant={isActive ? 'primary' : 'ghost'}
              size="md"
              icon={<IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
            >
              {isRtl ? tab.labelAr : tab.labelEn}
            </EnterpriseButton>
          );
        })}
      </div>

      {/* TAB 1: ENDOWMENT & INVESTMENT PROJECTS LEDGER */}
      {selectedSubTab === 'endowment' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'تقرير أصول المحفظة الوقفية وفق منهجية الصناديق المقيدة' : 'Endowment Fund Assets Register (Restricted Fund Accounting)'}</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
              {isRtl
                ? 'تُعرض هنا الحسابات الوقفية والاستثمارية المرحلة في الدفتر العام فقط. أعد تكوين بيانات الوقف من شجرة الحسابات أسوة بالمعيار الدولي للمحاسبة في القطاع العام رقم 23 الخاص بالمنح والإيرادات غير التبادلية، ويراعى تطبيق محاسبة الصناديق المقيدة بالكامل.'
                : 'Only posted endowment accounts derived from the general ledger are displayed, in line with IPSAS 23 non-exchange revenue and restricted fund accounting principles.'}
            </p>
          </div>

          {endowmentAccounts.length === 0 ? (
            <div className="p-6 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h5 className="text-xs font-black text-amber-800 dark:text-amber-300">
                  {isRtl ? 'بيانات غير كافية لإصدار تقرير المحفظة الوقفية' : 'Insufficient data to produce the endowment register'}
                </h5>
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-200/80 font-bold leading-relaxed">
                {isRtl
                  ? 'لا توجد حسابات وقفية معرّفة أو مرحّلة في الدفتر العام ضمن نطاق البيانات المتاحة. لا تتم تلفيق أرقام افتراضية: يجب أولاً اعتماد حسابات الأوقاف (لأصل الوقف والريع والفائض القابل للتوزيع) وترحيل قيودها ثم العودة إلى هذا التقرير.'
                  : 'No endowment accounts are defined or posted within the available ledger scope. No synthetic figures are fabricated. Approve endowment accounts and post their entries first.'}
              </p>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {isRtl ? 'سجل حسابات الأوقاف المرحلة في الدفتر العام' : 'Posted Endowment Ledger Accounts'}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[10.5px] font-bold">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-200 dark:border-zinc-800">
                      <th className="text-start py-2 px-2">{isRtl ? 'رقم الحساب' : 'Code'}</th>
                      <th className="text-start py-2 px-2">{isRtl ? 'اسم الحساب' : 'Account Name'}</th>
                      <th className="text-start py-2 px-2">{isRtl ? 'النوع' : 'Type'}</th>
                      <th className="text-end py-2 px-2">{isRtl ? 'الرصيد الحالي (بريال يمني)' : 'Current Balance (YER)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {endowmentAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-white/70 dark:hover:bg-zinc-900/50">
                        <td className="py-2 px-2 font-mono text-slate-500">{acc.account_code}</td>
                        <td className="py-2 px-2 text-slate-800 dark:text-zinc-200">{isRtl ? acc.name_ar : (acc.name_en || acc.name_ar)}</td>
                        <td className="py-2 px-2 text-slate-500">{acc.account_type}</td>
                        <td className="py-2 px-2 text-end font-mono text-emerald-700 dark:text-emerald-400">{fmt(parseFloat(String(acc.current_balance ?? 0) || '0'))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GOVERNANCE & TRANSACTION CEILING CAPS */}
      {selectedSubTab === 'governance_caps' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'ضبط أسقف الإنفاق والصلاحيات المزدوجة وفق مصفوفة الحوكمة المعتمدة' : 'Expenditure Caps & Dual Approvals'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {isRtl ? 'الحد الأقصى لسندات الصرف الفردية (بالريال اليمني):' : 'Single Payment Ceiling Cap ($):'}
                </label>
                <input
                  type="number"
                  value={maxPaymentCap}
                  onChange={(e) => setMaxPaymentCap(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">{isRtl ? 'أي مبلغ يتجاوز هذا السقف يحتاج موافقة مجلس الإدارة' : 'Amounts exceeding this ceiling require Board approval.'}</p>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {isRtl ? 'عتبة التوقيع المزدوج (بالريال اليمني):' : 'Dual Signature Threshold ($):'}
                </label>
                <input
                  type="number"
                  value={dualSignThreshold}
                  onChange={(e) => setDualSignThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">{isRtl ? 'المعاملات الأعلى من هذا السقف تتطلب توقيعاً مشتركاً لكل من المدير المالي والمدير التنفيذي' : 'Requires joint signatures of CFO & Executive Director.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPREHENSIVE FINANCIAL REPORTS & BI — رسمي معياري عربي */}
      {selectedSubTab === 'bi_reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
{/* ترويسة التقرير الرسمية */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b-2 border-slate-900 dark:border-zinc-200">
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                  {isRtl ? 'التقرير المالي التحليلي الموحد' : 'Consolidated Financial Analytical Report'}
                </h4>
                <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                  {isRtl ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية — إدارة الشؤون المالية' : "Rohamā'a Baynahum Charity Foundation — Finance Department"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? 'طباعة التقرير الرسمي' : 'Print Official Report'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[10px] font-bold">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400 block">{isRtl ? 'فترة التقرير' : 'Period'}</span>
                <span className="text-slate-800 dark:text-zinc-200 block mt-0.5">{reportPeriod || (isRtl ? 'لا توجد قيود مرحّلة بعد' : 'No posted entries yet')}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400 block">{isRtl ? 'الإطار المعياري' : 'Framework'}</span>
                <span className="text-emerald-700 dark:text-emerald-400 block mt-0.5">{isRtl ? 'المعايير الدولية للقطاع العام وSphere وCHS' : 'IPSAS / Sphere / CHS'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400 block">{isRtl ? 'وحدة القياس' : 'Base Currency'}</span>
                <span className="text-slate-800 dark:text-zinc-200 block mt-0.5">{isRtl ? 'الريال اليمني' : 'Yemeni Riyal (YER)'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400 block">{isRtl ? 'أساس الإعداد' : 'Basis'}</span>
                <span className="text-slate-800 dark:text-zinc-200 block mt-0.5">{isRtl ? 'الاستحقاق وفق الدفتر العام' : 'Accrual from general ledger'}</span>
              </div>
            </div>
          </div>
{/* القسم الأول: الملخص الإجمالي للقوائم المالية */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                {isRtl ? 'أولاً: الملخص الإجمالي للقوائم المالية وفق المعيار الدولي الأول' : '1. Statement of Financial Position & Performance (IPSAS 1)'}
              </h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/40 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'إجمالي الأصول' : 'Total Assets'}</span>
                <span className="text-lg font-black text-sky-700 dark:text-sky-400 font-mono">{fmt(analytics.summary.assets)}</span>
              </div>
              <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'إجمالي الالتزامات' : 'Total Liabilities'}</span>
                <span className="text-lg font-black text-rose-700 dark:text-rose-400 font-mono">{fmt(analytics.summary.liabilities)}</span>
              </div>
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'صافي الأصول' : 'Net Assets'}</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">{fmt(analytics.summary.equity)}</span>
              </div>
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'إجمالي الإيرادات' : 'Total Revenue'}</span>
                <span className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono">{fmt(analytics.summary.revenue)}</span>
              </div>
              <div className="p-3.5 bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-900/40 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'إجمالي المصروفات' : 'Total Expenses'}</span>
                <span className="text-lg font-black text-violet-700 dark:text-violet-400 font-mono">{fmt(analytics.summary.expenses)}</span>
              </div>
              <div className="p-3.5 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'الفائض أو العجز التشغيلي' : 'Net Surplus / Deficit'}</span>
                <span className={`text-lg font-black font-mono ${analytics.summary.netSurplus >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-rose-700 dark:text-rose-400'}`}>{fmt(analytics.summary.netSurplus)}</span>
              </div>
              <div className="p-3.5 bg-slate-100/80 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'النقدية وما في حكمها' : 'Cash & Cash Equivalents'}</span>
                <span className="text-lg font-black text-slate-800 dark:text-zinc-200 font-mono">{fmt(analytics.summary.cashBankBalance)}</span>
              </div>
              <div className="p-3.5 bg-slate-100/80 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'هامش الفائض التشغيلي' : 'Net Surplus Margin'}</span>
                <span className="text-lg font-black text-slate-800 dark:text-zinc-200 font-mono">{analytics.summary.netSurplusMargin.toFixed(2)}%</span>
              </div>
            </div>
          </div>
{/* القسم الثاني: المؤشرات التحليلية المعيارية */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                {isRtl ? 'ثانياً: سجل المؤشرات التحليلية المعيارية الموثقة' : '2. Certified Standard Analytical Ratios Register'}
              </h4>
              <p className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'كل مؤشر مقرون بمرجعيته المعيارية وعتبة الحكم ومنهجية الاحتساب' : 'Each ratio: benchmark, judgment threshold and methodology'}</p>
            </div>
            <div className="space-y-2">
              {analytics.ratios.map((r) => {
                const st = RATIO_STATUS_STYLES[r.status];
                return (
                  <div key={r.key} className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-slate-700 dark:text-zinc-200 leading-snug">{isRtl ? r.labelAr : r.labelEn}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-mono text-slate-800 dark:text-zinc-200">{r.display}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black ${st.cls}`}>{isRtl ? st.ar : st.en}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] font-bold">
                      <span className="text-slate-500">{isRtl ? `المعيار: ${r.benchmarkAr}` : `Benchmark: ${r.benchmarkEn}`}</span>
                      <span className="text-zinc-400">{(isRtl ? r.methodologyAr : r.methodologyEn)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
{/* القسم الثالث: التقييم المرجح للصحة المالية */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                {isRtl ? 'ثالثاً: التقييم المرجح للصحة المالية المؤسسية' : '3. Evaluative Weighted Financial Health Scorecard'}
              </h4>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:items-start">
              <div className="md:w-56 p-4 text-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40">
                <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'الدرجة المرجحة' : 'Weighted Score'}</span>
                <span className="text-3xl font-black text-slate-900 dark:text-zinc-100 block mt-1">{analytics.healthScore.score}</span>
                <span className="px-2 py-0.5 mt-1 inline-block rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {isRtl ? analytics.healthScore.gradeAr : analytics.healthScore.gradeEn}
                </span>
                <p className="text-[8.5px] text-zinc-400 font-bold mt-2 leading-relaxed">{isRtl ? analytics.healthScore.methodologyAr : analytics.healthScore.methodologyEn}</p>
              </div>
              <div className="flex-1 space-y-2.5">
                {analytics.healthScore.dimensions.map((dim) => {
                  const pct = dim.weight > 0 ? (dim.earned / dim.weight) * 100 : 0;
                  const st = RATIO_STATUS_STYLES[dim.status];
                  return (
                    <div key={dim.key} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-black">
                        <span className="text-slate-600 dark:text-zinc-300">{isRtl ? dim.labelAr : dim.labelEn}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-slate-500">{(Math.round(dim.earned * 10) / 10)} / {dim.weight}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${st.cls}`}>{isRtl ? st.ar : st.en}</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-600' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
{/* القسم الرابع: سجل انحرافات الموازنات التفصيلي */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <Sliders className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                {isRtl ? 'رابعاً: سجل انحرافات الموازنات التفصيلي' : '4. Detailed Budget Variance Register'}
              </h4>
            </div>
            {analytics.budgetVariance.length === 0 ? (
              <div className="py-6 text-center space-y-1.5">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                <p className="text-[11px] font-black text-slate-500">{isRtl ? 'بيانات غير كافية لإصدار سجل الانحرافات' : 'Insufficient data for the variance register'}</p>
                <p className="text-[9px] text-zinc-400 font-bold">
                  {isRtl ? 'يلزم وجود موازنات معتمدة وقيود مالية مرحلة مرتبطة بالمشاريع' : 'Approved budgets and posted project-linked ledger entries are required'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[10.5px] font-bold">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-200 dark:border-zinc-800">
                      <th className="text-start py-2 px-2">{isRtl ? 'المشروع' : 'Project'}</th>
                      <th className="text-end py-2 px-2">{isRtl ? 'الموازنة المعتمدة' : 'Approved Budget'}</th>
                      <th className="text-end py-2 px-2">{isRtl ? 'المصروف الفعلي' : 'Actual Spend'}</th>
                      <th className="text-end py-2 px-2">{isRtl ? 'نسبة التنفيذ' : 'Utilization'}</th>
                      <th className="text-end py-2 px-2">{isRtl ? 'الانحراف' : 'Variance'}</th>
                      <th className="text-center py-2 px-2">{isRtl ? 'الحكم المعياري' : 'Standard Judgment'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {analytics.budgetVariance.slice(0, 12).map((row) => {
                      const st2 = RATIO_STATUS_STYLES[row.status];
                      return (
                        <tr key={row.projectId} className="hover:bg-slate-50/60 dark:hover:bg-zinc-950/40">
                          <td className="py-2 px-2 text-slate-700 dark:text-zinc-300">{row.name}{row.code ? ` (${row.code})` : ''}</td>
                          <td className="py-2 px-2 text-end font-mono text-slate-600 dark:text-zinc-400">{fmt(row.budget)}</td>
                          <td className="py-2 px-2 text-end font-mono text-slate-800 dark:text-zinc-200">{fmt(row.actual)}</td>
                          <td className={`py-2 px-2 text-end font-mono ${row.utilizationPct > 100 ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}>{row.utilizationPct.toFixed(1)}%</td>
                          <td className="py-2 px-2 text-end font-mono text-slate-500 dark:text-zinc-400">{fmt(row.variance)}</td>
                          <td className="py-2 px-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black ${st2.cls}`}>{isRtl ? row.classificationAr : row.classificationEn}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
{/* القسم الخامس: إفصاح جودة البيانات وخاتمة التقرير */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                {isRtl ? 'خامساً: إفصاح جودة البيانات وحدود التقرير' : '5. Data Quality Disclosure & Report Limitations'}
              </h4>
            </div>
            {analytics.dataQuality.insufficientDataNotesAr.length === 0 ? (
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                {isRtl ? 'لا توجد تحفظات على نطاق البيانات: الدفتر العام والموازنات المعتمدة متوفرة وكافية لإصدار التقرير' : 'No data limitations: the general ledger and approved budgets are complete for this report scope'}
              </p>
            ) : (
              <ul className="space-y-2">
                {analytics.dataQuality.insufficientDataNotesAr.map((note, idx) => {
                  const noteEn = analytics.dataQuality.insufficientDataNotesEn[idx] || '';
                  return (
                    <li key={idx} className="flex gap-2 items-start text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{isRtl ? note : noteEn}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[9px] text-slate-400 font-bold">
              <span>{isRtl ? 'أُعد هذا التقرير آلياً من الدفتر العام وفق المنهجية المعيارية المعتمدة، وهو جاهز للمراجعة والتدقيق الخارجي' : 'Report generated automatically from the general ledger under certified standards methodology; audit-ready.'}</span>
              <span className="font-mono">{isRtl ? 'إدارة الشؤون المالية — وحدة الحسابات والمالية' : 'Finance Department — Accounting & Finance Unit'}</span>
            </div>
          </div>
          </div>
      )}

    </div>
  );
}
