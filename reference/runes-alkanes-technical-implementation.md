# Runes and Alkanes Technical Implementation Plan

This document provides a detailed technical implementation plan for adding support for runes and alkanes to the DarkSwap SDK.

## Overview

Runes and alkanes are Bitcoin-based assets that need to be supported in DarkSwap for trading. This implementation plan outlines the specific technical details for implementing these assets in the DarkSwap SDK.

## 1. Runes Implementation

### 1.1 Rune Protocol Implementation

#### 1.1.1 Runestone Structure

Implement the Runestone structure according to the runes protocol:

```rust
pub struct Runestone {
    pub edicts: Vec<Edict>,
    pub etching: Option<Etching>,
    pub default_output: Option<u32>,
    pub burn: bool,
}

pub struct Edict {
    pub id: u128,
    pub amount: u128,
    pub output: u32,
}

pub struct Etching {
    pub rune: u128,
    pub symbol: Option<String>,
    pub decimals: Option<u8>,
    pub spacers: u32,
    pub amount: u128,
    pub terms: Option<Terms>,
}

pub struct Terms {
    pub cap: Option<u128>,
    pub height: Option<u32>,
    pub amount: Option<u128>,
}
```

#### 1.1.2 Runestone Parsing

Implement functions to parse Runestones from Bitcoin transactions:

```rust
pub fn parse_runestone(tx: &Transaction) -> Option<Runestone> {
    // Parse the transaction to extract the Runestone
    // Look for OP_RETURN outputs with the rune protocol prefix
    // Parse the data according to the rune protocol specification
}
```

#### 1.1.3 Runestone Creation

Implement functions to create Runestones for rune operations:

```rust
pub fn create_runestone(
    edicts: Vec<Edict>,
    etching: Option<Etching>,
    default_output: Option<u32>,
    burn: bool,
) -> Runestone {
    // Create a Runestone with the specified parameters
}

pub fn runestone_to_script(runestone: &Runestone) -> Script {
    // Convert the Runestone to a Bitcoin script
    // This will be used in the OP_RETURN output of the transaction
}
```

### 1.2 Rune Data Structures

#### 1.2.1 Rune Type

Define the Rune type:

```rust
pub struct Rune {
    pub id: u128,
    pub symbol: Option<String>,
    pub decimals: u8,
    pub supply: u128,
    pub timestamp: u32,
    pub etching_outpoint: OutPoint,
    pub etching_height: u32,
}
```

#### 1.2.2 Rune Balance

Define the RuneBalance type:

```rust
pub struct RuneBalance {
    pub rune: Rune,
    pub amount: u128,
}
```

#### 1.2.3 Rune Transfer

Define the RuneTransfer type:

```rust
pub struct RuneTransfer {
    pub rune: Rune,
    pub amount: u128,
    pub from: Address,
    pub to: Address,
}
```

### 1.3 Rune Transaction Creation

#### 1.3.1 Rune Transfer Transaction

Implement functions to create transactions for transferring runes:

```rust
pub fn create_rune_transfer_transaction(
    wallet: &Wallet,
    rune: &Rune,
    amount: u128,
    to: &Address,
    fee_rate: f32,
) -> Result<Transaction, Error> {
    // Create a transaction that transfers runes from the wallet to the specified address
    // This involves creating a Runestone with the appropriate edicts
    // and adding it as an OP_RETURN output to the transaction
}
```

#### 1.3.2 Rune Etching Transaction

Implement functions to create transactions for etching (creating) new runes:

```rust
pub fn create_rune_etching_transaction(
    wallet: &Wallet,
    symbol: Option<String>,
    decimals: u8,
    supply: u128,
    fee_rate: f32,
) -> Result<Transaction, Error> {
    // Create a transaction that etches a new rune
    // This involves creating a Runestone with an etching
    // and adding it as an OP_RETURN output to the transaction
}
```

### 1.4 Rune Transaction Validation

#### 1.4.1 Rune Transfer Validation

Implement functions to validate rune transfer transactions:

```rust
pub fn validate_rune_transfer(
    tx: &Transaction,
    rune: &Rune,
    amount: u128,
    from: &Address,
    to: &Address,
) -> Result<(), Error> {
    // Validate that the transaction correctly transfers the specified amount of runes
    // from the specified address to the specified address
}
```

#### 1.4.2 Rune Etching Validation

