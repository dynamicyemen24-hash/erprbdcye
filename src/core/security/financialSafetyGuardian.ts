/**
 * UAMEX ERP™ — IPSAS Financial Safety Guardian & Anomaly Detection Engine
 * Enforces sovereign double-entry balance, duplicate voucher detection,
 * WBS budget ceiling verification, and high-value disbursement security thresholds.
 */

export const HIGH_VALUE_DISBURSEMENT_THRESHOLD_YER = 10_000_000; // 10,000,000 YER

export interface DoubleEntryCheckResult {
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

export interface DuplicateVoucherCheckResult {
  isPotentialDuplicate: boolean;
  duplicateCandidateId?: string;
  reasonAr?: string;
  reasonEn?: string;
}

export interface BudgetCeilingCheckResult {
  isWithinCeiling: boolean;
  remainingBudget: number;
  utilizationRatio: number;
  riskLevel: 'safe' | 'warning' | 'breached';
  messageAr: string;
  messageEn: string;
}

/**
 * Validates double-entry accounting lines according to IPSAS standards
 */
export function validateDoubleEntryBalance(
  lines: Array<{ debit_amount?: number | string | null; credit_amount?: number | string | null }>
): DoubleEntryCheckResult {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    totalDebit += parseFloat(String(line.debit_amount || 0)) || 0;
    totalCredit += parseFloat(String(line.credit_amount || 0)) || 0;
  }

  const difference = Math.abs(totalDebit - totalCredit);
  // Precision threshold for floating point calculations (1 fils / 0.01 YER)
  const isBalanced = difference < 0.01 && (totalDebit > 0 || totalCredit > 0);

  return {
    isBalanced,
    totalDebit,
    totalCredit,
    difference
  };
}

/**
 * Flags potential duplicate payment vouchers by comparing amount, project, and payee
 */
export function detectDuplicatePaymentVoucher(
  candidate: { amount: number; payeeName?: string; projectId?: string },
  recentVouchers: Array<{ id: string; amount: number; payeeName?: string; projectId?: string; date?: string }>
): DuplicateVoucherCheckResult {
  if (!candidate.amount || candidate.amount <= 0) {
    return { isPotentialDuplicate: false };
  }

  const match = recentVouchers.find(v => {
    const amountMatch = Math.abs(v.amount - candidate.amount) < 0.01;
    const payeeMatch = candidate.payeeName && v.payeeName 
      ? candidate.payeeName.trim().toLowerCase() === v.payeeName.trim().toLowerCase() 
      : false;
    const projectMatch = candidate.projectId && v.projectId
      ? candidate.projectId === v.projectId
      : false;

    return amountMatch && (payeeMatch || projectMatch);
  });

  if (match) {
    return {
      isPotentialDuplicate: true,
      duplicateCandidateId: match.id,
      reasonAr: `تنبيه رقابي: يوجد سند صرف سابق بنفس المبلغ (${candidate.amount.toLocaleString()} ر.ي) لنفس الجهة أو المشروع. يرجى التأكد من عدم التكرار.`,
      reasonEn: `Audit Warning: A prior voucher with the same amount (${candidate.amount.toLocaleString()} YER) exists for the same payee/project.`
    };
  }

  return { isPotentialDuplicate: false };
}

/**
 * Checks whether an expenditure breaches the approved WBS line-item budget ceiling
 */
export function checkWBSBudgetCeiling(
  requestedAmount: number,
  allocatedBudget: number,
  alreadySpent: number
): BudgetCeilingCheckResult {
  const currentTotal = alreadySpent + requestedAmount;
  const remainingBudget = allocatedBudget - currentTotal;
  const utilizationRatio = allocatedBudget > 0 ? (currentTotal / allocatedBudget) : 1;

  if (currentTotal > allocatedBudget) {
    return {
      isWithinCeiling: false,
      remainingBudget,
      utilizationRatio,
      riskLevel: 'breached',
      messageAr: `تجاوز سقف الموازنة: المبلغ المطلوب يتجاوز المتبقي من موازنة البند بمقدار (${Math.abs(remainingBudget).toLocaleString()} ر.ي)`,
      messageEn: `Budget ceiling overrun by (${Math.abs(remainingBudget).toLocaleString()} YER)`
    };
  }

  if (utilizationRatio >= 0.85) {
    return {
      isWithinCeiling: true,
      remainingBudget,
      utilizationRatio,
      riskLevel: 'warning',
      messageAr: `اقتراب من سقف الموازنة: استهلاك ${(utilizationRatio * 100).toFixed(1)}% من إجمالي موازنة البند المعتمدة.`,
      messageEn: `Approaching budget limit: ${(utilizationRatio * 100).toFixed(1)}% utilized.`
    };
  }

  return {
    isWithinCeiling: true,
    remainingBudget,
    utilizationRatio,
    riskLevel: 'safe',
    messageAr: `الموازنة كافية وآمنة: المتبقي (${remainingBudget.toLocaleString()} ر.ي).`,
    messageEn: `Budget safe: (${remainingBudget.toLocaleString()} YER) remaining.`
  };
}

/**
 * Converts numbers into official Arabic currency words (Tafqeet) for official vouchers
 */
export function tafqeetArabicRials(amount: number): string {
  if (isNaN(amount) || amount <= 0) return 'صفر ريال يمني';

  const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(n: number): string {
    let out = '';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const t = Math.floor(rem / 10);
    const u = rem % 10;

    if (h > 0) {
      out += hundreds[h];
    }

    if (rem > 0) {
      if (out) out += ' و';
      if (rem < 11) {
        out += units[rem];
      } else if (rem < 20) {
        out += teens[rem - 10];
      } else {
        if (u > 0) {
          out += units[u] + ' و';
        }
        out += tens[t];
      }
    }
    return out;
  }

  const integerPart = Math.floor(amount);
  const billions = Math.floor(integerPart / 1_000_000_000);
  const millions = Math.floor((integerPart % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((integerPart % 1_000_000) / 1_000);
  const remainder = integerPart % 1_000;

  const parts: string[] = [];

  if (billions > 0) {
    parts.push(billions === 1 ? 'مليار' : billions === 2 ? 'ملياران' : `${convertGroup(billions)} مليار`);
  }
  if (millions > 0) {
    parts.push(millions === 1 ? 'مليون' : millions === 2 ? 'مليونان' : `${convertGroup(millions)} مليون`);
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'ألف' : thousands === 2 ? 'ألفان' : `${convertGroup(thousands)} ألف`);
  }
  if (remainder > 0) {
    parts.push(convertGroup(remainder));
  }

  return `فقط وقدره ${parts.join(' و')} ريال يمني لا غير`;
}
