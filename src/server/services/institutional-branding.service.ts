/**
 * NexoraOS™ — Institutional Branding & Report Header Service
 * Professional institutional methodology for Arabic-first reports:
 * every report carries a header resolved from the tenant chain
 *   branch override → organization settings → organizations row → defaults
 * Branch overrides use key convention BR_<BRANCHCODE>_<KEY> inside the
 * existing organization_settings KV store (no schema change required).
 * Resolution NEVER throws: any query failure degrades to safe defaults
 * so a header can never break a report.
 */

import { queryOne, queryMany } from '../core/database';
import { safeParseJSON } from '../core/helpers';

export interface ReportHeader {
  orgNameAr: string;
  orgNameEn: string;
  sloganAr: string;
  sloganEn: string;
  logoUrl: string;
  licenseNo: string;
  hqCity: string;
  country: string;
  currency: string;
  footerAr: string;
  footerEn: string;
  primaryColor: string;
  branchCode: string;
}

export interface ReportEnvelope {
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
  title: string;
  titleAr: string;
  titleEn: string;
  standard?: string;
  header: ReportHeader;
  generatedAt: string;
}

const DEFAULT_HEADER: ReportHeader = {
  orgNameAr: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
  orgNameEn: "Rohama'a Baynahum Charity Foundation",
  sloganAr: '',
  sloganEn: '',
  logoUrl: '',
  licenseNo: '',
  hqCity: '',
  country: '',
  currency: 'YER',
  footerAr: 'صادر عن الإدارة المؤسسية — NexoraOS™',
  footerEn: 'Issued by Institutional Management — NexoraOS™',
  primaryColor: '#0B5C3F',
  branchCode: 'HQ',
};

function parseStored(value: unknown): string {
  if (value == null) return '';
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[')
  ) {
    const parsed: unknown = safeParseJSON<unknown>(trimmed, trimmed);
    if (typeof parsed === 'string') return parsed;
    if (Array.isArray(parsed)) return parsed.join('، ');
    return trimmed;
  }
  return trimmed;
}

async function loadOrgRow(orgId: string): Promise<Record<string, unknown> | null> {
  try {
    const row = await queryOne(
      `SELECT name_ar, name_en, country, currency FROM organizations WHERE id = $1`,
      [orgId]
    );
    return (row as Record<string, unknown> | undefined) ?? null;
  } catch {
    return null;
  }
}

async function loadSettingsMap(orgId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryMany(
      `SELECT setting_key, setting_value FROM organization_settings WHERE organization_id = $1`,
      [orgId]
    );
    for (const r of rows as Record<string, unknown>[]) {
      map.set(String(r.setting_key), parseStored(r.setting_value));
    }
  } catch {
    /* degrade to defaults */
  }
  return map;
}

function pick(map: Map<string, string>, branchCode: string, keys: string[]): string {
  const branch = (branchCode || 'HQ').toUpperCase().replace(/[^A-Z0-9]/g, '');
  for (const key of keys) {
    const scoped = map.get(`BR_${branch}_${key}`);
    if (scoped) return scoped;
  }
  for (const key of keys) {
    const direct = map.get(key);
    if (direct) return direct;
  }
  return '';
}

export async function resolveReportHeader(orgId: string, branchCode = 'HQ'): Promise<ReportHeader> {
  const [org, settings] = await Promise.all([loadOrgRow(orgId), loadSettingsMap(orgId)]);
  const pickKeys = (keys: string[]) => pick(settings, branchCode, keys);
  const text = (value: string, fallback: string) => value || fallback;

  return {
    orgNameAr: text(
      pickKeys(['BRANDING_NAME_AR', 'ORG_OFFICIAL_NAME_AR']),
      String(org?.name_ar || DEFAULT_HEADER.orgNameAr)
    ),
    orgNameEn: text(
      pickKeys(['BRANDING_NAME_EN', 'ORG_OFFICIAL_NAME_EN']),
      String(org?.name_en || DEFAULT_HEADER.orgNameEn)
    ),
    sloganAr: pickKeys(['BRANDING_SLOGAN_AR']),
    sloganEn: pickKeys(['BRANDING_SLOGAN_EN']),
    logoUrl: pickKeys(['BRANDING_LOGO_URL']),
    licenseNo: pickKeys(['BRANDING_LICENSE_NO', 'ORG_TAX_REGISTRATION_NO']),
    hqCity: text(
      pickKeys(['BRANDING_HQ_CITY', 'ORG_HEADQUARTERS_CITY']),
      ''
    ),
    country: String(org?.country || ''),
    currency: text(
      pickKeys(['BRANDING_CURRENCY', 'FIN_BASE_CURRENCY']),
      String(org?.currency || DEFAULT_HEADER.currency)
    ),
    footerAr: text(pickKeys(['BRANDING_REPORT_FOOTER_AR']), DEFAULT_HEADER.footerAr),
    footerEn: text(pickKeys(['BRANDING_REPORT_FOOTER_EN']), DEFAULT_HEADER.footerEn),
    primaryColor: text(pickKeys(['BRANDING_PRIMARY_COLOR']), DEFAULT_HEADER.primaryColor),
    branchCode: (branchCode || 'HQ').toUpperCase(),
  };
}

export async function resolveReportLanguage(
  orgId: string,
  explicit?: string,
  settings?: Map<string, string>
): Promise<'ar' | 'en'> {
  if (explicit === 'ar' || explicit === 'en') return explicit;
  try {
    const map = settings ?? (await loadSettingsMap(orgId));
    const configured = (map.get('BRANDING_REPORT_LANG') || map.get('default_language') || '').toLowerCase();
    if (configured === 'en' || configured === 'ar') return configured;
  } catch {
    /* default below */
  }
  return 'ar';
}

export async function buildReportEnvelope(
  orgId: string,
  input: {
    titleAr: string;
    titleEn: string;
    standard?: string;
    branchCode?: string;
    lang?: string;
  }
): Promise<ReportEnvelope> {
  const branch = input.branchCode || 'HQ';
  const [header, lang] = await Promise.all([
    resolveReportHeader(orgId, branch),
    resolveReportLanguage(orgId, input.lang),
  ]);
  return {
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    title: lang === 'ar' ? input.titleAr : input.titleEn,
    titleAr: input.titleAr,
    titleEn: input.titleEn,
    standard: input.standard,
    header,
    generatedAt: new Date().toISOString(),
  };
}
