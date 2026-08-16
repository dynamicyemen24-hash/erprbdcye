import React, { useState } from 'react';
import { 
  Coins, 
  Plus, 
  Check, 
  X, 
  AlertTriangle, 
  DollarSign, 
  Info,
  Edit,
  Trash2
} from 'lucide-react';
import { Currency } from '../types';

interface CurrenciesViewProps {
  currencies: Currency[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
}

export default function CurrenciesView({ currencies, loading, onRefresh, lang }: CurrenciesViewProps) {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimalPlaces, setDecimalPlaces] = useState('2');
  const [isBase, setIsBase] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const openModal = (currency: Currency | null = null) => {
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
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
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
        throw new Error(errData.error || 'Failed to save currency.');
      }

      onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmation = lang === 'ar'
      ? 'هل أنت متأكد من حذف/تعطيل هذه العملة؟ سيتم إخفاء العملة من شاشات المطابقة النشطة.'
      : 'Are you sure you want to delete/disable this currency? It will be soft-deleted in the database.';

    if (!window.confirm(confirmation)) return;

    try {
      const response = await fetch(`/api/tables/currencies/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete currency.');
      }
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            {lang === 'ar' ? 'العملات والأساسيات المالية المعتمدة' : 'Currencies & Financial Ledgers'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {lang === 'ar' ? 'إدارة العملات المقبولة في كشوف التبرعات والرواتب والمطابقة المالية المباشرة لمؤسسة رحماء' : 'Configure official currencies, exchange indicators, and active payment ledgers'}
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow transition-all duration-150 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ar' ? 'عملة جديدة' : 'Add New Currency'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Currencies list table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase">{lang === 'ar' ? 'سجلات العملات المتاحة' : 'Currency Records'}</h3>
          </div>

          {loading ? (
            <div className="text-center py-12 text-zinc-400">{lang === 'ar' ? 'جاري تحميل العملات...' : 'Loading currencies...'}</div>
          ) : currencies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                <thead className="bg-slate-50/50 border-b border-slate-200 text-zinc-400 font-bold uppercase text-[9px]">
                  <tr>
                    <th className="px-6 py-3">{lang === 'ar' ? 'الرمز (ISO)' : 'Code'}</th>
                    <th className="px-6 py-3">{lang === 'ar' ? 'اسم العملة' : 'Name'}</th>
                    <th className="px-6 py-3">{lang === 'ar' ? 'العلامة (Symbol)' : 'Symbol'}</th>
                    <th className="px-6 py-3">{lang === 'ar' ? 'الكسور العشرية' : 'Decimals'}</th>
                    <th className="px-6 py-3">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="px-6 py-3 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {currencies.map(curr => (
                    <tr key={curr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 text-[13px]">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                          <span>{curr.code}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-700">
                        {lang === 'ar' ? (curr.name_ar || curr.name_en) : curr.name_en}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-500 text-sm">
                        {curr.symbol || '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {curr.decimal_places ?? 2}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {curr.is_base && (
                            <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-[9px] font-bold">
                              {lang === 'ar' ? 'العملة الأساسية' : 'Base Currency'}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            curr.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-zinc-400 border border-slate-200'
                          }`}>
                            {curr.is_active ? (lang === 'ar' ? 'نشطة' : 'Active') : (lang === 'ar' ? 'ملغية' : 'Inactive')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => openModal(curr)}
                            className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                            title={lang === 'ar' ? 'تعديل' : 'Edit'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {!curr.is_base && (
                            <button
                              onClick={() => handleDelete(curr.id)}
                              className="p-1 bg-slate-50 border border-slate-200 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                              title={lang === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400">{lang === 'ar' ? 'لا توجد عملات مضافة' : 'No currencies found.'}</div>
          )}
        </div>

        {/* Currency Information Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600" />
              <span>{lang === 'ar' ? 'التطابق المالي في المحفظة' : 'Financial Ledger Notes'}</span>
            </h3>

            <div className="text-xs text-slate-500 leading-relaxed space-y-3 font-medium">
              <p>
                {lang === 'ar' 
                  ? 'تم تعيين الريال اليمني (YER) كعملة الأساس الرسمية لجميع مطالبات ومحاسبات كشوف المستفيدين والأنشطة الإنسانية للمؤسسة في اليمن.'
                  : 'The Yemeni Rial (YER) is configured as the primary ledger base currency for all operational payouts, employee payrolls, and donor matches.'}
              </p>
              <p>
                {lang === 'ar' 
                  ? 'يدعم النظام عملات وسيطة إضافية كـ الريال السعودي (SAR) لربط ومطابقة الحوالات والمساهمات الخارجية القادمة من كفلاء البرامج.'
                  : 'Additional currencies like the Saudi Riyal (SAR) are supported to correctly balance and credit incoming cross-border sponsorships from international donors.'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100 space-y-1">
            <h4 className="text-xs font-bold text-amber-900">{lang === 'ar' ? 'انتبه!' : 'Reminder'}</h4>
            <p className="text-[11px] text-slate-600 leading-normal">
              {lang === 'ar' 
                ? 'عند إضافة أي عملة جديدة، تأكد من مطابقة رمزها مع كود أيزو العالمي ISO-4217 لتفادي كشوف أخطاء الربط مع محركات الصرف والتبرعات.'
                : 'Always check that the added currency code strictly follows the ISO-4217 specifications to prevent translation errors in currency conversion algorithms.'}
            </p>
          </div>
        </div>

      </div>

      {/* Currency Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {selectedCurrency 
                    ? (lang === 'ar' ? 'تعديل العملة المالية' : 'Edit Official Currency')
                    : (lang === 'ar' ? 'إضافة عملة مالية جديدة' : 'Add New Official Currency')}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {selectedCurrency 
                    ? (lang === 'ar' ? 'تعديل خصائص العملة وعلامتها وحالتها النشطة' : 'Update currency properties, symbol, and active status')
                    : (lang === 'ar' ? 'أضف عملات إضافية لتسهيل مطابقة التبرعات والكفالات الميدانية' : 'Register accepted currencies for donor mappings and accounting ledger tracks')}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-zinc-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'كود العملة الدولي (ISO Code)' : 'Currency Code (e.g. USD)'}</label>
                <input 
                  type="text" 
                  required 
                  maxLength={3}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. USD, EUR"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono font-bold uppercase"
                />
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</label>
                  <input 
                    type="text" 
                    required 
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="e.g. دولار أمريكي"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}</label>
                  <input 
                    type="text" 
                    required 
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. US Dollar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Symbol & Decimals */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'رمز/علامة العملة' : 'Symbol'}</label>
                  <input 
                    type="text" 
                    required 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="e.g. $, €"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الكسور العشرية' : 'Decimal Places'}</label>
                  <input 
                    type="number" 
                    required 
                    min={0}
                    max={4}
                    value={decimalPlaces}
                    onChange={(e) => setDecimalPlaces(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isBase}
                    onChange={(e) => setIsBase(e.target.checked)}
                    className="w-4 h-4 text-amber-600 border-zinc-300 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span>{lang === 'ar' ? 'تعيين كعملة أساس للمحاسبة' : 'Set as base accounting currency'}</span>
                </label>

                {selectedCurrency && !selectedCurrency.is_base && (
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-amber-600 border-zinc-300 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span>{lang === 'ar' ? 'الحالة نشطة' : 'Active status'}</span>
                  </label>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1 transition-all cursor-pointer"
                >
                  {formSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {selectedCurrency 
                      ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                      : (lang === 'ar' ? 'إضافة العملة' : 'Register Currency')}
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
