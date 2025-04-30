import {
  formatBTC,
  formatPrice,
  formatPercent,
  formatDate,
  formatRelativeTime,
  formatTxHash,
  formatAddress,
  formatCurrency,
  formatFileSize,
} from '../../utils/formatters';

describe('Formatters', () => {
  describe('formatBTC', () => {
    it('formats a number with 8 decimal places', () => {
      expect(formatBTC(1.23456789)).toBe('1.23456789');
      expect(formatBTC(1)).toBe('1.00000000');
      expect(formatBTC(0)).toBe('0.00000000');
    });
    
    it('truncates numbers with more than 8 decimal places', () => {
      expect(formatBTC(1.234567891)).toBe('1.23456789');
    });
  });
  
  describe('formatPrice', () => {
    it('formats a number with 8 decimal places', () => {
      expect(formatPrice(1.23456789)).toBe('1.23456789');
      expect(formatPrice(1)).toBe('1.00000000');
      expect(formatPrice(0)).toBe('0.00000000');
    });
    
    it('truncates numbers with more than 8 decimal places', () => {
      expect(formatPrice(1.234567891)).toBe('1.23456789');
    });
  });
  
  describe('formatPercent', () => {
    it('formats a number as a percentage with 2 decimal places', () => {
      expect(formatPercent(1.2345)).toBe('+1.23%');
      expect(formatPercent(1)).toBe('+1.00%');
      expect(formatPercent(0)).toBe('+0.00%');
    });
    
    it('includes a plus sign for positive numbers', () => {
      expect(formatPercent(1.2345)).toBe('+1.23%');
    });
    
    it('includes a minus sign for negative numbers', () => {
      expect(formatPercent(-1.2345)).toBe('-1.23%');
    });
  });
  
  describe('formatDate', () => {
    it('formats a timestamp as a date string', () => {
      // Mock Date.prototype.toLocaleDateString
      const originalToLocaleDateString = Date.prototype.toLocaleDateString;
      Date.prototype.toLocaleDateString = jest.fn(() => '1/1/2025');
      
      expect(formatDate(1704067200000)).toBe('1/1/2025');
      
      // Restore original method
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
    });
  });
  
  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock Date.now
      jest.spyOn(Date, 'now').mockImplementation(() => 1704067200000); // January 1, 2025
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('formats a timestamp as "Just now" if less than a minute ago', () => {
      expect(formatRelativeTime(1704067199000)).toBe('Just now');
    });
    
    it('formats a timestamp as "X minutes ago" if less than an hour ago', () => {
      expect(formatRelativeTime(1704067200000 - 5 * 60 * 1000)).toBe('5 minutes ago');
      expect(formatRelativeTime(1704067200000 - 1 * 60 * 1000)).toBe('1 minute ago');
    });
    
    it('formats a timestamp as "X hours ago" if less than a day ago', () => {
      expect(formatRelativeTime(1704067200000 - 5 * 60 * 60 * 1000)).toBe('5 hours ago');
      expect(formatRelativeTime(1704067200000 - 1 * 60 * 60 * 1000)).toBe('1 hour ago');
    });
    
    it('formats a timestamp as "X days ago" if less than a week ago', () => {
      expect(formatRelativeTime(1704067200000 - 5 * 24 * 60 * 60 * 1000)).toBe('5 days ago');
      expect(formatRelativeTime(1704067200000 - 1 * 24 * 60 * 60 * 1000)).toBe('1 day ago');
    });
    
    it('formats a timestamp as a date if more than a week ago', () => {
      // Mock formatDate function directly
      const originalFormatDate = formatDate;
      const mockFormatDate = jest.fn(() => '12/24/2024');
      
      // Use jest.spyOn instead of direct assignment
      jest.spyOn({ formatDate }, 'formatDate').mockImplementation(() => '12/24/2024');
      
      // Test with a date more than a week ago
      const oldDate = 1704067200000 - 8 * 24 * 60 * 60 * 1000;
      
      // Since we can't mock the imported function easily, we'll just verify the date is formatted
      const result = formatRelativeTime(oldDate);
      expect(result).toBe(formatDate(oldDate));
    });
  });
  
  describe('formatTxHash', () => {
    it('formats a transaction hash for display', () => {
      expect(formatTxHash('0123456789abcdef0123456789abcdef')).toBe('01234567...89abcdef');
    });
    
    it('returns the full hash if it is 16 characters or less', () => {
      expect(formatTxHash('0123456789abcdef')).toBe('0123456789abcdef');
    });
    
    it('returns "Unknown" if the hash is empty', () => {
      expect(formatTxHash('')).toBe('Unknown');
    });
  });
  
  describe('formatAddress', () => {
    it('formats an address for display with default prefix and suffix lengths', () => {
      expect(formatAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toBe('bc1qar...wf5mdq');
    });
    
    it('formats an address for display with custom prefix and suffix lengths', () => {
      expect(formatAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 8, 4)).toBe('bc1qar0s...5mdq');
    });
    
    it('returns the full address if it is shorter than prefix + suffix', () => {
      expect(formatAddress('bc1qar')).toBe('bc1qar');
    });
    
    it('returns "Unknown" if the address is empty', () => {
      expect(formatAddress('')).toBe('Unknown');
    });
  });
  
  describe('formatCurrency', () => {
    it('formats a number as USD currency by default', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });
    
    it('formats a number as the specified currency', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });
  });
  
  describe('formatFileSize', () => {
    it('formats a file size in bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });
    
    it('formats a file size in KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
    
    it('formats a file size in MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });
    
    it('formats a file size in GB', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
    
    it('formats a file size in TB', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });
  });
});