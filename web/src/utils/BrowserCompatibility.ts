/**
 * Browser compatibility utility for DarkSwap
 * 
 * This utility provides functions for detecting browser compatibility.
 */

import { logger } from '../../../src/utils/logger';

/**
 * Browser information
 */
export interface BrowserInfo {
  /**
   * The browser name
   */
  name: string;
  
  /**
   * The browser version
   */
  version: string;
  
  /**
   * The operating system
   */
  os: string;
  
  /**
   * Whether the browser is mobile
   */
  isMobile: boolean;
  
  /**
   * Whether the browser is a tablet
   */
  isTablet: boolean;
  
  /**
   * Whether the browser is desktop
   */
  isDesktop: boolean;
}

/**
 * Feature support
 */
export interface FeatureSupport {
  /**
   * Whether WebAssembly is supported
   */
  webAssembly: boolean;
  
  /**
   * Whether WebRTC is supported
   */
  webRTC: boolean;
  
  /**
   * Whether IndexedDB is supported
   */
  indexedDB: boolean;
  
  /**
   * Whether Web Workers are supported
   */
  webWorkers: boolean;
  
  /**
   * Whether Service Workers are supported
   */
  serviceWorkers: boolean;
  
  /**
   * Whether WebSockets are supported
   */
  webSockets: boolean;
  
  /**
   * Whether localStorage is supported
   */
  localStorage: boolean;
  
  /**
   * Whether sessionStorage is supported
   */
  sessionStorage: boolean;
  
  /**
   * Whether Fetch API is supported
   */
  fetch: boolean;
  
  /**
   * Whether Promises are supported
   */
  promises: boolean;
  
  /**
   * Whether async/await is supported
   */
  asyncAwait: boolean;
  
  /**
   * Whether CSS Grid is supported
   */
  cssGrid: boolean;
  
  /**
   * Whether CSS Flexbox is supported
   */
  cssFlexbox: boolean;
  
  /**
   * Whether CSS Variables are supported
   */
  cssVariables: boolean;
}

/**
 * Get browser information
 * 
 * @returns The browser information
 */
export function getBrowserInfo(): BrowserInfo {
  try {
    const userAgent = navigator.userAgent;
    
    // Detect browser name and version
    let name = 'Unknown';
    let version = 'Unknown';
    
    if (userAgent.indexOf('Firefox') > -1) {
      name = 'Firefox';
      version = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Chrome') > -1) {
      name = 'Chrome';
      version = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Safari') > -1) {
      name = 'Safari';
      version = userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Edge') > -1) {
      name = 'Edge';
      version = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) {
      name = 'Internet Explorer';
      version = userAgent.match(/(?:MSIE |rv:)([0-9.]+)/)?.[1] || 'Unknown';
    }
    
    // Detect operating system
    let os = 'Unknown';
    
    if (userAgent.indexOf('Windows') > -1) {
      os = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
      os = 'macOS';
    } else if (userAgent.indexOf('Linux') > -1) {
      os = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
      os = 'Android';
    } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
      os = 'iOS';
    }
    
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;
    
    return {
      name,
      version,
      os,
      isMobile,
      isTablet,
      isDesktop,
    };
  } catch (error) {
    logger.error('Failed to get browser information', { error });
    
    return {
      name: 'Unknown',
      version: 'Unknown',
      os: 'Unknown',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }
}

/**
 * Get feature support
 * 
 * @returns The feature support
 */
export function getFeatureSupport(): FeatureSupport {
  try {
    return {
      webAssembly: typeof WebAssembly !== 'undefined',
      webRTC: typeof RTCPeerConnection !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      webWorkers: typeof Worker !== 'undefined',
      serviceWorkers: 'serviceWorker' in navigator,
      webSockets: typeof WebSocket !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      asyncAwait: (function() {
        try {
          eval('async function test() {}');
          return true;
        } catch (e) {
          return false;
        }
      })(),
      cssGrid: (function() {
        try {
          return CSS.supports('display', 'grid');
        } catch (e) {
          return false;
        }
      })(),
      cssFlexbox: (function() {
        try {
          return CSS.supports('display', 'flex');
        } catch (e) {
          return false;
        }
      })(),
      cssVariables: (function() {
        try {
          return CSS.supports('--test', '0');
        } catch (e) {
          return false;
        }
      })(),
    };
  } catch (error) {
    logger.error('Failed to get feature support', { error });
    
    return {
      webAssembly: false,
      webRTC: false,
      indexedDB: false,
      webWorkers: false,
      serviceWorkers: false,
      webSockets: false,
      localStorage: false,
      sessionStorage: false,
      fetch: false,
      promises: false,
      asyncAwait: false,
      cssGrid: false,
      cssFlexbox: false,
      cssVariables: false,
    };
  }
}

