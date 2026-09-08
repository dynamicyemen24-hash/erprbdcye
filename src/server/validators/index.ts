/**
 * NexoraOS™ — Enterprise Zod Validation Schemas
 * Single source of truth for server-side request/entity validation.
 * Covers multi-tenant, multi-currency, multi-UOM core entities.
 */

import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const organizationCreateSchema = z.object({
  parentId: uuidSchema.optional().nullable(),
  nameAr: z.string().min(1).max(255),
  nameEn: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  countryCode: z.string().length(2).optional().nullable(),
  timezone: z.string().max(64).optional().nullable(),
  locale: z.string().max(32).optional().nullable(),
  baseCurrencyCode: z.string().length(3).optional().nullable(),
  primaryLanguage: z.string().max(8).optional().nullable(),
  typeCode: z.enum(['charity', 'ngo', 'government', 'commercial', 'other']).default('charity'),
  subscriptionPlan: z.enum(['basic', 'standard', 'enterprise', 'unlimited']).default('basic'),
});

export const organizationUpdateSchema = organizationCreateSchema.partial();

export const countryCreateSchema = z.object({
  code2: z.string().length(2).toUpperCase(),
  code3: z.string().length(3).toUpperCase(),
  numericCode: z.string().max(3).optional().nullable(),
  nameAr: z.string().min(1).max(255),
  nameEn: z.string().min(1).max(255),
  region: z.string().max(100).optional().nullable(),
  subRegion: z.string().max(100).optional().nullable(),
  currencyCode: z.string().length(3).optional().nullable(),
  phoneCode: z.string().max(10).optional().nullable(),
});

export const itemUnitCreateSchema = z.object({
  organizationId: uuidSchema.optional().nullable(),
  code: z.string().min(1).max(50),
  nameAr: z.string().min(1).max(255),
  nameEn: z.string().min(1).max(255),
  category: z.string().max(50).default('COUNT'),
  symbolAr: z.string().max(20).optional().nullable(),
  symbolEn: z.string().max(20).optional().nullable(),
  baseUnitCode: z.string().max(50).optional().nullable(),
  conversionFactor: z.number().positive().default(1),
});

export const currencyCreateSchema = z.object({
  organizationId: uuidSchema.optional().nullable(),
  code: z.string().length(3).toUpperCase(),
  nameAr: z.string().min(1).max(255),
  nameEn: z.string().min(1).max(255).optional().nullable(),
  symbol: z.string().max(10).optional().nullable(),
  exchangeRate: z.number().nonnegative().default(1),
  isBaseCurrency: z.boolean().default(false),
});

export const exchangeRateCreateSchema = z.object({
  organizationId: uuidSchema,
  fromCurrency: z.string().length(3).toUpperCase(),
  toCurrency: z.string().length(3).toUpperCase(),
  rate: z.number().positive(),
  effectiveDate: z.string().datetime().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(50),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
}).transform((val) => ({
  ...val,
  limit: Math.min(val.limit, 200),
  page: Math.max(val.page, 1),
}));

export const tenantScopeSchema = z.object({
  organizationId: uuidSchema.optional(),
  branchId: uuidSchema.optional(),
});

export type OrganizationCreate = z.infer<typeof organizationCreateSchema>;
export type CountryCreate = z.infer<typeof countryCreateSchema>;
export type ItemUnitCreate = z.infer<typeof itemUnitCreateSchema>;
export type CurrencyCreate = z.infer<typeof currencyCreateSchema>;
export type ExchangeRateCreate = z.infer<typeof exchangeRateCreateSchema>;
export type Pagination = z.infer<typeof paginationSchema>;

export * from './common.schema';
export * from './auth.schema';
export * from './finance.schema';
export * from './project.schema';
export * from './user.schema';
