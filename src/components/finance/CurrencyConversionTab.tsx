import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  ArrowRightLeft, 
  TrendingUp, 
  Sliders, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  Calculator,
  ShieldAlert,
  Coins,
  ChevronRight,
  Info,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { Currency } from '../../types';

interface ExchangeRateRecord {
  id: string;
  from_currency_id: string;
  to_currency_id: string;
  rate: string | number;
  effective_date: string;
}

interface SponsorshipRecord {
  id: string;
  sponsor_name: string;
  sponsor_name_ar: string;
  monthly_amount: string | number;
  total_amount: string | number;
  paid_amount: string | number;
  remaining_amount: string | number;
  currency_code: string;
  payment_status: string;
}

interface CurrencyConversionTabProps {
  currencies: Currency[];
  lang: 'ar' | 'en';
  onRefreshCurrencies: () => void;
}

export default function CurrencyConversionTab({ currencies, lang, onRefreshCurrencies }: CurrencyConversionTabProps) {
  // Live API State
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [fetchingLive, setFetchingLive] = useState(false);

  // DB Rates State
  const [dbRates, setDbRates] = useState<ExchangeRateRecord[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // Orphan Sponsorships State
  const [sponsorships, setSponsorships] = useState<SponsorshipRecord[]>([]);
  const [loadingSponsorships, setLoadingSponsorships] = useState(false);

  // Form / Action States
  const [updatingRate, setUpdatingRate] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculator State
  const [calcAmount, setCalcAmount] = useState<string>('100');
  const [calcFrom, setCalcFrom] = useState<string>('USD');
  const [calcTo, setCalcTo] = useState<string>('YER');
  const [calcResult, setCalcResult] = useState<number | null>(null);
  const [yemeniRateType, setYemeniRateType] = useState<'sanaa' | 'aden' | 'global'>('sanaa');

  // Manual rate updates state
  const [usdToYerManual, setUsdToYerManual] = useState<string>('530');
  const [sarToYerManual, setSarToYerManual] = useState<string>('140');
  const [usdToSarManual, setUsdToSarManual] = useState<string>('3.75');

  // Fetch Live Rates
  const fetchLiveRates = async () => {
    setFetchingLive(true);
    try {
      const res = await fetch('/api/exchange-rates/live');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          setLiveRates(data.rates);
          if (data.time_last_update_utc) {
            setLastUpdated(new Date(data.time_last_update_utc).toLocaleString(lang === 'ar' ? 'ar-YE' : 'en-US'));
          } else {
            setLastUpdated(new Date().toLocaleString());
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch live rates:', err);
    } finally {
      setFetchingLive(false);
    }
  };

  // Fetch DB Rates
  const fetchDbRates = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch('/api/tables/exchange_rates');
      if (res.ok) {
        const data = await res.json();
        setDbRates(data || []);
        
        // Find existing rates and set input states
        const usdCurrency = currencies.find(c => c.code === 'USD');
        const yerCurrency = currencies.find(c => c.code === 'YER');
        const sarCurrency = currencies.find(c => c.code === 'SAR');

        if (usdCurrency && yerCurrency) {
          const usdToYer = data.find((r: any) => r.from_currency_id === usdCurrency.id && r.to_currency_id === yerCurrency.id);
          if (usdToYer) setUsdToYerManual(String(usdToYer.rate));
        }
        if (sarCurrency && yerCurrency) {
          const sarToYer = data.find((r: any) => r.from_currency_id === sarCurrency.id && r.to_currency_id === yerCurrency.id);
          if (sarToYer) setSarToYerManual(String(sarToYer.rate));
        }
        if (usdCurrency && sarCurrency) {
          const usdToSar = data.find((r: any) => r.from_currency_id === usdCurrency.id && r.to_currency_id === sarCurrency.id);
          if (usdToSar) setUsdToSarManual(String(usdToSar.rate));
        }
      }
    } catch (err) {
      console.error('Failed to fetch db rates:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  // Fetch Sponsorships
  const fetchSponsorships = async () => {
    setLoadingSponsorships(true);
    try {
      const res = await fetch('/api/tables/sponsorships');
      if (res.ok) {
        const data = await res.json();
        setSponsorships(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch sponsorships:', err);
    } finally {
      setLoadingSponsorships(false);
    }
  };

  useEffect(() => {
    fetchLiveRates();
    fetchDbRates();
    fetchSponsorships();
  }, [currencies]);

  // Handle calculator triggers
  useEffect(() => {
    const amt = parseFloat(calcAmount || '0');
    if (isNaN(amt) || amt <= 0) {
      setCalcResult(null);
      return;
    }

    if (calcFrom === calcTo) {
      setCalcResult(amt);
      return;
    }

    // Determine custom rates to use
    let rateUSDToYER = parseFloat(usdToYerManual || '530');
    if (yemeniRateType === 'aden') {
      rateUSDToYER = 1850; // Aden parallel market rate
    } else if (yemeniRateType === 'global') {
      rateUSDToYER = liveRates['YER'] || 250.25;
    }

    let rateSARToYER = parseFloat(sarToYerManual || '140');
    if (yemeniRateType === 'aden') {
      rateSARToYER = 485;
    } else if (yemeniRateType === 'global') {
      // Calculate SAR to YER via global USD rates
      const liveYer = liveRates['YER'] || 250.25;
      const liveSar = liveRates['SAR'] || 3.75;
      rateSARToYER = liveYer / liveSar;
    }

    const rateUSDToSAR = parseFloat(usdToSarManual || '3.75');

    // Convert to USD first (base currency of calculations)
    let usdAmount = amt;
    if (calcFrom === 'YER') {
      usdAmount = amt / rateUSDToYER;
    } else if (calcFrom === 'SAR') {
      usdAmount = amt / rateUSDToSAR;
    }

    // Convert from USD to Target Currency
    let finalResult = usdAmount;
    if (calcTo === 'YER') {
      finalResult = usdAmount * rateUSDToYER;
    } else if (calcTo === 'SAR') {
      finalResult = usdAmount * rateUSDToSAR;
    }

    setCalcResult(finalResult);
  }, [calcAmount, calcFrom, calcTo, yemeniRateType, liveRates, usdToYerManual, sarToYerManual, usdToSarManual]);

  // Update Exchange Rates in DB
  const handleUpdateExchangeRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingRate(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const usdCurrency = currencies.find(c => c.code === 'USD');
      const yerCurrency = currencies.find(c => c.code === 'YER');
      const sarCurrency = currencies.find(c => c.code === 'SAR');

      if (!usdCurrency || !yerCurrency || !sarCurrency) {
        throw new Error(lang === 'ar' ? 'لم يتم العثور على العملات اللازمة في قاعدة البيانات.' : 'Required currencies not found in the database.');
      }

      // Check and update USD -> YER
      const usdToYerRecord = dbRates.find(r => r.from_currency_id === usdCurrency.id && r.to_currency_id === yerCurrency.id);
      if (usdToYerRecord) {
        await fetch(`/api/tables/exchange_rates/${usdToYerRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rate: parseFloat(usdToYerManual), effective_date: new Date().toISOString().substring(0, 10) })
        });
      } else {
        await fetch('/api/tables/exchange_rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: '00000000-0000-0000-0000-000000000001',
            from_currency_id: usdCurrency.id,
            to_currency_id: yerCurrency.id,
            rate: parseFloat(usdToYerManual),
            effective_date: new Date().toISOString().substring(0, 10),
            security_level: 3
          })
        });
      }

      // Check and update SAR -> YER
      const sarToYerRecord = dbRates.find(r => r.from_currency_id === sarCurrency.id && r.to_currency_id === yerCurrency.id);
      if (sarToYerRecord) {
        await fetch(`/api/tables/exchange_rates/${sarToYerRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rate: parseFloat(sarToYerManual), effective_date: new Date().toISOString().substring(0, 10) })
        });
      } else {
        await fetch('/api/tables/exchange_rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: '00000000-0000-0000-0000-000000000001',
            from_currency_id: sarCurrency.id,
            to_currency_id: yerCurrency.id,
            rate: parseFloat(sarToYerManual),
            effective_date: new Date().toISOString().substring(0, 10),
            security_level: 3
          })
        });
      }

      // Check and update USD -> SAR
      const usdToSarRecord = dbRates.find(r => r.from_currency_id === usdCurrency.id && r.to_currency_id === sarCurrency.id);
      if (usdToSarRecord) {
        await fetch(`/api/tables/exchange_rates/${usdToSarRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rate: parseFloat(usdToSarManual), effective_date: new Date().toISOString().substring(0, 10) })
        });
      } else {
        await fetch('/api/tables/exchange_rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: '00000000-0000-0000-0000-000000000001',
            from_currency_id: usdCurrency.id,
            to_currency_id: sarCurrency.id,
            rate: parseFloat(usdToSarManual),
            effective_date: new Date().toISOString().substring(0, 10),
            security_level: 3
          })
        });
      }

      setSuccessMsg(lang === 'ar' ? 'تم تحديث أسعار الصرف الرسمية كفالات الأيتام بنجاح.' : 'Sponsorship associated exchange rates updated successfully.');
      fetchDbRates();
      onRefreshCurrencies();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving rates.');
    } finally {
      setUpdatingRate(false);
    }
  };

  // Helper mapping currency IDs to codes
  const getCurrencyCodeById = (id: string) => {
    const cur = currencies.find(c => c.id === id);
    return cur ? cur.code : '';
  };

  const getCurrencyNameById = (id: string) => {
    const cur = currencies.find(c => c.id === id);
    if (!cur) return '';
    return lang === 'ar' ? cur.name_ar : cur.name_en;
  };

  // Calculate stats for orphan sponsorships
  const activeSponsorships = sponsorships.filter(s => s.payment_status !== 'paid');
  const usdRateNow = parseFloat(usdToYerManual || '530');
  const sarRateNow = parseFloat(sarToYerManual || '140');

  // Total sum of pending sponsorships by currency
  const sponsorshipSums = activeSponsorships.reduce((sums, s) => {
    const code = s.currency_code || 'YER';
    const amt = parseFloat(String(s.monthly_amount || 0));
    sums[code] = (sums[code] || 0) + amt;
    return sums;
  }, {} as Record<string, number>);

  const totalUSDMonthly = sponsorshipSums['USD'] || 0;
  const totalSARMonthly = sponsorshipSums['SAR'] || 0;
  const totalYERMonthly = sponsorshipSums['YER'] || 0;

  // Total in YER under manual locked rates
  const totalInYERManual = (totalUSDMonthly * usdRateNow) + (totalSARMonthly * sarRateNow) + totalYERMonthly;

  // Total in YER under live global rates (approx)
  const liveUsdRate = liveRates['YER'] || 250.25;
  const liveSarRate = liveRates['YER'] && liveRates['SAR'] ? (liveRates['YER'] / liveRates['SAR']) : 66.7;
  const totalInYERLive = (totalUSDMonthly * liveUsdRate) + (totalSARMonthly * liveSarRate) + totalYERMonthly;

  // Total in YER under Aden parallel rates (approx 1850 USD, 485 SAR)
  const totalInYERAden = (totalUSDMonthly * 1850) + (totalSARMonthly * 485) + totalYERMonthly;

  return (
    <div className="space-y-6">
      {/* Alert Banner / Custom Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 font-semibold text-xs shadow-sm animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 font-semibold text-xs shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Layout: Live Rates & Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Live Global Exchange Rates Indicator */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'أسعار الصرف العالمية المباشرة' : 'Live Global Exchange Rates'}</span>
            </h3>
            <button 
              onClick={fetchLiveRates}
              disabled={fetchingLive}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingLive ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-slate-500 font-bold">
              {lang === 'ar' 
                ? 'مستمدة مباشرة من خوادم أسعار الصرف العالمية (Base Currency: USD)' 
                : 'Queried in real-time from financial exchange engines (Base: USD)'}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-900 flex justify-between items-center">
                <span className="text-slate-500 font-extrabold">USD / YER</span>
                <span className="font-mono text-slate-900 dark:text-white font-black">{liveRates['YER'] ? liveRates['YER'].toFixed(2) : '530.00'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-900 flex justify-between items-center">
                <span className="text-slate-500 font-extrabold">USD / SAR</span>
                <span className="font-mono text-slate-900 dark:text-white font-black">{liveRates['SAR'] ? liveRates['SAR'].toFixed(2) : '3.75'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-900 flex justify-between items-center">
                <span className="text-slate-500 font-extrabold">USD / AED</span>
                <span className="font-mono text-slate-900 dark:text-white font-black">{liveRates['AED'] ? liveRates['AED'].toFixed(2) : '3.67'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-900 flex justify-between items-center">
                <span className="text-slate-500 font-extrabold">USD / EUR</span>
                <span className="font-mono text-slate-900 dark:text-white font-black">{liveRates['EUR'] ? liveRates['EUR'].toFixed(2) : '0.92'}</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-3 rounded-lg space-y-1.5 text-[10px] text-amber-800 dark:text-amber-300 font-medium">
              <p className="font-black flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{lang === 'ar' ? 'فوارق الصرف المحلية في اليمن' : 'Yemen Dual-Rate Notice'}</span>
              </p>
              <p className="leading-relaxed text-[9px] font-bold">
                {lang === 'ar' 
                  ? 'بسبب انقسام القطاع المصرفي، تختلف أسعار الصرف بين صنعاء (~530 للـ USD) وعدن (~1850 للـ USD). الكفالات تصرف بالريال اليمني بناءً على هذه الموازنات الحساسة.' 
                  : 'Due to local split banking systems, Sanaa (~530 YER) and Aden (~1850 YER) parallel rates differ immensely. Sponsorship conversions handle this separation selectively.'}
              </p>
            </div>

            <div className="text-[10px] text-slate-400 font-semibold flex justify-between">
              <span>{lang === 'ar' ? 'آخر تحديث للشبكة:' : 'Last update:'}</span>
              <span className="font-mono">{lastUpdated || 'Offline Cached'}</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Live Currency Converter & Simulator */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'حاسبة المحاكاة والتحويل السريع' : 'Exchange Conversion Simulator'}</span>
            </h3>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">{lang === 'ar' ? 'المبلغ المراد تحويله' : 'Amount to Convert'}</label>
              <input 
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">{lang === 'ar' ? 'من عملة' : 'From Currency'}</label>
                <select 
                  value={calcFrom}
                  onChange={(e) => setCalcFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="SAR">SAR (ر.س)</option>
                  <option value="YER">YER (ر.ي)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">{lang === 'ar' ? 'إلى عملة' : 'To Currency'}</label>
                <select 
                  value={calcTo}
                  onChange={(e) => setCalcTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none"
                >
                  <option value="YER">YER (ر.ي)</option>
                  <option value="USD">USD ($)</option>
                  <option value="SAR">SAR (ر.س)</option>
                </select>
              </div>
            </div>

            {/* Yemeni Rate Type Selector */}
            {(calcFrom === 'YER' || calcTo === 'YER') && (
              <div>
                <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">{lang === 'ar' ? 'سعر الصرف المستهدف للريال' : 'Yemeni Rial Conversion Type'}</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-950 p-1 rounded-lg text-[9px] font-bold">
                  <button 
                    onClick={() => setYemeniRateType('sanaa')}
                    className={`py-1 rounded text-center transition-all ${yemeniRateType === 'sanaa' ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                  >
                    {lang === 'ar' ? 'صنعاء (530)' : 'Sanaa (530)'}
                  </button>
                  <button 
                    onClick={() => setYemeniRateType('aden')}
                    className={`py-1 rounded text-center transition-all ${yemeniRateType === 'aden' ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                  >
                    {lang === 'ar' ? 'عدن (1850)' : 'Aden (1850)'}
                  </button>
                  <button 
                    onClick={() => setYemeniRateType('global')}
                    className={`py-1 rounded text-center transition-all ${yemeniRateType === 'global' ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                  >
                    {lang === 'ar' ? 'الشبكة المباشر' : 'Live Spot'}
                  </button>
                </div>
              </div>
            )}

            {/* Live Result Output */}
            {calcResult !== null && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 p-4 rounded-xl text-center space-y-1">
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">{lang === 'ar' ? 'القيمة التقريبية المعادلة' : 'Equivalent Calculated Value'}</p>
                <p className="text-xl font-mono font-black text-slate-900 dark:text-white">
                  {calcResult.toLocaleString(undefined, { maximumFractionDigits: 2 })} {calcTo}
                </p>
                <p className="text-[9px] text-slate-400 font-bold">
                  {lang === 'ar' ? `بمعدل تحويل قدره: ${(calcResult / parseFloat(calcAmount || '1')).toFixed(4)}` : `At exchange factor: ${(calcResult / parseFloat(calcAmount || '1')).toFixed(4)}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Manual Orphan sponsorship Rate Customization Form */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'تحديث أسعار صرف الكفالات يدوياً' : 'Lock Manual Sponsorship Rates'}</span>
            </h3>
          </div>

          <form onSubmit={handleUpdateExchangeRates} className="space-y-3.5">
            <p className="text-[10px] text-slate-500 font-bold">
              {lang === 'ar' 
                ? 'قم بتعيين أسعار الصرف الثابتة التي يستخدمها النظام لحساب دفعيات الأيتام بالعملة المحلية.' 
                : 'Configure locked exchange ratios used by Nexora to calculate local currency payouts for orphans.'}
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">
                  1 USD → YER {lang === 'ar' ? '(صنعاء المعتمد)' : '(Locked Payout)'}
                </label>
                <input 
                  type="number"
                  step="0.01"
                  value={usdToYerManual}
                  onChange={(e) => setUsdToYerManual(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">
                  1 SAR → YER {lang === 'ar' ? '(ريال سعودي مقابل يمني)' : '(SAR to YER Locked)'}
                </label>
                <input 
                  type="number"
                  step="0.01"
                  value={sarToYerManual}
                  onChange={(e) => setSarToYerManual(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">
                  1 USD → SAR {lang === 'ar' ? '(دولار مقابل سعودي)' : '(USD to SAR Locked)'}
                </label>
                <input 
                  type="number"
                  step="0.01"
                  value={usdToSarManual}
                  onChange={(e) => setUsdToSarManual(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingRate}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-colors flex justify-center items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${updatingRate ? 'animate-spin' : ''}`} />
              <span>{lang === 'ar' ? 'تثبيت وحفظ أسعار الصرف' : 'Lock & Save Exchange Rates'}</span>
            </button>
          </form>
        </div>

      </div>

      {/* Section 2: Sponsorship Impact Analysis Dashboard */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-zinc-800 pb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-600" />
              <span>{lang === 'ar' ? 'لوحة كفالات الأيتام المربوطة بأسعار الصرف' : 'Orphan Sponsorship Exchange Impact Panel'}</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              {lang === 'ar' 
                ? 'تحليل المبالغ والموازنات المستحقة للأيتام بالعملة المحلية وفقاً للأسعار المثبتة حالياً لتلافي فجوات الصرف.' 
                : 'Analytical report on orphan sponsorship payout requirements in YER versus locked manual currency buffers.'}
            </p>
          </div>
          <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-full text-[10px] font-black text-emerald-700 dark:text-emerald-400">
            {activeSponsorships.length} {lang === 'ar' ? 'كفالة أيتام جارية مستهدفة' : 'Active sponsorships target'}
          </div>
        </div>

        {/* Aggregate Impact Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-zinc-950 p-4 border border-slate-100 dark:border-zinc-900 rounded-xl space-y-1.5">
            <span className="text-[10px] text-slate-400 font-black uppercase">{lang === 'ar' ? 'حجم الكفالات الشهري (USD)' : 'Monthly Volume (USD)'}</span>
            <p className="text-lg font-mono font-black text-slate-900 dark:text-white">${totalUSDMonthly.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 font-semibold">{lang === 'ar' ? 'كفالات بالدولار الأمريكي' : 'US Dollar commitments'}</p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-950 p-4 border border-slate-100 dark:border-zinc-900 rounded-xl space-y-1.5">
            <span className="text-[10px] text-slate-400 font-black uppercase">{lang === 'ar' ? 'حجم الكفالات الشهري (SAR)' : 'Monthly Volume (SAR)'}</span>
            <p className="text-lg font-mono font-black text-slate-900 dark:text-white">{totalSARMonthly.toLocaleString()} ر.س</p>
            <p className="text-[9px] text-slate-400 font-semibold">{lang === 'ar' ? 'كفالات بالريال السعودي' : 'Saudi Riyal commitments'}</p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-950 p-4 border border-slate-100 dark:border-zinc-900 rounded-xl space-y-1.5">
            <span className="text-[10px] text-slate-400 font-black uppercase">{lang === 'ar' ? 'المستحق الشهري الكلي (YER - صنعاء)' : 'Total Required (YER - Sanaa)'}</span>
            <p className="text-lg font-mono font-black text-emerald-600">{totalInYERManual.toLocaleString()} YER</p>
            <p className="text-[9px] text-slate-500 font-bold">
              {lang === 'ar' ? `على أساس الصرف المثبت (${usdToYerManual} USD / ${sarToYerManual} SAR)` : `At locked payout rate (${usdToYerManual} USD / ${sarToYerManual} SAR)`}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-950 p-4 border border-slate-100 dark:border-zinc-900 rounded-xl space-y-1.5">
            <span className="text-[10px] text-slate-400 font-black uppercase">{lang === 'ar' ? 'فرق تكلفة عدن الموازية (YER)' : 'Aden Cost Variance (YER)'}</span>
            <p className="text-lg font-mono font-black text-rose-600">{totalInYERAden.toLocaleString()} YER</p>
            <p className="text-[9px] text-rose-500 font-bold">{lang === 'ar' ? 'في حال الصرف بسعر السوق الجنوبي الموازي (~1850)' : 'If funded under Aden parallel rate market buffer (~1850)'}</p>
          </div>
        </div>

        {/* Detailed Sponsorships & Currency Map List */}
        <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse" style={{ textAlign: lang === 'en' ? 'left' : 'right' }}>
              <thead>
                <tr className="bg-zinc-900 text-amber-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                  <th className="p-3">{lang === 'ar' ? 'اسم الكفيل والجهة المانحة' : 'Sponsor'}</th>
                  <th className="p-3 w-32">{lang === 'ar' ? 'المبلغ بالعملة الأجنبية' : 'Foreign Amount'}</th>
                  <th className="p-3 w-40">{lang === 'ar' ? 'العملة الأصلية' : 'Currency'}</th>
                  <th className="p-3 w-44 text-right">{lang === 'ar' ? 'الريال الموازي (صنعاء)' : 'Sanaa Payout (YER)'}</th>
                  <th className="p-3 w-44 text-right">{lang === 'ar' ? 'الريال الموازي (عدن)' : 'Aden Payout (YER)'}</th>
                  <th className="p-3 w-32 text-center">{lang === 'ar' ? 'حالة السداد' : 'Payment Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
                {loadingSponsorships ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400 font-bold">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                      <span>{lang === 'ar' ? 'جاري تحميل قائمة الكفالات النشطة...' : 'Retrieving active sponsorships ledger...'}</span>
                    </td>
                  </tr>
                ) : activeSponsorships.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400 font-bold">
                      {lang === 'ar' ? 'لا توجد كفالات غير مدفوعة حالياً.' : 'No unpaid sponsorships active.'}
                    </td>
                  </tr>
                ) : (
                  activeSponsorships.map((sp) => {
                    const amt = parseFloat(String(sp.monthly_amount || 0));
                    const isUSD = sp.currency_code === 'USD';
                    const isSAR = sp.currency_code === 'SAR';

                    // Payout calculations
                    let payoutSanaa = amt;
                    let payoutAden = amt;

                    if (isUSD) {
                      payoutSanaa = amt * usdRateNow;
                      payoutAden = amt * 1850;
                    } else if (isSAR) {
                      payoutSanaa = amt * sarRateNow;
                      payoutAden = amt * 485;
                    }

                    return (
                      <tr key={sp.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/40 transition-all font-semibold">
                        <td className="p-3 text-slate-900 dark:text-white font-bold">{lang === 'ar' ? sp.sponsor_name_ar : sp.sponsor_name}</td>
                        <td className="p-3 font-mono text-slate-950 dark:text-white font-black">{amt.toLocaleString()}</td>
                        <td className="p-3 font-mono">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold">
                            {sp.currency_code}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {payoutSanaa.toLocaleString()} YER
                        </td>
                        <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                          {payoutAden.toLocaleString()} YER
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            sp.payment_status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {sp.payment_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Extra Policy Notice */}
        <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-4 border border-slate-100 dark:border-zinc-900 flex items-start gap-3 text-xs">
          <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-black text-slate-800 dark:text-white">{lang === 'ar' ? 'حوكمة مخرجات الصرف وتوثيق الفوارق' : 'Exchange Governance Policy Statement'}</h4>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
              {lang === 'ar' 
                ? 'تلتزم جمعية رُحماء بينهم للعمل الإنساني والتنمية بالشفافية الكاملة وتطبيق معايير العمل الإنساني السامية (CHS & Sphere Standard). كافة فوارق الصرف الناتجة عن فروقات الأسعار يدوية كانت أو عالمية يتم تسجيلها آلياً في دفتر الأستاذ العام وتوجيهها لدعم مخصصات الطوارئ للأسر الأكثر ضعفاً.' 
                : 'Rohama Charity Foundation adheres to strict CHS standards. All local exchange rate surpluses arising from differences between global spot and manual locked payouts are audited and routed to emergency orphan fund allocations.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
