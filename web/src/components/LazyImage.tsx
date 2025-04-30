/**
 * LazyImage - React component for lazy loading images
 * 
 * This component uses the LazyLoader utility to efficiently load images
 * only when they are about to enter the viewport, improving initial page load
 * performance and reducing unnecessary network requests.
 */

import React, { useState, useRef, useEffect } from 'react';
import lazyLoader from '../utils/LazyLoader';

export interface LazyImageProps {
  /** Image source URL */
  src: string;
  /** Alternative text for the image */
  alt: string;
  /** Width of the image */
  width?: number | string;
  /** Height of the image */
  height?: number | string;
  /** CSS class name */
  className?: string;
  /** Placeholder image to show while loading */
  placeholder?: string;
  /** Whether to blur the placeholder */
  blurPlaceholder?: boolean;
  /** Loading priority */
  priority?: 'high' | 'medium' | 'low';
  /** Whether to preload the image */
  preload?: boolean;
  /** Function called when the image is loaded */
  onLoad?: () => void;
  /** Function called when the image fails to load */
  onError?: (error: Error) => void;
  /** Object fit style */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Object position style */
  objectPosition?: string;
  /** Whether to fade in the image when loaded */
  fadeIn?: boolean;
  /** Duration of fade-in animation in milliseconds */
  fadeInDuration?: number;
}

/**
 * LazyImage component for lazy loading images
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  blurPlaceholder = true,
  priority = 'medium',
  preload = false,
  onLoad,
  onError,
  objectFit,
  objectPosition,
  fadeIn = true,
  fadeInDuration = 300,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Preload image if requested
  useEffect(() => {
    if (preload) {
      lazyLoader.preloadResource(src, 'image', { priority });
    }
  }, [src, preload, priority]);

  // Set up intersection observer
  useEffect(() => {
    const currentRef = imgRef.current;
    if (!currentRef) return;

    // Create observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load image when it enters viewport
            lazyLoader
              .loadResource(src, 'image', {
                priority,
                onLoad: () => {
                  setLoaded(true);
                  if (onLoad) onLoad();
                },
                onError: (err) => {
                  setError(err);
                  if (onError) onError(err);
                },
              })
              .then(() => {
                // Image is now loaded
                if (currentRef) {
                  currentRef.src = src;
                }
              })
              .catch(() => {
                // Error handled by onError callback
              });

            // Unobserve once loading starts
            observer.unobserve(currentRef);
          }
        });
      },
      {
        rootMargin: '200px', // Start loading when within 200px of viewport
        threshold: 0.01,
      }
    );

    // Start observing
    observer.observe(currentRef);

    // Cleanup
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [src, priority, onLoad, onError]);

  // Generate class names
  const imageClasses = [
    'lazy-image',
    loaded && 'lazy-image-loaded',
    error && 'lazy-image-error',
    fadeIn && 'lazy-image-fade',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Generate styles
  const imageStyles: React.CSSProperties = {
    objectFit,
    objectPosition,
    transition: fadeIn ? `opacity ${fadeInDuration}ms ease-in-out` : undefined,
    opacity: loaded ? 1 : 0,
  };

  // Generate placeholder styles
  const placeholderStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit,
    objectPosition,
    filter: blurPlaceholder ? 'blur(10px)' : undefined,
    opacity: loaded ? 0 : 1,
    transition: fadeIn ? `opacity ${fadeInDuration}ms ease-in-out` : undefined,
  };

  return (
    <div
      className="lazy-image-container"
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
      }}
    >
      {placeholder && (
        <img
          src={placeholder}
          alt=""
          className="lazy-image-placeholder"
          style={placeholderStyles}
          aria-hidden="true"
        />
      )}
      <img
        ref={imgRef}
        src={placeholder || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'} // Transparent 1x1 pixel
        data-src={src}
        alt={alt}
        className={imageClasses}
        style={imageStyles}
        width={width}
        height={height}
      />
      {error && (
        <div
          className="lazy-image-error-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            color: '#ff5555',
          }}
        >
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;