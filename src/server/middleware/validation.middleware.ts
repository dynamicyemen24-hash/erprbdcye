import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

function translateMessage(msg: string): string {
  const translations: Record<string, string> = {
    'Invalid email format': 'تنسيق البريد الإلكتروني غير صالح',
    'Required': 'مطلوب',
    'Invalid ID format': 'تنسيق المعرف غير صالح',
    'Password is required': 'كلمة المرور مطلوبة',
    'Passwords do not match': 'كلمتا المرور غير متطابقتين',
  };
  return translations[msg] || msg;
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
        const messages = error.errors.map(e => {
          const field = e.path.join('.');
          return lang === 'ar' ? `${field}: ${translateMessage(e.message)}` : `${field}: ${e.message}`;
        });
        res.status(400).json({ error: lang === 'ar' ? 'بيانات غير صحيحة' : 'Validation failed', details: messages });
      } else { next(error); }
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        res.status(400).json({ error: lang === 'ar' ? 'معايير غير صحيحة' : 'Invalid query parameters', details: messages });
      } else { next(error); }
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const lang = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
        res.status(400).json({ error: lang === 'ar' ? 'معرف غير صالح' : 'Invalid parameters', details: error.errors.map(e => e.message) });
      } else { next(error); }
    }
  };
}
