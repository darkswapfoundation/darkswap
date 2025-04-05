/**
 * Utility functions for the DarkSwap TypeScript Library
 */

import { SATOSHIS_PER_BTC } from './constants';
import BigNumber from 'bignumber.js';

/**
 * Convert BTC to satoshis
 * @param btc BTC amount
 * @returns Satoshis amount
 */
export function btcToSatoshis(btc: string | number): string {
  return new BigNumber(btc).times(SATOSHIS_PER_BTC).toFixed(0);
}

/**
 * Convert satoshis to BTC
 * @param satoshis Satoshis amount
 * @returns BTC amount
 */
export function satoshisToBtc(satoshis: string | number): string {
  return new BigNumber(satoshis).div(SATOSHIS_PER_BTC).toFixed(8);
}

/**
 * Format BTC amount
 * @param btc BTC amount
 * @param decimals Number of decimal places
 * @returns Formatted BTC amount
 */
export function formatBtc(btc: string | number, decimals: number = 8): string {
  return new BigNumber(btc).toFixed(decimals);
}

/**
 * Format satoshis amount
 * @param satoshis Satoshis amount
 * @returns Formatted satoshis amount
 */
export function formatSatoshis(satoshis: string | number): string {
  return new BigNumber(satoshis).toFixed(0);
}

/**
 * Format rune amount
 * @param amount Rune amount
 * @param decimals Number of decimal places
 * @returns Formatted rune amount
 */
export function formatRuneAmount(amount: string | number, decimals: number): string {
  return new BigNumber(amount).toFixed(decimals);
}

/**
 * Format alkane amount
 * @param amount Alkane amount
 * @param decimals Number of decimal places
 * @returns Formatted alkane amount
 */
export function formatAlkaneAmount(amount: string | number, decimals: number): string {
  return new BigNumber(amount).toFixed(decimals);
}

/**
 * Parse rune amount
 * @param amount Rune amount
 * @param decimals Number of decimal places
 * @returns Parsed rune amount
 */
export function parseRuneAmount(amount: string | number, decimals: number): string {
  return new BigNumber(amount).times(new BigNumber(10).pow(decimals)).toFixed(0);
}

/**
 * Parse alkane amount
 * @param amount Alkane amount
 * @param decimals Number of decimal places
 * @returns Parsed alkane amount
 */
export function parseAlkaneAmount(amount: string | number, decimals: number): string {
  return new BigNumber(amount).times(new BigNumber(10).pow(decimals)).toFixed(0);
}

/**
 * Format price
 * @param price Price
 * @param decimals Number of decimal places
 * @returns Formatted price
 */
export function formatPrice(price: string | number, decimals: number = 8): string {
  return new BigNumber(price).toFixed(decimals);
}

/**
 * Format percentage
 * @param percentage Percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage
 */
export function formatPercentage(percentage: string | number, decimals: number = 2): string {
  return new BigNumber(percentage).toFixed(decimals);
}

/**
 * Format date
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Format relative time
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 0) {
    return 'in the future';
  }
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  
  return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
}

/**
 * Validate Bitcoin address
 * @param address Bitcoin address
 * @returns True if the address is valid
 */
export function validateBitcoinAddress(address: string): boolean {
  // This is a simple validation, a real implementation would use a Bitcoin library
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[ac-hj-np-z02-9]{39,59}$/.test(address);
}

/**
 * Validate rune ID
 * @param runeId Rune ID
 * @returns True if the rune ID is valid
 */
export function validateRuneId(runeId: string): boolean {
  // This is a simple validation, a real implementation would use a Bitcoin library
  return /^[0-9a-f]{64}$/.test(runeId);
}

/**
 * Validate alkane ID
 * @param alkaneId Alkane ID
 * @returns True if the alkane ID is valid
 */
export function validateAlkaneId(alkaneId: string): boolean {
  // This is a simple validation, a real implementation would use a Bitcoin library
  return /^[0-9a-f]{64}$/.test(alkaneId);
}

/**
 * Generate a random ID
 * @param length Length of the ID
 * @returns Random ID
 */
export function generateRandomId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Sleep for a specified duration
 * @param ms Duration in milliseconds
 * @returns Promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function
 * @param fn Function to retry
 * @param retries Number of retries
 * @param delay Delay between retries in milliseconds
 * @returns Promise that resolves with the function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    await sleep(delay);
    return retry(fn, retries - 1, delay);
  }
}

/**
 * Debounce a function
 * @param fn Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      fn.apply(this, args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 * @param fn Function to throttle
 * @param wait Wait time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  
  return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      previous = now;
      fn.apply(this, args);
    } else if (timeout === null) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}