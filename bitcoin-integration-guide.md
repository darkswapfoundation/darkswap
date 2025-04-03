# Bitcoin Integration Guide for DarkSwap

This document provides guidance for integrating Bitcoin, runes, and alkanes support into the DarkSwap platform, enabling secure peer-to-peer trading of these assets.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      DarkSwap SDK                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     Trade Protocol                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      PSBT Handler                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌─────────────┬─────────────▼─────────────┬───────────────────┐
│  Bitcoin    │       Rune               │     Alkane        │
│  Handler    │       Handler            │     Handler       │
└─────────────┴─────────────┬─────────────┴───────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     Wallet Interface                        │
└─────────────────────────────────────────────────────────────┘
```

## Integration Components

### 1. Wallet Interface

Create a wallet interface that can be implemented by different wallet providers:

```rust
// In darkswap-sdk/src/wallet/mod.rs
pub trait Wallet {
    /// Get the network
    fn network(&self) -> Network;
    
    /// Get the addresses
    fn addresses(&self) -> Result<Vec<Address>>;
    
    /// Get the balance
    fn balance(&self) -> Result<u64>;
    
    /// Get the unspent transaction outputs
    fn utxos(&self) -> Result<Vec<Utxo>>;
    
    /// Create a transaction
    fn create_transaction(&self, outputs: Vec<TxOut>, fee_rate: f64) -> Result<Transaction>;
    
    /// Sign a transaction
    fn sign_transaction(&self, tx: Transaction) -> Result<Transaction>;
    
    /// Broadcast a transaction
    fn broadcast_transaction(&self, tx: Transaction) -> Result<Txid>;
    
    /// Get the rune balance
    fn rune_balance(&self) -> Result<HashMap<String, u64>>;
    
    /// Get the alkane balance
    fn alkane_balance(&self) -> Result<HashMap<String, u64>>;
}
```

### 2. PSBT Handler

Implement a PSBT handler for creating and signing PSBTs:

```rust
// In darkswap-sdk/src/trade/psbt.rs
pub struct PsbtHandler {
    /// Wallet
    wallet: Box<dyn Wallet>,
}

impl PsbtHandler {
    /// Create a new PSBT handler
    pub fn new(wallet: Box<dyn Wallet>) -> Self {
        Self { wallet }
    }
    
    /// Create a PSBT for a trade
    pub async fn create_trade_psbt(
        &self,
        outputs: Vec<TxOut>,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Implementation details...
    }
    
    /// Sign a PSBT
    pub async fn sign_psbt(&self, psbt: Psbt) -> Result<Psbt> {
        // Implementation details...
    }
    
    /// Finalize a PSBT
    pub async fn finalize_psbt(&self, psbt: Psbt) -> Result<Transaction> {
        // Implementation details...
    }
    
    /// Broadcast a transaction
    pub async fn broadcast_transaction(&self, tx: Transaction) -> Result<Txid> {
        // Implementation details...
    }
}
```

### 3. Rune Handler

Implement a rune handler for creating and verifying rune transactions:

```rust
// In darkswap-sdk/src/trade/rune.rs
pub struct RuneHandler {
    /// Wallet
    wallet: Box<dyn Wallet>,
}

impl RuneHandler {
    /// Create a new rune handler
    pub fn new(wallet: Box<dyn Wallet>) -> Self {
        Self { wallet }
    }
    
    /// Get the rune balance
    pub async fn balance(&self) -> Result<HashMap<String, u64>> {
        self.wallet.rune_balance()
    }
    
    /// Create a PSBT for a rune transfer
    pub async fn create_transfer_psbt(
        &self,
        rune_id: &str,
        amount: u64,
        recipient: Address,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Implementation details...
    }
    
    /// Verify a rune transfer
    pub async fn verify_transfer(&self, psbt: &Psbt, rune_id: &str, amount: u64) -> Result<()> {
        // Implementation details...
    }
}
```

### 4. Alkane Handler

Implement an alkane handler for creating and verifying alkane transactions:

```rust
// In darkswap-sdk/src/trade/alkane.rs
pub struct AlkaneHandler {
    /// Wallet
    wallet: Box<dyn Wallet>,
}

impl AlkaneHandler {
    /// Create a new alkane handler
    pub fn new(wallet: Box<dyn Wallet>) -> Self {
        Self { wallet }
    }
    
    /// Get the alkane balance
    pub async fn balance(&self) -> Result<HashMap<String, u64>> {
        self.wallet.alkane_balance()
    }
    
    /// Create a PSBT for an alkane transfer
    pub async fn create_transfer_psbt(
        &self,
        alkane_id: &str,
        amount: u64,
        recipient: Address,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Implementation details...
    }
    
    /// Verify an alkane transfer
    pub async fn verify_transfer(&self, psbt: &Psbt, alkane_id: &str, amount: u64) -> Result<()> {
        // Implementation details...
    }
}
```

### 5. Trade Protocol

Implement the trade protocol for secure trading of Bitcoin, runes, and alkanes:

```rust
// In darkswap-sdk/src/trade/protocol.rs
/// Asset type
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AssetType {
    /// Bitcoin
    Bitcoin,
    /// Rune
    Rune(String),
    /// Alkane
    Alkane(String),
}

