/**
 * NexoraOS™ — Performance & Diagnostics API
 * Endpoints:
 *  - GET  /api/v2/performance/report    → cache + pool + slow query summary
 *  - POST /api/v2/performance/profile   → EXPLAIN ANALYZE a SQL (admin only)
 *  - POST /api/v2/performance/refresh   → refresh materialized views
 *  - POST /api/v2/performance/invalidate → invalidate cache by tags
 *  - GET  /api/v2/performance/slow-queries → top 20 slow queries from monitor
 */
import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import { CachedQuery, MaterializedViewReader, PerformanceHealth, QueryProfiler } from '../../core/performance';
import { queryMonitor } from '../../core/queryMonitor';
import { getPool } from '../../core/database';
import logger from '../../core/logger';

const router = Router();

router.use(authenticateToken);

// ─── 1. Full performance report (cache + pool + slow queries) ─────────
router.get('/report', async (req: Request, res: Response) => {
  try {
    const report = await PerformanceHealth.report();
    res.json({ status: 'ok', data: report });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to build performance report', message: err.message });
  }
});

// ─── 2. EXPLAIN ANALYZE a SQL (admin only) ────────────────────────────
router.post('/profile', requireRole('ADMIN', 'SECURITY_AUDITOR'), async (req: Request, res: Response) => {
  try {
    const { sql, params = [] } = req.body || {};
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'sql is required' });
    }
    if (/^\s*(insert|update|delete|drop|truncate|alter|create|grant|revoke)\b/i.test(sql)) {
      return res.status(400).json({ error: 'Only SELECT queries can be profiled' });
    }
    const result = await QueryProfiler.profile(req.body.label || 'manual', sql, params);
    res.json({ status: 'ok', data: result });
  } catch (err: any) {
    res.status(500).json({ error: 'Profile failed', message: err.message });
  }
});

// ─── 3. Refresh materialized views ────────────────────────────────────
router.post('/refresh', requireRole('ADMIN', 'FINANCE_MANAGER'), async (_req: Request, res: Response) => {
  try {
    await MaterializedViewReader.refreshAll();
    res.json({ status: 'ok', message: 'Materialized views refreshed' });
  } catch (err: any) {
    res.status(500).json({ error: 'Refresh failed', message: err.message });
  }
});

// ─── 4. Invalidate cache by tags ───────────────────────────────────────
router.post('/invalidate', async (req: Request, res: Response) => {
  try {
    const { tags } = req.body || {};
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: 'tags must be a non-empty array' });
    }
    const removed = CachedQuery.invalidateTags(tags);
    res.json({ status: 'ok', invalidated: removed });
  } catch (err: any) {
    res.status(500).json({ error: 'Invalidate failed', message: err.message });
  }
});

// ─── 5. Top slow queries (from in-memory monitor) ──────────────────────
router.get('/slow-queries', (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);
  const slow = queryMonitor.getSlowQueries(limit);
  const stats = queryMonitor.getStats();
  res.json({ status: 'ok', data: { slow, stats } });
});

// ─── 6. Pool stats + connection-level GUCs ─────────────────────────────
router.get('/pool', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    const gucs = await pool.query(`
      SELECT
        (SELECT setting FROM pg_settings WHERE name = 'statement_timeout') AS statement_timeout,
        (SELECT setting FROM pg_settings WHERE name = 'idle_in_transaction_session_timeout') AS idle_in_tx,
        (SELECT setting FROM pg_settings WHERE name = 'lock_timeout') AS lock_timeout,
        (SELECT setting FROM pg_settings WHERE name = 'random_page_cost') AS random_page_cost,
        (SELECT setting FROM pg_settings WHERE name = 'effective_cache_size') AS effective_cache_size,
        (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') AS total_indexes
    `);
    res.json({
      status: 'ok',
      data: {
        pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount, max: (pool.options as any).max },
        gucs: gucs.rows[0],
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Pool stats failed', message: err.message });
  }
});

export default router;
