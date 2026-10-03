import { describe, it, expect } from 'vitest';
import { cn } from '../utils/cn';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const showBar = false;
    expect(cn('foo', showBar && 'bar', 'baz')).toBe('foo baz');
  });

  it('resolves Tailwind conflicts so the last class wins', () => {
    // This is the behaviour change that motivated adopting tailwind-merge.
    // Previously `cn` was a plain join, so BOTH classes reached the DOM and
    // the winner was decided by stylesheet order rather than by the caller's
    // intent — a component could pass `px-4` and a `px-8` override and silently
    // get whichever the sheet happened to list last. `cn` now resolves the
    // conflict at composition time, so the override is the one that survives.
    expect(cn('px-4', 'px-8')).toBe('px-8');
  });

  it('resolves conflicts across different scales independently', () => {
    // Resolving one axis must not discard an unrelated one.
    expect(cn('px-4', 'py-2', 'text-sm')).toBe('px-4 py-2 text-sm');
  });

  it('lets the governed z-index scale override an arbitrary Tailwind z', () => {
    // The z-* groups are registered in the tailwind-merge extension, so a
    // component can pass `z-50` and then override with the semantic token.
    expect(cn('z-50', 'z-dialog')).toBe('z-dialog');
  });

  it('keeps only the last Design System motion primitive', () => {
    // ux-animate-* are project-specific and would otherwise be treated as
    // unrelated custom classes, accumulating instead of overriding.
    expect(cn('ux-animate-fade-in', 'ux-animate-scale-in')).toBe('ux-animate-scale-in');
  });

  it('handles undefined/null', () => {
    expect(cn('foo', undefined, null)).toBe('foo');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('filters out false', () => {
    expect(cn('a', false, 'b')).toBe('a b');
  });

  it('filters out null and undefined mixed with truthy', () => {
    expect(cn(null, 'active', undefined, 'visible')).toBe('active visible');
  });

  it('returns single class', () => {
    expect(cn('only')).toBe('only');
  });
});
