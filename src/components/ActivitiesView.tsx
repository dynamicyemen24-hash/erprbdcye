import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Folder, 
  Tag, 
  User, 
  Info,
  X,
  FileSpreadsheet,
  TrendingUp,
  Map,
  Compass,
  CheckSquare,
  Camera,
  Check,
  Award,
  BookOpen,
  GraduationCap,
  HeartPulse,
  Droplet,
  Heart,
  Boxes,
  Printer,
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  QrCode,
  FileText,
  Building2,
  Zap,
  Sliders,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Project, Program } from '../types';
import { printHTML } from '../lib/printUtils';
import { enterpriseBus } from '../lib/enterpriseNotificationBus';
import { ModuleShell } from './enterprise/ModuleShell';
import { PolicyViolationError, type PolicyViolation } from '../core/utils/apiHelpers';
import { PolicyViolationAlert } from './helpers/PolicyViolationAlert';
import { generateNumericCode } from '../lib/idGenerator';

// ==================== SECTOR & ACTIVITY TYPES TAXONOMY ====================
export interface ActivitySector {
  id: string;
  name_ar: string;
  name_en: string;
  icon: any;
  color: string;
  badgeBg: string;
  subtypes: { code: string; name_ar: string; name_en: string }[];
}

export const ACTIVITY_SECTORS: ActivitySector[] = [
  {
    id: 'EDUCATION_QURAN',
    name_ar: 'القطاع التعليمي والتربوي وحلقات القرآن',
    name_en: 'Education, Literacy & Quranic Circles',
    icon: BookOpen,
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    subtypes: [
      { code: 'QURAN_MEMORIZATION', name_ar: 'حلقة تحفيظ القرآن الكريم والعلوم الشرعية', name_en: 'Quran Memorization & Tajweed Circle' },
      { code: 'LITERACY_EDUCATION', name_ar: 'صف محو الأمية وتعليم الكبار', name_en: 'Adult Literacy & Numeracy Class' },
      { code: 'VOCATIONAL_TRAINING', name_ar: 'دورة تأهيل مهني وحرفي', name_en: 'Vocational & Crafts Workshop' },
      { code: 'STUDENT_SCHOLARSHIP', name_ar: 'مشروع الحقيبة والتمكين الطلابي', name_en: 'Student Bag & Academic Scholarship' }
    ]
  },
  {
    id: 'RELIEF_HUMANITARIAN',
    name_ar: 'القطاع الإغاثي والأمن الغذائي',
    name_en: 'Relief & Food Security',
    icon: Boxes,
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    subtypes: [
      { code: 'RELIEF_FOOD_BASKET', name_ar: 'توزيع السلل الإغاثية والوجبات', name_en: 'Relief Food Basket Distribution' },
      { code: 'RELIEF_EVOUCHER', name_ar: 'توزيع القسائم والكوبونات الرقمية E-Vouchers', name_en: 'Digital Coupon & Cash Voucher' },
      { code: 'EMERGENCY_SHELTER', name_ar: 'إغاثة الإيواء العاجل للنازحين', name_en: 'IDP Emergency Shelter Deployment' }
    ]
  },
  {
    id: 'HEALTH_MEDICAL',
    name_ar: 'القطاع الصحي والرعاية الطبية',
    name_en: 'Health, Medical & Nutrition',
    icon: HeartPulse,
    color: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    subtypes: [
      { code: 'HEALTH_MOBILE_CLINIC', name_ar: 'قافلة وعيادة طبية ميدانية', name_en: 'Mobile Medical Field Clinic' },
      { code: 'HEALTH_NUTRITION', name_ar: 'برنامج التغذية ورعاية الأم والطفل', name_en: 'Maternal & Child Nutrition (MUAC)' },
      { code: 'SURGICAL_CAMPAIGN', name_ar: 'حملة العمليات الجراحية الميدانية', name_en: 'Field Surgical Campaign' }
    ]
  },
  {
    id: 'WASH_INFRASTRUCTURE',
    name_ar: 'قطاع المياه والإنشاءات',
    name_en: 'WASH & Solar Infrastructure',
    icon: Droplet,
    color: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    subtypes: [
      { code: 'WASH_WELL_DRILLING', name_ar: 'حفر بئر وتجهيز منظومة شمسية', name_en: 'Well Drilling & Solar Pump System' },
      { code: 'WASH_INFRASTRUCTURE', name_ar: 'ترميم مدرسة / مسكن / شبكة مياه', name_en: 'Infrastructure Rehabilitation' }
    ]
  },
  {
    id: 'ORPHAN_CARE',
    name_ar: 'قطاع رعاية الأيتام والحماية',
    name_en: 'Orphan Care & Social Protection',
    icon: Heart,
    color: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    subtypes: [
      { code: 'ORPHAN_STIPEND_DELIVERY', name_ar: 'تسليم كفالات الأيتام الميدانية', name_en: 'Orphan Stipend & Cash Delivery' },
      { code: 'PSYCHOSOCIAL_SUPPORT', name_ar: 'الدعم النفسي والأنشطة الترفيهية', name_en: 'Child Psychosocial Support' }
    ]
  },
  {
    id: 'ECONOMIC_EMPOWERMENT',
    name_ar: 'قطاع التمكين الاقتصادي والمشاريع',
    name_en: 'Economic Empowerment & Micro-enterprise',
    icon: TrendingUp,
    color: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
    subtypes: [
      { code: 'MICRO_PROJECT_TRANSFER', name_ar: 'تمليك أصل إنتاجي / مشروع صغير', name_en: 'Micro-enterprise Asset Transfer' }
    ]
  }
];

// Helper: Check fetch response for policy violations
async function checkPolicyViolation(response: Response): Promise<void> {
  if (!response.ok && response.status === 403) {
    const body = await response.json().catch(() => ({}));
    if (body.violations) {
      throw new PolicyViolationError(body);
    }
  }
}

