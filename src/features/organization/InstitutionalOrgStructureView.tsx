import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  ShieldCheck,
  Briefcase,
  Layers,
  Award,
  DollarSign,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  ListFilter,
  Eye,
  X
} from 'lucide-react';
import {
  STANDARD_ORGANIZATIONAL_UNITS,
  STANDARD_JOB_POSITIONS,
  OrgUnit,
  JobPosition
} from '../../core/data/institutionalOrgData';
import { printHTML, createPrintDocument, getCustomFooterHTML } from '../../lib/printUtils';

interface InstitutionalOrgStructureViewProps {
  lang: 'ar' | 'en';
  onNavigateToCostCenter?: (costCenterCode: string) => void;
}

type OrgViewMode = 'chart' | 'directory' | 'positions';

export default function InstitutionalOrgStructureView({
  lang,
  onNavigateToCostCenter
}: InstitutionalOrgStructureViewProps) {
  const isRtl = lang === 'ar';

  const [units, setUnits] = useState<OrgUnit[]>(STANDARD_ORGANIZATIONAL_UNITS);
  const [positions, setPositions] = useState<JobPosition[]>(STANDARD_JOB_POSITIONS);

  const [viewMode, setViewMode] = useState<OrgViewMode>('chart');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');

  // Expanded Nodes state for Tree
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'BOD-GOV': true,
    'DIR-EXEC': true,
    'DEP-PRG': true,
    'DEP-FIN': true,
    'DEP-OPS': true
  });

  // Selected Unit for Detail Drawer
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);

  // Add Department Modal
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitForm, setNewUnitForm] = useState<Partial<OrgUnit>>({
    code: '',
    name_ar: '',
    name_en: '',
    level: 3,
    parent_code: 'DIR-EXEC',
    type: 'department',
    manager_name: '',
    manager_title: '',
    manager_email: '',
    linked_cost_center_code: 'CC-ADM-EXEC',
    budgeted_headcount: 5,
    actual_headcount: 5,
    annual_budget_yer: 25000000,
    linked_projects_count: 1,
    primary_responsibilities: ['إدارة المهام التشغيلية اليومية الموكلة'],
    governance_delegation_limit_yer: 3000000,
    status: 'active'
  });

  // KPI Calculations
  const stats = useMemo(() => {
    const totalUnits = units.length;
    const totalBudgetedPositions = units.reduce((sum, u) => sum + u.budgeted_headcount, 0);
    const totalActualOccupied = units.reduce((sum, u) => sum + u.actual_headcount, 0);
    const vacancyCount = Math.max(0, totalBudgetedPositions - totalActualOccupied);
    const totalAnnualPayrollAndBudgetYer = units.reduce((sum, u) => sum + u.annual_budget_yer, 0);
    const sectorsCount = units.filter(u => u.type === 'sector').length;
    const branchesCount = units.filter(u => u.type === 'branch').length;

    return {
      totalUnits,
      totalBudgetedPositions,
      totalActualOccupied,
      vacancyCount,
      totalAnnualPayrollAndBudgetYer,
      sectorsCount,
      branchesCount
    };
  }, [units]);

  // Toggle Node
  const toggleNode = (code: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    units.forEach(u => { all[u.code] = true; });
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Filter Units
  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const matchSearch =
        u.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.manager_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = selectedTypeFilter === 'all' || u.type === selectedTypeFilter;
      const matchLevel = selectedLevelFilter === 'all' || u.level === selectedLevelFilter;

      return matchSearch && matchType && matchLevel;
    });
  }, [units, searchTerm, selectedTypeFilter, selectedLevelFilter]);

  // Filter Positions
  const filteredPositions = useMemo(() => {
    return positions.filter(p => {
      return (
        p.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department_name_ar.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [positions, searchTerm]);

  // Children mapping for Tree
  const childrenMap = useMemo(() => {
    const map = new Map<string, OrgUnit[]>();
    units.forEach(unit => {
      const parent = unit.parent_code || 'ROOT';
      if (!map.has(parent)) {
        map.set(parent, []);
      }
      map.get(parent)!.push(unit);
    });
    return map;
  }, [units]);

  // Handle Add New Unit
  const handleSaveNewUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitForm.code || !newUnitForm.name_ar) return;

    const created: OrgUnit = {
      code: newUnitForm.code.toUpperCase(),
      name_ar: newUnitForm.name_ar,
      name_en: newUnitForm.name_en || newUnitForm.name_ar,
      level: Number(newUnitForm.level) || 3,
      parent_code: newUnitForm.parent_code || 'DIR-EXEC',
      type: (newUnitForm.type as any) || 'department',
      manager_name: newUnitForm.manager_name || 'قيد التعيين',
      manager_title: newUnitForm.manager_title || 'مدير الإدارة',
      manager_email: newUnitForm.manager_email || `${newUnitForm.code.toLowerCase()}@rohamaab.org`,
      linked_cost_center_code: newUnitForm.linked_cost_center_code || 'CC-ADM-EXEC',
      budgeted_headcount: Number(newUnitForm.budgeted_headcount) || 1,
      actual_headcount: Number(newUnitForm.actual_headcount) || 1,
      annual_budget_yer: Number(newUnitForm.annual_budget_yer) || 0,
      linked_projects_count: Number(newUnitForm.linked_projects_count) || 0,
      primary_responsibilities: newUnitForm.primary_responsibilities || ['إدارة المهام التشغيلية'],
      governance_delegation_limit_yer: Number(newUnitForm.governance_delegation_limit_yer) || 1000000,
      status: 'active'
    };

    setUnits(prev => [...prev, created]);
    setShowAddUnitModal(false);
  };

  // Official A4 Print
  const handlePrintOrgStructure = () => {
    const documentHTML = `
      <div style="font-family: 'Tajawal', sans-serif; direction: rtl; text-align: right; color: #0f172a; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #059669; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <img src="/UAMEX_ERPLOGO.png" style="height: 52px; object-fit: contain;" />
            <img src="/LogoRohamaab.png" style="height: 52px; object-fit: contain;" />
            <div>
              <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #059669;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">نظام يو امكس المؤسسي الشامل - الهيكل التنظيمي والمؤسسي المعتمد</p>
            </div>
          </div>
          <div style="text-align: left; font-size: 10px; color: #64748b;">
            <div><strong>تاريخ الاعتماد:</strong> ${new Date().toLocaleDateString('ar-YE')}</div>
            <div><strong>المرجع الحوكمي:</strong> GOV-ORG-2026-V3</div>
            <div><strong>إجمالي الوظائف المعتمدة:</strong> ${stats.totalBudgetedPositions} شاغر</div>
          </div>
        </div>

        <div style="margin-bottom: 14px; background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px;">
          <div><strong>إجمالي الإدارات والقطاعات:</strong> ${stats.totalUnits} وحدة</div>
          <div><strong>الكوادر المشغولة:</strong> ${stats.totalActualOccupied} موظف</div>
          <div><strong>الشواغر الوظيفية:</strong> ${stats.vacancyCount} شاغر</div>
          <div><strong>إجمالي الموازنة التشغيلية المعتمدة:</strong> ${stats.totalAnnualPayrollAndBudgetYer.toLocaleString()} ر.ي</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #0f172a; color: #fbbf24;">
              <th style="border: 1px solid #334155; padding: 6px; width: 12%;">الكود التنظيمي</th>
              <th style="border: 1px solid #334155; padding: 6px;">اسم الإدارة / الوحدة</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 14%;">المدير المسؤول</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 14%;">مركز التكلفة المربوط</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 8%; text-align: center;">الملاك / الفعلي</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 16%; text-align: left;">الموازنة المعتمدة</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 14%; text-align: left;">سقف الصلاحية</th>
            </tr>
          </thead>
          <tbody>
            ${units.map((u, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; font-family: monospace;">${u.code}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">
                  ${'— '.repeat(Math.max(0, u.level - 1))} ${u.name_ar}
                </td>
                <td style="border: 1px solid #cbd5e1; padding: 6px;">${u.manager_name}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${u.linked_cost_center_code}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">${u.actual_headcount} / ${u.budgeted_headcount}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; font-family: monospace;">${u.annual_budget_yer.toLocaleString()} ر.ي</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; font-family: monospace;">${u.governance_delegation_limit_yer.toLocaleString()} ر.ي</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; font-size: 11px;">
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">مديرة الموارد البشرية</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">أ. هناء المنصوب</p>
          </div>
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">المدير المالي والامتثال</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">أ. ياسر باوزير</p>
          </div>
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">المدير التنفيذي العام</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">د. عبد الله الشامي</p>
          </div>
        </div>

        ${getCustomFooterHTML('ar')}
      </div>
    `;

    const printDoc = createPrintDocument();
    printDoc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>الهيكل التنظيمي والمؤسسي المعتمد - جمعية رُحماء بينهم</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; background: #ffffff; }
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; }
            @page { size: A4 landscape; margin: 12mm; }
          }
        </style>
      </head>
      <body style="padding: 15px;">
        ${documentHTML}
      </body>
      </html>
    `);
    printDoc.close();
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['الكود التنظيمي', 'اسم الإدارة', 'المستوى', 'النوع', 'المدير المسؤول', 'مركز التكلفة المربوط', 'الملاك المعتمد', 'الشاغر الحالي', 'الموازنة السنوية ر.ي', 'سقف الصلاحية ر.ي'];
    const rows = units.map(u => [
      u.code,
      `"${u.name_ar}"`,
      u.level,
      u.type,
      `"${u.manager_name}"`,
      u.linked_cost_center_code,
      u.budgeted_headcount,
      u.actual_headcount,
      u.annual_budget_yer,
      u.governance_delegation_limit_yer
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `الهيكل_المؤسسي_المعتمد_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Recursive Tree Node Renderer
  const renderTreeBranch = (parentCode: string | null = null, depth: number = 0) => {
    const currentChildren = childrenMap.get(parentCode || 'ROOT') || [];
    if (currentChildren.length === 0) return null;

    return (
      <div className={`space-y-3 ${depth > 0 ? (isRtl ? 'mr-6 border-r-2 border-slate-200 dark:border-zinc-800 pr-4' : 'ml-6 border-l-2 border-slate-200 dark:border-zinc-800 pl-4') : ''}`}>
        {currentChildren.map(unit => {
          const hasChildren = (childrenMap.get(unit.code) || []).length > 0;
          const isExpanded = !!expandedNodes[unit.code];

          return (
            <div key={unit.code} className="space-y-2">
              <div
                className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  unit.level === 1
                    ? 'bg-emerald-950 text-white border-emerald-800 shadow-md'
                    : unit.level === 2
                    ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50'
                }`}
              >
                {/* Right side: expander, badge, title */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {hasChildren ? (
                    <button
                      onClick={() => toggleNode(unit.code)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        unit.level <= 2 ? 'hover:bg-white/10 text-amber-400' : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500'
                      }`}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  ) : (
                    <div className="w-6 h-4" />
                  )}

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                    unit.level === 1 ? 'bg-amber-400 text-slate-950' : unit.level === 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}>
                    {unit.code}
                  </span>

                  <div className="truncate">
                    <h4 className={`text-xs font-black truncate ${unit.level <= 2 ? 'text-white' : 'text-slate-900 dark:text-zinc-100'}`}>
                      {isRtl ? unit.name_ar : unit.name_en}
                    </h4>
                    <p className={`text-[10px] font-medium truncate ${unit.level <= 2 ? 'text-slate-300' : 'text-slate-500 dark:text-zinc-400'}`}>
                      {unit.manager_title}: <span className="font-bold">{unit.manager_name}</span>
                    </p>
                  </div>
                </div>

                {/* Left side: metadata metrics & quick actions */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Linked Cost Center Badge */}
                  <button
                    onClick={() => onNavigateToCostCenter && onNavigateToCostCenter(unit.linked_cost_center_code)}
                    title={isRtl ? 'الانتقال إلى مركز التكلفة المربوط' : 'Navigate to Cost Center'}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      unit.level <= 2
                        ? 'bg-white/10 hover:bg-white/20 text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <DollarSign className="w-3 h-3" />
                    <span>{unit.linked_cost_center_code}</span>
                  </button>

                  {/* Headcount */}
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    unit.level <= 2 ? 'bg-white/10 text-slate-200' : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}>
                    <Users className="w-3 h-3 inline ml-1 mr-1" />
                    {unit.actual_headcount} / {unit.budgeted_headcount} {isRtl ? 'شاغر' : 'FTE'}
                  </span>

                  {/* Budget */}
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black ${
                    unit.level <= 2 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800'
                  }`}>
                    {(unit.annual_budget_yer / 1000000).toFixed(1)} {isRtl ? 'مليون ر.ي' : 'M YER'}
                  </span>

                  {/* Detail Drawer Trigger */}
                  <button
                    onClick={() => setSelectedUnit(unit)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      unit.level <= 2 ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                    title={isRtl ? 'عرض بطاقة الإدارة التفصيلية' : 'View Details'}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recursive Children if expanded */}
              {hasChildren && isExpanded && renderTreeBranch(unit.code, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header and High-Level KPI Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-emerald-600" />
              <span>{isRtl ? 'الهيكل المؤسسي والحوكمة التنظيمية (Standardized Org OS)' : 'Standardized Organizational Structure OS'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isRtl
                ? 'الهيكل الإداري والميداني المعياري لجمعية رُحماء بينهم وربطه بمراكز التكلفة والموازنات وسقوف الصلاحيات المالية المعتمدة.'
                : 'Enterprise institutional governance structure, linking departments to cost centers, budgets, and financial delegation limits.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintOrgStructure}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isRtl ? 'طباعة الهيكل A4' : 'Print A4 Org'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isRtl ? 'تصدير Excel (CSV)' : 'Export CSV'}</span>
            </button>

            <button
              onClick={() => setShowAddUnitModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة وحدة / إدارة' : 'Add Unit'}</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{isRtl ? 'الوحدات الإدارية' : 'Org Units'}</span>
            <p className="text-xl font-black text-emerald-600 font-mono">{stats.totalUnits}</p>
            <span className="text-[10px] text-slate-400 block">{stats.sectorsCount} قطاعات رئيسية</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{isRtl ? 'الملاك الوظيفي' : 'Budgeted Headcount'}</span>
            <p className="text-xl font-black text-blue-600 font-mono">{stats.totalBudgetedPositions}</p>
            <span className="text-[10px] text-slate-400 block">{stats.totalActualOccupied} شاغر مشغول</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{isRtl ? 'الشواغر المتاحة' : 'Open Vacancies'}</span>
            <p className="text-xl font-black text-amber-600 font-mono">{stats.vacancyCount}</p>
            <span className="text-[10px] text-slate-400 block">شواغر قيد التوظيف</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{isRtl ? 'الفروع الإقليمية' : 'Regional Hubs'}</span>
            <p className="text-xl font-black text-purple-600 font-mono">{stats.branchesCount}</p>
            <span className="text-[10px] text-slate-400 block">صنعاء، عدن، تعز، الحديدة</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-1 lg:col-span-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{isRtl ? 'إجمالي الموازنة التشغيلية المعتمدة' : 'Total Approved Org Budget'}</span>
            <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {(stats.totalAnnualPayrollAndBudgetYer / 1000000).toLocaleString()} <span className="text-xs font-sans text-emerald-600 font-bold">{isRtl ? 'مليون ر.ي' : 'M YER'}</span>
            </p>
            <span className="text-[10px] text-slate-400 block">مربوطة بنظام مراكز التكلفة CIMA</span>
          </div>
        </div>

        {/* View Mode Switcher and Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'chart'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>{isRtl ? 'شجرة الهيكل التنظيمي' : 'Org Chart Tree'}</span>
            </button>

            <button
              onClick={() => setViewMode('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'directory'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'دليل الإدارات والوحدات' : 'Units Directory'}</span>
            </button>

            <button
              onClick={() => setViewMode('positions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'positions'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مصفوفة الوظائف والصلاحيات' : 'Positions & Authority Matrix'}</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={isRtl ? 'بحث بكود الوحدة أو المسمى أو المدير...' : 'Search unit, title, or lead...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`w-full py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 ${
                  isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>

            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">{isRtl ? 'كافة الأنواع' : 'All Unit Types'}</option>
              <option value="governance">{isRtl ? 'الحوكمة والإدارة العليا' : 'Governance'}</option>
              <option value="sector">{isRtl ? 'القطاعات الكبرى' : 'Sectors'}</option>
              <option value="department">{isRtl ? 'الإدارات التنفيذية' : 'Departments'}</option>
              <option value="branch">{isRtl ? 'الفروع الإقليمية' : 'Regional Branches'}</option>
            </select>

            {viewMode === 'chart' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={expandAll}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 rounded-lg text-[11px] font-bold"
                >
                  {isRtl ? 'توسيع الكل' : 'Expand'}
                </button>
                <button
                  onClick={collapseAll}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 rounded-lg text-[11px] font-bold"
                >
                  {isRtl ? 'طي الكل' : 'Collapse'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main View Presentation Body */}
      {viewMode === 'chart' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'المخطط الهيكلي التفاعلي المترابط' : 'Interactive Hierarchical Org Tree'}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {isRtl ? 'انقر على رمز العين لعرض مصفوفة الصلاحيات والربط المالي' : 'Click eye icon to view unit profile & authority matrix'}
            </span>
          </div>

          <div className="py-2">
            {renderTreeBranch(null, 0)}
          </div>
        </div>
      )}

      {viewMode === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map(unit => (
            <div
              key={unit.code}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex justify-between items-start">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black ${
                  unit.level === 1
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : unit.level === 2
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}>
                  {unit.code}
                </span>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                  {unit.type === 'governance' ? 'حوكمة عليا' : unit.type === 'sector' ? 'قطاع رئيسي' : unit.type === 'branch' ? 'فرع ميداني' : 'إدارة تنفيذية'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{isRtl ? unit.name_ar : unit.name_en}</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{unit.manager_title}: <strong className="text-slate-800 dark:text-zinc-200">{unit.manager_name}</strong></span>
                </p>
              </div>

              {/* Operational Metadata */}
              <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 text-[11px] space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>{isRtl ? 'مركز التكلفة المربوط:' : 'Cost Center:'}</span>
                  <button
                    onClick={() => onNavigateToCostCenter && onNavigateToCostCenter(unit.linked_cost_center_code)}
                    className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {unit.linked_cost_center_code}
                  </button>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>{isRtl ? 'الملاك / الفعلي:' : 'Headcount:'}</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">{unit.actual_headcount} من {unit.budgeted_headcount} وظائف</span>
                </div>
                <div className="flex justify-between text-slate-500 border-t border-slate-200 dark:border-zinc-800 pt-1">
                  <span>{isRtl ? 'الموازنة السنوية:' : 'Annual Budget:'}</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {unit.annual_budget_yer.toLocaleString()} {isRtl ? 'ر.ي' : 'YER'}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>{isRtl ? 'سقف الصلاحية المالية:' : 'Spending Limit:'}</span>
                  <span className="font-mono font-black">{unit.governance_delegation_limit_yer.toLocaleString()} ر.ي</span>
                </div>
              </div>

              <div className="pt-1 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">
                  {unit.linked_projects_count} {isRtl ? 'مشاريع مرتبطة' : 'projects'}
                </span>

                <button
                  onClick={() => setSelectedUnit(unit)}
                  className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isRtl ? 'التفاصيل والمسؤوليات' : 'Details'}</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'positions' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr className="bg-slate-900 text-amber-400 font-black text-[10px] uppercase border-b border-slate-800">
                  <th className="p-3 w-28">{isRtl ? 'كود المنصب' : 'Code'}</th>
                  <th className="p-3">{isRtl ? 'المسمى الوظيفي المعتمد' : 'Job Title'}</th>
                  <th className="p-3 w-40">{isRtl ? 'الإدارة التابع لها' : 'Department'}</th>
                  <th className="p-3 w-28 text-center">{isRtl ? 'المستوى' : 'Grade'}</th>
                  <th className="p-3 w-24 text-center">{isRtl ? 'المعتمد / الفعلي' : 'Count'}</th>
                  <th className="p-3 text-left w-40">{isRtl ? 'سقف الصلاحية المالية' : 'Authority Limit'}</th>
                  <th className="p-3 text-left w-44">{isRtl ? 'نطاق الراتب التقديري' : 'Salary Range'}</th>
                  <th className="p-3 text-center w-24">{isRtl ? 'الأهمية' : 'Critical'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
                {filteredPositions.map(pos => (
                  <tr key={pos.code} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-all font-semibold">
                    <td className="p-3 font-mono text-slate-900 dark:text-zinc-100 font-black text-[11px]">{pos.code}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      <div>{isRtl ? pos.title_ar : pos.title_en}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{pos.core_competencies.join(' • ')}</div>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-zinc-300 font-bold">{pos.department_name_ar}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                        {pos.grade_level}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span className={pos.occupied_count < pos.budgeted_count ? 'text-amber-600 font-black' : 'text-slate-800 dark:text-zinc-200'}>
                        {pos.occupied_count} / {pos.budgeted_count}
                      </span>
                    </td>
                    <td className="p-3 text-left font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {pos.approval_authority_limit_yer.toLocaleString()} {isRtl ? 'ر.ي' : 'YER'}
                    </td>
                    <td className="p-3 text-left font-mono text-slate-500 dark:text-zinc-400 text-[11px]">
                      {pos.salary_range_min_yer.toLocaleString()} - {pos.salary_range_max_yer.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      {pos.is_critical_role ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200">
                          {isRtl ? 'حرج' : 'Critical'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">{isRtl ? 'اعتيادي' : 'Standard'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Detail Drawer for Selected Unit */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full p-6 overflow-y-auto shadow-2xl space-y-6 border-r border-slate-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedUnit.code}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isRtl ? selectedUnit.name_ar : selectedUnit.name_en}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUnit(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Manager Contact Card */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700/60 space-y-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">{isRtl ? 'المسؤول المباشر' : 'Direct Supervisor'}</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                  {selectedUnit.manager_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{selectedUnit.manager_name}</h4>
                  <p className="text-[11px] text-slate-500">{selectedUnit.manager_title}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 text-xs space-y-1 text-slate-600 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono text-[11px]">{selectedUnit.manager_email}</span>
                </div>
                {selectedUnit.manager_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-mono text-[11px]">{selectedUnit.manager_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial & Governance Linkages */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">{isRtl ? 'الارتباط المالي والحوكمي' : 'Financial & Governance Links'}</h4>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">{isRtl ? 'مركز التكلفة المربوط' : 'Cost Center'}</span>
                  <button
                    onClick={() => {
                      setSelectedUnit(null);
                      if (onNavigateToCostCenter) onNavigateToCostCenter(selectedUnit.linked_cost_center_code);
                    }}
                    className="font-mono font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{selectedUnit.linked_cost_center_code}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">{isRtl ? 'سقف الصلاحية المالية' : 'Spending Threshold'}</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {selectedUnit.governance_delegation_limit_yer.toLocaleString()} ر.ي
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                <span className="text-[10px] text-slate-400 font-bold block">{isRtl ? 'الموازنة التشغيلية السنوية' : 'Annual Budget'}</span>
                <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                  {selectedUnit.annual_budget_yer.toLocaleString()} {isRtl ? 'ريال يمني' : 'YER'}
                </span>
              </div>
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">{isRtl ? 'المسؤوليات التشغيلية الرئيسية' : 'Primary Responsibilities'}</h4>
              <div className="space-y-1.5">
                {selectedUnit.primary_responsibilities.map((resp, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setSelectedUnit(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                {isRtl ? 'إغلاق بطاقة الإدارة' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'إضافة وحدة تنظيمية / إدارة جديدة' : 'Create New Org Unit'}</span>
              </h3>
              <button
                onClick={() => setShowAddUnitModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewUnit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'الكود التنظيمي (مثل DEP-LOG)' : 'Code'}</label>
                  <input
                    type="text"
                    required
                    value={newUnitForm.code}
                    onChange={e => setNewUnitForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-mono font-bold uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'نوع الوحدة' : 'Unit Type'}</label>
                  <select
                    value={newUnitForm.type}
                    onChange={e => setNewUnitForm(p => ({ ...p, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold"
                  >
                    <option value="department">{isRtl ? 'إدارة تنفيذية' : 'Department'}</option>
                    <option value="branch">{isRtl ? 'فرع إقليمي' : 'Regional Branch'}</option>
                    <option value="sector">{isRtl ? 'قطاع عام' : 'Sector'}</option>
                    <option value="unit">{isRtl ? 'وحدة / قسم تشغيلي' : 'Unit / Section'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'اسم الوحدة بالعربية' : 'Name (Arabic)'}</label>
                <input
                  type="text"
                  required
                  value={newUnitForm.name_ar}
                  onChange={e => setNewUnitForm(p => ({ ...p, name_ar: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'المدير المسؤول' : 'Lead'}</label>
                  <input
                    type="text"
                    required
                    value={newUnitForm.manager_name}
                    onChange={e => setNewUnitForm(p => ({ ...p, manager_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'مركز التكلفة المربوط' : 'Linked Cost Center'}</label>
                  <input
                    type="text"
                    required
                    value={newUnitForm.linked_cost_center_code}
                    onChange={e => setNewUnitForm(p => ({ ...p, linked_cost_center_code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'الموازنة التقديرية (ر.ي)' : 'Budget (YER)'}</label>
                  <input
                    type="number"
                    value={newUnitForm.annual_budget_yer}
                    onChange={e => setNewUnitForm(p => ({ ...p, annual_budget_yer: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'سقف الصلاحية المالية (ر.ي)' : 'Authority Limit'}</label>
                  <input
                    type="number"
                    value={newUnitForm.governance_delegation_limit_yer}
                    onChange={e => setNewUnitForm(p => ({ ...p, governance_delegation_limit_yer: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 rounded-xl font-bold transition-all cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all cursor-pointer shadow-xs"
                >
                  {isRtl ? 'حفظ الوحدة التنظيمية' : 'Save Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
