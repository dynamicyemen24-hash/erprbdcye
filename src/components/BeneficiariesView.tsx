import React, { useState, useEffect } from 'react';
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
  Download
} from 'lucide-react';
import ExportToolsModal from './ExportToolsModal';
import { printHTML } from '../lib/printUtils';
import { EnterpriseToolStrip } from './EnterpriseToolStrip';
import { enterpriseBus } from '../lib/enterpriseNotificationBus';
import { ModuleShell } from './enterprise/ModuleShell';
import { PolicyViolationError, type PolicyViolation } from '../core/utils/apiHelpers';
import { PolicyViolationAlert } from './helpers/PolicyViolationAlert';

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
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[] | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'demographic' | 'support'>('personal');

  // Fields
  const [fullNameAr, setFullNameAr] = useState('');
  const [beneficiaryCode, setBeneficiaryCode] = useState('');
  const [categoryCode, setCategoryCode] = useState('ORPHAN');
  const [statusCode, setStatusCode] = useState('active');
  const [genderCode, setGenderCode] = useState('MALE');
  const [age, setAge] = useState('');
  const [phonePrimary, setPhonePrimary] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [housingStatus, setHousingStatus] = useState('owned');
  const [familySize, setFamilySize] = useState('1');
  const [educationLevel, setEducationLevel] = useState('');
  const [quranMemorization, setQuranMemorization] = useState('');
  const [financialStatus, setFinancialStatus] = useState('poor');
  const [deathCertificate, setDeathCertificate] = useState(false);
  const [notes, setNotes] = useState('');

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
    let printWindow: any = null;
    try {
      printWindow = window.open('', '_blank');
    } catch (e) { console.error('[Beneficiaries] Failed to open print window:', e); }

    let writtenHTML = '';
    const mockDoc = {
      write: (html: string) => {
        if (printWindow) {
          printWindow.document.write(html);
        } else {
          writtenHTML += html;
        }
      },
      close: () => {
        if (printWindow) {
          printWindow.document.close();
        } else {
          printHTML(writtenHTML);
        }
      }
    };

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const titleText = lang === 'ar' ? 'تقرير دراسة الحالة الميدانية والاستحقاق الاجتماعي' : 'Field Case Study & Welfare Report';

    mockDoc.write(`
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
              <h1 class="font-black text-lg text-slate-900">مؤسسة رحماء الخيرية للتنمية</h1>
              <p class="text-xs font-bold text-slate-500">إدارة الرعاية الاجتماعية والبحث الميداني</p>
              <p class="text-[10px] text-slate-400">صنعاء - الجمهورية اليمنية</p>
            </div>
            <div class="text-center shrink-0">
              <div class="border-2 border-slate-900 px-3 py-1.5 rounded-xl font-black text-sm tracking-widest bg-emerald-50">
                NEXORA CASE
              </div>
              <p class="text-[9px] font-bold text-slate-400 mt-1">وثيقة البحث الاجتماعي الموحدة</p>
            </div>
            <div class="text-left space-y-1">
              <h1 class="font-black text-lg text-slate-900">Rohamaa Charity Foundation</h1>
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
                <p class="font-mono text-slate-900 font-black text-sm mt-0.5 bg-slate-100 px-2 py-0.5 rounded inline-block">${b.beneficiary_code || 'BEN-NEW'}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">${lang === 'ar' ? 'تصنيف الاستحقاق:' : 'Eligibility Category:'}</p>
                <p class="text-amber-800 font-black mt-0.5">${b.category_code || 'OTHER'}</p>
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
    mockDoc.close();
  };

  const openFormModal = (beneficiary: any | null = null, prefilledData?: any) => {
    setSelectedBeneficiary(beneficiary);
    setFormError(null);
    setActiveFormTab('personal');
    if (beneficiary) {
      setFullNameAr(beneficiary.full_name_ar || '');
      setBeneficiaryCode(beneficiary.beneficiary_code || '');
      setCategoryCode(beneficiary.category_code || 'ORPHAN');
      setStatusCode(beneficiary.status_code || 'active');
      setGenderCode(beneficiary.gender_code || 'MALE');
      setAge(beneficiary.age ? String(beneficiary.age) : '');
      setPhonePrimary(beneficiary.phone_primary || '');
      setGovernorate(beneficiary.governorate || '');
      setDistrict(beneficiary.district || '');
      setAddress(beneficiary.address || '');
      setHousingStatus(beneficiary.housing_status || 'owned');
      setFamilySize(beneficiary.family_size ? String(beneficiary.family_size) : '1');
      setEducationLevel(beneficiary.education_level || '');
      setQuranMemorization(beneficiary.quran_memorization || '');
      setFinancialStatus(beneficiary.financial_status || 'poor');
      setDeathCertificate(!!beneficiary.death_certificate);
      setNotes(beneficiary.notes || '');
    } else {
      // Auto-generate code
      const nextNum = beneficiaries.length + 101;
      setBeneficiaryCode(prefilledData?.beneficiaryCode || `BEN-${String(nextNum).padStart(6, '0')}`);
      setFullNameAr(prefilledData?.fullNameAr || '');
      setCategoryCode(prefilledData?.categoryCode || 'ORPHAN');
      setStatusCode('active');
      setGenderCode(prefilledData?.genderCode || 'MALE');
      setAge(prefilledData?.age || '');
      setPhonePrimary(prefilledData?.phonePrimary || '');
      setGovernorate(prefilledData?.governorate || 'صنعاء');
      setDistrict(prefilledData?.district || '');
      setAddress(prefilledData?.address || '');
      setHousingStatus('owned');
      setFamilySize(prefilledData?.familySize || '3');
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

    const payload = {
      full_name_ar: fullNameAr,
      beneficiary_code: beneficiaryCode,
      category_code: categoryCode,
      status_code: statusCode,
      gender_code: genderCode,
      age: age ? parseInt(age) : null,
      phone_primary: phonePrimary,
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
      alert(`Error: ${err.message}`);
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
            onClick={() => setIsExportModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md hover:shadow-emerald-600/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>{lang === 'ar' ? 'تصدير السجل (Excel/PDF)' : 'Export Registry'}</span>
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
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'إجمالي الحالات' : 'Total Cases'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{loading ? '...' : statTotal}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'الأيتام المكفولين' : 'Sponsored Orphans'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{loading ? '...' : statOrphans}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'أسر فقيرة ومعوزة' : 'Poor Families'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{loading ? '...' : statPoor}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
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
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
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
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500/50 rounded-xl py-2 px-4 text-xs focus:outline-none transition-all"
              style={lang === 'ar' ? { paddingRight: '36px', paddingLeft: '16px' } : { paddingLeft: '36px', paddingRight: '16px' }}
            />
          </div>

          <div className="flex items-center gap-2">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
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
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
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
              <tbody className="divide-y divide-zinc-200">
                {filteredList.map((ben) => (
                  <tr key={ben.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {ben.beneficiary_code || 'BEN-NEW'}
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
                        {ben.category_code || 'OTHER'}
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
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {ben.phone_primary ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{ben.phone_primary}</span>
                        </div>
                      ) : '-'}
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

      {/* Profile Detail Pop-up */}
      {viewingBeneficiary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 bg-zinc-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="font-mono bg-amber-600 text-zinc-950 font-black px-2 py-0.5 rounded text-[10px]">
                  {viewingBeneficiary.beneficiary_code}
                </span>
                <h3 className="font-black text-sm">{lang === 'ar' ? 'ملف الاستحقاق والبيانات الميدانية' : 'Beneficiary Case Dossier'}</h3>
              </div>
              <button 
                onClick={() => setViewingBeneficiary(null)}
                className="p-1 hover:bg-zinc-800 rounded-full border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header profile info */}
              <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-center font-black text-amber-700 text-xl">
                  {viewingBeneficiary.full_name_ar?.[0] || 'ب'}
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-slate-900">{viewingBeneficiary.full_name_ar}</h4>
                  <p className="text-[11px] text-zinc-400 font-bold">
                    ID: {viewingBeneficiary.id} • {lang === 'ar' ? 'تصنيف الحالة: ' : 'Category: '} {viewingBeneficiary.category_code}
                  </p>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'الهاتف' : 'Phone'}</p>
                  <p className="font-mono font-extrabold text-slate-800">{viewingBeneficiary.phone_primary || '-'}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'المحافظة / المديرية' : 'Province'}</p>
                  <p className="font-extrabold text-slate-800">{viewingBeneficiary.governorate} / {viewingBeneficiary.district || '-'}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'العنوان التفصيلي' : 'Address Detail'}</p>
                  <p className="font-bold text-slate-800 truncate" title={viewingBeneficiary.address}>{viewingBeneficiary.address || '-'}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'العمر' : 'Age'}</p>
                  <p className="font-mono font-extrabold text-slate-800">{viewingBeneficiary.age ? `${viewingBeneficiary.age} عاماً` : '-'}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'حجم الأسرة' : 'Family Size'}</p>
                  <p className="font-mono font-extrabold text-slate-800">{viewingBeneficiary.family_size || '1'}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'الحالة المادية' : 'Financial State'}</p>
                  <p className="font-extrabold text-slate-800">{viewingBeneficiary.financial_status === 'poor' ? 'فقير' : 'معدم للغاية'}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'حالة السكن' : 'Housing'}</p>
                  <p className="font-extrabold text-slate-800">{viewingBeneficiary.housing_status === 'owned' ? 'ملك' : 'إيجار'}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'المستوى التعليمي' : 'Education'}</p>
                  <p className="font-extrabold text-slate-800">{viewingBeneficiary.education_level || '-'}</p>
                </div>
                <div>
                  <p className="text-zinc-400 font-bold mb-0.5">{lang === 'ar' ? 'حفظ القرآن' : 'Quran'}</p>
                  <p className="font-extrabold text-slate-800">{viewingBeneficiary.quran_memorization || '-'}</p>
                </div>
              </div>

              {viewingBeneficiary.notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 leading-relaxed font-semibold">
                  <h5 className="font-black text-slate-800 mb-1">{lang === 'ar' ? 'ملاحظات المنسق الميداني:' : 'Field Agent Notes:'}</h5>
                  <p>{viewingBeneficiary.notes}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => handlePrintBeneficiary(viewingBeneficiary)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'ar' ? 'طباعة استمارة البحث' : 'Print Form'}</span>
              </button>
              <button
                onClick={() => {
                  setViewingBeneficiary(null);
                  openFormModal(viewingBeneficiary);
                }}
                className="px-4 py-1.5 bg-amber-600 text-white hover:bg-amber-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'تعديل البيانات' : 'Edit Case'}
              </button>
              <button
                onClick={() => setViewingBeneficiary(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full overflow-hidden shadow-2xl animate-scale-up">
            
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

            {/* Tabs selector */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setActiveFormTab('personal')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeFormTab === 'personal' ? 'border-amber-500 text-amber-700 bg-white' : 'border-transparent text-zinc-400 hover:text-slate-600'
                }`}
              >
                {lang === 'ar' ? 'البيانات الشخصية' : 'Personal Info'}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('demographic')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeFormTab === 'demographic' ? 'border-amber-500 text-amber-700 bg-white' : 'border-transparent text-zinc-400 hover:text-slate-600'
                }`}
              >
                {lang === 'ar' ? 'التفاصيل الديموغرافية والمنطقة' : 'Demographics'}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('support')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeFormTab === 'support' ? 'border-amber-500 text-amber-700 bg-white' : 'border-transparent text-zinc-400 hover:text-slate-600'
                }`}
              >
                {lang === 'ar' ? 'الوضع المالي والملاحظات' : 'Financial Details'}
              </button>
            </div>

            {/* Error Banner inside form */}
            {formError && (
              <div className="m-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-bold flex items-center gap-2">
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
              <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
                
                {/* Tab: Personal */}
                {activeFormTab === 'personal' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'كود الحالة (تلقائي)' : 'Case Code'}</label>
                        <input 
                          type="text" 
                          required 
                          readOnly
                          value={beneficiaryCode}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'تصنيف الحالة المستحقة' : 'Category'}</label>
                        <select 
                          value={categoryCode}
                          onChange={(e) => setCategoryCode(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="ORPHAN">{lang === 'ar' ? 'يتيم (Orphan)' : 'Orphan'}</option>
                          <option value="POOR_FAMILY">{lang === 'ar' ? 'أسرة فقيرة (Poor Family)' : 'Poor Family'}</option>
                          <option value="DISABLED">{lang === 'ar' ? 'ذوي الاحتياجات الخاصة (Disabled)' : 'Disabled'}</option>
                          <option value="WIDOW">{lang === 'ar' ? 'أرملة (Widow)' : 'Widow'}</option>
                          <option value="SICK">{lang === 'ar' ? 'مريض مزمن (Chronic Sick)' : 'Chronic Sick'}</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'الاسم الكامل باللغة العربية رباعياً' : 'Full Name (Arabic)'}</label>
                      <input 
                        type="text" 
                        required 
                        value={fullNameAr}
                        onChange={(e) => setFullNameAr(e.target.value)}
                        placeholder="مثال: صالح محمد أحمد الرازحي"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'الجنس' : 'Gender'}</label>
                        <select 
                          value={genderCode}
                          onChange={(e) => setGenderCode(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none"
                        >
                          <option value="MALE">{lang === 'ar' ? 'ذكر' : 'Male'}</option>
                          <option value="FEMALE">{lang === 'ar' ? 'أنثى' : 'Female'}</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'العمر بالسنوات' : 'Age'}</label>
                        <input 
                          type="number" 
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="مثال: 12"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'رقم الهاتف الأساسي للتواصل' : 'Primary Phone'}</label>
                      <div className="relative">
                        <Phone className="absolute top-2.5 left-3 w-4 h-4 text-zinc-400" />
                        <input 
                          type="text" 
                          required
                          value={phonePrimary}
                          onChange={(e) => setPhonePrimary(e.target.value)}
                          placeholder="77XXXXXXX"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 pl-9 text-xs font-mono font-bold focus:outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Demographics */}
                {activeFormTab === 'demographic' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'المحافظة' : 'Governorate'}</label>
                        <input 
                          type="text" 
                          required 
                          value={governorate}
                          onChange={(e) => setGovernorate(e.target.value)}
                          placeholder="مثال: صنعاء، ذمار"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'المديرية / العزلة' : 'District'}</label>
                        <input 
                          type="text" 
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="مثال: السبعين، عتمة"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'العنوان التفصيلي' : 'Detail Address'}</label>
                      <textarea 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="مثال: حارة النصر، بجوار مدرسة خالد بن الوليد"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none h-16 resize-none" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'حالة السكن' : 'Housing Status'}</label>
                        <select 
                          value={housingStatus}
                          onChange={(e) => setHousingStatus(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none"
                        >
                          <option value="owned">{lang === 'ar' ? 'ملك (Owned)' : 'Owned'}</option>
                          <option value="rented">{lang === 'ar' ? 'إيجار (Rented)' : 'Rented'}</option>
                          <option value="displaced">{lang === 'ar' ? 'نازح / خيمة' : 'Displaced / Tent'}</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'عدد أفراد الأسرة' : 'Family Size'}</label>
                        <input 
                          type="number" 
                          value={familySize}
                          onChange={(e) => setFamilySize(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Support */}
                {activeFormTab === 'support' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'المستوى التعليمي الحالي' : 'Education Level'}</label>
                        <input 
                          type="text" 
                          value={educationLevel}
                          onChange={(e) => setEducationLevel(e.target.value)}
                          placeholder="أول متوسط، ابتدائي..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'مستوى حفظ القرآن' : 'Quran Memorization'}</label>
                        <input 
                          type="text" 
                          value={quranMemorization}
                          onChange={(e) => setQuranMemorization(e.target.value)}
                          placeholder="جزء عم، 5 أجزاء..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'الوضع المعيشي والمادي' : 'Financial Status'}</label>
                        <select 
                          value={financialStatus}
                          onChange={(e) => setFinancialStatus(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none"
                        >
                          <option value="poor">{lang === 'ar' ? 'فقير (Poor)' : 'Poor'}</option>
                          <option value="very_poor">{lang === 'ar' ? 'معدم / شديد الفقر' : 'Destitute'}</option>
                          <option value="medium">{lang === 'ar' ? 'مستور / متوسط' : 'Medium'}</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'حالة شهادة وفاة الأب (للأيتام)' : 'Death Certificate'}</label>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer font-bold text-xs text-slate-600">
                          <input 
                            type="checkbox" 
                            checked={deathCertificate}
                            onChange={(e) => setDeathCertificate(e.target.checked)}
                            className="w-4 h-4 text-amber-600 border-zinc-300 rounded focus:ring-amber-500" 
                          />
                          <span>{lang === 'ar' ? 'شهادة الوفاة متوفرة' : 'Available'}</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500">{lang === 'ar' ? 'ملاحظات تفصيلية أو احتياجات خاصة' : 'Dossier Notes'}</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="اكتب أي معلومات إضافية كحالة المرض، الاحتياجات الصحية الفورية..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none h-20 resize-none" 
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

    </div>
    </ModuleShell>
  );
}
