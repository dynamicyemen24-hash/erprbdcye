import React, { useState, useEffect } from 'react';
import {
  Target, Gauge, Layers, FolderKanban, Workflow, HandHeart, UsersRound,
  HeartHandshake, Building2, Wallet, Library, Plug, Sparkles, LayoutDashboard,
  ListChecks, Calendar, Stamp, FilePlus, Mail, FileInput, Search, Folder,
  Share2, Bell, StickyNote, Signature, FileBarChart, ArrowLeftRight, Printer,
  Star, Bookmark, History, HelpCircle, MapPin, ClipboardList, Clipboard,
  Camera, UserCheck, WifiOff, RefreshCw, FileCheck, Navigation, AlertTriangle,
  ScanSearch, Brain, FileScan, Wand2, TrendingUp, ShieldAlert, Lightbulb,
  BellRing, Activity, Bot, Users, ShieldCheck, Network, GitBranch,
  SlidersHorizontal, List, Shield, Settings, Compass, Grid, Wrench,
  ArrowLeft, ArrowRight, Info, X, CheckCircle2
} from 'lucide-react';
import { useOrganizationBranding } from '../core/hooks/useOrganizationBranding';
import { TabId } from '../types';
import { ORGANIZATION_CONFIG } from '../core/config';
import { ModuleShell } from './enterprise/ModuleShell';

// -------------------------------------------------------------
// Type Definitions
// -------------------------------------------------------------
interface DomainCenterViewProps {
  lang: 'ar' | 'en';
  onNavigate: (tab: TabId) => void;
  orgName?: string;
}

// -------------------------------------------------------------
// Dynamic Icon Resolver Mapper
// -------------------------------------------------------------
const resolveIcon = (iconName: string): React.ComponentType<{ className?: string }> => {
  const customMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    'target': Target,
    'gauge': Gauge,
    'layers': Layers,
    'folder-kanban': FolderKanban,
    'workflow': Workflow,
    'hand-heart': HandHeart,
    'users-round': UsersRound,
    'heart-handshake': HeartHandshake,
    'building-2': Building2,
    'wallet': Wallet,
    'library': Library,
    'plug': Plug,
    'sparkles': Sparkles,
    'layout-dashboard': LayoutDashboard,
    'list-checks': ListChecks,
    'calendar': Calendar,
    'stamp': Stamp,
    'file-plus': FilePlus,
    'mail': Mail,
    'file-input': FileInput,
    'search': Search,
    'folder': Folder,
    'share-2': Share2,
    'bell': Bell,
    'sticky-note': StickyNote,
    'signature': Signature,
    'file-bar-chart': FileBarChart,
    'arrow-left-right': ArrowLeftRight,
    'printer': Printer,
    'star': Star,
    'bookmark': Bookmark,
    'history': History,
    'circle-help': HelpCircle,
    'map-pin': MapPin,
    'clipboard-list': ClipboardList,
    'clipboard': Clipboard,
    'camera': Camera,
    'user-check': UserCheck,
    'wifi-off': WifiOff,
    'refresh-cw': RefreshCw,
    'file-check': FileCheck,
    'navigation': Navigation,
    'file-warning': AlertTriangle,
    'scan-search': ScanSearch,
    'brain': Brain,
    'file-scan': FileScan,
    'wand-sparkles': Wand2,
    'trending-up': TrendingUp,
    'shield-alert': ShieldAlert,
    'lightbulb': Lightbulb,
    'bell-ring': BellRing,
    'activity': Activity,
    'bot': Bot,
    'users': Users,
    'shield-check': ShieldCheck,
    'network': Network,
    'git-branch': GitBranch,
    'sliders-horizontal': SlidersHorizontal,
    'list': List,
    'shield': Shield,
    'bell-cog': BellRing,
    'settings': Settings,
  };

  return (customMap as any)[iconName] || HelpCircle;
};

