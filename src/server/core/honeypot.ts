/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Honeypot & Trap System
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Decoy endpoints and fake resources that detect and log attacker activity.
 * Any legitimate user should never access these endpoints.
 *
 * Traps include:
 * - Fake admin panels
 * - Decoy API endpoints
 * - Fake database dumps
 * - Canary tokens in fake records
 * - Port scan detection
 * - Directory enumeration traps
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import logger from './logger';

const router = Router();

// ─── Honeypot Logging ───────────────────────────────────────────────────────

interface HoneypotEvent {
  timestamp: Date;
  path: string;
  method: string;
  ip: string;
  userAgent: string;
  headers: Record<string, string>;
  body?: any;
  userId?: string;
}

async function logHoneypotEvent(event: HoneypotEvent): Promise<void> {
  try {
    const { getPool } = await import('../core/database');
    const pool = getPool();
    await pool.query(
      `INSERT INTO security_events (event_type, severity, details, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        'HONEYPOT_ACCESS',
        'CRITICAL',
        JSON.stringify({
          path: event.path,
          method: event.method,
          headers: event.headers,
          body: event.body,
          userId: event.userId,
        }),
        event.ip,
        event.userAgent,
      ]
    );
  } catch {
    // Non-critical
  }

  logger.error(`[HONEYPOT] Access to decoy resource: ${event.method} ${event.path}`, {
    context: 'honeypot',
    meta: {
      ip: event.ip,
      userAgent: event.userAgent,
      path: event.path,
      method: event.method,
    },
  });
}

function honeypotHandler(req: Request, res: Response): void {
  const event: HoneypotEvent = {
    timestamp: new Date(),
    path: req.path,
    method: req.method,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    headers: {
      host: req.get('host') || '',
      referer: req.get('referer') || '',
      authorization: req.get('authorization') ? '[REDACTED]' : '',
      cookie: req.get('cookie') ? '[REDACTED]' : '',
    },
    body: req.body,
    userId: (req as any).user?.id,
  };

  logHoneypotEvent(event);

  // Return realistic-looking but fake response to keep attacker engaged
  const delay = Math.floor(Math.random() * 2000) + 500; // 500-2500ms delay
  setTimeout(() => {
    res.status(200).json({
      status: 'success',
      message: 'Operation completed',
      data: {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });
  }, delay);
}

// ─── Fake Admin Endpoints ───────────────────────────────────────────────────

// Fake admin login panel
router.all('/admin', honeypotHandler);
router.all('/admin/login', honeypotHandler);
router.all('/admin/dashboard', honeypotHandler);
router.all('/admin/users', honeypotHandler);
router.all('/admin/settings', honeypotHandler);
router.all('/administrator', honeypotHandler);
router.all('/wp-admin', honeypotHandler);
router.all('/wp-login.php', honeypotHandler);

// ─── Fake Database Endpoints ────────────────────────────────────────────────

router.all('/db', honeypotHandler);
router.all('/database', honeypotHandler);
router.all('/phpmyadmin', honeypotHandler);
router.all('/adminer', honeypotHandler);
router.all('/sql', honeypotHandler);
router.all('/mysql', honeypotHandler);

// ─── Fake Configuration Endpoints ───────────────────────────────────────────

router.all('/config', honeypotHandler);
router.all('/.env', honeypotHandler);
router.all('/env', honeypotHandler);
router.all('/environment', honeypotHandler);
router.all('/.git', honeypotHandler);
router.all('/.git/config', honeypotHandler);
router.all('/.git/HEAD', honeypotHandler);
router.all('/backup', honeypotHandler);
router.all('/backups', honeypotHandler);
router.all('/dump', honeypotHandler);

// ─── Fake API Endpoints ─────────────────────────────────────────────────────

router.all('/api/v1/legacy', honeypotHandler);
router.all('/api/debug', honeypotHandler);
router.all('/api/test', honeypotHandler);
router.all('/api/internal', honeypotHandler);
router.all('/api/private', honeypotHandler);
router.all('/api/secret', honeypotHandler);
router.all('/api/token', honeypotHandler);
router.all('/api/key', honeypotHandler);

// ─── Fake Server Info Endpoints ─────────────────────────────────────────────

router.all('/server-info', honeypotHandler);
router.all('/server-status', honeypotHandler);
router.all('/info', honeypotHandler);
router.all('/status', honeypotHandler);
router.all('/metrics', honeypotHandler);
router.all('/prometheus', honeypotHandler);
router.all('/actuator', honeypotHandler);
router.all('/actuator/env', honeypotHandler);
router.all('/actuator/health', honeypotHandler);

// ─── Fake File Endpoints ────────────────────────────────────────────────────

router.all('/robots.txt', (req: Request, res: Response) => {
  logHoneypotEvent({
    timestamp: new Date(),
    path: req.path,
    method: req.method,
    ip: req.ip || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    headers: {},
  });

  // Return a fake robots.txt with trap paths
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *
Disallow: /admin
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /api/debug
Disallow: /api/internal
Disallow: /api/secret
Disallow: /db
Disallow: /database
Disallow: /config
Disallow: /.env
Disallow: /backup
Disallow: /server-info
Sitemap: https://nexoraos.example.com/sitemap.xml`);
});

