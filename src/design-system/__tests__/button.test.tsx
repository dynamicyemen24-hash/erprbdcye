import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/Button';

/**
 * The canonical action control.
 *
 * These assertions target the guarantees the component *adds* over a raw
 * <button>, because a test that only checked "it renders" would pass for a
 * plain element too and prove nothing.
 */
describe('Button', () => {
  it('renders a real button that defaults to type="button"', () => {
    // type="submit" is the HTML default, so an unlabelled type in a form
    // submits the form on click — a classic accidental-post bug in an ERP.
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('type', 'button');
  });

  it('keeps its accessible name and announces busy while loading', () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole('button');
    // WCAG 4.1.3: a spinner alone announces nothing, so the state has to be
    // explicit and the name has to survive.
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.textContent).toContain('Save');
  });

  it('does not collapse the label while loading, so the layout cannot shift', () => {
    // The label stays in the DOM (hidden visually) — a button that shrinks to a
    // spinner and grows back moves whatever is under the user's cursor.
    render(<Button loading>Save</Button>);
    const label = screen.getByRole('button').querySelector('span');
    expect(label).toBeTruthy();
  });

  it('disables while loading, so a double submit cannot happen', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toHaveProperty('disabled', true);
  });

  it('gives an icon-only button an accessible name', () => {
    // WCAG 4.1.2 — without this the control is announced as just "button".
    render(<Button iconOnly label="Delete beneficiary" />);
    expect(
      screen.getByRole('button', { name: 'Delete beneficiary' })
    ).toBeTruthy();
  });

  it('lets an explicit aria-label win over the label prop', () => {
    render(<Button iconOnly label="Delete" aria-label="حذف المستفيد" />);
    expect(screen.getByRole('button', { name: 'حذف المستفيد' })).toBeTruthy();
  });

  it('does not declare a per-variant focus ring', () => {
    // The platform baseline in index.css owns focus visibility. A variant that
    // also declared `focus:ring-*` would out-rank the base layer and produce
    // two competing indicators on some buttons.
    render(<Button variant="primary">Save</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).not.toMatch(/focus:ring-/);
  });

  it('forwards clicks and honours disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<Button onClick={onClick} disabled>Go</Button>);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledTimes(1); // still 1 — disabled swallows it
  });

  it('supports block layout', () => {
    render(<Button block>Full width</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });
});
