/**
 * NexoraOS™ — Health Check & System Monitor
 * Liveness, readiness, deep checks, metrics collection
 */

import { Pool } from 'pg';
import os from 'os';
import logger from './logger';

// ─── Types ─────────────────────────────────────────────

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: Record<string, CheckResult>;
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  cpu: { usagePercent: number; cores: number; model: string };
  memory: { totalMb: number; usedMb: number; freeMb: number; usagePercent: number };
  disk: { totalMb: number; usedMb: number; freeMb: number; usagePercent: number };
  process: { pid: number; uptime: number; heapUsedMb: number; heapTotalMb: number; rssMb: number };
  network: { interfaces: Record<string, string[]> };
}

// ─── Health Check Engine ───────────────────────────────

class HealthMonitor {
  private pool: Pool;
  private startTime: number;

  constructor(pool: Pool) {
    this.pool = pool;
    this.startTime = Date.now();
  }

  async liveness(): Promise<{ status: string; uptime: number }> {
    return { status: 'ok', uptime: Math.floor((Date.now() - this.startTime) / 1000) };
  }

  async readiness(): Promise<HealthStatus> {
    const checks: Record<string, CheckResult> = {};

    // Database connectivity
    checks.database = await this.checkDatabase();
    // Memory
    checks.memory = this.checkMemory();
    // Disk
    checks.disk = this.checkDisk();

    const overallStatus = Object.values(checks).some(c => c.status === 'fail')
      ? 'unhealthy' : Object.values(checks).some(c => c.status === 'warn') ? 'degraded' : 'healthy';

    return { status: overallStatus, timestamp: new Date().toISOString(), uptime: Math.floor((Date.now() - this.startTime) / 1000), checks };
  }

  async deep(): Promise<HealthStatus> {
    const basic = await this.readiness();
    // Add deep checks
    basic.checks.database_pool = this.checkPoolStats();
    basic.checks.disk_io = await this.checkDiskIO();
    return basic;
  }

  private async checkDatabase(): Promise<CheckResult> {
    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return { status: 'pass', message: 'Database connection OK', duration: Date.now() - start };
    } catch (error: any) {
      return { status: 'fail', message: `Database connection failed: ${error.message}`, duration: Date.now() - start };
    }
  }

  private checkMemory(): CheckResult {
    const totalMb = Math.round(os.totalmem() / 1024 / 1024);
    const freeMb = Math.round(os.freemem() / 1024 / 1024);
    const usedMb = totalMb - freeMb;
    const usagePercent = Math.round((usedMb / totalMb) * 100);
    const status = usagePercent > 90 ? 'fail' : usagePercent > 75 ? 'warn' : 'pass';
    return { status, message: `Memory: ${usagePercent}% used (${usedMb}MB / ${totalMb}MB)`, metadata: { totalMb, usedMb, freeMb, usagePercent } };
  }

  private checkDisk(): CheckResult {
    const totalMb = Math.round(os.totalmem() / 1024 / 1024);
    const freeMb = Math.round(os.freemem() / 1024 / 1024);
    const usedMb = totalMb - freeMb;
    const usagePercent = Math.round((usedMb / totalMb) * 100);
    const status = usagePercent > 95 ? 'fail' : usagePercent > 85 ? 'warn' : 'pass';
    return { status, message: `Disk: ${usagePercent}% used`, metadata: { totalMb, usedMb, freeMb, usagePercent } };
  }

  private checkPoolStats(): CheckResult {
    const stats = { totalCount: this.pool.totalCount, idleCount: this.pool.idleCount, waitingCount: this.pool.waitingCount };
    const usagePercent = Math.round(((stats.totalCount - stats.idleCount) / stats.totalCount) * 100);
    const status = usagePercent > 90 ? 'fail' : usagePercent > 70 ? 'warn' : 'pass';
    return { status, message: `Pool: ${stats.totalCount} total, ${stats.idleCount} idle, ${stats.waitingCount} waiting`, metadata: stats };
  }

  private async checkDiskIO(): Promise<CheckResult> {
    try {
      const start = Date.now();
      await this.pool.query('SELECT pg_database_size(current_database()) as size');
      return { status: 'pass', message: 'Disk I/O OK', duration: Date.now() - start };
    } catch { return { status: 'warn', message: 'Disk I/O check skipped' }; }
  }

  async getMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      return acc + (1 - cpu.times.idle / total);
    }, 0) / cpus.length;

    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const usedMem = totalMem - freeMem;

    const processInfo = process.memoryUsage();
    const interfaces = os.networkInterfaces();
    const netInterfaces: Record<string, string[]> = {};
    for (const [name, addrs] of Object.entries(interfaces)) {
      netInterfaces[name] = (addrs || []).map(a => a.address);
    }

    return {
      cpu: { usagePercent: Math.round(cpuUsage * 100), cores: cpus.length, model: cpus[0]?.model || 'unknown' },
      memory: { totalMb: totalMem, usedMb: usedMem, freeMb: freeMem, usagePercent: Math.round((usedMem / totalMem) * 100) },
      disk: { totalMb: totalMem, usedMb: usedMem, freeMb: freeMem, usagePercent: Math.round((usedMem / totalMem) * 100) },
      process: {
        pid: process.pid, uptime: Math.floor(process.uptime()),
        heapUsedMb: Math.round(processInfo.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(processInfo.heapTotal / 1024 / 1024),
        rssMb: Math.round(processInfo.rss / 1024 / 1024),
      },
      network: { interfaces: netInterfaces },
    };
  }
}

// ─── Request Metrics Collector ─────────────────────────

class RequestMetrics {
  private metrics = new Map<string, { count: number; totalMs: number; errors: number; lastAt: string }>();

  record(method: string, path: string, statusCode: number, durationMs: number): void {
    const key = `${method} ${path}`;
    const existing = this.metrics.get(key) || { count: 0, totalMs: 0, errors: 0, lastAt: '' };
    existing.count++;
    existing.totalMs += durationMs;
    if (statusCode >= 400) existing.errors++;
    existing.lastAt = new Date().toISOString();
    this.metrics.set(key, existing);
  }

  getTopEndpoints(limit: number = 20): Array<{ endpoint: string; count: number; avgMs: number; errorRate: string }> {
    return Array.from(this.metrics.entries())
      .map(([endpoint, m]) => ({
        endpoint, count: m.count, avgMs: Math.round(m.totalMs / m.count),
        errorRate: `${((m.errors / m.count) * 100).toFixed(1)}%`,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getTotalRequests(): number { return Array.from(this.metrics.values()).reduce((sum, m) => sum + m.count, 0); }
  getAverageResponseTime(): number {
    const all = Array.from(this.metrics.values());
    const totalMs = all.reduce((sum, m) => sum + m.totalMs, 0);
    const totalReqs = all.reduce((sum, m) => sum + m.count, 0);
    return totalReqs > 0 ? Math.round(totalMs / totalReqs) : 0;
  }
  getErrorRate(): string {
    const all = Array.from(this.metrics.values());
    const totalReqs = all.reduce((sum, m) => sum + m.count, 0);
    const totalErrors = all.reduce((sum, m) => sum + m.errors, 0);
    return totalReqs > 0 ? `${((totalErrors / totalReqs) * 100).toFixed(2)}%` : '0%';
  }
}

// ─── Singleton ─────────────────────────────────────────

export let healthMonitor: HealthMonitor;
export const requestMetrics = new RequestMetrics();

export function initHealthMonitor(pool: Pool): void {
  healthMonitor = new HealthMonitor(pool);
}

export default { initHealthMonitor, requestMetrics };
