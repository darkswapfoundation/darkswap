/**
 * WebRTC signaling client for the web interface
 */

import { EventEmitter } from 'events';

/**
 * WebRTC signaling message types
 */
export enum SignalingMessageType {
  Register = 'register',
  Offer = 'offer',
  Answer = 'answer',
  IceCandidate = 'ice_candidate',
  Error = 'error',
}

/**
 * WebRTC signaling message
 */
export interface SignalingMessage {
  type: SignalingMessageType;
  payload: any;
}

/**
 * WebRTC signaling client events
 */
export enum SignalingClientEvent {
  Connected = 'connected',
  Disconnected = 'disconnected',
  OfferReceived = 'offer_received',
  AnswerReceived = 'answer_received',
  IceCandidateReceived = 'ice_candidate_received',
  Error = 'error',
}

/**
 * WebRTC signaling client
 */
export class WebRtcSignalingClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private localPeerId: string;
  private serverUrl: string;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 1000;

  /**
   * Create a new WebRTC signaling client
   * @param localPeerId Local peer ID
   * @param serverUrl Signaling server URL
   */
  constructor(localPeerId: string, serverUrl: string) {
    super();
    this.localPeerId = localPeerId;
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to the signaling server
   */
  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('Connected to signaling server');
          this.connected = true;
          this.reconnectAttempts = 0;

          // Register with the server
          this.register();

          this.emit(SignalingClientEvent.Connected);
          resolve();
        };

        this.ws.onclose = () => {
          console.log('Disconnected from signaling server');
          this.connected = false;
          this.emit(SignalingClientEvent.Disconnected);

          // Try to reconnect
          this.reconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit(SignalingClientEvent.Error, error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as SignalingMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };
      } catch (error) {
        console.error('Error connecting to signaling server:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the signaling server
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * Register with the signaling server
   */
  private register(): void {
    const message: SignalingMessage = {
      type: SignalingMessageType.Register,
      payload: {
        peer_id: this.localPeerId,
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send an SDP offer to a peer
   * @param peerId Peer ID
   * @param sdp SDP offer
   */
  public sendOffer(peerId: string, sdp: string): void {
    const message: SignalingMessage = {
      type: SignalingMessageType.Offer,
      payload: {
        from: this.localPeerId,
        to: peerId,
        sdp,
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send an SDP answer to a peer
   * @param peerId Peer ID
   * @param sdp SDP answer
   */
  public sendAnswer(peerId: string, sdp: string): void {
    const message: SignalingMessage = {
      type: SignalingMessageType.Answer,
      payload: {
        from: this.localPeerId,
        to: peerId,
        sdp,
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send an ICE candidate to a peer
   * @param peerId Peer ID
   * @param candidate ICE candidate
   * @param sdpMid SDP mid
   * @param sdpMLineIndex SDP m-line index
   */
  public sendIceCandidate(
    peerId: string,
    candidate: string,
    sdpMid: string,
    sdpMLineIndex: number
  ): void {
    const message: SignalingMessage = {
      type: SignalingMessageType.IceCandidate,
      payload: {
        from: this.localPeerId,
        to: peerId,
        candidate,
        sdp_mid: sdpMid,
        sdp_m_line_index: sdpMLineIndex,
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send a message to the signaling server
   * @param message Message to send
   */
  private sendMessage(message: SignalingMessage): void {
    if (!this.connected || !this.ws) {
      console.error('Not connected to signaling server');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Handle a message from the signaling server
   * @param message Message from the signaling server
   */
  private handleMessage(message: SignalingMessage): void {
    switch (message.type) {
      case SignalingMessageType.Offer:
        this.handleOffer(message.payload);
        break;
      case SignalingMessageType.Answer:
        this.handleAnswer(message.payload);
        break;
      case SignalingMessageType.IceCandidate:
        this.handleIceCandidate(message.payload);
        break;
      case SignalingMessageType.Error:
        this.handleError(message.payload);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Handle an SDP offer from a peer
   * @param payload Offer payload
   */
  private handleOffer(payload: any): void {
    const { from, to, sdp } = payload;

    if (to !== this.localPeerId) {
      return;
    }

    this.emit(SignalingClientEvent.OfferReceived, from, sdp);
  }

  /**
   * Handle an SDP answer from a peer
   * @param payload Answer payload
   */
  private handleAnswer(payload: any): void {
    const { from, to, sdp } = payload;

    if (to !== this.localPeerId) {
      return;
    }

    this.emit(SignalingClientEvent.AnswerReceived, from, sdp);
  }

  /**
   * Handle an ICE candidate from a peer
   * @param payload ICE candidate payload
   */
  private handleIceCandidate(payload: any): void {
    const { from, to, candidate, sdp_mid, sdp_m_line_index } = payload;

    if (to !== this.localPeerId) {
      return;
    }

    this.emit(
      SignalingClientEvent.IceCandidateReceived,
      from,
      candidate,
      sdp_mid,
      sdp_m_line_index
    );
  }

  /**
   * Handle an error from the signaling server
   * @param payload Error payload
   */
  private handleError(payload: any): void {
    const { message } = payload;
    console.error('Signaling server error:', message);
    this.emit(SignalingClientEvent.Error, message);
  }

  /**
   * Try to reconnect to the signaling server
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting to signaling server (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnect failed:', error);
      });
    }, this.reconnectTimeout * this.reconnectAttempts);
  }
}