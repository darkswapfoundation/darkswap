/**
 * Lazy loading utilities for DarkSwap
 * 
 * This module provides utilities for lazy loading components and data.
 */

import React, { lazy, Suspense } from 'react';

/**
 * Lazy load a component
 * @template P - Component props type
 * @param {Function} importFunc - Import function
 * @param {Object} options - Lazy loading options
 * @param {React.ReactNode} options.fallback - Fallback component to show while loading
 * @param {number} options.delay - Delay in milliseconds before showing the fallback
 * @param {Function} options.onLoad - Callback when component is loaded
 * @param {Function} options.onError - Callback when loading fails
 * @returns {React.ComponentType<P>} Lazy loaded component
 */
export const lazyLoad = (importFunc, options = {}) => {
  const {
    fallback = null,
    delay = 200,
    onLoad = () => {},
    onError = (error) => console.error('Error lazy loading component:', error)
  } = options;
  
  // Create lazy component
  const LazyComponent = lazy(() => {
    // Add delay to avoid flickering for fast loads
    const start = Date.now();
    
    return importFunc()
      .then(module => {
        // Calculate elapsed time
        const elapsed = Date.now() - start;
        
        // Add artificial delay if needed
        if (elapsed < delay) {
          return new Promise(resolve => {
            setTimeout(() => {
              onLoad();
              resolve(module);
            }, delay - elapsed);
          });
        }
        
        // Call onLoad callback
        onLoad();
        
        return module;
      })
      .catch(error => {
        onError(error);
        throw error;
      });
  });
  
  // Create wrapper component with Suspense
  return props => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Lazy load multiple components
 * @param {Object} components - Object with component names as keys and import functions as values
 * @param {Object} options - Lazy loading options
 * @returns {Object} Object with component names as keys and lazy loaded components as values
 */
export const lazyLoadComponents = (components, options = {}) => {
  const lazyComponents = {};
  
  for (const [name, importFunc] of Object.entries(components)) {
    lazyComponents[name] = lazyLoad(importFunc, options);
  }
  
  return lazyComponents;
};

/**
 * Create a lazy loaded route
 * @param {Object} route - Route configuration
 * @param {string} route.path - Route path
 * @param {Function} route.component - Import function for the component
 * @param {Object} options - Lazy loading options
 * @returns {Object} Route configuration with lazy loaded component
 */
export const lazyRoute = (route, options = {}) => {
  const { path, component, ...rest } = route;
  
  return {
    path,
    element: lazyLoad(component, options),
    ...rest
  };
};

/**
 * Create lazy loaded routes
 * @param {Array} routes - Array of route configurations
 * @param {Object} options - Lazy loading options
 * @returns {Array} Array of route configurations with lazy loaded components
 */
export const lazyRoutes = (routes, options = {}) => {
  return routes.map(route => lazyRoute(route, options));
};

/**
 * Lazy load an image
 * @param {string} src - Image source
 * @param {Object} options - Lazy loading options
 * @param {Function} options.onLoad - Callback when image is loaded
 * @param {Function} options.onError - Callback when loading fails
 * @returns {Promise<string>} Promise that resolves to the image source
 */
export const lazyLoadImage = (src, options = {}) => {
  const { onLoad = () => {}, onError = () => {} } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      onLoad();
      resolve(src);
    };
    
    img.onerror = error => {
      onError(error);
      reject(error);
    };
    
    img.src = src;
  });
};

/**
 * Lazy load multiple images
 * @param {Array} sources - Array of image sources
 * @param {Object} options - Lazy loading options
 * @returns {Promise<Array<string>>} Promise that resolves to an array of image sources
 */
export const lazyLoadImages = (sources, options = {}) => {
  return Promise.all(sources.map(src => lazyLoadImage(src, options)));
};

/**
 * Lazy load data
 * @param {Function} fetchFunc - Function that returns a promise
 * @param {Object} options - Lazy loading options
 * @param {number} options.delay - Delay in milliseconds before fetching
 * @param {Function} options.onLoad - Callback when data is loaded
 * @param {Function} options.onError - Callback when loading fails
 * @returns {Promise<any>} Promise that resolves to the fetched data
 */
export const lazyLoadData = (fetchFunc, options = {}) => {
  const {
    delay = 0,
    onLoad = () => {},
    onError = (error) => console.error('Error lazy loading data:', error)
  } = options;
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      fetchFunc()
        .then(data => {
          onLoad(data);
          resolve(data);
        })
        .catch(error => {
          onError(error);
          reject(error);
        });
    }, delay);
  });
};

/**
 * React hook for lazy loading data
 * @param {Function} fetchFunc - Function that returns a promise
 * @param {Array} deps - Dependencies array
 * @param {Object} options - Lazy loading options
 * @returns {Object} Object with data, loading state, error, and refetch function
 */
