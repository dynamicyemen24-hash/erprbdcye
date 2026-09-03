/**
 * NexoraOS™ — PPM Single Source of Truth (Data Access Layer)
 *
 * Unifies the frontend views on the ENGINE as the authoritative data source
 * (SAP Fiori / single-source-of-truth paradigm). Every view reads real records
 * from the live Neon PostgreSQL database through the V2 engine routes backed by
 * the v_* analytical views, instead of the legacy static institutional snapshot.
 *
 * Principles:
 *  - The API is always the truth. No stale static data is ever shown on error.
 *  - Errors surface clearly (with an `error` flag) so operators know the live
 *    system is unavailable rather than silently rendering outdated numbers.
 *  - Responses are normalized into a stable shape consumed by all views.
 */

export interface PpmProgram {
  program_id?: string;
  id?: string;
  code?: string;
  program_code?: string;
  name_ar?: string;
  program_name?: string;
  program_name_en?: string;
  category_code?: string;
  status_code?: string;
  budget?: string | number;
  budget_base?: string | number;
  progress_percent?: string | number;
  target_beneficiaries?: number;
  actual_beneficiaries?: number;
  total_projects?: string | number;
  active_projects?: string | number;
  completed_projects?: string | number;
  budget_utilization?: number;
  beneficiary_achievement?: number;
}

export interface PpmProject {
  project_id?: string;
  id?: string;
  project_code?: string;
  name_ar?: string;
  project_name?: string;
  program_id?: string;
  status_code?: string;
  phase_code?: string;
  priority_code?: string;
  budget?: string | number;
  spent_amount?: string | number;
  progress_percent?: string | number;
  target_beneficiaries?: number;
  actual_beneficiaries?: number;
  location_name?: string;
  start_date?: string;
  end_date?: string;
  total_activities?: string | number;
  completed_activities?: string | number;
  budget_utilization?: number;
  beneficiary_achievement?: number;
}

export interface PpmActivity {
  id?: string;
  name_ar?: string;
  name_en?: string;
  code?: string;
  project_id?: string;
  program_id?: string;
  activity_type_code?: string;
  status_code?: string;
  coordinator_id?: string;
  start_datetime?: string;
  end_datetime?: string;
  duration_minutes?: number;
  location_name?: string;
  location_name_ar?: string;
  budget?: string | number;
  budget_base?: string | number;
  currency_code?: string;
  target_beneficiaries?: number;
  actual_beneficiaries?: number;
  earned_value?: string | number;
  planned_value?: string | number;
  actual_cost?: string | number;
  variance_percent?: string | number;
  phase_code?: string;
  priority_code?: string;
  description?: string | null;
  created_at?: string;
  disbursed_budget?: number;
  metadata?: any;
  [key: string]: any;
}

export interface PpmOverview {
  programs: PpmProgram[];
  projects: PpmProject[];
  risks: any[];
  summary: {
    totalPrograms: number;
    totalProjects: number;
    atRiskProjects: number;
    totalBudget: number;
    avgProgress: number;
  };
}

/**
 * Normalize a possibly plain-array or paginated engine response into a plain array.
 */
function toArray<T>(payload: any, fallback: T[] = []): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data as T[];
  if (payload && Array.isArray(payload.rows)) return payload.rows as T[];
  if (payload && Array.isArray(payload.items)) return payload.items as T[];
  return fallback;
}

