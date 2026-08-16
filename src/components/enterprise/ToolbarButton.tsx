import React from 'react';
import { LucideIcon } from 'lucide-react';
import { designTokens } from '../../lib/designTokens';
import { Tooltip } from '../Tooltip';

interface ToolbarButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  label?: string;
}

export function ToolbarButton({ icon: Icon, onClick, label }: ToolbarButtonProps) {
  const buttonNode = (
    <button 
      onClick={onClick}
      className={`p-2 ${designTokens.borderRadius.sm} bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-colors cursor-pointer`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  if (label) {
    return (
      <Tooltip content={label} position="bottom">
        {buttonNode}
      </Tooltip>
    );
  }

  return buttonNode;
}
