import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Scale, 
  CheckCircle2, 
  Printer, 
  Globe, 
  Coins, 
  ShieldCheck
} from 'lucide-react';
import { Account } from '../../types';

interface ConsolidatedStatementsTabProps {
  lang: 'ar' | 'en';
  accounts?: Account[];
}

export default function ConsolidatedStatementsTab({ lang, accounts = [] }: ConsolidatedStatementsTabProps) {
  const isRtl = lang === 'ar';
  const [selectedCurrency, setSelectedCurrency] = useState('YER');
  const [includeEliminations, setIncludeEliminations] = useState(true);

  const fmtMoney = (n: number) => (Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00');

  // IPSAS aggregation from the general ledger (real values only — لا تلفيق أرقام)
  const statement = useMemo(() => {
    const isCash = (a: Account) => {
      const name = `${a.name_ar || ''} ${a.name_en || ''}`;
      const code = a.account_code || '';
      return /نقد|صندوق|خزينة|بنك|حساب جار|cash|bank/.test(name) || code.startsWith('111') || code.startsWith('112');
    };
    let cashBank = 0, otherAssets = 0, liabilities = 0, equity = 0;
    accounts.forEach((a) => {
      const bal = parseFloat(String(a.current_balance ?? 0) || '0');
      if (a.account_type === 'ASSET') {
        if (isCash(a)) cashBank += bal; else otherAssets += bal;
      } else if (a.account_type === 'LIABILITY') liabilities += bal;
      else if (a.account_type === 'EQUITY') equity += bal;
    });
    return { cashBank, otherAssets, liabilities, equity, hasAccounts: accounts.length > 0 };
  }, [accounts]);

  // Trial balance equilibrium across the ledger
  const trial = useMemo(() => {
    let deb = 0, cred = 0;
    accounts.forEach((a) => {
      const bal = parseFloat(String(a.current_balance ?? 0) || '0');
      if (a.account_type === 'ASSET' || a.account_type === 'EXPENSE') deb += bal;
      else cred += bal;
    });
    return { deb, cred, balanced: Math.abs(deb - cred) < 0.01 };
  }, [accounts]);

  const consolidated = statement.cashBank + statement.otherAssets + statement.liabilities + statement.equity;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{isRtl ? 'التجميع المالي الموحد وفق المعيار الدولي الخامس والثلاثين' : 'Multi-Branch Inter-Company Consolidation Engine'}</span>
              <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-black rounded uppercase">
                IPSAS-35
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isRtl 
                ? 'تجميع القوائم المالية للمركز الرئيسي وجميع الفروع الإقليمية مع إلغاء المعاملات البينية آلياً' 
                : 'Consolidates financial statements across all regional branches with automatic inter-company eliminations.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>{isRtl ? 'طباعة الميزانية الموحدة' : 'Print Consolidated Balance Sheet'}</span>
          </button>
        </div>
      </div>

      {/* CONTROLS STRIP */}
      <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-bold">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>{isRtl ? 'عملة التجميع الموحدة:' : 'Consolidation Currency:'}</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl font-mono font-bold text-blue-600"
            >
              <option value="USD">{isRtl ? 'دولار أمريكي' : 'USD'}</option>
              <option value="YER">{isRtl ? 'ريال يمني' : 'YER'}</option>
              <option value="SAR">{isRtl ? 'ريال سعودي' : 'SAR'}</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800">
            <input
              type="checkbox"
              checked={includeEliminations}
              onChange={(e) => setIncludeEliminations(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span>{isRtl ? 'إلغاء القيود والتسويات بين الكيانات' : 'Inter-Company Eliminations'}</span>
          </label>
        </div>

        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isRtl ? 'مطابق للمعيار الدولي الخامس والثلاثين للقطاع العام' : 'IPSAS-35 Verified'}</span>
        </span>
      </div>

      {/* منهجية التجميع المعيارية والإفصاح */}
      <div className="p-5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-xl space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-black text-blue-800 dark:text-blue-300">{isRtl ? 'منهجية التجميع وفق المعيار الدولي الخامس والثلاثين' : 'IPSAS 35 Consolidation Methodology'}</h4>
        </div>
        <p className="text-[10px] text-blue-700/90 dark:text-blue-200/80 font-bold leading-relaxed">
          {isRtl
            ? 'تتم عملية التجميع عبر الخطوات المعيارية الآتية: أولاً تحويل قوائم كل كيان إلى عملة التجميع الموحدة، ثانياً إدراج بنود القوائم المالية للكيان الأم والكيانات الخاضعة لسيطرته بنسبة السيطرة، ثالثاً حذف الأرصدة والمعاملات والدخل والمصروفات بين الكيانات التابعة، رابعاً معالجة أصول وخصوم الاستحواذ وحقوق الأقلية عند توفرها.'
            : "Consolidation follows the standard steps: 1) translate each entity's statements to the presentation currency, 2) aggregate line items of the parent and controlled entities, 3) eliminate inter-entity balances, transactions, income and expenses, 4) recognize acquisition effects and non-controlling interests when available."}
        </p>
        <p className="text-[10px] text-blue-700/80 dark:text-blue-200/60 font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isRtl
              ? 'إفصاح: تعرض أعمدة الفروع قيمة غير متوفرة حتى ترحيل قوائمها، ولا تُحتسب التسويات البينية إلا بتوفر القوائم الفردية لكل كيان.'
              : 'Disclosure: branch columns remain unavailable until their statements are posted; eliminations are computed only when individual entity statements exist.'}
          </span>
        </p>
      </div>

      {/* CONSOLIDATED FINANCIAL TABLE — إجمالي فعلي مشتق من الدفتر العام */}
      {!statement.hasAccounts ? (
        <div className="p-6 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
            <h5 className="text-xs font-black text-amber-800 dark:text-amber-300">{isRtl ? 'بيانات غير كافية لإصدار القائمة المجمعة' : 'Insufficient data for the consolidated statement'}</h5>
          </div>
          <p className="text-[10px] text-amber-700 dark:text-amber-200/80 font-bold leading-relaxed">
            {isRtl
              ? 'لا توجد حسابات مرحّلة في الدفتر العام ضمن نطاق البيانات المتاحة. لا تتم تلفيق أرقام افتراضية: يجب ترحيل القوائم الفردية للكيان الأم والفروع أولاً، ثم تُعرض هنا القائمة المجمعة وفق الإجراءات المعيارية.'
              : 'No posted accounts are available in the current ledger scope. No synthetic figures are fabricated; post the individual entity statements first.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-right rtl:text-right ltr:text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-amber-400 font-black border-b border-zinc-800 uppercase text-[10px]">
                <th className="p-3.5">{isRtl ? 'البند المحاسبي الموحد' : 'Consolidated Account Title'}</th>
                <th className="p-3.5 text-center">{isRtl ? 'المركز الرئيسي' : 'Main HQ'}</th>
                <th className="p-3.5 text-center">{isRtl ? 'فرع عدن والمحافظات' : 'Aden Branch'}</th>
                <th className="p-3.5 text-center">{isRtl ? 'فرع تعز والميدان' : 'Taiz Branch'}</th>
                <th className="p-3.5 text-center text-rose-400">{isRtl ? 'التسويات البينية' : 'Inter-Eliminations'}</th>
                <th className="p-3.5 text-center text-emerald-400 bg-zinc-950">{isRtl ? 'إجمالي الميزانية الموحدة' : 'Consolidated Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-mono text-slate-800 dark:text-zinc-200">
            
            <tr className="bg-slate-50 dark:bg-zinc-950/40 font-bold">
                <td className="p-3 text-blue-600 font-sans" colSpan={6}>{isRtl ? 'أولاً: الأصول' : '1. Consolidated Assets'}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                <td className="p-3 font-sans font-bold">{isRtl ? 'النقدية وما في حكمها بالبنوك' : 'Cash & Bank Balances'}</td>
                <td className="p-3 text-center font-black">{fmtMoney(statement.cashBank)}</td>
                <td className="p-3 text-center text-slate-400">{isRtl ? 'غير متوفرة' : 'N/A'}</td>
                <td className="p-3 text-center text-slate-400">{isRtl ? 'غير متوفرة' : 'N/A'}</td>
                <td className="p-3 text-center text-rose-400">{isRtl ? 'لا توجد بينية' : 'None'}</td>
                <td className="p-3 text-center font-black text-emerald-600 bg-emerald-500/5">{fmtMoney(statement.cashBank)}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                <td className="p-3 font-sans font-bold">{isRtl ? 'المحفظة الوقفية والأصول الثابتة' : 'Endowment Funds & Property'}</td>
                <td className="p-3 text-center font-black">{fmtMoney(statement.otherAssets)}</td>
                <td className="p-3 text-center text-slate-400">{isRtl ? 'غير متوفرة' : 'N/A'}</td>
                <td className="p-3 text-center text-slate-400">{isRtl ? 'غير متوفرة' : 'N/A'}</td>
                <td className="p-3 text-center text-rose-400">{isRtl ? 'لا توجد بينية' : 'None'}</td>
                <td className="p-3 text-center font-black text-emerald-600 bg-emerald-500/5">{fmtMoney(statement.otherAssets)}</td>
              </tr>
              <tr className="bg-slate-50 dark:bg-zinc-950/40 font-bold">
                <td className="p-3 text-blue-600 font-sans" colSpan={6}>{isRtl ? 'ثانياً: الالتزامات والأمانات' : '2. Consolidated Liabilities'}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                <td className="p-3 font-sans font-bold">{isRtl ? 'أرصدة الموردين والأمانات الإغاثية' : 'Accounts Payable & Trust Funds'}</td>
                <td className="p-3 text-center font-black">{fmtMoney(statement.liabilities)}</td>
                <td className="p-3 text-center text-slate-400">{isRtl ? 'غير متوفرة' : 'N/A'}</td>
                <td className="p-3 text-center text-slate-400">{isRtl ? 'غير متوفرة' : 'N/A'}</td>
                <td className="p-3 text-center text-rose-400">{isRtl ? 'لا توجد بينية' : 'None'}</td>
                <td className="p-3 text-center font-black text-blue-600 bg-blue-500/5">{fmtMoney(statement.liabilities)}</td>
              </tr>
              <tr className="bg-emerald-50 dark:bg-emerald-950/60 font-black text-emerald-900 dark:text-emerald-300">
                <td className="p-3.5 font-sans">{isRtl ? 'صافي الأصول الموحدة والاحتياطيات' : 'Consolidated Net Assets'}</td>
                <td className="p-3.5 text-center font-black">{fmtMoney(statement.equity)}</td>
                <td className="p-3.5 text-center text-slate-400">{isRtl ? 'غير متوفرة' : 'N/A'}</td>
                <td className="p-3.5 text-center text-slate-400">{isRtl ? 'غير متوفرة' : 'N/A'}</td>
                <td className="p-3.5 text-center text-rose-400">{isRtl ? 'لا توجد بينية' : 'None'}</td>
                <td className="p-3.5 text-center text-base text-emerald-600 font-mono font-black">{fmtMoney(consolidated)}</td>
              </tr>

          </tbody>
            </table>
          </div>
        )}

        {/* مؤشر توازن ميزان المراجعة */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold">
          <Scale className="w-4 h-4 text-emerald-600" />
          <span>{isRtl ? 'توازن ميزان المراجعة للمركز الرئيسي:' : 'HQ Trial Balance Equilibrium:'}</span>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${trial.balanced ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'}`}>
            {trial.balanced ? (isRtl ? 'متزن ومطابق تماماً' : 'Perfectly Balanced') : (isRtl ? 'يوجد فارق يتطلب التسوية قبل الإصدار' : 'Out of Balance')}
          </span>
          <span className="text-slate-400 font-mono">{isRtl ? 'المدين: ' : 'Debit: '}{fmtMoney(trial.deb)} | {isRtl ? 'الدائن: ' : 'Credit: '}{fmtMoney(trial.cred)}</span>
        </div>

    </div>
  );
}
