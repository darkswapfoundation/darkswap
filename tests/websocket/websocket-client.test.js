const { createServer } = require('http');
const { Server } = require('socket.io');
const { WebSocketClient } = require('../../web/src/utils/WebSocketClient');
const { WebSocketEventType, WebSocketChannelType } = require('../../src/websocket');
const { expect } = require('chai');

describe('WebSocket Client', () => {
  let httpServer;
  let ioServer;
  let webSocketClient;
  let port;
  
  beforeEach((done) => {
    // Create HTTP server
    httpServer = createServer();
    
    // Create Socket.IO server
    ioServer = new Server(httpServer);
    
    // Start HTTP server
    port = 3001 + Math.floor(Math.random() * 1000);
    httpServer.listen(port, () => {
      // Create WebSocket client
      webSocketClient = new WebSocketClient({
        url: `http://localhost:${port}`,
        autoConnect: true,
      });
      
      // Wait for connection
      webSocketClient.on('connect', done);
    });
  });
  
  afterEach(() => {
    // Disconnect WebSocket client
    if (webSocketClient && webSocketClient.isConnected()) {
      webSocketClient.disconnect();
    }
    
    // Close HTTP server
    if (httpServer) {
      httpServer.close();
    }
  });
  
  describe('Connection', () => {
    it('should connect to the WebSocket server', () => {
      expect(webSocketClient.isConnected()).to.be.true;
    });
    
    it('should disconnect from the WebSocket server', (done) => {
      webSocketClient.on('disconnect', () => {
        expect(webSocketClient.isConnected()).to.be.false;
        done();
      });
      
      webSocketClient.disconnect();
    });
    
    it('should reconnect to the WebSocket server', (done) => {
      // Disconnect WebSocket client
      webSocketClient.disconnect();
      
      // Wait for disconnection
      webSocketClient.on('disconnect', () => {
        // Reconnect WebSocket client
        webSocketClient.connect();
        
        // Wait for reconnection
        webSocketClient.on('connect', () => {
          expect(webSocketClient.isConnected()).to.be.true;
          done();
        });
      });
    });
  });
  
  describe('Authentication', () => {
    it('should authenticate with the WebSocket server', (done) => {
      // Set up authentication handler on server
      ioServer.on('connection', (socket) => {
        socket.on(WebSocketEventType.AUTHENTICATE, (data) => {
          expect(data).to.have.property('token', 'test-token');
          socket.emit(WebSocketEventType.AUTHENTICATION_SUCCESS, { userId: '123' });
        });
      });
      
      // Listen for authentication success
      webSocketClient.on('authentication_success', (data) => {
        expect(data).to.have.property('userId', '123');
        expect(webSocketClient.isAuthenticated()).to.be.true;
        done();
      });
      
      // Authenticate
      webSocketClient.authenticate('test-token');
    });
    
    it('should handle authentication failure', (done) => {
      // Set up authentication handler on server
      ioServer.on('connection', (socket) => {
        socket.on(WebSocketEventType.AUTHENTICATE, (data) => {
          expect(data).to.have.property('token', 'invalid-token');
          socket.emit(WebSocketEventType.AUTHENTICATION_FAILURE, { error: 'Invalid token' });
        });
      });
      
      // Listen for authentication failure
      webSocketClient.on('authentication_failure', (data) => {
        expect(data).to.have.property('error', 'Invalid token');
        expect(webSocketClient.isAuthenticated()).to.be.false;
        done();
      });
      
      // Authenticate
      webSocketClient.authenticate('invalid-token');
    });
  });
  
  describe('Subscription', () => {
    it('should subscribe to a channel', (done) => {
      // Set up subscription handler on server
      ioServer.on('connection', (socket) => {
        socket.on(WebSocketEventType.SUBSCRIBE, (data) => {
          expect(data).to.have.property('channel', WebSocketChannelType.TICKER);
          expect(data).to.have.property('params');
          expect(data.params).to.have.property('baseAsset', 'BTC');
          expect(data.params).to.have.property('quoteAsset', 'ETH');
          socket.emit(WebSocketEventType.SUBSCRIPTION_SUCCESS, data);
        });
      });
      
      // Listen for subscription success
      webSocketClient.on('subscription_success', (data) => {
        expect(data).to.have.property('channel', WebSocketChannelType.TICKER);
        expect(data).to.have.property('params');
        expect(data.params).to.have.property('baseAsset', 'BTC');
        expect(data.params).to.have.property('quoteAsset', 'ETH');
        done();
      });
      
      // Subscribe to ticker channel
      webSocketClient.subscribe(WebSocketChannelType.TICKER, {
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
      });
    });
    
    it('should handle subscription failure', (done) => {
      // Set up subscription handler on server
      ioServer.on('connection', (socket) => {
        socket.on(WebSocketEventType.SUBSCRIBE, (data) => {
          expect(data).to.have.property('channel', WebSocketChannelType.ORDERS);
          socket.emit(WebSocketEventType.SUBSCRIPTION_FAILURE, {
            error: 'Authentication required',
            channel: WebSocketChannelType.ORDERS,
          });
        });
      });
      
      // Listen for subscription failure
      webSocketClient.on('subscription_failure', (data) => {
        expect(data).to.have.property('error', 'Authentication required');
        expect(data).to.have.property('channel', WebSocketChannelType.ORDERS);
        done();
      });
      
      // Subscribe to orders channel
      webSocketClient.subscribe(WebSocketChannelType.ORDERS);
    });
    
    it('should unsubscribe from a channel', (done) => {
      // Set up subscription handler on server
      ioServer.on('connection', (socket) => {
        socket.on(WebSocketEventType.SUBSCRIBE, (data) => {
          socket.emit(WebSocketEventType.SUBSCRIPTION_SUCCESS, data);
        });
        
        socket.on(WebSocketEventType.UNSUBSCRIBE, (data) => {
          expect(data).to.have.property('channel', WebSocketChannelType.TICKER);
          expect(data).to.have.property('params');
          expect(data.params).to.have.property('baseAsset', 'BTC');
          expect(data.params).to.have.property('quoteAsset', 'ETH');
          done();
        });
      });
      
      // Listen for subscription success
      webSocketClient.on('subscription_success', () => {
        // Unsubscribe from ticker channel
        webSocketClient.unsubscribe(WebSocketChannelType.TICKER, {
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
        });
      });
      
      // Subscribe to ticker channel
      webSocketClient.subscribe(WebSocketChannelType.TICKER, {
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
      });
    });
    
    it('should resubscribe to channels on reconnection', (done) => {
      let subscriptionCount = 0;
      
      // Set up subscription handler on server
      ioServer.on('connection', (socket) => {
        socket.on(WebSocketEventType.SUBSCRIBE, (data) => {
          expect(data).to.have.property('channel', WebSocketChannelType.TICKER);
          expect(data).to.have.property('params');
          expect(data.params).to.have.property('baseAsset', 'BTC');
          expect(data.params).to.have.property('quoteAsset', 'ETH');
          socket.emit(WebSocketEventType.SUBSCRIPTION_SUCCESS, data);
          
          subscriptionCount++;
          
          if (subscriptionCount === 2) {
            done();
          }
        });
      });
      
      // Listen for subscription success
      webSocketClient.on('subscription_success', () => {
        if (subscriptionCount === 1) {
          // Disconnect WebSocket client
          webSocketClient.disconnect();
          
          // Wait for disconnection
          webSocketClient.on('disconnect', () => {
            // Reconnect WebSocket client
            webSocketClient.connect();
          });
        }
      });
      
      // Subscribe to ticker channel
      webSocketClient.subscribe(WebSocketChannelType.TICKER, {
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
      });
    });
  });
  
  describe('Events', () => {
    it('should receive events from the WebSocket server', (done) => {
      // Set up event handler on server
      ioServer.on('connection', (socket) => {
        // Emit ticker update
        socket.emit(WebSocketEventType.TICKER_UPDATE, {
          pair: 'BTC/ETH',
          last: '10.0',
          bid: '9.9',
          ask: '10.1',
          volume: '100.0',
          change24h: '5.0',
          timestamp: new Date(),
        });
      });
      
      // Listen for ticker update
      webSocketClient.on('ticker_update', (data) => {
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
    
    it('should handle multiple event handlers', (done) => {
      let handlerCount = 0;
      
      // Set up event handler on server
      ioServer.on('connection', (socket) => {
        // Emit ticker update
        socket.emit(WebSocketEventType.TICKER_UPDATE, {
          pair: 'BTC/ETH',
          last: '10.0',
          bid: '9.9',
          ask: '10.1',
          volume: '100.0',
          change24h: '5.0',
          timestamp: new Date(),
        });
      });
      
      // Add first event handler
      webSocketClient.on('ticker_update', () => {
        handlerCount++;
        if (handlerCount === 2) {
          done();
        }
      });
      
      // Add second event handler
      webSocketClient.on('ticker_update', () => {
        handlerCount++;
        if (handlerCount === 2) {
          done();
        }
      });
    });
    
    it('should remove event handlers', (done) => {
      let handlerCount = 0;
      
      // Set up event handler on server
      ioServer.on('connection', (socket) => {
        // Emit ticker update
        socket.emit(WebSocketEventType.TICKER_UPDATE, {
          pair: 'BTC/ETH',
          last: '10.0',
          bid: '9.9',
          ask: '10.1',
          volume: '100.0',
          change24h: '5.0',
          timestamp: new Date(),
        });
      });
      
      // Create event handler
      const handler = () => {
        handlerCount++;
      };
      
      // Add event handler
      webSocketClient.on('ticker_update', handler);
      
      // Remove event handler
      webSocketClient.off('ticker_update', handler);
      
      // Add another event handler
      webSocketClient.on('ticker_update', () => {
        expect(handlerCount).to.equal(0);
        done();
      });
    });
  });
});