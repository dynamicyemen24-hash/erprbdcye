import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Coins, 
  Search, 
  Plus, 
  FolderTree, 
  ListOrdered, 
  TrendingDown, 
  TrendingUp, 
  Info, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Clock,
  ArrowRightLeft,
  DollarSign,
  AlertCircle,
  FolderOpen,
  Calendar,
  X,
  ScanLine,
  UploadCloud,
  Bot,
  Upload,
  Building,
  Sliders,
  Scale,
  Printer,
  Activity,
  Settings2,
  ShoppingCart,
  Calculator,
  QrCode,
  Workflow,
  ShieldCheck,
  Building2,
  Layers,
  Zap,
  GitCommit
} from 'lucide-react';

import { Currency, Project } from '../types';
import { Account, Transaction, TransactionLine } from './finance/FinanceTypes';
import { printHTML, createPrintDocument } from '../lib/printUtils';
import CrossEntityLineageView from '../features/traceability/CrossEntityLineageView';

// Subcomponents
import ChartOfAccountsTreeView from './finance/ChartOfAccountsTreeView';
import CostCentersManagementView from './finance/CostCentersManagementView';
import OpeningBalancesTab from './finance/OpeningBalancesTab';
import AccountStatementTab from './finance/AccountStatementTab';
import FinancialClosingsTab from './finance/FinancialClosingsTab';
import VoucherEntryTab from './finance/VoucherEntryTab';
import FinancialStatementsTab from './finance/FinancialStatementsTab';
import FinancialBIAnalyticsTab from './finance/FinancialBIAnalyticsTab';
import FinancialSettingsTab from './finance/FinancialSettingsTab';
import ProcurementTab from './finance/ProcurementTab';
import CurrencyConversionTab from './finance/CurrencyConversionTab';
import BudgetVarianceTab from './finance/BudgetVarianceTab';
import ManagementAccountingTab from './finance/ManagementAccountingTab';
import EInvoicingEngineTab from './finance/EInvoicingEngineTab';
import TransactionDocumentCycleTracker from './finance/TransactionDocumentCycleTracker';
import BatchLedgerAutomationEngine from '../features/finance/BatchLedgerAutomationEngine';
import CFOExecutiveAuditSuite from '../features/finance/CFOExecutiveAuditSuite';
import EndowmentInvestmentGovernanceSuite from '../features/finance/EndowmentInvestmentGovernanceSuite';
import ConsolidatedStatementsTab from '../features/finance/ConsolidatedStatementsTab';
import FinanceOperationsControlBar from '../features/finance/FinanceOperationsControlBar';
import ReverseEntryModal from '../features/finance/ReverseEntryModal';
import UnifiedRevenueEngineTab from './finance/UnifiedRevenueEngineTab';
import DataExchangeHub from './DataExchangeHub';
import { EnterpriseToolStrip } from './EnterpriseToolStrip';
import { ModuleShell } from './enterprise/ModuleShell';
import { PolicyButton } from '../core/security/PermissionGate';
import { EnterpriseSkeletonTable } from './common/EnterpriseSkeletonTable';
import { PrintableOfficialVoucherModal, OfficialVoucherData } from './finance/PrintableOfficialVoucherModal';

interface FinanceViewProps {
  currencies: Currency[];
  lang: 'ar' | 'en';
  onRefresh: () => void;
  onNavigate?: (tab: string) => void;
}

type FinanceSubTab = 'coa' | 'cost_centers' | 'lineage' | 'opening_balances' | 'data_exchange' | 'entry' | 'payment_vouchers' | 'receipt_vouchers' | 'document_workflow' | 'ledger' | 'statement_query' | 'statements' | 'closings' | 'ai_parser' | 'bi_analytics' | 'governance_settings' | 'procurement' | 'currency_conversion' | 'budget_variance' | 'management_accounting' | 'e_invoicing' | 'batch_automation' | 'cfo_audit_suite' | 'endowment_governance' | 'consolidated_statements' | 'revenue_engine';

