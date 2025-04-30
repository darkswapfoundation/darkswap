import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * ResizeObserverEntry
 * 
 * Interface for a resize observer entry.
 */
export interface ResizeObserverSize {
  /**
   * The width of the observed element
   */
  width: number;
  
  /**
   * The height of the observed element
   */
  height: number;
  
  /**
   * The x position of the observed element
   */
  x: number;
  
  /**
   * The y position of the observed element
   */
  y: number;
}

/**
 * useResizeObserver
 * 
 * A custom hook that observes the size of an element.
 * 
 * @returns The resize observer state and ref
 */
export function useResizeObserver<T extends HTMLElement = HTMLDivElement>(): {
  ref: React.RefObject<T>;
  size: ResizeObserverSize | undefined;
} {
  const [size, setSize] = useState<ResizeObserverSize>();
  const ref = useRef<T>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      
      if (entry) {
        const { width, height } = entry.contentRect;
        const { x, y } = entry.target.getBoundingClientRect();
        
        setSize({
          width,
          height,
          x,
          y,
        });
      }
    });
    
    resizeObserver.observe(ref.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  return { ref, size };
}

/**
 * useElementSize
 * 
 * A custom hook that returns the size of an element.
 * 
 * @returns The element size and ref
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>(): {
  ref: React.RefObject<T>;
  width: number;
  height: number;
} {
  const { ref, size } = useResizeObserver<T>();
  
  return {
    ref,
    width: size?.width || 0,
    height: size?.height || 0,
  };
}

/**
 * useWindowSize
 * 
 * A custom hook that returns the size of the window.
 * 
 * @returns The window size
 */
export function useWindowSize(): {
  width: number;
  height: number;
} {
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return windowSize;
}

/**
 * useBreakpoint
 * 
 * A custom hook that returns the current breakpoint.
 * 
 * @param breakpoints The breakpoints to use
 * @returns The current breakpoint
 */
export function useBreakpoint<T extends string>(
  breakpoints: Record<T, number>
): T {
  const { width } = useWindowSize();
  
  return useMemo(() => {
    const sortedBreakpoints = Object.entries(breakpoints)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1]) as [T, number][];
    
    const breakpoint = sortedBreakpoints.find(([_, value]) => width >= value);
    
    return breakpoint ? breakpoint[0] : sortedBreakpoints[sortedBreakpoints.length - 1][0];
  }, [width, breakpoints]);
}

/**
 * useResponsiveValue
 * 
 * A custom hook that returns a value based on the current breakpoint.
 * 
 * @param values The values to use for each breakpoint
 * @param breakpoints The breakpoints to use
 * @returns The value for the current breakpoint
 */
export function useResponsiveValue<T, B extends string>(
  values: Record<B, T>,
  breakpoints: Record<B, number>
): T {
  const breakpoint = useBreakpoint(breakpoints);
  
  return values[breakpoint];
}

export default {
  useResizeObserver,
  useElementSize,
  useWindowSize,
  useBreakpoint,
  useResponsiveValue,
};