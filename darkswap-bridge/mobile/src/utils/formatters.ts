/**
 * Format a number as a BTC amount with 8 decimal places
 * @param value The number to format
 * @returns Formatted BTC amount
 */
export const formatBTC = (value: number): string => {
  return value.toFixed(8);
};

/**
 * Format a number as a price with 8 decimal places
 * @param value The number to format
 * @returns Formatted price
 */
export const formatPrice = (value: number): string => {
  return value.toFixed(8);
};

/**
 * Format a number as a percentage with 2 decimal places
 * @param value The number to format
 * @returns Formatted percentage
 */
export const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Format a date as a string
 * @param timestamp The timestamp to format
 * @returns Formatted date
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

/**
 * Format a timestamp as a relative time string
 * @param timestamp The timestamp to format
 * @returns Formatted relative time
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Less than a minute
  if (diff < 60 * 1000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  // Otherwise, return the date
  return formatDate(timestamp);
};

/**
 * Format a transaction hash for display
 * @param hash The transaction hash to format
 * @returns Formatted transaction hash
 */
export const formatTxHash = (hash: string): string => {
  if (!hash) return 'Unknown';
  if (hash.length <= 16) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
};

/**
 * Format an address for display
 * @param address The address to format
 * @param prefixLength The number of characters to show at the beginning
 * @param suffixLength The number of characters to show at the end
 * @returns Formatted address
 */
export const formatAddress = (address: string, prefixLength = 6, suffixLength = 6): string => {
  if (!address) return 'Unknown';
  if (address.length <= prefixLength + suffixLength) return address;
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
};

/**
 * Format a number as a currency
 * @param value The number to format
 * @param currency The currency code
 * @returns Formatted currency
 */
export const formatCurrency = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * Format a file size
 * @param bytes The file size in bytes
 * @returns Formatted file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};