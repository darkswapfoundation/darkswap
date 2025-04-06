/**
 * LazyLoader - Utility for lazy loading components and resources
 * 
 * This utility provides functions for lazy loading React components,
 * images, scripts, and other resources to improve initial load time
 * and overall performance.
 */

import React, { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Options for lazy loading components
 */
export interface LazyComponentOptions {
  /** Fallback component to show while loading */
  fallback?: React.ReactNode;
  /** Error boundary component */
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Whether to preload the component */
  preload?: boolean;
  /** Timeout in milliseconds before showing the fallback */
  timeout?: number;
}

/**
 * Options for lazy loading resources
 */
export interface LazyResourceOptions {
  /** Priority of the resource (higher = more important) */
  priority?: 'high' | 'medium' | 'low';
  /** Whether to preload the resource */
  preload?: boolean;
  /** Callback when resource is loaded */
  onLoad?: () => void;
  /** Callback when resource fails to load */
  onError?: (error: Error) => void;
  /** Timeout in milliseconds before failing */
  timeout?: number;
}

/**
 * Resource types that can be lazy loaded
 */
export type ResourceType = 'script' | 'style' | 'image' | 'font' | 'audio' | 'video';

/**
 * Resource status
 */
export type ResourceStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Resource information
 */
export interface ResourceInfo {
  /** Resource URL */
  url: string;
  /** Resource type */
  type: ResourceType;
  /** Resource status */
  status: ResourceStatus;
  /** Error if loading failed */
  error?: Error;
  /** Element reference */
  element?: HTMLElement;
}

/**
 * Class for managing lazy loading of components and resources
 */
export class LazyLoader {
  private static instance: LazyLoader;
  private loadedResources: Map<string, ResourceInfo> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private preloadQueue: string[] = [];
  private observer: IntersectionObserver | null = null;
  private isInitialized = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize intersection observer if available
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
        rootMargin: '200px', // Load when within 200px of viewport
        threshold: 0.01,
      });
    }
  }

  /**
   * Get the singleton instance
   * @returns LazyLoader instance
   */
  public static getInstance(): LazyLoader {
    if (!LazyLoader.instance) {
      LazyLoader.instance = new LazyLoader();
    }
    return LazyLoader.instance;
  }

  /**
   * Initialize the lazy loader
   */
  public initialize(): void {
    if (this.isInitialized) return;

    // Set up event listeners
    if (typeof window !== 'undefined') {
      // Process preload queue when page is idle
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(this.processPreloadQueue.bind(this));
      } else {
        setTimeout(this.processPreloadQueue.bind(this), 1000);
      }

      // Process preload queue when network is idle
      if ('connection' in navigator && (navigator as any).connection) {
        const connection = (navigator as any).connection;
        if ('onchange' in connection) {
          connection.addEventListener('change', () => {
            if (connection.effectiveType === '4g' && !connection.saveData) {
              this.processPreloadQueue();
            }
          });
        }
      }
    }

    this.isInitialized = true;
  }

  /**
   * Create a lazy loaded component
   * @param factory Function that imports the component
   * @param options Lazy component options
   * @returns Lazy component
   */
  public createLazyComponent<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>,
    options: LazyComponentOptions = {}
  ): LazyExoticComponent<T> {
    // Create lazy component
    const lazyComponent = lazy(factory);

    // Preload if requested
    if (options.preload) {
      this.preloadQueue.push('component:' + factory.toString());
      this.processPreloadQueue();
    }

    return lazyComponent;
  }

  /**
   * Lazy load a resource
   * @param url Resource URL
   * @param type Resource type
   * @param options Lazy resource options
   * @returns Promise that resolves when the resource is loaded
   */
  public loadResource(
    url: string,
    type: ResourceType,
    options: LazyResourceOptions = {}
  ): Promise<ResourceInfo> {
    // Check if already loaded or loading
    if (this.loadedResources.has(url)) {
      const resourceInfo = this.loadedResources.get(url)!;
      if (resourceInfo.status === 'loaded') {
        return Promise.resolve(resourceInfo);
      } else if (resourceInfo.status === 'error') {
        return Promise.reject(resourceInfo.error);
      }
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Create resource info
    const resourceInfo: ResourceInfo = {
      url,
      type,
      status: 'loading',
    };

    // Add to loaded resources
    this.loadedResources.set(url, resourceInfo);

    // Create loading promise
    const loadingPromise = new Promise<ResourceInfo>((resolve, reject) => {
      // Create timeout if specified
      let timeoutId: NodeJS.Timeout | undefined;
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          const error = new Error(`Timeout loading resource: ${url}`);
          resourceInfo.status = 'error';
          resourceInfo.error = error;
          if (options.onError) options.onError(error);
          reject(error);
        }, options.timeout);
      }

      // Load resource based on type
      switch (type) {
        case 'script':
          this.loadScript(url, resourceInfo, options, resolve, reject, timeoutId);
          break;
        case 'style':
          this.loadStyle(url, resourceInfo, options, resolve, reject, timeoutId);
          break;
        case 'image':
          this.loadImage(url, resourceInfo, options, resolve, reject, timeoutId);
          break;
        case 'font':
          this.loadFont(url, resourceInfo, options, resolve, reject, timeoutId);
          break;
        case 'audio':
          this.loadAudio(url, resourceInfo, options, resolve, reject, timeoutId);
          break;
        case 'video':
          this.loadVideo(url, resourceInfo, options, resolve, reject, timeoutId);
          break;
        default:
          const error = new Error(`Unsupported resource type: ${type}`);
          resourceInfo.status = 'error';
          resourceInfo.error = error;
          if (options.onError) options.onError(error);
          reject(error);
          break;
      }
    });

    // Add to loading promises
    this.loadingPromises.set(url, loadingPromise);

    // Return promise
    return loadingPromise;
  }

  /**
   * Preload a resource
   * @param url Resource URL
   * @param type Resource type
   * @param options Lazy resource options
   */
  public preloadResource(
    url: string,
    type: ResourceType,
    options: LazyResourceOptions = {}
  ): void {
    // Add to preload queue
    this.preloadQueue.push(`${type}:${url}`);

    // Process queue if high priority
    if (options.priority === 'high') {
      this.processPreloadQueue();
    }
  }

  /**
   * Process the preload queue
   */
  private processPreloadQueue(): void {
    // Process up to 5 items at a time
    const itemsToProcess = this.preloadQueue.splice(0, 5);

    // Process each item
    itemsToProcess.forEach((item) => {
      const [type, url] = item.split(':');

      if (type === 'component') {
        // Preload component
        const factory = new Function(`return ${url}`)();
        factory();
      } else {
        // Preload resource
        this.loadResource(url, type as ResourceType, { priority: 'low' }).catch(() => {
          // Ignore errors for preloaded resources
        });
      }
    });

    // Continue processing if more items in queue
    if (this.preloadQueue.length > 0) {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(this.processPreloadQueue.bind(this));
      } else {
        setTimeout(this.processPreloadQueue.bind(this), 1000);
      }
    }
  }

  /**
   * Handle intersection observer entries
   * @param entries Intersection observer entries
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const url = element.getAttribute('data-src');
        const type = element.getAttribute('data-type') as ResourceType;

        if (url && type) {
          // Load resource
          this.loadResource(url, type).then(() => {
            // Update element
            if (type === 'image' && element instanceof HTMLImageElement) {
              element.src = url;
            } else if (type === 'video' && element instanceof HTMLVideoElement) {
              element.src = url;
            } else if (type === 'audio' && element instanceof HTMLAudioElement) {
              element.src = url;
            }

            // Remove from observer
            this.observer?.unobserve(element);
          });
        }
      }
    });
  }

  /**
   * Observe an element for lazy loading
   * @param element Element to observe
   * @param url Resource URL
   * @param type Resource type
   */
  public observe(element: HTMLElement, url: string, type: ResourceType): void {
    if (!this.observer) return;

    // Set data attributes
    element.setAttribute('data-src', url);
    element.setAttribute('data-type', type);

    // Observe element
    this.observer.observe(element);
  }

  /**
   * Load a script
   */
  private loadScript(
    url: string,
    resourceInfo: ResourceInfo,
    options: LazyResourceOptions,
    resolve: (value: ResourceInfo) => void,
    reject: (reason: Error) => void,
    timeoutId?: NodeJS.Timeout
  ): void {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      if (timeoutId) clearTimeout(timeoutId);
      resourceInfo.status = 'loaded';
      resourceInfo.element = script;
      if (options.onLoad) options.onLoad();
      resolve(resourceInfo);
    };

    script.onerror = (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      const error = new Error(`Failed to load script: ${url}`);
      resourceInfo.status = 'error';
      resourceInfo.error = error;
      if (options.onError) options.onError(error);
      reject(error);
    };

    document.head.appendChild(script);
  }

  /**
   * Load a stylesheet
   */
  private loadStyle(
    url: string,
    resourceInfo: ResourceInfo,
    options: LazyResourceOptions,
    resolve: (value: ResourceInfo) => void,
    reject: (reason: Error) => void,
    timeoutId?: NodeJS.Timeout
  ): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;

    link.onload = () => {
      if (timeoutId) clearTimeout(timeoutId);
      resourceInfo.status = 'loaded';
      resourceInfo.element = link;
      if (options.onLoad) options.onLoad();
      resolve(resourceInfo);
    };

    link.onerror = (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      const error = new Error(`Failed to load stylesheet: ${url}`);
      resourceInfo.status = 'error';
      resourceInfo.error = error;
      if (options.onError) options.onError(error);
      reject(error);
    };

    document.head.appendChild(link);
  }

  /**
   * Load an image
   */
  private loadImage(
    url: string,
    resourceInfo: ResourceInfo,
    options: LazyResourceOptions,
    resolve: (value: ResourceInfo) => void,
    reject: (reason: Error) => void,
    timeoutId?: NodeJS.Timeout
  ): void {
    const image = new Image();

    image.onload = () => {
      if (timeoutId) clearTimeout(timeoutId);
      resourceInfo.status = 'loaded';
      resourceInfo.element = image;
      if (options.onLoad) options.onLoad();
      resolve(resourceInfo);
    };

    image.onerror = (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      const error = new Error(`Failed to load image: ${url}`);
      resourceInfo.status = 'error';
      resourceInfo.error = error;
      if (options.onError) options.onError(error);
      reject(error);
    };

    image.src = url;
  }

  /**
   * Load a font
   */
  private loadFont(
    url: string,
    resourceInfo: ResourceInfo,
    options: LazyResourceOptions,
    resolve: (value: ResourceInfo) => void,
    reject: (reason: Error) => void,
    timeoutId?: NodeJS.Timeout
  ): void {
    // Use FontFace API if available
    if ('FontFace' in window) {
      const fontName = url.split('/').pop()?.split('.')[0] || 'LazyFont';
      const fontFace = new FontFace(fontName, `url(${url})`);

      fontFace
        .load()
        .then((loadedFace) => {
          if (timeoutId) clearTimeout(timeoutId);
          (document.fonts as any).add(loadedFace);
          resourceInfo.status = 'loaded';
          if (options.onLoad) options.onLoad();
          resolve(resourceInfo);
        })
        .catch((error) => {
          if (timeoutId) clearTimeout(timeoutId);
          resourceInfo.status = 'error';
          resourceInfo.error = error;
          if (options.onError) options.onError(error);
          reject(error);
        });
    } else {
      // Fallback to CSS @font-face
      this.loadStyle(
        url,
        resourceInfo,
        options,
        resolve,
        reject,
        timeoutId
      );
    }
  }

  /**
   * Load an audio file
   */
  private loadAudio(
    url: string,
    resourceInfo: ResourceInfo,
    options: LazyResourceOptions,
    resolve: (value: ResourceInfo) => void,
    reject: (reason: Error) => void,
    timeoutId?: NodeJS.Timeout
  ): void {
    const audio = new Audio();

    audio.oncanplaythrough = () => {
      if (timeoutId) clearTimeout(timeoutId);
      resourceInfo.status = 'loaded';
      resourceInfo.element = audio;
      if (options.onLoad) options.onLoad();
      resolve(resourceInfo);
    };

    audio.onerror = (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      const error = new Error(`Failed to load audio: ${url}`);
      resourceInfo.status = 'error';
      resourceInfo.error = error;
      if (options.onError) options.onError(error);
      reject(error);
    };

    audio.src = url;
    audio.load();
  }

  /**
   * Load a video file
   */
  private loadVideo(
    url: string,
    resourceInfo: ResourceInfo,
    options: LazyResourceOptions,
    resolve: (value: ResourceInfo) => void,
    reject: (reason: Error) => void,
    timeoutId?: NodeJS.Timeout
  ): void {
    const video = document.createElement('video');

    video.oncanplaythrough = () => {
      if (timeoutId) clearTimeout(timeoutId);
      resourceInfo.status = 'loaded';
      resourceInfo.element = video;
      if (options.onLoad) options.onLoad();
      resolve(resourceInfo);
    };

    video.onerror = (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      const error = new Error(`Failed to load video: ${url}`);
      resourceInfo.status = 'error';
      resourceInfo.error = error;
      if (options.onError) options.onError(error);
      reject(error);
    };

    video.src = url;
    video.load();
  }
}

// Initialize and export singleton instance
const lazyLoader = LazyLoader.getInstance();
lazyLoader.initialize();
export default lazyLoader;