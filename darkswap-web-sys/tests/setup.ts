/**
 * Test setup file for DarkSwap WebAssembly bindings
 * 
 * This file is run before all tests to set up the test environment.
 */

// Mock the WebAssembly module
vi.mock('../src/wasm/darkswap_sdk', () => {
  return {
    default: vi.fn().mockResolvedValue({
      initialize: vi.fn().mockResolvedValue(undefined),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      getPeers: vi.fn().mockResolvedValue('[]'),
      connectToPeer: vi.fn().mockResolvedValue(undefined),
      connectToRelay: vi.fn().mockResolvedValue(undefined),
      createOrder: vi.fn().mockResolvedValue('order-id'),
      cancelOrder: vi.fn().mockResolvedValue(undefined),
      getOrders: vi.fn().mockResolvedValue('[]'),
      getOrdersForPair: vi.fn().mockResolvedValue('[]'),
      takeOrder: vi.fn().mockResolvedValue('trade-id'),
      getTrades: vi.fn().mockResolvedValue('[]'),
      getTrade: vi.fn().mockResolvedValue(null),
      getTradeStatus: vi.fn().mockResolvedValue('{"status":"pending"}'),
      connectWallet: vi.fn().mockResolvedValue(undefined),
      disconnectWallet: vi.fn().mockResolvedValue(undefined),
      isWalletConnected: vi.fn().mockReturnValue(false),
      getWalletInfo: vi.fn().mockResolvedValue(null),
      getBalances: vi.fn().mockResolvedValue('[]'),
      getRuneInfo: vi.fn().mockResolvedValue(null),
      getAlkaneInfo: vi.fn().mockResolvedValue(null),
      createPredicate: vi.fn().mockResolvedValue('predicate-id'),
      getPredicateInfo: vi.fn().mockResolvedValue(null),
      setNetworkEventCallback: vi.fn(),
      setOrderEventCallback: vi.fn(),
      setTradeEventCallback: vi.fn(),
      setWalletEventCallback: vi.fn(),
    }),
  };
});

// Create a mock for the WebAssembly module directory
vi.mock('../src/wasm', () => {
  return {
    __esModule: true,
    default: {},
  };
});

// Mock console methods to avoid cluttering test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
});