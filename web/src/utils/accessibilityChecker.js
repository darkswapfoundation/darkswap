/**
 * Accessibility checker utility for DarkSwap
 * 
 * This utility helps identify and fix accessibility issues in the application.
 */

/**
 * Accessibility checker class
 */
class AccessibilityChecker {
  constructor() {
    this.issues = [];
    this.isRunning = false;
  }
  
  /**
   * Start the accessibility checker
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Run initial check
    this.checkAccessibility();
    
    // Set up mutation observer to check when DOM changes
    this.observer = new MutationObserver(mutations => {
      // Debounce to avoid checking too frequently
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.checkAccessibility();
      }, 1000);
    });
    
    // Observe the entire document
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-*', 'role', 'tabindex', 'alt', 'title']
    });
    
    console.log('Accessibility checker started');
  }
  
  /**
   * Stop the accessibility checker
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    clearTimeout(this.debounceTimeout);
    
    console.log('Accessibility checker stopped');
  }
  
  /**
   * Check accessibility of the current page
   */
  checkAccessibility() {
    this.issues = [];
    
    // Check for common accessibility issues
    this.checkImages();
    this.checkForms();
    this.checkHeadings();
    this.checkLinks();
    this.checkButtons();
    this.checkColorContrast();
    this.checkKeyboardNavigation();
    this.checkARIA();
    
    // Report issues
    if (this.issues.length > 0) {
      console.warn(`Found ${this.issues.length} accessibility issues:`);
      this.issues.forEach(issue => {
        console.warn(`- ${issue.type}: ${issue.message}`, issue.element);
      });
    } else {
      console.log('No accessibility issues found');
    }
    
    return this.issues;
  }
  
  /**
   * Check images for accessibility issues
   */
  checkImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Check for alt text
      if (!img.hasAttribute('alt')) {
        this.addIssue('image-alt', 'Image is missing alt text', img);
      }
      
