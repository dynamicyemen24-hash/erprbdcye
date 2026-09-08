/**
 * NexoraOS™ — World-Class Security Headers for Vercel Serverless Functions
 * OWASP 2024 compliant. Defense-in-depth for all serverless handlers.
 */

import crypto from 'crypto';

const SECURITY_HEADERS: Record<string, string> = {
  // ─── Transport Security ───────────────────────────────────────
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

  // ─── Content Security Policy ──────────────────────────────────
  // Note: For serverless functions, nonce-based CSP is set per-request
  // This is a baseline — individual handlers can override

  // ─── Anti-Framing / Clickjacking ──────────────────────────────
  'X-Frame-Options': 'DENY',
  'X-Permitted-Cross-Domain-Policies': 'none',

  // ─── MIME Sniffing Protection ─────────────────────────────────
  'X-Content-Type-Options': 'nosniff',

  // ─── XSS Protection (Legacy) ──────────────────────────────────
  'X-XSS-Protection': '1; mode=block',

  // ─── Referrer Policy ──────────────────────────────────────────
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // ─── Cross-Origin Isolation ───────────────────────────────────
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',

  // ─── Permissions Policy ───────────────────────────────────────
  'Permissions-Policy': [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'display-capture=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'geolocation=(self)',
    'gyroscope=()',
    'keyboard-map=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=()',
    'picture-in-picture=(self)',
    'publickey-credentials-get=(self)',
    'screen-wake-lock=()',
    'sync-xhr=(self)',
    'usb=()',
    'web-share=(self)',
    'xr-spatial-tracking=()',
  ].join(', '),

  // ─── Cache Control (API responses) ────────────────────────────
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',

  // ─── Server Identity ──────────────────────────────────────────
  'Server': 'NexoraOS',
};

/**
 * Generate a cryptographically secure nonce for CSP.
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Apply world-class security headers to a Vercel serverless response.
 * Also sets CSP with nonce for inline scripts.
 */
export function applySecurityHeaders(res: any, nonce?: string): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }

  // CSP with nonce
  const cspNonce = nonce || generateNonce();
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${cspNonce}' 'strict-dynamic' https://www.gstatic.com https://apis.google.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://maps.googleapis.com`,
    `connect-src 'self' https://*.neon.tech https://maps.googleapis.com https://*.googleapis.com`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // Request ID for correlation
  res.setHeader('X-Request-ID', crypto.randomUUID());

  // API version
  res.setHeader('X-API-Version', '2.0');
}

/**
 * Shared CORS origin resolution — fail-closed in production when no allowlist.
 */
export function resolveCorsOrigin(reqOrigin: string | undefined): string | null {
  const raw = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '';
  const allowlist = raw.split(',').map(o => o.trim()).filter(Boolean);

  if (allowlist.length === 0) {
    return process.env.NODE_ENV === 'production' ? null : '*';
  }

  // In production, reject requests with no Origin header on credential-bearing endpoints
  if (!reqOrigin) {
    return process.env.NODE_ENV === 'production' ? null : allowlist[0];
  }

  // Strict origin matching — no substring matching
  return allowlist.includes(reqOrigin) ? reqOrigin : null;
}

/**
 * Set CORS + security headers on a response. Returns true if the request should proceed.
 */
export function initServerlessCors(req: any, res: any): boolean {
  const corsOrigin = resolveCorsOrigin(req.headers?.origin);
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id, x-api-version');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  return true;
}
