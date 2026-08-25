import React from 'react';

interface SuspenseFallbackProps {
  label?: string;
  height?: string;
}

const SuspenseFallbackInner: React.FC<SuspenseFallbackProps> = ({ label, height = 'min-h-[200px]' }) => (
  <div className={`flex items-center justify-center ${height}`}>
    <div className="animate-pulse space-y-4 w-full max-w-md px-4">
      <div className="h-4 bg-emerald-200/50 dark:bg-emerald-800/30 rounded w-3/4" />
      <div className="h-4 bg-emerald-200/30 dark:bg-emerald-800/20 rounded w-1/2" />
      <div className="h-4 bg-emerald-200/20 dark:bg-emerald-800/10 rounded w-2/3" />
      {label && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2">{label}</p>
      )}
    </div>
  </div>
);

export const SuspenseFallback = React.memo(SuspenseFallbackInner);
export default SuspenseFallback;
