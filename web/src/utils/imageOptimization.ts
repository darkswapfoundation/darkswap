/**
 * Image optimization utilities for DarkSwap
 */

/**
 * Image format
 */
export enum ImageFormat {
  /** JPEG format */
  JPEG = 'jpeg',
  /** PNG format */
  PNG = 'png',
  /** WebP format */
  WEBP = 'webp',
  /** AVIF format */
  AVIF = 'avif',
}

/**
 * Image size
 */
export interface ImageSize {
  /** The width of the image in pixels */
  width: number;
  /** The height of the image in pixels */
  height: number;
}

/**
 * Image optimization options
 */
export interface ImageOptimizationOptions {
  /** The maximum width of the image in pixels */
  maxWidth?: number;
  /** The maximum height of the image in pixels */
  maxHeight?: number;
  /** The quality of the image (0-100) */
  quality?: number;
  /** The format of the image */
  format?: ImageFormat;
  /** Whether to use WebP if supported */
  useWebP?: boolean;
  /** Whether to use AVIF if supported */
  useAVIF?: boolean;
  /** Whether to lazy load the image */
  lazyLoad?: boolean;
  /** Whether to use a blur placeholder */
  blurPlaceholder?: boolean;
  /** The blur amount (1-100) */
  blurAmount?: number;
  /** Whether to use a low-quality image placeholder */
  lqip?: boolean;
  /** The width of the low-quality image placeholder */
  lqipWidth?: number;
}

/**
 * Default image optimization options
 */
const DEFAULT_IMAGE_OPTIMIZATION_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
  format: ImageFormat.JPEG,
  useWebP: true,
  useAVIF: false,
  lazyLoad: true,
  blurPlaceholder: false,
  blurAmount: 10,
  lqip: false,
  lqipWidth: 20,
};

/**
 * Check if WebP is supported
 * @returns A promise that resolves to true if WebP is supported, false otherwise
 */
export async function isWebPSupported(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.width > 0 && image.height > 0);
    image.onerror = () => resolve(false);
    image.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}

/**
 * Check if AVIF is supported
 * @returns A promise that resolves to true if AVIF is supported, false otherwise
 */
export async function isAVIFSupported(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.width > 0 && image.height > 0);
    image.onerror = () => resolve(false);
    image.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK';
  });
}

/**
 * Get the best image format based on browser support
 * @param options Image optimization options
 * @returns A promise that resolves to the best image format
 */
export async function getBestImageFormat(options: ImageOptimizationOptions = {}): Promise<ImageFormat> {
  const mergedOptions = { ...DEFAULT_IMAGE_OPTIMIZATION_OPTIONS, ...options };

  if (mergedOptions.useAVIF && await isAVIFSupported()) {
    return ImageFormat.AVIF;
  }

  if (mergedOptions.useWebP && await isWebPSupported()) {
    return ImageFormat.WEBP;
  }

  return mergedOptions.format || ImageFormat.JPEG;
}

/**
 * Get the image URL with optimization parameters
 * @param url The original image URL
 * @param options Image optimization options
 * @returns The optimized image URL
 */
export function getOptimizedImageUrl(url: string, options: ImageOptimizationOptions = {}): string {
  const mergedOptions = { ...DEFAULT_IMAGE_OPTIMIZATION_OPTIONS, ...options };

  // If the URL is already optimized, return it as is
  if (url.includes('?')) {
    return url;
  }

  // Build the query parameters
  const params = new URLSearchParams();

  if (mergedOptions.maxWidth) {
    params.append('w', mergedOptions.maxWidth.toString());
  }

  if (mergedOptions.maxHeight) {
    params.append('h', mergedOptions.maxHeight.toString());
  }

  if (mergedOptions.quality) {
    params.append('q', mergedOptions.quality.toString());
  }

  if (mergedOptions.format) {
    params.append('fm', mergedOptions.format);
  }

  // Return the URL with the query parameters
  return `${url}?${params.toString()}`;
}

/**
 * Get the image size
 * @param url The image URL
 * @returns A promise that resolves to the image size
 */
export function getImageSize(url: string): Promise<ImageSize> {
  return new Promise<ImageSize>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

/**
 * Create a blur placeholder for an image
 * @param url The image URL
 * @param options Image optimization options
 * @returns A promise that resolves to the blur placeholder data URL
 */
export async function createBlurPlaceholder(url: string, options: ImageOptimizationOptions = {}): Promise<string> {
  const mergedOptions = { ...DEFAULT_IMAGE_OPTIMIZATION_OPTIONS, ...options };
  const blurAmount = mergedOptions.blurAmount || 10;

  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Load the image
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });

  // Set the canvas size
  canvas.width = image.width;
  canvas.height = image.height;

  // Draw the image
  ctx.drawImage(image, 0, 0);

  // Apply the blur filter
  ctx.filter = `blur(${blurAmount}px)`;
  ctx.drawImage(canvas, 0, 0);

  // Return the data URL
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Create a low-quality image placeholder
 * @param url The image URL
 * @param options Image optimization options
 * @returns A promise that resolves to the low-quality image placeholder data URL
 */
export async function createLQIP(url: string, options: ImageOptimizationOptions = {}): Promise<string> {
  const mergedOptions = { ...DEFAULT_IMAGE_OPTIMIZATION_OPTIONS, ...options };
  const lqipWidth = mergedOptions.lqipWidth || 20;

  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Load the image
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });

  // Calculate the aspect ratio
  const aspectRatio = image.width / image.height;
  const lqipHeight = Math.round(lqipWidth / aspectRatio);

  // Set the canvas size
  canvas.width = lqipWidth;
  canvas.height = lqipHeight;

  // Draw the image
  ctx.drawImage(image, 0, 0, lqipWidth, lqipHeight);

  // Return the data URL
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Preload an image
 * @param url The image URL
 * @returns A promise that resolves when the image is loaded
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

/**
 * Preload multiple images
 * @param urls The image URLs
 * @returns A promise that resolves when all images are loaded
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage));
}

/**
 * Create a srcset attribute for responsive images
 * @param url The base image URL
 * @param widths The widths to include in the srcset
 * @param options Image optimization options
 * @returns The srcset attribute value
 */
export function createSrcSet(url: string, widths: number[], options: ImageOptimizationOptions = {}): string {
  return widths
    .map(width => {
      const optimizedUrl = getOptimizedImageUrl(url, { ...options, maxWidth: width });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Create sizes attribute for responsive images
 * @param breakpoints The breakpoints and corresponding sizes
 * @returns The sizes attribute value
 */
export function createSizes(breakpoints: { [key: string]: string }): string {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(min-width: ${breakpoint}) ${size}`)
    .join(', ');
}