import { useState, useEffect } from 'react';

interface WindowDimensions {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Custom hook for getting window dimensions and responsive breakpoints
 * @returns Window dimensions and responsive breakpoints
 */
export function useWindowDimensions(): WindowDimensions {
  // Initialize with default dimensions to prevent hydration mismatch
  const [windowDimensions, setWindowDimensions] = useState<WindowDimensions>({
    width: 1200,
    height: 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Function to update dimensions
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine device type based on width
      // These breakpoints should match your Tailwind config
      const isMobile = width < 640;  // sm
      const isTablet = width >= 640 && width < 1024;  // md to lg
      const isDesktop = width >= 1024;  // lg and above
      
      setWindowDimensions({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
      });
    };

    // Set dimensions on mount
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

/**
 * Custom hook for detecting if an element is visible in the viewport
 * @param ref - React ref object for the element to observe
 * @param rootMargin - Margin around the root (default: "0px")
 * @returns Whether the element is visible
 */
export function useIntersectionObserver<T extends HTMLElement>(
  ref: React.RefObject<T>,
  rootMargin: string = '0px'
): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, rootMargin]);

  return isVisible;
}

/**
 * Custom hook for detecting scroll position
 * @param threshold - Scroll threshold in pixels (default: 100)
 * @returns Whether the scroll position is past the threshold
 */
export function useScrollPosition(threshold: number = 100): boolean {
  const [isPastThreshold, setIsPastThreshold] = useState<boolean>(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      setIsPastThreshold(window.scrollY > threshold);
    };

    // Set initial value
    handleScroll();
    
    // Add event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isPastThreshold;
}