Implement functions to validate rune etching transactions:

```rust
pub fn validate_rune_etching(
    tx: &Transaction,
    symbol: Option<String>,
    decimals: u8,
    supply: u128,
) -> Result<(), Error> {
    // Validate that the transaction correctly etches a new rune
    // with the specified symbol, decimals, and supply
}
```

### 1.5 Rune Trading

#### 1.5.1 Rune Order Creation

Implement functions to create orders for trading runes:

```rust
pub fn create_rune_order(
    wallet: &Wallet,
    rune: &Rune,
    amount: u128,
    price: f64,
    side: OrderSide,
    expiry: u64,
) -> Result<Order, Error> {
    // Create an order for trading runes
    // This involves creating an Order object with the appropriate parameters
    // and adding it to the orderbook
}
```

#### 1.5.2 Rune Trade Execution

Implement functions to execute trades involving runes:

```rust
pub fn execute_rune_trade(
    maker_order: &Order,
    taker_order: &Order,
    maker_wallet: &Wallet,
    taker_wallet: &Wallet,
) -> Result<Transaction, Error> {
    // Execute a trade between the maker and taker orders
    // This involves creating a transaction that transfers runes and Bitcoin
    // between the maker and taker
}
```

## 2. Alkanes Implementation

### 2.1 Alkane Protocol Implementation

#### 2.1.1 Alkane Structure

Implement the Alkane structure according to the alkanes protocol:

```rust
pub struct Alkane {
    pub id: u128,
    pub symbol: String,
    pub decimals: u8,
    pub supply: u128,
    pub timestamp: u32,
    pub etching_outpoint: OutPoint,
    pub etching_height: u32,
    pub properties: AlkaneProperties,
}

pub struct AlkaneProperties {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<Vec<u8>>,
    pub metadata: HashMap<String, String>,
}
```

#### 2.1.2 Alkane Protocol Parsing

Implement functions to parse alkane protocol data from runes:

```rust
pub fn parse_alkane_from_rune(rune: &Rune) -> Option<Alkane> {
    // Parse the alkane protocol data from the rune
    // This involves checking if the rune follows the alkane protocol
    // and extracting the alkane-specific data
}
```

#### 2.1.3 Alkane Protocol Creation

Implement functions to create alkanes according to the alkane protocol:

```rust
pub fn create_alkane(
    symbol: String,
    decimals: u8,
    supply: u128,
    name: String,
    description: Option<String>,
    icon: Option<Vec<u8>>,
    metadata: HashMap<String, String>,
) -> Alkane {
    // Create an alkane with the specified parameters
}
```

### 2.2 Alkane Data Structures

#### 2.2.1 Alkane Balance

Define the AlkaneBalance type:

```rust
pub struct AlkaneBalance {
    pub alkane: Alkane,
    pub amount: u128,
}
```

#### 2.2.2 Alkane Transfer

Define the AlkaneTransfer type:

```rust
pub struct AlkaneTransfer {
    pub alkane: Alkane,
    pub amount: u128,
    pub from: Address,
    pub to: Address,
}
```

### 2.3 Alkane Transaction Creation

#### 2.3.1 Alkane Transfer Transaction

Implement functions to create transactions for transferring alkanes:

```rust
pub fn create_alkane_transfer_transaction(
    wallet: &Wallet,
    alkane: &Alkane,
    amount: u128,
    to: &Address,
    fee_rate: f32,
) -> Result<Transaction, Error> {
    // Create a transaction that transfers alkanes from the wallet to the specified address
    // This involves creating a rune transfer transaction with the appropriate alkane protocol data
}
```

#### 2.3.2 Alkane Etching Transaction

Implement functions to create transactions for etching (creating) new alkanes:

```rust
pub fn create_alkane_etching_transaction(
    wallet: &Wallet,
    symbol: String,
    decimals: u8,
    supply: u128,
    name: String,
    description: Option<String>,
    icon: Option<Vec<u8>>,
    metadata: HashMap<String, String>,
    fee_rate: f32,
) -> Result<Transaction, Error> {
    // Create a transaction that etches a new alkane
    // This involves creating a rune etching transaction with the appropriate alkane protocol data
}
```

### 2.4 Alkane Transaction Validation

#### 2.4.1 Alkane Transfer Validation

Implement functions to validate alkane transfer transactions:

