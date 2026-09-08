/**
 * useToggle — Boolean toggle hook
 */

import { useState, useCallback } from 'react';

export function useToggle(defaultValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(defaultValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const set = useCallback((v: boolean) => setValue(v), []);
  return [value, toggle, set];
}
