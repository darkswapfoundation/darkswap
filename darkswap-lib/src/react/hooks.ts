/**
 * React hooks for DarkSwap
 * 
 * This module provides React hooks for using DarkSwap in React applications.
 */

import { useEffect, useState, useCallback, useContext } from 'react';
import { DarkSwap, DarkSwapEvent, TradeOffer, AssetType } from '../index';
import { DarkSwapContext } from './context';

/**
 * Use the DarkSwap instance
 * 
 * @returns The DarkSwap instance
 */
export function useDarkSwap(): DarkSwap {
  const darkswap = useContext(DarkSwapContext);
  
  if (!darkswap) {
    throw new Error('useDarkSwap must be used within a DarkSwapProvider');
  }
  
  return darkswap;
}

/**
 * Use the local peer ID
 * 
 * @returns The local peer ID
 */
export function useLocalPeerId(): string {
  const darkswap = useDarkSwap();
  const [peerId, setPeerId] = useState<string>('');
  
  useEffect(() => {
    try {
      const id = darkswap.getLocalPeerId();
      setPeerId(id);
    } catch (error) {
      console.error('Failed to get local peer ID:', error);
    }
  }, [darkswap]);
  
  return peerId;
}

/**
 * Use a function to connect to a peer
 * 
 * @returns A function to connect to a peer
 */
export function useConnectToPeer(): (peerId: string) => Promise<void> {
  const darkswap = useDarkSwap();
  
  return useCallback(async (peerId: string) => {
    await darkswap.connectToPeer(peerId);
  }, [darkswap]);
}

/**
 * Use a function to connect to a peer via relay
 * 
 * @returns A function to connect to a peer via relay
 */
export function useConnectViaRelay(): (peerId: string) => Promise<string> {
  const darkswap = useDarkSwap();
  
  return useCallback(async (peerId: string) => {
    return await darkswap.connectViaRelay(peerId);
  }, [darkswap]);
}

/**
 * Use a function to send data to a peer via relay
 * 
 * @returns A function to send data to a peer via relay
 */
export function useSendViaRelay(): (peerId: string, relayId: string, data: Uint8Array) => Promise<void> {
  const darkswap = useDarkSwap();
  
  return useCallback(async (peerId: string, relayId: string, data: Uint8Array) => {
    await darkswap.sendViaRelay(peerId, relayId, data);
  }, [darkswap]);
}

/**
 * Use a function to close a relay connection
 * 
 * @returns A function to close a relay connection
 */
export function useCloseRelay(): (relayId: string) => Promise<void> {
  const darkswap = useDarkSwap();
  
  return useCallback(async (relayId: string) => {
    await darkswap.closeRelay(relayId);
  }, [darkswap]);
}

/**
 * Use an event listener
 * 
 * @param eventType The event type to listen for
 * @param handler The event handler
 */
export function useEvent<T>(eventType: string, handler: (payload: T) => void): void {
  const darkswap = useDarkSwap();
  
  useEffect(() => {
    const callback = (event: DarkSwapEvent) => {
      if (event.type === eventType) {
        handler(event.payload as T);
      }
    };
    
    darkswap.addEventListener(callback);
    
    return () => {
      darkswap.removeEventListener(callback);
    };
  }, [darkswap, eventType, handler]);
}

/**
 * Use the Bitcoin balance
 * 
 * @returns The Bitcoin balance in satoshis
 */
export function useBitcoinBalance(): number {
  const darkswap = useDarkSwap();
  const [balance, setBalance] = useState<number>(0);
  
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await darkswap.getBitcoinBalance();
        setBalance(balance);
      } catch (error) {
        console.error('Failed to get Bitcoin balance:', error);
      }
    };
    
    fetchBalance();
    
    // Refresh the balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [darkswap]);
  
  return balance;
}

/**
 * Use the rune balance
 * 
 * @param runeId The rune ID
 * @returns The rune balance
 */
