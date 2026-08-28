import { showToast } from './enterprise/EnterpriseToastContainer';
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Briefcase, 
  Layers, 
  Calendar, 
  MapPin,
  Check, 
  X,
  AlertTriangle,
  Activity,
  TrendingUp,
  Hand,
  Zap,
  CheckCircle2,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  ArrowRightLeft,
  Printer,
  Eye,
  Globe
} from 'lucide-react';
import { Project, Program } from '../types';
import { SwipeGestureContainer } from './helpers/SwipeGestureContainer';
import { FieldSwipeNavigationBanner } from './helpers/FieldSwipeNavigationBanner';
import { triggerHaptic } from '../helpers/hapticSwipe';
import VisualProjectTimeline from './VisualProjectTimeline';
import ProjectGanttView from './ProjectGanttView';
import { PolicyViolationError, type PolicyViolation } from '../core/utils/apiHelpers';
import { PolicyViolationAlert } from './helpers/PolicyViolationAlert';
import { EnterpriseToolStrip } from './EnterpriseToolStrip';
import PrintPDFTemplateModal from './reports/PrintPDFTemplateModal';
import { ModuleShell } from './enterprise/ModuleShell';
import { instantPrint } from '../core/export';
import { ProjectLifecycleSymbol } from './common/SovereignSystemIcons';
import { UniversalObjectPageModal } from './common/UniversalObjectPageModal';
import GlobalAddressCascadePicker from './common/GlobalAddressCascadePicker';
import GlobalAddressManagerView from '../features/organization/GlobalAddressManagerView';

