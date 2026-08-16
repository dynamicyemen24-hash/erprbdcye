import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Moon, 
  Clock, 
  MapPin, 
  Settings, 
  Check, 
  HelpCircle, 
  Navigation, 
  Compass, 
  Sliders, 
  Info,
  ChevronDown
} from 'lucide-react';

// Simplified high-precision offline solar calculator
export interface SunTimes {
  sunriseStr: string;
  sunsetStr: string;
  isNight: boolean;
}

export function calculateSunTimes(lat: number, lng: number, timezoneOffsetHours: number = 3): SunTimes {
  const now = new Date();
  
  // Day of the year (N)
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const N = Math.floor(diff / oneDay) + 1;

  const latRad = (lat * Math.PI) / 180;

  // Declination
  const declination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (N - 80) * (Math.PI / 180));
  const decRad = (declination * Math.PI) / 180;

  // Zenith angle of 90.833 degrees
  const cosZenith = Math.cos((90.833 * Math.PI) / 180);

  // Cosine of hour angle
  const cosH = (cosZenith - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));

  let halfDayHours = 6; // default fallback
  if (cosH >= -1 && cosH <= 1) {
    const H = Math.acos(cosH);
    halfDayHours = (H * 180) / (Math.PI * 15);
  } else if (cosH < -1) {
    // Polar day
    halfDayHours = 12;
  } else {
    // Polar night
    halfDayHours = 0;
  }

  // Equation of time
  const B = (360 / 365) * (N - 81) * (Math.PI / 180);
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // in minutes

  // Longitude timezone correction
  const tzMeridian = timezoneOffsetHours * 15;
  const longitudeCorrectionMinutes = 4 * (lng - tzMeridian);

  const solarNoonDec = 12 - eot / 60 - longitudeCorrectionMinutes / 60;

  const sunriseDec = solarNoonDec - halfDayHours;
  const sunsetDec = solarNoonDec + halfDayHours;

  const formatDecHour = (dec: number): string => {
    let h = Math.floor(dec);
    let m = Math.round((dec - h) * 60);
    if (m >= 60) {
      h += 1;
      m -= 60;
    }
    if (h < 0) h += 24;
    if (h >= 24) h -= 24;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const sunriseStr = formatDecHour(sunriseDec);
  const sunsetStr = formatDecHour(sunsetDec);

  // Check if current time is night
  const currentHourDec = now.getHours() + now.getMinutes() / 60;
  let isNight = false;
  if (sunriseDec < sunsetDec) {
    isNight = currentHourDec < sunriseDec || currentHourDec > sunsetDec;
  } else {
    isNight = currentHourDec > sunsetDec && currentHourDec < sunriseDec;
  }

  return { sunriseStr, sunsetStr, isNight };
}

// Predefined Yemeni cities for fallback / geo presets
const CITIES_PRESETS = [
  { id: 'sanaa', name_ar: 'صنعاء', name_en: "Sana'a", lat: 15.3694, lng: 44.1910 },
  { id: 'aden', name_ar: 'عدن', name_en: 'Aden', lat: 12.7855, lng: 45.0186 },
  { id: 'taiz', name_ar: 'تعز', name_en: 'Taiz', lat: 13.5790, lng: 44.0207 },
  { id: 'mukalla', name_ar: 'المكلا', name_en: 'Mukalla', lat: 14.5422, lng: 49.1242 }
];

interface AutoDarkModeManagerProps {
  lang: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
}

