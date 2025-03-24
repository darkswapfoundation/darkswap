# Runes and Alkanes Implementation Plan for DarkSwap

This document outlines the plan for implementing support for runes and alkanes in the DarkSwap SDK. It covers the key components, challenges, and solutions for enabling trading of these Bitcoin-based assets.

## Overview

Runes and alkanes are Bitcoin-based assets that enable token functionality on the Bitcoin blockchain. Runes use the Ordinals protocol to inscribe tokens directly on satoshis, while alkanes are a metaprotocol built on top of Bitcoin that enables more complex token functionality.

Adding support for these assets to DarkSwap will allow users to trade them in a decentralized, peer-to-peer manner, without requiring a central server or authority.

## Key Components

### 1. Asset Representation

We need to extend the `Asset` enum in `types.rs` to support runes and alkanes:

```rust
/// Asset type
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Asset {
    /// Bitcoin
    Bitcoin,
    /// Rune
    Rune(RuneId),
    /// Alkane
    Alkane(AlkaneId),
}
```

### 2. Runes Protocol Implementation

We need to implement the runes protocol to support:

- Rune creation and issuance
- Rune transfers
- Rune balance checking
- Rune transaction validation

### 3. Alkanes Protocol Implementation

We need to implement the alkanes protocol to support:

- Alkane creation and issuance
- Alkane transfers
- Alkane balance checking
- Alkane transaction validation

### 4. PSBT Extensions

We need to extend the PSBT handling to support runes and alkanes:

- Add support for rune and alkane inputs and outputs
- Implement rune and alkane transaction signing
- Validate rune and alkane transactions

### 5. Orderbook Extensions

We need to extend the orderbook to support runes and alkanes:

- Add support for rune and alkane trading pairs
- Implement order matching for rune and alkane orders
- Handle rune and alkane order expiry

## Implementation Approach

### Phase 1: Runes Support

#### 1.1 Runes Protocol Implementation

First, we'll implement the core runes protocol functionality:

```rust
/// Runes module
pub mod runes {
    use crate::error::{Error, Result};
    use crate::types::{RuneId};
    use bitcoin::{Address, OutPoint, Transaction, TxOut};
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;

    /// Rune data
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct Rune {
        /// Rune ID
        pub id: RuneId,
        /// Rune symbol
        pub symbol: String,
        /// Rune name
        pub name: String,
        /// Rune decimals
        pub decimals: u8,
        /// Rune supply
        pub supply: u64,
        /// Rune limit
        pub limit: Option<u64>,
    }

    /// Rune transfer
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct RuneTransfer {
        /// Rune ID
        pub rune_id: RuneId,
        /// From address
        pub from: Address,
        /// To address
        pub to: Address,
        /// Amount
        pub amount: u64,
    }

    /// Rune protocol
    pub struct RuneProtocol {
        /// Runes by ID
        runes: HashMap<RuneId, Rune>,
        /// Rune balances by address and rune ID
        balances: HashMap<(Address, RuneId), u64>,
    }

    impl RuneProtocol {
        /// Create a new rune protocol
        pub fn new() -> Self {
            Self {
                runes: HashMap::new(),
                balances: HashMap::new(),
            }
        }

        /// Get a rune by ID
        pub fn get_rune(&self, rune_id: &RuneId) -> Option<&Rune> {
            self.runes.get(rune_id)
        }

        /// Get rune balance for an address
        pub fn get_balance(&self, address: &Address, rune_id: &RuneId) -> u64 {
            self.balances.get(&(address.clone(), rune_id.clone())).cloned().unwrap_or(0)
        }

        /// Create a rune transfer
        pub fn create_transfer(
            &self,
            rune_id: &RuneId,
            from: &Address,
            to: &Address,
            amount: u64,
        ) -> Result<RuneTransfer> {
            // Check if rune exists
            if !self.runes.contains_key(rune_id) {
                return Err(Error::InvalidAsset(format!("Rune not found: {}", rune_id)));
            }

            // Check if sender has enough balance
            let balance = self.get_balance(from, rune_id);
            if balance < amount {
                return Err(Error::InsufficientFunds);
            }

            Ok(RuneTransfer {
                rune_id: rune_id.clone(),
                from: from.clone(),
                to: to.clone(),
                amount,
            })
        }

        /// Apply a rune transfer
        pub fn apply_transfer(&mut self, transfer: &RuneTransfer) -> Result<()> {
            // Check if rune exists
            if !self.runes.contains_key(&transfer.rune_id) {
                return Err(Error::InvalidAsset(format!("Rune not found: {}", transfer.rune_id)));
            }

            // Check if sender has enough balance
            let sender_balance = self.get_balance(&transfer.from, &transfer.rune_id);
            if sender_balance < transfer.amount {
                return Err(Error::InsufficientFunds);
            }

            // Update balances
            let sender_key = (transfer.from.clone(), transfer.rune_id.clone());
            let receiver_key = (transfer.to.clone(), transfer.rune_id.clone());

            // Decrease sender balance
            self.balances.insert(sender_key, sender_balance - transfer.amount);

            // Increase receiver balance
            let receiver_balance = self.get_balance(&transfer.to, &transfer.rune_id);
            self.balances.insert(receiver_key, receiver_balance + transfer.amount);

            Ok(())
        }

        /// Create a rune transaction
        pub fn create_transaction(
            &self,
            transfer: &RuneTransfer,
            inputs: Vec<(OutPoint, TxOut)>,
            change_address: &Address,
            fee_rate: f64,
        ) -> Result<Transaction> {
            // Implementation will depend on the specific runes protocol
            // This is a placeholder
            unimplemented!()
        }

        /// Validate a rune transaction
        pub fn validate_transaction(&self, transaction: &Transaction) -> Result<()> {
            // Implementation will depend on the specific runes protocol
            // This is a placeholder
            unimplemented!()
        }
    }
}
```

