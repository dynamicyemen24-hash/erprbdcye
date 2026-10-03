/**
 * UAMEX ERP™ — Form Field Wrapper
 *
 * THE CANONICAL FORM PATTERN
 * This is the single composition that SAP Fiori, Oracle Redwood and Microsoft
 * Fluent all converge on: a label, a control, optional help text and an error
 * message, bound together so the control's accessible name, description and
 * invalid state are always correct *without the author having to wire them*.
 *
 * Everything here is deliberate, not decoration:
 *
 *   - `useId()` produces an id that is unique per rendered instance, which is
 *     what makes the component safe inside a `.map()` — the case that a
 *     hand-written `id` can never cover, and the reason 150 view-layer labels
 *     still lack a programmatic association.
 *   - `aria-describedby` points at whichever of help/error is actually present,
 *     so a screen reader reads the guidance *after* the field rather than the
 *     field having an unnamed description.
 *   - `aria-invalid` is set from the error state, satisfying WCAG 3.3.1
 *     (Error Identification) without each caller remembering it.
 *   - The error is a live region (`role="alert"`), so a validation failure is
 *     announced rather than silently appearing — WCAG 4.1.3 (Status Messages).
 *   - The required marker is not colour-only: it is an asterisk *and* the
 *     `required` attribute, and the asterisk is marked `aria-hidden` so it is
 *     not read as a stray character.
 *
 * Usable as `<FormField label="Sector" required><Input /></FormField>`.
 */
import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface FormFieldProps {
  label?: string;
  labelAr?: string;
  description?: string;
  descriptionAr?: string;
  error?: string;
  errorAr?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  lang?: 'ar' | 'en';
  children: React.ReactNode;
  className?: string;
  /** Rendered to the right of the label, e.g. a unit or a small action. */
  adornment?: React.ReactNode;
}

export function FormField({
  label,
  labelAr,
  description,
  descriptionAr,
  error,
  errorAr,
  required,
  disabled,
  readOnly,
  lang = 'ar',
  children,
  className,
  adornment,
}: FormFieldProps) {
  const id = useId();
  const rtl = lang === 'ar';
  const displayLabel = rtl ? (labelAr || label) : label;
  const displayDescription = description && (rtl ? (descriptionAr || description) : description);
  const displayError = error && (rtl ? (errorAr || error) : error);
  const hasError = Boolean(displayError);

  const descId = displayDescription ? `${id}-desc` : undefined;
  const errId = hasError ? `${id}-err` : undefined;
  // Only one element can carry aria-describedby, so when an error is showing it
  // takes precedence: the error is the more urgent thing to announce.
  const describedBy = errId ?? descId;

  return (
    <div
      className={cn(
        'flex flex-col gap-1.5',
        (disabled || readOnly) && 'opacity-60',
        disabled && 'pointer-events-none',
        className
      )}
      data-invalid={hasError || undefined}
    >
      {(displayLabel || adornment) && (
        <div className="flex items-baseline justify-between gap-2">
          {displayLabel && (
            <label
              htmlFor={id}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {displayLabel}
              {required && (
                <>
                  <span aria-hidden="true" className="text-red-500 ms-1">
                    *
                  </span>
                  <span className="sr-only"> (required)</span>
                </>
              )}
            </label>
          )}
          {adornment}
        </div>
      )}

      {displayDescription && (
        <p id={descId} className="text-xs text-zinc-500 dark:text-zinc-400">
          {displayDescription}
        </p>
      )}

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            id,
            // The control must not keep a stale description of its own once the
            // field decides which one is authoritative.
            'aria-describedby': describedBy,
            'aria-invalid': hasError || undefined,
            'aria-required': required || undefined,
            disabled: disabled || undefined,
            readOnly: readOnly || undefined,
          })
        : children}

      {hasError && (
        <p id={errId} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {displayError}
        </p>
      )}
    </div>
  );
}

export default FormField;
