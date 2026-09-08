/**
 * useControllableState — Generic controlled/uncontrolled state
 * Adapted from NICYE design-system hooks/useControllableState.ts
 */

import { useState, useCallback, useRef } from 'react';

export interface UseControllableStateOptions<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<T>(defaultValue as T);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const current = isControlled ? value! : internal;

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setInternal((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        if (!isControlled) onChangeRef.current?.(resolved);
        return resolved;
      });
      if (isControlled) {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(current) : next;
        onChangeRef.current?.(resolved);
      }
    },
    [isControlled, current]
  );

  return [current, set, isControlled];
}
