/**
 * NexoraOS™ — SaaS E2E foundation unit tests
 * TOTP, auth cookies, tenant ALS context, server idempotency, durable queue.
 */
import { describe, it, expect, vi } from 'vitest';

import { generateTotpSecret, verifyTotp, otpauthUrl, base32Decode } from '../totp';
import { parseCookies, getRequestToken, setAuthCookies, clearAuthCookies, ACCESS_COOKIE } from '../cookies';
import { runWithTenant, getTenantOrgId, isValidOrgId, tenantContextMiddleware } from '../../tenantContext';

// ─── TOTP ────────────────────────────────────────────────

describe('TOTP (RFC 6238)', () => {
  it('generates a valid base32 secret', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(base32Decode(secret).length).toBeGreaterThan(0);
  });

  it('builds an otpauth:// URL', () => {
    const url = otpauthUrl('JBSWY3DPEHPK3PXP', 'user@example.com');
    expect(url.startsWith('otpauth://totp/')).toBe(true);
    expect(url).toContain('secret=JBSWY3DPEHPK3PXP');
  });

  it('rejects malformed codes without throwing', () => {
    expect(verifyTotp(generateTotpSecret(), '12345')).toBe(false);
    expect(verifyTotp(generateTotpSecret(), 'abcdef')).toBe(false);
    expect(verifyTotp('!!!', '123456')).toBe(false);
  });
});

// ─── Cookies ─────────────────────────────────────────────

describe('auth cookies', () => {
  it('parses the Cookie header', () => {
    const out = parseCookies({ headers: { cookie: 'nx_at=abc123; other=x%20y' } } as any);
    expect(out[ACCESS_COOKIE]).toBe('abc123');
    expect(out.other).toBe('x y');
  });

  it('prefers Bearer over cookie', () => {
    const req = { headers: { authorization: 'Bearer hdr-token', cookie: 'nx_at=cookie-token' } } as any;
    expect(getRequestToken(req)).toBe('hdr-token');
  });

  it('falls back to the HttpOnly cookie', () => {
    const req = { headers: { cookie: 'nx_at=cookie-token' } } as any;
    expect(getRequestToken(req)).toBe('cookie-token');
  });

  it('returns null when no credential is present', () => {
    expect(getRequestToken({ headers: {} } as any)).toBeNull();
  });

  it('sets and clears cookies without throwing', () => {
    const calls: string[] = [];
    const res = {
      cookie: (n: string) => {
        calls.push(`set:${n}`);
      },
      clearCookie: (n: string) => {
        calls.push(`clear:${n}`);
      },
    } as any;
    setAuthCookies(res, 'at', 'rt', '1h', '7d');
    clearAuthCookies(res);
    expect(calls).toContain('set:nx_at');
    expect(calls).toContain('set:nx_rt');
    expect(calls).toContain('clear:nx_at');
  });
});

// ─── Tenant ALS context ──────────────────────────────────

describe('tenant context (ALS)', () => {
  it('is null outside a tenant scope', () => {
    expect(getTenantOrgId()).toBeNull();
  });

  it('propagates org id through async chains', async () => {
    const org = '11111111-1111-4111-8111-111111111111';
    await runWithTenant(org, async () => {
      await new Promise((r) => setTimeout(r, 5));
      expect(getTenantOrgId()).toBe(org);
    });
    expect(getTenantOrgId()).toBeNull();
  });

  it('validates org UUIDs', () => {
    expect(isValidOrgId('11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(isValidOrgId('00000000-0000-0000-0000-000000000001')).toBe(true);
    expect(isValidOrgId('not-a-uuid')).toBe(false);
    expect(isValidOrgId(undefined)).toBe(false);
  });

  it('middleware scopes valid claims and skips the rest', () => {
    const next = vi.fn();
    tenantContextMiddleware({ user: { org_id: '11111111-1111-4111-8111-111111111111' } } as any, {} as any, next);
    expect(next).toHaveBeenCalled();
    expect(getTenantOrgId()).toBeNull(); // sync middleware exits scope after next()

    const next2 = vi.fn();
    tenantContextMiddleware({} as any, {} as any, next2);
    expect(next2).toHaveBeenCalled();
  });
});

// ─── Idempotency ─────────────────────────────────────────

describe('idempotency middleware', () => {
  it('passes through requests without a key', async () => {
    const { idempotencyMiddleware } = await import('../../middleware/idempotency');
    const next = vi.fn();
    idempotencyMiddleware({ method: 'POST', headers: {}, body: {} } as any, {} as any, next);
    // async lookup resolves on next tick
    await new Promise((r) => setTimeout(r, 20));
    expect(next).toHaveBeenCalled();
  });

  it('replays the stored response for a retried key', async () => {
    const { idempotencyMiddleware } = await import('../../middleware/idempotency');
    const key = `test-key-${Date.now()}`;
    const mkReq = () =>
      ({
        method: 'POST',
        path: '/api/v2/test-idem',
        headers: { 'x-idempotency-key': key },
        body: { a: 1 },
        user: { org_id: 'global' },
      }) as any;

    // First request — captures { ok: true }
    let captured!: (body: any) => any;
    const res1 = {
      statusCode: 200,
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn((b: any) => b),
    } as any;
    const origJson = res1.json;
    await new Promise<void>((resolve) => {
      idempotencyMiddleware(mkReq(), res1, () => {
        captured = res1.json;
        res1.json = origJson;
        resolve();
      });
    });
    captured({ ok: true });
    await new Promise((r) => setTimeout(r, 50));

    // Retry — must replay without reaching the handler
    const res2 = {
      statusCode: 0,
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next2 = vi.fn();
    idempotencyMiddleware(mkReq(), res2, next2);
    await new Promise((r) => setTimeout(r, 50));
    expect(next2).not.toHaveBeenCalled();
    expect(res2.json).toHaveBeenCalledWith({ ok: true });
    expect(res2.setHeader).toHaveBeenCalledWith('X-Idempotent-Replayed', 'true');
  });
});

// ─── Durable queue (DB or memory fallback) ───────────────

describe('durable queue', () => {
  it('enqueues and reports metrics via DB or fallback', async () => {
    const { durableQueue } = await import('../../queue/pgQueue');
    const { queue: memoryQueue } = await import('../../queue/queue');
    (durableQueue as any).dbReady = false;
    (durableQueue as any).lastProbeAt = Date.now();
    memoryQueue.registerHandler('test.noop', async () => ({ ok: true }));
    durableQueue.registerHandler('test.noop', async () => ({ ok: true }));
    const job = await durableQueue.add('test.noop', { n: 1 }, { maxAttempts: 1 });
    expect(job.id).toBeTruthy();
    expect(job.type).toBe('test.noop');
    const metrics = await durableQueue.getMetrics();
    expect(metrics).toHaveProperty('pending');
    expect(metrics).toHaveProperty('failed');
    durableQueue.cancel(job.id);
  });
});
