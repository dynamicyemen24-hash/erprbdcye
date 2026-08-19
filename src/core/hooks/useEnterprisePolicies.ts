import { useState, useEffect, useCallback } from 'react';

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

export function useEnterprisePolicies() {
  const [state, setState] = useState<EnterpriseSettingsState>({
    systemSettings: {},
    orgSettings: {},
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('rbd_token') || sessionStorage.getItem('rbd_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [sysRaw, orgRaw] = await Promise.all([
        fetch('/api/tables/system_settings', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/tables/organization_settings', { headers }).then(r => r.ok ? r.json() : [])
      ]);

      const sysRes = Array.isArray(sysRaw) ? sysRaw : (sysRaw?.data || []);
      const orgRes = Array.isArray(orgRaw) ? orgRaw : (orgRaw?.data || []);

      const sysMap: Record<string, any> = {};
      (Array.isArray(sysRes) ? sysRes : []).forEach((item: any) => {
        let val = item.setting_value;
        if (typeof val === 'string') {
          try { val = JSON.parse(val); } catch { /* keep raw */ }
        }
        sysMap[item.setting_key] = val;
      });

      const orgMap: Record<string, any> = {};
      (Array.isArray(orgRes) ? orgRes : []).forEach((item: any) => {
        let val = item.setting_value;
        if (typeof val === 'string') {
          try { val = JSON.parse(val); } catch { /* keep raw */ }
        }
        orgMap[item.setting_key] = val;
      });

      setState({
        systemSettings: sysMap,
        orgSettings: orgMap,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSystemSetting = useCallback(<T>(key: string, fallback: T): T => {
    if (state.systemSettings[key] !== undefined && state.systemSettings[key] !== null) {
      return state.systemSettings[key] as T;
    }
    return fallback;
  }, [state.systemSettings]);

  const getOrgPolicy = useCallback(<T>(key: string, fallback: T): T => {
    if (state.orgSettings[key] !== undefined && state.orgSettings[key] !== null) {
      return state.orgSettings[key] as T;
    }
    return fallback;
  }, [state.orgSettings]);

  const updateSettingInDB = useCallback(async (key: string, value: any, description?: string) => {
    const token = localStorage.getItem('rbd_token') || sessionStorage.getItem('rbd_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/tables/system_settings', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        setting_key: key,
        setting_value: JSON.stringify(value),
        setting_type: typeof value,
        description: description || 'Updated via enterprise console'
      })
    });

    if (res.ok) {
      setState(prev => ({
        ...prev,
        systemSettings: { ...prev.systemSettings, [key]: value },
        lastUpdated: new Date()
      }));
    }
    return res.ok;
  }, []);

  return {
    ...state,
    refresh: fetchSettings,
    getSystemSetting,
    getOrgPolicy,
    updateSettingInDB
  };
}