// ─── Port Scan Detection ────────────────────────────────────────────────────

const portScanAttempts = new Map<string, { ports: Set<number>; firstSeen: Date }>();

/**
 * Detect port scanning behavior.
 * If a client hits multiple unusual ports, it's likely a scan.
 */
export function detectPortScan(ip: string, port: number): { isScan: boolean; portCount: number } {
  const STANDARD_PORTS = new Set([80, 443, 3000, 5173, 8080, 8443]);

  if (STANDARD_PORTS.has(port)) return { isScan: false, portCount: 0 };

  let record = portScanAttempts.get(ip);
  if (!record) {
    record = { ports: new Set(), firstSeen: new Date() };
    portScanAttempts.set(ip, record);
  }

  record.ports.add(port);

  // If more than 5 unusual ports in 5 minutes, it's a scan
  const elapsed = Date.now() - record.firstSeen.getTime();
  if (record.ports.size > 5 && elapsed < 5 * 60 * 1000) {
    return { isScan: true, portCount: record.ports.size };
  }

  return { isScan: false, portCount: record.ports.size };
}

// ─── Directory Enumeration Traps ────────────────────────────────────────────

const enumerationTraps = new Set([
  '/admin/',
  '/admin/config',
  '/admin/db',
  '/wp-content/',
  '/wp-includes/',
  '/vendor/',
  '/node_modules/',
  '/.svn/',
  '/.hg/',
  '/CVS/',
  '/WEB-INF/',
  '/META-INF/',
  '/crossdomain.xml',
  '/clientaccesspolicy.xml',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/.well-known/',
]);

/**
 * Check if a path matches a directory enumeration trap.
 */
export function isEnumerationTrap(path: string): boolean {
  return enumerationTraps.has(path.toLowerCase());
}

// ─── Fake Credentials Canary ────────────────────────────────────────────────

/**
 * Generate fake credentials that look real but trigger alerts.
 * Place these in fake config files, environment variables, or database records.
 */
export function generateFakeCredentials(): {
  username: string;
  password: string;
  token: string;
} {
  return {
    username: `admin_${crypto.randomBytes(4).toString('hex')}`,
    password: crypto.randomBytes(24).toString('base64url'),
    token: `fake_token_${crypto.randomBytes(32).toString('hex')}`,
  };
}

// ─── Honeypot Middleware for Express ─────────────────────────────────────────

/**
 * Express middleware that creates invisible honeypot links in HTML responses.
 * These links are hidden via CSS but tracked by the server.
 */
export function honeypotLinkMiddleware() {
  return (req: Request, res: Response, next: () => void) => {
    // Only apply to HTML responses
    const originalSend = res.send;
    res.send = function (body: any) {
      if (typeof body === 'string' && body.includes('</head>')) {
        // Inject invisible honeypot links
        const honeypotLinks = `
<style>.hp-link{position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;}</style>
<a href="/admin" class="hp-link">Admin</a>
<a href="/.env" class="hp-link">Environment</a>
<a href="/config" class="hp-link">Config</a>
<a href="/db" class="hp-link">Database</a>
<a href="/backup" class="hp-link">Backup</a>`;
        body = body.replace('</head>', `${honeypotLinks}</head>`);
      }
      return originalSend.call(this, body);
    };
    next();
  };
}

export default router;
