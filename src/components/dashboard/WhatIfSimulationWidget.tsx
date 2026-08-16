import React from 'react';
import { Calculator, Sliders, TrendingDown, TrendingUp, AlertTriangle, Users, DollarSign, Clock, ShieldAlert, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface WhatIfSimulationWidgetProps {
  lang: 'ar' | 'en';
}

export function WhatIfSimulationWidget({ lang }: WhatIfSimulationWidgetProps) {
  // Slider states for simulations
  const [fundingChange, setFundingChange] = React.useState<number>(0); // -30% to +30%
  const [costInflation, setCostInflation] = React.useState<number>(0); // 0% to +30%
  const [demandSurge, setDemandSurge] = React.useState<number>(0); // 0% to +50%
  const [deliveryDelayDays, setDeliveryDelayDays] = React.useState<number>(0); // 0 to 60 days

  const baseBudget = 1500000000; // 1.5 Billion YER
  const baseBeneficiaries = 35000;
  const baseTimelineMonths = 12;

  // Real-time calculated impacts
  const simulatedBudget = baseBudget * (1 + fundingChange / 100);
  const simulatedCost = baseBudget * (1 + costInflation / 100);
  const budgetGap = simulatedBudget - simulatedCost;

  const simulatedBeneficiaryDemand = Math.round(baseBeneficiaries * (1 + demandSurge / 100));
  const beneficiaryCoverageRatio = (simulatedBudget / simulatedCost) * 100;
  const simulatedBeneficiariesServed = Math.round(simulatedBeneficiaryDemand * Math.min(1, beneficiaryCoverageRatio / 100));
  const unreachedBeneficiaries = Math.max(0, simulatedBeneficiaryDemand - simulatedBeneficiariesServed);

  const riskScore = Math.min(100, Math.round(
    15 + (fundingChange < 0 ? Math.abs(fundingChange) * 1.5 : 0) + (costInflation * 1.2) + (demandSurge * 0.5) + (deliveryDelayDays * 0.6)
  ));

  const handlePreset = (type: string) => {
    if (type === 'funding_cut') {
      setFundingChange(-15);
      setCostInflation(5);
      setDemandSurge(10);
      setDeliveryDelayDays(15);
    } else if (type === 'cost_surge') {
      setFundingChange(0);
      setCostInflation(15);
      setDemandSurge(20);
      setDeliveryDelayDays(30);
    } else if (type === 'demand_spike') {
      setFundingChange(5);
      setCostInflation(10);
      setDemandSurge(35);
      setDeliveryDelayDays(20);
    } else if (type === 'reset') {
      setFundingChange(0);
      setCostInflation(0);
      setDemandSurge(0);
      setDeliveryDelayDays(0);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
            <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'ar' ? 'محاكي السيناريوهات الاستراتيجية (What-If Simulation)' : 'Strategic What-If Scenario Simulator'}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full border border-amber-500/30">
                {lang === 'ar' ? 'نمذجة تنبؤية' : 'Predictive Modeling'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {lang === 'ar'
                ? 'اختبار تأثير المتغيرات الاقتصادية والمالية والميدانية على الاستدامة والأثر الإنساني بضغطة زر'
                : 'Simulate financial, inflation, demand, and delay shocks on organizational sustainability in real time'}
            </p>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handlePreset('funding_cut')}
            className="px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg hover:bg-rose-100 transition cursor-pointer"
          >
            {lang === 'ar' ? 'انخفاض التمويل 15%' : '-15% Funding Cut'}
          </button>
          <button
            onClick={() => handlePreset('cost_surge')}
            className="px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-lg hover:bg-amber-100 transition cursor-pointer"
          >
            {lang === 'ar' ? 'تضخم التكاليف 15%' : '+15% Cost Inflation'}
          </button>
          <button
            onClick={() => handlePreset('demand_spike')}
            className="px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 rounded-lg hover:bg-blue-100 transition cursor-pointer"
          >
            {lang === 'ar' ? 'ارتفاع الاحتياج 35%' : '+35% Demand Surge'}
          </button>
          <button
            onClick={() => handlePreset('reset')}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white bg-slate-100 dark:bg-zinc-900 rounded-lg transition cursor-pointer"
            title={lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: Interactive Controls & Real-Time Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800">
          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'ar' ? 'مدخلات المحاكاة التشغيلية' : 'Simulation Input Controls'}</span>
          </h4>

          {/* Slider 1: Funding Change */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-zinc-300">
                {lang === 'ar' ? 'تغير إجمالي التمويل المتاح:' : 'Funding Level Shift:'}
              </span>
              <span className={fundingChange < 0 ? 'text-rose-600 font-extrabold' : fundingChange > 0 ? 'text-emerald-600 font-extrabold' : 'text-slate-500'}>
                {fundingChange > 0 ? `+${fundingChange}%` : `${fundingChange}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={fundingChange}
              onChange={(e) => setFundingChange(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Slider 2: Cost Inflation */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-zinc-300">
                {lang === 'ar' ? 'تضخم تكاليف المواد والموجيستيات:' : 'Cost & Material Inflation:'}
              </span>
              <span className={costInflation > 0 ? 'text-amber-600 font-extrabold' : 'text-slate-500'}>
                +{costInflation}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={costInflation}
              onChange={(e) => setCostInflation(parseInt(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Slider 3: Demand Surge */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-zinc-300">
                {lang === 'ar' ? 'زيادة طلب المستفيدين في الميدان:' : 'Beneficiary Demand Surge:'}
              </span>
              <span className={demandSurge > 0 ? 'text-blue-600 font-extrabold' : 'text-slate-500'}>
                +{demandSurge}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={demandSurge}
              onChange={(e) => setDemandSurge(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Slider 4: Delivery Delay */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-zinc-300">
                {lang === 'ar' ? 'تأخير التسليم الميداني (أيام):' : 'Field Delivery Delay (Days):'}
              </span>
              <span className={deliveryDelayDays > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-500'}>
                +{deliveryDelayDays} {lang === 'ar' ? 'يوم' : 'Days'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={deliveryDelayDays}
              onChange={(e) => setDeliveryDelayDays(parseInt(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Calculated Results Column (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* Card 1: Budget Deficit/Surplus */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500">
                {lang === 'ar' ? 'الفجوة المالية المتوقعة' : 'Forecasted Budget Variance'}
              </span>
              <div className={`text-lg font-black mt-1 ${budgetGap < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {budgetGap < 0 ? `-${(Math.abs(budgetGap) / 1000000).toFixed(1)}M YER` : `+${(budgetGap / 1000000).toFixed(1)}M YER`}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                {budgetGap < 0 
                  ? (lang === 'ar' ? 'عجز مالي يتطلب تغطية من الاحتياطي أو جمع تبرعات إضافية.' : 'Financial deficit requiring contingency offset.')
                  : (lang === 'ar' ? 'وفر مالي متاح للتوسع في الأنشطة الميدانية.' : 'Budget surplus available for program expansion.')}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
              {lang === 'ar' ? `تكلفة التشغيل المعدلة: ${(simulatedCost / 1000000).toFixed(1)}M` : `Adjusted Operational Cost: ${(simulatedCost / 1000000).toFixed(1)}M`}
            </div>
          </div>

          {/* Card 2: Beneficiary Reach Gap */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500">
                {lang === 'ar' ? 'تأثير التغطية الإنسانية' : 'Beneficiary Reach Impact'}
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {simulatedBeneficiariesServed.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {simulatedBeneficiaryDemand.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                {unreachedBeneficiaries > 0 
                  ? (lang === 'ar' ? `فجوة تغطية تشمل ${unreachedBeneficiaries.toLocaleString()} مستفيد لم يتم تلبية احتياجهم.` : `Coverage gap: ${unreachedBeneficiaries.toLocaleString()} unreached cases.`)
                  : (lang === 'ar' ? 'تغطية كاملة لكافة الحالات المستهدفة.' : '100% full coverage achieved for target cases.')}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
              {lang === 'ar' ? `نسبة التغطية الميدانية: ${beneficiaryCoverageRatio.toFixed(1)}%` : `Coverage Rate: ${beneficiaryCoverageRatio.toFixed(1)}%`}
            </div>
          </div>

          {/* Card 3: Simulated Risk Level */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500">
                {lang === 'ar' ? 'مؤشر الخطورة المحاكى' : 'Simulated Risk Index'}
              </span>
              <div className={`text-lg font-black mt-1 flex items-center gap-1.5 ${
                riskScore > 60 ? 'text-rose-600 dark:text-rose-400' : riskScore > 35 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                <ShieldAlert className="w-5 h-5" />
                <span>{riskScore} / 100</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                {riskScore > 60 
                  ? (lang === 'ar' ? 'مستوى خطورة مرتفع جداً يتطلب خطة طوارئ سريعة.' : 'High risk severity requiring emergency mitigation plan.')
                  : (lang === 'ar' ? 'مستوى خطورة ضمن الحدود التشغيلية المقبولة.' : 'Risk within manageable operational parameters.')}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
              {lang === 'ar' ? `تأخير الانتهاء المجدول: +${deliveryDelayDays} يوم` : `Schedule Extension: +${deliveryDelayDays} Days`}
            </div>
          </div>

          {/* Card 4: AI Decision Recommendation */}
          <div className="bg-emerald-500/10 dark:bg-emerald-500/15 p-4 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'ar' ? 'التوصية التنفيذية للمحاكاة' : 'AI Simulation Guidance'}</span>
              </span>
              <p className="text-xs text-slate-700 dark:text-zinc-200 font-semibold mt-2 leading-relaxed">
                {budgetGap < 0 
                  ? (lang === 'ar' 
                      ? 'ينصح ببدء مفاوضات مع المانحين المحليين وإعادة ترتيب أولويات بنود الـ WBS للمشاريع غير الحجة.' 
                      : 'Recommend donor negotiations & re-prioritizing non-critical WBS items.')
                  : (lang === 'ar' 
                      ? 'الوضع المالي والميداني مستقر وقادر على استيعاب توسيع النطاق في المناطق ذات الأولوية.' 
                      : 'Financial and field readiness are optimal for planned scope expansion.')}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
