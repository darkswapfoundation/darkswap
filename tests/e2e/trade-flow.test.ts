import { test, expect } from '@playwright/test';
import { ApiClient } from '../../src/utils/ApiClient';
import { WebSocketClient } from '../../src/utils/WebSocketClient';
import { WebSocketEventType, WebSocketChannelType } from '../../src/websocket';

test.describe('Trade Flow End-to-End Tests', () => {
  let buyerApiClient: ApiClient;
  let sellerApiClient: ApiClient;
  let buyerWsClient: WebSocketClient;
  let sellerWsClient: WebSocketClient;
  
  test.beforeAll(async () => {
    // Create API clients for buyer and seller
    buyerApiClient = new ApiClient({
      baseUrl: 'https://api.darkswap.io',
    });
    
    sellerApiClient = new ApiClient({
      baseUrl: 'https://api.darkswap.io',
    });
    
    // Create WebSocket clients for buyer and seller
    buyerWsClient = new WebSocketClient({
      url: 'wss://api.darkswap.io/ws',
      autoConnect: true,
      reconnect: true,
    });
    
    sellerWsClient = new WebSocketClient({
      url: 'wss://api.darkswap.io/ws',
      autoConnect: true,
      reconnect: true,
    });
    
    // Log in as buyer
    const buyerLoginResponse = await buyerApiClient.post('/api/auth/login', {
      email: 'buyer@example.com',
      password: 'securepassword',
    });
    
    buyerApiClient.setAuthToken(buyerLoginResponse.token);
    buyerWsClient.authenticate(buyerLoginResponse.token);
    
    // Log in as seller
    const sellerLoginResponse = await sellerApiClient.post('/api/auth/login', {
      email: 'seller@example.com',
      password: 'securepassword',
    });
    
    sellerApiClient.setAuthToken(sellerLoginResponse.token);
    sellerWsClient.authenticate(sellerLoginResponse.token);
    
    // Subscribe to relevant channels
    buyerWsClient.subscribe(WebSocketChannelType.ORDERS);
    buyerWsClient.subscribe(WebSocketChannelType.TRADES);
    sellerWsClient.subscribe(WebSocketChannelType.ORDERS);
    sellerWsClient.subscribe(WebSocketChannelType.TRADES);
  });
  
  test.afterAll(async () => {
    // Disconnect WebSocket clients
    buyerWsClient.disconnect();
    sellerWsClient.disconnect();
  });
  
  test('Complete trade flow from order creation to execution', async () => {
    // Step 1: Create a sell order
    const sellOrder = await sellerApiClient.post('/api/orders', {
      baseAsset: 'BTC',
      quoteAsset: 'ETH',
      price: '10.0',
      amount: '1.0',
      type: 'sell',
    });
    
    expect(sellOrder).toBeDefined();
    expect(sellOrder.id).toBeDefined();
    expect(sellOrder.baseAsset).toBe('BTC');
    expect(sellOrder.quoteAsset).toBe('ETH');
    expect(sellOrder.price).toBe('10.0');
    expect(sellOrder.amount).toBe('1.0');
    expect(sellOrder.type).toBe('sell');
    expect(sellOrder.status).toBe('open');
    
    // Step 2: Verify the sell order is in the orderbook
    const orderbook = await buyerApiClient.get('/api/market/orderbook', {
      pair: 'BTC/ETH',
    });
    
    expect(orderbook).toBeDefined();
    expect(orderbook.asks).toBeDefined();
    expect(orderbook.asks.length).toBeGreaterThan(0);
    
    const sellOrderInOrderbook = orderbook.asks.find(
      (ask) => ask.price === '10.0' && ask.amount === '1.0'
    );
    
    expect(sellOrderInOrderbook).toBeDefined();
    
    // Step 3: Create a buy order that matches the sell order
    const buyOrder = await buyerApiClient.post('/api/orders', {
      baseAsset: 'BTC',
      quoteAsset: 'ETH',
      price: '10.0',
      amount: '1.0',
      type: 'buy',
    });
    
    expect(buyOrder).toBeDefined();
    expect(buyOrder.id).toBeDefined();
    expect(buyOrder.baseAsset).toBe('BTC');
    expect(buyOrder.quoteAsset).toBe('ETH');
    expect(buyOrder.price).toBe('10.0');
    expect(buyOrder.amount).toBe('1.0');
    expect(buyOrder.type).toBe('buy');
    
    // Step 4: Wait for the trade to be created
    const buyerTradePromise = new Promise<any>((resolve) => {
      buyerWsClient.on(WebSocketEventType.TRADE_CREATED, (trade) => {
        if (trade.buyOrderId === buyOrder.id && trade.sellOrderId === sellOrder.id) {
          resolve(trade);
        }
      });
    });
    
    const sellerTradePromise = new Promise<any>((resolve) => {
      sellerWsClient.on(WebSocketEventType.TRADE_CREATED, (trade) => {
        if (trade.buyOrderId === buyOrder.id && trade.sellOrderId === sellOrder.id) {
          resolve(trade);
        }
      });
    });
    
    const [buyerTrade, sellerTrade] = await Promise.all([
      buyerTradePromise,
      sellerTradePromise,
    ]);
    
    expect(buyerTrade).toBeDefined();
    expect(buyerTrade.id).toBeDefined();
    expect(buyerTrade.buyOrderId).toBe(buyOrder.id);
    expect(buyerTrade.sellOrderId).toBe(sellOrder.id);
    expect(buyerTrade.baseAsset).toBe('BTC');
    expect(buyerTrade.quoteAsset).toBe('ETH');
    expect(buyerTrade.price).toBe('10.0');
    expect(buyerTrade.amount).toBe('1.0');
    expect(buyerTrade.status).toBe('pending');
    
    expect(sellerTrade).toBeDefined();
    expect(sellerTrade.id).toBe(buyerTrade.id);
    
    // Step 5: Get the trade PSBT
    const tradePsbt = await buyerApiClient.get(`/api/trades/${buyerTrade.id}/psbt`);
    
    expect(tradePsbt).toBeDefined();
    expect(tradePsbt.psbt).toBeDefined();
    
    // Step 6: Sign the trade PSBT as buyer
    const buyerSignedPsbt = await buyerApiClient.post(`/api/trades/${buyerTrade.id}/sign`, {
      psbt: tradePsbt.psbt,
    });
    
    expect(buyerSignedPsbt).toBeDefined();
    expect(buyerSignedPsbt.psbt).toBeDefined();
    
    // Step 7: Sign the trade PSBT as seller
    const sellerSignedPsbt = await sellerApiClient.post(`/api/trades/${sellerTrade.id}/sign`, {
      psbt: buyerSignedPsbt.psbt,
    });
    
    expect(sellerSignedPsbt).toBeDefined();
    expect(sellerSignedPsbt.psbt).toBeDefined();
    
    // Step 8: Execute the trade
    const executedTrade = await buyerApiClient.post(`/api/trades/${buyerTrade.id}/execute`, {
      psbt: sellerSignedPsbt.psbt,
    });
    
    expect(executedTrade).toBeDefined();
    expect(executedTrade.id).toBe(buyerTrade.id);
    expect(executedTrade.status).toBe('completed');
    expect(executedTrade.txid).toBeDefined();
    
    // Step 9: Wait for the trade to be confirmed
    const buyerTradeConfirmedPromise = new Promise<any>((resolve) => {
      buyerWsClient.on(WebSocketEventType.TRADE_COMPLETED, (trade) => {
        if (trade.id === buyerTrade.id) {
          resolve(trade);
        }
      });
    });
    
    const sellerTradeConfirmedPromise = new Promise<any>((resolve) => {
      sellerWsClient.on(WebSocketEventType.TRADE_COMPLETED, (trade) => {
        if (trade.id === sellerTrade.id) {
          resolve(trade);
        }
      });
    });
    
    const [buyerTradeConfirmed, sellerTradeConfirmed] = await Promise.all([
      buyerTradeConfirmedPromise,
      sellerTradeConfirmedPromise,
    ]);
    
    expect(buyerTradeConfirmed).toBeDefined();
    expect(buyerTradeConfirmed.id).toBe(buyerTrade.id);
    expect(buyerTradeConfirmed.status).toBe('completed');
    expect(buyerTradeConfirmed.txid).toBeDefined();
    
    expect(sellerTradeConfirmed).toBeDefined();
    expect(sellerTradeConfirmed.id).toBe(sellerTrade.id);
    expect(sellerTradeConfirmed.status).toBe('completed');
    expect(sellerTradeConfirmed.txid).toBe(buyerTradeConfirmed.txid);
    
    // Step 10: Verify the trade in the trade history
    const tradeHistory = await buyerApiClient.get('/api/market/trades', {
      pair: 'BTC/ETH',
    });
    
    expect(tradeHistory).toBeDefined();
    expect(tradeHistory.length).toBeGreaterThan(0);
    
    const tradeInHistory = tradeHistory.find(
      (trade) => trade.id === buyerTrade.id
    );
    
    expect(tradeInHistory).toBeDefined();
    expect(tradeInHistory.price).toBe('10.0');
    expect(tradeInHistory.amount).toBe('1.0');
    
    // Step 11: Verify the buyer's balance has been updated
    const buyerBalance = await buyerApiClient.get('/api/wallet/balance');
    
    expect(buyerBalance).toBeDefined();
    expect(buyerBalance.BTC).toBeDefined();
    expect(buyerBalance.ETH).toBeDefined();
    
    // Step 12: Verify the seller's balance has been updated
    const sellerBalance = await sellerApiClient.get('/api/wallet/balance');
    
    expect(sellerBalance).toBeDefined();
    expect(sellerBalance.BTC).toBeDefined();
    expect(sellerBalance.ETH).toBeDefined();
  });
  
  test('Cancel order flow', async () => {
    // Step 1: Create a sell order
    const sellOrder = await sellerApiClient.post('/api/orders', {
      baseAsset: 'BTC',
      quoteAsset: 'ETH',
      price: '11.0',
      amount: '1.0',
      type: 'sell',
    });
    
    expect(sellOrder).toBeDefined();
    expect(sellOrder.id).toBeDefined();
    
    // Step 2: Verify the sell order is in the orderbook
    const orderbook = await buyerApiClient.get('/api/market/orderbook', {
      pair: 'BTC/ETH',
    });
    
    expect(orderbook).toBeDefined();
    expect(orderbook.asks).toBeDefined();
    
    const sellOrderInOrderbook = orderbook.asks.find(
      (ask) => ask.price === '11.0' && ask.amount === '1.0'
    );
    
    expect(sellOrderInOrderbook).toBeDefined();
    
    // Step 3: Cancel the sell order
    const cancelledOrder = await sellerApiClient.delete(`/api/orders/${sellOrder.id}`);
    
    expect(cancelledOrder).toBeDefined();
    expect(cancelledOrder.id).toBe(sellOrder.id);
    expect(cancelledOrder.status).toBe('cancelled');
    
    // Step 4: Verify the sell order is no longer in the orderbook
    const updatedOrderbook = await buyerApiClient.get('/api/market/orderbook', {
      pair: 'BTC/ETH',
    });
    
    expect(updatedOrderbook).toBeDefined();
    expect(updatedOrderbook.asks).toBeDefined();
    
    const cancelledOrderInOrderbook = updatedOrderbook.asks.find(
      (ask) => ask.price === '11.0' && ask.amount === '1.0'
    );
    
    expect(cancelledOrderInOrderbook).toBeUndefined();
  });
  
  test('Partial fill flow', async () => {
    // Step 1: Create a sell order
    const sellOrder = await sellerApiClient.post('/api/orders', {
      baseAsset: 'BTC',
      quoteAsset: 'ETH',
      price: '10.0',
      amount: '2.0',
      type: 'sell',
    });
    
    expect(sellOrder).toBeDefined();
    expect(sellOrder.id).toBeDefined();
    
    // Step 2: Create a buy order that partially matches the sell order
    const buyOrder = await buyerApiClient.post('/api/orders', {
      baseAsset: 'BTC',
      quoteAsset: 'ETH',
      price: '10.0',
      amount: '1.0',
      type: 'buy',
    });
    
    expect(buyOrder).toBeDefined();
    expect(buyOrder.id).toBeDefined();
    
    // Step 3: Wait for the trade to be created
    const buyerTradePromise = new Promise<any>((resolve) => {
      buyerWsClient.on(WebSocketEventType.TRADE_CREATED, (trade) => {
        if (trade.buyOrderId === buyOrder.id && trade.sellOrderId === sellOrder.id) {
          resolve(trade);
        }
      });
    });
    
    const buyerTrade = await buyerTradePromise;
    
    expect(buyerTrade).toBeDefined();
    expect(buyerTrade.id).toBeDefined();
    expect(buyerTrade.amount).toBe('1.0');
    
    // Step 4: Verify the sell order is still in the orderbook with reduced amount
    const orderbook = await buyerApiClient.get('/api/market/orderbook', {
      pair: 'BTC/ETH',
    });
    
    expect(orderbook).toBeDefined();
    expect(orderbook.asks).toBeDefined();
    
    const sellOrderInOrderbook = orderbook.asks.find(
      (ask) => ask.price === '10.0'
    );
    
    expect(sellOrderInOrderbook).toBeDefined();
    expect(sellOrderInOrderbook.amount).toBe('1.0');
    
    // Step 5: Get the updated sell order
    const updatedSellOrder = await sellerApiClient.get(`/api/orders/${sellOrder.id}`);
    
    expect(updatedSellOrder).toBeDefined();
    expect(updatedSellOrder.id).toBe(sellOrder.id);
    expect(updatedSellOrder.amount).toBe('2.0');
    expect(updatedSellOrder.filled).toBe('1.0');
    expect(updatedSellOrder.status).toBe('open');
  });
});