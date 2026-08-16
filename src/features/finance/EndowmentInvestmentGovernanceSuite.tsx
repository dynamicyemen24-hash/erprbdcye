import React, { useState } from 'react';
import { 
  Building2, 
  Coins, 
  ShieldCheck, 
  Lock, 
  TrendingUp, 
  Scale, 
  FileText, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  PieChart as PieIcon, 
  Printer, 
  Users, 
  Key, 
  Building,
  DollarSign,
  ArrowUpRight
} from 'lucide-react';

interface EndowmentInvestmentGovernanceSuiteProps {
  lang: 'ar' | 'en';
}

export default function EndowmentInvestmentGovernanceSuite({ lang }: EndowmentInvestmentGovernanceSuiteProps) {
  const isRtl = lang === 'ar';

  const [selectedSubTab, setSelectedSubTab] = useState<'endowment' | 'governance_caps' | 'bi_reports'>('endowment');

  // Transaction Ceiling Caps State
  const [maxPaymentCap, setMaxPaymentCap] = useState(25000);
  const [dualSignThreshold, setDualSignThreshold] = useState(10000);

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
          { id: 'endowment', labelAr: '🏢 المشاريع الاستثمارية والوقفية', labelEn: 'Endowment & Investment Projects', icon: Building2 },
          { id: 'governance_caps', labelAr: '🔒 حوكمة الصلاحيات وأسقف التعاملات', labelEn: 'Governance & Transaction Caps', icon: Lock },
          { id: 'bi_reports', labelAr: '📊 التقارير المالية والتقييمية الشاملة', labelEn: 'Comprehensive Financial BI Reports', icon: FileText },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = selectedSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white font-black shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{isRtl ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ENDOWMENT & INVESTMENT PROJECTS LEDGER */}
      {selectedSubTab === 'endowment' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'إجمالي أصل المحفظة الوقفية' : 'Endowment Principal Fund'}</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">$650,000.00</span>
              <span className="text-[10px] text-emerald-600 font-bold block">{isRtl ? 'أصل الوقف محمي ومحظر المساس به' : 'Principal Capital Protected'}</span>
            </div>

            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'العوائد الاستثمارية المحققة (FY2026)' : 'Realized Investment ROI'}</span>
              <span className="text-xl font-black text-blue-700 dark:text-blue-400">$78,400.00</span>
              <span className="text-[10px] text-blue-600 font-bold block">{isRtl ? 'نسبة الربح السنوي 12.06%' : '12.06% Annual ROI'}</span>
            </div>

            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'الفائض القابل للتوزيع الإغاثي' : 'Distributable Relief Yield'}</span>
              <span className="text-xl font-black text-purple-700 dark:text-purple-400">$62,720.00</span>
              <span className="text-[10px] text-purple-600 font-bold block">{isRtl ? 'مطابق للشروط الشرعية للواقف' : 'Shariah Compliant Distribution'}</span>
            </div>
          </div>

          {/* ENDOWMENT PROJECTS TABLE */}
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'سجل المشاريع الوقفية والاستثمارية' : 'Endowment & Investment Portfolio Registry'}</h4>
            <div className="space-y-3">
              {[
                { name: 'عقار الأمل الوقفي السكني - صنعاء', type: 'عقار تجاري سكوني', value: '$350,000', return: '$42,000 / سنة', status: 'نشط ومستقر' },
                { name: 'محفظة الصكوك الإسلامية المرابحة', type: 'صكوك مرابحة إسلامية', value: '$200,000', return: '$24,000 / سنة', status: 'نشط ومستقر' },
                { name: 'مشروع مزارع النخيل الاستثمارية', type: 'استثمار زراعي تنموي', value: '$100,000', return: '$12,400 / سنة', status: 'نمو متصاعد' },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                    <span className="text-[10px] text-slate-400">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isRtl ? 'قيمة الوقف' : 'Fund Capital'}</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">{item.value}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isRtl ? 'العائد الفعلي' : 'Yield'}</span>
                      <span className="font-mono font-bold text-emerald-600">{item.return}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOVERNANCE & TRANSACTION CEILING CAPS */}
      {selectedSubTab === 'governance_caps' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'ضبط أسقف الإنفاق والصلاحيات المزدوجة (Transaction Ceiling Controls)' : 'Expenditure Caps & Dual Approvals'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {isRtl ? 'الحد الأقصى لسندات الصرف الفردية ($):' : 'Single Payment Ceiling Cap ($):'}
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
                  {isRtl ? 'عتبة التوقيع المزدوج (Dual Sign Threshold $):' : 'Dual Signature Threshold ($):'}
                </label>
                <input
                  type="number"
                  value={dualSignThreshold}
                  onChange={(e) => setDualSignThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">{isRtl ? 'المعاملات أعلى من هذا السقف تتطلب توقيع المدير المالي + المدير التنفيذي' : 'Requires joint signatures of CFO & Executive Director.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPREHENSIVE FINANCIAL REPORTS & BI */}
      {selectedSubTab === 'bi_reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'مركز التقارير المالية التفصيلية والإجمالية والتقييمية' : 'Comprehensive Financial & BI Reporting Hub'}</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'ميزان المراجعة بالمجاميع والأرصدة', desc: 'تقرير تفصيلي بكافة الحسابات وفق IPSAS' },
                { title: 'قائمة المركز المالي الموحدة', desc: 'الأصول والالتزامات وصافي الأوقاف' },
                { title: 'تقرير انحراف الموازنات التشغيلية', desc: 'تحليل التباين بين المخطط والفعلي' },
                { title: 'تقرير أداء واستدامة المحفظة الوقفية', desc: 'تقييم عائد الأصول الوقفية ونموها' },
              ].map((rep, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 hover:border-emerald-500 transition-all cursor-pointer">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{rep.title}</h5>
                  <p className="text-[10px] text-slate-400">{rep.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
