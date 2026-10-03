import { useState, useCallback } from 'react';
import { useNotifications } from './useNotifications';

interface UseApiOptions {
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

/** Read the session JWT so every call is permission-scoped server-side. */
function readAuthToken(): string | null {
  try {
    return (
      localStorage.getItem('rbd_token') ||
      sessionStorage.getItem('rbd_token') ||
      localStorage.getItem('roh_token') ||
      sessionStorage.getItem('roh_token') ||
      null
    );
  } catch {
    return null;
  }
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const notifications = useNotifications();

  const execute = useCallback(async (url: string, init?: RequestInit): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const token = readAuthToken();
      const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) baseHeaders['Authorization'] = `Bearer ${token}`;
      const response = await fetch(url, {
        ...init,
        headers: { ...baseHeaders, ...(init?.headers as Record<string, string>) },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        if (response.status === 401 || response.status === 403) setForbidden(true);
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      if (options.showToast && options.successMessage) {
        notifications.success(options.successMessage);
      }
      return result;
    } catch (e: any) {
      setError(e.message);
      if (options.showToast) {
        notifications.error(options.errorMessage || 'Operation failed', e.message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [options, notifications]);

  const reset = useCallback(() => { setData(null); setError(null); setForbidden(false); setLoading(false); }, []);

  return { data, loading, error, forbidden, execute, reset };
}
