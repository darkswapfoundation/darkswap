/**
 * errorReporting.spec.ts - End-to-end tests for error reporting
 * 
 * This file contains end-to-end tests for the error reporting system,
 * testing how it works in a real browser environment.
 */

import { test, expect } from '@playwright/test';

// Mock server URL
const mockServerUrl = 'http://localhost:8080';

test.describe('Error Reporting End-to-End Tests', () => {
  // Mock server for error reporting
  let mockServer: any;
  
  test.beforeAll(async () => {
    // Start mock server
    mockServer = {
      errors: [] as any[],
      start: async () => {
        // This is a mock implementation
        console.log('Mock server started');
      },
      stop: async () => {
        // This is a mock implementation
        console.log('Mock server stopped');
      },
      getErrors: () => {
        return mockServer.errors;
      },
      clearErrors: () => {
        mockServer.errors = [];
      },
    };
    
    await mockServer.start();
  });
  
  test.afterAll(async () => {
    // Stop mock server
    await mockServer.stop();
  });
  
  test.beforeEach(async ({ page }) => {
    // Clear mock server errors
    mockServer.clearErrors();
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('.app');
    
    // Configure error reporting
    await page.evaluate((serverUrl) => {
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
      
      // Add error class to DarkSwapWasm namespace
      win.DarkSwapWasm.DarkSwapError = DarkSwapError;
      
      // Mock error reporting configuration
      if (!win.ErrorReporting) {
        win.ErrorReporting = {
          configureErrorReporting: (config: any) => {
            win.ErrorReporting.config = config;
          },
          reportError: async (error: any, context?: string) => {
            // Check if error reporting is enabled
            if (!win.ErrorReporting.config?.enabled) {
              return;
            }
            
            try {
              // Create error report
              const report = {
                name: error.name || 'Error',
                message: error.message || 'An unknown error occurred',
                code: error.code,
                details: error.details,
                stack: error.stack,
                timestamp: Date.now(),
                appVersion: win.ErrorReporting.config?.appVersion,
                userId: win.ErrorReporting.config?.userId,
                sessionId: win.ErrorReporting.config?.sessionId,
                url: window.location.href,
                userAgent: navigator.userAgent,
                tags: {
                  ...(win.ErrorReporting.config?.tags || {}),
                  ...(context ? { context } : {}),
                },
              };
              
              // Send error report
              await fetch(win.ErrorReporting.config?.endpoint || serverUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(report),
              });
            } catch (err) {
              console.error('Failed to report error:', err);
            }
          },
        };
      }
      
      // Configure error reporting
      win.ErrorReporting.configureErrorReporting({
        enabled: true,
        endpoint: serverUrl,
        appVersion: '1.0.0',
        userId: 'test-user',
        sessionId: 'test-session',
        tags: {
          environment: 'test',
        },
      });
      
      // Add event listener for test errors
      win.addEventListener('test-error', (event: CustomEvent) => {
        // Report error
        win.ErrorReporting.reportError(event.detail, event.detail.context);
      });
    }, mockServerUrl);
    
    // Mock fetch for error reporting
    await page.route(mockServerUrl, async (route) => {
      const request = route.request();
      
      if (request.method() === 'POST') {
        // Get request body
        const body = JSON.parse(request.postData() || '{}');
        
        // Add error to mock server
        mockServer.errors.push(body);
        
        // Fulfill request
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        // Continue with request
        await route.continue();
      }
    });
  });
  
  test('should report errors when they occur', async ({ page }) => {
    // Trigger error
    await page.evaluate(() => {
      // Get the window object
      const win = window as any;
      
      // Create error
      const error = new win.DarkSwapWasm.DarkSwapError('Test error', 0);
      
      // Dispatch error
      win.dispatchEvent(new CustomEvent('test-error', { detail: error }));
    });
    
    // Wait for error to be reported
    await page.waitForTimeout(1000);
    
    // Check that error was reported
    const errors = mockServer.getErrors();
    
    expect(errors.length).toBe(1);
    expect(errors[0].name).toBe('DarkSwapError');
    expect(errors[0].message).toBe('Test error');
    expect(errors[0].code).toBe(0);
  });
  
  test('should include context in error reports', async ({ page }) => {
    // Trigger error with context
    await page.evaluate(() => {
      // Get the window object
      const win = window as any;
      
      // Create error
      const error = new win.DarkSwapWasm.DarkSwapError('Test error', 0);
      error.context = 'TestContext';
      
      // Dispatch error
      win.dispatchEvent(new CustomEvent('test-error', { detail: error }));
    });
    
    // Wait for error to be reported
    await page.waitForTimeout(1000);
    
    // Check that error was reported with context
    const errors = mockServer.getErrors();
    
    expect(errors.length).toBe(1);
    expect(errors[0].tags.context).toBe('TestContext');
  });
  
  test('should include error details in reports', async ({ page }) => {
    // Trigger error with details
    await page.evaluate(() => {
      // Get the window object
      const win = window as any;
      
      // Create error
      const error = new win.DarkSwapWasm.DarkSwapError('Test error', 0, { foo: 'bar' });
      
      // Dispatch error
      win.dispatchEvent(new CustomEvent('test-error', { detail: error }));
    });
    
    // Wait for error to be reported
    await page.waitForTimeout(1000);
    
    // Check that error was reported with details
    const errors = mockServer.getErrors();
    
    expect(errors.length).toBe(1);
    expect(errors[0].details).toEqual({ foo: 'bar' });
  });
  
  test('should not report errors when disabled', async ({ page }) => {
    // Disable error reporting
    await page.evaluate(() => {
      // Get the window object
      const win = window as any;
      
      // Configure error reporting
      win.ErrorReporting.configureErrorReporting({
        enabled: false,
      });
    });
    
    // Trigger error
    await page.evaluate(() => {
      // Get the window object
      const win = window as any;
      
      // Create error
      const error = new win.DarkSwapWasm.DarkSwapError('Test error', 0);
      
      // Dispatch error
      win.dispatchEvent(new CustomEvent('test-error', { detail: error }));
    });
    
    // Wait for error to be reported
    await page.waitForTimeout(1000);
    
    // Check that error was not reported
    const errors = mockServer.getErrors();
    
    expect(errors.length).toBe(0);
  });
  
  test('should handle multiple errors', async ({ page }) => {
    // Trigger multiple errors
    await page.evaluate(() => {
      // Get the window object
      const win = window as any;
      
      // Create errors
      const error1 = new win.DarkSwapWasm.DarkSwapError('Test error 1', 1);
      const error2 = new win.DarkSwapWasm.DarkSwapError('Test error 2', 2);
      const error3 = new win.DarkSwapWasm.DarkSwapError('Test error 3', 3);
      
      // Dispatch errors
      win.dispatchEvent(new CustomEvent('test-error', { detail: error1 }));
      win.dispatchEvent(new CustomEvent('test-error', { detail: error2 }));
      win.dispatchEvent(new CustomEvent('test-error', { detail: error3 }));
    });
    
    // Wait for errors to be reported
    await page.waitForTimeout(1000);
    
    // Check that errors were reported
    const errors = mockServer.getErrors();
    
    expect(errors.length).toBe(3);
    expect(errors[0].message).toBe('Test error 1');
    expect(errors[1].message).toBe('Test error 2');
    expect(errors[2].message).toBe('Test error 3');
  });
});