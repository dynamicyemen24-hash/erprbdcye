import React from 'react';
import { Filter, Globe, Calendar, DollarSign, ShieldAlert, Layers, RefreshCw, CheckCircle2, ChevronDown, X } from 'lucide-react';

interface GlobalFilterBarProps {
  lang: 'ar' | 'en';
  onFilterChange?: (filters: any) => void;
  activeFiltersCount?: number;
  onRefresh?: () => void;
}

export function GlobalFilterBar({ lang, onFilterChange, activeFiltersCount = 0, onRefresh }: GlobalFilterBarProps) {
  const [selectedRegion, setSelectedRegion] = React.useState<string>('all');
  const [selectedSector, setSelectedSector] = React.useState<string>('all');
  const [selectedDonor, setSelectedDonor] = React.useState<string>('all');
  const [selectedRisk, setSelectedRisk] = React.useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>('ytd');
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>('YER');
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

  const handleApply = (key: string, value: string) => {
    let newFilters = {
      region: selectedRegion,
      sector: selectedSector,
      donor: selectedDonor,
      risk: selectedRisk,
      period: selectedPeriod,
      currency: selectedCurrency,
      [key]: value
    };
    if (key === 'region') setSelectedRegion(value);
    if (key === 'sector') setSelectedSector(value);
    if (key === 'donor') setSelectedDonor(value);
    if (key === 'risk') setSelectedRisk(value);
    if (key === 'period') setSelectedPeriod(value);
    if (key === 'currency') setSelectedCurrency(value);

    if (onFilterChange) onFilterChange(newFilters);
  };

  const handleReset = () => {
    setSelectedRegion('all');
    setSelectedSector('all');
    setSelectedDonor('all');
    setSelectedRisk('all');
    setSelectedPeriod('ytd');
    setSelectedCurrency('YER');
    if (onFilterChange) onFilterChange({ region: 'all', sector: 'all', donor: 'all', risk: 'all', period: 'ytd', currency: 'YER' });
  };

  const isFiltered = selectedRegion !== 'all' || selectedSector !== 'all' || selectedDonor !== 'all' || selectedRisk !== 'all' || selectedPeriod !== 'ytd' || selectedCurrency !== 'YER';

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs p-3 transition-all">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Active Filters Title & Quick Selectors */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-black">
              {lang === 'ar' ? 'تصفية بيانات القيادة' : 'Global Filters'}
            </span>
            {isFiltered && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>

          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={(e) => handleApply('region', e.target.value)}
            className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="all">{lang === 'ar' ? 'جميع المحافظات' : 'All Regions'}</option>
            <option value="Taiz">{lang === 'ar' ? 'تعز' : 'Taiz'}</option>
            <option value="Aden">{lang === 'ar' ? 'عدن' : 'Aden'}</option>
            <option value="Marib">{lang === 'ar' ? 'مأرب' : 'Marib'}</option>
            <option value="Shabwah">{lang === 'ar' ? 'شبوة' : 'Shabwah'}</option>
            <option value="Hadhramaut">{lang === 'ar' ? 'حضرموت' : 'Hadhramaut'}</option>
          </select>

          {/* Program Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => handleApply('sector', e.target.value)}
            className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="all">{lang === 'ar' ? 'جميع القطاعات' : 'All Program Sectors'}</option>
            <option value="welfare">{lang === 'ar' ? 'الرعاية الاجتماعية' : 'Social Welfare'}</option>
            <option value="quran">{lang === 'ar' ? 'التمكين التعليمي' : 'Education & Quran'}</option>
            <option value="wash">{lang === 'ar' ? 'المياه والإصحاح' : 'WASH & Water'}</option>
            <option value="orphans">{lang === 'ar' ? 'كفالة الأيتام' : 'Orphan Care'}</option>
          </select>

          {/* Timeframe Filter */}
          <select
            value={selectedPeriod}
            onChange={(e) => handleApply('period', e.target.value)}
            className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="7d">{lang === 'ar' ? 'آخر ٧ أيام' : 'Last 7 Days'}</option>
            <option value="30d">{lang === 'ar' ? 'آخر ٣٠ يوماً' : 'Last 30 Days'}</option>
            <option value="mtd">{lang === 'ar' ? 'الشهر الحالي (MTD)' : 'Month to Date'}</option>
            <option value="qtd">{lang === 'ar' ? 'الربع الحالي (QTD)' : 'Quarter to Date'}</option>
            <option value="ytd">{lang === 'ar' ? 'السنة المالية (YTD)' : 'Year to Date'}</option>
          </select>

          {/* Currency Normalization */}
          <select
            value={selectedCurrency}
            onChange={(e) => handleApply('currency', e.target.value)}
            className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 text-xs font-extrabold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 transition cursor-pointer"
          >
            <option value="YER">YER (ريال يمني)</option>
            <option value="USD">USD ($ دولار أمريكي)</option>
            <option value="SAR">SAR (ريال سعودي)</option>
          </select>

          {isFiltered && (
            <button
              onClick={handleReset}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-extrabold flex items-center gap-1 hover:underline cursor-pointer px-2 py-1 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/40"
            >
              <X className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إلغاء الفلاتر' : 'Reset'}</span>
            </button>
          )}
        </div>

        {/* Right: Data Quality & Freshness Indicator */}
        <div className="flex items-center gap-3 shrink-0 border-t lg:border-t-0 border-slate-100 dark:border-zinc-800 pt-2 lg:pt-0 justify-between lg:justify-end">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-black">
                {lang === 'ar' ? 'جودة البيانات:' : 'Data Trust:'} 97.4%
              </span>
            </div>
            
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 px-2.5 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{lang === 'ar' ? 'تحديث مباشر (Neon DB)' : 'Live Neon DB'}</span>
            </div>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              title={lang === 'ar' ? 'تحديث فوري' : 'Refresh Data'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
