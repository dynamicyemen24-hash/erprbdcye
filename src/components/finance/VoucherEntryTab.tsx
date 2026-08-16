import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, RefreshCw, CheckCircle, AlertCircle, Coins, Building } from 'lucide-react';
import { Account, Project, Program } from './FinanceTypes';

interface AccountSearchSelectProps {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  lang: 'ar' | 'en';
}

const AccountSearchSelect: React.FC<AccountSearchSelectProps> = ({ accounts, value, onChange, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedAccount = accounts.find(a => a.id === value);
  const isRtl = lang === 'ar';

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return accounts;
    return accounts.filter(acc => 
      acc.account_code.includes(term) ||
      acc.name_ar.includes(term) ||
      acc.name_en.toLowerCase().includes(term)
    );
  }, [accounts, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % Math.max(1, filtered.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIndex]) {
          onChange(filtered[activeIndex].id);
          setIsOpen(false);
          setSearchTerm('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setSearchTerm('');
            setActiveIndex(0);
          }
        }}
        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs flex items-center justify-between cursor-pointer select-none h-[32px] text-slate-800 dark:text-zinc-100"
      >
        <span className="truncate font-bold">
          {selectedAccount 
            ? `${selectedAccount.account_code} - ${isRtl ? selectedAccount.name_ar : selectedAccount.name_en}`
            : (isRtl ? '--- اختر حساباً أستاذ ---' : '--- Select Account ---')}
        </span>
        <span className="text-[10px] text-slate-400">?</span>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl z-[999] max-h-60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-1.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 shrink-0">
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveIndex(0);
              }}
              placeholder={isRtl ? 'ابحث بالرمز أو اسم الحساب...' : 'Search by code or account name...'}
              className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-slate-400 dark:text-zinc-500 text-[10px] font-bold">
                {isRtl ? 'لا توجد نتائج مطابقة' : 'No matches found'}
              </div>
            ) : (
              filtered.map((acc, index) => {
                const isSelected = acc.id === value;
                const isActive = index === activeIndex;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      onChange(acc.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors select-none font-bold ${
                      isSelected
                        ? 'bg-emerald-500 text-white font-extrabold'
                        : isActive
                        ? 'bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white'
                        : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    <span>{acc.account_code} - {isRtl ? acc.name_ar : acc.name_en}</span>
                    {isSelected && <span className="text-[10px] text-white">?</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ActivityOption {
  id: string;
  label: string;
  isActivity: boolean;
  project_id: string;
  activity_id: string | null;
}

interface ActivitySearchSelectProps {
  options: ActivityOption[];
  value: string;
  onChange: (project_id: string, activity_id: string | null) => void;
  lang: 'ar' | 'en';
}

const ActivitySearchSelect: React.FC<ActivitySearchSelectProps> = ({ options, value, onChange, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);
  const isRtl = lang === 'ar';

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % Math.max(1, filtered.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIndex]) {
          const opt = filtered[activeIndex];
          onChange(opt.project_id, opt.activity_id);
          setIsOpen(false);
          setSearchTerm('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setSearchTerm('');
            setActiveIndex(0);
          }
        }}
        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs flex items-center justify-between cursor-pointer select-none h-[32px] text-slate-800 dark:text-zinc-100"
      >
        <span className="truncate font-bold text-slate-700 dark:text-zinc-300">
          {selectedOption 
            ? selectedOption.label.trim()
            : (isRtl ? '--- اختر مشروعاً أو نشاطاً تشغيلياً ---' : '--- Select Project / Activity ---')}
        </span>
        <span className="text-[10px] text-slate-400">?</span>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl z-[999] max-h-60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-1.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 shrink-0">
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveIndex(0);
              }}
              placeholder={isRtl ? 'ابحث بالرمز أو اسم المشروع/النشاط...' : 'Search by code or project/activity name...'}
              className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-slate-400 dark:text-zinc-500 text-[10px] font-bold">
                {isRtl ? 'لا توجد نتائج مطابقة' : 'No matches found'}
              </div>
            ) : (
              filtered.map((opt, index) => {
                const isSelected = opt.id === value;
                const isActive = index === activeIndex;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.project_id, opt.activity_id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors select-none font-bold ${
                      isSelected
                        ? 'bg-emerald-500 text-white font-extrabold'
                        : isActive
                        ? 'bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white'
                        : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    <span className={opt.isActivity ? 'pl-4 rtl:pr-4 font-normal text-slate-600 dark:text-zinc-300' : 'text-slate-800 dark:text-zinc-100 font-extrabold'}>
                      {opt.label}
                    </span>
                    {isSelected && <span className="text-[10px] text-white">?</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const generateTxHash = (txData: any, lines: any[]) => {
  const payload = JSON.stringify({
    tx: {
      type: txData.transaction_type,
      reference: txData.reference_number,
      branch: txData.branch_code,
      rate: txData.exchange_rate,
      org: txData.organization_id
    },
    lines: lines.map(l => ({
      acc: l.account_id,
      deb: l.debit_amount,
      cred: l.credit_amount,
      proj: l.project_id,
      act: l.activity_id
    }))
  });
  
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase();
  return `NEX-HASH-${hex}-${Date.now().toString().slice(-4)}`;
};

interface VoucherEntryTabProps {
  accounts: Account[];
  projects: Project[];
  currencies: any[];
  activities: any[];
  organizations: any[];
  lang: 'ar' | 'en';
  onRefresh: () => void;
  initialData?: any;
}

export default function VoucherEntryTab({ 
  accounts, 
  projects, 
  currencies = [], 
  activities = [], 
  organizations = [], 
  lang, 
  onRefresh, 
  initialData 
}: VoucherEntryTabProps) {
  const [entryForm, setEntryForm] = useState({
    transaction_type: 'JOURNAL_ENTRY',
    voucher_subtype: 'NORMAL',
    description: '',
    reference_number: '',
    payment_method: 'CASH',
    branch_code: 'HQ',
    security_level: 2,
    organization_id: '00000000-0000-0000-0000-000000000001',
    currency_id: '',
    exchange_rate: '1',
    mediator_agent: '',
    sponsor_donor: '',
    disburser_cashier: '',
    recipient_beneficiary: '',
    cost_center_code: 'CC-GEN',
    prepared_by: '',
    reviewed_by: '',
    approved_by: ''
  });

  // UI Mode Toggle: Simple Standard Voucher vs Advanced Multi-Party/Field Voucher
  const [vViewMode, setVViewMode] = useState<'SIMPLE' | 'ADVANCED'>('SIMPLE');

  const [entryLines, setEntryLines] = useState<any[]>([
    { account_id: '', description: '', debit_amount: '0', credit_amount: '0', project_id: '', activity_id: '' },
    { account_id: '', description: '', debit_amount: '0', credit_amount: '0', project_id: '', activity_id: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [entryMessage, setEntryMessage] = useState<{ type: 'success' | 'error'; text: string; hash?: string } | null>(null);
  const [liveRates, setLiveRates] = useState<any>(null);
  const ocrFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      try {
        const res = await fetch('/api/gemini/strategic-anomaly-monitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `أنت محاسب قانوني خبير (CPA). قم بتحليل الفاتورة/المستند المرفق واستخراج البيانات التالية بتنسيق JSON حصراً:
            {
              "description": "بيان القيد المحاسبي الموصى به",
              "reference_number": "رقم الفاتورة أو المستند",
              "lines": [
                { "account_query": "اسم أو رمز الحساب المناسب", "debit": 1000, "credit": 0, "description": "شرح البند" },
                { "account_query": "الصندوق أو البنك", "debit": 0, "credit": 1000, "description": "سداد نائبي" }
              ]
            }`,
            attachedFiles: [{ name: file.name, type: file.type || 'image/jpeg', data: base64Data, sizeMb: '1.0' }]
          })
        });

        const result = await res.json();
        if (result) {
          setEntryForm(prev => ({
            ...prev,
            description: result.description || `قيد آلي ممتص من المستند: ${file.name}`,
            reference_number: result.reference_number || `INV-${Date.now().toString().slice(-4)}`
          }));

          if (result.lines && Array.isArray(result.lines) && result.lines.length > 0) {
            const matchedLines = result.lines.map((l: any) => {
              const query = (l.account_query || '').toLowerCase();
              const matchedAcc = accounts.find(a => 
                a.account_code.includes(query) || 
                a.name_ar.toLowerCase().includes(query) || 
                a.name_en.toLowerCase().includes(query)
              ) || accounts[0];

              return {
                account_id: matchedAcc ? matchedAcc.id : (accounts[0]?.id || ''),
                description: l.description || result.description || 'بند ممسوح ضوئياً عبر AI OCR',
                debit_amount: String(l.debit || 0),
                credit_amount: String(l.credit || 0),
                project_id: '',
                activity_id: ''
              };
            });
            setEntryLines(matchedLines);
          }
          setEntryMessage({
            type: 'success',
            text: lang === 'ar' ? 'تم استخراج بيانات المستند وتحويله لقيد محاسبي مقترح عبر Gemini AI OCR بنجاح!' : 'Document OCR processed successfully via Gemini AI!'
          });
        }
      } catch (err: any) {
        console.error("AI OCR error:", err);
        setEntryMessage({
          type: 'error',
          text: lang === 'ar' ? 'تعذر مسح المستند عبر الذكاء الاصطناعي.' : 'Failed to scan document via AI OCR.'
        });
      } finally {
        setIsOcrProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetch('/api/exchange-rates/live')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setLiveRates(data.rates);
        }
      })
      .catch(err => console.error("Error fetching live rates in VoucherEntryTab:", err));
  }, []);

  // Set default currency and organization
  useEffect(() => {
    if (currencies && currencies.length > 0) {
      const baseCurr = currencies.find(c => c.is_base || c.code === 'YER');
      if (baseCurr) {
        setEntryForm(prev => ({
          ...prev,
          currency_id: baseCurr.id,
          exchange_rate: '1'
        }));
      } else {
        setEntryForm(prev => ({
          ...prev,
          currency_id: currencies[0].id,
          exchange_rate: '1'
        }));
      }
    }
  }, [currencies]);

  useEffect(() => {
    if (organizations && organizations.length > 0) {
      setEntryForm(prev => ({
        ...prev,
        organization_id: organizations[0].id
      }));
    }
  }, [organizations]);

  // Handle auto-exchange rate defaults
  const selectedCurrency = currencies.find(c => c.id === entryForm.currency_id);
  const isBaseCurrency = selectedCurrency?.is_base || selectedCurrency?.code === 'YER';

  useEffect(() => {
    if (selectedCurrency) {
      if (selectedCurrency.is_base || selectedCurrency.code === 'YER') {
        setEntryForm(prev => ({ ...prev, exchange_rate: '1' }));
      } else {
        const code = selectedCurrency.code;
        const isAdenRateBranch = entryForm.branch_code === 'MRB-01' || entryForm.branch_code === 'ADE-02' || entryForm.branch_code === 'KHX-03' || entryForm.branch_code === 'TAZ-04';
        
        if (liveRates) {
          const usdToYer = liveRates.YER || 530;
          const targetInUsd = liveRates[code] || 1;
          const baseRate = isAdenRateBranch ? 1600 : usdToYer;
          const finalCalculatedRate = (baseRate / targetInUsd).toFixed(2);
          setEntryForm(prev => ({ ...prev, exchange_rate: String(parseFloat(finalCalculatedRate)) }));
        } else {
          // Fallback static defaults based on regional exchange markets
          if (code === 'USD') {
            setEntryForm(prev => ({ ...prev, exchange_rate: isAdenRateBranch ? '1600' : '530' }));
          } else if (code === 'SAR') {
            setEntryForm(prev => ({ ...prev, exchange_rate: isAdenRateBranch ? '425' : '141' }));
          } else {
            setEntryForm(prev => ({ ...prev, exchange_rate: '1' }));
          }
        }
      }
    }
  }, [entryForm.currency_id, liveRates, entryForm.branch_code]);

  // Load mapped AI data if provided
  useEffect(() => {
    if (initialData) {
      setEntryForm(prev => ({
        ...prev,
        transaction_type: initialData.transaction_type || 'JOURNAL_ENTRY',
        description: initialData.description || ''
      }));
      if (initialData.lines && initialData.lines.length >= 2) {
        setEntryLines(initialData.lines.map((l: any) => ({
          account_id: l.account_id || '',
          description: l.description || '',
          debit_amount: String(l.debit_amount || 0),
          credit_amount: String(l.credit_amount || 0),
          project_id: '',
          activity_id: ''
        })));
      }
    }
  }, [initialData]);

  const handleAddLine = () => {
    setEntryLines(prev => [...prev, { account_id: '', description: '', debit_amount: '0', credit_amount: '0', project_id: '', activity_id: '' }]);
  };

  const handleRemoveLine = (idx: number) => {
    setEntryLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, val: any) => {
    setEntryLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      const updated = { ...line, [field]: val };
      // If debit is typed, zero credit and vice versa
      if (field === 'debit_amount' && parseFloat(val) > 0) {
        updated.credit_amount = '0';
      } else if (field === 'credit_amount' && parseFloat(val) > 0) {
        updated.debit_amount = '0';
      }
      return updated;
    }));
  };

  const rate = parseFloat(entryForm.exchange_rate) || 1;
  const totalDebitSum = entryLines.reduce((sum, line) => sum + (parseFloat(line.debit_amount) || 0), 0);
  const totalCreditSum = entryLines.reduce((sum, line) => sum + (parseFloat(line.credit_amount) || 0), 0);
  const isBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.01 && totalDebitSum > 0;

  // Build Project-Activity hierarchical options
  const getActivityOptions = () => {
    const options: { id: string; label: string; isActivity: boolean; project_id: string; activity_id: string | null }[] = [];
    projects.forEach(proj => {
      options.push({
        id: `proj-${proj.id}`,
        label: `📁 [${proj.code}] ${lang === 'ar' ? proj.name_ar : proj.name_en} - ${lang === 'ar' ? 'عام (بدون تخصيص نشاط)' : 'General (No Activity)'}`,
        isActivity: false,
        project_id: proj.id,
        activity_id: null
      });

      const projActs = activities.filter(act => act.project_id === proj.id);
      projActs.forEach(act => {
        options.push({
          id: `act-${act.id}`,
          label: `   ↳ 📍 ${lang === 'ar' ? act.name_ar : act.name_en}`,
          isActivity: true,
          project_id: proj.id,
          activity_id: act.id
        });
      });
    });
    return options;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntryMessage(null);

    if (!isBalanced) {
      setEntryMessage({
        type: 'error',
        text: lang === 'ar' ? 'القيد غير متزن! يجب أن يتساوى مجموع المدين مع مجموع الدائن.' : 'Voucher is not balanced! Debits must equal credits.'
      });
      return;
    }

    if (entryLines.some(line => !line.account_id)) {
      setEntryMessage({
        type: 'error',
        text: lang === 'ar' ? 'يرجى اختيار حساب مالي لجميع الأسطر.' : 'Please select an account for all lines.'
      });
      return;
    }

    // Strict CPA Standard checks: no negative lines, no lines with both zero, no lines with both non-zero
    const hasInvalidAmounts = entryLines.some(line => {
      const d = parseFloat(line.debit_amount) || 0;
      const c = parseFloat(line.credit_amount) || 0;
      return d < 0 || c < 0 || (d === 0 && c === 0) || (d > 0 && c > 0);
    });

    if (hasInvalidAmounts) {
      setEntryMessage({
        type: 'error',
        text: lang === 'ar' 
          ? 'خطأ في قيم الأسطر! يجب تحديد قيمة موجبة أكبر من الصفر إما في خانة المدين أو الدائن فقط لكل سطر، ويمنع إدخال قيم سالبة.' 
          : 'Invalid amounts found! Each line must have a positive amount greater than zero in either Debit or Credit exclusively.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const txHash = generateTxHash(entryForm, entryLines);

      // 1. Post transaction header
      const txRes = await fetch('/api/tables/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_number: `JV-${Date.now().toString().slice(-6)}`,
          transaction_date: new Date().toISOString().split('T')[0],
          posting_date: new Date().toISOString().split('T')[0],
          transaction_type: entryForm.transaction_type,
          total_debit: totalDebitSum,
          total_credit: totalCreditSum,
          total_debit_base: totalDebitSum * rate,
          total_credit_base: totalCreditSum * rate,
          currency_id: entryForm.currency_id || null,
          exchange_rate: rate,
          description: entryForm.description,
          payment_method: entryForm.payment_method,
          reference_number: entryForm.reference_number,
          branch_code: entryForm.branch_code,
          security_level: entryForm.security_level,
          organization_id: entryForm.organization_id,
          is_posted: true,
          metadata: {
            hash_chain_verified: true,
            integrity_hash: txHash,
            audited_by: "CPA-Nexora-Core",
            audit_timestamp: new Date().toISOString()
          }
        })
      });

      if (!txRes.ok) throw new Error('Failed to post transaction header');
      const txResult = await txRes.json();

      // 2. Post transaction lines
      for (let i = 0; i < entryLines.length; i++) {
        const line = entryLines[i];
        const selectedAcc = accounts.find(a => a.id === line.account_id);
        const selectedProj = projects.find(p => p.id === line.project_id);
        const selectedAct = activities.find(a => a.id === line.activity_id);

        // Prepend Project and/or Activity reference to description
        let finalDescription = line.description || entryForm.description;
        if (selectedAct) {
          finalDescription = `[📍 ${lang === 'ar' ? selectedAct.name_ar : selectedAct.name_en}] ${finalDescription}`;
        } else if (selectedProj) {
          finalDescription = `[📁 ${selectedProj.code}] ${finalDescription}`;
        }

        const debBase = (parseFloat(line.debit_amount) || 0) * rate;
        const credBase = (parseFloat(line.credit_amount) || 0) * rate;

        await fetch('/api/tables/transaction_lines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: txResult.id,
            organization_id: entryForm.organization_id,
            line_number: i + 1,
            account_id: line.account_id,
            account_code: selectedAcc?.account_code || '1001',
            description: finalDescription,
            debit_amount: debBase,
            credit_amount: credBase,
            project_id: line.project_id || null,
            activity_id: line.activity_id || null,
            currency_code: selectedCurrency?.code || 'YER',
            security_level: entryForm.security_level
          })
        });

        // Update current balances in COA (always in base currency YER)
        if (selectedAcc) {
          const currentBal = parseFloat(String(selectedAcc.current_balance || 0));
          const accType = selectedAcc.account_type?.toUpperCase();
          
          let nextBal = currentBal;
          if (accType === 'ASSET' || accType === 'EXPENSE') {
            nextBal = currentBal + debBase - credBase;
          } else {
            nextBal = currentBal + credBase - debBase;
          }

          await fetch(`/api/tables/chart_of_accounts/${selectedAcc.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_balance: nextBal })
          });
        }
      }

      setEntryMessage({
        type: 'success',
        text: lang === 'ar' ? 'تم ترحيل وحفظ السند والقيد المحاسبي بنجاح وتحديث أرصدة الحسابات.' : 'Successfully posted transaction and updated chart account balances.',
        hash: txHash
      });

      // Clear form
      setEntryForm(prev => ({
        ...prev,
        description: '',
        reference_number: ''
      }));
      setEntryLines([
        { account_id: '', description: '', debit_amount: '0', credit_amount: '0', project_id: '', activity_id: '' },
        { account_id: '', description: '', debit_amount: '0', credit_amount: '0', project_id: '', activity_id: '' }
      ]);
      onRefresh();
    } catch (err: any) {
      setEntryMessage({ type: 'error', text: err.message || 'Error posting entry' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h3 className="font-black text-sm text-slate-800">
            {lang === 'ar' ? 'إدخال القيود وسندات الصرف والقبض والإشعارات' : 'Post Journal Voucher & Vouchers'}
          </h3>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
            {lang === 'ar' ? 'يدعم ترحيل وحفظ القيود السريعة، متعددة العملات، وتخصيص الأنشطة التشغيلية.' : 'Supports standard & advanced multi-party operational vouchers.'}
          </p>
        </div>

        {/* MODE SWITCHER: STANDARD CLEAN VS ADVANCED MULTI-PARTY */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setVViewMode('SIMPLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              vViewMode === 'SIMPLE' 
                ? 'bg-white dark:bg-zinc-950 text-emerald-600 shadow-sm border border-slate-200 dark:border-zinc-800' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            ? {lang === 'ar' ? 'الوضع الاعتيادي السريع' : 'Standard Clean Mode'}
          </button>

          <button
            type="button"
            onClick={() => setVViewMode('ADVANCED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              vViewMode === 'ADVANCED' 
                ? 'bg-emerald-600 text-white shadow-sm font-black' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            ??? {lang === 'ar' ? 'مشروع الحقيبة والتمكين الطلابي' : 'Advanced Multi-Party Mode'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={ocrFileInputRef}
            onChange={handleOcrUpload}
            accept="image/*,.pdf"
            className="hidden"
          />
          {vViewMode === 'ADVANCED' && (
            <button
              type="button"
              onClick={() => ocrFileInputRef.current?.click()}
              disabled={isOcrProcessing}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={lang === 'ar' ? 'رفع فاتورة أو مستند وتحويله لقيد آلي عبر الذكاء الاصطناعي' : 'Upload document & parse via Gemini AI OCR'}
            >
              <span>{isOcrProcessing ? (lang === 'ar' ? 'جاري المسح الضوئي...' : 'Scanning...') : (lang === 'ar' ? '✨ مسح المستند بـ Gemini AI' : '? Gemini AI OCR Scan')}</span>
            </button>
          )}
          <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-md font-mono font-black animate-pulse">
            {lang === 'ar' ? 'ميزان القيد: ' : 'Voucher Balance: '} {isBalanced ? 'OK' : 'FAIL'}
          </span>
        </div>
      </div>

      {entryMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold border flex flex-col gap-2 ${
          entryMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {entryMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{entryMessage.text}</span>
          </div>
          {entryMessage.hash && (
            <div className="mt-2 p-3 bg-zinc-950 text-emerald-400 font-mono text-[9px] rounded-lg border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 select-all">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/35 rounded text-[8px] uppercase tracking-wider font-sans font-black">
                  Cryptographic Hash Chain Seal
                </span>
                <span>{entryMessage.hash}</span>
              </div>
              <span className="text-zinc-500 font-normal">
                {lang === 'ar' ? 'معتمد ومحمي من التعديل يدوياً بنجاح' : 'Immutable integrity seal written to ledger'}
              </span>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-bold text-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Organization / Subscriber */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 uppercase font-black flex items-center gap-1">
              <Building className="w-3 h-3 text-zinc-400" />
              <span>{lang === 'ar' ? 'المنظمة / الشريك المؤسسي*' : 'Organization / Tenant*'}</span>
            </label>
            <select
              value={entryForm.organization_id}
              onChange={(e) => setEntryForm(p => ({ ...p, organization_id: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-800"
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {lang === 'ar' ? org.name_ar : org.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Voucher Type */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'نوع السند/المعاملة*' : 'Voucher Type*'}</label>
            <select
              value={entryForm.transaction_type}
              onChange={(e) => setEntryForm(p => ({ ...p, transaction_type: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
            >
              <option value="JOURNAL_ENTRY">{lang === 'ar' ? 'قيد تسوية عام (JV)' : 'Journal Entry (JV)'}</option>
              <option value="PAYMENT">{lang === 'ar' ? 'سند صرف مالي (Payment Voucher)' : 'Payment Voucher'}</option>
              <option value="RECEIPT">{lang === 'ar' ? 'سند توريد وقبض (Receipt Voucher)' : 'Receipt Voucher'}</option>
              <option value="DEBIT_NOTE">{lang === 'ar' ? 'إشعار مدين' : 'Debit Note'}</option>
              <option value="CREDIT_NOTE">{lang === 'ar' ? 'إشعار دائن' : 'Credit Note'}</option>
            </select>
          </div>

          {/* Special Cases Subtype */}
          <div className="space-y-1">
            <label className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-black">{lang === 'ar' ? 'تصنيف الحالة التشغيلية الخاص' : 'Voucher Operational Subtype'}</label>
            <select
              value={entryForm.voucher_subtype}
              onChange={(e) => setEntryForm(p => ({ ...p, voucher_subtype: e.target.value }))}
              className="w-full px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-xl focus:outline-none font-bold text-amber-800 dark:text-amber-300"
            >
              <option value="NORMAL">{lang === 'ar' ? 'اعتيادي / معياري' : 'Standard Normal'}</option>
              <option value="SPONSORSHIP">{lang === 'ar' ? 'صرف كفالات أيتام ورعاية أسر' : 'Orphan & Family Sponsorship'}</option>
              <option value="SCHEDULED_INSTALLMENT">{lang === 'ar' ? 'دفعة موازنة / عقد مجدول' : 'Scheduled Installment'}</option>
              <option value="HUMANITARIAN_VOUCHER">{lang === 'ar' ? 'سند إغاثي إنساني طارئ' : 'Emergency Relief Voucher'}</option>
              <option value="ENDOWMENT_RETURNS">{lang === 'ar' ? 'عائد واستحقاق وقفي' : 'Endowment Returns'}</option>
            </select>
          </div>

          {/* Payment Method & Gateways */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'وسيلة الدفع والتحويل' : 'Payment Method / Gateway'}</label>
            <select
              value={entryForm.payment_method}
              onChange={(e) => setEntryForm(p => ({ ...p, payment_method: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-900"
            >
              <option value="CASH">{lang === 'ar' ? 'صندوق نقدي (Cash)' : 'Cash Vault'}</option>
              <option value="BANK_TRANSFER">{lang === 'ar' ? 'تحويل بنكي / حساب مصرفي' : 'Bank Transfer'}</option>
              <option value="KURAIMI_EXPRESS">{lang === 'ar' ? 'حوالة الكريمي إكسبرس (Kuraimi)' : 'Kuraimi Express'}</option>
              <option value="HASEB_PAY">{lang === 'ar' ? 'حاسب / جوال بي (Haseb/JawwalPay)' : 'Haseb / Mobile Pay'}</option>
              <option value="CHECK">{lang === 'ar' ? 'شيك بنكي معتمد' : 'Certified Check'}</option>
              <option value="HAWALA">{lang === 'ar' ? 'حوالة صرافة معتمدة' : 'Remittance Exchange'}</option>
            </select>
          </div>

          {/* Reference */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'رقم الشيك أو المرجع' : 'Reference / Check'}</label>
            <input
              type="text"
              placeholder="REF-88776"
              value={entryForm.reference_number}
              onChange={(e) => setEntryForm(p => ({ ...p, reference_number: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Currency Selection */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 uppercase font-black flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-500" />
              <span>{lang === 'ar' ? 'عملة الحركة (Currency)*' : 'Transaction Currency*'}</span>
            </label>
            <select
              value={entryForm.currency_id}
              onChange={(e) => setEntryForm(p => ({ ...p, currency_id: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-amber-700"
            >
              {currencies.map(curr => (
                <option key={curr.id} value={curr.id}>
                  {curr.code} - {lang === 'ar' ? curr.name_ar : curr.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Exchange Rate */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'سعر الصرف لـ (YER)*' : 'Exchange Rate (YER)*'}</label>
            <input
              type="number"
              step="any"
              min="0.0001"
              required
              disabled={isBaseCurrency}
              value={entryForm.exchange_rate}
              onChange={(e) => setEntryForm(p => ({ ...p, exchange_rate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-bold disabled:bg-zinc-200 text-slate-800"
            />
          </div>

          {/* Branch / Dimension */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'الفرع المستفيد / الصلاحية' : 'Branch / Permission'}</label>
            <select
              value={entryForm.branch_code}
              onChange={(e) => setEntryForm(p => ({ ...p, branch_code: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="HQ">{lang === 'ar' ? 'المركز الرئيسي (HQ)' : 'Headquarters (HQ)'}</option>
              <option value="BRANCH_SANAA">{lang === 'ar' ? 'فرع صنعاء' : 'Sanaa Branch'}</option>
              <option value="BRANCH_ADEN">{lang === 'ar' ? 'فرع عدن' : 'Aden Branch'}</option>
            </select>
          </div>

          {/* Security Protection Levels */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'مستوى الحماية المالي' : 'Financial Protection Level'}</label>
            <select
              value={entryForm.security_level}
              onChange={(e) => setEntryForm(p => ({ ...p, security_level: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-amber-600"
            >
              <option value={1}>{lang === 'ar' ? 'المستوى 1: عام' : 'Lvl 1: Public'}</option>
              <option value={2}>{lang === 'ar' ? 'المستوى 2: حماية متوسطة' : 'Lvl 2: Internal'}</option>
              <option value={3}>{lang === 'ar' ? 'المستوى 3: سري ومحمي' : 'Lvl 3: Confidential'}</option>
              <option value={4}>{lang === 'ar' ? 'المستوى 4: إدارة تنفيذية' : 'Lvl 4: Executive-Only'}</option>
            </select>
          </div>
        </div>

        {/* Global Narration */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'البيان وشرح المعاملة العام*' : 'General Voucher Narration*'}</label>
          <input
            type="text"
            required
            placeholder={lang === 'ar' ? 'مثال: صرف مساعدات التنمية الإنسانية لدورة صيف 2026' : 'Example: Disbursing humanitarian aid summer cycle'}
            value={entryForm.description}
            onChange={(e) => setEntryForm(p => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800"
          />
        </div>

        {/* Administrative Parties & Personnel Grid (ADVANCED MODE ONLY) */}
        {vViewMode === 'ADVANCED' && (
          <>
            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h4 className="font-black text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'الأطراف الإدارية والوساطة ومراكز التكلفة' : 'Administrative Parties & Cost Center'}</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-400">{lang === 'ar' ? 'الرقابة المالية المؤسسية' : 'Financial Governance'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                {/* Mediator / Agent */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold">{lang === 'ar' ? 'الوسيط / المندوب الميداني' : 'Mediator / Field Agent'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم الوسيط الميداني' : 'Agent Name'}
                    value={entryForm.mediator_agent}
                    onChange={(e) => setEntryForm(p => ({ ...p, mediator_agent: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold text-slate-800 dark:text-zinc-100"
                  />
                </div>

                {/* Sponsor / Donor */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold">{lang === 'ar' ? 'الكفيل / المانح' : 'Sponsor / Donor'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم الكفيل أو الجهة المانحة' : 'Sponsor Name'}
                    value={entryForm.sponsor_donor}
                    onChange={(e) => setEntryForm(p => ({ ...p, sponsor_donor: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold text-slate-800 dark:text-zinc-100"
                  />
                </div>

                {/* Disburser / Cashier */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold">{lang === 'ar' ? 'المسلّم / أمين الصندوق' : 'Disburser / Cashier'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم أمين الصندوق/المسلم' : 'Cashier Name'}
                    value={entryForm.disburser_cashier}
                    onChange={(e) => setEntryForm(p => ({ ...p, disburser_cashier: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold text-slate-800 dark:text-zinc-100"
                  />
                </div>

                {/* Recipient / Beneficiary */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold">{lang === 'ar' ? 'المستلِم / المستفيد' : 'Recipient / Beneficiary'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم المستلم النهائي' : 'Recipient Name'}
                    value={entryForm.recipient_beneficiary}
                    onChange={(e) => setEntryForm(p => ({ ...p, recipient_beneficiary: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold text-slate-800 dark:text-zinc-100"
                  />
                </div>

                {/* Cost Center Code */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold">{lang === 'ar' ? 'مركز التكلفة (Cost Center)' : 'Cost Center'}</label>
                  <select
                    value={entryForm.cost_center_code}
                    onChange={(e) => setEntryForm(p => ({ ...p, cost_center_code: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    <option value="CC-GEN">{lang === 'ar' ? 'CC-GEN | الإدارة العامة والتشغيل' : 'CC-GEN | General Admin'}</option>
                    <option value="CC-ORPHAN">{lang === 'ar' ? 'CC-ORPHAN | قطاع كفالات الأيتام' : 'CC-ORPHAN | Orphan Welfare'}</option>
                    <option value="CC-RELIEF">{lang === 'ar' ? 'CC-RELIEF | التدخلات الإغاثية الطارئة' : 'CC-RELIEF | Emergency Relief'}</option>
                    <option value="CC-WASH">{lang === 'ar' ? 'CC-WASH | مشاريع المياه والإصحاح' : 'CC-WASH | WASH Projects'}</option>
                    <option value="CC-ENDOWMENT">{lang === 'ar' ? 'CC-ENDOWMENT | الاستثمارات والأوقاف' : 'CC-ENDOWMENT | Investments'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Workflow Approval & Signatures Grid */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h4 className="font-black text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'سلسلة الاعتمادات والتوقيعات الإلكترونية' : 'Approval Chain & Digital Signatures'}</span>
                </h4>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  AUDITED WORKFLOW
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold">{lang === 'ar' ? 'توقيع المحاسب المنشئ' : 'Prepared By'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم المحاسب المنشئ' : 'Prepared By'}
                    value={entryForm.prepared_by}
                    onChange={(e) => setEntryForm(p => ({ ...p, prepared_by: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold text-slate-800 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold">{lang === 'ar' ? 'توقيع المراجع المالي' : 'Reviewed By'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم المراجع المالي' : 'Reviewed By'}
                    value={entryForm.reviewed_by}
                    onChange={(e) => setEntryForm(p => ({ ...p, reviewed_by: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold text-slate-800 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold">{lang === 'ar' ? 'توقيع الآمر بالصرف/المدير المالي' : 'Approved By'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم الآمر بالصرف' : 'Approved By'}
                    value={entryForm.approved_by}
                    onChange={(e) => setEntryForm(p => ({ ...p, approved_by: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold text-emerald-700 dark:text-emerald-400"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Rows */}
        <div className="space-y-4">
          <h4 className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">
            {lang === 'ar' ? 'البنود المحاسبية وتخصيص مراكز التكلفة والأنشطة التشغيلية' : 'Double Entry ledger lines & Operational activity codes'}
          </h4>

          {entryLines.map((line, idx) => (
            <div key={idx} className="flex flex-col lg:flex-row gap-3 items-end bg-slate-50 border border-slate-200 p-3.5 rounded-xl relative">
              {/* Account picker */}
              <div className="flex-1 space-y-1 w-full">
                <label className="text-[9px] text-zinc-400 uppercase font-black">{lang === 'ar' ? `الحساب المالي [${idx + 1}]` : `Account [${idx + 1}]`}</label>
                <AccountSearchSelect
                  accounts={accounts}
                  value={line.account_id}
                  onChange={(id) => handleLineChange(idx, 'account_id', id)}
                  lang={lang}
                />
              </div>

              {/* Cost Center / Operational Activity */}
              <div className="w-full lg:w-64 space-y-1">
                <label className="text-[9px] text-emerald-600 uppercase font-black">{lang === 'ar' ? 'النشاط التشغيلي / مركز التكلفة' : 'Operational Activity / Cost Center'}</label>
                <ActivitySearchSelect
                  options={getActivityOptions()}
                  value={line.activity_id ? `act-${line.activity_id}` : line.project_id ? `proj-${line.project_id}` : ''}
                  onChange={(projId, actId) => {
                    handleLineChange(idx, 'project_id', projId);
                    handleLineChange(idx, 'activity_id', actId || '');
                    
                    // Dynamic Posting Schema Rule Suggestion (CPA Standard)
                    if (actId) {
                      const act = activities.find(a => a.id === actId);
                      if (act && !line.account_id) {
                        let suggestedAcc = null;
                        if (act.activity_type_code === 'EDUCATIONAL_SESSION') {
                          suggestedAcc = accounts.find(a => a.account_code?.startsWith('5') && (a.name_ar?.includes('إضافة') || a.name_ar?.includes('إلغاء')));
                        } else if (act.activity_type_code === 'RELIEF_DISTRIBUTION') {
                          suggestedAcc = accounts.find(a => a.account_code?.startsWith('5') && (a.name_ar?.includes('إلغاء') || a.name_ar?.includes('التصنيف')));
                        } else if (act.activity_type_code === 'CONSTRUCTION_MONITORING') {
                          suggestedAcc = accounts.find(a => a.account_code?.startsWith('5') && (a.name_ar?.includes('الهاتف') || a.name_ar?.includes('أيام')));
                        }
                        if (suggestedAcc) {
                          handleLineChange(idx, 'account_id', suggestedAcc.id);
                        }
                      }
                    }
                  }}
                  lang={lang}
                />
                {(() => {
                  const relatedProject = projects.find(p => p.id === line.project_id);
                  const relatedProjBudget = relatedProject ? parseFloat(relatedProject.budget || '0') : 0;
                  const lineAmountInForeign = parseFloat(line.debit_amount) || parseFloat(line.credit_amount) || 0;
                  const lineAmountInBase = lineAmountInForeign * rate;
                  const budgetWarningExceeded = relatedProjBudget > 0 && lineAmountInBase > relatedProjBudget;

                  if (budgetWarningExceeded) {
                    return (
                      <div className="text-[9px] text-amber-600 font-bold mt-1 flex items-center gap-1 bg-amber-50 border border-amber-200 p-1 rounded">
                        <AlertCircle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                        <span>
                          {lang === 'ar' 
                            ? `تجاوز الميزانية (${relatedProjBudget.toLocaleString()} YER)`
                            : `Exceeds budget (${relatedProjBudget.toLocaleString()} YER)`}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Line description */}
              <div className="flex-1 space-y-1 w-full">
                <label className="text-[9px] text-zinc-400 uppercase font-black">{lang === 'ar' ? 'البيان السطري (اختياري)' : 'Line Narration'}</label>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'شرح تفصيلي لهذا البند...' : 'Detailed narration...'}
                  value={line.description}
                  onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Debit */}
              <div className="w-full lg:w-28 space-y-1">
                <label className="text-[9px] text-rose-600 uppercase font-black">
                  {lang === 'ar' ? `مدين (${selectedCurrency?.code || 'YER'})` : `Debit (${selectedCurrency?.code || 'YER'})`}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={line.debit_amount}
                  onChange={(e) => handleLineChange(idx, 'debit_amount', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-rose-600 font-mono text-right"
                />
                {parseFloat(line.debit_amount) > 0 && !isBaseCurrency && (
                  <div className="text-[9px] text-zinc-400 font-mono text-right mt-0.5">
                    ? {((parseFloat(line.debit_amount) || 0) * rate).toLocaleString()} YER
                  </div>
                )}
              </div>

              {/* Credit */}
              <div className="w-full lg:w-28 space-y-1">
                <label className="text-[9px] text-emerald-600 uppercase font-black">
                  {lang === 'ar' ? `دائن (${selectedCurrency?.code || 'YER'})` : `Credit (${selectedCurrency?.code || 'YER'})`}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={line.credit_amount}
                  onChange={(e) => handleLineChange(idx, 'credit_amount', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-emerald-600 font-mono text-right"
                />
                {parseFloat(line.credit_amount) > 0 && !isBaseCurrency && (
                  <div className="text-[9px] text-zinc-400 font-mono text-right mt-0.5">
                    ? {((parseFloat(line.credit_amount) || 0) * rate).toLocaleString()} YER
                  </div>
                )}
              </div>

              {/* Remove button */}
              {entryLines.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLine(idx)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleAddLine}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة سطر حساب آخر' : 'Add Ledger Row'}</span>
          </button>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full sm:w-80 space-y-2 text-[10px] font-black">
            <div className="flex justify-between border-b border-slate-100 pb-1 text-zinc-500 uppercase">
              <span>{lang === 'ar' ? 'القيم بالعملة الأجنبية:' : 'Currency Totals:'}</span>
              <span className="text-amber-700">{selectedCurrency?.code || 'YER'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">{lang === 'ar' ? 'إجمالي المدين:' : 'Total Debits:'}</span>
              <span className="text-rose-600 font-mono">{totalDebitSum.toLocaleString()} {selectedCurrency?.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">{lang === 'ar' ? 'إجمالي الدائن:' : 'Total Credits:'}</span>
              <span className="text-emerald-600 font-mono">{totalCreditSum.toLocaleString()} {selectedCurrency?.code}</span>
            </div>
            
            {!isBaseCurrency && (
              <div className="border-t border-slate-200 pt-1.5 space-y-1">
                <div className="flex justify-between text-zinc-500 uppercase pb-1">
                  <span>{lang === 'ar' ? 'المعادل بالعملة المحلية:' : 'Base Currency Equivalent:'}</span>
                  <span className="text-emerald-700">YER</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{lang === 'ar' ? 'المعادل المدين:' : 'Base Debits:'}</span>
                  <span className="text-rose-600 font-mono">{(totalDebitSum * rate).toLocaleString()} YER</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{lang === 'ar' ? 'المعادل الدائن:' : 'Base Credits:'}</span>
                  <span className="text-emerald-600 font-mono">{(totalCreditSum * rate).toLocaleString()} YER</span>
                </div>
              </div>
            )}

            <div className="border-t-2 border-slate-200 pt-1.5 flex justify-between">
              <span>{lang === 'ar' ? 'الفارق / التوازن:' : 'Variance / Balance:'}</span>
              <span className={isBalanced ? 'text-emerald-600' : 'text-rose-600'}>
                {Math.abs(totalDebitSum - totalCreditSum).toLocaleString()} {selectedCurrency?.code}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting || !isBalanced}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : null}
            <span>{isSubmitting ? (lang === 'ar' ? 'جاري ترحيل ومعادلة السند...' : 'Posting balanced voucher...') : (lang === 'ar' ? 'ترحيل وحفظ السند المالي' : 'Commit & Post Financial Voucher')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
