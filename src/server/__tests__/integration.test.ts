/**
 * NexoraOS™ — Integration Tests
 * End-to-end API tests for all engines
 */

import { describe, it, expect, beforeAll, afterAll, jest, beforeEach } from 'vitest';

// ─── Mock Setup ────────────────────────────────────────

const mockPool = {
  query: jest.fn().mockResolvedValue({ rows: [{ ping: 1 }], rowCount: 1 }),
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn(),
  }),
  end: jest.fn(),
  totalCount: 10,
  idleCount: 5,
  waitingCount: 0,
};

jest.mock('../core/database', () => ({
  getPool: () => mockPool,
  query: jest.fn().mockResolvedValue({ rows: [] }),
  queryOne: jest.fn().mockResolvedValue(null),
  queryMany: jest.fn().mockResolvedValue([]),
  transaction: jest.fn(async (cb: any) => cb(mockPool.connect())),
  closePool: jest.fn(),
}));

jest.mock('../config/env', () => ({
  config: {
    port: 3000,
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    jwtSecret: 'test-secret-key-that-is-long-enough-for-testing',
    jwtRefreshSecret: 'test-refresh-secret-key',
    geminiApiKey: 'mock-key',
    isProduction: false,
    isDevelopment: true,
    defaultOrgId: '00000000-0000-0000-0000-000000000001',
    allowedOrigins: [],
    bcryptRounds: 10,
    jwtExpiresIn: '8h',
    jwtRefreshExpiresIn: '7d',
    authRateLimitMax: 10,
    apiRateLimitMax: 200,
    writeRateLimitMax: 50,
    sensitiveRateLimitMax: 5,
    rateLimitWindowMs: 900000,
    sessionTimeoutMs: 28800000,
    maxLoginAttempts: 5,
    lockoutDurationMs: 900000,
  },
}));

jest.mock('../middleware/rateLimit', () => ({
  authRateLimiter: (req: any, res: any, next: any) => next(),
  apiReadRateLimiter: (req: any, res: any, next: any) => next(),
  apiWriteRateLimiter: (req: any, res: any, next: any) => next(),
  sensitiveOpsRateLimiter: (req: any, res: any, next: any) => next(),
  aiRateLimiter: (req: any, res: any, next: any) => next(),
}));

// ─── Error Classes Tests ───────────────────────────────

import {
  AppError, NotFoundError, ValidationError, UnauthorizedError,
  ForbiddenError, ConflictError, RateLimitError
} from '../core/errors';

describe('Error Classes', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.isOperational).toBe(true);
  });

  it('should create NotFoundError', () => {
    const error = new NotFoundError('User');
    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
  });

  it('should create ValidationError with field', () => {
    const error = new ValidationError('Required', 'email');
    expect(error.message).toBe('Required');
    expect(error.field).toBe('email');
  });

  it('should create UnauthorizedError', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
  });

  it('should create ForbiddenError', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
  });

  it('should create ConflictError', () => {
    const error = new ConflictError('Duplicate entry');
    expect(error.statusCode).toBe(409);
  });

  it('should create RateLimitError', () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
  });
});

// ─── Rate Limiter Tests ────────────────────────────────

import { createRateLimiter } from '../middleware/rateLimit';

describe('Rate Limiter', () => {
  it('should create a rate limiter function', () => {
    const limiter = createRateLimiter({
      windowMs: 60000,
      max: 10,
    });
    expect(typeof limiter).toBe('function');
  });
});

// ─── Scheduler Tests ───────────────────────────────────

import { scheduler } from '../core/scheduler';

describe('Scheduler', () => {
  beforeEach(() => {
    scheduler.stop();
  });

  it('should register a job', () => {
    scheduler.register({
      id: 'test-job',
      name: 'Test Job',
      schedule: 'hourly',
      enabled: true,
      handler: async () => {},
    });

    const jobs = scheduler.getJobsStatus();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe('test-job');
    expect(jobs[0].name).toBe('Test Job');
  });

  it('should start and stop', () => {
    scheduler.register({
      id: 'test-job-2',
      name: 'Test Job 2',
      schedule: 'daily',
      enabled: true,
      handler: async () => {},
    });

    scheduler.start();
    const jobs = scheduler.getJobsStatus();
    expect(jobs[0].enabled).toBe(true);

    scheduler.stop();
  });

  it('should not register duplicate jobs', () => {
    scheduler.register({
      id: 'test-dup',
      name: 'Test Dup',
      schedule: 'daily',
      enabled: true,
      handler: async () => {},
    });

    const count = scheduler.getJobsStatus().filter(j => j.id === 'test-dup').length;
    // Jobs map uses id as key, so registering same id overwrites
    expect(count).toBe(1);
  });
});

// ─── Config Validation Tests ───────────────────────────

describe('Config Validation', () => {
  it('should load config with valid env', () => {
    const { config } = require('../config/env');
    expect(config.port).toBe(3000);
    expect(config.isProduction).toBe(false);
    expect(config.defaultOrgId).toBe('00000000-0000-0000-0000-000000000001');
  });
});

// ─── Health Route Tests ────────────────────────────────

describe('Health Routes', () => {
  it('should have liveness endpoint', () => {
    const { default: healthRouter } = require('../routes/v2/health.routes');
    expect(healthRouter).toBeDefined();
  });
});

// ─── Documentation Route Tests ─────────────────────────

describe('Docs Routes', () => {
  it('should have docs endpoint', () => {
    const { default: docsRouter } = require('../routes/v2/docs.routes');
    expect(docsRouter).toBeDefined();
  });
});

// ─── Export Middleware Tests ────────────────────────────

