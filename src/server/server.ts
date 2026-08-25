/**
 * NexoraOS™ — Complete Server Integration
 * Assembles all engines, middleware, routes, and startup logic
 * Production-grade with structured logging, health monitoring, caching, validation,
 * circuit breakers, query monitoring, security hardening, and resilience patterns
 */

import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

// ─── Express Request Augmentation ───────────────────────
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// ─── Core Modules ──────────────────────────────────────
import { loadConfig } from './config/env';
import { getPool } from './core/database';
import { errorHandler, notFoundHandler, requestIdMiddleware } from './core/errors';
import { requestLogger as structuredLogger, logger } from './core/logger';
import { initHealthMonitor, requestMetrics } from './core/healthMonitor';
import { cache } from './core/cache';
import { seedDatabase } from './core/dbOptimization';
import { scheduler, registerDefaultJobs } from './core/scheduler';
import { webhookService } from './core/webhooks';
import { securityMiddleware, ipBlocklistMiddleware } from './core/security';
import { dbCircuitBreaker, dbBulkhead } from './core/resilience';
import { initPoolOptimizer, queryMonitor } from './core/queryMonitor';
import { createRateLimiter } from './middleware/rateLimit';
import { metricsMiddleware } from './middleware/metrics.middleware';
import { cacheMiddleware } from './middleware/cache.middleware';
import { requestLogger as detailedRequestLogger } from './middleware/requestLogger';
import { timeoutMiddleware } from './middleware/timeout';
import { tracingMiddleware } from './middleware/tracing';
import { smartCompression } from './middleware/compression';
import { deduplicationMiddleware } from './middleware/dedup';

import { apiCache as advancedApiCache, queryCache, sessionCache } from './core/cacheManager';

// ─── V2 Routes ─────────────────────────────────────────
import v2Router from './routes/v2/index';
import healthRouter from './routes/v2/health.routes';
import docsRouter from './routes/v2/docs.routes';
import { exportPDF, exportExcel } from './middleware/export';

// ─── V1 Routes (Legacy) ────────────────────────────────
import { financeRouter } from './routes/finance.routes';
import { healthRouter as v1HealthRouter } from './routes/health.routes';
import { masterOperationsRouter } from './routes/operations_master.routes';
import { salesRouter } from './routes/sales.routes';
import { fundingRouter } from './routes/funding.routes';
import { operationalDomainRouter } from './routes/operational_domains.routes';

// ─── Load Configuration ────────────────────────────────

const config = loadConfig();

// ─── Create Rate Limiters using config values ─────────────────
const createLimiter = (max: number, message: string, pathPrefix: string) =>
  createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max,
    message,
    keyPrefix: `rl:${pathPrefix}`,
  });

const authLimiter = createLimiter(
  config.rateLimit.auth,
  'Too many authentication attempts. Please wait 15 minutes.',
  'auth'
);

const apiReadLimiter = createLimiter(
  config.rateLimit.api,
  'API read rate limit exceeded.',
  'read'
);

const apiWriteLimiter = createLimiter(
  config.rateLimit.api,
  'API write rate limit exceeded. Max writes per 15 minutes.',
  'write'
);

const sensitiveOpsLimiter = createLimiter(
  config.rateLimit.export,
  'Sensitive operation rate limit exceeded.',
  'sensitive'
);

const aiLimiter = createLimiter(
  config.rateLimit.general,
  'AI request rate limit exceeded. Max per minute.',
  'ai'
);

// ─── Create Express App ────────────────────────────────

const app = express();

// ─── Global Middleware ─────────────────────────────────

// Request ID tracking
app.use(requestIdMiddleware);

// Distributed tracing with correlation IDs
app.use(tracingMiddleware);

// IP blocklist check
app.use(ipBlocklistMiddleware());

