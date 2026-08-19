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

if (API_BASE_URL) {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    // Only prefix relative URLs starting with /api/
    if (url.startsWith('/api/') && !url.startsWith(API_BASE_URL)) {
      return originalFetch.call(this, `${API_BASE_URL}${url}`, init);
    }
    return originalFetch.call(this, input, init);
  };
  console.log(`[API] Backend URL configured: ${API_BASE_URL}`);
}
