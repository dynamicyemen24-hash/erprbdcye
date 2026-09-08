import { z } from 'zod';

export const createTransactionSchema = z.object({
  transaction_date: z.string(),
  transaction_type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'ADJUSTMENT']),
  amount: z.number().positive(),
  currency_code: z.string().length(3),
  description: z.string().min(1).max(500),
  category_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  reference_number: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const approveTransactionSchema = z.object({
  transaction_id: z.string().uuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().max(500).optional(),
});