// Default Tasks Generator per Activity Subtype
const getDefaultTasksForSubtype = (code: string) => {
  switch (code) {
    case 'QURAN_MEMORIZATION':
      return [
        { id: 't1', title_ar: 'تثبيت كشف حضور الطلاب وتفقد حلقة التحفيظ', title_en: 'Verify daily student attendance sheet', completed: true },
        { id: 't2', title_ar: 'تسميع السورة والأجزاء المقررة وتقييم التلاوة', title_en: 'Recite scheduled chapters & assess Tajweed', completed: true },
        { id: 't3', title_ar: 'توزيع المصاحف والأجزاء التعليمية المعتمدة', title_en: 'Distribute Quranic copies & learning kits', completed: false },
        { id: 't4', title_ar: 'صرف حافز ومكافأة معلم ومسؤول الحلقة', title_en: 'Disburse monthly teacher incentive stipend', completed: false }
      ];
    case 'LITERACY_EDUCATION':
      return [
        { id: 't1', title_ar: 'حصر وقيد الدارسين والدارسات بصف محو الأمية', title_en: 'Register adult learners in literacy class', completed: true },
        { id: 't2', title_ar: 'توزيع الحقائب المدرسية والقرطاسية وكتب القرائية', title_en: 'Distribute literacy books & stationery bags', completed: false },
        { id: 't3', title_ar: 'إجراء الاختبار الدوري لمهارات القراءة والكتابة', title_en: 'Conduct periodic reading & writing exam', completed: false },
        { id: 't4', title_ar: 'تسليم مكافأة معلم صف محو الأمية ومصاريف التشغيل', title_en: 'Disburse instructor stipend & class expenses', completed: false }
      ];
    case 'VOCATIONAL_TRAINING':
      return [
        { id: 't1', title_ar: 'تأهيل الورشة وتثبيت أجهزة ومكائن الخياطة/الصيانة', title_en: 'Setup workshop machines & technical tools', completed: true },
        { id: 't2', title_ar: 'إنجاز الساعات التدريبية والتطبيقات العملية', title_en: 'Complete practical training module hours', completed: false },
        { id: 't3', title_ar: 'إجراء التقييم الفني واختبار الكفاءة المهنية', title_en: 'Conduct vocational proficiency evaluation', completed: false },
        { id: 't4', title_ar: 'تسليم شهادة إتمام الدورة وحقيبة التمكين المهني', title_en: 'Issue completion certificate & tool kit', completed: false }
      ];
    case 'HEALTH_MOBILE_CLINIC':
      return [
        { id: 't1', title_ar: 'تأهيل وتوفير الأدوية والمستلزمات الطبية للقافلة', title_en: 'Stock mobile clinic pharmacy & supplies', completed: true },
        { id: 't2', title_ar: 'معاينة وفحص المرضى والمستفيدين وتسجيل السجلات', title_en: 'Examine patients & record medical charts', completed: false },
        { id: 't3', title_ar: 'قياس حالات سوء التغذية للأطفال والأمهات (MUAC)', title_en: 'Screen children & mothers for malnutrition', completed: false },
        { id: 't4', title_ar: 'صرف الأدوية المجانية ورفع التقرير الطبي الميداني', title_en: 'Disburse free medicines & submit med report', completed: false }
      ];
    case 'WASH_WELL_DRILLING':
      return [
        { id: 't1', title_ar: 'فحص عمق الحفر ومطابقة المخطط الهندسي للبئر', title_en: 'Inspect well drilling depth & engineering plan', completed: true },
        { id: 't2', title_ar: 'تركيب وتجهيز المضخة والمنظومة الشمسية المتكاملة', title_en: 'Install solar pump & power infrastructure', completed: false },
        { id: 't3', title_ar: 'فحص نقاوة المياه ومعدل الضخ اليومي باللتر', title_en: 'Test water purity & daily flow rate capacity', completed: false },
        { id: 't4', title_ar: 'رفع تقرير الاستلام الهندسي والتشغيل النهائي', title_en: 'Submit final technical handover report', completed: false }
      ];
    case 'ORPHAN_STIPEND_DELIVERY':
      return [
        { id: 't1', title_ar: 'مطابقة هوية اليتيم الذكية وأولياء الأمور', title_en: 'Verify orphan digital ID & legal guardian', completed: true },
        { id: 't2', title_ar: 'تسليم مبالغ الكفالات النقدية الدورية وتوثيق السند', title_en: 'Handover orphan cash stipend & sign voucher', completed: false },
        { id: 't3', title_ar: 'إجراء جلسات التأهيل والأنشطة الترفيهية للأطفال', title_en: 'Conduct psychosocial & recreational activity', completed: false },
        { id: 't4', title_ar: 'رفع كشف التسليم المعتمد مع البصمة والصورة', title_en: 'Upload verified delivery roster & photo proof', completed: false }
      ];
    case 'MICRO_PROJECT_TRANSFER':
      return [
        { id: 't1', title_ar: 'شراء وتأمين الأصول الإنتاجية (مواشي/مكائن/ورشة)', title_en: 'Procure productive assets & equipment', completed: true },
        { id: 't2', title_ar: 'الفحص الفني وتدريب المستفيد على إدارة المشروع', title_en: 'Inspect equipment & train beneficiary', completed: false },
        { id: 't3', title_ar: 'تسليم محضر نقل الملكية للمستفيد وتوثيق العقد', title_en: 'Handover asset ownership contract', completed: false },
        { id: 't4', title_ar: 'التفتيش الميداني الدوري لضمان استدامة الدخل', title_en: 'Conduct follow-up field monitoring visit', completed: false }
      ];
    default:
      return [
        { id: 't1', title_ar: 'مسح المستفيدين ومطابقة الكروت الإغاثية الذكية', title_en: 'Map beneficiaries & verify digital cards', completed: true },
        { id: 't2', title_ar: 'تأمين موقع الفعالية وتنظيم حركة التسليم', title_en: 'Secure field site & manage distribution line', completed: false },
        { id: 't3', title_ar: 'تسليم المواد المستحقة والتوثيق الميداني', title_en: 'Handover materials & verify delivery', completed: false },
        { id: 't4', title_ar: 'رفع صور التوزيع والتوثيق الجغرافي الـ GPS', title_en: 'Upload geotagged photos & GPS coordinates', completed: false }
      ];
  }
};

export interface Activity {
  id: string;
  project_id: string;
  program_id?: string | null;
  name_en: string;
  name_ar: string;
  description: string | null;
  activity_type_code: string;
  sector_id?: string;
  status_code: string | null;
  coordinator_id?: string | null;
  start_datetime: string;
  end_datetime?: string | null;
  location_name?: string | null;
  location_name_ar?: string | null;
  budget?: string | null;
  disbursed_budget?: number;
  currency_code?: string | null;
  target_beneficiaries?: number | null;
  actual_beneficiaries?: number | null;
  metadata?: any;
  created_at: string;
  quality_score?: number | null;
}

export interface ActivitiesViewProps {
  loading?: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
  projects: Project[];
  programs: Program[];
  beneficiaries?: any[];
  onNavigate?: (tab: string) => void;
}

