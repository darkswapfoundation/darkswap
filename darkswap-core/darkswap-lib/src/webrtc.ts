/**
 * WebRTC functionality for darkswap-lib
 */

import { DarkSwapNetwork } from 'darkswap-web-sys';
import { PeerId } from './types';

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
 * WebRTC connection event
 */
export type WebRtcConnectionEvent =
  | { type: 'stateChange'; state: WebRtcConnectionState }
  | { type: 'message'; data: Uint8Array }
  | { type: 'iceCandidate'; candidate: string; sdpMid: string; sdpMLineIndex: number };

/**
 * WebRTC connection
 */
export class WebRtcConnection {
  private state: WebRtcConnectionState = WebRtcConnectionState.New;
  private eventListeners: Map<string, Array<(event: WebRtcConnectionEvent) => void>> = new Map();

  /**
   * Create a new WebRTC connection
   * @param peerId Peer ID
   * @param darkswapNetwork DarkSwap network
   */
  constructor(
    public readonly peerId: PeerId,
    private readonly darkswapNetwork: DarkSwapNetwork,
  ) {}

  /**
   * Create an offer
   * @returns SDP offer
   */
  async createOffer(): Promise<string> {
    try {
      await this.darkswapNetwork.create_webrtc_connection(this.peerId);
      
      // Set up ICE candidate handler
      await this.darkswapNetwork.on_ice_candidate(this.peerId, (candidate: string, sdpMid: string, sdpMLineIndex: number) => {
        this.emitEvent({
          type: 'iceCandidate',
          candidate,
          sdpMid,
          sdpMLineIndex,
        });
      });
      
      // Set up message handler
      await this.darkswapNetwork.on_webrtc_message(this.peerId, (data: Uint8Array) => {
        this.emitEvent({
          type: 'message',
          data,
        });
      });
      
      this.setState(WebRtcConnectionState.Connecting);
      
      // In a real implementation, this would return the actual offer
      // For now, we'll just return a dummy offer
      return `dummy_offer_for_${this.peerId}`;
    } catch (error) {
      this.setState(WebRtcConnectionState.Failed);
      throw error;
    }
  }

  /**
   * Process an offer
   * @param offer SDP offer
   * @returns SDP answer
   */
  async processOffer(offer: string): Promise<string> {
    try {
      const answer = await this.darkswapNetwork.process_webrtc_offer(this.peerId, offer);
      
      // Set up ICE candidate handler
      await this.darkswapNetwork.on_ice_candidate(this.peerId, (candidate: string, sdpMid: string, sdpMLineIndex: number) => {
        this.emitEvent({
          type: 'iceCandidate',
          candidate,
          sdpMid,
          sdpMLineIndex,
        });
      });
      
      // Set up message handler
      await this.darkswapNetwork.on_webrtc_message(this.peerId, (data: Uint8Array) => {
        this.emitEvent({
          type: 'message',
          data,
        });
      });
      
      this.setState(WebRtcConnectionState.Connecting);
      
      return answer;
    } catch (error) {
      this.setState(WebRtcConnectionState.Failed);
      throw error;
    }
  }

  /**
   * Process an answer
   * @param answer SDP answer
   */
  async processAnswer(answer: string): Promise<void> {
    try {
      await this.darkswapNetwork.process_webrtc_answer(this.peerId, answer);
    } catch (error) {
      this.setState(WebRtcConnectionState.Failed);
      throw error;
    }
  }

  /**
   * Add an ICE candidate
   * @param candidate ICE candidate
   * @param sdpMid SDP mid
   * @param sdpMLineIndex SDP m-line index
   */
  async addIceCandidate(candidate: string, sdpMid: string, sdpMLineIndex: number): Promise<void> {
    try {
      await this.darkswapNetwork.add_ice_candidate(this.peerId, candidate, sdpMid, sdpMLineIndex);
    } catch (error) {
      this.setState(WebRtcConnectionState.Failed);
      throw error;
    }
  }

  /**
   * Send data
   * @param data Data to send
   */
  async sendData(data: Uint8Array): Promise<void> {
    if (this.state !== WebRtcConnectionState.Connected) {
      throw new Error('WebRTC connection not connected');
    }
    
    try {
      await this.darkswapNetwork.send_webrtc_data(this.peerId, data);
    } catch (error) {
      this.setState(WebRtcConnectionState.Failed);
      throw error;
    }
  }

  /**
   * Close the connection
   */
  close(): void {
    this.setState(WebRtcConnectionState.Closed);
  }

  /**
   * Get the connection state
   * @returns Connection state
   */
  getState(): WebRtcConnectionState {
    return this.state;
  }

  /**
   * Set the connection state
   * @param state New state
   */
  private setState(state: WebRtcConnectionState): void {
    if (this.state === state) {
      return;
    }
    
    this.state = state;
    
    this.emitEvent({
      type: 'stateChange',
      state,
    });
  }

  /**
   * Add an event listener
   * @param type Event type
   * @param listener Event listener
   */
  addEventListener(type: WebRtcConnectionEvent['type'], listener: (event: WebRtcConnectionEvent) => void): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  /**
   * Remove an event listener
   * @param type Event type
   * @param listener Event listener
   */
  removeEventListener(type: WebRtcConnectionEvent['type'], listener: (event: WebRtcConnectionEvent) => void): void {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(type, listeners);
    }
  }

  /**
   * Emit an event
   * @param event Event to emit
   */
  private emitEvent(event: WebRtcConnectionEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    }
  }
}

/**
 * WebRTC manager
 */
export class WebRtcManager {
  private connections: Map<PeerId, WebRtcConnection> = new Map();

  /**
   * Create a new WebRTC manager
   * @param darkswapNetwork DarkSwap network
   */
  constructor(private readonly darkswapNetwork: DarkSwapNetwork) {}

  /**
   * Create a connection to a peer
   * @param peerId Peer ID
   * @returns WebRTC connection
   */
  createConnection(peerId: PeerId): WebRtcConnection {
    if (this.connections.has(peerId)) {
      return this.connections.get(peerId)!;
    }
    
    const connection = new WebRtcConnection(peerId, this.darkswapNetwork);
    this.connections.set(peerId, connection);
    
    return connection;
  }

  /**
   * Get a connection to a peer
   * @param peerId Peer ID
   * @returns WebRTC connection or undefined if not found
   */
  getConnection(peerId: PeerId): WebRtcConnection | undefined {
    return this.connections.get(peerId);
  }

  /**
   * Remove a connection to a peer
   * @param peerId Peer ID
   * @returns Whether the connection was removed
   */
  removeConnection(peerId: PeerId): boolean {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.close();
      return this.connections.delete(peerId);
    }
    
    return false;
  }

  /**
   * Get all connections
   * @returns All connections
   */
  getAllConnections(): WebRtcConnection[] {
    return Array.from(this.connections.values());
  }
}