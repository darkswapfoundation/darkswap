//! Trade execution for DarkSwap
//!
//! This module provides trade execution functionality for DarkSwap, including
//! PSBT creation, signing, and validation.

use crate::error::{Error, Result};
use crate::orderbook::{Order, OrderSide, OrderStatus};
use crate::types::{Asset, OrderId, PeerId, TradeId};
use bitcoin::{
    psbt::Psbt,
    Amount, OutPoint, ScriptBuf, Sequence, Transaction, TxIn, TxOut, Txid,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

/// Trade status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TradeStatus {
    /// Pending trade
    Pending,
    /// Completed trade
    Completed,
    /// Failed trade
    Failed,
}

/// Trade data structure
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Trade {
    /// Trade ID
    pub id: TradeId,
    /// Order ID
    pub order_id: OrderId,
    /// Maker peer ID
    pub maker: PeerId,
    /// Taker peer ID
    pub taker: PeerId,
    /// Base asset
    pub base_asset: Asset,
    /// Quote asset
    pub quote_asset: Asset,
    /// Order side
    pub side: OrderSide,
    /// Trade amount
    pub amount: Decimal,
    /// Trade price
    pub price: Decimal,
    /// Trade status
    pub status: TradeStatus,
    /// Trade timestamp
    pub timestamp: u64,
    /// PSBT
    pub psbt: Option<Vec<u8>>,
    /// Transaction ID
    pub txid: Option<String>,
}

impl Trade {
    /// Create a new trade
    pub fn new(
        order: &Order,
        taker: PeerId,
        amount: Decimal,
    ) -> Self {
        let id = TradeId::new();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            id,
            order_id: order.id.clone(),
            maker: order.maker.clone(),
            taker,
            base_asset: order.base_asset.clone(),
            quote_asset: order.quote_asset.clone(),
            side: order.side,
            amount,
            price: order.price,
            status: TradeStatus::Pending,
            timestamp,
            psbt: None,
            txid: None,
        }
    }

    /// Get the total value of the trade
    pub fn total_value(&self) -> Decimal {
        self.amount * self.price
    }

    /// Set the PSBT
    pub fn set_psbt(&mut self, psbt: Vec<u8>) {
        self.psbt = Some(psbt);
    }

    /// Set the transaction ID
    pub fn set_txid(&mut self, txid: String) {
        self.txid = Some(txid);
    }

    /// Complete the trade
    pub fn complete(&mut self) {
        self.status = TradeStatus::Completed;
    }

    /// Fail the trade
    pub fn fail(&mut self) {
        self.status = TradeStatus::Failed;
    }
}

/// Trade manager
#[derive(Debug)]
pub struct TradeManager {
    /// Trades by ID
    trades: HashMap<TradeId, Trade>,
    /// Trades by order ID
    order_trades: HashMap<OrderId, Vec<TradeId>>,
    /// Trades by maker
    maker_trades: HashMap<PeerId, Vec<TradeId>>,
    /// Trades by taker
    taker_trades: HashMap<PeerId, Vec<TradeId>>,
}

impl TradeManager {
    /// Create a new trade manager
    pub fn new() -> Self {
        Self {
            trades: HashMap::new(),
            order_trades: HashMap::new(),
            maker_trades: HashMap::new(),
            taker_trades: HashMap::new(),
        }
    }

    /// Add a trade
    pub fn add_trade(&mut self, trade: Trade) {
        let trade_id = trade.id.clone();
        let order_id = trade.order_id.clone();
        let maker = trade.maker.clone();
        let taker = trade.taker.clone();

        // Add the trade to the trades map
        self.trades.insert(trade_id.clone(), trade);

        // Add the trade to the order_trades map
        let order_trades = self.order_trades.entry(order_id).or_insert_with(Vec::new);
        order_trades.push(trade_id.clone());

        // Add the trade to the maker_trades map
        let maker_trades = self.maker_trades.entry(maker).or_insert_with(Vec::new);
        maker_trades.push(trade_id.clone());

        // Add the trade to the taker_trades map
        let taker_trades = self.taker_trades.entry(taker).or_insert_with(Vec::new);
        taker_trades.push(trade_id);
    }

    /// Get a trade by ID
    pub fn get_trade(&self, trade_id: &TradeId) -> Option<&Trade> {
        self.trades.get(trade_id)
    }

    /// Get a mutable trade by ID
    pub fn get_trade_mut(&mut self, trade_id: &TradeId) -> Option<&mut Trade> {
        self.trades.get_mut(trade_id)
    }

    /// Get all trades for an order
    pub fn get_order_trades(&self, order_id: &OrderId) -> Vec<&Trade> {
        let mut trades = Vec::new();

        if let Some(trade_ids) = self.order_trades.get(order_id) {
            for trade_id in trade_ids {
                if let Some(trade) = self.trades.get(trade_id) {
                    trades.push(trade);
                }
            }
        }

        trades
    }

