import React, { useState, useEffect } from 'react';
import { 
  Target, TrendingUp, ShieldCheck, Coins, Users, HeartHandshake, Building2, 
  Sparkles, CheckCircle2, AlertTriangle, Clock, RefreshCw, Plus, Printer, 
  Search, ArrowUpRight, ChevronRight, BarChart3, Layers, Filter, FileText, 
  Check, X, Edit3, PieChart, Lock, Eye, Award, User
} from 'lucide-react';
import { ModuleShell } from './enterprise/ModuleShell';
import { generateNumericCode } from '../lib/idGenerator';

interface StrategicPlanningViewProps {
  lang: 'ar' | 'en';
  onNavigate?: (tab: string) => void;
}

export const StrategicPlanningView: React.FC<StrategicPlanningViewProps> = ({ lang, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'swot' | 'pillars' | 'alignment'>('goals');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterPillar, setFilterPillar] = useState<string>('ALL');

  // Modals state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState<boolean>(false);
  const [isNewSwotModalOpen, setIsNewSwotModalOpen] = useState<boolean>(false);

  // Form states
  const [updateForm, setUpdateForm] = useState({
    progress_pct: 0,
    kpi_current: 0,
    spent_budget_yer: 0,
    status: 'ON_TRACK'
  });

  const [newGoalForm, setNewGoalForm] = useState({
    goal_code: `OBJ-2025-${generateNumericCode(10, 99)}`,
    pillar_code: 'PIL-FINANCE',
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    weight_pct: 10,
    progress_pct: 0,
    kpi_target: 100,
    kpi_current: 0,
    kpi_unit_ar: '%',
    kpi_unit_en: '%',
    allocated_budget_yer: 50000000,
    assigned_owner_role: 'مدير الإدارة الاستراتيجية',
    assigned_owner_name: 'مدير التخطيط الاستراتيجي',
    linked_domain: 'NEB-01',
    status: 'ON_TRACK'
  });

  const [newSwotForm, setNewSwotForm] = useState({
    category: 'STRENGTH',
    title_ar: '',
    title_en: '',
    impact_level: 'HIGH',
    strategic_action_ar: '',
    strategic_action_en: '',
    linked_goal_code: 'OBJ-2025-01',
    owner_name: 'مدير التخطيط الاستراتيجي'
  });

  const fetchStrategicPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/strategic-plan');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.status === 'ok') {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to load strategic plan');
      }
    } catch (err: any) {
      console.warn("Could not fetch strategic plan from database, using fallback data:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategicPlan();
  }, []);

  const handleOpenUpdateModal = (goal: any) => {
    setSelectedGoal(goal);
    setUpdateForm({
      progress_pct: parseFloat(goal.progress_pct) || 0,
      kpi_current: parseFloat(goal.kpi_current) || 0,
      spent_budget_yer: parseFloat(goal.spent_budget_yer) || 0,
      status: goal.status || 'ON_TRACK'
    });
    setIsUpdateModalOpen(true);
  };

  const handleSaveGoalUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      const response = await fetch(`/api/strategic-goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm)
      });
      if (response.ok) {
        setIsUpdateModalOpen(false);
        fetchStrategicPlan();
      } else {
        alert(lang === 'ar' ? 'حدث خطأ أثناء تحديث الهدف' : 'Failed to update goal');
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    }
  };

  const handleCreateNewGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.plan?.id) return;
    try {
      const response = await fetch('/api/strategic-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: data.plan.id,
          ...newGoalForm
        })
      });
      if (response.ok) {
        setIsNewGoalModalOpen(false);
        fetchStrategicPlan();
      } else {
        alert(lang === 'ar' ? 'فشل إنشاء الهدف الاستراتيجي' : 'Failed to create goal');
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    }
  };

  const handleCreateNewSwot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.plan?.id) return;
    try {
      const response = await fetch('/api/swot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: data.plan.id,
          ...newSwotForm
        })
      });
      if (response.ok) {
        setIsNewSwotModalOpen(false);
        fetchStrategicPlan();
      } else {
        alert(lang === 'ar' ? 'فشل إضافة عنصر SWOT' : 'Failed to add SWOT item');
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const plan = data?.plan;
  const goals = data?.goals || [];
  const swot = data?.swot || [];
  const stats = data?.stats || {
    totalGoals: 0,
    completedGoals: 0,
    atRiskGoals: 0,
    overallProgressPct: 0,
    totalAllocatedBudget: 0,
    totalSpentBudget: 0,
    executionRatePct: 0
  };

  const filteredGoals = goals.filter((g: any) => {
    const matchesSearch = (g.title_ar + g.title_en + g.goal_code + g.assigned_owner_name).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPillar = filterPillar === 'ALL' || g.pillar_code === filterPillar;
    return matchesSearch && matchesPillar;
  });

  const getPillarBadge = (pillarCode: string) => {
    switch (pillarCode) {
      case 'PIL-FINANCE':
        return { textAr: 'الاستدامة المالية', textEn: 'Financial Sustainability', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
      case 'PIL-GOVERNANCE':
        return { textAr: 'التحول الرقمي والحوكمة', textEn: 'Digital Governance', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };
      case 'PIL-SERVICE':
        return { textAr: 'جودة الخدمات والأثر', textEn: 'Service Quality', color: 'bg-sky-500/10 text-sky-600 border-sky-500/30' };
      case 'PIL-OPS':
        return { textAr: 'التميز التشغيلي', textEn: 'Operational Excellence', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' };
      case 'PIL-HUMAN':
        return { textAr: 'الاستثمار البشري', textEn: 'Human Capital', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' };
      default:
        return { textAr: 'ركيزة استراتيجية', textEn: 'Strategic Pillar', color: 'bg-slate-500/10 text-slate-600 border-slate-500/30' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_TRACK':
        return { textAr: 'وفق الخطة', textEn: 'On Track', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
      case 'COMPLETED':
        return { textAr: 'مكتمل بنجاح', textEn: 'Completed', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30', icon: Award };
      case 'AT_RISK':
        return { textAr: 'تحت المخاطرة', textEn: 'At Risk', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', icon: AlertTriangle };
      case 'DELAYED':
        return { textAr: 'متأخر', textEn: 'Delayed', color: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30', icon: Clock };
      default:
        return { textAr: 'نشط', textEn: 'Active', color: 'bg-slate-500/15 text-slate-700 border-slate-500/30', icon: Target };
    }
  };

  return (
    <ModuleShell
      titleAr="التخطيط الاستراتيجي"
      titleEn="Strategic Planning"
      domainCode="NEB-01"
      icon={Target}
      lang={lang}
      accent="emerald"
    >
    <div className="space-y-6 pb-12 print:p-0">
      {/* Top Header Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-900 via-zinc-900 to-slate-900 rounded-3xl text-white shadow-2xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30">
                {lang === 'ar' ? 'التخطيط الاستراتيجي والأداء' : 'Strategic Planning & Performance'}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/20 text-sky-300 text-xs font-bold rounded-lg border border-sky-500/30">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                {lang === 'ar' ? 'بيئة التخطيط والمحاذاة المباشرة' : 'Active Alignment Engine'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {lang === 'ar' ? 'نظام التخطيط الاستراتيجي والأداء المؤسسي' : 'Strategic Planning & Performance OS'}
            </h1>
            <p className="text-xs md:text-sm text-zinc-300 max-w-3xl leading-relaxed">
              {plan?.title_ar || (lang === 'ar' ? 'الخطة الاستراتيجية الخمسية لمؤسسة رُحماء بينهم للعمل الإنساني (2025 - 2029)' : '5-Year Strategic Plan for Rohamā\'a Baynahum Charity Foundation (2025-2029)')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchStrategicPlan}
              disabled={loading}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{lang === 'ar' ? 'تحديث البيانات' : 'Refresh DB'}</span>
            </button>
            <button
              onClick={() => setIsNewGoalModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'هدف استراتيجي جديد' : 'New Strategic Goal'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 transition-all cursor-pointer"
              title={lang === 'ar' ? 'طباعة التقرير' : 'Print Report'}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Strategic Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall Strategic Progress */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              {lang === 'ar' ? 'نسبة الإنجاز الاستراتيجي الكلي' : 'Overall Strategic Progress'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-100">
              {stats.overallProgressPct.toFixed(1)}%
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +4.2%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.overallProgressPct)}%` }}
            />
          </div>
        </div>

        {/* Total Budget Allocated */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              {lang === 'ar' ? 'إجمالي الميزانية المعتمدة' : 'Total Allocated Budget'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100">
              {(stats.totalAllocatedBudget / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
            </span>
            <span className="text-xs font-mono text-slate-400">YER</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-zinc-400 font-medium flex justify-between">
            <span>{lang === 'ar' ? 'المصروف:' : 'Spent:'} {(stats.totalSpentBudget / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M YER</span>
            <span className="font-bold text-amber-600">{stats.executionRatePct}%</span>
          </div>
        </div>

        {/* Goals Execution Counts */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              {lang === 'ar' ? 'الأهداف الاستراتيجية النشطة' : 'Active Strategic Goals'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-100">
              {stats.totalGoals}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {lang === 'ar' ? 'هدف محدد' : 'Goals Defined'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
              {stats.completedGoals} {lang === 'ar' ? 'مكتملاً' : 'Done'}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">
              {stats.atRiskGoals} {lang === 'ar' ? 'مخاطرة' : 'At Risk'}
            </span>
          </div>
        </div>

        {/* Target Beneficiaries & Impact */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              {lang === 'ar' ? 'المستهدف الإنساني الكلي' : 'Target Beneficiaries Impact'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-100">
              {(plan?.target_beneficiaries_count || 500000).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              {lang === 'ar' ? 'مستفيد' : 'Impact'}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{lang === 'ar' ? 'موثق بمعايير Sphere الدولية' : 'Sphere Standards Verified'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'goals'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{lang === 'ar' ? 'الأهداف الاستراتيجية ومؤشرات الأداء (10)' : 'Strategic Objectives & KPIs'}</span>
        </button>

        <button
          onClick={() => setActiveTab('swot')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'swot'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{lang === 'ar' ? 'مصفوفة التحليل الرباعي (SWOT)' : 'SWOT Analysis Matrix'}</span>
        </button>

        <button
          onClick={() => setActiveTab('pillars')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'pillars'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{lang === 'ar' ? 'الركائز الاستراتيجية والقيم الجوهرية' : 'Pillars & Core Values'}</span>
        </button>

        <button
          onClick={() => setActiveTab('alignment')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'alignment'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{lang === 'ar' ? 'مصفوفة التلاؤم والمحاذاة المؤسسية' : 'Cross-Domain Alignment Matrix'}</span>
        </button>
      </div>

      {/* TAB 1: STRATEGIC GOALS & KPIS */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {/* Filter and Search Toolbar */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'البحث بالرمز، العنوان أو المسؤول...' : 'Search by code, title, owner...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 shrink-0">
                {lang === 'ar' ? 'الركيزة:' : 'Pillar:'}
              </span>
              <select
                value={filterPillar}
                onChange={(e) => setFilterPillar(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">{lang === 'ar' ? 'جميع الركائز الاستراتيجية' : 'All Strategic Pillars'}</option>
                <option value="PIL-FINANCE">{lang === 'ar' ? 'الاستدامة المالية وتنويع التمويل' : 'Financial Sustainability'}</option>
                <option value="PIL-GOVERNANCE">{lang === 'ar' ? 'التحول الرقمي والتميز المؤسسي' : 'Digital Governance'}</option>
                <option value="PIL-SERVICE">{lang === 'ar' ? 'جودة الخدمات والأثر الإنساني' : 'Service Quality & Impact'}</option>
                <option value="PIL-OPS">{lang === 'ar' ? 'التميز التشغيلي والتكيف الميداني' : 'Operational Excellence'}</option>
                <option value="PIL-HUMAN">{lang === 'ar' ? 'الاستثمار البشري والتمكين' : 'Human Capital'}</option>
              </select>
            </div>
          </div>

          {/* Goals List / Table */}
          <div className="space-y-3">
            {filteredGoals.map((goal: any) => {
              const pillarBadge = getPillarBadge(goal.pillar_code);
              const statusBadge = getStatusBadge(goal.status);
              const StatusIcon = statusBadge.icon;
              const progressPct = parseFloat(goal.progress_pct) || 0;
              const allocatedBudget = parseFloat(goal.allocated_budget_yer) || 0;
              const spentBudget = parseFloat(goal.spent_budget_yer) || 0;

              return (
                <div
                  key={goal.id || goal.goal_code}
                  className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/50 transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-black rounded-lg border border-emerald-500/20 shrink-0">
                        {goal.goal_code}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${pillarBadge.color}`}>
                            {lang === 'ar' ? pillarBadge.textAr : pillarBadge.textEn}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                            {lang === 'ar' ? 'هدف استراتيجي معتمد' : 'Approved Strategic Objective'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${statusBadge.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {lang === 'ar' ? statusBadge.textAr : statusBadge.textEn}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 leading-snug">
                          {lang === 'ar' ? goal.title_ar : goal.title_en}
                        </h3>
                        {goal.description_ar && (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                            {lang === 'ar' ? goal.description_ar : goal.description_en}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleOpenUpdateModal(goal)}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800/50 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تحديث الإنجاز' : 'Update Progress'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Metrics and Progress Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 text-xs">
                    {/* Goal Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-600 dark:text-zinc-400">
                        <span>{lang === 'ar' ? 'نسبة إنجاز الهدف:' : 'Goal Progress:'}</span>
                        <span className="text-emerald-600 font-mono">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Target KPI Value */}
                    <div className="space-y-1">
                      <span className="text-slate-500 dark:text-zinc-400 font-bold block">
                        {lang === 'ar' ? 'مؤشر الأداء الرقمي Target KPI:' : 'Target KPI Metric:'}
                      </span>
                      <div className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                        <span>{parseFloat(goal.kpi_current).toLocaleString()} / {parseFloat(goal.kpi_target).toLocaleString()}</span>
                        <span className="mr-1 text-slate-400 text-[10px]">{goal.kpi_unit_ar || '%'}</span>
                      </div>
                    </div>

                    {/* Allocated & Spent Budget */}
                    <div className="space-y-1">
                      <span className="text-slate-500 dark:text-zinc-400 font-bold block">
                        {lang === 'ar' ? 'الميزانية المعتمدة / المصروفة:' : 'Budget Allocated / Spent:'}
                      </span>
                      <div className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                        <span>{(allocatedBudget / 1000000).toFixed(1)}M / {(spentBudget / 1000000).toFixed(1)}M YER</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lang === 'ar' ? 'المسؤول التنفيذي:' : 'Executive Owner:'}</span>
                      <strong className="text-slate-700 dark:text-zinc-200">{goal.assigned_owner_name || 'قيادي المبادرة'}</strong>
                      <span className="text-slate-400 font-mono">({goal.assigned_owner_role || 'مسؤول المجال'})</span>
                    </div>

                    <div className="font-mono text-[10px] text-slate-400">
                      {lang === 'ar' ? 'الوزن النسبي:' : 'Weight:'} {goal.weight_pct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SWOT ANALYSIS MATRIX */}
      {activeTab === 'swot' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-zinc-100">
                {lang === 'ar' ? 'مصفوفة التحليل الرباعي البيئي (SWOT Matrix)' : 'SWOT Environmental Matrix'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {lang === 'ar' ? 'تشخيص البيئة الداخلية والخارجية لجمعية رُحماء بينهم وربط الإجراءات بالأهداف الاستراتيجية.' : 'Diagnosing internal & external drivers linked directly to strategic objectives.'}
              </p>
            </div>
            <button
              onClick={() => setIsNewSwotModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة عنصر SWOT' : 'Add SWOT Item'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths Quadrant */}
            <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'ar' ? 'نقاط القوة (Internal Strengths)' : 'Internal Strengths'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  {swot.filter((s: any) => s.category === 'STRENGTH').length}
                </span>
              </div>

              <div className="space-y-3">
                {swot.filter((s: any) => s.category === 'STRENGTH').map((item: any) => (
                  <div key={item.id} className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
                        {lang === 'ar' ? item.title_ar : item.title_en}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                        {item.impact_level}
                      </span>
                    </div>
                    {item.strategic_action_ar && (
                      <div className="p-2 bg-slate-50 dark:bg-zinc-800/60 rounded-lg text-[11px] text-slate-600 dark:text-zinc-300 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{lang === 'ar' ? item.strategic_action_ar : item.strategic_action_en}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses Quadrant */}
            <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>{lang === 'ar' ? 'نقاط الضعف (Internal Weaknesses)' : 'Internal Weaknesses'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  {swot.filter((s: any) => s.category === 'WEAKNESS').length}
                </span>
              </div>

              <div className="space-y-3">
                {swot.filter((s: any) => s.category === 'WEAKNESS').map((item: any) => (
                  <div key={item.id} className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-amber-100 dark:border-amber-900/50 shadow-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
                        {lang === 'ar' ? item.title_ar : item.title_en}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                        {item.impact_level}
                      </span>
                    </div>
                    {item.strategic_action_ar && (
                      <div className="p-2 bg-slate-50 dark:bg-zinc-800/60 rounded-lg text-[11px] text-slate-600 dark:text-zinc-300 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{lang === 'ar' ? item.strategic_action_ar : item.strategic_action_en}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities Quadrant */}
            <div className="p-5 bg-sky-50/50 dark:bg-sky-950/20 rounded-2xl border border-sky-200 dark:border-sky-800/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-200/60 dark:border-sky-800/40">
                <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-black text-sm">
                  <TrendingUp className="w-5 h-5 text-sky-600" />
                  <span>{lang === 'ar' ? 'الفرص الاستراتيجية (External Opportunities)' : 'External Opportunities'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold">
                  {swot.filter((s: any) => s.category === 'OPPORTUNITY').length}
                </span>
              </div>

              <div className="space-y-3">
                {swot.filter((s: any) => s.category === 'OPPORTUNITY').map((item: any) => (
                  <div key={item.id} className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-sky-100 dark:border-sky-900/50 shadow-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
                        {lang === 'ar' ? item.title_ar : item.title_en}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20 shrink-0">
                        {item.impact_level}
                      </span>
                    </div>
                    {item.strategic_action_ar && (
                      <div className="p-2 bg-slate-50 dark:bg-zinc-800/60 rounded-lg text-[11px] text-slate-600 dark:text-zinc-300 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                        <span>{lang === 'ar' ? item.strategic_action_ar : item.strategic_action_en}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Threats Quadrant */}
            <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-800/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-rose-200/60 dark:border-rose-800/40">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-black text-sm">
                  <Clock className="w-5 h-5 text-rose-600" />
                  <span>{lang === 'ar' ? 'التهديدات والمخاطر (External Threats)' : 'External Threats'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold">
                  {swot.filter((s: any) => s.category === 'THREAT').length}
                </span>
              </div>

              <div className="space-y-3">
                {swot.filter((s: any) => s.category === 'THREAT').map((item: any) => (
                  <div key={item.id} className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-rose-100 dark:border-rose-900/50 shadow-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
                        {lang === 'ar' ? item.title_ar : item.title_en}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 shrink-0">
                        {item.impact_level}
                      </span>
                    </div>
                    {item.strategic_action_ar && (
                      <div className="p-2 bg-slate-50 dark:bg-zinc-800/60 rounded-lg text-[11px] text-slate-600 dark:text-zinc-300 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{lang === 'ar' ? item.strategic_action_ar : item.strategic_action_en}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PILLARS & CORE VALUES */}
      {activeTab === 'pillars' && (
        <div className="space-y-6">
          {/* Vision and Mission Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-gradient-to-br from-emerald-900/90 to-zinc-900 text-white rounded-2xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Target className="w-4 h-4" />
                <span>{lang === 'ar' ? 'الرؤية الاستراتيجية 2029' : 'Strategic Vision 2029'}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {plan?.vision_ar || (lang === 'ar' ? 'الريادة والإبداع في تقديم الخدمات الإنسانية والتنموية المستدامة وتمكين المجتمعات النائية في اليمن وفق أعلى معايير الحوكمة الشاملة.' : 'Leadership and innovation in providing sustainable humanitarian and development services.')}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-900/90 to-zinc-900 text-white rounded-2xl border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <HeartHandshake className="w-4 h-4" />
                <span>{lang === 'ar' ? 'الرسالة المؤسسية' : 'Institutional Mission'}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {plan?.mission_ar || (lang === 'ar' ? 'تقديم مساعدات إغاثية وتنموية متكاملة ترتقي بحياة الفئات الأشد ضعفاً، وتكفل الأيتام، وتستثمر في الموارد البشرية والتحول الرقمي.' : 'Delivering integrated relief and development aid to uplift vulnerable populations.')}
              </p>
            </div>
          </div>

          {/* 5 Strategic Pillars Grid */}
          <div className="space-y-3">
            <h3 className="font-black text-base text-slate-900 dark:text-zinc-100">
              {lang === 'ar' ? 'الركائز الاستراتيجية الـ 5 المعتمدة' : 'The 5 Approved Strategic Pillars'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  {lang === 'ar' ? '1. الاستدامة المالية وتنويع التمويل' : '1. Financial Sustainability'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'تنمية التمويل الذاتي، المشاريع الأوقافية، والاستغلال الأمثل للموارد لمنع الاعتماد الفردي.' : 'Developing self-funding, endowments, and resource optimization.'}
                </p>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  {lang === 'ar' ? '2. التحول الرقمي والحوكمة' : '2. Digital Transformation'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'ربط كافة إدارات المؤسسة بنظام NexoraOS والربط بقواعد البيانات السحابية الحية.' : 'Connecting all enterprise operations to NexoraOS cloud infrastructure.'}
                </p>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  {lang === 'ar' ? '3. جودة الخدمات والأثر الإنساني' : '3. Service Quality & Impact'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'تقديم خدمات كفالات الأيتام، الاستجابة المائية، والإغاثة طبقاً لمعايير Sphere.' : 'Orphan care, water response, and Sphere humanitarian standards.'}
                </p>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  {lang === 'ar' ? '4. التتميز التشغيلي والمناقصات' : '4. Operational Excellence'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'تطبيق المقارنة الثلاثية الشفافة وتامين سلاسل الإمداد اللوجستية الميدانية.' : '3-way quote matrix, logistics buffers, and supply chain readiness.'}
                </p>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  {lang === 'ar' ? '5. الاستثمار البشري والتمكين' : '5. Human Capital Empowerment'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'ar' ? 'تأهيل الكوادر الميدانية، شبكات المتطوعين، وبناء قدرات المجتمع المحلي.' : 'Staff capacity building, volunteer networks, and local empowerment.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CROSS-DOMAIN ALIGNMENT MATRIX */}
      {activeTab === 'alignment' && (
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
            <h3 className="font-black text-base text-slate-900 dark:text-zinc-100">
              {lang === 'ar' ? 'جدول المحاذاة والترابط بين الاستراتيجية والمجالات المؤسسية' : 'Strategic Cross-Domain Alignment Table'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {lang === 'ar' ? 'ربط وتكامل الأهداف الاستراتيجية بالبرامج والمشاريع التنفيذية والميزانيات المالية والتحليلات الذكية.' : 'Mapping strategic goals to active programs, projects, financial budgets, and intelligent analytics.'}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right text-slate-800 dark:text-zinc-200">
                <thead className="bg-slate-50 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">{lang === 'ar' ? 'رمز الهدف' : 'Goal Code'}</th>
                    <th className="p-3">{lang === 'ar' ? 'الهدف الاستراتيجي' : 'Strategic Objective'}</th>
                    <th className="p-3">{lang === 'ar' ? 'المجال المرتبط' : 'Domain'}</th>
                    <th className="p-3">{lang === 'ar' ? 'الإنجاز' : 'Progress'}</th>
                    <th className="p-3">{lang === 'ar' ? 'الميزانية (YER)' : 'Budget (YER)'}</th>
                    <th className="p-3">{lang === 'ar' ? 'المسؤول التنفيذي' : 'Executive Owner'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {goals.map((g: any) => (
                    <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all">
                      <td className="p-3 font-mono font-bold text-emerald-600">{g.goal_code}</td>
                      <td className="p-3 font-bold">{lang === 'ar' ? g.title_ar : g.title_en}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 dark:bg-zinc-800 border">
                          {g.linked_domain}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-600">{g.progress_pct}%</td>
                      <td className="p-3 font-mono">{(parseFloat(g.allocated_budget_yer) || 0).toLocaleString()}</td>
                      <td className="p-3 font-medium">{g.assigned_owner_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE GOAL PROGRESS MODAL */}
      {isUpdateModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <Edit3 className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تحديث إنجاز الهدف' : 'Update Goal Progress'} - {selectedGoal.goal_code}</span>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoalUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'ar' ? 'عنوان الهدف الاستراتيجي:' : 'Goal Title:'}
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedGoal.title_ar}
                  className="w-full p-2.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'ar' ? 'نسبة الإنجاز الفعلي (%):' : 'Progress Percentage (%):'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={updateForm.progress_pct}
                  onChange={(e) => setUpdateForm({ ...updateForm, progress_pct: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'ar' ? `القيمة الحالية لمؤشر الأداء (${selectedGoal.kpi_unit_ar || ''}):` : 'Current KPI Metric:'}
                </label>
                <input
                  type="number"
                  value={updateForm.kpi_current}
                  onChange={(e) => setUpdateForm({ ...updateForm, kpi_current: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'ar' ? 'المبلغ المصروف حتى الآن (YER):' : 'Spent Budget (YER):'}
                </label>
                <input
                  type="number"
                  value={updateForm.spent_budget_yer}
                  onChange={(e) => setUpdateForm({ ...updateForm, spent_budget_yer: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {lang === 'ar' ? 'حالة الإنجاز:' : 'Status:'}
                </label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ON_TRACK">{lang === 'ar' ? 'وفق الخطة (On Track)' : 'On Track'}</option>
                  <option value="COMPLETED">{lang === 'ar' ? 'مكتمل بنجاح (Completed)' : 'Completed'}</option>
                  <option value="AT_RISK">{lang === 'ar' ? 'تحت المخاطرة (At Risk)' : 'At Risk'}</option>
                  <option value="DELAYED">{lang === 'ar' ? 'متأخر (Delayed)' : 'Delayed'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-bold rounded-xl cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ التغييرات في قاعدة البيانات' : 'Save to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW GOAL MODAL */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <Plus className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إضافة هدف استراتيجي جديد' : 'Add New Strategic Goal'}</span>
              </div>
              <button
                onClick={() => setIsNewGoalModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewGoal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">{lang === 'ar' ? 'رمز الهدف:' : 'Goal Code:'}</label>
                  <input
                    type="text"
                    required
                    value={newGoalForm.goal_code}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, goal_code: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{lang === 'ar' ? 'الركيزة:' : 'Pillar:'}</label>
                  <select
                    value={newGoalForm.pillar_code}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, pillar_code: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                  >
                    <option value="PIL-FINANCE">الاستدامة المالية</option>
                    <option value="PIL-GOVERNANCE">التحول الرقمي والحوكمة</option>
                    <option value="PIL-SERVICE">جودة الخدمات والأثر</option>
                    <option value="PIL-OPS">التميز التشغيلي</option>
                    <option value="PIL-HUMAN">الاستثمار البشري</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">{lang === 'ar' ? 'عنوان الهدف (عربي):' : 'Title (AR):'}</label>
                <input
                  type="text"
                  required
                  value={newGoalForm.title_ar}
                  onChange={(e) => setNewGoalForm({ ...newGoalForm, title_ar: e.target.value })}
                  placeholder="مثال: إنشاء أوقاف إنتاجية لجمعية رُحماء بينهم..."
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">{lang === 'ar' ? 'عنوان الهدف (إنكليزي):' : 'Title (EN):'}</label>
                <input
                  type="text"
                  required
                  value={newGoalForm.title_en}
                  onChange={(e) => setNewGoalForm({ ...newGoalForm, title_en: e.target.value })}
                  placeholder="e.g. Establishing productive endowments..."
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">{lang === 'ar' ? 'المستهدف KPI Target:' : 'Target KPI:'}</label>
                  <input
                    type="number"
                    required
                    value={newGoalForm.kpi_target}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, kpi_target: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{lang === 'ar' ? 'الميزانية المخصصة (YER):' : 'Allocated Budget:'}</label>
                  <input
                    type="number"
                    value={newGoalForm.allocated_budget_yer}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, allocated_budget_yer: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">{lang === 'ar' ? 'المسؤول التنفيذي:' : 'Owner Name:'}</label>
                  <input
                    type="text"
                    value={newGoalForm.assigned_owner_name}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, assigned_owner_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{lang === 'ar' ? 'المجال المؤسسي:' : 'Linked Domain:'}</label>
                  <select
                    value={newGoalForm.linked_domain}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, linked_domain: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                  >
                    <option value="NEB-01">{lang === 'ar' ? 'الاستراتيجية والأداء' : 'Strategy & Performance'}</option>
                    <option value="NEB-03">{lang === 'ar' ? 'البرامج التنموية' : 'Development Programs'}</option>
                    <option value="NEB-04">{lang === 'ar' ? 'المشاريع التنفيذية' : 'Executive Projects'}</option>
                    <option value="NEB-06">{lang === 'ar' ? 'المستفيدون والخدمات' : 'Beneficiaries & Services'}</option>
                    <option value="NEB-10">{lang === 'ar' ? 'المالية والحوكمة' : 'Finance & Governance'}</option>
                    <option value="NEB-12">{lang === 'ar' ? 'التقنية والأنظمة' : 'IT & Systems'}</option>
                    <option value="NEB-15">{lang === 'ar' ? 'الأوقاف والاستثمار' : 'Endowments & Investment'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewGoalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-bold rounded-xl cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {lang === 'ar' ? 'إضافة للجدول بـ PostgreSQL' : 'Save Goal to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW SWOT ITEM MODAL */}
      {isNewSwotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <Plus className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إضافة عنصر جديد لتحليل SWOT' : 'Add New SWOT Item'}</span>
              </div>
              <button
                onClick={() => setIsNewSwotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSwot} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">{lang === 'ar' ? 'فئة العنصر:' : 'Category:'}</label>
                <select
                  value={newSwotForm.category}
                  onChange={(e) => setNewSwotForm({ ...newSwotForm, category: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                >
                  <option value="STRENGTH">نقاط القوة (Strength)</option>
                  <option value="WEAKNESS">نقاط الضعف (Weakness)</option>
                  <option value="OPPORTUNITY">الفرص (Opportunity)</option>
                  <option value="THREAT">التهديدات (Threat)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">{lang === 'ar' ? 'العنوان (عربي):' : 'Title (AR):'}</label>
                <input
                  type="text"
                  required
                  value={newSwotForm.title_ar}
                  onChange={(e) => setNewSwotForm({ ...newSwotForm, title_ar: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">{lang === 'ar' ? 'الإجراء الاستراتيجي الموصى به:' : 'Strategic Action:'}</label>
                <textarea
                  value={newSwotForm.strategic_action_ar}
                  onChange={(e) => setNewSwotForm({ ...newSwotForm, strategic_action_ar: e.target.value })}
                  rows={2}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-xl font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewSwotModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-bold rounded-xl cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ بـ SWOT Table' : 'Save SWOT Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </ModuleShell>
  );
};