/// Trade offer
#[derive(Debug, Clone)]
pub struct TradeOffer {
    /// Offer ID
    pub id: String,
    /// Maker peer ID
    pub maker_peer_id: String,
    /// Maker asset type
    pub maker_asset_type: AssetType,
    /// Maker asset amount
    pub maker_amount: u64,
    /// Taker asset type
    pub taker_asset_type: AssetType,
    /// Taker asset amount
    pub taker_amount: u64,
    /// Expiration time
    pub expiration: u64,
}

/// Trade protocol
pub struct TradeProtocol {
    /// PSBT handler
    psbt_handler: Arc<PsbtHandler>,
    /// Rune handler
    rune_handler: Arc<RuneHandler>,
    /// Alkane handler
    alkane_handler: Arc<AlkaneHandler>,
    /// Active trades
    active_trades: Arc<Mutex<HashMap<String, TradeState>>>,
}

impl TradeProtocol {
    /// Create a new trade protocol
    pub fn new(wallet: Box<dyn Wallet>) -> Self {
        // Implementation details...
    }
    
    /// Create a trade offer
    pub async fn create_offer(
        &self,
        maker_asset_type: AssetType,
        maker_amount: u64,
        taker_asset_type: AssetType,
        taker_amount: u64,
        expiration: u64,
    ) -> Result<TradeOffer> {
        // Implementation details...
    }
    
    /// Accept a trade offer
    pub async fn accept_offer(&self, offer_id: &str, taker_peer_id: &str) -> Result<()> {
        // Implementation details...
    }
    
    /// Create maker PSBT
    pub async fn create_maker_psbt(&self, offer_id: &str) -> Result<Psbt> {
        // Implementation details...
    }
    
    /// Create taker PSBT
    pub async fn create_taker_psbt(&self, offer_id: &str) -> Result<Psbt> {
        // Implementation details...
    }
    
    /// Sign PSBTs
    pub async fn sign_psbts(&self, offer_id: &str) -> Result<(Psbt, Psbt)> {
        // Implementation details...
    }
    
    /// Finalize and broadcast PSBTs
    pub async fn finalize_and_broadcast(&self, offer_id: &str) -> Result<(Txid, Txid)> {
        // Implementation details...
    }
}
```

## Integration Steps

### 1. Implement the Wallet Interface

Create implementations of the Wallet interface for different wallet providers:

```rust
// In darkswap-sdk/src/wallet/bdk_wallet.rs
pub struct BdkWallet {
    // Implementation details...
}

impl Wallet for BdkWallet {
    // Implementation of the Wallet trait...
}
```

### 2. Implement the PSBT Handler

Create the PSBT handler for creating and signing PSBTs:

```rust
// In darkswap-sdk/src/trade/psbt.rs
// Implementation details...
```

### 3. Implement the Rune and Alkane Handlers

Create the rune and alkane handlers for creating and verifying rune and alkane transactions:

```rust
// In darkswap-sdk/src/trade/rune.rs and darkswap-sdk/src/trade/alkane.rs
// Implementation details...
```

### 4. Implement the Trade Protocol

Create the trade protocol for secure trading of Bitcoin, runes, and alkanes:

```rust
// In darkswap-sdk/src/trade/protocol.rs
// Implementation details...
```

### 5. Update the WebAssembly Bindings

Update the WebAssembly bindings to expose the Bitcoin integration functionality:

```rust
// In darkswap-web-sys/src/lib.rs
// Implementation details...
```

### 6. Update the TypeScript Library

Update the TypeScript library to provide a more idiomatic JavaScript API:

```typescript
// In darkswap-lib/src/index.ts
// Implementation details...
```

## Testing the Integration

### 1. Unit Tests

Create unit tests for the wallet interface, PSBT handler, rune handler, alkane handler, and trade protocol:

```rust
// In darkswap-sdk/src/wallet/tests.rs
// Implementation details...
```

### 2. Integration Tests

Create integration tests for the trade protocol:

```rust
// In darkswap-sdk/tests/trade_tests.rs
// Implementation details...
```

## Common Issues and Solutions

### 1. PSBT Compatibility

**Issue**: PSBTs created by different wallet implementations may not be compatible.

**Solution**:
- Ensure that PSBTs follow the BIP-174 standard
- Test with different wallet implementations
- Add proper error handling for incompatible PSBTs

### 2. Rune and Alkane Support

**Issue**: Rune and alkane support is still evolving.

**Solution**:
- Stay up-to-date with the latest rune and alkane specifications
- Implement proper versioning for rune and alkane support
- Add fallback mechanisms for unsupported features

### 3. Transaction Fees

**Issue**: Transaction fees can be unpredictable.

**Solution**:
- Implement fee estimation based on network conditions
- Allow users to specify custom fees
- Add fee validation to prevent overpaying

## Next Steps

1. **Complete Rune Support**
   - Implement rune validation in trade protocol
   - Add rune transfer logic
   - Create rune-specific trade messages
   - Test with actual rune transactions

2. **Add Alkane Support**
   - Implement alkane validation in trade protocol
   - Add alkane transfer logic
   - Create alkane-specific trade messages
   - Test with actual alkane transactions

3. **Enhance PSBT Support**
   - Implement PSBT creation for runes
   - Implement PSBT creation for alkanes
   - Add PSBT validation
   - Create PSBT signing workflow

4. **Improve Wallet Integration**
   - Implement wallet connection for Bitcoin
   - Add support for rune-compatible wallets
   - Add support for alkane-compatible wallets
   - Create balance management for all asset types