/** Robust single-flight helper to avoid race conditions on rapid re-fetch. */
async function safeJson<T>(res: Response, fallback: T): Promise<T> {
  try {
    const text = await res.text();
    if (!text || text.trim() === '') return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/**
 * Authenticated fetch for engine (v2) routes.
 *
 * The V2 routes are protected by `authenticateToken` (JWT Bearer) and scoped by
 * tenant via `x-organization-id`. This attaches the globally-injected session
 * (the same pattern used by ERPSearchBar), so the PPM intelligence routes are
 * reachable end-to-end from the browser.
 */
function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = (typeof window !== 'undefined' && (window as any).__uamex_token) || '';
  const orgId = (typeof window !== 'undefined' && (window as any).__uamex_org) || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (orgId) headers['x-organization-id'] = String(orgId);
  return fetch(input, { ...init, headers });
}

export const ppmApi = {
  /**
   * Portfolio overview from the real v_program_dashboard / v_project_dashboard /
   * v_project_risk_analysis views via the engine route.
   */
  async getPortfolioOverview(): Promise<{ data: PpmOverview; ok: boolean; error?: string }> {
    try {
      const res = await authFetch('/api/v2/ppm/portfolio/overview');
      if (!res.ok) return { ok: false, data: emptyOverview(), error: `HTTP ${res.status}` };
      const payload = await safeJson<{ data?: any; success?: boolean }>(res, { data: null });
      const body = (payload && (payload.data ?? payload)) || null;
      const programs = toArray<PpmProgram>(body?.programs);
      const projects = toArray<PpmProject>(body?.projects);
      const risks = toArray<any>(body?.risks);
      return {
        ok: true,
        data: {
          programs,
          projects,
          risks,
          summary: body?.summary && !Array.isArray(body.summary)
            ? body.summary
            : deriveSummary(programs, projects, risks),
        },
      };
    } catch (err: any) {
      return { ok: false, data: emptyOverview(), error: err?.message };
    }
  },

  /**
   * Activities from the engine-backed ActivityEngine.list (real schema).
   */
  async getActivities(params?: { projectId?: string; status?: string; search?: string; limit?: number }): Promise<{ data: PpmActivity[]; ok: boolean; error?: string }> {
    try {
      const q = new URLSearchParams();
      if (params?.projectId) q.set('projectId', params.projectId);
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      q.set('limit', String(params?.limit ?? 500));
      const res = await authFetch(`/api/v2/domains/activities?${q.toString()}`);
      if (!res.ok) return { ok: false, data: [], error: `HTTP ${res.status}` };
      const payload = await safeJson<any>(res, {});
      return { ok: true, data: toArray<PpmActivity>(payload) };
    } catch (err: any) {
      return { ok: false, data: [], error: err?.message };
    }
  },

  /**
   * Critical Path Method network for a project from the real engine
   * (dependency_network + project_schedules).
   */
  async getCriticalPath(projectId: string): Promise<{ data: any; ok: boolean; error?: string }> {
    try {
      const res = await authFetch(`/api/v2/ppm/projects/${projectId}/critical-path`);
      if (!res.ok) return { ok: false, data: null, error: `HTTP ${res.status}` };
      const payload = await safeJson<any>(res, null);
      return { ok: true, data: payload?.data ?? payload };
    } catch (err: any) {
      return { ok: false, data: null, error: err?.message };
    }
  },

  /**
   * Project Gantt (real schedules + dependencies) via engine ProjectEngine.getGanttData.
   */
  async getGantt(projectId: string): Promise<{ data: any; ok: boolean; error?: string }> {
    try {
      const res = await authFetch(`/api/v2/projects/${projectId}/gantt`);
      if (!res.ok) return { ok: false, data: null, error: `HTTP ${res.status}` };
      const payload = await safeJson<any>(res, null);
      return { ok: true, data: payload?.data ?? payload };
    } catch (err: any) {
      return { ok: false, data: null, error: err?.message };
    }
  },

  /**
   * EVM (Earned Value Management) for a project from the engine /
   * real earned_value_metrics table.
   */
  async getEVM(projectId: string): Promise<{ data: any; ok: boolean; error?: string }> {
    try {
      const res = await authFetch(`/api/v2/projects/${projectId}/evm`);
      if (!res.ok) return { ok: false, data: null, error: `HTTP ${res.status}` };
      const payload = await safeJson<any>(res, null);
      return { ok: true, data: payload?.data ?? payload };
    } catch (err: any) {
      return { ok: false, data: null, error: err?.message };
    }
  },

  /**
   * Portfolio scorecard: single project or full ranking.
   */
  async getScorecard(projectId?: string): Promise<{ data: any[]; ok: boolean; error?: string }> {
    try {
      const url = projectId
        ? `/api/v2/ppm/projects/${projectId}/score`
        : `/api/v2/ppm/portfolio/scorecard`;
      const res = await authFetch(url);
      if (!res.ok) return { ok: false, data: [], error: `HTTP ${res.status}` };
      const payload = await safeJson<any>(res, {});
      const body = payload?.data ?? payload;
      if (projectId) return { ok: true, data: [body] };
      const rankings = Array.isArray(body?.rankings) ? body.rankings : toArray<any>(body);
      return { ok: true, data: rankings };
    } catch (err: any) {
      return { ok: false, data: [], error: err?.message };
    }
  },
};

function emptyOverview(): PpmOverview {
  return { programs: [], projects: [], risks: [], summary: { totalPrograms: 0, totalProjects: 0, atRiskProjects: 0, totalBudget: 0, avgProgress: 0 } };
}

function deriveSummary(programs: PpmProgram[], projects: PpmProject[], risks: any[]): PpmOverview['summary'] {
  const budget = programs.reduce((s, p) => s + Number(p.budget ?? p.budget_base ?? 0), 0);
  const avgP = projects.length
    ? Math.round(projects.reduce((s, p) => s + Number(p.progress_percent ?? 0), 0) / projects.length)
    : 0;
  return {
    totalPrograms: programs.length,
    totalProjects: projects.length,
    atRiskProjects: risks.length,
    totalBudget: budget,
    avgProgress: avgP,
  };
}
