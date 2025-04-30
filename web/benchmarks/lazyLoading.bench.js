/**
 * Benchmarks for lazy loading utilities
 */

// Import the utilities to benchmark
// Note: In a real implementation, we would import from the actual source
// but for benchmarking purposes, we'll mock the implementations
const { lazyLoad, lazyLoadData, lazyLoadImage } = require('../src/utils/lazyLoading');

// Mock React
const React = {
  lazy: (importFunc) => importFunc(),
  Suspense: ({ children }) => children,
  useState: (initialValue) => [initialValue, () => {}],
  useEffect: () => {},
  useRef: (initialValue) => ({ current: initialValue }),
  useCallback: (fn) => fn
};

// Mock browser APIs
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
  }
  
  set src(value) {
    this._src = value;
    // Simulate image loading
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }
  
  get src() {
    return this._src;
  }
};

global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

/**
 * Create a mock component
 * @param {string} name - Component name
 * @returns {Function} Mock component
 */
function createMockComponent(name) {
  return (props) => {
    return { type: name, props };
  };
}

/**
 * Create a mock import function
 * @param {string} name - Component name
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Mock import function
 */
function createMockImport(name, delay = 0) {
  return () => new Promise(resolve => {
    setTimeout(() => {
      resolve({ default: createMockComponent(name) });
    }, delay);
  });
}

// Benchmark: Lazy load component (no delay)
exports.lazyLoadComponentNoDelay = async function() {
  // Setup
  const importFunc = createMockImport('TestComponent');
  
  // Benchmark
  const LazyComponent = lazyLoad(importFunc);
  
  // Render component
  const result = LazyComponent({ test: true });
  
  return result;
};

// Benchmark: Lazy load component (with delay)
exports.lazyLoadComponentWithDelay = async function() {
  // Setup
  const importFunc = createMockImport('TestComponent', 100);
  
  // Benchmark
  const LazyComponent = lazyLoad(importFunc, { delay: 200 });
  
  // Render component
  const result = LazyComponent({ test: true });
  
  return result;
};

// Benchmark: Lazy load multiple components
exports.lazyLoadMultipleComponents = function() {
  // Setup
  const components = {
    Component1: createMockImport('Component1'),
    Component2: createMockImport('Component2'),
    Component3: createMockImport('Component3'),
    Component4: createMockImport('Component4'),
    Component5: createMockImport('Component5')
  };
  
  // Benchmark
  const lazyComponents = {};
  
  for (const [name, importFunc] of Object.entries(components)) {
    lazyComponents[name] = lazyLoad(importFunc);
  }
  
  return lazyComponents;
};

// Benchmark: Lazy load data (no delay)
exports.lazyLoadDataNoDelay = async function() {
  // Setup
  const fetchFunc = () => Promise.resolve({ data: 'test' });
  
  // Benchmark
  const result = await lazyLoadData(fetchFunc);
  
  return result;
};

// Benchmark: Lazy load data (with delay)
exports.lazyLoadDataWithDelay = async function() {
  // Setup
  const fetchFunc = () => new Promise(resolve => {
    setTimeout(() => resolve({ data: 'test' }), 100);
  });
  
  // Benchmark
  const result = await lazyLoadData(fetchFunc, { delay: 50 });
  
  return result;
};

// Benchmark: Lazy load image
exports.lazyLoadImage = async function() {
  // Setup
  const src = 'https://example.com/image.jpg';
  
  // Benchmark
  const result = await lazyLoadImage(src);
  
  return result;
};

// Benchmark: Lazy load multiple images
exports.lazyLoadMultipleImages = async function() {
  // Setup
  const sources = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
    'https://example.com/image4.jpg',
    'https://example.com/image5.jpg'
  ];
  
  // Benchmark
  const results = await Promise.all(sources.map(src => lazyLoadImage(src)));
  
  return results;
};

