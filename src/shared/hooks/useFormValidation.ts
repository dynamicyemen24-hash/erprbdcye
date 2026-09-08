import { useState, useCallback } from 'react';
import { ZodError, ZodObject } from 'zod';

interface UseFormValidationOptions<T> {
  schema: ZodObject<any>;
  onSubmit: (data: T) => Promise<void> | void;
}

interface UseFormValidationReturn<T> {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (field: string, value: any) => void;
  setValues: (values: Record<string, any>) => void;
  handleBlur: (field: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  validateField: (field: string) => boolean;
}

export function useFormValidation<T extends Record<string, any>>({ schema, onSubmit }: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((field: string) => {
    try {
      const fieldSchema = schema.shape[field as keyof typeof schema.shape];
      if (fieldSchema) {
        (fieldSchema as any).parse(values[field]);
        setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
        return true;
      }
    } catch (e) {
      if (e instanceof ZodError) {
        setErrors(prev => ({ ...prev, [field]: e.errors[0]?.message || 'Invalid' }));
        return false;
      }
    }
    return true;
  }, [schema, values]);

  const setValue = useCallback((field: string, value: any) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field);
  }, [touched, validateField]);

  const setValues = useCallback((newValues: Record<string, any>) => {
    setValuesState(newValues);
  }, []);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  }, [validateField]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);
    try {
      const result = schema.parse(values) as T;
      await onSubmit(result);
    } catch (e) {
      if (e instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        e.errors.forEach(err => {
          const field = err.path.join('.');
          if (!fieldErrors[field]) fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        const touchedFields: Record<string, boolean> = {};
        Object.keys(fieldErrors).forEach(f => { touchedFields[f] = true; });
        setTouched(prev => ({ ...prev, ...touchedFields }));
      }
    } finally { setIsSubmitting(false); }
  }, [schema, values, onSubmit]);

  const reset = useCallback(() => {
    setValuesState({});
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, []);

  const isValid = Object.keys(errors).length === 0 && Object.keys(touched).length > 0;

  return { values, errors, touched, isSubmitting, isValid, setValue, setValues, handleBlur, handleSubmit, reset, validateField };
}
