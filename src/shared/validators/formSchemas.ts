import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح / Invalid email'),
  password: z.string().min(1, 'كلمة المرور مطلوبة / Password required'),
  organization_code: z.string().optional(),
});

export const registerFormSchema = z.object({
  name_ar: z.string().min(2, 'الاسم العربي مطلوب / Arabic name required').max(255),
  name_en: z.string().min(2, 'الاسم الإنجليزي مطلوب / English name required').max(255),
  email: z.string().email('البريد الإلكتروني غير صالح / Invalid email'),
  password: z.string()
    .min(8, '8 أحرف على الأقل / At least 8 characters')
    .regex(/[A-Z]/, 'حرف كبير واحد على الأقل / At least one uppercase')
    .regex(/[a-z]/, 'حرف صغير واحد على الأقل / At least one lowercase')
    .regex(/[0-9]/, 'رقم واحد على الأقل / At least one number'),
  confirmPassword: z.string(),
  phone: z.string().max(20).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين / Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordFormSchema = z.object({
  current_password: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  new_password: z.string()
    .min(8, '8 أحرف على الأقل')
    .regex(/[A-Z]/, 'حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'رقم واحد على الأقل'),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm_password'],
});

export const transactionFormSchema = z.object({
  transaction_date: z.string().min(1, 'التاريخ مطلوب'),
  transaction_type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'ADJUSTMENT'], { errorMap: () => ({ message: 'نوع المعاملة مطلوب' }) }),
  amount: z.number().positive('المبلغ يجب أن يكون موجباً'),
  currency_code: z.string().length(3, 'رمز العملة 3 أحرف'),
  description: z.string().min(1, 'الوصف مطلوب').max(500),
  category_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export const projectFormSchema = z.object({
  name_ar: z.string().min(2, 'الاسم العربي مطلوب'),
  name_en: z.string().min(2, 'الاسم الإنجليزي مطلوب'),
  description: z.string().max(2000).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().min(0).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export const userFormSchema = z.object({
  name_ar: z.string().min(2, 'الاسم العربي مطلوب'),
  name_en: z.string().min(2, 'الاسم الإنجليزي مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  role: z.enum(['VIEWER', 'MEMBER', 'MANAGER', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN']),
  phone: z.string().max(20).optional(),
  department_id: z.string().uuid().optional(),
});

export const searchFormSchema = z.object({
  query: z.string().min(1, 'البحث مطلوب').max(200),
  filters: z.record(z.any()).optional(),
});

export type LoginForm = z.infer<typeof loginFormSchema>;
export type RegisterForm = z.infer<typeof registerFormSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordFormSchema>;
export type TransactionForm = z.infer<typeof transactionFormSchema>;
export type ProjectForm = z.infer<typeof projectFormSchema>;
export type UserForm = z.infer<typeof userFormSchema>;
