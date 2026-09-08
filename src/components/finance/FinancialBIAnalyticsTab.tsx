import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  DollarSign, 
  Activity, 
  FileText, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileSpreadsheet, 
  Sparkles,
  RefreshCw,
  PieChart as PieIcon,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { Spinner } from '../../design-system/components/Spinner';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  LineChart,
  Line
} from 'recharts';
import { Account, Transaction, TransactionLine } from './FinanceTypes';
import { Project } from '../../types';
import {
  computeFinancialAnalytics,
  RATIO_STATUS_STYLES,
} from '../../core/ledger/financialAnalytics';

interface FinancialBIAnalyticsTabProps {
  accounts: Account[];
  transactions: Transaction[];
  lines: TransactionLine[];
  projects: Project[];
  lang: 'ar' | 'en';
}

export default function FinancialBIAnalyticsTab({ 
  accounts, 
  transactions, 
  lines, 
  projects, 
  lang 
}: FinancialBIAnalyticsTabProps) {
  
  // States for AI Advisor
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiError, setAiError] = useState('');

  // 1. Standard Analytics Engine (UAMEX NEB-10 — منع تلفيق الأرقام نهائياً)
  const analytics = useMemo(
    () => computeFinancialAnalytics({ accounts: accounts as any, transactions: transactions as any, lines: lines as any, projects: projects as any }),
    [accounts, transactions, lines, projects]
  );

  // Compat bridge for downstream KPI cards (values sourced from the standard engine)
  const financials = useMemo(() => ({
    assets: analytics.summary.assets,
    liabilities: analytics.summary.liabilities,
    equity: analytics.summary.equity,
    revenue: analytics.summary.revenue,
    expenses: analytics.summary.expenses,
    netProfitLoss: analytics.summary.netSurplus,
    currentRatio: analytics.currentRatio,
    programEfficiency: analytics.programEfficiency,
    netSurplusMargin: analytics.summary.netSurplusMargin,
    totalExpenseAmount: analytics.totalExpenseAmount,
    directProjectExpenses: analytics.directProjectExpenses,
  }), [analytics]);

  // 2. Budget vs Actual — real ledger lines only (لا افتراضات 62% التلفيقية)
  const budgetVsActualData = useMemo(() => {
    return analytics.budgetVariance.slice(0, 6).map(row => ({
      name: row.name,
      code: row.code,
      budget: row.budget,
      actual: row.actual,
      variance: row.variance,
      utilizationPct: row.utilizationPct,
      status: row.status,
      classificationAr: row.classificationAr,
      classificationEn: row.classificationEn,
    }));
  }, [analytics]);

  // 3. Monthly Trend — real posted entries only (إصلاح أسماء الأشهر العربية التالفة)
  const monthlyTrendData = useMemo(() => {
    return analytics.monthlyTrend
      .filter(d => d.revenue > 0 || d.expense > 0)
      .map(d => ({
        month: lang === 'ar' ? d.monthAr : d.monthEn,
        revenue: d.revenue,
        expense: d.expense,
        surplus: d.surplus,
      }));
  }, [analytics, lang]);

  // 4. Asset Structure — real classification only (لا توزيعات 15/60/15/10 الافتراضية)
  const assetDistribution = useMemo(() => {
    return analytics.assetStructure.map(item => ({
      name: lang === 'ar' ? item.labelAr : item.labelEn,
      value: item.value,
      color: item.color,
    }));
  }, [analytics, lang]);

  // 5. Cash Flow — real vouchers only (إلغاء الافتراضات 95%/92%/12%)
  const cashFlowStatement = useMemo(() => {
    return {
      operatingInflows: analytics.cashFlow.operatingInflows,
      operatingOutflows: analytics.cashFlow.operatingOutflows,
      netCashFlow: analytics.cashFlow.netCashFlow,
      openingCash: analytics.cashFlow.openingCash,
      closingCash: analytics.cashFlow.closingCash,
      openingEstimated: analytics.cashFlow.openingEstimated,
    };
  }, [analytics]);

  // 6. Excel Export Functionality
  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Table 1: Standard Ratios (UAMEX NEB-10 methodology with benchmarks)
      const ratiosData = analytics.ratios.map(r => ({
        Metric_Ar: r.labelAr,
        Metric_En: r.labelEn,
        Value: r.display,
        Benchmark: lang === 'ar' ? r.benchmarkAr : r.benchmarkEn,
        Status: RATIO_STATUS_STYLES[r.status][lang === 'ar' ? 'ar' : 'en'],
        Methodology: lang === 'ar' ? r.methodologyAr : r.methodologyEn,
      }));
      const wsRatios = XLSX.utils.json_to_sheet(ratiosData);
      XLSX.utils.book_append_sheet(wb, wsRatios, lang === 'ar' ? 'المؤشرات المعيارية' : 'Standard Ratios');

      // Table 1B: Evaluative Health Scorecard
      const scoreData = analytics.healthScore.dimensions.map(d => ({
        Dimension_Ar: d.labelAr,
        Dimension_En: d.labelEn,
        Weight: d.weight,
        Earned_Score: Math.round(d.earned * 10) / 10,
        Status: RATIO_STATUS_STYLES[d.status][lang === 'ar' ? 'ar' : 'en'],
      }));
      scoreData.push({
        Dimension_Ar: 'النتيجة الكلية',
        Dimension_En: 'TOTAL SCORE',
        Weight: 100,
        Earned_Score: analytics.healthScore.score,
        Status: `${analytics.healthScore.grade} — ${lang === 'ar' ? analytics.healthScore.gradeAr : analytics.healthScore.gradeEn}`,
      });
      const wsScore = XLSX.utils.json_to_sheet(scoreData);
      XLSX.utils.book_append_sheet(wb, wsScore, lang === 'ar' ? 'بطاقة التقييم' : 'Health Scorecard');

      // Table 2: Budget vs Actual Variance
      const varianceSheetData = budgetVsActualData.map(d => ({
        Project_Code: d.code,
        Project_Name: d.name,
        Approved_Budget: d.budget,
        Actual_Expenses: d.actual,
        Remaining_Variance: d.variance,
        Utilization_Rate: ((d.actual / d.budget) * 100).toFixed(1) + '%'
      }));
      const wsVariance = XLSX.utils.json_to_sheet(varianceSheetData);
      XLSX.utils.book_append_sheet(wb, wsVariance, lang === 'ar' ? 'موازنات المشاريع' : 'Project Budgets');

      // Table 3: Chart of Accounts Trial Balance
      const coaSheetData = accounts.map(a => ({
        Account_Code: a.account_code,
        Account_Name: lang === 'ar' ? a.name_ar : a.name_en,
        Account_Type: a.account_type,
        Opening_Balance: a.opening_balance,
        Current_Balance: a.current_balance
      }));
      const wsCoa = XLSX.utils.json_to_sheet(coaSheetData);
      XLSX.utils.book_append_sheet(wb, wsCoa, lang === 'ar' ? 'ميزان مراجعة الدليل' : 'Trial Balance Chart');

      XLSX.writeFile(wb, `Rohamaa_Financial_BI_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Failed to export to Excel:', err);
    }
  };

  // 7. Call Gemini Financial Copilot / Advisor
  const handleGetAiAdvice = async () => {
    setAiLoading(true);
    setAiError('');
    setAiReport(null);

    try {
      const financialContext = {
        organizationName: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
        fiscalYear: '2026',
        metrics: {
          assets: financials.assets,
          liabilities: financials.liabilities,
          equity: financials.equity,
          revenue: financials.revenue,
          expenses: financials.expenses,
          netProfitLoss: financials.netProfitLoss,
          currentSolvencyRatio: financials.currentRatio,
          humanitarianProgramEfficiency: financials.programEfficiency,
          netSurplusMarginPercent: financials.netSurplusMargin
        },
        standardRatiosWithBenchmarks: analytics.ratios.map(r => ({
          key: r.key, value: r.display, status: r.status,
          benchmark: lang === 'ar' ? r.benchmarkAr : r.benchmarkEn,
        })),
        evaluativeHealthScorecard: {
          totalScore: analytics.healthScore.score,
          grade: analytics.healthScore.grade,
          gradeLabel: lang === 'ar' ? analytics.healthScore.gradeAr : analytics.healthScore.gradeEn,
          dimensions: analytics.healthScore.dimensions.map(d => ({
            key: d.key, label: lang === 'ar' ? d.labelAr : d.labelEn,
            weight: d.weight, earned: Math.round(d.earned * 10) / 10, status: d.status,
          })),
        },
        projectsBudgetsAndActuals: budgetVsActualData,
        cashFlow: {
          inflows: cashFlowStatement.operatingInflows,
          outflows: cashFlowStatement.operatingOutflows,
          netCashFlow: cashFlowStatement.netCashFlow
        }
      };

      const promptMsg = lang === 'ar'
        ? 'قم بتحليل الوضع المالي الحالي للجمعية بالاعتماد على ميزان المراجعة، ومؤشر السيولة الحالية، وكفاءة الإنفاق الإنساني المباشر (Direct Program spending ratio vs Sphere/CHS benchmark)، ونسبة استهلاك موازنات المشاريع الميدانية ومطابقتها. قدم تقريراً تشخيصياً بذكاء مالي واستراتيجي، محذراً من أي عجز نقدي وشيك، وموصياً بخطوات عملية لحشد التمويل أو ضبط النفقات.'
        : 'Analyze the current NGO financial dashboard. Review cash reserves, solvency, budget variance in active humanitarian deployments, and overall spending efficiency matching CHS/Sphere benchmarks (Administrative overhead vs Direct field execution). Provide a sharp executive risk evaluation and next strategic optimization steps.';

      const response = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptMsg,
          contextData: financialContext,
          language: lang
        })
      });

      if (!response.ok) throw new Error('Failed to query Gemini AI Advisor');
      const resData = await response.json();
      
      if (resData.status === 'ok' && resData.data) {
        setAiReport(resData.data);
      } else {
        throw new Error('Invalid response structure from AI Copilot');
      }

    } catch (err: any) {
      setAiError(err.message || 'Error occurred during AI financial consulting session.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in no-print">
      
      {/* Top BI Control Ribbon */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'ar' ? 'لوحة القيادة وذكاء الأعمال المالي (Financial BI)' : 'Financial BI & Intelligence Dashboard'}</span>
          </h3>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
            {lang === 'ar' 
              ? 'تحليلات تفاعلية ذكية لقياس كفاءة الصرف على برامج الإغاثة ومقارنة الموازنات وتدفقات السيولة.' 
              : 'Enterprise ratios, real-time humanitarian spending efficiency index, and budget-actual allocations.'}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>{lang === 'ar' ? 'تصدير التقارير إكسل' : 'Export Excel Sheet'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{lang === 'ar' ? 'تقرير PDF للطباعة' : 'Print BI Summary'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI 1: Solvency current ratio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-sky-50 rounded-xl border border-sky-100">
              <Scale className="w-5 h-5 text-sky-600" />
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
              financials.currentRatio >= 2 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {financials.currentRatio >= 2 
                ? (lang === 'ar' ? 'مركز ممتاز' : 'Excellent') 
                : (lang === 'ar' ? 'يتطلب مراقبة' : 'Watch')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-black uppercase block">{lang === 'ar' ? 'مؤشر كفاية السيولة والالتزامات' : 'Current Liquidity Solvency'}</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-800 tracking-tight font-mono">
                {financials.currentRatio.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500">x {lang === 'ar' ? '(أصول متداولة / التزامات)' : '(Current Assets / Liabilities)'}</span>
            </div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1 leading-normal">
              {lang === 'ar' 
                ? 'يقيس قدرة الأصول الحالية على تغطية الالتزامات المالية والديون والعهد التشغيلية.' 
                : 'Indicates the ratio of liquid assets to outstanding short-term liabilities.'}
            </p>
          </div>
        </div>

        {/* KPI 2: Direct Program Spend efficiency (Sphere Standard) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <Layers className="w-5 h-5 text-emerald-600" />
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
              financials.programEfficiency >= 85 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {financials.programEfficiency >= 85 
                ? (lang === 'ar' ? 'مطابق لمعايير Sphere' : 'Compliant') 
                : (lang === 'ar' ? 'ارتفاع النفقات الإدارية' : 'High Overhead')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-black uppercase block">{lang === 'ar' ? 'كفاءة الإنفاق الميداني المباشر' : 'Humanitarian Spend Efficiency'}</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
                {financials.programEfficiency.toFixed(1)}%
              </span>
              <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'من ميزانية الصرف' : 'of total expenditure'}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className={`h-full rounded-full ${financials.programEfficiency >= 85 ? 'bg-emerald-600' : 'bg-amber-500'}`} 
                style={{ width: `${Math.min(100, financials.programEfficiency)}%` }}
              ></div>
            </div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-2 leading-normal">
              {lang === 'ar' 
                ? 'معيار إنساني دولي يقضي بتوجيه 85% على الأقل من أموال التبرعات إلى الفئة المستهدفة مباشرة.' 
                : 'International standard dictates that over 85% of funding must serve field projects directly.'}
            </p>
          </div>
        </div>

        {/* KPI 3: Surplus Net Profit Loss Margin */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
              financials.netProfitLoss >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {financials.netProfitLoss >= 0 
                ? (lang === 'ar' ? 'احتياطي صحي' : 'Healthy Reserve') 
                : (lang === 'ar' ? 'عجز مالي' : 'Deficit')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-black uppercase block">{lang === 'ar' ? 'صافي هامش الفائض (العجز)' : 'Net Period Surplus / Deficit'}</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black tracking-tight font-mono ${
                financials.netProfitLoss >= 0 ? 'text-slate-800' : 'text-rose-600'
              }`}>
                {financials.netSurplusMargin.toFixed(1)}%
              </span>
              <span className="text-xs font-bold text-slate-500">
                ({financials.netProfitLoss >= 0 ? '+' : ''}{Math.round(financials.netProfitLoss).toLocaleString()} YER)
              </span>
            </div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1 leading-normal">
              {lang === 'ar' 
                ? 'معدل الحفاظ على السيولة وتخزين احتياطي الطوارئ لمواجهة تقلبات التمويل من المانحين.' 
                : 'Percentage of revenue stored as strategic reserves to mitigate project funding volatility.'}
            </p>
          </div>
        </div>

      </div>

      {/* STANDARD METHODOLOGY SECTION: Evaluative Scorecard + Certified Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Evaluative Financial Health Scorecard (بطاقة التقييم المؤسسي المرجحة) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 lg:col-span-1">
          <div className="border-b border-slate-100 pb-2.5 flex justify-between items-center">
            <div>
              <h4 className="font-black text-xs text-slate-800">{lang === 'ar' ? 'بطاقة التقييم المؤسسي المرجحة' : 'Weighted Financial Health Scorecard'}</h4>
              <p className="text-[9px] text-zinc-400 font-bold mt-0.5">{lang === 'ar' ? 'تقييم إجمالي موثق وفق منهجية UAMEX NEB-10 (100 نقطة).' : 'Certified aggregate evaluation per UAMEX NEB-10 methodology (100 pts).'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0 ${
              analytics.healthScore.grade === 'A' ? 'border-emerald-500 bg-emerald-50' :
              analytics.healthScore.grade === 'B' ? 'border-sky-500 bg-sky-50' :
              analytics.healthScore.grade === 'C' ? 'border-amber-500 bg-amber-50' : 'border-rose-500 bg-rose-50'
            }`}>
              <span className={`text-2xl font-black font-mono ${
                analytics.healthScore.grade === 'A' ? 'text-emerald-600' :
                analytics.healthScore.grade === 'B' ? 'text-sky-600' :
                analytics.healthScore.grade === 'C' ? 'text-amber-600' : 'text-rose-600'
              }`}>{analytics.healthScore.score.toFixed(0)}</span>
              <span className="text-[9px] font-black text-slate-400">/ 100</span>
            </div>
            <div className="space-y-1">
              <div className={`inline-block px-2.5 py-1 rounded-lg text-sm font-black ${
                analytics.healthScore.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                analytics.healthScore.grade === 'B' ? 'bg-sky-100 text-sky-700' :
                analytics.healthScore.grade === 'C' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {lang === 'ar' ? analytics.healthScore.gradeAr : analytics.healthScore.gradeEn}
              </div>
              <p className="text-[9px] text-zinc-400 font-bold leading-normal">
                {lang === 'ar' ? analytics.healthScore.methodologyAr : analytics.healthScore.methodologyEn}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {analytics.healthScore.dimensions.map(dim => {
              const pct = dim.weight > 0 ? (dim.earned / dim.weight) * 100 : 0;
              return (
                <div key={dim.key} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black">
                    <span className="text-slate-600">{lang === 'ar' ? dim.labelAr : dim.labelEn}</span>
                    <span className="font-mono text-slate-500">{Math.round(dim.earned * 10) / 10} / {dim.weight}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-600' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certified Standard Ratios Table (المؤشرات المعيارية الموثقة) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 lg:col-span-2">
          <div className="border-b border-slate-100 pb-2.5">
            <h4 className="font-black text-xs text-slate-800">{lang === 'ar' ? 'سجل المؤشرات المالية المعيارية الموثقة' : 'Certified Standard Financial Ratios Register'}</h4>
            <p className="text-[9px] text-zinc-400 font-bold mt-0.5">{lang === 'ar' ? 'كل مؤشر مقرون بمرجعيته المعيارية وعتبة الحكم ومنهجية الاحتساب — جاهز للتدقيق الخارجي.' : 'Each ratio carries its standard benchmark, judgment threshold and methodology — audit-ready.'}</p>
          </div>
          <div className="space-y-2">
            {analytics.ratios.map(r => {
              const st = RATIO_STATUS_STYLES[r.status];
              return (
                <div key={r.key} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5">
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-[11px] font-black text-slate-700 leading-snug">{lang === 'ar' ? r.labelAr : r.labelEn}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black font-mono text-slate-800">{r.display}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black ${st.cls}`}>{lang === 'ar' ? st.ar : st.en}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] font-bold">
                    <span className="text-slate-400">{lang === 'ar' ? 'المعيار: ' : 'Benchmark: '}{lang === 'ar' ? r.benchmarkAr : r.benchmarkEn}</span>
                    <span className="text-zinc-400">{lang === 'ar' ? r.methodologyAr : r.methodologyEn}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Standard Budget Variance Register (سجل انحرافات الموازنة المعياري) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="border-b border-slate-100 pb-2.5">
          <h4 className="font-black text-xs text-slate-800">{lang === 'ar' ? 'سجل انحرافات الموازنات المعياري (تفصيلي)' : 'Standard Budget Variance Register (Detailed)'}</h4>
          <p className="text-[9px] text-zinc-400 font-bold mt-0.5">
            {lang === 'ar'
              ? 'تصنيف معياري: تنفيذ مثالي 85–100% • تنفيذ متأخر 70–85% • تباطؤ حرج أقل من 70% • تجاوز أكثر من 100%.'
              : 'Standard classification: Optimal 85–100% • Under Execution 70–85% • Critical Under-Spend < 70% • Over Budget > 100%.'}
          </p>
        </div>
        {analytics.budgetVariance.length === 0 ? (
          <div className="py-6 text-center space-y-1.5">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
            <p className="text-[11px] font-black text-slate-500">{lang === 'ar' ? 'بيانات غير كافية لإصدار سجل الانحرافات' : 'Insufficient data to produce the variance register'}</p>
            <p className="text-[9px] text-zinc-400 font-bold">
              {lang === 'ar'
                ? 'يلزم وجود موازنات معتمدة وقيود مالية مرحّلة مرتبطة بالمشاريع.'
                : 'Approved budgets and posted project-linked ledger entries are required.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10.5px] font-bold">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200">
                  <th className="text-start py-2 px-2">{lang === 'ar' ? 'المشروع' : 'Project'}</th>
                  <th className="text-end py-2 px-2">{lang === 'ar' ? 'الموازنة المعتمدة' : 'Approved Budget'}</th>
                  <th className="text-end py-2 px-2">{lang === 'ar' ? 'المصروف الفعلي' : 'Actual Spend'}</th>
                  <th className="text-end py-2 px-2">{lang === 'ar' ? 'نسبة التنفيذ' : 'Utilization'}</th>
                  <th className="text-end py-2 px-2">{lang === 'ar' ? 'الانحراف' : 'Variance'}</th>
                  <th className="text-center py-2 px-2">{lang === 'ar' ? 'الحكم المعياري' : 'Standard Judgment'}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.budgetVariance.slice(0, 10).map(row => {
                  const st = RATIO_STATUS_STYLES[row.status];
                  return (
                    <tr key={row.projectId} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="py-2 px-2 text-slate-700">{lang === 'ar' ? row.name : row.name}{row.code ? ` (${row.code})` : ''}</td>
                      <td className="py-2 px-2 text-end font-mono text-slate-600">{row.budget.toLocaleString()}</td>
                      <td className="py-2 px-2 text-end font-mono text-slate-800">{row.actual.toLocaleString()}</td>
                      <td className={`py-2 px-2 text-end font-mono ${row.utilizationPct > 100 ? 'text-rose-600' : 'text-emerald-700'}`}>{row.utilizationPct.toFixed(1)}%</td>
                      <td className="py-2 px-2 text-end font-mono text-slate-500">{row.variance.toLocaleString()}</td>
                      <td className="py-2 px-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black ${st.cls}`}>{lang === 'ar' ? row.classificationAr : row.classificationEn}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Integrity Notice (إفصاح جودة البيانات — مبدأ عدم التلفيق) */}
      {analytics.dataQuality.insufficientDataNotesAr.length > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <h5 className="text-[11px] font-black text-amber-800">{lang === 'ar' ? 'إفصاح جودة البيانات — لا تُعرض أي أرقام محاكاة أو ملفّقة' : 'Data Quality Disclosure — no simulated or fabricated figures are displayed'}</h5>
          </div>
          <ul className="space-y-1 ps-6 list-disc">
            {(lang === 'ar' ? analytics.dataQuality.insufficientDataNotesAr : analytics.dataQuality.insufficientDataNotesEn).map((note, i) => (
              <li key={i} className="text-[10px] font-bold text-amber-700 leading-normal">{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Revenue vs Expense Trends */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h4 className="font-black text-xs text-slate-800">{lang === 'ar' ? 'حركة التدفق الشهري (الإيرادات الإجمالية مقابل المصروفات)' : 'Monthly Income & Spend Trends'}</h4>
            <p className="text-[9px] text-zinc-400 font-bold mt-0.5">{lang === 'ar' ? 'مقارنة حجم التبرعات الواردة مع وتيرة الصرف الفعلي على المشاريع.' : 'Trend of humanitarian fundraising compared to active field execution disbursements.'}</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} 
                  formatter={(value: any) => [`${parseFloat(value).toLocaleString()} YER`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', paddingTop: '10px' }} />
                <Area type="monotone" name={lang === 'ar' ? 'الإيرادات والتبرعات' : 'Donations / Revenue'} dataKey="revenue" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" name={lang === 'ar' ? 'المصروفات والتنفيذ' : 'Disbursements / Expenses'} dataKey="expense" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Project budget vs actual spending */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h4 className="font-black text-xs text-slate-800">{lang === 'ar' ? 'مقارنة موازنة المشاريع بالصرف الفعلي' : 'Project Approved Budget vs. Actual Expenditures'}</h4>
            <p className="text-[9px] text-zinc-400 font-bold mt-0.5">{lang === 'ar' ? 'مطابقة التدفق المالي المعتمد مع سحوبات الصرف الحقيقية للمراكز الميدانية.' : 'Evaluating project fund exhaustion limits vs. transaction book balances.'}</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} 
                  formatter={(value: any) => [`${parseFloat(value).toLocaleString()} YER`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', paddingTop: '10px' }} />
                <Bar name={lang === 'ar' ? 'الموازنة المعتمدة' : 'Approved Budget'} dataKey="budget" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar name={lang === 'ar' ? 'المصروف الفعلي' : 'Actual Expenditures'} dataKey="actual" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 3: Cash Flow Statement & Assets Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Direct Method Cash Flow Statement Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 lg:col-span-2">
          <div className="border-b border-slate-100 pb-2.5 flex justify-between items-center">
            <div>
              <h4 className="font-black text-xs text-slate-800">{lang === 'ar' ? 'قائمة التدفقات النقدية (الطريقة المباشرة)' : 'Direct Cash Flow Statement'}</h4>
              <p className="text-[9px] text-zinc-400 font-bold mt-0.5">{lang === 'ar' ? 'تتبع التدفقات النقدية والبنكية الفعلية الداخلة والخارجة من الجمعية.' : 'Monitored analysis of actual cash receipts and operating bank vouchers.'}</p>
            </div>
            <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'التدفقات الداخلة (المقبوضات)' : 'Operating Cash Receipts (Inflows)'}</span>
              <div className="flex justify-between font-bold border-b border-slate-100 pb-1.5">
                <span className="text-slate-600">{lang === 'ar' ? 'عائدات تبرعات، زكاة، وكفالات مرحلة' : 'Donations, Zakat & Orphan Sponsorships'}</span>
                <span className="font-mono text-emerald-600">+{cashFlowStatement.operatingInflows.toLocaleString()} YER</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'التدفقات الخارجة (المدفوعات)' : 'Operating Cash Disbursements (Outflows)'}</span>
              <div className="flex justify-between font-bold border-b border-slate-100 pb-1.5">
                <span className="text-slate-600">{lang === 'ar' ? 'سحوبات صرف المشاريع والمصاريف الإدارية والعمومية' : 'Project Deployment Expenses & Office Overhead'}</span>
                <span className="font-mono text-rose-600">-{cashFlowStatement.operatingOutflows.toLocaleString()} YER</span>
              </div>
            </div>

            <div className="flex justify-between font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span>{lang === 'ar' ? 'صافي النقد والسيولة الناتجة من الأنشطة التشغيلية:' : 'Net Operating Cash Flow:'}</span>
              <span className={`font-mono ${cashFlowStatement.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {cashFlowStatement.netCashFlow >= 0 ? '+' : ''}{cashFlowStatement.netCashFlow.toLocaleString()} YER
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] font-bold">
              <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-200">
                <span className="text-[9px] text-zinc-400 block uppercase font-black">{lang === 'ar' ? 'تنزيل ملف النسخة' : 'Beginning Cash'}</span>
                <span className="font-mono text-slate-700">{cashFlowStatement.openingCash.toLocaleString()} YER</span>
              </div>
              <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-200">
                <span className="text-[9px] text-zinc-400 block uppercase font-black">{lang === 'ar' ? 'منطقة عالية الأمان' : 'Ending Cash Balance'}</span>
                <span className="font-mono text-slate-900 font-extrabold">{cashFlowStatement.closingCash.toLocaleString()} YER</span>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Category Distribution Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h4 className="font-black text-xs text-slate-800">{lang === 'ar' ? 'هيكل الأصول والسيولة' : 'Asset & Liquidity Structure'}</h4>
            <p className="text-[9px] text-zinc-400 font-bold mt-0.5">{lang === 'ar' ? 'التقسيم النسبي للسيولة بالخزائن والبنوك مقارنة بالأصول الثابتة.' : 'Percentage structure of current assets vs fixed equipment assets.'}</p>
          </div>
          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} 
                  formatter={(value: any) => [`${parseFloat(value).toLocaleString()} YER`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <PieIcon className="w-5 h-5 text-slate-400 mb-0.5" />
              <span className="text-[9px] font-black text-slate-500">{lang === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
            {assetDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* AI Intelligence Sector: Advisor Copilot */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-zinc-950 text-white rounded-3xl p-6 shadow-xl space-y-6 border border-emerald-900/30">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-800/20 pb-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-amber-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-400" />
              <span>{lang === 'ar' ? 'مستشار الذكاء الاصطناعي المالي الاستراتيجي' : 'NexoraOS? Strategic Financial AI Consultant'}</span>
            </h4>
            <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed max-w-2xl">
              {lang === 'ar'
                ? 'يقوم النموذج الذكي (Gemini 3.6-Flash) بمطابقة ميزان المراجعة وحسابات المشاريع وقياس مطابقتها مع معايير العمل الإنساني الدولي (Sphere Standards / CHS).'
                : 'Server-side AI runs predictive solvency checks, audits administrative overheads, and aligns budgets with humanitarian standards.'}
            </p>
          </div>

          <button
            onClick={handleGetAiAdvice}
            disabled={aiLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-900/30"
          >
            {aiLoading ? (
              <Spinner size="sm" />
            ) : (
              <BrainCircuit className="w-4 h-4" />
            )}
            <span>{lang === 'ar' ? 'استشارة الذكاء الاصطناعي الفورية' : 'Consult Strategic AI'}</span>
          </button>
        </div>

        {aiLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Spinner size="xl" variant="primary" />
            <p className="text-xs font-black text-emerald-400 animate-pulse">
              {lang === 'ar' ? 'جاري قراءة دفاتر الحسابات وبناء التحليل المالي الاستراتيجي...' : 'Auditing balances, examining variance vectors, and generating report...'}
            </p>
          </div>
        )}

        {aiError && (
          <div className="p-4 bg-rose-950/40 border border-rose-900 text-rose-200 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{aiError}</span>
          </div>
        )}

        {aiReport && !aiLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold leading-relaxed animate-fade-in">
            
            {/* Column 1: Summary & Risk */}
            <div className="space-y-4 md:col-span-1 border-r border-slate-800 pr-0 md:pr-4 style-rtl">
              <div className="bg-slate-800/35 p-4 rounded-2xl border border-slate-800/40 space-y-3">
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">{lang === 'ar' ? 'الملخص المالي التنفيذي' : 'Executive Overview'}</span>
                <p className="text-slate-300 font-bold leading-normal">{aiReport.summary}</p>
              </div>

              <div className="bg-slate-800/35 p-4 rounded-2xl border border-slate-800/40 space-y-2">
                <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider block">{lang === 'ar' ? 'تقييم المخاطر' : 'Risk Assessment'}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                    aiReport.risk_assessment?.risk_level === 'CRITICAL' || aiReport.risk_assessment?.risk_level === 'HIGH'
                      ? 'bg-rose-950/60 text-rose-400 border border-rose-900/50'
                      : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50'
                  }`}>
                    {aiReport.risk_assessment?.risk_level}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-normal">{aiReport.risk_assessment?.description}</p>
              </div>
            </div>

            {/* Column 2: Key Findings & Recommendations */}
            <div className="space-y-4 md:col-span-1">
              <div className="space-y-2">
                <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-wider block">{lang === 'ar' ? 'أبرز النتائج التشخيصية' : 'Key Diagnostic Findings'}</span>
                <ul className="space-y-2">
                  {aiReport.key_findings?.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider block">{lang === 'ar' ? 'توصيات الحوكمة الموصى بها' : 'Strategic Recommendations'}</span>
                <ul className="space-y-2">
                  {aiReport.strategic_recommendations?.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-slate-300">
                      <span className="text-amber-500 font-black">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 3: Actionable Next Steps */}
            <div className="space-y-3.5 bg-slate-800/20 p-4 rounded-2xl border border-emerald-950/20 md:col-span-1">
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">{lang === 'ar' ? 'خطوات التنفيذ والإجراءات المطلوبة' : 'Actionable Next Steps'}</span>
              <ul className="space-y-3">
                {aiReport.actionable_next_steps?.map((item: string, idx: number) => (
                  <li key={idx} className="flex gap-2 items-start text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}

        {!aiReport && !aiLoading && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 opacity-65">
            <Sparkles className="w-8 h-8 text-amber-500 mb-1" />
            <h5 className="text-xs font-black text-slate-200">{lang === 'ar' ? 'استشارة الذكاء الاصطناعي جاهزة' : 'AI Strategic Advisor Ready'}</h5>
            <p className="text-[10px] text-zinc-400 max-w-md font-semibold px-4">
              {lang === 'ar'
                ? 'انقر على زر الاستشارة أعلاه وسيقوم الذكاء الاصطناعي بفحص ميزان المراجعة وحركة النقدية وتدقيق ميزانيات البرامج وصياغة خطة عمل استراتيجية فورية.'
                : 'Click the button above to execute server-side deep financial diagnostics and retrieve custom, CHS-compliant recommendations.'}
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
