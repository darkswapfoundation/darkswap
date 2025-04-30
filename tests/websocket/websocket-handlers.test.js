const { createServer } = require('http');
const { createWebSocketServer } = require('../../src/websocket');
const { createWebSocketHandlers } = require('../../src/websocket/handlers');
const { WebSocketEventType, WebSocketChannelType } = require('../../src/websocket');
const { expect } = require('chai');
const sinon = require('sinon');

describe('WebSocket Handlers', () => {
  let httpServer;
  let webSocketServer;
  let webSocketHandlers;
  
  beforeEach(() => {
    // Create HTTP server
    httpServer = createServer();
    
    // Create WebSocket server
    webSocketServer = createWebSocketServer(httpServer);
    
    // Create WebSocket handlers
    webSocketHandlers = createWebSocketHandlers(webSocketServer);
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('Orderbook Handler', () => {
    it('should publish orderbook update', async () => {
      // Stub the publish method
      const publishStub = sinon.stub(webSocketServer, 'publish');
      
      // Stub the db.orders.find method
      const findStub = sinon.stub();
      const sortStub = sinon.stub();
      const toArrayStub = sinon.stub();
      
      // Set up the stubs
      findStub.returns({ sort: sortStub });
      sortStub.returns({ toArray: toArrayStub });
      
      // Set up the return values
      toArrayStub.onFirstCall().resolves([
        { price: '10.0', amount: '1.0', total: '10.0' },
      ]);
      toArrayStub.onSecondCall().resolves([
        { price: '11.0', amount: '1.0', total: '11.0' },
      ]);
      
      // Replace the db.orders.find method
      const orderbookHandler = webSocketHandlers.getOrderbookHandler();
      orderbookHandler.db = {
        orders: {
          find: findStub,
        },
      };
      
      // Call the publishOrderbookUpdate method
      await orderbookHandler.publishOrderbookUpdate('BTC', 'ETH');
      
      // Check that the publish method was called with the correct arguments
      expect(publishStub.calledOnce).to.be.true;
      expect(publishStub.firstCall.args[0]).to.equal(WebSocketChannelType.ORDERBOOK);
      expect(publishStub.firstCall.args[1]).to.equal(WebSocketEventType.ORDERBOOK_UPDATE);
      expect(publishStub.firstCall.args[2]).to.have.property('baseAsset', 'BTC');
      expect(publishStub.firstCall.args[2]).to.have.property('quoteAsset', 'ETH');
      expect(publishStub.firstCall.args[2]).to.have.property('bids');
      expect(publishStub.firstCall.args[2]).to.have.property('asks');
      expect(publishStub.firstCall.args[2]).to.have.property('timestamp');
      expect(publishStub.firstCall.args[2].bids).to.be.an('array');
      expect(publishStub.firstCall.args[2].asks).to.be.an('array');
      expect(publishStub.firstCall.args[2].bids[0]).to.have.property('price', '10.0');
      expect(publishStub.firstCall.args[2].bids[0]).to.have.property('amount', '1.0');
      expect(publishStub.firstCall.args[2].bids[0]).to.have.property('total', '10.0');
      expect(publishStub.firstCall.args[2].asks[0]).to.have.property('price', '11.0');
      expect(publishStub.firstCall.args[2].asks[0]).to.have.property('amount', '1.0');
      expect(publishStub.firstCall.args[2].asks[0]).to.have.property('total', '11.0');
      expect(publishStub.firstCall.args[3]).to.deep.equal({ baseAsset: 'BTC', quoteAsset: 'ETH' });
    });
    
    it('should publish all orderbook updates', async () => {
      // Stub the publishOrderbookUpdate method
      const publishOrderbookUpdateStub = sinon.stub(webSocketHandlers.getOrderbookHandler(), 'publishOrderbookUpdate');
      
      // Stub the db.tradingPairs.find method
      const findStub = sinon.stub();
      const toArrayStub = sinon.stub();
      
      // Set up the stubs
      findStub.returns({ toArray: toArrayStub });
      
      // Set up the return values
      toArrayStub.resolves([
        { baseAsset: 'BTC', quoteAsset: 'ETH' },
        { baseAsset: 'BTC', quoteAsset: 'USDT' },
      ]);
      
      // Replace the db.tradingPairs.find method
      const orderbookHandler = webSocketHandlers.getOrderbookHandler();
      orderbookHandler.db = {
        tradingPairs: {
          find: findStub,
        },
      };
      
      // Call the publishAllOrderbookUpdates method
      await orderbookHandler.publishAllOrderbookUpdates();
      
      // Check that the publishOrderbookUpdate method was called with the correct arguments
      expect(publishOrderbookUpdateStub.calledTwice).to.be.true;
      expect(publishOrderbookUpdateStub.firstCall.args[0]).to.equal('BTC');
      expect(publishOrderbookUpdateStub.firstCall.args[1]).to.equal('ETH');
      expect(publishOrderbookUpdateStub.secondCall.args[0]).to.equal('BTC');
      expect(publishOrderbookUpdateStub.secondCall.args[1]).to.equal('USDT');
    });
  });
  
  describe('Trades Handler', () => {
    it('should handle new trade', () => {
      // Stub the publish method
      const publishStub = sinon.stub(webSocketServer, 'publish');
      
      // Stub the publishToUser method
      const publishToUserStub = sinon.stub(webSocketServer, 'publishToUser');
      
      // Create a trade
      const trade = {
        id: '123',
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
        price: '10.0',
        amount: '1.0',
        buyUserId: '456',
        sellUserId: '789',
      };
      
      // Call the handleNewTrade method
      webSocketHandlers.getTradesHandler().handleNewTrade(trade);
      
      // Check that the publish method was called with the correct arguments
      expect(publishStub.calledOnce).to.be.true;
      expect(publishStub.firstCall.args[0]).to.equal(WebSocketChannelType.TRADES);
      expect(publishStub.firstCall.args[1]).to.equal(WebSocketEventType.TRADE_CREATED);
      expect(publishStub.firstCall.args[2]).to.deep.equal(trade);
      expect(publishStub.firstCall.args[3]).to.deep.equal({ baseAsset: 'BTC', quoteAsset: 'ETH' });
      
      // Check that the publishToUser method was called with the correct arguments
      expect(publishToUserStub.calledTwice).to.be.true;
      expect(publishToUserStub.firstCall.args[0]).to.equal('456');
      expect(publishToUserStub.firstCall.args[1]).to.equal(WebSocketEventType.TRADE_CREATED);
      expect(publishToUserStub.firstCall.args[2]).to.deep.equal(trade);
      expect(publishToUserStub.secondCall.args[0]).to.equal('789');
      expect(publishToUserStub.secondCall.args[1]).to.equal(WebSocketEventType.TRADE_CREATED);
      expect(publishToUserStub.secondCall.args[2]).to.deep.equal(trade);
    });
    
    it('should publish recent trades', async () => {
      // Stub the publish method
      const publishStub = sinon.stub(webSocketServer, 'publish');
      
      // Stub the db.trades.find method
      const findStub = sinon.stub();
      const sortStub = sinon.stub();
      const limitStub = sinon.stub();
      const toArrayStub = sinon.stub();
      
      // Set up the stubs
      findStub.returns({ sort: sortStub });
      sortStub.returns({ limit: limitStub });
      limitStub.returns({ toArray: toArrayStub });
      
      // Set up the return values
      toArrayStub.resolves([
        {
          id: '123',
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
          price: '10.0',
          amount: '1.0',
          type: 'buy',
          status: 'completed',
          createdAt: new Date(),
        },
      ]);
      
      // Replace the db.trades.find method
      const tradesHandler = webSocketHandlers.getTradesHandler();
      tradesHandler.db = {
        trades: {
          find: findStub,
        },
      };
      
      // Call the publishRecentTrades method
      await tradesHandler.publishRecentTrades('BTC', 'ETH', 10);
      
      // Check that the publish method was called with the correct arguments
      expect(publishStub.calledOnce).to.be.true;
      expect(publishStub.firstCall.args[0]).to.equal(WebSocketChannelType.TRADES);
      expect(publishStub.firstCall.args[1]).to.equal(WebSocketEventType.TRADE_CREATED);
      expect(publishStub.firstCall.args[2]).to.have.property('trades');
      expect(publishStub.firstCall.args[2].trades).to.be.an('array');
      expect(publishStub.firstCall.args[2].trades.length).to.equal(1);
      expect(publishStub.firstCall.args[2].trades[0]).to.have.property('id', '123');
      expect(publishStub.firstCall.args[2].trades[0]).to.have.property('baseAsset', 'BTC');
      expect(publishStub.firstCall.args[2].trades[0]).to.have.property('quoteAsset', 'ETH');
      expect(publishStub.firstCall.args[2].trades[0]).to.have.property('price', '10.0');
      expect(publishStub.firstCall.args[2].trades[0]).to.have.property('amount', '1.0');
      expect(publishStub.firstCall.args[2].trades[0]).to.have.property('type', 'buy');
      expect(publishStub.firstCall.args[2].trades[0]).to.have.property('status', 'completed');
      expect(publishStub.firstCall.args[2].trades[0]).to.have.property('createdAt');
      expect(publishStub.firstCall.args[3]).to.deep.equal({ baseAsset: 'BTC', quoteAsset: 'ETH' });
    });
  });
  
  describe('Orders Handler', () => {
    it('should handle new order', () => {
      // Stub the publish method
      const publishStub = sinon.stub(webSocketServer, 'publish');
      
      // Stub the publishToUser method
      const publishToUserStub = sinon.stub(webSocketServer, 'publishToUser');
      
      // Create an order
      const order = {
        id: '123',
        userId: '456',
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
        price: '10.0',
        amount: '1.0',
        type: 'buy',
        status: 'open',
      };
      
      // Call the handleNewOrder method
      webSocketHandlers.getOrdersHandler().handleNewOrder(order);
      
      // Check that the publish method was called with the correct arguments
      expect(publishStub.calledOnce).to.be.true;
      expect(publishStub.firstCall.args[0]).to.equal(WebSocketChannelType.ORDERBOOK);
      expect(publishStub.firstCall.args[1]).to.equal(WebSocketEventType.ORDER_CREATED);
      expect(publishStub.firstCall.args[2]).to.deep.equal(order);
      expect(publishStub.firstCall.args[3]).to.deep.equal({ baseAsset: 'BTC', quoteAsset: 'ETH' });
      
      // Check that the publishToUser method was called with the correct arguments
      expect(publishToUserStub.calledOnce).to.be.true;
      expect(publishToUserStub.firstCall.args[0]).to.equal('456');
      expect(publishToUserStub.firstCall.args[1]).to.equal(WebSocketEventType.ORDER_CREATED);
      expect(publishToUserStub.firstCall.args[2]).to.deep.equal(order);
    });
  });
  
  describe('Wallet Handler', () => {
    it('should handle balance update', () => {
      // Stub the publishToUser method
      const publishToUserStub = sinon.stub(webSocketServer, 'publishToUser');
      
      // Create a balance
      const balance = {
        BTC: '1.0',
        ETH: '10.0',
      };
      
      // Call the handleBalanceUpdate method
      webSocketHandlers.getWalletHandler().handleBalanceUpdate('123', balance);
      
      // Check that the publishToUser method was called with the correct arguments
      expect(publishToUserStub.calledOnce).to.be.true;
      expect(publishToUserStub.firstCall.args[0]).to.equal('123');
      expect(publishToUserStub.firstCall.args[1]).to.equal(WebSocketEventType.BALANCE_UPDATE);
      expect(publishToUserStub.firstCall.args[2]).to.have.property('balance');
      expect(publishToUserStub.firstCall.args[2].balance).to.deep.equal(balance);
    });
  });
  
  describe('Ticker Handler', () => {
    it('should publish ticker data', async () => {
      // Stub the publish method
      const publishStub = sinon.stub(webSocketServer, 'publish');
      
      // Stub the db methods
      const findStub = sinon.stub();
      const sortStub = sinon.stub();
      const limitStub = sinon.stub();
      const toArrayStub = sinon.stub();
      
      // Set up the stubs
      findStub.returns({ sort: sortStub });
      sortStub.returns({ limit: limitStub });
      limitStub.returns({ toArray: toArrayStub });
      
      // Set up the return values
      toArrayStub.onFirstCall().resolves([
        { price: '10.0', amount: '1.0', createdAt: new Date() },
      ]);
      toArrayStub.onSecondCall().resolves([
        { price: '9.9', amount: '1.0' },
      ]);
      toArrayStub.onThirdCall().resolves([
        { price: '10.1', amount: '1.0' },
      ]);
      toArrayStub.onCall(3).resolves([
        { price: '10.0', amount: '1.0' },
        { price: '10.0', amount: '1.0' },
      ]);
      
      // Replace the db methods
      const tickerHandler = webSocketHandlers.getTickerHandler();
      tickerHandler.db = {
        trades: {
          find: findStub,
        },
        orders: {
          find: findStub,
        },
      };
      
      // Call the publishTickerData method
      await tickerHandler.publishTickerData('BTC', 'ETH');
      
      // Check that the publish method was called with the correct arguments
      expect(publishStub.calledOnce).to.be.true;
      expect(publishStub.firstCall.args[0]).to.equal(WebSocketChannelType.TICKER);
      expect(publishStub.firstCall.args[1]).to.equal(WebSocketEventType.TICKER_UPDATE);
      expect(publishStub.firstCall.args[2]).to.have.property('pair', 'BTC/ETH');
      expect(publishStub.firstCall.args[2]).to.have.property('last', '10.0');
      expect(publishStub.firstCall.args[2]).to.have.property('bid', '9.9');
      expect(publishStub.firstCall.args[2]).to.have.property('ask', '10.1');
      expect(publishStub.firstCall.args[2]).to.have.property('volume');
      expect(publishStub.firstCall.args[2]).to.have.property('change24h');
      expect(publishStub.firstCall.args[2]).to.have.property('timestamp');
      expect(publishStub.firstCall.args[3]).to.deep.equal({ baseAsset: 'BTC', quoteAsset: 'ETH' });
    });
  });
  
  describe('P2P Handler', () => {
    it('should handle peer connection', () => {
      // Stub the publish method
      const publishStub = sinon.stub(webSocketServer, 'publish');
      
      // Create a peer
      const peer = {
        id: '123',
        ip: '192.168.1.1',
        port: 8333,
        version: '1.0.0',
        userAgent: 'DarkSwap/1.0.0',
      };
      
      // Call the handlePeerConnection method
      webSocketHandlers.getP2PHandler().handlePeerConnection(peer);
      
      // Check that the publish method was called with the correct arguments
      expect(publishStub.calledOnce).to.be.true;
      expect(publishStub.firstCall.args[0]).to.equal(WebSocketChannelType.P2P);
      expect(publishStub.firstCall.args[1]).to.equal(WebSocketEventType.PEER_CONNECTED);
      expect(publishStub.firstCall.args[2]).to.deep.equal(peer);
      
      // Check that the peer was added to the P2P network
      const p2pNetwork = webSocketHandlers.getP2PHandler().getP2PNetwork();
      expect(p2pNetwork.peers.has('123')).to.be.true;
      expect(p2pNetwork.peers.get('123')).to.have.property('id', '123');
      expect(p2pNetwork.peers.get('123')).to.have.property('ip', '192.168.1.1');
      expect(p2pNetwork.peers.get('123')).to.have.property('port', 8333);
      expect(p2pNetwork.peers.get('123')).to.have.property('version', '1.0.0');
      expect(p2pNetwork.peers.get('123')).to.have.property('userAgent', 'DarkSwap/1.0.0');
      expect(p2pNetwork.peers.get('123')).to.have.property('connected', true);
      expect(p2pNetwork.peers.get('123')).to.have.property('lastSeen');
    });
  });
});