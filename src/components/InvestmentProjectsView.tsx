import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Building2, Coins, ShieldCheck, Lock, Award, Eye, 
  CheckCircle2, AlertTriangle, RefreshCw, Plus, Search, Filter, 
  PieChart, BarChart3, FileText, ArrowUpRight, DollarSign, Users,
  Layers, Check, X, ShieldAlert, Scale, ChevronRight, Download, Printer,
  Calendar, Briefcase, FileCheck, Activity, Sun, Sprout, Droplets, Receipt,
  Clock, Edit, Zap, Wrench, Shield, CheckSquare, FolderCheck, Archive, Calculator,
  MapPin, Hammer, Home, Store, Sparkles, Landmark, Ruler, Compass, Tag
} from 'lucide-react';
import { ModuleShell } from './enterprise/ModuleShell';

export interface InvestmentProject {
  id: string;
  project_code: string;
  title_ar: string;
  title_en: string;
  category: string; // REAL_ESTATE_ENDOWMENT, AGRICULTURAL_PRODUCTIVE, SOCIAL_ENTERPRISE, EQUITY_PORTFOLIO, RENEWABLE_ENERGY, COMMERCIAL_TRADE
  capital_allocated_yer: number;
  accumulated_returns_yer: number;
  net_annual_profit_yer: number;
  expected_roi_pct: number;
  actual_roi_pct: number;
  irr_pct: number;
  occupancy_or_yield_pct: number;
  risk_level: string; // LOW, MEDIUM, HIGH
  endowment_preservation_status: string; // PRESERVED
  humanitarian_distribution_pct: number;
  assigned_investment_manager: string;
  approval_status: string; // APPROVED, PENDING_COMMITTEE, REJECTED
  security_clearance_level: number;
  location_governorate: string;
  shariah_cert_number?: string;
  capex_yer?: number;
  opex_annual_yer?: number;
}

export interface FiscalReturn {
  id: string;
  project_id: string;
  fiscal_period: string;
  gross_revenue_yer: number;
  operational_expenses_yer: number;
  net_profit_yer: number;
  transferred_to_charity_yer: number;
  reinvested_amount_yer: number;
  recorded_by_user: string;
  audited_by_cfo: string;
  approval_date: string;
}

export interface InvestmentContract {
  id: string;
  project_id: string;
  contract_code: string;
  title_ar: string;
  title_en: string;
  contract_type: 'TENANT_LEASE' | 'OM_SERVICE' | 'LAND_ENDOWMENT_DEED' | 'SUKUK_TRUST' | 'SUPPLIER_PURCHASE' | 'SHARIAH_CERTIFICATE';
  second_party_name: string;
  second_party_type: 'TENANT' | 'CONTRACTOR' | 'OPERATOR' | 'GOVERNMENT' | 'SUKUK_HOLDER' | 'VENDOR';
  value_yer: number;
  payment_frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'LUMP_SUM';
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'RENEWAL_DUE' | 'COMPLETED' | 'TERMINATED' | 'DRAFT';
  notes_ar?: string;
}

export interface InvestmentActivity {
  id: string;
  project_id: string;
  activity_code: string;
  title_ar: string;
  title_en: string;
  activity_type: 'MAINTENANCE' | 'HARVEST_HARVESTING' | 'LEASE_COLLECTION' | 'INVENTORY_AUDIT' | 'SUKUK_DISBURSEMENT' | 'CAPEX_EXPANSION' | 'SHARIAH_AUDIT';
  planned_date: string;
  execution_date?: string;
  budget_allocated_yer: number;
  actual_cost_yer: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  assigned_lead: string;
  execution_notes_ar?: string;
}

interface InvestmentProjectsViewProps {
  lang: 'ar' | 'en';
  onNavigate?: (tab: string) => void;
}

