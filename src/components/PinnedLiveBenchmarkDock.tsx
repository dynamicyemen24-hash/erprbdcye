import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  TrendingUp, Pin, PinOff, ChevronDown, ChevronUp, Activity, 
  Target, BarChart3, ShieldCheck, DollarSign, Users, CheckCircle2,
  Maximize2, Minimize2, RefreshCw, Zap, Gauge, Cpu
} from 'lucide-react';
import { useTelemetry } from '../core/hooks';

interface PinnedLiveBenchmarkDockProps {
  lang: 'ar' | 'en';
  totalProgramBudget?: number;
  programsCount?: number;
  projectsCount?: number;
  beneficiariesCount?: number;
  sponsorshipsCount?: number;
  onRefresh?: () => void;
}

export const PinnedLiveBenchmarkDock: React.FC<PinnedLiveBenchmarkDockProps> = ({
  lang,
  totalProgramBudget = 14500000,
  programsCount = 12,
  projectsCount = 28,
  beneficiariesCount = 18450,
  sponsorshipsCount = 1250,
  onRefresh
}) => {
  const isRtl = lang === 'ar';
  const { metrics, webVitals } = useTelemetry();
  const [isPinned, setIsPinned] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'financial' | 'impact' | 'execution'>('financial');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Grab latest recorded performance transaction latency
  const latestTrace = metrics[0];
  const performanceSLA = latestTrace ? `${latestTrace.value}ms` : '14ms';

  // Benchmark Live Trend Data
  const baseBenchmarkData = [
    { month: isRtl ? 'يناير' : 'Jan', targetBudget: 1200000, actualSpent: 1150000, beneficiariesTarget: 1500, beneficiariesActual: 1620, projectVelocity: 82 },
    { month: isRtl ? 'فبراير' : 'Feb', targetBudget: 2400000, actualSpent: 2380000, beneficiariesTarget: 3200, beneficiariesActual: 3450, projectVelocity: 86 },
    { month: isRtl ? 'مارس' : 'Mar', targetBudget: 3800000, actualSpent: 3910000, beneficiariesTarget: 5000, beneficiariesActual: 5210, projectVelocity: 89 },
    { month: isRtl ? 'أبريل' : 'Apr', targetBudget: 5200000, actualSpent: 5150000, beneficiariesTarget: 7500, beneficiariesActual: 7890, projectVelocity: 91 },
    { month: isRtl ? 'مايو' : 'May', targetBudget: 6900000, actualSpent: 6850000, beneficiariesTarget: 10200, beneficiariesActual: 10840, projectVelocity: 94 },
    { month: isRtl ? 'يونيو' : 'Jun', targetBudget: 8500000, actualSpent: 8720000, beneficiariesTarget: 12800, beneficiariesActual: 13500, projectVelocity: 93 },
    { month: isRtl ? 'يوليو' : 'Jul', targetBudget: 10200000, actualSpent: 10100000, beneficiariesTarget: 15500, beneficiariesActual: 16200, projectVelocity: 96 },
    { month: isRtl ? 'أغسطس' : 'Aug', targetBudget: 12100000, actualSpent: 11950000, beneficiariesTarget: 18000, beneficiariesActual: 18450, projectVelocity: 98 },
  ];

  // State for real-time live-tick data simulation
  const [liveBeneficiaries, setLiveBeneficiaries] = useState(beneficiariesCount);
  const [liveSpent, setLiveSpent] = useState(11950000);
  const [liveVelocity, setLiveVelocity] = useState(98);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [chartData, setChartData] = useState(baseBenchmarkData);

  // Sync with real-time database context props
  useEffect(() => {
    setLiveBeneficiaries(beneficiariesCount);
  }, [beneficiariesCount]);

  // Sync state values into the chart dataset for active August month
  useEffect(() => {
    setChartData(prev => {
      const next = [...prev];
      if (next.length > 0) {
        next[next.length - 1] = {
          ...next[next.length - 1],
          actualSpent: liveSpent,
          beneficiariesActual: liveBeneficiaries,
          projectVelocity: Math.round(liveVelocity)
        };
      }
      return next;
    });
  }, [liveSpent, liveBeneficiaries, liveVelocity]);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  if (!isPinned) {
    return (
      <div className="mb-4 flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-zinc-200">
          <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span>{isRtl ? 'لوحة المؤشرات المعيارية الرئيسية (غير متبثة)' : 'Main Live Benchmark KPI Dock (Unpinned)'}</span>
        </div>
        <button
          onClick={() => { setIsPinned(true); setIsCollapsed(false); }}
          className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Pin className="w-3.5 h-3.5" />
          <span>{isRtl ? 'تثبيت اللوحة أعلى إطار العمل' : 'Pin Dock to Top'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-12 z-25 mb-5 bg-white dark:bg-zinc-950 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
      
      {/* Dock Bar Header with Controls */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50">
        
        {/* Title & Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isRtl ? 'لوحة المؤشرات المعيارية الرئيسية' : 'Pinned Live Benchmark KPI Panel'}</span>
              </h3>
              <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded text-[9px] font-mono font-black uppercase">
                {isRtl ? 'ربط مباشر' : 'Live Sync'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">
              {isRtl 
                ? 'مراقبة فورية للأداء المالي والوصول الإنساني والامتثال' 
                : 'Real-time financial performance, humanitarian reach, and compliance monitoring'}
            </p>
          </div>
        </div>

        {/* Action & Metric Toggle Controls */}
        <div className="flex items-center gap-2">
          
          {/* Metric Selector Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-[11px]">
            <button
              onClick={() => setActiveMetric('financial')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMetric === 'financial'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <DollarSign className={`w-3.5 h-3.5 ${activeMetric === 'financial' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">{isRtl ? 'المالية' : 'Financials'}</span>
            </button>

            <button
              onClick={() => setActiveMetric('impact')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMetric === 'impact'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeMetric === 'impact' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
              <span className="hidden sm:inline">{isRtl ? 'الأثر' : 'Impact'}</span>
            </button>

            <button
              onClick={() => setActiveMetric('execution')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMetric === 'execution'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <Target className={`w-3.5 h-3.5 ${activeMetric === 'execution' ? 'text-amber-600 dark:text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isRtl ? 'الإنجاز' : 'Velocity'}</span>
            </button>
          </div>

          {/* Chart Type Toggle */}
          <button
            onClick={() => setChartType(t => t === 'area' ? 'bar' : 'area')}
            className="p-1.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer text-xs font-bold"
            title={isRtl ? 'تغيير نوع الرسم البياني' : 'Toggle Chart Style'}
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
            title={isCollapsed ? (isRtl ? 'توسيع اللوحة' : 'Expand Dock') : (isRtl ? 'طي اللوحة' : 'Collapse Dock')}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Pin/Unpin Button */}
          <button
            onClick={() => setIsPinned(false)}
            className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/30 transition-colors cursor-pointer"
            title={isRtl ? 'إلغاء التثبيت' : 'Unpin Dock'}
          >
            <PinOff className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* Dock Content Body (Collapsible) */}
      {!isCollapsed && (
        <div className="p-4 md:p-5 space-y-4 bg-slate-50/50 dark:bg-zinc-950/50">
          
          {/* Quick Metrics Cards Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase block">
                  {isRtl ? 'الميزانية المرصودة' : 'Budget Target'}
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {formatCurrency(totalProgramBudget)}
                </span>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase block">
                  {isRtl ? 'نسبة التنفيذ المالي' : 'Execution Rate'}
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {((liveSpent / 12100000) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                <TrendingUp className="w-4 h-4 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase block">
                  {isRtl ? 'إجمالي المستفيدين المباشرين' : 'Direct Beneficiaries'}
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono flex items-center gap-1">
                  <span>{liveBeneficiaries.toLocaleString()}</span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                </span>
              </div>
              <div className="p-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase block">
                  {isRtl ? 'مؤشر الامتثال والجودة' : 'Compliance Standard'}
                </span>
                <span className="text-base font-black text-purple-600 dark:text-purple-400 font-mono">
                  100% Sphere
                </span>
              </div>
              <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl shadow-2xs flex items-center justify-between col-span-2 md:col-span-1">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase block">
                  {isRtl ? 'استجابة النظام (SLA)' : 'Cloud Latency (SLA)'}
                </span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {performanceSLA}
                </span>
              </div>
              <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Gauge className="w-4 h-4" />
              </div>
            </div>

          </div>

          {/* Interactive Recharts Live Chart Canvas Container */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isLiveActive ? 'bg-red-500 animate-ping' : 'bg-zinc-400'}`}></span>
                <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>
                    {activeMetric === 'financial' && (isRtl ? 'مقارنة الإنفاق المباشر مقابل المستهدف المالي (2026)' : 'Actual Expenditure vs Budget Benchmark')}
                    {activeMetric === 'impact' && (isRtl ? 'نمو أعداد المستفيدين والوصول الميداني' : 'Beneficiary Reach & Field Growth')}
                    {activeMetric === 'execution' && (isRtl ? 'سرعة إنجاز الأنشطة البرامجية والميدانية (%)' : 'Project Execution Velocity (%)')}
                  </span>
                  {isLiveActive && (
                    <span className="text-[9px] font-black bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.2 rounded uppercase animate-pulse">
                      {isRtl ? 'بث حي' : 'Live Stream'}
                    </span>
                  )}
                </h4>
              </div>

              <div className="flex items-center gap-4">
                {/* Live stream switch */}
                <button
                  onClick={() => setIsLiveActive(!isLiveActive)}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                    isLiveActive
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 border-transparent'
                  }`}
                  title={isLiveActive ? (isRtl ? 'إيقاف البث الحي' : 'Pause Live Updates') : (isRtl ? 'تشغيل البث الحي' : 'Resume Live Updates')}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLiveActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`}></span>
                  <span>{isLiveActive ? (isRtl ? 'إيقاف البث' : 'PAUSE LIVE') : (isRtl ? 'تشغيل البث' : 'RUN LIVE')}</span>
                </button>

                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                    <span>{isRtl ? 'الفعلي' : 'Actual'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
                    <span>{isRtl ? 'المعيار' : 'Benchmark Target'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#71717a' }}
                      tickFormatter={(val) => activeMetric === 'financial' ? formatCurrency(val) : val.toLocaleString()}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#090d16', 
                        borderColor: '#27272a', 
                        borderRadius: '12px', 
                        color: '#fff',
                        fontSize: '11px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                      }} 
                    />
                    {activeMetric === 'financial' && (
                      <>
                        <Area type="monotone" dataKey="actualSpent" name={isRtl ? 'المنصرف الفعلي' : 'Actual Spent'} stroke="#059669" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
                        <Area type="monotone" dataKey="targetBudget" name={isRtl ? 'المستهدف' : 'Target Budget'} stroke="#d97706" fillOpacity={1} fill="url(#colorTarget)" strokeWidth={2} />
                      </>
                    )}
                    {activeMetric === 'impact' && (
                      <>
                        <Area type="monotone" dataKey="beneficiariesActual" name={isRtl ? 'المستفيدين الفعلي' : 'Actual Beneficiaries'} stroke="#0284c7" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
                        <Area type="monotone" dataKey="beneficiariesTarget" name={isRtl ? 'المستهدف' : 'Target Reach'} stroke="#d97706" fillOpacity={1} fill="url(#colorTarget)" strokeWidth={2} />
                      </>
                    )}
                    {activeMetric === 'execution' && (
                      <Area type="monotone" dataKey="projectVelocity" name={isRtl ? 'نسبة الإنجاز %' : 'Velocity %'} stroke="#9333ea" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2.5} />
                    )}
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#71717a' }} 
                      tickFormatter={(val) => activeMetric === 'financial' ? formatCurrency(val) : val.toLocaleString()}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#090d16', 
                        borderColor: '#27272a', 
                        borderRadius: '12px', 
                        color: '#fff',
                        fontSize: '11px' 
                      }} 
                    />
                    {activeMetric === 'financial' && (
                      <>
                        <Bar dataKey="actualSpent" name={isRtl ? 'المنصرف الفعلي' : 'Actual Spent'} fill="#059669" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="targetBudget" name={isRtl ? 'المستهدف' : 'Target Budget'} fill="#d97706" radius={[6, 6, 0, 0]} />
                      </>
                    )}
                    {activeMetric === 'impact' && (
                      <>
                        <Bar dataKey="beneficiariesActual" name={isRtl ? 'المستفيدين الفعلي' : 'Actual Beneficiaries'} fill="#0284c7" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="beneficiariesTarget" name={isRtl ? 'المستهدف' : 'Target Reach'} fill="#d97706" radius={[6, 6, 0, 0]} />
                      </>
                    )}
                    {activeMetric === 'execution' && (
                      <Bar dataKey="projectVelocity" name={isRtl ? 'نسبة الإنجاز %' : 'Velocity %'} fill="#9333ea" radius={[6, 6, 0, 0]} />
                    )}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
