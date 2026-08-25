import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Building, 
  Warehouse, 
  Coins, 
  DollarSign, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';
import { Account } from './FinanceTypes';
import { exportToExcel, exportToCSV } from '../../utils/exportHelpers';

interface OpeningBalancesTabProps {
  accounts: Account[];
  lang: 'ar' | 'en';
  onRefresh: () => void;
}

type OpeningType = 'accounts' | 'inventory' | 'banks' | 'projects';

export default function OpeningBalancesTab({ accounts, lang, onRefresh }: OpeningBalancesTabProps) {
  const isRtl = lang === 'ar';
  const [openingType, setOpeningType] = useState<OpeningType>('accounts');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // LIVE inventory opening balances aggregated from warehouses + inventory tables
  const [inventoryBalances, setInventoryBalances] = useState<any[]>([]);
  const [bankBalances, setBankBalances] = useState<any[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadOpeningData = async () => {
      setInvLoading(true);
      setInvError(null);
      try {
        const token = localStorage.getItem('rbd_token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const getRows = async (table: string) => {
          try {
            const res = await fetch(`/api/tables/${table}`, { headers });
            if (!res.ok) return [];
            const data = await res.json();
            const rows = data.data || data || [];
            return Array.isArray(rows) ? rows : [];
          } catch { return []; }
        };

        const [warehouses, inventory] = await Promise.all([getRows('warehouses'), getRows('inventory')]);
        if (cancelled) return;

        // Aggregate real stock value per warehouse
        const agg = new Map<string, any>();
        warehouses.forEach((w: any) => {
          agg.set(w.id, {
            id: w.id,
            code: w.code || w.location || '-',
            name_ar: w.name_ar,
            category: '-',
            item_count: 0,
            unit_val_yer: 0,
            opening_qty: '0',
            opening_val_yer: '0'
          });
        });
        inventory.forEach((it: any) => {
          const wh = agg.get(it.warehouse_id);
          if (!wh) return;
          const qty = parseFloat(it.quantity || 0);
          const cost = parseFloat(it.unit_cost || 0);
          wh.item_count += 1;
          wh.opening_qty = String(parseFloat(wh.opening_qty) + qty);
          wh.unit_val_yer = cost;
          wh.opening_val_yer = String(parseFloat(wh.opening_val_yer) + qty * cost);
        });
        setInventoryBalances(Array.from(agg.values()));

        // Bank & cash balances come from the live chart of accounts (ASSET accounts)
        const bankLike = accounts.filter((a: any) => {
          const t = String(a.account_type || '').toUpperCase();
          if (t !== 'ASSET') return false;
          const name = `${a.name_ar || ''} ${a.name_en || ''}`.toLowerCase();
          return name.includes('بنك') || name.includes('bank') || name.includes('صندوق') || name.includes('cash') || name.includes('خزينة');
        });
        setBankBalances(bankLike.map((a: any) => ({
          id: a.id,
          bank_code: a.account_code,
          bank_name_ar: a.name_ar || a.name_en,
          account_no: a.account_code,
          currency: a.currency_code || 'YER',
          opening_val: String(a.current_balance || 0)
        })));
      } catch (err) {
        console.error('[OpeningBalances] Failed to load live data:', err);
        if (!cancelled) setInvError(isRtl ? 'تعذر تحميل بيانات الأرصدة الافتتاحية.' : 'Failed to load opening balance data.');
      } finally {
        if (!cancelled) setInvLoading(false);
      }
    };
    loadOpeningData();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBalanceChange = (accountId: string, value: string) => {
    setBalances(prev => ({ ...prev, [accountId]: value }));
  };

  const handleSaveAccounts = async () => {
    setMessage(null);
    setSaving(true);
    let successCount = 0;
    try {
      const updatedAccountIds = Object.keys(balances);
      if (updatedAccountIds.length === 0) {
        setMessage({
          type: 'error',
          text: isRtl ? 'لا توجد تعديلات لحفظها.' : 'No modifications to save.'
        });
        setSaving(false);
        return;
      }

      for (const id of updatedAccountIds) {
        const originalAcc = accounts.find(a => a.id === id);
        if (!originalAcc) continue;

        const val = parseFloat(balances[id]);
        if (isNaN(val)) continue;

        const dt = parseFloat(String(originalAcc.debit_total || 0));
        const ct = parseFloat(String(originalAcc.credit_total || 0));
        const accType = originalAcc.account_type?.toUpperCase();

        let newCurrent = val;
        if (accType === 'ASSET' || accType === 'EXPENSE') {
          newCurrent = val + dt - ct;
        } else {
          newCurrent = val + ct - dt;
        }

        const res = await fetch(`/api/tables/chart_of_accounts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opening_balance: val,
            current_balance: newCurrent
          })
        });

        if (res.ok) {
          successCount++;
        }
      }

      setMessage({
        type: 'success',
        text: isRtl 
          ? `تم تحديث الأرصدة الافتتاحية لعدد ${successCount} حساب بنجاح.` 
          : `Successfully updated opening balances for ${successCount} accounts.`
      });
      setBalances({});
      onRefresh();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Error saving opening balances.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportOpeningBalances = () => {
    if (openingType === 'accounts') {
      const exportData = accounts.map(a => ({
        account_code: a.account_code,
        name_ar: a.name_ar,
        name_en: a.name_en,
        account_type: a.account_type,
        opening_balance: a.opening_balance || 0,
        current_balance: a.current_balance || 0
      }));
      exportToExcel(exportData, 'Opening_Balances_ChartOfAccounts', 'Opening Balances');
    } else if (openingType === 'inventory') {
      exportToExcel(inventoryBalances, 'Opening_Balances_Inventory', 'Warehouse Initial Stock');
    } else {
      exportToExcel(bankBalances, 'Opening_Balances_Banks_Cash', 'Bank Treasuries Balances');
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.account_code.includes(searchTerm) ||
    acc.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.name_en.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.account_code.localeCompare(b.account_code));

  return (
    <div className="space-y-5 animate-fade-in">

      {/* SUB-NAV TYPES SELECTOR */}
      <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
        {[
          { id: 'accounts', labelAr: 'الأرصدة الافتتاحية للحسابات المالية', labelEn: 'Financial Accounts', icon: DollarSign },
          { id: 'inventory', labelAr: 'الأرصدة الافتتاحية للمخازن والمستودعات', labelEn: 'Inventory Stocks', icon: Warehouse },
          { id: 'banks', labelAr: 'أرصدة الخزائن والبنوك والصناديق', labelEn: 'Banks & Treasuries', icon: Building }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = openingType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setOpeningType(tab.id as OpeningType)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{isRtl ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* BAR ACTIONS */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" 
                  style={!isRtl ? { right: 'auto', left: '12px' } : {}} />
          <input
            type="text"
            placeholder={isRtl ? 'بحث برقم الكود أو اسم الحساب/المخزن لتعيين الرصيد الافتتاحي...' : 'Search item or account to enter opening balance...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
            style={!isRtl ? { paddingRight: '12px', paddingLeft: '36px' } : {}}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportOpeningBalances}
            className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تصدير إكسل' : 'Export Excel'}</span>
          </button>

          {openingType === 'accounts' && (
            <button
              onClick={handleSaveAccounts}
              disabled={saving || Object.keys(balances).length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isRtl ? 'حفظ الأرصدة الافتتاحية' : 'Save Opening Balances'}</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB CONTENT 1: ACCOUNTS OPENING BALANCES */}
      {openingType === 'accounts' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr className="bg-zinc-900 text-emerald-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                  <th className="p-3 w-32">{isRtl ? 'رقم الحساب' : 'Code'}</th>
                  <th className="p-3">{isRtl ? 'اسم الحساب' : 'Account Name'}</th>
                  <th className="p-3 w-36">{isRtl ? 'النوع الرئيسي' : 'Type'}</th>
                  <th className="p-3 text-right w-44">{isRtl ? 'الرصيد الافتتاحي الحالي' : 'Opening Balance'}</th>
                  <th className="p-3 text-right w-48">{isRtl ? 'تعديل الرصيد الافتتاحي الجديد' : 'New Opening Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      {isRtl ? 'لا توجد حسابات مطابقة للبحث' : 'No matching accounts found'}
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all">
                      <td className="p-3 font-mono text-slate-900 dark:text-zinc-100 font-black tracking-wide">{acc.account_code}</td>
                      <td className="p-3 text-slate-800 dark:text-zinc-200">{isRtl ? acc.name_ar : acc.name_en}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          acc.account_type === 'ASSET' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          acc.account_type === 'EXPENSE' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {acc.account_type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">
                        {parseFloat(String(acc.opening_balance || 0)).toLocaleString()} YER
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            type="number"
                            placeholder="0.00"
                            value={balances[acc.id] !== undefined ? balances[acc.id] : ''}
                            onChange={(e) => handleBalanceChange(acc.id, e.target.value)}
                            className="w-36 px-2.5 py-1 text-xs border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 rounded-lg text-right font-mono font-bold focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-zinc-100"
                          />
                          <span className="text-[10px] text-slate-400">YER</span>
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

      {/* TAB CONTENT 2: INVENTORY STOCKS */}
      {openingType === 'inventory' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr className="bg-zinc-900 text-emerald-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                  <th className="p-3 w-32">{isRtl ? 'كود المخزن' : 'Warehouse Code'}</th>
                  <th className="p-3">{isRtl ? 'اسم المستودع الميداني' : 'Warehouse Name'}</th>
                  <th className="p-3">{isRtl ? 'فئة المواد الإغاثية' : 'Category'}</th>
                  <th className="p-3 text-right">{isRtl ? 'الكمية الافتتاحية' : 'Initial Qty'}</th>
                  <th className="p-3 text-right">{isRtl ? 'القيمة الإجمالية (YER)' : 'Total Value YER'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                {inventoryBalances.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all">
                    <td className="p-3 font-mono font-black text-emerald-600">{item.code}</td>
                    <td className="p-3 text-slate-800 dark:text-zinc-100">{item.name_ar}</td>
                    <td className="p-3 text-slate-500">{item.category}</td>
                    <td className="p-3 text-right font-mono text-slate-900 dark:text-zinc-100 font-bold">{parseInt(item.opening_qty).toLocaleString()} وحدة</td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-black">{parseInt(item.opening_val_yer).toLocaleString()} YER</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: BANKS & CASH */}
      {openingType === 'banks' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr className="bg-zinc-900 text-emerald-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                  <th className="p-3 w-32">{isRtl ? 'كود الحساب' : 'Code'}</th>
                  <th className="p-3">{isRtl ? 'الجهة البنكية / الصندوق' : 'Treasury / Bank Name'}</th>
                  <th className="p-3 font-mono">{isRtl ? 'رقم الحساب' : 'Account No'}</th>
                  <th className="p-3 text-center">{isRtl ? 'العملة' : 'Currency'}</th>
                  <th className="p-3 text-right">{isRtl ? 'الرصيد الافتتاحي المعتمد' : 'Opening Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                {bankBalances.map((bnk, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all">
                    <td className="p-3 font-mono font-black text-emerald-600">{bnk.bank_code}</td>
                    <td className="p-3 text-slate-800 dark:text-zinc-100">{bnk.bank_name_ar}</td>
                    <td className="p-3 font-mono text-slate-500">{bnk.account_no}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-mono text-[10px] font-black rounded-md">
                        {bnk.currency}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900 dark:text-zinc-100 font-black text-xs">
                      {parseInt(bnk.opening_val).toLocaleString()} {bnk.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
