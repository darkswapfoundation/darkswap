/**
 * LazyRoute - React component for lazy loading routes
 * 
 * This component combines React.lazy, Suspense, and the LazyLoader utility
 * to efficiently load route components only when they are needed, improving
 * initial page load performance and reducing bundle size.
 */

import React, { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Routes, Route, RouteProps } from 'react-router-dom';
import lazyLoader from '../utils/LazyLoader';

export interface LazyRouteProps {
  /** Route path */
  path: string;
  /** Function that imports the component */
  componentImport: () => Promise<{ default: ComponentType<any> }>;
  /** Fallback component to show while loading */
  fallback?: ReactNode;
  /** Whether to preload the component */
  preload?: boolean;
  /** Error boundary component */
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Timeout in milliseconds before showing the fallback */
  timeout?: number;
  /** Whether this is an index route */
  index?: boolean;
  /** Whether the path should be case-sensitive */
  caseSensitive?: boolean;
}

/**
 * ErrorBoundary component for handling errors in lazy-loaded components
 */
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback: React.ComponentType<{ error: Error; retry: () => void }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

/**
 * Default error component
 */
const DefaultError: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="lazy-route-error">
    <h3>Error loading route</h3>
    <p>{error.message}</p>
    <button onClick={retry}>Retry</button>
  </div>
);

/**
 * Default loading component
 */
const DefaultLoading: React.FC = () => (
  <div className="lazy-route-loading">
    <div className="lazy-route-spinner"></div>
    <p>Loading...</p>
  </div>
);

/**
 * LazyRoute component for lazy loading routes
 */
export const LazyRoute: React.FC<LazyRouteProps> = ({
  path,
  componentImport,
  fallback = <DefaultLoading />,
  preload = false,
  errorBoundary = DefaultError,
  timeout,
  index = false,
  caseSensitive = false,
}) => {
  // Create lazy component using LazyLoader
  const LazyComponent = lazyLoader.createLazyComponent(componentImport, {
    preload,
    timeout,
  });

  // Wrap component with error boundary and suspense
  const WrappedComponent = () => (
    <ErrorBoundary fallback={errorBoundary}>
      <Suspense fallback={fallback}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );

  // Return appropriate route based on whether it's an index route
  if (index) {
    return <Route index element={<WrappedComponent />} />;
  }

  return (
    <Route 
      path={path} 
      element={<WrappedComponent />} 
      caseSensitive={caseSensitive} 
    />
  );
};

/**
 * LazyRoutes component for defining multiple lazy routes
 */
export const LazyRoutes: React.FC<{ routes: LazyRouteProps[] }> = ({ routes }) => {
  return (
    <Routes>
      {routes.map((route, index) => (
        <LazyRoute key={route.path || `index-${index}`} {...route} />
      ))}
    </Routes>
  );
};

/**
 * Create a lazy-loaded route configuration
 * @param path Route path
 * @param componentImport Function that imports the component
 * @param options Additional options
 * @returns Route configuration
 */
export const createLazyRoute = (
  path: string,
  componentImport: () => Promise<{ default: ComponentType<any> }>,
  options: Omit<LazyRouteProps, 'path' | 'componentImport'> = {}
): LazyRouteProps => {
  return {
    path,
    componentImport,
    ...options,
  };
};

export default LazyRoute;