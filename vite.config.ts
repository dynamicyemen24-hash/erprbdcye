import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1200,
      modulePreload: {
        resolveDependencies(filename, deps) {
          return deps.filter(
            dep =>
              !dep.includes('vendor-pdf-excel') &&
              !dep.includes('vendor-charts') &&
              !dep.includes('vendor-maps')
          );
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('/node_modules/')) {
              if (
                normalizedId.includes('/node_modules/react/') ||
                normalizedId.includes('/node_modules/react-dom/') ||
                normalizedId.includes('/node_modules/scheduler/')
              ) {
                return 'vendor-react';
              }
              if (normalizedId.includes('recharts') || normalizedId.includes('/d3')) {
                return 'vendor-charts';
              }
              if (normalizedId.includes('leaflet') || normalizedId.includes('react-google-maps')) {
                return 'vendor-maps';
              }
              if (normalizedId.includes('jspdf') || normalizedId.includes('html2canvas') || normalizedId.includes('xlsx')) {
                return 'vendor-pdf-excel';
              }
              if (normalizedId.includes('motion') || normalizedId.includes('framer-motion')) {
                return 'vendor-animation';
              }
              if (normalizedId.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (normalizedId.includes('firebase')) {
                return 'vendor-firebase';
              }
              return 'vendor-core';
            }
          }
        }
      }
    },
    server: {
      port: 3001,
      host: '0.0.0.0',
      strictPort: true,
      hmr: false,
      watch: {
        usePolling: true,
        interval: 2000,
      }
    },
  };
});
