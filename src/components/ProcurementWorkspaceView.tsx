import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, Plus, Search, Trash2, Eye, Printer, Building, Layers, 
  Activity, CheckCircle2, XCircle, Clock, ArrowRight, CheckCircle, 
  AlertCircle, FileText, FileSpreadsheet, UserCheck, Workflow, 
  ChevronRight, BadgePercent, TrendingUp, DollarSign, RefreshCw, Warehouse,
  Download, ShieldCheck, Award, Zap, Truck, Star, Filter, ExternalLink,
  Package, Check, Sparkles, Building2, HelpCircle, FileCheck, ArrowUpRight
} from 'lucide-react';
import { printHTML, createPrintDocument } from '../lib/printUtils';
import { cn } from '../design-system/utils/cn';
import { EmptyState } from '../design-system/components/EmptyState';
import { ErrorState } from '../design-system/components/ErrorState';
import { Spinner } from '../design-system/components/Spinner';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { EnterpriseButton } from './common/EnterpriseButton';
import { showToast } from './enterprise/EnterpriseToastContainer';
import { useDebouncedValue } from '../design-system/hooks/useDebouncedValue';
import ProcurementTab from './finance/ProcurementTab';
import VendorRecommendationEngineView from '../features/procurement/VendorRecommendationEngineView';
import VendorPerformanceAnalyticsView from '../features/procurement/VendorPerformanceAnalyticsView';
import ProcurementForecastingView from '../features/procurement/ProcurementForecastingView';
import { ActiveTab } from '../core/types/dashboard';

