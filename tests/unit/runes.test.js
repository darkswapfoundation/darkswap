/**
 * Runes Tests
 * 
 * This file contains tests for the Runes functionality.
 */

const { RunesUtils } = require('../../web/src/utils/RunesUtils');
const { BitcoinTransactionUtils } = require('../../web/src/utils/BitcoinTransactionUtils');

// Mock BitcoinTransactionUtils
jest.mock('../../web/src/utils/BitcoinTransactionUtils', () => ({
  BitcoinTransactionUtils: {
    createTransaction: jest.fn().mockReturnValue('mocktxhex'),
    signTransaction: jest.fn().mockReturnValue('mocksignedtxhex'),
    broadcastTransaction: jest.fn().mockResolvedValue('mocktxid'),
    calculateFee: jest.fn().mockReturnValue(1000),
    verifyTransaction: jest.fn().mockReturnValue(true),
  },
}));

// Mock data
const mockAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
const mockRuneId = 'rune1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
const mockPrivateKey = 'cVQVgBr8GUpiLa3T9ZRWNfGWJhYR4zMSEJCPVSvEhQKEZQZPuTZF';
const mockUTXO = {
  txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  vout: 0,
  value: 100000000, // 1 BTC
  scriptPubKey: '0014d85c2b71d0060b09c9886aeb815e50991dda124d',
};

// Mock fetch responses
global.fetch = jest.fn().mockImplementation((url) => {
  if (url.includes('/runes')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          id: mockRuneId,
          ticker: 'TEST',
          name: 'Test Rune',
          decimals: 8,
          supply: '1000000',
          limit: '1000000',
          description: 'A test rune',
          creator: mockAddress,
          timestamp: 1672531200000,
        },
      ]),
    });
  } else if (url.includes('/rune/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: mockRuneId,
        ticker: 'TEST',
        name: 'Test Rune',
        decimals: 8,
        supply: '1000000',
        limit: '1000000',
        description: 'A test rune',
        creator: mockAddress,
        timestamp: 1672531200000,
      }),
    });
  } else if (url.includes('/balances')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          runeId: mockRuneId,
          ticker: 'TEST',
          name: 'Test Rune',
          balance: '100',
          decimals: 8,
        },
      ]),
    });
  } else if (url.includes('/transactions')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          txid: 'mocktxid',
          runeId: mockRuneId,
          ticker: 'TEST',
          amount: '10',
          from: mockAddress,
          to: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          timestamp: 1672531200000,
          confirmed: true,
        },
      ]),
    });
  }
  
  return Promise.resolve({
    ok: false,
    text: () => Promise.resolve('Not found'),
  });
});

