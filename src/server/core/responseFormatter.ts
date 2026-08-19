/**
 * NexoraOS™ — API Response Formatter
 * Consistent API responses with Arabic RTL support, pagination, and HATEOAS
 */

import { Response } from 'express';

// ─── Standard API Response Types ───────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    messageAr?: string;
    details?: any[];
    field?: string;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    duration?: number;
    version?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage?: string;
    prevPage?: string;
    firstPage?: string;
    lastPage?: string;
  };
  links?: Record<string, string>;
}

// ─── Response Builders ─────────────────────────────────

export function successResponse<T>(
  res: Response,
  data: T,
  options?: {
    statusCode?: number;
    message?: string;
    messageAr?: string;
    pagination?: ApiResponse['pagination'];
    requestId?: string;
    duration?: number;
    links?: Record<string, string>;
  }
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId,
      duration: options?.duration,
      version: '2.0.0',
    },
  };

  if (options?.pagination) {
    response.pagination = options.pagination;
  }

  if (options?.links) {
    response.links = options.links;
  }

  return res.status(options?.statusCode || 200).json(response);
}

export function createdResponse<T>(
  res: Response,
  data: T,
  options?: { message?: string; messageAr?: string; requestId?: string }
): Response {
  return successResponse(res, data, { statusCode: 201, ...options });
}

export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}

export function errorResponse(
  res: Response,
  options: {
    statusCode: number;
    code: string;
    message: string;
    messageAr?: string;
    details?: any[];
    field?: string;
    requestId?: string;
  }
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code: options.code,
      message: options.message,
      messageAr: options.messageAr,
      details: options.details,
      field: options.field,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options.requestId,
      version: '2.0.0',
    },
  };
  return res.status(options.statusCode).json(response);
}

// ─── Common Error Responses ────────────────────────────

export function badRequest(res: Response, message: string, messageAr?: string, details?: any[]): Response {
  return errorResponse(res, { statusCode: 400, code: 'BAD_REQUEST', message, messageAr, details });
}

export function unauthorized(res: Response, message?: string): Response {
  return errorResponse(res, {
    statusCode: 401, code: 'UNAUTHORIZED',
    message: message || 'Authentication required',
    messageAr: message || 'المصادقة مطلوبة',
  });
}

export function forbidden(res: Response, message?: string): Response {
  return errorResponse(res, {
    statusCode: 403, code: 'FORBIDDEN',
    message: message || 'Insufficient permissions',
    messageAr: message || 'صلاحيات غير كافية',
  });
}

export function notFound(res: Resource, resource?: string): Response {
  return errorResponse(res, {
    statusCode: 404, code: 'NOT_FOUND',
    message: `${resource || 'Resource'} not found`,
    messageAr: `${resource || 'المورد'} غير موجود`,
  });
}

export function conflict(res: Response, message: string, messageAr?: string): Response {
  return errorResponse(res, { statusCode: 409, code: 'CONFLICT', message, messageAr });
}

export function tooManyRequests(res: Response, retryAfter?: number): Response {
  if (retryAfter) res.setHeader('Retry-After', String(retryAfter));
  return errorResponse(res, {
    statusCode: 429, code: 'RATE_LIMITED',
    message: 'Too many requests',
    messageAr: 'طلبات كثيرة جداً',
  });
}

export function serverError(res: Response, message?: string): Response {
  return errorResponse(res, {
    statusCode: 500, code: 'INTERNAL_ERROR',
    message: message || 'Internal server error',
    messageAr: message || 'خطأ داخلي في الخادم',
  });
}

// ─── Pagination Builder ────────────────────────────────

export function buildPagination(options: {
  page: number;
  limit: number;
  total: number;
  baseUrl: string;
  queryParams?: Record<string, string>;
}): ApiResponse['pagination'] {
  const { page, limit, total, baseUrl, queryParams } = options;
  const totalPages = Math.ceil(total / limit);
  const params = new URLSearchParams(queryParams || {});

  const buildUrl = (p: number) => {
    params.set('page', String(p));
    params.set('limit', String(limit));
    return `${baseUrl}?${params.toString()}`;
  };

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: page < totalPages ? buildUrl(page + 1) : undefined,
    prevPage: page > 1 ? buildUrl(page - 1) : undefined,
    firstPage: buildUrl(1),
    lastPage: buildUrl(totalPages),
  };
}

// ─── HATEOAS Links ─────────────────────────────────────

export function buildLinks(
  resource: string,
  id: string,
  orgId: string
): Record<string, string> {
  const base = `/api/v2`;
  return {
    self: `${base}/${resource}/${id}`,
    collection: `${base}/${resource}`,
    organization: `${base}/organizations/${orgId}`,
  };
}

// ─── Arabic Number Formatting ──────────────────────────

export function formatNumberArabic(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/\d/g, d => arabicDigits[parseInt(d)]);
}

export function formatCurrencyArabic(amount: number, currency: string = 'YER'): string {
  const formatted = new Intl.NumberFormat('ar-YE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function formatDateArabic(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-YE', {
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'long', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Excel-Style Headers (for exports) ─────────────────

export function buildExportHeaders(columns: { key: string; label: string; labelAr: string; width?: number }[]) {
  return columns.map(col => ({
    key: col.key,
    label: col.label,
    labelAr: col.labelAr,
    width: col.width || 15,
    style: { font: { bold: true }, fill: { fgColor: { rgb: '059669' } } },
  }));
}
