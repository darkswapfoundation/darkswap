import React, { useState, useEffect } from 'react';
import {
  ImageOptimizationOptions,
  getOptimizedImageUrl,
  createBlurPlaceholder,
  createLQIP,
  createSrcSet,
  createSizes,
  getBestImageFormat,
  ImageFormat,
} from '../utils/imageOptimization';

/**
 * OptimizedImage props
 */
export interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError'> {
  /** The image source URL */
  src: string;
  /** The image alt text */
  alt: string;
  /** The image width */
  width?: number;
  /** The image height */
  height?: number;
  /** Image optimization options */
  options?: ImageOptimizationOptions;
  /** The widths to include in the srcset */
  srcsetWidths?: number[];
  /** The breakpoints and corresponding sizes for the sizes attribute */
  breakpoints?: { [key: string]: string };
  /** The default size for the sizes attribute */
  defaultSize?: string;
  /** Whether to use a placeholder while loading */
  usePlaceholder?: boolean;
  /** The placeholder type */
  placeholderType?: 'blur' | 'lqip' | 'color';
  /** The placeholder color (for color placeholders) */
  placeholderColor?: string;
  /** The CSS class name for the image */
  className?: string;
  /** The CSS style for the image */
  style?: React.CSSProperties;
  /** The CSS class name for the container */
  containerClassName?: string;
  /** The CSS style for the container */
  containerStyle?: React.CSSProperties;
  /** The CSS class name for the placeholder */
  placeholderClassName?: string;
  /** The CSS style for the placeholder */
  placeholderStyle?: React.CSSProperties;
  /** The loading attribute */
  loading?: 'lazy' | 'eager';
  /** The decoding attribute */
  decoding?: 'async' | 'sync' | 'auto';
  /** The fetchpriority attribute */
  fetchpriority?: 'high' | 'low' | 'auto';
  /** The onLoad callback */
  onLoad?: () => void;
  /** The onError callback */
  onImageError?: (error: Error) => void;
}

/**
 * OptimizedImage component
 * @param props The component props
 * @returns The component
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  options = {},
  srcsetWidths,
  breakpoints,
  defaultSize,
  usePlaceholder = true,
  placeholderType = 'blur',
  placeholderColor = '#f0f0f0',
  className,
  style,
  containerClassName,
  containerStyle,
  placeholderClassName,
  placeholderStyle,
  loading = 'lazy',
  decoding = 'async',
  fetchpriority = 'auto',
  onLoad,
  onImageError,
  ...rest
}) => {
  // State
  const [isLoaded, setIsLoaded] = useState(false);
  const [placeholder, setPlaceholder] = useState<string | null>(null);
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  const [srcSet, setSrcSet] = useState<string | undefined>(undefined);
  const [sizesAttr, setSizesAttr] = useState<string | undefined>(undefined);

  // Effect to optimize the image
  useEffect(() => {
    const optimizeImage = async () => {
      try {
        // Get the best image format
        const format = await getBestImageFormat(options);
        
        // Update the options with the best format
        const updatedOptions = { ...options, format };
        
        // Get the optimized image URL
        const optimized = getOptimizedImageUrl(src, updatedOptions);
        setOptimizedSrc(optimized);
        
        // Create srcset if widths are provided
        if (srcsetWidths && srcsetWidths.length > 0) {
          const srcset = createSrcSet(src, srcsetWidths, updatedOptions);
          setSrcSet(srcset);
        }
        
        // Create sizes attribute if breakpoints are provided
        if (breakpoints && Object.keys(breakpoints).length > 0) {
          const sizesString = createSizes(breakpoints) + (defaultSize ? `, ${defaultSize}` : '');
          setSizesAttr(sizesString);
        }
        
        // Create placeholder if needed
        if (usePlaceholder) {
          if (placeholderType === 'blur') {
            const blurPlaceholder = await createBlurPlaceholder(src, updatedOptions);
            setPlaceholder(blurPlaceholder);
          } else if (placeholderType === 'lqip') {
            const lqip = await createLQIP(src, updatedOptions);
            setPlaceholder(lqip);
          } else {
            setPlaceholder(null);
          }
        }
      } catch (error) {
        console.error('Failed to optimize image:', error);
        setOptimizedSrc(src);
        if (onImageError) {
          onImageError(error instanceof Error ? error : new Error('Failed to optimize image'));
        }
      }
    };
    
    optimizeImage();
  }, [src, options, srcsetWidths, breakpoints, defaultSize, usePlaceholder, placeholderType, onImageError]);
  
  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };
  
  // Handle image error
  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (onImageError) {
      onImageError(new Error(`Failed to load image: ${optimizedSrc}`));
    }
  };
  
  // Calculate aspect ratio for placeholder
  const aspectRatio = width && height ? width / height : undefined;
  
  // Placeholder style
  const computedPlaceholderStyle: React.CSSProperties = {
    backgroundColor: placeholderColor,
    backgroundImage: placeholder ? `url(${placeholder})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: isLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out',
    ...placeholderStyle,
  };
  
  // Container style
  const computedContainerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : undefined,
    paddingBottom: !height && aspectRatio ? `${100 / aspectRatio}%` : undefined,
    ...containerStyle,
  };
  
  // Image style
  const computedImageStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    ...style,
  };
  
  return (
    <div className={containerClassName} style={computedContainerStyle}>
      {usePlaceholder && (
        <div className={placeholderClassName} style={computedPlaceholderStyle} />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        srcSet={srcSet}
        sizes={sizesAttr}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchpriority}
        className={className}
        style={computedImageStyle}
        onLoad={handleLoad}
        onError={handleError}
        {...rest}
      />
    </div>
  );
};

export default OptimizedImage;