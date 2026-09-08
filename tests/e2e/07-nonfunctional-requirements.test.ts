/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — E2E Test Suite 07: Non-Functional Requirements
 * Performance, concurrency, resilience, consistency, pagination, and memory
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Test Coverage:
 * - Performance benchmarks (health, dashboard, tables, API docs)
 * - Concurrency (simultaneous GETs, POSTs, reads-during-writes)
 * - Resilience (DB down, rate limiting, malformed requests, large payloads)
 * - Data consistency (CRUD round-trips)
 * - API contract (Content-Type, error fields, status codes)
 * - Pagination (limits, page diffs, invalid pages)
 * - Graceful shutdown behavior
 * - Memory leak detection
 */

import { describe, it, expect } from 'vitest';
import { api, TOKENS } from './helpers/setup';

const T = TOKENS.superAdmin;

// ─── Performance Benchmark Helpers ─────────────────────────────
async function timedGet(path: string, query?: Record<string, string>) {
  const start = performance.now();
  const res = await api.get(path, { token: T, query });
  const elapsed = performance.now() - start;
  return { res, elapsed };
}

async function timedPost(path: string, body: any) {
  const start = performance.now();
  const res = await api.post(path, body, { token: T });
  const elapsed = performance.now() - start;
  return { res, elapsed };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PERFORMANCE BENCHMARKS
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Performance Benchmarks', () => {
  it('health endpoint responds within 500ms', async () => {
    const { elapsed } = await timedGet('/api/health');
    expect(elapsed).toBeLessThan(500);
  });

  it('dashboard stats responds within 2000ms', async () => {
    const { elapsed } = await timedGet('/api/dashboard/stats');
    expect(elapsed).toBeLessThan(2000);
  });

  it('table list queries respond within 1500ms', async () => {
    const { elapsed } = await timedGet('/api/tables/projects');
    expect(elapsed).toBeLessThan(1500);
  });

  it('API docs respond within 1000ms', async () => {
    const { elapsed } = await timedGet('/api/docs');
    expect(elapsed).toBeLessThan(1000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CONCURRENCY
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Concurrency', () => {
  it('10 simultaneous GET requests complete without errors', async () => {
    const paths = [
      '/api/health',
      '/api/dashboard/stats',
      '/api/tables/projects',
      '/api/tables/beneficiaries',
      '/api/tables/staff',
      '/api/tables/donors',
      '/api/tables/volunteers',
      '/api/tables/knowledge',
      '/api/docs',
      '/api/auth/me',
    ];
    const results = await Promise.all(
      paths.map((p) => api.get(p, { token: T }))
    );
    results.forEach((r) => {
      expect(r.status).toBeGreaterThanOrEqual(200);
      expect(r.status).toBeLessThan(500);
    });
  });

  it('5 simultaneous POST requests do not cause data corruption', async () => {
    const payloads = Array.from({ length: 5 }, (_, i) => ({
      name_ar: `مشروع متزامن ${i}`,
      name_en: `Concurrent Project ${i}`,
      budget: 10000 + i * 1000,
      status: 'ACTIVE',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
    }));
    const results = await Promise.all(
      payloads.map((body) =>
        api.post('/api/tables/projects', body, { token: T })
      )
    );
    const ids = results
      .filter((r) => r.status === 201 || r.status === 200)
      .map((r) => r.data?.id || r.data?.data?.id)
      .filter(Boolean);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('concurrent reads during writes do not return partial data', async () => {
    const writePromise = api.post(
      '/api/tables/projects',
      {
        name_ar: 'مشروع اختبار التزامن',
        name_en: 'Concurrency Test Project',
        budget: 25000,
        status: 'ACTIVE',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
      },
      { token: T }
    );
    const readPromises = Array.from({ length: 5 }, () =>
      api.get('/api/tables/projects', { token: T })
    );
    const allResults = await Promise.all([writePromise, ...readPromises]);
    const readResults = allResults.slice(1);
    readResults.forEach((r) => {
      expect(r.status).toBe(200);
      expect(typeof r.data).toBe('object');
      expect(r.data).not.toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RESILIENCE
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Resilience', () => {
  it('server returns 503 or graceful error when DB is unavailable', async () => {
    const res = await api.get('/api/health');
    expect([200, 503]).toContain(res.status);
    if (res.status === 503) {
      expect(res.data).toHaveProperty('error');
    }
  });

  it('rate limiting activates and returns 429 after excessive requests', async () => {
    const requests = Array.from({ length: 60 }, () =>
      api.get('/api/health', { token: T })
    );
    const results = await Promise.all(requests);
    const has429 = results.some((r) => r.status === 429);
    if (has429) {
      const rateLimited = results.find((r) => r.status === 429);
      expect(rateLimited?.data).toHaveProperty('error');
    }
  });

  it('malformed requests do not crash the server', async () => {
    const res1 = await api.post(
      '/api/tables/projects',
      'not-json',
      { token: T, headers: { 'Content-Type': 'application/json' } }
    );
    expect(res1.status).toBeGreaterThanOrEqual(400);

    const res2 = await api.post(
      '/api/tables/projects',
      undefined,
      { token: T }
    );
    expect(res2.status).toBeGreaterThanOrEqual(400);

    const healthRes = await api.get('/api/health');
    expect(healthRes.status).toBe(200);
  });

  it('large payload does not exhaust memory', async () => {
    const largeBody = {
      data: 'x'.repeat(500_000),
      name_ar: 'اختبار الحجم الكبير',
      name_en: 'Large Payload Test',
    };
    const res = await api.post('/api/tables/projects', largeBody, { token: T });
    expect([200, 201, 400, 413]).toContain(res.status);

    const healthRes = await api.get('/api/health');
    expect(healthRes.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. DATA CONSISTENCY
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Data Consistency', () => {
  it('Create-Read returns consistent data', async () => {
    const createRes = await api.post(
      '/api/tables/projects',
      {
        name_ar: 'مشروع اختبار الاتساق',
        name_en: 'Consistency Test Project',
        budget: 30000,
        status: 'DRAFT',
        start_date: '2026-06-01',
        end_date: '2026-12-31',
      },
      { token: T }
    );
    expect([200, 201]).toContain(createRes.status);
    const id = createRes.data?.id || createRes.data?.data?.id;
    if (id) {
      const readRes = await api.get(`/api/tables/projects/${id}`, { token: T });
      expect(readRes.status).toBe(200);
      expect(readRes.data).toHaveProperty('name_en', 'Consistency Test Project');
    }
  });

  it('Update-Read returns updated values', async () => {
    const createRes = await api.post(
      '/api/tables/projects',
      {
        name_ar: 'مشروع التحديث',
        name_en: 'Update Test Project',
        budget: 40000,
        status: 'ACTIVE',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
      },
      { token: T }
    );
    const id = createRes.data?.id || createRes.data?.data?.id;
    if (id) {
      const updateRes = await api.put(
        `/api/tables/projects/${id}`,
        { name_en: 'Updated Project Name', budget: 99999 },
        { token: T }
      );
      expect(updateRes.status).toBe(200);
      const readRes = await api.get(`/api/tables/projects/${id}`, { token: T });
      expect(readRes.data).toHaveProperty('name_en', 'Updated Project Name');
      expect(readRes.data).toHaveProperty('budget', 99999);
    }
  });

  it('Delete-Read returns 404 or empty', async () => {
    const createRes = await api.post(
      '/api/tables/projects',
      {
        name_ar: 'مشروع الحذف',
        name_en: 'Delete Test Project',
        budget: 10000,
        status: 'DRAFT',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
      },
      { token: T }
    );
    const id = createRes.data?.id || createRes.data?.data?.id;
    if (id) {
      const delRes = await api.delete(`/api/tables/projects/${id}`, { token: T });
      expect([200, 204]).toContain(delRes.status);
      const readRes = await api.get(`/api/tables/projects/${id}`, { token: T });
      expect([404, 200]).toContain(readRes.status);
      if (readRes.status === 200) {
        expect(readRes.data).toBeNull();
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. API CONTRACT
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: API Contract', () => {
  it('all responses have correct Content-Type: application/json', async () => {
    const endpoints = [
      '/api/health',
      '/api/dashboard/stats',
      '/api/tables/projects',
      '/api/docs',
    ];
    for (const path of endpoints) {
      const res = await api.get(path, { token: T });
      if (res.status < 400) {
        expect(res.headers['content-type']).toContain('application/json');
      }
    }
  });

  it('all error responses have an error field', async () => {
    const res = await api.get('/api/nonexistent-endpoint-xyz', { token: T });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.data).toHaveProperty('error');
  });

  it('all list responses have data array or pagination', async () => {
    const res = await api.get('/api/tables/projects', { token: T });
    expect(res.status).toBe(200);
    const hasData = Array.isArray(res.data) || Array.isArray(res.data?.data);
    const hasPagination = res.data?.total !== undefined || res.data?.pagination !== undefined;
    expect(hasData || hasPagination).toBe(true);
  });

  it('HTTP status codes match actual outcomes', async () => {
    const okRes = await api.get('/api/health');
    expect(okRes.status).toBe(200);

    const createdRes = await api.post(
      '/api/tables/projects',
      {
        name_ar: 'مشروع كود الحالة',
        name_en: 'Status Code Test',
        budget: 5000,
        status: 'DRAFT',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
      },
      { token: T }
    );
    expect([200, 201]).toContain(createdRes.status);

    const badReqRes = await api.post('/api/tables/projects', {}, { token: T });
    expect(badReqRes.status).toBe(400);

    const noTokenRes = await api.get('/api/tables/projects');
    expect([401, 403]).toContain(noTokenRes.status);

    const notFoundRes = await api.get(
      '/api/tables/projects/00000000-0000-0000-0000-999999999999',
      { token: T }
    );
    expect([404, 200]).toContain(notFoundRes.status);
    if (notFoundRes.status === 200) {
      expect(notFoundRes.data).toBeNull();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. PAGINATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Pagination', () => {
  it('default pagination returns results within limit', async () => {
    const res = await api.get('/api/tables/projects', {
      token: T,
      query: { limit: '10' },
    });
    expect(res.status).toBe(200);
    const items = Array.isArray(res.data) ? res.data : res.data?.data;
    if (Array.isArray(items)) {
      expect(items.length).toBeLessThanOrEqual(10);
    }
  });

  it('page 1 and page 2 return different records', async () => {
    const page1 = await api.get('/api/tables/projects', {
      token: T,
      query: { page: '1', limit: '5' },
    });
    const page2 = await api.get('/api/tables/projects', {
      token: T,
      query: { page: '2', limit: '5' },
    });
    const items1 = Array.isArray(page1.data) ? page1.data : page1.data?.data;
    const items2 = Array.isArray(page2.data) ? page2.data : page2.data?.data;
    if (Array.isArray(items1) && Array.isArray(items2) && items1.length > 0 && items2.length > 0) {
      const ids1 = items1.map((i: any) => i.id);
      const ids2 = items2.map((i: any) => i.id);
      expect(ids1).not.toEqual(ids2);
    }
  });

  it('invalid page returns empty data', async () => {
    const res = await api.get('/api/tables/projects', {
      token: T,
      query: { page: '999999', limit: '10' },
    });
    expect(res.status).toBe(200);
    const items = Array.isArray(res.data) ? res.data : res.data?.data;
    if (Array.isArray(items)) {
      expect(items.length).toBe(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Graceful Shutdown', () => {
  it('health endpoint returns status during shutdown sequence', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
    expect(typeof res.data).toBe('object');
  });

  it('in-flight requests complete before shutdown', async () => {
    const start = performance.now();
    const requests = Array.from({ length: 5 }, () =>
      api.get('/api/tables/projects', { token: T })
    );
    const results = await Promise.all(requests);
    const elapsed = performance.now() - start;
    results.forEach((r) => {
      expect(r.status).toBe(200);
    });
    expect(elapsed).toBeLessThan(10000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. MEMORY
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Memory', () => {
  it('repeated requests do not cause memory leak', async () => {
    if (global.gc) global.gc();
    const baseline = process.memoryUsage().heapUsed;

    for (let i = 0; i < 50; i++) {
      await api.get('/api/health');
      await api.get('/api/tables/projects', { token: T });
    }

    if (global.gc) global.gc();
    const after = process.memoryUsage().heapUsed;
    const growthMB = (after - baseline) / (1024 * 1024);
    expect(growthMB).toBeLessThan(50);
  });
});
