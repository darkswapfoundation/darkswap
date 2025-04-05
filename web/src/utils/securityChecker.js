/**
 * Security checker utility for DarkSwap
 * 
 * This utility helps identify and fix security issues in the application.
 */

/**
 * Security checker class
 */
class SecurityChecker {
  constructor() {
    this.issues = [];
    this.isRunning = false;
  }
  
  /**
   * Start the security checker
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Run initial check
    this.checkSecurity();
    
    // Set up mutation observer to check when DOM changes
    this.observer = new MutationObserver(mutations => {
      // Debounce to avoid checking too frequently
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.checkSecurity();
      }, 1000);
    });
    
    // Observe the entire document
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'src', 'onclick', 'onerror']
    });
    
    // Monitor form submissions
    this.setupFormMonitoring();
    
    // Monitor XHR and fetch requests
    this.setupNetworkMonitoring();
    
    console.log('Security checker started');
  }
  
  /**
   * Stop the security checker
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    clearTimeout(this.debounceTimeout);
    
    // Remove form monitoring
    this.removeFormMonitoring();
    
    // Remove network monitoring
    this.removeNetworkMonitoring();
    
    console.log('Security checker stopped');
  }
  
  /**
   * Check security of the current page
   */
  checkSecurity() {
    this.issues = [];
    
    // Check for common security issues
    this.checkInlineScripts();
    this.checkExternalResources();
    this.checkLinks();
    this.checkForms();
    this.checkStorageUsage();
    this.checkContentSecurityPolicy();
    this.checkCookies();
    
    // Report issues
    if (this.issues.length > 0) {
      console.warn(`Found ${this.issues.length} security issues:`);
      this.issues.forEach(issue => {
        console.warn(`- ${issue.type}: ${issue.message}`, issue.element || '');
      });
    } else {
      console.log('No security issues found');
    }
    
    return this.issues;
  }
  
  /**
   * Check for inline scripts
   */
  checkInlineScripts() {
    // Check for inline event handlers
    const elementsWithInlineHandlers = document.querySelectorAll('[onclick], [onerror], [onload], [onmouseover], [onmouseout]');
    
    elementsWithInlineHandlers.forEach(element => {
      this.addIssue('inline-event-handler', 'Element uses inline event handler which can be a security risk', element);
    });
    
    // Check for inline script tags
    const inlineScripts = Array.from(document.querySelectorAll('script')).filter(script => !script.src && script.textContent.trim());
    
    inlineScripts.forEach(script => {
      this.addIssue('inline-script', 'Inline script found which can be a security risk', script);
    });
  }
  
  /**
   * Check external resources
   */
  checkExternalResources() {
    // Check for external scripts
    const externalScripts = document.querySelectorAll('script[src]');
    
    externalScripts.forEach(script => {
      const src = script.getAttribute('src');
      
      // Check if it's an external domain
      if (src && this.isExternalUrl(src)) {
        // Check if it uses integrity
        if (!script.hasAttribute('integrity')) {
          this.addIssue('external-script-no-integrity', 'External script without integrity attribute', script);
        }
        
        // Check if it uses HTTPS
        if (src.startsWith('http:')) {
          this.addIssue('insecure-script', 'Script loaded over insecure HTTP', script);
        }
      }
    });
    
    // Check for external stylesheets
    const externalStyles = document.querySelectorAll('link[rel="stylesheet"]');
    
    externalStyles.forEach(link => {
      const href = link.getAttribute('href');
      
      // Check if it's an external domain
      if (href && this.isExternalUrl(href)) {
        // Check if it uses integrity
        if (!link.hasAttribute('integrity')) {
          this.addIssue('external-style-no-integrity', 'External stylesheet without integrity attribute', link);
        }
        
        // Check if it uses HTTPS
        if (href.startsWith('http:')) {
          this.addIssue('insecure-style', 'Stylesheet loaded over insecure HTTP', link);
        }
      }
    });
  }
  
