//! Block explorer integration for DarkSwap Bridge
//!
//! This module provides integration with external block explorer services
//! to get information about Bitcoin transactions and addresses.

use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::error::Error;
use std::time::Duration;
use log::{debug, error, info, warn};

/// Block explorer provider
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BlockExplorerProvider {
    /// Blockstream.info API
    Blockstream,
    /// Blockchain.info API
    BlockchainInfo,
    /// BTC.com API
    BtcCom,
    /// Mempool.space API
    MempoolSpace,
    /// Custom API
    Custom,
}

/// Block explorer configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockExplorerConfig {
    /// Provider to use
    pub provider: BlockExplorerProvider,
    /// API key (if required)
    pub api_key: Option<String>,
    /// API URL (for custom provider)
    pub api_url: Option<String>,
    /// Network (mainnet or testnet)
    pub network: BitcoinNetwork,
    /// Request timeout in seconds
    pub timeout: u64,
}

/// Bitcoin network
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BitcoinNetwork {
    /// Bitcoin mainnet
    Mainnet,
    /// Bitcoin testnet
    Testnet,
}

impl Default for BlockExplorerConfig {
    fn default() -> Self {
        Self {
            provider: BlockExplorerProvider::Blockstream,
            api_key: None,
            api_url: None,
            network: BitcoinNetwork::Mainnet,
            timeout: 30,
        }
    }
}

/// Transaction information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionInfo {
    /// Transaction ID
    pub txid: String,
    /// Block height
    pub block_height: Option<u64>,
    /// Confirmation count
    pub confirmations: u64,
    /// Transaction fee in satoshis
    pub fee: u64,
    /// Transaction size in bytes
    pub size: u64,
    /// Transaction inputs
    pub inputs: Vec<TransactionInput>,
    /// Transaction outputs
    pub outputs: Vec<TransactionOutput>,
    /// Transaction timestamp
    pub timestamp: Option<u64>,
}

/// Transaction input
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionInput {
    /// Previous transaction ID
    pub prev_txid: String,
    /// Previous output index
    pub prev_vout: u32,
    /// Input address
    pub address: Option<String>,
    /// Input value in satoshis
    pub value: u64,
}

/// Transaction output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionOutput {
    /// Output index
    pub n: u32,
    /// Output address
    pub address: Option<String>,
    /// Output value in satoshis
    pub value: u64,
    /// Output script type
    pub script_type: String,
}

/// Address information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddressInfo {
    /// Address
    pub address: String,
    /// Total received in satoshis
    pub total_received: u64,
    /// Total sent in satoshis
    pub total_sent: u64,
    /// Final balance in satoshis
    pub balance: u64,
    /// Number of transactions
    pub n_tx: u64,
    /// Unconfirmed balance in satoshis
    pub unconfirmed_balance: u64,
    /// Unconfirmed transactions
    pub unconfirmed_n_tx: u64,
}

/// Block explorer service
pub struct BlockExplorerService {
    /// HTTP client
    client: Client,
    /// Configuration
    config: BlockExplorerConfig,
}

impl BlockExplorerService {
    /// Create a new block explorer service
    pub fn new(config: BlockExplorerConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(config.timeout))
            .build()
            .unwrap_or_else(|_| Client::new());
        
