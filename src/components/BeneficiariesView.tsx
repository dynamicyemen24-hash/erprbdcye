import { showToast } from './enterprise/EnterpriseToastContainer';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  X, 
  Check, 
  Edit, 
  Trash2, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Heart,
  Baby,
  Users,
  Building,
  UserCheck,
  Printer,
  FileSpreadsheet,
  Download,
  Eye,
  EyeOff,
  Shield,
  Building2,
  Sparkles,
  AlertTriangle,
  GitCommit
} from 'lucide-react';
import ExportToolsModal from './ExportToolsModal';
import PrintPDFTemplateModal from './reports/PrintPDFTemplateModal';
import { printHTML, createPrintDocument } from '../lib/printUtils';
import { EnterpriseToolStrip } from './EnterpriseToolStrip';
import { enterpriseBus } from '../lib/enterpriseNotificationBus';
import { ModuleShell } from './enterprise/ModuleShell';
import { PolicyViolationError, type PolicyViolation } from '../core/utils/apiHelpers';
import { PolicyViolationAlert } from './helpers/PolicyViolationAlert';
import { UniversalObjectPageModal } from './common/UniversalObjectPageModal';
import {
  BeneficiaryArchetype,
  YEMEN_ADMINISTRATIVE_DIVISIONS,
  generateNextBeneficiaryCode
} from '../core/data/universalBeneficiaryTypes';
import {
  checkBeneficiaryDuplicates,
  validateYemeniNationalId,
  normalizePhoneNumber
} from '../core/utils/dataIntegrityEngine';
import SmartAutocompleteInput from './common/SmartAutocompleteInput';
import CrossEntityLineageView from '../features/traceability/CrossEntityLineageView';

