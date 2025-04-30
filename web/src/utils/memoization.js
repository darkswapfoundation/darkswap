/**
 * Memoization utilities for DarkSwap
 * 
 * This module provides utilities for memoizing values and components to improve performance.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { isEqual } from 'lodash';

/**
 * Memoize a value with standard dependencies
 * @param {Function} fn - Function to memoize
 * @param {Array} deps - Dependencies array
 * @returns {any} Memoized value
 */
export const useMemoizedValue = (fn, deps) => {
  // Track render count for performance monitoring
  const renderCount = useRef(0);
  renderCount.current++;
  
  // Track computation time
  const startTime = useRef(performance.now());
  
  // Use standard React useMemo
  const result = useMemo(fn, deps);
  
  // Log performance metrics in development
  if (process.env.NODE_ENV === 'development') {
    const computeTime = performance.now() - startTime.current;
    if (computeTime > 5) { // Only log slow computations (> 5ms)
      console.log(`[Performance] Slow computation (${computeTime.toFixed(2)}ms) in useMemoizedValue`);
    }
  }
  
  return result;
};

/**
 * Memoize a value with deep comparison of dependencies
 * @param {Function} fn - Function to memoize
 * @param {Array} deps - Dependencies array
 * @param {Object} options - Options
 * @param {boolean} options.strict - Use strict equality for comparison
 * @param {string[]} options.ignoreKeys - Keys to ignore in comparison
 * @returns {any} Memoized value
 */
export const useDeepComparison = (fn, deps, options = {}) => {
  const { strict = false, ignoreKeys = [] } = options;
  
  // Store previous dependencies
  const previousDeps = useRef(deps);
  
  // Store result
  const result = useRef();
  
  // Check if dependencies have changed
  let depsChanged = false;
  
  if (strict) {
    // Strict equality comparison
    depsChanged = deps.some((dep, i) => dep !== previousDeps.current[i]);
  } else {
    // Deep equality comparison
    depsChanged = !isEqual(
      ignoreKeys.length > 0 
        ? deps.map(dep => {
            if (dep && typeof dep === 'object') {
              const filtered = { ...dep };
              ignoreKeys.forEach(key => delete filtered[key]);
              return filtered;
            }
            return dep;
          })
        : deps,
      previousDeps.current
    );
  }
  
  // Update result if dependencies changed
  if (depsChanged || result.current === undefined) {
    result.current = fn();
    previousDeps.current = deps;
  }
  
  return result.current;
};

/**
 * Track component renders for performance monitoring
 * @param {string} componentName - Component name
 * @param {Object} options - Options
 * @param {boolean} options.logToConsole - Whether to log to console
 * @param {number} options.warnThreshold - Threshold for warning about excessive renders
 */
export const useRenderTracker = (componentName, options = {}) => {
  const { logToConsole = true, warnThreshold = 5 } = options;
  
  // Track render count
  const renderCount = useRef(0);
  renderCount.current++;
  
  // Track render time
  const renderTime = useRef(performance.now());
  
  useEffect(() => {
    // Calculate render duration
    const duration = performance.now() - renderTime.current;
    
    // Log render
    if (logToConsole) {
      console.log(`${componentName} rendered ${renderCount.current} times`, duration.toFixed(2));
    }
    
    // Warn about excessive renders
    if (renderCount.current > warnThreshold) {
      console.warn(`${componentName} has rendered ${renderCount.current} times, which may indicate a performance issue`);
    }
    
    // Reset render time for next render
    renderTime.current = performance.now();
  });
};

/**
 * Higher-order component for memoizing a component
 * @param {React.ComponentType} Component - Component to memoize
 * @param {Object} options - Options
 * @param {boolean} options.trackRenders - Whether to track renders
 * @returns {React.MemoExoticComponent} Memoized component
 */
export const withMemoization = (Component, options = {}) => {
  const { trackRenders = false } = options;
  
  // Create wrapper component
  const WrappedComponent = (props) => {
    // Track renders if enabled
    if (trackRenders) {
      useRenderTracker(Component.displayName || Component.name || 'Component');
    }
    
    return <Component {...props} />;
  };
  
  // Set display name
  WrappedComponent.displayName = `WithMemoization(${Component.displayName || Component.name || 'Component'})`;
  
  // Return memoized component
  return React.memo(WrappedComponent);
};

/**
 * Hook for debouncing a value
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

/**
 * Hook for throttling a value
 * @param {any} value - Value to throttle
 * @param {number} limit - Throttle limit in milliseconds
 * @returns {any} Throttled value
 */
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastRan = React.useRef(Date.now());
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);
  
  return throttledValue;
};

/**
 * Hook for creating a stable reference to a value
 * @param {any} value - Value to stabilize
 * @returns {any} Stable reference
 */
export const useStableValue = (value) => {
  const ref = React.useRef(value);
  
  // Only update the ref if the value has changed
  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
};

/**
 * Hook for creating a stable reference to a function
 * @param {Function} fn - Function to stabilize
 * @param {Array} deps - Dependencies array
 * @returns {Function} Stable function reference
 */
export const useStableCallback = (fn, deps = []) => {
  const ref = React.useRef(fn);
  
  // Update the ref when dependencies change
  React.useEffect(() => {
    ref.current = fn;
  }, [fn, ...deps]);
  
  // Return a stable function that calls the current ref
  return React.useCallback((...args) => ref.current(...args), []);
};