export default function AutoDarkModeManager({ 
  lang, 
  theme, 
  setTheme 
}: AutoDarkModeManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Theme Preference: 'manual' (forces theme based on the manual button) or 'auto' (automatically switches based on logic)
  const [prefMode, setPrefMode] = useState<'manual' | 'auto'>(() => {
    return (localStorage.getItem('rbd_theme_pref_mode') as 'manual' | 'auto') || 'manual';
  });

  // Auto Criteria: 'time' (fixed hours) or 'geo' (astronomical solar calculations)
  const [autoCriteria, setAutoCriteria] = useState<'time' | 'geo'>(() => {
    return (localStorage.getItem('rbd_theme_auto_criteria') as 'time' | 'geo') || 'time';
  });

  // Fixed Time Range: start (night begin) and end (night end)
  const [timeStart, setTimeStart] = useState(() => localStorage.getItem('rbd_theme_time_start') || '18:00');
  const [timeEnd, setTimeEnd] = useState(() => localStorage.getItem('rbd_theme_time_end') || '06:00');

  // Selected city preset
  const [selectedCityId, setSelectedCityId] = useState(() => localStorage.getItem('rbd_theme_city_id') || 'sanaa');

  // Custom GPS coordinates
  const [customLat, setCustomLat] = useState<number>(() => parseFloat(localStorage.getItem('rbd_theme_lat') || '15.3694'));
  const [customLng, setCustomLng] = useState<number>(() => parseFloat(localStorage.getItem('rbd_theme_lng') || '44.1910'));

  // GPS tracking state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Computed sunrise/sunset times
  const [solarData, setSolarData] = useState<SunTimes | null>(null);

  // Sync Preferences to LocalStorage
  useEffect(() => {
    localStorage.setItem('rbd_theme_pref_mode', prefMode);
    localStorage.setItem('rbd_theme_auto_criteria', autoCriteria);
    localStorage.setItem('rbd_theme_time_start', timeStart);
    localStorage.setItem('rbd_theme_time_end', timeEnd);
    localStorage.setItem('rbd_theme_city_id', selectedCityId);
    localStorage.setItem('rbd_theme_lat', customLat.toString());
    localStorage.setItem('rbd_theme_lng', customLng.toString());
  }, [prefMode, autoCriteria, timeStart, timeEnd, selectedCityId, customLat, customLng]);

  // Recalculate astronomical / solar calculations when coordinates change or on interval
  useEffect(() => {
    // Determine target coordinates based on selectedCityId or GPS
    let targetLat = customLat;
    let targetLng = customLng;

    if (selectedCityId !== 'custom') {
      const city = CITIES_PRESETS.find(c => c.id === selectedCityId);
      if (city) {
        targetLat = city.lat;
        targetLng = city.lng;
      }
    }

    // Yemen is UTC+3 (AST)
    const timezoneOffset = -(new Date().getTimezoneOffset() / 60);
    const calculated = calculateSunTimes(targetLat, targetLng, timezoneOffset);
    setSolarData(calculated);
  }, [selectedCityId, customLat, customLng]);

  // Main automatic evaluation loop running every 15 seconds to switch theme if in 'auto' mode
  useEffect(() => {
    const evaluateAutoTheme = () => {
      if (prefMode !== 'auto') return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentDec = currentHour + currentMin / 60;

      if (autoCriteria === 'time') {
        // Evaluate based on fixed clock hours
        const [startH, startM] = timeStart.split(':').map(Number);
        const [endH, endM] = timeEnd.split(':').map(Number);
        const startDec = startH + startM / 60;
        const endDec = endH + endM / 60;

        let shouldBeDark = false;
        if (startDec < endDec) {
          // Night is within the same day (e.g. 01:00 to 05:00)
          shouldBeDark = currentDec >= startDec && currentDec < endDec;
        } else {
          // Night spans midnight (e.g. 18:00 to 06:00)
          shouldBeDark = currentDec >= startDec || currentDec < endDec;
        }

        setTheme(shouldBeDark ? 'dark' : 'light');
      } else {
        // Evaluate based on geological solar calculations
        if (solarData) {
          setTheme(solarData.isNight ? 'dark' : 'light');
        }
      }
    };

    // Run instantly
    evaluateAutoTheme();

    const interval = setInterval(evaluateAutoTheme, 15000);
    return () => clearInterval(interval);
  }, [prefMode, autoCriteria, timeStart, timeEnd, solarData, setTheme]);

  // Request browser geolocation
  const handleAcquireGPS = () => {
    if (!navigator.geolocation) {
      setGpsError(lang === 'ar' ? 'نظام تحديد المواقع غير مدعوم.' : 'Geolocation is not supported.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomLat(parseFloat(pos.coords.latitude.toFixed(4)));
        setCustomLng(parseFloat(pos.coords.longitude.toFixed(4)));
        setSelectedCityId('custom');
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS failure:', err);
        setGpsError(lang === 'ar' ? 'تم رفض إذن تحديد الموقع أو فشل الإرسال.' : 'Permission denied or signal timeout.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative">
      {/* Primary Trigger Toggle Indicator */}
      <div className="flex items-center gap-1.5">
        {/* Toggle preference Mode Button */}
        <button
          onClick={() => {
            const nextMode = prefMode === 'manual' ? 'auto' : 'manual';
            setPrefMode(nextMode);
          }}
          className={`px-2 py-1 text-[10px] font-extrabold rounded-md flex items-center gap-1 cursor-pointer transition-all ${
            prefMode === 'auto'
              ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-400'
              : 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          }`}
          title={lang === 'ar' ? 'تفعيل التبديل التلقائي لليل/النهار' : 'Toggle Auto Light/Dark Switcher'}
        >
          {prefMode === 'auto' ? (
            <>
              <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{lang === 'ar' ? 'تلقائي' : 'AUTO'}</span>
            </>
          ) : (
            <>
              <Sliders className="w-3 h-3" />
              <span>{lang === 'ar' ? 'يدوي' : 'MANUAL'}</span>
            </>
          )}
        </button>

        {/* Trigger Popover Settings Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-md text-slate-500 hover:text-emerald-600 transition-colors relative cursor-pointer"
          title={lang === 'ar' ? 'إعدادات الوضع الليلي الذكي' : 'Smart Dark Mode Settings'}
        >
          <Settings className={`w-3.5 h-3.5 ${prefMode === 'auto' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Popover overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 cursor-default" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-10 left-0 rtl:left-auto rtl:right-0 w-80 sm:w-96 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xl z-50 overflow-hidden font-sans text-slate-800 dark:text-zinc-200">
            
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 animate-pulse text-amber-400" />
                <h3 className="font-bold text-xs">
                  {lang === 'ar' ? 'متحكم الوضع الليلي التلقائي' : 'Auto-Dark Mode Controller'}
                </h3>
              </div>
              <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded font-black">
                NexoraOS™ Standard
              </span>
            </div>

            <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
              {/* Mode Toggle Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  {lang === 'ar' ? 'الحالة التشغيلية الحالية' : 'Current Operational State'}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-lg border border-slate-100 dark:border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <span className="p-1.5 rounded-full bg-zinc-800 text-amber-500">
                        <Moon className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-full bg-amber-50 text-amber-600">
                        <Sun className="w-4 h-4" />
                      </span>
                    )}
                    <div>
                      <h4 className="text-xs font-bold leading-tight">
                        {theme === 'dark' 
                          ? (lang === 'ar' ? 'الوضع الداكن نشط' : 'Dark Mode is Active')
                          : (lang === 'ar' ? 'الوضع المضيء نشط' : 'Light Mode is Active')
                        }
                      </h4>
                      <p className="text-[9px] text-zinc-500">
                        {prefMode === 'auto'
                          ? (lang === 'ar' ? 'يتم التحكم ديناميكياً بناءً على إعداداتك' : 'Automatically calibrated based on your logic')
                          : (lang === 'ar' ? 'مغلق (تحكم يدوي ثابت)' : 'Disabled (Standard override active)')
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-zinc-400 font-mono">
                      {new Date().toLocaleTimeString(lang === 'ar' ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Preference Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPrefMode('manual')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    prefMode === 'manual'
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'تحكم يدوي ثابت' : 'Fixed Manual'}
                </button>
                <button
                  onClick={() => setPrefMode('auto')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    prefMode === 'auto'
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'تفعيل الوضع التلقائي' : 'Enable Automatic'}
                </button>
              </div>

              {prefMode === 'auto' && (
                <div className="space-y-4 border-t border-slate-100 dark:border-zinc-800 pt-4 animate-fadeIn">
                  {/* Criteria Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                      {lang === 'ar' ? 'معيار التبديل الذكي' : 'Calibrator Logic Engine'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setAutoCriteria('time')}
                        className={`py-1.5 px-2 text-[10px] font-extrabold rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          autoCriteria === 'time'
                            ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black'
                            : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {lang === 'ar' ? 'توقيت زمني محدد' : 'Clock Schedule'}
                      </button>
                      <button
                        onClick={() => setAutoCriteria('geo')}
                        className={`py-1.5 px-2 text-[10px] font-extrabold rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          autoCriteria === 'geo'
                            ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black'
                            : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        <MapPin className="w-3 h-3" />
                        {lang === 'ar' ? 'الشروق والغروب الجغرافي' : 'Solar Geo-Position'}
                      </button>
                    </div>
                  </div>

                  {/* Option 1: Time Schedule Settings */}
                  {autoCriteria === 'time' && (
                    <div className="p-3 bg-slate-50/70 dark:bg-zinc-900/30 rounded-lg border border-slate-100 dark:border-zinc-800 space-y-3">
                      <h5 className="text-[10px] font-extrabold text-slate-600 dark:text-zinc-300 uppercase tracking-wide flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-emerald-600" />
                        {lang === 'ar' ? 'فترة تمكين المظهر الداكن' : 'Dark Mode Clock Boundaries'}
                      </h5>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 font-bold block">{lang === 'ar' ? 'البدء (مساءً)' : 'Start Hour (Night)'}</span>
                          <input
                            type="time"
                            value={timeStart}
                            onChange={(e) => setTimeStart(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs rounded p-1.5 font-mono cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 font-bold block">{lang === 'ar' ? 'الانتهاء (صباحاً)' : 'End Hour (Day)'}</span>
                          <input
                            type="time"
                            value={timeEnd}
                            onChange={(e) => setTimeEnd(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs rounded p-1.5 font-mono cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="text-[9px] text-zinc-400 leading-normal flex items-start gap-1">
                        <Info className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          {lang === 'ar'
                            ? `سيتم تفعيل الوضع الليلي تلقائياً ابتداءً من الساعة ${timeStart} وحتى الساعة ${timeEnd}.`
                            : `Dark mode overrides will occur automatically starting at ${timeStart} until ${timeEnd}.`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Option 2: Geolocation Solar Settings */}
                  {autoCriteria === 'geo' && (
                    <div className="p-3 bg-slate-50/70 dark:bg-zinc-900/30 rounded-lg border border-slate-100 dark:border-zinc-800 space-y-3">
                      <h5 className="text-[10px] font-extrabold text-slate-600 dark:text-zinc-300 uppercase tracking-wide flex items-center gap-1">
                        <Compass className="w-3 h-3 text-emerald-600" />
                        {lang === 'ar' ? 'الحسابات الفلكية الشمسية' : 'Astronomical Solar Matrix'}
                      </h5>

                      {/* Presets and custom */}
                      <div className="space-y-2">
                        <span className="text-[9px] text-zinc-500 font-bold block">{lang === 'ar' ? 'الموقع الجغرافي النشط' : 'Active Location Reference'}</span>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={selectedCityId}
                            onChange={(e) => setSelectedCityId(e.target.value)}
                            className="col-span-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs rounded p-1.5 font-sans cursor-pointer outline-none"
                          >
                            {CITIES_PRESETS.map(city => (
                              <option key={city.id} value={city.id}>
                                {lang === 'ar' ? city.name_ar : city.name_en} ({city.lat.toFixed(2)}° N, {city.lng.toFixed(2)}° E)
                              </option>
                            ))}
                            <option value="custom">
                              {lang === 'ar' ? 'تحديد إحداثيات مخصصة (GPS)' : 'Custom GPS Coordinates'}
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* GPS coordinates trigger */}
                      {selectedCityId === 'custom' && (
                        <div className="space-y-2.5 bg-white dark:bg-zinc-950 p-2.5 rounded border border-slate-200 dark:border-zinc-800 animate-fadeIn">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-zinc-500 font-black">{lang === 'ar' ? 'إحداثيات تحديد المواقع (GPS)' : 'Direct GPS Coordinates'}</span>
                            <button
                              onClick={handleAcquireGPS}
                              disabled={isLocating}
                              className="px-2 py-1 text-[9px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center gap-1"
                            >
                              <Navigation className={`w-2.5 h-2.5 ${isLocating ? 'animate-ping' : ''}`} />
                              {isLocating ? (lang === 'ar' ? 'تحديد...' : 'Locating...') : (lang === 'ar' ? 'جلب الإحداثيات' : 'Acquire GPS')}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                            <div className="bg-slate-50 dark:bg-zinc-900 p-1.5 rounded border border-slate-100 dark:border-zinc-800 text-center">
                              <span className="text-[8px] text-zinc-400 block font-sans">Lat</span>
                              {customLat}° N
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-900 p-1.5 rounded border border-slate-100 dark:border-zinc-800 text-center">
                              <span className="text-[8px] text-zinc-400 block font-sans">Lng</span>
                              {customLng}° E
                            </div>
                          </div>

                          {gpsError && (
                            <p className="text-[9px] text-red-500 font-bold leading-tight">{gpsError}</p>
                          )}
                        </div>
                      )}

                      {/* Display Computed Sunrise / Sunset times */}
                      {solarData && (
                        <div className="bg-emerald-500/5 p-2.5 rounded border border-emerald-500/10 grid grid-cols-2 gap-2 text-center">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">
                              ☀️ {lang === 'ar' ? 'شروق الشمس المقدر' : 'Computed Sunrise'}
                            </span>
                            <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300">
                              {solarData.sunriseStr}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-amber-600 dark:text-amber-500 font-bold block">
                              🌙 {lang === 'ar' ? 'غروب الشمس المقدر' : 'Computed Sunset'}
                            </span>
                            <span className="text-xs font-black font-mono text-amber-700 dark:text-amber-400">
                              {solarData.sunsetStr}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-[9px] font-bold text-zinc-400">
              <span>{lang === 'ar' ? 'مؤتمت لراحة عينيك' : 'Automated for visual comfort'}</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
