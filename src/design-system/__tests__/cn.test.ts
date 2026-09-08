import { describe, it, expect } from 'vitest';
import { cn } from '../utils/cn';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('resolves Tailwind conflicts', () => {
    expect(cn('px-4', 'px-8')).toBe('px-4 px-8');
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
