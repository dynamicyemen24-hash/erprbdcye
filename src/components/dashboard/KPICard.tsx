import React from 'react';
import { LucideIcon, GripVertical, Pin, ChevronLeft, ChevronRight } from 'lucide-react';
import { designTokens } from '../../lib/designTokens';

interface KPICardProps {
  id: string;
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bg: string;
  sublabel?: string;
  
  // Drag and drop properties
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
  isDragOver?: boolean;

  // Pin & Manual Reordering
  pinned?: boolean;
  onPinToggle?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  lang?: 'ar' | 'en';
  onClick?: () => void;
}

export function KPICard({
  id,
  label,
  value,
  icon: Icon,
  color,
  bg,
  sublabel,
  draggable = true,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  isDragging = false,
  isDragOver = false,
  pinned = false,
  onPinToggle,
  onMoveLeft,
  onMoveRight,
  isFirst = false,
  isLast = false,
  lang = 'ar',
  onClick
}: KPICardProps) {
  const isRtl = lang === 'ar';

  return (
    <div
      id={`kpi-card-${id}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        relative group flex items-center gap-4 p-5 
        ${designTokens.borderRadius.lg} border transition-all duration-300 select-none
        ${isDragging ? 'opacity-40 scale-95 border-dashed border-emerald-500 bg-emerald-500/5' : ''}
        ${isDragOver ? 'border-dashed border-emerald-500 bg-emerald-500/10 scale-[1.02]' : ''}
        ${pinned 
          ? 'bg-amber-500/[0.02] dark:bg-amber-500/[0.01] border-amber-500/40 hover:border-amber-500/60 shadow-xs' 
          : `${designTokens.colors.bgCard} ${designTokens.colors.border} hover:border-emerald-500/40 hover:shadow-md`
        }
        ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-98 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50' : ''}
      `}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.cursor-grab') || target.closest('button')) {
          return;
        }
        if (onClick) {
          onClick();
        }
      }}
    >
      {/* Drag & Move Handles */}
      <div 
        className={`
          flex items-center text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400
          transition-colors shrink-0
          ${isRtl ? 'order-last' : 'order-first'}
        `}
      >
        <div 
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800"
          title={isRtl ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
        >
          <GripVertical className="w-4.5 h-4.5" />
        </div>
      </div>

      {/* KPI Icon */}
      <div className={`p-3 rounded-xl shrink-0 ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Metric details */}
      <div className="flex-1 min-w-0 pr-6 pl-2">
        <p className={`${designTokens.typography.cardTitle} flex items-center gap-1 truncate`}>
          {label}
          {pinned && (
            <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black px-1 rounded uppercase tracking-normal">
              <Pin className="w-2.5 h-2.5 rotate-45" />
              {isRtl ? 'مثبت' : 'Pinned'}
            </span>
          )}
        </p>
        <p className={`${designTokens.typography.numeric} text-2xl text-zinc-900 dark:text-white mt-0.5 tracking-tight`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {sublabel && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-bold line-clamp-1">
            {sublabel}
          </p>
        )}
      </div>

      {/* Dynamic Actions HUD Layer (Appears on Hover/Focus, always partially visible on mobile) */}
      <div 
        className={`
          absolute top-2.5 flex items-center gap-1 
          opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200
          ${isRtl ? 'left-2.5' : 'right-2.5'}
        `}
      >
        {/* Manual Reordering Navigation Buttons (Touch Accessibility) */}
        <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-md shadow-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onMoveLeft) onMoveLeft();
            }}
            disabled={isFirst}
            className={`p-1.5 transition-all text-slate-400 dark:text-zinc-500 ${
              isFirst 
                ? 'opacity-20 cursor-not-allowed' 
                : 'hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer'
            }`}
            title={isRtl ? 'نقل لليسار' : 'Move Left'}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onMoveRight) onMoveRight();
            }}
            disabled={isLast}
            className={`p-1.5 transition-all text-slate-400 dark:text-zinc-500 border-l border-slate-100 dark:border-zinc-800 ${
              isLast 
                ? 'opacity-20 cursor-not-allowed' 
                : 'hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer'
            }`}
            title={isRtl ? 'نقل لليمين' : 'Move Right'}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pinning Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onPinToggle) onPinToggle();
          }}
          className={`
            p-1.5 rounded-md border transition-all shadow-xs cursor-pointer
            ${pinned 
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25' 
              : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/5'
            }
          `}
          title={pinned ? (isRtl ? 'إلغاء التثبيت' : 'Unpin metric') : (isRtl ? 'تثبيت في البداية' : 'Pin metric')}
        >
          <Pin className={`w-3.5 h-3.5 transition-transform ${pinned ? 'rotate-45' : ''}`} />
        </button>
      </div>

    </div>
  );
}
