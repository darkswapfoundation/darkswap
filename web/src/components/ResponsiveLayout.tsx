import React, { ReactNode } from 'react';
import { useWindowSize } from '../hooks/useResizeObserver';

/**
 * Breakpoints for responsive layout
 */
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

/**
 * Props for the ResponsiveLayout component
 */
interface ResponsiveLayoutProps {
  /**
   * The children to render
   */
  children: ReactNode;
  
  /**
   * The layout direction
   */
  direction?: 'row' | 'column';
  
  /**
   * The layout direction for each breakpoint
   */
  directionBreakpoints?: {
    xs?: 'row' | 'column';
    sm?: 'row' | 'column';
    md?: 'row' | 'column';
    lg?: 'row' | 'column';
    xl?: 'row' | 'column';
    xxl?: 'row' | 'column';
  };
  
  /**
   * The layout gap
   */
  gap?: number;
  
  /**
   * The layout gap for each breakpoint
   */
  gapBreakpoints?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  
  /**
   * The layout padding
   */
  padding?: number;
  
  /**
   * The layout padding for each breakpoint
   */
  paddingBreakpoints?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  
  /**
   * The layout margin
   */
  margin?: number;
  
  /**
   * The layout margin for each breakpoint
   */
  marginBreakpoints?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  
  /**
   * The layout width
   */
  width?: string | number;
  
  /**
   * The layout width for each breakpoint
   */
  widthBreakpoints?: {
    xs?: string | number;
    sm?: string | number;
    md?: string | number;
    lg?: string | number;
    xl?: string | number;
    xxl?: string | number;
  };
  
  /**
   * The layout height
   */
  height?: string | number;
  
  /**
   * The layout height for each breakpoint
   */
  heightBreakpoints?: {
    xs?: string | number;
    sm?: string | number;
    md?: string | number;
    lg?: string | number;
    xl?: string | number;
    xxl?: string | number;
  };
  
  /**
   * The layout justify content
   */
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  
  /**
   * The layout justify content for each breakpoint
   */
  justifyContentBreakpoints?: {
    xs?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    sm?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    md?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    lg?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    xl?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    xxl?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  };
  
  /**
   * The layout align items
   */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  
  /**
   * The layout align items for each breakpoint
   */
  alignItemsBreakpoints?: {
    xs?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    sm?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    md?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    lg?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    xl?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    xxl?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  };
  
  /**
   * The layout flex wrap
   */
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  
  /**
   * The layout flex wrap for each breakpoint
   */
  flexWrapBreakpoints?: {
    xs?: 'nowrap' | 'wrap' | 'wrap-reverse';
    sm?: 'nowrap' | 'wrap' | 'wrap-reverse';
    md?: 'nowrap' | 'wrap' | 'wrap-reverse';
    lg?: 'nowrap' | 'wrap' | 'wrap-reverse';
    xl?: 'nowrap' | 'wrap' | 'wrap-reverse';
    xxl?: 'nowrap' | 'wrap' | 'wrap-reverse';
  };
  
