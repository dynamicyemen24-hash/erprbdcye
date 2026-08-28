// Global Multi-Country Hierarchical Address Architecture
// UAMEX ERP™ - Standardized Geographic & Administrative Divisions

export interface SubAddressUnit {
  id: string;
  name_ar: string;
  name_en: string;
  type: 'neighborhood' | 'village' | 'sub_district_uzlah' | 'camp_cluster';
}

export interface DistrictDivision {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  lat?: number;
  lng?: number;
  sub_addresses?: string[]; // أحياء / قرى / عزل
}

export interface StateGovernorateDivision {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  districts: DistrictDivision[];
}

export interface CountryAdministrativeProfile {
  iso2: string; // e.g. YE, SA, AE, QA, KW, OM, EG, JO, TR, SD, SO, SY, PS
  iso3: string;
  dial_code: string;
  flag_emoji: string;
  name_ar: string;
  name_en: string;
  currency_code: string;
  currency_symbol_ar: string;
  lat: number;
  lng: number;
  default_zoom: number;
  level1_label_ar: string; // المحافظة / المنطقة / الإمارة / الولاية
  level1_label_en: string;
  level2_label_ar: string; // المديرية / المحافظة / المدينة / البلدية
  level2_label_en: string;
  level3_label_ar: string; // العزلة / الحي / القرية / القطاع
  level3_label_en: string;
  states_governorates: StateGovernorateDivision[];
}

export interface StructuredAddress {
  country_code: string;
  country_name_ar: string;
  state_governorate_ar: string;
  district_ar: string;
  sub_district_ar?: string;
  detailed_street_ar: string;
  postal_code?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  formatted_address: string;
}

