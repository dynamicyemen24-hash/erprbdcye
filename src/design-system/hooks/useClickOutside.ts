/**
 * useClickOutside — Detect clicks outside a ref element
 * Adapted from NICYE design-system hooks/useClickOutside.ts
 */

import { useEffect, useRef } from 'react';

export interface UseClickOutsideOptions {
  enabled?: boolean;
  event?: 'pointerdown' | 'mousedown' | 'click';
}

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: Event) => void,
  { enabled = true, event = 'pointerdown' }: UseClickOutsideOptions = {}
) {
  const ref = useRef<T>(null);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    function handleEvent(e: Event) {
      const target = e.target as Node;
      if (!ref.current || ref.current.contains(target)) return;
      handlerRef.current(e);
    }

    document.addEventListener(event, handleEvent);
    return () => document.removeEventListener(event, handleEvent);
  }, [enabled, event]);

  return ref;
}
