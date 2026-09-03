import React, { ReactNode } from 'react';

interface WorkspaceProps {
  header?: ReactNode;
  breadcrumb?: ReactNode;
  commandBar?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  detailsPanel?: ReactNode;
  statusBar?: ReactNode;
}

export function Workspace({
  header,
  breadcrumb,
  commandBar,
  filters,
  children,
  detailsPanel,
  statusBar
}: WorkspaceProps) {
  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-zinc-800 animate-fade-in relative min-h-[calc(100vh-150px)]">
      {/* Workspace Header & Breadcrumb */}
      {(header || breadcrumb) && (
        <div className="px-4 py-4 md:px-6 md:py-5 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 lg:sticky lg:top-0 z-10 lg:backdrop-blur-md">
          {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
          {header && <div>{header}</div>}
        </div>
      )}

      {/* Command Bar */}
      {commandBar && (
        <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between lg:sticky lg:top-[80px] z-10 lg:backdrop-blur-md overflow-x-auto">
          {commandBar}
        </div>
      )}

      {/* Filters */}
      {filters && (
        <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/80 shadow-sm z-10 lg:sticky lg:top-[120px]">
          {filters}
        </div>
      )}

      {/* Workspace Body and Details Panel */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        <div className="min-w-0 flex-1 p-4 md:p-6 relative">
          {children}
        </div>
        
        {/* Details Panel */}
        {detailsPanel && (
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l rtl:lg:border-l-0 rtl:lg:border-r border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 p-4 shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)] max-h-72 lg:max-h-none overflow-y-auto">
            {detailsPanel}
          </div>
        )}
      </div>

      {/* Status Bar */}
      {statusBar && (
        <div className="px-4 py-1.5 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 text-[10px] text-slate-500 dark:text-zinc-400 flex items-center justify-between sticky bottom-0 z-10 backdrop-blur-md">
          {statusBar}
        </div>
      )}
    </div>
  );
}
