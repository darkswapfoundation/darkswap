/**
 * Unit tests for DarkSwapClient
 */

import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork } from '../DarkSwapClient';
import { ErrorCode, DarkSwapError } from '../ErrorHandling';

// Mock the darkswap-wasm module
jest.mock('darkswap-wasm', () => {
  const mockJsDarkSwap = jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(true),
    stop: jest.fn().mockResolvedValue(true),
    set_event_callback: jest.fn().mockResolvedValue(true),
    get_address: jest.fn().mockResolvedValue('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'),
    get_balance: jest.fn().mockResolvedValue(100000),
    get_asset_balance: jest.fn().mockResolvedValue(100000),
    create_order: jest.fn().mockResolvedValue({
      id: '123',
      maker: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      baseAsset: 'Bitcoin',
      quoteAsset: 'Bitcoin',
      side: 0,
      amount: '0.01',
      price: '20000',
      status: 0,
      timestamp: Date.now(),
      expiry: Date.now() + 3600000,
    }),
    cancel_order: jest.fn().mockResolvedValue(true),
    get_order: jest.fn().mockResolvedValue({
      id: '123',
      maker: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      baseAsset: 'Bitcoin',
      quoteAsset: 'Bitcoin',
      side: 0,
      amount: '0.01',
      price: '20000',
      status: 0,
      timestamp: Date.now(),
      expiry: Date.now() + 3600000,
    }),
    get_orders: jest.fn().mockResolvedValue([
      {
        id: '123',
        maker: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        baseAsset: 'Bitcoin',
        quoteAsset: 'Bitcoin',
        side: 0,
        amount: '0.01',
        price: '20000',
        status: 0,
        timestamp: Date.now(),
        expiry: Date.now() + 3600000,
      },
    ]),
    take_order: jest.fn().mockResolvedValue({
      id: '456',
    }),
    get_best_bid_ask: jest.fn().mockResolvedValue({
      bid: '19000',
      ask: '21000',
    }),
  }));

  const mockJsConfig = jest.fn().mockImplementation(() => ({
    network: 0,
    wallet_type: '',
    private_key: undefined,
    mnemonic: undefined,
    derivation_path: undefined,
    enable_webrtc: false,
    ice_servers: [],
    signaling_server_url: undefined,
  }));

  return {
    __esModule: true,
    default: jest.fn().mockResolvedValue({
      JsDarkSwap: mockJsDarkSwap,
      JsConfig: mockJsConfig,
      JsAssetType: {
        Bitcoin: 0,
        Rune: 1,
        Alkane: 2,
      },
      JsOrderSide: {
        Buy: 0,
        Sell: 1,
      },
      JsOrderStatus: {
        Open: 0,
        Filled: 1,
        Canceled: 2,
        Expired: 3,
      },
      JsBitcoinNetwork: {
        Mainnet: 0,
        Testnet: 1,
        Regtest: 2,
        Signet: 3,
      },
    }),
  };
});

describe('DarkSwapClient', () => {
  let client: DarkSwapClient;

  beforeEach(async () => {
    client = new DarkSwapClient();
    await client.initialize('/darkswap-wasm/darkswap_wasm_bg.wasm');
  });

  describe('initialization', () => {
    it('should initialize the client', async () => {
      expect(client).toBeDefined();
    });

    it('should throw an error if create is called before initialize', async () => {
      const uninitializedClient = new DarkSwapClient();
      await expect(uninitializedClient.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [],
      })).rejects.toThrow(DarkSwapError);
    });
  });

  describe('create', () => {
    it('should create a DarkSwap instance', async () => {
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [],
      });
      // No error means success
    });
  });

  describe('start', () => {
    beforeEach(async () => {
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [],
      });
    });

    it('should start DarkSwap', async () => {
      await client.start();
      // No error means success
    });

    it('should throw an error if start is called before create', async () => {
      const uninitializedClient = new DarkSwapClient();
      await uninitializedClient.initialize('/darkswap-wasm/darkswap_wasm_bg.wasm');
      await expect(uninitializedClient.start()).rejects.toThrow(DarkSwapError);
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [],
      });
      await client.start();
    });

    it('should stop DarkSwap', async () => {
      await client.stop();
      // No error means success
    });
  });

  describe('wallet operations', () => {
    beforeEach(async () => {
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [],
      });
      await client.start();
    });

    it('should get wallet address', async () => {
      const address = await client.getAddress();
      expect(address).toBe('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');
    });

    it('should get wallet balance', async () => {
      const balance = await client.getBalance();
      expect(balance).toBe(100000);
    });

    it('should get asset balance', async () => {
      const balance = await client.getAssetBalance({ type: AssetType.Bitcoin });
      expect(balance).toBe(100000);
    });
  });

  describe('order operations', () => {
    beforeEach(async () => {
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [],
      });
      await client.start();
    });

    it('should create an order', async () => {
      const order = await client.createOrder(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin },
        OrderSide.Buy,
        '0.01',
        '20000',
        'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        3600
      );
      expect(order).toBeDefined();
      expect(order.id).toBe('123');
    });

    it('should cancel an order', async () => {
      await client.cancelOrder('123');
      // No error means success
    });

    it('should get an order', async () => {
      const order = await client.getOrder('123');
      expect(order).toBeDefined();
      expect(order.id).toBe('123');
    });

    it('should get orders', async () => {
      const orders = await client.getOrders(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin }
      );
      expect(orders).toBeDefined();
      expect(orders.length).toBe(1);
      expect(orders[0].id).toBe('123');
    });

    it('should take an order', async () => {
      const trade = await client.takeOrder('123', '0.01');
      expect(trade).toBeDefined();
      expect(trade.id).toBe('456');
    });
  });

  describe('market operations', () => {
    beforeEach(async () => {
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [],
      });
      await client.start();
    });

    it('should get best bid and ask', async () => {
      const bestBidAsk = await client.getBestBidAsk(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin }
      );
      expect(bestBidAsk).toBeDefined();
      expect(bestBidAsk.bid).toBe('19000');
      expect(bestBidAsk.ask).toBe('21000');
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [],
      });
      await client.start();
    });

    it('should add and remove event listeners', () => {
      const listener = jest.fn();
      client.addEventListener(listener);
      client.removeEventListener(listener);
      // No error means success
    });
  });
});