/**
 * NexoraOS™ — Query Performance Monitor
 * Tracks slow queries, connection pool health, and provides optimization hints
 */

import { Pool, PoolClient } from 'pg';
import logger from './logger';

// ─── Query Metrics ─────────────────────────────────────

interface QueryMetric {
  query: string;
  duration: number;
  timestamp: number;
  rows?: number;
  error?: string;
}

interface SlowQueryLog {
  query: string;
  duration: number;
  timestamp: string;
  params?: any[];
  stack?: string;
}

class QueryPerformanceMonitor {
  private metrics: QueryMetric[] = [];
  private slowQueryThreshold: number;
  private maxMetrics: number;
  private slowQueries: SlowQueryLog[] = [];
  private maxSlowQueries: number;

  constructor() {
    this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_MS || '1000');
    this.maxMetrics = parseInt(process.env.QUERY_METRICS_MAX || '10000');
    this.maxSlowQueries = parseInt(process.env.SLOW_QUERY_LOG_MAX || '500');
  }

  startQuery(query: string): { end: (rows?: number, error?: string) => void } {
    const start = Date.now();
    return {
      end: (rows?: number, error?: string) => {
        const duration = Date.now() - start;
        const metric: QueryMetric = { query: query.substring(0, 200), duration, timestamp: start, rows, error };
        this.metrics.push(metric);
        if (this.metrics.length > this.maxMetrics) this.metrics.shift();

        if (duration >= this.slowQueryThreshold || error) {
          this.slowQueries.push({
            query: query.substring(0, 500),
            duration,
            timestamp: new Date().toISOString(),
          });
          if (this.slowQueries.length > this.maxSlowQueries) this.slowQueries.shift();
          logger.warn(`Slow query (${duration}ms): ${query.substring(0, 100)}`, {
            context: 'query-perf',
            duration,
            meta: { rows, error },
          });
        }
      },
    };
  }

  getStats() {
    const recent = this.metrics.slice(-1000);
    if (recent.length === 0) return { total: 0, avgMs: 0, p50: 0, p95: 0, p99: 0, slowQueries: this.slowQueries.length };

    const durations = recent.map(m => m.duration).sort((a, b) => a - b);
    return {
      total: this.metrics.length,
      avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      slowQueries: this.slowQueries.length,
      recentSlow: this.slowQueries.slice(-5),
    };
  }

  getSlowQueries(limit: number = 20): SlowQueryLog[] {
    return this.slowQueries.slice(-limit);
  }

  clear(): void {
    this.metrics = [];
    this.slowQueries = [];
  }
}

// ─── Connection Pool Optimizer ─────────────────────────

class PoolOptimizer {
  private pool: Pool;
  private checkInterval: NodeJS.Timeout | null = null;
  private alerts: Array<{ timestamp: string; type: string; message: string }> = [];

  constructor(pool: Pool) {
    this.pool = pool;
  }

  startMonitoring(intervalMs: number = 30000): void {
    this.checkInterval = setInterval(() => this.check(), intervalMs);
    logger.info('Pool optimizer started', { context: 'pool-optimizer' });
  }

  stop(): void {
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  private check(): void {
    const stats = this.getStats();

    // Alert on high usage
    if (stats.utilizationPercent > 80) {
      this.alert('HIGH_USAGE', `Connection pool at ${stats.utilizationPercent}% utilization`);
      logger.warn(`Pool utilization high: ${stats.utilizationPercent}%`, { context: 'pool-optimizer', meta: stats });
    }

    // Alert on waiting clients
    if (stats.waiting > 5) {
      this.alert('WAITING_CLIENTS', `${stats.waiting} clients waiting for connections`);
      logger.warn(`${stats.waiting} clients waiting for connections`, { context: 'pool-optimizer' });
    }

    // Alert on idle connections
    if (stats.idle > stats.max * 0.8) {
      this.alert('EXCESS_IDLE', `${stats.idle} idle connections (of ${stats.max})`);
    }
  }

  private alert(type: string, message: string): void {
    this.alerts.push({ timestamp: new Date().toISOString(), type, message });
    if (this.alerts.length > 100) this.alerts.shift();
  }

  getStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
      max: (this.pool.options as any).max || 20,
      min: (this.pool.options as any).min || 2,
      utilizationPercent: Math.round(((this.pool.totalCount - this.pool.idleCount) / (this.pool.options as any).max) * 100),
    };
  }

  getAlerts(limit: number = 20) {
    return this.alerts.slice(-limit);
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return { healthy: true, latencyMs: Date.now() - start };
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }
}

// ─── Singleton Instances ───────────────────────────────

export const queryMonitor = new QueryPerformanceMonitor();
export let poolOptimizer: PoolOptimizer;

export function initPoolOptimizer(pool: Pool): void {
  poolOptimizer = new PoolOptimizer(pool);
  poolOptimizer.startMonitoring();
}

// ─── Instrumented Query Wrapper ────────────────────────

export async function monitoredQuery(pool: Pool, text: string, params?: any[]): Promise<any> {
  const tracker = queryMonitor.startQuery(text);
  try {
    const result = await pool.query(text, params);
    tracker.end(result.rowCount || 0);
    return result;
  } catch (error: any) {
    tracker.end(undefined, error.message);
    throw error;
  }
}

// ─── Standalone Query Stats ──────────────────────────────

let queryCount = 0;
let slowQueryCount = 0;
let totalDuration = 0;
const recentSlowQueries: SlowQueryLog[] = [];
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_MS || '1000');

export function trackQuery(duration: number, query: string, error?: string) {
  queryCount++;
  totalDuration += duration;
  if (duration >= SLOW_QUERY_THRESHOLD || error) {
    slowQueryCount++;
    recentSlowQueries.push({
      query: query.substring(0, 500),
      duration,
      timestamp: new Date().toISOString(),
    });
    if (recentSlowQueries.length > 10) recentSlowQueries.shift();
  }
}

export function getQueryStats() {
  return {
    totalQueries: queryCount,
    slowQueries: slowQueryCount,
    averageDuration: totalDuration / Math.max(queryCount, 1),
    slowQueryThreshold: SLOW_QUERY_THRESHOLD,
    recentSlowQueries: recentSlowQueries.slice(-10),
  };
}

export function resetQueryStats() {
  queryCount = 0;
  slowQueryCount = 0;
  totalDuration = 0;
  recentSlowQueries.length = 0;
}

export default { queryMonitor, poolOptimizer, initPoolOptimizer, monitoredQuery };
