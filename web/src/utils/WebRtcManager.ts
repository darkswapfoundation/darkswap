/**
 * WebRTC manager for the web interface
 */

import { EventEmitter } from 'events';
import { WebRtcSignalingClient, SignalingClientEvent } from './WebRtcSignalingClient';
import { WebRtcBandwidthManager } from './WebRtcBandwidthManager';
import { WebRtcIceServers } from './WebRtcIceServers';

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
  private stats: {
    bytesReceived: number;
    bytesSent: number;
    bitsPerSecondReceived: number;
    bitsPerSecondSent: number;
    packetsReceived: number;
    packetsSent: number;
    packetsLost: number;
    roundTripTime: number;
    timestamp: number;
  } | null = null;

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
   * Update connection stats
   * @param stats Connection stats
   */
  updateStats(stats: {
    bytesReceived: number;
    bytesSent: number;
    bitsPerSecondReceived: number;
    bitsPerSecondSent: number;
    packetsReceived: number;
    packetsSent: number;
    packetsLost: number;
    roundTripTime: number;
    timestamp: number;
  }): void {
    this.stats = stats;
  }

  /**
   * Get connection stats
   * @returns Connection stats
   */
  getStats(): {
    bytesReceived: number;
    bytesSent: number;
    bitsPerSecondReceived: number;
    bitsPerSecondSent: number;
    packetsReceived: number;
    packetsSent: number;
    packetsLost: number;
    roundTripTime: number;
    timestamp: number;
  } | null {
    return this.stats;
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

    dataChannel.send(data);
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

    // TypeScript doesn't correctly type RTCDataChannel.send
    // We need to use any to bypass the type checking
    (dataChannel as any).send(data);
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
 * WebRTC manager
 */
export class WebRtcManager extends EventEmitter {
  private connections: Map<string, WebRtcConnection> = new Map();
  private signalingClient: WebRtcSignalingClient;
  private config?: RTCConfiguration;
  private monitoringIntervals: Map<string, () => void> = new Map();

  /**
   * Create a new WebRTC manager
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
   * Start bandwidth monitoring for a connection
   * @param connection Connection to monitor
   */
  private startBandwidthMonitoring(connection: WebRtcConnection): void {
    const peerConnection = connection.getPeerConnection();
    if (!peerConnection) return;
    
    const stopMonitoring = WebRtcBandwidthManager.monitorBandwidthUsage(
      peerConnection,
      (stats: any) => {
        // Update connection stats
        connection.updateStats(stats);
        
        // Adjust quality if needed
        this.adjustConnectionQuality(connection, stats);
      },
      2000 // Check every 2 seconds
    );
    
    // Store the stop function
    this.monitoringIntervals.set(connection.getPeerId(), stopMonitoring);
  }

  /**
   * Adjust connection quality based on network conditions
   * @param connection Connection to adjust
   * @param stats Connection stats
   */
  private adjustConnectionQuality(connection: WebRtcConnection, stats: any): void {
    const peerConnection = connection.getPeerConnection();
    if (!peerConnection) return;
    
    // Get current settings
    const settings = WebRtcBandwidthManager.getBandwidthSettings();
    
    // Check if adaptive bitrate is enabled
    if (!settings.adaptiveBitrate) return;
    
    // Check for poor network conditions
    const highPacketLoss = stats.packetsReceived > 0 &&
      (stats.packetsLost / (stats.packetsReceived + stats.packetsLost)) > 0.05; // More than 5% packet loss
    
    const highLatency = stats.roundTripTime > 300; // More than 300ms RTT
    
    if (highPacketLoss || highLatency) {
      // Reduce video quality
      const reducedSettings = { ...settings };
      reducedSettings.video.max = Math.max(Math.floor(settings.video.max * 0.8), 100);
      reducedSettings.video.ideal = Math.max(Math.floor(settings.video.ideal * 0.8), 100);
      
      // Apply reduced settings
      WebRtcBandwidthManager.applyBandwidthConstraints(peerConnection, reducedSettings);
      
      console.log('Reducing video quality due to poor network conditions', {
        packetLoss: stats.packetsLost,
        rtt: stats.roundTripTime,
        newMaxBitrate: reducedSettings.video.max,
      });
    } else if (stats.bitsPerSecondReceived > 0 && stats.roundTripTime < 100) {
      // Good network conditions, check if we can increase quality
      const currentMaxBitrate = settings.video.max;
      
      // Only increase if we're below the default max
      const defaultSettings = WebRtcBandwidthManager.getDefaultBandwidthSettings();
      if (currentMaxBitrate < defaultSettings.video.max) {
        // Increase video quality gradually
        const increasedSettings = { ...settings };
        increasedSettings.video.max = Math.min(Math.floor(settings.video.max * 1.1), defaultSettings.video.max);
        increasedSettings.video.ideal = Math.min(Math.floor(settings.video.ideal * 1.1), defaultSettings.video.ideal);
        
        // Apply increased settings
        WebRtcBandwidthManager.applyBandwidthConstraints(peerConnection, increasedSettings);
        
        console.log('Increasing video quality due to good network conditions', {
          bitrate: stats.bitsPerSecondReceived,
          rtt: stats.roundTripTime,
          newMaxBitrate: increasedSettings.video.max,
        });
      }
    }
  }

  /**
   * Create a connection to a peer
   * @param peerId Peer ID
   * @returns WebRTC connection
   */
  public createConnection(peerId: string): WebRtcConnection {
    // Create a new connection
    const connection = new WebRtcConnection(peerId, {
      iceServers: WebRtcIceServers.getIceServers(),
      iceCandidatePoolSize: 10,
    });

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
    
    // Apply bandwidth constraints
    WebRtcBandwidthManager.applyBandwidthConstraints(connection.getPeerConnection());
    
    // Start bandwidth monitoring
    this.startBandwidthMonitoring(connection);

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
    // Stop bandwidth monitoring
    const stopMonitoring = this.monitoringIntervals.get(peerId);
    if (stopMonitoring) {
      stopMonitoring();
      this.monitoringIntervals.delete(peerId);
    }
    
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
      // Stop bandwidth monitoring
      const stopMonitoring = this.monitoringIntervals.get(peerId);
      if (stopMonitoring) {
        stopMonitoring();
        this.monitoringIntervals.delete(peerId);
      }
      
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