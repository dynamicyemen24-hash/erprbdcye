import { Request, Response, NextFunction } from 'express';
import { serverConfig } from '../config';

const METHODS_REQUIRING_CSRF = ['POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * CSRF protection for JWT+SPA architecture.
 * Validates Origin/Referer headers on state-changing requests.
 * Requests missing BOTH Origin and Referer are rejected (potential CSRF or API attack).
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (!METHODS_REQUIRING_CSRF.includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin as string | undefined;
  const referer = req.headers.referer as string | undefined;

  // Reject requests missing both headers - potential CSRF or API attack
  if (!origin && !referer) {
    res.status(403).json({
      success: false,
      error: 'CSRF validation failed: missing Origin and Referer headers'
    });
    return;
  }

  const allowedOrigins: string[] =
    serverConfig.allowedOrigins ||
    (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

  // In development with no configured origins, allow all
  if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check Origin header first (most reliable), then Referer
  let incoming = origin || '';
  if (!origin && referer) {
    try {
      incoming = new URL(referer).origin;
    } catch {
      res.status(403).json({ error: 'CSRF validation failed: malformed Referer header' });
      return;
    }
  }

  if (incoming && allowedOrigins.includes(incoming)) {
    return next();
  }

  res.status(403).json({ error: 'CSRF validation failed: origin not allowed' });
}
