/**
 * WebRTC connection manager for the web interface
 */

import { EventEmitter } from 'events';
import { WebRtcSignalingClient, SignalingClientEvent } from './WebRtcSignalingClient';

/**
 * WebRTC connection events
 */
export enum WebRtcConnectionEvent {
  Connected = 'connected',
  Disconnected = 'disconnected',
  DataChannelOpen = 'data_channel_open',
  DataChannelClose = 'data_channel_close',
  DataChannelMessage = 'data_channel_message',
  IceConnectionStateChange = 'ice_connection_state_change',
  SignalingStateChange = 'signaling_state_change',
  Error = 'error',
}

/**
 * WebRTC connection state
 */
export enum WebRtcConnectionState {
  New = 'new',
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
  Failed = 'failed',
  Closed = 'closed',
}

/**
 * WebRTC connection
 */
export class WebRtcConnection extends EventEmitter {
  private peerConnection: RTCPeerConnection;
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private state: WebRtcConnectionState = WebRtcConnectionState.New;
  private peerId: string;

  /**
   * Create a new WebRTC connection
   * @param peerId Peer ID
   * @param config RTCConfiguration
   */
  constructor(peerId: string, config?: RTCConfiguration) {
    super();
    this.peerId = peerId;
    this.peerConnection = new RTCPeerConnection(config || {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    // ICE connection state change
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      this.emit(WebRtcConnectionEvent.IceConnectionStateChange, this.peerConnection.iceConnectionState);

      // Update connection state based on ICE connection state
      switch (this.peerConnection.iceConnectionState) {
        case 'connected':
        case 'completed':
          this.setState(WebRtcConnectionState.Connected);
          break;
        case 'disconnected':
          this.setState(WebRtcConnectionState.Disconnected);
          break;
        case 'failed':
          this.setState(WebRtcConnectionState.Failed);
          break;
        case 'closed':
          this.setState(WebRtcConnectionState.Closed);
          break;
      }
    };

    // Signaling state change
    this.peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', this.peerConnection.signalingState);
      this.emit(WebRtcConnectionEvent.SignalingStateChange, this.peerConnection.signalingState);
    };

    // ICE candidate
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('ice_candidate', event.candidate);
      }
    };

    // Data channel
    this.peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setupDataChannel(dataChannel);
    };
  }

  /**
   * Set up a data channel
   * @param dataChannel Data channel
   */
  private setupDataChannel(dataChannel: RTCDataChannel): void {
    const label = dataChannel.label;

    dataChannel.onopen = () => {
      console.log(`Data channel ${label} open`);
      this.emit(WebRtcConnectionEvent.DataChannelOpen, label);
    };

    dataChannel.onclose = () => {
      console.log(`Data channel ${label} closed`);
      this.emit(WebRtcConnectionEvent.DataChannelClose, label);
    };

    dataChannel.onmessage = (event) => {
      this.emit(WebRtcConnectionEvent.DataChannelMessage, label, event.data);
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel ${label} error:`, error);
      this.emit(WebRtcConnectionEvent.Error, error);
    };

    this.dataChannels.set(label, dataChannel);
  }

  /**
   * Create a data channel
   * @param label Data channel label
   * @param ordered Whether the data channel is ordered
   * @returns Data channel
   */
  public createDataChannel(label: string, ordered: boolean = true): RTCDataChannel {
    const dataChannel = this.peerConnection.createDataChannel(label, { ordered });
    this.setupDataChannel(dataChannel);
    return dataChannel;
  }

  /**
   * Create an offer
   * @returns SDP offer
   */
  public async createOffer(): Promise<string> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer.sdp || '';
  }

  /**
   * Create an answer
   * @returns SDP answer
   */
  public async createAnswer(): Promise<string> {
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer.sdp || '';
  }

  /**
   * Set remote description
   * @param sdp SDP
   * @param type SDP type
   */
  public async setRemoteDescription(sdp: string, type: 'offer' | 'answer'): Promise<void> {
    const rtcSdpType = type === 'offer' ? 'offer' : 'answer';
    await this.peerConnection.setRemoteDescription({
      type: rtcSdpType,
      sdp,
    });
  }

  /**
   * Add ICE candidate
   * @param candidate ICE candidate
   * @param sdpMid SDP mid
   * @param sdpMLineIndex SDP m-line index
   */
  public async addIceCandidate(candidate: string, sdpMid: string, sdpMLineIndex: number): Promise<void> {
    await this.peerConnection.addIceCandidate({
      candidate,
      sdpMid,
      sdpMLineIndex,
    });
  }
/**
 * Send string data through a data channel
 * @param label Data channel label
 * @param data String data to send
 */
public sendString(label: string, data: string): void {
  const dataChannel = this.dataChannels.get(label);
  if (!dataChannel) {
    throw new Error(`Data channel ${label} not found`);
  }

  if (dataChannel.readyState !== 'open') {
    throw new Error(`Data channel ${label} is not open`);
  }

  try {
    dataChannel.send(data);
  } catch (error) {
    console.error(`Error sending string data through data channel ${label}:`, error);
    throw error;
  }
}

/**
 * Send binary data through a data channel
 * @param label Data channel label
 * @param data Binary data to send
 */
public sendBinary(label: string, data: ArrayBuffer | Blob | Uint8Array): void {
  const dataChannel = this.dataChannels.get(label);
  if (!dataChannel) {
    throw new Error(`Data channel ${label} not found`);
  }

  if (dataChannel.readyState !== 'open') {
    throw new Error(`Data channel ${label} is not open`);
  }

  try {
    // @ts-ignore - Ignore TypeScript errors for RTCDataChannel.send
    dataChannel.send(data);
  } catch (error) {
    console.error(`Error sending binary data through data channel ${label}:`, error);
    throw error;
  }
    dataChannel.send(data);
  }

  /**
   * Close the connection
   */
  public close(): void {
    // Close all data channels
    for (const [label, dataChannel] of this.dataChannels.entries()) {
      dataChannel.close();
    }
    this.dataChannels.clear();

    // Close the peer connection
    this.peerConnection.close();
    this.setState(WebRtcConnectionState.Closed);
  }

  /**
   * Set the connection state
   * @param state Connection state
   */
  private setState(state: WebRtcConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.emit('state_change', state);

      if (state === WebRtcConnectionState.Connected) {
        this.emit(WebRtcConnectionEvent.Connected);
      } else if (state === WebRtcConnectionState.Disconnected || state === WebRtcConnectionState.Closed) {
        this.emit(WebRtcConnectionEvent.Disconnected);
      }
    }
  }

  /**
   * Get the connection state
   * @returns Connection state
   */
  public getState(): WebRtcConnectionState {
    return this.state;
  }

  /**
   * Get the peer ID
   * @returns Peer ID
   */
  public getPeerId(): string {
    return this.peerId;
  }

  /**
   * Get the peer connection
   * @returns Peer connection
   */
  public getPeerConnection(): RTCPeerConnection {
    return this.peerConnection;
  }

  /**
   * Get a data channel
   * @param label Data channel label
   * @returns Data channel
   */
  public getDataChannel(label: string): RTCDataChannel | undefined {
    return this.dataChannels.get(label);
  }

  /**
   * Get all data channels
   * @returns Data channels
   */
  public getDataChannels(): Map<string, RTCDataChannel> {
    return this.dataChannels;
  }
}

/**
 * WebRTC connection manager
 */
export class WebRtcConnectionManager extends EventEmitter {
  private connections: Map<string, WebRtcConnection> = new Map();
  private signalingClient: WebRtcSignalingClient;
  private config?: RTCConfiguration;

  /**
   * Create a new WebRTC connection manager
   * @param signalingClient Signaling client
   * @param config RTCConfiguration
   */
  constructor(signalingClient: WebRtcSignalingClient, config?: RTCConfiguration) {
    super();
    this.signalingClient = signalingClient;
    this.config = config;

    // Set up signaling client event handlers
    this.setupSignalingClientEventHandlers();
  }

  /**
   * Set up signaling client event handlers
   */
  private setupSignalingClientEventHandlers(): void {
    // Offer received
    this.signalingClient.on(SignalingClientEvent.OfferReceived, async (peerId: string, sdp: string) => {
      try {
        // Get or create a connection
        let connection = this.connections.get(peerId);
        if (!connection) {
          connection = this.createConnection(peerId);
        }

        // Set remote description
        await connection.setRemoteDescription(sdp, 'offer');

        // Create answer
        const answer = await connection.createAnswer();

        // Send answer
        this.signalingClient.sendAnswer(peerId, answer);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Answer received
    this.signalingClient.on(SignalingClientEvent.AnswerReceived, async (peerId: string, sdp: string) => {
      try {
        // Get connection
        const connection = this.connections.get(peerId);
        if (!connection) {
          console.error(`No connection found for peer ${peerId}`);
          return;
        }

        // Set remote description
        await connection.setRemoteDescription(sdp, 'answer');
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    // ICE candidate received
    this.signalingClient.on(
      SignalingClientEvent.IceCandidateReceived,
      async (peerId: string, candidate: string, sdpMid: string, sdpMLineIndex: number) => {
        try {
          // Get connection
          const connection = this.connections.get(peerId);
          if (!connection) {
            console.error(`No connection found for peer ${peerId}`);
            return;
          }

          // Add ICE candidate
          await connection.addIceCandidate(candidate, sdpMid, sdpMLineIndex);
        } catch (error) {
          console.error('Error handling ICE candidate:', error);
        }
      }
    );
  }

  /**
   * Create a connection to a peer
   * @param peerId Peer ID
   * @returns WebRTC connection
   */
  public createConnection(peerId: string): WebRtcConnection {
    // Create a new connection
    const connection = new WebRtcConnection(peerId, this.config);

    // Set up connection event handlers
    connection.on('ice_candidate', (candidate: RTCIceCandidate) => {
      this.signalingClient.sendIceCandidate(
        peerId,
        candidate.candidate,
        candidate.sdpMid || '',
        candidate.sdpMLineIndex || 0
      );
    });

    // Store the connection
    this.connections.set(peerId, connection);

    return connection;
  }

  /**
   * Connect to a peer
   * @param peerId Peer ID
   * @returns WebRTC connection
   */
  public async connect(peerId: string): Promise<WebRtcConnection> {
    // Create a connection
    const connection = this.createConnection(peerId);

    // Create a data channel
    connection.createDataChannel('data');

    // Create an offer
    const offer = await connection.createOffer();

    // Send the offer
    this.signalingClient.sendOffer(peerId, offer);

    return connection;
  }

  /**
   * Get a connection
   * @param peerId Peer ID
   * @returns WebRTC connection
   */
  public getConnection(peerId: string): WebRtcConnection | undefined {
    return this.connections.get(peerId);
  }

  /**
   * Close a connection
   * @param peerId Peer ID
   */
  public closeConnection(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.close();
      this.connections.delete(peerId);
    }
  }

  /**
   * Close all connections
   */
  public closeAllConnections(): void {
    for (const [peerId, connection] of this.connections.entries()) {
      connection.close();
    }
    this.connections.clear();
  }

  /**
   * Get all connections
   * @returns WebRTC connections
   */
  public getConnections(): Map<string, WebRtcConnection> {
    return this.connections;
  }
}