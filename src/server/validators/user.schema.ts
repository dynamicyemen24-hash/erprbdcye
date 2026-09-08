import { z } from 'zod';

export const createUserSchema = z.object({
  name_ar: z.string().min(1).max(255),
  name_en: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  role: z.enum(['VIEWER', 'MEMBER', 'MANAGER', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN']),
  organization_id: z.string().uuid(),
  phone: z.string().max(20).optional(),
  department_id: z.string().uuid().optional(),
});

export const updateUserSchema = createUserSchema.omit({ password: true, organization_id: true }).partial();
