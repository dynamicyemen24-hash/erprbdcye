import './lib/apiConfig';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { EnterpriseProvider } from './core/context/EnterpriseContext.tsx';
import { EnvironmentModeProvider } from './core/context/EnvironmentModeContext.tsx';
import ErrorBoundary from './app/components/ErrorBoundary.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

if (typeof performance !== 'undefined' && performance.mark) {
  performance.mark('app-start');
}

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('[UAMEX ServiceWorker] Registered successfully with scope:', registration.scope);
    }).catch(() => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary domainName="NexoraOS Global Shell">
      <EnterpriseProvider>
        <EnvironmentModeProvider>
          <App />
        </EnvironmentModeProvider>
      </EnterpriseProvider>
    </ErrorBoundary>
  </StrictMode>,
);


