/**
 * NexoraOS™ Smart Enterprise Validation & Verification Layer
 * Provides detailed, explainable diagnostics with exact problem, cause, and remediation guidance.
 */

export interface SmartValidationError {
  field: string;
  problemAr: string;
  problemEn: string;
  causeAr: string;
  causeEn: string;
  remediationAr: string;
  remediationEn: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface ValidationReport {
  isValid: boolean;
  errors: SmartValidationError[];
  warnings: SmartValidationError[];
  integrityChecksum?: string;
  evaluatedAt: number;
}

export class SmartValidator {
  /**
   * Validates financial voucher / journal entry double-entry balance & accounts
   */
  public static validateVoucherEntry(voucher: {
    voucherNumber?: string;
    date?: string;
    debitTotal: number;
    creditTotal: number;
    lines: Array<{ accountCode?: string; debit?: number; credit?: number; description?: string }>;
  }): ValidationReport {
    const errors: SmartValidationError[] = [];
    const warnings: SmartValidationError[] = [];

    // 1. Required Voucher Number & Date
    if (!voucher.voucherNumber?.trim()) {
      errors.push({
        field: 'voucherNumber',
        problemAr: 'رقم السند المحاسبي مفقود',
        problemEn: 'Voucher number is missing',
        causeAr: 'لم يتم توليد أو إدخال كود مرجعي فريد للسند',
        causeEn: 'No unique reference code was assigned',
        remediationAr: 'أدخل رقم السند أو انقر على زر التوليد التلقائي (PV/RV/JV)',
        remediationEn: 'Enter code or click auto-generate',
        severity: 'critical'
      });
    }

    if (!voucher.date) {
      errors.push({
        field: 'date',
        problemAr: 'تاريخ السند غير محدد',
        problemEn: 'Voucher posting date is missing',
        causeAr: 'تاريخ القيد إلزامي وفق معايير IPSAS المحاسبية',
        causeEn: 'Date is mandatory under IPSAS accounting standards',
        remediationAr: 'حدد تاريخاً صحيحاً ضمن السنة المالية المفتوحة (FY2026)',
        remediationEn: 'Select a valid date in open fiscal year',
        severity: 'critical'
      });
    }

    // 2. Double-Entry Balancing Check
    const diff = Math.abs(voucher.debitTotal - voucher.creditTotal);
    if (diff > 0.001) {
      errors.push({
        field: 'debitTotal',
        problemAr: `السند غير متزن محاسبياً (الفارق: ${diff.toLocaleString()} ريال)`,
        problemEn: `Unbalanced journal entry (Difference: ${diff.toLocaleString()})`,
        causeAr: 'إجمالي المبالغ المدينة لا يتطابق مع إجمالي المبالغ الدائنة',
        causeEn: 'Total debits do not match total credits',
        remediationAr: 'عدّل قيم البنود بحيث يتساوى الطرف المدين والدائن تماماً قبل الاعتماد',
        remediationEn: 'Adjust line items until Debit equals Credit',
        severity: 'critical'
      });
    }

    // 3. Line Items Validation
    if (!voucher.lines || voucher.lines.length < 2) {
      errors.push({
        field: 'lines',
        problemAr: 'عدد بنود القيد غير كافٍ',
        problemEn: 'Insufficient journal lines',
        causeAr: 'يتطلب القيد المزدوج بندين على الأقل (طرف مدين وطرف دائن)',
        causeEn: 'Double-entry requires at least 2 distinct lines',
        remediationAr: 'أضف طرفاً مقابلاً للقيد من الدليل المحاسبي الشجري',
        remediationEn: 'Add balancing account line from Chart of Accounts',
        severity: 'critical'
      });
    } else {
      voucher.lines.forEach((line, idx) => {
        if (!line.accountCode) {
          errors.push({
            field: `lines[${idx}].accountCode`,
            problemAr: `البند رقم ${idx + 1} لا يحتوي على حساب شجري`,
            problemEn: `Line #${idx + 1} has no account specified`,
            causeAr: 'تم ترك حقل الحساب المحاسبي فارغاً',
            causeEn: 'Account field left empty',
            remediationAr: 'اختر الحساب المناسب من الدليل الشجري IPSAS',
            remediationEn: 'Select valid IPSAS chart of account',
            severity: 'critical'
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      evaluatedAt: Date.now()
    };
  }

  /**
   * Validates beneficiary registration form
   */
  public static validateBeneficiary(ben: {
    fullName?: string;
    nationalId?: string;
    phone?: string;
    governorate?: string;
    categoryCode?: string;
  }): ValidationReport {
    const errors: SmartValidationError[] = [];
    const warnings: SmartValidationError[] = [];

    if (!ben.fullName || ben.fullName.trim().split(' ').length < 3) {
      errors.push({
        field: 'fullName',
        problemAr: 'الاسم الثلاثي أو الرباعي غير مكتمل',
        problemEn: 'Full name is incomplete',
        causeAr: 'يتطلب التسجيل الإنساني اسماً ثلاثياً على الأقل لمنع التكرار',
        causeEn: 'Needs at least 3 name segments for deduplication',
        remediationAr: 'اكتب الاسم الكامل للمستفيد (الاسم الأول + الأب + الجد / اللقب)',
        remediationEn: 'Enter full 3-part beneficiary name',
        severity: 'critical'
      });
    }

    if (!ben.governorate) {
      errors.push({
        field: 'governorate',
        problemAr: 'المحافظة غير محددة',
        problemEn: 'Governorate not specified',
        causeAr: 'التوزيع الجغرافي إلزامي لتخصيص المساعدات وتقييم الاحتياج',
        causeEn: 'Geographic area mandatory for aid distribution',
        remediationAr: 'اختر إحدى محافظات الجمهورية اليمنية من القائمة',
        remediationEn: 'Select governorate from list',
        severity: 'critical'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      evaluatedAt: Date.now()
    };
  }
}
