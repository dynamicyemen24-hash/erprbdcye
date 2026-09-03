// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Quantum-Ready Security Engine
// Post-Quantum Cryptography + Zero-Trust Architecture + Security Events
// ═══════════════════════════════════════════════════════════════════

import { createHash, randomBytes, createHmac, createCipheriv, createDecipheriv, randomUUID } from 'crypto';
import { query, transaction } from '../core/database.js';
import { logger } from '../core/logger.js';
import {
  PQCAlgorithm, PQCKeyPair, QuantumSafeEnvelope, ZeroTrustSession,
  SecurityEvent, ZeroTrustPolicy, PQCAlgorithm as PQCT
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════

const ALGORITHM_KEY_SIZES: Record<PQCAlgorithm, { kem: number; sig: number }> = {
  'KYBER_512': { kem: 800, sig: 0 },
  'KYBER_768': { kem: 1184, sig: 0 },
  'KYBER_1024': { kem: 1568, sig: 0 },
  'DILITHIUM_2': { kem: 0, sig: 2420 },
  'DILITHIUM_3': { kem: 0, sig: 3293 },
  'DILITHIUM_5': { kem: 0, sig: 4595 },
  'FALCON_512': { kem: 0, sig: 666 },
  'FALCON_1024': { kem: 0, sig: 1281 },
  'SPHINCS_SHA2_128F': { kem: 0, sig: 4980 },
  'SPHINCS_SHA2_256F': { kem: 0, sig: 29786 },
  'HYBRID_X25519_KYBER768': { kem: 1184, sig: 0 },
};

const KEY_ROTATION_DAYS: Record<PQCAlgorithm, number> = {
  'KYBER_512': 90,
  'KYBER_768': 90,
  'KYBER_1024': 90,
  'DILITHIUM_2': 180,
  'DILITHIUM_3': 180,
  'DILITHIUM_5': 180,
  'FALCON_512': 180,
  'FALCON_1024': 180,
  'SPHINCS_SHA2_128F': 365,
  'SPHINCS_SHA2_256F': 365,
  'HYBRID_X25519_KYBER768': 90,
};

const SECURITY_EVENT_SEVERITY_SCORES: Record<string, number> = {
  'login': 10,
  'logout': 5,
  'mfa_challenge': 15,
  'permission_denied': 25,
  'data_access': 20,
  'configuration_change': 40,
  'quantum_key_rotation': 30,
  'anomaly_detected': 60,
};

const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
  CRITICAL: 95,
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function generateKeyId(): string {
  return `pqc_${randomBytes(16).toString('hex')}`;
}

function generateSessionId(): string {
  return `zts_${randomUUID()}`;
}

function generateEventId(): string {
  return `sec_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

function toErrorObject(err: unknown): { name: string; message: string; stack?: string; code?: string } {
  if (err instanceof Error) {
    const e = err as Error & { code?: string };
    return { name: e.name, message: e.message, stack: e.stack, code: e.code };
  }
  return { name: 'UnknownError', message: String(err) };
}

/**
 * Simulate PQC key generation (in production, use liboqs bindings)
 * This generates mock keys for demonstration - real implementation would use
 * actual PQC libraries like liboqs, openssl-pq, or AWS-LC-PQ
 */
function simulatePQCKeyGeneration(algorithm: PQCAlgorithm): { publicKey: string; privateKey: string } {
  const sizes = ALGORITHM_KEY_SIZES[algorithm];
  const publicKeySize = sizes.kem || sizes.sig;
  
  const publicKey = randomBytes(publicKeySize).toString('base64');
  const privateKey = randomBytes(publicKeySize * 2).toString('base64');
  
  return { publicKey, privateKey };
}

/**
 * Simulate PQC encapsulation/decapsulation
 */
function simulatePQCEncapsulate(publicKey: string): { ciphertext: string; sharedSecret: string } {
  const ciphertext = randomBytes(32).toString('base64');
  const sharedSecret = createHash('sha256').update(publicKey + ciphertext).digest();
  return { ciphertext, sharedSecret: sharedSecret.toString('base64') };
}

function simulatePQCDecapsulate(privateKey: string, ciphertext: string): string {
  const sharedSecret = createHash('sha256').update(privateKey + ciphertext).digest();
  return sharedSecret.toString('base64');
}

/**
 * Compute device fingerprint from request headers
 */
function computeDeviceFingerprint(req: any): string {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.ip || '',
  ];
  return createHash('sha256').update(components.join('|')).digest('hex').slice(0, 32);
}

/**
 * Calculate trust score based on session attributes
 */
function calculateTrustScore(session: {
  mfaVerified: boolean;
  deviceCompliant: boolean;
  networkCompliant: boolean;
  anomalyScore: number;
}): { score: number; level: ZeroTrustSession['trustLevel'] } {
  let score = 100;
  
  if (!session.mfaVerified) score -= 40;
  if (!session.deviceCompliant) score -= 30;
  if (!session.networkCompliant) score -= 20;
  score -= session.anomalyScore;
  
  score = Math.max(0, Math.min(100, score));
  
  let level: ZeroTrustSession['trustLevel'];
  if (score >= RISK_THRESHOLDS.HIGH) level = 'high';
  else if (score >= RISK_THRESHOLDS.MEDIUM) level = 'medium';
  else if (score >= RISK_THRESHOLDS.LOW) level = 'low';
  else level = 'critical';
  
  return { score, level };
}

// ═══════════════════════════════════════════════════════════════════
// QUANTUM-CRYPTO ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════

export class QuantumCryptoEngine {
  private defaultAlgorithm: PQCAlgorithm = 'HYBRID_X25519_KYBER768';
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.PQC_MASTER_KEY || randomBytes(32).toString('hex');
    logger.info(`🔐 Quantum-Ready Security Engine initialized (default: ${this.defaultAlgorithm})`, {
      context: 'QuantumCryptoEngine'
    });
  }

  /**
   * Generate a new PQC key pair
   */
  async generateKeyPair(
    tenantId: string,
    algorithm: PQCAlgorithm = 'KYBER_768',
    usage: 'kem' | 'signature' | 'both' = 'kem'
  ): Promise<PQCKeyPair> {
    const keyId = generateKeyId();
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + KEY_ROTATION_DAYS[algorithm]);

    const { publicKey, privateKey } = simulatePQCKeyGeneration(algorithm);
    const sizes = ALGORITHM_KEY_SIZES[algorithm];

    try {
      await query(`
        INSERT INTO pqc_key_pairs (
          key_id, algorithm, public_key, private_key_encrypted, key_size,
          created_at, expires_at, status, usage, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        keyId,
        algorithm,
        publicKey,
        this.encryptPrivateKey(privateKey),
        sizes.kem || sizes.sig,
        now.toISOString(),
        expiresAt.toISOString(),
        'active',
        usage,
        tenantId
      ]);

      logger.info(`PQC key pair generated: ${algorithm}`, {
        context: 'QuantumCryptoEngine'
      });

      return {
        keyId,
        algorithm,
        publicKey,
        privateKey,
        keySize: sizes.kem || sizes.sig,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active',
        usage,
        tenantId
      };

    } catch (err) {
      logger.error('Failed to generate PQC key pair', { 
        error: toErrorObject(err),
        context: 'QuantumCryptoEngine' 
      });
      throw err;
    }
  }

  /**
   * Rotate PQC keys for a tenant
   */
  async rotateKeys(tenantId: string, algorithm?: PQCAlgorithm): Promise<PQCKeyPair[]> {
    const alg = algorithm || this.defaultAlgorithm;
    const newKeys: PQCKeyPair[] = [];

    try {
      await transaction(async (client) => {
        // Mark existing keys as rotating
        await client.query(`
          UPDATE pqc_key_pairs 
          SET status = 'rotating', updated_at = $2
          WHERE tenant_id = $1 AND status = 'active'
        `, [tenantId, new Date().toISOString()]);

        // Record security event
        await this.recordSecurityEvent(tenantId, undefined, 'quantum_key_rotation', 'high', {
          algorithm: alg,
          previousKeysRetired: true
        });
      });

      // Generate new key pair
      const newKeyPair = await this.generateKeyPair(tenantId, alg);
      newKeys.push(newKeyPair);

      logger.info(`PQC keys rotated (algorithm: ${alg})`, {
        context: 'QuantumCryptoEngine'
      });

      return newKeys;

    } catch (err) {
      logger.error('Failed to rotate PQC keys', { 
        error: toErrorObject(err),
        context: 'QuantumCryptoEngine' 
      });
      throw err;
    }
  }

  /**
   * Encrypt data with quantum-safe envelope
   */
  async encryptQuantumSafe(
    tenantId: string,
    plaintext: string,
    recipientKeyId?: string
  ): Promise<QuantumSafeEnvelope> {
    const envelopeId = `qse_${randomBytes(8).toString('hex')}`;

    try {
      // Get or generate recipient key
      let publicKey: string;
      let keyId = recipientKeyId;

      if (!keyId) {
        const activeKeys = await query(`
          SELECT key_id, public_key FROM pqc_key_pairs 
          WHERE tenant_id = $1 AND status = 'active' AND usage IN ('kem', 'both')
          ORDER BY created_at DESC LIMIT 1
        `, [tenantId]);

        if (activeKeys.rows.length === 0) {
          const newKey = await this.generateKeyPair(tenantId);
          keyId = newKey.keyId;
          publicKey = newKey.publicKey;
        } else {
          keyId = activeKeys.rows[0].key_id;
          publicKey = activeKeys.rows[0].public_key;
        }
      } else {
        const key = await query(`
          SELECT public_key FROM pqc_key_pairs WHERE key_id = $1
        `, [keyId]);
        publicKey = key.rows[0]?.public_key;
      }

      // Simulate PQC encapsulation
      const { ciphertext, sharedSecret } = simulatePQCEncapsulate(publicKey);

      // Derive AES-256-GCM key from shared secret
      const aesKey = createHash('sha256').update(sharedSecret).digest();
      const iv = randomBytes(12);
      
      const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      const authTag = cipher.getAuthTag();

      const envelope: QuantumSafeEnvelope = {
        envelopeId,
        algorithm: this.defaultAlgorithm,
        ciphertext: encrypted,
        encapsulatedKey: ciphertext,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        createdAt: new Date().toISOString(),
        recipientKeyId: keyId || ''
      };

      logger.info(`Quantum-safe encryption completed (${envelopeId})`, {
        context: 'QuantumCryptoEngine'
      });

      return envelope;

    } catch (err) {
      logger.error('Quantum-safe encryption failed', { 
        error: toErrorObject(err),
        context: 'QuantumCryptoEngine' 
      });
      throw err;
    }
  }

  /**
   * Decrypt quantum-safe envelope
   */
  async decryptQuantumSafe(
    tenantId: string,
    envelope: QuantumSafeEnvelope
  ): Promise<string> {
    try {
      // Get private key
      const keyResult = await query(`
        SELECT private_key_encrypted FROM pqc_key_pairs 
        WHERE key_id = $1 AND tenant_id = $2 AND status IN ('active', 'rotating')
      `, [envelope.recipientKeyId, tenantId]);

      if (keyResult.rows.length === 0) {
        throw new Error('Private key not found');
      }

      const encryptedPrivateKey = keyResult.rows[0].private_key_encrypted;
      const privateKey = this.decryptPrivateKey(encryptedPrivateKey);

      // Simulate PQC decapsulation
      const sharedSecret = simulatePQCDecapsulate(privateKey, envelope.encapsulatedKey || '');

      // Derive AES key and decrypt
      const aesKey = createHash('sha256').update(sharedSecret).digest();
      const iv = Buffer.from(envelope.iv, 'base64');
      const authTag = Buffer.from(envelope.authTag, 'base64');

      const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(envelope.ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      logger.info(`Quantum-safe decryption completed`, {
        context: 'QuantumCryptoEngine'
      });

      return decrypted;

    } catch (err) {
      logger.error('Quantum-safe decryption failed', { 
        error: toErrorObject(err),
        context: 'QuantumCryptoEngine' 
      });
      throw err;
    }
  }

  /**
   * Create zero-trust session
   */
  async createZeroTrustSession(
    tenantId: string,
    userId: string,
    req: any,
    policies: ZeroTrustPolicy[] = ['always_verify', 'least_privilege']
  ): Promise<ZeroTrustSession> {
    const sessionId = generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    const deviceFingerprint = computeDeviceFingerprint(req);
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const geoLocation = { 
      country: req.headers['cf-ipcountry'] || 'XX', 
      city: 'Unknown',
      lat: 0, 
      lng: 0 
    };

    // Calculate initial risk score
    let anomalyScore = 0;
    if (policies.includes('assume_breach')) anomalyScore = 30;
    
    const { score: riskScore, level: trustLevel } = calculateTrustScore({
      mfaVerified: false,
      deviceCompliant: false,
      networkCompliant: true,
      anomalyScore
    });

    try {
      await query(`
        INSERT INTO zero_trust_sessions (
          session_id, user_id, tenant_id, device_fingerprint, ip_address,
          geo_location, risk_score, trust_level, policies_applied,
          mfa_verified, device_compliant, network_compliant,
          created_at, expires_at, last_activity_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        sessionId, userId, tenantId, deviceFingerprint, ipAddress,
        JSON.stringify(geoLocation), riskScore, trustLevel,
        JSON.stringify(policies), false, false, true,
        now.toISOString(), expiresAt.toISOString(), now.toISOString()
      ]);

      // Record login event
      await this.recordSecurityEvent(tenantId, userId, 'login', 'info', {
        sessionId,
        deviceFingerprint,
        ipAddress,
        trustLevel
      });

      logger.info(`Zero-trust session created (${trustLevel} trust)`, {
        context: 'QuantumCryptoEngine'
      });

      return {
        sessionId,
        userId,
        tenantId,
        deviceFingerprint,
        ipAddress,
        geoLocation,
        riskScore,
        trustLevel,
        policiesApplied: policies,
        mfaVerified: false,
        deviceCompliant: false,
        networkCompliant: true,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastActivityAt: now.toISOString()
      };

    } catch (err) {
      logger.error('Failed to create zero-trust session', { 
        error: toErrorObject(err),
        context: 'QuantumCryptoEngine' 
      });
      throw err;
    }
  }

  /**
   * Verify zero-trust session and update trust level
   */
  async verifySession(sessionId: string, verificationData: {
    mfaVerified?: boolean;
    deviceCompliant?: boolean;
    networkCompliant?: boolean;
    anomalyDetected?: boolean;
  }): Promise<ZeroTrustSession | null> {
    try {
      const sessionResult = await query(`
        SELECT * FROM zero_trust_sessions WHERE session_id = $1
      `, [sessionId]);

      if (sessionResult.rows.length === 0) return null;

      const session = sessionResult.rows[0];
      
      // Update verification status
      const mfaVerified = verificationData.mfaVerified ?? session.mfa_verified;
      const deviceCompliant = verificationData.deviceCompliant ?? session.device_compliant;
      const networkCompliant = verificationData.networkCompliant ?? session.network_compliant;
      
      let anomalyScore = 0;
      if (verificationData.anomalyDetected) anomalyScore = 50;

      const { score: riskScore, level: trustLevel } = calculateTrustScore({
        mfaVerified,
        deviceCompliant,
        networkCompliant,
        anomalyScore
      });

      // Record MFA challenge if verified
      if (verificationData.mfaVerified && !session.mfa_verified) {
        await this.recordSecurityEvent(
          session.tenant_id, 
          session.user_id, 
          'mfa_challenge', 
          'low',
          { sessionId, method: 'totp' }
        );
      }

      // Update session
      await query(`
        UPDATE zero_trust_sessions 
        SET mfa_verified = $2, device_compliant = $3, network_compliant = $4,
            risk_score = $5, trust_level = $6, last_activity_at = $7
        WHERE session_id = $1
      `, [sessionId, mfaVerified, deviceCompliant, networkCompliant, riskScore, trustLevel, new Date().toISOString()]);

      return {
        sessionId: session.session_id,
        userId: session.user_id,
        tenantId: session.tenant_id,
        deviceFingerprint: session.device_fingerprint,
        ipAddress: session.ip_address,
        geoLocation: typeof session.geo_location === 'string' ? JSON.parse(session.geo_location) : session.geo_location,
        riskScore,
        trustLevel,
        policiesApplied: typeof session.policies_applied === 'string' ? JSON.parse(session.policies_applied) : session.policies_applied,
        mfaVerified,
        deviceCompliant,
        networkCompliant,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        lastActivityAt: new Date().toISOString()
      };

    } catch (err) {
      logger.error('Failed to verify session', { 
        error: toErrorObject(err),
        context: 'QuantumCryptoEngine' 
      });
      throw err;
    }
  }

  /**
   * Record security event
   */
  async recordSecurityEvent(
    tenantId: string,
    userId: string | undefined,
    eventType: SecurityEvent['eventType'],
    severity: SecurityEvent['severity'],
    details: Record<string, unknown> = {}
  ): Promise<void> {
    const eventId = generateEventId();
    const now = new Date();
    const riskScore = SECURITY_EVENT_SEVERITY_SCORES[eventType] || 20;

    try {
      await query(`
        INSERT INTO security_events (
          event_id, tenant_id, user_id, event_type, severity,
          risk_score, details, ip_address, user_agent, mitigated, detected_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        eventId,
        tenantId,
        userId || null,
        eventType,
        severity,
        riskScore,
        JSON.stringify(details),
        details.ipAddress || 'system',
        details.userAgent || 'system',
        false,
        now.toISOString()
      ]);

      // Alert on critical/high severity events
      if (severity === 'critical' || severity === 'high') {
        logger.warn(`🔒 Security alert: ${eventType} (${severity})`, {
          context: 'QuantumCryptoEngine'
        });
      }

    } catch (err) {
      logger.error('Failed to record security event', { 
        error: toErrorObject(err),
        context: 'QuantumCryptoEngine' 
      });
      // Don't throw - security logging should not break operations
    }
  }

  /**
   * Get security events for tenant
   */
  async getSecurityEvents(
    tenantId: string,
    filters?: {
      eventType?: string;
      severity?: string;
      from?: string;
      to?: string;
    }
  ): Promise<SecurityEvent[]> {
    let sql = `SELECT * FROM security_events WHERE tenant_id = $1`;
    const params: any[] = [tenantId];

    if (filters?.eventType) {
      sql += ` AND event_type = $${params.length + 1}`;
      params.push(filters.eventType);
    }
    if (filters?.severity) {
      sql += ` AND severity = $${params.length + 1}`;
      params.push(filters.severity);
    }
    if (filters?.from) {
      sql += ` AND detected_at >= $${params.length + 1}`;
      params.push(filters.from);
    }
    if (filters?.to) {
      sql += ` AND detected_at <= $${params.length + 1}`;
      params.push(filters.to);
    }

    sql += ` ORDER BY detected_at DESC LIMIT 1000`;

    const result = await query(sql, params);

    return result.rows.map(row => ({
      eventId: row.event_id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      eventType: row.event_type,
      severity: row.severity,
      riskScore: row.risk_score,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      geoLocation: row.geo_location ? (
        typeof row.geo_location === 'string' ? JSON.parse(row.geo_location) : row.geo_location
      ) : undefined,
      mitigated: row.mitigated,
      detectedAt: row.detected_at
    }));
  }

  /**
   * Get active PQC keys for tenant
   */
  async getActiveKeys(tenantId: string): Promise<PQCKeyPair[]> {
    const result = await query(`
      SELECT * FROM pqc_key_pairs 
      WHERE tenant_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `, [tenantId]);

    return result.rows.map(row => ({
      keyId: row.key_id,
      algorithm: row.algorithm,
      publicKey: row.public_key,
      keySize: row.key_size,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      status: row.status,
      usage: row.usage,
      tenantId: row.tenant_id
    }));
  }

  /**
   * Get expiring keys (for proactive rotation)
   */
  async getExpiringKeys(tenantId: string, daysAhead = 30): Promise<PQCKeyPair[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const result = await query(`
      SELECT * FROM pqc_key_pairs 
      WHERE tenant_id = $1 AND status = 'active' AND expires_at <= $2
      ORDER BY expires_at ASC
    `, [tenantId, futureDate.toISOString()]);

    return result.rows.map(row => ({
      keyId: row.key_id,
      algorithm: row.algorithm,
      publicKey: row.public_key,
      keySize: row.key_size,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      status: row.status,
      usage: row.usage,
      tenantId: row.tenant_id
    }));
  }

  // ─────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────

  private encryptPrivateKey(privateKey: string): string {
    const iv = randomBytes(16);
    const key = createHash('sha256').update(this.secretKey).digest();
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptPrivateKey(encryptedData: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = createHash('sha256').update(this.secretKey).digest();
    
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

export const quantumCryptoEngine = new QuantumCryptoEngine();
