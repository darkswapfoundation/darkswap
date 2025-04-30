/**
 * Circuit Relay Service
 * 
 * This service provides circuit relay functionality for NAT traversal.
 * It helps peers behind restrictive firewalls to connect to each other
 * through a relay node.
 */

import WebRtcConnection, { ConnectionState } from '../utils/WebRtcConnection';

// Relay types
export enum RelayType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  BOOTSTRAP = 'bootstrap',
}

// Relay info
export interface RelayInfo {
  id: string;
  type: RelayType;
  address: string;
  isConnected: boolean;
  latency?: number;
  bandwidth?: number;
  lastSeen?: number;
  metadata?: Record<string, any>;
}

// Relay connection
export interface RelayConnection {
  relayId: string;
  connection: WebRtcConnection;
  isActive: boolean;
  establishedAt: number;
}

// Relay route
export interface RelayRoute {
  sourcePeerId: string;
  targetPeerId: string;
  relayId: string;
  establishedAt: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

// Circuit relay options
export interface CircuitRelayOptions {
  relays?: string[];
  maxRelays?: number;
  connectionTimeout?: number;
  reconnectInterval?: number;
  routeTimeout?: number;
  enableAutoRelay?: boolean;
}

// Circuit relay events
export enum CircuitRelayEventType {
  RELAY_CONNECTED = 'relay_connected',
  RELAY_DISCONNECTED = 'relay_disconnected',
  ROUTE_ESTABLISHED = 'route_established',
  ROUTE_CLOSED = 'route_closed',
  ERROR = 'error',
}

// Circuit relay event
export interface CircuitRelayEvent {
  type: CircuitRelayEventType;
  data?: any;
  timestamp: number;
}

// Circuit relay event listener
export type CircuitRelayEventListener = (event: CircuitRelayEvent) => void;

/**
 * Circuit Relay Service
 */
export class CircuitRelayService {
  private static instance: CircuitRelayService;
  private options: CircuitRelayOptions;
  private relays: Map<string, RelayInfo> = new Map();
  private relayConnections: Map<string, RelayConnection> = new Map();
  private routes: Map<string, RelayRoute> = new Map();
  private eventListeners: Map<CircuitRelayEventType, CircuitRelayEventListener[]> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;

