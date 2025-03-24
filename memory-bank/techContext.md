# DarkSwap Technical Context

This document provides information about the technologies used in DarkSwap, development setup, technical constraints, and dependencies.

## Technologies Used

### Backend Technologies

#### Rust

Rust is the primary language used for the core components of DarkSwap (SDK, CLI, daemon). Rust was chosen for several reasons:

1. **Memory Safety**: Rust's ownership model prevents common memory-related bugs such as null pointer dereferences, buffer overflows, and data races.
2. **Performance**: Rust provides performance comparable to C and C++ without sacrificing safety.
3. **Cross-Platform**: Rust can target multiple platforms, including desktop and web (via WASM).
4. **Ecosystem**: Rust has a growing ecosystem of libraries for Bitcoin, P2P networking, and cryptography.

Key Rust libraries used in DarkSwap:

- **rust-bitcoin**: For Bitcoin functionality
- **rust-libp2p**: For P2P networking
- **tokio**: For asynchronous programming
- **serde**: For serialization and deserialization
- **wasm-bindgen**: For WASM bindings

#### WebAssembly (WASM)

WebAssembly is used to compile the Rust SDK to a format that can run in web browsers. This enables the web interface to use the same core functionality as the desktop applications.

Key WASM tools used in DarkSwap:

- **wasm-pack**: For building and packaging Rust-generated WASM
- **wasm-bindgen**: For creating JavaScript bindings for Rust code

### Frontend Technologies

#### TypeScript

TypeScript is used for the web interface. TypeScript was chosen for several reasons:

1. **Type Safety**: TypeScript provides static typing, which helps catch errors at compile time.
2. **Developer Experience**: TypeScript offers better tooling and IDE support compared to plain JavaScript.
3. **Ecosystem**: TypeScript has a large ecosystem of libraries and frameworks.

#### React

React is used as the UI library for the web interface. React was chosen for several reasons:

1. **Component-Based**: React's component-based architecture aligns well with the modular design of DarkSwap.
2. **Virtual DOM**: React's virtual DOM provides efficient updates to the UI.
3. **Ecosystem**: React has a large ecosystem of libraries and tools.

#### Tailwind CSS

Tailwind CSS is used for styling the web interface. Tailwind was chosen for several reasons:

1. **Utility-First**: Tailwind's utility-first approach allows for rapid UI development.
2. **Customization**: Tailwind is highly customizable and can be tailored to the project's needs.
3. **Performance**: Tailwind generates minimal CSS, resulting in smaller file sizes.

### P2P Networking Technologies

#### libp2p

libp2p is used for P2P networking. libp2p was chosen for several reasons:

1. **Modularity**: libp2p is modular and allows for using only the components needed.
2. **Cross-Platform**: libp2p works on desktop and web browsers.
3. **Multiple Transport Protocols**: libp2p supports multiple transport protocols, including TCP, WebSockets, and WebRTC.
4. **NAT Traversal**: libp2p includes mechanisms for NAT traversal, which is essential for P2P applications.

Key libp2p protocols used in DarkSwap:

- **GossipSub**: For efficient message broadcasting
- **Kademlia DHT**: For peer discovery and content addressing
- **WebRTC**: For browser-to-browser communication
- **Circuit Relay**: For NAT traversal

### Bitcoin Technologies

#### Bitcoin Core

Bitcoin Core is the reference implementation of the Bitcoin protocol. DarkSwap interacts with Bitcoin Core through its RPC interface for certain operations.

#### PSBTs (Partially Signed Bitcoin Transactions)

PSBTs are a standardized format for representing Bitcoin transactions that are not fully signed yet. DarkSwap uses PSBTs for secure trade execution.

#### Runes

Runes are a protocol for creating fungible tokens on Bitcoin. DarkSwap supports trading runes.

#### Alkanes

Alkanes are a protocol built on top of runes. DarkSwap supports trading alkanes.

## Development Setup

### Prerequisites

- **Rust**: 1.70.0 or later
- **Node.js**: 18.0.0 or later
- **npm**: 9.0.0 or later
- **wasm-pack**: 0.10.0 or later
- **Bitcoin Core**: 25.0 or later (optional, for testing with a local Bitcoin node)

### Development Environment

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/darkswap/darkswap.git
   cd darkswap
   ```

2. **Build the Project**:
   ```bash
   ./build.sh --all
   ```

3. **Run the CLI**:
   ```bash
   ./target/debug/darkswap-cli --help
   ```

4. **Run the Daemon**:
   ```bash
   ./target/debug/darkswap-daemon --listen 127.0.0.1:8000
   ```

5. **Run the Web Interface**:
   ```bash
   cd web
   npm run dev
   ```

### Development Workflow

1. **Make Changes**: Make changes to the code.
2. **Build**: Build the project with `./build.sh`.
3. **Test**: Run tests with `cargo test` for Rust code and `npm test` for TypeScript code.
4. **Run**: Run the application to test your changes.
5. **Commit**: Commit your changes with a descriptive commit message.

### IDE Setup

#### Visual Studio Code

1. **Install Extensions**:
   - Rust Analyzer: For Rust code
   - ESLint: For TypeScript code
   - Prettier: For code formatting
   - Tailwind CSS IntelliSense: For Tailwind CSS

2. **Configure Settings**:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "rust-analyzer.checkOnSave.command": "clippy",
     "rust-analyzer.cargo.allFeatures": true
   }
   ```

