import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  Filter, 
  Layers, 
  Edit3, 
  Building2, 
  Wallet, 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  FileSpreadsheet,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronLeft,
  SlidersHorizontal,
  Table as TableIcon
} from 'lucide-react';
import { Account, Transaction, TransactionLine } from './FinanceTypes';
import { printHTML, createPrintDocument, getCustomFooterHTML } from '../../lib/printUtils';
import { EnterpriseButton } from '../common/EnterpriseButton';
import { generateNumericCode } from '../../lib/idGenerator';
import { showToast } from '../enterprise/EnterpriseToastContainer';

export type StandardSeedAccount = Omit<Account, 'id' | 'debit_total' | 'credit_total'> & {
  debit_total?: number;
  credit_total?: number;
};

export const STANDARD_IPSAS_SEED_ACCOUNTS: StandardSeedAccount[] = [
  // 1. الأصول والموجودات (Assets)
  { account_code: '1110', name_ar: 'النقدية بالصناديق والخزائن الرئيسية', name_en: 'Cash in Vaults & Petty Cash', account_type: 'ASSET', opening_balance: 5000000, current_balance: 5000000, is_active: true },
  { account_code: '1111', name_ar: 'صندوق الإدارة العامة - المركز الرئيسي', name_en: 'HQ Main Cash Vault', account_type: 'ASSET', opening_balance: 3500000, current_balance: 3500000, is_active: true },
  { account_code: '1112', name_ar: 'صندوق المصروفات النثرية والتشغيل', name_en: 'Petty Cash Operations', account_type: 'ASSET', opening_balance: 1500000, current_balance: 1500000, is_active: true },
  { account_code: '1120', name_ar: 'الحسابات المصرفية بالبنوك المحلية', name_en: 'Bank Accounts', account_type: 'ASSET', opening_balance: 45000000, current_balance: 45000000, is_active: true },
  { account_code: '1121', name_ar: 'بنك التضامن الإسلامي - حساب التبرعات العام', name_en: 'Tadhamon Bank - General Donations', account_type: 'ASSET', opening_balance: 25000000, current_balance: 25000000, is_active: true },
  { account_code: '1122', name_ar: 'بنك الكريمي للتمويل الأصغر - حساب المشاريع', name_en: 'Kuraimi Bank - Projects Fund', account_type: 'ASSET', opening_balance: 12000000, current_balance: 12000000, is_active: true },
  { account_code: '1123', name_ar: 'بنك اليمن والكويت - حساب كفالات الأيتام', name_en: 'YKB - Orphans Sponsorship Account', account_type: 'ASSET', opening_balance: 8000000, current_balance: 8000000, is_active: true },
  { account_code: '1130', name_ar: 'الذمم المدينة والعهد والمدينون المتنوعون', name_en: 'Accounts Receivable & Advances', account_type: 'ASSET', opening_balance: 3200000, current_balance: 3200000, is_active: true },
  { account_code: '1131', name_ar: 'عهد المنسقين الميدانيين للمشاريع', name_en: 'Field Coordinators Advances', account_type: 'ASSET', opening_balance: 2200000, current_balance: 2200000, is_active: true },
  { account_code: '1132', name_ar: 'سلف العاملين المؤقتة', name_en: 'Staff Advances', account_type: 'ASSET', opening_balance: 1000000, current_balance: 1000000, is_active: true },
  { account_code: '1140', name_ar: 'مخزون المواد والمساعدات الإغاثية', name_en: 'Relief Inventory & Supplies', account_type: 'ASSET', opening_balance: 8500000, current_balance: 8500000, is_active: true },
  { account_code: '1141', name_ar: 'مخزون السلال الغذائية والمواد التموينية', name_en: 'Food Baskets Inventory', account_type: 'ASSET', opening_balance: 4500000, current_balance: 4500000, is_active: true },
  { account_code: '1142', name_ar: 'مخزون الأدوية والمستلزمات الطبية', name_en: 'Medical Supplies Inventory', account_type: 'ASSET', opening_balance: 2500000, current_balance: 2500000, is_active: true },
  { account_code: '1143', name_ar: 'مخزون مواد الإيواء والمياه والإصحاح', name_en: 'WASH & Shelter Supplies', account_type: 'ASSET', opening_balance: 1500000, current_balance: 1500000, is_active: true },
  { account_code: '1150', name_ar: 'مصروفات مدفوعة مقدماً وتأمينات', name_en: 'Prepaid Expenses & Deposits', account_type: 'ASSET', opening_balance: 1800000, current_balance: 1800000, is_active: true },
  { account_code: '1510', name_ar: 'الأراضي والعقارات الوقفية والمؤسسية', name_en: 'Land & Endowment Properties', account_type: 'ASSET', opening_balance: 28000000, current_balance: 28000000, is_active: true },
  { account_code: '1520', name_ar: 'المباني والإنشاءات والمقرات', name_en: 'Buildings & Facilities', account_type: 'ASSET', opening_balance: 35000000, current_balance: 35000000, is_active: true },
  { account_code: '1530', name_ar: 'المركبات وشاحنات النقل الإغاثي', name_en: 'Vehicles & Relief Trucks', account_type: 'ASSET', opening_balance: 18000000, current_balance: 18000000, is_active: true },
  { account_code: '1540', name_ar: 'الأجهزة والمعدات والأنظمة التقنية', name_en: 'Equipment & IT Hardware', account_type: 'ASSET', opening_balance: 6500000, current_balance: 6500000, is_active: true },
  { account_code: '1610', name_ar: 'مجمع إهلاك الأصول الثابتة (عكسي)', name_en: 'Accumulated Depreciation', account_type: 'ASSET', opening_balance: -8500000, current_balance: -8500000, is_active: true },

  // 2. الخصوم والالتزامات (Liabilities)
  { account_code: '2110', name_ar: 'الموردون ومتعهدو الخدمات والمقاولون', name_en: 'Accounts Payable & Contractors', account_type: 'LIABILITY', opening_balance: 12500000, current_balance: 12500000, is_active: true },
  { account_code: '2111', name_ar: 'موردو المواد الغذائية والإغاثية', name_en: 'Relief Supplies Vendors', account_type: 'LIABILITY', opening_balance: 7500000, current_balance: 7500000, is_active: true },
  { account_code: '2112', name_ar: 'مقاولو المشاريع الإنشائية ومشاريع المياه', name_en: 'WASH & Construction Contractors', account_type: 'LIABILITY', opening_balance: 5000000, current_balance: 5000000, is_active: true },
  { account_code: '2120', name_ar: 'المصروفات والرواتب المستحقة غير المسددة', name_en: 'Accrued Expenses & Salaries', account_type: 'LIABILITY', opening_balance: 4200000, current_balance: 4200000, is_active: true },
  { account_code: '2130', name_ar: 'أمانات جهات مانحة وتبرعات تحت التخصيص', name_en: 'Restricted Grants Payable', account_type: 'LIABILITY', opening_balance: 15000000, current_balance: 15000000, is_active: true },
  { account_code: '2210', name_ar: 'مخصص مكافأة نهاية الخدمة للموظفين', name_en: 'End of Service Benefits Provision', account_type: 'LIABILITY', opening_balance: 6800000, current_balance: 6800000, is_active: true },

  // 3. صافي الأصول وحقوق الملكية (Equity / Net Assets)
  { account_code: '3110', name_ar: 'صافي الأصول العامة غير المقيدة', name_en: 'Unrestricted General Net Assets', account_type: 'EQUITY', opening_balance: 42000000, current_balance: 42000000, is_active: true },
  { account_code: '3120', name_ar: 'صافي الأصول المقيدة للبرامج والمشاريع', name_en: 'Restricted Program Net Assets', account_type: 'EQUITY', opening_balance: 38000000, current_balance: 38000000, is_active: true },
  { account_code: '3130', name_ar: 'رأس مال الأوقاف والأصول الوقفية الثابتة', name_en: 'Endowment Corpus & Fixed Capital', account_type: 'EQUITY', opening_balance: 25000000, current_balance: 25000000, is_active: true },

  // 4. الإيرادات والتبرعات والمساهمات (Revenues)
  { account_code: '4110', name_ar: 'إيرادات التبرعات العامة والصدقات النقدية', name_en: 'General Donations & Charities', account_type: 'REVENUE', opening_balance: 0, current_balance: 18500000, is_active: true },
  { account_code: '4120', name_ar: 'أموال ومساهمات الزكاة الشرعية', name_en: 'Zakat Contributions', account_type: 'REVENUE', opening_balance: 0, current_balance: 14200000, is_active: true },
  { account_code: '4210', name_ar: 'منح ومشاريع المنظمات الدولية والمؤسسية', name_en: 'Institutional & International Grants', account_type: 'REVENUE', opening_balance: 0, current_balance: 32000000, is_active: true },
  { account_code: '4310', name_ar: 'إيرادات كفالات الأيتام الشهرية والرعاية', name_en: 'Orphans Sponsorship Contributions', account_type: 'REVENUE', opening_balance: 0, current_balance: 9600000, is_active: true },
  { account_code: '4410', name_ar: 'عوائد الأوقاف وإيجارات العقارات التنموية', name_en: 'Endowment Yields & Rentals', account_type: 'REVENUE', opening_balance: 0, current_balance: 4800000, is_active: true },

  // 5. النفقات والمصروفات التشغيلية والبرامجية (Expenses)
  { account_code: '5110', name_ar: 'نفقات برامج الإغاثة العاجلة والأمن الغذائي', name_en: 'Food Security & Relief Program Costs', account_type: 'EXPENSE', opening_balance: 0, current_balance: 22400000, is_active: true },
  { account_code: '5120', name_ar: 'نفقات مشاريع المياه والإصحاح البيئي (WASH)', name_en: 'WASH Projects Execution Costs', account_type: 'EXPENSE', opening_balance: 0, current_balance: 16800000, is_active: true },
  { account_code: '5130', name_ar: 'نفقات البرامج الصحية والعيادات المتنقلة', name_en: 'Health & Medical Mission Costs', account_type: 'EXPENSE', opening_balance: 0, current_balance: 8500000, is_active: true },
  { account_code: '5140', name_ar: 'مخصصات كفالات الأيتام والكسوة المنصرفة', name_en: 'Orphan Stipends & Eid Clothes', account_type: 'EXPENSE', opening_balance: 0, current_balance: 9100000, is_active: true },
  { account_code: '5210', name_ar: 'رواتب وأجور الكادر الميداني والإداري', name_en: 'Salaries & Field Personnel Wages', account_type: 'EXPENSE', opening_balance: 0, current_balance: 7400000, is_active: true },
  { account_code: '5220', name_ar: 'مصروفات الإيجارات والمرافق والاتصالات', name_en: 'Rent, Utilities & Communications', account_type: 'EXPENSE', opening_balance: 0, current_balance: 2100000, is_active: true },
  { account_code: '5230', name_ar: 'مصاريف الصيانة والوقود والمحروقات', name_en: 'Fuel & Maintenance Expenses', account_type: 'EXPENSE', opening_balance: 0, current_balance: 1650000, is_active: true },
  { account_code: '5410', name_ar: 'الرسوم المصرفية وعمولات التحويل والشحن', name_en: 'Bank Fees & Transfer Commissions', account_type: 'EXPENSE', opening_balance: 0, current_balance: 550000, is_active: true },
  { account_code: '5510', name_ar: 'مصروف إهلاك الأصول الثابتة للفترة', name_en: 'Depreciation Expense', account_type: 'EXPENSE', opening_balance: 0, current_balance: 1200000, is_active: true },
];

