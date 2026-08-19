import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Shield, 
  Check, 
  X,
  UserCheck,
  AlertTriangle,
  Warehouse,
  Box,
  Plus,
  Building,
  Briefcase,
  Tag,
  Activity,
  TrendingUp,
  Coins,
  CheckCircle2,
  PlusCircle,
  ClipboardList,
  MapPin,
  Layers,
  ArrowRightLeft,
  Wrench,
  Globe,
  Navigation,
  Clock,
  Calculator,
  Calendar,
  Sparkles,
  Info,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  FileText,
  Heart
} from 'lucide-react';
import { User, Role, Currency, Project } from '../types';
import { InventoryManagementView } from './InventoryManagementView';

interface ResourcesAssetsViewProps {
  users: User[];
  roles: Role[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
  projects?: Project[];
}

interface WarehouseData {
  id: string;
  name_ar: string;
  name_en: string;
  location_ar: string;
  location_en: string;
  manager_name: string;
  capacity: string;
  percentage_used: number;
}

export interface PayrollRecord {
  id: string;
  userId: string;
  employeeNameAr: string;
  employeeNameEn: string;
  department: string;
  basicSalary: number;
  fieldAllowance: number;
  hazardAllowance: number;
  deductions: number;
  netPayout: number;
  currency: 'YER' | 'USD' | 'SAR';
  status: 'DISBURSED' | 'PENDING' | 'PROCESSING';
  payoutDate: string;
}

export interface CustodianshipItem {
  id: string;
  itemCode: string;
  nameAr: string;
  nameEn: string;
  category: 'IT_LAPTOP' | 'VEHICLE' | 'COMMUNICATION' | 'FIELD_GEAR';
  assignedUserId?: string;
  assignedUserNameAr?: string;
  assignedUserNameEn?: string;
  assignedDate: string;
  serialNumber: string;
  condition: 'EXCELLENT' | 'GOOD' | 'NEEDS_MAINTENANCE';
  status: 'ASSIGNED' | 'IN_STOCK' | 'DECOMMISSIONED';
}

export interface VolunteerRecord {
  id: string;
  nameAr: string;
  nameEn: string;
  email: string;
  phone: string;
  regionAr: string;
  regionEn: string;
  skills: string[];
  totalHours: number;
  activeTasks: number;
  status: 'ACTIVE' | 'ON_MISSION' | 'INACTIVE';
  joinedDate: string;
}

interface InventoryItemData {
  id: string;
  name_ar: string;
  name_en: string;
  qty: number;
  unit_ar: string;
  unit_en: string;
  warehouse_id: string;
  category: string;
  value_yer: number;
  reorder_level?: number;
  batch_no?: string;
  expiry_date?: string;
}

interface StockMovementLog {
  id: string;
  date: string;
  time: string;
  itemId: string;
  itemNameAr: string;
  itemNameEn: string;
  type: 'RECEIVE' | 'DISBURSE' | 'TRANSFER';
  qty: number;
  unitAr: string;
  warehouseNameAr: string;
  warehouseNameEn: string;
  refNo: string;
  notes: string;
  user: string;
}

export interface EquipmentMaintenanceLog {
  id: string;
  asset_id: string;
  maintenance_date: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'OVERHAUL';
  description_ar: string;
  description_en: string;
  cost_yer: number;
  technician_or_center: string;
  is_capitalized: boolean; // إضافة للقيمة الدفترية للأصل
  next_maintenance_date?: string;
  invoice_ref?: string;
}

export interface FixedAssetData {
  id: string;
  name_ar: string;
  name_en: string;
  location_ar: string;
  location_en: string;
  purchase_date: string;
  original_cost: number;
  current_value: number; // Net Book Value
  status_ar: string;
  status_en: string;
  type: 'BUILDING' | 'VEHICLE' | 'LAND' | 'EQUIPMENT' | 'INFRASTRUCTURE';
  
  // Project & WBS Linking
  project_id?: string;
  project_name_ar?: string;
  project_name_en?: string;
  wbs_code?: string; // e.g. WBS-MAR-1.2.4
  wbs_activity_ar?: string;
  wbs_activity_en?: string;

  // Geospatial tracking
  latitude?: number;
  longitude?: number;
  gis_code?: string;
  region_ar?: string;
  region_en?: string;

  // Depreciation calculation & specs
  serial_number?: string;
  useful_life_years?: number;
  salvage_value?: number;
  accumulated_depreciation?: number;
  capitalized_maintenance_total?: number;
  custodian_ar?: string;
  custodian_en?: string;

  // Maintenance history
  maintenance_logs?: EquipmentMaintenanceLog[];
}

export function computeAssetFinancials(asset: FixedAssetData) {
  const originalCost = Number(asset.original_cost) || 0;
  
  const logs = asset.maintenance_logs || [];
  const capitalizedFromLogs = logs
    .filter(log => log.is_capitalized)
    .reduce((sum, log) => sum + (Number(log.cost_yer) || 0), 0);

  const totalCapitalized = (Number(asset.capitalized_maintenance_total) || 0) + capitalizedFromLogs;

  if (asset.type === 'LAND') {
    return {
      originalCost,
      totalCapitalized,
      accumulatedDepreciation: 0,
      netBookValue: originalCost + totalCapitalized,
      annualDepreciation: 0,
      elapsedYears: 0,
      usefulLife: 0
    };
  }

  const purchaseYear = asset.purchase_date ? new Date(asset.purchase_date).getFullYear() : 2024;
  const currentYear = new Date().getFullYear();
  const elapsedYears = Math.max(0, currentYear - purchaseYear);

  const defaultLife = asset.type === 'VEHICLE' ? 5 : asset.type === 'EQUIPMENT' ? 5 : 25;
  const usefulLife = Number(asset.useful_life_years) || defaultLife;
  const salvageVal = Number(asset.salvage_value) || 0;
  
  const depreciableBase = Math.max(0, originalCost - salvageVal);
  const annualDepreciation = usefulLife > 0 ? depreciableBase / usefulLife : depreciableBase * 0.1;

  const calculatedAccumDep = Math.min(depreciableBase, Math.floor(elapsedYears * annualDepreciation));
  const accumulatedDepreciation = asset.accumulated_depreciation !== undefined 
    ? asset.accumulated_depreciation 
    : calculatedAccumDep;

  const netBookValue = Math.max(0, originalCost + totalCapitalized - accumulatedDepreciation);

  return {
    originalCost,
    totalCapitalized,
    accumulatedDepreciation,
    netBookValue,
    annualDepreciation: Math.round(annualDepreciation),
    elapsedYears,
    usefulLife
  };
}

export const ROLE_PROFILES = [
  { code: 'FINANCE_MANAGER', labelAr: 'المدير المالي (CFO)', labelEn: 'Finance Manager / CFO', dept: 'FINANCE', pos: 'CFO', level: 4, canApprove: true, amount: '10000000' },
  { code: 'PROJECT_COORDINATOR', labelAr: 'منسق الميدان والعمليات', labelEn: 'Field Ops Coordinator', dept: 'OPERATIONS', pos: 'FIELD_COORD', level: 3, canApprove: false, amount: '0' },
  { code: 'PMO_LEAD', labelAr: 'مدير إدارة المشاريع (PMO)', labelEn: 'PMO Director', dept: 'PROGRAMS', pos: 'PMO_LEAD', level: 4, canApprove: true, amount: '3000000' },
  { code: 'SOCIAL_WELFARE', labelAr: 'أخصائي رعاية اجتماعية وكفالات', labelEn: 'Social Welfare & Sponsorships', dept: 'WELFARE', pos: 'WELFARE_SPEC', level: 3, canApprove: false, amount: '0' },
  { code: 'EXECUTIVE_DIRECTOR', labelAr: 'المدير التنفيذي (CEO)', labelEn: 'Executive Director / CEO', dept: 'MANAGEMENT', pos: 'DIRECTOR_EXEC', level: 5, canApprove: true, amount: '50000000' }
];

export default function ResourcesAssetsView({ users, roles, loading, onRefresh, lang, projects = [] }: ResourcesAssetsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'personnel' | 'payroll' | 'custodianship' | 'volunteers' | 'inventory' | 'assets'>('personnel');
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('ALL');
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Payroll records state
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([
    {
      id: 'pr-1',
      userId: 'u-1',
      employeeNameAr: 'م. عبدالرحمن الصهباني',
      employeeNameEn: 'Eng. Abdulrahman Al-Sahbani',
      department: 'Operations & Field',
      basicSalary: 350000,
      fieldAllowance: 75000,
      hazardAllowance: 50000,
      deductions: 15000,
      netPayout: 460000,
      currency: 'YER',
      status: 'DISBURSED',
      payoutDate: '2026-08-01'
    },
    {
      id: 'pr-2',
      userId: 'u-2',
      employeeNameAr: 'أ. فاطمة أحمد العريقي',
      employeeNameEn: 'Ms. Fatima Ahmed Al-Ariqi',
      department: 'Beneficiaries & Services',
      basicSalary: 320000,
      fieldAllowance: 60000,
      hazardAllowance: 30000,
      deductions: 12000,
      netPayout: 398000,
      currency: 'YER',
      status: 'DISBURSED',
      payoutDate: '2026-08-01'
    },
    {
      id: 'pr-3',
      userId: 'u-3',
      employeeNameAr: 'د. صالح محسن باحويرث',
      employeeNameEn: 'Dr. Saleh Mohsen Bahuwait',
      department: 'AI & Impact',
      basicSalary: 450000,
      fieldAllowance: 50000,
      hazardAllowance: 20000,
      deductions: 20000,
      netPayout: 500000,
      currency: 'YER',
      status: 'PROCESSING',
      payoutDate: '2026-08-25'
    }
  ]);

  // Custodianship items state (عهد الموظفين)
  const [custodianshipItems, setCustodianshipItems] = useState<CustodianshipItem[]>([
    {
      id: 'cust-1',
      itemCode: 'AST-IT-101',
      nameAr: 'حاسوب محمول Dell Latitude 5530',
      nameEn: 'Dell Latitude 5530 Laptop',
      category: 'IT_LAPTOP',
      assignedUserId: 'u-1',
      assignedUserNameAr: 'م. عبدالرحمن الصهباني',
      assignedUserNameEn: 'Eng. Abdulrahman Al-Sahbani',
      assignedDate: '2025-03-15',
      serialNumber: 'DL-5530-98821',
      condition: 'EXCELLENT',
      status: 'ASSIGNED'
    },
    {
      id: 'cust-2',
      itemCode: 'AST-VEH-04',
      nameAr: 'سيارة دفع رباعي تويوتا لاندكروزر',
      nameEn: 'Toyota Land Cruiser 4x4 Field Vehicle',
      category: 'VEHICLE',
      assignedUserId: 'u-1',
      assignedUserNameAr: 'م. عبدالرحمن الصهباني',
      assignedUserNameEn: 'Eng. Abdulrahman Al-Sahbani',
      assignedDate: '2025-01-10',
      serialNumber: 'TY-LC-2024-441',
      condition: 'GOOD',
      status: 'ASSIGNED'
    },
    {
      id: 'cust-3',
      itemCode: 'AST-COM-12',
      nameAr: 'جهاز اتصال فضائي ثريا SatPhone',
      nameEn: 'Thuraya Satellite Phone',
      category: 'COMMUNICATION',
      assignedUserId: 'u-2',
      assignedUserNameAr: 'أ. فاطمة أحمد العريقي',
      assignedUserNameEn: 'Ms. Fatima Ahmed Al-Ariqi',
      assignedDate: '2025-06-20',
      serialNumber: 'TH-SAT-88219',
      condition: 'EXCELLENT',
      status: 'ASSIGNED'
    }
  ]);

  // Volunteer records state (سجل المتطوعين والمهام الميدانية)
  const [volunteerRecords, setVolunteerRecords] = useState<VolunteerRecord[]>([
    {
      id: 'vol-1',
      nameAr: 'مختار سالم باعشن',
      nameEn: 'Mukhtar Salem Baashen',
      email: 'mukhtar.vol@rohmaab.org',
      phone: '+967 733 123 456',
      regionAr: 'مأرب - المركز الرئيسي',
      regionEn: 'Marib - Central',
      skills: ['التنسيق الميداني', 'توزيع السلال الغذائية', 'الإسعافات الأولية'],
      totalHours: 340,
      activeTasks: 4,
      status: 'ACTIVE',
      joinedDate: '2024-02-10'
    },
    {
      id: 'vol-2',
      nameAr: 'أروى محمد القدسي',
      nameEn: 'Arwa Mohammed Al-Qudsi',
      email: 'arwa.vol@rohmaab.org',
      phone: '+967 711 987 654',
      regionAr: 'تعز - القطاع الجنوبي',
      regionEn: 'Taiz - Southern Sector',
      skills: ['التوعية المجتمعية', 'الرصد والتقييم M&E', 'إعداد التقارير'],
      totalHours: 280,
      activeTasks: 2,
      status: 'ON_MISSION',
      joinedDate: '2024-05-15'
    },
    {
      id: 'vol-3',
      nameAr: 'سليمان ناصر الحاشدي',
      nameEn: 'Sulaiman Nasser Al-Hashidi',
      email: 'sulaiman.vol@rohmaab.org',
      phone: '+967 777 456 789',
      regionAr: 'إب - قطاع المرتفعات',
      regionEn: 'Ibb - Highlands Sector',
      skills: ['اللوجستيات ونقل المساعدات', 'إدارة المستودعات', 'الصيانة الميدانية'],
      totalHours: 410,
      activeTasks: 3,
      status: 'ACTIVE',
      joinedDate: '2023-11-20'
    }
  ]);
  
  // Backends & fallback data
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemData[]>([]);
  const [fixedAssets, setFixedAssets] = useState<FixedAssetData[]>([]);
  const [fetchingSub, setFetchingSub] = useState(false);

  // Maintenance logs modal states
  const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = useState<FixedAssetData | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceBanner, setMaintenanceBanner] = useState<string | null>(null);
  const [newLogForm, setNewLogForm] = useState({
    type: 'PREVENTIVE' as 'PREVENTIVE' | 'CORRECTIVE' | 'OVERHAUL',
    descriptionAr: '',
    descriptionEn: '',
    costYer: '500000',
    technician: 'المركز الفني الهندسي المعتمد',
    isCapitalized: false,
    nextMaintenanceDate: '2026-12-31',
    invoiceRef: 'INV-MAINT-2026-001'
  });

