import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  Link2, 
  ChevronRight, 
  ChevronDown, 
  ChevronLeft, 
  ZoomIn, 
  ZoomOut, 
  Sliders, 
  Info, 
  Sparkles,
  RefreshCw,
  X,
  Play,
  UserCheck,
  Truck,
  Wrench,
  ShieldAlert,
  Users,
  Briefcase
} from 'lucide-react';
import { Project, Program } from '../core/types';
import { triggerHaptic } from '../helpers/hapticSwipe';

export interface GanttPhase {
  id: string;
  projectId: string;
  nameAr: string;
  nameEn: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  progressPercent: number; // 0 - 100
  dependsOnPhaseId?: string; // ID of predecessor phase
  statusCode: 'planning' | 'active' | 'completed' | 'delayed';
}

export interface ResourceAllocation {
  id: string;
  resourceNameAr: string;
  resourceNameEn: string;
  resourceType: 'HUMAN' | 'EQUIPMENT' | 'VEHICLE' | 'OTHER';
  projectNameAr: string;
  projectNameEn: string;
  projectId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  allocationPercent: number; // 0 - 100
  assignedRoleAr: string;
  assignedRoleEn: string;
}

interface ProjectGanttViewProps {
  projects: Project[];
  programs?: Program[];
  lang: 'ar' | 'en';
  onRefreshProjects?: () => void;
}

const STORAGE_KEY_GANTT_PHASES = 'nexora_project_gantt_phases_v1';
const STORAGE_KEY_GANTT_ALLOCATIONS = 'nexora_project_gantt_allocations_v1';

