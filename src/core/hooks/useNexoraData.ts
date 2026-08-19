import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Program, 
  Project, 
  User as UserType, 
  Role, 
  Currency, 
  Organization, 
  OrganizationSetting, 
  SystemSetting 
} from '../types';
import { persistenceService } from '../services/persistence';
import { performanceMonitor } from '../telemetry/performanceMonitor';

export interface NexoraDataState {
  programs: Program[];
  projects: Project[];
  users: UserType[];
  roles: Role[];
  currencies: Currency[];
  organizations: Organization[];
  orgSettings: OrganizationSetting[];
  sysSettings: SystemSetting[];
  beneficiaries: any[];
  sponsorships: any[];
  approvalRequests: any[];
  financialAccounts: any[];
  activities: any[];
  procurementTenders: any[];
  predictiveAnalytics: any;
  strategicPlan: any;
  investmentSummary: any;
  serverStats: any;
  consolidatedKpis: any;
  loading: boolean;
  error: string | null;
  systemAlerts: string[];

  // Global Data Prefetching & Cache Warmup State
  isCacheWarmed: boolean;
  isPrefetching: boolean;
  prefetchProgress: number; // 0 to 100%
  lastPrefetchedAt: number | null;
  prefetchedModules: Record<string, boolean>;
}

// In-memory global singleton cache for instant hook re-hydration across component boundaries
let inMemoryGlobalCache: NexoraDataState | null = null;

interface EndpointConfig {
  key: keyof NexoraDataState;
  url: string;
  module: string;
  tier: 1 | 2; // Tier 1: Core/Critical (Dashboard & Main Navigation), Tier 2: Operational Modules
}

const PREFETCH_ENDPOINTS: EndpointConfig[] = [
  // Tier 1: Minimal Essential Critical Datasets (Immediate Shell & Dashboard)
  { key: 'programs', url: '/api/tables/programs', module: 'programs', tier: 1 },
  { key: 'projects', url: '/api/tables/projects', module: 'projects', tier: 1 },
  { key: 'organizations', url: '/api/tables/organizations', module: 'organizations', tier: 1 },
  { key: 'serverStats', url: '/api/dashboard-stats', module: 'dashboard', tier: 1 },
  { key: 'consolidatedKpis', url: '/api/nexora-consolidated-kpis', module: 'dashboard', tier: 1 },
  { key: 'currencies', url: '/api/tables/currencies', module: 'currencies', tier: 1 },

  // Tier 2: Secondary & Operational Datasets (Background Idle Warmup)
  { key: 'users', url: '/api/tables/users', module: 'users', tier: 2 },
  { key: 'roles', url: '/api/tables/roles', module: 'roles', tier: 2 },
  { key: 'orgSettings', url: '/api/tables/organization_settings', module: 'settings', tier: 2 },
  { key: 'sysSettings', url: '/api/tables/system_settings', module: 'settings', tier: 2 },
  { key: 'approvalRequests', url: '/api/tables/approval_requests', module: 'governance', tier: 2 },
  { key: 'beneficiaries', url: '/api/tables/beneficiaries', module: 'community', tier: 1 },
  { key: 'sponsorships', url: '/api/tables/sponsorships', module: 'community', tier: 1 },
  { key: 'financialAccounts', url: '/api/tables/chart_of_accounts', module: 'finance', tier: 2 },
  { key: 'activities', url: '/api/tables/activities', module: 'operations', tier: 1 },
  { key: 'procurementTenders', url: '/api/tables/procurement_tenders', module: 'procurement', tier: 2 },
  { key: 'predictiveAnalytics', url: '/api/predictive-analytics', module: 'analytics', tier: 2 },
  { key: 'strategicPlan', url: '/api/strategic-plan', module: 'strategy', tier: 2 },
  { key: 'investmentSummary', url: '/api/investment-summary', module: 'investments', tier: 2 },
];

