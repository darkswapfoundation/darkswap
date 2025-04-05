/**
 * Formatting utilities for DarkSwap Mobile
 * 
 * This module provides utilities for formatting various types of data.
 */

/**
 * Format a number with specified precision
 * @param value - Number to format
 * @param precision - Number of decimal places
 * @param options - Formatting options
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | string,
  precision: number = 2,
  options: Intl.NumberFormatOptions = {}
): string => {
  // Convert string to number if needed
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN and Infinity
  if (!isFinite(num)) {
    return '0';
  }
  
  // Format with Intl.NumberFormat
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    ...options
  }).format(num);
};

/**
 * Format a price with appropriate precision
 * @param price - Price to format
 * @param symbol - Currency symbol
 * @returns Formatted price string
 */
export const formatPrice = (
  price: number | string,
  symbol: string = ''
): string => {
  // Convert string to number if needed
  const num = typeof price === 'string' ? parseFloat(price) : price;
  
  // Handle NaN and Infinity
  if (!isFinite(num)) {
    return `${symbol}0`;
  }
  
  // Determine precision based on price
  let precision = 2;
  
  if (num < 0.0001) {
    precision = 8;
  } else if (num < 0.01) {
    precision = 6;
  } else if (num < 1) {
    precision = 4;
  }
  
  // Format with Intl.NumberFormat
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(num);
  
  // Add symbol if provided
  return symbol ? `${symbol}${formatted}` : formatted;
};

/**
 * Format a percentage
 * @param value - Percentage value
 * @param precision - Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercent = (
  value: number | string,
  precision: number = 2
): string => {
  // Convert string to number if needed
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN and Infinity
  if (!isFinite(num)) {
    return '0%';
  }
  
  // Format with Intl.NumberFormat
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(num / 100);
};

/**
 * Format a Bitcoin amount
 * @param value - BTC amount
 * @param precision - Number of decimal places
 * @returns Formatted BTC string
 */
export const formatBTC = (
  value: number | string,
  precision: number = 8
): string => {
  // Convert string to number if needed
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN and Infinity
  if (!isFinite(num)) {
    return '0 BTC';
  }
  
  // Format with Intl.NumberFormat
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(num);
  
  return `${formatted} BTC`;
};

/**
 * Format a satoshi amount
 * @param value - Satoshi amount
 * @returns Formatted satoshi string
 */
export const formatSatoshi = (value: number | string): string => {
  // Convert string to number if needed
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN and Infinity
  if (!isFinite(num)) {
    return '0 sats';
  }
  
  // Format with Intl.NumberFormat
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(num);
  
  return `${formatted} sats`;
};

/**
 * Format a date
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | number | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string => {
  // Convert to Date object if needed
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Handle invalid date
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  // Format with Intl.DateTimeFormat
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Format a time
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted time string
 */
export const formatTime = (
  date: Date | number | string,
  options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  }
): string => {
  // Convert to Date object if needed
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Handle invalid date
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }
  
  // Format with Intl.DateTimeFormat
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Format a datetime
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted datetime string
 */
export const formatDateTime = (
  date: Date | number | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  }
): string => {
  // Convert to Date object if needed
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Handle invalid date
  if (isNaN(dateObj.getTime())) {
    return 'Invalid DateTime';
  }
  
  // Format with Intl.DateTimeFormat
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Format a relative time
 * @param date - Date to format
 * @param baseDate - Base date for comparison
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (
  date: Date | number | string,
  baseDate: Date | number | string = new Date()
): string => {
  // Convert to Date objects if needed
  const dateObj = date instanceof Date ? date : new Date(date);
  const baseDateObj = baseDate instanceof Date ? baseDate : new Date(baseDate);
  
  // Handle invalid date
  if (isNaN(dateObj.getTime()) || isNaN(baseDateObj.getTime())) {
    return 'Invalid Date';
  }
  
  // Calculate time difference in seconds
  const diffSeconds = Math.floor((baseDateObj.getTime() - dateObj.getTime()) / 1000);
  const absDiffSeconds = Math.abs(diffSeconds);
  
  // Format based on time difference
  if (absDiffSeconds < 60) {
    return 'just now';
  } else if (absDiffSeconds < 3600) {
    const minutes = Math.floor(absDiffSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${diffSeconds < 0 ? 'from now' : 'ago'}`;
  } else if (absDiffSeconds < 86400) {
    const hours = Math.floor(absDiffSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${diffSeconds < 0 ? 'from now' : 'ago'}`;
  } else if (absDiffSeconds < 2592000) {
    const days = Math.floor(absDiffSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ${diffSeconds < 0 ? 'from now' : 'ago'}`;
  } else if (absDiffSeconds < 31536000) {
    const months = Math.floor(absDiffSeconds / 2592000);
    return `${months} ${months === 1 ? 'month' : 'months'} ${diffSeconds < 0 ? 'from now' : 'ago'}`;
  } else {
    const years = Math.floor(absDiffSeconds / 31536000);
    return `${years} ${years === 1 ? 'year' : 'years'} ${diffSeconds < 0 ? 'from now' : 'ago'}`;
  }
};

/**
 * Format a file size
 * @param bytes - File size in bytes
 * @param precision - Number of decimal places
 * @returns Formatted file size string
 */
export const formatFileSize = (
  bytes: number,
  precision: number = 2
): string => {
  // Handle invalid input
  if (bytes === 0 || !isFinite(bytes)) {
    return '0 B';
  }
  
  // Define units
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  // Calculate unit index
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  
  // Format with specified precision
  return `${(bytes / Math.pow(1024, unitIndex)).toFixed(precision)} ${units[unitIndex]}`;
};

/**
 * Format an address (e.g., Bitcoin address)
 * @param address - Address to format
 * @param prefixLength - Number of characters to show at the beginning
 * @param suffixLength - Number of characters to show at the end
 * @returns Formatted address string
 */
export const formatAddress = (
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string => {
  // Handle invalid input
  if (!address || typeof address !== 'string') {
    return '';
  }
  
  // Return full address if it's shorter than the combined prefix and suffix length
  if (address.length <= prefixLength + suffixLength) {
    return address;
  }
  
  // Format address with ellipsis
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
};

/**
 * Format a transaction hash
 * @param hash - Transaction hash to format
 * @param prefixLength - Number of characters to show at the beginning
 * @param suffixLength - Number of characters to show at the end
 * @returns Formatted transaction hash string
 */
export const formatTxHash = (
  hash: string,
  prefixLength: number = 8,
  suffixLength: number = 8
): string => {
  return formatAddress(hash, prefixLength, suffixLength);
};

/**
 * Format a currency amount
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param locale - Locale for formatting
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  // Convert string to number if needed
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle NaN and Infinity
  if (!isFinite(num)) {
    return `0 ${currency}`;
  }
  
  // Format with Intl.NumberFormat
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};