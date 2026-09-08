// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Report & Document Foundation (طبقة الأساس المؤسسي للتقارير والمستندات)
// Single source of truth for: institutional branding, deterministic document
// verification stamps, unified date formatting, and standardized official footers.
// ═══════════════════════════════════════════════════════════════════════════════

import { SYSTEM_NAME } from '../utils';

export type DocumentClassification = 'PUBLIC' | 'OFFICIAL' | 'CONFIDENTIAL';

export interface InstitutionalBranding {
  orgNameAr: string;
  orgNameEn: string;
  accentColor: string;
  systemName: string;
  footerAr: string;
  footerEn: string;
  showSignatureBlocks: boolean;
}

const DEFAULT_BRANDING: InstitutionalBranding = {
  orgNameAr: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
  orgNameEn: "Rohamā'a Baynahum Charity Foundation",
  accentColor: '#059669',
  systemName: SYSTEM_NAME,
  footerAr: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية - ' + SYSTEM_NAME,
  footerEn: 'Rohamaa Baynahum Charity Foundation - ' + SYSTEM_NAME + ' Intelligent Enterprise Operating System',
  showSignatureBlocks: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Unified Branding — reads General Settings (rbd_*) with safe institutional
// fallbacks, so every report carries the exact same identity.
// ─────────────────────────────────────────────────────────────────────────────
export function getInstitutionalBranding(): InstitutionalBranding {
  const branding = { ...DEFAULT_BRANDING };
  try {
    const orgName = localStorage.getItem('rbd_org_name');
    if (orgName && orgName.trim() !== '') branding.orgNameAr = orgName;
    const footerAr = localStorage.getItem('rbd_report_footer_text_ar');
    if (footerAr && footerAr.trim() !== '') branding.footerAr = footerAr;
    const footerEn = localStorage.getItem('rbd_report_footer_text_en');
    if (footerEn && footerEn.trim() !== '') branding.footerEn = footerEn;
    const accentColor = localStorage.getItem('rbd_report_accent_color');
    if (accentColor && accentColor.trim() !== '') branding.accentColor = accentColor;
    branding.showSignatureBlocks = localStorage.getItem('rbd_report_signature_blocks') === 'true';
  } catch {
    // Non-browser environment — defaults apply
  }
  return branding;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic Document Verification Stamp
// FNV-1a 32-bit hash over (docCode | contentSeed). The SAME document content
// ALWAYS yields the SAME verification code — enabling audit verification and
// tamper detection. Replaces all Math.random() pseudo-stamps which broke
// institutional verifiability.
// ─────────────────────────────────────────────────────────────────────────────
export function generateDocStamp(docCode: string, contentSeed: string = '', digits: number = 6): string {
  const input = `${docCode}|${contentSeed}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const mod = Math.pow(10, digits);
  const n = (h >>> 0) % mod;
  return String(n).padStart(digits, '0');
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified Official Date Format — one format across ALL reports (ar-YE / en-US,
// long form). Eliminates the ar-SA/ar-YE/bare-toLocaleDateString inconsistency.
// ─────────────────────────────────────────────────────────────────────────────
export function formatOfficialDate(lang: 'ar' | 'en' = 'ar', date: Date = new Date()): string {
  return date.toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const CLASSIFICATION_LABELS: Record<DocumentClassification, { ar: string; en: string }> = {
  PUBLIC: { ar: 'للنشر العام والشفافية', en: 'PUBLIC RELEASE' },
  OFFICIAL: { ar: 'مستند رسمي معتمد', en: 'OFFICIAL CERTIFIED' },
  CONFIDENTIAL: { ar: 'سري ومحمي', en: 'CONFIDENTIAL' },
};

export interface OfficialStampFooterOptions {
  /** Document registry code, e.g. 'WF-UAM' or 'DOC-UAM-COR-01' */
  docCode: string;
  lang?: 'ar' | 'en';
  /** Endorsement line (prepared/approved chain) shown on the right of the footer */
  endorsementAr?: string;
  endorsementEn?: string;
  /** Deterministic seed — pass the actual report content (rows HTML, totals…) */
  contentSeed?: string;
  classification?: DocumentClassification;
  /** Compliance standard badge, e.g. 'IPSAS & Sphere CHS' */
  complianceStandard?: string;
  digits?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Standardized Official Footer — one institutional footer for every printed
// document: endorsement + classification + deterministic verification stamp +
// compliance standard + unified official date. Expects a `.footer` CSS class
// (flex, space-between) already present in the host document.
// ─────────────────────────────────────────────────────────────────────────────
export function buildOfficialStampFooter(options: OfficialStampFooterOptions): string {
  const lang = options.lang || 'ar';
  const isRtl = lang === 'ar';
  const b = getInstitutionalBranding();
  const stamp = generateDocStamp(options.docCode, options.contentSeed || '', options.digits || 6);
  const endorsement = isRtl
    ? (options.endorsementAr || 'اعتماد مؤسسي موثق')
    : (options.endorsementEn || 'Institutionally endorsed');
  const classification = CLASSIFICATION_LABELS[options.classification || 'OFFICIAL'][lang];
  const stampLabel = isRtl ? 'بصمة التحقق المؤسسية (حتمية)' : 'Institutional Verification Stamp (deterministic)';
  const compliance = options.complianceStandard
    ? `${isRtl ? 'المعيار' : 'Standard'}: ${options.complianceStandard} | `
    : '';

  return `<div class="footer">
          <div>${endorsement} | ${classification}</div>
          <div>${stampLabel}: ${options.docCode}-${stamp} | ${b.systemName} | ${compliance}${formatOfficialDate(lang)}</div>
        </div>`;
}
