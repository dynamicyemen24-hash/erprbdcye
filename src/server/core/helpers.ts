/**
 * NexoraOS™ — Core Utility Helpers
 * Pagination, validation, response formatting, audit logging
 */

import { Response } from 'express';
import crypto from 'crypto';
import { query, queryOne, queryMany } from './database';
import { PaginationParams, PaginatedResult, ApiResponse, AuthContext, AuditLogEntry } from './types';
import logger from './logger';
export type { AuthContext } from './types';

// ─── Pagination Builder ────────────────────────────────

export function parsePagination(params: PaginationParams): { offset: number; limit: number; page: number } {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(500, Math.max(1, params.limit || 50));
  const offset = (page - 1) * limit;
  return { offset, limit, page };
}

export function buildOrderBy(sortBy?: string, sortOrder?: 'asc' | 'desc'): string {
  if (!sortBy) return 'created_at DESC';
  const allowed = /^[a-z_]+$/i.test(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
  return `${allowed} ${order}`;
}

export async function paginatedQuery<T>(
  baseQuery: string,
  countQuery: string,
  params: any[],
  pagination: PaginationParams
): Promise<PaginatedResult<T>> {
  const { offset, limit, page } = parsePagination(pagination);

  const [countResult, dataResult] = await Promise.all([
    queryOne<{ count: string }>(countQuery, params),
    queryMany<T>(`${baseQuery} ${buildOrderBy(pagination.sortBy, pagination.sortOrder)} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]),
  ]);

  const total = parseInt(countResult?.count || '0', 10);
  const totalPages = Math.ceil(total / limit);

  return {
    data: dataResult,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ─── Response Helpers ──────────────────────────────────

export function successResponse<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function errorResponse(res: Response, error: string, statusCode = 400): void {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function createdResponse<T>(res: Response, data: T): void {
  successResponse(res, data, 201);
}

export function notFoundResponse(res: Response, resource: string): void {
  errorResponse(res, `${resource} not found`, 404);
}

// ─── Validation Helpers ────────────────────────────────

export function requireField(value: unknown, fieldName: string): string {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    throw new Error(`Field '${fieldName}' is required`);
  }
  return String(value).trim();
}

export function optionalString(value: unknown): string | null {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return null;
  }
  return String(value).trim();
}

export function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

export function isValidUUID(value: unknown): boolean {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function sanitize(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .substring(0, 10000);
}

// ─── Audit Logger ──────────────────────────────────────

export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (organization_id, user_id, action, table_name, record_id, ip_address, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.organizationId,
        entry.userId,
        entry.action,
        entry.tableName,
        entry.recordId || null,
        entry.ipAddress || null,
        JSON.stringify(entry.details || {}),
      ]
    );
  } catch (err: any) {
    logger.error(`[Audit] Failed to log: ${err.message}`, { context: 'audit' });
  }
}

// ─── ID Generator ──────────────────────────────────────

export function generateCode(prefix: string, length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytes = crypto.randomBytes(length);
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomBytes[i] % chars.length);
  }
  return result;
}

export function generateTxNumber(type: string): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = crypto.randomBytes(2).readUInt16BE(0).toString().padStart(4, '0').substring(0, 4);
  return `${type.substring(0, 3).toUpperCase()}-${dateStr}-${rand}`;
}

// ─── Tenant ID Extractor ───────────────────────────────

export function extractTenantId(req: any): string {
  const orgId = req.headers['x-organization-id'] || req.user?.org_id || req.user?.organization_id;
  if (!orgId) {
    throw new Error('Tenant ID (organization ID) is required. Provide it via x-organization-id header or authenticate with a valid JWT.');
  }
  return orgId;
}
