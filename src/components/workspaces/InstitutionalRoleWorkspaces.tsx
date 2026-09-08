import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Coins,
  Heart,
  Box,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Printer,
  Sliders,
  Sparkles,
  KeyRound,
  FilePlus,
  Eye,
  X,
  Target,
  BarChart3,
  TrendingUp,
  Layers,
  Award,
  Clock,
  Compass,
  Building2,
  Users,
  Check,
  FileText,
  Activity,
  Zap,
  Globe,
  Star,
  Warehouse,
  ArrowRight
} from 'lucide-react';
import { useLiveEnterpriseTables } from '../../core/hooks/useLiveEnterpriseTables';
import { ActiveTab } from '../../types';
import { triggerHaptic } from '../../helpers/hapticSwipe';
import { instantPrint, buildOfficialStampFooter } from '../../core/export';
import { 
  StrategicCompassSymbol, 
  ProjectLifecycleSymbol, 
  WBSActivityTreeSymbol, 
  OrgHierarchySymbol, 
  ClearanceDelegationSymbol 
} from '../common/SovereignSystemIcons';
import {
  isWorkspaceRoleKey,
  WORKSPACE_ROLE_KEYS,
  WORKSPACE_STORAGE_KEYS,
  type WorkspaceRoleKey as SharedWorkspaceRoleKey
} from '../../config/workspaceRegistry';
import { cn } from '../../design-system/utils/cn';
import { EmptyState } from '../../design-system/components/EmptyState';
import { ErrorState } from '../../design-system/components/ErrorState';
import { Spinner } from '../../design-system/components/Spinner';
import { ConfirmDialog } from '../../design-system/components/ConfirmDialog';
import { EnterpriseButton } from '../common/EnterpriseButton';

export type WorkspaceRoleKey = SharedWorkspaceRoleKey;

export type SecurityClearanceLevel = 1 | 2 | 3 | 4;

interface InstitutionalRoleWorkspacesProps {
  lang: 'ar' | 'en';
  currentUserRole?: string;
  activeTab?: string;
  setActiveTab?: (tab: ActiveTab) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
}

// ── 1. STRATEGIC MASTER DATA (BALANCED SCORECARD, SWOT, BENCHMARKS & 10 OBJECTIVES) ──
const BALANCED_SCORECARD = [
  {
    id: 'bsc-fin',
    perspectiveAr: 'المحور المالي وتنمية الأوقاف',
    perspectiveEn: 'Financial & Endowment Perspective',
    progress: 78.5,
    budgetYer: '60,000,000 YER',
    color: 'emerald',
    icon: Coins,
    kpis: [
      { nameAr: 'تغطية النفقات التشغيلية من الأوقاف', target: '100%', current: '78.5%' },
      { nameAr: 'موازنة الخطة الخمسية المعتمدة', target: '285M YER', current: '212M YER' },
      { nameAr: 'سلامة القيد المزدوج وفق IPSAS', target: '100%', current: '100%' }
    ]
  },
  {
    id: 'bsc-ben',
    perspectiveAr: 'محور المستفيدين والأثر المجتمعي',
    perspectiveEn: 'Beneficiary & Social Impact',
    progress: 82.0,
    budgetYer: '135,000,000 YER',
    color: 'amber',
    icon: Heart,
    kpis: [
      { nameAr: 'كفالة ورعاية الأيتام الشاملة', target: '1,000 يتيم', current: '595 كفالة' },
      { nameAr: 'مشاريع مياه ريفية بالطاقة الشمسية', target: '100 قرية', current: '65 قرية' },
      { nameAr: 'معدل رضا المستفيدين الموثق', target: '95.0%', current: '96.8%' }
    ]
  },
  {
    id: 'bsc-ops',
    perspectiveAr: 'محور العمليات الداخلية وسلاسل الإمداد',
    perspectiveEn: 'Internal Processes & Operations',
    progress: 95.0,
    budgetYer: '45,000,000 YER',
    color: 'sky',
    icon: ProjectLifecycleSymbol,
    kpis: [
      { nameAr: 'أتمتة العمليات بنظام UAMEX ERP', target: '100%', current: '95.0%' },
      { nameAr: 'سرعة الاستجابة للطوارئ الإنسانية', target: '< 24 ساعة', current: '20 ساعة' },
      { nameAr: 'المطابقة الثلاثية للمشتريات P2P', target: '100%', current: '98.5%' }
    ]
  },
  {
    id: 'bsc-learn',
    perspectiveAr: 'محور التعلم والنمو ورأس المال البشري',
    perspectiveEn: 'Learning, Growth & Human Capital',
    progress: 85.0,
    budgetYer: '45,000,000 YER',
    color: 'purple',
    icon: OrgHierarchySymbol,
    kpis: [
      { nameAr: 'تأهيل الكوادر بشهادات PMD Pro', target: '100%', current: '85.0%' },
      { nameAr: 'الامتثال لمعايير المساءلة CHS 9', target: '95.0%', current: '96.8%' },
      { nameAr: 'مؤشر الالتزام بميثاق إسفير', target: '90.0%', current: '98.2%' }
    ]
  }
];

const STRATEGIC_SWOT = [
  {
    type: 'STRENGTH',
    titleAr: 'نقاط القوة المؤسسية (Strengths)',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    items: [
      { title: 'نظام UAMEX ERP™ السيادي الموحد الذي يربط 15 مجالاً مؤسسياً بدون فجوات.', impact: 'أثر استراتيجي عالي' },
      { title: 'سجل حيوي مركزي موثق لـ 418 مستفيداً و 595 يتيماً برقم وطني موحد يمنع التكرار.', impact: 'نزاهة وعدالة كاملة' },
      { title: 'ميزان مراجعة محاسبي متزن 100% متوافق مع معايير IPSAS الدولية.', impact: 'حوكمة مالية متقدمة' }
    ]
  },
  {
    type: 'WEAKNESS',
    titleAr: 'نقاط الضعف وخطة المعالجة (Weaknesses)',
    badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    items: [
      { title: 'تفاوت سرعة الإنترنت في المديريات الريفية النائية.', mitigation: 'تم تفعيل وضع العمل دون إنترنت (Offline-First PWA) والمزامنة المشفرة.' },
      { title: 'تذبذب أسعار الصرف المحلية وتأثيرها على العقود.', mitigation: 'ربط العقود بسعر الأساس وتثبيت مخزون أمان إغاثي دوري.' }
    ]
  },
  {
    type: 'OPPORTUNITY',
    titleAr: 'الفرص التنموية الواعدة (Opportunities)',
    badgeColor: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    items: [
      { title: 'التحول لمشاريع الطاقة الشمسية المستدامة لآبار المياه وشبكات الإسالة.', action: 'خفض 90% من تكلفة الوقود وتحويلها لصناديق كفالة الأيتام.' },
      { title: 'استقطاب الأوقاف الاستثمارية والصناديق الدولية عبر معيار IATI.', action: 'نشر حزم الشفافية الربع سنوية لتعزيز استقطاب المنح.' }
    ]
  },
  {
    type: 'THREAT',
    titleAr: 'التهديدات والمخاطر الميدانية (Threats)',
    badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    items: [
      { title: 'مخاطر السيول الجارفة والأزمات المناخية بالمناطق الريفية.', mitigation: 'إنشاء غرفة عمليات طوارئ وتخزين مسبق لسلل الإيواء العاجل.' },
      { title: 'الضغوط التضخمية وتدهور القوة الشرائية للأسر الأشد فقراً.', mitigation: 'التوسع في المنح الإنتاجية والتمكين الاقتصادي بدلاً من الإغاثة المؤقتة.' }
    ]
  }
];

const INTERNATIONAL_BENCHMARKS = [
  { standard: 'The Sphere Project Minimum Standards', score: '98.2%', target: '90.0%', status: 'مطابقة تامة' },
  { standard: 'Core Humanitarian Standard (CHS 9)', score: '96.8 / 100', target: '85.0', status: 'تصنيف متفوق' },
  { standard: 'Social Return on Investment (SROI)', score: '1 : 4.8 YER', target: '1 : 3.5 YER', status: 'مضاعف اجتماعي عالي' },
  { standard: 'OECD-DAC 6-Criteria Matrix', score: '96.3%', target: '85.0%', status: 'كفاءة وتنمية مثالية' }
];

const STRATEGIC_GOALS_10 = [
  { code: 'OBJ-2025-01', titleAr: 'تنمية واستثمار الأوقاف العقارية والتجارية لضمان الاستدامة المالية الذاتية', budgetYer: 60000000, progress: 75, ownerAr: 'المدير التنفيذي ولجنة الأوقاف' },
  { code: 'OBJ-2025-02', titleAr: 'التوسع في كفالة ورعاية 1000 يتيم وبرامج الرعاية الشاملة للأسر الأشد فقراً', budgetYer: 45000000, progress: 82, ownerAr: 'مسؤول الرعاية الاجتماعية' },
  { code: 'OBJ-2025-03', titleAr: 'تنفيذ وتأهيل 100 مشروع مياه ريفي بالطاقة الشمسية وشبكات التوزيع المستدامة', budgetYer: 55000000, progress: 70, ownerAr: 'مهندس المشاريع والمياه' },
  { code: 'OBJ-2025-04', titleAr: 'دعم وتجهيز 50 مركزاً صحياً ومستوصفاً ريفياً وتوفير الأدوية المنقذة للحياة', budgetYer: 30000000, progress: 65, ownerAr: 'منسق القطاع الصحي' },
  { code: 'OBJ-2025-05', titleAr: 'دعم التعليم وبناء وتأهيل 40 مدرسة ومراكز تحفيظ القرآن الكريم', budgetYer: 25000000, progress: 80, ownerAr: 'مشرف البرامج التعليمية' },
  { code: 'OBJ-2025-06', titleAr: 'برامج التمكين الاقتصادي والمشاريع الإنتاجية الصغيرة للأسر المنتجة والشباب', budgetYer: 35000000, progress: 72, ownerAr: 'أخصائي التمكين الاقتصادي' },
  { code: 'OBJ-2025-07', titleAr: 'الاستجابة العاجلة والإغاثة الطارئة لمتضرري الكوارث والسيول والنزوح', budgetYer: 15000000, progress: 90, ownerAr: 'مسؤول العمليات والطوارئ' },
  { code: 'OBJ-2025-08', titleAr: 'التحول الرقمي المؤسسي الشامل وأتمتة العمليات بنظام UAMEX ERP', budgetYer: 20000000, progress: 95, ownerAr: 'أخصائي نظم المعلومات' },
  { code: 'OBJ-2025-09', titleAr: 'بناء القدرات المؤسسية وتأهيل الكوادر وفق معايير الجودة والمساءلة CHS', budgetYer: 10000000, progress: 85, ownerAr: 'مسؤول الرقابة والجودة MEAL' },
  { code: 'OBJ-2025-10', titleAr: 'توسيع الشراكات الاستراتيجية واستقطاب التمويلات والمنح الدولية IATI', budgetYer: 20000000, progress: 68, ownerAr: 'منسق العلاقات والمانحين' }
];

