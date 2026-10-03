import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';
  // Inject cache version for service worker freshness on Ctrl+F5
  const cacheVersion = process.env.VITE_CACHE_VERSION || `build-${Date.now()}`;

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
      'process.env.VITE_CACHE_VERSION': JSON.stringify(cacheVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // ── Browser support ──────────────────────────────────────────────────────
      // WAS 'esnext', which meant Rollup emitted syntax verbatim. Any engine
      // without the newest proposals got a parse error and a blank page — the
      // worst possible failure for an ERP, because it is total and silent
      // rather than partial and visible.
      //
      // These floors are the intersection of "still receives security updates"
      // and "supports the platform APIs this app relies on" (CSS nesting and
      // `:focus-visible` land in the baseline below, `structuredClone` and
      // `Array.prototype.at` are already used by the runtime layer).
      //   Chrome/Edge 111 · Firefox 113 · Safari 16.4 · iOS Safari 16.4
      // That is roughly 97.5% of global traffic and covers every browser released
      // after early 2023. Going lower is a deliberate decision, not a default:
      // each step down starts costing transpilation of the whole bundle.
      target: ['chrome111', 'edge111', 'firefox113', 'safari16.4', 'ios16.4'],
      cssCodeSplit: true,
      sourcemap: false,
      reportCompressedSize: false,
      // 2500 KB used to hide a 1 MB single-purpose chunk. The budget is now
      // enforced loudly; the analyser in scripts/ is the real gate.
      chunkSizeWarningLimit: 700,
      modulePreload: {
        // Preloading is a hint, but a wrong hint costs the same bandwidth a
        // correct one saves. The previous filter named chunks that no longer
        // exist after the split fix, so it silently became a no-op. It is now
        // expressed in terms of the *libraries* rather than the filenames, which
        // keeps it correct no matter how Rollup names the emitted chunks.
        //
        // Heavy optional libraries must never be preloaded: the browser would
        // speculatively re-download them for users who never open a chart, a map
        // or an export dialog.
        resolveDependencies(filename, deps) {
          return deps.filter(
            (dep) =>
              !/jspdf|html2canvas|xlsx|recharts|\bd3-|leaflet|google-maps|framer-motion|motion-dom|firebase/i.test(
                dep
              ) &&
              !dep.includes('enterprise-data-snapshot')
          );
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('realEnterpriseData')) {
              return 'enterprise-data-snapshot';
            }
            if (normalizedId.includes('/node_modules/')) {
              if (
                normalizedId.includes('/node_modules/react/') ||
                normalizedId.includes('/node_modules/react-dom/') ||
                normalizedId.includes('/node_modules/scheduler/')
              ) {
                return 'vendor-react';
              }
              if (normalizedId.includes('lucide-react')) {
                return 'vendor-icons';
              }
              // ── DELIBERATELY NOT SPLIT BY LIBRARY ────────────────────────────
              // recharts, leaflet, jspdf, html2canvas and xlsx used to be forced
              // into named chunks here. That defeated the `await import()`
              // boundaries the source code already had: because a manual chunk
              // is a *static* unit, Rollup made the entry chunk import all five
              // of them directly, and the measured critical path grew to
              // 2.4 MB (1.8 MB gzipped) — a 1 MB PDF/Excel library that no user
              // had asked for yet, fetched before first paint by every device.
              //
              // Letting Rollup split them automatically restores the intended
              // boundary: each library now lives in a chunk reached only through
              // the dynamic import that actually uses it, so it is downloaded
              // when a user opens a chart, a map or an export dialog — and not
              // before. `scripts/analyze-critical-path.cjs` enforces the result.
              return undefined;
            }
          }
        }
      }
    },
    // The dev server runs in `middlewareMode` inside Express (see server.ts), so
    // it never opens a port of its own — Express owns 3000 via PORT/.env. The
    // previous `port: 3001` was inherited from a standalone-Vite setup and was
    // actively misleading: the log prints "listening on 3000" while the config
    // claims 3001, which sends a developer debugging the wrong port.
    //
    // `host` is kept because the Vite middleware serves assets from that
    // address, and HMR must be able to connect from a device on the LAN.
    server: {
      host: '0.0.0.0',
      strictPort: true,
      hmr: isHmrDisabled ? false : { overlay: true },
      watch: isHmrDisabled ? { usePolling: true, interval: 2000 } : undefined,
    },
  };
});