/**
 * Check if the browser is supported
 * 
 * @returns Whether the browser is supported
 */
export function isBrowserSupported(): boolean {
  try {
    const features = getFeatureSupport();
    
    // Check for required features
    const requiredFeatures = [
      features.webAssembly,
      features.webRTC,
      features.indexedDB,
      features.webWorkers,
      features.webSockets,
      features.localStorage,
      features.fetch,
      features.promises,
      features.asyncAwait,
    ];
    
    return requiredFeatures.every(Boolean);
  } catch (error) {
    logger.error('Failed to check if browser is supported', { error });
    
    return false;
  }
}

/**
 * Get missing features
 * 
 * @returns The missing features
 */
export function getMissingFeatures(): string[] {
  try {
    const features = getFeatureSupport();
    const missingFeatures: string[] = [];
    
    if (!features.webAssembly) missingFeatures.push('WebAssembly');
    if (!features.webRTC) missingFeatures.push('WebRTC');
    if (!features.indexedDB) missingFeatures.push('IndexedDB');
    if (!features.webWorkers) missingFeatures.push('Web Workers');
    if (!features.webSockets) missingFeatures.push('WebSockets');
    if (!features.localStorage) missingFeatures.push('localStorage');
    if (!features.fetch) missingFeatures.push('Fetch API');
    if (!features.promises) missingFeatures.push('Promises');
    if (!features.asyncAwait) missingFeatures.push('async/await');
    
    return missingFeatures;
  } catch (error) {
    logger.error('Failed to get missing features', { error });
    
    return ['Unknown'];
  }
}

/**
 * Load polyfills
 * 
 * @returns A promise that resolves when the polyfills are loaded
 */
export async function loadPolyfills(): Promise<void> {
  try {
    const features = getFeatureSupport();
    const polyfills: Promise<any>[] = [];
    
    // Load polyfills for missing features
    if (!features.promises) {
      polyfills.push(import('core-js/features/promise'));
    }
    
    if (!features.fetch) {
      polyfills.push(import('whatwg-fetch'));
    }
    
    if (!features.webAssembly) {
      logger.warn('WebAssembly is not supported and cannot be polyfilled');
    }
    
    if (!features.webRTC) {
      logger.warn('WebRTC is not supported and cannot be polyfilled');
    }
    
    if (!features.indexedDB) {
      logger.warn('IndexedDB is not supported and cannot be polyfilled');
    }
    
    if (!features.webWorkers) {
      logger.warn('Web Workers are not supported and cannot be polyfilled');
    }
    
    if (!features.webSockets) {
      logger.warn('WebSockets are not supported and cannot be polyfilled');
    }
    
    if (!features.localStorage) {
      // Polyfill localStorage with memory storage
      if (typeof window !== 'undefined' && !window.localStorage) {
        const storage: Record<string, string> = {};
        
        (window as any).localStorage = {
          getItem: (key: string) => storage[key] || null,
          setItem: (key: string, value: string) => { storage[key] = value; },
          removeItem: (key: string) => { delete storage[key]; },
          clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
          key: (index: number) => Object.keys(storage)[index] || null,
          length: Object.keys(storage).length,
        };
        
        logger.debug('Polyfilled localStorage with memory storage');
      }
    }
    
    // Wait for all polyfills to load
    await Promise.all(polyfills);
    
    logger.debug('Loaded polyfills');
  } catch (error) {
    logger.error('Failed to load polyfills', { error });
    
    throw error;
  }
}

export default {
  getBrowserInfo,
  getFeatureSupport,
  isBrowserSupported,
  getMissingFeatures,
  loadPolyfills,
};