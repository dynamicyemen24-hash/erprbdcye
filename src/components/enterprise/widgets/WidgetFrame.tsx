import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  AlertCircle, 
  Maximize2, 
  Minimize2, 
  ChevronUp, 
  ChevronDown, 
  MoreVertical, 
  ShieldAlert,
  Move
} from 'lucide-react';

interface WidgetFrameProps {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: React.ElementType;
  children: (dimensions: { width: number, height: number }) => ReactNode;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyMessage?: string;
  hasPermission?: boolean;
  headerActions?: ReactNode;
  className?: string;
  defaultHeight?: number;
}

export function WidgetFrame({
  id,
  title,
  subtitle,
  icon: Icon,
  children,
  onRefresh,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available.',
  hasPermission = true,
  headerActions,
  className = '',
  defaultHeight = 300
}: WidgetFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Layout states for complete user control
  const [isMaximized, setIsMaximized] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [widgetHeight, setWidgetHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);

  // Intersection Observer for Lazy Loading / Deferred Rendering
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect(); 
      }
    }, { rootMargin: '100px' });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Resize Observer for Automatic Resizing
  useEffect(() => {
    if (!containerRef.current || !isVisible) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isVisible, isMaximized, isCollapsed]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (e) {
      console.error("Widget refresh failed:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Drag-to-resize handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isMaximized || isCollapsed) return;
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = widgetHeight;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(160, Math.min(1200, startHeight + deltaY));
      setWidgetHeight(newHeight);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Inner Widget render
  const renderWidgetBody = (currentHeight: number) => {
    return (
      <div 
        ref={containerRef} 
        className="flex-1 relative min-h-0 overflow-hidden"
        style={{ height: isMaximized ? '100%' : currentHeight }}
      >
        {!hasPermission ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 dark:bg-zinc-900/50 backdrop-blur-[1px] z-10">
            <ShieldAlert className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Access Denied</p>
            <p className="text-[10px] text-slate-500 mt-1">You do not have permission to view this data.</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Widget Error</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-xs">{error.message}</p>
            {onRefresh && (
              <button onClick={handleRefresh} className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                Try Again
              </button>
            )}
          </div>
        ) : loading && !isRefreshing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Data...</p>
          </div>
        ) : empty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-3">
              <span className="text-slate-400">📊</span>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">{emptyMessage}</p>
          </div>
        ) : (
          <div className={`absolute inset-0 p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {isVisible && (dimensions.width > 0 || isMaximized) ? (
              // Fallback to absolute sizing if observer hasn't updated layout dimensions yet
              children({ 
                width: dimensions.width || 600, 
                height: isMaximized ? (window.innerHeight - 150) : (dimensions.height || currentHeight) 
              })
            ) : null}
          </div>
        )}
      </div>
    );
  };

  const widgetFrameContent = (
    <div 
      className={`bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${
        isMaximized ? 'w-full h-full' : className
      }`}
      style={isMaximized || isCollapsed ? {} : { height: widgetHeight + 52 }}
    >
      {/* Widget Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/30 dark:bg-zinc-900/40 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 rounded-lg shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 truncate flex items-center gap-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {headerActions}
          {onRefresh && (
            <button 
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50"
              title="Refresh Widget"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* User layout control: Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* User layout control: Maximize toggle */}
          <button
            onClick={() => {
              setIsMaximized(!isMaximized);
              if (isCollapsed) setIsCollapsed(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            title={isMaximized ? "Restore Size" : "Maximize view"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Widget Body Container */}
      {!isCollapsed && renderWidgetBody(widgetHeight)}

      {/* Drag resize handle at the bottom edge */}
      {!isCollapsed && !isMaximized && (
        <div 
          onPointerDown={handlePointerDown}
          className={`h-2.5 w-full bg-slate-50 hover:bg-emerald-500/20 dark:bg-zinc-950/20 dark:hover:bg-emerald-500/10 cursor-ns-resize flex items-center justify-center transition-colors border-t border-slate-100 dark:border-zinc-800/60 ${
            isResizing ? 'bg-emerald-500/40 dark:bg-emerald-500/25' : ''
          }`}
          title="Drag up or down to resize"
        >
          <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-zinc-700 group-hover:bg-emerald-500/50"></div>
        </div>
      )}
    </div>
  );

  // Return maximized in absolute viewport modal or standard inline
  if (isMaximized) {
    return (
      <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
        <div className="w-full h-full max-w-7xl max-h-[92vh] flex flex-col relative">
          {widgetFrameContent}
        </div>
      </div>
    );
  }

  return widgetFrameContent;
}
