import { describe, it, expect, vi, beforeEach } from 'vitest';

const dbMock = vi.hoisted(() => ({
  queryOne: vi.fn(),
  queryMany: vi.fn(),
}));

vi.mock('../../core/database', () => ({
  queryOne: dbMock.queryOne,
  queryMany: dbMock.queryMany,
}));

import {
  resolveReportHeader,
  resolveReportLanguage,
  buildReportEnvelope,
} from '../institutional-branding.service';

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.queryOne.mockResolvedValue(null);
  dbMock.queryMany.mockResolvedValue([]);
});

describe('resolveReportHeader fallback chain', () => {
  it('prefers BRANDING_* settings over legacy keys and org row', async () => {
    dbMock.queryOne.mockResolvedValue({ name_ar: 'صف', name_en: 'Row', country: 'YE', currency: 'YER' });
    dbMock.queryMany.mockResolvedValue([
      { setting_key: 'BRANDING_NAME_AR', setting_value: '"اسم الترويسة"' },
      { setting_key: 'ORG_OFFICIAL_NAME_AR', setting_value: '"الاسم القديم"' },
    ]);
    const h = await resolveReportHeader('org-1');
    expect(h.orgNameAr).toBe('اسم الترويسة');
  });

  it('falls back to legacy keys then org row then defaults', async () => {
    dbMock.queryOne.mockResolvedValue({ name_ar: 'اسم الصف', name_en: 'Row EN', country: 'YE', currency: 'USD' });
    dbMock.queryMany.mockResolvedValue([
      { setting_key: 'ORG_OFFICIAL_NAME_AR', setting_value: '"الاسم الرسمي"' },
    ]);
    const h = await resolveReportHeader('org-1');
    expect(h.orgNameAr).toBe('الاسم الرسمي');
    expect(h.orgNameEn).toBe('Row EN');
    expect(h.currency).toBe('USD');
  });

  it('uses safe defaults when storage is unreachable', async () => {
    dbMock.queryOne.mockRejectedValue(new Error('down'));
    dbMock.queryMany.mockRejectedValue(new Error('down'));
    const h = await resolveReportHeader('org-1');
    expect(h.orgNameAr).toContain('رُحماء');
    expect(h.currency).toBe('YER');
    expect(h.branchCode).toBe('HQ');
  });

  it('applies branch-scoped overrides only for that branch', async () => {
    dbMock.queryOne.mockResolvedValue(null);
    dbMock.queryMany.mockResolvedValue([
      { setting_key: 'BRANDING_NAME_AR', setting_value: '"المركز الرئيسي"' },
      { setting_key: 'BR_TAIZ_BRANDING_NAME_AR', setting_value: '"فرع تعز"' },
    ]);
    const taiz = await resolveReportHeader('org-1', 'taiz');
    expect(taiz.orgNameAr).toBe('فرع تعز');
    expect(taiz.branchCode).toBe('TAIZ');
    const hq = await resolveReportHeader('org-1', 'HQ');
    expect(hq.orgNameAr).toBe('المركز الرئيسي');
  });
});

describe('resolveReportLanguage', () => {
  it('defaults to Arabic', async () => {
    expect(await resolveReportLanguage('org-1')).toBe('ar');
  });
  it('honors explicit param then stored setting', async () => {
    expect(await resolveReportLanguage('org-1', 'en')).toBe('en');
    dbMock.queryMany.mockResolvedValue([{ setting_key: 'BRANDING_REPORT_LANG', setting_value: '"en"' }]);
    expect(await resolveReportLanguage('org-1')).toBe('en');
  });
});

describe('buildReportEnvelope', () => {
  it('builds Arabic RTL envelope by default', async () => {
    const e = await buildReportEnvelope('org-1', { titleAr: 'تقرير', titleEn: 'Report' });
    expect(e.lang).toBe('ar');
    expect(e.dir).toBe('rtl');
    expect(e.title).toBe('تقرير');
    expect(e.header.orgNameAr).toBeTruthy();
    expect(e.generatedAt).toBeTruthy();
  });
  it('switches to English LTR when requested', async () => {
    const e = await buildReportEnvelope('org-1', { titleAr: 'تقرير', titleEn: 'Report', lang: 'en' });
    expect(e.lang).toBe('en');
    expect(e.dir).toBe('ltr');
    expect(e.title).toBe('Report');
    expect(e.titleAr).toBe('تقرير');
  });
});
