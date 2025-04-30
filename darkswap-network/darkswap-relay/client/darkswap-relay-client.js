/**
 * DarkSwap Relay Client
 * 
 * This is a JavaScript client library for the DarkSwap Relay Server.
 * It provides a simple API for connecting to the relay server and
 * establishing WebRTC connections with other peers.
 */

class DarkSwapRelayClient {
  /**
   * Create a new DarkSwap Relay Client
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.signalUrl - URL of the signaling server (e.g., "ws://localhost:9002/signaling")
   * @param {string} options.peerId - Unique identifier for this peer (optional, will be generated if not provided)
   * @param {Array<string>} options.stunServers - Array of STUN server URLs (optional)
   * @param {Array<Object>} options.turnServers - Array of TURN server configurations (optional)
   * @param {function} options.onPeerConnected - Callback when a peer connects (optional)
   * @param {function} options.onPeerDisconnected - Callback when a peer disconnects (optional)
   * @param {function} options.onMessage - Callback when a message is received (optional)
   * @param {function} options.onError - Callback when an error occurs (optional)
   */
  constructor(options) {
    this.options = {
      signalUrl: 'ws://localhost:9002/signaling',
      peerId: this._generatePeerId(),
      stunServers: ['stun:stun.l.google.com:19302'],
      turnServers: [],
      onPeerConnected: () => {},
      onPeerDisconnected: () => {},
      onMessage: () => {},
      onError: console.error,
      ...options
    };

    this.signalConnection = null;
    this.peerConnections = new Map();
    this.dataChannels = new Map();
    this.pendingCandidates = new Map();
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Connect to the relay server
   * 
   * @returns {Promise} - Resolves when connected to the relay server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.signalConnection = new WebSocket(this.options.signalUrl);

        this.signalConnection.onopen = () => {
          console.log(`Connected to signaling server at ${this.options.signalUrl}`);
          this._register();
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.signalConnection.onmessage = (event) => {
          this._handleSignalingMessage(event.data);
        };

        this.signalConnection.onclose = () => {
          console.log('Disconnected from signaling server');
          this.connected = false;
          this._attemptReconnect();
        };

        this.signalConnection.onerror = (error) => {
          console.error('Signaling server error:', error);
          this.options.onError(error);
          reject(error);
        };
      } catch (error) {
        console.error('Failed to connect to signaling server:', error);
        this.options.onError(error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the relay server
   */
  disconnect() {
    // Close all peer connections
    for (const [peerId, connection] of this.peerConnections.entries()) {
      this._closePeerConnection(peerId);
    }

    // Close the signaling connection
    if (this.signalConnection) {
      this.signalConnection.close();
      this.signalConnection = null;
    }

    this.connected = false;
  }

  /**
   * Connect to a peer
   * 
   * @param {string} peerId - ID of the peer to connect to
   * @returns {Promise} - Resolves when connected to the peer
   */
  async connectToPeer(peerId) {
    if (!this.connected) {
      throw new Error('Not connected to signaling server');
    }

    if (this.peerConnections.has(peerId)) {
      console.log(`Already connected to peer ${peerId}`);
      return;
    }

    console.log(`Connecting to peer ${peerId}`);

    // Create a new RTCPeerConnection
    const peerConnection = this._createPeerConnection(peerId);

    // Create a data channel
    const dataChannel = peerConnection.createDataChannel('data');
    this._setupDataChannel(dataChannel, peerId);

    // Create an offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send the offer to the peer
    this._sendSignalingMessage({
      type: 'Offer',
      payload: {
        from: this.options.peerId,
        to: peerId,
        sdp: offer.sdp
      }
    });

    // Return a promise that resolves when the connection is established
    return new Promise((resolve, reject) => {
      const checkConnection = setInterval(() => {
        if (this.dataChannels.has(peerId) && this.dataChannels.get(peerId).readyState === 'open') {
          clearInterval(checkConnection);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkConnection);
        if (!this.dataChannels.has(peerId) || this.dataChannels.get(peerId).readyState !== 'open') {
          reject(new Error(`Connection to peer ${peerId} timed out`));
        }
      }, 10000);
    });
  }

  /**
   * Connect to a peer via relay
   * 
   * @param {string} peerId - ID of the peer to connect to
   * @returns {Promise} - Resolves when connected to the peer via relay
   */
  async connectToPeerViaRelay(peerId) {
    if (!this.connected) {
      throw new Error('Not connected to signaling server');
    }

    console.log(`Connecting to peer ${peerId} via relay`);

    // Send a relay request
    this._sendSignalingMessage({
      type: 'RelayRequest',
      payload: {
        from: this.options.peerId,
        to: peerId
      }
    });

    // Return a promise that resolves when the relay is established
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Relay connection to peer ${peerId} timed out`));
      }, 10000);

      // Set up a one-time handler for the relay response
      const handleRelayResponse = (message) => {
        if (message.type === 'RelayResponse' && message.payload.accepted) {
          clearTimeout(timeout);
          resolve(message.payload.relay_id);
        } else if (message.type === 'RelayResponse' && !message.payload.accepted) {
          clearTimeout(timeout);
          reject(new Error(`Relay connection to peer ${peerId} rejected: ${message.payload.error || 'Unknown error'}`));
        }
      };

      this._onceSignalingMessage = handleRelayResponse;
    });
  }

  /**
   * Send a message to a peer
   * 
   * @param {string} peerId - ID of the peer to send the message to
   * @param {*} data - Data to send
   * @returns {Promise} - Resolves when the message is sent
   */
  async sendToPeer(peerId, data) {
    if (!this.dataChannels.has(peerId)) {
      throw new Error(`Not connected to peer ${peerId}`);
    }

    const dataChannel = this.dataChannels.get(peerId);
    if (dataChannel.readyState !== 'open') {
      throw new Error(`Data channel to peer ${peerId} is not open`);
    }

    // Convert data to string if it's not already
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    // Send the message
    dataChannel.send(message);
  }

  /**
   * Send a message to a peer via relay
   * 
   * @param {string} relayId - ID of the relay connection
   * @param {*} data - Data to send
   * @returns {Promise} - Resolves when the message is sent
   */
  async sendToPeerViaRelay(relayId, data) {
    if (!this.connected) {
      throw new Error('Not connected to signaling server');
    }

    // Convert data to string if it's not already
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    // Send the message via relay
    this._sendSignalingMessage({
      type: 'RelayData',
      payload: {
        from: this.options.peerId,
        relay_id: relayId,
        data: btoa(message) // Base64 encode the message
      }
    });
  }

  /**
   * Register with the signaling server
   * 
   * @private
   */
  _register() {
    this._sendSignalingMessage({
      type: 'Register',
      payload: {
        peer_id: this.options.peerId
      }
    });
  }

  /**
   * Send a message to the signaling server
   * 
   * @param {Object} message - Message to send
   * @private
   */
  _sendSignalingMessage(message) {
    if (!this.signalConnection || this.signalConnection.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message, not connected to signaling server');
      return;
    }

    this.signalConnection.send(JSON.stringify(message));
  }

  /**
   * Handle a message from the signaling server
   * 
   * @param {string} data - Message data
   * @private
   */
  _handleSignalingMessage(data) {
    try {
      const message = JSON.parse(data);

      // Check if there's a one-time handler for this message
      if (this._onceSignalingMessage) {
        const handler = this._onceSignalingMessage;
        this._onceSignalingMessage = null;
        handler(message);
      }

      switch (message.type) {
        case 'Offer':
          this._handleOffer(message.payload);
          break;
        case 'Answer':
          this._handleAnswer(message.payload);
          break;
        case 'IceCandidate':
          this._handleIceCandidate(message.payload);
          break;
        case 'RelayData':
          this._handleRelayData(message.payload);
          break;
        case 'Error':
          console.error('Signaling server error:', message.payload.message);
          this.options.onError(new Error(message.payload.message));
          break;
        default:
          console.log('Unhandled signaling message:', message);
      }
    } catch (error) {
      console.error('Failed to parse signaling message:', error);
      this.options.onError(error);
    }
  }

  /**
   * Handle an offer from a peer
   * 
   * @param {Object} payload - Offer payload
   * @private
   */
  async _handleOffer(payload) {
    const { from, to, sdp } = payload;

    if (to !== this.options.peerId) {
      return;
    }

    console.log(`Received offer from peer ${from}`);

    // Create a new RTCPeerConnection if it doesn't exist
    if (!this.peerConnections.has(from)) {
      this._createPeerConnection(from);
    }

    const peerConnection = this.peerConnections.get(from);

    // Set the remote description
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp
      }));

      // Create an answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send the answer to the peer
      this._sendSignalingMessage({
        type: 'Answer',
        payload: {
          from: this.options.peerId,
          to: from,
          sdp: answer.sdp
        }
      });

      // Add any pending ICE candidates
      if (this.pendingCandidates.has(from)) {
        const candidates = this.pendingCandidates.get(from);
        for (const candidate of candidates) {
          await peerConnection.addIceCandidate(candidate);
        }
        this.pendingCandidates.delete(from);
      }
    } catch (error) {
      console.error('Failed to handle offer:', error);
      this.options.onError(error);
    }
  }

  /**
   * Handle an answer from a peer
   * 
   * @param {Object} payload - Answer payload
   * @private
   */
  async _handleAnswer(payload) {
    const { from, to, sdp } = payload;

    if (to !== this.options.peerId) {
      return;
    }

    console.log(`Received answer from peer ${from}`);

    // Get the peer connection
    const peerConnection = this.peerConnections.get(from);
    if (!peerConnection) {
      console.error(`No peer connection for peer ${from}`);
      return;
    }

    // Set the remote description
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp
      }));

      // Add any pending ICE candidates
      if (this.pendingCandidates.has(from)) {
        const candidates = this.pendingCandidates.get(from);
        for (const candidate of candidates) {
          await peerConnection.addIceCandidate(candidate);
        }
        this.pendingCandidates.delete(from);
      }
    } catch (error) {
      console.error('Failed to handle answer:', error);
      this.options.onError(error);
    }
  }

  /**
   * Handle an ICE candidate from a peer
   * 
   * @param {Object} payload - ICE candidate payload
   * @private
   */
  async _handleIceCandidate(payload) {
    const { from, to, candidate, sdp_mid, sdp_mline_index } = payload;

    if (to !== this.options.peerId) {
      return;
    }

    // Get the peer connection
    const peerConnection = this.peerConnections.get(from);
    if (!peerConnection) {
      console.error(`No peer connection for peer ${from}`);
      return;
    }

    // Create the ICE candidate
    const iceCandidate = new RTCIceCandidate({
      candidate,
      sdpMid: sdp_mid,
      sdpMLineIndex: sdp_mline_index
    });

    // Add the ICE candidate to the peer connection
    try {
      // If the remote description is not set yet, store the candidate for later
      if (!peerConnection.remoteDescription) {
        if (!this.pendingCandidates.has(from)) {
          this.pendingCandidates.set(from, []);
        }
        this.pendingCandidates.get(from).push(iceCandidate);
        return;
      }

      await peerConnection.addIceCandidate(iceCandidate);
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
      this.options.onError(error);
    }
  }

  /**
   * Handle relay data from a peer
   * 
   * @param {Object} payload - Relay data payload
   * @private
   */
  _handleRelayData(payload) {
    const { from, relay_id, data } = payload;

    // Decode the data
    try {
      const decodedData = atob(data);
      
      // Try to parse the data as JSON
      let parsedData;
      try {
        parsedData = JSON.parse(decodedData);
      } catch (e) {
        parsedData = decodedData;
      }

      // Call the onMessage callback
      this.options.onMessage(parsedData, from, relay_id);
    } catch (error) {
      console.error('Failed to decode relay data:', error);
      this.options.onError(error);
    }
  }

  /**
   * Create a new RTCPeerConnection
   * 
   * @param {string} peerId - ID of the peer
   * @returns {RTCPeerConnection} - The new peer connection
   * @private
   */
  _createPeerConnection(peerId) {
    // Create ICE servers configuration
    const iceServers = [];

    // Add STUN servers
    for (const server of this.options.stunServers) {
      iceServers.push({ urls: server });
    }

    // Add TURN servers
    for (const server of this.options.turnServers) {
      iceServers.push({
        urls: server.urls,
        username: server.username,
        credential: server.credential
      });
    }

    // Create the peer connection
    const peerConnection = new RTCPeerConnection({
      iceServers
    });

    // Set up event handlers
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this._sendSignalingMessage({
          type: 'IceCandidate',
          payload: {
            from: this.options.peerId,
            to: peerId,
            candidate: event.candidate.candidate,
            sdp_mid: event.candidate.sdpMid,
            sdp_mline_index: event.candidate.sdpMLineIndex
          }
        });
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for peer ${peerId}: ${peerConnection.iceConnectionState}`);
      
      if (peerConnection.iceConnectionState === 'disconnected' || 
          peerConnection.iceConnectionState === 'failed' || 
          peerConnection.iceConnectionState === 'closed') {
        this._closePeerConnection(peerId);
      }
    };

    peerConnection.ondatachannel = (event) => {
      console.log(`Data channel received from peer ${peerId}`);
      this._setupDataChannel(event.channel, peerId);
    };

    // Store the peer connection
    this.peerConnections.set(peerId, peerConnection);

    return peerConnection;
  }

  /**
   * Set up a data channel
   * 
   * @param {RTCDataChannel} dataChannel - The data channel
   * @param {string} peerId - ID of the peer
   * @private
   */
  _setupDataChannel(dataChannel, peerId) {
    dataChannel.onopen = () => {
      console.log(`Data channel to peer ${peerId} opened`);
      this.dataChannels.set(peerId, dataChannel);
      this.options.onPeerConnected(peerId);
    };

    dataChannel.onclose = () => {
      console.log(`Data channel to peer ${peerId} closed`);
      this.dataChannels.delete(peerId);
      this.options.onPeerDisconnected(peerId);
    };

    dataChannel.onmessage = (event) => {
      // Try to parse the data as JSON
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        data = event.data;
      }

      // Call the onMessage callback
      this.options.onMessage(data, peerId);
    };
  }

  /**
   * Close a peer connection
   * 
   * @param {string} peerId - ID of the peer
   * @private
   */
  _closePeerConnection(peerId) {
    // Close the data channel
    if (this.dataChannels.has(peerId)) {
      this.dataChannels.get(peerId).close();
      this.dataChannels.delete(peerId);
    }

    // Close the peer connection
    if (this.peerConnections.has(peerId)) {
      this.peerConnections.get(peerId).close();
      this.peerConnections.delete(peerId);
    }

    // Call the onPeerDisconnected callback
    this.options.onPeerDisconnected(peerId);
  }

  /**
   * Attempt to reconnect to the signaling server
   * 
   * @private
   */
  _attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(() => {
        this._attemptReconnect();
      });
    }, delay);
  }

  /**
   * Generate a random peer ID
   * 
   * @returns {string} - A random peer ID
   * @private
   */
  _generatePeerId() {
    return 'peer-' + Math.random().toString(36).substring(2, 10);
  }
}

// Export the client
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = DarkSwapRelayClient;
} else {
  window.DarkSwapRelayClient = DarkSwapRelayClient;
}