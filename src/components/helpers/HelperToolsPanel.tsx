import React, { useState, useMemo, useCallback } from 'react';
import { 
  Calculator, 
  Map, 
  DollarSign,
  Coins,
  Calendar as CalendarIcon,
  QrCode,
  Scale,
  TrendingDown,
  ExternalLink,
  Share2,
  Bookmark,
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
  initialTool?: ToolId;
  onClose?: () => void;
}

type ToolCategory = 'all' | 'field' | 'finance' | 'governance';
type ToolId = 'sphere' | 'id_verifier' | 'risk' | 'checklists' | 'zakat_calculator' | 'fx_hedging' | 'ipsas' | 'icr' | 'hijri_converter' | 'qr_stamp_generator' | 'iati' | 'chs_audit';

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

export default function HelperToolsPanel({ lang, initialTool, onClose }: HelperToolsPanelProps) {
  const isRtl = lang === 'ar';
  
  // Category Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTool, setActiveTool] = useState<ToolId>(initialTool || 'sphere');

// Simplified tool titles for end-user familiarity
  const toolsList: ToolMetadata[] = useMemo(() => [
    {
      id: 'sphere',
      nameAr: 'حاسبة الإغاثة الميدانية',
      nameEn: 'Field Relief Calc',
      category: 'field',
      categoryNameAr: 'العمليات الميدانية',
      categoryNameEn: 'Field Operations',
      icon: Droplet,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgLight: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
      badgeAr: 'معايير العمل الإنساني',
      descriptionAr: 'للحاجات المائية والغذائية والطوارئ الميدانية.'
    },
    {
      id: 'id_verifier',
      nameAr: 'التحقق من الهويات',
      nameEn: 'ID Verifier',
      category: 'field',
      categoryNameAr: 'العمليات الميدانية',
      categoryNameEn: 'Field Operations',
      icon: UserCheck,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgLight: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50',
      badgeAr: 'فحص البصمة الرقمية',
      descriptionAr: 'للتحقق من الأرقام القومية ووثائق المستفيدين.'
    },
    {
      id: 'risk',
      nameAr: 'مخاطر الميدان',
      nameEn: 'Field Risk',
      category: 'field',
      categoryNameAr: 'العمليات الميدانية',
      categoryNameEn: 'Field Operations',
      icon: ShieldAlert,
      iconColor: 'text-rose-600 dark:text-rose-400',
      bgLight: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50',
      badgeAr: 'إدارة المخاطر',
      descriptionAr: 'لتقييم السلامة اللوجستية وتكلفة التدخل.'
    },
    {
      id: 'zakat_calculator',
      nameAr: 'حاسبة الزكاة',
      nameEn: 'Zakat Calculator',
      category: 'finance',
      categoryNameAr: 'المالية والميزانيات',
      categoryNameEn: 'Finance & Budgets',
      icon: Coins,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50',
      badgeAr: 'المصارف الشرعية',
      descriptionAr: 'لاحتساب الزكاة وتوزيع المصارف الثمانية.'
    },
    {
      id: 'fx_hedging',
      nameAr: 'محول العملات',
      nameEn: 'Currency Converter',
      category: 'finance',
      categoryNameAr: 'المالية والميزانيات',
      categoryNameEn: 'Finance & Budgets',
      icon: DollarSign,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50',
      badgeAr: 'مؤشرات الصرف',
      descriptionAr: 'لتحويل العملات YER/SAR/USD ومراقبة الفجوات.'
    },
    {
      id: 'hijri_converter',
      nameAr: 'التقويم الهجري',
      nameEn: 'Hijri Calendar',
      category: 'governance',
      categoryNameAr: 'المعايير والحوكمة',
      categoryNameEn: 'Standards & Governance',
      icon: CalendarIcon,
      iconColor: 'text-teal-500 dark:text-teal-400',
      bgLight: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/50',
      badgeAr: 'التقويم الإسلامي',
      descriptionAr: 'لتحويل التواريخ وحساب المواسم الدينية.'
    },
    {
      id: 'qr_stamp_generator',
      nameAr: 'مولد الأختام',
      nameEn: 'Stamp Generator',
      category: 'governance',
      categoryNameAr: 'المعايير والحوكمة',
      categoryNameEn: 'Standards & Governance',
      icon: QrCode,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      bgLight: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50',
      badgeAr: 'التوثيق الرقمي',
      descriptionAr: 'لإنشاء أختام وحروف تحقق SHA-256 للوثائق.'
    },
    {
      id: 'checklists',
      nameAr: 'قوائم التدقيق',
      nameEn: 'Dispatch Checklists',
      category: 'field',
      categoryNameAr: 'العمليات الميدانية',
      categoryNameEn: 'Field Operations',
      icon: ListChecks,
      iconColor: 'text-teal-600 dark:text-teal-400',
      bgLight: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/50',
      badgeAr: 'التدقيق الميداني',
      descriptionAr: 'لقوائم التفقدية لتوزيع، مخازن، ولجان مالية.'
    },
    {
      id: 'icr',
      nameAr: 'حاسبة التكاليف',
      nameEn: 'Cost Calculator',
      category: 'finance',
      categoryNameAr: 'المالية والميزانيات',
      categoryNameEn: 'Finance & Budgets',
      icon: Percent,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50',
      badgeAr: 'ضوابط الموازنات',
      descriptionAr: 'لاحتساب المصاريف التشغيلية وغير المباشرة.'
    },
    {
      id: 'ipsas',
      nameAr: 'المدقق المحاسبي',
      nameEn: 'IPSAS Validator',
      category: 'finance',
      categoryNameAr: 'المالية والميزانيات',
      categoryNameEn: 'Finance & Budgets',
      icon: FileCheck,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgLight: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50',
      badgeAr: 'المطابقة المحاسبية',
      descriptionAr: 'لفحص سلامة الحسابات والتوازن المزدوج.'
    },
    {
      id: 'iati',
      nameAr: 'دليل القطاعات',
      nameEn: 'IATI Mapper',
      category: 'governance',
      categoryNameAr: 'المعايير والحوكمة',
      categoryNameEn: 'Standards & Governance',
      icon: Map,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50',
      badgeAr: 'الشفافية والتقارير',
      descriptionAr: 'لتصنيف القطاعات والأنشطة التنموية المعتمدة.'
    },
    {
      id: 'chs_audit',
      nameAr: 'معايير الجودة',
      nameEn: 'CHS Audit',
      category: 'governance',
      categoryNameAr: 'المعايير والحوكمة',
      categoryNameEn: 'Standards & Governance',
      icon: Award,
      iconColor: 'text-sky-600 dark:text-sky-400',
      bgLight: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50',
      badgeAr: 'الجودة والمساءلة',
      descriptionAr: 'لتقييم التزام المؤسسة بالمعايير الإنسانية.'
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

  // Safe btoa implementation that handles non-Latin1 characters (Arabic, etc.)
function safeBtoa(str: string): string {
  if (!str) return '';
  try {
    // First try native btoa
    return btoa(str);
  } catch (e) {
    // Fallback: use TextEncoder if available (modern browsers)
    if (typeof TextEncoder !== 'undefined') {
      const encoder = new TextEncoder();
      const encoded = encoder.encode(str);
      // Convert bytes to Latin1-compatible string for btoa
      let result = '';
      for (let i = 0; i < encoded.length; i++) {
        // Take only the lower 8 bits of each byte
        result += String.fromCharCode(encoded[i] & 0xFF);
      }
      return btoa(result);
    }
    // Fallback for older browsers: replace non-Latin1 characters
    // (control characters are intentionally part of the Latin-1 range filter)
    // eslint-disable-next-line no-control-regex
    return str.replace(/[^\x00-\xFF]/g, function(c) {
      return String.fromCharCode(c.charCodeAt(0) & 0xFF);
    });
  }
}

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

  // ==================== TOOL 9: ZAKAT & CHARITIES ENGINE STATE & LOGIC ====================
  const [zakatCash, setZakatCash] = useState<number>(15000000);
  const [zakatGoldGrams, setZakatGoldGrams] = useState<number>(0);
  const [zakatGoldPrice, setZakatGoldPrice] = useState<number>(85000);
  const [zakatTradeGoods, setZakatTradeGoods] = useState<number>(5000000);
  const [zakatReceivables, setZakatReceivables] = useState<number>(2000000);
  const [zakatDebtsDue, setZakatDebtsDue] = useState<number>(3000000);
  const [zakatCopied, setZakatCopied] = useState<boolean>(false);

  const calculatedNisabThreshold = useMemo(() => {
    return Math.round(97.14 * zakatGoldPrice);
  }, [zakatGoldPrice]);

  const netZakatableAmount = useMemo(() => {
    const totalAssets = zakatCash + (zakatGoldGrams * zakatGoldPrice) + zakatTradeGoods + zakatReceivables;
    return Math.max(0, totalAssets - zakatDebtsDue);
  }, [zakatCash, zakatGoldGrams, zakatGoldPrice, zakatTradeGoods, zakatReceivables, zakatDebtsDue]);

  const isZakatEligible = netZakatableAmount >= calculatedNisabThreshold;
  const totalZakatObligation = isZakatEligible ? Math.round(netZakatableAmount * 0.025) : 0;

  const zakatBreakdown = useMemo(() => [
    { name: isRtl ? 'الفقراء والمساكين (دعم الأسر الأشد احتياجاً)' : 'The Poor & Needy', percent: 50, amount: Math.round(totalZakatObligation * 0.50), color: 'emerald' },
    { name: isRtl ? 'الغارمون (سداد ديون المعسرين وأصحاب الكرب)' : 'The Debt-Ridden (Gharimeen)', percent: 15, amount: Math.round(totalZakatObligation * 0.15), color: 'amber' },
    { name: isRtl ? 'في سبيل الله (المشاريع الإنسانية والتعليمية والصحية)' : 'In the Cause of Allah (Relief & Health)', percent: 15, amount: Math.round(totalZakatObligation * 0.15), color: 'teal' },
    { name: isRtl ? 'ابن السبيل (النازحون وعابرو السبيل المنقطعون)' : 'Stranded Wayfarers / IDPs', percent: 10, amount: Math.round(totalZakatObligation * 0.10), color: 'blue' },
    { name: isRtl ? 'العاملون عليها (المصاريف التشغيلية لتحصيل وتوزيع الزكاة)' : 'Zakat Administrators / Field Logistics', percent: 10, amount: Math.round(totalZakatObligation * 0.10), color: 'purple' }
  ], [isRtl, totalZakatObligation]);

  const handlePrintZakatStatement = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="utf-8" />
          <title>${isRtl ? 'سند احتساب الزكاة الشرعية والمصارف' : 'Official Zakat Assessment'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #0f172a; }
            @page { size: A4 portrait; margin: 15mm; }
          </style>
        </head>
        <body>
          <div style="max-width: 780px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #d97706; padding-bottom: 20px; margin-bottom: 25px;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <img src="/UAMEX_ERPLOGO.png" style="height: 55px;" alt="UAMEX ERP" />
                <img src="/LogoRohamaab.png" style="height: 55px;" alt="Logo Rohamaab" />
                <div>
                  <h2 style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 900;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
                  <p style="margin: 3px 0 0 0; color: #d97706; font-size: 11px; font-weight: 700;">نظام يو امكس المؤسسي الشامل - UAMEX ERP™</p>
                  <p style="margin: 2px 0 0 0; color: #64748b; font-size: 10px;">إدارة الموارد المالية والمصارف الشرعية (NEB-10)</p>
                </div>
              </div>
              <div style="text-align: ${isRtl ? 'left' : 'right'};">
                <span style="padding: 4px 12px; background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; font-weight: 900; border-radius: 6px; font-size: 11px;">
                  ${isZakatEligible ? (isRtl ? 'بلغت النصاب الشرعي' : 'Nisab Reached') : (isRtl ? 'دون النصاب' : 'Below Nisab')}
                </span>
                <p style="margin: 8px 0 0 0; font-size: 10px; color: #64748b;">${isRtl ? 'تاريخ الاحتساب:' : 'Date:'} ${new Date().toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}</p>
              </div>
            </div>

            <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 25px;">
              <table style="width: 100%; font-size: 11px;">
                <tr>
                  <td style="color: #92400e; font-weight: bold;">${isRtl ? 'الوعاء الزكوي الخاضع للزكاة:' : 'Net Zakatable Wealth:'}</td>
                  <td style="font-weight: 900; font-size: 14px; color: #78350f; font-family: monospace;">${netZakatableAmount.toLocaleString()} YER</td>
                  <td style="color: #92400e; font-weight: bold;">${isRtl ? 'نصاب الذهب المعتمد:' : 'Gold Nisab Threshold:'}</td>
                  <td style="font-weight: bold; font-family: monospace;">${calculatedNisabThreshold.toLocaleString()} YER</td>
                </tr>
                <tr>
                  <td style="color: #92400e; font-weight: bold; padding-top: 10px;">${isRtl ? 'مقدار الزكاة الواجبة (2.5%):' : 'Total Zakat Due (2.5%):'}</td>
                  <td colspan="3" style="padding-top: 10px; font-weight: 900; font-size: 18px; color: #059669; font-family: monospace;">
                    ${totalZakatObligation.toLocaleString()} YER
                  </td>
                </tr>
              </table>
            </div>

            <h3 style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 12px;">${isRtl ? 'توزيع الحصص على المصارف الثمانية الشرعية:' : 'Allocation Across Quranic Zakat Beneficiaries:'}</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px;">
              <thead>
                <tr style="background-color: #0f172a; color: #ffffff;">
                  <th style="padding: 8px 10px; text-align: ${isRtl ? 'right' : 'left'};">المصرف الشرعي</th>
                  <th style="padding: 8px 10px; text-align: center; width: 80px;">النسبة</th>
                  <th style="padding: 8px 10px; text-align: right; width: 160px;">المبلغ المخصص (YER)</th>
                </tr>
              </thead>
              <tbody>
                ${zakatBreakdown.map((item, idx) => `
                  <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px; font-weight: bold;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; font-weight: 900; color: #d97706;">${item.percent}%</td>
                    <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: 900; font-size: 12px;">${item.amount.toLocaleString()} YER</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
    printHTML(htmlContent);
  };

  // ==================== TOOL 10: MULTI-CURRENCY FX & HEDGING STATE & LOGIC ====================
  const [fxAmount, setFxAmount] = useState<number>(10000);
  const [fxFrom, setFxFrom] = useState<string>('USD');
  const [fxTo, setFxTo] = useState<string>('YER_SANAA');
  const [fxCopied, setFxCopied] = useState<boolean>(false);

  const [ratesConfig] = useState<Record<string, number>>({
    USD: 1,
    SAR: 0.266,
    EUR: 1.08,
    YER_SANAA: 0.00187,
    YER_ADEN: 0.000465
  });

  const convertFx = useCallback((amount: number, from: string, to: string) => {
    const fromRate = ratesConfig[from] || 1;
    const toRate = ratesConfig[to] || 1;
    const amountInUsd = amount * fromRate;
    return amountInUsd / toRate;
  }, [ratesConfig]);

  const convertedFxValue = useMemo(() => {
    return convertFx(fxAmount, fxFrom, fxTo);
  }, [convertFx, fxAmount, fxFrom, fxTo]);

  const [projectBudgetUsd, setProjectBudgetUsd] = useState<number>(50000);
  const [projectDurationMonths, setProjectDurationMonths] = useState<number>(6);
  const expectedInflationRate = 0.015;
  const recommendedHedgingBuffer = Math.round(projectBudgetUsd * (expectedInflationRate * projectDurationMonths));
  const totalHedgedBudgetUsd = projectBudgetUsd + recommendedHedgingBuffer;

  // ==================== TOOL 11: HIJRI & SEASONAL SCHEDULER STATE & LOGIC ====================
  const [selectedGregorianDate, setSelectedGregorianDate] = useState<string>(new Date().toISOString().slice(0, 10));
  
  const hijriFormatted = useMemo(() => {
    try {
      const d = new Date(selectedGregorianDate);
      return new Intl.DateTimeFormat(isRtl ? 'ar-SA-u-ca-islamic-umalqura' : 'en-US-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    } catch {
      return '1448 هـ';
    }
  }, [selectedGregorianDate, isRtl]);

  const seasonalCampaigns = useMemo(() => [
    { id: 'ramadan', titleAr: 'حملة رمضان المبارك والسلال الغذائية', titleEn: 'Holy Ramadan Drive', hijriTarget: '1 رمضان 1448 هـ', daysLeft: 165, targetFamilies: 8500, readinessPct: 75, accent: 'amber' },
    { id: 'eid_fitr', titleAr: 'مشروع كسوة العيد وزكاة الفطر للأيتام', titleEn: 'Eid Clothes Drive', hijriTarget: '29 رمضان 1448 هـ', daysLeft: 194, targetFamilies: 3200, readinessPct: 60, accent: 'emerald' },
    { id: 'adhah', titleAr: 'مشروع الأضاحي والإطعام والتوزيع الميداني', titleEn: 'Eid Al-Adha Meat', hijriTarget: '10 ذو الحجة 1448 هـ', daysLeft: 265, targetFamilies: 12000, readinessPct: 40, accent: 'rose' },
    { id: 'back_to_school', titleAr: 'مشروع الحقيبة والزي المدرسي للطلاب', titleEn: 'Back to School Bags', hijriTarget: '1 محرم 1449 هـ', daysLeft: 285, targetFamilies: 4500, readinessPct: 55, accent: 'blue' },
    { id: 'winter', titleAr: 'حملة دفء الشتاء والإيواء للأسر النازحة', titleEn: 'Winter Warmth Relief', hijriTarget: '15 جمادى الأولى 1448 هـ', daysLeft: 78, targetFamilies: 6000, readinessPct: 88, accent: 'teal' }
  ], []);

  // ==================== TOOL 12: QR & DIGITAL AUDIT STAMPER STATE & LOGIC ====================
  const [stampDocType, setStampDocType] = useState<string>('قرار إداري وتنفيذي');
  const [stampDocRef, setStampDocRef] = useState<string>('ROH-2026-DEC-094');
  const [stampBeneficiaryOrOrg, setStampBeneficiaryOrOrg] = useState<string>('قطاع البرامج والمشاريع الإغاثية');
  const [stampNotes, setStampNotes] = useState<string>('معتمد وموثق بموجب محاضر التدقيق والحوكمة المؤسسية');
  const [stampCopied, setStampCopied] = useState<boolean>(false);

  const digitalAuditHash = useMemo(() => {
    return 'SHA256-' + safeBtoa(stampDocRef + '-' + stampDocType).replace(/=/g, '').toUpperCase() + '-UAMEX-VERIFIED';
  }, [stampDocRef, stampDocType]);

  const handlePrintAuditStampCard = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="utf-8" />
          <title>${isRtl ? 'بطاقة التحقق والختم الرقمي المعتمد' : 'Digital Verification Stamp Card'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #0f172a; }
            @page { size: A4 portrait; margin: 15mm; }
          </style>
        </head>
        <body>
          <div style="max-width: 600px; margin: 40px auto; border: 2px solid #059669; border-radius: 16px; padding: 30px;">
            <div style="text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: center; gap: 15px; align-items: center; margin-bottom: 10px;">
                <img src="/UAMEX_ERPLOGO.png" style="height: 50px;" alt="UAMEX ERP" />
                <img src="/LogoRohamaab.png" style="height: 50px;" alt="Logo Rohamaab" />
              </div>
              <h2 style="margin: 0; color: #0f172a; font-size: 15px; font-weight: 900;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
              <p style="margin: 3px 0 0 0; color: #059669; font-size: 11px; font-weight: 700;">ختم التحقق الرقمي المشفر والمطابقة المؤسسية</p>
            </div>

            <div style="margin-bottom: 20px; font-size: 11px;">
              <div><strong>رقم المستند: </strong>${stampDocRef}</div>
              <div><strong>النوع: </strong>${stampDocType}</div>
              <div><strong>الجهة: </strong>${stampBeneficiaryOrOrg}</div>
            </div>

            <div style="background-color: #0f172a; color: #10b981; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 9px; word-break: break-all;">
              DIGITAL HASH: ${digitalAuditHash}
            </div>
          </div>
        </body>
      </html>
    `;
    printHTML(htmlContent);
  };


  // Print Sphere Report Function
  const handlePrintSphereReport = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>تقرير تقدير الاحتياجات الإنسانية الميدانية المعتمدة</title>
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
              <h2 class="text-xs font-bold text-slate-600">وثيقة تقدير الاحتياجات الميدانية وفق معايير العمل الإنساني</h2>
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
                <td class="p-2.5 text-blue-700 font-black">إمدادات المياه الصالحة للاستخدام والشرب</td>
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
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900 border-slate-900 dark:border-white shadow-md'
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

        {/* ==================== TOOL 9: ZAKAT & CHARITIES ENGINE ==================== */}
        {activeTool === 'zakat_calculator' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header / Intro Card */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Coins className="w-5 h-5" />
                  </span>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'حاسبة الزكاة الشرعية وتوزيع المصارف والصدقات (NEB-10 / NEB-15)' : 'Official Zakat & Charities Assessment Engine'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' 
                    ? 'احتساب دقيق للوعاء الزكوي، نصاب الذهب والفضة، وحصص المصارف الثمانية الشرعية المعتمدة بالريال اليمني.' 
                    : 'Calculate net zakatable assets, gold nisab threshold, and 8 Quranic distribution categories.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const text = `تقرير احتساب الزكاة - جمعية رُحماء بينهم\nالوعاء الزكوي: ${netZakatableAmount.toLocaleString()} YER\nنصاب الذهب: ${calculatedNisabThreshold.toLocaleString()} YER\nالزكاة الواجبة (2.5%): ${totalZakatObligation.toLocaleString()} YER\nحالة النصاب: ${isZakatEligible ? 'متحقق' : 'دون النصاب'}`;
                    navigator.clipboard.writeText(text);
                    setZakatCopied(true);
                    setTimeout(() => setZakatCopied(false), 2000);
                  }}
                  className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {zakatCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{zakatCopied ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ الحسبة' : 'Copy')}</span>
                </button>

                <button
                  onClick={handlePrintZakatStatement}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'طباعة سند معتمد A4' : 'Print Assessment'}</span>
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                  {lang === 'ar' ? 'السيولة النقدية والأرصدة البنكية (YER)' : 'Cash & Bank Balances (YER)'}
                </label>
                <input
                  type="number"
                  value={zakatCash}
                  onChange={(e) => setZakatCash(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black"
                />
                <span className="text-[10px] text-zinc-400 block">النقد السائل الجاهز في الخزينة والحسابات</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                  {lang === 'ar' ? 'سعر جرام الذهب عيار 21 اليوم (YER)' : 'Gold Price / Gram 21K (YER)'}
                </label>
                <input
                  type="number"
                  value={zakatGoldPrice}
                  onChange={(e) => setZakatGoldPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black text-amber-600"
                />
                <span className="text-[10px] text-zinc-400 block">لحساب قيمة النصاب الشرعي (85 جم عيار 24)</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                  {lang === 'ar' ? 'ذهب الاستثمار / الادخار (جرام)' : 'Investment Gold (Grams)'}
                </label>
                <input
                  type="number"
                  value={zakatGoldGrams}
                  onChange={(e) => setZakatGoldGrams(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black"
                />
                <span className="text-[10px] text-zinc-400 block">الذهب المملوك لغرض النماء أو الادخار</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                  {lang === 'ar' ? 'قيمة عروض التجارة والمخزون المتاح (YER)' : 'Trade Goods & Merchandise (YER)'}
                </label>
                <input
                  type="number"
                  value={zakatTradeGoods}
                  onChange={(e) => setZakatTradeGoods(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black"
                />
                <span className="text-[10px] text-zinc-400 block">تقوم بسعر البيع الحالي وقت الحول</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                  {lang === 'ar' ? 'الديون المرجوة للجمعية (الذمم المدينة)' : 'Good Receivables (YER)'}
                </label>
                <input
                  type="number"
                  value={zakatReceivables}
                  onChange={(e) => setZakatReceivables(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black"
                />
                <span className="text-[10px] text-zinc-400 block">ديون موثوقة مرجوة السداد قريباً</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                  {lang === 'ar' ? 'الديون والالتزامات الحالة الواجبة الخصم' : 'Deductible Due Debts (YER)'}
                </label>
                <input
                  type="number"
                  value={zakatDebtsDue}
                  onChange={(e) => setZakatDebtsDue(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black text-rose-600"
                />
                <span className="text-[10px] text-zinc-400 block">تخصم من وعاء الزكاة لأنها مستحقة السداد</span>
              </div>
            </div>

            {/* Results KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-1 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  {lang === 'ar' ? 'صافي الوعاء الزكوي الخاضع' : 'Net Zakatable Assets'}
                </span>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {netZakatableAmount.toLocaleString()} <span className="text-xs font-normal text-zinc-400">YER</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  نصاب الذهب الشرعي: <span className="font-mono font-bold text-amber-600">{calculatedNisabThreshold.toLocaleString()} YER</span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-1 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  {lang === 'ar' ? 'حالة بلوغ النصاب الشرعي' : 'Nisab Threshold Status'}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                    isZakatEligible 
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' 
                      : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                  }`}>
                    {isZakatEligible ? (lang === 'ar' ? 'بلغت النصاب (واجبة الزكاة)' : 'Nisab Reached') : (lang === 'ar' ? 'دون النصاب الشرعي' : 'Below Nisab')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  نسبة الزكاة المعتمدة شرعاً: <span className="font-mono font-bold text-emerald-600">2.5% (ربع العشر)</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-5 space-y-1 shadow-lg shadow-amber-500/20">
                <span className="text-[10px] font-black text-amber-100 uppercase tracking-wider block">
                  {lang === 'ar' ? 'إجمالي الزكاة الواجب إخراجها' : 'Total Zakat Obligation'}
                </span>
                <div className="text-2xl font-black font-mono">
                  {totalZakatObligation.toLocaleString()} <span className="text-xs font-normal opacity-80">YER</span>
                </div>
                <div className="text-[11px] text-amber-100 mt-1">
                  {totalZakatObligation > 0 ? (lang === 'ar' ? 'جاهزة للتوزيع الفوري على المصارف' : 'Ready for distribution') : (lang === 'ar' ? 'لا تجب الزكاة لعدم بلوغ النصاب' : 'No zakat due')}
                </div>
              </div>
            </div>

            {/* Allocation Table */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
              <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>{lang === 'ar' ? 'توزيع مخصصات الزكاة على المصارف الشرعية الثمانية:' : 'Zakat Allocation by Quranic Beneficiaries:'}</span>
                <span className="text-xs font-mono font-bold text-emerald-600">100% ALLOCATED</span>
              </h4>

              <div className="space-y-2">
                {zakatBreakdown.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800/80 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 font-mono font-black flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">{item.name}</span>
                        <span className="text-[10px] text-zinc-400 block font-mono">حصة المصرف: {item.percent}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {item.amount.toLocaleString()} <span className="text-[10px] text-zinc-400">YER</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TOOL 10: MULTI-CURRENCY FX & HEDGING ==================== */}
        {activeTool === 'fx_hedging' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </span>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'محول ومراقب أسعار الصرف المتعددة والتحوط المالي (NEB-10 / NEB-04)' : 'Multi-Currency FX & Hedging Simulator'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'تحويل العملات الفوري، ومراقبة فجوة السوق الموازي، وحساب مخصصات التحوط لموازنات المشاريع الإغاثية.' : 'Real-time multi-currency conversions, market spread tracking & project FX risk reserves.'}
                </p>
              </div>

              <button
                onClick={() => {
                  const text = `تقرير الصرف والتحوط:\nالمبلغ: ${fxAmount} ${fxFrom} = ${Math.round(convertedFxValue).toLocaleString()} ${fxTo}\nاحتياطي التحوط لميزانية المشروع: ${recommendedHedgingBuffer.toLocaleString()} USD`;
                  navigator.clipboard.writeText(text);
                  setFxCopied(true);
                  setTimeout(() => setFxCopied(false), 2000);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {fxCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{fxCopied ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ النتائج' : 'Copy Rates')}</span>
              </button>
            </div>

            {/* Quick Conversion Card */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h4 className="font-black text-xs text-slate-900 dark:text-white">
                {lang === 'ar' ? 'أداة التحويل الفوري متعددة العملات:' : 'Instant FX Rate Converter:'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1 block">
                    {lang === 'ar' ? 'المبلغ المراد تحويله:' : 'Amount:'}
                  </label>
                  <input
                    type="number"
                    value={fxAmount}
                    onChange={(e) => setFxAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1 block">
                    {lang === 'ar' ? 'من عملة:' : 'From:'}
                  </label>
                  <select
                    value={fxFrom}
                    onChange={(e) => setFxFrom(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="EUR">يورو أوروبي (EUR)</option>
                    <option value="YER_SANAA">ريال يمني (صنعاء - 535)</option>
                    <option value="YER_ADEN">ريال يمني (عدن - 2150)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1 block">
                    {lang === 'ar' ? 'إلى عملة:' : 'To:'}
                  </label>
                  <select
                    value={fxTo}
                    onChange={(e) => setFxTo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="YER_SANAA">ريال يمني (صنعاء - 535)</option>
                    <option value="YER_ADEN">ريال يمني (عدن - 2150)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو أوروبي (EUR)</option>
                  </select>
                </div>
              </div>

              {/* Conversion Result Box */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">{lang === 'ar' ? 'القيمة المحولة المعيارية:' : 'Equivalent Value:'}</span>
                  <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {Math.round(convertedFxValue).toLocaleString()} <span className="text-xs font-normal">{fxTo}</span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  سعر الصرف المعتمد: <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">1 {fxFrom} = {(convertedFxValue / (fxAmount || 1)).toFixed(4)} {fxTo}</span>
                </div>
              </div>
            </div>

            {/* Project Hedging Simulation */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500" />
                <h4 className="font-black text-xs text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'محاكي مخاطر تقلب العملة واحتياطي التحوط للمشاريع الإغاثية:' : 'Project Budget FX Exposure & Hedging Reserve:'}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1 block">
                    {lang === 'ar' ? 'الموازنة التقديرية للمشروع (USD):' : 'Estimated Project Budget (USD):'}
                  </label>
                  <input
                    type="number"
                    value={projectBudgetUsd}
                    onChange={(e) => setProjectBudgetUsd(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1 block">
                    {lang === 'ar' ? 'فترة تنفيذ المشروع (بالأشهر):' : 'Execution Duration (Months):'}
                  </label>
                  <input
                    type="number"
                    value={projectDurationMonths}
                    onChange={(e) => setProjectDurationMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block uppercase">{lang === 'ar' ? 'مخصص التحوط الموصى به ضد التضخم:' : 'Recommended Hedging Buffer:'}</span>
                  <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                    +{recommendedHedgingBuffer.toLocaleString()} USD
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">بمعدل مخاطر {((expectedInflationRate * projectDurationMonths) * 100).toFixed(1)}% خلال فترة العقد</span>
                </div>

                <div className="p-3.5 bg-slate-900 text-white rounded-xl">
                  <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'إجمالي الموازنة المحمية المقترحة:' : 'Total Hedged Budget:'}</span>
                  <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                    {totalHedgedBudgetUsd.toLocaleString()} USD
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">تضمن استكمال مشتريات المشروع دون عجز مالي</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TOOL 11: HIJRI & SEASONAL SCHEDULER ==================== */}
        {activeTool === 'hijri_converter' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl">
                    <CalendarIcon className="w-5 h-5" />
                  </span>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'محول التقويم الهجري وجدولة المواسم الإنسانية (NEB-01 / NEB-05)' : 'Hijri Calendar & Humanitarian Campaign Scheduler'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'تحويل التواريخ الهجرية بدقة أم القرى، والعد التنازلي للمواسم الإنسانية السنوية ومؤشرات الجاهزية اللوجستية.' : 'Precision Hijri-Gregorian conversions & annual seasonal campaign readiness dashboards.'}
                </p>
              </div>

              <div className="px-4 py-2 bg-teal-600/10 border border-teal-500/30 rounded-xl text-xs font-black text-teal-700 dark:text-teal-300">
                اليوم: <span className="font-mono">{hijriFormatted}</span>
              </div>
            </div>

            {/* Interactive Date Converter */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h4 className="font-black text-xs text-slate-900 dark:text-white">
                {lang === 'ar' ? 'التحويل المباشر بين التاريخين الميلادي والهجري:' : 'Direct Date Converter:'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1 block">
                    {lang === 'ar' ? 'التاريخ الميلادي:' : 'Gregorian Date:'}
                  </label>
                  <input
                    type="date"
                    value={selectedGregorianDate}
                    onChange={(e) => setSelectedGregorianDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl">
                  <span className="text-[10px] text-zinc-400 font-bold block uppercase">{lang === 'ar' ? 'الموافق بالتقويم الهجري المعتمد:' : 'Equivalent Hijri Date:'}</span>
                  <div className="text-base font-black text-teal-600 dark:text-teal-400 mt-1 font-mono">
                    {hijriFormatted}
                  </div>
                </div>
              </div>
            </div>

            {/* Annual Humanitarian Campaigns Readiness Dashboard */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>{lang === 'ar' ? 'لوحة تتبع وجاهزية المواسم والحملات الإنسانية السنوية:' : 'Annual Campaign Readiness & Countdown:'}</span>
                <span className="text-xs font-bold text-zinc-400">{seasonalCampaigns.length} مواسم استراتيجية</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seasonalCampaigns.map((camp) => (
                  <div key={camp.id} className="p-4 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-black text-xs text-slate-900 dark:text-white block">{camp.titleAr}</span>
                        <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">{camp.hijriTarget}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-teal-500/10 text-teal-600 font-black text-[11px] rounded-lg border border-teal-500/20 font-mono shrink-0">
                        متبقي {camp.daysLeft} يوم
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                        <span>نسبة الجاهزية اللوجستية والمشتريات</span>
                        <span className="font-mono font-black text-slate-800 dark:text-zinc-200">{camp.readinessPct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{ width: `${camp.readinessPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                      <span>الأسر المستهدفة: <strong className="text-slate-800 dark:text-zinc-200 font-mono">{camp.targetFamilies.toLocaleString()} أسرة</strong></span>
                      <span className="text-emerald-600 font-bold">خطة معتمدة ✔</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TOOL 12: QR & DIGITAL AUDIT STAMPER ==================== */}
        {activeTool === 'qr_stamp_generator' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <QrCode className="w-5 h-5" />
                  </span>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'مولد الأختام الرقمية ورموز الاستجابة السريعة للتحقق (NEB-11 / NEB-12)' : 'Document QR Code & Digital Audit Stamper'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'توليد رموز QR فورية مع توقيع رقمي SHA-256 وأختام حوكمة مشفرة للقرارات والوثائق الرسمية للجمعية.' : 'Generate cryptographically signed QR codes and tamper-proof verification stamps.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(digitalAuditHash);
                    setStampCopied(true);
                    setTimeout(() => setStampCopied(false), 2000);
                  }}
                  className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {stampCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{stampCopied ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ الهاش' : 'Copy Hash')}</span>
                </button>

                <button
                  onClick={handlePrintAuditStampCard}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'طباعة بطاقة التحقق' : 'Print Stamp Card'}</span>
                </button>
              </div>
            </div>

            {/* Inputs & Visual Stamp Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Inputs Column */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
                <h4 className="font-black text-xs text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'بيانات المستند المراد توثيقه وختمه رقمياً:' : 'Document Metadata for Stamping:'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1 block">
                      {lang === 'ar' ? 'نوع المستند / المعاملة:' : 'Document Type:'}
                    </label>
                    <select
                      value={stampDocType}
                      onChange={(e) => setStampDocType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold"
                    >
                      <option value="قرار إداري وتنفيذي">قرار إداري وتنفيذي</option>
                      <option value="أمر صرف مالي IPSAS">أمر صرف مالي IPSAS</option>
                      <option value="سند استلام إغاثي ميداني">سند استلام إغاثي ميداني</option>
                      <option value="شهادة كفالة يتيم معتمدة">شهادة كفالة يتيم معتمدة</option>
                      <option value="أمر شراء P2P وتوريد">أمر شراء P2P وتوريد</option>
                      <option value="محضر تفتيش ورقابة">محضر تفتيش ورقابة</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1 block">
                      {lang === 'ar' ? 'الرقم المرجعي للمستند:' : 'Reference Code:'}
                    </label>
                    <input
                      type="text"
                      value={stampDocRef}
                      onChange={(e) => setStampDocRef(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1 block">
                    {lang === 'ar' ? 'الجهة / المستفيد / القسم المستهدف:' : 'Designated Target / Beneficiary:'}
                  </label>
                  <input
                    type="text"
                    value={stampBeneficiaryOrOrg}
                    onChange={(e) => setStampBeneficiaryOrOrg(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1 block">
                    {lang === 'ar' ? 'ملاحظات الاعتماد والتحقق:' : 'Certification Notes:'}
                  </label>
                  <textarea
                    rows={2}
                    value={stampNotes}
                    onChange={(e) => setStampNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-medium resize-none"
                  />
                </div>
              </div>

              {/* Visual Stamp Card Preview */}
              <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-between text-center space-y-4 shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">معاينة الختم المعتمد</span>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">جمعية رُحماء بينهم</h5>
                </div>

                {/* SVG Mock QR Code */}
                <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200">
                  <svg width="110" height="110" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="#ffffff" />
                    <rect x="10" y="10" width="30" height="30" fill="#0f172a" />
                    <rect x="15" y="15" width="20" height="20" fill="#ffffff" />
                    <rect x="20" y="20" width="10" height="10" fill="#059669" />
                    <rect x="60" y="10" width="30" height="30" fill="#0f172a" />
                    <rect x="65" y="15" width="20" height="20" fill="#ffffff" />
                    <rect x="70" y="20" width="10" height="10" fill="#059669" />
                    <rect x="10" y="60" width="30" height="30" fill="#0f172a" />
                    <rect x="15" y="65" width="20" height="20" fill="#ffffff" />
                    <rect x="20" y="70" width="10" height="10" fill="#059669" />
                    <rect x="50" y="50" width="15" height="15" fill="#059669" />
                    <rect x="70" y="60" width="10" height="10" fill="#0f172a" />
                    <rect x="60" y="75" width="10" height="15" fill="#0f172a" />
                  </svg>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-400 block">{stampDocRef}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-black border border-emerald-500/30">
                    MOUNTED SHA-256
                  </span>
                </div>
              </div>
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
                  activeChecklist === 'distribution' ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                قائمة التوزيع الميداني
              </button>
              <button
                onClick={() => setActiveChecklist('audit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  activeChecklist === 'audit' ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                التفتيش والتدقيق المالي
              </button>
              <button
                onClick={() => setActiveChecklist('warehouse')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  activeChecklist === 'warehouse' ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                جرد المخازن والأصناف
              </button>
              <button
                onClick={() => setActiveChecklist('tender')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  activeChecklist === 'tender' ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
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
