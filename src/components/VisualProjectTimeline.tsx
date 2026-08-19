import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Move, 
  Sparkles, 
  Layers, 
  Briefcase, 
  Sliders, 
  RotateCcw,
  Info,
  Edit2,
  Trash2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Flame,
  Users,
  Activity,
  UserCheck
} from 'lucide-react';
import { Project, Program, ProjectMilestone } from '../types';
import { triggerHaptic } from '../helpers/hapticSwipe';

interface VisualProjectTimelineProps {
  projects: Project[];
  programs?: Program[];
  lang: 'ar' | 'en';
  onRefreshProjects?: () => void;
}

export const VisualProjectTimeline: React.FC<VisualProjectTimelineProps> = ({
  projects,
  programs = [],
  lang,
  onRefreshProjects
}) => {
  const isRtl = lang === 'ar';

  // Local storage persistence key for custom milestones
  const STORAGE_KEY = 'nexora_project_milestones_v1';

  // Load or generate initial milestones for projects
  const [milestones, setMilestones] = useState<ProjectMilestone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading milestones:', e);
    }
    return generateDefaultMilestones(projects);
  });

  // Sync default milestones if new projects arrive that have no milestones
  useEffect(() => {
    setMilestones(prev => {
      const existingProjectIds = new Set(prev.map(m => m.projectId));
      const missingProjects = projects.filter(p => !existingProjectIds.has(p.id));
      if (missingProjects.length === 0) return prev;

      const newGenerated = generateDefaultMilestones(missingProjects);
      const updated = [...prev, ...newGenerated];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) { console.error('[Timeline] Failed to save milestones to localStorage:', e); }
      return updated;
    });
  }, [projects]);

  // Save milestones when updated
  const saveMilestones = (updated: ProjectMilestone[]) => {
    setMilestones(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) { console.error('[Timeline] Failed to save milestones to localStorage:', e); }
  };

  // Helper to generate default 4 milestones per project based on start_date / end_date
  function generateDefaultMilestones(projs: Project[]): ProjectMilestone[] {
    const list: ProjectMilestone[] = [];
    projs.forEach(p => {
      const start = p.start_date ? new Date(p.start_date) : new Date('2026-01-01');
      const end = p.end_date ? new Date(p.end_date) : new Date('2026-12-31');
      const startMs = start.getTime();
      const durationMs = Math.max(86400000 * 30, end.getTime() - startMs);

      const m1Date = new Date(startMs + durationMs * 0.15).toISOString().substring(0, 10);
      const m2Date = new Date(startMs + durationMs * 0.40).toISOString().substring(0, 10);
      const m3Date = new Date(startMs + durationMs * 0.70).toISOString().substring(0, 10);
      const m4Date = new Date(startMs + durationMs * 0.95).toISOString().substring(0, 10);

      list.push(
        {
          id: `m-${p.id}-1`,
          projectId: p.id,
          titleAr: 'تأسيس الموقع والمسح الميداني',
          titleEn: 'Site Setup & Baseline Survey',
          date: m1Date,
          status: 'completed'
        },
        {
          id: `m-${p.id}-2`,
          projectId: p.id,
          titleAr: 'التوريد والمشتريات التشغيلية',
          titleEn: 'Procurement & Logistics',
          date: m2Date,
          status: 'in_progress'
        },
        {
          id: `m-${p.id}-3`,
          projectId: p.id,
          titleAr: 'التوزيع والتدشين الميداني',
          titleEn: 'Field Distribution & Launch',
          date: m3Date,
          status: 'upcoming'
        },
        {
          id: `m-${p.id}-4`,
          projectId: p.id,
          titleAr: 'التقييم النهائي وتسليم التقارير',
          titleEn: 'Final Audit & Handover',
          date: m4Date,
          status: 'upcoming'
        }
      );
    });
    return list;
  }

  // Timeline Time Axis Calculations & Dynamic Zoom Columns
  const [zoomLevel, setZoomLevel] = useState<'months' | 'quarters' | 'annual'>('months');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchProgram = selectedProgramFilter === 'all' || p.program_id === selectedProgramFilter;
      const matchStatus = selectedStatusFilter === 'all' || p.status_code === selectedStatusFilter;
      return matchProgram && matchStatus;
    });
  }, [projects, selectedProgramFilter, selectedStatusFilter]);

  // Compute Timeline Start & End Dates and Columns based on Zoom Level
  const { timelineStart, timelineEnd, timeColumns } = useMemo(() => {
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (zoomLevel === 'annual') {
      const start = new Date('2025-01-01').getTime();
      const end = new Date('2027-12-31').getTime();
      const cols = [
        { labelAr: 'عام 2025', labelEn: 'Year 2025', key: '2025' },
        { labelAr: 'عام 2026 (النشط)', labelEn: 'Year 2026 (Active)', key: '2026' },
        { labelAr: 'عام 2027', labelEn: 'Year 2027', key: '2027' }
      ];
      return { timelineStart: start, timelineEnd: end, timeColumns: cols };
    }

    if (zoomLevel === 'quarters') {
      const start = new Date('2026-01-01').getTime();
      const end = new Date('2026-12-31').getTime();
      const cols = [
        { labelAr: 'Q1 2026 (يناير - مارس)', labelEn: 'Q1 2026 (Jan - Mar)', key: 'q1' },
        { labelAr: 'Q2 2026 (أبريل - يونيو)', labelEn: 'Q2 2026 (Apr - Jun)', key: 'q2' },
        { labelAr: 'Q3 2026 (يوليو - سبتمبر)', labelEn: 'Q3 2026 (Jul - Sep)', key: 'q3' },
        { labelAr: 'Q4 2026 (أكتوبر - ديسمبر)', labelEn: 'Q4 2026 (Oct - Dec)', key: 'q4' }
      ];
      return { timelineStart: start, timelineEnd: end, timeColumns: cols };
    }

    // Default: 'months'
    const start = new Date('2026-01-01');
    const end = new Date('2026-12-31');
    const cols: { labelAr: string; labelEn: string; key: string }[] = [];

    const curr = new Date(start);
    while (curr <= end) {
      const y = curr.getFullYear();
      const m = curr.getMonth();
      cols.push({
        labelAr: `${monthNamesAr[m]} ${y}`,
        labelEn: `${monthNamesEn[m]} ${y}`,
        key: `${y}-${m}`
      });
      curr.setMonth(curr.getMonth() + 1);
    }

    return {
      timelineStart: start.getTime(),
      timelineEnd: end.getTime(),
      timeColumns: cols
    };
  }, [zoomLevel]);

  const totalTimeSpanMs = timelineEnd - timelineStart;

  // Convert Date to Percentage Position on Timeline (0% to 100%)
  const getPercentFromDate = (dateStr: string | null | undefined): number => {
    if (!dateStr) return 0;
    const timeMs = new Date(dateStr).getTime();
    if (isNaN(timeMs)) return 0;
    const clamped = Math.max(timelineStart, Math.min(timelineEnd, timeMs));
    return ((clamped - timelineStart) / totalTimeSpanMs) * 100;
  };

  // Convert Percentage Position to Date string YYYY-MM-DD
  const getDateFromPercent = (pct: number): string => {
    const clampedPct = Math.max(0, Math.min(100, pct));
    const timeMs = timelineStart + (clampedPct / 100) * totalTimeSpanMs;
    return new Date(timeMs).toISOString().substring(0, 10);
  };

  // Dragging State & Tooltip
  const [draggingMilestoneId, setDraggingMilestoneId] = useState<string | null>(null);
  const [dragPreviewDate, setDragPreviewDate] = useState<string | null>(null);
  const [dragProjectResizing, setDragProjectResizing] = useState<{ projectId: string; edge: 'start' | 'end' } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Native HTML5 Drag and Drop State for Milestones
  const [nativeDragInfo, setNativeDragInfo] = useState<{
    milestoneId: string;
    projectId: string;
    titleAr: string;
    titleEn: string;
    originalDate: string;
    newTargetDate: string;
    offsetDays: number;
    projectedEndDate: string;
    hoveredProjectId: string | null;
    mouseXPct: number;
  } | null>(null);

  // Availability Heatmap Layer State & Storage Persistence
  const HEATMAP_STORAGE_KEY = 'nexora_project_resource_heatmap_v1';
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  // Map of `${projectId}_${timeColumnKey}` => allocation percentage (0, 25, 50, 75, 100)
  const [resourceAllocations, setResourceAllocations] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(HEATMAP_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error('Error loading heatmap state:', e);
    }
    return generateDefaultAllocations(projects, timeColumns);
  });

  function generateDefaultAllocations(projs: Project[], cols: Array<{ key: string }>): Record<string, number> {
    const map: Record<string, number> = {};
    projs.forEach((p, pIdx) => {
      cols.forEach((col, cIdx) => {
        // Generate initial realistic FTE resource allocations
        if (p.status_code === 'active' || p.status_code === 'in_progress') {
          map[`${p.id}_${col.key}`] = (cIdx % 3 === 0) ? 100 : (cIdx % 2 === 0 ? 75 : 50);
        } else if (p.status_code === 'planning') {
          map[`${p.id}_${col.key}`] = cIdx < 4 ? 25 : 50;
        } else if (p.status_code === 'completed') {
          map[`${p.id}_${col.key}`] = cIdx < 3 ? 25 : 0;
        } else {
          map[`${p.id}_${col.key}`] = (pIdx % 2 === 0) ? 50 : 25;
        }
      });
    });
    return map;
  }

  const saveAllocations = (updatedMap: Record<string, number>) => {
    setResourceAllocations(updatedMap);
    try {
      localStorage.setItem(HEATMAP_STORAGE_KEY, JSON.stringify(updatedMap));
    } catch (e) { console.error('[Timeline] Failed to save heatmap allocations to localStorage:', e); }
  };

  // Toggle allocation level for a specific project cell
  const handleToggleAllocation = (projectId: string, colKey: string, colLabel: string, projName: string) => {
    triggerHaptic('medium');
    const key = `${projectId}_${colKey}`;
    const current = resourceAllocations[key] ?? 0;

    // Cycle through: 0% -> 25% -> 50% -> 75% -> 100% -> 0%
    const levels = [0, 25, 50, 75, 100];
    const currentIndex = levels.indexOf(current);
    const nextLevel = levels[(currentIndex + 1) % levels.length];

    const updated = { ...resourceAllocations, [key]: nextLevel };
    saveAllocations(updated);

    const levelText = nextLevel === 0 
      ? (isRtl ? 'غير مخصص (0%)' : 'Unallocated (0%)')
      : `${nextLevel}% FTE`;

    const msg = isRtl
      ? `تم تحديل تخصيص الكوادر لمشروع [${projName}] في فترة (${colLabel}) إلى ${levelText}`
      : `Updated staff allocation for [${projName}] in (${colLabel}) to ${levelText}`;

    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Get color styles for allocation levels
  const getHeatmapColorStyle = (val: number) => {
    if (val === 0) {
      return 'bg-slate-100/50 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 border-slate-200/40 dark:border-zinc-800/50 hover:bg-slate-200/60 dark:hover:bg-zinc-700/50';
    } else if (val <= 30) {
      return 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 dark:hover:bg-emerald-500/35';
    } else if (val <= 60) {
      return 'bg-amber-500/20 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/35 dark:hover:bg-amber-500/40';
    } else if (val <= 85) {
      return 'bg-orange-500/25 dark:bg-orange-500/30 text-orange-800 dark:text-orange-300 border-orange-500/50 hover:bg-orange-500/40 dark:hover:bg-orange-500/45';
    } else {
      return 'bg-rose-500/30 dark:bg-rose-500/35 text-rose-800 dark:text-rose-300 border-rose-500/60 hover:bg-rose-500/45 dark:hover:bg-rose-500/50 font-black animate-pulse';
    }
  };

  // Hover Tooltip and Project Detail Drawer States
  const [hoveredProject, setHoveredProject] = useState<{ proj: Project; x: number; y: number } | null>(null);
  const [selectedProjectDrawer, setSelectedProjectDrawer] = useState<Project | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Date Math Helpers for Offset & Projected End Date
  const calculateOffsetDays = (origDateStr: string, newDateStr: string): number => {
    const t1 = new Date(origDateStr).getTime();
    const t2 = new Date(newDateStr).getTime();
    if (isNaN(t1) || isNaN(t2)) return 0;
    return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
  };

  const calculateProjectedEndDate = (proj: Project, milestoneNewDateStr: string, offsetDays: number): string => {
    const projEndStr = proj.end_date ? proj.end_date.substring(0, 10) : '2026-12-31';
    const projEndMs = new Date(projEndStr).getTime();
    const milestoneNewMs = new Date(milestoneNewDateStr).getTime();

    if (milestoneNewMs >= projEndMs) {
      // Add 14 days safety buffer beyond the milestone
      const newEndMs = milestoneNewMs + (14 * 24 * 60 * 60 * 1000);
      return new Date(newEndMs).toISOString().substring(0, 10);
    } else if (offsetDays > 0) {
      // Shift project end date forward proportionally
      const shiftedMs = projEndMs + (offsetDays * 24 * 60 * 60 * 1000);
      return new Date(shiftedMs).toISOString().substring(0, 10);
    }
    return projEndStr;
  };

  // Native Drag and Drop API Handlers
  const handleNativeDragStart = (e: React.DragEvent, m: ProjectMilestone, proj: Project) => {
    e.stopPropagation();
    triggerHaptic('medium');

    const initData = {
      milestoneId: m.id,
      projectId: m.projectId,
      titleAr: m.titleAr,
      titleEn: m.titleEn,
      originalDate: m.date,
      newTargetDate: m.date,
      offsetDays: 0,
      projectedEndDate: proj.end_date ? proj.end_date.substring(0, 10) : '2026-12-31',
      hoveredProjectId: proj.id,
      mouseXPct: getPercentFromDate(m.date)
    };

    e.dataTransfer.setData('text/plain', m.id);
    e.dataTransfer.setData('application/json', JSON.stringify(initData));
    e.dataTransfer.effectAllowed = 'move';

    setNativeDragInfo(initData);
  };

  const handleNativeDragOver = (e: React.DragEvent, proj: Project) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!containerRef.current || !nativeDragInfo) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = (x / rect.width) * 100;
    const calculatedDate = getDateFromPercent(pct);
    const offset = calculateOffsetDays(nativeDragInfo.originalDate, calculatedDate);
    const projectedEnd = calculateProjectedEndDate(proj, calculatedDate, offset);

    setNativeDragInfo(prev => {
      if (!prev) return null;
      return {
        ...prev,
        newTargetDate: calculatedDate,
        offsetDays: offset,
        projectedEndDate: projectedEnd,
        hoveredProjectId: proj.id,
        mouseXPct: pct
      };
    });
  };

  const handleNativeDrop = async (e: React.DragEvent, proj: Project) => {
    e.preventDefault();
    e.stopPropagation();

    if (!nativeDragInfo) return;

    triggerHaptic('success');
    const { milestoneId, originalDate, newTargetDate, offsetDays, projectedEndDate } = nativeDragInfo;

    // Optimistic state update for Milestones
    const updatedMilestones = milestones.map(m => {
      if (m.id === milestoneId) {
        return { ...m, date: newTargetDate, projectId: proj.id };
      }
      return m;
    });
    saveMilestones(updatedMilestones);

    // Optimistically update project end date on server if changed
    const originalProjEnd = proj.end_date ? proj.end_date.substring(0, 10) : '2026-12-31';
    if (projectedEndDate !== originalProjEnd) {
      updateProjectDatesOnServer(proj.id, proj.start_date, projectedEndDate);
    }

    const sign = offsetDays > 0 ? `+${offsetDays}` : `${offsetDays}`;
    const msg = isRtl
      ? `تم زحزحة المعلم [${nativeDragInfo.titleAr}] إلى ${newTargetDate} (${sign} يوم). تاريخ نهاية المشروع المتوقع: ${projectedEndDate}`
      : `Milestone [${nativeDragInfo.titleEn}] moved to ${newTargetDate} (${sign} days). Projected project end: ${projectedEndDate}`;

    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);

    setNativeDragInfo(null);
  };

  const handleNativeDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setNativeDragInfo(null);
  };

  // Drag & Drop Handlers for Milestones and Project Date Resizing
  const handlePointerDownMilestone = (e: React.PointerEvent, mId: string) => {
    e.stopPropagation();
    e.preventDefault();
    triggerHaptic('light');
    setDraggingMilestoneId(mId);

    const m = milestones.find(item => item.id === mId);
    if (m) setDragPreviewDate(m.date);

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveTimeline = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    if (!draggingMilestoneId && !dragProjectResizing) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    const calculatedDate = getDateFromPercent(pct);

    if (draggingMilestoneId) {
      setDragPreviewDate(calculatedDate);
    } else if (dragProjectResizing) {
      setDragPreviewDate(calculatedDate);
    }
  };

  const handlePointerUpTimeline = async (e: React.PointerEvent) => {
    if (!containerRef.current) return;

    if (draggingMilestoneId && dragPreviewDate) {
      triggerHaptic('success');
      const updated = milestones.map(m => {
        if (m.id === draggingMilestoneId) {
          return { ...m, date: dragPreviewDate };
        }
        return m;
      });
      saveMilestones(updated);

      const dragged = milestones.find(m => m.id === draggingMilestoneId);
      const proj = projects.find(p => p.id === dragged?.projectId);

      const msg = isRtl
        ? `تم إزاحة المعلم [${dragged?.titleAr || ''}] إلى تاريخ ${dragPreviewDate} بنجاح!`
        : `Milestone [${dragged?.titleEn || ''}] rescheduled to ${dragPreviewDate}!`;
      
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);

      // Optionally sync project end date if milestone moved past project end
      if (proj && new Date(dragPreviewDate) > new Date(proj.end_date || '2026-12-31')) {
        updateProjectDatesOnServer(proj.id, proj.start_date, dragPreviewDate);
      }
    }

    if (dragProjectResizing && dragPreviewDate) {
      triggerHaptic('success');
      const { projectId, edge } = dragProjectResizing;
      const proj = projects.find(p => p.id === projectId);
      if (proj) {
        const newStart = edge === 'start' ? dragPreviewDate : proj.start_date;
        const newEnd = edge === 'end' ? dragPreviewDate : proj.end_date;
        await updateProjectDatesOnServer(projectId, newStart, newEnd);
      }
    }

    setDraggingMilestoneId(null);
    setDragProjectResizing(null);
    setDragPreviewDate(null);
  };

  // Sync Project Date Updates to Server Database
  const updateProjectDatesOnServer = async (pId: string, sDate: string | null, eDate: string | null) => {
    try {
      const res = await fetch(`/api/tables/projects/${pId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: sDate ? new Date(sDate).toISOString() : null,
          end_date: eDate ? new Date(eDate).toISOString() : null
        })
      });
      if (res.ok && onRefreshProjects) {
        onRefreshProjects();
      }
    } catch (err) {
      console.error('Failed to sync project timeline dates:', err);
    }
  };

  // Milestone Add & Edit Modal
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMilestoneProjId, setNewMilestoneProjId] = useState<string>('');
  const [newTitleAr, setNewTitleAr] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newDate, setNewDate] = useState('2026-06-15');
  const [newStatus, setNewStatus] = useState<'completed' | 'in_progress' | 'delayed' | 'upcoming'>('upcoming');

  const handleOpenAddModal = (projId: string) => {
    setNewMilestoneProjId(projId);
    setNewTitleAr('');
    setNewTitleEn('');
    setNewDate(new Date().toISOString().substring(0, 10));
    setNewStatus('upcoming');
    setIsAddModalOpen(true);
  };

  const handleSaveNewMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleAr) return;

    const newM: ProjectMilestone = {
      id: `m-${Date.now()}`,
      projectId: newMilestoneProjId,
      titleAr: newTitleAr,
      titleEn: newTitleEn || newTitleAr,
      date: newDate,
      status: newStatus
    };

    saveMilestones([...milestones, newM]);
    setIsAddModalOpen(false);
    triggerHaptic('success');
  };

  const handleDeleteMilestone = (mId: string) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا المعلم الزمني؟' : 'Delete this milestone?')) return;
    saveMilestones(milestones.filter(m => m.id !== mId));
    setEditingMilestone(null);
    triggerHaptic('light');
  };

  const statusColors = {
    completed: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600' },
    in_progress: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-600' },
    delayed: { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-rose-500', badge: 'bg-rose-500/10 text-rose-600' },
    upcoming: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-600' }
  };

  return (
    <div className="space-y-4 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Timeline Controls & Filters Header */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isRtl ? 'المخطط الزمني للمشاريع والمعالم التنفيذية (Visual Project Timeline)' : 'Interactive Visual Project Timeline'}</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                Drag & Drop Milestones
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              {isRtl ? 'اسحب معالم المنجز والتواريخ الميدانية لتعديل المخطط الزمني ومزامنتها تلقائياً مع خادم PostgreSQL.' : 'Drag milestone pins to adjust target completion dates and sync with the database.'}
            </p>
          </div>
        </div>

        {/* Filters, Zoom Overlay and Reset */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Zoom Control Overlay Toolbar */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 px-1.5 flex items-center gap-1">
              <ZoomIn className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRtl ? 'مقياس العرض:' : 'Zoom:'}</span>
            </span>

            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 rounded-lg p-0.5 shadow-xs border border-slate-200/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setZoomLevel('months');
                  triggerHaptic('light');
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                  zoomLevel === 'months'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isRtl ? 'شهري' : 'Monthly'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoomLevel('quarters');
                  triggerHaptic('light');
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                  zoomLevel === 'quarters'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isRtl ? 'ربع سنوي' : 'Quarterly'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoomLevel('annual');
                  triggerHaptic('light');
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                  zoomLevel === 'annual'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isRtl ? 'سنوي' : 'Annual'}
              </button>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  if (zoomLevel === 'annual') setZoomLevel('quarters');
                  else if (zoomLevel === 'quarters') setZoomLevel('months');
                  triggerHaptic('light');
                }}
                disabled={zoomLevel === 'months'}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-30 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                title={isRtl ? 'تكبير المقياس (تفصيل أكثر)' : 'Zoom In'}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (zoomLevel === 'months') setZoomLevel('quarters');
                  else if (zoomLevel === 'quarters') setZoomLevel('annual');
                  triggerHaptic('light');
                }}
                disabled={zoomLevel === 'annual'}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-30 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                title={isRtl ? 'تصغير المقياس (نطاق أوسع)' : 'Zoom Out'}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Program filter */}
          <select
            value={selectedProgramFilter}
            onChange={e => setSelectedProgramFilter(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 outline-none"
          >
            <option value="all">{isRtl ? 'كل البرامج التنموية' : 'All Programs'}</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{isRtl ? p.name_ar : (p.name_en || p.name_ar)}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 outline-none"
          >
            <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="active">{isRtl ? 'نشط ميدانياً' : 'Active'}</option>
            <option value="planning">{isRtl ? 'تخطيط' : 'Planning'}</option>
            <option value="completed">{isRtl ? 'مكتمل' : 'Completed'}</option>
          </select>

          {/* Availability Heatmap Layer Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowHeatmap(prev => !prev);
              triggerHaptic('medium');
            }}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              showHeatmap
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 border-amber-600 shadow-md scale-102 font-black'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200'
            }`}
            title={isRtl ? 'عرض أو إخفاء الخريطة الحرارية لتوافر الكوادر وتوزيع الطاقة الاستيعابية' : 'Toggle Availability Heatmap Layer'}
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-slate-950 animate-bounce' : 'text-amber-500'}`} />
            <span>{isRtl ? 'خريطة الكوادر الحرارية' : 'Availability Heatmap'}</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black ${
              showHeatmap ? 'bg-slate-950/30 text-amber-950' : 'bg-slate-200 dark:bg-zinc-700 text-zinc-400'
            }`}>
              {showHeatmap ? (isRtl ? 'مُفعّلة' : 'ON') : (isRtl ? 'معطلة' : 'OFF')}
            </span>
          </button>

          {/* Reset milestones button */}
          <button
            onClick={() => {
              if (window.confirm(isRtl ? 'إعادة ضبط كافة المعالم إلى المخطط الافتراضي؟' : 'Reset all milestone dates to default?')) {
                const fresh = generateDefaultMilestones(projects);
                saveMilestones(fresh);
                triggerHaptic('success');
              }
            }}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title={isRtl ? 'إعادة ضبط المعالم' : 'Reset Milestones'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Availability Heatmap Legend Banner */}
      {showHeatmap && (
        <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 p-2.5 px-4 rounded-xl shadow-xs text-xs flex flex-wrap items-center justify-between gap-3 text-amber-200 animate-fade-in">
          <div className="flex items-center gap-2 font-black">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{isRtl ? 'دليل الخريطة الحرارية لتوافر الكوادر والطاقة الاستيعابية:' : 'Staff Availability & Capacity Heatmap Legend:'}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold flex-wrap">
            <span className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
              <span className="w-2.5 h-2.5 rounded bg-slate-400/50"></span>
              <span className="text-zinc-400">{isRtl ? '0% (متاح/غير مخصص)' : '0% (Free/Unallocated)'}</span>
            </span>

            <span className="flex items-center gap-1.5 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
              <span>{isRtl ? '25%-30% (حمل منخفض)' : '25%-30% (Low Load)'}</span>
            </span>

            <span className="flex items-center gap-1.5 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 text-amber-300">
              <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
              <span>{isRtl ? '50%-60% (حمل مثالي)' : '50%-60% (Optimal)'}</span>
            </span>

            <span className="flex items-center gap-1.5 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-500/30 text-orange-300">
              <span className="w-2.5 h-2.5 rounded bg-orange-500"></span>
              <span>{isRtl ? '75%-85% (حمل عالٍ)' : '75%-85% (High Load)'}</span>
            </span>

            <span className="flex items-center gap-1.5 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30 text-rose-300 font-black">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 animate-pulse"></span>
              <span>{isRtl ? '100%+ (ضغط استيعابي)' : '100%+ (Overallocated)'}</span>
            </span>
          </div>

          <div className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            💡 {isRtl ? 'انقر أي خلية في الخريطة الحرارية لتبديل وتعديل التخصيص فوراً' : 'Click any heatmap cell to toggle FTE allocation'}
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-emerald-100 border border-emerald-500 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce font-bold text-xs">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Timeline Board Container */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Top Legend */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 font-bold text-slate-600 dark:text-zinc-300 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>{isRtl ? 'مكتمل' : 'Completed'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{isRtl ? 'قيد التنفيذ' : 'In Progress'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>{isRtl ? 'متأخر' : 'Delayed'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>{isRtl ? 'مستقبلي' : 'Upcoming'}</span>
            </span>
          </div>

          <div className="text-[11px] font-mono text-zinc-400 font-bold hidden sm:block">
            {isRtl ? 'اسحب الأيقونات الدائرية أفقياً لتعديل تاريخ المعلم' : 'Drag milestone icons horizontally to adjust target dates'}
          </div>
        </div>

        {/* Scrollable Timeline Grid */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[900px]">
            {/* Months Header Row */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-950 font-bold text-xs">
              {/* Left Y-Axis Header column (Project Title) */}
              <div className="w-64 shrink-0 p-3 border-r rtl:border-r-0 rtl:border-l border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span>{isRtl ? 'المشروع التنفيذي' : 'Project Name'}</span>
                <span className="text-[10px] font-mono text-zinc-400">({filteredProjects.length})</span>
              </div>

              {/* Time Granularity Columns Header */}
              <div className="flex-1 flex relative">
                {timeColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex-1 p-3 text-center border-r rtl:border-r-0 rtl:border-l border-slate-200/60 dark:border-zinc-800/60 text-slate-700 dark:text-zinc-300 font-mono text-[11px] truncate"
                  >
                    {isRtl ? col.labelAr : col.labelEn}
                  </div>
                ))}
              </div>
            </div>

            {/* Project Rows */}
            <div
              ref={containerRef}
              onPointerMove={handlePointerMoveTimeline}
              onPointerUp={handlePointerUpTimeline}
              className="divide-y divide-slate-100 dark:divide-zinc-800 relative select-none"
            >
              {filteredProjects.map(proj => {
                const projStartPct = getPercentFromDate(proj.start_date);
                const projEndPct = getPercentFromDate(proj.end_date || '2026-12-31');
                const projWidthPct = Math.max(8, projEndPct - projStartPct);
                const projMilestones = milestones.filter(m => m.projectId === proj.id);

                return (
                  <React.Fragment key={proj.id}>
                    <div className="flex items-center min-h-[90px] hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                    {/* Y-Axis: Project Info Column */}
                    <div className="w-64 shrink-0 p-3 border-r rtl:border-r-0 rtl:border-l border-slate-200/80 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {proj.code}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400">
                          {proj.progress_percent || 0}%
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-800 dark:text-white truncate" title={isRtl ? proj.name_ar : (proj.name_en || proj.name_ar)}>
                        {isRtl ? proj.name_ar : (proj.name_en || proj.name_ar)}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                        <span>{proj.start_date ? proj.start_date.substring(0, 10) : '2026-01-01'}</span>
                        <span>→</span>
                        <span>{proj.end_date ? proj.end_date.substring(0, 10) : '2026-12-31'}</span>
                      </div>

                      <button
                        onClick={() => handleOpenAddModal(proj.id)}
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isRtl ? 'إضافة معلم جديد' : 'Add Milestone'}</span>
                      </button>
                    </div>

                    {/* Timeline Interactive Canvas Row */}
                    <div
                      onDragOver={e => handleNativeDragOver(e, proj)}
                      onDrop={e => handleNativeDrop(e, proj)}
                      className={`flex-1 h-20 relative py-2 px-1 transition-all ${
                        nativeDragInfo?.hoveredProjectId === proj.id
                          ? 'bg-amber-500/10 dark:bg-amber-500/15 ring-2 ring-amber-500/80 rounded-xl'
                          : ''
                      }`}
                    >
                      {/* Grid Vertical Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {timeColumns.map((_, cIdx) => (
                          <div key={cIdx} className="flex-1 border-r rtl:border-r-0 rtl:border-l border-slate-100 dark:border-zinc-800/40"></div>
                        ))}
                      </div>

                      {/* Project Bar */}
                      <div
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedProjectDrawer(proj);
                        }}
                        onMouseEnter={(e) => {
                          setHoveredProject({ proj, x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) => {
                          setHoveredProject({ proj, x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredProject(null)}
                        className="absolute h-9 top-5 rounded-xl bg-gradient-to-r from-amber-500/25 via-emerald-500/25 to-teal-500/25 hover:from-amber-500/40 hover:to-teal-500/40 border border-amber-500/40 dark:border-amber-500/30 flex items-center px-2 transition-all shadow-xs cursor-pointer group/bar"
                        style={{
                          [isRtl ? 'right' : 'left']: `${projStartPct}%`,
                          width: `${projWidthPct}%`
                        }}
                      >
                        {/* Progress Inner Bar */}
                        <div
                          className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 bg-amber-500/30 rounded-xl pointer-events-none"
                          style={{ width: `${proj.progress_percent || 0}%` }}
                        ></div>

                        <span className="relative z-10 font-bold text-[10px] text-amber-950 dark:text-amber-100 truncate px-1 flex items-center gap-1">
                          <Info className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>{proj.progress_percent || 0}%</span>
                        </span>

                        {/* Start Resizer Handle */}
                        <div
                          onPointerDown={e => {
                            e.stopPropagation();
                            setDragProjectResizing({ projectId: proj.id, edge: 'start' });
                          }}
                          className="absolute -left-1 rtl:-right-1 top-1/2 -translate-y-1/2 w-2.5 h-6 bg-amber-600 rounded-full cursor-ew-resize hover:scale-125 transition-transform"
                          title={isRtl ? 'سحب لتعديل تاريخ البداية' : 'Drag start date'}
                        ></div>

                        {/* End Resizer Handle */}
                        <div
                          onPointerDown={e => {
                            e.stopPropagation();
                            setDragProjectResizing({ projectId: proj.id, edge: 'end' });
                          }}
                          className="absolute -right-1 rtl:-left-1 top-1/2 -translate-y-1/2 w-2.5 h-6 bg-amber-600 rounded-full cursor-ew-resize hover:scale-125 transition-transform"
                          title={isRtl ? 'سحب لتعديل تاريخ النهاية' : 'Drag end date'}
                        ></div>
                      </div>

                      {/* Native Drag Guide Line & Ghost Feedback */}
                      {nativeDragInfo && nativeDragInfo.hoveredProjectId === proj.id && (
                        <>
                          <div
                            className="absolute top-0 bottom-0 border-l-2 border-dashed border-amber-500 z-30 pointer-events-none"
                            style={{
                              [isRtl ? 'right' : 'left']: `${nativeDragInfo.mouseXPct}%`
                            }}
                          ></div>

                          <div
                            className="absolute -top-10 z-40 bg-slate-900/95 text-amber-300 border border-amber-500/50 px-2.5 py-1 rounded-xl shadow-xl text-[10px] font-mono font-bold whitespace-nowrap pointer-events-none flex items-center gap-2 -translate-x-1/2 animate-pulse"
                            style={{
                              [isRtl ? 'right' : 'left']: `${nativeDragInfo.mouseXPct}%`
                            }}
                          >
                            <span>📅 {nativeDragInfo.newTargetDate}</span>
                            <span className="text-emerald-400">
                              ({nativeDragInfo.offsetDays >= 0 ? `+${nativeDragInfo.offsetDays}` : nativeDragInfo.offsetDays} {isRtl ? 'يوم' : 'd'})
                            </span>
                            <span className="text-zinc-400 border-r rtl:border-r-0 rtl:border-l border-slate-700 px-1">
                              ⏳ {isRtl ? 'النهاية:' : 'End:'} {nativeDragInfo.projectedEndDate}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Milestones Pins */}
                      {projMilestones.map(m => {
                        const mPct = getPercentFromDate(m.date);
                        const isDraggingPointer = draggingMilestoneId === m.id;
                        const isDraggingNative = nativeDragInfo?.milestoneId === m.id;
                        const config = statusColors[m.status] || statusColors.upcoming;

                        return (
                          <div
                            key={m.id}
                            draggable={true}
                            onDragStart={e => handleNativeDragStart(e, m, proj)}
                            onDragEnd={handleNativeDragEnd}
                            onPointerDown={e => handlePointerDownMilestone(e, m.id)}
                            onClick={() => setEditingMilestone(m)}
                            onMouseEnter={(e) => {
                              setHoveredProject({ proj, x: e.clientX, y: e.clientY });
                            }}
                            onMouseMove={(e) => {
                              setHoveredProject({ proj, x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => setHoveredProject(null)}
                            className={`absolute top-2 z-20 group cursor-grab active:cursor-grabbing transition-transform ${
                              isDraggingPointer || isDraggingNative ? 'scale-125 z-30 opacity-80' : 'hover:scale-110'
                            }`}
                            style={{
                              [isRtl ? 'right' : 'left']: `${mPct}%`,
                              transform: 'translateX(-50%)'
                            }}
                          >
                            {/* Milestone Pin Icon */}
                            <div className={`w-6 h-6 rounded-full ${config.bg} border-2 border-white dark:border-zinc-900 shadow-md flex items-center justify-center text-white text-[10px] font-black group-hover:scale-110 transition-transform`}>
                              <Move className="w-3 h-3" />
                            </div>

                            {/* Milestone Label Badge below pin */}
                            <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-md rounded-md px-1.5 py-0.5 text-[9px] font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${config.bg}`}></span>
                              <span className="max-w-[100px] truncate">{isRtl ? m.titleAr : m.titleEn}</span>
                            </div>

                            {/* Hover / Pointer Drag Live Date Tooltip */}
                            {(isDraggingPointer || dragPreviewDate) && isDraggingPointer && (
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap animate-bounce">
                                📅 {dragPreviewDate}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Availability Heatmap Sub-Row per Project */}
                  {showHeatmap && (
                    <div className="border-t border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/70 dark:bg-zinc-950/70 flex items-center min-h-[38px] px-0.5">
                      {/* Left Column Label */}
                      <div className="w-64 shrink-0 px-3 py-1.5 border-r rtl:border-r-0 rtl:border-l border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                        <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                          <Users className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'توافر الكوادر (FTE)' : 'Staff Allocation'}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                          {Math.round(
                            Object.keys(resourceAllocations)
                              .filter(k => k.startsWith(`${proj.id}_`))
                              .reduce((sum, k) => sum + (resourceAllocations[k] || 0), 0) / Math.max(1, timeColumns.length)
                          )}% avg
                        </span>
                      </div>

                      {/* Heatmap Grid Interactive Cells for Time Columns */}
                      <div className="flex-1 flex items-center h-full">
                        {timeColumns.map((col) => {
                          const allocKey = `${proj.id}_${col.key}`;
                          const val = resourceAllocations[allocKey] ?? 0;
                          const colorStyle = getHeatmapColorStyle(val);
                          const colName = isRtl ? col.labelAr : col.labelEn;
                          const projName = isRtl ? proj.name_ar : (proj.name_en || proj.name_ar);

                          return (
                            <button
                              key={col.key}
                              type="button"
                              onClick={() => handleToggleAllocation(proj.id, col.key, colName, projName)}
                              className={`flex-1 h-7 mx-0.5 my-0.5 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer select-none group relative ${colorStyle}`}
                              title={isRtl
                                ? `المشروع: ${projName}\nالفترة: ${colName}\nتخصيص الكوادر: ${val}% FTE\nانقر للتبديل والتعديل المباشر`
                                : `Project: ${projName}\nPeriod: ${colName}\nStaff Allocation: ${val}% FTE\nClick to toggle FTE load`
                              }
                            >
                              <span className="font-mono text-[10px] font-black tracking-tighter">
                                {val}%
                              </span>
                              <div className="w-4/5 h-1 rounded-full bg-black/20 dark:bg-white/20 mt-0.5 overflow-hidden pointer-events-none">
                                <div
                                  className={`h-full transition-all ${
                                    val > 85 ? 'bg-rose-500' : val > 60 ? 'bg-orange-500' : val > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, val)}%` }}
                                ></div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Master Organization Staff Capacity Aggregate Row */}
            {showHeatmap && filteredProjects.length > 0 && (
              <div className="border-t-2 border-amber-500/50 bg-slate-900 text-white flex items-center min-h-[46px] px-0.5">
                {/* Left Column Aggregate Label */}
                <div className="w-64 shrink-0 px-3 py-2 border-r rtl:border-r-0 rtl:border-l border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-black text-xs text-amber-300">{isRtl ? 'إجمالي الحمل المؤسسي' : 'Total Org Capacity'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">{filteredProjects.length} {isRtl ? 'مشروع' : 'proj'}</span>
                </div>

                {/* Master Column Totals */}
                <div className="flex-1 flex items-center h-full">
                  {timeColumns.map((col) => {
                    let totalVal = 0;
                    filteredProjects.forEach(p => {
                      totalVal += (resourceAllocations[`${p.id}_${col.key}`] || 0);
                    });
                    const avgVal = Math.round(totalVal / Math.max(1, filteredProjects.length));
                    const colorStyle = getHeatmapColorStyle(avgVal);

                    return (
                      <div
                        key={col.key}
                        className={`flex-1 h-9 mx-0.5 my-1 rounded-xl border flex flex-col items-center justify-center transition-all ${colorStyle} font-mono`}
                        title={isRtl
                          ? `إجمالي متوسط تخصيص الكوادر بالفترة (${isRtl ? col.labelAr : col.labelEn}): ${avgVal}% FTE`
                          : `Total average staff allocation in (${col.labelEn}): ${avgVal}% FTE`
                        }
                      >
                        <span className="text-[10px] font-black">{avgVal}%</span>
                        <span className="text-[8px] opacity-80 uppercase font-bold">
                          {avgVal > 85 ? (isRtl ? 'مرتفع' : 'High') : avgVal > 50 ? (isRtl ? 'مثالي' : 'Optimal') : (isRtl ? 'متاح' : 'Available')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Milestone Details Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isRtl ? 'تعديل تفاصيل المعلم الزمني' : 'Edit Milestone Details'}
              </h3>
              <button onClick={() => setEditingMilestone(null)} className="p-1 text-zinc-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">{isRtl ? 'اسم المعلم بالعربية' : 'Milestone Title (Arabic)'}</label>
                <input
                  type="text"
                  value={editingMilestone.titleAr}
                  onChange={e => setEditingMilestone({ ...editingMilestone, titleAr: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-lg font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">{isRtl ? 'التاريخ المتوقع' : 'Target Date'}</label>
                <input
                  type="date"
                  value={editingMilestone.date}
                  onChange={e => setEditingMilestone({ ...editingMilestone, date: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-lg font-bold text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">{isRtl ? 'حالة الإنجاز' : 'Status'}</label>
                <select
                  value={editingMilestone.status}
                  onChange={e => setEditingMilestone({ ...editingMilestone, status: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-lg font-bold text-slate-800 dark:text-white"
                >
                  <option value="completed">{isRtl ? 'مكتمل' : 'Completed'}</option>
                  <option value="in_progress">{isRtl ? 'قيد التنفيذ' : 'In Progress'}</option>
                  <option value="delayed">{isRtl ? 'متأخر' : 'Delayed'}</option>
                  <option value="upcoming">{isRtl ? 'مستقبلي' : 'Upcoming'}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => handleDeleteMilestone(editingMilestone.id)}
                className="px-3 py-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRtl ? 'حذف' : 'Delete'}</span>
              </button>

              <button
                onClick={() => {
                  saveMilestones(milestones.map(m => m.id === editingMilestone.id ? editingMilestone : m));
                  setEditingMilestone(null);
                  triggerHaptic('success');
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
              >
                {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Milestone Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveNewMilestone} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isRtl ? 'إضافة معلم زمني جديد للمشروع' : 'Add New Milestone'}
              </h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1 text-zinc-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">{isRtl ? 'عنوان المعلم (عربي)' : 'Milestone Title (Arabic)'} *</label>
                <input
                  type="text"
                  required
                  value={newTitleAr}
                  onChange={e => setNewTitleAr(e.target.value)}
                  placeholder={isRtl ? 'مثال: توريد المعدات الطبية...' : 'e.g. Equipment Delivery'}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-lg font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">{isRtl ? 'التاريخ الميداني' : 'Target Date'} *</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-lg font-bold text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">{isRtl ? 'الحالة' : 'Status'}</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border rounded-lg font-bold text-slate-800 dark:text-white"
                >
                  <option value="upcoming">{isRtl ? 'مستقبلي' : 'Upcoming'}</option>
                  <option value="in_progress">{isRtl ? 'قيد التنفيذ' : 'In Progress'}</option>
                  <option value="completed">{isRtl ? 'مكتمل' : 'Completed'}</option>
                  <option value="delayed">{isRtl ? 'متأخر' : 'Delayed'}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
              >
                {isRtl ? 'إضافة المعلم' : 'Add Milestone'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hover Tooltip Overlay */}
      {hoveredProject && !draggingMilestoneId && !dragProjectResizing && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-900/95 text-white dark:bg-zinc-950/95 border border-slate-700 dark:border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs space-y-2 animate-fade-in text-xs"
          style={{
            top: Math.min(window.innerHeight - 180, hoveredProject.y + 12),
            left: Math.min(window.innerWidth - 260, Math.max(10, hoveredProject.x + 12))
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
            <span className="font-mono text-[10px] font-extrabold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
              {hoveredProject.proj.code}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {hoveredProject.proj.status_code || 'active'}
            </span>
          </div>

          <h5 className="font-black text-xs text-slate-100 leading-snug">
            {isRtl ? hoveredProject.proj.name_ar : (hoveredProject.proj.name_en || hoveredProject.proj.name_ar)}
          </h5>

          <div className="space-y-1 text-[10px] text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">{isRtl ? 'النطاق الزمني:' : 'Timeline:'}</span>
              <span className="font-mono font-bold text-amber-300">
                {hoveredProject.proj.start_date ? hoveredProject.proj.start_date.substring(0, 10) : '2026-01-01'} → {hoveredProject.proj.end_date ? hoveredProject.proj.end_date.substring(0, 10) : '2026-12-31'}
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{isRtl ? 'نسبة الإنجاز:' : 'Progress:'}</span>
                <span className="font-bold text-emerald-400">{hoveredProject.proj.progress_percent || 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${hoveredProject.proj.progress_percent || 0}%` }}></div>
              </div>
            </div>

            {hoveredProject.proj.budget && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-zinc-400">{isRtl ? 'الميزانية:' : 'Budget:'}</span>
                <span className="font-mono font-bold text-amber-400">
                  {Number(hoveredProject.proj.budget).toLocaleString()} {hoveredProject.proj.currency_code || 'USD'}
                </span>
              </div>
            )}
          </div>

          <div className="text-[9px] text-amber-400/80 font-mono text-center pt-1 border-t border-slate-800">
            {isRtl ? '💡 انقر على المشروع لعرض السجل الميداني والمعالم' : '💡 Click to open full details & milestones'}
          </div>
        </div>
      )}

      {/* Context-Sensitive Project Details Drawer / Modal */}
      {selectedProjectDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center md:justify-end p-2 md:p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg h-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-slide-left">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {selectedProjectDrawer.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {selectedProjectDrawer.status_code || 'Active'}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                    {isRtl ? selectedProjectDrawer.name_ar : (selectedProjectDrawer.name_en || selectedProjectDrawer.name_ar)}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedProjectDrawer(null)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
              {/* Progress & Quick Stats */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-amber-50/40 dark:from-zinc-950 dark:to-amber-950/20 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-700 dark:text-zinc-300">{isRtl ? 'نسبة الإنجاز الميداني العامة' : 'Overall Field Completion'}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">{selectedProjectDrawer.progress_percent || 0}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${selectedProjectDrawer.progress_percent || 0}%` }}></div>
                </div>
              </div>

              {/* General Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold block">{isRtl ? 'تاريخ البداية' : 'Start Date'}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">{selectedProjectDrawer.start_date ? selectedProjectDrawer.start_date.substring(0, 10) : '2026-01-01'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold block">{isRtl ? 'تاريخ النهاية' : 'End Date'}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">{selectedProjectDrawer.end_date ? selectedProjectDrawer.end_date.substring(0, 10) : '2026-12-31'}</span>
                </div>

                {selectedProjectDrawer.budget && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold block">{isRtl ? 'الميزانية المعتمدة' : 'Approved Budget'}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(selectedProjectDrawer.budget).toLocaleString()} {selectedProjectDrawer.currency_code || 'USD'}
                    </span>
                  </div>
                )}

                {selectedProjectDrawer.location_name && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold block">{isRtl ? 'الموقع / النطاق الجغرافي' : 'Location / Geospatial Scope'}</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedProjectDrawer.location_name}</span>
                  </div>
                )}
              </div>

              {/* Milestones List Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>{isRtl ? 'سجل المعالم والمحطات الزمنية' : 'Milestones Schedule'}</span>
                  </h4>

                  <button
                    onClick={() => {
                      handleOpenAddModal(selectedProjectDrawer.id);
                    }}
                    className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isRtl ? 'إضافة معلم' : 'Add Milestone'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {milestones.filter(m => m.projectId === selectedProjectDrawer.id).length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 bg-slate-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                      {isRtl ? 'لا توجد معالم مضافة لهذا المشروع بعد' : 'No milestones defined for this project'}
                    </div>
                  ) : (
                    milestones
                      .filter(m => m.projectId === selectedProjectDrawer.id)
                      .map(m => {
                        const config = statusColors[m.status] || statusColors.upcoming;
                        return (
                          <div
                            key={m.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${config.bg}`}></span>
                                <span className="font-black text-slate-800 dark:text-zinc-100">{isRtl ? m.titleAr : m.titleEn}</span>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-400 block">{isRtl ? 'تاريخ الاستحقاق:' : 'Target Date:'} {m.date}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.badge}`}>
                                {isRtl 
                                  ? (m.status === 'completed' ? 'مكتمل' : m.status === 'in_progress' ? 'قيد التنفيذ' : m.status === 'delayed' ? 'متأخر' : 'مستقبلي')
                                  : m.status}
                              </span>

                              <button
                                onClick={() => setEditingMilestone(m)}
                                className="p-1 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                                title={isRtl ? 'تعديل المعلم' : 'Edit Milestone'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono text-[10px]">
                {isRtl ? 'سجل المخطط الزمني المؤسسي' : 'NexoraOS™ Timeline Ledger'}
              </span>

              <button
                onClick={() => setSelectedProjectDrawer(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg font-bold transition-colors cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualProjectTimeline;
