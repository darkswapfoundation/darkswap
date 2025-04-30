import { WebSocketClient } from '../../src/utils/WebSocketClient';
import { WebSocketEventType, WebSocketChannelType } from '../../src/websocket';
import { expect } from 'chai';
import sinon from 'sinon';
import io from 'socket.io-client';

describe('WebSocket Client Integration Tests', () => {
  let webSocketClient: WebSocketClient;
  let socketStub: sinon.SinonStubbedInstance<SocketIOClient.Socket>;
  
  beforeEach(() => {
    // Stub socket.io-client to prevent actual WebSocket connections
    socketStub = sinon.stub(io as any);
    
    // Create a new WebSocket client instance for each test
    webSocketClient = new WebSocketClient({
      url: 'wss://api.darkswap.io/ws',
      autoConnect: false,
    });
  });
  
  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });
  
  describe('Initialization', () => {
    it('should initialize with the correct URL', () => {
      expect(webSocketClient.getUrl()).to.equal('wss://api.darkswap.io/ws');
    });
    
    it('should initialize with autoConnect option', () => {
      const clientWithAutoConnect = new WebSocketClient({
        url: 'wss://api.darkswap.io/ws',
        autoConnect: true,
      });
      
      expect(clientWithAutoConnect.getOptions().autoConnect).to.be.true;
    });
    
    it('should initialize with reconnect option', () => {
      const clientWithReconnect = new WebSocketClient({
        url: 'wss://api.darkswap.io/ws',
        reconnect: true,
        reconnectInterval: 1000,
        maxReconnectAttempts: 5,
      });
      
      expect(clientWithReconnect.getOptions().reconnect).to.be.true;
      expect(clientWithReconnect.getOptions().reconnectInterval).to.equal(1000);
      expect(clientWithReconnect.getOptions().maxReconnectAttempts).to.equal(5);
    });
  });
  
  describe('Connection', () => {
    it('should connect to the WebSocket server', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      
      expect(io.calledOnce).to.be.true;
      expect(io.firstCall.args[0]).to.equal('wss://api.darkswap.io/ws');
      expect(webSocketClient.isConnected()).to.be.true;
    });
    
    it('should disconnect from the WebSocket server', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      webSocketClient.disconnect();
      
      expect(mockSocket.disconnect.calledOnce).to.be.true;
    });
    
    it('should handle connection events', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      
      // Check that event handlers were registered
      expect(mockSocket.on.calledWith('connect')).to.be.true;
      expect(mockSocket.on.calledWith('disconnect')).to.be.true;
      expect(mockSocket.on.calledWith('error')).to.be.true;
      expect(mockSocket.on.calledWith('reconnect')).to.be.true;
      expect(mockSocket.on.calledWith('reconnect_attempt')).to.be.true;
      expect(mockSocket.on.calledWith('reconnect_error')).to.be.true;
      expect(mockSocket.on.calledWith('reconnect_failed')).to.be.true;
    });
  });
  
  describe('Authentication', () => {
    it('should authenticate with the WebSocket server', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      webSocketClient.authenticate('test-token');
      
      expect(mockSocket.emit.calledWith(WebSocketEventType.AUTHENTICATE)).to.be.true;
      expect(mockSocket.emit.firstCall.args[1]).to.deep.equal({ token: 'test-token' });
    });
    
    it('should handle authentication success', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      
      // Find the authentication success handler
      const authSuccessHandler = mockSocket.on.args.find(
        (args) => args[0] === WebSocketEventType.AUTHENTICATION_SUCCESS
      )[1];
      
      // Call the handler
      authSuccessHandler({ userId: '123456789' });
      
      expect(webSocketClient.isAuthenticated()).to.be.true;
    });
    
    it('should handle authentication failure', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      
      // Find the authentication failure handler
      const authFailureHandler = mockSocket.on.args.find(
        (args) => args[0] === WebSocketEventType.AUTHENTICATION_FAILURE
      )[1];
      
      // Call the handler
      authFailureHandler({ error: 'Invalid token' });
      
      expect(webSocketClient.isAuthenticated()).to.be.false;
    });
  });
  
  describe('Subscription', () => {
    it('should subscribe to a channel', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      webSocketClient.subscribe(WebSocketChannelType.TICKER, {
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
      });
      
      expect(mockSocket.emit.calledWith(WebSocketEventType.SUBSCRIBE)).to.be.true;
      expect(mockSocket.emit.firstCall.args[1]).to.deep.equal({
        channel: WebSocketChannelType.TICKER,
        params: {
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
        },
      });
    });
    
    it('should unsubscribe from a channel', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      webSocketClient.unsubscribe(WebSocketChannelType.TICKER, {
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
      });
      
      expect(mockSocket.emit.calledWith(WebSocketEventType.UNSUBSCRIBE)).to.be.true;
      expect(mockSocket.emit.firstCall.args[1]).to.deep.equal({
        channel: WebSocketChannelType.TICKER,
        params: {
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
        },
      });
    });
    
    it('should handle subscription success', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      
      // Find the subscription success handler
      const subscriptionSuccessHandler = mockSocket.on.args.find(
        (args) => args[0] === WebSocketEventType.SUBSCRIPTION_SUCCESS
      )[1];
      
      // Call the handler
      subscriptionSuccessHandler({
        channel: WebSocketChannelType.TICKER,
        params: {
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
        },
      });
      
      expect(webSocketClient.getSubscriptions()).to.deep.include({
        channel: WebSocketChannelType.TICKER,
        params: {
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
        },
      });
    });
    
    it('should handle subscription failure', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      
      // Find the subscription failure handler
      const subscriptionFailureHandler = mockSocket.on.args.find(
        (args) => args[0] === WebSocketEventType.SUBSCRIPTION_FAILURE
      )[1];
      
      // Call the handler
      subscriptionFailureHandler({
        error: 'Authentication required',
        channel: WebSocketChannelType.ORDERS,
      });
      
      expect(webSocketClient.getSubscriptions()).to.not.deep.include({
        channel: WebSocketChannelType.ORDERS,
      });
    });
  });
  
  describe('Event Handling', () => {
    it('should register event handlers', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      
      const handler = sinon.spy();
      webSocketClient.on('ticker_update', handler);
      
      // Find the ticker update handler
      const tickerUpdateHandler = mockSocket.on.args.find(
        (args) => args[0] === WebSocketEventType.TICKER_UPDATE
      )[1];
      
      // Call the handler
      tickerUpdateHandler({
        pair: 'BTC/ETH',
        last: '10.0',
        bid: '9.9',
        ask: '10.1',
        volume: '100.0',
        change24h: '5.0',
        timestamp: new Date(),
      });
      
      expect(handler.calledOnce).to.be.true;
      expect(handler.firstCall.args[0]).to.have.property('pair', 'BTC/ETH');
    });
    
    it('should unregister event handlers', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      
      const handler = sinon.spy();
      webSocketClient.on('ticker_update', handler);
      webSocketClient.off('ticker_update', handler);
      
      expect(mockSocket.off.calledWith(WebSocketEventType.TICKER_UPDATE)).to.be.true;
    });
    
    it('should handle multiple event handlers', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      webSocketClient.connect();
      
      const handler1 = sinon.spy();
      const handler2 = sinon.spy();
      webSocketClient.on('ticker_update', handler1);
      webSocketClient.on('ticker_update', handler2);
      
      // Find the ticker update handler
      const tickerUpdateHandler = mockSocket.on.args.find(
        (args) => args[0] === WebSocketEventType.TICKER_UPDATE
      )[1];
      
      // Call the handler
      tickerUpdateHandler({
        pair: 'BTC/ETH',
        last: '10.0',
        bid: '9.9',
        ask: '10.1',
        volume: '100.0',
        change24h: '5.0',
        timestamp: new Date(),
      });
      
      expect(handler1.calledOnce).to.be.true;
      expect(handler2.calledOnce).to.be.true;
    });
  });
  
  describe('Reconnection', () => {
    it('should attempt to reconnect on disconnection', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      const clientWithReconnect = new WebSocketClient({
        url: 'wss://api.darkswap.io/ws',
        reconnect: true,
        reconnectInterval: 1000,
        maxReconnectAttempts: 5,
      });
      
      clientWithReconnect.connect();
      
      // Find the disconnect handler
      const disconnectHandler = mockSocket.on.args.find(
        (args) => args[0] === 'disconnect'
      )[1];
      
      // Reset the stub to check if connect is called again
      (io as any).reset();
      
      // Call the disconnect handler
      disconnectHandler();
      
      // Wait for reconnect attempt
      const clock = sinon.useFakeTimers();
      clock.tick(1000);
      
      expect(io.calledOnce).to.be.true;
      expect(io.firstCall.args[0]).to.equal('wss://api.darkswap.io/ws');
      
      clock.restore();
    });
    
    it('should resubscribe to channels on reconnection', () => {
      // Mock the socket.io-client connect method
      const mockSocket = {
        on: sinon.stub(),
        emit: sinon.stub(),
        off: sinon.stub(),
        disconnect: sinon.stub(),
        connected: true,
      };
      
      (io as any).returns(mockSocket);
      
      const clientWithReconnect = new WebSocketClient({
        url: 'wss://api.darkswap.io/ws',
        reconnect: true,
        reconnectInterval: 1000,
        maxReconnectAttempts: 5,
      });
      
      clientWithReconnect.connect();
      
      // Subscribe to a channel
      clientWithReconnect.subscribe(WebSocketChannelType.TICKER, {
        baseAsset: 'BTC',
        quoteAsset: 'ETH',
      });
      
      // Find the subscription success handler
      const subscriptionSuccessHandler = mockSocket.on.args.find(
        (args) => args[0] === WebSocketEventType.SUBSCRIPTION_SUCCESS
      )[1];
      
      // Call the handler
      subscriptionSuccessHandler({
        channel: WebSocketChannelType.TICKER,
        params: {
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
        },
      });
      
      // Reset the emit stub to check if subscribe is called again
      mockSocket.emit.reset();
      
      // Find the reconnect handler
      const reconnectHandler = mockSocket.on.args.find(
        (args) => args[0] === 'reconnect'
      )[1];
      
      // Call the reconnect handler
      reconnectHandler();
      
      expect(mockSocket.emit.calledWith(WebSocketEventType.SUBSCRIBE)).to.be.true;
      expect(mockSocket.emit.firstCall.args[1]).to.deep.equal({
        channel: WebSocketChannelType.TICKER,
        params: {
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
        },
      });
    });
  });
});