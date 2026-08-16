import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { EnterpriseProvider } from './core/context/EnterpriseContext.tsx';
import ErrorBoundary from './app/components/ErrorBoundary.tsx';
import './index.css';

if (typeof performance !== 'undefined' && performance.mark) {
  performance.mark('app-start');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary domainName="NexoraOS Global Shell">
      <EnterpriseProvider>
        <App />
      </EnterpriseProvider>
    </ErrorBoundary>
  </StrictMode>,
);


