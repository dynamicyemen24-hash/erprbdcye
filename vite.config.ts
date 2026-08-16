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
            if (id.includes('node_modules')) {
              if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) {
                return 'vendor-react';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('leaflet') || id.includes('react-google-maps')) {
                return 'vendor-maps';
              }
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('xlsx')) {
                return 'vendor-pdf-excel';
              }
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'vendor-animation';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              return 'vendor-core';
            }
          }
        }
      }
    },
    server: {
      port: 3000,
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
