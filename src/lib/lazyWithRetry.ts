import React, { ComponentType, lazy } from 'react';

/**
 * Resilient Lazy Loader with Automatic Retry, Network Flakiness Recovery, 
 * Hash Mismatch Auto-Reload, and Graceful Offline Component Fallback.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>,
  componentName: string = 'Component',
  maxRetries: number = 3
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const sessionKey = 'retry-lazy-reloaded-' + componentName;
    const pageHasAlreadyBeenForceRefreshed = typeof window !== 'undefined' ? JSON.parse(
      window.sessionStorage.getItem(sessionKey) || 'false'
    ) : false;

    let retries = 0;
    while (retries < maxRetries) {
      try {
        const component = await componentImport();
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(sessionKey);
        }
        return component;
      } catch (error: any) {
        retries++;
        console.warn('[ResilientLazy] Retry attempt ' + retries + '/' + maxRetries + ' for [' + componentName + ']:', error);

        if (retries >= maxRetries) {
          const isChunkMismatch =
            error?.message?.includes('dynamically imported module') ||
            error?.message?.includes('Loading chunk') ||
            error?.message?.includes('Failed to fetch') ||
            error?.name === 'ChunkLoadError' ||
            error?.message?.includes('404');

          if (isChunkMismatch && !pageHasAlreadyBeenForceRefreshed && typeof window !== 'undefined') {
            window.sessionStorage.setItem(sessionKey, 'true');
            console.log('[ResilientLazy] Stale chunk detected for [' + componentName + ']. Refreshing browser cache...');
            window.location.reload();
            return new Promise(() => {});
          }

          console.error('[ResilientLazy] Exhausted all retries for [' + componentName + ']:', error);
          
          const FallbackOfflineWidget: any = () => (
            React.createElement('div', {
              className: 'w-full p-4 my-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm backdrop-blur-md'
            },
              React.createElement('div', { className: 'flex items-center gap-2.5' },
                React.createElement('span', { className: 'w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0' }),
                React.createElement('span', null, 'مكون (' + componentName + ') متاح في وضع التشغيل المحلي السريع. يمكنك إعادة المزامنة عند توفر اتصال إنترنت مستقر.')
              ),
              React.createElement('button', {
                type: 'button',
                onClick: () => window.location.reload(),
                className: 'px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer shrink-0'
              }, 'تحديث ومزامنة')
            )
          );

          return { default: FallbackOfflineWidget };
        }

        await new Promise((resolve) => setTimeout(resolve, retries * 300));
      }
    }

    return componentImport();
  });
}