export const useLazyData = (fetchFunc, deps = [], options = {}) => {
  const {
    delay = 0,
    initialData = null,
    onLoad = () => {},
    onError = (error) => console.error('Error lazy loading data:', error)
  } = options;
  
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  const fetch = React.useCallback(() => {
    setLoading(true);
    setError(null);
    
    return lazyLoadData(fetchFunc, {
      delay,
      onLoad: (data) => {
        setData(data);
        setLoading(false);
        onLoad(data);
      },
      onError: (error) => {
        setError(error);
        setLoading(false);
        onError(error);
      }
    });
  }, [fetchFunc, delay, onLoad, onError]);
  
  React.useEffect(() => {
    fetch();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  
  return { data, loading, error, refetch: fetch };
};

/**
 * React hook for lazy loading an image
 * @param {string} src - Image source
 * @param {Object} options - Lazy loading options
 * @returns {Object} Object with loaded state, error, and image source
 */
export const useLazyImage = (src, options = {}) => {
  const {
    placeholder = '',
    onLoad = () => {},
    onError = () => {}
  } = options;
  
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [imageSrc, setImageSrc] = React.useState(placeholder);
  
  React.useEffect(() => {
    if (!src) {
      return;
    }
    
    setLoaded(false);
    setError(null);
    
    lazyLoadImage(src, {
      onLoad: () => {
        setImageSrc(src);
        setLoaded(true);
        onLoad();
      },
      onError: (error) => {
        setError(error);
        onError(error);
      }
    });
  }, [src, onLoad, onError]);
  
  return { loaded, error, src: imageSrc };
};

/**
 * React component for lazy loading an image
 * @param {Object} props - Component props
 * @param {string} props.src - Image source
 * @param {string} props.alt - Image alt text
 * @param {string} props.placeholder - Placeholder image source
 * @param {Function} props.onLoad - Callback when image is loaded
 * @param {Function} props.onError - Callback when loading fails
 * @param {Object} props.style - Image style
 * @param {Object} props.imgProps - Additional image props
 * @returns {React.ReactElement} Image component
 */
export const LazyImage = ({
  src,
  alt = '',
  placeholder = '',
  onLoad = () => {},
  onError = () => {},
  style = {},
  ...imgProps
}) => {
  const { loaded, error, src: imageSrc } = useLazyImage(src, {
    placeholder,
    onLoad,
    onError
  });
  
  return (
    <img
      src={error ? placeholder : imageSrc}
      alt={alt}
      style={{
        transition: 'opacity 0.3s',
        opacity: loaded ? 1 : 0.5,
        ...style
      }}
      {...imgProps}
    />
  );
};

/**
 * React component for lazy loading content
 * @param {Object} props - Component props
 * @param {Function} props.load - Function that returns a promise
 * @param {React.ReactNode} props.children - Children to render when loaded
 * @param {React.ReactNode} props.fallback - Fallback to show while loading
 * @param {React.ReactNode} props.error - Error component to show on error
 * @param {Function} props.onLoad - Callback when content is loaded
 * @param {Function} props.onError - Callback when loading fails
 * @returns {React.ReactElement} Lazy loaded content
 */
export const LazyContent = ({
  load,
  children,
  fallback = null,
  error: ErrorComponent = null,
  onLoad = () => {},
  onError = () => {}
}) => {
  const { data, loading, error } = useLazyData(load, [], { onLoad, onError });
  
  if (loading) {
    return fallback;
  }
  
  if (error && ErrorComponent) {
    return typeof ErrorComponent === 'function'
      ? <ErrorComponent error={error} />
      : ErrorComponent;
  }
  
  return typeof children === 'function' ? children(data) : children;
};

/**
 * Higher-order component for lazy loading
 * @param {React.ComponentType} Component - Component to lazy load
 * @param {Object} options - Lazy loading options
 * @returns {React.ComponentType} Lazy loaded component
 */
export const withLazyLoading = (Component, options = {}) => {
  const {
    fallback = null,
    errorComponent = null,
    delay = 200,
    onLoad = () => {},
    onError = (error) => console.error('Error lazy loading component:', error)
  } = options;
  
  // Create lazy component
  const LazyComponent = lazy(() => {
    // Add delay to avoid flickering for fast loads
    const start = Date.now();
    
    return Promise.resolve(Component)
      .then(component => {
        // Calculate elapsed time
        const elapsed = Date.now() - start;
        
        // Add artificial delay if needed
        if (elapsed < delay) {
          return new Promise(resolve => {
            setTimeout(() => {
              onLoad();
              resolve({ default: component });
            }, delay - elapsed);
          });
        }
        
        // Call onLoad callback
        onLoad();
        
        return { default: component };
      })
      .catch(error => {
        onError(error);
        
        if (errorComponent) {
          return { default: errorComponent };
        }
        
        throw error;
      });
  });
  
  // Create wrapper component with Suspense
  return props => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};