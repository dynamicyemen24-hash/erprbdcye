// Universal Beneficiary Master Record & Administrative Datasets
// UAMEX ERP™ - Rohamā'a Baynahum Charity Foundation (جمعية رُحماء بينهم للعمل الإنساني والتنمية)

export type BeneficiaryArchetype = 'INDIVIDUAL' | 'FAMILY' | 'COMMUNITY_ENTITY';

export type IndividualSubtype =
  | 'ORPHAN'        // يتيم
  | 'WIDOW'         // أرملة
  | 'DISABLED'      // ذوي احتياجات خاصة
  | 'ELDERLY'       // مسن / عاجز
  | 'POOR_PERSON'   // فقير / معدم
  | 'SICK'          // مريض / غسيل كلى
  | 'STUDENT';      // طالب علم

export type FamilySubtype =
  | 'ORPHAN_FAMILY'      // أسرة أيتام
  | 'DISPLACED_FAMILY'   // أسرة نازحة
  | 'VULNERABLE_FAMILY'  // أسرة متعففة
  | 'FEMALE_HEADED';     // أسرة تعولها امرأة

export type CommunityEntitySubtype =
  | 'MOSQUE'             // مسجد / جامع
  | 'WATER_WELL'         // بئر ماء / محطة مياه
  | 'SHELTER_CARAVAN'    // كرفانات / مخيم إيواء
  | 'COMMUNITY_FACILITY' // مركز صحي أو مرفق مجتمعي
  | 'PUBLIC_SCHOOL';     // مدرسة ريفية

export interface IndividualDetails {
  national_id?: string;
  birth_date?: string;
  gender: 'MALE' | 'FEMALE';
  guardian_name?: string;
  guardian_national_id?: string;
  guardian_phone?: string;
  guardian_relationship?: string;
  education_level?: string;
  quran_memorization_level?: string;
  health_condition?: string;
}

export interface FamilyDetails {
  head_of_family_name: string;
  head_national_id?: string;
  family_members_count: number;
  males_count: number;
  females_count: number;
  children_under_5_count: number;
  is_displaced: boolean;
  displacement_origin_gov?: string;
  housing_status: 'owned' | 'rented' | 'shelter' | 'hosted';
  monthly_income_yer?: number;
}

export interface CommunityEntityDetails {
  entity_subtype: CommunityEntitySubtype;
  supervisor_name: string; // ناظر المسجد أو مهندس البئر أو مشرف المخيم
  supervisor_phone: string;
  capacity_beneficiaries_count: number; // سعة المصلين أو عدد المستفيدين من البئر أو عدد الخيام
  gps_latitude?: number;
  gps_longitude?: number;
  village_or_neighborhood: string;
  technical_specs?: {
    well_depth_meters?: number;
    solar_pump_wattage?: number;
    daily_water_yield_liters?: number;
    caravans_count?: number;
    shelter_tents_count?: number;
    mosque_floors_count?: number;
  };
}

export interface UniversalBeneficiary {
  id: string;
  beneficiary_code: string;
  archetype: BeneficiaryArchetype;
  subtype: string;
  full_name_ar: string;
  full_name_en?: string;
  phone_primary: string;
  phone_secondary?: string;
  governorate: string;
  district: string;
  sub_district_uzlah?: string;
  detailed_address: string;
  status: 'active' | 'under_review' | 'suspended' | 'graduated';
  financial_need_level: 'EXTREME' | 'HIGH' | 'MEDIUM';
  registered_date: string;
  verified_by_field_officer: string;
  linked_project_ids: string[];
  notes?: string;

  // Polymorphic Archetype Details
  individual_details?: IndividualDetails;
  family_details?: FamilyDetails;
  community_entity_details?: CommunityEntityDetails;
}

// Standard Official Administrative Divisions in the Republic of Yemen for Zero-Friction Autocomplete
export interface AdministrativeDivision {
  governorate_ar: string;
  governorate_en: string;
  districts: string[];
}

export const YEMEN_ADMINISTRATIVE_DIVISIONS: AdministrativeDivision[] = [
  {
    governorate_ar: 'أمانة العاصمة',
    governorate_en: 'Sana\'a City',
    districts: ['السبعين', 'الوحدة', 'التحرير', 'معين', 'آزال', 'الثورة', 'شُعوب', 'بني الحارث', 'الصافية', 'صنعاء القديمة']
  },
  {
    governorate_ar: 'صنعاء',
    governorate_en: 'Sana\'a Governorate',
    districts: ['سنحان وبني بهلول', 'بني حشيش', 'بني مطر', 'الحيمة الداخلية', 'الحيمة الخارجية', 'همدان', 'أرحب', 'نهم', 'خولان', 'جحانة']
  },
  {
    governorate_ar: 'تعز',
    governorate_en: 'Taiz',
    districts: ['صبر الموادم', 'المشرعة وبسام', 'مشرعة وحدنان', 'المظفر', 'القاهرة', 'صالة', 'المواسط', 'المعافر', 'الشمايتين', 'جبل حبشي', 'التعزية', 'مقبنة', 'شرعب الرونة', 'شرعب السلام', 'المخاء', 'ذباب']
  },
  {
    governorate_ar: 'عدن',
    governorate_en: 'Aden',
    districts: ['كريتر (صيرة)', 'المعلا', 'التواهي', 'خور مكسر', 'المنصورة', 'الشيخ عثمان', 'دار سعد', 'البريقة']
  },
  {
    governorate_ar: 'الحديدة',
    governorate_en: 'Hodeidah',
    districts: ['الحالي', 'الحوك', 'الميناء', 'باجل', 'بيت الفقيه', 'الزهرة', 'اللحية', 'المنيرة', 'القناوص', 'زبيد', 'الدريهمي', 'التحيتا', 'حيس', 'الخوخة']
  },
  {
    governorate_ar: 'حضرموت',
    governorate_en: 'Hadramout',
    districts: ['المكلا', 'سيئون', 'تريم', 'الشحر', 'شبام', 'القطن', 'دوعن', 'غيل باوزير', 'الريدة وقصيعر', 'ساه']
  },
  {
    governorate_ar: 'إب',
    governorate_en: 'Ibb',
    districts: ['الظهار', 'المشنة', 'جبلة', 'يريم', 'السدة', 'النادرة', 'العدين', 'فرع العدين', 'حزم العدين', 'ذي السفال', 'مذيخرة', 'القفر', 'بعدان']
  },
  {
    governorate_ar: 'ذمار',
    governorate_en: 'Dhamar',
    districts: ['مدينة ذمار', 'عنس', 'ميفعة عنس', 'ضوران آنس', 'جبل الشرق', 'الحداء', 'جهران', 'وصاب العالي', 'وصاب السافل', 'عتمة']
  },
  {
    governorate_ar: 'مأرب',
    governorate_en: 'Marib',
    districts: ['مدينة مأرب', 'مأرب الوادي', 'صرواح', 'حريب', 'الجوبة', 'العبدية', 'بدبدة', 'رغوان', 'مجزر']
  },
  {
    governorate_ar: 'لحج',
    governorate_en: 'Lahj',
    districts: ['الحوطة', 'تبن', 'طور الباحة', 'المضاربة ورأس العارة', 'ردفان (الحبيلين)', 'يافع (لبعوس)', 'يهر', 'المفلحي']
  },
  {
    governorate_ar: 'أبين',
    governorate_en: 'Abyan',
    districts: ['زنجبار', 'خنفر', 'لودر', 'مودية', 'المحفد', 'أحور', 'رصد (يافع)', 'سباح', 'سرار']
  },
  {
    governorate_ar: 'المهرة',
    governorate_en: 'Al-Mahrah',
    districts: ['الغيضة', 'حوف', 'حصوين', 'قشن', 'سيحوت', 'المسيلة', 'شحن', 'حات', 'منعر']
  }
];

// Smart Code Generation Helper
export function generateNextBeneficiaryCode(
  archetype: BeneficiaryArchetype,
  subtype: string,
  existingCodes: string[] = []
): string {
  const currentYear = new Date().getFullYear();
  let prefix = 'BEN-IND';

  if (archetype === 'FAMILY') {
    prefix = 'BEN-FAM';
  } else if (archetype === 'COMMUNITY_ENTITY') {
    if (subtype === 'MOSQUE') prefix = 'BEN-MOSQ';
    else if (subtype === 'WATER_WELL') prefix = 'BEN-WELL';
    else if (subtype === 'SHELTER_CARAVAN') prefix = 'BEN-SHEL';
    else prefix = 'BEN-FAC';
  }

  // Count existing with this prefix in current year
  const pattern = new RegExp(`^${prefix}-${currentYear}-(\\d{4})$`);
  let maxSeq = 0;

  existingCodes.forEach(code => {
    const match = code.match(pattern);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}-${currentYear}-${nextSeq}`;
}