export const GLOBAL_COUNTRIES_DIRECTORY: CountryAdministrativeProfile[] = [
  {
    iso2: 'YE',
    iso3: 'YEM',
    dial_code: '+967',
    flag_emoji: '🇾🇪',
    name_ar: 'الجمهورية اليمنية',
    name_en: 'Yemen',
    currency_code: 'YER',
    currency_symbol_ar: 'ر.ي',
    lat: 15.5527,
    lng: 48.5164,
    default_zoom: 6,
    level1_label_ar: 'المحافظة',
    level1_label_en: 'Governorate',
    level2_label_ar: 'المديرية',
    level2_label_en: 'District',
    level3_label_ar: 'العزلة / الحي / القرية',
    level3_label_en: 'Sub-District / Village',
    states_governorates: [
      {
        id: 'ye-sanaa-city',
        code: 'YE-SN-CT',
        name_ar: 'أمانة العاصمة',
        name_en: 'Sana\'a City',
        lat: 15.3694,
        lng: 44.1910,
        zoom: 12,
        districts: [
          { id: 'ye-sn-1', code: 'SABAEEN', name_ar: 'السبعين', name_en: 'Al-Sabeen', lat: 15.3182, lng: 44.2052, sub_addresses: ['حي القادسية', 'حي حدة', 'حي الأصبحي', 'حي بيت بوس', 'حي دار سلم'] },
          { id: 'ye-sn-2', code: 'WAHDA', name_ar: 'الوحدة', name_en: 'Al-Wahdah', lat: 15.3421, lng: 44.1950, sub_addresses: ['حي الصافية الجنوبية', 'حي حزيز', 'حي البليلي'] },
          { id: 'ye-sn-3', code: 'TAHRIR', name_ar: 'التحرير', name_en: 'Al-Tahrir', lat: 15.3551, lng: 44.2060, sub_addresses: ['حي التحرير', 'حي القاع', 'حي باب القاع'] },
          { id: 'ye-sn-4', code: 'MOEEN', name_ar: 'معين', name_en: 'Mae\'en', lat: 15.3789, lng: 44.1720, sub_addresses: ['حي مذبح', 'حي شملان', 'حي السنينة', 'حي الدائري'] },
          { id: 'ye-sn-5', code: 'THAWRA', name_ar: 'الثورة', name_en: 'Al-Thawrah', lat: 15.3912, lng: 44.2150, sub_addresses: ['حي الجراف', 'حي الحصبة', 'حي صوفان'] },
          { id: 'ye-sn-6', code: 'SHUOUB', name_ar: 'شُعوب', name_en: 'Shu\'aub', lat: 15.3725, lng: 44.2301, sub_addresses: ['حي الحافة', 'حي هبرة', 'حي الدجاج'] },
          { id: 'ye-sn-7', code: 'BANI_HARITH', name_ar: 'بني الحارث', name_en: 'Bani Al-Harith', lat: 15.4410, lng: 44.2280, sub_addresses: ['حي المطار', 'حي الروضة', 'حي دارس', 'حي صرف'] },
          { id: 'ye-sn-8', code: 'OLD_SANAA', name_ar: 'صنعاء القديمة', name_en: 'Old Sana\'a', lat: 15.3533, lng: 44.2147, sub_addresses: ['حارة الجامع الكبير', 'حارة سوق الملح', 'حارة الفليحي'] }
        ]
      },
      {
        id: 'ye-taiz',
        code: 'YE-TA',
        name_ar: 'تعز',
        name_en: 'Taiz',
        lat: 13.5795,
        lng: 44.0201,
        zoom: 12,
        districts: [
          { id: 'ye-ta-1', code: 'SABIR_MAWADIM', name_ar: 'صبر الموادم', name_en: 'Sabir Al-Mawadim', lat: 13.5320, lng: 44.0512, sub_addresses: ['قرية المشرعة', 'عزلة حزر', 'عزلة البريهة', 'قرية ذي النمر', 'عزلة مرعيت'] },
          { id: 'ye-ta-2', code: 'MASHRAA_HADNAN', name_ar: 'مشرعة وحدنان', name_en: 'Mashra\'a & Hadnan', lat: 13.5180, lng: 44.0320, sub_addresses: ['قرية حدنان', 'قرية المشرعة', 'عزلة ذي دومان'] },
          { id: 'ye-ta-3', code: 'MUZAFFAR', name_ar: 'المظفر', name_en: 'Al-Muzaffar', lat: 13.5780, lng: 44.0050, sub_addresses: ['حي النسيم', 'حي المسبح', 'حي صينة', 'حي باب موسى'] },
          { id: 'ye-ta-4', code: 'QAHIRA', name_ar: 'القاهرة', name_en: 'Al-Qahirah', lat: 13.5710, lng: 44.0250, sub_addresses: ['حي الثورة', 'حي المجلية', 'حي الكوثر', 'حي الجمهوري'] },
          { id: 'ye-ta-5', code: 'SALAH', name_ar: 'صالة', name_en: 'Salah', lat: 13.5850, lng: 44.0410, sub_addresses: ['حي الجحملية', 'حي صالة القديمة', 'حي الكمب'] },
          { id: 'ye-ta-6', code: 'SHAMAYTIN', name_ar: 'الشمايتين', name_en: 'Ash-Shamaytayn', lat: 13.2150, lng: 44.1350, sub_addresses: ['مدينة التربة', 'عزلة دبع الداخل', 'عزلة الأصابح', 'عزلة الزعازع'] },
          { id: 'ye-ta-7', code: 'MAAFIR', name_ar: 'المعافر', name_en: 'Al-Ma\'afer', lat: 13.3620, lng: 44.0150, sub_addresses: ['سوق النشمة', 'عزلة السواء', 'عزلة الصنة'] },
          { id: 'ye-ta-8', code: 'MOKHA', name_ar: 'المخاء', name_en: 'Al-Mokha', lat: 13.3180, lng: 43.2480, sub_addresses: ['مدينة المخاء', 'ميناء المخاء', 'عزلة الزهاري', 'عزلة يختل'] }
        ]
      },
      {
        id: 'ye-aden',
        code: 'YE-AD',
        name_ar: 'عدن',
        name_en: 'Aden',
        lat: 12.7855,
        lng: 45.0187,
        zoom: 12,
        districts: [
          { id: 'ye-ad-1', code: 'CRATER', name_ar: 'صيرة (كريتر)', name_en: 'Crater', lat: 12.7790, lng: 45.0360, sub_addresses: ['حي الميدان', 'حي الخساف', 'حي القطيع', 'حي العيدروس'] },
          { id: 'ye-ad-2', code: 'MUALLA', name_ar: 'المعلا', name_en: 'Al-Mualla', lat: 12.7950, lng: 45.0110, sub_addresses: ['الشارع الرئيسي', 'حي الكبسة', 'حي حافون'] },
          { id: 'ye-ad-3', code: 'TAWAHI', name_ar: 'التواهي', name_en: 'Al-Tawahi', lat: 12.7920, lng: 44.9850, sub_addresses: ['حي البنجسار', 'حي جبل التلال', 'حي القلوعة'] },
          { id: 'ye-ad-4', code: 'KHOR_MAKSAR', name_ar: 'خور مكسر', name_en: 'Khor Maksar', lat: 12.8220, lng: 45.0310, sub_addresses: ['حي السلام', 'حي الأحمدي', 'حي الشابات', 'حي الرشيد'] },
          { id: 'ye-ad-5', code: 'MANSOURA', name_ar: 'المنصورة', name_en: 'Al-Mansoura', lat: 12.8520, lng: 44.9960, sub_addresses: ['حي كابوتا', 'حي عبد العزيز', 'حي ريمي', 'حي القاهرة'] },
          { id: 'ye-ad-6', code: 'SHEIKH_OTHMAN', name_ar: 'الشيخ عثمان', name_en: 'Sheikh Othman', lat: 12.8710, lng: 45.0020, sub_addresses: ['حي السيلة', 'حي الممدارة', 'حي عبد القوي'] },
          { id: 'ye-ad-7', code: 'DAR_SAAD', name_ar: 'دار سعد', name_en: 'Dar Sa\'ad', lat: 12.8950, lng: 44.9910, sub_addresses: ['حي البساتين', 'حي الفلاح', 'حي اللحوم'] },
          { id: 'ye-ad-8', code: 'BURAIQAH', name_ar: 'البريقة', name_en: 'Al-Buraiqeh', lat: 12.7910, lng: 44.8620, sub_addresses: ['حي كود النمر', 'حي الفارسي', 'حي صلاح الدين', 'مدينة الشعب'] }
        ]
      },
      {
        id: 'ye-hodeidah',
        code: 'YE-HD',
        name_ar: 'الحديدة',
        name_en: 'Hodeidah',
        lat: 14.7978,
        lng: 42.9545,
        zoom: 12,
        districts: [
          { id: 'ye-hd-1', code: 'HALI', name_ar: 'الحالي', name_en: 'Al-Hali', lat: 14.8110, lng: 42.9690, sub_addresses: ['حي الصديقية', 'حي زايد', 'حي سبعة يوليو'] },
          { id: 'ye-hd-2', code: 'HAWK', name_ar: 'الحوك', name_en: 'Al-Hawk', lat: 14.7820, lng: 42.9520, sub_addresses: ['حي غليل', 'حي الربصة', 'حي المحطة'] },
          { id: 'ye-hd-3', code: 'MINA', name_ar: 'الميناء', name_en: 'Al-Mina', lat: 14.8050, lng: 42.9410, sub_addresses: ['حي الصالحية', 'حي التجاري', 'حي الكورنيش'] },
          { id: 'ye-hd-4', code: 'BAJIL', name_ar: 'باجل', name_en: 'Bajil', lat: 15.0580, lng: 43.2850, sub_addresses: ['مدينة باجل', 'عزلة الضامرة', 'عزلة الجمعة'] },
          { id: 'ye-hd-5', code: 'BAYT_FAQIH', name_ar: 'بيت الفقيه', name_en: 'Bayt Al-Faqih', lat: 14.5180, lng: 43.3210, sub_addresses: ['مدينة بيت الفقيه', 'عزلة الحسينية'] },
          { id: 'ye-hd-6', code: 'ZABID', name_ar: 'زبيد', name_en: 'Zabid', lat: 14.1950, lng: 43.3150, sub_addresses: ['مدينة زبيد التاريخية', 'عزلة التريبة'] }
        ]
      },
      {
        id: 'ye-hadramout',
        code: 'YE-HM',
        name_ar: 'حضرموت',
        name_en: 'Hadramout',
        lat: 14.5425,
        lng: 49.1242,
        zoom: 10,
        districts: [
          { id: 'ye-hm-1', code: 'MUKALLA', name_ar: 'المكلا', name_en: 'Al-Mukalla', lat: 14.5360, lng: 49.1280, sub_addresses: ['حي السلام', 'حي الشرج', 'حي الديس', 'حي فوة', 'حي روكب'] },
          { id: 'ye-hm-2', code: 'SAYUN', name_ar: 'سيئون', name_en: 'Say\'un', lat: 15.9380, lng: 48.7890, sub_addresses: ['حي السوق', 'حي السحيل', 'حي مريمة', 'حي القرن'] },
          { id: 'ye-hm-3', code: 'TARIM', name_ar: 'تريم', name_en: 'Tarim', lat: 16.0520, lng: 48.9980, sub_addresses: ['حي عيديد', 'حي الخليف', 'حي السوق', 'عزلة عينات'] },
          { id: 'ye-hm-4', code: 'SHIHR', name_ar: 'الشحر', name_en: 'Ash-Shihr', lat: 14.7590, lng: 49.6080, sub_addresses: ['حي الخور', 'حي المحط', 'حي القرية'] },
          { id: 'ye-hm-5', code: 'DOAN', name_ar: 'دوعن', name_en: 'Daw\'an', lat: 15.1150, lng: 48.3520, sub_addresses: ['وادي دوعن الأيمن', 'وادي دوعن الأيسر', 'قرية الخريبة', 'قرية صيف'] }
        ]
      },
      {
        id: 'ye-marib',
        code: 'YE-MR',
        name_ar: 'مأرب',
        name_en: 'Marib',
        lat: 15.4714,
        lng: 45.3228,
        zoom: 11,
        districts: [
          { id: 'ye-mr-1', code: 'MARIB_CITY', name_ar: 'مدينة مأرب', name_en: 'Marib City', lat: 15.4650, lng: 45.3250, sub_addresses: ['حي السلام', 'حي الشركة', 'حي الزراعة', 'حي المطار القديم'] },
          { id: 'ye-mr-2', code: 'MARIB_VALLEY', name_ar: 'مأرب الوادي', name_en: 'Marib Valley', lat: 15.4380, lng: 45.3780, sub_addresses: ['مخيم الجفينة', 'منطقة الروضة', 'منطقة الفاو'] },
          { id: 'ye-mr-3', code: 'JOUBAH', name_ar: 'الجوبة', name_en: 'Al-Jubah', lat: 15.1950, lng: 45.3120, sub_addresses: ['عزلة يعرة', 'عزلة نجا', 'مخيم الوادي'] },
          { id: 'ye-mr-4', code: 'SIRWAH', name_ar: 'صرواح', name_en: 'Sirwah', lat: 15.4520, lng: 45.0150, sub_addresses: ['سوق صرواح', 'عزلة المحجزة'] }
        ]
      },
      {
        id: 'ye-ibb',
        code: 'YE-IB',
        name_ar: 'إب',
        name_en: 'Ibb',
        lat: 13.9754,
        lng: 44.1706,
        zoom: 12,
        districts: [
          { id: 'ye-ib-1', code: 'DHIHAR', name_ar: 'الظهار', name_en: 'Al-Dhihar', lat: 13.9850, lng: 44.1680, sub_addresses: ['حي المعاين', 'حي المحمول', 'حي الجامعة'] },
          { id: 'ye-ib-2', code: 'MASHNAH', name_ar: 'المشنة', name_en: 'Al-Mashnah', lat: 13.9680, lng: 44.1810, sub_addresses: ['حي المدينة القديمة', 'حي الصلبة', 'حي دار القدسي'] },
          { id: 'ye-ib-3', code: 'JIBLAH', name_ar: 'جبلة', name_en: 'Jiblah', lat: 13.9210, lng: 44.1480, sub_addresses: ['مدينة جبلة التاريخية', 'عزلة جبلة'] },
          { id: 'ye-ib-4', code: 'YARIM', name_ar: 'يريم', name_en: 'Yarim', lat: 14.2980, lng: 44.3790, sub_addresses: ['مدينة يريم', 'عزلة كتاب', 'ظفار يريم'] }
        ]
      }
    ]
  },
  {
    iso2: 'SA',
    iso3: 'SAU',
    dial_code: '+966',
    flag_emoji: '🇸🇦',
    name_ar: 'المملكة العربية السعودية',
    name_en: 'Saudi Arabia',
    currency_code: 'SAR',
    currency_symbol_ar: 'ر.س',
    lat: 23.8859,
    lng: 45.0792,
    default_zoom: 5,
    level1_label_ar: 'المنطقة',
    level1_label_en: 'Region',
    level2_label_ar: 'المحافظة / المدينة',
    level2_label_en: 'Governorate / City',
    level3_label_ar: 'الحي / المركز',
    level3_label_en: 'District / Center',
    states_governorates: [
      {
        id: 'sa-riyadh',
        code: 'SA-01',
        name_ar: 'منطقة الرياض',
        name_en: 'Riyadh Region',
        lat: 24.7136,
        lng: 46.6753,
        zoom: 10,
        districts: [
          { id: 'sa-ry-1', code: 'RIYADH_CITY', name_ar: 'مدينة الرياض', name_en: 'Riyadh City', lat: 24.7136, lng: 46.6753, sub_addresses: ['حي العليا', 'حي الملز', 'حي النخيل', 'حي الياسمين', 'حي الصحافة'] },
          { id: 'sa-ry-2', code: 'DIRIYAH', name_ar: 'محافظة الدرعية', name_en: 'Diriyah', lat: 24.7336, lng: 46.5742, sub_addresses: ['حي الطريف التاريخي', 'حي البجيري', 'حي الخالدية'] },
          { id: 'sa-ry-3', code: 'KHARJ', name_ar: 'محافظة الخرج', name_en: 'Al-Kharj', lat: 24.1554, lng: 47.3119, sub_addresses: ['حي الخزامى', 'حي البرج', 'حي السلام'] }
        ]
      },
      {
        id: 'sa-makkah',
        code: 'SA-02',
        name_ar: 'منطقة مكة المكرمة',
        name_en: 'Makkah Region',
        lat: 21.4225,
        lng: 39.8262,
        zoom: 10,
        districts: [
          { id: 'sa-mk-1', code: 'MAKKAH_CITY', name_ar: 'العاصمة المقدسة (مكة المكرمة)', name_en: 'Makkah City', lat: 21.4225, lng: 39.8262, sub_addresses: ['حي العزيزية', 'حي الشبيكة', 'حي العتيبية', 'حي بطحاء قريش'] },
          { id: 'sa-mk-2', code: 'JEDDAH', name_ar: 'محافظة جدة', name_en: 'Jeddah', lat: 21.5433, lng: 39.1728, sub_addresses: ['حي البلد التاريخي', 'حي الروضة', 'حي الحمراء', 'حي الشاطئ', 'حي السلامة'] },
          { id: 'sa-mk-3', code: 'TAIF', name_ar: 'محافظة الطائف', name_en: 'Taif', lat: 21.2854, lng: 40.4222, sub_addresses: ['حي الهدا', 'حي الشفا', 'حي شهار', 'حي الفيصلية'] }
        ]
      },
      {
        id: 'sa-madinah',
        code: 'SA-03',
        name_ar: 'منطقة المدينة المنورة',
        name_en: 'Madinah Region',
        lat: 24.4672,
        lng: 39.6111,
        zoom: 11,
        districts: [
          { id: 'sa-md-1', code: 'MADINAH_CITY', name_ar: 'المدينة المنورة', name_en: 'Madinah City', lat: 24.4672, lng: 39.6111, sub_addresses: ['حي المنطقة المركزية', 'حي قباء', 'حي العيون', 'حي سيد الشهداء'] },
          { id: 'sa-md-2', code: 'YANBU', name_ar: 'محافظة ينبع', name_en: 'Yanbu', lat: 24.0895, lng: 38.0618, sub_addresses: ['ينبع البحر', 'ينبع الصناعية', 'ينبع النخل'] }
        ]
      },
      {
        id: 'sa-eastern',
        code: 'SA-04',
        name_ar: 'المنطقة الشرقية',
        name_en: 'Eastern Province',
        lat: 26.4207,
        lng: 50.0888,
        zoom: 10,
        districts: [
          { id: 'sa-ep-1', code: 'DAMMAM', name_ar: 'حاضرة الدمام', name_en: 'Dammam', lat: 26.4207, lng: 50.0888, sub_addresses: ['حي الشاطئ الشرقي', 'حي المزروعية', 'حي الطبيشي'] },
          { id: 'sa-ep-2', code: 'KHOBAR', name_ar: 'محافظة الخبر', name_en: 'Khobar', lat: 26.2172, lng: 50.1971, sub_addresses: ['حي الكورنيش', 'حي الحزام الذهبي', 'حي الراكة'] },
          { id: 'sa-ep-3', code: 'AHSA', name_ar: 'محافظة الأحساء', name_en: 'Al-Ahsa', lat: 25.3800, lng: 49.5855, sub_addresses: ['الهفوف', 'المبرز', 'العيون'] }
        ]
      }
    ]
  },
  {
    iso2: 'AE',
    iso3: 'ARE',
    dial_code: '+971',
    flag_emoji: '🇦🇪',
    name_ar: 'الإمارات العربية المتحدة',
    name_en: 'United Arab Emirates',
    currency_code: 'AED',
    currency_symbol_ar: 'د.إ',
    lat: 23.4241,
    lng: 53.8478,
    default_zoom: 7,
    level1_label_ar: 'الإمارة',
    level1_label_en: 'Emirate',
    level2_label_ar: 'المدينة / القطاع',
    level2_label_en: 'City / Sector',
    level3_label_ar: 'المنطقة / المجتمع',
    level3_label_en: 'Community / Area',
    states_governorates: [
      {
        id: 'ae-abudhabi',
        code: 'AE-AZ',
        name_ar: 'إمارة أبوظبي',
        name_en: 'Abu Dhabi',
        lat: 24.4539,
        lng: 54.3773,
        zoom: 11,
        districts: [
          { id: 'ae-ad-1', code: 'ABUDHABI_CITY', name_ar: 'مدينة أبوظبي', name_en: 'Abu Dhabi City', lat: 24.4539, lng: 54.3773, sub_addresses: ['حي الكورنيش', 'جزيرة الريم', 'جزيرة ياس', 'منطقة الخالدية'] },
          { id: 'ae-ad-2', code: 'AL_AIN', name_ar: 'مدينة العين', name_en: 'Al Ain', lat: 24.2075, lng: 55.7447, sub_addresses: ['حي الجيمي', 'حي المويجعي', 'حي فلج هزاع'] },
          { id: 'ae-ad-3', code: 'AL_DHAFRA', name_ar: 'منطقة الظفرة', name_en: 'Al Dhafra', lat: 23.6575, lng: 53.7052, sub_addresses: ['مدينة زايد', 'الرويس', 'المرفأ'] }
        ]
      },
      {
        id: 'ae-dubai',
        code: 'AE-DU',
        name_ar: 'إمارة دبي',
        name_en: 'Dubai',
        lat: 25.2048,
        lng: 55.2708,
        zoom: 11,
        districts: [
          { id: 'ae-du-1', code: 'BUR_DUBAI', name_ar: 'بر دبي', name_en: 'Bur Dubai', lat: 25.2600, lng: 55.3000, sub_addresses: ['حي الفهيدي التاريخي', 'حي الكرامة', 'حي الجداف'] },
          { id: 'ae-du-2', code: 'DEIRA', name_ar: 'ديرة', name_en: 'Deira', lat: 25.2711, lng: 55.3075, sub_addresses: ['حي الرقة', 'حي المرقبات', 'حي نايف'] },
          { id: 'ae-du-3', code: 'DOWNTOWN', name_ar: 'وسط مدينة دبي والجميرا', name_en: 'Downtown & Jumeirah', lat: 25.1972, lng: 55.2744, sub_addresses: ['داون تاون برج خليفة', 'جميرا 1', 'مرسى دبي (المارينا)'] }
        ]
      },
      {
        id: 'ae-sharjah',
        code: 'AE-SH',
        name_ar: 'إمارة الشارقة',
        name_en: 'Sharjah',
        lat: 25.3463,
        lng: 55.4209,
        zoom: 11,
        districts: [
          { id: 'ae-sh-1', code: 'SHARJAH_CITY', name_ar: 'مدينة الشارقة', name_en: 'Sharjah City', lat: 25.3463, lng: 55.4209, sub_addresses: ['حي المجاز', 'حي الخان', 'حي القاسمية', 'حي مويلح'] }
        ]
      }
    ]
  },
  {
    iso2: 'QA',
    iso3: 'QAT',
    dial_code: '+974',
    flag_emoji: '🇶🇦',
    name_ar: 'دولة قطر',
    name_en: 'Qatar',
    currency_code: 'QAR',
    currency_symbol_ar: 'ر.ق',
    lat: 25.3548,
    lng: 51.1839,
    default_zoom: 8,
    level1_label_ar: 'البلدية',
    level1_label_en: 'Municipality',
    level2_label_ar: 'المدينة / المنطقة',
    level2_label_en: 'Zone / City',
    level3_label_ar: 'الحي / الشارع',
    level3_label_en: 'District / Street',
    states_governorates: [
      {
        id: 'qa-doha',
        code: 'QA-DA',
        name_ar: 'بلدية الدوحة',
        name_en: 'Doha Municipality',
        lat: 25.2854,
        lng: 51.5310,
        zoom: 12,
        districts: [
          { id: 'qa-dh-1', code: 'DOHA_CITY', name_ar: 'مدينة الدوحة', name_en: 'Doha City', lat: 25.2854, lng: 51.5310, sub_addresses: ['حي الدفنة', 'حي مشيرب قلب الدوحة', 'حي السد', 'اللؤلؤة'] }
        ]
      },
      {
        id: 'qa-rayyan',
        code: 'QA-RA',
        name_ar: 'بلدية الريان',
        name_en: 'Al Rayyan',
        lat: 25.2919,
        lng: 51.4244,
        zoom: 11,
        districts: [
          { id: 'qa-ry-1', code: 'RAYYAN_CITY', name_ar: 'مدينة الريان', name_en: 'Al Rayyan City', lat: 25.2919, lng: 51.4244, sub_addresses: ['المدينة التعليمية', 'حي الوجبة', 'حي الغرافة'] }
        ]
      }
    ]
  },
  {
    iso2: 'KW',
    iso3: 'KWT',
    dial_code: '+965',
    flag_emoji: '🇰🇼',
    name_ar: 'دولة الكويت',
    name_en: 'Kuwait',
    currency_code: 'KWD',
    currency_symbol_ar: 'د.ك',
    lat: 29.3117,
    lng: 47.4818,
    default_zoom: 8,
    level1_label_ar: 'المحافظة',
    level1_label_en: 'Governorate',
    level2_label_ar: 'المنطقة',
    level2_label_en: 'Area',
    level3_label_ar: 'القطعة / الشارع',
    level3_label_en: 'Block / Street',
    states_governorates: [
      {
        id: 'kw-asima',
        code: 'KW-KU',
        name_ar: 'محافظة العاصمة',
        name_en: 'Capital Governorate',
        lat: 29.3759,
        lng: 47.9774,
        zoom: 12,
        districts: [
          { id: 'kw-as-1', code: 'KUWAIT_CITY', name_ar: 'مدينة الكويت', name_en: 'Kuwait City', lat: 29.3759, lng: 47.9774, sub_addresses: ['الشرق', 'القبلة', 'المرقاب', 'دسمان'] },
          { id: 'kw-as-2', code: 'SHUWEIKH', name_ar: 'الشويخ', name_en: 'Shuwaikh', lat: 29.3522, lng: 47.9450, sub_addresses: ['الشويخ السكنية', 'الشويخ الصناعية'] }
        ]
      },
      {
        id: 'kw-hawalli',
        code: 'KW-HA',
        name_ar: 'محافظة حولي',
        name_en: 'Hawalli Governorate',
        lat: 29.3328,
        lng: 48.0281,
        zoom: 12,
        districts: [
          { id: 'kw-hw-1', code: 'SALMIYA', name_ar: 'السالمية', name_en: 'Salmiya', lat: 29.3344, lng: 48.0772, sub_addresses: ['شارع سالم المبارك', 'شارع بغداد'] },
          { id: 'kw-hw-2', code: 'HAWALLI_AREA', name_ar: 'حولي', name_en: 'Hawalli Area', lat: 29.3328, lng: 48.0281, sub_addresses: ['ميدان حولي', 'شارع تونس'] }
        ]
      }
    ]
  },
  {
    iso2: 'OM',
    iso3: 'OMN',
    dial_code: '+968',
    flag_emoji: '🇴🇲',
    name_ar: 'سلطنة عُمان',
    name_en: 'Oman',
    currency_code: 'OMR',
    currency_symbol_ar: 'ر.ع',
    lat: 21.4735,
    lng: 55.9754,
    default_zoom: 6,
    level1_label_ar: 'المحافظة',
    level1_label_en: 'Governorate',
    level2_label_ar: 'الولاية',
    level2_label_en: 'Wilayat',
    level3_label_ar: 'القرية / الحي',
    level3_label_en: 'Village / Area',
    states_governorates: [
      {
        id: 'om-muscat',
        code: 'OM-MA',
        name_ar: 'محافظة مسقط',
        name_en: 'Muscat Governorate',
        lat: 23.5880,
        lng: 58.3829,
        zoom: 11,
        districts: [
          { id: 'om-mc-1', code: 'MUTTRAH', name_ar: 'ولاية مطرح', name_en: 'Muttrah', lat: 23.6214, lng: 58.5639, sub_addresses: ['سوق مطرح', 'ميناء السلطان قابوس'] },
          { id: 'om-mc-2', code: 'SEEB', name_ar: 'ولاية السيب', name_en: 'Seeb', lat: 23.6703, lng: 58.1891, sub_addresses: ['الموالح', 'الحيل', 'الخوض'] }
        ]
      },
      {
        id: 'om-dhofar',
        code: 'OM-ZU',
        name_ar: 'محافظة ظفار',
        name_en: 'Dhofar Governorate',
        lat: 17.0150,
        lng: 54.0924,
        zoom: 10,
        districts: [
          { id: 'om-dh-1', code: 'SALALAH', name_ar: 'ولاية صلالة', name_en: 'Salalah', lat: 17.0150, lng: 54.0924, sub_addresses: ['صلالة الوسطى', 'حي السعادة', 'حي الحافة'] }
        ]
      }
    ]
  },
  {
    iso2: 'EG',
    iso3: 'EGY',
    dial_code: '+20',
    flag_emoji: '🇪🇬',
    name_ar: 'جمهورية مصر العربية',
    name_en: 'Egypt',
    currency_code: 'EGP',
    currency_symbol_ar: 'ج.م',
    lat: 26.8206,
    lng: 30.8025,
    default_zoom: 6,
    level1_label_ar: 'المحافظة',
    level1_label_en: 'Governorate',
    level2_label_ar: 'المركز / القسم / المدينة',
    level2_label_en: 'City / District',
    level3_label_ar: 'الحي / القرية',
    level3_label_en: 'Neighborhood / Village',
    states_governorates: [
      {
        id: 'eg-cairo',
        code: 'EG-C',
        name_ar: 'محافظة القاهرة',
        name_en: 'Cairo',
        lat: 30.0444,
        lng: 31.2357,
        zoom: 11,
        districts: [
          { id: 'eg-cr-1', code: 'NASR_CITY', name_ar: 'مدينة نصر', name_en: 'Nasr City', lat: 30.0561, lng: 31.3303, sub_addresses: ['الحي السابع', 'الحي الثامن', 'المنطقة الأولى'] },
          { id: 'eg-cr-2', code: 'MAADI', name_ar: 'المعادي', name_en: 'Maadi', lat: 29.9602, lng: 31.2569, sub_addresses: ['المعادي القديمة', 'دجلة المعادي', 'زهراء المعادي'] },
          { id: 'eg-cr-3', code: 'NEW_CAIRO', name_ar: 'القاهرة الجديدة', name_en: 'New Cairo', lat: 30.0074, lng: 31.4913, sub_addresses: ['التجمع الخامس', 'التجمع الأول', 'الرحاب', 'مدينتي'] }
        ]
      },
      {
        id: 'eg-giza',
        code: 'EG-GZ',
        name_ar: 'محافظة الجيزة',
        name_en: 'Giza',
        lat: 30.0131,
        lng: 31.2089,
        zoom: 11,
        districts: [
          { id: 'eg-gz-1', code: 'DOKKI', name_ar: 'الدقي والمهندسين', name_en: 'Dokki & Mohandessin', lat: 30.0385, lng: 31.2118, sub_addresses: ['شارع مصدق', 'ميدان المساحة', 'شارع جامعة الدول العربية'] },
          { id: 'eg-gz-2', code: 'SIXTH_OCTOBER', name_ar: 'مدينة السادس من أكتوبر', name_en: '6th of October City', lat: 29.9723, lng: 30.9427, sub_addresses: ['الحي المتميز', 'الحي الأول', 'حي الأشجار'] }
        ]
      }
    ]
  },
  {
    iso2: 'JO',
    iso3: 'JOR',
    dial_code: '+962',
    flag_emoji: '🇯🇴',
    name_ar: 'المملكة الأردنية الهاشمية',
    name_en: 'Jordan',
    currency_code: 'JOD',
    currency_symbol_ar: 'د.أ',
    lat: 30.5852,
    lng: 36.2384,
    default_zoom: 7,
    level1_label_ar: 'المحافظة',
    level1_label_en: 'Governorate',
    level2_label_ar: 'اللواء / القضاء',
    level2_label_en: 'District',
    level3_label_ar: 'الحي / القرية',
    level3_label_en: 'Area / Village',
    states_governorates: [
      {
        id: 'jo-amman',
        code: 'JO-AM',
        name_ar: 'محافظة العاصمة (عمّان)',
        name_en: 'Amman',
        lat: 31.9539,
        lng: 35.9106,
        zoom: 11,
        districts: [
          { id: 'jo-am-1', code: 'QASABAT_AMMAN', name_ar: 'لواء قصبة عمّان', name_en: 'Amman City Center', lat: 31.9539, lng: 35.9106, sub_addresses: ['جبل اللويبدة', 'جبل عمّان', 'العبدلي', 'الشميساني'] },
          { id: 'jo-am-2', code: 'JUBEIHA', name_ar: 'لواء الجامعة والجبيهة', name_en: 'University & Jubeiha', lat: 32.0195, lng: 35.8672, sub_addresses: ['الجبيهة', 'خلدا', 'تلاع العلي', 'شفا بدران'] }
        ]
      }
    ]
  },
  {
    iso2: 'TR',
    iso3: 'TUR',
    dial_code: '+90',
    flag_emoji: '🇹🇷',
    name_ar: 'الجمهورية التركية',
    name_en: 'Turkey',
    currency_code: 'TRY',
    currency_symbol_ar: 'ل.ت',
    lat: 38.9637,
    lng: 35.2433,
    default_zoom: 6,
    level1_label_ar: 'الولاية (İl)',
    level1_label_en: 'Province',
    level2_label_ar: 'البلدية / المنطقة (İlçe)',
    level2_label_en: 'District',
    level3_label_ar: 'الحي (Mahalle)',
    level3_label_en: 'Neighborhood',
    states_governorates: [
      {
        id: 'tr-istanbul',
        code: 'TR-34',
        name_ar: 'ولاية إسطنبول',
        name_en: 'Istanbul',
        lat: 41.0082,
        lng: 28.9784,
        zoom: 11,
        districts: [
          { id: 'tr-is-1', code: 'FATIH', name_ar: 'بلدية الفاتح', name_en: 'Fatih', lat: 41.0186, lng: 28.9497, sub_addresses: ['حي أكسراي', 'حي الفاتح', 'حي فندك زاده'] },
          { id: 'tr-is-2', code: 'BASAKSEHIR', name_ar: 'بلدية باشاك شهير', name_en: 'Basaksehir', lat: 41.0963, lng: 28.8044, sub_addresses: ['المرحلة الأولى', 'المرحلة الرابعة', 'كايا شهير'] }
        ]
      },
      {
        id: 'tr-gaziantep',
        code: 'TR-27',
        name_ar: 'ولاية غازي عنتاب',
        name_en: 'Gaziantep',
        lat: 37.0662,
        lng: 37.3833,
        zoom: 11,
        districts: [
          { id: 'tr-gz-1', code: 'SEHITKAMIL', name_ar: 'شهيد كامل', name_en: 'Sehitkamil', lat: 37.0850, lng: 37.3600, sub_addresses: ['حي الجامعة', 'حي غازي'] }
        ]
      }
    ]
  }
];

/**
 * Finds a country by ISO2 code, with automatic fallback to Yemen (YE).
 */
export function getCountryProfile(iso2: string = 'YE'): CountryAdministrativeProfile {
  const found = GLOBAL_COUNTRIES_DIRECTORY.find(
    c => c.iso2.toUpperCase() === iso2.toUpperCase()
  );
  return found || GLOBAL_COUNTRIES_DIRECTORY[0];
}

/**
 * Helper to build a clean formatted single-line address string from structured fields.
 */
export function formatFullAddressString(address: {
  country_name_ar?: string;
  state_governorate_ar?: string;
  district_ar?: string;
  sub_district_ar?: string;
  detailed_street_ar?: string;
}): string {
  const parts = [
    address.country_name_ar,
    address.state_governorate_ar,
    address.district_ar,
    address.sub_district_ar,
    address.detailed_street_ar
  ].filter(p => p && p.trim() !== '');

  return parts.join(' • ');
}
