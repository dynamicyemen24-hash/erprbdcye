import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToggle } from '../hooks/useToggle';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePrevious } from '../hooks/usePrevious';
import { useMounted } from '../hooks/useMounted';

describe('useToggle', () => {
  it('toggles value', () => {
    const { result } = renderHook(() => useToggle(false));
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
  });

  it('sets specific value', () => {
    const { result } = renderHook(() => useToggle(false));
    act(() => result.current[2](true));
    expect(result.current[0]).toBe(true);
  });

  it('toggles back to false', () => {
    const { result } = renderHook(() => useToggle(true));
    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
  });

  it('respects default value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it('set function overrides toggle', () => {
    const { result } = renderHook(() => useToggle(false));
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    act(() => result.current[2](false));
    expect(result.current[0]).toBe(false);
  });
});

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } }
    );
    expect(result.current).toBe('a');
    rerender({ value: 'b' });
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('b');
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('does not update before delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 200),
      { initialProps: { value: 'x' } }
    );
    rerender({ value: 'y' });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('x');
  });

  it('clears timer on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } }
    );
    rerender({ value: 'b' });
    unmount();
    act(() => vi.advanceTimersByTime(300));
  });
});

describe('usePrevious', () => {
  it('returns previous value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 1 } }
    );
    expect(result.current).toBeUndefined();
    rerender({ value: 2 });
    expect(result.current).toBe(1);
  });

  it('updates on subsequent renders', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 'a' } }
    );
    rerender({ value: 'b' });
    expect(result.current).toBe('a');
    rerender({ value: 'c' });
    expect(result.current).toBe('b');
  });

  it('handles undefined to value transition', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: undefined as string | undefined } }
    );
    expect(result.current).toBeUndefined();
    rerender({ value: 'hello' });
    expect(result.current).toBeUndefined();
    rerender({ value: 'world' });
    expect(result.current).toBe('hello');
  });
});

describe('useMounted', () => {
  it('returns true after mount', () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(true);
  });
});
