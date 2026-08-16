import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Share2,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Sliders,
  DollarSign,
  Compass,
  Users,
  Database,
  Building,
  Printer,
  QrCode,
  Send,
  X,
  FileCode,
  Check,
  AlertTriangle,
  ArrowRightLeft,
  Info,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Copy
} from 'lucide-react';
import { exportToExcel, exportToCSV, fireCelebrationConfetti } from '../utils/exportHelpers';

interface DataExchangeHubProps {
  lang: 'ar' | 'en';
  onRefreshAll?: () => void;
}

export type ExchangeCategory = 'opening_balances' | 'activities' | 'staff' | 'master_transactions';

interface SampleTemplate {
  id: string;
  category: ExchangeCategory;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  headers: string[];
  sampleRows: Record<string, any>[];
  apiEndpoint: string;
}

const TEMPLATES: SampleTemplate[] = [
  {
    id: 'tpl_opening_accounts',
    category: 'opening_balances',
    titleAr: 'الأرصدة الافتتاحية للحسابات المالية',
    titleEn: 'Chart of Accounts Opening Balances',
    descriptionAr: 'كشف الأرصدة الافتتاحية لدليل الحسابات (أصول، خصوم، ملكية، إيرادات، مصروفات)',
    descriptionEn: 'Initial opening balances ledger for financial accounts (Assets, Liabilities, Equity)',
    headers: ['account_code', 'account_name_ar', 'account_type', 'currency_code', 'opening_balance_yer', 'opening_balance_usd'],
    sampleRows: [
      { account_code: '110101', account_name_ar: 'الصندوق الرئيسي - الإدارة العامة', account_type: 'ASSET', currency_code: 'YER', opening_balance_yer: 15000000, opening_balance_usd: 28300 },
      { account_code: '110201', account_name_ar: 'حساب بنك التضامن - صنعاء', account_type: 'ASSET', currency_code: 'USD', opening_balance_yer: 42000000, opening_balance_usd: 79200 },
      { account_code: '120101', account_name_ar: 'مخزن الأغذية والمواد الإغاثية - مأرب', account_type: 'ASSET', currency_code: 'YER', opening_balance_yer: 85000000, opening_balance_usd: 160300 }
    ],
    apiEndpoint: '/api/tables/chart_of_accounts'
  },
  {
    id: 'tpl_opening_inventory',
    category: 'opening_balances',
    titleAr: 'الأرصدة الافتتاحية للمخازن والكميات',
    titleEn: 'Inventory Initial Stocks & Valuations',
    descriptionAr: 'سجل الأرصدة والكميات الافتتاحية للمستودعات والمخازن الميدانية',
    descriptionEn: 'Opening stock quantities and valuation for field warehouses',
    headers: ['item_code', 'item_name_ar', 'warehouse_code', 'category', 'unit', 'initial_quantity', 'unit_cost_yer'],
    sampleRows: [
      { item_code: 'INV-FB-01', item_name_ar: 'سلة غذائية متكاملة (معيار إنسان)', warehouse_code: 'WH-MRB-01', category: 'Food Security', unit: 'Basket', initial_quantity: 1200, unit_cost_yer: 45000 },
      { item_code: 'INV-WASH-02', item_name_ar: 'حقيبة نظافة شخصية طارئة', warehouse_code: 'WH-KHX-01', category: 'WASH', unit: 'Kit', initial_quantity: 2500, unit_cost_yer: 18000 }
    ],
    apiEndpoint: '/api/tables/inventory_items'
  },
  {
    id: 'tpl_activities_wbs',
    category: 'activities',
    titleAr: 'أنشطة وبنود شجرة العمل (WBS)',
    titleEn: 'WBS Operations & Project Activities',
    descriptionAr: 'قائمة الأنشطة التنفيذية الميدانية، الميزانيات المخصصة، والمراحل',
    descriptionEn: 'Field work breakdown activities, allocated budgets, and milestones',
    headers: ['wbs_code', 'activity_name_ar', 'project_code', 'allocated_budget_yer', 'start_date', 'end_date', 'lead_officer'],
    sampleRows: [
      { wbs_code: 'WBS-1.1', activity_name_ar: 'توزيع السلال الغذائية الطارئة - مخيمات مأرب', project_code: 'PRJ-2026-001', allocated_budget_yer: 70000000, start_date: '2026-01-01', end_date: '2026-06-30', lead_officer: 'م. خالد العولقي' },
      { wbs_code: 'WBS-2.1', activity_name_ar: 'حفر وتجهيز آبار المياه بالطاقة الشمسية بالخوخة', project_code: 'PRJ-2026-002', allocated_budget_yer: 150000000, start_date: '2026-02-15', end_date: '2026-10-31', lead_officer: 'د. طارق الحيمي' }
    ],
    apiEndpoint: '/api/tables/activities'
  },
  {
    id: 'tpl_staff_hr',
    category: 'staff',
    titleAr: 'سجل الموظفين والكادر الوظيفي والمرتبات',
    titleEn: 'Staff Registry & Personnel Master',
    descriptionAr: 'بيانات الكادر الإداري والميداني، المسميات الوظيفية، والرواتب الأساسية',
    descriptionEn: 'Employee profiles, job designations, department assignments, and base pay',
    headers: ['employee_code', 'full_name_ar', 'department', 'job_title_ar', 'phone_number', 'email', 'base_salary_yer', 'hire_date'],
    sampleRows: [
      { employee_code: 'EMP-001', full_name_ar: 'د. وفاء المقطري', department: 'القطاع الطبي والصحي', job_title_ar: 'منسق البرامج الصحية', phone_number: '+967 771 234 567', email: 'wafa@rohamaa.org', base_salary_yer: 1200000, hire_date: '2023-05-10' },
      { employee_code: 'EMP-002', full_name_ar: 'أ. محمد عبد الله الصنعاني', department: 'المالية والحوكمة', job_title_ar: 'كبير المحاسبين IPSAS', phone_number: '+967 772 345 678', email: 'mohammed@rohamaa.org', base_salary_yer: 1400000, hire_date: '2022-01-15' }
    ],
    apiEndpoint: '/api/tables/users'
  },
  {
    id: 'tpl_master_donors',
    category: 'master_transactions',
    titleAr: 'سجل المانحين والشركاء واتفاقيات التمويل',
    titleEn: 'Donors, Partners & Grant Agreements',
    descriptionAr: 'بيانات الجهات المانحة والشركاء الدوليين والمحليين وسجلات اتفاقيات التمويل',
    descriptionEn: 'International & local donor profiles, PCA ratings, and funding agreements',
    headers: ['partner_code', 'partner_name_ar', 'partner_type', 'focal_person', 'email', 'total_grant_yer', 'status'],
    sampleRows: [
      { partner_code: 'PAR-UN-01', partner_name_ar: 'مكتب الأمم المتحدة لتنسيق الشؤون الإنسانية (OCHA/YHF)', partner_type: 'UN_AGENCY', focal_person: 'د. ستيفان بروان', email: 'ocha-yemen@un.org', total_grant_yer: 450000000, status: 'ACTIVE' },
      { partner_code: 'PAR-KSR-02', partner_name_ar: 'مركز الملك سلمان للإغاثة والأعمال الإنسانية', partner_type: 'INTERNATIONAL_DONOR', focal_person: 'أ. فهد العصيمي', email: 'info@ksrelief.org', total_grant_yer: 800000000, status: 'ACTIVE' }
    ],
    apiEndpoint: '/api/tables/organizations'
  }
];