## Technical Constraints

### Bitcoin Constraints

1. **Transaction Model**: Bitcoin's UTXO model requires careful transaction construction to ensure atomicity.
2. **Block Time**: Bitcoin's 10-minute block time means that trade confirmations can take some time.
3. **Transaction Fees**: Bitcoin transaction fees can be high during periods of network congestion.
4. **Script Limitations**: Bitcoin's script language has limitations that affect what can be done in transactions.

### P2P Networking Constraints

1. **NAT Traversal**: NAT traversal is a challenge for P2P applications, requiring techniques like circuit relay and STUN/TURN.
2. **Browser Limitations**: Browsers have limited networking capabilities, requiring the use of WebRTC and WebSockets.
3. **Network Reliability**: P2P networks can be unreliable, with peers joining and leaving frequently.
4. **Scalability**: P2P networks can face scalability challenges as the number of peers increases.

### WebAssembly Constraints

1. **Size**: WASM binaries can be large, affecting load times.
2. **Browser Support**: While WASM is supported by all major browsers, there may be differences in performance and capabilities.
3. **JavaScript Interop**: Interacting with JavaScript from WASM can introduce overhead.
4. **Threading**: WASM threading support is limited in browsers.

## Dependencies

### Rust Dependencies

#### Core Dependencies

- **tokio**: Asynchronous runtime
- **serde**: Serialization and deserialization
- **thiserror**: Error handling
- **log**: Logging
- **env_logger**: Logging configuration

#### Bitcoin Dependencies

- **bitcoin**: Bitcoin functionality
- **bdk**: Bitcoin Development Kit (optional)

#### P2P Networking Dependencies

- **libp2p**: P2P networking
- **libp2p-webrtc**: WebRTC transport for libp2p
- **libp2p-gossipsub**: GossipSub protocol for libp2p
- **libp2p-kad**: Kademlia DHT for libp2p

#### CLI Dependencies

- **clap**: Command-line argument parsing

#### HTTP Server Dependencies

- **axum**: HTTP server for the daemon
- **tower**: Middleware for HTTP servers
- **hyper**: HTTP implementation

### TypeScript Dependencies

#### Core Dependencies

- **react**: UI library
- **react-dom**: DOM rendering for React
- **react-router-dom**: Routing for React

#### Build Dependencies

- **typescript**: TypeScript compiler
- **vite**: Build tool
- **tailwindcss**: CSS framework
- **postcss**: CSS processing
- **autoprefixer**: CSS vendor prefixing

#### Testing Dependencies

- **jest**: Testing framework
- **@testing-library/react**: Testing utilities for React

## Deployment Considerations

### SDK Deployment

The SDK can be deployed in various ways:

1. **Native Library**: For desktop applications
2. **WASM Module**: For browser applications
3. **NPM Package**: For JavaScript applications

### CLI Deployment

The CLI can be deployed as a standalone binary for various platforms:

1. **Linux**: For Linux users
2. **macOS**: For macOS users
3. **Windows**: For Windows users

### Daemon Deployment

The daemon can be deployed as a service on various platforms:

1. **Systemd Service**: For Linux servers
2. **Docker Container**: For containerized deployments
3. **Cloud Service**: For cloud deployments

### Web Interface Deployment

The web interface can be deployed as a static website:

1. **Static Hosting**: For simple deployments
2. **CDN**: For global distribution
3. **IPFS**: For decentralized hosting

## Performance Considerations

### SDK Performance

1. **Memory Usage**: Minimize memory usage, especially for WASM builds.
2. **CPU Usage**: Optimize CPU-intensive operations.
3. **Network Efficiency**: Minimize network traffic and optimize protocols.

### P2P Network Performance

1. **Connection Management**: Efficiently manage connections to peers.
2. **Message Routing**: Optimize message routing for efficiency.
3. **NAT Traversal**: Efficiently handle NAT traversal.

### Web Interface Performance

1. **Bundle Size**: Minimize JavaScript bundle size.
2. **Rendering Performance**: Optimize React rendering.
3. **Network Requests**: Minimize and optimize network requests.

## Security Considerations

### Bitcoin Security

1. **Transaction Validation**: Validate all transactions to ensure they match the trade parameters.
2. **Key Management**: Securely manage private keys.
3. **Fee Estimation**: Accurately estimate transaction fees to prevent fee sniping.

### P2P Network Security

1. **Peer Authentication**: Authenticate peers to prevent impersonation.
2. **Message Validation**: Validate all messages to prevent attacks.
3. **DoS Protection**: Protect against denial-of-service attacks.

### Web Interface Security

1. **Input Validation**: Validate all user inputs.
2. **XSS Protection**: Protect against cross-site scripting attacks.
3. **CSRF Protection**: Protect against cross-site request forgery attacks.

## Conclusion

DarkSwap uses a modern tech stack with Rust, WebAssembly, TypeScript, React, and libp2p to create a decentralized, secure, and efficient platform for P2P trading of Bitcoin, runes, and alkanes. The technical choices made in the project aim to balance performance, security, and user experience while addressing the constraints of the Bitcoin ecosystem and P2P networking.