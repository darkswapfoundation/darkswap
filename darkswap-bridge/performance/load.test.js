/**
 * Load testing for the DarkSwap Bridge
 * 
 * This script tests the performance of the DarkSwap Bridge under load
 * by simulating multiple concurrent users performing various operations.
 */

const autocannon = require('autocannon');
const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');

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
  duration: 60,
  
  // Number of concurrent connections
  connections: 100,
  
  // Number of requests per second
  rate: 1000,
  
  // Number of workers (for parallel testing)
  workers: 4,
  
  // Output file
  outputFile: path.join(__dirname, 'load-test-results.json'),
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
    name: 'Get Wallet Status',
    method: 'GET',
    path: '/api/bridge/wallet/status',
    setupRequest: (req, context) => {
      req.headers = {
        ...req.headers,
        Authorization: `Bearer ${context.token}`,
      };
      return req;
    },
  },
  {
    name: 'Get Network Status',
    method: 'GET',
    path: '/api/bridge/network/status',
    setupRequest: (req, context) => {
      req.headers = {
        ...req.headers,
        Authorization: `Bearer ${context.token}`,
      };
      return req;
    },
  },
  {
    name: 'Get Wallet Balance',
    method: 'GET',
    path: '/api/bridge/wallet/balance',
    setupRequest: (req, context) => {
      req.headers = {
        ...req.headers,
        Authorization: `Bearer ${context.token}`,
      };
      return req;
    },
  },
  {
    name: 'Get Connected Peers',
    method: 'GET',
    path: '/api/bridge/network/peers',
    setupRequest: (req, context) => {
      req.headers = {
        ...req.headers,
        Authorization: `Bearer ${context.token}`,
      };
      return req;
    },
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
          name: `test_wallet_${Date.now()}`,
          passphrase: 'password123',
        },
      });
      return req;
    },
  },
];

// Run load test with a single worker
async function runLoadTest() {
  console.log(`Starting load test with ${config.connections} concurrent connections for ${config.duration} seconds...`);
  
  const instance = autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    requests: endpoints,
    context: {},
  });
  
  autocannon.track(instance);
  
  instance.on('done', (results) => {
    console.log('Load test completed!');
    fs.writeFileSync(config.outputFile, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${config.outputFile}`);
    
    // Print summary
    console.log('\nSummary:');
    console.log(`Requests: ${results.requests.total}`);
    console.log(`Throughput: ${results.requests.average} req/sec`);
    console.log(`Latency (avg): ${results.latency.average} ms`);
    console.log(`Latency (max): ${results.latency.max} ms`);
    console.log(`Errors: ${results.errors}`);
    
    // Print results by endpoint
    console.log('\nResults by endpoint:');
    Object.keys(results.requests.sent).forEach((endpoint) => {
      console.log(`\n${endpoint}:`);
      console.log(`  Requests: ${results.requests.sent[endpoint]}`);
      console.log(`  2xx: ${results.requests['2xx'][endpoint] || 0}`);
      console.log(`  Non-2xx: ${results.requests.non2xx[endpoint] || 0}`);
      console.log(`  Latency (avg): ${results.latency.average[endpoint] || 0} ms`);
    });
  });
}

// Run load test with multiple workers
async function runMultiWorkerLoadTest() {
  console.log(`Starting load test with ${config.workers} workers, ${config.connections} connections per worker...`);
  
  const workers = [];
  const results = [];
  
  for (let i = 0; i < config.workers; i++) {
    const worker = new Worker(`${__dirname}/load-test-worker.js`, {
      workerData: {
        id: i,
        config: {
          ...config,
          connections: Math.floor(config.connections / config.workers),
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
      }
    });
    
    workers.push(worker);
  }
}

// Combine results from multiple workers
function combineResults(results) {
  // Implementation omitted for brevity
  // This would combine the results from multiple workers into a single result
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

// Run the load test
if (config.workers > 1) {
  runMultiWorkerLoadTest();
} else {
  runLoadTest();
}