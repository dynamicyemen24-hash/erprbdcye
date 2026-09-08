import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  organization_code: z.string().optional(),
  remember_me: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  name_ar: z.string().min(1).max(255),
  name_en: z.string().min(1).max(255),
  organization_id: z.string().uuid(),
  role: z.enum(['VIEWER', 'MEMBER', 'MANAGER', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN']),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  confirm_password: z.string().min(1),
}).refine(data => data.new_password === data.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });
