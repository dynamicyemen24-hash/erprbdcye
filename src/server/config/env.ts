/**
 * NexoraOS™ — Environment Configuration
 * Dev / Stage / Prod profiles with validation and secrets management
 * Supports both DATABASE_URL and individual DB_* variables
 */

import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { URL } from 'url';

export type Environment = 'development' | 'staging' | 'production' | 'test';

interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
  url: string;
  poolMin: number;
  poolMax: number;
  idleTimeoutMs: number;
}

interface EnvironmentConfig {
  env: Environment;
  port: number;
  host: string;
  baseUrl: string;
  database: DatabaseConfig;
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  redis: {
    url: string;
    enabled: boolean;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
  rateLimit: {
    general: number;
    auth: number;
    api: number;
    export: number;
  };
  logging: {
    level: string;
    dir: string;
    maxSizeMb: number;
    maxFiles: number;
  };
  ai: {
    geminiApiKey: string;
    enabled: boolean;
  };
  backup: {
    enabled: boolean;
    interval: string;
    retentionDays: number;
  };
  webhooks: {
    enabled: boolean;
    maxRetries: number;
    timeoutMs: number;
  };
  features: {
    aiEnabled: boolean;
    geospatial: boolean;
    smsEnabled: boolean;
    emailEnabled: boolean;
  };
}

function env(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (value === undefined) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

function envInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function envBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  return value ? value === 'true' || value === '1' : defaultValue;
}

function parseDatabaseUrl(url: string): { host: string; port: number; name: string; user: string; password: string; ssl: boolean } {
  try {
    const parsed = new URL(url);
    const ssl = parsed.searchParams.get('sslmode') === 'require' ||
                parsed.searchParams.get('sslmode') === 'verify-full' ||
                parsed.hostname.includes('neon.tech');
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '5432', 10),
      name: parsed.pathname.replace('/', ''),
      user: parsed.username,
      password: parsed.password,
      ssl,
    };
  } catch {
    return { host: 'localhost', port: 5432, name: 'nexora', user: 'nexora', password: 'nexora', ssl: false };
  }
}

function buildDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;
  const poolMin = envInt('DB_POOL_MIN', 2);
  const poolMax = envInt('DB_POOL_MAX', process.env.NODE_ENV === 'production' ? 20 : 5);
  const idleTimeoutMs = envInt('DB_IDLE_TIMEOUT', 30000);

  if (databaseUrl) {
    const parsed = parseDatabaseUrl(databaseUrl);
    return { ...parsed, url: databaseUrl, poolMin, poolMax, idleTimeoutMs };
  }

  return {
    host: env('DB_HOST', 'localhost'),
    port: envInt('DB_PORT', 5432),
    name: env('DB_NAME', 'nexora'),
    user: env('DB_USER', 'nexora'),
    password: env('DB_PASSWORD', 'nexora'),
    ssl: envBool('DB_SSL', process.env.NODE_ENV === 'production'),
    url: `postgresql://${env('DB_USER', 'nexora')}:${env('DB_PASSWORD', 'nexora')}@${env('DB_HOST', 'localhost')}:${envInt('DB_PORT', 5432)}/${env('DB_NAME', 'nexora')}`,
    poolMin,
    poolMax,
    idleTimeoutMs,
  };
}

export function loadConfig(): EnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as Environment;
  return {
    env: nodeEnv,
    port: envInt('PORT', 3000),
    host: env('HOST', '0.0.0.0'),
    baseUrl: env('BASE_URL', `http://localhost:${envInt('PORT', 3000)}`),
    database: buildDatabaseConfig(),
    jwt: {
      secret: env('JWT_SECRET', 'dev-secret-change-in-production'),
      refreshSecret: env('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
      accessExpiresIn: env('JWT_ACCESS_EXPIRES', '1h'),
      refreshExpiresIn: env('JWT_REFRESH_EXPIRES', '7d'),
    },
    redis: {
      url: env('REDIS_URL', 'redis://localhost:6379'),
      enabled: envBool('REDIS_ENABLED', false),
    },
    cors: {
      origins: env('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(','),
      credentials: envBool('CORS_CREDENTIALS', true),
    },
    rateLimit: {
      general: envInt('RATE_LIMIT_GENERAL', 100),
      auth: envInt('RATE_LIMIT_AUTH', 20),
      api: envInt('RATE_LIMIT_API', 200),
      export: envInt('RATE_LIMIT_EXPORT', 5),
    },
    logging: {
      level: env('LOG_LEVEL', nodeEnv === 'production' ? 'info' : 'debug'),
      dir: env('LOG_DIR', path.join(process.cwd(), 'logs')),
      maxSizeMb: envInt('LOG_MAX_SIZE_MB', 50),
      maxFiles: envInt('LOG_MAX_FILES', 30),
    },
    ai: {
      geminiApiKey: env('GEMINI_API_KEY', ''),
      enabled: envBool('AI_ENABLED', false),
    },
    backup: {
      enabled: envBool('BACKUP_ENABLED', nodeEnv === 'production'),
      interval: env('BACKUP_INTERVAL', '0 2 * * *'),
      retentionDays: envInt('BACKUP_RETENTION_DAYS', 30),
    },
    webhooks: {
      enabled: envBool('WEBHOOKS_ENABLED', true),
      maxRetries: envInt('WEBHOOK_MAX_RETRIES', 3),
      timeoutMs: envInt('WEBHOOK_TIMEOUT_MS', 10000),
    },
    features: {
      aiEnabled: envBool('AI_ENABLED', false),
      geospatial: envBool('GEOSPATIAL_ENABLED', true),
      smsEnabled: envBool('SMS_ENABLED', false),
      emailEnabled: envBool('EMAIL_ENABLED', false),
    },
  };
}

let _config: EnvironmentConfig | null = null;

export function getConfig(): EnvironmentConfig {
  if (!_config) _config = loadConfig();
  return _config;
}

export function resetConfig(): void { _config = null; }

export default getConfig;
