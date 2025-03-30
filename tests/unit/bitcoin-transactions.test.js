/**
 * Bitcoin Transaction Tests
 * 
 * This file contains tests for the Bitcoin transaction functionality.
 */

const { BitcoinTransactionUtils } = require('../../web/src/utils/BitcoinTransactionUtils');

// Mock data
const mockPrivateKey = 'cVQVgBr8GUpiLa3T9ZRWNfGWJhYR4zMSEJCPVSvEhQKEZQZPuTZF';
const mockAddress = 'bcrt1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
const mockUTXO = {
  txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  vout: 0,
  value: 100000000, // 1 BTC
  scriptPubKey: '0014d85c2b71d0060b09c9886aeb815e50991dda124d',
};

// Mock dependencies
jest.mock('bitcoinjs-lib', () => ({
  networks: {
    bitcoin: {},
    testnet: {},
    regtest: {},
  },
  Psbt: jest.fn().mockImplementation(() => ({
    addInput: jest.fn().mockReturnThis(),
    addOutput: jest.fn().mockReturnThis(),
    signInput: jest.fn().mockReturnThis(),
    validateSignaturesOfInput: jest.fn().mockReturnValue(true),
    finalizeAllInputs: jest.fn().mockReturnThis(),
    extractTransaction: jest.fn().mockReturnValue({
      toHex: jest.fn().mockReturnValue('mocktxhex'),
      getId: jest.fn().mockReturnValue('mocktxid'),
    }),
  })),
  Transaction: {
    fromHex: jest.fn().mockReturnValue({
      outs: [{ value: 50000000 }],
      ins: [{}],
      getId: jest.fn().mockReturnValue('mocktxid'),
    }),
  },
  address: {
    toOutputScript: jest.fn(),
    fromOutputScript: jest.fn().mockReturnValue(mockAddress),
  },
  script: {
    compile: jest.fn(),
  },
  crypto: {
    sha256: jest.fn().mockReturnValue(Buffer.from('mockhash')),
  },
}));

jest.mock('ecpair', () => ({
  ECPairFactory: jest.fn().mockReturnValue({
    fromWIF: jest.fn().mockReturnValue({
      publicKey: Buffer.from('mockpubkey'),
      privateKey: Buffer.from('mockprivkey'),
      sign: jest.fn().mockReturnValue(Buffer.from('mocksignature')),
    }),
  }),
}));

jest.mock('tiny-secp256k1', () => ({}));

describe('BitcoinTransactionUtils', () => {
  describe('createTransaction', () => {
    it('should create a transaction with the given inputs and outputs', () => {
      // Arrange
      const inputs = [
        {
          utxo: mockUTXO,
          privateKey: mockPrivateKey,
        },
      ];
      
      const outputs = [
        {
          address: mockAddress,
          value: 50000000, // 0.5 BTC
        },
      ];
      
      const options = {
        feeRate: 10,
        changeAddress: mockAddress,
      };
      
      // Act
      const txHex = BitcoinTransactionUtils.createTransaction(inputs, outputs, options);
      
      // Assert
      expect(txHex).toBe('mocktxhex');
    });
    
    it('should throw an error if no inputs are provided', () => {
      // Arrange
      const inputs = [];
      const outputs = [
        {
          address: mockAddress,
          value: 50000000,
        },
      ];
      
      // Act & Assert
      expect(() => {
        BitcoinTransactionUtils.createTransaction(inputs, outputs);
      }).toThrow('No inputs provided');
    });
    
    it('should throw an error if no outputs are provided', () => {
      // Arrange
      const inputs = [
        {
          utxo: mockUTXO,
          privateKey: mockPrivateKey,
        },
      ];
      const outputs = [];
      
      // Act & Assert
      expect(() => {
        BitcoinTransactionUtils.createTransaction(inputs, outputs);
      }).toThrow('No outputs provided');
    });
  });
  
  describe('signTransaction', () => {
    it('should sign a transaction with the given private key', () => {
      // Arrange
      const txHex = 'mocktxhex';
      
      // Act
      const signedTxHex = BitcoinTransactionUtils.signTransaction(txHex, mockPrivateKey);
      
      // Assert
      expect(signedTxHex).toBe('mocktxhex');
    });
  });
  
  describe('calculateFee', () => {
    it('should calculate the fee for a transaction', () => {
      // Arrange
      const txHex = 'mocktxhex';
      const feeRate = 10;
      
      // Act
      const fee = BitcoinTransactionUtils.calculateFee(txHex, feeRate);
      
      // Assert
      expect(fee).toBe(10); // Mock implementation returns 10
    });
  });
  
  describe('verifyTransaction', () => {
    it('should verify a transaction', () => {
      // Arrange
      const txHex = 'mocktxhex';
      
      // Act
      const isValid = BitcoinTransactionUtils.verifyTransaction(txHex);
      
      // Assert
      expect(isValid).toBe(true);
    });
  });
  
  describe('broadcastTransaction', () => {
    it('should broadcast a transaction', async () => {
      // Arrange
      const txHex = 'mocktxhex';
      
      // Mock the fetch function
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ txid: 'mocktxid' }),
      });
      
      // Act
      const txid = await BitcoinTransactionUtils.broadcastTransaction(txHex);
      
      // Assert
      expect(txid).toBe('mocktxid');
      expect(global.fetch).toHaveBeenCalled();
    });
    
    it('should throw an error if the broadcast fails', async () => {
      // Arrange
      const txHex = 'mocktxhex';
      
      // Mock the fetch function to fail
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue('Error broadcasting transaction'),
      });
      
      // Act & Assert
      await expect(BitcoinTransactionUtils.broadcastTransaction(txHex)).rejects.toThrow();
    });
  });
});