export default function FinanceView({ currencies, lang, onRefresh, onNavigate }: FinanceViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<FinanceSubTab>('coa');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lines, setLines] = useState<TransactionLine[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<boolean>(false);
  
  // Security State
  const [securityLevel] = useState(3);
  const [userRole] = useState('admin');

  const [coaSearch, setCoaSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [statementAccountId, setStatementAccountId] = useState<string>('');

  // Operational Control Bar State & Reverse Entry Modal
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('HQ_SANAA');
  const [accountingPillar, setAccountingPillar] = useState<'all' | 'operations' | 'ledger' | 'statements' | 'cost_budget' | 'automation'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState('YER');

  // AI Parser State
  const [parsingAi, setParsingAi] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [aiError, setAiError] = useState('');
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);

  // Official A4 Voucher Modal State
  const [selectedOfficialVoucher, setSelectedOfficialVoucher] = useState<OfficialVoucherData | null>(null);
  const [showOfficialVoucherModal, setShowOfficialVoucherModal] = useState(false);

  const handleOpenOfficialA4Modal = (tx: Transaction) => {
    const txLines = lines.filter((l: any) => l.transaction_id === tx.id);
    const proj = projects.find(p => p.id === tx.project_id);

    setSelectedOfficialVoucher({
      voucherNumber: tx.transaction_number || `PV-${tx.id.slice(0, 8)}`,
      dateGregorian: new Date(tx.transaction_date).toLocaleDateString('en-GB'),
      dateHijri: '1448 هـ',
      payeeName: (tx as any).party_name || (lang === 'ar' ? 'الجهة المستفيدة / المقاول المعتمد' : 'Authorized Payee / Contractor'),
      projectName: proj?.name_ar || (lang === 'ar' ? 'مشروع مياه وإصحاح صبر الموادم' : 'WASH Sabir Project'),
      projectCode: proj?.code || 'PRJ-WASH-2026',
      costCenter: lang === 'ar' ? 'الإدارة العامة للمشاريع - فرع تعز' : 'Field Operations - Taiz HQ',
      paymentMethodAr: tx.transaction_type === 'PAYMENT' ? 'تحويل بنكي رسمي / شيك مصرفي' : 'سند محاسبي مباشر',
      referenceDocNumber: (tx as any).reference_number || 'TRX-REF-9021',
      amountYer: parseFloat(String(tx.total_debit || tx.total_credit || 0)),
      descriptionAr: tx.description || 'صرف مستحقات تنفيذية بحسب اللائحة والمعايير المعتمدة',
      lines: txLines.length > 0 ? txLines.map(l => {
        const acc = accounts.find(a => a.account_code === l.account_code || a.id === l.account_id);
        return {
          accountCode: l.account_code || acc?.account_code || '10101',
          accountName: (lang === 'ar' ? acc?.name_ar : acc?.name_en) || 'حساب الأستاذ العام',
          debitYer: parseFloat(String(l.debit_amount || 0)),
          creditYer: parseFloat(String(l.credit_amount || 0)),
          noteAr: l.description || tx.description || 'بيان القيد المحاسبي'
        };
      }) : [
        {
          accountCode: '21010',
          accountName: 'مصاريف تنفيذ أنشطة الميدان - مياه وإصحاح',
          debitYer: parseFloat(String(tx.total_debit || tx.total_credit || 0)),
          creditYer: 0,
          noteAr: tx.description || 'مستحقات المقاول الميداني'
        },
        {
          accountCode: '10102',
          accountName: 'حساب النقدية بالبنوك - بنك التضامن',
          debitYer: 0,
          creditYer: parseFloat(String(tx.total_debit || tx.total_credit || 0)),
          noteAr: 'صرف تحويل بنكي معتمد'
        }
      ],
      preparedBy: lang === 'ar' ? 'المحاسب المالي' : 'Accountant',
      reviewedBy: lang === 'ar' ? 'المراجع المالي والرقابة' : 'Internal Auditor',
      approvedBy: lang === 'ar' ? 'المدير التنفيذي د. فؤاد هزاع' : 'Executive Director'
    });
    setShowOfficialVoucherModal(true);
  };

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [accRes, txRes, linesRes, projRes, orgRes, actRes] = await Promise.all([
        fetch('/api/tables/chart_of_accounts'),
        fetch('/api/tables/transactions'),
        fetch('/api/tables/transaction_lines'),
        fetch('/api/tables/projects'),
        fetch('/api/tables/organizations'),
        fetch('/api/tables/activities')
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts((accData && Array.isArray(accData)) ? accData : []);
      } else {
        setFetchError(true);
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData || []);
      }
      if (linesRes.ok) {
        const linesData = await linesRes.json();
        setLines(linesData || []);
      }
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData || []);
      }
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrganizations(orgData || []);
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivities(actData || []);
      }
    } catch (err) {
      console.warn('[Finance] Live data fetch failed — showing empty state (no stale snapshot):', err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceData();

    // Check if we navigated via a project status drilldown
    const drilldownStatus = localStorage.getItem('finance_drilldown_status');
    if (drilldownStatus) {
      setActiveSubTab('budget_variance');
    }
  }, [fetchFinanceData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiError('');
    setParsedData(null);
    setParsingAi(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setAiImagePreview(base64);

      try {
        const response = await fetch('/api/gemini/parse-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type
          })
        });

        if (!response.ok) {
          throw new Error('Server returned an error');
        }

        const resData = await response.json();
        if (resData.status === 'ok') {
          setParsedData(resData.data);
        } else {
          throw new Error(resData.message || 'Error parsing document');
        }
      } catch (err: any) {
        setAiError(err.message || 'An error occurred during AI analysis');
      } finally {
        setParsingAi(false);
      }
    };
    reader.onerror = () => {
      setAiError('Failed to read file');
      setParsingAi(false);
    };
    reader.readAsDataURL(file);
  };

  const mapParsedToEntry = () => {
    if (!parsedData) return;
    setActiveSubTab('entry');
  };

  const handlePrintVoucher = async (tx: Transaction) => {
    try {
      const txLines = lines.filter((l: any) => l.transaction_id === tx.id);

      // Resilient print writer — popup window when allowed, sandbox-safe iframe fallback
      const printDoc = createPrintDocument();

      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      const voucherTypeName = tx.transaction_type === 'RECEIPT' ? (lang === 'ar' ? 'سند قبض نقدي' : 'Receipt Voucher') :
                              tx.transaction_type === 'PAYMENT' ? (lang === 'ar' ? 'سند صرف نقدي' : 'Payment Voucher') :
                              (lang === 'ar' ? 'قيد محاسبي يومي' : 'Journal Voucher');

      const linesHTML = txLines.map((line: any, idx: number) => {
        const acc = accounts.find(a => a.account_code === line.account_code || a.id === line.account_id);
        const accName = acc ? (lang === 'ar' ? acc.name_ar : acc.name_en) : '';
        return `
          <tr class="border-b border-slate-200">
            <td class="p-3 text-slate-800 font-mono font-bold text-center">${idx + 1}</td>
            <td class="p-3 font-mono font-bold text-slate-900">${line.account_code}</td>
            <td class="p-3 text-slate-900 font-black">${accName || (lang === 'ar' ? 'حساب عام' : 'Ledger Account')}</td>
            <td class="p-3 text-slate-700 font-medium">${line.description || tx.description}</td>
            <td class="p-3 text-right font-mono font-bold text-slate-900">${line.debit_amount > 0 ? parseFloat(String(line.debit_amount)).toLocaleString() : '-'}</td>
            <td class="p-3 text-right font-mono font-bold text-slate-900">${line.credit_amount > 0 ? parseFloat(String(line.credit_amount)).toLocaleString() : '-'}</td>
          </tr>
        `;
      }).join('');

      printDoc.write(`
        <!DOCTYPE html>
        <html lang="${lang}" dir="${dir}">
        <head>
          <meta charset="UTF-8">
          <title>${voucherTypeName} - ${tx.transaction_number}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;900&display=swap');
            body {
              font-family: ${lang === 'ar' ? "'Tajawal', sans-serif" : "'Plus Jakarta Sans', sans-serif"};
            }
            @media print {
              .no-print { display: none !important; }
              body { background-color: white !important; color: black !important; }
            }
          </style>
        </head>
        <body class="bg-slate-100 text-slate-900 p-8">
          <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
            <span class="text-xs font-bold text-slate-500">${lang === 'ar' ? 'سند مالي رسمي معد للطباعة والارشفة' : 'Official financial voucher ready for printing'}</span>
            <button onclick="window.print()" class="px-5 py-2.5 bg-amber-600 text-white font-extrabold text-xs rounded-xl cursor-pointer">
              ${lang === 'ar' ? 'إصدار أمر الطباعة الحقيقي 🖨️' : 'Print Document 🖨️'}
            </button>
          </div>

          <div class="max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl p-10 shadow-lg min-h-[297mm] flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-center pb-6 border-b-2 border-slate-950">
                <div class="text-right">
                  <h1 class="font-black text-sm text-slate-900">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h1>
                  <p class="text-[10px] font-bold text-slate-500">نظام UAMEX ERP™ المؤسسي الشامل</p>
                </div>
                <span class="text-xs font-black border-2 border-slate-950 px-4 py-1.5 bg-slate-50 rounded">
                  ${voucherTypeName}
                </span>
                <div class="text-left">
                  <h1 class="font-black text-sm text-slate-900">Rohamaa Charity Foundation</h1>
                  <p class="text-[10px] font-bold text-slate-500">UAMEX ERP™ System</p>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-200 text-xs mb-6">
                <div>
                  <p class="text-slate-400 font-bold">${lang === 'ar' ? 'رقم السند/القيد' : 'Voucher Number'}</p>
                  <p class="font-mono font-black text-slate-900 mt-1">${tx.transaction_number}</p>
                </div>
                <div>
                  <p class="text-slate-400 font-bold">${lang === 'ar' ? 'تاريخ الترحيل' : 'Posting Date'}</p>
                  <p class="font-mono font-semibold text-slate-700 mt-1">${new Date(tx.transaction_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p class="text-slate-400 font-bold">${lang === 'ar' ? 'طريقة الصرف/القبض' : 'Payment Method'}</p>
                  <p class="font-bold text-slate-700 mt-1">${tx.payment_method || 'CASH'}</p>
                </div>
                <div>
                  <p class="text-slate-400 font-bold">${lang === 'ar' ? 'المرجع/الشيك' : 'Reference / Check'}</p>
                  <p class="font-mono font-semibold text-slate-700 mt-1">${tx.reference_number || '-'}</p>
                </div>
              </div>

              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200/60 mb-6 text-xs">
                <p class="text-slate-400 font-black mb-1">${lang === 'ar' ? 'البيان العام والشرح' : 'General Narration'}</p>
                <p class="font-bold text-slate-900 leading-relaxed">${tx.description}</p>
              </div>

              <table class="w-full text-xs text-right border-collapse border border-slate-200 mb-8">
                <thead>
                  <tr class="bg-slate-950 text-white font-extrabold uppercase">
                    <th class="p-3 border border-slate-200 text-center w-12">#</th>
                    <th class="p-3 border border-slate-200 w-32">${lang === 'ar' ? 'رمز الحساب' : 'Code'}</th>
                    <th class="p-3 border border-slate-200 w-48">${lang === 'ar' ? 'اسم الحساب في الدليل' : 'Account Name'}</th>
                    <th class="p-3 border border-slate-200">${lang === 'ar' ? 'الشرح التفصيلي للسطر' : 'Line Description'}</th>
                    <th class="p-3 border border-slate-200 text-right w-32">${lang === 'ar' ? 'مدين (ر.ي)' : 'Debit (YER)'}</th>
                    <th class="p-3 border border-slate-200 text-right w-32">${lang === 'ar' ? 'دائن (ر.ي)' : 'Credit (YER)'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${linesHTML}
                  <tr class="bg-slate-100 font-black text-slate-900">
                    <td colspan="4" class="p-3 border border-slate-200 text-center">${lang === 'ar' ? 'الإجمالي المتوازن' : 'Balanced Total'}</td>
                    <td class="p-3 border border-slate-200 text-right font-mono">${parseFloat(String(tx.total_debit)).toLocaleString()}</td>
                    <td class="p-3 border border-slate-200 text-right font-mono">${parseFloat(String(tx.total_credit)).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="grid grid-cols-3 gap-6 text-center text-[10px] font-black text-slate-600 border-t border-slate-200 pt-6">
              <div>
                <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'منشئ السند' : 'Prepared By'}</p>
              </div>
              <div>
                <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'المراجع المالي والتدقيق' : 'Audited By'}</p>
              </div>
              <div>
                <p class="border-b border-slate-400 pb-1">${lang === 'ar' ? 'اعتماد المدير التنفيذي والختم' : 'Executive Approval & Stamp'}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      printDoc.close();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAccounts = useMemo(() => accounts.filter((acc) => {
    const term = coaSearch.toLowerCase();
    const codeMatch = acc.account_code.includes(term);
    const nameMatch = (acc.name_ar && acc.name_ar.includes(term)) || 
                      (acc.name_en && acc.name_en.toLowerCase().includes(term));
    const typeMatch = selectedType === 'all' || acc.account_type === selectedType;
    return (codeMatch || nameMatch) && typeMatch;
  }), [accounts, coaSearch, selectedType]);

  return (
    <ModuleShell
      titleAr="نظام المالية والحوكمة"
      titleEn="Finance & Compliance OS"
      descAr="إدارة القيود اليومية والحسابات والموازنات العمومية والتقارير المالية"
      descEn="Double-entry general ledger, budget lines audit, and financial statements"
      domainCode="NEB-10"
      icon={Coins}
      accent="emerald"
      lang={lang}
      onRefresh={onRefresh}
      breadcrumbs={[
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', onClick: () => {} },
        { label: lang === 'ar' ? 'المالية' : 'Finance' }
      ]}
    >
    <div className="space-y-6">
      
      {/* REVERSE JOURNAL ENTRY MODAL */}
      <ReverseEntryModal
        isOpen={showReverseModal}
        onClose={() => setShowReverseModal(false)}
        lang={lang}
        onExecuteReverse={(_refNum, _reason) => {
          fetchFinanceData();
        }}
      />

      {/* DISTINCT FINANCIAL OPERATIONS CONTROL BAR WITH TOOLTIPS & TENANTS */}
      <FinanceOperationsControlBar
        lang={lang}
        onNewVoucher={() => setActiveSubTab('entry')}
        onRefresh={fetchFinanceData}
        isLoading={loading}
        searchQuery={coaSearch}
        onSearchChange={setCoaSearch}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
        onOpenReverseModal={() => setShowReverseModal(true)}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg shadow-emerald-700/15">
        <div className="space-y-1.5">
          <h2 className="text-xl font-black flex items-center gap-2.5">
            <Coins className="w-6 h-6 text-amber-400 shrink-0" />
            <span>{lang === 'ar' ? 'منظومة يو امكس - الإدارة المالية الموحدة (NEB-10)' : 'UAMEX ERP™ Financial & Accounting OS'}</span>
          </h2>
          <p className="text-[11px] font-bold text-emerald-100 max-w-2xl leading-relaxed">
            {lang === 'ar' 
              ? 'الخدمات المالية المتكاملة ودفاتر الأستاذ وقيود التسوية ومطابقة موازين المراجعة ومراكز التكلفة للمشاريع الإنسانية.' 
              : 'Complete financial ledger management, voucher double-entry, project center dimensions, and fiscal balance audits.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchFinanceData}
            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/20 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      
      {/* ─── ACCOUNTING PILLARS FILTER BAR (محاور العمليات المحاسبية الأساسية) ─── */}
      <div className="bg-slate-100 dark:bg-zinc-900/80 p-2 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-200 dark:border-zinc-800">
          <span className="text-[11px] font-black text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'ar' ? 'أبواب العمليات المحاسبية والرقابية المعتمدة (معايير IPSAS):' : 'Core Accounting & Audit Operational Pillars:'}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
            {lang === 'ar' ? '23 شاشة متكاملة الأثر المالي' : '23 Fully Integrated Financial Modules'}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', labelAr: 'كافة الأدوات (23)', labelEn: 'All Modules (23)', icon: FolderOpen },
            { id: 'operations', labelAr: 'سندات الصرف والقبض والقيود', labelEn: 'Vouchers & JV Ops', icon: TrendingDown },
            { id: 'ledger', labelAr: 'الدليل والأرصدة واليومية', labelEn: 'COA & Ledger', icon: FolderTree },
            { id: 'statements', labelAr: 'الميزان والقوائم والتدقيق', labelEn: 'Statements & Audit', icon: Scale },
            { id: 'cost_budget', labelAr: 'مراكز التكلفة والموازنات', labelEn: 'Cost & Budgets', icon: Calculator },
            { id: 'automation', labelAr: 'الأتمتة والدورة والمشتريات', labelEn: 'Automation & P2P', icon: Zap },
          ].map((pillar) => {
            const Icon = pillar.icon;
            const isSelected = accountingPillar === pillar.id;
            return (
              <button
                key={pillar.id}
                onClick={() => setAccountingPillar(pillar.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' 
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? pillar.labelAr : pillar.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* Main Subtab Nav */}
      <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-zinc-900/60 p-2 rounded-2xl overflow-x-auto border border-slate-200 dark:border-zinc-800">
        {[
          { id: 'revenue_engine', label: lang === 'ar' ? 'محرك الإيرادات الموحد (NEB-15)' : 'Unified Revenue Engine (NEB-15)', icon: TrendingUp },
          { id: 'coa', label: lang === 'ar' ? 'دليل الحسابات' : 'Chart of Accounts', icon: FolderTree },
          { id: 'cost_centers', label: lang === 'ar' ? 'مراكز التكلفة ومحاسبة الأنشطة' : 'Cost Centers & Activity OS', icon: Calculator },
          { id: 'lineage', label: lang === 'ar' ? 'سلسلة التتبع والتكامل المؤسسي' : 'Cross-Entity Lineage & Traceability', icon: GitCommit },
          { id: 'payment_vouchers', label: lang === 'ar' ? '💸 شاشة سندات الصرف المالي' : 'Payment Vouchers Workspace', icon: TrendingDown },
          { id: 'receipt_vouchers', label: lang === 'ar' ? '💰 شاشة سندات التوريد والقبض' : 'Receipt Vouchers Workspace', icon: TrendingUp },
          { id: 'opening_balances', label: lang === 'ar' ? 'الأرصدة الافتتاحية' : 'Opening Balances', icon: DollarSign },
          { id: 'data_exchange', label: lang === 'ar' ? 'مركز الاستيراد والتصدير والمشاركة' : 'Import, Export & Exchange Hub', icon: UploadCloud },
          { id: 'entry', label: lang === 'ar' ? 'قيد يومية وتدقيق عام (JV)' : 'Journal Voucher (JV)', icon: Plus },
          { id: 'document_workflow', label: lang === 'ar' ? 'متابعة المعاملات والدورة المستندية' : 'Document Cycle & Workflow', icon: Workflow },
          { id: 'procurement', label: lang === 'ar' ? 'إدارة المشتريات (P2P)' : 'Procurement & P2P', icon: ShoppingCart },
          { id: 'ledger', label: lang === 'ar' ? 'اليومية العامة والسجل' : 'General Ledger', icon: ListOrdered },
          { id: 'statement_query', label: lang === 'ar' ? 'كشف حساب تحليلي' : 'Account Statement', icon: FileText },
          { id: 'statements', label: lang === 'ar' ? 'ميزان ومطابقة القوائم' : 'Financial Statements', icon: Scale },
          { id: 'closings', label: lang === 'ar' ? 'الإقفال السنوي والدوري' : 'Financial Closings', icon: Sliders },
          { id: 'ai_parser', label: lang === 'ar' ? 'محلل المستندات AI' : 'Smart AI Parser', icon: Bot },
          { id: 'cfo_audit_suite', label: lang === 'ar' ? 'جناح التدقيق والرقابة المالية' : 'CFO & CPA Audit Suite', icon: ShieldCheck },
          { id: 'endowment_governance', label: lang === 'ar' ? 'الأوقاف وأسقف وموازنات الإنفاق' : 'Endowments & Spending Limits', icon: Building2 },
          { id: 'consolidated_statements', label: lang === 'ar' ? 'القوائم المالية المجمعة للفروع' : 'Multi-Branch Consolidation', icon: Layers },
          { id: 'bi_analytics', label: lang === 'ar' ? 'الرسوم البيانية ومؤشرات الأداء' : 'Financial Charts & Analytics', icon: Activity },
          { id: 'management_accounting', label: lang === 'ar' ? 'المحاسبة الإدارية وهامش الأمان' : 'Management Accounting & CVP', icon: Calculator },
          { id: 'e_invoicing', label: lang === 'ar' ? 'الفواتير والسندات الإلكترونية' : 'E-Invoicing & Receipts', icon: QrCode },
          { id: 'batch_automation', label: lang === 'ar' ? 'المعالجة المجمعة التلقائية' : 'Batch Operations Engine', icon: Zap },
          { id: 'budget_variance', label: lang === 'ar' ? 'تحليل التباين ومقارنة الموازنة' : 'Budget Variance Analysis', icon: Scale },
          { id: 'currency_conversion', label: lang === 'ar' ? 'تحويل العملات وأسعار الصرف' : 'Currency Conversion & Rates', icon: ArrowRightLeft },
          { id: 'governance_settings', label: lang === 'ar' ? 'السياسات المالية وإعدادات الصرف' : 'Financial Policies & Currency Settings', icon: Settings2 },
        ].filter((tab) => {
          if (accountingPillar === 'all') return true;
          if (accountingPillar === 'operations') {
            return ['lineage', 'payment_vouchers', 'receipt_vouchers', 'entry', 'ledger', 'document_workflow'].includes(tab.id);
          }
          if (accountingPillar === 'ledger') {
            return ['coa', 'cost_centers', 'opening_balances', 'statement_query', 'data_exchange'].includes(tab.id);
          }
          if (accountingPillar === 'statements') {
            return ['statements', 'consolidated_statements', 'closings', 'cfo_audit_suite', 'bi_analytics'].includes(tab.id);
          }
          if (accountingPillar === 'cost_budget') {
            return ['cost_centers', 'lineage', 'management_accounting', 'budget_variance', 'endowment_governance', 'currency_conversion'].includes(tab.id);
          }
          if (accountingPillar === 'automation') {
            return ['e_invoicing', 'batch_automation', 'ai_parser', 'procurement', 'governance_settings'].includes(tab.id);
          }
          return true;
        }).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as FinanceSubTab)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isActive ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 0: UNIFIED REVENUE ENGINE (NEB-15) — ANY REVENUE TYPE, FULL LIFECYCLE */}
      {activeSubTab === 'revenue_engine' && (
        <UnifiedRevenueEngineTab
          lang={lang}
          projects={projects}
        />
      )}

      {/* SUBTAB 1: CHART OF ACCOUNTS HIERARCHICAL TREEVIEW */}
      {activeSubTab === 'coa' && (
        <>
          {fetchError && (
            <div className="mb-3 px-4 py-3 rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'تعذّر الاتصال بنظام المعطيات الحيّ. تُعرض البيانات الفارغة الواقعية (لا لقطة قديمة). أعد المحاولة بعد تأكيد توفر الخادم.'
                  : 'Live data source unavailable. Showing the real empty state (no stale snapshot). Verify server connectivity and retry.'}
              </span>
            </div>
          )}
          <ChartOfAccountsTreeView 
          accounts={accounts} 
          lang={lang} 
          onRefresh={fetchFinanceData} 
          onSelectAccountForStatement={(accId) => {
            setStatementAccountId(accId);
            setActiveSubTab('statement_query');
          }}
          onNavigateToTab={(tab) => {
            if (tab === 'statement_query') {
              setActiveSubTab('statement_query');
            } else if (onNavigate) {
              onNavigate(tab);
            }
          }}
          onSaveAccounts={(updated) => {
            setAccounts(updated);
          }}
          />
        </>
      )}

      {/* SUBTAB: STANDARDIZED COST CENTERS MANAGEMENT */}
      {activeSubTab === 'cost_centers' && (
        <CostCentersManagementView
          lang={lang}
          onSelectCostCenterForVoucher={(ccCode) => {
            setActiveSubTab('entry');
          }}
          onNavigateToTab={(tab) => {
            setActiveSubTab(tab as any);
          }}
        />
      )}

      {/* SUBTAB: CROSS-ENTITY LINEAGE & TRACEABILITY SUITE */}
      {activeSubTab === 'lineage' && (
        <CrossEntityLineageView
          lang={lang}
          onNavigateToEntity={(domain, id) => {
            if (domain === 'vouchers') setActiveSubTab('payment_vouchers');
            else if (domain === 'ledger') setActiveSubTab('ledger');
          }}
        />
      )}

      {/* SUBTAB 2: OPENING BALANCES */}
      {activeSubTab === 'opening_balances' && (
        <OpeningBalancesTab 
          accounts={accounts} 
          lang={lang} 
          onRefresh={fetchFinanceData} 
        />
      )}

      {/* SUBTAB 2.5: UNIFIED DATA EXCHANGE HUB */}
      {activeSubTab === 'data_exchange' && (
        <DataExchangeHub 
          lang={lang} 
          onRefreshAll={fetchFinanceData} 
        />
      )}

      {/* SUBTAB 3: DOUBLE ENTRY FORM */}
      {activeSubTab === 'entry' && (
        <VoucherEntryTab 
          accounts={accounts} 
          projects={projects} 
          currencies={currencies}
          activities={activities}
          organizations={organizations}
          lang={lang} 
          onRefresh={fetchFinanceData} 
          initialData={parsedData}
        />
      )}

      {/* SUBTAB 3.1: DEDICATED INDEPENDENT FINANCIAL PAYMENT VOUCHERS WORKSPACE */}
      {activeSubTab === 'payment_vouchers' && (
        <VoucherEntryTab 
          accounts={accounts} 
          projects={projects} 
          currencies={currencies}
          activities={activities}
          organizations={organizations}
          lang={lang} 
          onRefresh={fetchFinanceData} 
          initialData={{ transaction_type: 'PAYMENT', description: lang === 'ar' ? 'سند صرف مالي نقد/بنك/حوالة' : 'Payment Voucher' }}
        />
      )}

      {/* SUBTAB 3.2: DEDICATED INDEPENDENT FINANCIAL RECEIPT VOUCHERS WORKSPACE */}
      {activeSubTab === 'receipt_vouchers' && (
        <VoucherEntryTab 
          accounts={accounts} 
          projects={projects} 
          currencies={currencies}
          activities={activities}
          organizations={organizations}
          lang={lang} 
          onRefresh={fetchFinanceData} 
          initialData={{ transaction_type: 'RECEIPT', description: lang === 'ar' ? 'سند توريد وقبض وتبرعات' : 'Receipt Voucher' }}
        />
      )}

      {/* SUBTAB: DOCUMENT CYCLE & WORKFLOW TRACKING */}
      {activeSubTab === 'document_workflow' && (
        <TransactionDocumentCycleTracker
          accounts={accounts}
          transactions={transactions}
          lines={lines}
          projects={projects}
          currencies={currencies}
          organizations={organizations}
          activities={activities}
          lang={lang}
          onRefresh={fetchFinanceData}
        />
      )}

      {/* SUBTAB 4: VOUCHER LISTING */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse" style={{ textAlign: lang === 'en' ? 'left' : 'right' }}>
              <thead>
                <tr className="bg-zinc-900 text-amber-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                  <th className="p-3 w-12">#</th>
                  <th className="p-3 w-36">{lang === 'ar' ? 'رقم القيد' : 'Voucher No'}</th>
                  <th className="p-3 w-28">{lang === 'ar' ? 'تاريخ الترحيل' : 'Posting Date'}</th>
                  <th className="p-3 w-32">{lang === 'ar' ? 'نوع السند' : 'Type'}</th>
                  <th className="p-3">{lang === 'ar' ? 'الشرح والبيان العام' : 'Narration'}</th>
                  <th className="p-3 text-right w-44">{lang === 'ar' ? 'القيمة المتزنة (ريال يمني)' : 'Balanced Amount (YER)'}</th>
                  <th className="p-3 text-center w-36">{lang === 'ar' ? 'المستندات' : 'Documents'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-slate-700">
                {loading ? (
                  <EnterpriseSkeletonTable rows={6} columns={7} colWidths={['w-8', 'w-28', 'w-24', 'w-20', 'w-56', 'w-28', 'w-28']} />
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-400 font-bold">
                      <AlertCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                      <h4 className="text-xs text-slate-700">{lang === 'ar' ? 'لا توجد قيود مرحلة حالياً' : 'No posted transactions found'}</h4>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-all font-semibold">
                      <td className="p-3 font-mono text-[10px] text-zinc-400">{idx + 1}</td>
                      <td className="p-3 font-mono text-slate-900 font-black tracking-wide text-[11px]">{tx.transaction_number}</td>
                      <td className="p-3 font-mono text-slate-600">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                          tx.transaction_type === 'PAYMENT' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          tx.transaction_type === 'RECEIPT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-slate-100 text-slate-700 border border-slate-200/50'
                        }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 font-bold text-xs">{tx.description}</td>
                      <td className="p-3 text-right font-mono text-zinc-950 font-extrabold text-[12px]">
                        {(parseFloat(String(tx.total_debit || tx.total_credit || 0))).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenOfficialA4Modal(tx)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl font-black text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                            title={lang === 'ar' ? 'معاينة وطباعة السند الرسمي المعتمد A4 مع الترويسة والختم' : 'Official A4 Stamped Voucher Preview'}
                          >
                            <Printer className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <span>{lang === 'ar' ? 'سند رسمي A4' : 'A4 Official'}</span>
                          </button>
                          
                          <PolicyButton
                            action="print"
                            domain="finance"
                            securityLevel={securityLevel}
                            userRole={userRole}
                            onClick={() => handlePrintVoucher(tx)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>{lang === 'ar' ? 'سريع' : 'Quick'}</span>
                          </PolicyButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 5: DETAILED ACCOUNT STATEMENT */}
      {activeSubTab === 'statement_query' && (
        <AccountStatementTab 
          accounts={accounts} 
          transactions={transactions} 
          lines={lines} 
          lang={lang} 
          initialAccountId={statementAccountId}
        />
      )}

      {/* SUBTAB 6: FINANCIAL STATEMENTS */}
      {activeSubTab === 'statements' && (
        <FinancialStatementsTab 
          accounts={accounts} 
          lang={lang} 
        />
      )}

      {/* SUBTAB 7: YEAR-END CLOSING */}
      {activeSubTab === 'closings' && (
        <FinancialClosingsTab 
          accounts={accounts} 
          lang={lang} 
          onRefresh={fetchFinanceData} 
        />
      )}

      {/* SUBTAB 8: AI PARSER */}
      {activeSubTab === 'ai_parser' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs animate-fade-in space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" />
              {lang === 'ar' ? 'محلل المستندات المالي الذكي' : 'Smart Financial Document Parser'}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              {lang === 'ar' ? 'قم برفع صورة فاتورة أو سند أو إيصال وسيقوم الذكاء الاصطناعي باستخراج البيانات وبناء قيد محاسبي مقترح.' : 'Upload a receipt or invoice image to automatically extract data and suggest a double-entry journal voucher.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block w-full border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/35 rounded-xl p-8 text-center cursor-pointer transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <div className="flex flex-col items-center justify-center">
                  <UploadCloud className="w-10 h-10 text-emerald-400 mb-3" />
                  <span className="text-sm font-black text-slate-700">
                    {lang === 'ar' ? 'انقر لرفع صورة المستند' : 'Click to upload document image'}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1 font-bold">PNG, JPG up to 10MB</span>
                </div>
              </label>

              {aiImagePreview && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50 p-2">
                  <img src={aiImagePreview} alt="Document preview" className="w-full h-auto max-h-64 object-contain rounded-lg" />
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-5 flex flex-col justify-center">
              {parsingAi ? (
                <div className="flex flex-col items-center justify-center text-emerald-600 py-10">
                  <RefreshCw className="w-12 h-12 animate-spin mb-4" />
                  <p className="text-sm font-black animate-pulse">
                    {lang === 'ar' ? 'جاري تحليل المستند المالي واستخراج القيود...' : 'Analyzing financial document & extracting entries...'}
                  </p>
                </div>
              ) : aiError ? (
                <div className="text-center text-rose-600 py-6">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-xs font-bold">{aiError}</p>
                </div>
              ) : parsedData ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-xs font-black">{lang === 'ar' ? 'تم الاستخراج بنجاح' : 'Extraction Successful'}</span>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'نوع المعاملة' : 'Transaction Type'}</span>
                      <p className="text-xs font-bold text-slate-900">{parsedData.transaction_type}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'البيان' : 'Description'}</span>
                      <p className="text-xs font-bold text-slate-900">{parsedData.description}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'رقم المرجع' : 'Reference'}</span>
                      <p className="text-xs font-bold text-slate-900">{parsedData.reference_no || '-'}</p>
                    </div>
                  </div>

                  <button
                    onClick={mapParsedToEntry}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-2 shadow-sm"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    {lang === 'ar' ? 'تحويل إلى نموذج القيد المزدوج' : 'Convert to Double-Entry Form'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400 py-10 opacity-50">
                  <Bot className="w-12 h-12 mb-4" />
                  <p className="text-xs font-bold text-center px-6">
                    {lang === 'ar' ? 'الذكاء الاصطناعي جاهز لتحليل الفواتير والسندات وتوجيهها محاسبياً.' : 'AI is ready to parse invoices and receipts and route them to ledger.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 9: BI & ANALYTICS */}
      {activeSubTab === 'bi_analytics' && (
        <FinancialBIAnalyticsTab 
          accounts={accounts}
          transactions={transactions}
          lines={lines}
          projects={projects}
          lang={lang}
        />
      )}

      {/* SUBTAB 10: GOVERNANCE, SETTINGS & POLICIES */}
      {activeSubTab === 'governance_settings' && (
        <FinancialSettingsTab 
          currencies={currencies}
          lang={lang}
          onRefreshCurrencies={onRefresh}
        />
      )}

      {/* SUBTAB 12: CURRENCY CONVERSION AND ORPHAN SPONSORSHIP EXCHANGE RATE MANAGEMENT */}
      {activeSubTab === 'currency_conversion' && (
        <CurrencyConversionTab 
          currencies={currencies}
          lang={lang}
          onRefreshCurrencies={onRefresh}
        />
      )}

      {/* SUBTAB 11: PROCUREMENT P2P SYSTEM */}
      {activeSubTab === 'procurement' && (
        <ProcurementTab 
          accounts={accounts}
          projects={projects}
          currencies={currencies}
          activities={activities}
          organizations={organizations}
          lang={lang}
          onRefresh={fetchFinanceData}
        />
      )}

      {/* SUBTAB 13: BUDGET VARIANCE ANALYSIS */}
      {activeSubTab === 'budget_variance' && (
        <BudgetVarianceTab 
          accounts={accounts}
          transactions={transactions}
          lines={lines}
          projects={projects}
          lang={lang}
        />
      )}

      {/* SUBTAB 14: CIMA/IMA MANAGEMENT ACCOUNTING & COST ENGINE */}
      {activeSubTab === 'management_accounting' && (
        <ManagementAccountingTab 
          accounts={accounts}
          transactions={transactions}
          lines={lines}
          projects={projects}
          lang={lang}
        />
      )}

      {/* SUBTAB 15: SMART E-INVOICING & ZATCA CRYPTOGRAPHIC ENGINE */}
      {activeSubTab === 'e_invoicing' && (
        <EInvoicingEngineTab 
          accounts={accounts}
          transactions={transactions}
          lines={lines}
          projects={projects}
          lang={lang}
        />
      )}

      {/* SUBTAB 16: ADVANCED BATCH & MULTI-ENTITY LEDGER AUTOMATION ENGINE */}
      {activeSubTab === 'batch_automation' && (
        <BatchLedgerAutomationEngine lang={lang} />
      )}

      {/* SUBTAB 17: CFO & CPA EXECUTIVE AUDIT SUITE 360 */}
      {activeSubTab === 'cfo_audit_suite' && (
        <CFOExecutiveAuditSuite 
          lang={lang}
          accounts={accounts}
          transactions={transactions}
          lines={lines}
          projects={projects}
        />
      )}

      {/* SUBTAB 18: ENDOWMENTS, INVESTMENT PROJECTS & GOVERNANCE CAPS SUITE */}
      {activeSubTab === 'endowment_governance' && (
        <EndowmentInvestmentGovernanceSuite 
          lang={lang}
          accounts={accounts}
          transactions={transactions}
          lines={lines}
          projects={projects}
        />
      )}

      {/* SUBTAB 19: MULTI-BRANCH INTER-COMPANY CONSOLIDATION ENGINE (IPSAS-35) */}
      {activeSubTab === 'consolidated_statements' && (
        <ConsolidatedStatementsTab 
          lang={lang} 
          accounts={accounts}
        />
      )}

      {/* OFFICIAL A4 STAMPED VOUCHER MODAL */}
      {showOfficialVoucherModal && selectedOfficialVoucher && (
        <PrintableOfficialVoucherModal
          isOpen={showOfficialVoucherModal}
          onClose={() => {
            setShowOfficialVoucherModal(false);
            setSelectedOfficialVoucher(null);
          }}
          voucher={selectedOfficialVoucher}
          lang={lang}
        />
      )}
    </div>
    </ModuleShell>
  );
}
