/**
 * NexoraOS™ — Complete Server Integration
 * Assembles all engines, middleware, routes, and startup logic
 * Production-grade with structured logging, health monitoring, caching, validation,
 * circuit breakers, query monitoring, security hardening, and resilience patterns
 */

import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

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
import {
  authRateLimiter,
  apiReadRateLimiter,
  apiWriteRateLimiter,
  sensitiveOpsRateLimiter,
  aiRateLimiter,
} from './middleware/rateLimit';

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

// ─── Create Express App ────────────────────────────────

const app = express();

// ─── Global Middleware ─────────────────────────────────

// Request ID tracking
app.use(requestIdMiddleware);

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

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.cors.origins.length === 0 && config.env !== 'production') {
      return callback(null, true);
    }
    if (config.cors.origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Organization-Id', 'X-CSRF-Token'],
  maxAge: 86400,
}));

// Structured HTTP logging
app.use(structuredLogger);

// Request metrics collection
app.use((req: any, res: any, next: any) => {
  const start = Date.now();
  res.on('finish', () => {
    requestMetrics.record(req.method, req.path, res.statusCode, Date.now() - start);
  });
  next();
});

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

app.use('/api/auth', authRateLimiter);
app.use('/api/v2/auth', authRateLimiter);
app.use('/api/gemini', aiRateLimiter);
app.use('/api/v2/domains/ai', aiRateLimiter);
app.use('/api/backup', sensitiveOpsRateLimiter);
app.use('/api/restore', sensitiveOpsRateLimiter);
app.use('/api/bulk', sensitiveOpsRateLimiter);

// ─── API Routes ────────────────────────────────────────

// V2 API (Engine-Based - Recommended)
app.use('/api/v2', v2Router);

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

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server Startup ────────────────────────────────────

let server: any;

export async function startServer() {
  try {
    const startTime = Date.now();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  NexoraOS™ Intelligent Enterprise Operating System');
    console.log('  Version 2.2.0 — Production Engine (Full Stack + Resilience)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Environment: ${config.env.toUpperCase()}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  Database: ${config.database.host}:${config.database.port}/${config.database.name}`);

    // 1. Verify database connection (with circuit breaker)
    console.log('\n[1/7] Verifying database connection...');
    const pool = getPool();
    await dbCircuitBreaker.execute(async () => {
      await dbBulkhead.execute(async () => {
        await pool.query('SELECT 1 as ping');
      });
    });
    console.log('  ✓ Database connected (circuit breaker + bulkhead active)');

    // 2. Initialize pool optimizer
    console.log('\n[2/7] Initializing pool optimizer...');
    initPoolOptimizer(pool);
    console.log('  ✓ Pool optimizer started');

    // 3. Run schema migrations
    console.log('\n[3/7] Running schema migrations...');
    try {
      const { runInitialSchema } = await import('./database/initial_schema');
      await runInitialSchema(pool);
      console.log('  ✓ Initial schema completed');
    } catch (err: any) {
      console.warn('  ⚠ Initial schema warning:', err.message);
    }
    try {
      const { runEnterpriseSchemaCompletion } = await import('./database/enterprise_schema_completion');
      await runEnterpriseSchemaCompletion(pool);
      console.log('  ✓ Enterprise schema completed');
    } catch (err: any) {
      console.warn('  ⚠ Enterprise schema warning:', err.message);
    }

    // 4. Seed default data (first run)
    console.log('\n[4/7] Seeding default data...');
    try {
      await seedDatabase(pool);
      console.log('  ✓ Database seeded');
    } catch (err: any) {
      console.warn('  ⚠ Seed warning:', err.message);
    }

    // 5. Initialize health monitor
    console.log('\n[5/7] Initializing health monitor...');
    initHealthMonitor(pool);
    console.log('  ✓ Health monitor ready');

    // 6. Register scheduled jobs
    console.log('\n[6/7] Registering scheduled jobs...');
    registerDefaultJobs();
    scheduler.start();
    console.log('  ✓ Scheduler started');

    // 7. Start HTTP server
    console.log('\n[7/7] Starting HTTP server...');
    server = app.listen(config.port, () => {
      console.log(`  ✓ Server listening on port ${config.port}`);
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
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  NexoraOS™ is READY');
    console.log(`  Boot time: ${bootTime}ms`);
    console.log(`  API v2:     http://localhost:${config.port}/api/v2`);
    console.log(`  Docs:       http://localhost:${config.port}/api/v2/docs`);
    console.log(`  Health:     http://localhost:${config.port}/api/v2/health/readiness`);
    console.log(`  Metrics:    http://localhost:${config.port}/api/v2/metrics`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return { app, server };
  } catch (err: any) {
    logger.error('STARTUP FAILURE', { error: err });
    process.exit(1);
  }
}

function gracefulShutdown(signal: string) {
  logger.info(`Graceful shutdown initiated: ${signal}`);
  if (server) {
    server.close(() => {
      cache.destroy();
      scheduler.stop();
      getPool().end().then(() => {
        logger.info('Database pool closed');
        process.exit(0);
      });
    });
    setTimeout(() => { process.exit(1); }, 30000);
  }
}

export { app, config };