describe('RunesUtils', () => {
  describe('getAllRunes', () => {
    it('should fetch all runes', async () => {
      // Act
      const runes = await RunesUtils.getAllRunes();
      
      // Assert
      expect(runes).toHaveLength(1);
      expect(runes[0].id).toBe(mockRuneId);
      expect(runes[0].ticker).toBe('TEST');
      expect(global.fetch).toHaveBeenCalled();
    });
    
    it('should handle errors when fetching runes', async () => {
      // Arrange
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      // Act & Assert
      await expect(RunesUtils.getAllRunes()).rejects.toThrow('Network error');
    });
  });
  
  describe('getRuneById', () => {
    it('should fetch a rune by ID', async () => {
      // Arrange
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/rune/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: mockRuneId,
              ticker: 'TEST',
              name: 'Test Rune',
              decimals: 8,
              supply: '1000000',
              limit: '1000000',
              description: 'A test rune',
              creator: mockAddress,
              timestamp: 1672531200000,
            }),
          });
        }
        
        return Promise.resolve({
          ok: false,
          text: () => Promise.resolve('Not found'),
        });
      });
      
      // Act
      const rune = await RunesUtils.getRuneById(mockRuneId);
      
      // Assert
      expect(rune).toBeDefined();
      expect(rune.id).toBe(mockRuneId);
      expect(rune.ticker).toBe('TEST');
      expect(global.fetch).toHaveBeenCalled();
    });
    
    it('should return undefined if the rune is not found', async () => {
      // Arrange
      global.fetch = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          text: () => Promise.resolve('Not found'),
        });
      });
      
      // Act
      const rune = await RunesUtils.getRuneById('nonexistent');
      
      // Assert
      expect(rune).toBeUndefined();
    });
  });
  
  describe('getRuneByTicker', () => {
    it('should fetch a rune by ticker', async () => {
      // Arrange
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/runes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              {
                id: mockRuneId,
                ticker: 'TEST',
                name: 'Test Rune',
                decimals: 8,
                supply: '1000000',
                limit: '1000000',
                description: 'A test rune',
                creator: mockAddress,
                timestamp: 1672531200000,
              },
            ]),
          });
        }
        
        return Promise.resolve({
          ok: false,
          text: () => Promise.resolve('Not found'),
        });
      });
      
      // Act
      const rune = await RunesUtils.getRuneByTicker('TEST');
      
      // Assert
      expect(rune).toBeDefined();
      expect(rune.id).toBe(mockRuneId);
      expect(rune.ticker).toBe('TEST');
    });
    
    it('should return undefined if the rune is not found', async () => {
      // Arrange
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/runes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        
        return Promise.resolve({
          ok: false,
          text: () => Promise.resolve('Not found'),
        });
      });
      
      // Act
      const rune = await RunesUtils.getRuneByTicker('NONEXISTENT');
      
      // Assert
      expect(rune).toBeUndefined();
    });
  });
  
  describe('getRuneBalances', () => {
    it('should fetch rune balances for an address', async () => {
      // Arrange
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/balances')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              {
                runeId: mockRuneId,
                ticker: 'TEST',
                name: 'Test Rune',
                balance: '100',
                decimals: 8,
              },
            ]),
          });
        }
        
        return Promise.resolve({
          ok: false,
          text: () => Promise.resolve('Not found'),
        });
      });
      
      // Act
      const balances = await RunesUtils.getRuneBalances(mockAddress);
      
      // Assert
      expect(balances).toHaveLength(1);
      expect(balances[0].runeId).toBe(mockRuneId);
      expect(balances[0].balance).toBe('100');
    });
  });
  
  describe('getRuneTransactions', () => {
    it('should fetch rune transactions for an address', async () => {
      // Arrange
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/transactions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              {
                txid: 'mocktxid',
                runeId: mockRuneId,
                ticker: 'TEST',
                amount: '10',
                from: mockAddress,
                to: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
                timestamp: 1672531200000,
                confirmed: true,
              },
            ]),
          });
        }
        
        return Promise.resolve({
          ok: false,
          text: () => Promise.resolve('Not found'),
        });
      });
      
      // Act
      const transactions = await RunesUtils.getRuneTransactions(mockAddress);
      
      // Assert
      expect(transactions).toHaveLength(1);
      expect(transactions[0].txid).toBe('mocktxid');
      expect(transactions[0].runeId).toBe(mockRuneId);
    });
  });
  
  describe('createRuneTransferTransaction', () => {
    it('should create a rune transfer transaction', async () => {
      // Arrange
      const inputs = [
        {
          utxo: mockUTXO,
          privateKey: mockPrivateKey,
        },
      ];
      
      // Act
      const txHex = await RunesUtils.createRuneTransferTransaction(
        mockRuneId,
        '10',
        mockAddress,
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        inputs
      );
      
      // Assert
      expect(txHex).toBe('mocktxhex');
      expect(BitcoinTransactionUtils.createTransaction).toHaveBeenCalled();
    });
  });
  
  describe('formatRuneAmount', () => {
    it('should format a rune amount', () => {
      // Act
      const formattedAmount = RunesUtils.formatRuneAmount('1000000000', 8);
      
      // Assert
      expect(formattedAmount).toBe('10.00000000');
    });
  });
  
  describe('parseRuneAmount', () => {
    it('should parse a rune amount', () => {
      // Act
      const parsedAmount = RunesUtils.parseRuneAmount('10.5', 8);
      
      // Assert
      expect(parsedAmount).toBe('1050000000');
    });
  });
});