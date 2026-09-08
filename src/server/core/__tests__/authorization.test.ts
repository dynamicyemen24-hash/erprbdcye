/**
 * NexoraOS™ — Authorization Core Unit Tests
 *
 * يثبت أن نظام التفويض لا يعتمد على العميل (client-trusted).
 * كل الاختبارات تستخدم سياقاً مصطنعاً يُعطى كأنه "من التوكن الموقع" —
 * ولا يوجد شيء يتيح للعميل تعيين الدور/المؤسسة.
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { Request, Response } from 'express';
import {
  SystemRole,
  Permission,
  PERMISSION_ROLES,
  ROLE_SECURITY_LEVEL,
  hasPermission,
  isSelfOrAdmin,
  getAuthContext,
  verifyOrganizationOwnership,
  requirePermission,
  requireOrgOwnership,
  AuthContext,
  AuthorizedRequest,
} from '../authorization.core';

// ─────────────────────────────────────────────
// 1. Mock configuration to prevent real .env loading
// ─────────────────────────────────────────────
vi.mock('../config/env', () => ({
  loadConfig: () => ({
    port: 3000,
    host: 'localhost',
    baseUrl: 'http://localhost:3000',
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    database: { user: 'test', password: 'test', host: 'localhost', port: 5432, name: 'test', ssl: false },
    jwt: { secret: 'test-secret-key-that-is-long-enough-for-testing-1234', refreshSecret: 'test-refresh-secret', accessExpiresIn: '8h', refreshExpiresIn: '7d' },
    ai: { geminiApiKey: 'mock-key' },
    env: 'development',
    cors: { origins: ['http://localhost:3000'] },
    rateLimit: { auth: 5, api: 100, export: 10 },
    features: {},
    logging: { level: 'error', dir: '/tmp', maxSizeMb: 10, maxFiles: 5, console: false, json: true },
    backup: {},
    webhooks: {},
  }),
  default: () => ({
    port: 3000,
    host: 'localhost',
    baseUrl: 'http://localhost:3000',
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    database: { user: 'test', password: 'test', host: 'localhost', port: 5432, name: 'test', ssl: false },
  }),
}));

// 2. Spy on the real database module's queryOne so we control DB responses.
//    authorization.core.ts imports queryOne from './database' — the SAME
//    module identity — so the spy affects it directly.
import * as dbModule from '../database';
const mockedQueryOne: any = vi.spyOn(dbModule, 'queryOne').mockResolvedValue(null);

// ─── Avoid loading real env/.env ──────────────────
vi.mock('../config/env', async () => {
  return {
    loadConfig: () => ({
      port: 3000,
      host: 'localhost',
      baseUrl: 'http://localhost:3000',
      databaseUrl: 'postgresql://test:test@localhost:5432/test',
      database: { user: 'test', password: 'test', host: 'localhost', port: 5432, name: 'test', ssl: false },
      jwt: { secret: 'test-secret-key-that-is-long-enough-for-testing-1234', refreshSecret: 'test-refresh-secret', accessExpiresIn: '8h', refreshExpiresIn: '7d' },
      ai: { geminiApiKey: 'mock-key' },
      env: 'development',
      cors: { origins: ['http://localhost:3000'] },
      rateLimit: { auth: 5, api: 100, export: 10 },
      features: {},
      logging: { level: 'error', dir: '/tmp', maxSizeMb: 10, maxFiles: 5, console: false, json: true },
      backup: {},
      webhooks: {},
    }),
    default: () => ({
      port: 3000,
      host: 'localhost',
      baseUrl: 'http://localhost:3000',
      databaseUrl: 'postgresql://test:test@localhost:5432/test',
      database: { user: 'test', password: 'test', host: 'localhost', port: 5432, name: 'test', ssl: false },
    }),
  };
});

// ─── Mock database layer ─────────────────────────
const dbMock = {
  queryOne: vi.fn(),
  query: vi.fn(),
  queryMany: vi.fn(),
  transaction: vi.fn(),
};

vi.mock('../../core/database', () => ({
  queryOne: vi.fn(),
  query: vi.fn(),
  queryMany: vi.fn(),
  transaction: vi.fn(),
  getPool: vi.fn(),
  getTableSchemaInfo: vi.fn(),
}));

// ─── Helper: build a fake Express request with injected auth context ──
function makeReq(overrides: Record<string, any> = {}): AuthorizedRequest {
  return {
    path: '/api/test',
    method: 'GET',
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as unknown as AuthorizedRequest;
}

function makeRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// ─── Fake AuthContext builders (simulate "signed token" output) ─────────
const ctxVolunteer: AuthContext = {
  userId: 'user-vol-123',
  email: 'volunteer@example.com',
  role: SystemRole.VOLUNTEER,
  orgId: 'org-a',
  securityLevel: 2,
};

const ctxStaff: AuthContext = {
  userId: 'user-staff-456',
  email: 'staff@example.com',
  role: SystemRole.STAFF,
  orgId: 'org-a',
  securityLevel: 2,
};

const ctxFinance: AuthContext = {
  userId: 'user-fin-789',
  email: 'finance@example.com',
  role: SystemRole.FINANCE_MANAGER,
  orgId: 'org-a',
  securityLevel: 3,
};

const ctxOrgAdmin: AuthContext = {
  userId: 'user-admin-000',
  email: 'admin@example.com',
  role: SystemRole.ORG_ADMIN,
  orgId: 'org-a',
  securityLevel: 4,
};

const ctxSuperAdmin: AuthContext = {
  userId: 'user-super-999',
  email: 'super@example.com',
  role: SystemRole.SUPER_ADMIN,
  orgId: 'org-a', // ملحوظة: حتى للسوبر أدمن، orgId يأتي من التوكن ليس من العميل
  securityLevel: 5,
};

// ─────────────────────────────────────────────
// 1. اختبارات hasPermission (logic-level, no network)
// ─────────────────────────────────────────────
describe('hasPermission — منطق التفويض بنفسه', () => {
  it('SUPER_ADMIN يملك كل الصلاحيات', () => {
    Object.values(Permission).forEach(perm => {
      expect(hasPermission(SystemRole.SUPER_ADMIN, perm)).toBe(true);
    });
  });

  it('READONLY يملك فقط صلاحيات القراءة، ليس الكتابة أو الحذف', () => {
    expect(hasPermission(SystemRole.READONLY, Permission.RESOURCE_READ)).toBe(true);
    expect(hasPermission(SystemRole.READONLY, Permission.RESOURCE_WRITE)).toBe(false);
    expect(hasPermission(SystemRole.READONLY, Permission.RESOURCE_DELETE)).toBe(false);
  });

  it('FINANCE_MANAGER يملك التمويل لكن ليس إدارة المؤسسة', () => {
    expect(hasPermission(SystemRole.FINANCE_MANAGER, Permission.FINANCE_TRANSACTIONS_READ)).toBe(true);
    expect(hasPermission(SystemRole.FINANCE_MANAGER, Permission.ORG_SETTINGS_WRITE)).toBe(false);
  });

  it('VOLUNTEER لا يملك USERS_READ', () => {
    expect(hasPermission(SystemRole.VOLUNTEER, Permission.USERS_READ)).toBe(false);
  });

  it('دور مجهول — كل الصلاحيات مرفوضة (deny by default)', () => {
    expect(hasPermission('HACKER_ROLE' as any, Permission.RESOURCE_READ)).toBe(false);
    expect(hasPermission('' as any, Permission.RESOURCE_READ)).toBe(false);
    expect(hasPermission(undefined as any, Permission.RESOURCE_READ)).toBe(false);
  });

  it('الـ Permission غير المعرف — مرفوض', () => {
    // إنشاء صلاحية وهمية غير موجودة في الجدول
    expect(hasPermission(SystemRole.STAFF, 'fake:permission' as Permission)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 2. اختبارات isSelfOrAdmin (حماية من التلاعب في الهوية)
// ─────────────────────────────────────────────
describe('isSelfOrAdmin — حماية self-service من التلاعب', () => {
  it('يسمح للمستخدم بموارده الخاصة', () => {
    expect(isSelfOrAdmin('user-staff-456', ctxStaff)).toBe(true);
  });

  it('يمنع المستخدم من الوصول لهوية مستخدم آخر', () => {
    // محاكاة محاولة تغيير الـ userId في الـ params/headers
    expect(isSelfOrAdmin('victim-user-id', ctxStaff)).toBe(false);
  });

  it('يسمح للـ ORG_ADMIN بإدارة أي مستخدم في مؤسسته', () => {
    expect(isSelfOrAdmin('user-vol-123', ctxOrgAdmin)).toBe(true);
  });

  it('يسمح للـ SUPER_ADMIN للوصول لأي حساب', () => {
    expect(isSelfOrAdmin('user-vol-123', ctxSuperAdmin)).toBe(true);
  });

  it('يمنع VOLUNTEER من التواصع مع موظف آخر', () => {
    expect(isSelfOrAdmin('user-staff-456', ctxVolunteer)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 3. اختبارات getAuthContext (لا يوجد spoofing)
// ─────────────────────────────────────────────
describe('getAuthContext — استخراج الهوية من التوكن فقط', () => {
  it('يستخرج السياق بشكل صحيح عندما يوفّره authenticateToken', () => {
    const req = makeReq({ user: { id: 'u1', org_id: 'org-a', role: 'STAFF', security_level: 2 } });
    const ctx = getAuthContext(req);
    expect(ctx).toEqual(expect.objectContaining({ userId: 'u1', orgId: 'org-a', role: 'STAFF' }));
  });

  it('يُرجع null عندما لا يوجد توكن (غير مصادق)', () => {
    const req = makeReq({});
    const ctx = getAuthContext(req);
    expect(ctx).toBeNull();
  });

  it('يُرجع null عندما يفتقر التوكن لمعلومات org_id', () => {
    const req = makeReq({ user: { id: 'u1', role: 'STAFF' } });
    const ctx = getAuthContext(req);
    expect(ctx).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 4. اختبارات requirePermission middleware
// ─────────────────────────────────────────────
describe('requirePermission middleware — حماية نهاية المنحنى (endpoint)', () => {
  it('يسمح للـ STAFF بقراءة RESOURCE_READ ثم الـ next() يُستدعى', () => {
    const middleware = requirePermission(Permission.RESOURCE_READ);
    const req = makeReq({ user: { id: 'u1', org_id: 'org-a', role: 'STAFF', security_level: 2 } });
    const res = makeRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(req.authContext).toBeDefined();
  });

  it('يمنع VOLUNTEER من USERS_READ (403)', () => {
    const middleware = requirePermission(Permission.USERS_READ);
    const req = makeReq({ user: { id: 'u1', org_id: 'org-a', role: 'VOLUNTEER', security_level: 2 } });
    const res = makeRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'INSUFFICIENT_PERMISSIONS',
      required: Permission.USERS_READ,
    }));
  });

  it('يدعم الـ next() دون throw عندما لا يوجد auth context', () => {
    const middleware = requirePermission(Permission.USERS_READ);
    const req = makeReq({});
    const res = makeRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it('لم يعد هناك "role bypass" عبر قيمة client-side مُزوّرة', () => {
    const middleware = requirePermission(Permission.USERS_WRITE);
    const req = makeReq({
      user: { id: 'u1', org_id: 'org-a', role: 'SUPER_ADMIN', security_level: 5 },
      body: { role: 'HACKER_INJECTED_ROLE' },
    });
    const res = makeRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    // SUPER_ADMIN حقيقي (من التوكن) ينجح — يستخدم الـ role من req.user ليس الـ body
    expect(nextCalled).toBe(true);
  });

  it('يدمنع STAFF من USERS_WRITE (403) حتى لو جاء body مُزوّر', () => {
    const middleware = requirePermission(Permission.USERS_WRITE);
    const req = makeReq({
      user: { id: 'u1', org_id: 'org-a', role: 'STAFF', security_level: 2 },
      body: { is_admin: true, role: 'SUPER_ADMIN' }, // محاولة تجاوز client-side
    });
    const res = makeRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
        expect(nextCalled).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ─────────────────────────────────────────────
// 5. اختبارات verifyOrganizationOwnership + integration
// ─────────────────────────────────────────────
describe('verifyOrganizationOwnership — حماية الـ IDOR بين المؤسسات', () => {
  it('يدعم التحميل الملكية للمؤسسة الصحيحة — true', async () => {
    // SQL يطلب SELECT organization_id AS org_id — لذا العمود الناتج اسمه org_id
    const queryFn = vi.fn().mockResolvedValue({ org_id: 'org-a' });
    const result = await verifyOrganizationOwnership(
      'proj-1', 'projects', 'u1', 'org-a', 'id', 'organization_id', queryFn
    );
    expect(result).toBe(true);
  });

  it('[IDOR TEST] يمنع عضو في org-a من الوصول لمورد في org-b — false', async () => {
    const queryFn = vi.fn().mockResolvedValue({ org_id: 'org-b' });
    const result = await verifyOrganizationOwnership(
      'proj-x', 'projects', 'u1', 'org-a', 'id', 'organization_id', queryFn
    );
    expect(result).toBe(false);
  });

  it('[IDOR TEST] الهيدر المزوّر لا يؤثر — false عند مؤسسة مختلفة', async () => {
    // حتى لو أرسل المهاجم org_id في الهيدر، verifyOrganizationOwnership
    // يستخدم فقط userOrgId القادم من التوكن.
    const queryFn = vi.fn().mockResolvedValue({ org_id: 'org-secret' });
    const result = await verifyOrganizationOwnership(
      'doc-in-target', 'documents', 'u1', 'org-attacker', 'id', 'organization_id', queryFn
    );
    expect(result).toBe(false);
  });

  it('يدعم fail-closed عند فشل الاستعلام (خطأ DB) — false', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('DB connection lost'));
    const result = await verifyOrganizationOwnership(
      'proj-1', 'projects', 'u1', 'org-a', 'id', 'organization_id', queryFn
    );
    expect(result).toBe(false);
  });

  it('يدعم fail-closed عندما يكون المورد غير موجود — false', async () => {
    const queryFn = vi.fn().mockResolvedValue(null);
    const result = await verifyOrganizationOwnership(
      'nonexistent', 'projects', 'u1', 'org-a', 'id', 'organization_id', queryFn
    );
    expect(result).toBe(false);
  });

  it('[SQLi TEST] يرفض جدولاً خارجاً عن القائمة البيضاء — fail-closed false و queryFn لا يُستدعى', async () => {
    const queryFn = vi.fn().mockResolvedValue({ org_id: 'org-a' });
    const result = await verifyOrganizationOwnership(
      'proj-1', 'users; DROP TABLE users--', 'u1', 'org-a', 'id', 'organization_id', queryFn
    );
    expect(result).toBe(false); // فشل مغلق
    expect(queryFn).not.toHaveBeenCalled(); // لا يتم تنفيذ استعلام ضار أبداً
  });

  it('[SQLi TEST] يرفض عمود org خارج القائمة البيضاء — fail-closed false', async () => {
    const queryFn = vi.fn().mockResolvedValue({ org_id: 'org-a' });
    const result = await verifyOrganizationOwnership(
      'proj-1', 'projects', 'u1', 'org-a', 'id', 'organization_id; DROP TABLE projects', queryFn
    );
    expect(result).toBe(false);
    expect(queryFn).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// 6. اختبارات تكامل middleware (permission + ملكية)
// ─────────────────────────────────────────────
describe('requirePermission + requireOrgOwnership — تكامل middleware', () => {
  it('يمنع VOLUNTEER من USERS_WRITE حتى عبر middleware — 403', () => {
    const middleware = requirePermission(Permission.USERS_WRITE);
    const req = makeReq({
      user: { id: 'u1', org_id: 'org-a', role: 'VOLUNTEER', security_level: 2 },
    });
    const res = makeRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('يسمح للـ ORG_ADMIN بإدارة مؤسسته — عبر isSelfOrAdmin', () => {
    const adminCtx: AuthContext = {
      userId: 'u-admin', email: 'admin@test.com',
      role: SystemRole.ORG_ADMIN, orgId: 'org-a', securityLevel: 4,
    };
    expect(isSelfOrAdmin('any-user-in-org', adminCtx)).toBe(true);
  });

  it('يمنع STAFF من إدارة حساب آخر حتى عبر middleware (integration مع verifyOrganizationOwnership)', async () => {
    // محاكاة كاملة: STAFF يحاول تعديل مشروع في org-b
    const queryFn = vi.fn().mockResolvedValue({ org_id: 'org-b' });
    const allowed = await verifyOrganizationOwnership(
      'proj-x', 'projects', 'u-staff', 'org-a', 'id', 'organization_id', queryFn
    );
    expect(allowed).toBe(false);
  });
});
