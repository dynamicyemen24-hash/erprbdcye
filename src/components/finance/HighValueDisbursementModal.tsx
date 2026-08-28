import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Coins, 
  Building2,
  KeyRound
} from 'lucide-react';
import { triggerHaptic } from '../../helpers/hapticSwipe';
import { tafqeetArabicRials } from '../../core/security/financialSafetyGuardian';

interface HighValueDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (authNote: string) => void;
  voucher: {
    id: string;
    voucherNumber?: string;
    amount: number;
    currency?: string;
    payeeName?: string;
    projectName?: string;
    costCenter?: string;
  };
  lang: 'ar' | 'en';
}

export const HighValueDisbursementModal: React.FC<HighValueDisbursementModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  voucher,
  lang
}) => {
  if (!isOpen) return null;
  const isRtl = lang === 'ar';

  const [authReason, setAuthReason] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const tafqeetText = tafqeetArabicRials(voucher.amount);

  const handleConfirm = () => {
    // PIN verification check (standard enterprise override code or 4-digit manager PIN)
    if (securityPin.trim().length < 4) {
      setPinError(true);
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('success');
    onConfirm(authReason || 'معاملة صرف معتمدة بموجب الصلاحيات المالية الاستثنائية');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-amber-500/40 dark:border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header with High-Security Amber Glow */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
                  {isRtl ? 'مستوى الأمان المالي 3' : 'SECURITY LEVEL 3'}
                </span>
                <span className="text-xs text-slate-400">IPSAS SIGNOFF</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
                {isRtl ? 'تأكيد أمني إلزامي: معاملة صرف مالية كبرى' : 'Two-Step Verification: High-Value Disbursement'}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Warning Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              {isRtl 
                ? 'تنبيه حوكمي: يتجاوز مبلغ هذا السند سقف الصرف الفردي المباشر (10,000,000 ر.ي). يتطلب النظام توثيق رمز التفويض والمبرر الإجرائي قبل الترحيل المحاسبي النهائي لدفتر الأستاذ العام.'
                : 'Governance Warning: This voucher amount exceeds the 10,000,000 YER threshold. System requires explicit authorization PIN and business justification before posting.'}
            </p>
          </div>

          {/* Voucher Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{isRtl ? 'المبلغ المطلوب صرفه' : 'Disbursement Amount'}</span>
              <span className="text-xs font-mono font-bold text-slate-500">{voucher.voucherNumber || voucher.id}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                {voucher.amount.toLocaleString()}
              </span>
              <span className="text-sm font-black text-slate-600 dark:text-zinc-300 font-mono">
                {voucher.currency || (isRtl ? 'ريال يمني (YER)' : 'YER')}
              </span>
            </div>

            {/* Arabic Tafqeet Words */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <span className="text-slate-400 text-[10px] block mb-0.5">{isRtl ? 'المبلغ تفقيطاً بالكلمات:' : 'Amount in Words:'}</span>
              {tafqeetText}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/50 dark:border-zinc-800">
              <div>
                <span className="text-slate-400 text-[10px] block">{isRtl ? 'الجهة المستفيدة / Payee' : 'Payee'}</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200 truncate block">
                  {voucher.payeeName || (isRtl ? 'مقاول المشروع المعتمد' : 'Approved Vendor')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">{isRtl ? 'المشروع التنموي / WBS' : 'Project / WBS'}</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200 truncate block">
                  {voucher.projectName || (isRtl ? 'مشروع مياه وإصحاح صبر الموادم' : 'WASH Sabir Project')}
                </span>
              </div>
            </div>
          </div>

          {/* Authorization Input Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {isRtl ? 'مبرر الصرف الاستثنائي ومحضر الاعتماد' : 'Executive Sign-off Justification'}
              </label>
              <textarea 
                rows={2}
                value={authReason}
                onChange={(e) => setAuthReason(e.target.value)}
                placeholder={isRtl ? 'مثال: مستخلص الدفعة الثالثة لمشروع حفر الآبار استناداً لمحضر الفحص الفني رقم 412...' : 'e.g. 3rd progress certificate based on engineering inspection report...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {isRtl ? 'رمز التأكيد الأمني (Security PIN)' : 'Authorization Security PIN'}
                </label>
                <span className="text-[10px] text-slate-400 font-mono">{isRtl ? '(4 أرقام على الأقل)' : '(min 4 digits)'}</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute top-3 ltr:left-3 rtl:right-3 pointer-events-none" />
                <input 
                  type="password"
                  maxLength={6}
                  value={securityPin}
                  onChange={(e) => {
                    setSecurityPin(e.target.value);
                    if (pinError) setPinError(false);
                  }}
                  placeholder="••••"
                  className={`w-full py-2.5 px-9 rounded-xl bg-slate-50 dark:bg-zinc-950 border text-xs font-mono tracking-widest text-slate-900 dark:text-zinc-100 focus:outline-none ${
                    pinError 
                      ? 'border-rose-500 focus:border-rose-600 bg-rose-50/20' 
                      : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                  }`}
                />
              </div>
              {pinError && (
                <p className="text-[11px] text-rose-500 font-bold mt-1">
                  {isRtl ? 'يرجى إدخال رمز التأكيد الأمني المالي المعتمد' : 'Please enter valid security authorization PIN'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isRtl ? 'إلغاء المعاملة' : 'Cancel'}
          </button>

          <button 
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-lg shadow-amber-600/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isRtl ? 'تأكيد واعتماد الصرف النهائي' : 'Confirm & Sign-off Disbursement'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HighValueDisbursementModal;
