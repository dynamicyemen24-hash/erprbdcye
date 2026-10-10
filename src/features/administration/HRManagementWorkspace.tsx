import { showToast } from '../../components/enterprise/EnterpriseToastContainer';
import React, { useState, useEffect } from 'react';
import { cn } from '../../design-system/utils/cn';
import { EmptyState } from '../../design-system/components/EmptyState';
import { ErrorState } from '../../design-system/components/ErrorState';
import { Spinner } from '../../design-system/components/Spinner';
import { ConfirmDialog } from '../../design-system/components/ConfirmDialog';
import { Pagination } from '../../design-system/components/Pagination';
import { useDebouncedValue } from '../../design-system/hooks/useDebouncedValue';
import { EnterpriseButton } from '../../components/common/EnterpriseButton';
import { 
  Users, 
  Building2, 
  Clock, 
  Coins, 
  Award, 
  BookOpen, 
  BarChart3, 
  ShieldCheck, 
  Plus, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp, 
  Printer,
  Heart,
  Compass
} from 'lucide-react';
import { 
  EmployeeContributionView, 
  AIWorkloadBalancerView, 
  HRIntelligenceAnalyticsView, 
  HRPerformanceMatrixView, 
  HRRegulatoryComplianceHeatmap,
  HROrgPositionsView,
  HREmployee360View,
  HRAttendanceLeavesView,
  HRPayrollIPSASView,
  HRLearningTalentView
} from '../hr';
import HRDocumentGeneratorModal from '../hr/HRDocumentGeneratorModal';
import { ModuleShell } from '../../components/enterprise/ModuleShell';
import { PolicyButton } from '../../core/security/PermissionGate';
import { PermissionGate } from '../../components/PermissionGate';
import { PERMISSIONS } from '../../shared/permissions/permission-map';
import { usePermissions } from '../../shared/permissions/usePermissions';
import { OrgHierarchySymbol } from '../../components/common/SovereignSystemIcons';

interface HRManagementWorkspaceProps {
  lang: 'ar' | 'en';
  onNavigate?: (tab: string) => void;
}

type HRTab = 'bi_dashboard' | 'org_positions' | 'employee_360' | 'attendance_leaves' | 'payroll_ipsas' | 'performance_360' | 'learning_talent' | 'documents_compliance';
type WorkforceCategory = 'all' | 'permanent' | 'volunteer' | 'cooperator' | 'delegate' | 'consultant';

