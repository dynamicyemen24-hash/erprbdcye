/**
 * useLatest — Always return latest ref value
 */

import { useRef } from 'react';

export function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
