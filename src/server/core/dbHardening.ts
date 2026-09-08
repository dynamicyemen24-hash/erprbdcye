/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Database Hardening & Query Protection
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Protects against:
 * - Advanced SQL injection (time-based, blind, stacked queries)
 * - Query tampering and modification
 * - Data exfiltration via UNION attacks
 * - Privilege escalation via database functions
 * - Connection string leakage
 * - Query result manipulation
 */

import crypto from 'crypto';
import logger from './logger';

// ─── Advanced SQL Injection Detection ───────────────────────────────────────

const ADVANCED_SQL_PATTERNS = [
  // Time-based blind injection
  /\b(WAITFOR\s+DELAY|SLEEP\s*\(|BENCHMARK\s*\(|PG_SLEEP\s*\()/i,
  // UNION-based exfiltration
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  // Stacked queries
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/i,
  // Comment-based bypass
  /(\/\*[\s\S]*?\*\/|--[^\n]*$|#)/i,
  // Hex encoding attacks
  /\b0x[0-9a-fA-F]{8,}/i,
  // CHAR/CONCAT obfuscation
  /\b(CHAR\s*\(|CONCAT\s*\(|GROUP_CONCAT\s*\()/i,
  // Information schema extraction
  /\b(INFORMATION_SCHEMA|SYS\.|USER_TABLES|ALL_TABLES|DBA_)\b/i,
  // Privilege escalation
  /\b(GRANT\s|REVOKE\s|CREATE\s+USER|DROP\s+USER|ALTER\s+USER)\b/i,
  // Database function abuse
  /\b(DBMS_PIPE|UTL_HTTP|DBMS_OUTPUT|XP_CMDSHELL|SP_EXECUTESQL)\b/i,
  // Boolean-based blind
  /\b(AND\s+\d+\s*=\s*\d+|OR\s+\d+\s*=\s*\d+|AND\s+'[^']*'\s*=\s*'[^']*')/i,
  // Subquery injection
  /\(\s*SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+/i,
];

/**
 * Detect advanced SQL injection attempts.
 */
export function detectAdvancedSqlInjection(input: string): {
  detected: boolean;
  pattern?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
} {
  if (typeof input !== 'string') return { detected: false, severity: 'LOW' };

  for (const pattern of ADVANCED_SQL_PATTERNS) {
    if (pattern.test(input)) {
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH';

      if (/\b(WAITFOR\s+DELAY|SLEEP\s*\(|BENCHMARK\s*\()/i.test(input)) {
        severity = 'CRITICAL'; // Time-based = data exfiltration attempt
      } else if (/\bUNION\s+(ALL\s+)?SELECT\b/i.test(input)) {
        severity = 'CRITICAL'; // UNION = data exfiltration
      } else if (/\b(GRANT\s|REVOKE\s|CREATE\s+USER)/i.test(input)) {
        severity = 'CRITICAL'; // Privilege escalation
      } else if (/;\s*(DROP|DELETE|TRUNCATE|ALTER)/i.test(input)) {
        severity = 'CRITICAL'; // Destructive operation
      }

      return { detected: true, pattern: pattern.source, severity };
    }
  }

  return { detected: false, severity: 'LOW' };
}

// ─── Query Fingerprinting ───────────────────────────────────────────────────

/**
 * Generate a query fingerprint for anomaly detection.
 * Normalizes the query to detect patterns, not exact values.
 */
export function fingerprintQuery(query: string): string {
  // Remove comments
  let normalized = query.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');

  // Replace string literals with placeholder
  normalized = normalized.replace(/'[^']*'/g, "'?'");

  // Replace numeric literals
  normalized = normalized.replace(/\b\d+\.?\d*\b/g, '?');

  // Replace UUIDs
  normalized = normalized.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '?');

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Lowercase
  normalized = normalized.toLowerCase();

  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
}

// ─── Query Anomaly Detection ────────────────────────────────────────────────

const queryFingerprints = new Map<string, { count: number; lastSeen: Date; avgDuration: number }>();

/**
 * Record a query execution for anomaly tracking.
 */
export function recordQueryExecution(
  fingerprint: string,
  durationMs: number,
  rowCount: number
): void {
  const existing = queryFingerprints.get(fingerprint);
  if (existing) {
    existing.count++;
    existing.lastSeen = new Date();
    existing.avgDuration = (existing.avgDuration + durationMs) / 2;
  } else {
    queryFingerprints.set(fingerprint, {
      count: 1,
      lastSeen: new Date(),
      avgDuration: durationMs,
    });
  }
}

/**
 * Detect query anomalies (unusual patterns, performance degradation).
 */
export function detectQueryAnomaly(
  fingerprint: string,
  durationMs: number,
  rowCount: number
): {
  anomalous: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const record = queryFingerprints.get(fingerprint);

  if (record) {
    // 1. Performance degradation
    if (durationMs > record.avgDuration * 5) {
      reasons.push(`Query duration ${durationMs}ms is 5x average ${record.avgDuration}ms`);
    }

    // 2. Result set anomaly
    if (rowCount > 10000) {
      reasons.push(`Unusually large result set: ${rowCount} rows`);
    }
  }

  // 3. Too many different query patterns (possible injection)
  if (queryFingerprints.size > 1000) {
    reasons.push(`High query pattern diversity: ${queryFingerprints.size} unique fingerprints`);
  }

  return { anomalous: reasons.length > 0, reasons };
}

// ─── Connection String Protection ───────────────────────────────────────────

/**
 * Mask sensitive connection string components for logging.
 */
export function maskConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.password) {
      url.password = '***';
    }
    return url.toString();
  } catch {
    return '[INVALID_CONNECTION_STRING]';
  }
}

/**
 * Extract safe parts of connection string for diagnostics.
 */
export function safeConnectionStringInfo(connectionString: string): {
  host: string;
  port: number;
  database: string;
  ssl: boolean;
  poolSize?: number;
} {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.replace('/', ''),
      ssl: url.searchParams.get('sslmode') === 'require' || url.hostname.includes('neon.tech'),
    };
  } catch {
    return { host: 'unknown', port: 5432, database: 'unknown', ssl: false };
  }
}

// ─── Data Exfiltration Detection ────────────────────────────────────────────

/**
 * Detect potential data exfiltration patterns in query results.
 */
export function detectDataExfiltration(
  query: string,
  rowCount: number,
  columns: string[]
): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const queryLower = query.toLowerCase();

  // 1. Large result set with sensitive columns
  const sensitiveColumns = ['password', 'secret', 'token', 'key', 'ssn', 'credit_card', 'api_key'];
  const hasSensitiveColumns = columns.some(col =>
    sensitiveColumns.some(sensitive => col.toLowerCase().includes(sensitive))
  );
  if (hasSensitiveColumns && rowCount > 100) {
    reasons.push(`Large result set (${rowCount} rows) with sensitive columns`);
  }

  // 2. SELECT * on large tables
  if (queryLower.includes('select *') && rowCount > 1000) {
    reasons.push(`SELECT * returning ${rowCount} rows`);
  }

  // 3. Export-like queries
  if (queryLower.includes('copy') || queryLower.includes('\\copy')) {
    reasons.push('COPY command detected (potential data export)');
  }

  return { suspicious: reasons.length > 0, reasons };
}

// ─── Query Audit Middleware ──────────────────────────────────────────────────

/**
 * Middleware that logs and monitors all database queries.
 */
export function queryAuditMiddleware(pool: any) {
  const originalQuery = pool.query.bind(pool);

  pool.query = async function (text: string | any, params?: any[]) {
    const startTime = Date.now();
    const queryText = typeof text === 'string' ? text : text.text || '';
    const fingerprint = fingerprintQuery(queryText);

    try {
      const result = await originalQuery(text, params);
      const duration = Date.now() - startTime;
      const rowCount = result?.rowCount || 0;

      // Record execution
      recordQueryExecution(fingerprint, duration, rowCount);

      // Detect anomalies
      const anomaly = detectQueryAnomaly(fingerprint, duration, rowCount);
      if (anomaly.anomalous) {
        logger.warn(`[QUERY-AUDIT] Anomalous query: ${anomaly.reasons.join(', ')}`, {
          context: 'query-audit',
          meta: { fingerprint, duration, rowCount },
        });
      }

      // Detect exfiltration
      const exfil = detectDataExfiltration(queryText, rowCount, []);
      if (exfil.suspicious) {
        logger.warn(`[QUERY-AUDIT] Potential exfiltration: ${exfil.reasons.join(', ')}`, {
          context: 'query-audit',
          meta: { fingerprint, duration, rowCount },
        });
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Log failed queries
      logger.error(`[QUERY-AUDIT] Query failed after ${duration}ms`, {
        context: 'query-audit',
        meta: { fingerprint, duration, error: error.message },
      });

      throw error;
    }
  };

  return pool;
}

// ─── Parameterized Query Helper ─────────────────────────────────────────────

/**
 * Safe query builder that enforces parameterization.
 */
export class SafeQueryBuilder {
  private params: any[] = [];
  private paramIndex = 1;

  /**
   * Add a parameterized value.
   */
  param(value: any): string {
    this.params.push(value);
    return `$${this.paramIndex++}`;
  }

  /**
   * Whitelist a column name (prevents SQL injection in column names).
   */
  column(name: string, allowedColumns: Set<string>): string {
    if (!allowedColumns.has(name)) {
      throw new Error(`Column "${name}" is not in the allowed columns whitelist`);
    }
    return `"${name}"`;
  }

  /**
   * Whitelist a table name (prevents SQL injection in table names).
   */
  table(name: string, allowedTables: Set<string>): string {
    if (!allowedTables.has(name)) {
      throw new Error(`Table "${name}" is not in the allowed tables whitelist`);
    }
    return `"${name}"`;
  }

  /**
   * Get the current parameters array.
   */
  getParams(): any[] {
    return [...this.params];
  }

  /**
   * Reset the builder for reuse.
   */
  reset(): void {
    this.params = [];
    this.paramIndex = 1;
  }
}

export default {
  detectAdvancedSqlInjection,
  fingerprintQuery,
  recordQueryExecution,
  detectQueryAnomaly,
  maskConnectionString,
  safeConnectionStringInfo,
  detectDataExfiltration,
  queryAuditMiddleware,
  SafeQueryBuilder,
};
