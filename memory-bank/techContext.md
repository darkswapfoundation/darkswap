# DarkSwap Technical Context

## Technology Stack

### Programming Languages

1. **Rust**: Primary language for core components, SDK, daemon, and CLI
2. **TypeScript**: Used for web interface and browser integration
3. **WebAssembly (WASM)**: For running Rust code in browser environments

### Core Libraries and Frameworks

1. **Rust Libraries**:
   - **libp2p**: Peer-to-peer networking library
   - **tokio**: Asynchronous runtime for Rust
   - **ring**: Cryptographic operations
   - **bdk (Bitcoin Dev Kit)**: Bitcoin wallet functionality
   - **serde**: Serialization and deserialization

2. **TypeScript/JavaScript Libraries**:
   - **React**: Web UI framework
   - **WebRTC**: Browser-based peer-to-peer communication

### Architecture Components (Project Crates/Directories)

1.  **darkswap-sdk**: Core Rust library providing core logic, types, and functionality (wallet, orderbook, trade execution, runes, alkanes, predicates).
2.  **darkswap-p2p**: Rust crate managing peer-to-peer networking using libp2p and WebRTC. Includes connection pooling, encryption, auth, metrics.
3.  **darkswap-relay**: Standalone Rust server for facilitating NAT traversal via circuit relay (based on Subfrost).
4.  **darkswap-cli**: Command-line interface for user interaction.
5.  **darkswap-daemon**: Background service providing a persistent node and potentially a REST API.
6.  **darkswap-web-sys**: Rust crate providing WebAssembly (WASM) bindings for browser usage, generated using `wasm-pack`.
7.  **darkswap-lib**: TypeScript library for interacting with WASM bindings in web environments (React hooks, context).
8.  **darkswap-bridge**: Rust component potentially bridging different parts of the system or external services (includes server/web/mobile stubs).
9.  **darkswap-support**: Utility crate likely containing shared code (crypto, validation, formatting).
10. **darkswap-core**: Appears to be another layer, potentially containing `darkswap-lib` or related core logic. (Needs clarification)
11. **darkswap-network**: Parent directory containing `darkswap-p2p` and `darkswap-relay`.
12. **web**: React-based web frontend application using TypeScript and Tailwind CSS.
13. **server**: Node.js server component, possibly related to the bridge or web backend tasks.

### Development Tools

1. **Cargo**: Rust package manager and build tool
2. **npm/yarn**: JavaScript package management
3. **wasm-pack**: WebAssembly packaging tool
4. **Docker**: Containerization for deployment
5. **Prometheus/Grafana**: Monitoring and metrics visualization

### Reference Materials (`reference/` directory)

Contains technical documentation, analysis of related projects, and cloned reference repositories:
1.  **Analysis**: Comparisons and implementation details derived from PintSwap and Subfrost.
2.  **Guides**: Implementation guides for WebRTC, TURN servers, Runes/Alkanes.
3.  **Cloned Repos**: Includes `pintswap`, `subfrost`, `bdk`, `alkanes-rs`, etc., used for reference during development.

## Technical Capabilities

### P2P Networking

The P2P networking layer provides:

1. **WebRTC Transport**: Browser-compatible peer-to-peer communication
2. **Circuit Relay**: NAT traversal for connecting peers behind firewalls
3. **Connection Pooling**: Efficient reuse of WebRTC connections
4. **Relay Discovery**: Finding and ranking relay nodes
5. **Authentication**: Secure peer verification
6. **End-to-End Encryption**: Secure communication between peers

### Wallet Integration

The wallet system supports:

1. **Bitcoin Transactions**: Creating and signing Bitcoin transactions
2. **Runes Support**: Handling rune assets on Bitcoin
3. **Alkanes Support**: Managing alkane tokens
4. **Key Management**: Secure private key handling
5. **Multiple Wallet Types**: Simple wallet and BDK wallet implementations

### Order Book Management

The order book system provides:

1. **Order Creation**: Creating buy and sell orders
2. **Order Matching**: Finding compatible orders
3. **Order Execution**: Completing trades between peers
4. **Order Distribution**: Sharing order book data across the network

### Trade Execution

The trade system handles:

1. **Trade Protocol**: Secure peer-to-peer trade execution
2. **Transaction Validation**: Verifying transaction validity
3. **Atomic Swaps**: Ensuring trade atomicity
4. **Error Handling**: Graceful handling of trade failures

## Technical Constraints

1. **Cross-Platform Compatibility**: Must work across desktop and web platforms
2. **Browser Limitations**: WebRTC and WASM have specific constraints in browsers
3. **Network Connectivity**: Must handle NAT traversal and unreliable connections
4. **Security Requirements**: Must ensure secure transactions and communications
5. **Performance Considerations**: Must maintain responsiveness with limited resources

## Integration Points

1. **Bitcoin Network**: Integration with Bitcoin for transactions
2. **Browser Environment**: Integration with web browsers via WebAssembly
3. **Operating System**: Integration with OS for daemon functionality
4. **External Wallets**: Potential integration with external wallet software

## Technical Roadmap (Aligned with Consolidated Roadmap)

| Phase | Description                 | Status      | Key Technical Areas                                                                 |
|-------|-----------------------------|-------------|-------------------------------------------------------------------------------------|
| 1     | Core SDK Implementation     | COMPLETED   | Rust SDK (`darkswap-sdk`), P2P (`darkswap-p2p`), Wallet, Orderbook, Trade, Assets (Runes/Alkanes), WASM (`darkswap-web-sys`) |
| 2     | CLI and Daemon Implementation | COMPLETED   | `darkswap-cli`, `darkswap-daemon`, REST API                                         |
| 3     | Web Interface Implementation| IN PROGRESS | React (`web`), TypeScript Lib (`darkswap-lib`), Relay Server (`darkswap-relay`), WASM Integration, Testing, Security, Performance |
| 4     | Testing and Refinement      | PLANNED     | E2E Testing, Security Auditing, Performance Optimization                            |
| 5     | Documentation and Release   | PLANNED     | API Docs, User Guides, CI/CD, Distribution Packages                                 |
