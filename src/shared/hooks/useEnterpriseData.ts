import { useState, useEffect, useCallback } from 'react';
import { EnterpriseApiService } from '../../core/services/apiService';

export interface UseEnterpriseDataOptions<T> {
  initialData?: T;
  params?: Record<string, any>;
  autoFetch?: boolean;
}

export function useEnterpriseData<T>(endpoint: string, options: UseEnterpriseDataOptions<T> = {}) {
  const { initialData, params, autoFetch = true } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await EnterpriseApiService.get<T>(endpoint, { params });
      setData(result);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return { data, setData, loading, error, refetch: fetchData };
}
