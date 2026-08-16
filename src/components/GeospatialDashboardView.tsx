import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, 
  Globe, 
  Layers, 
  Filter, 
  Search, 
  Users, 
  Briefcase, 
  ShieldAlert, 
  Maximize2, 
  Download, 
  Compass, 
  Zap, 
  TrendingUp, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  Heart, 
  Droplet, 
  Crosshair, 
  Sparkles, 
  Info, 
  Activity,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';

import { Project, Program } from '../types';
import { triggerHaptic } from '../helpers/hapticSwipe';

// Import Google Maps SDK components
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';

// Import Leaflet components for OpenStreetMap GIS fallback/mode
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon paths in React
const defaultLeafletIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom Leaflet Icons by Category
const createCustomMarkerIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 900;
        font-size: 11px;
        font-family: monospace;
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

interface GeospatialDashboardViewProps {
  lang: 'ar' | 'en';
  projects: Project[];
  programs: Program[];
  beneficiaries?: any[];
}

// Sample Field Coordinates across Yemen Governorates for projects without exact lat/lng
const GOVERNORATE_COORDINATES: Record<string, { lat: number; lng: number; nameAr: string; nameEn: string }> = {
  'aden': { lat: 12.7855, lng: 45.0187, nameAr: 'عدن', nameEn: 'Aden' },
  'taiz': { lat: 13.5795, lng: 44.0209, nameAr: 'تعز', nameEn: 'Taiz' },
  'marib': { lat: 15.4623, lng: 45.3262, nameAr: 'مأرب', nameEn: 'Marib' },
  'sanaa': { lat: 15.3694, lng: 44.1910, nameAr: 'صنعاء', nameEn: 'Sanaa' },
  'hodeidah': { lat: 14.7978, lng: 42.9545, nameAr: 'الحديدة', nameEn: 'Al-Hodeidah' },
  'hadramout': { lat: 14.5425, lng: 49.1242, nameAr: 'حضرموت', nameEn: 'Hadramout' },
  'ibb': { lat: 13.9667, lng: 44.1833, nameAr: 'إب', nameEn: 'Ibb' },
  'lahj': { lat: 13.0583, lng: 44.8833, nameAr: 'لحج', nameEn: 'Lahj' },
  'abyan': { lat: 13.5833, lng: 45.3833, nameAr: 'أبين', nameEn: 'Abyan' },
};

// High-Density Beneficiary Zones (IDP Camps, Water Nodes, Orphan Clusters)
const BENEFICIARY_HOTSPOTS = [
  { id: 'hs-1', nameAr: 'مخيم الجفينة للنازحين - مأرب', nameEn: 'Al-Jafina IDP Camp - Marib', lat: 15.4250, lng: 45.3120, count: 28500, type: 'idp_camp', category: 'غذاء ومأوى', risk: 'high' },
  { id: 'hs-2', nameAr: 'تجمع أيتام وأرامل تعز', nameEn: 'Taiz Orphan & Widow Cluster', lat: 13.5820, lng: 44.0150, count: 18200, type: 'orphan_cluster', category: 'كفالات ورعاية', risk: 'medium' },
  { id: 'hs-3', nameAr: 'محطة توزيع المياه المركزية - عدن', nameEn: 'Central Water Hub - Aden', lat: 12.8200, lng: 45.0300, count: 32000, type: 'water_node', category: 'مياه وإصلاح', risk: 'low' },
  { id: 'hs-4', nameAr: 'مخيم بئر أحمد للنازحين - عدن', nameEn: 'Bir Ahmed IDP Camp - Aden', lat: 12.8700, lng: 44.9200, count: 14600, type: 'idp_camp', category: 'إغاثة طوارئ', risk: 'high' },
  { id: 'hs-5', nameAr: 'مركز رعاية سوء التغذية - الحديدة', nameEn: 'Malnutrition Center - Hodeidah', lat: 14.8100, lng: 42.9700, count: 12400, type: 'health_center', category: 'صحة وتغذية', risk: 'critical' },
  { id: 'hs-6', nameAr: 'تجمع نازحي المخا والساحل الغربي', nameEn: 'Al-Mukha & West Coast IDPs', lat: 13.3200, lng: 43.2500, count: 19800, type: 'idp_camp', category: 'إغاثة طارئة', risk: 'high' },
  { id: 'hs-7', nameAr: 'قرى الأيتام والرعاية - سيئون', nameEn: 'Seiyun Orphan Care Villages', lat: 15.9500, lng: 48.7800, count: 9500, type: 'orphan_cluster', category: 'كفالات وأيتام', risk: 'low' },
];

