/**
 * AdvancedRecovery.ts - Advanced recovery strategies
 * 
 * This file provides advanced recovery strategies for the DarkSwap application.
 */

import { recover, RecoveryStrategy, RecoveryOptions, retry } from './ErrorRecovery';
import { DarkSwapError, WasmError, NetworkError, OrderError, WalletError, ErrorCode } from './ErrorHandling';
import { reportError } from './ErrorReporting';

/**
 * Feature flag status
 */
const featureFlags: Record<string, boolean> = {};

/**
 * Degradation status
 */
const degradationStatus: Record<string, boolean> = {};

/**
 * Set feature flag
 * @param feature - Feature name
 * @param enabled - Whether the feature is enabled
 */
export function setFeatureFlag(feature: string, enabled: boolean): void {
  featureFlags[feature] = enabled;
}

/**
 * Get feature flag
 * @param feature - Feature name
 * @returns Whether the feature is enabled
 */
export function getFeatureFlag(feature: string): boolean {
  return featureFlags[feature] !== false;
}

/**
 * Enable feature
 * @param feature - Feature name
 */
export function enableFeature(feature: string): void {
  setFeatureFlag(feature, true);
}

/**
 * Disable feature
 * @param feature - Feature name
 */
export function disableFeature(feature: string): void {
  setFeatureFlag(feature, false);
}

/**
 * Set degradation status
 * @param feature - Feature name
 * @param degraded - Whether the feature is degraded
 */
export function setDegradationStatus(feature: string, degraded: boolean): void {
  degradationStatus[feature] = degraded;
}

/**
 * Get degradation status
 * @param feature - Feature name
 * @returns Whether the feature is degraded
 */
export function getDegradationStatus(feature: string): boolean {
  return degradationStatus[feature] === true;
}

/**
 * Enable degradation
 * @param feature - Feature name
 */
export function enableDegradation(feature: string): void {
  setDegradationStatus(feature, true);
}

/**
 * Disable degradation
 * @param feature - Feature name
 */
export function disableDegradation(feature: string): void {
  setDegradationStatus(feature, false);
}

/**
 * Graceful degradation strategy
 * @param fallbackFn - Fallback function
 * @param feature - Feature name
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function gracefulDegradationStrategy<T>(
  fallbackFn: () => Promise<T>,
  feature: string,
  options: RecoveryOptions = {},
): RecoveryStrategy<T> {
  return async (error, context) => {
    // Enable degradation
    enableDegradation(feature);
    
    // Log degradation
    console.warn(`Gracefully degrading ${feature} due to error:`, error);
    
    // Report error
    if (options.reportErrors) {
      await reportError(error, `${feature} degradation`);
    }
    
    // Try fallback function
    return await fallbackFn();
  };
}

/**
 * Feature flag strategy
 * @param feature - Feature name
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function featureFlagStrategy<T>(
  feature: string,
  options: RecoveryOptions = {},
): RecoveryStrategy<T> {
  return async (error, context) => {
    // Disable feature
    disableFeature(feature);
    
    // Log feature disabling
    console.warn(`Disabling feature ${feature} due to error:`, error);
    
    // Report error
    if (options.reportErrors) {
      await reportError(error, `${feature} disabled`);
    }
    
    // Throw error
    throw new DarkSwapError(
      `Feature ${feature} disabled due to error: ${error.message}`,
      ErrorCode.InvalidArgument,
      { originalError: error, feature }
    );
  };
}

/**
 * Recovery orchestration
 * @param strategies - Recovery strategies
 * @returns Recovery strategy
 */
export function recoveryOrchestration<T>(
  strategies: Array<{
    condition: (error: DarkSwapError) => boolean;
    strategy: RecoveryStrategy<T>;
  }>,
): RecoveryStrategy<T> {
  return async (error, context) => {
    // Find matching strategy
    for (const { condition, strategy } of strategies) {
      if (condition(error)) {
        return await strategy(error, context);
      }
    }
    
    // No matching strategy found
    throw error;
  };
}

/**
 * Conditional retry strategy
 * @param condition - Condition function
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function conditionalRetryStrategy<T>(
  condition: (error: DarkSwapError) => boolean,
  options: RecoveryOptions = {},
): RecoveryStrategy<T> {
  return async (error, context) => {
    // Check condition
    if (condition(error)) {
      return await retry(
        context.originalFn,
        {
          ...context.options,
          ...options,
        }
      );
    }
    
    // Condition not met
    throw error;
  };
}

/**
 * Timeout retry strategy
 * @param timeout - Timeout in milliseconds
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function timeoutRetryStrategy<T>(
  timeout: number,
  options: RecoveryOptions = {},
): RecoveryStrategy<T> {
  return async (error, context) => {
    // Check if error is a timeout error
    if (error.code === ErrorCode.Timeout) {
      return await retry(
        context.originalFn,
        {
          ...context.options,
          ...options,
          retryDelay: Math.max(options.retryDelay || 0, timeout),
        }
      );
    }
    
    // Not a timeout error
    throw error;
  };
}

/**
 * Exponential backoff strategy
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function exponentialBackoffStrategy<T>(
  options: RecoveryOptions = {},
): RecoveryStrategy<T> {
  return async (error, context) => {
    return await retry(
      context.originalFn,
      {
        ...context.options,
        ...options,
        useExponentialBackoff: true,
      }
    );
  };
}

/**
 * Circuit breaker strategy
 * @param feature - Feature name
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function circuitBreakerStrategy<T>(
  feature: string,
  options: RecoveryOptions = {},
): RecoveryStrategy<T> {
  return async (error, context) => {
    return await retry(
      context.originalFn,
      {
        ...context.options,
        ...options,
        circuitBreakerThreshold: options.circuitBreakerThreshold || 5,
        circuitBreakerResetTimeout: options.circuitBreakerResetTimeout || 60000,
        reportingContext: feature,
      }
    );
  };
}

/**
 * Fallback chain strategy
 * @param fallbacks - Fallback functions
 * @returns Recovery strategy
 */