  /**
   * Get the singleton instance of the service
   * @param options Circuit relay options
   * @returns CircuitRelayService instance
   */
  public static getInstance(options?: CircuitRelayOptions): CircuitRelayService {
    if (!CircuitRelayService.instance) {
      CircuitRelayService.instance = new CircuitRelayService(options);
    } else if (options) {
      CircuitRelayService.instance.updateOptions(options);
    }
    return CircuitRelayService.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   * @param options Circuit relay options
   */
  private constructor(options?: CircuitRelayOptions) {
    this.options = {
      relays: [],
      maxRelays: 3,
      connectionTimeout: 30000, // 30 seconds
      reconnectInterval: 60000, // 1 minute
      routeTimeout: 300000, // 5 minutes
      enableAutoRelay: true,
      ...options,
    };

    // Initialize with default relays
    this.initializeDefaultRelays();
  }

  /**
   * Initialize default relays
   */
  private initializeDefaultRelays(): void {
    // Add bootstrap relays
    const bootstrapRelays = [
      {
        id: 'relay-1.darkswap.io',
        type: RelayType.BOOTSTRAP,
        address: 'relay-1.darkswap.io',
        isConnected: false,
      },
      {
        id: 'relay-2.darkswap.io',
        type: RelayType.BOOTSTRAP,
        address: 'relay-2.darkswap.io',
        isConnected: false,
      },
    ];

    for (const relay of bootstrapRelays) {
      this.relays.set(relay.id, relay);
    }

    // Add user-specified relays
    if (this.options.relays) {
      for (const relayAddress of this.options.relays) {
        this.addRelay(relayAddress, RelayType.PUBLIC);
      }
    }
  }

  /**
   * Update options
   * @param options Circuit relay options
   */
  public updateOptions(options: Partial<CircuitRelayOptions>): void {
    this.options = { ...this.options, ...options };

    // Add new relays if provided
    if (options.relays) {
      for (const relayAddress of options.relays) {
        this.addRelay(relayAddress, RelayType.PUBLIC);
      }
    }
  }

  /**
   * Add event listener
   * @param type Event type
   * @param listener Event listener
   */
  public addEventListener(type: CircuitRelayEventType, listener: CircuitRelayEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * Remove event listener
   * @param type Event type
   * @param listener Event listener
   */
  public removeEventListener(type: CircuitRelayEventType, listener: CircuitRelayEventListener): void {
    if (!this.eventListeners.has(type)) {
      return;
    }
    const listeners = this.eventListeners.get(type)!;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Dispatch event
   * @param type Event type
   * @param data Event data
   */
  private dispatchEvent(type: CircuitRelayEventType, data?: any): void {
    if (!this.eventListeners.has(type)) {
      return;
    }
    const event: CircuitRelayEvent = {
      type,
      data,
      timestamp: Date.now(),
    };
    this.eventListeners.get(type)!.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Start the circuit relay service
   */
  public async start(): Promise<void> {
    try {
      // Connect to relays
      await this.connectToRelays();

      // Start reconnect interval
      this.startReconnectInterval();
    } catch (error) {
      console.error('Error starting circuit relay service:', error);
      this.dispatchEvent(CircuitRelayEventType.ERROR, {
        message: 'Failed to start circuit relay service',
        error,
      });
    }
  }

  /**
   * Stop the circuit relay service
   */
  public stop(): void {
    // Stop reconnect interval
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    // Disconnect from all relays
    this.disconnectFromAllRelays();

    // Close all routes
    this.closeAllRoutes();
  }

  /**
   * Start reconnect interval
   */
  private startReconnectInterval(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.reconnectInterval = setInterval(() => {
      this.reconnectToDisconnectedRelays();
    }, this.options.reconnectInterval);
  }

  /**
   * Add relay
   * @param address Relay address
   * @param type Relay type
   * @returns Relay ID
   */
  public addRelay(address: string, type: RelayType = RelayType.PUBLIC): string {
    // Check if relay already exists
    for (const [id, relay] of this.relays.entries()) {
      if (relay.address === address) {
        return id;
      }
    }

    // Create new relay
    const id = `relay-${Math.random().toString(36).substring(2, 15)}`;
    const relay: RelayInfo = {
      id,
      type,
      address,
      isConnected: false,
      lastSeen: Date.now(),
    };

    // Add relay
    this.relays.set(id, relay);

    // Connect to relay if auto-relay is enabled
    if (this.options.enableAutoRelay) {
      this.connectToRelay(id);
    }

    return id;
  }

  /**
   * Remove relay
   * @param relayId Relay ID
   */
  public removeRelay(relayId: string): void {
    // Check if relay exists
    if (!this.relays.has(relayId)) {
      return;
    }

    // Disconnect from relay
    this.disconnectFromRelay(relayId);

    // Remove relay
    this.relays.delete(relayId);
  }

  /**
   * Connect to relays
   */
  private async connectToRelays(): Promise<void> {
    // Get relays to connect to
    const relaysToConnect = Array.from(this.relays.keys()).slice(0, this.options.maxRelays);

    // Connect to relays
    for (const relayId of relaysToConnect) {
      await this.connectToRelay(relayId);
    }
  }

  /**
   * Connect to relay
   * @param relayId Relay ID
   * @returns Success status
   */
  public async connectToRelay(relayId: string): Promise<boolean> {
    try {
      // Check if relay exists
      const relay = this.relays.get(relayId);
      if (!relay) {
        return false;
      }

      // Check if already connected
      if (relay.isConnected) {
        return true;
      }

      // Create connection
      const connection = new WebRtcConnection(relayId);

      // Set up connection event handlers
      connection.onConnected = () => {
        this.handleRelayConnected(relayId);
      };

      connection.onDisconnected = () => {
        this.handleRelayDisconnected(relayId);
      };

      connection.onError = (error: Error) => {
        this.handleRelayError(relayId, error);
      };

      connection.onMessage = (data: any) => {
        this.handleRelayMessage(relayId, data);
      };

      // Connect to relay
      await connection.connect();

      // Store connection
      this.relayConnections.set(relayId, {
        relayId,
        connection,
        isActive: true,
        establishedAt: Date.now(),
      });

      return true;
    } catch (error) {
      console.error(`Error connecting to relay ${relayId}:`, error);
      return false;
    }
  }

  /**
   * Disconnect from relay
   * @param relayId Relay ID
   */
  public disconnectFromRelay(relayId: string): void {
    try {
      // Check if relay exists
      if (!this.relays.has(relayId)) {
        return;
      }

      // Get relay connection
      const relayConnection = this.relayConnections.get(relayId);
      if (!relayConnection) {
        return;
      }

      // Disconnect
      relayConnection.connection.disconnect();

      // Remove connection
      this.relayConnections.delete(relayId);

      // Update relay info
      const relay = this.relays.get(relayId);
      if (relay) {
        relay.isConnected = false;
        relay.lastSeen = Date.now();
      }

      // Close routes through this relay
      this.closeRoutesForRelay(relayId);
    } catch (error) {
      console.error(`Error disconnecting from relay ${relayId}:`, error);
    }
  }

  /**
   * Disconnect from all relays
   */
  public disconnectFromAllRelays(): void {
    for (const relayId of this.relayConnections.keys()) {
      this.disconnectFromRelay(relayId);
    }
  }

  /**
   * Reconnect to disconnected relays
   */
  private async reconnectToDisconnectedRelays(): Promise<void> {
    try {
      // Get disconnected relays
      const disconnectedRelays = Array.from(this.relays.values())
        .filter((relay) => !relay.isConnected)
        .map((relay) => relay.id);

      // Connect to relays
      for (const relayId of disconnectedRelays) {
        await this.connectToRelay(relayId);
      }
    } catch (error) {
      console.error('Error reconnecting to relays:', error);
    }
  }

  /**
   * Handle relay connected
   * @param relayId Relay ID
   */
  private handleRelayConnected(relayId: string): void {
    // Update relay info
    const relay = this.relays.get(relayId);
    if (relay) {
      relay.isConnected = true;
      relay.lastSeen = Date.now();
    }

    // Dispatch event
    this.dispatchEvent(CircuitRelayEventType.RELAY_CONNECTED, { relayId });
  }

  /**
   * Handle relay disconnected
   * @param relayId Relay ID
   */
  private handleRelayDisconnected(relayId: string): void {
    // Update relay info
    const relay = this.relays.get(relayId);
    if (relay) {
      relay.isConnected = false;
      relay.lastSeen = Date.now();
    }

    // Remove connection
    this.relayConnections.delete(relayId);

    // Close routes through this relay
    this.closeRoutesForRelay(relayId);

    // Dispatch event
    this.dispatchEvent(CircuitRelayEventType.RELAY_DISCONNECTED, { relayId });
  }

  /**
   * Handle relay error
   * @param relayId Relay ID
   * @param error Error
   */
  private handleRelayError(relayId: string, error: Error): void {
    // Update relay info
    const relay = this.relays.get(relayId);
    if (relay) {
      relay.isConnected = false;
      relay.lastSeen = Date.now();
    }

    // Remove connection
    this.relayConnections.delete(relayId);

    // Close routes through this relay
    this.closeRoutesForRelay(relayId);

    // Dispatch event
    this.dispatchEvent(CircuitRelayEventType.ERROR, {
      relayId,
      message: `Relay error: ${error.message}`,
      error,
    });
  }

  /**
   * Handle relay message
   * @param relayId Relay ID
   * @param data Message data
   */
  private handleRelayMessage(relayId: string, data: any): void {
    try {
      // Handle different message types
      if (data.type === 'route_request') {
        this.handleRouteRequest(relayId, data);
      } else if (data.type === 'route_response') {
        this.handleRouteResponse(relayId, data);
      } else if (data.type === 'route_data') {
        this.handleRouteData(relayId, data);
      }
    } catch (error) {
      console.error(`Error handling relay message from ${relayId}:`, error);
    }
  }

  /**
   * Handle route request
   * @param relayId Relay ID
   * @param data Message data
   */
  private handleRouteRequest(relayId: string, data: any): void {
    // In a real implementation, this would handle incoming route requests
    console.log(`Received route request from relay ${relayId}:`, data);
  }

  /**
   * Handle route response
   * @param relayId Relay ID
   * @param data Message data
   */
  private handleRouteResponse(relayId: string, data: any): void {
    // In a real implementation, this would handle route response messages
    console.log(`Received route response from relay ${relayId}:`, data);
  }

  /**
   * Handle route data
   * @param relayId Relay ID
   * @param data Message data
   */
  private handleRouteData(relayId: string, data: any): void {
    // In a real implementation, this would handle data messages sent through a route
    console.log(`Received route data from relay ${relayId}:`, data);
  }

  /**
   * Create route to peer
   * @param targetPeerId Target peer ID
   * @returns Route ID or null if failed
   */
  public async createRoute(targetPeerId: string): Promise<string | null> {
    try {
      // Check if we have any connected relays
      const connectedRelays = Array.from(this.relays.values()).filter((relay) => relay.isConnected);
      if (connectedRelays.length === 0) {
        console.error('No connected relays available');
        return null;
      }

      // Choose a relay
      const relay = connectedRelays[0];
      const relayId = relay.id;

      // Get relay connection
      const relayConnection = this.relayConnections.get(relayId);
      if (!relayConnection) {
        console.error(`No connection to relay ${relayId}`);
        return null;
      }

      // Generate route ID
      const routeId = `route-${Math.random().toString(36).substring(2, 15)}`;

      // Send route request to relay
      const routeRequest = {
        type: 'route_request',
        routeId,
        sourcePeerId: 'self', // In a real implementation, this would be our peer ID
        targetPeerId,
      };
      relayConnection.connection.send(routeRequest);

      // Create route
      const route: RelayRoute = {
        sourcePeerId: 'self',
        targetPeerId,
        relayId,
        establishedAt: Date.now(),
        isActive: true,
      };

      // Store route
      this.routes.set(routeId, route);

      // Dispatch event
      this.dispatchEvent(CircuitRelayEventType.ROUTE_ESTABLISHED, {
        routeId,
        targetPeerId,
        relayId,
      });

      return routeId;
    } catch (error) {
      console.error(`Error creating route to peer ${targetPeerId}:`, error);
      this.dispatchEvent(CircuitRelayEventType.ERROR, {
        message: `Failed to create route to peer ${targetPeerId}`,
        error,
      });
      return null;
    }
  }

  /**
   * Close route
   * @param routeId Route ID
   */
  public closeRoute(routeId: string): void {
    try {
      // Check if route exists
      const route = this.routes.get(routeId);
      if (!route) {
        return;
      }

      // Get relay connection
      const relayConnection = this.relayConnections.get(route.relayId);
      if (relayConnection) {
        // Send route close request to relay
        const routeCloseRequest = {
          type: 'route_close',
          routeId,
        };
        relayConnection.connection.send(routeCloseRequest);
      }

      // Remove route
      this.routes.delete(routeId);

      // Dispatch event
      this.dispatchEvent(CircuitRelayEventType.ROUTE_CLOSED, { routeId });
    } catch (error) {
      console.error(`Error closing route ${routeId}:`, error);
    }
  }

  /**
   * Close routes for relay
   * @param relayId Relay ID
   */
  private closeRoutesForRelay(relayId: string): void {
    // Find routes through this relay
    const routesToClose = Array.from(this.routes.entries())
      .filter(([_, route]) => route.relayId === relayId)
      .map(([routeId, _]) => routeId);

    // Close routes
    for (const routeId of routesToClose) {
      this.closeRoute(routeId);
    }
  }

  /**
   * Close all routes
   */
  private closeAllRoutes(): void {
    for (const routeId of this.routes.keys()) {
      this.closeRoute(routeId);
    }
  }

  /**
   * Send message through route
   * @param routeId Route ID
   * @param message Message
   * @returns Success status
   */
  public sendMessageThroughRoute(routeId: string, message: any): boolean {
    try {
      // Check if route exists
      const route = this.routes.get(routeId);
      if (!route || !route.isActive) {
        return false;
      }

      // Get relay connection
      const relayConnection = this.relayConnections.get(route.relayId);
      if (!relayConnection) {
        return false;
      }

      // Send message through relay
      const routeData = {
        type: 'route_data',
        routeId,
        data: message,
      };
      relayConnection.connection.send(routeData);

      return true;
    } catch (error) {
      console.error(`Error sending message through route ${routeId}:`, error);
      return false;
    }
  }

  /**
   * Get all relays
   * @returns Array of relay info
   */
  public getAllRelays(): RelayInfo[] {
    return Array.from(this.relays.values());
  }

  /**
   * Get connected relays
   * @returns Array of connected relay info
   */
  public getConnectedRelays(): RelayInfo[] {
    return Array.from(this.relays.values()).filter((relay) => relay.isConnected);
  }

  /**
   * Get all routes
   * @returns Array of relay routes
   */
  public getAllRoutes(): RelayRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get active routes
   * @returns Array of active relay routes
   */
  public getActiveRoutes(): RelayRoute[] {
    return Array.from(this.routes.values()).filter((route) => route.isActive);
  }

  /**
   * Get relay info
   * @param relayId Relay ID
   * @returns Relay info or undefined if not found
   */
  public getRelayInfo(relayId: string): RelayInfo | undefined {
    return this.relays.get(relayId);
  }

  /**
   * Get route info
   * @param routeId Route ID
   * @returns Route info or undefined if not found
   */
  public getRouteInfo(routeId: string): RelayRoute | undefined {
    return this.routes.get(routeId);
  }
}

export default CircuitRelayService;