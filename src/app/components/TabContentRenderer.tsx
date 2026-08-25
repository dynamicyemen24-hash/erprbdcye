import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { ActiveTab } from '../../core/types';
import ViewSkeleton from '../../components/common/ViewSkeleton';
import { ErrorBoundary } from './ErrorBoundary';
import { RequireAuth } from '../../core/security/RequireAuth';
import { ViewGuidanceBanner } from '../../shared/components/ViewGuidanceBanner';

// Lazy-loaded domain views for asynchronous code splitting & instant initial render
const DashboardView = lazy(() => import('../../components/DashboardView'));
const DomainCenterView = lazy(() => import('../../components/DomainCenterView'));
const GeospatialDashboardView = lazy(() => import('../../components/GeospatialDashboardView'));

const ProgramsView = lazy(() => import('../../components/ProgramsView'));

const ProjectsView = lazy(() => import('../../components/ProjectsView'));
const ActivitiesView = lazy(() => import('../../components/ActivitiesView'));
const OperationalScenariosView = lazy(() => import('../../components/OperationalScenariosView'));
const ResourceAllocationView = lazy(() => import('../../components/ResourceAllocationView'));

const BeneficiariesView = lazy(() => import('../../components/BeneficiariesView'));
const SponsorshipsView = lazy(() => import('../../components/SponsorshipsView'));
const ThirdPartyNetworkCenterView = lazy(() => import('../../components/ThirdPartyNetworkCenterView'));

const ContractManagementView = lazy(() => import('../../components/ContractManagementView').then(m => ({ default: m.ContractManagementView })));
const InventoryManagementView = lazy(() => import('../../components/InventoryManagementView').then(m => ({ default: m.InventoryManagementView })));

const FinanceView = lazy(() => import('../../components/FinanceView'));
const CurrenciesView = lazy(() => import('../../components/CurrenciesView'));
const ApprovalWorkflowView = lazy(() => import('../../components/ApprovalWorkflowView'));

const ReportsView = lazy(() => import('../../components/ReportsView'));
const DocumentationView = lazy(() => import('../../components/DocumentationView'));

const ControlPanelView = lazy(() => import('../../components/ControlPanelView'));
const AuditLogsView = lazy(() => import('../../components/AuditLogsView'));
const BackupView = lazy(() => import('../../components/BackupView'));
const SettingsView = lazy(() => import('../../components/SettingsView'));
const UsersView = lazy(() => import('../../components/UsersView'));
const HRManagementWorkspace = lazy(() => import('../../features/administration/HRManagementWorkspace'));

const StrategicPlanningView = lazy(() => import('../../components/StrategicPlanningView').then(m => ({ default: m.StrategicPlanningView })));
const InvestmentProjectsView = lazy(() => import('../../components/InvestmentProjectsView').then(m => ({ default: m.InvestmentProjectsView })));
const SalesRevenueView = lazy(() => import('../../components/SalesRevenueView'));

// Lucide Icons for Premium Window Chrome
import { 
  Maximize2, Minimize2, Save, Pause, Play, ExternalLink, X, Layout, 
  ShieldAlert, CheckCircle2, Lock, Unlock, Database, Eye, RefreshCw,
  Columns, ChevronDown, Clock, ArrowRightLeft, Sparkles, BookOpen, 
  Sliders, Compass, Briefcase, Layers, Activity, Users, Heart, Coins, 
  ShieldCheck, TrendingUp, User, Box, FileCheck, PlayCircle, Calendar, Globe, Settings
} from 'lucide-react';

export interface TabContentRendererProps {
  activeTab: ActiveTab;
  lang: 'ar' | 'en';
  loading: boolean;
  currentUser: any;
  dashboardStats: any;
  drillDownFilters: any;
  programs: any[];
  projects: any[];
  users: any[];
  roles: any[];
  currencies: any[];
  organizations: any[];
  orgSettings: any[];
  sysSettings: any[];
  beneficiaries: any[];
  sponsorships: any[];
  approvalRequests: any[];
  systemAlerts: string[];
  serverStats: any;
  onNavigate: (tab: ActiveTab) => void;
  onDrillDown: (tab: ActiveTab, filters: any) => void;
  onRefreshData: () => void;
  onOpenHelpers?: () => void;
}

