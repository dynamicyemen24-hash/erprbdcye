import React, { useState } from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  FileText, 
  Heart, 
  Briefcase, 
  Coins, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  UserCheck, 
  Compass, 
  Bot, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Building,
  Activity,
  Award,
  Zap
} from 'lucide-react';

interface OperationalScenariosViewProps {
  lang: 'ar' | 'en';
  onNavigate?: (tab: string) => void;
}

export interface ScenarioStep {
  stepNumber: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  roleAr: string;
  roleEn: string;
  inputsAr: string[];
  inputsEn: string[];
  systemActionsAr: string[];
  systemActionsEn: string[];
  outputAr: string;
  outputEn: string;
  auditRuleAr: string;
  auditRuleEn: string;
}

export interface OperationalScenario {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  category: 'welfare' | 'finance' | 'projects' | 'relief' | 'governance' | 'procurement' | 'fundraising' | 'analytics';
  descriptionAr: string;
  descriptionEn: string;
  targetTab: string;
  estimatedDurationAr: string;
  estimatedDurationEn: string;
  responsibleRolesAr: string[];
  responsibleRolesEn: string[];
  kpiMetricsAr: string[];
  kpiMetricsEn: string[];
  aiIntegrationAr: string;
  aiIntegrationEn: string;
  steps: ScenarioStep[];
}

