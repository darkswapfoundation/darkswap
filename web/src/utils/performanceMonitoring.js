/**
 * Performance monitoring utilities for DarkSwap
 */

/**
 * Performance metrics collector
 */
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      pageLoads: [],
      apiCalls: {},
      componentRenders: {},
      resourceLoads: [],
      longTasks: [],
      memoryUsage: [],
      interactions: []
    };
    
    this.isMonitoring = false;
    this.observer = null;
    this.intervalId = null;
  }
  
  /**
   * Start monitoring performance
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    
    // Monitor page load metrics
    this.monitorPageLoad();
    
    // Monitor long tasks
    this.monitorLongTasks();
    
    // Monitor resource loading
    this.monitorResourceLoading();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Monitor user interactions
    this.monitorInteractions();
    
    console.log('Performance monitoring started');
  }
  
  /**
   * Stop monitoring performance
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;
    
    // Disconnect observers
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Clear intervals
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('Performance monitoring stopped');
  }
  
  /**
   * Monitor page load metrics
   */
  monitorPageLoad() {
    // Use Performance API to get page load metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const pageLoadMetrics = this.getPageLoadMetrics();
        this.metrics.pageLoads.push(pageLoadMetrics);
        this.reportMetric('pageLoad', pageLoadMetrics);
      }, 0);
    });
  }
  
  /**
   * Get page load metrics
   * @returns {Object} Page load metrics
   */
  getPageLoadMetrics() {
    const perfEntries = performance.getEntriesByType('navigation')[0];
    const paintEntries = performance.getEntriesByType('paint');
    
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    return {
      timestamp: Date.now(),
      domComplete: perfEntries.domComplete,
      domInteractive: perfEntries.domInteractive,
      loadEventEnd: perfEntries.loadEventEnd,
      responseEnd: perfEntries.responseEnd,
      firstPaint: firstPaint ? firstPaint.startTime : null,
      firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : null,
      domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart,
      timeToInteractive: this.calculateTimeToInteractive()
    };
  }
  
  /**
   * Calculate Time to Interactive (TTI)
   * This is a simplified version, a real implementation would be more complex
   * @returns {number} Time to Interactive in milliseconds
   */
  calculateTimeToInteractive() {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    const firstContentfulPaint = performance.getEntriesByType('paint')
      .find(entry => entry.name === 'first-contentful-paint');
    
    if (!navigationEntry || !firstContentfulPaint) return null;
    
    // A very simplified TTI calculation
    // Real TTI calculation requires more complex analysis of the main thread
    return Math.max(
      firstContentfulPaint.startTime,
      navigationEntry.domInteractive
    );
  }
  
  /**
   * Monitor long tasks
   */
  monitorLongTasks() {
    // Use PerformanceObserver to monitor long tasks
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          this.metrics.longTasks.push({
            timestamp: Date.now(),
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
          
          if (entry.duration > 100) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });
      
      this.observer.observe({ entryTypes: ['longtask'] });
    }
  }
  
  /**
   * Monitor resource loading
   */
  monitorResourceLoading() {
    // Use PerformanceObserver to monitor resource loading
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          // Skip monitoring of analytics and monitoring resources
          if (entry.name.includes('analytics') || entry.name.includes('monitoring')) {
            return;
          }
          
          this.metrics.resourceLoads.push({
            timestamp: Date.now(),
            name: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize,
            initiatorType: entry.initiatorType
          });
          
          if (entry.duration > 1000) {
            console.warn(`Slow resource load: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }
  
  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    // Use memory API if available (Chrome only)
    if (performance.memory) {
      this.intervalId = setInterval(() => {
        this.metrics.memoryUsage.push({
          timestamp: Date.now(),
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        });
      }, 10000); // Every 10 seconds
    }
  }
  
  /**
   * Monitor user interactions
   */
  monitorInteractions() {
    // Monitor clicks
    document.addEventListener('click', event => {
      this.recordInteraction('click', event);
    });
    
    // Monitor key presses
    document.addEventListener('keydown', event => {
      this.recordInteraction('keydown', event);
    });
    
    // Monitor scrolling
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      const startTime = performance.now();
      
      scrollTimeout = setTimeout(() => {
        const duration = performance.now() - startTime;
        
        this.metrics.interactions.push({
          timestamp: Date.now(),
          type: 'scroll',
          duration,
          position: {
            scrollX: window.scrollX,
            scrollY: window.scrollY
          }
        });
      }, 100);
    });
  }
  
  /**
   * Record a user interaction
   * @param {string} type - Interaction type
   * @param {Event} event - DOM event
   */
  recordInteraction(type, event) {
    const target = event.target;
    const targetInfo = {
      tagName: target.tagName,
      id: target.id,
      className: target.className
    };
    
    this.metrics.interactions.push({
      timestamp: Date.now(),
      type,
      target: targetInfo
    });
  }
  
  /**
   * Record API call performance
   * @param {string} endpoint - API endpoint
   * @param {number} duration - Call duration in milliseconds
   * @param {boolean} success - Whether the call was successful
   */
  recordApiCall(endpoint, duration, success) {
    if (!this.metrics.apiCalls[endpoint]) {
      this.metrics.apiCalls[endpoint] = [];
    }
    
    this.metrics.apiCalls[endpoint].push({
      timestamp: Date.now(),
      duration,
      success
    });
    
    if (duration > 1000) {
      console.warn(`Slow API call: ${endpoint} (${duration.toFixed(2)}ms)`);
    }
  }
  
  /**
   * Record component render time
   * @param {string} componentName - Component name
   * @param {number} renderTime - Render time in milliseconds
   */
  recordComponentRender(componentName, renderTime) {
    if (!this.metrics.componentRenders[componentName]) {
      this.metrics.componentRenders[componentName] = [];
    }
    
    this.metrics.componentRenders[componentName].push({
      timestamp: Date.now(),
      renderTime
    });
    
    if (renderTime > 16) { // 60fps threshold
      console.warn(`Slow component render: ${componentName} (${renderTime.toFixed(2)}ms)`);
    }
  }
  
  /**
   * Report a metric to the monitoring service
   * @param {string} metricName - Metric name
   * @param {any} metricValue - Metric value
   */
  reportMetric(metricName, metricValue) {
    // In a real implementation, this would send the metric to a monitoring service
    console.log(`Reporting metric: ${metricName}`, metricValue);
  }
  
  /**
   * Get all collected metrics
   * @returns {Object} All metrics
   */
  getAllMetrics() {
    return this.metrics;
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = {
      pageLoads: [],
      apiCalls: {},
      componentRenders: {},
      resourceLoads: [],
      longTasks: [],
      memoryUsage: [],
      interactions: []
    };
  }
}

// Create a singleton instance
const performanceMetrics = new PerformanceMetrics();

/**
 * React hook for measuring component render time
 * @param {string} componentName - Component name
 */
export const useRenderPerformance = (componentName) => {
  const startTimeRef = React.useRef(performance.now());
  
  React.useEffect(() => {
    const renderTime = performance.now() - startTimeRef.current;
    performanceMetrics.recordComponentRender(componentName, renderTime);
    
    return () => {
      startTimeRef.current = performance.now();
    };
  });
};

/**
 * Higher-order component for measuring component render time
 * @param {React.Component} Component - Component to measure
 * @param {string} componentName - Component name
 * @returns {React.Component} Wrapped component
 */
export const withRenderPerformance = (Component, componentName) => {
  return (props) => {
    useRenderPerformance(componentName || Component.displayName || Component.name);
    return <Component {...props} />;
  };
};

/**
 * Measure API call performance
 * @param {string} endpoint - API endpoint
 * @param {Function} apiCall - API call function
 * @returns {Promise<any>} API call result
 */
export const measureApiCall = async (endpoint, apiCall) => {
  const startTime = performance.now();
  let success = false;
  
  try {
    const result = await apiCall();
    success = true;
    return result;
  } finally {
    const duration = performance.now() - startTime;
    performanceMetrics.recordApiCall(endpoint, duration, success);
  }
};

// Export the singleton instance and utility functions
export default performanceMetrics;