# DarkSwap vs. PintSwap: Architecture Comparison

This document provides a detailed comparison between DarkSwap and PintSwap architectures, highlighting the key differences, improvements, and design decisions.

## Overview

Both DarkSwap and PintSwap are decentralized peer-to-peer trading platforms that enable trustless trading without requiring a central server or authority. However, they differ in their implementation approaches, supported assets, and technical architecture.

## Key Differences

### 1. Programming Language and Runtime

**PintSwap:**
- Implemented in JavaScript/TypeScript
- Uses Node.js runtime for CLI and daemon
- Uses browser JavaScript runtime for web interface
- Uses js-libp2p for P2P networking

**DarkSwap:**
- Implemented in Rust
- Compiles to native code for CLI and daemon
- Compiles to WebAssembly for browser compatibility
- Uses rust-libp2p for P2P networking

### 2. Supported Assets

**PintSwap:**
- Ethereum and ERC-20 tokens
- Limited support for other blockchain assets

**DarkSwap:**
- Bitcoin
- Runes (Bitcoin-based tokens using Ordinals)
- Alkanes (Bitcoin-based metaprotocol tokens)

### 3. Trade Execution

**PintSwap:**
- Uses Ethereum smart contracts for trade execution
- Requires Ethereum gas fees
- Limited by Ethereum block times and gas costs

**DarkSwap:**
- Uses PSBTs (Partially Signed Bitcoin Transactions) for trade execution
- Requires Bitcoin transaction fees
- More efficient and cost-effective for Bitcoin-based assets

### 4. P2P Networking

**PintSwap:**
- Uses js-libp2p with WebRTC transport
- Limited circuit relay implementation
- Simpler but less robust peer discovery

**DarkSwap:**
- Uses rust-libp2p with WebRTC transport
- Advanced circuit relay implementation (ported from Subfrost)
- More robust peer discovery and NAT traversal

### 5. Orderbook Management

**PintSwap:**
- Simple in-memory orderbook
- Limited order matching capabilities
- Basic order expiry and cleanup

**DarkSwap:**
- Thread-safe orderbook with mutex protection
- Advanced order matching algorithm
- Comprehensive order expiry and cleanup

### 6. Security Model

**PintSwap:**
- Relies on Ethereum's security model
- Limited validation of trade parameters
- Vulnerable to certain types of front-running attacks

**DarkSwap:**
- Relies on Bitcoin's security model
- Comprehensive validation of trade parameters
- More resistant to front-running attacks

## Architecture Comparison

### System Architecture

**PintSwap:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Ethereum Blockchain                     │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                      PintSwap Layer                         │
├─────────────────────┬─────────────────────┬─────────────────┤
│   P2P Network       │    Orderbook        │   Trade Engine  │
│   (js-libp2p)       │    Management       │   (Ethereum)    │
└─────────────────────┴─────────────────────┴─────────────────┘
```

**DarkSwap:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Bitcoin Blockchain                      │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                    ALKANES Metaprotocol                     │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                      DarkSwap Layer                         │
├─────────────────────┬─────────────────────┬─────────────────┤
│   P2P Network       │    Orderbook        │   Trade Engine  │
│   (rust-libp2p)     │    Management       │   (PSBT)        │
└─────────────────────┴─────────────────────┴─────────────────┘
```

### Component Architecture

#### P2P Network

**PintSwap:**

```javascript
// PintSwap P2P Network (JavaScript)
class PintSwapNetwork {
  constructor(options) {
    this.libp2p = null;
    this.options = options;
  }

  async start() {
    // Create libp2p node
    this.libp2p = await createLibp2p({
      addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0/ws'],
      },
      transports: [
        webSockets(),
        webRTC(),
      ],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()],
      peerDiscovery: [
        bootstrap({
          list: this.options.bootstrapPeers,
        }),
        mdns(),
      ],
      pubsub: gossipsub({
        allowPublishToZeroPeers: true,
      }),
    });

    // Subscribe to gossipsub topic
    await this.libp2p.pubsub.subscribe(this.options.topic);
  }

  async publish(message) {
    await this.libp2p.pubsub.publish(this.options.topic, Buffer.from(JSON.stringify(message)));
  }

  async stop() {
    await this.libp2p.stop();
  }
}
```

**DarkSwap:**