export interface TreeNodeAccount extends Account {
  level: number;
  is_leaf: boolean;
  children: TreeNodeAccount[];
  total_current_balance: number;
  total_opening_balance: number;
  total_debit: number;
  total_credit: number;
  leaf_count: number;
  parent_code: string | null;
}

interface ChartOfAccountsTreeViewProps {
  accounts: Account[];
  lang: 'ar' | 'en';
  onRefresh: () => void;
  onSelectAccountForStatement?: (accountId: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onSaveAccounts?: (updatedAccounts: Account[]) => void;
}

// Master Institutional Top-Level Definitions (IPSAS & AAOIFI Standards)
const ROOT_GROUPS_MAP: Record<string, { name_ar: string; name_en: string; type: string; icon: any; color: string; bgBadge: string }> = {
  '1': { name_ar: 'الأصول والموجودات', name_en: 'Assets', type: 'ASSET', icon: Wallet, color: 'text-emerald-700 dark:text-emerald-400', bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  '2': { name_ar: 'الخصوم والالتزامات', name_en: 'Liabilities', type: 'LIABILITY', icon: ShieldAlert, color: 'text-amber-700 dark:text-amber-400', bgBadge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  '3': { name_ar: 'صافي الأصول وحقوق الملكية', name_en: 'Net Assets & Equity', type: 'EQUITY', icon: Scale, color: 'text-purple-700 dark:text-purple-400', bgBadge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
  '4': { name_ar: 'الإيرادات والتبرعات والمساهمات', name_en: 'Revenues & Contributions', type: 'REVENUE', icon: TrendingUp, color: 'text-blue-700 dark:text-blue-400', bgBadge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
  '5': { name_ar: 'النفقات والمصروفات التشغيلية والبرامجية', name_en: 'Expenses & Operations', type: 'EXPENSE', icon: TrendingDown, color: 'text-rose-700 dark:text-rose-400', bgBadge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
  '6': { name_ar: 'صناديق البرامج المقيدة والتزامات الأثر', name_en: 'Restricted Program Funds', type: 'LIABILITY', icon: Building2, color: 'text-cyan-700 dark:text-cyan-400', bgBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800' }
};

// 2-Digit Subgroups Definitions
const SUBGROUPS_MAP: Record<string, { name_ar: string; name_en: string; type: string }> = {
  '10': { name_ar: 'النقدية بالصناديق والخزائن الرئيسية', name_en: 'Cash in Vaults', type: 'ASSET' },
  '11': { name_ar: 'النقدية وما في حكمها والحسابات المصرفية', name_en: 'Cash & Bank Accounts', type: 'ASSET' },
  '12': { name_ar: 'الاستثمارات والأصول المالية والأوقاف', name_en: 'Investments & Endowments', type: 'ASSET' },
  '13': { name_ar: 'الذمم المدينة والعهد المعلقة والتبرعات المستحقة', name_en: 'Receivables & Advances', type: 'ASSET' },
  '14': { name_ar: 'المخزون السلعي والمساعدات العينية الإغاثية', name_en: 'Inventories & Relief Goods', type: 'ASSET' },
  '15': { name_ar: 'الأصول الثابتة المادية (الأراضي والمباني والسيارات)', name_en: 'Tangible Fixed Assets', type: 'ASSET' },
  '16': { name_ar: 'مجمعات الاستهلاك والإهلاك المتراكم (عكسي)', name_en: 'Accumulated Depreciation', type: 'ASSET' },
  '17': { name_ar: 'الأصول غير الملموسة والبرمجيات والتراخيص', name_en: 'Intangibles & Software', type: 'ASSET' },
  '21': { name_ar: 'الخصوم المتداولة والالتزامات قصيرة الأجل', name_en: 'Current Liabilities', type: 'LIABILITY' },
  '22': { name_ar: 'الالتزامات طويلة الأجل والمنح المؤجلة والمخصصات', name_en: 'Long-Term Liabilities', type: 'LIABILITY' },
  '31': { name_ar: 'صافي الأصول غير المقيدة والمرحلة ورأس المال', name_en: 'Unrestricted Net Assets', type: 'EQUITY' },
  '41': { name_ar: 'التبرعات النقدية العامة والمقيدة وكفالات الأيتام', name_en: 'Donations & Sponsorships', type: 'REVENUE' },
  '42': { name_ar: 'المنح الحكومية والدولية والمؤسسية', name_en: 'Institutional Grants', type: 'REVENUE' },
  '43': { name_ar: 'عوائد الأوقاف وإيرادات الأنشطة والخدمات', name_en: 'Endowments & Service Revenue', type: 'REVENUE' },
  '51': { name_ar: 'نفقات البرامج الإنسانية والإغاثية والمشاريع الميدانية', name_en: 'Humanitarian Field Programs', type: 'EXPENSE' },
  '52': { name_ar: 'المصروفات الإدارية والعمومية والتشغيلية', name_en: 'G&A Expenses', type: 'EXPENSE' },
  '53': { name_ar: 'نفقات تنمية الموارد والتسويق والمطابخ الخيرية', name_en: 'Fundraising & Community', type: 'EXPENSE' },
  '54': { name_ar: 'المصاريف والعمولات البنكية والرسوم المهنية', name_en: 'Bank Charges & Fees', type: 'EXPENSE' },
  '55': { name_ar: 'مشاريع البنية التحتية والإنشائية الخيرية والمساجد', name_en: 'Mosques & Construction', type: 'EXPENSE' },
  '61': { name_ar: 'أموال ومخصصات البرامج المقيدة والتزامات الأثر', name_en: 'Restricted Program Commitments', type: 'LIABILITY' },
  '62': { name_ar: 'إهلاك الأصول والاستهلاك البرامجي المخصص', name_en: 'Program Depreciation', type: 'EXPENSE' }
};

export default function ChartOfAccountsTreeView({
  accounts,
  lang,
  onRefresh,
  onSelectAccountForStatement,
  onNavigateToTab,
  onSaveAccounts
}: ChartOfAccountsTreeViewProps) {
  const isRtl = lang === 'ar';

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedNature, setSelectedNature] = useState<'all' | 'control' | 'posting'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '1': true,
    '2': true,
    '3': true,
    '4': true,
    '5': true,
    '6': true,
    '10': true,
    '11': true,
    '15': true,
    '21': true,
    '41': true,
    '51': true,
    '52': true
  });

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedParentCode, setSelectedParentCode] = useState<string>('');
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  // New Account Form State
  const [newAccountForm, setNewAccountForm] = useState({
    parent_code: '',
    account_code: '',
    name_ar: '',
    name_en: '',
    account_type: 'ASSET',
    opening_balance: '0',
    description: '',
    requires_project: false,
    is_active: true
  });

  // Build Hierarchical Tree Structure with Auto-Rollups
  const { rootNodes, flatListWithHierarchy, stats } = useMemo(() => {
    // 1. Prepare map of accounts
    const accountMap = new Map<string, Account>();
    accounts.forEach(a => {
      accountMap.set(String(a.account_code).trim(), a);
    });

    // 2. Ensure Level 1 Root Accounts exist
    Object.keys(ROOT_GROUPS_MAP).forEach(code => {
      if (!accountMap.has(code)) {
        const rootDef = ROOT_GROUPS_MAP[code];
        accountMap.set(code, {
          id: `virtual-root-${code}`,
          account_code: code,
          name_ar: rootDef.name_ar,
          name_en: rootDef.name_en,
          account_type: rootDef.type,
          sub_type: 'root_group',
          opening_balance: 0,
          current_balance: 0,
          debit_total: 0,
          credit_total: 0,
          is_active: true
        });
      }
    });

    // 3. Ensure Level 2 Subgroup Accounts exist
    Object.keys(SUBGROUPS_MAP).forEach(code => {
      if (!accountMap.has(code)) {
        const subDef = SUBGROUPS_MAP[code];
        accountMap.set(code, {
          id: `virtual-sub-${code}`,
          account_code: code,
          name_ar: subDef.name_ar,
          name_en: subDef.name_en,
          account_type: subDef.type,
          sub_type: 'sub_group',
          opening_balance: 0,
          current_balance: 0,
          debit_total: 0,
          credit_total: 0,
          is_active: true
        });
      }
    });

    // 4. Create Tree Nodes
    const treeNodesMap = new Map<string, TreeNodeAccount>();
    accountMap.forEach((acc, code) => {
      let level = 1;
      if (code.length === 1) level = 1;
      else if (code.length === 2) level = 2;
      else if (code.length <= 4) level = 3;
      else level = 4;

      treeNodesMap.set(code, {
        ...acc,
        level,
        is_leaf: true,
        children: [],
        total_current_balance: parseFloat(String(acc.current_balance || 0)) || 0,
        total_opening_balance: parseFloat(String(acc.opening_balance || 0)) || 0,
        total_debit: parseFloat(String(acc.debit_total || 0)) || 0,
        total_credit: parseFloat(String(acc.credit_total || 0)) || 0,
        leaf_count: 1,
        parent_code: null
      });
    });

    // 5. Establish Parent-Child Hierarchy based on code prefix
    const rootNodesList: TreeNodeAccount[] = [];

    // Helper: find closest existing parent code
    const findParentCode = (code: string): string | null => {
      if (code.length <= 1) return null;
      if (code.length === 2) return code[0];
      if (code.length === 3) return code.slice(0, 2);
      if (code.length === 4) {
        // e.g. 1101 -> check 11
        if (treeNodesMap.has(code.slice(0, 2))) return code.slice(0, 2);
        return code[0];
      }
      if (code.length > 4) {
        // e.g. 101001 -> check 1010, then 10
        if (treeNodesMap.has(code.slice(0, 4))) return code.slice(0, 4);
        if (treeNodesMap.has(code.slice(0, 2))) return code.slice(0, 2);
        return code[0];
      }
      return null;
    };

    // Sort codes so parents are processed before children
    const sortedCodes = Array.from(treeNodesMap.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    sortedCodes.forEach(code => {
      const node = treeNodesMap.get(code)!;
      const parentCode = findParentCode(code);

      if (parentCode && treeNodesMap.has(parentCode)) {
        const parent = treeNodesMap.get(parentCode)!;
        parent.children.push(node);
        parent.is_leaf = false;
        node.parent_code = parentCode;
      } else {
        rootNodesList.push(node);
      }
    });

    // 6. Roll up recursive totals from leaves to roots
    const calculateRollups = (node: TreeNodeAccount): { bal: number; open: number; deb: number; cred: number; leaves: number } => {
      if (node.children.length === 0) {
        node.is_leaf = true;
        node.leaf_count = 1;
        return {
          bal: node.total_current_balance,
          open: node.total_opening_balance,
          deb: node.total_debit,
          cred: node.total_credit,
          leaves: 1
        };
      }

      let sumBal = 0;
      let sumOpen = 0;
      let sumDeb = 0;
      let sumCred = 0;
      let totalLeaves = 0;

      node.children.forEach(child => {
        const r = calculateRollups(child);
        sumBal += r.bal;
        sumOpen += r.open;
        sumDeb += r.deb;
        sumCred += r.cred;
        totalLeaves += r.leaves;
      });

      node.is_leaf = false;
      // If node is a summary node (level 1 or 2, or level 3 with children), its balance is purely the rollup
      node.total_current_balance = sumBal;
      node.total_opening_balance = sumOpen;
      node.total_debit = sumDeb;
      node.total_credit = sumCred;
      node.leaf_count = totalLeaves;

      return { bal: sumBal, open: sumOpen, deb: sumDeb, cred: sumCred, leaves: totalLeaves };
    };

    rootNodesList.forEach(root => calculateRollups(root));

    // Flatten with hierarchy metadata for flat view or table view
    const flatList: TreeNodeAccount[] = [];
    const flatten = (node: TreeNodeAccount) => {
      flatList.push(node);
      node.children.forEach(child => flatten(child));
    };
    rootNodesList.forEach(root => flatten(root));

    // Compute high-level financial stats
    const totalAssets = treeNodesMap.get('1')?.total_current_balance || 0;
    const totalLiabilities = (treeNodesMap.get('2')?.total_current_balance || 0) + (treeNodesMap.get('6')?.total_current_balance || 0);
    const totalEquity = treeNodesMap.get('3')?.total_current_balance || 0;
    const totalRevenues = treeNodesMap.get('4')?.total_current_balance || 0;
    const totalExpenses = treeNodesMap.get('5')?.total_current_balance || 0;
    const totalAccountsCount = flatList.length;
    const postingAccountsCount = flatList.filter(a => a.is_leaf).length;
    const controlAccountsCount = flatList.filter(a => !a.is_leaf).length;

    return {
      rootNodes: rootNodesList,
      flatListWithHierarchy: flatList,
      stats: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalRevenues,
        totalExpenses,
        totalAccountsCount,
        postingAccountsCount,
        controlAccountsCount
      }
    };
  }, [accounts]);

  // Handle Search Filtering & Automatic Branch Expansion
  const matchesSearch = (node: TreeNodeAccount, term: string): boolean => {
    if (!term) return true;
    const t = term.toLowerCase();
    const codeMatch = String(node.account_code).toLowerCase().includes(t);
    const nameArMatch = (node.name_ar || '').toLowerCase().includes(t);
    const nameEnMatch = (node.name_en || '').toLowerCase().includes(t);
    if (codeMatch || nameArMatch || nameEnMatch) return true;
    return node.children.some(child => matchesSearch(child, term));
  };

  const matchesType = (node: TreeNodeAccount, type: string): boolean => {
    if (type === 'all') return true;
    const nType = (node.account_type || '').toUpperCase();
    if (nType === type.toUpperCase()) return true;
    return node.children.some(child => matchesType(child, type));
  };

  const matchesNature = (node: TreeNodeAccount, nature: 'all' | 'control' | 'posting'): boolean => {
    if (nature === 'all') return true;
    if (nature === 'posting') return node.is_leaf;
    if (nature === 'control') return !node.is_leaf;
    return true;
  };

  // Toggle Single Node Expand/Collapse
  const toggleNode = (code: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  // Bulk Expand / Collapse
  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    flatListWithHierarchy.forEach(node => {
      if (!node.is_leaf) allExp[node.account_code] = true;
    });
    setExpandedNodes(allExp);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const expandToLevel = (targetLevel: number) => {
    const levelExp: Record<string, boolean> = {};
    flatListWithHierarchy.forEach(node => {
      if (!node.is_leaf && node.level <= targetLevel) {
        levelExp[node.account_code] = true;
      }
    });
    setExpandedNodes(levelExp);
  };

  // Open Add Modal under specific parent
  const handleOpenAddModal = (parentCode: string = '') => {
    let suggestedCode = '';
    let parentType = 'ASSET';

    if (parentCode) {
      const parentNode = flatListWithHierarchy.find(a => a.account_code === parentCode);
      if (parentNode) {
        parentType = parentNode.account_type?.toUpperCase() || 'ASSET';
        // Find highest existing child code
        const childCodes = parentNode.children
          .map(c => parseInt(c.account_code))
          .filter(n => !isNaN(n));
        
        if (childCodes.length > 0) {
          const max = Math.max(...childCodes);
          suggestedCode = String(max + 1);
        } else {
          suggestedCode = parentCode.length === 1 ? `${parentCode}1` :
                          parentCode.length === 2 ? `${parentCode}01` :
                          `${parentCode}01`;
        }
      }
    }

    setSelectedParentCode(parentCode);
    setNewAccountForm({
      parent_code: parentCode,
      account_code: suggestedCode,
      name_ar: '',
      name_en: '',
      account_type: parentType,
      opening_balance: '0',
      description: '',
      requires_project: false,
      is_active: true
    });
    setShowAddModal(true);
  };

  // Submit Add New Account
  const handleSubmitAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountForm.account_code || !newAccountForm.name_ar) return;

    const newAcc: Account = {
      id: `acc-${Date.now()}-${generateNumericCode(1000, 9999)}`,
      account_code: newAccountForm.account_code.trim(),
      name_ar: newAccountForm.name_ar.trim(),
      name_en: newAccountForm.name_en.trim() || newAccountForm.name_ar.trim(),
      account_type: newAccountForm.account_type,
      opening_balance: parseFloat(newAccountForm.opening_balance) || 0,
      current_balance: parseFloat(newAccountForm.opening_balance) || 0,
      debit_total: 0,
      credit_total: 0,
      is_active: newAccountForm.is_active,
      requires_project: newAccountForm.requires_project
    };

    const updated = [...accounts, newAcc];
    if (onSaveAccounts) {
      onSaveAccounts(updated);
    }
    setShowAddModal(false);
    onRefresh();
  };

  // Seed Standard IPSAS & NGO Accounts (تهيئة وتغذية الدليل المحاسبي القياسي)
  const [isSeeding, setIsSeeding] = useState(false);
  const handleSeedStandardTemplate = async () => {
    const existingCodes = new Set(accounts.map(a => String(a.account_code).trim()));
    const missingAccounts: Account[] = [];

    STANDARD_IPSAS_SEED_ACCOUNTS.forEach((seed, idx) => {
      if (!existingCodes.has(seed.account_code)) {
        missingAccounts.push({
          id: `seed-${Date.now()}-${generateNumericCode(1000, 9999)}-${idx}`,
          account_code: seed.account_code,
          name_ar: seed.name_ar,
          name_en: seed.name_en,
          account_type: seed.account_type,
          opening_balance: seed.opening_balance || 0,
          current_balance: seed.current_balance || seed.opening_balance || 0,
          debit_total: 0,
          credit_total: 0,
          is_active: true
        });
      }
    });

    if (missingAccounts.length === 0) {
      showToast({
        type: 'info',
        title: isRtl ? 'دليل الحسابات مكتمل' : 'COA Complete',
        message: isRtl ? 'كافة حسابات الدليل المحاسبي القياسي موجودة بالفعل.' : 'All standard template accounts already exist.'
      });
      return;
    }

    setIsSeeding(true);
    const updated = [...accounts, ...missingAccounts];
    if (onSaveAccounts) {
      onSaveAccounts(updated);
    }

    // Also persist via API if available
    try {
      for (const acc of missingAccounts) {
        await fetch('/api/tables/chart_of_accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(acc)
        }).catch(() => {});
      }
    } catch {
      // Offline fallback is handled by onSaveAccounts
    } finally {
      setIsSeeding(false);
      onRefresh();
      showToast({
        type: 'success',
        title: isRtl ? 'تمت تهيئة الدليل القياسي بنجاح' : 'Standard COA Seeded',
        message: isRtl 
          ? `تمت إضافة ${missingAccounts.length} حساباً معيارياً وفق معايير IPSAS ومحاسبة المنظمات.` 
          : `Successfully seeded ${missingAccounts.length} IPSAS standard accounts.`
      });
    }
  };

  // Submit Edit Account
  const handleSubmitEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountToEdit) return;

