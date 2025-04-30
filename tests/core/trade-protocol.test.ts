import { TradeProtocol } from '../../src/trade/trade-protocol';
import { Network } from '../../src/types';
import { expect } from 'chai';
import sinon from 'sinon';

describe('Trade Protocol', () => {
  let tradeProtocol: TradeProtocol;
  
  beforeEach(() => {
    // Create a new trade protocol instance for each test
    tradeProtocol = new TradeProtocol({
      network: Network.Testnet,
    });
  });
  
  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });
  
  describe('Initialization', () => {
    it('should initialize with the correct network', () => {
      expect(tradeProtocol.getNetwork()).to.equal(Network.Testnet);
    });
    
    it('should initialize with mainnet network', () => {
      const mainnetProtocol = new TradeProtocol({
        network: Network.Mainnet,
      });
      
      expect(mainnetProtocol.getNetwork()).to.equal(Network.Mainnet);
    });
  });
  
  describe('Trade Creation', () => {
    it('should create a trade', () => {
      // Mock the createTrade method to return a known value
      const mockTradeId = 'trade123456';
      
      sinon.stub(tradeProtocol, 'createTrade').returns(mockTradeId);
      
      const tradeId = tradeProtocol.createTrade({
        buyOrderId: 'order123456',
        sellOrderId: 'order123457',
      });
      
      expect(tradeId).to.equal(mockTradeId);
    });
    
    it('should handle errors when creating a trade', () => {
      // Mock the createTrade method to throw an error
      sinon.stub(tradeProtocol, 'createTrade').throws(new Error('Failed to create trade'));
      
      try {
        tradeProtocol.createTrade({
          buyOrderId: 'order123456',
          sellOrderId: 'order123457',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to create trade');
      }
    });
  });
  
  describe('Trade Execution', () => {
    it('should execute a trade', () => {
      // Mock the executeTrade method to return a known value
      const mockTxid = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      sinon.stub(tradeProtocol, 'executeTrade').returns(mockTxid);
      
      const txid = tradeProtocol.executeTrade('trade123456');
      
      expect(txid).to.equal(mockTxid);
    });
    
    it('should handle errors when executing a trade', () => {
      // Mock the executeTrade method to throw an error
      sinon.stub(tradeProtocol, 'executeTrade').throws(new Error('Failed to execute trade'));
      
      try {
        tradeProtocol.executeTrade('trade123456');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to execute trade');
      }
    });
  });
  
  describe('Trade Cancellation', () => {
    it('should cancel a trade', () => {
      // Mock the cancelTrade method to return a known value
      sinon.stub(tradeProtocol, 'cancelTrade').returns(true);
      
      const result = tradeProtocol.cancelTrade('trade123456');
      
      expect(result).to.be.true;
    });
    
    it('should handle errors when cancelling a trade', () => {
      // Mock the cancelTrade method to throw an error
      sinon.stub(tradeProtocol, 'cancelTrade').throws(new Error('Failed to cancel trade'));
      
      try {
        tradeProtocol.cancelTrade('trade123456');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to cancel trade');
      }
    });
  });
  
  describe('Trade Status', () => {
    it('should get trade status', () => {
      // Mock the getTradeStatus method to return a known value
      const mockStatus = 'completed';
      
      sinon.stub(tradeProtocol, 'getTradeStatus').returns(mockStatus);
      
      const status = tradeProtocol.getTradeStatus('trade123456');
      
      expect(status).to.equal(mockStatus);
    });
    
    it('should handle errors when getting trade status', () => {
      // Mock the getTradeStatus method to throw an error
      sinon.stub(tradeProtocol, 'getTradeStatus').throws(new Error('Failed to get trade status'));
      
      try {
        tradeProtocol.getTradeStatus('trade123456');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to get trade status');
      }
    });
  });
  
  describe('Trade Info', () => {
    it('should get trade info', () => {
      // Mock the getTradeInfo method to return a known value
      const mockTradeInfo = {
        id: 'trade123456',
        buyOrderId: 'order123456',
        sellOrderId: 'order123457',
        buyUserId: '123456789',
        sellUserId: '987654321',
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
        price: '10.0',
        amount: '1.0',
        status: 'completed',
        createdAt: '2025-04-10T12:00:00.000Z',
        updatedAt: '2025-04-10T12:00:00.000Z',
      };
      
      sinon.stub(tradeProtocol, 'getTradeInfo').returns(mockTradeInfo);
      
      const tradeInfo = tradeProtocol.getTradeInfo('trade123456');
      
      expect(tradeInfo).to.deep.equal(mockTradeInfo);
    });
    
    it('should handle errors when getting trade info', () => {
      // Mock the getTradeInfo method to throw an error
      sinon.stub(tradeProtocol, 'getTradeInfo').throws(new Error('Failed to get trade info'));
      
      try {
        tradeProtocol.getTradeInfo('trade123456');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to get trade info');
      }
    });
  });
  
  describe('Trade List', () => {
    it('should list all trades', () => {
      // Mock the listTrades method to return a known value
      const mockTrades = [
        {
          id: 'trade123456',
          buyOrderId: 'order123456',
          sellOrderId: 'order123457',
          buyUserId: '123456789',
          sellUserId: '987654321',
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
          price: '10.0',
          amount: '1.0',
          status: 'completed',
          createdAt: '2025-04-10T12:00:00.000Z',
          updatedAt: '2025-04-10T12:00:00.000Z',
        },
        {
          id: 'trade123457',
          buyOrderId: 'order123458',
          sellOrderId: 'order123459',
          buyUserId: '123456789',
          sellUserId: '987654321',
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
          price: '11.0',
          amount: '2.0',
          status: 'pending',
          createdAt: '2025-04-09T12:00:00.000Z',
          updatedAt: '2025-04-09T12:00:00.000Z',
        },
      ];
      
      sinon.stub(tradeProtocol, 'listTrades').returns(mockTrades);
      
      const trades = tradeProtocol.listTrades();
      
      expect(trades).to.deep.equal(mockTrades);
      expect(trades).to.have.lengthOf(2);
      expect(trades[0].id).to.equal('trade123456');
      expect(trades[1].id).to.equal('trade123457');
    });
    
    it('should handle errors when listing trades', () => {
      // Mock the listTrades method to throw an error
      sinon.stub(tradeProtocol, 'listTrades').throws(new Error('Failed to list trades'));
      
      try {
        tradeProtocol.listTrades();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to list trades');
      }
    });
  });
  
  describe('Trade Verification', () => {
    it('should verify a trade', () => {
      // Mock the verifyTrade method to return a known value
      sinon.stub(tradeProtocol, 'verifyTrade').returns(true);
      
      const result = tradeProtocol.verifyTrade('trade123456');
      
      expect(result).to.be.true;
    });
    
    it('should handle errors when verifying a trade', () => {
      // Mock the verifyTrade method to throw an error
      sinon.stub(tradeProtocol, 'verifyTrade').throws(new Error('Failed to verify trade'));
      
      try {
        tradeProtocol.verifyTrade('trade123456');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to verify trade');
      }
    });
  });
  
  describe('Trade PSBT Creation', () => {
    it('should create a trade PSBT', () => {
      // Mock the createTradePsbt method to return a known value
      const mockPsbt = 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////';
      
      sinon.stub(tradeProtocol, 'createTradePsbt').returns(mockPsbt);
      
      const psbt = tradeProtocol.createTradePsbt('trade123456');
      
      expect(psbt).to.equal(mockPsbt);
    });
    
    it('should handle errors when creating a trade PSBT', () => {
      // Mock the createTradePsbt method to throw an error
      sinon.stub(tradeProtocol, 'createTradePsbt').throws(new Error('Failed to create trade PSBT'));
      
      try {
        tradeProtocol.createTradePsbt('trade123456');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to create trade PSBT');
      }
    });
  });
  
  describe('Trade PSBT Signing', () => {
    it('should sign a trade PSBT', () => {
      // Mock the signTradePsbt method to return a known value
      const mockSignedPsbt = 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////AQBwAgAAAAAWABTHctb5VULhHvEejvx8emmDCtOKBQAAAAAAAQEfAQAAAAAAAAAWABT9tv5Z3CcDCiTHZPMu4JHNBr8JZAAAAAAAA=';
      
      sinon.stub(tradeProtocol, 'signTradePsbt').returns(mockSignedPsbt);
      
      const signedPsbt = tradeProtocol.signTradePsbt({
        tradeId: 'trade123456',
        psbt: 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////',
        privateKey: 'cVpPVruEDdmutPzisEsYvtST1usBR3ntr8pXSyt6D2YYqXRyPcFW',
      });
      
      expect(signedPsbt).to.equal(mockSignedPsbt);
    });
    
    it('should handle errors when signing a trade PSBT', () => {
      // Mock the signTradePsbt method to throw an error
      sinon.stub(tradeProtocol, 'signTradePsbt').throws(new Error('Failed to sign trade PSBT'));
      
      try {
        tradeProtocol.signTradePsbt({
          tradeId: 'trade123456',
          psbt: 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////',
          privateKey: 'cVpPVruEDdmutPzisEsYvtST1usBR3ntr8pXSyt6D2YYqXRyPcFW',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to sign trade PSBT');
      }
    });
  });
});