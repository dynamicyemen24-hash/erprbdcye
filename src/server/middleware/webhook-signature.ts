/**
 * NexoraOS™ — Webhook Signature Verification Middleware
 * HMAC-SHA256 signatures for all inbound webhooks.
 * Prevents webhook spoofing and tampering.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.WEBHOOK_HMAC_SECRET;

/**
 * Verify HMAC-SHA256 signature on incoming webhook requests.
 * Expects header: X-Webhook-Signature: sha256=<hex-digest>
 */
export function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  if (!WEBHOOK_SECRET) {
    // If no secret configured, skip verification (dev mode)
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY] WEBHOOK_SECRET not configured — rejecting webhook in production');
      res.status(503).json({ error: 'Webhook verification not configured' });
      return;
    }
    return next();
  }

  const signature = req.headers['x-webhook-signature'] as string;
  if (!signature) {
    res.status(401).json({ error: 'Missing webhook signature' });
    return;
  }

  // Parse signature format: sha256=<hex-digest>
  const parts = signature.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    res.status(401).json({ error: 'Invalid signature format' });
    return;
  }

  const expectedDigest = parts[1];

  // Compute HMAC over raw body
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const computedDigest = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedDigest, 'hex'),
      Buffer.from(computedDigest, 'hex')
    );

    if (!isValid) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }
  } catch {
    res.status(401).json({ error: 'Invalid signature encoding' });
    return;
  }

  // Signature verified — attach verification metadata
  res.locals.webhookVerified = true;
  res.locals.webhookVerifiedAt = new Date().toISOString();

  next();
}

/**
 * Generate HMAC-SHA256 signature for outbound webhooks.
 * Used by the webhook delivery system.
 */
export function signWebhookPayload(payload: string): string {
  if (!WEBHOOK_SECRET) {
    throw new Error('WEBHOOK_SECRET not configured');
  }
  const digest = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex');
  return `sha256=${digest}`;
}

/**
 * Verify a signature (for testing/debugging).
 */
export function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  const parts = signature.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') return false;

  const computedDigest = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(parts[1], 'hex'),
      Buffer.from(computedDigest, 'hex')
    );
  } catch {
    return false;
  }
}
