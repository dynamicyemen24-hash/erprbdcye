/**
 * NexoraOS™ — Security Hardening Layer
 * Input sanitization, XSS prevention, SQL injection protection, audit
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from './logger';

// ─── Input Sanitization ────────────────────────────────

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;',
  '/': '&#x2F;', '`': '&#96;',
};

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[&<>"'\/`]/g, char => HTML_ENTITIES[char] || char);
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeHtml(input.trim())
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/expression\(/gi, '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  }
  if (Array.isArray(input)) return input.map(sanitizeInput);
  if (typeof input === 'object' && input !== null) {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(input)) {
      clean[sanitizeHtml(key)] = sanitizeInput(val);
    }
    return clean;
  }
  return input;
}

// ─── SQL Injection Patterns ────────────────────────────

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|TRUNCATE|GRANT|REVOKE)\b)/i,
  /(--|;|\/\*|\*\/|xp_|sp_)/i,
  /(CHAR\(|CONCAT\(|0x[0-9a-f]+)/i,
  /(BENCHMARK\(|SLEEP\(|WAITFOR\s+DELAY)/i,
  /(LOAD_FILE|INTO\s+(OUT|DUMP)FILE)/i,
  /(\bOR\b\s+\d+\s*=\s*\d+)/i,
  /('.*\bOR\b.*'.*=.*')/i,
];

export function detectSqlInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// ─── Path Traversal Protection ─────────────────────────

export function isPathTraversal(path: string): boolean {
  const normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/');
  return normalized.includes('../') || normalized.includes('..\\') ||
    normalized.includes('%2e%2e') || normalized.includes('%252e');
}

// ─── Request Security Middleware ────────────────────────

export function securityMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Sanitize body, query, params
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeInput(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeInput(req.query as any);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeInput(req.params as any);
    }

    // 2. Check for SQL injection in query params
    const allParams = { ...req.query, ...req.params };
    for (const [key, value] of Object.entries(allParams)) {
      if (typeof value === 'string' && detectSqlInjection(value)) {
        logger.warn(`SQL injection attempt detected: ${key}=${value}`, {
          context: 'security', meta: { ip: req.ip, path: req.path, userId: (req as any).userId },
        });
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Invalid characters in request' },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 3. Check body for SQL injection
    if (req.body) {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string' && detectSqlInjection(value)) {
          logger.warn(`SQL injection attempt in body: ${key}`, {
            context: 'security', meta: { ip: req.ip, path: req.path },
          });
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'Invalid characters in request body' },
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // 4. Path traversal check
    if (isPathTraversal(req.path)) {
      logger.warn(`Path traversal attempt: ${req.path}`, { context: 'security', meta: { ip: req.ip } });
      return res.status(400).json({ success: false, error: { code: 'INVALID_PATH' } });
    }

    // 5. Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // 6. Request size check (already handled by express.json limit, but double-check)
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE' } });
    }

    next();
  };
}

// ─── CSRF Token Generation ─────────────────────────────

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyCsrfToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
}

// ─── Request Fingerprinting ────────────────────────────

export function generateRequestFingerprint(req: Request): string {
  const data = `${req.ip}|${req.get('user-agent') || ''}|${req.get('accept-language') || ''}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

// ─── Audit Logger ──────────────────────────────────────

export interface AuditEvent {
  tenantId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'failure';
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const { query } = await import('./database');
    await query(
      `INSERT INTO audit_logs (organization_id, user_id, action, table_name, record_id, details, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        event.tenantId || null,
        event.userId || null,
        event.action,
        event.resource,
        event.resourceId || null,
        JSON.stringify(event.details || {}),
        event.ip || null,
        event.userAgent || null,
        event.status,
      ]
    );
  } catch (error: any) {
    logger.error(`Audit log failed: ${error.message}`, { context: 'audit' });
  }
}

// ─── Password Strength Validator ───────────────────────

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('يجب أن يكون 8 أحرف على الأقل');

  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('يجب أن يحتوي على حرف كبير');
  if (/[a-z]/.test(password)) score++;
  else feedback.push('يجب أن يحتوي على حرف صغير');
  if (/[0-9]/.test(password)) score++;
  else feedback.push('يجب أن يحتوي على رقم');
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  else feedback.push('يجب أن يحتوي على رمز خاص');

  // Check common patterns
  if (/(.)\1{2,}/.test(password)) { score--; feedback.push('تجنب التكرار'); }
  if (/^(password|123456|qwerty)/i.test(password)) { score = 0; feedback.push('كلمة مرور شائعة'); }

  return { score: Math.max(0, Math.min(4, score)), feedback, isStrong: score >= 3 };
}

// ─── IP Allowlist / Blocklist ───────────────────────────

const ipBlocklist = new Set<string>();
const ipBlocklistFile = process.env.IP_BLOCKLIST_FILE;

export function isIpBlocked(ip: string): boolean {
  return ipBlocklist.has(ip);
}

export function blockIp(ip: string, reason?: string): void {
  ipBlocklist.add(ip);
  logger.warn(`IP blocked: ${ip} (${reason || 'manual'})`, { context: 'security' });
}

export function unblockIp(ip: string): void {
  ipBlocklist.delete(ip);
  logger.info(`IP unblocked: ${ip}`, { context: 'security' });
}

export function ipBlocklistMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isIpBlocked(req.ip || '')) {
      logger.warn(`Blocked request from ${req.ip}`, { context: 'security' });
      return res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED' } });
    }
    next();
  };
}
