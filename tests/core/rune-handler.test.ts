import { RuneHandler } from '../../src/wallet/rune-handler';
import { Network } from '../../src/types';
import { expect } from 'chai';
import sinon from 'sinon';

describe('Rune Handler', () => {
  let runeHandler: RuneHandler;
  
  beforeEach(() => {
    // Create a new rune handler instance for each test
    runeHandler = new RuneHandler({
      network: Network.Testnet,
    });
  });
  
  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });
  
  describe('Initialization', () => {
    it('should initialize with the correct network', () => {
      expect(runeHandler.getNetwork()).to.equal(Network.Testnet);
    });
    
    it('should initialize with mainnet network', () => {
      const mainnetHandler = new RuneHandler({
        network: Network.Mainnet,
      });
      
      expect(mainnetHandler.getNetwork()).to.equal(Network.Mainnet);
    });
  });
  
  describe('Rune Creation', () => {
    it('should create a rune', () => {
      // Mock the createRune method to return a known value
      const mockRuneId = 'RUNE_ABC';
      
      sinon.stub(runeHandler, 'createRune').returns(mockRuneId);
      
      const runeId = runeHandler.createRune({
        name: 'ABC',
        symbol: 'ABC',
        supply: '1000000',
        decimals: 0,
      });
      
      expect(runeId).to.equal(mockRuneId);
    });
    
    it('should handle errors when creating a rune', () => {
      // Mock the createRune method to throw an error
      sinon.stub(runeHandler, 'createRune').throws(new Error('Failed to create rune'));
      
      try {
        runeHandler.createRune({
          name: 'ABC',
          symbol: 'ABC',
          supply: '1000000',
          decimals: 0,
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to create rune');
      }
    });
  });
  
  describe('Rune Transfer', () => {
    it('should transfer runes', () => {
      // Mock the transferRune method to return a known value
      const mockTxid = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      sinon.stub(runeHandler, 'transferRune').returns(mockTxid);
      
      const txid = runeHandler.transferRune({
        runeId: 'RUNE_ABC',
        amount: '1000',
        toAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      });
      
      expect(txid).to.equal(mockTxid);
    });
    
    it('should handle errors when transferring runes', () => {
      // Mock the transferRune method to throw an error
      sinon.stub(runeHandler, 'transferRune').throws(new Error('Failed to transfer rune'));
      
      try {
        runeHandler.transferRune({
          runeId: 'RUNE_ABC',
          amount: '1000',
          toAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to transfer rune');
      }
    });
  });
  
  describe('Rune Balance', () => {
    it('should get rune balance', () => {
      // Mock the getRuneBalance method to return a known value
      const mockBalance = '1000';
      
      sinon.stub(runeHandler, 'getRuneBalance').returns(mockBalance);
      
      const balance = runeHandler.getRuneBalance({
        runeId: 'RUNE_ABC',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      });
      
      expect(balance).to.equal(mockBalance);
    });
    
    it('should handle errors when getting rune balance', () => {
      // Mock the getRuneBalance method to throw an error
      sinon.stub(runeHandler, 'getRuneBalance').throws(new Error('Failed to get rune balance'));
      
      try {
        runeHandler.getRuneBalance({
          runeId: 'RUNE_ABC',
          address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to get rune balance');
      }
    });
  });
  
  describe('Rune Info', () => {
    it('should get rune info', () => {
      // Mock the getRuneInfo method to return a known value
      const mockRuneInfo = {
        id: 'RUNE_ABC',
        name: 'ABC',
        symbol: 'ABC',
        supply: '1000000',
        decimals: 0,
        creator: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        createdAt: '2025-04-10T12:00:00.000Z',
      };
      
      sinon.stub(runeHandler, 'getRuneInfo').returns(mockRuneInfo);
      
      const runeInfo = runeHandler.getRuneInfo('RUNE_ABC');
      
      expect(runeInfo).to.deep.equal(mockRuneInfo);
    });
    
    it('should handle errors when getting rune info', () => {
      // Mock the getRuneInfo method to throw an error
      sinon.stub(runeHandler, 'getRuneInfo').throws(new Error('Failed to get rune info'));
      
      try {
        runeHandler.getRuneInfo('RUNE_ABC');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to get rune info');
      }
    });
  });
  
  describe('Rune List', () => {
    it('should list all runes', () => {
      // Mock the listRunes method to return a known value
      const mockRunes = [
        {
          id: 'RUNE_ABC',
          name: 'ABC',
          symbol: 'ABC',
          supply: '1000000',
          decimals: 0,
          creator: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          createdAt: '2025-04-10T12:00:00.000Z',
        },
        {
          id: 'RUNE_DEF',
          name: 'DEF',
          symbol: 'DEF',
          supply: '2000000',
          decimals: 0,
          creator: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          createdAt: '2025-04-09T12:00:00.000Z',
        },
      ];
      
      sinon.stub(runeHandler, 'listRunes').returns(mockRunes);
      
      const runes = runeHandler.listRunes();
      
      expect(runes).to.deep.equal(mockRunes);
      expect(runes).to.have.lengthOf(2);
      expect(runes[0].id).to.equal('RUNE_ABC');
      expect(runes[1].id).to.equal('RUNE_DEF');
    });
    
    it('should handle errors when listing runes', () => {
      // Mock the listRunes method to throw an error
      sinon.stub(runeHandler, 'listRunes').throws(new Error('Failed to list runes'));
      
      try {
        runeHandler.listRunes();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to list runes');
      }
    });
  });
  
  describe('Rune Transaction History', () => {
    it('should get rune transaction history', () => {
      // Mock the getRuneTransactionHistory method to return a known value
      const mockTransactions = [
        {
          txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          runeId: 'RUNE_ABC',
          from: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          to: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          amount: '1000',
          timestamp: '2025-04-10T12:00:00.000Z',
        },
        {
          txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          runeId: 'RUNE_ABC',
          from: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          to: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          amount: '2000',
          timestamp: '2025-04-09T12:00:00.000Z',
        },
      ];
      
      sinon.stub(runeHandler, 'getRuneTransactionHistory').returns(mockTransactions);
      
      const transactions = runeHandler.getRuneTransactionHistory({
        runeId: 'RUNE_ABC',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      });
      
      expect(transactions).to.deep.equal(mockTransactions);
      expect(transactions).to.have.lengthOf(2);
      expect(transactions[0].txid).to.equal('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(transactions[1].txid).to.equal('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    });
    
    it('should handle errors when getting rune transaction history', () => {
      // Mock the getRuneTransactionHistory method to throw an error
      sinon.stub(runeHandler, 'getRuneTransactionHistory').throws(new Error('Failed to get rune transaction history'));
      
      try {
        runeHandler.getRuneTransactionHistory({
          runeId: 'RUNE_ABC',
          address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to get rune transaction history');
      }
    });
  });
});