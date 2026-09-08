import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, changePasswordSchema } from '../auth.schema';
import { createTransactionSchema } from '../finance.schema';
import { createProjectSchema } from '../project.schema';
import { createUserSchema, updateUserSchema } from '../user.schema';
import { paginationSchema, uuidParamSchema, bulkDeleteSchema } from '../common.schema';

describe('Auth Validators', () => {
  it('login accepts valid data', () => { expect(loginSchema.parse({ email: 'a@b.com', password: '123' })).toBeTruthy(); });
  it('login rejects invalid email', () => { expect(() => loginSchema.parse({ email: 'bad', password: '123' })).toThrow(); });
  it('register accepts valid data', () => { expect(registerSchema.parse({ email: 'a@b.com', password: 'Strong1!', name_ar: 'test', name_en: 'test', organization_id: '550e8400-e29b-41d4-a716-446655440000', role: 'MEMBER' })).toBeTruthy(); });
  it('changePassword rejects mismatch', () => { expect(() => changePasswordSchema.parse({ current_password: 'a', new_password: 'Strong1!', confirm_password: 'Different1!' })).toThrow(); });
});

describe('Finance Validators', () => {
  it('createTransaction accepts valid data', () => { expect(createTransactionSchema.parse({ transaction_date: '2024-01-01', transaction_type: 'INCOME', amount: 100, currency_code: 'USD', description: 'Test' })).toBeTruthy(); });
  it('createTransaction rejects negative amount', () => { expect(() => createTransactionSchema.parse({ transaction_date: '2024-01-01', transaction_type: 'INCOME', amount: -100, currency_code: 'USD', description: 'Test' })).toThrow(); });
});

describe('Project Validators', () => {
  it('createProject accepts valid data', () => { expect(createProjectSchema.parse({ name_ar: 'مشروع', name_en: 'Project' })).toBeTruthy(); });
});

describe('User Validators', () => {
  it('createUser accepts valid data', () => { expect(createUserSchema.parse({ name_ar: 'مستخدم', name_en: 'User', email: 'u@t.com', password: 'Strong1!', role: 'MEMBER', organization_id: '550e8400-e29b-41d4-a716-446655440000' })).toBeTruthy(); });
  it('updateUser accepts partial data', () => { expect(updateUserSchema.parse({ name_en: 'Updated' })).toBeTruthy(); });
});

describe('Common Validators', () => {
  it('pagination applies defaults', () => { const r = paginationSchema.parse({}); expect(r.page).toBe(1); expect(r.limit).toBe(20); });
  it('uuidParam rejects invalid', () => { expect(() => uuidParamSchema.parse({ id: 'not-uuid' })).toThrow(); });
  it('bulkDelete accepts array', () => { expect(bulkDeleteSchema.parse({ ids: ['550e8400-e29b-41d4-a716-446655440000'] })).toBeTruthy(); });
  it('bulkDelete rejects empty', () => { expect(() => bulkDeleteSchema.parse({ ids: [] })).toThrow(); });
});