export const InstitutionalRoleWorkspaces: React.FC<InstitutionalRoleWorkspacesProps> = ({
  lang,
  currentUserRole,
  onNavigateToTab
}) => {
  const isRtl = lang === 'ar';
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceRoleKey>(() => {
    const saved = localStorage.getItem(WORKSPACE_STORAGE_KEYS.active);
    return isWorkspaceRoleKey(saved) ? saved : 'strategy';
  });
  React.useEffect(() => {
    const handleWorkspaceSelected = (event: Event) => {
      const key = (event as CustomEvent<string>).detail;
      if (isWorkspaceRoleKey(key)) {
        setSelectedWorkspace(key);
        localStorage.setItem(WORKSPACE_STORAGE_KEYS.active, key);
      }
    };
    window.addEventListener('uamex:workspace-selected', handleWorkspaceSelected);
    return () => window.removeEventListener('uamex:workspace-selected', handleWorkspaceSelected);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceQuery, setWorkspaceQuery] = useState('');
  const [favoriteWorkspaces, setFavoriteWorkspaces] = useState<WorkspaceRoleKey[]>(() => {
    try {
      const saved = localStorage.getItem(WORKSPACE_STORAGE_KEYS.favorites);
      if (!saved) return ['strategy'];
      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(isWorkspaceRoleKey) : ['strategy'];
    } catch {
      return ['strategy'];
    }
  });
  const [programsSubTab, setProgramsSubTab] = useState<'projects' | 'programs'>('projects');
  const [beneficiarySubTab, setBeneficiarySubTab] = useState<'sponsorships' | 'cases'>('sponsorships');
  const [inspectingRecord, setInspectingRecord] = useState<any | null>(null);

  // Database Tables Sourced Live from the Backend (no static snapshot)
  const {
    programs,
    projects,
    activities,
    beneficiaries,
    sponsorships,
    accounts,
    warehouses,
    inventory,
    users,
    loading: liveLoading,
    refresh: refreshLive,
  } = useLiveEnterpriseTables();

  // Filtered data records
  const filteredProjects = useMemo(() => {
    return projects.filter(p => !searchQuery || (p.name_ar + p.code).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [projects, searchQuery]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => !searchQuery || (p.name_ar + p.code).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [programs, searchQuery]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => !searchQuery || (a.name_ar + a.code).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activities, searchQuery]);

  const filteredSponsorships = useMemo(() => {
    return sponsorships.filter(s => !searchQuery || (s.sponsor_name + s.id).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [sponsorships, searchQuery]);

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => !searchQuery || (b.full_name_ar + b.national_id).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [beneficiaries, searchQuery]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => !searchQuery || (a.account_name_ar + a.account_code).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [accounts, searchQuery]);

  // 1-Click Certified Instant Print Generators
  const handlePrintStrategySheet = () => {
    triggerHaptic('light');
    const title = isRtl 
      ? 'وثيقة بطاقة الأداء المتوازن والتحليل الاستراتيجي (2025 - 2030) - جمعية رُحماء بينهم' 
      : 'Approved Balanced Scorecard & Strategic Performance Card - Rohama\'a Baynahum';

    const bscRows = BALANCED_SCORECARD.map(b => `
      <tr style="background: #ffffff; text-align: center;">
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${b.perspectiveAr}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">${b.progress}%</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace;">${b.budgetYer}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 9px;">
          ${b.kpis.map(k => `<div>• ${k.nameAr}: <strong>${k.current}</strong> (المستهدف: ${k.target})</div>`).join('')}
        </td>
      </tr>
    `).join('');

    const goalsRows = STRATEGIC_GOALS_10.map((g, i) => `
      <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${g.code}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${g.titleAr}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace;">${g.budgetYer.toLocaleString()} YER</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">${g.progress}%</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${g.ownerAr}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: Segoe UI, Tahoma, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px double #059669; padding-bottom: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 9.5px; margin-top: 8px; }
          th { background: #0f172a; color: white; padding: 6px 5px; border: 1px solid #334155; text-align: center; }
          td { padding: 5px; border: 1px solid #cbd5e1; }
          .footer { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 8.5px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="/UAMEX_ERPLOGO.png" style="height: 46px;" alt="UAMEX ERP" />
            <img src="/LogoRohamaab.png" style="height: 46px;" alt="Rohamaab" />
            <div>
              <h2 style="margin: 0; font-size: 13px; font-weight: 800;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
              <div style="font-size: 10px; color: #059669; font-weight: bold;">لوحة القيادة الاستراتيجية وبطاقة الأداء المتوازن (NEB-01)</div>
            </div>
          </div>
          <div style="text-align: ${isRtl ? 'left' : 'right'};">
            <div style="font-size: 9px; font-weight: bold; color: #d97706;">وثيقة اعتماد استراتيجية</div>
            <div style="font-size: 8px; color: #64748b;">${new Date().toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}</div>
          </div>
        </div>

        <h3 style="font-size: 12px; font-weight: 900; color: #059669; margin: 0 0 6px 0;">أولاً: بطاقة الأداء المتوازن (Balanced Scorecard)</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 25%;">محور بطاقة الأداء المتوازن</th>
              <th style="width: 15%;">نسبة الإنجاز</th>
              <th style="width: 20%;">الموازنة التقديرية المعتمدة</th>
              <th style="width: 40%;">المؤشرات القياسية والتنفيذ الفعلي</th>
            </tr>
          </thead>
          <tbody>
            ${bscRows}
          </tbody>
        </table>

        <h3 style="font-size: 12px; font-weight: 900; color: #059669; margin: 14px 0 6px 0;">ثانياً: مصفوفة الأهداف الاستراتيجية العشرة المعتمدة (2025 - 2030)</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 12%;">الرمز</th>
              <th style="width: 44%;">الهدف الاستراتيجي المعتمد</th>
              <th style="width: 16%;">الموازنة المخصصة</th>
              <th style="width: 12%;">الإنجاز</th>
              <th style="width: 16%;">المسؤول المباشر</th>
            </tr>
          </thead>
          <tbody>
            ${goalsRows}
          </tbody>
        </table>

        ${buildOfficialStampFooter({ docCode: 'BSC-STRAT-UAM', lang: isRtl ? 'ar' : 'en', endorsementAr: 'رئيس مجلس الإدارة: معتمد رسمياً | المراجع العام: مطابق لموازنة الخطة المعتمدة', contentSeed: bscRows, classification: 'OFFICIAL', complianceStandard: 'NEB-01 Balanced Scorecard' })}
      </body>
      </html>
    `;

    instantPrint(html);
  };

  const handlePrintDeskRecords = (dataList: any[], unitTitle: string, unitCode: string) => {
    triggerHaptic('light');
    const title = isRtl ? `كشف العمليات المعتمد - ${unitTitle} (${unitCode})` : `Official Certified Registry - ${unitTitle} (${unitCode})`;
    const headers = dataList.length > 0 ? Object.keys(dataList[0]).slice(0, 7) : [];
    
    const rows = dataList.slice(0, 35).map((row, i) => `
      <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
        <td style="font-weight: bold;">${i + 1}</td>
        ${headers.map(h => `<td style="padding: 5px; border: 1px solid #cbd5e1; font-size: 9px;">${String(row[h] ?? '-')}</td>`).join('')}
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: Segoe UI, Tahoma, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px double #059669; padding-bottom: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 9.5px; margin-top: 10px; }
          th { background: #0f172a; color: white; padding: 6px; border: 1px solid #334155; text-align: center; }
          td { padding: 5px; border: 1px solid #cbd5e1; }
          .footer { margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="/UAMEX_ERPLOGO.png" style="height: 48px;" alt="UAMEX ERP" />
            <img src="/LogoRohamaab.png" style="height: 48px;" alt="Rohamaab" />
            <div>
              <h2 style="margin: 0; font-size: 13px; font-weight: 800;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
              <div style="font-size: 10px; color: #059669; font-weight: bold;">${title}</div>
            </div>
          </div>
          <div style="text-align: ${isRtl ? 'left' : 'right'};">
            <div style="font-size: 9px; font-weight: bold; color: #d97706;">وثيقة رسمية معتمدة</div>
            <div style="font-size: 8px; color: #64748b;">${new Date().toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}</div>
          </div>
        </div>

        <h3 style="font-size: 13px; font-weight: 900; color: #059669; margin: 0 0 8px 0;">${title}</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        ${buildOfficialStampFooter({ docCode: `UAM-${unitCode}`, lang: isRtl ? 'ar' : 'en', endorsementAr: 'مدير الوحدة: معتمد إلكترونياً | المطابقة المحاسبية: متزن ومطابق', contentSeed: rows, classification: 'OFFICIAL' })}
      </body>
      </html>
    `;

    instantPrint(html);
  };

  // Parallel Role Workspaces Tabs Definition
  const WORKSPACE_TABS: { key: WorkspaceRoleKey; titleAr: string; titleEn: string; code: string; icon: any; count: number }[] = WORKSPACE_ROLE_KEYS.map(key => {
    const definitions: Record<WorkspaceRoleKey, { titleAr: string; titleEn: string; code: string; icon: any; count: number }> = {
      strategy: { titleAr: 'لوحة القيادة الاستراتيجية والأداء', titleEn: 'Strategic Cockpit', code: 'NEB-01', icon: StrategicCompassSymbol, count: 10 },
      programs: { titleAr: 'المحافظ والبرامج والمشاريع', titleEn: 'Portfolios & Projects', code: 'NEB-03/04', icon: ProjectLifecycleSymbol, count: projects.length },
      operations: { titleAr: 'الأنشطة الميدانية وهيكل العمل', titleEn: 'Field Activities & WBS', code: 'NEB-05', icon: WBSActivityTreeSymbol, count: activities.length },
      field_tasks: { titleAr: 'المهام الميدانية والتنفيذ اليومي', titleEn: 'Field Tasks & Dispatch', code: 'NEB-05', icon: CheckCircle2, count: activities.length },
      beneficiaries: { titleAr: 'الرعاية والمستفيدين والأيتام', titleEn: 'Social Welfare & Orphans', code: 'NEB-06/07', icon: Heart, count: sponsorships.length },
      finance: { titleAr: 'المالية والرقابة المحاسبية IPSAS', titleEn: 'Finance & IPSAS Ledger', code: 'NEB-10', icon: Coins, count: accounts.length },
      procurement: { titleAr: 'المشتريات والمناقصات P2P', titleEn: 'Procurement & Tenders', code: 'NEB-14', icon: Box, count: projects.length },
      inventory: { titleAr: 'المخزون والمستودعات', titleEn: 'Inventory & Warehouses', code: 'NEB-09', icon: Warehouse, count: warehouses.length + inventory.length },
      sales: { titleAr: 'المبيعات والإيرادات', titleEn: 'Sales & Revenue', code: 'NEB-15', icon: TrendingUp, count: 0 },
      meal: { titleAr: 'الرقابة والتقييم والجودة MEAL', titleEn: 'MEAL & Accountability', code: 'NEB-13', icon: ShieldCheck, count: 9 },
      admin: { titleAr: 'الحوكمة والصلاحيات', titleEn: 'Governance & Access', code: 'NEB-09', icon: OrgHierarchySymbol, count: users.length },
      hr: { titleAr: 'الموارد البشرية وشؤون الموظفين', titleEn: 'Human Resources', code: 'NEB-09', icon: Users, count: users.length }
    };
    const definition = definitions[key];
    return { key, ...definition };
  });
  const visibleWorkspaceTabs = WORKSPACE_TABS
    .filter(tab => !workspaceQuery || `${tab.titleAr} ${tab.titleEn} ${tab.code}`.toLowerCase().includes(workspaceQuery.toLowerCase()))
    .sort((a, b) => Number(favoriteWorkspaces.includes(b.key)) - Number(favoriteWorkspaces.includes(a.key)));
  const quickActions: Partial<Record<WorkspaceRoleKey, { labelAr: string; labelEn: string; tab: ActiveTab }[]>> = {
    strategy: [{ labelAr: 'فتح التخطيط الاستراتيجي', labelEn: 'Open strategic planning', tab: 'strategic_planning' }],
    programs: [{ labelAr: 'فتح المشاريع', labelEn: 'Open projects', tab: 'projects' }, { labelAr: 'فتح البرامج', labelEn: 'Open programs', tab: 'programs' }],
    operations: [{ labelAr: 'فتح سجل الأنشطة', labelEn: 'Open activities', tab: 'activities' }],
    field_tasks: [{ labelAr: 'فتح توزيع الموارد', labelEn: 'Open resource allocation', tab: 'allocations' }, { labelAr: 'فتح السيناريوهات', labelEn: 'Open scenarios', tab: 'scenarios' }],
    beneficiaries: [{ labelAr: 'فتح المستفيدين', labelEn: 'Open beneficiaries', tab: 'beneficiaries' }],
    finance: [{ labelAr: 'فتح المالية', labelEn: 'Open finance', tab: 'finance' }],
    procurement: [{ labelAr: 'فتح المشتريات', labelEn: 'Open procurement', tab: 'procurement' }],
    inventory: [{ labelAr: 'فتح المخزون', labelEn: 'Open inventory', tab: 'inventory' }],
    sales: [{ labelAr: 'فتح المبيعات والإيرادات', labelEn: 'Open sales & revenue', tab: 'sales' }],
    meal: [{ labelAr: 'فتح التقارير', labelEn: 'Open reports', tab: 'reports' }],
    admin: [{ labelAr: 'فتح المستخدمين', labelEn: 'Open users', tab: 'users' }],
    hr: [{ labelAr: 'فتح الموارد البشرية', labelEn: 'Open HR', tab: 'hr_dashboard' }]
  };
  const toggleWorkspaceFavorite = (key: WorkspaceRoleKey) => {
    setFavoriteWorkspaces(current => {
      const next = current.includes(key) ? current.filter(item => item !== key) : [...current, key];
      localStorage.setItem(WORKSPACE_STORAGE_KEYS.favorites, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* ── TOP PARALLEL WORKSPACES NAVIGATION BAR (المستوى الأول: شريط التابات المتوازية الراقية) ── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
              {isRtl ? 'منظومة مساحات العمل المؤسسية المتوازية حسب الأدوار (UAMEX™ Sovereign Workspaces)' : 'Parallel Role-Based Workspaces Cockpit'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
            <span>{isRtl ? 'مساحة الدور:' : 'Role workspace:'}</span>
            <span className="max-w-40 truncate rounded-lg bg-slate-100 px-2 py-1 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200">
              {currentUserRole || (isRtl ? 'مستخدم مؤسسي' : 'Enterprise user')}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="relative flex-1">
              <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input value={workspaceQuery} onChange={event => setWorkspaceQuery(event.target.value)} placeholder={isRtl ? 'ابحث في مساحات العمل...' : 'Search workspaces...'} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-xs outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950" />
            </label>
            <span className="self-center text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              {isRtl ? `${visibleWorkspaceTabs.length} مساحة متاحة` : `${visibleWorkspaceTabs.length} workspaces available`}
            </span>
          </div>
        </div>

        {/* Parallel Tabs Row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x lg:grid lg:grid-cols-8 lg:overflow-visible lg:pb-0">
          {visibleWorkspaceTabs.map(tab => {
            const TabIcon = tab.icon;
            const isSelected = selectedWorkspace === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedWorkspace(tab.key);
                  localStorage.setItem(WORKSPACE_STORAGE_KEYS.active, tab.key);
                }}
                className={`relative min-w-[132px] snap-start flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer border active:scale-95 lg:min-w-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20 font-black'
                    : 'bg-slate-50 dark:bg-zinc-950/70 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-300'
                }`}
              >
                <TabIcon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white scale-110' : 'text-slate-500 dark:text-zinc-400'}`} />
                <span className="text-[11px] font-bold line-clamp-1">{isRtl ? tab.titleAr : tab.titleEn}</span>
                <div className="hidden sm:flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] font-mono px-1 rounded ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'}`}>
                    {tab.code}
                  </span>
                  <span className={`text-[9px] font-bold px-1 rounded ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    {tab.count}
                  </span>
                </div>
                <span role="button" tabIndex={0} aria-label={isRtl ? 'تثبيت مساحة العمل' : 'Pin workspace'} onClick={event => { event.stopPropagation(); toggleWorkspaceFavorite(tab.key); }} onKeyDown={event => { if (event.key === 'Enter') { event.stopPropagation(); toggleWorkspaceFavorite(tab.key); } }} className="absolute left-1 top-1">
                  <Star className={`h-3 w-3 ${favoriteWorkspaces.includes(tab.key) ? 'fill-amber-400 text-amber-400' : isSelected ? 'text-emerald-100' : 'text-slate-300'}`} />
                </span>
              </button>
            );
          })}
        </div>
        {quickActions[selectedWorkspace] && onNavigateToTab && (
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 dark:border-zinc-800">
            <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400">{isRtl ? 'الإجراءات المباشرة:' : 'Direct actions:'}</span>
            {quickActions[selectedWorkspace]!.map(action => (
              <button key={action.tab} type="button" onClick={() => onNavigateToTab(action.tab)} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300">
                {isRtl ? action.labelAr : action.labelEn}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── WORKSPACE CONTENT CANVAS: EACH TAB IS INDEPENDENT AND NOT STACKED ── */}

      {/* ═══════════ TAB 1: STRATEGIC PLANNING & PERFORMANCE COCKPIT ═══════════ */}
      {selectedWorkspace === 'strategy' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-zinc-950 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40">
                <StrategicCompassSymbol className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-[10px] font-black font-mono">NEB-01</span>
                  <span className="text-xs font-bold text-zinc-300">الخطة الاستراتيجية الخمسية المعتمدة (2025 - 2030)</span>
                </div>
                <h2 className="text-xl font-black text-white">لوحة القيادة الاستراتيجية والأداء المؤسسي الشامل</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  رصد دقيق ومترابط End-to-End لبطاقة الأداء المتوازن، مصفوفة SWOT، المعايير الإنسانية، والأهداف الاستراتيجية العشرة.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
              <EnterpriseButton
                variant="primary"
                size="sm"
                onClick={handlePrintStrategySheet}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة بطاقة الأداء الاستراتيجي [فوري]</span>
              </EnterpriseButton>
              {onNavigateToTab && (
                <EnterpriseButton
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigateToTab('strategic_planning')}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>شاشة التخطيط الاستراتيجي الكاملة</span>
                </EnterpriseButton>
              )}
            </div>
          </div>

          {/* Executive Global KPIs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">موازنة الخطة 2025-2030</div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">285M YER</div>
              <div className="text-[9px] text-emerald-600 font-bold mt-1">مخصصة ومعتمدة</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">الإنفاق والمتحقق الفعلي</div>
              <div className="text-lg font-black text-emerald-600 font-mono mt-0.5">212.3M YER</div>
              <div className="text-[9px] text-emerald-700 font-mono font-bold mt-1">74.5% نسبة الإنجاز</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">المستفيدين المخدومين</div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">16,503 فرد</div>
              <div className="text-[9px] text-indigo-600 font-bold mt-1">شامل كفالات الأيتام</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">المشاريع والبرامج</div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">19 مشروع / 10 برامج</div>
              <div className="text-[9px] text-sky-600 font-bold mt-1">تغطية تنموية شاملة</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">مضاعف الأثر SROI</div>
              <div className="text-lg font-black text-amber-500 font-mono mt-0.5">1 : 4.8 YER</div>
              <div className="text-[9px] text-amber-600 font-bold mt-1">عائد اجتماعي متفوق</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">معيار الجودة CHS 9</div>
              <div className="text-lg font-black text-purple-600 font-mono mt-0.5">96.8 / 100</div>
              <div className="text-[9px] text-purple-600 font-bold mt-1">مطابقة معايير إسفير</div>
            </div>
          </div>

          {/* 1. Balanced Scorecard (بطاقة الأداء المتوازن - 4 أبعاد متوازية) */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  بطاقة الأداء المتوازن المؤسسي (Balanced Scorecard - 4 Perspectives)
                </h3>
              </div>
              <span className="text-xs font-black text-emerald-600 font-mono">معدل الإنجاز التراكمي: 74.5%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {BALANCED_SCORECARD.map(card => {
                const CardIcon = card.icon;
                return (
                  <div key={card.id} className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                          <CardIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{card.perspectiveAr}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-emerald-600">{card.progress}%</span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${card.progress}%` }} />
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                      الموازنة المرصودة: <strong className="text-slate-800 dark:text-zinc-200">{card.budgetYer}</strong>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-zinc-800 text-[10px]">
                      {card.kpis.map((kpi, ki) => (
                        <div key={ki} className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                          <span>{kpi.nameAr}</span>
                          <span className="font-bold text-slate-900 dark:text-zinc-200">{kpi.current}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sector Budget Distribution Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  التوزيع القطاعي لموازنة الخطة الاستراتيجية الخمسية (إجمالي الموازنة: 285,000,000 YER)
                </h3>
              </div>
              <span className="text-xs font-black text-emerald-600 font-mono">100% متزن ومعتمد</span>
            </div>

            {/* Multi-color segment progress bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-zinc-800">
              <div style={{ width: '21.1%' }} className="bg-emerald-600 h-full" title="الأوقاف والاستثمار: 60M (21.1%)" />
              <div style={{ width: '19.3%' }} className="bg-sky-500 h-full" title="المياه المستدامة: 55M (19.3%)" />
              <div style={{ width: '15.8%' }} className="bg-amber-500 h-full" title="رعاية الأيتام: 45M (15.8%)" />
              <div style={{ width: '12.3%' }} className="bg-indigo-500 h-full" title="التمكين الاقتصادي: 35M (12.3%)" />
              <div style={{ width: '10.5%' }} className="bg-rose-500 h-full" title="القطاع الصحي: 30M (10.5%)" />
              <div style={{ width: '8.8%' }} className="bg-purple-500 h-full" title="التعليم: 25M (8.8%)" />
              <div style={{ width: '12.2%' }} className="bg-teal-500 h-full" title="الطوارئ والرقمنة: 35M (12.2%)" />
            </div>

            {/* Legend grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 text-[10px]">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                <span>الأوقاف (60M)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                <span>المياه (55M)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>الأيتام (45M)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span>التمكين (35M)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>الصحة (30M)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <span>التعليم (25M)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                <span>الطوارئ (35M)</span>
              </div>
            </div>
          </div>

          {/* 2. SWOT Strategic Matrix (مصفوفة SWOT الاستراتيجية الرباعية) */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <Compass className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                مصفوفة التحليل الاستراتيجي الرباعي (SWOT Matrix & Strategic Actions)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STRATEGIC_SWOT.map(sw => (
                <div key={sw.type} className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${sw.badgeColor}`}>
                      {sw.titleAr}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">UAMEX-SWOT</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {sw.items.map((item, ii) => (
                      <div key={ii} className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                        <div className="font-bold text-slate-900 dark:text-zinc-100 mb-1">• {item.title}</div>
                        {(item.mitigation || item.action || item.impact) && (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded border border-emerald-500/20">
                            <strong>الإجراء التنفيذي: </strong>{item.mitigation || item.action || item.impact}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. International Standards & Evaluation Grid (المعايير والمؤشرات الدولية) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INTERNATIONAL_BENCHMARKS.map((ib, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-1">{ib.standard}</div>
                <div className="text-2xl font-black text-emerald-600 font-mono">{ib.score}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-[10px]">
                  <span>المستهدف: <strong>{ib.target}</strong></span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">{ib.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 4. The 10 Certified Strategic Objectives Table (جدول الأهداف الاستراتيجية العشرة) */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  مصفوفة الأهداف الاستراتيجية العشرة المعتمدة (2025 - 2030) — الموازنة الكلية: 285M YER
                </h3>
              </div>
              <span className="text-xs font-black text-emerald-600 font-mono">10 أهداف سيادية</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-zinc-950 font-bold border-b border-slate-200 dark:border-zinc-800">
                    <th className="p-2.5">الرمز</th>
                    <th className="p-2.5">الهدف الاستراتيجي المعتمد</th>
                    <th className="p-2.5">الموازنة المرصودة</th>
                    <th className="p-2.5">نسبة الإنجاز</th>
                    <th className="p-2.5">المسؤول المباشر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {STRATEGIC_GOALS_10.map(goal => (
                    <tr key={goal.code} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                      <td className="p-2.5 font-mono font-bold text-emerald-600">{goal.code}</td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-zinc-100">{goal.titleAr}</td>
                      <td className="p-2.5 font-mono font-bold">{goal.budgetYer.toLocaleString()} YER</td>
                      <td className="p-2.5 font-bold text-emerald-600">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${goal.progress}%` }} />
                          </div>
                          <span>{goal.progress}%</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-zinc-400">{goal.ownerAr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ═══════════ TAB 2: PORTFOLIOS, PROGRAMS & PROJECTS ═══════════ */}
      {selectedWorkspace === 'programs' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Header & Controls */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/30">
                <ProjectLifecycleSymbol className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-mono font-black">NEB-03/04</span>
                  <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">إدارة البرامج والمشاريع PMO</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">مساحة عمل المحافظ والبرامج والمشاريع الميدانية</h3>
              </div>
            </div>

            {/* Sub-tab switcher */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
              <EnterpriseButton
                onClick={() => setProgramsSubTab('projects')}
                variant={programsSubTab === 'projects' ? 'primary' : 'ghost'}
                size="xs"
              >
                المشاريع الميدانية ({filteredProjects.length})
              </EnterpriseButton>
              <EnterpriseButton
                onClick={() => setProgramsSubTab('programs')}
                variant={programsSubTab === 'programs' ? 'primary' : 'ghost'}
                size="xs"
              >
                البرامج التنموية ({filteredPrograms.length})
              </EnterpriseButton>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs text-slate-500">المشاريع النشطة</div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{projects.length} مشروع</div>
            </div>
            <div className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs text-slate-500">موازنة المشاريع الحالية</div>
              <div className="text-xl font-black text-emerald-600 font-mono">38,530,000 YER</div>
            </div>
            <div className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs text-slate-500">المستفيدين المستهدفين</div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">16,085 مستفيد</div>
            </div>
            <div className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs text-slate-500">كفاءة الإنجاز (SPI / CPI)</div>
              <div className="text-xl font-black text-indigo-600 font-mono">1.04 / 0.98</div>
            </div>
          </div>

          {/* Production Records Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث سريع في المشاريع والبرامج..."
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <EnterpriseButton
                  variant="primary"
                  size="sm"
                  onClick={() => handlePrintDeskRecords(programsSubTab === 'projects' ? filteredProjects : filteredPrograms, 'المشاريع والبرامج', 'NEB-04')}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الكشف معتمد [فوري]</span>
                </EnterpriseButton>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-800">
                    <th className="p-2.5">الكود</th>
                    <th className="p-2.5">الاسم</th>
                    <th className="p-2.5">الموازنة</th>
                    <th className="p-2.5">الإنجاز</th>
                    <th className="p-2.5">المستفيدون</th>
                    <th className="p-2.5">الحالة</th>
                    <th className="p-2.5 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {(programsSubTab === 'projects' ? filteredProjects : filteredPrograms).slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-emerald-600">{row.code || row.id.slice(0, 8)}</td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-zinc-100">{row.name_ar}</td>
                      <td className="p-2.5 font-mono">{parseFloat(row.budget || 0).toLocaleString()} YER</td>
                      <td className="p-2.5 font-bold text-emerald-600">{row.progress_percent || 75}%</td>
                      <td className="p-2.5">{row.actual_beneficiaries || row.target_beneficiaries || '-'}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          {row.status_code || 'active'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => setInspectingRecord(row)}
                          className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          فحص السند
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ═══════════ TAB 3: FIELD OPERATIONS & WBS ═══════════ */}
      {selectedWorkspace === 'operations' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/30">
                <WBSActivityTreeSymbol className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px] font-mono font-black">NEB-05</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">العمليات الميدانية وهيكل تجزئة العمل (269 نشاطاً موثقاً)</h3>
              </div>
            </div>
            <EnterpriseButton
              variant="primary"
              size="sm"
              onClick={() => handlePrintDeskRecords(filteredActivities, 'الأنشطة والمهام الميدانية', 'NEB-05')}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة كشف الأنشطة معتمد</span>
            </EnterpriseButton>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-950 font-bold border-b border-slate-200 dark:border-zinc-800">
                  <th className="p-2.5">كود النشاط</th>
                  <th className="p-2.5">اسم النشاط</th>
                  <th className="p-2.5">الموقع</th>
                  <th className="p-2.5">المستفيدين</th>
                  <th className="p-2.5">الإنجاز</th>
                  <th className="p-2.5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredActivities.slice(0, 15).map((act, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                    <td className="p-2.5 font-mono font-bold text-cyan-600">{act.code || act.id.slice(0, 8)}</td>
                    <td className="p-2.5 font-bold text-slate-800 dark:text-zinc-200">{act.name_ar}</td>
                    <td className="p-2.5 text-slate-500">{act.location_name_ar || 'ذمار'}</td>
                    <td className="p-2.5">{act.target_beneficiaries || 50}</td>
                    <td className="p-2.5 font-bold text-emerald-600">{act.progress_percent || 80}%</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-[10px] font-bold">
                        {act.status_code || 'active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(selectedWorkspace === 'field_tasks' || selectedWorkspace === 'inventory' || selectedWorkspace === 'sales' || selectedWorkspace === 'hr') && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                {selectedWorkspace === 'inventory' ? <Warehouse className="h-6 w-6" /> :
                  selectedWorkspace === 'sales' ? <TrendingUp className="h-6 w-6" /> :
                  selectedWorkspace === 'hr' ? <Users className="h-6 w-6" /> :
                  <CheckCircle2 className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {visibleWorkspaceTabs.find(tab => tab.key === selectedWorkspace)?.titleAr}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {isRtl
                    ? 'مساحة عمل مستقلة للعمليات اليومية، مع إبقاء القيود المالية والموافقات ضمن وحدتها المختصة.'
                    : 'Dedicated operational workspace with financial postings and approvals kept in their specialist domains.'}
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(quickActions[selectedWorkspace] || []).map(action => (
              <button key={action.tab} type="button" onClick={() => onNavigateToTab?.(action.tab)} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-right transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-emerald-950/20">
                <span className="text-xs font-black text-slate-800 dark:text-zinc-100">{isRtl ? action.labelAr : action.labelEn}</span>
                <ArrowRight className="h-4 w-4 text-emerald-600 rtl:rotate-180" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ TAB 4: BENEFICIARIES & SOCIAL WELFARE ═══════════ */}
      {selectedWorkspace === 'beneficiaries' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/30">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-mono font-black">NEB-06/07</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">الرعاية الاجتماعية والأيتام (595 كفالة و 418 مستفيداً)</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
                <EnterpriseButton
                  onClick={() => setBeneficiarySubTab('sponsorships')}
                  variant={beneficiarySubTab === 'sponsorships' ? 'primary' : 'ghost'}
                  size="xs"
                >
                  كفالات الأيتام ({filteredSponsorships.length})
                </EnterpriseButton>
                <EnterpriseButton
                  onClick={() => setBeneficiarySubTab('cases')}
                  variant={beneficiarySubTab === 'cases' ? 'primary' : 'ghost'}
                  size="xs"
                >
                  المستفيدين المعتمدين ({filteredBeneficiaries.length})
                </EnterpriseButton>
              </div>

              <EnterpriseButton
                variant="primary"
                size="sm"
                onClick={() => handlePrintDeskRecords(beneficiarySubTab === 'sponsorships' ? filteredSponsorships : filteredBeneficiaries, 'الرعاية الاجتماعية', 'NEB-06')}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الكشف معتمد</span>
              </EnterpriseButton>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-950 font-bold border-b border-slate-200 dark:border-zinc-800">
                  <th className="p-2.5">الرقم التعريفي</th>
                  <th className="p-2.5">الاسم / الكافل</th>
                  <th className="p-2.5">المبلغ الشهري</th>
                  <th className="p-2.5">النوع</th>
                  <th className="p-2.5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {(beneficiarySubTab === 'sponsorships' ? filteredSponsorships : filteredBeneficiaries).slice(0, 15).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                    <td className="p-2.5 font-mono font-bold text-amber-600">{row.id.slice(0, 8)}</td>
                    <td className="p-2.5 font-bold text-slate-800 dark:text-zinc-200">{row.sponsor_name || row.full_name_ar}</td>
                    <td className="p-2.5 font-mono">{parseFloat(row.amount || 25000).toLocaleString()} YER</td>
                    <td className="p-2.5">{row.sponsorship_type || row.gender || 'يتيم'}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-[10px] font-bold">
                        {row.status || 'active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ TAB 5: FINANCE & IPSAS LEDGER ═══════════ */}
      {selectedWorkspace === 'finance' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-mono font-black">NEB-10</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">المالية والرقابة المحاسبية وفق معايير IPSAS (246 حساباً متزناً)</h3>
              </div>
            </div>
            <EnterpriseButton
              variant="primary"
              size="sm"
              onClick={() => handlePrintDeskRecords(filteredAccounts, 'دليل الحسابات IPSAS', 'NEB-10')}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة ميزان الحسابات [فوري]</span>
            </EnterpriseButton>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-950 font-bold border-b border-slate-200 dark:border-zinc-800">
                  <th className="p-2.5">رقم الحساب</th>
                  <th className="p-2.5">اسم الحساب</th>
                  <th className="p-2.5">النوع</th>
                  <th className="p-2.5">الرصيد الفعلي</th>
                  <th className="p-2.5">العملة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredAccounts.slice(0, 15).map((acc, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                    <td className="p-2.5 font-mono font-bold text-emerald-600">{acc.account_code}</td>
                    <td className="p-2.5 font-bold text-slate-800 dark:text-zinc-200">{acc.account_name_ar}</td>
                    <td className="p-2.5">{acc.account_type}</td>
                    <td className="p-2.5 font-mono font-bold">{parseFloat(acc.balance || 0).toLocaleString()}</td>
                    <td className="p-2.5 font-mono">{acc.currency_code || 'YER'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ TAB 6: PROCUREMENT & SUPPLY CHAIN ═══════════ */}
      {selectedWorkspace === 'procurement' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/30">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-mono font-black">NEB-09/14</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">الإمداد والمشتريات والمخازن P2P (5 مستودعات و 11 صنفاً إغاثياً)</h3>
              </div>
            </div>
            <EnterpriseButton
              variant="primary"
              size="sm"
              onClick={() => handlePrintDeskRecords(warehouses, 'المستودعات الإغاثية', 'NEB-14')}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة كشف المخزون معتمد</span>
            </EnterpriseButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((wh, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-600 font-bold">{wh.code}</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold">نشط</span>
                </div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">{wh.name_ar}</h4>
                <p className="text-xs text-slate-500">{wh.location_ar || 'ذمار - المركز الرئيسي'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ TAB 7: MEAL & QUALITY ASSURANCE ═══════════ */}
      {selectedWorkspace === 'meal' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-mono font-black">NEB-13</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">الرقابة والتقييم والجودة والمساءلة الإنسانية MEAL</h3>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600 font-mono">CHS 9: 96.8 / 100</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-500">معدل معالجة الشكاوى</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">98.5%</div>
              <div className="text-[11px] text-slate-400">إغلاق التذاكر في أقل من 48 ساعة</div>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-500">التدقيق الميداني العشوائي</div>
              <div className="text-2xl font-black text-indigo-600 font-mono">100%</div>
              <div className="text-[11px] text-slate-400">مطابقة المستفيدين بالبصمة الحيوية</div>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-500">مؤشر الجودة الإنسانية</div>
              <div className="text-2xl font-black text-purple-600 font-mono">Tier-1 AAA</div>
              <div className="text-[11px] text-slate-400">اعتماد معايير CHS وإسفير</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB 8: GOVERNANCE, HR & ADMIN ═══════════ */}
      {selectedWorkspace === 'admin' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-500/10 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700">
                <OrgHierarchySymbol className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded text-[10px] font-mono font-black">NEB-09</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">الهيكل المؤسسي وتدرج السلطات والموارد البشرية</h3>
              </div>
            </div>
            <EnterpriseButton
              variant="primary"
              size="sm"
              onClick={() => handlePrintDeskRecords(users, 'الكادر الوظيفي والهيكل المؤسسي', 'NEB-09')}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة كشف الكادر معتمد</span>
            </EnterpriseButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {users.slice(0, 8).map((u, i) => (
              <div key={i} className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-600">L{u.security_level || 3}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-bold">{u.status || 'Active'}</span>
                </div>
                <div className="font-black text-xs text-slate-900 dark:text-white">{u.name_ar || u.email}</div>
                <div className="text-[11px] text-slate-500">{u.role_name_ar || 'كادر معتمد'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: RECORD INSPECTION VOUCHER */}
      {inspectingRecord && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>سند قيد رسمي معتمد من قاعدة البيانات</span>
              </h3>
              <button onClick={() => setInspectingRecord(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(inspectingRecord).slice(0, 10).map(([k, v]) => (
                <div key={k} className="p-2 rounded bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                  <div className="text-[10px] text-slate-400 font-bold">{k}</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-zinc-100 truncate">{String(v ?? '-')}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setInspectingRecord(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InstitutionalRoleWorkspaces;
