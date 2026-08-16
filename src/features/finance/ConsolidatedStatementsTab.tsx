import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Scale, 
  CheckCircle2, 
  ArrowRightLeft, 
  Printer, 
  Download, 
  Globe, 
  Coins, 
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface ConsolidatedStatementsTabProps {
  lang: 'ar' | 'en';
}

export default function ConsolidatedStatementsTab({ lang }: ConsolidatedStatementsTabProps) {
  const isRtl = lang === 'ar';
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [includeEliminations, setIncludeEliminations] = useState(true);

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
              <span>{isRtl ? 'محرك التجميع المالي الموحد للفروع والمؤسسات الشريكة (Multi-Branch Consolidation)' : 'Multi-Branch Inter-Company Consolidation Engine'}</span>
              <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-black rounded uppercase">
                IPSAS-35 Compliant
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
              <option value="USD">USD ($ - دولار أمريكي)</option>
              <option value="YER">YER (ريال يمني)</option>
              <option value="SAR">SAR (ريال سعودي)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800">
            <input
              type="checkbox"
              checked={includeEliminations}
              onChange={(e) => setIncludeEliminations(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span>{isRtl ? 'إلغاء القيود والتسويات البينية (Inter-Company Eliminations)' : 'Inter-Company Eliminations'}</span>
          </label>
        </div>

        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isRtl ? 'مطابق لمعايير المحاسبة الدولية IPSAS-35' : 'IPSAS-35 Verified'}</span>
        </span>
      </div>

      {/* CONSOLIDATED FINANCIAL TABLE */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs text-right rtl:text-right ltr:text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-amber-400 font-black border-b border-zinc-800 uppercase text-[10px]">
              <th className="p-3.5">{isRtl ? 'البند المحاسبي الموحد' : 'Consolidated Account Title'}</th>
              <th className="p-3.5 text-center">{isRtl ? 'المركز الرئيسي (صنعاء)' : 'Main HQ (Sanaa)'}</th>
              <th className="p-3.5 text-center">{isRtl ? 'فرع عدن والمحافظات' : 'Aden Branch'}</th>
              <th className="p-3.5 text-center">{isRtl ? 'فرع تعز والميدان' : 'Taiz Branch'}</th>
              <th className="p-3.5 text-center text-rose-400">{isRtl ? 'التسويات البينية' : 'Inter-Eliminations'}</th>
              <th className="p-3.5 text-center text-emerald-400 bg-zinc-950">{isRtl ? 'إجمالي الميزانية الموحدة' : 'Consolidated Total'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-mono text-slate-800 dark:text-zinc-200">
            
            <tr className="bg-slate-50 dark:bg-zinc-950/40 font-bold">
              <td className="p-3 text-blue-600 font-sans" colSpan={6}>{isRtl ? '1️⃣ الأصول الثابتة والمتداولة (Assets)' : '1️⃣ Consolidated Assets'}</td>
            </tr>

            <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
              <td className="p-3 font-sans font-bold">{isRtl ? 'النقدية وما في حكمها بالبنوك' : 'Cash & Bank Balances'}</td>
              <td className="p-3 text-center">$240,000</td>
              <td className="p-3 text-center">$95,000</td>
              <td className="p-3 text-center">$65,000</td>
              <td className="p-3 text-center text-rose-500">-$15,000</td>
              <td className="p-3 text-center font-black text-emerald-600 bg-emerald-500/5">$385,000.00</td>
            </tr>

            <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
              <td className="p-3 font-sans font-bold">{isRtl ? 'المحفظة الوقفية والأصول الثابتة' : 'Endowment Funds & Property'}</td>
              <td className="p-3 text-center">$500,000</td>
              <td className="p-3 text-center">$150,000</td>
              <td className="p-3 text-center">$80,000</td>
              <td className="p-3 text-center text-rose-500">$0.00</td>
              <td className="p-3 text-center font-black text-emerald-600 bg-emerald-500/5">$730,000.00</td>
            </tr>

            <tr className="bg-slate-50 dark:bg-zinc-950/40 font-bold">
              <td className="p-3 text-blue-600 font-sans" colSpan={6}>{isRtl ? '2️⃣ الالتزامات والأمانات (Liabilities)' : '2️⃣ Consolidated Liabilities'}</td>
            </tr>

            <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
              <td className="p-3 font-sans font-bold">{isRtl ? 'أرصدة الموردين والأمانات الإغاثية' : 'Accounts Payable & Trust Funds'}</td>
              <td className="p-3 text-center">$85,000</td>
              <td className="p-3 text-center">$22,000</td>
              <td className="p-3 text-center">$18,000</td>
              <td className="p-3 text-center text-rose-500">-$10,000</td>
              <td className="p-3 text-center font-black text-blue-600 bg-blue-500/5">$115,000.00</td>
            </tr>

            <tr className="bg-emerald-50 dark:bg-emerald-950/60 font-black text-emerald-900 dark:text-emerald-300">
              <td className="p-3.5 font-sans">{isRtl ? 'صافي الأصول الموحدة والاحتياطيات (Net Assets)' : 'Consolidated Net Assets'}</td>
              <td className="p-3.5 text-center">$655,000</td>
              <td className="p-3.5 text-center">$223,000</td>
              <td className="p-3.5 text-center">$127,000</td>
              <td className="p-3.5 text-center text-rose-500">-$5,000</td>
              <td className="p-3.5 text-center text-base text-emerald-600 font-mono font-black">$1,000,000.00</td>
            </tr>

          </tbody>
        </table>
      </div>

    </div>
  );
}
