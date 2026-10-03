import { describe, it, expect, vi } from 'vitest';
import { requirePermission, AuthenticatedRequest } from '../auth.middleware';
import { PERMISSIONS } from '../../../shared/permissions/permission-map';

function fakeRes() {
  const res = {
    statusCode: 200,
    body: undefined as any,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: any) { this.body = payload; return this; },
  };
  return res as typeof res & { statusCode: number; body: any };
}

function run(user: AuthenticatedRequest['user'], key = PERMISSIONS.FINANCE_READ) {
  const res = fakeRes();
  const next = vi.fn();
  requirePermission(key)({ user } as AuthenticatedRequest, res as any, next);
  return { res, next };
}

describe('requirePermission', () => {
  it('401s when there is no authenticated user', () => {
    const { res, next } = run(undefined);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('lets a permitted subject through (ADMIN, any level)', () => {
    const { res, next } = run({ id: 'u1', email: 'a@x', role: 'ADMIN', org_id: 'o1', security_level: 1 });
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('403s an HR role on a finance-scoped read', () => {
    const { res, next } = run({ id: 'u1', email: 'a@x', role: 'HR_MANAGER', org_id: 'o1', security_level: 2 });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('PERMISSION_DENIED');
    expect(res.body.missing).toEqual([PERMISSIONS.FINANCE_READ]);
  });

  it('allows clearance level 5 to bypass role restrictions', () => {
    const { res, next } = run({ id: 'u1', email: 'a@x', role: 'HR_OFFICER', org_id: 'o1', security_level: 5 });
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