interface ProcurementWorkspaceViewProps {
  projects?: any[];
  accounts?: any[];
  currencies?: any[];
  activities?: any[];
  organizations?: any[];
  lang: 'ar' | 'en';
  onRefresh?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

interface VendorProfile {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  category: string;
  tax_number: string;
  commercial_reg: string;
  contact_person: string;
  phone: string;
  email: string;
  rating: number;
  status: 'QUALIFIED' | 'UNDER_REVIEW' | 'SUSPENDED';
  total_orders_count: number;
  total_spent_yer: number;
  address: string;
}

export default function ProcurementWorkspaceView({
  projects = [],
  accounts = [],
  currencies = [],
  activities = [],
  organizations = [],
  lang,
  onRefresh,
  onNavigate
}: ProcurementWorkspaceViewProps) {
  const isRtl = lang === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<'core_p2p' | 'vendors' | 'forecasting' | 'ai_recommendation' | 'analytics' | 'forms'>('core_p2p');
  const [searchVendorQuery, setSearchVendorQuery] = useState('');
  // Debounced vendor search — grid re-filters 300ms after typing stops
  const debouncedVendorQuery = useDebouncedValue(searchVendorQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isRegisterVendorModalOpen, setIsRegisterVendorModalOpen] = useState(false);

  // Initial Real-World Vendor Directory for Rohama'a Baynahum Charity
  const [vendors, setVendors] = useState<VendorProfile[]>([
    {
      id: 'vnd-1',
      code: 'VND-001',
      name_ar: 'مؤسسة البركة للتوريدات الغذائية والإغاثية',
      name_en: 'Al-Baraka Relief & Food Supplies Est.',
      category: 'سلال غذائية وطوارئ',
      tax_number: 'TX-992014-YE',
      commercial_reg: 'CR-104820',
      contact_person: 'م. أحمد صالح الحبيشي',
      phone: '+967 777 123 456',
      email: 'sales@albaraka-ye.com',
      rating: 4.9,
      status: 'QUALIFIED',
      total_orders_count: 14,
      total_spent_yer: 42850000,
      address: 'صنعاء - شارع الستين الجنوبي'
    },
    {
      id: 'vnd-2',
      code: 'VND-002',
      name_ar: 'شركة الخليج لحفر وتأهيل آبار المياه ومضخات الطاقة',
      name_en: 'Gulf Boreholes & Solar Water Pumps Co.',
      category: 'معدات مياه وحفر آبار',
      tax_number: 'TX-883011-YE',
      commercial_reg: 'CR-205912',
      contact_person: 'م. فؤاد عبدالكريم',
      phone: '+967 771 987 654',
      email: 'projects@gulfwater-ye.com',
      rating: 4.8,
      status: 'QUALIFIED',
      total_orders_count: 8,
      total_spent_yer: 68400000,
      address: 'ذمار - الدائري الغربي'
    },
    {
      id: 'vnd-3',
      code: 'VND-003',
      name_ar: 'مجموعة الأمل اللوجستية للنقل والشحن الإغاثي',
      name_en: 'Al-Amal Logistics & Humanitarian Transport',
      category: 'نقل وشحن إغاثي',
      tax_number: 'TX-440192-YE',
      commercial_reg: 'CR-330194',
      contact_person: 'أ. طارق الشميري',
      phone: '+967 733 554 433',
      email: 'ops@alamal-logistics.ye',
      rating: 4.2,
      status: 'QUALIFIED',
      total_orders_count: 19,
      total_spent_yer: 19500000,
      address: 'صنعاء - الحصبة'
    },
    {
      id: 'vnd-4',
      code: 'VND-004',
      name_ar: 'الرواد للتجهيزات والمستلزمات الطبية والدوائية',
      name_en: 'Al-Rowad Medical & Pharma Supplies',
      category: 'أدوية ومستلزمات طبية',
      tax_number: 'TX-773012-YE',
      commercial_reg: 'CR-440281',
      contact_person: 'د. وليد الحمادي',
      phone: '+967 775 889 900',
      email: 'info@alrowad-med.com',
      rating: 4.6,
      status: 'QUALIFIED',
      total_orders_count: 6,
      total_spent_yer: 24700000,
      address: 'إب - شارع العدين'
    },
    {
      id: 'vnd-5',
      code: 'VND-005',
      name_ar: 'المنار للتوريدات الهندسية ومواد البناء والترميم',
      name_en: 'Al-Manar Engineering & Construction Materials',
      category: 'مواد بناء وتأهيل',
      tax_number: 'TX-662019-YE',
      commercial_reg: 'CR-551029',
      contact_person: 'م. هيثم القدسي',
      phone: '+967 772 334 455',
      email: 'contracts@almanar-const.ye',
      rating: 3.8,
      status: 'UNDER_REVIEW',
      total_orders_count: 3,
      total_spent_yer: 11200000,
      address: 'تعز - الحوبان'
    }
  ]);

  // Form for registering a new vendor
  const [newVendorForm, setNewVendorForm] = useState({
    name_ar: '',
    name_en: '',
    category: 'سلال غذائية وطوارئ',
    tax_number: '',
    commercial_reg: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.name_ar) {
      showToast({
        type: 'error',
        title: isRtl ? 'تسجيل الموردين' : 'Vendor registry',
        message: isRtl ? 'يرجى إدخال اسم المورد بالعربية' : 'Vendor Arabic name is required',
      });
      return;
    }

    const newVnd: VendorProfile = {
      id: `vnd-${Date.now()}`,
      code: `VND-00${vendors.length + 1}`,
      name_ar: newVendorForm.name_ar,
      name_en: newVendorForm.name_en || newVendorForm.name_ar,
      category: newVendorForm.category,
      tax_number: newVendorForm.tax_number || 'TX-PENDING',
      commercial_reg: newVendorForm.commercial_reg || 'CR-PENDING',
      contact_person: newVendorForm.contact_person,
      phone: newVendorForm.phone,
      email: newVendorForm.email,
      rating: 5.0,
      status: 'QUALIFIED',
      total_orders_count: 0,
      total_spent_yer: 0,
      address: newVendorForm.address
    };

    setVendors(prev => [newVnd, ...prev]);
    setIsRegisterVendorModalOpen(false);
    showToast({
      type: 'success',
      title: isRtl ? 'تسجيل الموردين' : 'Vendor registry',
      message: isRtl
        ? `تم اعتماد المورد «${newVnd.name_ar}» برمز ${newVnd.code}`
        : `Vendor "${newVnd.name_en}" qualified as ${newVnd.code}`,
    });
    setNewVendorForm({
      name_ar: '',
      name_en: '',
      category: 'سلال غذائية وطوارئ',
      tax_number: '',
      commercial_reg: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    const q = debouncedVendorQuery.toLowerCase();
    return vendors.filter(v => {
      const matchesQuery =
        v.name_ar.toLowerCase().includes(q) ||
        v.name_en.toLowerCase().includes(q) ||
        v.code.toLowerCase().includes(q) ||
        v.contact_person.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'ALL' || v.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [vendors, debouncedVendorQuery, selectedCategory]);

  // Aggregate Metrics
  const totalVendors = vendors.length;
  const qualifiedVendors = vendors.filter(v => v.status === 'QUALIFIED').length;
  const totalProcurementSpent = vendors.reduce((acc, v) => acc + v.total_spent_yer, 0);

  // CSV Exporter for Vendors & Procurement Register
  const handleExportProcurementCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'Vendor Code,Vendor Name (AR),Vendor Name (EN),Category,Status,Orders Count,Total Spend (YER),Contact Person,Phone,Tax Number\n';
    vendors.forEach(v => {
      csvContent += `"${v.code}","${v.name_ar}","${v.name_en}","${v.category}","${v.status}",${v.total_orders_count},${v.total_spent_yer},"${v.contact_person}","${v.phone}","${v.tax_number}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rohamab_Procurement_Vendors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Official Printable Forms Generator
  const handlePrintStandardForm = (formType: 'PO' | 'PR' | 'RFQ' | 'GRN') => {
    let title = '';
    let contentHtml = '';

    if (formType === 'PO') {
      title = isRtl ? 'أمر شراء وتوريد رسمي معمد (Official Purchase Order)' : 'Official Purchase Order (PO)';
      contentHtml = `
        <div style="padding: 24px; font-family: sans-serif; direction: ${isRtl ? 'rtl' : 'ltr'};">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              <h2 style="margin: 0; color: #059669;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
              <p style="margin: 4px 0; font-weight: bold; font-size: 14px;">إدارة المشتريات والعقود والمناقصات (NEB-14)</p>
              <p style="margin: 2px 0; font-size: 12px; color: #64748b;">الرقم المرجعي للأمر: PO-2026-0042</p>
            </div>
            <div style="text-align: ${isRtl ? 'left' : 'right'};">
              <span style="display: inline-block; padding: 6px 12px; background: #ecfdf5; border: 1px solid #10b981; color: #065f46; font-weight: bold; border-radius: 6px; font-size: 12px;">
                معمد ونافذ رسميـاً
              </span>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #1e293b;">بيانات المورد المعمد:</h4>
            <table style="width: 100%; font-size: 12px;">
              <tr>
                <td style="width: 25%; font-weight: bold;">اسم المورد:</td>
                <td>مؤسسة البركة للتوريدات الإغاثية</td>
                <td style="width: 25%; font-weight: bold;">الرقم الضريبي:</td>
                <td style="font-family: monospace;">TX-992014-YE</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">المشروع الميداني:</td>
                <td>مشروع الأمن الغذائي والسلال الرمضانية (PRJ-FOOD-2026)</td>
                <td style="font-weight: bold;">موقع التسليم:</td>
                <td>المستودع المركزي - صنعاء</td>
              </tr>
            </table>
          </div>

          <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin-bottom: 20px; font-size: 11px;">
            <thead>
              <tr style="background: #0f172a; color: white;">
                <th style="padding: 10px; border: 1px solid #cbd5e1; width: 40px;">#</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: ${isRtl ? 'right' : 'left'};">الصنف والمواصفات الفنية المعتمدة</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 80px;">الوحدة</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 80px;">الكمية</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 120px;">سعر الوحدة (ر.ي)</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 140px;">الإجمالي (ر.ي)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">1</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">كيس دقيق قمح بر نخب أول (50 كجم)</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">كيس</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">1,000</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">18,500</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold;">18,500,000</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">2</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">زيت طبخ نباتي نقي عبوة (4 لتر)</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">دبة</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">1,000</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">4,200</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold;">4,200,000</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">3</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">أرز أبيض هندي درجة أولى (25 كجم)</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">كيس</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">1,000</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">16,000</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold;">16,000,000</td>
              </tr>
              <tr style="background: #f1f5f9; font-weight: bold; font-size: 12px;">
                <td colspan="5" style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">إجمالي أمر الشراء المعمد (ريال يمني):</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; color: #059669; font-size: 14px;">38,700,000 YER</td>
              </tr>
            </tbody>
          </table>

          <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 8px; font-size: 11px; margin-bottom: 24px; color: #92400e;">
            <strong>الشروط والأحكام:</strong> يخضع هذا الأمر لمعايير الجودة الإنسانية (Core Humanitarian Standard)، وتلتزم المؤسسة الموردة بتسليم المواد خلال 5 أيام عمل، مع إخضاع الشحنة لفحص الجودة المخزني ومطابقة العينات قبل صرف المستحقات المالية (3-Way Matching).
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; text-align: center; font-size: 11px; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
            <div>
              <p style="font-weight: bold; margin-bottom: 40px;">مسؤول المشتريات</p>
              <p>التوقيع: ..........................</p>
            </div>
            <div>
              <p style="font-weight: bold; margin-bottom: 40px;">المدير المالي والرقابة</p>
              <p>التوقيع: ..........................</p>
            </div>
            <div>
              <p style="font-weight: bold; margin-bottom: 40px;">اعتماد رئيس الجمعية</p>
              <p>الختم الرسمي والتوقيع</p>
            </div>
          </div>
        </div>
      `;
    } else {
      title = isRtl ? 'محضر استلام وفحص مخزني معمد (Goods Receipt Note - GRN)' : 'Goods Receipt Note (GRN)';
      contentHtml = `
        <div style="padding: 24px; font-family: sans-serif; direction: ${isRtl ? 'rtl' : 'ltr'};">
          <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">محضر استلام وفحص بضاعة مخزنية (GRN)</h2>
          <p style="font-size: 12px; color: #64748b;">رقم المحضر: GRN-2026-0031 | مرجع أمر الشراء: PO-2026-0042</p>
          <div style="padding: 16px; background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; margin: 16px 0; font-size: 12px;">
            <strong>نتيجة الفحص الفني والمخبري:</strong> مطابقة تامة بنسبة 100% لكافة المواصفات وتواريخ الصلاحية. تم إدخال المواد إلى المستودع المركزي بسلامة كاملة.
          </div>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 11px; margin-bottom: 20px;">
            <tr style="background: #0f172a; color: white;">
              <th style="padding: 8px;">الصنف</th>
              <th style="padding: 8px; text-align: center;">الكمية المطلوبة</th>
              <th style="padding: 8px; text-align: center;">الكمية المستلمة</th>
              <th style="padding: 8px; text-align: center;">المقبول</th>
              <th style="padding: 8px; text-align: center;">المرفوض</th>
              <th style="padding: 8px; text-align: center;">حالة الاستلام</th>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">دقيق قمح بر نخب أول 50 كجم</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">1,000</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">1,000</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; color: #059669; font-weight: bold;">1,000</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">0</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #059669;">مقبول 100%</td>
            </tr>
          </table>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 30px;">
            <div>أمين المستودع: فهد العنسي (التوقيع: ..............)</div>
            <div>رئيس لجنة الفحص والاستلام: م. محمد الأكوع (التوقيع: ..............)</div>
          </div>
        </div>
      `;
    }

    const fullDocHTML = `
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; color: #0f172a; }
            @media print { @page { margin: 15mm; } }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `;

    printHTML(fullDocHTML);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── 1. TOP EXECUTIVE COMMAND HEADER ─── */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-black rounded-full flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>NEB-14: Procurement & Tenders OS</span>
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-black rounded-full flex items-center gap-1.5 shadow-xs">
                <Award className="w-3.5 h-3.5" />
                <span>{isRtl ? 'معايير CHS & Sphere الدولية' : 'CHS & Sphere Compliant'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-amber-400 shrink-0" />
              <span>{isRtl ? 'منظومة المشتريات والمناقصات والعقود الميدانية' : 'Procurement, Tenders & Supply Chain OS'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed">
              {isRtl 
                ? 'إدارة دورة المشتريات المتكاملة (Procure-to-Pay P2P): من طلبات الاحتياج واستدراج العروض، إلى التعميد الرسمي والفحص المخزني والمطابقة الثلاثية والربط المالي التلقائي.' 
                : 'Complete Procure-to-Pay (P2P) lifecycle: purchase requisitions, sealed RFQs, certified purchase orders, goods receipt notes (GRN), and automated 3-way matching.'}
            </p>
          </div>

          {/* Quick Action Ribbon */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsRegisterVendorModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              <span>{isRtl ? 'تسجيل مورد جديد' : 'Register Vendor'}</span>
            </button>

            <button
              onClick={handleExportProcurementCSV}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title={isRtl ? 'تصدير سجل المشتريات والموردين بصيغة Excel / CSV' : 'Export Procurement & Vendor Register'}
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
            </button>

            <button
              onClick={() => handlePrintStandardForm('PO')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-900/30"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>{isRtl ? 'طباعة نموذج PO معمد' : 'Print Certified PO'}</span>
            </button>
          </div>
        </div>

        {/* ─── Live Statistical Scorecards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-emerald-600/40">
          <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold block">{isRtl ? 'إجمالي الموردين المؤهلين' : 'Qualified Vendors'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-white font-mono">{qualifiedVendors}</span>
              <span className="text-[10px] text-emerald-300 font-bold">{isRtl ? 'مورد معتمد' : 'Active'}</span>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold block">{isRtl ? 'مبالغ المشتريات الملتزم بها' : 'Committed Spend'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-300 font-mono">{(totalProcurementSpent / 1000000).toFixed(1)}M</span>
              <span className="text-[10px] text-zinc-300 font-bold">YER</span>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold block">{isRtl ? 'زمن دورة التوريد P2P' : 'Avg. Cycle Time'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-white font-mono">4.2</span>
              <span className="text-[10px] text-emerald-300 font-bold">{isRtl ? 'أيام عمل' : 'Days'}</span>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold block">{isRtl ? 'المطابقة الثلاثية وفحص الجودة' : '3-Way Match & QC'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-400 font-mono">100%</span>
              <span className="text-[10px] text-emerald-300 font-bold">{isRtl ? 'خالٍ من الفوارق' : 'Zero Variance'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. WORKSPACE SUBTAB NAVIGATION ─── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'core_p2p', labelAr: 'دورة المشتريات P2P المتكاملة', labelEn: 'Core P2P Operations', icon: ShoppingCart },
            { id: 'vendors', labelAr: 'سجل وتأهيل الموردين', labelEn: 'Vendor Registry & Vetting', icon: Building2 },
            { id: 'forecasting', labelAr: 'التنبؤ باحتياجات المشاريع والمخزون', labelEn: 'Procurement Forecasting', icon: Package },
            { id: 'ai_recommendation', labelAr: 'محرك الترشيح الذكي (AI)', labelEn: 'AI Vendor Recommendation', icon: Sparkles },
            { id: 'analytics', labelAr: 'مؤشرات أداء الموردين (KPIs)', labelEn: 'Vendor Performance Analytics', icon: Activity },
            { id: 'forms', labelAr: 'نماذج ومستندات التعميد المعتمدة', labelEn: 'Certified P2P Printable Forms', icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' 
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span>{isRtl ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('finance')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>{isRtl ? 'الربط مع القيود المالية' : 'Open Finance Ledger'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {/* ─── 3. SUBTAB CONTENT PANELS ─── */}

      {/* SUBTAB 1: CORE P2P OPERATIONS */}
      {activeSubTab === 'core_p2p' && (
        <div className="animate-fade-in">
          <ProcurementTab
            accounts={accounts as any}
            projects={projects as any}
            currencies={currencies}
            activities={activities}
            organizations={organizations}
            lang={lang}
            onRefresh={onRefresh || (() => {})}
          />
        </div>
      )}

      {/* SUBTAB 2: VENDOR REGISTRY & VETTING MATRIX */}
      {activeSubTab === 'vendors' && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-96">
              <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`}
                      aria-hidden="true" />
              <input
                type="text"
                value={searchVendorQuery}
                onChange={(e) => setSearchVendorQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث باسم المورد، الرمز، أو مسؤول الاتصال...' : 'Search vendor name, code, contact...'}
                aria-label={isRtl ? 'بحث الموردين' : 'Search vendors'}
                className={`w-full py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 ${isRtl ? 'pl-3 pr-9' : 'pr-3 pl-9'}`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-200 outline-none cursor-pointer"
              >
                <option value="ALL">{isRtl ? 'جميع التصنيفات' : 'All Categories'}</option>
                <option value="سلال غذائية وطوارئ">{isRtl ? 'سلال غذائية وطوارئ' : 'Food Baskets & Emergency'}</option>
                <option value="معدات مياه وحفر آبار">{isRtl ? 'معدات مياه وحفر آبار' : 'WASH & Well Drilling'}</option>
                <option value="نقل وشحن إغاثي">{isRtl ? 'نقل وشحن إغاثي' : 'Transport & Logistics'}</option>
                <option value="أدوية ومستلزمات طبية">{isRtl ? 'أدوية ومستلزمات طبية' : 'Pharma & Medical'}</option>
                <option value="مواد بناء وتأهيل">{isRtl ? 'مواد بناء وتأهيل' : 'Construction & Shelter'}</option>
              </select>

              <EnterpriseButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsRegisterVendorModalOpen(true)}
                disabled={false}
              >
                {isRtl ? 'إضافة مورد' : 'Add Vendor'}
              </EnterpriseButton>
            </div>
          </div>

          {/* Vendors Grid */}
          {filteredVendors.length === 0 ? (
            <EmptyState
              variant={searchVendorQuery || selectedCategory !== 'ALL' ? 'search' : 'empty'}
              title="No vendors found"
              titleAr="لا توجد نتائج مطابقة"
              description="Try adjusting your search or category filter — or register a new vendor."
              descriptionAr="حاول تعديل البحث أو فئة التصفية — أو سجّل مورداً جديداً."
              actions={[
                {
                  label: 'Clear filters',
                  labelAr: 'مسح الفلاتر',
                  variant: 'secondary',
                  onClick: () => { setSearchVendorQuery(''); setSelectedCategory('ALL'); },
                },
                {
                  label: 'Add vendor',
                  labelAr: 'إضافة مورد',
                  onClick: () => setIsRegisterVendorModalOpen(true),
                },
              ]}
              lang={lang}
            />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((vnd) => (
              <div 
                key={vnd.id} 
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                        {vnd.code}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                        {isRtl ? vnd.name_ar : vnd.name_en}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
                        {vnd.category}
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      vnd.status === 'QUALIFIED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      {vnd.status === 'QUALIFIED' ? (isRtl ? '✓ مؤهل ومعتمد' : 'Qualified') : (isRtl ? 'قيد المراجعة' : 'Under Review')}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">{isRtl ? 'مسؤول الاتصال:' : 'Contact:'}</span>
                      <span className="font-bold text-slate-800 dark:text-zinc-200">{vnd.contact_person}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">{isRtl ? 'رقم الهاتف:' : 'Phone:'}</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">{vnd.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">{isRtl ? 'الرقم الضريبي:' : 'Tax ID:'}</span>
                      <span className="font-mono font-semibold text-slate-600 dark:text-zinc-300">{vnd.tax_number}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isRtl ? 'إجمالي التعميدات' : 'Total Orders'}</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {(vnd.total_spent_yer / 1000000).toFixed(1)}M YER ({vnd.total_orders_count})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg font-black text-xs font-mono">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{vnd.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: FORECASTING & REORDER RADAR */}
      {activeSubTab === 'forecasting' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <p className="font-bold">
              {isRtl 
                ? 'رادار التنبؤ وسلاسل الإمداد: يقوم بفحص الأرصدة الحالية في المستودعات الميدانية مقارنة بحدود الأمان وإعادة الطلب لمشاريع الأمن الغذائي وحفر الآبار لمنع أي انقطاع في تقديم المساعدات.' 
                : 'Procurement Supply Radar: Automatically tracks live inventory stock vs. critical safety reorder thresholds for active relief projects.'}
            </p>
          </div>
          <ProcurementForecastingView lang={lang} />
        </div>
      )}

      {/* SUBTAB 4: AI VENDOR RECOMMENDATIONS */}
      {activeSubTab === 'ai_recommendation' && (
        <div className="space-y-4 animate-fade-in">
          <VendorRecommendationEngineView lang={lang} />
        </div>
      )}

      {/* SUBTAB 5: VENDOR PERFORMANCE ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-4 animate-fade-in">
          <VendorPerformanceAnalyticsView lang={lang} />
        </div>
      )}

      {/* SUBTAB 6: CERTIFIED PRINTABLE FORMS */}
      {activeSubTab === 'forms' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>{isRtl ? 'نماذج ومستندات دورة المشتريات المعمدة للطباعة (Official Printable Forms)' : 'Official Printable P2P Forms'}</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-bold mt-1">
              {isRtl 
                ? 'مستندات جاهزة للطباعة والتصدير الفوري بشعار الجمعية الرسمي وأختام التعميد المعتمدة وفق لوائح الشراء والحوكمة.' 
                : 'Standardized forms ready for instant official printing with letterhead, signatures, and stamps.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Form 1: Purchase Order */}
            <div className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {isRtl ? 'أمر شراء وتوريد رسمي معمد (PO)' : 'Official Purchase Order (PO)'}
                </h4>
                <p className="text-[10px] text-slate-500 font-bold">
                  {isRtl ? 'النموذج الرسمي الموجه للمورد المعمد متضمناً جدول الكميات، الشروط الجزائية، واعتمادات الصرف.' : 'Formal contract purchase order issued to the winning supplier with specifications and terms.'}
                </p>
              </div>

              <button
                onClick={() => handlePrintStandardForm('PO')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isRtl ? 'معاينة وطباعة أمر الشراء' : 'Preview & Print PO'}</span>
              </button>
            </div>

            {/* Form 2: Goods Receipt Note */}
            <div className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {isRtl ? 'محضر استلام وفحص مخزني (GRN)' : 'Goods Receipt & Inspection Note (GRN)'}
                </h4>
                <p className="text-[10px] text-slate-500 font-bold">
                  {isRtl ? 'وثيقة الفحص الفني والمخبري للسلع المستلمة وتأكيد مطابقة الكميات قبل إصدار الشيك وسند الصرف.' : 'Warehouse goods receipt and technical quality verification certificate for 3-way match.'}
                </p>
              </div>

              <button
                onClick={() => handlePrintStandardForm('GRN')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isRtl ? 'معاينة وطباعة محضر الاستلام' : 'Preview & Print GRN'}</span>
              </button>
            </div>

            {/* Form 3: Purchase Requisition Form */}
            <div className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {isRtl ? 'طلب شراء واحتياج ميداني (PR Form)' : 'Purchase Requisition Form (PR)'}
                </h4>
                <p className="text-[10px] text-slate-500 font-bold">
                  {isRtl ? 'استمارة رفع الاحتياج الداخلي الميداني من مدراء المشاريع والأنشطة الإغاثية لاعتمادها المالي.' : 'Internal requisition form submitted by field project managers for operational approval.'}
                </p>
              </div>

              <button
                onClick={() => handlePrintStandardForm('PO')}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isRtl ? 'معاينة وطباعة طلب الشراء' : 'Preview & Print PR'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. MODAL: REGISTER NEW VENDOR ─── */}
      {isRegisterVendorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-sm">{isRtl ? 'تسجيل مورد / مقاول جديد في المنظومة' : 'Register New Vendor / Contractor'}</h3>
              </div>
              <button 
                onClick={() => setIsRegisterVendorModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="p-6 space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-700 dark:text-zinc-300 block mb-1">{isRtl ? 'اسم المورد (بالعربية)*:' : 'Vendor Name (AR)*:'}</label>
                  <input
                    type="text"
                    required
                    value={newVendorForm.name_ar}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, name_ar: e.target.value })}
                    placeholder={isRtl ? 'مثال: شركة النور للتوريدات' : 'Company Name in Arabic'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-zinc-300 block mb-1">{isRtl ? 'اسم المورد (بالإنجليزية):' : 'Vendor Name (EN):'}</label>
                  <input
                    type="text"
                    value={newVendorForm.name_en}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, name_en: e.target.value })}
                    placeholder="Al-Noor Supplies Co."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-700 dark:text-zinc-300 block mb-1">{isRtl ? 'تصنيف النشاط والتوريد:' : 'Procurement Category:'}</label>
                  <select
                    value={newVendorForm.category}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="سلال غذائية وطوارئ">{isRtl ? 'سلال غذائية وطوارئ' : 'Food Baskets & Emergency'}</option>
                    <option value="معدات مياه وحفر آبار">{isRtl ? 'معدات مياه وحفر آبار' : 'WASH & Well Drilling'}</option>
                    <option value="نقل وشحن إغاثي">{isRtl ? 'نقل وشحن إغاثي' : 'Transport & Logistics'}</option>
                    <option value="أدوية ومستلزمات طبية">{isRtl ? 'أدوية ومستلزمات طبية' : 'Pharma & Medical'}</option>
                    <option value="مواد بناء وتأهيل">{isRtl ? 'مواد بناء وتأهيل' : 'Construction & Shelter'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-zinc-300 block mb-1">{isRtl ? 'مسؤول الاتصال:' : 'Contact Person:'}</label>
                  <input
                    type="text"
                    value={newVendorForm.contact_person}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, contact_person: e.target.value })}
                    placeholder={isRtl ? 'اسم المدير أو المندوب' : 'Sales Representative'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-700 dark:text-zinc-300 block mb-1">{isRtl ? 'رقم الهاتف / الواتساب:' : 'Phone / WhatsApp:'}</label>
                  <input
                    type="text"
                    value={newVendorForm.phone}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                    placeholder="+967 77..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-zinc-300 block mb-1">{isRtl ? 'البريد الإلكتروني:' : 'Email:'}</label>
                  <input
                    type="email"
                    value={newVendorForm.email}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, email: e.target.value })}
                    placeholder="sales@company.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-700 dark:text-zinc-300 block mb-1">{isRtl ? 'الرقم الضريبي:' : 'Tax Number:'}</label>
                  <input
                    type="text"
                    value={newVendorForm.tax_number}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, tax_number: e.target.value })}
                    placeholder="TX-00000-YE"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-zinc-300 block mb-1">{isRtl ? 'السجل التجاري:' : 'Commercial Reg (CR):'}</label>
                  <input
                    type="text"
                    value={newVendorForm.commercial_reg}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, commercial_reg: e.target.value })}
                    placeholder="CR-00000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-zinc-300 block mb-1">{isRtl ? 'العنوان والمقر الرئيسي:' : 'Headquarters Address:'}</label>
                <input
                  type="text"
                  value={newVendorForm.address}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, address: e.target.value })}
                  placeholder={isRtl ? 'المدينة، الشارع، المبنى' : 'City, Street, Building'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRegisterVendorModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isRtl ? 'حفظ واعتماد المورد' : 'Save & Qualify Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