        Self {
            client,
            config,
        }
    }

    /// Get transaction information
    pub async fn get_transaction(&self, txid: &str) -> Result<TransactionInfo, Box<dyn Error>> {
        match self.config.provider {
            BlockExplorerProvider::Blockstream => self.get_transaction_blockstream(txid).await,
            BlockExplorerProvider::BlockchainInfo => self.get_transaction_blockchain_info(txid).await,
            BlockExplorerProvider::BtcCom => self.get_transaction_btc_com(txid).await,
            BlockExplorerProvider::MempoolSpace => self.get_transaction_mempool_space(txid).await,
            BlockExplorerProvider::Custom => self.get_transaction_custom(txid).await,
        }
    }

    /// Get address information
    pub async fn get_address(&self, address: &str) -> Result<AddressInfo, Box<dyn Error>> {
        match self.config.provider {
            BlockExplorerProvider::Blockstream => self.get_address_blockstream(address).await,
            BlockExplorerProvider::BlockchainInfo => self.get_address_blockchain_info(address).await,
            BlockExplorerProvider::BtcCom => self.get_address_btc_com(address).await,
            BlockExplorerProvider::MempoolSpace => self.get_address_mempool_space(address).await,
            BlockExplorerProvider::Custom => self.get_address_custom(address).await,
        }
    }

    /// Get transaction URL
    pub fn get_transaction_url(&self, txid: &str) -> String {
        match self.config.provider {
            BlockExplorerProvider::Blockstream => {
                let network = match self.config.network {
                    BitcoinNetwork::Mainnet => "",
                    BitcoinNetwork::Testnet => "/testnet",
                };
                format!("https://blockstream.info{}/tx/{}", network, txid)
            }
            BlockExplorerProvider::BlockchainInfo => {
                format!("https://www.blockchain.com/btc/tx/{}", txid)
            }
            BlockExplorerProvider::BtcCom => {
                format!("https://btc.com/{}", txid)
            }
            BlockExplorerProvider::MempoolSpace => {
                let network = match self.config.network {
                    BitcoinNetwork::Mainnet => "",
                    BitcoinNetwork::Testnet => "/testnet",
                };
                format!("https://mempool.space{}/tx/{}", network, txid)
            }
            BlockExplorerProvider::Custom => {
                if let Some(api_url) = &self.config.api_url {
                    format!("{}/tx/{}", api_url, txid)
                } else {
                    format!("https://blockstream.info/tx/{}", txid)
                }
            }
        }
    }

    /// Get address URL
    pub fn get_address_url(&self, address: &str) -> String {
        match self.config.provider {
            BlockExplorerProvider::Blockstream => {
                let network = match self.config.network {
                    BitcoinNetwork::Mainnet => "",
                    BitcoinNetwork::Testnet => "/testnet",
                };
                format!("https://blockstream.info{}/address/{}", network, address)
            }
            BlockExplorerProvider::BlockchainInfo => {
                format!("https://www.blockchain.com/btc/address/{}", address)
            }
            BlockExplorerProvider::BtcCom => {
                format!("https://btc.com/{}", address)
            }
            BlockExplorerProvider::MempoolSpace => {
                let network = match self.config.network {
                    BitcoinNetwork::Mainnet => "",
                    BitcoinNetwork::Testnet => "/testnet",
                };
                format!("https://mempool.space{}/address/{}", network, address)
            }
            BlockExplorerProvider::Custom => {
                if let Some(api_url) = &self.config.api_url {
                    format!("{}/address/{}", api_url, address)
                } else {
                    format!("https://blockstream.info/address/{}", address)
                }
            }
        }
    }

    // Implementation for Blockstream.info
    async fn get_transaction_blockstream(&self, txid: &str) -> Result<TransactionInfo, Box<dyn Error>> {
        let network = match self.config.network {
            BitcoinNetwork::Mainnet => "",
            BitcoinNetwork::Testnet => "/testnet",
        };
        
        let url = format!("https://blockstream.info{}/api/tx/{}", network, txid);
        let response = self.client.get(&url).send().await?;
        
        if !response.status().is_success() {
            return Err(format!("Blockstream API returned error: {}", response.status()).into());
        }
        
        let data: BlockstreamTxResponse = response.json().await?;
        
        // Get block height and confirmations if confirmed
        let (block_height, confirmations) = if let Some(status) = &data.status {
            if let Some(block_height) = status.block_height {
                // Get current block height to calculate confirmations
                let tip_url = format!("https://blockstream.info{}/api/blocks/tip/height", network);
                let tip_response = self.client.get(&tip_url).send().await?;
                
                if !tip_response.status().is_success() {
                    return Err(format!("Blockstream API returned error: {}", tip_response.status()).into());
                }
                
                let current_height: u64 = tip_response.text().await?.parse()?;
                let confirmations = current_height - block_height + 1;
                
                (Some(block_height), confirmations)
            } else {
                (None, 0)
            }
        } else {
            (None, 0)
        };
        
        // Convert inputs
        let inputs = data.vin.iter().map(|input| {
            TransactionInput {
                prev_txid: input.txid.clone(),
                prev_vout: input.vout,
                address: input.prevout.as_ref().and_then(|p| p.scriptpubkey_address.clone()),
                value: input.prevout.as_ref().map_or(0, |p| p.value),
            }
        }).collect();
        
        // Convert outputs
        let outputs = data.vout.iter().map(|output| {
            TransactionOutput {
                n: output.n,
                address: output.scriptpubkey_address.clone(),
                value: output.value,
                script_type: output.scriptpubkey_type.clone(),
            }
        }).collect();
        
        Ok(TransactionInfo {
            txid: data.txid,
            block_height,
            confirmations,
            fee: data.fee,
            size: data.size,
            inputs,
            outputs,
            timestamp: data.status.as_ref().and_then(|s| s.block_time.map(|t| t as u64)),
        })
    }

    async fn get_address_blockstream(&self, address: &str) -> Result<AddressInfo, Box<dyn Error>> {
        let network = match self.config.network {
            BitcoinNetwork::Mainnet => "",
            BitcoinNetwork::Testnet => "/testnet",
        };
        
        // Get address info
        let url = format!("https://blockstream.info{}/api/address/{}", network, address);
        let response = self.client.get(&url).send().await?;
        
        if !response.status().is_success() {
            return Err(format!("Blockstream API returned error: {}", response.status()).into());
        }
        
        let data: BlockstreamAddressResponse = response.json().await?;
        
        // Get unconfirmed transactions
        let mempool_url = format!("https://blockstream.info{}/api/address/{}/txs/mempool", network, address);
        let mempool_response = self.client.get(&mempool_url).send().await?;
        
        let unconfirmed_n_tx = if mempool_response.status().is_success() {
            let mempool_txs: Vec<BlockstreamTxResponse> = mempool_response.json().await?;
            mempool_txs.len() as u64
        } else {
            0
        };
        
        Ok(AddressInfo {
            address: address.to_string(),
            total_received: data.chain_stats.funded_txo_sum,
            total_sent: data.chain_stats.spent_txo_sum,
            balance: data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum,
            n_tx: data.chain_stats.tx_count,
            unconfirmed_balance: data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum,
            unconfirmed_n_tx,
        })
    }

    // Implementation for Blockchain.info
    async fn get_transaction_blockchain_info(&self, txid: &str) -> Result<TransactionInfo, Box<dyn Error>> {
        let url = format!("https://blockchain.info/rawtx/{}", txid);
        let response = self.client.get(&url).send().await?;
        
        if !response.status().is_success() {
            return Err(format!("Blockchain.info API returned error: {}", response.status()).into());
        }
        
        let data: BlockchainInfoTxResponse = response.json().await?;
        
        // Convert inputs
        let inputs = data.inputs.iter().map(|input| {
            TransactionInput {
                prev_txid: input.prev_out.tx_index.to_string(), // Not ideal, but blockchain.info doesn't provide txid directly
                prev_vout: input.prev_out.n as u32,
                address: input.prev_out.addr.clone(),
                value: input.prev_out.value,
            }
        }).collect();
        
        // Convert outputs
        let outputs = data.out.iter().map(|output| {
            TransactionOutput {
                n: output.n as u32,
                address: output.addr.clone(),
                value: output.value,
                script_type: output.script.clone(),
            }
        }).collect();
        
        Ok(TransactionInfo {
            txid: data.hash,
            block_height: if data.block_height > 0 { Some(data.block_height as u64) } else { None },
            confirmations: data.confirmations,
            fee: data.fee,
            size: data.size as u64,
            inputs,
            outputs,
            timestamp: Some(data.time as u64),
        })
    }

    async fn get_address_blockchain_info(&self, address: &str) -> Result<AddressInfo, Box<dyn Error>> {
        let url = format!("https://blockchain.info/address/{}?format=json", address);
        let response = self.client.get(&url).send().await?;
        
        if !response.status().is_success() {
            return Err(format!("Blockchain.info API returned error: {}", response.status()).into());
        }
        
        let data: BlockchainInfoAddressResponse = response.json().await?;
        
        Ok(AddressInfo {
            address: address.to_string(),
            total_received: data.total_received,
            total_sent: data.total_sent,
            balance: data.final_balance,
            n_tx: data.n_tx,
            unconfirmed_balance: 0, // Not directly provided by blockchain.info
            unconfirmed_n_tx: 0,    // Not directly provided by blockchain.info
        })
    }

    // Implementation for other providers would follow a similar pattern
    // For brevity, we'll just return errors for the remaining providers

    async fn get_transaction_btc_com(&self, _txid: &str) -> Result<TransactionInfo, Box<dyn Error>> {
        Err("BTC.com API not implemented".into())
    }

    async fn get_address_btc_com(&self, _address: &str) -> Result<AddressInfo, Box<dyn Error>> {
        Err("BTC.com API not implemented".into())
    }

    async fn get_transaction_mempool_space(&self, _txid: &str) -> Result<TransactionInfo, Box<dyn Error>> {
        Err("Mempool.space API not implemented".into())
    }

    async fn get_address_mempool_space(&self, _address: &str) -> Result<AddressInfo, Box<dyn Error>> {
        Err("Mempool.space API not implemented".into())
    }

    async fn get_transaction_custom(&self, _txid: &str) -> Result<TransactionInfo, Box<dyn Error>> {
        Err("Custom API not implemented".into())
    }

    async fn get_address_custom(&self, _address: &str) -> Result<AddressInfo, Box<dyn Error>> {
        Err("Custom API not implemented".into())
    }
}

