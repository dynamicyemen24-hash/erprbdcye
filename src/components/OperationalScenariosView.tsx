import React, { useState, memo, useMemo } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Clock,
  AlertTriangle,
  Building,
  Activity,
  Award,
  Zap,
  Target,
  Sliders,
  Box,
  FileCheck,
  Globe,
  Database,
  BookOpen,
  Users,
  User,
  Shield,
  ArrowUpRight,
  BarChart3,
  Eye,
  Lock,
  RefreshCw,
  X,
  Download,
  HelpCircle,
  FolderArchive,
  ClipboardList,
  CheckSquare,
  TrendingUp,
  Calendar,
  Filter,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { ModuleShell } from './enterprise/ModuleShell';

interface OperationalScenariosViewProps {
  lang: 'ar' | 'en';
  onNavigate?: (tab: string) => void;
  orgName?: string;
}

// Interfaces
export interface ScenarioStep {
  stepNumber: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  roleAr: string;
  roleEn: string;
  raci: {
    responsible: string;
    accountable: string;
    consulted: string;
    informed: string;
  };
  inputsAr: string[];
  inputsEn: string[];
  systemActionsAr: string[];
  systemActionsEn: string[];
  outputAr: string;
  outputEn: string;
  auditRuleAr: string;
  auditRuleEn: string;
  linkedScreen: string;
  linkedDocTitleAr: string;
  linkedDocTitleEn: string;
  aiGuidanceAr: string;
  aiGuidanceEn: string;
}

export interface MasterRolloutPhase {
  id: string;
  phaseNumber: number;
  code: string;
  titleAr: string;
  titleEn: string;
  category: 'strategy' | 'programs' | 'hr' | 'finance' | 'projects' | 'welfare' | 'procurement' | 'operations' | 'governance';
  nebDomain: string;
  priorityLevelAr: string;
  priorityLevelEn: string;
  badgeColor: string;
  targetTab: string;
  estimatedDurationAr: string;
  estimatedDurationEn: string;
  responsibleRolesAr: string[];
  responsibleRolesEn: string[];
  descriptionAr: string;
  descriptionEn: string;
  strategicObjectiveAr: string;
  strategicObjectiveEn: string;
  kpiMetricsAr: string[];
  kpiMetricsEn: string[];
  linkedDocsAr: string[];
  linkedDocsEn: string[];
  steps: ScenarioStep[];
}

export interface BylawArticle {
  id: string;
  chapterNumber: number;
  chapterTitleAr: string;
  chapterTitleEn: string;
  articles: Array<{
    articleNumber: number;
    titleAr: string;
    titleEn: string;
    contentAr: string;
    contentEn: string;
    linkedScreen: string;
    linkedDoc: string;
  }>;
}

export interface JobDescriptionProfile {
  id: string;
  roleCode: string;
  titleAr: string;
  titleEn: string;
  departmentAr: string;
  departmentEn: string;
  securityLevel: string;
  maxApprovalAmount: string;
  reportsToAr: string;
  reportsToEn: string;
  supervisesAr: string[];
  supervisesEn: string[];
  purposeAr: string;
  purposeEn: string;
  targetTab: string;
  dailyTasksAr: string[];
  dailyTasksEn: string[];
  weeklyTasksAr: string[];
  weeklyTasksEn: string[];
  monthlyTasksAr: string[];
  monthlyTasksEn: string[];
  quarterlyTasksAr: string[];
  quarterlyTasksEn: string[];
  kpiMetricsAr: string[];
  kpiMetricsEn: string[];
}

export interface OfficialDocumentTemplate {
  id: string;
  code: string;
  phaseId: string;
  titleAr: string;
  titleEn: string;
  typeAr: string;
  typeEn: string;
  category: string;
  departmentAr: string;
  departmentEn: string;
  standardReference: string;
  descriptionAr: string;
  descriptionEn: string;
  targetTab: string;
  sampleData: {
    refNumber: string;
    issueDate: string;
    authorizer: string;
    statusAr: string;
    statusEn: string;
    detailsAr: string[];
    detailsEn: string[];
  };
}

export interface QuickTemplatePack {
  id: string;
  titleAr: string;
  titleEn: string;
  categoryAr: string;
  categoryEn: string;
  descriptionAr: string;
  descriptionEn: string;
  targetTab: string;
  previewData: string;
}

