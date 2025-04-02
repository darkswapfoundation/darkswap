# DarkSwap Integration Tests

This document explains how to run the integration tests for the DarkSwap WebAssembly bindings.

## Overview

The integration tests verify that the DarkSwap WebAssembly bindings work correctly with a relay server. They test the following functionality:

- Initializing the SDK with relay configuration
- Connecting to the P2P network
- Connecting to a relay server
- Getting peers
- Creating and canceling orders
- Handling network events

## Prerequisites

Before running the integration tests, ensure you have the following prerequisites installed:

- **Rust** (1.70.0 or later)
- **Node.js** (16.0.0 or later)
- **npm** (8.0.0 or later)

## Running the Integration Tests

### Using the Test Script

The easiest way to run the integration tests is to use the provided test script:

```bash
./run-integration-tests.sh
```

This script will:

1. Check if a relay server is running
2. Start a relay server if needed
3. Run the integration tests
4. Stop the relay server when done

### Test Script Options

The test script supports several options:

- `--no-relay`: Don't start a relay server (use an existing one)
- `--relay-server URL`: Use a specific relay server URL (default: ws://localhost:9002/ws)
- `--test-files GLOB`: Run specific test files (default: tests/integration/*.test.ts)

Example:

```bash
./run-integration-tests.sh --relay-server ws://relay.darkswap.io/ws --test-files tests/integration/relay-integration.test.ts
```

### Running Tests Manually

If you prefer to run the integration tests manually, follow these steps:

1. Start a relay server:

```bash
cd ../darkswap-relay
./target/debug/darkswap-relay
```

2. In a separate terminal, run the integration tests:

```bash
cd ../darkswap-web-sys
RELAY_SERVER=ws://localhost:9002/ws npx vitest run tests/integration/*.test.ts
```

## Test Environment Variables

The integration tests use the following environment variables:

- `RELAY_SERVER`: The URL of the relay server to connect to (default: ws://localhost:9002/ws)
- `SKIP_INTEGRATION_TESTS`: Set to "true" to skip the integration tests

Example:

```bash
RELAY_SERVER=ws://relay.darkswap.io/ws SKIP_INTEGRATION_TESTS=false npx vitest run tests/integration/*.test.ts
```

## Test Structure

The integration tests are located in the `tests/integration` directory. Each test file focuses on a specific aspect of the DarkSwap WebAssembly bindings.

### Relay Integration Test

The `relay-integration.test.ts` file tests the integration between the DarkSwap WebAssembly bindings and a relay server. It covers:

- Connecting to a relay server
- Getting peers
- Creating and canceling orders
- Handling network events

### Test Timeouts

The integration tests have a default timeout of 30 seconds. This is to allow for network latency and the time it takes to establish connections. You can adjust the timeout by modifying the `TEST_TIMEOUT` constant in the test files.

## Troubleshooting

### Relay Server Not Running

If you get an error that the relay server is not running, make sure you have started the relay server:

```bash
cd ../darkswap-relay
./target/debug/darkswap-relay
```

### Connection Refused

If you get a "Connection refused" error, make sure the relay server is running and listening on the correct port:

```bash
curl http://localhost:9090/metrics
```

This should return the metrics from the relay server. If it doesn't, the relay server is not running or not listening on the correct port.

### Test Timeouts

If the tests are timing out, you may need to increase the timeout value:

```typescript
// Increase the test timeout
const TEST_TIMEOUT = 60000; // 60 seconds
```

### Skipping Tests

If you want to skip the integration tests, set the `SKIP_INTEGRATION_TESTS` environment variable:

```bash
SKIP_INTEGRATION_TESTS=true npm test
```

## Continuous Integration

The integration tests are designed to run in a continuous integration (CI) environment. In a CI environment, you should:

1. Build the relay server
2. Start the relay server
3. Run the integration tests
4. Stop the relay server

Example CI configuration:

```yaml
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      
      - name: Set up Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Build relay server
        run: |
          cd darkswap-relay
          cargo build
      
      - name: Start relay server
        run: |
          cd darkswap-relay
          ./target/debug/darkswap-relay &
          sleep 5
      
      - name: Run integration tests
        run: |
          cd darkswap-web-sys
          npm install
          npm test -- integration
      
      - name: Stop relay server
        run: |
          pkill -f darkswap-relay || true
```

## Writing New Integration Tests

When writing new integration tests, follow these guidelines:

1. Place the test file in the `tests/integration` directory
2. Use the `describe` and `it` functions from Vitest
3. Use the `beforeAll` and `afterAll` hooks to set up and tear down the test environment
4. Use the `expect` function to make assertions
5. Use the `TEST_TIMEOUT` constant to set the test timeout
6. Use the `SKIP_TESTS` constant to skip tests if needed

Example:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import darkswap from '../../src/index';

// Skip these tests if the SKIP_INTEGRATION_TESTS environment variable is set
const SKIP_TESTS = process.env.SKIP_INTEGRATION_TESTS === 'true';

// Relay server configuration
const RELAY_SERVER = process.env.RELAY_SERVER || 'ws://localhost:9002/ws';

// Test timeout
const TEST_TIMEOUT = 30000; // 30 seconds

describe('My Integration Test', () => {
  // Skip all tests if SKIP_INTEGRATION_TESTS is set
  if (SKIP_TESTS) {
    it.skip('Integration tests are skipped', () => {});
    return;
  }
  
  // Initialize the SDK before all tests
  beforeAll(async () => {
    await darkswap.initialize();
    await darkswap.connect();
  }, TEST_TIMEOUT);
  
  // Disconnect after all tests
  afterAll(async () => {
    if (darkswap.isConnected()) {
      await darkswap.disconnect();
    }
  });
  
  // Test something
  it('should do something', async () => {
    // Test code here
    expect(true).toBe(true);
  }, TEST_TIMEOUT);
});
```

## Conclusion

The integration tests are an important part of the DarkSwap WebAssembly bindings. They ensure that the bindings work correctly with a relay server and that the API functions as expected.

For more information on the DarkSwap WebAssembly bindings, see the [API documentation](./API.md).