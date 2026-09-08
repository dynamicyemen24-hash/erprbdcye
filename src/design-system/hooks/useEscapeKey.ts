/**
 * useEscapeKey — Listen for Escape key press
 */

import { useEffect, useRef } from 'react';

export function useEscapeKey(handler: () => void, { enabled = true } = {}) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handlerRef.current();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [enabled]);
}
