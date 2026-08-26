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
// Bulletproof Response.prototype.json to prevent "Unexpected token 'N', 'Not Found ' is not valid JSON"
if (typeof Response !== 'undefined' && Response.prototype && !((Response.prototype as any).__safeJsonPatched)) {
  const originalJson = Response.prototype.json;
  (Response.prototype as any).__safeJsonPatched = true;
  Response.prototype.json = async function (this: Response): Promise<any> {
    try {
      const text = await this.text();
      if (!text || text.trim() === '') {
        return [];
      }
      try {
        return JSON.parse(text);
      } catch {
        console.warn(`[SafeJSON] Non-JSON payload received from endpoint (${this.status}):`, text.slice(0, 80));
        // If it's a tables array endpoint, return an empty array instead of crashing
        if (this.url && this.url.includes('/api/tables/')) {
          return [];
        }
        return { error: text.trim(), status: this.status, ok: this.ok };
      }
    } catch {
      return this.url && this.url.includes('/api/tables/') ? [] : { error: 'Failed to read response body', ok: false };
    }
  };
}

console.log('[API] Global fetch progress & safe JSON instrumentation active.');
