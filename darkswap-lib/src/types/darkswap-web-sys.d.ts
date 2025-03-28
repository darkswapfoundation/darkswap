/**
 * Type definitions for darkswap-web-sys
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
     * @param addr Multiaddr
     */
    connect(addr: string): Promise<void>;

    /**
     * Connect to a peer through a relay
     * @param relay_peer_id Relay peer ID
     * @param dst_peer_id Destination peer ID
     */
    connect_through_relay(relay_peer_id: string, dst_peer_id: string): Promise<void>;

    /**
     * Listen on the given address
     * @param addr Multiaddr
     */
    listen_on(addr: string): Promise<void>;

    /**
     * Subscribe to a topic
     * @param topic Topic
     */
    subscribe(topic: string): void;

    /**
     * Unsubscribe from a topic
     * @param topic Topic
     */
    unsubscribe(topic: string): void;

    /**
     * Publish a message to a topic
     * @param topic Topic
     * @param message Message
     */
    publish(topic: string, message: Uint8Array): Promise<void>;

    /**
     * Register a callback for peer connection events
     * @param callback Callback
     */
    on_peer_connected(callback: (peer_id: string) => void): void;

    /**
     * Register a callback for peer disconnection events
     * @param callback Callback
     */
    on_peer_disconnected(callback: (peer_id: string) => void): void;

    /**
     * Register a callback for message events
     * @param callback Callback
     */
    on_message(callback: (peer_id: string, topic: string, message: Uint8Array) => void): void;

    /**
     * Register a callback for relay reservation events
     * @param callback Callback
     */
    on_relay_reserved(callback: (relay_peer_id: string, reservation_id: number) => void): void;

    /**
     * Register a callback for connected through relay events
     * @param callback Callback
     */
    on_connected_through_relay(callback: (relay_peer_id: string, dst_peer_id: string) => void): void;

    /**
     * Create a WebRTC connection to a peer
     * @param peer_id Peer ID
     */
    create_webrtc_connection(peer_id: string): Promise<void>;

    /**
     * Process a WebRTC offer from a peer
     * @param peer_id Peer ID
     * @param offer SDP offer
     * @returns SDP answer
     */
    process_webrtc_offer(peer_id: string, offer: string): Promise<string>;

    /**
     * Process a WebRTC answer from a peer
     * @param peer_id Peer ID
     * @param answer SDP answer
     */
    process_webrtc_answer(peer_id: string, answer: string): Promise<void>;

    /**
     * Add an ICE candidate from a peer
     * @param peer_id Peer ID
     * @param candidate ICE candidate
     * @param sdp_mid SDP mid
     * @param sdp_m_line_index SDP m-line index
     */
    add_ice_candidate(peer_id: string, candidate: string, sdp_mid: string, sdp_m_line_index: number): Promise<void>;

    /**
     * Send data through a WebRTC data channel
     * @param peer_id Peer ID
     * @param data Data
     */
    send_webrtc_data(peer_id: string, data: Uint8Array): void;

    /**
     * Set up a WebRTC data channel message handler
     * @param peer_id Peer ID
     * @param callback Callback
     */
    on_webrtc_message(peer_id: string, callback: (data: Uint8Array) => void): void;

    /**
     * Set up a WebRTC ICE candidate handler
     * @param peer_id Peer ID
     * @param callback Callback
     */
    on_ice_candidate(peer_id: string, callback: (candidate: string, sdp_mid: string, sdp_m_line_index: number) => void): void;
  }
}