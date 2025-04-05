/**
 * Cross-browser testing utilities for DarkSwap
 * 
 * This utility helps identify and fix cross-browser compatibility issues.
 */

/**
 * Browser detection utility
 */
export const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let osName = 'Unknown';
  let osVersion = 'Unknown';
  let deviceType = 'desktop';
  
  // Detect browser
  if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf('Edge') > -1 || userAgent.indexOf('Edg/') > -1) {
    browserName = 'Edge';
    browserVersion = userAgent.match(/Edge\/([0-9.]+)/) || userAgent.match(/Edg\/([0-9.]+)/);
    browserVersion = browserVersion ? browserVersion[1] : 'Unknown';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = userAgent.match(/Version\/([0-9.]+)/);
    browserVersion = browserVersion ? browserVersion[1] : 'Unknown';
  } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) {
    browserName = 'Internet Explorer';
    browserVersion = userAgent.match(/MSIE ([0-9.]+)/) || userAgent.match(/rv:([0-9.]+)/);
    browserVersion = browserVersion ? browserVersion[1] : 'Unknown';
  } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR/') > -1) {
    browserName = 'Opera';
    browserVersion = userAgent.match(/Opera\/([0-9.]+)/) || userAgent.match(/OPR\/([0-9.]+)/);
    browserVersion = browserVersion ? browserVersion[1] : 'Unknown';
  }
  
  // Detect OS
  if (userAgent.indexOf('Windows') > -1) {
    osName = 'Windows';
    if (userAgent.indexOf('Windows NT 10.0') > -1) osVersion = '10';
    else if (userAgent.indexOf('Windows NT 6.3') > -1) osVersion = '8.1';
    else if (userAgent.indexOf('Windows NT 6.2') > -1) osVersion = '8';
    else if (userAgent.indexOf('Windows NT 6.1') > -1) osVersion = '7';
    else if (userAgent.indexOf('Windows NT 6.0') > -1) osVersion = 'Vista';
    else if (userAgent.indexOf('Windows NT 5.1') > -1) osVersion = 'XP';
    else if (userAgent.indexOf('Windows NT 5.0') > -1) osVersion = '2000';
  } else if (userAgent.indexOf('Mac') > -1) {
    osName = 'macOS';
    osVersion = userAgent.match(/Mac OS X ([0-9_]+)/);
    osVersion = osVersion ? osVersion[1].replace(/_/g, '.') : 'Unknown';
  } else if (userAgent.indexOf('Linux') > -1) {
    osName = 'Linux';
  } else if (userAgent.indexOf('Android') > -1) {
    osName = 'Android';
    osVersion = userAgent.match(/Android ([0-9.]+)/);
    osVersion = osVersion ? osVersion[1] : 'Unknown';
    deviceType = 'mobile';
  } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
    osName = 'iOS';
    osVersion = userAgent.match(/OS ([0-9_]+)/);
    osVersion = osVersion ? osVersion[1].replace(/_/g, '.') : 'Unknown';
    deviceType = userAgent.indexOf('iPad') > -1 ? 'tablet' : 'mobile';
  }
  
  // Detect device type if not already set
  if (deviceType === 'desktop') {
    if (userAgent.indexOf('Mobile') > -1) {
      deviceType = 'mobile';
    } else if (userAgent.indexOf('Tablet') > -1 || userAgent.indexOf('iPad') > -1) {
      deviceType = 'tablet';
    }
  }
  
  return {
    browserName,
    browserVersion,
    osName,
    osVersion,
    deviceType,
    userAgent
  };
};

/**
 * Feature detection utility
 */
