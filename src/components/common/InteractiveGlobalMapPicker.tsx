import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Compass,
  Layers,
  MapPin,
  Crosshair,
  ExternalLink,
  Copy,
  Check,
  Globe2,
  Maximize2
} from 'lucide-react';

// Custom Pin Marker Icon
const customPinIcon = L.divIcon({
  className: 'custom-map-picker-pin',
  html: `
    <div style="
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

interface InteractiveGlobalMapPickerProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  height?: string;
  lang?: 'ar' | 'en';
  readOnly?: boolean;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  locationLabel?: string;
}

// Map Click Listener Component
function MapEventsHandler({
  onSelect,
  disabled
}: {
  onSelect: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

// Smooth Map Recenter Component
function MapRecenter({
  center,
  zoom
}: {
  center: [number, number];
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom(), {
      duration: 1.2
    });
  }, [center[0], center[1], zoom, map]);
  return null;
}

export default function InteractiveGlobalMapPicker({
  latitude = 15.3694, // Default: Sana'a, Yemen
  longitude = 44.1910,
  zoom = 12,
  height = '320px',
  lang = 'ar',
  readOnly = false,
  onCoordinatesChange,
  locationLabel
}: InteractiveGlobalMapPickerProps) {
  const isRtl = lang === 'ar';

  const [currentLat, setCurrentLat] = useState<number>(latitude);
  const [currentLng, setCurrentLng] = useState<number>(longitude);
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite' | 'voyager'>('streets');
  const [copied, setCopied] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Sync state if external coordinates change
  useEffect(() => {
    if (latitude && latitude !== currentLat) setCurrentLat(latitude);
    if (longitude && longitude !== currentLng) setCurrentLng(longitude);
  }, [latitude, longitude]);

  const tileLayerUrls = {
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  };

  const tileAttributions = {
    streets: '&copy; OpenStreetMap contributors',
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    voyager: '&copy; <a href="https://carto.com/">CARTO</a>'
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));
    setCurrentLat(roundedLat);
    setCurrentLng(roundedLng);
    onCoordinatesChange?.({ lat: roundedLat, lng: roundedLng });
  };

  // Browser GPS Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert(isRtl ? 'المتصفح لا يدعم خاصية تحديد الموقع الجغرافي' : 'Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false);
        handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
      },
      err => {
        setIsLocating(false);
        alert(isRtl ? 'تعذر جلب موقعك الجغرافي الحالي. يرجى التأكد من تفعيل أذونات الموقع.' : 'Unable to retrieve location.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${currentLat}, ${currentLng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps?q=${currentLat},${currentLng}`;
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${currentLat}&mlon=${currentLng}#map=16/${currentLat}/${currentLng}`;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm bg-slate-100 dark:bg-zinc-950">
      {/* 1. Map Toolbar (Layer switcher, locate me, external links) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-md">
        {/* Layer Toggle */}
        <button
          type="button"
          onClick={() => setMapLayer(mapLayer === 'streets' ? 'satellite' : mapLayer === 'satellite' ? 'voyager' : 'streets')}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-700 dark:text-zinc-300 transition-colors flex items-center gap-1 text-[10px] font-extrabold cursor-pointer"
          title={isRtl ? 'تبديل طبقة الخريطة' : 'Switch Map Layer'}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {mapLayer === 'streets' ? (isRtl ? 'شوارع' : 'Streets') : mapLayer === 'satellite' ? (isRtl ? 'أقمار صناعية' : 'Satellite') : (isRtl ? 'توضيحية' : 'Voyager')}
          </span>
        </button>

        {/* Locate Me */}
        {!readOnly && (
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-indigo-600 transition-colors flex items-center gap-1 text-[10px] font-extrabold cursor-pointer"
            title={isRtl ? 'تحديد موقعي الحالي GPS' : 'Locate My Position'}
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isRtl ? 'موقعي' : 'Locate'}</span>
          </button>
        )}

        {/* Google Maps link */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-600 dark:text-zinc-300 transition-colors flex items-center gap-1 text-[10px] font-extrabold"
          title="Open in Google Maps"
        >
          <Globe2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Google</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* 2. Interactive Leaflet Map Container */}
      <div style={{ height }}>
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={zoom}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          zoomControl={false}
        >
          <TileLayer
            attribution={tileAttributions[mapLayer]}
            url={tileLayerUrls[mapLayer]}
            maxZoom={19}
          />
          <MapEventsHandler onSelect={handleLocationSelect} disabled={readOnly} />
          <MapRecenter center={[currentLat, currentLng]} zoom={zoom} />
          <Marker position={[currentLat, currentLng]} icon={customPinIcon}>
            <Popup>
              <div className="p-1 text-center font-sans">
                <div className="font-extrabold text-xs text-slate-900">{locationLabel || (isRtl ? 'الموقع المحدد' : 'Selected Location')}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  {currentLat}, {currentLng}
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* 3. Bottom Coordinates & Instructions Strip */}
      <div className="p-2.5 bg-white/95 dark:bg-zinc-900/95 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-mono font-bold text-slate-800 dark:text-zinc-200 text-[11px]">
            LAT: {currentLat} • LNG: {currentLng}
          </span>
          <button
            type="button"
            onClick={handleCopyCoords}
            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500 cursor-pointer"
            title={isRtl ? 'نسخ الإحداثيات' : 'Copy Coordinates'}
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {!readOnly && (
          <span className="text-[10px] text-slate-400 italic">
            {isRtl ? 'انقر على أي نقطة في الخريطة لتثبيت الموقع بدقة' : 'Click anywhere on map to pin coordinates'}
          </span>
        )}
      </div>
    </div>
  );
}
