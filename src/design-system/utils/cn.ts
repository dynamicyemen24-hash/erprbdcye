/**
 * UAMEX ERP™ — Class Name Utility
 *
 * `clsx`-style conditional joining, then a conflict-aware merge.
 *
 * WHY tailwind-merge AND NOT A PLAIN JOIN
 * Two class strings both ending in a `p-*` (or `text-*`, `bg-*`) silently
 * produce two live declarations and the winner is decided by stylesheet order,
 * not by intent. `twMerge` resolves that at the point of composition, which is
 * what makes the conditional-class idiom in the view layer predictable: the
 * last one passed in actually wins.
 *
 * The extensions below register the two *project-specific* vocabularies that
 * the stock config does not know about, so they participate in the same
 * conflict resolution instead of being treated as unrelated custom classes.
 */

import { extendTailwindMerge } from 'tailwind-merge';

export function cn(...values: Array<string | false | null | undefined>): string {
  return twMerge(values.filter(Boolean).join(' '));
}

/** Explicit class-list variant for callers that already hold a string[][]. */
export function cx(...values: Array<string | false | null | undefined>): string {
  return twMerge(values.filter(Boolean).join(' '));
}

const twMerge = extendTailwindMerge<'ux-motion', 'ux-animate'>({
  //                     ^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^
  // `extendTailwindMerge` widens its class-group and theme-group id unions only
  // through explicit type arguments (they default to `never`), so an
  // un-annotated call is rejected as "unknown property 'ux-motion'" even though
  // the value is valid at runtime. Naming the two ids here is what makes the
  // registration type-check without a cast.
  extend: {
    classGroups: {
      // Z-index governance scale (src/index.css). The stock tailwind-merge group
      // is `z`, so these governed names join the same conflict set as `z-10`,
      // letting a component override `z-50` with `z-dialog` deterministically.
      z: [
        {
          z: [
            'base',
            'sticky',
            'dropdown',
            'popover',
            'tooltip',
            'drawer',
            'dialog',
            'command',
            'critical',
            'toast',
            'skip-link',
          ],
        },
      ],
      // Design System v3 motion primitives (design-system/animations.css).
      // The `ux-` prefix means these do NOT sit in Tailwind's built-in `animate`
      // group, so without this registration `twMerge` would happily keep
      // `ux-animate-fade-in ux-animate-scale-in` together instead of letting the
      // last one win.
      'ux-motion': [
        {
          'ux-animate': [
            'fade-in',
            'fade-out',
            'fade-in-up',
            'fade-in-down',
            'fade-in-scale',
            'slide-in-right',
            'slide-in-left',
            'slide-in-up',
            'slide-in-down',
            'scale-in',
            'scale-out',
            'pop-in',
            'bounce-in',
            'spring',
            'spin',
            'pulse-ring',
            'glow',
            'glow-accent',
            'toast-in',
            'toast-out',
            'shimmer',
          ],
        },
      ],
    },
  },
});

export default cn;