  // Geospatial GIS modal state
  const [selectedAssetForGis, setSelectedAssetForGis] = useState<FixedAssetData | null>(null);
  const [isGisModalOpen, setIsGisModalOpen] = useState(false);

  // Modal for Users
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);

  // User form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [defaultLanguage, setDefaultLanguage] = useState('ar');
  const [securityLevel, setSecurityLevel] = useState(3);
  const [departmentCode, setDepartmentCode] = useState('');
  const [positionCode, setPositionCode] = useState('');
  const [canApprove, setCanApprove] = useState(false);
  const [maxApprovalAmount, setMaxApprovalAmount] = useState('0');
  const [roleProfile, setRoleProfile] = useState('');

  // Modal for Stock Movement
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockForm, setStockForm] = useState({
    itemId: '',
    warehouseId: '',
    qty: '50',
    type: 'DISBURSE' as 'RECEIVE' | 'DISBURSE',
    notes: ''
  });
  const [stockSubmitting, setStockSubmitting] = useState(false);

  // New Item & Warehouse Modal States
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    nameAr: '',
    nameEn: '',
    qty: '500',
    unitAr: 'سلة',
    unitEn: 'basket',
    warehouseId: '',
    category: 'FOOD_AID',
    unitValueYer: '25000',
    reorderLevel: '200',
    batchNo: 'BATCH-2026-09',
    expiryDate: '2027-12-31'
  });

  const [isNewWarehouseModalOpen, setIsNewWarehouseModalOpen] = useState(false);
  const [newWarehouseForm, setNewWarehouseForm] = useState({
    nameAr: '',
    nameEn: '',
    locationAr: '',
    locationEn: '',
    managerName: '',
    capacity: '10,000 m³'
  });

  // Stock Movement Audit History Log State
  const [stockMovements, setStockMovements] = useState<StockMovementLog[]>([
    {
      id: 'sm-1',
      date: new Date().toISOString().substring(0, 10),
      time: '11:30',
      itemId: 'inv-1',
      itemNameAr: 'سلال غذائية متكاملة (دقيق، أرز، زيت، سكر)',
      itemNameEn: 'Complete Relief Food Baskets',
      type: 'RECEIVE',
      qty: 500,
      unitAr: 'سلة',
      warehouseNameAr: 'المستودع المركزي - مأرب الرئيسي',
      warehouseNameEn: 'Central Warehouse - Marib HQ',
      refNo: 'GRN-2026-088',
      notes: 'توريد من منحة مركز الملك سلمان للإغاثة',
      user: 'أمين المستودع'
    },
    {
      id: 'sm-2',
      date: new Date().toISOString().substring(0, 10),
      time: '09:15',
      itemId: 'inv-2',
      itemNameAr: 'وجبات تغذية جافة مخصصة للأطفال والأمهات',
      itemNameEn: 'Dry Nutritional Meals (Infant & Mother)',
      type: 'DISBURSE',
      qty: 1200,
      unitAr: 'وجبة',
      warehouseNameAr: 'مستودع الساحل الغربي - الحديدة',
      warehouseNameEn: 'West Coast Warehouse - Al Hudaydah',
      refNo: 'SARF-2026-104',
      notes: 'صرف عاجل لمخيم النازحين بمديرية الخوخة',
      user: 'مدير اللوجستيات'
    }
  ]);

  // Modal for Fixed Asset
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({
    nameAr: '',
    nameEn: '',
    locationAr: '',
    locationEn: '',
    originalCost: '10000000',
    purchaseDate: new Date().toISOString().substring(0, 10),
    type: 'EQUIPMENT' as 'BUILDING' | 'VEHICLE' | 'LAND' | 'EQUIPMENT' | 'INFRASTRUCTURE',
    statusAr: 'نشط ومستغل',
    statusEn: 'ACTIVE & OPERATIONAL',
    projectId: '',
    wbsCode: 'WBS-MAR-1.2.4',
    wbsActivityAr: 'حفر الآبار ومد شبكات المياه',
    wbsActivityEn: 'Artesian Well Drilling & Water Network',
    latitude: '15.4582',
    longitude: '45.3289',
    gisCode: 'GIS-YEM-MAR-WBS-102',
    serialNumber: 'SN-2026-NEB09-881',
    usefulLifeYears: '8',
    salvageValue: '500000',
    custodian: 'م. عبدالغني العوامي'
  });
  const [assetSubmitting, setAssetSubmitting] = useState(false);

  const isRtl = lang === 'ar';

  // Fetch or initialize sub-domain data
  const fetchSubData = async () => {
    setFetchingSub(true);
    try {
      const [whRes, invRes, assetRes] = await Promise.all([
        fetch('/api/tables/warehouses'),
        fetch('/api/tables/inventory_items'),
        fetch('/api/tables/fixed_assets')
      ]);

      if (whRes.ok) {
        const whData = await whRes.json();
        setWarehouses(whData || []);
      } else {
        setWarehouses([]);
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        setInventoryItems(invData || []);
      } else {
        setInventoryItems([]);
      }

      if (assetRes.ok) {
        const assetData = await assetRes.json();
        setFixedAssets(assetData || []);
      } else {
        setFixedAssets([]);
      }
    } catch (err) {
      console.error('Error fetching inventory and assets tables:', err);
      setWarehouses([]);
      setInventoryItems([]);
      setFixedAssets([]);
    } finally {
      setFetchingSub(false);
    }
  };

  useEffect(() => {
    fetchSubData();
  }, []);

  // Mock initializers
  const getMockWarehouses = (): WarehouseData[] => [
    {
      id: 'wh-1',
      name_ar: 'المستودع المركزي - مأرب الرئيسي',
      name_en: 'Central Warehouse - Marib HQ',
      location_ar: 'مأرب - حي الروضة الموحد',
      location_en: 'Marib - Al Rawdah District',
      manager_name: 'أ. صالح العولقي',
      capacity: '12,000 m³',
      percentage_used: 68
    },
    {
      id: 'wh-2',
      name_ar: 'مستودع الساحل الغربي - الحديدة',
      name_en: 'West Coast Warehouse - Al Hudaydah',
      location_ar: 'الحديدة - شارع الميناء الرئيسي',
      location_en: 'Al Hudaydah - Main Port Road',
      manager_name: 'أ. يحيى عبده عمر',
      capacity: '8,000 m³',
      percentage_used: 42
    },
    {
      id: 'wh-3',
      name_ar: 'مستودع حضرموت المركزي',
      name_en: 'Hadramout Central Depot',
      location_ar: 'المكلا - منطقة خلف الصناعية',
      location_en: 'Mukalla - Khalaf Industrial Zone',
      manager_name: 'أ. عمر باوزير',
      capacity: '15,000 m³',
      percentage_used: 31
    }
  ];

  const getMockInventoryItems = (): InventoryItemData[] => [
    {
      id: 'inv-1',
      name_ar: 'سلال غذائية متكاملة (دقيق، أرز، زيت، سكر)',
      name_en: 'Complete Relief Food Baskets',
      qty: 2450,
      unit_ar: 'سلة',
      unit_en: 'basket',
      warehouse_id: 'wh-1',
      category: 'FOOD_AID',
      value_yer: 61250000
    },
    {
      id: 'inv-2',
      name_ar: 'وجبات تغذية جافة مخصصة للأطفال والأمهات',
      name_en: 'Dry Nutritional Meals (Infant & Mother)',
      qty: 12000,
      unit_ar: 'وجبة',
      unit_en: 'meal',
      warehouse_id: 'wh-2',
      category: 'NUTRITION',
      value_yer: 14400000
    },
    {
      id: 'inv-3',
      name_ar: 'بطانيات صوف وفرش إيواء شتوية مقاومة للماء',
      name_en: 'Thermal Blankets & Shelter Bedding Kits',
      qty: 3100,
      unit_ar: 'حقيبة shelter',
      unit_en: 'shelter kit',
      warehouse_id: 'wh-3',
      category: 'SHELTER',
      value_yer: 46500000
    },
    {
      id: 'inv-4',
      name_ar: 'أجهزة حاسوب مكتبية Core i5 للتمكين المهني',
      name_en: 'Core i5 PC Computers for Vocational Training',
      qty: 45,
      unit_ar: 'جهاز',
      unit_en: 'unit',
      warehouse_id: 'wh-1',
      category: 'EDUCATION_DEVICES',
      value_yer: 18000000
    },
    {
      id: 'inv-5',
      name_ar: 'مضادات حيوية ومحاليل وريدية طبية طارئة',
      name_en: 'Emergency Antibiotics & Medical IV Fluids',
      qty: 1200,
      unit_ar: 'كرتون طبي',
      unit_en: 'medical box',
      warehouse_id: 'wh-2',
      category: 'MEDICAL_STORES',
      value_yer: 9600000
    }
  ];

  const getMockFixedAssets = (): FixedAssetData[] => [
    {
      id: 'asset-1',
      name_ar: 'معدة حفر وهيدروليك ثقيلة (CAT 330D) لمشاريع الآبار',
      name_en: 'Caterpillar Heavy Hydraulic Excavator CAT 330D',
      location_ar: 'مأرب - موقع مشروع سد مأرب',
      location_en: 'Marib - Dam Water Works Site',
      purchase_date: '2022-03-15',
      original_cost: 85000000,
      current_value: 51500000,
      status_ar: 'شغالة وتخضع للصيانة الدورية',
      status_en: 'OPERATIONAL (UNDER SCHEDULED MAINTENANCE)',
      type: 'EQUIPMENT',
      serial_number: 'CAT-330D-YEM-8821',
      useful_life_years: 8,
      salvage_value: 5000000,
      project_id: 'prj-1',
      project_name_ar: 'مشروع حفر وتجهيز آبار المياه والمحميات بسد مأرب',
      project_name_en: 'Marib Dam Water Wells & Irrigation Project',
      wbs_code: 'WBS-MAR-1.2.4',
      wbs_activity_ar: 'حفر الآبار الارتوازية ومد شبكات الري الزراعي',
      wbs_activity_en: 'Drilling Artesian Wells & Irrigation Network',
      latitude: 15.4582,
      longitude: 45.3289,
      gis_code: 'GIS-YEM-MAR-WBS-102',
      region_ar: 'محافظة مأرب - مديرية الوادي',
      region_en: 'Marib Governorate - Al Wadi District',
      custodian_ar: 'م. عبدالغني العوامي - مدير الهندسة الميدانية',
      custodian_en: 'Eng. Abdulghani Al-Awami - Field Engineering Lead',
      capitalized_maintenance_total: 6500000,
      accumulated_depreciation: 40000000,
      maintenance_logs: [
        {
          id: 'log-101',
          asset_id: 'asset-1',
          maintenance_date: '2025-11-20',
          type: 'OVERHAUL',
          description_ar: 'تغيير مضخة الهيدروليك الرئيسية وعمرة الشاسيه بالكامل',
          description_en: 'Hydraulic main pump replacement & chassis overhaul',
          cost_yer: 6500000,
          technician_or_center: 'مركز كاتربيلر الفني المعتمد - مأرب',
          is_capitalized: true,
          next_maintenance_date: '2026-11-20',
          invoice_ref: 'CAT-INV-2025-099'
        },
        {
          id: 'log-102',
          asset_id: 'asset-1',
          maintenance_date: '2026-04-10',
          type: 'PREVENTIVE',
          description_ar: 'تغيير فلاتر الزيت والوقود واستبدال الزيوت الهيدروليكية',
          description_en: 'Oil and fuel filter replacements & hydraulic oil change',
          cost_yer: 450000,
          technician_or_center: 'فريق الصيانة الميدانية بالجمعية',
          is_capitalized: false,
          next_maintenance_date: '2026-10-10',
          invoice_ref: 'MAINT-SRV-2026-044'
        }
      ]
    },
    {
      id: 'asset-2',
      name_ar: 'شاحنة العيادة الطبية المتنقلة المزودة بأجهزة أشعة وسونار',
      name_en: 'Mobile Medical Clinic Truck with Ultrasound & X-Ray',
      location_ar: 'الحديدة - مديرية الخوخة بالساحل الغربي',
      location_en: 'Al Hudaydah - Al Khawkha West Coast',
      purchase_date: '2023-01-10',
      original_cost: 48000000,
      current_value: 27000000,
      status_ar: 'نشطة وميدانية 100%',
      status_en: 'ACTIVE IN FIELD MEDICAL MISSIONS',
      type: 'VEHICLE',
      serial_number: 'ISUZU-MED-2024-99',
      useful_life_years: 6,
      salvage_value: 3000000,
      project_id: 'prj-2',
      project_name_ar: 'برنامج الرعاية الصحية الطارئة وإغاثة الساحل الغربي',
      project_name_en: 'West Coast Emergency Mobile Health Project',
      wbs_code: 'WBS-HUD-2.1.1',
      wbs_activity_ar: 'تسيير العيادات المتنقلة بمديرية الخوخة وحيس',
      wbs_activity_en: 'Deploying Mobile Clinics in Al Khawkha & Hays',
      latitude: 13.8114,
      longitude: 42.8436,
      gis_code: 'GIS-YEM-HUD-WBS-204',
      region_ar: 'الساحل الغربي - الحديدة',
      region_en: 'West Coast - Al Hudaydah',
      custodian_ar: 'د. ياسمين الشميري - رئيسة الفريق الطبي',
      custodian_en: 'Dr. Yasmeen Al-Shumeiri - Medical Team Leader',
      capitalized_maintenance_total: 1500000,
      accumulated_depreciation: 22500000,
      maintenance_logs: [
        {
          id: 'log-201',
          asset_id: 'asset-2',
          maintenance_date: '2026-02-15',
          type: 'CORRECTIVE',
          description_ar: 'إصلاح جهاز السونار ومعايرة المولد الكهربائي الملحق',
          description_en: 'Ultrasound unit repair & generator calibration',
          cost_yer: 1200000,
          technician_or_center: 'الشركة اليمنية للأجهزة الطبية',
          is_capitalized: false,
          next_maintenance_date: '2026-08-15',
          invoice_ref: 'MED-SER-2026-102'
        }
      ]
    },
    {
      id: 'asset-3',
      name_ar: 'المقر الرئيسي والمجمع التدريبي لجمعية رحماء',
      name_en: 'Rohama Foundation HQ & Vocational Training Complex',
      location_ar: 'صنعاء - حي حدة السكني المعتمد',
      location_en: 'Sanaa - Hadda Residential Zone',
      purchase_date: '2019-05-01',
      original_cost: 180000000,
      current_value: 150000000,
      status_ar: 'مستغل بالكامل - ملك للجمعية',
      status_en: 'FULLY OPERATIONAL (OWNED)',
      type: 'BUILDING',
      serial_number: 'HQ-SAN-BLD-01',
      useful_life_years: 30,
      salvage_value: 20000000,
      project_id: 'prj-3',
      project_name_ar: 'مشروع التمكين المهني واستدامة المهارات',
      project_name_en: 'Vocational Empowerment & Skills Sustainability',
      wbs_code: 'WBS-SAN-3.0.1',
      wbs_activity_ar: 'تجهيز وتأهيل القاعات التدريبية المركزية',
      wbs_activity_en: 'Outfitting Central Training Halls',
      latitude: 15.3547,
      longitude: 44.2066,
      gis_code: 'GIS-YEM-SAN-HQ-001',
      region_ar: 'أمانة العاصمة - صنعاء',
      region_en: 'Capital Municipality - Sanaa',
      custodian_ar: 'أ. صالح العولقي - مدير الإدارة العامة',
      custodian_en: 'Saleh Al-Awlaqi - HQ General Director',
      capitalized_maintenance_total: 12000000,
      accumulated_depreciation: 42000000,
      maintenance_logs: [
        {
          id: 'log-301',
          asset_id: 'asset-3',
          maintenance_date: '2025-08-12',
          type: 'OVERHAUL',
          description_ar: 'تركيب منظومة طاقة شمسية مركزية قدرة 50 كيلووات وقواعد حماية',
          description_en: '50kW Central Solar Energy Installation & Roofing Upgrade',
          cost_yer: 12000000,
          technician_or_center: 'شركة الطاقة الشمسية المتجددة',
          is_capitalized: true,
          next_maintenance_date: '2027-08-12',
          invoice_ref: 'SOLAR-2025-50KW'
        }
      ]
    },
    {
      id: 'asset-4',
      name_ar: 'خوادم نكسورا المؤسسية المتكاملة وشبكة الاتصال السحابية',
      name_en: 'Nexora Core Enterprise Servers & Hybrid Cloud Infrastructure',
      location_ar: 'غرفة تقنية المعلومات والتحكم الموحد',
      location_en: 'HQ Core IT Server Room',
      purchase_date: '2024-11-20',
      original_cost: 15000000,
      current_value: 12200000,
      status_ar: 'نشط ومحمي سحابياً مع نسخ احتياطي',
      status_en: 'ACTIVE & BACKED UP TO NEON CLOUD',
      type: 'EQUIPMENT',
      serial_number: 'DELL-R750-SRV',
      useful_life_years: 5,
      salvage_value: 1000000,
      project_id: 'prj-4',
      project_name_ar: 'مشروع التحول الرقمي وإدارة البيانات المؤسسية',
      project_name_en: 'Enterprise Digital Transformation & Data Governance',
      wbs_code: 'WBS-SYS-4.2.0',
      wbs_activity_ar: 'ربط الفروع وقواعد بيانات Neon PostgreSQL',
      wbs_activity_en: 'Connecting Branch Nodes & Neon PostgreSQL DB',
      latitude: 15.3551,
      longitude: 44.2070,
      gis_code: 'GIS-YEM-SAN-IT-002',
      region_ar: 'المقر الرئيسي - صنعاء',
      region_en: 'HQ Complex - Sanaa',
      custodian_ar: 'م. وائل الحمادي - مدير تقنية المعلومات',
      custodian_en: 'Eng. Wael Al-Hammadi - IT Lead',
      capitalized_maintenance_total: 0,
      accumulated_depreciation: 2800000,
      maintenance_logs: [
        {
          id: 'log-401',
          asset_id: 'asset-4',
          maintenance_date: '2026-03-01',
          type: 'PREVENTIVE',
          description_ar: 'تنظيف وغسل فلاتر التبريد واستبدال بطاريات المولد UPS',
          description_en: 'Cooling filter cleaning & UPS battery replacement',
          cost_yer: 350000,
          technician_or_center: 'قسم تقنية المعلومات والشبكات',
          is_capitalized: false,
          next_maintenance_date: '2026-09-01',
          invoice_ref: 'IT-SRV-2026-011'
        }
      ]
    }
  ];

  // User form modal opener
  const applyRoleProfile = (code: string) => {
    setRoleProfile(code);
    if (code === 'CUSTOM' || !code) return;
    const prof = ROLE_PROFILES.find(r => r.code === code);
    if (prof) {
      setDepartmentCode(prof.dept);
      setPositionCode(prof.pos);
      setSecurityLevel(prof.level);
      setCanApprove(prof.canApprove);
      setMaxApprovalAmount(prof.amount);
    }
  };

  const openUserModal = (user: User | null = null) => {
    setSelectedUser(user);
    setUserFormError(null);
    if (user) {
      setEmail(user.email || '');
      setName(user.name || '');
      setNameAr(user.name_ar || '');
      setPhone(user.phone || '');
      setStatus(user.status || 'active');
      setDefaultLanguage(user.default_language || 'ar');
      setSecurityLevel(user.security_level || 3);
      setDepartmentCode(user.department_code || '');
      setPositionCode(user.position_code || '');
      setCanApprove(!!user.can_approve);
      setMaxApprovalAmount(user.max_approval_amount || '0');
      const matched = ROLE_PROFILES.find(r => r.pos === user.position_code && r.dept === user.department_code);
      setRoleProfile(matched ? matched.code : 'CUSTOM');
    } else {
      setEmail('');
      setName('');
      setNameAr('');
      setPhone('');
      setStatus('active');
      setDefaultLanguage('ar');
      setSecurityLevel(3);
      setDepartmentCode('');
      setPositionCode('');
      setCanApprove(false);
      setMaxApprovalAmount('0');
      setRoleProfile('');
    }
    setIsUserModalOpen(true);
  };

  // User Save handler
  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormSubmitting(true);
    setUserFormError(null);

    const payload = {
      email,
      name,
      name_ar: nameAr,
      phone,
      status,
      default_language: defaultLanguage,
      security_level: securityLevel,
      department_code: departmentCode || null,
      position_code: positionCode || null,
      can_approve: canApprove,
      max_approval_amount: parseFloat(maxApprovalAmount) || 0,
      password: selectedUser ? undefined : Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, '0')).join('')
    };

    try {
      const url = selectedUser 
        ? `/api/tables/users/${selectedUser.id}` 
        : `/api/tables/users`;
      
      const response = await fetch(url, {
        method: selectedUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save user.');
      }

      onRefresh();
      setIsUserModalOpen(false);
    } catch (err: any) {
      setUserFormError(err.message);
    } finally {
      setUserFormSubmitting(false);
    }
  };

  // Inventory Stock movement handler
  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStockSubmitting(true);
    setTimeout(() => {
      const qtyChange = parseInt(stockForm.qty) || 0;
      const targetItem = inventoryItems.find(i => i.id === stockForm.itemId);
      const targetWh = warehouses.find(w => w.id === stockForm.warehouseId);

      setInventoryItems(prev => prev.map(item => {
        if (item.id === stockForm.itemId) {
          const newQty = stockForm.type === 'RECEIVE' 
            ? item.qty + qtyChange 
            : Math.max(0, item.qty - qtyChange);
          const valPerUnit = item.value_yer / Math.max(1, item.qty);
          return {
            ...item,
            qty: newQty,
            value_yer: Math.round(newQty * valPerUnit)
          };
        }
        return item;
      }));

      if (targetItem) {
        const newLog: StockMovementLog = {
          id: `sm-${Date.now()}`,
          date: new Date().toISOString().substring(0, 10),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          itemId: targetItem.id,
          itemNameAr: targetItem.name_ar,
          itemNameEn: targetItem.name_en,
          type: stockForm.type,
          qty: qtyChange,
          unitAr: targetItem.unit_ar,
          warehouseNameAr: targetWh?.name_ar || 'المستودع الرئيسي',
          warehouseNameEn: targetWh?.name_en || 'Central Warehouse',
          refNo: stockForm.type === 'RECEIVE' ? `GRN-${Math.floor(1000 + Math.random() * 9000)}` : `SARF-${Math.floor(1000 + Math.random() * 9000)}`,
          notes: stockForm.notes || (isRtl ? 'حركة مخزنية معتمدة' : 'Approved stock movement'),
          user: isRtl ? 'أمين المستودع' : 'Warehouse Keeper'
        };
        setStockMovements(prev => [newLog, ...prev]);
      }

      setStockSubmitting(false);
      setIsStockModalOpen(false);
    }, 600);
  };

  // New Inventory Item submit handler
  const handleNewItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.nameAr.trim()) return;

    const qtyNum = parseInt(newItemForm.qty) || 0;
    const unitVal = parseInt(newItemForm.unitValueYer) || 0;
    const totalVal = qtyNum * unitVal;
    const targetWh = warehouses.find(w => w.id === (newItemForm.warehouseId || warehouses[0]?.id));

    const newItem: InventoryItemData = {
      id: `inv-${Date.now()}`,
      name_ar: newItemForm.nameAr.trim(),
      name_en: newItemForm.nameEn.trim() || newItemForm.nameAr.trim(),
      qty: qtyNum,
      unit_ar: newItemForm.unitAr.trim(),
      unit_en: newItemForm.unitEn.trim(),
      warehouse_id: newItemForm.warehouseId || warehouses[0]?.id || 'wh-1',
      category: newItemForm.category,
      value_yer: totalVal,
      reorder_level: parseInt(newItemForm.reorderLevel) || 100,
      batch_no: newItemForm.batchNo.trim(),
      expiry_date: newItemForm.expiryDate
    };

    setInventoryItems(prev => [newItem, ...prev]);

    const newLog: StockMovementLog = {
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
      refNo: `IN-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: isRtl ? 'تسجيل مادة مخزنية جديدة ورصيد افتتاح أول الموعد' : 'New inventory item initial stock setup',
      user: isRtl ? 'مدير المخازن' : 'Inventory Manager'
    };
    setStockMovements(prev => [newLog, ...prev]);

    setIsNewItemModalOpen(false);
    setNewItemForm({
      nameAr: '',
      nameEn: '',
      qty: '500',
      unitAr: 'سلة',
      unitEn: 'basket',
      warehouseId: '',
      category: 'FOOD_AID',
      unitValueYer: '25000',
      reorderLevel: '200',
      batchNo: 'BATCH-2026-09',
      expiryDate: '2027-12-31'
    });
  };

  // New Warehouse submit handler
  const handleNewWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouseForm.nameAr.trim()) return;

    const newWh: WarehouseData = {
      id: `wh-${Date.now()}`,
      name_ar: newWarehouseForm.nameAr.trim(),
      name_en: newWarehouseForm.nameEn.trim() || newWarehouseForm.nameAr.trim(),
      location_ar: newWarehouseForm.locationAr.trim() || 'اليمن',
      location_en: newWarehouseForm.locationEn.trim() || 'Yemen',
      manager_name: newWarehouseForm.managerName.trim() || (isRtl ? 'أمين المستودع' : 'Depot Manager'),
      capacity: newWarehouseForm.capacity.trim() || '10,000 m³',
      percentage_used: 10
    };

    setWarehouses(prev => [...prev, newWh]);
    setIsNewWarehouseModalOpen(false);
    setNewWarehouseForm({
      nameAr: '',
      nameEn: '',
      locationAr: '',
      locationEn: '',
      managerName: '',
      capacity: '10,000 m³'
    });
  };

  // Fixed Asset creation handler with WBS, GIS and Depreciation
  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAssetSubmitting(true);
    setTimeout(() => {
      const selectedProj = projects.find(p => p.id === assetForm.projectId);
      const origCost = parseFloat(assetForm.originalCost) || 0;
      const usefulLife = parseInt(assetForm.usefulLifeYears) || 8;
      const salvageVal = parseFloat(assetForm.salvageValue) || 0;
      
      const tempAsset: FixedAssetData = {
        id: `asset-${Date.now()}`,
        name_ar: assetForm.nameAr,
        name_en: assetForm.nameEn || assetForm.nameAr,
        location_ar: assetForm.locationAr,
        location_en: assetForm.locationEn || assetForm.locationAr,
        purchase_date: assetForm.purchaseDate,
        original_cost: origCost,
        current_value: origCost,
        status_ar: assetForm.statusAr,
        status_en: assetForm.statusEn,
        type: assetForm.type,
        serial_number: assetForm.serialNumber,
        useful_life_years: usefulLife,
        salvage_value: salvageVal,
        project_id: assetForm.projectId,
        project_name_ar: selectedProj?.name_ar || assetForm.wbsActivityAr,
        project_name_en: selectedProj?.name_en || assetForm.wbsActivityEn,
        wbs_code: assetForm.wbsCode,
        wbs_activity_ar: assetForm.wbsActivityAr,
        wbs_activity_en: assetForm.wbsActivityEn,
        latitude: parseFloat(assetForm.latitude) || 15.4582,
        longitude: parseFloat(assetForm.longitude) || 45.3289,
        gis_code: assetForm.gisCode,
        custodian_ar: assetForm.custodian,
        custodian_en: assetForm.custodian,
        maintenance_logs: [],
        capitalized_maintenance_total: 0,
        accumulated_depreciation: 0
      };

      const financials = computeAssetFinancials(tempAsset);
      tempAsset.current_value = financials.netBookValue;

      setFixedAssets(prev => [tempAsset, ...prev]);
      setAssetSubmitting(false);
      setIsAssetModalOpen(false);
    }, 800);
  };

  // Add equipment maintenance log handler (Auto Recalculates Net Book Value)
  const handleAddMaintenanceLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForMaintenance || !newLogForm.descriptionAr.trim()) return;

    const costNum = parseFloat(newLogForm.costYer) || 0;
    const newLog: EquipmentMaintenanceLog = {
      id: `log-${Date.now()}`,
      asset_id: selectedAssetForMaintenance.id,
      maintenance_date: new Date().toISOString().substring(0, 10),
      type: newLogForm.type,
      description_ar: newLogForm.descriptionAr.trim(),
      description_en: newLogForm.descriptionEn.trim() || newLogForm.descriptionAr.trim(),
      cost_yer: costNum,
      technician_or_center: newLogForm.technician || (isRtl ? 'فريق الصيانة الميدانية' : 'Field Maintenance Team'),
      is_capitalized: newLogForm.isCapitalized,
      next_maintenance_date: newLogForm.nextMaintenanceDate,
      invoice_ref: newLogForm.invoiceRef
    };

    setFixedAssets(prev => prev.map(asset => {
      if (asset.id === selectedAssetForMaintenance.id) {
        const updatedLogs = [newLog, ...(asset.maintenance_logs || [])];
        const updatedAsset = {
          ...asset,
          maintenance_logs: updatedLogs
        };
        const financials = computeAssetFinancials(updatedAsset);
        updatedAsset.current_value = financials.netBookValue;
        
        // Update selected asset reference for drawer live re-render
        setSelectedAssetForMaintenance(updatedAsset);
        return updatedAsset;
      }
      return asset;
    }));

    setMaintenanceBanner(
      isRtl
        ? `تم تسجيل الصيانة بنجاح. ${newLogForm.isCapitalized ? 'تمت إضافة التكلفة للقيمة الدفترية للأصل وتحديث صافي القيمة تلقائياً.' : 'تم تسجيل الصيانة كإثبات مصاريف تشغيلية.'}`
        : `Maintenance recorded successfully. ${newLogForm.isCapitalized ? 'Cost capitalized & Net Book Value auto-updated.' : 'Recorded as operational expense.'}`
    );

    setTimeout(() => {
      setMaintenanceBanner(null);
    }, 4000);

    setNewLogForm({
      type: 'PREVENTIVE',
      descriptionAr: '',
      descriptionEn: '',
      costYer: '500000',
      technician: 'المركز الفني الهندسي المعتمد',
      isCapitalized: false,
      nextMaintenanceDate: '2026-12-31',
      invoiceRef: `INV-MAINT-2026-${Math.floor(100 + Math.random() * 900)}`
    });
  };

  // Filtering for active view
  const filteredUsers = users.filter(user => {
    if (activeSubTab !== 'personnel') return false;
    return (
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.name_ar && user.name_ar.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone && user.phone.includes(searchTerm))
    );
  });

  const filteredInventory = inventoryItems.filter(item => {
    if (activeSubTab !== 'inventory') return false;
    const wh = warehouses.find(w => w.id === item.warehouse_id);
    const whNameAr = wh?.name_ar || '';
    const whNameEn = wh?.name_en || '';
    return (
      item.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      whNameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      whNameEn.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredAssets = fixedAssets.filter(asset => {
    if (activeSubTab !== 'assets') return false;
    
    // Type Filter
    if (assetTypeFilter !== 'ALL' && asset.type !== assetTypeFilter) {
      return false;
    }

    const term = searchTerm.toLowerCase();
    const wbsStr = asset.wbs_code || '';
    const projAr = asset.project_name_ar || '';
    const serialStr = asset.serial_number || '';
    const custodianStr = asset.custodian_ar || '';

    return (
      asset.name_ar.toLowerCase().includes(term) ||
      asset.name_en.toLowerCase().includes(term) ||
      asset.location_ar.toLowerCase().includes(term) ||
      asset.location_en.toLowerCase().includes(term) ||
      asset.type.toLowerCase().includes(term) ||
      wbsStr.toLowerCase().includes(term) ||
      projAr.toLowerCase().includes(term) ||
      serialStr.toLowerCase().includes(term) ||
      custodianStr.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header Area with Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            {isRtl ? 'نظام إدارة الموارد والأصول الثابتة' : 'Resource & Asset Management OS'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isRtl 
              ? 'إدارة متكاملة لهياكل الكادر البشري، مصفوفة الأصول والأوقاف الوقفية، وإدارة المستودعات والرقابة المخزنية.' 
              : 'Enterprise resource structure, physical & charitable fixed assets, and integrated warehouse control.'}
          </p>
        </div>

        {/* Dynamic primary action depending on active sub-tab */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'personnel' && (
            <button
              onClick={() => openUserModal(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة كادر جديد' : 'Register Staff'}</span>
            </button>
          )}
          {activeSubTab === 'inventory' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsNewItemModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'إضافة مادة جديدة' : 'Add New Item'}</span>
              </button>
              <button
                onClick={() => setIsNewWarehouseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Warehouse className="w-4 h-4 text-emerald-400" />
                <span>{isRtl ? 'تسجيل مستودع' : 'Register Depot'}</span>
              </button>
              <button
                onClick={() => {
                  setStockForm({
                    itemId: inventoryItems[0]?.id || '',
                    warehouseId: warehouses[0]?.id || '',
                    qty: '100',
                    type: 'DISBURSE',
                    notes: isRtl ? 'صرف مخزني عاجل لصالح الأسر المتضررة' : 'Emergency stock disbursement'
                  });
                  setIsStockModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/10 transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>{isRtl ? 'سند حركة مخزنية' : 'Movement Slip'}</span>
              </button>
            </div>
          )}
          {activeSubTab === 'assets' && (
            <button
              onClick={() => setIsAssetModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isRtl ? 'تسجيل أصل أو وقف جديد' : 'Register Asset/Endowment'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap border-b border-slate-200">
        <button
          onClick={() => { setActiveSubTab('personnel'); setSearchTerm(''); }}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'personnel' 
              ? 'border-emerald-600 text-emerald-600 bg-emerald-500/5' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isRtl ? 'الكادر والموظفين' : 'Personnel & Staff'}</span>
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-mono">
            {users.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveSubTab('payroll'); setSearchTerm(''); }}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'payroll' 
              ? 'border-emerald-600 text-emerald-600 bg-emerald-500/5' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>{isRtl ? 'الرواتب والمكافآت' : 'Payroll & Allowances'}</span>
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-mono font-bold">
            {payrollRecords.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveSubTab('custodianship'); setSearchTerm(''); }}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'custodianship' 
              ? 'border-emerald-600 text-emerald-600 bg-emerald-500/5' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{isRtl ? 'عهد ومستلزمات الكادر' : 'Custodianship & Gear'}</span>
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-mono">
            {custodianshipItems.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveSubTab('volunteers'); setSearchTerm(''); }}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'volunteers' 
              ? 'border-emerald-600 text-emerald-600 bg-emerald-500/5' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>{isRtl ? 'سجل المتطوعين الميداني' : 'Volunteer Force'}</span>
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-mono">
            {volunteerRecords.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveSubTab('inventory'); setSearchTerm(''); }}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'inventory' 
              ? 'border-emerald-600 text-emerald-600 bg-emerald-500/5' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>{isRtl ? 'المستودعات والمخزون' : 'Warehouses & Inventories'}</span>
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-mono">
            {inventoryItems.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveSubTab('assets'); setSearchTerm(''); }}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'assets' 
              ? 'border-emerald-600 text-emerald-600 bg-emerald-500/5' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>{isRtl ? 'مصفوفة الأصول والأوقاف' : 'Charitable & Fixed Assets'}</span>
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-mono">
            {fixedAssets.length}
          </span>
        </button>
      </div>

      {/* 3. Central Search Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className={`absolute top-2.5 w-4 h-4 text-zinc-400 ${isRtl ? 'right-3' : 'left-3'}`} />
          <input 
            type="text"
            placeholder={
              activeSubTab === 'personnel' 
                ? (isRtl ? 'ابحث باسم الموظف، البريد أو الهاتف...' : 'Search staff by name, email, phone...')
                : activeSubTab === 'payroll'
                  ? (isRtl ? 'ابحث باسم الموظف أو القسم في كشف الرواتب...' : 'Search employee or department in payroll...')
                  : activeSubTab === 'custodianship'
                    ? (isRtl ? 'ابحث باسم العهدة، الرقم التسلسلي أو اسم المستلم...' : 'Search custodianship gear or serial...')
                    : activeSubTab === 'volunteers'
                      ? (isRtl ? 'ابحث باسم المتطوع، المهارات أو المنطقة...' : 'Search volunteer by name, skills or region...')
                      : activeSubTab === 'inventory'
                        ? (isRtl ? 'ابحث باسم المادة المخزنية، مستودع الحفظ أو التصنيف...' : 'Search stock item, warehouse, or category...')
                        : (isRtl ? 'ابحث باسم الأصل الثابت، موقع الوقف أو رمز الأصل...' : 'Search fixed asset, endowment, or location...')
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all outline-none ${
              isRtl ? 'pl-4 pr-10' : 'pl-10 pr-4'
            }`}
          />
        </div>
      </div>

      {/* ==================== SUB-VIEW 1: PERSONNEL ==================== */}
      {activeSubTab === 'personnel' && (
        loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-white border border-slate-200 rounded-xl">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-400 font-medium">{isRtl ? 'جاري تحميل سجلات الموظفين...' : 'Loading personnel records...'}</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <div 
                key={user.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          user.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {user.status === 'active' ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'موقف' : 'Suspended')}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-mono">
                          Lvl {user.security_level}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-sm pt-1">
                        {isRtl ? (user.name_ar || user.name) : user.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-medium font-mono">{user.email}</p>
                    </div>
                  </div>

                  {/* Role and approval details */}
                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 space-y-2 text-[11px] text-slate-500 font-medium">
                    {user.phone && (
                      <p className="flex justify-between">
                        <span>{isRtl ? 'رقم التواصل:' : 'Phone:'}</span>
                        <span className="font-mono text-slate-700">{user.phone}</span>
                      </p>
                    )}
                    <p className="flex justify-between">
                      <span>{isRtl ? 'المكتب/القسم:' : 'Department:'}</span>
                      <span className="text-slate-700">{user.department_code || (isRtl ? 'غير محدد' : 'Not assigned')}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>{isRtl ? 'تفويض الاعتماد المالي:' : 'Can Approve Transactions:'}</span>
                      <span className={`font-bold ${user.can_approve ? 'text-emerald-600' : 'text-zinc-400'}`}>
                        {user.can_approve 
                          ? (isRtl ? `نعم (حتى ${user.max_approval_amount} ريال)` : `Yes (up to YER ${user.max_approval_amount})`)
                          : (isRtl ? 'لا يوجد تفويض' : 'No authorization')}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Action bar */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => openUserModal(user)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:text-white hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 rounded transition-all cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    <span>{isRtl ? 'تعديل السجل' : 'Edit Profile'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-12 rounded-xl text-center shadow-sm">
            <Users className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-sm font-extrabold text-slate-700">{isRtl ? 'لا توجد نتائج للموظفين' : 'No users found'}</h3>
            <p className="text-xs text-zinc-400 mt-1">{isRtl ? 'جرب تعديل كلمات البحث.' : 'Try adjusting your search criteria.'}</p>
          </div>
        )
      )}

      {/* ==================== SUB-VIEW: PAYROLL & ALLOWANCES ==================== */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'إجمالي الرواتب الشهرية والبدلات' : 'Total Monthly Payroll'}</span>
                <p className="text-xl font-black text-slate-900 font-mono">
                  {payrollRecords.reduce((acc, curr) => acc + curr.netPayout, 0).toLocaleString()} <span className="text-xs text-slate-500 font-sans">YER</span>
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'بدلات المخاطر والعمل الميداني' : 'Field & Hazard Allowances'}</span>
                <p className="text-xl font-black text-amber-600 font-mono">
                  {payrollRecords.reduce((acc, curr) => acc + curr.fieldAllowance + curr.hazardAllowance, 0).toLocaleString()} <span className="text-xs text-slate-500">YER</span>
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'حالة الصرف للشهر الحالي' : 'Payout Status'}</span>
                <p className="text-sm font-black text-emerald-600">
                  {isRtl ? 'معتمد ومصروف (85% مكتمل)' : 'Disbursed (85% Complete)'}
                </p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  {isRtl ? 'كشف رواتب الكادر والبدلات والمستحقات الميدانية' : 'Staff Payroll & Field Allowances Ledger'}
                </h4>
              </div>
              <button
                onClick={() => {
                  setToastNotification(isRtl ? 'تم اعتماد كشف الرواتب وإرسال سندات الصرف لنظام الخزينة بنجاح.' : 'Payroll batch approved and sent to treasury.');
                  setTimeout(() => setToastNotification(null), 4000);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
              >
                {isRtl ? 'إصدار وا اعتماد دفعة الرواتب' : 'Process Payroll Batch'}
              </button>
            </div>

            {toastNotification && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{toastNotification}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr className="bg-slate-900 text-amber-400 font-black text-[9px] uppercase border-b border-zinc-800">
                    <th className="p-3 rounded-s">{isRtl ? 'الموظف والقطاع' : 'Employee & Department'}</th>
                    <th className="p-3 text-center">{isRtl ? 'الراتب الأساسي' : 'Basic Salary'}</th>
                    <th className="p-3 text-center">{isRtl ? 'بدل ميداني' : 'Field Allowance'}</th>
                    <th className="p-3 text-center">{isRtl ? 'بدل مخاطر' : 'Hazard Pay'}</th>
                    <th className="p-3 text-center">{isRtl ? 'الخصومات' : 'Deductions'}</th>
                    <th className="p-3 text-center">{isRtl ? 'صافي المستحق' : 'Net Payout'}</th>
                    <th className="p-3 text-center rounded-e">{isRtl ? 'الحالة وتاريخ الصرف' : 'Status & Date'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-slate-700 font-semibold">
                  {payrollRecords.map(pr => (
                    <tr key={pr.id} className="hover:bg-slate-50 transition-all">
                      <td className="p-3">
                        <p className="font-extrabold text-slate-900">{isRtl ? pr.employeeNameAr : pr.employeeNameEn}</p>
                        <span className="text-[9px] text-slate-400 font-mono">{pr.department}</span>
                      </td>
                      <td className="p-3 text-center font-mono">{pr.basicSalary.toLocaleString()} {pr.currency}</td>
                      <td className="p-3 text-center font-mono text-emerald-600">+{pr.fieldAllowance.toLocaleString()}</td>
                      <td className="p-3 text-center font-mono text-amber-600">+{pr.hazardAllowance.toLocaleString()}</td>
                      <td className="p-3 text-center font-mono text-rose-600">-{pr.deductions.toLocaleString()}</td>
                      <td className="p-3 text-center font-mono font-black text-slate-900">{pr.netPayout.toLocaleString()} {pr.currency}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          pr.status === 'DISBURSED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {pr.status === 'DISBURSED' ? (isRtl ? 'تم الصرف' : 'Disbursed') : (isRtl ? 'قيد المعالجة' : 'Processing')}
                        </span>
                        <span className="block text-[9px] text-zinc-400 font-mono mt-0.5">{pr.payoutDate}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW: CUSTODIANSHIP & GEAR ==================== */}
      {activeSubTab === 'custodianship' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'إجمالي العهد العينية المسلمة' : 'Total Assigned Items'}</span>
                <p className="text-xl font-black text-slate-900 font-mono">{custodianshipItems.length} <span className="text-xs text-slate-500">assets</span></p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Shield className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'سيارات ومعدات ميدانية نشطة' : 'Active Vehicles & Gear'}</span>
                <p className="text-xl font-black text-emerald-600 font-mono">
                  {custodianshipItems.filter(i => i.category === 'VEHICLE' || i.category === 'COMMUNICATION').length}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Navigation className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'حالة سلامة الأصول' : 'Asset Condition Index'}</span>
                <p className="text-sm font-black text-emerald-600">
                  {isRtl ? 'ممتازة (مطابقة لنظام التدقيق)' : '100% Verified Good'}
                </p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  {isRtl ? 'سجل عهد الأجهزة والمعدات العينية المسلمة للكادر' : 'Staff Asset Custodianship & Equipment Ledger'}
                </h4>
              </div>
              <button
                onClick={() => {
                  const newItem: CustodianshipItem = {
                    id: `cust-${Date.now()}`,
                    itemCode: `AST-GEN-${Math.floor(Math.random() * 900 + 100)}`,
                    nameAr: 'جهاز لوحي ميداني Samsung Tab Active',
                    nameEn: 'Samsung Field Tablet',
                    category: 'IT_LAPTOP',
                    assignedUserId: users[0]?.id || 'u-1',
                    assignedUserNameAr: isRtl ? (users[0]?.name_ar || users[0]?.name || 'موظف ميداني') : 'Staff Member',
                    assignedUserNameEn: 'Staff Member',
                    assignedDate: new Date().toISOString().substring(0, 10),
                    serialNumber: `SM-TAB-${Math.floor(Math.random() * 90000 + 10000)}`,
                    condition: 'EXCELLENT',
                    status: 'ASSIGNED'
                  };
                  setCustodianshipItems([newItem, ...custodianshipItems]);
                  setToastNotification(isRtl ? 'تم تسجيل عهدة عينية جديدة بنجاح وترحيلها لسجل الموظف.' : 'New custodianship item assigned successfully.');
                  setTimeout(() => setToastNotification(null), 3000);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إضافة عهدة جديدة' : 'Assign New Custodianship'}</span>
              </button>
            </div>

            {toastNotification && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{toastNotification}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr className="bg-slate-900 text-amber-400 font-black text-[9px] uppercase border-b border-zinc-800">
                    <th className="p-3 rounded-s">{isRtl ? 'العهد والرمز التسلسلي' : 'Asset & Serial'}</th>
                    <th className="p-3">{isRtl ? 'التصنيف' : 'Category'}</th>
                    <th className="p-3">{isRtl ? 'الموظف المسؤول' : 'Assigned Custodian'}</th>
                    <th className="p-3 text-center">{isRtl ? 'تاريخ التسليم' : 'Assigned Date'}</th>
                    <th className="p-3 text-center">{isRtl ? 'الحالة الفنية' : 'Condition'}</th>
                    <th className="p-3 text-center rounded-e">{isRtl ? 'حالة العهدة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-slate-700 font-semibold">
                  {custodianshipItems.map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50 transition-all">
                      <td className="p-3">
                        <p className="font-extrabold text-slate-900">{isRtl ? cust.nameAr : cust.nameEn}</p>
                        <span className="text-[9px] text-slate-400 font-mono">{cust.itemCode} | S/N: {cust.serialNumber}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono border border-slate-200">
                          {cust.category}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {isRtl ? cust.assignedUserNameAr : cust.assignedUserNameEn}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600">{cust.assignedDate}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold border border-emerald-200">
                          {cust.condition}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold border border-blue-200">
                          {cust.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW: VOLUNTEER FORCE ==================== */}
      {activeSubTab === 'volunteers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'إجمالي المتطوعين المسجلين' : 'Registered Volunteers'}</span>
                <p className="text-xl font-black text-slate-900 font-mono">{volunteerRecords.length} <span className="text-xs text-slate-500">volunteers</span></p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Heart className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'إجمالي ساعات العمل التطوعي' : 'Total Volunteer Hours'}</span>
                <p className="text-xl font-black text-emerald-600 font-mono">
                  {volunteerRecords.reduce((acc, curr) => acc + curr.totalHours, 0).toLocaleString()} <span className="text-xs text-slate-500">hrs</span>
                </p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'المهام والأنشطة الميدانية النشطة' : 'Active Field Missions'}</span>
                <p className="text-xl font-black text-amber-600 font-mono">
                  {volunteerRecords.reduce((acc, curr) => acc + curr.activeTasks, 0)} <span className="text-xs text-slate-500">tasks</span>
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  {isRtl ? 'سجل المتطوعين والمهام الميدانية' : 'Volunteer Force & Field Tasks Registry'}
                </h4>
              </div>
              <button
                onClick={() => {
                  const newVol: VolunteerRecord = {
                    id: `vol-${Date.now()}`,
                    nameAr: 'م. إبراهيم فضل العبسي',
                    nameEn: 'Eng. Ibrahim Fadl Al-Absi',
                    email: 'ibrahim.vol@rohmaab.org',
                    phone: '+967 735 999 888',
                    regionAr: 'الساحل الغربي - المخا',
                    regionEn: 'West Coast - Al-Mokha',
                    skills: ['الاستجابة الإنسانية', 'التنسيق اللوجستي', 'التوثيق الميداني'],
                    totalHours: 120,
                    activeTasks: 2,
                    status: 'ACTIVE',
                    joinedDate: new Date().toISOString().substring(0, 10)
                  };
                  setVolunteerRecords([newVol, ...volunteerRecords]);
                  setToastNotification(isRtl ? 'تم تسجيل متطوع ميداني جديد وربطه بفرق العمليات بنجاح.' : 'New volunteer registered and linked to field operations.');
                  setTimeout(() => setToastNotification(null), 3000);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تسجيل متطوع جديد' : 'Register Volunteer'}</span>
              </button>
            </div>

            {toastNotification && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{toastNotification}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {volunteerRecords.map(vol => (
                <div key={vol.id} className="bg-slate-50/50 rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm hover:shadow transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        vol.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {vol.status === 'ACTIVE' ? (isRtl ? 'نشط ميدانياً' : 'Active Field') : (isRtl ? 'في مهمة حالية' : 'On Mission')}
                      </span>
                      <h3 className="font-extrabold text-slate-800 text-sm mt-1.5">{isRtl ? vol.nameAr : vol.nameEn}</h3>
                      <p className="text-[10px] text-zinc-400 font-mono">{vol.email} | {vol.phone}</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-[11px] text-slate-600 font-medium">
                    <p className="flex justify-between">
                      <span>{isRtl ? 'المنطقة والميدان:' : 'Region:'}</span>
                      <span className="font-bold text-slate-800">{isRtl ? vol.regionAr : vol.regionEn}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>{isRtl ? 'إجمالي الساعات:' : 'Total Hours:'}</span>
                      <span className="font-mono font-bold text-emerald-600">{vol.totalHours} hrs</span>
                    </p>
                    <p className="flex justify-between">
                      <span>{isRtl ? 'المهام النشطة:' : 'Active Tasks:'}</span>
                      <span className="font-mono font-bold text-amber-600">{vol.activeTasks} tasks</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500">{isRtl ? 'المهارات والخبرات الميدانية:' : 'Skills & Endorsements:'}</span>
                    <div className="flex flex-wrap gap-1">
                      {vol.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold border border-emerald-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW 2: INVENTORY ==================== */}
      {activeSubTab === 'inventory' && (
        <InventoryManagementView lang={lang} />
      )}
      {false && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'إجمالي الأصناف المخزنية' : 'Total Stock SKUs'}</span>
                <p className="text-xl font-black text-slate-900 font-mono">{inventoryItems.length} <span className="text-xs text-slate-500 font-sans">{isRtl ? 'مادة' : 'items'}</span></p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Box className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'القيمة الإجمالية التقديرية' : 'Total Inventory Valuation'}</span>
                <p className="text-xl font-black text-emerald-700 font-mono">
                  {inventoryItems.reduce((acc, curr) => acc + curr.value_yer, 0).toLocaleString()} <span className="text-xs text-slate-500">YER</span>
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'أصناف بحاجة لإعادة الطلب' : 'Low Stock / Reorder Alerts'}</span>
                <p className="text-xl font-black text-rose-600 font-mono">
                  {inventoryItems.filter(i => i.qty <= (i.reorder_level || 200)).length} <span className="text-xs text-rose-500 font-sans">{isRtl ? 'صنف حرج' : 'critical'}</span>
                </p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Warehouses capacity Overview Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'المستودعات والمخازن اللوجستية الميدانية' : 'Field Logistics Warehouses'}</span>
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warehouses.map(wh => (
                <div key={wh.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-emerald-600/10 text-emerald-600 rounded-xl">
                      <Warehouse className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200 font-bold">
                      {wh.capacity}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-xs">
                      {isRtl ? wh.name_ar : wh.name_en}
                    </h5>
                    <p className="text-[10px] text-zinc-400 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-zinc-400" />
                      <span>{isRtl ? wh.location_ar : wh.location_en}</span>
                    </p>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                      <span>{isRtl ? 'نسبة إشغال السعة' : 'Capacity Used'}</span>
                      <span className="font-mono text-emerald-600">{wh.percentage_used}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                        style={{ width: `${wh.percentage_used}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] text-zinc-400 font-medium pt-0.5">
                      {isRtl ? `أمناء المستودع: ${wh.manager_name}` : `Keeper: ${wh.manager_name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Inventory Stock Balances Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  {isRtl ? 'سجل الأرصدة والمخزون الميداني الحالي' : 'Live Inventory Stock Balances'}
                </h4>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-mono border border-emerald-200 font-bold">
                {isRtl ? 'مستودعات Neon النشطة' : 'Neon Active Depot'}
              </span>
            </div>

            {fetchingSub ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'جاري قراءة المخزن من السحابة...' : 'Reading cloud database...'}</p>
              </div>
            ) : filteredInventory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                  <thead>
                    <tr className="bg-slate-900 text-amber-400 font-black text-[9px] uppercase border-b border-zinc-800">
                      <th className="p-3 rounded-s">{isRtl ? 'مادة المخزون والتصنيف' : 'Item Name & Category'}</th>
                      <th className="p-3">{isRtl ? 'مستودع التخزين' : 'Warehouse Location'}</th>
                      <th className="p-3 text-center">{isRtl ? 'تاريخ الانتهاء / الدفعة' : 'Expiry / Batch'}</th>
                      <th className="p-3 text-center">{isRtl ? 'الرصيد المتاح' : 'Available Stock'}</th>
                      <th className="p-3 text-center">{isRtl ? 'حالة الطلب' : 'Reorder Status'}</th>
                      <th className="p-3 text-right">{isRtl ? 'القيمة التقديرية' : 'Approx Value'}</th>
                      <th className="p-3 text-center rounded-e">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-slate-700 font-semibold">
                    {filteredInventory.map(item => {
                      const wh = warehouses.find(w => w.id === item.warehouse_id);
                      const isLowStock = item.qty <= (item.reorder_level || 200);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-3">
                            <p className="font-extrabold text-slate-900">{isRtl ? item.name_ar : item.name_en}</p>
                            <span className="inline-block text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 mt-0.5">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">
                            {wh ? (isRtl ? wh.name_ar : wh.name_en) : 'Unassigned'}
                          </td>
                          <td className="p-3 text-center font-mono text-[10px] text-slate-500">
                            <div>{item.batch_no || 'BATCH-2026-01'}</div>
                            <div className="text-[9px] text-zinc-400">{item.expiry_date || '2027-12-31'}</div>
                          </td>
                          <td className="p-3 text-center font-mono font-black text-[11px] text-slate-900">
                            {item.qty.toLocaleString()} {isRtl ? item.unit_ar : item.unit_en}
                          </td>
                          <td className="p-3 text-center">
                            {isLowStock ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-extrabold animate-pulse">
                                {isRtl ? 'حرج: بحاجة لإعادة طلب' : 'Reorder Needed'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-extrabold">
                                {isRtl ? 'آمن وفير' : 'Sufficient'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-[11px] text-emerald-700">
                            {item.value_yer.toLocaleString()} YER
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setStockForm({
                                  itemId: item.id,
                                  warehouseId: item.warehouse_id,
                                  qty: '100',
                                  type: 'DISBURSE',
                                  notes: isRtl ? `صرف مخزني من ${item.name_ar}` : `Stock disbursement from ${item.name_en}`
                                });
                                setIsStockModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-extrabold cursor-pointer transition-colors"
                            >
                              {isRtl ? 'إذن حركة' : 'Movement'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400">
                <Box className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p>{isRtl ? 'لم يتم العثور على سلع مطابقة في المخازن.' : 'No matching items found in warehouse.'}</p>
              </div>
            )}
          </div>

          {/* Stock Movements Audit History Log Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  {isRtl ? 'سجل حركات وسندات المخزن المعتمدة (Audit Log)' : 'Stock Movements Audit Log'}
                </h4>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                {stockMovements.length} {isRtl ? 'سند حركة' : 'records'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black text-[9px] uppercase border-b border-slate-200">
                    <th className="p-2.5 rounded-s">{isRtl ? 'رقم السند والتاريخ' : 'Ref No & Date'}</th>
                    <th className="p-2.5">{isRtl ? 'المادة المخزنية' : 'Item Name'}</th>
                    <th className="p-2.5 text-center">{isRtl ? 'نوع الحركة' : 'Type'}</th>
                    <th className="p-2.5 text-center">{isRtl ? 'الكمية' : 'Qty'}</th>
                    <th className="p-2.5">{isRtl ? 'المستودع' : 'Warehouse'}</th>
                    <th className="p-2.5 rounded-e">{isRtl ? 'البيان والملاحظات' : 'Notes & User'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-slate-600 font-medium text-[11px]">
                  {stockMovements.map(sm => (
                    <tr key={sm.id} className="hover:bg-slate-50 transition-all">
                      <td className="p-2.5 font-mono">
                        <span className="font-black text-slate-800 block">{sm.refNo}</span>
                        <span className="text-[9px] text-zinc-400">{sm.date} - {sm.time}</span>
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {isRtl ? sm.itemNameAr : sm.itemNameEn}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                          sm.type === 'RECEIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {sm.type === 'RECEIVE' ? (isRtl ? 'توريد GRN' : 'Inbound') : (isRtl ? 'صرف SARF' : 'Outbound')}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-slate-900">
                        {sm.qty} {sm.unitAr}
                      </td>
                      <td className="p-2.5 text-slate-700">
                        {isRtl ? sm.warehouseNameAr : sm.warehouseNameEn}
                      </td>
                      <td className="p-2.5 text-[10px]">
                        <p className="text-slate-700">{sm.notes}</p>
                        <span className="text-[9px] text-zinc-400 font-bold">{sm.user}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== SUB-VIEW 3: FIXED ASSETS ==================== */}
      {activeSubTab === 'assets' && (
        <div className="space-y-6">
          
          {/* Summary KPIs for Fixed Assets */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-xl">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isRtl ? 'إجمالي القيمة الدفترية للأصول' : 'Total Net Book Value'}</p>
                <h4 className="text-sm font-black text-slate-900 font-mono pt-0.5">
                  YER {fixedAssets.reduce((sum, a) => sum + computeAssetFinancials(a).netBookValue, 0).toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-amber-600/10 text-amber-600 rounded-xl">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isRtl ? 'إضافات الصيانة الرأسمالية' : 'Capitalized Overhauls'}</p>
                <h4 className="text-sm font-black text-amber-700 font-mono pt-0.5">
                  YER {fixedAssets.reduce((sum, a) => sum + computeAssetFinancials(a).totalCapitalized, 0).toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isRtl ? 'أصول مرتبطة بـ WBS المشاريع' : 'WBS Linked Assets'}</p>
                <h4 className="text-sm font-black text-slate-900 font-mono pt-0.5">
                  {fixedAssets.filter(a => a.wbs_code).length} {isRtl ? 'أصل مرتبط' : 'Linked Assets'}
                </h4>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{isRtl ? 'سجلات الصيانة العينية' : 'Maintenance Records'}</p>
                <h4 className="text-sm font-black text-slate-900 font-mono pt-0.5">
                  {fixedAssets.reduce((sum, a) => sum + (a.maintenance_logs?.length || 0), 0)} {isRtl ? 'عملية صيانة' : 'Logs recorded'}
                </h4>
              </div>
            </div>
          </div>

          {/* Asset Type Filter Strip */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
            <span className="text-[10px] text-slate-500 uppercase px-2">{isRtl ? 'تصنيف الأصول:' : 'Category:'}</span>
            {[
              { id: 'ALL', labelAr: 'جميع الأصول والعقارات', labelEn: 'All Assets' },
              { id: 'EQUIPMENT', labelAr: 'معدات وآلات عينية (Equipment)', labelEn: 'Equipment & Machinery' },
              { id: 'VEHICLE', labelAr: 'مركبات أسطول (Vehicles)', labelEn: 'Vehicles & Fleet' },
              { id: 'BUILDING', labelAr: 'مباني ومراكز (Buildings)', labelEn: 'Buildings & HQ' },
              { id: 'LAND', labelAr: 'أراضي وأوقاف (Land Plots)', labelEn: 'Land & Endowments' }
            ].map(typeItem => (
              <button
                key={typeItem.id}
                onClick={() => setAssetTypeFilter(typeItem.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  assetTypeFilter === typeItem.id
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {isRtl ? typeItem.labelAr : typeItem.labelEn}
              </button>
            ))}
          </div>

          {/* Assets Cards Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'مصفوفة الأصول الثابتة والأرضيات العينية والربط بالمشاريع' : 'Fixed Asset Ledger, WBS Linkage & Maintenance History'}</h4>
                  <p className="text-[10px] text-zinc-400 font-medium">{isRtl ? 'تحديث تلقائي صافي القيمة الدفترية وتتبع الموقع GIS لكل أصل' : 'Auto-updated Net Book Value & GIS Location Tracking for each asset'}</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 font-bold">{isRtl ? 'سجل الأصول المعتمد' : 'Verified Asset Ledger'}</span>
            </div>

            {filteredAssets.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAssets.map(asset => {
                  const financials = computeAssetFinancials(asset);
                  const logsCount = asset.maintenance_logs?.length || 0;

                  return (
                    <div key={asset.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                      <div className="space-y-3">
                        
                        {/* Type & Serial Header */}
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-emerald-600/15 border border-emerald-600/20 text-emerald-800 text-[9px] font-black rounded-lg uppercase">
                              {asset.type}
                            </span>
                            {asset.serial_number && (
                              <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                SN: {asset.serial_number}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            {asset.purchase_date}
                          </span>
                        </div>

                        {/* Title */}
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {isRtl ? asset.name_ar : asset.name_en}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>{isRtl ? asset.location_ar : asset.location_en}</span>
                          </p>
                        </div>

                        {/* WBS Linkage Box */}
                        {asset.wbs_code && (
                          <div className="bg-emerald-50/50 border border-emerald-200/60 p-3 rounded-xl space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-extrabold text-emerald-800 uppercase flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-emerald-600" />
                                {isRtl ? 'مرتبط بحزمة عمل WBS للمشروع:' : 'Linked Project WBS:'}
                              </span>
                              <span className="font-mono text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded">
                                {asset.wbs_code}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-800">
                              {isRtl ? asset.wbs_activity_ar : asset.wbs_activity_en}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {isRtl ? `المشروع: ${asset.project_name_ar}` : `Project: ${asset.project_name_en}`}
                            </p>
                          </div>
                        )}

                        {/* Geospatial GPS Location Pill */}
                        <div className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-xl text-[10px]">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                            <div>
                              <span className="text-zinc-400 font-medium block">{isRtl ? 'الإحداثيات الجغرافية (GIS):' : 'GIS Coordinates:'}</span>
                              <span className="font-mono text-slate-800 font-bold">
                                Lat: {asset.latitude || 15.4582}, Lng: {asset.longitude || 45.3289}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedAssetForGis(asset);
                              setIsGisModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>{isRtl ? 'عرض الخريطة' : 'View GIS Map'}</span>
                          </button>
                        </div>

                        {/* Financial Auto-calculated Breakdown Box */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500 font-bold uppercase">{isRtl ? 'تكلفة الشراء الأصلية:' : 'Original Cost:'}</span>
                            <span className="font-mono text-slate-800 font-bold">{financials.originalCost.toLocaleString()} YER</span>
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-amber-700 font-bold uppercase flex items-center gap-1">
                              <Plus className="w-3 h-3 text-amber-600" />
                              {isRtl ? 'إصلاحات رأسمالية مضافة:' : 'Capitalized Overhauls:'}
                            </span>
                            <span className="font-mono text-amber-700 font-bold">+{financials.totalCapitalized.toLocaleString()} YER</span>
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-rose-600 font-bold uppercase">{isRtl ? 'مجمع الإهلاك المتراكم:' : 'Accumulated Depreciation:'}</span>
                            <span className="font-mono text-rose-600 font-bold">-{financials.accumulatedDepreciation.toLocaleString()} YER</span>
                          </div>

                          <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-1">
                                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                                {isRtl ? 'صافي القيمة الدفترية الحالية (Net Book Value):' : 'Net Book Value:'}
                              </p>
                              <span className="text-[9px] text-emerald-600 font-extrabold">{isRtl ? 'محسوبة تلقائياً مع الصيانة' : 'Auto-calculated live'}</span>
                            </div>
                            <span className="font-mono text-emerald-700 font-black text-sm">
                              {financials.netBookValue.toLocaleString()} YER
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Equipment Maintenance Action Bar */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-600 font-bold">
                          <Wrench className="w-3.5 h-3.5 text-amber-600" />
                          <span>{logsCount} {isRtl ? 'عمليات صيانة مسجلة' : 'maintenance logs'}</span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedAssetForMaintenance(asset);
                            setIsMaintenanceModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'سجل الصيانة والإنفاق العيني (Logs)' : 'Equipment Maintenance Logs'}</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400">
                <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p>{isRtl ? 'لا توجد أصول مطابقة مسجلة.' : 'No registered assets found.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: USER FORM MODAL ==================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {selectedUser 
                    ? (isRtl ? 'تعديل سجل الصلاحيات والبيانات للموظف' : 'Edit Employee & Security Record') 
                    : (isRtl ? 'تسجيل موظف جديد وتحديد الصلاحيات' : 'Register New Personnel Profile')
                  }
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isRtl ? 'إكمال تفويضات الصلاحيات الأمنية والمالية بدقة' : 'Set precise system roles, security level thresholds, and approval bounds'}
                </p>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-zinc-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUserSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {userFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{userFormError}</span>
                </div>
              )}

              {/* Role Profile Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                  {isRtl ? 'ملف تعريف الدور والمسمى الوظيفي' : 'Role Profile / Job Template'}
                </label>
                <select
                  value={roleProfile}
                  onChange={(e) => applyRoleProfile(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="">{isRtl ? '-- اختر ملف تعريف الدور لتهيئة التوجيه التلقائي --' : '-- Select Role Profile to auto-configure --'}</option>
                  {ROLE_PROFILES.map((prof) => (
                    <option key={prof.code} value={prof.code}>
                      {isRtl ? prof.labelAr : prof.labelEn}
                    </option>
                  ))}
                  <option value="CUSTOM">{isRtl ? 'مخصص / تعديل يدوي' : 'Custom / Manual Override'}</option>
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {isRtl 
                    ? 'اختيار الدور يقوم بتهيئة الصلاحيات، القسم، المسمى الوظيفي، وحد الاعتماد المالي تلقائياً.' 
                    : 'Selecting a profile auto-populates department, security levels, and financial thresholds.'}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{isRtl ? 'البريد الإلكتروني المهني' : 'Work Email'}</label>
                <input 
                  type="email" 
                  required 
                  disabled={!!selectedUser}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. employee@erprbdcye.org"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-semibold text-slate-700 disabled:opacity-60"
                />
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{isRtl ? 'الاسم بالكامل (عربي)' : 'Arabic Full Name'}</label>
                  <input 
                    type="text" 
                    required 
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="e.g. أحمد علي مصلح"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{isRtl ? 'الاسم بالكامل (English)' : 'English Full Name'}</label>
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ahmed Ali Mosleh"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Phone, security level, language */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+967..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{isRtl ? 'المستوى الأمني للوصول' : 'Security Level'}</label>
                  <select 
                    value={securityLevel}
                    onChange={(e) => setSecurityLevel(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none text-slate-700 font-semibold cursor-pointer"
                  >
                    <option value={5}>{isRtl ? 'مستوى 5 (أعلى صلاحية)' : 'Level 5 (Super)'}</option>
                    <option value={4}>{isRtl ? 'مستوى 4 (إداري)' : 'Level 4 (Admin)'}</option>
                    <option value={3}>{isRtl ? 'مستوى 3 (ميداني/برامج)' : 'Level 3 (PMO)'}</option>
                    <option value={2}>{isRtl ? 'مستوى 2 (مالي)' : 'Level 2 (Finance)'}</option>
                    <option value={1}>{isRtl ? 'مستوى 1 (عادي)' : 'Level 1 (Basic)'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{isRtl ? 'اللغة الافتراضية' : 'Default Language'}</label>
                  <select 
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="ar">{isRtl ? 'العربية' : 'Arabic'}</option>
                    <option value="en">{isRtl ? 'الإنجليزية' : 'English'}</option>
                  </select>
                </div>
              </div>

              {/* Department and position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{isRtl ? 'القسم (Department)' : 'Department Code'}</label>
                  <input 
                    type="text" 
                    value={departmentCode}
                    onChange={(e) => setDepartmentCode(e.target.value)}
                    placeholder="e.g. FINANCE, PROGRAMS"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{isRtl ? 'المسمى الوظيفي (Position)' : 'Position Code'}</label>
                  <input 
                    type="text" 
                    value={positionCode}
                    onChange={(e) => setPositionCode(e.target.value)}
                    placeholder="e.g. CONTROLLER, DIRECTOR"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Financial Approval bounds */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? 'حدود الصلاحية والاعتماد المالي المباشر' : 'Direct Financial Approval Boundaries'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="canApprove"
                      checked={canApprove}
                      onChange={(e) => setCanApprove(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="canApprove" className="text-xs font-bold text-slate-600 cursor-pointer">
                      {isRtl ? 'تفويض معمد لاعتماد القيود والصرف' : 'Authorized to approve transaction payments'}
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{isRtl ? 'الحد الأقصى للاعتماد (بالريال)' : 'Max Approval Amount Limit'}</label>
                    <input 
                      type="number" 
                      disabled={!canApprove}
                      value={maxApprovalAmount}
                      onChange={(e) => setMaxApprovalAmount(e.target.value)}
                      className="w-full bg-white disabled:bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-3 text-xs outline-none font-extrabold text-slate-700 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Status and default password warning */}
              <div className="flex justify-between items-center gap-4 text-xs pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">{isRtl ? 'حالة حساب الموظف:' : 'Account Status:'}</span>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded py-1 px-2 font-bold text-slate-700 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="active">{isRtl ? 'نشط ومفعل' : 'Active'}</option>
                    <option value="inactive">{isRtl ? 'موقف ومقفل' : 'Suspended'}</option>
                  </select>
                </div>
                {!selectedUser && (
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {isRtl ? '* سيتم إنشاء كلمة مرور عشوائية آمنة للمستخدم الجديد' : '* A secure random password will be generated for the new user'}
                  </span>
                )}
              </div>
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={handleUserSave}
                disabled={userFormSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1 transition-all cursor-pointer"
              >
                {userFormSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{isRtl ? 'حفظ الحساب' : 'Save User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: STOCK MOVEMENT FORM MODAL ==================== */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-sm">
                {isRtl ? 'إذن حركة وسند صرف/توريد مخزني' : 'Register Stock Movement Slip'}
              </h3>
              <button onClick={() => setIsStockModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'نوع الحركة المخزنية' : 'Movement Type'}</label>
                <select 
                  value={stockForm.type}
                  onChange={(e) => setStockForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="DISBURSE">{isRtl ? 'صرف مخرجي مالي (مساعدات/تمكين)' : 'Stock Disbursement (Outgo)'}</option>
                  <option value="RECEIVE">{isRtl ? 'توريد مخزني جديد (توريد من مورد)' : 'Stock Receipt (Incoming)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'المادة المخزنية المستهدفة' : 'Select Inventory Item'}</label>
                <select 
                  value={stockForm.itemId}
                  onChange={(e) => setStockForm(prev => ({ ...prev, itemId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {isRtl ? item.name_ar : item.name_en} ({item.qty} {isRtl ? item.unit_ar : item.unit_en} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الكمية المطلوبة' : 'Quantity'}</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={stockForm.qty}
                    onChange={(e) => setStockForm(prev => ({ ...prev, qty: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'مستودع المادة الحقيقي' : 'Warehouse Location'}</label>
                  <select 
                    value={stockForm.warehouseId}
                    onChange={(e) => setStockForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{isRtl ? wh.name_ar : wh.name_en}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الملاحظات والبيان الموجه' : 'Movement Notes'}</label>
                <textarea 
                  rows={2}
                  required
                  value={stockForm.notes}
                  onChange={(e) => setStockForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="الجهة المستلمة، رقم النشاط، أو الغرض الميداني..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-700 focus:outline-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={stockSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 text-white rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-1.5 shadow-md shadow-emerald-700/10 cursor-pointer"
              >
                {stockSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isRtl ? 'اعتماد وترحيل سند الحركة المخزنية' : 'Approve and Post Stock Movement'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: ASSET FORM MODAL ==================== */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {isRtl ? 'تسجيل أصل ثابت جديد وربطه بـ WBS والموقع GIS' : 'Register New Fixed Asset (WBS & GIS Linked)'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">{isRtl ? 'إدخال تكلفة الأصل، فئة الإهلاك، الربط بالمشروع والإحداثيات الجغرافية' : 'Enter asset cost, depreciation parameters, WBS linkage and GPS coordinates'}</p>
                </div>
              </div>
              <button onClick={() => setIsAssetModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleAssetSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-700">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم الأصل (عربي)' : 'Asset Name (Arabic)'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. مولد كهربائي كمنز 100KVA"
                    value={assetForm.nameAr}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, nameAr: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم الأصل (English)' : 'Asset Name (English)'}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cummins 100KVA Generator"
                    value={assetForm.nameEn}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, nameEn: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              {/* Project WBS Linkage Section */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-800 font-black text-[11px]">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? 'الربط التلقائي بـ WBS الخاص بمشاريع الجمعية:' : 'Link Asset to Project WBS:'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'المشروع المستهدف' : 'Target Project'}</label>
                    <select
                      value={assetForm.projectId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const proj = projects.find(p => p.id === pid);
                        setAssetForm(prev => ({
                          ...prev,
                          projectId: pid,
                          wbsActivityAr: proj ? proj.name_ar : prev.wbsActivityAr
                        }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold cursor-pointer"
                    >
                      <option value="">{isRtl ? 'أصل عام (غير مرتبط بمشروع)' : 'General Corporate Asset'}</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name_ar}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'رمز هيكل حزمة العمل (WBS Code)' : 'WBS Activity Code'}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. WBS-MAR-1.2.4"
                      value={assetForm.wbsCode}
                      onChange={(e) => setAssetForm(prev => ({ ...prev, wbsCode: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Geospatial GPS Location Section */}
              <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-blue-900 font-black text-[11px]">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>{isRtl ? 'تتبع الموقع الجغرافي والإحداثيات (GIS Coordinates):' : 'Geospatial GPS Location:'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'خط العرض (Latitude)' : 'Latitude'}</label>
                    <input 
                      type="text" 
                      placeholder="15.4582"
                      value={assetForm.latitude}
                      onChange={(e) => setAssetForm(prev => ({ ...prev, latitude: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'خط الطول (Longitude)' : 'Longitude'}</label>
                    <input 
                      type="text" 
                      placeholder="45.3289"
                      value={assetForm.longitude}
                      onChange={(e) => setAssetForm(prev => ({ ...prev, longitude: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'رمز المرجع GIS' : 'GIS Ref Code'}</label>
                    <input 
                      type="text" 
                      placeholder="GIS-YEM-MAR-001"
                      value={assetForm.gisCode}
                      onChange={(e) => setAssetForm(prev => ({ ...prev, gisCode: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الموقع والمحافظة (عربي)' : 'Location (Arabic)'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. مأرب - موقع سد مأرب"
                    value={assetForm.locationAr}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, locationAr: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'المين العيني/المسؤول' : 'Custodian'}</label>
                  <input 
                    type="text" 
                    placeholder="م. عبدالغني العوامي"
                    value={assetForm.custodian}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, custodian: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'تكلفة الشراء الأصلية (YER)' : 'Purchase Cost (YER)'}</label>
                  <input 
                    type="number" 
                    required
                    value={assetForm.originalCost}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, originalCost: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'تاريخ الشراء/الاستلام' : 'Purchase Date'}</label>
                  <input 
                    type="date" 
                    required
                    value={assetForm.purchaseDate}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الرقم التسلسلي Serial' : 'Serial Number'}</label>
                  <input 
                    type="text" 
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'فئة تصنيف الأصل' : 'Asset Type'}</label>
                  <select 
                    value={assetForm.type}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold cursor-pointer"
                  >
                    <option value="EQUIPMENT">{isRtl ? 'معدات وآلات عينية (Equipment)' : 'Equipment & Machinery'}</option>
                    <option value="VEHICLE">{isRtl ? 'مركبات وأسطول سيارات' : 'Vehicles Fleet'}</option>
                    <option value="BUILDING">{isRtl ? 'مباني ومراكز إدارية' : 'Buildings'}</option>
                    <option value="LAND">{isRtl ? 'أراضي وأوقاف غير قابلة للإهلاك' : 'Land Plots'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'العمر الإنتاجي (سنوات)' : 'Useful Life (Years)'}</label>
                  <input 
                    type="number" 
                    value={assetForm.usefulLifeYears}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, usefulLifeYears: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'قيمة الخردة/المتبقية (YER)' : 'Salvage Value'}</label>
                  <input 
                    type="number" 
                    value={assetForm.salvageValue}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, salvageValue: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={assetSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 text-white rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-1.5 shadow-md shadow-emerald-700/10 cursor-pointer"
              >
                {assetSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isRtl ? 'اعتماد وإدخال الأصل وحساب صافي القيمة الدفترية' : 'Register Asset & Calculate Net Book Value'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: NEW INVENTORY ITEM MODAL ==================== */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  {isRtl ? 'تسجيل مادة أو سلعة إغاثية جديدة في المخزن' : 'Register New Inventory Item'}
                </h3>
              </div>
              <button onClick={() => setIsNewItemModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleNewItemSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم المادة (عربي)' : 'Item Name (Arabic)'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: تمور فاخرة مغلفة - كرتون 10كجم"
                    value={newItemForm.nameAr}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, nameAr: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم المادة (English)' : 'Item Name (English)'}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Premium Dates Carton 10kg"
                    value={newItemForm.nameEn}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, nameEn: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الرصيد الافتتاحي' : 'Initial Qty'}</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newItemForm.qty}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, qty: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'وحدة القياس (عربي)' : 'Unit (Arabic)'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="كرتون / سلة / وجبة"
                    value={newItemForm.unitAr}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, unitAr: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'وحدة القياس (English)' : 'Unit (English)'}</label>
                  <input 
                    type="text" 
                    placeholder="carton / basket"
                    value={newItemForm.unitEn}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, unitEn: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'مستودع الحفظ والتخزين' : 'Warehouse Location'}</label>
                  <select 
                    value={newItemForm.warehouseId}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold cursor-pointer"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{isRtl ? wh.name_ar : wh.name_en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'التصنيف القطاعي' : 'Sector Category'}</label>
                  <select 
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold cursor-pointer"
                  >
                    <option value="FOOD_AID">{isRtl ? 'الأمن الغذائي والإغاثة' : 'Food Aid'}</option>
                    <option value="NUTRITION">{isRtl ? 'التغذية والأمهات' : 'Nutrition'}</option>
                    <option value="SHELTER">{isRtl ? 'الإيواء والمواد غير الغذائية' : 'Shelter & NFI'}</option>
                    <option value="MEDICAL_STORES">{isRtl ? 'المستلزمات والأدوية الطبية' : 'Medical Stores'}</option>
                    <option value="WATER_SANITATION">{isRtl ? 'المياه والإزميل الصحي WASH' : 'WASH'}</option>
                    <option value="EDUCATION_DEVICES">{isRtl ? 'التعليم والتجهيزات' : 'Education Devices'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'سعر الوحدة (YER)' : 'Unit Price (YER)'}</label>
                  <input 
                    type="number" 
                    required
                    value={newItemForm.unitValueYer}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, unitValueYer: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'حد إعادة الطلب' : 'Reorder Level'}</label>
                  <input 
                    type="number" 
                    required
                    value={newItemForm.reorderLevel}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, reorderLevel: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'رقم الشحنة/الدفعة' : 'Batch No'}</label>
                  <input 
                    type="text" 
                    value={newItemForm.batchNo}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, batchNo: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}</label>
                <input 
                  type="date" 
                  value={newItemForm.expiryDate}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-slate-700"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-1.5 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? 'حفظ وإضافة المادة المخزنية' : 'Save & Register Inventory SKU'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 5: NEW FIELD WAREHOUSE MODAL ==================== */}
      {isNewWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  {isRtl ? 'تسجيل مستودع ميداني جديد' : 'Register New Field Depot'}
                </h3>
              </div>
              <button onClick={() => setIsNewWarehouseModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleNewWarehouseSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم المستودع (عربي)' : 'Depot Name (Arabic)'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: مستودع الجوف الإغاثي"
                    value={newWarehouseForm.nameAr}
                    onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, nameAr: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم المستودع (English)' : 'Depot Name (English)'}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Al-Jawf Relief Warehouse"
                    value={newWarehouseForm.nameEn}
                    onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, nameEn: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الموقع والمحافظة (عربي)' : 'Location (Arabic)'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: الجوف - مدينة الحزم"
                    value={newWarehouseForm.locationAr}
                    onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, locationAr: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الموقع (English)' : 'Location (English)'}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Al Jawf - Al Hazm City"
                    value={newWarehouseForm.locationEn}
                    onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, locationEn: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم أمين المستودع' : 'Depot Keeper Name'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="أ. أحمد الشميري"
                    value={newWarehouseForm.managerName}
                    onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, managerName: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'السعة الاستيعابية (m³)' : 'Storage Capacity'}</label>
                  <input 
                    type="text" 
                    required
                    value={newWarehouseForm.capacity}
                    onChange={(e) => setNewWarehouseForm(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-1.5 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isRtl ? 'اعتماد المستودع وترخيصه' : 'Authorize & Create Depot'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 6: EQUIPMENT MAINTENANCE LOGS MODAL ==================== */}
      {isMaintenanceModalOpen && selectedAssetForMaintenance && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-scale-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600/30 rounded-xl border border-emerald-500/30">
                  <Wrench className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {isRtl ? 'سجل الصيانة العينية والإنفاق الرأسمالي (Equipment Maintenance Logs)' : 'Equipment Maintenance & Capital Overhaul Logs'}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {isRtl ? selectedAssetForMaintenance.name_ar : selectedAssetForMaintenance.name_en}
                    {selectedAssetForMaintenance.serial_number && ` (SN: ${selectedAssetForMaintenance.serial_number})`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsMaintenanceModalOpen(false)} 
                className="p-1 hover:bg-slate-800 rounded-full cursor-pointer text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-700">

              {/* Asset Financial Summary Bar */}
              {(() => {
                const fin = computeAssetFinancials(selectedAssetForMaintenance);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">{isRtl ? 'تكلفة الأصل الأولى:' : 'Original Cost:'}</span>
                      <span className="font-mono text-slate-900 text-xs">{fin.originalCost.toLocaleString()} YER</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-amber-600 uppercase block">{isRtl ? 'الصيانة الرأسمالية المضافة:' : 'Capitalized Overhauls:'}</span>
                      <span className="font-mono text-amber-700 text-xs">+{fin.totalCapitalized.toLocaleString()} YER</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-rose-500 uppercase block">{isRtl ? 'الإهلاك المتراكم:' : 'Acc. Depreciation:'}</span>
                      <span className="font-mono text-rose-600 text-xs">-{fin.accumulatedDepreciation.toLocaleString()} YER</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-600 uppercase block">{isRtl ? 'صافي القيمة الدفترية (NBV):' : 'Net Book Value:'}</span>
                      <span className="font-mono text-emerald-700 text-xs font-black">{fin.netBookValue.toLocaleString()} YER</span>
                    </div>
                  </div>
                );
              })()}

              {/* Add New Maintenance Log Form */}
              <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? 'تسجيل عملية صيانة جديدة / إضافة عمر تشغيلي:' : 'Record New Maintenance / Capital Overhaul:'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'نوع الصيانة' : 'Maintenance Type'}</label>
                    <select
                      value={newLogForm.type}
                      onChange={(e) => setNewLogForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold cursor-pointer"
                    >
                      <option value="PREVENTIVE">{isRtl ? 'صيانة دورية وقائية (Preventive)' : 'Preventive Maintenance'}</option>
                      <option value="CORRECTIVE">{isRtl ? 'صيانة إصلاحية طارئة (Corrective)' : 'Corrective Repair'}</option>
                      <option value="OVERHAUL">{isRtl ? 'عمرة وتجديد رأسمالي (Capital Overhaul)' : 'Capital Overhaul'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'تكلفة الصيانة (YER)' : 'Cost (YER)'}</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newLogForm.costYer}
                      onChange={(e) => setNewLogForm(prev => ({ ...prev, costYer: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'تاريخ الصيانة القادمة' : 'Next Service Date'}</label>
                    <input 
                      type="date" 
                      value={newLogForm.nextMaintenanceDate}
                      onChange={(e) => setNewLogForm(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-1.5 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'المركز الفني / المهندس المنفذ' : 'Service Provider / Center'}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. المركز الفني الهندسي المعتمد"
                      value={newLogForm.technician}
                      onChange={(e) => setNewLogForm(prev => ({ ...prev, technician: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'رقم الفاتورة / المرجع' : 'Invoice / Voucher Ref'}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. INV-MAINT-2026-001"
                      value={newLogForm.invoiceRef}
                      onChange={(e) => setNewLogForm(prev => ({ ...prev, invoiceRef: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'تفاصيل الأعمال والقطع المستبدلة' : 'Work Description & Replaced Parts'}</label>
                  <input 
                    type="text" 
                    placeholder="وصف الإجراء والقطع..."
                    value={newLogForm.descriptionAr}
                    onChange={(e) => setNewLogForm(prev => ({ ...prev, descriptionAr: e.target.value, descriptionEn: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2"
                  />
                </div>

                {/* Capitalization Checkbox */}
                <div className="flex items-center justify-between bg-white border border-emerald-200 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="cap_check"
                      checked={newLogForm.isCapitalized}
                      onChange={(e) => setNewLogForm(prev => ({ ...prev, isCapitalized: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="cap_check" className="font-extrabold text-slate-800 text-[11px] cursor-pointer">
                      {isRtl ? 'رأسمالة التكلفة (تزيد من القيمة الدفترية للأصل)' : 'Capitalize Cost (Increase Asset Net Book Value)'}
                    </label>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/70 font-mono px-2 py-0.5 rounded font-bold">
                    {newLogForm.isCapitalized ? '+NBV Auto Increase' : 'Expensed to Opex'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddMaintenanceLog}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRtl ? 'إضافة سجل الصيانة وتحديث القيمة الدفترية تلقائياً' : 'Add Maintenance Log & Update Book Value'}</span>
                </button>
              </div>

              {/* Maintenance History Log Table */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>{isRtl ? 'السجل التاريخي للصيانة والقطع العينية' : 'Maintenance History Log'}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {selectedAssetForMaintenance.maintenance_logs?.length || 0} {isRtl ? 'سجلات' : 'records'}
                  </span>
                </h4>

                {selectedAssetForMaintenance.maintenance_logs && selectedAssetForMaintenance.maintenance_logs.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-extrabold text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">{isRtl ? 'التاريخ' : 'Date'}</th>
                          <th className="p-2.5">{isRtl ? 'نوع الصيانة' : 'Type'}</th>
                          <th className="p-2.5">{isRtl ? 'التفاصيل والقطع' : 'Description'}</th>
                          <th className="p-2.5">{isRtl ? 'المزود/المهندس' : 'Vendor'}</th>
                          <th className="p-2.5">{isRtl ? 'التكلفة (YER)' : 'Cost'}</th>
                          <th className="p-2.5">{isRtl ? 'المعاملة المالية' : 'Capitalized?'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                        {selectedAssetForMaintenance.maintenance_logs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-mono text-slate-800 font-bold">{log.maintenance_date}</td>
                            <td className="p-2.5 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[9px] ${
                                log.type === 'OVERHAUL'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : log.type === 'PREVENTIVE'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-700 font-bold">{isRtl ? log.description_ar : log.description_en}</td>
                            <td className="p-2.5 text-slate-500">{log.technician_or_center}</td>
                            <td className="p-2.5 font-mono font-black text-slate-900">{log.cost_yer.toLocaleString()} YER</td>
                            <td className="p-2.5">
                              {log.is_capitalized ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-black border border-emerald-300">
                                  {isRtl ? 'مستثمر (+NBV)' : 'Capitalized'}
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-[9px]">{isRtl ? 'مصروف تشغيلي' : 'Expensed'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl text-center text-zinc-400">
                    <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p>{isRtl ? 'لا توجد سجلات صيانة سابقة لهذا الأصل.' : 'No maintenance logs recorded for this asset yet.'}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 7: GEOSPATIAL GIS MAP LOCATION MODAL ==================== */}
      {isGisModalOpen && selectedAssetForGis && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {isRtl ? 'التتبع الجغرافي الخرائطي للأصل (GIS Satellite Locator)' : 'GIS Geospatial Asset Locator'}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {isRtl ? selectedAssetForGis.name_ar : selectedAssetForGis.name_en}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsGisModalOpen(false)} 
                className="p-1 hover:bg-slate-800 rounded-full cursor-pointer text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Simulated Map Visual Box */}
              <div className="relative w-full h-64 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex flex-col justify-between p-4 shadow-inner">
                {/* Background Grid Map Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* Top Badge Overlay */}
                <div className="relative z-10 flex justify-between items-start">
                  <span className="bg-slate-900/90 text-white text-[10px] font-mono px-3 py-1 rounded-lg border border-slate-700 font-bold flex items-center gap-1.5 backdrop-blur-sm">
                    <Navigation className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>GIS ID: {selectedAssetForGis.gis_code || 'GIS-YEM-MAR-001'}</span>
                  </span>

                  <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shadow">
                    GPS Active Lock
                  </span>
                </div>

                {/* Center Map Pin Target */}
                <div className="relative z-10 mx-auto text-center my-auto">
                  <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-blue-500/30 rounded-full animate-ping"></div>
                    <div className="relative p-3 bg-emerald-600 text-white rounded-full shadow-lg border-2 border-white">
                      <MapPin className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-2 bg-slate-900/90 text-white px-3 py-1 rounded-xl text-xs font-black border border-slate-700 backdrop-blur-sm inline-block shadow-md">
                    {isRtl ? selectedAssetForGis.location_ar : selectedAssetForGis.location_en}
                  </div>
                </div>

                {/* Bottom Coordinates Footer Bar */}
                <div className="relative z-10 bg-slate-900/90 text-zinc-300 p-2.5 rounded-xl text-[10px] font-mono flex justify-between items-center border border-slate-700 backdrop-blur-sm">
                  <div>
                    <span className="text-zinc-500 block">LAT / LNG:</span>
                    <span className="text-white font-bold">{selectedAssetForGis.latitude || 15.4582} / {selectedAssetForGis.longitude || 45.3289}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-zinc-500 block">ALTITUDE / ACCURACY:</span>
                    <span className="text-emerald-400 font-bold">1,120m / ±1.2m</span>
                  </div>
                </div>

              </div>

              {/* Linked WBS Details */}
              {selectedAssetForGis.wbs_code && (
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{isRtl ? 'حزمة العمل الميدانية WBS:' : 'Field WBS Work Package:'}</span>
                    <span className="font-extrabold text-slate-800">{isRtl ? selectedAssetForGis.wbs_activity_ar : selectedAssetForGis.wbs_activity_en}</span>
                  </div>
                  <span className="font-mono text-xs font-black bg-emerald-600 text-white px-2.5 py-1 rounded-lg">
                    {selectedAssetForGis.wbs_code}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsGisModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-extrabold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {isRtl ? 'إغلاق الخريطة' : 'Close Map'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