  /**
   * Check links for security issues
   */
  checkLinks() {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      
      // Check for javascript: URLs
      if (href.toLowerCase().startsWith('javascript:')) {
        this.addIssue('javascript-url', 'Link uses javascript: URL which is a security risk', link);
      }
      
      // Check for data: URLs
      if (href.toLowerCase().startsWith('data:')) {
        this.addIssue('data-url', 'Link uses data: URL which can be a security risk', link);
      }
      
      // Check for external links without rel="noopener"
      if (this.isExternalUrl(href) && link.target === '_blank' && !link.rel.includes('noopener')) {
        this.addIssue('no-noopener', 'External link with target="_blank" but without rel="noopener"', link);
      }
    });
  }
  
  /**
   * Check forms for security issues
   */
  checkForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Check for forms without CSRF protection
      if (!this.hasCSRFToken(form)) {
        this.addIssue('no-csrf-token', 'Form without CSRF protection', form);
      }
      
      // Check for insecure form submission
      const action = form.getAttribute('action');
      if (action && action.startsWith('http:')) {
        this.addIssue('insecure-form', 'Form submits over insecure HTTP', form);
      }
      
      // Check for autocomplete on sensitive fields
      const sensitiveInputs = form.querySelectorAll('input[type="password"], input[name*="credit"], input[name*="card"]');
      
      sensitiveInputs.forEach(input => {
        if (!input.hasAttribute('autocomplete') || input.getAttribute('autocomplete') !== 'off') {
          this.addIssue('autocomplete-sensitive', 'Sensitive input field with autocomplete not disabled', input);
        }
      });
    });
  }
  
  /**
   * Check for proper storage usage
   */
  checkStorageUsage() {
    // This is a simplified check, in a real implementation we would need to
    // monitor actual storage usage through proxies or other means
    
    // Check for sensitive data in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        // Check for potentially sensitive data
        if (this.containsSensitiveData(key, value)) {
          this.addIssue('sensitive-local-storage', `LocalStorage key "${key}" may contain sensitive data`);
        }
      }
    } catch (e) {
      // LocalStorage might not be available (e.g., in private browsing mode)
    }
  }
  
  /**
   * Check Content Security Policy
   */
  checkContentSecurityPolicy() {
    // Check if CSP is set
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const cspHeader = this.getCSPFromHeaders();
    
    if (!cspMeta && !cspHeader) {
      this.addIssue('no-csp', 'No Content Security Policy found');
    }
  }
  
  /**
   * Check cookies for security issues
   */
  checkCookies() {
    // This is a simplified check, in a real implementation we would need to
    // check actual cookie attributes through other means
    
    const cookies = document.cookie.split(';');
    
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      
      // Check for sensitive data in cookies
      if (this.containsSensitiveData(name, value)) {
        this.addIssue('sensitive-cookie', `Cookie "${name}" may contain sensitive data`);
      }
      
      // Check for HttpOnly flag (this can't actually be checked from JS)
      // This is just a placeholder for a real implementation
    });
  }
  
  /**
   * Set up form monitoring
   */
  setupFormMonitoring() {
    this.formSubmitHandler = (event) => {
      const form = event.target;
      
      // Check for CSRF token
      if (!this.hasCSRFToken(form)) {
        console.warn('Form submitted without CSRF token:', form);
      }
      
      // Check for sensitive data in GET forms
      if (form.method.toLowerCase() === 'get') {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
          const name = input.name;
          const value = input.value;
          
          if (this.containsSensitiveData(name, value)) {
            console.warn('Sensitive data submitted in GET form:', name);
          }
        });
      }
    };
    
    document.addEventListener('submit', this.formSubmitHandler);
  }
  
  /**
   * Remove form monitoring
   */
  removeFormMonitoring() {
    if (this.formSubmitHandler) {
      document.removeEventListener('submit', this.formSubmitHandler);
      this.formSubmitHandler = null;
    }
  }
  
  /**
   * Set up network monitoring
   */
  setupNetworkMonitoring() {
    // Monitor XHR requests
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._securityCheckerUrl = url;
      this._securityCheckerMethod = method;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
      // Check for insecure URLs
      if (this._securityCheckerUrl && this._securityCheckerUrl.startsWith('http:')) {
        console.warn('XHR request to insecure URL:', this._securityCheckerUrl);
      }
      
      // Check for sensitive data in GET requests
      if (this._securityCheckerMethod && this._securityCheckerMethod.toLowerCase() === 'get' && this._securityCheckerUrl) {
        const url = new URL(this._securityCheckerUrl, window.location.href);
        
        url.searchParams.forEach((value, name) => {
          if (securityChecker.containsSensitiveData(name, value)) {
            console.warn('Sensitive data in GET XHR request:', name);
          }
        });
      }
      
      return originalXHRSend.apply(this, [body]);
    };
    
    // Monitor fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input.url;
      const method = init && init.method ? init.method : 'GET';
      
      // Check for insecure URLs
      if (url && url.startsWith('http:')) {
        console.warn('Fetch request to insecure URL:', url);
      }
      
      // Check for sensitive data in GET requests
      if (method.toLowerCase() === 'get' && url) {
        const parsedUrl = new URL(url, window.location.href);
        
        parsedUrl.searchParams.forEach((value, name) => {
          if (securityChecker.containsSensitiveData(name, value)) {
            console.warn('Sensitive data in GET fetch request:', name);
          }
        });
      }
      
      return originalFetch.apply(window, [input, init]);
    };
  }
  
  /**
   * Remove network monitoring
   */
  removeNetworkMonitoring() {
    // This would restore the original XHR and fetch methods
    // In a real implementation, we would store the original methods and restore them
  }
  
  /**
   * Check if a URL is external
   * @param {string} url - URL to check
   * @returns {boolean} True if the URL is external
   */
  isExternalUrl(url) {
    if (!url) return false;
    
    // Handle relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return false;
    }
    
    // Handle data: and javascript: URLs
    if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      return false;
    }
    
    try {
      const urlObj = new URL(url, window.location.href);
      return urlObj.hostname !== window.location.hostname;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Check if a form has a CSRF token
   * @param {HTMLFormElement} form - Form to check
   * @returns {boolean} True if the form has a CSRF token
   */
  hasCSRFToken(form) {
    // Check for common CSRF token field names
    const csrfFields = [
      'csrf_token',
      'csrf-token',
      'xsrf_token',
      'xsrf-token',
      '_token',
      '_csrf',
      'csrf',
      'authenticity_token'
    ];
    
    for (const fieldName of csrfFields) {
      const field = form.querySelector(`input[name="${fieldName}"]`);
      if (field) return true;
    }
    
    // Check for custom headers in fetch/XHR requests
    // This would require more sophisticated monitoring
    
    return false;
  }
  
  /**
   * Check if data might be sensitive
   * @param {string} name - Field name
   * @param {string} value - Field value
   * @returns {boolean} True if the data might be sensitive
   */
  containsSensitiveData(name, value) {
    if (!name || !value) return false;
    
    // Check field name for sensitive patterns
    const sensitivePatternsInName = [
      'password',
      'passwd',
      'secret',
      'token',
      'api_key',
      'apikey',
      'auth',
      'credential',
      'credit',
      'card',
      'cvv',
      'ssn',
      'social',
      'tax',
      'account',
      'routing',
      'secret',
      'private'
    ];
    
    const nameLower = name.toLowerCase();
    
    for (const pattern of sensitivePatternsInName) {
      if (nameLower.includes(pattern)) {
        return true;
      }
    }
    
    // Check value for patterns that look like tokens or keys
    if (typeof value === 'string') {
      // Check for JWT pattern
      if (/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(value)) {
        return true;
      }
      
      // Check for API key patterns
      if (/^[a-zA-Z0-9_-]{20,}$/.test(value)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get CSP from headers
   * @returns {string|null} CSP header value or null
   */
  getCSPFromHeaders() {
    // This can't be reliably checked from JavaScript
    // In a real implementation, this would be checked server-side
    return null;
  }
  
  /**
   * Add a security issue
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
   * Get all security issues
   * @returns {Array} Array of security issues
   */
  getIssues() {
    return this.issues;
  }
  
  /**
   * Clear all security issues
   */
  clearIssues() {
    this.issues = [];
  }
}

// Create a singleton instance
const securityChecker = new SecurityChecker();

/**
 * React hook for checking component security
 * @param {string} componentName - Component name
 */
export const useSecurityCheck = (componentName) => {
  React.useEffect(() => {
    // Check security after component mounts
    setTimeout(() => {
      const issues = securityChecker.checkSecurity();
      if (issues.length > 0) {
        console.warn(`Security issues found in ${componentName}:`, issues);
      }
    }, 100);
  }, [componentName]);
};

/**
 * Higher-order component for checking component security
 * @param {React.Component} Component - Component to check
 * @param {string} componentName - Component name
 * @returns {React.Component} Wrapped component
 */
export const withSecurityCheck = (Component, componentName) => {
  return (props) => {
    useSecurityCheck(componentName || Component.displayName || Component.name);
    return <Component {...props} />;
  };
};

// Export the singleton instance and utility functions
export default securityChecker;