/**
 * NexoraOS™ — Request Validation System
 * Zod-like schema validation for all API endpoints
 * Type-safe validation with Arabic error messages
 */

import { Request, Response, NextFunction } from 'express';

// ─── Validation Types ──────────────────────────────────

type ValidationType = 'string' | 'number' | 'boolean' | 'date' | 'email' | 'uuid' | 'array' | 'object';

interface FieldSchema {
  type: ValidationType;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean;
  customMessage?: string;
  default?: any;
}

type Schema = Record<string, FieldSchema>;

interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string; code: string }>;
  sanitized: Record<string, any>;
}

// ─── Core Validator ────────────────────────────────────

function validateField(value: any, schema: FieldSchema, fieldName: string): string[] {
  const errors: string[] = [];

  // Required check
  if (schema.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} مطلوب / ${fieldName} is required`);
    return errors;
  }

  // Default value
  if ((value === undefined || value === null) && schema.default !== undefined) {
    return errors; // Will be replaced with default
  }

  // Skip further validation if not present and not required
  if (value === undefined || value === null || value === '') {
    return errors;
  }

  // Type validation
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} يجب أن يكون نصاً / ${fieldName} must be a string`);
        break;
      }
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`${fieldName} يجب أن يكون ${schema.minLength} أحرف على الأقل`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`${fieldName} يجب أن لا يتجاوز ${schema.maxLength} حرف`);
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        errors.push(schema.customMessage || `${fieldName}تنسيق غير صالح`);
      }
      break;

    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${fieldName} يجب أن يكون رقماً / ${fieldName} must be a number`);
        break;
      }
      if (schema.min !== undefined && num < schema.min) {
        errors.push(`${fieldName} يجب أن يكون ${schema.min} على الأقل`);
      }
      if (schema.max !== undefined && num > schema.max) {
        errors.push(`${fieldName} يجب أن لا يتجاوز ${schema.max}`);
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== 0 && value !== 1) {
        errors.push(`${fieldName} يجب أن يكون منطقياً (true/false)`);
      }
      break;

    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push(`${fieldName} يجب أن يكون تاريخاً صالحاً`);
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(String(value))) {
        errors.push(`${fieldName} يجب أن يكون بريد إلكتروني صالحاً`);
      }
      break;

    case 'uuid':
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(String(value))) {
        errors.push(`${fieldName} يجب أن يكون معرفاً صالحاً (UUID)`);
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`${fieldName} يجب أن تكون قائمة`);
        break;
      }
      if (schema.min !== undefined && value.length < schema.min) {
        errors.push(`${fieldName} يجب أن تحتوي على ${schema.min} عناصر على الأقل`);
      }
      if (schema.max !== undefined && value.length > schema.max) {
        errors.push(`${fieldName} يجب أن لا تحتوي على أكثر من ${schema.max} عنصر`);
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push(`${fieldName} يجب أن يكون كائناً`);
      }
      break;
  }

  // Enum validation
  if (schema.enum && schema.enum.length > 0 && !schema.enum.includes(value)) {
    errors.push(`${fieldName} يجب أن يكون أحد القيم: ${schema.enum.join(', ')}`);
  }

  // Custom validation
  if (schema.custom && !schema.custom(value)) {
    errors.push(schema.customMessage || `${fieldName} تحقق مخصص فشل`);
  }

  return errors;
}

export function validate(schema: Schema, data: Record<string, any>): ValidationResult {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  const sanitized: Record<string, any> = {};

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    let value = data[fieldName];

    // Apply default
    if ((value === undefined || value === null) && fieldSchema.default !== undefined) {
      value = fieldSchema.default;
    }

    // Sanitize strings
    if (typeof value === 'string' && fieldSchema.type === 'string') {
      value = value.trim();
      // Security: strip HTML
      value = value.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '');
      // Enforce max length
      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        value = value.substring(0, fieldSchema.maxLength);
      }
    }

    // Validate
    const fieldErrors = validateField(value, fieldSchema, fieldName);
    if (fieldErrors.length > 0) {
      fieldErrors.forEach(msg => {
        errors.push({ field: fieldName, message: msg, code: 'VALIDATION_ERROR' });
      });
    }

    sanitized[fieldName] = value;
  }

  return { valid: errors.length === 0, errors, sanitized };
}

// ─── Middleware Factory ────────────────────────────────

export function validateBody(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validate(schema, req.body);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: result.errors },
        timestamp: new Date().toISOString(),
      });
    }
    req.body = result.sanitized;
    next();
  };
}

export function validateQuery(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validate(schema, req.query as Record<string, any>);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Query validation failed', details: result.errors },
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
}

// ─── Common Schemas ────────────────────────────────────

export const Schemas = {
  // Pagination
  pagination: {
    page: { type: 'number' as const, min: 1, default: 1 },
    limit: { type: 'number' as const, min: 1, max: 500, default: 50 },
    sortBy: { type: 'string' as const, maxLength: 50 },
    sortOrder: { type: 'string' as const, enum: ['asc', 'desc'], default: 'desc' },
    search: { type: 'string' as const, maxLength: 200 },
  },

  // Auth
  login: {
    email: { type: 'email' as const, required: true, maxLength: 254 },
    password: { type: 'string' as const, required: true, minLength: 8, maxLength: 128 },
  },

  register: {
    email: { type: 'email' as const, required: true, maxLength: 254 },
    password: { type: 'string' as const, required: true, minLength: 8, maxLength: 128 },
    name: { type: 'string' as const, required: true, minLength: 2, maxLength: 100 },
    nameAr: { type: 'string' as const, maxLength: 100 },
    orgNameAr: { type: 'string' as const, required: true, minLength: 3, maxLength: 200 },
    orgNameEn: { type: 'string' as const, required: true, minLength: 3, maxLength: 200 },
  },

  // Projects
  projectCreate: {
    nameAr: { type: 'string' as const, required: true, minLength: 3, maxLength: 200 },
    nameEn: { type: 'string' as const, maxLength: 200 },
    projectCode: { type: 'string' as const, maxLength: 50 },
    programId: { type: 'uuid' as const },
    statusCode: { type: 'string' as const, enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] },
    budget: { type: 'number' as const, min: 0 },
    startDate: { type: 'date' as const },
    endDate: { type: 'date' as const },
  },

  // Transactions
  transactionCreate: {
    transactionType: { type: 'string' as const, required: true, enum: ['JOURNAL_ENTRY', 'PAYMENT', 'RECEIPT', 'TRANSFER', 'ADJUSTMENT'] },
    description: { type: 'string' as const, required: true, minLength: 3, maxLength: 500 },
    referenceNumber: { type: 'string' as const, maxLength: 100 },
    projectId: { type: 'uuid' as const },
    lines: { type: 'array' as const, required: true, min: 2, max: 50 },
  },

  // Beneficiaries
  beneficiaryCreate: {
    fullNameAr: { type: 'string' as const, required: true, minLength: 3, maxLength: 200 },
    fullNameEn: { type: 'string' as const, maxLength: 200 },
    gender: { type: 'string' as const, enum: ['MALE', 'FEMALE'] },
    birthDate: { type: 'date' as const },
    familyMembersCount: { type: 'number' as const, min: 1, max: 100 },
    vulnerabilityStatus: { type: 'string' as const, enum: ['HIGH', 'MEDIUM', 'LOW'] },
    governorate: { type: 'string' as const, maxLength: 100 },
    district: { type: 'string' as const, maxLength: 100 },
    nationalId: { type: 'string' as const, maxLength: 20 },
  },

  // Donors
  donorCreate: {
    nameAr: { type: 'string' as const, required: true, minLength: 3, maxLength: 200 },
    nameEn: { type: 'string' as const, maxLength: 200 },
    donorType: { type: 'string' as const, enum: ['INSTITUTIONAL', 'INDIVIDUAL', 'UN_AGENCY', 'GOVERNMENT', 'CORPORATE'] },
    country: { type: 'string' as const, maxLength: 100 },
  },

  // Grants
  grantCreate: {
    donorId: { type: 'uuid' as const, required: true },
    grantNumber: { type: 'string' as const, required: true, maxLength: 100 },
    titleAr: { type: 'string' as const, required: true, minLength: 3, maxLength: 300 },
    titleEn: { type: 'string' as const, maxLength: 300 },
    totalAmount: { type: 'number' as const, required: true, min: 0 },
    currencyCode: { type: 'string' as const, enum: ['USD', 'YER', 'SAR', 'EUR'] },
    startDate: { type: 'date' as const },
    endDate: { type: 'date' as const },
  },

  // Service Delivery
  serviceDeliveryCreate: {
    serviceType: { type: 'string' as const, required: true, enum: ['EDUCATION', 'HEALTH', 'FOOD', 'SHELTER', 'LIVELIHOOD', 'PROTECTION', 'WASH', 'OTHER'] },
    beneficiaryCount: { type: 'number' as const, required: true, min: 1 },
    deliveryDate: { type: 'date' as const, required: true },
    location: { type: 'string' as const, maxLength: 200 },
    officerName: { type: 'string' as const, maxLength: 100 },
    projectId: { type: 'uuid' as const },
    beneficiaryId: { type: 'uuid' as const },
    notes: { type: 'string' as const, maxLength: 1000 },
  },

  // Strategic Plan
  strategicPlanCreate: {
    titleAr: { type: 'string' as const, required: true, minLength: 5, maxLength: 300 },
    titleEn: { type: 'string' as const, maxLength: 300 },
    startYear: { type: 'number' as const, required: true, min: 2020, max: 2050 },
    endYear: { type: 'number' as const, required: true, min: 2020, max: 2050 },
    visionAr: { type: 'string' as const, maxLength: 2000 },
    missionAr: { type: 'string' as const, maxLength: 2000 },
    targetBeneficiariesCount: { type: 'number' as const, min: 0 },
    totalEstimatedBudgetYer: { type: 'number' as const, min: 0 },
  },

  // Knowledge Article
  knowledgeCreate: {
    titleAr: { type: 'string' as const, required: true, minLength: 5, maxLength: 300 },
    titleEn: { type: 'string' as const, maxLength: 300 },
    category: { type: 'string' as const, maxLength: 100 },
    contentAr: { type: 'string' as const, maxLength: 50000 },
    contentEn: { type: 'string' as const, maxLength: 50000 },
    tags: { type: 'array' as const, max: 20 },
  },

  // Donation
  donationCreate: {
    amount: { type: 'number' as const, required: true, min: 0.01 },
    currencyCode: { type: 'string' as const, enum: ['USD', 'YER', 'SAR', 'EUR'] },
    paymentMethod: { type: 'string' as const, enum: ['CASH', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'CARD'] },
    donationDate: { type: 'date' as const },
    donorPartyId: { type: 'uuid' as const },
    campaignId: { type: 'uuid' as const },
    paymentReference: { type: 'string' as const, maxLength: 100 },
  },

  // RFQ
  rfqCreate: {
    titleAr: { type: 'string' as const, required: true, minLength: 5, maxLength: 300 },
    titleEn: { type: 'string' as const, maxLength: 300 },
    projectId: { type: 'uuid' as const },
    estimatedValue: { type: 'number' as const, min: 0 },
    currencyCode: { type: 'string' as const, enum: ['USD', 'YER', 'SAR'] },
    submissionDeadline: { type: 'date' as const },
  },
};