interface BeneficiariesViewProps {
  beneficiaries: any[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
  initialStatusFilter?: string;
  initialCategoryFilter?: string;
  onNavigate?: (tab: string) => void;
}

export default function BeneficiariesView({ beneficiaries, loading, onRefresh, lang, initialStatusFilter, initialCategoryFilter, onNavigate }: BeneficiariesViewProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(initialCategoryFilter || 'ALL');
  const [filterGov, setFilterGov] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter || 'ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [maskSensitivePII, setMaskSensitivePII] = useState(true);

  const maskPhone = (phone?: string) => {
    if (!phone) return '—';
    if (!maskSensitivePII) return phone;
    const clean = phone.trim();
    if (clean.length <= 4) return '****';
    return clean.slice(0, 2) + '****' + clean.slice(-3);
  };

  useEffect(() => {
    if (initialCategoryFilter) {
      setFilterCategory(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  useEffect(() => {
    if (initialStatusFilter) {
      setFilterStatus(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[] | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'demographic' | 'support'>('personal');

  // Fields: Universal Beneficiary Master Model
  const [archetype, setArchetype] = useState<BeneficiaryArchetype>('INDIVIDUAL');
  const [entitySubtype, setEntitySubtype] = useState<string>('MOSQUE');
  const [fullNameAr, setFullNameAr] = useState('');
  const [beneficiaryCode, setBeneficiaryCode] = useState('');
  const [categoryCode, setCategoryCode] = useState('ORPHAN');
  const [statusCode, setStatusCode] = useState('active');
  const [genderCode, setGenderCode] = useState('MALE');
  const [age, setAge] = useState('');
  const [phonePrimary, setPhonePrimary] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [headOfFamilyName, setHeadOfFamilyName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorPhone, setSupervisorPhone] = useState('');
  const [capacityCount, setCapacityCount] = useState('');
  const [wellDepth, setWellDepth] = useState('');
  const [solarPump, setSolarPump] = useState('');
  const [caravansCount, setCaravansCount] = useState('');
  const [gpsLatitude, setGpsLatitude] = useState('');
  const [gpsLongitude, setGpsLongitude] = useState('');
  const [governorate, setGovernorate] = useState('صنعاء');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [housingStatus, setHousingStatus] = useState('owned');
  const [familySize, setFamilySize] = useState('1');
  const [isDisplaced, setIsDisplaced] = useState(false);
  const [educationLevel, setEducationLevel] = useState('');
  const [quranMemorization, setQuranMemorization] = useState('');
  const [financialStatus, setFinancialStatus] = useState('poor');
  const [deathCertificate, setDeathCertificate] = useState(false);
  const [notes, setNotes] = useState('');

  // Lineage modal state
  const [showLineageModal, setShowLineageModal] = useState(false);
  const [lineageTargetBeneficiary, setLineageTargetBeneficiary] = useState<any | null>(null);

  // Dynamic districts based on selected governorate for smart autocomplete
  const currentGovernorateData = useMemo(() => {
    return YEMEN_ADMINISTRATIVE_DIVISIONS.find(
      g => g.governorate_ar === governorate || g.governorate_en.toLowerCase() === (governorate || '').toLowerCase()
    );
  }, [governorate]);

  const availableDistricts = useMemo(() => {
    if (currentGovernorateData) {
      return currentGovernorateData.districts;
    }
    return Array.from(new Set(YEMEN_ADMINISTRATIVE_DIVISIONS.flatMap(g => g.districts)));
  }, [currentGovernorateData]);

  const availableGovernorates = useMemo(() => {
    return YEMEN_ADMINISTRATIVE_DIVISIONS.map(g => g.governorate_ar);
  }, []);

  // Real-time instant duplicate checking (Zero-Friction: Instant & Non-blocking for warnings)
  const duplicateCheck = useMemo(() => {
    if (!isModalOpen) return { hasExactDuplicate: false, hasWarningDuplicate: false };
    return checkBeneficiaryDuplicates(
      {
        id: selectedBeneficiary?.id,
        archetype,
        full_name_ar: fullNameAr,
        phone_primary: phonePrimary,
        national_id: nationalId,
        governorate,
        district,
        gps_lat: gpsLatitude ? parseFloat(gpsLatitude) : undefined,
        gps_lng: gpsLongitude ? parseFloat(gpsLongitude) : undefined
      },
      beneficiaries
    );
  }, [isModalOpen, selectedBeneficiary, archetype, fullNameAr, phonePrimary, nationalId, governorate, district, gpsLatitude, gpsLongitude, beneficiaries]);

  // Detailed view modal
  const [viewingBeneficiary, setViewingBeneficiary] = useState<any | null>(null);

  useEffect(() => {
    const active = selectedBeneficiary || viewingBeneficiary;
    if (active) {
      localStorage.setItem('nexora_active_beneficiary', JSON.stringify({
        id: active.id,
        name_ar: active.full_name_ar,
        name_en: active.full_name_en,
        notes: active.notes
      }));
    } else {
      localStorage.removeItem('nexora_active_beneficiary');
    }
  }, [selectedBeneficiary, viewingBeneficiary]);

  // Categories & Governorates compiled dynamically
  const categories = ['ORPHAN', 'POOR_FAMILY', 'DISABLED', 'WIDOW', 'SICK'];
  const governorates = Array.from(new Set(beneficiaries.map(b => b.governorate).filter(Boolean)));

  // Filter logic
  const filteredList = beneficiaries.filter(b => {
    const matchesSearch = 
      (b.full_name_ar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.beneficiary_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.phone_primary || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'ALL' || b.category_code === filterCategory;
    const matchesGov = filterGov === 'ALL' || b.governorate === filterGov;
    const matchesGender = filterGender === 'ALL' || b.gender_code === filterGender;
    const matchesStatus = filterStatus === 'ALL' || b.status_code === filterStatus;

    return matchesSearch && matchesCategory && matchesGov && matchesGender && matchesStatus;
  });

  const handlePrintBeneficiary = (b: any) => {
    // Resilient print writer — popup window when allowed, sandbox-safe iframe fallback
    const printDoc = createPrintDocument();

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const titleText = lang === 'ar' ? 'تقرير دراسة الحالة الميدانية والاستحقاق الاجتماعي' : 'Field Case Study & Welfare Report';

    printDoc.write(`
      <!DOCTYPE html>
      <html lang="${lang}" dir="${dir}">
      <head>
        <meta charset="UTF-8">
        <title>${titleText} - ${b.beneficiary_code}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;900&display=swap');
          body {
            font-family: ${lang === 'ar' ? "'Tajawal', sans-serif" : "'Plus Jakarta Sans', sans-serif"};
          }
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; color: black !important; }
            @page { size: A4; margin: 15mm; }
          }
        </style>
      </head>
      <body class="bg-slate-50 text-slate-900 p-8">
        <!-- Floating Action Row -->
        <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500">${lang === 'ar' ? 'تأكيد طباعة ملف دراسة الحالة والبحث الاجتماعي الميداني' : 'Ready to print official case social study report'}</span>
          </div>
          <button onclick="window.print()" class="px-5 py-2.5 bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer hover:bg-amber-700 transition-all">
            ${lang === 'ar' ? 'إطلاق أمر الطباعة 🖨️' : 'Print Document 🖨️'}
          </button>
        </div>

        <!-- Printable Document Container -->
        <div class="max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl p-10 shadow-lg relative min-h-[297mm]">
          
          <!-- Official Header Letterhead -->
          <div class="flex justify-between items-start pb-6 border-b-2 border-slate-900 gap-6">
            <div class="text-right space-y-1">
              <h1 class="font-black text-lg text-slate-900">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h1>
              <p class="text-xs font-bold text-slate-500">إدارة الرعاية الاجتماعية والبحث الميداني</p>
              <p class="text-[10px] text-slate-400">صنعاء - الجمهورية اليمنية</p>
            </div>
            <div class="text-center shrink-0">
              <div class="border-2 border-slate-900 px-3 py-1.5 rounded-xl font-black text-sm tracking-widest bg-emerald-50">
                UAMEX CASE
              </div>
              <p class="text-[9px] font-bold text-slate-400 mt-1">وثيقة البحث الاجتماعي الموحدة</p>
            </div>
            <div class="text-left space-y-1">
              <h1 class="font-black text-lg text-slate-900">Rohamā'a Baynahum Charity Foundation</h1>
              <p class="text-xs font-bold text-slate-500">Social Welfare & Field Research Dept</p>
              <p class="text-[10px] text-slate-400">Sanaa, Republic of Yemen</p>
            </div>
          </div>

          <!-- Title of Document -->
          <div class="my-8 text-center">
            <h2 class="text-lg font-black text-slate-900 border-2 border-slate-900 bg-amber-500/10 px-6 py-2 rounded-xl inline-block uppercase tracking-wide">
              ${lang === 'ar' ? 'استمارة وتاريخ البحث الاجتماعي ودراسة الحالة' : 'Comprehensive Social Case Study Form'}
            </h2>
          </div>

          <!-- Section: Basic Case Info -->
          <div class="mb-6 border border-slate-200 p-5 rounded-xl bg-slate-50">
            <h3 class="text-slate-900 font-black border-b border-slate-200 pb-2 mb-4 text-xs">
              ${lang === 'ar' ? '1. البيانات الشخصية الأساسية للمستفيد' : '1. Core Personal Profile'}
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'الاسم الكامل رباعياً:' : 'Full Legal Name:'}</p>
                <p class="text-slate-900 font-black text-sm mt-0.5">${b.full_name_ar}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'رقم الحالة الكودي:' : 'Case ID Code:'}</p>
                <p class="font-mono text-slate-900 font-black text-sm mt-0.5 bg-slate-100 px-2 py-0.5 rounded inline-block">${b.beneficiary_code || (lang === 'ar' ? 'مستفيد-جديد' : 'BEN-NEW')}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'تصنيف الاستحقاق:' : 'Eligibility Category:'}</p>
                <p class="text-amber-800 font-black mt-0.5">${b.category_code === 'ORPHAN' ? (lang === 'ar' ? 'يتيم مكفول' : 'Orphan') : b.category_code === 'POOR_FAMILY' ? (lang === 'ar' ? 'أسرة متعففة' : 'Poor Family') : (lang === 'ar' ? 'حالة مستفيدة' : 'Beneficiary')}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'رقم الهاتف للتواصل:' : 'Contact Phone:'}</p>
                <p class="font-mono text-slate-800 mt-0.5">${b.phone_primary || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Section: Demographic details -->
          <div class="mb-6 pt-4 border-t border-slate-100">
            <h3 class="text-slate-900 font-black border-b border-slate-200 pb-2 mb-4 text-xs">
              ${lang === 'ar' ? '2. الوضع الديموغرافي والسكن الجغرافي' : '2. Demographics & Housing'}
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'المحافظة:' : 'Governorate:'}</p>
                <p class="text-slate-900 font-extrabold mt-0.5">${b.governorate || '-'}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'المديرية / العزلة:' : 'District / Sub-district:'}</p>
                <p class="text-slate-800 font-extrabold mt-0.5">${b.district || '-'}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'حالة الملكية للسكن:' : 'Housing Property Status:'}</p>
                <p class="text-slate-800 font-black mt-0.5 capitalize">${b.housing_status === 'owned' ? (lang === 'ar' ? 'ملك' : 'Owned') : b.housing_status === 'rented' ? (lang === 'ar' ? 'إيجار' : 'Rented') : (lang === 'ar' ? 'نازح / خيمة' : 'Displaced')}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'عدد أفراد الأسرة المقيمين:' : 'Family Cohort Size:'}</p>
                <p class="font-mono text-slate-900 font-extrabold mt-0.5">${b.family_size || '1'}</p>
              </div>
            </div>
          </div>

          <!-- Section: Social and Health profile -->
          <div class="mb-6 pt-4 border-t border-slate-100">
            <h3 class="text-slate-900 font-black border-b border-slate-200 pb-2 mb-4 text-xs">
              ${lang === 'ar' ? '3. الموقف التعليمي، الديني، وحالة المستندات الثبوتية' : '3. Educational & Social Attributes'}
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'العمر بالسنوات:' : 'Age in Years:'}</p>
                <p class="font-mono text-slate-900 font-extrabold mt-0.5">${b.age ? `${b.age} عاماً` : '-'}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'المستوى الدراسي الحالي:' : 'Current Grade Level:'}</p>
                <p class="text-slate-800 font-extrabold mt-0.5">${b.education_level || '-'}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'مستوى حفظ القرآن:' : 'Quran Memorization:'}</p>
                <p class="text-slate-800 font-extrabold mt-0.5">${b.quran_memorization || '-'}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'شهادة الوفاة متوفرة (أيتام):' : 'Father Death Certificate:'}</p>
                <p class="text-slate-800 font-extrabold mt-0.5">${b.death_certificate ? (lang === 'ar' ? 'نعم - مسلّمة لقسم الأيتام' : 'Yes - Deposited') : (lang === 'ar' ? 'لا توجد' : 'No')}</p>
              </div>
            </div>
          </div>

          <!-- Section: Financial status & address -->
          <div class="mb-6 pt-4 border-t border-slate-100">
            <h3 class="text-slate-900 font-black border-b border-slate-200 pb-2 mb-4 text-xs">
              ${lang === 'ar' ? '4. تصنيف المستوى المعيشي والعنوان التفصيلي' : '4. Living Standard & Address Details'}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
              <div class="md:col-span-1">
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'الوضع المعيشي والمالي:' : 'Economic Status Code:'}</p>
                <p class="text-rose-700 font-black text-sm mt-0.5 capitalize bg-rose-50 px-3 py-1 border border-rose-200 rounded-xl inline-block">
                  ${b.financial_status === 'very_poor' ? (lang === 'ar' ? 'معدم / تحت خط الفقر الحرج' : 'Destitute') : b.financial_status === 'poor' ? (lang === 'ar' ? 'فقير / مستحق' : 'Poor') : (lang === 'ar' ? 'متوسط / مستور' : 'Medium')}
                </p>
              </div>
              <div class="md:col-span-2">
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'العنوان التفصيلي للوصول الميداني والتحقق:' : 'Precise Physical Address for Audit:'}</p>
                <p class="text-slate-800 font-bold mt-0.5 bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">${b.address || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Section: Social Notes & Recommendations -->
          <div class="p-5 border border-slate-200 rounded-xl bg-amber-500/5 text-xs text-slate-700 font-bold mb-12 leading-relaxed">
            <p class="text-slate-400 font-bold mb-1">${lang === 'ar' ? '5. تقرير وتوصيات المنسق الميداني والباحث الاجتماعي:' : '5. Social Researcher Observations & Recommendations:'}</p>
            <p class="text-slate-800 text-[11px] leading-relaxed">
              ${b.notes || (lang === 'ar' 
                ? 'الحالة تم التحقق منها ميدانياً في موقع السكن وتصنف كحالة مستحقة للدعم المالي المباشر وكفالة اليتيم العينية والغذائية بصورة عاجلة للحد من آثار التدهور الاقتصادي ومساعدة الأسرة على الاستقرار التعليمي.'
                : 'Verified via home visit. Recommended for urgent direct financial aid and immediate orphan sponsorship enrollment to safeguard basic education and living needs.')}
            </p>
          </div>

          <!-- Signatures block -->
          <div class="absolute bottom-10 left-10 right-10 grid grid-cols-4 gap-4 text-center text-[10px] font-bold text-slate-700">
            <div class="space-y-12">
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'الباحث الاجتماعي الميداني' : 'Field Social Researcher'}</p>
              <p class="text-[9px] text-slate-400">التوقيع والتاريخ</p>
            </div>
            <div class="space-y-12">
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'رئيس قسم البحث الاجتماعي' : 'Head of Welfare Dept'}</p>
              <p class="text-[9px] text-slate-400">التوقيع والاعتماد</p>
            </div>
            <div class="space-y-12">
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'المشرف المالي العام' : 'Financial Director'}</p>
              <p class="text-[9px] text-slate-400">توجيه التمويل</p>
            </div>
            <div class="space-y-12">
              <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'الختم الرسمي للمؤسسة' : 'Rohamā\'a Foundation Stamp'}</p>
              <p class="text-[9px] text-slate-400">اعتماد وصرف الكفالة</p>
            </div>
          </div>

        </div>
      </body>
      </html>
    `);
    printDoc.close();
  };

  const openFormModal = (beneficiary: any | null = null, prefilledData?: any) => {
    setSelectedBeneficiary(beneficiary);
    setFormError(null);
    setActiveFormTab('personal');
    if (beneficiary) {
      const detectedArchetype: BeneficiaryArchetype = beneficiary.archetype || 
        (beneficiary.category_code?.includes('FAMILY') || beneficiary.family_size > 1 ? 'FAMILY' :
        (beneficiary.category_code === 'MOSQUE' || beneficiary.category_code === 'WATER_WELL' || beneficiary.beneficiary_code?.includes('MOSQ') || beneficiary.beneficiary_code?.includes('WELL') || beneficiary.beneficiary_code?.includes('SHEL')) ? 'COMMUNITY_ENTITY' : 'INDIVIDUAL');
      
      const detectedSubtype = beneficiary.community_entity_details?.entity_subtype || 
        (beneficiary.beneficiary_code?.includes('WELL') ? 'WATER_WELL' : 
         beneficiary.beneficiary_code?.includes('SHEL') ? 'SHELTER_CARAVAN' : 'MOSQUE');

      setArchetype(detectedArchetype);
      setEntitySubtype(detectedSubtype);
      setFullNameAr(beneficiary.full_name_ar || '');
      setBeneficiaryCode(beneficiary.beneficiary_code || '');
      setCategoryCode(beneficiary.category_code || 'ORPHAN');
      setStatusCode(beneficiary.status_code || 'active');
      setGenderCode(beneficiary.gender_code || 'MALE');
      setAge(beneficiary.age ? String(beneficiary.age) : '');
      setPhonePrimary(beneficiary.phone_primary || '');
      setNationalId(beneficiary.national_id || beneficiary.individual_details?.national_id || beneficiary.family_details?.head_national_id || '');
      setGuardianName(beneficiary.individual_details?.guardian_name || '');
      setHeadOfFamilyName(beneficiary.family_details?.head_of_family_name || beneficiary.full_name_ar || '');
      setSupervisorName(beneficiary.community_entity_details?.supervisor_name || '');
      setSupervisorPhone(beneficiary.community_entity_details?.supervisor_phone || '');
      setCapacityCount(beneficiary.community_entity_details?.capacity_beneficiaries_count ? String(beneficiary.community_entity_details.capacity_beneficiaries_count) : '');
      setWellDepth(beneficiary.community_entity_details?.technical_specs?.well_depth_meters ? String(beneficiary.community_entity_details.technical_specs.well_depth_meters) : '');
      setSolarPump(beneficiary.community_entity_details?.technical_specs?.solar_pump_wattage ? String(beneficiary.community_entity_details.technical_specs.solar_pump_wattage) : '');
      setCaravansCount(beneficiary.community_entity_details?.technical_specs?.caravans_count ? String(beneficiary.community_entity_details.technical_specs.caravans_count) : '');
      setGpsLatitude(beneficiary.community_entity_details?.gps_latitude ? String(beneficiary.community_entity_details.gps_latitude) : '');
      setGpsLongitude(beneficiary.community_entity_details?.gps_longitude ? String(beneficiary.community_entity_details.gps_longitude) : '');
      setGovernorate(beneficiary.governorate || 'صنعاء');
      setDistrict(beneficiary.district || '');
      setAddress(beneficiary.address || '');
      setHousingStatus(beneficiary.housing_status || 'owned');
      setFamilySize(beneficiary.family_size ? String(beneficiary.family_size) : '1');
      setIsDisplaced(!!beneficiary.family_details?.is_displaced);
      setEducationLevel(beneficiary.education_level || '');
      setQuranMemorization(beneficiary.quran_memorization || '');
      setFinancialStatus(beneficiary.financial_status || 'poor');
      setDeathCertificate(!!beneficiary.death_certificate);
      setNotes(beneficiary.notes || '');
    } else {
      const initialArchetype: BeneficiaryArchetype = prefilledData?.archetype || 'INDIVIDUAL';
      const initialSubtype = prefilledData?.entitySubtype || 'MOSQUE';
      setArchetype(initialArchetype);
      setEntitySubtype(initialSubtype);
      
      const nextCode = generateNextBeneficiaryCode(
        initialArchetype,
        initialSubtype,
        beneficiaries.map(b => b.beneficiary_code || '')
      );
      setBeneficiaryCode(prefilledData?.beneficiaryCode || nextCode);
      setFullNameAr(prefilledData?.fullNameAr || '');
      setCategoryCode(prefilledData?.categoryCode || 'ORPHAN');
      setStatusCode('active');
      setGenderCode(prefilledData?.genderCode || 'MALE');
      setAge(prefilledData?.age || '');
      setPhonePrimary(prefilledData?.phonePrimary || '');
      setNationalId(prefilledData?.nationalId || '');
      setGuardianName(prefilledData?.guardianName || '');
      setHeadOfFamilyName(prefilledData?.headOfFamilyName || '');
      setSupervisorName(prefilledData?.supervisorName || '');
      setSupervisorPhone(prefilledData?.supervisorPhone || '');
      setCapacityCount(prefilledData?.capacityCount || '');
      setWellDepth(prefilledData?.wellDepth || '');
      setSolarPump(prefilledData?.solarPump || '');
      setCaravansCount(prefilledData?.caravansCount || '');
      setGpsLatitude(prefilledData?.gpsLatitude || '');
      setGpsLongitude(prefilledData?.gpsLongitude || '');
      setGovernorate(prefilledData?.governorate || 'صنعاء');
      setDistrict(prefilledData?.district || '');
      setAddress(prefilledData?.address || '');
      setHousingStatus('owned');
      setFamilySize(prefilledData?.familySize || '3');
      setIsDisplaced(false);
      setEducationLevel(prefilledData?.educationLevel || '');
      setQuranMemorization('-');
      setFinancialStatus(prefilledData?.financialStatus || 'poor');
      setDeathCertificate(false);
      setNotes(prefilledData?.notes || '');
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    const handleTriggerCreate = (e: Event) => {
      const customEvent = e as CustomEvent;
      openFormModal(null, customEvent.detail);
    };
    window.addEventListener('nexora-trigger-create-beneficiary', handleTriggerCreate as any);
    return () => {
      window.removeEventListener('nexora-trigger-create-beneficiary', handleTriggerCreate as any);
    };
  }, [beneficiaries]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    // 1. Zero-Friction: Block confirmed exact duplicates to safeguard data integrity
    if (duplicateCheck.hasExactDuplicate) {
      setFormError(duplicateCheck.reasonAr || (lang === 'ar' ? 'تطابق مؤكد يمنع تكرار تسجيل نفس المستفيد.' : 'Duplicate record detected.'));
      setFormSubmitting(false);
      return;
    }

    // 2. Validate National ID format if provided
    if (nationalId && nationalId.trim() !== '') {
      const idValidation = validateYemeniNationalId(nationalId);
      if (!idValidation.isValid) {
        setFormError(idValidation.messageAr || (lang === 'ar' ? 'الرقم الوطني غير صحيح.' : 'Invalid National ID'));
        setFormSubmitting(false);
        return;
      }
    }

    const payload: any = {
      full_name_ar: fullNameAr,
      beneficiary_code: beneficiaryCode,
      archetype,
      category_code: archetype === 'COMMUNITY_ENTITY' ? entitySubtype : categoryCode,
      status_code: statusCode,
      gender_code: genderCode,
      age: age ? parseInt(age) : null,
      phone_primary: phonePrimary,
      national_id: nationalId,
      governorate,
      district,
      address,
      housing_status: housingStatus,
      family_size: familySize ? parseInt(familySize) : 1,
      education_level: educationLevel,
      quran_memorization: quranMemorization,
      financial_status: financialStatus,
      death_certificate: deathCertificate,
      notes,
      individual_details: archetype === 'INDIVIDUAL' ? {
        national_id: nationalId,
        gender: genderCode as any,
        guardian_name: guardianName
      } : undefined,
      family_details: archetype === 'FAMILY' ? {
        head_of_family_name: headOfFamilyName || fullNameAr,
        head_national_id: nationalId,
        family_members_count: familySize ? parseInt(familySize) : 1,
        males_count: 1,
        females_count: 1,
        children_under_5_count: 0,
        is_displaced: isDisplaced,
        housing_status: housingStatus as any
      } : undefined,
      community_entity_details: archetype === 'COMMUNITY_ENTITY' ? {
        entity_subtype: entitySubtype as any,
        supervisor_name: supervisorName,
        supervisor_phone: supervisorPhone,
        capacity_beneficiaries_count: capacityCount ? parseInt(capacityCount) : 0,
        village_or_neighborhood: address,
        gps_latitude: gpsLatitude ? parseFloat(gpsLatitude) : undefined,
        gps_longitude: gpsLongitude ? parseFloat(gpsLongitude) : undefined,
        technical_specs: {
          well_depth_meters: wellDepth ? parseFloat(wellDepth) : undefined,
          solar_pump_wattage: solarPump ? parseFloat(solarPump) : undefined,
          caravans_count: caravansCount ? parseInt(caravansCount) : undefined
        }
      } : undefined
    };

    try {
      const url = selectedBeneficiary 
        ? `/api/tables/beneficiaries/${selectedBeneficiary.id}` 
        : `/api/tables/beneficiaries`;
      
      const response = await fetch(url, {
        method: selectedBeneficiary ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        if (response.status === 403 && errData.violations) {
          throw new PolicyViolationError(errData);
        }
        throw new Error(errData.error || 'Failed to save beneficiary record.');
      }

      showToast({
        type: 'success',
        title: lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved Successfully',
        message: lang === 'ar' 
          ? `تم اعتماد وحفظ سجل المستفيد (${beneficiaryCode}) في قاعدة البيانات الموحدة.` 
          : `Beneficiary record (${beneficiaryCode}) committed to unified database.`,
        duration: 3500
      });

      onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      if (err instanceof PolicyViolationError) {
        setPolicyViolations(err.violations);
        setFormError(err.primaryMessage);
      } else {
        setFormError(err.message);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmation = lang === 'ar'
      ? 'هل أنت متأكد من أرشفة/حذف سجل هذا المستفيد؟ سيتم تجميد العمليات المرتبطة به.'
      : 'Are you sure you want to archive/delete this beneficiary? Associated operations might be frozen.';

    if (!window.confirm(confirmation)) return;

    try {
      const response = await fetch(`/api/tables/beneficiaries/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to archive record.');
      onRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: lang === 'ar' ? 'خطأ في العملية' : 'Operation Error', message: err.message });
    }
  };

  // Quick statistics calculated dynamically
  const statTotal = beneficiaries.length;
  const statOrphans = beneficiaries.filter(b => b.category_code === 'ORPHAN').length;
  const statPoor = beneficiaries.filter(b => b.category_code === 'POOR_FAMILY').length;
  const statActive = beneficiaries.filter(b => b.status_code === 'active').length;

  return (
    <ModuleShell
      titleAr="نظام المستفيدين والخدمات"
      titleEn="Service Delivery & Beneficiaries OS"
      descAr="قاعدة بيانات المستفيدين، التحقق من الهوية وتطبيق معايير الاستحقاق"
      descEn="Beneficiary registries, eligibility criteria, and humanitarian assistance routing"
      domainCode="NEB-06"
      icon={Users}
      accent="blue"
      lang={lang}
      onRefresh={onRefresh}
      onNavigate={onNavigate}
      isLoading={loading}
      recordCount={filteredList.length}
      breadcrumbs={[
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', onClick: () => onNavigate?.('dashboard') },
        { label: lang === 'ar' ? 'المستفيدون' : 'Beneficiaries' }
      ]}
    >
    <div className="space-y-6 text-slate-800">
      {/* Enterprise Operational ToolStrip */}
      <EnterpriseToolStrip
        lang={lang}
        activeModule="beneficiaries"
        onAddRecord={() => openFormModal(null)}
        addRecordLabelAr="تسجيل مستفيد جديد"
        addRecordLabelEn="Register Beneficiary"
        onRefreshData={onRefresh}
        isLoading={loading}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        onResetFilters={() => {
          setSearchTerm('');
          setFilterCategory('ALL');
          setFilterGov('ALL');
          setFilterGender('ALL');
          setFilterStatus('ALL');
        }}
        activeFilterCount={(searchTerm ? 1 : 0) + (filterCategory !== 'ALL' ? 1 : 0) + (filterGov !== 'ALL' ? 1 : 0) + (filterGender !== 'ALL' ? 1 : 0) + (filterStatus !== 'ALL' ? 1 : 0)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        showViewModeSwitcher={false}
      />
      
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {lang === 'ar' ? 'إدارة المستفيدين والمحتاجين' : 'Beneficiaries & Field Ledger'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'ar' ? 'تسجيل وإعداد المستحقين ميدانياً لكفالات الأيتام ومساعدات الأسر' : 'Manage registered relief seekers, orphans, and poor family cards'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowLineageModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title={lang === 'ar' ? 'سلسلة التتبع والتكامل المؤسسي الشامل' : 'Cross-Entity Lineage & Traceability'}
          >
            <GitCommit className="w-4 h-4 text-indigo-200" />
            <span>{lang === 'ar' ? 'التتبع المؤسسي' : 'Cross Lineage'}</span>
          </button>
          <button
            onClick={() => setIsPDFModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title={lang === 'ar' ? 'طباعة كشف المستفيدين المعتمد (A4 PDF)' : 'Print Certified Beneficiaries Registry'}
          >
            <Printer className="w-4 h-4 text-emerald-200" />
            <span>{lang === 'ar' ? 'طباعة كشف معتمد' : 'Print Certified'}</span>
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md hover:shadow-emerald-600/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>{lang === 'ar' ? 'تصدير السجل' : 'Export Registry'}</span>
          </button>

          <button
            onClick={() => openFormModal(null)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md hover:shadow-amber-600/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة مستفيد جديد' : 'Register Beneficiary'}</span>
          </button>
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'إجمالي الحالات' : 'Total Cases'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{loading ? '...' : statTotal}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'الأيتام المكفولين' : 'Sponsored Orphans'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{loading ? '...' : statOrphans}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'أسر فقيرة ومعوزة' : 'Poor Families'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{loading ? '...' : statPoor}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'الحالات النشطة حالياً' : 'Active Cases'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{loading ? '...' : statActive}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400"
                  style={lang === 'ar' ? { left: 'auto', right: '0', paddingRight: '12px' } : {}}
            >
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder={lang === 'ar' ? 'البحث عن طريق الاسم، رقم الهاتف، أو كود الحالة...' : 'Search by full name, code, phone primary...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:border-amber-500/50 rounded-xl py-2 px-4 text-xs focus:outline-none transition-all"
              style={lang === 'ar' ? { paddingRight: '36px', paddingLeft: '16px' } : { paddingLeft: '36px', paddingRight: '16px' }}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* PII Privacy Masking Toggle */}
            <button
              onClick={() => {
                setMaskSensitivePII(prev => !prev);
                showToast({
                  type: maskSensitivePII ? 'warning' : 'success',
                  title: lang === 'ar' ? (maskSensitivePII ? 'كشف البيانات الشخصية' : 'تفعيل حماية الخصوصية PII') : (maskSensitivePII ? 'PII Unmasked' : 'Privacy Protection Enabled'),
                  message: lang === 'ar' 
                    ? (maskSensitivePII ? 'تم كشف أرقام الهواتف مؤقتاً للتحقق الميداني والاتصال' : 'تم تشفير وحجب أرقام الهواتف والبيانات الشخصية') 
                    : (maskSensitivePII ? 'Phone numbers visible for field verification' : 'Sensitive phone numbers masked for data privacy'),
                  duration: 3500
                });
              }}
              className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                maskSensitivePII
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}
              title={lang === 'ar' ? 'حماية بيانات المستفيدين الشخصية وفق معايير إسفير الدولية' : 'Toggle PII data protection under Sphere/CHS standards'}
            >
              {maskSensitivePII ? <Shield className="w-3.5 h-3.5 text-emerald-600" /> : <Eye className="w-3.5 h-3.5 text-amber-600" />}
              <span className="hidden sm:inline">
                {lang === 'ar' ? (maskSensitivePII ? 'حماية الخصوصية نشطة' : 'كشف الهواتف') : (maskSensitivePII ? 'PII Protected' : 'PII Revealed')}
              </span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showFilters || filterCategory !== 'ALL' || filterGov !== 'ALL' || filterGender !== 'ALL' || filterStatus !== 'ALL'
                  ? 'bg-amber-50 border-amber-200 text-amber-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-zinc-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تصفية متقدمة' : 'Filters'}</span>
            </button>

            {(searchTerm || filterCategory !== 'ALL' || filterGov !== 'ALL' || filterGender !== 'ALL' || filterStatus !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('ALL');
                  setFilterGov('ALL');
                  setFilterGender('ALL');
                  setFilterStatus('ALL');
                }}
                className="text-xs font-bold text-zinc-400 hover:text-rose-600 transition-all cursor-pointer px-2"
              >
                {lang === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 animate-slide-down">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'تصنيف الحالة' : 'Category'}</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-lg p-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">{lang === 'ar' ? 'الكل' : 'All Categories'}</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'المحافظة' : 'Governorate'}</label>
              <select
                value={filterGov}
                onChange={(e) => setFilterGov(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-lg p-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">{lang === 'ar' ? 'الكل' : 'All Governorates'}</option>
                {governorates.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'الجنس' : 'Gender'}</label>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-lg p-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">{lang === 'ar' ? 'الكل' : 'All'}</option>
                <option value="MALE">{lang === 'ar' ? 'ذكر' : 'Male'}</option>
                <option value="FEMALE">{lang === 'ar' ? 'أنثى' : 'Female'}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase">{lang === 'ar' ? 'الحالة في النظام' : 'Status'}</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-lg p-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">{lang === 'ar' ? 'الكل' : 'All Statuses'}</option>
                <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
                <option value="inactive">{lang === 'ar' ? 'غير نشط' : 'Inactive'}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Grid */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-bold text-xs space-y-3">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>{lang === 'ar' ? 'جاري جلب البيانات السحابية لقاعدة البيانات...' : 'Establishing remote Neon database session...'}</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="text-zinc-300 text-3xl font-bold">📂</p>
            <p className="text-xs font-black text-zinc-400">{lang === 'ar' ? 'لم يتم العثور على أي مستفيدين يطابقون هذه الخصائص' : 'No matching beneficiary cards found.'}</p>
            <p className="text-[11px] text-zinc-400">{lang === 'ar' ? 'قم بتعديل خيارات البحث أو أضف مستفيد جديد.' : 'Adjust search queries or register a new family.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
              <thead className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 tracking-wider">
                <tr>
                  <th className="px-6 py-3">{lang === 'ar' ? 'كود الحالة' : 'Code'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'الاسم الرباعي' : 'Full Name'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'المنطقة والموقع' : 'Location'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'الحالة المادية' : 'Financial'}</th>
                  <th className="px-6 py-3">{lang === 'ar' ? 'العمر' : 'Age'}</th>
                  <th className="px-6 py-3 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredList.map((ben) => (
                  <tr key={ben.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {ben.beneficiary_code || (lang === 'ar' ? 'مستفيد-معتمد' : 'BEN-NEW')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <button
                          onClick={() => setViewingBeneficiary(ben)}
                          className="font-extrabold text-slate-800 hover:text-amber-600 transition-all text-right block font-sans cursor-pointer"
                        >
                          {ben.full_name_ar || 'اسم مستفيد مجهول'}
                        </button>
                        <span className="text-[10px] text-zinc-400 mt-0.5 block">
                          {ben.gender_code === 'FEMALE' ? (lang === 'ar' ? 'أنثى' : 'Female') : (lang === 'ar' ? 'ذكر' : 'Male')} 
                          {ben.family_size ? ` • ${lang === 'ar' ? `أفراد الأسرة: ${ben.family_size}` : `Family: ${ben.family_size}`}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        ben.category_code === 'ORPHAN' ? 'bg-sky-50 text-sky-700' :
                        ben.category_code === 'POOR_FAMILY' ? 'bg-rose-50 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {ben.category_code === 'ORPHAN' ? (lang === 'ar' ? 'يتيم مكفول' : 'Orphan') :
                         ben.category_code === 'POOR_FAMILY' ? (lang === 'ar' ? 'أسرة متعففة' : 'Poor Family') :
                         ben.category_code === 'DISPLACED' ? (lang === 'ar' ? 'نازح' : 'Displaced') :
                         (lang === 'ar' ? 'حالة مستفيدة' : 'Beneficiary')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[150px]">
                          {ben.governorate || ''} {ben.district ? ` - ${ben.district}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-zinc-300">
                      {ben.phone_primary ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{maskPhone(ben.phone_primary)}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        ben.financial_status === 'poor' ? 'bg-amber-50 text-amber-700' :
                        ben.financial_status === 'very_poor' ? 'bg-red-50 text-red-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {ben.financial_status === 'poor' ? (lang === 'ar' ? 'فقير' : 'Poor') :
                         ben.financial_status === 'very_poor' ? (lang === 'ar' ? 'معدم/شديد الفقر' : 'Destitute') :
                         (lang === 'ar' ? 'متوسط' : 'Medium')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                      {ben.age ? `${ben.age} ${lang === 'ar' ? 'عاماً' : 'yrs'}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handlePrintBeneficiary(ben)}
                          className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                          title={lang === 'ar' ? 'طباعة استمارة دراسة الحالة' : 'Print Case Dossier'}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openFormModal(ben)}
                          className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                          title={lang === 'ar' ? 'تعديل البيانات' : 'Edit'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ben.id)}
                          className="p-1 bg-slate-50 border border-slate-200 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title={lang === 'ar' ? 'أرشفة الحالة' : 'Archive'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Universal Object Page Modal (UOP Standard for Beneficiaries) */}
      {viewingBeneficiary && (
        <UniversalObjectPageModal
          isOpen={Boolean(viewingBeneficiary)}
          onClose={() => setViewingBeneficiary(null)}
          lang={lang}
          domainCode="NEB-06"
          domainNameAr="نظام تقديم الخدمات والرعاية الاجتماعية"
          domainNameEn="Service Delivery & Beneficiary Care OS"
          recordCode={viewingBeneficiary.beneficiary_code || (lang === 'ar' ? 'مستفيد-رُحماء' : 'BEN-ROHAMAA')}
          titleAr={viewingBeneficiary.full_name_ar}
          titleEn={viewingBeneficiary.full_name_en || viewingBeneficiary.full_name_ar}
          status={{
            code: viewingBeneficiary.status_code || 'ACTIVE',
            labelAr: viewingBeneficiary.status_code === 'ACTIVE' ? 'نشط ومستحق للدعم' : 'قيد التدقيق والبحث',
            labelEn: viewingBeneficiary.status_code === 'ACTIVE' ? 'Active Eligible' : 'Audit Pending',
            color: viewingBeneficiary.status_code === 'ACTIVE' ? 'emerald' : 'amber'
          }}
          metrics={[
            {
              labelAr: 'حجم أفراد الأسرة',
              labelEn: 'Family Size',
              value: viewingBeneficiary.family_size || 1,
              unitAr: 'أفراد',
              unitEn: 'indiv.',
              color: 'blue'
            },
            {
              labelAr: 'مؤشر الاستحقاق والفقر',
              labelEn: 'Eligibility Score',
              value: '95.0%',
              unitAr: 'درجة',
              unitEn: 'pts',
              color: 'emerald'
            },
            {
              labelAr: 'المساعدات المستلمة',
              labelEn: 'Aids Received',
              value: 6,
              unitAr: 'دورة صرف',
              unitEn: 'cycles',
              color: 'amber'
            },
            {
              labelAr: 'حالة السكن',
              labelEn: 'Housing Status',
              value: viewingBeneficiary.housing_status === 'owned' ? (lang === 'ar' ? 'ملك' : 'Owned') : (lang === 'ar' ? 'إيجار' : 'Rented'),
              color: 'purple'
            }
          ]}
          overviewFieldGroups={[
            {
              groupTitleAr: '1. البيانات الشخصية والتوثيق',
              groupTitleEn: '1. Personal & Biometric Identity',
              fields: [
                { labelAr: 'الاسم الرباعي الكامل', labelEn: 'Full Name', value: viewingBeneficiary.full_name_ar },
                { labelAr: 'رقم السجل الموحد', labelEn: 'Record Code', value: viewingBeneficiary.beneficiary_code, isCopyable: true },
                { labelAr: 'رقم الهاتف الأساسي', labelEn: 'Primary Phone', value: viewingBeneficiary.phone_primary || '—', isCopyable: true },
                { labelAr: 'العمر التقديري', labelEn: 'Age', value: viewingBeneficiary.age ? `${viewingBeneficiary.age} عاماً` : '—' },
                { labelAr: 'المستوى التعليمي', labelEn: 'Education', value: viewingBeneficiary.education_level || '—' }
              ]
            },
            {
              groupTitleAr: '2. النطاق الجغرافي والسكن',
              groupTitleEn: '2. Geographical & Residence Scope',
              fields: [
                { labelAr: 'المحافظة والمديرية', labelEn: 'Governorate / District', value: `${viewingBeneficiary.governorate} / ${viewingBeneficiary.district || '—'}` },
                { labelAr: 'العنوان التفصيلي', labelEn: 'Detailed Address', value: viewingBeneficiary.address || '—' },
                { labelAr: 'حالة المسكن', labelEn: 'Housing Condition', value: viewingBeneficiary.housing_status === 'owned' ? 'ملك' : 'إيجار' },
                { labelAr: 'حفظ القرآن الكريم', labelEn: 'Quran Memorization', value: viewingBeneficiary.quran_memorization || '—' }
              ]
            },
            {
              groupTitleAr: '3. معايير الاستحقاق والحوكمة (CHS 9)',
              groupTitleEn: '3. Eligibility & CHS Compliance',
              fields: [
                { labelAr: 'تصنيف الحالة', labelEn: 'Case Category', value: viewingBeneficiary.category_code === 'ORPHAN' ? 'يتيم مكفول' : viewingBeneficiary.category_code === 'POOR_FAMILY' ? 'أسرة متعففة' : 'حالة إنسانية' },
                { labelAr: 'الوضع المادي والمعيشي', labelEn: 'Livelihood Status', value: viewingBeneficiary.financial_status === 'poor' ? 'فقير' : 'معدم للغاية' },
                { labelAr: 'الملاحظات الميدانية', labelEn: 'Field Notes', value: viewingBeneficiary.notes || 'حالة مستحقة معتمدة من لجنة البحث الاجتماعي.' }
              ]
            }
          ]}
          timeline={[
            { id: 'tl-1', titleAr: 'المسح الميداني وتعبئة استمارة الحالة', titleEn: 'Field Survey', actor: 'فريق المسح الميداني', roleAr: 'باحث اجتماعي', roleEn: 'Social Worker', timestamp: '2026-02-10', status: 'approved' },
            { id: 'tl-2', titleAr: 'الفحص الجنائي للرقم الوطني ومنع الازدواج', titleEn: 'National ID De-duplication', actor: 'نظام UAMEX المركزي', roleAr: 'محرك التحقق الآلي', roleEn: 'Validation Engine', timestamp: '2026-02-11', status: 'approved' },
            { id: 'tl-3', titleAr: 'اعتماد لجنة الرعاية الاجتماعية والبت', titleEn: 'Social Committee Approval', actor: 'أ. إبراهيم النهاري', roleAr: 'رئيس لجنة الرعاية', roleEn: 'Care Committee Head', timestamp: '2026-02-15', status: 'approved' }
          ]}
          linkedRecords={[
            { id: 'lr-1', code: 'SPON-2026-042', typeAr: 'كفالة أيتام دورية', typeEn: 'Orphan Sponsorship', titleAr: 'كفالة المعيشة والتعليم الشهرية', amountYer: 50000, targetTab: 'sponsorships' },
            { id: 'lr-2', code: 'DIST-2026-089', typeAr: 'قسيمة سلة غذائية', typeEn: 'Food Basket Voucher', titleAr: 'صرف السلة الغذائية الربع سنوية', targetTab: 'activities' }
          ]}
          auditTrail={[
            { id: 'at-1', actionAr: 'تحديث بيانات السكن ورقم الهاتف', actionEn: 'Update phone & address', user: 'م. خالد الحميري', timestamp: '2026-08-10 09:20' }
          ]}
          onEdit={() => {
            const b = viewingBeneficiary;
            setViewingBeneficiary(null);
            openFormModal(b);
          }}
          onDelete={() => {
            if (viewingBeneficiary) {
              handleDelete(viewingBeneficiary.id);
              setViewingBeneficiary(null);
            }
          }}
        />
      )}

      {/* Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 max-w-xl w-full overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {selectedBeneficiary 
                    ? (lang === 'ar' ? 'تعديل ملف المستفيد' : 'Edit Beneficiary Dossier')
                    : (lang === 'ar' ? 'تسجيل مستفيد ميداني جديد' : 'Register New Field Beneficiary')}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {lang === 'ar' ? 'أدخل البيانات الديموغرافية والمالية بدقة لضمان مطابقة الكفالات.' : 'Fill demographic and physical descriptors to map accounting ledgers.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-zinc-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Universal Master Archetype Selector */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                <span>{lang === 'ar' ? 'نمط سجل المستفيد الموحد (Universal Archetype)' : 'Beneficiary Master Archetype'}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {beneficiaryCode}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'INDIVIDUAL', labelAr: 'فرد / شخص', labelEn: 'Individual Person', icon: Users, desc: 'أيتام، معاقين، أرامل، مرضى' },
                  { id: 'FAMILY', labelAr: 'أسرة معيلة', labelEn: 'Vulnerable Family', icon: Heart, desc: 'أسر أيتام، نازحين، أشد فقراً' },
                  { id: 'COMMUNITY_ENTITY', labelAr: 'كيان / مرفق نفع عام', labelEn: 'Community Facility', icon: Building2, desc: 'مسجد، بئر ماء، كرفانات' }
                ].map(arch => (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => {
                      setArchetype(arch.id as any);
                      if (!selectedBeneficiary) {
                        const newCode = generateNextBeneficiaryCode(
                          arch.id as any,
                          entitySubtype,
                          beneficiaries.map(b => b.beneficiary_code || '')
                        );
                        setBeneficiaryCode(newCode);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer ${
                      archetype === arch.id
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <arch.icon className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? arch.labelAr : arch.labelEn}</span>
                    </div>
                    <div className={`text-[9px] mt-0.5 ${archetype === arch.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {arch.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs selector */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setActiveFormTab('personal')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeFormTab === 'personal' ? 'border-emerald-600 text-emerald-700 bg-white dark:bg-zinc-900' : 'border-transparent text-zinc-400 hover:text-slate-600'
                }`}
              >
                {lang === 'ar' ? (archetype === 'COMMUNITY_ENTITY' ? 'بيانات المرفق والمسؤول' : 'البيانات الأساسية') : 'Core Info'}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('demographic')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeFormTab === 'demographic' ? 'border-emerald-600 text-emerald-700 bg-white dark:bg-zinc-900' : 'border-transparent text-zinc-400 hover:text-slate-600'
                }`}
              >
                {lang === 'ar' ? 'الموقع الجغرافي والإدارة' : 'Location & Region'}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('support')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeFormTab === 'support' ? 'border-emerald-600 text-emerald-700 bg-white dark:bg-zinc-900' : 'border-transparent text-zinc-400 hover:text-slate-600'
                }`}
              >
                {lang === 'ar' ? 'التقييم الاجتماعي والملاحظات' : 'Welfare & Specs'}
              </button>
            </div>

            {/* Live Deduplication Alerts (Zero-Friction: Instant & Non-blocking for soft matches) */}
            {duplicateCheck.hasExactDuplicate && (
              <div className="m-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{duplicateCheck.reasonAr}</span>
                </div>
                {duplicateCheck.matchedBeneficiaryId && (
                  <button
                    type="button"
                    onClick={() => {
                      const matched = beneficiaries.find(b => b.id === duplicateCheck.matchedBeneficiaryId);
                      if (matched) {
                        setIsModalOpen(false);
                        setViewingBeneficiary(matched);
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black cursor-pointer shrink-0"
                  >
                    {lang === 'ar' ? 'فتح السجل المسجل' : 'Open Record'}
                  </button>
                )}
              </div>
            )}

            {duplicateCheck.hasWarningDuplicate && !duplicateCheck.hasExactDuplicate && (
              <div className="mx-4 mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{duplicateCheck.reasonAr}</span>
              </div>
            )}

            {/* Error Banner inside form */}
            {formError && (
              <div className="m-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {policyViolations && policyViolations.length > 0 && (
              <div className="mx-4">
                <PolicyViolationAlert
                  violations={policyViolations}
                  lang={lang}
                  onDismiss={() => setPolicyViolations(null)}
                />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave}>
              <div className="p-6 max-h-[440px] overflow-y-auto space-y-4">
                
                {/* Tab: Core Info */}
                {activeFormTab === 'personal' && (
                  <div className="space-y-3">
                    {/* Entity Subtype Selector if COMMUNITY_ENTITY */}
                    {archetype === 'COMMUNITY_ENTITY' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'نوع المرفق المجتمعي أو الكيان' : 'Facility Type'}</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'MOSQUE', labelAr: 'مسجد / جامع', icon: '🕌' },
                            { id: 'WATER_WELL', labelAr: 'بئر ماء / محطة', icon: '💧' },
                            { id: 'SHELTER_CARAVAN', labelAr: 'مخيم / كرفانات', icon: '🏕️' }
                          ].map(sub => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setEntitySubtype(sub.id);
                                if (!selectedBeneficiary) {
                                  const newCode = generateNextBeneficiaryCode('COMMUNITY_ENTITY', sub.id, beneficiaries.map(b => b.beneficiary_code || ''));
                                  setBeneficiaryCode(newCode);
                                }
                              }}
                              className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                entitySubtype === sub.id
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black'
                                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                              }`}
                            >
                              <span>{sub.icon} {sub.labelAr}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'كود السجل (تلقائي ذكي)' : 'Master Code'}</label>
                        <input 
                          type="text" 
                          required 
                          readOnly
                          value={beneficiaryCode}
                          className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-black text-emerald-700 dark:text-emerald-400 focus:outline-none" 
                        />
                      </div>

                      {archetype === 'INDIVIDUAL' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'تصنيف الحالة المستحقة' : 'Category'}</label>
                          <select 
                            value={categoryCode}
                            onChange={(e) => setCategoryCode(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold focus:outline-none"
                          >
                            <option value="ORPHAN">{lang === 'ar' ? 'يتيم (Orphan)' : 'Orphan'}</option>
                            <option value="POOR_FAMILY">{lang === 'ar' ? 'أسرة فقيرة (Poor Family)' : 'Poor Family'}</option>
                            <option value="DISABLED">{lang === 'ar' ? 'ذوي الاحتياجات الخاصة (Disabled)' : 'Disabled'}</option>
                            <option value="WIDOW">{lang === 'ar' ? 'أرملة (Widow)' : 'Widow'}</option>
                            <option value="SICK">{lang === 'ar' ? 'مريض مزمن (Chronic Sick)' : 'Chronic Sick'}</option>
                            <option value="STUDENT">{lang === 'ar' ? 'طالب علم (Student)' : 'Student'}</option>
                          </select>
                        </div>
                      )}

                      {archetype === 'FAMILY' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'عدد أفراد الأسرة' : 'Family Size'}</label>
                          <input 
                            type="number" 
                            value={familySize}
                            onChange={(e) => setFamilySize(e.target.value)}
                            placeholder="مثال: 6"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                          />
                        </div>
                      )}

                      {archetype === 'COMMUNITY_ENTITY' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">
                            {entitySubtype === 'MOSQUE' ? (lang === 'ar' ? 'سعة المصلين التقريبية' : 'Capacity') :
                             entitySubtype === 'WATER_WELL' ? (lang === 'ar' ? 'عدد الأسر المستفيدة' : 'Beneficiary Families') :
                             (lang === 'ar' ? 'عدد الأسر بالمخيم' : 'Camp Families')}
                          </label>
                          <input 
                            type="number" 
                            value={capacityCount}
                            onChange={(e) => setCapacityCount(e.target.value)}
                            placeholder="مثال: 250"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500">
                        {archetype === 'INDIVIDUAL' ? (lang === 'ar' ? 'الاسم الرباعي للشخص المستفيد' : 'Full Name (Arabic)') :
                         archetype === 'FAMILY' ? (lang === 'ar' ? 'اسم رب الأسرة المعيل رباعياً' : 'Family Head Name') :
                         (lang === 'ar' ? 'اسم المسجد / بئر الماء / المخيم رسمياً' : 'Facility Official Name')}
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={fullNameAr}
                        onChange={(e) => setFullNameAr(e.target.value)}
                        placeholder={
                          archetype === 'COMMUNITY_ENTITY'
                            ? (entitySubtype === 'MOSQUE' ? 'جامع الإحسان والتقوى الكبير' : entitySubtype === 'WATER_WELL' ? 'بئر مياه الرحمة ومحطة الطاقة الشمسية' : 'مخيم الأمل للكرفانات السكنية')
                            : 'مثال: محمد عبد الله قاسم الشرعبي'
                        }
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold focus:outline-none focus:border-emerald-500" 
                      />
                    </div>

                    {/* National ID for Individual and Family */}
                    {archetype !== 'COMMUNITY_ENTITY' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">
                            {lang === 'ar' ? 'الرقم الوطني للبطاقة الشخصية (11 رقم)' : 'National ID (11 digits)'}
                          </label>
                          <input 
                            type="text" 
                            value={nationalId}
                            maxLength={11}
                            onChange={(e) => setNationalId(e.target.value)}
                            placeholder="010100XXXXX"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500" 
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">
                            {archetype === 'INDIVIDUAL' ? (lang === 'ar' ? 'اسم الوصي / ولي الأمر' : 'Guardian Name') : (lang === 'ar' ? 'حالة النزوح' : 'Displaced Status')}
                          </label>
                          {archetype === 'INDIVIDUAL' ? (
                            <input 
                              type="text" 
                              value={guardianName}
                              onChange={(e) => setGuardianName(e.target.value)}
                              placeholder="اسم ولي أمر اليتيم"
                              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                            />
                          ) : (
                            <label className="flex items-center gap-2 mt-2 cursor-pointer font-bold text-xs text-slate-600 dark:text-zinc-300">
                              <input 
                                type="checkbox" 
                                checked={isDisplaced}
                                onChange={(e) => setIsDisplaced(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500" 
                              />
                              <span>{lang === 'ar' ? 'أسرة نازحة من مناطق الصراع' : 'Displaced Family'}</span>
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Community Entity Supervisor Details */}
                    {archetype === 'COMMUNITY_ENTITY' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">
                            {entitySubtype === 'MOSQUE' ? (lang === 'ar' ? 'اسم إمام / ناظر المسجد' : 'Imam/Supervisor Name') :
                             entitySubtype === 'WATER_WELL' ? (lang === 'ar' ? 'مسؤول لجنة البئر / المهندس' : 'Well Manager') :
                             (lang === 'ar' ? 'مشرف المخيم الميداني' : 'Camp Coordinator')}
                          </label>
                          <input 
                            type="text" 
                            value={supervisorName}
                            onChange={(e) => setSupervisorName(e.target.value)}
                            placeholder="الاسم الثلاثي للمشرف"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'هاتف المشرف للتواصل' : 'Supervisor Phone'}</label>
                          <input 
                            type="text" 
                            value={supervisorPhone}
                            onChange={(e) => setSupervisorPhone(e.target.value)}
                            placeholder="77XXXXXXX"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                          />
                        </div>
                      </div>
                    )}

                    {/* Phone Number for Individual / Family */}
                    {archetype !== 'COMMUNITY_ENTITY' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'رقم الهاتف الأساسي' : 'Primary Phone'}</label>
                          <input 
                            type="text" 
                            required
                            value={phonePrimary}
                            onChange={(e) => setPhonePrimary(e.target.value)}
                            placeholder="77XXXXXXX"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'العمر بالسنوات' : 'Age'}</label>
                          <input 
                            type="number" 
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="مثال: 12"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Demographics & Smart Autocomplete */}
                {activeFormTab === 'demographic' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <SmartAutocompleteInput
                        label={lang === 'ar' ? 'المحافظة' : 'Governorate'}
                        value={governorate}
                        onChange={(val) => {
                          setGovernorate(val);
                          setDistrict(''); // auto-reset district when governorate changes for zero friction
                        }}
                        options={availableGovernorates}
                        placeholder={lang === 'ar' ? 'اختر أو اكتب المحافظة...' : 'Select governorate'}
                        required
                        isRtl={lang === 'ar'}
                      />

                      <SmartAutocompleteInput
                        label={lang === 'ar' ? 'المديرية' : 'District'}
                        value={district}
                        onChange={(val) => setDistrict(val)}
                        options={availableDistricts}
                        placeholder={lang === 'ar' ? 'اختر المديرية التابعة...' : 'Select district'}
                        badgeText={governorate}
                        isRtl={lang === 'ar'}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'العنوان التفصيلي (القرية / الحارة / المعلم البارز)' : 'Detailed Address'}</label>
                      <textarea 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="مثال: قرية المشرعة، بجوار المركز الصحي القديم"
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold focus:outline-none h-16 resize-none" 
                      />
                    </div>

                    {/* Community Entity GPS Coordinates */}
                    {archetype === 'COMMUNITY_ENTITY' && (
                      <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase">
                          {lang === 'ar' ? 'الإحداثيات الجغرافية للموقع (GPS - منع التكرار المكاني)' : 'Geographic GPS Coordinates'}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">خط العرض (Latitude)</label>
                            <input
                              type="number"
                              step="any"
                              value={gpsLatitude}
                              onChange={(e) => setGpsLatitude(e.target.value)}
                              placeholder="13.5795"
                              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">خط الطول (Longitude)</label>
                            <input
                              type="number"
                              step="any"
                              value={gpsLongitude}
                              onChange={(e) => setGpsLongitude(e.target.value)}
                              placeholder="44.0201"
                              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {archetype !== 'COMMUNITY_ENTITY' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'حالة السكن' : 'Housing Status'}</label>
                        <select 
                          value={housingStatus}
                          onChange={(e) => setHousingStatus(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold focus:outline-none"
                        >
                          <option value="owned">{lang === 'ar' ? 'ملك (Owned)' : 'Owned'}</option>
                          <option value="rented">{lang === 'ar' ? 'إيجار (Rented)' : 'Rented'}</option>
                          <option value="displaced">{lang === 'ar' ? 'نازح / خيمة / كرفانة' : 'Displaced / Shelter'}</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Support & Technical Specs */}
                {activeFormTab === 'support' && (
                  <div className="space-y-3">
                    {archetype === 'COMMUNITY_ENTITY' && entitySubtype === 'WATER_WELL' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'عمق البئر بالأمتار' : 'Well Depth (Meters)'}</label>
                          <input 
                            type="number" 
                            value={wellDepth}
                            onChange={(e) => setWellDepth(e.target.value)}
                            placeholder="مثال: 120"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'قدرة منظومة الطاقة الشمسية (وات)' : 'Solar System (Watts)'}</label>
                          <input 
                            type="number" 
                            value={solarPump}
                            onChange={(e) => setSolarPump(e.target.value)}
                            placeholder="مثال: 15000"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                          />
                        </div>
                      </div>
                    )}

                    {archetype === 'COMMUNITY_ENTITY' && entitySubtype === 'SHELTER_CARAVAN' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'عدد الكرفانات / الوحدات السكنية' : 'Caravans Count'}</label>
                        <input 
                          type="number" 
                          value={caravansCount}
                          onChange={(e) => setCaravansCount(e.target.value)}
                          placeholder="مثال: 45"
                          className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                        />
                      </div>
                    )}

                    {archetype === 'INDIVIDUAL' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'المستوى التعليمي' : 'Education Level'}</label>
                          <input 
                            type="text" 
                            value={educationLevel}
                            onChange={(e) => setEducationLevel(e.target.value)}
                            placeholder="أساسي، إعدادي..."
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'مستوى حفظ القرآن' : 'Quran Memorization'}</label>
                          <input 
                            type="text" 
                            value={quranMemorization}
                            onChange={(e) => setQuranMemorization(e.target.value)}
                            placeholder="جزء عم، 5 أجزاء..."
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'المستوى المعيشي والاحتياج' : 'Need Level'}</label>
                        <select 
                          value={financialStatus}
                          onChange={(e) => setFinancialStatus(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold focus:outline-none"
                        >
                          <option value="very_poor">{lang === 'ar' ? 'معدم / أشد احتياجاً (Extreme)' : 'Extreme Need'}</option>
                          <option value="poor">{lang === 'ar' ? 'فقير / مستحق (High)' : 'High Need'}</option>
                          <option value="medium">{lang === 'ar' ? 'متوسط / مستور (Medium)' : 'Medium'}</option>
                        </select>
                      </div>

                      {archetype === 'INDIVIDUAL' && categoryCode === 'ORPHAN' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'شهادة وفاة الأب' : 'Death Certificate'}</label>
                          <label className="flex items-center gap-2 mt-2 cursor-pointer font-bold text-xs text-slate-600 dark:text-zinc-300">
                            <input 
                              type="checkbox" 
                              checked={deathCertificate}
                              onChange={(e) => setDeathCertificate(e.target.checked)}
                              className="w-4 h-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500" 
                            />
                            <span>{lang === 'ar' ? 'شهادة الوفاة متوفرة ومعتمدة' : 'Verified Certificate'}</span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'ملاحظات تفصيلية أو احتياجات خاصة' : 'Dossier Notes'}</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="توصيات الباحث الميداني..."
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold focus:outline-none h-16 resize-none" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                
                {activeFormTab === 'personal' && (
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('demographic')}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    {lang === 'ar' ? 'التالي: السكن' : 'Next: Location'}
                  </button>
                )}

                {activeFormTab === 'demographic' && (
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('support')}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    {lang === 'ar' ? 'التالي: الوضع المالي' : 'Next: Financials'}
                  </button>
                )}

                {activeFormTab === 'support' && (
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {formSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {selectedBeneficiary 
                        ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                        : (lang === 'ar' ? 'حفظ المستفيد الجديد' : 'Register Case')}
                    </span>
                  </button>
                )}
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Export Registry Modal */}
      <PrintPDFTemplateModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        lang={lang}
        type="beneficiary"
        data={{
          beneficiaries: filteredList,
          title: lang === 'ar' ? 'سجل المستفيدين والحالات الاجتماعية الميدانية المعمد' : 'Official Certified Beneficiaries Registry',
          subtitle: lang === 'ar' ? 'بيانات الأسر المستفيدة، مواقع السكن، والتصنيف الميداني' : 'Beneficiary cases, demographics & field classifications'
        }}
      />

      <ExportToolsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        titleAr="تصدير سجل المستفيدين والحالات الاجتماعية الميدانية"
        titleEn="Export Beneficiaries & Social Field Cases Registry"
        data={filteredList.map(b => ({
          'كود المستفيد / Code': b.beneficiary_code,
          'الاسم الكامل / Full Name': b.full_name_ar || b.full_name_en,
          'رقم الهوية / National ID': b.national_id || b.identity_number,
          'الفئة / Category': b.category_code,
          'المحافظة / Governorate': b.governorate,
          'المديرية / District': b.district,
          'رقم الهاتف / Phone': b.phone_primary || b.phone_number,
          'عدد أفراد الأسرة / Family Size': b.family_members_count,
          'الحالة التشغيلية / Status': b.status_code
        }))}
        fileName="NexoraOS_Beneficiaries_Registry"
        lang={lang}
      />

      {/* Cross-Entity Lineage Modal */}
      {showLineageModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLineageModal(false)}
              className="absolute top-5 left-5 p-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer z-20"
            >
              <X className="w-4 h-4" />
            </button>
            <CrossEntityLineageView lang={lang} />
          </div>
        </div>
      )}

    </div>
    </ModuleShell>
  );
}
