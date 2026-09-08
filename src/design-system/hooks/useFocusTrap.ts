/**
 * useFocusTrap — Trap focus within a container with restore
 * Adapted from NICYE design-system hooks/useFocusTrap.ts
 */

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  enabled?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}

export function useFocusTrap<T extends HTMLElement = HTMLElement>({
  enabled = true,
  autoFocus = true,
  restoreFocus = false,
}: UseFocusTrapOptions = {}) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    if (autoFocus) {
      const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
      if (firstFocusable) {
        requestAnimationFrame(() => firstFocusable.focus());
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [enabled, autoFocus, restoreFocus]);

  return containerRef;
}
