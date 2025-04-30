/**
 * Network functionality for darkswap-lib
 */

import { DarkSwapNetwork } from 'darkswap-web-sys';
import { NetworkConfig, NetworkEvent, PeerId } from './types';

/**
 * Network class
 */
export class Network {
  private network: DarkSwapNetwork | null = null;
  private eventListeners: Map<string, Array<(event: NetworkEvent) => void>> = new Map();
  private initialized = false;

  /**
   * Create a new Network
   * @param config Network configuration
   */
  constructor(private config: NetworkConfig = {}) {}

  /**
   * Initialize the network
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.network = new DarkSwapNetwork();
    this.setupEventListeners();
    this.initialized = true;

    // Connect to bootstrap peers
    if (this.config.bootstrapPeers) {
      for (const { peerId, address } of this.config.bootstrapPeers) {
        try {
          await this.connect(address);
        } catch (error) {
          console.warn(`Failed to connect to bootstrap peer ${peerId}: ${error}`);
        }
      }
    }

    // Subscribe to topics
    if (this.config.topics) {
      for (const topic of this.config.topics) {
        try {
          this.subscribe(topic);
        } catch (error) {
          console.warn(`Failed to subscribe to topic ${topic}: ${error}`);
        }
      }
    }

    // Connect to relay peers
    if (this.config.relayPeers) {
      for (const { peerId, address } of this.config.relayPeers) {
        try {
          await this.connect(address);
        } catch (error) {
          console.warn(`Failed to connect to relay peer ${peerId}: ${error}`);
        }
      }
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    if (!this.network) {
      throw new Error('Network not initialized');
    }

    this.network.on_peer_connected((peerId: string) => {
      this.emitEvent({
        type: 'peerConnected',
        peerId,
      });
    });

    this.network.on_peer_disconnected((peerId: string) => {
      this.emitEvent({
        type: 'peerDisconnected',
        peerId,
      });
    });

    this.network.on_message((peerId: string, topic: string, message: Uint8Array) => {
      this.emitEvent({
        type: 'messageReceived',
        peerId,
        topic,
        message,
      });
    });

    this.network.on_relay_reserved((relayPeerId: string, reservationId: number) => {
      this.emitEvent({
        type: 'relayReserved',
        relayPeerId,
        reservationId,
      });
    });

    this.network.on_connected_through_relay((relayPeerId: string, dstPeerId: string) => {
      this.emitEvent({
        type: 'connectedThroughRelay',
        relayPeerId,
        dstPeerId,
      });
    });
  }

  /**
   * Emit an event
   * @param event Event to emit
   */
  private emitEvent(event: NetworkEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    }
  }

  /**
   * Get the local peer ID
   * @returns Local peer ID
   */
  getLocalPeerId(): PeerId {
    this.ensureInitialized();
    return this.network!.local_peer_id();
  }

  /**
   * Connect to a peer
   * @param addr Multiaddress to connect to
   */
  async connect(addr: string): Promise<void> {
    this.ensureInitialized();
    await this.network!.connect(addr);
  }

  /**
   * Connect to a peer through a relay
   * @param relayPeerId Relay peer ID
   * @param dstPeerId Destination peer ID
   */
  async connectThroughRelay(relayPeerId: PeerId, dstPeerId: PeerId): Promise<void> {
    this.ensureInitialized();
    await this.network!.connect_through_relay(relayPeerId, dstPeerId);
  }

  /**
   * Listen on the given address
   * @param addr Address to listen on
   */
  async listenOn(addr: string): Promise<void> {
    this.ensureInitialized();
    await this.network!.listen_on(addr);
  }

  /**
   * Subscribe to a topic
   * @param topic Topic to subscribe to
   */
  subscribe(topic: string): void {
    this.ensureInitialized();
    this.network!.subscribe(topic);
  }

  /**
   * Unsubscribe from a topic
   * @param topic Topic to unsubscribe from
   */
  unsubscribe(topic: string): void {
    this.ensureInitialized();
    this.network!.unsubscribe(topic);
  }

  /**
   * Publish a message to a topic
   * @param topic Topic to publish to
   * @param message Message to publish
   */
  async publish(topic: string, message: Uint8Array): Promise<void> {
    this.ensureInitialized();
    await this.network!.publish(topic, message);
  }

  /**
   * Add an event listener
   * @param type Event type
   * @param listener Event listener
   */
  addEventListener(type: NetworkEvent['type'], listener: (event: NetworkEvent) => void): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  /**
   * Remove an event listener
   * @param type Event type
   * @param listener Event listener
   */
  removeEventListener(type: NetworkEvent['type'], listener: (event: NetworkEvent) => void): void {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(type, listeners);
    }
  }

  /**
   * Ensure the network is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.network) {
      throw new Error('Network not initialized');
    }
  }
}