  /**
   * Additional CSS styles
   */
  style?: React.CSSProperties;
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * ResponsiveLayout component
 * 
 * A component that provides a responsive layout based on the window size.
 * 
 * @param props The component props
 * @returns The responsive layout component
 */
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  direction = 'row',
  directionBreakpoints,
  gap = 0,
  gapBreakpoints,
  padding = 0,
  paddingBreakpoints,
  margin = 0,
  marginBreakpoints,
  width,
  widthBreakpoints,
  height,
  heightBreakpoints,
  justifyContent = 'flex-start',
  justifyContentBreakpoints,
  alignItems = 'flex-start',
  alignItemsBreakpoints,
  flexWrap = 'nowrap',
  flexWrapBreakpoints,
  style,
  className,
}) => {
  const { width: windowWidth } = useWindowSize();
  
  // Determine the current breakpoint
  const currentBreakpoint = 
    windowWidth >= breakpoints.xxl ? 'xxl' :
    windowWidth >= breakpoints.xl ? 'xl' :
    windowWidth >= breakpoints.lg ? 'lg' :
    windowWidth >= breakpoints.md ? 'md' :
    windowWidth >= breakpoints.sm ? 'sm' :
    'xs';
  
  // Get the value for the current breakpoint
  const getBreakpointValue = <T,>(
    defaultValue: T,
    breakpointValues?: { [key: string]: T }
  ): T => {
    if (!breakpointValues) {
      return defaultValue;
    }
    
    // Find the largest breakpoint that is less than or equal to the current window width
    if (currentBreakpoint === 'xxl' && breakpointValues.xxl !== undefined) {
      return breakpointValues.xxl;
    } else if ((currentBreakpoint === 'xxl' || currentBreakpoint === 'xl') && breakpointValues.xl !== undefined) {
      return breakpointValues.xl;
    } else if ((currentBreakpoint === 'xxl' || currentBreakpoint === 'xl' || currentBreakpoint === 'lg') && breakpointValues.lg !== undefined) {
      return breakpointValues.lg;
    } else if ((currentBreakpoint === 'xxl' || currentBreakpoint === 'xl' || currentBreakpoint === 'lg' || currentBreakpoint === 'md') && breakpointValues.md !== undefined) {
      return breakpointValues.md;
    } else if ((currentBreakpoint === 'xxl' || currentBreakpoint === 'xl' || currentBreakpoint === 'lg' || currentBreakpoint === 'md' || currentBreakpoint === 'sm') && breakpointValues.sm !== undefined) {
      return breakpointValues.sm;
    } else if (breakpointValues.xs !== undefined) {
      return breakpointValues.xs;
    }
    
    return defaultValue;
  };
  
  // Get the values for the current breakpoint
  const currentDirection = getBreakpointValue(direction, directionBreakpoints);
  const currentGap = getBreakpointValue(gap, gapBreakpoints);
  const currentPadding = getBreakpointValue(padding, paddingBreakpoints);
  const currentMargin = getBreakpointValue(margin, marginBreakpoints);
  const currentWidth = getBreakpointValue(width, widthBreakpoints);
  const currentHeight = getBreakpointValue(height, heightBreakpoints);
  const currentJustifyContent = getBreakpointValue(justifyContent, justifyContentBreakpoints);
  const currentAlignItems = getBreakpointValue(alignItems, alignItemsBreakpoints);
  const currentFlexWrap = getBreakpointValue(flexWrap, flexWrapBreakpoints);
  
  // Create the style object
  const responsiveStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: currentDirection,
    gap: currentGap,
    padding: currentPadding,
    margin: currentMargin,
    width: currentWidth,
    height: currentHeight,
    justifyContent: currentJustifyContent,
    alignItems: currentAlignItems,
    flexWrap: currentFlexWrap,
    ...style,
  };
  
  return (
    <div style={responsiveStyle} className={className}>
      {children}
    </div>
  );
};

/**
 * Container component
 * 
 * A component that provides a responsive container with a maximum width.
 * 
 * @param props The component props
 * @returns The container component
 */
export const Container: React.FC<Omit<ResponsiveLayoutProps, 'width' | 'widthBreakpoints'>> = (props) => {
  const { width: windowWidth } = useWindowSize();
  
  // Determine the container width based on the window width
  const containerWidth =
    windowWidth >= breakpoints.xxl ? '1320px' :
    windowWidth >= breakpoints.xl ? '1140px' :
    windowWidth >= breakpoints.lg ? '960px' :
    windowWidth >= breakpoints.md ? '720px' :
    windowWidth >= breakpoints.sm ? '540px' :
    '100%';
  
  return (
    <ResponsiveLayout
      {...props}
      width={containerWidth}
      style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        ...props.style,
      }}
    />
  );
};

/**
 * Row component
 * 
 * A component that provides a responsive row layout.
 * 
 * @param props The component props
 * @returns The row component
 */
export const Row: React.FC<Omit<ResponsiveLayoutProps, 'direction' | 'directionBreakpoints'>> = (props) => {
  return (
    <ResponsiveLayout
      {...props}
      direction="row"
      flexWrap={props.flexWrap || 'wrap'}
    />
  );
};

/**
 * Column component
 * 
 * A component that provides a responsive column layout.
 * 
 * @param props The component props
 * @returns The column component
 */
export const Column: React.FC<Omit<ResponsiveLayoutProps, 'direction' | 'directionBreakpoints'>> = (props) => {
  return (
    <ResponsiveLayout
      {...props}
      direction="column"
    />
  );
};

export default ResponsiveLayout;