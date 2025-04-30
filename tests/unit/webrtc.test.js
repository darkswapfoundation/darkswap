/**
 * WebRTC Tests
 * 
 * This file contains tests for the WebRTC functionality.
 */

const { WebRtcManager } = require('../../web/src/utils/WebRtcManager');

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  constructor() {
    this.localDescription = null;
    this.remoteDescription = null;
    this.iceConnectionState = 'new';
    this.signalingState = 'stable';
    this.onicecandidate = null;
    this.oniceconnectionstatechange = null;
    this.onsignalingstatechange = null;
    this.ontrack = null;
    this.ondatachannel = null;
    this.candidates = [];
  }
  
  createOffer() {
    return Promise.resolve({
      type: 'offer',
      sdp: 'mock-sdp-offer',
    });
  }
  
  createAnswer() {
    return Promise.resolve({
      type: 'answer',
      sdp: 'mock-sdp-answer',
    });
  }
  
  setLocalDescription(desc) {
    this.localDescription = desc;
    return Promise.resolve();
  }
  
  setRemoteDescription(desc) {
    this.remoteDescription = desc;
    return Promise.resolve();
  }
  
  addIceCandidate(candidate) {
    this.candidates.push(candidate);
    return Promise.resolve();
  }
  
  createDataChannel(label, options) {
    return new MockRTCDataChannel(label, options);
  }
  
  close() {
    this.iceConnectionState = 'closed';
    this.signalingState = 'closed';
    if (this.oniceconnectionstatechange) {
      this.oniceconnectionstatechange();
    }
    if (this.onsignalingstatechange) {
      this.onsignalingstatechange();
    }
  }
  
  // Simulate receiving an ICE candidate
  receiveIceCandidate(candidate) {
    if (this.onicecandidate) {
      this.onicecandidate({ candidate });
    }
  }
  
  // Simulate receiving a data channel
  receiveDataChannel(dataChannel) {
    if (this.ondatachannel) {
      this.ondatachannel({ channel: dataChannel });
    }
  }
}

// Mock RTCDataChannel
class MockRTCDataChannel {
  constructor(label, options) {
    this.label = label;
    this.options = options;
    this.readyState = 'connecting';
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    this.bufferedAmount = 0;
  }
  
  send(data) {
    // Simulate sending data
    this.bufferedAmount += data.length;
    setTimeout(() => {
      this.bufferedAmount -= data.length;
    }, 10);
  }
  
  close() {
    this.readyState = 'closed';
    if (this.onclose) {
      this.onclose();
    }
  }
  
  // Simulate receiving a message
  receiveMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data });
    }
  }
  
  // Simulate opening the channel
  simulateOpen() {
    this.readyState = 'open';
    if (this.onopen) {
      this.onopen();
    }
  }
}

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen({ target: this });
      }
    }, 10);
  }
  
  send(data) {
    // Simulate sending data
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ target: this });
    }
  }
  
  // Simulate receiving a message
  receiveMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data });
    }
  }
}

// Mock constants
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

// Mock global objects
global.RTCPeerConnection = MockRTCPeerConnection;
global.RTCSessionDescription = function(desc) {
  return desc;
};
global.RTCIceCandidate = function(candidate) {
  return candidate;
};
global.WebSocket = MockWebSocket;