export const detectFeatures = () => {
  const features = {
    // ES6+ features
    arrowFunctions: false,
    promises: false,
    asyncAwait: false,
    classes: false,
    modules: false,
    destructuring: false,
    spreadOperator: false,
    
    // API features
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    webWorkers: false,
    serviceWorkers: false,
    webSockets: false,
    fetch: false,
    geolocation: false,
    webGL: false,
    webRTC: false,
    
    // CSS features
    flexbox: false,
    grid: false,
    cssVariables: false,
    transforms: false,
    transitions: false,
    animations: false,
    
    // Input features
    touchEvents: false,
    pointerEvents: false,
    inputTypes: {}
  };
  
  // Test ES6+ features
  try {
    // Arrow functions
    features.arrowFunctions = eval('(() => true)()');
    
    // Promises
    features.promises = typeof Promise !== 'undefined';
    
    // Async/await
    features.asyncAwait = eval('(async function() { return await Promise.resolve(true); })()') instanceof Promise;
    
    // Classes
    features.classes = eval('(class Test {})') !== undefined;
    
    // Modules - can't easily test
    
    // Destructuring
    features.destructuring = eval('(({a}) => a)({a: true})');
    
    // Spread operator
    features.spreadOperator = eval('([...Array(1)].length === 1)');
  } catch (e) {
    // Some features not supported
  }
  
  // Test API features
  features.localStorage = typeof localStorage !== 'undefined';
  features.sessionStorage = typeof sessionStorage !== 'undefined';
  features.indexedDB = typeof indexedDB !== 'undefined';
  features.webWorkers = typeof Worker !== 'undefined';
  features.serviceWorkers = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  features.webSockets = typeof WebSocket !== 'undefined';
  features.fetch = typeof fetch !== 'undefined';
  features.geolocation = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  features.webGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  })();
  features.webRTC = typeof RTCPeerConnection !== 'undefined';
  
  // Test CSS features
  const testElement = document.createElement('div');
  
  features.flexbox = (() => {
    try {
      return 'flexBasis' in testElement.style || 
             'webkitFlexBasis' in testElement.style || 
             'mozFlexBasis' in testElement.style;
    } catch (e) {
      return false;
    }
  })();
  
  features.grid = (() => {
    try {
      return 'gridArea' in testElement.style || 
             'webkitGridArea' in testElement.style || 
             'mozGridArea' in testElement.style;
    } catch (e) {
      return false;
    }
  })();
  
  features.cssVariables = (() => {
    try {
      testElement.style.setProperty('--test', 'test');
      return testElement.style.getPropertyValue('--test') === 'test';
    } catch (e) {
      return false;
    }
  })();
  
  features.transforms = (() => {
    try {
      return 'transform' in testElement.style || 
             'webkitTransform' in testElement.style || 
             'mozTransform' in testElement.style;
    } catch (e) {
      return false;
    }
  })();
  
  features.transitions = (() => {
    try {
      return 'transition' in testElement.style || 
             'webkitTransition' in testElement.style || 
             'mozTransition' in testElement.style;
    } catch (e) {
      return false;
    }
  })();
  
  features.animations = (() => {
    try {
      return 'animation' in testElement.style || 
             'webkitAnimation' in testElement.style || 
             'mozAnimation' in testElement.style;
    } catch (e) {
      return false;
    }
  })();
  
  // Test input features
  features.touchEvents = typeof TouchEvent !== 'undefined';
  features.pointerEvents = typeof PointerEvent !== 'undefined';
  
  // Test input types
  const inputTypes = [
    'color', 'date', 'datetime-local', 'email', 'month',
    'number', 'range', 'search', 'tel', 'time', 'url', 'week'
  ];
  
  inputTypes.forEach(type => {
    const input = document.createElement('input');
    input.setAttribute('type', type);
    features.inputTypes[type] = input.type === type;
  });
  
  return features;
};

/**
 * Cross-browser compatibility checker
 */
class CrossBrowserChecker {
  constructor() {
    this.issues = [];
    this.isRunning = false;
    this.browserInfo = null;
    this.featureInfo = null;
  }
  
  /**
   * Start the cross-browser checker
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Detect browser and features
    this.browserInfo = detectBrowser();
    this.featureInfo = detectFeatures();
    
    // Run initial check
    this.checkCompatibility();
    
    // Set up mutation observer to check when DOM changes
    this.observer = new MutationObserver(mutations => {
      // Debounce to avoid checking too frequently
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.checkCompatibility();
      }, 1000);
    });
    
    // Observe the entire document
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
    
    console.log('Cross-browser checker started');
    console.log('Browser:', this.browserInfo);
    console.log('Features:', this.featureInfo);
  }
  
  /**
   * Stop the cross-browser checker
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    clearTimeout(this.debounceTimeout);
    
    console.log('Cross-browser checker stopped');
  }
  
  /**
   * Check compatibility of the current page
   */
  checkCompatibility() {
    this.issues = [];
    
    // Check for common cross-browser issues
    this.checkVendorPrefixes();
    this.checkFlexboxIssues();
    this.checkGridIssues();
    this.checkCSSVariableIssues();
    this.checkEventListenerIssues();
    this.checkAPIUsageIssues();
    
    // Report issues
    if (this.issues.length > 0) {
      console.warn(`Found ${this.issues.length} cross-browser compatibility issues:`);
      this.issues.forEach(issue => {
        console.warn(`- ${issue.type}: ${issue.message}`, issue.element || '');
      });
    } else {
      console.log('No cross-browser compatibility issues found');
    }
    
    return this.issues;
  }
  
