/**
 * NexoraOS™ — Advanced Circuit Breaker
 * Prevents cascade failures with state machine: CLOSED → OPEN → HALF_OPEN.
 * Configurable thresholds, timeouts, and fallback strategies.
 */

import { EventEmitter } from 'events';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Time in ms to wait before trying half-open (default: 30000) */
  resetTimeoutMs?: number;
  /** Number of successful calls in half-open before closing (default: 3) */
  halfOpenSuccessThreshold?: number;
  /** Timeout for each call in ms (default: 10000) */
  callTimeoutMs?: number;
  /** Monitor window in ms (default: 60000) */
  windowMs?: number;
  /** Fallback function when circuit is open */
  fallback?: (...args: any[]) => any;
  /** Custom error predicate — return true to count as failure */
  isFailure?: (error: any) => boolean;
}

interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalCalls: number;
  lastFailure?: string;
  lastSuccess?: string;
  lastStateChange?: string;
}

/**
 * Production-grade circuit breaker with monitoring.
 */
export class AdvancedCircuitBreaker extends EventEmitter {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private totalCalls = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private lastStateChangeTime?: number;
  private nextAttempt?: number;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenSuccessThreshold: number;
  private readonly callTimeoutMs: number;
  private readonly windowMs: number;
  private readonly fallback?: (...args: any[]) => any;
  private readonly isFailure: (error: any) => boolean;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    super();
    this.name = name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold ?? 3;
    this.callTimeoutMs = options.callTimeoutMs ?? 10000;
    this.windowMs = options.windowMs ?? 60000;
    this.fallback = options.fallback;
    this.isFailure = options.isFailure ?? ((err) => true);
  }

  private name: string;

  /**
   * Execute a function through the circuit breaker.
   * Returns fallback if circuit is open.
   */
  async fire<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    this.totalCalls++;

    // Check if circuit should transition to half-open
    if (this.state === 'OPEN') {
      if (this.nextAttempt && Date.now() >= this.nextAttempt) {
        this.setState('HALF_OPEN');
      } else {
        // Circuit is open — execute fallback
        if (this.fallback) {
          return this.fallback(...args);
        }
        throw new CircuitOpenError(this.name, this.resetTimeoutMs);
      }
    }

    // Execute with timeout
    try {
      const result = await this.withTimeout(fn(...args), this.callTimeoutMs);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Wrap a function to always go through the circuit breaker.
   */
  wrap<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return ((...args: any[]) => this.fire(fn, ...args)) as T;
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new CircuitTimeoutError(this.name, ms));
      }, ms);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.setState('CLOSED');
      }
    } else {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  private onFailure(error: any): void {
    if (!this.isFailure(error)) return;

    this.failureCount++;
    this.lastFailureTime = Date.now();

    // Reset failure count if outside window
    if (this.lastFailureTime - (this.lastFailureTime - this.windowMs) > this.windowMs) {
      this.failureCount = 1;
    }

    if (this.state === 'HALF_OPEN') {
      // Any failure in half-open opens the circuit
      this.setState('OPEN');
    } else if (this.failureCount >= this.failureThreshold) {
      this.setState('OPEN');
    }

    this.emit('failure', { name: this.name, error, failureCount: this.failureCount });
  }

  private setState(newState: CircuitState): void {
    const prevState = this.state;
    this.state = newState;
    this.lastStateChangeTime = Date.now();

    if (newState === 'OPEN') {
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
      this.successCount = 0;
    } else if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
      this.nextAttempt = undefined;
    }

    this.emit('stateChange', {
      name: this.name,
      from: prevState,
      to: newState,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current circuit statistics.
   */
  getStats(): CircuitStats {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      totalCalls: this.totalCalls,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : undefined,
      lastSuccess: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : undefined,
      lastStateChange: this.lastStateChangeTime ? new Date(this.lastStateChangeTime).toISOString() : undefined,
    };
  }

  /**
   * Manually reset the circuit to closed state.
   */
  reset(): void {
    this.setState('CLOSED');
  }

  /**
   * Manually open the circuit.
   */
  trip(): void {
    this.setState('OPEN');
  }
}

// Custom error types
export class CircuitOpenError extends Error {
  constructor(name: string, resetMs: number) {
    super(`Circuit breaker "${name}" is OPEN. Retry after ${resetMs}ms.`);
    this.name = 'CircuitOpenError';
  }
}

export class CircuitTimeoutError extends Error {
  constructor(name: string, timeoutMs: number) {
    super(`Circuit breaker "${name}" call timed out after ${timeoutMs}ms`);
    this.name = 'CircuitTimeoutError';
  }
}

// Pre-configured circuit breakers for common services
export const dbCircuitBreaker = new AdvancedCircuitBreaker('database', {
  failureThreshold: 3,
  resetTimeoutMs: 30000,
  callTimeoutMs: 15000,
});

export const redisCircuitBreaker = new AdvancedCircuitBreaker('redis', {
  failureThreshold: 5,
  resetTimeoutMs: 15000,
  callTimeoutMs: 5000,
});

export const aiCircuitBreaker = new AdvancedCircuitBreaker('gemini-ai', {
  failureThreshold: 3,
  resetTimeoutMs: 60000,
  callTimeoutMs: 30000,
});

export const emailCircuitBreaker = new AdvancedCircuitBreaker('email', {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  callTimeoutMs: 10000,
});

/**
 * Middleware that exposes circuit breaker stats on /api/stats/circuit-breakers.
 */
export function circuitBreakerStatsHandler(req: any, res: any): void {
  res.json({
    status: 'ok',
    circuits: {
      database: dbCircuitBreaker.getStats(),
      redis: redisCircuitBreaker.getStats(),
      ai: aiCircuitBreaker.getStats(),
      email: emailCircuitBreaker.getStats(),
    },
    timestamp: new Date().toISOString(),
  });
}
