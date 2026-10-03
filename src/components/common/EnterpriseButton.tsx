/**
 * -------------------------------------------------------------------------------
 * UAMEX ERP™ — EnterpriseButton
 *
 * @deprecated Use `Button` from the Design System.
 *
 * This now delegates to `design-system/components/Button`, so the view files
 * that already import it keep working while there is exactly ONE definition of
 * the control.
 *
 * WHY THE DELEGATION MATTERS
 * This file used to carry its own size and variant maps, including a
 * `focus-visible:ring-2 focus-visible:ring-offset-2` base class. That base class
 * fights the platform focus baseline declared in index.css
 * (`box-shadow: var(--ux-focus-ring)` on `:focus-visible`): the two compete for
 * the same property, and which one wins depends on cascade order rather than
 * intent. A parallel definition is how a control silently drifts from the
 * accessibility guarantee the platform provides.
 *
 * Delegating removes the possibility rather than fixing one instance: there is
 * no second variant map left to drift.
 *
 * MIGRATION
 *   import { EnterpriseButton } from "../common/EnterpriseButton";
 * becomes
 *   import { Button } from "../design-system";
 * -------------------------------------------------------------------------------
 */
import {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "../../design-system/components/Button";

export type { ButtonVariant, ButtonSize };
export type EnterpriseButtonProps = ButtonProps;

/**
 * Kept only as a re-export so the ~40 existing call sites are unaffected.
 * New code should import `Button` from the design system directly.
 */
export const EnterpriseButton = Button;
export default Button;