#### 1.2 PSBT Extensions for Runes

Next, we'll extend the PSBT handling to support runes:

```rust
/// Create a rune transfer PSBT
pub fn create_rune_transfer_psbt(
    wallet: &impl BitcoinWallet,
    rune_id: &RuneId,
    from_address: &Address,
    to_address: &Address,
    amount: u64,
    fee_rate: f64,
) -> Result<Psbt> {
    // Get UTXOs
    let utxos = wallet.utxos();
    if utxos.is_empty() {
        return Err(Error::BitcoinError("No UTXOs available".to_string()));
    }

    // Create inputs
    let mut inputs = Vec::new();
    let mut input_value = 0;
    for utxo in &utxos {
        inputs.push(TxIn {
            previous_output: utxo.outpoint,
            script_sig: ScriptBuf::new(),
            sequence: bitcoin::Sequence::MAX,
            witness: Witness::new(),
        });
        input_value += utxo.txout.value;
    }

    // Create outputs
    let mut outputs = Vec::new();

    // Add rune transfer output
    // This will depend on the specific runes protocol
    // For now, we'll use a simple OP_RETURN output
    let rune_data = format!("RUNE:{}:{}", rune_id, amount);
    let script = ScriptBuf::new_op_return(&rune_data.as_bytes());
    outputs.push(TxOut {
        value: 0,
        script_pubkey: script,
    });

    // Add recipient output
    outputs.push(TxOut {
        value: amount,
        script_pubkey: to_address.script_pubkey(),
    });

    // Add change output
    let fee = PsbtUtils::estimate_transaction_fee(inputs.len(), outputs.len() + 1, fee_rate);
    let change_value = input_value - amount - fee.to_sat();
    if change_value > 0 {
        outputs.push(TxOut {
            value: change_value,
            script_pubkey: from_address.script_pubkey(),
        });
    }

    // Create PSBT
    let mut psbt = PsbtUtils::create_psbt(inputs, outputs)?;

    // Add input information
    for (i, utxo) in utxos.iter().enumerate() {
        psbt.inputs[i].witness_utxo = Some(utxo.txout.clone());
    }

    Ok(psbt)
}
```

#### 1.3 Orderbook Extensions for Runes

Finally, we'll extend the orderbook to support runes:

```rust
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
```

### Phase 2: Alkanes Support

#### 2.1 Alkanes Protocol Implementation

First, we'll implement the core alkanes protocol functionality:

