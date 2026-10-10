/**
 * NexoraOS™ — Live Enterprise Tables Hook (facade)
 *
 * DEBT PAID: this hook used to re-fetch 9 `/api/tables/*` slices that
 * `useNexoraData` (mounted in `App`) already prefetches — every mount doubled
 * network traffic for programs/projects/activities/beneficiaries/
 * sponsorships/accounts/users.
 *
 * It is now a FACADE, not a second fetcher:
 *   - the 7 shared slices come from the app-wide snapshot
 *     (`readNexoraSnapshot`/`subscribeNexoraSnapshot` in `useNexoraData`),
 *   - only `warehouses` + `inventory_items` (absent from the snapshot) are
 *     fetched here.
 *
 * Props, return shape, and the honest loading/empty contract are unchanged,
 * so the single consumer (`InstitutionalRoleWorkspaces`) is untouched.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  readNexoraSnapshot,
  subscribeNexoraSnapshot,
  type NexoraDataState,
} from './useNexoraData';

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

/** Slices the app-wide snapshot does NOT carry — the only ones fetched here. */
const EXTRA_SLICES = [
  { key: 'warehouses', url: '/api/tables/warehouses' },
  { key: 'inventory', url: '/api/tables/inventory_items' },
] as const;

interface SharedSlices {
  programs: any[];
  projects: any[];
  activities: any[];
  beneficiaries: any[];
  sponsorships: any[];
  accounts: any[];
  users: any[];
}

function pickShared(snap: NexoraDataState | null): SharedSlices {
  return {
    programs: snap?.programs ?? [],
    projects: snap?.projects ?? [],
    activities: snap?.activities ?? [],
    beneficiaries: snap?.beneficiaries ?? [],
    sponsorships: snap?.sponsorships ?? [],
    accounts: snap?.financialAccounts ?? [],
    users: snap?.users ?? [],
  };
}

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

const EMPTY_SHARED: SharedSlices = {
  programs: [],
  projects: [],
  activities: [],
  beneficiaries: [],
  sponsorships: [],
  accounts: [],
  users: [],
};

export function useLiveEnterpriseTables(): LiveEnterpriseTables {
  const [shared, setShared] = useState<SharedSlices>(() => {
    const snap = readNexoraSnapshot();
    return snap ? pickShared(snap) : EMPTY_SHARED;
  });
  const [snapSeen, setSnapSeen] = useState<boolean>(() => readNexoraSnapshot() !== null);
  const [extra, setExtra] = useState<Record<string, any[]>>({});
  const [extraLoading, setExtraLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const snap = readNexoraSnapshot();
    if (snap) {
      setShared(pickShared(snap));
      setSnapSeen(true);
    }
    return subscribeNexoraSnapshot((next) => {
      setShared(pickShared(next));
      setSnapSeen(true);
    });
  }, []);

  const loadExtra = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setExtraLoading(true);
    setError(null);
    const results = await Promise.all(
      EXTRA_SLICES.map(async (s) => ({ key: s.key, rows: await fetchSlice(s.url) }))
    );
    const next: Record<string, any[]> = {};
    results.forEach((r) => {
      next[r.key] = r.rows;
    });
    setExtra(next);
    setExtraLoading(false);
    inFlight.current = false;
  }, []);

  useEffect(() => {
    loadExtra();
  }, [loadExtra]);

  const refresh = useCallback(() => {
    const snap = readNexoraSnapshot();
    if (snap) {
      setShared(pickShared(snap));
      setSnapSeen(true);
    }
    loadExtra();
  }, [loadExtra]);

  return {
    programs: shared.programs,
    projects: shared.projects,
    activities: shared.activities,
    beneficiaries: shared.beneficiaries,
    sponsorships: shared.sponsorships,
    accounts: shared.accounts,
    warehouses: extra.warehouses || [],
    inventory: extra.inventory || [],
    users: shared.users,
    loading: extraLoading && !snapSeen,
    error,
    refresh,
  };
}
