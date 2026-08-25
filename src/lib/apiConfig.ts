/**
 * API Configuration — Configures fetch to route /api/* calls to the backend server.
 * 
 * In production split deployment (Cloudflare Pages frontend + Render/Railway backend),
 * set VITE_API_URL to the backend server URL. All relative fetch('/api/...') calls
 * will be automatically prefixed with this URL.
 * 
 * If VITE_API_URL is not set (e.g. during development with the combined server),
 * relative URLs work as-is since the frontend and API share the same origin.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

// Global end-to-end fetch instrumentation (always active, dev & prod)
import { fetchProgress } from './fetchProgress';

const originalFetch = window.fetch;
window.fetch = function (this: typeof globalThis, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  const isApiCall = rawUrl.startsWith('/api/');

  if (!isApiCall) {
    return originalFetch.call(this, input, init);
  }

  fetchProgress.start();
  const promise = originalFetch.call(this, input, init);
  promise
    .then(() => fetchProgress.end(true))
    .catch(() => fetchProgress.end(false));
  return promise;
} as typeof window.fetch;

if (API_BASE_URL) {
  window.fetch = (function (wrapped: typeof window.fetch): typeof window.fetch {
    return function (this: typeof globalThis, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input.toString();
      // Only prefix relative URLs starting with /api/
      if (url.startsWith('/api/') && !url.startsWith(API_BASE_URL)) {
        return wrapped.call(this, `${API_BASE_URL}${url}`, init);
      }
      return wrapped.call(this, input, init);
    };
  })(window.fetch);
  console.log(`[API] Backend URL configured: ${API_BASE_URL}`);
}
console.log('[API] Global fetch progress instrumentation active.');
