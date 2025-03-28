/**
 * Type declarations for darkswap-web-sys
 */

declare module 'darkswap-web-sys' {
  /**
   * DarkSwap network for WebAssembly
   */
  export class DarkSwapNetwork {
    /**
     * Create a new DarkSwapNetwork
     */
    constructor();

    /**
     * Get the local peer ID
     */
    local_peer_id(): string;

    /**
     * Connect to a peer
     * @param addr The multiaddress to connect to
     */
    connect(addr: string): Promise<void>;

    /**
     * Connect to a peer through a relay
     * @param relayPeerId The relay peer ID
     * @param dstPeerId The destination peer ID
     */
    connect_through_relay(relayPeerId: string, dstPeerId: string): Promise<void>;

    /**
     * Listen on the given address
     * @param addr The multiaddress to listen on
     */
    listen_on(addr: string): Promise<void>;

    /**
     * Subscribe to a topic
     * @param topic The topic to subscribe to
     */
    subscribe(topic: string): void;

    /**
     * Unsubscribe from a topic
     * @param topic The topic to unsubscribe from
     */
    unsubscribe(topic: string): void;

    /**
     * Publish a message to a topic
     * @param topic The topic to publish to
     * @param message The message to publish
     */
    publish(topic: string, message: Uint8Array): Promise<void>;

    /**
     * Register a callback for peer connection events
     * @param callback The callback function
     */
    on_peer_connected(callback: (peerId: string) => void): void;

    /**
     * Register a callback for peer disconnection events
     * @param callback The callback function
     */
    on_peer_disconnected(callback: (peerId: string) => void): void;

    /**
     * Register a callback for message events
     * @param callback The callback function
     */
    on_message(callback: (peerId: string, topic: string, message: Uint8Array) => void): void;

    /**
     * Register a callback for relay reservation events
     * @param callback The callback function
     */
    on_relay_reserved(callback: (relayPeerId: string, reservationId: number) => void): void;

    /**
     * Register a callback for connected through relay events
     * @param callback The callback function
     */
    on_connected_through_relay(callback: (relayPeerId: string, dstPeerId: string) => void): void;
  }
}