```rust
/// Alkanes module
pub mod alkanes {
    use crate::error::{Error, Result};
    use crate::types::{AlkaneId};
    use bitcoin::{Address, OutPoint, Transaction, TxOut};
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;

    /// Alkane data
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct Alkane {
        /// Alkane ID
        pub id: AlkaneId,
        /// Alkane symbol
        pub symbol: String,
        /// Alkane name
        pub name: String,
        /// Alkane decimals
        pub decimals: u8,
        /// Alkane supply
        pub supply: u64,
        /// Alkane limit
        pub limit: Option<u64>,
    }

    /// Alkane transfer
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct AlkaneTransfer {
        /// Alkane ID
        pub alkane_id: AlkaneId,
        /// From address
        pub from: Address,
        /// To address
        pub to: Address,
        /// Amount
        pub amount: u64,
    }

    /// Alkane protocol
    pub struct AlkaneProtocol {
        /// Alkanes by ID
        alkanes: HashMap<AlkaneId, Alkane>,
        /// Alkane balances by address and alkane ID
        balances: HashMap<(Address, AlkaneId), u64>,
    }

    impl AlkaneProtocol {
        /// Create a new alkane protocol
        pub fn new() -> Self {
            Self {
                alkanes: HashMap::new(),
                balances: HashMap::new(),
            }
        }

        /// Get an alkane by ID
        pub fn get_alkane(&self, alkane_id: &AlkaneId) -> Option<&Alkane> {
            self.alkanes.get(alkane_id)
        }

        /// Get alkane balance for an address
        pub fn get_balance(&self, address: &Address, alkane_id: &AlkaneId) -> u64 {
            self.balances.get(&(address.clone(), alkane_id.clone())).cloned().unwrap_or(0)
        }

        /// Create an alkane transfer
        pub fn create_transfer(
            &self,
            alkane_id: &AlkaneId,
            from: &Address,
            to: &Address,
            amount: u64,
        ) -> Result<AlkaneTransfer> {
            // Check if alkane exists
            if !self.alkanes.contains_key(alkane_id) {
                return Err(Error::InvalidAsset(format!("Alkane not found: {}", alkane_id)));
            }

            // Check if sender has enough balance
            let balance = self.get_balance(from, alkane_id);
            if balance < amount {
                return Err(Error::InsufficientFunds);
            }

            Ok(AlkaneTransfer {
                alkane_id: alkane_id.clone(),
                from: from.clone(),
                to: to.clone(),
                amount,
            })
        }

        /// Apply an alkane transfer
        pub fn apply_transfer(&mut self, transfer: &AlkaneTransfer) -> Result<()> {
            // Check if alkane exists
            if !self.alkanes.contains_key(&transfer.alkane_id) {
                return Err(Error::InvalidAsset(format!("Alkane not found: {}", transfer.alkane_id)));
            }

            // Check if sender has enough balance
            let sender_balance = self.get_balance(&transfer.from, &transfer.alkane_id);
            if sender_balance < transfer.amount {
                return Err(Error::InsufficientFunds);
            }

            // Update balances
            let sender_key = (transfer.from.clone(), transfer.alkane_id.clone());
            let receiver_key = (transfer.to.clone(), transfer.alkane_id.clone());

            // Decrease sender balance
            self.balances.insert(sender_key, sender_balance - transfer.amount);

            // Increase receiver balance
            let receiver_balance = self.get_balance(&transfer.to, &transfer.alkane_id);
            self.balances.insert(receiver_key, receiver_balance + transfer.amount);

            Ok(())
        }

        /// Create an alkane transaction
        pub fn create_transaction(
            &self,
            transfer: &AlkaneTransfer,
            inputs: Vec<(OutPoint, TxOut)>,
            change_address: &Address,
            fee_rate: f64,
        ) -> Result<Transaction> {
            // Implementation will depend on the specific alkanes protocol
            // This is a placeholder
            unimplemented!()
        }

        /// Validate an alkane transaction
        pub fn validate_transaction(&self, transaction: &Transaction) -> Result<()> {
            // Implementation will depend on the specific alkanes protocol
            // This is a placeholder
            unimplemented!()
        }
    }
}
```

#### 2.2 PSBT Extensions for Alkanes

Next, we'll extend the PSBT handling to support alkanes:

```rust
/// Create an alkane transfer PSBT
pub fn create_alkane_transfer_psbt(
    wallet: &impl BitcoinWallet,
    alkane_id: &AlkaneId,
    from_address: &Address,
    to_address: &Address,
    amount: u64,
    fee_rate: f64,
) -> Result<Psbt> {
    // Get UTXOs
    let utxos = wallet.utxos();
    if utxos.is_empty() {
        return Err(Error::BitcoinError("No UTXOs available".to_string()));
    }

    // Create inputs
    let mut inputs = Vec::new();
    let mut input_value = 0;
    for utxo in &utxos {
        inputs.push(TxIn {
            previous_output: utxo.outpoint,
            script_sig: ScriptBuf::new(),
            sequence: bitcoin::Sequence::MAX,
            witness: Witness::new(),
        });
        input_value += utxo.txout.value;
    }

    // Create outputs
    let mut outputs = Vec::new();

    // Add alkane transfer output
    // This will depend on the specific alkanes protocol
    // For now, we'll use a simple OP_RETURN output
    let alkane_data = format!("ALKANE:{}:{}", alkane_id, amount);
    let script = ScriptBuf::new_op_return(&alkane_data.as_bytes());
    outputs.push(TxOut {
        value: 0,
        script_pubkey: script,
    });

    // Add recipient output
    outputs.push(TxOut {
        value: amount,
        script_pubkey: to_address.script_pubkey(),
    });

    // Add change output
    let fee = PsbtUtils::estimate_transaction_fee(inputs.len(), outputs.len() + 1, fee_rate);
    let change_value = input_value - amount - fee.to_sat();
    if change_value > 0 {
        outputs.push(TxOut {
            value: change_value,
            script_pubkey: from_address.script_pubkey(),
        });
    }

    // Create PSBT
    let mut psbt = PsbtUtils::create_psbt(inputs, outputs)?;

    // Add input information
    for (i, utxo) in utxos.iter().enumerate() {
        psbt.inputs[i].witness_utxo = Some(utxo.txout.clone());
    }

    Ok(psbt)
}
```

