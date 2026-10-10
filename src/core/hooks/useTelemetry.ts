import { useEffect, useRef } from 'react';

import { logger } from '../../lib/logger';
export function useTelemetry(componentName: string, active: boolean = true) {
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!active) return;
    
    const duration = Date.now() - mountTime.current;
    
    // In a real enterprise app, send to DataDog, New Relic, or internal telemetry API
    if (duration > 1000) {
      logger.warn(`[Nexora Telemetry] ⚠️ Slow render detected in ${componentName}: ${duration}ms`);
    } else {
      logger.debug(`[Nexora Telemetry] ⚡ ${componentName} mounted in ${duration}ms`);
    }

    return () => {
      const unmountDuration = Date.now() - mountTime.current;
      logger.debug(`[Nexora Telemetry] 🛑 ${componentName} unmounted after ${unmountDuration}ms`);
    };
  }, [componentName, active]);
}