```rust
pub fn validate_alkane_transfer(
    tx: &Transaction,
    alkane: &Alkane,
    amount: u128,
    from: &Address,
    to: &Address,
) -> Result<(), Error> {
    // Validate that the transaction correctly transfers the specified amount of alkanes
    // from the specified address to the specified address
}
```

#### 2.4.2 Alkane Etching Validation

Implement functions to validate alkane etching transactions:

```rust
pub fn validate_alkane_etching(
    tx: &Transaction,
    symbol: String,
    decimals: u8,
    supply: u128,
    name: String,
    description: Option<String>,
    icon: Option<Vec<u8>>,
    metadata: HashMap<String, String>,
) -> Result<(), Error> {
    // Validate that the transaction correctly etches a new alkane
    // with the specified parameters
}
```

### 2.5 Alkane Trading

#### 2.5.1 Alkane Order Creation

Implement functions to create orders for trading alkanes:

```rust
pub fn create_alkane_order(
    wallet: &Wallet,
    alkane: &Alkane,
    amount: u128,
    price: f64,
    side: OrderSide,
    expiry: u64,
) -> Result<Order, Error> {
    // Create an order for trading alkanes
    // This involves creating an Order object with the appropriate parameters
    // and adding it to the orderbook
}
```

#### 2.5.2 Alkane Trade Execution

Implement functions to execute trades involving alkanes:

```rust
pub fn execute_alkane_trade(
    maker_order: &Order,
    taker_order: &Order,
    maker_wallet: &Wallet,
    taker_wallet: &Wallet,
) -> Result<Transaction, Error> {
    // Execute a trade between the maker and taker orders
    // This involves creating a transaction that transfers alkanes and Bitcoin
    // between the maker and taker
}
```

## 3. Integration with Existing Modules

### 3.1 Integration with Orderbook Module

Update the orderbook module to support runes and alkanes:

```rust
// Add support for rune and alkane trading pairs
pub enum TradingPair {
    BtcRune(Rune),
    BtcAlkane(Alkane),
    RuneRune(Rune, Rune),
    RuneAlkane(Rune, Alkane),
    AlkaneAlkane(Alkane, Alkane),
}

// Update the Order struct to support runes and alkanes
pub struct Order {
    pub id: String,
    pub maker: PeerId,
    pub pair: TradingPair,
    pub price: f64,
    pub amount: u128,
    pub side: OrderSide,
    pub timestamp: u64,
    pub expiry: u64,
    pub status: OrderStatus,
}
```

### 3.2 Integration with Trade Module

Update the trade module to support runes and alkanes:

```rust
// Update the Trade struct to support runes and alkanes
pub struct Trade {
    pub id: String,
    pub maker_order: Order,
    pub taker_order: Order,
    pub amount: u128,
    pub price: f64,
    pub timestamp: u64,
    pub status: TradeStatus,
}

// Add functions for executing trades involving runes and alkanes
pub fn execute_trade(
    trade: &Trade,
    maker_wallet: &Wallet,
    taker_wallet: &Wallet,
) -> Result<Transaction, Error> {
    match trade.maker_order.pair {
        TradingPair::BtcRune(ref rune) => {
            // Execute a BTC-Rune trade
        }
        TradingPair::BtcAlkane(ref alkane) => {
            // Execute a BTC-Alkane trade
        }
        TradingPair::RuneRune(ref rune1, ref rune2) => {
            // Execute a Rune-Rune trade
        }
        TradingPair::RuneAlkane(ref rune, ref alkane) => {
            // Execute a Rune-Alkane trade
        }
        TradingPair::AlkaneAlkane(ref alkane1, ref alkane2) => {
            // Execute a Alkane-Alkane trade
        }
    }
}
```

### 3.3 Integration with Network Module

Update the network module to support runes and alkanes:

```rust
// Add message types for rune and alkane orders
pub enum OrderMessage {
    BtcOrder(Order),
    RuneOrder(Order),
    AlkaneOrder(Order),
}

// Update the message handling to support runes and alkanes
pub fn handle_order_message(message: OrderMessage) {
    match message {
        OrderMessage::BtcOrder(order) => {
            // Handle BTC order
        }
        OrderMessage::RuneOrder(order) => {
            // Handle rune order
        }
        OrderMessage::AlkaneOrder(order) => {
            // Handle alkane order
        }
    }
}
```