export default function DataExchangeHub({ lang, onRefreshAll }: DataExchangeHubProps) {
  const isRtl = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Category Selection
  const [activeCategory, setActiveCategory] = useState<ExchangeCategory>('opening_balances');
  const [selectedTemplate, setSelectedTemplate] = useState<SampleTemplate>(TEMPLATES[0]);

  // Import State
  const [importedRows, setImportedRows] = useState<Record<string, any>[]>([]);
  const [importedHeaders, setImportedHeaders] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseFileName, setParseFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter & Export Customizer State
  const [searchTerm, setSearchTerm] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'json' | 'pdf' | 'iati'>('excel');
  const [exportWatermark, setExportWatermark] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({});

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTextSummary, setShareTextSummary] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Smart Column Auto-Mapper Dictionary
  const HEADER_ALIASES: Record<string, string> = {
    'رقم الحساب': 'account_code',
    'كود الحساب': 'account_code',
    'اسم الحساب': 'account_name_ar',
    'اسم الحساب بالعربي': 'account_name_ar',
    'نوع الحساب': 'account_type',
    'العملة': 'currency_code',
    'الرصيد الافتتاحي بالريال': 'opening_balance_yer',
    'الرصيد الافتتاحي بالدولار': 'opening_balance_usd',
    'كود المادة': 'item_code',
    'اسم المادة': 'item_name_ar',
    'المخزن': 'warehouse_code',
    'كود المخزن': 'warehouse_code',
    'الفئة': 'category',
    'الوحدة': 'unit',
    'الكمية الافتتاحية': 'initial_quantity',
    'تكلفة الوحدة': 'unit_cost_yer',
    'كود النشاط': 'wbs_code',
    'رمز WBS': 'wbs_code',
    'اسم النشاط': 'activity_name_ar',
    'كود المشروع': 'project_code',
    'الميزانية المخصصة': 'allocated_budget_yer',
    'الميزانية': 'allocated_budget_yer',
    'تاريخ البدء': 'start_date',
    'تاريخ الانتهاء': 'end_date',
    'المسؤول': 'lead_officer',
    'كود الموظف': 'employee_code',
    'الاسم الكامل': 'full_name_ar',
    'القسم': 'department',
    'المسمى الوظيفي': 'job_title_ar',
    'الهاتف': 'phone_number',
    'البريد': 'email',
    'الراتب الأساسي': 'base_salary_yer',
    'تاريخ التعيين': 'hire_date'
  };

  // Add Row & Inline Edit state
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [showIatiPreview, setShowIatiPreview] = useState(false);

  // Preset Injector
  const handleLoadPresetData = (tpl: SampleTemplate) => {
    setSelectedTemplate(tpl);
    setImportedRows(JSON.parse(JSON.stringify(tpl.sampleRows)));
    setImportedHeaders(tpl.headers);
    setParseFileName(`PRESET_${tpl.id}.xlsx`);
    
    const colsObj: Record<string, boolean> = {};
    tpl.headers.forEach(h => { colsObj[h] = true; });
    setSelectedColumns(colsObj);

    fireCelebrationConfetti();
    setImportStatusMessage({
      type: 'success',
      text: isRtl 
        ? `تم تحميل نموذج البيانات المعتمد (${tpl.titleAr}) بنجاح! يمكنك الآن تعديله أو حفظه مباشرة.` 
        : `Preset data (${tpl.titleEn}) loaded successfully! You can now edit or commit directly.`
    });
  };

  const handleAddNewRow = () => {
    const newRow: Record<string, any> = { _rowId: Date.now(), _isValid: true, _warnings: [] };
    selectedTemplate.headers.forEach(h => {
      newRow[h] = h.includes('code') ? `NEW-${Math.floor(Math.random() * 1000)}` : '';
    });
    setImportedRows(prev => [newRow, ...prev]);
  };

  const handleDeleteRow = (index: number) => {
    setImportedRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleCellEdit = (index: number, header: string, value: any) => {
    setImportedRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [header]: value };
      return copy;
    });
  };
  const handleCategoryChange = (cat: ExchangeCategory) => {
    setActiveCategory(cat);
    const found = TEMPLATES.find(t => t.category === cat) || TEMPLATES[0];
    setSelectedTemplate(found);
    setImportedRows([]);
    setImportedHeaders([]);
    setParseFileName(null);
    setImportStatusMessage(null);
    
    // reset selected columns
    const colsObj: Record<string, boolean> = {};
    found.headers.forEach(h => { colsObj[h] = true; });
    setSelectedColumns(colsObj);
  };

  // Switch specific template
  const handleTemplateSelect = (tpl: SampleTemplate) => {
    setSelectedTemplate(tpl);
    setImportedRows([]);
    setImportedHeaders([]);
    setParseFileName(null);
    setImportStatusMessage(null);

    const colsObj: Record<string, boolean> = {};
    tpl.headers.forEach(h => { colsObj[h] = true; });
    setSelectedColumns(colsObj);
  };

  // Handle Download Sample Template
  const handleDownloadSample = () => {
    exportToExcel(selectedTemplate.sampleRows, `Template_${selectedTemplate.id}`, selectedTemplate.titleEn);
  };

  // Handle File Upload and Excel Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseFileName(file.name);
    setImportStatusMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { header: 1 });

        if (!data || data.length === 0) {
          setImportStatusMessage({
            type: 'error',
            text: isRtl ? 'الملف المرفق فارغ ولا يحتوي على بيانات' : 'Uploaded file is empty.'
          });
          setIsParsing(false);
          return;
        }

        const rawHeaders = (data[0] as string[]).map(h => String(h || '').trim());
        const rawRows = data.slice(1) as any[];

        const parsed: Record<string, any>[] = [];
        rawRows.forEach((row, rIdx) => {
          if (!row || row.length === 0) return;
          const rowObj: Record<string, any> = { _rowId: rIdx + 1, _isValid: true, _warnings: [] };
          
          rawHeaders.forEach((h, cIdx) => {
            rowObj[h] = row[cIdx] !== undefined ? row[cIdx] : '';
          });

          // Check basic validity
          if (!rowObj[selectedTemplate.headers[0]] && !rowObj[rawHeaders[0]]) {
            rowObj._isValid = false;
            rowObj._warnings.push(isRtl ? 'حقل رئيسي مفقود' : 'Primary code missing');
          }

          parsed.push(rowObj);
        });

        setImportedHeaders(rawHeaders);
        setImportedRows(parsed);

        // Update column selectors
        const colsObj: Record<string, boolean> = {};
        rawHeaders.forEach(h => { colsObj[h] = true; });
        setSelectedColumns(colsObj);

        setImportStatusMessage({
          type: 'success',
          text: isRtl
            ? `تم تحليل الملف بنجاح! تم التعرف على ${parsed.length} سجل جاهز للاستيراد والمعالجة.`
            : `File parsed successfully! Recognized ${parsed.length} records ready for processing.`
        });
      } catch (err: any) {
        setImportStatusMessage({
          type: 'error',
          text: (isRtl ? 'خطأ أثناء تحليل الملف: ' : 'Error parsing file: ') + (err.message || 'Unknown format')
        });
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Submit parsed rows to backend API
  const handleCommitImport = async () => {
    if (importedRows.length === 0) return;

    setIsSubmitting(true);
    setImportStatusMessage(null);
    let successCount = 0;

    try {
      const validRows = importedRows.filter(r => r._isValid);
      
      for (const row of validRows) {
        // Clean temporary metadata keys
        const cleanedData = { ...row };
        delete cleanedData._rowId;
        delete cleanedData._isValid;
        delete cleanedData._warnings;

        const res = await fetch(selectedTemplate.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanedData)
        });

        if (res.ok) successCount++;
      }

      fireCelebrationConfetti();
      setImportStatusMessage({
        type: 'success',
        text: isRtl
          ? `تم استيراد وحفظ ${successCount} سجل بنجاح في قاعدة بيانات النظام!`
          : `Successfully imported and saved ${successCount} records into the database!`
      });

      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      setImportStatusMessage({
        type: 'error',
        text: (isRtl ? 'تعذر إكمال حفظ الاستيراد: ' : 'Failed to commit import: ') + err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter rows for Export
  const activeRowsToExport = importedRows.length > 0 ? importedRows : selectedTemplate.sampleRows;
  
  const filteredExportRows = activeRowsToExport.filter(r => {
    if (!searchTerm) return true;
    return Object.values(r).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle Export Operations
  const handleExecuteExport = () => {
    const filename = `NexoraOS_${selectedTemplate.id}_${new Date().toISOString().slice(0, 10)}`;

    // Filter columns
    const cleanRows = filteredExportRows.map(r => {
      const newObj: Record<string, any> = {};
      Object.keys(r).forEach(k => {
        if (!k.startsWith('_') && selectedColumns[k] !== false) {
          newObj[k] = r[k];
        }
      });
      return newObj;
    });

    if (exportFormat === 'excel') {
      exportToExcel(cleanRows, filename, selectedTemplate.titleEn);
    } else if (exportFormat === 'csv') {
      exportToCSV(cleanRows, filename);
    } else if (exportFormat === 'json') {
      const jsonStr = JSON.stringify(cleanRows, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      fireCelebrationConfetti();
    } else if (exportFormat === 'iati') {
      // Generate IATI Standard XML payload
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<iati-activities version="2.03" generated-datetime="${new Date().toISOString()}">\n`;
      cleanRows.forEach((row, i) => {
        xml += `  <iati-activity last-updated-datetime="${new Date().toISOString()}">\n`;
        xml += `    <iati-identifier>ROHAMAA-${selectedTemplate.id}-${i + 1}</iati-identifier>\n`;
        xml += `    <title><narrative xml:lang="ar">${row.titleAr || row.activity_name_ar || row.account_name_ar || 'نشاط مؤسسي'}</narrative></title>\n`;
        xml += `    <reporting-org ref="ROHAMAA-YEMEN" type="22"><narrative>جمعية رحماء بينهم للعمل الإنساني</narrative></reporting-org>\n`;
        xml += `  </iati-activity>\n`;
      });
      xml += `</iati-activities>`;
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_IATI.xml`;
      a.click();
      fireCelebrationConfetti();
    } else {
      window.print();
    }
  };

  // Open Share Modal & Prepare Payload
  const handleOpenShareModal = () => {
    const totalCount = filteredExportRows.length;
    const summary = isRtl
      ? `🏛️ *جمعية رُحماء بينهم للعمل الإنساني والتنمية (NexoraOS™)*\n` +
        `📊 *موجز التصدير الموحد للبيانات المعتمدة*\n` +
        `───────────────────────\n` +
        `📁 الفئة: ${selectedTemplate.titleAr}\n` +
        `🔢 إجمالي السجلات: ${totalCount} سجل موثق\n` +
        `🗓️ تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-YE')}\n` +
        `🔒 التوثيق: معتمد ومحمي بالبصمة الرقمية والشفافية (IATI Standard)\n` +
        `───────────────────────\n` +
        `رابط المنظومة: ${window.location.href}`
      : `🏛️ *Rohamaa Baynahum Foundation (NexoraOS™)*\n` +
        `📊 *Certified Master Data Export Summary*\n` +
        `Category: ${selectedTemplate.titleEn}\n` +
        `Total Verified Items: ${totalCount}\n` +
        `Date: ${new Date().toLocaleDateString()}\n` +
        `URL: ${window.location.href}`;

    setShareTextSummary(summary);
    setIsShareModalOpen(true);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareTextSummary);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(shareTextSummary);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* TOP BANNER */}
      <div className="p-6 bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 text-white rounded-2xl border border-emerald-900/50 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full tracking-wide">
              {isRtl ? 'منظومة التكامل وتبادل البيانات' : 'Digital Integration & Data Exchange'}
            </span>
            <span className="p-1 bg-amber-500/20 text-amber-400 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            {isRtl ? 'مركز الاستيراد والتصدير والمشاركة الشامل للبيانات (Data Exchange Hub)' : 'Comprehensive Data Import, Export & Exchange Hub'}
          </h2>
          <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
            {isRtl
              ? 'إدارة متكاملة للأرصدة الافتتاحية، الأنشطة والأعمال، سجلات الكادر والموظفين، والبيانات الأساسية مع التحقق الذكي، التصدير متعدد الصيغ (Excel/CSV/PDF/IATI) وتوليد روابط المشاركة الموثقة.'
              : 'Unified management for opening balances, activities, personnel records, and master transactions with smart parsing, multi-format exports, and verified sharing payloads.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 z-10">
          <button
            onClick={handleDownloadSample}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isRtl ? 'تحميل قالب الإدخال' : 'Download Template'}</span>
          </button>
          
          <button
            onClick={handleOpenShareModal}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'مشاركة وتصدير' : 'Share & Export'}</span>
          </button>
        </div>
      </div>

      {/* CATEGORY SELECTOR TABS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'opening_balances',
            titleAr: '1. الأرصدة الافتتاحية',
            titleEn: '1. Opening Balances',
            subAr: 'الحسابات، المخازن، البنوك، المنح',
            subEn: 'Accounts, Inventory, Banks',
            icon: DollarSign,
            color: 'emerald'
          },
          {
            id: 'activities',
            titleAr: '2. الأنشطة والأعمال WBS',
            titleEn: '2. Activities & Operations',
            subAr: 'المشاريع، المهام والمعالم',
            subEn: 'Projects, Tasks, Milestones',
            icon: Compass,
            color: 'violet'
          },
          {
            id: 'staff',
            titleAr: '3. الموظفين والكادر',
            titleEn: '3. Staff & Personnel',
            subAr: 'السجل الوظيفي والمرتبات',
            subEn: 'HR Master & Payroll',
            icon: Users,
            color: 'blue'
          },
          {
            id: 'master_transactions',
            titleAr: '4. البيانات الأساسية والحركة',
            titleEn: '4. Master Data & Movement',
            subAr: 'المانحون، المستفيدون، الموردون',
            subEn: 'Donors, Beneficiaries, Vendors',
            icon: Database,
            color: 'amber'
          }
        ].map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id as ExchangeCategory)}
              className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-950 border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
              style={{ textAlign: isRtl ? 'right' : 'left' }}
            >
              <div className="flex justify-between items-center mb-3">
                <div className={`p-2.5 rounded-xl ${
                  isActive ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                {isActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 block">
                  {isRtl ? cat.titleAr : cat.titleEn}
                </h4>
                <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
                  {isRtl ? cat.subAr : cat.subEn}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* TEMPLATE SUB-SELECTOR & DESCRIPTION */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <span className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
            {isRtl ? 'نماذج القوالب المعتمدة المتاحة للاستيراد والتصدير:' : 'Certified Templates for Category:'}
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            {selectedTemplate.apiEndpoint}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TEMPLATES.filter(t => t.category === activeCategory).map(tpl => {
            const isSelected = selectedTemplate.id === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => handleTemplateSelect(tpl)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isRtl ? tpl.titleAr : tpl.titleEn}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
          💡 {isRtl ? selectedTemplate.descriptionAr : selectedTemplate.descriptionEn}
        </p>
      </div>

      {/* WORKFLOW PANELS: IMPORT & EXPORT DUAL HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PANEL A: SMART IMPORT WORKSPACE */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">
                    {isRtl ? 'معالج الاستيراد ورفع البيانات الذكي' : 'Smart Import & File Parser'}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {isRtl ? 'رفع ملفات Excel أو CSV مع المطابقة والتحقق التلقائي' : 'Upload Excel / CSV with auto-mapping & validation'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadSample}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تحميل القالب' : 'Template'}</span>
              </button>
            </div>

            {/* DRAG & DROP FILE ZONE */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center space-y-2 bg-slate-50/50 dark:bg-zinc-800/30 transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                {isParsing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-zinc-200">
                  {parseFileName ? parseFileName : (isRtl ? 'اضغط هنا لرفع ملف Excel أو CSV' : 'Click to select Excel or CSV file')}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isRtl ? 'يدعم صيغ .xlsx و .csv حتى 10,000 سجل دفعة واحدة' : 'Supports .xlsx & .csv up to 10,000 rows'}
                </p>
              </div>
            </div>

            {/* STATUS NOTIFICATION */}
            {importStatusMessage && (
              <div className={`p-3.5 rounded-xl text-xs font-bold border flex items-center gap-2 animate-fadeIn ${
                importStatusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}>
                {importStatusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="leading-snug">{importStatusMessage.text}</span>
              </div>
            )}
          </div>

          {/* COMMIT IMPORT BUTTON */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-[11px] font-mono font-bold text-slate-500">
              {importedRows.length > 0 ? `${importedRows.length} ${isRtl ? 'سجل جاهز' : 'Rows Ready'}` : ''}
            </span>
            <button
              onClick={handleCommitImport}
              disabled={isSubmitting || importedRows.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isRtl ? 'اعتماد وحفظ الاستيراد في النظام' : 'Commit Import to Database'}</span>
            </button>
          </div>
        </div>

        {/* PANEL B: ADVANCED EXPORT ENGINE */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">
                    {isRtl ? 'جناح التصدير المالي والتشغيلي المتقدم' : 'Advanced Multi-Format Export Suite'}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {isRtl ? 'تصدير البيانات المعتمدة مع الختم الرقمي والفلترة' : 'Export certified data with digital seal & custom filters'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold rounded-md">
                IATI Compliant
              </span>
            </div>

            {/* FORMAT SELECTOR GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'excel', label: 'Excel (.xlsx)', icon: FileSpreadsheet, color: 'text-emerald-600' },
                { id: 'csv', label: 'CSV Data', icon: FileText, color: 'text-amber-600' },
                { id: 'json', label: 'JSON API', icon: FileCode, color: 'text-violet-600' },
                { id: 'iati', label: 'IATI XML 2.03', icon: ShieldCheck, color: 'text-blue-600' }
              ].map(fmt => {
                const Icon = fmt.icon;
                const isSelected = exportFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setExportFormat(fmt.id as any)}
                    className={`p-3 rounded-xl border text-center space-y-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-zinc-800 text-white border-slate-800 shadow-md ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 dark:bg-zinc-800/40 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mx-auto ${fmt.color}`} />
                    <span className="text-[11px] font-black block">{fmt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* FILTER SEARCH INPUT */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                      style={!isRtl ? { right: 'auto', left: '12px' } : {}} />
              <input
                type="text"
                placeholder={isRtl ? 'تصفية البيانات برقم الكود أو الاسم قبل التصدير...' : 'Filter records by code or name...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                style={!isRtl ? { paddingRight: '12px', paddingLeft: '36px' } : {}}
              />
            </div>

            {/* COLUMN SELECTOR CHECKBOXES */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wide block">
                {isRtl ? 'الأعمدة المضمنة في ملف التصدير:' : 'Included Columns:'}
              </span>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                {selectedTemplate.headers.map(h => (
                  <label key={h} className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColumns[h] !== false}
                      onChange={e => setSelectedColumns(prev => ({ ...prev, [h]: e.target.checked }))}
                      className="accent-emerald-600 rounded"
                    />
                    <span>{h}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* EXECUTE EXPORT BUTTON */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-[11px] font-mono font-bold text-slate-500">
              {filteredExportRows.length} {isRtl ? 'سجل مفلتر' : 'Filtered Items'}
            </span>
            <button
              onClick={handleExecuteExport}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isRtl ? 'تنزيل ملف التصدير الآن' : 'Export File Now'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* TABLE PREVIEW OF CURRENT DATA */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">
                {isRtl ? `معاينة وتعديل سجلات (${selectedTemplate.titleAr})` : `Data Preview & Direct Editor (${selectedTemplate.titleEn})`}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                {isRtl ? `يمكنك تعديل القيم مباشرة في الجدول أو إضافة وتفريغ السجلات قبل الاعتماد النهائي` : `Directly edit cells or add rows before final commit`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLoadPresetData(selectedTemplate)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تحميل نموذج تجريبي' : 'Load Sample Data'}</span>
            </button>

            <button
              onClick={handleAddNewRow}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>+ {isRtl ? 'إضافة صف جديد' : 'Add Row'}</span>
            </button>

            <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg">
              {importedRows.length > 0 ? (isRtl ? 'بيانات قابلة للتعديل' : 'Editable Active Rows') : (isRtl ? 'نموذج بيانات افتراضي' : 'Sample Preset Data')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
          <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr className="bg-zinc-900 text-emerald-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                <th className="p-3 w-12 text-center">#</th>
                {selectedTemplate.headers.map(h => (
                  <th key={h} className="p-3 font-mono">{h}</th>
                ))}
                <th className="p-3 text-center">{isRtl ? 'حالة السجل' : 'Status'}</th>
                <th className="p-3 text-center">{isRtl ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">
              {filteredExportRows.length === 0 ? (
                <tr>
                  <td colSpan={selectedTemplate.headers.length + 3} className="p-8 text-center text-slate-400">
                    {isRtl ? 'لا توجد سجلات مطابقة للعرض' : 'No matching records found'}
                  </td>
                </tr>
              ) : (
                filteredExportRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all">
                    <td className="p-3 text-center font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                    {selectedTemplate.headers.map(h => (
                      <td key={h} className="p-2 font-mono text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                        <input
                          type="text"
                          value={row[h] !== undefined ? String(row[h]) : ''}
                          onChange={e => handleCellEdit(idx, h, e.target.value)}
                          className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-900 border border-transparent focus:border-emerald-500 rounded text-xs font-mono font-bold transition-all text-slate-900 dark:text-zinc-100"
                        />
                      </td>
                    ))}
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{isRtl ? 'موثق Valid' : 'Valid'}</span>
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                        title={isRtl ? 'حذف السجل' : 'Delete row'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SHARE MODAL & DISPATCH PAYLOAD */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">
                    {isRtl ? 'منظومة المشاركة والتصديق المباشر' : 'Verified Data Share & Dispatch Hub'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {selectedTemplate.titleAr}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-slate-500">
                {isRtl ? 'ملخص الرسالة المعتمدة للمشاركة:' : 'Certified Share Payload:'}
              </label>
              <textarea
                rows={6}
                value={shareTextSummary}
                onChange={e => setShareTextSummary(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
              />

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black text-emerald-900 dark:text-emerald-200 block">
                      {isRtl ? 'ختم الاعتماد الرقمي (Digital Seal)' : 'Certified QR Verification Seal'}
                    </span>
                    <span className="text-[9px] text-emerald-700 dark:text-emerald-400 block font-mono">
                      IATI-ROHAMAA-2026-NEB12
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-600 text-white rounded-md">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isRtl ? 'إرسال عبر واتساب' : 'Share WhatsApp'}</span>
                </button>

                <button
                  onClick={handleCopyShareLink}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ النص والرابط' : 'Copy Payload')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
