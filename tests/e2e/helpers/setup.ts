/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — E2E Test Infrastructure
 * Institutional-grade test helpers, fixtures, and database utilities
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ─── Configuration ────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001';

// ─── HTTP Client ──────────────────────────────────────────────
export interface ApiResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string, query?: Record<string, string>): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
      });
    }
    return url.toString();
  }

  async request<T = any>(
    method: string,
    path: string,
    options: {
      body?: any;
      token?: string;
      query?: Record<string, string>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { body, token, query, headers: extraHeaders } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = this.buildUrl(path, query);
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data: T;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json() as T;
    } else {
      data = (await res.text()) as any;
    }

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { responseHeaders[k] = v; });

    return { status: res.status, data, headers: responseHeaders };
  }

  get<T = any>(path: string, opts?: { token?: string; query?: Record<string, string>; headers?: Record<string, string> }) {
    return this.request<T>('GET', path, opts);
  }

  post<T = any>(path: string, body?: any, opts?: { token?: string; query?: Record<string, string>; headers?: Record<string, string> }) {
    return this.request<T>('POST', path, { body, ...opts });
  }

  put<T = any>(path: string, body?: any, opts?: { token?: string; query?: Record<string, string>; headers?: Record<string, string> }) {
    return this.request<T>('PUT', path, { body, ...opts });
  }

  delete<T = any>(path: string, opts?: { token?: string; query?: Record<string, string>; headers?: Record<string, string> }) {
    return this.request<T>('DELETE', path, opts);
  }
}

export const api = new ApiClient(BASE_URL);

// ─── JWT Token Generation (for testing without DB) ────────────
export function generateToken(payload: {
  id: string;
  email: string;
  role: string;
  org_id: string;
  security_level: number;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function generateRefreshToken(payload: {
  id: string;
  email: string;
  role: string;
  org_id: string;
  security_level: number;
}): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production', { expiresIn: '7d' });
}

// ─── Pre-built Auth Tokens ────────────────────────────────────
export const TOKENS = {
  superAdmin: generateToken({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@nexora.test',
    role: 'SUPER_ADMIN',
    org_id: TEST_ORG_ID,
    security_level: 5,
  }),
  admin: generateToken({
    id: '00000000-0000-0000-0000-000000000002',
    email: 'admin2@nexora.test',
    role: 'ADMIN',
    org_id: TEST_ORG_ID,
    security_level: 4,
  }),
  manager: generateToken({
    id: '00000000-0000-0000-0000-000000000003',
    email: 'manager@nexora.test',
    role: 'MANAGER',
    org_id: TEST_ORG_ID,
    security_level: 3,
  }),
  user: generateToken({
    id: '00000000-0000-0000-0000-000000000004',
    email: 'user@nexora.test',
    role: 'USER',
    org_id: TEST_ORG_ID,
    security_level: 2,
  }),
  viewer: generateToken({
    id: '00000000-0000-0000-0000-000000000005',
    email: 'viewer@nexora.test',
    role: 'VIEWER',
    org_id: TEST_ORG_ID,
    security_level: 1,
  }),
  noOrg: generateToken({
    id: '00000000-0000-0000-0000-000000000006',
    email: 'noorg@nexora.test',
    role: 'USER',
    org_id: '',
    security_level: 2,
  }),
};

// ─── Test Fixtures ────────────────────────────────────────────
export const FIXTURES = {
  organization: {
    id: TEST_ORG_ID,
    name_ar: 'جمعية رُحماء بينهم',
    name_en: 'Rohama\'a Baynahum',
    type_code: 'NGO',
  },

  strategicPlan: {
    title_ar: 'الخطة الاستراتيجية 2026-2030',
    title_en: 'Strategic Plan 2026-2030',
    start_date: '2026-01-01',
    end_date: '2030-12-31',
    status: 'ACTIVE',
  },

  project: {
    name_ar: 'مشروع التعليم',
    name_en: 'Education Project',
    description_ar: 'مشروع تعليمي شامل',
    budget: 500000,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'ACTIVE',
  },

  beneficiary: {
    full_name_ar: 'أحمد محمد علي',
    full_name_en: 'Ahmed Mohammed Ali',
    national_id: '1234567890',
    gender: 'MALE',
    date_of_birth: '1990-01-15',
    phone: '+967771234567',
    vulnerability_level: 'MEDIUM',
  },

  financialAccount: {
    account_code: '1100',
    name_ar: 'الصندوق',
    name_en: 'Cash',
    account_type: 'ASSET',
    account_level: 2,
  },

  journalEntry: {
    transaction_type: 'JOURNAL_ENTRY',
    description: 'إيداع نقدي',
    lines: [
      { account_code: '1100', debit: 10000, credit: 0, description: 'إيداع' },
      { account_code: '2100', debit: 0, credit: 10000, description: 'إيراد' },
    ],
  },

  staff: {
    employee_number: 'EMP-001',
    full_name_ar: 'خالد عبدالله',
    full_name_en: 'Khalid Abdullah',
    position: 'مدير المشاريع',
    department: 'المشاريع',
    hire_date: '2024-01-01',
    employment_type: 'FULL_TIME',
    email: 'khalid@nexora.test',
  },

  volunteer: {
    full_name_ar: 'فاطمة أحمد',
    full_name_en: 'Fatima Ahmed',
    phone: '+967779876543',
    email: 'fatima@nexora.test',
    skills: 'تعليم, تمريض',
  },

  donor: {
    name_ar: 'البنك الدولي',
    name_en: 'World Bank',
    donor_type: 'INTERNATIONAL',
    country: 'US',
    contact_email: 'contact@worldbank.test',
  },

  knowledgeArticle: {
    title_ar: 'دليل العمل الإنساني',
    title_en: 'Humanitarian Work Guide',
    content_ar: 'محتوى المقال التفصيلي',
    category: 'GUIDELINES',
    tags: 'humanitarian, guidelines, sphere',
    status: 'PUBLISHED',
  },

  communication: {
    subject_ar: 'แถลงการณ์อย่างเป็นทางการ',
    subject_en: 'Official Statement',
    doc_type: 'LETTER',
    from_entity: 'المدير العام',
    to_entity: 'جميع الموظفين',
    content_ar: 'محتوى الرسالة',
  },
};

// ─── Unique ID Generator ──────────────────────────────────────
export function uniqueId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// ─── Assertion Helpers ────────────────────────────────────────
export function assertSuccess(response: ApiResponse, expectedStatus: number = 200) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. ` +
      `Body: ${JSON.stringify(response.data).substring(0, 500)}`
    );
  }
}

export function assertError(response: ApiResponse, expectedStatus: number) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected error status ${expectedStatus}, got ${response.status}. ` +
      `Body: ${JSON.stringify(response.data).substring(0, 500)}`
    );
  }
}

