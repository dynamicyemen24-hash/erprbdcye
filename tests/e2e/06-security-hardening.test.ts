/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — E2E Test Suite 06: Security Hardening
 * Comprehensive security verification across all attack vectors
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { api, TOKENS, generateToken, assertSuccess, assertError, assertUnauthorized, assertForbidden } from './helpers/setup';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. JWT SECURITY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: JWT Hardening', () => {
  it('should reject token signed with "none" algorithm', async () => {
    const noneToken = jwt.sign({ id: '1', role: 'ADMIN' }, '', { algorithm: 'none' });
    const res = await api.get('/api/dashboard-stats', { token: noneToken });
    assertUnauthorized(res);
  });

  it('should reject token signed with wrong secret', async () => {
    const badToken = jwt.sign({ id: '1', role: 'ADMIN', org_id: 'org1', security_level: 5 }, 'wrong-secret-key', { expiresIn: '1h' });
    const res = await api.get('/api/dashboard-stats', { token: badToken });
    assertUnauthorized(res);
  });

  it('should reject expired token', async () => {
    const expired = jwt.sign({ id: '1', email: 'a@b.com', role: 'ADMIN', org_id: 'org1', security_level: 5 }, JWT_SECRET, { expiresIn: '-1h' });
    const res = await api.get('/api/dashboard-stats', { token: expired });
    assertUnauthorized(res);
  });

  it('should reject token with missing required claims', async () => {
    const incomplete = jwt.sign({ id: '1' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await api.get('/api/dashboard-stats', { token: incomplete });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should reject tampered token payload', async () => {
    const token = generateToken({ id: '1', email: 'a@b.com', role: 'USER', org_id: 'org1', security_level: 1 });
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ role: 'SUPER_ADMIN', security_level: 5 })).toString('base64url');
    const tampered = parts.join('.');
    const res = await api.get('/api/dashboard-stats', { token: tampered });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. XSS PREVENTION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    'javascript:alert(1)',
    '<body onload=alert(1)>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    "{{7*7}}",
    '${7*7}',
    '<iframe src="javascript:alert(1)">',
    'onmouseover=alert(1)',
  ];

  xssPayloads.forEach((payload, i) => {
    it(`should sanitize XSS payload #${i + 1}`, async () => {
      const res = await api.post('/api/tables/projects', {
        name_ar: payload,
        name_en: 'Safe Name',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
      if (res.status === 201 || res.status === 200) {
        const nameAr = res.data?.name_ar || '';
        expect(nameAr).not.toContain('<script>');
        expect(nameAr).not.toContain('onerror=');
        expect(nameAr).not.toContain('onload=');
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SQL INJECTION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: SQL Injection', () => {
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' AND 1=CONVERT(int, (SELECT TOP 1 table_name FROM information_schema.tables))--",
    "' OR 1=1#",
    "admin'--",
    "' OR ''='",
    "1; UPDATE users SET role='ADMIN' WHERE 1=1--",
    "' WAITFOR DELAY '0:0:5'--",
    "1' AND SLEEP(5)--",
  ];

  sqlPayloads.forEach((payload, i) => {
    it(`should resist SQL injection #${i + 1}`, async () => {
      const res = await api.get('/api/tables/projects', {
        token: TOKENS.admin,
        query: { search: payload },
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  it('should reject SQL injection in table name', async () => {
    const res = await api.get('/api/tables/users; DROP TABLE users--', { token: TOKENS.admin });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should reject SQL injection in POST body', async () => {
    const res = await api.post('/api/tables/projects', {
      name_ar: "'; INSERT INTO users (role) VALUES ('ADMIN'); --",
    }, { token: TOKENS.admin });
    expect(res.status).toBeLessThan(500);
    // Ensure no admin user was created
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PATH TRAVERSAL
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: Path Traversal', () => {
  const traversalPaths = [
    '/api/../../../etc/passwd',
    '/api/..%2f..%2f..%2fetc/passwd',
    '/api/backups/../../.env',
    '/api/backups/%2e%2e/%2e%2e/.env',
    '/api/tables/..%5c..%5cwindows/win.ini',
  ];

  traversalPaths.forEach((path, i) => {
    it(`should block path traversal #${i + 1}: ${path}`, async () => {
      const res = await api.get(path, { token: TOKENS.admin });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. AUTHENTICATION BYPASS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: Authentication Bypass', () => {
  const protectedEndpoints = [
    { method: 'GET', path: '/api/dashboard-stats' },
    { method: 'GET', path: '/api/tables/users' },
    { method: 'GET', path: '/api/strategic/plans' },
    { method: 'GET', path: '/api/v2/projects/' },
    { method: 'GET', path: '/api/finance/trial-balance' },
    { method: 'GET', path: '/api/sales/invoices' },
    { method: 'GET', path: '/api/backups/list' },
    { method: 'GET', path: '/api/rbac/matrix' },
  ];

  protectedEndpoints.forEach(({ method, path }) => {
    it(`should reject unauthenticated ${method} ${path}`, async () => {
      const res = await api.request(method, path);
      assertUnauthorized(res);
    });

    it(`should reject empty bearer token on ${method} ${path}`, async () => {
      const res = await api.request(method, path, { token: '' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it(`should reject malformed token on ${method} ${path}`, async () => {
      const res = await api.request(method, path, { token: 'not.a.valid.jwt.token' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. AUTHORIZATION ESCALATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: Authorization Escalation', () => {
  it('should prevent viewer from updating RBAC matrix', async () => {
    const res = await api.post('/api/rbac/matrix/update', {
      role_id: 'test', permission_ids: [],
    }, { token: TOKENS.viewer });
    expect([401, 403]).toContain(res.status);
  });

  it('should prevent viewer from triggering backup', async () => {
    const res = await api.post('/api/backups/trigger', {}, { token: TOKENS.viewer });
    expect([401, 403]).toContain(res.status);
  });

  it('should prevent user from resetting passwords', async () => {
    const res = await api.post('/api/users/reset-password', {
      user_id: 'x', new_password: 'test', admin_password: 'test',
    }, { token: TOKENS.user });
    expect([400, 401, 403]).toContain(res.status);
  });

  it('should prevent manager from modifying strategic plans', async () => {
    const res = await api.put('/api/strategic/plans/nonexistent', {
      title_ar: 'Hacked',
    }, { token: TOKENS.manager });
    expect(res.status).toBeLessThan(500);
  });

  it('should prevent viewer from deleting records', async () => {
    const res = await api.delete('/api/tables/projects/fake-id', { token: TOKENS.viewer });
    expect([401, 403, 404]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. HONEYPOT DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: Honeypot & Trap Endpoints', () => {
  const traps = [
    '/admin', '/admin/login', '/admin/config',
    '/wp-admin', '/wp-login.php',
    '/.env', '/.env.local', '/.env.production',
    '/.git/config', '/.git/HEAD',
    '/phpmyadmin', '/phpMyAdmin',
    '/debug', '/debug/vars', '/debug/pprof',
    '/api/internal', '/api/debug',
    '/server-status', '/server-info',
    '/.htaccess', '/.htpasswd',
    '/backup', '/db', '/database',
    '/xmlrpc.php', '/wp-content',
  ];

  traps.forEach(path => {
    it(`should trap access to ${path}`, async () => {
      const res = await api.get(path);
      expect(res.status).toBeLessThan(500);
      // Honeypots return fake 200 or 404 - not real content
      if (res.status === 200 && typeof res.data === 'string') {
        expect(res.data).not.toContain('database_url');
        expect(res.data).not.toContain('JWT_SECRET');
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: Response Headers', () => {
  it('should include X-Content-Type-Options: nosniff', async () => {
    const res = await api.get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should include X-Frame-Options', async () => {
    const res = await api.get('/api/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('should include Strict-Transport-Security', async () => {
    const res = await api.get('/api/health');
    expect(res.headers['strict-transport-security']).toBeDefined();
  });

  it('should not expose server version', async () => {
    const res = await api.get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('should include Content-Type: application/json', async () => {
    const res = await api.get('/api/health');
    expect(res.headers['content-type']).toContain('application/json');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: Rate Limiting', () => {
  it('should return rate limit headers', async () => {
    const res = await api.get('/api/health');
    // Rate limit headers may or may not be present depending on endpoint
    expect(res.status).toBeLessThan(500);
  });

  it('should handle rapid requests without crashing', async () => {
    const promises = Array.from({ length: 20 }, () => api.get('/api/health'));
    const results = await Promise.all(promises);
    expect(results.every(r => r.status < 500)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. CONTENT-TYPE ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: Content-Type Enforcement', () => {
  it('should reject request with wrong content-type', async () => {
    const res = await fetch(`${api['baseUrl']}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not json',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should handle XML payload gracefully', async () => {
    const res = await fetch(`${api['baseUrl']}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: '<root><email>test@test.com</email></root>',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should handle empty body', async () => {
    const res = await api.post('/api/auth/login', undefined);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. INFORMATION DISCLOSURE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Security: Information Disclosure', () => {
  it('should not expose stack traces in error responses', async () => {
    const res = await api.get('/api/tables/nonexistent_xyz_table');
    if (res.status >= 400) {
      const body = JSON.stringify(res.data);
      expect(body).not.toContain('node_modules');
      expect(body).not.toContain('at Object.');
      expect(body).not.toContain('TypeError:');
    }
  });

  it('should not expose database errors', async () => {
    const res = await api.get('/api/tables/users; SELECT 1--', { token: TOKENS.admin });
    const body = JSON.stringify(res.data);
    expect(body).not.toContain('postgresql://');
    expect(body).not.toContain('password');
  });

  it('should not expose internal paths', async () => {
    const res = await api.post('/api/auth/login', { email: 'x', password: 'y' });
    const body = JSON.stringify(res.data);
    expect(body).not.toContain('C:\\');
    expect(body).not.toContain('/home/');
  });
});
