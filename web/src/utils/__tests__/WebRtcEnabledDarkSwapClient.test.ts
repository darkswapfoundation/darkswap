/**
 * Unit tests for WebRtcEnabledDarkSwapClient
 */

import { WebRtcEnabledDarkSwapClient, WebRtcMessageType } from '../WebRtcEnabledDarkSwapClient';
import { WebRtcSignalingClient } from '../WebRtcSignalingClient';
import { WebRtcConnectionManager } from '../WebRtcConnectionManager';
import { AssetType, OrderSide, BitcoinNetwork } from '../DarkSwapClient';
import { ErrorCode, DarkSwapError } from '../ErrorHandling';

// Mock the DarkSwapClient
jest.mock('../DarkSwapClient');

// Mock the WebRtcSignalingClient
jest.mock('../WebRtcSignalingClient');

// Mock the WebRtcConnectionManager
jest.mock('../WebRtcConnectionManager');

// Mock the darkswap-wasm module
jest.mock('darkswap-wasm');

describe('WebRtcEnabledDarkSwapClient', () => {
  let client: WebRtcEnabledDarkSwapClient;
  let mockSignalingClient: jest.Mocked<WebRtcSignalingClient>;
  let mockConnectionManager: jest.Mocked<WebRtcConnectionManager>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a new client
    client = new WebRtcEnabledDarkSwapClient('test-peer-id', 'wss://test-signaling-server.com');

    // Get the mocked instances
    mockSignalingClient = WebRtcSignalingClient.prototype as jest.Mocked<WebRtcSignalingClient>;
    mockConnectionManager = WebRtcConnectionManager.prototype as jest.Mocked<WebRtcConnectionManager>;
  });

  describe('initialization', () => {
    it('should initialize the client', async () => {
      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(WebRtcEnabledDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize('/test-path');

      // Check that the parent initialize method was called
      expect(mockInitialize).toHaveBeenCalledWith('/test-path');
    });
  });

  describe('create', () => {
    it('should create a DarkSwap instance with WebRTC enabled', async () => {
      // Mock the create method of the parent class
      const mockCreate = jest.spyOn(Object.getPrototypeOf(WebRtcEnabledDarkSwapClient.prototype), 'create');
      mockCreate.mockResolvedValue(undefined);

      // Mock the connect method of the signaling client
      mockSignalingClient.connect.mockResolvedValue(undefined);

      // Create a DarkSwap instance
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [
          'stun:stun.l.google.com:19302',
        ],
      });

      // Check that the parent create method was called
      expect(mockCreate).toHaveBeenCalledWith({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [
          'stun:stun.l.google.com:19302',
        ],
      });

      // Check that the signaling client connect method was called
      expect(mockSignalingClient.connect).toHaveBeenCalled();
    });

    it('should create a DarkSwap instance with WebRTC disabled', async () => {
      // Mock the create method of the parent class
      const mockCreate = jest.spyOn(Object.getPrototypeOf(WebRtcEnabledDarkSwapClient.prototype), 'create');
      mockCreate.mockResolvedValue(undefined);

      // Create a DarkSwap instance
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: false,
      });

      // Check that the parent create method was called
      expect(mockCreate).toHaveBeenCalledWith({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: false,
      });

      // Check that the signaling client connect method was not called
      expect(mockSignalingClient.connect).not.toHaveBeenCalled();
    });
  });

  describe('connectToPeer', () => {
    it('should connect to a peer', async () => {
      // Mock the connect method of the connection manager
      const mockConnection = {
        once: jest.fn(),
      };
      mockConnectionManager.connect.mockResolvedValue(mockConnection as any);

      // Set up the once method to call the callback immediately
      mockConnection.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connected') {
          callback();
        }
        return mockConnection;
      });

      // Connect to a peer
      await client.connectToPeer('test-peer-id');

      // Check that the connection manager connect method was called
      expect(mockConnectionManager.connect).toHaveBeenCalledWith('test-peer-id');
    });

    it('should throw an error if WebRTC is not enabled', async () => {
      // Create a DarkSwap instance with WebRTC disabled
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: false,
      });

      // Try to connect to a peer
      await expect(client.connectToPeer('test-peer-id')).rejects.toThrow(DarkSwapError);
    });
  });

  describe('sendMessageToPeer', () => {
    it('should send a message to a peer', async () => {
      // Mock the getConnection method of the connection manager
      const mockConnection = {
        getDataChannel: jest.fn(),
        sendString: jest.fn(),
      };
      mockConnectionManager.getConnection.mockReturnValue(mockConnection as any);

      // Mock the getDataChannel method of the connection
      const mockDataChannel = {};
      mockConnection.getDataChannel.mockReturnValue(mockDataChannel as any);

      // Send a message to a peer
      await client.sendMessageToPeer('test-peer-id', WebRtcMessageType.Chat, { message: 'Hello' });

      // Check that the connection manager getConnection method was called
      expect(mockConnectionManager.getConnection).toHaveBeenCalledWith('test-peer-id');

      // Check that the connection getDataChannel method was called
      expect(mockConnection.getDataChannel).toHaveBeenCalledWith('darkswap');

      // Check that the connection sendString method was called
      expect(mockConnection.sendString).toHaveBeenCalledWith('darkswap', expect.any(String));
    });

    it('should throw an error if WebRTC is not enabled', async () => {
      // Create a DarkSwap instance with WebRTC disabled
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: false,
      });

      // Try to send a message to a peer
      await expect(client.sendMessageToPeer('test-peer-id', WebRtcMessageType.Chat, { message: 'Hello' })).rejects.toThrow(DarkSwapError);
    });

    it('should throw an error if the connection does not exist', async () => {
      // Mock the getConnection method of the connection manager
      mockConnectionManager.getConnection.mockReturnValue(undefined);

      // Try to send a message to a peer
      await expect(client.sendMessageToPeer('test-peer-id', WebRtcMessageType.Chat, { message: 'Hello' })).rejects.toThrow(DarkSwapError);
    });

    it('should throw an error if the data channel does not exist', async () => {
      // Mock the getConnection method of the connection manager
      const mockConnection = {
        getDataChannel: jest.fn(),
      };
      mockConnectionManager.getConnection.mockReturnValue(mockConnection as any);

      // Mock the getDataChannel method of the connection
      mockConnection.getDataChannel.mockReturnValue(undefined);

      // Try to send a message to a peer
      await expect(client.sendMessageToPeer('test-peer-id', WebRtcMessageType.Chat, { message: 'Hello' })).rejects.toThrow(DarkSwapError);
    });
  });

  describe('broadcastMessage', () => {
    it('should broadcast a message to all connected peers', async () => {
      // Mock the getConnections method of the connection manager
      const mockConnections = new Map();
      mockConnections.set('peer1', {});
      mockConnections.set('peer2', {});
      mockConnectionManager.getConnections.mockReturnValue(mockConnections);

      // Mock the sendMessageToPeer method
      const mockSendMessageToPeer = jest.spyOn(client, 'sendMessageToPeer');
      mockSendMessageToPeer.mockResolvedValue(undefined);

      // Broadcast a message
      await client.broadcastMessage(WebRtcMessageType.Chat, { message: 'Hello' });

      // Check that the sendMessageToPeer method was called for each peer
      expect(mockSendMessageToPeer).toHaveBeenCalledTimes(2);
      expect(mockSendMessageToPeer).toHaveBeenCalledWith('peer1', WebRtcMessageType.Chat, { message: 'Hello' });
      expect(mockSendMessageToPeer).toHaveBeenCalledWith('peer2', WebRtcMessageType.Chat, { message: 'Hello' });
    });

    it('should throw an error if WebRTC is not enabled', async () => {
      // Create a DarkSwap instance with WebRTC disabled
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: false,
      });

      // Try to broadcast a message
      await expect(client.broadcastMessage(WebRtcMessageType.Chat, { message: 'Hello' })).rejects.toThrow(DarkSwapError);
    });
  });

  describe('getConnectedPeers', () => {
    it('should return the connected peers', () => {
      // Mock the getConnections method of the connection manager
      const mockConnections = new Map();
      mockConnections.set('peer1', {});
      mockConnections.set('peer2', {});
      mockConnectionManager.getConnections.mockReturnValue(mockConnections);

      // Get the connected peers
      const connectedPeers = client.getConnectedPeers();

      // Check that the getConnections method was called
      expect(mockConnectionManager.getConnections).toHaveBeenCalled();

      // Check that the connected peers are returned
      expect(connectedPeers).toEqual(['peer1', 'peer2']);
    });

    it('should return an empty array if WebRTC is not enabled', async () => {
      // Create a DarkSwap instance with WebRTC disabled
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: false,
      });

      // Get the connected peers
      const connectedPeers = client.getConnectedPeers();

      // Check that the getConnections method was not called
      expect(mockConnectionManager.getConnections).not.toHaveBeenCalled();

      // Check that an empty array is returned
      expect(connectedPeers).toEqual([]);
    });
  });

  describe('stop', () => {
    it('should stop the client and close all connections', async () => {
      // Mock the stop method of the parent class
      const mockStop = jest.spyOn(Object.getPrototypeOf(WebRtcEnabledDarkSwapClient.prototype), 'stop');
      mockStop.mockResolvedValue(undefined);

      // Stop the client
      await client.stop();

      // Check that the connection manager closeAllConnections method was called
      expect(mockConnectionManager.closeAllConnections).toHaveBeenCalled();

      // Check that the signaling client disconnect method was called
      expect(mockSignalingClient.disconnect).toHaveBeenCalled();

      // Check that the parent stop method was called
      expect(mockStop).toHaveBeenCalled();
    });
  });
});