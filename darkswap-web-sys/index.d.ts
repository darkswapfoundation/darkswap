/**
 * TypeScript declarations for darkswap-web-sys
 */

/**
 * WebAssembly bindings for DarkSwap
 */
export class DarkSwapWasm {
  /**
   * Create a new DarkSwap instance
   * 
   * @param config_json The configuration JSON
   * @param callback The event callback
   */
  constructor(config_json: string, callback: (event_json: string) => void);
  
  /**
   * Start the DarkSwap instance
   */
  start(): Promise<void>;
  
  /**
   * Stop the DarkSwap instance
   */
  stop(): Promise<void>;
  
  /**
   * Get the local peer ID
   * 
   * @returns The local peer ID
   */
  local_peer_id(): string;
  
  /**
   * Connect to a peer
   * 
   * @param peer_id The peer ID to connect to
   */
  connect_to_peer(peer_id: string): Promise<void>;
  
  /**
   * Connect to a peer via relay
   * 
   * @param peer_id The peer ID to connect to
   * @returns The relay ID
   */
  connect_via_relay(peer_id: string): Promise<string>;
  
  /**
   * Send data to a peer via relay
   * 
   * @param peer_id The peer ID to send data to
   * @param relay_id The relay ID
   * @param data The data to send
   */
  send_via_relay(peer_id: string, relay_id: string, data: Uint8Array): Promise<void>;
  
  /**
   * Close a relay connection
   * 
   * @param relay_id The relay ID
   */
  close_relay(relay_id: string): Promise<void>;
  
  /**
   * Create a trade offer
   * 
   * @param maker_asset_type The maker asset type
   * @param maker_asset_id The maker asset ID
   * @param maker_amount The maker asset amount
   * @param taker_asset_type The taker asset type
   * @param taker_asset_id The taker asset ID
   * @param taker_amount The taker asset amount
   * @param expiration_seconds The expiration time in seconds
   * @returns The trade offer JSON
   */
  create_trade_offer(
    maker_asset_type: string,
    maker_asset_id: string,
    maker_amount: number,
    taker_asset_type: string,
    taker_asset_id: string,
    taker_amount: number,
    expiration_seconds: number,
  ): Promise<string>;
  
  /**
   * Accept a trade offer
   * 
   * @param offer_id The offer ID
   */
  accept_trade_offer(offer_id: string): Promise<void>;
  
  /**
   * Get the Bitcoin balance
   * 
   * @returns The Bitcoin balance in satoshis
   */
  get_bitcoin_balance(): Promise<number>;
  
  /**
   * Get the rune balance
   * 
   * @param rune_id The rune ID
   * @returns The rune balance
   */
  get_rune_balance(rune_id: string): Promise<number>;
  
  /**
   * Get the alkane balance
   * 
   * @param alkane_id The alkane ID
   * @returns The alkane balance
   */
  get_alkane_balance(alkane_id: string): Promise<number>;
  
  /**
   * Get all trade offers
   * 
   * @returns The trade offers JSON
   */
  get_trade_offers(): Promise<string>;
  
  /**
   * Get a trade offer
   * 
   * @param offer_id The offer ID
   * @returns The trade offer JSON
   */
  get_trade_offer(offer_id: string): Promise<string>;
  
  /**
   * Get the trade state
   * 
   * @param offer_id The offer ID
   * @returns The trade state
   */
  get_trade_state(offer_id: string): Promise<string>;
}

/**
 * WebAssembly bindings for the trade protocol
 */
export class TradeProtocolWasm {
  /**
   * Create a new trade protocol
   * 
   * @param psbt_handler The PSBT handler
   * @param rune_handler The rune handler
   * @param alkane_handler The alkane handler
   * @param local_peer_id The local peer ID
   */
  constructor(
    psbt_handler: PsbtHandlerWasm,
    rune_handler: RuneHandlerWasm,
    alkane_handler: AlkaneHandlerWasm,
    local_peer_id: string,
  );
  
  /**
   * Create a trade offer
   * 
   * @param maker_asset_type The maker asset type
   * @param maker_asset_id The maker asset ID
   * @param maker_amount The maker asset amount
   * @param taker_asset_type The taker asset type
   * @param taker_asset_id The taker asset ID
   * @param taker_amount The taker asset amount
   * @param expiration_seconds The expiration time in seconds
   * @returns The trade offer JSON
   */
  create_offer(
    maker_asset_type: string,
    maker_asset_id: string,
    maker_amount: number,
    taker_asset_type: string,
    taker_asset_id: string,
    taker_amount: number,
    expiration_seconds: number,
  ): Promise<string>;
  
  /**
   * Accept a trade offer
   * 
   * @param offer_id The offer ID
   */
  accept_offer(offer_id: string): Promise<void>;
  
  /**
   * Create maker PSBT
   * 
   * @param offer_id The offer ID
   * @returns The PSBT base64
   */
  create_maker_psbt(offer_id: string): Promise<string>;
  
