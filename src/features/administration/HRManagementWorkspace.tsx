import React, { useState, useEffect } from 'react';
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
  Heart
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

  // Security State
  const [securityLevel] = useState(3);
  const [userRole] = useState('admin');

  // Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedStaffForDoc, setSelectedStaffForDoc] = useState<any>(null);

  // Master HR Data State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch HR Master Data from Neon PostgreSQL API
  const fetchHRData = async () => {
    setLoading(true);
    try {
      const staffRes = await fetch('/api/tables/hr_staff');
      const staffData = staffRes.ok ? await staffRes.json() : [];
      setStaffList(staffData);
    } catch (e) {
      console.error('Failed to fetch HR master data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  // Filtered staff list with workforce category filter
  const filteredStaff = staffList.filter(staff => {
    const nameMatch = (staff.full_name_ar || staff.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const deptMatch = departmentFilter === 'all' || staff.department_code === departmentFilter;
    const catMatch = workforceCategory === 'all' || staff.employment_type === workforceCategory;
    return nameMatch && deptMatch && catMatch;
  });

  return (
    <ModuleShell
      titleAr="إدارة الموارد البشرية"
      titleEn="HR Management"
      domainCode="NEB-09"
      icon={Users}
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
            onClick={fetchHRData}
            disabled={loading}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isRtl ? 'تحديث البيانات' : 'Refresh Data'}</span>
          </button>

          <PolicyButton
            action="create"
            domain="hr"
            securityLevel={securityLevel}
            userRole={userRole}
            onClick={() => alert(isRtl ? 'فتح نافذة تعيين موظف جديد' : 'New Employee Onboarding Modal')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'تعيين موظف / متطوع' : 'Onboard Workforce'}</span>
          </PolicyButton>
        </div>
      </div>

      {/* WORKFORCE CATEGORY SELECTOR BAR */}
      <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4 overflow-x-auto text-xs font-bold">
        <div className="flex items-center gap-2 shrink-0 text-slate-500 dark:text-zinc-400">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>{isRtl ? 'تصنيف القوى العاملة:' : 'Workforce Tier:'}</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', ar: 'الكل (جميع الفئات)', en: 'All Categories' },
            { id: 'permanent', ar: '👔 كادر دائم (Core FTE)', en: 'Permanent Staff' },
            { id: 'volunteer', ar: '🤝 متطوعون ميدانيون', en: 'Volunteers' },
            { id: 'cooperator', ar: '🛠️ متعاونون بأجر يومي', en: 'Cooperators / Daily' },
            { id: 'delegate', ar: '🌐 مندوبو المحافظات', en: 'Field Delegates' },
            { id: 'consultant', ar: '💼 استشاريون وخبراء', en: 'External Consultants' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setWorkforceCategory(cat.id as WorkforceCategory)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                workforceCategory === cat.id
                  ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800/80'
              }`}
            >
              {isRtl ? cat.ar : cat.en}
            </button>
          ))}
        </div>
      </div>

      {/* ENTERPRISE 8-DOMAIN CAPABILITY TABS */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800/80 p-1.5 rounded-2xl overflow-x-auto custom-scrollbar text-xs font-bold select-none">
        {[
          { id: 'bi_dashboard', icon: BarChart3, ar: 'لوحة القيادة BI', en: 'HR BI Dashboard' },
          { id: 'org_positions', icon: Building2, ar: 'الهيكل والوظائف', en: 'Org Architecture' },
          { id: 'employee_360', icon: Users, ar: 'سجل الموظف 360', en: 'Employee 360' },
          { id: 'attendance_leaves', icon: Clock, ar: 'الدوام والإجازات', en: 'Time & Leave' },
          { id: 'payroll_ipsas', icon: Coins, ar: 'المرتبات IPSAS', en: 'IPSAS Payroll' },
          { id: 'performance_360', icon: Award, ar: 'تقييم الأداء 360', en: 'Performance 360' },
          { id: 'learning_talent', icon: BookOpen, ar: 'التدريب والموهبة', en: 'L&D & Talent' },
          { id: 'documents_compliance', icon: ShieldCheck, ar: 'الأرشيف والامتثال', en: 'Docs & Compliance' },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as HRTab)}
              className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-950/20'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-500'}`} />
              <span>{isRtl ? tab.ar : tab.en}</span>
            </button>
          );
        })}
      </div>

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
                  <span>{isRtl ? 'قيد متزن IPSAS' : 'IPSAS Double-Entry Posted'}</span>
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
          <HREmployee360View
            lang={lang}
            filteredStaff={filteredStaff}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onOpenDocModal={(staff) => {
              setSelectedStaffForDoc(staff);
              setShowDocModal(true);
            }}
          />
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
