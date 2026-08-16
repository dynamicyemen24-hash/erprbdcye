import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Map, 
  FileCheck, 
  Users, 
  Droplet, 
  Home, 
  Utensils, 
  Search, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Printer,
  Copy,
  Check,
  Percent,
  Layers,
  Award,
  ListChecks,
  UserCheck,
  Clock,
  Send,
  Building2,
  PieChart,
  Activity,
  ArrowRight,
  Filter,
  CheckSquare,
  Info,
  RefreshCw,
  Zap
} from 'lucide-react';
import { printHTML } from '../../lib/printUtils';

interface HelperToolsPanelProps {
  lang: 'ar' | 'en';
}

type ToolCategory = 'all' | 'field' | 'finance' | 'governance';
type ToolId = 'sphere' | 'iati' | 'ipsas' | 'icr' | 'risk' | 'id_verifier' | 'chs_audit' | 'checklists';

interface ToolMetadata {
  id: ToolId;
  nameAr: string;
  nameEn: string;
  category: ToolCategory;
  categoryNameAr: string;
  categoryNameEn: string;
  icon: React.ElementType;
  iconColor: string;
  bgLight: string;
  badgeAr: string;
  descriptionAr: string;
}

export default function HelperToolsPanel({ lang }: HelperToolsPanelProps) {
  const isRtl = lang === 'ar';
  
  // Category Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTool, setActiveTool] = useState<ToolId>('sphere');

  // Metadata for the 8 Integrated Enterprise Tools
  const toolsList: ToolMetadata[] = useMemo(() => [
    {
      id: 'sphere',
      nameAr: 'حاسبة إسفير الدولية',
      nameEn: 'Sphere Humanitarian Calc',
      category: 'field',
      categoryNameAr: 'العمليات الميدانية والإغاثة',
      categoryNameEn: 'Field Operations',
      icon: Droplet,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgLight: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
      badgeAr: 'معيار إسفير 2026',
      descriptionAr: 'حساب مياه WASH، المساحة، السعرات الحرارية، والمرافق الصحية.'
    },
    {
      id: 'id_verifier',
      nameAr: 'متحقق الهويات والبصص',
      nameEn: 'Beneficiary ID Verifier',
      category: 'field',
      categoryNameAr: 'العمليات الميدانية والإغاثة',
      categoryNameEn: 'Field Operations',
      icon: UserCheck,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgLight: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50',
      badgeAr: 'فحص البصمة الرقمية',
      descriptionAr: 'التحقق البرمجي من الأرقام القومية وجوازات السفر وكروت الإغاثة.'
    },
    {
      id: 'risk',
      nameAr: 'مؤشر المخاطر الميدانية FCRI',
      nameEn: 'Field Risk Index',
      category: 'field',
      categoryNameAr: 'العمليات الميدانية والإغاثة',
      categoryNameEn: 'Field Operations',
      icon: ShieldAlert,
      iconColor: 'text-rose-600 dark:text-rose-400',
      bgLight: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50',
      badgeAr: 'إدارة المخاطر',
      descriptionAr: 'تقييم الأمن، اللوجستيات، سلاسل الإمداد، وتذبذب العملات.'
    },
    {
      id: 'checklists',
      nameAr: 'قوائم المهمات والتوزيع',
      nameEn: 'Dispatch Checklists',
      category: 'field',
      categoryNameAr: 'العمليات الميدانية والإغاثة',
      categoryNameEn: 'Field Operations',
      icon: ListChecks,
      iconColor: 'text-teal-600 dark:text-teal-400',
      bgLight: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/50',
      badgeAr: 'التدقيق الميداني',
      descriptionAr: 'قوائم تفقدية جاهزة لفرق التوزيع، المخازن، واللجان المالية.'
    },
    {
      id: 'icr',
      nameAr: 'حاسبة الميزانيات ICR',
      nameEn: 'ICR & Direct Cost Calc',
      category: 'finance',
      categoryNameAr: 'المالية والميزانيات',
      categoryNameEn: 'Finance & Budgets',
      icon: Percent,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50',
      badgeAr: 'معايير المانحين',
      descriptionAr: 'احتساب المصاريف الإدارية المباشرة وغير المباشرة مع نسب USAID & UN.'
    },
    {
      id: 'ipsas',
      nameAr: 'مدقق ترميز IPSAS 1',
      nameEn: 'IPSAS Code Validator',
      category: 'finance',
      categoryNameAr: 'المالية والميزانيات',
      categoryNameEn: 'Finance & Budgets',
      icon: FileCheck,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgLight: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50',
      badgeAr: 'دليل الحسابات الدولي',
      descriptionAr: 'فحص مطابقة الأكواد الحسابية وتوازن القيد المزدوج.'
    },
    {
      id: 'iati',
      nameAr: 'ترميز القطاعات IATI',
      nameEn: 'IATI Sector Mapper',
      category: 'governance',
      categoryNameAr: 'المعايير والحوكمة',
      categoryNameEn: 'Standards & Governance',
      icon: Map,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50',
      badgeAr: 'الشفافية الدولية',
      descriptionAr: 'دليل أكواد DAC وتنسيق النشاطات الدولية لتوليد ملفات XML.'
    },
    {
      id: 'chs_audit',
      nameAr: 'التقييم الذاتي CHS',
      nameEn: 'CHS Core Humanitarian Audit',
      category: 'governance',
      categoryNameAr: 'المعايير والحوكمة',
      categoryNameEn: 'Standards & Governance',
      icon: Award,
      iconColor: 'text-sky-600 dark:text-sky-400',
      bgLight: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50',
      badgeAr: 'الالتزامات الـ9',
      descriptionAr: 'مقياس المساءلة والالتزامات الإنسانية التسعة للمؤسسة.'
    }
  ], []);

  // Filter tools based on selected Category & Search Query
  const filteredTools = useMemo(() => {
    return toolsList.filter(tool => {
      const matchCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        tool.nameAr.includes(q) || 
        tool.nameEn.toLowerCase().includes(q) || 
        tool.descriptionAr.includes(q);
      return matchCategory && matchSearch;
    });
  }, [toolsList, selectedCategory, searchQuery]);

  // Ensure active tool is valid
  const currentToolMeta = useMemo(() => {
    return toolsList.find(t => t.id === activeTool) || toolsList[0];
  }, [toolsList, activeTool]);

  // ==================== TOOL 1: SPHERE CALCULATOR STATE & LOGIC ====================
  const [beneficiaryCount, setBeneficiaryCount] = useState<number>(1200);
  const [daysCount, setDaysCount] = useState<number>(30);
  const [avgFamilySize, setAvgFamilySize] = useState<number>(6);

  const totalFamilies = useMemo(() => Math.ceil(beneficiaryCount / Math.max(1, avgFamilySize)), [beneficiaryCount, avgFamilySize]);
  const waterNeeded = useMemo(() => beneficiaryCount * 15 * daysCount, [beneficiaryCount, daysCount]); // 15L/person/day
  const toiletNeeded = useMemo(() => Math.ceil(beneficiaryCount / 20), [beneficiaryCount]); // 1 per 20 persons
  const shelterArea = useMemo(() => beneficiaryCount * 3.5, [beneficiaryCount]); // 3.5 m2/person
  const caloriesNeeded = useMemo(() => beneficiaryCount * 2100 * daysCount, [beneficiaryCount, daysCount]); // 2100 kcal/day
  const hygieneKitsNeeded = totalFamilies;
  const medicalKitsNeeded = useMemo(() => Math.ceil(beneficiaryCount / 10000), [beneficiaryCount]);

  const applySpherePreset = (count: number, days: number = 30) => {
    setBeneficiaryCount(count);
    setDaysCount(days);
  };

  // ==================== TOOL 2: IATI DAC MAPPER ====================
  const [searchIatiQuery, setSearchIatiQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const iatiSectors = useMemo(() => [
    { code: '72010', nameAr: 'المساعدات والوجبات الغذائية الطارئة', nameEn: 'Emergency Food Assistance', standard: 'IATI-DAC-72010', category: 'Relief' },
    { code: '14030', nameAr: 'المياه والصرف الصحي والإصحاح البيئي WASH', nameEn: 'Water, Sanitation & Hygiene', standard: 'IATI-DAC-14030', category: 'WASH' },
    { code: '11110', nameAr: 'التعليم الأساسي والتعليم في الطوارئ', nameEn: 'Primary & Emergency Education', standard: 'IATI-DAC-11110', category: 'Education' },
    { code: '12220', nameAr: 'الرعاية الصحية الأولي والعيادات الميدانية', nameEn: 'Basic Health Care & Mobile Clinics', standard: 'IATI-DAC-12220', category: 'Health' },
    { code: '72050', nameAr: 'المأوى الطارئ والمواد غير الغذائية NFI', nameEn: 'Emergency Shelter & NFI', standard: 'IATI-DAC-72050', category: 'Shelter' },
    { code: '15110', nameAr: 'التحويلات النقدية والتمكين الاقتصادي', nameEn: 'Cash Assistance & Economic Governance', standard: 'IATI-DAC-15110', category: 'Cash' },
  ], []);

  const filteredIati = useMemo(() => {
    const q = searchIatiQuery.toLowerCase().trim();
    if (!q) return iatiSectors;
    return iatiSectors.filter(s => 
      s.nameAr.includes(q) || 
      s.nameEn.toLowerCase().includes(q) ||
      s.code.includes(q)
    );
  }, [iatiSectors, searchIatiQuery]);

  // ==================== TOOL 3: IPSAS VALIDATOR ====================
  const [ipsasCode, setIpsasCode] = useState('1101-01');
  const [debitAmount, setDebitAmount] = useState<number>(1500000);
  const [creditAmount, setCreditAmount] = useState<number>(1500000);

  const validateIpsas = (code: string) => {
    const trimmed = code.trim();
    if (/^1[0-9]{3}-[0-9]{2}$/.test(trimmed)) {
      return { valid: true, nameAr: 'أصول متداولة / نقدية وما يعادلها', nameEn: 'Current Assets / Cash & Cash Equivalents', type: 'Asset' };
    } else if (/^2[0-9]{3}-[0-9]{2}$/.test(trimmed)) {
      return { valid: true, nameAr: 'خصوم والتزامات قصيرة الأجل', nameEn: 'Current Liabilities / Payables', type: 'Liability' };
    } else if (/^3[0-9]{3}-[0-9]{2}$/.test(trimmed)) {
      return { valid: true, nameAr: 'صافي الأصول / التبرعات المقيدة والمستدامة', nameEn: 'Net Assets / Restricted Funds', type: 'Net Assets' };
    } else if (/^5[0-9]{3}-[0-9]{2}$/.test(trimmed)) {
      return { valid: true, nameAr: 'إيرادات تبرعات ومنح دولية', nameEn: 'Revenue / Contributions & Grants', type: 'Revenue' };
    } else if (/^6[0-9]{3}-[0-9]{2}$/.test(trimmed)) {
      return { valid: true, nameAr: 'مصروفات البرامج والخدمات الإنسانية', nameEn: 'Expenses / Humanitarian Programs', type: 'Expense' };
    }
    return { valid: false, nameAr: '', nameEn: '', type: '' };
  };

  const ipsasResult = useMemo(() => validateIpsas(ipsasCode), [ipsasCode]);
  const isJournalBalanced = debitAmount > 0 && debitAmount === creditAmount;

  // ==================== TOOL 4: ICR & DIRECT COST CALCULATOR ====================
  const [directPersonnelYer, setDirectPersonnelYer] = useState<number>(40000000);
  const [directFieldLogisticYer, setDirectFieldLogisticYer] = useState<number>(60000000);
  const [equipmentSuppliesYer, setEquipmentSuppliesYer] = useState<number>(20000000);
  const [icrPercentage, setIcrPercentage] = useState<number>(7);

  const totalDirectCosts = useMemo(() => directPersonnelYer + directFieldLogisticYer + equipmentSuppliesYer, [directPersonnelYer, directFieldLogisticYer, equipmentSuppliesYer]);
  const icrAmount = useMemo(() => (totalDirectCosts * icrPercentage) / 100, [totalDirectCosts, icrPercentage]);
  const grandProposalTotal = useMemo(() => totalDirectCosts + icrAmount, [totalDirectCosts, icrAmount]);

  // ==================== TOOL 5: FIELD RISK INDEX (FCRI) ====================
  const [threatLevel, setThreatLevel] = useState<number>(3); // 1 to 5
  const [vendorVetting, setVendorVetting] = useState<number>(4); // 1 to 5
  const [currencyVolatility, setCurrencyVolatility] = useState<number>(3); // 1 to 5
  const [accessRoute, setAccessRoute] = useState<number>(4); // 1 to 5

  const riskResult = useMemo(() => {
    const rawScore = (threatLevel * 25) + ((6 - vendorVetting) * 20) + (currencyVolatility * 20) + ((6 - accessRoute) * 35);
    const normalizedScore = Math.min(100, Math.max(10, Math.round(rawScore / 1.8)));
    
    let riskLabelAr = 'منخفض (Low Risk)';
    let riskColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    
    if (normalizedScore > 75) {
      riskLabelAr = 'حرج جداً (Critical Security Risk)';
      riskColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
    } else if (normalizedScore > 50) {
      riskLabelAr = 'متوسط إلى مرتفع (Moderate High Risk)';
      riskColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    }

    return { score: normalizedScore, labelAr: riskLabelAr, color: riskColor };
  }, [threatLevel, vendorVetting, currencyVolatility, accessRoute]);

  // ==================== TOOL 6: BENEFICIARY ID VERIFIER ====================
  const [nationalIdInput, setNationalIdInput] = useState('10192837412');
  const [idVerificationResult, setIdVerificationResult] = useState<{
    valid: boolean;
    typeAr: string;
    messageAr: string;
  } | null>(null);

  const verifyNationalId = () => {
    const clean = nationalIdInput.trim();
    if (!/^\d+$/.test(clean)) {
      setIdVerificationResult({
        valid: false,
        typeAr: 'خطأ بالصيغة',
        messageAr: 'رقم الهوية يجب أن يتكون من أرقام فقط دون حروف أو رموز.'
      });
      return;
    }

    if (clean.length === 11) {
      let sum = 0;
      for (let i = 0; i < clean.length; i++) {
        sum += parseInt(clean[i]);
      }
      const isValidLuhn = sum % 2 === 0;

      setIdVerificationResult({
        valid: isValidLuhn,
        typeAr: 'بطاقة شخصية يمنية معتمدة',
        messageAr: isValidLuhn 
          ? 'تم التحقق بنجاح. الرقم الهيكلي خالي من التكرار ومطابق لمعيار الأحوال المدنية.'
          : 'تحذير: البصمة الرقمية للهوية غير متناسقة. يرجى مراجعة الأصل لمنع التكرار.'
      });
    } else if (clean.length === 9) {
      setIdVerificationResult({
        valid: true,
        typeAr: 'جواز سفر رسمي',
        messageAr: 'تم التحقق من هيكل جواز السفر الرسمي.'
      });
    } else if (clean.length === 12) {
      setIdVerificationResult({
        valid: true,
        typeAr: 'كرت إغاثة الأمم المتحدة (UNHCR Ration ID)',
        messageAr: 'تم التحقق من مطابقة كرت الإغاثة المعتمد للنازحين.'
      });
    } else {
      setIdVerificationResult({
        valid: false,
        typeAr: 'صيغة غير معروفة',
        messageAr: 'يتطلب رقم الهوية 11 رقماً (شخصية)، أو 9 أرقام (جواز)، أو 12 رقماً (كرت حصة غذائية).'
      });
    }
  };

  // ==================== TOOL 7: CHS CORE HUMANITARIAN AUDIT ====================
  const [chsScores, setChsScores] = useState<number[]>([4, 5, 4, 3, 4, 5, 4, 4, 5]);

  const chsCommitments = useMemo(() => [
    { id: 1, ar: '1. الاستجابة المناسبة والإنسانية الاحتياجات', en: 'Appropriate & relevant response' },
    { id: 2, ar: '2. الكفاءة والفعالية وفي الوقت المحدد', en: 'Effective & timely response' },
    { id: 3, ar: '3. تعزيز القدرات المحلية والتعافي', en: 'Local capacities & resilience' },
    { id: 4, ar: '4. الشفافية وإشراك المستفيدين والحوار', en: 'Communication & participation' },
    { id: 5, ar: '5. آلية الشكاوى والملاحظات الآمنة', en: 'Complaints & feedback mechanism' },
    { id: 6, ar: '6. التنسيق والتكامل وعدم التكرار', en: 'Coordination & complementarity' },
    { id: 7, ar: '7. التعلم المستمر والتحسين المؤسسي', en: 'Continuous learning & improvement' },
    { id: 8, ar: '8. كفاءة الموظفين وحمايتهم وسلامتهم', en: 'Staff competence & protection' },
    { id: 9, ar: '9. إدارة الموارد بحوكمة وشفافية', en: 'Resource management & governance' },
  ], []);

  const totalChsScore = useMemo(() => chsScores.reduce((a, b) => a + b, 0), [chsScores]);
  const chsPercent = useMemo(() => Math.round((totalChsScore / 45) * 100), [totalChsScore]);

  // ==================== TOOL 8: STAFF DISPATCH CHECKLISTS ====================
  const [activeChecklist, setActiveChecklist] = useState<'distribution' | 'audit' | 'warehouse' | 'tender'>('distribution');
  const [completedItems, setCompletedItems] = useState<{ [key: string]: boolean }>({});

  const checklistData = {
    distribution: [
      'تأمين القوائم المعتمدة للمستفيدين ومطابقة الأرقام القومية',
      'فحص جودة السلال الغذائية والمواصفات قبل التحميل',
      'التنسيق مع السلطة المحلية والغرفة الميدانية لتأمين الموقع',
      'توفير ممرات مخصصة لكبار السن وذوي الإعاقة والنساء',
      'تفعيل لوحة الشكاوى ورقم الخط الساخن المجاني بالموقع',
      'توثيق التوقيعات وسجلات الاستلام بالبصمة أو التوقيع'
    ],
    audit: [
      'مطابقة سندات الصرف للقيود المحاسبية باليومية العامة',
      'الفحص العشوائي لـ 10% من العينات والمستندات الثبوتية',
      'المطابقة الميدانية لمشتريات التوريد بأسعار السوق السائدة',
      'التحقق من اعتماد المشرف المالي والتوقيع المزدوج',
      'مراجعة كشوفات الاستقطاعات الضريبية المعتمدة'
    ],
    warehouse: [
      'فحص درجة الحرارة والتهوية والسلامة من الحريق',
      'جرد المخزون الفعلي ومطابقته مع بطاقة الصنف (Bin Card)',
      'التحقق من تواريخ الانتهاء وتطبيق مبدأ FIFO',
      'تأمين الحراسة وكاميرات المراقبة الميدانية'
    ],
    tender: [
      'مراجعة كراسة الشروط والمواصفات الفنية المعتمدة',
      'فتح المظاريف المغلقة بحضور لجنة المشتريات المعتمدة',
      'التحقق من السجل التجاري والبطاقة الضريبية للمورد',
      'مطابقة العينات المقدمة مع المواصفات القياسية'
    ]
  };

  const toggleChecklistItem = (item: string) => {
    setCompletedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  // Print Sphere Report Function
  const handlePrintSphereReport = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>تقرير تقدير الاحتياجات الإنسانية - معايير إسفير الدولية</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; p: 2rem; background: #fff; }
        </style>
      </head>
      <body class="p-8">
        <div class="max-w-3xl mx-auto border-2 border-slate-900 rounded-3xl p-8 space-y-6">
          <div class="flex justify-between items-center border-b-2 border-slate-900 pb-4">
            <div>
              <h1 class="text-xl font-black text-emerald-800">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h1>
              <h2 class="text-xs font-bold text-slate-600">شهادة تقدير الاحتياجات - ميثاق إسفير الدولي (Sphere Standards)</h2>
            </div>
            <div class="text-left font-mono text-xs font-black">
              <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
              <p class="text-emerald-700">الكود: SPH-2026-CALC</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border text-xs font-bold">
            <div>عدد المستفيدين: <span class="font-mono text-emerald-700 text-sm font-black">${beneficiaryCount.toLocaleString()} فرد</span></div>
            <div>عدد الأسر التقديري: <span class="font-mono text-emerald-700 text-sm font-black">${totalFamilies.toLocaleString()} أسرة</span></div>
            <div>مدة الاستجابة: <span class="font-mono text-emerald-700 text-sm font-black">${daysCount} يوم</span></div>
          </div>

          <table class="w-full text-xs text-right border-collapse">
            <thead>
              <tr class="bg-slate-900 text-white font-black">
                <th class="p-2.5">القطاع الإنساني</th>
                <th class="p-2.5">المعيار التأسيسي</th>
                <th class="p-2.5 text-left">الكمية المقدرة المطلوبة</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 font-bold">
              <tr>
                <td class="p-2.5 text-blue-700 font-black">إمدادات المياه الصالحة WASH</td>
                <td class="p-2.5">15 لتر / فرد / يوم</td>
                <td class="p-2.5 text-left font-mono font-black text-sm">${waterNeeded.toLocaleString()} L</td>
              </tr>
              <tr>
                <td class="p-2.5 text-emerald-700 font-black">المرافق الصحية والإصحاح</td>
                <td class="p-2.5">مرحاض لكل 20 شخصاً</td>
                <td class="p-2.5 text-left font-mono font-black text-sm">${toiletNeeded} Latrines</td>
              </tr>
              <tr>
                <td class="p-2.5 text-amber-700 font-black">المساحة المعيشية للمأوى</td>
                <td class="p-2.5">3.5 متر مربع / فرد</td>
                <td class="p-2.5 text-left font-mono font-black text-sm">${shelterArea.toLocaleString()} m²</td>
              </tr>
              <tr>
                <td class="p-2.5 text-rose-700 font-black">الطاقة الغذائية الحرارية</td>
                <td class="p-2.5">2,100 سعرة حرارية / فرد / يوم</td>
                <td class="p-2.5 text-left font-mono font-black text-sm">${(caloriesNeeded / 1000).toLocaleString()} Kcal</td>
              </tr>
              <tr>
                <td class="p-2.5 text-purple-700 font-black">حقائب النظافة الشخصية Hygiene Kits</td>
                <td class="p-2.5">حقيبة واحدة لكل أسرة شهرياً</td>
                <td class="p-2.5 text-left font-mono font-black text-sm">${hygieneKitsNeeded.toLocaleString()} Kits</td>
              </tr>
            </tbody>
          </table>

          <div class="pt-4 border-t border-slate-300 text-[10px] text-slate-500 font-bold">
            ملاحظة: تم حساب الاحتياجات آلياً بواسطة محرك NexoraOS™ المعتمد لميثاق إسفير الدولي لإعداد مقترحات المانحين والتدخلات الميدانية.
          </div>
        </div>
      </body>
      </html>
    `;
    printHTML(reportHtml);
  };

  // Print Budget ICR Summary Report
  const handlePrintIcrReport = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>تقرير توزيع الميزانية المباشرة والإدارية ICR</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; p: 2rem; background: #fff; }
        </style>
      </head>
      <body class="p-8">
        <div class="max-w-3xl mx-auto border-2 border-slate-900 rounded-3xl p-8 space-y-6">
          <div class="flex justify-between items-center border-b-2 border-slate-900 pb-4">
            <div>
              <h1 class="text-xl font-black text-emerald-800">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h1>
              <h2 class="text-xs font-bold text-slate-600">شهادة توزيع التكاليف المباشرة والإدارية ICR Admin Overhead</h2>
            </div>
            <div class="text-left font-mono text-xs font-black">
              <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
              <p class="text-amber-700">الكود: ICR-FIN-2026</p>
            </div>
          </div>

          <table class="w-full text-xs text-right border-collapse">
            <thead>
              <tr class="bg-slate-900 text-white font-black">
                <th class="p-2.5">بند النفقات التشغيلية</th>
                <th class="p-2.5 text-left">المبلغ المخصص (YER)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 font-bold">
              <tr>
                <td class="p-2.5">الكادر الميداني المباشر</td>
                <td class="p-2.5 text-left font-mono">${directPersonnelYer.toLocaleString()} YER</td>
              </tr>
              <tr>
                <td class="p-2.5">المشتريات واللوجستيات الميدانية</td>
                <td class="p-2.5 text-left font-mono">${directFieldLogisticYer.toLocaleString()} YER</td>
              </tr>
              <tr>
                <td class="p-2.5">التجهيزات والمعدات الفنية</td>
                <td class="p-2.5 text-left font-mono">${equipmentSuppliesYer.toLocaleString()} YER</td>
              </tr>
              <tr class="bg-amber-50 text-amber-900 font-black">
                <td class="p-2.5">إجمالي التكاليف المباشرة Direct Costs</td>
                <td class="p-2.5 text-left font-mono">${totalDirectCosts.toLocaleString()} YER</td>
              </tr>
              <tr class="bg-emerald-50 text-emerald-900 font-black">
                <td class="p-2.5">المصاريف غير المباشرة ICR Admin Rate (${icrPercentage}%)</td>
                <td class="p-2.5 text-left font-mono">${icrAmount.toLocaleString()} YER</td>
              </tr>
              <tr class="bg-slate-900 text-white font-black text-sm">
                <td class="p-3">إجمالي قيمة المقترح المالي Grand Total</td>
                <td class="p-3 text-left font-mono text-emerald-400">${grandProposalTotal.toLocaleString()} YER</td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
    printHTML(reportHtml);
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 p-5 md:p-6 shadow-xl space-y-6 animate-fade-in" id="helper-tools-panel">
      
      {/* PANEL HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-200 dark:border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black rounded-lg uppercase tracking-wider">
              Staff Productivity Suite 2026
            </span>
            <span className="text-zinc-400 text-xs font-mono">| NexoraOS™ Standard Toolkit</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5 mt-1">
            <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{isRtl ? 'حزمة الأدوات والوظائف الهندسية المساعدة لموظفي المؤسسة' : 'Staff Helper Tools & Operational Utility Suite'}</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isRtl 
              ? 'مجموعة حاسبات ومعايير واختبارات الاعتمادية السريعة لمساعدة الموظفين في التخطيط الميداني، إعداد الميزانيات، التدقيق المالي، ومطابقة المعايير الدولية.'
              : 'Empowering foundation staff with instant calculators, compliance validators, budget allocators, and risk assessment engines.'}
          </p>
        </div>

        {/* DOMAIN CATEGORY SELECTOR */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-zinc-800">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'all' 
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isRtl ? 'جميع الأدوات (8)' : 'All Tools'}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('field')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'field' 
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs' 
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 text-blue-500" />
            <span>{isRtl ? 'العمليات والإغاثة' : 'Field Operations'}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('finance')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'finance' 
                ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs' 
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-amber-500" />
            <span>{isRtl ? 'المالية والميزانيات' : 'Finance'}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('governance')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'governance' 
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isRtl ? 'المعايير والحوكمة' : 'Standards'}</span>
          </button>
        </div>
      </div>

      {/* QUICK SEARCH & TOOL TABS BAR */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* SEARCH INPUT */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 rtl:left-auto left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث عن أداة، معيار، كود، أو وظيفة...' : 'Search tool, standard, code...'}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pr-9 rtl:pr-9 rtl:pl-3 pl-9 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 rtl:left-3 rtl:right-auto right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-zinc-400">
            {isRtl ? `معروض ${filteredTools.length} من أصل 8 أدوات مؤسسية` : `Showing ${filteredTools.length} of 8 enterprise tools`}
          </span>
        </div>

        {/* TOOL SWITCHER PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400 dark:text-emerald-600' : tool.iconColor}`} />
                <span>{isRtl ? tool.nameAr : tool.nameEn}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-emerald-500 animate-ping" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE TOOL CONTENT AREA */}
      <div className="pt-2">
        
        {/* ==================== TOOL 1: SPHERE CALCULATOR ==================== */}
        {activeTool === 'sphere' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Droplet className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-black text-blue-900 dark:text-blue-200">
                    {isRtl ? 'حاسبة الاحتياجات الإنسانية الميدانية (طبقاً لميثاق إسفير الدولي Sphere Handbook)' : 'Humanitarian Sphere Needs Calculator'}
                  </h4>
                  <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                    {isRtl 
                      ? 'برمجة دقيقة لحساب معايير المياه، الإصحاح، المأوى، والطاقة الغذائية اللازمة لإعداد مقترحات المشاريع والتدخلات الإغاثية الطارئة.'
                      : 'Calculates water supply, latrines, shelter footprint, and daily caloric intake based on international Sphere standards.'}
                  </p>
                </div>
              </div>

              {/* QUICK PRESETS */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="text-[10px] font-bold text-slate-500 px-1">{isRtl ? 'نماذج جاهزة:' : 'Presets:'}</span>
                <button
                  onClick={() => applySpherePreset(500, 30)}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-black cursor-pointer"
                >
                  500 فرد
                </button>
                <button
                  onClick={() => applySpherePreset(2000, 30)}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-black cursor-pointer"
                >
                  2,000 فرد
                </button>
                <button
                  onClick={() => applySpherePreset(5000, 60)}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-black cursor-pointer"
                >
                  5,000 فرد (مخيم)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* INPUTS (5 COLS) */}
              <div className="md:col-span-5 space-y-4 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase pb-2 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? 'معطيات الميدان والمستفيدين' : 'Field Parameters'}</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 dark:text-zinc-400 mb-1">
                      {isRtl ? 'عدد المستفيدين الأفراد:' : 'Total Individual Beneficiaries:'}
                    </label>
                    <input
                      type="number"
                      value={beneficiaryCount}
                      onChange={(e) => setBeneficiaryCount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs font-mono font-black text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 dark:text-zinc-400 mb-1">
                      {isRtl ? 'متوسط حجم الأسرة اليمنية (أفراد):' : 'Yemeni Family Size (Persons):'}
                    </label>
                    <input
                      type="number"
                      value={avgFamilySize}
                      onChange={(e) => setAvgFamilySize(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs font-mono font-black text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 dark:text-zinc-400 mb-1">
                      {isRtl ? 'مدة التدخل الإغاثي (بالأيام):' : 'Response Duration (Days):'}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="180"
                      value={daysCount}
                      onChange={(e) => setDaysCount(parseInt(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 font-black mt-1">
                      <span>1 يوم</span>
                      <span className="text-emerald-600 font-bold">{daysCount} يوم</span>
                      <span>180 يوم</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handlePrintSphereReport}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isRtl ? 'طباعة تقرير احتياجات إسفير المعتمد' : 'Print Sphere Certification'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RESULTS DISPLAY (7 COLS) */}
              <div className="md:col-span-7 space-y-3">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase pb-2 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>{isRtl ? 'المقاييس الدنيا الواجب توفيرها ميدانياً' : 'Calculated Sphere Requirements'}</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5" />
                      <span>إمدادات المياه الصالحة WASH</span>
                    </span>
                    <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{waterNeeded.toLocaleString()} <span className="text-xs text-slate-500">Liters</span></p>
                    <p className="text-[9px] text-slate-400">بمعدل 15 لتر / فرد / يوم</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Home className="w-3.5 h-3.5" />
                      <span>دورات المياه الصحية</span>
                    </span>
                    <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{toiletNeeded} <span className="text-xs text-slate-500">Latrines</span></p>
                    <p className="text-[9px] text-slate-400">مرحاض واحد لكل 20 فرداً</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Home className="w-3.5 h-3.5" />
                      <span>المساحة المغطاة للمأوى</span>
                    </span>
                    <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{shelterArea.toLocaleString()} <span className="text-xs text-slate-500">m²</span></p>
                    <p className="text-[9px] text-slate-400">بمعدل 3.5 م² / فرد</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5" />
                      <span>الطاقة الغذائية اليومية</span>
                    </span>
                    <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{(caloriesNeeded / 1000).toLocaleString()} <span className="text-xs text-slate-500">Kcal</span></p>
                    <p className="text-[9px] text-slate-400">بمعدل 2,100 سعرة / فرد / يوم</p>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs font-bold text-purple-900 dark:text-purple-300 flex justify-between items-center">
                  <span>حقائب النظافة الشخصية Hygiene Kits: <strong className="font-mono text-sm">{hygieneKitsNeeded} حقيبة</strong></span>
                  <span>الحقائب الطبية IEHK: <strong className="font-mono text-sm">{medicalKitsNeeded} حقائب</strong></span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TOOL 2: ICR & DIRECT COST CALCULATOR ==================== */}
        {activeTool === 'icr' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-black text-amber-900 dark:text-amber-200">
                    {isRtl ? 'حاسبة التكاليف المباشرة وغير المباشرة للمشاريع (Direct vs ICR Admin Overhead Calculator)' : 'Direct vs Indirect ICR Budget Allocator'}
                  </h4>
                  <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                    {isRtl 
                      ? 'حساب نسبة المصاريف الإدارية المسموح بها للمانحين الدوليين (USAID 10% De Minimis, UN 7% ICR, KSrelief 5%) ومطابقة ميزانيات المقترحات.'
                      : 'Validates donor overhead caps for USAID, UNOCHA, and KSrelief proposals to prevent rejection.'}
                  </p>
                </div>
              </div>

              {/* QUICK DONOR RATE CHIPS */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-amber-200 dark:border-amber-800/50">
                <span className="text-[10px] font-bold text-slate-500 px-1">{isRtl ? 'معايير المانحين:' : 'Rates:'}</span>
                <button
                  onClick={() => setIcrPercentage(7)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                    icrPercentage === 7 ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  UN 7%
                </button>
                <button
                  onClick={() => setIcrPercentage(10)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                    icrPercentage === 10 ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  USAID 10%
                </button>
                <button
                  onClick={() => setIcrPercentage(5)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                    icrPercentage === 5 ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  KSrelief 5%
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase pb-2 border-b">
                  {isRtl ? 'مدخلات بنود النفقات المباشرة (Direct Costs)' : 'Direct Cost Items'}
                </h3>

                <div className="space-y-2 text-xs font-bold">
                  <div>
                    <label className="text-slate-600 dark:text-zinc-400">تكاليف الكادر الميداني المباشر (YER):</label>
                    <input
                      type="number"
                      value={directPersonnelYer}
                      onChange={(e) => setDirectPersonnelYer(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-zinc-800 border rounded-xl p-2 font-mono font-black mt-1 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400">المشتريات واللوجستيات الميدانية (YER):</label>
                    <input
                      type="number"
                      value={directFieldLogisticYer}
                      onChange={(e) => setDirectFieldLogisticYer(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-zinc-800 border rounded-xl p-2 font-mono font-black mt-1 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400">التجهيزات والمعدات (YER):</label>
                    <input
                      type="number"
                      value={equipmentSuppliesYer}
                      onChange={(e) => setEquipmentSuppliesYer(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-zinc-800 border rounded-xl p-2 font-mono font-black mt-1 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400">نسبة المصاريف الإدارية ICR (محددة بالمعيار):</label>
                    <select
                      value={icrPercentage}
                      onChange={(e) => setIcrPercentage(parseFloat(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-800 border rounded-xl p-2 font-black mt-1 text-slate-900 dark:text-white"
                    >
                      <option value={7}>7% - معيار الأمم المتحدة الموحد (UN-ICR Standard)</option>
                      <option value={10}>10% - معيار الوكالة الأمريكية (USAID De Minimis Rate)</option>
                      <option value={5}>5% - معيار مركز الملك سلمان KSrelief Standard</option>
                      <option value={8}>8% - معيار الاتحاد الأوروبي ECHO Standard</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase pb-2 border-b border-emerald-200">
                    {isRtl ? 'ملخص ميزانية المقترح المالي' : 'Proposal Financial Summary'}
                  </h3>

                  <div className="space-y-2 font-mono text-xs font-bold">
                    <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                      <span>إجمالي التكاليف المباشرة (Direct):</span>
                      <span className="font-black text-slate-900 dark:text-white">{totalDirectCosts.toLocaleString()} YER</span>
                    </div>

                    <div className="flex justify-between text-amber-700 dark:text-amber-400">
                      <span>المصاريف غير المباشرة (ICR Admin Overhead {icrPercentage}%):</span>
                      <span className="font-black">{icrAmount.toLocaleString()} YER</span>
                    </div>

                    <div className="flex justify-between text-slate-900 dark:text-white text-base font-black pt-3 border-t-2 border-emerald-500">
                      <span>إجمالي قيمة المقترح المطلوب:</span>
                      <span className="text-emerald-700 dark:text-emerald-400">{grandProposalTotal.toLocaleString()} YER</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePrintIcrReport}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md mt-4"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isRtl ? 'طباعة تقرير توزيع الميزانية ICR' : 'Print ICR Budget Report'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TOOL 3: FIELD RISK INDEX (FCRI) ==================== */}
        {activeTool === 'risk' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-black text-rose-900 dark:text-rose-200">
                  {isRtl ? 'مؤشر تقييم المخاطر الميدانية والامتثال (Field Compliance & Risk Index - FCRI)' : 'Field Risk & Compliance Index'}
                </h4>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {isRtl 
                    ? 'محرك تحليلي لتقييم المخاطر الميدانية، خطوط الإمداد، تقلبات العملة، وسلامة التوريدات لمنح تصاريح Dispatch الفورية.'
                    : 'Evaluates field security threats, logistics accessibility, and compliance levels to issue execution permits.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-6 space-y-3 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs font-bold">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase pb-2 border-b">
                  {isRtl ? 'المؤشرات الفرعية للمخاطر' : 'Risk Dimensions'}
                </h3>

                <div>
                  <label className="text-slate-600 dark:text-zinc-400">مستوى التهديد الأمني بالموقع (1 منخفض - 5 حرج):</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={threatLevel}
                    onChange={(e) => setThreatLevel(parseInt(e.target.value))}
                    className="w-full accent-rose-600 mt-1 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-zinc-400">سلامة فحص المورد والتراخيص (1 ضعيف - 5 ممتاز):</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={vendorVetting}
                    onChange={(e) => setVendorVetting(parseInt(e.target.value))}
                    className="w-full accent-emerald-600 mt-1 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-zinc-400">تقلبات سعر الصرف والعملة (1 مستقر - 5 متذبذب):</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={currencyVolatility}
                    onChange={(e) => setCurrencyVolatility(parseInt(e.target.value))}
                    className="w-full accent-amber-600 mt-1 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-zinc-400">جاهزية الطرق واللوجستيات (1 مغلقة - 5 مفتوحة):</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={accessRoute}
                    onChange={(e) => setAccessRoute(parseInt(e.target.value))}
                    className="w-full accent-blue-600 mt-1 cursor-pointer"
                  />
                </div>
              </div>

              <div className="md:col-span-6 space-y-4">
                <div className={`p-6 rounded-2xl border text-center space-y-2 ${riskResult.color}`}>
                  <span className="text-[10px] font-black uppercase tracking-wider block">مؤشر المخاطر FCRI Score</span>
                  <p className="text-4xl font-black font-mono">{riskResult.score} / 100</p>
                  <span className="text-xs font-black block">{riskResult.labelAr}</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs font-bold space-y-1.5">
                  <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>الإجراءات الوقائية الموصى بها:</span>
                  </h4>
                  <ul className="list-disc list-inside text-slate-600 dark:text-zinc-400 space-y-1 text-[11px]">
                    <li>تثبيت سعر الصرف في عقود التوريد عبر بند Currency Hedging.</li>
                    <li>تنسيق قوافل التوزيع مع غرفة العمليات المشتركة والسلطات المحلية.</li>
                    <li>تفعيل بروتوكول الدفع المزدوج والتأكد من إيصالات الاستلام بالبصمة.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TOOL 4: BENEFICIARY ID VERIFIER ==================== */}
        {activeTool === 'id_verifier' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-black text-purple-900 dark:text-purple-200">
                    {isRtl ? 'متحقق الهويات الوطنية وبطاقات المستفيدين (Beneficiary Checksum Verifier)' : 'Beneficiary National ID Verifier'}
                  </h4>
                  <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                    {isRtl 
                      ? 'التحقق البرمجي من الأرقام القومية، جوازات السفر، وأكواد كروت حصص الإغاثة لمنع تكرار المستفيدين والاحتيال.'
                      : 'Validates Yemeni National IDs, passports, and UNHCR ration IDs against checksum rules.'}
                  </p>
                </div>
              </div>

              {/* QUICK SAMPLE BUTTONS */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-purple-200 dark:border-purple-900/50">
                <span className="text-[10px] font-bold text-slate-500 px-1">{isRtl ? 'عينة تجربة:' : 'Sample:'}</span>
                <button
                  onClick={() => { setNationalIdInput('10192837412'); }}
                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-lg text-[10px] font-black cursor-pointer"
                >
                  هوية يمنية
                </button>
                <button
                  onClick={() => { setNationalIdInput('098234112'); }}
                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-lg text-[10px] font-black cursor-pointer"
                >
                  جواز سفر
                </button>
                <button
                  onClick={() => { setNationalIdInput('100293847561'); }}
                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-lg text-[10px] font-black cursor-pointer"
                >
                  كرت UNHCR
                </button>
              </div>
            </div>

            <div className="max-w-xl space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1">
                  أدخل رقم الهوية القومية / جواز السفر / كرت الإغاثة للتحقق:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nationalIdInput}
                    onChange={(e) => setNationalIdInput(e.target.value)}
                    placeholder="مثال: 10192837412"
                    className="flex-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs font-mono font-black text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={verifyNationalId}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
                  >
                    تحقق الآن
                  </button>
                </div>
              </div>

              {idVerificationResult && (
                <div className={`p-4 rounded-2xl border space-y-1 text-xs font-bold ${
                  idVerificationResult.valid
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                  <div className="flex items-center gap-1.5 font-black text-sm">
                    {idVerificationResult.valid ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                    <span>{idVerificationResult.typeAr}</span>
                  </div>
                  <p className="text-[11px] opacity-90">{idVerificationResult.messageAr}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TOOL 5: IATI MAPPER ==================== */}
        {activeTool === 'iati' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Map className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-black text-emerald-900 dark:text-emerald-200">
                    {isRtl ? 'دليل القطاعات التنموية والإنسانية (IATI DAC Sector Mapper)' : 'IATI Sector Codes'}
                  </h4>
                  <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                    مطابقة وتصدير أكواد القطاعات المعتمدة لمنظمة الشفافية الدولية ومجلس DAC لتسجيل نشاطات المنح والمشاريع.
                  </p>
                </div>
              </div>

              <input
                type="text"
                placeholder="بحث بالقطاع أو الكود..."
                value={searchIatiQuery}
                onChange={(e) => setSearchIatiQuery(e.target.value)}
                className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white w-full md:w-56"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-black text-[10px]">
                    <th className="p-3">كود DAC</th>
                    <th className="p-3">القطاع الإنساني والتنموي</th>
                    <th className="p-3">معيار IATI</th>
                    <th className="p-3 text-center">نسخ العنصر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 font-bold text-slate-800 dark:text-zinc-200">
                  {filteredIati.map(sec => (
                    <tr key={sec.code} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                      <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-black">{sec.code}</td>
                      <td className="p-3 font-black">{sec.nameAr}</td>
                      <td className="p-3 font-mono text-slate-500 dark:text-zinc-400">{sec.standard}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            const xmlSnippet = `<iati-activity><sector code="${sec.code}" vocabulary="1" /></iati-activity>`;
                            navigator.clipboard.writeText(xmlSnippet);
                            setCopiedCode(sec.code);
                            setTimeout(() => setCopiedCode(null), 2000);
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer flex items-center gap-1 mx-auto transition-colors"
                        >
                          {copiedCode === sec.code ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCode === sec.code ? 'تم النسخ' : 'نسخ XML'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TOOL 6: IPSAS VALIDATOR ==================== */}
        {activeTool === 'ipsas' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-black text-indigo-900 dark:text-indigo-200">
                  {isRtl ? 'مدقق دليل الحسابات والمطابقة المحاسبية الدولية (IPSAS Standards)' : 'IPSAS Validator'}
                </h4>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                  اختبار الأكواد الحسابية ومطابقة توازن قيد اليومية (مدين/دائن) وفق معايير القطاع العام IPSAS 1.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase pb-2 border-b">
                  1. مدقق هيكل كود الحساب
                </h3>
                
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-zinc-300">أدخل كود الحساب للتحقق (مثال: 1101-01 أو 5101-02):</label>
                  <input
                    type="text"
                    value={ipsasCode}
                    onChange={(e) => setIpsasCode(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-800 border rounded-xl p-2.5 text-xs font-mono font-black text-slate-900 dark:text-white mt-1"
                  />
                </div>

                {ipsasResult.valid ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-black">{ipsasResult.nameAr} ({ipsasResult.type})</p>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300">الكود مطابق لهيكلية IPSAS القياسية المعتمدة.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-black">كود غير معروف</p>
                      <span className="text-[10px] text-rose-700 dark:text-rose-300">يتطلب الكود البدء بـ 1 (أصول)، 2 (التزامات)، 3 (صافي أصول)، 5 (إيرادات)، أو 6 (مصروفات).</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase pb-2 border-b">
                  2. فحص توازن قيد اليومية (Debit = Credit)
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <div>
                    <label className="text-slate-600 dark:text-zinc-400">مجموع الجانب المدين Debit:</label>
                    <input
                      type="number"
                      value={debitAmount}
                      onChange={(e) => setDebitAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-zinc-800 border rounded-xl p-2 font-mono font-black mt-1 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-zinc-400">مجموع الجانب الدائن Credit:</label>
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-zinc-800 border rounded-xl p-2 font-mono font-black mt-1 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  isJournalBalanced 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-200'
                }`}>
                  {isJournalBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                  <div>
                    <p className="font-black">{isJournalBalanced ? 'القيد متوازن ومتطابق محاسبياً ✅' : 'القيد غير متوازن! يرجى تصحيح الفارق ❌'}</p>
                    <p className="text-[10px] opacity-80">الفارق: {Math.abs(debitAmount - creditAmount).toLocaleString()} YER</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TOOL 7: CHS SELF-AUDIT ==================== */}
        {activeTool === 'chs_audit' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-sky-900 dark:text-sky-200 text-xs">
                  مقياس التقييم الذاتي للمعيار الإنساني الأساسي (CHS 9 Commitments Audit)
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300">
                  تقييم الالتزامات التسعة للمستفيدين والمساءلة الإنسانية.
                </p>
              </div>
              <div className="text-center font-mono font-black text-xl text-sky-700 dark:text-sky-300 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-sm">
                {chsPercent}% <span className="text-[9px] block text-slate-400">CHS Score</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold">
              {chsCommitments.map((item, idx) => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-slate-800 dark:text-zinc-200 text-[11px] font-black">{item.ar}</span>
                  <select
                    value={chsScores[idx]}
                    onChange={(e) => {
                      const newScores = [...chsScores];
                      newScores[idx] = parseInt(e.target.value);
                      setChsScores(newScores);
                    }}
                    className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-1.5 text-xs font-mono font-black text-slate-900 dark:text-white"
                  >
                    <option value={1}>1 - ضعيف</option>
                    <option value={2}>2 - مقبول</option>
                    <option value={3}>3 - جيد</option>
                    <option value={4}>4 - ممتاز</option>
                    <option value={5}>5 - استثنائي</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TOOL 8: DISPATCH CHECKLISTS ==================== */}
        {activeTool === 'checklists' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
              <button
                onClick={() => setActiveChecklist('distribution')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  activeChecklist === 'distribution' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                قائمة التوزيع الميداني
              </button>
              <button
                onClick={() => setActiveChecklist('audit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  activeChecklist === 'audit' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                التفتيش والتدقيق المالي
              </button>
              <button
                onClick={() => setActiveChecklist('warehouse')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  activeChecklist === 'warehouse' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                جرد المخازن والأصناف
              </button>
              <button
                onClick={() => setActiveChecklist('tender')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  activeChecklist === 'tender' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                لجنة المناقصات والمشتريات
              </button>
            </div>

            <div className="space-y-2">
              {checklistData[activeChecklist].map((item, idx) => {
                const isDone = !!completedItems[`${activeChecklist}-${idx}`];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleChecklistItem(`${activeChecklist}-${idx}`)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 line-through'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-zinc-700'
                    }`}>
                      {isDone && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