```rust
// DarkSwap P2P Network (Rust)
pub struct Network {
    /// Network configuration
    config: NetworkConfig,
    /// Swarm
    swarm: Option<Swarm<NetworkBehavior>>,
    /// Local peer ID
    local_peer_id: PeerId,
    /// Network keypair
    keypair: Keypair,
    /// Gossipsub topic
    topic: Topic,
    /// Event sender
    event_sender: mpsc::Sender<NetworkEvent>,
    /// Event receiver
    event_receiver: mpsc::Receiver<NetworkEvent>,
    /// Command sender
    command_sender: mpsc::Sender<NetworkCommand>,
    /// Command receiver
    command_receiver: mpsc::Receiver<NetworkCommand>,
    /// Known peers
    known_peers: Arc<Mutex<HashSet<PeerId>>>,
    /// Connected peers
    connected_peers: Arc<Mutex<HashSet<PeerId>>>,
    /// Response channels
    response_channels: Arc<Mutex<HashMap<String, oneshot::Sender<Result<MessageType>>>>>,
}

impl Network {
    /// Create a new network
    pub fn new(config: &NetworkConfig) -> Result<Self> {
        // Create keypair
        let keypair = Keypair::generate_ed25519();
        let local_peer_id = PeerId(keypair.public().to_peer_id().to_string());

        // Create channels
        let (event_sender, event_receiver) = mpsc::channel(100);
        let (command_sender, command_receiver) = mpsc::channel(100);

        // Create gossipsub topic
        let topic = Topic::new(config.gossipsub_topic.clone());

        Ok(Self {
            config: config.clone(),
            swarm: None,
            local_peer_id,
            keypair,
            topic,
            event_sender,
            event_receiver,
            command_sender,
            command_receiver,
            known_peers: Arc::new(Mutex::new(HashSet::new())),
            connected_peers: Arc::new(Mutex::new(HashSet::new())),
            response_channels: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    /// Start the network
    pub async fn start(&mut self) -> Result<()> {
        // Create transport
        let transport = self.create_transport().await?;

        // Create behavior
        let behavior = NetworkBehavior {
            gossipsub: self.create_gossipsub()?,
            kademlia: self.create_kademlia()?,
            mdns: self.create_mdns().await?,
            relay_client: relay::client::Client::new(self.keypair.public().to_peer_id()),
        };

        // Create swarm
        let mut swarm = SwarmBuilder::with_tokio_executor(transport, behavior, self.keypair.public().to_peer_id())
            .build();

        // Subscribe to gossipsub topic
        swarm.behaviour_mut().gossipsub.subscribe(&self.topic)?;

        // Listen on addresses
        for addr in &self.config.listen_addresses {
            if let Ok(addr) = addr.parse() {
                swarm.listen_on(addr)?;
            }
        }

        // Store swarm
        self.swarm = Some(swarm);

        // Start event loop
        self.start_event_loop();

        Ok(())
    }

    /// Broadcast a message
    pub async fn broadcast_message(&self, message: MessageType) -> Result<()> {
        let (tx, rx) = oneshot::channel();

        self.command_sender
            .send(NetworkCommand::BroadcastMessage {
                message,
                response_channel: Some(tx),
            })
            .await?;

        rx.await?
    }

    /// Stop the network
    pub async fn stop(&mut self) -> Result<()> {
        // Clear swarm
        self.swarm = None;

        Ok(())
    }
}
```

#### Orderbook Management

**PintSwap:**