export function useNexoraData(lang: 'ar' | 'en') {
  const prevProjectsRef = useRef<Project[]>([]);
  const isFetchingRef = useRef<boolean>(false);

  const [data, setData] = useState<NexoraDataState>(() => {
    // Phase 0: Instant In-Memory Cache Hydration (<1ms)
    if (inMemoryGlobalCache) {
      return {
        ...inMemoryGlobalCache,
        loading: false,
        isCacheWarmed: true
      };
    }

    return {
      programs: [],
      projects: [],
      users: [],
      roles: [],
      currencies: [],
      organizations: [],
      orgSettings: [],
      sysSettings: [],
      beneficiaries: [],
      sponsorships: [],
      approvalRequests: [],
      financialAccounts: [],
      activities: [],
      procurementTenders: [],
      predictiveAnalytics: null,
      strategicPlan: null,
      investmentSummary: null,
      serverStats: null,
      consolidatedKpis: null,
      loading: true,
      error: null,
      systemAlerts: [],
      isCacheWarmed: false,
      isPrefetching: false,
      prefetchProgress: 0,
      lastPrefetchedAt: null,
      prefetchedModules: {},
    };
  });

  const dataRef = useRef<NexoraDataState>(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Attempt to preload cached view models from IndexedDB on startup (SWR paradigm)
  useEffect(() => {
    let isSubscribed = true;
    async function loadCachedData() {
      if (dataRef.current.isCacheWarmed && dataRef.current.programs.length > 0) return;

      try {
        const cached = await persistenceService.get<any>('view_models', 'nexora_full_state_v2');
        if (cached && isSubscribed) {
          console.log('[GlobalPrefetch] Warmed up cache from IndexedDB persistence layer.');
          const warmedState = {
            ...cached,
            loading: false,
            isCacheWarmed: true,
            prefetchProgress: 100
          };
          inMemoryGlobalCache = warmedState;
          setData(prev => ({
            ...prev,
            ...warmedState
          }));
        }
      } catch (err) {
        console.warn('[Persistence] Failed to load offline cache startup state:', err);
      }
    }
    loadCachedData();
    return () => {
      isSubscribed = false;
    };
  }, []);

  /**
   * Executes a two-tiered Global Prefetching & Cache Warmup Cycle.
   */
  const fetchAllData = useCallback(async (forced: boolean = false) => {
    if (isFetchingRef.current && !forced) return;
    isFetchingRef.current = true;

    setData(prev => ({ 
      ...prev, 
      isPrefetching: true,
      loading: prev.programs.length === 0 && !prev.isCacheWarmed // Keep UI responsive if cache is available
    }));

    const startTime = performance.now();
    const totalEndpoints = PREFETCH_ENDPOINTS.length;
    let completedCount = 0;
    const fetchedResults: Record<string, any> = {};
    const modulesWarmed: Record<string, boolean> = { ...dataRef.current.prefetchedModules };

    const updateProgress = () => {
      completedCount++;
      const progress = Math.min(100, Math.round((completedCount / totalEndpoints) * 100));
      setData(prev => ({ ...prev, prefetchProgress: progress }));
    };

    // Helper to fetch individual endpoint safely
    const fetchEndpoint = async (ep: EndpointConfig) => {
      try {
        const token = localStorage.getItem('rbd_token');
        const envMode = localStorage.getItem('nexora_environment_mode') || 'production';
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['x-environment-mode'] = envMode;
        
        const res = await fetch(ep.url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Normalize paginated responses from /api/tables/* endpoints
        if (json && typeof json === 'object' && Array.isArray(json.data) && json.pagination) {
          fetchedResults[ep.key] = json.data;
        } else {
          fetchedResults[ep.key] = json;
        }
        modulesWarmed[ep.module] = true;
      } catch (err) {
        console.warn(`[GlobalPrefetch] Pre-fetch missed for ${ep.key} (${ep.url}):`, err);
        // Fallback default
        if (ep.key.endsWith('s') || ep.key === 'beneficiaries' || ep.key === 'activities') {
          fetchedResults[ep.key] = dataRef.current[ep.key] || [];
        }
      } finally {
        updateProgress();
      }
    };

    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('critical-data-start');
    }

    try {
      // Phase 1: Tier 1 Critical Endpoints (Dashboard & Navigation)
      const tier1Endpoints = PREFETCH_ENDPOINTS.filter(e => e.tier === 1);
      await Promise.all(tier1Endpoints.map(fetchEndpoint));

      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('critical-data-end');
        try {
          performance.measure('critical-data-load', 'critical-data-start', 'critical-data-end');
          const measure = performance.getEntriesByName('critical-data-load')[0];
          console.log(`[StartupPerf] Critical Data loaded in ${Math.round(measure.duration)}ms`);
        } catch (e) { console.error('[NexoraOS] useNexoraData: Failed to measure critical data load performance', e); }
      }

      // Intermediate state update so Dashboard widgets render instantly
      const rawPrograms = (fetchedResults.programs as Program[]) || dataRef.current.programs;
      const rawCurrencies = (fetchedResults.currencies as Currency[]) || dataRef.current.currencies;

      const alerts: string[] = [];
      if (rawPrograms.length === 0) {
        alerts.push(lang === 'ar' ? 'سجلات البرامج الأساسية فارغة، يرجى ملء البيانات لتفادي أخطاء التقارير.' : 'Core programs directory is empty. Complete records to build dashboards.');
      }
      if (rawCurrencies.length === 0) {
        alerts.push(lang === 'ar' ? 'لم يتم العثور على أي عملة نشطة في السجلات.' : 'No active currency ledgers registered.');
      }

      setData(prev => {
        const updated = {
          ...prev,
          ...fetchedResults,
          loading: false,
          isCacheWarmed: true,
          systemAlerts: alerts,
          prefetchedModules: { ...modulesWarmed }
        };
        inMemoryGlobalCache = updated;
        return updated;
      });

      // Phase 2: Tier 2 Operational Modules (Background Idle Scheduling)
      const tier2Endpoints = PREFETCH_ENDPOINTS.filter(e => e.tier === 2);
      
      const runTier2 = async () => {
        await Promise.all(tier2Endpoints.map(fetchEndpoint));

        const endTime = performance.now();
        const durationMs = endTime - startTime;
        performanceMonitor.recordApiLatency('/api/v1/swr/global-prefetch', durationMs, 200, 'GET');

        setData(prev => {
          const finalState: NexoraDataState = {
            ...prev,
            ...fetchedResults,
            loading: false,
            isCacheWarmed: true,
            isPrefetching: false,
            prefetchProgress: 100,
            lastPrefetchedAt: Date.now(),
            prefetchedModules: { ...modulesWarmed }
          };

          inMemoryGlobalCache = finalState;
          return finalState;
        });

        // Warm up client persistence IndexedDB cache (TTL 30 min)
        if (inMemoryGlobalCache) {
          await persistenceService.set('view_models', 'nexora_full_state_v2', inMemoryGlobalCache, 1000 * 60 * 30);
        }
        console.log(`[GlobalPrefetch] Cache fully warmed in ${Math.round(durationMs)}ms. Operational modules ready.`);
      };

        // Schedule Tier 2 background warmup after initial rendering has settled (1500ms delay)
        setTimeout(() => {
          runTier2();
        }, 1500);

    } catch (err: any) {
      console.error('[GlobalPrefetch] Critical prefetch cycle error:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        isPrefetching: false,
        error: prev.programs.length > 0 ? null : (err.message || 'Error establishing enterprise connection.')
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [lang]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /**
   * On-demand prefetching for specific operational modules (e.g., when hovering tab or menu)
   */
  const prefetchModule = useCallback(async (moduleKey: string) => {
    if (dataRef.current.prefetchedModules[moduleKey]) return; // Already warmed

    const targetEndpoints = PREFETCH_ENDPOINTS.filter(e => e.module === moduleKey);
    if (targetEndpoints.length === 0) return;

    console.log(`[GlobalPrefetch] On-demand prefetching module: [${moduleKey}]`);
    setData(prev => ({ ...prev, isPrefetching: true }));

    const updates: Record<string, any> = {};
    await Promise.all(
      targetEndpoints.map(async (ep) => {
        try {
          const token = localStorage.getItem('rbd_token');
          const envMode = localStorage.getItem('nexora_environment_mode') || 'production';
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          headers['x-environment-mode'] = envMode;
          
          const res = await fetch(ep.url, { headers });
          if (res.ok) {
            const json = await res.json();
            if (json && typeof json === 'object' && Array.isArray(json.data) && json.pagination) {
              updates[ep.key] = json.data;
            } else {
              updates[ep.key] = json;
            }
          }
        } catch (e) {
          console.warn(`[GlobalPrefetch] Module fetch failed for ${ep.key}:`, e);
        }
      })
    );

    setData(prev => {
      const updated = {
        ...prev,
        ...updates,
        isPrefetching: false,
        prefetchedModules: {
          ...prev.prefetchedModules,
          [moduleKey]: true
        }
      };
      inMemoryGlobalCache = updated;
      return updated;
    });
  }, []);

  /**
   * Manually trigger cache warmup
   */
  const warmupCache = useCallback(async () => {
    await fetchAllData(true);
  }, [fetchAllData]);

  /**
   * Clears the persistence cache
   */
  const clearCache = useCallback(async () => {
    inMemoryGlobalCache = null;
    await persistenceService.delete('view_models', 'nexora_full_state_v2');
    setData(prev => ({
      ...prev,
      isCacheWarmed: false,
      prefetchedModules: {}
    }));
  }, []);

  // Reactive Effect to handle systemAlerts including project status changes
  useEffect(() => {
    if (data.loading) return;

    const alerts: string[] = [];
    if (data.programs.length === 0) {
      alerts.push(lang === 'ar' ? 'سجلات البرامج الأساسية فارغة، يرجى ملء البيانات لتفادي أخطاء التقارير.' : 'Core programs directory is empty. Complete records to build dashboards.');
    }
    if (data.currencies.length === 0) {
      alerts.push(lang === 'ar' ? 'لم يتم العثور على أي عملة نشطة في السجلات.' : 'No active currency ledgers registered.');
    }

    // Add alert for any project currently 'delayed' or 'critical'
    data.projects.forEach((proj: Project) => {
      const isDelayed = proj.status_code === 'delayed';
      const isCritical = proj.status_code === 'critical' || proj.risk_level === 'CRITICAL';
      if (isDelayed || isCritical) {
        const statusText = isDelayed ? (lang === 'ar' ? 'متأخر' : 'Delayed') : (lang === 'ar' ? 'حرج' : 'Critical');
        alerts.push(lang === 'ar'
          ? `🚨 تنبيه مشروع: المشروع "${proj.name_ar}" حالته الحالية هي [${statusText}].`
          : `🚨 Project Status Alert: "${proj.name_en || proj.name_ar}" is currently [${statusText}].`
        );
      }
    });

    // Detect project status changes to 'Delayed' or 'Critical' compared to prevProjectsRef
    if (prevProjectsRef.current.length > 0) {
      data.projects.forEach((proj: Project) => {
        const prev = prevProjectsRef.current.find(p => p.id === proj.id);
        if (prev) {
          const wasDelayed = prev.status_code === 'delayed';
          const isDelayed = proj.status_code === 'delayed';
          const wasCritical = prev.status_code === 'critical' || prev.risk_level === 'CRITICAL';
          const isCritical = proj.status_code === 'critical' || proj.risk_level === 'CRITICAL';

          const becameDelayed = isDelayed && !wasDelayed;
          const becameCritical = isCritical && !wasCritical;

          if (becameDelayed || becameCritical) {
            const projName = lang === 'ar' ? proj.name_ar : (proj.name_en || proj.name_ar);
            let changeMsg = '';
            if (becameDelayed) {
              changeMsg = lang === 'ar'
                ? `⚡ تغيير الحالة: تم تغيير حالة المشروع "${projName}" إلى متأخر!`
                : `⚡ Status Change: Project "${projName}" status changed to Delayed!`;
            } else {
              changeMsg = lang === 'ar'
                ? `⚡ تغيير الحالة: تم تغيير حالة المشروع "${projName}" إلى حرج!`
                : `⚡ Status Change: Project "${projName}" status changed to Critical!`;
            }
            alerts.push(changeMsg);
          }
        }
      });
    }

    // Update prevProjectsRef
    prevProjectsRef.current = data.projects;

    // Check if systemAlerts changed to prevent infinite loops
    const currentAlertsStr = JSON.stringify(data.systemAlerts);
    const newAlertsStr = JSON.stringify(alerts);
    if (currentAlertsStr !== newAlertsStr) {
      setData(prev => ({ ...prev, systemAlerts: alerts }));
    }
  }, [data.projects, data.programs, data.currencies, data.loading, lang]);

  // Setters for dynamic client-side updates
  const setPrograms = useCallback((programs: Program[]) => setData(prev => ({ ...prev, programs })), []);
  const setProjects = useCallback((projects: Project[]) => setData(prev => ({ ...prev, projects })), []);
  const setUsers = useCallback((users: UserType[]) => setData(prev => ({ ...prev, users })), []);
  const setRoles = useCallback((roles: Role[]) => setData(prev => ({ ...prev, roles })), []);
  const setCurrencies = useCallback((currencies: Currency[]) => setData(prev => ({ ...prev, currencies })), []);
  const setOrganizations = useCallback((organizations: Organization[]) => setData(prev => ({ ...prev, organizations })), []);
  const setBeneficiaries = useCallback((beneficiaries: any[]) => setData(prev => ({ ...prev, beneficiaries })), []);
  const setSponsorships = useCallback((sponsorships: any[]) => setData(prev => ({ ...prev, sponsorships })), []);
  const setApprovalRequests = useCallback((approvalRequests: any[]) => setData(prev => ({ ...prev, approvalRequests })), []);

  return useMemo(() => ({
    ...data,
    refetchAllData: fetchAllData,
    prefetchModule,
    warmupCache,
    clearCache,
    setPrograms,
    setProjects,
    setUsers,
    setRoles,
    setCurrencies,
    setOrganizations,
    setBeneficiaries,
    setSponsorships,
    setApprovalRequests
  }), [
    data,
    fetchAllData,
    prefetchModule,
    warmupCache,
    clearCache,
    setPrograms,
    setProjects,
    setUsers,
    setRoles,
    setCurrencies,
    setOrganizations,
    setBeneficiaries,
    setSponsorships,
    setApprovalRequests
  ]);
}
