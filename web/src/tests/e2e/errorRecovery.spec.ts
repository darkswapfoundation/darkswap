/**
 * errorRecovery.spec.ts - End-to-end tests for error recovery
 * 
 * This file contains end-to-end tests for the error recovery system,
 * testing how it works in a real browser environment.
 */

import { test, expect } from '@playwright/test';

test.describe('Error Recovery End-to-End Tests', () => {
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
      
      // Add error classes to DarkSwapWasm namespace
      win.DarkSwapWasm.DarkSwapError = DarkSwapError;
      win.DarkSwapWasm.WasmError = WasmError;
      win.DarkSwapWasm.NetworkError = NetworkError;
      
      // Create error recovery utilities
      if (!win.ErrorRecovery) {
        win.ErrorRecovery = {
          // Retry function
          retry: async (fn, options = {}) => {
            // Default options
            const defaultOptions = {
              maxRetries: 3,
              retryDelay: 1000,
              useExponentialBackoff: false,
              reportErrors: false,
              reportingContext: undefined,
            };
            
            // Merge options
            const mergedOptions = {
              ...defaultOptions,
              ...options,
            };
            
            // Initialize retry count
            let retryCount = 0;
            
            // Try to execute the function
            while (true) {
              try {
                return await fn();
              } catch (error) {
                // Increment retry count
                retryCount++;
                
                // Check if we've reached the maximum number of retries
                if (retryCount >= mergedOptions.maxRetries) {
                  // Report error if enabled
                  if (mergedOptions.reportErrors && win.ErrorReporting) {
                    await win.ErrorReporting.reportError(
                      error,
                      mergedOptions.reportingContext
                    );
                  }
                  
                  // Rethrow error
                  throw error;
                }
                
                // Calculate retry delay
                let retryDelay = mergedOptions.retryDelay;
                
                // Apply exponential backoff if enabled
                if (mergedOptions.useExponentialBackoff) {
                  retryDelay = Math.min(
                    retryDelay * Math.pow(2, retryCount - 1),
                    mergedOptions.maxRetryDelay || Number.MAX_SAFE_INTEGER
                  );
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
              }
            }
          },
          
          // Recover function
          recover: async (fn, strategy, options = {}) => {
            try {
              return await fn();
            } catch (error) {
              // Apply recovery strategy
              return await strategy(error, {
                retryCount: 0,
                originalFn: fn,
                options,
              });
            }
          },
          
          // Retry strategy
          retryStrategy: (options = {}) => {
            return async (error, context) => {
              return await win.ErrorRecovery.retry(
                context.originalFn,
                {
                  ...context.options,
                  ...options,
                }
              );
            };
          },
          
          // Fallback strategy
          fallbackStrategy: (fallbackValue) => {
            return async () => {
              return fallbackValue;
            };
          },
        };
      }
      
      // Add test functions
      win.testRetry = async (shouldSucceed = true, maxRetries = 3) => {
        let attempts = 0;
        
        const result = await win.ErrorRecovery.retry(
          async () => {
            attempts++;
            
            if (attempts <= maxRetries && !shouldSucceed) {
              throw new win.DarkSwapWasm.DarkSwapError('Test error', 0);
            }
            
            return 'success';
          },
          {
            maxRetries,
            retryDelay: 100,
          }
        ).catch(() => 'failure');
        
        return {
          result,
          attempts,
        };
      };
      
      win.testRecover = async (strategy, shouldSucceed = true) => {
        let attempts = 0;
        
        const result = await win.ErrorRecovery.recover(
          async () => {
            attempts++;
            
            if (!shouldSucceed) {
              throw new win.DarkSwapWasm.DarkSwapError('Test error', 0);
            }
            
            return 'success';
          },
          strategy
        ).catch(() => 'failure');
        
        return {
          result,
          attempts,
        };
      };
      
      // Add test UI
      const testUI = document.createElement('div');
      testUI.id = 'error-recovery-test-ui';
      testUI.style.padding = '20px';
      testUI.style.backgroundColor = '#f5f5f5';
      testUI.style.border = '1px solid #ddd';
      testUI.style.borderRadius = '5px';
      testUI.style.margin = '20px';
      
      // Add test buttons
      const retryButton = document.createElement('button');
      retryButton.textContent = 'Test Retry';
      retryButton.id = 'test-retry-button';
      retryButton.style.marginRight = '10px';
      retryButton.style.padding = '5px 10px';
      
      const recoverButton = document.createElement('button');
      recoverButton.textContent = 'Test Recover';
      recoverButton.id = 'test-recover-button';
      recoverButton.style.padding = '5px 10px';
      
      // Add result display
      const resultDisplay = document.createElement('div');
      resultDisplay.id = 'test-result-display';
      resultDisplay.style.marginTop = '10px';
      resultDisplay.style.padding = '10px';
      resultDisplay.style.backgroundColor = '#fff';
      resultDisplay.style.border = '1px solid #ddd';
      resultDisplay.style.borderRadius = '5px';
      
      // Add elements to test UI
      testUI.appendChild(retryButton);
      testUI.appendChild(recoverButton);
      testUI.appendChild(resultDisplay);
      
      // Add test UI to document
      document.body.appendChild(testUI);
      
      // Add event listeners
      retryButton.addEventListener('click', async () => {
        resultDisplay.textContent = 'Running retry test...';
        
        try {
          const { result, attempts } = await win.testRetry(false, 3);
          
          resultDisplay.textContent = `Retry test result: ${result}, attempts: ${attempts}`;
        } catch (error) {
          resultDisplay.textContent = `Retry test error: ${error.message}`;
        }
      });
      
      recoverButton.addEventListener('click', async () => {
        resultDisplay.textContent = 'Running recover test...';
        
        try {
          const { result, attempts } = await win.testRecover(
            win.ErrorRecovery.fallbackStrategy('fallback'),
            false
          );
          
          resultDisplay.textContent = `Recover test result: ${result}, attempts: ${attempts}`;
        } catch (error) {
          resultDisplay.textContent = `Recover test error: ${error.message}`;
        }
      });
    });
  });
  
  test('should retry function until success', async ({ page }) => {
    // Run test retry with success after 2 attempts
    const result = await page.evaluate(async () => {
      // Get the window object
      const win = window as any;
      
      // Run test
      let attempts = 0;
      
      return await win.ErrorRecovery.retry(
        async () => {
          attempts++;
          
          if (attempts < 2) {
            throw new win.DarkSwapWasm.DarkSwapError('Test error', 0);
          }
          
          return {
            result: 'success',
            attempts,
          };
        },
        {
          maxRetries: 3,
          retryDelay: 100,
        }
      );
    });
    
    // Check result
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(2);
  });
  
  test('should fail after max retries', async ({ page }) => {
    // Run test retry with failure
    const result = await page.evaluate(async () => {
      // Get the window object
      const win = window as any;
      
      // Run test
      let attempts = 0;
      
      try {
        await win.ErrorRecovery.retry(
          async () => {
            attempts++;
            throw new win.DarkSwapWasm.DarkSwapError('Test error', 0);
          },
          {
            maxRetries: 3,
            retryDelay: 100,
          }
        );
        
        return {
          result: 'success',
          attempts,
        };
      } catch (error) {
        return {
          result: 'failure',
          attempts,
          error: {
            name: error.name,
            message: error.message,
            code: error.code,
          },
        };
      }
    });
    
    // Check result
    expect(result.result).toBe('failure');
    expect(result.attempts).toBe(4); // Initial attempt + 3 retries
    expect(result.error.name).toBe('DarkSwapError');
  });
  
  test('should recover using fallback strategy', async ({ page }) => {
    // Run test recover with fallback
    const result = await page.evaluate(async () => {
      // Get the window object
      const win = window as any;
      
      // Run test
      return await win.ErrorRecovery.recover(
        async () => {
          throw new win.DarkSwapWasm.DarkSwapError('Test error', 0);
        },
        win.ErrorRecovery.fallbackStrategy('fallback')
      );
    });
    
    // Check result
    expect(result).toBe('fallback');
  });
  
  test('should recover using retry strategy', async ({ page }) => {
    // Run test recover with retry
    const result = await page.evaluate(async () => {
      // Get the window object
      const win = window as any;
      
      // Run test
      let attempts = 0;
      
      return await win.ErrorRecovery.recover(
        async () => {
          attempts++;
          
          if (attempts < 2) {
            throw new win.DarkSwapWasm.DarkSwapError('Test error', 0);
          }
          
          return {
            result: 'success',
            attempts,
          };
        },
        win.ErrorRecovery.retryStrategy({
          maxRetries: 3,
          retryDelay: 100,
        })
      );
    });
    
    // Check result
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(2);
  });
  
  test('should handle UI interaction for retry', async ({ page }) => {
    // Click retry button
    await page.click('#test-retry-button');
    
    // Wait for result
    await page.waitForSelector('#test-result-display:not(:empty)');
    
    // Check result
    const resultText = await page.textContent('#test-result-display');
    
    expect(resultText).toContain('Retry test result: failure');
    expect(resultText).toContain('attempts: 4'); // Initial attempt + 3 retries
  });
  
  test('should handle UI interaction for recover', async ({ page }) => {
    // Click recover button
    await page.click('#test-recover-button');
    
    // Wait for result
    await page.waitForSelector('#test-result-display:not(:empty)');
    
    // Check result
    const resultText = await page.textContent('#test-result-display');
    
    expect(resultText).toContain('Recover test result: fallback');
    expect(resultText).toContain('attempts: 1');
  });
});