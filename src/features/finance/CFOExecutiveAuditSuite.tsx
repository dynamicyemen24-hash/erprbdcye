import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  FileCheck, 
  Building2, 
  PieChart as PieIcon, 
  CheckCircle2, 
  Lock, 
  FileSpreadsheet, 
  Users, 
  Printer, 
  Sparkles,
  ArrowUpRight,
  Sliders,
  DollarSign
} from 'lucide-react';

interface CFOExecutiveAuditSuiteProps {
  lang: 'ar' | 'en';
}

type RoleView = 'cfo' | 'chief_accountant' | 'cpa_auditor' | 'revenue_director' | 'expense_director';

export default function CFOExecutiveAuditSuite({ lang }: CFOExecutiveAuditSuiteProps) {
  const isRtl = lang === 'ar';
  const [selectedRole, setSelectedRole] = useState<RoleView>('cfo');

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{isRtl ? 'جناح الإدارة المالية والتدقيق القانوني 360 (CFO & CPA Audit Suite)' : 'CFO & CPA Executive Audit Suite'}</span>
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-black rounded uppercase">
                IPSAS Gold Standard
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isRtl 
                ? 'منظومة متعددة الأدوار لمدير المالية، كبير المحاسبين، المدقق القانوني، مدير الإيرادات، ومدير المصروفات' 
                : 'Multi-stakeholder suite for CFO, Chief Accountant, CPA Auditor, Revenue Director, and Expenditure Director.'
              }
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-emerald-600" />
          <span>{isRtl ? 'طباعة تقرير التدقيق الرسمي' : 'Print Formal Audit Report'}</span>
        </button>
      </div>

      {/* STAKEHOLDER ROLE SELECTOR SWITCHER */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar p-1.5 bg-slate-100 dark:bg-zinc-950 rounded-2xl text-xs font-bold">
        {[
          { id: 'cfo', labelAr: '👔 مدير المالية (CFO)', labelEn: 'Chief Financial Officer', icon: Coins },
          { id: 'chief_accountant', labelAr: '📊 مدير الحسابات (Chief Accountant)', labelEn: 'Chief Accountant', icon: Scale },
          { id: 'cpa_auditor', labelAr: '🛡️ المدقق والمراجع القانوني (CPA)', labelEn: 'CPA External Auditor', icon: ShieldCheck },
          { id: 'revenue_director', labelAr: '📈 مدير الإيرادات والمنح', labelEn: 'Revenue & Grants Director', icon: TrendingUp },
          { id: 'expense_director', labelAr: '📉 مدير المصروفات والنفقات', labelEn: 'Expenditure Director', icon: TrendingDown },
        ].map((role) => {
          const IconComp = role.icon;
          const isActive = selectedRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id as RoleView)}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-600 text-white font-black shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{isRtl ? role.labelAr : role.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* ROLE 1: CFO EXECUTIVE PERSPECTIVE */}
      {selectedRole === 'cfo' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">{isRtl ? 'نسبة تغطية السيولة النقدية' : 'Liquidity Coverage Ratio'}</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">4.2x Months</span>
              <span className="text-[10px] text-emerald-600 font-bold block">{isRtl ? 'آمن جداً وقابل للاستدامة' : 'High Solvency Index'}</span>
            </div>

            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">{isRtl ? 'احتياطي الأوقاف والمنح المقيدة' : 'Restricted Fund Reserves'}</span>
              <span className="text-xl font-black text-blue-700 dark:text-blue-400">$340,500.00</span>
              <span className="text-[10px] text-blue-600 font-bold block">{isRtl ? 'معزولة ومحمية بحساب أمانة' : 'Ring-Fenced Trust Account'}</span>
            </div>

            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">{isRtl ? 'معدل الحرق النقدي الشهري' : 'Monthly Cash Burn Rate'}</span>
              <span className="text-xl font-black text-purple-700 dark:text-purple-400">$28,400 / mo</span>
              <span className="text-[10px] text-purple-600 font-bold block">{isRtl ? 'ضمن النطاق المعتمد للموازنة' : 'Within Budget Limits'}</span>
            </div>

            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">{isRtl ? 'مؤشر كفاءة المصاريف الإدارية' : 'Admin Expense Ratio'}</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-400">4.8%</span>
              <span className="text-[10px] text-amber-600 font-bold block">{isRtl ? 'أقل من السقف المعياري (10%)' : 'Exceeds Donor CHS Benchmark'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 2: CHIEF ACCOUNTANT PERSPECTIVE */}
      {selectedRole === 'chief_accountant' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
              <span>{isRtl ? 'ميزان المراجعة المزدوج وقوة التوازن (Debit = Credit Audit)' : 'Double-Entry Ledger Balance Verification'}</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-black rounded">Balanced 100%</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-center text-xs">
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'إجمالي الحركة المدينة (Debit)' : 'Total Debit'}</span>
                <span className="text-base font-black text-slate-900 dark:text-white">$1,450,200.00</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'إجمالي الحركة الدائنة (Credit)' : 'Total Credit'}</span>
                <span className="text-base font-black text-slate-900 dark:text-white">$1,450,200.00</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'انحراف التوازن (Variance)' : 'Variance'}</span>
                <span className="text-base font-black text-emerald-600">$0.00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 3: CPA EXTERNAL AUDITOR PERSPECTIVE */}
      {selectedRole === 'cpa_auditor' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'سجل التدقيق غير القابل للتعديل والتشفير الرقمي (Immutable Audit Trail)' : 'Immutable Cryptographic Audit Trail'}</span>
              </h4>
              <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-600 text-[10px] font-mono font-bold rounded">SHA-256 Verified</span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { ref: 'JV-2026-0841', user: 'ياسر باوزير (كبير المحاسبين)', action: 'اعتماد قيد صرف سلال غذائية $14,200', hash: '8f9a2b...c41e', status: 'موثق ومشفر' },
                { ref: 'PO-2026-0112', user: 'خالد العماري (مدير المشتريات)', action: 'إصدار أمر توريد مضخات مياه $22,500', hash: '3e1c7d...f901', status: 'موثق ومشفر' },
              ].map((log, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-emerald-600 font-bold block">{log.ref} • {log.user}</span>
                    <span className="text-slate-500">{log.action}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    {log.hash}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ROLE 4: REVENUE & GRANTS DIRECTOR PERSPECTIVE */}
      {selectedRole === 'revenue_director' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'تحليل التبرعات المقيدة والمطلقة والعوائد الاستثمارية' : 'Restricted vs Unrestricted Revenue Streams'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'تبرعات مقيدة (Restricted Grants)' : 'Restricted Grants'}</span>
                <span className="text-lg font-black text-blue-600">$210,000.00 (72%)</span>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'تبرعات مطلقة وعوائد أوقاف (Unrestricted & Endowments)' : 'Unrestricted & Endowments'}</span>
                <span className="text-lg font-black text-emerald-600">$81,500.00 (28%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 5: EXPENDITURE DIRECTOR PERSPECTIVE */}
      {selectedRole === 'expense_director' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'نظام الحماية من تجاوز الميزانية (Budget Encumbrance Control)' : 'Budget Encumbrance Control'}</h4>
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-zinc-200 block">{isRtl ? 'مشروع حفر وتأهيل آبار المياه - تعز' : 'WASH Water Well Drilling - Taiz'}</span>
                <span className="text-[10px] text-slate-400">{isRtl ? 'الميزانية: $50,000 | المصروف: $32,000 | المحجوز: $10,000' : 'Budget: $50K | Spent: $32K | Encumbered: $10K'}</span>
              </div>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 font-mono font-bold rounded">
                84% Utilized
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
