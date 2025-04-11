/**
 * Accessibility utility for DarkSwap
 * 
 * This utility provides accessibility functions for the DarkSwap application.
 */

import { logger } from './logger';

/**
 * Accessibility options
 */
export interface AccessibilityOptions {
  /**
   * Whether high contrast mode is enabled
   */
  highContrast: boolean;
  
  /**
   * Whether large text mode is enabled
   */
  largeText: boolean;
  
  /**
   * Whether screen reader mode is enabled
   */
  screenReader: boolean;
  
  /**
   * Whether reduced motion mode is enabled
   */
  reducedMotion: boolean;
  
  /**
   * Whether keyboard navigation mode is enabled
   */
  keyboardNavigation: boolean;
}

/**
 * Default accessibility options
 */
const defaultOptions: AccessibilityOptions = {
  highContrast: false,
  largeText: false,
  screenReader: false,
  reducedMotion: false,
  keyboardNavigation: true,
};

/**
 * Accessibility options storage key
 */
const ACCESSIBILITY_OPTIONS_KEY = 'darkswap_accessibility_options';

/**
 * Get the accessibility options
 * 
 * @returns The accessibility options
 */
export function getAccessibilityOptions(): AccessibilityOptions {
  try {
    // Get the options from localStorage
    const optionsJson = localStorage.getItem(ACCESSIBILITY_OPTIONS_KEY);
    
    if (!optionsJson) {
      return { ...defaultOptions };
    }
    
    const options = JSON.parse(optionsJson);
    
    return { ...defaultOptions, ...options };
  } catch (error) {
    logger.error('Failed to get accessibility options', { error });
    
    return { ...defaultOptions };
  }
}

/**
 * Set the accessibility options
 * 
 * @param options The accessibility options
 */
export function setAccessibilityOptions(options: Partial<AccessibilityOptions>): void {
  try {
    // Get the current options
    const currentOptions = getAccessibilityOptions();
    
    // Update the options
    const newOptions = { ...currentOptions, ...options };
    
    // Store the options in localStorage
    localStorage.setItem(ACCESSIBILITY_OPTIONS_KEY, JSON.stringify(newOptions));
    
    // Apply the options
    applyAccessibilityOptions(newOptions);
    
    logger.debug('Set accessibility options', { options: newOptions });
  } catch (error) {
    logger.error('Failed to set accessibility options', { error });
  }
}

/**
 * Apply the accessibility options
 * 
 * @param options The accessibility options
 */
