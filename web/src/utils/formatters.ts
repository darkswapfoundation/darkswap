/**
 * Formats a number as currency
 * @param value - The number to format
 * @param currency - The currency code (default: 'USD')
 * @param decimals - The number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  currency = 'USD',
  decimals = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formats a crypto amount with appropriate precision
 * @param amount - The amount to format
 * @param symbol - The crypto symbol (e.g., 'BTC', 'ETH')
 * @returns Formatted crypto amount string
 */
export const formatCryptoAmount = (amount: number, symbol: string): string => {
  let decimals = 2;
  
  // Adjust decimals based on crypto type
  if (symbol === 'BTC') {
    decimals = 8;
  } else if (amount < 0.01) {
    decimals = 6;
  } else if (amount < 1) {
    decimals = 4;
  }
  
  return `${amount.toFixed(decimals)} ${symbol}`;
};

/**
 * Shortens an address for display
 * @param address - The full address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Shortened address string
 */
export const shortenAddress = (
  address: string,
  startChars = 6,
  endChars = 4
): string => {
  if (!address) return '';
  if (address.length < startChars + endChars + 3) return address;
  
  return `${address.substring(0, startChars)}...${address.substring(
    address.length - endChars
  )}`;
};

/**
 * Formats a date as a relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | number): string => {
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - (date instanceof Date ? date.getTime() : date)) / 1000
  );
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};

/**
 * Formats a percentage value
 * @param value - The percentage value
 * @param decimals - The number of decimal places (default: 2)
 * @param includeSign - Whether to include the + sign for positive values (default: true)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  decimals = 2,
  includeSign = true
): string => {
  const formattedValue = value.toFixed(decimals);
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${formattedValue}%`;
};

/**
 * Formats an asset name for display
 * @param assetId - The asset ID (e.g., 'rune:0x123')
 * @returns Formatted asset name
 */
export const formatAssetName = (assetId: string): string => {
  if (assetId.includes(':')) {
    const [type] = assetId.split(':');
    return `${type.toUpperCase()}`;
  }
  return assetId.toUpperCase();
};

/**
 * Formats a trading pair for display
 * @param pair - The trading pair (e.g., 'BTC/RUNE:0x123')
 * @returns Formatted pair string
 */
export const formatTradingPair = (pair: string): string => {
  if (!pair.includes('/')) return pair;
  
  const [base, quote] = pair.split('/');
  return `${formatAssetName(base)}/${formatAssetName(quote)}`;
};