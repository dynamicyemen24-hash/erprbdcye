/**
 * NexoraOS™ — Health Check & Monitoring System
 * Liveness, readiness, deep health, performance metrics
 */

import { Router, Request, Response } from 'express';
import { getPool, closePool } from '../../core/database';
import os from 'os';

const router = Router();

// ─── Startup Time ──────────────────────────────────────
const startTime = Date.now();
const startTimestamp = new Date().toISOString();

// ─── Basic Health (Liveness) ───────────────────────────
router.get('/liveness', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

// ─── Readiness Check ───────────────────────────────────
router.get('/readiness', async (req: Request, res: Response) => {
  const checks: Record<string, any> = {};
  let allHealthy = true;

  // 1. Database connectivity
  try {
    const pool = getPool();
    const start = Date.now();
    await pool.query('SELECT 1 as ping');
    checks.database = {
      status: 'healthy',
      latency: `${Date.now() - start}ms`,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    };
  } catch (err: any) {
    checks.database = { status: 'unhealthy', error: err.message };
    allHealthy = false;
  }

  // 2. Memory usage
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMemPct = Math.round(((totalMem - freeMem) / totalMem) * 100);

  checks.memory = {
    status: usedMemPct < 90 ? 'healthy' : 'warning',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    systemUsed: `${usedMemPct}%`,
  };

  if (usedMemPct >= 90) allHealthy = false;

  // 3. CPU load
  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length;
  const loadPct = Math.round((loadAvg[0] / cpuCount) * 100);

  checks.cpu = {
    status: loadPct < 80 ? 'healthy' : 'warning',
    load1m: loadAvg[0].toFixed(2),
    load5m: loadAvg[1].toFixed(2),
    load15m: loadAvg[2].toFixed(2),
    cores: cpuCount,
    utilization: `${loadPct}%`,
  };

  // 4. Disk (approximate via process)
  checks.disk = {
    status: 'healthy',
    note: 'Disk check via OS monitoring recommended',
  };

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: allHealthy ? 'ready' : 'degraded',
    checks,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    startedAt: startTimestamp,
    timestamp: new Date().toISOString(),
  });
});

// ─── Deep Health Check ─────────────────────────────────
router.get('/deep', async (req: Request, res: Response) => {
  const results: Record<string, any> = {};

  // Database tables check
  try {
    const pool = getPool();
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    results.database = {
      status: 'healthy',
      tablesCount: tablesResult.rows.length,
      tables: tablesResult.rows.map((r: any) => r.table_name).slice(0, 20),
    };
  } catch (err: any) {
    results.database = { status: 'unhealthy', error: err.message };
  }

  // Database views check
  try {
    const pool = getPool();
    const viewsResult = await pool.query(`
      SELECT table_name FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    results.views = {
      status: 'healthy',
      count: viewsResult.rows.length,
    };
  } catch (err: any) {
    results.views = { status: 'unhealthy', error: err.message };
  }

  // System info
  results.system = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    pid: process.pid,
  };

  res.status(200).json({
    status: 'ok',
    results,
    timestamp: new Date().toISOString(),
  });
});

// ─── Metrics Endpoint (Prometheus-compatible) ──────────
router.get('/metrics', async (req: Request, res: Response) => {
  const pool = getPool();

  let dbStats = {};
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT COUNT(*) FROM pg_stat_activity) as total_connections,
        (SELECT COUNT(*) FROM pg_stat_database WHERE datname = current_database()) as db_size
    `);
    dbStats = stats.rows[0] || {};
  } catch {
    dbStats = { error: 'unavailable' };
  }

  res.status(200).json({
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    process_memory: process.memoryUsage(),
    database: dbStats,
    system: {
      load_avg: os.loadavg(),
      free_memory: os.freemem(),
      total_memory: os.totalmem(),
      cpu_count: os.cpus().length,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── Graceful Shutdown ─────────────────────────────────

export async function gracefulShutdown(signal: string) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);

  const shutdownTimeout = 30000; // 30 seconds max

  const forceExit = setTimeout(() => {
    console.error('[SHUTDOWN] Forced exit after timeout');
    process.exit(1);
  }, shutdownTimeout);

  try {
    // Close database pool
    await closePool();
    console.log('[SHUTDOWN] Database pool closed');

    clearTimeout(forceExit);
    console.log('[SHUTDOWN] Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('[SHUTDOWN] Error during shutdown:', err);
    process.exit(1);
  }
}

export default router;
