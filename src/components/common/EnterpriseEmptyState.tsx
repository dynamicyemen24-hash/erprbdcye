/**
 * UAMEX ERP™ — Enterprise Empty State 4.0
 *
 * Semantically rich empty-state placeholder with:
 * — Custom icon slot
 * — Optional primary and secondary CTA
 * — Guidance list items
 * — RTL-aware layout
 * — Sizes: sm, md, lg
 */

import React from 'react';
import { enterpriseTokens } from '../../core/theme/enterpriseDesignTokens';
import { InboxIcon } from 'lucide-react';

export interface EnterpriseEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string | React.ReactNode;
  hints?: string[];
  primaryAction?: { label: string; onClick: () => void; icon?: React.ReactNode };
  secondaryAction?: { label: string; onClick: () => void };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CONFIG = {
  sm: { wrapper: 'py-8 px-4',   iconWrap: 'p-3',   icon: 'w-6 h-6', title: 'text-sm', desc: 'text-xs', maxW: 'max-w-xs' },
  md: { wrapper: 'py-14 px-6',  iconWrap: 'p-4',   icon: 'w-8 h-8', title: 'text-base', desc: 'text-xs', maxW: 'max-w-sm' },
  lg: { wrapper: 'py-20 px-8',  iconWrap: 'p-5',   icon: 'w-10 h-10', title: 'text-lg', desc: 'text-sm', maxW: 'max-w-md' },
};

export const EnterpriseEmptyState: React.FC<EnterpriseEmptyStateProps> = ({
  icon = <InboxIcon />,
  title,
  description,
  hints,
  primaryAction,
  secondaryAction,
  size = 'md',
  className = ''
}) => {
  const cfg = SIZE_CONFIG[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${cfg.wrapper} ${className}`}>
      {/* Icon */}
      <div className={`${cfg.iconWrap} bg-slate-100 dark:bg-zinc-800/70 rounded-2xl border border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 mb-4`}>
        <span className={`block ${cfg.icon}`}>{icon}</span>
      </div>

      {/* Title */}
      <h3 className={`font-extrabold text-slate-800 dark:text-zinc-100 ${cfg.title} ${cfg.maxW} mb-1`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`text-slate-500 dark:text-zinc-400 font-medium ${cfg.desc} ${cfg.maxW} leading-relaxed mb-3`}>
          {description}
        </p>
      )}

      {/* Hint List */}
      {hints && hints.length > 0 && (
        <ul className={`text-[11px] text-slate-400 dark:text-zinc-500 ${cfg.maxW} space-y-1 mb-4 text-start list-none`}>
          {hints.map((hint, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 shrink-0" />
              {hint}
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className={`${enterpriseTokens.buttons.primary} text-xs`}
            >
              {primaryAction.icon && <span className="shrink-0">{primaryAction.icon}</span>}
              <span>{primaryAction.label}</span>
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={`${enterpriseTokens.buttons.secondary} text-xs`}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EnterpriseEmptyState;
