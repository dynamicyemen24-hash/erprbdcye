import React from 'react';
import { Building2, Sparkles } from 'lucide-react';

export default function ViewSkeleton() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex justify-between items-center overflow-hidden relative">
        <div className="space-y-3">
          <div className="h-6 w-48 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-shimmer"></div>
          <div className="h-4 w-72 bg-slate-100 dark:bg-zinc-800/60 rounded-md animate-shimmer"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200 dark:bg-zinc-800 rounded-xl animate-shimmer"></div>
          <div className="h-10 w-32 bg-emerald-500/20 rounded-xl border border-emerald-500/30 animate-shimmer"></div>
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 dark:bg-zinc-800 rounded animate-shimmer"></div>
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 animate-shimmer"></div>
            </div>
            <div className="h-8 w-32 bg-slate-300 dark:bg-zinc-700 rounded-lg animate-shimmer"></div>
            <div className="h-3 w-40 bg-slate-100 dark:bg-zinc-800/80 rounded animate-shimmer"></div>
          </div>
        ))}
      </div>

      {/* Content Skeleton Box */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 min-h-[320px] shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-zinc-800 rounded animate-shimmer"></div>
          <div className="h-8 w-24 bg-slate-100 dark:bg-zinc-800 rounded-lg animate-shimmer"></div>
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100/60 dark:bg-zinc-950/60 rounded-xl border border-slate-100 dark:border-zinc-800/60 w-full animate-shimmer"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
