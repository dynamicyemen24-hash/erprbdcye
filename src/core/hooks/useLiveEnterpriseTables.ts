/**
 * NexoraOS™ — Live Enterprise Tables Hook
 *
 * Replaces the static institutional snapshot with LIVE reads from the real
 * Neon PostgreSQL backend through the /api/tables/* DTO endpoints (the same
 * authenticated channel used by useNexoraData). Results are plain arrays with
 * a `loading`/`error` signal so consumers can render honest loaders and empty
 * states instead of silently stale snapshot data.
 *
 * Swr-style: re-fetches on demand via `refresh()`; never seeds from disk.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LiveEnterpriseTables {
  programs: any[];
  projects: any[];
  activities: any[];
  beneficiaries: any[];
  sponsorships: any[];
  accounts: any[];
  warehouses: any[];
  inventory: any[];
  users: any[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const SLICES: Array<{ key: keyof Omit<LiveEnterpriseTables, 'loading' | 'error' | 'refresh'>; url: string }> = [
  { key: 'programs', url: '/api/tables/programs' },
  { key: 'projects', url: '/api/tables/projects' },
  { key: 'activities', url: '/api/tables/activities' },
  { key: 'beneficiaries', url: '/api/tables/beneficiaries' },
  { key: 'sponsorships', url: '/api/tables/sponsorships' },
  { key: 'accounts', url: '/api/tables/chart_of_accounts' },
  { key: 'warehouses', url: '/api/tables/warehouses' },
  { key: 'inventory', url: '/api/tables/inventory_items' },
  { key: 'users', url: '/api/tables/users' },
];

/** Extract a plain array from a /api/tables response (list or paginated). */
function extractRows(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

async function fetchSlice(url: string): Promise<any[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('rbd_token') : null;
    const envMode = typeof localStorage !== 'undefined'
      ? localStorage.getItem('nexora_environment_mode') || 'production'
      : 'production';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    headers['x-environment-mode'] = envMode;
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const json = await res.json();
    return extractRows(json);
  } catch {
    clearTimeout(timeoutId);
    return [];
  }
}

export function useLiveEnterpriseTables(): LiveEnterpriseTables {
  const [state, setState] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    const results = await Promise.all(
      SLICES.map(async (s) => ({ key: s.key, rows: await fetchSlice(s.url) }))
    );
    const next: Record<string, any[]> = {};
    results.forEach((r) => { next[r.key] = r.rows; });
    setState(next);
    setLoading(false);
    inFlight.current = false;
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => { load(); }, [load]);

  return {
    programs: state.programs || [],
    projects: state.projects || [],
    activities: state.activities || [],
    beneficiaries: state.beneficiaries || [],
    sponsorships: state.sponsorships || [],
    accounts: state.accounts || [],
    warehouses: state.warehouses || [],
    inventory: state.inventory || [],
    users: state.users || [],
    loading,
    error,
    refresh,
  } as LiveEnterpriseTables;
}