function OperationalScenariosView({ lang, onNavigate, orgName }: OperationalScenariosViewProps) {
  const isRtl = lang === 'ar';

  // Navigation State
  const [activeMainTab, setActiveMainTab] = useState<'rollout' | 'bylaws' | 'playbook' | 'job_descriptions' | 'duty_roster' | 'meal_appraisal' | 'documents'>('rollout');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePhaseId, setActivePhaseId] = useState<string>('PHASE-01');
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('ROLE-CEO');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [expandedBylawChapter, setExpandedBylawChapter] = useState<number | null>(1);
  const [dutyRosterCadence, setDutyRosterCadence] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('daily');

  // Interactive Modals
  const [previewDoc, setPreviewDoc] = useState<OfficialDocumentTemplate | null>(null);
  const [activeStepAI, setActiveStepAI] = useState<ScenarioStep | null>(null);
  const [appliedTemplateMsg, setAppliedTemplateMsg] = useState<string | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  const [completedPhases, setCompletedPhases] = useState<Record<string, boolean>>({
    'PHASE-01': true,
    'PHASE-02': true,
    'PHASE-03': false,
    'PHASE-04': false,
    'PHASE-05': false,
    'PHASE-06': false,
    'PHASE-07': false,
    'PHASE-08': false,
    'PHASE-09': false,
  });

  // DATA: 9 Rollout Phases
  const rolloutPhases: MasterRolloutPhase[] = [
    {
      id: 'PHASE-01',
      phaseNumber: 1,
      code: 'NEB-01/02',
      titleAr: 'المرحلة 1: التأسيس والتخطيط الاستراتيجي والهوية والحوكمة',
      titleEn: 'Phase 1: Strategic Foundation, Vision & Institutional Governance',
      category: 'strategy',
      nebDomain: 'NEB-01 Strategy & Performance OS',
      priorityLevelAr: 'أولوية قصوى (تأسيسية)',
      priorityLevelEn: 'P1 Mandatory Foundation',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      targetTab: 'strategic_planning',
      estimatedDurationAr: '24 - 48 ساعة',
      estimatedDurationEn: '24 - 48 Hours',
      responsibleRolesAr: ['مجلس الأمناء / الإدارة العليا', 'المدير التنفيذي العام', 'مدير التخطيط الاستراتيجي'],
      responsibleRolesEn: ['Board of Trustees', 'Executive Director (CEO)', 'Strategic Planning Lead'],
      descriptionAr: 'حجر الأساس لانطلاق المؤسسة: ضبط هوية المنظمة، صياغة الرؤية والرسالة، تأطير الأهداف الاستراتيجية وبطاقات الأداء (KPIs)، تحليل SWOT، ومصفوفة الصلاحيات العليا.',
      descriptionEn: 'The mandatory foundation: configuring enterprise identity, mission/vision, strategic goals, KPI scorecards, SWOT analysis, and executive authority limits.',
      strategicObjectiveAr: 'مواءمة كافة برامج ومشاريع المؤسسة مع الأهداف التنموية والاستراتيجية العليا.',
      strategicObjectiveEn: 'Align all organizational programs and projects with macro development goals.',
      kpiMetricsAr: [
        'اكتمال مصفوفة الأهداف الاستراتيجية 100%',
        'تحديد مؤشرات الأداء (KPIs) لجميع القطاعات',
        'اعتماد ميثاق الحوكمة وتفويض الصلاحيات'
      ],
      kpiMetricsEn: [
        '100% Strategic Objectives Formulated',
        'Sectoral KPIs Defined with Baselines',
        'Governance & Delegation Charter Approved'
      ],
      linkedDocsAr: ['ميثاق الخطة الاستراتيجية المعتمدة', 'مصفوفة تفويض الصلاحيات والحوكمة', 'تقرير تحليل البيئة المؤسسية SWOT'],
      linkedDocsEn: ['Approved Strategic Plan Charter', 'Executive Governance Delegation Matrix', 'Institutional SWOT Analysis Dossier'],
      steps: [
        {
          stepNumber: 1,
          titleAr: 'ضبط الهوية المؤسسية، بيانات الترخيص والعملات',
          titleEn: 'Configure Enterprise Identity, License & Currencies',
          descriptionAr: 'تسجيل اسم المؤسسة، الشعار الرسمي، رقم الترخيص الوزاري، العملات المعتمدة (YER/SAR/USD) وضبط أسعار الصرف.',
          descriptionEn: 'Enter official organization name, logo, ministerial license number, define base currencies (YER/SAR/USD) and FX baselines.',
          roleAr: 'المدير التنفيذي / مدير النظام',
          roleEn: 'Executive Director / Admin',
          raci: { responsible: 'مدير النظام', accountable: 'المدير التنفيذي', consulted: 'المدير المالي', informed: 'كافة المدراء' },
          inputsAr: ['شهادة الترخيص الرسمية', 'الشعار الرسمي عالي الدقة', 'قائمة العملات وأسعار الصرف'],
          inputsEn: ['Official License Document', 'High-Res Logo', 'Approved Currency Roster'],
          systemActionsAr: ['حفظ إعدادات المنظمة في organization_settings', 'تحديث الهوية في كافة الواجهات والتقارير', 'تثبيت أسعار الصرف في جدول currencies'],
          systemActionsEn: ['Save in organization_settings', 'Update CSS brand custom properties', 'Set initial FX in currencies table'],
          outputAr: 'هوية مؤسسية موحدة وموثقة عبر كافة الشاشات والمستندات',
          outputEn: 'Unified official enterprise identity across all screens and exports',
          auditRuleAr: 'قيد تدقيق أمني غير قابل للتعديل يوثق تثبيت هوية المنظمة ورقم الترخيص.',
          auditRuleEn: 'Immutable audit log securing organization identity and license.',
          linkedScreen: 'settings',
          linkedDocTitleAr: 'ميثاق الهوية والترخيص الرسمي',
          linkedDocTitleEn: 'Enterprise Identity & Licensing Charter',
          aiGuidanceAr: 'تأكد من إدراج رقم الترخيص الوزاري الرسمي لضمان ظهوره التلقائي في كافة التقارير الرسمية والموجهة للجهات الحكومية والمانحين.',
          aiGuidanceEn: 'Ensure official ministry license is set to auto-populate report headers.'
        },
        {
          stepNumber: 2,
          titleAr: 'بناء الأهداف الاستراتيجية ومؤشرات الأداء (KPIs)',
          titleEn: 'Formulate Strategic Pillars, Objectives & KPIs',
          descriptionAr: 'تحديد المحاور الاستراتيجية (الإغاثة، التعليم، الصحة، التمكين الاقتصادي، الاستدامة) وربط كل هدف بمؤشر أداء رقمي وميزانية تقديرية.',
          descriptionEn: 'Establish strategic pillars and map each goal to quantitative KPIs, timelines, and budget allocations.',
          roleAr: 'مدير التخطيط الاستراتيجي',
          roleEn: 'Strategic Planning Lead',
          raci: { responsible: 'مدير التخطيط', accountable: 'المدير التنفيذي', consulted: 'مدراء البرامج والمالية', informed: 'مجلس الأمناء' },
          inputsAr: ['وثيقة الرؤية الخمسية', 'مستهدفات البرامج التنموية', 'الموازنة الاستراتيجية التقديرية'],
          inputsEn: ['5-Year Vision Document', 'Programmatic Targets', 'Strategic Budget Framework'],
          systemActionsAr: ['إنشاء بطاقات الأهداف في strategic_objectives', 'ربط كل هدف بنطاق NEB التابع له', 'توليد لوحة التتبع الاستراتيجي'],
          systemActionsEn: ['Insert records into strategic_objectives', 'Map to NEB domains', 'Initialize strategic tracker'],
          outputAr: 'خطة استراتيجية تفاعلية مربوطة بكافة البرامج والمشاريع',
          outputEn: 'Interactive strategic matrix linked to all operational modules',
          auditRuleAr: 'تجميد الخطة الاستراتيجية بإصدار مرجعي معتمد ورقم اعتماد رسمي.',
          auditRuleEn: 'Freeze strategic plan with immutable versioning hash.',
          linkedScreen: 'strategic_planning',
          linkedDocTitleAr: 'وثيقة الخطة الاستراتيجية وبطاقات الأداء (BSC)',
          linkedDocTitleEn: 'Strategic Plan Charter & Balanced Scorecard',
          aiGuidanceAr: 'استخدم الذكاء الاصطناعي لفحص توافق أهدافك مع المعايير الإنسانية الدولية Sphere ومعايير التنمية المستدامة SDGs.',
          aiGuidanceEn: 'Leverage AI to audit goal alignment against Sphere Standards and SDGs.'
        },
        {
          stepNumber: 3,
          titleAr: 'اعتماد مصفوفة الحوكمة وسلاسل الصلاحيات (Levels 1-5)',
          titleEn: 'Enact Governance Delegation Matrix & Access Levels',
          descriptionAr: 'تحديد حدود الصلاحيات المالية والإدارية (CEO: لا محدود، مدير العمليات: 50,000$، مدير المشاريع: 10,000$) وتوثيق مصفوفة RACI.',
          descriptionEn: 'Define approval thresholds (CEO: Unlimited, Ops Director: $50k, PM: $10k) and formalize the RACI matrix.',
          roleAr: 'المدير التنفيذي / مدير الحوكمة',
          roleEn: 'CEO / Governance Officer',
          raci: { responsible: 'مدير الحوكمة', accountable: 'المدير التنفيذي', consulted: 'المدير المالي', informed: 'كافة الكوادر' },
          inputsAr: ['لائحة الصلاحيات المالية والإدارية', 'جدول تفويض التوقيعات المعتمد'],
          inputsEn: ['Financial & Administrative Bylaws', 'Signature Delegation Schedule'],
          systemActionsAr: ['تحديث القواعد في محرك الحوكمة policy_engine', 'تطبيق قيود الفحص التلقائي على طلبات الصرف', 'تفعيل مسارات التدقيق الصارم'],
          systemActionsEn: ['Update policy_engine rules', 'Enforce validation gates on requisitions', 'Activate audit trails'],
          outputAr: 'محرك حوكمة صارم يمنع أي تجاوز مالي أو إداري تلقائياً',
          outputEn: 'Automated governance firewall preventing unauthorized transactions',
          auditRuleAr: 'تسجيل توقيع المدير التنفيذي الرقمي وتثبيت جدول الصلاحيات.',
          auditRuleEn: 'Log CEO digital sign-off and anchor delegation limits.',
          linkedScreen: 'control_panel',
          linkedDocTitleAr: 'مصفوفة تفويض الصلاحيات والحوكمة المعتمدة',
          linkedDocTitleEn: 'Governance & Approval Limits Charter',
          aiGuidanceAr: 'النظام يفحص تلقائياً أي معاملة تتجاوز حد الصلاحية ويعيد توجيهها إلى المستوى الأعلى مع إشعار فوري.',
          aiGuidanceEn: 'The system auto-enforces threshold checks and escalates outliers with instant alerts.'
        }
      ]
    },
    {
      id: 'PHASE-02',
      phaseNumber: 2,
      code: 'NEB-03/08',
      titleAr: 'المرحلة 2: تخطيط البرامج والمحافظ والمنح التمويلية والشراكات',
      titleEn: 'Phase 2: Programs, Portfolios & Grant Agreements OS',
      category: 'programs',
      nebDomain: 'NEB-03 Program OS & NEB-08 Funding OS',
      priorityLevelAr: 'أولوية عالية',
      priorityLevelEn: 'P2 High Priority',
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      targetTab: 'programs',
      estimatedDurationAr: '2 - 3 أيام',
      estimatedDurationEn: '2 - 3 Days',
      responsibleRolesAr: ['مدير البرامج والمشاريع', 'مسؤول الشراكات والمنح', 'المدير المالي'],
      responsibleRolesEn: ['Programs Director', 'Grants Officer', 'Finance Manager'],
      descriptionAr: 'هيكلة البرامج التنموية الكبرى (الإغاثة الطارئة، التعليم، الرعاية، التمكين الاقتصادي)، تسجيل اتفاقيات المانحين والشركاء، وحجز المخصصات التقديرية.',
      descriptionEn: 'Structure strategic programs, record donor grant agreements, and allocate budgetary envelopes.',
      strategicObjectiveAr: 'تأطير محافظ برامجية متكاملة تضمن الوفاء بالتزامات المانحين وتحقيق الأثر المستدام.',
      strategicObjectiveEn: 'Build robust program portfolios ensuring donor compliance and sustainable impact.',
      kpiMetricsAr: [
        'تأطير 100% من البرامج الرئيسية',
        'ربط كافة المنح التمويلية باتفاقيات رسمية',
        'معدل التغطية التمويلية للبرامج > 85%'
      ],
      kpiMetricsEn: [
        '100% Master Programs Structured',
        'All Grants Tied to Official Agreements',
        'Program Funding Coverage Ratio > 85%'
      ],
      linkedDocsAr: ['وثيقة إطار البرنامج التنموي', 'سجل اتفاقيات المنح والممولين', 'موازنة البرامج التقديرية'],
      linkedDocsEn: ['Programmatic Framework Dossier', 'Donor Grant Agreement Ledger', 'Master Program Budget Allocation'],
      steps: [
        {
          stepNumber: 1,
          titleAr: 'إنشاء سجل البرامج الكبرى وربطها بالأهداف الاستراتيجية',
          titleEn: 'Create Master Programs & Map to Strategic Objectives',
          descriptionAr: 'تسجيل البرامج الرئيسية، تحديد النطاق القطاعي، الميزانية التقديرية، والمستهدفات الكلية من المستفيدين.',
          descriptionEn: 'Register master programs, define sectoral scope, estimated budget envelope, and target beneficiaries.',
          roleAr: 'مدير البرامج والمشاريع',
          roleEn: 'Programs Director',
          raci: { responsible: 'مدير البرامج', accountable: 'المدير التنفيذي', consulted: 'مدير التخطيط', informed: 'المدير المالي' },
          inputsAr: ['وثيقة توصيف البرنامج', 'الأهداف الاستراتيجية المرتبطة', 'المستهدفات القطاعية'],
          inputsEn: ['Program Concept Note', 'Linked Strategic Objectives', 'Sectoral Targets'],
          systemActionsAr: ['إضافة سجل البرنامج في جدول programs', 'ربط كود البرنامج بالأهداف في NEB-01', 'توليد بطاقة أداء البرنامج'],
          systemActionsEn: ['Insert record in programs table', 'Bind to NEB-01 goals', 'Generate performance scorecard'],
          outputAr: 'محفظة برامجية مهيكلة ومعتمدة رقمياً',
          outputEn: 'Digitally anchored master programmatic portfolio',
          auditRuleAr: 'تسجيل اعتماد البرنامج وتثبيت كود البرنامج الفريد.',
          auditRuleEn: 'Log program creation event with unique program code.',
          linkedScreen: 'programs',
          linkedDocTitleAr: 'وثيقة إطار البرنامج التنموي المعتمد',
          linkedDocTitleEn: 'Master Program Framework Document',
          aiGuidanceAr: 'احرص على تقسيم البرامج وفق المعايير القطاعية لتسهيل توليد تقارير IATI والمطابقة الأممية.',
          aiGuidanceEn: 'Structure programs according to standard humanitarian clusters.'
        },
        {
          stepNumber: 2,
          titleAr: 'توثيق اتفاقيات المنح وتخصيص الصناديق والممولين',
          titleEn: 'Register Donor Grant Agreements & Encumber Funds',
          descriptionAr: 'إدخال بيانات المانحين، قيمة المنحة، العملة، القيود التمويلية، وفترة السريان وجدول الدفعات المالية.',
          descriptionEn: 'Enter donor credentials, grant value, currency, funding conditionalities, and disbursement schedule.',
          roleAr: 'مسؤول الشراكات / المدير المالي',
          roleEn: 'Grants Lead / Finance Lead',
          raci: { responsible: 'مسؤول المنح', accountable: 'المدير المالي', consulted: 'مدير البرامج', informed: 'المدير التنفيذي' },
          inputsAr: ['اتفاقية المنحة الموقعة', 'جدول الدفعات المالية', 'شروط الصرف والتقارير'],
          inputsEn: ['Signed Grant Agreement', 'Payment Tranche Schedule', 'Reporting Covenants'],
          systemActionsAr: ['حفظ اتفاقية المنحة في funding_agreements', 'حجز مخصصات الميزانية في شجرة الحسابات', 'توليد تنبيهات استحقاق تقارير المانحين'],
          systemActionsEn: ['Store record in funding_agreements', 'Encumber fund allocations', 'Schedule donor reporting triggers'],
          outputAr: 'سجل منح معتمد ومخصص مالياً',
          outputEn: 'Active and encumbered donor grant repository',
          auditRuleAr: 'حفظ نسخة الاتفاقية المشفرة وتاريخ سريان العقد.',
          auditRuleEn: 'Archive encrypted contract hash and timestamp.',
          linkedScreen: 'sales',
          linkedDocTitleAr: 'اتفاقية المنحة وسجل المخصصات المالية',
          linkedDocTitleEn: 'Grant Agreement & Fund Encumbrance Ledger',
          aiGuidanceAr: 'النظام ينشئ تنبيهات مبكرة قبل 15 يوماً من مواعيد استحقاق تقارير المانحين لتفادي أي تأخير.',
          aiGuidanceEn: 'The system triggers automated alerts 15 days prior to donor reporting milestones.'
        }
      ]
    },
    {
      id: 'PHASE-03',
      phaseNumber: 3,
      code: 'NEB-09',
      titleAr: 'المرحلة 3: الموارد البشرية، الكوادر، وتوزيع الصلاحيات والأدوار',
      titleEn: 'Phase 3: Human Resources, Personnel & Role-Based Access OS',
      category: 'hr',
      nebDomain: 'NEB-09 Resource & Asset OS (HR)',
      priorityLevelAr: 'أولوية عالية',
      priorityLevelEn: 'P2 High Priority',
      badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      targetTab: 'users',
      estimatedDurationAr: '24 ساعة',
      estimatedDurationEn: '24 Hours',
      responsibleRolesAr: ['مسؤول الموارد البشرية', 'مدير النظام', 'المدير التنفيذي'],
      responsibleRolesEn: ['HR Manager', 'System Administrator', 'CEO'],
      descriptionAr: 'تسجيل الكادر الوظيفي والباحثين الميدانيين، وتعيين الأدوار الوظيفية، وضبط مستويات الأمان والمصادقة الثنائية وتفويض الصلاحيات.',
      descriptionEn: 'Onboard personnel, field enumerators, assign job roles, enforce 2FA and fine-grained role-based access control.',
      strategicObjectiveAr: 'تمكين الكوادر بالكفاءة والأمان وتأطير مسؤوليات التنفيذ والمساءلة.',
      strategicObjectiveEn: 'Empower staff with secure workflows and clear accountability.',
      kpiMetricsAr: [
        'تسجيل 100% من الكادر الوظيفي النشط',
        'تفعيل المصادقة الثنائية للمناصب الحساسة 100%',
        'مصفوفة صلاحيات دقيقة بدون تداخل'
      ],
      kpiMetricsEn: [
        '100% Active Staff Onboarded',
        '100% 2FA Enforcement for Sensitive Roles',
        'Zero Role Conflict / Zero Privilege Creep'
      ],
      linkedDocsAr: ['الهيكل التنظيمي المعتمد', 'بطاقات الوصف الوظيفي للموظفين', 'سجل تفويض التوقيعات والأدوار'],
      linkedDocsEn: ['Approved Organizational Chart', 'Staff Job Description Dossiers', 'Role Delegation Register'],
      steps: [
        {
          stepNumber: 1,
          titleAr: 'تسجيل الموظفين وتعيين الكوادر الإدارية والميدانية',
          titleEn: 'Onboard Staff, Assign Departments & Roles',
          descriptionAr: 'إدخال بيانات الموظف (الاسم، البريد، الهاتف، القسم، المسمى الوظيفي، والراتب) وتعيين الدور التشغيلي في النظام.',
          descriptionEn: 'Register employee profiles (Name, Email, Phone, Department, Job Title, Salary) and assign operational roles.',
          roleAr: 'مسؤول الموارد البشرية',
          roleEn: 'HR Lead',
          raci: { responsible: 'مسؤول الموارد البشرية', accountable: 'المدير التنفيذي', consulted: 'مدراء الإدارات', informed: 'مدير النظام' },
          inputsAr: ['عقد العمل والبطاقة الشخصية', 'المسمى والوصف الوظيفي', 'القسم المخصص'],
          inputsEn: ['Employment Contract & ID', 'Job Title & Description', 'Assigned Department'],
          systemActionsAr: ['إنشاء سجل المستخدم في جدول users', 'تشفير كلمات المرور بـ bcrypt', 'تخصيص الصلاحيات بحسب دور roleEnum'],
          systemActionsEn: ['Create user in users table', 'Hash credentials via bcrypt', 'Assign permissions by roleEnum'],
          outputAr: 'ملف موظف نشط وحساب دخول آمن للنظام',
          outputEn: 'Active employee profile and secure system account',
          auditRuleAr: 'تسجيل قيد إنشاء الحساب مع IP المنشئ والتاريخ.',
          auditRuleEn: 'Audit entry created with creator IP & timestamp.',
          linkedScreen: 'users',
          linkedDocTitleAr: 'بطاقة الموظف وبيانات الاعتماد الوظيفي',
          linkedDocTitleEn: 'Employee Profile & Access Credentials',
          aiGuidanceAr: 'تأكد من تعيين دور محدد لكل موظف وعدم منح صلاحيات المشرف العام إلا للمخولين رسمياً.',
          aiGuidanceEn: 'Strictly adhere to principle of least privilege.'
        }
      ]
    },
    {
      id: 'PHASE-04',
      phaseNumber: 4,
      code: 'NEB-10',
      titleAr: 'المرحلة 4: التأسيس المالي والمحاسبة المزدوجة IPSAS وسندات القبض والصرف',
      titleEn: 'Phase 4: Financial Foundation, IPSAS Double-Entry & Vouchers OS',
      category: 'finance',
      nebDomain: 'NEB-10 Finance & Compliance OS',
      priorityLevelAr: 'أولوية قصوى',
      priorityLevelEn: 'P1 Top Priority',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      targetTab: 'finance',
      estimatedDurationAr: '2 - 4 أيام',
      estimatedDurationEn: '2 - 4 Days',
      responsibleRolesAr: ['المدير المالي التنفيذي (CFO)', 'المحاسب المالي العام', 'مسؤول الخزينة والعهد'],
      responsibleRolesEn: ['Chief Financial Officer (CFO)', 'General Ledger Accountant', 'Treasury & Cashier'],
      descriptionAr: 'تأسيس الدليل المحاسبي الموحد (Chart of Accounts)، مراكز التكلفة، ضبط قيد التوازن المحاسبي الإلزامي (Debit = Credit)، وتفعيل سندات القبض والصرف الرسمية.',
      descriptionEn: 'Establish unified Chart of Accounts, cost centers, bank/cash ledgers, enforce double-entry constraint (debit = credit), and activate voucher workflows.',
      strategicObjectiveAr: 'حوكمة مالية صارمة وشفافية محاسبية متوافقة مع المعايير الدولية IPSAS.',
      strategicObjectiveEn: 'Zero financial leak, full IPSAS compliance, and complete ledger transparency.',
      kpiMetricsAr: [
        'توازن القيود المحاسبية 100% (Zero Unbalanced Vouchers)',
        'تصفية العهد المالية في المواعيد المحددة 100%',
        'دقة الترحيل المحاسبي لدفتر الأستاذ 100%'
      ],
      kpiMetricsEn: [
        '100% Balanced Journal Vouchers',
        '100% On-time Advance Clearances',
        '100% General Ledger Posting Integrity'
      ],
      linkedDocsAr: ['دليل الحسابات المعتمد (COA)', 'سندات القبض والصرف الرسمية', 'ميزان المراجعة والقوائم المالية IPSAS'],
      linkedDocsEn: ['Approved Chart of Accounts (COA)', 'Official Receipt & Payment Vouchers', 'IPSAS Trial Balance & Financial Statements'],
      steps: [
        {
          stepNumber: 1,
          titleAr: 'تهيئة شجرة الحسابات ومراكز التكلفة والصناديق',
          titleEn: 'Initialize Chart of Accounts, Cost Centers & Bank Ledgers',
          descriptionAr: 'إعداد شجرة الحسابات المتوافقة مع IPSAS (أصول، خصوم، إيرادات، مصروفات)، حسابات البنوك، الصناديق، وحسابات المنح المقيدة.',
          descriptionEn: 'Configure IPSAS-compliant Chart of Accounts, set up bank accounts, cash vaults, and restricted grant ledgers.',
          roleAr: 'المدير المالي العام',
          roleEn: 'CFO / Lead Accountant',
          raci: { responsible: 'المدير المالي', accountable: 'المدير التنفيذي', consulted: 'مراجع الحسابات الخارجي', informed: 'محاسبو المشاريع' },
          inputsAr: ['دليل الحسابات المعتمد', 'أرصدة البنوك الافتتاحية', 'قائمة مراكز التكلفة'],
          inputsEn: ['Approved Chart of Accounts', 'Opening Bank Balances', 'Cost Center Schedule'],
          systemActionsAr: ['توليد شجرة الحسابات في chart_of_accounts', 'قفل الحسابات الافتتاحية بقيد متزن', 'تفعيل التحقق من التوازن الآلي'],
          systemActionsEn: ['Populate chart_of_accounts table', 'Post balanced opening balance voucher', 'Activate DB constraint chk_transaction_balance'],
          outputAr: 'دليل محاسبي إلكتروني نشط ومقفل التوازن',
          outputEn: 'Active and balanced electronic chart of accounts',
          auditRuleAr: 'قيد تدقيق مالي يثبت تاريخ وساعة اعتماد الدليل المحاسبي.',
          auditRuleEn: 'Financial audit seal recording chart of accounts baseline.',
          linkedScreen: 'finance',
          linkedDocTitleAr: 'دليل شجرة الحسابات ومراكز التكلفة الرسمية',
          linkedDocTitleEn: 'Chart of Accounts & Cost Centers Master Charter',
          aiGuidanceAr: 'النظام يفرض قيد CHECK في قاعدة البيانات يمنع تماماً ترحيل أي قيد غير متزن بين المدين والدائن.',
          aiGuidanceEn: 'Database CHECK constraint strictly prohibits unbalanced transactions.'
        },
        {
          stepNumber: 2,
          titleAr: 'إصدار سندات القبض والصرف وترحيل قيود اليومية',
          titleEn: 'Issue Payment/Receipt Vouchers & Post Journal Entries',
          descriptionAr: 'تنفيذ عمليات القبض والصرف المالي عبر سندات إلكترونية مرقمة آلياً، مسح الفواتير بالذكاء الاصطناعي، وترحيل القيود المزدوجة.',
          descriptionEn: 'Execute disbursements & receipts via auto-sequenced digital vouchers, perform AI OCR invoice scanning, and post balanced double-entry vouchers.',
          roleAr: 'محاسب الخزينة والصرف',
          roleEn: 'Disbursement Accountant',
          raci: { responsible: 'محاسب الصرف', accountable: 'المدير المالي', consulted: 'مدير المشروع', informed: 'المستفيد / المورد' },
          inputsAr: ['طلب الصرف المعتمد', 'الفاتورة أو سند الاستلام', 'المرفقات المؤيدة'],
          inputsEn: ['Approved Payment Requisition', 'Supplier Invoice', 'Supporting Documentation'],
          systemActionsAr: ['مسح الفاتورة عبر Gemini OCR', 'توليد القيد المزدوج المتزن', 'تحديث أرصدة الحسابات ومراكز التكلفة فورياً'],
          systemActionsEn: ['Scan invoice via Gemini OCR', 'Generate balanced double-entry voucher', 'Update ledger & cost center balances'],
          outputAr: 'سند مالي معتمد وقيد مرحل إلى دفتر الأستاذ',
          outputEn: 'Approved financial voucher posted to General Ledger',
          auditRuleAr: 'تثبيت رقم السند غير القابل للحذف وتوثيق توقيع المحاسب.',
          auditRuleEn: 'Immutable voucher sequence number and accountant digital signature.',
          linkedScreen: 'finance',
          linkedDocTitleAr: 'سند صرف / قبض مالي معتمد مع قيد اليومية',
          linkedDocTitleEn: 'Official Payment/Receipt Voucher & Journal Posting',
          aiGuidanceAr: 'يمكن استخدام مساح الفواتير الذكي Gemini لاستخراج بنود الفاتورة آلياً ومنع التكرار.',
          aiGuidanceEn: 'Use Gemini AI Invoice Scanner to auto-extract line items and prevent duplicates.'
        }
      ]
    },
    {
      id: 'PHASE-05',
      phaseNumber: 5,
      code: 'NEB-04/05',
      titleAr: 'المرحلة 5: هندسة وتخطيط المشاريع وجدول الأنشطة وهياكل تفكيك العمل WBS',
      titleEn: 'Phase 5: Project Engineering, Gantt Scheduling & Field WBS OS',
      category: 'projects',
      nebDomain: 'NEB-04 Project Management & NEB-05 Operations OS',
      priorityLevelAr: 'أولوية عالية',
      priorityLevelEn: 'P2 High Priority',
      badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      targetTab: 'projects',
      estimatedDurationAr: '3 - 5 أيام',
      estimatedDurationEn: '3 - 5 Days',
      responsibleRolesAr: ['مدير المشاريع', 'مهندس التخطيط والـ WBS', 'منسق الأنشطة الميدانية'],
      responsibleRolesEn: ['Project Manager', 'Planning & WBS Engineer', 'Field Activity Lead'],
      descriptionAr: 'تحويل البرامج المعتمدة إلى مشاريع تفصيلية، بناء ميثاق المشروع (Project Charter)، تفكيك العمل إلى أنشطة WBS، وتحديد المخطط الزمني Gantt.',
      descriptionEn: 'Translate approved programs into operational projects, develop Project Charters, break down activities into WBS, set Gantt timelines, and geofence locations.',
      strategicObjectiveAr: 'تنفيذ المشاريع بدقة زمنية ومالية وميدانية 100% وتحقيق مؤشرات المخرجات والأثر.',
      strategicObjectiveEn: 'Execute projects within scope, time, and budget with 100% milestone achievement.',
      kpiMetricsAr: [
        'اكتمال ميثاق المشروع وهيكل WBS لجميع المشاريع',
        'مؤشر كفاءة الجدولة الزمنية (SPI) ≥ 1.0',
        'مؤشر كفاءة التكلفة (CPI) ≥ 1.0'
      ],
      kpiMetricsEn: [
        '100% Project Charters & WBS Structured',
        'Schedule Performance Index (SPI) ≥ 1.0',
        'Cost Performance Index (CPI) ≥ 1.0'
      ],
      linkedDocsAr: ['ميثاق المشروع المعتمد (Project Charter)', 'مخطط Gantt الزمني وهيكل WBS', 'مصفوفة تتبع الأنشطة والمخرجات'],
      linkedDocsEn: ['Approved Project Charter', 'Gantt Schedule & Field WBS Breakdown', 'Activity & Output Tracking Matrix'],
      steps: [
        {
          stepNumber: 1,
          titleAr: 'إنشاء ميثاق المشروع وتحديد النطاق والميزانية والمستهدفات',
          titleEn: 'Create Project Charter, Scope, Budget & Target Envelope',
          descriptionAr: 'تسمية المشروع، ربطه بالبرنامج التابع له، تحديد النطاق الجغرافي، الميزانية المحجوزة، وتاريخ البدء والانتهاء وعدد المستفيدين.',
          descriptionEn: 'Initiate project card, link to parent program, assign geographic territory, encumber budget, set dates and targets.',
          roleAr: 'مدير المشروع',
          roleEn: 'Project Manager',
          raci: { responsible: 'مدير المشروع', accountable: 'مدير البرامج', consulted: 'المدير المالي', informed: 'المنسق الميداني' },
          inputsAr: ['مقترح المشروع المعتمد', 'مخصص الميزانية من المنحة', 'دراسة الاحتياج الميداني'],
          inputsEn: ['Approved Project Proposal', 'Grant Budget Allocation', 'Needs Assessment'],
          systemActionsAr: ['حفظ سجل المشروع في projects', 'حجز الميزانية وتخصيص مركز التكلفة', 'توليد كود المشروع الفريد'],
          systemActionsEn: ['Insert project in projects table', 'Encumber budget and link cost center', 'Generate unique code'],
          outputAr: 'بطاقة مشروع معتمدة ومحجوزة الميزانية وجاهزة للتنفيذ',
          outputEn: 'Approved, budgeted, and execution-ready project charter',
          auditRuleAr: 'تسجيل اعتماد المشروع ورقم الميزانية المحجوزة.',
          auditRuleEn: 'Log project approval and encumbered budget limit.',
          linkedScreen: 'projects',
          linkedDocTitleAr: 'وثيقة ميثاق المشروع المعتمد',
          linkedDocTitleEn: 'Master Project Charter Dossier',
          aiGuidanceAr: 'يمكن استخدام الذكاء الاصطناعي لتوقع المخاطر التشغيلية وتوليد مؤشرات الأثر المقترحة.',
          aiGuidanceEn: 'Use AI to predict operational bottlenecks.'
        },
        {
          stepNumber: 2,
          titleAr: 'تفكيك العمل إلى أنشطة WBS وجدولتها زمنياً ومكانياً',
          titleEn: 'Deconstruct Work into WBS Activities & Geospatial Scheduling',
          descriptionAr: 'تفكيك المشروع إلى أنشطة ومهام فرعية، تعيين المسؤول الميداني، تحديد تاريخ الإنجاز، وربط النشاط بموقع جغرافي دقيق.',
          descriptionEn: 'Decompose project into WBS activities and subtasks, assign field focal points, set milestone dates, and geo-tag distribution sites.',
          roleAr: 'مهندس التخطيط والـ WBS',
          roleEn: 'WBS Planning Lead',
          raci: { responsible: 'مهندس التخطيط', accountable: 'مدير المشروع', consulted: 'فريق الميدان', informed: 'مسؤول MEAL' },
          inputsAr: ['قائمة الأنشطة الميدانية', 'الجدول الزمني التقديري', 'مواقع التدخل الجغرافي'],
          inputsEn: ['Field Activity Schedule', 'Estimated Gantt Milestones', 'Intervention GPS Points'],
          systemActionsAr: ['إدراج الأنشطة في activities', 'تحديث مخطط Gantt التفاعلي', 'إسقاط المواقع على الخريطة المكانية GIS'],
          systemActionsEn: ['Populate activities table', 'Update interactive Gantt chart', 'Plot GPS coordinates on GIS Map'],
          outputAr: 'هيكل WBS متكامل ومربوط بالخريطة التفاعلية',
          outputEn: 'Integrated WBS structure linked to interactive GIS map',
          auditRuleAr: 'تثبيت خط الأساس الزمني (Baseline) لمنع الانحراف غير المبرر.',
          auditRuleEn: 'Lock project baseline schedule to track operational variance.',
          linkedScreen: 'activities',
          linkedDocTitleAr: 'هيكل تفكيك العمل الميداني WBS ومخطط Gantt',
          linkedDocTitleEn: 'Field WBS Breakdown & Gantt Timeline Schedule',
          aiGuidanceAr: 'النظام يحسب المسار الحرج (Critical Path) تلقائياً لتنبيه الإدارة لأي نشاط قد يؤخر تسليم المشروع.',
          aiGuidanceEn: 'The system computes the Critical Path automatically.'
        }
      ]
    },
    {
      id: 'PHASE-06',
      phaseNumber: 6,
      code: 'NEB-06/07',
      titleAr: 'المرحلة 6: حصر المستفيدين، الخدمات، بحث الأسر، وكفالات الأيتام',
      titleEn: 'Phase 6: Beneficiaries, Social Welfare, Sponsorships & Deduplication OS',
      category: 'welfare',
      nebDomain: 'NEB-06 Service Delivery OS & NEB-07 Community OS',
      priorityLevelAr: 'أولوية عالية',
      priorityLevelEn: 'P2 High Priority',
      badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
      targetTab: 'beneficiaries',
      estimatedDurationAr: 'مستمر / دوري',
      estimatedDurationEn: 'Ongoing / Recurring',
      responsibleRolesAr: ['مسؤول بيانات المستفيدين', 'باحث اجتماعي ميداني', 'مشرف كفالات الأيتام'],
      responsibleRolesEn: ['Beneficiary Data Specialist', 'Field Social Researcher', 'Sponsorship Supervisor'],
      descriptionAr: 'بناء السجل الموحد للمستفيدين، تطبيق فحص منع الازدواجية بالرقم الوطني، حساب مؤشر الفقر والاستحقاق، وإدارة كفالات الأيتام.',
      descriptionEn: 'Build unified beneficiary registry, execute National ID deduplication, compute poverty index, and manage sponsorships.',
      strategicObjectiveAr: 'ضمان وصول المساعدات لمستحقيها الفعليين ومنع الازدواجية وتحقيق أثر الرعاية المستدام.',
      strategicObjectiveEn: 'Ensure aid reaches genuine beneficiaries and eliminate duplicate payouts.',
      kpiMetricsAr: [
        'نسبة دقة بيانات المستفيدين 100%',
        'انعدام الازدواجية في الاستلام (0% Duplicate Aid)',
        'انتظام صرف كفالات الأيتام الشهرية 100%'
      ],
      kpiMetricsEn: [
        '100% Beneficiary Data Accuracy',
        '0% Duplicate Aid Disbursement',
        '100% Monthly Orphan Stipend Regularity'
      ],
      linkedDocsAr: ['استمارة البحث الاجتماعي الميداني المعتمدة', 'بطاقة المستفيد الإلكترونية المشفرة (QR Pass)', 'عقد الكفالة وسجل الرعاية الدوري'],
      linkedDocsEn: ['Field Social Assessment Form', 'Encrypted Beneficiary Digital QR Pass', 'Official Sponsorship Contract & Welfare Dossier'],
      steps: [
        {
          stepNumber: 1,
          titleAr: 'البحث الاجتماعي الميداني والتسجيل في السجل الموحد',
          titleEn: 'Field Social Assessment & Unified Beneficiary Registration',
          descriptionAr: 'إدخال بيانات رب الأسرة، الأفراد، الحالة الاجتماعية، المعالين، المسكن، الدخل، وفحص منع التكرار الفوري برقم الهوية.',
          descriptionEn: 'Capture household head credentials, dependents, vulnerability metrics, shelter condition, and execute real-time National ID deduplication.',
          roleAr: 'باحث ميداني / مدخل بيانات',
          roleEn: 'Field Researcher / Enumerator',
          raci: { responsible: 'الباحث الميداني', accountable: 'مسؤول المستفيدين', consulted: 'اللجنة المجتمعية', informed: 'مدير العمليات' },
          inputsAr: ['بطاقة الهوية الوطنية / كرت العائلة', 'استمارة البحث الميداني', 'تقرير السكن والدخل'],
          inputsEn: ['National ID / Family Card', 'Field Survey Form', 'Housing & Income Verification'],
          systemActionsAr: ['فحص عدم وجود تكرار في beneficiaries', 'حساب مؤشر الاستحقاق والفقر الآلي', 'توليد كود المستفيد الموحد وبطاقة QR'],
          systemActionsEn: ['Run deduplication query', 'Compute poverty score', 'Issue unique ID & QR card'],
          outputAr: 'ملف مستفيد موثق ومعتمد في السجل المركزي',
          outputEn: 'Verified and unique beneficiary profile in master registry',
          auditRuleAr: 'تسجيل معرف الباحث الميداني والإحداثيات الجغرافية لموقع الأسرة.',
          auditRuleEn: 'Record researcher ID and GPS coordinate audit stamp.',
          linkedScreen: 'beneficiaries',
          linkedDocTitleAr: 'استمارة البحث الاجتماعي وبطاقة المستفيد المعتمدة',
          linkedDocTitleEn: 'Social Survey Form & Digital Beneficiary ID Card',
          aiGuidanceAr: 'النظام يحسب درجة الفقر والاستحقاق تلقائياً لمساعدة لجان الفرز في توجيه المساعدات للأسر الأكثر تضرراً.',
          aiGuidanceEn: 'The system computes vulnerability scoring automatically.'
        },
        {
          stepNumber: 2,
          titleAr: 'ربط الكفلاء بالأيتام وإدارة المخصصات الشهرية',
          titleEn: 'Match Sponsors with Orphans & Manage Monthly Stipends',
          descriptionAr: 'تسجيل الكفلاء وتفضيلاتهم، ربطهم بالأيتام، توثيق عقود الكفالة، وجدولة المخصصات الشهرية وتوليد تقارير الأثر.',
          descriptionEn: 'Register sponsors, bind to eligible orphans, execute digital sponsorship agreements, and schedule monthly payouts.',
          roleAr: 'مشرف الكفالات / المحاسب المالي',
          roleEn: 'Sponsorship Officer / Accountant',
          raci: { responsible: 'مشرف الكفالات', accountable: 'المدير المالي', consulted: 'الباحث الميداني', informed: 'الكفيل' },
          inputsAr: ['بيانات الكفيل والتبرع', 'ملف اليتيم المعتمد', 'رقم الحساب البنكي / وسيلة الاستلام'],
          inputsEn: ['Sponsor Pledge & Contact', 'Approved Orphan Dossier', 'Disbursement Channel Data'],
          systemActionsAr: ['تحديث سجل الكفالة في sponsorships', 'توليد جدول الاستحقاق الشهري', 'إرسال بطاقة الكفالة الرقمية للكفيل'],
          systemActionsEn: ['Update sponsorships table', 'Schedule monthly disbursement roster', 'Dispatch digital card to sponsor'],
          outputAr: 'عقد كفالة مفعل وسند صرف مخصصات شهري منتظم',
          outputEn: 'Active sponsorship agreement & automated monthly stipend roster',
          auditRuleAr: 'ربط رقم الكفيل بملف اليتيم وتثبيت القيمة المحاسبية.',
          auditRuleEn: 'Bind sponsor ID to orphan record and fix ledger pledge.',
          linkedScreen: 'sponsorships',
          linkedDocTitleAr: 'عقد كفالة يتيم وبطاقة الرعاية المعتمدة',
          linkedDocTitleEn: 'Orphan Sponsorship Agreement & Welfare Pass',
          aiGuidanceAr: 'النظام يولد تقارير أثر سنوية موجهة للكفلاء تتضمن التقدم الدراسي والصحي لليتيم.',
          aiGuidanceEn: 'The system generates annual impact reports for sponsors detailing academic and health milestones.'
        }
      ]
    },
    {
      id: 'PHASE-07',
      phaseNumber: 7,
      code: 'NEB-14',
      titleAr: 'المرحلة 7: سلاسل الإمداد، المشتريات، عروض الأسعار، والمخازن الإغاثية',
      titleEn: 'Phase 7: Procurement, 3-Way Matching, Relief Inventory & Contracts OS',
      category: 'procurement',
      nebDomain: 'NEB-14 Procurement & Tenders OS',
      priorityLevelAr: 'أولوية تشغيلية عالية',
      priorityLevelEn: 'P2 High Operational',
      badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
      targetTab: 'inventory',
      estimatedDurationAr: '3 - 5 أيام',
      estimatedDurationEn: '3 - 5 Days',
      responsibleRolesAr: ['مسؤول المشتريات والمناقصات', 'أمين المستودع الإغاثي', 'مسؤول العقود'],
      responsibleRolesEn: ['Procurement Lead', 'Warehouse Keeper', 'Contracts Specialist'],
      descriptionAr: 'إدارة دورة المشتريات، عروض الأسعار، وتطبيق المطابقة الثلاثية 3-Way Match (طلب الشراء PR + أمر التوريد PO + محضر الاستلام GRN)، وحركة المخزون وتواريخ الصلاحية.',
      descriptionEn: 'Manage procurement lifecycle, tenders, RFQs, enforce 3-Way Matching (PR + PO + GRN), and track warehouse stock and expiration dates.',
      strategicObjectiveAr: 'تأمين المواد والمستلزمات بأفضل الأسعار وأعلى جودة وحماية المخزون من التلف أو العجز.',
      strategicObjectiveEn: 'Procure high-quality relief supplies at competitive rates and maintain zero warehouse inventory discrepancies.',
      kpiMetricsAr: [
        'تطبيق المطابقة الثلاثية 3-Way Match بنسبة 100%',
        'دقة الجرد المخزني الفعلي مع المنظومة 100%',
        'انعدام الأصناف منتهية الصلاحية (Zero Waste)'
      ],
      kpiMetricsEn: [
        '100% 3-Way Match Enforcement',
        '100% Physical vs System Stock Concordance',
        'Zero Expired Inventory Losses'
      ],
      linkedDocsAr: ['طلب الشراء المعتمد (PR) وأمر التوريد (PO)', 'محضر الفحص والاستلام المخزني (GRN)', 'عقد التوريد وكشف المطابقة الثلاثية'],
      linkedDocsEn: ['Purchase Requisition (PR) & Purchase Order (PO)', 'Goods Received Note (GRN) & Inspection Report', 'Vendor Contract & 3-Way Match Dossier'],
      steps: [
        {
          stepNumber: 1,
          titleAr: 'طرح طلب الشراء وعروض الأسعار وإصدار أمر التوريد (PO)',
          titleEn: 'Issue Purchase Requisition (PR), RFQ & Purchase Order (PO)',
          descriptionAr: 'رفع طلب شراء محدد المواصفات والكميات، حجز الميزانية، مقارنة عروض الأسعار، وإصدار أمر التوريد الرسمي للمورد الفائز.',
          descriptionEn: 'Submit purchase requisition, encumber project budget, evaluate supplier quotes, and award Purchase Order (PO).',
          roleAr: 'مسؤول المشتريات / لجنة المشتريات',
          roleEn: 'Procurement Specialist',
          raci: { responsible: 'مسؤول المشتريات', accountable: 'المدير المالي', consulted: 'مدير المشروع', informed: 'المورد المعتمد' },
          inputsAr: ['طلب الشراء المعتمد', 'عروض أسعار الموردين الثلاثة', 'جدول المقارنة الفنية والمالية'],
          inputsEn: ['Approved Requisition Form', 'Three Competitive Quotes', 'Bid Evaluation Matrix'],
          systemActionsAr: ['تسجيل أمر الشراء في purchase_orders', 'حجز الميزانية في مخصص المشروع', 'إرسال أمر التوريد الإلكتروني للمورد'],
          systemActionsEn: ['Insert PO in purchase_orders table', 'Hard-lock budget allocation', 'Dispatch digital PO to vendor'],
          outputAr: 'أمر توريد رسمي معتمد ومحجوز الميزانية',
          outputEn: 'Official approved PO with locked budget ceiling',
          auditRuleAr: 'توثيق قرار لجنة المشتريات وتثبيت رقم أمر التوريد.',
          auditRuleEn: 'Record procurement committee resolution and PO serial.',
          linkedScreen: 'contracts',
          linkedDocTitleAr: 'أمر التوريد الرسمي وعقد الشراء المعتمد',
          linkedDocTitleEn: 'Official Purchase Order (PO) & Procurement Contract',
          aiGuidanceAr: 'محرك المشتريات يقارن الأسعار مع قاعدة بيانات الأسعار التاريخية لضمان عدم وجود مبالغة في التكاليف.',
          aiGuidanceEn: 'Procurement engine benchmarks vendor quotes against historical price index.'
        },
        {
          stepNumber: 2,
          titleAr: 'استلام المواد وفحصها وإصدار محضر الاستلام المخزني (GRN)',
          titleEn: 'Receive Goods, Quality Audit & Issue GRN',
          descriptionAr: 'معاينة البضاعة الموردة، فحص الجودة والمطابقة، تسجيل أرقام الدفعات وتواريخ الصلاحية، وتوليد محضر الاستلام المخزني GRN.',
          descriptionEn: 'Inspect delivered items, verify specs, log batch numbers & expiry dates, and generate Goods Received Note (GRN).',
          roleAr: 'أمين المستودع / لجنة الفحص',
          roleEn: 'Warehouse Keeper / Inspection Team',
          raci: { responsible: 'أمين المستودع', accountable: 'مدير اللوجستيات', consulted: 'مسؤول المشتريات', informed: 'المحاسب المالي' },
          inputsAr: ['إشعار تسليم المورد', 'أمر الشراء المرجعي PO', 'محضر الفحص الفني'],
          inputsEn: ['Vendor Delivery Note', 'Reference Purchase Order', 'Technical Inspection Slip'],
          systemActionsAr: ['تحديث رصيد المخزون في inventory_items', 'إصدار سند الاستلام GRN', 'إشعار المحاسبة بجاهزية التسوية المالية'],
          systemActionsEn: ['Increment stock in inventory_items table', 'Generate official GRN record', 'Notify finance of clearance readiness'],
          outputAr: 'سند استلام مخزني معتمد ومخزون مضاف للمستودع',
          outputEn: 'Approved Goods Received Note (GRN) and updated inventory ledger',
          auditRuleAr: 'تثبيت رقم الدفعة وتاريخ الصلاحية وتوقيع أمين المخزن.',
          auditRuleEn: 'Record batch number, expiry date, and warehouse officer hash.',
          linkedScreen: 'inventory',
          linkedDocTitleAr: 'محضر الفحص وسند الاستلام المخزني (GRN)',
          linkedDocTitleEn: 'Goods Received Note (GRN) & Warehouse Inspection Sheet',
          aiGuidanceAr: 'النظام يولد تنبيهات فورية للمواد التي يقترب تاريخ انتهاء صلاحيتها بأقل من 90 يوماً.',
          aiGuidanceEn: 'The system triggers automated warnings for inventory items approaching expiry.'
        }
      ]
    },
    {
      id: 'PHASE-08',
      phaseNumber: 8,
      code: 'NEB-05',
      titleAr: 'المرحلة 8: العمليات والتوزيع الميداني وتوثيق البصمة وGPS والعمل بدون إنترنت',
      titleEn: 'Phase 8: Field Operations, GPS Distribution & Offline-First Execution OS',
      category: 'operations',
      nebDomain: 'NEB-05 Operations OS (Field Execution)',
      priorityLevelAr: 'أولوية تشغيلية',
      priorityLevelEn: 'P2 Operational',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      targetTab: 'activities',
      estimatedDurationAr: 'مستمر أثناء الحملات',
      estimatedDurationEn: 'Active Campaign Lifecycle',
      responsibleRolesAr: ['مدير العمليات الميدانية', 'قائد فريق التوزيع', 'مسؤول التوثيق والمتابعة'],
      responsibleRolesEn: ['Field Operations Manager', 'Distribution Team Lead', 'MEAL Field Officer'],
      descriptionAr: 'إدارة الحملات الإغاثية والتوزيع الميداني عبر الأجهزة اللوحية وتوثيق الإحداثيات GPS والتوقيع الرقمي مع دعم العمل بدون إنترنت (Offline-First).',
      descriptionEn: 'Deploy mobile relief distribution campaigns via tablets with GPS geofencing, digital signatures, and offline-first data sync.',
      strategicObjectiveAr: 'تنفيذ ميداني موثق بنسبة 100% يمنع الازدواجية ويوثق استلام المستفيد بالصوت والصورة والإحداثيات.',
      strategicObjectiveEn: '100% verified field distribution with geo-stamps, e-signatures, and instant audit trail.',
      kpiMetricsAr: [
        'دقة التوزيع الميداني ومطابقة الكشوفات 100%',
        'توثيق الإحداثيات الجغرافية والتوقيع 100%',
        'مزامنة البيانات السحابية بدون فقدان (Zero Data Loss)'
      ],
      kpiMetricsEn: [
        '100% Distribution Roster Concordance',
        '100% GPS Coordinate & E-Signature Stamping',
        'Zero Field Data Loss via Offline-First Sync'
      ],
      linkedDocsAr: ['كشف التوزيع الميداني المعتمد', 'إيصال الاستلام الموثق بالبصمة والتوقيع (POD)', 'تقرير الإنجاز الميداني وخريطة التوزيع'],
      linkedDocsEn: ['Approved Field Distribution Roster', 'Proof of Delivery (POD) with GPS & E-Signature', 'Field Execution Report & Spatial Heatmap'],
      steps: [
        {
          stepNumber: 1,
          titleAr: 'تجهيز كشف التوزيع وتوليد كروت الاستلام الإلكترونية QR',
          titleEn: 'Prepare Distribution Roster & Issue Beneficiary QR Passes',
          descriptionAr: 'استخراج قائمة المستحقين المعتمدة للمشروع الإغاثي وتوليد كروت الاستلام الإلكترونية المشفرة بباركود QR لتسهيل المسح الميداني السريع.',
          descriptionEn: 'Extract approved beneficiary roster for the relief campaign and issue encrypted digital QR passes for rapid contactless field scanning.',
          roleAr: 'مسؤول بيانات المستفيدين / قائد الفريق',
          roleEn: 'Data Specialist / Team Lead',
          raci: { responsible: 'مسؤول البيانات', accountable: 'مدير العمليات', consulted: 'الباحث الميداني', informed: 'فريق التوزيع' },
          inputsAr: ['قائمة المستفيدين المعتمدة للمشروع', 'أرقام كروت الهوية', 'موقع نقطة التوزيع'],
          inputsEn: ['Approved Project Beneficiary List', 'National ID Numbers', 'Distribution Point Location'],
          systemActionsAr: ['تجميد كشف التوزيع برقم إصدار ثابت', 'توليد رموز الـ QR المشفرة', 'تجهيز حزمة المزامنة للعمل الميداني Offline'],
          systemActionsEn: ['Freeze distribution roster version', 'Generate encrypted QR payloads', 'Package offline sync cache for field tablets'],
          outputAr: 'كشف توزيع نهائي معتمد وحزم كروت المستفيدين',
          outputEn: 'Final verified distribution roster and QR pass packets',
          auditRuleAr: 'قفل كشف التوزيع لمنع أي تعديل أو إضافة أثناء التنفيذ.',
          auditRuleEn: 'Lock distribution roster to guarantee version integrity.',
          linkedScreen: 'activities',
          linkedDocTitleAr: 'كشف التوزيع الميداني المعتمد وحزمة بطاقات الـ QR',
          linkedDocTitleEn: 'Official Field Distribution Roster & QR Packets',
          aiGuidanceAr: 'النظام يدعم التحميل المسبق لكشوفات التوزيع على الهواتف للعمل في القرى والمناطق النائية الخالية من شبكة الإنترنت.',
          aiGuidanceEn: 'The system pre-caches distribution rosters onto mobile devices.'
        },
        {
          stepNumber: 2,
          titleAr: 'التنفيذ الميداني وتوثيق البصمة والتوقيع وإحداثيات GPS',
          titleEn: 'Field Distribution, E-Signatures & GPS Timestamping',
          descriptionAr: 'مسح باركود المستفيد عبر كاميرا الجهاز اللوحي، التقاط التوقيع الرقمي أو البصمة، تسجيل إحداثيات GPS الحية، وتأكيد صرف الحصة.',
          descriptionEn: 'Scan beneficiary QR pass via tablet camera, capture e-signature or fingerprint, log live GPS coordinates, and confirm basket handover.',
          roleAr: 'فريق التوزيع الميداني',
          roleEn: 'Distribution Field Crew',
          raci: { responsible: 'فريق التوزيع', accountable: 'مدير العمليات الميدانية', consulted: 'مسؤول الرقابة والتقييم MEAL', informed: 'المدير التنفيذي' },
          inputsAr: ['تطبيق NexoraOS الميداني', 'باركود المستفيد QR', 'الحصة الإغاثية المصروفة'],
          inputsEn: ['NexoraOS Mobile App', 'Beneficiary QR Pass', 'Disbursed Relief Item/Basket'],
          systemActionsAr: ['تسجيل عملية الصرف وتوثيق الإحداثيات GPS', 'حفظ التوقيع الرقمي وصورة الاستلام', 'المزامنة التلقائية فور توفر الإنترنت'],
          systemActionsEn: ['Log handover event and GPS stamp', 'Store digital signature & delivery photo', 'Auto-sync to cloud upon network detection'],
          outputAr: 'إيصال تسليم موثق ومطابق لا يقبل الشك',
          outputEn: 'Immutable Proof of Delivery (POD) record with full audit trail',
          auditRuleAr: 'تثبيت الإحداثيات الجغرافية ورقم الباحث وهيكل التوقيع الرقمي.',
          auditRuleEn: 'Anchor GPS geofence stamp, enumerator ID, and signature hash.',
          linkedScreen: 'geospatial',
          linkedDocTitleAr: 'إيصال استلام ميداني موثق (Proof of Delivery)',
          linkedDocTitleEn: 'Verified Proof of Delivery (POD) Audit Slip',
          aiGuidanceAr: 'يتم فحص النطاق الجغرافي (Geofencing) للتأكد من أن عملية التسليم تمت في الموقع المعتمد لنقطة التوزيع.',
          aiGuidanceEn: 'Geofencing algorithms verify that handover occurred strictly within the authorized distribution zone.'
        }
      ]
    },
    {
      id: 'PHASE-09',
      phaseNumber: 9,
      code: 'NEB-11..13',
      titleAr: 'المرحلة 9: المتابعة والتقييم (MEAL)، تقارير الأثر، والرقابة الختامية',
      titleEn: 'Phase 9: Audit, Impact Measurement, CHS/Sphere Standards & Executive Cockpit',
      category: 'governance',
      nebDomain: 'NEB-11 Knowledge, NEB-12 Digital & NEB-13 AI Impact OS',
      priorityLevelAr: 'أولوية حوكمية مستمرة',
      priorityLevelEn: 'P1 Executive Governance',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      targetTab: 'reports',
      estimatedDurationAr: 'شهري / ربع سنوي / سنوي',
      estimatedDurationEn: 'Monthly / Quarterly / Annual',
      responsibleRolesAr: ['مسؤول المتابعة والتقييم MEAL', 'المدير المالي', 'المدير التنفيذي العام'],
      responsibleRolesEn: ['MEAL Officer', 'Finance Director', 'CEO'],
      descriptionAr: 'إغلاق المشاريع، مطابقة الحسابات الختامية، قياس مؤشرات الأثر الإنساني والمعايير الدولية (Sphere / CHS)، أرشفة الدروس المستفادة، وتوليد التقارير التنفيذية.',
      descriptionEn: 'Close out completed projects, reconcile final accounts, quantify Sphere/CHS impact metrics, archive lessons learned, and generate executive reports for leadership and donors.',
      strategicObjectiveAr: 'ترسيخ الشفافية المطلقة، استدامة الأثر الإنساني، والتحسين المستمر للأداء المؤسسي.',
      strategicObjectiveEn: 'Ensure absolute institutional transparency and measure sustainable impact.',
      kpiMetricsAr: [
        'إصدار التقارير الختامية للمشاريع بنسبة 100%',
        'مطابقة مؤشرات المعايير الإنسانية الدولية Sphere/CHS',
        'أرشفة كافة المستندات وسجلات التدقيق بنسبة 100%'
      ],
      kpiMetricsEn: [
        '100% Project Final Reports Delivered',
        'Full Compliance with Sphere & CHS Humanitarian Standards',
        '100% Document & Audit Trail Archival'
      ],
      linkedDocsAr: ['تقرير قياس الأثر الإنساني الشامل (Sphere / CHS)', 'التقرير المالي الختامي المدقق', 'محضر إغلاق المشروع وأرشفة الدروس المستفادة'],
      linkedDocsEn: ['Comprehensive Sphere/CHS Impact Report', 'Audited Final Financial Statement', 'Project Closeout & Lessons Learned Dossier'],
      steps: [
        {
          stepNumber: 1,
          titleAr: 'التقييم الختامي وقياس الأثر الإنساني ومعايير Sphere / CHS',
          titleEn: 'Final Evaluation, Impact Measurement & Sphere/CHS Audit',
          descriptionAr: 'حصر المخرجات النهائية، قياس رضا المستفيدين، مقارنة المنجز الفعلي بالمستهدف، واحتساب مؤشرات المعايير الإنسانية الدولية.',
          descriptionEn: 'Consolidate final outputs, measure beneficiary satisfaction, compare actuals vs plan, and evaluate international humanitarian compliance scores.',
          roleAr: 'مسؤول المتابعة والتقييم MEAL',
          roleEn: 'MEAL Lead',
          raci: { responsible: 'مسؤول MEAL', accountable: 'المدير التنفيذي', consulted: 'مدير المشروع', informed: 'المانحون والشركاء' },
          inputsAr: ['سجلات التوزيع الميداني المكتملة', 'استبيانات رضا المستفيدين', 'تقارير الإنجاز الدورية'],
          inputsEn: ['Completed Field Delivery Records', 'Beneficiary Feedback Surveys', 'Periodic Progress Reports'],
          systemActionsAr: ['حساب مؤشرات الأثر الإجمالي في AI Impact Dashboard', 'توليد تقرير الأثر الإنساني بصيغة PDF الرسمية', 'أرشفة الوثائق في المكتبة الرقمية'],
          systemActionsEn: ['Compute aggregate impact in AI Impact Dashboard', 'Generate official PDF impact dossier', 'Archive records in digital knowledge vault'],
          outputAr: 'تقرير تقييم أثر رسمي شامل جاهز للمانحين والجهات الرسمية',
          outputEn: 'Official verified impact evaluation report for donors & regulators',
          auditRuleAr: 'تثبيت مؤشرات الأثر وقفل ملف تقييم المشروع.',
          auditRuleEn: 'Freeze impact metrics and lock project evaluation file.',
          linkedScreen: 'reports',
          linkedDocTitleAr: 'تقرير قياس الأثر الإنساني ومعايير Sphere المعتمد',
          linkedDocTitleEn: 'Sphere/CHS Humanitarian Impact & Compliance Dossier',
          aiGuidanceAr: 'الذكاء الاصطناعي يحلل بيانات التوزيع والرضا لتوليد الدروس المستفادة وتوصيات تحسين المشاريع القادمة.',
          aiGuidanceEn: 'Gemini AI synthesizes distribution data and beneficiary feedback into actionable lessons learned.'
        },
        {
          stepNumber: 2,
          titleAr: 'التسوية المالية النهائية، الأرشفة وسجل التدقيق الشامل',
          titleEn: 'Final Financial Reconciliation, Knowledge Archival & Audit Trail',
          descriptionAr: 'مطابقة المصروفات مع المنحة، إغلاق حساب المشروع، أرشفة كافة الفواتير والسندات في السجل الرقمي، واستعراض لوحة القيادة التنفيذية.',
          descriptionEn: 'Reconcile total expenditures with grant envelope, close project ledger, archive all vouchers in immutable repository, and review executive cockpit.',
          roleAr: 'المدير المالي / المدير التنفيذي',
          roleEn: 'Finance Director / CEO',
          raci: { responsible: 'المدير المالي', accountable: 'المدير التنفيذي', consulted: 'مراجع الحسابات القانوني', informed: 'مجلس الأمناء' },
          inputsAr: ['دفتر الأستاذ الختامي للمشروع', 'تقارير التسوية البنكية', 'سجل أوامر الشراء والمخزون'],
          inputsEn: ['Final Project Ledger', 'Bank Reconciliation Dossier', 'Procurement & Inventory Balance Sheet'],
          systemActionsAr: ['تحديث حالة المشروع إلى "مكتمل ومغلق"', 'توليد التقرير المالي النهائي المدقق', 'حفظ لقطة النسخ الاحتياطي للنظام'],
          systemActionsEn: ['Update project status to Completed & Closed', 'Generate final audited financial statement', 'Trigger automated system backup snapshot'],
          outputAr: 'مشروع مغلق ومطابق مالياً وإدارياً مع ملف تدقيق كامل',
          outputEn: 'Fully audited, reconciled, and closed project dossier',
          auditRuleAr: 'قفل الترحيل على حسابات المشروع نهائياً وتوثيق توقيع الإغلاق.',
          auditRuleEn: 'Permanently lock project ledger accounts and stamp executive sign-off.',
          linkedScreen: 'audit',
          linkedDocTitleAr: 'التقرير المالي الختامي ومحضر إغلاق المشروع',
          linkedDocTitleEn: 'Final Audited Financial Statement & Closeout Protocol',
          aiGuidanceAr: 'لوحة القيادة التنفيذية تقدم مؤشرات تحليلية فورية للرئيس التنفيذي ومجلس الإدارة عن كفاءة المؤسسة الإجمالية.',
          aiGuidanceEn: 'The Executive Cockpit delivers live macro-analytics to leadership.'
        }
      ]
    }
  ];

  // DATA: 10 Institutional Bylaws Chapters
  const bylawChapters: BylawArticle[] = [
    {
      id: 'BYLAW-CH1',
      chapterNumber: 1,
      chapterTitleAr: 'الباب الأول: الميثاق التأسيسي والهوية والحوكمة والقيادة العليا',
      chapterTitleEn: 'Chapter 1: Foundational Charter, Identity & Executive Governance',
      articles: [
        {
          articleNumber: 1,
          titleAr: 'مادة (1): الهوية والترخيص والعملة السيادية',
          titleEn: 'Article 1: Corporate Identity, Licensing & Sovereign Currency',
          contentAr: 'تلتزم المؤسسة بالاسم والشعار والترخيص الوزاري المعتمد وتكون العملة الرسمية الأساسية في المنظومة هي الريال اليمني (YER) مع دعم تحويل العملات الإقليمية والدولية (SAR / USD) بحسب الأسعار الرسمية.',
          contentEn: 'The organization operates under its official ministerial license and primary base currency (YER) with automated multi-currency support (SAR/USD).',
          linkedScreen: 'settings',
          linkedDoc: 'وثيقة الهوية والترخيص الرسمي'
        },
        {
          articleNumber: 2,
          titleAr: 'مادة (2): التخطيط الاستراتيجي ومؤشرات الأداء (KPIs)',
          titleEn: 'Article 2: Strategic Planning & Institutional KPIs',
          contentAr: 'تُبنى خطط المؤسسة التنفيذية ومشاريعها انطلاقاً من الأهداف الاستراتيجية المعتمدة في النظام، ويخضع كل قطاع لمؤشرات أداء رقمية دورية تُقاس تلقائياً.',
          contentEn: 'All organizational initiatives derive strictly from approved strategic pillars and are evaluated via automated KPI tracking.',
          linkedScreen: 'strategic_planning',
          linkedDoc: 'وثيقة ميثاق الخطة الاستراتيجية وبطاقات الأداء (BSC)'
        },
        {
          articleNumber: 3,
          titleAr: 'مادة (3): مصفوفة الصلاحيات وتفويض التوقيعات',
          titleEn: 'Article 3: Delegation of Authority & Approval Matrix',
          contentAr: 'لا يجوز إجراء أي التزام مالي أو إداري إلا وفق مصفوفة الصلاحيات المبرمجة بالنظام، ويُعد أي تجاوز غير معتمد باطلاً وتتولى المنظومة حظره تلقائياً.',
          contentEn: 'Financial and administrative commitments are strictly bounded by the automated RBAC matrix; unauthorized overrides are blocked by default.',
          linkedScreen: 'control_panel',
          linkedDoc: 'مصفوفة تفويض الصلاحيات والحوكمة المعتمدة'
        }
      ]
    },
    {
      id: 'BYLAW-CH2',
      chapterNumber: 2,
      chapterTitleAr: 'الباب الثاني: اللائحة المالية الموحدة، المحاسبة المزدوجة IPSAS، وإدارة الصناديق',
      chapterTitleEn: 'Chapter 2: Financial Regulations, IPSAS Ledger & Treasury Controls',
      articles: [
        {
          articleNumber: 4,
          titleAr: 'مادة (4): قيد التوازن المحاسبي الإلزامي (Debit = Credit)',
          titleEn: 'Article 4: Mandatory Double-Entry Balance Constraint',
          contentAr: 'تُقيد كافة العمليات المالية بنظام القيد المزدوج المتوازن (إجمالي المدين = إجمالي الدائن) ويحظر النظام برمجياً ترحيل أي سند أو قيد يحتوي على فارق محاسبي.',
          contentEn: 'All accounting postings must maintain strict double-entry equilibrium (total_debit = total_credit); unbalanced vouchers cannot be saved or posted.',
          linkedScreen: 'finance',
          linkedDoc: 'سند الصرف المالي وقيد اليومية المزدوج'
        },
        {
          articleNumber: 5,
          titleAr: 'مادة (5): إدارة العهد المالية والتسويات المؤقتة',
          titleEn: 'Article 5: Petty Cash, Advances & Settlement Timeline',
          contentAr: 'تُصرف العهد المالية المؤقتة لمدراء المشاريع والباحثين الميدانيين بسند رسمي وتلتزم الجهة المستلمة بتصفيتها خلال 15 يوماً من انتهاء النشاط مع الفواتير المعززة.',
          contentEn: 'Operational advances must be formally encumbered and cleared within 15 days of activity completion with verified receipts.',
          linkedScreen: 'finance',
          linkedDoc: 'سند تصفية العهدة المالية والمرفقات'
        }
      ]
    },
    {
      id: 'BYLAW-CH3',
      chapterNumber: 3,
      chapterTitleAr: 'الباب الثالث: لائحة إدارة البرامج والمشاريع وهياكل تفكيك العمل WBS',
      chapterTitleEn: 'Chapter 3: Program & Project Management & Field WBS Regulations',
      articles: [
        {
          articleNumber: 6,
          titleAr: 'مادة (6): ميثاق المشروع واعتماد خط الأساس الزمني',
          titleEn: 'Article 6: Project Charter & Baseline Schedule Freezing',
          contentAr: 'يُشترط لبدء أي مشروع إصدار ميثاق المشروع المعتمد وتفكيك الأنشطة إلى هيكل WBS وتحديد خط الأساس الزمني وميزانية البنود المحجوزة.',
          contentEn: 'Project execution requires an authorized Project Charter, detailed WBS decomposition, and locked schedule/budget baselines.',
          linkedScreen: 'projects',
          linkedDoc: 'ميثاق المشروع المعتمد وهيكل WBS'
        }
      ]
    },
    {
      id: 'BYLAW-CH4',
      chapterNumber: 4,
      chapterTitleAr: 'الباب الرابع: لائحة المستفيدين والكفالات والتحقق ومنع الازدواجية',
      chapterTitleEn: 'Chapter 4: Beneficiary Services, Welfare, Deduplication & Sponsorships',
      articles: [
        {
          articleNumber: 7,
          titleAr: 'مادة (7): السجل الموحد والفحص الإلزامي لمنع الازدواجية',
          titleEn: 'Article 7: Unified Beneficiary Registry & Mandatory Deduplication',
          contentAr: 'يُحظر صرف أي مساعدة إلا بعد فحص الرقم الوطني في السجل المركزي الموحد للتأكد من عدم استلام الأسرة لنفس المساعدة من مشروع موازٍ.',
          contentEn: 'Disbursements require automated National ID cross-verification in the master registry to eliminate duplicate aid delivery.',
          linkedScreen: 'beneficiaries',
          linkedDoc: 'استمارة البحث الاجتماعي وبطاقة المستفيد المشفرة (QR Pass)'
        }
      ]
    },
    {
      id: 'BYLAW-CH5',
      chapterNumber: 5,
      chapterTitleAr: 'الباب الخامس: لائحة سلاسل الإمداد، المشتريات، والمطابقة الثلاثية والمخازن',
      chapterTitleEn: 'Chapter 5: Procurement, 3-Way Matching & Relief Warehouse Logistics',
      articles: [
        {
          articleNumber: 8,
          titleAr: 'مادة (8): المطابقة الثلاثية الإلزامية للصرف (3-Way Match)',
          titleEn: 'Article 8: Mandatory 3-Way Match for Supplier Payments',
          contentAr: 'لا تُصرف مستحقات أي مورد إلا بعد اكتمال المطابقة الثلاثية في النظام بين: طلب الشراء (PR)، أمر التوريد (PO)، ومحضر الفحص والاستلام المخزني (GRN).',
          contentEn: 'Supplier invoice settlements require complete 3-Way Matching between PR, PO, and verified warehouse GRN.',
          linkedScreen: 'contracts',
          linkedDoc: 'محضر الفحص وسند الاستلام المخزني (GRN)'
        }
      ]
    }
  ];

  // DATA: 10 Master Job Descriptions
  const jobProfiles: JobDescriptionProfile[] = [
    {
      id: 'ROLE-CEO',
      roleCode: 'EXEC-01',
      titleAr: 'المدير التنفيذي العام (CEO)',
      titleEn: 'Chief Executive Officer (CEO)',
      departmentAr: 'الإدارة العليا والتنفيذية',
      departmentEn: 'Executive Directorate',
      securityLevel: 'Level 5 (Super Admin)',
      maxApprovalAmount: 'غير محدود (وفق ميثاق الحوكمة)',
      reportsToAr: 'مجلس الأمناء / الهيئة الإدارية',
      reportsToEn: 'Board of Trustees',
      supervisesAr: ['المدير المالي', 'مدير البرامج', 'مسؤول MEAL', 'مسؤول HR'],
      supervisesEn: ['CFO', 'Programs Director', 'MEAL Officer', 'HR Officer'],
      purposeAr: 'القيادة التنفيذية الشاملة للمؤسسة، الإشراف على تنفيذ الخطط الاستراتيجية، تمثيل المؤسسة أمام المانحين والجهات الرسمية، وضمان الامتثال التام للحوكمة.',
      purposeEn: 'Executive leadership, overall organizational governance, strategic plan execution, and donor/regulatory representation.',
      targetTab: 'strategic_planning',
      dailyTasksAr: [
        'مراجعة لوحة القيادة التنفيذية التنفيذية (Executive Cockpit) ومؤشرات السيولة الحية.',
        'اعتماد طلبات الصرف والمشاريع والموافقات المحالة من المستوى الرابع (Level 4).',
        'متابعة البلاغات والتنبيهات الأمنية الحساسة ومؤشرات الإنجاز اليومية.'
      ],
      dailyTasksEn: [
        'Review live Executive Quantum Cockpit and cash liquidity index.',
        'Authorize Level-4 escalated financial and programmatic approvals.',
        'Monitor daily institutional milestone tickers and security alerts.'
      ],
      weeklyTasksAr: [
        'عقد الاجتماع الأسبوعي مع مدراء الإدارات لمتابعة تقدم المشاريع الميدانية.',
        'مراجعة تقارير التدقيق المالي ومؤشرات أداء البرامج.',
        'التواصل مع المانحين والشركاء لتعزيز الشراكات التمويلية.'
      ],
      weeklyTasksEn: [
        'Convene weekly directorate sync to audit project burn-rates.',
        'Review weekly financial and operational variance briefs.',
        'Engage with strategic donors and prospective partners.'
      ],
      monthlyTasksAr: [
        'اعتماد التقرير المالي الشهري وتسويات البنوك المعتمدة من المدير المالي.',
        'مراجعة تقرير الأثر الميداني الشامل المرفوع من إدارة المتابعة والتقييم (MEAL).',
        'تقييم أداء مدراء الإدارات واعتماد كشف الرواتب الشهري.'
      ],
      monthlyTasksEn: [
        'Authorize monthly consolidated IPSAS financial statements.',
        'Review monthly organizational MEAL impact and compliance audit.',
        'Approve monthly organizational payroll and director appraisals.'
      ],
      quarterlyTasksAr: [
        'تقديم تقرير الإنجاز الفصلي لمجلس الأمناء ومراجعة تحقيق الأهداف الاستراتيجية (KPIs).',
        'مراجعة وتحديث مصفوفة المخاطر المؤسسية واستمرارية الأعمال.',
        'اعتماد خطط البرامج والمشاريع للربع القادم.'
      ],
      quarterlyTasksEn: [
        'Present quarterly performance scorecard to Board of Trustees.',
        'Audit and update organizational Risk Register and BCP.',
        'Authorize upcoming quarterly master programmatic envelope.'
      ],
      kpiMetricsAr: [
        'نسبة تحقيق الأهداف الاستراتيجية العامة ≥ 90%',
        'معدل الامتثال لمعايير الحوكمة و IPSAS بنسبة 100%',
        'الاستدامة المالية وتغطية نفقات البرامج بنسبة 100%'
      ],
      kpiMetricsEn: [
        'Macro Strategic KPI Achievement ≥ 90%',
        '100% Governance & IPSAS Compliance Score',
        '100% Programmatic Funding Envelope Sustainability'
      ]
    },
    {
      id: 'ROLE-CFO',
      roleCode: 'FIN-01',
      titleAr: 'المدير المالي والحوكمة (CFO)',
      titleEn: 'Chief Financial Officer (CFO)',
      departmentAr: 'الإدارة المالية والمحاسبية',
      departmentEn: 'Finance Directorate',
      securityLevel: 'Level 4 (Director)',
      maxApprovalAmount: 'حتى 100,000 دولار أمريكي',
      reportsToAr: 'المدير التنفيذي العام',
      reportsToEn: 'Executive Director (CEO)',
      supervisesAr: ['محاسب المشاريع', 'محاسب الخزينة والصرف', 'مدقق الحسابات'],
      supervisesEn: ['Projects Accountant', 'Treasury Accountant', 'Internal Auditor'],
      purposeAr: 'إدارة وتوجيه كافة العمليات المالية والمحاسبية للمؤسسة، ضبط التوازن المحاسبي المزدوج IPSAS، إدارة السيولة والموازنات، وإعداد القوائم المالية المدققة.',
      purposeEn: 'Direct all institutional accounting & financial operations, enforce IPSAS double-entry integrity, manage liquidity, and prepare audited statements.',
      targetTab: 'finance',
      dailyTasksAr: [
        'مراجعة وترحيل قيود اليومية وسندات الصرف والقبض والتأكد من التوازن التام (Debit = Credit).',
        'التدقيق على طلبات الصرف المرفوعة من مدراء المشاريع وفحص توفر الرصيد في بنود المنح.',
        'مطابقة أرصدة الصناديق النقدية وحسابات البنوك وسعر الصرف المعتمد.'
      ],
      dailyTasksEn: [
        'Audit and post daily journal vouchers ensuring total_debit = total_credit.',
        'Verify project payment requisitions against encumbered grant lines.',
        'Reconcile daily cash vault, bank balances, and official FX rates.'
      ],
      weeklyTasksAr: [
        'مراجعة كشوفات العهد المالية المؤقتة والتأكد من تصفيتها في المواعيد المحددة.',
        'إصدار كشف التدفقات النقدية ومتابعة الدفعات المالية للموردين والشركاء.',
        'التأكد من الترحيل السليم لكافة العمليات إلى شجرة الحسابات ومراكز التكلفة.'
      ],
      weeklyTasksEn: [
        'Audit active operational advances and enforce clearance deadlines.',
        'Issue weekly cash-flow projections and vendor payment tranches.',
        'Verify cost-center posting accuracy across all active grant ledgers.'
      ],
      monthlyTasksAr: [
        'إعداد ميزان المراجعة والقوائم المالية الشهرية المتوافقة مع معايير IPSAS.',
        'إجراء المطابقات والتسويات البنكية لكافة الحسابات البنكية للمؤسسة.',
        'إعداد وتدقيق كشف الرواتب ومستحقات الموظفين والبدلات.'
      ],
      monthlyTasksEn: [
        'Generate monthly IPSAS-compliant Trial Balance and balance sheets.',
        'Complete formal bank reconciliations for all institutional accounts.',
        'Audit and finalize monthly employee payroll and benefits schedule.'
      ],
      quarterlyTasksAr: [
        'إعداد التقارير المالية الدورية للمانحين ومطابقة المصروفات مع الموازنات التقديرية.',
        'تنسيق ومرافقة فريق التدقيق المالي الخارجي وتسهيل مهام المراجعة.',
        'مراجعة انحرافات الموازنة (Variance Analysis) وتقديم مقترحات ضبط النفقات.'
      ],
      quarterlyTasksEn: [
        'Compile quarterly donor financial reports and budget variance briefs.',
        'Facilitate external audit reviews and legal financial compliance.',
        'Perform macro budget variance analysis and expenditure controls.'
      ],
      kpiMetricsAr: [
        'توازن القيود المحاسبية 100% (Zero Unbalanced Postings)',
        'إنجاز التسويات البنكية في موعد أقصاه اليوم الخامس من الشهر الجديد',
        'تصفية العهد المالية في المواعيد المحددة بنسبة 100%'
      ],
      kpiMetricsEn: [
        '100% Balanced Ledger Entries (Zero Discrepancy)',
        'Bank Reconciliations Completed by 5th of Each Month',
        '100% On-time Advance Settlements'
      ]
    },
    {
      id: 'ROLE-PROGRAMS',
      roleCode: 'PROG-01',
      titleAr: 'مدير البرامج والمشاريع والعمليات',
      titleEn: 'Director of Programs & Projects',
      departmentAr: 'إدارة البرامج والعمليات الميدانية',
      departmentEn: 'Programs & Field Operations',
      securityLevel: 'Level 4 (Director)',
      maxApprovalAmount: 'حتى 50,000 دولار أمريكي',
      reportsToAr: 'المدير التنفيذي العام',
      reportsToEn: 'Executive Director (CEO)',
      supervisesAr: ['مدراء المشاريع', 'مهندسو التخطيط والـ WBS', 'منسقو العمليات الميدانية'],
      supervisesEn: ['Project Managers', 'WBS Planning Engineers', 'Field Ops Coordinators'],
      purposeAr: 'الإشراف على دورة حياة البرامج والمشاريع من التخطيط والتنفيذ الميداني وحتى الإغلاق، وتأطير هياكل تفكيك العمل (WBS) ومخططات Gantt.',
      purposeEn: 'Direct end-to-end programmatic lifecycle, WBS structuring, Gantt scheduling, and field activity execution.',
      targetTab: 'projects',
      dailyTasksAr: [
        'متابعة وتيرة تنفيذ الأنشطة الميدانية عبر الخريطة التفاعلية ونظام WBS.',
        'اعتماد خطط العمل اليومية لفرق التوزيع والمشاريع الميدانية.',
        'حل أي معوقات أو اختناقات تشغيلية تعترض فرق الميدان فوراً.'
      ],
      dailyTasksEn: [
        'Monitor field activity progress via live GIS map and WBS milestones.',
        'Approve daily field distribution and operational task rosters.',
        'Resolve field operational roadblocks and supply-chain bottlenecks.'
      ],
      weeklyTasksAr: [
        'مراجعة مؤشر كفاءة الجدولة الزمنية (SPI) والتكلفة (CPI) للمشاريع النشطة.',
        'عقد اجتماع متابعة أسبوعي مع مدراء المشاريع لمراجعة نسب الإنجاز.',
        'مراجعة وتزكية طلبات الصرف المالي للمشاريع وإحالتها للمالية.'
      ],
      weeklyTasksEn: [
        'Audit project SPI (Schedule Performance) and CPI (Cost Performance).',
        'Hold weekly operational sprint reviews with project leads.',
        'Review and endorse project payment requisitions to Finance.'
      ],
      monthlyTasksAr: [
        'إعداد تقرير التقدم البرامجي الشهري وحصر أعداد المستفيدين الكلية.',
        'مراجعة خطط الأنشطة للشهر القادم واعتماد جداول تخصيص الموارد.',
        'التنسيق مع إدارة المتابعة والتقييم (MEAL) لمراجعة جودة المخرجات.'
      ],
      monthlyTasksEn: [
        'Compile monthly programmatic progress report and beneficiary tallies.',
        'Approve upcoming monthly activity rosters and resource allocations.',
        'Collaborate with MEAL team to audit field output quality.'
      ],
      quarterlyTasksAr: [
        'إعداد تقارير الإنجاز الفصلي الموجهة للمانحين والشركاء الدوليين.',
        'إجراء التقييم الختامي للمشاريع المنتهية وتجهيز ملفات الإغلاق والأرشفة.',
        'المشاركة في صياغة مقترحات المشاريع الجديدة وتحديد الاحتياجات التنموية.'
      ],
      quarterlyTasksEn: [
        'Prepare quarterly donor progress dossiers and IATI deliverables.',
        'Oversee project closeout, final account clearance, and archival.',
        'Co-author new project proposals based on field needs assessments.'
      ],
      kpiMetricsAr: [
        'مؤشر كفاءة الجدولة الزمنية للمشاريع (SPI) ≥ 1.0',
        'تحقيق مستهدفات المستفيدين بنسبة ≥ 95%',
        'تسليم تقارير المانحين في المواعيد المحددة بنسبة 100%'
      ],
      kpiMetricsEn: [
        'Project Schedule Performance Index (SPI) ≥ 1.0',
        'Beneficiary Target Achievement ≥ 95%',
        '100% On-time Donor Report Submissions'
      ]
    },
    {
      id: 'ROLE-MEAL',
      roleCode: 'MEAL-01',
      titleAr: 'مسؤول المتابعة والتقييم والمساءلة (MEAL)',
      titleEn: 'Monitoring, Evaluation, Accountability & Learning Lead (MEAL)',
      departmentAr: 'إدارة الرقابة والتقييم والجودة',
      departmentEn: 'MEAL & Quality Assurance',
      securityLevel: 'Level 4 (Director)',
      maxApprovalAmount: 'صلاحيات رقابية وتدقيق شامل',
      reportsToAr: 'المدير التنفيذي العام ومجلس الأمناء',
      reportsToEn: 'CEO & Governance Committee',
      supervisesAr: ['باحثو تقييم الأثر', 'مسؤول الشكاوى والمقترحات', 'مدققو الجودة الميدانية'],
      supervisesEn: ['Impact Researchers', 'Accountability/CRM Officer', 'Field Quality Auditors'],
      purposeAr: 'التحقق المستقل من جودة المخرجات، قياس مؤشرات الأثر الإنساني ومعايير Sphere / CHS، وإدارة آلية الشكاوى والمساءلة المجتمعية.',
      purposeEn: 'Independent verification of project outputs, Sphere/CHS compliance monitoring, beneficiary accountability, and organizational learning.',
      targetTab: 'reports',
      dailyTasksAr: [
        'متابعة ومطابقة إيصالات التوزيع الميداني (POD) وتدقيق البصمة وإحداثيات GPS.',
        'استقبال وفحص بلاغات الشكاوى والمقترحات الواردة من المستفيدين عبر القنوات المعتمدة.',
        'إجراء اتصالات عشوائية بعينات من المستفيدين للتحقق من استلام الحصص بجودة كاملة.'
      ],
      dailyTasksEn: [
        'Audit daily Proof of Delivery (POD) slips, biometric and GPS logs.',
        'Review incoming beneficiary complaints and feedback mechanism logs.',
        'Conduct random beneficiary phone audits to verify aid handover quality.'
      ],
      weeklyTasksAr: [
        'إصدار تقرير التحقق الميداني الأسبوعي وتنبيه الإدارة لأي ملاحظات جودة.',
        'متابعة إغلاق الشكاوى ومعالجتها مع الإدارات المختصة خلال 72 ساعة.',
        'تدقيق عينات من استمارات البحث الاجتماعي للتحقق من دقة معايير الفقر والاستحقاق.'
      ],
      weeklyTasksEn: [
        'Issue weekly field verification and compliance summary.',
        'Enforce 72-hour beneficiary grievance resolution workflows.',
        'Audit social assessment sample dossiers for vulnerability scoring fidelity.'
      ],
      monthlyTasksAr: [
        'حساب مؤشرات الامتثال للمعايير الإنسانية الدولية (Sphere & CHS).',
        'إعداد التقرير الشهري للرقابة والتقييم ومشاركة الدروس المستفادة مع مدراء المشاريع.',
        'تقييم معدل رضا المستفيدين الإجمالي ورفع التوصيات التطويرية للإدارة العليا.'
      ],
      monthlyTasksEn: [
        'Calculate monthly Sphere and Core Humanitarian Standard compliance.',
        'Publish monthly MEAL learning synthesis and corrective action briefs.',
        'Compute aggregate beneficiary satisfaction rating for leadership.'
      ],
      quarterlyTasksAr: [
        'إعداد تقرير تقييم الأثر الإنساني الشامل (Impact Assessment Dossier).',
        'تنظيم ورشة مراجعة الدروس المستفادة الفصلي وتحديث بنك المعرفة المؤسسي.',
        'تدقيق التقرير الختامي للمشاريع المكتملة وتأكيد إغلاقها بمعايير الجودة.'
      ],
      quarterlyTasksEn: [
        'Draft comprehensive quarterly humanitarian impact evaluation dossier.',
        'Facilitate quarterly organizational lessons-learned review workshops.',
        'Sign off on final project closeout compliance audits.'
      ],
      kpiMetricsAr: [
        'معالجة وإغلاق 100% من شكاوى المستفيدين خلال المدة المحددة',
        'معدل رضا المستفيدين الإجمالي ≥ 90%',
        'توثيق الأثر والامتثال لمعايير Sphere بنسبة 100%'
      ],
      kpiMetricsEn: [
        '100% Grievance Redressal within SLA',
        'Aggregate Beneficiary Satisfaction Index ≥ 90%',
        '100% Sphere & CHS Standards Audit Alignment'
      ]
    },
    {
      id: 'ROLE-WELFARE',
      roleCode: 'WEL-01',
      titleAr: 'مسؤول الرعاية الاجتماعية وبحث الأسر والكفالات',
      titleEn: 'Social Welfare & Sponsorships Lead',
      departmentAr: 'إدارة الرعاية والخدمات الاجتماعية',
      departmentEn: 'Social Welfare & Services',
      securityLevel: 'Level 3 (Officer)',
      maxApprovalAmount: 'حتى 10,000 دولار أمريكي',
      reportsToAr: 'مدير البرامج والمشاريع',
      reportsToEn: 'Programs Director',
      supervisesAr: ['الباحثون الاجتماعيون', 'منسق كفالات الأيتام', 'مدخلو بيانات المستفيدين'],
      supervisesEn: ['Social Researchers', 'Orphan Sponsorship Coordinator', 'Data Enumerators'],
      purposeAr: 'إدارة السجل الموحد للمستفيدين، التحقق من حالات الأسر الأشد احتياجاً، منع الازدواجية، وإدارة عقود وصرف كفالات الأيتام.',
      purposeEn: 'Manage unified beneficiary registry, vulnerability assessment, deduplication protocols, and orphan sponsorship welfare programs.',
      targetTab: 'beneficiaries',
      dailyTasksAr: [
        'مراجعة واعتماد استمارات البحث الاجتماعي الميداني المدخلة من الباحثين.',
        'إجراء فحص منع الازدواجية والتكرار بالرقم الوطني في السجل المركزي.',
        'تحديث ملفات الأيتام والأسر المكفولة ومتابعة أي تغييرات طارئة في الحالة الاجتماعية.'
      ],
      dailyTasksEn: [
        'Review and endorse field social survey forms entered by researchers.',
        'Execute National ID deduplication checks against central database.',
        'Update orphan and sponsored household profiles with social changes.'
      ],
      weeklyTasksAr: [
        'متابعة تحصيل أقساط الكفالات من الكفلاء وتوجيهها للصناديق المخصصة.',
        'إعداد كشوفات المستحقين المعتمدة لحملات التوزيع والمساعدات الدورية.',
        'التواصل مع الكفلاء الجدد وتزويدهم بملفات الأيتام المرشحين للكفالة.'
      ],
      weeklyTasksEn: [
        'Track incoming sponsorship donor contributions with Finance.',
        'Prepare verified beneficiary rosters for upcoming distribution drives.',
        'Engage prospective sponsors and share eligible orphan profiles.'
      ],
      monthlyTasksAr: [
        'تجهيز واعتماد كشف الصرف الشهري لكفالات الأيتام والأسر المتعففة.',
        'الإشراف على تسليم المخصصات الشهرية وتوثيق استلام أولياء الأمور.',
        'إعداد التقرير الدوري لحالة المستفيدين والكفالات النشطة.'
      ],
      monthlyTasksEn: [
        'Finalize monthly orphan and family welfare stipend disbursement roster.',
        'Oversee monthly payout distribution and proof-of-handover capture.',
        'Generate monthly beneficiary statistics and active sponsorship brief.'
      ],
      quarterlyTasksAr: [
        'إصدار وتوزيع تقارير الأثر الدورية للكفلاء (التقارير الدراسية والصحية للأيتام).',
        'تنفيذ المسح الميداني لإعادة تقييم درجات فقر واحتياج الأسر المسجلة.',
        'تحديث وتطهير قاعدة بيانات المستفيدين واستبعاد الحالات المتعافية اقتصادياً.'
      ],
      quarterlyTasksEn: [
        'Generate and email periodic academic/health progress cards to sponsors.',
        'Execute field re-assessment sweeps to update family vulnerability indices.',
        'Cleanse master beneficiary database and graduate empowered families.'
      ],
      kpiMetricsAr: [
        'انعدام حالات الازدواجية في الاستلام بنسبة 100% (0% Duplicates)',
        'انتظام صرف مخصصات الكفالات في موعدها بنسبة 100%',
        'دقة وتحديث ملفات الأيتام والمستفيدين بنسبة ≥ 98%'
      ],
      kpiMetricsEn: [
        '100% Deduplication Verification (Zero Duplicate Aid)',
        '100% On-time Monthly Sponsorship Payouts',
        '≥ 98% Profile Update and Social Audit Accuracy'
      ]
    },
    {
      id: 'ROLE-PROCUREMENT',
      roleCode: 'PROC-01',
      titleAr: 'مسؤول المشتريات والمناقصات وسلاسل الإمداد',
      titleEn: 'Procurement & Supply Chain Specialist',
      departmentAr: 'إدارة المشتريات واللوجستيات',
      departmentEn: 'Procurement & Logistics',
      securityLevel: 'Level 3 (Officer)',
      maxApprovalAmount: 'حتى 20,000 دولار أمريكي',
      reportsToAr: 'المدير المالي والمدير التنفيذي',
      reportsToEn: 'CFO & Executive Director',
      supervisesAr: ['منسق المناقصات', 'مساعد المشتريات'],
      supervisesEn: ['Tenders Coordinator', 'Procurement Assistant'],
      purposeAr: 'إدارة عمليات الشراء والمناقصات وفق أعلى معايير الشفافية والنزاهة، مقارنة العروض، وتطبيق المطابقة الثلاثية (3-Way Match).',
      purposeEn: 'Manage transparent procurement cycles, RFQs, vendor evaluations, contracts, and 3-Way Matching compliance.',
      targetTab: 'contracts',
      dailyTasksAr: [
        'مراجعة طلبات الشراء (PR) الواردة من المشاريع والتأكد من حجز الميزانية.',
        'طرح استدراج عروض الأسعار للموردين المسجلين في النظام.',
        'متابعة أوامر التوريد (PO) قيد التنفيذ والتأكد من التزام الموردين بالمواعيد.'
      ],
      dailyTasksEn: [
        'Audit incoming Purchase Requisitions (PR) and budget encumbrance.',
        'Issue Requests for Quotation (RFQs) to approved vendor database.',
        'Track active Purchase Orders (PO) and vendor delivery schedules.'
      ],
      weeklyTasksAr: [
        'إعداد جداول المقارنة الفنية والمالية لعروض الأسعار وعرضها على لجنة الشراء.',
        'التنسيق مع أمين المستودع لفحص المواد الموردة وإصدار محاضر الاستلام (GRN).',
        'تحديث سجل وتقييم أداء الموردين المعتمدين في النظام.'
      ],
      weeklyTasksEn: [
        'Draft bid evaluation matrices and facilitate procurement committee reviews.',
        'Coordinate warehouse quality inspections and GRN issuance.',
        'Update vendor performance ratings and compliance scorecards.'
      ],
      monthlyTasksAr: [
        'إعداد كشف المطابقة الثلاثية الشامل (PR + PO + GRN) وإحالته للمالية للصرف.',
        'مراجعة وتحديث قاعدة بيانات الأسعار المرجعية للسلع والمواد الإغاثية.',
        'إعداد التقرير الشهري للمشتريات والعقود المبرمة ونسب التوفير المحققة.'
      ],
      monthlyTasksEn: [
        'Finalize 3-Way Match clearance dossiers for Finance disbursement.',
        'Update institutional commodity price benchmark index.',
        'Publish monthly procurement summary and achieved cost-savings brief.'
      ],
      quarterlyTasksAr: [
        'تأهيل وتحديث سجل الموردين وتجديد العقود الإطارية للسلع الاستراتيجية.',
        'مراجعة وتحديث لائحة المشتريات وإجراءات المناقصات بالتنسيق مع الحوكمة.',
        'تقييم مخاطر سلاسل الإمداد وتأمين البدائل اللوجستية للطوارئ.'
      ],
      quarterlyTasksEn: [
        'Re-qualify vendor roster and negotiate master framework agreements.',
        'Review procurement bylaws against donor compliance benchmarks.',
        'Assess supply-chain risks and establish emergency buffer channels.'
      ],
      kpiMetricsAr: [
        'تطبيق المطابقة الثلاثية 3-Way Match بنسبة 100%',
        'تحقيق وفر مالي مقارنة بأسعار السوق بنسبة ≥ 8%',
        'إنجاز دورة الشراء في الوقت المحدد (SLA) بنسبة ≥ 92%'
      ],
      kpiMetricsEn: [
        '100% 3-Way Match Enforcement on all POs',
        '≥ 8% Cost Savings against Market Price Benchmark',
        '≥ 92% On-time Procurement Cycle SLA Compliance'
      ]
    },
    {
      id: 'ROLE-WAREHOUSE',
      roleCode: 'WH-01',
      titleAr: 'أمين المستودعات والمخازن الإغاثية',
      titleEn: 'Warehouse & Relief Logistics Keeper',
      departmentAr: 'إدارة اللوجستيات والمخازن',
      departmentEn: 'Logistics & Warehousing',
      securityLevel: 'Level 3 (Officer)',
      maxApprovalAmount: 'ضبط العهد والمخزون',
      reportsToAr: 'مدير العمليات ومسؤول المشتريات',
      reportsToEn: 'Ops Director & Procurement Lead',
      supervisesAr: ['عمال المستودع', 'سائقو النقل والتوزيع'],
      supervisesEn: ['Warehouse Handlers', 'Transport Drivers'],
      purposeAr: 'استلام وفحص المواد الإغاثية، ضبط بطاقات الأصناف وحركة المخزون، تتبع تواريخ الصلاحية، وصرف الحصص لحملات التوزيع الميداني.',
      purposeEn: 'Receive and inspect relief inventory, maintain bin cards, track batch expiration dates, and disburse campaign allocations.',
      targetTab: 'inventory',
      dailyTasksAr: [
        'فحص واستلام الشحنات الموردة وتدقيق الكميات وإصدار محضر الاستلام (GRN).',
        'تحديث رصيد المخزون الآلي في النظام فور إتمام أي حركة استلام أو صرف.',
        'مراقبة ظروف التخزين ودرجات الحرارة والسلامة العامة في المستودع.'
      ],
      dailyTasksEn: [
        'Inspect incoming consignments, verify quantities, and issue GRN slips.',
        'Update system inventory ledger immediately upon any stock movement.',
        'Monitor warehouse climate controls, security, and safety compliance.'
      ],
      weeklyTasksAr: [
        'تجهيز وتغليف السلال الغذائية والحصص الإغاثية المخصصة للحملات القادمة.',
        'إجراء جرد أسبوعي دوري للأصناف سريعة الحركة ومطابقتها مع المنظومة.',
        'متابعة الأصناف التي يقترب تاريخ صلاحيتها وتقديم تقرير عاجل للإدارة.'
      ],
      weeklyTasksEn: [
        'Package and prepare food baskets and kits for upcoming campaigns.',
        'Perform weekly cycle counts on fast-moving relief items.',
        'Audit stock expiry horizons and trigger proactive risk alerts.'
      ],
      monthlyTasksAr: [
        'تنفيذ الجرد المخزني الشهري الشامل بمشاركة لجنة الجرد والمالية.',
        'إعداد ميزان حركة المخزون الشهري (الرصيد الافتتاحي + الوارد - المنصرف = المتبقي).',
        'صيانة وتعقيم مرافق المستودع وتأمين وسائل مكافحة الحريق.'
      ],
      monthlyTasksEn: [
        'Execute monthly comprehensive stock count with Finance committee.',
        'Generate monthly stock balance report (Opening + In - Out = Closing).',
        'Maintain warehouse sanitization, pest control, and safety systems.'
      ],
      quarterlyTasksAr: [
        'مطابقة وتصفية العهد المخزنية الختامية مع الحسابات العامة.',
        'مراجعة السعة التخزينية للمستودعات وإعادة تنظيم المساحات لاستقبال المنح الجديدة.',
        'التخلص الآمن والموثق من أي مخلفات أو عبوات تالفة وفق المعايير البيئية.'
      ],
      quarterlyTasksEn: [
        'Reconcile quarterly inventory valuation with General Ledger.',
        'Optimize warehouse spatial layout for incoming humanitarian consignments.',
        'Safely dispose of packing waste per environmental regulations.'
      ],
      kpiMetricsAr: [
        'مطابقة الجرد الفعلي مع رصيد النظام بنسبة 100% (Zero Discrepancy)',
        'انعدام الأصناف التالفة أو منتهية الصلاحية (Zero Waste)',
        'سرعة تجهيز طلبيات التوزيع الميداني وفق الـ SLA المعتمد'
      ],
      kpiMetricsEn: [
        '100% Physical vs System Stock Concordance',
        'Zero Expired or Spoiled Inventory Loss',
        '100% On-time Campaign Order Fulfillment'
      ]
    },
    {
      id: 'ROLE-HR',
      roleCode: 'HR-01',
      titleAr: 'مسؤول الموارد البشرية والشؤون الإدارية',
      titleEn: 'HR & Administrative Affairs Officer',
      departmentAr: 'إدارة الموارد البشرية والإدارة',
      departmentEn: 'Human Resources & Administration',
      securityLevel: 'Level 3 (Officer)',
      maxApprovalAmount: 'حتى 15,000 دولار أمريكي',
      reportsToAr: 'المدير التنفيذي العام',
      reportsToEn: 'Executive Director (CEO)',
      supervisesAr: ['منسق شؤون الموظفين', 'مسؤول الخدمات الإدارية والخدمات العامة'],
      supervisesEn: ['Personnel Coordinator', 'Administrative Services Staff'],
      purposeAr: 'استقطاب وتأهيل الكوادر، إدارة ملفات الموظفين، متابعة الحضور والالتزام، إعداد مسير الرواتب، وتطبيق اللائحة الداخلية ومدونة السلوك.',
      purposeEn: 'Talent acquisition, personnel file management, attendance tracking, payroll preparation, and code of conduct enforcement.',
      targetTab: 'users',
      dailyTasksAr: [
        'متابعة سجل الحضور والانصراف الإلكتروني ومعالجة الإجازات والاستئذانات.',
        'متابعة المهام الإدارية وتوفير احتياجات بيئة العمل لموظفي المقر والميدان.',
        'الرد على استفسارات الموظفين وتقديم الدعم الإداري اللازم.'
      ],
      dailyTasksEn: [
        'Monitor biometric attendance logs and process leave/absence requests.',
        'Oversee office administrative requirements and workstation readiness.',
        'Provide HR support and resolve employee administrative inquiries.'
      ],
      weeklyTasksAr: [
        'متابعة خطط التوظيف وإجراء المقابلات للمناصب الشاغرة بالتعاون مع الإدارات.',
        'التأكد من التزام الكوادر بمدونة السلوك الإنساني والسياسات الداخلية.',
        'تحديث ملفات الكوادر الجديدة والتأكد من اكتمال مسوغات التعيين.'
      ],
      weeklyTasksEn: [
        'Coordinate recruitment pipelines and candidate interviews.',
        'Monitor staff adherence to humanitarian Code of Conduct and bylaws.',
        'Update onboarding dossiers for new hires and verification checks.'
      ],
      monthlyTasksAr: [
        'إعداد مسير الرواتب الشهري وحساب البدلات والاستقطاعات وإحالته للمالية.',
        'متابعة تجديد العقود وبطاقات التأمين والتراخيص المهنية للكوادر.',
        'إعداد التقرير الشهري لحركة الموارد البشرية ومعدل دوران العمالة.'
      ],
      monthlyTasksEn: [
        'Prepare monthly payroll, benefits, deductions, and submit to Finance.',
        'Track contract renewals, insurance policies, and staff credentials.',
        'Compile monthly HR metrics, retention, and staff turnover briefs.'
      ],
      quarterlyTasksAr: [
        'تنظيم وتنسيق جولات تقييم الأداء الفصلي للموظفين مع مدراء الإدارات.',
        'تحديد الاحتياجات التدريبية وتنفيذ ورش التطوير المهني وبناء القدرات.',
        'مراجعة وتحديث اللائحة الداخلية وسلم الرواتب والبدلات بالتنسيق مع القيادة.'
      ],
      quarterlyTasksEn: [
        'Coordinate quarterly performance appraisal cycles with department leads.',
        'Conduct training needs assessments and organize staff capacity building.',
        'Review and benchmark HR compensation and internal bylaws.'
      ],
      kpiMetricsAr: [
        'إنجاز مسير الرواتب بدقة 100% قبل اليوم 25 من كل شهر',
        'اكتمال ملفات ومسوغات التعيين لـ 100% من الموظفين',
        'معدل رضا الموظفين عن بيئة العمل ≥ 88%'
      ],
      kpiMetricsEn: [
        '100% Accurate Payroll Finalized by 25th of Each Month',
        '100% Personnel Dossier and Compliance Audit Readiness',
        'Staff Workplace Satisfaction Index ≥ 88%'
      ]
    },
    {
      id: 'ROLE-FIELD',
      roleCode: 'FLD-01',
      titleAr: 'الباحث الميداني وقائد فرق التوزيع',
      titleEn: 'Field Researcher & Distribution Team Lead',
      departmentAr: 'العمليات الميدانية والإغاثة',
      departmentEn: 'Field Operations & Relief',
      securityLevel: 'Level 2 (Field Specialist)',
      maxApprovalAmount: 'تشغيلي ميداني',
      reportsToAr: 'مدير العمليات ومسؤول الرعاية',
      reportsToEn: 'Ops Director & Welfare Lead',
      supervisesAr: ['فريق الباحثين الميدانيين', 'فرق التوزيع والتفريغ'],
      supervisesEn: ['Field Enumerators', 'Distribution Volunteers'],
      purposeAr: 'إجراء البحث الاجتماعي الميداني المباشر للأسر، تنفيذ التوزيع الميداني وتوثيق البصمة وGPS والتوقيع، والعمل بالأجهزة اللوحية دون إنترنت.',
      purposeEn: 'Execute on-ground social surveys, manage field distribution, capture GPS stamps and digital signatures via mobile tablets.',
      targetTab: 'activities',
      dailyTasksAr: [
        'تنفيذ زيارات البحث الميداني للأسر المرشحة وتعبئة الاستمارة بالأجهزة اللوحية.',
        'مسح باركود المستفيدين QR في نقاط التوزيع والتحقق من الهوية.',
        'توثيق استلام المساعدات بالبصمة أو التوقيع الرقمي وإحداثيات GPS الحية.'
      ],
      dailyTasksEn: [
        'Conduct household social survey visits and capture data via tablets.',
        'Scan beneficiary QR passes at distribution points and verify identity.',
        'Capture digital signatures, biometric proofs, and live GPS coordinates.'
      ],
      weeklyTasksAr: [
        'مزامنة كافة البيانات والمسوح الملتقطة ميدانياً مع السحابة المركزية فور توفر الإنترنت.',
        'تسليم كشوفات الاستلام الموقعة ورقياً (إن وجدت) لمسؤول المتابعة والتقييم MEAL.',
        'المشاركة في فحص وتجهيز مواقع ونقاط التوزيع والتأكد من معايير السلامة.'
      ],
      weeklyTasksEn: [
        'Sync offline tablet records and media to cloud upon network detection.',
        'Hand over physical POD rosters to MEAL department for audit.',
        'Inspect and set up distribution sites ensuring beneficiary safety.'
      ],
      monthlyTasksAr: [
        'إعداد تقرير الإنجاز الميداني الشهري وتوثيق قصص النجاح الإنسانية والأثر.',
        'متابعة وتحديث حالات الأيتام والأسر المكفولة في النطاق الجغرافي المسند.',
        'حضور اجتماع المراجعة الميدانية الشهرية لمناقشة التحديات والحلول.'
      ],
      monthlyTasksEn: [
        'Draft monthly field milestone report and human impact success stories.',
        'Update orphan and vulnerable household status in assigned territory.',
        'Participate in monthly operational field sprint review.'
      ],
      quarterlyTasksAr: [
        'المشاركة في حملات المسح الشامل وتحديث الخرائط المكانية للقرى والمخيمات.',
        'تجديد وتأهيل فرق المتطوعين الميدانيين وتدريبهم على استخدام المنظومة.',
        'المساهمة في تقييم احتياجات المجتمعات المحلية للمشاريع القادمة.'
      ],
      quarterlyTasksEn: [
        'Participate in area-wide census updates and GIS village mapping.',
        'Train community volunteers on tablet scanning and crowd safety.',
        'Contribute to local community needs assessments for future projects.'
      ],
      kpiMetricsAr: [
        'دقة التوثيق الميداني والتقاط GPS والتوقيع بنسبة 100%',
        'مزامنة البيانات بدون أي فقدان (0% Data Loss)',
        'إنجاز حصة المسح اليومية المحددة بنسبة ≥ 95%'
      ],
      kpiMetricsEn: [
        '100% GPS Coordinate & E-Signature Stamping Concordance',
        'Zero Data Loss via Offline Sync Mechanism',
        '≥ 95% Daily Survey Quota Fulfillment'
      ]
    },
    {
      id: 'ROLE-IT',
      roleCode: 'IT-01',
      titleAr: 'مدير تكنولوجيا المعلومات والتحول الرقمي',
      titleEn: 'IT & Digital Transformation Administrator',
      departmentAr: 'تكنولوجيا المعلومات والأمن السيبراني',
      departmentEn: 'Information Technology & Cybersecurity',
      securityLevel: 'Level 5 (Super Admin)',
      maxApprovalAmount: 'سيادي تقني وأمني',
      reportsToAr: 'المدير التنفيذي العام',
      reportsToEn: 'Executive Director (CEO)',
      supervisesAr: ['مهندسو الشبكات والدعم الفني', 'مسؤولو أمن البيانات'],
      supervisesEn: ['Network Engineers', 'Data Security Specialists'],
      purposeAr: 'إدارة البنية التحتية للنظام، ضمان استقرار الخوادم وقاعدة بيانات Neon PostgreSQL، تأمين البيانات والتشفير، إدارة النسخ الاحتياطي والصلاحيات.',
      purposeEn: 'Manage system infrastructure, ensure Neon DB uptime, enforce cybersecurity/encryption standards, oversee automated backups and RBAC.',
      targetTab: 'settings',
      dailyTasksAr: [
        'مراقبة أداء الخادم وقاعدة البيانات وسرعة الاستجابة ومعدل استهلاك الموارد.',
        'فحص سجلات الأمان (Security Audit Logs) ومحاولات الدخول غير المصرح بها.',
        'تقديم الدعم التقني الفوري لكوادر المقر والميدان وحل المشاكل الفنية.'
      ],
      dailyTasksEn: [
        'Monitor server and Neon PostgreSQL health, query latency, and resource loads.',
        'Audit security logs for failed login attempts and anomalous events.',
        'Provide immediate technical helpdesk support to headquarter and field teams.'
      ],
      weeklyTasksAr: [
        'التأكد من تنفيذ النسخ الاحتياطي التلقائي للبيانات وفحص سلامة اللقطات السحابية.',
        'مراجعة حسابات المستخدمين النشطة وتحديث التراخيص وإلغاء صلاحيات المغادرين.',
        'فحص أداء المزامنة التلقائية للأجهزة اللوحية الميدانية بدون إنترنت (Offline Sync).'
      ],
      weeklyTasksEn: [
        'Verify automated cloud database backup snapshots and test restore points.',
        'Audit active user accounts, revoke departed staff tokens, and enforce 2FA.',
        'Check performance of field tablet offline-first synchronization machine.'
      ],
      monthlyTasksAr: [
        'إجراء اختبارات الأمان والتحصين السيبراني وفحص التحديثات البرمجية.',
        'إصدار تقرير مؤشرات أداء البنية التحتية ومعدل الجاهزية التشغيلية (Uptime).',
        'تدريب الكوادر على أفضل ممارسات أمن المعلومات وحماية البيانات الشخصية.'
      ],
      monthlyTasksEn: [
        'Conduct monthly cybersecurity vulnerability audit and software patching.',
        'Publish monthly IT uptime (≥ 99.9%) and system performance brief.',
        'Train personnel on data protection best practices and phishing defense.'
      ],
      quarterlyTasksAr: [
        'تنفيذ اختبار استعادة البيانات الشامل من النسخ الاحتياطي في بيئة معزولة.',
        'مراجعة وتحديث خطة التعافي من الكوارث (DRP) واستمرارية الأعمال التقنية.',
        'تحديث خطة التحول الرقمي وأتمتة العمليات بالتنسيق مع الإدارة العليا.'
      ],
      quarterlyTasksEn: [
        'Execute full disaster recovery simulation and sandbox data restoration.',
        'Audit and benchmark Disaster Recovery Plan (DRP) and business continuity.',
        'Update digital transformation and automation roadmap with executive team.'
      ],
      kpiMetricsAr: [
        'معدل جاهزية واستقرار النظام والخدمات ≥ 99.9% Uptime',
        'اكتمال النسخ الاحتياطي الآلي للبيانات بنسبة 100%',
        'زمن الاستجابة للدعم الفني وحل الأعطال < 30 دقيقة'
      ],
      kpiMetricsEn: [
        'System & Database Availability ≥ 99.9% Uptime',
        '100% Automated Cloud Backup Execution',
        'Helpdesk Incident Response Time < 30 Minutes'
      ]
    }
  ];

  // DATA: 12 Official Document Templates
  const officialDocsLibrary: OfficialDocumentTemplate[] = [
    {
      id: 'DOC-01',
      code: 'DOC-STRAT-01',
      phaseId: 'PHASE-01',
      titleAr: 'ميثاق الخطة الاستراتيجية وبطاقات الأداء المتوازن (BSC)',
      titleEn: 'Strategic Plan Charter & Balanced Scorecard Dossier',
      typeAr: 'وثيقة حوكمة استراتيجية',
      typeEn: 'Strategic Governance Charter',
      category: 'strategy',
      departmentAr: 'الإدارة العليا والتخطيط الاستراتيجي',
      departmentEn: 'Executive Management & Strategy',
      standardReference: 'NEB-01 / Core Governance Protocol',
      descriptionAr: 'الوثيقة التأسيسية التي تحدد رسالة المنظمة ورؤيتها وأهدافها الاستراتيجية ومؤشرات قياس الأداء المعتمدة.',
      descriptionEn: 'The foundational charter defining organizational vision, mission, strategic objectives, and key performance indicators.',
      targetTab: 'strategic_planning',
      sampleData: {
        refNumber: 'NX-STRAT-2026-001',
        issueDate: '2026-01-01',
        authorizer: 'رئيس مجلس الأمناء / المدير التنفيذي',
        statusAr: 'معتمد وساري المفعول',
        statusEn: 'Officially Enacted & Active',
        detailsAr: [
          'الرؤية: الريادة في العمل الإنساني والتنموي المستدام.',
          'الهدف 1: تحسين سبل العيش وتوفير الحماية لـ 50,000 أسرة.',
          'الهدف 2: كفالة ورعاية 2,500 يتيم وفق معايير الرعاية المتكاملة.',
          'الهدف 3: حوكمة مالية وإدارية بنسبة التزام 100% بمعايير IPSAS و Sphere.'
        ],
        detailsEn: [
          'Vision: Excellence in sustainable humanitarian and developmental impact.',
          'Goal 1: Enhance livelihood and protection for 50,000 vulnerable families.',
          'Goal 2: Comprehensive welfare sponsorship for 2,500 orphans.',
          'Goal 3: 100% financial and operational compliance with IPSAS and Sphere standards.'
        ]
      }
    },
    {
      id: 'DOC-02',
      code: 'DOC-GRANT-02',
      phaseId: 'PHASE-02',
      titleAr: 'اتفاقية منحة وتمويل برنامج تنموي معتمد',
      titleEn: 'Donor Grant Agreement & Program Allocation Protocol',
      typeAr: 'عقد تمويل وشراكة',
      typeEn: 'Grant & Partnership Agreement',
      category: 'programs',
      departmentAr: 'إدارة الشراكات وتنمية الموارد',
      departmentEn: 'Partnerships & Grants Department',
      standardReference: 'NEB-08 / Donor Compliance Framework',
      descriptionAr: 'اتفاقية المنحة الرسمية التي تحدد التزامات المانح والمنظمة ومصفوفة الدفعات المالية ومؤشرات التحقق.',
      descriptionEn: 'Official grant agreement detailing donor commitments, payment tranche schedule, and verification milestones.',
      targetTab: 'sales',
      sampleData: {
        refNumber: 'NX-GRANT-2026-88',
        issueDate: '2026-02-15',
        authorizer: 'المدير التنفيذي وممثل المانح الرسمي',
        statusAr: 'مفعل وجاري التنفيذ',
        statusEn: 'Active & In-Progress',
        detailsAr: [
          'قيمة المنحة الإجمالية: 500,000 دولار أمريكي (USD).',
          'البرنامج المستهدف: برنامج الاستجابة الطارئة والأمن الغذائي.',
          'دورية التقارير: تقرير إنجاز ربع سنوي وتقرير مالي ختامي مدقق.'
        ],
        detailsEn: [
          'Total Grant Envelope: $500,000 USD.',
          'Target Program: Emergency Relief & Food Security Program.',
          'Reporting Cadence: Quarterly progress reports & final audited statement.'
        ]
      }
    },
    {
      id: 'DOC-03',
      code: 'DOC-FIN-03',
      phaseId: 'PHASE-04',
      titleAr: 'سند صرف مالي رسمي مع قيد اليومية المزدوج (IPSAS)',
      titleEn: 'Official Payment Voucher & Balanced Double-Entry Journal',
      typeAr: 'سند مالي ومحاسبي',
      typeEn: 'Financial & Accounting Voucher',
      category: 'finance',
      departmentAr: 'الإدارة المالية والحسابات',
      departmentEn: 'Finance & Accounts Department',
      standardReference: 'NEB-10 / IPSAS Accounting Standard',
      descriptionAr: 'سند الصرف المالي المعتمد برقم تسلسلي وحيد وقيد اليومية المتوازن (Debit = Credit) والمرفقات المؤيدة.',
      descriptionEn: 'Approved payment voucher with unique sequential numbering, balanced double-entry lines, and supporting documents.',
      targetTab: 'finance',
      sampleData: {
        refNumber: 'PV-2026-0492',
        issueDate: '2026-03-10',
        authorizer: 'المدير المالي والمدير التنفيذي',
        statusAr: 'مرحل ومعتمد نهائياً',
        statusEn: 'Posted & Fully Executed',
        detailsAr: [
          'المبلغ: 15,000,000 ريال يمني (YER).',
          'من حـ/ بنك التضامن الإسلامي (مدين 15,000,000).',
          'إلى حـ/ مصروفات السلال الغذائية - مشروع الإغاثة الطارئة (دائن 15,000,000).',
          'حالة التوازن: متزن 100% (Total Debit = Total Credit).'
        ],
        detailsEn: [
          'Amount: 15,000,000 YER.',
          'Debit: Project Food Basket Expense (15,000,000).',
          'Credit: Tadhamon Islamic Bank Account (15,000,000).',
          'Balance Check: 100% Balanced (Total Debit = Total Credit).'
        ]
      }
    },
    {
      id: 'DOC-04',
      code: 'DOC-PROJ-04',
      phaseId: 'PHASE-05',
      titleAr: 'وثيقة ميثاق المشروع وهيكل تفكيك العمل (WBS Charter)',
      titleEn: 'Master Project Charter & Field WBS Breakdown Schedule',
      typeAr: 'وثيقة إدارة مشاريع',
      typeEn: 'Project Management Charter',
      category: 'projects',
      departmentAr: 'إدارة البرامج والمشاريع',
      departmentEn: 'Programs & Projects Department',
      standardReference: 'NEB-04 / PMI & PMD Pro Standards',
      descriptionAr: 'ميثاق المشروع التنفيذي الشامل الذي يحدد خط الأساس الزمني ومخطط Gantt ومصفوفة الأنشطة والمخرجات.',
      descriptionEn: 'Comprehensive project charter establishing the schedule baseline, Gantt milestones, and activity output matrix.',
      targetTab: 'projects',
      sampleData: {
        refNumber: 'NX-PRJ-2026-014',
        issueDate: '2026-02-01',
        authorizer: 'مدير البرامج والمشاريع',
        statusAr: 'قيد التنفيذ الميداني',
        statusEn: 'Active Field Execution',
        detailsAr: [
          'اسم المشروع: مشروع كفالة ورعاية 500 يتيم وتأهيل أسرهم.',
          'الميزانية المعتمدة: 120,000$ دولار أمريكي.',
          'المدة الزمنية: 12 شهراً (من 2026-01-01 إلى 2026-12-31).'
        ],
        detailsEn: [
          'Project Title: 500 Orphan Sponsorship & Family Empowerment Project.',
          'Approved Budget: $120,000 USD.',
          'Timeline: 12 Months (2026-01-01 to 2026-12-31).'
        ]
      }
    },
    {
      id: 'DOC-05',
      code: 'DOC-WEL-05',
      phaseId: 'PHASE-06',
      titleAr: 'استمارة البحث الميداني وبطاقة المستفيد المشفرة (QR Pass)',
      titleEn: 'Social Needs Assessment & Encrypted Beneficiary QR Card',
      typeAr: 'سجل اجتماعي ورعاية',
      typeEn: 'Social Survey & Welfare Pass',
      category: 'welfare',
      departmentAr: 'إدارة الرعاية والخدمات الاجتماعية',
      departmentEn: 'Social Welfare & Beneficiaries',
      standardReference: 'NEB-06 / Data Protection & Anti-Deduplication',
      descriptionAr: 'الملف الاجتماعي الميداني المعتمد للأسر والأيتام المحتاجين مع كود QR المشفر لمنع الازدواجية.',
      descriptionEn: 'Field assessment profile for vulnerable households with encrypted QR token for duplicate-free delivery.',
      targetTab: 'beneficiaries',
      sampleData: {
        refNumber: 'BEN-YE-2026-8812',
        issueDate: '2026-02-20',
        authorizer: 'مسؤول بيانات المستفيدين والباحث الاجتماعي',
        statusAr: 'مستحق ومعتمد بالسجل الموحد',
        statusEn: 'Eligible & Verified in Master Registry',
        detailsAr: [
          'رب الأسرة: فاطمة علي محمد (أم لـ 4 أيتام).',
          'مؤشر الفقر والاحتياج: 94% (أولوية قصوى).',
          'حالة الازدواجية: تم التحقق بالرقم الوطني (خالي من التكرار 100%).'
        ],
        detailsEn: [
          'Household Head: Fatima Ali Mohammed (Mother of 4 orphans).',
          'Vulnerability Index: 94% (High Priority).',
          'Deduplication Status: National ID verified (0% Duplicate).'
        ]
      }
    },
    {
      id: 'DOC-06',
      code: 'DOC-PROC-06',
      phaseId: 'PHASE-07',
      titleAr: 'محضر الفحص والاستلام المخزني وأمر التوريد (3-Way Match GRN)',
      titleEn: '3-Way Match Purchase Order & Goods Received Note (GRN)',
      typeAr: 'سند مشتريات ومخازن',
      typeEn: 'Procurement & Warehouse Record',
      category: 'procurement',
      departmentAr: 'إدارة المشتريات واللوجستيات',
      departmentEn: 'Procurement & Logistics Department',
      standardReference: 'NEB-14 / 3-Way Match Protocol',
      descriptionAr: 'المطابقة الثلاثية بين طلب الشراء وأمر التوريد ومحضر الفحص المخزني لضمان استلام الكميات بجودة مطابقة.',
      descriptionEn: 'Three-way concordance between PR, PO, and GRN to verify quality and exact quantities before payment.',
      targetTab: 'inventory',
      sampleData: {
        refNumber: 'GRN-2026-0182',
        issueDate: '2026-03-05',
        authorizer: 'أمين المستودع ولجنة الفحص الميداني',
        statusAr: 'مستلم ومطابق للمواصفات 100%',
        statusEn: 'Inspected & Accepted 100%',
        detailsAr: [
          'الصنف: سلال غذائية متكاملة (1,000 سلة).',
          'المورد: شركة الوفاق للتجارة العامة والتوريدات.',
          'حالة الفحص: مطابقة للمواصفات وتاريخ الصلاحية ساري لأكثر من 18 شهراً.'
        ],
        detailsEn: [
          'Item: Complete Emergency Food Baskets (1,000 Baskets).',
          'Supplier: Al-Wefaq General Trading & Supplies.',
          'Quality Audit: Fully compliant with specs, expiry horizon > 18 months.'
        ]
      }
    },
    {
      id: 'DOC-07',
      code: 'DOC-POD-07',
      phaseId: 'PHASE-08',
      titleAr: 'إيصال الاستلام الميداني الموثق بالبصمة وGPS (Proof of Delivery)',
      titleEn: 'Verified Proof of Delivery (POD) with GPS & Digital Signature',
      typeAr: 'سند توثيق ميداني',
      typeEn: 'Field Handover & Verification Slip',
      category: 'operations',
      departmentAr: 'إدارة العمليات الميدانية',
      departmentEn: 'Field Operations Department',
      standardReference: 'NEB-05 / GPS Verification & CHS Accountability',
      descriptionAr: 'سند الاستلام الرقمي المباشر الذي يثبت تسليم المساعدة للمستفيد في النطاق الجغرافي المعتمد.',
      descriptionEn: 'Digital Proof of Delivery documenting aid receipt by the beneficiary within the geofenced zone.',
      targetTab: 'activities',
      sampleData: {
        refNumber: 'POD-2026-9941',
        issueDate: '2026-03-12',
        authorizer: 'قائد فريق التوزيع الميداني',
        statusAr: 'موثق بالبصمة وإحداثيات GPS',
        statusEn: 'GPS Stamped & Digitally Signed',
        detailsAr: [
          'المستفيد المستلم: أحمد محمد قاسم (هوية وطنية: 0102030405).',
          'الموقع الجغرافي: مديرية المظفر، محافظة تعز (13.5795° N, 44.0207° E).',
          'وسيلة التوثيق: مسح كود QR + توقيع باللمس + صورة الاستلام.'
        ],
        detailsEn: [
          'Beneficiary: Ahmed Mohammed Qasim (National ID: 0102030405).',
          'GPS Location: Al-Mudhaffar District, Taiz (13.5795° N, 44.0207° E).',
          'Verification: QR scan + touch e-signature + delivery photo.'
        ]
      }
    },
    {
      id: 'DOC-08',
      code: 'DOC-IMPACT-08',
      phaseId: 'PHASE-09',
      titleAr: 'تقرير قياس الأثر الإنساني ومعايير Sphere / CHS ومحضر الإغلاق',
      titleEn: 'Sphere / CHS Humanitarian Impact Dossier & Project Closeout Protocol',
      typeAr: 'تقرير حوكمة وقياس أثر',
      typeEn: 'Impact Audit & Closeout Dossier',
      category: 'governance',
      departmentAr: 'إدارة الرقابة والتقييم والإدارة العليا',
      departmentEn: 'MEAL & Executive Directorate',
      standardReference: 'NEB-13 / Sphere Standards & Core Humanitarian Standard',
      descriptionAr: 'التقرير الختامي الشامل لقياس الأثر وتوثيق مؤشرات النجاح والمساءلة الإنسانية والدروس المستفادة.',
      descriptionEn: 'The comprehensive closing report measuring tangible impact, CHS accountability indicators, and lessons learned.',
      targetTab: 'reports',
      sampleData: {
        refNumber: 'IMP-2026-FINAL-01',
        issueDate: '2026-03-15',
        authorizer: 'مسؤول الرقابة والتقييم MEAL والمدير التنفيذي',
        statusAr: 'مدقق ومعتمد رسمياً للمانحين',
        statusEn: 'Audited & Enacted for Donors',
        detailsAr: [
          'إجمالي المستفيدين المباشرين: 14,850 فرداً (52% إناث، 48% ذكور).',
          'نسبة رضا المستفيدين الإجمالية: 96.8%.',
          'التسوية المالية: 100% مطابقة للمنحة وبدون أي تجاوز في الميزانية.',
          'الامتثال لمعايير Sphere و CHS: مستوى الامتثال الفضي المتقدم (Level 5).'
        ],
        detailsEn: [
          'Total Direct Beneficiaries: 14,850 individuals (52% female, 48% male).',
          'Overall Beneficiary Satisfaction: 96.8%.',
          'Financial Clearance: 100% grant reconciliation, zero budget overrun.',
          'Sphere & CHS Compliance: Advanced Level 5 Institutional Rating.'
        ]
      }
    }
  ];

  // DATA: Quick Data Template Packs
  const quickTemplatePacks: QuickTemplatePack[] = [
    {
      id: 'TMP-01',
      titleAr: 'حزمة قوالب الخطة الاستراتيجية وبطاقات الأداء (BSC Pack)',
      titleEn: 'Strategic Plan & Balanced Scorecard Template Pack',
      categoryAr: 'التخطيط الاستراتيجي',
      categoryEn: 'Strategic Planning',
      descriptionAr: 'قالب جاهز يحتوي على 5 محاور استراتيجية رئيسية مع 15 هدفاً نوعياً ومؤشرات أداء قابلة للتطبيق الفوري.',
      descriptionEn: 'Ready-to-deploy 5-pillar strategic framework with 15 pre-configured objectives and KPIs.',
      targetTab: 'strategic_planning',
      previewData: 'PIL-FINANCE: تعزيز الاستدامة التمويلية | PIL-PROGRAMS: توسيع التغطية الإغاثية لـ 50 ألف أسرة'
    },
    {
      id: 'TMP-02',
      titleAr: 'حزمة دليل شجرة الحسابات ومراكز التكلفة (IPSAS COA Pack)',
      titleEn: 'IPSAS Chart of Accounts & Cost Centers Master Pack',
      categoryAr: 'المالية والحسابات',
      categoryEn: 'Finance & Ledger',
      descriptionAr: 'دليل حسابات مؤسسي متكامل رباعي المستويات متوافق 100% مع معايير المحاسبة الدولية IPSAS ومراكز تكلفة المشاريع.',
      descriptionEn: '4-level comprehensive Chart of Accounts with standard project cost centers.',
      targetTab: 'finance',
      previewData: '101: أصول متداولة | 201: التزامات | 301: صافي أصول مقيدة | 401: إيرادات منح | 501: مصروفات مشاريع'
    },
    {
      id: 'TMP-03',
      titleAr: 'استمارة البحث الاجتماعي ومعايير قياس الفقر والاستحقاق',
      titleEn: 'Household Vulnerability Survey & Poverty Scoring Pack',
      categoryAr: 'المستفيدين والكفالات',
      categoryEn: 'Beneficiaries & Welfare',
      descriptionAr: 'نموذج بحث ميداني ذكي يحتوي على 25 معياراً اجتماعياً واقتصادياً لحساب درجة الاستحقاق آلياً.',
      descriptionEn: '25-metric vulnerability survey form with automated poverty index calculation.',
      targetTab: 'beneficiaries',
      previewData: 'معيار السكن: إيجار/إيواء | معيار الدخل: معدوم | معيار الأيتام: 3 أطفال | مؤشر الاستحقاق: 94%'
    },
    {
      id: 'TMP-04',
      titleAr: 'حزمة تفكيك العمل (WBS) وجدولة مشاريع السلال الغذائية والإيواء',
      titleEn: 'Emergency Food & Shelter WBS Milestone Pack',
      categoryAr: 'المشاريع والعمليات',
      categoryEn: 'Projects & WBS',
      descriptionAr: 'هيكل WBS جاهز للمشاريع الإغاثية يشمل أنشطة الحصر، الشراء، الفحص، والتوزيع الميداني الموثق بـ GPS.',
      descriptionEn: 'Standard WBS breakdown for relief projects covering census, procurement, and GPS delivery.',
      targetTab: 'activities',
      previewData: 'نشاط 1.1: حصر المستفيدين | نشاط 1.2: فحص المخزن GRN | نشاط 1.3: التوزيع الميداني POD'
    }
  ];

  // Active Phase & Active Role
  const activePhase = useMemo(() => {
    return rolloutPhases.find(p => p.id === activePhaseId) || rolloutPhases[0];
  }, [rolloutPhases, activePhaseId]);

  const activeJobProfile = useMemo(() => {
    return jobProfiles.find(j => j.id === selectedRoleCode) || jobProfiles[0];
  }, [jobProfiles, selectedRoleCode]);

  // Overall Rollout Readiness
  const overallProgress = useMemo(() => {
    const total = rolloutPhases.length;
    const completed = Object.values(completedPhases).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  }, [rolloutPhases.length, completedPhases]);

  const togglePhaseCompletion = (phaseId: string) => {
    setCompletedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  const toggleTaskChecked = (taskKey: string) => {
    setCheckedTasks(prev => ({
      ...prev,
      [taskKey]: !prev[taskKey]
    }));
  };

  const handleApplyTemplate = (tmpl: QuickTemplatePack) => {
    setAppliedTemplateMsg(`تم تفعيل وتحميل ${lang === 'ar' ? tmpl.titleAr : tmpl.titleEn} بنجاح!`);
    setTimeout(() => setAppliedTemplateMsg(null), 3500);
    if (onNavigate) {
      setTimeout(() => onNavigate(tmpl.targetTab), 1200);
    }
  };

  return (
    <ModuleShell
      lang={lang}
      titleAr="دليل الإجراءات والتدشين المؤسسي واللوائح والتوصيف الوظيفي"
      titleEn="Enterprise SOP, Governance Bylaws, Job Descriptions & MEAL Engine"
      descAr="النواة التنظيمية الموحدة: 9 مراحل تدشين، اللائحة الداخلية، التوصيف الوظيفي لـ 10 كوادر، المهام الدورية، تقييم الأداء، والوثائق المعتمدة"
      descEn="Integrated ERP Core: 9-Phase Rollout, 10 Bylaws, 10 Job Profiles, Duty Rosters, MEAL Performance & Official Documents"
      domainCode="NEB-01..15"
      icon={Compass}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition-colors border border-slate-300 dark:border-zinc-700"
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'ar' ? 'طباعة الدليل المؤسسي' : 'Print SOP Manual'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-12">

        {/* TOP EXECUTIVE BANNER */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{lang === 'ar' ? 'نظام التشغيل المؤسسي الموحد NexoraOS™' : 'NexoraOS™ Unified Enterprise OS'}</span>
                <span className="text-white/40">|</span>
                <span>{orgName || (lang === 'ar' ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'Rohamaa Baynahum Foundation')}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                {lang === 'ar' ? 'المنظومة المتكاملة للتشغيل المؤسسي، اللوائح والتوصيف وقياس الأداء' : 'Integrated Enterprise SOP, Job Taxonomy, Bylaws & MEAL Performance Engine'}
              </h2>
              <p className="text-xs md:text-sm text-emerald-100/90 max-w-3xl leading-relaxed">
                {lang === 'ar' 
                  ? 'ترابط هندسي حقيقي يربط مراحل التدشين الـ 9 باللائحة الداخلية، وبطاقات التوصيف الوظيفي للكوادر، والمهام الدورية مع أزرار التنفيذ المباشر، وتقييم الأداء ونماذج العمل المعتمدة.' 
                  : 'True enterprise synergy linking 9 rollout phases to internal bylaws, 10 job descriptions, periodic task execution, MEAL scorecards, and ready template packs.'}
              </p>
            </div>

            {/* Macro Progress Gauge */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[220px] shrink-0 text-center">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5 text-emerald-100">
                <span>{lang === 'ar' ? 'نسبة الجاهزية والتدشين' : 'Rollout Readiness'}</span>
                <span className="font-mono text-amber-300 text-sm font-black">{overallProgress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] text-emerald-100/70 font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-amber-300" />
                <span>{lang === 'ar' ? `تم إنجاز ${Object.values(completedPhases).filter(Boolean).length} من 9 مراحل` : `${Object.values(completedPhases).filter(Boolean).length} of 9 Phases Ready`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Notification for Applied Template */}
        {appliedTemplateMsg && (
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs font-black animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{appliedTemplateMsg}</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">جاري التوجيه للشاشة...</span>
          </div>
        )}

        {/* 7 MASTER NAVIGATION TABS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveMainTab('rollout')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                activeMainTab === 'rollout'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '1. مراحل التدشين (9 مراحل)' : '1. 9-Phase Rollout'}</span>
            </button>

            <button
              onClick={() => setActiveMainTab('bylaws')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                activeMainTab === 'bylaws'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '2. اللائحة الداخلية (10 أبواب)' : '2. Internal Bylaws'}</span>
            </button>

            <button
              onClick={() => setActiveMainTab('playbook')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                activeMainTab === 'playbook'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '3. دليل الإجراءات (SOP)' : '3. Standard SOP'}</span>
            </button>

            <button
              onClick={() => setActiveMainTab('job_descriptions')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                activeMainTab === 'job_descriptions'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '4. التوصيف الوظيفي (10 وظائف)' : '4. Job Taxonomy'}</span>
            </button>

            <button
              onClick={() => setActiveMainTab('duty_roster')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                activeMainTab === 'duty_roster'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'ar' ? '5. جدول المهام الدورية' : '5. Duty Rosters'}</span>
            </button>

            <button
              onClick={() => setActiveMainTab('meal_appraisal')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                activeMainTab === 'meal_appraisal'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-blue-500" />
              <span>{lang === 'ar' ? '6. المتابعة وتقييم الأداء (MEAL)' : '6. MEAL & Appraisals'}</span>
            </button>

            <button
              onClick={() => setActiveMainTab('documents')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                activeMainTab === 'documents'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '7. النماذج والمستندات (12 نموذج)' : '7. Document Vault'}</span>
            </button>
          </div>

          {/* Instant Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث سريع في اللوائح والمهام والمستندات...' : 'Search bylaws, duties & templates...'}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* TAB 1: 9-PHASE ROLLOUT MATRIX */}
        {activeMainTab === 'rollout' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Template Packs Strip */}
            <div className="p-4 bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'ar' ? 'قوالب بيانات جاهزة للتنزيل والتطبيق الفوري (One-Click Template Packs):' : 'Pre-built Quick Data Packs:'}</span>
                </span>
                <span className="text-[11px] text-slate-400">انقر لتطبيق القالب والانتقال للشاشة التخصصية مباشرة</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {quickTemplatePacks.map(tmpl => (
                  <div key={tmpl.id} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
                    <div>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        {lang === 'ar' ? tmpl.categoryAr : tmpl.categoryEn}
                      </span>
                      <h5 className="text-xs font-black text-slate-900 dark:text-zinc-100 mt-1 line-clamp-1">
                        {lang === 'ar' ? tmpl.titleAr : tmpl.titleEn}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                        {lang === 'ar' ? tmpl.descriptionAr : tmpl.descriptionEn}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تطبيق القالب في النظام' : 'Apply Template'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 9 Phases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rolloutPhases.map((phase) => {
                const isCompleted = !!completedPhases[phase.id];
                const isSelected = activePhaseId === phase.id;

                return (
                  <div
                    key={phase.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/50 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      setActivePhaseId(phase.id);
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${phase.badgeColor}`}>
                          {lang === 'ar' ? phase.priorityLevelAr : phase.priorityLevelEn}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhaseCompletion(phase.id);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{isCompleted ? (lang === 'ar' ? 'مكتمل' : 'Done') : (lang === 'ar' ? 'تحديد كمكتمل' : 'Mark Done')}</span>
                        </button>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                          <Compass className="w-3 h-3 text-emerald-500" />
                          <span>{phase.nebDomain}</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 mt-1 line-clamp-2">
                          {lang === 'ar' ? phase.titleAr : phase.titleEn}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {lang === 'ar' ? phase.descriptionAr : phase.descriptionEn}
                      </p>

                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>{lang === 'ar' ? 'المدة المقدرة (SLA):' : 'Estimated SLA:'}</span>
                          </span>
                          <span className="font-bold text-slate-700 dark:text-zinc-200">
                            {lang === 'ar' ? phase.estimatedDurationAr : phase.estimatedDurationEn}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-blue-500" />
                            <span>{lang === 'ar' ? 'المسؤول الرئيسي:' : 'Lead Role:'}</span>
                          </span>
                          <span className="font-bold text-slate-700 dark:text-zinc-200 line-clamp-1">
                            {lang === 'ar' ? phase.responsibleRolesAr[0] : phase.responsibleRolesEn[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) onNavigate(phase.targetTab);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-colors"
                      >
                        <span>{lang === 'ar' ? '🚀 فتح الشاشة الآن' : '🚀 Open Screen'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setActivePhaseId(phase.id);
                          setActiveMainTab('playbook');
                        }}
                        className="text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-emerald-600 flex items-center gap-1"
                      >
                        <span>{lang === 'ar' ? `خطوات الدليل (${phase.steps.length})` : `Steps (${phase.steps.length})`}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: INTERNAL BYLAWS (10 CHAPTERS) */}
        {activeMainTab === 'bylaws' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'اللائحة الداخلية والتنظيمية للمؤسسة' : 'Institutional Internal Bylaws & Operational Constitution'}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                  {lang === 'ar' ? 'المواد والضوابط الحوكمية الملزمة لكافة الإدارات والكوادر في المنظومة' : 'Mandatory regulatory articles governing all organizational directorates and staff.'}
                </p>
              </div>
              <span className="text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded-full">
                {bylawChapters.length} أبواب حوكمية
              </span>
            </div>

            <div className="space-y-3">
              {bylawChapters.map((chapter) => {
                const isExpanded = expandedBylawChapter === chapter.chapterNumber;
                return (
                  <div key={chapter.id} className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                    <div
                      onClick={() => setExpandedBylawChapter(isExpanded ? null : chapter.chapterNumber)}
                      className="p-4 cursor-pointer flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0 border border-emerald-500/30">
                          {chapter.chapterNumber}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                          {lang === 'ar' ? chapter.chapterTitleAr : chapter.chapterTitleEn}
                        </h4>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>

                    {isExpanded && (
                      <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-4">
                        {chapter.articles.map((art) => (
                          <div key={art.articleNumber} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                                {lang === 'ar' ? art.titleAr : art.titleEn}
                              </h5>
                              <button
                                onClick={() => onNavigate && onNavigate(art.linkedScreen)}
                                className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                <span>{lang === 'ar' ? 'فتح الشاشة المرتبطة' : 'Open Linked Screen'}</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                              {lang === 'ar' ? art.contentAr : art.contentEn}
                            </p>
                            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-400 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-blue-500" />
                              <span><b>المستند المعتمد:</b> {art.linkedDoc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: STANDARD SOP PLAYBOOK */}
        {activeMainTab === 'playbook' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
            {/* Left Column: Phases Menu */}
            <div className="lg:col-span-4 space-y-2">
              <div className="p-3 bg-slate-100 dark:bg-zinc-900 rounded-xl font-black text-xs text-slate-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                <span>{lang === 'ar' ? 'المراحل الـ 9' : '9 Phases'}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono">
                  {rolloutPhases.length} Phases
                </span>
              </div>
              <div className="space-y-1.5 max-h-[680px] overflow-y-auto pr-1">
                {rolloutPhases.map((phase) => {
                  const isSelected = activePhaseId === phase.id;
                  const isDone = !!completedPhases[phase.id];
                  return (
                    <button
                      key={phase.id}
                      onClick={() => {
                        setActivePhaseId(phase.id);
                        setExpandedStep(null);
                      }}
                      className={`w-full text-start p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                        isDone ? 'bg-emerald-500 text-white' : (isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600')
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : phase.phaseNumber}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
                          <span>{phase.code}</span>
                          <span>{lang === 'ar' ? `${phase.steps.length} خطوات` : `${phase.steps.length} Steps`}</span>
                        </div>
                        <h4 className="text-xs font-black line-clamp-1 mt-0.5">
                          {lang === 'ar' ? phase.titleAr : phase.titleEn}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed Steps */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-xs font-black px-3 py-1 rounded-full border ${activePhase.badgeColor}`}>
                    {lang === 'ar' ? activePhase.priorityLevelAr : activePhase.priorityLevelEn}
                  </span>
                  <button
                    onClick={() => onNavigate && onNavigate(activePhase.targetTab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'الانتقال للشاشة التخصصية' : 'Open Target Screen'}</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                    {lang === 'ar' ? activePhase.titleAr : activePhase.titleEn}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    {lang === 'ar' ? activePhase.descriptionAr : activePhase.descriptionEn}
                  </p>
                </div>
              </div>

              {/* Steps Accordion */}
              <div className="space-y-3">
                {activePhase.steps.map((step, idx) => {
                  const isExpanded = expandedStep === idx;
                  return (
                    <div key={step.stepNumber} className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                      <div
                        onClick={() => setExpandedStep(isExpanded ? null : idx)}
                        className="p-4 cursor-pointer flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0 border border-emerald-500/30">
                            {step.stepNumber}
                          </div>
                          <div>
                            <h5 className="text-xs md:text-sm font-black text-slate-900 dark:text-zinc-100">
                              {lang === 'ar' ? step.titleAr : step.titleEn}
                            </h5>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              <User className="w-3 h-3 text-blue-500" />
                              <span>{lang === 'ar' ? step.roleAr : step.roleEn}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStepAI(step);
                            }}
                            className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-lg text-xs font-bold"
                          >
                            <Bot className="w-4 h-4" />
                          </button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-4 text-xs">
                          <p className="text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                            {lang === 'ar' ? step.descriptionAr : step.descriptionEn}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                              <span className="font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-blue-500" />
                                <span>المدخلات والمستندات:</span>
                              </span>
                              <ul className="space-y-1 text-slate-600 dark:text-zinc-400 list-disc list-inside">
                                {(lang === 'ar' ? step.inputsAr : step.inputsEn).map((inp, i) => (
                                  <li key={i}>{inp}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                              <span className="font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span>العمليات البرمجية في المنظومة:</span>
                              </span>
                              <ul className="space-y-1 text-slate-600 dark:text-zinc-400 list-disc list-inside">
                                {(lang === 'ar' ? step.systemActionsAr : step.systemActionsEn).map((act, i) => (
                                  <li key={i}>{act}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                              <span className="font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>المخرجات والأثر:</span>
                              </span>
                              <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                                {lang === 'ar' ? step.outputAr : step.outputEn}
                              </p>
                            </div>

                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                              <span className="font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                                <span>قاعدة التدقيق والحوكمة:</span>
                              </span>
                              <p className="text-slate-600 dark:text-zinc-400">
                                {lang === 'ar' ? step.auditRuleAr : step.auditRuleEn}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                            <button
                              onClick={() => onNavigate && onNavigate(step.linkedScreen)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-colors"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? `🚀 تنفيذ الإجراء في شاشة (${step.linkedScreen})` : `Execute in ${step.linkedScreen}`}</span>
                            </button>

                            <button
                              onClick={() => setActiveStepAI(step)}
                              className="flex items-center gap-1 text-xs font-black text-amber-600 dark:text-amber-400 hover:underline"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>توجيهات الذكاء الاصطناعي لهذه الخطوة</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: JOB DESCRIPTIONS (10 PROFILES) */}
        {activeMainTab === 'job_descriptions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
            <div className="lg:col-span-4 space-y-2">
              <div className="p-3 bg-slate-100 dark:bg-zinc-900 rounded-xl font-black text-xs text-slate-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                <span>{lang === 'ar' ? 'الوظائف المؤسسية (10 وظائف)' : '10 Job Profiles'}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono">
                  {jobProfiles.length} Roles
                </span>
              </div>
              <div className="space-y-1.5 max-h-[680px] overflow-y-auto pr-1">
                {jobProfiles.map((job) => {
                  const isSelected = selectedRoleCode === job.id;
                  return (
                    <button
                      key={job.id}
                      onClick={() => setSelectedRoleCode(job.id)}
                      className={`w-full text-start p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
                          <span>{job.roleCode}</span>
                          <span>{job.securityLevel}</span>
                        </div>
                        <h4 className="text-xs font-black line-clamp-1 mt-0.5">
                          {lang === 'ar' ? job.titleAr : job.titleEn}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Job Profile Card */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                      {activeJobProfile.roleCode} | {activeJobProfile.securityLevel}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 mt-1">
                      {lang === 'ar' ? activeJobProfile.titleAr : activeJobProfile.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      <b>الإدارة التابعة:</b> {lang === 'ar' ? activeJobProfile.departmentAr : activeJobProfile.departmentEn}
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate && onNavigate(activeJobProfile.targetTab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'فتح الشاشة التخصصية' : 'Open Workspace'}</span>
                  </button>
                </div>

                {/* Purpose & Authority Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl space-y-1">
                    <span className="font-bold text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-500" />
                      <span>الهدف الاستراتيجي للوظيفة:</span>
                    </span>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      {lang === 'ar' ? activeJobProfile.purposeAr : activeJobProfile.purposeEn}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl space-y-1">
                    <span className="font-bold text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>سقف الصلاحية المالية:</span>
                    </span>
                    <p className="text-xs font-black text-amber-700 dark:text-amber-400">
                      {activeJobProfile.maxApprovalAmount}
                    </p>
                    <div className="text-[11px] text-slate-500"><b>التبعية الإدارية:</b> {lang === 'ar' ? activeJobProfile.reportsToAr : activeJobProfile.reportsToEn}</div>
                  </div>
                </div>

                {/* Periodic Duties Quadrant */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                    <span>المسؤوليات والمهام الدورية المعتمدة للوظيفة:</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                      <span className="font-black text-emerald-700 dark:text-emerald-400">المهام اليومية:</span>
                      <ul className="space-y-1 text-slate-600 dark:text-zinc-400 list-disc list-inside">
                        {(lang === 'ar' ? activeJobProfile.dailyTasksAr : activeJobProfile.dailyTasksEn).map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                      <span className="font-black text-blue-700 dark:text-blue-400">المهام الأسبوعية:</span>
                      <ul className="space-y-1 text-slate-600 dark:text-zinc-400 list-disc list-inside">
                        {(lang === 'ar' ? activeJobProfile.weeklyTasksAr : activeJobProfile.weeklyTasksEn).map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                      <span className="font-black text-amber-700 dark:text-amber-400">المهام الشهرية:</span>
                      <ul className="space-y-1 text-slate-600 dark:text-zinc-400 list-disc list-inside">
                        {(lang === 'ar' ? activeJobProfile.monthlyTasksAr : activeJobProfile.monthlyTasksEn).map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                      <span className="font-black text-purple-700 dark:text-purple-400">المهام الربع سنوية:</span>
                      <ul className="space-y-1 text-slate-600 dark:text-zinc-400 list-disc list-inside">
                        {(lang === 'ar' ? activeJobProfile.quarterlyTasksAr : activeJobProfile.quarterlyTasksEn).map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DUTY ROSTER & DIRECT EXECUTION CHECKLIST */}
        {activeMainTab === 'duty_roster' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Header Filter Strip */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-700 dark:text-zinc-300">اختيار الموظف / الوظيفة:</span>
                <select
                  value={selectedRoleCode}
                  onChange={(e) => setSelectedRoleCode(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-200"
                >
                  {jobProfiles.map(j => (
                    <option key={j.id} value={j.id}>
                      {lang === 'ar' ? j.titleAr : j.titleEn} ({j.roleCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cadence Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setDutyRosterCadence('daily')}
                  className={`px-3 py-1 rounded-lg transition-colors ${dutyRosterCadence === 'daily' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-zinc-400'}`}
                >
                  مهام يومية
                </button>
                <button
                  onClick={() => setDutyRosterCadence('weekly')}
                  className={`px-3 py-1 rounded-lg transition-colors ${dutyRosterCadence === 'weekly' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-zinc-400'}`}
                >
                  مهام أسبوعية
                </button>
                <button
                  onClick={() => setDutyRosterCadence('monthly')}
                  className={`px-3 py-1 rounded-lg transition-colors ${dutyRosterCadence === 'monthly' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-zinc-400'}`}
                >
                  مهام شهرية
                </button>
                <button
                  onClick={() => setDutyRosterCadence('quarterly')}
                  className={`px-3 py-1 rounded-lg transition-colors ${dutyRosterCadence === 'quarterly' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-zinc-400'}`}
                >
                  فصلية وسنوية
                </button>
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-3">
              {(
                dutyRosterCadence === 'daily' ? activeJobProfile.dailyTasksAr :
                dutyRosterCadence === 'weekly' ? activeJobProfile.weeklyTasksAr :
                dutyRosterCadence === 'monthly' ? activeJobProfile.monthlyTasksAr :
                activeJobProfile.quarterlyTasksAr
              ).map((taskText, idx) => {
                const taskKey = `${activeJobProfile.id}-${dutyRosterCadence}-${idx}`;
                const isChecked = !!checkedTasks[taskKey];

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isChecked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskChecked(taskKey)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                          isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-zinc-700'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <span className={`text-xs font-bold leading-relaxed ${isChecked ? 'line-through opacity-70' : 'text-slate-800 dark:text-zinc-200'}`}>
                          {taskText}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          <b>الجهة المنفذة:</b> {activeJobProfile.titleAr} | <b>المستوى:</b> {activeJobProfile.securityLevel}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate && onNavigate(activeJobProfile.targetTab)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? '🚀 نفّذ الإجراء الآن' : 'Execute Now'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: MEAL & PERFORMANCE APPRAISAL ENGINE */}
        {activeMainTab === 'meal_appraisal' && (
          <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                  {lang === 'ar' ? 'نظام المتابعة والتقييم (MEAL) وتقارير تقييم الأداء المؤسسي' : 'MEAL System & Institutional Performance Appraisal Engine'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                  {lang === 'ar' 
                    ? 'احتساب تلقائي لمعدل الامتثال للوائح الداخلية، وسرعة إنجاز المهام وفق الـ SLA، ومطابقة المعايير الإنسانية الدولية Sphere مع إمكانية إصدار وطباعة بطاقات تقييم الأداء المعتمدة.'
                    : 'Algorithmic performance index tracking SLA delivery, SOP compliance, Sphere alignment, and official appraisal dossier exports.'}
                </p>
              </div>
            </div>

            {/* Performance Indicators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 text-center space-y-1">
                <span className="text-[11px] text-slate-400 font-bold">الالتزام بالـ SLA الزمني (35%)</span>
                <div className="text-2xl font-black font-mono text-emerald-600">96.4%</div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">ممتاز (Exemplary)</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 text-center space-y-1">
                <span className="text-[11px] text-slate-400 font-bold">مطابقة الإجراءات واللوائح (30%)</span>
                <div className="text-2xl font-black font-mono text-blue-600">98.0%</div>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">امتثال كامل</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 text-center space-y-1">
                <span className="text-[11px] text-slate-400 font-bold">رضا المستفيدين والمانحين (20%)</span>
                <div className="text-2xl font-black font-mono text-amber-600">94.8%</div>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">عالي جداً</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 text-center space-y-1">
                <span className="text-[11px] text-slate-400 font-bold">نزاهة التوثيق والتدقيق (15%)</span>
                <div className="text-2xl font-black font-mono text-purple-600">100%</div>
                <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">خالي من الملاحظات</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">التقييم المؤسسي الإجمالي العام: 97.2% (مستوى الامتثال البلاتيني المتقدم)</span>
                <p className="text-[11px] text-emerald-800/80">متوافق 100% مع متطلبات المعايير الإنسانية الدولية CHS ومعايير IPSAS للمحاسبة الدولية.</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة بطاقة تقييم الأداء المعتمدة</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: OFFICIAL DOCUMENTS LIBRARY (12 TEMPLATES) */}
        {activeMainTab === 'documents' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {officialDocsLibrary.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-emerald-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded">
                        {doc.code}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {doc.standardReference}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                        {lang === 'ar' ? doc.titleAr : doc.titleEn}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {lang === 'ar' ? doc.descriptionAr : doc.descriptionEn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{lang === 'ar' ? 'الجهة المصدرة:' : 'Department:'}</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-300">{lang === 'ar' ? doc.departmentAr : doc.departmentEn}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{lang === 'ar' ? 'الاعتماد الرسمي:' : 'Authorized By:'}</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-300">{doc.sampleData.authorizer}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'معاينة وطباعة المستند' : 'Preview & Print'}</span>
                    </button>

                    <button
                      onClick={() => onNavigate && onNavigate(doc.targetTab)}
                      className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-emerald-600"
                    >
                      <span>{lang === 'ar' ? 'فتح الشاشة' : 'Open Screen'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL 1: OFFICIAL DOCUMENT PREVIEW & PRINT */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                      {lang === 'ar' ? previewDoc.titleAr : previewDoc.titleEn}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">{previewDoc.code}</span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-xs bg-slate-50/50 dark:bg-zinc-950/50">
                <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-zinc-800">
                    <div>
                      <h5 className="font-black text-slate-900 dark:text-zinc-100 text-sm">
                        {orgName || (lang === 'ar' ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'Rohamaa Baynahum Charity Foundation')}
                      </h5>
                      <p className="text-[11px] text-slate-500">نظام التشغيل المؤسسي الموحد NexoraOS™</p>
                    </div>
                    <div className="text-end font-mono text-[11px] space-y-0.5">
                      <div><b>Ref:</b> {previewDoc.sampleData.refNumber}</div>
                      <div><b>Date:</b> {previewDoc.sampleData.issueDate}</div>
                    </div>
                  </div>

                  <div className="text-center py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                    <span className="font-black text-emerald-800 dark:text-emerald-300 text-xs">
                      {lang === 'ar' ? previewDoc.typeAr : previewDoc.typeEn}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="font-bold text-slate-800 dark:text-zinc-200">البيانات المعتمدة للمستند:</span>
                    <ul className="space-y-1 text-slate-700 dark:text-zinc-300 list-disc list-inside bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-lg font-mono text-[11px]">
                      {(lang === 'ar' ? previewDoc.sampleData.detailsAr : previewDoc.sampleData.detailsEn).map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
                    <div>
                      <span className="text-slate-400">المعد والمسؤول:</span>
                      <div className="font-black text-slate-800 dark:text-zinc-200 mt-1">{lang === 'ar' ? previewDoc.departmentAr : previewDoc.departmentEn}</div>
                    </div>
                    <div className="text-end">
                      <span className="text-slate-400">الاعتماد الرسمي:</span>
                      <div className="font-black text-emerald-600 dark:text-emerald-400 mt-1">{previewDoc.sampleData.authorizer}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate(previewDoc.targetTab);
                      setPreviewDoc(null);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{lang === 'ar' ? '🚀 الانتقال للشاشة وإصدار المعاملة' : 'Open Screen to Issue Live Voucher'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'طباعة' : 'Print'}</span>
                  </button>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-bold"
                  >
                    {lang === 'ar' ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: AI STEP GUIDANCE MODAL */}
        {activeStepAI && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                      {lang === 'ar' ? 'توصيات الذكاء الاصطناعي للخطوة' : 'AI Step Recommendations'}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {lang === 'ar' ? activeStepAI.titleAr : activeStepAI.titleEn}
                    </span>
                  </div>
                </div>
                <button onClick={() => setActiveStepAI(null)} className="p-1 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-2">
                <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>توجيهات محرك Gemini المؤسسي:</span>
                </span>
                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                  {lang === 'ar' ? activeStepAI.aiGuidanceAr : activeStepAI.aiGuidanceEn}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div><b>القاعدة الرقابية:</b> {lang === 'ar' ? activeStepAI.auditRuleAr : activeStepAI.auditRuleEn}</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate(activeStepAI.linkedScreen);
                      setActiveStepAI(null);
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black"
                >
                  {lang === 'ar' ? '🚀 الانتقال للشاشة والتنفيذ' : 'Open Screen'}
                </button>
                <button
                  onClick={() => setActiveStepAI(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg text-xs font-bold"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ModuleShell>
  );
}

export default memo(OperationalScenariosView);
