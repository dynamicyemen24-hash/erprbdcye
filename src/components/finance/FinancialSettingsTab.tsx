import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Settings2, 
  Coins, 
  Plus, 
  Check, 
  X, 
  AlertTriangle, 
  DollarSign, 
  Info,
  Edit,
  Trash2,
  Lock,
  Eye,
  Sliders,
  Award,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  TrendingUp,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { Currency } from '../../types';
import { PolicyViolationError, type PolicyViolation } from '../../core/utils/apiHelpers';
import { PolicyViolationAlert } from '../helpers/PolicyViolationAlert';

interface FinancialSettingsTabProps {
  currencies: Currency[];
  lang: 'ar' | 'en';
  onRefreshCurrencies: () => void;
}

// Interfaces for settings/policies
interface CompliancePolicy {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  value: string | number;
  type: 'amount' | 'percentage' | 'boolean' | 'days';
  category: 'disbursal' | 'overhead' | 'audit' | 'ledger';
  is_active: boolean;
  description_ar: string;
  description_en: string;
}

export default function FinancialSettingsTab({ 
  currencies, 
  lang, 
  onRefreshCurrencies 
}: FinancialSettingsTabProps) {
  
  // 1. Currencies state and Modal
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[] | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [currLoading, setCurrLoading] = useState(false);

  // Currency form state
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimalPlaces, setDecimalPlaces] = useState('2');
  const [isBase, setIsBase] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // 2. Local Storage Policies (CPA Governance Rules)
  const [policies, setPolicies] = useState<CompliancePolicy[]>([
    {
      id: 'pol-1',
      code: 'GOV-CSD',
      name_ar: 'سقف الصرف النقدي المنفرد للمشاريع',
      name_en: 'Single Cash Disbursal Limit',
      value: 5000000,
      type: 'amount',
      category: 'disbursal',
      is_active: true,
      description_ar: 'الحد الأقصى للمبالغ النقدية المسموح بصرفها بسند صرف واحد دون الحاجة لاعتماد ثنائي مركزي من مجلس الإدارة.',
      description_en: 'Maximum cash amount permitted for disbursement in a single voucher without secondary Board approval.'
    },
    {
      id: 'pol-2',
      code: 'GOV-PEE',
      name_ar: 'الحد الأدنى لكفاءة المصاريف التشغيلية (Sphere)',
      name_en: 'Target Program Spending Ratio (Sphere)',
      value: 85,
      type: 'percentage',
      category: 'overhead',
      is_active: true,
      description_ar: 'نسبة الإنفاق الميداني المباشر الموجه للمستفيدين من إجمالي الميزانية السنوية بما يطابق المعايير الدولية للإغاثة.',
      description_en: 'Minimum ratio of active donor funds allocated to direct field projects over general administrative overheads.'
    },
    {
      id: 'pol-3',
      code: 'GOV-LLP',
      name_ar: 'مهلة تعديل وترحيل قيود اليومية العامة',
      name_en: 'Ledger Posting Modification Lock',
      value: 14,
      type: 'days',
      category: 'ledger',
      is_active: true,
      description_ar: 'الفترة الزمنية المسموح خلالها للمحاسبين الميدانيين بتعديل أو حذف القيود اليومية قبل إقفالها التلقائي وترحيلها للأستاذ.',
      description_en: 'Days available for accountants to edit ledger journal lines before they are automatically frozen and finalized.'
    },
    {
      id: 'pol-4',
      code: 'GOV-DOC',
      name_ar: 'الإرفاق الإلزامي للمستندات الداعمة للعهد',
      name_en: 'Mandatory Voucher Document Attaching',
      value: 'true',
      type: 'boolean',
      category: 'audit',
      is_active: true,
      description_ar: 'منع ترحيل أي قيد مالي أو سند صرف تفوق قيمته 500,000 ريال دون إرفاق الفواتير الرسمية المؤيدة والممسوحة ضوئياً.',
      description_en: 'Strictly prohibit posting any voucher exceeding 500,000 YER without digitized supporting invoices or receipts.'
    },
    {
      id: 'pol-5',
      code: 'GOV-ALR',
      name_ar: 'الإنذار المبكر للموازنة التقديرية',
      name_en: 'Budget Ceiling Overrun Alert Ratio',
      value: 90,
      type: 'percentage',
      category: 'audit',
      is_active: true,
      description_ar: 'الحد المئوي من الموازنة المعتمدة للمشروع الذي عند تجاوزه يطلق النظام إنذاراً مبكراً بوجود تجاوز مالي محتمل.',
      description_en: 'Threshold percentage of project budget allocation that triggers predictive warnings on imminent cost overruns.'
    }
  ]);

  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [editingPolicyValue, setEditingPolicyValue] = useState<string | number>('');

  // Load policies from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexora_finance_policies');
    if (saved) {
      try {
        setPolicies(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved policies, using default CPA standards.');
      }
    }
  }, []);

  const savePoliciesToStorage = (newPolicies: CompliancePolicy[]) => {
    setPolicies(newPolicies);
    localStorage.setItem('nexora_finance_policies', JSON.stringify(newPolicies));
  };

  const handleEditPolicy = (policy: CompliancePolicy) => {
    setEditingPolicyId(policy.id);
    setEditingPolicyValue(policy.value);
  };

  const handleSavePolicyValue = (id: string) => {
    const updated = policies.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          value: p.type === 'amount' || p.type === 'percentage' || p.type === 'days' 
            ? parseFloat(String(editingPolicyValue)) || 0 
            : String(editingPolicyValue)
        };
      }
      return p;
    });
    savePoliciesToStorage(updated);
    setEditingPolicyId(null);
  };

  const handleTogglePolicy = (id: string) => {
    const updated = policies.map(p => {
      if (p.id === id) {
        return { ...p, is_active: !p.is_active };
      }
      return p;
    });
    savePoliciesToStorage(updated);
  };

  // Currency API Handlers
  const openCurrencyModal = (currency: Currency | null = null) => {
    setSelectedCurrency(currency);
    setFormError(null);
    if (currency) {
      setCode(currency.code || '');
      setNameAr(currency.name_ar || '');
      setNameEn(currency.name_en || '');
      setSymbol(currency.symbol || '');
      setDecimalPlaces(String(currency.decimal_places ?? 2));
      setIsBase(!!currency.is_base);
      setIsActive(!!currency.is_active);
    } else {
      setCode('');
      setNameAr('');
      setNameEn('');
      setSymbol('');
      setDecimalPlaces('2');
      setIsBase(false);
      setIsActive(true);
    }
    setIsCurrencyModalOpen(true);
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      code: code.toUpperCase(),
      name_en: nameEn,
      name_ar: nameAr,
      symbol,
      decimal_places: parseInt(decimalPlaces) || 2,
      is_base: isBase,
      is_active: isActive,
      security_level: 2
    };

    try {
      const url = selectedCurrency 
        ? `/api/tables/currencies/${selectedCurrency.id}` 
        : `/api/tables/currencies`;
      const response = await fetch(url, {
        method: selectedCurrency ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        if (response.status === 403 && errData.violations) {
          throw new PolicyViolationError(errData);
        }
        throw new Error(errData.error || 'Failed to save currency.');
      }

      onRefreshCurrencies();
      setIsCurrencyModalOpen(false);
    } catch (err: any) {
      if (err instanceof PolicyViolationError) {
        setPolicyViolations(err.violations);
        setFormError(err.primaryMessage);
      } else {
        setFormError(err.message);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteCurrency = async (id: string) => {
    const confirmation = lang === 'ar'
      ? 'هل أنت متأكد من تعطيل/حذف هذه العملة؟ قد يؤثر الحذف على معالجة كشوف الربط النشطة.'
      : 'Are you sure you want to disable/delete this currency? It may impact mappings for active transaction streams.';

    if (!window.confirm(confirmation)) return;

    setCurrLoading(true);
    try {
      const response = await fetch(`/api/tables/currencies/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete currency from ledger system.');
      }
      onRefreshCurrencies();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCurrLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in no-print">
      
      {/* Header Segment */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <span>{lang === 'ar' ? 'إعدادات الحوكمة، السياسات والمطابقة المالية المعتمدة' : 'Financial Governance, Settings & Compliance Policies'}</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold mt-1">
              {lang === 'ar' 
                ? 'لوحة تحكم مركزية لمهندس النظام والمدقق القانوني لضبط العملات الدولية وسقوف الصرف والامتثال لمعايير الإغاثة الإنسانية.' 
                : 'Central dashboard for systemic controls, CPA rules, currency conversions, and field execution standards.'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black text-emerald-700 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'معايير IPSAS / Sphere' : 'IPSAS / Sphere Compliant'}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Governance Policies Management */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Financial Compliance Policies */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'لوائح وسياسات التدقيق المحاسبي الداخلي' : 'CPA Audit & Operational Rules'}</span>
                </h3>
                <p className="text-[9px] text-zinc-400 font-bold mt-0.5">
                  {lang === 'ar' 
                    ? 'سياسات محاسبية مدمجة لضبط الفواتير والمصروفات الإدارية تفادياً للتجاوزات المالية.' 
                    : 'System-enforced rules protecting internal ledgers from unauthorized edits and excessive administrative costs.'}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {policies.map((policy) => (
                <div key={policy.id} className="p-4 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[9px] font-bold rounded">
                        {policy.code}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-800">
                        {lang === 'ar' ? policy.name_ar : policy.name_en}
                      </h4>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        policy.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-zinc-400'
                      }`}>
                        {policy.is_active ? (lang === 'ar' ? 'مادة إغاثية' : 'Active') : (lang === 'ar' ? 'تحديث' : 'Disabled')}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                      {lang === 'ar' ? policy.description_ar : policy.description_en}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 self-end md:self-center">
                    {/* Inline Policy Value Editor */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                      {editingPolicyId === policy.id ? (
                        <div className="flex items-center gap-1.5">
                          {policy.type === 'boolean' ? (
                            <select
                              value={String(editingPolicyValue)}
                              onChange={(e) => setEditingPolicyValue(e.target.value)}
                              className="bg-transparent border-none text-xs font-black outline-none text-slate-800 cursor-pointer"
                            >
                              <option value="true">{lang === 'ar' ? 'عرض' : 'Yes'}</option>
                              <option value="false">{lang === 'ar' ? '📊' : 'No'}</option>
                            </select>
                          ) : (
                            <input
                              type="number"
                              value={editingPolicyValue}
                              onChange={(e) => setEditingPolicyValue(e.target.value)}
                              className="w-16 md:w-20 bg-transparent text-center border-none text-xs font-mono font-black text-slate-800 focus:outline-none"
                            />
                          )}
                          <button
                            onClick={() => handleSavePolicyValue(policy.id)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white transition-all cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingPolicyId(null)}
                            className="p-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-600 transition-all cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 font-mono">
                            {policy.type === 'amount' 
                              ? `${parseFloat(String(policy.value)).toLocaleString()} YER` 
                              : policy.type === 'percentage' 
                              ? `${policy.value}%` 
                              : policy.type === 'days' 
                              ? `${policy.value} ${lang === 'ar' ? 'يوم' : 'Days'}`
                              : policy.value === 'true' ? (lang === 'ar' ? 'إضافة' : 'Enabled') : (lang === 'ar' ? 'إلغاء' : 'Disabled')}
                          </span>
                          <button
                            onClick={() => handleEditPolicy(policy)}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                            title={lang === 'ar' ? 'معيار الحماية' : 'Modify Policy'}
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Toggle policy state */}
                    <button
                      onClick={() => handleTogglePolicy(policy.id)}
                      className={`px-2 py-1 rounded-xl text-[9px] font-black transition-all cursor-pointer border ${
                        policy.is_active 
                          ? 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100' 
                          : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {policy.is_active ? (lang === 'ar' ? 'العدد' : 'Disable') : (lang === 'ar' ? 'إغاثة' : 'Enable')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Guidelines: NGO Standard Trial Balance Accounts Classification */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'دليل التصنيف الموحد للمنظمات الإنسانية' : 'IPSAS Humanitarian Standard Chart Rules'}</span>
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                {lang === 'ar' 
                  ? 'الهيكل المرجعي الموحد للحسابات وأدلة الأستاذ العام المعتمدة لتسهيل المراجعة القانونية والامتثال الضريبي.' 
                  : 'IPSAS-compliant regulatory coding parameters used by state auditors to ensure full compliance.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wide block">{lang === 'ar' ? 'التصنيف 1: الأصول والعهد (Assets)' : 'Assets Classification'}</span>
                <ul className="space-y-1.5 text-slate-600 font-bold text-[11px]">
                  <li className="flex justify-between">
                    <span>111000 - {lang === 'ar' ? 'النقدية بالخزائن والصناديق' : 'Cash in Hand'}</span>
                    <span className="text-emerald-600">ASSET</span>
                  </li>
                  <li className="flex justify-between">
                    <span>112000 - {lang === 'ar' ? 'الحسابات الجارية بالبنوك' : 'Bank Ledger'}</span>
                    <span className="text-emerald-600">ASSET</span>
                  </li>
                  <li className="flex justify-between">
                    <span>121000 - {lang === 'ar' ? 'عهد المنسقين والمنفذين' : 'Operational Advances'}</span>
                    <span className="text-emerald-600">ASSET</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wide block">{lang === 'ar' ? 'التصنيف 5: المصروفات الميدانية (Expenses)' : 'Expenses Classification'}</span>
                <ul className="space-y-1.5 text-slate-600 font-bold text-[11px]">
                  <li className="flex justify-between">
                    <span>511000 - {lang === 'ar' ? 'رواتب وأجور الموظفين المباشرة' : 'Direct Staff Payroll'}</span>
                    <span className="text-rose-600">EXPENSE</span>
                  </li>
                  <li className="flex justify-between">
                    <span>521000 - {lang === 'ar' ? 'تكاليف السلال الغذائية والإغاثة' : 'Humanitarian Deliveries'}</span>
                    <span className="text-rose-600">EXPENSE</span>
                  </li>
                  <li className="flex justify-between">
                    <span>531000 - {lang === 'ar' ? 'تكاليف ومصاريف التقييم والرقابة' : 'M&E Field Audits'}</span>
                    <span className="text-rose-600">EXPENSE</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Currencies Management Grid */}
        <div className="space-y-6">
          
          {/* Card: Ledger Currencies & Exchange Rates */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'سجلات العملات المعتمدة بالدفاتر' : 'Official Currencies'}</span>
                </h3>
                <p className="text-[9px] text-zinc-400 font-bold mt-0.5">
                  {lang === 'ar' 
                    ? 'إدارة وحدات الصرف والتبرعات القادمة للجمعية.' 
                    : 'System currencies matching donor transfers.'}
                </p>
              </div>

              <button
                onClick={() => openCurrencyModal()}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>{lang === 'ar' ? 'إضافة عملة' : 'Add Currency'}</span>
              </button>
            </div>

            {currLoading ? (
              <div className="p-8 text-center text-zinc-400 font-bold">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-emerald-500" />
                <span>{lang === 'ar' ? 'جاري تحديث الدفاتر...' : 'Updating currency tables...'}</span>
              </div>
            ) : currencies.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {currencies.map((curr) => (
                  <div key={curr.id} className="p-3.5 hover:bg-slate-50/50 transition-colors flex justify-between items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-black text-slate-800 tracking-wide">
                          {curr.code}
                        </span>
                        <span className="text-sm font-bold text-slate-500">
                          ({curr.symbol || '?'})
                        </span>
                        {curr.is_base && (
                          <span className="px-1.5 py-0.25 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-black rounded-full uppercase">
                            {lang === 'ar' ? 'الأساسية' : 'Base'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-extrabold text-slate-600">
                        {lang === 'ar' ? (curr.name_ar || curr.name_en) : curr.name_en}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openCurrencyModal(curr)}
                        className="p-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-600 hover:text-emerald-700 rounded-lg transition-all cursor-pointer"
                        title={lang === 'ar' ? 'تعديل' : 'Edit'}
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      {!curr.is_base && (
                        <button
                          onClick={() => handleDeleteCurrency(curr.id)}
                          className="p-1 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-zinc-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                          title={lang === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-400 font-bold text-xs">
                {lang === 'ar' ? 'لم يتم العثور على أي عملة.' : 'No currencies registered.'}
              </div>
            )}
          </div>

          {/* Compliance Card: Internal Auditor Checklist */}
          <div className="bg-gradient-to-br from-emerald-950 to-zinc-950 text-white rounded-2xl p-5 border border-emerald-800/30 space-y-4">
            <div className="border-b border-emerald-800/20 pb-2.5">
              <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <FileCheck2 className="w-4.5 h-4.5 text-amber-400" />
                <span>{lang === 'ar' ? 'قائمة الفحص والمراجعة للمدقق المالي' : 'Internal Auditor Compliance Verification'}</span>
              </h4>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">
                {lang === 'ar' ? 'مطابقة ومراجعة القيود مع متطلبات الجهاز المركزي للرقابة والمحاسبة COA.' : 'Verifying double-entry balances with national institutional guidelines.'}
              </p>
            </div>

            <ul className="space-y-3.5 text-[10px] font-bold text-slate-300">
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0 text-[10px]">1</span>
                <div>
                  <span className="text-white block">{lang === 'ar' ? 'مطابقة موازين المراجعة والأستاذ العام' : 'Balanced Trial General Ledger'}</span>
                  <span className="text-zinc-400 font-semibold leading-normal">{lang === 'ar' ? 'تأكد أن الأرصدة المدينة والدائنة الإجمالية متطابقة بنسبة 100% لتجنب الفوارق.' : 'Ensure absolute equality of debit and credit lines across all cost nodes.'}</span>
                </div>
              </li>
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0 text-[10px]">2</span>
                <div>
                  <span className="text-white block">{lang === 'ar' ? 'مطابقة العمليات والعهد النقدية المفتوحة' : 'Clearance of Outstanding Advances'}</span>
                  <span className="text-zinc-400 font-semibold leading-normal">{lang === 'ar' ? 'تصفية وتسوية جميع عهد مديري المشاريع الميدانيين قبل الإقفال الدوري.' : 'All field coordinator cash floats must be fully posted and matched before period closings.'}</span>
                </div>
              </li>
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0 text-[10px]">3</span>
                <div>
                  <span className="text-white block">{lang === 'ar' ? 'الحفاظ على مرجعية المستند المؤرشف' : 'Digitized Document Trace'}</span>
                  <span className="text-zinc-400 font-semibold leading-normal">{lang === 'ar' ? 'مراجعة المرفقات الرقمية والمستندات الداعمة لكل قيد تفوق قيمته الحد المعين.' : 'Audit digital receipts for all field expenditures to maintain flawless governance.'}</span>
                </div>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Currency Form Modal */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-slate-800">
                  {selectedCurrency 
                    ? (lang === 'ar' ? 'تعديل العملة المعتمدة' : 'Edit Approved Currency')
                    : (lang === 'ar' ? 'تسجيل عملة مالية جديدة بالدفتر' : 'Register New Currency')}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                  {lang === 'ar' ? 'تحديد الخصائص ورمز أيزو المعتمد لتسهيل تتبع كشوف التبرعات.' : 'Assign code identifiers and symbols for international donor accounting alignment.'}
                </p>
              </div>
              <button 
                onClick={() => setIsCurrencyModalOpen(false)}
                className="p-1.5 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-zinc-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrency} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              {policyViolations && policyViolations.length > 0 && (
                <PolicyViolationAlert
                  violations={policyViolations}
                  lang={lang}
                  onDismiss={() => setPolicyViolations(null)}
                />
              )}

              {/* Code */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'رمز العملة الدولي (ISO-4217)' : 'Currency Code (ISO-4217)'}</label>
                <input 
                  type="text" 
                  required 
                  maxLength={3}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. YER, USD, SAR"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white outline-none font-mono font-black uppercase text-slate-800"
                />
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</label>
                  <input 
                    type="text" 
                    required 
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="e.g. ريال سعودي"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white outline-none font-extrabold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}</label>
                  <input 
                    type="text" 
                    required 
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Saudi Riyal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white outline-none font-bold text-slate-700"
                  />
                </div>
              </div>

              {/* Symbol & Decimals */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'العلامة / الرمز' : 'Symbol'}</label>
                  <input 
                    type="text" 
                    required 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="e.g. SR, YR, $"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white outline-none font-black text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'عدد الخانات العشرية' : 'Decimal Places'}</label>
                  <input 
                    type="number" 
                    required 
                    min={0}
                    max={4}
                    value={decimalPlaces}
                    onChange={(e) => setDecimalPlaces(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:bg-white outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-col gap-2.5 pt-2 font-bold text-slate-600">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isBase}
                    onChange={(e) => setIsBase(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>{lang === 'ar' ? 'تعيين كعملة الأساس في دفاتر الأستاذ المحاسبية' : 'Enforce as ledger primary base currency'}</span>
                </label>

                {selectedCurrency && !selectedCurrency.is_base && (
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>{lang === 'ar' ? 'حالة التفعيل نشطة للربط المباشر' : 'Is active for real-time transactions'}</span>
                  </label>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsCurrencyModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white rounded-xl text-xs font-black shadow flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {formSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {selectedCurrency 
                      ? (lang === 'ar' ? 'حفظ الخصائص' : 'Save Properties')
                      : (lang === 'ar' ? 'معيار الحماية' : 'Register Currency')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
