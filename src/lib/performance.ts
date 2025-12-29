/**
 * Performance monitoring utilities
 * Tracks load times, audio playback stability, and resource usage
 */

import { logger } from './logger';

interface PerformanceMetrics {
  pageLoadTime?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.measurePageLoad();
      this.observeWebVitals();
    }
  }

  private measurePageLoad(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing;
        if (timing) {
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          this.metrics.pageLoadTime = pageLoadTime;
          logger.trackPerformance('Page Load Time', pageLoadTime);
        }

        // Log performance entries
        const entries = performance.getEntriesByType('navigation');
        if (entries.length > 0) {
          const navEntry = entries[0] as PerformanceNavigationTiming;
          logger.debug('Navigation Performance', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
            loadComplete: navEntry.loadEventEnd - navEntry.startTime,
            transferSize: navEntry.transferSize,
          });
        }
      }, 0);
    });
  }

  private observeWebVitals(): void {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
          logger.trackPerformance('First Contentful Paint', entry.startTime);
        }
      }
    });
    
    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch {
      // Observer not supported
    }

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.metrics.largestContentfulPaint = lastEntry.startTime;
        logger.trackPerformance('Largest Contentful Paint', lastEntry.startTime);
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // Observer not supported
    }
  }

  // Track audio loading performance
  trackAudioLoad(trackId: string, loadTime: number): void {
    logger.trackPerformance(`Audio Load: ${trackId}`, loadTime);
  }

  // Track API response times
  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    logger.debug('API Call', { endpoint, duration, success });
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Check if app is under load stress
  isUnderStress(): boolean {
    // Check if there are signs of performance degradation
    const memory = (performance as any).memory;
    if (memory) {
      const usedHeapRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      if (usedHeapRatio > 0.9) {
        logger.warn('High memory usage detected', { usedHeapRatio });
        return true;
      }
    }
    return false;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Helper to measure function execution time
export function measureTime<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  logger.trackPerformance(name, duration);
  return result;
}

// Async version
export async function measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  logger.trackPerformance(name, duration);
  return result;
}
