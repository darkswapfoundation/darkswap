/**
 * Utility functions for formatting data in a consistent way across the application
 */

/**
 * Format a number as a price with appropriate decimal places
 * @param price The price to format
 * @param decimals The number of decimal places to show (default: 8)
 * @returns Formatted price string
 */
export function formatPrice(price: string | number, decimals: number = 8): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0.00';
  }
  
  // Use different decimal places based on price magnitude
  let displayDecimals = decimals;
  if (numPrice >= 1000) {
    displayDecimals = 2;
  } else if (numPrice >= 100) {
    displayDecimals = 4;
  } else if (numPrice >= 1) {
    displayDecimals = 6;
  }
  
  return numPrice.toFixed(displayDecimals);
}

/**
 * Format a number as an amount with appropriate decimal places
 * @param amount The amount to format
 * @param decimals The number of decimal places to show (default: 8)
 * @returns Formatted amount string
 */
export function formatAmount(amount: string | number, decimals: number = 8): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0.00';
  }
  
  return numAmount.toFixed(decimals);
}

/**
 * Format a percentage value
 * @param percent The percentage value to format
 * @param decimals The number of decimal places to show (default: 2)
 * @returns Formatted percentage string with % symbol
 */
export function formatPercentage(percent: number, decimals: number = 2): string {
  if (isNaN(percent)) {
    return '0.00%';
  }
  
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(decimals)}%`;
}

/**
 * Format a date as a string
 * @param timestamp The timestamp to format
 * @param includeTime Whether to include the time (default: true)
 * @returns Formatted date string
 */
export function formatDate(timestamp: number, includeTime: boolean = true): string {
  const date = new Date(timestamp);
  
  if (includeTime) {
    return date.toLocaleString();
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 * @param timestamp The timestamp to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Format a number with commas as thousands separators
 * @param num The number to format
 * @returns Formatted number string with commas
 */
export function formatNumberWithCommas(num: number | string): string {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format an address by showing only the first and last few characters
 * @param address The address to format
 * @param startChars Number of characters to show at the start (default: 6)
 * @param endChars Number of characters to show at the end (default: 4)
 * @returns Formatted address string
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address || '';
  }
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes The file size in bytes
 * @param decimals The number of decimal places to show (default: 2)
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) {
    return '0 Bytes';
  }
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format a duration in milliseconds to a human-readable string
 * @param ms The duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format a currency value
 * @param value The value to format
 * @param currency The currency code (default: 'USD')
 * @param decimals The number of decimal places to show (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'USD', decimals: number = 2): string {
  if (isNaN(value)) {
    return `$0.00`;
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatter.format(value);
}