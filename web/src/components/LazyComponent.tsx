import React, { Suspense, lazy, ComponentType } from 'react';
import { logger } from '../../../src/utils/logger';

/**
 * Props for the LazyComponent
 */
interface LazyComponentProps {
  /**
   * The component to load lazily
   */
  component: () => Promise<{ default: ComponentType<any> }>;
  
  /**
   * The fallback component to show while loading
   */
  fallback?: React.ReactNode;
  
  /**
   * The props to pass to the component
   */
  [key: string]: any;
}

/**
 * LazyComponent
 * 
 * A component that lazily loads another component.
 * 
 * @param props The component props
 * @returns The lazy-loaded component
 */
export const LazyComponent: React.FC<LazyComponentProps> = ({
  component,
  fallback = <div>Loading...</div>,
  ...props
}) => {
  // Create a lazy component
  const LazyComponent = lazy(() => {
    return component().catch((error) => {
      logger.error('Failed to load component', { error });
      
      // Return a default component
      return {
        default: () => <div>Failed to load component</div>,
      };
    });
  });
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * withLazy HOC
 * 
 * A higher-order component that wraps a component with LazyComponent.
 * 
 * @param component The component to load lazily
 * @param fallback The fallback component to show while loading
 * @returns A lazy-loaded component
 */
export const withLazy = (
  component: () => Promise<{ default: ComponentType<any> }>,
  fallback?: React.ReactNode
) => {
  return (props: any) => (
    <LazyComponent component={component} fallback={fallback} {...props} />
  );
};

export default LazyComponent;