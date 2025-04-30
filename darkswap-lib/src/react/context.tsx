/**
 * React context for DarkSwap
 * 
 * This module provides a React context for using DarkSwap in React applications.
 */

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { DarkSwap, DarkSwapConfig } from '../index';

/**
 * DarkSwap context
 */
export const DarkSwapContext = createContext<DarkSwap | null>(null);

/**
 * DarkSwap provider props
 */
interface DarkSwapProviderProps {
  /**
   * DarkSwap configuration
   */
  config: DarkSwapConfig;
  
  /**
   * Children
   */
  children: ReactNode;
}

/**
 * DarkSwap provider
 * 
 * @param props The provider props
 * @returns The provider component
 */
export function DarkSwapProvider({ config, children }: DarkSwapProviderProps): JSX.Element {
  const [darkswap, setDarkswap] = useState<DarkSwap | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const init = async () => {
      try {
        const instance = new DarkSwap(config);
        await instance.init();
        setDarkswap(instance);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize DarkSwap:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    init();
    
    return () => {
      if (darkswap) {
        darkswap.stop().catch(console.error);
      }
    };
  }, [config]);
  
  if (error) {
    return (
      <div className="darkswap-error">
        <h2>Failed to initialize DarkSwap</h2>
        <p>{error.message}</p>
      </div>
    );
  }
  
  if (!isInitialized) {
    return (
      <div className="darkswap-loading">
        <p>Initializing DarkSwap...</p>
      </div>
    );
  }
  
  return (
    <DarkSwapContext.Provider value={darkswap}>
      {children}
    </DarkSwapContext.Provider>
  );
}