// -------------------------------------------------------------
// Static Enrichment data for Core Systems to preserve original depth
// -------------------------------------------------------------
const DOMAIN_ENRICHMENT: {
  [code: string]: {
    suiteKey: string;
    suiteAr: string;
    suiteEn: string;
    targetTab: TabId;
    managedEntitiesAr: string[];
    managedEntitiesEn: string[];
    primaryKpiAr: string;
    primaryKpiEn: string;
    kpiValue: string;
    status: 'ONLINE' | 'ACTIVE' | 'SECURED' | 'OPTIMIZED';
    bgGradient: string;
    badgeBg: string;
    badgeText: string;
  };
} = {
  'NEB-01': {
    suiteKey: 'strategic',
    suiteAr: 'المجموعة الاستراتيجية',
    suiteEn: 'Strategic Suite',
    targetTab: 'dashboard',
    managedEntitiesAr: ['مؤشرات KPIs الرئيسية', 'الأهداف الاستراتيجية 2026', 'بطاقات الأداء المتوازن', 'مواءمة الأهداف المؤسسية'],
    managedEntitiesEn: ['Balanced Scorecards', '2026 Strategic Objectives', 'KPI Target Metrics', 'Organizational Alignment'],
    primaryKpiAr: 'معدل تحقق الأهداف',
    primaryKpiEn: 'Strategic Target Index',
    kpiValue: '96.4%',
    status: 'OPTIMIZED',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
  },
  'NEB-02': {
    suiteKey: 'strategic',
    suiteAr: 'المجموعة الاستراتيجية',
    suiteEn: 'Strategic Suite',
    targetTab: 'programs',
    managedEntitiesAr: ['محافظ الإغاثة والتنمية', 'المبادرات الاستراتيجية', 'الأوزان المالية للمحافظ', 'مؤشرات صحة المحفظة'],
    managedEntitiesEn: ['Relief & Development Portfolios', 'Macro Initiatives', 'Capital Weight Allocation', 'Portfolio Health Index'],
    primaryKpiAr: 'المحافظ النشطة المعمدة',
    primaryKpiEn: 'Active Approved Portfolios',
    kpiValue: '8 Portfolios',
    status: 'ACTIVE',
    bgGradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
  },
  'NEB-03': {
    suiteKey: 'operations',
    suiteAr: 'المجموعة التشغيلية',
    suiteEn: 'Operations Suite',
    targetTab: 'programs',
    managedEntitiesAr: ['الأسقف المالية للبرامج', 'البرامج التنموية والإغاثية', 'التوزيع الجغرافي للتدخل', 'مؤشرات الكفاءة التشغيلية'],
    managedEntitiesEn: ['Program Budget Ceilings', 'Relief & Social Programs', 'Geographic Coverage', 'Operational Efficiency'],
    primaryKpiAr: 'إجمالي البرامج النشطة',
    primaryKpiEn: 'Active Program Registry',
    kpiValue: '14 Programs',
    status: 'ONLINE',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    badgeText: 'text-amber-600 dark:text-amber-400',
  },
  'NEB-04': {
    suiteKey: 'operations',
    suiteAr: 'المجموعة التشغيلية',
    suiteEn: 'Operations Suite',
    targetTab: 'projects',
    managedEntitiesAr: ['أكواد المشاريع (PROJ)', 'مصفوفة تتبع المخاطر', 'جداول الصرف والتعميد', 'نسب الإنجاز الميداني'],
    managedEntitiesEn: ['Project Code Registry', 'Risk Register & Mitigations', 'Disbursement Schedules', 'Field Completion Rates'],
    primaryKpiAr: 'المشاريع التنفيذية الميدانية',
    primaryKpiEn: 'Active Field Projects',
    kpiValue: '42 Projects',
    status: 'ONLINE',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    badgeBg: 'bg-blue-500/10 border-blue-500/30',
    badgeText: 'text-blue-600 dark:text-blue-400',
  },
  'NEB-05': {
    suiteKey: 'operations',
    suiteAr: 'المجموعة التشغيلية',
    suiteEn: 'Operations Suite',
    targetTab: 'activities',
    managedEntitiesAr: ['هيكل حزم العمل WBS', 'الجدول الزمني للأنشطة', 'قوافل التوزيع الميداني', 'سندات الاستلام والترحيل'],
    managedEntitiesEn: ['Work Breakdown Structure', 'Field Timelines', 'Relief Distribution Convoys', 'Execution Vouchers'],
    primaryKpiAr: 'الأنشطة الميدانية المنجزة',
    primaryKpiEn: 'Completed Field Activities',
    kpiValue: '186 Tasks',
    status: 'ACTIVE',
    bgGradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
    badgeText: 'text-cyan-600 dark:text-cyan-400',
  },
  'NEB-06': {
    suiteKey: 'social',
    suiteAr: 'الخدمات الاجتماعية',
    suiteEn: 'Social Service Suite',
    targetTab: 'beneficiaries',
    managedEntitiesAr: ['سجل المستفيدين والأسر', 'استمارات تقييم الأهلية', 'البصمة الحيوية والـ GPS', 'حالات المساعدات المباشرة'],
    managedEntitiesEn: ['Verified Household Directory', 'Socioeconomic Surveys', 'Biometric Verification & GPS', 'Direct Aid Cases'],
    primaryKpiAr: 'الأسر المستفيدة المعمدة',
    primaryKpiEn: 'Verified Beneficiary Families',
    kpiValue: '12,850 Cases',
    status: 'SECURED',
    bgGradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
    badgeBg: 'bg-teal-500/10 border-teal-500/30',
    badgeText: 'text-teal-600 dark:text-teal-400',
  },
  'NEB-07': {
    suiteKey: 'social',
    suiteAr: 'الخدمات الاجتماعية',
    suiteEn: 'Social Service Suite',
    targetTab: 'sponsorships',
    managedEntitiesAr: ['سجل الجمعية العمومية', 'شبكة المتطوعين الميدانية', 'اللجان المجتمعية المحلية', 'كفالات الأيتام والرعاية'],
    managedEntitiesEn: ['General Assembly Directory', 'Volunteer Field Network', 'Local Community Committees', 'Sponsorship Stipend Program'],
    primaryKpiAr: 'كفالات الأيتام والطلاب النشطة',
    primaryKpiEn: 'Active Sponsorship Stipends',
    kpiValue: '1,240 Orphans',
    status: 'ONLINE',
    bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    badgeBg: 'bg-rose-500/10 border-rose-500/30',
    badgeText: 'text-rose-600 dark:text-rose-400',
  },
  'NEB-08': {
    suiteKey: 'finance',
    suiteAr: 'المالية والاستدامة والتمويل',
    suiteEn: 'Finance & Sustainability',
    targetTab: 'contracts',
    managedEntitiesAr: ['اتفاقيات التمويل والمنح الإنسانية', 'شبكة الشركاء والمانحين الدوليين', 'تقييم القدرات المؤسسية PCA', 'مطابقة معايير IATI & Sphere'],
    managedEntitiesEn: ['Grant Agreements & Donor Funding', 'International Partner Network', 'Partner Capacity Assessment PCA', 'IATI & Sphere Standards Compliance'],
    primaryKpiAr: 'نسبة الالتزامات والتمويل المعمد',
    primaryKpiEn: 'Approved Funding Collection Rate',
    kpiValue: '96.2%',
    status: 'OPTIMIZED',
    bgGradient: 'from-violet-500/10 via-violet-500/5 to-transparent',
    badgeBg: 'bg-violet-500/10 border-violet-500/30',
    badgeText: 'text-violet-600 dark:text-violet-400',
  },
  'NEB-09': {
    suiteKey: 'governance',
    suiteAr: 'الموارد والحوكمة',
    suiteEn: 'Resource & Governance',
    targetTab: 'users',
    managedEntitiesAr: ['سجل الموظفين والمستخدمين', 'مصفوفة الأصول والأوقاف', 'أدوار وتفويضات الصلاحيات', 'أسطول العمليات والمعدات'],
    managedEntitiesEn: ['Staff & User Directory', 'Asset & Endowment Ledger', 'Role Security Matrix', 'Operational Equipment Fleet'],
    primaryKpiAr: 'الموظفين والكادر النشط',
    primaryKpiEn: 'Active Staff & Personnel',
    kpiValue: '64 Users',
    status: 'SECURED',
    bgGradient: 'from-sky-500/10 via-sky-500/5 to-transparent',
    badgeBg: 'bg-sky-500/10 border-sky-500/30',
    badgeText: 'text-sky-600 dark:text-sky-400',
  },
  'NEB-10': {
    suiteKey: 'finance',
    suiteAr: 'المالية والحوكمة',
    suiteEn: 'Finance & Compliance Suite',
    targetTab: 'finance',
    managedEntitiesAr: ['شجرة الحسابات IPSAS', 'دفتر القيود المزدوجة', 'الصناديق والمحفظة المالية', 'مراكز التكلفة والتدقيق'],
    managedEntitiesEn: ['IPSAS Chart of Accounts', 'Double-Entry General Ledger', 'Restricted Fund Accounts', 'Audit Cost Centers'],
    primaryKpiAr: 'الحسابات المقفلة والمعمدة',
    primaryKpiEn: 'Locked Ledger Vouchers',
    kpiValue: '$2.45M Audited',
    status: 'SECURED',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
  },
  'NEB-11': {
    suiteKey: 'governance',
    suiteAr: 'المعرفة والحوكمة',
    suiteEn: 'Knowledge & Governance',
    targetTab: 'docs',
    managedEntitiesAr: ['الأرشيف الرقمي للوثائق', 'اللوائح والسياسات المعتمدة', 'الموجهات والسيناريوهات (SOP)', 'سجلات التاريخ الإنساني'],
    managedEntitiesEn: ['Digital Document Vault', 'Corporate Regulations & SOPs', 'Operational Scenario Playbooks', 'Historical Archives'],
    primaryKpiAr: 'المستندات المؤرشفة والمعمدة',
    primaryKpiEn: 'Archived Certified Docs',
    kpiValue: '3,420 Files',
    status: 'ONLINE',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    badgeText: 'text-amber-600 dark:text-amber-400',
  },
  'NEB-12': {
    suiteKey: 'tech',
    suiteAr: 'التقنية والتكامل',
    suiteEn: 'Technology & Integration',
    targetTab: 'currencies',
    managedEntitiesAr: ['ربط Neon PostgreSQL الحقيقي', 'أسعار الصرف المتعددة', 'واجهات APIs الخارجية', 'معيار الشفافية الدولية IATI'],
    managedEntitiesEn: ['Neon PostgreSQL Database Pool', 'Multi-Currency Exchange Pool', 'External REST API Gateways', 'IATI Transparency Standard'],
    primaryKpiAr: 'استقرار قاعدة البيانات السحابية',
    primaryKpiEn: 'Neon Cloud Database Status',
    kpiValue: '99.98% Pool Live',
    status: 'SECURED',
    bgGradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
    badgeBg: 'bg-purple-500/10 border-purple-500/30',
    badgeText: 'text-purple-600 dark:text-purple-400',
  },
  'NEB-13': {
    suiteKey: 'intelligence',
    suiteAr: 'الذكاء والأثر المؤسسي',
    suiteEn: 'AI & Impact Suite',
    targetTab: 'reports',
    managedEntitiesAr: ['مساعد Gemini AI Copilot', 'معايير Sphere الإنسانية', 'تقارير الأثر المطبوعة A4', 'التحليل التنبؤي للاحتياج'],
    managedEntitiesEn: ['Gemini AI Intelligence Copilot', 'Sphere & CHS Standards Score', 'High-Fidelity A4 PDF Reports', 'Predictive Needs Analytics'],
    primaryKpiAr: 'معيار الأثر الإنساني CHS',
    primaryKpiEn: 'CHS Humanitarian Impact Score',
    kpiValue: '94 / 100 CHS',
    status: 'OPTIMIZED',
    bgGradient: 'from-fuchsia-500/10 via-fuchsia-500/5 to-transparent',
    badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/30',
    badgeText: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  'NEB-14': {
    suiteKey: 'operations',
    suiteAr: 'المجموعة التشغيلية والمشتريات',
    suiteEn: 'Operations & Procurement',
    targetTab: 'programs',
    managedEntitiesAr: ['طلبات الشراء والموافقات', 'إدارة الموردين والمقاولين', 'طرح المناقصات والعطاءات', 'أوامر الشراء والتوريد'],
    managedEntitiesEn: ['Purchase Requisitions', 'Vendor Registry', 'Tenders & RFQs', 'Purchase Orders'],
    primaryKpiAr: 'نسبة إنجاز المشتريات',
    primaryKpiEn: 'Procurement Completion',
    kpiValue: '92.5%',
    status: 'ACTIVE',
    bgGradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
    badgeBg: 'bg-orange-500/10 border-orange-500/30',
    badgeText: 'text-orange-600 dark:text-orange-400',
  },
  'NEB-15': {
    suiteKey: 'finance',
    suiteAr: 'المالية والإيرادات',
    suiteEn: 'Finance & Revenue Suite',
    targetTab: 'sales',
    managedEntitiesAr: ['بوابات التبرع السريع', 'إدارة الفواتير والإيصالات', 'حملات التمويل الجماعي', 'نقاط الخدمة ومراكز التبرع'],
    managedEntitiesEn: ['Donation Gateways', 'Digital Invoicing & Receipts', 'Crowdfunding Campaigns', 'Service Hubs & Points of Sale'],
    primaryKpiAr: 'إجمالي الإيرادات المحصلة',
    primaryKpiEn: 'Total Collected Revenue',
    kpiValue: '40.7M YER',
    status: 'SECURED',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
  },
};

export default function DomainCenterView({ lang, onNavigate }: DomainCenterViewProps) {
  const branding = useOrganizationBranding();
  const isRtl = lang === 'ar';
  const orgName = isRtl ? branding.orgName : branding.activeOrg?.name_en || "Rohamā'a Baynahum Charity Foundation";

  // -------------------------------------------------------------
  // Primary Navigation Tabs (5 Layers of NexoraOS™ Architecture)
  // -------------------------------------------------------------
  const [activeSegmentTab, setActiveSegmentTab] = useState<'domains' | 'tools' | 'field' | 'ai' | 'admin'>('domains');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuite, setSelectedSuite] = useState<string>('all');
  const [selectedDomainModal, setSelectedDomainModal] = useState<any>(null);

  // -------------------------------------------------------------
  // Tab 2: Shared Work Tools Interactive States
  // -------------------------------------------------------------
  const [selectedTool, setSelectedTool] = useState<any>(ORGANIZATION_CONFIG.workTools[3]); // Tool-04 default (Approvals)
  const [approvalsList, setApprovalsList] = useState([
    { id: 101, title: isRtl ? 'صرف ميزانية طارئة لإعادة تأهيل بئر مياه في تعز' : 'Emergency budget disbursement for water well in Taiz', cost: '$4,500', requester: 'م. أحمد الوصابي', status: 'pending' },
    { id: 102, title: isRtl ? 'اعتماد سلة غذائية رمضانية لـ 350 أسرة نازحة في مأرب' : 'Approve Ramadan food packages for 350 IDP families in Marib', cost: '$12,250', requester: 'أ. سارة الريمي', status: 'pending' },
    { id: 103, title: isRtl ? 'طلب ترقية خوادم قاعدة بيانات Neon PostgreSQL' : 'Neon PostgreSQL database server capacity upgrade request', cost: '$350/mo', requester: 'م. خالد الحميري', status: 'pending' },
  ]);
  const [stickyNotes, setStickyNotes] = useState<{ id: number; text: string; color: string }[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_sticky_notes');
      return saved ? JSON.parse(saved) : [
        { id: 1, text: isRtl ? 'اجتماع مع وفد مبعوث الأمم المتحدة للشؤون الإنسانية الساعة ١١ صباحاً' : 'Meeting with UN Humanitarian delegation at 11:00 AM', color: 'bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800' },
        { id: 2, text: isRtl ? 'مراجعة معايير الكفاءة بمخطط IPSAS للربع السنوي الثاني' : 'Review IPSAS ledger compliance for Q2 audits', color: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800' }
      ];
    } catch {
      return [];
    }
  });
  const [newNoteText, setNewNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800');

  // Save sticky notes
  useEffect(() => {
    localStorage.setItem('nexora_sticky_notes', JSON.stringify(stickyNotes));
  }, [stickyNotes]);

  // -------------------------------------------------------------
  // Tab 3: Field Capabilities GIS & Offline States
  // -------------------------------------------------------------
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [fieldWorkers, setFieldWorkers] = useState<any[]>([]);
  const [selectedSurveyChecklist, setSelectedSurveyChecklist] = useState({
    headOfHousehold: '',
    familySize: 1,
    governorate: 'Taiz',
    needsWaterAid: false,
    needsFoodAid: false,
    needsHealthAid: false,
    notes: ''
  });
  const [surveyLogs, setSurveyLogs] = useState<string[]>([]);

  // -------------------------------------------------------------
  // Tab 4: AI Layer Stream Playground States
  // -------------------------------------------------------------
  const [selectedAiTool, setSelectedAiTool] = useState<any>(ORGANIZATION_CONFIG.intelligence[4]); // Wand sparkles (AI Report)
  const [aiPrompt, setAiPrompt] = useState(isRtl ? 'أريد مسودة تقرير الأثر الاجتماعي لمشروع توزيع خزانات مياه صالحة للشرب في ريف تعز الغربي متوافقاً مع المعيار الإنساني CHS ومعايير Sphere' : 'Generate social impact draft for water storage distribution project in Taiz rural aligned with Sphere and Core Humanitarian Standard (CHS).');
  const [aiOutput, setAiOutput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Simulate Gemini AI stream text generation
  const handleQueryGemini = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setAiOutput('');

    // Try the real Gemini backend proxy first; fall back to a draft template
    try {
      const token = localStorage.getItem('rbd_token');
      const res = await fetch('/api/gemini/domain-center', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setAiOutput(data.text);
          setIsAiGenerating(false);
          return;
        }
      }
    } catch { /* backend not configured — show draft */ }

    // Honest draft template when backend AI is not configured
    const draftOutput = isRtl
      ? `[مسودة — خدمة الذكاء الاصطناعي غير مُعدّة بعد]
───────────────────────────────────────────
الطلب المُدخل:
${aiPrompt}

⚠️  خدمة Gemini AI غير مُفعّلة في الخادم. لتفعيل التحليل الذكي، أعد تكوين مفتاح Gemini API في ملف config/index.ts.

هذه المسودة تُظهر طلبك فقط. سيتم استبدالها بتحليل حقيقي فور تفعيل الخدم.`
      : `[DRAFT — AI service not configured yet]
───────────────────────────────────────────
Your prompt:
${aiPrompt}

⚠️  Gemini AI service is not enabled on the server. To activate intelligent analysis, configure the Gemini API key in config/index.ts.

This draft shows your prompt only. It will be replaced with real analysis once the service is enabled.`;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < draftOutput.length) {
        setAiOutput((prev) => prev + draftOutput[currentIndex]);
        currentIndex += 3;
      } else {
        clearInterval(interval);
        setIsAiGenerating(false);
      }
    }, 15);
  };

  // -------------------------------------------------------------
  // Tab 5: Platform Administration States
  // -------------------------------------------------------------
  const [selectedAdminTool, setSelectedAdminTool] = useState<any>(ORGANIZATION_CONFIG.administration[1]); // Roles-permissions default
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [workflowNodes, setWorkflowNodes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Load real audit logs from the database
  useEffect(() => {
    let cancelled = false;
    const loadLogs = async () => {
      try {
        const token = localStorage.getItem('rbd_token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/tables/audit_logs?limit=10', { headers });
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data?.data) ? data.data : [];
        if (cancelled) return;
        setAuditLogs(rows.map((r: any) => ({
          timestamp: new Date(r.timestamp || r.created_at).toLocaleTimeString(),
          user: r.user_email || '-',
          module: r.module || '-',
          action: r.action_type || '-',
          desc: r.action_en || r.action_ar || '-'
        })));
      } catch { /* non-critical */ }
    };
    loadLogs();
    return () => { cancelled = true; };
  }, []);

  const togglePermission = (roleId: string, permKey: 'read' | 'write' | 'approve' | 'audit') => {
    setAdminRoles(prev => prev.map(r => {
      if (r.id === roleId) {
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [permKey]: !r.permissions[permKey]
          }
        };
      }
      return r;
    }));
  };

  // -------------------------------------------------------------
  // Search & Filter computation based on active tab
  // -------------------------------------------------------------
  const filteredCoreDomains = ORGANIZATION_CONFIG.coreSystems.map(sys => {
    const enrich = DOMAIN_ENRICHMENT[sys.code] || {
      suiteKey: 'strategic',
      suiteAr: 'المجموعة الاستراتيجية',
      suiteEn: 'Strategic Suite',
      targetTab: 'dashboard' as TabId,
      managedEntitiesAr: sys.modules,
      managedEntitiesEn: sys.modules,
      primaryKpiAr: 'مؤشر الكفاءة',
      primaryKpiEn: 'Efficiency Ratio',
      kpiValue: '90%',
      status: 'ONLINE' as const,
      bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
    };

    return {
      id: sys.code.toLowerCase(),
      code: sys.code,
      titleAr: sys.nameAr,
      titleEn: sys.nameEn,
      suiteKey: enrich.suiteKey,
      suiteAr: enrich.suiteAr,
      suiteEn: enrich.suiteEn,
      descAr: sys.descriptionAr,
      descEn: sys.descriptionEn,
      icon: resolveIcon(sys.icon),
      accentColor: 'border-emerald-500/40 hover:border-emerald-500',
      bgGradient: enrich.bgGradient,
      badgeBg: enrich.badgeBg,
      badgeText: enrich.badgeText,
      targetTab: enrich.targetTab,
      managedEntitiesAr: sys.modules,
      managedEntitiesEn: sys.modules,
      primaryKpiAr: enrich.primaryKpiAr,
      primaryKpiEn: enrich.primaryKpiEn,
      kpiValue: enrich.kpiValue,
      status: enrich.status,
    };
  }).filter(d => {
    const matchesSearch = 
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.titleAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.descAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.descEn.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSuite = selectedSuite === 'all' || d.suiteKey === selectedSuite;
    return matchesSearch && matchesSuite;
  });

  const filteredWorkTools = ORGANIZATION_CONFIG.workTools.filter(t => 
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFieldCaps = ORGANIZATION_CONFIG.fieldCapabilities.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIntelligence = ORGANIZATION_CONFIG.intelligence.filter(i => 
    i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdmin = ORGANIZATION_CONFIG.administration.filter(a => 
    a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const suiteFilterOptions = [
    { key: 'all', labelAr: 'جميع الأنظمة المؤسسية (15)', labelEn: 'All Enterprise Systems (15)' },
    { key: 'strategic', labelAr: '🎯 الاستراتيجية (NEB 01-02)', labelEn: '🎯 Strategic (NEB 01-02)' },
    { key: 'operations', labelAr: '⚡ العمليات والمشتريات (NEB 03-05, 14)', labelEn: '⚡ Operations & Proc. (NEB 03-05, 14)' },
    { key: 'social', labelAr: '🤝 الاجتماعية (NEB 06-07)', labelEn: '🤝 Social Services (NEB 06-07)' },
    { key: 'finance', labelAr: '💰 المالية والإيرادات (NEB 08, 10, 15)', labelEn: '💰 Finance & Revenue (NEB 08, 10, 15)' },
    { key: 'governance', labelAr: '🛡️ الحوكمة والأصول (NEB 09, 11)', labelEn: '🛡️ Governance & Assets (NEB 09, 11)' },
    { key: 'tech', labelAr: '🌐 التقنية والتكامل (NEB 12)', labelEn: '🌐 Tech & Data (NEB 12)' },
    { key: 'intelligence', labelAr: '🧠 الذكاء والأثر (NEB 13)', labelEn: '🧠 AI & Impact (NEB 13)' },
  ];

  return (
    <ModuleShell
      titleAr="مركز النطاقات"
      titleEn="Domain Center"
      domainCode="NEB-12"
      icon={Compass}
      lang={lang}
    >
    <div id="nexora-enterprise-domain-center" className="space-y-6 animate-fade-in text-slate-900 dark:text-zinc-100 pb-16 max-w-full">
      
      {/* Brand Header Banner */}
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-6 lg:p-7 text-slate-900 dark:text-white shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>NexoraOS™ Operating Core</span>
              </span>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-400 rounded-lg border border-amber-500/30 text-xs font-mono font-black">
                {isRtl ? 'الرابطة التشغيلية الموحدة' : 'Unified Enterprise Model'}
              </span>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-bold">
                {ORGANIZATION_CONFIG.tagline}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {isRtl ? 'بوابة الرابطة التشغيلية والأنظمة الذكية' : 'NexoraOS™ System & Enterprise Launcher'}
            </h1>

            <p className="text-xs md:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-semibold">
              {isRtl 
                ? `المركز العملياتي المتكامل لإدارة الأثر الإنساني وموارد ${orgName} بكفاءة حقيقية. يجمع هذا المركز بين الأنظمة المؤسسية الـ ١٣ وأدوات العمل والذكاء الاستشرافي بالتكامل مع Neon PostgreSQL.`
                : `Comprehensive command and launcher suite for ${orgName}, syncing core domains, shared toolsets, GIS telemetry, and predictive Gemini AI workflows.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-xl flex items-center gap-4 text-center shadow-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase block">{isRtl ? 'حالة التزامن' : 'Sync Status'}</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">100% Secure</span>
              </div>
              <div className="w-px h-7 bg-slate-200 dark:bg-zinc-800"></div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase block">{isRtl ? 'خوادم السحاب' : 'Cloud DB'}</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">PostgreSQL Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Horizontal Segmented Tabs Navigation Bar (The 5 Layers of NexoraOS™ Architecture) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 justify-start">
          <button
            onClick={() => { setActiveSegmentTab('domains'); setSearchTerm(''); }}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSegmentTab === 'domains'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-400'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>{isRtl ? '١٥ نظاماً مؤسسياً' : '15 Core Systems'}</span>
          </button>

          <button
            onClick={() => { setActiveSegmentTab('tools'); setSearchTerm(''); }}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSegmentTab === 'tools'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-400'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>{isRtl ? '٢٠ أداة عمل مشتركة' : '20 Work Tools'}</span>
          </button>

          <button
            onClick={() => { setActiveSegmentTab('field'); setSearchTerm(''); }}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSegmentTab === 'field'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-400'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{isRtl ? '١٠ قدرات ميدانية GIS' : '10 Field GIS'}</span>
          </button>

          <button
            onClick={() => { setActiveSegmentTab('ai'); setSearchTerm(''); }}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSegmentTab === 'ai'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-400'
            }`}
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>{isRtl ? '١١ طبقة ذكاء اصطناعي' : '11 AI Layer'}</span>
          </button>

          <button
            onClick={() => { setActiveSegmentTab('admin'); setSearchTerm(''); }}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSegmentTab === 'admin'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-400'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{isRtl ? '١١ مجمعاً إدارياً' : '11 Admin Suite'}</span>
          </button>
        </div>
      </div>

      {/* Quick Search & Filter Panel */}
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-300 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className={`w-4 h-4 text-amber-600 dark:text-amber-400 absolute top-3.5 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeSegmentTab === 'domains' ? (isRtl ? 'البحث في الأنظمة الـ ١٣ (مثال: الاستراتيجية، المالية، المستفيدين...)' : 'Search core 13 systems (e.g. Strategy, Finance, Welfare...)') :
                activeSegmentTab === 'tools' ? (isRtl ? 'البحث في أدوات العمل الـ ٢٠ (مثال: الموافقات، الملاحظات، الأرشيف...)' : 'Search 20 work tools (e.g. Approvals, Sticky Notes...)') :
                activeSegmentTab === 'field' ? (isRtl ? 'البحث في القدرات الميدانية الـ ١٠ (مثال: تتبع الموقع، الاتصال غير المباشر...)' : 'Search 10 field capacities (e.g. GIS, Offline, Geotagging...)') :
                activeSegmentTab === 'ai' ? (isRtl ? 'البحث في طبقة ذكاء Gemini AI (مثال: توليد تقارير، استشراف، تنبؤ...)' : 'Search 11 AI modules (e.g. Report Generator, Predictive...)') :
                (isRtl ? 'البحث في مجمعات الإدارة (مثال: الصلاحيات، مسارات العمل، تدقيق العمليات...)' : 'Search 11 admin tools (e.g. Roles, Workflows, Audit...)')
              }
              className={`w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'} text-xs font-bold text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all`}
            />
          </div>

          {activeSegmentTab === 'domains' && (
            <div className="flex flex-wrap items-center gap-1 text-[11px] overflow-x-auto pb-1 lg:pb-0">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 shrink-0 mr-1.5 rtl:ml-1.5">
                {isRtl ? 'تصفية سريعة:' : 'Quick Filter:'}
              </span>
              <button
                onClick={() => setSearchTerm('الاستراتيجية')}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-lg font-bold shrink-0 cursor-pointer"
              >
                {isRtl ? 'الاستراتيجية' : 'Strategy'}
              </button>
              <button
                onClick={() => setSearchTerm('التشغيل')}
                className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 rounded-lg font-bold shrink-0 cursor-pointer"
              >
                {isRtl ? 'التشغيل WBS' : 'Field Ops'}
              </button>
              <button
                onClick={() => setSearchTerm('المالية')}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg font-bold shrink-0 cursor-pointer"
              >
                {isRtl ? 'المالية IPSAS' : 'Finance'}
              </button>
            </div>
          )}
        </div>

        {activeSegmentTab === 'domains' && (
          <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs flex-1 max-w-full">
              {suiteFilterOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedSuite(opt.key)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSuite === opt.key
                      ? 'bg-amber-600 text-white font-black shadow-sm shadow-amber-600/20 border border-amber-600'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  {isRtl ? opt.labelAr : opt.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          TAB 1: Core Systems (الأنظمة الـ ١٣ المترابطة)
         ------------------------------------------------------------- */}
      {activeSegmentTab === 'domains' && (
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar max-w-full rounded-xl p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 min-w-[300px]">
            {filteredCoreDomains.map((domain) => {
              const DomainIcon = domain.icon;
              return (
                <div
                  key={domain.id}
                  className="group bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 hover:border-emerald-600/80 dark:hover:border-emerald-500/80 hover:ring-2 hover:ring-emerald-500/20 rounded-xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 left-0 h-2 bg-gradient-to-r ${domain.bgGradient}`}></div>

                  <div>
                    {/* Header: Domain Status & Category */}
                    <div className="flex items-center justify-between gap-2 mb-3.5 pt-1 relative z-10">
                      <div className={`px-2.5 py-1 rounded-lg border ${domain.badgeBg} ${domain.badgeText} text-xs font-bold flex items-center gap-1.5 shadow-2xs`}>
                        <Grid className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'نظام تشغيلي نشط' : 'Active Domain'}</span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-md border border-slate-200 dark:border-zinc-700">
                        {isRtl ? domain.suiteAr : domain.suiteEn}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-3 mb-3.5 relative z-10">
                      <div className="p-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-amber-400 border border-slate-800 dark:border-zinc-700 group-hover:scale-105 transition-transform shrink-0 shadow-xs">
                        <DomainIcon className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug truncate">
                          {isRtl ? domain.titleAr : domain.titleEn}
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 font-bold uppercase truncate">
                          {isRtl ? domain.suiteAr : domain.suiteEn} • {isRtl ? 'وحدة متكاملة' : 'Integrated System'}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-semibold mb-4 line-clamp-3 relative z-10">
                      {isRtl ? domain.descAr : domain.descEn}
                    </p>

                    {/* Modules List */}
                    <div className="space-y-1.5 mb-5 pt-3 border-t border-slate-200 dark:border-zinc-800 relative z-10">
                      <span className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider block mb-1.5">
                        {isRtl ? 'الوحدات والسجلات المدارة:' : 'Sub-modules & Services:'}
                      </span>
                      {domain.managedEntitiesAr.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{isRtl ? item : domain.managedEntitiesEn[idx]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-slate-200 dark:border-zinc-800 space-y-3 relative z-10">
                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 font-mono">
                      <div>
                        <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase block">{isRtl ? domain.primaryKpiAr : domain.primaryKpiEn}</span>
                        <span className="font-black text-slate-900 dark:text-zinc-100">{domain.kpiValue}</span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        {domain.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate(domain.targetTab)}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 group/btn"
                      >
                        <span>{isRtl ? 'عرض تفاصيل المجال' : 'View Workspace'}</span>
                        {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => setSelectedDomainModal(domain)}
                        className="p-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: Shared Work Tools (٢٠ أداة عمل مشتركة مع مركز تفاعلي)
         ------------------------------------------------------------- */}
      {activeSegmentTab === 'tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Grid: Tools List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-black uppercase text-zinc-400 tracking-wider">
              {isRtl ? 'سجل الأدوات الـ ٢٠ المعمدة بالرابطة التشغيلية' : '20 Registered Work Tools'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredWorkTools.map((tool) => {
                const ToolIcon = resolveIcon(tool.icon);
                const isSelected = selectedTool?.code === tool.code;
                return (
                  <div
                    key={tool.code}
                    onClick={() => setSelectedTool(tool)}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                      isSelected
                        ? 'bg-amber-500/5 border-amber-500 ring-1 ring-amber-500/30'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-slate-400'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-amber-500 dark:text-amber-400'
                    }`}>
                      <ToolIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-mono font-black text-amber-600 dark:text-amber-400">{tool.code}</span>
                        <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 text-[8px] font-bold rounded">SUPPORTED</span>
                      </div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 mt-1">
                        {isRtl ? tool.nameAr : tool.nameEn}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 font-semibold">
                        {isRtl ? 'متاح للدمج اللحظي بواجهة العمل' : 'Global workflow utility tool'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Interactive Work Workspace */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-5 md:p-6 space-y-5 h-fit shadow-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl">
                {React.createElement(resolveIcon(selectedTool?.icon || 'layout-dashboard'), { className: 'w-5 h-5' })}
              </div>
              <div>
                <span className="text-[9px] font-mono font-black text-amber-600 dark:text-amber-400">{selectedTool?.code}</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {isRtl ? selectedTool?.nameAr : selectedTool?.nameEn}
                </h3>
              </div>
            </div>

            {/* Simulated Tool-Specific Views */}
            {selectedTool?.code === 'TOOL-04' ? (
              // Approvals Desk Simulation
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400">{isRtl ? 'الموافقات المعلقة (٣)' : 'Pending Approvals (3)'}</span>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-bold rounded border border-amber-500/20">IPSAS AUDIT</span>
                </div>
                <div className="space-y-2.5">
                  {approvalsList.map(app => (
                    <div key={app.id} className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs space-y-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 line-clamp-2 leading-relaxed">{app.title}</span>
                        <span className="font-mono text-emerald-500 font-black shrink-0">{app.cost}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 pt-1.5 border-t border-slate-100 dark:border-zinc-900 font-semibold">
                        <span>{isRtl ? 'مقدم الطلب: ' : 'By: '}{app.requester}</span>
                        {app.status === 'pending' ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setApprovalsList(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
                                alert(isRtl ? 'تم التوقيع الإلكتروني المؤمّن والترحيل لشجرة الحسابات IPSAS!' : 'Authorized & posted to IPSAS double-entry ledger!');
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer transition-colors"
                            >
                              {isRtl ? 'تعميد' : 'Approve'}
                            </button>
                            <button
                              onClick={() => setApprovalsList(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a))}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition-colors"
                            >
                              {isRtl ? 'رفض' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span className={`font-black uppercase text-[9px] ${app.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {app.status === 'approved' ? (isRtl ? 'تم التعميد ✓' : 'Approved ✓') : (isRtl ? 'مرفوض ✗' : 'Rejected ✗')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedTool?.code === 'TOOL-12' ? (
              // Sticky Notes & Tags Simulator
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400">{isRtl ? 'الملاحظات والوسوم الشخصية' : 'Personal Sticky Notes & Tags'}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {stickyNotes.map(note => (
                      <div key={note.id} className={`p-3 rounded-xl border text-[11px] font-semibold text-slate-800 dark:text-zinc-200 ${note.color} relative group/note`}>
                        <button
                          onClick={() => setStickyNotes(prev => prev.filter(n => n.id !== note.id))}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover/note:opacity-100 transition-opacity text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="leading-normal">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-3">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={isRtl ? 'اكتب ملاحظة جديدة وسريعة...' : 'Write quick sticky note...'}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-2 text-xs font-bold rounded-xl focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setNoteColor('bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800')}
                        className={`w-4.5 h-4.5 rounded-full bg-amber-200 border ${noteColor.includes('amber') ? 'ring-2 ring-amber-500' : ''}`}
                      />
                      <button
                        onClick={() => setNoteColor('bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800')}
                        className={`w-4.5 h-4.5 rounded-full bg-emerald-200 border ${noteColor.includes('emerald') ? 'ring-2 ring-emerald-500' : ''}`}
                      />
                      <button
                        onClick={() => setNoteColor('bg-blue-100 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800')}
                        className={`w-4.5 h-4.5 rounded-full bg-blue-200 border ${noteColor.includes('blue') ? 'ring-2 ring-blue-500' : ''}`}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newNoteText.trim()) return;
                        setStickyNotes(prev => [...prev, { id: Date.now(), text: newNoteText, color: noteColor }]);
                        setNewNoteText('');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer"
                    >
                      {isRtl ? 'إضافة ملاحظة' : 'Add Note'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Universal Tool Terminal Simulator
              <div className="space-y-4">
                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-semibold">
                  {isRtl 
                    ? `أداة العمل الموحدة مدمجة وجاهزة للتكليف الفوري بالمسارات التشغيلية للجمعية.`
                    : `Global shared utility tool ready for workflow assignment.`}
                </p>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-[10px] font-mono leading-relaxed space-y-1">
                  <div className="text-emerald-400 font-bold">[NEXORA_LAUNCHER] Tool registered successfully</div>
                  <div>ID: {selectedTool?.code}</div>
                  <div>Name: {selectedTool?.nameEn}</div>
                  <div>Pool Priority: HIGH_THREAD</div>
                  <div className="opacity-60">[SYS_GATE] Awaiting dynamic trigger in workspace...</div>
                </div>
                <button
                  onClick={() => alert(isRtl ? 'تم اختبار وتدشين الأداة بنجاح!' : 'Global tool launched successfully!')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-extrabold text-xs rounded-xl transition-colors cursor-pointer text-center"
                >
                  {isRtl ? 'اختبار تفعيل الأداة بنجاح' : 'Initiate Diagnostic Test'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 3: Field Capabilities (١٠ قدرات ميدانية GIS وتتبع مباشر)
         ------------------------------------------------------------- */}
      {activeSegmentTab === 'field' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Interactive Telemetry Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-5 md:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>{isRtl ? 'الرصد والتبع الجغرافي النشط GIS' : 'Live GIS Field Telemetry'}</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-mono font-bold text-emerald-500">Live Telemetry</span>
              </div>
            </div>

            {/* Offline Simulator Switch */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200 block">{isRtl ? 'التشغيل والعمل دون اتصال' : 'Offline Operational Support'}</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">{isRtl ? 'محاكاة غياب الاتصال بالإنترنت' : 'Simulate offline disconnected states'}</span>
              </div>
              <button
                onClick={() => {
                  setIsOfflineMode(!isOfflineMode);
                  alert(isOfflineMode ? 'تم تفعيل الاتصال بالإنترنت ومزامنة البيانات مع Neon PostgreSQL بنجاح!' : 'تم تفعيل التشغيل دون اتصال! سيتم تخزين المدخلات محلياً.');
                }}
                className={`px-3 py-1.5 text-[10px] font-black rounded-lg cursor-pointer transition-colors ${
                  isOfflineMode 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                {isOfflineMode ? (isRtl ? 'دون اتصال (نشط)' : 'OFFLINE ACTIVE') : (isRtl ? 'متصل بالشبكة' : 'ONLINE')}
              </button>
            </div>

            {/* Field Workers List */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400">{isRtl ? 'منسقو العمل الميداني الفعالون' : 'Active Field Officers'}</span>
              {fieldWorkers.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-dashed border-slate-200 dark:border-zinc-800 text-center">
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                    {isRtl
                      ? 'لا يوجد تتبع مباشر لmovement الميداني. اربط بيانات الميدان عبر NEB-05 لعرض الحالة.'
                      : 'No real-time field movement data. Link field data via NEB-05 to show live status.'}
                  </p>
                </div>
              ) : fieldWorkers.map((worker: any) => (
                <div key={worker.id} className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800 dark:text-zinc-200">{worker.name || worker.full_name_en || '-'}</span>
                    <span className="text-[10px] font-mono text-emerald-500">{worker.status || 'Active'}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-zinc-400 font-semibold pt-1 border-t border-slate-100 dark:border-zinc-900">
                    <span>{worker.location || worker.department || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Live Survey Builder Simulation */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-5 md:p-6 space-y-4 shadow-xs lg:col-span-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isRtl ? 'استمارة المسح الاجتماعي والتقييم الميداني الذكي (FIELD-02)' : 'Field Socioeconomic Assessment Form (FIELD-02)'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">{isRtl ? 'اسم رب الأسرة المستفيدة' : 'Head of Household Name'}</label>
                  <input
                    type="text"
                    value={selectedSurveyChecklist.headOfHousehold}
                    onChange={(e) => setSelectedSurveyChecklist(prev => ({ ...prev, headOfHousehold: e.target.value }))}
                    placeholder={isRtl ? 'مثال: محمد علي أحمد عبده' : 'e.g. Yahya Al-Taizi'}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-2.5 text-xs font-bold rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">{isRtl ? 'المحافظة / النطاق الجغرافي' : 'Governorate / Target Sector'}</label>
                  <select
                    value={selectedSurveyChecklist.governorate}
                    onChange={(e) => setSelectedSurveyChecklist(prev => ({ ...prev, governorate: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-2.5 text-xs font-bold rounded-xl focus:outline-none"
                  >
                    <option value="Taiz">{isRtl ? 'تعز' : 'Taiz'}</option>
                    <option value="Aden">{isRtl ? 'عدن' : 'Aden'}</option>
                    <option value="Marib">{isRtl ? 'مأرب' : 'Marib'}</option>
                    <option value="Sana'a">{isRtl ? 'صنعاء' : "Sana'a"}</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">{isRtl ? 'الاحتياجات الطارئة المرصودة:' : 'Identified Urgent Needs:'}</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedSurveyChecklist(prev => ({ ...prev, needsWaterAid: !prev.needsWaterAid }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-colors ${
                        selectedSurveyChecklist.needsWaterAid
                          ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      🚰 {isRtl ? 'مياه نظيفة' : 'Safe Water'}
                    </button>
                    <button
                      onClick={() => setSelectedSurveyChecklist(prev => ({ ...prev, needsFoodAid: !prev.needsFoodAid }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-colors ${
                        selectedSurveyChecklist.needsFoodAid
                          ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      🌾 {isRtl ? 'أمن غذائي' : 'Food Security'}
                    </button>
                    <button
                      onClick={() => setSelectedSurveyChecklist(prev => ({ ...prev, needsHealthAid: !prev.needsHealthAid }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-colors ${
                        selectedSurveyChecklist.needsHealthAid
                          ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      🩺 {isRtl ? 'رعاية صحية' : 'Health Care'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">{isRtl ? 'الملاحظات والتقييم الاجتماعي الميداني' : 'Field Social Assessment Notes'}</label>
                  <textarea
                    value={selectedSurveyChecklist.notes}
                    onChange={(e) => setSelectedSurveyChecklist(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={isRtl ? 'أدخل تفاصيل الحالة وتقرير مستوى الضعف...' : 'Enter case details & vulnerability assessment notes...'}
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-2.5 text-xs font-bold rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!selectedSurveyChecklist.headOfHousehold.trim()) {
                        alert(isRtl ? 'يرجى إدخال اسم المستفيد!' : 'Please enter beneficiary name!');
                        return;
                      }
                      const logMsg = `[SURVEY_SUBMIT] ${new Date().toLocaleTimeString()} - Verified case for "${selectedSurveyChecklist.headOfHousehold}" in ${selectedSurveyChecklist.governorate} with GPS coordinates.`;
                      setSurveyLogs(prev => [logMsg, ...prev]);
                      setSelectedSurveyChecklist({ headOfHousehold: '', familySize: 1, governorate: 'Taiz', needsWaterAid: false, needsFoodAid: false, needsHealthAid: false, notes: '' });
                      alert(isRtl ? 'تم تقديم التقييم بنجاح وإرسال إثبات الـ GPS للرابطة!' : 'Socioeconomic survey submitted successfully with live GPS geotagging proof!');
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs text-center"
                  >
                    {isRtl ? 'إرسال التقييم الجغرافي المعمد' : 'Submit Verified Field Survey'}
                  </button>
                </div>
              </div>
            </div>

            {surveyLogs.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-3.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 block">{isRtl ? 'سجل المعاملات الميدانية الأخير' : 'Recent Transaction Log'}</span>
                <div className="bg-slate-950 p-3 rounded-xl border border-zinc-800 text-[10px] font-mono text-zinc-300 space-y-1.5 max-h-24 overflow-y-auto">
                  {surveyLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 4: AI Intelligence Layer (١١ خدمة ذكاء اصطناعي وتحليل الأثر)
         ------------------------------------------------------------- */}
      {activeSegmentTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Grid: 11 AI Modules */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase text-zinc-400 tracking-wider">
              {isRtl ? 'سجل طبقة الذكاء الاصطناعي والاستشراف' : '11 AI & Intelligence Modules'}
            </h2>
            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {filteredIntelligence.map((tool) => {
                const ToolIcon = resolveIcon(tool.icon);
                const isSelected = selectedAiTool?.code === tool.code;
                return (
                  <div
                    key={tool.code}
                    onClick={() => {
                      setSelectedAiTool(tool);
                      setAiOutput('');
                    }}
                    className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-fuchsia-500/5 border-fuchsia-500 ring-1 ring-fuchsia-500/30'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-slate-400'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isSelected ? 'bg-fuchsia-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-fuchsia-500 dark:text-fuchsia-400'
                    }`}>
                      <ToolIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] font-mono font-black text-fuchsia-600 dark:text-fuchsia-400">{tool.code}</span>
                        <span className="px-1.5 py-0.2 bg-fuchsia-500/10 text-fuchsia-600 text-[8px] font-bold rounded">GEMINI ENGINE</span>
                      </div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 mt-0.5">
                        {isRtl ? tool.nameAr : tool.nameEn}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: AI Generation Playground */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-5 md:p-6 space-y-5 lg:col-span-2 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-fuchsia-500 text-white rounded-xl">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-black text-fuchsia-600 dark:text-fuchsia-400">{selectedAiTool?.code}</span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {isRtl ? selectedAiTool?.nameAr : selectedAiTool?.nameEn}
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-fuchsia-500/10 text-fuchsia-600 text-[9px] font-bold rounded border border-fuchsia-500/20">GEMINI PRO 1.5</span>
              </div>

              {/* Textarea Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">{isRtl ? 'موجه الذكاء الاصطناعي للتحليل والاستشراف:' : 'Gemini AI Prompt & Context Input:'}</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={isRtl ? 'اكتب موجه التحليل والتقرير هنا...' : 'Write report context here...'}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-2.5 text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={handleQueryGemini}
                  disabled={isAiGenerating}
                  className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{isAiGenerating ? (isRtl ? 'جاري التحليل وتوليد الأثر...' : 'Generating Stream...') : (isRtl ? 'تحليل بالذكاء الاصطناعي مع Gemini' : 'Generate with Gemini AI')}</span>
                </button>

                {aiOutput && (
                  <button
                    onClick={() => setShowPrintPreview(true)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-extrabold text-xs rounded-xl border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isRtl ? 'معاينة للطباعة A4' : 'A4 Print Preview'}</span>
                  </button>
                )}
              </div>

              {/* Stream Output Frame */}
              {(aiOutput || isAiGenerating) && (
                <div className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-3.5">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 block">{isRtl ? 'مخرج التقرير من خوادم Gemini AI:' : 'Gemini AI Intelligent Stream Response:'}</span>
                  <div className="p-4 bg-slate-950 text-emerald-400 rounded-xl border border-zinc-800 text-xs font-mono leading-relaxed whitespace-pre-wrap select-text max-h-64 overflow-y-auto custom-scrollbar shadow-inner">
                    {aiOutput}
                    {isAiGenerating && <span className="animate-pulse bg-emerald-400 w-1.5 h-4 inline-block ml-0.5" />}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold pt-4 border-t border-slate-100 dark:border-zinc-800/60 mt-4 leading-normal">
              {isRtl 
                ? 'تنبيه: يتم فحص جميع المخرجات بالذكاء الاصطناعي للتأكد من مواءمتها التامة لمعايير Sphere والمعيار الإنساني الدولي CHS قبل التصدير.'
                : 'Notice: Outgoing drafts are audited automatically to verify alignment with international Sphere & CHS guidelines before printing.'}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 5: Platform Administration (١١ مجمعاً إدارياً لمصفوفة الحوكمة)
         ------------------------------------------------------------- */}
      {activeSegmentTab === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Grid: 11 Admin utilities */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase text-zinc-400 tracking-wider">
              {isRtl ? 'مجمعات الإدارة والتحكم المؤسسي' : '11 Administration Panels'}
            </h2>
            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {filteredAdmin.map((tool) => {
                const ToolIcon = resolveIcon(tool.icon);
                const isSelected = selectedAdminTool?.code === tool.code;
                return (
                  <div
                    key={tool.code}
                    onClick={() => setSelectedAdminTool(tool)}
                    className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/5 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-slate-400'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-emerald-500 dark:text-emerald-400'
                    }`}>
                      <ToolIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] font-mono font-black text-emerald-600 dark:text-emerald-400">{tool.code}</span>
                        <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 text-[8px] font-bold rounded">SECURE CORE</span>
                      </div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 mt-0.5">
                        {isRtl ? tool.nameAr : tool.nameEn}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Interactive Administration Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-5 md:p-6 space-y-5 lg:col-span-2 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  {React.createElement(resolveIcon(selectedAdminTool?.icon || 'settings'), { className: 'w-5 h-5' })}
                </div>
                <div>
                  <span className="text-[9px] font-mono font-black text-emerald-600 dark:text-emerald-400">{selectedAdminTool?.code}</span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isRtl ? selectedAdminTool?.nameAr : selectedAdminTool?.nameEn}
                  </h3>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-bold rounded border border-emerald-500/20">ADMIN POOL</span>
            </div>

            {selectedAdminTool?.code === 'ADMIN-02' ? (
              // Fine-grained Roles & Permissions Matrix
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 block">{isRtl ? 'مصفوفة التحكم وتفويض الصلاحيات الصارمة' : 'Role Security Matrix & Fine-grained Permissions'}</span>
                <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl">
                  <table className="w-full text-left rtl:text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-950 font-black text-slate-700 dark:text-zinc-400">
                      <tr>
                        <th className="p-3">{isRtl ? 'الدور الوظيفي' : 'Role'}</th>
                        <th className="p-3 text-center">{isRtl ? 'قراءة' : 'Read'}</th>
                        <th className="p-3 text-center">{isRtl ? 'كتابة' : 'Write'}</th>
                        <th className="p-3 text-center">{isRtl ? 'اعتماد' : 'Approve'}</th>
                        <th className="p-3 text-center">{isRtl ? 'تدقيق' : 'Audit'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold">
                      {adminRoles.map(role => (
                        <tr key={role.id}>
                          <td className="p-3 font-extrabold text-slate-800 dark:text-zinc-100">{isRtl ? role.titleAr : role.titleEn}</td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={role.permissions.read}
                              onChange={() => togglePermission(role.id, 'read')}
                              className="accent-emerald-600"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={role.permissions.write}
                              onChange={() => togglePermission(role.id, 'write')}
                              className="accent-emerald-600"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={role.permissions.approve}
                              onChange={() => togglePermission(role.id, 'approve')}
                              className="accent-emerald-600"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={role.permissions.audit}
                              onChange={() => togglePermission(role.id, 'audit')}
                              className="accent-emerald-600"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : selectedAdminTool?.code === 'ADMIN-05' ? (
              // Visual Workflow Engine
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 block">{isRtl ? 'محرك مسارات العمل والاعتماد الإلكتروني' : 'Interactive Workflow Engine Visualizer'}</span>
                <div className="space-y-2 relative before:absolute before:top-4 before:bottom-4 before:left-5 before:w-0.5 before:bg-emerald-500/20 rtl:before:left-auto rtl:before:right-5">
                  {workflowNodes.map(node => (
                    <div key={node.id} className="flex items-start gap-4 relative z-10 pl-2 rtl:pl-0 rtl:pr-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border ${
                        node.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                        node.status === 'active' ? 'bg-amber-500 text-white border-amber-500 animate-pulse' :
                        'bg-slate-100 dark:bg-zinc-800 text-slate-500 border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {node.id}
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-extrabold text-slate-800 dark:text-zinc-200">{isRtl ? node.nameAr : node.nameEn}</span>
                          <span className={`text-[8px] font-black uppercase ${
                            node.status === 'completed' ? 'text-emerald-500' :
                            node.status === 'active' ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            {node.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Universal Security/Audit Log Viewer
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 block">{isRtl ? 'سجل تدقيق الأمان والعمليات الموحد (Neon Pool)' : 'Activity & Security Audit Log (Neon DB)'}</span>
                <div className="bg-slate-950 text-zinc-300 rounded-xl p-4 border border-zinc-800 text-[10px] font-mono leading-relaxed space-y-2.5 max-h-60 overflow-y-auto">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="border-b border-zinc-900 pb-2 last:border-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>{log.timestamp} • {log.user}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-black ${
                          log.action === 'AUTHORIZED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>{log.action}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-extrabold mr-1">[{log.module}]</span>
                        {log.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          Universal Modal details for Core Domains (Tab 1)
         ------------------------------------------------------------- */}
      {selectedDomainModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-2xl w-full p-6 md:p-8 shadow-xl relative text-slate-800 dark:text-zinc-100 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-amber-500/30 text-amber-500 rounded-xl">
                  {React.createElement(selectedDomainModal.icon, { className: 'w-7 h-7 text-amber-500' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 font-bold text-xs rounded-md border border-amber-500/20">
                      {isRtl ? 'نظام تشغيلي مؤسسي' : 'Enterprise Operating Domain'}
                    </span>
                    <span className="text-xs font-bold text-zinc-400">
                      {isRtl ? selectedDomainModal.suiteAr : selectedDomainModal.suiteEn}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                    {isRtl ? selectedDomainModal.titleAr : selectedDomainModal.titleEn}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedDomainModal(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-1">
                  {isRtl ? 'الوصف والتغطية الوظيفية:' : 'Functional Scope & Description:'}
                </h4>
                <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {isRtl ? selectedDomainModal.descAr : selectedDomainModal.descEn}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                  {isRtl ? 'الأنظمة الفرعية والسجلات التابعة الموثقة:' : 'Certified System Sub-modules:'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDomainModal.managedEntitiesAr.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>{isRtl ? item : selectedDomainModal.managedEntitiesEn[idx] || item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-400">
                <div>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase block">{isRtl ? 'المؤشر التشغيلي الرئيسي' : 'Primary Metric'}</span>
                  <span className="text-sm font-black text-emerald-300">{isRtl ? selectedDomainModal.primaryKpiAr : selectedDomainModal.primaryKpiEn}</span>
                </div>
                <span className="text-xl font-black font-mono">{selectedDomainModal.kpiValue}</span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800 pt-4">
              <button
                onClick={() => setSelectedDomainModal(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>

              <button
                onClick={() => {
                  const target = selectedDomainModal.targetTab;
                  setSelectedDomainModal(null);
                  onNavigate(target);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{isRtl ? 'الانتقال للوحة التحكم والعمليات' : 'Launch Workspace'}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          A4 High-Fidelity Print Preview Modal
         ------------------------------------------------------------- */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in select-text">
          <div className="bg-white text-slate-900 rounded-xl max-w-4xl w-full p-8 md:p-12 shadow-2xl space-y-6 relative border border-slate-300 text-right rtl:text-right" dir="rtl">
            
            {/* Header / Logo bar */}
            <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-5">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-500">الجمهورية اليمنية</div>
                <h2 className="text-lg font-black text-emerald-600">{orgName}</h2>
                <div className="text-[10px] font-bold text-slate-500">نظام التشغيل المؤسسي الموحد NexoraOS™</div>
              </div>
              <img 
                src="/LogoRohamaab.png" 
                alt="Logo" 
                className="h-16 w-16 object-contain" 
              />
            </div>

            {/* Print Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block">رقم المستند المرجعي</span>
                <span className="font-mono font-bold text-slate-800">NEX-AI-REP-{Date.now().toString().slice(-6)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">تاريخ التصدير التلقائي</span>
                <span className="font-mono font-bold text-slate-800">{new Date().toLocaleDateString('ar-YE')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">النظام المصدر</span>
                <span className="text-slate-800">الذكاء والأثر الإنساني (NEB-13)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">مستوى السرية والترميز</span>
                <span className="text-rose-600 font-bold">سري للغاية • للاستخدام الداخلي</span>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2 border-b border-slate-100">
              <h1 className="text-xl font-black text-slate-950 tracking-tight">تقرير الأثر التنموي والامتثال لمعايير Sphere / CHS</h1>
            </div>

            {/* Generated Report Content */}
            <div className="text-xs leading-relaxed text-slate-800 font-semibold space-y-4 whitespace-pre-wrap font-mono select-text bg-slate-50/50 p-5 rounded-xl border border-slate-200">
              {aiOutput || (isRtl ? 'الرجاء توليد مسودة التقرير أولاً في لوحة التحكم بالذكاء الاصطناعي.' : 'Please generate report first.')}
            </div>

            {/* Signatures block */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 text-center text-xs font-bold text-slate-600">
              <div className="space-y-6">
                <span>معد التقرير (Gemini AI Engine)</span>
                <div className="h-12 flex items-center justify-center font-mono text-emerald-600 font-black italic">✓ Digital Signature</div>
              </div>
              <div className="space-y-6">
                <span>مدير الرقابة والمتابعة الميدانية</span>
                <div className="h-12 border-b border-dashed border-slate-300"></div>
              </div>
              <div className="space-y-6">
                <span>التعميد النهائي والمصادقة</span>
                <div className="h-12 flex items-center justify-center font-mono text-amber-500 font-black italic">✓ Authorized Sec-Lock</div>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير (Print PDF)</span>
              </button>
              
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <span>إغلاق المعاينة</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
    </ModuleShell>
  );
}
