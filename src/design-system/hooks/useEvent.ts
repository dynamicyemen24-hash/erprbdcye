/**
 * useEvent — Stable event handler reference
 * The callback never changes identity, always calls the latest implementation.
 */

import { useCallback, useRef } from 'react';

export function useEvent<T extends (...args: any[]) => any>(fn: T): T {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((...args: any[]) => fnRef.current(...args), []) as T;
}
