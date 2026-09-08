/**
 * NexoraOS™ — Field-Level Encryption Engine
 * AES-256-GCM encryption for PII fields at rest.
 * Supports automatic encrypt/decrypt on read/write operations.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Encryption key from environment (must be 32 bytes / 256 bits)
const MASTER_KEY = process.env.FIELD_ENCRYPTION_KEY || process.env.JWT_SECRET;

if (!MASTER_KEY) {
  console.error('[SECURITY] FIELD_ENCRYPTION_KEY not set — field encryption disabled');
}

/**
 * Derive a 256-bit key from the master key using PBKDF2.
 */
function deriveKey(salt: Buffer): Buffer {
  if (!MASTER_KEY) throw new Error('FIELD_ENCRYPTION_KEY not configured');
  return crypto.pbkdf2Sync(MASTER_KEY, salt, 100000, 32, 'sha512');
}

/**
 * Encrypt a plaintext value with AES-256-GCM.
 * Returns: base64(salt + iv + tag + ciphertext)
 */
export function encryptField(plaintext: string): string {
  if (!MASTER_KEY) return plaintext; // Passthrough if not configured

  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Combine: salt + iv + tag + ciphertext
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt an encrypted value.
 * Input: base64(salt + iv + tag + ciphertext)
 */
export function decryptField(ciphertext: string): string {
  if (!MASTER_KEY) return ciphertext; // Passthrough if not configured

  try {
    const combined = Buffer.from(ciphertext, 'base64');

    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = deriveKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (err: any) {
    console.error('[ENCRYPTION] Decryption failed:', err.message);
    return ciphertext; // Return as-is if decryption fails
  }
}

/**
 * PII field definitions — fields that must be encrypted at rest.
 */
const PII_FIELDS = new Set([
  'national_id',
  'passport_number',
  'social_security_number',
  'bank_account',
  'credit_card',
  'phone',
  'email',
  'address',
  'date_of_birth',
  'medical_record',
  'biometric_data',
  'tax_id',
  'iban',
  'swift_code',
]);

/**
 * Check if a field name contains PII.
 */
export function isPIIField(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase().replace(/[_-]/g, '');
  for (const pii of PII_FIELDS) {
    if (normalized.includes(pii.replace(/[_-]/g, ''))) {
      return true;
    }
  }
  return false;
}

/**
 * Auto-encrypt PII fields in an object.
 */
export function encryptPIIFields<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && isPIIField(key)) {
      (result as any)[key] = encryptField(value);
    }
  }
  return result;
}

/**
 * Auto-decrypt PII fields in an object.
 */
export function decryptPIIFields<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && isPIIField(key) && looksEncrypted(value)) {
      (result as any)[key] = decryptField(value);
    }
  }
  return result;
}

/**
 * Check if a string looks like an encrypted value.
 */
function looksEncrypted(value: string): boolean {
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length > SALT_LENGTH + IV_LENGTH + TAG_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Express middleware that encrypts PII fields in request body.
 */
export function encryptPIIMiddleware(req: any, res: any, next: any): void {
  if (req.body && typeof req.body === 'object') {
    req.body = encryptPIIFields(req.body);
  }
  next();
}

/**
 * Express middleware that decrypts PII fields in response body.
 */
export function decryptPIIMiddleware(req: any, res: any, next: any): void {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (body && typeof body === 'object') {
      body = decryptPIIFields(body);
    }
    return originalJson(body);
  };
  next();
}

/**
 * Utility: encrypt a specific value (for manual use).
 */
export function encrypt(value: string): string {
  return encryptField(value);
}

/**
 * Utility: decrypt a specific value (for manual use).
 */
export function decrypt(value: string): string {
  return decryptField(value);
}
