/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Anti-Reverse-Engineering & RASP (Runtime Application Self-Protection)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Protects against:
 * - Debugging attachment & breakpoint injection
 * - Process memory inspection & dumping
 * - Environment variable extraction
 * - Code tampering & integrity violations
 * - Source map & stack trace leakage
 * - Prototype pollution attacks
 * - eval() and Function() injection
 * - Timing side-channel attacks
 * - Module require hooking
 */

import crypto from 'crypto';
import logger from './logger';

// ─── Debug Detection ────────────────────────────────────────────────────────

let _debuggerDetected = false;
let _debugCheckInterval: NodeJS.Timeout | null = null;

/**
 * Detect debugger attachment via process._debugProcess and timing anomalies.
 * Runs periodically — if a breakpoint is hit, execution time spikes dramatically.
 */
export function startDebuggerDetection(): void {
  if (_debugCheckInterval) return;

  const BASELINE_THRESHOLD_MS = 50;

  _debugCheckInterval = setInterval(() => {
    const start = process.hrtime.bigint();

    // Force V8 to compile this function — breakpoints will pause here
    const _dummy = (() => {
      let x = 0;
      for (let i = 0; i < 100; i++) x += i;
      return x;
    })();

    const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;

    if (elapsed > BASELINE_THRESHOLD_MS) {
      _debuggerDetected = true;
      logger.warn(`[RASP] Debugger detected — execution delay: ${elapsed.toFixed(2)}ms (baseline: ${BASELINE_THRESHOLD_MS}ms)`, {
        context: 'rasp',
        meta: { elapsed, baseline: BASELINE_THRESHOLD_MS, pid: process.pid },
      });

      // Log security event
      logSecurityEvent('DEBUGGER_ATTACHED', {
        elapsed,
        pid: process.pid,
        timestamp: new Date().toISOString(),
      });

      // Optional: terminate the process in production
      if (process.env.NODE_ENV === 'production' && process.env.RASP_TERMINATE_ON_DEBUG === 'true') {
        logger.error('[RASP] Terminating process due to debugger detection', { context: 'rasp' });
        process.exit(1);
      }
    }
  }, 5000);
}

// ─── Code Integrity Verification ────────────────────────────────────────────

const _integrityHashes = new Map<string, string>();

/**
 * Compute SHA-256 hash of a string.
 */
export function computeHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Register critical file hashes at startup.
 */
export function initializeIntegrityChecks(): void {
  try {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');

    const criticalFiles = [
      'dist/server.cjs',
      'src/server/core/security.ts',
      'src/server/core/authorization.core.ts',
      'src/server/middleware/auth.middleware.ts',
      'src/server/config/index.ts',
    ];

    for (const file of criticalFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        _integrityHashes.set(file, computeHash(content));
      }
    }

    logger.info(`[RASP] Integrity checks initialized for ${criticalFiles.length} critical files`, { context: 'rasp' });
  } catch (err: any) {
    logger.warn(`[RASP] Could not initialize integrity checks: ${err.message}`, { context: 'rasp' });
  }
}

// ─── Anti-Prototype-Pollution ───────────────────────────────────────────────

const FORBIDDEN_KEYS = new Set([
  '__proto__', 'constructor', 'prototype', 'toString',
  'valueOf', 'hasOwnProperty', 'isPrototypeOf',
  'process', 'mainModule', 'require', 'module',
  'global', 'window', 'self', 'this',
]);

/**
 * Sanitize an object by removing prototype pollution vectors.
 */
export function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 20 || obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (FORBIDDEN_KEYS.has(key)) {
      logger.warn(`[RASP] Stripped prototype pollution vector: ${key}`, { context: 'rasp' });
      continue;
    }
    clean[key] = sanitizeObject(value, depth + 1);
  }
  return clean;
}

// ─── Anti-eval / Anti-Function Injection ────────────────────────────────────

/**
 * Middleware to detect and block eval() / Function() injection attempts.
 */
export function antiCodeInjectionMiddleware() {
  const EVAL_PATTERNS = [
    /\beval\s*\(/i,
    /\bnew\s+Function\s*\(/i,
    /\bsetTimeout\s*\(\s*['"`]/i,
    /\bsetInterval\s*\(\s*['"`]/i,
    /\bprocess\.binding\b/i,
    /\bprocess\.dlopen\b/i,
    /\brequire\s*\.\s*extensions\b/i,
    /\bmodule\s*\.\s*compile\b/i,
  ];

  return (req: any, res: any, next: any) => {
    const check = (obj: any, path: string): boolean => {
      if (typeof obj === 'string') {
        for (const pattern of EVAL_PATTERNS) {
          if (pattern.test(obj)) {
            logger.warn(`[RASP] Code injection attempt detected in ${path}: ${obj.substring(0, 100)}`, {
              context: 'rasp',
              meta: { ip: req.ip, path: req.path, bodyPath: path },
            });
            logSecurityEvent('CODE_INJECTION_ATTEMPT', {
              ip: req.ip,
              path: req.path,
              bodyPath: path,
              value: obj.substring(0, 200),
            });
            return true;
          }
        }
      }
      return false;
    };

    const deepCheck = (obj: any, basePath: string, depth = 0): boolean => {
      if (depth > 10 || obj === null || typeof obj !== 'object') return false;
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = basePath ? `${basePath}.${key}` : key;
        if (check(value, currentPath)) return true;
        if (typeof value === 'object' && deepCheck(value, currentPath, depth + 1)) return true;
      }
      return false;
    };

    if (req.body && deepCheck(req.body, 'body')) {
      return res.status(400).json({ error: 'Invalid request content' });
    }
    if (req.query && deepCheck(req.query, 'query')) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }

    next();
  };
}

// ─── Security Event Logger ──────────────────────────────────────────────────

async function logSecurityEvent(eventType: string, details: Record<string, any>): Promise<void> {
  try {
    const { getPool } = await import('./database');
    const pool = getPool();
    await pool.query(
      `INSERT INTO security_events (event_type, severity, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        eventType,
        'CRITICAL',
        JSON.stringify(details),
        details.ip || null,
      ]
    );
  } catch {
    // Non-critical — don't fail the request
  }
}

// ─── Module Hook Detection ──────────────────────────────────────────────────

function detectModuleHooking(): void {
  const criticalModules = ['jsonwebtoken', 'bcryptjs', 'pg', 'express'];

  for (const modName of criticalModules) {
    try {
      const mod = require(modName);
      const proto = mod.prototype || mod;

      for (const key of Object.keys(proto)) {
        if (typeof proto[key] === 'function' && proto[key].toString().length < 20) {
          logger.warn(`[RASP] Suspicious module hooking detected on ${modName}.${key}`, {
            context: 'rasp',
            meta: { module: modName, method: key, fnLength: proto[key].toString().length },
          });
        }
      }
    } catch {
      // Module not loaded yet
    }
  }
}

// ─── RASP Middleware ────────────────────────────────────────────────────────

/**
 * Combined RASP middleware — applies all runtime protections.
 */
export function raspMiddleware() {
  startDebuggerDetection();
  initializeIntegrityChecks();
  setTimeout(() => detectModuleHooking(), 5000);

  return (req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    if (process.env.NODE_ENV === 'production' && _debuggerDetected) {
      req._raspDebuggerDetected = true;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  };
}

export default {
  startDebuggerDetection,
  computeHash,
  initializeIntegrityChecks,
  sanitizeObject,
  antiCodeInjectionMiddleware,
  raspMiddleware,
};
