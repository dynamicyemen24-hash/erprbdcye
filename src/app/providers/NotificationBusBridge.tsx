/**
 * Notification Bus → Design System bridge.
 *
 * ─── Why this file exists ──────────────────────────────────────────────────────
 * The platform had two notification pipelines that had drifted apart:
 *
 *   1. `EnterpriseNotificationBus` — the *contract*. Every one of the 15
 *      NEB domains emits through it (`enterpriseBus.notifyToast(...)`), the
 *      offline sync queue raises connectivity events on it, and ~40 view
 *      files import the `showToast` façade from it.
 *   2. `ToastProvider` — the *renderer*. 354 lines of Design System code with
 *      RTL-aware positioning, a dismiss affordance, an action slot, a
 *      `promise()` helper, and a correct WCAG 4.1.3 politeness model. It was
 *      mounted nowhere in the application; `useToast` had zero call sites.
 *
 * So the contract was real and widely used while the accessible renderer was
 * dead code, and the live renderer was a hand-rolled 130-line container that
 * announced *everything* as `role="alert"` + `aria-live="polite"` — meaning a
 * failed payment was announced at the same volume as "session restored", and
 * a screen-reader user could miss it entirely.
 *
 * This bridge keeps the contract untouched and swaps the renderer, so all
 * ~120 existing call sites inherit the accessible pipeline for free, with no
 * churn at the call sites and no risk of double-rendering: only one viewport
 * is ever mounted (the Design System one), because the legacy container is no
 * longer rendered by the shell.
 */

import { useEffect, useRef } from 'react';
import {
  EnterpriseNotificationBus,
  type ToastMessage,
} from '../../lib/enterpriseNotificationBus';
import { useToast, type ToastVariant } from '../../design-system';

/** The bus vocabulary is a strict subset of the Design System variants. */
const VARIANT_MAP: Record<ToastMessage['type'], ToastVariant> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

export function NotificationBusBridge() {
  const { addToast } = useToast();

  // Keep the latest `addToast` in a ref so the subscription is registered
  // exactly once. Re-subscribing on every render would replay nothing but
  // would still churn the listener list on each provider state change.
  const addRef = useRef(addToast);
  addRef.current = addToast;

  useEffect(() => {
    const bus = EnterpriseNotificationBus.getInstance();
    return bus.subscribeToToasts((toast: ToastMessage) => {
      addRef.current({
        variant: VARIANT_MAP[toast.type] ?? 'info',
        // The bus callers already localise before emitting, so the payload is
        // passed straight through. Deliberately NOT titleAr/descriptionAr:
        // the Design System prefers the *Ar variant under RTL, and leaving it
        // undefined makes it fall back to the already-correct string.
        title: toast.title,
        description: toast.message,
        ...(toast.duration ? { duration: toast.duration } : {}),
      });
    });
  }, []);

  return null;
}

export default NotificationBusBridge;
