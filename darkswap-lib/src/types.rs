//! Common types for the DarkSwap library.

use serde::{Deserialize, Serialize};
use std::fmt;

/// Asset type.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AssetType {
    /// Bitcoin.
    #[serde(rename = "btc")]
    Bitcoin,
    /// Rune.
    #[serde(rename = "rune")]
    Rune,
    /// Alkane.
    #[serde(rename = "alkane")]
    Alkane,
}

impl fmt::Display for AssetType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AssetType::Bitcoin => write!(f, "btc"),
            AssetType::Rune => write!(f, "rune"),
            AssetType::Alkane => write!(f, "alkane"),
        }
    }
}

/// Asset identifier.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct AssetId {
    /// Asset type.
    pub asset_type: AssetType,
    /// Asset identifier.
    pub id: String,
}

impl fmt::Display for AssetId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.asset_type {
            AssetType::Bitcoin => write!(f, "btc"),
            AssetType::Rune => write!(f, "rune:{}", self.id),
            AssetType::Alkane => write!(f, "alkane:{}", self.id),
        }
    }
}

/// Order side.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OrderSide {
    /// Buy.
    #[serde(rename = "buy")]
    Buy,
    /// Sell.
    #[serde(rename = "sell")]
    Sell,
}

impl fmt::Display for OrderSide {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OrderSide::Buy => write!(f, "buy"),
            OrderSide::Sell => write!(f, "sell"),
        }
    }
}

/// Order status.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OrderStatus {
    /// Open.
    #[serde(rename = "open")]
    Open,
    /// Filled.
    #[serde(rename = "filled")]
    Filled,
    /// Cancelled.
    #[serde(rename = "cancelled")]
    Cancelled,
    /// Expired.
    #[serde(rename = "expired")]
    Expired,
}

impl fmt::Display for OrderStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OrderStatus::Open => write!(f, "open"),
            OrderStatus::Filled => write!(f, "filled"),
            OrderStatus::Cancelled => write!(f, "cancelled"),
            OrderStatus::Expired => write!(f, "expired"),
        }
    }
}

/// Trade status.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TradeStatus {
    /// Pending.
    #[serde(rename = "pending")]
    Pending,
    /// Completed.
    #[serde(rename = "completed")]
    Completed,
    /// Failed.
    #[serde(rename = "failed")]
    Failed,
}

impl fmt::Display for TradeStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TradeStatus::Pending => write!(f, "pending"),
            TradeStatus::Completed => write!(f, "completed"),
            TradeStatus::Failed => write!(f, "failed"),
        }
    }
}

/// Wallet type.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WalletType {
    /// Simple wallet.
    #[serde(rename = "simple")]
    Simple,
    /// BDK wallet.
    #[serde(rename = "bdk")]
    Bdk,
    /// External wallet.
    #[serde(rename = "external")]
    External,
}

impl fmt::Display for WalletType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            WalletType::Simple => write!(f, "simple"),
            WalletType::Bdk => write!(f, "bdk"),
            WalletType::External => write!(f, "external"),
        }
    }
}

/// Network type.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum NetworkType {
    /// Mainnet.
    #[serde(rename = "mainnet")]
    Mainnet,
    /// Testnet.
    #[serde(rename = "testnet")]
    Testnet,
    /// Regtest.
    #[serde(rename = "regtest")]
    Regtest,
}

impl fmt::Display for NetworkType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NetworkType::Mainnet => write!(f, "mainnet"),
            NetworkType::Testnet => write!(f, "testnet"),
            NetworkType::Regtest => write!(f, "regtest"),
        }
    }
}