import React, { useState, useMemo } from 'react';
import { 
  MapPin, Map, Filter, Layers, Users, Briefcase, DollarSign, X, CheckCircle, Percent
} from 'lucide-react';
import { WidgetFrame } from '../enterprise/widgets/WidgetFrame';

interface GeographicalMapWidgetProps {
  lang: 'ar' | 'en';
  projects: any[];
}

// 1. Precise vector grid coordinates representing Yemen's major governorates
const GOVERNORATES = [
  {
    id: 'gov_mahrah',
    name_ar: 'محافظة المهرة',
    name_en: 'Al-Mahrah Governorate',
    points: '640,100 760,110 770,240 680,250 630,220',
    center: { x: 690, y: 165 },
    color: '#0d9488'
  },
  {
    id: 'gov_hadhramaut',
    name_ar: 'محافظة حضرموت',
    name_en: 'Hadhramaut Governorate',
    points: '400,120 640,100 630,220 680,250 610,260 520,290 410,260',
    center: { x: 520, y: 180 },
    color: '#059669'
  },
  {
    id: 'gov_jawf',
    name_ar: 'محافظة الجوف',
    name_en: 'Al-Jawf Governorate',
    points: '240,110 400,120 410,180 320,170 240,160',
    center: { x: 320, y: 145 },
    color: '#10b981'
  },
  {
    id: 'gov_sadah',
    name_ar: 'محافظة صعدة',
    name_en: "Sa'dah Governorate",
    points: '150,110 240,110 240,160 170,160 140,140',
    center: { x: 195, y: 135 },
    color: '#f59e0b'
  },
  {
    id: 'gov_sanaa',
    name_ar: 'محافظة صنعاء وعمران وحجة',
    name_en: 'Sanaa, Amran & Hajjah',
    points: '140,140 170,160 240,160 250,210 180,220 130,190',
    center: { x: 185, y: 185 },
    color: '#d97706'
  },
  {
    id: 'gov_marib',
    name_ar: 'محافظة مأرب',
    name_en: 'Marib Governorate',
    points: '250,210 320,170 410,180 410,240 330,240',
    center: { x: 325, y: 205 },
    color: '#0284c7'
  },
  {
    id: 'gov_shabwah',
    name_ar: 'محافظة شبوة',
    name_en: 'Shabwah Governorate',
    points: '410,240 520,290 470,320 380,310 330,240',
    center: { x: 425, y: 280 },
    color: '#2563eb'
  },
  {
    id: 'gov_hudaydah',
    name_ar: 'محافظة الحديدة',
    name_en: 'Al-Hudaydah Governorate',
    points: '130,190 180,220 160,260 130,280 110,240',
    center: { x: 135, y: 235 },
    color: '#0d9488'
  },
  {
    id: 'gov_dhamar',
    name_ar: 'محافظات ذمار وإب والبيضاء',
    name_en: 'Dhamar, Ibb & Al-Bayda',
    points: '180,220 250,210 330,240 310,290 220,280 180,260',
    center: { x: 250, y: 250 },
    color: '#4f46e5'
  },
  {
    id: 'gov_taiz',
    name_ar: 'محافظة تعز',
    name_en: 'Taiz Governorate',
    points: '130,280 180,260 220,280 200,320 140,320',
    center: { x: 175, y: 300 },
    color: '#e11d48'
  },
  {
    id: 'gov_aden',
    name_ar: 'عدن ولحج وأبين',
    name_en: 'Aden, Lahij & Abyan',
    points: '200,320 220,280 310,290 380,310 340,340 250,340',
    center: { x: 265, y: 322 },
    color: '#ea580c'
  },
  {
    id: 'gov_socotra',
    name_ar: 'أرخبيل سقطرى',
    name_en: 'Socotra Archipelago',
    points: '690,350 735,350 740,375 695,375',
    center: { x: 715, y: 362 },
    color: '#0891b2'
  }
];

