/**
 * types.ts - Common types for the DarkSwap application
 * 
 * This file contains common types used throughout the DarkSwap application.
 */

/**
 * Bitcoin network
 */
export enum BitcoinNetwork {
  /**
   * Mainnet
   */
  Mainnet = 0,
  
  /**
   * Testnet
   */
  Testnet = 1,
  
  /**
   * Regtest
   */
  Regtest = 2,
}

/**
 * Asset type
 */
export enum AssetType {
  /**
   * Bitcoin
   */
  Bitcoin = 0,
  
  /**
   * Rune
   */
  Rune = 1,
  
  /**
   * Alkane
   */
  Alkane = 2,
}

/**
 * Order side
 */
export enum OrderSide {
  /**
   * Buy
   */
  Buy = 0,
  
  /**
   * Sell
   */
  Sell = 1,
}

/**
 * Order status
 */
export enum OrderStatus {
  /**
   * Open
   */
  Open = 0,
  
  /**
   * Filled
   */
  Filled = 1,
  
  /**
   * Cancelled
   */
  Cancelled = 2,
  
  /**
   * Expired
   */
  Expired = 3,
}

/**
 * Trade status
 */
export enum TradeStatus {
  /**
   * Pending
   */
  Pending = 0,
  
  /**
   * Completed
   */
  Completed = 1,
  
  /**
   * Failed
   */
  Failed = 2,
}

/**
 * Wallet type
 */
export enum WalletType {
  /**
   * Simple wallet
   */
  SimpleWallet = 0,
  
  /**
   * BDK wallet
   */
  BdkWallet = 1,
  
  /**
   * External wallet
   */
  ExternalWallet = 2,
}

/**
 * Error code
 */
export enum ErrorCode {
  // WebAssembly errors
  WasmInitFailed = 100,
  WasmExecutionFailed = 101,
  WasmMemoryError = 102,
  
  // Network errors
  ConnectionFailed = 200,
  PeerNotFound = 201,
  MessageTooLarge = 202,
  
  // Order errors
  OrderNotFound = 300,
  OrderAlreadyExists = 301,
  OrderValidationFailed = 302,
  
  // Trade errors
  TradeNotFound = 400,
  TradeExecutionFailed = 401,
  TradeValidationFailed = 402,
  
  // Wallet errors
  WalletNotFound = 500,
  InsufficientFunds = 501,
  SigningFailed = 502,
}

/**
 * Configuration
 */
export interface Config {
  /**
   * Bitcoin network
   */
  bitcoinNetwork: BitcoinNetwork;
  
  /**
   * Relay URL
   */
  relayUrl: string;
  
  /**
   * Listen addresses
   */
  listenAddresses: string[];
  
  /**
   * Bootstrap peers
   */
  bootstrapPeers: string[];
}

/**
 * Order
 */
export interface Order {
  /**
   * Order ID
   */
  id: string;
  
  /**
   * Order side
   */
  side: OrderSide;
  
  /**
   * Base asset
   */
  baseAsset: string;
  
  /**
   * Quote asset
   */
  quoteAsset: string;
  
  /**
   * Amount
   */
  amount: string;
  
  /**
   * Price
   */
  price: string;
  
  /**
   * Timestamp
   */
  timestamp: number;
  
  /**
   * Status
   */
  status: OrderStatus;
  
  /**
   * Maker
   */
  maker: string;
}

/**
 * Trade
 */
export interface Trade {
  /**
   * Trade ID
   */
  id: string;
  
  /**
   * Order ID
   */
  orderId: string;
  
  /**
   * Taker
   */
  taker: string;
  
  /**
   * Maker
   */
  maker: string;
  
  /**
   * Amount
   */
  amount: string;
  
  /**
   * Price
   */
  price: string;
  
  /**
   * Timestamp
   */
  timestamp: number;
  
  /**
   * Status
   */
  status: TradeStatus;
}

/**
 * Wallet
 */
export interface Wallet {
  /**
   * Wallet ID
   */
  id: string;
  
  /**
   * Wallet type
   */
  type: WalletType;
  
  /**
   * Network
   */
  network: BitcoinNetwork;
  
  /**
   * Mnemonic
   */
  mnemonic?: string;
  
  /**
   * Address
   */
  address: string;
}

/**
 * Wallet config
 */
export interface WalletConfig {
  /**
   * Wallet type
   */
  type: WalletType;
  
  /**
   * Network
   */
  network: BitcoinNetwork;
  
  /**
   * Mnemonic
   */
  mnemonic?: string;
  
  /**
   * Private key
   */
  privateKey?: string;
  
  /**
   * External wallet provider
   */
  externalWalletProvider?: string;
}

/**
 * Transaction input
 */
export interface TransactionInput {
  /**
   * Transaction ID
   */
  txid: string;
  
  /**
   * Output index
   */
  vout: number;
  
  /**
   * Sequence
   */
  sequence: number;
  
  /**
   * Script signature
   */
  scriptSig?: string;
  
  /**
   * Witness
   */
  witness?: string[];
}

/**
 * Transaction output
 */
export interface TransactionOutput {
  /**
   * Value
   */
  value: string;
  
  /**
   * Script public key
   */
  scriptPubKey: string;
}

/**
 * Transaction
 */
export interface Transaction {
  /**
   * Inputs
   */
  inputs: TransactionInput[];
  
  /**
   * Outputs
   */
  outputs: TransactionOutput[];
  
  /**
   * Locktime
   */
  locktime: number;
  
  /**
   * Version
   */
  version: number;
}

/**
 * Signed transaction
 */
export interface SignedTransaction {
  /**
   * Transaction
   */
  transaction: Transaction;
  
  /**
   * Signatures
   */
  signatures: string[];
}

/**
 * Peer info
 */
export interface PeerInfo {
  /**
   * Peer ID
   */
  id: string;
  
  /**
   * Addresses
   */
  addresses: string[];
  
  /**
   * Protocols
   */
  protocols: string[];
  
  /**
   * Connected
   */
  connected: boolean;
}

/**
 * Event type
 */
export type EventType = 'order' | 'trade' | 'error' | 'connection' | 'wallet';