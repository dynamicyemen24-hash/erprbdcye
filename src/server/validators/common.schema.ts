import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
}).merge(paginationSchema);

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export const dateRangeSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const exportSchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf', 'json']),
  filters: z.record(z.any()).optional(),
  columns: z.array(z.string()).optional(),
});
