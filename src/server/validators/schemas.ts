/**
 * NexoraOS™ — Zod Validation Schemas for Critical Routes
 * Input validation for auth, tables, and financial operations
 */

import { z } from 'zod';

// ─── Auth Schemas ──────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const registerSchema = z.object({
  name_ar: z.string().min(1, 'Arabic name is required').max(255),
  name_en: z.string().max(255).optional(),
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['ADMIN', 'MANAGER', 'OFFICER', 'VIEWER']).optional(),
  security_level: z.number().int().min(1).max(5).optional(),
  organization_id: z.string().uuid().optional(),
});

export const resetPasswordSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  new_password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  admin_password: z.string().min(1, 'Admin password confirmation is required'),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters').max(128),
});

// ─── Table CRUD Schemas ────────────────────────────────────
export const createRecordSchema = z.object({
  // Allow any valid fields but enforce common patterns
}).passthrough();

export const updateRecordSchema = z.object({
  id: z.string().uuid().optional(),
}).passthrough();

// ─── Commitment Schemas ────────────────────────────────────
export const createCommitmentSchema = z.object({
  commitment_number: z.string().max(60).optional(),
  commitment_type: z.enum(['BUDGET', 'DONOR', 'CONTRACTUAL', 'SPONSORSHIP', 'INTER_ORG', 'GRANT', 'OTHER']).default('BUDGET'),
  title_ar: z.string().min(1, 'Arabic title is required').max(300),
  title_en: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  total_amount: z.string().or(z.number()).transform(v => String(v)),
  currency_code: z.enum(['YER', 'USD', 'SAR', 'EUR', 'GBP']).default('YER'),
  periodicity: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL', 'CUSTOM']).default('ONE_TIME'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  next_due_date: z.string().optional(),
  project_id: z.string().uuid().nullable().optional(),
  program_id: z.string().uuid().nullable().optional(),
  donor_id: z.string().uuid().nullable().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE']).default('DRAFT'),
  internal_notes: z.string().max(2000).optional(),
}).passthrough();

// ─── Obligation Schemas ────────────────────────────────────
export const createObligationSchema = z.object({
  obligation_number: z.string().max(60).optional(),
  obligation_type: z.enum(['RECURRING', 'CONTRACTUAL', 'REGULATORY', 'BENEFICIARY', 'DONOR', 'OTHER']).default('RECURRING'),
  title_ar: z.string().min(1, 'Arabic title is required').max(300),
  title_en: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  total_amount: z.string().or(z.number()).transform(v => String(v)),
  currency_code: z.enum(['YER', 'USD', 'SAR', 'EUR', 'GBP']).default('YER'),
  periodicity: z.enum(['ONE_TIME', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL', 'CUSTOM']).default('MONTHLY'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  next_due_date: z.string().optional(),
  project_id: z.string().uuid().nullable().optional(),
  program_id: z.string().uuid().nullable().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE']).default('DRAFT'),
  internal_notes: z.string().max(2000).optional(),
}).passthrough();

// ─── Payment Schemas ───────────────────────────────────────
export const recordPaymentSchema = z.object({
  payment_amount: z.string().or(z.number()).transform(v => {
    const num = Number(v);
    if (num <= 0) throw new Error('Payment amount must be positive');
    return String(v);
  }),
  payment_method: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'MOBILE_PAYMENT', 'OTHER']).default('BANK_TRANSFER'),
  currency_code: z.string().max(10).optional(),
  payment_date: z.string().optional(),
  voucher_number: z.string().max(60).optional(),
  receipt_number: z.string().max(60).optional(),
  notes: z.string().max(1000).optional(),
}).passthrough();

// ─── Sponsorship Schemas ───────────────────────────────────
export const createSponsorshipSchema = z.object({
  beneficiary_id: z.string().uuid('Invalid beneficiary ID'),
  sponsor_party_id: z.string().uuid().nullable().optional(),
  sponsorship_type: z.enum(['ORPHAN', 'FAMILY', 'EDUCATION', 'MEDICAL', 'WIDOW', 'ELDERLY']).default('ORPHAN'),
  monthly_amount: z.string().or(z.number()).transform(v => String(v)),
  currency_code: z.enum(['YER', 'USD', 'SAR']).default('YER'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TERMINATED']).default('ACTIVE'),
}).passthrough();

// ─── Project Schemas ───────────────────────────────────────
export const createProjectSchema = z.object({
  name_ar: z.string().min(1, 'Arabic name is required').max(300),
  name_en: z.string().max(300).optional(),
  project_code: z.string().max(30).optional(),
  description: z.string().max(2000).optional(),
  budget: z.string().or(z.number()).transform(v => String(v)).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status_code: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
}).passthrough();

// ─── Pagination Query Schema ───────────────────────────────
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).default('100'),
  search: z.string().max(200).optional(),
  status: z.string().max(30).optional(),
  sort_by: z.string().max(50).optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Dashboard Query Schema ────────────────────────────────
export const dashboardQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year']).optional(),
  program_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
});