describe('WebRtcManager', () => {
  let webRtcManager;
  
  beforeEach(() => {
    webRtcManager = new WebRtcManager();
  });
  
  afterEach(() => {
    webRtcManager.disconnect();
  });
  
  describe('connect', () => {
    it('should connect to the signaling server', async () => {
      // Arrange
      const signalingServerUrl = 'ws://localhost:9001/signaling';
      const localPeerId = 'local-peer-id';
      
      // Act
      await webRtcManager.connect(signalingServerUrl, localPeerId);
      
      // Assert
      expect(webRtcManager.isConnected()).toBe(true);
      expect(webRtcManager.getLocalPeerId()).toBe(localPeerId);
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect from the signaling server', async () => {
      // Arrange
      const signalingServerUrl = 'ws://localhost:9001/signaling';
      const localPeerId = 'local-peer-id';
      await webRtcManager.connect(signalingServerUrl, localPeerId);
      
      // Act
      webRtcManager.disconnect();
      
      // Assert
      expect(webRtcManager.isConnected()).toBe(false);
    });
  });
  
  describe('createPeerConnection', () => {
    it('should create a peer connection', async () => {
      // Arrange
      const signalingServerUrl = 'ws://localhost:9001/signaling';
      const localPeerId = 'local-peer-id';
      const remotePeerId = 'remote-peer-id';
      await webRtcManager.connect(signalingServerUrl, localPeerId);
      
      // Act
      const peerConnection = await webRtcManager.createPeerConnection(remotePeerId);
      
      // Assert
      expect(peerConnection).toBeDefined();
      expect(webRtcManager.getPeerConnection(remotePeerId)).toBe(peerConnection);
    });
  });
  
  describe('closePeerConnection', () => {
    it('should close a peer connection', async () => {
      // Arrange
      const signalingServerUrl = 'ws://localhost:9001/signaling';
      const localPeerId = 'local-peer-id';
      const remotePeerId = 'remote-peer-id';
      await webRtcManager.connect(signalingServerUrl, localPeerId);
      await webRtcManager.createPeerConnection(remotePeerId);
      
      // Act
      webRtcManager.closePeerConnection(remotePeerId);
      
      // Assert
      expect(webRtcManager.getPeerConnection(remotePeerId)).toBeUndefined();
    });
  });
  
  describe('createDataChannel', () => {
    it('should create a data channel', async () => {
      // Arrange
      const signalingServerUrl = 'ws://localhost:9001/signaling';
      const localPeerId = 'local-peer-id';
      const remotePeerId = 'remote-peer-id';
      const channelLabel = 'test-channel';
      await webRtcManager.connect(signalingServerUrl, localPeerId);
      await webRtcManager.createPeerConnection(remotePeerId);
      
      // Act
      const dataChannel = await webRtcManager.createDataChannel(remotePeerId, channelLabel);
      
      // Assert
      expect(dataChannel).toBeDefined();
      expect(dataChannel.label).toBe(channelLabel);
    });
  });
  
  describe('sendToPeer', () => {
    it('should send data to a peer', async () => {
      // Arrange
      const signalingServerUrl = 'ws://localhost:9001/signaling';
      const localPeerId = 'local-peer-id';
      const remotePeerId = 'remote-peer-id';
      const channelLabel = 'test-channel';
      const data = 'test-data';
      await webRtcManager.connect(signalingServerUrl, localPeerId);
      await webRtcManager.createPeerConnection(remotePeerId);
      const dataChannel = await webRtcManager.createDataChannel(remotePeerId, channelLabel);
      
      // Simulate data channel open
      dataChannel.simulateOpen();
      
      // Act & Assert
      expect(() => {
        webRtcManager.sendToPeer(remotePeerId, channelLabel, data);
      }).not.toThrow();
    });
    
    it('should throw an error if the data channel is not open', async () => {
      // Arrange
      const signalingServerUrl = 'ws://localhost:9001/signaling';
      const localPeerId = 'local-peer-id';
      const remotePeerId = 'remote-peer-id';
      const channelLabel = 'test-channel';
      const data = 'test-data';
      await webRtcManager.connect(signalingServerUrl, localPeerId);
      await webRtcManager.createPeerConnection(remotePeerId);
      await webRtcManager.createDataChannel(remotePeerId, channelLabel);
      
      // Act & Assert
      expect(() => {
        webRtcManager.sendToPeer(remotePeerId, channelLabel, data);
      }).toThrow();
    });
  });
  
  describe('onPeerMessage', () => {
    it('should register a message handler for a peer', async () => {
      // Arrange
      const signalingServerUrl = 'ws://localhost:9001/signaling';
      const localPeerId = 'local-peer-id';
      const remotePeerId = 'remote-peer-id';
      const channelLabel = 'test-channel';
      const data = 'test-data';
      const messageHandler = jest.fn();
      await webRtcManager.connect(signalingServerUrl, localPeerId);
      await webRtcManager.createPeerConnection(remotePeerId);
      const dataChannel = await webRtcManager.createDataChannel(remotePeerId, channelLabel);
      
      // Act
      webRtcManager.onPeerMessage(remotePeerId, channelLabel, messageHandler);
      
      // Simulate receiving a message
      dataChannel.receiveMessage(data);
      
      // Assert
      expect(messageHandler).toHaveBeenCalledWith(data);
    });
  });
  
  describe('offPeerMessage', () => {
    it('should unregister a message handler for a peer', async () => {
      // Arrange
      const signalingServerUrl = 'ws://localhost:9001/signaling';
      const localPeerId = 'local-peer-id';
      const remotePeerId = 'remote-peer-id';
      const channelLabel = 'test-channel';
      const data = 'test-data';
      const messageHandler = jest.fn();
      await webRtcManager.connect(signalingServerUrl, localPeerId);
      await webRtcManager.createPeerConnection(remotePeerId);
      const dataChannel = await webRtcManager.createDataChannel(remotePeerId, channelLabel);
      webRtcManager.onPeerMessage(remotePeerId, channelLabel, messageHandler);
      
      // Act
      webRtcManager.offPeerMessage(remotePeerId, channelLabel, messageHandler);
      
      // Simulate receiving a message
      dataChannel.receiveMessage(data);
      
      // Assert
      expect(messageHandler).not.toHaveBeenCalled();
    });
  });
});