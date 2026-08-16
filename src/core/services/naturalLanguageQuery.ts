/**
 * NexoraOS™ Natural Language Query & Intent Parser
 * Converts human Arabic & English queries into structured multi-criteria ERP filters.
 * 
 * Example queries handled:
 * - "فاتورة المورد أحمد فوق 5000 يناير" -> { kind: 'invoice', vendor: 'أحمد', minAmount: 5000, month: 1 }
 * - "سندات صرف غير معتمدة تعز" -> { kind: 'voucher', subType: 'payment', status: 'pending', location: 'تعز' }
 * - "مشاريع تجاوزت الميزانية" -> { kind: 'project', filter: 'overrun' }
 * - "كفالات أيتام نشطة صنعاء" -> { kind: 'sponsorship', status: 'active', location: 'صنعاء' }
 */

import { normalizeArabicText } from '../utils/arabicSearch';

export interface StructuredERPQuery {
  rawQuery: string;
  normalizedQuery: string;
  intent: 'search_record' | 'navigate' | 'resume' | 'filter' | 'report' | 'action';
  targetEntity?: 'voucher' | 'invoice' | 'project' | 'program' | 'beneficiary' | 'sponsorship' | 'activity' | 'task' | 'report' | 'account';
  subType?: string;
  status?: 'approved' | 'pending' | 'draft' | 'completed' | 'all';
  minAmount?: number;
  maxAmount?: number;
  currency?: 'YER' | 'SAR' | 'USD';
  location?: string;
  dateRange?: {
    preset?: 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year';
    month?: number;
    year?: number;
  };
  searchKeywords: string[];
  confidence: number; // 0 to 1
  explanationAr: string;
  explanationEn: string;
}

/**
 * Normalizes Eastern Arabic digits (٠-٩) and Persian digits (۰-۹) to standard Western digits (0-9)
 */
export function normalizeDigits(str: string): string {
  if (!str) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
    res = res.replace(new RegExp(persianDigits[i], 'g'), i.toString());
  }
  return res;
}