// Security hardening (input sanitization, SQL injection detection, XSS prevention)
app.use(securityMiddleware());

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://maps.googleapis.com"],
      connectSrc: ["'self'", "https://*.neon.tech", "https://maps.googleapis.com", "https://*.googleapis.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'sameorigin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// Compression (gzip/deflate)
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// Smart API response compression (Brotli/Gzip negotiation for JSON payloads)
app.use(smartCompression({ threshold: 1024, level: 6, brotli: true }));

// Request timeout (30s default)
app.use(timeoutMiddleware(30000));

// Detailed request logging
app.use(detailedRequestLogger);

// CORS
// Support light/dark mode toggling via Tailwind dark: variant; origins are
// required from config – no wildcard allow in any environment.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.cors.origins.includes(origin)) {
      callback(null, true);
    } else {
      const devMessage = config.env !== 'production'
        ? 'CORS origin not allowed in development. Set CORS_ORIGINS env variable.'
        : 'CORS origin not allowed';
      logger.warn(`[CORS] ${devMessage}: ${origin}`);
      callback(new Error(devMessage));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Organization-Id', 'X-CSRF-Token'],
  maxAge: 86400,
}));

// Structured HTTP logging
app.use(structuredLogger);

// Lightweight request metrics (counts, latency, active connections)
app.use(metricsMiddleware);

// Request metrics collection (endpoint-level tracking)
app.use((req: any, res: any, next: any) => {
  const start = Date.now();
  res.on('finish', () => {
    requestMetrics.record(req.method, req.path, res.statusCode, Date.now() - start);
  });
  next();
});

// Request deduplication (deduplicates concurrent identical GET requests)
app.use(deduplicationMiddleware({ windowMs: 1000, maxAge: 5000 }));

