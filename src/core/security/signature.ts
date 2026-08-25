// NEB-10: Finance & Compliance OS - Digital Signature Service
// Real HMAC-SHA256 signatures via Web Crypto. Each user holds a persisted
// 256-bit signing key (device-local). The key fingerprint recorded on each
// signature is the SHA-256 of the raw key material, so signatures are fully
// verifiable on the same device and tamper-evident everywhere.
// NOTE: keys never leave the browser; server-side countersigning would be
// required for third-party verification.
export interface DigitalSignature {
  hash: string;
  timestamp: string;
  user_id: string;
  signature_algorithm: 'HMAC-SHA256';
  public_key_fingerprint: string;
}

const KEY_PREFIX = 'nexora_sig_key_';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getUserKeyMaterial(userId: string): Promise<{ raw: Uint8Array; fingerprint: string }> {
  const storageKey = `${KEY_PREFIX}${userId}`;
  let rawB64 = localStorage.getItem(storageKey);
  if (!rawB64) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    rawB64 = btoa(String.fromCharCode(...bytes));
    localStorage.setItem(storageKey, rawB64);
  }
  const raw = Uint8Array.from(atob(rawB64), c => c.charCodeAt(0));
  const fpBuffer = await crypto.subtle.digest('SHA-256', raw as unknown as ArrayBuffer);
  return { raw, fingerprint: toHex(fpBuffer).slice(0, 32) };
}

export async function createSignature(userId: string, data: string): Promise<DigitalSignature> {
  const { raw, fingerprint } = await getUserKeyMaterial(userId);
  const timestamp = new Date().toISOString();
  const encoder = new TextEncoder();
  const payload = encoder.encode(`${data}|${userId}|${timestamp}`);

  const key = await crypto.subtle.importKey(
    'raw',
    raw as unknown as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, payload as unknown as ArrayBuffer);

  return {
    hash: toHex(sigBuffer),
    timestamp,
    user_id: userId,
    signature_algorithm: 'HMAC-SHA256',
    public_key_fingerprint: fingerprint
  };
}

export async function verifySignature(signature: DigitalSignature, data: string): Promise<boolean> {
  if (!signature?.hash || !signature.timestamp || !signature.user_id) return false;
  try {
    const { raw } = await getUserKeyMaterial(signature.user_id);
    const encoder = new TextEncoder();
    const payload = encoder.encode(`${data}|${signature.user_id}|${signature.timestamp}`);
    const key = await crypto.subtle.importKey(
      'raw',
      raw as unknown as ArrayBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expected = toHex(await crypto.subtle.sign('HMAC', key, payload as unknown as ArrayBuffer));
    // Length-safe comparison
    if (expected.length !== signature.hash.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.hash.charCodeAt(i);
    return diff === 0;
  } catch {
    return false;
  }
}