    /// Get all trades for a maker
    pub fn get_maker_trades(&self, maker: &PeerId) -> Vec<&Trade> {
        let mut trades = Vec::new();

        if let Some(trade_ids) = self.maker_trades.get(maker) {
            for trade_id in trade_ids {
                if let Some(trade) = self.trades.get(trade_id) {
                    trades.push(trade);
                }
            }
        }

        trades
    }

    /// Get all trades for a taker
    pub fn get_taker_trades(&self, taker: &PeerId) -> Vec<&Trade> {
        let mut trades = Vec::new();

        if let Some(trade_ids) = self.taker_trades.get(taker) {
            for trade_id in trade_ids {
                if let Some(trade) = self.trades.get(trade_id) {
                    trades.push(trade);
                }
            }
        }

        trades
    }

    /// Update a trade
    pub fn update_trade(&mut self, trade_id: &TradeId, update_fn: impl FnOnce(&mut Trade)) -> Result<()> {
        if let Some(trade) = self.trades.get_mut(trade_id) {
            update_fn(trade);
            Ok(())
        } else {
            Err(Error::TradeNotFound(trade_id.to_string()))
        }
    }
}

/// Thread-safe trade manager
pub struct ThreadSafeTradeManager {
    /// Inner trade manager
    inner: Arc<Mutex<TradeManager>>,
}

impl ThreadSafeTradeManager {
    /// Create a new thread-safe trade manager
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(TradeManager::new())),
        }
    }

    /// Add a trade
    pub fn add_trade(&self, trade: Trade) -> Result<()> {
        let mut trade_manager = self.inner.lock().map_err(|_| Error::TradeLockError)?;
        trade_manager.add_trade(trade);
        Ok(())
    }

    /// Get a trade by ID
    pub fn get_trade(&self, trade_id: &TradeId) -> Result<Option<Trade>> {
        let trade_manager = self.inner.lock().map_err(|_| Error::TradeLockError)?;
        Ok(trade_manager.get_trade(trade_id).cloned())
    }

    /// Get all trades for an order
    pub fn get_order_trades(&self, order_id: &OrderId) -> Result<Vec<Trade>> {
        let trade_manager = self.inner.lock().map_err(|_| Error::TradeLockError)?;
        Ok(trade_manager.get_order_trades(order_id).into_iter().cloned().collect())
    }

    /// Get all trades for a maker
    pub fn get_maker_trades(&self, maker: &PeerId) -> Result<Vec<Trade>> {
        let trade_manager = self.inner.lock().map_err(|_| Error::TradeLockError)?;
        Ok(trade_manager.get_maker_trades(maker).into_iter().cloned().collect())
    }

    /// Get all trades for a taker
    pub fn get_taker_trades(&self, taker: &PeerId) -> Result<Vec<Trade>> {
        let trade_manager = self.inner.lock().map_err(|_| Error::TradeLockError)?;
        Ok(trade_manager.get_taker_trades(taker).into_iter().cloned().collect())
    }

    /// Update a trade
    pub fn update_trade(&self, trade_id: &TradeId, update_fn: impl FnOnce(&mut Trade)) -> Result<()> {
        let mut trade_manager = self.inner.lock().map_err(|_| Error::TradeLockError)?;
        trade_manager.update_trade(trade_id, update_fn)
    }
}

impl Clone for ThreadSafeTradeManager {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

/// PSBT builder for creating PSBTs for trades
pub struct PsbtBuilder {
    /// Bitcoin network
    network: bitcoin::Network,
}

impl PsbtBuilder {
    /// Create a new PSBT builder
    pub fn new(network: bitcoin::Network) -> Self {
        Self { network }
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
        // Create inputs
        let mut inputs = Vec::new();
        for (outpoint, _) in maker_inputs.iter().chain(taker_inputs.iter()) {
            inputs.push(TxIn {
                previous_output: *outpoint,
                script_sig: ScriptBuf::new(),
                sequence: Sequence::MAX,
                witness: bitcoin::Witness::new(),
            });
        }

        // Create outputs
        let outputs = maker_outputs.into_iter().chain(taker_outputs.into_iter()).collect();

        // Create transaction
        let tx = Transaction {
            version: 2,
            lock_time: bitcoin::absolute::LockTime::ZERO,
            input: inputs,
            output: outputs,
        };

        // Create PSBT
        let mut psbt = Psbt::from_unsigned_tx(tx)?;

        // Add input information
        for (i, (_, txout)) in maker_inputs.iter().enumerate() {
            psbt.inputs[i].witness_utxo = Some(txout.clone());
        }

        for (i, (_, txout)) in taker_inputs.iter().enumerate() {
            psbt.inputs[i + maker_inputs.len()].witness_utxo = Some(txout.clone());
        }

        Ok(psbt)
    }

    /// Verify a PSBT for a trade
    pub fn verify_psbt(&self, trade: &Trade, psbt: &Psbt) -> Result<bool> {
        // Verify that the PSBT is valid
        if psbt.inputs.is_empty() || psbt.outputs.is_empty() {
            return Ok(false);
        }

        // Verify that the PSBT has the correct number of inputs and outputs
        // This is a simplified check - in a real implementation, we would need to verify
        // that the inputs and outputs match the trade parameters
        if psbt.inputs.len() < 2 || psbt.outputs.len() < 2 {
            return Ok(false);
        }

        // Verify that the PSBT is not finalized
        for input in &psbt.inputs {
            if input.final_script_sig.is_some() || input.final_script_witness.is_some() {
                return Ok(false);
            }
        }

        Ok(true)
    }

    /// Finalize a PSBT
    pub fn finalize_psbt(&self, psbt: &mut Psbt) -> Result<()> {
        // In a real implementation, we would finalize the PSBT by adding signatures
        // For now, we'll just return Ok
        Ok(())
    }

    /// Extract the transaction from a PSBT
    pub fn extract_transaction(&self, psbt: &Psbt) -> Result<Transaction> {
        // Verify that the PSBT is finalized
        for input in &psbt.inputs {
            if input.final_script_sig.is_none() && input.final_script_witness.is_none() {
                return Err(Error::BitcoinPsbtError("PSBT is not finalized".to_string()));
            }
        }

        // Extract the transaction (need to clone since extract_tx takes ownership)
        let tx = psbt.clone().extract_tx();
        Ok(tx)
    }

    /// Broadcast a transaction
    pub fn broadcast_transaction(&self, tx: &Transaction) -> Result<Txid> {
        // In a real implementation, we would broadcast the transaction to the Bitcoin network
        // For now, we'll just return the transaction ID
        Ok(tx.txid())
    }
}

/// Trade negotiator for negotiating trades
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
            return Err(Error::InvalidAmount("Trade amount must be positive and not exceed order amount".to_string()));
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::RuneId;

    #[test]
    fn test_trade_creation() {
        let maker = PeerId("maker".to_string());
        let taker = PeerId("taker".to_string());
        let base_asset = Asset::Bitcoin;
        let quote_asset = Asset::Rune(RuneId("test_rune".to_string()));
        let expiry = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() + 3600; // 1 hour from now

        // Create an order
        let order = Order::new(
            maker.clone(),
            base_asset.clone(),
            quote_asset.clone(),
            OrderSide::Buy,
            Decimal::new(100, 0),
            Decimal::new(50000, 0),
            expiry,
        );

        // Create a trade
        let trade = Trade::new(&order, taker.clone(), Decimal::new(50, 0));

        assert_eq!(trade.order_id, order.id);
        assert_eq!(trade.maker, maker);
        assert_eq!(trade.taker, taker);
        assert_eq!(trade.base_asset, base_asset);
        assert_eq!(trade.quote_asset, quote_asset);
        assert_eq!(trade.side, OrderSide::Buy);
        assert_eq!(trade.amount, Decimal::new(50, 0));
        assert_eq!(trade.price, Decimal::new(50000, 0));
        assert_eq!(trade.status, TradeStatus::Pending);
        assert!(trade.timestamp > 0);
        assert_eq!(trade.psbt, None);
        assert_eq!(trade.txid, None);
    }

    #[test]
    fn test_trade_manager() {
        let mut trade_manager = TradeManager::new();
        let maker = PeerId("maker".to_string());
        let taker = PeerId("taker".to_string());
        let base_asset = Asset::Bitcoin;
        let quote_asset = Asset::Rune(RuneId("test_rune".to_string()));
        let expiry = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() + 3600; // 1 hour from now

        // Create an order
        let order = Order::new(
            maker.clone(),
            base_asset.clone(),
            quote_asset.clone(),
            OrderSide::Buy,
            Decimal::new(100, 0),
            Decimal::new(50000, 0),
            expiry,
        );
        let order_id = order.id.clone();

        // Create a trade
        let trade = Trade::new(&order, taker.clone(), Decimal::new(50, 0));
        let trade_id = trade.id.clone();

        // Add the trade to the trade manager
        trade_manager.add_trade(trade.clone());

        // Test get_trade
        assert_eq!(trade_manager.get_trade(&trade_id), Some(&trade));

        // Test get_order_trades
        let order_trades = trade_manager.get_order_trades(&order_id);
        assert_eq!(order_trades.len(), 1);
        assert_eq!(order_trades[0], &trade);

        // Test get_maker_trades
        let maker_trades = trade_manager.get_maker_trades(&maker);
        assert_eq!(maker_trades.len(), 1);
        assert_eq!(maker_trades[0], &trade);

        // Test get_taker_trades
        let taker_trades = trade_manager.get_taker_trades(&taker);
        assert_eq!(taker_trades.len(), 1);
        assert_eq!(taker_trades[0], &trade);

        // Test update_trade
        trade_manager.update_trade(&trade_id, |t| {
            t.set_psbt(vec![1, 2, 3]);
            t.set_txid("txid".to_string());
            t.complete();
        }).unwrap();

        let updated_trade = trade_manager.get_trade(&trade_id).unwrap();
        assert_eq!(updated_trade.psbt, Some(vec![1, 2, 3]));
        assert_eq!(updated_trade.txid, Some("txid".to_string()));
        assert_eq!(updated_trade.status, TradeStatus::Completed);
    }
}