export function fallbackChainStrategy<T>(
  fallbacks: Array<() => Promise<T>>,
): RecoveryStrategy<T> {
  return async (error, context) => {
    // Try each fallback
    for (const fallback of fallbacks) {
      try {
        return await fallback();
      } catch (fallbackError) {
        // Continue to next fallback
      }
    }
    
    // All fallbacks failed
    throw error;
  };
}

/**
 * Retry with jitter strategy
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function retryWithJitterStrategy<T>(
  options: RecoveryOptions = {},
): RecoveryStrategy<T> {
  return async (error, context) => {
    return await retry(
      context.originalFn,
      {
        ...context.options,
        ...options,
        retryDelay: (options.retryDelay || 1000) * (0.5 + Math.random()),
      }
    );
  };
}

/**
 * Composite recovery strategy
 * @param strategies - Recovery strategies
 * @returns Recovery strategy
 */
export function compositeRecoveryStrategy<T>(
  strategies: RecoveryStrategy<T>[],
): RecoveryStrategy<T> {
  return async (error, context) => {
    let lastError = error;
    
    // Try each strategy
    for (const strategy of strategies) {
      try {
        return await strategy(lastError, context);
      } catch (strategyError) {
        // Update last error
        lastError = strategyError instanceof DarkSwapError
          ? strategyError
          : new DarkSwapError(
              String(strategyError),
              ErrorCode.Unknown,
              { originalError: strategyError }
            );
      }
    }
    
    // All strategies failed
    throw lastError;
  };
}

/**
 * WebAssembly advanced recovery strategy
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function wasmAdvancedRecoveryStrategy<T>(
  options: RecoveryOptions = {},
): RecoveryStrategy<T> {
  return compositeRecoveryStrategy([
    // First try exponential backoff
    conditionalRetryStrategy<T>(
      (error) => error instanceof WasmError && (
        error.code === ErrorCode.WasmLoadFailed ||
        error.code === ErrorCode.WasmInitFailed
      ),
      {
        ...options,
        maxRetries: options.maxRetries || 3,
        retryDelay: options.retryDelay || 1000,
        useExponentialBackoff: true,
      }
    ),
    
    // Then try circuit breaker
    circuitBreakerStrategy<T>(
      'wasm',
      {
        ...options,
        circuitBreakerThreshold: options.circuitBreakerThreshold || 5,
        circuitBreakerResetTimeout: options.circuitBreakerResetTimeout || 60000,
      }
    ),
    
    // Finally try graceful degradation
    gracefulDegradationStrategy<T>(
      async () => {
        throw new DarkSwapError(
          'WebAssembly module failed to load, application is in degraded mode',
          ErrorCode.WasmLoadFailed
        );
      },
      'wasm',
      options
    ),
  ]);
}

/**
 * Network advanced recovery strategy
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function networkAdvancedRecoveryStrategy<T>(
  options: RecoveryOptions = {},
): RecoveryStrategy<T> {
  return compositeRecoveryStrategy([
    // First try jitter retry
    conditionalRetryStrategy<T>(
      (error) => error instanceof NetworkError && (
        error.code === ErrorCode.ConnectionFailed ||
        error.code === ErrorCode.ConnectionTimeout
      ),
      {
        ...options,
        maxRetries: options.maxRetries || 5,
        retryDelay: options.retryDelay || 1000,
      }
    ),
    
    // Then try circuit breaker
    circuitBreakerStrategy<T>(
      'network',
      {
        ...options,
        circuitBreakerThreshold: options.circuitBreakerThreshold || 10,
        circuitBreakerResetTimeout: options.circuitBreakerResetTimeout || 30000,
      }
    ),
    
    // Finally try graceful degradation
    gracefulDegradationStrategy<T>(
      async () => {
        throw new DarkSwapError(
          'Network connection failed, application is in offline mode',
          ErrorCode.ConnectionFailed
        );
      },
      'network',
      options
    ),
  ]);
}

/**
 * Default export
 */
export default {
  setFeatureFlag,
  getFeatureFlag,
  enableFeature,
  disableFeature,
  setDegradationStatus,
  getDegradationStatus,
  enableDegradation,
  disableDegradation,
  gracefulDegradationStrategy,
  featureFlagStrategy,
  recoveryOrchestration,
  conditionalRetryStrategy,
  timeoutRetryStrategy,
  exponentialBackoffStrategy,
  circuitBreakerStrategy,
  fallbackChainStrategy,
  retryWithJitterStrategy,
  compositeRecoveryStrategy,
  wasmAdvancedRecoveryStrategy,
  networkAdvancedRecoveryStrategy,
};