/**
 * Lazy loading utilities for DarkSwap
 */
import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Options for lazy loading
 */
export interface LazyLoadOptions {
  /** Whether to prefetch the component */
  prefetch?: boolean;
  /** The delay before prefetching in milliseconds */
  prefetchDelay?: number;
  /** Whether to retry loading on error */
  retry?: boolean;
  /** The number of retry attempts */
  retryAttempts?: number;
  /** The delay between retry attempts in milliseconds */
  retryDelay?: number;
}

/**
 * Default lazy load options
 */
const DEFAULT_LAZY_LOAD_OPTIONS: LazyLoadOptions = {
  prefetch: false,
  prefetchDelay: 300,
  retry: true,
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Lazy load a component
 * @param importFn The import function
 * @param options Lazy load options
 * @returns The lazy loaded component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const mergedOptions = { ...DEFAULT_LAZY_LOAD_OPTIONS, ...options };

  // Create a wrapper function that handles retries
  const loadComponent = async () => {
    let attempts = 0;
    
    while (true) {
      try {
        return await importFn();
      } catch (error) {
        attempts++;
        
        if (!mergedOptions.retry || attempts >= (mergedOptions.retryAttempts || 0)) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, mergedOptions.retryDelay));
      }
    }
  };

  // Create the lazy component
  const LazyComponent = lazy(loadComponent);

  // Prefetch the component if enabled
  if (mergedOptions.prefetch) {
    setTimeout(() => {
      importFn().catch(() => {
        // Ignore prefetch errors
      });
    }, mergedOptions.prefetchDelay);
  }

  return LazyComponent;
}

/**
 * Prefetch a component
 * @param importFn The import function
 * @returns A promise that resolves when the component is prefetched
 */
export function prefetchComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): Promise<void> {
  return importFn().then(() => {
    // Component prefetched successfully
  }).catch(() => {
    // Ignore prefetch errors
  });
}

/**
 * Create a route configuration for lazy loading
 * @param importFn The import function
 * @param options Lazy load options
 * @returns The lazy loaded route configuration
 */
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): {
  component: LazyExoticComponent<T>;
  preload: () => Promise<void>;
} {
  const component = lazyLoad(importFn, options);
  const preload = () => prefetchComponent(importFn);

  return {
    component,
    preload,
  };
}

/**
 * Create a modal configuration for lazy loading
 * @param importFn The import function
 * @param options Lazy load options
 * @returns The lazy loaded modal configuration
 */
export function createLazyModal<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): {
  component: LazyExoticComponent<T>;
  preload: () => Promise<void>;
} {
  const component = lazyLoad(importFn, options);
  const preload = () => prefetchComponent(importFn);

  return {
    component,
    preload,
  };
}

/**
 * Create a prefetch function for multiple components
 * @param importFns The import functions
 * @returns A function that prefetches all components
 */
export function createMultiPrefetch(
  importFns: Array<() => Promise<{ default: ComponentType<any> }>>
): () => Promise<void[]> {
  return () => Promise.all(importFns.map(prefetchComponent));
}

/**
 * Create a prefetch function for a component
 * @param importFn The import function
 * @returns A function that prefetches the component
 */
export function createPrefetchFunction<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): () => Promise<void> {
  return () => prefetchComponent(importFn);
}

/**
 * Create a prefetch handler for a component
 * @param importFn The import function
 * @returns A function that can be used as an event handler to prefetch the component
 */
export function createPrefetchHandler<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): () => void {
  return () => {
    prefetchComponent(importFn);
  };
}

/**
 * Create a prefetch handler for multiple components
 * @param importFns The import functions
 * @returns A function that can be used as an event handler to prefetch all components
 */
export function createMultiPrefetchHandler(
  importFns: Array<() => Promise<{ default: ComponentType<any> }>>
): () => void {
  return () => {
    importFns.forEach(prefetchComponent);
  };
}