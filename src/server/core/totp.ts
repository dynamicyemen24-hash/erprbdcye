/**
 * NexoraOS™ — Server-Side TOTP (RFC 4226 / RFC 6238, SHA-1, 30s, 6 digits)
 * Zero-dependency implementation so MFA enforcement never depends on an
 * optional package. Secrets are base32 (otpauth:// compatible with
 * Google Authenticator / Authy / 1Password).
 */

import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(bytes = 20): string {
  const buf = crypto.randomBytes(bytes);
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    out += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input
    .replace(/=+$/, '')
    .toUpperCase()
    .replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const c of clean) {
    bits += BASE32_ALPHABET.indexOf(c).toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: bigint): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(counter);
  const hmac = crypto.createHmac('sha1', secret).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, '0');
}

/** Verify a 6-digit code with ±window time-step tolerance (default ±1). */
export function verifyTotp(secretBase32: string, code: string, window = 1, stepSeconds = 30): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  let secret: Buffer;
  try {
    secret = base32Decode(secretBase32);
  } catch {
    return false;
  }
  if (secret.length === 0) return false;
  const nowStep = BigInt(Math.floor(Date.now() / 1000 / stepSeconds));
  for (let drift = -window; drift <= window; drift++) {
    const candidate = hotp(secret, nowStep + BigInt(drift));
    if (crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(code))) return true;
  }
  return false;
}

export function otpauthUrl(secretBase32: string, label: string, issuer = 'NexoraOS'): string {
  const encLabel = encodeURIComponent(`${issuer}:${label}`);
  return `otpauth://totp/${encLabel}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30&algorithm=SHA1`;
}