export function assertUnauthorized(response: ApiResponse) {
  assertError(response, 401);
}

export function assertForbidden(response: ApiResponse) {
  assertError(response, 403);
}

export function assertNotFound(response: ApiResponse) {
  assertError(response, 404);
}

export function assertValidationError(response: ApiResponse) {
  if (response.status < 400 || response.status >= 500) {
    throw new Error(
      `Expected validation error (4xx), got ${response.status}. ` +
      `Body: ${JSON.stringify(response.data).substring(0, 500)}`
    );
  }
}

export function assertCreated(response: ApiResponse) {
  assertSuccess(response, 201);
}

// ─── Wait/Polling Helper ──────────────────────────────────────
export async function waitFor(
  fn: () => Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 200
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Timeout after ${timeoutMs}ms waiting for condition`);
}

// ─── Cleanup Tracker ──────────────────────────────────────────
const cleanupFns: Array<() => Promise<void>> = [];

export function trackCleanup(fn: () => Promise<void>) {
  cleanupFns.push(fn);
}

export async function runCleanup() {
  for (const fn of cleanupFns.reverse()) {
    try { await fn(); } catch { /* ignore cleanup errors */ }
  }
  cleanupFns.length = 0;
}

// ─── Table CRUD Helpers ───────────────────────────────────────
export async function createRecord(table: string, data: Record<string, any>, token: string) {
  return api.post(`/api/tables/${table}`, data, { token });
}

export async function readRecord(table: string, id: string, token: string) {
  return api.get(`/api/tables/${table}`, { token, query: { id } });
}

export async function updateRecord(table: string, id: string, data: Record<string, any>, token: string) {
  return api.put(`/api/tables/${table}/${id}`, data, { token });
}

export async function deleteRecord(table: string, id: string, token: string) {
  return api.delete(`/api/tables/${table}/${id}`, { token });
}

export async function listRecords(table: string, token: string, query?: Record<string, string>) {
  return api.get(`/api/tables/${table}`, { token, query });
}
