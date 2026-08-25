/**
 * NexoraOS™ — Unified Configuration
 * Single source of truth for all server configuration
 * Merges env.ts validation with legacy serverConfig shape
 */

import crypto from 'crypto';
import { loadConfig } from './env';

// Load and validate environment
const env = loadConfig();

// Derive refresh secret if not provided (cryptographically separate from access secret)
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET
  || crypto.createHmac('sha256', env.jwt.secret).update('nexoraos-refresh-token-v1').digest('hex');

export const serverConfig = {
  port: env.port,
  host: env.host,
  baseUrl: env.baseUrl,
  databaseUrl: `postgresql://${env.database.user}:${env.database.password}@${env.database.host}:${env.database.port}/${env.database.name}${env.database.ssl ? '?sslmode=require' : ''}`,
  jwtSecret: env.jwt.secret,
  jwtRefreshSecret,
  geminiApiKey: env.ai.geminiApiKey || '',
  isProduction: env.env === 'production',
  env: env.env,
  defaultOrgId: '00000000-0000-0000-0000-000000000001',
  // Session & Security
  bcryptRounds: 12,
  jwtExpiresIn: env.jwt.accessExpiresIn,
  jwtRefreshExpiresIn: env.jwt.refreshExpiresIn,
  // Rate limits
  authRateLimitMax: env.rateLimit.auth,
  apiRateLimitMax: env.rateLimit.api,
  writeRateLimitMax: Math.floor(env.rateLimit.api / 4),
  sensitiveRateLimitMax: env.rateLimit.export,
  rateLimitWindowMs: 15 * 60 * 1000,
  // CORS
  allowedOrigins: env.cors.origins,
  // Features
  features: env.features,
  // Logging
  logging: env.logging,
  // Backup
  backup: env.backup,
  // Webhooks
  webhooks: env.webhooks,
};

export default serverConfig;
