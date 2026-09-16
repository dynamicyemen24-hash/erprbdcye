/**
 * NexoraOS™ — Auth Cookie Helpers (HttpOnly dual transport)
 * Access/refresh JWTs are issued BOTH as JSON body fields (existing SPA flow,
 * backward compatible) AND as HttpOnly cookies (XSS-resistant). Every auth
 * check accepts Bearer first, then the `nx_at` cookie.
 */

import { Request, Response } from 'express';

export const ACCESS_COOKIE = 'nx_at';
export const REFRESH_COOKIE = 'nx_rt';

const isProd = () => process.env.NODE_ENV === 'production';

function baseOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeMs,
  };
}

function parseExpiryToMs(expiresIn: string | undefined, fallbackMs: number): number {
  if (!expiresIn) return fallbackMs;
  const m = /^(\d+)([smhd])$/.exec(expiresIn.trim());
  if (!m) return fallbackMs;
  const n = parseInt(m[1], 10);
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]] ?? 0;
  return mult ? n * mult : fallbackMs;
}

export function setAuthCookies(
  res: Response,
  token: string,
  refreshToken?: string,
  accessExpiresIn?: string,
  refreshExpiresIn?: string,
): void {
  try {
    res.cookie(ACCESS_COOKIE, token, baseOptions(parseExpiryToMs(accessExpiresIn, 3600000)));
    if (refreshToken) {
      res.cookie(REFRESH_COOKIE, refreshToken, baseOptions(parseExpiryToMs(refreshExpiresIn, 7 * 86400000)));
    }
  } catch {
    // Cookie failure must never break the JSON token flow
  }
}

export function clearAuthCookies(res: Response): void {
  // Mirror the attributes used at issuance — otherwise a Secure/HttpOnly/
  // SameSite cookie set over HTTPS survives logout (path-only clear misses).
  const opts = {
    path: '/',
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax' as const,
  };
  try {
    res.clearCookie(ACCESS_COOKIE, opts);
    res.clearCookie(REFRESH_COOKIE, opts);
  } catch { /* ignore */ }
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  }
  return out;
}

/** Bearer token first, HttpOnly cookie second. */
export function getRequestToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1] || null;
  }
  return parseCookies(req)[ACCESS_COOKIE] || null;
}

export function getRefreshToken(req: Request): string | null {
  if (req.body && typeof req.body.refreshToken === 'string' && req.body.refreshToken) {
    return req.body.refreshToken;
  }
  return parseCookies(req)[REFRESH_COOKIE] || null;
}
