import { z } from 'zod';

export const createProjectSchema = z.object({
  name_ar: z.string().min(1).max(255),
  name_en: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().min(0).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  manager_id: z.string().uuid().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();