export const InvestmentProjectsView: React.FC<InvestmentProjectsViewProps> = ({ lang, onNavigate }) => {
  const isAr = lang === 'ar';

  // Security RBAC State
  const [currentUserRole] = useState<'CFO' | 'INVESTMENT_OFFICER' | 'AUDITOR' | 'VIEWER'>('CFO');

  // Active View Sub-Tab inside Investment OS
  const [activeSubTab, setActiveSubTab] = useState<'portfolio' | 'micro_investments' | 'activities' | 'contracts' | 'returns' | 'governance' | 'reports'>('portfolio');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');

  // Data Loading State
  const [loading, setLoading] = useState(true);

  // Core Data State
  const [projects, setProjects] = useState<InvestmentProject[]>([]);
  const [returnsHistory, setReturnsHistory] = useState<FiscalReturn[]>([]);
  const [contracts, setContracts] = useState<InvestmentContract[]>([]);
  const [activities, setActivities] = useState<InvestmentActivity[]>([]);

  // Modals State
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddReturnModal, setShowAddReturnModal] = useState(false);
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showFeasibilityModal, setShowFeasibilityModal] = useState(false);
  const [showArchivingModal, setShowArchivingModal] = useState(false);
  const [showMicroWizardModal, setShowMicroWizardModal] = useState(false);
  const [microType, setMicroType] = useState<'LAND' | 'REAL_ESTATE' | 'CONTRACTING' | 'EQUIPMENT'>('LAND');

  // Micro Investment Form State
  const [microForm, setMicroForm] = useState({
    title_ar: '',
    category: 'MICRO_LAND_PARCEL',
    location: 'مأرب - المجمع التجاري',
    capital_yer: 15000000,
    expected_roi_pct: 16.5,
    area_size: '12 لبنة تجارية (540 م²)',
    deed_number: 'صك أوقاف - 88201/2025',
    boundaries_ar: 'شمالاً: شارع 24m، جنوباً: وقف العطاء، شرقاً: ملكية خاصة، غرباً: شارع 16m',
    tenant_or_contractor: 'مؤسسة أفق للتطوير والمقاولات',
    contract_term_months: 24
  });

  const [selectedProjectForAction, setSelectedProjectForAction] = useState<InvestmentProject | null>(null);
  const [selectedProjectForCertificate, setSelectedProjectForCertificate] = useState<InvestmentProject | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Archiving Integration Form State
  const [archiveFormState, setArchiveFormState] = useState({
    doc_title: '',
    doc_type: 'INVESTMENT_CONTRACT',
    project_code: '',
    confidentiality_level: 'CONFIDENTIAL_LEVEL_3',
    archiving_notes: ''
  });

  // Form States
  const [newProjectForm, setNewProjectForm] = useState({
    project_code: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title_ar: '',
    title_en: '',
    category: 'REAL_ESTATE_ENDOWMENT',
    capital_allocated_yer: 150000000,
    expected_roi_pct: 12.5,
    occupancy_or_yield_pct: 90.0,
    risk_level: 'LOW',
    humanitarian_distribution_pct: 75,
    assigned_investment_manager: 'د. عبدالحكيم السقاف',
    location_governorate: 'مأرب',
    shariah_cert_number: `SH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    capex_yer: 120000000,
    opex_annual_yer: 15000000
  });

  const [newReturnForm, setNewReturnForm] = useState({
    fiscal_period: '2025-Q2',
    gross_revenue_yer: 25000000,
    operational_expenses_yer: 4000000
  });

  const [newContractForm, setNewContractForm] = useState({
    project_id: '',
    contract_code: `CNT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title_ar: '',
    title_en: '',
    contract_type: 'TENANT_LEASE' as InvestmentContract['contract_type'],
    second_party_name: '',
    second_party_type: 'TENANT' as InvestmentContract['second_party_type'],
    value_yer: 25000000,
    payment_frequency: 'ANNUAL' as InvestmentContract['payment_frequency'],
    start_date: '2025-01-01',
    end_date: '2026-01-01',
    notes_ar: ''
  });

  const [newActivityForm, setNewActivityForm] = useState({
    project_id: '',
    activity_code: `ACT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title_ar: '',
    title_en: '',
    activity_type: 'MAINTENANCE' as InvestmentActivity['activity_type'],
    planned_date: new Date().toISOString().split('T')[0],
    budget_allocated_yer: 3500000,
    assigned_lead: 'م. ناصر سعيد المعمري',
    execution_notes_ar: ''
  });

  // Fetch Investment Data from Server
  const fetchInvestmentData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/investment-summary');
      if (!res.ok) throw new Error('Failed to fetch investment summary');
      const data = await res.json();
      if (data.status === 'ok' && data.summary) {
        setProjects(data.summary.projects || []);
        setReturnsHistory(data.summary.returnsHistory || []);
        if (data.summary.contracts && data.summary.contracts.length > 0) {
          setContracts(data.summary.contracts);
        } else {
          populateFallbackContracts();
        }
        if (data.summary.activities && data.summary.activities.length > 0) {
          setActivities(data.summary.activities);
        } else {
          populateFallbackActivities();
        }
      }
    } catch (err: any) {
      console.warn('Using enriched fallback state:', err.message);
      populateFallbackState();
    } finally {
      setLoading(false);
    }
  };

  const populateFallbackContracts = () => {
    setContracts([
      {
        id: 'cnt-1',
        project_id: '1',
        contract_code: 'CNT-2025-010',
        title_ar: 'عقد استئجار وتأجير المحلات التجارية والمكاتب - وقف البر',
        title_en: 'Al-Birr Endowment Commercial Units Master Lease',
        contract_type: 'TENANT_LEASE',
        second_party_name: 'شركة سبأ للتجارة والمقاولات العامة',
        second_party_type: 'TENANT',
        value_yer: 45000000,
        payment_frequency: 'ANNUAL',
        start_date: '2025-01-01',
        end_date: '2027-12-31',
        status: 'ACTIVE',
        notes_ar: 'عقد موثق ومقترن بضمانة بنكية ومحول لصالح كفالات الأيتام.'
      },
      {
        id: 'cnt-2',
        project_id: '2',
        contract_code: 'CNT-2025-011',
        title_ar: 'عقد تشغيل وصيانة معاصر الزيتون والمنظومة الشمسية',
        title_en: 'Olive Press & Solar O&M Operating Agreement',
        contract_type: 'OM_SERVICE',
        second_party_name: 'مؤسسة الساحل الزراعية للتنمية',
        second_party_type: 'OPERATOR',
        value_yer: 12000000,
        payment_frequency: 'QUARTERLY',
        start_date: '2025-02-15',
        end_date: '2026-02-14',
        status: 'ACTIVE',
        notes_ar: 'يتضمن صيانة دورية للخلايا الشمسية واستخلاص معاصر الزيتون البكر.'
      },
      {
        id: 'cnt-3',
        project_id: '3',
        contract_code: 'CNT-2025-012',
        title_ar: 'عقد امتياز توزيع مياه التحلية التجارية للمؤسسات والمستشفيات',
        title_en: 'Commercial Water Wholesale Concession Agreement',
        contract_type: 'TENANT_LEASE',
        second_party_name: 'مجموعة النقاء للتوزيع والخدمات اللوجستية',
        second_party_type: 'TENANT',
        value_yer: 18000000,
        payment_frequency: 'MONTHLY',
        start_date: '2025-03-01',
        end_date: '2026-02-28',
        status: 'ACTIVE',
        notes_ar: 'تخصيص 20% من الضخ اليومي مجاناً لمخيمات النازحين.'
      },
      {
        id: 'cnt-4',
        project_id: '4',
        contract_code: 'CNT-2025-013',
        title_ar: 'صك الوقفية والوصاية الشرعية لصكوك التنمية المستدامة',
        title_en: 'Sovereign Sukuk Endowment Master Trust Deed',
        contract_type: 'SUKUK_TRUST',
        second_party_name: 'الهيئة العامة للأوقاف والرقابة الشرعية',
        second_party_type: 'GOVERNMENT',
        value_yer: 350000000,
        payment_frequency: 'SEMI_ANNUAL',
        start_date: '2024-01-01',
        end_date: '2034-12-31',
        status: 'ACTIVE',
        notes_ar: 'صك سيادي معتمد بشرط عدم مساس الأصل وتوجيه الأرباح للإغاثة.'
      }
    ]);
  };

  const populateFallbackActivities = () => {
    setActivities([
      {
        id: 'act-1',
        project_id: '2',
        activity_code: 'ACT-INV-001',
        title_ar: 'موسم جني الزيتون وتشغيل العصر البارد الأول',
        title_en: 'Olive Harvest & First Cold Press Season',
        activity_type: 'HARVEST_HARVESTING',
        planned_date: '2025-09-01',
        execution_date: '2025-09-10',
        budget_allocated_yer: 8500000,
        actual_cost_yer: 8100000,
        status: 'COMPLETED',
        assigned_lead: 'م. ناصر سعيد المعمري',
        execution_notes_ar: 'تم إنتاج 12,000 ليتر زيت زيتون بكر ممتاز بتصنيف جودة عالية.'
      },
      {
        id: 'act-2',
        project_id: '3',
        activity_code: 'ACT-INV-002',
        title_ar: 'صيانة واستبدال أغشية التحلية التكتيكية لمحطة المياه',
        title_en: 'Reverse Osmosis Filter Membrane Replacement',
        activity_type: 'MAINTENANCE',
        planned_date: '2025-10-15',
        budget_allocated_yer: 4200000,
        actual_cost_yer: 0,
        status: 'SCHEDULED',
        assigned_lead: 'م. أحمد سالم باثواب',
        execution_notes_ar: 'فحص نسبة الأملاح المذابة TDS وضمان معايير الصحة العالمية.'
      },
      {
        id: 'act-3',
        project_id: '1',
        activity_code: 'ACT-INV-003',
        title_ar: 'مراجعة وتحصيل مستحقات الإيجارات الربع سنوية - وقف البر',
        title_en: 'Quarterly Lease Rental Collection Audit',
        activity_type: 'LEASE_COLLECTION',
        planned_date: '2025-08-30',
        execution_date: '2025-08-30',
        budget_allocated_yer: 500000,
        actual_cost_yer: 450000,
        status: 'COMPLETED',
        assigned_lead: 'د. عبدالحكيم السقاف',
        execution_notes_ar: 'تم تحصيل 100% من المستحقات وإيداعها ببنك الوقف.'
      },
      {
        id: 'act-4',
        project_id: '4',
        activity_code: 'ACT-INV-004',
        title_ar: 'توزيع كوبونات عوائد الصكوك السيادية المعتمدة',
        title_en: 'Sovereign Sukuk Coupon Distribution',
        activity_type: 'SUKUK_DISBURSEMENT',
        planned_date: '2025-07-01',
        execution_date: '2025-07-02',
        budget_allocated_yer: 21000000,
        actual_cost_yer: 21000000,
        status: 'COMPLETED',
        assigned_lead: 'أ. سالم عبدالله العولقي',
        execution_notes_ar: 'ترحيل العوائد مباشرة لحساب السلال الغذائية وكفالات الأيتام.'
      }
    ]);
  };

  const populateFallbackState = () => {
    if (projects.length === 0) {
      setProjects([
        {
          id: '1',
          project_code: 'INV-2025-001',
          title_ar: 'وقف البر والعطاء العقاري الموحد - مأرب',
          title_en: 'Al-Birr Real Estate Endowment Complex - Marib',
          category: 'REAL_ESTATE_ENDOWMENT',
          capital_allocated_yer: 450000000,
          accumulated_returns_yer: 112500000,
          net_annual_profit_yer: 58500000,
          expected_roi_pct: 14.0,
          actual_roi_pct: 13.0,
          irr_pct: 14.8,
          occupancy_or_yield_pct: 96.5,
          risk_level: 'LOW',
          endowment_preservation_status: 'PRESERVED',
          humanitarian_distribution_pct: 75,
          assigned_investment_manager: 'د. عبدالحكيم السقاف',
          approval_status: 'APPROVED',
          security_clearance_level: 3,
          location_governorate: 'مأرب',
          shariah_cert_number: 'SH-2025-091',
          capex_yer: 380000000,
          opex_annual_yer: 22000000
        },
        {
          id: '2',
          project_code: 'INV-2025-002',
          title_ar: 'مشروع الخلايا الشمسية ومعاصر الزيتون التنموية',
          title_en: 'Solar Powered Olive Press & Productive Agriculture',
          category: 'AGRICULTURAL_PRODUCTIVE',
          capital_allocated_yer: 280000000,
          accumulated_returns_yer: 64400000,
          net_annual_profit_yer: 39200000,
          expected_roi_pct: 15.5,
          actual_roi_pct: 14.0,
          irr_pct: 15.2,
          occupancy_or_yield_pct: 88.0,
          risk_level: 'MEDIUM',
          endowment_preservation_status: 'PRESERVED',
          humanitarian_distribution_pct: 70,
          assigned_investment_manager: 'م. ناصر سعيد المعمري',
          approval_status: 'APPROVED',
          security_clearance_level: 2,
          location_governorate: 'الساحل الغربي',
          shariah_cert_number: 'SH-2025-092',
          capex_yer: 240000000,
          opex_annual_yer: 18000000
        },
        {
          id: '3',
          project_code: 'INV-2025-003',
          title_ar: 'محطة مياه النقاء الاستثمارية - وحدة تحلية تجارية',
          title_en: 'Al-Naqa Commercial Water Purification Plant',
          category: 'SOCIAL_ENTERPRISE',
          capital_allocated_yer: 190000000,
          accumulated_returns_yer: 41800000,
          net_annual_profit_yer: 24700000,
          expected_roi_pct: 13.5,
          actual_roi_pct: 13.0,
          irr_pct: 13.9,
          occupancy_or_yield_pct: 92.0,
          risk_level: 'LOW',
          endowment_preservation_status: 'PRESERVED',
          humanitarian_distribution_pct: 80,
          assigned_investment_manager: 'م. أحمد سالم باثواب',
          approval_status: 'APPROVED',
          security_clearance_level: 2,
          location_governorate: 'الحديدة',
          shariah_cert_number: 'SH-2025-093',
          capex_yer: 160000000,
          opex_annual_yer: 12000000
        },
        {
          id: '4',
          project_code: 'INV-2025-004',
          title_ar: 'محفظة الصكوك الأوقافية السيادية المستدامة',
          title_en: 'Sovereign Endowment Sukuk Portfolio',
          category: 'EQUITY_PORTFOLIO',
          capital_allocated_yer: 350000000,
          accumulated_returns_yer: 77000000,
          net_annual_profit_yer: 42000000,
          expected_roi_pct: 12.0,
          actual_roi_pct: 12.0,
          irr_pct: 12.5,
          occupancy_or_yield_pct: 100.0,
          risk_level: 'LOW',
          endowment_preservation_status: 'PRESERVED',
          humanitarian_distribution_pct: 65,
          assigned_investment_manager: 'أ. سالم عبدالله العولقي',
          approval_status: 'APPROVED',
          security_clearance_level: 3,
          location_governorate: 'المركز الرئيسي',
          shariah_cert_number: 'SH-2025-094',
          capex_yer: 350000000,
          opex_annual_yer: 2000000
        },
        {
          id: '5',
          project_code: 'INV-2025-005',
          title_ar: 'مشروع أصل الطاقة الشمسية الموزعة والمحطات الريفية',
          title_en: 'Rural Off-Grid Solar Energy Infrastructure Fund',
          category: 'RENEWABLE_ENERGY',
          capital_allocated_yer: 220000000,
          accumulated_returns_yer: 33000000,
          net_annual_profit_yer: 28600000,
          expected_roi_pct: 13.0,
          actual_roi_pct: 13.0,
          irr_pct: 13.6,
          occupancy_or_yield_pct: 95.0,
          risk_level: 'LOW',
          endowment_preservation_status: 'PRESERVED',
          humanitarian_distribution_pct: 75,
          assigned_investment_manager: 'م. خالد عبدالرحيم',
          approval_status: 'APPROVED',
          security_clearance_level: 2,
          location_governorate: 'حضرموت',
          shariah_cert_number: 'SH-2025-095',
          capex_yer: 195000000,
          opex_annual_yer: 9000000
        },
        {
          id: '6',
          project_code: 'INV-2025-006',
          title_ar: 'قطعة أرض وقفيّة استثمارية تجارية - 12 لبنة (مأرب)',
          title_en: 'Commercial Endowment Land Plot - Marib Parcel',
          category: 'MICRO_LAND_PARCEL',
          capital_allocated_yer: 35000000,
          accumulated_returns_yer: 6300000,
          net_annual_profit_yer: 5950000,
          expected_roi_pct: 17.0,
          actual_roi_pct: 17.0,
          irr_pct: 18.2,
          occupancy_or_yield_pct: 100.0,
          risk_level: 'LOW',
          endowment_preservation_status: 'PRESERVED',
          humanitarian_distribution_pct: 80,
          assigned_investment_manager: 'م. ناصر سعيد المعمري',
          approval_status: 'APPROVED',
          security_clearance_level: 2,
          location_governorate: 'مأرب - المجمع',
          shariah_cert_number: 'SH-2025-096',
          capex_yer: 35000000,
          opex_annual_yer: 1200000
        },
        {
          id: '7',
          project_code: 'INV-2025-007',
          title_ar: 'مشروع مقاولات وترميم الدكاكين الأوقافية (عتق - شبوة)',
          title_en: 'Endowment Commercial Shop Renovation Contracting',
          category: 'MICRO_CONTRACTING',
          capital_allocated_yer: 24000000,
          accumulated_returns_yer: 4080000,
          net_annual_profit_yer: 3840000,
          expected_roi_pct: 16.0,
          actual_roi_pct: 16.0,
          irr_pct: 16.8,
          occupancy_or_yield_pct: 91.0,
          risk_level: 'LOW',
          endowment_preservation_status: 'PRESERVED',
          humanitarian_distribution_pct: 75,
          assigned_investment_manager: 'م. أحمد سالم باثواب',
          approval_status: 'APPROVED',
          security_clearance_level: 2,
          location_governorate: 'شبوة - عتق',
          shariah_cert_number: 'SH-2025-097',
          capex_yer: 22000000,
          opex_annual_yer: 1500000
        },
        {
          id: '8',
          project_code: 'INV-2025-008',
          title_ar: 'مجمع المحلات التجارية الاستثمارية المصغرة - 12 محل (سيئون)',
          title_en: 'Seiyun 12-Unit Micro Commercial Shops Complex',
          category: 'MICRO_COMMERCIAL_SHOP',
          capital_allocated_yer: 48000000,
          accumulated_returns_yer: 8160000,
          net_annual_profit_yer: 7680000,
          expected_roi_pct: 16.0,
          actual_roi_pct: 16.0,
          irr_pct: 17.1,
          occupancy_or_yield_pct: 100.0,
          risk_level: 'LOW',
          endowment_preservation_status: 'PRESERVED',
          humanitarian_distribution_pct: 75,
          assigned_investment_manager: 'د. عبدالحكيم السقاف',
          approval_status: 'APPROVED',
          security_clearance_level: 2,
          location_governorate: 'حضرموت - سيئون',
          shariah_cert_number: 'SH-2025-098',
          capex_yer: 42000000,
          opex_annual_yer: 2500000
        },
        {
          id: '9',
          project_code: 'INV-2025-009',
          title_ar: 'تأجير معدات الحفر الثقيلة والمضخات التنموية (الحديدة)',
          title_en: 'Heavy Rig & Solar Pump Equipment Rental Fleet',
          category: 'MICRO_EQUIPMENT_RENTAL',
          capital_allocated_yer: 32000000,
          accumulated_returns_yer: 5760000,
          net_annual_profit_yer: 5440000,
          expected_roi_pct: 17.0,
          actual_roi_pct: 17.0,
          irr_pct: 17.9,
          occupancy_or_yield_pct: 94.0,
          risk_level: 'MEDIUM',
          endowment_preservation_status: 'PRESERVED',
          humanitarian_distribution_pct: 70,
          assigned_investment_manager: 'أ. سالم عبدالله العولقي',
          approval_status: 'APPROVED',
          security_clearance_level: 2,
          location_governorate: 'الحديدة - الساحل',
          shariah_cert_number: 'SH-2025-099',
          capex_yer: 28000000,
          opex_annual_yer: 2000000
        }
      ]);
    }
    populateFallbackContracts();
    populateFallbackActivities();
  };

  useEffect(() => {
    fetchInvestmentData();
  }, []);

  // Summary KPI Metrics
  const metrics = useMemo(() => {
    let totalCap = 0;
    let totalRet = 0;
    let totalNetAnnual = 0;
    let weightedRoiSum = 0;

    projects.forEach(p => {
      const cap = Number(p.capital_allocated_yer) || 0;
      const ret = Number(p.accumulated_returns_yer) || 0;
      const netProf = Number(p.net_annual_profit_yer) || 0;
      const roi = Number(p.actual_roi_pct) || 0;

      totalCap += cap;
      totalRet += ret;
      totalNetAnnual += netProf;
      weightedRoiSum += (cap * roi);
    });

    const weightedRoi = totalCap > 0 ? (weightedRoiSum / totalCap) : 0;
    const estimatedCharityTransfer = totalNetAnnual * 0.74;
    const estimatedReinvestment = totalNetAnnual * 0.26;

    return {
      totalCapital: totalCap,
      totalReturns: totalRet,
      totalNetAnnualProfit: totalNetAnnual,
      weightedAvgRoi: weightedRoi.toFixed(2),
      estimatedCharityTransfer,
      estimatedReinvestment,
      preservedRate: 100,
      activeContractsCount: contracts.filter(c => c.status === 'ACTIVE').length,
      activeActivitiesCount: activities.filter(a => a.status !== 'COMPLETED').length
    };
  }, [projects, contracts, activities]);

  // Filtered Projects List
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.project_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.location_governorate.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesRisk = selectedRisk === 'ALL' || p.risk_level === selectedRisk;
      return matchesSearch && matchesCat && matchesRisk;
    });
  }, [projects, searchQuery, selectedCategory, selectedRisk]);

  // Create Project Handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.title_ar) {
      setNotification({ type: 'error', message: isAr ? 'يرجى إدخال اسم المشروع الاستثماري' : 'Please enter investment project title' });
      return;
    }

    const netProfitEst = newProjectForm.capital_allocated_yer * (newProjectForm.expected_roi_pct / 100);

    const createdProject: InvestmentProject = {
      id: `inv-${Date.now()}`,
      project_code: newProjectForm.project_code,
      title_ar: newProjectForm.title_ar,
      title_en: newProjectForm.title_en || newProjectForm.title_ar,
      category: newProjectForm.category,
      capital_allocated_yer: Number(newProjectForm.capital_allocated_yer),
      accumulated_returns_yer: 0,
      net_annual_profit_yer: netProfitEst,
      expected_roi_pct: Number(newProjectForm.expected_roi_pct),
      actual_roi_pct: Number(newProjectForm.expected_roi_pct),
      irr_pct: Number(newProjectForm.expected_roi_pct) + 0.8,
      occupancy_or_yield_pct: Number(newProjectForm.occupancy_or_yield_pct),
      risk_level: newProjectForm.risk_level,
      endowment_preservation_status: 'PRESERVED',
      humanitarian_distribution_pct: Number(newProjectForm.humanitarian_distribution_pct),
      assigned_investment_manager: newProjectForm.assigned_investment_manager,
      approval_status: 'APPROVED',
      security_clearance_level: 3,
      location_governorate: newProjectForm.location_governorate,
      shariah_cert_number: newProjectForm.shariah_cert_number,
      capex_yer: Number(newProjectForm.capex_yer),
      opex_annual_yer: Number(newProjectForm.opex_annual_yer)
    };

    setProjects(prev => [createdProject, ...prev]);
    setShowAddProjectModal(false);
    setNotification({
      type: 'success',
      message: isAr ? 'تم اعتماد وإضافة المشروع الاستثماري وقيد حماية أصل الوقف مع التوثيق الشرعي' : 'Investment project registered and endowment asset locked with Shariah governance certificate'
    });

    setTimeout(() => setNotification(null), 4000);
  };

  // Add Fiscal Return Handler
  const handleAddReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForAction) return;

    const netProfit = newReturnForm.gross_revenue_yer - newReturnForm.operational_expenses_yer;
    const charityRatio = selectedProjectForAction.humanitarian_distribution_pct / 100;
    const transferredCharity = netProfit * charityRatio;
    const reinvestedAmount = netProfit * (1 - charityRatio);

    const newReturn: FiscalReturn = {
      id: `ret-${Date.now()}`,
      project_id: selectedProjectForAction.id,
      fiscal_period: newReturnForm.fiscal_period,
      gross_revenue_yer: newReturnForm.gross_revenue_yer,
      operational_expenses_yer: newReturnForm.operational_expenses_yer,
      net_profit_yer: netProfit,
      transferred_to_charity_yer: transferredCharity,
      reinvested_amount_yer: reinvestedAmount,
      recorded_by_user: 'د. عبدالحكيم السقاف',
      audited_by_cfo: 'أ. سالم عبدالله العولقي',
      approval_date: new Date().toISOString().split('T')[0]
    };

    setReturnsHistory(prev => [newReturn, ...prev]);

    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectForAction.id) {
        return {
          ...p,
          accumulated_returns_yer: p.accumulated_returns_yer + netProfit,
          net_annual_profit_yer: netProfit * 4
        };
      }
      return p;
    }));

    setShowAddReturnModal(false);
    setSelectedProjectForAction(null);
    setNotification({
      type: 'success',
      message: isAr ? 'تم قيد التوزيع الدوري وتغذية صندوق المشاريع الإغاثية وحساب أصل الوقف' : 'Fiscal return recorded, relief fund & endowment capital fed successfully'
    });

    setTimeout(() => setNotification(null), 4000);
  };

  // Add Contract Handler
  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = projects.find(p => p.id === newContractForm.project_id) || projects[0];
    
    const createdContract: InvestmentContract = {
      id: `cnt-${Date.now()}`,
      project_id: newContractForm.project_id || targetProject.id,
      contract_code: newContractForm.contract_code,
      title_ar: newContractForm.title_ar || `${isAr ? 'عقد' : 'Contract'} - ${targetProject.title_ar}`,
      title_en: newContractForm.title_en || targetProject.title_en,
      contract_type: newContractForm.contract_type,
      second_party_name: newContractForm.second_party_name || (isAr ? 'الطرف الثاني المعتمد' : 'Second Party Entity'),
      second_party_type: newContractForm.second_party_type,
      value_yer: Number(newContractForm.value_yer),
      payment_frequency: newContractForm.payment_frequency,
      start_date: newContractForm.start_date,
      end_date: newContractForm.end_date,
      status: 'ACTIVE',
      notes_ar: newContractForm.notes_ar
    };

    setContracts(prev => [createdContract, ...prev]);
    setShowAddContractModal(false);
    setNotification({
      type: 'success',
      message: isAr ? 'تم تسجيل عقد الاستثمار وتوثيقه في السجل المالي' : 'Investment contract recorded successfully'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Add Activity Handler
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = projects.find(p => p.id === newActivityForm.project_id) || projects[0];

    const createdActivity: InvestmentActivity = {
      id: `act-${Date.now()}`,
      project_id: newActivityForm.project_id || targetProject.id,
      activity_code: newActivityForm.activity_code,
      title_ar: newActivityForm.title_ar || `${isAr ? 'نشاط تشغيلي' : 'Activity'} - ${targetProject.title_ar}`,
      title_en: newActivityForm.title_en || targetProject.title_en,
      activity_type: newActivityForm.activity_type,
      planned_date: newActivityForm.planned_date,
      budget_allocated_yer: Number(newActivityForm.budget_allocated_yer),
      actual_cost_yer: 0,
      status: 'SCHEDULED',
      assigned_lead: newActivityForm.assigned_lead,
      execution_notes_ar: newActivityForm.execution_notes_ar
    };

    setActivities(prev => [createdActivity, ...prev]);
    setShowAddActivityModal(false);
    setNotification({
      type: 'success',
      message: isAr ? 'تم جدولة وتعيين النشاط التنفيذي للمشروع الاستثماري' : 'Executive operation activity scheduled successfully'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatYER = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2)} ${isAr ? 'مليار YER' : 'B YER'}`;
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)} ${isAr ? 'مليون YER' : 'M YER'}`;
    }
    return `${amount.toLocaleString()} YER`;
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'MICRO_LAND_PARCEL':
        return { ar: 'قطع أراضٍ وحيازات عقارية صغرى', en: 'Micro Land Parcel', icon: MapPin, bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'MICRO_CONTRACTING':
        return { ar: 'مقاولات صغرى وترميم أوقاف', en: 'Micro Contracting & Construction', icon: Hammer, bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'MICRO_COMMERCIAL_SHOP':
        return { ar: 'دكاكين ومحلات تجارية استثمارية', en: 'Commercial Shop Units', icon: Store, bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'MICRO_EQUIPMENT_RENTAL':
        return { ar: 'تأجير معدات وآلات مقاولات', en: 'Equipment & Machinery Rental', icon: Zap, bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'MICRO_AGRI_PLOT':
        return { ar: 'مشاتل ومزارع إنتاجية صغرى', en: 'Micro Agri Plots', icon: Sprout, bg: 'bg-lime-500/10 text-lime-600 border-lime-500/20' };
      case 'REAL_ESTATE_ENDOWMENT':
        return { ar: 'أوقاف عقارية وتجارية كبرى', en: 'Real Estate Endowment', icon: Building2, bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'AGRICULTURAL_PRODUCTIVE':
        return { ar: 'زراعي وإنتاج حيواني', en: 'Agricultural & Livestock', icon: Sprout, bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'SOCIAL_ENTERPRISE':
        return { ar: 'مشاريع مياه وبنية اجتماعية', en: 'Commercial Water & Utility', icon: Droplets, bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'EQUITY_PORTFOLIO':
        return { ar: 'صكوك واستثمارات مالية', en: 'Sovereign Sukuk Portfolio', icon: Coins, bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'RENEWABLE_ENERGY':
        return { ar: 'طاقة شمسية وبنية بديلة', en: 'Renewable Solar Fund', icon: Sun, bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
      case 'COMMERCIAL_TRADE':
        return { ar: 'تمويل أصغر وتجارة متوافقة', en: 'Shariah Trade & Microfinance', icon: Briefcase, bg: 'bg-teal-500/10 text-teal-600 border-teal-500/20' };
      default:
        return { ar: 'استثمار تنموي مصغر', en: 'Micro Development Fund', icon: TrendingUp, bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
    }
  };

  return (
    <ModuleShell titleAr="المشاريع الاستثمارية والأوقاف" titleEn="Investment & Endowment OS" domainCode="NEB-15" icon={TrendingUp} accent="amber" lang={lang}>
    <div className="space-y-6 pb-12 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-50 dark:bg-rose-950/80 border-rose-500/30 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-rose-500" />}
            <span className="text-xs font-bold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner & Security Shield */}
      <div className="bg-gradient-to-r from-emerald-900 via-zinc-900 to-amber-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {isAr ? 'منظومة الأوقاف والاستثمار التنموي' : 'Endowment & Investment OS'}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {isAr ? 'حماية أصل الوقف' : 'Capital Preservation Guarantee'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-amber-400" />
              {isAr ? 'المشاريع الاستثمارية والأوقاف التنموية' : 'Investment & Endowment Operating System'}
            </h1>
            <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              {isAr 
                ? 'إدارة وحوكمة المحفظة الاستثمارية، متابعة العقود التشغيلية، الأنشطة الميدانية التنفيذية، وقياس مؤشرات ROI/IRR مع ضمان حماية أصل الوقف وتوزيع العوائد لدعم المشاريع الإغاثية.'
                : 'Enterprise governance for endowment assets, operational contracts, executive field activities, ROI/IRR analytics, Shariah capital preservation, and yield allocation.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {isAr ? 'إضافة مشروع استثماري' : 'New Project'}
            </button>
            <button
              onClick={() => setShowAddContractModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-900/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              {isAr ? 'إضافة عقد / استئجار' : 'New Contract'}
            </button>
            <button
              onClick={() => setShowAddActivityModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Activity className="w-4 h-4" />
              {isAr ? 'نشاط تنفيذي' : 'New Activity'}
            </button>
            <button
              onClick={() => setShowFeasibilityModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-900/30 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              {isAr ? 'حاسبة دراسة الجدوى' : 'Feasibility ROI'}
            </button>
            <button
              onClick={() => {
                setArchiveFormState({
                  doc_title: projects[0] ? `عقود صكوك ووثائق أصل الوقف - ${projects[0].project_code}` : 'وثائق واستثمارات أصل الوقف',
                  doc_type: 'INVESTMENT_CONTRACT',
                  project_code: projects[0]?.project_code || 'INV-2025-001',
                  confidentiality_level: 'CONFIDENTIAL_LEVEL_3',
                  archiving_notes: 'توثيق رسمي وأرشفة معتمدة في الأرشيف المؤسسي الموحد'
                });
                setShowArchivingModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
            >
              <FolderCheck className="w-4 h-4" />
              {isAr ? 'الأرشفة المؤسسية' : 'Enterprise Archiving'}
            </button>
          </div>
        </div>

        {/* C-Level Executive Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-zinc-400 block mb-1 font-medium">{isAr ? 'رأس المال المخصص (YER)' : 'Total Capital Allocated'}</span>
            <span className="text-sm font-black text-amber-300 font-mono block">{formatYER(metrics.totalCapital)}</span>
            <span className="text-[9px] text-emerald-400 mt-1 block font-mono">100% {isAr ? 'أصل وقف محفوظ' : 'Capital Preserved'}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-zinc-400 block mb-1 font-medium">{isAr ? 'العوائد التراكمية (YER)' : 'Accumulated Yield'}</span>
            <span className="text-sm font-black text-emerald-400 font-mono block">{formatYER(metrics.totalReturns)}</span>
            <span className="text-[9px] text-emerald-300 mt-1 block font-mono">ROI {metrics.weightedAvgRoi}%</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-zinc-400 block mb-1 font-medium">{isAr ? 'حصة الإغاثة السنوية' : 'Relief Yield (75%)'}</span>
            <span className="text-sm font-black text-blue-300 font-mono block">{formatYER(metrics.estimatedCharityTransfer)}</span>
            <span className="text-[9px] text-blue-400 mt-1 block">{isAr ? 'دعم الأيتام والسلال' : 'Orphan & Food Aid'}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-zinc-400 block mb-1 font-medium">{isAr ? 'حصة نمو الأصل (25%)' : 'Reinvestment Fund'}</span>
            <span className="text-sm font-black text-purple-300 font-mono block">{formatYER(metrics.estimatedReinvestment)}</span>
            <span className="text-[9px] text-purple-400 mt-1 block">{isAr ? 'توسعة أصول الوقف' : 'Endowment Growth'}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-zinc-400 block mb-1 font-medium">{isAr ? 'العقود النشطة' : 'Active Contracts'}</span>
            <span className="text-sm font-black text-amber-400 font-mono block">{metrics.activeContractsCount} {isAr ? 'عقود' : 'Leases'}</span>
            <span className="text-[9px] text-zinc-400 mt-1 block">{isAr ? 'إيجارات واستثمار' : 'Leases & O&M'}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-zinc-400 block mb-1 font-medium">{isAr ? 'الأنشطة التنفيذية' : 'Field Operations'}</span>
            <span className="text-sm font-black text-cyan-300 font-mono block">{metrics.activeActivitiesCount} {isAr ? 'عمليات' : 'Tasks'}</span>
            <span className="text-[9px] text-cyan-400 mt-1 block">{isAr ? 'صيانة وجني أرباح' : 'Maintenance & Yield'}</span>
          </div>
        </div>
      </div>

      {/* Enterprise Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveSubTab('portfolio')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'portfolio'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {isAr ? 'المحفظة الاستثمارية الشاملة' : 'Full Portfolio'}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">{projects.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('micro_investments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'micro_investments'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            {isAr ? 'الاستثمارات والأنشطة الصغرى (أراضٍ/عقارات/مقاولات)' : 'Micro-Investments OS'}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-200 font-mono font-bold">
              {projects.filter(p => p.category.startsWith('MICRO_') || p.capital_allocated_yer <= 50000000).length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('activities')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'activities'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            {isAr ? 'الأنشطة والعمليات التنفيذية' : 'Executive Operations'}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-zinc-700 font-mono text-slate-800 dark:text-slate-200">{activities.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('contracts')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'contracts'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            {isAr ? 'العقود وعقود الإيجار' : 'Contracts & Leases'}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-zinc-700 font-mono text-slate-800 dark:text-slate-200">{contracts.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('returns')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'returns'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            {isAr ? 'سجل العوائد والتوزيع' : 'Yield Distribution Ledger'}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-zinc-700 font-mono text-slate-800 dark:text-slate-200">{returnsHistory.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('governance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'governance'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isAr ? 'الحوكمة الشرعية والوقف' : 'Shariah & Governance'}
          </button>

          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'reports'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            {isAr ? 'التقارير والشهادات' : 'Audit Reports'}
          </button>
        </div>

        <button 
          onClick={fetchInvestmentData}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300 transition-all"
          title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* SUB-TAB 1: PORTFOLIO MATRIX */}
      {activeSubTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={isAr ? 'بحث بكود المشروع، الاسم، أو المحافظة...' : 'Search project code, name, or location...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-medium"
                >
                  <option value="ALL">{isAr ? 'جميع القطاعات الاستثمارية' : 'All Sectors'}</option>
                  <option value="REAL_ESTATE_ENDOWMENT">{isAr ? 'أوقاف عقارية وتجارية' : 'Real Estate Endowment'}</option>
                  <option value="AGRICULTURAL_PRODUCTIVE">{isAr ? 'زراعة وإنتاج حيواني' : 'Agricultural & Livestock'}</option>
                  <option value="SOCIAL_ENTERPRISE">{isAr ? 'مياه وبنية اجتماعية' : 'Commercial Water & Utility'}</option>
                  <option value="EQUITY_PORTFOLIO">{isAr ? 'صكوك واستثمارات مالية' : 'Sovereign Sukuk'}</option>
                  <option value="RENEWABLE_ENERGY">{isAr ? 'طاقة شمسية وبديلة' : 'Renewable Energy'}</option>
                  <option value="COMMERCIAL_TRADE">{isAr ? 'تمويل أصغر وتجارة' : 'Trade & Microfinance'}</option>
                </select>
              </div>

              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-medium"
              >
                <option value="ALL">{isAr ? 'جميع مستويات المخاطر' : 'All Risk Levels'}</option>
                <option value="LOW">{isAr ? 'مخاطر منخفضة (آمن جداً)' : 'Low Risk'}</option>
                <option value="MEDIUM">{isAr ? 'مخاطر متوسطة' : 'Medium Risk'}</option>
                <option value="HIGH">{isAr ? 'مخاطر عالية' : 'High Risk'}</option>
              </select>
            </div>
          </div>

          {/* Projects Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => {
              const catInfo = getCategoryLabel(p.category);
              const CatIcon = catInfo.icon;
              const projectContracts = contracts.filter(c => c.project_id === p.id);
              const projectActivities = activities.filter(a => a.project_id === p.id);

              return (
                <div key={p.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group">
                  <div className="p-5 space-y-4">
                    {/* Header Badge Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${catInfo.bg}`}>
                        <CatIcon className="w-3 h-3" />
                        {isAr ? catInfo.ar : catInfo.en}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                          {p.project_code}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {isAr ? 'وقف محصن' : 'Locked Asset'}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {isAr ? p.title_ar : p.title_en}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1">
                        <span>📍 {p.location_governorate}</span>
                        <span>•</span>
                        <span>{p.assigned_investment_manager}</span>
                      </p>
                    </div>

                    {/* Capital & Financial KPIs */}
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/80 rounded-xl space-y-2 border border-slate-100 dark:border-zinc-700/50">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'رأس المال المخصص (CapEx):' : 'CapEx Capital:'}</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">{formatYER(p.capital_allocated_yer)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'العوائد التراكمية المحققة:' : 'Accumulated Yield:'}</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatYER(p.accumulated_returns_yer)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'معدل العائد الفعلي (ROI):' : 'Actual ROI:'}</span>
                        <span className="font-black font-mono text-amber-600 dark:text-amber-400">{p.actual_roi_pct}% (IRR: {p.irr_pct}%)</span>
                      </div>
                    </div>

                    {/* Contracts & Operations Stats */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-amber-500/5 dark:bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{isAr ? 'العقود الموثقة' : 'Contracts'}</span>
                        <span className="font-bold text-amber-700 dark:text-amber-300 font-mono">{projectContracts.length} {isAr ? 'عقد استثمار' : 'Agreements'}</span>
                      </div>
                      <div className="p-2 bg-blue-500/5 dark:bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{isAr ? 'الأنشطة الميدانية' : 'Field Operations'}</span>
                        <span className="font-bold text-blue-700 dark:text-blue-300 font-mono">{projectActivities.length} {isAr ? 'نشاط' : 'Tasks'}</span>
                      </div>
                    </div>

                    {/* Governance Bar */}
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {isAr ? 'الشهادة الشرعية:' : 'Shariah Cert:'} <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{p.shariah_cert_number || 'SH-2025-001'}</span>
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {p.humanitarian_distribution_pct}% {isAr ? 'للإغاثة' : 'Relief'}
                      </span>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedProjectForAction(p);
                        setShowAddReturnModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      {isAr ? 'قيد عوائد' : 'Record Yield'}
                    </button>

                    <button
                      onClick={() => setSelectedProjectForCertificate(p)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {isAr ? 'الشهادة الشرعية' : 'Shariah Cert'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: MICRO-INVESTMENTS & FIELD OS (أراضٍ، عقارات، مقاولات) */}
      {activeSubTab === 'micro_investments' && (
        <div className="space-y-6 animate-fade-in">
          {/* Micro Investments Header & Quick Action Launcher */}
          <div className="bg-gradient-to-br from-amber-950 via-zinc-900 to-slate-900 p-6 rounded-2xl border border-amber-500/30 text-white space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    MICRO-INVESTMENT ACCELERATOR OS™
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {isAr ? 'عائد سريع وتوسع ذكي' : 'Smart High Yield'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-amber-400" />
                  {isAr ? 'نظام دعم وتوسيع الأنشطة الاستثمارية الصغرى' : 'Micro-Investments & Asset Expansion OS'}
                </h2>
                <p className="text-xs text-zinc-300 max-w-2xl mt-1 leading-relaxed">
                  {isAr 
                    ? 'إدارة متكاملة للأراضي الأوقافية الصغرى، دكاكين ومحلات الإيجارات، أعمال المقاولات والترميمات الميدانية، وتأجير معدات الحفر والإنتاج مع حصر بصائر الصكوك وتتبع التحصيل.'
                    : 'End-to-end management for micro land parcels, commercial shop leases, field renovation contracting, and machinery rentals with cadastral deed tracking.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setMicroType('LAND');
                    setMicroForm({
                      title_ar: 'قطع أرض أوقاف استثمارية تجارية جديدة',
                      category: 'MICRO_LAND_PARCEL',
                      location: 'مأرب - المجمع',
                      capital_yer: 25000000,
                      expected_roi_pct: 18.0,
                      area_size: '10 لبن تجارية (450 م²)',
                      deed_number: 'صك أوقاف 99120/2026',
                      boundaries_ar: 'شمالاً: شارع عام 20m، جنوباً: وقف، شرقاً: ملك، غرباً: شارع 12m',
                      tenant_or_contractor: 'مؤسسة الوقف العقارية',
                      contract_term_months: 36
                    });
                    setShowMicroWizardModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  {isAr ? 'إضافة أرض استثمارية' : '+ Land Plot'}
                </button>

                <button
                  onClick={() => {
                    setMicroType('CONTRACTING');
                    setMicroForm({
                      title_ar: 'مشروع ترميم وبناء المحلات الأوقافية بالمركز',
                      category: 'MICRO_CONTRACTING',
                      location: 'شبوة - عتق',
                      capital_yer: 18000000,
                      expected_roi_pct: 16.5,
                      area_size: 'مساحة بناء 320 م²',
                      deed_number: 'عقد مقاولة - CON-2026-09',
                      boundaries_ar: 'نطاق الترميم: الهيكل الخرساني والتشطيبات والواجهات الزجاجية',
                      tenant_or_contractor: 'شركة إعمار للمقاولات العامة',
                      contract_term_months: 6
                    });
                    setShowMicroWizardModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Hammer className="w-4 h-4" />
                  {isAr ? 'إضافة مقاولة وترميم' : '+ Contracting'}
                </button>

                <button
                  onClick={() => {
                    setMicroType('REAL_ESTATE');
                    setMicroForm({
                      title_ar: 'مجمع دكاكين ومحلات الإيجار الاستثماري',
                      category: 'MICRO_COMMERCIAL_SHOP',
                      location: 'حضرموت - سيئون',
                      capital_yer: 32000000,
                      expected_roi_pct: 17.5,
                      area_size: '8 محلات تجارية جاهزة',
                      deed_number: 'وثيقة ملكية وقفيّة - 44021',
                      boundaries_ar: 'الشارع الرئيسي المقابل للسوق العام',
                      tenant_or_contractor: 'سجل المستأجرين المعتمد',
                      contract_term_months: 12
                    });
                    setShowMicroWizardModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  {isAr ? 'إضافة محلات ودكاكين' : '+ Commercial Shop'}
                </button>
              </div>
            </div>

            {/* Micro Stats Quick Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-amber-500/20 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-zinc-400 block text-[10px]">{isAr ? 'رؤوس الأموال الصغرى المخصصة' : 'Micro Capital'}</span>
                <span className="text-sm font-bold text-amber-300 font-mono">
                  {formatYER(projects.filter(p => p.category.startsWith('MICRO_') || p.capital_allocated_yer <= 50000000).reduce((a, b) => a + Number(b.capital_allocated_yer), 0))}
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-zinc-400 block text-[10px]">{isAr ? 'متوسط العائد ROI الأنشطة الصغرى' : 'Average Micro ROI'}</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">16.8%</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-zinc-400 block text-[10px]">{isAr ? 'حيازة الأراضي والدكاكين' : 'Land & Shops Units'}</span>
                <span className="text-sm font-bold text-cyan-300 font-mono">42 {isAr ? 'وحدة وموقع' : 'Units'}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-zinc-400 block text-[10px]">{isAr ? 'توثيق البصائر والصكوك' : 'Cadastral Deeds'}</span>
                <span className="text-sm font-bold text-purple-300 font-mono">100% {isAr ? 'موثق شرعياً' : 'Verified'}</span>
              </div>
            </div>
          </div>

          {/* Micro Investments Filtered Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-500" />
                {isAr ? 'قائمة المشاريع والأنشطة الاستثمارية الصغرى (Micro-Investments Registry)' : 'Micro-Investments Registry'}
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {projects.filter(p => p.category.startsWith('MICRO_') || p.capital_allocated_yer <= 50000000).length} {isAr ? 'أنشطة استثمارية صغرى' : 'Micro Projects'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.filter(p => p.category.startsWith('MICRO_') || p.capital_allocated_yer <= 50000000).map((p) => {
                const catInfo = getCategoryLabel(p.category);
                const CatIcon = catInfo.icon;

                return (
                  <div key={p.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-500/20 dark:border-amber-500/20 shadow-sm hover:shadow-xl transition-all duration-300 p-5 space-y-4 relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${catInfo.bg}`}>
                          <CatIcon className="w-3 h-3" />
                          {isAr ? catInfo.ar : catInfo.en}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {p.project_code}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {isAr ? p.title_ar : p.title_en}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>{p.location_governorate}</span>
                          <span>•</span>
                          <span>{p.assigned_investment_manager}</span>
                        </p>
                      </div>

                      {/* Micro Specific Details Box */}
                      <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'رأس المال المخصص:' : 'Capital:'}</span>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">{formatYER(p.capital_allocated_yer)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'صافي الربح السنوي:' : 'Net Profit:'}</span>
                          <span className="font-bold font-mono text-emerald-600">{formatYER(p.net_annual_profit_yer)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'معدل العائد ROI:' : 'ROI:'}</span>
                          <span className="font-bold font-mono text-purple-600">{p.actual_roi_pct}%</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-amber-200/50 dark:border-amber-900/30">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'صك البصيرة/العقد:' : 'Deed/Cert:'}</span>
                          <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 font-bold">{p.shariah_cert_number || 'صك وقفي موثق'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {isAr ? 'أصل وقفي محفوظ' : 'Capital Preserved'}
                      </span>
                      <button
                        onClick={() => setSelectedProjectForAction(p)}
                        className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {isAr ? 'تفاصيل السجل والتراخيص' : 'Cadastral Log'}
                        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EXECUTIVE OPERATIONS & ACTIVITIES LOG */}
      {activeSubTab === 'activities' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                {isAr ? 'سجل الأنشطة التنفيذية والعمليات الميدانية' : 'Executive Operations & Field Activities Log'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? 'جدولة ومتابعة عمليات الصيانة، جني المحاصيل، تحصيل الإيجارات، وتوزيع عوائد الصكوك.' : 'Scheduling and monitoring maintenance, harvest extraction, rental collections, and coupon disbursements.'}
              </p>
            </div>

            <button
              onClick={() => setShowAddActivityModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-900/20"
            >
              <Plus className="w-4 h-4" />
              {isAr ? 'إضافة نشاط تنفيذي' : 'Schedule Activity'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-zinc-700">
                <tr>
                  <th className="p-3">{isAr ? 'كود النشاط' : 'Activity Code'}</th>
                  <th className="p-3">{isAr ? 'عنوان النشاط التنفيذي' : 'Executive Operation'}</th>
                  <th className="p-3">{isAr ? 'المشروع الاستثماري' : 'Project'}</th>
                  <th className="p-3">{isAr ? 'التاريخ المخطط' : 'Planned Date'}</th>
                  <th className="p-3">{isAr ? 'الميزانية المخصصة' : 'Allocated Budget'}</th>
                  <th className="p-3">{isAr ? 'المسؤول الميداني' : 'Assigned Lead'}</th>
                  <th className="p-3">{isAr ? 'حالة التنفيذ' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {activities.map((act) => {
                  const linkedProj = projects.find(p => p.id === act.project_id);
                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{act.activity_code}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">{isAr ? act.title_ar : act.title_en}</span>
                        {act.execution_notes_ar && (
                          <span className="text-[10px] text-slate-500 block">{act.execution_notes_ar}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{linkedProj ? (isAr ? linkedProj.title_ar : linkedProj.title_en) : 'مشروع استثماري'}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{act.planned_date}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatYER(act.budget_allocated_yer)}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{act.assigned_lead}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          act.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                          act.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                          'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {act.status === 'COMPLETED' ? (isAr ? 'مكتمل بنجاح' : 'Completed') :
                           act.status === 'IN_PROGRESS' ? (isAr ? 'قيد التنفيذ' : 'In Progress') : (isAr ? 'مجدول' : 'Scheduled')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CONTRACTS & LEASES LIFECYCLE */}
      {activeSubTab === 'contracts' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                {isAr ? 'عقود الاستثمار وعقود الإيجار الموثقة' : 'Contracts & Leases Lifecycle Management'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? 'إدارة عقود تأجير أصول الوقف، عقود التشغيل والصيانة O&M، وصكوك الوصاية الشرعية.' : 'Master tenant leases, O&M service agreements, and Shariah trust deeds.'}
              </p>
            </div>

            <button
              onClick={() => setShowAddContractModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-900/20"
            >
              <Plus className="w-4 h-4" />
              {isAr ? 'إضافة عقد جديد' : 'New Contract'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map((cnt) => {
              const linkedProj = projects.find(p => p.id === cnt.project_id);
              return (
                <div key={cnt.id} className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                      {cnt.contract_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {cnt.status === 'ACTIVE' ? (isAr ? 'عقد ساري المفعول' : 'Active') : cnt.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{isAr ? cnt.title_ar : cnt.title_en}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? 'الطرف الثاني:' : 'Counterparty:'} <strong className="text-slate-700 dark:text-slate-300">{cnt.second_party_name}</strong> ({cnt.second_party_type})
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/60 dark:border-zinc-700/60">
                    <div>
                      <span className="text-slate-500 block text-[10px]">{isAr ? 'قيمة العقد السنوية:' : 'Contract Value:'}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatYER(cnt.value_yer)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">{isAr ? 'فترة العقد:' : 'Period:'}</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{cnt.start_date} → {cnt.end_date}</span>
                    </div>
                  </div>

                  {cnt.notes_ar && (
                    <p className="text-[10px] text-slate-500 italic bg-white dark:bg-zinc-900 p-2 rounded-lg border border-slate-100 dark:border-zinc-800">
                      💡 {cnt.notes_ar}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: YIELD DISTRIBUTION LEDGER */}
      {activeSubTab === 'returns' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-500" />
                {isAr ? 'سجل توزيع الأرباح وحساب العوائد التنموية' : 'Yield Distribution Ledger & IPSAS Audit Trail'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? 'ترحيل العوائد المالية، خصم المصروفات التشغيلية، وقيد القيد المزدوج لتغذية الإغاثة وإعادة الاستثمار.' : 'Ingesting fiscal revenues, auditing OpEx, and posting double-entry splits to relief and reinvestment accounts.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-zinc-700">
                <tr>
                  <th className="p-3">{isAr ? 'الفترة المالية' : 'Fiscal Period'}</th>
                  <th className="p-3">{isAr ? 'المشروع الاستثماري' : 'Investment Project'}</th>
                  <th className="p-3">{isAr ? 'الإيرادات الإجمالية' : 'Gross Revenue'}</th>
                  <th className="p-3">{isAr ? 'المصروفات التشغيلية' : 'Op-Ex'}</th>
                  <th className="p-3">{isAr ? 'صافي الربح' : 'Net Profit'}</th>
                  <th className="p-3">{isAr ? 'المحول للإغاثة (75%)' : 'Charity Split'}</th>
                  <th className="p-3">{isAr ? 'إعادة الاستثمار (25%)' : 'Reinvestment Split'}</th>
                  <th className="p-3">{isAr ? 'التدقيق المالي' : 'Auditor'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {returnsHistory.map((ret) => {
                  const linkedProj = projects.find(p => p.id === ret.project_id);
                  return (
                    <tr key={ret.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{ret.fiscal_period}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{linkedProj ? (isAr ? linkedProj.title_ar : linkedProj.title_en) : 'مشروع وقف'}</td>
                      <td className="p-3 font-mono">{formatYER(ret.gross_revenue_yer)}</td>
                      <td className="p-3 font-mono text-rose-500">{formatYER(ret.operational_expenses_yer)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatYER(ret.net_profit_yer)}</td>
                      <td className="p-3 font-mono text-blue-600 dark:text-blue-400 font-bold">{formatYER(ret.transferred_to_charity_yer)}</td>
                      <td className="p-3 font-mono text-purple-600 dark:text-purple-400 font-bold">{formatYER(ret.reinvested_amount_yer)}</td>
                      <td className="p-3">
                        <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 block">
                          {ret.audited_by_cfo}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SHARIAH & GOVERNANCE */}
      {activeSubTab === 'governance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              {isAr ? 'ميثاق الحوكمة والرقابة الشرعية لأصول الأوقاف' : 'Endowment Shariah Governance Charter'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">1. شرط عدم المساس بأصل الوقف (Capital Lock)</span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  يُحظر حظراً باتاً استهلاك أو بيع أو رهين أصل الوقف التنموي، ويقتصر الصرف والإغناء على العوائد التشغيلية الأرباح الصافية فقط.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 space-y-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">2. معيار التوزيع المزدوج المعتمد (Dual Split)</span>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  تخصيص 70% إلى 85% من صافي العوائد لتمويل برامج كفالات الأيتام والسلال الغذائية، وتوجيه المتبقي لصندوق استدامة ونمو أصل الوقف.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{isAr ? 'أعضاء الهيئة الشرعية العليا للمؤسسة' : 'Board of Shariah Advisors'}</h4>
              <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <span>د. عبدالحكيم السقاف - رئيس لجنة الاستثمار والأوقاف الشرعية</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <span>أ. سالم عبدالله العولقي - المستشار المالي والشرعي العام</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <span>م. ناصر سعيد المعمري - خبير تقييم الأصول التنموية والمخاطر</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-500" />
              {isAr ? 'حساب مؤشر حماية الأصل والتحوط' : 'Preservation & Hedging Index'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-400">{isAr ? 'معدل الحماية الإجمالي:' : 'Capital Preservation:'}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">100.0%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-400">{isAr ? 'معامل التحوط من التضخم:' : 'Inflation Hedging:'}</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">+14.2%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-400">{isAr ? 'التدفق النقدي التشغيلي:' : 'Operating Cashflow:'}</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatYER(metrics.totalNetAnnualProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: EXECUTIVE REPORTS & CERTIFICATES */}
      {activeSubTab === 'reports' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-500" />
                {isAr ? 'مركز التقارير والشهادات الاستثمارية الرسمية' : 'Executive Reports & Shariah Certificate Hub'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? 'طباعة تقارير الأداء المالي، الشهادات الشرعية، وتصدير ملخصات المحفظة للجهات الرقابية.' : 'Generate printable audit reports, Shariah compliance deeds, and executive summaries.'}
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold flex items-center gap-2 shadow-md"
            >
              <Printer className="w-4 h-4" />
              {isAr ? 'طباعة التقرير الشامل' : 'Print Master Report'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 hover:border-emerald-500/50 transition-all">
              <Award className="w-6 h-6 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{isAr ? 'شهادة المطابقة والوصاية الشرعية' : 'Shariah Compliance Certificate'}</h4>
              <p className="text-[11px] text-slate-500">{isAr ? 'توثيق اعتماد الهيئة الشرعية لحظر مساس أصل الوقف وتوجيه الأرباح.' : 'Certifies endowment capital locking and Shariah profit split.'}</p>
              <button
                onClick={() => setSelectedProjectForCertificate(projects[0])}
                className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline block"
              >
                {isAr ? 'معاينة الشهادة الشرعية ←' : 'View Certificate →'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 hover:border-emerald-500/50 transition-all">
              <FileText className="w-6 h-6 text-blue-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{isAr ? 'تقرير الأداء والعائد ROI/IRR' : 'ROI & IRR Performance Report'}</h4>
              <p className="text-[11px] text-slate-500">{isAr ? 'تقرير تحليلي قياسي لأداء الأصول ومقارنة العائد المتوقع بالمحقق.' : 'Analytic performance report comparing expected vs actual yield.'}</p>
              <button onClick={() => window.print()} className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline block">
                {isAr ? 'تصدير التقرير ←' : 'Export Report →'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 hover:border-emerald-500/50 transition-all">
              <Coins className="w-6 h-6 text-purple-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{isAr ? 'كشف تحويلات العوائد للإغاثة' : 'Charity Yield Transfer Manifest'}</h4>
              <p className="text-[11px] text-slate-500">{isAr ? 'سجل تفصيلي بالقيد المالي المزدوج للتحويلات إلى حسابات الأيتام.' : 'Detailed journal voucher manifest feeding orphan & food aid.'}</p>
              <button onClick={() => window.print()} className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline block">
                {isAr ? 'طباعة الكشف ←' : 'Print Manifest →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW INVESTMENT PROJECT */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 my-8">
            <button
              onClick={() => setShowAddProjectModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'إضافة مشروع استثماري / أصول أوقاف جديدة' : 'Add Investment / Endowment Asset'}
                </h3>
                <p className="text-xs text-slate-500">{isAr ? 'اعتماد مشروع استثماري جديد وتأمين أصل الوقف شرعياً.' : 'Register project feasibility and lock capital under Shariah rules.'}</p>
              </div>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'كود المشروع' : 'Project Code'}</label>
                  <input
                    type="text"
                    value={newProjectForm.project_code}
                    onChange={(e) => setNewProjectForm({...newProjectForm, project_code: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'القطاع الاستثماري' : 'Sector'}</label>
                  <select
                    value={newProjectForm.category}
                    onChange={(e) => setNewProjectForm({...newProjectForm, category: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-medium"
                  >
                    <option value="REAL_ESTATE_ENDOWMENT">{isAr ? 'أوقاف عقارية وتجارية' : 'Real Estate'}</option>
                    <option value="AGRICULTURAL_PRODUCTIVE">{isAr ? 'زراعي وإنتاج حيواني' : 'Agricultural'}</option>
                    <option value="SOCIAL_ENTERPRISE">{isAr ? 'محطة مياه وبنية تحتية' : 'Commercial Water'}</option>
                    <option value="EQUITY_PORTFOLIO">{isAr ? 'صكوك واستثمارات سيادية' : 'Sovereign Sukuk'}</option>
                    <option value="RENEWABLE_ENERGY">{isAr ? 'طاقة شمسية وبديلة' : 'Renewable Solar'}</option>
                    <option value="COMMERCIAL_TRADE">{isAr ? 'تمويل اصغر وتجارة' : 'Trade & Microfinance'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'عنوان المشروع الاستثماري (بالعربية)' : 'Project Title (Arabic)'}</label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: وقف الإيمان التجاري الموحد - سيئون' : 'e.g. Al-Iman Endowment Complex'}
                  value={newProjectForm.title_ar}
                  onChange={(e) => setNewProjectForm({...newProjectForm, title_ar: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'رأس المال المخصص (CapEx YER)' : 'CapEx Capital (YER)'}</label>
                  <input
                    type="number"
                    value={newProjectForm.capital_allocated_yer}
                    onChange={(e) => setNewProjectForm({...newProjectForm, capital_allocated_yer: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'العائد السنوي المتوقع (Expected ROI %)' : 'Expected ROI %'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProjectForm.expected_roi_pct}
                    onChange={(e) => setNewProjectForm({...newProjectForm, expected_roi_pct: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'نسبة تحويل الإغاثة (%)' : 'Relief Split %'}</label>
                  <input
                    type="number"
                    value={newProjectForm.humanitarian_distribution_pct}
                    onChange={(e) => setNewProjectForm({...newProjectForm, humanitarian_distribution_pct: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'المحافظة / الموقع' : 'Governorate'}</label>
                  <input
                    type="text"
                    value={newProjectForm.location_governorate}
                    onChange={(e) => setNewProjectForm({...newProjectForm, location_governorate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isAr ? 'اعتماد وقفل أصل الوقف' : 'Approve & Lock Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CONTRACT / LEASE */}
      {showAddContractModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 my-8">
            <button
              onClick={() => setShowAddContractModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تسجيل عقد جديد (إيجار / تشغيل O&M / وصاية)' : 'New Investment Contract'}
                </h3>
                <p className="text-xs text-slate-500">{isAr ? 'توثيق العقود وتثبيت العوائد المستحقة.' : 'Document lease agreements and revenue collection schedules.'}</p>
              </div>
            </div>

            <form onSubmit={handleAddContract} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'المشروع المرتبط' : 'Linked Project'}</label>
                <select
                  value={newContractForm.project_id}
                  onChange={(e) => setNewContractForm({...newContractForm, project_id: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-semibold"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_code} - {isAr ? p.title_ar : p.title_en}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'عنوان العقد' : 'Contract Title'}</label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: عقد تأجير المحلات التجارية والمكاتب' : 'e.g. Master Lease Agreement'}
                  value={newContractForm.title_ar}
                  onChange={(e) => setNewContractForm({...newContractForm, title_ar: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الطرف الثاني (المستأجر/المشغل)' : 'Second Party'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'اسم الشركة أو المستأجر' : 'Entity Name'}
                    value={newContractForm.second_party_name}
                    onChange={(e) => setNewContractForm({...newContractForm, second_party_name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'القيمة السنوية (YER)' : 'Annual Value (YER)'}</label>
                  <input
                    type="number"
                    value={newContractForm.value_yer}
                    onChange={(e) => setNewContractForm({...newContractForm, value_yer: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'تاريخ البداية' : 'Start Date'}</label>
                  <input
                    type="date"
                    value={newContractForm.start_date}
                    onChange={(e) => setNewContractForm({...newContractForm, start_date: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'تاريخ الانتهاء' : 'End Date'}</label>
                  <input
                    type="date"
                    value={newContractForm.end_date}
                    onChange={(e) => setNewContractForm({...newContractForm, end_date: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddContractModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {isAr ? 'حفظ وتوثيق العقد' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EXECUTIVE ACTIVITY */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 my-8">
            <button
              onClick={() => setShowAddActivityModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'جدولة نشاط تنفيذي / عملية ميدانية' : 'Schedule Executive Field Operation'}
                </h3>
                <p className="text-xs text-slate-500">{isAr ? 'تعيين وتتبع عمليات الصيانة، التحصيل، أو جني المحاصيل.' : 'Assign and track maintenance or harvesting operations.'}</p>
              </div>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'المشروع المرتبط' : 'Linked Project'}</label>
                <select
                  value={newActivityForm.project_id}
                  onChange={(e) => setNewActivityForm({...newActivityForm, project_id: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-semibold"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_code} - {isAr ? p.title_ar : p.title_en}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'عنوان النشاط التنفيذي' : 'Activity Title'}</label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: جني موسم الزيتون أو صيانة الفلاتر' : 'e.g. Harvest season extraction'}
                  value={newActivityForm.title_ar}
                  onChange={(e) => setNewActivityForm({...newActivityForm, title_ar: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الميزانية المخصصة (YER)' : 'Budget (YER)'}</label>
                  <input
                    type="number"
                    value={newActivityForm.budget_allocated_yer}
                    onChange={(e) => setNewActivityForm({...newActivityForm, budget_allocated_yer: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'تاريخ التنفيذ المخطط' : 'Planned Date'}</label>
                  <input
                    type="date"
                    value={newActivityForm.planned_date}
                    onChange={(e) => setNewActivityForm({...newActivityForm, planned_date: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'المسؤول الميداني' : 'Assigned Engineer / Lead'}</label>
                <input
                  type="text"
                  value={newActivityForm.assigned_lead}
                  onChange={(e) => setNewActivityForm({...newActivityForm, assigned_lead: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddActivityModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isAr ? 'جدولة النشاط' : 'Schedule Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD FISCAL YIELD RETURN */}
      {showAddReturnModal && selectedProjectForAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 my-8">
            <button
              onClick={() => setShowAddReturnModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'قيد عوائد دورية للمشروع الاستثماري' : 'Record Fiscal Yield Return'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedProjectForAction.project_code} - {selectedProjectForAction.title_ar}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddReturn} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الفترة المالية (الربع/السنة)' : 'Fiscal Period'}
                </label>
                <input
                  type="text"
                  required
                  value={newReturnForm.fiscal_period}
                  onChange={(e) => setNewReturnForm({...newReturnForm, fiscal_period: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'إجمالي الإيرادات (YER)' : 'Gross Revenue'}
                  </label>
                  <input
                    type="number"
                    value={newReturnForm.gross_revenue_yer}
                    onChange={(e) => setNewReturnForm({...newReturnForm, gross_revenue_yer: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المصروفات التشغيلية (YER)' : 'Op-Ex'}
                  </label>
                  <input
                    type="number"
                    value={newReturnForm.operational_expenses_yer}
                    onChange={(e) => setNewReturnForm({...newReturnForm, operational_expenses_yer: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block">{isAr ? 'معاينة توزيع الأرباح تلقائياً:' : 'Auto Profit Split Preview:'}</span>
                <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>{isAr ? 'صافي الربح:' : 'Net Profit:'}</span>
                  <span>{formatYER(newReturnForm.gross_revenue_yer - newReturnForm.operational_expenses_yer)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-blue-600 dark:text-blue-400">
                  <span>{isAr ? 'حصة الإغاثة والكفالات:' : 'Relief Allocation:'}</span>
                  <span>{formatYER((newReturnForm.gross_revenue_yer - newReturnForm.operational_expenses_yer) * (selectedProjectForAction.humanitarian_distribution_pct / 100))}</span>
                </div>
                <div className="flex justify-between text-[11px] text-purple-600 dark:text-purple-400">
                  <span>{isAr ? 'حصة نمو أصل الوقف:' : 'Endowment Growth:'}</span>
                  <span>{formatYER((newReturnForm.gross_revenue_yer - newReturnForm.operational_expenses_yer) * (1 - selectedProjectForAction.humanitarian_distribution_pct / 100))}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReturnModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isAr ? 'تسجيل واعتماد التوزيع' : 'Record & Distribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PRINTABLE SHARIAH CERTIFICATE */}
      {selectedProjectForCertificate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-amber-50 text-slate-900 border-4 border-amber-500/40 rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative space-y-6 my-8 print:p-0 print:border-none print:shadow-none">
            <button
              onClick={() => setSelectedProjectForCertificate(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:bg-amber-200 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Header */}
            <div className="text-center space-y-2 border-b-2 border-amber-600/30 pb-4">
              <div className="flex justify-center mb-2">
                <Award className="w-12 h-12 text-amber-600" />
              </div>
              <h2 className="text-xl font-black text-amber-900 tracking-tight">
                جمعية رُحماء بينهم للعمل الإنساني والتنمية
              </h2>
              <p className="text-xs font-bold text-amber-700 uppercase font-mono tracking-widest">
                ROHAMA'A BAYNAHUM CHARITY FOUNDATION - SHARIAH ENDOWMENT BOARD
              </p>
              <h3 className="text-lg font-black text-emerald-800 pt-2">
                شهادة الاعتماد والمطابقة الشرعية لأصل الوقف التنموي
              </h3>
              <p className="text-xs font-mono font-bold text-amber-800">
                رقم الشهادة الشرعية: {selectedProjectForCertificate.shariah_cert_number || 'SH-2025-091'}
              </p>
            </div>

            {/* Certificate Content Body */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-800">
              <p className="text-justify font-medium">
                تُشهد الهيئة الشرعية العليا بالمؤسسة بأن المشروع الاستثماري المسمى:
              </p>
              <div className="p-3 bg-amber-100/60 rounded-xl border border-amber-300 text-center font-bold text-sm text-slate-900">
                {selectedProjectForCertificate.title_ar} ({selectedProjectForCertificate.project_code})
              </div>
              <p className="text-justify">
                قد تم فحص دراسات جدواه الفنية والمالية والشرعية، وتأكيد مطابقته التامة لأحكام الفقه الإسلامي ومقاصد الشريعة، وتم تقييده ورصده بشرط <strong>حظر المساس بأصل الوقف (Capital Lock)</strong> البالغ قدره:
              </p>
              <p className="text-center font-mono font-black text-base text-emerald-800 bg-emerald-100/60 p-2 rounded-lg border border-emerald-300">
                {formatYER(selectedProjectForCertificate.capital_allocated_yer)}
              </p>
              <p className="text-justify">
                كما يُعتمد توزيع العوائد بنسبة <strong>{selectedProjectForCertificate.humanitarian_distribution_pct}%</strong> لدعم برامج كفالات الأيتام والسلال الغذائية، وتخصيص المتبقي لصندوق استدامة ونمو أصل الوقف.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-amber-600/30 text-center text-xs">
              <div>
                <span className="block font-bold text-slate-700">رئيس الهيئة الشرعية العليا</span>
                <span className="block font-semibold text-emerald-800 mt-4">د. عبدالحكيم السقاف</span>
                <span className="text-[10px] text-slate-500 font-mono">ختم وتوقيع الاعتماد</span>
              </div>
              <div>
                <span className="block font-bold text-slate-700">المشرف المالي العام (CFO)</span>
                <span className="block font-semibold text-emerald-800 mt-4">أ. سالم عبدالله العولقي</span>
                <span className="text-[10px] text-slate-500 font-mono">التوثيق المالي والمحاسبي</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 flex items-center justify-end gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                {isAr ? 'طباعة الشهادة الرسمية' : 'Print Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: FEASIBILITY & ROI CALCULATOR HELPER */}
      {showFeasibilityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 my-8">
            <button
              onClick={() => setShowFeasibilityModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'حاسبة دراسة الجدوى ومشرع الاستثمار الوقفي' : 'Feasibility Study & Yield Calculator'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'تقدير العائد على الاستثمار ROI، صافي الربح السنوي، وتوزيع الحصص الإغاثية تلقائياً' : 'Automated ROI, CapEx/OpEx, and Relief distribution calculator'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'رأس المال المقترح (CapEx - YER)' : 'Proposed Capital'}</label>
                  <input
                    type="number"
                    value={newProjectForm.capex_yer}
                    onChange={(e) => {
                      const capex = Number(e.target.value);
                      setNewProjectForm({ ...newProjectForm, capex_yer: capex, capital_allocated_yer: capex });
                    }}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'المصروفات التشغيلية السنوية (OpEx)' : 'Annual OpEx'}</label>
                  <input
                    type="number"
                    value={newProjectForm.opex_annual_yer}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, opex_annual_yer: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'معدل العائد المتوقع ROI (%)' : 'Target ROI %'}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newProjectForm.expected_roi_pct}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, expected_roi_pct: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'نسبة تخصيص الإغاثة (%)' : 'Humanitarian Share %'}</label>
                  <input
                    type="number"
                    value={newProjectForm.humanitarian_distribution_pct}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, humanitarian_distribution_pct: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              {/* Live Feasibility Output Metrics Box */}
              {(() => {
                const estGrossAnnual = (newProjectForm.capex_yer * (newProjectForm.expected_roi_pct / 100)) + newProjectForm.opex_annual_yer;
                const estNetAnnual = newProjectForm.capex_yer * (newProjectForm.expected_roi_pct / 100);
                const estReliefShare = estNetAnnual * (newProjectForm.humanitarian_distribution_pct / 100);
                const estGrowthShare = estNetAnnual - estReliefShare;
                const paybackYears = estNetAnnual > 0 ? (newProjectForm.capex_yer / estNetAnnual).toFixed(1) : '—';

                return (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl space-y-2">
                    <h4 className="font-extrabold text-purple-900 dark:text-purple-300 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      {isAr ? 'نتائج الجدوى والمؤشرات المالية التقديرية:' : 'Feasibility Financial Indicators:'}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-purple-100 dark:border-zinc-800">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'الإيراد الإجمالي السنوي' : 'Gross Revenue'}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatYER(estGrossAnnual)}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-purple-100 dark:border-zinc-800">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'صافي الأرباح السنوية' : 'Net Annual Profit'}</span>
                        <span className="font-bold text-emerald-600">{formatYER(estNetAnnual)}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-purple-100 dark:border-zinc-800">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'حصة برامج الإغاثة' : 'Relief Transfer'}</span>
                        <span className="font-bold text-blue-600">{formatYER(estReliefShare)}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-purple-100 dark:border-zinc-800">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'فترة استرداد رأس المال' : 'Payback Period'}</span>
                        <span className="font-bold text-amber-600">{paybackYears} {isAr ? 'سنوات' : 'yrs'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFeasibilityModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFeasibilityModal(false);
                    setShowAddProjectModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  {isAr ? 'اعتماد النتائج وإنشاء المشروع' : 'Apply to New Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: SMART DOCUMENT ARCHIVING INTEGRATION (NEB-11) */}
      {showArchivingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 my-8">
            <button
              onClick={() => setShowArchivingModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="p-2.5 bg-slate-800 rounded-xl text-amber-400">
                <FolderCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'الأرشفة والتوثيق المؤسسي الموحد' : 'Unified Enterprise Archiving'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'فهرسة وأرشفة عقود الاستثمار ودراسات الجدوى مع القفل الأمني المعتمد' : 'Categorize & archive contracts, deeds, and feasibility studies'}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowArchivingModal(false);
                setNotification({
                  type: 'success',
                  message: isAr
                    ? `تمت أرشفة الوثيقة بنجاح في الأرشيف المؤسسي المعتمد تحت كود (${archiveFormState.project_code})`
                    : 'Document archived successfully into Enterprise Archive'
                });
                setTimeout(() => setNotification(null), 4000);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'عنوان الوثيقة / العقد' : 'Document Title'}</label>
                <input
                  type="text"
                  required
                  value={archiveFormState.doc_title}
                  onChange={(e) => setArchiveFormState({ ...archiveFormState, doc_title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'نوع الأرشيف' : 'Archive Category'}</label>
                  <select
                    value={archiveFormState.doc_type}
                    onChange={(e) => setArchiveFormState({ ...archiveFormState, doc_type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-semibold"
                  >
                    <option value="INVESTMENT_CONTRACT">{isAr ? 'عقد استثمار / ملكية' : 'Investment Contract'}</option>
                    <option value="FEASIBILITY_STUDY">{isAr ? 'دراسة جدوى وتقييم' : 'Feasibility Report'}</option>
                    <option value="SHARIAH_CERTIFICATE">{isAr ? 'شهادة مطابقة شرعية' : 'Shariah Certificate'}</option>
                    <option value="TITLE_DEED">{isAr ? 'بصيرة / صك أصل الوقف' : 'Endowment Title Deed'}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'كود المشروع المرتبط' : 'Project Code'}</label>
                  <input
                    type="text"
                    value={archiveFormState.project_code}
                    onChange={(e) => setArchiveFormState({ ...archiveFormState, project_code: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'مستوى السرية والصلاحيات' : 'Confidentiality Level'}</label>
                <select
                  value={archiveFormState.confidentiality_level}
                  onChange={(e) => setArchiveFormState({ ...archiveFormState, confidentiality_level: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-mono text-[11px]"
                >
                  <option value="CONFIDENTIAL_LEVEL_1">{isAr ? 'مستوى 1: عام للعرض بجميع الفروع' : 'Level 1: Public View'}</option>
                  <option value="CONFIDENTIAL_LEVEL_2">{isAr ? 'مستوى 2: مقتصر على مدير إدارة الاستثمار' : 'Level 2: Investment Department'}</option>
                  <option value="CONFIDENTIAL_LEVEL_3">{isAr ? 'مستوى 3: سري - مجلس الإدارة والمدير التنفيذي' : 'Level 3: Executive Board Only'}</option>
                  <option value="CONFIDENTIAL_LEVEL_4">{isAr ? 'مستوى 4: سيادي مشفر - الهيئة الشرعية العليا' : 'Level 4: Encrypted Shariah Board'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'ملاحظات الأرشفة والفرسنة' : 'Archiving Notes'}</label>
                <textarea
                  rows={2}
                  value={archiveFormState.archiving_notes}
                  onChange={(e) => setArchiveFormState({ ...archiveFormState, archiving_notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowArchivingModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-amber-400 font-bold flex items-center gap-1.5"
                >
                  <Archive className="w-4 h-4" />
                  {isAr ? 'حفظ وأرشفة الوثيقة' : 'Archive Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MICRO INVESTMENT WIZARD & CADASTRAL ENTRY */}
      {showMicroWizardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'معالج تسجيل وتوسع الأنشطة الاستثمارية الصغرى' : 'Micro-Investment & Land/Contracting Wizard'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {microType === 'LAND' && (isAr ? 'توثيق قطعة أرض وقفيّة استثمارية' : 'Land Parcel Registration')}
                    {microType === 'CONTRACTING' && (isAr ? 'مشروع مقاولة وترميم عقار وقفي' : 'Contracting & Renovation Project')}
                    {microType === 'REAL_ESTATE' && (isAr ? 'مجمع دكاكين ومحلات تجارية' : 'Commercial Shop Leasing')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMicroWizardModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newMicroProj: InvestmentProject = {
                  id: Date.now().toString(),
                  project_code: `MICRO-2026-${Math.floor(100 + Math.random() * 900)}`,
                  title_ar: microForm.title_ar,
                  title_en: microForm.title_ar,
                  category: microForm.category,
                  capital_allocated_yer: Number(microForm.capital_yer),
                  accumulated_returns_yer: Number(microForm.capital_yer) * (Number(microForm.expected_roi_pct) / 100),
                  net_annual_profit_yer: Number(microForm.capital_yer) * (Number(microForm.expected_roi_pct) / 100),
                  expected_roi_pct: Number(microForm.expected_roi_pct),
                  actual_roi_pct: Number(microForm.expected_roi_pct),
                  irr_pct: Number(microForm.expected_roi_pct) + 1.2,
                  occupancy_or_yield_pct: 100,
                  risk_level: 'LOW',
                  endowment_preservation_status: 'PRESERVED',
                  humanitarian_distribution_pct: 75,
                  assigned_investment_manager: 'م. ناصر سعيد المعمري',
                  approval_status: 'APPROVED',
                  security_clearance_level: 2,
                  location_governorate: microForm.location,
                  shariah_cert_number: microForm.deed_number,
                  capex_yer: Number(microForm.capital_yer),
                  opex_annual_yer: Number(microForm.capital_yer) * 0.05
                };

                setProjects([newMicroProj, ...projects]);
                setShowMicroWizardModal(false);
                setNotification({
                  type: 'success',
                  message: isAr ? 'تم تسجيل وتوثيق النشاط الاستثماري المصغر بنجاح في السجل الوقفي' : 'Micro-investment registered successfully in cadastral ledger'
                });
                setTimeout(() => setNotification(null), 4000);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم النشاط الاستثماري' : 'Activity Title'}
                </label>
                <input
                  type="text"
                  required
                  value={microForm.title_ar}
                  onChange={(e) => setMicroForm({ ...microForm, title_ar: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2.5 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تصنيف النشاط المصغر' : 'Micro Category'}
                  </label>
                  <select
                    value={microForm.category}
                    onChange={(e) => setMicroForm({ ...microForm, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-semibold"
                  >
                    <option value="MICRO_LAND_PARCEL">{isAr ? 'قطعة أرض وقفيّة تجارية' : 'Micro Land Plot'}</option>
                    <option value="MICRO_CONTRACTING">{isAr ? 'مقاولات وترميم عقارات' : 'Contracting & Renovation'}</option>
                    <option value="MICRO_COMMERCIAL_SHOP">{isAr ? 'محلات ودكاكين استثمارية' : 'Commercial Shop Units'}</option>
                    <option value="MICRO_EQUIPMENT_RENTAL">{isAr ? 'تأجير معدات وآلات' : 'Equipment Rental'}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الموقع الجغرافي / المحافظة' : 'Location'}
                  </label>
                  <input
                    type="text"
                    required
                    value={microForm.location}
                    onChange={(e) => setMicroForm({ ...microForm, location: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'رأس المال / التكلفة (YER)' : 'Capital (YER)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={microForm.capital_yer}
                    onChange={(e) => setMicroForm({ ...microForm, capital_yer: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'معدل العائد المتوقع ROI %' : 'Expected ROI %'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={microForm.expected_roi_pct}
                    onChange={(e) => setMicroForm({ ...microForm, expected_roi_pct: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-mono font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المساحة / عدد الوحدات' : 'Area / Units'}
                  </label>
                  <input
                    type="text"
                    value={microForm.area_size}
                    onChange={(e) => setMicroForm({ ...microForm, area_size: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'رقم الصك / عقد المقاولة' : 'Deed / Contract No.'}
                  </label>
                  <input
                    type="text"
                    value={microForm.deed_number}
                    onChange={(e) => setMicroForm({ ...microForm, deed_number: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 font-mono text-amber-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'حدود الأرض / نطاق المقاولة / المواصفات' : 'Boundaries & Scope'}
                </label>
                <textarea
                  rows={2}
                  value={microForm.boundaries_ar}
                  onChange={(e) => setMicroForm({ ...microForm, boundaries_ar: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMicroWizardModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black flex items-center gap-1.5 shadow-md"
                >
                  <MapPin className="w-4 h-4" />
                  {isAr ? 'حفظ وتوثيق النشاط المصغر' : 'Save Micro Investment'}
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
