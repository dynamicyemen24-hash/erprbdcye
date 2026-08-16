import React, { useState, useEffect } from 'react';
import { 
  Warehouse, 
  Box, 
  Plus, 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  MapPin, 
  Tag, 
  Coins, 
  ClipboardList, 
  X, 
  TrendingDown, 
  TrendingUp, 
  RefreshCw, 
  Download, 
  Printer, 
  Layers, 
  ShieldAlert, 
  FileText, 
  Check, 
  Sparkles,
  Calendar,
  User,
  Building,
  GitFork,
  Truck,
  ArrowRight,
  ShieldCheck,
  Building2,
  BarChart3,
  Activity,
  Zap,
  Sliders,
  Compass,
  BrainCircuit,
  ArrowUpRight,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Send,
  AlertOctagon,
  Wrench,
  Clock,
  HardHat,
  FileCheck,
  Cpu,
  Users,
  ShoppingBag,
  Target,
  Shield,
  Boxes,
  XCircle,
  RotateCcw,
  PhoneCall
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';

import { FixedAssetRecord } from '../types';
import { printHTML } from '../lib/printUtils';
import { enterpriseBus } from '../lib/enterpriseNotificationBus';

// Helper: Calculate Straight-Line Depreciation per IPSAS-17
export function calculateDepreciation(
  assetOrCost: any,
  residualVal?: number,
  usefulLifeM?: number,
  purchaseDateStr?: string
) {
  let cost = 0;
  let residual = 0;
  let usefulLifeMonths = 36;
  let pDateStr = '2025-01-01';

  if (typeof assetOrCost === 'object' && assetOrCost !== null) {
    cost = assetOrCost.purchase_cost || 0;
    residual = assetOrCost.residual_value || 0;
    usefulLifeMonths = assetOrCost.useful_life_months || 36;
    pDateStr = assetOrCost.purchase_date || '2025-01-01';
  } else {
    cost = Number(assetOrCost) || 0;
    residual = residualVal || 0;
    usefulLifeMonths = usefulLifeM || 36;
    pDateStr = purchaseDateStr || '2025-01-01';
  }

  if (!cost || usefulLifeMonths <= 0) {
    return {
      monthlyDepreciation: 0,
      monthlyDepreciationYER: 0,
      elapsedMonths: 0,
      accumulatedDepreciation: 0,
      accumulatedDepreciationYER: 0,
      netBookValue: cost || 0,
      netBookValueYER: cost || 0,
      netBookValueUSD: Math.round((cost || 0) / 250),
      depreciationPercent: 0
    };
  }

  const pDate = new Date(pDateStr);
  const now = new Date();
  const elapsedMonths = Math.max(
    0,
    (now.getFullYear() - pDate.getFullYear()) * 12 + (now.getMonth() - pDate.getMonth())
  );

  const depreciableAmount = Math.max(0, cost - (residual || 0));
  const monthlyDepreciation = depreciableAmount / usefulLifeMonths;

  const accumulatedDepreciation = Math.min(
    depreciableAmount,
    Math.round(elapsedMonths * monthlyDepreciation)
  );
  const netBookValue = Math.max(residual || 0, cost - accumulatedDepreciation);
  const depreciationPercent = cost > 0 ? Math.min(100, Math.round((accumulatedDepreciation / cost) * 100)) : 0;

  const roundedMonthly = Math.round(monthlyDepreciation);
  const roundedAccum = Math.round(accumulatedDepreciation);
  const roundedNet = Math.round(netBookValue);

  return {
    monthlyDepreciation: roundedMonthly,
    monthlyDepreciationYER: roundedMonthly,
    elapsedMonths,
    accumulatedDepreciation: roundedAccum,
    accumulatedDepreciationYER: roundedAccum,
    netBookValue: roundedNet,
    netBookValueYER: roundedNet,
    netBookValueUSD: Math.round(roundedNet / 250),
    depreciationPercent
  };
}

// Helper: Get Warranty Expiration Status
export function getWarrantyInfo(warrantyExpiryStr?: string) {
  if (!warrantyExpiryStr) {
    return {
      status: 'NO_WARRANTY',
      daysRemaining: 0,
      labelAr: 'لا يوجد ضمان مسجل',
      labelEn: 'No Warranty Registered',
      color: 'slate',
      badgeBg: 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
    };
  }
  const expDate = new Date(warrantyExpiryStr);
  const now = new Date();
  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) {
    return {
      status: 'EXPIRED',
      daysRemaining: Math.abs(diffDays),
      labelAr: `منتهي منذ ${Math.abs(diffDays)} يوماً`,
      labelEn: `Expired ${Math.abs(diffDays)}d ago`,
      color: 'rose',
      badgeBg: 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
    };
  } else if (diffDays <= 60) {
    return {
      status: 'EXPIRING_SOON',
      daysRemaining: diffDays,
      labelAr: `ينتهي خلال ${diffDays} يوماً (ينصح بالمتابعة)`,
      labelEn: `Expiring in ${diffDays}d (Follow-up needed)`,
      color: 'amber',
      badgeBg: 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
    };
  } else {
    return {
      status: 'ACTIVE',
      daysRemaining: diffDays,
      labelAr: `ساري - باقي ${diffDays} يوماً`,
      labelEn: `Active - ${diffDays}d left`,
      color: 'emerald',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
    };
  }
}

export interface BranchData {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  region_ar: string;
  region_en: string;
  manager_name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface WarehouseData {
  id: string;
  branch_id: string;
  code?: string;
  name_ar: string;
  name_en: string;
  location_ar: string;
  location_en: string;
  manager_name: string;
  capacity: string;
  percentage_used: number;
}

export interface ReliefInventoryItem {
  id: string;
  sku: string;
  name_ar: string;
  name_en: string;
  qty: number;
  unit_ar: string;
  unit_en: string;
  warehouse_id: string;
  category: 'FOOD_AID' | 'NUTRITION' | 'SHELTER' | 'MEDICAL' | 'WASH' | 'EDUCATION';
  unit_value_yer: number;
  reorder_level: number;
  batch_no: string;
  expiry_date: string;
  donor_ref?: string;
  notes?: string;

  // Expanded Asset Condition & Periodic Maintenance
  asset_type?: 'CONSUMABLE' | 'FIXED_ASSET' | 'EQUIPMENT' | 'VEHICLE';
  condition?: 'NEW' | 'USED_GOOD' | 'UNDER_MAINTENANCE' | 'DAMAGED' | 'DISPOSED';
  serial_no?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_interval_days?: number;
  maintenance_status?: 'UP_TO_DATE' | 'DUE_SOON' | 'OVERDUE' | 'IN_REPAIR';

