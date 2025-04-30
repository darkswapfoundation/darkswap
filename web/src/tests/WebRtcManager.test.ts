import { WebRtcManager, WebRtcConnection, WebRtcConnectionEvent } from '../utils/WebRtcManager';
import { WebRtcSignalingClient, SignalingClientEvent } from '../utils/WebRtcSignalingClient';
import { WebRtcBandwidthManager } from '../utils/WebRtcBandwidthManager';
import { WebRtcIceServers } from '../utils/WebRtcIceServers';

// Mock the WebRtcSignalingClient
jest.mock('../utils/WebRtcSignalingClient');

// Mock the WebRtcBandwidthManager
jest.mock('../utils/WebRtcBandwidthManager', () => ({
  getBandwidthSettings: jest.fn().mockReturnValue({
    audio: { min: 6, max: 50, ideal: 20 },
    video: { min: 100, max: 2500, ideal: 1000 },
    data: { max: 30000 },
    adaptiveBitrate: true,
    prioritizeAudio: true,
    saveNetworkData: false,
    turnRelayOnly: false,
  }),
  applyBandwidthConstraints: jest.fn(),
  monitorBandwidthUsage: jest.fn().mockReturnValue(() => {}),
  getDefaultBandwidthSettings: jest.fn().mockReturnValue({
    audio: { min: 6, max: 50, ideal: 20 },
    video: { min: 100, max: 2500, ideal: 1000 },
    data: { max: 30000 },
    adaptiveBitrate: true,
    prioritizeAudio: true,
    saveNetworkData: false,
    turnRelayOnly: false,
  }),
}));

// Mock the WebRtcIceServers
jest.mock('../utils/WebRtcIceServers', () => ({
  getIceServers: jest.fn().mockReturnValue([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]),
  getDefaultIceServers: jest.fn().mockReturnValue([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]),
}));

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  localDescription = null;
  remoteDescription = null;
  iceConnectionState = 'new';
  signalingState = 'stable';
  oniceconnectionstatechange = null;
  onsignalingstatechange = null;
  onicecandidate = null;
  ondatachannel = null;

  constructor() {
    setTimeout(() => {
      if (this.onicecandidate) {
        this.onicecandidate({ candidate: { candidate: 'candidate', sdpMid: 'sdpMid', sdpMLineIndex: 0 } });
      }
    }, 100);
  }

  createOffer() {
    return Promise.resolve({ sdp: 'offer', type: 'offer' });
  }

  createAnswer() {
    return Promise.resolve({ sdp: 'answer', type: 'answer' });
  }

  setLocalDescription(description) {
    this.localDescription = description;
    return Promise.resolve();
  }

  setRemoteDescription(description) {
    this.remoteDescription = description;
    return Promise.resolve();
  }

  addIceCandidate(candidate) {
    return Promise.resolve();
  }

  close() {
    this.iceConnectionState = 'closed';
    if (this.oniceconnectionstatechange) {
      this.oniceconnectionstatechange();
    }
  }

  createDataChannel(label, options) {
    return {
      label,
      readyState: 'open',
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
      send: jest.fn(),
      close: jest.fn(),
    };
  }
}

// Mock global RTCPeerConnection
global.RTCPeerConnection = MockRTCPeerConnection as any;
global.RTCSessionDescription = jest.fn() as any;
global.RTCIceCandidate = jest.fn() as any;