// Body parsing with size limits
app.use(express.json({ limit: '5mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '5mb', parameterLimit: 100 }));

// Static files with caching
app.use(express.static(path.join(process.cwd(), 'public'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) res.setHeader('Cache-Control', 'public, max-age=604800');
  },
}));

// ─── Global Rate Limiters ──────────────────────────────

app.use('/api/auth', authLimiter);
app.use('/api/v2/auth', authLimiter);
app.use('/api/gemini', aiLimiter);
app.use('/api/v2/domains/ai', aiLimiter);
app.use('/api/backup', sensitiveOpsLimiter);
app.use('/api/restore', sensitiveOpsLimiter);
app.use('/api/bulk', sensitiveOpsLimiter);

// ─── API Routes ────────────────────────────────────────

// Apply cache to GET routes:
app.use('/api/v2', cacheMiddleware({ ttl: 30 }));

// V2 API (Engine-Based - Recommended)
app.use('/api/v2', v2Router);

// Backward-compatible: mount V2 auth routes also at /api/auth
app.use('/api', v2Router);

// V2 Health
app.use('/api/v2/health', healthRouter);

// V2 Docs
app.use('/api/v2/docs', docsRouter);

// V2 Export
app.get('/api/v2/export/:reportType/pdf', exportPDF);
app.get('/api/v2/export/:reportType/excel', exportExcel);

// Comprehensive metrics endpoint
app.get('/api/v2/metrics', (req, res) => {
  const pool = getPool();
  res.json({
    requests: {
      total: requestMetrics.getTotalRequests(),
      avgResponseTime: requestMetrics.getAverageResponseTime(),
      errorRate: requestMetrics.getErrorRate(),
      topEndpoints: requestMetrics.getTopEndpoints(20),
    },
    cache: cache.getStats(),
    database: {
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
      queries: queryMonitor.getStats(),
    },
    circuitBreakers: {
      database: dbCircuitBreaker.getStats(),
    },
    timestamp: new Date().toISOString(),
  });
});

// V1 Legacy Routes (for backward compatibility)
app.use('/api/finance', financeRouter);
app.use('/api/health', v1HealthRouter);
app.use('/api/operations', masterOperationsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/funding', fundingRouter);
app.use('/api/operational', operationalDomainRouter);

// ─── SPA Fallback ──────────────────────────────────────

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// ─── Error Handling ────────────────────────────────────

// Catch JSON parse errors and payload size errors before the main error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.id || req.headers['x-request-id'] || 'unknown';

  if (err.name === 'SyntaxError' && 'body' in err) {
    logger.error('Invalid JSON payload', { requestId: String(requestId), meta: { path: req.path }, error: { name: err.name, message: err.message } });
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload',
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === 'PayloadTooLargeError' || err.status === 413) {
    logger.error('Request payload too large', { requestId: String(requestId), meta: { path: req.path }, error: { name: err.name, message: err.message } });
    return res.status(413).json({
      success: false,
      error: 'Request payload too large',
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  next(err);
});

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server Startup ────────────────────────────────────

let server: any;

export async function startServer() {
  try {
    const startTime = Date.now();
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('  NexoraOS™ Intelligent Enterprise Operating System');
    logger.info('  Version 2.2.0 — Production Engine (Full Stack + Resilience)');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`  Environment: ${config.env.toUpperCase()}`);
    logger.info(`  Port: ${config.port}`);
    logger.info(`  Database: ${config.database.host}:${config.database.port}/${config.database.name}`);

    // 1. Verify database connection (with circuit breaker)
    logger.info('[1/7] Verifying database connection...');
    const pool = getPool();
    await dbCircuitBreaker.execute(async () => {
      await dbBulkhead.execute(async () => {
        await pool.query('SELECT 1 as ping');
      });
    });
    logger.info('  ✓ Database connected (circuit breaker + bulkhead active)');

    // 2. Initialize pool optimizer
    logger.info('[2/7] Initializing pool optimizer...');
    initPoolOptimizer(pool);
    logger.info('  ✓ Pool optimizer started');

    // 3. Run schema migrations
    logger.info('[3/7] Running schema migrations...');
    try {
      const { runInitialSchema } = await import('./database/initial_schema');
      await runInitialSchema(pool);
      logger.info('  ✓ Initial schema completed');
    } catch (err: any) {
      logger.warn(`  ⚠ Initial schema warning: ${err.message}`);
    }
    try {
      const { runEnterpriseSchemaCompletion } = await import('./database/enterprise_schema_completion');
      await runEnterpriseSchemaCompletion(pool);
      logger.info('  ✓ Enterprise schema completed');
    } catch (err: any) {
      logger.warn(`  ⚠ Enterprise schema warning: ${err.message}`);
    }
    try {
      const { applyEnterpriseIndexes } = await import('./database/enterprise_schema_completion');
      await applyEnterpriseIndexes(pool);
      logger.info('  ✓ Enterprise indexes applied');
    } catch (err: any) {
      logger.warn(`  ⚠ Enterprise indexes warning: ${err.message}`);
    }

    // 4. Seed default data (first run)
    logger.info('[4/7] Seeding default data...');
    try {
      await seedDatabase(pool);
      logger.info('  ✓ Database seeded');
    } catch (err: any) {
      logger.warn(`  ⚠ Seed warning: ${err.message}`);
    }

    // 5. Initialize health monitor
    logger.info('[5/7] Initializing health monitor...');
    initHealthMonitor(pool);
    logger.info('  ✓ Health monitor ready');

    // 6. Register scheduled jobs
    logger.info('[6/7] Registering scheduled jobs...');
    registerDefaultJobs();
    scheduler.start();
    logger.info('  ✓ Scheduler started');

    // 7. Start HTTP server
    logger.info('[7/7] Starting HTTP server...');
    server = app.listen(config.port, () => {
      logger.info(`  ✓ Server listening on port ${config.port}`);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { error: reason as any });
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { error: err });
      gracefulShutdown('uncaughtException');
    });

    const bootTime = Date.now() - startTime;
    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('  NexoraOS™ is READY');
    logger.info(`  Boot time: ${bootTime}ms`);
    logger.info(`  API v2:     http://localhost:${config.port}/api/v2`);
    logger.info(`  Docs:       http://localhost:${config.port}/api/v2/docs`);
    logger.info(`  Health:     http://localhost:${config.port}/api/v2/health/readiness`);
    logger.info(`  Metrics:    http://localhost:${config.port}/api/v2/metrics`);
    logger.info('═══════════════════════════════════════════════════════════');

    return { app, server };
  } catch (err: any) {
    logger.error('STARTUP FAILURE', { error: err });
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      cache.destroy();
      advancedApiCache.destroy();
      queryCache.destroy();
      sessionCache.destroy();
      scheduler.stop();
    } catch (error) {
      logger.error('Error cleaning up services', { error: { name: (error as Error).name, message: (error as Error).message } });
    }

    try {
      await getPool().end();
      logger.info('Database pool closed');
    } catch (error) {
      logger.error('Error closing database pool', { error: { name: (error as Error).name, message: (error as Error).message } });
    }

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

export { app, config };
