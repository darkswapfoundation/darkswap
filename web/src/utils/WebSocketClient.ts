/**
 * WebSocket client for connecting to the DarkSwap daemon
 */

import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;

  /**
   * Create a new WebSocket client
   * @param url WebSocket URL
   * @param reconnectInterval Reconnect interval in milliseconds
   * @param maxReconnectAttempts Maximum number of reconnect attempts
   */
  constructor(url: string, reconnectInterval: number = 5000, maxReconnectAttempts: number = 10) {
    super();
    this.url = url;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = this.onOpen.bind(this);
      this.ws.onmessage = this.onMessage.bind(this);
      this.ws.onclose = this.onClose.bind(this);
      this.ws.onerror = this.onError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Send a message to the WebSocket server
   * @param type Message type
   * @param payload Message payload
   */
  public send(type: string, payload: any): void {
    if (!this.isConnected) {
      console.warn('Cannot send message: WebSocket is not connected');
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
    };

    this.ws?.send(JSON.stringify(message));
  }

  /**
   * Handle WebSocket open event
   */
  private onOpen(): void {
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.emit('connected');
    console.log('WebSocket connected');
  }

  /**
   * Handle WebSocket message event
   * @param event WebSocket message event
   */
  private onMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.emit('message', message);
      this.emit(message.type, message.payload);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   * @param event WebSocket close event
   */
  private onClose(event: CloseEvent): void {
    this.isConnected = false;
    this.isConnecting = false;
    this.ws = null;

    console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
    this.emit('disconnected', event);

    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket error event
   * @param event WebSocket error event
   */
  private onError(event: Event): void {
    console.error('WebSocket error:', event);
    this.emit('error', event);
  }

  /**
   * Schedule a reconnect attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnect attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Check if the WebSocket is connected
   */
  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

export default WebSocketClient;