  /**
   * Check for vendor prefix issues
   */
  checkVendorPrefixes() {
    // Check for unprefixed CSS properties
    const styleSheets = document.styleSheets;
    
    try {
      for (let i = 0; i < styleSheets.length; i++) {
        const styleSheet = styleSheets[i];
        
        // Skip external stylesheets
        if (!styleSheet.cssRules) continue;
        
        for (let j = 0; j < styleSheet.cssRules.length; j++) {
          const rule = styleSheet.cssRules[j];
          
          // Skip non-style rules
          if (!rule.style) continue;
          
          // Check for properties that might need prefixes
          const prefixNeededProps = [
            'animation',
            'transform',
            'transition',
            'user-select',
            'appearance',
            'backdrop-filter',
            'backface-visibility',
            'mask',
            'text-size-adjust'
          ];
          
          prefixNeededProps.forEach(prop => {
            if (rule.style[prop] && !this.hasPrefixedVersion(rule, prop)) {
              this.addIssue('unprefixed-css', `CSS property "${prop}" might need vendor prefixes for cross-browser support`);
            }
          });
        }
      }
    } catch (e) {
      // CORS issues might prevent accessing cssRules
    }
  }
  
  /**
   * Check if a CSS rule has prefixed versions of a property
   * @param {CSSRule} rule - CSS rule
   * @param {string} prop - CSS property
   * @returns {boolean} True if the rule has prefixed versions
   */
  hasPrefixedVersion(rule, prop) {
    const prefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
    
    for (const prefix of prefixes) {
      if (rule.style[prefix + prop]) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check for flexbox issues
   */
  checkFlexboxIssues() {
    // Check for flexbox usage
    const flexElements = document.querySelectorAll('[style*="display: flex"], [style*="display:flex"]');
    
    flexElements.forEach(element => {
      const style = window.getComputedStyle(element);
      
      // Check for flex-wrap
      if (style.display === 'flex' && !style.flexWrap) {
        this.addIssue('flexbox-wrap', 'Flexbox without flex-wrap might have issues in IE11', element);
      }
      
      // Check for flex shorthand
      if (style.flex === '1' || style.flex === '1 1 0%') {
        this.addIssue('flexbox-shorthand', 'Flexbox shorthand "flex: 1" might have issues in IE11, use "flex: 1 1 0%" instead', element);
      }
    });
  }
  
  /**
   * Check for grid issues
   */
  checkGridIssues() {
    // Check for grid usage
    const gridElements = document.querySelectorAll('[style*="display: grid"], [style*="display:grid"]');
    
    gridElements.forEach(element => {
      // Check browser support
      if (this.browserInfo.browserName === 'Internet Explorer') {
        this.addIssue('grid-ie', 'CSS Grid is not supported in Internet Explorer', element);
      }
      
      // Check for auto-fill/auto-fit
      const style = window.getComputedStyle(element);
      if (style.gridTemplateColumns && style.gridTemplateColumns.includes('auto-fill')) {
        this.addIssue('grid-auto-fill', 'CSS Grid auto-fill is not supported in Edge 15', element);
      }
      if (style.gridTemplateColumns && style.gridTemplateColumns.includes('auto-fit')) {
        this.addIssue('grid-auto-fit', 'CSS Grid auto-fit is not supported in Edge 15', element);
      }
    });
  }
  
  /**
   * Check for CSS variable issues
   */
  checkCSSVariableIssues() {
    // Check for CSS variable usage
    const styleSheets = document.styleSheets;
    
    try {
      for (let i = 0; i < styleSheets.length; i++) {
        const styleSheet = styleSheets[i];
        
        // Skip external stylesheets
        if (!styleSheet.cssRules) continue;
        
        for (let j = 0; j < styleSheet.cssRules.length; j++) {
          const rule = styleSheet.cssRules[j];
          
          // Skip non-style rules
          if (!rule.style) continue;
          
          // Check for CSS variables
          for (let k = 0; k < rule.style.length; k++) {
            const prop = rule.style[k];
            const value = rule.style.getPropertyValue(prop);
            
            if (value.includes('var(--')) {
              if (this.browserInfo.browserName === 'Internet Explorer') {
                this.addIssue('css-variables-ie', 'CSS Variables are not supported in Internet Explorer');
              } else if (this.browserInfo.browserName === 'Edge' && parseInt(this.browserInfo.browserVersion) < 16) {
                this.addIssue('css-variables-edge', 'CSS Variables are not supported in Edge < 16');
              }
            }
          }
        }
      }
    } catch (e) {
      // CORS issues might prevent accessing cssRules
    }
  }
  
  /**
   * Check for event listener issues
   */
  checkEventListenerIssues() {
    // Check for passive event listeners
    const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];
    
    // This is a simplified check, in a real implementation we would need to
    // monitor actual event listener registration
    if (this.browserInfo.browserName === 'Chrome' && parseInt(this.browserInfo.browserVersion) >= 56) {
      // Chrome 56+ warns about non-passive event listeners
      this.addIssue('passive-events', 'Consider using passive event listeners for touchstart, touchmove, wheel, and mousewheel events in Chrome 56+');
    }
  }
  
  /**
   * Check for API usage issues
   */
  checkAPIUsageIssues() {
    // Check for WebRTC usage
    if (document.querySelector('video[autoplay]') && this.browserInfo.browserName === 'Safari') {
      this.addIssue('autoplay-safari', 'Autoplay is restricted in Safari and requires user interaction');
    }
    
    // Check for WebRTC usage
    if (typeof RTCPeerConnection !== 'undefined' && document.querySelector('video:not([src])')) {
      if (this.browserInfo.browserName === 'Safari' && parseInt(this.browserInfo.browserVersion) < 11) {
        this.addIssue('webrtc-safari', 'WebRTC is not supported in Safari < 11');
      } else if (this.browserInfo.browserName === 'Internet Explorer') {
        this.addIssue('webrtc-ie', 'WebRTC is not supported in Internet Explorer');
      }
    }
    
    // Check for IndexedDB usage
    if (typeof indexedDB !== 'undefined' && document.querySelector('[data-uses-indexeddb]')) {
      if (this.browserInfo.browserName === 'Safari' && parseInt(this.browserInfo.browserVersion) < 10) {
        this.addIssue('indexeddb-safari', 'IndexedDB has issues in Safari < 10');
      }
    }
  }
  
  /**
   * Add a compatibility issue
   * @param {string} type - Issue type
   * @param {string} message - Issue message
   * @param {HTMLElement} [element] - Element with the issue
   */
  addIssue(type, message, element) {
    this.issues.push({
      type,
      message,
      element
    });
  }
  
  /**
   * Get all compatibility issues
   * @returns {Array} Array of compatibility issues
   */
  getIssues() {
    return this.issues;
  }
  
  /**
   * Clear all compatibility issues
   */
  clearIssues() {
    this.issues = [];
  }
  
  /**
   * Get browser information
   * @returns {Object} Browser information
   */
  getBrowserInfo() {
    return this.browserInfo;
  }
  
  /**
   * Get feature information
   * @returns {Object} Feature information
   */
  getFeatureInfo() {
    return this.featureInfo;
  }
}

// Create a singleton instance
const crossBrowserChecker = new CrossBrowserChecker();

/**
 * React hook for checking component cross-browser compatibility
 * @param {string} componentName - Component name
 */
export const useCrossBrowserCheck = (componentName) => {
  React.useEffect(() => {
    // Check compatibility after component mounts
    setTimeout(() => {
      const issues = crossBrowserChecker.checkCompatibility();
      if (issues.length > 0) {
        console.warn(`Cross-browser compatibility issues found in ${componentName}:`, issues);
      }
    }, 100);
  }, [componentName]);
};

/**
 * Higher-order component for checking component cross-browser compatibility
 * @param {React.Component} Component - Component to check
 * @param {string} componentName - Component name
 * @returns {React.Component} Wrapped component
 */
export const withCrossBrowserCheck = (Component, componentName) => {
  return (props) => {
    useCrossBrowserCheck(componentName || Component.displayName || Component.name);
    return <Component {...props} />;
  };
};

// Export the singleton instance and utility functions
export default crossBrowserChecker;