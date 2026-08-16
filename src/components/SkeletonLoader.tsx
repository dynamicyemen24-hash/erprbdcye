import React from 'react';

interface SkeletonLoaderProps {
  lang?: 'ar' | 'en';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ lang = 'ar' }) => {
  return (
    <div className="space-y-6 animate-pulse" id="skeleton-loader-container">
      {/* Top Banner & Action Row Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
            <div className="h-4 w-20 bg-amber-200/50 dark:bg-amber-900/40 rounded-md"></div>
          </div>
          <div className="h-3.5 w-72 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
          <div className="h-9 w-32 bg-amber-500/20 dark:bg-amber-500/10 rounded-xl"></div>
        </div>
      </div>

      {/* KPI Key Metric Cards Skeleton Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="w-8 h-8 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl"></div>
            </div>
            <div className="h-7 w-28 bg-zinc-300 dark:bg-zinc-700 rounded-lg"></div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-12 bg-emerald-500/20 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Grid: Main Content Panel & Side Widget Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel (2 cols on LG) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>

          {/* Table / List Rows Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-700 rounded-xl shrink-0"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-3/4 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
                    <div className="h-2.5 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-20 bg-amber-500/20 dark:bg-amber-500/10 rounded font-mono"></div>
                <div className="h-6 w-16 bg-emerald-500/20 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel (1 col on LG) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
              <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
            </div>

            {/* Circular or Bar Progress Skeletons */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 text-center">
              <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto flex items-center justify-center">
                <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-full"></div>
              </div>
              <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto"></div>
            </div>

            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    <div className="h-3 w-8 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                  </div>
                  <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500/40 rounded-full" style={{ width: `${item * 25}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-9 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-4"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