export default function ProjectGanttView({
  projects,
  programs = [],
  lang,
  onRefreshProjects
}: ProjectGanttViewProps) {
  const isRtl = lang === 'ar';

  // 1. Zoom and Time Resolution States
  const [zoomLevel, setZoomLevel] = useState<'days' | 'weeks' | 'months'>('months');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // 2. Active Editing States (Phases)
  const [editingPhase, setEditingPhase] = useState<GanttPhase | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [addingToProjectId, setAddingToProjectId] = useState<string | null>(null);

  // 3. Active Editing States (Resource Allocations)
  const [editingAllocation, setEditingAllocation] = useState<ResourceAllocation | null>(null);
  const [isAllocEditorOpen, setIsAllocEditorOpen] = useState(false);
  const [isAddingAlloc, setIsAddingAlloc] = useState(false);

  // Gantt Chart Container Ref (used to calculate SVG coordinates dynamically)
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [redrawCounter, setRedrawCounter] = useState(0);

  // Trigger SVG redraw on window resize or scroll
  useEffect(() => {
    const handleResize = () => setRedrawCounter(prev => prev + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 4. Load or generate Phases for projects
  const [phases, setPhases] = useState<GanttPhase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GANTT_PHASES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading Gantt phases:', e);
    }
    return generateDefaultPhases(projects);
  });

  // 5. Load or generate Resource Allocations
  const [allocations, setAllocations] = useState<ResourceAllocation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GANTT_ALLOCATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading resource allocations:', e);
    }
    return generateDefaultAllocations(projects);
  });

  // Keep Default Phases & Allocations in sync when projects change
  useEffect(() => {
    setPhases(prev => {
      const existingProjectIds = new Set(prev.map(p => p.projectId));
      const missingProjects = projects.filter(p => !existingProjectIds.has(p.id));
      if (missingProjects.length === 0) return prev;

      const newGenerated = generateDefaultPhases(missingProjects);
      const updated = [...prev, ...newGenerated];
      try {
        localStorage.setItem(STORAGE_KEY_GANTT_PHASES, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setAllocations(prev => {
      const existingProjectIds = new Set(prev.map(p => p.projectId));
      const missingProjects = projects.filter(p => !existingProjectIds.has(p.id));
      if (missingProjects.length === 0) return prev;

      const newGenerated = generateDefaultAllocations(missingProjects);
      const updated = [...prev, ...newGenerated];
      try {
        localStorage.setItem(STORAGE_KEY_GANTT_ALLOCATIONS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Expand first 2 projects by default if not set
    if (projects.length > 0) {
      setExpandedProjects(prev => {
        const next = { ...prev };
        projects.slice(0, 2).forEach(p => {
          if (next[p.id] === undefined) {
            next[p.id] = true;
          }
        });
        return next;
      });
    }
  }, [projects]);

  // Helper to save phases to state and local storage
  const savePhases = (updated: GanttPhase[]) => {
    setPhases(updated);
    try {
      localStorage.setItem(STORAGE_KEY_GANTT_PHASES, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setRedrawCounter(prev => prev + 1), 150);
  };

  // Helper to save allocations to state and local storage
  const saveAllocations = (updated: ResourceAllocation[]) => {
    setAllocations(updated);
    try {
      localStorage.setItem(STORAGE_KEY_GANTT_ALLOCATIONS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setRedrawCounter(prev => prev + 1), 150);
  };

  // Helper to generate default phases
  function generateDefaultPhases(projs: Project[]): GanttPhase[] {
    const list: GanttPhase[] = [];
    projs.forEach(p => {
      const startStr = p.start_date ? p.start_date.substring(0, 10) : '2026-01-01';
      const endStr = p.end_date ? p.end_date.substring(0, 10) : '2026-12-31';
      
      const start = new Date(startStr);
      const end = new Date(endStr);
      const startMs = start.getTime();
      const totalDurationMs = Math.max(86400000 * 60, end.getTime() - startMs);

      // Phase 1: Initiation
      const p1Start = new Date(startMs);
      const p1End = new Date(startMs + totalDurationMs * 0.2);
      
      // Phase 2: Procurement (depends on Phase 1)
      const p2Start = new Date(p1End.getTime() + 86400000);
      const p2End = new Date(p2Start.getTime() + totalDurationMs * 0.3);

      // Phase 3: Execution (depends on Phase 2)
      const p3Start = new Date(p2End.getTime() + 86400000);
      const p3End = new Date(p3Start.getTime() + totalDurationMs * 0.4);

      // Phase 4: Audit & Closure (depends on Phase 3)
      const p4Start = new Date(p3End.getTime() + 86400000);
      const p4End = new Date(Math.min(end.getTime(), p4Start.getTime() + totalDurationMs * 0.1));

      const id1 = `phase-${p.id}-initiation`;
      const id2 = `phase-${p.id}-procurement`;
      const id3 = `phase-${p.id}-execution`;
      const id4 = `phase-${p.id}-closure`;

      list.push(
        {
          id: id1,
          projectId: p.id,
          nameAr: 'تأسيس الموقع والمسح الميداني والتقييم',
          nameEn: 'Site Setup & Baseline Assessment',
          startDate: p1Start.toISOString().substring(0, 10),
          endDate: p1End.toISOString().substring(0, 10),
          progressPercent: p.status_code === 'completed' ? 100 : 90,
          statusCode: 'completed',
        },
        {
          id: id2,
          projectId: p.id,
          nameAr: 'شراء الإمدادات والخدمات اللوجستية والقرارات الشاملة',
          nameEn: 'Logistics, Procurement & Supply Chain',
          startDate: p2Start.toISOString().substring(0, 10),
          endDate: p2End.toISOString().substring(0, 10),
          progressPercent: p.status_code === 'completed' ? 100 : 60,
          dependsOnPhaseId: id1,
          statusCode: 'active',
        },
        {
          id: id3,
          projectId: p.id,
          nameAr: 'التوزيع الميداني والتدشين الفعلي والعمليات المباشرة',
          nameEn: 'Field Distribution & Physical Operations',
          startDate: p3Start.toISOString().substring(0, 10),
          endDate: p3End.toISOString().substring(0, 10),
          progressPercent: p.status_code === 'completed' ? 100 : 25,
          dependsOnPhaseId: id2,
          statusCode: 'active',
        },
        {
          id: id4,
          projectId: p.id,
          nameAr: 'التدقيق النهائي وإعداد تقرير الأثر الإنساني',
          nameEn: 'Final Evaluation & Handover Audit',
          startDate: p4Start.toISOString().substring(0, 10),
          endDate: p4End.toISOString().substring(0, 10),
          progressPercent: p.status_code === 'completed' ? 100 : 0,
          dependsOnPhaseId: id3,
          statusCode: 'planning',
        }
      );
    });
    return list;
  }

  // Helper to generate default resource allocations
  function generateDefaultAllocations(projs: Project[]): ResourceAllocation[] {
    const list: ResourceAllocation[] = [];
    if (projs.length === 0) return [];

    const p1 = projs[0];
    const p2 = projs[1] || p1;

    // 1. Dr. Khaled Al-Himyari (Human Specialist)
    list.push({
      id: 'alloc-1',
      resourceNameAr: 'د. خالد الحميري (طبيب عام مشرف ميداني)',
      resourceNameEn: 'Dr. Khaled Al-Himyari (Field Medical Lead)',
      resourceType: 'HUMAN',
      projectId: p1.id,
      projectNameAr: p1.name_ar,
      projectNameEn: p1.name_en || p1.name_ar,
      startDate: '2026-01-15',
      endDate: '2026-05-20',
      allocationPercent: 100,
      assignedRoleAr: 'الإشراف على تشغيل العيادات الطبية الطارئة والفرز',
      assignedRoleEn: 'Oversight of emergency medical clinics & sorting'
    });

    // 2. WASH Engineer
    list.push({
      id: 'alloc-2',
      resourceNameAr: 'م. ياسمين الصنعاني (مهندسة آبار وإصحاح بيئي)',
      resourceNameEn: 'Eng. Yasmin Al-Sanani (WASH Specialist)',
      resourceType: 'HUMAN',
      projectId: p2.id,
      projectNameAr: p2.name_ar,
      projectNameEn: p2.name_en || p2.name_ar,
      startDate: '2026-02-10',
      endDate: '2026-07-30',
      allocationPercent: 80,
      assignedRoleAr: 'تصميم فني لشبكات المياه وتطهير نقاط التجميع',
      assignedRoleEn: 'Technical design of water networks & disinfection'
    });

    // 3. Heavy Excavation Truck
    list.push({
      id: 'alloc-3',
      resourceNameAr: 'شاحنة الحفر والتنقيب المائي الثقيلة [Asset-452]',
      resourceNameEn: 'Heavy Drilling Excavation Rig [Asset-452]',
      resourceType: 'EQUIPMENT',
      projectId: p2.id,
      projectNameAr: p2.name_ar,
      projectNameEn: p2.name_en || p2.name_ar,
      startDate: '2026-03-01',
      endDate: '2026-08-25',
      allocationPercent: 100,
      assignedRoleAr: 'حفر الآبار الارتوازية العميقة وتمديد الأنابيب السلكية',
      assignedRoleEn: 'Deep artesian well drilling & piping conduit assembly'
    });

    // 4. Toyota Hilux 4x4
    list.push({
      id: 'alloc-4',
      resourceNameAr: 'مركبة الدفع الرباعي الميدانية [Toyota Hilux - 928]',
      resourceNameEn: 'Field 4x4 Patrol Truck [Toyota Hilux - 928]',
      resourceType: 'VEHICLE',
      projectId: p1.id,
      projectNameAr: p1.name_ar,
      projectNameEn: p1.name_en || p1.name_ar,
      startDate: '2026-01-05',
      endDate: '2026-04-15',
      allocationPercent: 100,
      assignedRoleAr: 'نقل المواد الإغاثية والوصول للمناطق الجبلية الوعرة',
      assignedRoleEn: 'Relief supply transit & rugged mountainous traversal'
    });

    // 5. Conflict Scenario Resource: Logistics Specialist (Allocated to both p1 and p2 during overlapping periods)
    list.push({
      id: 'alloc-5a',
      resourceNameAr: 'عبد الرحمن الشميري (مشرف الدعم اللوجستي والمستودعات)',
      resourceNameEn: 'Abdulrahman Al-Shmeiri (Logistics Coordinator)',
      resourceType: 'HUMAN',
      projectId: p1.id,
      projectNameAr: p1.name_ar,
      projectNameEn: p1.name_en || p1.name_ar,
      startDate: '2026-03-01',
      endDate: '2026-06-30',
      allocationPercent: 75,
      assignedRoleAr: 'تأمين وصول القوافل الإغاثية وعمليات الجرد الميداني',
      assignedRoleEn: 'Securing convoy transport & live field inventory checks'
    });

    list.push({
      id: 'alloc-5b',
      resourceNameAr: 'عبد الرحمن الشميري (مشرف الدعم اللوجستي والمستودعات)',
      resourceNameEn: 'Abdulrahman Al-Shmeiri (Logistics Coordinator)',
      resourceType: 'HUMAN',
      projectId: p2.id,
      projectNameAr: p2.name_ar,
      projectNameEn: p2.name_en || p2.name_ar,
      startDate: '2026-05-15',
      endDate: '2026-08-15',
      allocationPercent: 50, // May 15 to June 30 is overlapping! 75% + 50% = 125% allocation (Conflict!)
      assignedRoleAr: 'إدارة سلاسل التوريد وشراء مستلزمات الآبار والمقاولين',
      assignedRoleEn: 'Supply chain control & purchasing materials for WASH wells'
    });

    return list;
  }

  // 6. Timeline Axis Configurations
  // We'll set the timeline span to encompass the year 2026
  const timelineRange = useMemo(() => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-12-31');
    return { start, end, totalMs: end.getTime() - start.getTime() };
  }, []);

  const timeColumns = useMemo(() => {
    const columns: { labelAr: string; labelEn: string; dateStart: Date; dateEnd: Date }[] = [];
    const { start, end } = timelineRange;

    if (zoomLevel === 'months') {
      const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'الجودة'];
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let m = 0; m < 12; m++) {
        columns.push({
          labelAr: monthNamesAr[m],
          labelEn: monthNamesEn[m],
          dateStart: new Date(2026, m, 1),
          dateEnd: new Date(2026, m + 1, 0)
        });
      }
    } else if (zoomLevel === 'weeks') {
      for (let w = 1; w <= 26; w++) {
        const dateStart = new Date(2026, 0, (w - 1) * 14 + 1);
        const dateEnd = new Date(2026, 0, w * 14);
        columns.push({
          labelAr: `متبقي ${w * 2 - 1}-${w * 2}`,
          labelEn: `W${w * 2 - 1}-${w * 2}`,
          dateStart,
          dateEnd
        });
      }
    } else {
      for (let d = 1; d <= 36; d++) {
        const dateStart = new Date(2026, 0, (d - 1) * 10 + 1);
        const dateEnd = new Date(2026, 0, d * 10);
        const monthNum = dateStart.getMonth();
        const dayOfMonth = dateStart.getDate();
        const monthAr = ['إضافة', 'العملة', 'كادر', 'عملات', 'وحدة', 'تحديث', 'معتمد', 'مرفوض', 'متوسطة', 'الهاتف', 'الهاتف', 'الجودة'][monthNum];
        const monthEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthNum];
        columns.push({
          labelAr: `${dayOfMonth} ${monthAr}`,
          labelEn: `${dayOfMonth} ${monthEn}`,
          dateStart,
          dateEnd
        });
      }
    }
    return columns;
  }, [zoomLevel, timelineRange]);

  // Helpers to map Dates to Horizontal Percentage Offsets
  const getDatePlacement = (startStr: string | null, endStr: string | null) => {
    if (!startStr) return { left: 0, width: 0 };
    const { start: timelineStart, end: timelineEnd, totalMs } = timelineRange;
    const itemStart = new Date(startStr).getTime();
    const itemEnd = endStr ? new Date(endStr).getTime() : itemStart + 86400000 * 30; // 30 days default

    // Clip to boundary
    const startMs = Math.max(timelineStart.getTime(), itemStart);
    const endMs = Math.min(timelineEnd.getTime(), itemEnd);

    if (endMs <= startMs) {
      return { left: 0, width: 0 };
    }

    const left = ((startMs - timelineStart.getTime()) / totalMs) * 100;
    const width = ((endMs - startMs) / totalMs) * 100;

    return { 
      left: Math.max(0, Math.min(100, left)), 
      width: Math.max(1.5, Math.min(100 - left, width)) 
    };
  };

  // Filter projects inside Gantt
  const filteredProjects = useMemo(() => {
    if (selectedProjectId === 'all') return projects;
    return projects.filter(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Group allocations and compute conflicts dynamically
  const groupedResources = useMemo(() => {
    const groups: Record<string, ResourceAllocation[]> = {};
    
    // Filter allocations by selected project if specific project is chosen
    const relevantAllocs = selectedProjectId === 'all' 
      ? allocations 
      : allocations.filter(a => a.projectId === selectedProjectId);

    relevantAllocs.forEach(alloc => {
      const key = alloc.resourceNameEn;
      if (!groups[key]) groups[key] = [];
      groups[key].push(alloc);
    });

    const list: {
      nameAr: string;
      nameEn: string;
      type: 'HUMAN' | 'EQUIPMENT' | 'VEHICLE' | 'OTHER';
      allocations: ResourceAllocation[];
      conflicts: { startDate: string; endDate: string; totalPercent: number }[];
    }[] = [];

    const yearStart = new Date('2026-01-01').getTime();

    Object.keys(groups).forEach(key => {
      const items = groups[key];
      const first = items[0];

      // Track daily utilization across 365 days of 2026 to find conflict overlaps
      const dailyUsage = new Uint16Array(366);

      items.forEach(alloc => {
        const startIdx = Math.max(0, Math.floor((new Date(alloc.startDate).getTime() - yearStart) / 86400000));
        const endIdx = Math.min(364, Math.floor((new Date(alloc.endDate).getTime() - yearStart) / 86400000));
        
        for (let i = startIdx; i <= endIdx; i++) {
          dailyUsage[i] += alloc.allocationPercent;
        }
      });

      // Find periods exceeding 100%
      const conflicts: { startDate: string; endDate: string; totalPercent: number }[] = [];
      let inConflict = false;
      let conflictStartIdx = -1;
      let maxPercentInConflict = 0;

      for (let i = 0; i <= 365; i++) {
        const usage = i < 365 ? dailyUsage[i] : 0;
        const isCurrentlyOver = usage > 100;

        if (isCurrentlyOver && !inConflict) {
          inConflict = true;
          conflictStartIdx = i;
          maxPercentInConflict = usage;
        } else if (!isCurrentlyOver && inConflict) {
          const startD = new Date(yearStart + conflictStartIdx * 86400000);
          const endD = new Date(yearStart + (i - 1) * 86400000);
          conflicts.push({
            startDate: startD.toISOString().substring(0, 10),
            endDate: endD.toISOString().substring(0, 10),
            totalPercent: maxPercentInConflict
          });
          inConflict = false;
          maxPercentInConflict = 0;
        } else if (isCurrentlyOver && inConflict) {
          if (usage > maxPercentInConflict) maxPercentInConflict = usage;
        }
      }

      list.push({
        nameAr: first.resourceNameAr,
        nameEn: first.resourceNameEn,
        type: first.resourceType,
        allocations: items,
        conflicts
      });
    });

    return list;
  }, [allocations, selectedProjectId]);

  // Toggle Project Expand
  const toggleProject = (projId: string) => {
    setExpandedProjects(prev => {
      const next = { ...prev, [projId]: !prev[projId] };
      setTimeout(() => setRedrawCounter(p => p + 1), 100);
      return next;
    });
  };

  // Predecessor Option list for Editor
  const predecessorOptions = useMemo(() => {
    if (!editingPhase) return [];
    return phases.filter(ph => ph.projectId === editingPhase.projectId && ph.id !== editingPhase.id);
  }, [phases, editingPhase]);

  // Open phase editor
  const handleOpenEditor = (phase: GanttPhase) => {
    setEditingPhase({ ...phase });
    setAddingToProjectId(null);
    setIsEditorOpen(true);
  };

  // Create new blank phase
  const handleAddNewPhase = (projectId: string) => {
    const projPhases = phases.filter(p => p.projectId === projectId);
    const lastPhase = projPhases[projPhases.length - 1];
    
    let defaultStart = '2026-06-01';
    let defaultEnd = '2026-07-01';

    if (lastPhase) {
      try {
        const lastEnd = new Date(lastPhase.endDate);
        const newStart = new Date(lastEnd.getTime() + 86400000);
        const newEnd = new Date(newStart.getTime() + 30 * 86400000);
        defaultStart = newStart.toISOString().substring(0, 10);
        defaultEnd = newEnd.toISOString().substring(0, 10);
      } catch (e) {}
    }

    const newPhase: GanttPhase = {
      id: `phase-${projectId}-${Date.now()}`,
      projectId,
      nameAr: 'كفالة أيتام جارية مستهدفة',
      nameEn: 'New Project Specific Phase',
      startDate: defaultStart,
      endDate: defaultEnd,
      progressPercent: 0,
      dependsOnPhaseId: lastPhase?.id || undefined,
      statusCode: 'planning'
    };

    setEditingPhase(newPhase);
    setAddingToProjectId(projectId);
    setIsEditorOpen(true);
  };

  // Save changes from Phase Editor
  const handleSavePhase = () => {
    if (!editingPhase) return;
    
    triggerHaptic('success');
    if (addingToProjectId) {
      savePhases([...phases, editingPhase]);
    } else {
      savePhases(phases.map(ph => ph.id === editingPhase.id ? editingPhase : ph));
    }
    setIsEditorOpen(false);
    setEditingPhase(null);
  };

  // Delete phase
  const handleDeletePhase = (id: string) => {
    const confirmMsg = isRtl 
      ? 'هل أنت متأكد من حذف هذه المرحلة والروابط التابعة لها؟'
      : 'Are you sure you want to delete this phase? Dependent connections will be unlinked.';
    if (!window.confirm(confirmMsg)) return;

    triggerHaptic('medium');
    const updated = phases
      .filter(ph => ph.id !== id)
      .map(ph => ph.dependsOnPhaseId === id ? { ...ph, dependsOnPhaseId: undefined } : ph);
    
    savePhases(updated);
    setIsEditorOpen(false);
    setEditingPhase(null);
  };

  // Open resource editor
  const handleOpenAllocEditor = (alloc: ResourceAllocation) => {
    setEditingAllocation({ ...alloc });
    setIsAddingAlloc(false);
    setIsAllocEditorOpen(true);
  };

  // Add new resource assignment
  const handleAddNewAllocation = () => {
    if (projects.length === 0) return;
    const newAlloc: ResourceAllocation = {
      id: `alloc-${Date.now()}`,
      resourceNameAr: isRtl ? 'حفار بئر ميداني جديد' : 'New WASH Drilling Rig',
      resourceNameEn: isRtl ? 'New WASH Drilling Rig' : 'New WASH Drilling Rig',
      resourceType: 'EQUIPMENT',
      projectId: projects[0].id,
      projectNameAr: projects[0].name_ar,
      projectNameEn: projects[0].name_en || projects[0].name_ar,
      startDate: '2026-06-01',
      endDate: '2026-08-31',
      allocationPercent: 100,
      assignedRoleAr: 'حفر وتدشين البئر السطحي',
      assignedRoleEn: 'Drilling & installation of surface well network'
    };
    setEditingAllocation(newAlloc);
    setIsAddingAlloc(true);
    setIsAllocEditorOpen(true);
  };

  // Save resource allocation
  const handleSaveAllocation = () => {
    if (!editingAllocation) return;

    // Find full project details
    const selectedProj = projects.find(p => p.id === editingAllocation.projectId);
    if (selectedProj) {
      editingAllocation.projectNameAr = selectedProj.name_ar;
      editingAllocation.projectNameEn = selectedProj.name_en || selectedProj.name_ar;
    }

    triggerHaptic('success');
    if (isAddingAlloc) {
      saveAllocations([...allocations, editingAllocation]);
    } else {
      saveAllocations(allocations.map(a => a.id === editingAllocation.id ? editingAllocation : a));
    }
    setIsAllocEditorOpen(false);
    setEditingAllocation(null);
  };

  // Delete resource allocation
  const handleDeleteAllocation = (id: string) => {
    const confirmMsg = isRtl
      ? 'هل أنت متأكد من إلغاء تخصيص هذا المورد الإنساني/المادي؟'
      : 'Are you sure you want to remove this resource allocation?';
    if (!window.confirm(confirmMsg)) return;

    triggerHaptic('medium');
    saveAllocations(allocations.filter(a => a.id !== id));
    setIsAllocEditorOpen(false);
    setEditingAllocation(null);
  };

  // Redraw dependencies on render
  useEffect(() => {
    const timer = setTimeout(() => {
      setRedrawCounter(prev => prev + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [phases, zoomLevel, expandedProjects, selectedProjectId, projects, allocations]);

  // SVG Dependency Paths Calculation
  const dependencyLines = useMemo(() => {
    if (!chartContainerRef.current) return [];

    const paths: { d: string; id: string; status: string }[] = [];
    const containerRect = chartContainerRef.current.getBoundingClientRect();

    phases.forEach(ph => {
      if (ph.dependsOnPhaseId) {
        const predecessor = phases.find(p => p.id === ph.dependsOnPhaseId);
        if (!predecessor) return;

        if (!expandedProjects[ph.projectId]) return;

        const fromEl = document.getElementById(`gantt-phase-bar-${predecessor.id}`);
        const toEl = document.getElementById(`gantt-phase-bar-${ph.id}`);

        if (fromEl && toEl) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          const fromX = (isRtl 
            ? fromRect.left - containerRect.left + chartContainerRef.current.scrollLeft
            : fromRect.right - containerRect.left + chartContainerRef.current.scrollLeft);
          const fromY = fromRect.top - containerRect.top + fromRect.height / 2 + chartContainerRef.current.scrollTop;

          const toX = (isRtl
            ? toRect.right - containerRect.left + chartContainerRef.current.scrollLeft
            : toRect.left - containerRect.left + chartContainerRef.current.scrollLeft);
          const toY = toRect.top - containerRect.top + toRect.height / 2 + chartContainerRef.current.scrollTop;

          const controlOffset = 24;
          const cp1X = fromX + (isRtl ? -controlOffset : controlOffset);
          const cp1Y = fromY;
          const cp2X = toX + (isRtl ? controlOffset : -controlOffset);
          const cp2Y = toY;

          const d = `M ${fromX} ${fromY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${toX} ${toY}`;
          paths.push({ 
            d, 
            id: `${predecessor.id}-to-${ph.id}`,
            status: ph.statusCode
          });
        }
      }
    });

    return paths;
  }, [phases, expandedProjects, redrawCounter, isRtl, selectedProjectId]);

  return (
    <div id="nexora-project-gantt-view" className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5 space-y-5">
      
      {/* 1. TOP CONTROL BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white rounded-xl shadow-sm shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              {isRtl ? 'مخطط غانت الشامل للمشاريع والاعتمادات والكوادر ⚙️' : 'Project Gantt & Resource Allocation OS ⚙️'}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
              {isRtl 
                ? 'مزامنة دقيقة للمراحل الميدانية والاعتمادات التبادلية مع توفر الطواقم والمعدات المادية لتجنب التعارض'
                : 'Synchronize field stages with human & physical asset allocation to eliminate scheduling conflicts'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Project filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold whitespace-nowrap">
              {isRtl ? 'تصفية المشروع:' : 'Project:'}
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setRedrawCounter(prev => prev + 1);
              }}
              className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg py-1.5 px-2.5 text-[11px] font-bold outline-none"
            >
              <option value="all">{isRtl ? 'جميع المشاريع الميدانية' : 'All Projects'}</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {isRtl ? p.name_ar : (p.name_en || p.name_ar)}
                </option>
              ))}
            </select>
          </div>

          {/* Zoom Level Switcher */}
          <div className="bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center gap-1 shrink-0">
            {[
              { id: 'days', ar: 'عشرية', en: '10-Days' },
              { id: 'weeks', ar: 'أسبوعي', en: 'Bi-Weekly' },
              { id: 'months', ar: 'أيام', en: 'Monthly' }
            ].map(z => (
              <button
                key={z.id}
                onClick={() => {
                  triggerHaptic('light');
                  setZoomLevel(z.id as any);
                  setRedrawCounter(prev => prev + 1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  zoomLevel === z.id 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                {isRtl ? z.ar : z.en}
              </button>
            ))}
          </div>

          {/* Sync Trigger */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              setRedrawCounter(prev => prev + 1);
            }}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title={isRtl ? 'تحديث المسارات والشبكة' : 'Refresh dependency lines'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. CHART AREA WITH HORIZONTAL SCROLL CONTAINER */}
      <div className="relative border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-zinc-900/10">
        
        <div 
          ref={chartContainerRef}
          onScroll={() => setRedrawCounter(prev => prev + 1)}
          className="overflow-x-auto overflow-y-visible relative min-h-[460px]"
        >
          {/* Dynamic SVG layer for drawing dependency lines */}
          <svg 
            className="absolute inset-0 pointer-events-none z-10 w-full h-full"
            style={{ minWidth: `${timeColumns.length * (zoomLevel === 'days' ? 120 : zoomLevel === 'weeks' ? 150 : 180)}px` }}
          >
            <defs>
              <marker
                id="arrow-gantt"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706" />
              </marker>
              <marker
                id="arrow-gantt-completed"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
            </defs>

            {dependencyLines.map(line => (
              <path
                key={line.id}
                d={line.d}
                fill="none"
                stroke={line.status === 'completed' ? '#10b981' : '#d97706'}
                strokeWidth="1.75"
                strokeDasharray={line.status === 'planning' ? '4,4' : 'none'}
                markerEnd={line.status === 'completed' ? 'url(#arrow-gantt-completed)' : 'url(#arrow-gantt)'}
                className="transition-all hover:stroke-amber-500 hover:stroke-2"
              />
            ))}
          </svg>

          {/* Timeline Grid Table */}
          <div 
            className="flex flex-col relative"
            style={{ minWidth: `${timeColumns.length * (zoomLevel === 'days' ? 120 : zoomLevel === 'weeks' ? 150 : 180)}px` }}
          >
            {/* Grid Columns Header */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 sticky top-0 z-20">
              {/* Sidebar Spacer */}
              <div className="w-[280px] shrink-0 p-3 font-black text-[10px] text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 sticky left-0 z-30">
                {isRtl ? 'المشاريع الميدانية والكوادر والمعدات' : 'Project Phases & Human/Asset Allocation'}
              </div>
              
              {/* Columns Header list */}
              <div className="flex flex-1">
                {timeColumns.map((col, index) => (
                  <div 
                    key={index} 
                    className="flex-1 min-w-[120px] text-center p-3 text-[10px] font-black border-r border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex flex-col justify-center gap-0.5"
                  >
                    <span>{isRtl ? col.labelAr : col.labelEn}</span>
                    <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-mono">2026</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical grid background lines */}
            <div className="absolute inset-0 top-[40px] flex pointer-events-none z-0">
              <div className="w-[280px] shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-slate-50/10 dark:bg-zinc-900/5 sticky left-0 z-10" />
              <div className="flex flex-1">
                {timeColumns.map((_, index) => (
                  <div key={index} className="flex-1 border-r border-slate-100 dark:border-zinc-900/40 h-full" />
                ))}
              </div>
            </div>

            {/* Timeline Rows list */}
            <div className="flex flex-col relative z-10 divide-y divide-slate-100 dark:divide-zinc-900">
              
              {/* 1. PROJECT PHASES RENDER */}
              {filteredProjects.map(proj => {
                const isExpanded = expandedProjects[proj.id];
                const projPhases = phases.filter(ph => ph.projectId === proj.id);
                const projPos = getDatePlacement(proj.start_date, proj.end_date);

                return (
                  <div key={proj.id} className="flex flex-col">
                    
                    {/* PROJECT MAIN ROW */}
                    <div className="flex items-stretch hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 min-h-[52px] group">
                      
                      {/* Left Sticky Project Info */}
                      <div className="w-[280px] shrink-0 p-3 flex items-center justify-between gap-2 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky left-0 z-20 shadow-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <button
                            onClick={() => toggleProject(proj.id)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-500 transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />}
                          </button>
                          <div className="overflow-hidden">
                            <h4 className="text-[11px] font-black text-slate-800 dark:text-zinc-200 truncate leading-relaxed">
                              {isRtl ? proj.name_ar : (proj.name_en || proj.name_ar)}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-bold font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded px-1">
                                {proj.code}
                              </span>
                              <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-mono">
                                {proj.start_date?.substring(0, 10)} / {proj.end_date?.substring(0, 10)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Add Phase trigger */}
                        {isExpanded && (
                          <button
                            onClick={() => handleAddNewPhase(proj.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                            title={isRtl ? 'إضافة مرحلة جديدة' : 'Add New Phase'}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Right Timeline Area (showing overall Project Span) */}
                      <div className="flex-1 relative flex items-center p-3">
                        <div 
                          className="absolute h-5 bg-slate-200/60 dark:bg-zinc-800/40 rounded-lg flex items-center px-2 border border-slate-300/40 dark:border-zinc-700/40 pointer-events-none"
                          style={{
                            left: `${isRtl ? 'auto' : projPos.left}%`,
                            right: `${isRtl ? projPos.left : 'auto'}%`,
                            width: `${projPos.width}%`
                          }}
                        >
                          <span className="text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 truncate">
                            {isRtl ? 'الجدول الزمني العام للمشروع' : 'Project Baseline Timeline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* COLLAPSIBLE PHASES LIST */}
                    <AnimatePresence>
                      {isExpanded && (
                        <div className="flex flex-col bg-slate-50/20 dark:bg-zinc-950/20">
                          {projPhases.length === 0 ? (
                            <div className="flex items-stretch min-h-[44px]">
                              <div className="w-[280px] shrink-0 p-3 pl-8 text-[10px] text-slate-400 dark:text-zinc-500 italic sticky left-0 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800">
                                {isRtl ? 'لا يوجد مراحل مضافة بعد' : 'No phases mapped yet.'}
                              </div>
                              <div className="flex-1" />
                            </div>
                          ) : (
                            projPhases.map(phase => {
                              const phasePos = getDatePlacement(phase.startDate, phase.endDate);
                              const linkedPredecessor = phases.find(p => p.id === phase.dependsOnPhaseId);

                              let barBg = 'bg-emerald-500';
                              let borderCol = 'border-emerald-600/40';
                              if (phase.statusCode === 'planning') {
                                barBg = 'bg-slate-400 dark:bg-zinc-600';
                                borderCol = 'border-slate-500/30';
                              } else if (phase.statusCode === 'delayed') {
                                barBg = 'bg-rose-500';
                                borderCol = 'border-rose-600/40';
                              } else if (phase.statusCode === 'active') {
                                barBg = 'bg-amber-500';
                                borderCol = 'border-amber-600/40';
                              }

                              return (
                                <div key={phase.id} className="flex items-stretch min-h-[48px] hover:bg-slate-100/30 dark:hover:bg-zinc-900/5 transition-colors group">
                                  
                                  {/* Sticky Phase Name Label */}
                                  <div className="w-[280px] shrink-0 p-3 pl-8 flex items-center justify-between gap-2 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 sticky left-0 z-20 shadow-xs">
                                    <div className="flex flex-col overflow-hidden">
                                      <span className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 leading-snug truncate">
                                        {isRtl ? phase.nameAr : phase.nameEn}
                                      </span>
                                      {linkedPredecessor && (
                                        <span className="text-[8px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                                          <Link2 className="w-2.5 h-2.5" />
                                          <span>
                                            {isRtl 
                                              ? `يعتمد على: ${linkedPredecessor.nameAr.substring(0, 16)}...` 
                                              : `Predecessor: ${linkedPredecessor.nameEn.substring(0, 16)}...`}
                                          </span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Action button */}
                                    <button
                                      onClick={() => handleOpenEditor(phase)}
                                      className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Timeline visual bar block */}
                                  <div className="flex-1 relative flex items-center p-2.5">
                                    <div 
                                      id={`gantt-phase-bar-${phase.id}`}
                                      onClick={() => handleOpenEditor(phase)}
                                      className={`absolute h-7 rounded-lg border flex items-center justify-between p-1 px-2.5 cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all overflow-hidden shadow-xs ${barBg} ${borderCol} text-white`}
                                      style={{
                                        left: `${isRtl ? 'auto' : phasePos.left}%`,
                                        right: `${isRtl ? phasePos.left : 'auto'}%`,
                                        width: `${phasePos.width}%`
                                      }}
                                    >
                                      <div 
                                        className="absolute inset-y-0 left-0 bg-black/15 pointer-events-none"
                                        style={isRtl ? { right: 0, left: 'auto', width: `${phase.progressPercent}%` } : { width: `${phase.progressPercent}%` }}
                                      />

                                      <span className="text-[9px] font-black tracking-wide truncate z-10 leading-none">
                                        {isRtl ? phase.nameAr : phase.nameEn}
                                      </span>
                                      <span className="text-[8.5px] font-black bg-black/25 px-1 py-0.5 rounded text-white z-10 font-mono leading-none">
                                        {phase.progressPercent}%
                                      </span>
                                    </div>
                                  </div>

                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </AnimatePresence>

                  </div>
                );
              })}

              {/* --- RESOURCE ALLOCATIONS SEPARATOR ROW --- */}
              <div className="flex border-t-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/90 dark:bg-zinc-900/90 min-h-[44px]">
                <div className="w-[280px] shrink-0 p-3 font-black text-[11px] text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 border-r border-slate-200 dark:border-zinc-800 sticky left-0 z-30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isRtl ? 'توزيع الموارد والكوادر الميدانية' : 'Resource Allocation OS'}</span>
                  </div>
                  <button
                    onClick={handleAddNewAllocation}
                    className="p-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all flex items-center gap-1 text-[9px] font-black cursor-pointer shadow-sm"
                    title={isRtl ? 'إسناد مورد جديد' : 'Assign New Resource'}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isRtl ? 'إسناد' : 'Assign'}</span>
                  </button>
                </div>
                <div className="flex-1 flex items-center px-4">
                  <span className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {isRtl 
                      ? 'مزامنة أفقية للكوادر والمعدات وتتبع فترات توافرها وتنبيه فوري لتعارض الحجز (تجاوز 100٪)' 
                      : 'Horizontal tracker for specialists & assets with automated visual overlap/conflict warnings (>100% allocation)'}
                  </span>
                </div>
              </div>

              {/* 2. RESOURCE ALLOCATION TIMELINE ROWS */}
              {groupedResources.length === 0 ? (
                <div className="flex items-stretch min-h-[60px] bg-white dark:bg-zinc-950">
                  <div className="w-[280px] shrink-0 p-4 text-[10px] text-slate-400 dark:text-zinc-500 italic sticky left-0 border-r border-slate-200 dark:border-zinc-800">
                    {isRtl ? 'لا يوجد كوادر أو معدات مسندة حالياً' : 'No field resources assigned.'}
                  </div>
                  <div className="flex-1 bg-slate-50/10 dark:bg-zinc-900/5" />
                </div>
              ) : (
                groupedResources.map((grouped, rIndex) => {
                  const hasConflict = grouped.conflicts.length > 0;

                  return (
                    <div key={rIndex} className="flex items-stretch min-h-[64px] hover:bg-slate-100/20 dark:hover:bg-zinc-900/5 transition-colors group relative bg-white dark:bg-zinc-950">
                      
                      {/* Sticky Resource Details Column */}
                      <div className="w-[280px] shrink-0 p-3 flex flex-col justify-center border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky left-0 z-20 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          {/* Resource Type Icon Badge */}
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            grouped.type === 'HUMAN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            grouped.type === 'VEHICLE' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' :
                            grouped.type === 'EQUIPMENT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' :
                            'bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-400'
                          }`}>
                            {grouped.type === 'HUMAN' ? <UserCheck className="w-3.5 h-3.5" /> :
                             grouped.type === 'VEHICLE' ? <Truck className="w-3.5 h-3.5" /> :
                             grouped.type === 'EQUIPMENT' ? <Wrench className="w-3.5 h-3.5" /> :
                             <Briefcase className="w-3.5 h-3.5" />}
                          </div>

                          <div className="overflow-hidden">
                            <h4 className="text-[11px] font-black text-slate-800 dark:text-zinc-200 truncate leading-tight">
                              {isRtl ? grouped.nameAr : grouped.nameEn}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[8px] font-bold uppercase px-1 rounded bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400">
                                {grouped.type === 'HUMAN' ? (isRtl ? 'بشري' : 'Human') :
                                 grouped.type === 'VEHICLE' ? (isRtl ? 'مركبة' : 'Vehicle') :
                                 grouped.type === 'EQUIPMENT' ? (isRtl ? 'الأصل' : 'Asset') :
                                 (isRtl ? 'آخر' : 'Other')}
                              </span>
                              
                              {/* Total Allocations Counter */}
                              <span className="text-[8.5px] font-mono text-slate-400">
                                {isRtl 
                                  ? `${grouped.allocations.length} إسناد` 
                                  : `${grouped.allocations.length} maps`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Overlap / Over-allocation Danger Alert strip */}
                        {hasConflict && (
                          <div className="mt-1.5 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/40 dark:border-rose-900/30 rounded-md text-[8.5px] text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1 animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>
                              {isRtl 
                                ? `تعارض: حجز زائد (${grouped.conflicts[0].totalPercent}%)` 
                                : `Conflict: Over-allocated (${grouped.conflicts[0].totalPercent}%)`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Timeline Grid Area (Draw Allocation pills and Red Conflict segments) */}
                      <div className="flex-1 relative flex items-center min-h-[64px] p-2">
                        
                        {/* 1. Backdrop Conflict Warning overlays (drawn behind pills) */}
                        {grouped.conflicts.map((conf, cIdx) => {
                          const confPos = getDatePlacement(conf.startDate, conf.endDate);
                          return (
                            <div
                              key={cIdx}
                              className="absolute inset-y-0 bg-red-500/10 dark:bg-red-500/5 border-l border-r border-red-500/20 z-0 flex items-center justify-center overflow-hidden"
                              style={{
                                left: `${isRtl ? 'auto' : confPos.left}%`,
                                right: `${isRtl ? confPos.left : 'auto'}%`,
                                width: `${confPos.width}%`
                              }}
                              title={isRtl ? `فترة تعارض الحجز الميداني: ${conf.startDate} إلى ${conf.endDate}` : `Conflict Segment: ${conf.startDate} to ${conf.endDate}`}
                            >
                              <div className="text-[7.5px] font-black text-rose-600/50 dark:text-rose-400/40 uppercase tracking-widest whitespace-nowrap rotate-12">
                                {isRtl ? 'تعارض حجز ⚠️' : 'Overload ⚠️'}
                              </div>
                            </div>
                          );
                        })}

                        {/* 2. Allocation Pills (stacked slightly or styled clearly) */}
                        {grouped.allocations.map(alloc => {
                          const allocPos = getDatePlacement(alloc.startDate, alloc.endDate);

                          // Style color schemes based on resource type
                          let barColor = 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600/30';
                          if (grouped.type === 'VEHICLE') {
                            barColor = 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600/30';
                          } else if (grouped.type === 'EQUIPMENT') {
                            barColor = 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600/30';
                          } else if (grouped.type === 'OTHER') {
                            barColor = 'bg-slate-500 hover:bg-slate-600 text-white border-slate-600/30';
                          }

                          return (
                            <div
                              key={alloc.id}
                              onClick={() => handleOpenAllocEditor(alloc)}
                              className={`absolute h-9 rounded-xl border p-1 px-3 flex flex-col justify-center cursor-pointer transition-all active:scale-[0.98] z-10 shadow-xs group/pill overflow-hidden ${barColor}`}
                              style={{
                                left: `${isRtl ? 'auto' : allocPos.left}%`,
                                right: `${isRtl ? allocPos.left : 'auto'}%`,
                                width: `${allocPos.width}%`
                              }}
                              title={isRtl 
                                ? `${alloc.assignedRoleAr} (${alloc.startDate} ~ ${alloc.endDate})` 
                                : `${alloc.assignedRoleEn} (${alloc.startDate} ~ ${alloc.endDate})`}
                            >
                              {/* Inside progress rating indicator */}
                              <div 
                                className="absolute inset-y-0 left-0 bg-black/10 pointer-events-none"
                                style={isRtl ? { right: 0, left: 'auto', width: `${alloc.allocationPercent}%` } : { width: `${alloc.allocationPercent}%` }}
                              />

                              <div className="flex items-center justify-between gap-1.5 relative z-10">
                                <span className="text-[9.5px] font-black truncate leading-none">
                                  {isRtl ? alloc.projectNameAr : alloc.projectNameEn}
                                </span>
                                <span className="text-[8px] font-mono font-black bg-black/25 px-1 rounded leading-none">
                                  {alloc.allocationPercent}%
                                </span>
                              </div>
                              <span className="text-[7.5px] font-semibold opacity-90 truncate relative z-10 mt-0.5 leading-none">
                                {isRtl ? alloc.assignedRoleAr : alloc.assignedRoleEn}
                              </span>
                            </div>
                          );
                        })}

                      </div>

                    </div>
                  );
                })
              )}

            </div>

          </div>
        </div>

      </div>

      {/* Gantt Legend */}
      <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/80 dark:border-zinc-800 flex flex-wrap gap-4 items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-extrabold text-slate-800 dark:text-zinc-300">
            {isRtl ? 'رموز المخطط والكوادر:' : 'Gantt & Resources Guide:'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[8px] font-bold font-mono">H</span>
            <span>{isRtl ? 'كادر بشري' : 'Human Specialist'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500 border border-sky-600/30" />
            <span>{isRtl ? 'مورد نقل/مركبات' : 'Vehicles'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-500 border border-purple-600/30" />
            <span>{isRtl ? 'أصول/معدات ثقيلة' : 'Heavy Assets'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-500/25 border border-rose-500 animate-pulse" />
            <span className="font-bold text-rose-600 dark:text-rose-400">{isRtl ? 'تعارض حجز الكادر الميداني' : 'Scheduling Conflict Warning'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-slate-200 dark:border-zinc-800 text-[9.5px]">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {isRtl 
              ? 'اضغط على أي تظليل أحمر أو بطاقة إسناد لإعادة توزيع المورد وحل التداخلات.' 
              : 'Click any red warning segment or allocation card to adjust dates and resolve overlaps.'}
          </span>
        </div>
      </div>


      {/* 3. INTERACTIVE PHASE EDITOR DRAWER / MODAL */}
      <AnimatePresence>
        {isEditorOpen && editingPhase && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {addingToProjectId 
                      ? (isRtl ? 'إضافة مرحلة جديدة لمخطط غانت' : 'Add New Gantt Phase') 
                      : (isRtl ? 'تعديل بيانات المرحلة الميدانية' : 'Configure Gantt Phase')}
                  </h4>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                    {isRtl ? 'اسم المرحلة بالعربية *' : 'Phase Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPhase.nameAr}
                    onChange={(e) => setEditingPhase({ ...editingPhase, nameAr: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-extrabold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                    {isRtl ? 'اسم المرحلة بالإنجليزية *' : 'Phase Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPhase.nameEn}
                    onChange={(e) => setEditingPhase({ ...editingPhase, nameEn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-extrabold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                      {isRtl ? 'تاريخ البدء *' : 'Start Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={editingPhase.startDate}
                      onChange={(e) => setEditingPhase({ ...editingPhase, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                      {isRtl ? 'تاريخ الانتهاء *' : 'End Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={editingPhase.endDate}
                      onChange={(e) => setEditingPhase({ ...editingPhase, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400">
                      {isRtl ? 'نسبة الإنجاز الفرعية للمرحلة' : 'Stage Sub-Progress Rate'}
                    </label>
                    <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {editingPhase.progressPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editingPhase.progressPercent}
                    onChange={(e) => setEditingPhase({ ...editingPhase, progressPercent: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                    {isRtl ? 'حالة المرحلة الحالية' : 'Stage Baseline Status'}
                  </label>
                  <select
                    value={editingPhase.statusCode}
                    onChange={(e) => setEditingPhase({ ...editingPhase, statusCode: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  >
                    <option value="planning">{isRtl ? 'قيد التخطيط والتنظير (Planning)' : 'Planning Stage'}</option>
                    <option value="active">{isRtl ? 'نشط تشغيلياً بالميدان (Active)' : 'Active Stage'}</option>
                    <option value="completed">{isRtl ? 'مكتملة بالكامل ومصدقة (Completed)' : 'Completed Stage'}</option>
                    <option value="delayed">{isRtl ? 'متأخرة عن الجدول الأساسي (Delayed)' : 'Delayed Stage'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                    {isRtl ? 'الاعتمادية والارتباط التسلسلي (Depends On Predecessor)' : 'Sequential Predecessor Relationship'}
                  </label>
                  <select
                    value={editingPhase.dependsOnPhaseId || ''}
                    onChange={(e) => setEditingPhase({ ...editingPhase, dependsOnPhaseId: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    <option value="">{isRtl ? 'بدون روابط اعتماد متسلسلة' : 'No predecessor (Independent)'}</option>
                    {predecessorOptions.map(ph => (
                      <option key={ph.id} value={ph.id}>
                        {isRtl ? ph.nameAr : ph.nameEn}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 leading-relaxed font-semibold">
                    {isRtl 
                      ? 'سيتم رسم سهم تتبع من نهاية المرحلة السابقة إلى بداية هذه المرحلة لتوثيق التسلسل.' 
                      : 'An anchor arrow will draw visually connecting the predecessor end-node to this start-node.'}
                  </p>
                </div>
              </div>

              {/* Action Strip */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-900/10">
                {!addingToProjectId ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePhase(editingPhase.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-xl text-xs font-black transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'حذف المرحلة' : 'Delete Stage'}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePhase}
                    className="px-4 py-2 bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
                  >
                    {isRtl ? 'حفظ التغييرات 💾' : 'Save Changes 💾'}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. RESOURCE ALLOCATION INTERACTIVE EDITOR MODAL */}
      <AnimatePresence>
        {isAllocEditorOpen && editingAllocation && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {isAddingAlloc 
                      ? (isRtl ? 'إسناد مورد ميداني جديد للمشروع' : 'New Resource Assignment') 
                      : (isRtl ? 'تعديل حجز المورد الميداني' : 'Configure Resource Assignment')}
                  </h4>
                </div>
                <button
                  onClick={() => setIsAllocEditorOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                
                {/* Resource Name (Arabic) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                    {isRtl ? 'اسم المورد بالكامل (العربية) *' : 'Resource Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAllocation.resourceNameAr}
                    onChange={(e) => setEditingAllocation({ ...editingAllocation, resourceNameAr: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-extrabold"
                  />
                </div>

                {/* Resource Name (English) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                    {isRtl ? 'اسم المورد بالكامل (الإنجليزية) *' : 'Resource Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAllocation.resourceNameEn}
                    onChange={(e) => setEditingAllocation({ ...editingAllocation, resourceNameEn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-extrabold"
                  />
                </div>

                {/* Resource Type & Project Map */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                      {isRtl ? 'نوع المورد الميداني *' : 'Resource Type *'}
                    </label>
                    <select
                      value={editingAllocation.resourceType}
                      onChange={(e) => setEditingAllocation({ ...editingAllocation, resourceType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                    >
                      <option value="HUMAN">{isRtl ? 'بشري / متخصص' : 'Human / personnel'}</option>
                      <option value="EQUIPMENT">{isRtl ? 'معدة ثقيلة / أصل مادي' : 'Heavy Equipment'}</option>
                      <option value="VEHICLE">{isRtl ? 'شاحنة / مركبة ميدانية' : 'Vehicle / transport'}</option>
                      <option value="OTHER">{isRtl ? 'آخر / لوجستي' : 'Other'}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                      {isRtl ? 'المشروع المرتبط به *' : 'Assigned Project *'}
                    </label>
                    <select
                      value={editingAllocation.projectId}
                      onChange={(e) => setEditingAllocation({ ...editingAllocation, projectId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {isRtl ? p.name_ar : (p.name_en || p.name_ar)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dates selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                      {isRtl ? 'تاريخ بدء الإسناد *' : 'Allocation Start *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={editingAllocation.startDate}
                      onChange={(e) => setEditingAllocation({ ...editingAllocation, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                      {isRtl ? 'تاريخ انتهاء الإسناد *' : 'Allocation End *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={editingAllocation.endDate}
                      onChange={(e) => setEditingAllocation({ ...editingAllocation, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Allocation Rate percentage slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400">
                      {isRtl ? 'نسبة الاستخدام / التخصيص الميداني' : 'Utilization / Allocation Rate'}
                    </label>
                    <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {editingAllocation.allocationPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={editingAllocation.allocationPercent}
                    onChange={(e) => setEditingAllocation({ ...editingAllocation, allocationPercent: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 leading-none">
                    {isRtl 
                      ? 'يمكنك تقسيم المورد (مثلاً 50% لمشروعين مختلفين) لتجنب الإرهاق والتعارض.' 
                      : 'Split resources (e.g. 50% across two projects) to distribute capacity safely.'}
                  </p>
                </div>

                {/* Role / Duty (Arabic) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                    {isRtl ? 'الدور المسند والواجب الميداني بالعربية' : 'Assigned Role & Duties (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={editingAllocation.assignedRoleAr}
                    onChange={(e) => setEditingAllocation({ ...editingAllocation, assignedRoleAr: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                </div>

                {/* Role / Duty (English) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 block">
                    {isRtl ? 'الدور المسند والواجب الميداني بالإنجليزية' : 'Assigned Role & Duties (English)'}
                  </label>
                  <input
                    type="text"
                    value={editingAllocation.assignedRoleEn}
                    onChange={(e) => setEditingAllocation({ ...editingAllocation, assignedRoleEn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                </div>

              </div>

              {/* Action Strip */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-900/10">
                {!isAddingAlloc ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteAllocation(editingAllocation.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-xl text-xs font-black transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'إلغاء الإسناد' : 'Deallocate'}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAllocEditorOpen(false)}
                    className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAllocation}
                    className="px-4 py-2 bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
                  >
                    {isRtl ? 'إسناد وحفظ 💾' : 'Assign & Save 💾'}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
