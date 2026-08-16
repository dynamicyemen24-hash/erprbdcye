import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coins, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRightLeft, 
  Percent, 
  Briefcase, 
  Calendar, 
  Info, 
  FileText, 
  PieChart as PieIcon, 
  BarChart2,
  X,
  Search,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie, 
  LineChart, 
  Line,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { Account, Transaction, TransactionLine } from './FinanceTypes';
import { Project } from '../../types';

interface BudgetVarianceTabProps {
  accounts: Account[];
  transactions: Transaction[];
  lines: TransactionLine[];
  projects: Project[];
  lang: 'ar' | 'en';
}

type RateScenario = 'sanaa' | 'aden' | 'official';
type DisplayCurrency = 'USD' | 'YER';

export default function BudgetVarianceTab({ 
  accounts, 
  transactions, 
  lines, 
  projects, 
  lang 
}: BudgetVarianceTabProps) {
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [rateScenario, setRateScenario] = useState<RateScenario>('sanaa');
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('USD');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'under' | 'warning' | 'over'>('all');
  const [drilldownStatus, setDrilldownStatus] = useState<'active' | 'pending' | 'completed' | 'delayed' | null>(() => {
    return localStorage.getItem('finance_drilldown_status') as any;
  });

  React.useEffect(() => {
    // Cleanup on unmount so the next time they visit normal Finance, the filter is gone
    return () => {
      localStorage.removeItem('finance_drilldown_status');
    };
  }, []);

  // Exchange rate definitions based on scenario
  const exchangeRates = useMemo(() => {
    switch (rateScenario) {
      case 'aden':
        return {
          USD: 1850,
          SAR: 490,
          YER: 1
        };
      case 'official':
        return {
          USD: 250,
          SAR: 66,
          YER: 1
        };
      case 'sanaa':
      default:
        return {
          USD: 530,
          SAR: 140,
          YER: 1
        };
    }
  }, [rateScenario]);

  // Conversion helper
  const convertAmount = (amount: number, fromCurr: string, toCurr: string) => {
    if (fromCurr === toCurr) return amount;
    
    // Convert from source to YER first
    const rateFrom = exchangeRates[fromCurr as keyof typeof exchangeRates] || 1;
    const amountInYer = amount * rateFrom;
    
    // Convert from YER to target
    const rateTo = exchangeRates[toCurr as keyof typeof exchangeRates] || 1;
    return amountInYer / rateTo;
  };

  // Process data per project
  const projectVariances = useMemo(() => {
    return projects.map(proj => {
      // 1. Get original budget
      const originalBudgetVal = parseFloat(String(proj.budget || 0));
      const budgetCurrency = proj.currency_code || 'USD';

      // Convert budget to presentation currency
      const presentationBudget = convertAmount(originalBudgetVal, budgetCurrency, displayCurrency);

      // 2. Compute actual expenses from transactions lines
      // Filter lines belonging to this project
      const projectLines = lines.filter(line => line.project_id === proj.id);
      
      // Determine if an account is an expense account
      // Standard practice: account type 'EXPENSE', or account code starts with '6'
      let actualExpenseYer = 0;
      let actualExpenseUSD = 0;
      
      // We will sum the debits minus credits for expense lines, converted to YER/USD
      projectLines.forEach(line => {
        const acc = accounts.find(a => a.id === line.account_id || a.account_code === line.account_code);
        const isExpense = acc ? acc.account_type === 'EXPENSE' : line.account_code.startsWith('6');
        
        if (isExpense) {
          const debit = parseFloat(String(line.debit_amount || 0));
          const credit = parseFloat(String(line.credit_amount || 0));
          const net = debit - credit;
          
          const lineCurrency = line.currency_code || 'YER';
          
          actualExpenseYer += net * (exchangeRates[lineCurrency as keyof typeof exchangeRates] || 1);
        }
      });

      // Actual expenses in display currency
      const presentationActual = displayCurrency === 'YER' 
        ? actualExpenseYer 
        : actualExpenseYer / exchangeRates.USD;

      // 3. Compute variances
      const varianceAmount = presentationBudget - presentationActual;
      const utilizationRate = presentationBudget > 0 
        ? (presentationActual / presentationBudget) * 100 
        : 0;

      // 4. Currency revaluation / translation difference
      // E.g., if a project was budgeted in USD, but spent in YER,
      // what is the effect of exchange rate fluctuations between the standard scenario rate
      // and a benchmark baseline planning rate of 530 YER/USD?
      const standardPlanningRate = 530;
      let currencyVariance = 0;

      if (budgetCurrency === 'USD') {
        // Budget was USD, actual spent in YER
        const actualSpentUSDAtPlanning = actualExpenseYer / standardPlanningRate;
        const actualSpentUSDAtCurrent = actualExpenseYer / exchangeRates.USD;
        // The difference in USD costs due strictly to exchange rate difference
        currencyVariance = actualSpentUSDAtPlanning - actualSpentUSDAtCurrent;
        
        // Convert currency variance to display currency
        if (displayCurrency === 'YER') {
          currencyVariance = currencyVariance * exchangeRates.USD;
        }
      }

      return {
        ...proj,
        originalBudgetVal,
        budgetCurrency,
        presentationBudget,
        presentationActual,
        varianceAmount,
        utilizationRate,
        currencyVariance,
        projectLinesCount: projectLines.length,
        lines: projectLines
      };
    });
  }, [projects, lines, accounts, displayCurrency, exchangeRates]);

  // General Filtered Project List
  const filteredProjects = useMemo(() => {
    return projectVariances.filter(p => {
      const matchSearch = 
        p.name_ar.includes(searchQuery) || 
        p.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchStatus = true;
      if (statusFilter === 'under') {
        matchStatus = p.utilizationRate < 80;
      } else if (statusFilter === 'warning') {
        matchStatus = p.utilizationRate >= 80 && p.utilizationRate <= 100;
      } else if (statusFilter === 'over') {
        matchStatus = p.utilizationRate > 100;
      }

      let matchDrilldown = true;
      if (drilldownStatus === 'active') {
        matchDrilldown = p.status_code === 'active' || !p.status_code;
      } else if (drilldownStatus === 'pending') {
        matchDrilldown = p.status_code === 'pending' || p.status_code === 'upcoming';
      } else if (drilldownStatus === 'completed') {
        matchDrilldown = p.status_code === 'completed';
      } else if (drilldownStatus === 'delayed') {
        matchDrilldown = p.status_code === 'delayed';
      }

      return matchSearch && matchStatus && matchDrilldown;
    });
  }, [projectVariances, searchQuery, statusFilter, drilldownStatus]);

  // Main KPI Sums
  const summaryKpis = useMemo(() => {
    let totalBudget = 0;
    let totalActual = 0;
    let totalCurrencyVariance = 0;

    projectVariances.forEach(p => {
      let matchesDrilldown = true;
      if (drilldownStatus === 'active') {
        matchesDrilldown = p.status_code === 'active' || !p.status_code;
      } else if (drilldownStatus === 'pending') {
        matchesDrilldown = p.status_code === 'pending' || p.status_code === 'upcoming';
      } else if (drilldownStatus === 'completed') {
        matchesDrilldown = p.status_code === 'completed';
      } else if (drilldownStatus === 'delayed') {
        matchesDrilldown = p.status_code === 'delayed';
      }

      if (matchesDrilldown) {
        totalBudget += p.presentationBudget;
        totalActual += p.presentationActual;
        totalCurrencyVariance += p.currencyVariance;
      }
    });

    const netVariance = totalBudget - totalActual;
    const avgUtilization = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalActual,
      netVariance,
      avgUtilization,
      totalCurrencyVariance
    };
  }, [projectVariances, drilldownStatus]);

  // Recharts Bar Data
  const chartData = useMemo(() => {
    return filteredProjects.map(p => ({
      name: lang === 'ar' ? p.name_ar.substring(0, 20) + '..' : p.name_en.substring(0, 18) + '..',
      [lang === 'ar' ? 'المستخدم المسئول' : 'Planned Budget']: Math.round(p.presentationBudget),
      [lang === 'ar' ? 'الإيرادات المحصلة' : 'Actual Spent']: Math.round(p.presentationActual),
      [lang === 'ar' ? 'الامتثال المالي' : 'Variance']: Math.round(p.varianceAmount)
    }));
  }, [filteredProjects, lang]);

  // Currency Variance Chart Data
  const currencyVarianceChartData = useMemo(() => {
    return filteredProjects.map(p => ({
      name: lang === 'ar' ? p.name_ar.substring(0, 20) + '..' : p.name_en.substring(0, 18) + '..',
      [lang === 'ar' ? 'وفر/عجز أسعار الصرف' : 'Exchange Rate Diff']: Math.round(p.currencyVariance)
    }));
  }, [filteredProjects, lang]);

  return (
    <div className="space-y-6 animate-fade-in" id="budget-variance-panel">
      {/* Active Drilldown Banner */}
      {drilldownStatus && (
        <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">
                {lang === 'ar' ? 'عرض تصفية تفصيلي نشط' : 'Active Financial Status Drilldown'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {lang === 'ar' 
                  ? 'أنت تستعرض حالياً التحليل المالي التفصيلي للمشاريع ذات الحالة: ' 
                  : 'You are currently analyzing the complete financial breakdown for projects with status: '}
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
                  {drilldownStatus === 'active' && (lang === 'ar' ? 'نشط ميدانياً' : 'Active Field Projects')}
                  {drilldownStatus === 'pending' && (lang === 'ar' ? 'قيد الانتظار' : 'Pending / Upcoming')}
                  {drilldownStatus === 'completed' && (lang === 'ar' ? 'مكتمل' : 'Completed')}
                  {drilldownStatus === 'delayed' && (lang === 'ar' ? 'متأخر' : 'Delayed')}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setDrilldownStatus(null);
              localStorage.removeItem('finance_drilldown_status');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto shrink-0"
          >
            <X className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إلغاء التصفية / عرض الكل' : 'Clear Drilldown / Show All'}</span>
          </button>
        </div>
      )}

      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Converted Budget */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
              {lang === 'ar' ? 'إجمالي الموازنة المقدرة' : 'Total Planned Budget'}
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white font-mono">
            {Math.round(summaryKpis.totalBudget).toLocaleString()} {displayCurrency}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-1">
            {lang === 'ar' ? 'إجمالي تمويل المشاريع النشطة' : 'Aggregated budget for active projects'}
          </p>
        </div>

        {/* Total Converted Actual Expense */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
              {lang === 'ar' ? 'إجمالي المصروفات الفعلية' : 'Total Actual Expenses'}
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white font-mono">
            {Math.round(summaryKpis.totalActual).toLocaleString()} {displayCurrency}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-1">
            {lang === 'ar' ? 'المصروفات الفعلية المقيدة بالدفتر' : 'Cumulative debits booked in ledger'}
          </p>
        </div>

        {/* Net Converted Variance */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
              {lang === 'ar' ? 'صافي التباين (الوفر المحقق)' : 'Net Budget Variance'}
            </span>
            <div className={`p-2 rounded-lg ${summaryKpis.netVariance >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-xl font-black font-mono flex items-center gap-1.5 ${summaryKpis.netVariance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {summaryKpis.netVariance >= 0 ? '+' : ''}{Math.round(summaryKpis.netVariance).toLocaleString()} {displayCurrency}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1">
            <span>{lang === 'ar' ? 'نسبة الاستهلاك:' : 'Utilization Rate:'}</span>
            <span className="font-extrabold font-mono text-slate-700 dark:text-zinc-200">{summaryKpis.avgUtilization.toFixed(1)}%</span>
          </div>
        </div>

        {/* Exchange Differences Variance */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
              {lang === 'ar' ? 'وفر/عجز أسعار الصرف' : 'Exchange Gain / Loss'}
            </span>
            <div className={`p-2 rounded-lg ${summaryKpis.totalCurrencyVariance >= 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-600'}`}>
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-xl font-black font-mono flex items-center gap-1.5 ${summaryKpis.totalCurrencyVariance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {summaryKpis.totalCurrencyVariance >= 0 ? '+' : ''}{Math.round(summaryKpis.totalCurrencyVariance).toLocaleString()} {displayCurrency}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-1">
            {lang === 'ar' ? 'مكاسب تذبذب العملة مقابل سعر التخطيط' : 'Translation impact due to exchange fluctuations'}
          </p>
        </div>
      </div>

      {/* 2. CONTROL CONTROLLERS SECTION */}
      <div className="bg-slate-100/60 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Exchange scenario controller */}
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-wider">
              {lang === 'ar' ? 'سيناريو سعر الصرف (سعر المحاكاة)' : 'Exchange Rate Scenario'}
            </label>
            <div className="flex bg-white dark:bg-zinc-950 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-black">
              <button
                onClick={() => setRateScenario('sanaa')}
                className={`px-2.5 py-1 rounded ${rateScenario === 'sanaa' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {lang === 'ar' ? 'صنعاء (530 YER)' : 'Sanaa (530)'}
              </button>
              <button
                onClick={() => setRateScenario('aden')}
                className={`px-2.5 py-1 rounded ${rateScenario === 'aden' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {lang === 'ar' ? 'عدن (1850 YER)' : 'Aden (1850)'}
              </button>
              <button
                onClick={() => setRateScenario('official')}
                className={`px-2.5 py-1 rounded ${rateScenario === 'official' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {lang === 'ar' ? 'رسمي (250 YER)' : 'Official (250)'}
              </button>
            </div>
          </div>

          {/* Presentation Currency controller */}
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-wider">
              {lang === 'ar' ? 'حالة قاعدة البيانات' : 'Presentation Currency'}
            </label>
            <div className="flex bg-white dark:bg-zinc-950 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-black">
              <button
                onClick={() => setDisplayCurrency('USD')}
                className={`px-3 py-1 rounded ${displayCurrency === 'USD' ? 'bg-amber-500 text-slate-950' : 'text-slate-500 hover:text-slate-800'}`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setDisplayCurrency('YER')}
                className={`px-3 py-1 rounded ${displayCurrency === 'YER' ? 'bg-amber-500 text-slate-950' : 'text-slate-500 hover:text-slate-800'}`}
              >
                YER (?)
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex bg-white dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-[10px] font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg ${statusFilter === 'all' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white' : 'text-zinc-400'}`}
            >
              {lang === 'ar' ? 'أيام' : 'All'}
            </button>
            <button
              onClick={() => setStatusFilter('under')}
              className={`px-2.5 py-1 rounded-lg ${statusFilter === 'under' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'text-zinc-400'}`}
            >
              {lang === 'ar' ? 'تحت السيطرة (<80%)' : 'Under 80%'}
            </button>
            <button
              onClick={() => setStatusFilter('warning')}
              className={`px-2.5 py-1 rounded-lg ${statusFilter === 'warning' ? 'bg-amber-50 text-amber-700 font-extrabold' : 'text-zinc-400'}`}
            >
              {lang === 'ar' ? 'إنذار (80-100%)' : 'Warning'}
            </button>
            <button
              onClick={() => setStatusFilter('over')}
              className={`px-2.5 py-1 rounded-lg ${statusFilter === 'over' ? 'bg-rose-50 text-rose-700 font-extrabold' : 'text-zinc-400'}`}
            >
              {lang === 'ar' ? 'تجاوز الموازنة (>100%)' : 'Over Budget'}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder={lang === 'ar' ? 'بحث باسم المشروع...' : 'Search project...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-1.5 px-3 pr-8 text-[11px] outline-none text-slate-700 dark:text-white w-48 font-bold"
              style={lang === 'en' ? { paddingRight: '12px', paddingLeft: '32px' } : {}}
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5" 
                    style={lang === 'en' ? { right: 'auto', left: '10px' } : {}} />
          </div>
        </div>
      </div>

      {/* 3. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Budget vs Actual Comparison */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/60 mb-4">
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'مقارنة الموازنة التقديرية بالمصروفات الفعلية' : 'Planned Budget vs Actual Expenditure'}</span>
              </h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {lang === 'ar' ? 'يقارن السقف المعتمد مع المدفوعات المسجلة فعلياً لكل مشروع' : 'Compares estimated limits with actual posted debits'}
              </p>
            </div>
            <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 font-bold px-2 py-0.5 rounded uppercase">
              {lang === 'ar' ? 'رسم بياني شريطي' : 'Bar Chart'}
            </span>
          </div>

          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs">
                {lang === 'ar' ? 'لا توجد بيانات للمشاريع المحددة' : 'No data available for filtered projects'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      borderRadius: '12px', 
                      border: 'none',
                      color: '#f3f4f6',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconSize={10}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} 
                  />
                  <Bar 
                    dataKey={lang === 'ar' ? 'الموازنة المقدرة' : 'Planned Budget'} 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey={lang === 'ar' ? 'المصروفات الفعلية' : 'Actual Spent'} 
                    fill="#f59e0b" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart B: Currency Translation Gain/Loss Variance per project */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/60 mb-4">
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <span>{lang === 'ar' ? 'أثر فروقات العملات وتغيرات أسعار الصرف' : 'Currency Translation Gain / Loss Impact'}</span>
              </h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {lang === 'ar' ? 'يوضح الانحراف الناتج فقط عن فارق أسعار تحويل العملات بين الميزانية والتنفيذ' : 'Variance generated solely by currency exchange deviations'}
              </p>
            </div>
            <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 font-bold px-2 py-0.5 rounded uppercase">
              {lang === 'ar' ? 'منحنى الانحراف' : 'Deviation Chart'}
            </span>
          </div>

          <div className="h-64">
            {currencyVarianceChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs">
                {lang === 'ar' ? 'لا توجد بيانات كافية للتحليل الرسومي' : 'No variance data available'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currencyVarianceChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      borderRadius: '12px', 
                      border: 'none',
                      color: '#f3f4f6',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                  <Area 
                    type="monotone" 
                    dataKey={lang === 'ar' ? 'وفر/عجز أسعار الصرف' : 'Exchange Rate Diff'} 
                    stroke="#3b82f6" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorGain)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 4. MAIN DATA TABLE */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-12 px-6 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
          <span className="text-xs font-black text-slate-800 dark:text-white">
            {lang === 'ar' ? 'تفاصيل الموازنات والانحرافات والمطابقة الميدانية' : 'Active Projects Budget Compliance Ledger'}
          </span>
          <span className="text-[10px] text-zinc-400 font-bold">
            {lang === 'ar' ? `مشاريع مطابقة: ${filteredProjects.length}` : `Matched projects: ${filteredProjects.length}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse" style={{ textAlign: lang === 'en' ? 'left' : 'right' }}>
            <thead>
              <tr className="bg-zinc-950 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-zinc-900">
                <th className="p-4">{lang === 'ar' ? 'نوع الإيراد' : 'Project Code'}</th>
                <th className="p-4">{lang === 'ar' ? 'نسب الإنجاز الميداني' : 'Project Title'}</th>
                <th className="p-4 text-center">{lang === 'ar' ? 'مستخدمين معتمدين' : 'Original Budget'}</th>
                <th className="p-4 text-right">{lang === 'ar' ? `الموازنة (${displayCurrency})` : `Budget (${displayCurrency})`}</th>
                <th className="p-4 text-right">{lang === 'ar' ? `المنصرف (${displayCurrency})` : `Spent (${displayCurrency})`}</th>
                <th className="p-4 text-right">{lang === 'ar' ? 'جميع الأقسام' : 'Variance'}</th>
                <th className="p-4 text-right">{lang === 'ar' ? 'مادة إغاثية' : 'FX Difference'}</th>
                <th className="p-4">{lang === 'ar' ? 'مدير المشروع الميداني' : 'Budget Absorption'}</th>
                <th className="p-4 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400 font-bold">
                    {lang === 'ar' ? 'لا توجد مشاريع مطابقة للخيارات المحددة' : 'No matching projects found'}
                  </td>
                </tr>
              ) : (
                filteredProjects.map(proj => {
                  const percentSpent = proj.utilizationRate;
                  let progressBarColor = 'bg-emerald-500';
                  let textColor = 'text-emerald-600 dark:text-emerald-400';
                  let badgeBg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20';

                  if (percentSpent >= 80 && percentSpent <= 100) {
                    progressBarColor = 'bg-amber-500';
                    textColor = 'text-amber-600 dark:text-amber-400';
                    badgeBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/20';
                  } else if (percentSpent > 100) {
                    progressBarColor = 'bg-rose-500 animate-pulse';
                    textColor = 'text-rose-600 dark:text-rose-400';
                    badgeBg = 'bg-rose-50 text-rose-700 dark:bg-rose-950/20';
                  }

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-all font-semibold">
                      <td className="p-4 font-mono font-black text-slate-900 dark:text-white">{proj.code}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-white">
                          {lang === 'ar' ? proj.name_ar : proj.name_en}
                        </div>
                        {proj.projectLinesCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-zinc-400 font-semibold mt-1">
                            <FileText className="w-2.5 h-2.5" />
                            {lang === 'ar' ? `${proj.projectLinesCount} قيد محاسبي` : `${proj.projectLinesCount} ledger records`}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center font-mono text-[11px] font-black">
                        {proj.originalBudgetVal.toLocaleString()} {proj.budgetCurrency}
                      </td>
                      <td className="p-4 text-right font-mono text-[11px] font-bold">
                        {Math.round(proj.presentationBudget).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-mono text-[11px] font-extrabold text-slate-900 dark:text-zinc-100">
                        {Math.round(proj.presentationActual).toLocaleString()}
                      </td>
                      <td className={`p-4 text-right font-mono text-[11px] font-black ${proj.varianceAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                        {proj.varianceAmount >= 0 ? '+' : ''}{Math.round(proj.varianceAmount).toLocaleString()}
                      </td>
                      <td className={`p-4 text-right font-mono text-[11px] font-bold ${proj.currencyVariance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {proj.currencyVariance >= 0 ? '+' : ''}{Math.round(proj.currencyVariance).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="w-32 lg:w-40 space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-black">
                            <span className={textColor}>{percentSpent.toFixed(0)}%</span>
                            <span className="text-zinc-400">{(100 - percentSpent).toFixed(0)}% {lang === 'ar' ? 'إلغاء' : 'rem'}</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`${progressBarColor} h-1.5 rounded-full`} style={{ width: `${Math.min(100, percentSpent)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedProject(proj as any)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-zinc-800 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-[10px] font-black transition-colors cursor-pointer"
                        >
                          {lang === 'ar' ? 'المصروف الفعلي' : 'Audit'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. AUDIT & JOURNAL LINES MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="h-14 px-6 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-white">
                    {lang === 'ar' ? 'كشف التدقيق التفصيلي لمصروفات المشروع' : 'Project Financial Audit Ledger'}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {lang === 'ar' ? selectedProject.name_ar : selectedProject.name_en} ({selectedProject.code})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProject(null)} 
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 dark:bg-zinc-950/20 custom-scrollbar">
              {/* Target Project Mini Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/80">
                <div>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'الموازنة المقدرة' : 'Planned Budget'}</span>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">
                    {Math.round((selectedProject as any).presentationBudget).toLocaleString()} {displayCurrency}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'إجمالي المنصرف' : 'Total Spent'}</span>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">
                    {Math.round((selectedProject as any).presentationActual).toLocaleString()} {displayCurrency}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'معدل الامتثال المالي' : 'Variance Amount'}</span>
                  <p className={`text-xs font-black mt-0.5 ${(selectedProject as any).varianceAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {Math.round((selectedProject as any).varianceAmount).toLocaleString()} {displayCurrency}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase">{lang === 'ar' ? 'نمط متوزع متوازن' : 'FX Variance Impact'}</span>
                  <p className={`text-xs font-black mt-0.5 ${(selectedProject as any).currencyVariance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                    {Math.round((selectedProject as any).currencyVariance).toLocaleString()} {displayCurrency}
                  </p>
                </div>
              </div>

              {/* Ledger Lines list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  {lang === 'ar' ? 'القيود والترحيلات المرتبطة بهذا المشروع' : 'Detailed Linked Double-Entry Journal Lines'}
                </h4>

                <div className="border border-slate-200/60 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                  <table className="w-full text-xs text-right border-collapse" style={{ textAlign: lang === 'en' ? 'left' : 'right' }}>
                    <thead>
                      <tr className="bg-slate-100 dark:bg-zinc-950 text-slate-500 font-bold border-b border-slate-200 dark:border-zinc-800 text-[9px] uppercase tracking-wider">
                        <th className="p-3 w-28">{lang === 'ar' ? 'كود الحساب' : 'Account Code'}</th>
                        <th className="p-3">{lang === 'ar' ? 'اسم الحساب في الدليل' : 'Account Title'}</th>
                        <th className="p-3">{lang === 'ar' ? 'الشرح التفصيلي للسطر' : 'Line Description'}</th>
                        <th className="p-3 text-right w-24">{lang === 'ar' ? 'التاجر المعتمد' : 'Orig Value'}</th>
                        <th className="p-3 text-right w-28">{lang === 'ar' ? `الأرشيف (${displayCurrency})` : `Equiv (${displayCurrency})`}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-slate-600 dark:text-zinc-300">
                      {(selectedProject as any).lines.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-zinc-400 font-bold">
                            {lang === 'ar' ? 'لا توجد قيود مصروفات مسجلة لهذا المشروع بعد.' : 'No expense lines booked for this project yet.'}
                          </td>
                        </tr>
                      ) : (
                        (selectedProject as any).lines.map((line: any) => {
                          const acc = accounts.find(a => a.id === line.account_id || a.account_code === line.account_code);
                          const accName = acc ? (lang === 'ar' ? acc.name_ar : acc.name_en) : '';
                          const amountOrig = parseFloat(String(line.debit_amount || 0)) - parseFloat(String(line.credit_amount || 0));
                          const lineCurr = line.currency_code || 'YER';
                          
                          // Converted to YER
                          const amountInYer = amountOrig * (exchangeRates[lineCurr as keyof typeof exchangeRates] || 1);
                          // Converted to display
                          const amountInDisplay = displayCurrency === 'YER' ? amountInYer : amountInYer / exchangeRates.USD;

                          return (
                            <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 font-medium">
                              <td className="p-3 font-mono font-black text-slate-900 dark:text-zinc-100">{line.account_code}</td>
                              <td className="p-3 font-bold text-slate-800 dark:text-zinc-200">{accName || (lang === 'ar' ? 'حساب مصروف عام' : 'Expense Account')}</td>
                              <td className="p-3 text-[11px]">{line.description}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-500">
                                {amountOrig.toLocaleString()} {lineCurr}
                              </td>
                              <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                                {Math.round(amountInDisplay).toLocaleString()} {displayCurrency}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="h-14 px-6 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end shrink-0">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-black transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'تأكيد الحجز والتخصيص' : 'Close Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
