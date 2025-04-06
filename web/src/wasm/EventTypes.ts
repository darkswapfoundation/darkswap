/**
 * EventTypes - Event types for DarkSwap WebAssembly module
 * 
 * This file defines the event types and interfaces for the DarkSwap WebAssembly module.
 */

import { Order, Trade } from './DarkSwapWasm';

// Event types
export enum EventType {
  // P2P events
  PeerConnected = 'peer_connected',
  PeerDisconnected = 'peer_disconnected',
  RelayConnected = 'relay_connected',
  RelayDisconnected = 'relay_disconnected',
  NetworkHealthChanged = 'network_health_changed',
  
  // Order events
  OrderCreated = 'order_created',
  OrderCancelled = 'order_cancelled',
  OrderFilled = 'order_filled',
  OrderExpired = 'order_expired',
  
  // Trade events
  TradeExecuted = 'trade_executed',
  
  // Wallet events
  WalletConnected = 'wallet_connected',
  WalletDisconnected = 'wallet_disconnected',
  WalletBalanceChanged = 'wallet_balance_changed',
  
  // Error events
  Error = 'error',
}

// Base event interface
export interface BaseEvent {
  type: EventType;
}

// Peer connected event
export interface PeerConnectedEvent extends BaseEvent {
  type: EventType.PeerConnected;
  data: {
    id: string;
    address: string;
    connected: boolean;
    lastSeen: number;
  };
}

// Peer disconnected event
export interface PeerDisconnectedEvent extends BaseEvent {
  type: EventType.PeerDisconnected;
  data: {
    id: string;
  };
}

// Relay connected event
export interface RelayConnectedEvent extends BaseEvent {
  type: EventType.RelayConnected;
  data: {
    url: string;
  };
}

// Relay disconnected event
export interface RelayDisconnectedEvent extends BaseEvent {
  type: EventType.RelayDisconnected;
  data: {
    url: string;
  };
}

// Network health changed event
export interface NetworkHealthChangedEvent extends BaseEvent {
  type: EventType.NetworkHealthChanged;
  data: {
    health: 'good' | 'fair' | 'poor';
  };
}

// Order created event
export interface OrderCreatedEvent extends BaseEvent {
  type: EventType.OrderCreated;
  data: Order;
}

// Order cancelled event
export interface OrderCancelledEvent extends BaseEvent {
  type: EventType.OrderCancelled;
  data: {
    id: string;
  };
}

// Order filled event
export interface OrderFilledEvent extends BaseEvent {
  type: EventType.OrderFilled;
  data: Order;
}

// Order expired event
export interface OrderExpiredEvent extends BaseEvent {
  type: EventType.OrderExpired;
  data: {
    id: string;
  };
}

// Trade executed event
export interface TradeExecutedEvent extends BaseEvent {
  type: EventType.TradeExecuted;
  data: Trade;
}

// Wallet connected event
export interface WalletConnectedEvent extends BaseEvent {
  type: EventType.WalletConnected;
  data: {
    address: string;
  };
}

// Wallet disconnected event
export interface WalletDisconnectedEvent extends BaseEvent {
  type: EventType.WalletDisconnected;
  data: {
    address: string;
  };
}

// Wallet balance changed event
export interface WalletBalanceChangedEvent extends BaseEvent {
  type: EventType.WalletBalanceChanged;
  data: {
    address: string;
    balance: string;
  };
}

// Error event
export interface ErrorEvent extends BaseEvent {
  type: EventType.Error;
  data: {
    message: string;
    code?: number;
  };
}

// Union of all event types
export type Event =
  | PeerConnectedEvent
  | PeerDisconnectedEvent
  | RelayConnectedEvent
  | RelayDisconnectedEvent
  | NetworkHealthChangedEvent
  | OrderCreatedEvent
  | OrderCancelledEvent
  | OrderFilledEvent
  | OrderExpiredEvent
  | TradeExecutedEvent
  | WalletConnectedEvent
  | WalletDisconnectedEvent
  | WalletBalanceChangedEvent
  | ErrorEvent;

// Event listener type
export type EventListener<T extends Event> = (event: T) => void;

// Generic event listener type
export type GenericEventListener = (event: Event) => void;