import React, { useState, useMemo } from 'react';
import {
  Globe,
  MapPin,
  Building2,
  Search,
  Plus,
  Printer,
  Download,
  Filter,
  Layers,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';
import {
  GLOBAL_COUNTRIES_DIRECTORY,
  CountryAdministrativeProfile,
  StateGovernorateDivision,
  DistrictDivision
} from '../../core/data/globalAddressData';
import { printHTML, createPrintDocument, getCustomFooterHTML } from '../../lib/printUtils';
import InteractiveGlobalMapPicker from '../../components/common/InteractiveGlobalMapPicker';

interface GlobalAddressManagerViewProps {
  lang?: 'ar' | 'en';
  onSelectAddressForForm?: (address: {
    countryCode: string;
    stateGov: string;
    district: string;
    subDistrict?: string;
  }) => void;
}

export default function GlobalAddressManagerView({
  lang = 'ar',
  onSelectAddressForForm
}: GlobalAddressManagerViewProps) {
  const isRtl = lang === 'ar';

  const [countries, setCountries] = useState<CountryAdministrativeProfile[]>(GLOBAL_COUNTRIES_DIRECTORY);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('YE');
  const [selectedStateId, setSelectedStateId] = useState<string>('ye-taiz');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Location Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'district' | 'sub_address'>('district');
  const [newArName, setNewArName] = useState('');
  const [newEnName, setNewEnName] = useState('');

  // Selected Country
  const activeCountry = useMemo(() => {
    return countries.find(c => c.iso2 === selectedCountryCode) || countries[0];
  }, [countries, selectedCountryCode]);

  // Selected State / Governorate
  const activeState = useMemo(() => {
    return activeCountry.states_governorates.find(s => s.id === selectedStateId) || activeCountry.states_governorates[0];
  }, [activeCountry, selectedStateId]);

  // Live Map State & Center
  const [showMap, setShowMap] = useState<boolean>(true);
  const mapCenter = useMemo(() => {
    if (activeState?.lat && activeState?.lng) {
      return { lat: activeState.lat, lng: activeState.lng, zoom: activeState.zoom || 11 };
    }
    return { lat: activeCountry.lat, lng: activeCountry.lng, zoom: activeCountry.default_zoom || 6 };
  }, [activeState, activeCountry]);

  // Quick stats
  const totalCountries = countries.length;
  const totalStates = useMemo(() => countries.reduce((sum, c) => sum + c.states_governorates.length, 0), [countries]);
  const totalDistricts = useMemo(
    () => countries.reduce((sum, c) => sum + c.states_governorates.reduce((dSum, s) => dSum + s.districts.length, 0), 0),
    [countries]
  );

  // Global search filtering across all countries, states, districts, and villages
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const q = searchTerm.toLowerCase();

    const results: Array<{
      countryName: string;
      countryFlag: string;
      countryCode: string;
      stateName: string;
      stateId: string;
      districtName: string;
      subAddressName?: string;
    }> = [];

    countries.forEach(c => {
      c.states_governorates.forEach(s => {
        s.districts.forEach(d => {
          const matchDistrict =
            d.name_ar.toLowerCase().includes(q) ||
            d.name_en.toLowerCase().includes(q) ||
            s.name_ar.toLowerCase().includes(q) ||
            c.name_ar.toLowerCase().includes(q);

          if (matchDistrict) {
            results.push({
              countryName: isRtl ? c.name_ar : c.name_en,
              countryFlag: c.flag_emoji,
              countryCode: c.iso2,
              stateName: isRtl ? s.name_ar : s.name_en,
              stateId: s.id,
              districtName: isRtl ? d.name_ar : d.name_en
            });
          }

          if (d.sub_addresses) {
            d.sub_addresses.forEach(sub => {
              if (sub.toLowerCase().includes(q)) {
                results.push({
                  countryName: isRtl ? c.name_ar : c.name_en,
                  countryFlag: c.flag_emoji,
                  countryCode: c.iso2,
                  stateName: isRtl ? s.name_ar : s.name_en,
                  stateId: s.id,
                  districtName: isRtl ? d.name_ar : d.name_en,
                  subAddressName: sub
                });
              }
            });
          }
        });
      });
    });

    return results.slice(0, 30);
  }, [countries, searchTerm, isRtl]);

  // Add new location handler
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArName.trim()) return;

    setCountries(prevCountries => {
      return prevCountries.map(c => {
        if (c.iso2 !== selectedCountryCode) return c;

        return {
          ...c,
          states_governorates: c.states_governorates.map(s => {
            if (s.id !== activeState?.id) return s;

            if (targetType === 'district') {
              const newDist: DistrictDivision = {
                id: `custom-dist-${Date.now()}`,
                code: `DIST-${newArName.slice(0, 3).toUpperCase()}`,
                name_ar: newArName.trim(),
                name_en: newEnName.trim() || newArName.trim(),
                sub_addresses: []
              };
              return {
                ...s,
                districts: [...s.districts, newDist]
              };
            } else {
              // Add sub address to first district
              if (s.districts.length === 0) return s;
              const firstDist = s.districts[0];
              const updatedDist: DistrictDivision = {
                ...firstDist,
                sub_addresses: [...(firstDist.sub_addresses || []), newArName.trim()]
              };
              return {
                ...s,
                districts: s.districts.map((d, i) => (i === 0 ? updatedDist : d))
              };
            }
          })
        };
      });
    });

    setNewArName('');
    setNewEnName('');
    setIsAddModalOpen(false);
  };

  // Official A4 Printout
  const handlePrintA4Directory = () => {
    const documentHTML = `
      <div style="font-family: 'Tajawal', sans-serif; direction: rtl; text-align: right; color: #0f172a; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #059669; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <img src="/UAMEX_ERPLOGO.png" style="height: 52px; object-fit: contain;" />
            <img src="/LogoRohamaab.png" style="height: 52px; object-fit: contain;" />
            <div>
              <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #059669;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">دليل التغطية الجغرافية والتقسيمات الإدارية والعناوين الدولية المعتمدة</p>
            </div>
          </div>
          <div style="text-align: left; font-size: 10px; color: #64748b;">
            <div><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-YE')}</div>
            <div><strong>نطاق الاعتماد:</strong> ISO 3166 Standard</div>
          </div>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; display: flex; justify-content: space-between;">
          <div>
            <h3 style="margin: 0; font-size: 13px; color: #166534; font-weight: 800;">${activeCountry.flag_emoji} ${activeCountry.name_ar} (${activeCountry.name_en})</h3>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #15803d;">كود الدولة: ${activeCountry.iso2} / ${activeCountry.iso3} • مفتاح الاتصال: ${activeCountry.dial_code} • العملة: ${activeCountry.currency_symbol_ar}</p>
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #166534;">
            ${activeCountry.states_governorates.length} ${activeCountry.level1_label_ar} • ${activeCountry.states_governorates.reduce((sum, s) => sum + s.districts.length, 0)} ${activeCountry.level2_label_ar}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #0f172a; color: #fbbf24;">
              <th style="border: 1px solid #334155; padding: 6px; width: 5%; text-align: center;">#</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 25%;">${activeCountry.level1_label_ar}</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 30%;">${activeCountry.level2_label_ar}</th>
              <th style="border: 1px solid #334155; padding: 6px;">الأحياء والقرى والعزل الفرعية (${activeCountry.level3_label_ar})</th>
            </tr>
          </thead>
          <tbody>
            ${activeCountry.states_governorates
              .flatMap((state, sIdx) =>
                state.districts.map((dist, dIdx) => `
                <tr style="background: ${dIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${sIdx + 1}.${dIdx + 1}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${state.name_ar} (${state.name_en})</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #059669;">${dist.name_ar}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px;">${(dist.sub_addresses || []).join(' • ') || '—'}</td>
                </tr>
              `)
              )
              .join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; font-size: 11px;">
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">مسؤول نظم المعلومات الجغرافية GIS</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">م. عبد الله الصبري</p>
          </div>
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">مدير إدارة العمليات الميدانية</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">د. خالد العماري</p>
          </div>
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">المدير التنفيذي العام</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">د. عبد الله الشامي</p>
          </div>
        </div>

        ${getCustomFooterHTML('ar')}
      </div>
    `;

    const printDoc = createPrintDocument();
    printDoc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>دليل التقسيمات الجغرافية والعناوين - ${activeCountry.name_ar}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; background: #ffffff; }
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; }
            @page { size: A4 portrait; margin: 12mm; }
          }
        </style>
      </head>
      <body style="padding: 15px;">
        ${documentHTML}
      </body>
      </html>
    `);
    printDoc.close();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Country Code', 'Country Ar', 'Country En', 'State/Gov Ar', 'State/Gov En', 'District Ar', 'District En', 'Sub Addresses'];
    const rows: string[][] = [];

    countries.forEach(c => {
      c.states_governorates.forEach(s => {
        s.districts.forEach(d => {
          rows.push([
            c.iso2,
            `"${c.name_ar}"`,
            `"${c.name_en}"`,
            `"${s.name_ar}"`,
            `"${s.name_en}"`,
            `"${d.name_ar}"`,
            `"${d.name_en}"`,
            `"${(d.sub_addresses || []).join(', ')}"`
          ]);
        });
      });
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rohamab_Global_Address_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header and Guidance */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Globe className="w-6 h-6 text-emerald-600" />
              <span>{isRtl ? 'منظومة إدارة العناوين والتقسيمات الجغرافية العالمية' : 'Global Address & Administrative Architecture OS'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isRtl
                ? 'إدارة هرمية معيارية متعددة الدول (دول ➔ محافظات/مناطق ➔ مديريات/مدن ➔ أحياء وقرى وعزل) مع ترابط مكاني فوري ومنع الازدواج الجغرافي.'
                : 'Standardized hierarchical multi-country address engine (Countries -> Governorates/States -> Districts/Cities -> Sub-addresses).'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة منطقة / قرية' : 'Add Location'}</span>
            </button>
            <button
              onClick={handlePrintA4Directory}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isRtl ? 'طباعة الدليل A4' : 'Print A4'}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isRtl ? 'بحث فوري في كافة الدول، المحافظات، المديريات، والقرى (مثلاً: صبر، المكلا، حدة، دبي، الرياض)...' : 'Search any country, state, district or village...'}
            className={`w-full py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all ${
              isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
            }`}
          />
        </div>

        {/* Global Search Results Dropdown */}
        {searchResults && (
          <div className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
              <span>{isRtl ? 'نتائج البحث الجغرافي السريع' : 'Search Results'} ({searchResults.length})</span>
              <button onClick={() => setSearchTerm('')} className="text-rose-500 hover:underline cursor-pointer">
                {isRtl ? 'إغلاق البحث' : 'Clear'}
              </button>
            </div>
            {searchResults.length === 0 ? (
              <p className="text-xs font-bold text-slate-500 py-2">{isRtl ? 'لا توجد نتائج مطابقة' : 'No matches found'}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                {searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedCountryCode(res.countryCode);
                      setSelectedStateId(res.stateId);
                      setSearchTerm('');
                    }}
                    className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-emerald-500 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                      <span>{res.countryFlag}</span>
                      <span>{res.districtName}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {res.countryName} • {res.stateName}
                      {res.subAddressName && <span className="text-emerald-600 font-bold"> • {res.subAddressName}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Interactive Global GIS Map Section */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isRtl ? 'الخريطة الجيومكانية التفاعلية والتغطية الميدانية' : 'Interactive Global GIS Map & Field Coverage'}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              {activeCountry.flag_emoji} {isRtl ? activeCountry.name_ar : activeCountry.name_en} ➔ {isRtl ? activeState?.name_ar : activeState?.name_en}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 cursor-pointer"
          >
            {showMap ? (isRtl ? 'طي الخريطة' : 'Collapse Map') : (isRtl ? 'عرض الخريطة' : 'Expand Map')}
          </button>
        </div>

        {showMap && (
          <div className="rounded-2xl overflow-hidden animate-fade-in">
            <InteractiveGlobalMapPicker
              latitude={mapCenter.lat}
              longitude={mapCenter.lng}
              zoom={mapCenter.zoom}
              height="300px"
              lang={lang}
              locationLabel={`${activeCountry.name_ar} - ${activeState?.name_ar || ''}`}
            />
          </div>
        )}
      </div>

      {/* 3. Three-Column Cascading Explorer (Countries ➔ States ➔ Districts & Sub-addresses) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Column 1: Countries (4 Cols) */}
        <div className="md:col-span-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'الدول المعتمدة' : 'Countries'}</span>
            </span>
            <span className="font-mono text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
              {totalCountries} دول
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {countries.map(c => {
              const isSelected = c.iso2 === selectedCountryCode;
              return (
                <div
                  key={c.iso2}
                  onClick={() => {
                    setSelectedCountryCode(c.iso2);
                    if (c.states_governorates.length > 0) {
                      setSelectedStateId(c.states_governorates[0].id);
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{c.flag_emoji}</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{isRtl ? c.name_ar : c.name_en}</h4>
                      <p className="text-[10px] text-slate-400">
                        {c.iso2} • {c.dial_code} • {c.states_governorates.length} {isRtl ? c.level1_label_ar : c.level1_label_en}
                      </p>
                    </div>
                  </div>
                  {isSelected && <ChevronLeft className={`w-4 h-4 text-emerald-600 ${isRtl ? '' : 'rotate-180'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: States / Governorates (4 Cols) */}
        <div className="md:col-span-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>{isRtl ? activeCountry.level1_label_ar : activeCountry.level1_label_en}</span>
            </span>
            <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
              {activeCountry.states_governorates.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {activeCountry.states_governorates.map(s => {
              const isSelected = s.id === selectedStateId;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStateId(s.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{isRtl ? s.name_ar : s.name_en}</h4>
                    <p className="text-[10px] text-slate-400">
                      {s.code} • {s.districts.length} {isRtl ? activeCountry.level2_label_ar : activeCountry.level2_label_en}
                    </p>
                  </div>
                  {isSelected && <ChevronLeft className={`w-4 h-4 text-indigo-600 ${isRtl ? '' : 'rotate-180'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Districts & Sub-addresses (4 Cols) */}
        <div className="md:col-span-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>{isRtl ? activeCountry.level2_label_ar : activeCountry.level2_label_en} والأحياء</span>
            </span>
            <span className="font-mono text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
              {activeState?.districts.length || 0}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {activeState?.districts.map(d => (
              <div key={d.id} className="p-3 bg-slate-50/80 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{isRtl ? d.name_ar : d.name_en}</h4>
                  <span className="font-mono text-[9px] text-slate-400">{d.code}</span>
                </div>

                {/* Sub Addresses / Villages / Neighborhoods */}
                {d.sub_addresses && d.sub_addresses.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-zinc-800">
                    {d.sub_addresses.map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-md text-[9px] font-bold"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-400 italic">{isRtl ? 'لم تسجل قرى أو أحياء فرعية بعد' : 'No sub-addresses yet'}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'إضافة تقسيم جغرافي أو قرية جديدة' : 'Add Geographic Division'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl text-xs space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase">{isRtl ? 'المسار الإداري الحالي' : 'Current Path'}</span>
                <p className="font-bold text-slate-800 dark:text-zinc-200">
                  {activeCountry.flag_emoji} {activeCountry.name_ar} ➔ {activeState?.name_ar}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500">{isRtl ? 'نوع التقسيم' : 'Division Type'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('district')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      targetType === 'district' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600'
                    }`}
                  >
                    {isRtl ? activeCountry.level2_label_ar : activeCountry.level2_label_en}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('sub_address')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      targetType === 'sub_address' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600'
                    }`}
                  >
                    {isRtl ? activeCountry.level3_label_ar : activeCountry.level3_label_en}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500">{isRtl ? 'الاسم باللغة العربية' : 'Name (Arabic)'} *</label>
                <input
                  type="text"
                  required
                  value={newArName}
                  onChange={e => setNewArName(e.target.value)}
                  placeholder={isRtl ? 'مثال: قرية البريهة، حي السعادة' : 'Arabic Name'}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500">{isRtl ? 'الاسم باللغة الإنجليزية (اختياري)' : 'Name (English)'}</label>
                <input
                  type="text"
                  value={newEnName}
                  onChange={e => setNewEnName(e.target.value)}
                  placeholder="e.g. Al-Bureiha Village"
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
                >
                  {isRtl ? 'حفظ التقسيم' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
