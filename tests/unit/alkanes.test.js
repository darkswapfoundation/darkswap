/**
 * Alkanes Tests
 * 
 * This file contains tests for the Alkanes functionality.
 */

const { AlkanesUtils } = require('../../web/src/utils/AlkanesUtils');
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
const mockAlkaneId = 'alkane1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
const mockPrivateKey = 'cVQVgBr8GUpiLa3T9ZRWNfGWJhYR4zMSEJCPVSvEhQKEZQZPuTZF';
const mockUTXO = {
  txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  vout: 0,
  value: 100000000, // 1 BTC
  scriptPubKey: '0014d85c2b71d0060b09c9886aeb815e50991dda124d',
};

describe('AlkanesUtils', () => {
  describe('getAllAlkanes', () => {
    it('should return all alkanes', async () => {
      // Act
      const alkanes = await AlkanesUtils.getAllAlkanes();
      
      // Assert
      expect(alkanes).toBeDefined();
      expect(Array.isArray(alkanes)).toBe(true);
      expect(alkanes.length).toBeGreaterThan(0);
    });
  });
  
  describe('getAlkaneById', () => {
    it('should return an alkane by ID', async () => {
      // Arrange
      const alkaneId = 'alkane1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3lfcg5';
      
      // Act
      const alkane = await AlkanesUtils.getAlkaneById(alkaneId);
      
      // Assert
      expect(alkane).toBeDefined();
      expect(alkane.id).toBe(alkaneId);
      expect(alkane.ticker).toBe('METH');
    });
    
    it('should return undefined for a non-existent alkane ID', async () => {
      // Arrange
      const alkaneId = 'nonexistent';
      
      // Act
      const alkane = await AlkanesUtils.getAlkaneById(alkaneId);
      
      // Assert
      expect(alkane).toBeUndefined();
    });
  });
  
  describe('getAlkaneByTicker', () => {
    it('should return an alkane by ticker', async () => {
      // Arrange
      const ticker = 'METH';
      
      // Act
      const alkane = await AlkanesUtils.getAlkaneByTicker(ticker);
      
      // Assert
      expect(alkane).toBeDefined();
      expect(alkane.ticker).toBe(ticker);
    });
    
    it('should return undefined for a non-existent ticker', async () => {
      // Arrange
      const ticker = 'NONEXISTENT';
      
      // Act
      const alkane = await AlkanesUtils.getAlkaneByTicker(ticker);
      
      // Assert
      expect(alkane).toBeUndefined();
    });
  });
  
  describe('getAlkaneBalances', () => {
    it('should return alkane balances for an address', async () => {
      // Act
      const balances = await AlkanesUtils.getAlkaneBalances(mockAddress);
      
      // Assert
      expect(balances).toBeDefined();
      expect(Array.isArray(balances)).toBe(true);
      expect(balances.length).toBeGreaterThan(0);
      
      // Check the structure of a balance
      const balance = balances[0];
      expect(balance).toHaveProperty('alkaneId');
      expect(balance).toHaveProperty('ticker');
      expect(balance).toHaveProperty('name');
      expect(balance).toHaveProperty('balance');
      expect(balance).toHaveProperty('decimals');
    });
  });
  
  describe('getAlkaneTransactions', () => {
    it('should return alkane transactions for an address', async () => {
      // Act
      const transactions = await AlkanesUtils.getAlkaneTransactions(mockAddress);
      
      // Assert
      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
      
      // Check the structure of a transaction
      const transaction = transactions[0];
      expect(transaction).toHaveProperty('txid');
      expect(transaction).toHaveProperty('alkaneId');
      expect(transaction).toHaveProperty('ticker');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('from');
      expect(transaction).toHaveProperty('to');
      expect(transaction).toHaveProperty('timestamp');
      expect(transaction).toHaveProperty('confirmed');
    });
  });
  
  describe('createAlkaneTransferTransaction', () => {
    it('should create an alkane transfer transaction', async () => {
      // Arrange
      const alkaneId = mockAlkaneId;
      const amount = '10';
      const fromAddress = mockAddress;
      const toAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      const inputs = [
        {
          utxo: mockUTXO,
          privateKey: mockPrivateKey,
        },
      ];
      
      // Act
      const txHex = await AlkanesUtils.createAlkaneTransferTransaction(
        alkaneId,
        amount,
        fromAddress,
        toAddress,
        inputs
      );
      
      // Assert
      expect(txHex).toBe('mocktxhex');
      expect(BitcoinTransactionUtils.createTransaction).toHaveBeenCalled();
    });
    
    it('should throw an error if the alkane is not found', async () => {
      // Arrange
      const alkaneId = 'nonexistent';
      const amount = '10';
      const fromAddress = mockAddress;
      const toAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      const inputs = [
        {
          utxo: mockUTXO,
          privateKey: mockPrivateKey,
        },
      ];
      
      // Mock the getAlkaneById method to return undefined
      jest.spyOn(AlkanesUtils, 'getAlkaneById').mockResolvedValue(undefined);
      
      // Act & Assert
      await expect(
        AlkanesUtils.createAlkaneTransferTransaction(
          alkaneId,
          amount,
          fromAddress,
          toAddress,
          inputs
        )
      ).rejects.toThrow(`Alkane ${alkaneId} not found`);
    });
  });
  
  describe('parseAlkaneData', () => {
    it('should parse alkane data from a transaction', () => {
      // Arrange
      const txHex = 'mocktxhex';
      
      // Act
      const alkaneData = AlkanesUtils.parseAlkaneData(txHex);
      
      // Assert
      expect(alkaneData).toBeDefined();
      expect(alkaneData).toHaveProperty('alkaneId');
      expect(alkaneData).toHaveProperty('amount');
    });
  });
  
  describe('formatAlkaneAmount', () => {
    it('should format an alkane amount', () => {
      // Arrange
      const amount = '1000000000';
      const decimals = 8;
      
      // Act
      const formattedAmount = AlkanesUtils.formatAlkaneAmount(amount, decimals);
      
      // Assert
      expect(formattedAmount).toBe('10.00000000');
    });
  });
  
  describe('parseAlkaneAmount', () => {
    it('should parse an alkane amount', () => {
      // Arrange
      const amount = '10.5';
      const decimals = 8;
      
      // Act
      const parsedAmount = AlkanesUtils.parseAlkaneAmount(amount, decimals);
      
      // Assert
      expect(parsedAmount).toBe('1050000000');
    });
  });
  
  describe('getAlkaneProperties', () => {
    it('should return properties for an alkane', async () => {
      // Arrange
      const alkaneId = 'alkane1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3lfcg5';
      
      // Act
      const properties = await AlkanesUtils.getAlkaneProperties(alkaneId);
      
      // Assert
      expect(properties).toBeDefined();
      expect(properties).toHaveProperty('formula');
      expect(properties).toHaveProperty('carbonAtoms');
      expect(properties).toHaveProperty('hydrogenAtoms');
    });
  });
  
  describe('getAlkaneMetadata', () => {
    it('should return metadata for an alkane', async () => {
      // Arrange
      const alkaneId = 'alkane1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3lfcg5';
      
      // Act
      const metadata = await AlkanesUtils.getAlkaneMetadata(alkaneId);
      
      // Assert
      expect(metadata).toBeDefined();
      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('ticker');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('creator');
      expect(metadata).toHaveProperty('timestamp');
      expect(metadata).toHaveProperty('supply');
      expect(metadata).toHaveProperty('decimals');
    });
  });
});