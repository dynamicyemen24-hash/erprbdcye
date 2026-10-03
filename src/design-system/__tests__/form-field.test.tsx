import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from '../components/form/FormField';
import { Input } from '../components/form/Input';

/**
 * The canonical ERP form pattern (SAP Fiori / Oracle Redwood / Fluent).
 *
 * These assertions are about the *wiring*, not the styling: the value of the
 * component is that the association is derived rather than remembered, so each
 * test breaks a specific wire.
 */
describe('FormField', () => {
  it('associates the label with the control by id', () => {
    render(
      <FormField label="Sector">
        <Input />
      </FormField>
    );
    expect(screen.getByLabelText('Sector')).toBeDefined();
  });

  it('generates a unique id per instance, so it is safe inside a .map()', () => {
    // This is the whole reason the view layer could not be fixed mechanically:
    // a hand-written id repeats across rows. useId() makes the component
    // correct by construction.
    render(
      <>
        {['A', 'B', 'C'].map((v) => (
          <FormField key={v} label={v}>
            <Input />
          </FormField>
        ))}
      </>
    );
    const a = screen.getByLabelText('A') as HTMLInputElement;
    const b = screen.getByLabelText('B') as HTMLInputElement;
    const c = screen.getByLabelText('C') as HTMLInputElement;
    expect(a.id).not.toBe(b.id);
    expect(b.id).not.toBe(c.id);
  });

  it('points aria-describedby at the help text', () => {
    render(
      <FormField label="Amount" description="In YER">
        <Input />
      </FormField>
    );
    const input = screen.getByLabelText('Amount');
    const described = input.getAttribute('aria-describedby');
    expect(described).toBeTruthy();
    expect(document.getElementById(described!)?.textContent).toContain('In YER');
  });

  it('sets aria-invalid and announces the error when validation fails', () => {
    render(
      <FormField label="Amount" error="Required">
        <Input />
      </FormField>
    );
    const input = screen.getByLabelText('Amount');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    // WCAG 4.1.3: the failure must be announced, not merely drawn.
    expect(screen.getByRole('alert').textContent).toContain('Required');
  });

  it('lets the error take precedence over help in aria-describedby', () => {
    render(
      <FormField label="Amount" description="In YER" error="Too large">
        <Input />
      </FormField>
    );
    const input = screen.getByLabelText('Amount');
    const described = input.getAttribute('aria-describedby')!;
    // Only one element can own aria-describedby; the error is the more urgent.
    expect(document.getElementById(described)?.textContent).toContain('Too large');
  });

  it('marks the required state programmatically, not by colour alone', () => {
    render(
      <FormField label="Amount" required>
        <Input />
      </FormField>
    );
    const input = screen.getByLabelText(/Amount/);
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('prefers the Arabic label under RTL', () => {
    render(
      <FormField lang="ar" label="Amount" labelAr="المبلغ">
        <Input />
      </FormField>
    );
    expect(screen.getByLabelText('المبلغ')).toBeDefined();
  });

  it('disables the control when the field is disabled', () => {
    render(
      <FormField label="Amount" disabled>
        <Input />
      </FormField>
    );
    expect((screen.getByLabelText('Amount') as HTMLInputElement).disabled).toBe(true);
  });
});