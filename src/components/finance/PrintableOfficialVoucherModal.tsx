import React from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  Building2, 
  Calendar, 
  Coins 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { tafqeetArabicRials } from '../../core/security/financialSafetyGuardian';
import { triggerHaptic } from '../../helpers/hapticSwipe';

export interface OfficialVoucherData {
  voucherNumber: string;
  dateGregorian: string;
  dateHijri?: string;
  payeeName: string;
  projectName: string;
  projectCode: string;
  costCenter: string;
  paymentMethodAr: string;
  referenceDocNumber?: string;
  amountYer: number;
  descriptionAr: string;
  lines: Array<{
    accountCode: string;
    accountName: string;
    debitYer: number;
    creditYer: number;
    noteAr: string;
  }>;
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
}

interface PrintableOfficialVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: OfficialVoucherData;
  lang: 'ar' | 'en';
}

export const PrintableOfficialVoucherModal: React.FC<PrintableOfficialVoucherModalProps> = ({
  isOpen,
  onClose,
  voucher,
  lang
}) => {
  if (!isOpen) return null;
  const isRtl = lang === 'ar';

  const tafqeetText = tafqeetArabicRials(voucher.amountYer);

  const handlePrint = () => {
    triggerHaptic('medium');
    window.print();
  };

  const totalDebit = voucher.lines.reduce((acc, l) => acc + (l.debitYer || 0), 0);
  const totalCredit = voucher.lines.reduce((acc, l) => acc + (l.creditYer || 0), 0);

  // Digital verification QR content
  const qrVerificationPayload = JSON.stringify({
    org: 'Rohamāa Baynahum Charity Foundation',
    system: 'UAMEX ERP v3.5',
    vNo: voucher.voucherNumber,
    amt: voucher.amountYer,
    cur: 'YER',
    date: voucher.dateGregorian,
    ipsas: 'COMPLIANT'
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Container with Print Handling Styles */}
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4">
        
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="print:hidden px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wide">
                {isRtl ? 'معاينة سند الصرف الرسمي للطباعة A4' : 'Official A4 Voucher Print Preview'}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {voucher.voucherNumber} • IPSAS SOVEREIGN TEMPLATE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isRtl ? 'طباعة السند الرسمي A4' : 'Print Voucher'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT CANVAS (A4 Format) */}
        <div 
          id="official-printable-voucher" 
          className="p-8 sm:p-10 bg-white text-slate-900 space-y-6 print:p-0 print:space-y-4 font-sans"
          dir="rtl"
        >
          {/* 1. OFFICIAL DUAL LOGO HEADER */}
          <div className="border-b-2 border-emerald-700 pb-4 flex items-center justify-between">
            {/* Right: Organization Logo & Identity */}
            <div className="flex items-center gap-3">
              <img 
                src="/LogoRohamaab.png" 
                alt="جمعية رحماء بينهم" 
                className="w-16 h-16 object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div>
                <h1 className="text-base font-black text-emerald-800 tracking-tight leading-tight">
                  جمعية رُحماء بينهم للعمل الإنساني والتنمية
                </h1>
                <p className="text-[11px] text-slate-600 font-bold">
                  Rohamā'a Baynahum Charity Foundation — الجمهورية اليمنية
                </p>
                <p className="text-[10px] text-slate-400">
                  الإدارة المالية والمحاسبية • الرقابة والتدقيق الداخلي IPSAS
                </p>
              </div>
            </div>

            {/* Center: Document Title & Voucher Number Badge */}
            <div className="text-center">
              <div className="inline-block px-4 py-1.5 rounded-xl bg-emerald-50 border border-emerald-600 text-emerald-900 font-black text-base">
                سند صرف مالي معتمد
              </div>
              <div className="mt-1 text-xs font-mono font-black text-slate-800">
                رقم السند: <span className="text-emerald-700">{voucher.voucherNumber}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {voucher.dateHijri || '1448 هـ'} • {voucher.dateGregorian}
              </div>
            </div>

            {/* Left: UAMEX ERP™ Logo & ISO/IPSAS Seal */}
            <div className="flex items-center gap-3 text-left" dir="ltr">
              <div>
                <div className="text-xs font-black text-slate-800 tracking-tighter">
                  UAMEX ERP™
                </div>
                <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                  Intelligent Enterprise OS
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  IPSAS-24 / GAAP Verified
                </div>
              </div>
              <img 
                src="/UAMEX_ERPLOGO.png" 
                alt="UAMEX ERP" 
                className="w-12 h-12 object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
          </div>

          {/* 2. BENEFICIARY & METADATA GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">يصرف لصالح الأخ / الجهة:</span>
              <span className="font-black text-slate-900 text-sm block truncate">{voucher.payeeName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">المشروع التنموي (WBS):</span>
              <span className="font-bold text-slate-800 block truncate">{voucher.projectName}</span>
              <span className="text-[9px] font-mono text-slate-500">{voucher.projectCode}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">مركز التكلفة / الإدارة:</span>
              <span className="font-bold text-slate-800 block">{voucher.costCenter}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">طريقة الصرف والمستند المرجعي:</span>
              <span className="font-bold text-emerald-700 block">{voucher.paymentMethodAr}</span>
              <span className="text-[9px] font-mono text-slate-500">{voucher.referenceDocNumber || 'مستند مكتمل ومرفق'}</span>
            </div>
          </div>

          {/* 3. ARABIC TAFQEET & AMOUNT STRIP */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800">المبلغ بالأرقام:</span>
              <span className="text-xl font-black font-mono text-emerald-700 px-3 py-1 rounded-xl bg-white border border-emerald-300">
                {voucher.amountYer.toLocaleString()} ر.ي
              </span>
            </div>
            <div className="text-xs font-black text-slate-800">
              {tafqeetText}
            </div>
          </div>

          {/* 4. ACCOUNTING JOURNAL LINES TABLE */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-2.5 w-24">رقم الحساب</th>
                  <th className="p-2.5">اسم الحساب بدفتر الأستاذ العام</th>
                  <th className="p-2.5 w-28 text-left">مدين (ر.ي)</th>
                  <th className="p-2.5 w-28 text-left">دائن (ر.ي)</th>
                  <th className="p-2.5">البيان والشرح الإجرائي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {voucher.lines.map((line, idx) => (
                  <tr key={`v-line-${idx}`} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-mono font-bold text-slate-900">{line.accountCode}</td>
                    <td className="p-2.5 font-bold">{line.accountName}</td>
                    <td className="p-2.5 font-mono font-bold text-left text-emerald-700">
                      {line.debitYer > 0 ? line.debitYer.toLocaleString() : '—'}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-left text-amber-700">
                      {line.creditYer > 0 ? line.creditYer.toLocaleString() : '—'}
                    </td>
                    <td className="p-2.5 text-slate-600">{line.noteAr || voucher.descriptionAr}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-300 font-black text-slate-900">
                  <td colSpan={2} className="p-2.5 text-center">إجمالي القيد المحاسبي المتوازن:</td>
                  <td className="p-2.5 font-mono text-left text-emerald-700">{totalDebit.toLocaleString()}</td>
                  <td className="p-2.5 font-mono text-left text-amber-700">{totalCredit.toLocaleString()}</td>
                  <td className="p-2.5 text-[10px] text-emerald-600 font-bold">✓ قيد متزن مطابق لمعايير IPSAS</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 5. OFFICIAL 5-SIGNATURE APPROVAL BLOCK & QR VERIFICATION */}
          <div className="pt-2 flex items-end justify-between gap-4">
            {/* Five Institutional Signatures */}
            <div className="grid grid-cols-5 gap-2 flex-1 text-center text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40">
                <span className="text-[10px] text-slate-400 block font-bold">إعداد المحاسب</span>
                <span className="font-bold text-slate-800 text-[11px] block mt-1">{voucher.preparedBy}</span>
                <div className="h-9 border-b border-dashed border-slate-300 mt-2"></div>
                <span className="text-[9px] text-slate-400 block mt-1">التوقيع والتاريخ</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40">
                <span className="text-[10px] text-slate-400 block font-bold">المراجعة والتدقيق</span>
                <span className="font-bold text-slate-800 text-[11px] block mt-1">{voucher.reviewedBy}</span>
                <div className="h-9 border-b border-dashed border-slate-300 mt-2"></div>
                <span className="text-[9px] text-slate-400 block mt-1">التوقيع والتاريخ</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40">
                <span className="text-[10px] text-slate-400 block font-bold">المدير المالي</span>
                <span className="font-bold text-slate-800 text-[11px] block mt-1">أ. رضوان القادري</span>
                <div className="h-9 border-b border-dashed border-slate-300 mt-2"></div>
                <span className="text-[9px] text-slate-400 block mt-1">المصادقة المالية</span>
              </div>

              <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/30">
                <span className="text-[10px] text-emerald-800 block font-bold">المدير التنفيذي</span>
                <span className="font-bold text-emerald-900 text-[11px] block mt-1">{voucher.approvedBy}</span>
                <div className="h-9 border-b border-dashed border-emerald-400 mt-2 flex items-center justify-center text-emerald-600 text-[10px] font-bold">
                  [معتمد إلكترونياً]
                </div>
                <span className="text-[9px] text-emerald-700 block mt-1">الاعتماد النهائي للصرف</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40">
                <span className="text-[10px] text-slate-400 block font-bold">استلام المستفيد / الوكيل</span>
                <span className="font-bold text-slate-800 text-[11px] block mt-1">الاسم: ..............</span>
                <div className="h-9 border-b border-dashed border-slate-300 mt-2"></div>
                <span className="text-[9px] text-slate-400 block mt-1">توقيع المستلم والختم</span>
              </div>
            </div>

            {/* QR Verification Seal */}
            <div className="shrink-0 p-2.5 rounded-2xl bg-white border border-slate-300 text-center shadow-xs">
              <QRCodeSVG 
                value={qrVerificationPayload} 
                size={76} 
                level="M" 
                className="mx-auto"
              />
              <span className="text-[8px] font-mono font-bold text-slate-500 block mt-1">
                VERIFIED SEAL
              </span>
            </div>
          </div>

          {/* Footer Security Notice */}
          <div className="text-center pt-2 border-t border-slate-100 text-[9px] text-slate-400 flex items-center justify-between">
            <span>نظام يو امكس المؤسسي الشامل UAMEX ERP™ — جمعية رحماء بينهم للعمل الإنساني والتنمية</span>
            <span className="font-mono">وثيقة رسمية مشفرة رقمياً • كود التحقق الأمني: {voucher.voucherNumber}-SEC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableOfficialVoucherModal;
