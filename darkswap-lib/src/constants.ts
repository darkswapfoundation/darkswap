/**
 * Constants for the DarkSwap TypeScript Library
 */

import { BitcoinNetwork } from './types';

/**
 * Default API URL
 */
export const DEFAULT_API_URL = 'https://api.darkswap.xyz';

/**
 * Default WebSocket URL
 */
export const DEFAULT_WS_URL = 'wss://ws.darkswap.xyz';

/**
 * Default signaling server URL
 */
export const DEFAULT_SIGNALING_URL = 'wss://signaling.darkswap.xyz';

/**
 * Default relay server URL
 */
export const DEFAULT_RELAY_URL = 'wss://relay.darkswap.xyz';

/**
 * Default Bitcoin network
 */
export const DEFAULT_NETWORK = BitcoinNetwork.MAINNET;

/**
 * Default timeout in milliseconds
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Default max peers
 */
export const DEFAULT_MAX_PEERS = 10;

/**
 * Default order expiry in milliseconds (24 hours)
 */
export const DEFAULT_ORDER_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Default trade timeout in milliseconds (5 minutes)
 */
export const DEFAULT_TRADE_TIMEOUT = 5 * 60 * 1000;

/**
 * Default reconnect interval in milliseconds
 */
export const DEFAULT_RECONNECT_INTERVAL = 5000;

/**
 * Default reconnect attempts
 */
export const DEFAULT_RECONNECT_ATTEMPTS = 5;

/**
 * Default heartbeat interval in milliseconds
 */
export const DEFAULT_HEARTBEAT_INTERVAL = 30000;

/**
 * Default bootstrap peers
 */
export const DEFAULT_BOOTSTRAP_PEERS: string[] = [
  '/dns4/bootstrap.darkswap.xyz/tcp/9000/wss/p2p/QmBootstrapPeer1',
  '/dns4/bootstrap2.darkswap.xyz/tcp/9000/wss/p2p/QmBootstrapPeer2',
];

/**
 * Default STUN servers
 */
export const DEFAULT_STUN_SERVERS: string[] = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
];

/**
 * Default TURN servers
 */
export const DEFAULT_TURN_SERVERS: Array<{ urls: string; username?: string; credential?: string }> = [];

/**
 * Bitcoin satoshis per BTC
 */
export const SATOSHIS_PER_BTC = 100000000;

/**
 * Bitcoin dust limit in satoshis
 */
export const BITCOIN_DUST_LIMIT = 546;

/**
 * Bitcoin fee rate in satoshis per byte
 */
export const DEFAULT_FEE_RATE = 10;

/**
 * Bitcoin confirmation target in blocks
 */
export const DEFAULT_CONFIRMATION_TARGET = 6;

/**
 * Bitcoin mainnet explorer URL
 */
export const BITCOIN_MAINNET_EXPLORER_URL = 'https://mempool.space';

/**
 * Bitcoin testnet explorer URL
 */
export const BITCOIN_TESTNET_EXPLORER_URL = 'https://mempool.space/testnet';

/**
 * Bitcoin regtest explorer URL
 */
export const BITCOIN_REGTEST_EXPLORER_URL = 'http://localhost:8080';

/**
 * Get Bitcoin explorer URL for a network
 * @param network Bitcoin network
 * @returns Bitcoin explorer URL
 */
export function getBitcoinExplorerUrl(network: BitcoinNetwork): string {
  switch (network) {
    case BitcoinNetwork.MAINNET:
      return BITCOIN_MAINNET_EXPLORER_URL;
    case BitcoinNetwork.TESTNET:
      return BITCOIN_TESTNET_EXPLORER_URL;
    case BitcoinNetwork.REGTEST:
      return BITCOIN_REGTEST_EXPLORER_URL;
    default:
      return BITCOIN_MAINNET_EXPLORER_URL;
  }
}

/**
 * Get Bitcoin explorer transaction URL
 * @param txid Transaction ID
 * @param network Bitcoin network
 * @returns Bitcoin explorer transaction URL
 */
export function getBitcoinExplorerTxUrl(txid: string, network: BitcoinNetwork = BitcoinNetwork.MAINNET): string {
  return `${getBitcoinExplorerUrl(network)}/tx/${txid}`;
}

/**
 * Get Bitcoin explorer address URL
 * @param address Bitcoin address
 * @param network Bitcoin network
 * @returns Bitcoin explorer address URL
 */
export function getBitcoinExplorerAddressUrl(address: string, network: BitcoinNetwork = BitcoinNetwork.MAINNET): string {
  return `${getBitcoinExplorerUrl(network)}/address/${address}`;
}