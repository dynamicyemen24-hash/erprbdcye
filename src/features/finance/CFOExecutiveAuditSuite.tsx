import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  FileCheck, 
  Building2, 
  Lock, 
  Printer
} from 'lucide-react';
import { Account, Transaction, TransactionLine, Project } from '../../types';
import {
  computeFinancialAnalytics,
  RATIO_STATUS_STYLES,
} from '../../core/ledger/financialAnalytics';

interface CFOExecutiveAuditSuiteProps {
  lang: 'ar' | 'en';
  accounts?: Account[];
  transactions?: Transaction[];
  lines?: TransactionLine[];
  projects?: Project[];
}

type RoleView = 'cfo' | 'chief_accountant' | 'cpa_auditor' | 'revenue_director' | 'expense_director';

export default function CFOExecutiveAuditSuite({
  lang,
  accounts = [],
  transactions = [],
  lines = [],
  projects = []
}: CFOExecutiveAuditSuiteProps) {
  const isRtl = lang === 'ar';
  const [selectedRole, setSelectedRole] = useState<RoleView>('cfo');

  const fmtMoney = (n: number) => (Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00');

  // Standard Analytics Engine — مشتقة حصراً من الدفتر العام
  const analytics = useMemo(
    () => computeFinancialAnalytics({
      accounts: accounts as any,
      transactions: transactions as any,
      lines: lines as any,
      projects: projects as any,
    }),
    [accounts, transactions, lines, projects]
  );

  // ميزان المراجعة الحقيقي
  const trial = useMemo(() => {
    let deb = 0, cred = 0;
    accounts.forEach((a) => {
      const bal = parseFloat(String(a.current_balance ?? 0) || '0');
      if (a.account_type === 'ASSET' || a.account_type === 'EXPENSE') deb += bal;
      else cred += bal;
    });
    return { deb, cred, balanced: Math.abs(deb - cred) < 0.01 };
  }, [accounts]);

  // سجل حركات حقيقي من القيود المرحلة — بدل سجلات وهمية
  const auditEntries = useMemo(() => {
    return transactions
      .filter((t) => t.is_posted !== false)
      .slice(0, 8)
      .map((t) => ({
        ref: t.transaction_number,
        date: new Date(t.transaction_date).toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US'),
        type: t.transaction_type,
        amount: parseFloat(String(t.total_debit ?? 0) || '0'),
        desc: t.description,
      }));
  }, [transactions, lang]);

  const hasLedger = transactions.length > 0 || accounts.length > 0;

  // إجراءات التحقق المعيارية (ISA 500 / INTOSAI) — محتوى مهني رسمي ثابت
  const auditProcedures = [
    { code: 'إ.ت.1', titleAr: 'التحقق من اكتمال أدلة الإثبات للمستندات المالية', titleEn: 'Completeness of supporting evidence', basis: 'ISA 500' },
    { code: 'إ.ت.2', titleAr: 'اختبارات الرقابة على الترخيص والتوقيع المزدوج', titleEn: 'Authorization & dual-signature controls testing', basis: 'ISA 315' },
    { code: 'إ.ت.3', titleAr: 'المراجعة التحليلية للفروقات الجوهرية بين الموازنة والفعلي', titleEn: 'Analytical review of material budget variances', basis: 'ISA 520' },
    { code: 'إ.ت.4', titleAr: 'مطابقة أرصدة النقد والبنوك مع الإثباتات المصرفية', titleEn: 'Cash & bank reconciliation against statements', basis: 'ISA 505' },
    { code: 'إ.ت.5', titleAr: 'التحقق من التزام الصناديق المقيدة بشروط المانحين', titleEn: 'Restricted funds compliance with donor conditions', basis: 'ISA 250' },
  ];

  // مصفوفة الفصل الوظيفي — حوكمة مؤتمتة
  const segregationOfDuties = [
    { funcAr: 'إصدار أوامر الشراء', funcEn: 'Purchase order initiation', dutyAr: 'المشتريات', dutyEn: 'Procurement' },
    { funcAr: 'الترخيص والاعتماد', funcEn: 'Approval & authorization', dutyAr: 'الإدارة المالية', dutyEn: 'Finance management' },
    { funcAr: 'الحفظ والاحتفاظ بالسجلات', funcEn: 'Custody of records', dutyAr: 'أمين المستندات', dutyEn: 'Document custodian' },
    { funcAr: 'الترحيل وإقفال الدفاتر', funcEn: 'Posting & period closing', dutyAr: 'المراجع الداخلي', dutyEn: 'Internal control' },
  ];

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
              <span>{isRtl ? 'جناح الإدارة المالية والتدقيق القانوني الشامل 360' : 'CFO & CPA Executive Audit Suite'}</span>
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-black rounded uppercase">
                IPSAS
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
          { id: 'cfo', labelAr: 'المدير المالي', labelEn: 'Chief Financial Officer', icon: Coins },
          { id: 'chief_accountant', labelAr: 'مدير الحسابات العامة', labelEn: 'Chief Accountant', icon: Scale },
          { id: 'cpa_auditor', labelAr: 'المراجع القانوني المعتمد', labelEn: 'CPA External Auditor', icon: ShieldCheck },
          { id: 'revenue_director', labelAr: 'مدير الإيرادات والمنح', labelEn: 'Revenue & Grants Director', icon: TrendingUp },
          { id: 'expense_director', labelAr: 'مدير المصروفات والمدفوعات', labelEn: 'Expenditure Director', icon: TrendingDown },
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

      {/* ROLE 1: CFO EXECUTIVE PERSPECTIVE — مؤشرات حقيقية من المحرك المعياري */}
      {selectedRole === 'cfo' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'منظور المدير المالي: مؤشرات السيولة والملاءة والاستدامة' : 'CFO Perspective: Liquidity, Solvency & Sustainability'}</span>
            </h4>
            {!hasLedger ? (
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {isRtl ? 'بيانات غير كافية: لا توجد قيود مرحّلة بعد في الدفتر العام لإصدار المؤشرات. لا تتم تلفيق أرقام افتراضية.' : 'Insufficient data: no posted ledger entries yet; no synthetic figures are fabricated.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">{isRtl ? 'مؤشر كفاية السيولة والالتزامات' : 'Current Solvency Ratio'}</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{analytics.currentRatio.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-600 font-bold block">{isRtl ? 'المعيار المرجعي: لا يقل عن 1.5 مرة' : 'Benchmark: 1.5x or higher'}</span>
                </div>
                <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">{isRtl ? 'كفاءة الإنفاق الميداني المباشر' : 'Direct Program Spending Ratio'}</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-400">{analytics.programEfficiency.toFixed(2)}%</span>
                  <span className="text-[10px] text-blue-600 font-bold block">{isRtl ? 'المعيار: لا تقل عن 70% وفق Sphere وCHS' : 'Benchmark: 70% or higher (Sphere / CHS)'}</span>
                </div>
                <div className="p-4 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">{isRtl ? 'هامش الفائض التشغيلي' : 'Net Surplus Margin'}</span>
                  <span className="text-xl font-black text-purple-700 dark:text-purple-400">{analytics.summary.netSurplusMargin.toFixed(2)}%</span>
                  <span className="text-[10px] text-purple-600 font-bold block">{isRtl ? 'فائض أو عجز الفترة وفق الدفتر العام' : 'Period surplus / deficit from the ledger'}</span>
                </div>
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">{isRtl ? 'النقدية وما في حكمها' : 'Cash & Cash Equivalents'}</span>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono">{fmtMoney(analytics.summary.cashBankBalance)}</span>
                  <span className="text-[10px] text-amber-600 font-bold block">{isRtl ? 'بالريال اليمني' : 'In YER'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}{/* ROLE 2: CHIEF ACCOUNTANT PERSPECTIVE — ميزان المراجعة الحقيقي */}
      {selectedRole === 'chief_accountant' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
              <span>{isRtl ? 'ميزان المراجعة والتحقق من توازن القيد المزدوج' : 'Double-Entry Ledger Balance Verification'}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${trial.balanced ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'}`}>
                {trial.balanced ? (isRtl ? 'متزن' : 'Balanced') : (isRtl ? 'غير متزن' : 'Out of Balance')}
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-center text-xs">
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'إجمالي الحركة المدينة' : 'Total Debit'}</span>
                <span className="text-base font-black text-slate-900 dark:text-white">{fmtMoney(trial.deb)}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'إجمالي الحركة الدائنة' : 'Total Credit'}</span>
                <span className="text-base font-black text-slate-900 dark:text-white">{fmtMoney(trial.cred)}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'فارق التوازن' : 'Variance'}</span>
                <span className="text-base font-black text-emerald-600">{fmtMoney(Math.abs(trial.deb - trial.cred))}</span>
              </div>
            </div>
            {!hasLedger && (
              <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                {isRtl ? 'بيانات غير كافية: لا توجد حسابات مرحّلة في الدفتر العام ضمن النطاق المتاح.' : 'Insufficient data: no posted accounts in the current ledger scope.'}
              </p>
            )}
          </div>
        </div>
      )}{/* ROLE 3: CPA EXTERNAL AUDITOR PERSPECTIVE — إجراءات مهنية حقيقية وسجل حركات فعلي */}
      {selectedRole === 'cpa_auditor' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {isRtl ? 'برنامج إجراءات التحقق المهنية وفق معايير المراجعة الدولية' : 'Professional Audit Procedures (ISA / INTOSAI)'}
              </h4>
            </div>
            <div className="space-y-2 text-xs">
              {auditProcedures.map((p) => (
                <div key={p.code} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-emerald-600 font-bold block">{p.code} • {(isRtl ? p.titleAr : p.titleEn)}</span>
                    <span className="text-[10px] text-slate-400">
                      {isRtl ? `المعيار المرجعي: ${p.basis}` : `Reference standard: ${p.basis}`}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 rounded font-bold text-[9px]">{isRtl ? 'جاهز للتنفيذ' : 'Ready'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-600" />
              <span>{isRtl ? 'سجل الحركات المالية المرحلة (عينة أولية لأدلة المراجعة)' : 'Posted Financial Activity Register (Preliminary Audit Evidence)'}</span>
            </h4>
            {auditEntries.length === 0 ? (
              <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                {isRtl ? 'لا توجد قيود مرحّلة بعد في الدفتر العام — يُستكمل السجل فور ترحيل أول قيد معتمد.' : 'No posted entries yet — this register fills as soon as the first approved entry is posted.'}
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {auditEntries.map((entry, idx) => (
                  <div key={idx} className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-emerald-600 font-bold block">{entry.ref} • {entry.date}</span>
                      <span className="text-slate-500">{entry.desc || (isRtl ? '(بدون وصف)' : '(no description)')}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">
                      {fmtMoney(entry.amount)} {isRtl ? 'ريال' : 'YER'} • {entry.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {isRtl ? 'مصفوفة الفصل بين الوظائف (ضابط حوكمة إلزامي)' : 'Segregation of Duties Matrix'}
              </h4>
            </div>
            <div className="space-y-2 text-xs">
              {segregationOfDuties.map((r, idx) => (
                <div key={idx} className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-700 dark:text-zinc-200">{(isRtl ? r.funcAr : r.funcEn)}</span>
                  <span className="text-[10px] text-amber-600 font-bold">{isRtl ? 'مسؤوليتها: ' : 'Owner: '}{(isRtl ? r.dutyAr : r.dutyEn)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}{/* ROLE 4: REVENUE & GRANTS DIRECTOR PERSPECTIVE — إيرادات حقيقية مع إفصاح */}
      {selectedRole === 'revenue_director' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'تحليل الإيرادات المحصلة وفق قيود الدفتر العام' : 'Collected Revenue Analysis (from posted ledger)'}</h4>
            {!hasLedger ? (
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {isRtl ? 'بيانات غير كافية: لا توجد قيود إيراد مرحّلة بعد. لا تتم تلفيق نسب أو مبالغ تبرعات افتراضية.' : 'Insufficient data: no posted revenue entries yet; no fabricated donation figures.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? 'إجمالي الإيرادات المرحلة' : 'Total Posted Revenue'}</span>
                  <span className="text-lg font-black text-emerald-600 font-mono">{fmtMoney(analytics.summary.revenue)}</span>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? 'الإيرادات غير التبادلية (المنح والمساعدات)' : 'Non-Exchange Revenue (Grants & Aid)'}</span>
                  <span className="text-lg font-black text-blue-600 font-mono">---</span>
                  <span className="text-[8.5px] text-slate-400 font-bold block">{isRtl ? 'تتطلب أبعاد صناديق وقيوداً موثقة ولا تُفترض دون إثبات' : 'Requires fund dimensions; never assumed without evidence'}</span>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? 'الفائض التشغيلي' : 'Net Operating Surplus'}</span>
                  <span className="text-lg font-black text-teal-600 font-mono">{fmtMoney(analytics.summary.netSurplus)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ROLE 5: EXPENDITURE DIRECTOR PERSPECTIVE — انحرافات حقيقية */}
      {selectedRole === 'expense_director' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{isRtl ? 'الرقابة على الموازنات ومراقبة الالتزامات الفعلية' : 'Budget Encumbrance & Utilization Control'}</h4>
            {analytics.budgetVariance.length === 0 ? (
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {isRtl ? 'بيانات غير كافية: لا توجد موازنات معتمدة مرتبطة بقيود مرحلة لإصدار سجل الالتزامات.' : 'Insufficient data: no approved budgets linked to posted entries yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {analytics.budgetVariance.slice(0, 6).map((row) => {
                  const st = RATIO_STATUS_STYLES[row.status];
                  return (
                    <div key={row.projectId} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 block">{row.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {isRtl ? `الموازنة ${fmtMoney(row.budget)} • الفعلي ${fmtMoney(row.actual)} • الانحراف ${fmtMoney(row.variance)}` : `Budget ${fmtMoney(row.budget)} • Actual ${fmtMoney(row.actual)} • Variance ${fmtMoney(row.variance)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-black text-emerald-600">{row.utilizationPct.toFixed(1)}%</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black ${st.cls}`}>{isRtl ? row.classificationAr : row.classificationEn}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
