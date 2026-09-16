/**
 * Release-hardening regression tests — defects found during the production
 * readiness certification, each pinned by a failing-before/passing-after test.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import {
  revokeToken,
  revokeAllUserTokens,
  isTokenRevoked,
} from '../tokenRevocation';
import { extractTenantId } from '../helpers';
import { listForwardMigrationFiles } from '../../database/migrator';
import {
  parseModelJson,
  ModelOutputError,
  modelErrorResponse,
} from '../../routes/v2/gemini.routes';

const SECRET = 'test-secret-minimum-32-characters-long!!';

// ─── Token revocation namespacing ────────────────────────────

describe('token revocation (user-wide must actually revoke)', () => {
  function userToken(id: string): string {
    return jwt.sign({ id, email: `${id}@x.test`, org_id: 'org-1' }, SECRET, { expiresIn: '1h' });
  }

  it('revokes sessions on password_change (was silently spared)', () => {
    const token = userToken('u-pw');
    expect(isTokenRevoked(token)).toBe(false);
    revokeAllUserTokens('u-pw', 'password_change');
    expect(isTokenRevoked(token)).toBe(true);
  });

  it('revokes sessions on mfa_disabled', () => {
    const token = userToken('u-mfa');
    revokeAllUserTokens('u-mfa', 'mfa_disabled');
    expect(isTokenRevoked(token)).toBe(true);
  });

  it('does not revoke other users', () => {
    const other = userToken('u-other');
    revokeAllUserTokens('u-scope', 'password_change');
    expect(isTokenRevoked(other)).toBe(false);
  });

  it('single-token revoke still works', () => {
    const token = userToken('u-single');
    revokeToken(token, 'user_logout');
    expect(isTokenRevoked(token)).toBe(true);
  });
});

// ─── Tenant extraction: JWT claim wins ───────────────────────

describe('extractTenantId (header spoof rejected)', () => {
  it('uses the verified JWT claim when no header is present', () => {
    const req = { headers: {}, user: { org_id: 'org-A' } };
    expect(extractTenantId(req)).toBe('org-A');
  });

  it('accepts a matching header but throws on conflict', () => {
    // Same-org header passes through silently:
    expect(extractTenantId({ headers: { 'x-organization-id': 'org-A' }, user: { org_id: 'org-A' } })).toBe('org-A');
    // Conflicting header throws instead of silently scoping to the header:
    const req = { headers: { 'x-organization-id': 'org-B' }, user: { org_id: 'org-A' } };
    expect(() => extractTenantId(req)).toThrow(/conflicts with the authenticated organization/);
  });

  it('falls back to header only for unauthenticated callers', () => {
    expect(extractTenantId({ headers: { 'x-organization-id': 'org-H' } })).toBe('org-H');
  });

  it('throws when neither claim nor header exists', () => {
    expect(() => extractTenantId({ headers: {} })).toThrow(/required/);
  });
});

// ─── Migrator file filter ────────────────────────────────────

describe('listForwardMigrationFiles (down-files never run forward)', () => {
  it('excludes *.down.sql and sorts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'migs-'));
    writeFileSync(join(dir, '20260820_002_add_schema_migrations.down.sql'), 'DROP TABLE x;');
    writeFileSync(join(dir, '20260820_001_add_transaction_balance_constraint.up.sql'), 'SELECT 1;');
    writeFileSync(join(dir, '20260910_saas_e2e_foundation.sql'), 'SELECT 1;');
    writeFileSync(join(dir, 'notes.txt'), 'ignore me');
    expect(listForwardMigrationFiles(dir)).toEqual([
      '20260820_001_add_transaction_balance_constraint.up.sql',
      '20260910_saas_e2e_foundation.sql',
    ]);
  });
});

// ─── Model output parsing ────────────────────────────────────

describe('parseModelJson (LLM garbage handling)', () => {
  it('parses clean JSON', () => {
    expect(parseModelJson('{"a":1}', 't')).toEqual({ a: 1 });
  });

  it('strips fences and extracts embedded payloads', () => {
    expect(parseModelJson('```json\n{"a":2}\n```\nblah', 't')).toEqual({ a: 2 });
    expect(parseModelJson('here: [1,2] done', 't')).toEqual([1, 2]);
  });

  it('throws ModelOutputError on garbage', () => {
    expect(() => parseModelJson('not json at all', 't')).toThrow(ModelOutputError);
  });

  it('maps model errors to 502, others to 500', () => {
    const calls: any[] = [];
    const res = { status: (c: number) => ({ json: (b: any) => calls.push([c, b]) }) } as any;
    modelErrorResponse(res, new ModelOutputError('bad model'), 'fallback');
    modelErrorResponse(res, new Error('boom'), 'fallback');
    expect(calls[0][0]).toBe(502);
    expect(calls[0][1].code).toBe('MODEL_OUTPUT_INVALID');
    expect(calls[1][0]).toBe(500);
  });
});

// ─── Ownership middleware (DB-backed, read-only probes) ─────

describe('enforceOwnership (IDOR gate)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects unauthenticated callers with 401', async () => {
    const { enforceOwnership } = await import('../../tenantSecurity');
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();
    await enforceOwnership('projects')({ params: { id: 'x' } } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 for cross-tenant / missing records', async () => {
    const { enforceOwnership } = await import('../../tenantSecurity');
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();
    await enforceOwnership('projects')(
      { params: { id: '00000000-0000-0000-0000-000000000000' }, user: { org_id: 'org-A' } } as any,
      res,
      next
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  }, 60000);
});
