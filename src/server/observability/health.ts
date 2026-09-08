/**
 * NexoraOS™ — World-Class Health Check System
 * Kubernetes-ready liveness/readiness/startup probes.
 * Includes DB, Redis, memory, CPU, and dependency checks.
 */

import { Request, Response } from 'express';
import { register } from './metrics';
import os from 'os';

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  message?: string;
}

/**
 * Check PostgreSQL database connectivity and response time.
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const { getPool } = await import('../core/database');
    const pool = getPool();
    const result = await pool.query('SELECT 1 AS ok, NOW() AS server_time');
    const latency = Date.now() - start;

    return {
      status: latency > 5000 ? 'degraded' : 'healthy',
      latency_ms: latency,
      message: `Connected (server time: ${result.rows[0].server_time})`,
    };
  } catch (err: any) {
    return {
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      message: err.message || 'Database connection failed',
    };
  }
}

/**
 * Check Redis connectivity and response time.
 */
async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const { isRedisReady, healthCheck } = await import('../redis');
    if (!isRedisReady()) {
      return {
        status: 'degraded',
        latency_ms: 0,
        message: 'Redis not connected (using in-memory fallback)',
      };
    }
    const result = await healthCheck();
    const latency = Date.now() - start;

    return {
      status: result ? 'healthy' : 'unhealthy',
      latency_ms: latency,
      message: result ? 'Connected' : 'Health check failed',
    };
  } catch (err: any) {
    return {
      status: 'degraded',
      latency_ms: Date.now() - start,
      message: `Redis unavailable: ${err.message}`,
    };
  }
}

/**
 * Check system memory usage.
 */
function checkMemory(): ComponentHealth {
  const mem = process.memoryUsage();
  const heapPercent = mem.heapUsed / mem.heapTotal;
  const rssMb = Math.round(mem.rss / 1024 / 1024);
  const heapMb = Math.round(mem.heapUsed / 1024 / 1024);
  const totalMb = Math.round(mem.heapTotal / 1024 / 1024);

  return {
    status: heapPercent > 0.9 ? 'unhealthy' : heapPercent > 0.75 ? 'degraded' : 'healthy',
    latency_ms: 0,
    message: `${heapMb}/${totalMb}MB heap (${Math.round(heapPercent * 100)}%), RSS: ${rssMb}MB`,
  };
}

/**
 * Check system CPU load.
 */
function checkCPU(): ComponentHealth {
  const loadAvg = os.loadavg()[0];
  const cpuCount = os.cpus().length;
  const loadPercent = (loadAvg / cpuCount) * 100;

  return {
    status: loadPercent > 90 ? 'unhealthy' : loadPercent > 70 ? 'degraded' : 'healthy',
    latency_ms: 0,
    message: `Load: ${loadAvg.toFixed(2)} / ${cpuCount} cores (${Math.round(loadPercent)}%)`,
  };
}

/**
 * Run all health checks in parallel.
 */
async function runHealthChecks(): Promise<Record<string, ComponentHealth>> {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const memory = checkMemory();
  const cpu = checkCPU();

  return { database, redis, memory, cpu };
}

/**
 * Determine overall status from component checks.
 */
function overallStatus(checks: Record<string, ComponentHealth>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map(c => c.status);
  if (statuses.includes('unhealthy')) return 'unhealthy';
  if (statuses.includes('degraded')) return 'degraded';
  return 'healthy';
}

/**
 * Register all health check endpoints.
 */
export function healthRoutes(app: any) {
  // ─── Liveness Probe (Kubernetes) ──────────────────────────────
  // Always returns 200 if the process is alive — does NOT check dependencies.
  // Used by k8s to decide whether to restart the container.
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'alive',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      pid: process.pid,
    });
  });

  // ─── Readiness Probe (Kubernetes) ─────────────────────────────
  // Checks DB + Redis connectivity — returns 503 if not ready.
  // Used by k8s to decide whether to route traffic to this instance.
  app.get('/health/ready', async (req: Request, res: Response) => {
    const checks = await runHealthChecks();
    const status = overallStatus(checks);
    const statusCode = status === 'unhealthy' ? 503 : 200;

    res.status(statusCode).json({
      status,
      ready: status !== 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  // ─── Deep Health (Operations) ─────────────────────────────────
  // Full diagnostic info for ops dashboards and incident response.
  app.get('/health/deep', async (req: Request, res: Response) => {
    const checks = await runHealthChecks();
    const status = overallStatus(checks);
    const mem = process.memoryUsage();

    res.status(status === 'unhealthy' ? 503 : 200).json({
      status,
      version: process.env.npm_package_version || '3.8.0',
      build: process.env.BUILD_ID || 'unknown',
      uptime: Math.round(process.uptime()),
      uptime_human: formatUptime(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      instance: {
        id: `${os.hostname()}-${process.pid}`,
        hostname: os.hostname(),
        pid: process.pid,
        node_version: process.version,
      },
      checks,
      system: {
        memory: {
          heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
          rss_mb: Math.round(mem.rss / 1024 / 1024),
          external_mb: Math.round(mem.external / 1024 / 1024),
          array_buffers_mb: Math.round(mem.arrayBuffers / 1024 / 1024),
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model || 'unknown',
          load_avg: {
            '1m': os.loadavg()[0].toFixed(2),
            '5m': os.loadavg()[1].toFixed(2),
            '15m': os.loadavg()[2].toFixed(2),
          },
        },
        platform: os.platform(),
        arch: os.arch(),
        free_memory_mb: Math.round(os.freemem() / 1024 / 1024),
        total_memory_mb: Math.round(os.totalmem() / 1024 / 1024),
      },
    });
  });

  // ─── Startup Probe (Kubernetes) ───────────────────────────────
  // Returns 200 only when all dependencies are ready.
  // Used by k8s to decide when to start sending traffic.
  app.get('/health/startup', async (req: Request, res: Response) => {
    const checks = await runHealthChecks();
    const status = overallStatus(checks);

    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      started: status === 'healthy',
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  // ─── Prometheus Metrics ───────────────────────────────────────
  app.get('/metrics', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', register.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.end(await register.metrics());
  });

  // ─── CSP Violation Reports ────────────────────────────────────
  app.post('/api/security/csp-report', (req: Request, res: Response) => {
    console.error('[CSP VIOLATION]', JSON.stringify(req.body, null, 2));
    res.status(204).end();
  });

  // ─── HSTS Reports ─────────────────────────────────────────────
  app.post('/api/security/hsts-report', (req: Request, res: Response) => {
    console.error('[HSTS VIOLATION]', JSON.stringify(req.body, null, 2));
    res.status(204).end();
  });
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