export default function ActivitiesView({
  onRefresh,
  lang,
  projects,
  programs,
  beneficiaries = [],
  onNavigate
}: ActivitiesViewProps) {
  const isRtl = lang === 'ar';
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[] | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  // Financial Disbursement Modal State
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [financialForm, setFinancialForm] = useState({
    activityId: '',
    amount: '50000',
    currency: 'YER',
    payeeName: '',
    paymentType: 'CASH_CUSTODY',
    expenseCategory: 'حوافز معلمين ومدرسين',
    notes: 'صرف مستحقات وحوافز تشغيلية ميدانية للنشاط'
  });
  const [financialSubmitting, setFinancialSubmitting] = useState(false);

  // Material Inventory Requisition Modal State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    activityId: '',
    warehouseId: 'WH-MAIN-SANAA',
    itemId: 'item-1',
    requestedQty: '10',
    notes: 'طلب مواد وسلل إغاثية ومستلزمات عينية للنشاط الميداني'
  });
  const [materialSubmitting, setMaterialSubmitting] = useState(false);

  // Financial & Material Local Dispatches Storage
  const [financialDisbursements, setFinancialDisbursements] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_field_financial_disbursements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [materialRequests, setMaterialRequests] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_field_material_requests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isVerifyingGPS, setIsVerifyingGPS] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [fetchError, setFetchError] = useState<boolean>(false);

  // Form State for creating new activity
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    project_id: '',
    sector_id: 'EDUCATION_QURAN',
    activity_type_code: 'QURAN_MEMORIZATION',
    description: '',
    status_code: 'active',
    location_name_ar: '',
    budget: '150000',
    currency_code: 'YER',
    target_beneficiaries: '20',
    responsible_name: '',
    session_time: 'بعد الظهر',
    governorate: 'تعز'
  });

  const fetchActivities = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/tables/activities');
      if (res.ok) {
        const data = await res.json();
        // Strict real-database policy: never substitute fabricated demo records.
        setActivities(data && Array.isArray(data) ? data : []);
      } else {
        console.error('[Activities] Fetch failed with status:', res.status);
        setActivities([]);
        setFetchError(true);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setActivities([]);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);


  // Task Toggle
  const handleToggleTask = async (activity: Activity, taskId: string) => {
    const currentTasks = activity.metadata?.tasks || getDefaultTasksForSubtype(activity.activity_type_code);
    const updatedTasks = currentTasks.map((t: any) => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    const updatedMetadata = {
      ...(activity.metadata || {}),
      tasks: updatedTasks
    };

    const updatedActivity = { ...activity, metadata: updatedMetadata };
    setSelectedActivity(updatedActivity);
    setActivities(prev => prev.map(a => a.id === activity.id ? updatedActivity : a));

    try {
      await fetch(`/api/tables/activities/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedMetadata })
      });
      onRefresh();
    } catch (err) {
      console.error('Error toggling task status:', err);
    }
  };

  // Add Custom Task
  const handleAddTask = async (activity: Activity) => {
    if (!newTaskTitle.trim()) return;
    const currentTasks = activity.metadata?.tasks || getDefaultTasksForSubtype(activity.activity_type_code);
    const newTaskId = `t-${Date.now()}`;
    const newTask = {
      id: newTaskId,
      title_ar: newTaskTitle,
      title_en: newTaskTitle,
      completed: false
    };
    const updatedTasks = [...currentTasks, newTask];

    const updatedMetadata = {
      ...(activity.metadata || {}),
      tasks: updatedTasks
    };

    const updatedActivity = { ...activity, metadata: updatedMetadata };
    setSelectedActivity(updatedActivity);
    setActivities(prev => prev.map(a => a.id === activity.id ? updatedActivity : a));
    setNewTaskTitle('');

    try {
      await fetch(`/api/tables/activities/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedMetadata })
      });
      onRefresh();
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  // Verify GPS Simulator
  const handleVerifyGPS = async (activity: Activity) => {
    setIsVerifyingGPS(true);
    setTimeout(async () => {
      const coords = `15.35${Math.floor(1000 + Math.random() * 9000)}° N, 44.19${Math.floor(1000 + Math.random() * 9000)}° E`;
      const updatedMetadata = {
        ...(activity.metadata || {}),
        gps_coordinates: coords,
        gps_verified_at: new Date().toISOString()
      };

      const updatedActivity = { ...activity, metadata: updatedMetadata };
      setSelectedActivity(updatedActivity);
      setActivities(prev => prev.map(a => a.id === activity.id ? updatedActivity : a));
      setIsVerifyingGPS(false);

      try {
        await fetch(`/api/tables/activities/${activity.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metadata: updatedMetadata })
        });
        onRefresh();
      } catch (err) {
        console.error('Error verifying GPS:', err);
      }
    }, 600);
  };

  // Upload Photo Proof Simulator
  const handleAddPhotoEvidence = async (activity: Activity) => {
    setIsUploadingPhoto(true);
    setTimeout(async () => {
      const updatedMetadata = {
        ...(activity.metadata || {}),
        photo_evidence: '/LogoRohamaab.png',
        photo_verified_at: new Date().toISOString()
      };

      const updatedActivity = { ...activity, metadata: updatedMetadata };
      setSelectedActivity(updatedActivity);
      setActivities(prev => prev.map(a => a.id === activity.id ? updatedActivity : a));
      setIsUploadingPhoto(false);

      try {
        await fetch(`/api/tables/activities/${activity.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metadata: updatedMetadata })
        });
        onRefresh();
      } catch (err) {
        console.error('Error adding photo evidence:', err);
      }
    }, 600);
  };

  // Open Create Activity Modal
  const handleOpenModal = () => {
    setFormData({
      name_ar: '',
      name_en: '',
      project_id: projects[0]?.id || 'PROJ-001',
      sector_id: 'EDUCATION_QURAN',
      activity_type_code: 'QURAN_MEMORIZATION',
      description: '',
      status_code: 'active',
      location_name_ar: '',
      budget: '150000',
      currency_code: 'YER',
      target_beneficiaries: '20',
      responsible_name: '',
      session_time: 'بعد الظهر',
      governorate: 'تعز'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Submit New Activity
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_ar || !formData.project_id) {
      setErrorMessage(isRtl ? 'يرجى ملء كافة الحقول الأساسية' : 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const newActivity: Activity = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      project_id: formData.project_id,
      name_ar: formData.name_ar,
      name_en: formData.name_en || formData.name_ar,
      description: formData.description,
      sector_id: formData.sector_id,
      activity_type_code: formData.activity_type_code,
      status_code: formData.status_code,
      location_name_ar: formData.location_name_ar,
      location_name: formData.location_name_ar,
      budget: formData.budget,
      disbursed_budget: 0,
      currency_code: formData.currency_code,
      target_beneficiaries: parseInt(formData.target_beneficiaries) || 0,
      actual_beneficiaries: 0,
      start_datetime: new Date().toISOString(),
      created_at: new Date().toISOString(),
      metadata: {
        teacher_name: formData.responsible_name,
        session_time: formData.session_time,
        governorate: formData.governorate,
        tasks: getDefaultTasksForSubtype(formData.activity_type_code)
      }
    };

    setActivities(prev => [newActivity, ...prev]);
    setIsModalOpen(false);
    setIsSubmitting(false);

    try {
      const res = await fetch('/api/tables/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity)
      });
      await checkPolicyViolation(res);
      onRefresh();
    } catch (err: any) {
      if (err instanceof PolicyViolationError) {
        setPolicyViolations(err.violations);
        setErrorMessage(err.primaryMessage);
      } else {
        console.error('Error creating activity:', err);
      }
    }
  };

  // Handle Submit Financial Expense Disbursement Request
  const handleCreateFinancialDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    setFinancialSubmitting(true);

    const act = activities.find(a => a.id === financialForm.activityId);
    const amountNum = parseFloat(financialForm.amount) || 0;

    const newRecord = {
      id: `FIN-DISB-2026-${generateNumericCode(1000, 9999)}`,
      activityId: financialForm.activityId,
      activityName: act?.name_ar || financialForm.activityId,
      projectId: act?.project_id || 'PROJ-001',
      amount: amountNum,
      currency: financialForm.currency,
      payeeName: financialForm.payeeName || act?.metadata?.teacher_name || 'مسؤول النشاط الميداني',
      paymentType: financialForm.paymentType,
      expenseCategory: financialForm.expenseCategory,
      notes: financialForm.notes,
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    };

    const updated = [newRecord, ...financialDisbursements];
    setFinancialDisbursements(updated);
    try {
      localStorage.setItem('nexora_field_financial_disbursements', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    // Update disbursed_budget in state
    if (act) {
      const updatedAct = {
        ...act,
        disbursed_budget: (act.disbursed_budget || 0) + amountNum
      };
      setActivities(prev => prev.map(a => a.id === act.id ? updatedAct : a));
    }

    enterpriseBus.notifyStateSync('NEB-10_FINANCE', 'FIELD_DISBURSEMENT_CREATED', newRecord);
    enterpriseBus.notifyToast({
      type: 'success',
      title: 'تم إصداد سند الصرف المالي 💰',
      message: `تم اعتماد صرف مبلغ ${amountNum.toLocaleString()} ${financialForm.currency} لصالح ${newRecord.payeeName} وتحديث الدفتر اليومي.`
    });

    setFinancialSubmitting(false);
    setIsFinancialModalOpen(false);
  };

  // Handle Submit Material Inventory Requisition
  const handleCreateMaterialRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setMaterialSubmitting(true);

    const act = activities.find(a => a.id === materialForm.activityId);
    const qtyNum = parseInt(materialForm.requestedQty) || 0;

    const newReq = {
      id: `MAT-REQ-2026-${generateNumericCode(1000, 9999)}`,
      activityId: materialForm.activityId,
      activityName: act?.name_ar || materialForm.activityId,
      projectId: act?.project_id || 'PROJ-001',
      warehouseId: materialForm.warehouseId,
      itemId: materialForm.itemId,
      requestedQty: qtyNum,
      notes: materialForm.notes,
      status: 'DISPATCHED',
      createdAt: new Date().toISOString()
    };

    const updated = [newReq, ...materialRequests];
    setMaterialRequests(updated);
    try {
      localStorage.setItem('nexora_field_material_requests', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    enterpriseBus.notifyStateSync('NEB-09_INVENTORY', 'MATERIAL_REQUISITION_CREATED', newReq);
    enterpriseBus.notifyToast({
      type: 'success',
      title: 'تم رفع طلب الصرف المخزني 📦',
      message: `تم رفع طلب صرف عدد ${qtyNum} وحدة عيناً من ${newReq.warehouseId} لصالح النشاط الميداني.`
    });

    setMaterialSubmitting(false);
    setIsMaterialModalOpen(false);
  };

  // Print Official Activity Field Execution Manifest
  const handlePrintActivityManifest = (act: Activity) => {
    const proj = projects.find(p => p.id === act.project_id);
    const currentTasks = act.metadata?.tasks || getDefaultTasksForSubtype(act.activity_type_code);
    const actFinancials = financialDisbursements.filter(f => f.activityId === act.id);
    const actMaterials = materialRequests.filter(m => m.activityId === act.id);

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف ومستند التنفيذ الميداني المعتمد - ${act.name_ar}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; background: #fff; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; align-items: center; border-b: 3px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { height: 60px; }
          .title-box { text-align: center; }
          .title-box h2 { margin: 0; color: #059669; font-size: 18px; font-weight: 900; }
          .title-box p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
          .info-item span { font-weight: bold; color: #475569; display: block; font-size: 10px; uppercase; }
          .info-item strong { color: #0f172a; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          th { background: #059669; color: #fff; padding: 8px; text-align: right; font-weight: 800; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
          .stamp-box { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 15px; border-top: 2px dashed #cbd5e1; text-align: center; font-size: 11px; font-weight: bold; }
          .stamp-circle { border: 2px dashed #d97706; padding: 10px; border-radius: 50%; width: 90px; height: 90px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #d97706; font-size: 9px; font-weight: 900; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/LogoRohamaab.png" class="logo" alt="Rohamaab Logo" />
          <div class="title-box">
            <h2>جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
            <p>NexoraOS™ Field Operations Management - كشف اعتماد ومتابعة النشاط الميداني</p>
          </div>
          <div style="text-align: left; font-size: 10px; font-family: monospace;">
            <div><strong>رقم النشاط:</strong> ${act.id}</div>
            <div><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item"><span>اسم النشاط / الفعالية</span><strong>${act.name_ar}</strong></div>
          <div class="info-item"><span>المشروع الميداني</span><strong>${proj?.name_ar || 'المشروع العام'}</strong></div>
          <div class="info-item"><span>التصنيف الميداني</span><strong>${act.activity_type_code}</strong></div>
          <div class="info-item"><span>المشرف / المدرس المسؤول</span><strong>${act.metadata?.teacher_name || 'غير محدد'}</strong></div>
          <div class="info-item"><span>المحافظة والموقع</span><strong>${act.location_name_ar || 'تعز'}</strong></div>
          <div class="info-item"><span>المستهدفون المباشرون</span><strong>${act.target_beneficiaries || 20} شخص/طالب</strong></div>
          <div class="info-item"><span>الموازنة التقديرية</span><strong>${parseFloat(act.budget || '0').toLocaleString()} YER</strong></div>
          <div class="info-item"><span>إجمالي المنصرف الفعلي</span><strong>${(act.disbursed_budget || 0).toLocaleString()} YER</strong></div>
          <div class="info-item"><span>حالة التوثيق الجغرافي</span><strong>${act.metadata?.gps_coordinates || 'موثق بموقع GPS'}</strong></div>
        </div>

        <h4 style="color: #059669; margin-bottom: 8px;">1. أجندة وتفاصيل المهام الميدانية المعتمدة</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>بيان المهمة الميدانية</th>
              <th style="width: 120px; text-align: center;">حالة الإنجاز</th>
            </tr>
          </thead>
          <tbody>
            ${currentTasks.map((t: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${t.title_ar}</td>
                <td style="text-align: center;">${t.completed ? '✅ مكتمل وموثق' : '⏳ قيد التنفيذ'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${actFinancials.length > 0 ? `
          <h4 style="color: #059669; margin-bottom: 8px;">2. سجل الصرفيات والحوافز المالية المعتمدة</h4>
          <table>
            <thead>
              <tr>
                <th>رقم السند</th>
                <th>جهة الصرف / المستفيد</th>
                <th>المبلغ المصروف</th>
                <th>طريقة الصرف</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${actFinancials.map(f => `
                <tr>
                  <td>${f.id}</td>
                  <td>${f.payeeName}</td>
                  <td><strong>${f.amount.toLocaleString()} ${f.currency}</strong></td>
                  <td>${f.paymentType}</td>
                  <td>${new Date(f.createdAt).toLocaleDateString('ar-EG')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="stamp-box">
          <div>
            <p>إعداد الأخصائي الميداني</p>
            <p style="margin-top: 25px;">___________________</p>
          </div>
          <div>
            <div class="stamp-circle">
              اعتماد إداري<br>رُحماء بينهم<br>VERIFIED
            </div>
          </div>
          <div>
            <p>اعتماد مدير العمليات واللوجستيات</p>
            <p style="margin-top: 25px;">___________________</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printHTML(printContent);
  };

  // Filter Activities
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchesSearch = 
        act.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.location_name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.metadata?.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesSector = selectedSector === 'all' || act.sector_id === selectedSector;
      const matchesProject = selectedProject === 'all' || act.project_id === selectedProject;
      const matchesStatus = selectedStatus === 'all' || act.status_code === selectedStatus;
      const matchesType = selectedType === 'all' || act.activity_type_code === selectedType;

      return matchesSearch && matchesSector && matchesProject && matchesStatus && matchesType;
    });
  }, [activities, searchTerm, selectedSector, selectedProject, selectedStatus, selectedType]);

  // Aggregated KPIs
  const activeCount = activities.filter(a => a.status_code === 'active').length;
  const closedCount = activities.filter(a => a.status_code === 'closed').length;
  const totalBudget = activities.reduce((sum, a) => sum + parseFloat(a.budget || '0'), 0);
  const totalDisbursedBudget = activities.reduce((sum, a) => sum + (a.disbursed_budget || 0), 0);
  const totalBeneficiariesCount = activities.reduce((sum, a) => sum + (a.target_beneficiaries || a.metadata?.student_count || 0), 0);

  return (
    <ModuleShell
      titleAr="الأنشطة والمهام الميدانية"
      titleEn="Field Activities & Tasks"
      descAr="تنظيم ومتابعة المهام الميدانية، بطاقات العمل اليومية"
      descEn="Detailed task planning, field checklists, and progress tracking"
      domainCode="NEB-05"
      icon={Compass}
      accent="cyan"
      lang={lang}
      onRefresh={onRefresh}
      isLoading={loading}
      breadcrumbs={[
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', onClick: () => {} },
        { label: lang === 'ar' ? 'الأنشطة' : 'Activities' }
      ]}
    >
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-zinc-950 p-6 rounded-3xl text-white border border-emerald-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <img src="/LogoRohamaab.png" alt="Rohamaab Logo" className="h-12 w-auto object-contain bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">
                {isRtl ? 'محرك إدارة وتخطيط الأنشطة الميدانية الشامل' : 'Ultimate Field Operations & Activity OS'}
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                {isRtl ? 'العمليات الميدانية' : 'Field Operations'}
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-1 font-medium">
              {isRtl 
                ? `استيعاب وتخطيط كافة الأنشطة الميدانية (حلقات القرآن، صفوف محو الأمية، السلل الإغاثية، القوافل الطبية، حفر الآبار، كفالات الأيتام، والتمكين الاقتصادي) مع التوصيل الفوري بالصرف المالي والمخزني` 
                : `Comprehensive operational dispatch engine connecting all field interventions with financial & inventory ledgers`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFinancialModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-amber-300" />
            <span>{isRtl ? 'طلب/سند صرف مالي للنشاط' : 'Financial Disbursement'}</span>
          </button>

          <button
            onClick={() => setIsMaterialModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Boxes className="w-4 h-4 text-amber-200" />
            <span>{isRtl ? 'طلب صرف مواد وسلل عيناً' : 'Material Requisition'}</span>
          </button>

          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'تدشين نشاط جديد' : 'Deploy Activity'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{isRtl ? 'إجمالي الأنشطة الميدانية' : 'Total Field Activities'}</p>
            <p className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">{activities.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 border border-sky-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{isRtl ? 'الطلاب والمستفيدون' : 'Target Beneficiaries'}</p>
            <p className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">{totalBeneficiariesCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 border border-purple-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{isRtl ? 'الموازنة التقديرية للأنشطة' : 'Total Budget (YER)'}</p>
            <p className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {totalBudget.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{isRtl ? 'الصرف المالي الفعلي' : 'Disbursed Budget'}</p>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {totalDisbursedBudget.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs col-span-2 lg:col-span-1">
          <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 border border-teal-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{isRtl ? 'نسبة الصرف اللوجستي' : 'Disbursement Ratio'}</p>
            <p className="text-base font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {totalBudget > 0 ? Math.round((totalDisbursedBudget / totalBudget) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Sector Category Filters Grid */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xs">
        <h4 className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <span>{isRtl ? 'استعراض الأنشطة حسب القطاعات التنموية والإنسانية:' : 'Filter Activities by Domain Sector:'}</span>
        </h4>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedSector === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
            }`}
          >
            {isRtl ? '🌐 جميع القطاعات الميدانية' : 'All Sectors'}
          </button>

          {ACTIVITY_SECTORS.map((sec) => {
            const IconComp = sec.icon;
            const isActive = selectedSector === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSector(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                  isActive 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-105' 
                    : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : sec.color}`} />
                <span>{isRtl ? sec.name_ar : sec.name_en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar Search & Dropdowns */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" 
                  style={!isRtl ? { right: 'auto', left: '14px' } : {}} />
          <input
            type="text"
            placeholder={isRtl ? 'بحث باسم الحلقة، المعلم، المسجد، أو المحافظة...' : 'Search by circle name, teacher, mosque, region...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
            style={!isRtl ? { paddingRight: '16px', paddingLeft: '40px' } : {}}
          />
        </div>

        {/* Project filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isRtl ? 'كل المشاريع الميدانية' : 'All Field Projects'}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {isRtl ? p.name_ar : (p.name_en || p.name_ar)}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isRtl ? 'كل الحالات التشغيلية' : 'All Statuses'}</option>
            <option value="active">{isRtl ? 'نشط / مستمر ميدانياً' : 'Active'}</option>
            <option value="closed">{isRtl ? 'منتهي / مغلق' : 'Completed'}</option>
          </select>
        </div>
      </div>

      {/* Grid of operational activities */}
      {fetchError && !loading && (
        <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{isRtl ? 'تعذر الاتصال بقاعدة البيانات — لم يتم جلب الأنشطة الميدانية.' : 'Database connection failed — field activities could not be loaded.'}</span>
          </div>
          <button
            onClick={fetchActivities}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isRtl ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        </div>
      )}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Clock className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs font-bold text-slate-500">{isRtl ? 'جاري جلب الأنشطة الميدانية وحلقة التحفيظ...' : 'Loading operational sessions...'}</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h4 className="text-xs font-black text-slate-800 dark:text-white">{isRtl ? 'لا توجد أنشطة ميدانية مطابقة للبحث' : 'No field activities match filter'}</h4>
          <p className="text-[10px] text-slate-400 font-bold mt-1">{isRtl ? 'يرجى مراجعة محددات البحث أو تدشين نشاط ميداني جديد' : 'Adjust filters or deploy a new field activity'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredActivities.map((act) => {
            const proj = projects.find(p => p.id === act.project_id);
            const sec = ACTIVITY_SECTORS.find(s => s.id === act.sector_id) || ACTIVITY_SECTORS[0];
            const teacher = act.metadata?.teacher_name || 'غير محدد';
            const sessionTime = act.metadata?.session_time || 'بعد الظهر';
            const gov = act.metadata?.governorate || act.location_name_ar || 'تعز';
            const students = act.target_beneficiaries || act.metadata?.student_count || 20;
            const disbursed = act.disbursed_budget || 0;
            const totalB = parseFloat(act.budget || '0');
            const percentDisb = totalB > 0 ? Math.round((disbursed / totalB) * 100) : 0;

            const IconComp = sec.icon;

            return (
              <div 
                key={act.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500/50 hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Header Card Details */}
                <div className="p-5 space-y-3.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-wider flex items-center gap-1.5 ${sec.badgeBg}`}>
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{act.activity_type_code}</span>
                    </span>

                    <button
                      onClick={async () => {
                        const newStatus = act.status_code === 'closed' ? 'active' : 'closed';
                        const updated = { ...act, status_code: newStatus };
                        setActivities(prev => prev.map(a => a.id === act.id ? updated : a));
                        try {
                          const res = await fetch(`/api/tables/activities/${act.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status_code: newStatus })
                          });
                          await checkPolicyViolation(res);
                        } catch (e: any) {
                          if (e instanceof PolicyViolationError) {
                            setPolicyViolations(e.violations);
                            setErrorMessage(e.primaryMessage);
                          } else {
                            console.error(e);
                          }
                        }
                      }}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black border transition-all cursor-pointer ${
                        act.status_code === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                          : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      {act.status_code === 'active' ? (isRtl ? 'نشط ميدانياً' : 'Active') : (isRtl ? 'مغلق' : 'Closed')}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 transition">
                      {isRtl ? act.name_ar : (act.name_en || act.name_ar)}
                    </h3>
                    {proj && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1">
                        <Folder className="w-3.5 h-3.5 shrink-0" />
                        <span>{isRtl ? proj.name_ar : (proj.name_en || proj.name_ar)}</span>
                      </p>
                    )}
                  </div>

                  {/* Operational Details Grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 dark:border-zinc-800/80 pt-3 text-[10px] text-slate-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5 font-bold">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={teacher}>
                        {isRtl ? `المشرف: ${teacher}` : `Teacher: ${teacher}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {isRtl ? `الفترة: ${sessionTime}` : `Time: ${sessionTime}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {isRtl ? `الموقع: ${gov}` : `Loc: ${gov}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {isRtl ? `المستهدف: ${students} شخص` : `Target: ${students}`}
                      </span>
                    </div>
                  </div>

                  {/* Financial & Material Progress Bar */}
                  <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800 space-y-1">
                    <div className="flex justify-between items-center text-[9.5px] font-black">
                      <span className="text-slate-500 dark:text-zinc-400">{isRtl ? 'نسبة الصرف المالي الميداني:' : 'Financial Disbursed:'}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">{percentDisb}% ({disbursed.toLocaleString()} / {totalB.toLocaleString()} YER)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, percentDisb)}%` }}
                      />
                    </div>
                  </div>

                  {/* Operational Control Action CTA */}
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-zinc-800/80 pt-3">
                    <button
                      onClick={() => {
                        setFinancialForm(prev => ({
                          ...prev,
                          activityId: act.id,
                          payeeName: teacher
                        }));
                        setIsFinancialModalOpen(true);
                      }}
                      className="py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] rounded-xl transition flex items-center justify-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'صرف مالي' : 'Financial'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedActivity(act)}
                      className="py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] rounded-xl transition flex items-center justify-center gap-1 cursor-pointer border border-amber-200 dark:border-amber-800"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'غرفة العمليات' : 'Operations'}</span>
                    </button>
                  </div>
                </div>

                {/* Footer details */}
                <div className="bg-slate-50 dark:bg-zinc-950 px-5 py-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-bold">
                  <div className="flex items-center gap-1 text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{new Date(act.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
                  </div>

                  <button
                    onClick={() => handlePrintActivityManifest(act)}
                    className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'طباعة الكشف' : 'Print Manifest'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== DRAWER: FIELD OPERATIONS CONTROL ROOM ==================== */}
      {selectedActivity && (() => {
        const currentTasks = selectedActivity.metadata?.tasks || getDefaultTasksForSubtype(selectedActivity.activity_type_code);
        const completedCount = currentTasks.filter((t: any) => t.completed).length;
        const totalCount = currentTasks.length;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        const isGpsVerified = !!selectedActivity.metadata?.gps_coordinates;
        const isPhotoEvidencePresent = !!selectedActivity.metadata?.photo_evidence;

        const actFinancials = financialDisbursements.filter(f => f.activityId === selectedActivity.id);
        const actMaterials = materialRequests.filter(m => m.activityId === selectedActivity.id);

        return (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="absolute inset-0" onClick={() => setSelectedActivity(null)} />
            
            <div className="relative w-full max-w-xl bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right overflow-hidden border-l border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-800 dark:text-zinc-200">
              
              {/* Drawer Header */}
              <div className="p-5 bg-gradient-to-r from-emerald-950 via-teal-900 to-zinc-950 text-white flex items-center justify-between border-b border-emerald-800/50 shrink-0">
                <div className="flex items-center gap-3">
                  <img src="/LogoRohamaab.png" alt="Rohamaab Logo" className="h-9 w-auto object-contain bg-white/10 p-1 rounded-xl" />
                  <div>
                    <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                      NexoraOS™ Field Operations Control
                    </span>
                    <h3 className="font-black text-sm text-white max-w-[280px] truncate" title={isRtl ? selectedActivity.name_ar : selectedActivity.name_en}>
                      {isRtl ? selectedActivity.name_ar : selectedActivity.name_en}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Progress & Quick Stats Card */}
                <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 uppercase font-black">{isRtl ? 'معدل إنجاز المهمات والتدقيق الميداني:' : 'Field Tasks Progress:'}</span>
                    <span className="font-mono text-emerald-600 font-extrabold">{progressPercent}% ({completedCount}/{totalCount})</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[10px]">
                    <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <span className="text-slate-400 block font-bold">الموازنة الكلية</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">{parseFloat(selectedActivity.budget || '0').toLocaleString()} YER</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <span className="text-slate-400 block font-bold">المصروف الفعلي</span>
                      <span className="font-mono font-black text-emerald-600">{(selectedActivity.disbursed_budget || 0).toLocaleString()} YER</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-slate-200 dark:border-zinc-800 col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block font-bold">المستهدفون</span>
                      <span className="font-mono font-black text-amber-600">{selectedActivity.target_beneficiaries || 20} شخص/طالب</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Dispatch Buttons inside Operations Room */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setFinancialForm(prev => ({
                        ...prev,
                        activityId: selectedActivity.id,
                        payeeName: selectedActivity.metadata?.teacher_name || 'مسؤول النشاط'
                      }));
                      setIsFinancialModalOpen(true);
                    }}
                    className="py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 text-amber-300" />
                    <span>{isRtl ? 'إصدار سند صرف مالي' : 'Issue Financial Voucher'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setMaterialForm(prev => ({
                        ...prev,
                        activityId: selectedActivity.id
                      }));
                      setIsMaterialModalOpen(true);
                    }}
                    className="py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Boxes className="w-4 h-4 text-amber-200" />
                    <span>{isRtl ? 'طلب صرف مواد عيناً' : 'Material Requisition'}</span>
                  </button>
                </div>

                {/* Financial Dispatches History Track */}
                {actFinancials.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center justify-between">
                      <span>💰 {isRtl ? 'سجل الصرفيات المالية المعتمدة للنشاط:' : 'Financial Dispatches History:'}</span>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('finance')}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer text-[10px]"
                        >
                          <span>عرض شاشة المال</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </h4>

                    <div className="space-y-2">
                      {actFinancials.map((f, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-extrabold block text-slate-900 dark:text-white">{f.payeeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{f.id} | {f.paymentType}</span>
                          </div>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {f.amount.toLocaleString()} {f.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist Section */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                    {isRtl ? 'أجندة المهمات والخطوات الميدانية المعتمدة:' : 'Operational Task Checklist:'}
                  </h4>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={isRtl ? 'إضافة مهمة ميدانية جديدة...' : 'Add a new field task...'}
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTask(selectedActivity);
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTask(selectedActivity)}
                      className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition cursor-pointer text-xs font-extrabold"
                    >
                      {isRtl ? 'إضافة' : 'Add'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {currentTasks.map((t: any) => (
                      <div 
                        key={t.id}
                        onClick={() => handleToggleTask(selectedActivity, t.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                          t.completed 
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            t.completed 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950'
                          }`}>
                            {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={t.completed ? 'line-through text-slate-400 dark:text-zinc-500' : ''}>
                            {isRtl ? t.title_ar : t.title_en}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Geotag & GPS Hub */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-900">
                  <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                    {isRtl ? 'التوثيق الجغرافي والمطابقة المكانية (GPS & Geofencing)' : 'GPS & Geolocation Hub'}
                  </h4>
                  
                  <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block font-normal">
                        {isRtl ? 'إحداثيات الموقع الحالي للنشاط:' : 'Current Activity Coordinates:'}
                      </span>
                      <span className="font-mono text-slate-900 dark:text-white font-extrabold flex items-center gap-1.5 text-xs">
                        <MapPin className={`w-4 h-4 ${isGpsVerified ? 'text-emerald-500' : 'text-slate-400'}`} />
                        {isGpsVerified 
                          ? selectedActivity.metadata.gps_coordinates
                          : (isRtl ? 'لم يتم التوثيق الجغرافي' : 'No Geotag Verified')}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleVerifyGPS(selectedActivity)}
                      disabled={isVerifyingGPS}
                      className={`px-3 py-2 rounded-xl text-[10px] font-extrabold transition cursor-pointer ${
                        isGpsVerified
                          ? 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      }`}
                    >
                      {isVerifyingGPS 
                        ? (isRtl ? 'جاري القراءة...' : 'Verifying...') 
                        : isGpsVerified 
                        ? (isRtl ? 'إعادة التوثيق' : 'Re-verify')
                        : (isRtl ? 'توثيق الـ GPS' : 'Verify Location')}
                    </button>
                  </div>
                </div>

                {/* Media Evidence Hub */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-900">
                  <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                    {isRtl ? 'صور البراهين والتنفيذ الميداني:' : 'Visual Execution Evidence:'}
                  </h4>

                  {isPhotoEvidencePresent ? (
                    <div className="space-y-2">
                      <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden relative group bg-black/10">
                        <img 
                          src={selectedActivity.metadata.photo_evidence} 
                          alt="Photo Evidence" 
                          className="w-full h-36 object-contain bg-slate-950/80 p-2" 
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => handleAddPhotoEvidence(selectedActivity)}
                            disabled={isUploadingPhoto}
                            className="px-3 py-1.5 bg-white text-slate-900 font-extrabold text-[10px] rounded-lg cursor-pointer hover:bg-slate-100"
                          >
                            {isRtl ? 'تحديث صورة التوثيق' : 'Update Photo'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800 text-center space-y-3">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
                      <button
                        type="button"
                        onClick={() => handleAddPhotoEvidence(selectedActivity)}
                        disabled={isUploadingPhoto}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition cursor-pointer text-[10px] font-extrabold shadow-md"
                      >
                        {isUploadingPhoto ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : (isRtl ? 'رفع صور التوثيق الميداني' : 'Upload Photo Evidence')}
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                <button
                  onClick={() => handlePrintActivityManifest(selectedActivity)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>{isRtl ? 'طباعة كشف ومستند التنفيذ الرسمي' : 'Print Official Field Manifest'}</span>
                </button>

                <button
                  onClick={() => setSelectedActivity(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {isRtl ? 'إغلاق النافذة' : 'Close'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ==================== MODAL: CREATE / DEPLOY FIELD ACTIVITY ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <Compass className="w-6 h-6 text-emerald-600 animate-spin-slow" />
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {isRtl ? 'تدشين نشاط ميداني / حلقة تحفيظ جديدة' : 'Deploy Operational Field Session'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {isRtl ? 'إنشاء وتأطير النشاط الميداني ومطابقة كشوفات الحضور' : 'Instantiate a compliant active session connected to central DB'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                {errorMessage}
              </div>
            )}

            {policyViolations && policyViolations.length > 0 && (
              <PolicyViolationAlert
                violations={policyViolations}
                lang={lang}
                onDismiss={() => setPolicyViolations(null)}
              />
            )}

            <form onSubmit={handleCreateActivity} className="space-y-4 text-xs font-bold text-slate-700 dark:text-zinc-300">
              
              {/* Sector Selection */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'القطاع المجالي والمؤسسي للنشاط*' : 'Domain Sector*'}</label>
                <select
                  required
                  value={formData.sector_id}
                  onChange={(e) => {
                    const secId = e.target.value;
                    const sec = ACTIVITY_SECTORS.find(s => s.id === secId);
                    setFormData(p => ({
                      ...p,
                      sector_id: secId,
                      activity_type_code: sec?.subtypes[0]?.code || 'QURAN_MEMORIZATION'
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {ACTIVITY_SECTORS.map(s => (
                    <option key={s.id} value={s.id}>
                      {isRtl ? s.name_ar : s.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtype Selection */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'نوع وتصنيف النشاط التخصصي*' : 'Activity Subtype*'}</label>
                <select
                  required
                  value={formData.activity_type_code}
                  onChange={(e) => setFormData(p => ({ ...p, activity_type_code: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-emerald-500"
                >
                  {(ACTIVITY_SECTORS.find(s => s.id === formData.sector_id)?.subtypes || []).map(st => (
                    <option key={st.code} value={st.code}>
                      {st.code} - {isRtl ? st.name_ar : st.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'اسم الحلقة / الفعالية (عربي)*' : 'Activity Name (Arabic)*'}</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حلقة عثمان بن عفان لتحفيظ القرآن"
                    value={formData.name_ar}
                    onChange={(e) => setFormData(p => ({ ...p, name_ar: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'الاسم بالإنجليزية (اختياري)' : 'Activity Name (English)'}</label>
                  <input
                    type="text"
                    placeholder="Othman Quran Circle"
                    value={formData.name_en}
                    onChange={(e) => setFormData(p => ({ ...p, name_en: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Project & Instructor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'المشروع الميداني المرتبط*' : 'Linked Field Project*'}</label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => setFormData(p => ({ ...p, project_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {isRtl ? p.name_ar : (p.name_en || p.name_ar)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'اسم المدرس / المسؤول الميداني' : 'Teacher/Coordinator'}</label>
                  <input
                    type="text"
                    placeholder="الشيخ / يحيى العولقي"
                    value={formData.responsible_name}
                    onChange={(e) => setFormData(p => ({ ...p, responsible_name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Beneficiaries & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'المستهدفون المباشرون' : 'Target Beneficiaries'}</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.target_beneficiaries}
                    onChange={(e) => setFormData(p => ({ ...p, target_beneficiaries: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'الموازنة التقديرية (YER)' : 'Budget (YER)'}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => setFormData(p => ({ ...p, budget: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'المحافظة / الموقع' : 'Governorate'}</label>
                  <input
                    type="text"
                    placeholder="تعز، صنعاء، إلخ."
                    value={formData.governorate}
                    onChange={(e) => setFormData(p => ({ ...p, governorate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'موقع الفعالية المادي / المسجد / المركز' : 'Venue/Mosque'}</label>
                <input
                  type="text"
                  placeholder="جامع عمر بن الخطاب - حي الروضة"
                  value={formData.location_name_ar}
                  onChange={(e) => setFormData(p => ({ ...p, location_name_ar: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'وصف النشاط وأهداف التنفيذ' : 'Description & Objectives'}</label>
                <textarea
                  rows={2}
                  placeholder="أدخل تفاصيل الأهداف الميدانية والنتائج المتوقعة..."
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 dark:text-zinc-300 rounded-xl text-xs cursor-pointer font-bold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer text-xs flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? (isRtl ? 'جاري التدشين...' : 'Deploying...') : (isRtl ? 'تدشين وحفظ النشاط الميداني' : 'Deploy Field Activity')}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: FINANCIAL DISBURSEMENT DISPATCHER ==================== */}
      {isFinancialModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-emerald-500" />
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {isRtl ? 'إصدار طلب / سند صرف مالي للنشاط' : 'Issue Financial Disbursement Voucher'}
                  </h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {isRtl ? 'ربط السند الفوري بالحسابات العامة وشجرة الحسابات IPSAS' : 'Direct linkage to general ledger & IPSAS Accounts'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsFinancialModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFinancialDisbursement} className="space-y-4 text-xs font-bold text-slate-700 dark:text-zinc-300">
              
              {/* Select Activity */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'النشاط الميداني المستهدف للصرف*' : 'Target Activity*'}</label>
                <select
                  required
                  value={financialForm.activityId}
                  onChange={(e) => {
                    const actId = e.target.value;
                    const act = activities.find(a => a.id === actId);
                    setFinancialForm(prev => ({
                      ...prev,
                      activityId: actId,
                      payeeName: act?.metadata?.teacher_name || prev.payeeName
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>{isRtl ? 'اختر النشاط الميداني...' : 'Select Activity...'}</option>
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name_ar} (الموازنة: {parseFloat(a.budget || '0').toLocaleString()} YER)
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'المبلغ المطلوب للصرف*' : 'Disbursement Amount*'}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={financialForm.amount}
                    onChange={(e) => setFinancialForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'العملة' : 'Currency'}</label>
                  <select
                    value={financialForm.currency}
                    onChange={(e) => setFinancialForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="YER">ريال يمني (YER)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>
              </div>

              {/* Payee Name & Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'اسم المستلم / جهة الصرف*' : 'Payee Name*'}</label>
                  <input
                    type="text"
                    required
                    placeholder="الشيخ / يحيى العولقي"
                    value={financialForm.payeeName}
                    onChange={(e) => setFinancialForm(prev => ({ ...prev, payeeName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'طريقة وسند الدفع' : 'Payment Method'}</label>
                  <select
                    value={financialForm.paymentType}
                    onChange={(e) => setFinancialForm(prev => ({ ...prev, paymentType: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CASH_CUSTODY">صرف عُهدة نقدية ميدانية (Cash Custody)</option>
                    <option value="BANK_TRANSFER">تحويل بنكي / صرافة (Bank Transfer)</option>
                    <option value="E_WALLET">محفظة إلكترونية (E-Money Wallet)</option>
                  </select>
                </div>
              </div>

              {/* Expense Category & Notes */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'بند المصروفات وملاحظات الصرف' : 'Expense Category & Notes'}</label>
                <textarea
                  rows={2}
                  value={financialForm.notes}
                  onChange={(e) => setFinancialForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFinancialModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 dark:text-zinc-300 rounded-xl text-xs cursor-pointer font-bold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={financialSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{financialSubmitting ? (isRtl ? 'جاري الصرف...' : 'Processing...') : (isRtl ? 'تأكيد واعتماد الصرف المالي' : 'Confirm Financial Disbursement')}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: MATERIAL INVENTORY REQUISITION DISPATCHER ==================== */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <Boxes className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {isRtl ? 'طلب صرف مواد وسلل إغاثية عيناً' : 'Material Inventory Requisition'}
                  </h3>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    {isRtl ? 'فحص المخزون الفوري والتمرير لمحرك الصرف المخزني المتعدد' : 'Real-time stock check & Multi-Disbursement integration'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsMaterialModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterialRequest} className="space-y-4 text-xs font-bold text-slate-700 dark:text-zinc-300">
              
              {/* Select Activity */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'النشاط الميداني المستهدف' : 'Target Activity*'}</label>
                <select
                  required
                  value={materialForm.activityId}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, activityId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>{isRtl ? 'اختر النشاط الميداني...' : 'Select Activity...'}</option>
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse & Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'المستودع المصدر' : 'Source Warehouse'}</label>
                  <select
                    value={materialForm.warehouseId}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="WH-MAIN-SANAA">المستودع الرئيسي - الأمانة</option>
                    <option value="WH-TAIZ-01">مستودع فرع تعز والروضة</option>
                    <option value="WH-SHABWAH-01">مستودع فرع شبوة وعتق</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'الكمية المطلوبة' : 'Requested Qty'}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={materialForm.requestedQty}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, requestedQty: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Requisition Notes */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-black">{isRtl ? 'ملاحظات الصرف والاحتياج الميداني' : 'Requisition Notes'}</label>
                <textarea
                  rows={2}
                  value={materialForm.notes}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Multi-Disbursement Launch Prompt */}
              {onNavigate && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-amber-900 dark:text-amber-300 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{isRtl ? 'هل تريد التمرير المباشر لمحرك الصرف المخزني المتعدد للمستفيدين؟' : 'Launch Multi-Beneficiary Multi-SKU Disbursement Wizard?'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMaterialModalOpen(false);
                      onNavigate('inventory');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] rounded-xl shadow-sm transition cursor-pointer shrink-0"
                  >
                    {isRtl ? 'فتح محرك الصرف المتعدد 🚀' : 'Open Multi-SKU Engine'}
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 dark:text-zinc-300 rounded-xl text-xs cursor-pointer font-bold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={materialSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{materialSubmitting ? (isRtl ? 'جاري الطلب...' : 'Processing...') : (isRtl ? 'رفع طلب الصرف المخزني' : 'Submit Requisition')}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
    </ModuleShell>
  );
}
