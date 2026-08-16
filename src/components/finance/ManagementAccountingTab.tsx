import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  PieChart as PieIcon, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  DollarSign, 
  Activity, 
  Award, 
  Scale, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Download, 
  Sparkles, 
  Cpu, 
  Coins, 
  Target, 
  BarChart3, 
  ArrowUpRight, 
  Zap, 
  BookOpen, 
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  HelpCircle,
  Percent,
  Briefcase
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Account, Transaction, TransactionLine } from './FinanceTypes';
import { Project } from '../../types';
import { printHTML } from '../../lib/printUtils';

interface ManagementAccountingTabProps {
  accounts: Account[];
  transactions: Transaction[];
  lines: TransactionLine[];
  projects: Project[];
  lang: 'ar' | 'en';
}

type ManagementModule = 'abc' | 'cvp' | 'variances' | 'responsibility' | 'capital_budgeting' | 'scorecard';

export default function ManagementAccountingTab({
  accounts,
  transactions,
  lines,
  projects,
  lang
}: ManagementAccountingTabProps) {
  const isRtl = lang === 'ar';
  const [activeModule, setActiveModule] = useState<ManagementModule>('abc');

  // ==================== CVP ENGINE STATE ====================
  const [cvpState, setCvpState] = useState({
    fixedCostsYer: 45000000,
    variableCostPerUnitYer: 12000,
    sellingPricePerUnitYer: 20000,
    targetUnits: 7500
  });

  // CVP Computations
  const cvpMetrics = useMemo(() => {
    const contributionMarginPerUnit = cvpState.sellingPricePerUnitYer - cvpState.variableCostPerUnitYer;
    const contributionMarginRatio = cvpState.sellingPricePerUnitYer > 0 
      ? contributionMarginPerUnit / cvpState.sellingPricePerUnitYer 
      : 0;
    
    const breakEvenUnits = contributionMarginPerUnit > 0 
      ? Math.ceil(cvpState.fixedCostsYer / contributionMarginPerUnit) 
      : 0;
    
    const breakEvenRevenueYer = breakEvenUnits * cvpState.sellingPricePerUnitYer;
    
    const targetRevenueYer = cvpState.targetUnits * cvpState.sellingPricePerUnitYer;
    const targetTotalVariableCostYer = cvpState.targetUnits * cvpState.variableCostPerUnitYer;
    const targetTotalCostYer = cvpState.fixedCostsYer + targetTotalVariableCostYer;
    const targetNetOperatingIncomeYer = targetRevenueYer - targetTotalCostYer;
    
    const marginOfSafetyUnits = Math.max(0, cvpState.targetUnits - breakEvenUnits);
    const marginOfSafetyYer = marginOfSafetyUnits * cvpState.sellingPricePerUnitYer;
    const marginOfSafetyRatio = targetRevenueYer > 0 ? marginOfSafetyYer / targetRevenueYer : 0;
    
    const degreeOfOperatingLeverage = targetNetOperatingIncomeYer > 0 
      ? (cvpState.targetUnits * contributionMarginPerUnit) / targetNetOperatingIncomeYer 
      : 0;

    // Generate Chart Data Points
    const chartPoints = [];
    const maxUnits = Math.max(cvpState.targetUnits * 1.3, breakEvenUnits * 1.5, 10000);
    const step = Math.ceil(maxUnits / 8);

    for (let u = 0; u <= maxUnits; u += step) {
      const rev = u * cvpState.sellingPricePerUnitYer;
      const vc = u * cvpState.variableCostPerUnitYer;
      const tc = cvpState.fixedCostsYer + vc;
      const profit = rev - tc;
      chartPoints.push({
        units: u,
        revenue: rev / 1000000, // In Millions
        totalCost: tc / 1000000,
        fixedCost: cvpState.fixedCostsYer / 1000000,
        profit: profit / 1000000
      });
    }

    return {
      contributionMarginPerUnit,
      contributionMarginRatio,
      breakEvenUnits,
      breakEvenRevenueYer,
      targetRevenueYer,
      targetTotalCostYer,
      targetNetOperatingIncomeYer,
      marginOfSafetyUnits,
      marginOfSafetyYer,
      marginOfSafetyRatio,
      degreeOfOperatingLeverage,
      chartPoints
    };
  }, [cvpState]);

  // ==================== ACTIVITY BASED COSTING (ABC) STATE ====================
  const [abcCostPools, setAbcCostPools] = useState([
    {
      id: 'pool-1',
      poolNameAr: 'شحن وتفريغ المساعدات الغذائية',
      poolNameEn: 'Food Aid Logistics & Handling',
      totalPoolCostYer: 18000000,
      costDriverNameAr: 'عدد الشاحنات والمحمولات',
      costDriverNameEn: 'Number of Truck Loads',
      totalDriverUnits: 150,
      allocatedToProjects: [
        { projectId: 'proj-001', projectNameAr: 'مشروع مأرب الإغاثي', driverUnits: 90, allocatedCostYer: 10800000 },
        { projectId: 'proj-002', projectNameAr: 'مشروع تعز الطبي', driverUnits: 60, allocatedCostYer: 7200000 }
      ]
    },
    {
      id: 'pool-2',
      poolNameAr: 'صيانة القوافل الطبية والمعدات',
      poolNameEn: 'Medical Mobile Clinics Maintenance',
      totalPoolCostYer: 12000000,
      costDriverNameAr: 'ساعات تشغيل العيادات الميدانية',
      costDriverNameEn: 'Clinic Operational Hours',
      totalDriverUnits: 600,
      allocatedToProjects: [
        { projectId: 'proj-001', projectNameAr: 'مشروع مأرب الإغاثي', driverUnits: 150, allocatedCostYer: 3000000 },
        { projectId: 'proj-002', projectNameAr: 'مشروع تعز الطبي', driverUnits: 450, allocatedCostYer: 9000000 }
      ]
    },
    {
      id: 'pool-3',
      poolNameAr: 'الإشراف الفني وضمان الجودة الميدانية',
      poolNameEn: 'Field QA & Technical Supervision',
      totalPoolCostYer: 25000000,
      costDriverNameAr: 'عدد زيارات التفتيش الميداني',
      costDriverNameEn: 'Field Inspection Visits',
      totalDriverUnits: 100,
      allocatedToProjects: [
        { projectId: 'proj-001', projectNameAr: 'مشروع مأرب الإغاثي', driverUnits: 50, allocatedCostYer: 12500000 },
        { projectId: 'proj-002', projectNameAr: 'مشروع تعز الطبي', driverUnits: 50, allocatedCostYer: 12500000 }
      ]
    }
  ]);

  // ==================== VARIANCE ANALYSIS STATE ====================
  const [variances, setVariances] = useState([
    {
      id: 'var-1',
      categoryAr: 'مواد غذائية - السلال الإغاثية',
      categoryEn: 'Direct Food Aid Supplies',
      stdQuantity: 50000,
      actQuantity: 52000,
      stdPriceYer: 2400,
      actPriceYer: 2300,
      unitMeasure: 'سلة'
    },
    {
      id: 'var-2',
      categoryAr: 'ساعات أطباء وممرضين ميدانيين',
      categoryEn: 'Direct Medical Labor Hours',
      stdQuantity: 3000,
      actQuantity: 3200,
      stdPriceYer: 15000,
      actPriceYer: 16000,
      unitMeasure: 'ساعة'
    },
    {
      id: 'var-3',
      categoryAr: 'وقود وتشغيل صهاريج مياه',
      categoryEn: 'Water Tanker Fuel & Logistics',
      stdQuantity: 12000,
      actQuantity: 11500,
      stdPriceYer: 1800,
      actPriceYer: 1950,
      unitMeasure: 'لتر'
    }
  ]);

  const varianceCalculations = useMemo(() => {
    return variances.map(v => {
      // Direct Material / Labor Price Variance = AQ * (AP - SP)
      const priceVarianceYer = v.actQuantity * (v.actPriceYer - v.stdPriceYer);
      // Direct Material / Labor Quantity Variance = SP * (AQ - SQ)
      const quantityVarianceYer = v.stdPriceYer * (v.actQuantity - v.stdQuantity);
      // Total Variance = Price Variance + Quantity Variance
      const totalVarianceYer = priceVarianceYer + quantityVarianceYer;

      return {
        ...v,
        priceVarianceYer,
        priceVarianceStatus: priceVarianceYer <= 0 ? 'FAVORABLE' : 'UNFAVORABLE',
        quantityVarianceYer,
        quantityVarianceStatus: quantityVarianceYer <= 0 ? 'FAVORABLE' : 'UNFAVORABLE',
        totalVarianceYer,
        totalVarianceStatus: totalVarianceYer <= 0 ? 'FAVORABLE' : 'UNFAVORABLE'
      };
    });
  }, [variances]);

  // ==================== CAPITAL BUDGETING STATE ====================
  const [capBudgetState, setCapBudgetState] = useState({
    projectNameAr: 'مشروع إنشاء محطة التوليد الشمسي الوقفي',
    initialInvestmentYer: 80000000,
    discountRatePercent: 10,
    projectLifeYears: 5,
    cashInflowsYer: [22000000, 26000000, 28000000, 25000000, 20000000]
  });

  const capBudgetMetrics = useMemo(() => {
    const rate = capBudgetState.discountRatePercent / 100;
    let npvYer = -capBudgetState.initialInvestmentYer;
    let cumulativeCash = -capBudgetState.initialInvestmentYer;
    let paybackYears = capBudgetState.projectLifeYears;
    let paybackFound = false;

    const discountedInflows = capBudgetState.cashInflowsYer.map((cf, idx) => {
      const year = idx + 1;
      const pvFactor = 1 / Math.pow(1 + rate, year);
      const pvAmount = cf * pvFactor;
      npvYer += pvAmount;

      if (!paybackFound) {
        cumulativeCash += cf;
        if (cumulativeCash >= 0) {
          const prevCum = cumulativeCash - cf;
          paybackYears = idx + (Math.abs(prevCum) / cf);
          paybackFound = true;
        }
      }

      return {
        year,
        cashInflow: cf,
        pvFactor: pvFactor.toFixed(4),
        pvAmount
      };
    });

    const totalPvInflows = npvYer + capBudgetState.initialInvestmentYer;
    const profitabilityIndex = capBudgetState.initialInvestmentYer > 0 
      ? totalPvInflows / capBudgetState.initialInvestmentYer 
      : 0;

    // Estimate IRR (Iterative Interpolation)
    let irr = 0.10;
    for (let iter = 0; iter < 100; iter++) {
      let npvTest = -capBudgetState.initialInvestmentYer;
      let dNpv = 0;
      for (let t = 1; t <= capBudgetState.projectLifeYears; t++) {
        const cf = capBudgetState.cashInflowsYer[t - 1] || 0;
        npvTest += cf / Math.pow(1 + irr, t);
        dNpv -= (t * cf) / Math.pow(1 + irr, t + 1);
      }
      if (Math.abs(npvTest) < 1000) break;
      if (dNpv !== 0) irr = irr - npvTest / dNpv;
    }

    return {
      npvYer,
      totalPvInflows,
      profitabilityIndex,
      paybackYears: paybackYears.toFixed(2),
      irrPercent: (irr * 100).toFixed(2),
      discountedInflows
    };
  }, [capBudgetState]);

  // ==================== BALANCED SCORECARD STATE ====================
  const [scorecardPerspectives, setScorecardPerspectives] = useState([
    {
      id: 'persp-1',
      titleAr: 'المحور المالي والعدالة الشرعية (Financial)',
      color: 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
      kpis: [
        { nameAr: 'نسبة المصاريف الإدارية إلى الميزانية التشغيلية', target: '≤ 10%', actual: '7.8%', status: 'EXCELLENT' },
        { nameAr: 'معدل كفاية الاحتياطي النقدي للمشاريع الإنسانية', target: '6 أشهر', actual: '7.2 أشهر', status: 'EXCELLENT' },
        { nameAr: 'نسبة الالتزام بالامتثال الشرعي IPSAS/AAOIFI', target: '100%', actual: '100%', status: 'EXCELLENT' }
      ]
    },
    {
      id: 'persp-2',
      titleAr: 'محور المستفيدين والداعمين (Beneficiary & Donors)',
      color: 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40',
      kpis: [
        { nameAr: 'مؤشر رضا المستفيدين الميداني (CSAT)', target: '≥ 90%', actual: '94.5%', status: 'EXCELLENT' },
        { nameAr: 'معدل الاحتفاظ بالجهات المانحة الشريكة', target: '≥ 85%', actual: '89.0%', status: 'EXCELLENT' },
        { nameAr: 'سرعة الاستجابة لنداءات الإغاثة الطارئة', target: '< 24 ساعة', actual: '14 ساعة', status: 'EXCELLENT' }
      ]
    },
    {
      id: 'persp-3',
      titleAr: 'محور العمليات الداخلية والجودة (Internal Business Processes)',
      color: 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/40',
      kpis: [
        { nameAr: 'متوسط زمن الدورة المستندية لأوامر الشراء (P2P)', target: '< 3 أيام', actual: '1.8 يوم', status: 'EXCELLENT' },
        { nameAr: 'نسبة الدقة في مطابقة أنشطة WBS مع المصروفات', target: '100%', actual: '100%', status: 'EXCELLENT' },
        { nameAr: 'دورة إغلاق الفتـرات المالية الشهرية', target: '< 5 أيام', actual: '3 أيام', status: 'EXCELLENT' }
      ]
    },
    {
      id: 'persp-4',
      titleAr: 'محور التعلم والنمو والتحول الرقمي (Learning & Growth)',
      color: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40',
      kpis: [
        { nameAr: 'نسبة التدريب والتأهيل على NexoraOS™', target: '100%', actual: '96%', status: 'GOOD' },
        { nameAr: 'معدل أتمتة العمليات المحاسبية بالذكاء الاصطناعي', target: '≥ 80%', actual: '88%', status: 'EXCELLENT' }
      ]
    }
  ]);

  // Printable Report Generator
  const handlePrintManagementReport = () => {
    let reportHTML = `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>تقرير المحاسبة الإدارية المؤسسي - NexoraOS™ CIMA/IMA Standard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; background-color: white; color: #0f172a; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body class="p-8">
        <div class="max-w-5xl mx-auto border border-slate-300 rounded-2xl p-8 shadow-lg">
          
          <div class="flex justify-between items-center border-b pb-6 mb-6">
            <div>
              <h1 class="text-2xl font-black text-emerald-800">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h1>
              <h2 class="text-sm font-extrabold text-slate-600 mt-1">منظومة المحاسبة الإدارية والرقابة على التكاليف (NexoraOS™ Management Accounting)</h2>
              <p class="text-xs text-slate-400 mt-0.5">مطابق لمعايير المعهد العالمي للمحاسبين الإداريين CIMA / IMA & IPSAS Standards</p>
            </div>
            <div class="text-right font-mono text-xs text-slate-500">
              <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-YE')}</p>
              <p>الرمز المرجعي: CMA-RPT-2026-088</p>
            </div>
          </div>

          <div class="space-y-6">
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 class="font-black text-sm text-slate-800 border-b pb-2 mb-3">1. تحليل نقطة التعادل وهامش المساهمة (CVP Analysis Summary)</h3>
              <div class="grid grid-cols-3 gap-4 text-xs font-bold">
                <div>التكاليف الثابتة الإجمالية: <span class="font-mono text-emerald-700">${cvpState.fixedCostsYer.toLocaleString()} YER</span></div>
                <div>نقطة التعادل بالوحدات: <span class="font-mono text-emerald-700">${cvpMetrics.breakEvenUnits.toLocaleString()} وحدة</span></div>
                <div>نقطة التعادل بالإيراد: <span class="font-mono text-emerald-700">${cvpMetrics.breakEvenRevenueYer.toLocaleString()} YER</span></div>
                <div>هامش المساهمة للوحدة: <span class="font-mono text-emerald-700">${cvpMetrics.contributionMarginPerUnit.toLocaleString()} YER</span></div>
                <div>نسبة هامش المساهمة: <span class="font-mono text-emerald-700">${(cvpMetrics.contributionMarginRatio * 100).toFixed(1)}%</span></div>
                <div>هامش الأمان (Margin of Safety): <span class="font-mono text-emerald-700">${(cvpMetrics.marginOfSafetyRatio * 100).toFixed(1)}%</span></div>
              </div>
            </div>

            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 class="font-black text-sm text-slate-800 border-b pb-2 mb-3">2. التكاليف المعيارية وتحليل الانحرافات الرباعي (Standard Costing & Variance Analysis)</h3>
              <table class="w-full text-xs text-right border-collapse">
                <thead>
                  <tr class="bg-slate-200 font-extrabold text-slate-800">
                    <th class="p-2">بند التكلفة</th>
                    <th class="p-2">انحراف السعر / المعدل</th>
                    <th class="p-2">انحراف الكمية / الكفاءة</th>
                    <th class="p-2">الانحراف الكلي</th>
                    <th class="p-2">التقييم</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  ${varianceCalculations.map(v => `
                    <tr>
                      <td class="p-2 font-black">${v.categoryAr}</td>
                      <td class="p-2 font-mono">${v.priceVarianceYer.toLocaleString()} YER</td>
                      <td class="p-2 font-mono">${v.quantityVarianceYer.toLocaleString()} YER</td>
                      <td class="p-2 font-mono font-black">${v.totalVarianceYer.toLocaleString()} YER</td>
                      <td class="p-2 font-black ${v.totalVarianceStatus === 'FAVORABLE' ? 'text-emerald-700' : 'text-rose-700'}">${v.totalVarianceStatus}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 class="font-black text-sm text-slate-800 border-b pb-2 mb-3">3. الموازنات الرأسمالية وتقييم قرارات الاستثمار (Capital Budgeting)</h3>
              <div class="grid grid-cols-2 gap-4 text-xs font-bold">
                <div>الاستثمار المبدئي المطلوب: <span class="font-mono text-slate-900">${capBudgetState.initialInvestmentYer.toLocaleString()} YER</span></div>
                <div>صافي القيمة الحالية (NPV): <span class="font-mono text-emerald-700">${capBudgetMetrics.npvYer.toLocaleString()} YER</span></div>
                <div>معدل العائد الداخلي المتوقع (IRR): <span class="font-mono text-emerald-700">${capBudgetMetrics.irrPercent}%</span></div>
                <div>فترة الاسترداد (Payback Period): <span class="font-mono text-emerald-700">${capBudgetMetrics.paybackYears} سنة</span></div>
                <div>مؤشر الربحية (PI): <span class="font-mono text-emerald-700">${capBudgetMetrics.profitabilityIndex.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          <div class="mt-12 pt-6 border-t flex justify-between items-center text-xs text-slate-500 font-bold">
            <div>توقيع المحاسب القانوني / مدير المحاسبة الإدارية</div>
            <div>يعتمد / رئيس القطاع المالي CFO</div>
          </div>

        </div>
      </body>
      </html>
    `;
    printHTML(reportHTML);
  };

  return (
    <div className="space-y-6">
      
      {/* BRAND & STANDARDS HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black rounded-lg uppercase tracking-wider">
                CIMA / IMA Global Standards Engine
              </span>
              <span className="text-zinc-400 text-xs font-mono">| NexoraOS™ Certified Chartered Accountant OS</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <Calculator className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{isRtl ? 'محرك المحاسبة الإدارية والرقابة على التكاليف والقرارات الاستراتيجية' : 'Management Accounting, Cost Control & Decision Engine'}</span>
            </h2>
            <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              {isRtl 
                ? 'منظومة حاسوبية متكاملة تدعم كافة معايير المحاسبة الإدارية الدولية: تخصيص التكاليف المبني على الأنشطة (ABC)، تحليل التعادل وهامش المساهمة (CVP)، التكاليف المعيارية وتحليل الانحرافات، الموازنات الرأسمالية (NPV/IRR)، وبطاقات الأداء المتوازن (BSC).'
                : 'Enterprise platform supporting global CIMA/IMA management accounting standards: ABC costing, CVP break-even, standard variance analysis, capital budgeting NPV/IRR, and balanced scorecards.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrintManagementReport}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isRtl ? 'طباعة تقرير المحاسب الإداري' : 'Print Management Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODULE SELECTOR SUB-PILLS */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
        {[
          { id: 'abc', label: isRtl ? '1. تخصيص التكاليف بالأنشطة (ABC)' : '1. Activity-Based Costing (ABC)', icon: Layers },
          { id: 'cvp', label: isRtl ? '2. تحليل التعادل وهامش المساهمة (CVP)' : '2. Cost-Volume-Profit (CVP)', icon: Activity },
          { id: 'variances', label: isRtl ? '3. التكاليف المعيارية والانحرافات' : '3. Standard Cost Variances', icon: Scale },
          { id: 'responsibility', label: isRtl ? '4. محاسبة المسؤولية ومراكز التكلفة' : '4. Responsibility Accounting', icon: Target },
          { id: 'capital_budgeting', label: isRtl ? '5. الموازنات الرأسمالية (NPV/IRR)' : '5. Capital Budgeting (NPV/IRR)', icon: TrendingUp },
          { id: 'scorecard', label: isRtl ? '6. بطاقة الأداء المتوازن (BSC)' : '6. Balanced Scorecard (BSC)', icon: Award },
        ].map(mod => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id as ManagementModule)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODULE 1: ACTIVITY-BASED COSTING (ABC) */}
      {activeModule === 'abc' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <span>{isRtl ? 'نظام تخصيص التكاليف غير المباشرة المبني على الأنشطة (Activity-Based Costing)' : 'Activity-Based Costing (ABC) Overheads Allocation Engine'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRtl ? 'توزيع التكاليف الإدارية واللوجستية غير المباشرة على المشاريع استناداً لمجمعات التكاليف ومحركات التكلفة الحقيقية (Cost Drivers).' : 'Allocating indirect overheads to projects using verified activity cost pools and cost drivers.'}
                </p>
              </div>

              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl text-xs font-black border border-emerald-200">
                CIMA Standard ABC-01
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {abcCostPools.map(pool => {
                const costPerDriverUnit = pool.totalDriverUnits > 0 ? pool.totalPoolCostYer / pool.totalDriverUnits : 0;

                return (
                  <div key={pool.id} className="bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100/60 dark:bg-emerald-950 px-2 py-0.5 rounded">
                        مجمع تكلفة Cost Pool
                      </span>
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                        {pool.totalPoolCostYer.toLocaleString()} YER
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{isRtl ? pool.poolNameAr : pool.poolNameEn}</h4>

                    <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-[11px] space-y-1 border border-slate-200 dark:border-zinc-800">
                      <div className="text-slate-500 font-extrabold flex justify-between">
                        <span>محرك التكلفة:</span>
                        <span className="text-slate-800 dark:text-zinc-200">{pool.costDriverNameAr}</span>
                      </div>
                      <div className="text-slate-500 font-extrabold flex justify-between">
                        <span>إجمالي وحدات المحرك:</span>
                        <span className="font-mono text-slate-900 dark:text-white font-black">{pool.totalDriverUnits}</span>
                      </div>
                      <div className="text-emerald-600 font-extrabold flex justify-between border-t pt-1">
                        <span>معدل تحميل التكلفة للوحدة:</span>
                        <span className="font-mono font-black">{costPerDriverUnit.toLocaleString()} YER / وحدة</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">التوزيع على المشاريع:</span>
                      {pool.allocatedToProjects.map(proj => (
                        <div key={proj.projectId} className="flex justify-between items-center text-[10px] font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg">
                          <span>{proj.projectNameAr} ({proj.driverUnits} وحدة)</span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-extrabold">{proj.allocatedCostYer.toLocaleString()} YER</span>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* MODULE 2: COST-VOLUME-PROFIT (CVP) & BREAK-EVEN ANALYSIS */}
      {activeModule === 'cvp' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-5">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>{isRtl ? 'محاكي تحليل التعادل وهامش المساهمة (Cost-Volume-Profit CVP Analysis)' : 'Interactive CVP & Break-Even Simulator'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRtl ? 'قياس سلوك التكاليف الثابتة والمتغيرة وحساب نقطة التعادل بالإيراد والكميات وهامش الأمان للأنشطة الاستثمارية.' : 'Measuring fixed/variable cost behavior, break-even threshold, contribution margin ratio, and margin of safety.'}
                </p>
              </div>

              <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-xl text-xs font-black border border-blue-200">
                IMA CVP-Standard
              </span>
            </div>

            {/* CVP CONTROLS & KPI CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              
              {/* Input Sliders & Controls */}
              <div className="bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700/60 space-y-4">
                <h4 className="font-black text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? 'مدخلات نموذج CVP:' : 'CVP Model Inputs:'}</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 flex justify-between">
                    <span>التكاليف الثابتة (Fixed Costs):</span>
                    <span className="font-mono text-slate-900 dark:text-white">{cvpState.fixedCostsYer.toLocaleString()} YER</span>
                  </label>
                  <input
                    type="range"
                    min="10000000"
                    max="100000000"
                    step="5000000"
                    value={cvpState.fixedCostsYer}
                    onChange={(e) => setCvpState({ ...cvpState, fixedCostsYer: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 flex justify-between">
                    <span>التكلفة المتغيرة للوحدة (VC/Unit):</span>
                    <span className="font-mono text-slate-900 dark:text-white">{cvpState.variableCostPerUnitYer.toLocaleString()} YER</span>
                  </label>
                  <input
                    type="range"
                    min="2000"
                    max="30000"
                    step="1000"
                    value={cvpState.variableCostPerUnitYer}
                    onChange={(e) => setCvpState({ ...cvpState, variableCostPerUnitYer: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 flex justify-between">
                    <span>سعر / عائد الوحدة (Price/Unit):</span>
                    <span className="font-mono text-slate-900 dark:text-white">{cvpState.sellingPricePerUnitYer.toLocaleString()} YER</span>
                  </label>
                  <input
                    type="range"
                    min="5000"
                    max="50000"
                    step="1000"
                    value={cvpState.sellingPricePerUnitYer}
                    onChange={(e) => setCvpState({ ...cvpState, sellingPricePerUnitYer: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 flex justify-between">
                    <span>الكمية المستهدفة (Target Units):</span>
                    <span className="font-mono text-slate-900 dark:text-white">{cvpState.targetUnits.toLocaleString()}</span>
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={cvpState.targetUnits}
                    onChange={(e) => setCvpState({ ...cvpState, targetUnits: parseInt(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

              </div>

              {/* Output Computed Metrics */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 space-y-1.5">
                  <span className="text-[10px] font-black text-emerald-600 uppercase block">نقطة التعادل Break-Even Point</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {cvpMetrics.breakEvenUnits.toLocaleString()} <span className="text-xs font-sans text-slate-500">وحدة</span>
                  </p>
                  <span className="text-[10px] font-bold text-slate-500 block">
                    الإيراد المقابل: <span className="font-mono font-black text-emerald-700">{cvpMetrics.breakEvenRevenueYer.toLocaleString()} YER</span>
                  </span>
                </div>

                <div className="bg-blue-50/60 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200/60 dark:border-blue-800/60 space-y-1.5">
                  <span className="text-[10px] font-black text-blue-600 uppercase block">هامش المساهمة Contribution Margin</span>
                  <p className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono">
                    {cvpMetrics.contributionMarginPerUnit.toLocaleString()} <span className="text-xs font-sans text-slate-500">YER/وحدة</span>
                  </p>
                  <span className="text-[10px] font-bold text-slate-500 block">
                    نسبة الهامش (CMR): <span className="font-mono font-black text-blue-700">{(cvpMetrics.contributionMarginRatio * 100).toFixed(1)}%</span>
                  </span>
                </div>

                <div className="bg-purple-50/60 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200/60 dark:border-purple-800/60 space-y-1.5">
                  <span className="text-[10px] font-black text-purple-600 uppercase block">هامش الأمان Margin of Safety</span>
                  <p className="text-xl font-black text-purple-700 dark:text-purple-300 font-mono">
                    {(cvpMetrics.marginOfSafetyRatio * 100).toFixed(1)} <span className="text-xs font-sans text-slate-500">%</span>
                  </p>
                  <span className="text-[10px] font-bold text-slate-500 block">
                    بالوحدات: <span className="font-mono font-black text-purple-700">{cvpMetrics.marginOfSafetyUnits.toLocaleString()} وحدة</span>
                  </span>
                </div>

                {/* CVP Recharts Live Graph */}
                <div className="sm:col-span-3 bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-emerald-400">منحنى التعادل التفاعلي (Break-Even CVP Graph - In Millions YER)</span>
                    <span className="text-[10px] font-mono text-zinc-400">الرافع التشغيلي DOL: {cvpMetrics.degreeOfOperatingLeverage.toFixed(2)}x</span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cvpMetrics.chartPoints}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="units" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#fff' }} />
                        <Line type="monotone" dataKey="revenue" name="إجمالي الإيرادات (M YER)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="totalCost" name="إجمالي التكاليف (M YER)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="fixedCost" name="التكاليف الثابتة (M YER)" stroke="#64748b" strokeDasharray="5 5" strokeWidth={2} />
                        <ReferenceLine x={cvpMetrics.breakEvenUnits} stroke="#f59e0b" label={{ value: 'نقطة التعادل', fill: '#f59e0b', fontSize: 10 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODULE 3: STANDARD COSTING & VARIANCE ANALYSIS */}
      {activeModule === 'variances' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-600" />
                  <span>{isRtl ? 'نظام التكاليف المعيارية وتحليل الانحرافات الرباعي (4-Way Variance Analysis Engine)' : 'Standard Costing & 4-Way Variance Analysis Engine'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRtl ? 'تحليل انحرافات أسعار وكميات المواد المباشرة ومعدلات وكفاءة أجور العمالة المباشرة لتحديد كفاءة التنفيذ الميداني.' : 'Decomposing price, rate, quantity, and efficiency variances into Favorable (F) or Unfavorable (U) signals.'}
                </p>
              </div>

              <span className="px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded-xl text-xs font-black border border-amber-200">
                Standard Variance CIMA-04
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-zinc-900 text-amber-400 font-black text-[10px] uppercase">
                    <th className="p-3">بند التكلفة والمستلزمات</th>
                    <th className="p-3 text-center">الكمية المعيارية (SQ)</th>
                    <th className="p-3 text-center">الكمية الفعلية (AQ)</th>
                    <th className="p-3 text-center">السعر المعياري (SP)</th>
                    <th className="p-3 text-center">السعر فعلي (AP)</th>
                    <th className="p-3 text-right">انحراف السعر / المعدل</th>
                    <th className="p-3 text-right">انحراف الكمية / الكفاءة</th>
                    <th className="p-3 text-right">الانحراف الكلي</th>
                    <th className="p-3 text-center">التصنيف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold text-slate-700 dark:text-zinc-300">
                  {varianceCalculations.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-3 font-black text-slate-900 dark:text-white">{v.categoryAr}</td>
                      <td className="p-3 text-center font-mono">{v.stdQuantity.toLocaleString()} {v.unitMeasure}</td>
                      <td className="p-3 text-center font-mono">{v.actQuantity.toLocaleString()} {v.unitMeasure}</td>
                      <td className="p-3 text-center font-mono">{v.stdPriceYer.toLocaleString()} YER</td>
                      <td className="p-3 text-center font-mono">{v.actPriceYer.toLocaleString()} YER</td>
                      
                      <td className="p-3 text-right font-mono">
                        <span className={v.priceVarianceStatus === 'FAVORABLE' ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>
                          {v.priceVarianceYer.toLocaleString()} YER ({v.priceVarianceStatus === 'FAVORABLE' ? 'F' : 'U'})
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono">
                        <span className={v.quantityVarianceStatus === 'FAVORABLE' ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>
                          {v.quantityVarianceYer.toLocaleString()} YER ({v.quantityVarianceStatus === 'FAVORABLE' ? 'F' : 'U'})
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                        {v.totalVarianceYer.toLocaleString()} YER
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          v.totalVarianceStatus === 'FAVORABLE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {v.totalVarianceStatus === 'FAVORABLE' ? 'نافع F' : 'غير نافع U'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* MODULE 5: CAPITAL BUDGETING (NPV/IRR) */}
      {activeModule === 'capital_budgeting' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>{isRtl ? 'محرك الموازنات الرأسمالية وتقييم الاستثمارات (Capital Budgeting Engine - NPV / IRR / Payback)' : 'Capital Budgeting & Investment Valuation Engine'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRtl ? 'حساب صافي القيمة الحالية (NPV)، معدل العائد الداخلي (IRR)، مؤشر الربحية (PI)، وفترة الاسترداد للمشاريع التنموية والوقفية.' : 'Net Present Value (NPV), Internal Rate of Return (IRR), Profitability Index (PI), and Discounted Payback.'}
                </p>
              </div>

              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl text-xs font-black border border-emerald-200">
                DCF Valuation Standard
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200/60 space-y-1">
                <span className="text-[10px] font-black text-emerald-600 uppercase block">صافي القيمة الحالية Net Present Value</span>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {capBudgetMetrics.npvYer.toLocaleString()} <span className="text-xs font-sans">YER</span>
                </p>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{capBudgetMetrics.npvYer > 0 ? 'مشروع مجدٍ استثمارياً (NPV > 0)' : 'مشروع غير مجدٍ'}</span>
                </span>
              </div>

              <div className="bg-blue-50/60 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200/60 space-y-1">
                <span className="text-[10px] font-black text-blue-600 uppercase block">معدل العائد الداخلي Internal Rate of Return</span>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">
                  {capBudgetMetrics.irrPercent}%
                </p>
                <span className="text-[10px] font-bold text-blue-600 block">
                  أعلى من تكلفة رأس المال ({capBudgetState.discountRatePercent}%)
                </span>
              </div>

              <div className="bg-amber-50/60 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200/60 space-y-1">
                <span className="text-[10px] font-black text-amber-600 uppercase block">فترة الاسترداد Payback Period</span>
                <p className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                  {capBudgetMetrics.paybackYears} <span className="text-xs font-sans">سنوات</span>
                </p>
                <span className="text-[10px] font-bold text-amber-600 block">
                  استرداد كامل رأس المال المبدئي
                </span>
              </div>

              <div className="bg-purple-50/60 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200/60 space-y-1">
                <span className="text-[10px] font-black text-purple-600 uppercase block">مؤشر الربحية Profitability Index</span>
                <p className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
                  {capBudgetMetrics.profitabilityIndex.toFixed(2)}
                </p>
                <span className="text-[10px] font-bold text-purple-600 block">
                  عائد كل 1 YER مستثمر
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODULE 6: BALANCED SCORECARD (BSC) */}
      {activeModule === 'scorecard' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span>{isRtl ? 'بطاقة الأداء المتوازن المؤسسية (Balanced Scorecard - Kaplan & Norton)' : 'Balanced Scorecard Performance System'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRtl ? 'ربط الأهداف المالية بالأهداف التشغيلية ومستويات الجودة ونمو رأس المال البشري للمؤسسة.' : 'Balancing financial metrics with beneficiary satisfaction, process excellence, and organizational learning.'}
                </p>
              </div>

              <span className="px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-xl text-xs font-black border border-purple-200">
                Kaplan & Norton Framework
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scorecardPerspectives.map(persp => (
                <div key={persp.id} className={`p-4 rounded-2xl border-2 ${persp.color} space-y-3`}>
                  <h4 className="font-black text-xs border-b pb-2">{persp.titleAr}</h4>

                  <div className="space-y-2">
                    {persp.kpis.map((kpi, idx) => (
                      <div key={idx} className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{kpi.nameAr}</p>
                          <span className="text-[10px] text-slate-500 font-bold">المستهدف: {kpi.target}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 block">{kpi.actual}</span>
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                            {kpi.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
