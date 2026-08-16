import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, ResponsiveContainer 
} from 'recharts';
import { WidgetFrame, ChartContainer } from '../enterprise';
import { TrendingUp, Building2, BarChart3, PieChart as PieIcon, Users, DollarSign, Wallet } from 'lucide-react';

interface DashboardChartsProps {
  lang: 'ar' | 'en';
  beneficiaryGrowthData: any[];
  budgetDistributionData: any[];
  projectBudgetData: any[];
  projects?: any[];
}

export function DashboardCharts({ 
  lang, 
  beneficiaryGrowthData, 
  budgetDistributionData,
  projectBudgetData 
}: DashboardChartsProps) {
  const [rightTab, setRightTab] = useState<'donut' | 'bars'>('donut');

  // Custom tooltips for supreme visual fidelity
  const CustomAreaTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-zinc-950/95 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs font-semibold backdrop-blur-md">
          <p className="text-slate-400 mb-1">{data.month}</p>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-emerald-400 font-bold">
              {lang === 'ar' ? 'إجمالي الحالات:' : 'Cumulative Cases:'}
            </span>
            <span className="font-black text-white">
              {data.cases.toLocaleString()}
            </span>
          </div>
          {data.added > 0 && (
            <div className="flex items-center gap-2 justify-between mt-1 text-[11px] text-slate-300">
              <span>{lang === 'ar' ? 'المضاف حديثاً:' : 'Newly Added:'}</span>
              <span className="text-amber-400">+{data.added}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-zinc-950/95 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs font-semibold backdrop-blur-md">
          <p className="font-bold mb-1" style={{ color: data.color }}>{data.name}</p>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-slate-400">{lang === 'ar' ? 'الموازنة:' : 'Budget:'}</span>
            <span className="font-black">
              {data.value.toLocaleString()} {lang === 'ar' ? 'ر.ي' : 'YER'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-zinc-950/95 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs font-semibold backdrop-blur-md">
          <p className="font-bold text-slate-200 mb-1.5">{payload[0].payload.name}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {lang === 'ar' ? 'موازنة البرنامج:' : 'Program Budget:'}
              </span>
              <span className="font-black text-white">
                {payload[0].value} {lang === 'ar' ? 'مليون' : 'M'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {lang === 'ar' ? 'مخصص المشاريع:' : 'Projects Allocation:'}
              </span>
              <span className="font-black text-white">
                {payload[1].value} {lang === 'ar' ? 'مليون' : 'M'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Sleek Tab Switcher inside Card Header Actions
  const rightTabActions = (
    <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg shrink-0">
      <button
        onClick={() => setRightTab('donut')}
        className={`px-2 py-1 text-xs font-bold rounded-md transition-all duration-200 flex items-center gap-1 ${
          rightTab === 'donut'
            ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
            : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        <PieIcon className="w-3.5 h-3.5" />
        <span>{lang === 'ar' ? 'القطاعات' : 'Sectors'}</span>
      </button>
      <button
        onClick={() => setRightTab('bars')}
        className={`px-2 py-1 text-xs font-bold rounded-md transition-all duration-200 flex items-center gap-1 ${
          rightTab === 'bars'
            ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
            : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        <span>{lang === 'ar' ? 'البرامج/المشاريع' : 'Programs/Projects'}</span>
      </button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. Beneficiary Growth Area Chart */}
      <WidgetFrame
        id="beneficiary_growth"
        title={lang === 'ar' ? 'مؤشر النمو الشهري للمستفيدين (١٢ شهراً)' : '12-Month Beneficiary Growth Trend'}
        subtitle={lang === 'ar' ? 'مقياس الأثر الاجتماعي والوصول الجغرافي الموحد للجمعية' : "Measuring the organization's active social impact & reach"}
        icon={TrendingUp}
        defaultHeight={340}
      >
        {({ width, height }) => (
          <div className="flex flex-col h-full justify-between pb-2">
            <ChartContainer height={height - 50}>
              <AreaChart data={beneficiaryGrowthData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'currentColor', fontSize: 10 }} 
                  className="text-slate-400 dark:text-zinc-500 font-bold"
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fill: 'currentColor', fontSize: 10 }} 
                  className="text-slate-400 dark:text-zinc-500 font-bold"
                  axisLine={false} 
                  tickLine={false} 
                />
                <ReTooltip content={<CustomAreaTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cases" 
                  stroke="#059669" 
                  strokeWidth={2.5} 
                  fill="url(#colorCases)" 
                  activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                />
              </AreaChart>
            </ChartContainer>
            
            {/* Legend Metric Grid */}
            <div className="px-4 grid grid-cols-3 gap-2 text-center border-t border-slate-100 dark:border-zinc-800/80 pt-3">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                  {lang === 'ar' ? 'الأداء الحالي' : 'Current Target'}
                </p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                  <Users className="w-3.5 h-3.5 inline" />
                  <span>{beneficiaryGrowthData[beneficiaryGrowthData.length - 1]?.cases.toLocaleString() || '0'}</span>
                </p>
              </div>
              <div className="border-x border-slate-100 dark:border-zinc-800/80">
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                  {lang === 'ar' ? 'متوسط الإضافة' : 'Avg Monthly Reg'}
                </p>
                <p className="text-sm font-black text-slate-800 dark:text-zinc-200 mt-0.5">
                  +{Math.round(beneficiaryGrowthData.reduce((acc, curr) => acc + (curr.added || 0), 0) / beneficiaryGrowthData.length) || '320'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                  {lang === 'ar' ? 'معدل النمو' : 'Growth Rate'}
                </p>
                <p className="text-sm font-black text-amber-600 dark:text-amber-500 mt-0.5">
                  +18.4%
                </p>
              </div>
            </div>
          </div>
        )}
      </WidgetFrame>

      {/* 2. Budget Structuring Analysis (Pie Chart & Bar Chart Tabs) */}
      <WidgetFrame
        id="budget_analysis"
        title={lang === 'ar' ? 'تحليل وهيكلة الموازنات' : 'Budget Structuring Analytics'}
        subtitle={lang === 'ar' ? 'توزيع القطاعات والبرامج والمشاريع' : 'Sectoral programs & projects allocation'}
        icon={Building2}
        defaultHeight={340}
        headerActions={rightTabActions}
      >
        {({ width, height }) => (
          <div className="flex flex-col h-full justify-between pb-2">
            
            {rightTab === 'donut' ? (
              // Tab A: Donut Chart (Sector Distribution)
              <div className="flex flex-col md:flex-row items-center justify-center h-full gap-4 px-2">
                <div className="w-full md:w-1/2 flex justify-center">
                  <ChartContainer height={height - 70} className="max-w-[200px]">
                    <PieChart>
                      <Pie 
                        data={budgetDistributionData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={65} 
                        outerRadius={82} 
                        paddingAngle={6} 
                        dataKey="value" 
                        cornerRadius={5}
                      >
                        {budgetDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ReTooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ChartContainer>
                </div>

                {/* Left/Right customized Legend column */}
                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-2 text-xs">
                  {budgetDistributionData.slice(0, 4).map((entry, idx) => {
                    const totalBudget = budgetDistributionData.reduce((sum, item) => sum + item.value, 0);
                    const percentage = totalBudget > 0 ? ((entry.value / totalBudget) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={idx} className="flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40 rounded-lg transition-all">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                          <span className="text-slate-700 dark:text-zinc-300 font-bold truncate max-w-[120px]">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-right shrink-0">
                          <span className="text-slate-400 dark:text-zinc-500 font-bold text-[10px]">({percentage}%)</span>
                          <span className="text-slate-800 dark:text-zinc-200 font-black">
                            {Math.round(entry.value / 1000000)}M
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Tab B: Bar Chart (Program vs Project Budgets)
              <div className="flex flex-col h-full justify-between px-2">
                <ChartContainer height={height - 80}>
                  <BarChart data={projectBudgetData} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'currentColor', fontSize: 9 }} 
                      className="text-slate-400 dark:text-zinc-500 font-bold"
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: 'currentColor', fontSize: 9 }} 
                      className="text-slate-400 dark:text-zinc-500 font-bold"
                      axisLine={false} 
                      tickLine={false}
                      unit="M"
                    />
                    <ReTooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="programBudget" fill="#059669" radius={[4, 4, 0, 0]} barSize={12} name={lang === 'ar' ? 'ميزانية البرنامج' : 'Program Budget'} />
                    <Bar dataKey="projectsBudget" fill="#d97706" radius={[4, 4, 0, 0]} barSize={12} name={lang === 'ar' ? 'مخصص المشاريع' : 'Projects Budget'} />
                  </BarChart>
                </ChartContainer>

                {/* Custom Legend details */}
                <div className="flex justify-center gap-6 text-[11px] font-bold text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800/40">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span>
                    {lang === 'ar' ? 'ميزانية البرنامج (بالمليون)' : 'Program Budget (M)'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-600"></span>
                    {lang === 'ar' ? 'مخصص المشاريع (بالمليون)' : 'Projects Budget (M)'}
                  </span>
                </div>
              </div>
            )}

            {/* Overall Summary Bar */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-950/40 rounded-lg flex items-center justify-between text-xs mx-4">
              <span className="text-slate-500 dark:text-zinc-400 font-bold flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {lang === 'ar' ? 'إجمالي الميزانية التشغيلية المرصودة:' : 'Total Tracked Operating Budget:'}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-black text-sm">
                {rightTab === 'donut' 
                  ? (budgetDistributionData.reduce((acc, curr) => acc + curr.value, 0) / 1000000).toFixed(0) + 'M YER'
                  : (projectBudgetData.reduce((acc, curr) => acc + curr.programBudget, 0)).toFixed(0) + 'M YER'
                }
              </span>
            </div>
          </div>
        )}
      </WidgetFrame>
    </div>
  );
}