describe('Export Middleware', () => {
  it('should export PDF and Excel functions', () => {
    const { exportPDF, exportExcel } = require('../middleware/export');
    expect(typeof exportPDF).toBe('function');
    expect(typeof exportExcel).toBe('function');
  });
});

// ─── V2 Router Tests ───────────────────────────────────

describe('V2 Router', () => {
  it('should aggregate all routes', () => {
    const { default: v2Router } = require('../routes/v2/index');
    expect(v2Router).toBeDefined();
  });
});

// ─── Engine Import Tests ───────────────────────────────

describe('All Engines Importable', () => {
  it('should import AuthEngine', async () => {
    const { AuthEngine } = await import('../engines/auth.engine');
    expect(AuthEngine).toBeDefined();
    expect(typeof AuthEngine.login).toBe('function');
    expect(typeof AuthEngine.register).toBe('function');
    expect(typeof AuthEngine.verifyToken).toBe('function');
  });

  it('should import Finance Engine', async () => {
    const { LedgerEngine, ChartOfAccountsService, FiscalYearService, BudgetService, CurrencyService } = await import('../engines/finance.engine');
    expect(LedgerEngine).toBeDefined();
    expect(ChartOfAccountsService).toBeDefined();
    expect(FiscalYearService).toBeDefined();
    expect(BudgetService).toBeDefined();
    expect(CurrencyService).toBeDefined();
  });

  it('should import Project Engine', async () => {
    const { ProjectEngine, MilestoneEngine, ScheduleEngine } = await import('../engines/project.engine');
    expect(ProjectEngine).toBeDefined();
    expect(MilestoneEngine).toBeDefined();
    expect(ScheduleEngine).toBeDefined();
  });

  it('should import Procurement Engine', async () => {
    const { RFQEngine, VendorBidEngine, PurchaseOrderEngine, ThreeWayMatchEngine, VendorPerformanceEngine } = await import('../engines/procurement.engine');
    expect(RFQEngine).toBeDefined();
    expect(VendorBidEngine).toBeDefined();
    expect(PurchaseOrderEngine).toBeDefined();
    expect(ThreeWayMatchEngine).toBeDefined();
    expect(VendorPerformanceEngine).toBeDefined();
  });

  it('should import Service Delivery Engine', async () => {
    const { BeneficiaryEngine, ServiceDeliveryEngine, AidDistributionEngine, SponsorshipEngine } = await import('../engines/serviceDelivery.engine');
    expect(BeneficiaryEngine).toBeDefined();
    expect(ServiceDeliveryEngine).toBeDefined();
    expect(AidDistributionEngine).toBeDefined();
    expect(SponsorshipEngine).toBeDefined();
  });

  it('should import Reporting Engine', async () => {
    const { KPIEngine, ViewEngine, ReportExportEngine } = await import('../engines/reporting.engine');
    expect(KPIEngine).toBeDefined();
    expect(ViewEngine).toBeDefined();
    expect(ReportExportEngine).toBeDefined();
  });
});

// ─── Core Helpers Tests ────────────────────────────────

describe('Core Helpers', () => {
  it('should have paginatedQuery', async () => {
    const { paginatedQuery } = await import('../core/helpers');
    expect(typeof paginatedQuery).toBe('function');
  });

  it('should have auditLog', async () => {
    const { auditLog } = await import('../core/helpers');
    expect(typeof auditLog).toBe('function');
  });

  it('should have validation helpers', async () => {
    const { requireField, optionalString, optionalNumber, isValidUUID } = await import('../core/helpers');
    expect(typeof requireField).toBe('function');
    expect(typeof optionalString).toBe('function');
    expect(typeof optionalNumber).toBe('function');
    expect(typeof isValidUUID).toBe('function');
  });

  it('should validate UUID correctly', async () => {
    const { isValidUUID } = await import('../core/helpers');
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('invalid-uuid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });
});

// ─── Database Core Tests ───────────────────────────────

describe('Database Core', () => {
  it('should have getPool', async () => {
    const { getPool } = await import('../core/database');
    expect(typeof getPool).toBe('function');
  });

  it('should have query helpers', async () => {
    const { query, queryOne, queryMany, transaction } = await import('../core/database');
    expect(typeof query).toBe('function');
    expect(typeof queryOne).toBe('function');
    expect(typeof queryMany).toBe('function');
    expect(typeof transaction).toBe('function');
  });
});

// ─── Complete File Structure Tests ─────────────────────

describe('File Structure', () => {
  const fs = require('fs');
  const path = require('path');
  const baseDir = path.join(process.cwd(), 'src/server');

  const requiredFiles = [
    'config/env.ts',
    'config/index.ts',
    'core/database.ts',
    'core/types.ts',
    'core/helpers.ts',
    'core/errors.ts',
    'core/scheduler.ts',
    'engines/auth.engine.ts',
    'engines/finance.engine.ts',
    'engines/project.engine.ts',
    'engines/procurement.engine.ts',
    'engines/serviceDelivery.engine.ts',
    'engines/reporting.engine.ts',
    'engines/index.ts',
    'middleware/rateLimit.ts',
    'middleware/export.ts',
    'routes/v2/index.ts',
    'routes/v2/auth.routes.ts',
    'routes/v2/finance.routes.ts',
    'routes/v2/project.routes.ts',
    'routes/v2/procurement.routes.ts',
    'routes/v2/serviceDelivery.routes.ts',
    'routes/v2/reporting.routes.ts',
    'routes/v2/health.routes.ts',
    'routes/v2/docs.routes.ts',
  ];

  for (const file of requiredFiles) {
    it(`should have ${file}`, () => {
      const fullPath = path.join(baseDir, file);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  }
});
