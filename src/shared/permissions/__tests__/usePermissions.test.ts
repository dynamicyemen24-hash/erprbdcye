import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  decodeJwtClaims,
  readPermissionSubject,
} from '../usePermissions';

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `eyJhbGciOiJIUzI1NiJ9.${b64}.sig`;
}

describe('decodeJwtClaims', () => {
  it('decodes a base64url payload', () => {
    const claims = decodeJwtClaims(makeJwt({ role: 'ADMIN', security_level: 5 }));
    expect(claims?.role).toBe('ADMIN');
    expect(claims?.security_level).toBe(5);
  });

  it('returns null for malformed tokens', () => {
    expect(decodeJwtClaims('not-a-jwt')).toBeNull();
    expect(decodeJwtClaims('a.b.c')).toBeNull();
  });
});

describe('readPermissionSubject', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('prefers JWT claims from rbd_token', () => {
    localStorage.setItem('rbd_token', makeJwt({ role: 'ACCOUNTANT', security_level: 2 }));
    localStorage.setItem('rbd_user', JSON.stringify({ role: 'VIEWER' }));
    const subject = readPermissionSubject();
    expect(subject).toEqual({ role: 'ACCOUNTANT', security_level: 2 });
  });

  it('falls back to the saved session user object', () => {
    localStorage.setItem('rbd_user', JSON.stringify({ role: 'HR_MANAGER', securityLevel: 3 }));
    const subject = readPermissionSubject();
    expect(subject).toEqual({ role: 'HR_MANAGER', security_level: 3 });
  });

  it('returns null when there is no session (fails closed)', () => {
    expect(readPermissionSubject()).toBeNull();
  });
});