```javascript
// PintSwap Orderbook (JavaScript)
class Orderbook {
  constructor() {
    this.orders = new Map();
    this.buyOrders = new Map();
    this.sellOrders = new Map();
  }

  addOrder(order) {
    // Add order to orders map
    this.orders.set(order.id, order);

    // Add order to buy/sell maps
    const assetPair = `${order.baseAsset}/${order.quoteAsset}`;
    const orderMap = order.side === 'buy' ? this.buyOrders : this.sellOrders;
    
    if (!orderMap.has(assetPair)) {
      orderMap.set(assetPair, []);
    }
    
    orderMap.get(assetPair).push(order.id);
    
    // Sort orders by price
    this.sortOrders();
  }

  removeOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) return;
    
    // Remove from orders map
    this.orders.delete(orderId);
    
    // Remove from buy/sell maps
    const assetPair = `${order.baseAsset}/${order.quoteAsset}`;
    const orderMap = order.side === 'buy' ? this.buyOrders : this.sellOrders;
    
    if (orderMap.has(assetPair)) {
      const orders = orderMap.get(assetPair);
      const index = orders.indexOf(orderId);
      if (index !== -1) {
        orders.splice(index, 1);
      }
    }
  }

  sortOrders() {
    // Sort buy orders by price (highest first)
    for (const [assetPair, orderIds] of this.buyOrders.entries()) {
      orderIds.sort((a, b) => {
        const orderA = this.orders.get(a);
        const orderB = this.orders.get(b);
        return orderB.price - orderA.price;
      });
    }
    
    // Sort sell orders by price (lowest first)
    for (const [assetPair, orderIds] of this.sellOrders.entries()) {
      orderIds.sort((a, b) => {
        const orderA = this.orders.get(a);
        const orderB = this.orders.get(b);
        return orderA.price - orderB.price;
      });
    }
  }

  matchOrder(order) {
    const matches = [];
    
    // Get the appropriate side map to match against
    const sideMap = order.side === 'buy' ? this.sellOrders : this.buyOrders;
    
    const assetPair = `${order.baseAsset}/${order.quoteAsset}`;
    if (sideMap.has(assetPair)) {
      const orderIds = sideMap.get(assetPair);
      for (const orderId of orderIds) {
        const otherOrder = this.orders.get(orderId);
        if (this.canMatch(order, otherOrder)) {
          matches.push(otherOrder);
        }
      }
    }
    
    return matches;
  }

  canMatch(orderA, orderB) {
    // Check if orders are on opposite sides
    if (orderA.side === orderB.side) return false;
    
    // Check if orders are for the same assets
    if (orderA.baseAsset !== orderB.baseAsset || orderA.quoteAsset !== orderB.quoteAsset) return false;
    
    // Check if prices match
    if (orderA.side === 'buy') {
      return orderA.price >= orderB.price;
    } else {
      return orderA.price <= orderB.price;
    }
  }
}
```

**DarkSwap:**

```rust
// DarkSwap Orderbook (Rust)
pub struct Orderbook {
    /// Orders by ID
    orders: HashMap<OrderId, Order>,
    /// Buy orders by asset pair
    buy_orders: HashMap<(Asset, Asset), Vec<OrderId>>,
    /// Sell orders by asset pair
    sell_orders: HashMap<(Asset, Asset), Vec<OrderId>>,
    /// Orders by maker
    maker_orders: HashMap<PeerId, HashSet<OrderId>>,
    /// Last cleanup time
    last_cleanup: u64,
}

impl Orderbook {
    /// Create a new orderbook
    pub fn new() -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            orders: HashMap::new(),
            buy_orders: HashMap::new(),
            sell_orders: HashMap::new(),
            maker_orders: HashMap::new(),
            last_cleanup: now,
        }
    }

    /// Add an order to the orderbook
    pub fn add_order(&mut self, order: Order) {
        let order_id = order.id.clone();
        let maker = order.maker.clone();
        let base_asset = order.base_asset.clone();
        let quote_asset = order.quote_asset.clone();
        let side = order.side;

        // Add the order to the orders map
        self.orders.insert(order_id.clone(), order);

        // Add the order to the appropriate side map
        let side_map = match side {
            OrderSide::Buy => &mut self.buy_orders,
            OrderSide::Sell => &mut self.sell_orders,
        };

        let asset_pair = (base_asset, quote_asset);
        let orders = side_map.entry(asset_pair).or_insert_with(Vec::new);
        orders.push(order_id.clone());

        // Add the order to the maker's orders
        let maker_orders = self.maker_orders.entry(maker).or_insert_with(HashSet::new);
        maker_orders.insert(order_id);

        // Sort the orders by price (best price first)
        self.sort_orders();
    }

    /// Remove an order from the orderbook
    pub fn remove_order(&mut self, order_id: &OrderId) {
        if let Some(order) = self.orders.remove(order_id) {
            // Remove the order from the appropriate side map
            let side_map = match order.side {
                OrderSide::Buy => &mut self.buy_orders,
                OrderSide::Sell => &mut self.sell_orders,
            };

            let asset_pair = (order.base_asset, order.quote_asset);
            if let Some(orders) = side_map.get_mut(&asset_pair) {
                orders.retain(|id| id != order_id);
            }

            // Remove the order from the maker's orders
            if let Some(maker_orders) = self.maker_orders.get_mut(&order.maker) {
                maker_orders.remove(order_id);
            }
        }
    }

    /// Match an order with existing orders
    pub fn match_order(&mut self, order: &Order) -> Vec<Order> {
        let mut matches = Vec::new();

        // Get the appropriate side map to match against
        let side_map = match order.side {
            OrderSide::Buy => &self.sell_orders,
            OrderSide::Sell => &self.buy_orders,
        };

        let asset_pair = (order.base_asset.clone(), order.quote_asset.clone());
        if let Some(order_ids) = side_map.get(&asset_pair) {
            for order_id in order_ids {
                if let Some(other_order) = self.orders.get(order_id) {
                    if order.can_match(other_order) {
                        matches.push(other_order.clone());
                    }
                }
            }
        }

        // Sort matches by price (best price first)
        matches.sort_by(|a, b| {
            match order.side {
                OrderSide::Buy => b.price.cmp(&a.price), // For buy orders, sort by lowest sell price
                OrderSide::Sell => a.price.cmp(&b.price), // For sell orders, sort by highest buy price
            }
        });

        matches
    }

    /// Sort orders by price
    fn sort_orders(&mut self) {
        // Sort buy orders by price (highest first)
        for (_, order_ids) in self.buy_orders.iter_mut() {
            order_ids.sort_by(|a, b| {
                let order_a = self.orders.get(a).unwrap();
                let order_b = self.orders.get(b).unwrap();
                order_b.price.cmp(&order_a.price)
            });
        }

        // Sort sell orders by price (lowest first)
        for (_, order_ids) in self.sell_orders.iter_mut() {
            order_ids.sort_by(|a, b| {
                let order_a = self.orders.get(a).unwrap();
                let order_b = self.orders.get(b).unwrap();
                order_a.price.cmp(&order_b.price)
            });
        }
    }
}
```