      // Check for empty alt on decorative images
      if (img.alt === '' && !img.hasAttribute('role') && !img.hasAttribute('aria-hidden')) {
        this.addIssue('decorative-image', 'Decorative image should have role="presentation" or aria-hidden="true"', img);
      }
    });
  }
  
  /**
   * Check forms for accessibility issues
   */
  checkForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Check for form labels
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        // Skip hidden inputs
        if (input.type === 'hidden') return;
        
        // Check for label
        const id = input.id;
        if (!id) {
          this.addIssue('input-id', 'Form input is missing an ID', input);
          return;
        }
        
        const label = document.querySelector(`label[for="${id}"]`);
        if (!label) {
          // Check for aria-label or aria-labelledby
          if (!input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
            this.addIssue('input-label', 'Form input is missing a label', input);
          }
        }
      });
    });
  }
  
  /**
   * Check headings for accessibility issues
   */
  checkHeadings() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1), 10);
      
      // Check for empty headings
      if (!heading.textContent.trim()) {
        this.addIssue('empty-heading', 'Heading is empty', heading);
      }
      
      // Check for skipped heading levels
      if (previousLevel > 0 && level > previousLevel + 1) {
        this.addIssue('skipped-heading', `Heading level skipped from h${previousLevel} to h${level}`, heading);
      }
      
      previousLevel = level;
    });
    
    // Check if there's an h1
    if (!document.querySelector('h1')) {
      this.addIssue('missing-h1', 'Page is missing an h1 heading', document.body);
    }
  }
  
  /**
   * Check links for accessibility issues
   */
  checkLinks() {
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
      // Check for empty links
      if (!link.textContent.trim() && !link.hasAttribute('aria-label') && !link.hasAttribute('aria-labelledby')) {
        // Check if it has an image with alt text
        const img = link.querySelector('img[alt]');
        if (!img || !img.alt.trim()) {
          this.addIssue('empty-link', 'Link has no text content', link);
        }
      }
      
      // Check for links that open in new windows
      if (link.target === '_blank' && !link.hasAttribute('aria-label') && !link.textContent.toLowerCase().includes('new window')) {
        this.addIssue('new-window', 'Link opens in a new window but does not indicate this in the text', link);
      }
    });
  }
  
  /**
   * Check buttons for accessibility issues
   */
  checkButtons() {
    const buttons = document.querySelectorAll('button, [role="button"]');
    
    buttons.forEach(button => {
      // Check for empty buttons
      if (!button.textContent.trim() && !button.hasAttribute('aria-label') && !button.hasAttribute('aria-labelledby')) {
        // Check if it has an image with alt text
        const img = button.querySelector('img[alt]');
        if (!img || !img.alt.trim()) {
          this.addIssue('empty-button', 'Button has no text content', button);
        }
      }
    });
  }
  
  /**
   * Check color contrast for accessibility issues
   * This is a simplified version, a real implementation would be more complex
   */
  checkColorContrast() {
    // This would require a more complex implementation to get computed styles
    // and calculate contrast ratios
    // For now, we'll just check for text directly on the body (which might have a background image)
    const directTextNodes = Array.from(document.body.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    
    if (directTextNodes.length > 0) {
      this.addIssue('direct-text', 'Text directly on body may have contrast issues with background images', document.body);
    }
  }
  
  /**
   * Check keyboard navigation for accessibility issues
   */
  checkKeyboardNavigation() {
    // Check for positive tabindex
    const elementsWithPositiveTabIndex = document.querySelectorAll('[tabindex]');
    
    elementsWithPositiveTabIndex.forEach(element => {
      const tabindex = parseInt(element.getAttribute('tabindex'), 10);
      if (tabindex > 0) {
        this.addIssue('positive-tabindex', 'Element has a positive tabindex which disrupts natural tab order', element);
      }
    });
    
    // Check for click handlers without keyboard handlers
    const clickableElements = document.querySelectorAll('[onclick], [role="button"]:not(button)');
    
    clickableElements.forEach(element => {
      if (!element.hasAttribute('tabindex') && !element.hasAttribute('role')) {
        this.addIssue('keyboard-access', 'Clickable element may not be keyboard accessible', element);
      }
    });
  }
  
  /**
   * Check ARIA attributes for accessibility issues
   */
  checkARIA() {
    // Check for invalid ARIA roles
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox',
      'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog',
      'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
      'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu',
      'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'navigation', 'none',
      'note', 'option', 'presentation', 'progressbar', 'radio', 'radiogroup', 'region',
      'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
      'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
      'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
    ];
    
    const elementsWithRole = document.querySelectorAll('[role]');
    
    elementsWithRole.forEach(element => {
      const role = element.getAttribute('role');
      if (!validRoles.includes(role)) {
        this.addIssue('invalid-role', `Invalid ARIA role: ${role}`, element);
      }
    });
    
    // Check for aria-hidden on focusable elements
    const focusableWithAriaHidden = document.querySelectorAll('a[aria-hidden="true"], button[aria-hidden="true"], input[aria-hidden="true"], select[aria-hidden="true"], textarea[aria-hidden="true"], [tabindex][aria-hidden="true"]');
    
    focusableWithAriaHidden.forEach(element => {
      this.addIssue('aria-hidden-focusable', 'Focusable element with aria-hidden="true"', element);
    });
  }
  
  /**
   * Add an accessibility issue
   * @param {string} type - Issue type
   * @param {string} message - Issue message
   * @param {HTMLElement} element - Element with the issue
   */
  addIssue(type, message, element) {
    this.issues.push({
      type,
      message,
      element
    });
  }
  
  /**
   * Get all accessibility issues
   * @returns {Array} Array of accessibility issues
   */
  getIssues() {
    return this.issues;
  }
  
  /**
   * Clear all accessibility issues
   */
  clearIssues() {
    this.issues = [];
  }
}

// Create a singleton instance
const accessibilityChecker = new AccessibilityChecker();

/**
 * React hook for checking component accessibility
 * @param {string} componentName - Component name
 */
export const useAccessibilityCheck = (componentName) => {
  React.useEffect(() => {
    // Check accessibility after component mounts
    setTimeout(() => {
      const issues = accessibilityChecker.checkAccessibility();
      if (issues.length > 0) {
        console.warn(`Accessibility issues found in ${componentName}:`, issues);
      }
    }, 100);
  }, [componentName]);
};

/**
 * Higher-order component for checking component accessibility
 * @param {React.Component} Component - Component to check
 * @param {string} componentName - Component name
 * @returns {React.Component} Wrapped component
 */
export const withAccessibilityCheck = (Component, componentName) => {
  return (props) => {
    useAccessibilityCheck(componentName || Component.displayName || Component.name);
    return <Component {...props} />;
  };
};

// Export the singleton instance and utility functions
export default accessibilityChecker;