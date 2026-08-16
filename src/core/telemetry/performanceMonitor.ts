import { useEffect, useState, useCallback } from 'react';

// Enterprise Telemetry Metrics Definitions
export interface TelemetryMetric {
  id: string;
  name: string;
  category: 'page_load' | 'api_latency' | 'domain_perf' | 'web_vital' | 'system_resource';
  value: number; // in milliseconds or appropriate unit
  unit: 'ms' | 'percentage' | 'kb' | 'score';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface WebVitalsData {
  fcp?: number;  // First Contentful Paint
  lcp?: number;  // Largest Contentful Paint
  fid?: number;  // First Input Delay
  cls?: number;  // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

class NexoraPerformanceMonitor {
  private metrics: TelemetryMetric[] = [];
  private activeTransactions: Map<string, { startTime: number; category: TelemetryMetric['category']; metadata?: any }> = new Map();
  private listeners: Set<(metric: TelemetryMetric) => void> = new Set();
  private webVitals: WebVitalsData = {};

  constructor() {
    this.initializeWebObservers();
    this.recordInitialPageLoad();
  }

  // Registers a callback for real-time telemetry updates
  public subscribe(listener: (metric: TelemetryMetric) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(metric: TelemetryMetric) {
    this.listeners.forEach(listener => {
      try {
        listener(metric);
      } catch (e) {
        console.error('Error in telemetry subscriber:', e);
      }
    });
  }

  // High-precision custom transaction tracking
  public startTransaction(name: string, category: TelemetryMetric['category'] = 'domain_perf', metadata?: any) {
    this.activeTransactions.set(name, {
      startTime: window.performance ? window.performance.now() : Date.now(),
      category,
      metadata,
    });
  }

  public endTransaction(name: string, metadata?: any): TelemetryMetric | null {
    const transaction = this.activeTransactions.get(name);
    if (!transaction) {
      return null;
    }

    const endTime = window.performance ? window.performance.now() : Date.now();
    const duration = endTime - transaction.startTime;
    this.activeTransactions.delete(name);

    const metric: TelemetryMetric = {
      id: `m_${Math.random().toString(36).substring(2, 9)}`,
      name,
      category: transaction.category,
      value: parseFloat(duration.toFixed(2)),
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        ...transaction.metadata,
        ...metadata,
      }
    };

    this.addMetric(metric);
    return metric;
  }

  // Directly log an API latency event
  public recordApiLatency(endpoint: string, durationMs: number, status: number, method: string = 'GET') {
    const metric: TelemetryMetric = {
      id: `api_${Math.random().toString(36).substring(2, 9)}`,
      name: `API Request: ${method} ${endpoint}`,
      category: 'api_latency',
      value: parseFloat(durationMs.toFixed(2)),
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        endpoint,
        status,
        method,
      }
    };
    this.addMetric(metric);
  }

  // Retrieve metrics sorted or filtered
  public getMetrics(filter?: {
    category?: TelemetryMetric['category'];
    limit?: number;
    since?: number;
  }): TelemetryMetric[] {
    let result = [...this.metrics];
    if (filter?.category) {
      result = result.filter(m => m.category === filter.category);
    }
    if (filter?.since) {
      result = result.filter(m => m.timestamp >= filter.since);
    }
    result.sort((a, b) => b.timestamp - a.timestamp);
    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }
    return result;
  }

  public getWebVitals(): WebVitalsData {
    return { ...this.webVitals };
  }

  // Internal metrics aggregator
  private addMetric(metric: TelemetryMetric) {
    this.metrics.push(metric);
    // Keep max 1000 items in memory to prevent leaks
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
    this.notify(metric);

    // Development Console Log (Stylized & Filtered to be non-intrusive)
    if (process.env.NODE_ENV !== 'production' && metric.value > 200) {
      console.log(
        `%c[Telemetry Warning] Slow Operation detected: ${metric.name} took ${metric.value}ms`,
        'color: #d97706; font-weight: bold; font-family: monospace;'
      );
    }
  }

