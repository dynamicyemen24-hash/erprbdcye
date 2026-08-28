import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  MapPin,
  ChevronDown,
  Compass,
  Check,
  Building,
  Navigation,
  Copy,
  ExternalLink
} from 'lucide-react';
import {
  GLOBAL_COUNTRIES_DIRECTORY,
  getCountryProfile,
  CountryAdministrativeProfile,
  StructuredAddress,
  formatFullAddressString
} from '../../core/data/globalAddressData';
import SmartAutocompleteInput from './SmartAutocompleteInput';
import InteractiveGlobalMapPicker from './InteractiveGlobalMapPicker';

interface GlobalAddressCascadePickerProps {
  countryCode?: string;
  stateGovernorate?: string;
  district?: string;
  subDistrict?: string;
  detailedAddress?: string;
  gpsLatitude?: number | string;
  gpsLongitude?: number | string;
  lang?: 'ar' | 'en';
  showGpsFields?: boolean;
  required?: boolean;
  disabled?: boolean;
  onChange: (address: {
    countryCode: string;
    countryNameAr: string;
    stateGovernorate: string;
    district: string;
    subDistrict: string;
    detailedAddress: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    formattedAddress: string;
  }) => void;
}

export default function GlobalAddressCascadePicker({
  countryCode = 'YE',
  stateGovernorate = '',
  district = '',
  subDistrict = '',
  detailedAddress = '',
  gpsLatitude = '',
  gpsLongitude = '',
  lang = 'ar',
  showGpsFields = false,
  required = false,
  disabled = false,
  onChange
}: GlobalAddressCascadePickerProps) {
  const isRtl = lang === 'ar';

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(countryCode || 'YE');
  const [selectedStateGov, setSelectedStateGov] = useState<string>(stateGovernorate || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(district || '');
  const [selectedSubDistrict, setSelectedSubDistrict] = useState<string>(subDistrict || '');
  const [detailedStreet, setDetailedStreet] = useState<string>(detailedAddress || '');
  const [lat, setLat] = useState<string>(gpsLatitude ? String(gpsLatitude) : '');
  const [lng, setLng] = useState<string>(gpsLongitude ? String(gpsLongitude) : '');
  const [showMap, setShowMap] = useState<boolean>(showGpsFields);
  const [copied, setCopied] = useState(false);

  // Sync internal state when external props change
  useEffect(() => {
    if (countryCode && countryCode !== selectedCountryCode) setSelectedCountryCode(countryCode);
  }, [countryCode]);

  useEffect(() => {
    if (stateGovernorate !== undefined && stateGovernorate !== selectedStateGov) setSelectedStateGov(stateGovernorate);
  }, [stateGovernorate]);

  useEffect(() => {
    if (district !== undefined && district !== selectedDistrict) setSelectedDistrict(district);
  }, [district]);

  useEffect(() => {
    if (subDistrict !== undefined && subDistrict !== selectedSubDistrict) setSelectedSubDistrict(subDistrict);
  }, [subDistrict]);

  useEffect(() => {
    if (detailedAddress !== undefined && detailedAddress !== detailedStreet) setDetailedStreet(detailedAddress);
  }, [detailedAddress]);

  // Current Country Profile
  const currentCountry: CountryAdministrativeProfile = useMemo(() => {
    return getCountryProfile(selectedCountryCode);
  }, [selectedCountryCode]);

  // Available Level 1 (States/Governorates) in selected country
  const stateGovernorateOptions = useMemo(() => {
    return currentCountry.states_governorates.map(sg => isRtl ? sg.name_ar : sg.name_en);
  }, [currentCountry, isRtl]);

  // Current Level 1 Object
  const currentStateGovObj = useMemo(() => {
    return currentCountry.states_governorates.find(
      sg => sg.name_ar === selectedStateGov || sg.name_en.toLowerCase() === selectedStateGov.toLowerCase()
    );
  }, [currentCountry, selectedStateGov]);

  // Available Level 2 (Districts/Cities) in selected Level 1
  const districtOptions = useMemo(() => {
    if (currentStateGovObj) {
      return currentStateGovObj.districts.map(d => isRtl ? d.name_ar : d.name_en);
    }
    // Fallback: all districts in country
    return currentCountry.states_governorates.flatMap(sg => sg.districts.map(d => isRtl ? d.name_ar : d.name_en));
  }, [currentStateGovObj, currentCountry, isRtl]);

  // Current Level 2 Object
  const currentDistrictObj = useMemo(() => {
    if (!currentStateGovObj) return null;
    return currentStateGovObj.districts.find(
      d => d.name_ar === selectedDistrict || d.name_en.toLowerCase() === selectedDistrict.toLowerCase()
    );
  }, [currentStateGovObj, selectedDistrict]);

  // Available Level 3 (Sub-districts / Neighborhoods / Villages)
  const subDistrictOptions = useMemo(() => {
    if (currentDistrictObj && currentDistrictObj.sub_addresses) {
      return currentDistrictObj.sub_addresses;
    }
    return [];
  }, [currentDistrictObj]);

  // Determine dynamic map center based on selected location
  const mapCenter = useMemo(() => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0) {
      return { lat: parsedLat, lng: parsedLng, zoom: 14 };
    }
    if (currentDistrictObj?.lat && currentDistrictObj?.lng) {
      return { lat: currentDistrictObj.lat, lng: currentDistrictObj.lng, zoom: 13 };
    }
    if (currentStateGovObj?.lat && currentStateGovObj?.lng) {
      return { lat: currentStateGovObj.lat, lng: currentStateGovObj.lng, zoom: currentStateGovObj.zoom || 11 };
    }
    return { lat: currentCountry.lat, lng: currentCountry.lng, zoom: currentCountry.default_zoom || 6 };
  }, [lat, lng, currentDistrictObj, currentStateGovObj, currentCountry]);

  // Trigger parent onChange whenever fields update
  const emitChange = (updates: {
    cCode?: string;
    sGov?: string;
    dist?: string;
    subDist?: string;
    street?: string;
    gLat?: string;
    gLng?: string;
  }) => {
    const finalCCode = updates.cCode !== undefined ? updates.cCode : selectedCountryCode;
    const finalProfile = getCountryProfile(finalCCode);
    const finalSGov = updates.sGov !== undefined ? updates.sGov : selectedStateGov;
    const finalDist = updates.dist !== undefined ? updates.dist : selectedDistrict;
    const finalSubDist = updates.subDist !== undefined ? updates.subDist : selectedSubDistrict;
    const finalStreet = updates.street !== undefined ? updates.street : detailedStreet;
    const finalLatStr = updates.gLat !== undefined ? updates.gLat : lat;
    const finalLngStr = updates.gLng !== undefined ? updates.gLng : lng;

    const formatted = formatFullAddressString({
      country_name_ar: finalProfile.name_ar,
      state_governorate_ar: finalSGov,
      district_ar: finalDist,
      sub_district_ar: finalSubDist,
      detailed_street_ar: finalStreet
    });

    onChange({
      countryCode: finalCCode,
      countryNameAr: finalProfile.name_ar,
      stateGovernorate: finalSGov,
      district: finalDist,
      subDistrict: finalSubDist,
      detailedAddress: finalStreet,
      gpsLatitude: finalLatStr ? parseFloat(finalLatStr) : undefined,
      gpsLongitude: finalLngStr ? parseFloat(finalLngStr) : undefined,
      formattedAddress: formatted
    });
  };

  const handleCountryChange = (newCode: string) => {
    setSelectedCountryCode(newCode);
    setSelectedStateGov('');
    setSelectedDistrict('');
    setSelectedSubDistrict('');
    emitChange({
      cCode: newCode,
      sGov: '',
      dist: '',
      subDist: ''
    });
  };

  const handleStateGovChange = (val: string) => {
    setSelectedStateGov(val);
    setSelectedDistrict('');
    setSelectedSubDistrict('');
    emitChange({
      sGov: val,
      dist: '',
      subDist: ''
    });
  };

  const handleDistrictChange = (val: string) => {
    setSelectedDistrict(val);
    setSelectedSubDistrict('');
    emitChange({
      dist: val,
      subDist: ''
    });
  };

  const handleSubDistrictChange = (val: string) => {
    setSelectedSubDistrict(val);
    emitChange({ subDist: val });
  };

  const handleDetailedStreetChange = (val: string) => {
    setDetailedStreet(val);
    emitChange({ street: val });
  };

  const handleCopyFormatted = () => {
    const formatted = formatFullAddressString({
      country_name_ar: currentCountry.name_ar,
      state_governorate_ar: selectedStateGov,
      district_ar: selectedDistrict,
      sub_district_ar: selectedSubDistrict,
      detailed_street_ar: detailedStreet
    });
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedPreview = formatFullAddressString({
    country_name_ar: currentCountry.name_ar,
    state_governorate_ar: selectedStateGov,
    district_ar: selectedDistrict,
    sub_district_ar: selectedSubDistrict,
    detailed_street_ar: detailedStreet
  });

  return (
    <div className="space-y-3.5 bg-slate-50/70 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
      {/* 1. Country & Level 1 (State/Governorate) Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Country Selector */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
            <label className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isRtl ? 'الدولة' : 'Country'}</span>
              {required && <span className="text-rose-500">*</span>}
            </label>
            <span className="font-mono text-[9px] text-slate-400">{currentCountry.dial_code}</span>
          </div>
          <div className="relative">
            <select
              value={selectedCountryCode}
              disabled={disabled}
              onChange={e => handleCountryChange(e.target.value)}
              className="w-full py-2 px-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-black text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
            >
              {GLOBAL_COUNTRIES_DIRECTORY.map(c => (
                <option key={c.iso2} value={c.iso2}>
                  {c.flag_emoji} {isRtl ? c.name_ar : c.name_en} ({c.dial_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Level 1: State / Governorate (Adaptive label) */}
        <SmartAutocompleteInput
          label={isRtl ? currentCountry.level1_label_ar : currentCountry.level1_label_en}
          value={selectedStateGov}
          onChange={handleStateGovChange}
          options={stateGovernorateOptions}
          placeholder={isRtl ? `اختر أو اكتب ${currentCountry.level1_label_ar}...` : `Select ${currentCountry.level1_label_en}`}
          required={required}
          disabled={disabled}
          isRtl={isRtl}
          badgeText={currentCountry.iso2}
        />
      </div>

      {/* 2. Level 2 (District/City) & Level 3 (Sub-district/Neighborhood) Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Level 2: District / City */}
        <SmartAutocompleteInput
          label={isRtl ? currentCountry.level2_label_ar : currentCountry.level2_label_en}
          value={selectedDistrict}
          onChange={handleDistrictChange}
          options={districtOptions}
          placeholder={isRtl ? `اختر أو اكتب ${currentCountry.level2_label_ar}...` : `Select ${currentCountry.level2_label_en}`}
          required={required}
          disabled={disabled}
          isRtl={isRtl}
          badgeText={selectedStateGov || undefined}
        />

        {/* Level 3: Sub-district / Village / Neighborhood */}
        <SmartAutocompleteInput
          label={isRtl ? currentCountry.level3_label_ar : currentCountry.level3_label_en}
          value={selectedSubDistrict}
          onChange={handleSubDistrictChange}
          options={subDistrictOptions}
          placeholder={isRtl ? `اختر أو اكتب ${currentCountry.level3_label_ar}...` : `Select ${currentCountry.level3_label_en}`}
          disabled={disabled}
          isRtl={isRtl}
          badgeText={subDistrictOptions.length > 0 ? `${subDistrictOptions.length} اقتراح` : undefined}
        />
      </div>

      {/* 3. Level 4: Detailed Street Address & Landmark */}
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isRtl ? 'الشارع والقرية والمعلم البارز (العنوان التفصيلي)' : 'Detailed Street, Landmark & Building'}</span>
        </label>
        <input
          type="text"
          disabled={disabled}
          value={detailedStreet}
          onChange={e => handleDetailedStreetChange(e.target.value)}
          placeholder={isRtl ? 'مثال: حارة النصر، بجوار مدرسة خالد بن الوليد، مبنى رقم 4' : 'Street name, landmark, building number'}
          className="w-full py-2 px-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
        />
      </div>

      {/* 4. Interactive Map & GPS Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 transition-colors cursor-pointer py-1"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {showMap 
                ? (isRtl ? 'إخفاء الخريطة التفاعلية' : 'Hide Interactive Map') 
                : (isRtl ? '🗺️ تحديد الموقع على الخريطة العالمية المباشرة (GPS)' : '🗺️ Pick on Global Interactive Map')}
            </span>
          </button>

          {lat && lng && (
            <span className="font-mono text-[10px] text-slate-500 font-bold">
              {lat}, {lng}
            </span>
          )}
        </div>

        {showMap && (
          <div className="space-y-2 animate-fade-in">
            <InteractiveGlobalMapPicker
              latitude={mapCenter.lat}
              longitude={mapCenter.lng}
              zoom={mapCenter.zoom}
              height="260px"
              lang={lang}
              readOnly={disabled}
              locationLabel={formattedPreview || (isRtl ? 'موقع المستفيد / المشروع' : 'Field Site')}
              onCoordinatesChange={(coords) => {
                setLat(String(coords.lat));
                setLng(String(coords.lng));
                emitChange({ gLat: String(coords.lat), gLng: String(coords.lng) });
              }}
            />

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase">{isRtl ? 'خط العرض (Latitude)' : 'Latitude'}</label>
                <input
                  type="number"
                  step="any"
                  disabled={disabled}
                  value={lat}
                  onChange={e => {
                    setLat(e.target.value);
                    emitChange({ gLat: e.target.value });
                  }}
                  placeholder="13.5795"
                  className="w-full py-1.5 px-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold focus:outline-none"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase">{isRtl ? 'خط الطول (Longitude)' : 'Longitude'}</label>
                <input
                  type="number"
                  step="any"
                  disabled={disabled}
                  value={lng}
                  onChange={e => {
                    setLng(e.target.value);
                    emitChange({ gLng: e.target.value });
                  }}
                  placeholder="44.0201"
                  className="w-full py-1.5 px-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Live Formatted Address Preview & One-Click Copy */}
      {formattedPreview && (
        <div className="flex items-center justify-between gap-2 p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-base shrink-0">{currentCountry.flag_emoji}</span>
            <span className="font-bold text-emerald-900 dark:text-emerald-200 truncate" title={formattedPreview}>
              {formattedPreview}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyFormatted}
            className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer shrink-0"
            title={isRtl ? 'نسخ العنوان المنسق' : 'Copy address'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
