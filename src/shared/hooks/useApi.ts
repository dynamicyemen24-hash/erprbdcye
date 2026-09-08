import { useState, useCallback } from 'react';
import { useNotifications } from './useNotifications';

interface UseApiOptions {
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notifications = useNotifications();

  const execute = useCallback(async (url: string, init?: RequestInit): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
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

  const reset = useCallback(() => { setData(null); setError(null); setLoading(false); }, []);

  return { data, loading, error, execute, reset };
}
