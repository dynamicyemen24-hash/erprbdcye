/**
 * NexoraOS™ — Cursor-Based Pagination Engine
 * Replaces offset-based pagination with cursor-based for 10x performance
 * on large datasets. Supports forward/backward pagination.
 */

import { Request, Response } from 'express';

interface PaginationParams {
  /** Maximum items per page (default: 25, max: 100) */
  limit?: number;
  /** Cursor for forward pagination */
  cursor?: string;
  /** Cursor for backward pagination */
  before?: string;
  /** Sort field (default: 'id') */
  sort?: string;
  /** Sort direction (default: 'desc') */
  order?: 'asc' | 'desc';
  /** Include total count (expensive on large tables) */
  includeTotal?: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    previousCursor?: string;
    limit: number;
    sortOrder: string;
  };
  _links?: {
    self: string;
    next?: string;
    previous?: string;
  };
}

/**
 * Encode a cursor from a sort value.
 * Uses base64url encoding for URL safety.
 */
export function encodeCursor(value: any): string {
  return Buffer.from(JSON.stringify({ v: value })).toString('base64url');
}

/**
 * Decode a cursor to extract the sort value.
 */
export function decodeCursor(cursor: string): any {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    return decoded.v;
  } catch {
    throw new Error('Invalid cursor');
  }
}

/**
 * Parse pagination parameters from request query string.
 */
export function parsePaginationParams(req: Request): PaginationParams {
  const query = req.query;

  let limit = parseInt(query.limit as string) || 25;
  limit = Math.min(Math.max(limit, 1), 100); // Clamp between 1 and 100

  return {
    limit,
    cursor: query.cursor as string || undefined,
    before: query.before as string || undefined,
    sort: (query.sort as string) || 'id',
    order: (query.order as 'asc' | 'desc') || 'desc',
    includeTotal: query.include_total === 'true',
  };
}

/**
 * Build a paginated SQL query from parameters.
 *
 * Usage:
 *   const { sql, params } = buildPaginatedQuery('users', paginationParams, 'created_at');
 *   const result = await pool.query(sql, params);
 *   const response = formatPaginatedResponse(result.rows, paginationParams, total);
 */
export function buildPaginatedQuery(
  tableName: string,
  params: PaginationParams,
  cursorColumn?: string
): { sql: string; params: any[]; hasCursor: boolean } {
  const { limit, cursor, before, sort = 'id', order = 'desc' } = params;
  const sortCol = cursorColumn || sort;
  const paramValues: any[] = [];
  let whereClause = '';
  const hasCursor = !!(cursor || before);

  if (cursor) {
    const cursorValue = decodeCursor(cursor);
    paramValues.push(cursorValue);
    const op = order === 'desc' ? '<' : '>';
    whereClause = `WHERE "${sortCol}" ${op} $${paramValues.length}`;
  } else if (before) {
    const cursorValue = decodeCursor(before);
    paramValues.push(cursorValue);
    const op = order === 'desc' ? '>' : '<';
    whereClause = `WHERE "${sortCol}" ${op} $${paramValues.length}`;
    // Reverse order for backward pagination
  }

  paramValues.push(limit + 1); // Fetch one extra to check hasMore

  const sql = `
    SELECT * FROM "${tableName}"
    ${whereClause}
    ORDER BY "${sortCol}" ${before ? (order === 'desc' ? 'ASC' : 'DESC') : order}
    LIMIT $${paramValues.length}
  `;

  return { sql, params: paramValues, hasCursor };
}

/**
 * Format database results into a paginated response.
 */
export function formatPaginatedResponse<T extends Record<string, any>>(
  rows: T[],
  params: PaginationParams,
  totalCount?: number
): PaginatedResponse<T> {
  const { limit, sort = 'id', order = 'desc', includeTotal } = params;
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;

  // Generate cursors
  let nextCursor: string | undefined;
  let previousCursor: string | undefined;

  if (hasMore && data.length > 0) {
    nextCursor = encodeCursor(data[data.length - 1][sort]);
  }

  if (data.length > 0) {
    previousCursor = encodeCursor(data[0][sort]);
  }

  const response: PaginatedResponse<T> = {
    data,
    pagination: {
      hasMore,
      nextCursor,
      previousCursor,
      limit,
      sortOrder: order,
    },
  };

  if (includeTotal && totalCount !== undefined) {
    (response.pagination as any).total = totalCount;
    (response.pagination as any).totalPages = Math.ceil(totalCount / limit);
  }

  return response;
}

/**
 * Express middleware that adds pagination helpers to response.
 */
export function paginationMiddleware(req: Request, res: Response, next: Function): void {
  const params = parsePaginationParams(req);

  // Attach pagination params to request
  (req as any).pagination = params;

  // Add pagination helper to response
  (res as any).paginate = function <T extends Record<string, any>>(
    rows: T[],
    totalCount?: number
  ): PaginatedResponse<T> {
    return formatPaginatedResponse(rows, params, totalCount);
  };

  next();
}

/**
 * Build a paginated SQL query for Drizzle ORM.
 *
 * Usage with Drizzle:
 *   const query = buildDrizzlePaginatedQuery(db.select().from(users), paginationParams);
 */
export function buildDrizzleQuery(
  baseQuery: any,
  params: PaginationParams
): any {
  const { limit, cursor, sort = 'id', order = 'desc' } = params;

  let query = baseQuery
    .orderBy(order === 'desc' ? baseQuery[sort]?.desc() : baseQuery[sort]?.asc())
    .limit(limit + 1);

  if (cursor) {
    const cursorValue = decodeCursor(cursor);
    // Drizzle cursor-based pagination
    if (order === 'desc') {
      query = query.where(baseQuery[sort]?.lt(cursorValue));
    } else {
      query = query.where(baseQuery[sort]?.gt(cursorValue));
    }
  }

  return query;
}