#### 2.3 Orderbook Extensions for Alkanes

Finally, we'll extend the orderbook to support alkanes (similar to runes).

### Phase 3: Integration and Testing

#### 3.1 Integration with DarkSwap SDK

We'll integrate the runes and alkanes modules with the DarkSwap SDK:

```rust
/// DarkSwap SDK
pub struct DarkSwap {
    // ...
    /// Runes protocol
    runes_protocol: Option<runes::RuneProtocol>,
    /// Alkanes protocol
    alkanes_protocol: Option<alkanes::AlkaneProtocol>,
    // ...
}

impl DarkSwap {
    // ...

    /// Create a rune transfer
    pub async fn create_rune_transfer(
        &self,
        rune_id: &RuneId,
        to_address: &Address,
        amount: u64,
    ) -> Result<Transaction> {
        // Check if runes protocol is initialized
        let runes_protocol = self.runes_protocol.as_ref()
            .ok_or_else(|| Error::ConfigError("Runes protocol not initialized".to_string()))?;

        // Get wallet
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| Error::WalletError("Wallet not initialized".to_string()))?;

        // Get from address
        let from_address = wallet.addresses().get(0)
            .ok_or_else(|| Error::WalletError("No addresses available".to_string()))?;

        // Create transfer
        let transfer = runes_protocol.create_transfer(
            rune_id,
            from_address,
            to_address,
            amount,
        )?;

        // Create PSBT
        let psbt = create_rune_transfer_psbt(
            wallet,
            rune_id,
            from_address,
            to_address,
            amount,
            self.config.bitcoin.fee_rate,
        )?;

        // Sign PSBT
        let mut signed_psbt = psbt.clone();
        wallet.sign_psbt(&mut signed_psbt)?;

        // Extract transaction
        let transaction = PsbtUtils::extract_transaction(&signed_psbt)?;

        Ok(transaction)
    }

    /// Create an alkane transfer
    pub async fn create_alkane_transfer(
        &self,
        alkane_id: &AlkaneId,
        to_address: &Address,
        amount: u64,
    ) -> Result<Transaction> {
        // Check if alkanes protocol is initialized
        let alkanes_protocol = self.alkanes_protocol.as_ref()
            .ok_or_else(|| Error::ConfigError("Alkanes protocol not initialized".to_string()))?;

        // Get wallet
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| Error::WalletError("Wallet not initialized".to_string()))?;

        // Get from address
        let from_address = wallet.addresses().get(0)
            .ok_or_else(|| Error::WalletError("No addresses available".to_string()))?;

        // Create transfer
        let transfer = alkanes_protocol.create_transfer(
            alkane_id,
            from_address,
            to_address,
            amount,
        )?;

        // Create PSBT
        let psbt = create_alkane_transfer_psbt(
            wallet,
            alkane_id,
            from_address,
            to_address,
            amount,
            self.config.bitcoin.fee_rate,
        )?;

        // Sign PSBT
        let mut signed_psbt = psbt.clone();
        wallet.sign_psbt(&mut signed_psbt)?;

        // Extract transaction
        let transaction = PsbtUtils::extract_transaction(&signed_psbt)?;

        Ok(transaction)
    }

    // ...
}
```

#### 3.2 Testing

