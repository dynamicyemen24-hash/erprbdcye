/**
 * NexoraOS™ — Centralized Error Handler
 * Structured error responses, request tracking, graceful shutdown
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ─── Custom Error Classes ──────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Rate limit exceeded. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// ─── Request ID Middleware ──────────────────────────────

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

// ─── Request Logger Middleware ──────────────────────────

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']?.substring(0, 100),
    };

    if (res.statusCode >= 500) {
      console.error('[ERROR]', JSON.stringify(log));
    } else if (res.statusCode >= 400) {
      console.warn('[WARN]', JSON.stringify(log));
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('[INFO]', JSON.stringify(log));
    }
  });

  next();
}

// ─── Centralized Error Handler ─────────────────────────

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // AppError (operational errors)
  if (err instanceof AppError) {
    const response: any = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    };

    if (err instanceof ValidationError && err.field) {
      response.error.field = err.field;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' },
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Authentication token expired' },
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // PostgreSQL errors
  if (err.message?.includes('duplicate key')) {
    res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_ENTRY', message: 'Record already exists' },
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (err.message?.includes('foreign key')) {
    res.status(400).json({
      success: false,
      error: { code: 'REFERENCE_ERROR', message: 'Referenced record not found' },
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Unknown errors (log full stack in production)
  console.error('[UNHANDLED ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
  });
}

// ─── 404 Handler ───────────────────────────────────────

export function notFoundHandler(req: Request, res: Response) {
  if (req.path.startsWith('/api')) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `API endpoint not found: ${req.method} ${req.path}` },
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    });
  } else {
    // SPA fallback - serve index.html
    res.sendFile('index.html', { root: 'public' });
  }
}