  /**
   * Create taker PSBT
   * 
   * @param offer_id The offer ID
   * @returns The PSBT base64
   */
  create_taker_psbt(offer_id: string): Promise<string>;
  
  /**
   * Sign PSBTs
   * 
   * @param offer_id The offer ID
   * @returns The signed PSBTs
   */
  sign_psbts(offer_id: string): Promise<{ makerPsbt: string; takerPsbt: string }>;
  
  /**
   * Finalize and broadcast PSBTs
   * 
   * @param offer_id The offer ID
   * @returns The transaction IDs
   */
  finalize_and_broadcast(offer_id: string): Promise<{ makerTxid: string; takerTxid: string }>;
  
  /**
   * Get the trade state
   * 
   * @param offer_id The offer ID
   * @returns The trade state
   */
  get_trade_state(offer_id: string): Promise<string>;
  
  /**
   * Get the trade offer
   * 
   * @param offer_id The offer ID
   * @returns The trade offer JSON
   */
  get_trade_offer(offer_id: string): Promise<string>;
  
  /**
   * Get all active trade offers
   * 
   * @returns The trade offers JSON
   */
  get_active_trade_offers(): Promise<string>;
}

/**
 * WebAssembly bindings for the PSBT handler
 */
export class PsbtHandlerWasm {
  /**
   * Create a new PSBT handler
   * 
   * @param wallet The wallet
   */
  constructor(wallet: WalletWasm);
  
  /**
   * Create a PSBT for a trade
   * 
   * @param outputs_json The outputs JSON
   * @param fee_rate The fee rate
   * @returns The PSBT base64
   */
  create_trade_psbt(outputs_json: string, fee_rate: number): Promise<string>;
  
  /**
   * Sign a PSBT
   * 
   * @param psbt_base64 The PSBT base64
   * @returns The signed PSBT base64
   */
  sign_psbt(psbt_base64: string): Promise<string>;
  
  /**
   * Finalize a PSBT
   * 
   * @param psbt_base64 The PSBT base64
   * @returns The transaction hex
   */
  finalize_psbt(psbt_base64: string): Promise<string>;
  
  /**
   * Broadcast a transaction
   * 
   * @param tx_hex The transaction hex
   * @returns The transaction ID
   */
  broadcast_transaction(tx_hex: string): Promise<string>;
}

/**
 * WebAssembly bindings for the rune handler
 */
export class RuneHandlerWasm {
  /**
   * Create a new rune handler
   * 
   * @param wallet The wallet
   */
  constructor(wallet: WalletWasm);
  
  /**
   * Get the rune balance
   * 
   * @returns The rune balance JSON
   */
  balance(): Promise<string>;
  
  /**
   * Get the balance of a specific rune
   * 
   * @param rune_id The rune ID
   * @returns The rune balance
   */
  balance_of(rune_id: string): Promise<number>;
  
  /**
   * Create a PSBT for a rune transfer
   * 
   * @param rune_id The rune ID
   * @param amount The amount
   * @param recipient The recipient address
   * @param fee_rate The fee rate
   * @returns The PSBT base64
   */
  create_transfer_psbt(
    rune_id: string,
    amount: number,
    recipient: string,
    fee_rate: number,
  ): Promise<string>;
  
  /**
   * Verify a rune transfer
   * 
   * @param psbt_base64 The PSBT base64
   * @param rune_id The rune ID
   * @param amount The amount
   */
  verify_transfer(psbt_base64: string, rune_id: string, amount: number): Promise<void>;
}

/**
 * WebAssembly bindings for the alkane handler
 */
export class AlkaneHandlerWasm {
  /**
   * Create a new alkane handler
   * 
   * @param wallet The wallet
   */
  constructor(wallet: WalletWasm);
  
  /**
   * Get the alkane balance
   * 
   * @returns The alkane balance JSON
   */
  balance(): Promise<string>;
  
  /**
   * Get the balance of a specific alkane
   * 
   * @param alkane_id The alkane ID
   * @returns The alkane balance
   */
  balance_of(alkane_id: string): Promise<number>;
  
  /**
   * Create a PSBT for an alkane transfer
   * 
   * @param alkane_id The alkane ID
   * @param amount The amount
   * @param recipient The recipient address
   * @param fee_rate The fee rate
   * @returns The PSBT base64
   */
  create_transfer_psbt(
    alkane_id: string,
    amount: number,
    recipient: string,
    fee_rate: number,
  ): Promise<string>;
  
  /**
   * Verify an alkane transfer
   * 
   * @param psbt_base64 The PSBT base64
   * @param alkane_id The alkane ID
   * @param amount The amount
   */
  verify_transfer(psbt_base64: string, alkane_id: string, amount: number): Promise<void>;
}

/**
 * WebAssembly bindings for the wallet
 */
export class WalletWasm {
  // This class is not directly instantiated from JavaScript
}