/**
 * Mock for darkswap-wasm module
 */

const JsAssetType = {
  Bitcoin: 0,
  Rune: 1,
  Alkane: 2,
};

const JsOrderSide = {
  Buy: 0,
  Sell: 1,
};

const JsOrderStatus = {
  Open: 0,
  Filled: 1,
  Canceled: 2,
  Expired: 3,
};

const JsBitcoinNetwork = {
  Mainnet: 0,
  Testnet: 1,
  Regtest: 2,
  Signet: 3,
};

class JsConfig {
  constructor() {
    this.network = JsBitcoinNetwork.Testnet;
    this.wallet_type = 'simple';
    this.private_key = undefined;
    this.mnemonic = undefined;
    this.derivation_path = undefined;
    this.enable_webrtc = true;
    this.ice_servers = [];
    this.signaling_server_url = undefined;
  }
}

class JsDarkSwap {
  constructor(config) {
    this.config = config;
  }

  async start() {
    return true;
  }

  async stop() {
    return true;
  }

  async set_event_callback(callback) {
    this.callback = callback;
    return true;
  }

  async get_address() {
    return 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
  }

  async get_balance() {
    return 100000;
  }

  async get_asset_balance(assetType, id) {
    return 100000;
  }

  async create_order(
    baseAssetType,
    baseAssetId,
    quoteAssetType,
    quoteAssetId,
    side,
    amount,
    price,
    makerAddress,
    expirySeconds
  ) {
    return {
      id: '123',
      maker: makerAddress,
      baseAsset: 'Bitcoin',
      quoteAsset: 'Bitcoin',
      side,
      amount,
      price,
      status: JsOrderStatus.Open,
      timestamp: Date.now(),
      expiry: Date.now() + expirySeconds * 1000,
    };
  }

  async cancel_order(orderId) {
    return true;
  }

  async get_order(orderId) {
    return {
      id: orderId,
      maker: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      baseAsset: 'Bitcoin',
      quoteAsset: 'Bitcoin',
      side: JsOrderSide.Buy,
      amount: '0.01',
      price: '20000',
      status: JsOrderStatus.Open,
      timestamp: Date.now(),
      expiry: Date.now() + 3600000,
    };
  }

  async get_orders(
    baseAssetType,
    baseAssetId,
    quoteAssetType,
    quoteAssetId
  ) {
    return [
      {
        id: '123',
        maker: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        baseAsset: 'Bitcoin',
        quoteAsset: 'Bitcoin',
        side: JsOrderSide.Buy,
        amount: '0.01',
        price: '20000',
        status: JsOrderStatus.Open,
        timestamp: Date.now(),
        expiry: Date.now() + 3600000,
      },
    ];
  }

  async take_order(orderId, amount) {
    return {
      id: '456',
    };
  }

  async get_best_bid_ask(
    baseAssetType,
    baseAssetId,
    quoteAssetType,
    quoteAssetId
  ) {
    return {
      bid: '19000',
      ask: '21000',
    };
  }
}

// Export the mock module
export {
  JsAssetType,
  JsOrderSide,
  JsOrderStatus,
  JsBitcoinNetwork,
  JsConfig,
  JsDarkSwap,
};

// Default export for the init function
export default async function init() {
  return {
    JsAssetType,
    JsOrderSide,
    JsOrderStatus,
    JsBitcoinNetwork,
    JsConfig,
    JsDarkSwap,
  };
}