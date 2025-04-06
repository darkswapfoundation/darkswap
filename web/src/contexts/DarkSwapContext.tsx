/**
 * DarkSwapContext - Context for DarkSwap WebAssembly module
 * 
 * This context provides access to the DarkSwap WebAssembly module from React components.
 */

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import useDarkSwap, { UseDarkSwapResult } from '../hooks/useDarkSwap';
import { Config, BitcoinNetwork } from '../wasm/DarkSwapWasm';

// DarkSwap context
const DarkSwapContext = createContext<UseDarkSwapResult | undefined>(undefined);

// DarkSwap provider props
interface DarkSwapProviderProps {
  /** Children components */
  children: ReactNode;
  
  /** Whether to automatically initialize DarkSwap */
  autoInitialize?: boolean;
  
  /** Path to the WebAssembly module */
  wasmPath?: string;
  
  /** DarkSwap configuration */
  config?: Config;
}

/**
 * Default DarkSwap configuration
 */
const defaultConfig: Config = {
  bitcoinNetwork: BitcoinNetwork.Testnet,
  relayUrl: 'ws://localhost:8080',
  listenAddresses: [],
  bootstrapPeers: [],
  debug: false,
};

/**
 * DarkSwapProvider component
 */
export const DarkSwapProvider: React.FC<DarkSwapProviderProps> = ({
  children,
  autoInitialize = false,
  wasmPath = '/wasm/darkswap_wasm_bg.wasm',
  config = defaultConfig,
}) => {
  // Use DarkSwap hook
  const darkswap = useDarkSwap(autoInitialize, config);
  
  return (
    <DarkSwapContext.Provider value={darkswap}>
      {children}
    </DarkSwapContext.Provider>
  );
};

/**
 * useDarkSwapContext hook
 * @returns DarkSwap context
 * @throws Error if used outside of DarkSwapProvider
 */
export const useDarkSwapContext = (): UseDarkSwapResult => {
  const context = useContext(DarkSwapContext);
  
  if (context === undefined) {
    throw new Error('useDarkSwapContext must be used within a DarkSwapProvider');
  }
  
  return context;
};

export default DarkSwapContext;