import { useCallback } from 'react';

export function useNotifications() {
  const notify = useCallback((title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    window.dispatchEvent(new CustomEvent('nexora:toast', {
      detail: { title, message, type, id: Date.now().toString() }
    }));
  }, []);

  const success = useCallback((title: string, message?: string) => notify(title, message || '', 'success'), [notify]);
  const error = useCallback((title: string, message?: string) => notify(title, message || '', 'error'), [notify]);
  const warning = useCallback((title: string, message?: string) => notify(title, message || '', 'warning'), [notify]);
  const info = useCallback((title: string, message?: string) => notify(title, message || '', 'info'), [notify]);

  const promise = useCallback(async <T>(
    fn: () => Promise<T>,
    messages: { loading: string; success: string; error: string }
  ): Promise<T | null> => {
    notify(messages.loading, '', 'info');
    try {
      const result = await fn();
      success(messages.success);
      return result;
    } catch (e: any) {
      error(messages.error, e.message);
      return null;
    }
  }, [notify, success, error]);

  return { notify, success, error, warning, info, promise };
}