    const updated = accounts.map(a => {
      if (a.account_code === accountToEdit.account_code) {
        return {
          ...a,
          name_ar: accountToEdit.name_ar,
          name_en: accountToEdit.name_en,
          is_active: accountToEdit.is_active,
          requires_project: accountToEdit.requires_project
        };
      }
      return a;
    });

    if (onSaveAccounts) {
      onSaveAccounts(updated);
    }
    setShowEditModal(false);
    setAccountToEdit(null);
    onRefresh();
  };

  // Export Chart of Accounts to CSV (with UTF-8 BOM)
  const handleExportCSV = () => {
    const headers = [
      'Account Code',
      'Arabic Name',
      'English Name',
      'Account Type',
      'Level',
      'Nature',
      'Opening Balance (YER)',
      'Current Balance (YER)',
      'Status'
    ];

    const rows = flatListWithHierarchy.map(a => [
      `"${a.account_code}"`,
      `"${(a.name_ar || '').replace(/"/g, '""')}"`,
      `"${(a.name_en || '').replace(/"/g, '""')}"`,
      `"${a.account_type}"`,
      a.level,
      a.is_leaf ? 'Posting (فرعي يقبل القيد)' : 'Control (تجميعي)',
      a.total_opening_balance,
      a.total_current_balance,
      a.is_active ? 'Active' : 'Inactive'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UAMEX_Chart_Of_Accounts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print Official A4 Certified Chart of Accounts
  const handlePrintOfficialCOA = () => {
    const documentHTML = `
      <div style="font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: ${isRtl ? 'rtl' : 'ltr'}; padding: 10px; color: #0f172a;">
        <!-- Official Header -->
        <div style="text-align: center; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #059669; margin: 0; font-size: 20px; font-weight: 800;">دليل الحسابات المحاسبي الموحد والمعتمد</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 11px;">
            نظام يو امكس المؤسسي الشامل UAMEX ERP™ • مطابق لمعايير المحاسبة الدولية للقطاع العام (IPSAS) ومعايير الأيوفي (AAOIFI)
          </p>
          <div style="margin-top: 10px; display: flex; justify-content: space-around; font-size: 11px; font-weight: bold; background: #f8fafc; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span>تاريخ الاعتماد والطباعة: ${new Date().toLocaleDateString('ar-YE')}</span>
            <span>إجمالي الحسابات: ${flatListWithHierarchy.length} حساب</span>
            <span>الأصول: ${stats.totalAssets.toLocaleString()} ر.ي</span>
            <span>الخصوم والالتزامات: ${stats.totalLiabilities.toLocaleString()} ر.ي</span>
          </div>
        </div>

        <!-- Accounts Hierarchy Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #059669; color: #ffffff; text-align: right;">
              <th style="padding: 8px; border: 1px solid #047857; width: 120px;">كود الحساب</th>
              <th style="padding: 8px; border: 1px solid #047857;">اسم الحساب في الدليل</th>
              <th style="padding: 8px; border: 1px solid #047857; width: 80px; text-align: center;">المستوى</th>
              <th style="padding: 8px; border: 1px solid #047857; width: 90px; text-align: center;">طبيعة الحساب</th>
              <th style="padding: 8px; border: 1px solid #047857; width: 130px; text-align: left;">الرصيد الافتتاحي (ر.ي)</th>
              <th style="padding: 8px; border: 1px solid #047857; width: 140px; text-align: left;">الرصيد الحالي (ر.ي)</th>
            </tr>
          </thead>
          <tbody>
            ${flatListWithHierarchy.map((acc, idx) => {
              const indent = (acc.level - 1) * 16;
              const isRoot = acc.level === 1;
              const isGroup = acc.level === 2;
              const bg = isRoot ? '#ecfdf5' : isGroup ? '#f8fafc' : (idx % 2 === 0 ? '#ffffff' : '#fafafa');
              const fontWeight = isRoot ? '800' : isGroup ? '700' : '500';
              const fontColor = isRoot ? '#065f46' : isGroup ? '#1e293b' : '#334155';

              return `
                <tr style="background: ${bg}; font-weight: ${fontWeight}; color: ${fontColor};">
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">
                    ${acc.account_code}
                  </td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">
                    <span style="display: inline-block; width: ${indent}px;"></span>
                    ${isRoot ? '📁 ' : isGroup ? '📂 ' : '📄 '}
                    ${acc.name_ar}
                  </td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 10px;">
                    المستوى ${acc.level}
                  </td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 10px;">
                    ${acc.is_leaf ? 'تحليلي / قابل للقيد' : 'رئيسي / تجميعي'}
                  </td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace;">
                    ${acc.total_opening_balance.toLocaleString()} ر.ي
                  </td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; font-weight: bold;">
                    ${acc.total_current_balance.toLocaleString()} ر.ي
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Sign-Off Matrix -->
        <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center; font-size: 11px; font-weight: bold; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
          <div style="flex: 1;">
            <div>إعداد رئيس الحسابات</div>
            <div style="margin-top: 40px; border-top: 1px solid #94a3b8; width: 60%; margin-left: auto; margin-right: auto;"></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">التوقيع والختم</div>
          </div>
          <div style="flex: 1;">
            <div>مراجعة مدير الإدارة المالية</div>
            <div style="margin-top: 40px; border-top: 1px solid #94a3b8; width: 60%; margin-left: auto; margin-right: auto;"></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">التوقيع والختم</div>
          </div>
          <div style="flex: 1;">
            <div>اعتماد المدير التنفيذي</div>
            <div style="margin-top: 40px; border-top: 1px solid #94a3b8; width: 60%; margin-left: auto; margin-right: auto;"></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">الختم المؤسسي الرسمي</div>
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
        <title>الدليل المحاسبي الموحد والمعتمد - جمعية رُحماء بينهم</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; }
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; color: black !important; }
            @page { size: A4 portrait; margin: 12mm; }
          }
        </style>
      </head>
      <body style="background: #ffffff; color: #0f172a; padding: 20px;">
        ${documentHTML}
      </body>
      </html>
    `);
    printDoc.close();
  };

  // Render a Single Tree Node and its Children Recursively
  const renderTreeNode = (node: TreeNodeAccount, depth: number = 0) => {
    // Check search and type filters
    const matchesCurrentSearch = matchesSearch(node, searchTerm);
    const matchesCurrentType = matchesType(node, selectedType);
    const matchesCurrentNature = matchesNature(node, selectedNature);

    if (!matchesCurrentSearch || !matchesCurrentType || !matchesCurrentNature) {
      return null;
    }

    const isExpanded = expandedNodes[node.account_code] ?? (node.level <= 2);
    const hasChildren = node.children.length > 0;
    const isLevel1 = node.level === 1;
    const isLevel2 = node.level === 2;

    return (
      <div key={node.account_code} className="select-none">
        <div 
          className={`group flex items-center justify-between py-2 px-3 my-0.5 rounded-xl transition-all duration-150 border ${
            isLevel1 
              ? 'bg-slate-100/90 dark:bg-zinc-800/90 border-slate-200 dark:border-zinc-700 shadow-xs font-black'
              : isLevel2
              ? 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800/50'
              : node.is_leaf
              ? 'bg-white/70 dark:bg-zinc-950/40 border-slate-100 dark:border-zinc-900 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10'
              : 'bg-slate-50/50 dark:bg-zinc-900/60 border-slate-100 dark:border-zinc-800/80 hover:bg-slate-100/60'
          }`}
          style={{
            paddingRight: isRtl ? `${Math.max(12, depth * 22 + 12)}px` : '12px',
            paddingLeft: !isRtl ? `${Math.max(12, depth * 22 + 12)}px` : '12px'
          }}
        >
          {/* Left / Main Content: Code, Folder, Title, Badges */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Expand / Collapse Chevron */}
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.account_code)}
                className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                title={isExpanded ? (isRtl ? 'طي الفرع' : 'Collapse') : (isRtl ? 'توسيع الفرع' : 'Expand')}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-600" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center text-slate-300 dark:text-zinc-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 inline-block"></span>
              </div>
            )}

            {/* Folder / File Icon */}
            <div className={`p-1 rounded-lg flex items-center justify-center ${
              isLevel1 ? 'bg-emerald-500/10 text-emerald-600' :
              hasChildren ? 'bg-amber-500/10 text-amber-600' :
              'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
            }`}>
              {hasChildren ? (
                isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>

            {/* Code & Title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className={`font-mono text-xs px-2 py-0.5 rounded-md border tracking-wider ${
                isLevel1 ? 'bg-zinc-900 text-amber-400 border-zinc-800 font-extrabold' :
                isLevel2 ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 font-bold' :
                'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-800 text-[11px]'
              }`}>
                {node.account_code}
              </span>

              <span className={`text-xs truncate ${
                isLevel1 ? 'text-slate-900 dark:text-white font-extrabold text-sm' :
                isLevel2 ? 'text-slate-800 dark:text-zinc-100 font-bold' :
                node.is_leaf ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-800 dark:text-zinc-200 font-semibold'
              }`}>
                {isRtl ? node.name_ar : (node.name_en || node.name_ar)}
              </span>

              {/* Children Count Tag */}
              {hasChildren && (
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                  ({node.children.length} {isRtl ? 'فرعي' : 'sub'})
                </span>
              )}
            </div>
          </div>

          {/* Right Content: Balances & Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Level Badge */}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase hidden md:inline-block ${
              node.level === 1 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' :
              node.level === 2 ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300' :
              node.level === 3 ? 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400' :
              'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400'
            }`}>
              {isRtl ? `مستوى ${node.level}` : `L${node.level}`}
            </span>

            {/* Posting vs Control Badge */}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold hidden sm:inline-block ${
              node.is_leaf 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
            }`}>
              {node.is_leaf 
                ? (isRtl ? 'يقبل القيود' : 'Posting') 
                : (isRtl ? 'تجميعي' : 'Control')}
            </span>

            {/* Balances Display */}
            <div className="text-left font-mono min-w-32" style={{ direction: 'ltr' }}>
              <div className={`text-xs font-black ${
                isLevel1 ? 'text-slate-900 dark:text-white text-sm' :
                isLevel2 ? 'text-slate-800 dark:text-zinc-100 font-bold' :
                'text-slate-700 dark:text-zinc-300'
              }`}>
                {node.total_current_balance.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">{isRtl ? 'ر.ي' : 'YER'}</span>
              </div>
              {node.total_opening_balance !== 0 && (
                <div className="text-[9px] text-slate-400">
                  {isRtl ? 'افتتاحي: ' : 'Open: '}{node.total_opening_balance.toLocaleString()}
                </div>
              )}
            </div>

            {/* Quick Actions Strip */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {/* Add Child Account button */}
              <button
                onClick={() => handleOpenAddModal(node.account_code)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all cursor-pointer"
                title={isRtl ? `إضافة حساب فرعي تحت (${node.account_code})` : 'Add Sub-Account'}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* Edit Account button */}
              <button
                onClick={() => {
                  setAccountToEdit(node);
                  setShowEditModal(true);
                }}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all cursor-pointer"
                title={isRtl ? 'تعديل الحساب' : 'Edit Account'}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              {/* View Statement button */}
              {onSelectAccountForStatement && (
                <button
                  onClick={() => onSelectAccountForStatement(node.id)}
                  className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-all cursor-pointer"
                  title={isRtl ? 'كشف حساب الأستاذ العام' : 'Account Statement'}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Render Child Nodes */}
        {hasChildren && isExpanded && (
          <div className="relative border-r border-slate-200/50 dark:border-zinc-800 mr-2 pr-1 space-y-0.5">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Sovereign Financial Dashboard KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
            <span>{isRtl ? 'إجمالي الأصول' : 'Total Assets'}</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-1">
            {stats.totalAssets.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">{isRtl ? 'ر.ي' : 'YER'}</span>
          </div>
          <p className="text-[9px] text-emerald-600 font-bold mt-0.5">✔ {isRtl ? 'متداولة وثابتة ووقفية' : 'Current & Fixed'}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
            <span>{isRtl ? 'الخصوم والالتزامات' : 'Total Liabilities'}</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-base font-black text-amber-600 font-mono mt-1">
            {stats.totalLiabilities.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">{isRtl ? 'ر.ي' : 'YER'}</span>
          </div>
          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{isRtl ? 'ذمم ومنح مؤجلة' : 'Payables & Grants'}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
            <span>{isRtl ? 'صافي الأصول والمتاح' : 'Net Assets'}</span>
            <Scale className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-base font-black text-purple-600 font-mono mt-1">
            {stats.totalEquity.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">{isRtl ? 'ر.ي' : 'YER'}</span>
          </div>
          <p className="text-[9px] text-purple-600 font-bold mt-0.5">{isRtl ? 'أموال مقيدة وعامة' : 'Restricted & Unrestricted'}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
            <span>{isRtl ? 'إجمالي التبرعات والإيراد' : 'Total Revenues'}</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-base font-black text-blue-600 font-mono mt-1">
            {stats.totalRevenues.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">{isRtl ? 'ر.ي' : 'YER'}</span>
          </div>
          <p className="text-[9px] text-blue-600 font-bold mt-0.5">{isRtl ? 'مساهمات وكفالات ومنح' : 'Donations & Pledges'}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
            <span>{isRtl ? 'هيكل الدليل المحاسبي' : 'Chart Structure'}</span>
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-1">
            {stats.totalAccountsCount} <span className="text-[10px] text-slate-400 font-sans">{isRtl ? 'حساب' : 'Accounts'}</span>
          </div>
          <p className="text-[9px] text-slate-500 font-bold mt-0.5">
            {stats.postingAccountsCount} {isRtl ? 'فرعي' : 'leaf'} | {stats.controlAccountsCount} {isRtl ? 'تجميعي' : 'parent'}
          </p>
        </div>
      </div>

      {/* 2. Interactive Controls & Search Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={isRtl ? 'بحث فوري بكود الحساب، أو اسم الحساب بالعربية والإنجليزية...' : 'Search accounts by code, Arabic, or English title...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-zinc-100 placeholder-slate-400 ${
                isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 ${isRtl ? 'left-3' : 'right-3'}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Account Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
            >
              <option value="all">{isRtl ? 'كل أنواع الدليل' : 'All Account Types'}</option>
              <option value="ASSET">{isRtl ? '1 - الأصول (Assets)' : '1 - Assets'}</option>
              <option value="LIABILITY">{isRtl ? '2 - الخصوم (Liabilities)' : '2 - Liabilities'}</option>
              <option value="EQUITY">{isRtl ? '3 - صافي الأصول (Equity)' : '3 - Equity'}</option>
              <option value="REVENUE">{isRtl ? '4 - الإيرادات (Revenue)' : '4 - Revenue'}</option>
              <option value="EXPENSE">{isRtl ? '5 - المصروفات (Expense)' : '5 - Expense'}</option>
            </select>

            {/* Posting / Control Filter */}
            <select
              value={selectedNature}
              onChange={(e) => setSelectedNature(e.target.value as any)}
              className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
            >
              <option value="all">{isRtl ? 'طبيعة الحساب (الكل)' : 'All Natures'}</option>
              <option value="control">{isRtl ? 'حسابات تجميعية رئيسية' : 'Control Accounts'}</option>
              <option value="posting">{isRtl ? 'حسابات فرعية تقبل القيد' : 'Posting Accounts'}</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
              <button
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'tree' 
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs' 
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isRtl ? 'الشجرة (TreeView)' : 'TreeView'}</span>
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'flat' 
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs' 
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{isRtl ? 'الجدول المالي' : 'Table'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tree Quick Zoom and Actions Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs font-bold">
          {/* Depth Controls */}
          {viewMode === 'tree' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-black">{isRtl ? 'الطي والتوسيع:' : 'Levels:'}</span>
              <button
                onClick={expandAll}
                className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg text-[11px] transition-all cursor-pointer"
              >
                {isRtl ? 'توسيع الكل' : 'Expand All'}
              </button>
              <button
                onClick={collapseAll}
                className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg text-[11px] transition-all cursor-pointer"
              >
                {isRtl ? 'طي الكل' : 'Collapse All'}
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700 mx-1"></div>
              <button
                onClick={() => expandToLevel(1)}
                className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-lg text-[10px] cursor-pointer"
              >
                {isRtl ? 'مستوى 1' : 'Level 1'}
              </button>
              <button
                onClick={() => expandToLevel(2)}
                className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-lg text-[10px] cursor-pointer"
              >
                {isRtl ? 'مستوى 2' : 'Level 2'}
              </button>
              <button
                onClick={() => expandToLevel(3)}
                className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-lg text-[10px] cursor-pointer"
              >
                {isRtl ? 'مستوى 3' : 'Level 3'}
              </button>
            </div>
          )}

          {/* Action Tools (Add, Export, Print, Seed) */}
          <div className="flex items-center gap-2 ms-auto">
            <button
              onClick={handleSeedStandardTemplate}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title={isRtl ? 'تهيئة وتغذية الدليل المحاسبي القياسي المعرب وفق معايير IPSAS' : 'Seed Standard IPSAS Chart of Accounts'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isSeeding ? (isRtl ? 'جاري التهيئة...' : 'Seeding...') : (isRtl ? 'تهيئة الدليل القياسي (IPSAS)' : 'Seed Standard COA')}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isRtl ? 'تصدير Excel (CSV)' : 'Export CSV'}</span>
            </button>

            <button
              onClick={handlePrintOfficialCOA}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isRtl ? 'طباعة معتمدة A4' : 'Print Certified A4'}</span>
            </button>

            <EnterpriseButton
              variant="primary"
              size="sm"
              onClick={() => handleOpenAddModal('')}
              icon={<Plus className="w-4 h-4" />}
            >
              {isRtl ? 'إضافة حساب جديد' : 'New Account'}
            </EnterpriseButton>
          </div>
        </div>
      </div>

      {/* 3. Main TreeView / Flat Table Presentation Container */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs overflow-hidden">
        {viewMode === 'tree' ? (
          <div className="space-y-1">
            {rootNodes.map(rootNode => renderTreeNode(rootNode, 0))}
          </div>
        ) : (
          /* Flat Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr className="bg-zinc-900 text-amber-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                  <th className="p-3 w-32">{isRtl ? 'كود الحساب' : 'Code'}</th>
                  <th className="p-3">{isRtl ? 'اسم الحساب في الدليل' : 'Account Title'}</th>
                  <th className="p-3 w-28 text-center">{isRtl ? 'المستوى' : 'Level'}</th>
                  <th className="p-3 w-32">{isRtl ? 'النوع الرئيسي' : 'Type'}</th>
                  <th className="p-3 w-32 text-center">{isRtl ? 'طبيعة الحساب' : 'Nature'}</th>
                  <th className="p-3 text-left w-40">{isRtl ? 'الرصيد الافتتاحي' : 'Opening Bal'}</th>
                  <th className="p-3 text-left w-44">{isRtl ? 'الرصيد الحالي' : 'Current Balance'}</th>
                  <th className="p-3 text-center w-24">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
                {flatListWithHierarchy
                  .filter(node => matchesSearch(node, searchTerm) && matchesType(node, selectedType) && matchesNature(node, selectedNature))
                  .map(acc => (
                    <tr key={acc.account_code} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-all font-semibold">
                      <td className="p-3 font-mono font-black text-slate-900 dark:text-white tracking-wide text-[11px]">{acc.account_code}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span style={{ display: 'inline-block', width: `${(acc.level - 1) * 12}px` }}></span>
                          <span className={acc.level <= 2 ? 'font-extrabold text-slate-900 dark:text-white' : 'font-normal text-slate-800 dark:text-zinc-200'}>
                            {isRtl ? acc.name_ar : (acc.name_en || acc.name_ar)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          L{acc.level}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          {acc.account_type}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          acc.is_leaf ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {acc.is_leaf ? (isRtl ? 'يقبل القيود' : 'Posting') : (isRtl ? 'تجميعي' : 'Control')}
                        </span>
                      </td>
                      <td className="p-3 text-left font-mono text-slate-600 dark:text-zinc-400" style={{ direction: 'ltr' }}>
                        {acc.total_opening_balance.toLocaleString()} {isRtl ? 'ر.ي' : 'YER'}
                      </td>
                      <td className="p-3 text-left font-mono font-black text-slate-900 dark:text-white" style={{ direction: 'ltr' }}>
                        {acc.total_current_balance.toLocaleString()} {isRtl ? 'ر.ي' : 'YER'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenAddModal(acc.account_code)}
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                            title={isRtl ? 'إضافة حساب فرعي' : 'Add Child'}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setAccountToEdit(acc);
                              setShowEditModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded"
                            title={isRtl ? 'تعديل' : 'Edit'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onSelectAccountForStatement && (
                            <button
                              onClick={() => onSelectAccountForStatement(acc.id)}
                              className="p-1 text-slate-400 hover:text-purple-600 rounded"
                              title={isRtl ? 'كشف الحساب' : 'Statement'}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL: Add New Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'إضافة حساب جديد في الدليل المحاسبي' : 'Add New Account to Chart'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedParentCode ? `${isRtl ? 'الحساب الأب المختار:' : 'Parent Account:'} [${selectedParentCode}]` : (isRtl ? 'حساب رئيسي في الدليل' : 'Root Account')}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddAccount} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'كود الحساب' : 'Account Code'} *</label>
                  <input
                    type="text"
                    required
                    value={newAccountForm.account_code}
                    onChange={(e) => setNewAccountForm(p => ({ ...p, account_code: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-black text-emerald-600 focus:outline-none"
                    placeholder="e.g. 110105"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'نوع الحساب الرئيسي' : 'Account Type'}</label>
                  <select
                    value={newAccountForm.account_type}
                    onChange={(e) => setNewAccountForm(p => ({ ...p, account_type: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="ASSET">{isRtl ? 'أصول (Assets)' : 'Assets'}</option>
                    <option value="LIABILITY">{isRtl ? 'خصوم والتزامات (Liabilities)' : 'Liabilities'}</option>
                    <option value="EQUITY">{isRtl ? 'صافي أصول (Equity)' : 'Equity'}</option>
                    <option value="REVENUE">{isRtl ? 'إيرادات وتبرعات (Revenue)' : 'Revenue'}</option>
                    <option value="EXPENSE">{isRtl ? 'مصروفات ونفقات (Expense)' : 'Expense'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم الحساب بالعربية' : 'Account Name (Arabic)'} *</label>
                <input
                  type="text"
                  required
                  value={newAccountForm.name_ar}
                  onChange={(e) => setNewAccountForm(p => ({ ...p, name_ar: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                  placeholder={isRtl ? 'مثال: صندوق فرع المكلا' : 'e.g. Mukalla Branch Vault'}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم الحساب بالإنجليزية (اختياري)' : 'Account Name (English)'}</label>
                <input
                  type="text"
                  value={newAccountForm.name_en}
                  onChange={(e) => setNewAccountForm(p => ({ ...p, name_en: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none font-mono"
                  placeholder="e.g. Mukalla Branch Cash Vault"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الرصيد الافتتاحي (ر.ي)' : 'Opening Balance (YER)'}</label>
                  <input
                    type="number"
                    value={newAccountForm.opening_balance}
                    onChange={(e) => setNewAccountForm(p => ({ ...p, opening_balance: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-6 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={newAccountForm.requires_project}
                      onChange={(e) => setNewAccountForm(p => ({ ...p, requires_project: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{isRtl ? 'يتطلب ربط بمشروع' : 'Requires Project'}</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <EnterpriseButton
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  {isRtl ? 'حفظ وإدراج في الدليل' : 'Save Account'}
                </EnterpriseButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Edit Account */}
      {showEditModal && accountToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'تعديل بيانات الحساب المالي' : 'Edit Chart Account'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    [{accountToEdit.account_code}] - {accountToEdit.account_type}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditAccount} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'كود الحساب (ثابت)' : 'Account Code'}</label>
                <input
                  type="text"
                  disabled
                  value={accountToEdit.account_code}
                  className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs font-mono font-black text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم الحساب بالعربية' : 'Account Name (Arabic)'} *</label>
                <input
                  type="text"
                  required
                  value={accountToEdit.name_ar}
                  onChange={(e) => setAccountToEdit({ ...accountToEdit, name_ar: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم الحساب بالإنجليزية' : 'Account Name (English)'}</label>
                <input
                  type="text"
                  value={accountToEdit.name_en || ''}
                  onChange={(e) => setAccountToEdit({ ...accountToEdit, name_en: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={accountToEdit.is_active}
                    onChange={(e) => setAccountToEdit({ ...accountToEdit, is_active: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{isRtl ? 'الحساب نشط' : 'Active Account'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={accountToEdit.requires_project || false}
                    onChange={(e) => setAccountToEdit({ ...accountToEdit, requires_project: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{isRtl ? 'يتطلب ربط بمشروع' : 'Requires Project'}</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
