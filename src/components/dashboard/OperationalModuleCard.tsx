import React from 'react';
import { LucideIcon } from 'lucide-react';
import { designTokens } from '../../lib/designTokens';

interface OperationalModuleCardProps {
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  onClick: () => void;
}

export function OperationalModuleCard({ label, icon: Icon, badge, onClick }: OperationalModuleCardProps) {
  return (
    <button 
      onClick={onClick}
      className={`relative ${designTokens.colors.bgCard} p-4 ${designTokens.borderRadius.md} border ${designTokens.colors.border} flex flex-col items-center gap-2.5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all duration-300 group cursor-pointer active:scale-98`}
    >
      {badge !== undefined && badge !== null && (
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
          {badge}
        </span>
      )}
      <div className={`p-2.5 ${designTokens.borderRadius.sm} bg-slate-100 dark:bg-zinc-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors`}>
        <Icon className="w-5 h-5 text-slate-600 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
      </div>
      <span className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-center group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-tight">
        {label}
      </span>
    </button>
  );
}
