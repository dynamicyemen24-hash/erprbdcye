import { useEffect, useRef } from 'react';

export function useTelemetry(componentName: string, active: boolean = true) {
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!active) return;
    
    const duration = Date.now() - mountTime.current;
    
    // In a real enterprise app, send to DataDog, New Relic, or internal telemetry API
    if (duration > 1000) {
      console.warn(`[Nexora Telemetry] ⚠️ Slow render detected in ${componentName}: ${duration}ms`);
    } else {
      console.debug(`[Nexora Telemetry] ⚡ ${componentName} mounted in ${duration}ms`);
    }

    return () => {
      const unmountDuration = Date.now() - mountTime.current;
      console.debug(`[Nexora Telemetry] 🛑 ${componentName} unmounted after ${unmountDuration}ms`);
    };
  }, [componentName, active]);
}
