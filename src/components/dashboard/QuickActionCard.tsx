import React from 'react';
import { LucideIcon } from 'lucide-react';
import { designTokens } from '../../lib/designTokens';

interface QuickActionCardProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function QuickActionCard({ label, icon: Icon, onClick }: QuickActionCardProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center text-center gap-2 p-3 bg-zinc-900/90 hover:bg-emerald-800/80 active:scale-95 rounded-xl transition-all duration-150 text-xs font-bold text-zinc-200 hover:text-white cursor-pointer border border-zinc-800 hover:border-emerald-500/50 shadow-sm`}
    >
      <div className="p-1.5 rounded-lg bg-zinc-800/80 group-hover:bg-emerald-700/50 text-emerald-400">
        <Icon className="w-4 h-4" />
      </div>
      <span className="leading-tight">{label}</span>
    </button>
  );
}