export function useRuneBalance(runeId: string): number {
  const darkswap = useDarkSwap();
  const [balance, setBalance] = useState<number>(0);
  
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await darkswap.getRuneBalance(runeId);
        setBalance(balance);
      } catch (error) {
        console.error(`Failed to get rune balance for ${runeId}:`, error);
      }
    };
    
    fetchBalance();
    
    // Refresh the balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [darkswap, runeId]);
  
  return balance;
}

/**
 * Use the alkane balance
 * 
 * @param alkaneId The alkane ID
 * @returns The alkane balance
 */
export function useAlkaneBalance(alkaneId: string): number {
  const darkswap = useDarkSwap();
  const [balance, setBalance] = useState<number>(0);
  
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await darkswap.getAlkaneBalance(alkaneId);
        setBalance(balance);
      } catch (error) {
        console.error(`Failed to get alkane balance for ${alkaneId}:`, error);
      }
    };
    
    fetchBalance();
    
    // Refresh the balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [darkswap, alkaneId]);
  
  return balance;
}

/**
 * Use trade offers
 * 
 * @returns The trade offers
 */
export function useTradeOffers(): TradeOffer[] {
  const darkswap = useDarkSwap();
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offers = await darkswap.getTradeOffers();
        setOffers(offers);
      } catch (error) {
        console.error('Failed to get trade offers:', error);
      }
    };
    
    fetchOffers();
    
    // Refresh the offers every 10 seconds
    const interval = setInterval(fetchOffers, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [darkswap]);
  
  return offers;
}

/**
 * Use a trade offer
 * 
 * @param offerId The offer ID
 * @returns The trade offer
 */
export function useTradeOffer(offerId: string): TradeOffer | null {
  const darkswap = useDarkSwap();
  const [offer, setOffer] = useState<TradeOffer | null>(null);
  
  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const offer = await darkswap.getTradeOffer(offerId);
        setOffer(offer);
      } catch (error) {
        console.error(`Failed to get trade offer ${offerId}:`, error);
      }
    };
    
    fetchOffer();
    
    // Refresh the offer every 5 seconds
    const interval = setInterval(fetchOffer, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [darkswap, offerId]);
  
  return offer;
}

/**
 * Use the trade state
 * 
 * @param offerId The offer ID
 * @returns The trade state
 */
export function useTradeState(offerId: string): string {
  const darkswap = useDarkSwap();
  const [state, setState] = useState<string>('');
  
  useEffect(() => {
    const fetchState = async () => {
      try {
        const state = await darkswap.getTradeState(offerId);
        setState(state);
      } catch (error) {
        console.error(`Failed to get trade state for ${offerId}:`, error);
      }
    };
    
    fetchState();
    
    // Refresh the state every 5 seconds
    const interval = setInterval(fetchState, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [darkswap, offerId]);
  
  return state;
}

/**
 * Use a function to create a trade offer
 * 
 * @returns A function to create a trade offer
 */
export function useCreateTradeOffer(): (
  makerAssetType: 'bitcoin' | 'rune' | 'alkane',
  makerAssetId: string,
  makerAmount: number,
  takerAssetType: 'bitcoin' | 'rune' | 'alkane',
  takerAssetId: string,
  takerAmount: number,
  expirationSeconds: number,
) => Promise<TradeOffer> {
  const darkswap = useDarkSwap();
  
  return useCallback(async (
    makerAssetType: 'bitcoin' | 'rune' | 'alkane',
    makerAssetId: string,
    makerAmount: number,
    takerAssetType: 'bitcoin' | 'rune' | 'alkane',
    takerAssetId: string,
    takerAmount: number,
    expirationSeconds: number,
  ) => {
    return await darkswap.createTradeOffer(
      makerAssetType,
      makerAssetId,
      makerAmount,
      takerAssetType,
      takerAssetId,
      takerAmount,
      expirationSeconds,
    );
  }, [darkswap]);
}

/**
 * Use a function to accept a trade offer
 * 
 * @returns A function to accept a trade offer
 */
export function useAcceptTradeOffer(): (offerId: string) => Promise<void> {
  const darkswap = useDarkSwap();
  
  return useCallback(async (offerId: string) => {
    await darkswap.acceptTradeOffer(offerId);
  }, [darkswap]);
}