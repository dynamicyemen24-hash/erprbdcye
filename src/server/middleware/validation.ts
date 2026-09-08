/**
 * NexoraOS™ — Advanced Request Validation Pipeline
 * Zod-based validation with XSS sanitization, SQL injection detection,
 * and comprehensive error messages in Arabic/English.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// XSS Sanitization
// ═══════════════════════════════════════════════════════════════════

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /expression\(/gi,
  /<iframe\b/gi,
  /<object\b/gi,
  /<embed\b/gi,
  /<applet\b/gi,
];

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|TRUNCATE)\b)/gi,
  /(OR|AND)\s+\d+\s*=\s*\d+/gi,
  /;\s*(DROP|DELETE|INSERT|UPDATE)/gi,
  /'\s*OR\s+'1'\s*=\s*'1/gi,
  /'\s*OR\s+1\s*=\s*1/gi,
  /--\s*$/gm,
  /\/\*.*\*\//g,
];

/**
 * Sanitize a string value against XSS attacks.
 */
export function sanitizeXSS(value: string): string {
  let sanitized = value;
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  return sanitized;
}

/**
 * Detect SQL injection attempts in input.
 */
export function detectSQLInjection(value: string): boolean {
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) return true;
  }
  return false;
}

/**
 * Recursively sanitize an object.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      (result as any)[key] = sanitizeXSS(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (result as any)[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      (result as any)[key] = value.map(v =>
        typeof v === 'string' ? sanitizeXSS(v) :
        typeof v === 'object' && v !== null ? sanitizeObject(v) : v
      );
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// Validation Middleware Factory
// ═══════════════════════════════════════════════════════════════════

interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  /** Sanitize XSS in body (default: true) */
  sanitizeBody?: boolean;
  /** Check for SQL injection (default: true) */
  checkSQLInjection?: boolean;
  /** Custom error messages */
  messages?: {
    body?: string;
    query?: string;
    params?: string;
  };
}

/**
 * Create a validation middleware from Zod schemas.
 *
 * Usage:
 *   app.post('/api/users',
 *     validate({ body: createUserSchema }),
 *     handler
 *   );
 */
export function validate(config: ValidationConfig) {
  const { sanitizeBody = true, checkSQLInjection = true } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // ─── Body Validation ──────────────────────────────────────
    if (config.body) {
      try {
        req.body = config.body.parse(req.body);
      } catch (err) {
        if (err instanceof ZodError) {
          errors.push(...formatZodErrors(err, 'body'));
        } else {
          errors.push(config.messages?.body || 'Invalid request body');
        }
      }
    }

    // ─── Query Validation ─────────────────────────────────────
    if (config.query) {
      try {
        req.query = config.query.parse(req.query) as any;
      } catch (err) {
        if (err instanceof ZodError) {
          errors.push(...formatZodErrors(err, 'query'));
        } else {
          errors.push(config.messages?.query || 'Invalid query parameters');
        }
      }
    }

    // ─── Params Validation ────────────────────────────────────
    if (config.params) {
      try {
        req.params = config.params.parse(req.params) as any;
      } catch (err) {
        if (err instanceof ZodError) {
          errors.push(...formatZodErrors(err, 'params'));
        } else {
          errors.push(config.messages?.params || 'Invalid URL parameters');
        }
      }
    }

    // ─── Return Validation Errors ─────────────────────────────
    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Request contains invalid data',
        details: errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // ─── XSS Sanitization ─────────────────────────────────────
    if (sanitizeBody && req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // ─── SQL Injection Detection ──────────────────────────────
    if (checkSQLInjection) {
      const suspicious = detectSuspiciousInput(req.body) ||
        detectSuspiciousInput(req.query) ||
        detectSuspiciousInput(req.params);
      if (suspicious) {
        console.error('[SECURITY] SQL injection attempt detected', {
          ip: req.ip,
          path: req.path,
          method: req.method,
        });
        res.status(400).json({ error: 'Invalid input detected' });
        return;
      }
    }

    next();
  };
}

/**
 * Format Zod errors into user-friendly messages.
 */
function formatZodErrors(error: ZodError, source: string): string[] {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return `[${source}] ${path ? `${path}: ` : ''}${err.message}`;
  });
}

/**
 * Detect suspicious input patterns.
 */
function detectSuspiciousInput(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      if (detectSQLInjection(value)) return true;
      for (const pattern of XSS_PATTERNS) {
        if (pattern.test(value)) return true;
      }
    } else if (typeof value === 'object' && value !== null) {
      if (detectSuspiciousInput(value)) return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// Common Validation Schemas
// ═══════════════════════════════════════════════════════════════════

export const schemas = {
  // ─── Auth ────────────────────────────────────────────────────
  login: z.object({
    username: z.string().min(3).max(50).trim(),
    password: z.string().min(1).max(128),
  }),

  register: z.object({
    email: z.string().email().max(255).trim().toLowerCase(),
    password: z.string().min(8).max(128),
    name: z.string().min(2).max(100).trim(),
    name_ar: z.string().min(2).max(100).trim().optional(),
  }),

  changePassword: z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8).max(128),
    confirm_password: z.string().min(1),
  }).refine(data => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  }),

  // ─── Common ──────────────────────────────────────────────────
  idParam: z.object({
    id: z.string().uuid().or(z.string().min(1)),
  }),

  pagination: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),

  search: z.object({
    q: z.string().min(1).max(200).trim(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }),

  // ─── Finance ─────────────────────────────────────────────────
  transaction: z.object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.number().positive().max(10000000),
    currency: z.string().length(3).default('USD'),
    description: z.string().max(500).optional(),
    project_id: z.string().uuid().optional(),
    cost_center_id: z.string().uuid().optional(),
  }),

  // ─── Projects ────────────────────────────────────────────────
  project: z.object({
    name: z.string().min(2).max(200).trim(),
    name_ar: z.string().min(2).max(200).trim().optional(),
    description: z.string().max(2000).optional(),
    budget: z.number().positive().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }),
};

/**
 * Middleware that validates common query parameters.
 */
export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}

/**
 * Middleware that validates request body.
 */
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

/**
 * Middleware that validates URL parameters.
 */
export function validateParams(schema: ZodSchema) {
  return validate({ params: schema });
}
