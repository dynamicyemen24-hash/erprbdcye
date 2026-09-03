/**
 * UAMEX_ERP™ Premium TimelineView — Visual Temporal Workbench
 * Advanced timeline component for all NEB domains with:
 *  • Horizontal timeline (events, milestones)
 *  • Gantt-style bars (project schedules)
 *  • Swimlanes (group by entity)
 *  • Zoom levels (hour/day/week/month/quarter)
 *  • Today marker / dependency arrows
 *  • Interactive milestones with hover cards
 *  • Drag-to-reschedule events
 *  • Critical path highlighting
 *  • Progress indicators on bars
 *  • Click-to-edit events
 *  • Bilingual (AR/EN) with RTL support
 *  • Dark/Light theme aware
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Diamond,
  Flag,
  GitBranch,
  Layers,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export type TimelineEventType = 'milestone' | 'task' | 'phase' | 'release' | 'review' | 'approval';
export type TimelineEventStatus = 'planned' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
export type TimelineZoom = 'hour' | 'day' | 'week' | 'month' | 'quarter';

export interface TimelineEvent {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  startDate: string | Date;
  endDate?: string | Date;
  type: TimelineEventType;
  status: TimelineEventStatus;
  progress?: number;
  groupId?: string;
  dependencies?: string[];
  isCritical?: boolean;
  ownerAr?: string;
  ownerEn?: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TimelineGroup {
  id: string;
  labelAr: string;
  labelEn: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface PremiumTimelineViewProps {
  lang: 'ar' | 'en';
  events: TimelineEvent[];
  groups?: TimelineGroup[];
  defaultZoom?: TimelineZoom;
  showSwimlanes?: boolean;
  showToday?: boolean;
  showCriticalPath?: boolean;
  showProgress?: boolean;
  editable?: boolean;
  height?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  onEventClick?: (event: TimelineEvent) => void;
  onEventUpdate?: (event: TimelineEvent) => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

const t = (ar: string, en: string, lang: 'ar' | 'en') => (lang === 'ar' ? ar : en);

const STATUS_COLOR: Record<TimelineEventStatus, { bg: string; border: string; text: string; dot: string; bar: string }> = {
  planned: { bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/30', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', bar: 'bg-sky-500' },
  in_progress: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  completed: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  blocked: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', bar: 'bg-red-500' },
  cancelled: { bg: 'bg-slate-50 dark:bg-zinc-800', border: 'border-slate-200 dark:border-zinc-700', text: 'text-slate-500 dark:text-zinc-500', dot: 'bg-slate-400', bar: 'bg-slate-400' },
};

const TYPE_ICON: Record<TimelineEventType, React.ComponentType<{ className?: string }>> = {
  milestone: Diamond,
  task: Circle,
  phase: Layers,
  release: Sparkles,
  review: Flag,
  approval: Target,
};

function dateToDays(date: Date, start: Date): number {
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function daysToDate(days: number, start: Date): Date {
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

function getZoomConfig(zoom: TimelineZoom): { daysPerUnit: number; unitLabelAr: string; unitLabelEn: string; subUnitDays?: number } {
  switch (zoom) {
    case 'hour': return { daysPerUnit: 1, unitLabelAr: 'ساعة', unitLabelEn: 'Hour', subUnitDays: 0.0416 };
    case 'day': return { daysPerUnit: 1, unitLabelAr: 'يوم', unitLabelEn: 'Day' };
    case 'week': return { daysPerUnit: 7, unitLabelAr: 'أسبوع', unitLabelEn: 'Week' };
    case 'month': return { daysPerUnit: 30, unitLabelAr: 'شهر', unitLabelEn: 'Month' };
    case 'quarter': return { daysPerUnit: 90, unitLabelAr: 'ربع', unitLabelEn: 'Quarter' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export function PremiumTimelineView({
  lang,
  events,
  groups = [],
  defaultZoom = 'week',
  showSwimlanes = false,
  showToday = true,
  showCriticalPath = false,
  showProgress = true,
  editable = false,
  height = 500,
  startDate,
  endDate,
  onEventClick,
  onEventUpdate,
  className = '',
}: PremiumTimelineViewProps) {
  const [zoom, setZoom] = useState<TimelineZoom>(defaultZoom);
  const [scrollX, setScrollX] = useState(0);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragEvent, setDragEvent] = useState<{ id: string; startX: number; originalStart: Date } | null>(null);

  const zoomConfig = useMemo(() => getZoomConfig(zoom), [zoom]);

  // Determine range
  const { start, end } = useMemo(() => {
    if (startDate && endDate) return { start: new Date(startDate), end: new Date(endDate) };
    if (events.length === 0) {
      const now = new Date();
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) };
    }
    const dates = events.flatMap((e) => [new Date(e.startDate), e.endDate ? new Date(e.endDate) : new Date(e.startDate)]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    return { start: new Date(min.getTime() - 7 * 24 * 60 * 60 * 1000), end: new Date(max.getTime() + 7 * 24 * 60 * 60 * 1000) };
  }, [events, startDate, endDate]);

  const totalDays = dateToDays(end, start);
  const totalUnits = Math.ceil(totalDays / zoomConfig.daysPerUnit);
  const todayDays = dateToDays(new Date(), start);

  // Generate timeline units
  const timelineUnits = useMemo(() => {
    const units = [];
    for (let i = 0; i < totalUnits; i++) {
      const date = daysToDate(i * zoomConfig.daysPerUnit, start);
      units.push({
        index: i,
        date,
        label: date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
          month: zoom === 'hour' || zoom === 'day' ? 'short' : 'short',
          day: zoom === 'quarter' || zoom === 'month' ? undefined : 'numeric',
          year: zoom === 'quarter' || zoom === 'month' ? 'numeric' : undefined,
        }),
        subLabel: zoom === 'week' ? `W${Math.ceil(date.getDate() / 7)}` : undefined,
      });
    }
    return units;
  }, [totalUnits, start, zoom, zoomConfig.daysPerUnit, lang]);

  // Group events
  const groupedEvents = useMemo(() => {
    if (!showSwimlanes || groups.length === 0) {
      return [{ id: 'all', labelAr: t('الكل', 'All', lang), labelEn: 'All', events, color: '#059669' }];
    }
    return groups.map((g) => ({
      ...g,
      events: events.filter((e) => e.groupId === g.id),
    }));
  }, [events, groups, showSwimlanes, lang]);

  const pxPerDay = 20;
  const laneHeight = 56;
  const headerHeight = 50;

  const handleScroll = (deltaX: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollLeft += deltaX;
    setScrollX(containerRef.current.scrollLeft);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const order: TimelineZoom[] = ['hour', 'day', 'week', 'month', 'quarter'];
    const currentIdx = order.indexOf(zoom);
    if (direction === 'in' && currentIdx > 0) setZoom(order[currentIdx - 1]);
    else if (direction === 'out' && currentIdx < order.length - 1) setZoom(order[currentIdx + 1]);
  };

  // Drag handling
  const handleDragStart = useCallback((event: TimelineEvent, e: React.MouseEvent) => {
    if (!editable) return;
    e.preventDefault();
    setDragEvent({ id: event.id, startX: e.clientX, originalStart: new Date(event.startDate) });
  }, [editable]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragEvent) return;
    const deltaX = e.clientX - dragEvent.startX;
    const deltaDays = Math.round(deltaX / pxPerDay);
    const newStart = new Date(dragEvent.originalStart.getTime() + deltaDays * 24 * 60 * 60 * 1000);
    const event = events.find((ev) => ev.id === dragEvent.id);
    if (event && onEventUpdate) {
      onEventUpdate({ ...event, startDate: newStart, endDate: event.endDate ? new Date(newStart.getTime() + (new Date(event.endDate).getTime() - new Date(event.startDate).getTime())) : undefined });
    }
  }, [dragEvent, events, onEventUpdate]);

  const handleDragEnd = useCallback(() => setDragEvent(null), []);

  useEffect(() => {
    if (dragEvent) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dragEvent, handleDragMove, handleDragEnd]);

  // Click on timeline to navigate
  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event.id);
    onEventClick?.(event);
  };

  const totalHeight = headerHeight + (showSwimlanes ? groupedEvents.length : 1) * laneHeight + 16;
  const totalWidth = totalDays * pxPerDay;

  // Stats
  const stats = useMemo(() => {
    const total = events.length;
    const completed = events.filter((e) => e.status === 'completed').length;
    const inProgress = events.filter((e) => e.status === 'in_progress').length;
    const blocked = events.filter((e) => e.status === 'blocked').length;
    const milestones = events.filter((e) => e.type === 'milestone').length;
    const critical = events.filter((e) => e.isCritical).length;
    return { total, completed, inProgress, blocked, milestones, critical };
  }, [events]);

  return (
    <div className={`w-full bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-lg shadow-emerald-500/5 overflow-hidden ${className}`}>
      {/* ════════════════ TOOLBAR ════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-emerald-50/30 dark:from-zinc-900 dark:to-emerald-950/20 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-zinc-100">
              {t('الجدول الزمني المتقدم', 'Premium Timeline', lang)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-500">
              {stats.total} {t('حدث', 'events', lang)} • {stats.completed} {t('مكتمل', 'completed', lang)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Stats pills */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
            <TrendingUp className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              {stats.inProgress} {t('جاري', 'active', lang)}
            </span>
          </div>
          {stats.blocked > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
              <TrendingDown className="w-3 h-3 text-red-700 dark:text-red-400" />
              <span className="text-[10px] font-bold text-red-700 dark:text-red-300">
                {stats.blocked} {t('محجوب', 'blocked', lang)}
              </span>
            </div>
          )}
          {stats.milestones > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
              <Diamond className="w-3 h-3 text-amber-700 dark:text-amber-400" />
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {stats.milestones} {t('معلما', 'milestones', lang)}
              </span>
            </div>
          )}
          {stats.critical > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
              <GitBranch className="w-3 h-3 text-rose-700 dark:text-rose-400" />
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                {stats.critical} {t('حرج', 'critical', lang)}
              </span>
            </div>
          )}

          <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

          {/* Zoom controls */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
            <button onClick={() => handleZoom('out')} className="p-1.5 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800" aria-label={t('تصغير', 'Zoom out', lang)}>
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-zinc-300 border-x border-slate-200 dark:border-zinc-700">
              {t(zoomConfig.unitLabelAr, zoomConfig.unitLabelEn, lang)}
            </span>
            <button onClick={() => handleZoom('in')} className="p-1.5 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800" aria-label={t('تكبير', 'Zoom in', lang)}>
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scroll controls */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
            <button onClick={() => handleScroll(-200)} className="p-1.5 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800" aria-label={t('يسار', 'Left', lang)}>
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
            <button onClick={() => handleScroll(200)} className="p-1.5 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800" aria-label={t('يمين', 'Right', lang)}>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          <button onClick={() => { if (containerRef.current) { containerRef.current.scrollLeft = 0; setScrollX(0); } }} className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800" aria-label={t('إعادة تعيين', 'Reset', lang)}>
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ════════════════ TIMELINE BODY ════════════════ */}
      <div className="relative" style={{ height: totalHeight }}>
        <div ref={containerRef} className="relative w-full h-full overflow-x-auto overflow-y-hidden" onScroll={(e) => setScrollX(e.currentTarget.scrollLeft)}>
          <div style={{ width: Math.max(totalWidth, 800), minWidth: '100%', height: '100%', position: 'relative' }}>
            {/* Header (units) */}
            <div className="sticky top-0 z-20 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800" style={{ height: headerHeight }}>
              <div className="flex h-full">
                {timelineUnits.map((unit, i) => {
                  const isToday = zoom === 'day' && unit.date.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className={`flex-shrink-0 flex flex-col items-center justify-center border-e border-slate-200 dark:border-zinc-800 text-[10px] font-bold ${isToday ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-zinc-500'}`} style={{ width: zoomConfig.daysPerUnit * pxPerDay }}>
                      <div className="uppercase tracking-wider">{unit.label}</div>
                      {unit.subLabel && <div className="text-[9px] opacity-70">{unit.subLabel}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swimlanes / Event Lanes */}
            <div className="relative" style={{ height: totalHeight - headerHeight }}>
              {/* Background grid */}
              <div className="absolute inset-0 flex pointer-events-none">
                {timelineUnits.map((_, i) => (
                  <div key={i} className="flex-shrink-0 border-e border-slate-100 dark:border-zinc-800/50" style={{ width: zoomConfig.daysPerUnit * pxPerDay }} />
                ))}
              </div>

              {/* Today line */}
              {showToday && todayDays >= 0 && todayDays <= totalDays && (
                <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: todayDays * pxPerDay }}>
                  <div className="w-px h-full bg-gradient-to-b from-red-500 via-red-500 to-red-500/30" />
                  <div className="absolute -top-1 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-black uppercase tracking-wider shadow-md">
                    {t('اليوم', 'Today', lang)}
                  </div>
                </div>
              )}

              {/* Swimlanes */}
              {groupedEvents.map((group, groupIdx) => (
                <div key={group.id} className="absolute inset-x-0 flex" style={{ top: groupIdx * laneHeight, height: laneHeight }}>
                  {group.events.map((event) => {
                    const startDays = dateToDays(new Date(event.startDate), start);
                    const endDays = event.endDate ? dateToDays(new Date(event.endDate), start) : startDays;
                    const isMilestone = event.type === 'milestone' || !event.endDate;
                    const left = startDays * pxPerDay;
                    const width = isMilestone ? 16 : Math.max(20, (endDays - startDays) * pxPerDay);
                    const statusColor = STATUS_COLOR[event.status];
                    const isHovered = hoveredEvent === event.id;
                    const isSelected = selectedEvent === event.id;
                    const isCritical = showCriticalPath && event.isCritical;

                    return (
                      <div
                        key={event.id}
                        className={`absolute group/event cursor-pointer transition-all duration-200 ${isHovered ? 'z-30' : 'z-10'}`}
                        style={{ left, top: laneHeight / 2 - (isMilestone ? 8 : 12), width, height: isMilestone ? 16 : 24 }}
                        onMouseEnter={() => setHoveredEvent(event.id)}
                        onMouseLeave={() => setHoveredEvent(null)}
                        onClick={() => handleEventClick(event)}
                        onMouseDown={(e) => handleDragStart(event, e)}
                      >
                        {isMilestone ? (
                          <div className={`relative w-4 h-4 rotate-45 ${event.color || statusColor.bar} shadow-lg ring-2 ring-white dark:ring-zinc-900 ${isCritical ? 'ring-rose-500 animate-pulse-slow' : ''}`}>
                            <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                              {React.createElement(TYPE_ICON[event.type], { className: 'w-2 h-2 text-white' })}
                            </div>
                          </div>
                        ) : (
                          <div className={`relative w-full h-full rounded-md shadow-md overflow-hidden ring-1 ${isCritical ? 'ring-rose-500 ring-2' : 'ring-black/5 dark:ring-white/10'} ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}
                               style={{ backgroundColor: event.color || undefined }}>
                            {!event.color && <div className={`absolute inset-0 ${statusColor.bar}`} />}
                            {showProgress && event.progress != null && event.progress > 0 && (
                              <div className="absolute inset-y-0 start-0 bg-black/30 transition-all" style={{ width: `${event.progress}%` }} />
                            )}
                            <div className="absolute inset-0 flex items-center px-1.5 text-[9px] font-black text-white truncate">
                              {width > 60 && (lang === 'ar' ? event.titleAr : event.titleEn)}
                            </div>
                          </div>
                        )}

                        {/* Hover card */}
                        {isHovered && (
                          <div className={`absolute z-40 ${lang === 'ar' ? 'end-full me-2' : 'start-full ms-2'} top-1/2 -translate-y-1/2 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xl shadow-emerald-500/10 p-3 animate-fade-in pointer-events-none`}>
                            <div className="flex items-start gap-2 mb-1.5">
                              <div className={`w-6 h-6 rounded-md ${statusColor.bg} flex items-center justify-center shrink-0`}>
                                {React.createElement(TYPE_ICON[event.type], { className: `w-3 h-3 ${statusColor.text}` })}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">
                                  {lang === 'ar' ? event.titleAr : event.titleEn}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                                  {t(event.status, event.status.replace('_', ' '), lang)}
                                </div>
                              </div>
                            </div>
                            {(event.descriptionAr || event.descriptionEn) && (
                              <div className="text-[10px] text-slate-600 dark:text-zinc-400 mb-2 line-clamp-2">
                                {lang === 'ar' ? event.descriptionAr : event.descriptionEn}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                              <div className="p-1.5 rounded bg-slate-50 dark:bg-zinc-800">
                                <div className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold">{t('البدء', 'Start', lang)}</div>
                                <div className="font-bold text-slate-700 dark:text-zinc-300">{new Date(event.startDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</div>
                              </div>
                              {event.endDate && (
                                <div className="p-1.5 rounded bg-slate-50 dark:bg-zinc-800">
                                  <div className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold">{t('الانتهاء', 'End', lang)}</div>
                                  <div className="font-bold text-slate-700 dark:text-zinc-300">{new Date(event.endDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</div>
                                </div>
                              )}
                            </div>
                            {event.progress != null && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="font-bold text-slate-500 dark:text-zinc-500">{t('التقدم', 'Progress', lang)}</span>
                                  <span className="font-black text-slate-700 dark:text-zinc-300 tabular-nums">{event.progress}%</span>
                                </div>
                                <div className="h-1 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                  <div className={`h-full ${statusColor.bar} transition-all`} style={{ width: `${event.progress}%` }} />
                                </div>
                              </div>
                            )}
                            {(event.ownerAr || event.ownerEn) && (
                              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-[10px]">
                                <span className="text-slate-500 dark:text-zinc-500">{t('المسؤول:', 'Owner:', lang)} </span>
                                <span className="font-bold text-slate-700 dark:text-zinc-300">{lang === 'ar' ? event.ownerAr : event.ownerEn}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════ LEGEND ════════════════ */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-200 dark:border-zinc-800">
        {Object.entries(STATUS_COLOR).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${colors.bar}`} />
            <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              {status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Demo / Showcase
// ═══════════════════════════════════════════════════════════════════════════════

export function PremiumTimelineViewDemo({ lang }: { lang: 'ar' | 'en' }) {
  const sampleGroups: TimelineGroup[] = useMemo(() => [
    { id: 'g1', labelAr: 'مشاريع البنية التحتية', labelEn: 'Infrastructure Projects', color: '#059669' },
    { id: 'g2', labelAr: 'البرامج التعليمية', labelEn: 'Education Programs', color: '#d97706' },
    { id: 'g3', labelAr: 'المبادرات الصحية', labelEn: 'Health Initiatives', color: '#dc2626' },
  ], []);

  const sampleEvents: TimelineEvent[] = useMemo(() => {
    const today = new Date();
    return [
      { id: 'e1', titleAr: 'تأهيل شبكة الطرق', titleEn: 'Road Network Rehab', startDate: new Date(today.getTime() - 30 * 86400000), endDate: new Date(today.getTime() + 60 * 86400000), type: 'phase', status: 'in_progress', progress: 45, groupId: 'g1', isCritical: true, ownerAr: 'م. أحمد', ownerEn: 'Eng. Ahmed' },
      { id: 'e2', titleAr: 'تسليم المرحلة الأولى', titleEn: 'Phase 1 Delivery', startDate: new Date(today.getTime() + 30 * 86400000), type: 'milestone', status: 'planned', groupId: 'g1', isCritical: true },
      { id: 'e3', titleAr: 'بناء المدارس', titleEn: 'School Construction', startDate: new Date(today.getTime() - 10 * 86400000), endDate: new Date(today.getTime() + 90 * 86400000), type: 'task', status: 'in_progress', progress: 60, groupId: 'g2' },
      { id: 'e4', titleAr: 'مراجعة المناهج', titleEn: 'Curriculum Review', startDate: new Date(today.getTime() + 15 * 86400000), type: 'review', status: 'planned', groupId: 'g2' },
      { id: 'e5', titleAr: 'إطلاق برنامج الصحة المدرسية', titleEn: 'School Health Launch', startDate: new Date(today.getTime() + 45 * 86400000), type: 'release', status: 'planned', groupId: 'g3', isCritical: true },
      { id: 'e6', titleAr: 'حملة التطعيم الشاملة', titleEn: 'Comprehensive Vaccination', startDate: new Date(today.getTime() - 20 * 86400000), endDate: new Date(today.getTime() + 10 * 86400000), type: 'phase', status: 'in_progress', progress: 75, groupId: 'g3' },
      { id: 'e7', titleAr: 'موافقة وزارة الصحة', titleEn: 'MOH Approval', startDate: new Date(today.getTime() + 5 * 86400000), type: 'approval', status: 'planned', groupId: 'g3' },
      { id: 'e8', titleAr: 'تدريب الكوادر الطبية', titleEn: 'Medical Staff Training', startDate: new Date(today.getTime() - 60 * 86400000), endDate: new Date(today.getTime() - 5 * 86400000), type: 'task', status: 'completed', progress: 100, groupId: 'g3' },
    ];
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-zinc-950 dark:to-emerald-950/10 min-h-screen">
      <h2 className="text-base font-black text-slate-900 dark:text-zinc-100 mb-4">
        {t('الخط الزمني المتقدم', 'Premium TimelineView', lang)}
      </h2>
      <PremiumTimelineView
        lang={lang}
        events={sampleEvents}
        groups={sampleGroups}
        defaultZoom="week"
        showSwimlanes
        showToday
        showCriticalPath
        showProgress
        height={500}
        onEventClick={(e) => console.log('Click:', e)}
      />
    </div>
  );
}

export default PremiumTimelineView;