  // Capture standard Web Vitals via native browser PerformanceObservers
  private initializeWebObservers() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const value = entries[0].startTime;
          this.webVitals.fcp = parseFloat(value.toFixed(2));
          this.addMetric({
            id: 'vital_fcp',
            name: 'First Contentful Paint (FCP)',
            category: 'web_vital',
            value: parseFloat(value.toFixed(2)),
            unit: 'ms',
            timestamp: Date.now()
          });
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const value = entries[entries.length - 1].startTime;
          this.webVitals.lcp = parseFloat(value.toFixed(2));
          this.addMetric({
            id: 'vital_lcp',
            name: 'Largest Contentful Paint (LCP)',
            category: 'web_vital',
            value: parseFloat(value.toFixed(2)),
            unit: 'ms',
            timestamp: Date.now()
          });
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const entry = entries[0] as any;
          const value = entry.processingStart - entry.startTime;
          this.webVitals.fid = parseFloat(value.toFixed(2));
          this.addMetric({
            id: 'vital_fid',
            name: 'First Input Delay (FID)',
            category: 'web_vital',
            value: parseFloat(value.toFixed(2)),
            unit: 'ms',
            timestamp: Date.now()
          });
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.webVitals.cls = parseFloat(clsValue.toFixed(4));
        this.addMetric({
          id: 'vital_cls',
          name: 'Cumulative Layout Shift (CLS)',
          category: 'web_vital',
          value: parseFloat(clsValue.toFixed(4)),
          unit: 'score',
          timestamp: Date.now()
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

    } catch (e) {
      console.warn('Web Vitals Observability not fully supported on this engine:', e);
    }
  }

  // Estimate page navigation & resources latency
  private recordInitialPageLoad() {
    if (typeof window === 'undefined' || !window.performance) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        try {
          const [navigation] = window.performance.getEntriesByType('navigation') as any[];
          if (navigation) {
            const pageLoadTime = navigation.loadEventEnd - navigation.startTime;
            const ttfb = navigation.responseStart - navigation.requestStart;

            this.webVitals.ttfb = parseFloat(ttfb.toFixed(2));

            this.addMetric({
              id: 'vital_ttfb',
              name: 'Time to First Byte (TTFB)',
              category: 'web_vital',
              value: parseFloat(ttfb.toFixed(2)),
              unit: 'ms',
              timestamp: Date.now()
            });

            this.addMetric({
              id: 'page_load_complete',
              name: 'Full Document Load Event',
              category: 'page_load',
              value: parseFloat(pageLoadTime.toFixed(2)),
              unit: 'ms',
              timestamp: Date.now(),
              metadata: {
                domInteractive: navigation.domInteractive,
                domComplete: navigation.domComplete,
                transferSize: navigation.transferSize,
              }
            });
          }
        } catch (e) {
          console.error('Error measuring core document speed:', e);
        }
      }, 0);
    });
  }

  public clearMetrics() {
    this.metrics = [];
  }
}

// Single instance exports to ensure uniform state tracking
export const performanceMonitor = new NexoraPerformanceMonitor();

// React hook to access telemetry reactive feeds effortlessly inside widgets/drawers
export function useTelemetry(categoryFilter?: TelemetryMetric['category']) {
  const [metrics, setMetrics] = useState<TelemetryMetric[]>(() => 
    performanceMonitor.getMetrics({ category: categoryFilter, limit: 50 })
  );
  const [webVitals, setWebVitals] = useState<WebVitalsData>(() => performanceMonitor.getWebVitals());

  useEffect(() => {
    const handleMetric = (newMetric: TelemetryMetric) => {
      if (!categoryFilter || newMetric.category === categoryFilter) {
        setMetrics(prev => [newMetric, ...prev].slice(0, 50));
      }
      setWebVitals(performanceMonitor.getWebVitals());
    };

    return performanceMonitor.subscribe(handleMetric);
  }, [categoryFilter]);

  const startMetricTransaction = useCallback((name: string, category: TelemetryMetric['category'] = 'domain_perf', metadata?: any) => {
    performanceMonitor.startTransaction(name, category, metadata);
  }, []);

  const endMetricTransaction = useCallback((name: string, metadata?: any) => {
    return performanceMonitor.endTransaction(name, metadata);
  }, []);

  return {
    metrics,
    webVitals,
    startMetricTransaction,
    endMetricTransaction,
    recordApiLatency: useCallback((endpoint: string, durationMs: number, status: number, method?: string) => {
      performanceMonitor.recordApiLatency(endpoint, durationMs, status, method);
    }, [])
  };
}