export default function OperationalScenariosView({ lang, onNavigate }: OperationalScenariosViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('SCENARIO-01');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const scenarios: OperationalScenario[] = [
    {
      id: 'SCENARIO-01',
      code: 'EOWP-01',
      titleAr: 'دورة حياة كفالة اليتيم والرعاية الاجتماعية',
      titleEn: 'Orphan Sponsorship & Family Welfare Lifecycle',
      category: 'welfare',
      descriptionAr: 'سيناريو تشغيلي كامل تبدأ من التقديم الاجتماعي الميداني وحصر الاحتياج لربط الكفيل باليتيم ثم تحصيل المبلغ وصرف المخصص الشهري وصولاً لإصدار تقرير الأثر الدعمي.',
      descriptionEn: 'End-to-end operational playbook starting from field assessment, orphan onboarding, sponsor matching, stipend collection & distribution, to annual impact reporting.',
      targetTab: 'sponsorships',
      estimatedDurationAr: 'شهرياً / متكرر',
      estimatedDurationEn: 'Monthly / Recurring',
      responsibleRolesAr: ['منسق الرعاية الاجتماعية', 'المدير المالي', 'مشرف الكفالات'],
      responsibleRolesEn: ['Social Welfare Officer', 'Finance Manager', 'Sponsorship Supervisor'],
      kpiMetricsAr: ['نسبة انتظام التسليم الشهري 100%', 'زمن ربط الكفيل باليتيم < 48 ساعة', 'رضا الكفيل والأسرة الكافلة'],
      kpiMetricsEn: ['100% On-time Monthly Stipend', 'Sponsor Match Time < 48h', 'Sponsor & Family Satisfaction Score'],
      aiIntegrationAr: 'تقييم الذكاء الاصطناعي لدرجة الأولوية الاجتماعية واقتراح الكفيل المناسب بناءً على التفضيلات الجغرافية والتكلفة.',
      aiIntegrationEn: 'AI priority scoring for social needs and smart sponsor-orphan matching based on preferences and geography.',
      steps: [
        {
          stepNumber: 1,
          titleAr: 'الدراسة الاجتماعية وتسجيل اليتيم في السجل الموحد',
          titleEn: 'Field Social Assessment & Orphan Onboarding',
          descriptionAr: 'يقوم الباحث الميداني بإدخال بيانات اليتيم والأسرة والدراسة الميدانية ومستوى الاحتياج ومنع التكرار برقم الهوية.',
          descriptionEn: 'Field worker inputs orphan and family demographics, social study metrics, and verifies uniqueness via National ID.',
          roleAr: 'باحث ميداني / منسق كفالات',
          roleEn: 'Field Researcher / Sponsorship Officer',
          inputsAr: ['بطاقة العائلة / شهادة الوفاة', 'بيانات السكن والدخل', 'التقرير الطبي والتصوير'],
          inputsEn: ['Family ID / Death Certificate', 'Housing & Income Data', 'Medical Report & Photo'],
          systemActionsAr: ['التحقق التلقائي من عدم وجود سجل مكرر', 'حساب مؤشر الفقر والاستحقاق الآلي', 'إنشاء ملف المستفيد الموحد'],
          systemActionsEn: ['Auto-deduplication check', 'Calculate automated poverty & eligibility index', 'Create unified beneficiary profile'],
          outputAr: 'ملف يتيم مكتمل ومطابق مع رمز ID موحد',
          outputEn: 'Verified orphan record with unique ID',
          auditRuleAr: 'تسجيل قيد إنشاء مستفيد جديد برقم الباحث والوقت.',
          auditRuleEn: 'Audit log entry created with researcher ID & timestamp.'
        },
        {
          stepNumber: 2,
          titleAr: 'ربط الكفيل وتوثيق عقد الكفالة',
          titleEn: 'Sponsor Matching & Sponsorship Commitment',
          descriptionAr: 'تسجيل الكفيل في المنظومة وربطه باليتيم المحدد، وتحديد مبلغ الكفالة ودورية السداد (شهري / سنوي).',
          descriptionEn: 'Register sponsor in ERP, match with selected orphan, and set monthly/annual payment terms.',
          roleAr: 'مشرف الكفالات / العلاقات العامة',
          roleEn: 'Sponsorship Supervisor / PR Officer',
          inputsAr: ['بيانات الكفيل والتواصل', 'مبلغ الكفالة والعملة (USD/YER/SAR)', 'طريقة الدفع الفضلى'],
          inputsEn: ['Sponsor Contact Info', 'Sponsorship Amount & Currency', 'Preferred Payment Channel'],
          systemActionsAr: ['إنشاء سجل الكفالة وربط المعرفات', 'توليد جدول الاستحقاق الدوري', 'إرسال بطاقة الكفالة الإلكترونية للكفيل'],
          systemActionsEn: ['Create sponsorship binding', 'Generate recurring payment schedule', 'Issue digital sponsorship card'],
          outputAr: 'عقد كفالة مفعل وسند ربط رسمي',
          outputEn: 'Active sponsorship contract and binding pledge',
          auditRuleAr: 'تسجيل قيد الربط وتثبيت القيمة المالية في سجل العقود.',
          auditRuleEn: 'Audit log entry binding sponsor ID to orphan ID.'
        },
        {
          stepNumber: 3,
          titleAr: 'تحصيل مبلغ التبرع وإصدار سند القبض المحاسبي',
          titleEn: 'Contribution Collection & Official Receipt Generation',
          descriptionAr: 'إدخال القسط المالي وتوليد سند قبض إلكتروني آلي مع توجيه الحساب لصندوق الكفالات المعتمد.',
          descriptionEn: 'Record incoming sponsorship funds, issue auto-numbered digital receipt, and credit the designated orphan fund ledger.',
          roleAr: 'المحاسب المالي / مسؤول الخزينة',
          roleEn: 'Financial Accountant / Treasurer',
          inputsAr: ['إشعار التحويل البنكي / الإيداع', 'رقم الكفالة المرجعي'],
          inputsEn: ['Bank Transfer Slip / Deposit Slip', 'Sponsorship Reference ID'],
          systemActionsAr: ['إنشاء قيد محاسبي مزدوج تلقائي (من حـ/ البنك إلى حـ/ إيرادات كفالات)', 'إرسال إشعار استلام آلي للكفيل بالواتساب/الإيميل'],
          systemActionsEn: ['Auto double-entry ledger posting (Bank Dr / Sponsorship Revenue Cr)', 'Send automated receipt to sponsor'],
          outputAr: 'سند قبض معتمد رقمياً وقيد محاسبي مرحل',
          outputEn: 'Approved digital receipt and posted ledger entry',
          auditRuleAr: 'قيد محاسبي غير قابل للتعديل مسجل برقم المحاسب.',
          auditRuleEn: 'Immutable accounting entry tagged with accountant ID.'
        },
        {
          stepNumber: 4,
          titleAr: 'صرف المخصص الشهري لولي أمر اليتيم',
          titleEn: 'Monthly Stipend Disbursement to Guardian',
          descriptionAr: 'تجهيز كشف الصرف المعتمد، وتفريغ المستحقات عبر الحوالات المباشرة أو الصرف النقدي مع توثيق التوقيع/البصمة.',
          descriptionEn: 'Prepare approved disbursement roster, execute payment via remittance or cash with digital signature/fingerprint verification.',
          roleAr: 'منسق الصرف / مسؤول الخزينة',
          roleEn: 'Disbursement Officer / Cashier',
          inputsAr: ['كشف المستحقين المعتمد', 'هوية ولي الأمر الإلكترونية'],
          inputsEn: ['Approved Beneficiary Roster', 'Guardian Digital Identification'],
          systemActionsAr: ['تخصيص المبالغ من حـ/ كفالات الأيتام إلى حـ/ المستفيد', 'إغلاق القسط الشهري لليتيم وتأكيد الاستلام'],
          systemActionsEn: ['Deduct fund balance to beneficiary payout', 'Close monthly payout period for orphan'],
          outputAr: 'سند صرف إلكتروني معتمد مع إثبات التسليم',
          outputEn: 'Approved disbursement slip with delivery proof',
          auditRuleAr: 'ربط رقم سند الصرف بكشف التوزيع ورقم الهوية.',
          auditRuleEn: 'Link payout slip number to roster and guardian ID.'
        },
        {
          stepNumber: 5,
          titleAr: 'التقييم الاجتماعي والصحي الدوري وإصدار تقرير الأثر',
          titleEn: 'Periodic Social Evaluation & Annual Impact Report',
          descriptionAr: 'تحديث بيانات اليتيم التعليمية والصحية بصفة دورية وتوليد تقرير الأثر الشامل الموجه للكفيل.',
          descriptionEn: 'Update orphan academic & health milestones and generate annual impact report for the sponsor.',
          roleAr: 'باحث ميداني / مسئول العلاقات العامة',
          roleEn: 'Field Researcher / Donor Relations',
          inputsAr: ['الشهادة المدرسية / تقرير التفوق', 'التقرير الطبي السنوي', 'صورة حديثة لليتيم'],
          inputsEn: ['School Report Card', 'Annual Health Assessment', 'Recent Orphan Photo'],
          systemActionsAr: ['توليد تقرير الأثر التلقائي بصيغة PDF', 'إرسال التقرير لبريد الكفيل وتحديث ملف اليتيم'],
          systemActionsEn: ['Generate PDF impact report via template', 'Auto-email report to sponsor & attach to profile'],
          outputAr: 'تقرير أثر سنوي فاخر ومحدث في المنظومة',
          outputEn: 'Custom annual impact report sent & archived',
          auditRuleAr: 'تاريخ تحديث ملف اليتيم وتثبيت تقرير الأثر.',
          auditRuleEn: 'Log update event with attached impact documentation.'
        }
      ]
    },
    {
      id: 'SCENARIO-02',
      code: 'EOWP-02',
      titleAr: 'دورة حملات الإغاثة والتوزيع الميداني الطارئ',
      titleEn: 'Emergency Relief Campaign & Field Distribution Playbook',
      category: 'relief',
      descriptionAr: 'سيناريو التخطيط والتنفيذ الميداني للحملات الإغاثية (سلال غذائية، وجبات مطابخ، مياه، إيواء) وتوثيق الموقع الميداني GPS والاستلام الإلكتروني.',
      descriptionEn: 'Comprehensive field playbook for emergency relief campaigns (food baskets, kitchen meals, water, shelter) with GPS verification and offline e-signatures.',
      targetTab: 'activities',
      estimatedDurationAr: '3 - 7 أيام',
      estimatedDurationEn: '3 - 7 Days',
      responsibleRolesAr: ['مدير العمليات الميدانية', 'منسق المشاريع الإغاثية', 'فريق التوزيع الميداني'],
      responsibleRolesEn: ['Field Operations Manager', 'Relief Project Coordinator', 'Distribution Field Team'],
      kpiMetricsAr: ['دقة التوزيع الميداني 100%', 'التغطية الميدانية في الوقت المحدد', 'انعدام الازدواجية في الاستلام'],
      kpiMetricsEn: ['100% Distribution Accuracy', 'On-time Geographic Coverage', 'Zero Beneficiary Double-dipping'],
      aiIntegrationAr: 'توقع حجم السلال المطلوب بناءً على عدد أفراد الأسرة وتحليل صور التوزيع عبر Gemini لمعاينة الجودة.',
      aiIntegrationEn: 'AI forecasting for food basket volume and automated visual distribution verification via Gemini AI.',
      steps: [
        {
          stepNumber: 1,
          titleAr: 'إطلاق المبادرة الإغاثية وتحديد النطاق الجغرافي',
          titleEn: 'Relief Campaign Launch & Geo-Targeting',
          descriptionAr: 'إنشاء مشروع إغاثي جديد تحت برنامج الطوارئ، وتحديد المنطقة المستهدفة والميزانية الإجمالية وعدد السلال.',
          descriptionEn: 'Create emergency relief project under emergency program, set target zone, total budget, and basket counts.',
          roleAr: 'مدير البرامج والمشاريع',
          roleEn: 'Programs & Projects Director',
          inputsAr: ['تقييم الاحتياج الميداني', 'الميزانية المخصصة من المنحة', 'قائمة القرى / المخيمات المستهدفة'],
          inputsEn: ['Needs Assessment Report', 'Allocated Grant Budget', 'Target Camp / Village Roster'],
          systemActionsAr: ['إنشاء بطاقة المشروع وتثبيت WBS', 'حجز الميزانية في شجرة الحسابات', 'تحديد موعد الجدولة الميدانية'],
          systemActionsEn: ['Create project card with WBS', 'Encumber budget in chart of accounts', 'Schedule field activities'],
          outputAr: 'مشروع إغاثي معتمد وجاهز للتنفيذ',
          outputEn: 'Approved & budgeted relief project',
          auditRuleAr: 'اعتماد المشروع وتخصيص الميزانية بسجل الحوكمة.',
          auditRuleEn: 'Approval logged with encumbered budget limit.'
        },
        {
          stepNumber: 2,
          titleAr: 'حصر وقوائم المستفيدين والتحقق من عدم الازدواجية',
          titleEn: 'Beneficiary Census & Deduplication Check',
          descriptionAr: 'استخراج قائمة الأسر المستحقة المعتمدة للمنطقة وتدقيقها مع قاعدة البيانات المركزية لمنع استلام ذات الأسرة مرتين.',
          descriptionEn: 'Filter eligible families for the zone and cross-check against central database to prevent duplicate distribution.',
          roleAr: 'مسؤول بيانات المستفيدين',
          roleEn: 'Beneficiary Data Specialist',
          inputsAr: ['السجل المركزي للمستفيدين', 'كشوفات التنسيق المحلي'],
          inputsEn: ['Central Beneficiary Registry', 'Local Committee Roster'],
          systemActionsAr: ['تطبيق خوارزمية الفرز والتأكد من شروط الاستحقاق', 'إصدار كرت التوزيع الإلكتروني / الكيوآر كود QR'],
          systemActionsEn: ['Execute eligibility sorting algorithm', 'Issue unique digital distribution passes / QR codes'],
          outputAr: 'كشف توزيع نهائي معتمد ومكود',
          outputEn: 'Verified & coded final distribution roster',
          auditRuleAr: 'تثبيت كشف التوزيع برقم إصدار مرجعي.',
          auditRuleEn: 'Freeze distribution list with immutable version number.'
        },
        {
          stepNumber: 3,
          titleAr: 'التوزيع الميداني وتوثيق GPS والتوقيع الرقمي',
          titleEn: 'Field Distribution, GPS Geo-fencing & E-Signature',
          descriptionAr: 'تنفيذ عملية التوزيع الميداني عبر الأجهزة اللوحية/الهواتف وتوثيق الإحداثيات والتوقيع أو البار코드 مع العمل بدون اتصال.',
          descriptionEn: 'Execute field distribution using mobile tablets, log GPS coordinates, and capture digital signatures even in offline mode.',
          roleAr: 'فريق التوزيع الميداني',
          roleEn: 'Field Distribution Team',
          inputsAr: ['تطبيق ERP الميداني', 'البارکود الخاص بالمستفيد'],
          inputsEn: ['ERP Mobile App', 'Beneficiary QR Code'],
          systemActionsAr: ['مسح الكود وتوثيق موقع التوزيع GPS', 'التقاط التوقيع الرقمي وصورة الاستلام', 'المزامنة السحابية الفورية'],
          systemActionsEn: ['Scan QR & log GPS coordinates', 'Capture e-signature & proof of delivery', 'Instant cloud data sync'],
          outputAr: 'سجل استلام توثيقي دقيق ومزامن',
          outputEn: 'Real-time verified delivery receipt',
          auditRuleAr: 'حفظ الإحداثيات والتوقيع في قيد السجل الميداني.',
          auditRuleEn: 'Store GPS stamp and signature hash in activity audit.'
        },
        {
          stepNumber: 4,
          titleAr: 'التسوية المالية ومسح الفواتير بالذكاء الاصطناعي',
          titleEn: 'Financial Settlement & Gemini AI Invoice Scanning',
          descriptionAr: 'رفع فواتير شراء المواد الغذائية والنقل عبر مساح الفواتير الذكي Gemini لتوليد القيود المحاسبية التلقائية.',
          descriptionEn: 'Upload supplier and transport invoices via Gemini AI Scanner to generate multi-item double-entry journal postings.',
          roleAr: 'المحاسب المالي',
          roleEn: 'Financial Accountant',
          inputsAr: ['صور فواتير الموردين والجمالون', 'عقد الشراء المسبق'],
          inputsEn: ['Supplier & Logistics Invoices', 'Pre-approved Purchase Contract'],
          systemActionsAr: ['استخراج البيانات بالفوتو-ذكاء Gemini AI', 'إنشاء قيد التسوية المحاسبي التلقائي', 'خصم القيمة من ميزانية المشروع'],
          systemActionsEn: ['Gemini AI OCR & data extraction', 'Auto-generate settlement journal voucher', 'Post expense against project budget'],
          outputAr: 'قيد محاسبي معتمد وإغلاق سند العهدة',
          outputEn: 'Approved expense voucher and cleared advance',
          auditRuleAr: 'ربط قيد المصروف برقم مشروع الإغاثة وتوثيق الفاتورة.',
          auditRuleEn: 'Link ledger expense to project ID and invoice photo.'
        }
      ]
    },
    {
      id: 'SCENARIO-03',
      code: 'EOWP-03',
      titleAr: 'إجراءات صرف المنحة والتنفيذ المالي المزدوج',
      titleEn: 'Grant Disbursement & Financial Execution Playbook',
      category: 'finance',
      descriptionAr: 'خطوات اعتماد الصرف المالي وإدارة موازنة المشاريع مع تطبيق القيد المحاسبي المزدوج ومصفوفة الاعتمادات بحسب الصلاحيات.',
      descriptionEn: 'Financial control workflow for grant disbursement, project budget encumbrance, approval matrix routing, and multi-currency ledger entries.',
      targetTab: 'finance',
      estimatedDurationAr: '24 - 48 ساعة',
      estimatedDurationEn: '24 - 48 Hours',
      responsibleRolesAr: ['مدير المشروع', 'المحاسب المالي', 'المدير المالي التنفيذي'],
      responsibleRolesEn: ['Project Manager', 'Financial Accountant', 'Chief Financial Officer'],
      kpiMetricsAr: ['زمن دورة اعتماد الصرف < 24 ساعة', 'دقة القيود المحاسبية 100%', 'الالتزام التام بحدود الميزانية'],
      kpiMetricsEn: ['Approval Turnaround < 24h', '100% Ledger Accuracy', 'Zero Budget Overrun'],
      aiIntegrationAr: 'فحص الذكاء الاصطناعي لمطابقة أسعار الفاتورة مع أسعار السوق والتأكد من عدم وجود تكرار في السندات.',
      aiIntegrationEn: 'AI market price benchmark verification and automated duplicate invoice detection.',
      steps: [
        {
          stepNumber: 1,
          titleAr: 'تقديم طلب الصرف المالي وربطه بمركز التكلفة',
          titleEn: 'Disbursement Request & Cost-Center Encumbrance',
          descriptionAr: 'يقوم مدير المشروع برفع طلب صرف مالي محدد الغرض والمرتكز على بند الميزانية المعتمد في المشروع.',
          descriptionEn: 'Project manager submits payment request mapped to specific WBS line item and cost center.',
          roleAr: 'مدير المشروع الميداني',
          roleEn: 'Field Project Manager',
          inputsAr: ['طلب الصرف المالي', 'الفاتورة أو العروض السعرية', 'بند الميزانية المخصص'],
          inputsEn: ['Payment Requisition Form', 'Invoices / Price Quotes', 'Allocated Budget Line Item'],
          systemActionsAr: ['فحص توفر الرصيد في بند المشروع', 'حجز المبلغ مؤقتاً لحين الاعتماد', 'توجيه الطلب لسلسلة الموافقات'],
          systemActionsEn: ['Verify budget availability in line item', 'Encumber requested funds', 'Route request to approval chain'],
          outputAr: 'طلب صرف مالي مؤطر ومحجوز الميزانية',
          outputEn: 'Encumbered payment requisition card',
          auditRuleAr: 'تسجيل قيد طلب الصرف برقم طلب فريد.',
          auditRuleEn: 'Log payment request creation event with unique Ref ID.'
        },
        {
          stepNumber: 2,
          titleAr: 'المراجعة المحاسبية ومسح المرفقات بالذكاء الاصطناعي',
          titleEn: 'Accounting Review & Gemini AI Document Audit',
          descriptionAr: 'يقوم المحاسب بمراجعة السندات المستندية واستخدام Gemini AI لمطابقة الفاتورة مع كشوف الاستلام.',
          descriptionEn: 'Accountant audits supporting documents using Gemini AI to cross-reference invoice with delivery notes.',
          roleAr: 'محاسب المشاريع والاعتمادات',
          roleEn: 'Projects Accountant',
          inputsAr: ['المستندات المؤيدة للصرف', 'نتائج الفحص الذكي Gemini AI'],
          inputsEn: ['Supporting Receipts & Vouchers', 'Gemini AI Document Extraction Result'],
          systemActionsAr: ['مطابقة البيانات الحسابية مع الضوابط', 'تجهيز القيد المحاسبي المزدوج المقترح', 'تزكية الطلب للمدير المالي'],
          systemActionsEn: ['Cross-check line items against limits', 'Draft proposed double-entry voucher', 'Endorse request to CFO'],
          outputAr: 'قيد محاسبي مقترح ومعتمد من المحاسب',
          outputEn: 'Audited & drafted journal voucher',
          auditRuleAr: 'توثيق نتيجة المراجعة المحاسبية ورقم التزكية.',
          auditRuleEn: 'Log accounting verification & endorsement note.'
        },
        {
          stepNumber: 3,
          titleAr: 'الاعتماد النهائي من المدير المالي وصرف المبلغ',
          titleEn: 'Executive CFO Approval & Bank Disbursement',
          descriptionAr: 'اعتماد الطلب وفق مصفوفة الحوكمة، وإرسال أمر الدفع للبنك أو الصندوق وتوثيق المعاملة.',
          descriptionEn: 'Executive sign-off per approval matrix, dispatching payment instruction to bank/treasury and executing payout.',
          roleAr: 'المدير المالي والتنفيذي',
          roleEn: 'Chief Financial Officer / Executive Director',
          inputsAr: ['ملف طلب الصرف المعاين', 'قيد اليومية المقترح'],
          inputsEn: ['Audited Payment Dossier', 'Proposed Journal Voucher'],
          systemActionsAr: ['التوقيع الرقمي للطلب وتفعيل القيد', 'ترحيل القيد المزدوج نهائياً للدليل المحاسبي', 'تحديث رصيد المشروع الفعلي'],
          systemActionsEn: ['Digital executive signature', 'Post double-entry voucher to general ledger', 'Update actual project burn rate'],
          outputAr: 'سند صرف معتمد ومرحل بالكامل',
          outputEn: 'Fully executed & posted disbursement slip',
          auditRuleAr: 'تثبيت قيد الحوكمة مع اسم المعتمد النهائي والوقت.',
          auditRuleEn: 'Immutable approval record with executive user hash.'
        }
      ]
    },
    {
      id: 'SCENARIO-04',
      code: 'EOWP-04',
      titleAr: 'إغلاق المشروع، قياس الأثر والأرشفة المعرفية',
      titleEn: 'Project Closeout, Impact Audit & Knowledge Archive',
      category: 'governance',
      descriptionAr: 'خطوات إغلاق المشروع الميداني والمالي بعد اكتمال جميع الأنشطة، وتسوية كافة الحسابات واستخراج تقرير الأثر الميداني وحفظ الدروس المستفادة.',
      descriptionEn: 'Structured procedures for operational and financial project closeout, final account reconciliation, impact quantification, and knowledge base archiving.',
      targetTab: 'projects',
      estimatedDurationAr: '3 - 5 أيام',
      estimatedDurationEn: '3 - 5 Days',
      responsibleRolesAr: ['مدير المشروع', 'مسؤول المتابعة والتقييم MEAL', 'المدير المالي'],
      responsibleRolesEn: ['Project Manager', 'MEAL Officer', 'Finance Manager'],
      kpiMetricsAr: ['تسوية مالية بنسبة 100%', 'قياس الأثر الميداني الموثق', 'أرشفة كافة الوثائق بنسبة 100%'],
      kpiMetricsEn: ['100% Financial Reconciliation', 'Quantified Field Impact Index', '100% Document Archival'],
      aiIntegrationAr: 'توليد الذكاء الاصطناعي لملخص الدروس المستفادة وتحليل الفجوات بين الميزانية المخططة والتنفيذ الفعلي.',
      aiIntegrationEn: 'AI generation of lessons learned summary and variance analysis between planned vs actual execution.',
      steps: [
        {
          stepNumber: 1,
          titleAr: 'التحقق من اكتمال الأنشطة وتسليم المخرجات',
          titleEn: 'Activity Completion Verification & WBS Sign-off',
          descriptionAr: 'مراجعة شجرة العمل WBS والتأكد من إغلاق جميع الأنشطة الميدانية وحصر المخرجات والمستفيدين النهائيين.',
          descriptionEn: 'Audit project WBS, verify all field activities are completed, and consolidate final outputs & beneficiary counts.',
          roleAr: 'مسؤول المتابعة والتقييم MEAL',
          roleEn: 'MEAL Specialist',
          inputsAr: ['تقارير إنجاز الأنشطة', 'كشوفات المستفيدين الإجمالية'],
          inputsEn: ['Activity Execution Logs', 'Consolidated Beneficiary Rosters'],
          systemActionsAr: ['فحص حالة الأنشطة تلقائياً', 'توليد مؤشرات الإنجاز الكلية', 'رفع تقرير التحقق الميداني'],
          systemActionsEn: ['Automated activity status check', 'Calculate macro achievement KPIs', 'Submit field verification report'],
          outputAr: 'تقرير التقييم الميداني النهائي معتمد',
          outputEn: 'Final field verification report',
          auditRuleAr: 'إغلاق تعديل الأنشطة ومنع إضافة أنشطة جديدة.',
          auditRuleEn: 'Lock activity status to prevent further modification.'
        },
        {
          stepNumber: 2,
          titleAr: 'التسوية المالية النهائية وإغلاق حساب المشروع',
          titleEn: 'Final Financial Reconciliation & Account Clearance',
          descriptionAr: 'تسوية جميع العهد المالية المعلقة، وحصر المصروفات الفعلية ومطابقتها مع المنحة وإرجاع المبالغ المتبقية إن وجدت.',
          descriptionEn: 'Clear all pending advances, reconcile final expenses against donor grant, and process unspent funds refund if applicable.',
          roleAr: 'المدير المالي',
          roleEn: 'Finance Manager',
          inputsAr: ['دفتر الاستاد العام للمشروع', 'تسوية البنك والعهد'],
          inputsEn: ['Project Ledger Details', 'Bank & Advance Reconciliation Statement'],
          systemActionsAr: ['مطابقة الإيرادات مع المصروفات', 'ترحيل القيود العكسية لتصفية الحساب', 'تحديث حالة الحساب المالي إلى "مغلق"'],
          systemActionsEn: ['Reconcile income vs expenditures', 'Post clearance journal vouchers', 'Mark financial account status as Closed'],
          outputAr: 'بيان الميزانية النهائية المغلقة والمطابقة',
          outputEn: 'Audited & reconciled final financial statement',
          auditRuleAr: 'تثبيت الحسابات المالية للمشروع وقفل الترحيل عليه.',
          auditRuleEn: 'Lock financial ledger for the specific project code.'
        },
        {
          stepNumber: 3,
          titleAr: 'توليد تقرير الأثر المؤسسي والأرشفة في الذاكرة الرقمية',
          titleEn: 'Institutional Impact Report & Knowledge Archiving',
          descriptionAr: 'استخراج تقرير الأثر الموحد الشامل وحفظ كافة الوثائق والعقود في الأرشيف الرقمي للمنظمة.',
          descriptionEn: 'Generate consolidated executive impact report and archive all contracts, receipts, and photos to institutional memory.',
          roleAr: 'مدير الجودة والحوكمة',
          roleEn: 'Quality & Governance Director',
          inputsAr: ['تقرير MEAL', 'القوائم المالية المغلقة', 'التقارير الميدانية المصورة'],
          inputsEn: ['MEAL Report', 'Reconciled Financial Statements', 'Field Photographic Evidence'],
          systemActionsAr: ['توليد تقرير الأثر الموحد الشامل بصيغة A4', 'نقل حالة المشروع إلى "مؤرشف"', 'تغذية قاعدة المعرفة المؤسسية'],
          systemActionsEn: ['Generate A4 executive impact booklet', 'Update project state to Archived', 'Feed organizational knowledge base'],
          outputAr: 'كتيب الأثر المعتمد وأرشيف مرجعي كامل',
          outputEn: 'Approved Impact Booklet & Archived Knowledge Bundle',
          auditRuleAr: 'تثبيت القيد غير القابل للتعديل لأرشفة المشروع بالكامل.',
          auditRuleEn: 'Immutable archive hash entry created for project lifecycle.'
        }
      ]
    },
    {
      id: 'SCENARIO-05',
      code: 'EOWP-05',
      titleAr: 'المعالجة الذكية للفواتير المحاسبية بـ Gemini AI',
      titleEn: 'Gemini AI Smart Invoice OCR & Auto-Ledger Automation',
      category: 'finance',
      descriptionAr: 'سيناريو المعالجة التلقائية للفواتير والايصالات الورقية باستخدام نماذج Gemini AI لاستخراج البيانات وإنشاء القيد المحاسبي المزدوج بضغطة زر.',
      descriptionEn: 'Automated receipt and invoice digitizing using Gemini AI vision models to parse vendors, line items, totals, and generate double-entry journal vouchers.',
      targetTab: 'finance',
      estimatedDurationAr: 'أقل من 30 ثانية',
      estimatedDurationEn: 'Under 30 Seconds',
      responsibleRolesAr: ['المحاسب المالي', 'مدخل البيانات المالي'],
      responsibleRolesEn: ['Financial Accountant', 'Data Entry Clerk'],
      kpiMetricsAr: ['تقليل زمن إدخال الفواتير بنسبة 90%', 'دقة القراءة بالذكاء الاصطناعي > 98%', 'صفر خطأ في نقل الأرقام'],
      kpiMetricsEn: ['90% Reduction in Voucher Creation Time', '>98% OCR Accuracy', 'Zero Manual Transcription Errors'],
      aiIntegrationAr: 'نموذج Gemini 2.5/3 Vision لقراءة الفواتير العربية والإنجليزية المكتوبة يدوياً ومطبوعاً ومطابقتها مع الدليل المحاسبي.',
      aiIntegrationEn: 'Gemini 2.5/3 Vision AI parsing Arabic/English printed and handwritten receipts mapped directly to chart of accounts.',
      steps: [
        {
          stepNumber: 1,
          titleAr: 'رفع صورة الفاتورة أو المستند في النظام',
          titleEn: 'Upload Receipt / Invoice Capture',
          descriptionAr: 'يلتقط المحاسب صورة الفاتورة عبر الهاتف أو يرفع ملف PDF/Image مباشرة في واجهة Gemini AI Scanner.',
          descriptionEn: 'User captures image or uploads PDF invoice directly in the Gemini AI Scanner interface.',
          roleAr: 'المحاسب المالي',
          roleEn: 'Financial Accountant',
          inputsAr: ['صورة الفاتورة أو السند الورقي'],
          inputsEn: ['Paper Invoice / Digital PDF Receipt'],
          systemActionsAr: ['تجهيز الصورة والمعالجة الرقمية الأولية', 'إرسال المستند إلى محرك Gemini AI API'],
          systemActionsEn: ['Image preprocessing & contrast adjustment', 'Secure API call to Gemini AI Vision model'],
          outputAr: 'صورة مرفوعة ومعالجة تقنياً',
          outputEn: 'Preprocessed digital image payload',
          auditRuleAr: 'حفظ صورة المستند وتخزين البصمة الرقمية MD5.',
          auditRuleEn: 'Store uploaded image with MD5 file hash.'
        },
        {
          stepNumber: 2,
          titleAr: 'التحليل الاستخراجي بـ Gemini AI وتصميم القيد المقترح',
          titleEn: 'Gemini AI Extraction & Journal Voucher Proposal',
          descriptionAr: 'يقوم المحرك بقراءة اسم المورد، التاريخ، الإجمالي، الضرائب، والبنود، وتوليد القيد المحاسبي المزدوج المناسب.',
          descriptionEn: 'Gemini AI extracts vendor name, date, total, tax, and line items, matching them to account heads.',
          roleAr: 'محرك Gemini AI / النظام',
          roleEn: 'Gemini AI Engine / System Core',
          inputsAr: ['صورة المستند المرفوعة'],
          inputsEn: ['Preprocessed Image Payload'],
          systemActionsAr: ['استخراج الحقول الهيكلية JSON', 'مطابقة بند المصروف مع شجرة الحسابات', 'توليد القيد المحاسبي المزدوج المقترح'],
          systemActionsEn: ['Structured JSON field extraction', 'Map line items to Chart of Accounts', 'Generate proposed double-entry voucher'],
          outputAr: 'مسودة قيد محاسبي ذكي مع التفاصيل',
          outputEn: 'AI-generated draft journal voucher',
          auditRuleAr: 'تسجيل قيد التحليل الآلي ونسبة ثقة القراءة.',
          auditRuleEn: 'Log AI parsing confidence score and extraction response.'
        },
        {
          stepNumber: 3,
          titleAr: 'مراجعة المحاسب والاعتماد الفوري بضغطة زر',
          titleEn: 'Accountant One-Click Review & Ledger Posting',
          descriptionAr: 'يعاين المحاسب الأرقام المستخرجة، ويضغط "اعتماد القيد" لترحيله فوراً إلى الدفتر العام.',
          descriptionEn: 'Accountant reviews parsed fields side-by-side with receipt, clicks Approve to instantly post to general ledger.',
          roleAr: 'المحاسب المالي المعتمد',
          roleEn: 'Certified Accountant',
          inputsAr: ['القيد المقترح من AI', 'صورة المستند الموازية'],
          inputsEn: ['AI-Drafted Voucher', 'Side-by-Side Image Preview'],
          systemActionsAr: ['تثبيت القيد المزدوج المعتمد', 'تحديث رصيد الصندوق/الجامدة والمشروع', 'تسجيل الحساب في سجل التدقيق'],
          systemActionsEn: ['Post double-entry voucher to DB', 'Update cash/bank and project budget balances', 'Log confirmation event'],
          outputAr: 'قيد محاسبي مرحل ورسمي بالدفتر العام',
          outputEn: 'Fully posted general ledger entry',
          auditRuleAr: 'ربط المعاملة بمعرف المحاسب المعتمد وتاريخ الاعتماد.',
          auditRuleEn: 'Immutable audit log tying AI parsing to accountant ID.'
        }
      ]
    },
    {
      id: 'SCENARIO-06',
      code: 'EOWP-06',
      titleAr: 'دورة المشتريات والمناقصات والعقود الميدانية',
      titleEn: 'Procurement, RFQ Tenders & Supplier Contracting',
      category: 'procurement',
      descriptionAr: 'دورة كاملة لإصدار طلبات الشراء، طرح المناقصات والمزايدات، جمع العروض السعرية وتطبيق تحليل المقارنة الثلاثية لترسية العقد مع المورد.',
      descriptionEn: 'End-to-end procurement cycle covering purchase requisitions, RFQ tenders, 3-way quotation matrix analysis, and supplier contract sign-off.',
      targetTab: 'procurement',
      estimatedDurationAr: '3 - 10 أيام',
      estimatedDurationEn: '3 - 10 Days',
      responsibleRolesAr: ['مسؤول المشتريات', 'لجنة الفحص والترسية', 'المدير المالي'],
      responsibleRolesEn: ['Procurement Officer', 'Tender Evaluation Committee', 'Finance Director'],
      kpiMetricsAr: ['توفير متوسط 12% في أسعار التوريد', 'شفافية كاملة في تحليل 3 عروض', 'دورة الترسية < 5 أيام'],
      kpiMetricsEn: ['12% Average Cost Savings', '100% Transparency in 3-Way Bidding', 'Tender Turnaround < 5 Days'],
      aiIntegrationAr: 'المقارنة الآلية بالذكاء الاصطناعي بين عروض الأسعار واكتشاف فروقات المواصفات الفنية أو شروط التسليم.',
      aiIntegrationEn: 'AI automated quote matrix comparison and technical specification compliance check.',
      steps: [
        {
          stepNumber: 1,
          titleAr: 'إصدار طلب الشراء وتحديد الجدول الزمني والمواصفات',
          titleEn: 'Purchase Requisition & Technical Specs Standard',
          descriptionAr: 'يرفع منسق المشروع طلب شراء المواد أو الخدمة المطلوبة مبيناً المواصفات الفنية والكميات المطلوبة.',
          descriptionEn: 'Project coordinator issues purchase requisition specifying detailed item parameters, quantities, and delivery timeline.',
          roleAr: 'منسق المشروع / مسؤول المخزون',
          roleEn: 'Project Coordinator / Inventory Specialist',
          inputsAr: ['نموذج طلب الشراء', 'جدول الكميات والتوصيف'],
          inputsEn: ['Purchase Requisition Form', 'Bill of Quantities (BOQ)'],
          systemActionsAr: ['التحقق من توفر الاعتماد المالي', 'حجز الميزانية التقديرية', 'إرسال طلب الشراء لإدارة المشتريات'],
          systemActionsEn: ['Budget encumbrance check', 'Reserve estimated budget allocation', 'Forward PR to Procurement Team'],
          outputAr: 'طلب شراء معتمد ومخصص الميزانية',
          outputEn: 'Approved purchase requisition card',
          auditRuleAr: 'قيد طلب الشراء وتثبيت القيمة التقديرية.',
          auditRuleEn: 'Audit log tying PR number to project WBS budget code.'
        },
        {
          stepNumber: 2,
          titleAr: 'طرح طلب عروض الأسعار (RFQ) والمفاضلة بالذكاء الاصطناعي',
          titleEn: 'RFQ Tender Issuance & AI Quote Comparison Matrix',
          descriptionAr: 'طرح المناقصة للموردين المعتمدين، واستلام العروض وتحليلها عبر مصفوفة المقارنة الثلاثية المعتمدة.',
          descriptionEn: 'Issue RFQ to approved vendors, collect sealed quotes, and run automated 3-way price & spec comparison matrix.',
          roleAr: 'لجنة الفحص والترسية',
          roleEn: 'Tender & Procurement Committee',
          inputsAr: ['عروض الأسعار المكتومة للموردين (3+)'],
          inputsEn: ['Sealed Vendor Bids (3+ Quotes)'],
          systemActionsAr: ['تحليل الأسعار بـ Gemini AI', 'إعداد جدول المقارنة الفنية والمالية', 'تحديد العرض الأفضل سعراً وجودة'],
          systemActionsEn: ['Gemini AI bid extraction', 'Generate 3-way quote comparison table', 'Identify lowest evaluated compliant bidder'],
          outputAr: 'محضر ترسية معتمد من اللجنة',
          outputEn: 'Signed tender award decision memo',
          auditRuleAr: 'تثبيت عروض الأسعار المرفقة لمنع التعديل.',
          auditRuleEn: 'Freeze all submitted quotes with file hashes.'
        },
        {
          stepNumber: 3,
          titleAr: 'توقيع العقد وإصدار أمر الشراء الرسمي (PO)',
          titleEn: 'Contract Execution & Official Purchase Order (PO)',
          descriptionAr: 'توقيع العقد مع المورد الفائز وإصدار أمر شراء معتمد يتضمن جدول التوريد والشروط الجزائية.',
          descriptionEn: 'Execute legal contract with winning vendor and issue official PO with delivery terms and penalty clauses.',
          roleAr: 'مدير المشتريات / الشؤون القانونية',
          roleEn: 'Procurement Director / Legal Officer',
          inputsAr: ['محضر الترسية المعتمد', 'مسودة العقد المعيارية'],
          inputsEn: ['Approved Award Decision', 'Standard Purchase Contract Template'],
          systemActionsAr: ['توليد أمر الشراء بـ PO Number فريد', 'ربط العقد بالمورد وسجل المشتريات', 'إشعار المورد ببدء التوريد'],
          systemActionsEn: ['Generate unique PO number', 'Bind contract to vendor profile & ledger', 'Notify vendor with official PO'],
          outputAr: 'أمر شراء معتمد ومختوم إلكترونياً',
          outputEn: 'Approved digital purchase order',
          auditRuleAr: 'ربط رقم أمر الشراء برقم طلب الشراء والمشروع.',
          auditRuleEn: 'Cross-link PO number to PR and project budget.'
        }
      ]
    },
    {
      id: 'SCENARIO-07',
      code: 'EOWP-07',
      titleAr: 'التبرعات الإلكترونية وتحصيل الإيرادات عبر بوابات الدفع',
      titleEn: 'Multi-Gateway E-Donations & Automated Revenue Recognition',
      category: 'fundraising',
      descriptionAr: 'سيناريو استقبال التبرعات عبر بوابات الدفع الإلكترونية المحلية والدولية (خدمة، الكريمي، جوال بي، Stripe، PayPal) والتأكيد التلقائي لسند القبض.',
      descriptionEn: 'Seamless end-to-end e-donation processing via domestic and international gateways with instant webhook verification and automatic receipt generation.',
      targetTab: 'sales_fundraising',
      estimatedDurationAr: 'فوري / أقل من 5 ثوانٍ',
      estimatedDurationEn: 'Instant / Under 5 Seconds',
      responsibleRolesAr: ['متبرع / مانح', 'مسؤول تنمية الموارد', 'المحاسب المالي'],
      responsibleRolesEn: ['Donor', 'Fundraising Specialist', 'Revenue Accountant'],
      kpiMetricsAr: ['تأكيد التبرع في أقل من 5 ثوانٍ', 'معدل نجاح المعاملات > 99%', 'توليد تلقائي لسند القبض 100%'],
      kpiMetricsEn: ['< 5 Seconds Donation Confirmation', '>99% Transaction Success Rate', '100% Auto-Issued Digital Receipts'],
      aiIntegrationAr: 'التوجيه الذكي للتبرع للصناديق الأكثر احتياجاً وإرسال رسائل شكر مخصصة آلياً بالذكاء الاصطناعي.',
      aiIntegrationEn: 'Smart campaign recommendation and AI-personalized donor thank-you messages.',
      steps: [
        {
          stepNumber: 1,
          titleAr: 'اختيار المشروع/السلة والدفع عبر البوابة الإلكترونية',
          titleEn: 'Donation Campaign Selection & Gateway Checkout',
          descriptionAr: 'يحدد المتبرع المشروع أو السلة الغذائية أو كفالة اليتيم، ويختار بوابة الدفع المناسبة (الكريمي، خدمة، جوال بي، Stripe).',
          descriptionEn: 'Donor selects humanitarian project or sponsorship campaign and chooses preferred gateway (Kuraimi, Khedmah, Jawal Pay, Stripe).',
          roleAr: 'المتبرع / المانح',
          roleEn: 'Donor / Supporter',
          inputsAr: ['المبلغ المالي والعملة', 'تفاصيل المتبرع / المانح', 'البوابة المختارة'],
          inputsEn: ['Donation Amount & Currency', 'Donor Name & Contact', 'Selected Gateway'],
          systemActionsAr: ['توجيه الطلب الآمن عبر API بوابة الدفع', 'توليد المعرف المرجعي للمعاملة TRX-ID'],
          systemActionsEn: ['Secure API dispatch to payment gateway', 'Generate unique donation transaction ID (TRX-ID)'],
          outputAr: 'معاملة دفع قيد المعالجة الآمنة',
          outputEn: 'Processing transaction payload',
          auditRuleAr: 'تسجيل قيد بدء عملية التبرع ورقم الجلسة.',
          auditRuleEn: 'Log donation initiation with session GUID.'
        },
        {
          stepNumber: 2,
          titleAr: 'تأكيد الـ Webhook وتوليد سند القبض الآلي',
          titleEn: 'Webhook Verification & Automatic Receipt Generation',
          descriptionAr: 'تستقبل المنظومة إشعار الـ Webhook الفوري من البوابة، وتؤكد تحصيل المبلغ وترحل القيد لصندوق التبرعات المعتمد.',
          descriptionEn: 'System receives encrypted instant webhook callback, validates payment token, posts revenue ledger entry, and issues digital receipt.',
          roleAr: 'محرك بوابات الدفع / المحاسب الآلي',
          roleEn: 'Payment Gateway Engine / Automated Ledger',
          inputsAr: ['إشعار Webhook المشفر من البوابة'],
          inputsEn: ['Encrypted Webhook Callback Payload'],
          systemActionsAr: ['التحقق من التوقيع الرقمي للبوابة', 'إنشاء قيد محاسبي تلقائي (حـ/ البنك إلى حـ/ إيرادات التبرعات)', 'توليد سند قبض إلكتروني مزود بـ QR Code'],
          systemActionsEn: ['Validate digital signature', 'Post auto journal voucher (Bank Dr / Revenue Cr)', 'Generate QR-coded digital donation receipt'],
          outputAr: 'سند قبض معتمد رقمياً ومرحل بالكامل',
          outputEn: 'Posted donation ledger entry & e-receipt',
          auditRuleAr: 'تثبيت مرجع المعاملة البنكية لمنع تكرار الإشعار.',
          auditRuleEn: 'Idempotency check tying gateway transaction code.'
        }
      ]
    },
    {
      id: 'SCENARIO-08',
      code: 'EOWP-08',
      titleAr: 'التنبؤ المالي واستدامة السيولة بالذكاء الاصطناعي',
      titleEn: 'AI Predictive BI & Sustainability Analytics Engine',
      category: 'analytics',
      descriptionAr: 'تحليل التدفقات المالية المستقبلية لـ 12 شهراً، والتنبؤ بمعدلات تسرب المانحين، وتأثير التضخم المحلي YER على القوة الشرائية.',
      descriptionEn: '12-month forward-looking financial trajectory modeling, donor retention analytics, and YER currency inflation erosion hedging.',
      targetTab: 'reports',
      estimatedDurationAr: 'تحديث آلي مستمر',
      estimatedDurationEn: 'Real-time / Automated Update',
      responsibleRolesAr: ['المدير التنفيذي', 'المدير المالي', 'مدير التخطيط الاستراتيجي'],
      responsibleRolesEn: ['Chief Executive Officer', 'Finance Director', 'Strategic Planning Officer'],
      kpiMetricsAr: ['مؤشر استدامة السيولة > 12 شهراً', 'معدل الاحتفاظ بالمانحين > 88%', 'دقة التنبؤ المالي > 94%'],
      kpiMetricsEn: ['Liquidity Runway > 12 Months', 'Donor Retention > 88%', 'AI Predictive Accuracy > 94%'],
      aiIntegrationAr: 'نماذج التعلم الآلي للتنبؤ بالفجوات المالية واقتراح تعديل خطط الإنفاق لتفادي العجز.',
      aiIntegrationEn: 'Machine learning budget simulation models optimizing expenditure velocity against forecasted donor income.',
      steps: [
        {
          stepNumber: 1,
          titleAr: 'تغذية المحرك التنبؤي بسجلات الإيرادات والمصروفات التاريخية',
          titleEn: 'Historical Ledger Ingestion & Baseline Modeling',
          descriptionAr: 'يقوم المحرك بسحب بيانات 24 شهراً من الدفتر العام وشجرة الحسابات لبناء منحنى التدفقات الدورية.',
          descriptionEn: 'Predictive engine ingests 24 months of general ledger data to construct seasonal baseline cashflow curves.',
          roleAr: 'محرك AI Predictive Engine',
          roleEn: 'AI Predictive Engine Core',
          inputsAr: ['دفتر الاستاد العام', 'سجل التبرعات التاريخي'],
          inputsEn: ['General Ledger Transactions', 'Historical Donor Contribution Roster'],
          systemActionsAr: ['حساب المتوسط المرجح الموزون', 'تحديد نمط التدفقات الموسمية (رمضان، الأضاحي، بداية العام)'],
          systemActionsEn: ['Calculate weighted moving average', 'Identify seasonal inflow spikes (Ramadan, Qurbani)'],
          outputAr: 'نموذج الأساس المالي المحين',
          outputEn: 'Calibrated baseline financial model',
          auditRuleAr: 'تثبيت البصمة الرقمية للنموذج والبيانات المستخدمة.',
          auditRuleEn: 'Log model calibration timestamp and data hash.'
        },
        {
          stepNumber: 2,
          titleAr: 'محاكاة سيناريوهات التمويل واصدار توصيات الاستدامة',
          titleEn: 'Multi-Scenario Simulation & AI Action Recommendations',
          descriptionAr: 'تشغيل محاكاة السيناريوهات الثلاثة (المتوقع، التفاؤلي، المحافظ) وحساب فترة أمان السيولة (Runway).',
          descriptionEn: 'Execute multi-scenario simulation (Expected, Optimistic, Conservative) and calculate liquidity runway in months.',
          roleAr: 'المدير المالي / محرك الذكاء الاصطناعي',
          roleEn: 'Finance Director / Gemini BI Engine',
          inputsAr: ['نموذج الأساس المالي', 'توقعات التضخم المحلية'],
          inputsEn: ['Baseline Model', 'Local Inflation Rate Indices'],
          systemActionsAr: ['توليد رسم مسار التمويل لـ 12 شهراً', 'صياغة التوصيات الذكية لتحوط التضخم وتعزيز الاحتفاظ بالمانحين'],
          systemActionsEn: ['Generate 12-month trajectory forecast chart', 'Synthesize strategic hedging & retention recommendations'],
          outputAr: 'لوحة القيادة التنبؤية واختبارات الضغط المالي',
          outputEn: 'Executive Predictive Dashboard & Stress-Test Suite',
          auditRuleAr: 'حفظ نسخة من التقرير التنبؤي في الأرشيف المالي.',
          auditRuleEn: 'Archive quarterly predictive forecast report.'
        }
      ]
    },
    {
      id: 'SCENARIO-09',
      code: 'EOWP-09',
      titleAr: 'إدارة المشاريع الاستثمارية وتوزيع عوائد الأوقاف التنموية',
      titleEn: 'Endowment Investment Yield & Self-Sustainability Reinvestment Playbook',
      category: 'governance',
      descriptionAr: 'سيناريو معيار موحد لحوكمة أصول الأوقاف والمشاريع الاستثمارية، قياس أثر ROI/IRR، القيد المالي المزدوج وتوجيه العوائد لدعم برامج الإغاثة والرعاية مع حماية أصل الوقف.',
      descriptionEn: 'Standardized operational playbook for governing endowment assets, tracking ROI/IRR yield metrics, enforcing Shariah capital preservation, and routing net yield to relief programs.',
      targetTab: 'investments',
      estimatedDurationAr: 'ربعي / سنوي متكرر',
      estimatedDurationEn: 'Quarterly / Annual Recurring',
      responsibleRolesAr: ['المشرف المالي العام (CFO)', 'مدير الاستثمار والأوقاف', 'المراجع المستقل'],
      responsibleRolesEn: ['Chief Financial Officer', 'Endowment Investment Director', 'Independent Auditor'],
      kpiMetricsAr: ['حفظ أصل الوقف 100%', 'معدل العائد الفعلي ROI > 12.5%', 'تغطية التمويل الذاتي > 35%'],
      kpiMetricsEn: ['100% Capital Preservation', 'Actual ROI > 12.5%', 'Self-Sustainability Coverage > 35%'],
      aiIntegrationAr: 'حساب مصفوفة العائد الاستثماري التلقائي وتحليل المخاطر المالي وفق تقلبات الأسعار والتضخم المحلي.',
      aiIntegrationEn: 'Automated ROI/IRR yield matrix calculation and local currency inflation risk hedging analysis.',
      steps: [
        {
          stepNumber: 1,
          titleAr: 'اعتماد دراسة الجدوى وتحديد أصل الوقف الشرعي',
          titleEn: 'Feasibility Approval & Shariah Capital Lock',
          descriptionAr: 'تقوم لجنة الاستثمار والمشرف المالي العام بدراسة الفرصة الاستثمارية وقيد أصل الوقف بصورة دائمة ومحجوبة عن الاستهلاك.',
          descriptionEn: 'Investment Committee and CFO validate project feasibility, allocate capital, and lock principal endowment asset as non-expendable.',
          roleAr: 'لجنة الاستثمار / المشرف المالي (CFO)',
          roleEn: 'Investment Committee / CFO',
          inputsAr: ['دراسة الجدوى الفنية والمالية', 'صك الوقفية / عقد الأصول'],
          inputsEn: ['Technical Feasibility Study', 'Endowment Constitution Deed'],
          systemActionsAr: ['إنشاء سجل مشروع استثماري بشرط الوقف', 'حظر صرف أصل المبلغ في الميزانية التشغيلية', 'تحديد المستهدفات المالي ROI/IRR'],
          systemActionsEn: ['Register locked endowment asset', 'Block principal capital from operating ledger', 'Set benchmark ROI/IRR target'],
          outputAr: 'مشروع استثماري معتمد ومقفول بشرط الوقف',
          outputEn: 'Approved & locked endowment project record',
          auditRuleAr: 'قيد تثبيت أصل الوقف برقم الصك وتوقيع المشرف المالي.',
          auditRuleEn: 'Audit entry locking endowment capital tied to deed ID.'
        },
        {
          stepNumber: 2,
          titleAr: 'قيد العوائد الإجمالية وحساب صافي الأرباح التشغيلية',
          titleEn: 'Fiscal Yield Ingestion & Net Operating Profit Ledger',
          descriptionAr: 'إدخال الإيرادات التشغيلية الدورية (إيجارات، مبيعات مياه، عوائد صكوك) وخصم المصروفات التشغيلية المباشرة.',
          descriptionEn: 'Log quarterly gross revenues (rentals, water plant sales, sukuk dividends) and subtract direct operating expenses.',
          roleAr: 'مدير الاستثمار / المحاسب المالي',
          roleEn: 'Endowment Investment Director / Accountant',
          inputsAr: ['كشوفات الحسابات البنكية والإيجارية', 'فواتير الصيانة والتشغيل'],
          inputsEn: ['Bank Statements & Lease Logs', 'Op-Ex & Maintenance Invoices'],
          systemActionsAr: ['حساب صافي الربح التشغيلي الآلي', 'قياس العائد الفعلي ROI % مقارنة بالهدف'],
          systemActionsEn: ['Calculate net operating profit', 'Measure actual ROI % against expected baseline'],
          outputAr: 'سجل العوائد الدوري المعتمد',
          outputEn: 'Audited quarterly yield voucher',
          auditRuleAr: 'قيد مطابقة الإيرادات البنكية وفواتير الصيانة.',
          auditRuleEn: 'Cross-verify bank credits against expense vouchers.'
        },
        {
          stepNumber: 3,
          titleAr: 'التوزيع المزدوج للعائد (75% إغاثة / 25% إعادة استثمار)',
          titleEn: 'Dual Yield Distribution (75% Charity / 25% Reinvestment)',
          descriptionAr: 'ترحيل 75% من صافي الربح لتغذية برامج كفالات الأيتام والسلال الغذائية، وتوجيه 25% لصندوق نمو أصل الوقف.',
          descriptionEn: 'Post 75% of net yield to active orphan welfare & food aid budgets, and retain 25% in the endowment growth fund.',
          roleAr: 'المشرف المالي العام (CFO)',
          roleEn: 'Chief Financial Officer',
          inputsAr: ['سجل العوائد المعتمد', 'نسب التوزيع المقرة'],
          inputsEn: ['Approved Yield Voucher', 'Governance Split Ratios'],
          systemActionsAr: ['توليد قيد التوزيع المزدوج الآلي في IPSAS Ledger', 'تغذية ميزانيات كفالة الأيتام والإغاثة'],
          systemActionsEn: ['Post automated split journal entry in IPSAS Ledger', 'Directly feed active relief & orphan budgets'],
          outputAr: 'سند توزيع العوائد المعتمد ومرحل كلياً',
          outputEn: 'Approved & posted yield distribution ledger',
          auditRuleAr: 'تثبيت التوزيع وتوثيق توقيع المشرف المالي.',
          auditRuleEn: 'Audit log entry securing CFO signature on yield split.'
        }
      ]
    }
  ];

  const filteredScenarios = scenarios.filter(s => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      s.titleAr.includes(searchQuery) || 
      s.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.descriptionAr.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  const currentStep = activeScenario.steps[currentStepIndex] || activeScenario.steps[0];

  const handleCopyPlaybook = () => {
    const text = `
=== ${activeScenario.code}: ${activeScenario.titleAr} (${activeScenario.titleEn}) ===
${activeScenario.descriptionAr}

الفئات والصلاحيات: ${activeScenario.responsibleRolesAr.join(' | ')}
الأثر المتوقع: ${activeScenario.kpiMetricsAr.join(' | ')}

الخطوات التشغيلية:
${activeScenario.steps.map(st => `
[خطوة ${st.stepNumber}]: ${st.titleAr} (${st.roleAr})
- الوصف: ${st.descriptionAr}
- المدخلات: ${st.inputsAr.join(', ')}
- عمليات النظام: ${st.systemActionsAr.join(', ')}
- المخرج: ${st.outputAr}
- قاعدة التدقيق: ${st.auditRuleAr}
`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 dark:text-zinc-100 pb-12">
      
      {/* Executive Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-zinc-900 via-emerald-950 to-zinc-900 text-white rounded-xl shadow-2xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <PlayCircle className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[10px] font-black tracking-widest uppercase">
                  HEBD & EOWP PLAYBOOKS
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-[10px] font-black tracking-widest uppercase">
                  {lang === 'ar' ? 'معايير التشغيل الموحدة' : 'Standard Playbooks'}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                {lang === 'ar' ? 'السيناريوهات والعمليات التشغيلية المباشرة (Playbooks)' : 'Operational Scenarios & Execution Playbooks'}
              </h1>
              <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                {lang === 'ar'
                  ? 'دليل السيناريوهات التشغيلية المرجعية لمحرك المنظومة ودليل المستخدم الذكي. يصف الخطوات التفصيلية، أدوار العمل، معايير الرقابة، وتكاملات الذكاء الاصطناعي.'
                  : 'Interactive operational playbooks mapping inputs, system actions, governance rules, and AI integration for key enterprise workflows.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={handleCopyPlaybook}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
              <span>{copied ? (lang === 'ar' ? 'تم نسخ الدليل' : 'Playbook Copied') : (lang === 'ar' ? 'نسخ السيناريو' : 'Copy Playbook')}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة الدليل' : 'Print Playbook'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {lang === 'ar' ? 'جميع السيناريوهات' : 'All Scenarios'} ({scenarios.length})
          </button>
          <button
            onClick={() => setSelectedCategory('welfare')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'welfare'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>{lang === 'ar' ? 'الرعاية والكفالات' : 'Welfare & Sponsorships'}</span>
          </button>
          <button
            onClick={() => setSelectedCategory('relief')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'relief'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'حملات الإغاثة الميدانية' : 'Relief Operations'}</span>
          </button>
          <button
            onClick={() => setSelectedCategory('finance')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'finance'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ar' ? 'المالية والقيود' : 'Finance & Ledger'}</span>
          </button>
          <button
            onClick={() => setSelectedCategory('governance')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'governance'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>{lang === 'ar' ? 'الحوكمة والإغلاق' : 'Governance & Audit'}</span>
          </button>
          <button
            onClick={() => setSelectedCategory('procurement')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'procurement'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang === 'ar' ? 'المشتريات والمناقصات' : 'Procurement & Tenders'}</span>
          </button>
          <button
            onClick={() => setSelectedCategory('fundraising')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'fundraising'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>{lang === 'ar' ? 'التبرعات والدفع الإلكتروني' : 'Fundraising & Gateways'}</span>
          </button>
          <button
            onClick={() => setSelectedCategory('analytics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'analytics'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{lang === 'ar' ? 'الذكاء الاصطناعي والتنبؤ' : 'AI Predictive BI'}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في السيناريوهات...' : 'Search playbooks...'}
            className="w-full pr-9 pl-4 py-1.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 dark:text-zinc-200"
          />
        </div>
      </div>

      {/* Main Grid: Left/Top Cards Selection + Right/Bottom Interactive Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Scenarios List Column (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>{lang === 'ar' ? 'مكتبة السيناريوهات المعتمدة' : 'Operational Playbook Library'}</span>
            </h3>
            <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-md text-slate-600 dark:text-zinc-400">
              {filteredScenarios.length} {lang === 'ar' ? 'سيناريو' : 'Scenarios'}
            </span>
          </div>

          <div className="space-y-3">
            {filteredScenarios.map((sc) => {
              const isActive = sc.id === activeScenario.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    setActiveScenarioId(sc.id);
                    setCurrentStepIndex(0);
                    setExpandedStep(null);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isActive
                      ? 'bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border-amber-500 shadow-xl ring-2 ring-amber-500/30'
                      : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 hover:border-amber-500/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono tracking-wider ${
                        isActive ? 'bg-amber-500 text-zinc-950' : 'bg-slate-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {sc.code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        sc.category === 'welfare' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        sc.category === 'relief' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        sc.category === 'finance' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                      }`}>
                        {sc.category === 'welfare' ? (lang === 'ar' ? 'رعاية وكفالات' : 'Welfare') :
                         sc.category === 'relief' ? (lang === 'ar' ? 'إغاثة ميدانية' : 'Relief') :
                         sc.category === 'finance' ? (lang === 'ar' ? 'مالية وقيود' : 'Finance') :
                         (lang === 'ar' ? 'حوكمة وإغلاق' : 'Governance')}
                      </span>
                    </div>

                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {lang === 'ar' ? sc.estimatedDurationAr : sc.estimatedDurationEn}
                    </span>
                  </div>

                  <h4 className={`text-sm font-black mb-1.5 transition-colors ${isActive ? 'text-amber-300' : 'group-hover:text-amber-500'}`}>
                    {lang === 'ar' ? sc.titleAr : sc.titleEn}
                  </h4>

                  <p className={`text-xs line-clamp-2 leading-relaxed mb-3 ${isActive ? 'text-zinc-300' : 'text-slate-500 dark:text-zinc-400'}`}>
                    {lang === 'ar' ? sc.descriptionAr : sc.descriptionEn}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/50 dark:border-zinc-800">
                    <span className="font-bold text-zinc-400 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      {sc.steps.length} {lang === 'ar' ? 'خطوات تنفيذية' : 'Execution Steps'}
                    </span>

                    {onNavigate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(sc.targetTab);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                            : 'bg-slate-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-slate-700 dark:text-zinc-300'
                        }`}
                        title={lang === 'ar' ? 'الانتقال للشاشة المباشرة للتنفيذ' : 'Execute in System View'}
                      >
                        <span>{lang === 'ar' ? 'تطبيق الشاشة' : 'Open View'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scenario Details & Step-by-Step Interactive Stepper (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Detailed Scenario Overview Card */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl space-y-6">
            
            {/* Header Title & Execution Direct Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded font-mono font-black text-xs">
                    {activeScenario.code}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">
                    {lang === 'ar' ? 'دليل إجراءات العمل التشغيلي (SOP)' : 'Standard Operating Playbook'}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                  {lang === 'ar' ? activeScenario.titleAr : activeScenario.titleEn}
                </h2>
              </div>

              {onNavigate && (
                <button
                  onClick={() => onNavigate(activeScenario.targetTab)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Zap className="w-4 h-4 text-zinc-950 fill-current" />
                  <span>{lang === 'ar' ? 'تشغيل وسيناريو الشاشة الآن' : 'Execute Scenario View'}</span>
                </button>
              )}
            </div>

            {/* Roles & KPI Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 space-y-2">
                <h4 className="font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'ar' ? 'الأدوار والصلاحيات المسؤولة' : 'Responsible Roles'}</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(lang === 'ar' ? activeScenario.responsibleRolesAr : activeScenario.responsibleRolesEn).map((r, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md font-bold text-[11px] text-slate-700 dark:text-zinc-300">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 space-y-2">
                <h4 className="font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'ar' ? 'مؤشرات الأداء الرئيسية (KPIs)' : 'Target KPI Metrics'}</span>
                </h4>
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-zinc-300 font-medium">
                  {(lang === 'ar' ? activeScenario.kpiMetricsAr : activeScenario.kpiMetricsEn).map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* AI Integration Highlight */}
            <div className="p-4 bg-gradient-to-r from-emerald-950/20 via-zinc-900/30 to-amber-950/20 border border-emerald-500/30 rounded-xl flex items-start gap-3">
              <Bot className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-extrabold text-emerald-400 flex items-center gap-1">
                  <span>{lang === 'ar' ? 'التكامل الذكي مع محرك Gemini AI:' : 'Gemini AI Smart Integration:'}</span>
                </h4>
                <p className="text-zinc-300 leading-relaxed">
                  {lang === 'ar' ? activeScenario.aiIntegrationAr : activeScenario.aiIntegrationEn}
                </p>
              </div>
            </div>

            {/* Interactive Stepper Navigation (Step 1 -> Step 2 -> Step 3) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'ar' ? 'مخطط الخطوات التنفيذية بالتفصيل' : 'Interactive Step-by-Step Workflow'}</span>
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentStepIndex === 0}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-all cursor-pointer text-slate-700 dark:text-zinc-300"
                    title={lang === 'ar' ? 'الخطوة السابقة' : 'Previous Step'}
                  >
                    {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded-md text-slate-600 dark:text-zinc-300">
                    {currentStepIndex + 1} / {activeScenario.steps.length}
                  </span>
                  <button
                    onClick={() => setCurrentStepIndex(prev => Math.min(activeScenario.steps.length - 1, prev + 1))}
                    disabled={currentStepIndex === activeScenario.steps.length - 1}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-all cursor-pointer text-slate-700 dark:text-zinc-300"
                    title={lang === 'ar' ? 'الخطوة التالية' : 'Next Step'}
                  >
                    {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Steps Progress Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {activeScenario.steps.map((st, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`p-2 rounded-xl text-center transition-all cursor-pointer border text-xs font-bold flex flex-col items-center justify-center gap-1 ${
                        isCurrent
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-md shadow-amber-500/20'
                          : idx < currentStepIndex
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700/60 hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {idx < currentStepIndex ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <span className="font-mono text-[11px] font-black">#{st.stepNumber}</span>
                        )}
                      </div>
                      <span className="truncate max-w-[80px] text-[10px]">
                        {lang === 'ar' ? st.titleAr : st.titleEn}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Current Active Step Breakdown Box */}
              <div className="p-5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
                
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black font-mono text-sm shadow-md">
                      #{currentStep.stepNumber}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                        {lang === 'ar' ? currentStep.titleAr : currentStep.titleEn}
                      </h4>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? currentStep.roleAr : currentStep.roleEn}</span>
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold">
                    {lang === 'ar' ? 'مرحلة حية' : 'Active Phase'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {lang === 'ar' ? currentStep.descriptionAr : currentStep.descriptionEn}
                </p>

                {/* Inputs & System Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                    <h5 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lang === 'ar' ? 'المدخلات والمستندات المطلوبة:' : 'Inputs & Documents:'}</span>
                    </h5>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-zinc-300">
                      {(lang === 'ar' ? currentStep.inputsAr : currentStep.inputsEn).map((inp, i) => (
                        <li key={i} className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>{inp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                    <h5 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{lang === 'ar' ? 'عمليات وتصرفات النظام الآلية:' : 'Automated System Actions:'}</span>
                    </h5>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-zinc-300">
                      {(lang === 'ar' ? currentStep.systemActionsAr : currentStep.systemActionsEn).map((act, i) => (
                        <li key={i} className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Output & Audit Rule Footer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                    <span className="font-extrabold text-emerald-800 dark:text-emerald-400 block mb-0.5 text-[11px]">
                      {lang === 'ar' ? 'المخرج النهائي للخطوة:' : 'Step Output Artifact:'}
                    </span>
                    <span className="text-slate-800 dark:text-zinc-200 font-bold">
                      {lang === 'ar' ? currentStep.outputAr : currentStep.outputEn}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                    <span className="font-extrabold text-amber-800 dark:text-amber-400 block mb-0.5 text-[11px]">
                      {lang === 'ar' ? 'قاعدة سجل التدقيق (Audit Rule):' : 'Audit Trail Rule:'}
                    </span>
                    <span className="text-slate-800 dark:text-zinc-200 font-bold">
                      {lang === 'ar' ? currentStep.auditRuleAr : currentStep.auditRuleEn}
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Full Scenario Accordion / List of All Steps for Print/Quick Scan */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-lg space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>{lang === 'ar' ? 'جميع خطوات هذا السيناريو بالتتابع' : 'Complete Sequential Playbook List'}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-zinc-400">
                {activeScenario.steps.length} {lang === 'ar' ? 'مراحل' : 'Phases'}
              </span>
            </h3>

            <div className="space-y-2">
              {activeScenario.steps.map((st, idx) => {
                const isExpanded = expandedStep === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : idx)}
                      className="w-full p-3.5 bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between gap-3 text-right cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black font-mono text-xs flex items-center justify-center shrink-0">
                          #{st.stepNumber}
                        </span>
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                            {lang === 'ar' ? st.titleAr : st.titleEn}
                          </h5>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            {lang === 'ar' ? st.roleAr : st.roleEn}
                          </p>
                        </div>
                      </div>

                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </button>

                    {isExpanded && (
                      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
                        <p className="font-medium">{lang === 'ar' ? st.descriptionAr : st.descriptionEn}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                          <div>
                            <span className="font-extrabold text-slate-500 block mb-1">
                              {lang === 'ar' ? 'المدخلات:' : 'Inputs:'}
                            </span>
                            <span className="font-medium">{(lang === 'ar' ? st.inputsAr : st.inputsEn).join(', ')}</span>
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-500 block mb-1">
                              {lang === 'ar' ? 'المخرج النهائي:' : 'Output Artifact:'}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{lang === 'ar' ? st.outputAr : st.outputEn}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
