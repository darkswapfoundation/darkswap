import { useState, useEffect } from 'react';
import { useDarkSwap, useTradeOffers, useBalances, AssetType } from './useDarkSwap';

// Hook for creating trade offers
export const useCreateTradeOffer = () => {
  const { tradeOffers, createTradeOffer } = useTradeOffers();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = async (
    makerAsset: AssetType,
    makerAmount: number,
    takerAsset: AssetType,
    takerAmount: number
  ) => {
    setIsCreating(true);
    setError(null);
    
    try {
      const offerId = await createTradeOffer({
        makerAsset,
        makerAmount,
        takerAsset,
        takerAmount,
      });
      
      return offerId;
    } catch (err) {
      console.error('Failed to create trade offer:', err);
      setError(err instanceof Error ? err : new Error('Failed to create trade offer'));
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    create,
    isCreating,
    error,
  };
};

// Hook for accepting trade offers
export const useAcceptTradeOffer = () => {
  const { acceptTradeOffer } = useTradeOffers();
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const accept = async (offerId: string) => {
    setIsAccepting(true);
    setError(null);
    
    try {
      const result = await acceptTradeOffer(offerId);
      return result;
    } catch (err) {
      console.error('Failed to accept trade offer:', err);
      setError(err instanceof Error ? err : new Error('Failed to accept trade offer'));
      throw err;
    } finally {
      setIsAccepting(false);
    }
  };

  return {
    accept,
    isAccepting,
    error,
  };
};

// Hook for getting Bitcoin balance
export const useBitcoinBalance = () => {
  const { balances, isLoading } = useBalances();
  
  return {
    balance: balances['bitcoin'] || 0,
    isLoading,
  };
};

// Hook for getting Rune balance
export const useRuneBalance = (runeId: string) => {
  const { balances, isLoading } = useBalances();
  
  return {
    balance: balances[`rune:${runeId}`] || 0,
    isLoading,
  };
};

// Hook for getting Alkane balance
export const useAlkaneBalance = (alkaneId: string) => {
  const { balances, isLoading } = useBalances();
  
  return {
    balance: balances[`alkane:${alkaneId}`] || 0,
    isLoading,
  };
};