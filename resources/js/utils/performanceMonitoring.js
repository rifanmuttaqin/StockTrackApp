// Performance monitoring utilities
export const measureCoreWebVitals = () => {
  // Largest Contentful Paint (LCP)
  const observeLCP = () => {
    return new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: getRating(lastEntry.startTime, [2500, 4000])
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  };

  // First Input Delay (FID)
  const observeFID = () => {
    return new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          resolve({
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            rating: getRating(entry.processingStart - entry.startTime, [100, 300])
          });
        });
      }).observe({ entryTypes: ['first-input'] });
    });
  };

  // Cumulative Layout Shift (CLS)
  const observeCLS = () => {
    return new Promise((resolve) => {
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        resolve({
          name: 'CLS',
          value: clsValue,
          rating: getRating(clsValue, [0.1, 0.25])
        });
      }).observe({ entryTypes: ['layout-shift'] });
    });
  };

  // Time to First Byte (TTFB)
  const observeTTFB = () => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const navigation = entries.find(entry => entry.entryType === 'navigation');
        if (navigation) {
          const ttfb = navigation.responseStart - navigation.requestStart;
          resolve({
            name: 'TTFB',
            value: ttfb,
            rating: getRating(ttfb, [800, 1800])
          });
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
    });
  };

  return Promise.all([
    observeLCP(),
    observeFID(),
    observeCLS(),
    observeTTFB()
  ]);
};

// Rating helper function
const getRating = (value, thresholds) => {
  if (value <= thresholds[0]) return 'good';
  if (value <= thresholds[1]) return 'needs-improvement';
  return 'poor';
};

// Mobile performance metrics
export const measureMobilePerformance = () => {
  const metrics = {
    // Memory usage
    memory: performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576),
      total: Math.round(performance.memory.totalJSHeapSize / 1048576),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
    } : null,

    // Network information
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : null,

    // Device information
    device: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory
    },

    // Page load timing
    timing: performance.timing ? {
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime
    } : null
  };

  return metrics;
};

// Performance monitoring service
export class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.observers = [];
    this.isMonitoring = false;
  }

  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor Core Web Vitals
    this.measureWebVitals();

    // Monitor long tasks
    this.observeLongTasks();

    // Monitor resource timing
    this.observeResourceTiming();

    // Monitor memory usage
    this.observeMemoryUsage();
  }

  stop() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;
  }

  measureWebVitals() {
    measureCoreWebVitals().then(metrics => {
      metrics.forEach(metric => {
        this.recordMetric(metric);
        this.sendToAnalytics(metric);
      });
    });
  }

  observeLongTasks() {
    const observer = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        this.recordMetric({
          name: 'LongTask',
          value: entry.duration,
          rating: getRating(entry.duration, [50, 100])
        });
      });
    });
    observer.observe({ entryTypes: ['longtask'] });
    this.observers.push(observer);
  }

  observeResourceTiming() {
    const observer = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        if (entry.duration > 1000) { // Only log slow resources
          this.recordMetric({
            name: 'SlowResource',
            value: entry.duration,
            details: {
              name: entry.name,
              size: entry.transferSize,
              type: entry.initiatorType
            }
          });
        }
      });
    });
    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  observeMemoryUsage() {
    if (!performance.memory) return;

    const measureMemory = () => {
      if (!this.isMonitoring) return;

      const memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };

      this.recordMetric({
        name: 'MemoryUsage',
        value: memory.used,
        details: memory
      });

      setTimeout(measureMemory, 5000); // Measure every 5 seconds
    };

    measureMemory();
  }

  recordMetric(metric) {
    metric.timestamp = Date.now();
    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  sendToAnalytics(metric) {
    // Send to your analytics service
    if (window.gtag) {
      window.gtag('event', 'web_vital', {
        event_category: 'Performance',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_map: { rating: metric.rating }
      });
    }
  }

  getReport() {
    const report = {
      timestamp: Date.now(),
      metrics: this.metrics,
      summary: this.generateSummary()
    };

    return report;
  }

  generateSummary() {
    const summary = {};

    // Group metrics by name
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {});

    // Calculate statistics for each metric
    Object.keys(grouped).forEach(name => {
      const values = grouped[name];
      summary[name] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1]
      };
    });

    return summary;
  }
}

// Performance budget monitoring
export const checkPerformanceBudget = () => {
  const budgets = {
    bundleSize: 250 * 1024, // 250KB
    imageSize: 500 * 1024, // 500KB
    fontCount: 4,
    requestCount: 20,
    loadTime: 3000 // 3 seconds
  };

  const current = {
    bundleSize: 0, // Would be calculated from actual bundle
    imageSize: 0, // Would be calculated from actual images
    fontCount: document.fonts ? document.fonts.size : 0,
    requestCount: performance.getEntriesByType('resource').length,
    loadTime: performance.timing ?
      performance.timing.loadEventEnd - performance.timing.navigationStart : 0
  };

  const results = {};
  Object.keys(budgets).forEach(key => {
    results[key] = {
      budget: budgets[key],
      current: current[key],
      percentage: (current[key] / budgets[key]) * 100,
      withinBudget: current[key] <= budgets[key]
    };
  });

  return results;
};

// Real User Monitoring (RUM)
export const setupRUM = () => {
  const monitor = new PerformanceMonitor();
  monitor.start();

  // Send report on page unload
  window.addEventListener('beforeunload', () => {
    const report = monitor.getReport();
    navigator.sendBeacon('/api/performance', JSON.stringify(report));
  });
};

// Performance score calculation
export const calculatePerformanceScore = (metrics) => {
  const weights = {
    LCP: 0.25,
    FID: 0.25,
    CLS: 0.25,
    TTFB: 0.15,
    loadTime: 0.1
  };

  const scores = {
    LCP: getScore(metrics.LCP?.value, [2500, 4000]),
    FID: getScore(metrics.FID?.value, [100, 300]),
    CLS: getScore(metrics.CLS?.value, [0.1, 0.25]),
    TTFB: getScore(metrics.TTFB?.value, [800, 1800]),
    loadTime: getScore(metrics.loadTime?.value, [3000, 5000])
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.keys(weights).forEach(metric => {
    if (scores[metric] !== undefined) {
      totalScore += scores[metric] * weights[metric];
      totalWeight += weights[metric];
    }
  });

  return Math.round(totalScore / totalWeight);
};

// Helper to convert metric to score (0-100)
const getScore = (value, thresholds) => {
  if (value === undefined) return 0;
  if (value <= thresholds[0]) return 100;
  if (value <= thresholds[1]) return 50;
  return Math.max(0, 100 - ((value - thresholds[1]) / thresholds[1]) * 50);
};
