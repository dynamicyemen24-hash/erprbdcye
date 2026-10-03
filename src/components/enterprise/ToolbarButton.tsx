/**
 * Toolbar action button.
 *
 * A third button definition existed here, hand-rolled and missing two things
 * the Design System `Button` already guarantees: an `aria-busy`/loading state
 * and the platform focus ring (this one declares no `focus-visible` style at
 * all, so it relied on whatever the UA supplied and rendered inconsistently
 * with the rest of the shell).
 *
 * It is now a thin composition of `Button` + `Tooltip` — which is the point of
 * the split: `Button` owns the control's behaviour and accessibility, this owns
 * the toolbar-specific shape (square, icon-only, tooltip on hover).
 */
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '../../design-system/components/Button';
import { Tooltip } from '../Tooltip';

interface ToolbarButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  /** Required for an icon-only control: without it a screen reader announces
   *  only "button" (WCAG 4.1.2). */
  label: string;
  disabled?: boolean;
  loading?: boolean;
}

export function ToolbarButton({ icon: Icon, onClick, label, disabled, loading }: ToolbarButtonProps) {
  const buttonNode = (
    <Button
      type="button"
      variant="ghost"
      size="md"
      iconOnly
      label={label}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-colors"
    >
      <Icon className="w-5 h-5" />
    </Button>
  );

  return (
    <Tooltip content={label} position="bottom">
      {buttonNode}
    </Tooltip>
  );
}