  // Interconnected Enterprise Links (HR, Accounts, Projects, Procurement)
  assigned_custodian_hr?: string; // الموارد البشرية HR
  accounting_ledger_code?: string; // الحسابات & IPSAS-17
  project_activity_id?: string; // أنشطة المشاريع
  procurement_po_ref?: string; // المشتريات & PO
}

export interface StockMovementRecord {
  id: string;
  date: string;
  time: string;
  itemId: string;
  itemNameAr: string;
  itemNameEn: string;
  type: 'RECEIVE' | 'DISBURSE' | 'TRANSFER';
  qty: number;
  unitAr: string;
  warehouseNameAr: string; // Source Warehouse Name
  warehouseNameEn: string;
  targetWarehouseId?: string;
  targetWarehouseNameAr?: string; // Target Warehouse Name
  targetWarehouseNameEn?: string;
  branchNameAr?: string;
  targetBranchNameAr?: string;
  waybillNo?: string; // رقم بوليصة / أمر النقل
  driverName?: string; // اسم السائق
  vehiclePlate?: string; // رقم الشاحنة / الوسيلة
  refNo: string;
  recipientOrDonor: string;
  notes: string;
  authorizedBy: string;
}

interface InventoryManagementViewProps {
  lang: 'ar' | 'en';
  currentUser?: any;
  beneficiaries?: any[];
  onNavigate?: (tab: string) => void;
}

export const DEFAULT_MULTI_BENEFICIARIES = [
  { id: 'ben-01', beneficiary_code: 'BEN-MRB-101', full_name_ar: 'فاطمة محمد علي الوصابي', governorate: 'مأرب', district: 'المدينة - مخيم الجفينة', category_code: 'IDP', family_size: 7, phone_primary: '+967 771 882 391', status_code: 'ACTIVE' },
  { id: 'ben-02', beneficiary_code: 'BEN-HUD-204', full_name_ar: 'صالح عبده حسن الريمي', governorate: 'الحديدة', district: 'الخوخة - المخيم المركزي', category_code: 'POOR_FAMILY', family_size: 5, phone_primary: '+967 733 491 022', status_code: 'ACTIVE' },
  { id: 'ben-03', beneficiary_code: 'BEN-TAIZ-309', full_name_ar: 'عمر عبد الرحمن ياسين الحيمي', governorate: 'تعز', district: 'المظفر - حي الروضة', category_code: 'ORPHAN', family_size: 4, phone_primary: '+967 711 904 223', status_code: 'ACTIVE' },
  { id: 'ben-04', beneficiary_code: 'BEN-SAD-412', full_name_ar: 'أروى أحمد عبد الله المخلافي', governorate: 'صعدة', district: 'سحار', category_code: 'WIDOW', family_size: 6, phone_primary: '+967 775 620 119', status_code: 'ACTIVE' },
  { id: 'ben-05', beneficiary_code: 'BEN-MRB-515', full_name_ar: 'خالد يحيى علي الأشول', governorate: 'مأرب', district: 'الوادي - آل شبوان', category_code: 'IDP', family_size: 10, phone_primary: '+967 735 118 409', status_code: 'ACTIVE' },
  { id: 'ben-06', beneficiary_code: 'BEN-HAD-620', full_name_ar: 'مريم سعيد باوزير', governorate: 'حضرموت', district: 'المكلا - الشرج', category_code: 'DISABLED', family_size: 3, phone_primary: '+967 770 334 112', status_code: 'ACTIVE' },
  { id: 'ben-07', beneficiary_code: 'BEN-SHB-711', full_name_ar: 'منصور سالم العولقي', governorate: 'شبوة', district: 'عتق', category_code: 'POOR_FAMILY', family_size: 8, phone_primary: '+967 712 554 990', status_code: 'ACTIVE' }
];

export const PRESET_DISBURSEMENT_KITS = [
  {
    id: 'RAMADAN_FOOD_BASKET',
    name_ar: 'سلة غذائية رمضانية متكاملة (دقيق، أرز، زيت، سكر، تمر)',
    name_en: 'Complete Ramadan Relief Food Basket',
    item_ids: ['inv-101'],
    base_qtys: { 'inv-101': 1 }
  },
  {
    id: 'WINTER_SHELTER_KIT',
    name_ar: 'حقيبة الشتاء والإيواء الطارئة (خيمة، بطانيات، طقم تدفئة)',
    name_en: 'Emergency Winter & Shelter Relief Kit',
    item_ids: ['inv-104'],
    base_qtys: { 'inv-104': 2 }
  },
  {
    id: 'NUTRITION_HYGIENE_KIT',
    name_ar: 'طرد الصحة والنظافة ومكملات تغذية الأطفال (PlumpyNut)',
    name_en: 'Hygiene & Infant Nutrition Relief Pack',
    item_ids: ['inv-102', 'inv-105'],
    base_qtys: { 'inv-102': 2, 'inv-105': 1 }
  },
  {
    id: 'SCHOOL_BAG_KIT',
    name_ar: 'حقيبة الطالب المدرسي والمستلزمات الدراسية',
    name_en: 'School Student Relief Kit',
    item_ids: ['inv-105'],
    base_qtys: { 'inv-105': 3 }
  }
];

const DEFAULT_BRANCHES: BranchData[] = [
  {
    id: 'br-1',
    code: 'BR-MRB',
    name_ar: 'فرع مأرب الرئيسي',
    name_en: 'Marib Main Branch',
    region_ar: 'إقليم سبأ',
    region_en: 'Saba Region',
    manager_name: 'د. عبدالله المرادي',
    status: 'ACTIVE'
  },
  {
    id: 'br-2',
    code: 'BR-HDH',
    name_ar: 'فرع الحديدة والساحل الغربي',
    name_en: 'Hodeidah & West Coast Branch',
    region_ar: 'الساحل الغربي',
    region_en: 'West Coast Region',
    manager_name: 'أ. طارق عبدالكريم',
    status: 'ACTIVE'
  },
  {
    id: 'br-3',
    code: 'BR-HDM',
    name_ar: 'فرع إقليم حضرموت - المكلا',
    name_en: 'Hadramout Branch - Mukalla',
    region_ar: 'إقليم حضرموت',
    region_en: 'Hadramout Region',
    manager_name: 'مهندس سكران الكثيري',
    status: 'ACTIVE'
  },
  {
    id: 'br-4',
    code: 'BR-ADN',
    name_ar: 'فرع العاصمة عدن',
    name_en: 'Aden Capital Branch',
    region_ar: 'العاصمة عدن',
    region_en: 'Aden Capital',
    manager_name: 'د. مريم الشعيبي',
    status: 'ACTIVE'
  }
];

const DEFAULT_WAREHOUSES: WarehouseData[] = [
  {
    id: 'wh-1',
    branch_id: 'br-1',
    name_ar: 'المستودع المركزي - مأرب الرئيسي',
    name_en: 'Central Warehouse - Marib HQ',
    location_ar: 'مأرب - المركز الرئيسي',
    location_en: 'Marib - HQ Center',
    manager_name: 'أحمد علي السقاف',
    capacity: '25,000 m³',
    percentage_used: 78
  },
  {
    id: 'wh-2',
    branch_id: 'br-2',
    name_ar: 'مستودع الساحل الغربي - الحديدة',
    name_en: 'West Coast Warehouse - Al Hudaydah',
    location_ar: 'الحديدة - الخوخة اللوجستية',
    location_en: 'Hodeidah - Al Khawkhah Hub',
    manager_name: 'سالم محمد باعباد',
    capacity: '12,500 m³',
    percentage_used: 64
  },
  {
    id: 'wh-3',
    branch_id: 'br-3',
    name_ar: 'مستودع حضرموت المركزي',
    name_en: 'Hadramout Regional Depot',
    location_ar: 'المكلا - المنطقة الصناعية',
    location_en: 'Mukalla - Industrial Area',
    manager_name: 'خالد عمر العمودي',
    capacity: '18,000 m³',
    percentage_used: 42
  },
  {
    id: 'wh-4',
    branch_id: 'br-4',
    name_ar: 'مستودع عدن اللوجستي الإغاثي',
    name_en: 'Aden Relief Logistics Depot',
    location_ar: 'عدن - ميناء الحاويات',
    location_en: 'Aden - Container Port',
    manager_name: 'ياسين محمود العفيف',
    capacity: '30,000 m³',
    percentage_used: 55
  }
];

export const DEFAULT_FIXED_ASSETS: FixedAssetRecord[] = [
  {
    id: 'ast-101',
    asset_code: 'AST-2026-0001',
    name_ar: 'سيارة تويوتا هايلوكس دبل كابين 4WD',
    name_en: 'Toyota Hilux 4WD Operations Vehicle',
    category: 'VEHICLE',
    serial_number: 'SN-TH-998241',
    purchase_date: '2025-01-15',
    purchase_cost: 45000000,
    current_value: 38000000,
    depreciation_rate: 10,
    accumulated_depreciation: 7000000,
    useful_life_months: 60,
    residual_value: 5000000,
    supplier_name: 'شركة وكالة التيسير للسيارات',
    supplier_contact: '+967-771234567',
    warranty_expiry_date: '2027-01-15',
    location_name: 'المستودع المركزي - مأرب الرئيسي',
    warehouse_id: 'wh-1',
    project_id: 'prj-101',
    project_name: 'مشروع السلال الغذائية والأمن الغذائي مأرب',
    activity_id: 'ACT-LOGISTICS-01',
    assigned_custodian_hr: 'م. أحمد سالم باثواب (مسؤول اللوجستيات)',
    condition_code: 'USED_GOOD',
    status_code: 'MAPPED_TO_PROJECT',
    last_maintenance_date: '2026-06-10',
    next_maintenance_date: '2026-12-10'
  },
  {
    id: 'ast-102',
    asset_code: 'AST-2026-0002',
    name_ar: 'خوادم معالجة البيانات المركزية Nexora',
    name_en: 'Nexora Enterprise Server Node',
    category: 'IT_EQUIPMENT',
    serial_number: 'SN-NX-774012',
    purchase_date: '2025-06-10',
    purchase_cost: 12000000,
    current_value: 9500000,
    depreciation_rate: 15,
    accumulated_depreciation: 2500000,
    useful_life_months: 36,
    residual_value: 1000000,
    supplier_name: 'الشركة اليمنية للحلول الرقمية',
    supplier_contact: '+967-733445566',
    warranty_expiry_date: '2028-06-10',
    location_name: 'غرفة الخوادم الرئيسية - الإدارة العامة',
    warehouse_id: 'wh-1',
    project_id: 'prj-103',
    project_name: 'مشروع التحول الرقمي والأثر الميداني',
    activity_id: 'ACT-IT-CORE',
    assigned_custodian_hr: 'د. عبدالكريم الحمداني (مدير النظم والمعلومات)',
    condition_code: 'NEW',
    status_code: 'ACTIVE',
    last_maintenance_date: '2026-05-01',
    next_maintenance_date: '2026-11-01'
  },
  {
    id: 'ast-103',
    asset_code: 'AST-2026-0003',
    name_ar: 'حفار آبار المياه الجوفية التكتيكي الثقيل',
    name_en: 'Coastal Borehole Drilling Rig',
    category: 'HEAVY_MACHINERY',
    serial_number: 'SN-DRILL-88391',
    purchase_date: '2024-03-20',
    purchase_cost: 180000000,
    current_value: 140000000,
    depreciation_rate: 8,
    accumulated_depreciation: 40000000,
    useful_life_months: 120,
    residual_value: 20000000,
    supplier_name: 'المؤسسة العربية للمعدات الثقيلة',
    supplier_contact: '+967-711889900',
    warranty_expiry_date: '2026-03-20',
    location_name: 'موقع الحفر الميداني - الحديدة',
    warehouse_id: 'wh-2',
    project_id: 'prj-102',
    project_name: 'مشروع الاستجابة الطارئة والمياه - الساحل الغربي',
    activity_id: 'ACT-WATER-RIG',
    assigned_custodian_hr: 'م. ناصر سعيد المعمري (مهندس حفر الآبار)',
    condition_code: 'UNDER_MAINTENANCE',
    status_code: 'UNDER_MAINTENANCE',
    last_maintenance_date: '2026-07-15',
    next_maintenance_date: '2026-08-15'
  },
  {
    id: 'ast-104',
    asset_code: 'AST-2026-0004',
    name_ar: 'منظومة ضخ مياه بالطاقة الشمسية المتكاملة',
    name_en: 'Solar Water Pump System',
    category: 'EQUIPMENT',
    serial_number: 'SN-SOLAR-3321',
    purchase_date: '2025-09-01',
    purchase_cost: 35000000,
    current_value: 32000000,
    depreciation_rate: 12,
    accumulated_depreciation: 3000000,
    useful_life_months: 84,
    residual_value: 3000000,
    supplier_name: 'شركة طاقة المستقبل اليمنية',
    supplier_contact: '+967-775511223',
    warranty_expiry_date: '2030-09-01',
    location_name: 'مستودع الساحل الغربي - الحديدة',
    warehouse_id: 'wh-2',
    project_id: 'prj-102',
    project_name: 'مشروع الاستجابة الطارئة والمياه - الساحل الغربي',
    activity_id: 'ACT-SOLAR-02',
    assigned_custodian_hr: 'م. خالد عبدالرحيم (أخصائي الطاقة البديلة)',
    condition_code: 'USED_GOOD',
    status_code: 'MAPPED_TO_PROJECT',
    last_maintenance_date: '2026-04-10',
    next_maintenance_date: '2026-10-10'
  }
];

export const DEFAULT_PROJECTS_LIST = [
  { id: 'prj-101', code: 'PRJ-2026-001', name_ar: 'مشروع السلال الغذائية والأمن الغذائي مأرب', name_en: 'Marib Food Basket & Food Security Project', budget: '120000000', spent: '42000000' },
  { id: 'prj-102', code: 'PRJ-2026-002', name_ar: 'مشروع الاستجابة الطارئة والمياه - الساحل الغربي', name_en: 'West Coast Emergency WASH Response', budget: '250000000', spent: '98000000' },
  { id: 'prj-103', code: 'PRJ-2026-003', name_ar: 'مشروع التحول الرقمي والأثر الميداني', name_en: 'Digital Transformation & Field Impact Project', budget: '45000000', spent: '18000000' },
  { id: 'prj-104', code: 'PRJ-2026-004', name_ar: 'مشروع التغذية العلاجية للأطفال - الخوخة', name_en: 'Therapeutic Nutrition Project - Al Khawkhah', budget: '85000000', spent: '31000000' }
];

export const DEFAULT_WBS_ACTIVITIES: Record<string, Array<{ id: string; code: string; name_ar: string; name_en: string; allocated_budget_yer: number; spent_budget_yer: number }>> = {
  'prj-101': [
    { id: 'wbs-101-1', code: 'WBS-1.1', name_ar: 'توزيع السلال الغذائية الطارئة - مخيمات النازحين بمأرب', name_en: 'Emergency Food Basket Distribution - Marib IDPs', allocated_budget_yer: 70000000, spent_budget_yer: 25000000 },
    { id: 'wbs-101-2', code: 'WBS-1.2', name_ar: 'دعم وتجهيز المطابخ المجتمعية والتغذية المباشرة', name_en: 'Community Kitchens Support & Direct Meals', allocated_budget_yer: 50000000, spent_budget_yer: 17000000 },
  ],
  'prj-102': [
    { id: 'wbs-102-1', code: 'WBS-2.1', name_ar: 'حفر وتجهيز آبار المياه الجوفية بالطاقة الشمسية بالخوخة', name_en: 'Solar-Powered Borehole Drilling - Al Khawkhah', allocated_budget_yer: 150000000, spent_budget_yer: 62000000 },
    { id: 'wbs-102-2', code: 'WBS-2.2', name_ar: 'توزيع حقائب النظافة الشخصية والكلور المعقم للمياه', name_en: 'Hygiene Kit Distribution & Water Purification', allocated_budget_yer: 100000000, spent_budget_yer: 36000000 },
  ],
  'prj-103': [
    { id: 'wbs-103-1', code: 'WBS-3.1', name_ar: 'توفير وتجهيز الخوادم والأجهزة اللوحية للفرق الميدانية', name_en: 'Server Provisioning & Field Tablets Deployment', allocated_budget_yer: 45000000, spent_budget_yer: 18000000 },
  ],
  'prj-104': [
    { id: 'wbs-104-1', code: 'WBS-4.1', name_ar: 'توزيع مكملات PlumpyNut للأطفال سوء التغذية الحاد', name_en: 'PlumpyNut Distribution for Malnourished Infants', allocated_budget_yer: 85000000, spent_budget_yer: 31000000 },
  ]
};

const DEFAULT_INVENTORY_ITEMS: ReliefInventoryItem[] = [
  {
    id: 'inv-101',
    sku: 'SKU-FOOD-001',
    name_ar: 'سلال غذائية متكاملة (دقيق، أرز، زيت، سكر، تمر)',
    name_en: 'Complete Relief Food Baskets (Flour, Rice, Oil, Sugar)',
    qty: 1250,
    unit_ar: 'سلة',
    unit_en: 'basket',
    warehouse_id: 'wh-1',
    category: 'FOOD_AID',
    unit_value_yer: 32000,
    reorder_level: 500,
    batch_no: 'KSRELIEF-2026-B01',
    expiry_date: '2027-06-30',
    donor_ref: 'منحة مركز الملك سلمان للإغاثة',
    asset_type: 'CONSUMABLE',
    condition: 'NEW',
    serial_no: 'N/A-BATCH-FOOD-001',
    last_maintenance_date: '2026-08-01',
    next_maintenance_date: '2027-02-01',
    maintenance_status: 'UP_TO_DATE',
    assigned_custodian_hr: 'أ. عادل ثابت - مسؤول العهد الميدانية',
    accounting_ledger_code: 'IPSAS-12-FOOD-INVENTORY-101',
    project_activity_id: 'PROJ-2026-FOOD-01 / السلال الغذائية مأرب',
    procurement_po_ref: 'PO-2026-KSRELIEF-091'
  },
  {
    id: 'inv-102',
    sku: 'SKU-NUT-002',
    name_ar: 'مكملات تغذية علاجية للأطفال (PlumpyNut)',
    name_en: 'Therapeutic Food Supplements for Infants (PlumpyNut)',
    qty: 180,
    unit_ar: 'كرتون',
    unit_en: 'carton',
    warehouse_id: 'wh-2',
    category: 'NUTRITION',
    unit_value_yer: 45000,
    reorder_level: 300,
    batch_no: 'UNICEF-2026-M04',
    expiry_date: '2026-11-15',
    donor_ref: 'دعم اليونيسف (UNICEF)',
    asset_type: 'CONSUMABLE',
    condition: 'NEW',
    serial_no: 'N/A-NUT-2026-M04',
    last_maintenance_date: '2026-07-15',
    next_maintenance_date: '2026-10-15',
    maintenance_status: 'UP_TO_DATE',
    assigned_custodian_hr: 'د. سامية عبدالحق - مسؤول برنامج التغذية',
    accounting_ledger_code: 'IPSAS-12-NUT-MED-202',
    project_activity_id: 'PROJ-2026-NUT-04 / حماية الطفولة والرضع',
    procurement_po_ref: 'PO-2026-UNICEF-110'
  },
  {
    id: 'inv-103',
    sku: 'SKU-SHL-003',
    name_ar: 'خيم إيواء طوارئ مقاومة للحرائق والرياح',
    name_en: 'Emergency Fire-Resistant Relief Tents',
    qty: 85,
    unit_ar: 'خيمة',
    unit_en: 'tent',
    warehouse_id: 'wh-1',
    category: 'SHELTER',
    unit_value_yer: 185000,
    reorder_level: 150,
    batch_no: 'UNHCR-2026-T88',
    expiry_date: '2030-12-31',
    donor_ref: 'المفوضية السامية لشؤون اللاجئين',
    asset_type: 'FIXED_ASSET',
    condition: 'USED_GOOD',
    serial_no: 'SN-TENT-UNHCR-8821',
    last_maintenance_date: '2026-04-10',
    next_maintenance_date: '2026-10-10',
    maintenance_status: 'UP_TO_DATE',
    assigned_custodian_hr: 'مهندس/ سليم العولقي - مشرف الإيواء',
    accounting_ledger_code: 'IPSAS-17-SHELTER-EQUIP-552',
    project_activity_id: 'PROJ-2026-SHELTER-03 / مخيمات النازحين',
    procurement_po_ref: 'PO-2026-UNHCR-302'
  },
  {
    id: 'inv-104',
    sku: 'SKU-MED-004',
    name_ar: 'حقائب إسبافات أولية وأدوية طوارئ ميدانية',
    name_en: 'Emergency First Aid Kits & Field Medicines',
    qty: 420,
    unit_ar: 'حقيبة',
    unit_en: 'kit',
    warehouse_id: 'wh-4',
    category: 'MEDICAL',
    unit_value_yer: 28000,
    reorder_level: 200,
    batch_no: 'WHO-2026-MED9',
    expiry_date: '2027-03-31',
    donor_ref: 'منظمة الصحة العالمية WHO',
    asset_type: 'EQUIPMENT',
    condition: 'USED_GOOD',
    serial_no: 'SN-MED-KIT-2026-991',
    last_maintenance_date: '2026-05-01',
    next_maintenance_date: '2026-08-01',
    maintenance_status: 'DUE_SOON',
    assigned_custodian_hr: 'د. وفاء المقطري - الكادر الطبي الميداني',
    accounting_ledger_code: 'IPSAS-17-MED-1102',
    project_activity_id: 'PROJ-2026-HEALTH-02 / العيادات المتنقلة',
    procurement_po_ref: 'PO-2026-WHO-991'
  },
  {
    id: 'inv-105',
    sku: 'SKU-WASH-005',
    name_ar: 'خزانات مياه بلاستيكية مرنة وحدات تنقية سعة 1000 لتر',
    name_en: '1000L Water Purification Tanks (WASH)',
    qty: 60,
    unit_ar: 'خزان',
    unit_en: 'tank',
    warehouse_id: 'wh-3',
    category: 'WASH',
    unit_value_yer: 95000,
    reorder_level: 80,
    batch_no: 'WASH-2026-W12',
    expiry_date: '2032-12-31',
    donor_ref: 'صندوق التمويل الإنساني YHF',
    asset_type: 'EQUIPMENT',
    condition: 'UNDER_MAINTENANCE',
    serial_no: 'SN-WASH-FILT-2025-044',
    last_maintenance_date: '2026-01-10',
    next_maintenance_date: '2026-07-10',
    maintenance_status: 'OVERDUE',
    assigned_custodian_hr: 'م. خالد باعباد - قسم الإزميل والصيانة',
    accounting_ledger_code: 'IPSAS-17-WASH-3301',
    project_activity_id: 'PROJ-2026-WASH-05 / مياه الشرب الصحية',
    procurement_po_ref: 'PO-2026-YHF-702'
  },
  {
    id: 'inv-106',
    sku: 'SKU-EDU-006',
    name_ar: 'حقائب مدرسية متكاملة مع الأدوات والقرطاسية',
    name_en: 'Complete Student Backpack Kits & Stationery',
    qty: 2100,
    unit_ar: 'حقيبة',
    unit_en: 'bag',
    warehouse_id: 'wh-3',
    category: 'EDUCATION',
    unit_value_yer: 14000,
    reorder_level: 500,
    batch_no: 'EDU-2026-E02',
    expiry_date: '2029-01-01',
    donor_ref: 'تمويل الجمعية الذاتي',
    asset_type: 'CONSUMABLE',
    condition: 'NEW',
    serial_no: 'N/A-EDU-KIT-2026',
    last_maintenance_date: '2026-08-01',
    next_maintenance_date: '2027-08-01',
    maintenance_status: 'UP_TO_DATE',
    assigned_custodian_hr: 'أ. طاهر الشبواني - مشرف التعليم',
    accounting_ledger_code: 'IPSAS-12-EDU-KIT-882',
    project_activity_id: 'PROJ-2026-EDU-01 / الحقيبة المدرسية',
    procurement_po_ref: 'PO-2026-LOCAL-EDU-41'
  },
  {
    id: 'inv-107',
    sku: 'SKU-ASSET-GEN-007',
    name_ar: 'مولد كهربائي صناعي كمنز 150 KVA للمستودع المركزي',
    name_en: 'Industrial Cummins Generator 150 KVA (Central Depot)',
    qty: 2,
    unit_ar: 'مولد',
    unit_en: 'generator',
    warehouse_id: 'wh-1',
    category: 'SHELTER',
    unit_value_yer: 12500000,
    reorder_level: 1,
    batch_no: 'CUMMINS-2025-G150',
    expiry_date: '2035-12-31',
    donor_ref: 'أصول الجمعية الرأسمالية',
    asset_type: 'FIXED_ASSET',
    condition: 'UNDER_MAINTENANCE',
    serial_no: 'SN-CUMMINS-150-2024-992',
    last_maintenance_date: '2026-01-15',
    next_maintenance_date: '2026-07-15',
    maintenance_status: 'OVERDUE',
    assigned_custodian_hr: 'مهندس/ علي العبسي - مسؤل تشغيل المولدات',
    accounting_ledger_code: 'IPSAS-17-FIXED-GEN-102',
    project_activity_id: 'PROJ-2026-LOG-OPS / تشغيل المستودعات المركزية',
    procurement_po_ref: 'PO-2025-CUMMINS-001'
  },
  {
    id: 'inv-108',
    sku: 'SKU-ASSET-TRK-008',
    name_ar: 'شاحنة نقل عيني إغاثية مان 10 طن',
    name_en: 'MAN 10-Ton Relief Logistics Truck',
    qty: 3,
    unit_ar: 'شاحنة',
    unit_en: 'truck',
    warehouse_id: 'wh-4',
    category: 'SHELTER',
    unit_value_yer: 45000000,
    reorder_level: 2,
    batch_no: 'MAN-FLEET-2025',
    expiry_date: '2040-12-31',
    donor_ref: 'أسطول النقل واللوجستيات',
    asset_type: 'VEHICLE',
    condition: 'USED_GOOD',
    serial_no: 'VIN-MAN-2025-482910',
    last_maintenance_date: '2026-06-20',
    next_maintenance_date: '2026-09-20',
    maintenance_status: 'UP_TO_DATE',
    assigned_custodian_hr: 'أ. عثمان الحضرمي - أسطول النقل الميداني',
    accounting_ledger_code: 'IPSAS-17-FLEET-2004',
    project_activity_id: 'PROJ-2026-DIST-OPS / خطوط الإمداد والتوزيع',
    procurement_po_ref: 'PO-2025-MAN-TRUCKS-02'
  },
  {
    id: 'inv-109',
    sku: 'SKU-ASSET-SOLAR-009',
    name_ar: 'وحدة ضخ مياه شمسية بقدرة 30 كيلوواط للآبار',
    name_en: '30kW Solar Water Pumping System',
    qty: 5,
    unit_ar: 'وحدة',
    unit_en: 'system',
    warehouse_id: 'wh-3',
    category: 'WASH',
    unit_value_yer: 18500000,
    reorder_level: 2,
    batch_no: 'SOLAR-2025-PUMP30',
    expiry_date: '2035-12-31',
    donor_ref: 'منحة مركز الملك سلمان للإغاثة',
    asset_type: 'EQUIPMENT',
    condition: 'DAMAGED',
    serial_no: 'SN-SOLAR-PUMP-9921',
    last_maintenance_date: '2025-11-01',
    next_maintenance_date: '2026-05-01',
    maintenance_status: 'OVERDUE',
    assigned_custodian_hr: 'م. رامي الشميري - فريق الإزميل الميداني',
    accounting_ledger_code: 'IPSAS-17-SOLAR-4011',
    project_activity_id: 'PROJ-2026-WASH-05 / آبار مياه حضرموت',
    procurement_po_ref: 'PO-2025-SOLAR-119'
  }
];

const DEFAULT_MOVEMENTS: StockMovementRecord[] = [
  {
    id: 'sm-201',
    date: '2026-08-08',
    time: '10:15',
    itemId: 'inv-101',
    itemNameAr: 'سلال غذائية متكاملة (دقيق، أرز، زيت، سكر، تمر)',
    itemNameEn: 'Complete Relief Food Baskets',
    type: 'RECEIVE',
    qty: 500,
    unitAr: 'سلة',
    warehouseNameAr: 'المستودع المركزي - مأرب الرئيسي',
    warehouseNameEn: 'Central Warehouse - Marib HQ',
    refNo: 'GRN-2026-091',
    recipientOrDonor: 'مركز الملك سلمان للإغاثة',
    notes: 'وصول دفعة توريد إضافية ضمن مشروع الأمن الغذائي 2026',
    authorizedBy: 'أمين المستودع الرئيسي'
  },
  {
    id: 'sm-202',
    date: '2026-08-08',
    time: '08:40',
    itemId: 'inv-102',
    itemNameAr: 'مكملات تغذية علاجية للأطفال (PlumpyNut)',
    itemNameEn: 'Therapeutic Food Supplements for Infants',
    type: 'DISBURSE',
    qty: 250,
    unitAr: 'كرتون',
    warehouseNameAr: 'مستودع الساحل الغربي - الحديدة',
    warehouseNameEn: 'West Coast Warehouse - Al Hudaydah',
    refNo: 'SARF-2026-114',
    recipientOrDonor: 'عيادة التغذية الميدانية - مخيم الخوخة',
    notes: 'صرف استجابة طارئة لسوء التغذية الحاد لدى الأطفال',
    authorizedBy: 'مدير العمليات اللوجستية'
  },
  {
    id: 'sm-203',
    date: '2026-08-07',
    time: '14:20',
    itemId: 'inv-101',
    itemNameAr: 'سلال غذائية متكاملة (دقيق، أرز، زيت، سكر، تمر)',
    itemNameEn: 'Complete Relief Food Baskets',
    type: 'TRANSFER',
    qty: 300,
    unitAr: 'سلة',
    warehouseNameAr: 'المستودع المركزي - مأرب الرئيسي',
    warehouseNameEn: 'Central Warehouse - Marib HQ',
    targetWarehouseId: 'wh-2',
    targetWarehouseNameAr: 'مستودع الساحل الغربي - الحديدة',
    targetWarehouseNameEn: 'West Coast Warehouse - Al Hudaydah',
    branchNameAr: 'فرع مأرب الرئيسي',
    targetBranchNameAr: 'فرع الحديدة والساحل الغربي',
    waybillNo: 'TR-WAY-2026-042',
    driverName: 'منصور شاهر العولقي',
    vehiclePlate: 'شاحنة مرسيدس 55214-ص',
    refNo: 'TRF-2026-088',
    recipientOrDonor: 'تحويل عيني بين الفروع والمخازن',
    notes: 'تعزيز المخزون الإغاثي بالساحل الغربي لمواجهة موجة النزوح الجديدة',
    authorizedBy: 'مدير عام اللوجستيات وسلاسل الإمداد'
  }
];

export function InventoryManagementView({ lang, currentUser, beneficiaries, onNavigate }: InventoryManagementViewProps) {
  const isRtl = lang === 'ar';
  const userEmail = currentUser?.email || 'admin@rohamaab.org';

  const triggerPushNotificationToast = (title: string, message: string) => {
    enterpriseBus.notifyToast({ type: 'success', title, message });
  };

  // Persistent States
  const [branches, setBranches] = useState<BranchData[]>(() => {
    try {
      const saved = localStorage.getItem(`nexora_branches_${userEmail}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_BRANCHES;
  });

  const [warehouses, setWarehouses] = useState<WarehouseData[]>(() => {
    try {
      const saved = localStorage.getItem(`nexora_wh_${userEmail}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_WAREHOUSES;
  });

  const [items, setItems] = useState<ReliefInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(`nexora_inv_items_${userEmail}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_INVENTORY_ITEMS;
  });

  const [movements, setMovements] = useState<StockMovementRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`nexora_inv_movements_${userEmail}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MOVEMENTS;
  });

  // ==================== PUSH NOTIFICATION & REAL-TIME CRITICAL ALERT ENGINE ====================
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activePushToast, setActivePushToast] = useState<{ id: string; title: string; body: string; item?: ReliefInventoryItem } | null>(null);
  const [pushLogs, setPushLogs] = useState<Array<{ id: string; title: string; body: string; time: string; sku?: string }>>([]);
  const alertedItemIdsRef = React.useRef<Set<string>>(new Set());

  // Check browser Notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  // Request Web Push Authorization
  const requestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert(isRtl ? 'إشعارات الدفع عبر المتصفح غير مدعومة في هذه البيئة.' : 'Web Push Notifications are not supported in this browser environment.');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setPushPermission(res);
      if (res === 'granted') {
        triggerPushAlert(
          isRtl ? 'تم تفعيل إشعارات الدفع بنجاح! 🔔' : 'Push Notifications Authorized! 🔔',
          isRtl ? 'ستصلك الآن تنبيهات نفاذ المخزون الإغاثي فور وصول أي مادة لمستوى الخطر.' : 'You will now receive real-time push alerts when relief items reach critical levels.',
          'info'
        );
      }
    } catch (e) {
      console.error('Permission request failed:', e);
    }
  };

  // Play High-Frequency Audio Chime Tone
  const playChimeTone = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      // Audio Context blocked or unavailable
    }
  };

  // Core Push Dispatcher
  const triggerPushAlert = (title: string, body: string, type: 'critical' | 'info' = 'critical', item?: ReliefInventoryItem) => {
    playChimeTone();

    // 1. Dispatch Web Browser Push Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const logoIcon = localStorage.getItem('rbd_logo_url') || '/LogoRohamaab.png';
        new Notification(title, {
          body: body,
          icon: logoIcon,
          tag: 'inv-push-' + Date.now(),
          requireInteraction: type === 'critical'
        });
      } catch (e) {
        console.warn('Browser sandbox blocked push dispatch, relying on in-app channels.', e);
      }
    }

    // 2. Dispatch custom window event to sync with NotificationCenter at the top navbar
    window.dispatchEvent(
      new CustomEvent('nexora-inventory-alert', {
        detail: { title, body, type, actionTab: 'inventory' }
      })
    );

    // 3. Log to local Push History
    const newLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title,
      body,
      time: new Date().toLocaleTimeString(isRtl ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sku: item?.sku
    };
    setPushLogs(prev => [newLog, ...prev].slice(0, 15));

    // 4. Show active Floating In-App Toast
    setActivePushToast({
      id: newLog.id,
      title,
      body,
      item
    });
  };

  // Automated Real-Time Stock Monitoring Hook
  useEffect(() => {
    const criticals = items.filter(i => i.qty <= i.reorder_level);
    criticals.forEach(item => {
      const alertKey = `${item.id}-${item.qty}`;
      if (!alertedItemIdsRef.current.has(alertKey)) {
        alertedItemIdsRef.current.add(alertKey);

        const wh = warehouses.find(w => w.id === item.warehouse_id);
        const whName = wh ? (isRtl ? wh.name_ar : wh.name_en) : '';
        const title = isRtl 
          ? `🚨 تنبيه دفع: وصول المادة الإغاثية (${item.name_ar}) لمستوى الخطر!`
          : `🚨 Push Alert: Relief Item (${item.name_en}) Critical Stock!`;
        const body = isRtl
          ? `الموقع: ${whName} | الرصيد المتبقي: ${item.qty} ${item.unit_ar} (حد إعادة الطلب: ${item.reorder_level} ${item.unit_ar}). يرجى توريد شحنة طارئة.`
          : `Location: ${whName} | Available Qty: ${item.qty} ${item.unit_en} (Reorder Limit: ${item.reorder_level} ${item.unit_en}). Emergency reorder required.`;

        triggerPushAlert(title, body, 'critical', item);
      }
    });
  }, [items, warehouses, isRtl]);

  // Navigation & Analytics States
  const [activeViewTab, setActiveViewTab] = useState<'analytics' | 'inventory' | 'assets' | 'warehouses' | 'movements' | 'procurement'>('analytics');
  
  // Procurement Requisition Integration States
  const [procurementRequests, setProcurementRequests] = useState<any[]>([]);
  const [loadingProcurementRequests, setLoadingProcurementRequests] = useState<boolean>(false);
  const [procurementSuccessMsg, setProcurementSuccessMsg] = useState<string | null>(null);

  // WBS Material Issue Request States
  const [isMaterialIssueModalOpen, setIsMaterialIssueModalOpen] = useState<boolean>(false);
  const [materialIssueSubmitting, setMaterialIssueSubmitting] = useState<boolean>(false);
  const [materialIssueForm, setMaterialIssueForm] = useState({
    projectId: 'prj-101',
    wbsActivityId: 'wbs-101-1',
    warehouseId: 'wh-1',
    itemId: 'inv-101',
    requestedQty: '200',
    notes: 'صرف مواد خفيفة وعاجلة لمستفيدي مخيمات النازحين بمأرب حسب خطة WBS',
    requesterRole: 'Project Officer'
  });

  // ==================== MULTI-BENEFICIARY MULTI-SKU DISBURSEMENT ENGINE STATES ====================
  const allBeneficiaries = (beneficiaries && beneficiaries.length > 0) ? beneficiaries : DEFAULT_MULTI_BENEFICIARIES;
  
  const [isMultiDisbursementModalOpen, setIsMultiDisbursementModalOpen] = useState<boolean>(false);
  const [multiStep, setMultiStep] = useState<number>(1);
  const [multiWarehouseId, setMultiWarehouseId] = useState<string>('wh-1');
  const [multiProjectActivity, setMultiProjectActivity] = useState<string>('PROJ-2026-FOOD-01 / الإغاثة العاجلة والأمن الغذائي');
  
  // Beneficiary Filters
  const [multiGovFilter, setMultiGovFilter] = useState<string>('ALL');
  const [multiCategoryFilter, setMultiCategoryFilter] = useState<string>('ALL');
  const [multiSearchTerm, setMultiSearchTerm] = useState<string>('');
  
  // Selection States
  const [selectedBenIds, setSelectedBenIds] = useState<string[]>(['ben-01', 'ben-02', 'ben-05']);
  const [selectedPresetKit, setSelectedPresetKit] = useState<string>('RAMADAN_FOOD_BASKET');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(['inv-101']);
  const [defaultItemQtys, setDefaultItemQtys] = useState<Record<string, number>>({ 'inv-101': 1 });
  const [enableFamilyScaling, setEnableFamilyScaling] = useState<boolean>(true);
  
  // Dynamic Matrix Quantities: matrixQtys[benId][itemId] = qty
  const [matrixQtys, setMatrixQtys] = useState<Record<string, Record<string, number>>>({
    'ben-01': { 'inv-101': 2 },
    'ben-02': { 'inv-101': 1 },
    'ben-05': { 'inv-101': 3 }
  });
  
  // Verification & Execution
  const [verificationMode, setVerificationMode] = useState<'ELECTRONIC_MANIFEST' | 'BIOMETRIC_SIGNATURE' | 'DIRECT_WAREHOUSE_DISPATCH'>('ELECTRONIC_MANIFEST');
  const [distributionBatchRef, setDistributionBatchRef] = useState<string>(`SARF-MULTI-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isMultiExecuted, setIsMultiExecuted] = useState<boolean>(false);
  const [multiExecuting, setMultiExecuting] = useState<boolean>(false);

  // Advanced Management & Strategy Customizations
  const [allocationStrategy, setAllocationStrategy] = useState<'SPHERE_FAMILY_SCALE' | 'EQUAL_FLAT' | 'FINANCIAL_CAP' | 'VULNERABILITY_PRIORITY'>('SPHERE_FAMILY_SCALE');
  const [financialCapPerFamily, setFinancialCapPerFamily] = useState<number>(75000); // 75,000 YER cap per family
  const [donorFundingRef, setDonorFundingRef] = useState<string>('منحة مركز الملك سلمان للإغاثة (KSRELIEF-2026-FOOD)');
  const [planTemplateName, setPlanTemplateName] = useState<string>('');
  
  // Saved Disbursement Plans Storage
  const [savedDisbursementPlans, setSavedDisbursementPlans] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`nexora_disbursement_plans_${userEmail}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'plan-1',
        title: 'خطة توزيع السلال الغذائية الرمضانية - مرحلة مأرب',
        warehouseId: 'wh-1',
        projectActivity: 'PROJ-2026-FOOD-01 / الإغاثة العاجلة والأمن الغذائي',
        strategy: 'SPHERE_FAMILY_SCALE',
        benIds: ['ben-01', 'ben-05'],
        itemIds: ['inv-101'],
        donorRef: 'منحة مركز الملك سلمان للإغاثة (KSRELIEF-2026-FOOD)'
      },
      {
        id: 'plan-2',
        title: 'استجابة مخيمات النازحين والطفولة الطارئة - الساحل الغربي',
        warehouseId: 'wh-2',
        projectActivity: 'PROJ-2026-HEALTH-02 / التغذية العلاجية والعيادات الميدانية',
        strategy: 'SPHERE_FAMILY_SCALE',
        benIds: ['ben-02', 'ben-03'],
        itemIds: ['inv-102', 'inv-105'],
        donorRef: 'صندوق التمويل الإنساني اليمني (YHF-2026-EMERGENCY)'
      }
    ];
  });

  // Save Current Configuration as a Plan Template
  const handleSavePlanTemplate = () => {
    if (!planTemplateName.trim()) return;
    const newPlan = {
      id: `plan-${Date.now()}`,
      title: planTemplateName.trim(),
      warehouseId: multiWarehouseId,
      projectActivity: multiProjectActivity,
      strategy: allocationStrategy,
      benIds: selectedBenIds,
      itemIds: selectedItemIds,
      donorRef: donorFundingRef,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newPlan, ...savedDisbursementPlans];
    setSavedDisbursementPlans(updated);
    try {
      localStorage.setItem(`nexora_disbursement_plans_${userEmail}`, JSON.stringify(updated));
    } catch (e) {}
    setPlanTemplateName('');
    triggerPushNotificationToast(
      isRtl ? 'تم حفظ خطة الصرف والتوزيع بنجاح 📋' : 'Disbursement Plan Saved!',
      isRtl ? `تم تخزين النموذج "${newPlan.title}" للاستخدام الميداني المستقبلي.` : `Saved plan ${newPlan.title}.`
    );
  };

  // Load Saved Plan Template
  const handleLoadPlanTemplate = (plan: any) => {
    if (!plan) return;
    if (plan.warehouseId) setMultiWarehouseId(plan.warehouseId);
    if (plan.projectActivity) setMultiProjectActivity(plan.projectActivity);
    if (plan.strategy) setAllocationStrategy(plan.strategy);
    if (plan.benIds) setSelectedBenIds(plan.benIds);
    if (plan.itemIds) setSelectedItemIds(plan.itemIds);
    if (plan.donorRef) setDonorFundingRef(plan.donorRef);
    syncDisbursementMatrix(plan.benIds || selectedBenIds, plan.itemIds || selectedItemIds, defaultItemQtys, enableFamilyScaling);
  };

  // Auto-Cap Shortfall: Automatically adjusts matrix quantities so total requested does not exceed available stock!
  const handleAutoCapShortfall = () => {
    const newMatrix = { ...matrixQtys };
    selectedItemIds.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      const currentStock = item.qty || 0;
      let totalReq = selectedBenIds.reduce((sum, bId) => sum + (newMatrix[bId]?.[itemId] || 0), 0);
      
      if (totalReq > currentStock && totalReq > 0) {
        const factor = currentStock / totalReq;
        selectedBenIds.forEach(bId => {
          if (newMatrix[bId]?.[itemId]) {
            newMatrix[bId][itemId] = Math.max(1, Math.floor(newMatrix[bId][itemId] * factor));
          }
        });
      }
    });
    setMatrixQtys(newMatrix);
    triggerPushNotificationToast(
      isRtl ? 'تم إعادة ضبط الكميات لمطابقة رصيد المستودع ✓' : 'Quantities Auto-Capped to Stock',
      isRtl ? 'تم ضبط حصص المستفيدين لضمان الاستيفاء التام دون أي عجز مخزني.' : 'Adjusted allocations to fit available stock.'
    );
  };

  // Print Individual E-Vouchers / QR Code Receipts for Beneficiaries
  const handlePrintIndividualEVouchers = () => {
    const sourceWh = warehouses.find(w => w.id === multiWarehouseId) || warehouses[0];
    const selectedBensList = allBeneficiaries.filter(b => selectedBenIds.includes(b.id));
    const selectedItemsList = items.filter(i => selectedItemIds.includes(i.id));

    let writtenHTML = '';
    const mockDoc = {
      write: (html: string) => { writtenHTML += html; },
      close: () => { printHTML(writtenHTML); }
    };

    const dir = isRtl ? 'rtl' : 'ltr';

    mockDoc.write(`
      <!DOCTYPE html>
      <html lang="${lang}" dir="${dir}">
      <head>
        <meta charset="UTF-8">
        <title>كروت وكوبونات الصرف الميداني - ${distributionBatchRef}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; }
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; }
            .voucher-card { page-break-inside: avoid; }
            @page { size: A4; margin: 8mm; }
          }
        </style>
      </head>
      <body class="bg-slate-100 p-6 text-slate-900">
        <div class="max-w-4xl mx-auto mb-4 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
          <span class="text-xs font-bold text-slate-600">كروت وكوبونات استلام المستفيدين الذكية (تطبَع مرتين أو تقص للتسليم الميداني).</span>
          <button onclick="window.print()" class="px-5 py-2 bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer hover:bg-amber-700">
            🖨️ طباعة كوبونات الصرف (${selectedBensList.length} كارت)
          </button>
        </div>

        <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          ${selectedBensList.map((b) => {
            const benItems = selectedItemsList.map(item => ({
              name: item.name_ar,
              qty: matrixQtys[b.id]?.[item.id] || 0,
              unit: item.unit_ar
            })).filter(i => i.qty > 0);

            return `
              <div class="voucher-card bg-white border-2 border-emerald-600 rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col justify-between">
                <div class="absolute -left-10 -bottom-10 opacity-5">
                  <img src="/LogoRohamaab.png" class="w-40 h-40 object-contain" />
                </div>

                <div>
                  <!-- Voucher Header -->
                  <div class="flex justify-between items-center border-b pb-2 mb-3 border-slate-200">
                    <div class="flex items-center gap-2">
                      <img src="/LogoRohamaab.png" class="h-8 w-auto object-contain" />
                      <div>
                        <h3 class="text-xs font-black text-emerald-800">رُحماء بينهم للعمل الإنساني</h3>
                        <p class="text-[9px] text-slate-400 font-bold">كارت كوبون استلام إغاثي رقمي</p>
                      </div>
                    </div>
                    <div class="text-left font-mono">
                      <span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded">
                        ${distributionBatchRef}
                      </span>
                    </div>
                  </div>

                  <!-- Beneficiary Info -->
                  <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 text-xs space-y-1">
                    <div class="flex justify-between">
                      <span class="text-slate-500 text-[10px]">اسم المستفيد:</span>
                      <strong class="text-slate-900 font-black">${b.full_name_ar}</strong>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500 text-[10px]">الكود الموحد:</span>
                      <span class="font-mono text-emerald-700 font-bold">${b.beneficiary_code || b.id}</span>
                    </div>
                    <div class="flex justify-between text-[10px]">
                      <span class="text-slate-500">المنطقة والمديرية:</span>
                      <span>${b.governorate} - ${b.district}</span>
                    </div>
                  </div>

                  <!-- Items Table -->
                  <div class="mb-3">
                    <p class="text-[10px] font-black text-slate-700 mb-1">المواد المصرح بها في الكوبون:</p>
                    <table class="w-full text-[11px] border-collapse">
                      <thead>
                        <tr class="bg-emerald-800 text-white font-bold text-[9.5px]">
                          <th class="p-1 text-right">المادة</th>
                          <th class="p-1 text-center">الكمية المصرحة</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${benItems.map(i => `
                          <tr class="border-b border-slate-100">
                            <td class="p-1 font-bold text-slate-800">${i.name}</td>
                            <td class="p-1 text-center font-mono font-black text-emerald-700">${i.qty} ${i.unit}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Footer Authorization & QR -->
                <div class="pt-2 border-t border-dashed border-slate-300 flex justify-between items-center text-[9px] text-slate-500 font-bold">
                  <div>
                    <p>المستودع: ${sourceWh.name_ar}</p>
                    <p>توقيع المستلم: ............................</p>
                  </div>
                  <div class="text-center font-mono text-[8px] bg-slate-100 p-1 rounded border border-slate-200">
                    [QR-VERIFY-${b.id}]
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </body>
      </html>
    `);

    mockDoc.close();
  };

  // Export Matrix to CSV File
  const handleExportRosterCSV = () => {
    const selectedBensList = allBeneficiaries.filter(b => selectedBenIds.includes(b.id));
    const selectedItemsList = items.filter(i => selectedItemIds.includes(i.id));

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    // Header
    const headers = ["كود المستفيد", "اسم المستفيد الكامل", "المحافظة", "المديرية", "حجم الأسرة", ...selectedItemsList.map(i => i.name_ar)];
    csvContent += headers.map(h => `"${h}"`).join(",") + "\r\n";

    selectedBensList.forEach(b => {
      const row = [
        b.beneficiary_code || b.id,
        b.full_name_ar || b.name_ar,
        b.governorate,
        b.district,
        b.family_size || 5,
        ...selectedItemsList.map(i => matrixQtys[b.id]?.[i.id] || 0)
      ];
      csvContent += row.map(r => `"${r}"`).join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Nexora_Disbursement_Roster_${distributionBatchRef}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Recalculate matrix whenever beneficiaries, items, default quantities or scaling change
  const syncDisbursementMatrix = (bIds: string[], iIds: string[], baseQtys: Record<string, number>, useScaling: boolean) => {
    const newMatrix: Record<string, Record<string, number>> = {};
    bIds.forEach(bId => {
      const ben = allBeneficiaries.find(b => b.id === bId || b.beneficiary_code === bId);
      newMatrix[bId] = {};
      iIds.forEach(itemId => {
        let qty = baseQtys[itemId] || 1;
        if (useScaling && ben) {
          const famSize = Number(ben.family_size) || 5;
          if (famSize >= 10) qty *= 3;
          else if (famSize >= 7) qty *= 2;
        }
        newMatrix[bId][itemId] = qty;
      });
    });
    setMatrixQtys(newMatrix);
  };

  // Preset Selection Handler
  const handleSelectPresetKit = (kitId: string) => {
    setSelectedPresetKit(kitId);
    if (kitId === 'CUSTOM') return;
    const kit = PRESET_DISBURSEMENT_KITS.find(k => k.id === kitId);
    if (kit) {
      setSelectedItemIds(kit.item_ids);
      setDefaultItemQtys(kit.base_qtys);
      syncDisbursementMatrix(selectedBenIds, kit.item_ids, kit.base_qtys, enableFamilyScaling);
    }
  };

  // Toggle Beneficiary Selection
  const handleToggleBeneficiarySelect = (benId: string) => {
    const updated = selectedBenIds.includes(benId)
      ? selectedBenIds.filter(id => id !== benId)
      : [...selectedBenIds, benId];
    setSelectedBenIds(updated);
    syncDisbursementMatrix(updated, selectedItemIds, defaultItemQtys, enableFamilyScaling);
  };

  // Select All Filtered Beneficiaries
  const handleSelectAllFilteredBeneficiaries = (filteredBens: any[]) => {
    const filteredIds = filteredBens.map(b => b.id);
    const allSelected = filteredIds.every(id => selectedBenIds.includes(id));
    let updated: string[];
    if (allSelected) {
      updated = selectedBenIds.filter(id => !filteredIds.includes(id));
    } else {
      updated = Array.from(new Set([...selectedBenIds, ...filteredIds]));
    }
    setSelectedBenIds(updated);
    syncDisbursementMatrix(updated, selectedItemIds, defaultItemQtys, enableFamilyScaling);
  };

  // Execute Multi Disbursement
  const handleExecuteMultiDisbursement = async () => {
    if (selectedBenIds.length === 0 || selectedItemIds.length === 0) return;
    setMultiExecuting(true);
    
    try {
      const sourceWh = warehouses.find(w => w.id === multiWarehouseId) || warehouses[0];
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString(isRtl ? 'ar-YE' : 'en-US', { hour12: false }).slice(0, 5);
      const batchNo = distributionBatchRef || `SARF-MULTI-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newMovements: StockMovementRecord[] = [];
      const itemDeductions: Record<string, number> = {};

      selectedBenIds.forEach(benId => {
        const ben = allBeneficiaries.find(b => b.id === benId);
        selectedItemIds.forEach(itemId => {
          const item = items.find(i => i.id === itemId);
          const qty = matrixQtys[benId]?.[itemId] || 0;
          if (item && qty > 0 && ben) {
            itemDeductions[itemId] = (itemDeductions[itemId] || 0) + qty;
            newMovements.push({
              id: `sm-multi-${Date.now()}-${benId}-${itemId}`,
              date: todayStr,
              time: timeStr,
              itemId: item.id,
              itemNameAr: item.name_ar,
              itemNameEn: item.name_en,
              type: 'DISBURSE',
              qty: qty,
              unitAr: item.unit_ar,
              warehouseNameAr: sourceWh?.name_ar || 'المستودع الرئيسي',
              warehouseNameEn: sourceWh?.name_en || 'Central Depot',
              refNo: batchNo,
              recipientOrDonor: `${ben.full_name_ar || ben.name_ar} (${ben.beneficiary_code || ben.id})`,
              notes: `صرف إغاثي متعدد المستفيدين - دفعة ${batchNo} - نشاط: ${multiProjectActivity}`,
              authorizedBy: currentUser?.name || 'أمين المستودع الرئيسي'
            });
          }
        });
      });

      // Deduct items stock
      setItems(prevItems => prevItems.map(item => {
        if (itemDeductions[item.id]) {
          return {
            ...item,
            qty: Math.max(0, item.qty - itemDeductions[item.id])
          };
        }
        return item;
      }));

      // Append movements
      setMovements(prev => [...newMovements, ...prev]);

      setIsMultiExecuted(true);

      // Trigger Push Notification Toast
      triggerPushNotificationToast(
        isRtl ? 'تم تنفيذ الصرف المخزني المتعدد بنجاح 🎉' : 'Multi-Beneficiary Disbursement Complete!',
        isRtl 
          ? `تم خصم الكميات من المستودع وتوليد كشف وسندات الصرف برقم ${batchNo} لـ ${selectedBenIds.length} مستفيدين.`
          : `Disbursed items to ${selectedBenIds.length} beneficiaries under batch ${batchNo}.`
      );
    } catch (e) {
      console.error('Multi disbursement failed:', e);
    } finally {
      setMultiExecuting(false);
    }
  };

  // Print Official Field Distribution Voucher & Manifest
  const handlePrintMultiDisbursementManifest = () => {
    const sourceWh = warehouses.find(w => w.id === multiWarehouseId) || warehouses[0];
    const selectedBensList = allBeneficiaries.filter(b => selectedBenIds.includes(b.id));
    const selectedItemsList = items.filter(i => selectedItemIds.includes(i.id));

    let writtenHTML = '';
    const mockDoc = {
      write: (html: string) => { writtenHTML += html; },
      close: () => { printHTML(writtenHTML); }
    };

    const dir = isRtl ? 'rtl' : 'ltr';
    const titleText = isRtl ? 'سند وكشف الصرف والتوزيع الميداني الإغاثي المتعدد' : 'Multi-Beneficiary Material Disbursement Manifest';

    mockDoc.write(`
      <!DOCTYPE html>
      <html lang="${lang}" dir="${dir}">
      <head>
        <meta charset="UTF-8">
        <title>${titleText} - ${distributionBatchRef}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; }
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; color: black !important; }
            @page { size: A4 landscape; margin: 10mm; }
          }
        </style>
      </head>
      <body class="bg-slate-50 text-slate-900 p-6">
        <div class="max-w-6xl mx-auto mb-4 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-600">جاهز للطباعة أو التصدير بصيغة PDF ككشف توزيع رسمي معتمد.</span>
          </div>
          <button onclick="window.print()" class="px-5 py-2.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-emerald-700 transition cursor-pointer">
            🖨️ طباعة كشف الصرف والتوزيع الميداني
          </button>
        </div>

        <div class="max-w-6xl mx-auto bg-white border border-slate-300 rounded-xl p-8 shadow-lg relative min-h-[210mm]">
          <!-- Official Letterhead Header -->
          <div class="flex justify-between items-center pb-4 border-b-2 border-emerald-600 mb-6">
            <div class="flex items-center gap-4">
              <img src="/LogoRohamaab.png" alt="Rohamaab Logo" class="h-16 w-auto object-contain" />
              <div>
                <h1 class="text-lg font-black text-emerald-800">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h1>
                <p class="text-xs text-slate-500 font-bold">نظام التشغيل المؤسسي الذكي (NexoraOS™) - القطاع الإغاثي واللوجستي</p>
                <p class="text-[10px] text-amber-600 font-bold">One Platform. One Organization. One Vision.</p>
              </div>
            </div>
            <div class="text-left border-r-2 border-slate-200 pr-4">
              <div class="bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-lg text-center mb-1">
                <span class="text-[10px] text-amber-800 block font-bold">رقم كشف الصرف الموحد</span>
                <span class="font-mono text-sm font-black text-amber-900">${distributionBatchRef}</span>
              </div>
              <p class="text-[10px] text-slate-500">تاريخ الصرف: ${new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>

          <!-- Document Title Bar -->
          <div class="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-3 rounded-xl mb-6 flex justify-between items-center">
            <div>
              <h2 class="font-black text-base">سند وصرف وتوزيع مواد إغاثية متعددة الأصناف والمستفيدين</h2>
              <p class="text-[11px] text-emerald-200">المستودع المصدر: ${sourceWh.name_ar} | النشاط: ${multiProjectActivity}</p>
            </div>
            <span class="bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 text-xs px-3 py-1 rounded-full font-mono font-bold">
              عدد المستفيدين: ${selectedBensList.length} أسر
            </span>
          </div>

          <!-- Selected Items Summary -->
          <div class="mb-6">
            <h3 class="text-xs font-black text-slate-700 mb-2">موجز الأصناف والوجبات الإغاثية المعتمدة للصرف:</h3>
            <table class="w-full text-xs text-right border-collapse border border-slate-300">
              <thead>
                <tr class="bg-slate-100 font-extrabold text-slate-700">
                  <th class="p-2 border border-slate-300">رمز الصنف (SKU)</th>
                  <th class="p-2 border border-slate-300">اسم المادة / الوجبة الإغاثية</th>
                  <th class="p-2 border border-slate-300">الوحدة</th>
                  <th class="p-2 border border-slate-300">إجمالي الكمية المصروفة</th>
                </tr>
              </thead>
              <tbody>
                ${selectedItemsList.map(item => {
                  const totalQty = selectedBensList.reduce((sum, b) => sum + (matrixQtys[b.id]?.[item.id] || 0), 0);
                  return `
                    <tr>
                      <td class="p-2 border border-slate-300 font-mono font-bold">${item.sku}</td>
                      <td class="p-2 border border-slate-300 font-bold">${item.name_ar}</td>
                      <td class="p-2 border border-slate-300">${item.unit_ar}</td>
                      <td class="p-2 border border-slate-300 font-mono font-black text-emerald-700">${totalQty}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Detailed Beneficiary Roster & Matrix -->
          <div class="mb-8">
            <h3 class="text-xs font-black text-slate-700 mb-2">كشف المستفيدين المستلمين والتوقيع الميداني:</h3>
            <table class="w-full text-xs text-right border-collapse border border-slate-300">
              <thead>
                <tr class="bg-slate-800 text-white font-black text-[11px]">
                  <th class="p-2 border border-slate-400">#</th>
                  <th class="p-2 border border-slate-400">كود المستفيد</th>
                  <th class="p-2 border border-slate-400">اسم المستفيد الكامل</th>
                  <th class="p-2 border border-slate-400">المحافظة / المديرية</th>
                  <th class="p-2 border border-slate-400">حجم الأسرة</th>
                  ${selectedItemsList.map(i => `<th class="p-2 border border-slate-400 text-center">${i.name_ar}</th>`).join('')}
                  <th class="p-2 border border-slate-400 text-center w-36">التوقيع / البصمة</th>
                </tr>
              </thead>
              <tbody>
                ${selectedBensList.map((b, idx) => `
                  <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
                    <td class="p-2 border border-slate-300 text-center font-bold">${idx + 1}</td>
                    <td class="p-2 border border-slate-300 font-mono text-[10px]">${b.beneficiary_code || b.id}</td>
                    <td class="p-2 border border-slate-300 font-bold text-slate-900">${b.full_name_ar}</td>
                    <td class="p-2 border border-slate-300 text-[10px]">${b.governorate} - ${b.district}</td>
                    <td class="p-2 border border-slate-300 text-center font-bold">${b.family_size || 5} أفراد</td>
                    ${selectedItemsList.map(item => `
                      <td class="p-2 border border-slate-300 text-center font-mono font-black text-emerald-800">
                        ${matrixQtys[b.id]?.[item.id] || 0}
                      </td>
                    `).join('')}
                    <td class="p-2 border border-slate-300 text-center bg-slate-100/50">
                      <div class="h-8 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-400">
                        توقيع المستلم
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Official Signatures Footer -->
          <div class="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-300 text-center text-xs font-bold text-slate-700">
            <div>
              <p class="mb-8">أمين المستودع المصدر:</p>
              <p class="font-extrabold text-slate-900">............................................</p>
              <p class="text-[10px] text-slate-500 mt-1">التوقيع والختم</p>
            </div>
            <div>
              <p class="mb-8">منسق المشروعات والخدمات الميدانية:</p>
              <p class="font-extrabold text-slate-900">............................................</p>
              <p class="text-[10px] text-slate-500 mt-1">التوقيع والاعتماد</p>
            </div>
            <div>
              <p class="mb-8">اعتماد المدير التنفيذي / مدير اللوجستيات:</p>
              <p class="font-extrabold text-slate-900">............................................</p>
              <p class="text-[10px] text-slate-500 mt-1">ختم الاعتماد المؤسسي</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);

    mockDoc.close();
  };

  const loadProcurementRequests = async () => {
    setLoadingProcurementRequests(true);
    try {
      const res = await fetch('/api/tables/approval_requests');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProcurementRequests(data);
        }
      }
    } catch (err) {
      console.warn('Could not load procurement requests:', err);
    } finally {
      setLoadingProcurementRequests(false);
    }
  };

  useEffect(() => {
    loadProcurementRequests();
  }, []);

  const handleCreateMaterialIssueRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaterialIssueSubmitting(true);
    try {
      const selectedProj = DEFAULT_PROJECTS_LIST.find(p => p.id === materialIssueForm.projectId) || DEFAULT_PROJECTS_LIST[0];
      const activities = DEFAULT_WBS_ACTIVITIES[materialIssueForm.projectId] || DEFAULT_WBS_ACTIVITIES['prj-101'];
      const selectedAct = activities.find(a => a.id === materialIssueForm.wbsActivityId) || activities[0];
      const selectedItem = items.find(i => i.id === materialIssueForm.itemId) || items[0];
      const selectedWh = warehouses.find(w => w.id === materialIssueForm.warehouseId) || warehouses[0];

      const reqQty = Number(materialIssueForm.requestedQty) || 0;
      const unitCostYer = selectedItem.unit_value_yer || 25000;
      const totalCostYer = reqQty * unitCostYer;

      // Budget Authority Check: check if act spent + totalCostYer <= allocated_budget_yer
      const actSpent = selectedAct.spent_budget_yer || 0;
      const actAllocated = selectedAct.allocated_budget_yer || 50000000;
      const isWithinBudget = (actSpent + totalCostYer) <= actAllocated;
      const budgetStatus = isWithinBudget ? 'PASSED_WITHIN_BUDGET' : 'EXCEEDED_BUDGET';

      // Stock Check: check if remaining stock after issue falls below reorder point
      const remainingStock = Math.max(0, (selectedItem.qty || 0) - reqQty);
      const reorderTriggered = remainingStock <= (selectedItem.reorder_level || 0);

      const requestId = crypto.randomUUID();
      const payload = {
        id: requestId,
        organization_id: '00000000-0000-0000-0000-000000000001',
        requester_id: currentUser?.id || '00000000-0000-0000-0000-000000000002',
        approval_type: 'material_issue',
        entity_type: 'material_issue_request',
        entity_id: selectedItem.id,
        field_name: 'wbs_material_issue',
        old_value: { current_stock: selectedItem.qty },
        new_value: {
          project_id: selectedProj.id,
          project_code: selectedProj.code,
          project_name_ar: selectedProj.name_ar,
          project_name_en: selectedProj.name_en,
          wbs_activity_id: selectedAct.id,
          wbs_activity_code: selectedAct.code,
          wbs_activity_name: selectedAct.name_ar,
          warehouse_id: selectedWh.id,
          warehouse_name_ar: selectedWh.name_ar,
          item_id: selectedItem.id,
          sku: selectedItem.sku,
          item_name_ar: selectedItem.name_ar,
          unit_ar: selectedItem.unit_ar,
          requested_qty: reqQty,
          unit_value_yer: unitCostYer,
          total_cost_yer: totalCostYer,
          budget_check_status: budgetStatus,
          act_allocated_budget_yer: actAllocated,
          act_spent_budget_yer: actSpent,
          reorder_triggered: reorderTriggered,
          requester_role: materialIssueForm.requesterRole
        },
        requested_at: new Date().toISOString(),
        status: 'pending',
        priority_code: budgetStatus === 'EXCEEDED_BUDGET' ? 'urgent' : 'high',
        notes: `[WBS Material Issue] ${materialIssueForm.notes} | المشروع: ${selectedProj.name_ar} (WBS: ${selectedAct.code}) | فحص الميزانية: ${isWithinBudget ? 'ضمن السقف ✓' : 'تجاوز السقف ⚠️'}`,
        metadata: {
          source: 'PROJECT_WBS_WORKFLOW',
          requester_name: currentUser?.email || 'Project Officer',
          project_code: selectedProj.code,
          wbs_activity_code: selectedAct.code,
          item_name_ar: selectedItem.name_ar,
          requested_qty: reqQty,
          total_cost_yer: totalCostYer,
          budget_check_status: budgetStatus
        },
        created_at: new Date().toISOString()
      };

      const res = await fetch('/api/tables/approval_requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setProcurementSuccessMsg(
          isRtl
            ? 'تم رفع طلب صرف المواد للمشروع بنجاح وفحص السقف المالي للميزانية والتكامل مع WBS!'
            : 'Material issue request created & submitted to workflow with WBS budget check!'
        );
        setIsMaterialIssueModalOpen(false);
        await loadProcurementRequests();
      } else {
        alert(isRtl ? 'حدث خطأ أثناء تقديم طلب الصرف' : 'Error submitting material issue request');
      }
    } catch (err: any) {
      console.error('Error creating material issue request:', err);
      alert(err.message || 'Error creating request');
    } finally {
      setMaterialIssueSubmitting(false);
    }
  };

  const handleApproveAndDisburseMaterialIssueRequest = async (req: any) => {
    try {
      const newVal = typeof req.new_value === 'string' ? JSON.parse(req.new_value) : (req.new_value || {});
      const itemId = newVal.item_id || req.entity_id;
      const requestedQty = Number(newVal.requested_qty) || 0;

      await fetch(`/api/tables/approval_requests/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: currentUser?.id || 'admin'
        })
      });

      const itemRes = await fetch(`/api/tables/inventory_items/${itemId}`);
      if (itemRes.ok) {
        const itemObj = await itemRes.json();
        const updatedQty = Math.max(0, (itemObj.qty || 0) - requestedQty);

        await fetch(`/api/tables/inventory_items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qty: updatedQty })
        });

        setItems(prev => prev.map(i => i.id === itemId ? { ...i, qty: updatedQty } : i));

        await fetch(`/api/tables/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            organization_id: '00000000-0000-0000-0000-000000000001',
            type: 'DISBURSE',
            entity_id: itemId,
            quantity: requestedQty,
            notes: `صرف مادة لمشروع ${newVal.project_name_ar || ''} (WBS: ${newVal.wbs_activity_name || ''})`,
            created_at: new Date().toISOString()
          })
        });

        if (updatedQty <= (itemObj.reorder_level || 0)) {
          const suggestedOrderQty = Math.max(((itemObj.reorder_level || 100) * 2) - updatedQty, itemObj.reorder_level || 100);
          const unitCostYer = itemObj.unit_value_yer || 25000;
          await fetch('/api/tables/approval_requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: crypto.randomUUID(),
              organization_id: '00000000-0000-0000-0000-000000000001',
              requester_id: currentUser?.id || 'admin',
              approval_type: 'procurement',
              entity_type: 'procurement_requisition',
              entity_id: itemId,
              field_name: 'reorder_point_trigger',
              old_value: { qty: updatedQty, reorder_level: itemObj.reorder_level },
              new_value: {
                item_id: itemId,
                sku: itemObj.sku,
                name_ar: itemObj.name_ar,
                name_en: itemObj.name_en,
                current_qty: updatedQty,
                reorder_level: itemObj.reorder_level,
                suggested_order_qty: suggestedOrderQty,
                unit_value_yer: unitCostYer,
                estimated_cost_yer: Math.round(suggestedOrderQty * unitCostYer)
              },
              requested_at: new Date().toISOString(),
              status: 'pending',
              priority_code: updatedQty === 0 ? 'urgent' : 'high',
              notes: `[Reorder Point Triggered] تم صرف شحنة لمشروع (${newVal.project_name_ar}) مما أنقص الرصيد إلى ${updatedQty} ${itemObj.unit_ar || 'وحدة'}. تم إنشاء مسودة طلب شراء آلي موازية!`,
              metadata: { source: 'DISBURSEMENT_REORDER_ENGINE', auto_generated: true },
              created_at: new Date().toISOString()
            })
          });
        }
      }

      setProcurementSuccessMsg(
        isRtl
          ? 'تم تعميد إذن الصرف وخصم الكمية من المخزون وتفعيل تنبيه Reorder Point بنجاح!'
          : 'Material disbursement approved, inventory deducted, and reorder point evaluated!'
      );
      await loadProcurementRequests();
    } catch (err: any) {
      console.error("Error approving material issue request:", err);
      alert(err.message || "Error approving request");
    }
  };

  const triggerProcurementRequisition = async (item: ReliefInventoryItem, autoGenerated = true) => {
    try {
      const suggestedQty = Math.max((item.reorder_level * 2) - item.qty, item.reorder_level);
      const unitCostYer = item.unit_value_yer || 25000;
      const estimatedCost = Math.round(suggestedQty * unitCostYer);

      const existingPending = procurementRequests.some(
        (r: any) => r.entity_id === item.id && (r.status || '').toLowerCase() === 'pending'
      );

      if (existingPending) {
        return;
      }

      const requestId = crypto.randomUUID();
      const payload = {
        id: requestId,
        organization_id: '00000000-0000-0000-0000-000000000001',
        requester_id: currentUser?.id || '00000000-0000-0000-0000-000000000002',
        approval_type: 'procurement',
        entity_type: 'procurement_requisition',
        entity_id: item.id,
        field_name: 'reorder_point_trigger',
        old_value: { qty: item.qty, reorder_level: item.reorder_level },
        new_value: {
          item_id: item.id,
          sku: item.sku,
          name_ar: item.name_ar,
          name_en: item.name_en,
          category: item.category,
          current_qty: item.qty,
          reorder_level: item.reorder_level,
          suggested_order_qty: suggestedQty,
          unit_ar: item.unit_ar,
          unit_value_yer: unitCostYer,
          estimated_cost_yer: estimatedCost,
          warehouse_id: item.warehouse_id,
          donor_ref: item.donor_ref || 'الموردين المعتمدين لدى الجمعية'
        },
        requested_at: new Date().toISOString(),
        status: 'pending',
        priority_code: item.qty === 0 ? 'urgent' : 'high',
        notes: `مسودة طلب شراء آلي ناتج عن انخفاض مخزون المادة (${item.name_ar} - SKU: ${item.sku}) عن الحد الأدنى. الرصيد المتبقي: ${item.qty} ${item.unit_ar}، حد إعادة الطلب: ${item.reorder_level} ${item.unit_ar}. الكمية المقترحة للشراء: ${suggestedQty} ${item.unit_ar}.`,
        metadata: {
          source: 'INVENTORY_REORDER_ENGINE',
          auto_generated: autoGenerated,
          sku: item.sku,
          item_name_ar: item.name_ar,
          item_name_en: item.name_en,
          current_qty: item.qty,
          reorder_level: item.reorder_level,
          suggested_order_qty: suggestedQty,
          estimated_cost_yer: estimatedCost,
          warehouse_id: item.warehouse_id
        },
        created_at: new Date().toISOString()
      };

      const res = await fetch('/api/tables/approval_requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setProcurementRequests(prev => [payload, ...prev]);
        const title = isRtl 
          ? `📦 تم إنتاج مسودة طلب شراء للمادة (${item.name_ar})` 
          : `📦 Procurement Draft Requisition Created (${item.name_en})`;
        const body = isRtl
          ? `تم رفع مسودة طلب شراء برقم REQ-PROC-${requestId.slice(0, 6)} إلى ApprovalWorkflowView بنجاح للكمية ${suggestedQty} ${item.unit_ar}.`
          : `Draft PO REQ-PROC-${requestId.slice(0, 6)} submitted to ApprovalWorkflowView for ${suggestedQty} ${item.unit_en}.`;
        
        triggerPushAlert(title, body, 'info', item);
      }
    } catch (err) {
      console.error('Procurement auto-draft creation failed:', err);
    }
  };

  const handleGenerateAllProcurementRequisitions = async () => {
    const criticals = items.filter(i => i.qty <= i.reorder_level);
    if (criticals.length === 0) {
      setProcurementSuccessMsg(isRtl ? 'جميع المواد الإغاثية في المستويات الآمنة حالياً ولا يوجد عجز مخزني.' : 'All inventory items are currently at safe levels.');
      return;
    }

    let count = 0;
    for (const item of criticals) {
      const existingPending = procurementRequests.some(
        (r: any) => r.entity_id === item.id && (r.status || '').toLowerCase() === 'pending'
      );
      if (!existingPending) {
        await triggerProcurementRequisition(item, true);
        count++;
      }
    }

    await loadProcurementRequests();
    setProcurementSuccessMsg(
      isRtl 
        ? `تم توليد ورفع عدد (${count}) مسودة طلب شراء جديدة بنجاح إلى مركز حوكمة الموافقات (Approval Workflow)!` 
        : `Generated and submitted (${count}) new procurement draft requisitions successfully!`
    );
  };
  const [forecastHorizon, setForecastHorizon] = useState<'30d' | '60d' | '90d' | '180d'>('60d');
  const [seasonalityMultiplier, setSeasonalityMultiplier] = useState<number>(1.25); // 125% Emergency / Peak factor
  const [selectedAnalyticsCategory, setSelectedAnalyticsCategory] = useState<string>('all');
  const [selectedAnalyticsWarehouse, setSelectedAnalyticsWarehouse] = useState<string>('all');

  // Asset Condition & Maintenance Filters
  const [assetConditionFilter, setAssetConditionFilter] = useState<'ALL' | 'NEW' | 'USED_GOOD' | 'UNDER_MAINTENANCE' | 'DAMAGED' | 'DISPOSED'>('ALL');
  const [assetMaintenanceFilter, setAssetMaintenanceFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE' | 'IN_REPAIR'>('ALL');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetWarehouseFilter, setAssetWarehouseFilter] = useState<string>('all');

  // Asset Maintenance Modal States
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = useState<ReliefInventoryItem | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    condition: 'NEW' as 'NEW' | 'USED_GOOD' | 'UNDER_MAINTENANCE' | 'DAMAGED' | 'DISPOSED',
    serialNo: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    assignedCustodianHr: '',
    accountingLedgerCode: '',
    projectActivityId: '',
    procurementPoRef: '',
    notes: '',
    performedBy: ''
  });

  // Fixed Assets Database & Subsystem State
  const [fixedAssets, setFixedAssets] = useState<FixedAssetRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`nexora_fixed_assets_${userEmail}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_FIXED_ASSETS;
  });

  const [projectsList, setProjectsList] = useState<any[]>(DEFAULT_PROJECTS_LIST);
  const [assetSubTab, setAssetSubTab] = useState<'ledger' | 'project_mapping' | 'depreciation' | 'warranty'>('ledger');

  // Asset Action Modals
  const [isRegisterAssetModalOpen, setIsRegisterAssetModalOpen] = useState(false);
  const [isMapProjectModalOpen, setIsMapProjectModalOpen] = useState(false);
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);

  const [selectedAssetForProjectMap, setSelectedAssetForProjectMap] = useState<FixedAssetRecord | null>(null);
  const [selectedAssetForDisposal, setSelectedAssetForDisposal] = useState<FixedAssetRecord | null>(null);

  // Forms
  const [registerAssetForm, setRegisterAssetForm] = useState({
    assetCode: '',
    nameAr: '',
    nameEn: '',
    category: 'VEHICLE',
    serialNumber: '',
    purchaseDate: new Date().toISOString().substring(0, 10),
    purchaseCost: '35000000',
    usefulLifeMonths: '60',
    residualValue: '3000000',
    supplierName: '',
    supplierContact: '',
    warrantyExpiryDate: '',
    warehouseId: 'wh-1',
    locationName: '',
    projectId: '',
    activityId: '',
    assignedCustodianHr: '',
    conditionCode: 'NEW'
  });

  const [mapProjectForm, setMapProjectForm] = useState({
    projectId: '',
    activityId: '',
    locationName: '',
    assignedCustodianHr: '',
    notes: ''
  });

  const [disposalForm, setDisposalForm] = useState({
    disposalDate: new Date().toISOString().substring(0, 10),
    disposalReason: '',
    salvageValue: '0',
    approvedBy: ''
  });

  // DB Sync Effect for Fixed Assets & Projects from Neon PostgreSQL API
  useEffect(() => {
    const fetchAssetsAndProjects = async () => {
      try {
        const [assetsRes, projectsRes] = await Promise.all([
          fetch('/api/tables/fixed_assets'),
          fetch('/api/tables/projects')
        ]);

        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          if (Array.isArray(assetsData) && assetsData.length > 0) {
            setFixedAssets(assetsData);
          }
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          if (Array.isArray(projectsData) && projectsData.length > 0) {
            setProjectsList(projectsData);
          }
        }
      } catch (err) {
        console.warn('Failed to load assets/projects from database endpoint, relying on local storage state:', err);
      }
    };

    fetchAssetsAndProjects();
  }, []);

  // Save fixedAssets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`nexora_fixed_assets_${userEmail}`, JSON.stringify(fixedAssets));
    } catch (e) {}
  }, [fixedAssets, userEmail]);

  // Register New Asset Handler
  const handleRegisterAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerAssetForm.nameAr.trim()) return;

    const costNum = parseFloat(registerAssetForm.purchaseCost) || 0;
    const lifeMonths = parseInt(registerAssetForm.usefulLifeMonths) || 60;
    const residualNum = parseFloat(registerAssetForm.residualValue) || 0;
    const autoCode = registerAssetForm.assetCode.trim() || `AST-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const proj = projectsList.find(p => p.id === registerAssetForm.projectId);
    const wh = warehouses.find(w => w.id === registerAssetForm.warehouseId);

    const newRecord: FixedAssetRecord = {
      id: `ast-${Date.now()}`,
      asset_code: autoCode,
      name_ar: registerAssetForm.nameAr.trim(),
      name_en: registerAssetForm.nameEn.trim() || registerAssetForm.nameAr.trim(),
      category: registerAssetForm.category,
      serial_number: registerAssetForm.serialNumber.trim() || undefined,
      purchase_date: registerAssetForm.purchaseDate,
      purchase_cost: costNum,
      current_value: costNum,
      depreciation_rate: Math.round((1 / (lifeMonths / 12)) * 100) || 10,
      accumulated_depreciation: 0,
      useful_life_months: lifeMonths,
      residual_value: residualNum,
      supplier_name: registerAssetForm.supplierName.trim() || undefined,
      supplier_contact: registerAssetForm.supplierContact.trim() || undefined,
      warranty_expiry_date: registerAssetForm.warrantyExpiryDate || undefined,
      location_name: registerAssetForm.locationName.trim() || (wh ? (isRtl ? wh.name_ar : wh.name_en) : 'المستودع الرئيسي'),
      warehouse_id: registerAssetForm.warehouseId,
      project_id: proj?.id,
      project_name: proj ? (isRtl ? proj.name_ar : proj.name_en) : undefined,
      activity_id: registerAssetForm.activityId.trim() || undefined,
      assigned_custodian_hr: registerAssetForm.assignedCustodianHr.trim() || undefined,
      condition_code: registerAssetForm.conditionCode,
      status_code: proj ? 'MAPPED_TO_PROJECT' : 'ACTIVE',
      last_maintenance_date: registerAssetForm.purchaseDate,
      next_maintenance_date: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().substring(0, 10)
    };

    try {
      await fetch('/api/tables/fixed_assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
    } catch (err) {
      console.warn('API sync failed, saving locally:', err);
    }

    setFixedAssets(prev => [newRecord, ...prev]);
    setIsRegisterAssetModalOpen(false);

    const title = isRtl
      ? `🏢 تم تسجيل أصل جديد (${newRecord.asset_code}) بنجاح`
      : `🏢 New Asset Registered (${newRecord.asset_code}) Successfully`;
    const body = isRtl
      ? `الأصل: ${newRecord.name_ar} | التكلفة: ${costNum.toLocaleString()} YER | المورد: ${newRecord.supplier_name || 'غير محدد'}`
      : `Asset: ${newRecord.name_en} | Cost: ${costNum.toLocaleString()} YER | Supplier: ${newRecord.supplier_name || 'N/A'}`;

    triggerPushAlert(title, body, 'info');

    setRegisterAssetForm({
      assetCode: '',
      nameAr: '',
      nameEn: '',
      category: 'VEHICLE',
      serialNumber: '',
      purchaseDate: new Date().toISOString().substring(0, 10),
      purchaseCost: '35000000',
      usefulLifeMonths: '60',
      residualValue: '3000000',
      supplierName: '',
      supplierContact: '',
      warrantyExpiryDate: '',
      warehouseId: 'wh-1',
      locationName: '',
      projectId: '',
      activityId: '',
      assignedCustodianHr: '',
      conditionCode: 'NEW'
    });
  };

  // Map / Transfer Asset to Project Handler
  const handleMapProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForProjectMap) return;

    const proj = projectsList.find(p => p.id === mapProjectForm.projectId);
    const projName = proj ? (isRtl ? proj.name_ar : proj.name_en) : mapProjectForm.projectId;

    const updatedAsset: FixedAssetRecord = {
      ...selectedAssetForProjectMap,
      project_id: mapProjectForm.projectId || undefined,
      project_name: projName || undefined,
      activity_id: mapProjectForm.activityId.trim() || selectedAssetForProjectMap.activity_id,
      location_name: mapProjectForm.locationName.trim() || selectedAssetForProjectMap.location_name,
      assigned_custodian_hr: mapProjectForm.assignedCustodianHr.trim() || selectedAssetForProjectMap.assigned_custodian_hr,
      status_code: mapProjectForm.projectId ? 'MAPPED_TO_PROJECT' : 'ACTIVE'
    };

    try {
      await fetch(`/api/tables/fixed_assets/${selectedAssetForProjectMap.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAsset)
      });
    } catch (err) {
      console.warn('DB update failed, updating local state:', err);
    }

    setFixedAssets(prev => prev.map(a => a.id === selectedAssetForProjectMap.id ? updatedAsset : a));
    setIsMapProjectModalOpen(false);
    setSelectedAssetForProjectMap(null);

    const title = mapProjectForm.projectId
      ? (isRtl ? `🎯 تم تخصيص الأصل (${updatedAsset.asset_code}) لمشروع (${projName})` : `🎯 Asset (${updatedAsset.asset_code}) Mapped to Project (${projName})`)
      : (isRtl ? `🔄 تم فك ربط وإعادة الأصل (${updatedAsset.asset_code}) للمستودع المركزي` : `🔄 Asset (${updatedAsset.asset_code}) Returned to Central Depot`);

    const body = isRtl
      ? `أمين العهدة الميدانية: ${updatedAsset.assigned_custodian_hr || 'غير محدد'} | الموقع: ${updatedAsset.location_name || 'ميداني'}`
      : `Field Custodian: ${updatedAsset.assigned_custodian_hr || 'N/A'} | Location: ${updatedAsset.location_name || 'Field'}`;

    triggerPushAlert(title, body, 'info');
  };

  // Asset Disposal Handler
  const handleDisposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForDisposal) return;

    const salvageVal = parseFloat(disposalForm.salvageValue) || 0;

    const updatedAsset: FixedAssetRecord = {
      ...selectedAssetForDisposal,
      condition_code: 'DISPOSED',
      status_code: 'DISPOSED',
      disposal_date: disposalForm.disposalDate,
      disposal_reason: disposalForm.disposalReason.trim(),
      residual_value: salvageVal,
      current_value: salvageVal
    };

    try {
      await fetch(`/api/tables/fixed_assets/${selectedAssetForDisposal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAsset)
      });
    } catch (err) {
      console.warn('DB update failed, updating local state:', err);
    }

    setFixedAssets(prev => prev.map(a => a.id === selectedAssetForDisposal.id ? updatedAsset : a));
    setIsDisposalModalOpen(false);
    setSelectedAssetForDisposal(null);

    const title = isRtl
      ? `⬛ تم تكهين وإخراج الأصل (${updatedAsset.asset_code}) من الخدمة`
      : `⬛ Asset (${updatedAsset.asset_code}) Formally Disposed & Scrapped`;
    const body = isRtl
      ? `سبب الاستبعاد: ${disposalForm.disposalReason} | القيمة المستردة: ${salvageVal.toLocaleString()} YER`
      : `Reason: ${disposalForm.disposalReason} | Salvage Value: ${salvageVal.toLocaleString()} YER`;

    triggerPushAlert(title, body, 'critical');
  };

  // UI Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'critical' | 'sufficient'>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'RECEIVE' | 'DISBURSE' | 'TRANSFER'>('all');

  // Modal States
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({
    itemId: '',
    sourceWarehouseId: '',
    targetWarehouseId: '',
    type: 'RECEIVE' as 'RECEIVE' | 'DISBURSE' | 'TRANSFER',
    qty: '100',
    recipientOrDonor: '',
    refNo: '',
    waybillNo: '',
    driverName: '',
    vehiclePlate: '',
    notes: ''
  });

  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    sku: '',
    nameAr: '',
    nameEn: '',
    qty: '500',
    unitAr: 'سلة',
    unitEn: 'basket',
    warehouseId: '',
    category: 'FOOD_AID' as ReliefInventoryItem['category'],
    unitValueYer: '30000',
    reorderLevel: '200',
    batchNo: `BATCH-2026-${Math.floor(10 + Math.random() * 90)}`,
    expiryDate: '2027-12-31',
    donorRef: ''
  });

  const [isNewWarehouseModalOpen, setIsNewWarehouseModalOpen] = useState(false);
  const [newWarehouseForm, setNewWarehouseForm] = useState({
    branchId: 'br-1',
    nameAr: '',
    nameEn: '',
    locationAr: '',
    locationEn: '',
    managerName: '',
    capacity: '15,000 m³'
  });

  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);
  const [newBranchForm, setNewBranchForm] = useState({
    code: `BR-${Math.floor(100 + Math.random() * 900)}`,
    nameAr: '',
    nameEn: '',
    regionAr: '',
    regionEn: '',
    managerName: ''
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`nexora_branches_${userEmail}`, JSON.stringify(branches));
      localStorage.setItem(`nexora_wh_${userEmail}`, JSON.stringify(warehouses));
      localStorage.setItem(`nexora_inv_items_${userEmail}`, JSON.stringify(items));
      localStorage.setItem(`nexora_inv_movements_${userEmail}`, JSON.stringify(movements));
    } catch (e) {}
  }, [branches, warehouses, items, movements, userEmail]);

  // Handle Movement Form Submit (Inbound / Outbound / Inter-Warehouse Transfer)
  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyChange = parseInt(movementForm.qty) || 0;
    if (qtyChange <= 0) return;

    const sourceItem = items.find(i => i.id === movementForm.itemId);
    if (!sourceItem) return;

    const sourceWh = warehouses.find(w => w.id === (movementForm.sourceWarehouseId || sourceItem.warehouse_id));
    const sourceBranch = branches.find(b => b.id === sourceWh?.branch_id);

    // Validation for DISBURSE or TRANSFER stock sufficiency
    if ((movementForm.type === 'DISBURSE' || movementForm.type === 'TRANSFER') && sourceItem.qty < qtyChange) {
      alert(isRtl ? 'عفواً، الكمية المطلوبة تتجاوز الرصيد المتاح حالياً بالمخزن!' : 'Requested quantity exceeds available stock balance!');
      return;
    }

    if (movementForm.type === 'TRANSFER') {
      if (!movementForm.targetWarehouseId) {
        alert(isRtl ? 'الرجاء اختيار المستودع المستهدف للتحويل!' : 'Please select the target warehouse for transfer!');
        return;
      }
      if (movementForm.sourceWarehouseId === movementForm.targetWarehouseId) {
        alert(isRtl ? 'عفواً، لا يمكن تحويل الشحنة إلى نفس المستودع المصدر!' : 'Cannot transfer stock to the same source warehouse!');
        return;
      }
    }

    const targetWh = warehouses.find(w => w.id === movementForm.targetWarehouseId);
    const targetBranch = branches.find(b => b.id === targetWh?.branch_id);

    if (movementForm.type === 'TRANSFER' && targetWh) {
      // Execute Transfer: Subtract from source item, Add to target warehouse item
      setItems(prev => {
        let updated = prev.map(item => {
          if (item.id === sourceItem.id) {
            return { ...item, qty: item.qty - qtyChange };
          }
          return item;
        });

        // Check if item already exists in target warehouse
        const existingInTarget = updated.find(
          i => i.warehouse_id === targetWh.id && (i.sku === sourceItem.sku || i.name_ar === sourceItem.name_ar)
        );

        if (existingInTarget) {
          updated = updated.map(i => {
            if (i.id === existingInTarget.id) {
              return { ...i, qty: i.qty + qtyChange };
            }
            return i;
          });
        } else {
          // Create new SKU entry in destination warehouse
          const newTargetItem: ReliefInventoryItem = {
            ...sourceItem,
            id: `inv-${Date.now()}`,
            warehouse_id: targetWh.id,
            qty: qtyChange,
            notes: isRtl ? `مادة محولة من ${sourceWh?.name_ar}` : `Transferred item from ${sourceWh?.name_en}`
          };
          updated.push(newTargetItem);
        }

        return updated;
      });
    } else {
      // RECEIVE or DISBURSE
      setItems(prev => prev.map(item => {
        if (item.id === sourceItem.id) {
          const newQty = movementForm.type === 'RECEIVE' 
            ? item.qty + qtyChange 
            : item.qty - qtyChange;
          return { ...item, qty: Math.max(0, newQty) };
        }
        return item;
      }));
    }

    // Generate reference codes
    const autoRef = movementForm.refNo.trim() || (
      movementForm.type === 'RECEIVE' 
        ? `GRN-2026-${Math.floor(100 + Math.random() * 900)}` 
        : movementForm.type === 'DISBURSE'
        ? `SARF-2026-${Math.floor(100 + Math.random() * 900)}`
        : `TRF-2026-${Math.floor(100 + Math.random() * 900)}`
    );

    const autoWaybill = movementForm.waybillNo.trim() || (
      movementForm.type === 'TRANSFER' ? `TR-WAY-2026-${Math.floor(10 + Math.random() * 90)}` : undefined
    );

    const newRecord: StockMovementRecord = {
      id: `sm-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      itemId: sourceItem.id,
      itemNameAr: sourceItem.name_ar,
      itemNameEn: sourceItem.name_en,
      type: movementForm.type,
      qty: qtyChange,
      unitAr: sourceItem.unit_ar,
      warehouseNameAr: sourceWh?.name_ar || 'المستودع الرئيسي',
      warehouseNameEn: sourceWh?.name_en || 'Central Warehouse',
      targetWarehouseId: targetWh?.id,
      targetWarehouseNameAr: targetWh?.name_ar,
      targetWarehouseNameEn: targetWh?.name_en,
      branchNameAr: sourceBranch?.name_ar || 'الفرع الرئيسي',
      targetBranchNameAr: targetBranch?.name_ar,
      waybillNo: autoWaybill,
      driverName: movementForm.driverName.trim() || undefined,
      vehiclePlate: movementForm.vehiclePlate.trim() || undefined,
      refNo: autoRef,
      recipientOrDonor: movementForm.recipientOrDonor.trim() || (
        movementForm.type === 'RECEIVE' 
          ? (isRtl ? 'توريد إغاثي معتمد' : 'Inbound Relief Supply') 
          : movementForm.type === 'DISBURSE'
          ? (isRtl ? 'موقع توزيع ميداني' : 'Field Distribution Point')
          : (isRtl ? `تحويل عيني إلى ${targetWh?.name_ar}` : `In-Kind Transfer to ${targetWh?.name_en}`)
      ),
      notes: movementForm.notes.trim() || (
        movementForm.type === 'TRANSFER'
          ? (isRtl ? 'تحويل عيني رسمي وسند نقل مخزني بين الفروع' : 'Official inter-branch in-kind stock transfer')
          : (isRtl ? 'سند حركة مخزنية رسمية' : 'Official stock movement slip')
      ),
      authorizedBy: currentUser?.name || (isRtl ? 'أمين المستودع المعتمد' : 'Authorized Warehouse Keeper')
    };

    setMovements(prev => [newRecord, ...prev]);
    setIsMovementModalOpen(false);
    setMovementForm({
      itemId: '',
      sourceWarehouseId: '',
      targetWarehouseId: '',
      type: 'RECEIVE',
      qty: '100',
      recipientOrDonor: '',
      refNo: '',
      waybillNo: '',
      driverName: '',
      vehiclePlate: '',
      notes: ''
    });
  };

  // Handle New Item Submit
  const handleNewItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.nameAr.trim()) return;

    const qtyNum = parseInt(newItemForm.qty) || 0;
    const unitVal = parseInt(newItemForm.unitValueYer) || 0;
    const whId = newItemForm.warehouseId || warehouses[0]?.id || 'wh-1';
    const targetWh = warehouses.find(w => w.id === whId);

    const newItem: ReliefInventoryItem = {
      id: `inv-${Date.now()}`,
      sku: newItemForm.sku.trim() || `SKU-REL-${Math.floor(100 + Math.random() * 900)}`,
      name_ar: newItemForm.nameAr.trim(),
      name_en: newItemForm.nameEn.trim() || newItemForm.nameAr.trim(),
      qty: qtyNum,
      unit_ar: newItemForm.unitAr.trim(),
      unit_en: newItemForm.unitEn.trim(),
      warehouse_id: whId,
      category: newItemForm.category,
      unit_value_yer: unitVal,
      reorder_level: parseInt(newItemForm.reorderLevel) || 100,
      batch_no: newItemForm.batchNo.trim() || 'BATCH-2026-NEW',
      expiry_date: newItemForm.expiryDate || '2027-12-31',
      donor_ref: newItemForm.donorRef.trim() || (isRtl ? 'تمويل إغاثي مباشر' : 'Direct Relief Funding')
    };

    setItems(prev => [newItem, ...prev]);

    // Create opening movement
    const openingMovement: StockMovementRecord = {
      id: `sm-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      itemId: newItem.id,
      itemNameAr: newItem.name_ar,
      itemNameEn: newItem.name_en,
      type: 'RECEIVE',
      qty: qtyNum,
      unitAr: newItem.unit_ar,
      warehouseNameAr: targetWh?.name_ar || 'المستودع الرئيسي',
      warehouseNameEn: targetWh?.name_en || 'Central Warehouse',
      refNo: `OPEN-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientOrDonor: newItem.donor_ref || (isRtl ? 'رصيد افتتاحي' : 'Opening Stock'),
      notes: isRtl ? 'إدخال مادة مخزنية جديدة وتسجيل الرصيد الافتتاحي' : 'New inventory SKU registration & initial stock setup',
      authorizedBy: currentUser?.name || (isRtl ? 'مدير إدارة المخازن' : 'Inventory Director')
    };

    setMovements(prev => [openingMovement, ...prev]);
    setIsNewItemModalOpen(false);
  };

  // Handle New Warehouse Submit
  const handleNewWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouseForm.nameAr.trim()) return;

    const newWh: WarehouseData = {
      id: `wh-${Date.now()}`,
      branch_id: newWarehouseForm.branchId || branches[0]?.id || 'br-1',
      name_ar: newWarehouseForm.nameAr.trim(),
      name_en: newWarehouseForm.nameEn.trim() || newWarehouseForm.nameAr.trim(),
      location_ar: newWarehouseForm.locationAr.trim() || (isRtl ? 'الجمهورية اليمنية' : 'Yemen'),
      location_en: newWarehouseForm.locationEn.trim() || 'Yemen',
      manager_name: newWarehouseForm.managerName.trim() || (isRtl ? 'أمين المستودع' : 'Warehouse Keeper'),
      capacity: newWarehouseForm.capacity.trim() || '10,000 m³',
      percentage_used: 15
    };

    setWarehouses(prev => [...prev, newWh]);
    setIsNewWarehouseModalOpen(false);
  };

  // Handle New Branch Submit
  const handleNewBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchForm.nameAr.trim()) return;

    const newBr: BranchData = {
      id: `br-${Date.now()}`,
      code: newBranchForm.code.trim() || `BR-${Math.floor(100 + Math.random() * 900)}`,
      name_ar: newBranchForm.nameAr.trim(),
      name_en: newBranchForm.nameEn.trim() || newBranchForm.nameAr.trim(),
      region_ar: newBranchForm.regionAr.trim() || (isRtl ? 'إقليم إغاثي' : 'Relief Region'),
      region_en: newBranchForm.regionEn.trim() || 'Relief Region',
      manager_name: newBranchForm.managerName.trim() || (isRtl ? 'مدير الفرع' : 'Branch Director'),
      status: 'ACTIVE'
    };

    setBranches(prev => [...prev, newBr]);
    setIsNewBranchModalOpen(false);
  };

  // Calculations & Analytics
  const totalValuationYer = items.reduce((acc, curr) => acc + (curr.qty * curr.unit_value_yer), 0);
  const criticalItems = items.filter(i => i.qty <= i.reorder_level);
  const totalSkuCount = items.length;
  const transferMovementsCount = movements.filter(m => m.type === 'TRANSFER').length;

  // ==================== ADVANCED INVENTORY TURNOVER & DEMAND FORECAST ENGINE ====================
  // 1. Overall Metrics
  const totalDisbursedQty = movements
    .filter(m => m.type === 'DISBURSE')
    .reduce((sum, m) => sum + m.qty, 0);

  const totalStockQty = items.reduce((sum, i) => sum + i.qty, 0);

  // Annualized Inventory Turnover Ratio = (Total Disbursed Units * 4.2) / Average Stock Qty
  const avgTurnoverRatio = totalStockQty > 0 
    ? Number(((totalDisbursedQty * 4.2) / totalStockQty).toFixed(2))
    : 3.8;

  // Days Sales/Disbursement of Inventory (DSI) = 365 / Turnover Ratio
  const daysOfInventorySupply = Math.round(365 / Math.max(0.5, avgTurnoverRatio));

  // 2. Category Turnover Analysis Data (for Recharts ComposedChart)
  const categoryTurnoverData = [
    { catKey: 'FOOD_AID', nameAr: 'الأمن الغذائي', nameEn: 'Food Aid', baseStock: 1250, baseDisbursed: 2800 },
    { catKey: 'NUTRITION', nameAr: 'التغذية العلاجية', nameEn: 'Nutrition', baseStock: 180, baseDisbursed: 620 },
    { catKey: 'SHELTER', nameAr: 'الإيواء والطوارئ', nameEn: 'Shelter', baseStock: 85, baseDisbursed: 140 },
    { catKey: 'MEDICAL', nameAr: 'الأدوية والمستلزمات', nameEn: 'Medical', baseStock: 420, baseDisbursed: 1100 },
    { catKey: 'WASH', nameAr: 'المياه والإزميل', nameEn: 'WASH', baseStock: 60, baseDisbursed: 90 },
    { catKey: 'EDUCATION', nameAr: 'التعليم والحقائب', nameEn: 'Education', baseStock: 2100, baseDisbursed: 3200 }
  ].map(cat => {
    const catItems = items.filter(i => i.category === cat.catKey);
    const catMovements = movements.filter(m => m.type === 'DISBURSE' && items.find(i => i.id === m.itemId)?.category === cat.catKey);
    
    const actualStock = catItems.reduce((acc, i) => acc + i.qty, 0) || cat.baseStock;
    const actualDisbursed = (catMovements.reduce((acc, m) => acc + m.qty, 0) + cat.baseDisbursed);
    const turnoverRatio = Number(((actualDisbursed * 1.5) / Math.max(1, actualStock)).toFixed(1));
    const dsi = Math.round(365 / Math.max(0.5, turnoverRatio));

    return {
      category: isRtl ? cat.nameAr : cat.nameEn,
      stock: actualStock,
      disbursed: actualDisbursed,
      turnoverRatio: turnoverRatio,
      dsi: dsi,
      valuationMilYER: Number((catItems.reduce((acc, i) => acc + (i.qty * i.unit_value_yer), 0) / 1000000).toFixed(2)) || 15.5
    };
  });

  // 3. Historical Demand vs AI Forecast Demand Trend Data (for Recharts AreaChart)
  const monthlyDemandData = [
    { month: isRtl ? 'يناير' : 'Jan', actual: 450, forecast: null, upper: null, lower: null, safetyStock: 120 },
    { month: isRtl ? 'فبراير' : 'Feb', actual: 520, forecast: null, upper: null, lower: null, safetyStock: 130 },
    { month: isRtl ? 'مارس' : 'Mar', actual: 680, forecast: null, upper: null, lower: null, safetyStock: 150 },
    { month: isRtl ? 'أبريل' : 'Apr', actual: 890, forecast: null, upper: null, lower: null, safetyStock: 180 },
    { month: isRtl ? 'مايو' : 'May', actual: 740, forecast: null, upper: null, lower: null, safetyStock: 160 },
    { month: isRtl ? 'يونيو' : 'Jun', actual: 810, forecast: null, upper: null, lower: null, safetyStock: 170 },
    { month: isRtl ? 'يوليو' : 'Jul', actual: 950, forecast: null, upper: null, lower: null, safetyStock: 200 },
    { month: isRtl ? 'أغسطس' : 'Aug', actual: 1120, forecast: 1120, upper: 1120, lower: 1120, safetyStock: 220 },
    { 
      month: isRtl ? 'سبتمبر (توقع)' : 'Sep (Forecast)', 
      actual: null, 
      forecast: Math.round(1180 * seasonalityMultiplier), 
      upper: Math.round(1180 * seasonalityMultiplier * 1.15), 
      lower: Math.round(1180 * seasonalityMultiplier * 0.85),
      safetyStock: Math.round(250 * seasonalityMultiplier)
    },
    { 
      month: isRtl ? 'أكتوبر (توقع)' : 'Oct (Forecast)', 
      actual: null, 
      forecast: Math.round(1290 * seasonalityMultiplier), 
      upper: Math.round(1290 * seasonalityMultiplier * 1.18), 
      lower: Math.round(1290 * seasonalityMultiplier * 0.82),
      safetyStock: Math.round(270 * seasonalityMultiplier)
    },
    { 
      month: isRtl ? 'نوفمبر (توقع)' : 'Nov (Forecast)', 
      actual: null, 
      forecast: Math.round(1410 * seasonalityMultiplier), 
      upper: Math.round(1410 * seasonalityMultiplier * 1.20), 
      lower: Math.round(1410 * seasonalityMultiplier * 0.80),
      safetyStock: Math.round(300 * seasonalityMultiplier)
    },
    { 
      month: isRtl ? 'ديسمبر (توقع)' : 'Dec (Forecast)', 
      actual: null, 
      forecast: Math.round(1550 * seasonalityMultiplier), 
      upper: Math.round(1550 * seasonalityMultiplier * 1.22), 
      lower: Math.round(1550 * seasonalityMultiplier * 0.78),
      safetyStock: Math.round(330 * seasonalityMultiplier)
    }
  ];

  // 4. ABC Movement Classification Data (for Recharts Donut / PieChart)
  const abcClassificationData = [
    { 
      name: isRtl ? 'عالية الحركة (Fast)' : 'Fast Moving (>3.0x)', 
      value: items.filter(i => i.qty > i.reorder_level * 2).length || 3, 
      color: '#10b981',
      percentage: '45%'
    },
    { 
      name: isRtl ? 'متوسطة الحركة (Medium)' : 'Medium Moving (1.5x-3.0x)', 
      value: items.filter(i => i.qty > i.reorder_level && i.qty <= i.reorder_level * 2).length || 2, 
      color: '#0284c7',
      percentage: '30%'
    },
    { 
      name: isRtl ? 'حرجة / إعادة طلب (Critical)' : 'Critical / Low Stock', 
      value: items.filter(i => i.qty <= i.reorder_level).length || 1, 
      color: '#f43f5e',
      percentage: '15%'
    },
    { 
      name: isRtl ? 'بطيئة / راكدة (Slow)' : 'Slow / Dead Stock', 
      value: 1, 
      color: '#f59e0b',
      percentage: '10%'
    }
  ];

  // 5. Branch Stock vs Forecasted 30-Day Demand (for Recharts BarChart)
  const branchDemandGapData = branches.map(br => {
    const brWarehouses = warehouses.filter(w => w.branch_id === br.id);
    const brWhIds = brWarehouses.map(w => w.id);
    const brItems = items.filter(i => brWhIds.includes(i.warehouse_id));

    const totalBrStock = brItems.reduce((acc, i) => acc + i.qty, 0);
    const predictedDemand = Math.round((totalBrStock * 0.65 + 300) * seasonalityMultiplier);
    const gap = predictedDemand - totalBrStock;

    return {
      branchName: isRtl ? br.name_ar.replace('فرع ', '') : br.name_en,
      currentStock: totalBrStock,
      predictedDemand: predictedDemand,
      safetyDeficit: gap > 0 ? gap : 0
    };
  });

  // 6. Item-Level Demand Forecast & Auto Reorder Table Calculations
  const itemForecasts = items.map(item => {
    const wh = warehouses.find(w => w.id === item.warehouse_id);
    const br = branches.find(b => b.id === wh?.branch_id);
    
    // Calculate historical monthly disbursement rate
    const itemDisbursedMoves = movements.filter(m => m.itemId === item.id && m.type === 'DISBURSE');
    const totalDisbursedQty = itemDisbursedMoves.reduce((acc, m) => acc + m.qty, 0);
    const monthlyRate = Math.max(15, Math.round(totalDisbursedQty > 0 ? totalDisbursedQty * 1.8 : item.reorder_level * 0.8));
    
    const projectedDemand = Math.round(monthlyRate * seasonalityMultiplier);
    const daysRemaining = Math.round((item.qty / Math.max(1, projectedDemand)) * 30);
    const isCritical = item.qty <= item.reorder_level;
    const isWarning = daysRemaining <= 20 && !isCritical;

    const recommendedReorderQty = Math.max(0, projectedDemand * 2 - item.qty + item.reorder_level);

    return {
      ...item,
      warehouseName: wh ? (isRtl ? wh.name_ar : wh.name_en) : '',
      branchName: br ? (isRtl ? br.name_ar : br.name_en) : '',
      monthlyRate,
      projectedDemand,
      daysRemaining,
      recommendedReorderQty,
      riskLevel: isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'SAFE'
    };
  });

  // Filtered Inventory List based on Branch, Warehouse, Category, Search, and Status
  const filteredItems = items.filter(item => {
    const itemWh = warehouses.find(w => w.id === item.warehouse_id);
    const matchesBranch = selectedBranch === 'all' || itemWh?.branch_id === selectedBranch;
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouse_id === selectedWarehouse;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    const matchesSearch = searchQuery === '' ||
      item.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch_no.toLowerCase().includes(searchQuery.toLowerCase());

    const isCritical = item.qty <= item.reorder_level;
    const matchesStatus = stockStatusFilter === 'all' ||
      (stockStatusFilter === 'critical' && isCritical) ||
      (stockStatusFilter === 'sufficient' && !isCritical);

    return matchesBranch && matchesWarehouse && matchesCategory && matchesSearch && matchesStatus;
  });

  // Filtered Movement Logs
  const filteredMovements = movements.filter(m => {
    const matchesType = movementTypeFilter === 'all' || m.type === movementTypeFilter;
    const matchesSearch = searchQuery === '' ||
      m.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.itemNameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.waybillNo && m.waybillNo.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesSearch;
  });

  const getCategoryBadge = (cat: ReliefInventoryItem['category']) => {
    switch (cat) {
      case 'FOOD_AID':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">{isRtl ? 'أمن غذائي' : 'Food Aid'}</span>;
      case 'NUTRITION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">{isRtl ? 'تغذية صحية' : 'Nutrition'}</span>;
      case 'SHELTER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">{isRtl ? 'إيواء وطوارئ' : 'Shelter'}</span>;
      case 'MEDICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{isRtl ? 'مستلزمات طبية' : 'Medical'}</span>;
      case 'WASH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">{isRtl ? 'مياه وإزميل صحي' : 'WASH'}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">{isRtl ? 'تعليم وتجهيزات' : 'Education'}</span>;
    }
  };

  // Condition Badges Helper
  const getConditionBadge = (cond?: string) => {
    switch (cond) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            ✨ {isRtl ? 'جديد (ممتاز)' : 'Brand New'}
          </span>
        );
      case 'USED_GOOD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            ✅ {isRtl ? 'مستخدم - حالة جيدة' : 'Used - Good'}
          </span>
        );
      case 'UNDER_MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
            🛠️ {isRtl ? 'قيد الصيانة والترميم' : 'Under Maintenance'}
          </span>
        );
      case 'DAMAGED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            🚨 {isRtl ? 'تالف / يحتاج إصلاح' : 'Damaged / Needs Repair'}
          </span>
        );
      case 'DISPOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30">
            ⬛ {isRtl ? 'مستبعد (تكهين)' : 'Disposed / Scrap'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
            ✨ {isRtl ? 'جديد' : 'New'}
          </span>
        );
    }
  };

  // Maintenance Status Badge Helper
  const getMaintenanceStatusBadge = (item: ReliefInventoryItem) => {
    const nextDateStr = item.next_maintenance_date;
    if (!nextDateStr) {
      return (
        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500">
          {isRtl ? 'غير مجدول' : 'Unscheduled'}
        </span>
      );
    }

    const nextDate = new Date(nextDateStr);
    const now = new Date();
    const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white border border-rose-600 animate-pulse">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>{isRtl ? `متأخرة ${Math.abs(diffDays)} يوماً!` : `Overdue ${Math.abs(diffDays)}d!`}</span>
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black bg-amber-500 text-zinc-950">
          <Clock className="w-2.5 h-2.5" />
          <span>{isRtl ? `خلال ${diffDays} يوماً` : `Due in ${diffDays}d`}</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>{isRtl ? 'محدثة وصالحة' : 'Up to date'}</span>
        </span>
      );
    }
  };

  // Maintenance Submit Handler
  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForMaintenance) return;

    setItems(prevItems => prevItems.map(item => {
      if (item.id === selectedAssetForMaintenance.id) {
        const nextDate = new Date(maintenanceForm.nextMaintenanceDate);
        const now = new Date();
        const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        let computedStatus: ReliefInventoryItem['maintenance_status'] = 'UP_TO_DATE';
        if (maintenanceForm.condition === 'UNDER_MAINTENANCE') {
          computedStatus = 'IN_REPAIR';
        } else if (diffDays < 0) {
          computedStatus = 'OVERDUE';
        } else if (diffDays <= 30) {
          computedStatus = 'DUE_SOON';
        }

        return {
          ...item,
          condition: maintenanceForm.condition,
          serial_no: maintenanceForm.serialNo,
          last_maintenance_date: maintenanceForm.lastMaintenanceDate,
          next_maintenance_date: maintenanceForm.nextMaintenanceDate,
          maintenance_status: computedStatus,
          assigned_custodian_hr: maintenanceForm.assignedCustodianHr,
          accounting_ledger_code: maintenanceForm.accountingLedgerCode,
          project_activity_id: maintenanceForm.projectActivityId,
          procurement_po_ref: maintenanceForm.procurementPoRef,
          notes: maintenanceForm.notes ? `${item.notes || ''} | [صيانة ${maintenanceForm.lastMaintenanceDate}]: ${maintenanceForm.notes}` : item.notes
        };
      }
      return item;
    }));

    if (maintenanceForm.condition === 'DAMAGED' || maintenanceForm.condition === 'UNDER_MAINTENANCE') {
      const condName = maintenanceForm.condition === 'DAMAGED' ? (isRtl ? 'تالف / يحتاج إصلاح' : 'Damaged') : (isRtl ? 'قيد الصيانة' : 'Under Repair');
      const title = isRtl
        ? `🚨 تنبيه أصول: تم تحويل (${selectedAssetForMaintenance.name_ar}) إلى حالة ${condName}`
        : `🚨 Asset Alert: (${selectedAssetForMaintenance.name_en}) set to ${condName}`;
      const body = isRtl
        ? `العهد الميدانية: ${maintenanceForm.assignedCustodianHr || 'HR'} | الحسابات: ${maintenanceForm.accountingLedgerCode || 'IPSAS-17'}.`
        : `Custodian: ${maintenanceForm.assignedCustodianHr || 'HR'} | Ledger: ${maintenanceForm.accountingLedgerCode || 'IPSAS-17'}.`;
      triggerPushAlert(title, body, 'critical', selectedAssetForMaintenance);
    } else {
      const title = isRtl
        ? `✅ تم تحديث كارت الصيانة وحالة الأصل: (${selectedAssetForMaintenance.name_ar})`
        : `✅ Maintenance Schedule Updated: (${selectedAssetForMaintenance.name_en})`;
      const body = isRtl
        ? `موعد الصيانة القادمة: ${maintenanceForm.nextMaintenanceDate} | الموارد البشرية: ${maintenanceForm.assignedCustodianHr}`
        : `Next Maintenance: ${maintenanceForm.nextMaintenanceDate} | Custodian: ${maintenanceForm.assignedCustodianHr}`;
      triggerPushAlert(title, body, 'info', selectedAssetForMaintenance);
    }

    setIsMaintenanceModalOpen(false);
    setSelectedAssetForMaintenance(null);
  };

  // Filtered Assets list
  const filteredAssetItems = items.filter(item => {
    const matchesCondition = assetConditionFilter === 'ALL' || (item.condition || 'NEW') === assetConditionFilter;
    
    let status = item.maintenance_status || 'UP_TO_DATE';
    if (item.next_maintenance_date) {
      const nextDate = new Date(item.next_maintenance_date);
      const now = new Date();
      const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays < 0) status = 'OVERDUE';
      else if (diffDays <= 30) status = 'DUE_SOON';
    }

    const matchesMaintenance = assetMaintenanceFilter === 'ALL' || status === assetMaintenanceFilter;
    const matchesWarehouse = assetWarehouseFilter === 'all' || item.warehouse_id === assetWarehouseFilter;

    const query = assetSearchQuery.toLowerCase();
    const matchesSearch = assetSearchQuery === '' ||
      item.name_ar.toLowerCase().includes(query) ||
      item.name_en.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      (item.serial_no && item.serial_no.toLowerCase().includes(query)) ||
      (item.assigned_custodian_hr && item.assigned_custodian_hr.toLowerCase().includes(query)) ||
      (item.accounting_ledger_code && item.accounting_ledger_code.toLowerCase().includes(query)) ||
      (item.project_activity_id && item.project_activity_id.toLowerCase().includes(query)) ||
      (item.procurement_po_ref && item.procurement_po_ref.toLowerCase().includes(query));

    return matchesCondition && matchesMaintenance && matchesWarehouse && matchesSearch;
  });

  // KPI calculations for Assets
  const assetNewCount = items.filter(i => (i.condition || 'NEW') === 'NEW').length;
  const assetUsedCount = items.filter(i => i.condition === 'USED_GOOD').length;
  const assetMaintCount = items.filter(i => i.condition === 'UNDER_MAINTENANCE').length;
  const assetDamagedCount = items.filter(i => i.condition === 'DAMAGED').length;

  const overdueMaintCount = items.filter(i => {
    if (!i.next_maintenance_date) return false;
    return new Date(i.next_maintenance_date) < new Date();
  }).length;

  const dueSoonMaintCount = items.filter(i => {
    if (!i.next_maintenance_date) return false;
    const nextDate = new Date(i.next_maintenance_date);
    const now = new Date();
    const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const totalAssetValuationYer = items.reduce((acc, i) => acc + (i.qty * i.unit_value_yer), 0);

  // Condition Pie Data for Recharts
  const conditionPieData = [
    { name: isRtl ? '✨ جديد' : 'New', value: assetNewCount || 1, color: '#06b6d4' },
    { name: isRtl ? '✅ بحالة جيدة' : 'Used Good', value: assetUsedCount || 1, color: '#10b981' },
    { name: isRtl ? '🛠️ قيد الصيانة' : 'Under Maintenance', value: assetMaintCount || 1, color: '#f59e0b' },
    { name: isRtl ? '🚨 تالف' : 'Damaged', value: assetDamagedCount || 1, color: '#f43f5e' }
  ];

  // Maintenance by Warehouse Bar Chart Data for Recharts
  const maintenanceByWarehouseData = warehouses.map(wh => {
    const whItems = items.filter(i => i.warehouse_id === wh.id);
    const overdue = whItems.filter(i => i.next_maintenance_date && new Date(i.next_maintenance_date) < new Date()).length;
    const dueSoon = whItems.filter(i => {
      if (!i.next_maintenance_date) return false;
      const diff = Math.ceil((new Date(i.next_maintenance_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return diff >= 0 && diff <= 30;
    }).length;
    const upToDate = Math.max(0, whItems.length - overdue - dueSoon);

    return {
      name: isRtl ? wh.name_ar.split('-')[0].trim() : wh.name_en.split('-')[0].trim(),
      [isRtl ? 'محدثة وصالحة' : 'Up To Date']: upToDate,
      [isRtl ? 'قادمة قريباً' : 'Due Soon']: dueSoon,
      [isRtl ? 'متأخرة' : 'Overdue']: overdue
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ==================== 1. TOP TITLE BANNER & ACTION BAR ==================== */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-xs">
            <Warehouse className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {isRtl ? 'إدارة الفروع والمخازن المتعددة والتحويل العيني' : 'Multi-Branch & Warehouse Inventory OS'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                {isRtl ? 'المخزون واللوجستيات' : 'Inventory & Logistics'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {isRtl 
                ? 'إدارة الفروع، المخازن الميدانية، التحويل العيني التبادلي بين المستودعات وتتبع تاريخ بوائلص الشحن والحركات' 
                : 'Multi-branch logistics, inter-warehouse in-kind stock transfers & automated waybill audit trail.'}
            </p>
          </div>
        </div>

        {/* Global Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-Beneficiary Multi-SKU Disbursement Button */}
          <button
            onClick={() => {
              if (warehouses.length > 0 && !multiWarehouseId) {
                setMultiWarehouseId(warehouses[0].id);
              }
              setIsMultiExecuted(false);
              setMultiStep(1);
              setIsMultiDisbursementModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2 cursor-pointer"
          >
            <Boxes className="w-4 h-4 text-amber-300 animate-pulse" />
            <Users className="w-4 h-4 text-white" />
            <span>{isRtl ? 'صرف مخزني متعدد للمستفيدين' : 'Multi-Beneficiary Multi-SKU Disburse'}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-400 text-zinc-950 font-black uppercase">
              {isRtl ? 'جديد' : 'NEW'}
            </span>
          </button>

          {/* Quick Transfer Button */}
          <button
            onClick={() => {
              const defaultItem = items[0];
              const defaultWh = warehouses.find(w => w.id === defaultItem?.warehouse_id);
              const otherWh = warehouses.find(w => w.id !== defaultWh?.id);
              setMovementForm({
                itemId: defaultItem?.id || '',
                sourceWarehouseId: defaultWh?.id || '',
                targetWarehouseId: otherWh?.id || '',
                type: 'TRANSFER',
                qty: '100',
                recipientOrDonor: '',
                refNo: '',
                waybillNo: `TR-WAY-2026-${Math.floor(10 + Math.random() * 90)}`,
                driverName: '',
                vehiclePlate: '',
                notes: ''
              });
              setIsMovementModalOpen(true);
            }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{isRtl ? 'تحويل عيني بين المخازن' : 'In-Kind Transfer'}</span>
          </button>

          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة مادة إغاثية' : 'Add Relief SKU'}</span>
          </button>

          <button
            onClick={() => setIsMaterialIssueModalOpen(true)}
            className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Target className="w-4 h-4 text-amber-300" />
            <span>{isRtl ? 'طلب صرف مواد للمشروع (WBS)' : 'WBS Material Issue Request'}</span>
          </button>

          <button
            onClick={() => {
              setMovementForm({
                itemId: items[0]?.id || '',
                sourceWarehouseId: warehouses[0]?.id || '',
                targetWarehouseId: '',
                type: 'RECEIVE',
                qty: '100',
                recipientOrDonor: '',
                refNo: '',
                waybillNo: '',
                driverName: '',
                vehiclePlate: '',
                notes: ''
              });
              setIsMovementModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>{isRtl ? 'إذن توريد / صرف' : 'Receipt / Disburse'}</span>
          </button>

          <button
            onClick={() => setIsNewWarehouseModalOpen(true)}
            className="px-3 py-2.5 bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Building className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'ترخيص مستودع' : 'Add Depot'}</span>
          </button>

          <button
            onClick={() => setIsNewBranchModalOpen(true)}
            className="px-3 py-2.5 bg-zinc-800 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <GitFork className="w-4 h-4 text-purple-400" />
            <span>{isRtl ? 'فرع جديد' : 'Add Branch'}</span>
          </button>
        </div>
      </div>

      {/* ==================== 1.5 NAVIGATION TAB BAR ==================== */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveViewTab('analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-300" />
            <span>{isRtl ? 'لوحة تحليلات دوران المخزون وتوقعات الطلب الذكية' : 'AI Analytics & Demand Forecasts'}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-zinc-950 font-extrabold uppercase">
              AI
            </span>
          </button>

          <button
            onClick={() => setActiveViewTab('inventory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>{isRtl ? 'سجل المواد والأصناف الإغاثية' : 'Relief SKUs & Inventory'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveViewTab('assets')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'assets'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>{isRtl ? 'حالة الأصول والصيانة الدورية' : 'Asset Condition & Maintenance'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono font-bold">
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveViewTab('warehouses')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'warehouses'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Warehouse className="w-4 h-4 text-amber-500" />
            <span>{isRtl ? 'الفروع والمستودعات الميدانية' : 'Branches & Warehouses'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
              {warehouses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveViewTab('movements')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'movements'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-purple-400" />
            <span>{isRtl ? 'سجل الحركات والتحويل العيني' : 'Movements & Transfer Audit'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
              {movements.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveViewTab('procurement');
              loadProcurementRequests();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'procurement'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>{isRtl ? 'سير طلبات الشراء والمشتريات' : 'Procurement & Reorder Workflow'}</span>
            {items.filter(i => i.qty <= i.reorder_level).length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-mono font-bold animate-pulse">
                {items.filter(i => i.qty <= i.reorder_level).length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Date Stamp / Export Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 text-[11px] font-mono text-slate-400">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>{isRtl ? 'مؤشرات لحظية محدثة 2026' : 'Real-time Analytics Engine'}</span>
        </div>
      </div>

      {/* ==================== FLOATING REAL-TIME PUSH TOAST BANNER ==================== */}
      {activePushToast && (
        <div className="fixed bottom-6 left-6 z-50 max-w-md bg-zinc-950 text-white border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40 shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="px-2 py-0.2 rounded text-[9px] font-mono font-black bg-rose-500 text-white uppercase tracking-wider inline-block mb-1">
                  {isRtl ? 'إشعار دفع مباشر (Push Alert)' : 'Live Push Notification'}
                </span>
                <h4 className="text-xs font-black text-amber-300 leading-snug">
                  {activePushToast.title}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setActivePushToast(null)}
              className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed font-semibold">
            {activePushToast.body}
          </p>

          {activePushToast.item && (
            <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-amber-400">
                SKU: {activePushToast.item.sku}
              </span>
              <button
                onClick={() => {
                  if (activePushToast.item) {
                    setMovementForm({
                      itemId: activePushToast.item.id,
                      sourceWarehouseId: activePushToast.item.warehouse_id,
                      targetWarehouseId: '',
                      type: 'RECEIVE',
                      qty: String(activePushToast.item.reorder_level * 2 || 200),
                      recipientOrDonor: isRtl ? 'شحنة توريد طارئة معالجة لتنبيه الدفع المباشر' : 'Emergency Order triggered by Push Alert',
                      refNo: `PUSH-PO-2026-${Math.floor(100 + Math.random() * 900)}`,
                      waybillNo: '',
                      driverName: '',
                      vehiclePlate: '',
                      notes: isRtl 
                        ? `إصدار توريد طارئ بعد استلام تنبيه دفع نفاذ المخزون. الرصيد المتبقي: ${activePushToast.item.qty}` 
                        : `Emergency receive issued following critical stock push notification. Remaining qty: ${activePushToast.item.qty}`
                    });
                    setIsMovementModalOpen(true);
                    setActivePushToast(null);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>{isRtl ? 'إصدار أمر توريد طارئ فوري' : 'Issue Emergency Order'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== REAL-TIME PUSH NOTIFICATION & CRITICAL STOCK ALERT HUB ==================== */}
      <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-900 text-white border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  {isRtl ? 'منظومة تنبيهات الدفع المباشرة لنفاذ المخزون (Push Notifications Engine)' : 'Real-time Stockout Push Notification Engine'}
                </h3>
                <span className="px-2 py-0.2 rounded text-[9px] font-mono font-black bg-emerald-500 text-zinc-950">
                  LIVE-SYNC
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isRtl 
                  ? 'تنبيهات فورية تدفع للمتصفح، وسماعات الصوت، وشريط الإشعارات العلوي فور هبوط أي مادة إغاثية لدون مستوى الأمان' 
                  : 'Pushes desktop alerts, sound tones, and navbar notifications instantly when SKUs drop below safety limits.'}
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Push Authorization Button / Badge */}
            {pushPermission === 'granted' ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إشعارات المتصفح مفعّلة' : 'Push Granted'}</span>
              </span>
            ) : (
              <button
                onClick={requestPushPermission}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تفعيل إشعارات الدفع Push' : 'Authorize Web Push'}</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                soundEnabled 
                  ? 'bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
              title={isRtl ? 'تشغيل/إيقاف الجرس الصوتي' : 'Toggle Audio Chime'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
              <span>{soundEnabled ? (isRtl ? 'الصوت مفعل' : 'Sound ON') : (isRtl ? 'صامت' : 'Sound OFF')}</span>
            </button>

            {/* Test Push Trigger Button */}
            <button
              onClick={() => {
                const targetItem = criticalItems.length > 0 ? criticalItems[0] : items[0];
                const title = isRtl
                  ? `🚨 اختبار إشعار دفع طارئ: (${targetItem ? targetItem.name_ar : 'المواد الإغاثية'})`
                  : `🚨 Test Emergency Push Alert: (${targetItem ? targetItem.name_en : 'Relief Stock'})`;
                const body = isRtl
                  ? `تم تنفيذ إشعار الدفع المباشر بنجاح وتوثيقه في شريط الإشعارات العلوي بجهة الاتصال الحية!`
                  : `Push notification pipeline executed successfully and linked to NotificationCenter.`;

                triggerPushAlert(title, body, 'critical', targetItem);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isRtl ? 'اختبار إشعار دفع فوري' : 'Trigger Push Test'}</span>
            </button>
          </div>
        </div>

        {/* Live Critical Items Ticker Bar */}
        {criticalItems.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="font-bold text-rose-400">
                {isRtl 
                  ? `تنبيه حرج: يوجد ${criticalItems.length} مواد إغاثية بلغت حد النفاد والتغطية الحرجة:` 
                  : `Critical Stock Alert: ${criticalItems.length} SKUs below reorder threshold:`}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {criticalItems.slice(0, 3).map(ci => (
                <div key={ci.id} className="flex items-center gap-2 px-2.5 py-1 bg-zinc-950/80 border border-rose-500/30 rounded-lg text-[11px] shrink-0">
                  <span className="font-black text-white">{isRtl ? ci.name_ar : ci.name_en}</span>
                  <span className="font-mono font-bold text-rose-400">{ci.qty} / {ci.reorder_level} {isRtl ? ci.unit_ar : ci.unit_en}</span>
                  <button
                    onClick={() => {
                      setMovementForm({
                        itemId: ci.id,
                        sourceWarehouseId: ci.warehouse_id,
                        targetWarehouseId: '',
                        type: 'RECEIVE',
                        qty: String(ci.reorder_level * 2 || 200),
                        recipientOrDonor: isRtl ? 'أمر توريد طارئ سريع لتغذية المخزون الميداني' : 'Fast Emergency Reorder Receive',
                        refNo: `ALERT-PO-2026-${Math.floor(100 + Math.random() * 900)}`,
                        waybillNo: '',
                        driverName: '',
                        vehiclePlate: '',
                        notes: isRtl ? `طلب توريد طارئ بعد وصول الرصيد إلى ${ci.qty}` : `Emergency reorder as qty reached ${ci.qty}`
                      });
                      setIsMovementModalOpen(true);
                    }}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[10px] rounded transition cursor-pointer flex items-center gap-1"
                  >
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    <span>{isRtl ? 'تغذية' : 'Reorder'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================== ANALYTICS & DEMAND FORECASTING DASHBOARD ==================== */}
      {activeViewTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* AI Simulation & Scenario Control Bar */}
          <div className="bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-900 text-white border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 shrink-0">
                  <BrainCircuit className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {isRtl ? 'محرك تحليلات معدل دوران المخزون والتنبؤ بالطلب الإغاثي الذكي' : 'AI Inventory Turnover & Demand Forecasting Engine'}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-amber-500 text-zinc-950">
                      PRO-FORECAST
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isRtl 
                      ? 'تحليل معدلات دوران المخزون (Turnover) لكل قطاع، وحساب أيام التغطية DSI، وتوقع الاحتياجات المستقبلية بناءً على سيناريوهات الطوارئ' 
                      : 'Real-time turnover ratios, Days of Inventory Supply (DSI), and predictive AI demand scenarios.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Forecast Horizon Dropdown */}
                <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700 text-xs">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-400 font-bold text-[11px]">{isRtl ? 'أفق التوقع:' : 'Horizon:'}</span>
                  <select
                    value={forecastHorizon}
                    onChange={(e) => setForecastHorizon(e.target.value as any)}
                    className="bg-transparent text-white font-black focus:outline-none cursor-pointer"
                  >
                    <option value="30d" className="bg-zinc-900">{isRtl ? '30 يوماً قادمة' : '30 Days'}</option>
                    <option value="60d" className="bg-zinc-900">{isRtl ? '60 يوماً قادمة' : '60 Days'}</option>
                    <option value="90d" className="bg-zinc-900">{isRtl ? '90 يوماً (ربع سنوي)' : '90 Days (Qtr)'}</option>
                    <option value="180d" className="bg-zinc-900">{isRtl ? '180 يوماً (نصف سنوي)' : '180 Days (Half Year)'}</option>
                  </select>
                </div>

                {/* Reset / Run Model Button */}
                <button
                  onClick={() => {
                    setSeasonalityMultiplier(1.35);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{isRtl ? 'محاكاة ذروة الطوارئ (135%)' : 'Simulate Emergency Peak'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Seasonality Slider */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-black text-zinc-200 block">
                    {isRtl ? 'معامل المواسم وصدمات الطوارئ الإغاثية:' : 'Emergency & Seasonal Demand Multiplier:'}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {isRtl ? 'تعديل المعامل يعيد حساب كل الرسوم والكميات فوراً' : 'Adjust factor to simulate displacement peaks & monsoon floods.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 md:col-span-2">
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.05"
                  value={seasonalityMultiplier}
                  onChange={(e) => setSeasonalityMultiplier(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-black text-xs rounded-lg shrink-0">
                  {Math.round(seasonalityMultiplier * 100)}% {isRtl ? 'من المعدل الطبيعي' : 'of Baseline'}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Analytics Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Turnover Ratio */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {isRtl ? 'معدل دوران المخزون (Turnover)' : 'Inventory Turnover Ratio'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {avgTurnoverRatio}x
                </span>
                <span className="text-xs font-bold text-slate-500">{isRtl ? 'مرّات / سنوي' : 'times/yr'}</span>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{isRtl ? 'أداء ممتاز دال على سرعة التوزيع' : 'High rotation efficiency'}</span>
              </p>
            </div>

            {/* DSI Days */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {isRtl ? 'متوسط فترة التخزين (DSI)' : 'Days of Inventory (DSI)'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {daysOfInventorySupply}
                </span>
                <span className="text-xs font-bold text-slate-500">{isRtl ? 'يوم تغطية' : 'days'}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                {isRtl ? 'فترة التخزين الآمنة للمواد' : 'Target: < 90 Days'}
              </p>
            </div>

            {/* AI Model Forecast Accuracy */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {isRtl ? 'دقة نموذج التوقع الذكي' : 'Forecast Model Accuracy'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-500 font-mono">
                  94.8%
                </span>
                <span className="text-xs font-bold text-slate-500">MAPE 5.2%</span>
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                {isRtl ? 'اعتماداً على تاريخ الحركات الميدانية' : 'Based on historical disbursements'}
              </p>
            </div>

            {/* Safety Stock Buffer */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {isRtl ? 'مخزون الأمان الموصى به' : 'Recommended Safety Stock'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {Math.round(totalStockQty * 0.22 * seasonalityMultiplier).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-500">{isRtl ? 'وحدة' : 'units'}</span>
              </div>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                {isRtl ? 'لحماية المستودعات من الصدمات' : 'Buffer for emergency surges'}
              </p>
            </div>

            {/* Stockout Risk Indicator */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {isRtl ? 'مؤشر خطر نفاد المخزون' : 'Stockout Risk Score'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono ${criticalItems.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {criticalItems.length > 0 ? (isRtl ? 'مرتفع' : 'High') : (isRtl ? 'منخفض' : 'Low')}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {criticalItems.length} {isRtl ? 'أصناف حرجة' : 'critical SKUs'}
                </span>
              </div>
              <p className={`text-[10px] font-bold mt-1 ${criticalItems.length > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-600'}`}>
                {criticalItems.length > 0 
                  ? (isRtl ? 'تتطلب إعادة طلب فورية!' : 'Reorder needed now!') 
                  : (isRtl ? 'جميع المستويات في النطاق الآمن' : 'Stock levels within safe margins')}
              </p>
            </div>
          </div>

          {/* ==================== RECHARTS VISUALIZATIONS GRID ROW 1 ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CHART 1: Category Inventory Turnover & Volume (ComposedChart) */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {isRtl ? 'معدل دوران المخزون وحجم الصرف حسب القطاع الإغاثي' : 'Inventory Turnover & Volume by Relief Sector'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isRtl ? 'مقارنة الرصيد المتاح وإجمالي الصرف مع نسبة معدل الدوران (Turnover Ratio)' : 'Compares available stock, total disbursed volume, and turnover ratios.'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  Composed
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={categoryTurnoverData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#888888' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#888888' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#10b981' }} domain={[0, 10]} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        borderColor: '#27272a', 
                        borderRadius: '12px', 
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="stock" name={isRtl ? 'الرصيد المتاح (وحدة)' : 'Available Stock'} fill="#0284c7" radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="left" dataKey="disbursed" name={isRtl ? 'إجمالي الصرف (وحدة)' : 'Total Disbursed'} fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="turnoverRatio" name={isRtl ? 'معدل الدوران (مرّات/سنة)' : 'Turnover Ratio (x)'} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 2: Historical Demand vs AI Forecast & Safety Buffer (AreaChart) */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {isRtl ? 'اتجاهات الاستهلاك الفعلي وتوقعات الطلب المستقبلي' : 'Historical Consumption vs AI Demand Forecast'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isRtl ? 'تتبع الاستهلاك التاريخي ومسار التوقع مع نطاق ثقة الأمان للـ 4 أشهر القادمة' : 'Historical monthly actuals vs AI predicted demand trajectory & confidence bounds.'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  AI Trend
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyDemandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888888' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#888888' }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        borderColor: '#27272a', 
                        borderRadius: '12px', 
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="actual" name={isRtl ? 'الاستهلاك الفعلي (وحدة)' : 'Actual Consumption'} stroke="#10b981" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="forecast" name={isRtl ? 'الطلب المتوقع (AI Forecast)' : 'Predicted Demand'} stroke="#f59e0b" strokeDasharray="4 4" fillOpacity={1} fill="url(#colorForecast)" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="upper" name={isRtl ? 'حد الأمان الأعلى (Upper Bound)' : 'Upper Bound'} stroke="#e11d48" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ==================== RECHARTS VISUALIZATIONS GRID ROW 2 ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CHART 3: ABC Inventory Movement Velocity Matrix (PieChart / Donut) */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-purple-500" />
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {isRtl ? 'مصفوفة سرعة حركة المخزون (ABC Matrix)' : 'ABC Inventory Velocity Matrix'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isRtl ? 'توزيع الأصناف حسب سرعة الدوران ومخاطر الركود' : 'Classification into Fast, Normal, Critical, and Slow moving.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={abcClassificationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {abcClassificationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        borderColor: '#27272a', 
                        borderRadius: '12px', 
                        color: '#ffffff',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                {abcClassificationData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 text-[10px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 dark:text-zinc-300 truncate max-w-[90px]">{item.name}</span>
                    </div>
                    <span className="font-mono text-slate-900 dark:text-white">{item.value} ({item.percentage})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CHART 4: Branch Stock Availability vs 30-Day Forecast Demand (BarChart) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-blue-500" />
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {isRtl ? 'فجوة الاحتياج والطلب المتوقع للـ 30 يوماً القادمة حسب الفروع' : 'Branch Stock Availability vs 30-Day Demand Gap'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isRtl ? 'مقارنة المخزون المتوفر بكل فرع مع الطلب المتوقع واحتياج التوريد العيني' : 'Compares available stock against projected 30-day demand by regional branch.'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Branch Gap
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchDemandGapData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="branchName" tick={{ fontSize: 10, fill: '#888888' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#888888' }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        borderColor: '#27272a', 
                        borderRadius: '12px', 
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="currentStock" name={isRtl ? 'المخزون الحالي بالفرع' : 'Current Branch Stock'} fill="#0284c7" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="predictedDemand" name={isRtl ? 'الطلب المتوقع 30 يوماً' : '30-Day Predicted Demand'} fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="safetyDeficit" name={isRtl ? 'عجز الأمان المقترح (Deficit)' : 'Safety Deficit'} fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ==================== ITEM FORECAST & AUTOMATED REORDER RECOMMENDATIONS TABLE ==================== */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {isRtl ? 'جدول وتوصيات إعادة الطلب والتحويل التلقائي بناءً على توقعات الطلب' : 'Automated Reorder & Transfer Recommendations Table'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRtl ? 'تحليل لحظي لمعدل الاستهلاك وأيام التغطية المتبقية مع إمكانية إصدار إذن توريد أو تحويل بنقرة واحدة' : 'Item-level demand projections, remaining coverage days, and 1-click automated reorder trigger.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-500/20">
                  {isRtl ? `إجمالي التوصيات: ${itemForecasts.length} صنف` : `${itemForecasts.length} SKUs Modeled`}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr className="bg-slate-900 text-amber-400 font-black text-[10px] uppercase border-b border-zinc-800">
                    <th className="p-3.5 rounded-s">{isRtl ? 'رمز SKU والاسم الإغاثي' : 'SKU & Relief Item'}</th>
                    <th className="p-3.5">{isRtl ? 'المستودع والفرع' : 'Warehouse & Branch'}</th>
                    <th className="p-3.5 text-center">{isRtl ? 'الرصيد المتاح' : 'Available Stock'}</th>
                    <th className="p-3.5 text-center">{isRtl ? 'معدل الاستهلاك الشهري' : 'Monthly Rate'}</th>
                    <th className="p-3.5 text-center">{isRtl ? 'الطلب المتوقع (AI Forecast)' : 'Projected Demand'}</th>
                    <th className="p-3.5 text-center">{isRtl ? 'أيام التغطية المتبقية' : 'Days of Supply'}</th>
                    <th className="p-3.5 text-center">{isRtl ? 'كمية إعادة الطلب المقترحة' : 'Suggested Reorder'}</th>
                    <th className="p-3.5 text-center rounded-e">{isRtl ? 'إجراء تلقائي' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">
                  {itemForecasts.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                      <td className="p-3.5">
                        <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                          {i.sku}
                        </span>
                        <p className="font-black text-slate-900 dark:text-white mt-1 text-xs">
                          {isRtl ? i.name_ar : i.name_en}
                        </p>
                      </td>

                      <td className="p-3.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
                        <div>{i.warehouseName}</div>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 block">{i.branchName}</span>
                      </td>

                      <td className="p-3.5 text-center font-mono font-black text-sm">
                        {i.qty.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">{isRtl ? i.unit_ar : i.unit_en}</span>
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-slate-600 dark:text-zinc-400">
                        {i.monthlyRate.toLocaleString()} / {isRtl ? 'شهر' : 'mo'}
                      </td>

                      <td className="p-3.5 text-center font-mono font-black text-amber-600 dark:text-amber-400">
                        {i.projectedDemand.toLocaleString()} {isRtl ? i.unit_ar : i.unit_en}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black border ${
                          i.daysRemaining <= 15 
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                            : i.daysRemaining <= 30
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {i.daysRemaining} {isRtl ? 'يوم تغطية' : 'days left'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center font-mono font-black text-emerald-700 dark:text-emerald-400">
                        {i.recommendedReorderQty.toLocaleString()} {isRtl ? i.unit_ar : i.unit_en}
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            setMovementForm({
                              itemId: i.id,
                              sourceWarehouseId: i.warehouse_id,
                              targetWarehouseId: '',
                              type: 'RECEIVE',
                              qty: String(i.recommendedReorderQty || 100),
                              recipientOrDonor: isRtl ? 'أمر توريد آلي معتمد بناءً على توقعات الطلب' : 'Automated Order based on Demand Forecast',
                              refNo: `AUTO-PO-2026-${Math.floor(100 + Math.random() * 900)}`,
                              waybillNo: '',
                              driverName: '',
                              vehiclePlate: '',
                              notes: isRtl 
                                ? `أمر توريد تلقائي لتفادي نفاد المخزون. أيام التغطية المتبقية: ${i.daysRemaining} يوم` 
                                : `Automated reorder to prevent stockout. Remaining coverage: ${i.daysRemaining} days`
                            });
                            setIsMovementModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg shadow-xs transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        >
                          <Zap className="w-3 h-3 fill-current" />
                          <span>{isRtl ? 'إصدار أمر توريد آلي' : 'Auto Order'}</span>
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

      {/* ==================== 1.8 ASSET LIFECYCLE & PROJECT MAPPING ENTERPRISE MODULE ==================== */}
      {activeViewTab === 'assets' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-indigo-900/50 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-white">
                      {isRtl ? 'إدارة الأصول الثابتة والمنقولة وتتبع دورة الحياة (IPSAS-17)' : 'Fixed & Movable Asset Lifecycle & Project Mapping Hub'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950">
                      {isRtl ? 'الأصول والممتلكات' : 'Fixed Assets'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {isRtl 
                      ? 'تتبع شامل لجميع الأصول والمعدات (شراء، ضمان، إهلاك IPSAS-17، موردين، مواقع) مع ربط تلقائي ومباشر بأصول المشاريع والتسليمات الميدانية (Assets-to-Project Mapping).' 
                      : 'End-to-end lifecycle tracking (purchase date, warranty, supplier, location) with automatic mapping to project assets.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsRegisterAssetModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isRtl ? 'تسجيل أصل عيني/ثابت جديد' : 'Register New Asset'}</span>
                </button>

                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "AssetCode,Name,Category,PurchaseDate,CostYER,BookValueYER,Project,WarrantyExpiry,Condition,Status\n"
                      + fixedAssets.map(a => {
                          const dep = calculateDepreciation(a);
                          return `"${a.asset_code}","${a.name_ar}","${a.category}","${a.purchase_date}","${a.purchase_cost}","${dep.netBookValueYER}","${a.project_name || 'N/A'}","${a.warranty_expiry_date || 'N/A'}","${a.condition_code}","${a.status_code}"`;
                        }).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `Fixed_Assets_Ledger_Rohamaab_2026.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>{isRtl ? 'تصدير كشف الأصول (CSV)' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {/* Sub-Tabs Selector */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
              <button
                onClick={() => setAssetSubTab('ledger')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  assetSubTab === 'ledger'
                    ? 'bg-amber-500 text-zinc-950 font-black shadow'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>{isRtl ? 'سجل الأصول ودورة الحياة' : 'Asset Lifecycle Ledger'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/20">
                  {fixedAssets.length}
                </span>
              </button>

              <button
                onClick={() => setAssetSubTab('project_mapping')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  assetSubTab === 'project_mapping'
                    ? 'bg-amber-500 text-zinc-950 font-black shadow'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <GitFork className="w-4 h-4" />
                <span>{isRtl ? 'ربط الأصول بالمشاريع (Assets-to-Project)' : 'Project Assets Mapping'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/20">
                  {fixedAssets.filter(a => a.project_id).length}
                </span>
              </button>

              <button
                onClick={() => setAssetSubTab('depreciation')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  assetSubTab === 'depreciation'
                    ? 'bg-amber-500 text-zinc-950 font-black shadow'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>{isRtl ? 'محرك الإهلاك (IPSAS-17 Depreciation)' : 'Depreciation Engine'}</span>
              </button>

              <button
                onClick={() => setAssetSubTab('warranty')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  assetSubTab === 'warranty'
                    ? 'bg-amber-500 text-zinc-950 font-black shadow'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isRtl ? 'مركز الضمان والصيانة والموردين' : 'Warranty & Suppliers Hub'}</span>
              </button>
            </div>
          </div>

          {/* KPI CARDS SUMMARY FOR FIXED ASSETS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'إجمالي عدد الأصول الثابتة' : 'Total Asset Count'}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{fixedAssets.length}</span>
                <span className="text-xs text-slate-500 font-bold">{isRtl ? 'أصل مسجل' : 'assets'}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'إجمالي تكلفة الاستحواذ التاريخية' : 'Historical Acquisition Cost'}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {fixedAssets.reduce((sum, a) => sum + (a.purchase_cost || 0), 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">YER</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'صافي القيمة الدفترية الحالية (IPSAS-17)' : 'Net Book Value'}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {fixedAssets.reduce((sum, a) => sum + calculateDepreciation(a).netBookValueYER, 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">YER</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'الأصول المخصصة للمشاريع' : 'Mapped to Projects'}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                  {fixedAssets.filter(a => a.project_id).length}
                </span>
                <span className="text-xs text-slate-500 font-bold">{isRtl ? 'أصل ميداني' : 'allocated'}</span>
              </div>
            </div>
          </div>

          {/* SUB-TAB 1: LIFECYCLE LEDGER */}
          {assetSubTab === 'ledger' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder={isRtl ? 'بحث بكود الأصل، الاسم، الرقم التسلسلي...' : 'Search by code, name, serial...'}
                    value={assetSearchQuery}
                    onChange={(e) => setAssetSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <select
                  value={assetConditionFilter}
                  onChange={(e) => setAssetConditionFilter(e.target.value as any)}
                  className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="ALL">{isRtl ? 'جميع الحالات الفنية' : 'All Conditions'}</option>
                  <option value="NEW">{isRtl ? '✨ جديد (ممتاز)' : 'Brand New'}</option>
                  <option value="USED_GOOD">{isRtl ? '✅ مستخدم - حالة جيدة' : 'Used Good'}</option>
                  <option value="UNDER_MAINTENANCE">{isRtl ? '🛠️ قيد الصيانة والترميم' : 'Under Maintenance'}</option>
                  <option value="DAMAGED">{isRtl ? '🚨 تالف / يحتاج إصلاح' : 'Damaged'}</option>
                  <option value="DISPOSED">{isRtl ? '⬛ مستبعد (تكهين)' : 'Disposed'}</option>
                </select>

                <select
                  value={assetWarehouseFilter}
                  onChange={(e) => setAssetWarehouseFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="all">{isRtl ? 'جميع المستودعات والمواقع' : 'All Warehouses'}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{isRtl ? w.name_ar : w.name_en}</option>
                  ))}
                </select>

                <div className="flex items-center justify-end">
                  <span className="text-xs font-bold text-slate-500">
                    {isRtl ? `عرض ${fixedAssets.length} أصل` : `Showing ${fixedAssets.length} assets`}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                    <thead>
                      <tr className="bg-slate-900 text-amber-400 font-black text-[10px] uppercase border-b border-zinc-800">
                        <th className="p-3.5">{isRtl ? 'كود واسم الأصل' : 'Asset Code & Name'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'الحالة والضمان' : 'Condition & Warranty'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'تاريخ الشراء والتكلفة' : 'Purchase & Cost'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'صافي القيمة الدفترية' : 'Net Book Value'}</th>
                        <th className="p-3.5">{isRtl ? 'المشروع المرتبط' : 'Project Mapping'}</th>
                        <th className="p-3.5">{isRtl ? 'الموقع وأمين العهدة' : 'Custodian & Location'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">
                      {fixedAssets.map(asset => {
                        const dep = calculateDepreciation(asset);
                        const wInfo = getWarrantyInfo(asset.warranty_expiry_date);

                        return (
                          <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {asset.asset_code}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                                  {asset.category}
                                </span>
                              </div>
                              <p className="font-black text-slate-900 dark:text-white mt-1 text-xs">
                                {isRtl ? asset.name_ar : asset.name_en}
                              </p>
                              {asset.serial_number && (
                                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold block mt-0.5">
                                  SN: {asset.serial_number}
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-center space-y-1">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                asset.condition_code === 'NEW' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                asset.condition_code === 'USED_GOOD' ? 'bg-sky-500/10 text-sky-600 border border-sky-500/20' :
                                asset.condition_code === 'UNDER_MAINTENANCE' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                                'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                              }`}>
                                {asset.condition_code}
                              </span>

                              <div className="block">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${wInfo.badgeBg}`}>
                                  🛡️ {isRtl ? wInfo.labelAr : wInfo.labelEn}
                                </span>
                              </div>
                            </td>

                            <td className="p-3.5 text-center font-mono">
                              <span className="text-slate-500 text-[10px] block">{asset.purchase_date}</span>
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {asset.purchase_cost.toLocaleString()} YER
                              </span>
                            </td>

                            <td className="p-3.5 text-center font-mono">
                              <span className="font-extrabold text-blue-600 dark:text-blue-400 block text-xs">
                                {dep.netBookValueYER.toLocaleString()} YER
                              </span>
                              <span className="text-[9px] text-slate-400 font-extrabold">
                                ${dep.netBookValueUSD.toLocaleString()} USD
                              </span>
                            </td>

                            <td className="p-3.5">
                              {asset.project_name ? (
                                <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-700 dark:text-purple-300">
                                  <div className="flex items-center gap-1 font-bold">
                                    <Target className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                    <span className="truncate max-w-[150px]">{asset.project_name}</span>
                                  </div>
                                  {asset.activity_id && (
                                    <span className="text-[9px] font-mono text-purple-500 block">Act: {asset.activity_id}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  {isRtl ? 'غير مخصص لمشروع (في المستودع)' : 'Unallocated (In Storage)'}
                                </span>
                              )}
                            </td>

                            <td className="p-3.5">
                              <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-zinc-100">
                                <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>{asset.location_name || 'المستودع الرئيسي'}</span>
                              </div>
                              {asset.assigned_custodian_hr && (
                                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block mt-0.5">
                                  👤 {asset.assigned_custodian_hr}
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-center space-y-1">
                              <button
                                onClick={() => {
                                  setSelectedAssetForProjectMap(asset);
                                  setMapProjectForm({
                                    projectId: asset.project_id || '',
                                    activityId: asset.activity_id || '',
                                    locationName: asset.location_name || '',
                                    assignedCustodianHr: asset.assigned_custodian_hr || '',
                                    notes: ''
                                  });
                                  setIsMapProjectModalOpen(true);
                                }}
                                className="w-full px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                <GitFork className="w-3 h-3" />
                                <span>{isRtl ? 'ربط/نقل مشروع' : 'Map Project'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedAssetForDisposal(asset);
                                  setIsDisposalModalOpen(true);
                                }}
                                className="w-full px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 rounded-lg text-[10px] font-bold border border-rose-500/20 transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>{isRtl ? 'تكهين / استبعاد' : 'Dispose'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: PROJECT ASSETS MAPPING */}
          {assetSubTab === 'project_mapping' && (
            <div className="space-y-6">
              {/* Project Allocation Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {projectsList.map(proj => {
                  const projAssets = fixedAssets.filter(a => a.project_id === proj.id);
                  const totalCost = projAssets.reduce((s, a) => s + (a.purchase_cost || 0), 0);

                  return (
                    <div key={proj.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-500" />
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                              {isRtl ? proj.name_ar : proj.name_en}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">{proj.code}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                          <span className="text-[9px] text-slate-400 font-sans font-bold block">{isRtl ? 'الأصول المخصصة' : 'Assets'}</span>
                          <span className="font-black text-purple-600 dark:text-purple-400 text-sm">{projAssets.length}</span>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                          <span className="text-[9px] text-slate-400 font-sans font-bold block">{isRtl ? 'إجمالي التكلفة' : 'Value'}</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">{(totalCost / 1000000).toFixed(1)}M YER</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const unmapped = fixedAssets.find(a => !a.project_id);
                          if (unmapped) {
                            setSelectedAssetForProjectMap(unmapped);
                            setMapProjectForm({
                              projectId: proj.id,
                              activityId: 'ACT-01',
                              locationName: isRtl ? proj.name_ar : proj.name_en,
                              assignedCustodianHr: '',
                              notes: ''
                            });
                            setIsMapProjectModalOpen(true);
                          }
                        }}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تخصيص أصل للمشروع' : 'Assign Asset'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Mapped Assets Detailed Table */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <GitFork className="w-5 h-5 text-purple-500" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {isRtl ? 'مصفوفة الأصول العينية المخصصة والمربوطة بالمشاريع التنموية' : 'Assets-to-Project Operational Matrix'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isRtl ? 'عرض مباشر لجميع العهد والمعدات المسلمة للمشاريع الميدانية مع أمناء العهدة' : 'Direct linkage between physical assets and ongoing project operations.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                    <thead>
                      <tr className="bg-slate-900 text-amber-400 font-black text-[10px] uppercase border-b border-zinc-800">
                        <th className="p-3.5">{isRtl ? 'كود واسم الأصل' : 'Asset Code & Name'}</th>
                        <th className="p-3.5">{isRtl ? 'المشروع والنشاط الميداني' : 'Project & Activity'}</th>
                        <th className="p-3.5">{isRtl ? 'أمين العهدة الميدانية (HR)' : 'Field Custodian'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'التكلفة التاريخية' : 'Acquisition Cost'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'إعادة للمستودع' : 'Transfer/Return'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                      {fixedAssets.filter(a => a.project_id).map(asset => (
                        <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40">
                          <td className="p-3.5">
                            <span className="font-mono text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {asset.asset_code}
                            </span>
                            <p className="font-black text-slate-900 dark:text-white mt-1">
                              {isRtl ? asset.name_ar : asset.name_en}
                            </p>
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-purple-600 dark:text-purple-400 block">
                              {asset.project_name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">Act: {asset.activity_id || 'N/A'}</span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-sky-600 dark:text-sky-400 block">
                              👤 {asset.assigned_custodian_hr || 'غير محدد'}
                            </span>
                            <span className="text-[10px] text-slate-400">Location: {asset.location_name}</span>
                          </td>

                          <td className="p-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {asset.purchase_cost.toLocaleString()} YER
                          </td>

                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                setSelectedAssetForProjectMap(asset);
                                setMapProjectForm({
                                  projectId: '',
                                  activityId: '',
                                  locationName: 'المستودع الرئيسي',
                                  assignedCustodianHr: '',
                                  notes: 'إعادة الأصل للمخزن عند انتهاء المشروع'
                                });
                                setIsMapProjectModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{isRtl ? 'إنهاء التخصيص وإعادة' : 'Unmap & Return'}</span>
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

          {/* SUB-TAB 3: DEPRECIATION ENGINE */}
          {assetSubTab === 'depreciation' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {isRtl ? 'جدول ومحرك الإهلاك المحاسبي حسب معيار القطاع العام (IPSAS-17)' : 'IPSAS-17 Straight-Line Depreciation Engine'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isRtl ? 'حساب تلقائي للإهلاك المتراكم وصافي القيمة الدفترية بناءً على العمر الإنتاجي بالشهور والقيمة المتبقية' : 'Automated straight-line depreciation calculation per IPSAS-17 standards.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                    <thead>
                      <tr className="bg-slate-900 text-amber-400 font-black text-[10px] uppercase border-b border-zinc-800">
                        <th className="p-3.5">{isRtl ? 'الأصل والعمر الإنتاجي' : 'Asset & Useful Life'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'تاريخ الشراء' : 'Purchase Date'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'تكلفة الشراء (YER)' : 'Historical Cost'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'الإهلاك الشهري' : 'Monthly Expense'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'مجمع الإهلاك المتراكم' : 'Accumulated Depr.'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'صافي القيمة الدفترية (YER)' : 'Net Book Value'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'القيمة التخريدية' : 'Salvage Value'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-mono text-xs">
                      {fixedAssets.map(asset => {
                        const dep = calculateDepreciation(asset);

                        return (
                          <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40">
                            <td className="p-3.5 font-sans">
                              <span className="font-mono text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                {asset.asset_code}
                              </span>
                              <p className="font-black text-slate-900 dark:text-white mt-1">
                                {isRtl ? asset.name_ar : asset.name_en}
                              </p>
                              <span className="text-[10px] text-slate-400 font-bold block">
                                العمر: {asset.useful_life_months} شهر ({dep.elapsedMonths} شهر انقضى)
                              </span>
                            </td>

                            <td className="p-3.5 text-center text-slate-500">
                              {asset.purchase_date}
                            </td>

                            <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                              {asset.purchase_cost.toLocaleString()}
                            </td>

                            <td className="p-3.5 text-center text-rose-600 dark:text-rose-400 font-bold">
                              -{dep.monthlyDepreciationYER.toLocaleString()} YER/mo
                            </td>

                            <td className="p-3.5 text-center text-amber-600 dark:text-amber-400 font-bold">
                              {dep.accumulatedDepreciationYER.toLocaleString()} YER
                            </td>

                            <td className="p-3.5 text-center font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {dep.netBookValueYER.toLocaleString()} YER
                            </td>

                            <td className="p-3.5 text-center text-slate-400">
                              {(asset.residual_value || 0).toLocaleString()} YER
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: WARRANTY & SUPPLIERS HUB */}
          {assetSubTab === 'warranty' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {isRtl ? 'سجل تتبع فترة الضمان والموردين وخدمات ما بعد البيع' : 'Asset Warranty & Supplier Management Hub'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isRtl ? 'متابعة صلاحية عقود الصيانة والضمان مع جهات التوريد المعتمدة لدى الجمعية' : 'Monitor warranty expiry dates and accredited supplier contact details.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                    <thead>
                      <tr className="bg-slate-900 text-amber-400 font-black text-[10px] uppercase border-b border-zinc-800">
                        <th className="p-3.5">{isRtl ? 'الأصل' : 'Asset'}</th>
                        <th className="p-3.5">{isRtl ? 'المورد المعتمد والتواصل' : 'Supplier & Contact'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'تاريخ انتهاء الضمان' : 'Warranty Expiry'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'حالة الضمان' : 'Warranty Status'}</th>
                        <th className="p-3.5 text-center">{isRtl ? 'إجراء مطالبة' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                      {fixedAssets.map(asset => {
                        const wInfo = getWarrantyInfo(asset.warranty_expiry_date);

                        return (
                          <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40">
                            <td className="p-3.5">
                              <span className="font-mono text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                {asset.asset_code}
                              </span>
                              <p className="font-black text-slate-900 dark:text-white mt-1">
                                {isRtl ? asset.name_ar : asset.name_en}
                              </p>
                            </td>

                            <td className="p-3.5">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                🏢 {asset.supplier_name || 'شركة التوريدات المعتمدة'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                📞 {asset.supplier_contact || '+967 770000000'}
                              </span>
                            </td>

                            <td className="p-3.5 text-center font-mono text-slate-500">
                              {asset.warranty_expiry_date || 'N/A'}
                            </td>

                            <td className="p-3.5 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${wInfo.badgeBg}`}>
                                🛡️ {isRtl ? wInfo.labelAr : wInfo.labelEn}
                              </span>
                            </td>

                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => triggerPushAlert(
                                  isRtl ? `📞 جاري الاتصال بالمورد (${asset.supplier_name})` : `📞 Contacting Supplier (${asset.supplier_name})`,
                                  isRtl ? `طلب صيانة بالضمان للأصل ${asset.name_ar}` : `Warranty claim requested for asset ${asset.name_en}`,
                                  'info'
                                )}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-[10px] font-black shadow transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>{isRtl ? 'طلب خدمة ضمان' : 'Claim Warranty'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==================== 2. EXECUTIVE KPI CARDS & MAIN VIEW SECTIONS ==================== */}
      {(activeViewTab === 'inventory' || activeViewTab === 'warehouses' || activeViewTab === 'movements') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Branches */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {isRtl ? 'فروع الجمعية' : 'Active Branches'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {branches.length}
              </span>
              <span className="text-xs font-bold text-slate-500">{isRtl ? 'فرع إقليمي' : 'branches'}</span>
            </div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/20">
            <GitFork className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Active Warehouses */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {isRtl ? 'المستودعات الميدانية' : 'Field Depots'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {warehouses.length}
              </span>
              <span className="text-xs font-bold text-slate-500">{isRtl ? 'موقع تخزين' : 'depots'}</span>
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
            <Warehouse className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total SKUs */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {isRtl ? 'إجمالي المواد والمستلزمات' : 'Total Relief SKUs'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {totalSkuCount}
              </span>
              <span className="text-xs font-bold text-slate-500">{isRtl ? 'صنف مسجل' : 'SKUs'}</span>
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
            <Box className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Transfers Count */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {isRtl ? 'عمليات التحويل العيني' : 'In-Kind Transfers'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {transferMovementsCount}
              </span>
              <span className="text-xs font-bold text-slate-500">{isRtl ? 'شحنة محولة' : 'transfers'}</span>
            </div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/20">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Valuation */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {isRtl ? 'القيمة التقديرية للمخزون' : 'Total Valuation'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {totalValuationYer.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-500">YER</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ==================== 3. BRANCH & WAREHOUSE HIERARCHY SELECTOR ==================== */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-500" />
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {isRtl ? 'الهيكل اللوجستي للفروع والمستودعات الميدانية' : 'Branch & Warehouse Logistics Structure'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isRtl ? 'تصفح وإدارة المخزون بحسب الفرع والمستودع التابع له' : 'Filter inventory by regional branch and linked field depots.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">{isRtl ? 'تصفية حسب الفرع:' : 'Branch Filter:'}</span>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setSelectedWarehouse('all');
              }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">{isRtl ? 'جميع فروع الجمعية' : 'All Branches'}</option>
              {branches.map(br => (
                <option key={br.id} value={br.id}>
                  {isRtl ? br.name_ar : br.name_en} ({br.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Branch Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {branches.map(br => {
            const branchWarehouses = warehouses.filter(w => w.branch_id === br.id);
            const branchWhIds = branchWarehouses.map(w => w.id);
            const branchItems = items.filter(i => branchWhIds.includes(i.warehouse_id));
            const isSelected = selectedBranch === br.id;

            return (
              <div
                key={br.id}
                onClick={() => {
                  if (selectedBranch === br.id) {
                    setSelectedBranch('all');
                    setSelectedWarehouse('all');
                  } else {
                    setSelectedBranch(br.id);
                    setSelectedWarehouse('all');
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected 
                    ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/20' 
                    : 'bg-slate-50/50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    {br.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {br.region_ar}
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                  {isRtl ? br.name_ar : br.name_en}
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isRtl ? `المدير: ${br.manager_name}` : `Manager: ${br.manager_name}`}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-zinc-800 flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-600 dark:text-zinc-400">
                    <Warehouse className="w-3 h-3 inline mr-1 text-amber-500" />
                    {branchWarehouses.length} {isRtl ? 'مستودعات' : 'depots'}
                  </span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono">
                    {branchItems.length} {isRtl ? 'أصناف' : 'SKUs'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Warehouses inside selected Branch */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Warehouse className="w-4 h-4 text-amber-500" />
              <span>
                {selectedBranch === 'all' 
                  ? (isRtl ? 'جميع المستودعات والمراكز اللوجستية الميدانية' : 'All Field Depots') 
                  : (isRtl ? `المستودعات التابعة لـ (${branches.find(b => b.id === selectedBranch)?.name_ar})` : `Depots under ${branches.find(b => b.id === selectedBranch)?.name_en}`)}
              </span>
            </span>

            {selectedWarehouse !== 'all' && (
              <button
                onClick={() => setSelectedWarehouse('all')}
                className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
              >
                {isRtl ? 'إلغاء تحديد المستودع' : 'Clear Warehouse Filter'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {warehouses
              .filter(wh => selectedBranch === 'all' || wh.branch_id === selectedBranch)
              .map(wh => {
                const parentBranch = branches.find(b => b.id === wh.branch_id);
                const whItemCount = items.filter(i => i.warehouse_id === wh.id).length;
                const isWhSelected = selectedWarehouse === wh.id;

                return (
                  <div 
                    key={wh.id}
                    onClick={() => setSelectedWarehouse(isWhSelected ? 'all' : wh.id)}
                    className={`bg-white dark:bg-zinc-900 border rounded-xl p-3.5 shadow-xs hover:shadow-sm transition cursor-pointer relative ${
                      isWhSelected 
                        ? 'border-amber-500 ring-2 ring-amber-500/20' 
                        : 'border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                        {wh.capacity}
                      </span>
                      {parentBranch && (
                        <span className="text-[9px] bg-purple-500/10 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-extrabold">
                          {isRtl ? parentBranch.name_ar : parentBranch.name_en}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                      {isRtl ? wh.name_ar : wh.name_en}
                    </h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      <span>{isRtl ? wh.location_ar : wh.location_en}</span>
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1">
                      <div className="flex justify-between text-[9px] font-extrabold text-slate-500">
                        <span>{isRtl ? 'الأشغال:' : 'Capacity:'}</span>
                        <span className="font-mono text-emerald-600">{wh.percentage_used}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${wh.percentage_used}%` }}
                        />
                      </div>
                      <div className="flex justify-between pt-0.5 text-[9px] text-slate-400 font-bold">
                        <span>{isRtl ? `أمين: ${wh.manager_name}` : `Keeper: ${wh.manager_name}`}</span>
                        <span className="text-amber-600 font-mono font-black">{whItemCount} SKUs</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ==================== 4. CRITICAL REORDER ALERT BANNER ==================== */}
      {criticalItems.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-xl shrink-0">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-black text-rose-900 dark:text-rose-200">
                {isRtl ? `تنبيه حرج: توجد ${criticalItems.length} مواد إغاثية أقل من حد الأمان والطلب الأدنى!` : `Critical Warning: ${criticalItems.length} items below minimum safety stock!`}
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                {criticalItems.map(i => isRtl ? i.name_ar : i.name_en).join(' - ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setStockStatusFilter('critical')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-xs transition shrink-0 cursor-pointer"
          >
            {isRtl ? 'عرض الأصناف الحرجة فقط' : 'View Critical SKUs'}
          </button>
        </div>
      )}

      {/* ==================== 5. INVENTORY SKUS TABLE & SEARCH FILTER ==================== */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* Search & Filter Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 dir-rtl:right-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={isRtl ? 'بحث برقم SKU، اسم المادة، رقم الدفعة Batch No...' : 'Search by SKU, item name, or batch number...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 dir-rtl:pr-9 dir-rtl:pl-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{isRtl ? 'جميع القطاعات الإغاثية' : 'All Categories'}</option>
              <option value="FOOD_AID">{isRtl ? 'الأمن الغذائي والإغاثة' : 'Food Aid'}</option>
              <option value="NUTRITION">{isRtl ? 'التغذية والأمهات' : 'Nutrition'}</option>
              <option value="SHELTER">{isRtl ? 'الإيواء والمواد غير الغذائية' : 'Shelter & NFI'}</option>
              <option value="MEDICAL">{isRtl ? 'المستلزمات والأدوية الطبية' : 'Medical Stores'}</option>
              <option value="WASH">{isRtl ? 'المياه والإزميل الصحي WASH' : 'WASH'}</option>
              <option value="EDUCATION">{isRtl ? 'التعليم والتجهيزات' : 'Education'}</option>
            </select>

            {/* Stock Status Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setStockStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${stockStatusFilter === 'all' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
              >
                {isRtl ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setStockStatusFilter('critical')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${stockStatusFilter === 'critical' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500'}`}
              >
                {isRtl ? 'حرجة / منخفضة' : 'Critical'}
              </button>
              <button
                onClick={() => setStockStatusFilter('sufficient')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${stockStatusFilter === 'sufficient' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'}`}
              >
                {isRtl ? 'وفيرة' : 'Sufficient'}
              </button>
            </div>
          </div>
        </div>

        {/* Inventory SKU Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr className="bg-slate-900 text-amber-400 font-black text-[10px] uppercase border-b border-zinc-800">
                <th className="p-3.5 rounded-s">{isRtl ? 'رمز المادة SKU والاسم' : 'SKU & Item Name'}</th>
                <th className="p-3.5">{isRtl ? 'الفرع والمستودع' : 'Branch & Warehouse'}</th>
                <th className="p-3.5 text-center">{isRtl ? 'الدفعة والصلاحية' : 'Batch & Expiry'}</th>
                <th className="p-3.5 text-center">{isRtl ? 'الرصيد المتاح' : 'Available Qty'}</th>
                <th className="p-3.5 text-center">{isRtl ? 'حد إعادة الطلب' : 'Reorder Level'}</th>
                <th className="p-3.5 text-right">{isRtl ? 'القيمة الإجمالية' : 'Total Valuation'}</th>
                <th className="p-3.5 text-center rounded-e">{isRtl ? 'تحويل / حركة' : 'Transfer / Move'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    {isRtl ? 'لم يتم العثور على مواد مخزنية مطابقة للبحث أو التصفية.' : 'No matching inventory items found.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const wh = warehouses.find(w => w.id === item.warehouse_id);
                  const br = branches.find(b => b.id === wh?.branch_id);
                  const isCritical = item.qty <= item.reorder_level;
                  const itemValuation = item.qty * item.unit_value_yer;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      {/* SKU & Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                            {item.sku}
                          </span>
                          {getCategoryBadge(item.category)}
                        </div>
                        <p className="font-black text-slate-900 dark:text-white mt-1 text-xs">
                          {isRtl ? item.name_ar : item.name_en}
                        </p>
                        {item.donor_ref && (
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            {item.donor_ref}
                          </span>
                        )}
                      </td>

                      {/* Branch & Warehouse */}
                      <td className="p-3.5 font-medium">
                        <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-zinc-100">
                          <Warehouse className="w-3.5 h-3.5 text-amber-500" />
                          <span>{wh ? (isRtl ? wh.name_ar : wh.name_en) : 'المستودع الرئيسي'}</span>
                        </div>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block mt-0.5">
                          {br ? (isRtl ? br.name_ar : br.name_en) : ''}
                        </span>
                      </td>

                      {/* Batch & Expiry */}
                      <td className="p-3.5 text-center font-mono text-[10px]">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 block">{item.batch_no}</span>
                        <span className="text-slate-400">{isRtl ? 'انتهاء:' : 'Exp:'} {item.expiry_date}</span>
                      </td>

                      {/* Available Qty */}
                      <td className="p-3.5 text-center">
                        <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {item.qty.toLocaleString()} <span className="text-xs text-slate-500 font-sans">{isRtl ? item.unit_ar : item.unit_en}</span>
                        </div>
                        {isCritical ? (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded text-[9px] font-extrabold animate-pulse">
                            {isRtl ? 'تحت حد إعادة الطلب!' : 'Reorder Needed!'}
                          </span>
                        ) : (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold">
                            {isRtl ? 'رصيد كافٍ' : 'Sufficient'}
                          </span>
                        )}
                      </td>

                      {/* Reorder Level */}
                      <td className="p-3.5 text-center font-mono font-bold text-slate-500">
                        {item.reorder_level.toLocaleString()} {isRtl ? item.unit_ar : item.unit_en}
                      </td>

                      {/* Valuation */}
                      <td className="p-3.5 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">
                        {itemValuation.toLocaleString()} <span className="text-[10px]">YER</span>
                      </td>

                      {/* Quick Movement & Transfer Action */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              const otherWh = warehouses.find(w => w.id !== item.warehouse_id);
                              setMovementForm({
                                itemId: item.id,
                                sourceWarehouseId: item.warehouse_id,
                                targetWarehouseId: otherWh?.id || '',
                                type: 'TRANSFER',
                                qty: '50',
                                recipientOrDonor: '',
                                refNo: '',
                                waybillNo: `TR-WAY-2026-${Math.floor(10 + Math.random() * 90)}`,
                                driverName: '',
                                vehiclePlate: '',
                                notes: ''
                              });
                              setIsMovementModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 border border-purple-500/20 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1"
                            title={isRtl ? 'تحويل عيني لمستودع آخر' : 'In-Kind Transfer'}
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>{isRtl ? 'تحويل' : 'Transfer'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setMovementForm({
                                itemId: item.id,
                                sourceWarehouseId: item.warehouse_id,
                                targetWarehouseId: '',
                                type: 'DISBURSE',
                                qty: '50',
                                recipientOrDonor: '',
                                refNo: '',
                                waybillNo: '',
                                driverName: '',
                                vehiclePlate: '',
                                notes: ''
                              });
                              setIsMovementModalOpen(true);
                            }}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            {isRtl ? 'صرف' : 'Disburse'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== 6. STOCK MOVEMENTS & TRANSFER AUDIT LOG ==================== */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {isRtl ? 'سجل حركات وسندات التحويل العيني والتوريد والصرف' : 'In-Kind Stock Movement & Transfer Audit Trail'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isRtl ? 'توثيق لحظي وسندات بوائلص النقل العيني والتحويل بين فروع ومخازن الجمعية' : 'Full history of inbound GRN, outbound vouchers, and inter-warehouse transfer waybills.'}
              </p>
            </div>
          </div>

          {/* Movement Type Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setMovementTypeFilter('all')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${movementTypeFilter === 'all' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
            >
              {isRtl ? 'جميع الحركات' : 'All Logs'}
            </button>
            <button
              onClick={() => setMovementTypeFilter('TRANSFER')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${movementTypeFilter === 'TRANSFER' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500'}`}
            >
              <Truck className="w-3 h-3" />
              <span>{isRtl ? 'التحويل العيني' : 'Transfers'}</span>
            </button>
            <button
              onClick={() => setMovementTypeFilter('RECEIVE')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${movementTypeFilter === 'RECEIVE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'}`}
            >
              {isRtl ? 'التوريد (GRN)' : 'Inbound'}
            </button>
            <button
              onClick={() => setMovementTypeFilter('DISBURSE')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${movementTypeFilter === 'DISBURSE' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500'}`}
            >
              {isRtl ? 'الصرف الميداني' : 'Outbound'}
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-black text-[10px] uppercase border-b border-slate-200 dark:border-zinc-700">
                <th className="p-3 rounded-s">{isRtl ? 'رقم السند والتاريخ' : 'Ref No & Date'}</th>
                <th className="p-3">{isRtl ? 'المادة الإغاثية' : 'Relief Item'}</th>
                <th className="p-3 text-center">{isRtl ? 'نوع الحركة' : 'Type'}</th>
                <th className="p-3 text-center">{isRtl ? 'الكمية' : 'Qty'}</th>
                <th className="p-3">{isRtl ? 'مسار الحركة / المستودعات' : 'Movement Route / Warehouses'}</th>
                <th className="p-3">{isRtl ? 'تفاصيل النقل والجهة' : 'Transport & Entity'}</th>
                <th className="p-3 rounded-e">{isRtl ? 'الاعتماد والملاحظات' : 'Authorization'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-600 dark:text-zinc-300 font-medium">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    {isRtl ? 'لا توجد حركات مخزنية مسجلة تطابق التصفية.' : 'No movements logged under this filter.'}
                  </td>
                </tr>
              ) : (
                filteredMovements.map(sm => (
                  <tr key={sm.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                    <td className="p-3 font-mono">
                      <span className="font-black text-slate-900 dark:text-white block">{sm.refNo}</span>
                      <span className="text-[10px] text-slate-400">{sm.date} - {sm.time}</span>
                      {sm.waybillNo && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-300 rounded font-mono text-[9px] font-bold">
                          {sm.waybillNo}
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-black text-slate-900 dark:text-white">
                      {isRtl ? sm.itemNameAr : sm.itemNameEn}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black border ${
                        sm.type === 'TRANSFER'
                          ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                          : sm.type === 'RECEIVE'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        {sm.type === 'TRANSFER' 
                          ? (isRtl ? 'تحويل عيني (Transfer)' : 'In-Kind Transfer') 
                          : sm.type === 'RECEIVE' 
                          ? (isRtl ? 'توريد وارد (GRN)' : 'Inbound') 
                          : (isRtl ? 'صرف صادر (Outbound)' : 'Outbound')}
                      </span>
                    </td>

                    <td className="p-3 text-center font-mono font-black text-sm text-slate-900 dark:text-white">
                      {sm.qty.toLocaleString()} {sm.unitAr}
                    </td>

                    {/* Route Details */}
                    <td className="p-3">
                      {sm.type === 'TRANSFER' ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                            <span>{sm.warehouseNameAr}</span>
                            <ArrowRight className="w-3 h-3 text-purple-500 dir-rtl:rotate-180" />
                            <span className="text-purple-700 dark:text-purple-300">{sm.targetWarehouseNameAr || 'مستودع الوجهة'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {sm.branchNameAr || 'الفرع المصدر'} ➔ {sm.targetBranchNameAr || 'الفرع المستهدف'}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-800 dark:text-zinc-200">
                            {isRtl ? sm.warehouseNameAr : sm.warehouseNameEn}
                          </div>
                          <span className="text-[10px] text-slate-400 block">{sm.branchNameAr}</span>
                        </div>
                      )}
                    </td>

                    {/* Transport & Entity */}
                    <td className="p-3 text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-zinc-200 block">
                        {sm.recipientOrDonor}
                      </span>
                      {(sm.driverName || sm.vehiclePlate) && (
                        <div className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                          <Truck className="w-3 h-3 shrink-0" />
                          <span>{sm.driverName || 'سائق معتمد'} ({sm.vehiclePlate || 'مركبة نقل'})</span>
                        </div>
                      )}
                    </td>

                    {/* Authorization & Notes */}
                    <td className="p-3 text-[11px]">
                      <p className="text-slate-700 dark:text-zinc-300">{sm.notes}</p>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                        {isRtl ? `المعتمد: ${sm.authorizedBy}` : `Auth: ${sm.authorizedBy}`}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* ==================== 1.10 PROCUREMENT & REORDER WORKFLOW TAB ==================== */}
      {activeViewTab === 'procurement' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-zinc-900 text-white p-6 rounded-2xl shadow-xl border border-amber-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-amber-300" />
                <h3 className="text-lg font-black">{isRtl ? 'سير عمل طلبات الشراء التلقائية وإعادة التمويل (Automated Procurement & Reorder Pipeline)' : 'Automated Procurement & Reorder Pipeline'}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-zinc-950">
                  {isRtl ? 'إعادة التمويل والشراء' : 'Automated Reorder'}
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-1 max-w-2xl leading-relaxed">
                {isRtl 
                  ? 'ربط مباشر ومحمي بين مستويات المخزون الحرجة ومركز حوكمة الموافقات (Approval Workflow). يتم توليد مسودات الشراء تلقائياً عند انخفاض الكميات عن الحد الأدنى (Reorder Point).' 
                  : 'End-to-end integration linking critical stock levels to Approval Workflow. Purchase draft POs are generated automatically when stock drops below reorder points.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleGenerateAllProcurementRequisitions}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isRtl ? 'توليد كافة مسودات الشراء الآن' : 'Batch Generate PO Drafts'}</span>
              </button>
            </div>
          </div>

          {procurementSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{procurementSuccessMsg}</span>
            </div>
          )}

          {/* Top KPI Cards for Procurement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl">
              <span className="text-[10px] text-zinc-400 font-bold block">{isRtl ? 'أصناف تحت حد الطلب' : 'Low Stock Items'}</span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-2xl font-black text-rose-600 font-mono">
                  {items.filter(i => i.qty <= i.reorder_level).length}
                </span>
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl">
              <span className="text-[10px] text-zinc-400 font-bold block">{isRtl ? 'طلبات الشراء المعلقة' : 'Pending Requisitions'}</span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-2xl font-black text-amber-600 font-mono">
                  {procurementRequests.filter(r => (r.status || '').toLowerCase() === 'pending').length}
                </span>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl">
              <span className="text-[10px] text-zinc-400 font-bold block">{isRtl ? 'طلبات الشراء المعتمدة' : 'Approved Requisitions'}</span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {procurementRequests.filter(r => (r.status || '').toLowerCase() === 'approved').length}
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl">
              <span className="text-[10px] text-zinc-400 font-bold block">{isRtl ? 'ميزانية الشراء التقديرية' : 'Estimated Budget Needed'}</span>
              <div className="flex justify-between items-center mt-1">
                <div>
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono block">
                    {items.filter(i => i.qty <= i.reorder_level).reduce((acc, i) => acc + (Math.max((i.reorder_level * 2) - i.qty, i.reorder_level) * (i.unit_value_yer || 25000)), 0).toLocaleString()} YER
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono font-medium">
                    (≈ ${Math.round(items.filter(i => i.qty <= i.reorder_level).reduce((acc, i) => acc + (Math.max((i.reorder_level * 2) - i.qty, i.reorder_level) * (i.unit_value_yer || 25000)), 0) / 1620).toLocaleString()} USD)
                  </span>
                </div>
                <Coins className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Critical Items & Auto Requisition Generator Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>{isRtl ? 'سجل المواد الحرجة وحالة طلب الشراء (Low Stock Auto Reorder Matrix)' : 'Low Stock Auto Reorder Matrix'}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {isRtl ? 'المواد التي بلغت رصيد الخطر وتحتاج إلى توليد مسودة طلب شراء آلي فوراً.' : 'SKUs below safety reorder threshold with live approval workflow links.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-zinc-800/50">
                    <th className="p-3">{isRtl ? 'المادة الإغاثية / SKU' : 'Item / SKU'}</th>
                    <th className="p-3 text-center">{isRtl ? 'المستودع' : 'Depot'}</th>
                    <th className="p-3 text-center">{isRtl ? 'الرصيد الحالي' : 'Stock'}</th>
                    <th className="p-3 text-center">{isRtl ? 'حد الطلب' : 'Reorder Pt'}</th>
                    <th className="p-3 text-center">{isRtl ? 'الكمية المقترحة' : 'Suggested Qty'}</th>
                    <th className="p-3 text-center">{isRtl ? 'التكلفة التقديرية' : 'Est. Total'}</th>
                    <th className="p-3 text-center">{isRtl ? 'حالة سير الشراء' : 'PO Workflow Status'}</th>
                    <th className="p-3 text-center">{isRtl ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {items.filter(i => i.qty <= i.reorder_level).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <span>{isRtl ? 'لا توجد أي أصناف متأثرة بالعجز المخزني حالياً.' : 'No stock deficits detected.'}</span>
                      </td>
                    </tr>
                  ) : (
                    items.filter(i => i.qty <= i.reorder_level).map(item => {
                      const suggestedQty = Math.max((item.reorder_level * 2) - item.qty, item.reorder_level);
                      const unitCostYer = item.unit_value_yer || 25000;
                      const estimatedCost = Math.round(suggestedQty * unitCostYer);
                      const wh = warehouses.find(w => w.id === item.warehouse_id);

                      const req = procurementRequests.find((r: any) => r.entity_id === item.id);
                      const isPending = req && (req.status || '').toLowerCase() === 'pending';
                      const isApproved = req && (req.status || '').toLowerCase() === 'approved';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div>{isRtl ? item.name_ar : item.name_en}</div>
                            <span className="font-mono text-[10px] text-zinc-400">{item.sku}</span>
                          </td>
                          <td className="p-3 text-center text-slate-600 dark:text-zinc-300">
                            {wh ? (isRtl ? wh.name_ar : wh.name_en) : 'المخزن الرئيسي'}
                          </td>
                          <td className="p-3 text-center font-mono font-black text-rose-600">
                            {item.qty.toLocaleString()} {item.unit_ar}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500">
                            {item.reorder_level.toLocaleString()} {item.unit_ar}
                          </td>
                          <td className="p-3 text-center font-mono font-black text-amber-600">
                            {suggestedQty.toLocaleString()} {item.unit_ar}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-600">
                            {estimatedCost.toLocaleString()} YER
                          </td>
                          <td className="p-3 text-center">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <Clock className="w-3 h-3 animate-spin" />
                                <span>{isRtl ? 'مسودة قيد المراجعة' : 'Pending Audit'}</span>
                              </span>
                            ) : isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isRtl ? 'معتمد ومجهز للتوريد' : 'Approved PO'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500">
                                <span>{isRtl ? 'لم يتم إنشاء مسودة' : 'No Draft Yet'}</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {!req ? (
                              <button
                                onClick={() => triggerProcurementRequisition(item, false)}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10.5px] font-black rounded-lg shadow-xs transition flex items-center gap-1 mx-auto cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>{isRtl ? 'إنشاء مسودة طلب شراء' : 'Create PO Draft'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400">
                                REQ-PROC-{req.id.slice(0, 6)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==================== WBS MATERIAL ISSUE REQUESTS PIPELINE ==================== */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <span>{isRtl ? 'سجل سير عمل طلبات صرف المواد للمشاريع (WBS Material Issue Requests Workflow)' : 'WBS Material Issue Requests Workflow'}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {isRtl ? 'صرف المواد والمستلزمات الإغاثية بناءً على خطة WBS مع الفحص التلقائي لميزانية وسقف المشروع.' : 'Automated material issuance to project WBS activities with live budget authority check.'}
                </p>
              </div>

              <button
                onClick={() => setIsMaterialIssueModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'تقديم طلب صرف مادة لمشروع جديد' : 'New WBS Issue Request'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-zinc-800/50">
                    <th className="p-3">{isRtl ? 'رمز الطلب / التاريخ' : 'Request Code / Date'}</th>
                    <th className="p-3">{isRtl ? 'المشروع المستهدف' : 'Project'}</th>
                    <th className="p-3">{isRtl ? 'نشاط خطة WBS' : 'WBS Activity'}</th>
                    <th className="p-3 text-center">{isRtl ? 'المادة والكمية' : 'Item & Quantity'}</th>
                    <th className="p-3 text-center">{isRtl ? 'التكلفة الإجمالية' : 'Total Cost'}</th>
                    <th className="p-3 text-center">{isRtl ? 'فحص الميزانية' : 'Budget Audit'}</th>
                    <th className="p-3 text-center">{isRtl ? 'حالة الاعتماد' : 'Status'}</th>
                    <th className="p-3 text-center">{isRtl ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {(() => {
                    const materialRequests = procurementRequests.filter((r: any) => 
                      r.entity_type === 'material_issue_request' || r.approval_type === 'material_issue'
                    );

                    if (materialRequests.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <span>{isRtl ? 'لم يتم تقديم أي طلبات صرف مواد للمشاريع بعد.' : 'No WBS material issue requests registered.'}</span>
                          </td>
                        </tr>
                      );
                    }

                    return materialRequests.map((req: any) => {
                      const newVal = typeof req.new_value === 'string' ? JSON.parse(req.new_value) : (req.new_value || {});
                      const meta = typeof req.metadata === 'string' ? JSON.parse(req.metadata) : (req.metadata || {});

                      const projName = newVal.project_name_ar || meta.project_name_ar || 'المشروع الميداني';
                      const projCode = newVal.project_code || meta.project_code || 'PRJ-2026';
                      const wbsName = newVal.wbs_activity_name || meta.wbs_activity_name || 'نشاط WBS';
                      const itemName = newVal.item_name_ar || meta.item_name_ar || 'المادة الإغاثية';
                      const reqQty = newVal.requested_qty ?? meta.requested_qty ?? 0;
                      const unitAr = newVal.unit_ar || 'وحدة';
                      const totalCostYer = newVal.total_cost_yer ?? meta.total_cost_yer ?? 0;
                      const budgetStatus = newVal.budget_check_status || meta.budget_check_status || 'PASSED_WITHIN_BUDGET';
                      const isPending = (req.status || '').toLowerCase() === 'pending';
                      const isApproved = (req.status || '').toLowerCase() === 'approved';

                      return (
                        <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                            <div>REQ-MAT-{req.id.slice(0, 6)}</div>
                            <span className="text-[10px] text-zinc-400 font-normal">
                              {new Date(req.created_at || req.requested_at).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                            </span>
                          </td>

                          <td className="p-3 font-bold text-slate-800 dark:text-zinc-200">
                            <div>{projName}</div>
                            <span className="text-[10px] font-mono text-emerald-600 block">{projCode}</span>
                          </td>

                          <td className="p-3 font-bold text-amber-600 dark:text-amber-400 text-xs">
                            {wbsName}
                          </td>

                          <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                            <div>{itemName}</div>
                            <span className="font-mono text-purple-600 font-black text-xs block">
                              {reqQty.toLocaleString()} {unitAr}
                            </span>
                          </td>

                          <td className="p-3 text-center font-mono font-bold text-emerald-600">
                            {totalCostYer.toLocaleString()} YER
                          </td>

                          <td className="p-3 text-center">
                            {budgetStatus === 'PASSED_WITHIN_BUDGET' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                ✓ {isRtl ? 'ضمن السقف' : 'In Budget'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                                ⚠️ {isRtl ? 'تجاوز السقف' : 'Over Budget'}
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <Clock className="w-3 h-3 animate-spin" />
                                <span>{isRtl ? 'بانتظار الاعتماد' : 'Pending'}</span>
                              </span>
                            ) : isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isRtl ? 'تم الاعتماد والصرف' : 'Disbursed'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30">
                                <span>{isRtl ? 'مرفوض' : 'Rejected'}</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            {isPending && (
                              <button
                                onClick={() => handleApproveAndDisburseMaterialIssueRequest(req)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-black rounded-lg shadow-xs transition flex items-center gap-1 mx-auto cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>{isRtl ? 'اعتماد وصرف مباشر' : 'Approve & Disburse'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: STOCK MOVEMENT / IN-KIND TRANSFER MODAL ==================== */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {movementForm.type === 'TRANSFER' 
                    ? (isRtl ? 'إصدار أمر وبوليصة تحويل عيني بين المخازن' : 'Issue In-Kind Transfer Order') 
                    : (isRtl ? 'إصدار إذن حركة مخزنية (توريد / صرف)' : 'Issue Stock Movement Voucher')}
                </h3>
              </div>
              <button onClick={() => setIsMovementModalOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-700 dark:text-zinc-300">
              {/* Type Selection Tabs */}
              <div>
                <label className="block text-[10px] font-black uppercase mb-1.5 text-slate-500">{isRtl ? 'نوع الحركة المخزنية' : 'Movement Type'}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementForm(prev => ({ ...prev, type: 'TRANSFER' }))}
                    className={`py-2 px-2 rounded-xl font-black text-[11px] transition border flex items-center justify-center gap-1 cursor-pointer ${
                      movementForm.type === 'TRANSFER' 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تحويل عيني' : 'Transfer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovementForm(prev => ({ ...prev, type: 'RECEIVE' }))}
                    className={`py-2 px-2 rounded-xl font-black text-[11px] transition border flex items-center justify-center gap-1 cursor-pointer ${
                      movementForm.type === 'RECEIVE' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'توريد وارد' : 'Inbound'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovementForm(prev => ({ ...prev, type: 'DISBURSE' }))}
                    className={`py-2 px-2 rounded-xl font-black text-[11px] transition border flex items-center justify-center gap-1 cursor-pointer ${
                      movementForm.type === 'DISBURSE' 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'صرف صادر' : 'Outbound'}</span>
                  </button>
                </div>
              </div>

              {/* Item Selection */}
              <div>
                <label className="block text-[10px] font-black uppercase mb-1 text-slate-500">{isRtl ? 'المادة الإغاثية المستهدفة' : 'Relief SKU'}</label>
                <select
                  required
                  value={movementForm.itemId}
                  onChange={(e) => {
                    const selected = items.find(i => i.id === e.target.value);
                    setMovementForm(prev => ({
                      ...prev,
                      itemId: e.target.value,
                      sourceWarehouseId: selected?.warehouse_id || prev.sourceWarehouseId
                    }));
                  }}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="">{isRtl ? '-- اختر المادة الإغاثية --' : '-- Select Item --'}</option>
                  {items.map(i => {
                    const itemWh = warehouses.find(w => w.id === i.warehouse_id);
                    return (
                      <option key={i.id} value={i.id}>
                        {isRtl ? i.name_ar : i.name_en} ({isRtl ? `الرصيد: ${i.qty}` : `Qty: ${i.qty}`}) - [{itemWh?.name_ar}]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Source & Target Warehouses for Transfer */}
              {movementForm.type === 'TRANSFER' ? (
                <div className="grid grid-cols-2 gap-3 bg-purple-500/5 p-3 rounded-xl border border-purple-500/20">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1 text-purple-700 dark:text-purple-300">
                      {isRtl ? 'المستودع المصدر (من)' : 'Source Warehouse (From)'}
                    </label>
                    <select
                      required
                      value={movementForm.sourceWarehouseId}
                      onChange={(e) => setMovementForm(prev => ({ ...prev, sourceWarehouseId: e.target.value }))}
                      className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{isRtl ? w.name_ar : w.name_en}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1 text-purple-700 dark:text-purple-300">
                      {isRtl ? 'المستودع المستهدف (إلى)' : 'Target Warehouse (To)'}
                    </label>
                    <select
                      required
                      value={movementForm.targetWarehouseId}
                      onChange={(e) => setMovementForm(prev => ({ ...prev, targetWarehouseId: e.target.value }))}
                      className="w-full bg-white dark:bg-zinc-950 border border-purple-300 dark:border-purple-800 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="">{isRtl ? '-- اختر مستودع الوجهة --' : '-- Select Destination --'}</option>
                      {warehouses.filter(w => w.id !== movementForm.sourceWarehouseId).map(w => (
                        <option key={w.id} value={w.id}>{isRtl ? w.name_ar : w.name_en}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1 text-slate-500">{isRtl ? 'المستودع المعني' : 'Warehouse'}</label>
                  <select
                    required
                    value={movementForm.sourceWarehouseId}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, sourceWarehouseId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{isRtl ? w.name_ar : w.name_en}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity & Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1 text-slate-500">{isRtl ? 'الكمية المحولة / المطلوبة' : 'Quantity'}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={movementForm.qty}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, qty: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-mono text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1 text-slate-500">{isRtl ? 'رقم السند / الأمر' : 'Ref / Order No'}</label>
                  <input
                    type="text"
                    placeholder="مثال: TRF-2026-088"
                    value={movementForm.refNo}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, refNo: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Transport Details for Transfer */}
              {movementForm.type === 'TRANSFER' && (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'رقم بوليصة النقل' : 'Waybill No'}</label>
                    <input
                      type="text"
                      placeholder="TR-WAY-09"
                      value={movementForm.waybillNo}
                      onChange={(e) => setMovementForm(prev => ({ ...prev, waybillNo: e.target.value }))}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-1.5 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'اسم السائق / الناقل' : 'Driver Name'}</label>
                    <input
                      type="text"
                      placeholder="منصور العولقي"
                      value={movementForm.driverName}
                      onChange={(e) => setMovementForm(prev => ({ ...prev, driverName: e.target.value }))}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-1.5 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'لوحة الشاحنة' : 'Vehicle Plate'}</label>
                    <input
                      type="text"
                      placeholder="55214-ص"
                      value={movementForm.vehiclePlate}
                      onChange={(e) => setMovementForm(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-1.5 text-[11px]"
                    />
                  </div>
                </div>
              )}

              {/* Entity / Beneficiary / Donor */}
              <div>
                <label className="block text-[10px] font-black uppercase mb-1 text-slate-500">
                  {movementForm.type === 'TRANSFER' 
                    ? (isRtl ? 'الجهة المستلمة / الفرع' : 'Receiving Entity / Branch')
                    : movementForm.type === 'RECEIVE' 
                    ? (isRtl ? 'الجهة الموردة / المانح' : 'Donor / Supplier') 
                    : (isRtl ? 'الجهة المستلمة / موقع التوزيع' : 'Recipient / Field Location')}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? 'مثال: فرع الساحل الغربي / مخيم الخوخة للنازحين' : 'e.g. West Coast Branch / Khawkhah IDP Camp'}
                  value={movementForm.recipientOrDonor}
                  onChange={(e) => setMovementForm(prev => ({ ...prev, recipientOrDonor: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-black uppercase mb-1 text-slate-500">{isRtl ? 'الملاحظات وبيان الحركة' : 'Notes & Remarks'}</label>
                <textarea
                  rows={2}
                  placeholder={isRtl ? 'أدخل تفاصيل التوجيه أو سياق عملية النقل والتحويل...' : 'Enter transfer authorization context or project details...'}
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  movementForm.type === 'TRANSFER' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {movementForm.type === 'TRANSFER' 
                    ? (isRtl ? 'اعتماد وإصدار بوليصة التحويل العيني' : 'Approve & Issue Transfer Slip') 
                    : (isRtl ? 'اعتماد وحفظ السند المخزني' : 'Approve & Post Movement')}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: NEW ITEM MODAL ==================== */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {isRtl ? 'تسجيل مادة أو سلعة إغاثية جديدة في المخزن' : 'Register New Relief Inventory SKU'}
                </h3>
              </div>
              <button onClick={() => setIsNewItemModalOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleNewItemSubmit} className="p-6 space-y-3.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'رمز SKU (اختياري)' : 'SKU Code'}</label>
                  <input
                    type="text"
                    placeholder="SKU-FOOD-2026"
                    value={newItemForm.sku}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'القطاع الإغاثي' : 'Category Sector'}</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="FOOD_AID">{isRtl ? 'الأمن الغذائي والإغاثة' : 'Food Aid'}</option>
                    <option value="NUTRITION">{isRtl ? 'التغذية والأمهات' : 'Nutrition'}</option>
                    <option value="SHELTER">{isRtl ? 'الإيواء والمواد غير الغذائية' : 'Shelter'}</option>
                    <option value="MEDICAL">{isRtl ? 'المستلزمات والأدوية الطبية' : 'Medical'}</option>
                    <option value="WASH">{isRtl ? 'المياه والإزميل الصحي WASH' : 'WASH'}</option>
                    <option value="EDUCATION">{isRtl ? 'التعليم والتجهيزات' : 'Education'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'اسم المادة العينية (عربي)' : 'Item Name (Arabic)'}</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تمر فاخر مغلف - كرتون 10كجم"
                  value={newItemForm.nameAr}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, nameAr: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'الكمية الافتتاحية' : 'Initial Qty'}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newItemForm.qty}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, qty: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'وحدة القياس' : 'Unit'}</label>
                  <input
                    type="text"
                    required
                    placeholder="سلة / كرتون"
                    value={newItemForm.unitAr}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, unitAr: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'حد إعادة الطلب' : 'Reorder Level'}</label>
                  <input
                    type="number"
                    required
                    value={newItemForm.reorderLevel}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, reorderLevel: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 font-mono text-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'مستودع التخزين' : 'Warehouse Location'}</label>
                  <select
                    value={newItemForm.warehouseId}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-slate-900 dark:text-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{isRtl ? w.name_ar : w.name_en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'قيمة الوحدة (YER)' : 'Unit Price (YER)'}</label>
                  <input
                    type="number"
                    required
                    value={newItemForm.unitValueYer}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, unitValueYer: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 font-mono text-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? 'تسجيل المادة في سجل الأرصدة' : 'Save & Register SKU'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: NEW WAREHOUSE MODAL ==================== */}
      {isNewWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {isRtl ? 'ترخيص وتسجيل مستودع ميداني جديد' : 'Register Field Warehouse'}
                </h3>
              </div>
              <button onClick={() => setIsNewWarehouseModalOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleNewWarehouseSubmit} className="p-6 space-y-3.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'الفرع التابع له المستودع' : 'Parent Branch'}</label>
                <select
                  value={newWarehouseForm.branchId}
                  onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, branchId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{isRtl ? b.name_ar : b.name_en} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'اسم المستودع (عربي)' : 'Warehouse Name (Arabic)'}</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مستودع الجوف اللوجستي الإغاثي"
                  value={newWarehouseForm.nameAr}
                  onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, nameAr: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'الموقع والمحافظة' : 'Location'}</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الجوف - مدينة الحزم"
                  value={newWarehouseForm.locationAr}
                  onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, locationAr: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'اسم أمين المستودع' : 'Depot Keeper'}</label>
                  <input
                    type="text"
                    required
                    placeholder="أ. حسن الشميري"
                    value={newWarehouseForm.managerName}
                    onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, managerName: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'السعة اللوجستية (m³)' : 'Capacity'}</label>
                  <input
                    type="text"
                    required
                    value={newWarehouseForm.capacity}
                    onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isRtl ? 'اعتماد المستودع وترخيصه' : 'Register & Enable Depot'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: NEW BRANCH MODAL ==================== */}
      {isNewBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-purple-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {isRtl ? 'تسجيل فرع إقليمي جديد للجمعية' : 'Register New Regional Branch'}
                </h3>
              </div>
              <button onClick={() => setIsNewBranchModalOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleNewBranchSubmit} className="p-6 space-y-3.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'رمز الفرع' : 'Branch Code'}</label>
                  <input
                    type="text"
                    required
                    value={newBranchForm.code}
                    onChange={(e) => setNewBranchForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-mono text-purple-600 dark:text-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'الإقليم / المنطقة' : 'Region'}</label>
                  <input
                    type="text"
                    required
                    placeholder="إقليم شبوة"
                    value={newBranchForm.regionAr}
                    onChange={(e) => setNewBranchForm(prev => ({ ...prev, regionAr: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'اسم الفرع (عربي)' : 'Branch Name (Arabic)'}</label>
                <input
                  type="text"
                  required
                  placeholder="فرع شبوة وعتق"
                  value={newBranchForm.nameAr}
                  onChange={(e) => setNewBranchForm(prev => ({ ...prev, nameAr: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{isRtl ? 'مدير الفرع' : 'Branch Manager'}</label>
                <input
                  type="text"
                  required
                  placeholder="أ. منصور العولقي"
                  value={newBranchForm.managerName}
                  onChange={(e) => setNewBranchForm(prev => ({ ...prev, managerName: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? 'إشهار الفرع واعتماده' : 'Register Branch'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 5: NEW WBS MATERIAL ISSUE REQUEST ==================== */}
      {isMaterialIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-extrabold text-sm">
                    {isRtl ? 'طلب صرف مواد لمشروع ومطابقة WBS' : 'Project Material Issue Request'}
                  </h3>
                  <span className="text-[10px] text-emerald-200 block">
                    {isRtl ? 'فحص تلقائي للسقف المالي والكميات المتاحة قبل الصرف' : 'Automated budget authority check & inventory verification'}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsMaterialIssueModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full cursor-pointer text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterialIssueRequest} className="p-6 space-y-4 text-xs font-bold text-right" dir={isRtl ? 'rtl' : 'ltr'}>
              {/* Select Project & WBS Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                    🎯 {isRtl ? 'المشروع المستهدف' : 'Target Project'}
                  </label>
                  <select
                    value={materialIssueForm.projectId}
                    onChange={(e) => {
                      const projId = e.target.value;
                      const activities = DEFAULT_WBS_ACTIVITIES[projId] || [];
                      setMaterialIssueForm(prev => ({
                        ...prev,
                        projectId: projId,
                        wbsActivityId: activities[0]?.id || ''
                      }));
                    }}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {DEFAULT_PROJECTS_LIST.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 mb-1">
                    ⚡ {isRtl ? 'نشاط خطة WBS' : 'WBS Activity'}
                  </label>
                  <select
                    value={materialIssueForm.wbsActivityId}
                    onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, wbsActivityId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-emerald-500"
                  >
                    {(DEFAULT_WBS_ACTIVITIES[materialIssueForm.projectId] || []).map(act => (
                      <option key={act.id} value={act.id}>
                        {act.code} - {act.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source Warehouse & Relief Item */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                    🏬 {isRtl ? 'المستودع المصدر' : 'Source Depot'}
                  </label>
                  <select
                    value={materialIssueForm.warehouseId}
                    onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                    📦 {isRtl ? 'المادة المطلوبة للصرف' : 'Relief Item'}
                  </label>
                  <select
                    value={materialIssueForm.itemId}
                    onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, itemId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {items.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name_ar} (المتوفر: {i.qty} {i.unit_ar})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity & Requester Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                    🔢 {isRtl ? 'الكمية المطلوبة' : 'Requested Quantity'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={materialIssueForm.requestedQty}
                    onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, requestedQty: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-mono font-black text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                    👤 {isRtl ? 'صفة مقدم الطلب' : 'Requester Role'}
                  </label>
                  <select
                    value={materialIssueForm.requesterRole}
                    onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, requesterRole: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Project Officer">منسق / أخصائي المشروع الميداني</option>
                    <option value="Project Manager">مدير المشروع</option>
                    <option value="Logistics Manager">مدير العمليات واللوجستيات</option>
                    <option value="Storekeeper">أمين المستودع</option>
                  </select>
                </div>
              </div>

              {/* Justification & Notes */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                  📝 {isRtl ? 'مبررات الصرف وملاحظات التنفيذ الميداني' : 'Justification & Notes'}
                </label>
                <textarea
                  rows={2}
                  value={materialIssueForm.notes}
                  onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder={isRtl ? 'ادخل تفاصيل الاحتياج الميداني والمخيمات المستهدفة...' : 'Enter field deployment details...'}
                />
              </div>

              <button
                type="submit"
                disabled={materialIssueSubmitting}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? 'رفع طلب الصرف وسلسلة الاعتمادات' : 'Submit Material Issue Request'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 5: LOG MAINTENANCE & ASSET CONDITION MODAL ==================== */}
      {isMaintenanceModalOpen && selectedAssetForMaintenance && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-sm">
                    {isRtl ? 'تسجيل كارت صيانة وتحديث حالة الأصل العيني' : 'Log Asset Maintenance & Condition'}
                  </h3>
                  <p className="text-[10px] text-slate-300 font-mono">
                    {selectedAssetForMaintenance.sku} - {selectedAssetForMaintenance.name_ar}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="p-1 hover:bg-slate-800 rounded-full cursor-pointer text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMaintenanceSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-700 dark:text-zinc-300">
              
              {/* Asset Condition & Serial No */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {isRtl ? 'الحالة الفنية التشغيلية للأصل' : 'Operational Condition'}
                  </label>
                  <select
                    value={maintenanceForm.condition}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, condition: e.target.value as any }))}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="NEW">{isRtl ? '✨ جديد (ممتاز)' : 'Brand New'}</option>
                    <option value="USED_GOOD">{isRtl ? '✅ مستخدم - حالة جيدة' : 'Used - Good'}</option>
                    <option value="UNDER_MAINTENANCE">{isRtl ? '🛠️ قيد الصيانة والترميم' : 'Under Maintenance'}</option>
                    <option value="DAMAGED">{isRtl ? '🚨 تالف / يحتاج إصلاح' : 'Damaged / Needs Repair'}</option>
                    <option value="DISPOSED">{isRtl ? '⬛ مستبعد (تكهين)' : 'Disposed / Scrap'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {isRtl ? 'الرقم التسلسلي (Serial No / VIN)' : 'Serial Number / VIN'}
                  </label>
                  <input
                    type="text"
                    placeholder="SN-VOLT-2026-991"
                    value={maintenanceForm.serialNo}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, serialNo: e.target.value }))}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Maintenance Schedule Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {isRtl ? 'تاريخ الصيانة الأخيرة' : 'Last Maintenance Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={maintenanceForm.lastMaintenanceDate}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, lastMaintenanceDate: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 mb-1">
                    {isRtl ? 'تاريخ الصيانة القادمة المجدولة' : 'Next Scheduled Maintenance'}
                  </label>
                  <input
                    type="date"
                    required
                    value={maintenanceForm.nextMaintenanceDate}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                    className="w-full bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-xl p-2 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Enterprise Integration Links: HR Custody & Accounting IPSAS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 mb-1">
                    👤 {isRtl ? 'الموارد البشرية - أمين العهدة' : 'HR Custodian Officer'}
                  </label>
                  <input
                    type="text"
                    placeholder="أ. عادل ثابت - مسؤول العهدة"
                    value={maintenanceForm.assignedCustodianHr}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, assignedCustodianHr: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                    💰 {isRtl ? 'الحسابات - رمز الدفتر IPSAS' : 'IPSAS Ledger Code'}
                  </label>
                  <input
                    type="text"
                    placeholder="IPSAS-17-FIXED-ASSETS-1204"
                    value={maintenanceForm.accountingLedgerCode}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, accountingLedgerCode: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Project & Procurement PO Links */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 mb-1">
                    🎯 {isRtl ? 'نشاط المشروع المرتبط' : 'Project Activity'}
                  </label>
                  <input
                    type="text"
                    placeholder="PROJ-2026-SHELTER-03"
                    value={maintenanceForm.projectActivityId}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, projectActivityId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 mb-1">
                    📜 {isRtl ? 'أمر الشراء / الضمان PO' : 'Procurement PO Ref'}
                  </label>
                  <input
                    type="text"
                    placeholder="PO-2026-EQUIP-884"
                    value={maintenanceForm.procurementPoRef}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, procurementPoRef: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Maintenance Notes */}
              <div>
                <label className="block text-[10px] font-black uppercase mb-1 text-slate-500">
                  {isRtl ? 'تقرير الفحص وبيان أعمال الصيانة المنفذة' : 'Maintenance Audit Notes & Findings'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isRtl ? 'أدخل تفاصيل تغيير قطع الغيار أو الزيوت أو تقرير الفحص الفني...' : 'Enter technical inspection findings or spare parts replaced...'}
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? 'اعتماد كارت الصيانة وتحديث سجل الأصل' : 'Approve & Post Maintenance Record'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NEW WBS MATERIAL ISSUE REQUEST ==================== */}
      {isMaterialIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-extrabold text-sm">
                    {isRtl ? 'طلب صرف مواد لمشروع ومطابقة WBS' : 'Project Material Issue Request'}
                  </h3>
                  <span className="text-[10px] text-emerald-200 block">
                    {isRtl ? 'فحص تلقائي للسقف المالي والكميات المتاحة قبل الصرف' : 'Automated budget authority check & inventory verification'}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsMaterialIssueModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full cursor-pointer text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterialIssueRequest} className="p-6 space-y-4 text-xs font-bold text-right" dir={isRtl ? 'rtl' : 'ltr'}>
              {/* Select Project & WBS Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                    🎯 {isRtl ? 'المشروع المستهدف' : 'Target Project'}
                  </label>
                  <select
                    value={materialIssueForm.projectId}
                    onChange={(e) => {
                      const projId = e.target.value;
                      const activities = DEFAULT_WBS_ACTIVITIES[projId] || [];
                      setMaterialIssueForm(prev => ({
                        ...prev,
                        projectId: projId,
                        wbsActivityId: activities[0]?.id || ''
                      }));
                    }}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {DEFAULT_PROJECTS_LIST.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 mb-1">
                    ⚡ {isRtl ? 'نشاط خطة WBS' : 'WBS Activity'}
                  </label>
                  <select
                    value={materialIssueForm.wbsActivityId}
                    onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, wbsActivityId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-emerald-500"
                  >
                    {(DEFAULT_WBS_ACTIVITIES[materialIssueForm.projectId] || []).map(act => (
                      <option key={act.id} value={act.id}>
                        {act.code} - {act.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source Warehouse & Relief Item */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                    🏬 {isRtl ? 'المستودع المصدر' : 'Source Depot'}
                  </label>
                  <select
                    value={materialIssueForm.warehouseId}
                    onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                    📦 {isRtl ? 'المادة المطلوبة للصرف' : 'Relief Item'}
                  </label>
                  <select
                    value={materialIssueForm.itemId}
                    onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, itemId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {items.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name_ar} (المتوفر: {i.qty} {i.unit_ar})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity & Requester Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                    🔢 {isRtl ? 'الكمية المطلوبة' : 'Requested Quantity'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={materialIssueForm.requestedQty}
                    onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, requestedQty: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-mono font-black text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                    👤 {isRtl ? 'صفة مقدم الطلب' : 'Requester Role'}
                  </label>
                  <select
                    value={materialIssueForm.requesterRole}
                    onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, requesterRole: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Project Officer">منسق / أخصائي المشروع الميداني</option>
                    <option value="Project Manager">مدير المشروع</option>
                    <option value="Logistics Manager">مدير العمليات واللوجستيات</option>
                    <option value="Storekeeper">أمين المستودع</option>
                  </select>
                </div>
              </div>

              {/* Justification & Notes */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1">
                  📝 {isRtl ? 'مبررات الصرف وملاحظات التنفيذ الميداني' : 'Justification & Notes'}
                </label>
                <textarea
                  rows={2}
                  value={materialIssueForm.notes}
                  onChange={(e) => setMaterialIssueForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder={isRtl ? 'ادخل تفاصيل الاحتياج الميداني والمخيمات المستهدفة...' : 'Enter field deployment details...'}
                />
              </div>

              <button
                type="submit"
                disabled={materialIssueSubmitting}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? 'رفع طلب الصرف وسلسلة الاعتمادات' : 'Submit Material Issue Request'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: MULTI-BENEFICIARY MULTI-SKU INVENTORY DISBURSEMENT ENGINE ==================== */}
      {isMultiDisbursementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-5xl w-full overflow-hidden my-auto animate-in zoom-in-95 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-zinc-900 text-white flex justify-between items-center border-b border-emerald-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <img src="/LogoRohamaab.png" alt="Rohamaab Logo" className="h-10 w-auto object-contain bg-white/10 p-1 rounded-lg backdrop-blur-sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base tracking-tight text-white">
                      {isRtl ? 'محرك الصرف المخزني المتعدد الذكي للمستفيدين' : 'Multi-Beneficiary Multi-SKU Disbursement Engine'}
                    </h3>
                    <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                      {isRtl ? 'إغاثة وصرف مستفيدين' : 'Relief Disbursement'}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-200 font-medium">
                    {isRtl ? 'صرف أكثر من صنف ومادة إغاثية لأكثر من مستفيد في إجراء لوجستي واحد بدقة ومرونة عالية' : 'Batch disburse multiple relief SKUs to multiple beneficiaries with real-time stock validation.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsMultiDisbursementModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full cursor-pointer text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Ribbon */}
            <div className="bg-slate-100 dark:bg-zinc-950 px-6 py-3 border-b border-slate-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                {[
                  { num: 1, label: isRtl ? '1. المستهدفون والمستودع' : '1. Beneficiaries & Depot', icon: Users },
                  { num: 2, label: isRtl ? '2. الأصناف والحزم الإغاثية' : '2. Relief SKUs & Presets', icon: Boxes },
                  { num: 3, label: isRtl ? '3. مصفوفة الصرف والضبط' : '3. Disbursement Matrix', icon: Sliders },
                  { num: 4, label: isRtl ? '4. الاعتماد والكشوفات' : '4. Execution & Manifest', icon: FileCheck }
                ].map((s) => {
                  const IconComp = s.icon;
                  const isActive = multiStep === s.num;
                  const isDone = multiStep > s.num;
                  return (
                    <button
                      key={s.num}
                      onClick={() => setMultiStep(s.num)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        isActive 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105' 
                          : isDone 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                          : 'text-slate-500 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1" dir={isRtl ? 'rtl' : 'ltr'}>
              {/* STEP 1: SCOPE, WAREHOUSE, PLAN TEMPLATES & TARGET BENEFICIARIES SELECTION */}
              {multiStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* Saved Distribution Plan Templates Bar */}
                  <div className="bg-gradient-to-r from-purple-900/10 to-indigo-900/10 border border-purple-500/30 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {isRtl ? 'نماذج وقوالب التوزيع المخزنة مسبقاً (Disbursement Plan Templates):' : 'Saved Disbursement Plan Templates:'}
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                          {isRtl ? 'استرجاع خطة صرف معتمدة بنقرة واحدة لسرعة التنفيذ الميداني' : 'Load pre-configured distribution scope and item bundles.'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          const plan = savedDisbursementPlans.find(p => p.id === e.target.value);
                          if (plan) handleLoadPlanTemplate(plan);
                        }}
                        className="bg-white dark:bg-zinc-900 border border-purple-300 dark:border-purple-800 text-xs font-bold rounded-xl px-3 py-1.5 text-purple-900 dark:text-purple-200 focus:outline-none"
                      >
                        <option value="">-- اختر خطة توزيع مخزنة --</option>
                        {savedDisbursementPlans.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="اسم النموذج للحفظ..."
                          value={planTemplateName}
                          onChange={(e) => setPlanTemplateName(e.target.value)}
                          className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs font-bold rounded-xl px-2.5 py-1.5 w-36 text-slate-900 dark:text-white"
                        />
                        <button
                          onClick={handleSavePlanTemplate}
                          disabled={!planTemplateName.trim()}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition"
                        >
                          حفظ كنموذج
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Warehouse & Project Scope Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 mb-1.5">
                        🏬 {isRtl ? 'المستودع المصدر للصرف' : 'Source Warehouse'}
                      </label>
                      <select
                        value={multiWarehouseId}
                        onChange={(e) => setMultiWarehouseId(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl p-2.5 font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name_ar} (كود: {w.code || w.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 mb-1.5">
                        🎯 {isRtl ? 'المشروع والنشاط الميداني (WBS)' : 'WBS Project Activity'}
                      </label>
                      <select
                        value={multiProjectActivity}
                        onChange={(e) => setMultiProjectActivity(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl p-2.5 font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="PROJ-2026-FOOD-01 / الإغاثة العاجلة والأمن الغذائي">PROJ-2026-FOOD-01 / الإغاثة العاجلة والأمن الغذائي</option>
                        <option value="PROJ-2026-WINTER-04 / مشروع الاستجابة الشتوية والإيواء">PROJ-2026-WINTER-04 / مشروع الاستجابة الشتوية والإيواء</option>
                        <option value="PROJ-2026-HEALTH-02 / التغذية العلاجية والعيادات الميدانية">PROJ-2026-HEALTH-02 / التغذية العلاجية والعيادات الميدانية</option>
                        <option value="PROJ-2026-EDU-09 / دعم حقائب واحتياجات الطالب">PROJ-2026-EDU-09 / دعم حقائب واحتياجات الطالب</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1.5">
                        💳 {isRtl ? 'رمز تمويل المانح (Donor Ref)' : 'Donor Funding Reference'}
                      </label>
                      <select
                        value={donorFundingRef}
                        onChange={(e) => setDonorFundingRef(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl p-2.5 font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="منحة مركز الملك سلمان للإغاثة (KSRELIEF-2026-FOOD)">منحة مركز الملك سلمان للإغاثة (KSRELIEF-2026-FOOD)</option>
                        <option value="صندوق التمويل الإنساني اليمني (YHF-2026-EMERGENCY)">صندوق التمويل الإنساني اليمني (YHF-2026-EMERGENCY)</option>
                        <option value="وقف رُحماء لقطاع الأيتام والرعاية الاجتماعية">وقف رُحماء لقطاع الأيتام والرعاية الاجتماعية</option>
                        <option value="تمويل تبرعات التكافل الاجتماعي المباشر">تمويل تبرعات التكافل الاجتماعي المباشر</option>
                      </select>
                    </div>
                  </div>

                  {/* Beneficiaries Filters & Selection */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Gov Filter */}
                        <select
                          value={multiGovFilter}
                          onChange={(e) => setMultiGovFilter(e.target.value)}
                          className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 dark:text-zinc-300"
                        >
                          <option value="ALL">كل المحافظات</option>
                          <option value="مأرب">مأرب</option>
                          <option value="الحديدية">الحديدة</option>
                          <option value="تعز">تعز</option>
                          <option value="حضرموت">حضرموت</option>
                          <option value="شبوة">شبوة</option>
                          <option value="صعدة">صعدة</option>
                        </select>

                        {/* Category Filter */}
                        <select
                          value={multiCategoryFilter}
                          onChange={(e) => setMultiCategoryFilter(e.target.value)}
                          className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 dark:text-zinc-300"
                        >
                          <option value="ALL">جميع فئات الدعم والاستحقاق</option>
                          <option value="IDP">النازحون والمخيمات (IDP)</option>
                          <option value="POOR_FAMILY">الأسر الأشد فقراً</option>
                          <option value="ORPHAN">الأيتام والطفولة</option>
                          <option value="WIDOW">الأرامل</option>
                          <option value="DISABLED">ذوي الاحتياجات الخاصة</option>
                        </select>

                        {/* Search Input */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="بحث بالاسم، الكود، الهاتف..."
                            value={multiSearchTerm}
                            onChange={(e) => setMultiSearchTerm(e.target.value)}
                            className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-bold rounded-xl pr-8 pl-3 py-2 text-slate-900 dark:text-white w-48 focus:w-60 transition-all focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Live Counter Badge */}
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs rounded-xl border border-emerald-500/20">
                          {selectedBenIds.length} مستفيدين محددين
                        </span>
                      </div>
                    </div>

                    {/* Filtered Beneficiaries List */}
                    {(() => {
                      const filtered = allBeneficiaries.filter(b => {
                        const matchesGov = multiGovFilter === 'ALL' || b.governorate === multiGovFilter;
                        const matchesCat = multiCategoryFilter === 'ALL' || b.category_code === multiCategoryFilter;
                        const matchesSearch = !multiSearchTerm || 
                          (b.full_name_ar || '').toLowerCase().includes(multiSearchTerm.toLowerCase()) ||
                          (b.beneficiary_code || '').toLowerCase().includes(multiSearchTerm.toLowerCase()) ||
                          (b.phone_primary || '').includes(multiSearchTerm);
                        return matchesGov && matchesCat && matchesSearch;
                      });

                      const isAllFilteredSelected = filtered.length > 0 && filtered.every(b => selectedBenIds.includes(b.id));

                      return (
                        <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                          <div className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs font-black">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-zinc-300">
                              <input
                                type="checkbox"
                                checked={isAllFilteredSelected}
                                onChange={() => handleSelectAllFilteredBeneficiaries(filtered)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span>تحديد الكل ({filtered.length} مستفيد معروض)</span>
                            </label>
                            <span className="text-[10px] text-slate-500 font-bold">
                              إجمالي أفراد أسر المحددين: {
                                allBeneficiaries
                                  .filter(b => selectedBenIds.includes(b.id))
                                  .reduce((acc, b) => acc + (Number(b.family_size) || 5), 0)
                              } فرد
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-60 overflow-y-auto text-xs">
                            {filtered.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 font-bold">
                                لا يوجد مستفيدون يطابقون معايير التصفية الحالية.
                              </div>
                            ) : (
                              filtered.map((b) => {
                                const isSelected = selectedBenIds.includes(b.id);
                                return (
                                  <div
                                    key={b.id}
                                    onClick={() => handleToggleBeneficiarySelect(b.id)}
                                    className={`p-3 flex items-center justify-between transition cursor-pointer ${
                                      isSelected ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}} // handled by div click
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-extrabold text-slate-900 dark:text-white">
                                            {b.full_name_ar || b.name_ar}
                                          </h4>
                                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-zinc-400 font-bold">
                                            {b.beneficiary_code || b.id}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                          📍 {b.governorate} - {b.district} | 📞 {b.phone_primary || 'لا يوجد رقم'}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                        {b.category_code === 'IDP' ? 'مخيمات نازحين' : b.category_code === 'ORPHAN' ? 'أيتام' : b.category_code === 'WIDOW' ? 'أرامل' : 'أسر أشد فقراً'}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                        👨‍👩‍👧‍👦 {b.family_size || 5} أفراد
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Step 1 Footer Action */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setMultiStep(2)}
                      disabled={selectedBenIds.length === 0}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>الانتقال لاختيار استراتيجيات الأصناف والحزم الإغاثية ({selectedBenIds.length} مستفيدين)</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: RELIEF SKUS, STRATEGY ENGINE & PRESET KITS SELECTION */}
              {multiStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* Allocation Strategy Engine Selector */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <h4 className="font-black text-xs">محرك اختيار استراتيجية وتوزيع الكميات (Allocation Strategy Engine)</h4>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold">{isRtl ? 'قواعد التوزيع المعيارية' : 'Standard Allocation Rules'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { id: 'SPHERE_FAMILY_SCALE', title: 'معايير اسفير وحجم الأسرة', desc: '1-6: x1 | 7-9: x2 | 10+: x3' },
                        { id: 'EQUAL_FLAT', title: 'توزيع متساوي وموحد', desc: 'حصة متساوية تماماً لجميع الأسر' },
                        { id: 'FINANCIAL_CAP', title: 'التحديد بالسقف المالي', desc: 'سقف محدد بالريال لكل أسرة مستفيدة' },
                        { id: 'VULNERABILITY_PRIORITY', title: 'أولوية الأشد احتياجاً', desc: 'ترتيب الأولوية للأيتام والأسر الكبيرة' }
                      ].map(strat => (
                        <div
                          key={strat.id}
                          onClick={() => {
                            setAllocationStrategy(strat.id as any);
                            const isSphere = strat.id === 'SPHERE_FAMILY_SCALE';
                            setEnableFamilyScaling(isSphere);
                            syncDisbursementMatrix(selectedBenIds, selectedItemIds, defaultItemQtys, isSphere);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition ${
                            allocationStrategy === strat.id 
                              ? 'bg-amber-500/20 border-amber-500 text-white shadow-md' 
                              : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <h5 className="font-extrabold text-xs text-amber-300">{strat.title}</h5>
                          <p className="text-[9.5px] text-zinc-400 mt-1">{strat.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* Financial Cap Input if FINANCIAL_CAP strategy active */}
                    {allocationStrategy === 'FINANCIAL_CAP' && (
                      <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 flex items-center justify-between text-xs">
                        <span className="text-zinc-300 font-bold">السقف المالي المعتمد للأسرة الواحدة:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="5000"
                            value={financialCapPerFamily}
                            onChange={(e) => setFinancialCapPerFamily(Number(e.target.value) || 50000)}
                            className="w-32 bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 font-mono text-center font-black text-amber-400 text-xs"
                          />
                          <span className="text-zinc-400 font-mono text-[10px]">YER</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preset Kits Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-zinc-300">
                      🎁 اختر حزمة إغاثية جاهزة أو حدد الأصناف يدوياً:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {PRESET_DISBURSEMENT_KITS.map((kit) => {
                        const isSelected = selectedPresetKit === kit.id;
                        return (
                          <div
                            key={kit.id}
                            onClick={() => handleSelectPresetKit(kit.id)}
                            className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                              isSelected 
                                ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-md' 
                                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                                  {kit.name_ar}
                                </h4>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">
                                {kit.name_en}
                              </p>
                            </div>
                            <span className="mt-3 text-[9.5px] font-black text-amber-600 dark:text-amber-400 uppercase block">
                              حزمة معتمدة ذات استجابة عاجلة
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual Inventory Items Checklist */}
                  <div className="space-y-3 bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-xs text-slate-800 dark:text-zinc-200">
                        📦 الأصناف والمواد الإغاثية المتوفرة بالمستودع المحدد ({items.filter(i => !multiWarehouseId || i.warehouse_id === multiWarehouseId).length} أصناف):
                      </h4>
                      <span className="text-[10px] text-slate-500">حدد الأصناف المراد تضمينها في عملية الصرف</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items
                        .filter(i => !multiWarehouseId || i.warehouse_id === multiWarehouseId || true)
                        .map((item) => {
                          const isChecked = selectedItemIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                const updated = isChecked
                                  ? selectedItemIds.filter(id => id !== item.id)
                                  : [...selectedItemIds, item.id];
                                setSelectedItemIds(updated);
                                setSelectedPresetKit('CUSTOM');
                                syncDisbursementMatrix(selectedBenIds, updated, defaultItemQtys, enableFamilyScaling);
                              }}
                              className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                                isChecked 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs' 
                                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 opacity-80'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                                    {item.name_ar}
                                  </h5>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {item.sku} | الرصيد المتاح: <strong className="text-emerald-600 font-black">{item.qty} {item.unit_ar}</strong>
                                  </span>
                                </div>
                              </div>

                              {isChecked && (
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[10px] font-bold text-slate-400">الافتراضي:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={defaultItemQtys[item.id] || 1}
                                    onChange={(e) => {
                                      const val = Math.max(1, Number(e.target.value) || 1);
                                      const updated = { ...defaultItemQtys, [item.id]: val };
                                      setDefaultItemQtys(updated);
                                      syncDisbursementMatrix(selectedBenIds, selectedItemIds, updated, enableFamilyScaling);
                                    }}
                                    className="w-14 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-center font-mono font-black rounded-lg p-1 text-xs text-slate-900 dark:text-white"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Step 2 Footer Navigation */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setMultiStep(1)}
                      className="px-5 py-2.5 bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold text-xs rounded-xl hover:bg-slate-300 transition cursor-pointer"
                    >
                      الرجوع لتعديل المستفيدين
                    </button>

                    <button
                      onClick={() => setMultiStep(3)}
                      disabled={selectedItemIds.length === 0}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>تكوين مصفوفة الصرف والمطابقة اللحظية</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: INTERACTIVE DISBURSEMENT MATRIX, AUTO-CAP SHORTFALL & LIVE VALIDATION GRID */}
              {multiStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Real-Time Stock Validation Summary Bar */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                        <h4 className="font-extrabold text-xs">مطابقة الرصيد المتاح بالمستودع وإجمالي المطلوب للصرف</h4>
                      </div>
                      
                      {/* Auto Cap Shortfall Action Button */}
                      <button
                        onClick={handleAutoCapShortfall}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[10px] rounded-lg shadow transition cursor-pointer flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        <span>ضبط الحصص لمطابقة رصيد المخزن (Auto-Cap)</span>
                      </button>
                    </div>

                    {/* Stock Sufficiency Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedItemIds.map((itemId) => {
                        const item = items.find(i => i.id === itemId);
                        const totalReq = selectedBenIds.reduce((sum, bId) => sum + (matrixQtys[bId]?.[itemId] || 0), 0);
                        const currentStock = item?.qty || 0;
                        const isSufficient = currentStock >= totalReq;

                        return (
                          <div key={itemId} className="bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-700/60 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black block text-amber-300">{item?.name_ar}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                المطلوب: <strong>{totalReq}</strong> / المتاح: <strong>{currentStock}</strong> {item?.unit_ar}
                              </span>
                            </div>
                            {isSufficient ? (
                              <span className="px-2 py-1 rounded text-[9.5px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ✓ مستوفى
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-[9.5px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                                ⚠️ عجز بمقدار {totalReq - currentStock}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Matrix Grid Table */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-xs text-slate-800 dark:text-zinc-200">
                        📊 مصفوفة ضبط الكميات الفردية لكل مستفيد (Disbursement Matrix Grid):
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleExportRosterCSV}
                          className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>تصدير CSV / Excel</span>
                        </button>
                        <button
                          onClick={() => syncDisbursementMatrix(selectedBenIds, selectedItemIds, defaultItemQtys, enableFamilyScaling)}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>إعادة التكيف الذاتي للكميات</span>
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-zinc-950 font-black text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800">
                              <th className="p-3">#</th>
                              <th className="p-3">اسم المستفيد والكود</th>
                              <th className="p-3">أفراد الأسرة</th>
                              {selectedItemIds.map(itemId => {
                                const item = items.find(i => i.id === itemId);
                                return (
                                  <th key={itemId} className="p-3 text-center">
                                    <span className="block text-slate-900 dark:text-white">{item?.name_ar}</span>
                                    <span className="text-[9px] text-slate-400 font-mono font-normal">({item?.unit_ar})</span>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold">
                            {selectedBenIds.map((benId, index) => {
                              const ben = allBeneficiaries.find(b => b.id === benId);
                              return (
                                <tr key={benId} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                                  <td className="p-3 text-slate-400 font-mono">{index + 1}</td>
                                  <td className="p-3">
                                    <span className="block text-slate-900 dark:text-white font-extrabold">{ben?.full_name_ar || ben?.name_ar}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{ben?.beneficiary_code || benId}</span>
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 font-black">
                                      {ben?.family_size || 5} أفراد
                                    </span>
                                  </td>
                                  {selectedItemIds.map(itemId => {
                                    const currentQty = matrixQtys[benId]?.[itemId] || 0;
                                    return (
                                      <td key={itemId} className="p-3 text-center">
                                        <input
                                          type="number"
                                          min="0"
                                          value={currentQty}
                                          onChange={(e) => {
                                            const val = Math.max(0, Number(e.target.value) || 0);
                                            setMatrixQtys(prev => ({
                                              ...prev,
                                              [benId]: {
                                                ...(prev[benId] || {}),
                                                [itemId]: val
                                              }
                                            }));
                                          }}
                                          className="w-16 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-center font-mono font-black rounded-xl p-1.5 text-xs text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 Footer Navigation */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setMultiStep(2)}
                      className="px-5 py-2.5 bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold text-xs rounded-xl hover:bg-slate-300 transition cursor-pointer"
                    >
                      الرجوع لتغيير الأصناف الحالية
                    </button>

                    <button
                      onClick={() => setMultiStep(4)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>الانتقال للتمرير والاعتماد الميداني</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: EXECUTION, MANIFEST & INDIVIDUAL E-VOUCHERS GENERATION */}
              {multiStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Verification Mode Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-zinc-300">
                      🛡️ نمط التوثيق والتحقق عند التوزيع الميداني:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'ELECTRONIC_MANIFEST', title: 'كشف وكوبون صرف رقمي', desc: 'توليد أرقام سندات معتمدة برمز توثيق ID موحد' },
                        { id: 'BIOMETRIC_SIGNATURE', title: 'توقيع وبصمة رقمية', desc: 'التحقق ببصمة الأصابع أو التوقيع على الشاشة' },
                        { id: 'DIRECT_WAREHOUSE_DISPATCH', title: 'صرف مخزني عاجل', desc: 'خصم مباشر وفوري من رصيد المستودع' }
                      ].map(mode => (
                        <div
                          key={mode.id}
                          onClick={() => setVerificationMode(mode.id as any)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                            verificationMode === mode.id 
                              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20' 
                              : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{mode.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">{mode.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Batch Details Summary Card */}
                  <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-zinc-800 pb-2">
                      <span className="font-black text-xs text-slate-800 dark:text-zinc-200">بيانات دفعة الصرف والتسليم</span>
                      <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                        {distributionBatchRef} | {donorFundingRef}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                      <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <span className="text-slate-400 block text-[9.5px]">المستودع المصدر</span>
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                          {warehouses.find(w => w.id === multiWarehouseId)?.name_ar || 'المستودع الرئيسي'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <span className="text-slate-400 block text-[9.5px]">إجمالي المستفيدين</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {selectedBenIds.length} مستفيدين
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <span className="text-slate-400 block text-[9.5px]">الأصناف المعتمدة</span>
                        <span className="font-black text-purple-600 dark:text-purple-400">
                          {selectedItemIds.length} أصناف
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <span className="text-slate-400 block text-[9.5px]">إجمالي الوحدات المصروفة</span>
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {selectedBenIds.reduce((sum, bId) => {
                            return sum + selectedItemIds.reduce((s2, iId) => s2 + (matrixQtys[bId]?.[iId] || 0), 0);
                          }, 0)} وحدة
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Execution Status Banner */}
                  {isMultiExecuted && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-xs text-emerald-900 dark:text-emerald-300">
                            تم اعتماد الصرف واقتطاع الكميات من رصيد المستودع بنجاح 🎉
                          </h4>
                          <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                            تم تسجيل حركات الصرف اللوجستية وتوليد أرقام السندات الموحدة دفعة {distributionBatchRef}.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={handlePrintIndividualEVouchers}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          🎫 طباعة كروت/كوبونات المستفيدين
                        </button>
                        <button
                          onClick={handlePrintMultiDisbursementManifest}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>طباعة منافيست التوزيع</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Execution & Print Control Bar */}
                  <div className="space-y-3 pt-2">
                    {!isMultiExecuted ? (
                      <button
                        onClick={handleExecuteMultiDisbursement}
                        disabled={multiExecuting}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                        <span>
                          {multiExecuting ? 'جاري اقتطاع المخزون وتسجيل السندات...' : 'تفعيل وتمرير الصرف المخزني المتعدد (Execute Disbursement)'}
                        </span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={handlePrintMultiDisbursementManifest}
                          className="py-3 bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-xl font-black text-xs shadow-md hover:bg-emerald-600 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-amber-300" />
                          <span>طباعة كشف ومنافيست التوزيع الرسمية</span>
                        </button>

                        <button
                          onClick={handlePrintIndividualEVouchers}
                          className="py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-black text-xs shadow-md hover:bg-amber-500 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          🎫 <span>طباعة كروت/كوبونات المستفيدين E-Vouchers</span>
                        </button>

                        <button
                          onClick={handleExportRosterCSV}
                          className="py-3 bg-slate-800 text-white rounded-xl font-black text-xs shadow-md hover:bg-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span>تصدير السجل كملف Excel/CSV</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
