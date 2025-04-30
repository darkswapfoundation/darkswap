/**
 * useDarkSwap.ts - Hook for using DarkSwap
 * 
 * This file provides a hook for using the DarkSwap WebAssembly module in React components.
 */

import { useContext } from 'react';
import { DarkSwapContext, DarkSwapContextValue } from '../contexts/DarkSwapContext';

/**
 * Use DarkSwap hook result
 */
export type UseDarkSwapResult = DarkSwapContextValue;

/**
 * Use DarkSwap hook
 * @returns DarkSwap context value
 * @throws Error if used outside of DarkSwapProvider
 */
export function useDarkSwap(): UseDarkSwapResult {
  const context = useContext(DarkSwapContext);
  
  if (!context) {
    throw new Error('useDarkSwap must be used within a DarkSwapProvider');
  }
  
  return context;
}

/**
 * Export DarkSwapProvider from context
 */
export { DarkSwapProvider } from '../contexts/DarkSwapContext';

/**
 * Default export
 */
export default useDarkSwap;