import axios from 'axios';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { startServer, stopServer } from '../../src/server';
import { createTestUser, deleteTestUser } from '../helpers/user';
import { createTestOrder, deleteTestOrder } from '../helpers/order';
import { generateAuthToken } from '../helpers/auth';

describe('API Endpoints', () => {
  let server: any;
  let baseUrl: string;
  let authToken: string;
  let testUserId: string;
  let testOrderId: string;

  before(async () => {
    // Start the server
    server = await startServer(0); // Use port 0 to get a random available port
    const address = server.address();
    baseUrl = `http://localhost:${address.port}`;
    
    // Create a test user
    testUserId = await createTestUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
    });
    
    // Generate an auth token for the test user
    authToken = generateAuthToken(testUserId);
    
    // Create a test order
    testOrderId = await createTestOrder({
      userId: testUserId,
      baseAsset: 'BTC',
      quoteAsset: 'ETH',
      price: '10',
      amount: '1',
      type: 'buy',
    });
  });

  after(async () => {
    // Delete the test order
    await deleteTestOrder(testOrderId);
    
    // Delete the test user
    await deleteTestUser(testUserId);
    
    // Stop the server
    await stopServer(server);
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await axios.post(`${baseUrl}/api/auth/register`, {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!',
      });
      
      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('userId');
      expect(response.data).to.have.property('token');
      
      // Clean up
      await deleteTestUser(response.data.userId);
    });
    
    it('should login an existing user', async () => {
      const response = await axios.post(`${baseUrl}/api/auth/login`, {
        email: 'test@example.com',
        password: 'Password123!',
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('userId');
      expect(response.data).to.have.property('token');
      expect(response.data.userId).to.equal(testUserId);
    });
    
    it('should return 401 for invalid credentials', async () => {
      try {
        await axios.post(`${baseUrl}/api/auth/login`, {
          email: 'test@example.com',
          password: 'WrongPassword',
        });
        
        // If the request succeeds, fail the test
        expect.fail('Expected request to fail with 401');
      } catch (error: any) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data).to.have.property('error');
        expect(error.response.data.error).to.equal('Invalid credentials');
      }
    });
    
    it('should verify a valid token', async () => {
      const response = await axios.get(`${baseUrl}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('valid');
      expect(response.data.valid).to.be.true;
      expect(response.data).to.have.property('userId');
      expect(response.data.userId).to.equal(testUserId);
    });
    
    it('should return 401 for invalid token', async () => {
      try {
        await axios.get(`${baseUrl}/api/auth/verify`, {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        });
        
        // If the request succeeds, fail the test
        expect.fail('Expected request to fail with 401');
      } catch (error: any) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data).to.have.property('error');
        expect(error.response.data.error).to.equal('Invalid token');
      }
    });
  });

  describe('Orders', () => {
    it('should create a new order', async () => {
      const response = await axios.post(
        `${baseUrl}/api/orders`,
        {
          baseAsset: 'RUNE',
          quoteAsset: 'BTC',
          price: '0.001',
          amount: '100',
          type: 'sell',
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('orderId');
      
      // Clean up
      await deleteTestOrder(response.data.orderId);
    });
    
    it('should get all orders for a user', async () => {
      const response = await axios.get(`${baseUrl}/api/orders`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf.at.least(1);
      expect(response.data[0]).to.have.property('id');
      expect(response.data[0]).to.have.property('baseAsset');
      expect(response.data[0]).to.have.property('quoteAsset');
      expect(response.data[0]).to.have.property('price');
      expect(response.data[0]).to.have.property('amount');
      expect(response.data[0]).to.have.property('type');
      expect(response.data[0]).to.have.property('status');
      expect(response.data[0]).to.have.property('userId');
      expect(response.data[0].userId).to.equal(testUserId);
    });
    
    it('should get a specific order', async () => {
      const response = await axios.get(`${baseUrl}/api/orders/${testOrderId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('id');
      expect(response.data.id).to.equal(testOrderId);
      expect(response.data).to.have.property('baseAsset');
      expect(response.data).to.have.property('quoteAsset');
      expect(response.data).to.have.property('price');
      expect(response.data).to.have.property('amount');
      expect(response.data).to.have.property('type');
      expect(response.data).to.have.property('status');
      expect(response.data).to.have.property('userId');
      expect(response.data.userId).to.equal(testUserId);
    });
    
    it('should update an order', async () => {
      const response = await axios.put(
        `${baseUrl}/api/orders/${testOrderId}`,
        {
          price: '11',
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('id');
      expect(response.data.id).to.equal(testOrderId);
      expect(response.data).to.have.property('price');
      expect(response.data.price).to.equal('11');
    });
    
    it('should cancel an order', async () => {
      const response = await axios.delete(`${baseUrl}/api/orders/${testOrderId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('id');
      expect(response.data.id).to.equal(testOrderId);
      expect(response.data).to.have.property('status');
      expect(response.data.status).to.equal('cancelled');
    });
    
    it('should return 404 for non-existent order', async () => {
      try {
        await axios.get(`${baseUrl}/api/orders/non-existent-id`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        
        // If the request succeeds, fail the test
        expect.fail('Expected request to fail with 404');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data).to.have.property('error');
        expect(error.response.data.error).to.equal('Order not found');
      }
    });
    
    it('should return 403 for unauthorized access', async () => {
      // Create another user
      const anotherUserId = await createTestUser({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'Password123!',
      });
      
      // Generate an auth token for the other user
      const anotherAuthToken = generateAuthToken(anotherUserId);
      
      try {
        await axios.put(
          `${baseUrl}/api/orders/${testOrderId}`,
          {
            price: '12',
          },
          {
            headers: {
              Authorization: `Bearer ${anotherAuthToken}`,
            },
          }
        );
        
        // If the request succeeds, fail the test
        expect.fail('Expected request to fail with 403');
      } catch (error: any) {
        expect(error.response.status).to.equal(403);
        expect(error.response.data).to.have.property('error');
        expect(error.response.data.error).to.equal('Forbidden');
      }
      
      // Clean up
      await deleteTestUser(anotherUserId);
    });
  });

  describe('Trades', () => {
    let testTradeId: string;
    
    before(async () => {
      // Create a test trade
      const response = await axios.post(
        `${baseUrl}/api/trades`,
        {
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
          price: '10',
          amount: '1',
          buyOrderId: testOrderId,
          sellOrderId: testOrderId, // In a real scenario, this would be a different order
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      testTradeId = response.data.tradeId;
    });
    
    after(async () => {
      // Delete the test trade
      await axios.delete(`${baseUrl}/api/trades/${testTradeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    });
    
    it('should get all trades for a user', async () => {
      const response = await axios.get(`${baseUrl}/api/trades`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf.at.least(1);
      expect(response.data[0]).to.have.property('id');
      expect(response.data[0]).to.have.property('baseAsset');
      expect(response.data[0]).to.have.property('quoteAsset');
      expect(response.data[0]).to.have.property('price');
      expect(response.data[0]).to.have.property('amount');
      expect(response.data[0]).to.have.property('buyOrderId');
      expect(response.data[0]).to.have.property('sellOrderId');
      expect(response.data[0]).to.have.property('status');
    });
    
    it('should get a specific trade', async () => {
      const response = await axios.get(`${baseUrl}/api/trades/${testTradeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('id');
      expect(response.data.id).to.equal(testTradeId);
      expect(response.data).to.have.property('baseAsset');
      expect(response.data).to.have.property('quoteAsset');
      expect(response.data).to.have.property('price');
      expect(response.data).to.have.property('amount');
      expect(response.data).to.have.property('buyOrderId');
      expect(response.data).to.have.property('sellOrderId');
      expect(response.data).to.have.property('status');
    });
    
    it('should update a trade status', async () => {
      const response = await axios.put(
        `${baseUrl}/api/trades/${testTradeId}`,
        {
          status: 'completed',
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('id');
      expect(response.data.id).to.equal(testTradeId);
      expect(response.data).to.have.property('status');
      expect(response.data.status).to.equal('completed');
    });
    
    it('should return 404 for non-existent trade', async () => {
      try {
        await axios.get(`${baseUrl}/api/trades/non-existent-id`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        
        // If the request succeeds, fail the test
        expect.fail('Expected request to fail with 404');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data).to.have.property('error');
        expect(error.response.data.error).to.equal('Trade not found');
      }
    });
  });

  describe('Assets', () => {
    it('should get all assets', async () => {
      const response = await axios.get(`${baseUrl}/api/assets`);
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf.at.least(2); // At least BTC and ETH
      expect(response.data[0]).to.have.property('symbol');
      expect(response.data[0]).to.have.property('name');
      expect(response.data[0]).to.have.property('decimals');
    });
    
    it('should get a specific asset', async () => {
      const response = await axios.get(`${baseUrl}/api/assets/BTC`);
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('symbol');
      expect(response.data.symbol).to.equal('BTC');
      expect(response.data).to.have.property('name');
      expect(response.data.name).to.equal('Bitcoin');
      expect(response.data).to.have.property('decimals');
      expect(response.data.decimals).to.equal(8);
    });
    
    it('should return 404 for non-existent asset', async () => {
      try {
        await axios.get(`${baseUrl}/api/assets/NONEXISTENT`);
        
        // If the request succeeds, fail the test
        expect.fail('Expected request to fail with 404');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data).to.have.property('error');
        expect(error.response.data.error).to.equal('Asset not found');
      }
    });
  });

  describe('Wallet', () => {
    it('should get wallet balance', async () => {
      const response = await axios.get(`${baseUrl}/api/wallet/balance`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('object');
      expect(response.data).to.have.property('BTC');
      expect(response.data).to.have.property('ETH');
    });
    
    it('should get transaction history', async () => {
      const response = await axios.get(`${baseUrl}/api/wallet/transactions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      // There might not be any transactions yet, so we don't check the length
    });
    
    it('should create a deposit address', async () => {
      const response = await axios.post(
        `${baseUrl}/api/wallet/deposit-address`,
        {
          asset: 'BTC',
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('address');
      expect(response.data.address).to.be.a('string');
      expect(response.data.address.length).to.be.at.least(26); // Bitcoin addresses are at least 26 characters
    });
    
    it('should initiate a withdrawal', async () => {
      try {
        await axios.post(
          `${baseUrl}/api/wallet/withdraw`,
          {
            asset: 'BTC',
            amount: '1.0',
            address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Example Bitcoin address
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        
        // If the request succeeds, fail the test (assuming the user doesn't have enough balance)
        expect.fail('Expected request to fail with 400');
      } catch (error: any) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.have.property('error');
        expect(error.response.data.error).to.equal('Insufficient balance');
      }
    });
  });

  describe('Market Data', () => {
    it('should get ticker data', async () => {
      const response = await axios.get(`${baseUrl}/api/market/ticker`);
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf.at.least(1);
      expect(response.data[0]).to.have.property('pair');
      expect(response.data[0]).to.have.property('last');
      expect(response.data[0]).to.have.property('bid');
      expect(response.data[0]).to.have.property('ask');
      expect(response.data[0]).to.have.property('volume');
      expect(response.data[0]).to.have.property('change24h');
    });
    
    it('should get order book data', async () => {
      const response = await axios.get(`${baseUrl}/api/market/orderbook`, {
        params: {
          pair: 'BTC/ETH',
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('bids');
      expect(response.data).to.have.property('asks');
      expect(response.data.bids).to.be.an('array');
      expect(response.data.asks).to.be.an('array');
    });
    
    it('should get recent trades', async () => {
      const response = await axios.get(`${baseUrl}/api/market/trades`, {
        params: {
          pair: 'BTC/ETH',
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      // There might not be any trades yet, so we don't check the length
    });
    
    it('should get price history', async () => {
      const response = await axios.get(`${baseUrl}/api/market/history`, {
        params: {
          pair: 'BTC/ETH',
          interval: '1h',
        },
      });
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      // There might not be any price history yet, so we don't check the length
    });
  });

  describe('P2P Network', () => {
    it('should get peer count', async () => {
      const response = await axios.get(`${baseUrl}/api/p2p/peers`);
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('count');
      expect(response.data.count).to.be.a('number');
    });
    
    it('should get peer list', async () => {
      const response = await axios.get(`${baseUrl}/api/p2p/peers/list`);
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      // There might not be any peers yet, so we don't check the length
    });
    
    it('should get network status', async () => {
      const response = await axios.get(`${baseUrl}/api/p2p/status`);
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connected');
      expect(response.data).to.have.property('uptime');
      expect(response.data).to.have.property('messages');
      expect(response.data.messages).to.have.property('sent');
      expect(response.data.messages).to.have.property('received');
    });
  });
});