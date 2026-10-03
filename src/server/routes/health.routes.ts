import express from 'express';
import { getDatabasePool } from '../services/db.service';
import { IPSASFinanceService } from '../services/finance.service';

export const healthRouter = express.Router();

/**
 * Liveness — "is this process running?"
 *
 * Deliberately touches nothing external: no database, no cache, no filesystem.
 * A liveness probe that depends on a downstream service reports the downstream
 * as dead and gets the pod restarted, which turns a Neon hiccup into an outage
 * of the whole deployment. This endpoint answers only for the process itself,
 * so it stays 200 whenever the app is able to serve traffic at all.
 *
 * Cheap enough for a sub-second probe interval, and unauthenticated so an
 * orchestrator can reach it (server.ts exempts /api/health from auth).
 */
healthRouter.get('/liveness', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    service: 'nexoraos-erp',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness — "should this process receive traffic?"
 *
 * Unlike liveness this *does* check dependencies, but it reports 503 rather
 * than 500 and never throws: a partially available system should be reported,
 * not crashed. Each dependency is probed independently so one outage does not
 * mask the state of the others.
 *
 * `?deep=1` adds the database round-trip timing, which is too slow for a hot
 * readiness loop but invaluable during an incident.
 */
healthRouter.get('/readiness', async (_req, res) => {
  const checks: Record<string, { status: string; detail?: string; latencyMs?: number }> = {};

  // Redis is optional by design — the app degrades to in-memory rather than
  // failing — so it reports its state without failing readiness. `healthCheck`
  // is the module's own probe, reused rather than re-implemented.
  try {
    const { healthCheck } = await import('../redis/client');
    const result = await healthCheck();
    checks.cache = {
      status: result.status === 'ready' ? 'ready' : 'degraded',
      detail: result.status,
      latencyMs: result.latencyMs,
    };
  } catch (err: any) {
    checks.cache = { status: 'degraded', detail: err?.message ?? 'unavailable' };
  }

  if (_req.query.deep === '1') {
    try {
      const t0 = Date.now();
      const pool = getDatabasePool();
      await pool.query('SELECT 1');
      checks.database = { status: 'ready', latencyMs: Date.now() - t0 };
    } catch (err: any) {
      checks.database = { status: 'unavailable', detail: err?.message ?? 'query failed' };
    }
  }

  // Only a *required* dependency being down makes the process unready. Today the
  // database is reachable through the in-memory fallback, so it is not required.
  const requiredDown = Object.entries(checks)
    .filter(([name]) => name !== 'cache')
    .some(([, v]) => v.status === 'unavailable');

  res.status(requiredDown ? 503 : 200).json({
    status: requiredDown ? 'not_ready' : 'ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/deep', async (req, res) => {
  const startTime = Date.now();
  try {
    const pool = getDatabasePool();
    
    // Test DB query latency
    const dbStart = Date.now();
    const dbTest = await pool.query('SELECT NOW() as current_time, COUNT(*) as org_count FROM organizations;');
    const dbLatencyMs = Date.now() - dbStart;

    // Check key operational counts
    const [prjRes, benRes, sponsRes, txRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM projects'),
      pool.query('SELECT COUNT(*) FROM beneficiaries'),
      pool.query('SELECT COUNT(*) FROM sponsorships'),
      pool.query('SELECT COUNT(*) FROM transactions')
    ]);

    // Check financial balance
    const trial = await IPSASFinanceService.getTrialBalance();

    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    res.json({
      status: 'HEALTHY',
      system: 'NexoraOS™ Enterprise Architecture',
      organization: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      database: {
        status: 'CONNECTED',
        engine: 'Neon Serverless PostgreSQL 16+',
        latencyMs: dbLatencyMs,
        activeProjects: parseInt(prjRes.rows[0].count),
        registeredBeneficiaries: parseInt(benRes.rows[0].count),
        activeSponsorships: parseInt(sponsRes.rows[0].count),
        postedTransactions: parseInt(txRes.rows[0].count)
      },
      accounting: {
        standard: 'IPSAS Double-Entry',
        isBalanced: trial.summary.isBalanced,
        totalDebits: trial.summary.totalDebit,
        totalCredits: trial.summary.totalCredit,
        variance: trial.summary.variance
      },
      process: {
        uptimeSeconds: Math.floor(uptime),
        memoryRssMb: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        nodeVersion: process.version
      }
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'DEGRADED',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});
