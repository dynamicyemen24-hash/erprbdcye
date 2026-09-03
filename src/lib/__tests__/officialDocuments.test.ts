import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  buildOfficialArabicMemoPDFHTML,
  buildOfficialCompletionCertificatePDFHTML,
  buildOfficialDonationAcknowledgmentPDFHTML,
  buildOfficialVolunteerAppreciationPDFHTML,
} from '../pdfReportGenerator';

const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
  clear: () => mem.clear(),
};

const SETTINGS_KEYS = [
  'rbd_org_name',
  'rbd_org_name_en',
  'rbd_report_accent_color',
  'rbd_report_footer_text_ar',
  'rbd_report_footer_text_en',
  'rbd_report_signature_blocks',
];

describe('Official Arabic Documents (settings-customizable)', () => {
  beforeEach(() => {
    SETTINGS_KEYS.forEach(k => localStorage.removeItem(k));
  });

  afterEach(() => {
    SETTINGS_KEYS.forEach(k => localStorage.removeItem(k));
  });

  it('builds an official Arabic memo honoring General Settings branding', () => {
    localStorage.setItem('rbd_org_name', 'جمعية اختبار للعمل الإنساني');
    localStorage.setItem('rbd_report_accent_color', '#1e3a8a');

    const html = buildOfficialArabicMemoPDFHTML({
      memoNumber: 'م/2026/9999',
      classification: 'OFFICIAL',
      dateGregorian: '01/09/2026',
      fromAr: 'الإدارة العامة',
      toAr: 'إدارة المشاريع',
      subjectAr: 'اعتماد الخطة التشغيلية الربعية',
      bodyAr: ['تحية طيبة وبعد,', 'نفيدكم باعتماد الخطة.'],
      orgNameAr: 'جمعية اختبار للعمل الإنساني',
      accentColor: '#1e3a8a',
    });

    expect(html).toContain('م/2026/9999');
    expect(html).toContain('الإدارة العامة');
    expect(html).toContain('إدارة المشاريع');
    expect(html).toContain('اعتماد الخطة التشغيلية الربعية');
    expect(html).toContain('تحية طيبة وبعد');
    expect(html).toContain('جمعية اختبار للعمل الإنساني');
    expect(html).toContain('#1e3a8a');
    expect(html).toContain('direction: rtl');
  });

  it('builds a completion certificate with tafqeet amount and A4 framing', () => {
    localStorage.setItem('rbd_org_name', 'جمعية رُحماء بينهم');

    const html = buildOfficialCompletionCertificatePDFHTML({
      certificateNumber: 'ش/2026/1010',
      entityNameAr: 'شركة الأمل للمقاولات',
      projectName: 'مشروع حفر الآبار - تعز',
      projectCode: 'PRJ-WASH-2026',
      descriptionAr: 'إتمام أعمال الحفر والتأهيل',
      amountYer: 45000000,
      startDate: '01/01/2026',
      endDate: '30/06/2026',
      locationAr: 'مديرية صبر الموادم - تعز',
      issuedBy: 'لجنة الاستلام والتدقيق الفني',
    });

    expect(html).toContain('ش/2026/1010');
    expect(html).toContain('شركة الأمل للمقاولات');
    expect(html).toContain('مشروع حفر الآبار - تعز');
    expect(html).toContain('PRJ-WASH-2026');
    expect(html).toContain('مديرية صبر الموادم - تعز');
    expect(html).toContain('45,000,000');
    expect(html.toLowerCase()).toContain('direction: rtl');
  });

  it('builds a donation acknowledgment with tafqeet and IPSAS reference', () => {
    const html = buildOfficialDonationAcknowledgmentPDFHTML({
      acknowledgmentNumber: 'إش/2026/777',
      donorNameAr: 'مؤسسة الرعاية الخيرية العالمية',
      amountYer: 12500000,
      campaignAr: 'صندوق كفالة الأيتام',
      channelAr: 'تحويل مصرفي معتمد',
      purposeAr: 'كفالة الأيتام ودعم البرامج الإنسانية',
    });

    expect(html).toContain('إش/2026/777');
    expect(html).toContain('مؤسسة الرعاية الخيرية العالمية');
    expect(html).toContain('صندوق كفالة الأيتام');
    expect(html).toContain('تحويل مصرفي معتمد');
    expect(html).toContain('12,500,000');
    expect(html.toLowerCase()).toContain('direction: rtl');
  });

  it('builds a volunteer appreciation certificate with hours served', () => {
    const html = buildOfficialVolunteerAppreciationPDFHTML({
      certificateNumber: 'شك/2026/555',
      volunteerNameAr: 'أحمد محمد الشرعبي',
      initiativeAr: 'مبادرة الإغاثة الميدانية - تعز',
      hoursServed: 240,
      periodAr: 'العام الخيري 2026',
      excellenceAr: 'عطاء متميز خلال توزيع الحصص الإغاثية',
    });

    expect(html).toContain('شك/2026/555');
    expect(html).toContain('أحمد محمد الشرعبي');
    expect(html).toContain('مبادرة الإغاثة الميدانية - تعز');
    expect(html).toContain('240');
    expect(html.toLowerCase()).toContain('direction: rtl');
  });
});