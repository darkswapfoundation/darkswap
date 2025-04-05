/**
 * Stress testing for the DarkSwap Bridge
 * 
 * This script tests the performance of the DarkSwap Bridge under stress
 * by simulating extreme conditions and measuring the system's response.
 */

const autocannon = require('autocannon');
const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Configuration
const config = {
  // Server URL
  url: 'http://localhost:3001',
  
  // Authentication
  auth: {
    username: 'admin',
    password: 'admin123',
  },
  
  // Test duration in seconds
  duration: 300,
  
  // Number of concurrent connections
  connections: 500,
  
  // Number of requests per second
  rate: 5000,
  
  // Number of workers (for parallel testing)
  workers: 8,
  
  // Output file
  outputFile: path.join(__dirname, 'stress-test-results.json'),
  
  // WebSocket URL
  wsUrl: 'ws://localhost:3001',
  
  // Number of WebSocket connections
  wsConnections: 200,
};

// API endpoints to test
const endpoints = [
  {
    name: 'Login',
    method: 'POST',
    path: '/api/auth/login',
    body: JSON.stringify({
      username: config.auth.username,
      password: config.auth.password,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    onResponse: (status, body, context) => {
      if (status === 200) {
        try {
          const response = JSON.parse(body);
          context.token = response.token;
        } catch (e) {
          console.error('Failed to parse login response:', e);
        }
      }
    },
  },
  {
    name: 'Create Wallet',
    method: 'POST',
    path: '/api/bridge/wallet',
    setupRequest: (req, context) => {
      req.headers = {
        ...req.headers,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.token}`,
      };
      req.body = JSON.stringify({
        action: 'create_wallet',
        payload: {
          name: `stress_wallet_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          passphrase: 'password123',
        },
      });
      return req;
    },
    weight: 5, // Higher weight means this endpoint will be called more frequently
  },
  {
    name: 'Create Order',
    method: 'POST',
    path: '/api/bridge/network',
    setupRequest: (req, context) => {
      req.headers = {
        ...req.headers,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.token}`,
      };
      req.body = JSON.stringify({
        action: 'create_order',
        payload: {
          order_type: Math.random() > 0.5 ? 'buy' : 'sell',
          sell_asset: 'BTC',
          sell_amount: Math.floor(Math.random() * 100) + 1,
          buy_asset: 'RUNE',
          buy_amount: Math.floor(Math.random() * 10000) + 1,
        },
      });
      return req;
    },
    weight: 10,
  },
  {
    name: 'Get Orders',
    method: 'GET',
    path: '/api/bridge/orders',
    setupRequest: (req, context) => {
      req.headers = {
        ...req.headers,
        Authorization: `Bearer ${context.token}`,
      };
      return req;
    },
    weight: 20,
  },
  {
    name: 'Get Trades',
    method: 'GET',
    path: '/api/bridge/trades',
    setupRequest: (req, context) => {
      req.headers = {
        ...req.headers,
        Authorization: `Bearer ${context.token}`,
      };
      return req;
    },
    weight: 15,
  },
  {
    name: 'Connect to Peer',
    method: 'POST',
    path: '/api/bridge/network',
    setupRequest: (req, context) => {
      req.headers = {
        ...req.headers,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.token}`,
      };
      req.body = JSON.stringify({
        action: 'connect',
        payload: {
          address: `peer${Math.floor(Math.random() * 100)}.example.com:8333`,
        },
      });
      return req;
    },
    weight: 5,
  },
];

// Run stress test with multiple workers
async function runStressTest() {
  console.log(`Starting stress test with ${config.workers} workers, ${config.connections} connections per worker...`);
  
  // Start WebSocket connections
  startWebSocketConnections();
  
  const workers = [];
  const results = [];
  
  for (let i = 0; i < config.workers; i++) {
    const worker = new Worker(`${__dirname}/stress-test-worker.js`, {
      workerData: {
        id: i,
        config: {
          ...config,
          connections: Math.floor(config.connections / config.workers),
          rate: Math.floor(config.rate / config.workers),
        },
        endpoints,
      },
    });
    
    worker.on('message', (result) => {
      results.push(result);
      console.log(`Worker ${i} completed!`);
    });
    
    worker.on('error', (err) => {
      console.error(`Worker ${i} error:`, err);
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker ${i} exited with code ${code}`);
      }
      
      // Check if all workers have completed
      if (results.length === config.workers) {
        // Combine results
        const combinedResults = combineResults(results);
        
        // Save results
        fs.writeFileSync(config.outputFile, JSON.stringify(combinedResults, null, 2));
        console.log(`Results saved to ${config.outputFile}`);
        
        // Print summary
        console.log('\nSummary:');
        console.log(`Requests: ${combinedResults.requests.total}`);
        console.log(`Throughput: ${combinedResults.requests.average} req/sec`);
        console.log(`Latency (avg): ${combinedResults.latency.average} ms`);
        console.log(`Latency (max): ${combinedResults.latency.max} ms`);
        console.log(`Errors: ${combinedResults.errors}`);
        
        // Stop WebSocket connections
        stopWebSocketConnections();
      }
    });
    
    workers.push(worker);
  }
}

// Start WebSocket connections
function startWebSocketConnections() {
  console.log(`Starting ${config.wsConnections} WebSocket connections...`);
  
  global.wsConnections = [];
  
  for (let i = 0; i < config.wsConnections; i++) {
    const ws = new WebSocket(config.wsUrl);
    
    ws.on('open', () => {
      // Authenticate
      ws.send(JSON.stringify({
        type: 'auth',
        token: 'dummy-token', // In a real test, this would be a valid token
      }));
      
      // Send a message every 5 seconds
      ws.interval = setInterval(() => {
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
        }));
      }, 5000);
    });
    
    ws.on('message', (data) => {
      // Process message if needed
    });
    
    ws.on('error', (err) => {
      console.error(`WebSocket ${i} error:`, err);
    });
    
    global.wsConnections.push(ws);
  }
}

// Stop WebSocket connections
function stopWebSocketConnections() {
  console.log('Stopping WebSocket connections...');
  
  if (global.wsConnections) {
    for (const ws of global.wsConnections) {
      if (ws.interval) {
        clearInterval(ws.interval);
      }
      ws.close();
    }
  }
}

// Combine results from multiple workers
function combineResults(results) {
  return results.reduce((combined, result) => {
    // Combine requests
    combined.requests.total += result.requests.total;
    combined.requests.average += result.requests.average / results.length;
    
    // Combine latency
    combined.latency.average += result.latency.average / results.length;
    combined.latency.max = Math.max(combined.latency.max, result.latency.max);
    
    // Combine errors
    combined.errors += result.errors;
    
    return combined;
  }, {
    requests: { total: 0, average: 0 },
    latency: { average: 0, max: 0 },
    errors: 0,
  });
}

// Run the stress test
runStressTest();