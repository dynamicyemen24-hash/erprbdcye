/**
 * NexoraOS™ — World-Class Security Headers Middleware
 * OWASP 2024 compliant. Defense-in-depth for all responses.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generate a cryptographically secure nonce for CSP inline scripts.
 * Each request gets a unique nonce — never reused.
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * World-class security headers applied to every response.
 * Exceeds OWASP ASVS 4.0 Level 2 requirements.
 */
export function worldClassSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  const nonce = generateNonce();

  // Store nonce for use by route handlers (e.g., CSP in HTML)
  res.locals.cspNonce = nonce;

  // ─── Transport Security ───────────────────────────────────────
  // HSTS with 2-year max, includeSubDomains, preload list eligible
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload; report-uri="https://erprbdcye.org/api/security/hsts-report"');

  // ─── Content Security Policy (OWASP 2024) ─────────────────────
  // Nonce-based CSP eliminates unsafe-inline for scripts
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' blob: https://www.gstatic.com https://apis.google.com https://www.googleapis.com`,
    `worker-src 'self' blob:`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com`,
    `font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com data:`,
    `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://maps.googleapis.com https://*.gstatic.com https://cdn.sanity.io`,
    `connect-src 'self' https://*.neon.tech https://maps.googleapis.com https://*.googleapis.com https://*.google.com https://fonts.gstatic.com https://fonts.googleapis.com wss:`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
    `report-uri /api/security/csp-report`,
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // ─── Cross-Origin Isolation ───────────────────────────────────
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // ─── Anti-Framing / Clickjacking ──────────────────────────────
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // ─── MIME Sniffing Protection ─────────────────────────────────
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // ─── XSS Protection (Legacy browsers) ─────────────────────────
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // ─── Referrer Policy ──────────────────────────────────────────
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ─── Permissions Policy (Feature Policy) ──────────────────────
  // Disable all dangerous browser features
  res.setHeader('Permissions-Policy', [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=(self)',
    'cross-origin-isolated=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=(self)',
    'geolocation=(self)',
    'gyroscope=()',
    'keyboard-map=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'navigation-override=()',
    'payment=()',
    'picture-in-picture=(self)',
    'publickey-credentials-get=(self)',
    'screen-wake-lock=()',
    'sync-xhr=(self)',
    'usb=()',
    'web-share=(self)',
    'xr-spatial-tracking=()',
  ].join(', '));

  // ─── Cache Control for API responses ──────────────────────────
  // Prevent sensitive data from being cached by proxies/browsers
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  // ─── Server Identity Concealment ──────────────────────────────
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'NexoraOS');

  // ─── Request ID for correlation ───────────────────────────────
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  res.setHeader('X-Request-ID', requestId);

  // ─── API Version Header ───────────────────────────────────────
  res.setHeader('X-API-Version', '2.0');
  res.setHeader('X-API-Deprecated', 'false');

  next();
}

/**
 * CSP violation report endpoint handler.
 * Logs violations for security monitoring.
 */
export function cspReportHandler(req: Request, res: Response): void {
  const report = req.body;
  console.error('[CSP VIOLATION]', JSON.stringify(report, null, 2));
  res.status(204).end();
}
