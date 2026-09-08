// Web Vitals tracking
export function reportWebVitals(metric: any) {
  if (metric.label === 'web-vital') {
    console.log(`[WebVitals] ${metric.name}: ${metric.value} (${metric.rating})`);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics/web-vitals', JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
      }));
    }
  }
}

// Lazy image loading observer
export function initLazyImages() {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '50px' });
    document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
  }
}

// Preload critical resources
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn(...args);
    }
  }) as T;
}

// Virtual list helper
export function getVisibleItems(scrollTop: number, itemHeight: number, containerHeight: number, totalItems: number) {
  const start = Math.floor(scrollTop / itemHeight);
  const visible = Math.ceil(containerHeight / itemHeight) + 2;
  return { start: Math.max(0, start - 1), end: Math.min(totalItems, start + visible) };
}
