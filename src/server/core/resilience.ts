/**
 * NexoraOS™ — Circuit Breaker & Retry System
 * Resilience patterns for external services and database operations
 */

import logger from './logger';

// ─── Circuit Breaker ───────────────────────────────────

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject calls
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Failures before opening
  recoveryTimeoutMs: number;   // Time before half-open
  successThreshold: number;    // Successes to close from half-open
  monitorIntervalMs: number;   // Stats reporting interval
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private name: string;
  private config: CircuitBreakerConfig;
  private stats = { totalCalls: 0, totalFailures: 0, totalSuccesses: 0, totalRejections: 0 };

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.name = name;
    this.config = {
      failureThreshold: 5,
      recoveryTimeoutMs: 30000,
      successThreshold: 3,
      monitorIntervalMs: 60000,
      ...config,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.config.recoveryTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        logger.info(`Circuit breaker ${this.name}: OPEN → HALF_OPEN`, { context: 'circuit-breaker' });
      } else {
        this.stats.totalRejections++;
        throw new Error(`Circuit breaker ${this.name} is OPEN. Service unavailable.`);
      }
    }

    this.stats.totalCalls++;
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.stats.totalSuccesses++;
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        logger.info(`Circuit breaker ${this.name}: HALF_OPEN → CLOSED`, { context: 'circuit-breaker' });
      }
    }
  }

  private onFailure(): void {
    this.stats.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      logger.warn(`Circuit breaker ${this.name}: HALF_OPEN → OPEN`, { context: 'circuit-breaker' });
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.warn(`Circuit breaker ${this.name}: CLOSED → OPEN (${this.failureCount} failures)`, { context: 'circuit-breaker' });
    }
  }

  getState(): CircuitState { return this.state; }
  getStats() { return { ...this.stats, state: this.state, failureCount: this.failureCount }; }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    logger.info(`Circuit breaker ${this.name}: reset to CLOSED`, { context: 'circuit-breaker' });
  }
}

// ─── Retry with Exponential Backoff ────────────────────

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryOn?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any, delayMs: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const cfg: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    ...config,
  };

  let lastError: any;
  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (attempt < cfg.maxRetries) {
        if (cfg.retryOn && !cfg.retryOn(error)) break;
        const delay = Math.min(cfg.baseDelayMs * Math.pow(cfg.backoffMultiplier, attempt), cfg.maxDelayMs);
        const jitter = delay * 0.1 * Math.random();
        const totalDelay = Math.round(delay + jitter);
        if (cfg.onRetry) cfg.onRetry(attempt + 1, error, totalDelay);
        logger.warn(`Retry ${attempt + 1}/${cfg.maxRetries} after ${totalDelay}ms: ${error.message}`, { context: 'retry' });
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
  }
  throw lastError;
}

// ─── Timeout Wrapper ───────────────────────────────────

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// ─── Bulkhead (Concurrency Limiter) ────────────────────

export class Bulkhead {
  private running = 0;
  private queue: Array<() => void> = [];
  private name: string;

  constructor(name: string, private maxConcurrent: number) {
    this.name = name;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      if (this.queue.length > 0) this.queue.shift()!();
    }
  }

  getStats() { return { running: this.running, queued: this.queue.length, max: this.maxConcurrent }; }
}

// ─── Singleton Circuit Breakers ────────────────────────

export const dbCircuitBreaker = new CircuitBreaker('database', { failureThreshold: 3, recoveryTimeoutMs: 15000 });
export const externalApiCircuitBreaker = new CircuitBreaker('external-api', { failureThreshold: 5, recoveryTimeoutMs: 30000 });
export const aiCircuitBreaker = new CircuitBreaker('ai-service', { failureThreshold: 3, recoveryTimeoutMs: 60000 });

export const dbBulkhead = new Bulkhead('database', 10);
export const aiBulkhead = new Bulkhead('ai-service', 3);
