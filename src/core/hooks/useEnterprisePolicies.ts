import { useState, useEffect, useCallback } from 'react';
import {
  readNexoraSnapshot,
  subscribeNexoraSnapshot,
  type NexoraDataState,
} from './useNexoraData';

export interface EnterprisePolicy {
  key: string;
  value: any;
  description: string;
  securityLevel?: number;
  category?: string;
}

export interface EnterpriseSettingsState {
  systemSettings: Record<string, any>;
  orgSettings: Record<string, any>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Settings facade (DEBT PAID: single network source for settings).
 *
 * `useNexoraData` (mounted in `App`) already prefetches `system_settings` +
 * `organization_settings` (Tier 2). This hook used to fetch the SAME two
 * endpoints again on every mount — each `HelperToolsPanel` open, each
 * `useAppSettings` consumer, each policies tab visit.
 *
 * It is now a FACADE: settings slices come from the app-wide snapshot
 * (`readNexoraSnapshot`/`subscribeNexoraSnapshot`); the direct fetch below
 * runs ONLY as a fallback when no snapshot exists yet (standalone use,
 * tests). Same props, same return shape — `useAppSettings` and
 * `EnterpriseDomainPoliciesTab` are untouched.
 *
 * Writes (`updateSettingInDB`) go straight to the server AND land in a
 * local overlay that wins over the snapshot until the next snapshot commit
 * (so a just-saved flag reads back instantly, never stale).
 */
function rowsToMap(rows: unknown): Record<string, any> {
  const map: Record<string, any> = {};
  (Array.isArray(rows) ? rows : []).forEach((item: any) => {
    let val = item.setting_value;
    if (typeof val === 'string') {
      try {
        val = JSON.parse(val);
      } catch {
        /* keep raw */
      }
    }
    map[item.setting_key] = val;
  });
  return map;
}

function snapshotMaps(snap: NexoraDataState | null): {
  sys: Record<string, any>;
  org: Record<string, any>;
  at: Date | null;
} {
  if (!snap) return { sys: {}, org: {}, at: null };
  return {
    sys: rowsToMap(snap.sysSettings),
    org: rowsToMap(snap.orgSettings),
    at: typeof snap.lastPrefetchedAt === 'number' ? new Date(snap.lastPrefetchedAt) : null,
  };
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = localStorage.getItem('rbd_token') || sessionStorage.getItem('rbd_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
  return headers;
}

export function useEnterprisePolicies() {
  const [overlay, setOverlay] = useState<{ sys: Record<string, any>; org: Record<string, any> }>({
    sys: {},
    org: {},
  });
  const [snapMaps, setSnapMaps] = useState(() => snapshotMaps(readNexoraSnapshot()));
  const [fallbackMaps, setFallbackMaps] = useState<{
    sys: Record<string, any>;
    org: Record<string, any>;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(() => readNexoraSnapshot() === null);
  const [error, setError] = useState<string | null>(null);
  const [fallbackAt, setFallbackAt] = useState<Date | null>(null);

  // Subscribe to snapshot commits; direct-fetch only when no snapshot exists.
  useEffect(() => {
    const snap = readNexoraSnapshot();
    if (snap) {
      setSnapMaps(snapshotMaps(snap));
      setLoading(false);
      return subscribeNexoraSnapshot((next) => {
        setSnapMaps(snapshotMaps(next));
        setLoading(false);
      });
    }
    let cancelled = false;
    (async () => {
      try {
        const [sysRaw, orgRaw] = await Promise.all([
          fetch('/api/tables/system_settings', { headers: authHeaders() }).then((r) =>
            r.ok ? r.json() : []
          ),
          fetch('/api/tables/organization_settings', { headers: authHeaders() }).then((r) =>
            r.ok ? r.json() : []
          ),
        ]);
        if (cancelled) return;
        const sysRes = Array.isArray(sysRaw) ? sysRaw : sysRaw?.data || [];
        const orgRes = Array.isArray(orgRaw) ? orgRaw : orgRaw?.data || [];
        setFallbackMaps({ sys: rowsToMap(sysRes), org: rowsToMap(orgRes) });
        setFallbackAt(new Date());
        setError(null);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const unsubscribe = subscribeNexoraSnapshot((next) => {
      setSnapMaps(snapshotMaps(next));
      setLoading(false);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const systemSettings = { ...(fallbackMaps?.sys ?? snapMaps.sys), ...overlay.sys };
  const orgSettings = { ...(fallbackMaps?.org ?? snapMaps.org), ...overlay.org };
  const lastUpdated = fallbackAt ?? snapMaps.at;

  const getSystemSetting = useCallback(
    <T,>(key: string, fallback: T): T => {
      if (systemSettings[key] !== undefined && systemSettings[key] !== null) {
        return systemSettings[key] as T;
      }
      return fallback;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(systemSettings)]
  );

  const getOrgPolicy = useCallback(
    <T,>(key: string, fallback: T): T => {
      if (orgSettings[key] !== undefined && orgSettings[key] !== null) {
        return orgSettings[key] as T;
      }
      return fallback;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(orgSettings)]
  );

  const updateSettingInDB = useCallback(async (key: string, value: any, description?: string) => {
    const res = await fetch('/api/tables/system_settings', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        setting_key: key,
        setting_value: JSON.stringify(value),
        setting_type: typeof value,
        description: description || 'Updated via enterprise console',
      }),
    });

    if (res.ok) {
      // Instant read-back: overlay wins over the snapshot until it commits.
      setOverlay((prev) => ({ ...prev, sys: { ...prev.sys, [key]: value } }));
    }
    return res.ok;
  }, []);

  // Refresh through the canonical channel: the app-wide prefetch (App
  // listens for this event) plus an immediate snapshot re-read.
  const refresh = useCallback(() => {
    try {
      window.dispatchEvent(new Event('nexora-refresh-data'));
    } catch {
      /* ignore */
    }
    const snap = readNexoraSnapshot();
    if (snap) {
      setSnapMaps(snapshotMaps(snap));
      setLoading(false);
    } else {
      setLoading(true);
      (async () => {
        try {
          const [sysRaw, orgRaw] = await Promise.all([
            fetch('/api/tables/system_settings', { headers: authHeaders() }).then((r) =>
              r.ok ? r.json() : []
            ),
            fetch('/api/tables/organization_settings', { headers: authHeaders() }).then((r) =>
              r.ok ? r.json() : []
            ),
          ]);
          const sysRes = Array.isArray(sysRaw) ? sysRaw : sysRaw?.data || [];
          const orgRes = Array.isArray(orgRaw) ? orgRaw : orgRaw?.data || [];
          setFallbackMaps({ sys: rowsToMap(sysRes), org: rowsToMap(orgRes) });
          setFallbackAt(new Date());
          setError(null);
        } catch (err: any) {
          setError(err?.message ?? 'Failed to load settings');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  return {
    systemSettings,
    orgSettings,
    loading,
    error,
    lastUpdated,
    refresh,
    getSystemSetting,
    getOrgPolicy,
    updateSettingInDB,
  };
}
