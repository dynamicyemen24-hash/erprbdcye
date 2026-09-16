/**
 * NexoraOS™ — Durable Job Queue (Postgres SKIP LOCKED)
 * Jobs survive restarts and deploys. Multiple API replicas / dedicated
 * worker containers can consume the same queue safely via row-level locking.
 * Falls back to the in-memory JobQueue when the database is unreachable
 * (local dev without DB, tests), so producers never crash.
 *
 * Same Job/JobHandler/JobOptions shape as the in-memory queue, so worker
 * definitions are shared (see workers.ts registerWorkers(target)).
 */

import { randomUUID } from 'crypto';
import { Job, JobHandler, JobOptions, JobPriority, JobStatus, QueueMetrics } from './types';
import { queue as memoryQueue } from './queue';
import logger from '../core/logger';

const POLL_MS = parseInt(process.env.WORKER_POLL_MS || '1000', 10);
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

type QueueLike = {
  registerHandler(type: string, handler: JobHandler): void;
};

class DurableQueue implements QueueLike {
  private handlers = new Map<string, JobHandler>();
  private running = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private activeCount = 0;
  private dbReady: boolean | null = null; // null = unknown, probe on first use
  private dbWarned = false;
  private lastProbeAt = 0;
  private static readonly PROBE_RETRY_MS = 30000;

  registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  private async db(): Promise<{ query: (t: string, p?: any[]) => Promise<any> } | null> {
    // Negative cache with periodic re-probe so a recovered DB is picked up.
    if (this.dbReady === false) {
      if (Date.now() - this.lastProbeAt < DurableQueue.PROBE_RETRY_MS) return null;
    }
    this.lastProbeAt = Date.now();
    try {
      const { getPool } = await import('../core/database');
      const pool = getPool();
      await pool.query(`CREATE TABLE IF NOT EXISTS durable_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NULL,
        type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        priority SMALLINT NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        locked_by TEXT NULL,
        locked_at TIMESTAMPTZ NULL,
        started_at TIMESTAMPTZ NULL,
        completed_at TIMESTAMPTZ NULL,
        last_error TEXT NULL,
        result JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      this.dbReady = true;
      this.dbWarned = false;
      return pool;
    } catch (err: any) {
      if (!this.dbWarned) {
        logger.warn(`[DurableQueue] DB unavailable, using in-memory fallback: ${err.message}`);
        this.dbWarned = true;
      }
      this.dbReady = false;
      return null;
    }
  }

  async add<T>(type: string, data: T, options: JobOptions & { orgId?: string } = {}): Promise<Job<T>> {
    const pool = await this.db();
    const id = randomUUID();
    const delayMs = options.delay ?? 0;
    if (!pool) {
      return memoryQueue.add<T>(type, data, options);
    }
    try {
      await pool.query(
        `INSERT INTO durable_jobs (id, organization_id, type, payload, priority, max_attempts, run_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() + make_interval(secs => $7))`,
        [
          id,
          options.orgId || null,
          type,
          JSON.stringify(data ?? {}),
          options.priority ?? JobPriority.NORMAL,
          options.maxAttempts ?? 3,
          Math.max(0, Math.floor(delayMs / 1000)),
        ],
      );
      logger.info(`[DurableQueue] Job enqueued: ${type} (${id})`, { context: 'queue' });
    } catch (err: any) {
      logger.warn(`[DurableQueue] Enqueue failed, using memory fallback: ${err.message}`);
      return memoryQueue.add<T>(type, data, options);
    }
    return {
      id,
      type,
      data,
      priority: options.priority ?? JobPriority.NORMAL,
      status: JobStatus.PENDING,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      delay: delayMs,
      createdAt: new Date(),
      timeout: options.timeout ?? 30000,
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info('[DurableQueue] Worker loop started', { context: 'queue' });
    void this.poll();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = null;
    logger.info('[DurableQueue] Worker loop stopped', { context: 'queue' });
  }

  private async poll(): Promise<void> {
    if (!this.running) return;
    try {
      while (this.running && this.activeCount < CONCURRENCY) {
        const claimed = await this.claimOne();
        if (!claimed) break;
        void this.execute(claimed);
      }
    } catch (err: any) {
      logger.warn(`[DurableQueue] Poll error: ${err.message}`, { context: 'queue' });
    } finally {
      if (this.running) {
        this.pollTimer = setTimeout(() => void this.poll(), POLL_MS);
        if (typeof this.pollTimer.unref === 'function') this.pollTimer.unref();
      }
    }
  }

  private async claimOne(): Promise<any | null> {
    const pool = await this.db();
    if (!pool) return null;
    try {
      const workerId = `api-${process.pid}`;
      const res = await pool.query(
        `UPDATE durable_jobs
         SET status = 'active', locked_by = $1, locked_at = NOW(), started_at = NOW(),
             attempts = attempts + 1, updated_at = NOW()
         WHERE id = (
           SELECT id FROM durable_jobs
           WHERE status = 'pending' AND run_at <= NOW()
           ORDER BY priority DESC, created_at
           LIMIT 1
           FOR UPDATE SKIP LOCKED
         )
         RETURNING *`,
        [workerId],
      );
      return res.rows[0] || null;
    } catch {
      return null;
    }
  }

  private async execute(row: any): Promise<void> {
    this.activeCount++;
    const handler = this.handlers.get(row.type);
    const job: Job = {
      id: row.id,
      type: row.type,
      data: row.payload,
      priority: row.priority,
      status: JobStatus.ACTIVE,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      delay: 0,
      createdAt: new Date(row.created_at),
      startedAt: new Date(),
      timeout: 30000,
    };
    const finish = async (patch: string, params: any[]) => {
      try {
        const { getPool } = await import('../core/database');
        await getPool().query(patch, params);
      } catch {
        /* best effort */
      }
    };
    try {
      if (!handler) throw new Error(`No handler registered for job type "${row.type}"`);
      const timeoutMs = 60000;
      const result = await Promise.race([
        handler(job),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Job timeout (60s)')), timeoutMs)),
      ]);
      await finish(
        `UPDATE durable_jobs SET status='completed', result=$2::jsonb, completed_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [row.id, JSON.stringify(result ?? { ok: true })],
      );
      logger.info(`[DurableQueue] Completed ${row.type} (${row.id})`, { context: 'queue' });
    } catch (err: any) {
      const message = err?.message || 'unknown error';
      if (row.attempts < row.max_attempts) {
        const backoffSecs = Math.pow(2, row.attempts) * 5;
        await finish(
          `UPDATE durable_jobs SET status='pending', last_error=$2, run_at=NOW() + make_interval(secs => $3), locked_by=NULL, updated_at=NOW() WHERE id=$1`,
          [row.id, message, backoffSecs],
        );
        logger.warn(
          `[DurableQueue] Retry ${row.type} (${row.id}) attempt ${row.attempts}/${row.max_attempts}: ${message}`,
          { context: 'queue' },
        );
      } else {
        await finish(
          `UPDATE durable_jobs SET status='failed', last_error=$2, completed_at=NOW(), updated_at=NOW() WHERE id=$1`,
          [row.id, message],
        );
        logger.error(`[DurableQueue] Failed ${row.type} (${row.id}) after ${row.attempts} attempts: ${message}`, {
          context: 'queue',
        });
      }
    } finally {
      this.activeCount--;
    }
  }