export function GeographicalMapWidget({ lang, projects }: GeographicalMapWidgetProps) {
  const [selectedGovId, setSelectedGovId] = useState<string | null>(null);
  const [hoveredGovId, setHoveredGovId] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null);

  // Dynamic coordinates resolver for any user-generated projects
  const mappedProjects = useMemo(() => {
    return projects.map((p, idx) => {
      const loc = (p.location_name || '').toLowerCase();
      let govId = 'gov_marib';
      let x = 325;
      let y = 205;
      let govNameAr = 'مأرب';
      let govNameEn = 'Marib';

      if (loc.includes('taiz') || loc.includes('تعز') || loc.includes('mawza') || loc.includes('موزع')) {
        govId = 'gov_taiz';
        x = 175;
        y = 300;
        govNameAr = 'تعز';
        govNameEn = 'Taiz';
      } else if (loc.includes('sanaa') || loc.includes('صنعاء') || loc.includes('hajjah') || loc.includes('حجة') || loc.includes('amran') || loc.includes('عمران')) {
        govId = 'gov_sanaa';
        x = 185;
        y = 185;
        govNameAr = 'صنعاء';
        govNameEn = 'Sanaa';
      } else if (loc.includes('aden') || loc.includes('عدن') || loc.includes('lahij') || loc.includes('لحج') || loc.includes('abyan') || loc.includes('أبين')) {
        govId = 'gov_aden';
        x = 265;
        y = 322;
        govNameAr = 'عدن';
        govNameEn = 'Aden';
      } else if (loc.includes('hadhramaut') || loc.includes('حضرموت') || loc.includes('mukalla') || loc.includes('المكلا')) {
        govId = 'gov_hadhramaut';
        x = 520;
        y = 180;
        govNameAr = 'حضرموت';
        govNameEn = 'Hadhramaut';
      } else if (loc.includes('hudaydah') || loc.includes('الحديدة') || loc.includes('hodeidah')) {
        govId = 'gov_hudaydah';
        x = 135;
        y = 235;
        govNameAr = 'الحديدة';
        govNameEn = 'Al-Hudaydah';
      } else if (loc.includes('marib') || loc.includes('مأرب')) {
        govId = 'gov_marib';
        x = 325;
        y = 205;
        govNameAr = 'مأرب';
        govNameEn = 'Marib';
      } else if (loc.includes('mahrah') || loc.includes('المهرة')) {
        govId = 'gov_mahrah';
        x = 690;
        y = 165;
        govNameAr = 'المهرة';
        govNameEn = 'Al-Mahrah';
      } else if (loc.includes('shabwah') || loc.includes('شبوة')) {
        govId = 'gov_shabwah';
        x = 425;
        y = 280;
        govNameAr = 'شبوة';
        govNameEn = 'Shabwah';
      } else if (loc.includes('jawf') || loc.includes('الجوف')) {
        govId = 'gov_jawf';
        x = 320;
        y = 145;
        govNameAr = 'الجوف';
        govNameEn = 'Al-Jawf';
      } else if (loc.includes('sadah') || loc.includes('صعدة')) {
        govId = 'gov_sadah';
        x = 195;
        y = 135;
        govNameAr = 'صعدة';
        govNameEn = "Sa'dah";
      } else if (loc.includes('socotra') || loc.includes('سقطرى')) {
        govId = 'gov_socotra';
        x = 715;
        y = 362;
        govNameAr = 'سقطرى';
        govNameEn = 'Socotra';
      } else {
        // Location not recognized → keep it OUT of the map to avoid misattribution
        return {
          ...p,
          unmapped: true,
          govId: '',
          x: 0,
          y: 0,
          govNameAr: '',
          govNameEn: '',
          sector: 'WELFARE' as const
        };
      }

      // Resolve sector category
      let sector: 'WELFARE' | 'EDUCATION' | 'WASH' | 'ORPHANS' = 'WELFARE';
      const code = (p.code || '').toLowerCase();
      if (code.includes('food') || code.includes('welfare') || code.includes('social')) {
        sector = 'WELFARE';
      } else if (code.includes('hafiz') || code.includes('quran') || code.includes('teach') || code.includes('edu')) {
        sector = 'EDUCATION';
      } else if (code.includes('well') || code.includes('wash') || code.includes('water')) {
        sector = 'WASH';
      } else if (code.includes('orphan') || code.includes('spons') || code.includes('yateem')) {
        sector = 'ORPHANS';
      }

      return {
        ...p,
        govId,
        x,
        y,
        govNameAr,
        govNameEn,
        sector
      };
    });
  }, [projects]);

  // Sector Filters
  const SECTORS = [
    { id: 'ALL', label_ar: 'الكل', label_en: 'All Sectors', color: 'bg-emerald-600' },
    { id: 'WELFARE', label_ar: 'الرعاية والتمكين', label_en: 'Social Welfare', color: 'bg-emerald-500' },
    { id: 'EDUCATION', label_ar: 'التمكين القرآني', label_en: 'Quranic Edu', color: 'bg-amber-500' },
    { id: 'WASH', label_ar: 'الإصحاح المائي', label_en: 'WASH Projects', color: 'bg-teal-500' },
    { id: 'ORPHANS', label_ar: 'رعاية الأيتام', label_en: 'Orphan Care', color: 'bg-rose-500' },
  ];

  // Filter projects by sector
  const filteredProjects = useMemo(() => {
    if (sectorFilter === 'ALL') return mappedProjects;
    return mappedProjects.filter(p => p.sector === sectorFilter);
  }, [mappedProjects, sectorFilter]);

  // Projects whose location could not be matched to a governorate
  const unmappedProjects = useMemo(
    () => filteredProjects.filter((p: any) => (p as any).unmapped),
    [filteredProjects]
  );

  // Aggregate stats per governorate
  const governorateStats = useMemo(() => {
    const statsMap: { [key: string]: { count: number, budgetSum: number, beneficiariesSum: number, list: any[] } } = {};
    
    GOVERNORATES.forEach(g => {
      statsMap[g.id] = { count: 0, budgetSum: 0, beneficiariesSum: 0, list: [] };
    });

    filteredProjects.forEach(p => {
      if (statsMap[p.govId]) {
        statsMap[p.govId].count += 1;
        statsMap[p.govId].budgetSum += parseFloat(p.budget || '0');
        statsMap[p.govId].beneficiariesSum += (p.actual_beneficiaries || p.target_beneficiaries || 0);
        statsMap[p.govId].list.push(p);
      }
    });

    return statsMap;
  }, [filteredProjects]);

  const selectedGovDetails = useMemo(() => {
    if (!selectedGovId) return null;
    const govInfo = GOVERNORATES.find(g => g.id === selectedGovId);
    const stats = governorateStats[selectedGovId];
    return {
      ...govInfo,
      ...stats
    };
  }, [selectedGovId, governorateStats]);

  const handleGovClick = (id: string) => {
    setSelectedGovId(selectedGovId === id ? null : id);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGPolygonElement>, name: string) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTooltip({ x, y, text: name });
    }
  };

  return (
    <WidgetFrame
      id="geographical_projects_map"
      title={lang === 'ar' ? 'التوزيع الجغرافي للمشاريع الميدانية' : 'Geographical Projects Distribution'}
      subtitle={lang === 'ar' ? 'متابعة حية ومؤشرات الإنجاز للمحافظات' : 'Live field tracking & provincial performance'}
      icon={Map}
      defaultHeight={460}
      headerActions={
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-none pb-1 sm:pb-0">
          {SECTORS.slice(0, 3).map(sec => (
            <button
              key={sec.id}
              onClick={() => setSectorFilter(sec.id)}
              className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all duration-200 shrink-0 ${
                sectorFilter === sec.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {lang === 'ar' ? sec.label_ar : sec.label_en}
            </button>
          ))}
          {SECTORS.length > 3 && (
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="text-[10px] sm:text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 border-none rounded-md px-1.5 py-1 focus:ring-0 cursor-pointer shrink-0"
            >
              <option value="ALL">{lang === 'ar' ? 'المزيد...' : 'More...'}</option>
              {SECTORS.slice(3).map(sec => (
                <option key={sec.id} value={sec.id}>
                  {lang === 'ar' ? sec.label_ar : sec.label_en}
                </option>
              ))}
            </select>
          )}
        </div>
      }
    >
      {({ width, height }) => (
        <div className="flex flex-col md:flex-row h-full gap-4 pb-2 min-h-[380px]">
          
          {/* 1. Map Canvas Section (Takes 7 columns proportionately) */}
          <div className="relative w-full md:w-[62%] bg-slate-50/50 dark:bg-zinc-900/20 border border-slate-100 dark:border-zinc-800/60 rounded-xl flex items-center justify-center p-2 overflow-hidden group select-none">
            
            {/* Compass or Grid background subtle graphic */}
            <div className="absolute top-4 left-4 text-slate-300 dark:text-zinc-800 text-[10px] font-mono tracking-widest hidden sm:block">
              <p>N 15° 21' 36"</p>
              <p>E 44° 12' 14"</p>
            </div>
            
            <svg 
              viewBox="100 80 680 320" 
              className="w-full h-full max-h-[340px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:drop-shadow-none transition-transform duration-500"
            >
              {/* Governorates SVG Polygons */}
              <g className="transition-all duration-300">
                {GOVERNORATES.map((gov) => {
                  const stats = governorateStats[gov.id];
                  const hasProjects = stats?.count > 0;
                  const isSelected = selectedGovId === gov.id;
                  const isHovered = hoveredGovId === gov.id;

                  // Define dynamic styling depending on project existence and selection
                  let fillColor = 'rgba(241, 245, 249, 0.9)'; // light mode default
                  if (hasProjects) {
                    fillColor = isSelected ? 'rgba(5, 150, 105, 0.15)' : 'rgba(5, 150, 105, 0.04)';
                  }
                  
                  // In dark mode we adjust background transparency
                  const darkFillColor = hasProjects
                    ? (isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.04)')
                    : 'rgba(24, 24, 27, 0.4)';

                  return (
                    <polygon
                      key={gov.id}
                      points={gov.points}
                      onClick={() => handleGovClick(gov.id)}
                      onMouseEnter={() => setHoveredGovId(gov.id)}
                      onMouseLeave={() => {
                        setHoveredGovId(null);
                        setTooltip(null);
                      }}
                      onMouseMove={(e) => handleMouseMove(e, lang === 'ar' ? gov.name_ar : gov.name_en)}
                      style={{
                        fill: document.documentElement.classList.contains('dark') ? darkFillColor : fillColor,
                      }}
                      className={`transition-all duration-300 cursor-pointer stroke-2 ${
                        hasProjects 
                          ? isSelected
                            ? 'stroke-emerald-600 dark:stroke-emerald-400 fill-emerald-500/10'
                            : isHovered
                              ? 'stroke-emerald-500/80 dark:stroke-emerald-500/60 fill-emerald-500/5'
                              : 'stroke-slate-200 dark:stroke-zinc-800'
                          : isHovered
                            ? 'stroke-slate-400 dark:stroke-zinc-700'
                            : 'stroke-slate-200 dark:stroke-zinc-800'
                      }`}
                    />
                  );
                })}
              </g>

              {/* Governorates Labels (Subtle) */}
              {GOVERNORATES.map(gov => {
                const stats = governorateStats[gov.id];
                const hasProjects = stats?.count > 0;
                if (!hasProjects) return null;

                return (
                  <text
                    key={`lbl-${gov.id}`}
                    x={gov.center.x}
                    y={gov.center.y + 12}
                    textAnchor="middle"
                    className="text-[9px] font-black pointer-events-none select-none fill-slate-500 dark:fill-zinc-400 opacity-60"
                  >
                    {lang === 'ar' ? gov.name_ar.replace('محافظة ', '') : gov.name_en.replace(' Governorate', '')}
                  </text>
                );
              })}

              {/* Glowing Interactive Project Pins */}
              {filteredProjects.map((proj, idx) => {
                const isSelected = selectedGovId === proj.govId;
                return (
                  <g key={`pin-${proj.id}-${idx}`} className="cursor-pointer" onClick={() => handleGovClick(proj.govId)}>
                    {/* Ring animation */}
                    <circle
                      cx={proj.x}
                      cy={proj.y}
                      r={10}
                      className="fill-emerald-500/30 animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                    {/* Solid outer pin boundary */}
                    <circle
                      cx={proj.x}
                      cy={proj.y}
                      r={6}
                      className={`transition-all duration-300 ${
                        isSelected 
                          ? 'fill-amber-500 stroke-white stroke-2 shadow-lg' 
                          : 'fill-emerald-600 stroke-white stroke-1.5 dark:stroke-zinc-900 shadow-md'
                      }`}
                    />
                    {/* Inner core pin */}
                    <circle
                      cx={proj.x}
                      cy={proj.y}
                      r={2.5}
                      className="fill-white"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip inside Map Canvas */}
            {tooltip && (
              <div 
                className="absolute bg-slate-900/95 dark:bg-zinc-950/95 text-white py-1 px-2.5 rounded-md shadow-lg border border-slate-800 text-[11px] font-bold backdrop-blur-md pointer-events-none z-10 animate-fade-in"
                style={{ 
                  left: `${tooltip.x}px`, 
                  top: `${tooltip.y - 30}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                {tooltip.text}
              </div>
            )}

            {/* Reset / All Yemen View Float controller */}
            {selectedGovId && (
              <button
                onClick={() => setSelectedGovId(null)}
                className="absolute bottom-3 right-3 bg-white dark:bg-zinc-950 shadow-sm border border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{lang === 'ar' ? 'عرض خريطة الجمهورية' : 'View Entire Country'}</span>
              </button>
            )}
          </div>

          {/* 2. Detailed Performance Sidebar Panel (Takes 5 columns proportionately) */}
          <div className="w-full md:w-[38%] flex flex-col justify-between min-h-[180px]">
            
            {!selectedGovDetails ? (
              // State A: Overall Summary View of Yemen
              <div className="flex flex-col h-full justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-600 animate-pulse"></span>
                    <h3 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                      {lang === 'ar' ? 'ملخص العمليات الجغرافية' : 'Countrywide Operations summary'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed font-semibold">
                    {lang === 'ar' 
                      ? 'اختر أي محافظة من الخريطة لاستعراض ميزانياتها وقائمة المشاريع الجارية فيها ومعدلات الإنجاز الخاصة بكل مشروع.' 
                      : 'Click any highlighted province on the map to query active project portfolios, local budgets, and social metrics.'}
                  </p>
                </div>

                {/* Countrywide aggregated metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50/70 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800/40 rounded-xl">
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {lang === 'ar' ? 'المشاريع الجغرافية' : 'Active Field Portfolios'}
                    </p>
                    <p className="text-lg font-black text-slate-800 dark:text-zinc-100 mt-1">
                      {filteredProjects.length}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/70 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800/40 rounded-xl">
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      {lang === 'ar' ? 'المستهدف الإجمالي' : 'Total Target Reach'}
                    </p>
                    <p className="text-lg font-black text-slate-800 dark:text-zinc-100 mt-1">
                      {filteredProjects.reduce((sum, p) => sum + (p.actual_beneficiaries || p.target_beneficiaries || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400 font-bold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {lang === 'ar' ? 'الموازنة الجغرافية المرصودة' : 'Aggregated Field Budgets'}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-black">
                      {(filteredProjects.reduce((sum, p) => sum + parseFloat(p.budget || '0'), 0) / 1000000).toFixed(0)}M YER
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // State B: Selected Governorate View
              <div className="flex flex-col h-full justify-between space-y-4 animate-fade-in">
                
                {/* Governorate title & Reset */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-sm font-black text-slate-900 dark:text-zinc-100">
                      {lang === 'ar' ? selectedGovDetails.name_ar : selectedGovDetails.name_en}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedGovId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Specific Governorate Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50/80 dark:bg-zinc-900/40 rounded-lg">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">{lang === 'ar' ? 'المشاريع' : 'Projects'}</span>
                    <p className="text-sm font-black text-slate-800 dark:text-zinc-100">{selectedGovDetails.count}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50/80 dark:bg-zinc-900/40 rounded-lg">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">{lang === 'ar' ? 'المستفيدون الميدانيون' : 'Direct Beneficiaries'}</span>
                    <p className="text-sm font-black text-slate-800 dark:text-zinc-100">{selectedGovDetails.beneficiariesSum.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50/80 dark:bg-zinc-900/40 rounded-lg col-span-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">{lang === 'ar' ? 'الموازنة المحلية المخصصة' : 'Allocated Local Budget'}</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{(selectedGovDetails.budgetSum / 1000000).toFixed(0)}M YER</span>
                  </div>
                </div>

                {/* Projects lists */}
                <div className="flex-1 overflow-y-auto max-h-[160px] space-y-2 pr-1 custom-scrollbar">
                  {selectedGovDetails.list.length === 0 ? (
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center py-4 font-semibold">
                      {lang === 'ar' ? 'لا توجد مشاريع مفعّلة في القطاع المحدد حالياً.' : 'No active projects under selected filters.'}
                    </p>
                  ) : (
                    selectedGovDetails.list.map((proj) => {
                      const progress = parseFloat(proj.progress_percent || '0');
                      return (
                        <div 
                          key={proj.id} 
                          className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60 rounded-lg transition-all"
                        >
                          <div className="flex justify-between items-start gap-2 text-xs">
                            <h4 className="font-bold text-slate-800 dark:text-zinc-200 line-clamp-1 max-w-[150px]">
                              {lang === 'ar' ? proj.name_ar : proj.name_en}
                            </h4>
                            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              {proj.code}
                            </span>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                              <span>{lang === 'ar' ? 'معدل الإنجاز' : 'WBS Wg. Progress'}</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

            {/* Unmapped projects notice */}
            {unmappedProjects.length > 0 && (
              <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/10 border border-amber-100/40 dark:border-amber-900/30 rounded-xl text-[10px] text-amber-800 dark:text-amber-400 font-bold">
                {lang === 'ar'
                  ? `${unmappedProjects.length} مشروع لم تُطابق موقعه الجغرافي مع المحافظات المعروضة — راجع حقل الموقع في سجل المشاريع.`
                  : `${unmappedProjects.length} project(s) could not be matched to a displayed governorate — review the location field in the project register.`}
              </div>
            )}

            {/* Bottom Footer Callout (Spherical Standard and CHS standard indicator) */}
            <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/30 dark:border-emerald-950/20 rounded-xl text-[10px] text-emerald-800 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'يُعرض كل مشروع في محافظته المسجلة فقط؛ المشاريع غير المطابقة تُستبعد من الخريطة لضمان دقة التوزيع.'
                  : 'Each project is shown only in its registered governorate; unmatched projects are excluded from the map for accuracy.'}
              </span>
            </div>

          </div>

        </div>
      )}
    </WidgetFrame>
  );
}
