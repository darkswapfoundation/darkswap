/**
 * WebRTC Connection
 * 
 * This class handles WebRTC peer connections for the P2P network.
 * It provides a simple interface for establishing connections,
 * sending and receiving data, and handling connection events.
 */

// Connection state
export enum ConnectionState {
  NEW = 'new',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  CLOSED = 'closed',
}

// Connection options
export interface WebRtcConnectionOptions {
  iceServers?: RTCIceServer[];
  timeout?: number;
  reliable?: boolean;
  ordered?: boolean;
  maxRetransmits?: number;
  maxPacketLifeTime?: number;
}

/**
 * WebRTC Connection
 */
export class WebRtcConnection {
  private peerId: string;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private state: ConnectionState = ConnectionState.NEW;
  private options: WebRtcConnectionOptions;
  private messageQueue: any[] = [];
  private connectionTimeout: NodeJS.Timeout | null = null;

  // Event handlers
  public onConnected: (() => void) | null = null;
  public onDisconnected: (() => void) | null = null;
  public onMessage: ((data: any) => void) | null = null;
  public onError: ((error: Error) => void) | null = null;

  /**
   * Create a new WebRTC connection
   * @param peerId Peer ID
   * @param options Connection options
   */
  constructor(peerId: string, options: WebRtcConnectionOptions = {}) {
    this.peerId = peerId;
    this.options = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      timeout: 30000, // 30 seconds
      reliable: true,
      ordered: true,
      ...options,
    };
  }

  /**
   * Get peer ID
   * @returns Peer ID
   */
  public getPeerId(): string {
    return this.peerId;
  }

  /**
   * Get connection state
   * @returns Connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   * @returns True if connected
   */
  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED;
  }

  /**
   * Connect to peer
   * @returns Promise that resolves when connected
   */
  public async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTED) {
      return;
    }

    if (this.state === ConnectionState.CONNECTING) {
      return new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.state === ConnectionState.CONNECTED) {
            clearInterval(checkInterval);
            resolve();
          } else if (this.state === ConnectionState.FAILED || this.state === ConnectionState.CLOSED) {
            clearInterval(checkInterval);
            reject(new Error(`Connection failed: ${this.state}`));
          }
        }, 100);
      });
    }

    this.state = ConnectionState.CONNECTING;

    try {
      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.options.iceServers,
      });

      // Set up event handlers
      this.setupPeerConnectionEvents();

      // Create data channel
      this.dataChannel = this.peerConnection.createDataChannel('data', {
        ordered: this.options.ordered,
        maxRetransmits: this.options.maxRetransmits,
        maxPacketLifeTime: this.options.maxPacketLifeTime,
      });

      // Set up data channel events
      this.setupDataChannelEvents();

      // Set connection timeout
      this.setConnectionTimeout();

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // In a real implementation, this would send the offer to the peer
      // through a signaling server and wait for an answer
      console.log(`Created offer for peer ${this.peerId}`);

      // For now, we'll simulate a successful connection
      setTimeout(() => {
        this.handleConnected();
      }, 1000);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Disconnect from peer
   */
  public disconnect(): void {
    if (this.state === ConnectionState.DISCONNECTED || this.state === ConnectionState.CLOSED) {
      return;
    }

    this.state = ConnectionState.DISCONNECTED;

    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Call disconnected handler
    if (this.onDisconnected) {
      this.onDisconnected();
    }
  }

  /**
   * Send data to peer
   * @param data Data to send
   * @returns True if sent successfully
   */
  public send(data: any): boolean {
    if (!this.isConnected()) {
      // Queue message if not connected
      this.messageQueue.push(data);
      return false;
    }

    try {
      // Serialize data
      const serialized = JSON.stringify(data);

      // Send data
      this.dataChannel!.send(serialized);

      return true;
    } catch (error) {
      console.error(`Error sending data to peer ${this.peerId}:`, error);
      return false;
    }
  }

  /**
   * Set up peer connection events
   */
  private setupPeerConnectionEvents(): void {
    if (!this.peerConnection) {
      return;
    }

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, this would send the ICE candidate to the peer
        // through a signaling server
        console.log(`Generated ICE candidate for peer ${this.peerId}`);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state changed to ${this.peerConnection?.iceConnectionState} for peer ${this.peerId}`);

      switch (this.peerConnection?.iceConnectionState) {
        case 'connected':
        case 'completed':
          this.handleConnected();
          break;
        case 'disconnected':
          this.handleDisconnected();
          break;
        case 'failed':
          this.handleError(new Error('ICE connection failed'));
          break;
        case 'closed':
          this.handleDisconnected();
          break;
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      console.log(`Received data channel from peer ${this.peerId}`);
      this.dataChannel = event.channel;
      this.setupDataChannelEvents();
    };
  }

  /**
   * Set up data channel events
   */
  private setupDataChannelEvents(): void {
    if (!this.dataChannel) {
      return;
    }

    this.dataChannel.onopen = () => {
      console.log(`Data channel opened for peer ${this.peerId}`);
      this.handleConnected();
    };

    this.dataChannel.onclose = () => {
      console.log(`Data channel closed for peer ${this.peerId}`);
      this.handleDisconnected();
    };

    this.dataChannel.onerror = (event) => {
      console.error(`Data channel error for peer ${this.peerId}:`, event);
      this.handleError(new Error('Data channel error'));
    };

    this.dataChannel.onmessage = (event) => {
      try {
        // Parse data
        const data = JSON.parse(event.data);

        // Call message handler
        if (this.onMessage) {
          this.onMessage(data);
        }
      } catch (error) {
        console.error(`Error parsing message from peer ${this.peerId}:`, error);
      }
    };
  }

  /**
   * Set connection timeout
   */
  private setConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    this.connectionTimeout = setTimeout(() => {
      if (this.state === ConnectionState.CONNECTING) {
        this.handleError(new Error('Connection timeout'));
      }
    }, this.options.timeout);
  }

  /**
   * Handle connected
   */
  private handleConnected(): void {
    if (this.state === ConnectionState.CONNECTED) {
      return;
    }

    this.state = ConnectionState.CONNECTED;

    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Send queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }

    // Call connected handler
    if (this.onConnected) {
      this.onConnected();
    }
  }

  /**
   * Handle disconnected
   */
  private handleDisconnected(): void {
    if (this.state === ConnectionState.DISCONNECTED || this.state === ConnectionState.CLOSED) {
      return;
    }

    this.state = ConnectionState.DISCONNECTED;

    // Call disconnected handler
    if (this.onDisconnected) {
      this.onDisconnected();
    }
  }

  /**
   * Handle error
   * @param error Error
   */
  private handleError(error: Error): void {
    console.error(`WebRTC connection error for peer ${this.peerId}:`, error);

    this.state = ConnectionState.FAILED;

    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Call error handler
    if (this.onError) {
      this.onError(error);
    }

    // Disconnect
    this.disconnect();
  }
}

export default WebRtcConnection;