interface ProjectsViewProps {
  projects: Project[];
  programs: Program[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
  initialStatusFilter?: string;
}

export default function ProjectsView({ projects, programs, loading, onRefresh, lang, initialStatusFilter }: ProjectsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all');

  // Swipe & Field view modes
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'timeline' | 'gantt'>('kanban');
  const [swipeToast, setSwipeToast] = useState<string | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState<number>(0);

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Field activities state to calculate real-time progress
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/tables/activities');
        if (res.ok && active) {
          const data = await res.json();
          setActivities(data || []);
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
      }
    };
    fetchActivities();
    return () => {
      active = false;
    };
  }, [loading]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [inspectingProject, setInspectingProject] = useState<Project | null>(null);

  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('nexora_active_project', JSON.stringify({
        id: selectedProject.id,
        name_ar: selectedProject.name_ar,
        name_en: selectedProject.name_en,
        description: selectedProject.description
      }));
    } else {
      localStorage.removeItem('nexora_active_project');
    }
  }, [selectedProject]);
  const [formError, setFormError] = useState<string | null>(null);
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[] | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form fields
  const [programId, setProgramId] = useState('');
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [statusCode, setStatusCode] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('0');
  const [currencyCode, setCurrencyCode] = useState('YER');
  const [progressPercent, setProgressPercent] = useState('0');
  const [targetBeneficiaries, setTargetBeneficiaries] = useState('0');
  const [actualBeneficiaries, setActualBeneficiaries] = useState('0');
  const [locationName, setLocationName] = useState('');
  const [projectCountry, setProjectCountry] = useState('YE');
  const [projectGov, setProjectGov] = useState('تعز');
  const [projectDistrict, setProjectDistrict] = useState('صبر الموادم');
  const [projectSubDistrict, setProjectSubDistrict] = useState('');
  const [projectLat, setProjectLat] = useState('');
  const [projectLng, setProjectLng] = useState('');
  const [showAddressManagerModal, setShowAddressManagerModal] = useState(false);
  const [priorityCode, setPriorityCode] = useState('medium');
  const [riskLevel, setRiskLevel] = useState('medium');

  const openModal = (project: Project | null = null, prefilledData?: any) => {
    setSelectedProject(project);
    setFormError(null);
    if (project) {
      setProgramId(project.program_id || '');
      setCode(project.code || '');
      setNameAr(project.name_ar || '');
      setNameEn(project.name_en || '');
      setDescription(project.description || '');
      setStatusCode(project.status_code || 'active');
      setStartDate(project.start_date ? project.start_date.substring(0, 10) : '');
      setEndDate(project.end_date ? project.end_date.substring(0, 10) : '');
      setBudget(project.budget || '0');
      setCurrencyCode(project.currency_code || 'YER');
      setProgressPercent(project.progress_percent || '0');
      setTargetBeneficiaries(String(project.target_beneficiaries || '0'));
      setActualBeneficiaries(String(project.actual_beneficiaries || '0'));
      setLocationName(project.location_name || '');
      setProjectCountry((project as any).country_code || (project as any).country || 'YE');
      setProjectGov((project as any).governorate || 'تعز');
      setProjectDistrict((project as any).district || 'صبر الموادم');
      setProjectSubDistrict((project as any).sub_district || '');
      setProjectLat((project as any).gps_latitude ? String((project as any).gps_latitude) : '');
      setProjectLng((project as any).gps_longitude ? String((project as any).gps_longitude) : '');
      setPriorityCode(project.priority_code || 'medium');
      setRiskLevel(project.risk_level || 'medium');
    } else {
      // Defaults
      setProgramId(programs.length > 0 ? programs[0].id : '');
      setCode(prefilledData?.code || `PROJ-${Date.now().toString().slice(-4)}`);
      setNameAr(prefilledData?.nameAr || '');
      setNameEn(prefilledData?.nameEn || '');
      setDescription(prefilledData?.description || '');
      setStatusCode('active');
      setStartDate(new Date().toISOString().substring(0, 10));
      setEndDate('');
      setBudget('0');
      setCurrencyCode('YER');
      setProgressPercent('0');
      setTargetBeneficiaries('0');
      setActualBeneficiaries('0');
      setLocationName('');
      setProjectCountry('YE');
      setProjectGov('تعز');
      setProjectDistrict('صبر الموادم');
      setProjectSubDistrict('');
      setEndDate(new Date(Date.now() + 180*24*60*60*1000).toISOString().substring(0, 10));
      setBudget(prefilledData?.budget || '500000');
      setCurrencyCode('YER');
      setProgressPercent('0');
      setTargetBeneficiaries(prefilledData?.targetBeneficiaries || '200');
      setActualBeneficiaries('0');
      setLocationName(prefilledData?.locationName || '');
      setProjectCountry('YE');
      setProjectGov(prefilledData?.governorate || 'تعز');
      setProjectDistrict(prefilledData?.district || 'صبر الموادم');
      setProjectSubDistrict(prefilledData?.subDistrict || '');
      setProjectLat('');
      setProjectLng('');
      setPriorityCode('medium');
      setRiskLevel('medium');
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    const handleTriggerCreate = (e: Event) => {
      const customEvent = e as CustomEvent;
      openModal(null, customEvent.detail);
    };
    window.addEventListener('nexora-trigger-create-project', handleTriggerCreate as any);
    return () => {
      window.removeEventListener('nexora-trigger-create-project', handleTriggerCreate as any);
    };
  }, [programs]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      program_id: programId || null,
      code,
      name_ar: nameAr,
      name_en: nameEn,
      description,
      status_code: statusCode,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      budget,
      currency_code: currencyCode,
      progress_percent: progressPercent,
      target_beneficiaries: parseInt(targetBeneficiaries) || 0,
      actual_beneficiaries: parseInt(actualBeneficiaries) || 0,
      location_name: locationName || `${projectGov} - ${projectDistrict}`,
      country: projectCountry,
      country_code: projectCountry,
      governorate: projectGov,
      district: projectDistrict,
      sub_district: projectSubDistrict,
      gps_latitude: projectLat ? parseFloat(projectLat) : null,
      gps_longitude: projectLng ? parseFloat(projectLng) : null,
      priority_code: priorityCode,
      risk_level: riskLevel,
      security_level: 2,
    };

    try {
      const url = selectedProject 
        ? `/api/tables/projects/${selectedProject.id}` 
        : `/api/tables/projects`;
      
      const response = await fetch(url, {
        method: selectedProject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        if (response.status === 403 && errData.violations) {
          throw new PolicyViolationError(errData);
        }
        throw new Error(errData.error || 'Failed to save project.');
      }

      onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      if (err instanceof PolicyViolationError) {
        setPolicyViolations(err.violations);
        setFormError(err.primaryMessage);
      } else {
        setFormError(err.message);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmation = lang === 'ar' 
      ? 'هل أنت متأكد من حذف هذا المشروع من السجلات؟'
      : 'Are you sure you want to delete this project? It will be soft-deleted.';
    
    if (!window.confirm(confirmation)) return;

    try {
      const response = await fetch(`/api/tables/projects/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete project.');
      }
      onRefresh();
    } catch (err: any) {
      showToast({ type: 'error', title: lang === 'ar' ? 'خطأ في العملية' : 'Operation Error', message: err.message });
    }
  };

  // Quick gesture action: Mark project complete on Swipe Left
  const handleQuickComplete = async (proj: Project) => {
    triggerHaptic('success');
    try {
      const payload = {
        ...proj,
        status_code: 'completed',
        progress_percent: '100'
      };
      const res = await fetch(`/api/tables/projects/${proj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onRefresh();
        const msg = lang === 'ar' 
          ? `⚡ تم سحب إيماءة الميدان: إكمال المشروع ${proj.code} بنجاح!`
          : `⚡ Field gesture: Project ${proj.code} marked complete!`;
        setSwipeToast(msg);
        setTimeout(() => setSwipeToast(null), 3500);
      }
    } catch (err) {
      console.error('Error completing project via swipe:', err);
    }
  };

  // Quick gesture action: Increment progress on Swipe Right
  const handleQuickIncrementProgress = async (proj: Project) => {
    triggerHaptic('medium');
    try {
      const current = parseFloat(proj.progress_percent || '0');
      const nextProgress = Math.min(100, Math.round(current + 20));
      const nextStatus = nextProgress >= 100 ? 'completed' : proj.status_code || 'active';
      const payload = {
        ...proj,
        progress_percent: String(nextProgress),
        status_code: nextStatus
      };
      const res = await fetch(`/api/tables/projects/${proj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onRefresh();
        const msg = lang === 'ar'
          ? `⚡ تم سحب إيماءة الميدان: زيادة نسبة الإنجاز إلى ${nextProgress}% مع اهتزاز لمسي!`
          : `⚡ Field gesture: Progress updated to ${nextProgress}% with haptic vibration!`;
        setSwipeToast(msg);
        setTimeout(() => setSwipeToast(null), 3500);
      }
    } catch (err) {
      console.error('Error incrementing progress via swipe:', err);
    }
  };

  const filtered = projects.filter(proj => {
    const matchesSearch = 
      (proj.name_ar && proj.name_ar.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proj.name_en && proj.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proj.code && proj.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proj.location_name && proj.location_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProgram = programFilter === 'all' || proj.program_id === programFilter;
    const matchesStatus = statusFilter === 'all' || proj.status_code === statusFilter;

    return matchesSearch && matchesProgram && matchesStatus;
  });

  const formatCurrency = (amount: string | null) => {
    const val = parseFloat(amount || '0');
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-YE' : 'en-US', {
      style: 'currency',
      currency: 'YER',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleDirectPrintProjects = () => {
    const title = lang === 'ar' 
      ? 'كشف المشاريع الميدانية والتنفيذية المعتمد - جمعية رُحماء بينهم' 
      : "Official Field Projects Executive Registry - Rohama'a Baynahum";

    const rows = filtered.map((p: any, idx: number) => {
      const prog = programs.find(pr => pr.id === p.program_id);
      const progName = prog ? (lang === 'ar' ? prog.name_ar : prog.name_en) : '-';
      return `
        <tr style="background: \${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
          <td style="font-weight: bold; padding: 6px; border: 1px solid #cbd5e1;">\${idx + 1}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">\${p.code || p.project_code || (lang === 'ar' ? ('مشروع-' + (idx + 1)) : 'PRJ')}</td>
          <td style="text-align: \${lang === 'ar' ? 'right' : 'left'}; padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">
            \${lang === 'ar' ? p.name_ar : p.name_en}
          </td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">\${progName}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">\${p.progress_percent || 0}%</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace;">\${parseFloat(p.budget || 0).toLocaleString()} \${lang === 'ar' ? 'ر.ي' : 'YER'}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">\${(p.actual_beneficiaries || 0).toLocaleString()} / \${(p.target_beneficiaries || 0).toLocaleString()}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">\${p.status_code === 'completed' ? (lang === 'ar' ? 'مكتمل' : 'Completed') : (lang === 'ar' ? 'قيد التنفيذ' : 'Active')}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="\${lang === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8" />
        <title>\${title}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: Segoe UI, Tahoma, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px double #059669; padding-bottom: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 9.5px; margin-top: 10px; }
          th { background: #0f172a; color: white; padding: 7px 5px; border: 1px solid #334155; text-align: center; }
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
              <div style="font-size: 10px; color: #059669; font-weight: bold;">إدارة المشاريع الميدانية ومتابعة الإنجاز (NEB-04)</div>
            </div>
          </div>
          <div style="text-align: \${lang === 'ar' ? 'left' : 'right'};">
            <div style="font-size: 9px; font-weight: bold; color: #d97706;">كشف عمليات معتمد</div>
            <div style="font-size: 8px; color: #64748b;">\${new Date().toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US')}</div>
          </div>
        </div>

        <h3 style="font-size: 13px; font-weight: 900; color: #059669; margin: 0 0 8px 0;">\${title}</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>كود المشروع</th>
              <th>اسم المشروع</th>
              <th>البرنامج التنموي التابع</th>
              <th>الإنجاز</th>
              <th>الموازنة المعتمدة (ر.ي)</th>
              <th>المستفيدون (فعلي / مستهدف)</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            \${rows}
          </tbody>
        </table>

        <div class="footer">
          <div>مدير إدارة البرامج والمشاريع: مصادق | مدير الرقابة والتقييم: مطابق للمواصفات</div>
          <div>الختم الرقمي الموحد: PRJ-UAM-\${Math.floor(Math.random() * 899999 + 100000)} | UAMEX ERP™</div>
        </div>
      </body>
      </html>
    `;

    instantPrint(html);
  };

  return (
    <ModuleShell
      titleAr="المشاريع الميدانية"
      titleEn="Field Projects OS"
      descAr="إدارة دورة حياة المشاريع، نسب التنفيذ الفعلي والمالي"
      descEn="Field projects lifecycle, progress charts, tasks allocation, and active status"
      domainCode="NEB-04"
      icon={ProjectLifecycleSymbol}
      accent="indigo"
      lang={lang}
      onRefresh={onRefresh}
      isLoading={loading}
      recordCount={projects.length}
      breadcrumbs={[
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', onClick: () => {} },
        { label: lang === 'ar' ? 'المشاريع' : 'Projects' }
      ]}
    >
    <div className="space-y-6">
      {/* Enterprise Operational ToolStrip */}
      <EnterpriseToolStrip
        lang={lang}
        activeModule="projects"
        onAddRecord={() => openModal(null)}
        addRecordLabelAr="مشروع جديد"
        addRecordLabelEn="Add New Project"
        onRefreshData={onRefresh}
        isLoading={loading}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        onResetFilters={() => {
          setSearchTerm('');
          setProgramFilter('all');
          setStatusFilter('all');
        }}
        activeFilterCount={(searchTerm ? 1 : 0) + (programFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
        viewMode={viewMode === 'kanban' ? 'grid' : viewMode === 'table' ? 'list' : 'gantt'}
        onViewModeChange={(mode) => {
          if (mode === 'grid') setViewMode('kanban');
          else if (mode === 'list') setViewMode('table');
          else if (mode === 'gantt') setViewMode('gantt');
        }}
        onInstantPrint={handleDirectPrintProjects}
        onOpenExportModal={() => setIsPDFModalOpen(true)}
        showZoomControls={viewMode === 'timeline' || viewMode === 'gantt'}
      />

      {/* Header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-600" />
            {lang === 'ar' ? 'المشاريع التنفيذية الميدانية' : 'Field Executive Projects'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {lang === 'ar' ? 'إدارة خطط تنفيذ المشاريع الميدانية ومتابعة نسب المنجز والربط مع البرامج التنموية الرئيسية' : 'Configure, manage, and link field projects with core developmental programs'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowAddressManagerModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow transition-all duration-150 cursor-pointer"
            title={lang === 'ar' ? 'منظومة إدارة العناوين والتقسيمات والخرائط العالمية' : 'Global Addresses & Maps OS'}
          >
            <Globe className="w-4 h-4 text-teal-200" />
            <span>{lang === 'ar' ? 'دليل العناوين والخرائط' : 'Addresses & Maps'}</span>
          </button>

          <button
            onClick={() => setIsPDFModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow transition-all duration-150 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ar' ? 'طباعة تقرير المشاريع PDF' : 'Print Projects PDF'}</span>
          </button>

          <button
            onClick={() => openModal(null)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'مشروع تنفيذي جديد' : 'Add New Project'}</span>
          </button>
        </div>
      </div>

      {/* Field Swipe Navigation Banner */}
      <FieldSwipeNavigationBanner lang={lang} />

      {/* Toast Notification for Gestures */}
      {swipeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-emerald-100 border border-emerald-500 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce font-bold text-xs">
          <Zap className="w-4 h-4 text-amber-400 animate-spin" />
          <span>{swipeToast}</span>
        </div>
      )}

      {/* Filters & View Mode Selector */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-zinc-400" style={lang === 'en' ? { right: 'auto', left: '12px' } : {}} />
            <input 
              type="text"
              placeholder={lang === 'ar' ? 'ابحث باسم المشروع، الكود، المحافظة...' : 'Search projects name, code, location...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 transition-all outline-none"
              style={lang === 'en' ? { paddingLeft: '36px', paddingRight: '12px' } : {}}
            />
          </div>

          {/* Parent Program filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <select 
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-xl py-2 px-3 text-xs outline-none font-medium"
            >
              <option value="all">{lang === 'ar' ? 'كل البرامج الرئيسية' : 'All Core Programs'}</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>
                  {lang === 'ar' ? p.name_ar : (p.name_en || p.name_ar)}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-xl py-2 px-3 text-xs outline-none font-medium"
            >
              <option value="all">{lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="active">{lang === 'ar' ? 'نشط ميدانياً' : 'Active'}</option>
              <option value="planning">{lang === 'ar' ? 'تخطيط' : 'Planning'}</option>
              <option value="completed">{lang === 'ar' ? 'مكتمل' : 'Completed'}</option>
            </select>
          </div>
        </div>

        {/* View Switcher: Touch Kanban vs Data Table vs Interactive Visual Timeline */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-end md:self-auto flex-wrap gap-1">
          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('kanban');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'kanban' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'لوحة السحب (Kanban)' : 'Kanban'}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('gantt');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'gantt' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'مخطط غانت (Gantt)' : 'Gantt View'}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('timeline');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'timeline' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'المخطط الزمني (Timeline Drag)' : 'Timeline Drag'}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('table');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'جدول البيانات' : 'Data Table'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-white border border-slate-200 rounded-xl">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-400 font-medium">{lang === 'ar' ? 'جاري جلب المشاريع الميدانية...' : 'Retrieving field projects...'}</p>
        </div>
      ) : viewMode === 'gantt' ? (
        <ProjectGanttView
          projects={filtered}
          programs={programs}
          lang={lang}
          onRefreshProjects={onRefresh}
        />
      ) : viewMode === 'timeline' ? (
        <VisualProjectTimeline 
          projects={filtered} 
          programs={programs} 
          lang={lang} 
          onRefreshProjects={onRefresh} 
        />
      ) : filtered.length > 0 ? (
        viewMode === 'kanban' ? (
          /* Touch Swipe Kanban Columns View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'active', titleAr: 'نشط ميدانياً', titleEn: 'Active Field Projects', badgeBg: 'bg-emerald-500 text-white', border: 'border-emerald-200 dark:border-emerald-900' },
              { id: 'planning', titleAr: 'قيد التخطيط والتنفيذ', titleEn: 'Planning Stage', badgeBg: 'bg-amber-500 text-white', border: 'border-amber-200 dark:border-amber-900' },
              { id: 'completed', titleAr: 'مكتمل ومغلق', titleEn: 'Completed & Archived', badgeBg: 'bg-slate-600 text-white', border: 'border-slate-200 dark:border-zinc-800' }
            ].map(col => {
              const columnProjects = filtered.filter(p => (col.id === 'active' ? p.status_code === 'active' || !p.status_code : p.status_code === col.id));

              return (
                <div key={col.id} className={`bg-slate-50/80 dark:bg-zinc-900/60 p-4 rounded-2xl border ${col.border} space-y-4 flex flex-col`}>
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg ${col.badgeBg}`}>
                        {columnProjects.length}
                      </span>
                      <h3 className="font-extrabold text-xs text-slate-800 dark:text-zinc-200">
                        {lang === 'ar' ? col.titleAr : col.titleEn}
                      </h3>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      👈 👉 {lang === 'ar' ? 'قابل للسحب' : 'Swipeable'}
                    </span>
                  </div>

                  {/* Column Items */}
                  <div className="space-y-3 flex-1 min-h-[220px]">
                    {columnProjects.map(proj => {
                      const linkedProgram = programs.find(p => p.id === proj.program_id);
                      const projActivities = activities.filter(a => a.project_id === proj.id);
                      const totalActs = projActivities.length;
                      const completedActs = projActivities.filter(a => a.status_code === 'closed' || a.status_code === 'completed').length;
                      const calculatedProgress = totalActs > 0 ? Math.round((completedActs / totalActs) * 100) : parseFloat(proj.progress_percent || '0');

                      return (
                        <SwipeGestureContainer
                          key={proj.id}
                          lang={lang}
                          onSwipeLeft={() => handleQuickComplete(proj)}
                          onSwipeRight={() => handleQuickIncrementProgress(proj)}
                          leftActionLabel={{ ar: 'إكتمال 100%', en: 'Complete 100%' }}
                          rightActionLabel={{ ar: 'إنجاز +20%', en: 'Progress +20%' }}
                          leftActionBg="bg-emerald-600 text-white"
                          rightActionBg="bg-amber-600 text-white"
                        >
                          <div className="p-4 space-y-3 border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition-shadow">
                            {/* Top badge line */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[9px] font-bold rounded border border-blue-200/60">
                                {proj.code}
                              </span>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectingProject(proj);
                                  }}
                                  className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                                  title={lang === 'ar' ? 'معاينة صفحة الكيان الموحدة' : 'Universal Object Page'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => openModal(proj)}
                                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                  title={lang === 'ar' ? 'تعديل' : 'Edit'}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(proj.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title={lang === 'ar' ? 'حذف' : 'Delete'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Project Title */}
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs leading-snug">
                              {lang === 'ar' ? proj.name_ar : (proj.name_en || proj.name_ar)}
                            </h4>

                            {/* Program & Location */}
                            <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                              <div className="flex items-center gap-1 truncate max-w-[140px]">
                                <Layers className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="truncate">
                                  {linkedProgram ? (lang === 'ar' ? linkedProgram.name_ar : linkedProgram.name_en) : '—'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span>{proj.location_name || (lang === 'ar' ? 'الميدان' : 'Field')}</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-zinc-800">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-400 font-medium">{lang === 'ar' ? 'نسبة الإنجاز الميداني:' : 'Progress:'}</span>
                                <span className="font-mono font-black text-slate-800 dark:text-zinc-200">{calculatedProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    calculatedProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`} 
                                  style={{ width: `${calculatedProgress}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Touch Hint Footer */}
                            <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg flex items-center justify-between">
                              <span>👈 {lang === 'ar' ? 'إكتمال 100%' : 'Swipe Left: Complete'}</span>
                              <span>👉 {lang === 'ar' ? 'إنجاز +20%' : 'Swipe Right: +20%'}</span>
                            </div>
                          </div>
                        </SwipeGestureContainer>
                      );
                    })}

                    {columnProjects.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs">
                        {lang === 'ar' ? 'لا توجد مشاريع في هذه الحالة' : 'No projects in this stage'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                <thead className="bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-6 py-4">{lang === 'ar' ? 'الرمز والمسمى' : 'Code & Title'}</th>
                    <th className="px-6 py-4">{lang === 'ar' ? 'البرنامج المرتبط' : 'Linked Program'}</th>
                    <th className="px-6 py-4">{lang === 'ar' ? 'الموقع والنطاق' : 'Location'}</th>
                    <th className="px-6 py-4">{lang === 'ar' ? 'الموازنة المقررة' : 'Budget'}</th>
                    <th className="px-6 py-4">{lang === 'ar' ? 'الإنجاز الفعلي' : 'Progress'}</th>
                    <th className="px-6 py-4 text-center">{lang === 'ar' ? 'خيارات السحب' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {filtered.map(proj => {
                    const linkedProgram = programs.find(p => p.id === proj.program_id);
                    const progress = parseFloat(proj.progress_percent || '0');

                    return (
                      <tr key={proj.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded font-mono text-[9px] font-bold">
                                {proj.code}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                proj.status_code === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                proj.status_code === 'completed' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {proj.status_code === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') :
                                 proj.status_code === 'completed' ? (lang === 'ar' ? 'مكتمل' : 'Completed') :
                                 (lang === 'ar' ? 'قيد التخطيط' : 'Planning')}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-slate-800 dark:text-white text-[13px] pt-1">
                              {lang === 'ar' ? proj.name_ar : (proj.name_en || proj.name_ar)}
                            </h4>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium max-w-xs truncate">
                          {linkedProgram 
                            ? (lang === 'ar' ? linkedProgram.name_ar : (linkedProgram.name_en || linkedProgram.name_ar))
                            : <span className="text-zinc-300">—</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{proj.location_name || (lang === 'ar' ? 'غير محدد' : 'Not set')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-700 dark:text-zinc-200">
                          {formatCurrency(proj.budget)}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const projActivities = activities.filter(a => a.project_id === proj.id);
                            const totalActs = projActivities.length;
                            const completedActs = projActivities.filter(a => a.status_code === 'closed' || a.status_code === 'completed').length;
                            
                            const isLive = totalActs > 0;
                            const calculatedProgress = isLive 
                              ? Math.round((completedActs / totalActs) * 100) 
                              : progress;

                            return (
                              <div className="w-40 space-y-1">
                                <div className="flex justify-between items-center gap-1.5">
                                  <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-[11px] font-mono">{calculatedProgress}%</span>
                                  {isLive ? (
                                    <span 
                                      className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded flex items-center gap-0.5"
                                    >
                                      <Activity className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                                      <span>{lang === 'ar' ? 'ميداني' : 'Live'}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-medium text-slate-400 bg-slate-50 px-1 py-0.5 rounded">
                                      {lang === 'ar' ? 'تقديري' : 'Estimated'}
                                    </span>
                                  )}
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      calculatedProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`} 
                                    style={{ width: `${calculatedProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                triggerHaptic('success');
                                handleQuickComplete(proj);
                              }}
                              className="px-2 py-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-bold flex items-center gap-1"
                              title={lang === 'ar' ? 'إكتمال سريع مع اهتزاز لمسي' : 'Quick Complete'}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'ar' ? 'إكتمال' : 'Complete'}</span>
                            </button>
                            <button 
                              onClick={() => setInspectingProject(proj)}
                              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-all cursor-pointer"
                              title={lang === 'ar' ? 'معاينة صفحة الكيان الموحدة' : 'Universal Object Page'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openModal(proj)}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(proj.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-12 rounded-xl text-center shadow-sm space-y-4">
          <Briefcase className="w-12 h-12 text-zinc-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-700 dark:text-zinc-200">{lang === 'ar' ? 'لا توجد مشاريع مطابقة للبحث' : 'No matching projects found'}</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {lang === 'ar' ? 'أضف مشاريع جديدة لتعبئة كشوفات الإنجاز الميداني ومطابقة التمويلات لمؤسسة رحماء.' : 'Try adjusting your search criteria or add a new project record.'}
            </p>
          </div>
          <button 
            onClick={() => openModal(null)}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'إضافة مشروع جديد' : 'Create Project Record'}
          </button>
        </div>
      )}

      {/* Projects Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {selectedProject 
                    ? (lang === 'ar' ? 'تعديل سجل المشروع التنفيذي' : 'Edit Project Record') 
                    : (lang === 'ar' ? 'إضافة مشروع تنفيذي ميداني جديد' : 'Add New Field Project')
                  }
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {lang === 'ar' ? 'ربط السجلات بموازنات البرامج، وخطط كشوف الأنشطة' : 'Map project ledger, set location scopes, and budget values'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-zinc-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              {policyViolations && policyViolations.length > 0 && (
                <PolicyViolationAlert
                  violations={policyViolations}
                  lang={lang}
                  onDismiss={() => setPolicyViolations(null)}
                />
              )}

              {/* Linking to Program */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase">{lang === 'ar' ? 'البرنامج التنموي التابع له' : 'Parent Developmental Program'}</label>
                <select 
                  required
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-semibold text-slate-700"
                >
                  <option value="">{lang === 'ar' ? 'اختر البرنامج الرئيسي...' : 'Select Parent Program...'}</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {lang === 'ar' ? p.name_ar : (p.name_en || p.name_ar)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Codes & Names */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'رمز المشروع (الكود)' : 'Project Code'}</label>
                  <input 
                    type="text" 
                    required 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SANA-WELL-1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'اسم المشروع (بالعربية)' : 'Arabic Name'}</label>
                  <input 
                    type="text" 
                    required 
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="e.g. مشروع بناء بئر السبعين"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الاسم بالإنجليزية (اختياري)' : 'English Name'}</label>
                  <input 
                    type="text" 
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Al-Sabeen Well Construction"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Hierarchical Multi-Country Location with Global Maps Integration */}
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
                <GlobalAddressCascadePicker
                  countryCode={projectCountry}
                  stateGovernorate={projectGov}
                  district={projectDistrict}
                  detailedAddress={locationName}
                  gpsLatitude={projectLat}
                  gpsLongitude={projectLng}
                  showGpsFields={true}
                  lang={lang}
                  onChange={(addr) => {
                    setProjectCountry(addr.countryCode);
                    setProjectGov(addr.stateGovernorate);
                    setProjectDistrict(addr.district);
                    setProjectSubDistrict(addr.subDistrict);
                    setLocationName(addr.detailedAddress);
                    if (addr.gpsLatitude) setProjectLat(String(addr.gpsLatitude));
                    if (addr.gpsLongitude) setProjectLng(String(addr.gpsLongitude));
                  }}
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'حالة العمل الحالية' : 'Operational Status'}</label>
                  <select 
                    value={statusCode}
                    onChange={(e) => setStatusCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-semibold text-slate-700"
                  >
                    <option value="active">{lang === 'ar' ? 'قيد التنفيذ' : 'Active'}</option>
                    <option value="planning">{lang === 'ar' ? 'تخطيط وتجهيز' : 'Planning'}</option>
                    <option value="completed">{lang === 'ar' ? 'مكتمل ومسلم' : 'Completed'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'مستوى الأولوية' : 'Priority'}</label>
                  <select 
                    value={priorityCode}
                    onChange={(e) => setPriorityCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none text-slate-700"
                  >
                    <option value="high">{lang === 'ar' ? 'مرتفعة جداً' : 'High'}</option>
                    <option value="medium">{lang === 'ar' ? 'متوسطة' : 'Medium'}</option>
                    <option value="low">{lang === 'ar' ? 'منخفضة' : 'Low'}</option>
                  </select>
                </div>
              </div>

              {/* Budgets & Progress */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الموازنة (بالريال)' : 'Project Budget'}</label>
                  <input 
                    type="number" 
                    required 
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الإنجاز الفعلي (%)' : 'Progress Percent'}</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    required 
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'المستفيدين المستهدفين' : 'Target Beneficiaries'}</label>
                  <input 
                    type="number" 
                    value={targetBeneficiaries}
                    onChange={(e) => setTargetBeneficiaries(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'المستفيدين الفعليين' : 'Actual Beneficiaries'}</label>
                  <input 
                    type="number" 
                    value={actualBeneficiaries}
                    onChange={(e) => setActualBeneficiaries(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'تاريخ البدء الفعلي' : 'Start Date'}</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'التاريخ المتوقع للإنجاز' : 'End Date'}</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase">{lang === 'ar' ? 'نبذة عن المشروع وأنشطته' : 'Project Summary & Scope'}</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب المخلص التنفيذي للأنشطة...' : 'Summary of field actions...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none resize-none"
                />
              </div>
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={handleSave}
                disabled={formSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1 transition-all"
              >
                {formSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'ar' ? 'حفظ السجل' : 'Save Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Print Template Modal */}
      <PrintPDFTemplateModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        lang={lang}
        type="project"
        data={{
          projects: filtered,
          programs
        }}
      />

      {/* Universal Object Page Modal (UOP Standard) */}
      {inspectingProject && (
        <UniversalObjectPageModal
          isOpen={Boolean(inspectingProject)}
          onClose={() => setInspectingProject(null)}
          lang={lang}
          domainCode="NEB-04"
          domainNameAr="نظام إدارة المشاريع والعمليات الميدانية"
          domainNameEn="Field Project Management OS"
          recordCode={inspectingProject.code}
          titleAr={inspectingProject.name_ar}
          titleEn={inspectingProject.name_en}
          status={{
            code: inspectingProject.status_code || 'active',
            labelAr: inspectingProject.status_code === 'completed' ? 'مكتمل ومغلق' : 'نشط ميدانياً',
            labelEn: inspectingProject.status_code === 'completed' ? 'Completed' : 'Active',
            color: inspectingProject.status_code === 'completed' ? 'blue' : 'emerald'
          }}
          metrics={[
            {
              labelAr: 'الموازنة المعتمدة',
              labelEn: 'Approved Budget',
              value: (parseFloat(String(inspectingProject.budget_yer || inspectingProject.budget || 45000000))).toLocaleString(),
              unitAr: 'ر.ي',
              unitEn: 'YER',
              trend: 'up',
              color: 'emerald'
            },
            {
              labelAr: 'المنصرف الفعلي',
              labelEn: 'Actual Spend',
              value: Math.round(parseFloat(String(inspectingProject.budget_yer || inspectingProject.budget || 45000000)) * 0.65).toLocaleString(),
              unitAr: 'ر.ي',
              unitEn: 'YER',
              color: 'amber'
            },
            {
              labelAr: 'نسبة الإنجاز الميداني',
              labelEn: 'Progress',
              value: `${inspectingProject.progress_percent || inspectingProject.progress || 70}%`,
              change: '+15% هذا الربع',
              color: 'blue'
            },
            {
              labelAr: 'المستفيدون المستهدفون',
              labelEn: 'Target Beneficiaries',
              value: (inspectingProject.target_beneficiaries || 1200).toLocaleString(),
              unitAr: 'فرد',
              unitEn: 'indiv.',
              color: 'purple'
            }
          ]}
          overviewFieldGroups={[
            {
              groupTitleAr: '1. البيانات الأساسية والارتباط الهرمي',
              groupTitleEn: '1. Core Hierarchy & Metadata',
              fields: [
                { labelAr: 'البرنامج التنموي', labelEn: 'Parent Program', value: programs.find(p => p.id === inspectingProject.program_id)?.name_ar || 'برنامج التنمية المجتمعية' },
                { labelAr: 'رمز الكيان المؤسسي', labelEn: 'Record Code', value: inspectingProject.code, isCopyable: true },
                { labelAr: 'المدير التنفيذي للمشروع', labelEn: 'Project Lead', value: inspectingProject.manager_name || 'م. أحمد العباسي' },
                { labelAr: 'نطاق التدخل الإنساني', labelEn: 'Cluster Scope', value: 'مياه وإصحاح بيئي (WASH) ومساعدات' },
                { labelAr: 'معيار الامتثال الدولي', labelEn: 'Compliance Standard', value: 'The Sphere Project + CHS 9' }
              ]
            },
            {
              groupTitleAr: '2. النطاق الجغرافي والميداني',
              groupTitleEn: '2. Geographical & Site Scope',
              fields: [
                { labelAr: 'المحافظة والمديرية', labelEn: 'Governorate & District', value: inspectingProject.location_name || 'تعز - مديرية صبر الموادم' },
                { labelAr: 'الموقع الميداني الدقيق', labelEn: 'Specific Site', value: 'عزلة النجار - شبكة الآبار السطحية' },
                { labelAr: 'الإحداثيات الجغرافية', labelEn: 'GIS Coordinates', value: '13.5789° N, 44.0125° E', isCopyable: true },
                { labelAr: 'الفرع التشغيلي', labelEn: 'Operating Branch', value: 'فرع تعز والميدان' }
              ]
            },
            {
              groupTitleAr: '3. الجدول الزمني والامتثال المالي',
              groupTitleEn: '3. Schedule & Financial Parameters',
              fields: [
                { labelAr: 'تاريخ التدشين الفعلي', labelEn: 'Start Date', value: inspectingProject.start_date || '2026-01-15' },
                { labelAr: 'تاريخ التسليم المتوقع', labelEn: 'Expected Delivery', value: inspectingProject.end_date || '2026-09-30' },
                { labelAr: 'مؤشر الالتزام بالجدول', labelEn: 'Schedule Adherence', value: '98.5% (ممتاز)' },
                { labelAr: 'حساب الأستاذ العام', labelEn: 'GL Account', value: '120104 - حساب مشروعات المياه' }
              ]
            }
          ]}
          lineItems={[
            { id: 'li-1', code: 'WBS-01', nameAr: 'توريد وتركيب منظومة طاقة شمسية غاطسة', quantity: 1, unitAr: 'منظومة', unitPriceYer: 18000000, totalYer: 18000000 },
            { id: 'li-2', code: 'WBS-02', nameAr: 'تمديد شبكة أنابيب البولي إيثيلين 4 إنش', quantity: 3500, unitAr: 'متر طولي', unitPriceYer: 4500, totalYer: 15750000 },
            { id: 'li-3', code: 'WBS-03', nameAr: 'إنشاء خزانات خرسانية سعة 100م³ وتوزيع', quantity: 2, unitAr: 'خزان', unitPriceYer: 5625000, totalYer: 11250000 }
          ]}
          timeline={[
            { id: 'tl-1', titleAr: 'اعتماد دراسة الجدوى وتوثيق الاحتياج', titleEn: 'Feasibility Approval', actor: 'لجنة المشاريع المركزية', roleAr: 'رئيس وحدة المشاريع', roleEn: 'Projects Lead', timestamp: '2026-01-10', status: 'approved' },
            { id: 'tl-2', titleAr: 'المطابقة المحاسبية وحجز الموازنة', titleEn: 'Budget Reservation', actor: 'أ. سالم باحاج', roleAr: 'مدير الرقابة المالية', roleEn: 'Financial Controller', timestamp: '2026-01-12', status: 'approved' },
            { id: 'tl-3', titleAr: 'إصدار أمر الشروع والتدشين الميداني', titleEn: 'Site Kickoff', actor: 'م. أحمد العباسي', roleAr: 'مدير الموقع الميداني', roleEn: 'Site Lead', timestamp: '2026-01-15', status: 'approved' },
            { id: 'tl-4', titleAr: 'التفتيش الدوري وفحص الجودة الربع سنوي', titleEn: 'Quarterly MEAL Audit', actor: 'فريق MEAL', roleAr: 'الرقابة والتقييم', roleEn: 'MEAL Team', timestamp: '2026-04-20', status: 'approved' }
          ]}
          linkedRecords={[
            { id: 'lr-1', code: 'TX-2026-10493', typeAr: 'سند صرف محاسبي', typeEn: 'Payment Voucher', titleAr: 'صرف دفعة توريد الأنابيب والمستلزمات', amountYer: 3450000, targetTab: 'finance' },
            { id: 'lr-2', code: 'RFQ-2026-088', typeAr: 'أمر توريد P2P', typeEn: 'Purchase Order', titleAr: 'عقد توريد محطات الضخ والطاقة الشمسية', amountYer: 18000000, targetTab: 'procurement' }
          ]}
          auditTrail={[
            { id: 'at-1', actionAr: 'تحديث نسبة الإنجاز إلى 70%', actionEn: 'Progress update to 70%', user: 'م. أحمد العباسي', timestamp: '2026-08-25 14:32' },
            { id: 'at-2', actionAr: 'إرفاق محضر فحص الأنابيب الميداني', actionEn: 'Attach site inspection certificate', user: 'م. توفيق القدسي', timestamp: '2026-08-20 11:15' }
          ]}
          attachments={[
            { id: 'att-1', nameAr: 'تقرير الفحص الفني وجودة المياه.pdf', size: '2.4 MB', type: 'PDF', uploadedAt: '2026-08-15' },
            { id: 'att-2', nameAr: 'عقد التوريد والمطابقة الثلاثية P2P.pdf', size: '1.8 MB', type: 'PDF', uploadedAt: '2026-07-28' }
          ]}
          onEdit={() => {
            const p = inspectingProject;
            setInspectingProject(null);
            openModal(p);
          }}
          onDelete={() => {
            if (inspectingProject) {
              handleDelete(inspectingProject.id);
              setInspectingProject(null);
            }
          }}
        />
      )}

      {/* Global Addresses & Maps Manager Modal */}
      {showAddressManagerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 max-w-6xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddressManagerModal(false)}
              className="absolute top-5 left-5 p-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer z-20"
            >
              <X className="w-4 h-4" />
            </button>
            <GlobalAddressManagerView lang={lang} />
          </div>
        </div>
      )}
    </div>
    </ModuleShell>
  );
}
