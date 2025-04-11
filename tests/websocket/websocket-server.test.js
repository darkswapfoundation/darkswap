const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { createWebSocketServer } = require('../../src/websocket');
const { createWebSocketHandlers } = require('../../src/websocket/handlers');
const { WebSocketEventType, WebSocketChannelType } = require('../../src/websocket');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');

describe('WebSocket Server', () => {
  let httpServer;
  let webSocketServer;
  let webSocketHandlers;
  let clientSocket;
  let port;
  
  beforeEach((done) => {
    // Create HTTP server
    httpServer = createServer();
    
    // Create WebSocket server
    webSocketServer = createWebSocketServer(httpServer);
    
    // Create WebSocket handlers
    webSocketHandlers = createWebSocketHandlers(webSocketServer);
    
    // Start HTTP server
    port = 3001 + Math.floor(Math.random() * 1000);
    httpServer.listen(port, () => {
      // Create client socket
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });
  
  afterEach(() => {
    // Close client socket
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    
    // Close HTTP server
    httpServer.close();
  });
  
  describe('Connection', () => {
    it('should connect to the WebSocket server', (done) => {
      expect(clientSocket.connected).to.be.true;
      done();
    });
    
    it('should disconnect from the WebSocket server', (done) => {
      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).to.be.false;
        done();
      });
      
      clientSocket.disconnect();
    });
  });
  
  describe('Authentication', () => {
    it('should authenticate with a valid token', (done) => {
      // Create a valid token
      const token = jwt.sign({ userId: '123' }, 'secret');
      
      // Listen for authentication success
      clientSocket.on(WebSocketEventType.AUTHENTICATION_SUCCESS, (data) => {
        expect(data).to.have.property('userId', '123');
        done();
      });
      
      // Authenticate
      clientSocket.emit(WebSocketEventType.AUTHENTICATE, { token });
    });
    
    it('should fail to authenticate with an invalid token', (done) => {
      // Create an invalid token
      const token = 'invalid-token';
      
      // Listen for authentication failure
      clientSocket.on(WebSocketEventType.AUTHENTICATION_FAILURE, (data) => {
        expect(data).to.have.property('error');
        done();
      });
      
      // Authenticate
      clientSocket.emit(WebSocketEventType.AUTHENTICATE, { token });
    });
  });
  
  describe('Subscription', () => {
    it('should subscribe to a public channel', (done) => {
      // Listen for subscription success
      clientSocket.on(WebSocketEventType.SUBSCRIPTION_SUCCESS, (data) => {
        expect(data).to.have.property('channel', WebSocketChannelType.TICKER);
        expect(data).to.have.property('params');
        expect(data.params).to.have.property('baseAsset', 'BTC');
        expect(data.params).to.have.property('quoteAsset', 'ETH');
        done();
      });
      
      // Subscribe to ticker channel
      clientSocket.emit(WebSocketEventType.SUBSCRIBE, {
        channel: WebSocketChannelType.TICKER,
        params: { baseAsset: 'BTC', quoteAsset: 'ETH' },
      });
    });
    
    it('should fail to subscribe to a private channel without authentication', (done) => {
      // Listen for subscription failure
      clientSocket.on(WebSocketEventType.SUBSCRIPTION_FAILURE, (data) => {
        expect(data).to.have.property('error');
        expect(data).to.have.property('channel', WebSocketChannelType.ORDERS);
        done();
      });
      
      // Subscribe to orders channel
      clientSocket.emit(WebSocketEventType.SUBSCRIBE, {
        channel: WebSocketChannelType.ORDERS,
      });
    });
    
    it('should subscribe to a private channel with authentication', (done) => {
      // Create a valid token
      const token = jwt.sign({ userId: '123' }, 'secret');
      
      // Listen for authentication success
      clientSocket.on(WebSocketEventType.AUTHENTICATION_SUCCESS, () => {
        // Subscribe to orders channel
        clientSocket.emit(WebSocketEventType.SUBSCRIBE, {
          channel: WebSocketChannelType.ORDERS,
        });
      });
      
      // Listen for subscription success
      clientSocket.on(WebSocketEventType.SUBSCRIPTION_SUCCESS, (data) => {
        expect(data).to.have.property('channel', WebSocketChannelType.ORDERS);
        done();
      });
      
      // Authenticate
      clientSocket.emit(WebSocketEventType.AUTHENTICATE, { token });
    });
    
    it('should unsubscribe from a channel', (done) => {
      // Subscribe to ticker channel
      clientSocket.emit(WebSocketEventType.SUBSCRIBE, {
        channel: WebSocketChannelType.TICKER,
        params: { baseAsset: 'BTC', quoteAsset: 'ETH' },
      });
      
      // Listen for subscription success
      clientSocket.on(WebSocketEventType.SUBSCRIPTION_SUCCESS, () => {
        // Unsubscribe from ticker channel
        clientSocket.emit(WebSocketEventType.UNSUBSCRIBE, {
          channel: WebSocketChannelType.TICKER,
          params: { baseAsset: 'BTC', quoteAsset: 'ETH' },
        });
        
        // Wait for a short time to ensure unsubscription
        setTimeout(() => {
          // Check if the client is still subscribed
          const client = Array.from(webSocketServer.clients.values()).find(
            (client) => client.id === clientSocket.id
          );
          
          expect(client.subscriptions).to.be.empty;
          done();
        }, 100);
      });
    });
  });
  
  describe('Publishing', () => {
    it('should receive orderbook updates', (done) => {
      // Subscribe to orderbook channel
      clientSocket.emit(WebSocketEventType.SUBSCRIBE, {
        channel: WebSocketChannelType.ORDERBOOK,
        params: { baseAsset: 'BTC', quoteAsset: 'ETH' },
      });
      
      // Listen for subscription success
      clientSocket.on(WebSocketEventType.SUBSCRIPTION_SUCCESS, () => {
        // Publish orderbook update
        webSocketServer.publish(
          WebSocketChannelType.ORDERBOOK,
          WebSocketEventType.ORDERBOOK_UPDATE,
          {
            baseAsset: 'BTC',
            quoteAsset: 'ETH',
            bids: [{ price: '10.0', amount: '1.0', total: '10.0' }],
            asks: [{ price: '11.0', amount: '1.0', total: '11.0' }],
            timestamp: new Date(),
          },
          { baseAsset: 'BTC', quoteAsset: 'ETH' }
        );
      });
      
      // Listen for orderbook update
      clientSocket.on(WebSocketEventType.ORDERBOOK_UPDATE, (data) => {
        expect(data).to.have.property('baseAsset', 'BTC');
        expect(data).to.have.property('quoteAsset', 'ETH');
        expect(data).to.have.property('bids');
        expect(data).to.have.property('asks');
        expect(data).to.have.property('timestamp');
        expect(data.bids).to.be.an('array');
        expect(data.asks).to.be.an('array');
        expect(data.bids[0]).to.have.property('price', '10.0');
        expect(data.bids[0]).to.have.property('amount', '1.0');
        expect(data.bids[0]).to.have.property('total', '10.0');
        expect(data.asks[0]).to.have.property('price', '11.0');
        expect(data.asks[0]).to.have.property('amount', '1.0');
        expect(data.asks[0]).to.have.property('total', '11.0');
        done();
      });
    });
    
    it('should receive ticker updates', (done) => {
      // Subscribe to ticker channel
      clientSocket.emit(WebSocketEventType.SUBSCRIBE, {
        channel: WebSocketChannelType.TICKER,
        params: { baseAsset: 'BTC', quoteAsset: 'ETH' },
      });
      
      // Listen for subscription success
      clientSocket.on(WebSocketEventType.SUBSCRIPTION_SUCCESS, () => {
        // Publish ticker update
        webSocketServer.publish(
          WebSocketChannelType.TICKER,
          WebSocketEventType.TICKER_UPDATE,
          {
            pair: 'BTC/ETH',
            last: '10.0',
            bid: '9.9',
            ask: '10.1',
            volume: '100.0',
            change24h: '5.0',
            timestamp: new Date(),
          },
          { baseAsset: 'BTC', quoteAsset: 'ETH' }
        );
      });
      
      // Listen for ticker update
      clientSocket.on(WebSocketEventType.TICKER_UPDATE, (data) => {
        expect(data).to.have.property('pair', 'BTC/ETH');
        expect(data).to.have.property('last', '10.0');
        expect(data).to.have.property('bid', '9.9');
        expect(data).to.have.property('ask', '10.1');
        expect(data).to.have.property('volume', '100.0');
        expect(data).to.have.property('change24h', '5.0');
        expect(data).to.have.property('timestamp');
        done();
      });
    });
    
    it('should receive trade updates', (done) => {
      // Subscribe to trades channel
      clientSocket.emit(WebSocketEventType.SUBSCRIBE, {
        channel: WebSocketChannelType.TRADES,
        params: { baseAsset: 'BTC', quoteAsset: 'ETH' },
      });
      
      // Listen for subscription success
      clientSocket.on(WebSocketEventType.SUBSCRIPTION_SUCCESS, () => {
        // Publish trade update
        webSocketServer.publish(
          WebSocketChannelType.TRADES,
          WebSocketEventType.TRADE_CREATED,
          {
            id: '123',
            baseAsset: 'BTC',
            quoteAsset: 'ETH',
            price: '10.0',
            amount: '1.0',
            type: 'buy',
            timestamp: new Date(),
          },
          { baseAsset: 'BTC', quoteAsset: 'ETH' }
        );
      });
      
      // Listen for trade update
      clientSocket.on(WebSocketEventType.TRADE_CREATED, (data) => {
        expect(data).to.have.property('id', '123');
        expect(data).to.have.property('baseAsset', 'BTC');
        expect(data).to.have.property('quoteAsset', 'ETH');
        expect(data).to.have.property('price', '10.0');
        expect(data).to.have.property('amount', '1.0');
        expect(data).to.have.property('type', 'buy');
        expect(data).to.have.property('timestamp');
        done();
      });
    });
    
    it('should receive user-specific updates', (done) => {
      // Create a valid token
      const token = jwt.sign({ userId: '123' }, 'secret');
      
      // Listen for authentication success
      clientSocket.on(WebSocketEventType.AUTHENTICATION_SUCCESS, () => {
        // Publish user-specific update
        webSocketServer.publishToUser('123', WebSocketEventType.BALANCE_UPDATE, {
          balance: {
            BTC: '1.0',
            ETH: '10.0',
          },
        });
      });
      
      // Listen for balance update
      clientSocket.on(WebSocketEventType.BALANCE_UPDATE, (data) => {
        expect(data).to.have.property('balance');
        expect(data.balance).to.have.property('BTC', '1.0');
        expect(data.balance).to.have.property('ETH', '10.0');
        done();
      });
      
      // Authenticate
      clientSocket.emit(WebSocketEventType.AUTHENTICATE, { token });
    });
  });
});