// Response types for Blockstream.info API
#[derive(Debug, Deserialize)]
struct BlockstreamTxResponse {
    txid: String,
    fee: u64,
    size: u64,
    status: Option<BlockstreamTxStatus>,
    vin: Vec<BlockstreamTxInput>,
    vout: Vec<BlockstreamTxOutput>,
}

#[derive(Debug, Deserialize)]
struct BlockstreamTxStatus {
    confirmed: bool,
    block_height: Option<u64>,
    block_time: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct BlockstreamTxInput {
    txid: String,
    vout: u32,
    prevout: Option<BlockstreamTxPrevout>,
}

#[derive(Debug, Deserialize)]
struct BlockstreamTxPrevout {
    scriptpubkey_address: Option<String>,
    value: u64,
}

#[derive(Debug, Deserialize)]
struct BlockstreamTxOutput {
    n: u32,
    scriptpubkey_address: Option<String>,
    value: u64,
    scriptpubkey_type: String,
}

#[derive(Debug, Deserialize)]
struct BlockstreamAddressResponse {
    chain_stats: BlockstreamAddressStats,
    mempool_stats: BlockstreamAddressStats,
}

#[derive(Debug, Deserialize)]
struct BlockstreamAddressStats {
    tx_count: u64,
    funded_txo_sum: u64,
    spent_txo_sum: u64,
}

// Response types for Blockchain.info API
#[derive(Debug, Deserialize)]
struct BlockchainInfoTxResponse {
    hash: String,
    block_height: i64,
    confirmations: u64,
    fee: u64,
    size: u32,
    time: i64,
    inputs: Vec<BlockchainInfoTxInput>,
    out: Vec<BlockchainInfoTxOutput>,
}

#[derive(Debug, Deserialize)]
struct BlockchainInfoTxInput {
    prev_out: BlockchainInfoTxPrevout,
}

#[derive(Debug, Deserialize)]
struct BlockchainInfoTxPrevout {
    tx_index: u64,
    n: u32,
    addr: Option<String>,
    value: u64,
}

#[derive(Debug, Deserialize)]
struct BlockchainInfoTxOutput {
    n: u32,
    addr: Option<String>,
    value: u64,
    script: String,
}

#[derive(Debug, Deserialize)]
struct BlockchainInfoAddressResponse {
    address: String,
    total_received: u64,
    total_sent: u64,
    final_balance: u64,
    n_tx: u64,
}