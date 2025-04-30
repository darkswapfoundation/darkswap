/**
 * Formatters - Utility functions for formatting data
 * 
 * This file contains utility functions for formatting various types of data
 * such as dates, numbers, addresses, etc.
 */

/**
 * Format a number with commas as thousands separators
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export const formatNumber = (value: number, decimals = 2): string => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format a price with currency symbol
 * @param value Price to format
 * @param currency Currency code
 * @returns Formatted price string
 */
export const formatPrice = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * Format a percentage
 * @param value Percentage to format
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercent = (value: number, decimals = 2): string => {
  return `${formatNumber(value, decimals)}%`;
};

/**
 * Format a date
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

/**
 * Format a time
 * @param date Date to format
 * @returns Formatted time string
 */
export const formatTime = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleTimeString();
};

/**
 * Format a date and time
 * @param date Date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleString();
};

/**
 * Format a relative time (e.g. "2 hours ago")
 * @param date Date to format
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffSec < 60) {
    return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  } else if (diffDay < 30) {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  } else if (diffMonth < 12) {
    return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Format a duration in milliseconds
 * @param ms Duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format a file size
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format a Bitcoin address (truncate middle)
 * @param address Bitcoin address
 * @returns Truncated address string
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

/**
 * Format a transaction hash (truncate middle)
 * @param hash Transaction hash
 * @returns Truncated hash string
 */
export const formatTxHash = (hash: string): string => {
  if (!hash) return '';
  if (hash.length <= 13) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
};

/**
 * Format a Bitcoin amount
 * @param amount Amount in BTC
 * @returns Formatted BTC string
 */
export const formatBTC = (amount: number): string => {
  return `${formatNumber(amount, 8)} BTC`;
};

/**
 * Format a satoshi amount
 * @param satoshi Amount in satoshis
 * @returns Formatted BTC string
 */
export const formatSatoshi = (satoshi: number): string => {
  return formatBTC(satoshi / 100000000);
};

/**
 * Format an amount with the appropriate unit
 * @param amount Amount to format
 * @param asset Asset symbol (e.g., 'BTC', 'USD')
 * @param decimals Number of decimal places
 * @returns Formatted amount string
 */
export const formatAmount = (amount: number, asset: string, decimals = 8): string => {
  if (asset === 'BTC') {
    return formatBTC(amount);
  } else if (asset === 'USD') {
    return formatPrice(amount);
  } else {
    return `${formatNumber(amount, decimals)} ${asset}`;
  }
};