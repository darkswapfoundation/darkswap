/**
 * Endurance testing for the DarkSwap Bridge
 * 
 * This script tests the performance of the DarkSwap Bridge over an extended period
 * to identify memory leaks, resource exhaustion, and other long-running issues.
 */

const autocannon = require('autocannon');
const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const os = require('os');

// Configuration
const config = {
  // Server URL
  url: 'http://localhost:3001',
  
  // Authentication
  auth: {
    username: 'admin',
    password: 'admin123',
  },
  
  // Test duration in seconds (8 hours)
  duration: 28800,
  
  // Number of concurrent connections
  connections: 50,
  
  // Number of requests per second (moderate load)
  rate: 100,
  
  // Number of workers
  workers: 2,
  
  // Output file
  outputFile: path.join(__dirname, 'endurance-test-results.json'),
  
  // WebSocket URL
  wsUrl: 'ws://localhost:3001',
  
  // Number of WebSocket connections
  wsConnections: 20,
  
  // Metrics collection interval in seconds
  metricsInterval: 300, // 5 minutes
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
    weight: 10,
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
    weight: 5,
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
    weight: 2,
  },
];

// Run endurance test
async function runEnduranceTest() {
  console.log(`Starting endurance test for ${config.duration / 3600} hours...`);
  console.log(`Connections: ${config.connections}, Rate: ${config.rate} req/sec`);
  
  // Start WebSocket connections
  startWebSocketConnections();
  
  // Start metrics collection
  const metrics = {
    timestamps: [],
    cpu: [],
    memory: [],
    requests: [],
    latency: [],
    errors: [],
  };
  
  const metricsInterval = setInterval(() => {
    collectMetrics(metrics);
  }, config.metricsInterval * 1000);
  
  // Run the test
  const instance = autocannon({
    url: config.url,
    connections: config.connections,
    duration: config.duration,
    requests: endpoints,
    context: {},
  });
  
  autocannon.track(instance);
  
  instance.on('done', (results) => {
    console.log('Endurance test completed!');
    
    // Stop metrics collection
    clearInterval(metricsInterval);
    
    // Stop WebSocket connections
    stopWebSocketConnections();
    
    // Save metrics
    fs.writeFileSync(
      path.join(__dirname, 'endurance-metrics.json'),
      JSON.stringify(metrics, null, 2)
    );
    
    // Save results
    fs.writeFileSync(config.outputFile, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${config.outputFile}`);
    
    // Print summary
    console.log('\nSummary:');
    console.log(`Requests: ${results.requests.total}`);
    console.log(`Throughput: ${results.requests.average} req/sec`);
    console.log(`Latency (avg): ${results.latency.average} ms`);
    console.log(`Latency (max): ${results.latency.max} ms`);
    console.log(`Errors: ${results.errors}`);
    
    // Generate report
    generateReport(results, metrics);
  });
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
      
      // Send a message every 30 seconds
      ws.interval = setInterval(() => {
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
        }));
      }, 30000);
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

// Collect system metrics
function collectMetrics(metrics) {
  const timestamp = Date.now();
  
  // CPU usage
  const cpuUsage = os.loadavg()[0]; // 1-minute load average
  
  // Memory usage
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  
  // Add metrics
  metrics.timestamps.push(timestamp);
  metrics.cpu.push(cpuUsage);
  metrics.memory.push(memoryUsage);
  
  console.log(`[${new Date(timestamp).toISOString()}] CPU: ${cpuUsage.toFixed(2)}, Memory: ${memoryUsage.toFixed(2)}%`);
}

// Generate report
function generateReport(results, metrics) {
  console.log('Generating endurance test report...');
  
  const reportPath = path.join(__dirname, 'endurance-report.md');
  
  // Calculate metrics
  const avgCpu = metrics.cpu.reduce((sum, value) => sum + value, 0) / metrics.cpu.length;
  const maxCpu = Math.max(...metrics.cpu);
  const avgMemory = metrics.memory.reduce((sum, value) => sum + value, 0) / metrics.memory.length;
  const maxMemory = Math.max(...metrics.memory);
  
  // Generate report content
  const reportContent = `# DarkSwap Bridge Endurance Test Report

## Test Configuration

- Duration: ${config.duration / 3600} hours
- Connections: ${config.connections}
- Request Rate: ${config.rate} req/sec
- WebSocket Connections: ${config.wsConnections}

## Results Summary

### HTTP Performance

- Total Requests: ${results.requests.total}
- Average Throughput: ${results.requests.average} req/sec
- Average Latency: ${results.latency.average} ms
- Maximum Latency: ${results.latency.max} ms
- Errors: ${results.errors}

### System Metrics

- Average CPU Usage: ${avgCpu.toFixed(2)}
- Maximum CPU Usage: ${maxCpu.toFixed(2)}
- Average Memory Usage: ${avgMemory.toFixed(2)}%
- Maximum Memory Usage: ${maxMemory.toFixed(2)}%

## Analysis

${avgCpu > 80 ? '⚠️ **High CPU Usage**: The system experienced high CPU usage during the test.' : '✅ **CPU Usage**: The system maintained acceptable CPU usage throughout the test.'}

${avgMemory > 80 ? '⚠️ **High Memory Usage**: The system experienced high memory usage during the test.' : '✅ **Memory Usage**: The system maintained acceptable memory usage throughout the test.'}

${results.errors > 0 ? `⚠️ **Errors**: The system encountered ${results.errors} errors during the test.` : '✅ **Errors**: The system did not encounter any errors during the test.'}

${results.latency.average > 500 ? '⚠️ **High Latency**: The system experienced high latency during the test.' : '✅ **Latency**: The system maintained acceptable latency throughout the test.'}

## Conclusion

${
  avgCpu <= 80 && avgMemory <= 80 && results.errors === 0 && results.latency.average <= 500
    ? 'The system performed well during the endurance test, with no significant issues observed.'
    : 'The system experienced some issues during the endurance test. Further investigation and optimization may be required.'
}

## Recommendations

${avgCpu > 80 ? '- Optimize CPU-intensive operations\n' : ''}${avgMemory > 80 ? '- Investigate potential memory leaks\n' : ''}${results.errors > 0 ? '- Address error conditions\n' : ''}${results.latency.average > 500 ? '- Optimize request handling to reduce latency\n' : ''}${avgCpu <= 80 && avgMemory <= 80 && results.errors === 0 && results.latency.average <= 500 ? '- Continue monitoring system performance in production\n' : ''}
`;
  
  // Write report to file
  fs.writeFileSync(reportPath, reportContent);
  console.log(`Report saved to ${reportPath}`);
}

// Run the endurance test
runEnduranceTest();