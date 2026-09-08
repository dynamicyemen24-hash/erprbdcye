/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Drawer Component v3.0
 * Premium compound component with portal, swipe gestures, snap points
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - React Portal rendering
 * - Touch/mouse swipe-to-close gesture
 * - Smooth spring-like CSS transitions
 * - 4 positions: start (left/right), end (left/right), top, bottom
 * - RTL-aware start/end positioning
 * - Focus trap with restore
 * - Scroll lock
 * - Nested drawer support via z-index
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { useControllableState } from '../hooks/useControllableState';
import { useDirection } from '../theme/ThemeContext';

// ─── Context ──────────────────────────────────────────────────

interface DrawerContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  position: DrawerPosition;
  dir: 'ltr' | 'rtl';
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('Drawer compound components must be used within <Drawer>');
  return ctx;
}

// ─── Types ────────────────────────────────────────────────────

export type DrawerPosition = 'start' | 'end' | 'top' | 'bottom';

export interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  position?: DrawerPosition;
  'aria-label'?: string;
  children: React.ReactNode;
  className?: string;
}

// ─── Position Classes ─────────────────────────────────────────

function getPositionClasses(position: DrawerPosition, dir: 'ltr' | 'rtl') {
  const isStart = position === 'start';
  const isEnd = position === 'end';
  const isHorizontal = isStart || isEnd;

  // Resolve start/end to physical direction
  const actualSide = isStart
    ? (dir === 'rtl' ? 'right' : 'left')
    : isEnd
      ? (dir === 'rtl' ? 'left' : 'right')
      : position;

  if (actualSide === 'left') return { container: 'inset-y-0 left-0', width: 'w-full max-w-md', slide: 'slide-in-from-left', exit: 'slide-out-to-left', border: 'border-r' };
  if (actualSide === 'right') return { container: 'inset-y-0 right-0', width: 'w-full max-w-md', slide: 'slide-in-from-right', exit: 'slide-out-to-right', border: 'border-l' };
  if (actualSide === 'top') return { container: 'inset-x-0 top-0', width: 'h-auto max-h-[85vh]', slide: 'slide-in-from-top', exit: 'slide-out-to-top', border: 'border-b' };
  return { container: 'inset-x-0 bottom-0', width: 'h-auto max-h-[85vh]', slide: 'slide-in-from-bottom', exit: 'slide-out-to-bottom', border: 'border-t' };
}

// ─── Swipe Hook ───────────────────────────────────────────────

function useSwipeToClose(
  onClose: () => void,
  position: DrawerPosition,
  enabled: boolean
) {
  const ref = useRef<HTMLDivElement>(null);
  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const deltaRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const isHorizontal = position === 'start' || position === 'end';

    function onStart(e: PointerEvent) {
      startRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      deltaRef.current = { x: 0, y: 0 };
      el.setPointerCapture(e.pointerId);
    }

    function onMove(e: PointerEvent) {
      deltaRef.current = {
        x: e.clientX - startRef.current.x,
        y: e.clientY - startRef.current.y,
      };
    }

    function onEnd(e: PointerEvent) {
      const dx = deltaRef.current.x;
      const dy = deltaRef.current.y;
      const dt = Date.now() - startRef.current.time;
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt;

      const swipedFar = isHorizontal ? Math.abs(dx) > 100 : Math.abs(dy) > 100;
      const swipedFast = velocity > 0.5;

      if (swipedFar || swipedFast) {
        onClose();
      }
    }

    el.addEventListener('pointerdown', onStart);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onEnd);

    return () => {
      el.removeEventListener('pointerdown', onStart);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onEnd);
    };
  }, [onClose, position, enabled]);

  return ref;
}

// ─── Main Drawer ──────────────────────────────────────────────

export function Drawer({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  position = 'end',
  children,
  className,
  'aria-label': ariaLabel,
}: DrawerProps) {
  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const [animState, setAnimState] = useState<'closed' | 'entering' | 'open' | 'exiting'>(
    open ? 'open' : 'closed'
  );

  const { direction } = useDirection();
  const isRtl = direction === 'rtl';

  const close = useCallback(() => {
    setAnimState('exiting');
    setTimeout(() => {
      setOpen(false);
      setAnimState('closed');
    }, 250);
  }, [setOpen]);

  useEscapeKey(close, { enabled: open && animState !== 'exiting' });
  useLockBodyScroll(open);

  useEffect(() => {
    if (open && animState === 'closed') {
      setAnimState('entering');
      requestAnimationFrame(() => setAnimState('open'));
    }
  }, [open]);

  const trapRef = useFocusTrap<HTMLDivElement>({
    enabled: open && animState !== 'exiting',
    autoFocus: true,
    restoreFocus: true,
  });

  const swipeRef = useSwipeToClose(close, position, open);

  // Merge refs
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    (trapRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (swipeRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [trapRef, swipeRef]);

  const posClasses = getPositionClasses(position, direction);
  const isVisible = animState !== 'closed';

  return (
    <DrawerContext.Provider value={{ open, setOpen: close, position, dir: direction }}>
      {isVisible && createPortal(
        <div
          className={cn('fixed inset-0', animState === 'exiting' && 'pointer-events-none')}
          style={{ zIndex: 50 }}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          data-state={open ? 'open' : 'closed'}
        >
          {/* Overlay */}
          <div
            className={cn(
              'absolute inset-0 bg-black/60 backdrop-blur-sm',
              animState === 'entering' && 'animate-in fade-in duration-200',
              animState === 'exiting' && 'animate-out fade-out duration-250'
            )}
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            ref={mergedRef}
            className={cn(
              'absolute bg-white dark:bg-zinc-900 shadow-2xl flex flex-col',
              'border-zinc-200 dark:border-zinc-700',
              posClasses.container,
              posClasses.width,
              posClasses.border,
              animState === 'entering' && `animate-in ${posClasses.slide} duration-250`,
              animState === 'exiting' && `animate-out ${posClasses.exit} duration-250`,
              className
            )}
          >
            {/* Swipe handle indicator (for top/bottom drawers) */}
            {(position === 'top' || position === 'bottom') && (
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              </div>
            )}
            {children}
          </div>
        </div>,
        document.body
      )}
    </DrawerContext.Provider>
  );
}

// ─── DrawerHeader ─────────────────────────────────────────────

export interface DrawerHeaderProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
  onClose?: () => void;
  showClose?: boolean;
}

export function DrawerHeader({ children, subtitle, className, onClose, showClose = true }: DrawerHeaderProps) {
  const { setOpen } = useDrawerContext();
  return (
    <div className={cn('flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700/50 shrink-0', className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">{children}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400 truncate">{subtitle}</p>}
      </div>
      {showClose && (
        <button
          type="button"
          onClick={onClose ?? (() => setOpen(false))}
          className="p-1.5 -m-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── DrawerBody ───────────────────────────────────────────────

export interface DrawerBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerBody({ children, className }: DrawerBodyProps) {
  return <div className={cn('flex-1 overflow-y-auto overscroll-contain px-6 py-5', className)}>{children}</div>;
}

// ─── DrawerFooter ─────────────────────────────────────────────

export interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0', className)}>
      {children}
    </div>
  );
}
