/**
 * WalletContext - Context for Bitcoin wallet
 * 
 * This context provides access to the Bitcoin wallet from React components.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import useWallet, { UseWalletResult } from '../hooks/useWallet';

// Wallet context
const WalletContext = createContext<UseWalletResult | undefined>(undefined);

// Wallet provider props
interface WalletProviderProps {
  /** Children components */
  children: ReactNode;
}

/**
 * WalletProvider component
 */
export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
}) => {
  // Use wallet hook
  const wallet = useWallet();
  
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * useWalletContext hook
 * @returns Wallet context
 * @throws Error if used outside of WalletProvider
 */
export const useWalletContext = (): UseWalletResult => {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  
  return context;
};

export default WalletContext;