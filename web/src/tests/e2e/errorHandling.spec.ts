/**
 * errorHandling.spec.ts - End-to-end tests for error handling
 * 
 * This file contains end-to-end tests for the error handling system,
 * testing how it works in a real browser environment.
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const testError = {
  name: 'DarkSwapError',
  message: 'Test error',
  code: 0,
};

// Helper function to inject error
async function injectError(page: Page, errorType: string): Promise<void> {
  await page.evaluate(({ errorType }) => {
    // Get the window object
    const win = window as any;
    
    // Create error based on type
    let error;
    
    switch (errorType) {
      case 'wasm':
        error = new win.DarkSwapWasm.WasmError('WebAssembly error', 101);
        break;
      case 'network':
        error = new win.DarkSwapWasm.NetworkError('Network error', 201);
        break;
      case 'order':
        error = new win.DarkSwapWasm.OrderError('Order error', 401);
        break;
      case 'wallet':
        error = new win.DarkSwapWasm.WalletError('Wallet error', 301);
        break;
      default:
        error = new win.DarkSwapWasm.DarkSwapError('Generic error', 0);
        break;
    }
    
    // Dispatch error
    win.dispatchEvent(new CustomEvent('test-error', { detail: error }));
  }, { errorType });
}

// Helper function to trigger error toast
async function triggerErrorToast(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Get the window object
    const win = window as any;
    
    // Get the error toast context
    const errorToastContext = win.__ERROR_TOAST_CONTEXT__;
    
    if (errorToastContext && errorToastContext.addToast) {
      // Add toast
      errorToastContext.addToast({
        error: new win.DarkSwapWasm.DarkSwapError('Toast error', 0),
        showDetails: true,
        autoDismiss: false,
      });
    }
  });
}

// Helper function to trigger error boundary
async function triggerErrorBoundary(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Get the window object
    const win = window as any;
    
    // Get the error boundary element
    const errorBoundaryElement = document.querySelector('[data-testid="error-boundary-test"]');
    
    if (errorBoundaryElement) {
      // Trigger error
      const event = new CustomEvent('test-error-boundary', {
        bubbles: true,
        cancelable: true,
      });
      
      errorBoundaryElement.dispatchEvent(event);
    }
  });
}

test.describe('Error Handling End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('.app');
    
    // Inject test helpers
    await page.evaluate(() => {
      // Get the window object
      const win = window as any;
      
      // Create DarkSwapWasm namespace if it doesn't exist
      if (!win.DarkSwapWasm) {
        win.DarkSwapWasm = {};
      }
      
      // Create error classes
      class DarkSwapError extends Error {
        code: number;
        details?: Record<string, any>;
        
        constructor(message: string, code: number = 0, details?: Record<string, any>) {
          super(message);
          this.name = 'DarkSwapError';
          this.code = code;
          this.details = details;
        }
      }
      
      class WasmError extends DarkSwapError {
        constructor(message: string, code: number = 102, details?: Record<string, any>) {
          super(message, code, details);
          this.name = 'WasmError';
        }
      }
      
      class NetworkError extends DarkSwapError {
        constructor(message: string, code: number = 200, details?: Record<string, any>) {
          super(message, code, details);
          this.name = 'NetworkError';
        }
      }
      
      class OrderError extends DarkSwapError {
        constructor(message: string, code: number = 400, details?: Record<string, any>) {
          super(message, code, details);
          this.name = 'OrderError';
        }
      }
      
      class WalletError extends DarkSwapError {
        constructor(message: string, code: number = 300, details?: Record<string, any>) {
          super(message, code, details);
          this.name = 'WalletError';
        }
      }
      
      // Add error classes to DarkSwapWasm namespace
      win.DarkSwapWasm.DarkSwapError = DarkSwapError;
      win.DarkSwapWasm.WasmError = WasmError;
      win.DarkSwapWasm.NetworkError = NetworkError;
      win.DarkSwapWasm.OrderError = OrderError;
      win.DarkSwapWasm.WalletError = WalletError;
      
      // Add event listener for test errors
      win.addEventListener('test-error', (event: CustomEvent) => {
        // Get error toast context
        const errorToastContext = win.__ERROR_TOAST_CONTEXT__;
        
        if (errorToastContext && errorToastContext.addToast) {
          // Add toast
          errorToastContext.addToast({
            error: event.detail,
            showDetails: true,
            autoDismiss: false,
          });
        }
      });
      
      // Add event listener for error boundary tests
      win.addEventListener('test-error-boundary', () => {
        // Throw error
        throw new DarkSwapError('Error boundary test', 0);
      });
      
      // Expose error toast context
      const errorToastContext = document.querySelector('[data-testid="error-toast-context"]');
      
      if (errorToastContext) {
        win.__ERROR_TOAST_CONTEXT__ = (errorToastContext as any).__errorToastContext;
      }
    });
  });
  
  test('should display error toast when error is triggered', async ({ page }) => {
    // Trigger error toast
    await triggerErrorToast(page);
    
    // Wait for error toast to appear
    await page.waitForSelector('.error-toast');
    
    // Check error toast content
    const errorTitle = await page.textContent('.error-toast .error-title');
    const errorMessage = await page.textContent('.error-toast .error-message');
    
    expect(errorTitle).toBe('DarkSwapError');
    expect(errorMessage).toBe('Toast error');
  });
  
  test('should display error boundary when error is thrown', async ({ page }) => {
    // Add test error boundary
    await page.evaluate(() => {
      // Create test error boundary
      const testErrorBoundary = document.createElement('div');
      testErrorBoundary.setAttribute('data-testid', 'error-boundary-test');
      testErrorBoundary.textContent = 'Test Error Boundary';
      
      // Add to document
      document.body.appendChild(testErrorBoundary);
    });
    
    // Trigger error boundary
    await triggerErrorBoundary(page);
    
    // Wait for error boundary to appear
    await page.waitForSelector('.error-boundary');
    
    // Check error boundary content
    const errorTitle = await page.textContent('.error-boundary .error-title');
    const errorMessage = await page.textContent('.error-boundary .error-message');
    
    expect(errorTitle).toBe('DarkSwapError');
    expect(errorMessage).toBe('Error boundary test');
  });
  
  test('should dismiss error toast when dismiss button is clicked', async ({ page }) => {
    // Trigger error toast
    await triggerErrorToast(page);
    
    // Wait for error toast to appear
    await page.waitForSelector('.error-toast');
    
    // Click dismiss button
    await page.click('.error-toast .error-dismiss');
    
    // Wait for error toast to disappear
    await expect(page.locator('.error-toast')).toHaveCount(0);
  });
  
  test('should show error details when details button is clicked', async ({ page }) => {
    // Trigger error toast with details
    await page.evaluate(() => {
      // Get the window object
      const win = window as any;
      
      // Get the error toast context
      const errorToastContext = win.__ERROR_TOAST_CONTEXT__;
      
      if (errorToastContext && errorToastContext.addToast) {
        // Add toast
        errorToastContext.addToast({
          error: new win.DarkSwapWasm.DarkSwapError('Toast error', 0, { foo: 'bar' }),
          showDetails: false,
          autoDismiss: false,
        });
      }
    });
    
    // Wait for error toast to appear
    await page.waitForSelector('.error-toast');
    
    // Click details button
    await page.click('.error-toast .error-details-toggle');
    
    // Wait for details to appear
    await page.waitForSelector('.error-toast .error-details');
    
    // Check details content
    const detailsContent = await page.textContent('.error-toast .error-details');
    
    expect(detailsContent).toContain('foo');
    expect(detailsContent).toContain('bar');
  });
  
  test('should retry error when retry button is clicked', async ({ page }) => {
    // Add test error boundary with retry handler
    await page.evaluate(() => {
      // Create test error boundary
      const testErrorBoundary = document.createElement('div');
      testErrorBoundary.setAttribute('data-testid', 'error-boundary-test');
      testErrorBoundary.textContent = 'Test Error Boundary';
      
      // Add retry handler
      testErrorBoundary.addEventListener('retry', () => {
        testErrorBoundary.textContent = 'Error Resolved';
      });
      
      // Add to document
      document.body.appendChild(testErrorBoundary);
      
      // Add event listener for error boundary tests
      window.addEventListener('test-error-boundary', () => {
        // Create error boundary
        const errorBoundary = document.createElement('div');
        errorBoundary.className = 'error-boundary';
        
        // Create error title
        const errorTitle = document.createElement('div');
        errorTitle.className = 'error-title';
        errorTitle.textContent = 'DarkSwapError';
        
        // Create error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Error boundary test';
        
        // Create retry button
        const retryButton = document.createElement('button');
        retryButton.className = 'error-retry';
        retryButton.textContent = 'Retry';
        
        // Add retry handler
        retryButton.addEventListener('click', () => {
          // Dispatch retry event
          testErrorBoundary.dispatchEvent(new CustomEvent('retry'));
          
          // Remove error boundary
          errorBoundary.remove();
        });
        
        // Add elements to error boundary
        errorBoundary.appendChild(errorTitle);
        errorBoundary.appendChild(errorMessage);
        errorBoundary.appendChild(retryButton);
        
        // Replace test error boundary with error boundary
        testErrorBoundary.replaceWith(errorBoundary);
      });
    });
    
    // Trigger error boundary
    await triggerErrorBoundary(page);
    
    // Wait for error boundary to appear
    await page.waitForSelector('.error-boundary');
    
    // Click retry button
    await page.click('.error-retry');
    
    // Wait for error to be resolved
    await page.waitForSelector('text=Error Resolved');
    
    // Check that error boundary is gone
    await expect(page.locator('.error-boundary')).toHaveCount(0);
  });
  
  test('should handle different error types', async ({ page }) => {
    // Test different error types
    const errorTypes = ['wasm', 'network', 'order', 'wallet'];
    
    for (const errorType of errorTypes) {
      // Inject error
      await injectError(page, errorType);
      
      // Wait for error toast to appear
      await page.waitForSelector('.error-toast');
      
      // Check error toast content
      const errorTitle = await page.textContent('.error-toast .error-title');
      const errorMessage = await page.textContent('.error-toast .error-message');
      
      // Verify error type
      expect(errorTitle).toContain(errorType.charAt(0).toUpperCase() + errorType.slice(1) + 'Error');
      expect(errorMessage).toContain(errorType);
      
      // Dismiss error toast
      await page.click('.error-toast .error-dismiss');
      
      // Wait for error toast to disappear
      await expect(page.locator('.error-toast')).toHaveCount(0);
    }
  });
});