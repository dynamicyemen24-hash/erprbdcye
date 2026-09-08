/**
 * NexoraOS™ — Request Tracing & Distributed Correlation
 * OpenTelemetry-compatible request tracing with correlation IDs.
 * Supports trace context propagation across services.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generate a unique trace ID (32 hex chars — OpenTelemetry compatible).
 */
export function generateTraceId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate a unique span ID (16 hex chars — OpenTelemetry compatible).
 */
export function generateSpanId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * W3C Trace Context format: 00-{traceId}-{spanId}-{traceFlags}
 */
export function parseTraceParent(traceParent: string): {
  traceId: string;
  spanId: string;
  traceFlags: string;
} | null {
  const parts = traceParent.split('-');
  if (parts.length !== 5 || parts[0] !== '00') return null;
  return {
    traceId: parts[1],
    spanId: parts[2],
    traceFlags: parts[3],
  };
}

/**
 * Create a trace parent header value.
 */
export function createTraceParent(traceId: string, spanId: string): string {
  return `00-${traceId}-${spanId}-01`;
}

interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  attributes: Record<string, string | number | boolean>;
}

/**
 * Request tracing middleware.
 * Extracts or generates trace context for every request.
 */
export function requestTracing(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Extract trace context from headers
  const traceParent = req.headers['traceparent'] as string;
  const traceState = req.headers['tracestate'] as string;

  let traceId: string;
  let spanId: string;
  let parentSpanId: string | undefined;

  if (traceParent) {
    const parsed = parseTraceParent(traceParent);
    if (parsed) {
      traceId = parsed.traceId;
      spanId = generateSpanId();
      parentSpanId = parsed.spanId;
    } else {
      traceId = generateTraceId();
      spanId = generateSpanId();
    }
  } else {
    // Check for X-Request-ID as fallback
    const requestId = req.headers['x-request-id'] as string;
    traceId = requestId || generateTraceId();
    spanId = generateSpanId();
  }

  // Create trace context
  const traceContext: TraceContext = {
    traceId,
    spanId,
    parentSpanId,
    operation: `${req.method} ${req.path}`,
    startTime,
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.path': req.path,
      'http.host': req.headers.host || 'unknown',
      'http.user_agent': (req.headers['user-agent'] as string) || 'unknown',
      'http.remote_addr': req.ip || 'unknown',
      'http.scheme': req.protocol,
    },
  };

  // Attach to request and response locals
  (req as any).trace = traceContext;
  res.locals.traceId = traceId;
  res.locals.spanId = spanId;

  // Set response headers (W3C Trace Context)
  res.setHeader('X-Request-ID', traceId);
  res.setHeader('Server-Timing', `total;dur=${Date.now() - startTime}`);

  // Override res.end to calculate duration
  const originalEnd = res.end.bind(res);
  res.end = function (...args: any[]) {
    const duration = Date.now() - startTime;
    traceContext.attributes['http.status_code'] = res.statusCode;
    traceContext.attributes['http.duration_ms'] = duration;

    // Log slow requests
    if (duration > 5000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.path} took ${duration}ms`, {
        traceId,
        spanId,
        statusCode: res.statusCode,
      });
    }

    // Set final Server-Timing header
    res.setHeader('Server-Timing', `total;dur=${duration}`);

    return originalEnd(...args);
  } as any;

  next();
}

/**
 * Create a child span for sub-operations within a request.
 */
export function createChildSpan(
  req: Request,
  operation: string,
  attributes: Record<string, string | number | boolean> = {}
): {
  spanId: string;
  end: (status?: 'OK' | 'ERROR', error?: string) => void;
} {
  const parentTrace = (req as any).trace as TraceContext | undefined;
  const spanId = generateSpanId();
  const startTime = Date.now();

  return {
    spanId,
    end(status = 'OK', error?: string) {
      const duration = Date.now() - startTime;
      const span = {
        traceId: parentTrace?.traceId || generateTraceId(),
        spanId,
        parentSpanId: parentTrace?.spanId,
        operation,
        duration_ms: duration,
        status,
        error,
        attributes,
        timestamp: new Date().toISOString(),
      };

      // Log span (in production, this would go to a tracing backend)
      if (status === 'ERROR' || duration > 1000) {
        console.log('[SPAN]', JSON.stringify(span));
      }
    },
  };
}

/**
 * Middleware that exposes trace info on /api/stats/traces.
 */
export function traceStatsHandler(req: Request, res: Response): void {
  const trace = (req as any).trace as TraceContext | undefined;
  res.json({
    status: 'ok',
    current_trace: trace ? {
      traceId: trace.traceId,
      spanId: trace.spanId,
      parentSpanId: trace.parentSpanId,
      operation: trace.operation,
      attributes: trace.attributes,
    } : null,
    timestamp: new Date().toISOString(),
  });
}