export const GeospatialDashboardView: React.FC<GeospatialDashboardViewProps> = ({
  lang,
  projects,
  programs,
  beneficiaries = []
}) => {
  const isRtl = lang === 'ar';
  
  // API Key check for Google Maps Platform
  const API_KEY = 
    process.env.GOOGLE_MAPS_PLATFORM_KEY || 
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || 
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY || 
    '';
  const hasValidGoogleKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.length > 10;

  // Map Engine & Layer state
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'google'>(hasValidGoogleKey ? 'google' : 'leaflet');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  
  // Active Layer Toggles
  const [showProjectsLayer, setShowProjectsLayer] = useState(true);
  const [showHotspotsLayer, setShowHotspotsLayer] = useState(true);
  const [showBufferRadius, setShowBufferRadius] = useState(true);
  const [bufferRadiusKm, setBufferRadiusKm] = useState<number>(25);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');

  // Selected item inspector modal / card
  const [selectedProjectPin, setSelectedProjectPin] = useState<Project | null>(null);
  const [selectedHotspotPin, setSelectedHotspotPin] = useState<typeof BENEFICIARY_HOTSPOTS[0] | null>(null);

  // Center coordinate state (Default centered on Yemen: Aden/Taiz/Marib span)
  const defaultCenter = { lat: 14.2000, lng: 44.8000 };
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(7);

  // Map projects to coordinates
  const mappedProjects = useMemo(() => {
    return projects.map((proj, idx) => {
      // Find lat lng from location_name or governorate or fallback
      const locationKey = (proj.location_name || '').toLowerCase();
      let coords = { lat: 13.5795 + (idx % 5) * 0.25, lng: 44.0209 + (idx % 4) * 0.35 };

      for (const [key, val] of Object.entries(GOVERNORATE_COORDINATES)) {
        if (locationKey.includes(key) || locationKey.includes(val.nameAr) || locationKey.includes(val.nameEn.toLowerCase())) {
          // Slight jitter so markers don't stack directly on top of each other
          const offsetLat = ((idx * 17) % 100 - 50) * 0.003;
          const offsetLng = ((idx * 23) % 100 - 50) * 0.003;
          coords = { lat: val.lat + offsetLat, lng: val.lng + offsetLng };
          break;
        }
      }

      return {
        ...proj,
        coords
      };
    });
  }, [projects]);

  // Filtered Projects for Map Display
  const filteredProjects = useMemo(() => {
    return mappedProjects.filter(p => {
      const matchSearch = (p.name_ar && p.name_ar.includes(searchTerm)) || 
                          (p.name_en && p.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.location_name && p.location_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchProgram = selectedProgramFilter === 'all' || p.program_id === selectedProgramFilter;
      const matchStatus = selectedStatusFilter === 'all' || p.status_code === selectedStatusFilter;
      const matchGov = selectedGovernorate === 'all' || (p.location_name || '').toLowerCase().includes(selectedGovernorate.toLowerCase());

      return matchSearch && matchProgram && matchStatus && matchGov;
    });
  }, [mappedProjects, searchTerm, selectedProgramFilter, selectedStatusFilter, selectedGovernorate]);

  // Total Beneficiaries Visualized
  const totalBeneficiariesCount = useMemo(() => {
    const projBenefs = filteredProjects.reduce((sum, p) => sum + (p.actual_beneficiaries || p.target_beneficiaries || 1500), 0);
    const hotspotBenefs = BENEFICIARY_HOTSPOTS.reduce((sum, h) => sum + h.count, 0);
    return projBenefs + hotspotBenefs;
  }, [filteredProjects]);

  const totalMappedBudget = useMemo(() => {
    return filteredProjects.reduce((sum, p) => sum + parseFloat(p.budget || '0'), 0);
  }, [filteredProjects]);

  // Export GeoJSON function
  const handleExportGeoJSON = () => {
    triggerHaptic('success');
    const geoJson = {
      type: "FeatureCollection",
      features: filteredProjects.map(p => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [p.coords.lng, p.coords.lat]
        },
        properties: {
          id: p.id,
          code: p.code,
          name_ar: p.name_ar,
          name_en: p.name_en,
          budget: p.budget,
          status: p.status_code,
          beneficiaries: p.actual_beneficiaries || p.target_beneficiaries,
          location: p.location_name
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rohamā_Geospatial_Projects_${new Date().toISOString().slice(0,10)}.geojson`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-amber-950 text-white p-6 rounded-2xl border border-emerald-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>محرك التحليلات المكانية والجغرافية GIS</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GIS REAL-TIME FIELD MAP
              </span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">
              {isRtl ? 'اللوحة الجغرافية المكانية والميدانية (Geospatial Field Operations)' : 'Geospatial Field Operations & Beneficiary Map'}
            </h2>
            
            <p className="text-xs text-zinc-300 leading-relaxed">
              {isRtl 
                ? 'خريطة تفاعلية لتتبع التوزيع الجغرافي للمشاريع، بؤر تركز النازحين والأيتام، وتحديد النطاقات الميدانية الحرجة عبر المحافظات اليمنية لمؤسسة رحماء.'
                : 'Interactive spatial map to analyze project footprints, beneficiary density hotspots, IDP camps, and field buffer boundaries.'}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-zinc-300 font-bold block">{isRtl ? 'المشاريع الخريطية' : 'Mapped Projects'}</span>
              <span className="text-lg font-black text-amber-400 font-mono">{filteredProjects.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-zinc-300 font-bold block">{isRtl ? 'المستفيدون المرصودون' : 'Mapped Beneficiaries'}</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{totalBeneficiariesCount.toLocaleString()}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-zinc-300 font-bold block">{isRtl ? 'الموازنة الميدانية' : 'Mapped Budget'}</span>
              <span className="text-lg font-black text-white font-mono">${(totalMappedBudget / 1000000).toFixed(2)}M</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Left: Map Engine Switcher & Layer Toggles */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            
            {/* Engine Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setMapEngine('leaflet');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mapEngine === 'leaflet'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{isRtl ? 'محرّك OpenStreetMap GIS' : 'OpenStreetMap GIS'}</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setMapEngine('google');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mapEngine === 'google'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isRtl ? 'محرّك خرائط Google Maps' : 'Google Maps Platform'}</span>
              </button>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/60 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowProjectsLayer(!showProjectsLayer);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                  showProjectsLayer
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-400 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{isRtl ? 'المشاريع 📌' : 'Projects'}</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowHotspotsLayer(!showHotspotsLayer);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                  showHotspotsLayer
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isRtl ? 'بؤر المستفيدين 🔥' : 'Beneficiary Hotspots'}</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowBufferRadius(!showBufferRadius);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                  showBufferRadius
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>{isRtl ? 'نطاق التغطية ⭕' : 'Buffer Zone'}</span>
              </button>
            </div>
          </div>

          {/* Right: Export & Quick Actions */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            {showBufferRadius && (
              <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-xs font-bold">
                <span>{isRtl ? 'قطر النطاق:' : 'Buffer Radius:'}</span>
                <select
                  value={bufferRadiusKm}
                  onChange={(e) => setBufferRadiusKm(Number(e.target.value))}
                  className="bg-transparent font-mono font-black border-none outline-none cursor-pointer text-blue-800 dark:text-blue-200"
                >
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </div>
            )}

            <button
              onClick={handleExportGeoJSON}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isRtl ? 'تصدير GeoJSON' : 'Export GeoJSON'}</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
          {/* Search Box */}
          <div className="relative">
            <Search className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? 'ابحث باسم المشروع، الكود، المنطقة...' : 'Search project, code, location...'}
              className={`w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 ${
                isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
              } text-xs font-bold focus:outline-none focus:border-amber-500`}
            />
          </div>

          {/* Program Filter */}
          <select
            value={selectedProgramFilter}
            onChange={(e) => setSelectedProgramFilter(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
          >
            <option value="all">{isRtl ? 'جميع البرامج المرتبطة' : 'All Programs'}</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {isRtl ? p.name_ar : (p.name_en || p.name_ar)}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
          >
            <option value="all">{isRtl ? 'جميع حالات التنفيذ' : 'All Statuses'}</option>
            <option value="active">{isRtl ? 'نشط ميدانياً' : 'Active Field'}</option>
            <option value="planning">{isRtl ? 'قيد التخطيط' : 'Planning'}</option>
            <option value="completed">{isRtl ? 'مكتمل ومغلق' : 'Completed'}</option>
          </select>

          {/* Governorate Filter */}
          <select
            value={selectedGovernorate}
            onChange={(e) => {
              const govKey = e.target.value;
              setSelectedGovernorate(govKey);
              if (govKey !== 'all' && GOVERNORATE_COORDINATES[govKey]) {
                const target = GOVERNORATE_COORDINATES[govKey];
                setMapCenter({ lat: target.lat, lng: target.lng });
                setMapZoom(10);
              }
            }}
            className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
          >
            <option value="all">{isRtl ? 'جميع المحافظات الميدانية' : 'All Governorates'}</option>
            {Object.entries(GOVERNORATE_COORDINATES).map(([key, val]) => (
              <option key={key} value={key}>
                {isRtl ? val.nameAr : val.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Main Interactive Map Area */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-md overflow-hidden relative">
        
        {/* Map Container - Height explicitly set to prevent collapse (CF2) */}
        <div style={{ height: '620px', width: '100%' }} className="relative z-0">
          
          {mapEngine === 'leaflet' ? (
            /* OpenStreetMap Leaflet Engine */
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Field Buffer Radius Circles */}
              {showBufferRadius && (
                <>
                  <Circle
                    center={[12.7855, 45.0187]} // Aden HQ
                    radius={bufferRadiusKm * 1000}
                    pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.12, weight: 2 }}
                  />
                  <Circle
                    center={[15.4623, 45.3262]} // Marib HQ
                    radius={bufferRadiusKm * 1000}
                    pathOptions={{ color: '#d97706', fillColor: '#f59e0b', fillOpacity: 0.12, weight: 2 }}
                  />
                </>
              )}

              {/* Project Pins */}
              {showProjectsLayer && filteredProjects.map(proj => {
                const color = proj.status_code === 'active' ? '#10b981' : proj.status_code === 'completed' ? '#64748b' : '#f59e0b';
                const customIcon = createCustomMarkerIcon(color, (proj.code || 'PRJ').substring(0, 3));

                return (
                  <Marker
                    key={proj.id}
                    position={[proj.coords.lat, proj.coords.lng]}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => {
                        triggerHaptic('light');
                        setSelectedProjectPin(proj);
                      }
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-2 text-right font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
                        <div className="flex items-center justify-between gap-2 border-b pb-1">
                          <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {proj.code}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {proj.status_code === 'active' ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'مكتمل' : 'Completed')}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                          {isRtl ? proj.name_ar : (proj.name_en || proj.name_ar)}
                        </h4>

                        <div className="text-[11px] text-slate-600 space-y-1">
                          <div>📍 {proj.location_name || (isRtl ? 'الميدان' : 'Field')}</div>
                          <div>💰 الموازنة: ${parseFloat(proj.budget || '0').toLocaleString()}</div>
                          <div>👥 المستفيدون: {(proj.actual_beneficiaries || 1500).toLocaleString()}</div>
                        </div>

                        <button
                          onClick={() => setSelectedProjectPin(proj)}
                          className="w-full py-1 bg-emerald-600 text-white rounded text-[10px] font-bold mt-1"
                        >
                          {isRtl ? 'عرض التفاصيل الميدانية' : 'View Field Details'}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Beneficiary Concentration Hotspots Layer */}
              {showHotspotsLayer && BENEFICIARY_HOTSPOTS.map(hs => {
                const color = hs.risk === 'critical' ? '#ef4444' : hs.risk === 'high' ? '#f97316' : '#eab308';
                
                return (
                  <React.Fragment key={hs.id}>
                    {/* Density Heat Circle */}
                    <Circle
                      center={[hs.lat, hs.lng]}
                      radius={hs.count / 2}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 1.5 }}
                    />
                    
                    {/* Hotspot Center Marker */}
                    <Marker
                      position={[hs.lat, hs.lng]}
                      icon={createCustomMarkerIcon(color, '🔥')}
                      eventHandlers={{
                        click: () => {
                          triggerHaptic('medium');
                          setSelectedHotspotPin(hs);
                        }
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1.5 text-right font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-black rounded">
                            بؤرة كثافة مستفيدين
                          </span>
                          <h4 className="font-black text-xs text-slate-900">{isRtl ? hs.nameAr : hs.nameEn}</h4>
                          <div className="text-[11px] text-slate-700">
                            <div>العدد المرصود: <strong>{hs.count.toLocaleString()} مستفيد</strong></div>
                            <div>التصنيف: {hs.category}</div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          ) : (
            /* Google Maps Platform Engine */
            hasValidGoogleKey ? (
              <APIProvider apiKey={API_KEY} version="weekly">
                <GoogleMap
                  defaultCenter={defaultCenter}
                  defaultZoom={mapZoom}
                  mapId="NEXORA_GIS_MAP_ID"
                  mapTypeId={mapType}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Google Maps Markers */}
                  {showProjectsLayer && filteredProjects.map(proj => (
                    <AdvancedMarker
                      key={proj.id}
                      position={{ lat: proj.coords.lat, lng: proj.coords.lng }}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedProjectPin(proj);
                      }}
                    >
                      <Pin
                        background={proj.status_code === 'active' ? '#10b981' : '#f59e0b'}
                        glyphColor="#ffffff"
                        borderColor="#ffffff"
                      />
                    </AdvancedMarker>
                  ))}
                </GoogleMap>
              </APIProvider>
            ) : (
              /* Google Maps Setup Splash Screen when API Key is missing (Constitution Rule 1) */
              <div className="h-full w-full flex items-center justify-center p-6 bg-slate-900 text-white text-center">
                <div className="max-w-md space-y-4">
                  <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30 animate-pulse">
                    <Globe className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-black text-white">
                    {isRtl ? 'تفعيل مفتاح Google Maps Platform API' : 'Google Maps API Key Required'}
                  </h3>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isRtl 
                      ? 'لاستخدام خرائط جوجل التفاعلية مع الصور الفضائية المباشرة، يرجى إضافة مفتاح Google Maps API عبر إعدادات المنصة.'
                      : 'To unlock Google Maps satellite maps and advanced map controls, add your GOOGLE_MAPS_PLATFORM_KEY to secrets.'}
                  </p>

                  <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700 text-right text-xs space-y-1 text-zinc-300">
                    <div>1. افتح <strong>الإعدادات (⚙️)</strong> → <strong>الأسرار (Secrets)</strong></div>
                    <div>2. أنشئ سراً باسم: <code className="text-amber-300 font-mono">GOOGLE_MAPS_PLATFORM_KEY</code></div>
                    <div>3. الصق المفتاح واضغط Enter للتحديث التلقائي</div>
                  </div>

                  <button
                    onClick={() => setMapEngine('leaflet')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {isRtl ? 'التبديل الفوري لمحرّك OpenStreetMap GIS المجاني' : 'Switch to OpenStreetMap GIS Engine'}
                  </button>
                </div>
              </div>
            )
          )}

          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-4 right-4 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-lg text-xs space-y-2 pointer-events-auto">
            <h5 className="font-extrabold text-[11px] text-slate-800 dark:text-zinc-200 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRtl ? 'مفتاح الخريطة الميدانية' : 'Map Field Legend'}</span>
            </h5>

            <div className="space-y-1 text-[10px] font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
                <span>{isRtl ? 'مشروع نشط ميدانياً' : 'Active Field Project'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
                <span>{isRtl ? 'مشروع قيد التخطيط' : 'Planning Stage Project'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 border border-white"></span>
                <span>{isRtl ? 'بؤرة تركز نازحين / أيتام' : 'Beneficiary Concentration Hotspot'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500"></span>
                <span>{isRtl ? 'نطاق التغطية الميداني' : 'Field Buffer Radius Zone'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Governorate Spatial Breakdown & Field Hotspots Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Governorate Leaderboard */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">
                {isRtl ? 'توزيع المستفيدين والتمويل حسب المحافظات' : 'Governorate Field Breakdown'}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 font-bold">
              YEMEN GOVERNORATES
            </span>
          </div>

          <div className="space-y-3">
            {[
              { nameAr: 'تعز', nameEn: 'Taiz', count: 38400, projectsCount: 6, budget: 2450000, color: 'bg-emerald-500' },
              { nameAr: 'مأرب', nameEn: 'Marib', count: 32100, projectsCount: 5, budget: 1980000, color: 'bg-amber-500' },
              { nameAr: 'عدن', nameEn: 'Aden', count: 29800, projectsCount: 4, budget: 1650000, color: 'bg-blue-500' },
              { nameAr: 'الحديدة', nameEn: 'Al-Hodeidah', count: 24200, projectsCount: 3, budget: 1200000, color: 'bg-rose-500' },
              { nameAr: 'حضرموت', nameEn: 'Hadramout', count: 18000, projectsCount: 2, budget: 850000, color: 'bg-purple-500' },
            ].map(gov => (
              <div key={gov.nameEn} className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200/60 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${gov.color}`}></span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{isRtl ? gov.nameAr : gov.nameEn}</span>
                    <span className="text-[10px] text-zinc-400">({gov.projectsCount} {isRtl ? 'مشاريع' : 'projects'})</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400">{gov.count.toLocaleString()} {isRtl ? 'مستفيد' : 'benefs'}</span>
                    <span className="text-slate-600 dark:text-zinc-300">${(gov.budget / 1000).toLocaleString()}k</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${gov.color} rounded-full`}
                    style={{ width: `${Math.min(100, (gov.count / 40000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Vulnerability Hotspots Inspector */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">
                {isRtl ? 'تجمعات النازحين والأيتام الأكثر احتياجاً' : 'High Density Vulnerability Hotspots'}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200">
              PRIORITY HOTSPOTS
            </span>
          </div>

          <div className="space-y-3">
            {BENEFICIARY_HOTSPOTS.slice(0, 4).map(hs => (
              <div 
                key={hs.id} 
                onClick={() => {
                  triggerHaptic('medium');
                  setSelectedHotspotPin(hs);
                }}
                className="p-3 bg-slate-50 dark:bg-zinc-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl border border-slate-200/60 dark:border-zinc-800 transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[9px] font-black rounded ${
                      hs.risk === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {hs.risk === 'critical' ? (isRtl ? 'حرج جداً' : 'Critical') : (isRtl ? 'أولوية قصوى' : 'High Priority')}
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {isRtl ? hs.nameAr : hs.nameEn}
                    </h4>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-bold">
                    {isRtl ? 'مجال الخدمة المطلوب:' : 'Required Domain:'} {hs.category}
                  </div>
                </div>

                <div className="text-right rtl:text-left shrink-0">
                  <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400 block">
                    {hs.count.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-zinc-400 block">{isRtl ? 'مستفيد مسجل' : 'Registered'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Project Inspector Dialog Modal */}
      {selectedProjectPin && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedProjectPin(null)}
              className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-1 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono text-xs font-bold rounded">
                {selectedProjectPin.code}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                {selectedProjectPin.status_code === 'active' ? (isRtl ? 'نشط ميدانياً' : 'Active') : (isRtl ? 'مكتمل' : 'Completed')}
              </span>
            </div>

            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {isRtl ? selectedProjectPin.name_ar : (selectedProjectPin.name_en || selectedProjectPin.name_ar)}
            </h3>

            <div className="space-y-2 text-xs text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
              <div className="flex justify-between">
                <span>📍 {isRtl ? 'الموقع والمحافظة:' : 'Location:'}</span>
                <strong className="font-extrabold">{selectedProjectPin.location_name || (isRtl ? 'الميدان' : 'Field')}</strong>
              </div>
              <div className="flex justify-between">
                <span>💰 {isRtl ? 'الموازنة المقررة:' : 'Budget:'}</span>
                <strong className="font-mono font-extrabold text-amber-600">${parseFloat(selectedProjectPin.budget || '0').toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>👥 {isRtl ? 'المستفيدون المستهدفون:' : 'Beneficiaries:'}</span>
                <strong className="font-mono font-extrabold text-emerald-600">{(selectedProjectPin.actual_beneficiaries || selectedProjectPin.target_beneficiaries || 1500).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>📊 {isRtl ? 'نسبة الإنجاز الميداني:' : 'Progress:'}</span>
                <strong className="font-mono font-extrabold">{selectedProjectPin.progress_percent || '0'}%</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedProjectPin(null)}
                className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isRtl ? 'إغلاق المعاينة' : 'Close Inspector'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GeospatialDashboardView;