// Mock React hooks for useLazyData
function mockUseLazyData(fetchFunc, deps = [], options = {}) {
  // Setup
  const {
    delay = 0,
    initialData = null,
    onLoad = () => {},
    onError = () => {}
  } = options;
  
  // Mock state
  const data = initialData;
  const loading = true;
  const error = null;
  
  // Mock fetch function
  const fetch = () => {
    return lazyLoadData(fetchFunc, {
      delay,
      onLoad,
      onError
    });
  };
  
  // Call fetch
  fetch();
  
  return { data, loading, error, refetch: fetch };
}

// Benchmark: useLazyData hook
exports.useLazyDataHook = function() {
  // Setup
  const fetchFunc = () => Promise.resolve({ data: 'test' });
  
  // Benchmark
  const result = mockUseLazyData(fetchFunc);
  
  return result;
};

// Mock React hooks for useLazyImage
function mockUseLazyImage(src, options = {}) {
  // Setup
  const {
    placeholder = '',
    onLoad = () => {},
    onError = () => {}
  } = options;
  
  // Mock state
  const loaded = false;
  const error = null;
  const imageSrc = placeholder;
  
  // Load image
  lazyLoadImage(src, {
    onLoad,
    onError
  });
  
  return { loaded, error, src: imageSrc };
}

// Benchmark: useLazyImage hook
exports.useLazyImageHook = function() {
  // Setup
  const src = 'https://example.com/image.jpg';
  
  // Benchmark
  const result = mockUseLazyImage(src);
  
  return result;
};

// Mock LazyImage component
function mockLazyImage(props) {
  // Setup
  const {
    src,
    alt = '',
    placeholder = '',
    onLoad = () => {},
    onError = () => {},
    style = {}
  } = props;
  
  // Use lazy image hook
  const { loaded, error, src: imageSrc } = mockUseLazyImage(src, {
    placeholder,
    onLoad,
    onError
  });
  
  // Return mock component
  return {
    type: 'img',
    props: {
      src: error ? placeholder : imageSrc,
      alt,
      style: {
        transition: 'opacity 0.3s',
        opacity: loaded ? 1 : 0.5,
        ...style
      }
    }
  };
}

// Benchmark: LazyImage component
exports.lazyImageComponent = function() {
  // Setup
  const props = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
    placeholder: 'https://example.com/placeholder.jpg'
  };
  
  // Benchmark
  const result = mockLazyImage(props);
  
  return result;
};

// Mock LazyContent component
function mockLazyContent(props) {
  // Setup
  const {
    load,
    children,
    fallback = null,
    error: ErrorComponent = null,
    onLoad = () => {},
    onError = () => {}
  } = props;
  
  // Use lazy data hook
  const { data, loading, error } = mockUseLazyData(load, [], { onLoad, onError });
  
  // Return mock component based on state
  if (loading) {
    return fallback;
  }
  
  if (error && ErrorComponent) {
    return typeof ErrorComponent === 'function'
      ? ErrorComponent({ error })
      : ErrorComponent;
  }
  
  return typeof children === 'function' ? children(data) : children;
}

// Benchmark: LazyContent component
exports.lazyContentComponent = function() {
  // Setup
  const props = {
    load: () => Promise.resolve({ data: 'test' }),
    children: (data) => ({ type: 'div', props: { children: data.data } }),
    fallback: { type: 'div', props: { children: 'Loading...' } }
  };
  
  // Benchmark
  const result = mockLazyContent(props);
  
  return result;
};

// Mock withLazyLoading HOC
function mockWithLazyLoading(Component, options = {}) {
  // Setup
  const {
    fallback = null,
    errorComponent = null,
    delay = 200,
    onLoad = () => {},
    onError = () => {}
  } = options;
  
  // Create lazy component
  const LazyComponent = React.lazy(() => {
    return Promise.resolve({ default: Component });
  });
  
  // Return wrapper component
  return (props) => {
    return React.Suspense({ fallback }, LazyComponent(props));
  };
}

// Benchmark: withLazyLoading HOC
exports.withLazyLoadingHOC = function() {
  // Setup
  const Component = createMockComponent('TestComponent');
  
  // Benchmark
  const WrappedComponent = mockWithLazyLoading(Component);
  
  // Render component
  const result = WrappedComponent({ test: true });
  
  return result;
};