export function applyAccessibilityOptions(options: AccessibilityOptions): void {
  try {
    // Apply high contrast mode
    if (options.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Apply large text mode
    if (options.largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
    
    // Apply screen reader mode
    if (options.screenReader) {
      document.documentElement.classList.add('screen-reader');
    } else {
      document.documentElement.classList.remove('screen-reader');
    }
    
    // Apply reduced motion mode
    if (options.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
    
    // Apply keyboard navigation mode
    if (options.keyboardNavigation) {
      document.documentElement.classList.add('keyboard-navigation');
    } else {
      document.documentElement.classList.remove('keyboard-navigation');
    }
    
    logger.debug('Applied accessibility options', { options });
  } catch (error) {
    logger.error('Failed to apply accessibility options', { error });
  }
}

/**
 * Initialize the accessibility options
 */
export function initAccessibilityOptions(): void {
  try {
    // Get the options
    const options = getAccessibilityOptions();
    
    // Apply the options
    applyAccessibilityOptions(options);
    
    // Listen for system preference changes
    listenForSystemPreferenceChanges();
    
    logger.debug('Initialized accessibility options', { options });
  } catch (error) {
    logger.error('Failed to initialize accessibility options', { error });
  }
}

/**
 * Listen for system preference changes
 */
export function listenForSystemPreferenceChanges(): void {
  try {
    // Listen for high contrast mode changes
    const highContrastMediaQuery = window.matchMedia('(prefers-contrast: more)');
    
    highContrastMediaQuery.addEventListener('change', (event) => {
      setAccessibilityOptions({ highContrast: event.matches });
    });
    
    // Listen for reduced motion mode changes
    const reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    reducedMotionMediaQuery.addEventListener('change', (event) => {
      setAccessibilityOptions({ reducedMotion: event.matches });
    });
    
    // Check initial system preferences
    setAccessibilityOptions({
      highContrast: highContrastMediaQuery.matches,
      reducedMotion: reducedMotionMediaQuery.matches,
    });
    
    logger.debug('Listening for system preference changes');
  } catch (error) {
    logger.error('Failed to listen for system preference changes', { error });
  }
}

/**
 * Focus trap class
 */
export class FocusTrap {
  private element: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private active: boolean = false;
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.focusableElements = this.getFocusableElements();
    
    if (this.focusableElements.length > 0) {
      this.firstFocusableElement = this.focusableElements[0];
      this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
    }
  }
  
  /**
   * Get the focusable elements
   * 
   * @returns The focusable elements
   */
  private getFocusableElements(): HTMLElement[] {
    const focusableElements = this.element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    return Array.from(focusableElements) as HTMLElement[];
  }
  
  /**
   * Activate the focus trap
   */
  public activate(): void {
    if (this.active) {
      return;
    }
    
    this.active = true;
    
    // Focus the first focusable element
    if (this.firstFocusableElement) {
      this.firstFocusableElement.focus();
    }
    
    // Add event listener for tab key
    this.element.addEventListener('keydown', this.handleKeyDown);
    
    logger.debug('Activated focus trap', { element: this.element });
  }
  
  /**
   * Deactivate the focus trap
   */
  public deactivate(): void {
    if (!this.active) {
      return;
    }
    
    this.active = false;
    
    // Remove event listener for tab key
    this.element.removeEventListener('keydown', this.handleKeyDown);
    
    logger.debug('Deactivated focus trap', { element: this.element });
  }
  
  /**
   * Handle key down event
   * 
   * @param event The key down event
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Check if the key is Tab
    if (event.key === 'Tab') {
      // If Shift + Tab and the active element is the first focusable element, focus the last focusable element
      if (event.shiftKey && document.activeElement === this.firstFocusableElement) {
        event.preventDefault();
        this.lastFocusableElement?.focus();
      }
      // If Tab and the active element is the last focusable element, focus the first focusable element
      else if (!event.shiftKey && document.activeElement === this.lastFocusableElement) {
        event.preventDefault();
        this.firstFocusableElement?.focus();
      }
    }
  };
}

/**
 * Create a focus trap
 * 
 * @param element The element to trap focus in
 * @returns The focus trap
 */
export function createFocusTrap(element: HTMLElement): FocusTrap {
  return new FocusTrap(element);
}

/**
 * Announce a message to screen readers
 * 
 * @param message The message to announce
 * @param politeness The politeness level
 */
export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  try {
    // Get or create the announcement element
    let announcementElement = document.getElementById('darkswap-announcement');
    
    if (!announcementElement) {
      announcementElement = document.createElement('div');
      announcementElement.id = 'darkswap-announcement';
      announcementElement.setAttribute('aria-live', politeness);
      announcementElement.setAttribute('aria-atomic', 'true');
      announcementElement.style.position = 'absolute';
      announcementElement.style.width = '1px';
      announcementElement.style.height = '1px';
      announcementElement.style.padding = '0';
      announcementElement.style.margin = '-1px';
      announcementElement.style.overflow = 'hidden';
      announcementElement.style.clip = 'rect(0, 0, 0, 0)';
      announcementElement.style.whiteSpace = 'nowrap';
      announcementElement.style.border = '0';
      
      document.body.appendChild(announcementElement);
    }
    
    // Set the politeness level
    announcementElement.setAttribute('aria-live', politeness);
    
    // Announce the message
    announcementElement.textContent = message;
    
    logger.debug('Announced message', { message, politeness });
  } catch (error) {
    logger.error('Failed to announce message', { error, message, politeness });
  }
}

export default {
  getAccessibilityOptions,
  setAccessibilityOptions,
  applyAccessibilityOptions,
  initAccessibilityOptions,
  listenForSystemPreferenceChanges,
  createFocusTrap,
  announce,
};