#### Trade Execution

**PintSwap:**

```javascript
// PintSwap Trade Execution (JavaScript)
class TradeExecutor {
  constructor(web3) {
    this.web3 = web3;
  }

  async executeTrade(order, taker, amount) {
    // Create trade object
    const trade = {
      id: uuid.v4(),
      orderId: order.id,
      maker: order.maker,
      taker,
      baseAsset: order.baseAsset,
      quoteAsset: order.quoteAsset,
      side: order.side,
      amount,
      price: order.price,
      status: 'pending',
      timestamp: Math.floor(Date.now() / 1000),
    };

    // Create Ethereum transaction
    const tx = await this.createTransaction(trade);

    // Sign transaction
    const signedTx = await this.web3.eth.accounts.signTransaction(tx, taker.privateKey);

    // Send transaction
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    // Update trade status
    trade.status = receipt.status ? 'completed' : 'failed';
    trade.txHash = receipt.transactionHash;

    return trade;
  }

  async createTransaction(trade) {
    // Create Ethereum transaction based on trade parameters
    // This is a simplified example
    const tx = {
      from: trade.taker.address,
      to: trade.maker.address,
      value: this.web3.utils.toWei(trade.amount.toString(), 'ether'),
      gas: 21000,
      gasPrice: await this.web3.eth.getGasPrice(),
    };

    return tx;
  }
}
```

**DarkSwap:**

