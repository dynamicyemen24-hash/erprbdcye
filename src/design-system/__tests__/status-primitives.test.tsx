import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/Badge';
import { Alert } from '../components/Alert';
import { VisuallyHidden, SkipLink } from '../components/VisuallyHidden';

/**
 * Status primitives.
 *
 * The assertions target the accessibility contract, because the visual contract
 * (a coloured pill) is the easy half and the one that was already duplicated
 * inconsistently across 95 hand-written pills.
 */
describe('Badge', () => {
  it('exposes a closed variant vocabulary', () => {
    // The point of the closed set is that a screen cannot invent a "warning-ish"
    // shade; consistency of status colour is what makes them scannable.
    render(
      <>
        <Badge variant="success">Active</Badge>
        <Badge variant="danger">Rejected</Badge>
      </>
    );
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Rejected')).toBeTruthy();
  });

  it('hides the status dot from assistive technology', () => {
    // The dot is decoration next to the text; announcing it would read the
    // status twice, or read a bare "•".
    const { container } = render(<Badge dot>Active</Badge>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('replaces the visual text with an unambiguous spoken label when asked', () => {
    // A bare "16%" is meaningless announced; the status carries the meaning.
    render(<Badge srLabel="16 percent of target, on track">16%</Badge>);
    expect(screen.getByText('16 percent of target, on track')).toBeTruthy();
  });
});

describe('Alert', () => {
  it('is a live region so it is announced when it appears', () => {
    // WCAG 4.1.3. A persistent message that is not announced is invisible to a
    // screen-reader user, and putting it in a toast would lose it entirely.
    render(<Alert variant="danger">Save failed</Alert>);
    expect(screen.getByRole('alert').textContent).toContain('Save failed');
  });

  it('keeps role="alert" even when a caller passes their own role', () => {
    // The role is the component's reason to exist. A caller passing
    // `role="presentation"` would otherwise silently strip the live-region
    // semantics, and the message would simply never be announced.
    render(
      <Alert {...({ role: 'presentation' } as Record<string, unknown>)}>x</Alert>
    );
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('gives the dismiss control an accessible name', () => {
    // WCAG 4.1.2 — an icon-only button announced as "button" is unusable.
    render(<Alert onDismiss={() => {}} dismissLabel="Close warning">Careful</Alert>);
    expect(screen.getByRole('button', { name: 'Close warning' })).toBeTruthy();
  });

  it('calls onDismiss when dismissed', () => {
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss}>x</Alert>);
    screen.getByRole('button').click();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('renders a title separately from the body', () => {
    render(
      <Alert title="Quota exceeded" variant="warning">
        You have used 98% of your storage.
      </Alert>
    );
    expect(screen.getByText('Quota exceeded')).toBeTruthy();
  });
});

describe('VisuallyHidden / SkipLink', () => {
  it('keeps content in the accessibility tree while hiding it visually', () => {
    render(<VisuallyHidden>Additional context</VisuallyHidden>);
    expect(screen.getByText('Additional context')).toBeTruthy();
  });

  it('reveals a skip link on focus, which a permanent clip never could', () => {
    // WCAG 2.4.1. `sr-only` alone would clip the link forever, making the
    // mechanism inert for sighted keyboard users while still being announced.
    render(<SkipLink targetId="main-content">Skip to content</SkipLink>);
    const link = screen.getByRole('link', { name: 'Skip to content' });
    expect(link.getAttribute('href')).toBe('#main-content');
    expect(link.className).toContain('focus:not-sr-only');
  });

  it('stacks the skip link above every other layer', () => {
    render(<SkipLink targetId="main">Skip</SkipLink>);
    expect(screen.getByRole('link').className).toContain('z-skip-link');
  });
});
