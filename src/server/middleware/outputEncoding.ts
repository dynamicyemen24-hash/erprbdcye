/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Output Encoding & Content Security
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Protects against:
 * - Content-Type sniffing attacks
 * - XSS via response injection
 * - Clickjacking via frame embedding
 * - MIME confusion attacks
 * - Cache poisoning
 * - Information leakage via error messages
 */

// ─── Content Security Headers ───────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'X-DNS-Prefetch-Control': 'off',
};

const HSTS_HEADER = 'Strict-Transport-Security';
const HSTS_VALUE = 'max-age=63072000; includeSubDomains; preload';

// ─── Response Security Middleware ────────────────────────────────────────────

/**
 * Middleware that adds security headers to all responses.
 */
export function outputSecurityMiddleware() {
  return (req: any, res: any, next: () => void) => {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      res.setHeader(key, value);
    }

    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader(HSTS_HEADER, HSTS_VALUE);
    }

    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      const sanitized = stripSensitiveFields(data);
      return originalJson(sanitized);
    };

    next();
  };
}

// ─── Sensitive Field Stripping ──────────────────────────────────────────────

const SENSITIVE_PATTERNS = [
  /password/i, /secret/i, /token/i, /key/i, /hash/i,
  /salt/i, /private/i, /credential/i, /ssn/i, /credit.?card/i,
  /otp/i, /totp/i, /mfa/i, /2fa/i,
];

const SENSITIVE_FIELDS = new Set([
  'password', 'password_hash', 'passwordHash', 'hashedPassword',
  'secret', 'secret_key', 'secretKey',
  'api_key', 'apiKey', 'API_KEY',
  'access_token', 'accessToken',
  'refresh_token', 'refreshToken',
  'private_key', 'privateKey',
  'otp_secret', 'otpSecret',
  'totp_secret', 'totpSecret',
  'credit_card', 'creditCard',
  'ssn', 'social_security',
]);

/**
 * Strip sensitive fields from response data.
 */
export function stripSensitiveFields(data: any, depth = 0): any {
  if (depth > 20 || data === null || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => stripSensitiveFields(item, depth + 1));
  }

  const clean: any = {};
  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();

    if (SENSITIVE_FIELDS.has(keyLower)) {
      clean[key] = '[REDACTED]';
      continue;
    }

    if (SENSITIVE_PATTERNS.some(p => p.test(key))) {
      clean[key] = '[REDACTED]';
      continue;
    }

    clean[key] = stripSensitiveFields(value, depth + 1);
  }

  return clean;
}

export default {
  outputSecurityMiddleware,
  stripSensitiveFields,
};