export const TabContentRenderer: React.FC<TabContentRendererProps> = ({
  activeTab,
  lang,
  loading,
  currentUser,
  dashboardStats,
  drillDownFilters,
  programs,
  projects,
  users,
  roles,
  currencies,
  organizations,
  orgSettings,
  sysSettings,
  beneficiaries,
  sponsorships,
  approvalRequests,
  systemAlerts,
  serverStats,
  onNavigate,
  onDrillDown,
  onRefreshData,
  onOpenHelpers,
}) => {
  const isRtl = lang === 'ar';
  const activeOrg = (organizations && organizations.length > 0) ? (organizations.find(o => o.id === 'hq') || organizations[0]) : null;
  const orgName = activeOrg ? (lang === 'ar' ? activeOrg.name_ar : activeOrg.name_en) : (lang === 'ar' ? 'جمعية رُحماء بينهم' : "Rohamā'a Baynahum");

  // Stable callback wrappers to prevent unnecessary child re-renders
  const safeNavigate = useCallback((tab: string) => onNavigate(tab as ActiveTab), [onNavigate]);
  const safeDrillDown = useCallback((tab: string, filters: any) => onDrillDown(tab as ActiveTab, filters), [onDrillDown]);

  // Enterprise Windows & Workspace state
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Split view (second window side-by-side)
  const [splitTab, setSplitTab] = useState<ActiveTab | null>(null);
  const [isSecondaryPaused, setIsSecondaryPaused] = useState(false);
  const [enteredSecondaryPin, setEnteredSecondaryPin] = useState('');
  const [secondaryPinError, setSecondaryPinError] = useState(false);
  const [showSplitDropdown, setShowSplitDropdown] = useState(false);

  // Draft saving state
  const [draftToast, setDraftToast] = useState<string | null>(null);
  const [draftsList, setDraftsList] = useState<any[]>([]);

  // Load existing drafts on boot
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexora_drafts');
      if (stored) {
        setDraftsList(JSON.parse(stored));
      }
    } catch (e) { console.error('[Drafts] Failed to load drafts from localStorage:', e); }
  }, []);

  const handleSaveDraft = (targetTab: ActiveTab) => {
    const timestamp = new Date().toLocaleTimeString(isRtl ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tabLabel = TAB_CONFIG[targetTab] ? (isRtl ? TAB_CONFIG[targetTab].title_ar : TAB_CONFIG[targetTab].title_en) : targetTab;
    const newDraft = {
      id: Math.random().toString(36).substr(2, 9),
      tab: targetTab,
      label: tabLabel,
      time: timestamp,
      user: currentUser?.name || (isRtl ? 'مشرف النظام' : 'System Officer')
    };

    const updated = [newDraft, ...draftsList].slice(0, 5); // Keep last 5 drafts
    setDraftsList(updated);
    try {
      localStorage.setItem('nexora_drafts', JSON.stringify(updated));
    } catch (e) { console.error('[Drafts] Failed to save drafts to localStorage:', e); }

    setDraftToast(isRtl ? `تم حفظ مسودة مؤقتة لـ [${tabLabel}] بنجاح في تمام الساعة ${timestamp}` : `Temporary draft for [${tabLabel}] saved successfully at ${timestamp}`);
    setTimeout(() => {
      setDraftToast(null);
    }, 4000);
  };

  // Privacy screen: honest local privacy shield — resuming requires an explicit
  // user action only (no fake PIN validation that would imply real security)
  const handleUnlockPrimary = () => {
    setIsPaused(false);
    setEnteredPin('');
    setPinError(false);
  };

  const handleUnlockSecondary = () => {
    setIsSecondaryPaused(false);
    setEnteredSecondaryPin('');
    setSecondaryPinError(false);
  };

  // Enterprise Domain Mapping & Meta data
  const TAB_CONFIG: Record<ActiveTab, { icon: any; title_ar: string; title_en: string; domainCode: string; desc_ar: string; desc_en: string }> = {
    dashboard: { icon: Layout, title_ar: 'لوحة القيادة الاستراتيجية', title_en: 'Strategy Dashboard', domainCode: 'NEB-01', desc_ar: 'قياس الأداء والمؤشرات العامة والأثر الإنساني والميداني لمشاريع الجمعية.', desc_en: 'General impact KPI mapping, C-Level monitoring indices, and field project outcomes.' },
    control_panel: { icon: Sliders, title_ar: 'لوحة التحكم والعمليات', title_en: 'Control Panel', domainCode: 'NEB-05', desc_ar: 'إدارة وتفويض لوحات العمل، صلاحيات الفرق، وتكامل الخدمات المؤسسية.', desc_en: 'Operational workspace engine, access control, and automated workflow definition.' },
    domains: { icon: Compass, title_ar: 'الأنظمة والوحدات المؤسسية', title_en: 'Enterprise Systems Center', domainCode: 'NEB-12', desc_ar: 'مركز القيادة والتحكم لكافة الأنظمة والترابط الرقمي وقواعد البيانات.', desc_en: 'Command center interfacing the integrated Nexora operating systems.' },
    programs: { icon: Briefcase, title_ar: 'نظام البرامج التنموية', title_en: 'Programs Management OS', domainCode: 'NEB-03', desc_ar: 'تخطيط البرامج الاستراتيجية الكبرى للجمعية وموازناتها الإنمائية.', desc_en: 'Strategic multi-sector programs planning, funding streams, and overarching metrics.' },
    projects: { icon: Layers, title_ar: 'نظام المشاريع الميدانية', title_en: 'Projects Management OS', domainCode: 'NEB-04', desc_ar: 'إدارة دورة حياة المشاريع، نسب التنفيذ الفعلي والمالي، وتوزيع المهام الميدانية.', desc_en: 'Detailed field projects lifecycle, progress charts, tasks allocation, and active status.' },
    activities: { icon: Activity, title_ar: 'الأنشطة والمهام الميدانية', title_en: 'Field Activities & Tasks', domainCode: 'NEB-05', desc_ar: 'تنظيم ومتابعة المهام الميدانية، بطاقات العمل اليومية، وقوائم الإنجاز.', desc_en: 'Detailed task planning, field checklists, and progress tracking.' },
    beneficiaries: { icon: Users, title_ar: 'نظام المستفيدين والخدمات', title_en: 'Service Delivery & Beneficiaries OS', domainCode: 'NEB-06', desc_ar: 'قواعد بيانات المستفيدين، التحقق من الهوية الوطنية وتطبيق معايير الاستحقاق.', desc_en: 'Beneficiary registries, eligibility criteria, and humanitarian assistance routing.' },
    sponsorships: { icon: Heart, title_ar: 'نظام الكفالات والرعاية الاجتماعية', title_en: 'Sponsorships & Welfare OS', domainCode: 'NEB-08', desc_ar: 'برامج كفالات الأيتام، الأسر المحتاجة، الرعاية التعليمية، والتحويلات المالية الآمنة.', desc_en: 'Sponsorship programs, orphan registries, monthly distribution auditing, and compliance.' },
    finance: { icon: Coins, title_ar: 'نظام المالية والحوكمة', title_en: 'Finance & Compliance OS', domainCode: 'NEB-10', desc_ar: 'إدارة القيود اليومية والحسابات والموازنات العمومية والتقارير المالية المعتمدة.', desc_en: 'Double-entry general ledger, budget lines audit, and financial statements.' },
    approvals: { icon: ShieldCheck, title_ar: 'نظام الموافقات والاعتمادات', title_en: 'Workflows & Approvals OS', domainCode: 'NEB-10', desc_ar: 'المصفوفة متعددة المستويات لتوقيع المعاملات، اعتمادات الصرف الإلكترونية الآمنة.', desc_en: 'Multi-level approval workflows, authority metrics, and digitised expense request routing.' },
    reports: { icon: TrendingUp, title_ar: 'مركز التقارير والتحليلات', title_en: 'Reports & Analytics Center', domainCode: 'NEB-11', desc_ar: 'تحليل الأثر الميداني الذكي، وتصدير التقارير المعمدة الرسمية بجودة عالية.', desc_en: 'Advanced impact statistics and certified PDF/Excel reports exporter.' },
    users: { icon: User, title_ar: 'نظام الكادر والملفات المهنية', title_en: 'Resource & Personnel OS', domainCode: 'NEB-09', desc_ar: 'السجلات الوظيفية للفرق الإنسانية، تخطيط المهام الميدانية وتتبع الحضور الرقمي.', desc_en: 'Staff profiles, humanitarian field logs, skills mapping, and active team locations.' },
    inventory: { icon: Box, title_ar: 'نظام الإمداد والمخزون الإغاثي', title_en: 'Supply Chain & Inventory OS', domainCode: 'NEB-09', desc_ar: 'مستودعات المواد الإغاثية والطبية، مستويات إعادة الطلب الآمن، وإذن التوريد والصرف.', desc_en: 'Humanitarian inventory warehouses, logistics pipelines, stock movements, and asset registers.' },
    contracts: { icon: FileCheck, title_ar: 'نظام العقود والمناقصات والمشتريات', title_en: 'Contracts & Procurement OS', domainCode: 'NEB-08', desc_ar: 'مناقصات تأمين السلال الغذائية والمعدات، تصنيف الموردين، والدفعات التعاقدية.', desc_en: 'Supplier tenders, equipment logistics procurement, and contractual compliance.' },
    currencies: { icon: Coins, title_ar: 'نظام العملات والصرف الأجنبي', title_en: 'Foreign Exchange OS', domainCode: 'NEB-10', desc_ar: 'تحديث أسعار صرف الريال اليمني والدولار والريال السعودي في الوقت الفعلي.', desc_en: 'Live multi-currency rate tracking, forex conversion logs, and treasury operations.' },
    settings: { icon: Settings, title_ar: 'إعدادات النظام والمنظمة', title_en: 'System Configurations OS', domainCode: 'NEB-12', desc_ar: 'تهيئة معايير الأمان، وبيانات المنظمة ونطاقات العمل.', desc_en: 'General software system configurations and organizational preferences.' },
    audit: { icon: Database, title_ar: 'سجل التدقيق المؤسسي', title_en: 'Audit Logs OS', domainCode: 'NEB-11', desc_ar: 'مراقبة وتوثيق كافة العمليات الإدارية والمالية لضمان أعلى معايير الشفافية.', desc_en: 'Chronological audit logs tracking administrative and financial events.' },
    backup: { icon: Database, title_ar: 'نظام النسخ الاحتياطي السحابي', title_en: 'Cloud Backup OS', domainCode: 'NEB-12', desc_ar: 'سجل النسخ الاحتياطية المؤتمتة لبيانات المؤسسة لضمان أمان واستمرارية العمل.', desc_en: 'Automated data state snapshots and cloud backup recovery.' },
    docs: { icon: BookOpen, title_ar: 'الدليل التشغيلي والوثائق', title_en: 'System Manual & Docs', domainCode: 'NEB-11', desc_ar: 'الدليل التشغيلي الموحد، المرجعية الإجرائية، واللوائح المؤسسية.', desc_en: 'Operational guidelines, user manual, and organizational standard policies.' },
    scenarios: { icon: PlayCircle, title_ar: 'سيناريوهات العمليات المعتمدة', title_en: 'Operational Playbooks', domainCode: 'NEB-05', desc_ar: 'سيناريوهات الاستجابة الإنسانية الطارئة وكتيبات الإجراءات القياسية الميدانية.', desc_en: 'Humanitarian emergency response frameworks and standard operating procedures.' },
    allocations: { icon: Calendar, title_ar: 'نظام تخطيط الموارد البشرية', title_en: 'Personnel Resource Allocation', domainCode: 'NEB-09', desc_ar: 'إسناد الموظفين للمشاريع الميدانية، قياس ساعات العمل المعتمدة والأثر التشغيلي.', desc_en: 'Staffing schedules mapped dynamically to active humanitarian project sites.' },
    geospatial: { icon: Globe, title_ar: 'خريطة الأثر الجغرافي التفاعلية', title_en: 'GIS Impact & Spatial Map', domainCode: 'NEB-13', desc_ar: 'تتبع المستفيدين، مستودعات التموين، ومواقع حفر الآبار في عموم المحافظات.', desc_en: 'Interactive map plotting direct aid locations, water boreholes, and stock warehouses.' },
    strategic_planning: { icon: Activity, title_ar: 'التخطيط الاستراتيجي والأداء', title_en: 'Strategic Planning & Performance', domainCode: 'NEB-01', desc_ar: 'الخطة الاستراتيجية لمؤسسة رُحماء بينهم، الأهداف ومؤشرات الأداء.', desc_en: 'Strategic objectives, performance indicators, and organizational alignment.' },
    investments: { icon: TrendingUp, title_ar: 'المشاريع الاستثمارية والأوقاف التنموية', title_en: 'Investment & Endowment OS', domainCode: 'NEB-15', desc_ar: 'إدارة أصول الأوقاف التنموية، عوائد الاستثمار، وحماية أصل الوقف.', desc_en: 'Endowment assets, performance tracking, yield distribution, and Shariah governance.' },
    hr_dashboard: { icon: Users, title_ar: 'لوحة إدارة الموارد البشرية', title_en: 'HR Management Dashboard', domainCode: 'NEB-09', desc_ar: 'إدارة الكادر الوظيفي، تقييم الأداء، وتوازن المهام.', desc_en: 'HR workforce management, performance appraisal, and workload balancing.' },
    'third-party-network': { icon: ShieldCheck, title_ar: 'شبكة الأطراف ومطالبات التجار', title_en: 'Third-Party Network & Claims', domainCode: 'NEB-14', desc_ar: 'إدارة أطراف العملية، مطابقة القسائم الرقمية، ومطالبات وتسويات التجار والشركاء.', desc_en: 'Third-party merchants, digital voucher fulfillment, claims processing, and settlements.' },
    sales: { icon: Coins, title_ar: 'نظام المبيعات والإيرادات وتنمية الموارد', title_en: 'Sales, Revenue & Fundraising OS', domainCode: 'NEB-15', desc_ar: 'إدارة حملات التبرع، الاشتراكات والمنتجات الوقفية، الفواتير، ونمو الإيرادات المستدامة.', desc_en: 'Fundraising campaigns, endowment products, invoices, and sustainable revenue generation.' }
  };

  const renderSingleTabContent = (tabKey: ActiveTab) => {
    switch (tabKey) {
      case 'investments':
        return <InvestmentProjectsView lang={lang} onNavigate={safeNavigate} />;
      case 'strategic_planning':
        return <StrategicPlanningView lang={lang} onNavigate={safeNavigate} />;
      case 'dashboard':
        return (
          <DashboardView
            stats={dashboardStats}
            loading={loading}
            onNavigate={safeNavigate}
            onDrillDown={safeDrillDown}
            lang={lang}
            onRefresh={onRefreshData}
            programs={programs}
            projects={projects}
            beneficiaries={beneficiaries}
            sponsorships={sponsorships}
            approvalRequests={approvalRequests}
            users={users}
            currencies={currencies}
            systemAlerts={systemAlerts}
            currentUser={currentUser}
            activeOrg={activeOrg}
            orgName={orgName}
            onOpenHelpers={onOpenHelpers}
          />
        );
      case 'control_panel':
        return (
          <ControlPanelView
            lang={lang}
            currentUser={currentUser}
            onNavigate={safeNavigate}
            onRefreshData={onRefreshData}
            serverStats={serverStats}
            activeOrg={activeOrg}
            orgName={orgName}
          />
        );
      case 'programs':
        return <ProgramsView lang={lang} programs={programs} loading={loading} onRefresh={onRefreshData} initialStatusFilter={drillDownFilters.programsStatus} />;
      case 'projects':
        return <ProjectsView lang={lang} projects={projects} programs={programs} loading={loading} onRefresh={onRefreshData} initialStatusFilter={drillDownFilters.projectsStatus} />;
      case 'activities':
        return (
          <ActivitiesView 
            lang={lang} 
            programs={programs} 
            projects={projects} 
            beneficiaries={beneficiaries}
            loading={loading} 
            onRefresh={onRefreshData} 
            onNavigate={safeNavigate} 
          />
        );
      case 'beneficiaries':
        return (
          <BeneficiariesView 
            beneficiaries={beneficiaries} 
            loading={loading} 
            onRefresh={onRefreshData} 
            lang={lang} 
            initialStatusFilter={drillDownFilters.beneficiariesStatus}
            initialCategoryFilter={drillDownFilters.beneficiariesCategory}
            onNavigate={safeNavigate}
          />
        );
      case 'sponsorships':
        return <SponsorshipsView sponsorships={sponsorships} beneficiaries={beneficiaries} programs={programs} currencies={currencies} loading={loading} onRefresh={onRefreshData} lang={lang} onNavigate={safeNavigate} />;
      case 'third-party-network':
        return <ThirdPartyNetworkCenterView lang={lang} onNavigate={safeNavigate} />;
      case 'finance':
        return <FinanceView currencies={currencies} lang={lang} onRefresh={onRefreshData} onNavigate={safeNavigate} />;
      case 'approvals':
        return <ApprovalWorkflowView currentUser={currentUser as any} lang={lang} onRefresh={onRefreshData} initialStatusFilter={drillDownFilters.approvalsStatus} onNavigate={safeNavigate} />;
      case 'reports':
        return <ReportsView programs={programs} projects={projects} beneficiaries={beneficiaries} sponsorships={sponsorships} currencies={currencies} lang={lang} organizations={organizations} onNavigate={safeNavigate} />;
      case 'users':
        return <UsersView users={users} roles={roles} loading={loading} onRefresh={onRefreshData} lang={lang} />;
      case 'inventory':
        return <InventoryManagementView lang={lang} currentUser={currentUser} beneficiaries={beneficiaries} onNavigate={safeNavigate} />;
      case 'contracts':
        return (
          <ContractManagementView 
            lang={lang} 
            projects={projects} 
            currentUser={currentUser} 
            onRefresh={onRefreshData} 
            onNavigate={safeNavigate} 
          />
        );
      case 'currencies':
        return <CurrenciesView currencies={currencies} loading={loading} onRefresh={onRefreshData} lang={lang} />;
      case 'settings':
        return <SettingsView organizations={organizations} orgSettings={orgSettings} sysSettings={sysSettings} loading={loading} onRefresh={onRefreshData} lang={lang} />;
      case 'audit':
        return <AuditLogsView lang={lang} />;
      case 'backup':
        return <BackupView lang={lang} onRefresh={onRefreshData} currentUser={currentUser} />;
      case 'domains':
        return (
          <DomainCenterView 
            lang={lang}
            onNavigate={safeNavigate}
            orgName={orgName}
          />
        );
      case 'docs':
        return (
          <DocumentationView 
            lang={lang}
            onNavigate={safeNavigate}
            orgName={orgName}
          />
        );
      case 'scenarios':
        return (
          <OperationalScenariosView 
            lang={lang}
            onNavigate={safeNavigate}
          />
        );
      case 'allocations':
        return (
          <ResourceAllocationView 
            lang={lang}
            projects={projects}
            users={users}
            onRefresh={onRefreshData}
          />
        );
      case 'geospatial':
        return (
          <GeospatialDashboardView 
            lang={lang}
            projects={projects}
            beneficiaries={beneficiaries}
            programs={programs}
          />
        );
      case 'hr_dashboard':
        return <HRManagementWorkspace lang={lang} />;
      case 'sales':
        return <SalesRevenueView lang={lang} onNavigate={safeNavigate} />;
      default:
        return (
          <DashboardView
            stats={dashboardStats}
            loading={loading}
            onNavigate={safeNavigate}
            onDrillDown={safeDrillDown}
            lang={lang}
            onRefresh={onRefreshData}
            programs={programs}
            projects={projects}
            beneficiaries={beneficiaries}
            sponsorships={sponsorships}
            approvalRequests={approvalRequests}
            users={users}
            currencies={currencies}
            systemAlerts={systemAlerts}
            currentUser={currentUser}
          />
        );
    }
  };

  // Safe names and codes
  const primaryConfig = TAB_CONFIG[activeTab] || TAB_CONFIG['dashboard'];
  const secondaryConfig = splitTab ? (TAB_CONFIG[splitTab] || TAB_CONFIG['dashboard']) : null;

  // Window styling helper
  const maximizedClasses = isMaximized 
    ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-zinc-950 p-6 overflow-y-auto' 
    : 'w-full';

  return (
    <div className={`relative ${maximizedClasses} transition-all duration-300`}>
      {/* Dynamic Saving Notification Toast */}
      {draftToast && (
        <div className="fixed bottom-12 left-6 right-6 md:left-auto md:w-[480px] z-50 bg-emerald-600 border border-emerald-400 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="p-2 bg-white/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black leading-relaxed">{draftToast}</p>
          </div>
          <button onClick={() => setDraftToast(null)} className="p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Floating Minimize Restorer Panel */}
      {isMinimized && (
        <div className="fixed bottom-12 right-6 z-50 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-2xl flex items-center gap-3 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 block">{isRtl ? 'نافذة مصغرة نشطة' : 'MINIMIZED ACTIVE WINDOW'}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              {isRtl ? primaryConfig.title_ar : primaryConfig.title_en}
            </span>
          </div>
          <button 
            onClick={() => setIsMinimized(false)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            {isRtl ? 'استعادة النافذة' : 'Restore Window'}
          </button>
        </div>
      )}

      {!isMinimized && (
        <div className="flex flex-col h-full w-full">
          {/* Main Workspace Frame Container */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            
            {/* CHROME HEADER BAR FOR THE WORKSPACE FRAME */}
            <div className="h-12 bg-slate-100/90 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 px-4 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2.5">
                {/* Active Status Indicator */}
                <div className="px-2 py-0.5 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-md text-[10px] font-bold shadow-2xs">
                  {isRtl ? 'نظام تشغيلي نشط' : 'Active Domain'}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                    <span>{isRtl ? primaryConfig.title_ar : primaryConfig.title_en}</span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 block">
                    {isRtl ? 'بيئة تشغيلية مباشرة ومستقرة' : 'Active Workspace | Connected & Stable'}
                  </span>
                </div>
              </div>

              {/* Action Buttons Cluster */}
              <div className="flex items-center gap-2">
                
                {/* Dual-Screen Split Window Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setShowSplitDropdown(!showSplitDropdown)}
                    className={`h-8 px-2.5 rounded-lg border transition-all text-[10px] font-black flex items-center gap-1.5 cursor-pointer ${
                      splitTab 
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                        : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
                    }`}
                    title={isRtl ? 'تقسيم الشاشة لعرض نظامين متكاملين' : 'Split-Screen Workspace'}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {splitTab 
                        ? (isRtl ? `شاشتين: ${TAB_CONFIG[splitTab]?.title_ar}` : `Split: ${splitTab}`) 
                        : (isRtl ? 'تقسيم الشاشة' : 'SPLIT SCREEN')
                      }
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Split Screen selector Dropdown */}
                  {showSplitDropdown && (
                    <div className="absolute right-0 top-9 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-2 py-1.5 border-b border-slate-100 dark:border-zinc-800/60 mb-1">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">{isRtl ? 'تقسيم الشاشة الثنائية' : 'DUAL SCREEN SPLIT'}</span>
                        <p className="text-[10px] text-slate-500">{isRtl ? 'اختر نظاماً لفتحه جنباً إلى جنب:' : 'Open second system side-by-side:'}</p>
                      </div>
                      <div className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                        {Object.entries(TAB_CONFIG).map(([key, config]) => {
                          if (key === activeTab) return null;
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                setSplitTab(key as ActiveTab);
                                setShowSplitDropdown(false);
                              }}
                              className="w-full text-left rtl:text-right px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2 transition-all cursor-pointer"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                              <span className="truncate">{isRtl ? config.title_ar : config.title_en}</span>
                            </button>
                          );
                        })}
                      </div>
                      {splitTab && (
                        <div className="pt-1 border-t border-slate-100 dark:border-zinc-800/60 mt-1">
                          <button
                            onClick={() => {
                              setSplitTab(null);
                              setShowSplitDropdown(false);
                            }}
                            className="w-full py-1 text-center text-[10px] font-black text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          >
                            {isRtl ? 'إلغاء تقسيم الشاشة' : 'RESET TO SINGLE SCREEN'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Draft saving button */}
                <button
                  onClick={() => handleSaveDraft(activeTab)}
                  className="h-8 px-2.5 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all text-[10px] font-black flex items-center gap-1.5 cursor-pointer"
                  title={isRtl ? 'حفظ مسودة مؤقتة للمدخلات' : 'Save Temporary Draft'}
                >
                  <Save className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">{isRtl ? 'حفظ مؤقت' : 'DRAFT'}</span>
                </button>

                {/* Pause/Suspend execution button */}
                <button
                  onClick={() => setIsPaused(true)}
                  className="h-8 px-2.5 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all text-[10px] font-black flex items-center gap-1.5 cursor-pointer"
                  title={isRtl ? 'تعليق شاشة العمل لأسباب أمنية' : 'Suspend Work session'}
                >
                  <Pause className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden md:inline">{isRtl ? 'تعليق العمل' : 'SUSPEND'}</span>
                </button>

                {/* Open in standard new window simulation */}
                <button
                  onClick={() => {
                    const cleanUrl = `${window.location.origin}/?tab=${activeTab}`;
                    window.open(cleanUrl, '_blank');
                  }}
                  className="h-8 w-8 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center cursor-pointer"
                  title={isRtl ? 'فتح في نافذة مستقلة جديدة' : 'Open in New Window'}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                {/* Minimize frame window */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="h-8 w-8 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center cursor-pointer"
                  title={isRtl ? 'تصغير الإطار' : 'Minimize Window'}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>

                {/* Maximize frame window */}
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className={`h-8 w-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                    isMaximized 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                      : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
                  }`}
                  title={isRtl ? 'ملء الشاشة بالكامل للتركيز' : 'Maximize Window'}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

              </div>
            </div>

            {/* DRAFT NOTIFICATION RIBBON */}
            {draftsList.length > 0 && (
              <div className="bg-emerald-500/5 border-b border-slate-200/50 dark:border-zinc-800/40 px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 select-none">
                <div className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {isRtl 
                      ? `آخر مسودة محفوظة للمستند: [${draftsList[0].label}] في تمام الساعة ${draftsList[0].time} بواسطة ${draftsList[0].user}` 
                      : `Last saved snapshot draft: [${draftsList[0].label}] at ${draftsList[0].time} by ${draftsList[0].user}`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black rounded uppercase text-[8px]">
                    {isRtl ? 'مسودة محلية آمنة' : 'Encrypted Draft'}
                  </span>
                </div>
              </div>
            )}

            {/* MAIN INNER FRAME BODY: HANDLES SINGLE TAB OR DUAL-SCREEN SPLIT */}
            <div className="flex-1 min-h-0 bg-slate-50/20 dark:bg-zinc-950/20 p-4 relative">
              
              {/* PRIMARY WINDOW SECURITY PAUSE / SUSPENSION SCREEN */}
              {isPaused && (
                <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md z-40 flex items-center justify-center p-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-black text-white mb-2">
                      {isRtl ? 'شاشة خصوصية — الجلسة معلقة' : 'Privacy Screen — Session Suspended'}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                      {isRtl
                        ? `تم إخفاء بيانات [${primaryConfig.title_ar}] عن المتطفلين المحيطين بك. انقر للاستئناف الفوري.`
                        : `Data inside [${primaryConfig.title_en}] is hidden from shoulder-surfers. Click to instantly resume.`}
                    </p>

                    <div className="space-y-4">
                      <button
                        onClick={handleUnlockPrimary}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>{isRtl ? 'استئناف العمل' : 'Resume Work'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SPLIT SCREEN RENDERING IF SECOND TAB IS ACTIVE */}
              {splitTab ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full w-full">
                  
                  {/* PANE 1: PRIMARY WINDOW VIEW */}
                  <div className="border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 p-4 shadow-2xs overflow-hidden flex flex-col relative">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-zinc-800/60 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <h4 className="text-[11px] font-black text-slate-800 dark:text-zinc-200 uppercase">
                          {isRtl ? `الشاشة الأولى: ${primaryConfig.title_ar}` : `Pane 1: ${primaryConfig.title_en}`}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleSaveDraft(activeTab)} 
                          className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500"
                          title={isRtl ? 'حفظ مسودة' : 'Save draft'}
                        >
                          <Save className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                        <button 
                          onClick={() => setIsPaused(true)} 
                          className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500"
                          title={isRtl ? 'تعليق العمل' : 'Suspend'}
                        >
                          <Pause className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                      </div>
                    </div>
                    <ViewGuidanceBanner tab={activeTab} lang={lang} />
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <ErrorBoundary key={activeTab} domainName={activeTab} lang={lang}>
                        <Suspense fallback={<ViewSkeleton />}>
                          {renderSingleTabContent(activeTab)}
                        </Suspense>
                      </ErrorBoundary>
                    </div>
                  </div>

                  {/* PANE 2: SECONDARY WINDOW VIEW */}
                  <div className="border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 p-4 shadow-2xs overflow-hidden flex flex-col relative">
                    {/* SECONDARY LOCK SCREEN */}
                    {isSecondaryPaused && (
                      <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md z-40 flex items-center justify-center p-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center max-w-sm w-full shadow-xl animate-in zoom-in-95">
                          <Lock className="w-8 h-8 text-amber-500 mx-auto mb-3 animate-pulse" />
                          <h4 className="text-sm font-black text-white mb-1">{isRtl ? 'الشاشة الثانية معلقة' : 'Secondary Pane Suspended'}</h4>
                          <p className="text-[11px] text-zinc-400 mb-4">{isRtl ? 'اضغط استئناف لفتح الشاشة.' : 'Click below to resume session.'}</p>
                          <button
                            onClick={handleUnlockSecondary}
                            className="w-full h-9 bg-emerald-600 text-white rounded-lg text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>{isRtl ? 'استئناف' : 'Resume'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-zinc-800/60 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <h4 className="text-[11px] font-black text-slate-800 dark:text-zinc-200 uppercase">
                          {isRtl ? `الشاشة الثانية: ${secondaryConfig?.title_ar}` : `Pane 2: ${secondaryConfig?.title_en}`}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleSaveDraft(splitTab)} 
                          className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500"
                          title={isRtl ? 'حفظ مسودة' : 'Save draft'}
                        >
                          <Save className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                        <button 
                          onClick={() => setIsSecondaryPaused(true)} 
                          className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500"
                          title={isRtl ? 'تعليق العمل' : 'Suspend'}
                        >
                          <Pause className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                        <button 
                          onClick={() => setSplitTab(null)} 
                          className="p-1 hover:bg-rose-500/10 text-rose-600 rounded"
                          title={isRtl ? 'إغلاق الشاشة الثنائية' : 'Close Split View'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <ErrorBoundary key={splitTab} domainName={splitTab} lang={lang}>
                        <Suspense fallback={<ViewSkeleton />}>
                          {renderSingleTabContent(splitTab)}
                        </Suspense>
                      </ErrorBoundary>
                    </div>
                  </div>

                </div>
              ) : (
                /* SINGLE MAIN WINDOW VIEW */
                <div className="h-full w-full flex flex-col">
                  <ViewGuidanceBanner tab={activeTab} lang={lang} />
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <ErrorBoundary key={activeTab} domainName={activeTab} lang={lang}>
                      <Suspense fallback={<ViewSkeleton />}>
                        {renderSingleTabContent(activeTab)}
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
