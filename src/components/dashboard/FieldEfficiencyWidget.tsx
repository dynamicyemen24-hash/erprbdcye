import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, 
  Legend, ResponsiveContainer, LineChart, Line, ComposedChart
} from 'recharts';
import { WidgetFrame, ChartContainer } from '../enterprise';
import { 
  CheckCircle2, AlertCircle, TrendingUp, Calendar, MapPin, 
  Users, ClipboardCheck, ArrowUpRight, Plus, RefreshCw, Sparkles, Filter
} from 'lucide-react';

interface VisitData {
  region_ar: string;
  region_en: string;
  planned: number;
  actual: number;
  sector: 'water' | 'education' | 'healthcare' | 'relief';
}

interface FieldEfficiencyWidgetProps {
  lang: 'ar' | 'en';
}

const INITIAL_VISIT_DATA: VisitData[] = [
  { region_ar: 'إضافة', region_en: "Sana'a", planned: 45, actual: 42, sector: 'education' },
  { region_ar: 'عرض', region_en: 'Aden', planned: 30, actual: 29, sector: 'water' },
  { region_ar: 'سجل', region_en: 'Taiz', planned: 35, actual: 28, sector: 'relief' },
  { region_ar: 'الهاتف', region_en: 'Hadramout', planned: 25, actual: 24, sector: 'water' },
  { region_ar: 'الاثنين', region_en: 'Al-Hudaydah', planned: 40, actual: 38, sector: 'healthcare' },
  { region_ar: 'الكل', region_en: 'Marib', planned: 28, actual: 22, sector: 'relief' },
  
  { region_ar: 'اليوم', region_en: "Sana'a", planned: 20, actual: 18, sector: 'healthcare' },
  { region_ar: 'فتح', region_en: 'Aden', planned: 15, actual: 14, sector: 'education' },
  { region_ar: 'حرج', region_en: 'Taiz', planned: 22, actual: 20, sector: 'water' },
  { region_ar: 'الحالة', region_en: 'Hadramout', planned: 18, actual: 17, sector: 'relief' },
  { region_ar: 'تحذيرات', region_en: 'Al-Hudaydah', planned: 12, actual: 12, sector: 'education' },
  { region_ar: 'الكل', region_en: 'Marib', planned: 10, actual: 8, sector: 'water' }
];

export function FieldEfficiencyWidget({ lang }: FieldEfficiencyWidgetProps) {
  const [data, setData] = useState<VisitData[]>(INITIAL_VISIT_DATA);
  const [selectedSector, setSelectedSector] = useState<'all' | 'water' | 'education' | 'healthcare' | 'relief'>('all');
  const [viewType, setViewType] = useState<'composed' | 'trend'>('composed');
  
  // Interactive Simulator States
  const [simRegion, setSimRegion] = useState<string>("Sana'a");
  const [simSector, setSimSector] = useState<'water' | 'education' | 'healthcare' | 'relief'>('water');
  const [simType, setSimType] = useState<'planned' | 'actual'>('actual');
  const [simAmount, setSimAmount] = useState<number>(5);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Filter & aggregate data by region based on the selected sector
  const aggregatedData = useMemo(() => {
    const filtered = selectedSector === 'all' 
      ? data 
      : data.filter(item => item.sector === selectedSector);

    // Group by region
    const map = new Map<string, { region_ar: string; region_en: string; planned: number; actual: number }>();
    
    filtered.forEach(item => {
      const key = item.region_en;
      if (!map.has(key)) {
        map.set(key, {
          region_ar: item.region_ar,
          region_en: item.region_en,
          planned: 0,
          actual: 0
        });
      }
      const existing = map.get(key)!;
      existing.planned += item.planned;
      existing.actual += item.actual;
    });

    return Array.from(map.values()).map(item => {
      const efficiency = item.planned > 0 ? Math.round((item.actual / item.planned) * 100) : 0;
      return {
        ...item,
        name: lang === 'ar' ? item.region_ar : item.region_en,
        efficiency
      };
    });
  }, [data, selectedSector, lang]);

  // Aggregate global stats
  const stats = useMemo(() => {
    let totalPlanned = 0;
    let totalActual = 0;
    
    aggregatedData.forEach(d => {
      totalPlanned += d.planned;
      totalActual += d.actual;
    });

    const efficiencyRate = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
    
    // Find highest performing region
    let bestRegion = '';
    let maxEff = -1;
    aggregatedData.forEach(d => {
      if (d.efficiency > maxEff) {
        maxEff = d.efficiency;
        bestRegion = lang === 'ar' ? d.region_ar : d.region_en;
      }
    });

    return {
      totalPlanned,
      totalActual,
      efficiencyRate,
      bestRegion: bestRegion || (lang === 'ar' ? 'حفظ مخصص' : 'N/A'),
      bestEfficiency: maxEff > 0 ? `${maxEff}%` : '0%'
    };
  }, [aggregatedData, lang]);

  // Handle addition of a simulated field visit entry
  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find first matching region or append new
    const matchedRegion = INITIAL_VISIT_DATA.find(r => r.region_en === simRegion);
    const regionAr = matchedRegion ? matchedRegion.region_ar : simRegion;

    const newEntry: VisitData = {
      region_ar: regionAr,
      region_en: simRegion,
      planned: simType === 'planned' ? simAmount : 0,
      actual: simType === 'actual' ? simAmount : 0,
      sector: simSector
    };

    setData(prev => [...prev, newEntry]);
    
    // Reset/Show notification
    const alertMsg = lang === 'ar' 
      ? `تمت محاكاة تسجيل ${simAmount} زيارة ${simType === 'planned' ? '?????' : '????? ??????'} في ${regionAr} بنجاح!` 
      : `Successfully simulated ${simAmount} ${simType} visits in ${simRegion}!`;
    alert(alertMsg);
  };

  const resetSimulation = () => {
    setData(INITIAL_VISIT_DATA);
  };

  // Custom high-contrast Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const info = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-zinc-950/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs font-semibold backdrop-blur-md space-y-1.5">
          <p className="font-extrabold text-amber-400 text-sm border-b border-slate-800 pb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span>{info.name}</span>
          </p>
          <div className="flex justify-between gap-6">
            <span className="text-slate-400 font-medium">{lang === 'ar' ? 'الزيارات المخططة:' : 'Planned Visits:'}</span>
            <span className="font-black text-white">{info.planned}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-slate-400 font-medium">{lang === 'ar' ? 'الزيارات المنفذة:' : 'Actual Visits:'}</span>
            <span className="font-black text-emerald-400">{info.actual}</span>
          </div>
          <div className="flex justify-between gap-6 border-t border-slate-800/60 pt-1">
            <span className="text-slate-400 font-medium">{lang === 'ar' ? 'القسم الوظيفي:' : 'Coverage Efficiency:'}</span>
            <span className={`font-black ${info.efficiency >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {info.efficiency}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <WidgetFrame
      id="field-efficiency"
      title={lang === 'ar' ? 'مؤشر الكفاءة الميدانية وزيارات الاستجابة' : 'Field Coverage & Visit Efficiency'}
      subtitle={lang === 'ar' ? 'تحليل مقارن لمعدلات تخطيط وتنفيذ النزولات الميدانية لفرق الاستجابة' : 'Comparative audit of planned vs. actual operations across targeted areas'}
      icon={ClipboardCheck}
      defaultHeight={440}
      headerActions={
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg flex shrink-0 border border-slate-200/50 dark:border-zinc-700/50">
            <button
              onClick={() => setViewType('composed')}
              className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                viewType === 'composed'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
              }`}
            >
              {lang === 'ar' ? 'المشاريع التنفيذية' : 'Planned vs Actual'}
            </button>
            <button
              onClick={() => setViewType('trend')}
              className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                viewType === 'trend'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
              }`}
            >
              {lang === 'ar' ? 'جميع الأقسام' : 'Efficiency %'}
            </button>
          </div>

          {/* Sector Selector */}
          <div className="relative shrink-0">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as any)}
              className="text-[10px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg py-1 px-2.5 font-bold text-slate-700 dark:text-zinc-300 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{lang === 'ar' ? 'حالة الانحراف' : 'All Sectors'}</option>
              <option value="water">{lang === 'ar' ? 'العملة الأساسية' : 'WASH Sector'}</option>
              <option value="education">{lang === 'ar' ? 'إعدادات وتخصيص الودجات' : 'Education & Orphans'}</option>
              <option value="healthcare">{lang === 'ar' ? 'الرعاية الصحية والمستشفيات' : 'Healthcare'}</option>
              <option value="relief">{lang === 'ar' ? 'الإغاثة العاجلة والتمكين' : 'Emergency Relief'}</option>
            </select>
          </div>
        </div>
      }
    >
      {({ width, height }) => (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-full pb-3">
          
          {/* Main Chart Column (Span 3 on desktop) */}
          <div className="lg:col-span-3 flex flex-col justify-between h-full">
            
            {/* Upper Mini Stats Strip */}
            <div className="grid grid-cols-3 gap-2.5 mb-2 shrink-0">
              <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-800 p-2 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-bold">
                    {lang === 'ar' ? 'النزولات المخططة' : 'Planned Visits'}
                  </span>
                  <span className="text-sm font-black text-slate-800 dark:text-zinc-200">
                    {stats.totalPlanned}
                  </span>
                </div>
                <div className="p-1.5 bg-slate-100 dark:bg-zinc-800/80 rounded-lg text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-800 p-2 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-bold">
                    {lang === 'ar' ? 'النزولات المنفذة' : 'Actual Conducted'}
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {stats.totalActual}
                  </span>
                </div>
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-800 p-2 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-bold">
                    {lang === 'ar' ? 'حالة العمل الحالية' : 'Efficiency Rate'}
                  </span>
                  <span className={`text-sm font-black ${stats.efficiencyRate >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                    {stats.efficiencyRate}%
                  </span>
                </div>
                <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-600 dark:text-amber-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                {viewType === 'composed' ? (
                  <ComposedChart data={aggregatedData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 'bold' }} 
                      className="text-slate-400 dark:text-zinc-500"
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fill: 'currentColor', fontSize: 10 }} 
                      className="text-slate-400 dark:text-zinc-500"
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <ReTooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={32}
                      content={({ payload }) => (
                        <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-500 mb-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
                            {lang === 'ar' ? 'مخطط له' : 'Planned'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {lang === 'ar' ? 'تم تنفيذه فعلياً' : 'Conducted (Actual)'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-0.5 bg-amber-500 inline-block"></span>
                            {lang === 'ar' ? 'معدل الكفاءة %' : 'Efficiency Rate %'}
                          </span>
                        </div>
                      )}
                    />
                    
                    {/* Planned Visits */}
                    <Bar dataKey="planned" fill="currentColor" radius={[4, 4, 0, 0]} maxBarSize={32} className="text-slate-200 dark:text-zinc-800" />
                    
                    {/* Actual Conducted Visits */}
                    <Bar dataKey="actual" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    
                    {/* Efficiency Line Overlay */}
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#d97706" 
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1.5, fill: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                ) : (
                  <LineChart data={aggregatedData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 'bold' }} 
                      className="text-slate-400 dark:text-zinc-500"
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: 'currentColor', fontSize: 10 }} 
                      className="text-slate-400 dark:text-zinc-500"
                      axisLine={false} 
                      tickLine={false} 
                      domain={[0, 110]}
                    />
                    <ReTooltip content={<CustomTooltip />} />
                    
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#059669" 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Productivity Insights Panel & Sim (Span 1 on desktop) */}
          <div className="bg-slate-50 dark:bg-zinc-900/20 border border-slate-200/50 dark:border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between gap-3 h-full overflow-y-auto custom-scrollbar">
            
            {/* Top Insight Box */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                  {lang === 'ar' ? 'تشخيصات الكفاءة الميدانية' : 'Efficiency Diagnostics'}
                </h4>
              </div>
              
              <div className="space-y-2">
                <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg">
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block">
                    {lang === 'ar' ? 'المنطقة الأعلى كفاءة تغطية' : 'Highest Coverage Region'}
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                      <span>{stats.bestRegion}</span>
                    </span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                      {stats.bestEfficiency}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg">
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block">
                    {lang === 'ar' ? 'حالة التعبئة والإنتاجية' : 'Productivity Index Status'}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {stats.efficiencyRate >= 90 
                      ? (lang === 'ar' ? '🛡️ الإنتاجية في النطاق المستهدف الممتاز' : '🛡️ Performance within optimal green range')
                      : (lang === 'ar' ? '⚠️ يُوصى بإعادة تخصيص مخصصات التنقل' : '⚠️ Vehicle budget adjustments recommended')
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive visit logger / simulator */}
            <div className="border-t border-slate-200/50 dark:border-zinc-800/85 pt-3 mt-1 space-y-2.5">
              <button
                type="button"
                onClick={() => setShowSimulator(!showSimulator)}
                className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {showSimulator 
                    ? (lang === 'ar' ? 'إخفاء محاكي الإدخال' : 'Hide Field Simulator') 
                    : (lang === 'ar' ? 'محاكاة تسجيل زيارة ميدانية' : 'Simulate Visit Record')
                  }
                </span>
              </button>

              {showSimulator && (
                <form onSubmit={handleSimulateSubmit} className="space-y-2 bg-white dark:bg-zinc-900 p-2.5 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl animate-in slide-in-from-bottom duration-200">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block">
                      {lang === 'ar' ? 'المنطقة الجغرافية' : 'Target Region'}
                    </label>
                    <select
                      value={simRegion}
                      onChange={(e) => setSimRegion(e.target.value)}
                      className="w-full text-[10px] bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded px-1.5 py-1 text-slate-700 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
                    >
                      <option value="Sana'a">{lang === 'ar' ? 'طباعة' : "Sana'a"}</option>
                      <option value="Aden">{lang === 'ar' ? 'نشط' : 'Aden'}</option>
                      <option value="Taiz">{lang === 'ar' ? 'حرج' : 'Taiz'}</option>
                      <option value="Hadramout">{lang === 'ar' ? 'انتقال' : 'Hadramout'}</option>
                      <option value="Al-Hudaydah">{lang === 'ar' ? 'المشروع' : 'Al-Hudaydah'}</option>
                      <option value="Marib">{lang === 'ar' ? 'أصول' : 'Marib'}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block">
                      {lang === 'ar' ? 'رقم القسيمة' : 'Record Type'}
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded">
                      <button
                        type="button"
                        onClick={() => setSimType('planned')}
                        className={`text-[9px] font-bold py-0.5 rounded text-center cursor-pointer ${
                          simType === 'planned' ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-3xs' : 'text-slate-500'
                        }`}
                      >
                        {lang === 'ar' ? 'مخطط له' : 'Planned'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimType('actual')}
                        className={`text-[9px] font-bold py-0.5 rounded text-center cursor-pointer ${
                          simType === 'actual' ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-3xs' : 'text-slate-500'
                        }`}
                      >
                        {lang === 'ar' ? 'مادة إغاثية' : 'Actual'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 block">
                        {lang === 'ar' ? 'متوسطة' : 'Sector'}
                      </label>
                      <select
                        value={simSector}
                        onChange={(e) => setSimSector(e.target.value as any)}
                        className="w-full text-[10px] bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded px-1.5 py-1 text-slate-700 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
                      >
                        <option value="water">{lang === 'ar' ? 'الهاتف' : 'WASH'}</option>
                        <option value="education">{lang === 'ar' ? 'الاثنين' : 'Edu'}</option>
                        <option value="healthcare">{lang === 'ar' ? 'السبت' : 'Health'}</option>
                        <option value="relief">{lang === 'ar' ? 'التصنيف' : 'Relief'}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 block">
                        {lang === 'ar' ? 'متوسط' : 'Count'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={simAmount}
                        onChange={(e) => setSimAmount(parseInt(e.target.value) || 1)}
                        className="w-full text-[10px] bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded px-1.5 py-1 text-slate-700 dark:text-zinc-300 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex gap-1 pt-1.5">
                    <button
                      type="submit"
                      className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'متوسط الإضافة' : 'Add Entry'}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={resetSimulation}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-900/20 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title={lang === 'ar' ? 'المندوب الميداني المسؤول' : 'Reset simulated entries'}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </WidgetFrame>
  );
}
