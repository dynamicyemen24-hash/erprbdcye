import React, { useState, useMemo, useEffect } from 'react';
import { designTokens } from '../lib/designTokens';
import { 
  Calendar, 
  Users, 
  User, 
  Truck, 
  Wrench, 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Cpu, 
  X, 
  Check, 
  UserPlus, 
  Settings,
  HelpCircle,
  Sliders,
  UserCheck,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { Project, User as UserType } from '../types';
import { ModuleShell } from './enterprise/ModuleShell';
import { generateShortId } from '../lib/idGenerator';

interface Allocation {
  id: string;
  projectId: string;
  projectNameAr: string;
  projectNameEn: string;
  resourceId: string;
  resourceNameAr: string;
  resourceNameEn: string;
  resourceType: 'STAFF' | 'ASSET';
  resourceRoleAr: string;
  resourceRoleEn: string;
  startDate: string;
  endDate: string;
  allocationPercent: number; // e.g. 50%, 100%
  status: 'active' | 'completed' | 'scheduled';
}

export interface ReallocationSuggestion {
  id: string;
  projectId: string;
  projectNameAr: string;
  projectNameEn: string;
  allocIdToReduce: string;
  sourceResourceId: string;
  sourceResourceNameAr: string;
  sourceResourceNameEn: string;
  sourceCurrentLoad: number;
  sourceNewLoad: number;
  targetResourceId: string;
  targetResourceNameAr: string;
  targetResourceNameEn: string;
  targetCurrentLoad: number;
  targetNewLoad: number;
  shiftPercent: number;
  roleAr: string;
  roleEn: string;
  reasonAr: string;
  reasonEn: string;
  impactAr: string;
  impactEn: string;
}

interface ResourceAllocationViewProps {
  projects: Project[];
  users: UserType[];
  lang: 'ar' | 'en';
  onRefresh?: () => void;
}

export default function ResourceAllocationView({ projects = [], users = [], lang, onRefresh }: ResourceAllocationViewProps) {
  const isRtl = lang === 'ar';

  // 1. LIVE allocations from the resource_allocations table (E2E — no seeded demo rows)
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [allocLoading, setAllocLoading] = useState(true);
  const [allocFetchError, setAllocFetchError] = useState(false);

  const fetchAllocations = async () => {
    setAllocLoading(true);
    setAllocFetchError(false);
    try {
      const token = localStorage.getItem('rbd_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/tables/resource_allocations', { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rows = (data.data || data || []) as any[];
      const mapped: Allocation[] = rows
        .filter(r => !r.deleted_at)
        .map((r, idx) => {
          const proj = projects.find(p => p.id === r.project_id);
          return {
            id: r.id,
            projectId: r.project_id || '',
            projectNameAr: proj?.name_ar || r.resource_name_ar || '',
            projectNameEn: proj?.name_en || r.resource_name_en || '',
            resourceId: r.resource_id,
            resourceNameAr: r.resource_name_ar || '',
            resourceNameEn: r.resource_name_en || '',
            resourceType: (r.resource_type === 'ASSET' ? 'ASSET' : 'STAFF') as 'STAFF' | 'ASSET',
            resourceRoleAr: r.role_ar || '',
            resourceRoleEn: r.role_en || '',
            startDate: r.start_date || '',
            endDate: r.end_date || '',
            allocationPercent: r.allocation_percent || 100,
            status: (r.status || 'active').toLowerCase()
          };
        });
      setAllocations(mapped);
    } catch (err) {
      console.error('[ResourceAllocation] Failed to load live allocations:', err);
      setAllocations([]);
      setAllocFetchError(true);
    } finally {
      setAllocLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. REAL resources pool: system users + hr_staff + fixed_assets from database
  const [dbStaff, setDbStaff] = useState<any[]>([]);
  const [dbAssets, setDbAssets] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('rbd_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch('/api/tables/hr_staff?limit=200', { headers })
      .then(res => res.ok ? res.json() : { data: [] })
      .then(d => { if (!cancelled) setDbStaff(d.data || []); })
      .catch(() => { if (!cancelled) setDbStaff([]); });

    fetch('/api/tables/fixed_assets?limit=200', { headers })
      .then(res => res.ok ? res.json() : { data: [] })
      .then(d => { if (!cancelled) setDbAssets(d.data || []); })
      .catch(() => { if (!cancelled) setDbAssets([]); });

    return () => { cancelled = true; };
  }, []);

  const availableResources = useMemo(() => {
    const staffFromUsers = users.map(u => ({
      id: u.id,
      nameAr: u.name_ar || u.name,
      nameEn: u.name,
      type: 'STAFF' as const,
      roleAr: u.position_code || 'أخصائي ميداني',
      roleEn: u.position_code || 'Operations Specialist',
      avatar: u.name?.charAt(0) || 'U'
    }));

    const staffFromDb = dbStaff.map((s: any, idx: number) => ({
      id: `hr-${s.id || idx}`,
      nameAr: s.full_name_ar || s.first_name_ar || `موظف ${idx + 1}`,
      nameEn: s.full_name_en || s.full_name_ar || `Staff ${idx + 1}`,
      type: 'STAFF' as const,
      roleAr: s.job_title_ar || s.department_ar || 'كادر ميداني',
      roleEn: s.job_title_en || s.job_title_ar || 'Field Staff',
      avatar: ''
    }));

    const realAssets = dbAssets.map((a: any, idx: number) => ({
      id: `fa-${a.id || idx}`,
      nameAr: a.name_ar || a.asset_tag || `أصل ${idx + 1}`,
      nameEn: a.name_en || a.asset_tag || a.name_ar || `Asset ${idx + 1}`,
      type: 'ASSET' as const,
      roleAr: a.asset_type_ar || a.category || 'أصل تشغيلي',
      roleEn: a.asset_type_en || a.category || 'Operational Asset'
    }));

    // Deduplicate by id — system users take precedence over hr_staff duplicates
    const combinedStaff = [...staffFromUsers];
    staffFromDb.forEach(s => {
      if (!combinedStaff.some(x => x.id === s.id)) combinedStaff.push(s);
    });

    return [...combinedStaff, ...realAssets];
  }, [users, dbStaff, dbAssets]);

  // 3. States for Filters and Allocation Form
  const [activeTab, setActiveTab] = useState<'timeline' | 'grid' | 'forecasting'>('timeline');
  const [filterType, setFilterType] = useState<'ALL' | 'STAFF' | 'ASSET'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [timelineScale, setTimelineScale] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');

  // Allocation Dialog
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [newAlloc, setNewAlloc] = useState({
    projectId: '',
    resourceId: '',
    roleAr: '',
    roleEn: '',
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    allocationPercent: '100',
    status: 'active' as const
  });

  // Action Success Feedback
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Automated Resource Balancing State & Simulation Controls
  const [isAutoBalanceModalOpen, setIsAutoBalanceModalOpen] = useState(false);
  const [selectedSimProject, setSelectedSimProject] = useState<string>('pj3');
  const [simulatedStartDate, setSimulatedStartDate] = useState<string>('2026-04-01');
  const [simulatedEndDate, setSimulatedEndDate] = useState<string>('2026-11-30');
  const [timelineShiftDays, setTimelineShiftDays] = useState<number>(30);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);

  // Time Scale setup
  const months = [
    { labelAr: 'يناير', labelEn: 'Jan', num: '01', year: '2026' },
    { labelAr: 'فبراير', labelEn: 'Feb', num: '02', year: '2026' },
    { labelAr: 'مارس', labelEn: 'Mar', num: '03', year: '2026' },
    { labelAr: 'أبريل', labelEn: 'Apr', num: '04', year: '2026' },
    { labelAr: 'مايو', labelEn: 'May', num: '05', year: '2026' },
    { labelAr: 'يونيو', labelEn: 'Jun', num: '06', year: '2026' },
    { labelAr: 'يوليو', labelEn: 'Jul', num: '07', year: '2026' },
    { labelAr: 'أغسطس', labelEn: 'Aug', num: '08', year: '2026' },
    { labelAr: 'سبتمبر', labelEn: 'Sep', num: '09', year: '2026' },
    { labelAr: 'أكتوبر', labelEn: 'Oct', num: '10', year: '2026' },
    { labelAr: 'نوفمبر', labelEn: 'Nov', num: '11', year: '2026' },
    { labelAr: 'ديسمبر', labelEn: 'Dec', num: '12', year: '2026' }
  ];

  // 4. Overutilization Checker
  const resourceTotalUtil = useMemo(() => {
    const map: Record<string, number> = {};
    allocations.forEach(alloc => {
      map[alloc.resourceId] = (map[alloc.resourceId] || 0) + alloc.allocationPercent;
    });
    return map;
  }, [allocations]);

  const overallocatedResources = useMemo(() => {
    return Object.entries(resourceTotalUtil)
      .filter(([_, value]) => (value as number) > 100)
      .map(([id]) => id);
  }, [resourceTotalUtil]);

  // Automated Resource Balancing Engine Recommendation Logic
  const balancingSuggestions = useMemo(() => {
    const suggestions: ReallocationSuggestion[] = [];
    const targetProj = projects.find(p => p.id === selectedSimProject) || projects[0];
    if (!targetProj) return suggestions;

    const staffMembers = availableResources.filter(r => r.type === 'STAFF');

    staffMembers.forEach(staff => {
      const currentLoad = resourceTotalUtil[staff.id] || 0;
      if (currentLoad > 85) {
        const staffAlloc = allocations.find(a => a.resourceId === staff.id && a.resourceType === 'STAFF');
        if (staffAlloc) {
          const candidate = staffMembers.find(c => c.id !== staff.id && (resourceTotalUtil[c.id] || 0) <= 60);

          if (candidate) {
            const candidateLoad = resourceTotalUtil[candidate.id] || 0;
            const shiftVal = Math.min(30, staffAlloc.allocationPercent, currentLoad - 80);
            
            if (shiftVal > 0) {
              const projObj = projects.find(p => p.id === staffAlloc.projectId) || targetProj;
              const sourceNew = currentLoad - shiftVal;
              const targetNew = candidateLoad + shiftVal;
              const isOver100 = currentLoad > 100;

              suggestions.push({
                id: `sug-${staff.id}-${candidate.id}-${staffAlloc.id}`,
                projectId: projObj.id,
                projectNameAr: projObj.name_ar,
                projectNameEn: projObj.name_en,
                allocIdToReduce: staffAlloc.id,
                sourceResourceId: staff.id,
                sourceResourceNameAr: staff.nameAr,
                sourceResourceNameEn: staff.nameEn,
                sourceCurrentLoad: currentLoad,
                sourceNewLoad: sourceNew,
                targetResourceId: candidate.id,
                targetResourceNameAr: candidate.nameAr,
                targetResourceNameEn: candidate.nameEn,
                targetCurrentLoad: candidateLoad,
                targetNewLoad: targetNew,
                shiftPercent: shiftVal,
                roleAr: staffAlloc.resourceRoleAr,
                roleEn: staffAlloc.resourceRoleEn,
                reasonAr: isOver100
                  ? `تعديل جدول مشروع [${projObj.name_ar}] أدى إلى تراكب المهام وتجاوز الطاقة الاستيعابية بـ (${currentLoad}% FTE) للموظف [${staff.nameAr}].`
                  : `تعديل الجدول الزمني يزيد الضغط إلى (${currentLoad}% FTE) على الموظف [${staff.nameAr}].`,
                reasonEn: isOver100
                  ? `Timeline adjustment for [${projObj.name_en}] caused a task overlap creating (${currentLoad}% FTE) overload for [${staff.nameEn}].`
                  : `Timeline shift elevates workload pressure to (${currentLoad}% FTE) on [${staff.nameEn}].`,
                impactAr: `تحويل ${shiftVal}% من العبء الميداني إلى [${candidate.nameAr}] يخفض إجهاد [${staff.nameAr}] إلى ${sourceNew}% FTE وتظل قدرة [${candidate.nameAr}] في النطاق الآمن (${targetNew}% FTE).`,
                impactEn: `Transferring ${shiftVal}% workload to [${candidate.nameEn}] drops [${staff.nameEn}]'s load to ${sourceNew}% FTE while keeping [${candidate.nameEn}]'s load safe at ${targetNew}% FTE.`
              });
            }
          }
        }
      }
    });

    if (suggestions.length === 0 && targetProj) {
      const activeStaffAlloc = allocations.find(a => a.projectId === targetProj.id && a.resourceType === 'STAFF') || allocations[0];
      const sourceStaff = staffMembers.find(s => s.id === activeStaffAlloc?.resourceId) || staffMembers[0];
      const candidateStaff = staffMembers.find(s => s.id !== sourceStaff?.id) || staffMembers[1];

      if (sourceStaff && candidateStaff && activeStaffAlloc) {
        const sourceLoad = resourceTotalUtil[sourceStaff.id] || 80;
        const targetLoad = resourceTotalUtil[candidateStaff.id] || 20;

        suggestions.push({
          id: `sug-proactive-${sourceStaff.id}-${candidateStaff.id}`,
          projectId: targetProj.id,
          projectNameAr: targetProj.name_ar,
          projectNameEn: targetProj.name_en,
          allocIdToReduce: activeStaffAlloc.id,
          sourceResourceId: sourceStaff.id,
          sourceResourceNameAr: sourceStaff.nameAr,
          sourceResourceNameEn: sourceStaff.nameEn,
          sourceCurrentLoad: sourceLoad,
          sourceNewLoad: Math.max(30, sourceLoad - 25),
          targetResourceId: candidateStaff.id,
          targetResourceNameAr: candidateStaff.nameAr,
          targetResourceNameEn: candidateStaff.nameEn,
          targetCurrentLoad: targetLoad,
          targetNewLoad: targetLoad + 25,
          shiftPercent: 25,
          roleAr: activeStaffAlloc.resourceRoleAr || 'مساعد إشراف ميداني',
          roleEn: activeStaffAlloc.resourceRoleEn || 'Assistant Field Supervisor',
          reasonAr: `تعديل المخطط الزمني لمشروع [${targetProj.name_ar}] يتطلب موازنة الساعات بين [${sourceStaff.nameAr}] والكوادر المتاحة.`,
          reasonEn: `Adjusting the timeline for [${targetProj.name_en}] recommends rebalancing hours between [${sourceStaff.nameEn}] and available staff.`,
          impactAr: `تحويل 25% من المهام إلى [${candidateStaff.nameAr}] يضمن سير العمل بدون اختناقات وتوزيع العبء بالتساوي.`,
          impactEn: `Reallocating 25% of tasks to [${candidateStaff.nameEn}] prevents bottleneck and balances workload evenly.`
        });
      }
    }

    return suggestions;
  }, [allocations, availableResources, projects, resourceTotalUtil, selectedSimProject, timelineShiftDays]);

  const handleApplyReallocation = (sug: ReallocationSuggestion) => {
    setAllocations(prev => {
      const updated = prev.map(a => {
        if (a.id === sug.allocIdToReduce) {
          const newPct = Math.max(10, a.allocationPercent - sug.shiftPercent);
          return { ...a, allocationPercent: newPct };
        }
        return a;
      });

      const existingTargetAlloc = updated.find(a => a.projectId === sug.projectId && a.resourceId === sug.targetResourceId);
      if (existingTargetAlloc) {
        return updated.map(a => {
          if (a.id === existingTargetAlloc.id) {
            return { ...a, allocationPercent: a.allocationPercent + sug.shiftPercent };
          }
          return a;
        });
      } else {
        const projObj = projects.find(p => p.id === sug.projectId) || projects[0];

        const newTargetItem: Allocation = {
          id: generateShortId('alloc-rebal'),
          projectId: sug.projectId,
          projectNameAr: projObj.name_ar,
          projectNameEn: projObj.name_en,
          resourceId: sug.targetResourceId,
          resourceNameAr: sug.targetResourceNameAr,
          resourceNameEn: sug.targetResourceNameEn,
          resourceType: 'STAFF',
          resourceRoleAr: sug.roleAr,
          resourceRoleEn: sug.roleEn,
          startDate: simulatedStartDate || projObj.start_date || '2026-04-01',
          endDate: simulatedEndDate || projObj.end_date || '2026-11-30',
          allocationPercent: sug.shiftPercent,
          status: 'active'
        };
        return [newTargetItem, ...updated];
      }
    });

    setAppliedSuggestions(prev => [...prev, sug.id]);
    setSuccessToast(
      isRtl 
        ? `تم إعادة توزيع الكوادر بنجاح! تم نقل ${sug.shiftPercent}% من العبء إلى [${sug.targetResourceNameAr}].`
        : `Staff reallocated successfully! ${sug.shiftPercent}% load transferred to [${sug.targetResourceNameEn}].`
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleApplyAllReallocations = () => {
    balancingSuggestions.forEach(sug => {
      if (!appliedSuggestions.includes(sug.id)) {
        handleApplyReallocation(sug);
      }
    });
  };

  // Filtered Allocations based on search and selected project
  const filteredAllocations = useMemo(() => {
    return allocations.filter(alloc => {
      const matchType = filterType === 'ALL' || alloc.resourceType === filterType;
      const matchProject = selectedProjectId === 'ALL' || alloc.projectId === selectedProjectId;
      
      const resName = lang === 'ar' ? alloc.resourceNameAr : alloc.resourceNameEn;
      const projName = lang === 'ar' ? alloc.projectNameAr : alloc.projectNameEn;
      const roleName = lang === 'ar' ? alloc.resourceRoleAr : alloc.resourceRoleEn;

      const matchSearch = searchTerm === '' || 
        resName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alloc.id.includes(searchTerm);

      return matchType && matchProject && matchSearch;
    });
  }, [allocations, filterType, selectedProjectId, searchTerm, lang]);

  // Calculated stats
  const statsSummary = useMemo(() => {
    const totalStaffAllocated = allocations.filter(a => a.resourceType === 'STAFF').length;
    const totalAssetAllocated = allocations.filter(a => a.resourceType === 'ASSET').length;
    
    // Calculate average utilization
    const activeResourceIds = Array.from(new Set(allocations.map(a => a.resourceId)));
    const totalUtilSum = activeResourceIds.reduce<number>((sum, rid) => sum + Math.min(100, (resourceTotalUtil[rid] as number) || 0), 0);
    const avgUtilization = activeResourceIds.length > 0 ? Math.round(totalUtilSum / activeResourceIds.length) : 0;

    return {
      totalStaff: totalStaffAllocated,
      totalAsset: totalAssetAllocated,
      overallocated: overallocatedResources.length,
      avgUtilization
    };
  }, [allocations, resourceTotalUtil, overallocatedResources]);

  // --- BURN-DOWN FORECASTING ENGINE ---
  const projectForecasts = useMemo(() => {
    const today = new Date('2026-08-07');
    
    return projects.map(proj => {
      // Find start date or default to 2026-01-01
      const startDateStr = proj.start_date || '2026-01-01';
      const endDateStr = proj.end_date || '2026-12-31';
      
      const start = new Date(startDateStr);
      const plannedEnd = new Date(endDateStr);
      
      // Days elapsed since start
      const elapsedMs = today.getTime() - start.getTime();
      const elapsedDays = Math.max(1, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));
      
      // Total planned duration in days
      const totalPlannedMs = plannedEnd.getTime() - start.getTime();
      const totalPlannedDays = Math.max(1, Math.ceil(totalPlannedMs / (1000 * 60 * 60 * 24)));
      
      // Progress percent
      const progress = parseFloat(proj.progress_percent || '0');
      
      // Past Progress velocity (progress % per day)
      // If no progress but days have elapsed, velocity is 0
      let velocity = elapsedDays > 0 ? (progress / elapsedDays) : 0;
      
      // Set a default velocity fallback if velocity is 0, to make forecasting possible
      const isPlaceholderVelocity = velocity <= 0;
      if (isPlaceholderVelocity) {
        velocity = proj.priority_code === 'CRITICAL' ? 0.45 : 0.25; 
      }
      
      // Remaining progress
      const remainingProgress = 100 - progress;
      
      // Estimated remaining days
      const remainingDays = Math.ceil(remainingProgress / velocity);
      
      // Forecasted completion date
      const forecastedEnd = new Date(today.getTime() + (remainingDays * 24 * 60 * 60 * 1000));
      
      // Is there a delay?
      const isDelayed = forecastedEnd.getTime() > plannedEnd.getTime();
      const delayDays = isDelayed ? Math.ceil((forecastedEnd.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      // Days remaining until scheduled end date
      const plannedDaysRemaining = Math.ceil((plannedEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        project: proj,
        startDateStr,
        endDateStr,
        elapsedDays,
        totalPlannedDays,
        progress,
        velocity,
        isPlaceholderVelocity,
        remainingDays,
        forecastedEnd,
        isDelayed,
        delayDays,
        plannedDaysRemaining
      };
    });
  }, [projects]);

  // Handler: Save new allocation
  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    const { projectId, resourceId, roleAr, roleEn, startDate, endDate, allocationPercent } = newAlloc;

    if (!projectId || !resourceId || !roleAr) {
      setFormError(isRtl ? 'يرجى ملء جميع الحقول المطلوبة بالشكل الصحيح.' : 'Please completely fill all mandatory fields.');
      setFormSubmitting(false);
      return;
    }

    const proj = projects.find(p => p.id === projectId) || projects[0];
    const res = availableResources.find(r => r.id === resourceId);

    if (!res || !proj) {
      setFormError(isRtl ? 'المورد أو المشروع المختار غير صالح.' : 'Selected resource or project is invalid.');
      setFormSubmitting(false);
      return;
    }

    // Assemble the local allocation view model
    const createdBase: Allocation = {
      id: `alloc-${Date.now()}`,
      projectId,
      projectNameAr: proj.name_ar,
      projectNameEn: proj.name_en,
      resourceId,
      resourceNameAr: res.nameAr,
      resourceNameEn: res.nameEn,
      resourceType: res.type,
      resourceRoleAr: roleAr,
      resourceRoleEn: roleEn || roleAr,
      startDate,
      endDate,
      allocationPercent: parseInt(allocationPercent) || 100,
      status: 'active'
    };

    // Persist to the live resource_allocations table
    const token = localStorage.getItem('rbd_token');
    const payload = {
      project_id: projectId,
      resource_id: resourceId,
      resource_type: res.type,
      resource_name_ar: res.nameAr,
      resource_name_en: res.nameEn,
      role_ar: roleAr,
      role_en: roleEn || roleAr,
      start_date: startDate,
      end_date: endDate,
      allocation_percent: parseInt(allocationPercent) || 100,
      status: 'ACTIVE'
    };

    try {
      const res2 = await fetch('/api/tables/resource_allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
      const saved = await res2.json();
      const createdItem: Allocation = { ...createdBase, id: saved?.id || `alloc-${Date.now()}` };
      setAllocations(prev => [createdItem, ...prev]);
    } catch (err) {
      console.error('[ResourceAllocation] Create failed:', err);
      setFormError(isRtl ? 'تعذر الحفظ في قاعدة البيانات. تحقق من الاتصال وأعد المحاولة.' : 'Failed to persist allocation to the database. Check connectivity and retry.');
      setFormSubmitting(false);
      return;
    }
    setIsAllocModalOpen(false);

    // Trigger success notification
    setSuccessToast(isRtl ? 'تم حجز وتخصيص المورد بنجاح في قاعدة البيانات!' : 'Resource successfully allocated and persisted!');
    setTimeout(() => setSuccessToast(null), 5000);

    // Reset Form fields
    setNewAlloc({
      projectId: '',
      resourceId: '',
      roleAr: '',
      roleEn: '',
      startDate: '2026-08-01',
      endDate: '2026-12-31',
      allocationPercent: '100',
      status: 'active'
    });

    if (onRefresh) onRefresh();
  };

  // Handler: Delete allocation
  const handleDeleteAllocation = async (id: string) => {
    if (confirm(isRtl ? 'هل أنت متأكد من إلغاء وحذف هذا التخصيص للمورد؟' : 'Are you sure you want to release and delete this resource allocation?')) {
      try {
        const token = localStorage.getItem('rbd_token');
        const res = await fetch(`/api/tables/resource_allocations/${id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        console.error('[ResourceAllocation] Delete failed:', err);
        setSuccessToast(isRtl ? 'تعذر حذف التخصيص من قاعدة البيانات.' : 'Failed to delete allocation from the database.');
        setTimeout(() => setSuccessToast(null), 4000);
        return;
      }
      setAllocations(prev => prev.filter(a => a.id !== id));
      setSuccessToast(isRtl ? 'تم إلغاء التخصيص وإرجاع المورد للاستعداد.' : 'Allocation revoked. Resource is back to standby.');
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  // 5. Timeline Math Calculations for Gantt Bar Drawing
  // Draw Gantt bars over 12 months of 2026
  const getGanttPosition = (startDateStr: string, endDateStr: string) => {
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      
      // If dates are invalid, fall back
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { startPercent: 30, widthPercent: 40 };
      }

      const yearStart = new Date('2026-01-01');
      const yearEnd = new Date('2026-12-31');

      const totalYearMs = yearEnd.getTime() - yearStart.getTime();

      // Clamp start and end to 2026 bounds
      const clampedStart = Math.max(yearStart.getTime(), start.getTime());
      const clampedEnd = Math.min(yearEnd.getTime(), end.getTime());

      if (clampedEnd < clampedStart) {
        return { startPercent: 0, widthPercent: 5 };
      }

      const startMsOffset = clampedStart - yearStart.getTime();
      const durationMs = clampedEnd - clampedStart;

      const startPercent = parseFloat(((startMsOffset / totalYearMs) * 100).toFixed(1));
      const widthPercent = parseFloat(((durationMs / totalYearMs) * 100).toFixed(1));

      return {
        startPercent,
        widthPercent: Math.max(4, widthPercent) // minimum 4% so it remains visible
      };
    } catch {
      return { startPercent: 20, widthPercent: 50 };
    }
  };

  return (
    <ModuleShell titleAr="نظام تخطيط الموارد البشرية" titleEn="Personnel Resource Allocation" domainCode="NEB-09" icon={Calendar} accent="blue" lang={lang} onRefresh={onRefresh}>
    <div className="space-y-6 font-sans text-slate-800 dark:text-zinc-100 animate-fadeIn">
      
      {/* 1. Header with custom brand standard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <span className="text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-500" />
            {isRtl ? 'تخطيط وتوزيع الكادر والأصول الميدانية' : 'Resource Allocation & Scheduling'}
          </span>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Calendar className="w-5.5 h-5.5 text-emerald-600" />
            {isRtl ? 'مخطط تخصيص الموارد والأصول Gantt' : 'Resource Allocation & Gantt Planning'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {isRtl 
              ? 'توزيع وجدولة الكوادر الميدانية والأصول والمعدات على الأنشطة والمشاريع النشطة لـ "رُحماء بينهم".' 
              : 'Interactive visual workspace tracking staff deployment, vehicle fleet usage, and solar installations across live operations.'}
          </p>
        </div>

        {/* Action Button and Mode Select */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAutoBalanceModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>{isRtl ? 'الموازنة التلقائية للكوادر' : 'Auto-Balance Resources'}</span>
            {overallocatedResources.length > 0 && (
              <span className="bg-rose-600 text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {overallocatedResources.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              // Open add modal
              setIsAllocModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/15 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'تخصيص مورد جديد' : 'New Assignment Booking'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPIs row with mathematical optimization details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
              {isRtl ? 'الكادر النشط بالميدان' : 'Deployed Field Staff'}
            </span>
            <span className="text-xl font-mono font-black text-slate-800 dark:text-white mt-0.5 block">
              {statsSummary.totalStaff}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
              {isRtl ? 'المعدات والأصول الملتزمة' : 'Assigned Heavy Assets'}
            </span>
            <span className="text-xl font-mono font-black text-slate-800 dark:text-white mt-0.5 block">
              {statsSummary.totalAsset}
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
          statsSummary.overallocated > 0 
            ? 'bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-400' 
            : 'bg-white dark:bg-zinc-950 border-slate-100 dark:border-zinc-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${
              statsSummary.overallocated > 0 
                ? 'bg-rose-500/10 text-rose-500' 
                : 'bg-slate-100 dark:bg-zinc-900 text-slate-500'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${statsSummary.overallocated > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                {isRtl ? 'حالات الإجهاد / التجاوز' : 'Overallocated Resources'}
              </span>
              <span className="text-xl font-mono font-black mt-0.5 block">
                {statsSummary.overallocated}
              </span>
            </div>
          </div>
          {statsSummary.overallocated > 0 && (
            <button
              onClick={() => setIsAutoBalanceModalOpen(true)}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{isRtl ? 'موازنة فورية' : 'Balance Now'}</span>
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
              {isRtl ? 'متوسط كفاءة الاستخدام' : 'Average Utilization Rate'}
            </span>
            <span className="text-xl font-mono font-black text-slate-800 dark:text-white mt-0.5 block">
              {statsSummary.avgUtilization}%
            </span>
          </div>
        </div>

      </div>

      {/* Toast Alert */}
      {successToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-black animate-fadeIn flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 3. Search & Filters Bar */}
      <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="relative w-full md:w-80">
          <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isRtl ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRtl ? 'البحث باسم المورد أو المشروع...' : 'Search assigned resource or project...'}
            className={`w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg py-2 ${
              isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
            } text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600`}
          />
        </div>

        {/* Dropdown Filters and View Mode */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Project dropdown Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-black shrink-0">
              {isRtl ? 'المشروع:' : 'Proj:'}
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-bold py-1.5 px-2 rounded-lg text-slate-800 dark:text-zinc-200"
            >
              <option value="ALL">{isRtl ? 'جميع المشاريع' : 'All Projects'}</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} - {isRtl ? p.name_ar : p.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Type filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
            {(['ALL', 'STAFF', 'ASSET'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                {type === 'ALL' ? (isRtl ? 'الكل' : 'All') : type === 'STAFF' ? (isRtl ? 'كوادر' : 'Staff') : (isRtl ? 'أصول' : 'Assets')}
              </button>
            ))}
          </div>

          {/* View switcher Tab */}
          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1 hidden sm:block" />
          
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              {isRtl ? 'مخطط Gantt الزمني' : 'Gantt Chart'}
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              {isRtl ? 'قائمة الجدولة' : 'Grid List'}
            </button>
            <button
              onClick={() => setActiveTab('forecasting')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'forecasting'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              {isRtl ? 'التنبؤ بجدول الإنجاز' : 'Burn-down Forecasting'}
            </button>
          </div>

        </div>

      </div>

      {/* 4. Active Gantt Timeline Visualizer */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 p-4 overflow-hidden shadow-xs">
          
          {/* Calendar timeline Header scale */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-900 mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black tracking-tight uppercase">
                {isRtl ? 'المحور المخطط لعام 2026م (يناير - ديسمبر)' : 'OPERATIONAL CALENDAR MATRIX (2026 FULL YEAR)'}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded font-bold border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>{isRtl ? 'كود حماية الإجهاد نشط' : 'Overcommit Alerts Active'}</span>
              </span>
            </div>
          </div>

          {/* Core Gantt Stage Area */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[850px] space-y-px select-none">
              
              {/* Months Row Header */}
              <div className="flex items-center bg-slate-900 text-amber-400 font-mono text-[9px] font-black uppercase rounded-t-lg tracking-wider border-b border-zinc-800">
                <div className="w-1/4 p-3 border-r border-zinc-800 shrink-0 text-amber-400 text-xs font-bold font-sans">
                  {isRtl ? 'المورد ودوره بالمشروع' : 'RESOURCE & OPERATIONAL ROLE'}
                </div>
                <div className="w-3/4 flex divide-x divide-zinc-800 shrink-0">
                  {months.map(m => (
                    <div key={m.num} className="flex-1 text-center py-3 text-[10px] font-black">
                      {isRtl ? m.labelAr : m.labelEn}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows Listing */}
              {allocLoading ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-zinc-950/40 rounded-b-xl border border-dashed border-slate-200 dark:border-zinc-800">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">
                    {isRtl ? 'جاري جلب التخصيصات الحقيقية من قاعدة البيانات...' : 'Loading live allocations from the database...'}
                  </p>
                </div>
              ) : allocFetchError ? (
                <div className="py-10 text-center bg-amber-500/5 rounded-b-xl border border-dashed border-amber-500/40">
                  <AlertTriangle className="w-9 h-9 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {isRtl ? 'تعذر الاتصال بقاعدة بيانات التخصيصات.' : 'Failed to connect to the allocations database.'}
                  </p>
                  <button
                    onClick={fetchAllocations}
                    className="mt-3 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-black transition-colors cursor-pointer"
                  >
                    {isRtl ? 'إعادة المحاولة' : 'Retry'}
                  </button>
                </div>
              ) : filteredAllocations.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-zinc-950/40 rounded-b-xl border border-dashed border-slate-200 dark:border-zinc-800">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">
                    {isRtl ? 'لا توجد تخصيصات مطابقة حالياً للفلاتر المحددة.' : 'No active resource allocations matched your filters.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-900 bg-white dark:bg-zinc-950 border-x border-b border-slate-200/60 dark:border-zinc-900 rounded-b-xl">
                  {filteredAllocations.map(alloc => {
                    const isOver = overallocatedResources.includes(alloc.resourceId);
                    const isCompleted = alloc.status === 'completed';
                    const { startPercent, widthPercent } = getGanttPosition(alloc.startDate, alloc.endDate);

                    return (
                      <div key={alloc.id} className="flex items-center hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors group">
                        
                        {/* Column 1: Resource Metadata */}
                        <div className="w-1/4 p-3 border-r border-slate-100 dark:border-zinc-900 shrink-0 flex items-start gap-2.5 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            alloc.resourceType === 'STAFF' 
                              ? 'bg-emerald-500/10 text-emerald-600' 
                              : 'bg-indigo-500/10 text-indigo-500'
                          }`}>
                            {alloc.resourceType === 'STAFF' ? <User className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate group-hover:text-emerald-600 transition-colors">
                              {isRtl ? alloc.resourceNameAr : alloc.resourceNameEn}
                            </h4>
                            
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-bold text-slate-400 truncate max-w-full">
                                {isRtl ? alloc.resourceRoleAr : alloc.resourceRoleEn}
                              </span>
                            </div>

                            <span className="text-[8px] font-mono font-black text-zinc-400 uppercase tracking-tight block truncate">
                              {isRtl ? alloc.projectNameAr : alloc.projectNameEn}
                            </span>

                            {/* Cumulative Capacity Progress & Tooltip */}
                            <div className="pt-1 w-full relative group/cap cursor-help">
                              <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 dark:text-zinc-500 mb-0.5">
                                <span>{isRtl ? 'العبء التراكمي' : 'Total Load'}</span>
                                <span className={resourceTotalUtil[alloc.resourceId] > 100 ? 'text-rose-500 font-black animate-pulse' : 'text-slate-600 dark:text-zinc-400 font-mono'}>
                                  {resourceTotalUtil[alloc.resourceId]}%
                                </span>
                              </div>
                              <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    resourceTotalUtil[alloc.resourceId] > 100 ? 'bg-rose-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, resourceTotalUtil[alloc.resourceId] || 0)}%` }}
                                />
                              </div>
                              {/* Capacity breakdown Tooltip */}
                              <div className="absolute invisible group-hover/cap:visible opacity-0 group-hover/cap:opacity-100 z-50 bg-slate-900 dark:bg-zinc-950 text-white border border-zinc-800 text-[10px] p-2.5 rounded-lg shadow-xl -top-24 left-0 w-48 space-y-1 select-none pointer-events-none transition-all duration-200">
                                <div className="font-extrabold text-amber-400 border-b border-zinc-800 pb-1 flex justify-between">
                                  <span>{isRtl ? 'أهلية الطاقة الاستيعابية' : 'Capacity Metrics'}</span>
                                  <span>{resourceTotalUtil[alloc.resourceId]}%</span>
                                </div>
                                <p className="text-[9px] text-zinc-300 leading-normal font-sans font-medium">
                                  {isRtl 
                                    ? `هذا المورد مخصص بنسبة إجمالية تبلغ ${resourceTotalUtil[alloc.resourceId]}% عبر كافة المشاريع الميدانية الجارية.`
                                    : `This resource is committed at ${resourceTotalUtil[alloc.resourceId]}% total load across active field projects.`}
                                </p>
                                {resourceTotalUtil[alloc.resourceId] > 100 && (
                                  <p className="text-[8px] text-rose-400 font-black">
                                    {isRtl ? '⚠️ حالة إجهاد وتخطٍ للحد المسموح!' : '⚠️ Operational Overload Warning!'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Visual Gantt Bar Grid */}
                        <div className="w-3/4 h-16 relative flex items-center shrink-0 pr-1.5 pl-1.5">
                          
                          {/* Background Grid Lines helper */}
                          <div className="absolute inset-0 flex divide-x divide-slate-100/50 dark:divide-zinc-900/50 pointer-events-none">
                            {months.map(m => (
                              <div key={m.num} className="flex-1 h-full" />
                            ))}
                          </div>

                          {/* Gantt Colored Bar */}
                          <div 
                            className={`absolute h-8 rounded-lg shadow-sm border p-2 flex items-center justify-between transition-all group/bar ${
                              isOver 
                                ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/10 border-rose-500/30' 
                                : alloc.resourceType === 'STAFF'
                                  ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border-emerald-500/20'
                                  : 'bg-gradient-to-r from-indigo-500/10 to-cyan-500/5 border-indigo-500/20'
                            }`}
                            style={{ 
                              [isRtl ? 'right' : 'left']: `${startPercent}%`, 
                              width: `${widthPercent}%` 
                            }}
                          >
                            <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-hidden">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isOver ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                              }`} />
                              <span className={`text-[9px] font-black truncate leading-none ${
                                isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-zinc-300'
                              }`}>
                                {alloc.allocationPercent}% {isRtl ? 'تخصيص' : 'Commit'}
                              </span>
                            </div>

                            {/* Release action button inside bar */}
                            <button
                              onClick={() => handleDeleteAllocation(alloc.id)}
                              className="opacity-0 group-hover/bar:opacity-100 p-0.5 hover:bg-rose-500 hover:text-white rounded text-slate-400 transition-all cursor-pointer shrink-0 ml-1 z-10"
                              title={isRtl ? 'إلغاء حجز المورد' : 'Release Resource Allocation'}
                            >
                              <X className="w-3 h-3" />
                            </button>

                            {/* Hover info tooltip card */}
                            <div className="absolute invisible group-hover/bar:visible opacity-0 group-hover/bar:opacity-100 z-50 bg-slate-950 text-white border border-zinc-800 text-[10px] p-3 rounded-xl shadow-2xl -top-24 left-1/2 -translate-x-1/2 w-56 space-y-1.5 select-none pointer-events-none transition-all duration-200">
                              <div className="font-extrabold flex items-center justify-between gap-1.5 border-b border-zinc-800 pb-1.5">
                                <span className="text-amber-500 font-mono text-[9px] font-black">{alloc.id}</span>
                                <span className="font-mono text-[9px] text-zinc-400">{alloc.startDate} ~ {alloc.endDate}</span>
                              </div>
                              <p className="font-black text-white leading-tight">
                                {isRtl ? alloc.resourceNameAr : alloc.resourceNameEn}
                              </p>
                              <p className="text-[9px] text-zinc-400 font-bold">
                                {isRtl ? alloc.resourceRoleAr : alloc.resourceRoleEn}
                              </p>
                              <div className="text-[9px] bg-zinc-900/60 p-1 rounded-md text-zinc-300">
                                <span className="font-bold">{isRtl ? 'المشروع المرتبط: ' : 'Project: '}</span>
                                <span className="text-[9px] font-bold text-emerald-400">
                                  {isRtl ? alloc.projectNameAr : alloc.projectNameEn}
                                </span>
                              </div>
                              {isOver && (
                                <p className="text-[9px] text-rose-400 font-black flex items-center gap-1 bg-rose-950/30 p-1 rounded border border-rose-900/50">
                                  <span>⚠️</span>
                                  <span>{isRtl ? 'تحذير: تخطى العبء الأقصى (100%+)!' : 'Warning: Overcapacity Load!'}</span>
                                </p>
                              )}
                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* 5. Tab Content 2: Raw Grid List view for administration */}
      {activeTab === 'grid' && (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase">
              {isRtl ? 'سجل تفاصيل الحجوزات النشطة' : 'RESOURCE SCHEDULE LEDGER'}
            </h3>
            <span className="text-[10px] text-zinc-400 font-mono font-bold">
              {filteredAllocations.length} {isRtl ? 'سجلات حجز' : 'records loaded'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr className="bg-slate-900 text-amber-400 font-black text-[9px] uppercase border-b border-zinc-800">
                  <th className="p-3 rounded-s">{isRtl ? 'المورد الفني' : 'Resource Name'}</th>
                  <th className="p-3">{isRtl ? 'النوع' : 'Category'}</th>
                  <th className="p-3">{isRtl ? 'الدور والمسؤولية' : 'Assigned Role'}</th>
                  <th className="p-3">{isRtl ? 'المشروع المرتبط' : 'Bound Project'}</th>
                  <th className="p-3 text-center">{isRtl ? 'الفترة الزمنية' : 'Timeline Frame'}</th>
                  <th className="p-3 text-center">{isRtl ? 'نسبة الالتزام' : 'Load Percent'}</th>
                  <th className="p-3 text-center rounded-e">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900 font-semibold text-slate-700">
                {filteredAllocations.map(alloc => {
                  const isOver = overallocatedResources.includes(alloc.resourceId);
                  return (
                    <tr key={alloc.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-all">
                      <td className="p-3 font-extrabold text-slate-900 dark:text-zinc-100">
                        {isRtl ? alloc.resourceNameAr : alloc.resourceNameEn}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                          alloc.resourceType === 'STAFF' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                        }`}>
                          {alloc.resourceType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-zinc-400 text-[11px]">
                        {isRtl ? alloc.resourceRoleAr : alloc.resourceRoleEn}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {isRtl ? alloc.projectNameAr : alloc.projectNameEn}
                      </td>
                      <td className="p-3 text-center font-mono text-[10px] text-zinc-500">
                        {alloc.startDate} ~ {alloc.endDate}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-mono font-black ${
                            isOver ? 'text-rose-500' : 'text-slate-800 dark:text-zinc-200'
                          }`}>
                            {alloc.allocationPercent}%
                          </span>
                          {isOver && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteAllocation(alloc.id)}
                          className="px-2 py-1 hover:bg-rose-500 hover:text-white border border-slate-200 dark:border-zinc-800 hover:border-rose-600 rounded text-[10px] font-bold text-slate-500 transition-all cursor-pointer"
                        >
                          {isRtl ? 'إلغاء وحذف' : 'Revoke'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab Content 3: Burn-down Forecasting */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Summary counters for Forecasting */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-xs">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                {isRtl ? 'المشاريع الخاضعة للتنبؤ' : 'Forecasted Projects'}
              </span>
              <span className="text-xl font-mono font-black text-slate-800 dark:text-white mt-0.5 block">
                {projectForecasts.length}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-1">
                {isRtl ? 'تحليل مبني على وتيرة التقدم الفعلي والمخطط الزمني' : 'Based on real-time past progress & timeline velocity'}
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-xs">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                {isRtl ? 'مشاريع تواجه مخاطر التأخير' : 'Projects with Delay Risk'}
              </span>
              <span className={`text-xl font-mono font-black mt-0.5 block ${
                projectForecasts.filter(p => p.isDelayed).length > 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}>
                {projectForecasts.filter(p => p.isDelayed).length}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-1">
                {isRtl ? 'توقعات بتجاوز تاريخ الإغلاق المعتمد' : 'Projected completion exceeds scheduled end date'}
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-xs">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                {isRtl ? 'متوسط وتيرة الإنجاز الميداني' : 'Average Progress Velocity'}
              </span>
              <span className="text-xl font-mono font-black text-slate-800 dark:text-white mt-0.5 block">
                {(projectForecasts.reduce((sum, p) => sum + p.velocity, 0) / Math.max(1, projectForecasts.length)).toFixed(3)}% <span className="text-xs text-zinc-400 font-sans">{isRtl ? '/ يوم' : '/ day'}</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-1">
                {isRtl ? 'معدل حرق المهام اليومي التراكمي' : 'Cumulative daily task burn rate'}
              </span>
            </div>
          </div>

          {/* Delay Warning Banner */}
          {projectForecasts.filter(p => p.isDelayed).length > 0 && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
              <span>
                {isRtl 
                  ? `تحذير حرج: تشير خوارزمية التنبؤ بنموذج حرق المهام (Burn-down) إلى احتمال تعثر ${projectForecasts.filter(p => p.isDelayed).length} مشاريع وتأخرها عن الجدول الزمني المعتمد!` 
                  : `Critical Warning: The task burn-down algorithm predicts potential schedule overruns in ${projectForecasts.filter(p => p.isDelayed).length} active project(s)!`}
              </span>
            </div>
          )}

          {/* Forecast List Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projectForecasts.map(forecast => {
              const proj = forecast.project;
              const isDelayed = forecast.isDelayed;

              return (
                <div 
                  key={proj.id} 
                  className={`bg-white dark:bg-zinc-950 rounded-2xl border p-5 space-y-4 shadow-3xs transition-all hover:shadow-md ${
                    isDelayed 
                      ? 'border-rose-500/30 bg-gradient-to-br from-white to-rose-500/[0.01] dark:from-zinc-950 dark:to-rose-950/[0.01]' 
                      : 'border-slate-100 dark:border-zinc-800'
                  }`}
                >
                  
                  {/* Card Header with localized status badge */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="text-[10px] font-black font-mono bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded uppercase">
                        {proj.code}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                        {isRtl ? proj.name_ar : proj.name_en}
                      </h4>
                    </div>

                    {isDelayed ? (
                      <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{isRtl ? `تأخير متوقع بـ ${forecast.delayDays} يوم` : `Delayed by ${forecast.delayDays} Days`}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'ضمن المخطط' : 'On Track'}</span>
                      </span>
                    )}
                  </div>

                  {/* Core burn-down stats list */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold border-y border-slate-100 dark:border-zinc-900 py-3.5">
                    
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wide block">
                        {isRtl ? 'تاريخ البدء المعتمد' : 'Scheduled Start Date'}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-zinc-300">
                        {forecast.startDateStr}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wide block">
                        {isRtl ? 'تاريخ الانتهاء المعتمد' : 'Scheduled End Date'}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-zinc-300">
                        {forecast.endDateStr}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wide block">
                        {isRtl ? 'الأيام المنقضية' : 'Elapsed Operational Days'}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-zinc-300">
                        {forecast.elapsedDays} {isRtl ? 'يوم' : 'Days'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wide block">
                        {isRtl ? 'سرعة الإنجاز اليومية' : 'Measured Daily Velocity'}
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{forecast.velocity.toFixed(3)}% {isRtl ? 'في اليوم' : '/ day'}</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wide block">
                        {isRtl ? 'تاريخ الإنجاز المتوقع' : 'Estimated Completion Date'}
                      </span>
                      <span className={`font-mono font-extrabold ${isDelayed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                        {forecast.forecastedEnd.toISOString().split('T')[0]}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wide block">
                        {isRtl ? 'وتيرة المتبقي' : 'Required Burn Velocity'}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-zinc-300">
                        {forecast.plannedDaysRemaining > 0 
                          ? `${((100 - forecast.progress) / forecast.plannedDaysRemaining).toFixed(3)}% ${isRtl ? '/ يوم' : '/ day'}`
                          : (isRtl ? 'متجاوز للموعد' : 'Overdue')}
                      </span>
                    </div>

                  </div>

                  {/* Horizontal mini Progress indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 uppercase tracking-wider">
                        {isRtl ? 'نسبة التقدم الحالي' : 'Current Progress Level'}
                      </span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {forecast.progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDelayed ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${forecast.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* The actual Burndown Projection SVG */}
                  <BurndownChart 
                    totalPlannedDays={forecast.totalPlannedDays}
                    elapsedDays={forecast.elapsedDays}
                    progress={forecast.progress}
                    remainingDays={forecast.remainingDays}
                    isDelayed={isDelayed}
                    delayDays={forecast.delayDays}
                    lang={lang}
                  />

                  {/* Analysis Summary Quote */}
                  <p className={`text-[11px] leading-relaxed p-2.5 rounded-lg border ${
                    isDelayed 
                      ? 'bg-rose-500/5 border-rose-500/10 text-rose-700 dark:text-rose-400' 
                      : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {isDelayed ? (
                      isRtl 
                        ? `⚠️ استناداً إلى وتيرة العمل الميداني البالغة ${forecast.velocity.toFixed(2)}% يومياً، فإن مشروعك متأخر بنحو ${forecast.delayDays} يوماً عن الموعد المحدد. يوصى بمضاعفة الكادر وتخصيص أصول نقل إضافية لتسريع مسار حرق المهام (Burn-down velocity).`
                        : `⚠️ At a velocity of ${forecast.velocity.toFixed(2)}% per day, completion is projected to slip by ${forecast.delayDays} days. Consider overallocating field staff or transport assets to restore task burn-down speed.`
                    ) : (
                      isRtl 
                        ? `✔️ وتيرة العمل الميداني الحالية البالغة ${forecast.velocity.toFixed(2)}% يومياً تضمن إغلاق أنشطة المشروع بنجاح قبل موعد الاستحقاق بـ ${Math.abs(forecast.delayDays)} يوماً.`
                        : `✔️ Current field velocity of ${forecast.velocity.toFixed(2)}% per day ensures successful project delivery on-track, finishing roughly ${Math.abs(forecast.delayDays)} days ahead of schedule.`
                    )}
                  </p>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ==================== CREATE ALLOCATION DIALOG MODAL ==================== */}
      {isAllocModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {isRtl ? 'حجز وتخصيص الموارد للمشاريع الميدانية' : 'New Resource Allocation Booking'}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {isRtl 
                    ? 'جدولة الموظفين والأصول المتوفرة وتحديد العبء الزمني والمهمة بموجب معايير NEB-09' 
                    : 'Configure deployment timeline, project scope, and workload bounds.'}
                </p>
              </div>
              <button 
                onClick={() => setIsAllocModalOpen(false)}
                className="p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-zinc-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAllocation} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Project Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                  {isRtl ? 'المشروع المستهدف بالجدولة *' : 'Target Project *'}
                </label>
                <select
                  required
                  value={newAlloc.projectId}
                  onChange={(e) => setNewAlloc(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold text-slate-800"
                >
                  <option value="">{isRtl ? '-- اختر المشروع الميداني --' : '-- Select active project --'}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {isRtl ? p.name_ar : p.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Resource Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                  {isRtl ? 'المورد البشري أو العيني المراد تخصيصه *' : 'Human or Asset Resource *'}
                </label>
                <select
                  required
                  value={newAlloc.resourceId}
                  onChange={(e) => setNewAlloc(prev => ({ ...prev, resourceId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold text-slate-800"
                >
                  <option value="">{isRtl ? '-- اختر المورد المطلوب --' : '-- Select resource item --'}</option>
                  
                  <optgroup label={isRtl ? 'الكوادر والموظفين (STAFF)' : 'Staff & Field Personnel'}>
                    {availableResources.filter(r => r.type === 'STAFF').map(r => (
                      <option key={r.id} value={r.id}>
                        {isRtl ? r.nameAr : r.nameEn} ({isRtl ? r.roleAr : r.roleEn})
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label={isRtl ? 'الأصول والمعدات (ASSET)' : 'Machinery & Equipment'}>
                    {availableResources.filter(r => r.type === 'ASSET').map(r => (
                      <option key={r.id} value={r.id}>
                        {isRtl ? r.nameAr : r.nameEn}
                      </option>
                    ))}
                  </optgroup>

                </select>
              </div>

              {/* 3. Role description inside the project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                    {isRtl ? 'دور المورد في المشروع (عربي) *' : 'Resource Role (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newAlloc.roleAr}
                    onChange={(e) => setNewAlloc(prev => ({ ...prev, roleAr: e.target.value }))}
                    placeholder="مثال: منسق الدعم اللوجستي"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                    {isRtl ? 'دور المورد في المشروع (English)' : 'Resource Role (English)'}
                  </label>
                  <input
                    type="text"
                    value={newAlloc.roleEn}
                    onChange={(e) => setNewAlloc(prev => ({ ...prev, roleEn: e.target.value }))}
                    placeholder="e.g. Logistical Field Coordinator"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* 4. Scheduling timeframe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                    {isRtl ? 'تاريخ بدء التخصيص *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newAlloc.startDate}
                    onChange={(e) => setNewAlloc(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                    {isRtl ? 'تاريخ انتهاء التخصيص *' : 'End Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newAlloc.endDate}
                    onChange={(e) => setNewAlloc(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* 5. Workload percent commit */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                  {isRtl ? 'نسبة عبء الجدولة / الالتزام الزمني *' : 'Allocation Load / Commitment Percent *'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={newAlloc.allocationPercent}
                    onChange={(e) => setNewAlloc(prev => ({ ...prev, allocationPercent: e.target.value }))}
                    className="flex-1 accent-emerald-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-black text-emerald-600 shrink-0 bg-emerald-500/10 px-2 py-1 rounded">
                    {newAlloc.allocationPercent}%
                  </span>
                </div>
                <p className="text-[9px] text-zinc-400 mt-1">
                  {isRtl 
                    ? 'العبء المثالي 100% للمهام المخصصة بالكامل، أو نسب أقل للمهام التشاركية متعددة المشاريع.'
                    : '100% signifies total exclusive focus. Choose a lesser percentage for partial part-time deployments.'}
                </p>
              </div>

              {/* Action Save button inside modal */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAllocModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                >
                  {formSubmitting ? (isRtl ? 'جاري التخصيص...' : 'Allocating...') : (isRtl ? 'تأكيد الحجز والتخصيص' : 'Confirm Allocation')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== AUTOMATED RESOURCE BALANCING MODAL ==================== */}
      {isAutoBalanceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-scale-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded">
                      NEB-09 AI BALANCING ENGINE
                    </span>
                    {overallocatedResources.length > 0 && (
                      <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                        {overallocatedResources.length} {isRtl ? 'تجاوزات مكتشفة' : 'Overallocations'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-black text-white mt-0.5">
                    {isRtl ? 'المحرك الآلي لموازنة الكوادر وإعادة توزيع الأحمال' : 'Automated Resource Rebalancing Engine'}
                  </h2>
                </div>
              </div>
              <button 
                onClick={() => setIsAutoBalanceModalOpen(false)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Section 1: Timeline Adjustment Simulator */}
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      {isRtl ? 'محاكي تعديل الجدول الزمني للمشاريع' : 'Project Timeline Adjustment Simulator'}
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {isRtl ? 'تحليل التراكب وتوافر الكوادر' : 'Real-time Capacity Analyzer'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Select Project to simulate */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {isRtl ? 'اختر المشروع لمحاكاة التغيير:' : 'Select Project to Adjust:'}
                    </label>
                    <select
                      value={selectedSimProject}
                      onChange={(e) => {
                        setSelectedSimProject(e.target.value);
                        const p = projects.find(proj => proj.id === e.target.value);
                        if (p) {
                          setSimulatedStartDate(p.start_date || '2026-04-01');
                          setSimulatedEndDate(p.end_date || '2026-11-30');
                        }
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-bold"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {lang === 'ar' ? p.name_ar : p.name_en} ({p.code || p.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Shift Days Presets */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {isRtl ? 'تعديل الجدول الزمني المتوقع (إزاحة بالأيام):' : 'Project Timeline Shift / Extension:'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[-30, -15, 0, 15, 30, 60].map(days => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setTimelineShiftDays(days)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            timelineShiftDays === days
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                          }`}
                        >
                          {days === 0 
                            ? (isRtl ? 'بدون إزاحة (0)' : 'No Shift (0)')
                            : `${days > 0 ? '+' : ''}${days} ${isRtl ? 'يوم' : 'Days'}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulated Impact Status Box */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-600 animate-spin-slow shrink-0" />
                    <span>
                      {isRtl 
                        ? `تقييم الكوادر: إزاحة المخطط الزمني بمقدار ${timelineShiftDays} يوماً تولد توصيات موازنة لحماية استقرارية الفرق الميدانية.`
                        : `Capacity Scan: A ${timelineShiftDays}-day timeline shift recalculates availability matrices and generates safe reallocations.`}
                    </span>
                  </div>
                  <span className="font-mono font-black px-2 py-0.5 bg-amber-500/20 rounded text-[10px] shrink-0">
                    {balancingSuggestions.length} {isRtl ? 'توصية موازنة' : 'Reallocations'}
                  </span>
                </div>
              </div>

              {/* Section 2: Reallocation Recommendations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    <span>{isRtl ? 'توصيات الموازنة والتوزيع التلقائي الذكي' : 'Optimal Reallocation Recommendations'}</span>
                  </h3>
                  {balancingSuggestions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleApplyAllReallocations}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>{isRtl ? 'تطبيق كافة التوصيات المقترحة' : 'Apply All Reallocations'}</span>
                    </button>
                  )}
                </div>

                {balancingSuggestions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-zinc-950 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                      {isRtl ? 'توزيع الكوادر متوازن كلياً بنسبة 100%' : 'Workload is Perfectly Balanced!'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {isRtl ? 'جميع الكوادر تعمل في حدود طاقتها الاستيعابية ولم يتم اكتشاف أي إجهاد أو تضارب.' : 'All field resources operate within normal FTE capacity bounds.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {balancingSuggestions.map((sug, idx) => {
                      const isApplied = appliedSuggestions.includes(sug.id);

                      return (
                        <div 
                          key={sug.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isApplied
                              ? 'bg-emerald-500/5 border-emerald-500/30'
                              : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 shadow-sm hover:border-amber-500/50'
                          }`}
                        >
                          {/* Card Top Badge */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded text-[10px] font-mono font-bold">
                                {isRtl ? 'توصية #' : 'Rec #'}{idx + 1}
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-white">
                                {lang === 'ar' ? sug.projectNameAr : sug.projectNameEn}
                              </span>
                              <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono">
                                {lang === 'ar' ? sug.roleAr : sug.roleEn}
                              </span>
                            </div>

                            <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {isRtl ? `نقل عبء ${sug.shiftPercent}% FTE` : `Transfer ${sug.shiftPercent}% FTE`}
                            </span>
                          </div>

                          {/* Source & Target Resource Flow */}
                          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center my-3">
                            
                            {/* Source Resource (Overallocated or High Load) */}
                            <div className="md:col-span-5 p-3 rounded-lg bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                  {isRtl ? 'الموظف الحالي (ضغط مرتفع)' : 'Source Staff (High Workload)'}
                                </span>
                                <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                                  {sug.sourceCurrentLoad}% FTE
                                </span>
                              </div>
                              <p className="text-xs font-black text-slate-800 dark:text-white">
                                {lang === 'ar' ? sug.sourceResourceNameAr : sug.sourceResourceNameEn}
                              </p>
                              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                                <span>{isRtl ? 'العبء بعد التعديل:' : 'New Load:'}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {sug.sourceNewLoad}% FTE (آمن)
                                </span>
                              </div>
                            </div>

                            {/* Arrow Transfer Indicator */}
                            <div className="md:col-span-1 flex justify-center items-center py-1">
                              <div className="p-2 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                {isRtl ? (
                                  <ArrowLeft className="w-4 h-4 text-amber-500 animate-pulse" />
                                ) : (
                                  <ArrowRight className="w-4 h-4 text-amber-500 animate-pulse" />
                                )}
                              </div>
                            </div>

                            {/* Target Resource (Available with Capacity) */}
                            <div className="md:col-span-5 p-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                  {isRtl ? 'الموظف البديل (ساعات متوفرة)' : 'Target Staff (Spare Capacity)'}
                                </span>
                                <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                                  {sug.targetCurrentLoad}% FTE
                                </span>
                              </div>
                              <p className="text-xs font-black text-slate-800 dark:text-white">
                                {lang === 'ar' ? sug.targetResourceNameAr : sug.targetResourceNameEn}
                              </p>
                              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                                <span>{isRtl ? 'العبء بعد الاستلام:' : 'New Load:'}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {sug.targetNewLoad}% FTE (استغلال مثالي)
                                </span>
                              </div>
                            </div>

                          </div>

                          {/* Reason & Impact Details */}
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-[11px] space-y-1">
                            <p className="text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                              <span className="font-bold text-slate-900 dark:text-white">{isRtl ? 'سبب التغيير:' : 'Trigger:'} </span>
                              {lang === 'ar' ? sug.reasonAr : sug.reasonEn}
                            </p>
                            <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed font-semibold">
                              <span className="font-bold">{isRtl ? 'الأثر المتوقع:' : 'Impact:'} </span>
                              {lang === 'ar' ? sug.impactAr : sug.impactEn}
                            </p>
                          </div>

                          {/* Card Action */}
                          <div className="mt-3 flex justify-end">
                            {isApplied ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-black border border-emerald-500/20">
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                {isRtl ? 'تم تطبيق الموازنة' : 'Reallocation Applied'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApplyReallocation(sug)}
                                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                                <span>{isRtl ? 'تطبيق إعادة التوزيع' : 'Apply Reallocation'}</span>
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-zinc-400">
                {isRtl 
                  ? 'يتم تحديث المخطط الزمني ومصفوفة الكوادر فورياً بمجرد الاعتماد.' 
                  : 'Changes sync immediately with Gantt Timeline and capacity metrics.'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoBalanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
                {balancingSuggestions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyAllReallocations}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{isRtl ? 'اعتماد الموازنة الميدانية' : 'Apply All Reallocations'}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
    </ModuleShell>
  );
}

const BurndownChart = ({ 
  totalPlannedDays, 
  elapsedDays, 
  progress, 
  remainingDays, 
  isDelayed, 
  delayDays,
  lang 
}: { 
  totalPlannedDays: number; 
  elapsedDays: number; 
  progress: number; 
  remainingDays: number; 
  isDelayed: boolean; 
  delayDays: number;
  lang: 'ar' | 'en';
}) => {
  const isRtl = lang === 'ar';
  
  // SVG coordinates: Width = 300, Height = 100
  const width = 300;
  const height = 100;
  const paddingLeft = 30;
  const paddingRight = 20;
  const paddingTop = 10;
  const paddingBottom = 20;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  // Planned X ends at totalPlannedDays. Forecasted X ends at elapsedDays + remainingDays.
  const maxDays = Math.max(totalPlannedDays, elapsedDays + remainingDays);
  
  const getX = (days: number) => {
    return paddingLeft + (days / maxDays) * chartWidth;
  };
  
  const getY = (remProgress: number) => {
    return paddingTop + (remProgress / 100) * chartHeight;
  };
  
  // Points
  const pStart = { x: getX(0), y: getY(100) };
  const pEnd = { x: getX(totalPlannedDays), y: getY(0) };
  
  const aStart = { x: getX(0), y: getY(100) };
  const aToday = { x: getX(elapsedDays), y: getY(100 - progress) };
  const aForecast = { x: getX(elapsedDays + remainingDays), y: getY(0) };

  return (
    <div className="bg-slate-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black uppercase text-slate-400">
          {isRtl ? 'مسار حرق المهام المتبقية' : 'Work Burn-down Projection'}
        </span>
        <div className="flex gap-2 text-[8px] font-bold">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-0.5 bg-slate-300 dark:bg-zinc-600 block" />
            {isRtl ? 'المخطط' : 'Planned'}
          </span>
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="w-2 h-0.5 bg-emerald-500 block" />
            {isRtl ? 'المنجز' : 'Actual'}
          </span>
          <span className={`flex items-center gap-1 ${isDelayed ? 'text-rose-500' : 'text-blue-500'}`}>
            <span className={`w-2 h-0.5 border-t border-dashed ${isDelayed ? 'border-rose-500' : 'border-blue-500'} block`} />
            {isRtl ? 'التنبؤ' : 'Forecast'}
          </span>
        </div>
      </div>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        {/* Grid Lines */}
        <line x1={paddingLeft} y1={getY(100)} x2={width - paddingRight} y2={getY(100)} stroke="currentColor" className="text-slate-200 dark:text-zinc-800/50" strokeWidth={1} />
        <line x1={paddingLeft} y1={getY(50)} x2={width - paddingRight} y2={getY(50)} stroke="currentColor" className="text-slate-200 dark:text-zinc-800/50" strokeWidth={1} strokeDasharray="3 3" />
        <line x1={paddingLeft} y1={getY(0)} x2={width - paddingRight} y2={getY(0)} stroke="currentColor" className="text-slate-200 dark:text-zinc-800/50" strokeWidth={1} />
        
        {/* Vertical lines for milestone dates */}
        <line x1={pEnd.x} y1={paddingTop} x2={pEnd.x} y2={height - paddingBottom} stroke="currentColor" className="text-slate-300 dark:text-zinc-700" strokeWidth={1} strokeDasharray="2 2" />
        {isDelayed && (
          <line x1={aForecast.x} y1={paddingTop} x2={aForecast.x} y2={height - paddingBottom} stroke="currentColor" className="text-rose-400 dark:text-rose-800/60" strokeWidth={1} strokeDasharray="2 2" />
        )}

        {/* Y Axis Labels */}
        <text x={paddingLeft - 5} y={getY(100) + 3} textAnchor="end" className="fill-slate-400 dark:fill-zinc-500 text-[8px] font-mono font-bold">100%</text>
        <text x={paddingLeft - 5} y={getY(50) + 3} textAnchor="end" className="fill-slate-400 dark:fill-zinc-500 text-[8px] font-mono font-bold">50%</text>
        <text x={paddingLeft - 5} y={getY(0) + 3} textAnchor="end" className="fill-slate-400 dark:fill-zinc-500 text-[8px] font-mono font-bold">0%</text>

        {/* X Axis Labels */}
        <text x={pStart.x} y={height - paddingBottom + 12} textAnchor="middle" className="fill-slate-400 dark:fill-zinc-500 text-[7px] font-bold">
          {isRtl ? 'البدء' : 'Start'}
        </text>
        <text x={pEnd.x} y={height - paddingBottom + 12} textAnchor="middle" className="fill-slate-500 dark:fill-zinc-400 text-[7px] font-bold">
          {isRtl ? 'المخطط' : 'Planned'}
        </text>
        {isDelayed && (
          <text x={aForecast.x} y={height - paddingBottom + 12} textAnchor="middle" className="fill-rose-500 dark:fill-rose-400 text-[7px] font-bold">
            +{delayDays}d
          </text>
        )}

        {/* Planned Line (gray/dashed) */}
        <line x1={pStart.x} y1={pStart.y} x2={pEnd.x} y2={pEnd.y} stroke="currentColor" className="text-slate-300 dark:text-zinc-700" strokeWidth={1.5} />

        {/* Actual Line (emerald) */}
        <line x1={aStart.x} y1={aStart.y} x2={aToday.x} y2={aToday.y} stroke="#10b981" strokeWidth={2} />
        
        {/* Forecast Line (dashed - blue or red) */}
        <line 
          x1={aToday.x} 
          y1={aToday.y} 
          x2={aForecast.x} 
          y2={aForecast.y} 
          stroke={isDelayed ? '#f43f5e' : '#3b82f6'} 
          strokeWidth={2} 
          strokeDasharray="4 4" 
        />

        {/* Points indicator */}
        <circle cx={aToday.x} cy={aToday.y} r={3} fill="#10b981" />
        <circle cx={aForecast.x} cy={aForecast.y} r={3} fill={isDelayed ? '#f43f5e' : '#3b82f6'} />
        <circle cx={pEnd.x} cy={pEnd.y} r={2} fill="#94a3b8" />
      </svg>
    </div>
  );
};
