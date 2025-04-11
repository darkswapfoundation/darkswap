import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

/**
 * VirtualListItem
 * 
 * Interface for a virtual list item.
 */
export interface VirtualListItem {
  /**
   * The index of the item in the original list
   */
  index: number;
  
  /**
   * The item data
   */
  data: any;
  
  /**
   * The style to apply to the item
   */
  style: React.CSSProperties;
}

/**
 * VirtualListOptions
 * 
 * Options for the virtual list.
 */
export interface VirtualListOptions {
  /**
   * The height of each item in pixels
   */
  itemHeight: number;
  
  /**
   * The number of items to render above and below the visible area
   */
  overscan?: number;
}

/**
 * useVirtualList
 * 
 * A custom hook that provides virtual list functionality.
 * 
 * @param items The list of items
 * @param options The virtual list options
 * @returns The virtual list state and methods
 */
export function useVirtualList<T>(
  items: T[],
  options: VirtualListOptions
): {
  containerProps: {
    ref: React.RefObject<HTMLDivElement>;
    style: React.CSSProperties;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  };
  virtualItems: VirtualListItem[];
  totalHeight: number;
  scrollToIndex: (index: number) => void;
} {
  const { itemHeight, overscan = 3 } = options;
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  
  // Calculate the total height of the list
  const totalHeight = useMemo(() => {
    return items.length * itemHeight;
  }, [items.length, itemHeight]);
  
  // Calculate the range of visible items
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);
  
  // Create the virtual items
  const virtualItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    
    return items.slice(startIndex, endIndex + 1).map((item, index) => {
      const virtualIndex = startIndex + index;
      
      return {
        index: virtualIndex,
        data: item,
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${itemHeight}px`,
          transform: `translateY(${virtualIndex * itemHeight}px)`,
        },
      };
    });
  }, [items, visibleRange, itemHeight]);
  
  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);
  
  // Scroll to a specific index
  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);
  
  // Update the container height when the container is resized
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      const { height } = entries[0].contentRect;
      setContainerHeight(height);
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Return the virtual list state and methods
  return {
    containerProps: {
      ref: containerRef,
      style: {
        position: 'relative',
        overflow: 'auto',
        willChange: 'transform',
        height: '100%',
      },
      onScroll: handleScroll,
    },
    virtualItems,
    totalHeight,
    scrollToIndex,
  };
}

/**
 * Example usage:
 * 
 * ```tsx
 * const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, text: `Item ${i}` }));
 * 
 * const MyVirtualList = () => {
 *   const { containerProps, virtualItems, totalHeight } = useVirtualList(items, {
 *     itemHeight: 50,
 *     overscan: 5,
 *   });
 * 
 *   return (
 *     <div {...containerProps}>
 *       <div style={{ height: totalHeight }}>
 *         {virtualItems.map((virtualItem) => (
 *           <div
 *             key={virtualItem.index}
 *             style={virtualItem.style}
 *           >
 *             {virtualItem.data.text}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 */

export default useVirtualList;