  async getJob(jobId: string): Promise<Job | undefined> {
    const pool = await this.db();
    if (pool) {
      try {
        const res = await pool.query(`SELECT * FROM durable_jobs WHERE id = $1`, [jobId]);
        const row = res.rows[0];
        if (row) {
          return {
            id: row.id,
            type: row.type,
            data: row.payload,
            priority: row.priority,
            status: row.status as JobStatus,
            attempts: row.attempts,
            maxAttempts: row.max_attempts,
            delay: 0,
            createdAt: new Date(row.created_at),
            startedAt: row.started_at ? new Date(row.started_at) : undefined,
            completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
            error: row.last_error || undefined,
            result: row.result ?? undefined,
            timeout: 30000,
          };
        }
      } catch {
        /* fall through to memory */
      }
    }
    return memoryQueue.getJob(jobId);
  }

  async retry(jobId: string): Promise<Job | null> {
    const pool = await this.db();
    if (pool) {
      try {
        const res = await pool.query(
          `UPDATE durable_jobs SET status='pending', attempts=0, last_error=NULL, run_at=NOW(), updated_at=NOW()
           WHERE id=$1 AND status IN ('failed','cancelled') RETURNING *`,
          [jobId],
        );
        if (res.rows[0]) return this.getJob(jobId) as Promise<Job | null>;
      } catch {
        /* fall through */
      }
    }
    return memoryQueue.retry(jobId);
  }

  cancel(jobId: string): boolean {
    // Fire-and-forget DB cancel; memory cancel is synchronous.
    void (async () => {
      const pool = await this.db();
      if (pool) {
        try {
          await pool.query(
            `UPDATE durable_jobs SET status='cancelled', updated_at=NOW() WHERE id=$1 AND status='pending'`,
            [jobId],
          );
        } catch {
          /* ignore */
        }
      }
    })();
    return memoryQueue.cancel(jobId);
  }

  async getMetrics(): Promise<QueueMetrics> {
    const pool = await this.db();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE status='pending') AS pending,
             COUNT(*) FILTER (WHERE status='active') AS active,
             COUNT(*) FILTER (WHERE status='completed') AS completed,
             COUNT(*) FILTER (WHERE status='failed') AS failed,
             COUNT(*) FILTER (WHERE status IN ('completed','failed')) AS total
           FROM durable_jobs`,
        );
        const r = res.rows[0];
        return {
          pending: parseInt(r.pending, 10),
          active: parseInt(r.active, 10),
          completed: parseInt(r.completed, 10),
          failed: parseInt(r.failed, 10),
          totalProcessed: parseInt(r.total, 10),
          avgProcessingTime: 0,
        };
      } catch {
        /* fall through */
      }
    }
    return memoryQueue.getMetrics();
  }

  async clean(maxAgeMs: number = 3600000): Promise<number> {
    const pool = await this.db();
    if (pool) {
      try {
        const res = await pool.query(
          `DELETE FROM durable_jobs
           WHERE status IN ('completed','failed','cancelled')
             AND COALESCE(completed_at, updated_at) < NOW() - make_interval(secs => $1)
           RETURNING id`,
          [Math.floor(maxAgeMs / 1000)],
        );
        return res.rows.length;
      } catch {
        /* fall through */
      }
    }
    return memoryQueue.clean(maxAgeMs);
  }
}

export const durableQueue = new DurableQueue();
export default durableQueue;
