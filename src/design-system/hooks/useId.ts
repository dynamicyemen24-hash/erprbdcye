/**
 * useId — Stable unique ID generation (wraps React.useId for SSR safety)
 */

import { useId as useReactId } from 'react';

export function useId(prefix = 'nexora'): string {
  const id = useReactId();
  return `${prefix}-${id}`;
}
