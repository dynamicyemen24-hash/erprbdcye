import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Target,
  Layers,
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  Scale,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FolderTree,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Table as TableIcon,
  Eye,
  Sliders,
  DollarSign,
  X
} from 'lucide-react';
import {
  STANDARD_COST_CENTERS,
  EnterpriseCostCenter,
  CostCenterCategory,
  CostDriverAllocation
} from '../../core/data/costCentersData';
import { printHTML, createPrintDocument, getCustomFooterHTML } from '../../lib/printUtils';

interface CostCentersManagementViewProps {
  lang: 'ar' | 'en';
  onSelectCostCenterForVoucher?: (ccCode: string) => void;
  onNavigateToTab?: (tabId: string) => void;
}

type CostCenterViewMode = 'tree' | 'table' | 'abc_allocator' | 'dimension_matrix';

export default function CostCentersManagementView({
  lang,
  onSelectCostCenterForVoucher,
  onNavigateToTab
}: CostCentersManagementViewProps) {
  const isRtl = lang === 'ar';

  const [costCenters, setCostCenters] = useState<EnterpriseCostCenter[]>(STANDARD_COST_CENTERS);
  const [viewMode, setViewMode] = useState<CostCenterViewMode>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVariance, setSelectedVariance] = useState<string>('all');

  // Drawer / Detail state
  const [selectedCC, setSelectedCC] = useState<EnterpriseCostCenter | null>(null);

  // Add Cost Center Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCCForm, setNewCCForm] = useState<Partial<EnterpriseCostCenter>>({
    code: '',
    name_ar: '',
    name_en: '',
    category: 'programs',
    manager_name: '',
    manager_title: 'مدير مركز التكلفة',
    linked_department_code: 'DEP-PRG',
    approved_budget_yer: 50000000,
    actual_expenses_yer: 0,
    committed_procurement_yer: 0,
    allocated_indirect_cost_yer: 0,
    total_incurred_cost_yer: 0,
    allocated_revenue_yer: 50000000,
    burn_rate_percent: 0,
    variance_status: 'NORMAL',
    is_active: true
  });

  // KPI Summary Strip
  const stats = useMemo(() => {
    const totalCount = costCenters.length;
    const totalApprovedBudget = costCenters.reduce((sum, c) => sum + c.approved_budget_yer, 0);
    const totalActualExpenses = costCenters.reduce((sum, c) => sum + c.actual_expenses_yer, 0);
    const totalCommitted = costCenters.reduce((sum, c) => sum + c.committed_procurement_yer, 0);
    const totalAllocatedIndirect = costCenters.reduce((sum, c) => sum + c.allocated_indirect_cost_yer, 0);
    const totalIncurred = costCenters.reduce((sum, c) => sum + c.total_incurred_cost_yer, 0);
    const totalRevenues = costCenters.reduce((sum, c) => sum + c.allocated_revenue_yer, 0);
    const overallBurnRate = totalApprovedBudget > 0 ? (totalIncurred / totalApprovedBudget) * 100 : 0;
    const netVarianceYer = totalApprovedBudget - totalIncurred;

    return {
      totalCount,
      totalApprovedBudget,
      totalActualExpenses,
      totalCommitted,
      totalAllocatedIndirect,
      totalIncurred,
      totalRevenues,
      overallBurnRate,
      netVarianceYer
    };
  }, [costCenters]);

  // Filtered List
  const filteredCostCenters = useMemo(() => {
    return costCenters.filter(cc => {
      const matchSearch =
        cc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cc.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cc.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cc.manager_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cc.linked_department_code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = selectedCategory === 'all' || cc.category === selectedCategory;
      const matchVariance = selectedVariance === 'all' || cc.variance_status === selectedVariance;

      return matchSearch && matchCategory && matchVariance;
    });
  }, [costCenters, searchTerm, selectedCategory, selectedVariance]);

  // Group by category for Tree View
  const groupedByCategory = useMemo(() => {
    const groups: Record<CostCenterCategory, EnterpriseCostCenter[]> = {
      programs: [],
      regional: [],
      operations: [],
      governance: []
    };

    filteredCostCenters.forEach(cc => {
      if (groups[cc.category]) {
        groups[cc.category].push(cc);
      }
    });

    return groups;
  }, [filteredCostCenters]);

  // Handle Save New Cost Center
  const handleSaveNewCC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCCForm.code || !newCCForm.name_ar) return;

    const budget = Number(newCCForm.approved_budget_yer) || 0;
    const actual = Number(newCCForm.actual_expenses_yer) || 0;
    const committed = Number(newCCForm.committed_procurement_yer) || 0;
    const allocated = Number(newCCForm.allocated_indirect_cost_yer) || 0;
    const totalIncurred = actual + committed + allocated;
    const burnRate = budget > 0 ? (totalIncurred / budget) * 100 : 0;

    const newEntry: EnterpriseCostCenter = {
      id: `cc-${Date.now()}`,
      code: newCCForm.code.toUpperCase(),
      name_ar: newCCForm.name_ar,
      name_en: newCCForm.name_en || newCCForm.name_ar,
      category: (newCCForm.category as any) || 'programs',
      category_name_ar:
        newCCForm.category === 'programs'
          ? 'البرامج والمشاريع الميدانية'
          : newCCForm.category === 'regional'
          ? 'الفروع والمكاتب الميدانية'
          : newCCForm.category === 'operations'
          ? 'العمليات اللوجستية والإسناد'
          : 'الحوكمة والإدارة العامة',
      parent_code: null,
      level: 1,
      manager_name: newCCForm.manager_name || 'قيد التعيين',
      manager_title: newCCForm.manager_title || 'مدير المركز',
      linked_department_code: newCCForm.linked_department_code || 'DEP-PRG',
      approved_budget_yer: budget,
      actual_expenses_yer: actual,
      committed_procurement_yer: committed,
      allocated_indirect_cost_yer: allocated,
      total_incurred_cost_yer: totalIncurred,
      allocated_revenue_yer: Number(newCCForm.allocated_revenue_yer) || budget,
      burn_rate_percent: Number(burnRate.toFixed(1)),
      variance_status: burnRate > 100 ? 'EXCEEDED' : burnRate > 90 ? 'WARNING' : 'NORMAL',
      linked_projects: [],
      cost_drivers: [],
      is_active: true,
      notes_ar: 'تم إنشاء مركز التكلفة حديثاً في النظام'
    };

    setCostCenters(prev => [...prev, newEntry]);
    setShowAddModal(false);
  };

  // Official A4 Print
  const handlePrintCostCentersReport = () => {
    const documentHTML = `
      <div style="font-family: 'Tajawal', sans-serif; direction: rtl; text-align: right; color: #0f172a; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #059669; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <img src="/UAMEX_ERPLOGO.png" style="height: 52px; object-fit: contain;" />
            <img src="/LogoRohamaab.png" style="height: 52px; object-fit: contain;" />
            <div>
              <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #059669;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">نظام يو امكس المؤسسي الشامل - التقرير التحليلي الرسمي لمراكز التكلفة ومطابقة الموازنات</p>
            </div>
          </div>
          <div style="text-align: left; font-size: 10px; color: #64748b;">
            <div><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-YE')}</div>
            <div><strong>العملة الرسمية:</strong> الريال اليمني (ر.ي)</div>
            <div><strong>المعيار المحاسبي:</strong> CIMA & IPSAS Overheads Standard</div>
          </div>
        </div>

        <div style="margin-bottom: 14px; background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px;">
          <div><strong>إجمالي مراكز التكلفة:</strong> ${stats.totalCount} مركز</div>
          <div><strong>إجمالي الموازنة المعتمدة:</strong> ${stats.totalApprovedBudget.toLocaleString()} ر.ي</div>
          <div><strong>المصروف الفعلي المباشر:</strong> ${stats.totalActualExpenses.toLocaleString()} ر.ي</div>
          <div><strong>التكاليف غير المباشرة ABC:</strong> ${stats.totalAllocatedIndirect.toLocaleString()} ر.ي</div>
          <div><strong>إجمالي التكاليف المحملة:</strong> ${stats.totalIncurred.toLocaleString()} ر.ي</div>
          <div><strong>معدل الاستنفاد العام:</strong> ${stats.overallBurnRate.toFixed(1)}%</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #0f172a; color: #fbbf24;">
              <th style="border: 1px solid #334155; padding: 6px; width: 12%;">كود المركز</th>
              <th style="border: 1px solid #334155; padding: 6px;">مسمى مركز التكلفة</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 14%;">المدير المسؤول</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 13%; text-align: left;">الموازنة المعتمدة</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 13%; text-align: left;">الفعلي المباشر</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 12%; text-align: left;">التكاليف غير المباشرة</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 13%; text-align: left;">إجمالي التكلفة</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 9%; text-align: center;">الاستنفاد</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 8%; text-align: center;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${costCenters.map((cc, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; font-family: monospace;">${cc.code}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">
                  ${cc.name_ar}
                  <div style="font-size: 8px; color: #64748b; font-weight: normal;">${cc.category_name_ar} • ${cc.linked_department_code}</div>
                </td>
                <td style="border: 1px solid #cbd5e1; padding: 6px;">${cc.manager_name}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; font-family: monospace;">${cc.approved_budget_yer.toLocaleString()} ر.ي</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; font-family: monospace;">${cc.actual_expenses_yer.toLocaleString()} ر.ي</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; font-family: monospace;">${cc.allocated_indirect_cost_yer.toLocaleString()} ر.ي</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; font-family: monospace; font-weight: bold;">${cc.total_incurred_cost_yer.toLocaleString()} ر.ي</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; font-family: monospace;">${cc.burn_rate_percent}%</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">
                  ${cc.variance_status === 'EXCEEDED' ? '<span style="color: #e11d48;">تجاوز</span>' : cc.variance_status === 'WARNING' ? '<span style="color: #d97706;">إنذار</span>' : '<span style="color: #059669;">مطابق</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; font-size: 11px;">
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">مسؤول مراكز التكلفة والموازنة</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">أ. سامي المنصوري</p>
          </div>
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">رئيس الحسابات العامة</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">أ. عمار السقاف</p>
          </div>
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">المدير المالي والامتثال</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">أ. ياسر باوزير</p>
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
        <title>تقرير مراكز التكلفة ومطابقة الموازنات - جمعية رُحماء بينهم</title>
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
    const headers = [
      'كود المركز',
      'مسمى مركز التكلفة',
      'المحور',
      'المدير المسؤول',
      'الإدارة التابع لها',
      'الموازنة المعتمدة ر.ي',
      'المصروف المباشر ر.ي',
      'الارتباطات الملتزم بها ر.ي',
      'التكاليف غير المباشرة ر.ي',
      'إجمالي التكلفة المحملة ر.ي',
      'نسبة الاستنفاد %',
      'حالة الانحراف'
    ];

    const rows = costCenters.map(cc => [
      cc.code,
      `"${cc.name_ar}"`,
      `"${cc.category_name_ar}"`,
      `"${cc.manager_name}"`,
      cc.linked_department_code,
      cc.approved_budget_yer,
      cc.actual_expenses_yer,
      cc.committed_procurement_yer,
      cc.allocated_indirect_cost_yer,
      cc.total_incurred_cost_yer,
      cc.burn_rate_percent,
      cc.variance_status
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `دليل_مراكز_التكلفة_المعتمد_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getVarianceBadge = (status: EnterpriseCostCenter['variance_status'], burnRate: number) => {
    if (status === 'EXCEEDED' || burnRate > 100) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>{isRtl ? 'تجاوز الموازنة' : 'Exceeded'}</span>
        </span>
      );
    }
    if (status === 'WARNING' || burnRate > 90) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          <span>{isRtl ? 'حرج (90%+)' : 'Warning'}</span>
        </span>
      );
    }
    if (status === 'FAVORABLE') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>{isRtl ? 'وفر مميز' : 'Favorable'}</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200">
        {isRtl ? 'طبيعي ومطابق' : 'Normal'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & KPI Cards */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Calculator className="w-6 h-6 text-emerald-600" />
              <span>{isRtl ? 'إدارة مراكز التكلفة ومحاسبة المسؤولية (Cost Centers OS)' : 'Standardized Cost Centers OS'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isRtl
                ? 'الهيكلية المعيارية لتحميل وتخصيص التكاليف المباشرة وغير المباشرة على البرامج الإنسانية والفروع وفق معايير CIMA وميثاق المحاسبة الدولية.'
                : 'Direct and indirect cost allocation architecture linking projects, branches, and shared operational overheads.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintCostCentersReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isRtl ? 'طباعة تقرير مراكز التكلفة A4' : 'Print A4 Report'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isRtl ? 'تصدير Excel (CSV)' : 'Export CSV'}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة مركز تكلفة' : 'New Cost Center'}</span>
            </button>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{isRtl ? 'إجمالي المراكز' : 'Total Centers'}</span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">{stats.totalCount}</p>
            <span className="text-[10px] text-slate-400 block">{costCenters.filter(c => c.category === 'programs').length} مراكز برامجية</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase block">{isRtl ? 'الموازنات المعتمدة' : 'Approved Budget'}</span>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {(stats.totalApprovedBudget / 1000000).toFixed(1)} <span className="text-xs font-sans font-bold">{isRtl ? 'مليون ر.ي' : 'M YER'}</span>
            </p>
            <span className="text-[10px] text-slate-400 block">معتمدة من مجلس الإدارة</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase block">{isRtl ? 'المصروف المباشر' : 'Direct Expenses'}</span>
            <p className="text-xl font-black text-blue-700 dark:text-blue-400 font-mono">
              {(stats.totalActualExpenses / 1000000).toFixed(1)} <span className="text-xs font-sans font-bold">{isRtl ? 'مليون ر.ي' : 'M YER'}</span>
            </p>
            <span className="text-[10px] text-slate-400 block">سندات صرف وقيد منفذة</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1">
            <span className="text-[10px] font-bold text-purple-600 uppercase block">{isRtl ? 'التكاليف غير المباشرة' : 'ABC Overheads'}</span>
            <p className="text-xl font-black text-purple-700 dark:text-purple-400 font-mono">
              {(stats.totalAllocatedIndirect / 1000000).toFixed(1)} <span className="text-xs font-sans font-bold">{isRtl ? 'مليون ر.ي' : 'M YER'}</span>
            </p>
            <span className="text-[10px] text-slate-400 block">محملة بمحركات الأنشطة</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
            <span className="text-[10px] font-bold text-amber-600 uppercase block">{isRtl ? 'إجمالي المحمل' : 'Total Incurred'}</span>
            <p className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono">
              {(stats.totalIncurred / 1000000).toFixed(1)} <span className="text-xs font-sans font-bold">{isRtl ? 'مليون ر.ي' : 'M YER'}</span>
            </p>
            <span className="text-[10px] text-slate-400 block">الفعلي + الارتباطات</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase block">{isRtl ? 'معدل الاستنفاد العام' : 'Burn Rate'}</span>
            <p className="text-xl font-black text-white font-mono">
              {stats.overallBurnRate.toFixed(1)}%
            </p>
            <span className="text-[10px] text-emerald-400 block">وفورات: {(stats.netVarianceYer / 1000000).toFixed(1)} م.ر.ي</span>
          </div>
        </div>

        {/* View Mode Bar and Filter Strip */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الشجرة والمحاور' : 'Tree & Pillars'}</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الجدول المالي والمطابقة' : 'Financial Table'}</span>
            </button>

            <button
              onClick={() => setViewMode('abc_allocator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'abc_allocator'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isRtl ? 'محاكي توزيع التكاليف ABC' : 'ABC Overheads Simulator'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={isRtl ? 'بحث بكود المركز أو الاسم أو المسؤول...' : 'Search center by code or name...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`w-full py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 ${
                  isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">{isRtl ? 'كافة المحاور' : 'All Pillars'}</option>
              <option value="programs">{isRtl ? 'البرامج والمشاريع الميدانية' : 'Programs'}</option>
              <option value="regional">{isRtl ? 'الفروع الإقليمية' : 'Regional Branches'}</option>
              <option value="operations">{isRtl ? 'العمليات وسلاسل الإمداد' : 'Operations & Logistics'}</option>
              <option value="governance">{isRtl ? 'الحوكمة والإدارة وتنمية الموارد' : 'Governance & Admin'}</option>
            </select>

            <select
              value={selectedVariance}
              onChange={e => setSelectedVariance(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">{isRtl ? 'كافة حالات الانحراف' : 'All Variance'}</option>
              <option value="NORMAL">{isRtl ? 'طبيعي ومطابق' : 'Normal'}</option>
              <option value="WARNING">{isRtl ? 'إنذار (قريب من السقف)' : 'Warning'}</option>
              <option value="EXCEEDED">{isRtl ? 'تجاوز الموازنة' : 'Exceeded'}</option>
              <option value="FAVORABLE">{isRtl ? 'وفر مميز' : 'Favorable'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Content Body */}
      {viewMode === 'tree' && (
        <div className="space-y-6">
          {(['programs', 'regional', 'operations', 'governance'] as CostCenterCategory[]).map(catKey => {
            const list = groupedByCategory[catKey];
            if (list.length === 0) return null;

            const catTitle =
              catKey === 'programs'
                ? '1. مراكز تكلفة البرامج والمشاريع الإنسانية (Direct Humanitarian Programs)'
                : catKey === 'regional'
                ? '2. مراكز تكلفة الفروع والمكاتب الميدانية (Regional Field Hubs)'
                : catKey === 'operations'
                ? '3. مراكز تكلفة العمليات اللوجستية والإسناد المشترك (Shared Supply Chain & Operations)'
                : '4. مراكز تكلفة الحوكمة والإدارة العامة وتنمية الموارد (Governance & Resource Mobilization)';

            const catBudgetTotal = list.reduce((s, c) => s + c.approved_budget_yer, 0);
            const catIncurredTotal = list.reduce((s, c) => s + c.total_incurred_cost_yer, 0);

            return (
              <div
                key={catKey}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4"
              >
                {/* Category Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase">{catTitle}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-500">
                      الموازنة: <strong className="text-slate-900 dark:text-white font-black">{(catBudgetTotal / 1000000).toFixed(1)}</strong> م.ر.ي
                    </span>
                    <span className="text-emerald-600 font-black">
                      المحمل: {(catIncurredTotal / 1000000).toFixed(1)} م.ر.ي
                    </span>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map(cc => (
                    <div
                      key={cc.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3 hover:border-emerald-500/50 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                          {cc.code}
                        </span>
                        {getVarianceBadge(cc.variance_status, cc.burn_rate_percent)}
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">{cc.name_ar}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {cc.manager_title}: <strong className="text-slate-700 dark:text-zinc-300">{cc.manager_name}</strong>
                        </p>
                      </div>

                      {/* Burn Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-500">{isRtl ? 'معدل الاستنفاد:' : 'Burn Rate:'}</span>
                          <span className={cc.burn_rate_percent > 100 ? 'text-rose-600 font-mono font-black' : 'text-emerald-600 font-mono font-black'}>
                            {cc.burn_rate_percent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              cc.burn_rate_percent > 100
                                ? 'bg-rose-500'
                                : cc.burn_rate_percent > 90
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(cc.burn_rate_percent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Financial Figures */}
                      <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-[11px] space-y-1">
                        <div className="flex justify-between text-slate-500">
                          <span>{isRtl ? 'الموازنة السنوية:' : 'Approved Budget:'}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-zinc-200">
                            {cc.approved_budget_yer.toLocaleString()} ر.ي
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>{isRtl ? 'الفعلي المباشر:' : 'Direct Actual:'}</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                            {cc.actual_expenses_yer.toLocaleString()} ر.ي
                          </span>
                        </div>
                        <div className="flex justify-between text-purple-600 dark:text-purple-400 font-bold border-t border-slate-100 dark:border-zinc-800 pt-1">
                          <span>{isRtl ? 'التكاليف غير المباشرة ABC:' : 'ABC Overheads:'}</span>
                          <span className="font-mono font-black">
                            {cc.allocated_indirect_cost_yer.toLocaleString()} ر.ي
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-extrabold border-t border-slate-100 dark:border-zinc-800 pt-1">
                          <span>{isRtl ? 'إجمالي المحمل:' : 'Total Incurred:'}</span>
                          <span className="font-mono font-black">
                            {cc.total_incurred_cost_yer.toLocaleString()} ر.ي
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-1 text-xs">
                        <button
                          onClick={() => setSelectedCC(cc)}
                          className="font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'تحليل التكلفة' : 'Analyze'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onSelectCostCenterForVoucher) {
                              onSelectCostCenterForVoucher(cc.code);
                            } else if (onNavigateToTab) {
                              onNavigateToTab('entry');
                            }
                          }}
                          className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-[10px] font-black transition-colors cursor-pointer"
                        >
                          {isRtl ? '+ قيد / سند صرف' : '+ Entry'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr className="bg-slate-900 text-amber-400 font-black text-[10px] uppercase border-b border-slate-800">
                  <th className="p-3 w-32">{isRtl ? 'كود المركز' : 'Code'}</th>
                  <th className="p-3">{isRtl ? 'مسمى مركز التكلفة' : 'Cost Center Title'}</th>
                  <th className="p-3 w-36">{isRtl ? 'المحور / الإدارة' : 'Category'}</th>
                  <th className="p-3 w-36">{isRtl ? 'المدير المسؤول' : 'Lead'}</th>
                  <th className="p-3 text-left w-36">{isRtl ? 'الموازنة المعتمدة' : 'Approved Budget'}</th>
                  <th className="p-3 text-left w-36">{isRtl ? 'الفعلي المباشر' : 'Direct Actual'}</th>
                  <th className="p-3 text-left w-36">{isRtl ? 'تكاليف غير مباشرة' : 'ABC Overheads'}</th>
                  <th className="p-3 text-left w-36">{isRtl ? 'إجمالي التكلفة' : 'Total Incurred'}</th>
                  <th className="p-3 text-center w-24">{isRtl ? 'الاستنفاد' : 'Burn %'}</th>
                  <th className="p-3 text-center w-28">{isRtl ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
                {filteredCostCenters.map(cc => (
                  <tr key={cc.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-all font-semibold">
                    <td className="p-3 font-mono text-slate-900 dark:text-zinc-100 font-black text-[11px]">{cc.code}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      <div>{cc.name_ar}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{cc.notes_ar}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-zinc-400">
                      <div>{cc.category_name_ar}</div>
                      <span className="font-mono text-[10px] text-slate-400">{cc.linked_department_code}</span>
                    </td>
                    <td className="p-3 text-slate-800 dark:text-zinc-200">{cc.manager_name}</td>
                    <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-white">
                      {cc.approved_budget_yer.toLocaleString()} {isRtl ? 'ر.ي' : 'YER'}
                    </td>
                    <td className="p-3 text-left font-mono text-slate-700 dark:text-zinc-300">
                      {cc.actual_expenses_yer.toLocaleString()} {isRtl ? 'ر.ي' : 'YER'}
                    </td>
                    <td className="p-3 text-left font-mono text-purple-600 dark:text-purple-400 font-bold">
                      {cc.allocated_indirect_cost_yer.toLocaleString()} {isRtl ? 'ر.ي' : 'YER'}
                    </td>
                    <td className="p-3 text-left font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {cc.total_incurred_cost_yer.toLocaleString()} {isRtl ? 'ر.ي' : 'YER'}
                    </td>
                    <td className="p-3 text-center font-mono font-black">
                      <span className={cc.burn_rate_percent > 100 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}>
                        {cc.burn_rate_percent}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {getVarianceBadge(cc.variance_status, cc.burn_rate_percent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'abc_allocator' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>{isRtl ? 'محاكي تحميل التكاليف غير المباشرة بنظام الأنشطة (Activity-Based Costing Simulator)' : 'Activity-Based Overheads Allocation Simulator'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {isRtl
                  ? 'نموذج رياضي يعتمد على محركات التكلفة الواقعية (Cost Drivers) لتوزيع تكاليف المخازن والنقل والإدارة على مراكز التكلفة البرامجية والمشاريع الميدانية.'
                  : 'Distributing indirect administrative and logistics expenses to project centers using actual cost drivers.'}
              </p>
            </div>

            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl text-xs font-black border border-emerald-200">
              معيار CIMA ABC-01
            </span>
          </div>

          {/* Allocation Drivers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                poolTitle: 'مجمع تكاليف المستودعات المركزية',
                code: 'POOL-WH',
                totalPoolYer: 42000000,
                driverName: 'مساحة التخزين المشغولة (م² / شهر)',
                totalUnits: 1200,
                rateYer: 35000,
                beneficiaries: [
                  { name: 'مشاريع الأمن الغذائي والسلال', shareYer: 21000000, units: 600 },
                  { name: 'مشاريع الإيواء ومخيمات النازحين', shareYer: 12600000, units: 360 },
                  { name: 'مشاريع كفالة الأيتام والكسوة', shareYer: 8400000, units: 240 }
                ]
              },
              {
                poolTitle: 'مجمع تكاليف أسطول النقل والشاحنات الميدانية',
                code: 'POOL-FLEET',
                totalPoolYer: 28000000,
                driverName: 'كيلومترات التشغيل والرحلات الجبلية',
                totalUnits: 45000,
                rateYer: 622,
                beneficiaries: [
                  { name: 'فرع تعز وعمليات جبل صبر', shareYer: 14000000, units: 22500 },
                  { name: 'مكتب الإغاثة الطارئة - الحديدة', shareYer: 8400000, units: 13500 },
                  { name: 'فرع العاصمة صنعاء والمحيط', shareYer: 5600000, units: 9000 }
                ]
              },
              {
                poolTitle: 'مجمع تكاليف الشراء والمناقصات والعقود',
                code: 'POOL-PROC',
                totalPoolYer: 35000000,
                driverName: 'عدد أوامر الشراء ومناقصات التوريد',
                totalUnits: 160,
                rateYer: 218750,
                beneficiaries: [
                  { name: 'مشاريع المياه والإصحاح البيئي', shareYer: 17500000, units: 80 },
                  { name: 'مشاريع الأمن الغذائي', shareYer: 10500000, units: 48 },
                  { name: 'فرع تعز والمشاريع الإنشائية', shareYer: 7000000, units: 32 }
                ]
              }
            ].map(pool => (
              <div
                key={pool.code}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {pool.code}
                  </span>
                  <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                    {(pool.totalPoolYer / 1000000).toFixed(1)} مليون ر.ي
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900 dark:text-white">{pool.poolTitle}</h4>

                <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-[11px] space-y-1">
                  <div className="text-slate-500 flex justify-between">
                    <span>محرك التكلفة:</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">{pool.driverName}</span>
                  </div>
                  <div className="text-slate-500 flex justify-between">
                    <span>إجمالي الوحدات:</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">{pool.totalUnits}</span>
                  </div>
                  <div className="text-emerald-600 flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-1 font-bold">
                    <span>معدل التحميل للوحدة:</span>
                    <span className="font-mono font-black">{pool.rateYer.toLocaleString()} ر.ي</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">نتائج التوزيع على المراكز:</span>
                  {pool.beneficiaries.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg"
                    >
                      <span className="text-slate-700 dark:text-zinc-300">{b.name}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {(b.shareYer / 1000000).toFixed(1)} م.ر.ي
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Detail Drawer for Cost Center */}
      {selectedCC && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full p-6 overflow-y-auto shadow-2xl space-y-6 border-r border-slate-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedCC.code}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedCC.name_ar}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCC(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Overview Card */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700/60 space-y-3">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">{isRtl ? 'الموقف المالي للمركز' : 'Financial Status'}</span>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? 'الموازنة المعتمدة' : 'Approved Budget'}</span>
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                    {selectedCC.approved_budget_yer.toLocaleString()} ر.ي
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? 'إجمالي المحمل' : 'Total Incurred'}</span>
                  <span className="font-mono text-sm font-black text-emerald-600">
                    {selectedCC.total_incurred_cost_yer.toLocaleString()} ر.ي
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-zinc-700">
                <span className="text-slate-500 font-bold">{isRtl ? 'الوفورات المتبقية:' : 'Remaining Savings:'}</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  {(selectedCC.approved_budget_yer - selectedCC.total_incurred_cost_yer).toLocaleString()} ر.ي
                </span>
              </div>
            </div>

            {/* Linked Projects */}
            {selectedCC.linked_projects.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">{isRtl ? 'المشاريع الميدانية المرتبطة' : 'Linked Projects'}</h4>
                <div className="space-y-1.5">
                  {selectedCC.linked_projects.map(prj => (
                    <div key={prj.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono text-[10px] text-emerald-600 font-black block">{prj.code}</span>
                        <p className="font-bold text-slate-800 dark:text-zinc-200">{prj.name_ar}</p>
                      </div>
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {prj.share_percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Drivers */}
            {selectedCC.cost_drivers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">{isRtl ? 'محركات التكلفة المحملة (Cost Drivers)' : 'Cost Drivers'}</h4>
                <div className="space-y-1.5">
                  {selectedCC.cost_drivers.map((cd, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-800 dark:text-zinc-200">
                        <span>{cd.driver_name_ar}</span>
                        <span className="font-mono text-purple-600 font-black">{cd.total_allocated_yer.toLocaleString()} ر.ي</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{cd.units_consumed} وحدة</span>
                        <span>{cd.cost_per_unit_yer.toLocaleString()} ر.ي / وحدة</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
              <button
                onClick={() => {
                  setSelectedCC(null);
                  if (onSelectCostCenterForVoucher) {
                    onSelectCostCenterForVoucher(selectedCC.code);
                  } else if (onNavigateToTab) {
                    onNavigateToTab('entry');
                  }
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
              >
                {isRtl ? 'تسجيل قيد / سند صرف على هذا المركز' : 'Add Voucher for Cost Center'}
              </button>

              <button
                onClick={() => setSelectedCC(null)}
                className="w-full py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Cost Center Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'إنشاء مركز تكلفة جديد' : 'Create New Cost Center'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCC} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'كود المركز (مثل CC-PRG-NEW)' : 'Code'}</label>
                  <input
                    type="text"
                    required
                    value={newCCForm.code}
                    onChange={e => setNewCCForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-mono font-bold uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'المحور التصنيفي' : 'Category'}</label>
                  <select
                    value={newCCForm.category}
                    onChange={e => setNewCCForm(p => ({ ...p, category: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold"
                  >
                    <option value="programs">{isRtl ? 'البرامج والمشاريع الميدانية' : 'Programs'}</option>
                    <option value="regional">{isRtl ? 'الفروع والمكاتب الميدانية' : 'Regional'}</option>
                    <option value="operations">{isRtl ? 'العمليات وسلاسل الإمداد' : 'Operations'}</option>
                    <option value="governance">{isRtl ? 'الحوكمة والإدارة وتنمية الموارد' : 'Governance'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'مسمى مركز التكلفة بالعربية' : 'Title (Arabic)'}</label>
                <input
                  type="text"
                  required
                  value={newCCForm.name_ar}
                  onChange={e => setNewCCForm(p => ({ ...p, name_ar: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'المدير المسؤول' : 'Lead'}</label>
                  <input
                    type="text"
                    required
                    value={newCCForm.manager_name}
                    onChange={e => setNewCCForm(p => ({ ...p, manager_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'الإدارة التابع لها' : 'Department'}</label>
                  <input
                    type="text"
                    required
                    value={newCCForm.linked_department_code}
                    onChange={e => setNewCCForm(p => ({ ...p, linked_department_code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-zinc-400">{isRtl ? 'الموازنة التقديرية المعتمدة (ر.ي)' : 'Budget (YER)'}</label>
                <input
                  type="number"
                  required
                  value={newCCForm.approved_budget_yer}
                  onChange={e => setNewCCForm(p => ({ ...p, approved_budget_yer: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 rounded-xl font-bold transition-all cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all cursor-pointer shadow-xs"
                >
                  {isRtl ? 'حفظ مركز التكلفة' : 'Save Center'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