```rust
// DarkSwap Trade Execution (Rust)
pub struct TradeNegotiator {
    /// Trade manager
    trade_manager: ThreadSafeTradeManager,
    /// PSBT builder
    psbt_builder: PsbtBuilder,
}

impl TradeNegotiator {
    /// Create a new trade negotiator
    pub fn new(trade_manager: ThreadSafeTradeManager, network: bitcoin::Network) -> Self {
        Self {
            trade_manager,
            psbt_builder: PsbtBuilder::new(network),
        }
    }

    /// Create a trade
    pub fn create_trade(&self, order: &Order, taker: PeerId, amount: Decimal) -> Result<Trade> {
        // Verify that the order is open
        if order.status != OrderStatus::Open {
            return Err(Error::OrderNotOpen);
        }

        // Verify that the amount is valid
        if amount <= Decimal::ZERO || amount > order.amount {
            return Err(Error::InvalidTradeAmount);
        }

        // Create the trade
        let trade = Trade::new(order, taker, amount);

        // Add the trade to the trade manager
        self.trade_manager.add_trade(trade.clone())?;

        Ok(trade)
    }

    /// Create a PSBT for a trade
    pub fn create_psbt(
        &self,
        trade: &Trade,
        maker_inputs: Vec<(OutPoint, TxOut)>,
        maker_outputs: Vec<TxOut>,
        taker_inputs: Vec<(OutPoint, TxOut)>,
        taker_outputs: Vec<TxOut>,
    ) -> Result<Psbt> {
        self.psbt_builder.create_psbt(trade, maker_inputs, maker_outputs, taker_inputs, taker_outputs)
    }

    /// Verify a PSBT for a trade
    pub fn verify_psbt(&self, trade: &Trade, psbt: &Psbt) -> Result<bool> {
        self.psbt_builder.verify_psbt(trade, psbt)
    }

    /// Finalize a PSBT
    pub fn finalize_psbt(&self, psbt: &mut Psbt) -> Result<()> {
        self.psbt_builder.finalize_psbt(psbt)
    }

    /// Extract the transaction from a PSBT
    pub fn extract_transaction(&self, psbt: &Psbt) -> Result<Transaction> {
        self.psbt_builder.extract_transaction(psbt)
    }

    /// Broadcast a transaction
    pub fn broadcast_transaction(&self, tx: &Transaction) -> Result<Txid> {
        self.psbt_builder.broadcast_transaction(tx)
    }

    /// Complete a trade
    pub fn complete_trade(&self, trade_id: &TradeId, txid: String) -> Result<()> {
        self.trade_manager.update_trade(trade_id, |trade| {
            trade.set_txid(txid);
            trade.complete();
        })
    }

    /// Fail a trade
    pub fn fail_trade(&self, trade_id: &TradeId) -> Result<()> {
        self.trade_manager.update_trade(trade_id, |trade| {
            trade.fail();
        })
    }
}
```

## Performance Comparison

### Memory Usage

**PintSwap:**
- Higher memory usage due to JavaScript's garbage collection
- Less efficient data structures
- More memory overhead for the same functionality

**DarkSwap:**
- Lower memory usage due to Rust's ownership model
- More efficient data structures
- Less memory overhead for the same functionality

### CPU Usage

**PintSwap:**
- Higher CPU usage due to JavaScript's interpreted nature
- Less efficient algorithms
- More CPU overhead for the same functionality

**DarkSwap:**
- Lower CPU usage due to Rust's compiled nature
- More efficient algorithms
- Less CPU overhead for the same functionality

### Network Usage

**PintSwap:**
- Similar network usage for P2P communication
- Higher network usage for Ethereum transactions
- More network overhead for the same functionality

**DarkSwap:**
- Similar network usage for P2P communication
- Lower network usage for Bitcoin transactions
- Less network overhead for the same functionality

## Security Comparison

### Authentication and Authorization

**PintSwap:**
- Uses Ethereum signatures for authentication
- Limited authorization checks
- Vulnerable to certain types of replay attacks

**DarkSwap:**
- Uses Bitcoin signatures for authentication
- Comprehensive authorization checks
- More resistant to replay attacks

### Data Integrity

**PintSwap:**
- Relies on Ethereum's data integrity mechanisms
- Limited validation of trade parameters
- Vulnerable to certain types of data manipulation attacks

**DarkSwap:**
- Relies on Bitcoin's data integrity mechanisms
- Comprehensive validation of trade parameters
- More resistant to data manipulation attacks

### Privacy

**PintSwap:**
- Limited privacy features
- Transactions visible on Ethereum blockchain
- Limited support for privacy-enhancing technologies

**DarkSwap:**
- Enhanced privacy features
- Transactions visible on Bitcoin blockchain, but with better privacy options
- Support for privacy-enhancing technologies like CoinJoin

## Conclusion

DarkSwap represents a significant improvement over PintSwap in terms of performance, security, and functionality. By leveraging Rust's performance and safety features, and focusing on Bitcoin-based assets, DarkSwap provides a more robust and efficient platform for decentralized peer-to-peer trading.

The key advantages of DarkSwap include:

1. **Better Performance**: Lower memory and CPU usage due to Rust's compiled nature and more efficient algorithms.
2. **Enhanced Security**: Comprehensive validation of trade parameters and more resistant to various types of attacks.
3. **Bitcoin Focus**: Native support for Bitcoin, runes, and alkanes, making it more suitable for Bitcoin-based assets.
4. **Advanced P2P Networking**: More robust peer discovery and NAT traversal through the advanced circuit relay implementation.
5. **PSBT-Based Trading**: More efficient and cost-effective trade execution using PSBTs instead of Ethereum smart contracts.

These advantages make DarkSwap a compelling alternative to PintSwap for users who want to trade Bitcoin-based assets in a decentralized, peer-to-peer manner.