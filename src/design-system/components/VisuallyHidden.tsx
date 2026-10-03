/**
 * VisuallyHidden — content for assistive technology only.
 *
 * WHY A COMPONENT AND NOT THE `sr-only` UTILITY
 * Tailwind's `sr-only` is a single-purpose clip, and it is the right tool for
 * one thing: text that supplements a visible control. It is the wrong tool for
 * everything else this file covers, because those cases need *behaviour*, not
 * styling:
 *
 *   - `focusable` — a skip link must become visible when focused. `sr-only`
 *     clips it forever, and a permanently clipped control is invisible to every
 *     user, keyboard and screen-reader alike. The skip link is the one element
 *     that must never be clipped.
 *   - a live region wrapper, which needs an explicit `role`/`aria-live` pair
 *     that a utility cannot express.
 *
 * Every case below is one where getting it wrong removes a capability from a
 * real group of users rather than merely looking untidy.
 */
import React from 'react';
import { cn } from '../utils/cn';

type As = 'span' | 'div' | 'p';

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLElement> {
  as?: As;
  /**
   * Reveal the content when it receives keyboard focus. Required for skip
   * links (WCAG 2.4.1): a skip link that stays clipped is a skip link nobody
   * can see, which makes the whole mechanism inert for sighted keyboard users
   * while still being announced.
   */
  focusable?: boolean;
}

const BASE =
  'absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 m-0 [clip:rect(0,0,0,0)] [clip-path:inset(50%)]';

export function VisuallyHidden({
  as: Tag = 'span',
  focusable,
  className,
  children,
  ...rest
}: VisuallyHiddenProps) {
  return (
    <Tag
      // `group-focus-within` on an ancestor would be the alternative, but the
      // element itself is the thing that must become visible, and only the
      // browser can answer "am I focused".
      data-focusable={focusable || undefined}
      className={cn(BASE, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * A skip link: hidden until focused, then pinned to the viewport.
 *
 * WCAG 2.4.1 Bypass Blocks (Level A). `sr-only` alone cannot implement this —
 * the link must be *visible* once tabbed to, and a clip never lifts itself.
 */
export function SkipLink({
  targetId,
  children,
  className,
  ...rest
}: VisuallyHiddenProps & { targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:fixed focus:top-4 focus:start-4 focus:z-skip-link',
        'focus:rounded-xl focus:bg-brand-primary focus:px-4 focus:py-2',
        'focus:text-sm focus:font-bold focus:text-white focus:shadow-lg',
        className
      )}
      {...rest}
    >
      {children}
    </a>
  );
}

export default VisuallyHidden;