describe('WebRtcManager', () => {
  let signalingClient: jest.Mocked<WebRtcSignalingClient>;
  let webRtcManager: WebRtcManager;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a mock signaling client
    signalingClient = new WebRtcSignalingClient('test-peer', 'ws://localhost:8080') as jest.Mocked<WebRtcSignalingClient>;
    
    // Create a WebRTC manager
    webRtcManager = new WebRtcManager(signalingClient);
  });

  test('should create a connection', () => {
    // Create a connection
    const connection = webRtcManager.createConnection('test-peer-2');

    // Verify the connection was created
    expect(connection).toBeDefined();
    expect(connection.getPeerId()).toBe('test-peer-2');

    // Verify bandwidth constraints were applied
    expect(WebRtcBandwidthManager.applyBandwidthConstraints).toHaveBeenCalled();
  });

  test('should connect to a peer', async () => {
    // Connect to a peer
    const connection = await webRtcManager.connect('test-peer-2');

    // Verify the connection was created
    expect(connection).toBeDefined();
    expect(connection.getPeerId()).toBe('test-peer-2');

    // Verify an offer was created and sent
    expect(signalingClient.sendOffer).toHaveBeenCalledWith('test-peer-2', expect.any(String));
  });

  test('should close a connection', () => {
    // Create a connection
    const connection = webRtcManager.createConnection('test-peer-2');

    // Close the connection
    webRtcManager.closeConnection('test-peer-2');

    // Verify the connection was closed
    expect(webRtcManager.getConnection('test-peer-2')).toBeUndefined();
  });

  test('should close all connections', () => {
    // Create connections
    webRtcManager.createConnection('test-peer-2');
    webRtcManager.createConnection('test-peer-3');

    // Close all connections
    webRtcManager.closeAllConnections();

    // Verify all connections were closed
    expect(webRtcManager.getConnections().size).toBe(0);
  });

  test('should handle offer received', () => {
    // Mock the createConnection method
    const createConnectionSpy = jest.spyOn(webRtcManager, 'createConnection');

    // Emit an offer received event
    signalingClient.emit(SignalingClientEvent.OfferReceived, 'test-peer-2', 'offer');

    // Verify a connection was created
    expect(createConnectionSpy).toHaveBeenCalledWith('test-peer-2');
  });

  test('should handle answer received', () => {
    // Create a connection
    const connection = webRtcManager.createConnection('test-peer-2');

    // Mock the setRemoteDescription method
    const setRemoteDescriptionSpy = jest.spyOn(connection, 'setRemoteDescription');

    // Emit an answer received event
    signalingClient.emit(SignalingClientEvent.AnswerReceived, 'test-peer-2', 'answer');

    // Verify the remote description was set
    expect(setRemoteDescriptionSpy).toHaveBeenCalledWith('answer', 'answer');
  });

  test('should handle ICE candidate received', () => {
    // Create a connection
    const connection = webRtcManager.createConnection('test-peer-2');

    // Mock the addIceCandidate method
    const addIceCandidateSpy = jest.spyOn(connection, 'addIceCandidate');

    // Emit an ICE candidate received event
    signalingClient.emit(
      SignalingClientEvent.IceCandidateReceived,
      'test-peer-2',
      'candidate',
      'sdpMid',
      0
    );

    // Verify the ICE candidate was added
    expect(addIceCandidateSpy).toHaveBeenCalledWith('candidate', 'sdpMid', 0);
  });

  test('should start bandwidth monitoring', () => {
    // Create a connection
    const connection = webRtcManager.createConnection('test-peer-2');

    // Verify bandwidth monitoring was started
    expect(WebRtcBandwidthManager.monitorBandwidthUsage).toHaveBeenCalled();
  });
});

describe('WebRtcConnection', () => {
  let connection: WebRtcConnection;

  beforeEach(() => {
    // Create a connection
    connection = new WebRtcConnection('test-peer-2');
  });

  test('should create a data channel', () => {
    // Create a data channel
    const dataChannel = connection.createDataChannel('test-channel');

    // Verify the data channel was created
    expect(dataChannel).toBeDefined();
    expect(dataChannel.label).toBe('test-channel');
  });

  test('should create an offer', async () => {
    // Create an offer
    const offer = await connection.createOffer();

    // Verify the offer was created
    expect(offer).toBe('offer');
  });

  test('should create an answer', async () => {
    // Create an answer
    const answer = await connection.createAnswer();

    // Verify the answer was created
    expect(answer).toBe('answer');
  });

  test('should set remote description', async () => {
    // Set remote description
    await connection.setRemoteDescription('offer', 'offer');

    // Verify the remote description was set
    expect(connection.getPeerConnection().remoteDescription).toBeDefined();
  });

  test('should add ICE candidate', async () => {
    // Add ICE candidate
    await connection.addIceCandidate('candidate', 'sdpMid', 0);

    // No assertion needed, just checking that it doesn't throw
  });

  test('should send string data', () => {
    // Create a data channel
    const dataChannel = connection.createDataChannel('test-channel');

    // Send string data
    connection.sendString('test-channel', 'test-data');

    // Verify the data was sent
    expect(dataChannel.send).toHaveBeenCalledWith('test-data');
  });

  test('should send binary data', () => {
    // Create a data channel
    const dataChannel = connection.createDataChannel('test-channel');

    // Send binary data
    const data = new Uint8Array([1, 2, 3]);
    connection.sendBinary('test-channel', data);

    // Verify the data was sent
    expect(dataChannel.send).toHaveBeenCalledWith(data);
  });

  test('should close the connection', () => {
    // Create a data channel
    const dataChannel = connection.createDataChannel('test-channel');

    // Close the connection
    connection.close();

    // Verify the data channel was closed
    expect(dataChannel.close).toHaveBeenCalled();
  });

  test('should emit connected event when ICE connection state changes to connected', () => {
    // Mock the emit method
    const emitSpy = jest.spyOn(connection, 'emit');

    // Change the ICE connection state to connected
    connection.getPeerConnection().iceConnectionState = 'connected';
    connection.getPeerConnection().oniceconnectionstatechange?.();

    // Verify the connected event was emitted
    expect(emitSpy).toHaveBeenCalledWith(WebRtcConnectionEvent.Connected);
  });

  test('should emit disconnected event when ICE connection state changes to disconnected', () => {
    // Mock the emit method
    const emitSpy = jest.spyOn(connection, 'emit');

    // Change the ICE connection state to disconnected
    connection.getPeerConnection().iceConnectionState = 'disconnected';
    connection.getPeerConnection().oniceconnectionstatechange?.();

    // Verify the disconnected event was emitted
    expect(emitSpy).toHaveBeenCalledWith(WebRtcConnectionEvent.Disconnected);
  });
});