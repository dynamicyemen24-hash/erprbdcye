/**
 * NexoraOS™ — Request Tracing with Correlation IDs
 * Distributed tracing for request lifecycle tracking across services
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '../core/logger';

// Extend Express Request type for tracing context
declare global {
  namespace Express {
    interface Request {
      traceId: string;
      spanId: string;
      startTime: number;
    }
  }
}

export function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Use existing request ID or generate new trace ID
  req.traceId = (req.headers['x-trace-id'] as string) || (req as any).id || randomUUID();
  req.spanId = randomUUID().substring(0, 8);
  req.startTime = Date.now();

  // Add correlation headers to response
  res.setHeader('X-Trace-Id', req.traceId);
  res.setHeader('X-Span-Id', req.spanId);

  // Log request start
  logger.debug('Request started', {
    context: 'tracing',
    requestId: req.traceId,
    meta: {
      spanId: req.spanId,
      method: req.method,
      path: req.path,
    },
  });

  // Log request completion with timing
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const logData = {
      context: 'tracing',
      requestId: req.traceId,
      meta: {
        spanId: req.spanId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
    };

    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (duration > 2000) {
      logger.warn('Slow request', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
}
