/**
 * NexoraOS™ — Task Scheduler
 * Cron-like job scheduling for background tasks
 */

import logger from './logger';

// ─── Job Types ─────────────────────────────────────────

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string; // cron-like: 'daily', 'hourly', 'weekly', 'monthly', or custom interval ms
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'error';
  lastError?: string;
}

// ─── Scheduler Engine ──────────────────────────────────

class SchedulerEngine {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private running = false;

  /**
   * Register a scheduled job
   */
  register(job: Omit<ScheduledJob, 'status' | 'nextRun'>) {
    this.jobs.set(job.id, {
      ...job,
      status: 'idle',
      nextRun: this.calculateNextRun(job.schedule),
    });
    logger.info(`[Scheduler] Registered job: ${job.name} (${job.schedule})`, { context: 'scheduler' });
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.running) return;
    this.running = true;
    logger.info('[Scheduler] Starting...', { context: 'scheduler' });

    for (const [id, job] of this.jobs.entries()) {
      if (job.enabled) {
        this.scheduleJob(id, job);
      }
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.running = false;
    for (const [id, timer] of this.timers.entries()) {
      clearTimeout(timer);
      clearInterval(timer);
    }
    this.timers.clear();
    logger.info('[Scheduler] Stopped', { context: 'scheduler' });
  }

  /**
   * Get all jobs status
   */
  getJobsStatus() {
    return Array.from(this.jobs.values()).map(j => ({
      id: j.id,
      name: j.name,
      schedule: j.schedule,
      enabled: j.enabled,
      status: j.status,
      lastRun: j.lastRun,
      nextRun: j.nextRun,
      lastError: j.lastError,
    }));
  }

  private scheduleJob(id: string, job: ScheduledJob) {
    const intervalMs = this.parseInterval(job.schedule);

    const timer = setInterval(async () => {
      if (job.status === 'running') return; // Skip if already running

      job.status = 'running';
      job.lastRun = new Date();
      job.nextRun = this.calculateNextRun(job.schedule);

      try {
        await job.handler();
        job.status = 'idle';
        logger.info(`[Scheduler] Job '${job.name}' completed successfully`, { context: 'scheduler' });
      } catch (err: any) {
        job.status = 'error';
        job.lastError = err.message;
        logger.error(`[Scheduler] Job '${job.name}' failed: ${err.message}`, { context: 'scheduler', error: err });
      }
    }, intervalMs);

    this.timers.set(id, timer);
  }

  private parseInterval(schedule: string): number {
    switch (schedule.toLowerCase()) {
      case 'minute': return 60 * 1000;
      case '5min': return 5 * 60 * 1000;
      case '15min': return 15 * 60 * 1000;
      case '30min': return 30 * 60 * 1000;
      case 'hourly': return 60 * 60 * 1000;
      case '6hours': return 6 * 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      default: {
        const ms = parseInt(schedule, 10);
        return isNaN(ms) ? 60 * 60 * 1000 : ms;
      }
    }
  }

  private calculateNextRun(schedule: string): Date {
    const intervalMs = this.parseInterval(schedule);
    return new Date(Date.now() + intervalMs);
  }
}

// ─── Singleton ─────────────────────────────────────────

export const scheduler = new SchedulerEngine();

// ─── Register Default Jobs ─────────────────────────────

export function registerDefaultJobs() {
  // 1. Database health check - every 5 minutes
  scheduler.register({
    id: 'db-health',
    name: 'Database Health Check',
    schedule: '5min',
    enabled: true,
    handler: async () => {
      const { getPool } = await import('../core/database');
      const pool = getPool();
      await pool.query('SELECT 1');
    },
  });

  // 2. Session cleanup - hourly
  scheduler.register({
    id: 'session-cleanup',
    name: 'Session Cleanup',
    schedule: 'hourly',
    enabled: true,
    handler: async () => {
      const { query } = await import('../core/database');
      await query(`DELETE FROM refresh_tokens WHERE expires_at < NOW()`).catch((err) => { logger.warn(`[Scheduler] Session cleanup failed: ${err.message}`, { context: 'scheduler' }); });
    },
  });

  // 3. Audit log rotation - daily
  scheduler.register({
    id: 'audit-rotation',
    name: 'Audit Log Rotation',
    schedule: 'daily',
    enabled: true,
    handler: async () => {
      const { query } = await import('../core/database');
      // Archive old audit logs (older than 1 year)
      await query(`
        DELETE FROM audit_logs
        WHERE created_at < NOW() - INTERVAL '1 year'
      `).catch((err) => { logger.warn(`[Scheduler] Audit log rotation failed: ${err.message}`, { context: 'scheduler' }); });
      logger.info('[Scheduler] Audit log rotation completed', { context: 'scheduler' });
    },
  });

  // 4. Exchange rate refresh - every 6 hours
  scheduler.register({
    id: 'exchange-rates',
    name: 'Exchange Rate Refresh',
    schedule: '6hours',
    enabled: true,
    handler: async () => {
      logger.info('[Scheduler] Exchange rate refresh triggered', { context: 'scheduler' });
      // Can be extended to fetch live rates from external API
    },
  });

  // 5. System metrics collection - every 15 minutes
  scheduler.register({
    id: 'metrics-collect',
    name: 'System Metrics Collection',
    schedule: '15min',
    enabled: true,
    handler: async () => {
      const os = require('os');
      const memUsage = process.memoryUsage();
      const loadAvg = os.loadavg();
      // Store metrics for monitoring dashboard
      logger.debug(`[Metrics] Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB | CPU: ${loadAvg[0].toFixed(2)}`, { context: 'metrics' });
    },
  });

  logger.info('[Scheduler] Default jobs registered', { context: 'scheduler' });
}