### 3.4 Integration with WASM Bindings

Update the WASM bindings to support runes and alkanes:

```rust
// Add WASM bindings for rune and alkane functions
#[wasm_bindgen]
pub fn create_rune_order(
    wallet_js: JsValue,
    rune_js: JsValue,
    amount: f64,
    price: f64,
    side: u8,
    expiry: f64,
) -> Result<JsValue, JsValue> {
    // Convert JS values to Rust types
    // Call the create_rune_order function
    // Convert the result back to JS value
}

#[wasm_bindgen]
pub fn create_alkane_order(
    wallet_js: JsValue,
    alkane_js: JsValue,
    amount: f64,
    price: f64,
    side: u8,
    expiry: f64,
) -> Result<JsValue, JsValue> {
    // Convert JS values to Rust types
    // Call the create_alkane_order function
    // Convert the result back to JS value
}
```

## 4. Testing

### 4.1 Unit Tests

Create unit tests for the runes and alkanes implementation:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_runestone() {
        // Test parsing a Runestone from a transaction
    }

    #[test]
    fn test_create_runestone() {
        // Test creating a Runestone
    }

    #[test]
    fn test_rune_transfer_transaction() {
        // Test creating a rune transfer transaction
    }

    #[test]
    fn test_rune_etching_transaction() {
        // Test creating a rune etching transaction
    }

    #[test]
    fn test_alkane_from_rune() {
        // Test parsing an alkane from a rune
    }

    #[test]
    fn test_alkane_transfer_transaction() {
        // Test creating an alkane transfer transaction
    }

    #[test]
    fn test_alkane_etching_transaction() {
        // Test creating an alkane etching transaction
    }
}
```

### 4.2 Integration Tests

Create integration tests for the runes and alkanes implementation:

```rust
#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_rune_order_creation_and_matching() {
        // Test creating a rune order and matching it with another order
    }

    #[test]
    fn test_alkane_order_creation_and_matching() {
        // Test creating an alkane order and matching it with another order
    }

    #[test]
    fn test_rune_trade_execution() {
        // Test executing a trade involving runes
    }

    #[test]
    fn test_alkane_trade_execution() {
        // Test executing a trade involving alkanes
    }
}
```

## 5. Documentation

### 5.1 API Documentation

Document the runes and alkanes API:

```rust
/// Creates a new rune order
///
/// # Arguments
///
/// * `wallet` - The wallet to use for creating the order
/// * `rune` - The rune to trade
/// * `amount` - The amount of the rune to trade
/// * `price` - The price of the order
/// * `side` - The side of the order (buy or sell)
/// * `expiry` - The expiry time of the order
///
/// # Returns
///
/// The created order
pub fn create_rune_order(
    wallet: &Wallet,
    rune: &Rune,
    amount: u128,
    price: f64,
    side: OrderSide,
    expiry: u64,
) -> Result<Order, Error> {
    // ...
}
```

### 5.2 Usage Examples

Create usage examples for the runes and alkanes API:

```rust
// Example of creating a rune order
let wallet = Wallet::new();
let rune = Rune::new(/* ... */);
let order = create_rune_order(
    &wallet,
    &rune,
    1000000,
    0.0001,
    OrderSide::Sell,
    1234567890,
).unwrap();

// Example of creating an alkane order
let wallet = Wallet::new();
let alkane = Alkane::new(/* ... */);
let order = create_alkane_order(
    &wallet,
    &alkane,
    1000000,
    0.0001,
    OrderSide::Sell,
    1234567890,
).unwrap();
```

## 6. Implementation Timeline

1. **Week 1**: Implement rune protocol and data structures
2. **Week 2**: Implement rune transaction creation and validation
3. **Week 3**: Implement alkane protocol and data structures
4. **Week 4**: Implement alkane transaction creation and validation
5. **Week 5**: Integrate with existing modules
6. **Week 6**: Create tests and documentation

## 7. Dependencies

- Bitcoin crate for Bitcoin transaction handling
- rust-libp2p for P2P networking
- serde for serialization and deserialization
- wasm-bindgen for WASM bindings

## 8. Conclusion

This technical implementation plan outlines the specific tasks needed to add support for runes and alkanes to the DarkSwap SDK. By following this plan, the implementation can be completed in a structured and efficient manner, with clear milestones and deliverables.