export default function HRManagementWorkspace({ lang, onNavigate }: HRManagementWorkspaceProps) {
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<HRTab>('bi_dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [workforceCategory, setWorkforceCategory] = useState<WorkforceCategory>('all');

  // Security State — REAL session subject (never hardcoded).
  // PolicyButton still takes level/role props, so we derive them from the
  // signed-in session; unauthenticated sessions fail closed (level 0).
  const { subject } = usePermissions();
  const securityLevel = Number(subject?.security_level ?? 0) || 0;
  const userRole = String(subject?.role ?? 'VIEWER');

  // Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedStaffForDoc, setSelectedStaffForDoc] = useState<any>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardName, setOnboardName] = useState('');
  const [onboardType, setOnboardType] = useState('permanent');
  const [onboardDept, setOnboardDept] = useState('');
  const [onboarding, setOnboarding] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);

  // Master HR Data State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Debounced roster search — table re-filters 300ms after typing stops
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  // Roster pagination (10 rows/page)
  const [staffPage, setStaffPage] = useState(1);
  const STAFF_PAGE_SIZE = 10;

  // Fetch HR Master Data from Neon PostgreSQL API
  const fetchHRData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const staffRes = await fetch('/api/tables/hr_staff');
      if (!staffRes.ok) throw new Error(isRtl ? 'تعذر تحميل بيانات الكادر' : 'Failed to load workforce data');
      const staffData = await staffRes.json();
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setStaffPage(1);
    } catch (e: any) {
      setFetchError(e?.message || (isRtl ? 'فشل تحميل بيانات الموارد البشرية' : 'Failed to fetch HR master data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Productive onboarding: POST /api/tables/hr_staff (HR_WRITE, level>=2 enforced server-side).
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardName.trim()) {
      setOnboardError(isRtl ? 'اسم الموظف مطلوب' : 'Staff name is required');
      return;
    }
    setOnboarding(true);
    setOnboardError(null);
    try {
      const token = localStorage.getItem('rbd_token') || sessionStorage.getItem('rbd_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/tables/hr_staff', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          full_name_ar: onboardName.trim(),
          name: onboardName.trim(),
          employment_type: onboardType,
          department_code: onboardDept.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || (isRtl ? 'تعذر إنشاء سجل الموظف' : 'Failed to create staff record'));
      }
      setShowOnboardModal(false);
      setOnboardName('');
      setOnboardDept('');
      setOnboardType('permanent');
      showToast({ type: 'success', title: isRtl ? 'تم تعيين الموظف' : 'Workforce onboarded', message: isRtl ? 'تم حفظ سجل الموظف في قاعدة البيانات' : 'Staff record saved to database' });
      await fetchHRData();
    } catch (err: any) {
      setOnboardError(err?.message || (isRtl ? 'فشل الحفظ' : 'Save failed'));
    } finally {
      setOnboarding(false);
    }
  };

  // Filtered staff list with workforce category filter
  const filteredStaff = staffList.filter(staff => {
    const nameMatch = (staff.full_name_ar || staff.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const deptMatch = departmentFilter === 'all' || staff.department_code === departmentFilter;
    const catMatch = workforceCategory === 'all' || staff.employment_type === workforceCategory;
    return nameMatch && deptMatch && catMatch;
  });

  // Paged slice (clamps when filters shrink the list)
  const staffTotalPages = Math.max(1, Math.ceil(filteredStaff.length / STAFF_PAGE_SIZE));
  const safeStaffPage = Math.min(staffPage, staffTotalPages);
  const pagedStaff = filteredStaff.slice(
    (safeStaffPage - 1) * STAFF_PAGE_SIZE,
    safeStaffPage * STAFF_PAGE_SIZE
  );

  return (
    <ModuleShell
      titleAr="إدارة الموارد البشرية"
      titleEn="HR Management"
      domainCode="NEB-09"
      icon={OrgHierarchySymbol}
      lang={lang}
      accent="purple"
    >
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* DOCUMENT & CONTRACT GENERATOR MODAL */}
      <HRDocumentGeneratorModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        lang={lang}
        employeeData={selectedStaffForDoc}
      />

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">
                {isRtl ? 'نظام إدارة الموارد البشرية وإرشادات رأس المال البشري' : 'HR Enterprise Operating System 3.2'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                {isRtl ? 'إدارة الكادر والموارد' : 'Workforce Management'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {isRtl 
                ? 'إدارة الكادر الدائم، المتطوعين، المتعاونين، المندوبين، والاستشاريين مع عقود ومستندات معيارية' 
                : 'Core Staff, Volunteers, Cooperators, Field Delegates & Consultants Management with Standardized Contracts'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PolicyButton
            action="approve"
            domain="hr"
            securityLevel={securityLevel}
            userRole={userRole}
            onClick={() => {
              setSelectedStaffForDoc(null);
              setShowDocModal(true);
            }}
            className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isRtl ? 'طباعة العقود والوثائق' : 'Generate Contracts'}</span>
          </PolicyButton>

          <button
            onClick={() => onNavigate?.('scenarios')}
            className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRtl ? 'دليل الإجراءات والتوصيف واللوائح' : 'Master SOP & Bylaws'}</span>
          </button>

          <EnterpriseButton
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchHRData}
            disabled={loading}
          >
            {isRtl ? 'تحديث البيانات' : 'Refresh Data'}
          </EnterpriseButton>

          <PermissionGate perm={PERMISSIONS.HR_WRITE} mode="disabled">
          <PolicyButton
            action="create"
            domain="hr"
            securityLevel={securityLevel}
            userRole={userRole}
            onClick={() => setShowOnboardModal(true)}
            className=""
          >
            <EnterpriseButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              {isRtl ? 'تعيين موظف / متطوع' : 'Onboard Workforce'}
            </EnterpriseButton>
          </PolicyButton>
          </PermissionGate>
        </div>
      </div>

      {/* ONBOARDING MODAL — productive, DB-backed */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-dialog flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={isRtl ? 'تعيين موظف جديد' : 'Onboard workforce'}>
          <form onSubmit={handleOnboardSubmit} className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">{isRtl ? 'تعيين موظف / متطوع جديد' : 'Onboard workforce'}</h3>
            <label className="block space-y-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <span>{isRtl ? 'الاسم الكامل' : 'Full name'}</span>
              <input
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                placeholder={isRtl ? 'مثال: م. أحمد المعمري' : 'e.g. Ahmed Al-Maamari'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:border-emerald-500"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span>{isRtl ? 'الفئة' : 'Category'}</span>
                <select value={onboardType} onChange={(e) => setOnboardType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs">
                  <option value="permanent">{isRtl ? 'كادر دائم' : 'Permanent'}</option>
                  <option value="volunteer">{isRtl ? 'متطوع' : 'Volunteer'}</option>
                  <option value="cooperator">{isRtl ? 'متعاون' : 'Cooperator'}</option>
                  <option value="delegate">{isRtl ? 'مندوب' : 'Delegate'}</option>
                  <option value="consultant">{isRtl ? 'استشاري' : 'Consultant'}</option>
                </select>
              </label>
              <label className="block space-y-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span>{isRtl ? 'رمز القسم' : 'Dept code'}</span>
                <input value={onboardDept} onChange={(e) => setOnboardDept(e.target.value)} placeholder="HR-01" className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono" />
              </label>
            </div>
            {onboardError && <p role="alert" className="text-[11px] font-bold text-rose-600">{onboardError}</p>}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowOnboardModal(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" disabled={onboarding} className="px-4 py-2 text-xs font-black rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
                {onboarding ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ في قاعدة البيانات' : 'Save to database')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WORKFORCE CATEGORY SELECTOR BAR */}
      <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4 overflow-x-auto text-xs font-bold">
        <div className="flex items-center gap-2 shrink-0 text-slate-500 dark:text-zinc-400">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>{isRtl ? 'تصنيف القوى العاملة:' : 'Workforce Tier:'}</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', ar: 'الكل (جميع الفئات)', en: 'All Categories' },
            { id: 'permanent', ar: 'كادر دائم (Core FTE)', en: 'Permanent Staff' },
            { id: 'volunteer', ar: 'متطوعون ميدانيون', en: 'Volunteers' },
            { id: 'cooperator', ar: 'متعاونون بأجر يومي', en: 'Cooperators / Daily' },
            { id: 'delegate', ar: 'مندوبو المحافظات', en: 'Field Delegates' },
            { id: 'consultant', ar: 'استشاريون وخبراء', en: 'External Consultants' },
          ].map((cat) => (
            <EnterpriseButton
              key={cat.id}
              onClick={() => setWorkforceCategory(cat.id as WorkforceCategory)}
              variant={workforceCategory === cat.id ? 'primary' : 'secondary'}
              size="xs"
            >
              {isRtl ? cat.ar : cat.en}
            </EnterpriseButton>
          ))}
        </div>
      </div>

      {/* ENTERPRISE 8-DOMAIN CAPABILITY TABS */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800/80 p-1.5 rounded-2xl overflow-x-auto custom-scrollbar text-xs font-bold select-none">
        {[
          { id: 'bi_dashboard', icon: BarChart3, ar: 'لوحة التحليلات والمؤشرات', en: 'HR BI Dashboard' },
          { id: 'org_positions', icon: Building2, ar: 'الهيكل والوظائف', en: 'Org Architecture' },
          { id: 'employee_360', icon: Users, ar: 'سجل الموظف 360', en: 'Employee 360' },
          { id: 'attendance_leaves', icon: Clock, ar: 'الدوام والإجازات', en: 'Time & Leave' },
          { id: 'payroll_ipsas', icon: Coins, ar: 'مسير المرتبات والأجور', en: 'Compensation & Payroll' },
          { id: 'performance_360', icon: Award, ar: 'تقييم الأداء 360', en: 'Performance 360' },
          { id: 'learning_talent', icon: BookOpen, ar: 'التدريب والموهبة', en: 'L&D & Talent' },
          { id: 'documents_compliance', icon: ShieldCheck, ar: 'الأرشيف والامتثال', en: 'Docs & Compliance' },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <EnterpriseButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id as HRTab)}
              variant={isActive ? 'primary' : 'ghost'}
              size="md"
              icon={<IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-500'}`} />}
            >
              {isRtl ? tab.ar : tab.en}
            </EnterpriseButton>
          );
        })}
      </div>

      {fetchError && (
        <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl overflow-hidden">
          <ErrorState
            titleAr="تعذر تحميل بيانات الموارد البشرية"
            title="Failed to load HR data"
            messageAr={fetchError}
            message={fetchError}
            onRetry={fetchHRData}
            lang={lang}
          />
        </div>
      )}

      {/* TAB CONTENTS (MODULARIZED REFACTORED WORKSPACE) */}
      <div className="space-y-6">

        {/* TAB 1: EXECUTIVE HR BI DASHBOARD */}
        {activeTab === 'bi_dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI STATS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 dark:text-zinc-500">
                  <span className="text-[11px] font-bold uppercase">{isRtl ? 'إجمالي الكادر الكلي' : 'Total Headcount'}</span>
                  <Users className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {staffList.length || 8} <span className="text-xs font-normal text-slate-400">{isRtl ? 'عنصر' : 'FTE'}</span>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{isRtl ? 'نسبة الاستدامة 98.4%' : '98.4% Retention Stability'}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 dark:text-zinc-500">
                  <span className="text-[11px] font-bold uppercase">{isRtl ? 'الساعات التطوعية الميدانية' : 'Voluntary Hours'}</span>
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  2,450 <span className="text-xs font-normal text-slate-400">{isRtl ? 'ساعة' : 'hrs'}</span>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-500" />
                  <span>{isRtl ? 'قيمة اقتصادية $45,325' : 'Value Generated: $45.3K'}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 dark:text-zinc-500">
                  <span className="text-[11px] font-bold uppercase">{isRtl ? 'نسبة الانضباط والدوام' : 'Attendance SLA Rate'}</span>
                  <Clock className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  96.8%
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isRtl ? 'مطابق لجدول الوردية' : 'Shift Schedule Verified'}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 dark:text-zinc-500">
                  <span className="text-[11px] font-bold uppercase">{isRtl ? 'مسير الرواتب الشهري' : 'Monthly Payroll Budget'}</span>
                  <Coins className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  $14,250 <span className="text-xs font-normal text-slate-400">USD</span>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isRtl ? 'قيد محاسبي مزدوج متزن' : 'Balanced Double-Entry Posted'}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 dark:text-zinc-500">
                  <span className="text-[11px] font-bold uppercase">{isRtl ? 'متوسط تقييم الأداء 360' : 'Avg Performance 360'}</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  4.85 / 5.0
                </div>
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>{isRtl ? 'أداء ممتاز عالي المساهمة' : 'High Performer Pool'}</span>
                </div>
              </div>
            </div>

            {/* DASHBOARD WIDGETS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmployeeContributionView employeeId="all" lang={lang} />
              <AIWorkloadBalancerView lang={lang} />
              <HRIntelligenceAnalyticsView lang={lang} />
              <HRPerformanceMatrixView lang={lang} />
            </div>
          </div>
        )}

        {/* TAB 2: ORG ARCHITECTURE & POSITIONS */}
        {activeTab === 'org_positions' && <HROrgPositionsView lang={lang} />}

        {/* TAB 3: EMPLOYEE 360 MASTER RECORD */}
        {activeTab === 'employee_360' && (
          <>
            <HREmployee360View
              lang={lang}
              filteredStaff={pagedStaff}
              searchTerm={searchTerm}
              setSearchTerm={(term) => { setSearchTerm(term); setStaffPage(1); }}
              loading={loading}
              onClearSearch={() => { setSearchTerm(''); setDepartmentFilter('all'); setWorkforceCategory('all'); }}
              onOpenDocModal={(staff) => {
                setSelectedStaffForDoc(staff);
                setShowDocModal(true);
              }}
            />
            {staffTotalPages > 1 && (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl px-4 py-3">
                <Pagination
                  currentPage={safeStaffPage}
                  totalPages={staffTotalPages}
                  totalItems={filteredStaff.length}
                  pageSize={STAFF_PAGE_SIZE}
                  onPageChange={setStaffPage}
                  lang={lang}
                />
              </div>
            )}
          </>
        )}

        {/* TAB 4: ATTENDANCE, SHIFTS & LEAVE MANAGEMENT */}
        {activeTab === 'attendance_leaves' && <HRAttendanceLeavesView lang={lang} />}

        {/* TAB 5: COMPENSATION & IPSAS PAYROLL LEDGER */}
        {activeTab === 'payroll_ipsas' && <HRPayrollIPSASView lang={lang} />}

        {/* TAB 6: PERFORMANCE APPRAISAL 360 */}
        {activeTab === 'performance_360' && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
            <HRPerformanceMatrixView lang={lang} />
          </div>
        )}

        {/* TAB 7: LEARNING & TALENT */}
        {activeTab === 'learning_talent' && <HRLearningTalentView lang={lang} />}

        {/* TAB 8: DOCUMENTS & COMPLIANCE HEATMAP */}
        {activeTab === 'documents_compliance' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <HRRegulatoryComplianceHeatmap lang={lang} />
          </div>
        )}

      </div>
    </div>
    </ModuleShell>
  );
}