export function parseNaturalLanguageQuery(rawQuery: string): StructuredERPQuery {
  const normDigits = normalizeDigits(rawQuery || '');
  const norm = normalizeArabicText(normDigits);
  
  const result: StructuredERPQuery = {
    rawQuery,
    normalizedQuery: norm,
    intent: 'search_record',
    searchKeywords: [],
    confidence: 0.5,
    explanationAr: 'بحث عام في السجلات',
    explanationEn: 'General record search'
  };

  if (!norm) return result;

  const words = norm.split(' ').filter(Boolean);
  const keywords: string[] = [];

  // 1. Detect Resume Intent ("أكمل", "استكمال", "resume", "continue")
  if (norm.includes('اكمل') || norm.includes('استكمال') || norm.includes('resume') || norm.includes('continue')) {
    result.intent = 'resume';
    result.confidence = 0.95;
    result.explanationAr = 'استكمال آخر عملية أو شاشة كنت تعمل عليها';
    result.explanationEn = 'Resume your last active task or record';
    return result;
  }

  // 2. Detect Entity Type
  if (norm.includes('فاتوره') || norm.includes('فواتير') || norm.includes('invoice') || norm.includes('claim')) {
    result.targetEntity = 'invoice';
    result.confidence += 0.2;
  } else if (norm.includes('سند') || norm.includes('سندات') || norm.includes('قيد') || norm.includes('voucher') || norm.includes('jv') || norm.includes('pv') || norm.includes('rv')) {
    result.targetEntity = 'voucher';
    if (norm.includes('صرف')) result.subType = 'payment';
    if (norm.includes('قبض')) result.subType = 'receipt';
    if (norm.includes('تسويل') || norm.includes('يوميه') || norm.includes('قيد')) result.subType = 'journal';
    result.confidence += 0.2;
  } else if (norm.includes('مشروع') || norm.includes('مشاريع') || norm.includes('project')) {
    result.targetEntity = 'project';
    result.confidence += 0.2;
  } else if (norm.includes('برنامج') || norm.includes('برامج') || norm.includes('program')) {
    result.targetEntity = 'program';
    result.confidence += 0.2;
  } else if (norm.includes('مستفيد') || norm.includes('مستفيدين') || norm.includes('beneficiary')) {
    result.targetEntity = 'beneficiary';
    result.confidence += 0.2;
  } else if (norm.includes('كفاله') || norm.includes('كفالات') || norm.includes('يتيم') || norm.includes('ايتام') || norm.includes('sponsorship') || norm.includes('orphan')) {
    result.targetEntity = 'sponsorship';
    result.confidence += 0.2;
  } else if (norm.includes('نشاط') || norm.includes('انشطه') || norm.includes('فعاليه') || norm.includes('activity') || norm.includes('wbs')) {
    result.targetEntity = 'activity';
    result.confidence += 0.2;
  } else if (norm.includes('مهمه') || norm.includes('مهام') || norm.includes('task')) {
    result.targetEntity = 'task';
    result.confidence += 0.2;
  } else if (norm.includes('تقرير') || norm.includes('تقارير') || norm.includes('report')) {
    result.targetEntity = 'report';
    result.intent = 'report';
    result.confidence += 0.25;
  } else if (norm.includes('حساب') || norm.includes('دليل') || norm.includes('شجره') || norm.includes('account')) {
    result.targetEntity = 'account';
    result.confidence += 0.2;
  }

  // 3. Detect Status
  if (norm.includes('غير معتمد') || norm.includes('معلق') || norm.includes('قيد المراجعة') || norm.includes('pending') || norm.includes('draft')) {
    result.status = 'pending';
  } else if (norm.includes('معتمد') || norm.includes('موافق') || norm.includes('approved')) {
    result.status = 'approved';
  } else if (norm.includes('مكتمل') || norm.includes('منتهي') || norm.includes('completed')) {
    result.status = 'completed';
  }

  // 4. Detect Amount Ranges (e.g. "فوق 5000", "أكبر من 10000", "أقل من 2000", "بين 1000 و 5000")
  const amountRegex = /(\d+[\d,.]*)/g;
  const numbersFound: number[] = [];
  let match;
  while ((match = amountRegex.exec(normDigits)) !== null) {
    const parsed = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) numbersFound.push(parsed);
  }

  if (numbersFound.length > 0) {
    if (norm.includes('فوق') || norm.includes('اكبر من') || norm.includes('اكثر من') || norm.includes('above') || norm.includes('greater than')) {
      result.minAmount = numbersFound[0];
    } else if (norm.includes('تحت') || norm.includes('اقل من') || norm.includes('below') || norm.includes('less than')) {
      result.maxAmount = numbersFound[0];
    } else if (numbersFound.length >= 2 && (norm.includes('بين') || norm.includes('between'))) {
      result.minAmount = Math.min(numbersFound[0], numbersFound[1]);
      result.maxAmount = Math.max(numbersFound[0], numbersFound[1]);
    }
  }

  // 5. Detect Currencies
  if (norm.includes('دولار') || norm.includes('usd') || norm.includes('$')) {
    result.currency = 'USD';
  } else if (norm.includes('سعودي') || norm.includes('sar') || norm.includes('رس')) {
    result.currency = 'SAR';
  } else if (norm.includes('ريال') || norm.includes('يمني') || norm.includes('yer')) {
    result.currency = 'YER';
  }

  // 6. Detect Yemen Governorates / Locations
  const governorates = ['تعز', 'صنعاء', 'عدن', 'الحديدة', 'موزع', 'إب', 'حضرموت', 'مأرب', 'لحج', 'أبين', 'شبوة', 'ذمار', 'حجة', 'المحويت', 'صعدة', 'الجوف', 'البيضاء', 'عمران', 'ريمة', 'المهرة', 'سقطرى'];
  for (const gov of governorates) {
    if (norm.includes(normalizeArabicText(gov))) {
      result.location = gov;
      break;
    }
  }

  // 7. Detect Temporal Presets & Months
  if (norm.includes('اليوم') || norm.includes('today')) {
    result.dateRange = { preset: 'today' };
  } else if (norm.includes('هذا الاسبوع') || norm.includes('this week')) {
    result.dateRange = { preset: 'this_week' };
  } else if (norm.includes('هذا الشهر') || norm.includes('this month')) {
    result.dateRange = { preset: 'this_month' };
  } else if (norm.includes('الربع') || norm.includes('quarter') || norm.includes('q1') || norm.includes('q2') || norm.includes('q3') || norm.includes('q4')) {
    result.dateRange = { preset: 'this_quarter' };
  }

  const monthsMap: Record<string, number> = {
    'يناير': 1, 'فبراير': 2, 'مارس': 3, 'ابريل': 4, 'مايو': 5, 'يونيو': 6,
    'يوليو': 7, 'اغسطس': 8, 'سبتمبر': 9, 'اكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12,
    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
  };

  for (const [monthName, monthNum] of Object.entries(monthsMap)) {
    if (norm.includes(normalizeArabicText(monthName))) {
      result.dateRange = { ...result.dateRange, month: monthNum };
      break;
    }
  }

  // Collect Remaining Search Keywords
  const stopWords = new Set(['في', 'من', 'الى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'كل', 'فوق', 'تحت', 'بين', 'اكبر', 'اقل', 'عرض', 'ابحث', 'اعرض', 'افتح', 'سند', 'فاتوره', 'مشروع', 'مستفيد']);
  for (const w of words) {
    if (!stopWords.has(w) && isNaN(Number(w)) && w.length > 2) {
      keywords.push(w);
    }
  }
  result.searchKeywords = keywords;

  // Build Explanations
  const partsAr: string[] = [];
  const partsEn: string[] = [];

  if (result.targetEntity) {
    partsAr.push(`النوع: ${result.targetEntity}`);
    partsEn.push(`Entity: ${result.targetEntity}`);
  }
  if (result.status) {
    partsAr.push(`الحالة: ${result.status}`);
    partsEn.push(`Status: ${result.status}`);
  }
  if (result.minAmount) {
    partsAr.push(`الحد الأدنى: ${result.minAmount.toLocaleString()}`);
    partsEn.push(`Min: ${result.minAmount.toLocaleString()}`);
  }
  if (result.maxAmount) {
    partsAr.push(`الحد الأقصى: ${result.maxAmount.toLocaleString()}`);
    partsEn.push(`Max: ${result.maxAmount.toLocaleString()}`);
  }
  if (result.location) {
    partsAr.push(`الموقع: ${result.location}`);
    partsEn.push(`Location: ${result.location}`);
  }

  if (partsAr.length > 0) {
    result.explanationAr = `تصفية موجهة: ${partsAr.join(' • ')}`;
    result.explanationEn = `Guided Filter: ${partsEn.join(' • ')}`;
    result.confidence = Math.min(0.95, result.confidence + 0.3);
  }

  return result;
}