We'll add comprehensive tests for the runes and alkanes functionality:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{RuneId, AlkaneId};
    use bitcoin::Address;

    #[test]
    fn test_rune_transfer() {
        let mut runes_protocol = runes::RuneProtocol::new();
        
        // Add a rune
        let rune_id = RuneId("test_rune".to_string());
        let rune = runes::Rune {
            id: rune_id.clone(),
            symbol: "TEST".to_string(),
            name: "Test Rune".to_string(),
            decimals: 8,
            supply: 1_000_000,
            limit: Some(1_000_000),
        };
        runes_protocol.runes.insert(rune_id.clone(), rune);
        
        // Add balance
        let from_address = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx").unwrap();
        let to_address = Address::from_str("tb1q0sqzfp2lssp0ygk4pg9c5zqgwza0uwgws5tv0x").unwrap();
        runes_protocol.balances.insert((from_address.clone(), rune_id.clone()), 1000);
        
        // Create transfer
        let transfer = runes_protocol.create_transfer(
            &rune_id,
            &from_address,
            &to_address,
            500,
        ).unwrap();
        
        // Apply transfer
        runes_protocol.apply_transfer(&transfer).unwrap();
        
        // Check balances
        assert_eq!(runes_protocol.get_balance(&from_address, &rune_id), 500);
        assert_eq!(runes_protocol.get_balance(&to_address, &rune_id), 500);
    }

    #[test]
    fn test_alkane_transfer() {
        let mut alkanes_protocol = alkanes::AlkaneProtocol::new();
        
        // Add an alkane
        let alkane_id = AlkaneId("test_alkane".to_string());
        let alkane = alkanes::Alkane {
            id: alkane_id.clone(),
            symbol: "TEST".to_string(),
            name: "Test Alkane".to_string(),
            decimals: 8,
            supply: 1_000_000,
            limit: Some(1_000_000),
        };
        alkanes_protocol.alkanes.insert(alkane_id.clone(), alkane);
        
        // Add balance
        let from_address = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx").unwrap();
        let to_address = Address::from_str("tb1q0sqzfp2lssp0ygk4pg9c5zqgwza0uwgws5tv0x").unwrap();
        alkanes_protocol.balances.insert((from_address.clone(), alkane_id.clone()), 1000);
        
        // Create transfer
        let transfer = alkanes_protocol.create_transfer(
            &alkane_id,
            &from_address,
            &to_address,
            500,
        ).unwrap();
        
        // Apply transfer
        alkanes_protocol.apply_transfer(&transfer).unwrap();
        
        // Check balances
        assert_eq!(alkanes_protocol.get_balance(&from_address, &alkane_id), 500);
        assert_eq!(alkanes_protocol.get_balance(&to_address, &alkane_id), 500);
    }
}
```

## Challenges and Solutions

### 1. Protocol Compatibility

**Challenge**: Ensuring compatibility with the runes and alkanes protocols, which may evolve over time.

**Solution**: Implement a modular design that can adapt to protocol changes, and use feature flags to enable or disable specific protocol versions.

### 2. Transaction Validation

**Challenge**: Validating rune and alkane transactions, which have different rules than regular Bitcoin transactions.

**Solution**: Implement comprehensive validation logic for each protocol, and use a pluggable validation system that can be extended for new protocols.

### 3. Performance

**Challenge**: Handling large numbers of rune and alkane transactions efficiently.

**Solution**: Optimize the implementation for performance, use caching where appropriate, and implement batch processing for transactions.

## Timeline

### Week 1: Research and Design

- Research the runes and alkanes protocols in detail
- Design the implementation architecture
- Create detailed specifications for each component

### Week 2: Runes Implementation

- Implement the runes protocol
- Extend the PSBT handling for runes
- Extend the orderbook for runes
- Add tests for runes functionality

### Week 3: Alkanes Implementation

- Implement the alkanes protocol
- Extend the PSBT handling for alkanes
- Extend the orderbook for alkanes
- Add tests for alkanes functionality

### Week 4: Integration and Testing

- Integrate the runes and alkanes modules with the DarkSwap SDK
- Add comprehensive tests for the integrated functionality
- Optimize performance
- Create documentation

## Conclusion

Implementing support for runes and alkanes in the DarkSwap SDK will enable users to trade these Bitcoin-based assets in a decentralized, peer-to-peer manner. By following this implementation plan, we can ensure that the implementation is robust, efficient, and compatible with the evolving protocols.

The modular design of the implementation will allow for easy extension and customization, making it a solid foundation for building decentralized trading applications on Bitcoin.

## References

- [Runes Protocol Specification](https://github.com/ordinals/runes)
- [Alkanes Protocol Specification](https://github.com/alkanes/alkanes)
- [Bitcoin PSBT BIP-174](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki)
- [Ordinals Protocol](https://github.com/ordinals/ord)