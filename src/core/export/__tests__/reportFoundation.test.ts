import { describe, it, expect } from 'vitest';
import {
  generateDocStamp,
  buildOfficialStampFooter,
  formatOfficialDate,
  getInstitutionalBranding,
} from '../reportFoundation';

describe('reportFoundation — بصمات التحقق الحتمية (Deterministic Stamps)', () => {
  it('يعيد نفس البصمة لنفس محتوى المستند (قابلية التحقق المؤسسي)', () => {
    const seed = '<tr>المشروع أ</tr><tr>المشروع ب</tr>';
    expect(generateDocStamp('PRJ-UAM', seed)).toBe(generateDocStamp('PRJ-UAM', seed));
  });

  it('يعيد بصمة مختلفة عند أي تغيير في المحتوى (كشف التلاعب)', () => {
    const a = generateDocStamp('PRJ-UAM', 'content-A');
    const b = generateDocStamp('PRJ-UAM', 'content-B');
    expect(a).not.toBe(b);
  });

  it('يعيد بصمة مختلفة عند اختلاف رمز المستند', () => {
    expect(generateDocStamp('WF-UAM', 'seed')).not.toBe(generateDocStamp('STRAT-UAM', 'seed'));
  });

  it('يحترم عدد الخانات المطلوب', () => {
    expect(generateDocStamp('X', 'seed', 6)).toMatch(/^\d{6}$/);
    expect(generateDocStamp('X', 'seed', 5)).toMatch(/^\d{5}$/);
  });
});

describe('buildOfficialStampFooter — التذييل المؤسسي الموحد', () => {
  it('يضمّن البصمة الحتمية ورمز المستند ومعيار الامتثال', () => {
    const seed = 'rows-html';
    const footer = buildOfficialStampFooter({
      docCode: 'WF-UAM',
      lang: 'ar',
      contentSeed: seed,
      complianceStandard: 'IPSAS & Sphere CHS',
    });
    expect(footer).toContain(`WF-UAM-${generateDocStamp('WF-UAM', seed)}`);
    expect(footer).toContain('IPSAS & Sphere CHS');
    expect(footer).toContain('class="footer"');
  });

  it('لا يحتوي على أختام عشوائية غير قابلة للتحقق', () => {
    const footer = buildOfficialStampFooter({ docCode: 'UAM-BI', contentSeed: 'x' });
    expect(footer).not.toContain('Math.random');
    expect(footer).not.toContain('SHA-256 Verified');
  });

  it('يدعم التصنيف المؤسسي الموحد', () => {
    const confidential = buildOfficialStampFooter({ docCode: 'FIN', classification: 'CONFIDENTIAL' });
    const official = buildOfficialStampFooter({ docCode: 'FIN', classification: 'OFFICIAL' });
    expect(confidential).toContain('سري ومحمي');
    expect(official).toContain('مستند رسمي معتمد');
  });
});

describe('formatOfficialDate و getInstitutionalBranding — المعيارية الموحدة', () => {
  it('يعيد تنسيق تاريخ رسمي غير فارغ للغتين', () => {
    expect(formatOfficialDate('ar', new Date(2026, 0, 15)).length).toBeGreaterThan(0);
    expect(formatOfficialDate('en', new Date(2026, 0, 15)).length).toBeGreaterThan(0);
  });

  it('يعيد هوية مؤسسية كاملة حتى بدون إعدادات مخزنة', () => {
    const b = getInstitutionalBranding();
    expect(b.orgNameAr).toContain('رُحماء');
    expect(b.accentColor).toBe('#059669');
  });
});
