//! DarkSwap CLI
//!
//! This is the command-line interface for DarkSwap, a decentralized peer-to-peer
//! trading platform for Bitcoin, runes, and alkanes.

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use darkswap_sdk::{
    config::{BitcoinNetwork, Config},
    types::{Asset, RuneId, AlkaneId},
    orderbook::{Order, OrderSide, OrderStatus},
    DarkSwap, Event,
};
use rust_decimal::Decimal;
use std::path::PathBuf;
use std::str::FromStr;
use tokio::signal;
use tokio::sync::mpsc;

/// DarkSwap CLI
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Cli {
    /// Path to configuration file
    #[clap(short, long, value_parser)]
    config: Option<PathBuf>,

    /// Bitcoin network (mainnet, testnet, regtest, signet)
    #[clap(short, long, value_parser, default_value = "testnet")]
    network: String,

    /// Subcommand
    #[clap(subcommand)]
    command: Commands,
}

/// CLI commands
#[derive(Subcommand, Debug)]
enum Commands {
    /// Start the DarkSwap daemon
    Daemon {
        /// Listen address for the REST API
        #[clap(short, long, default_value = "127.0.0.1:8080")]
        listen: String,
    },
    /// Create an order
    CreateOrder {
        /// Base asset (BTC, RUNE:<id>, ALKANE:<id>)
        #[clap(short, long)]
        base_asset: String,
        /// Quote asset (BTC, RUNE:<id>, ALKANE:<id>)
        #[clap(short, long)]
        quote_asset: String,
        /// Order side (buy, sell)
        #[clap(short, long)]
        side: String,
        /// Amount
        #[clap(short, long)]
        amount: String,
        /// Price
        #[clap(short, long)]
        price: String,
        /// Expiry in seconds
        #[clap(short, long)]
        expiry: Option<u64>,
    },
    /// Cancel an order
    CancelOrder {
        /// Order ID
        #[clap(short, long)]
        order_id: String,
    },
    /// Take an order
    TakeOrder {
        /// Order ID
        #[clap(short, long)]
        order_id: String,
        /// Amount
        #[clap(short, long)]
        amount: String,
    },
    /// List orders
    ListOrders {
        /// Base asset (BTC, RUNE:<id>, ALKANE:<id>)
        #[clap(short, long)]
        base_asset: Option<String>,
        /// Quote asset (BTC, RUNE:<id>, ALKANE:<id>)
        #[clap(short, long)]
        quote_asset: Option<String>,
        /// Order side (buy, sell, all)
        #[clap(short, long, default_value = "all")]
        side: String,
        /// Status (open, filled, canceled, expired, all)
        #[clap(short, long, default_value = "open")]
        status: String,
    },
    /// Get market data
    Market {
        /// Base asset (BTC, RUNE:<id>, ALKANE:<id>)
        #[clap(short, long)]
        base_asset: String,
        /// Quote asset (BTC, RUNE:<id>, ALKANE:<id>)
        #[clap(short, long)]
        quote_asset: String,
    },
    /// Connect wallet
    ConnectWallet {
        /// Wallet type (simple, bdk, external)
        #[clap(short, long, default_value = "simple")]
        wallet_type: String,
        /// Private key
        #[clap(short, long)]
        private_key: Option<String>,
        /// Mnemonic
        #[clap(short, long)]
        mnemonic: Option<String>,
        /// Derivation path
        #[clap(short, long)]
        derivation_path: Option<String>,
    },
}

/// Parse asset from string
fn parse_asset(asset_str: &str) -> Result<Asset> {
    if asset_str == "BTC" {
        Ok(Asset::Bitcoin)
    } else if asset_str.starts_with("RUNE:") {
        let id = asset_str.strip_prefix("RUNE:").unwrap();
        Ok(Asset::Rune(RuneId(id.to_string())))
    } else if asset_str.starts_with("ALKANE:") {
        let id = asset_str.strip_prefix("ALKANE:").unwrap();
        Ok(Asset::Alkane(AlkaneId(id.to_string())))
    } else {
        anyhow::bail!("Invalid asset: {}", asset_str)
    }
}

/// Parse order side from string
fn parse_order_side(side_str: &str) -> Result<OrderSide> {
    match side_str.to_lowercase().as_str() {
        "buy" => Ok(OrderSide::Buy),
        "sell" => Ok(OrderSide::Sell),
        _ => anyhow::bail!("Invalid order side: {}", side_str),
    }
}

/// Parse order status from string
fn parse_order_status(status_str: &str) -> Result<OrderStatus> {
    match status_str.to_lowercase().as_str() {
        "open" => Ok(OrderStatus::Open),
        "filled" => Ok(OrderStatus::Filled),
        "canceled" => Ok(OrderStatus::Canceled),
        "expired" => Ok(OrderStatus::Expired),
        _ => anyhow::bail!("Invalid order status: {}", status_str),
    }
}

/// Parse Bitcoin network from string
fn parse_bitcoin_network(network_str: &str) -> Result<BitcoinNetwork> {
    match network_str.to_lowercase().as_str() {
        "mainnet" => Ok(BitcoinNetwork::Mainnet),
        "testnet" => Ok(BitcoinNetwork::Testnet),
        "regtest" => Ok(BitcoinNetwork::Regtest),
        "signet" => Ok(BitcoinNetwork::Signet),
        _ => anyhow::bail!("Invalid Bitcoin network: {}", network_str),
    }
}

/// Load or create configuration
fn load_or_create_config(config_path: Option<PathBuf>, network: &str) -> Result<Config> {
    // Parse Bitcoin network
    let bitcoin_network = parse_bitcoin_network(network)?;

    // Try to load configuration from file
    if let Some(ref path) = config_path {
        if path.exists() {
            return Config::from_file(path).context("Failed to load configuration");
        }
    }

    // Create default configuration
    let mut config = Config::default();
    config.bitcoin.network = bitcoin_network;

    // Save configuration to file if path is provided
    if let Some(ref path) = config_path {
        config.to_file(path).context("Failed to save configuration")?;
    }

    Ok(config)
}

/// Start the daemon
async fn start_daemon(config: Config, listen_addr: &str) -> Result<()> {
    println!("Starting DarkSwap daemon on {}", listen_addr);

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    // Create a channel for shutdown signal
    let (shutdown_sender, mut shutdown_receiver) = mpsc::channel::<()>(1);

    // Handle Ctrl+C
    let shutdown_sender_clone = shutdown_sender.clone();
    tokio::spawn(async move {
        signal::ctrl_c().await.expect("Failed to listen for Ctrl+C");
        println!("Received Ctrl+C, shutting down...");
        let _ = shutdown_sender_clone.send(()).await;
    });

    // Process events
    loop {
        tokio::select! {
            event = darkswap.next_event() => {
                if let Some(event) = event {
                    match event {
                        Event::Network(network_event) => {
                            println!("Network event: {:?}", network_event);
                        }
                        Event::OrderCreated(order) => {
                            println!("Order created: {} ({} {} @ {})", order.id, order.amount, order.base_asset, order.price);
                        }
                        Event::OrderCanceled(order_id) => {
                            println!("Order canceled: {}", order_id);
                        }
                        Event::OrderFilled(order_id) => {
                            println!("Order filled: {}", order_id);
                        }
                        Event::TradeStarted(trade) => {
                            println!("Trade started: {} (Order: {})", trade.id, trade.order_id);
                        }
                        Event::TradeCompleted(trade) => {
                            println!("Trade completed: {} (Order: {})", trade.id, trade.order_id);
                        }
                        Event::TradeFailed(trade) => {
                            println!("Trade failed: {} (Order: {})", trade.id, trade.order_id);
                        }
                    }
                }
            }
            _ = shutdown_receiver.recv() => {
                println!("Shutting down DarkSwap daemon...");
                darkswap.stop().await?;
                break;
            }
        }
    }

    println!("DarkSwap daemon stopped");
    Ok(())
}

/// Create an order
async fn create_order(
    config: Config,
    base_asset_str: &str,
    quote_asset_str: &str,
    side_str: &str,
    amount_str: &str,
    price_str: &str,
    expiry: Option<u64>,
) -> Result<()> {
    // Parse parameters
    let base_asset = parse_asset(base_asset_str)?;
    let quote_asset = parse_asset(quote_asset_str)?;
    let side = parse_order_side(side_str)?;
    let amount = Decimal::from_str(amount_str).context("Invalid amount")?;
    let price = Decimal::from_str(price_str).context("Invalid price")?;

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    // Create order
    let order = darkswap.create_order(base_asset, quote_asset, side, amount, price, expiry).await?;

    println!("Order created: {} ({} {} @ {})", order.id, order.amount, order.base_asset, order.price);

    // Stop DarkSwap
    darkswap.stop().await?;

    Ok(())
}

/// Cancel an order
async fn cancel_order(config: Config, order_id_str: &str) -> Result<()> {
    // Parse parameters
    let order_id = darkswap_sdk::types::OrderId(order_id_str.to_string());

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    // Cancel order
    darkswap.cancel_order(&order_id).await?;

    println!("Order canceled: {}", order_id);

    // Stop DarkSwap
    darkswap.stop().await?;

    Ok(())
}

/// Take an order
async fn take_order(config: Config, order_id_str: &str, amount_str: &str) -> Result<()> {
    // Parse parameters
    let order_id = darkswap_sdk::types::OrderId(order_id_str.to_string());
    let amount = Decimal::from_str(amount_str).context("Invalid amount")?;

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    // Take order
    let trade = darkswap.take_order(&order_id, amount).await?;

    println!("Order taken: {} (Trade ID: {})", order_id, trade.id);

    // Stop DarkSwap
    darkswap.stop().await?;

    Ok(())
}

/// List orders
async fn list_orders(
    config: Config,
    base_asset_str: Option<&str>,
    quote_asset_str: Option<&str>,
    side_str: &str,
    status_str: &str,
) -> Result<()> {
    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    // Get orders
    let orders = if let (Some(base_asset_str), Some(quote_asset_str)) = (base_asset_str, quote_asset_str) {
        let base_asset = parse_asset(base_asset_str)?;
        let quote_asset = parse_asset(quote_asset_str)?;
        darkswap.get_orders(&base_asset, &quote_asset).await?
    } else {
        // TODO: Get all orders
        vec![]
    };

    // Filter orders by side and status
    let filtered_orders = if side_str == "all" && status_str == "all" {
        orders
    } else {
        let side = if side_str == "all" {
            None
        } else {
            Some(parse_order_side(side_str)?)
        };

        let status = if status_str == "all" {
            None
        } else {
            Some(parse_order_status(status_str)?)
        };

        orders
            .into_iter()
            .filter(|order| {
                let side_match = side.map_or(true, |s| order.side == s);
                let status_match = status.map_or(true, |s| order.status == s);
                side_match && status_match
            })
            .collect()
    };

    // Print orders
    println!("Orders:");
    for order in filtered_orders {
        println!(
            "{} | {} | {} {} @ {} | {}",
            order.id,
            match order.side {
                OrderSide::Buy => "BUY",
                OrderSide::Sell => "SELL",
            },
            order.amount,
            order.base_asset,
            order.price,
            match order.status {
                OrderStatus::Open => "OPEN",
                OrderStatus::Filled => "FILLED",
                OrderStatus::Canceled => "CANCELED",
                OrderStatus::Expired => "EXPIRED",
            }
        );
    }

    // Stop DarkSwap
    darkswap.stop().await?;

    Ok(())
}

/// Get market data
async fn get_market_data(config: Config, base_asset_str: &str, quote_asset_str: &str) -> Result<()> {
    // Parse parameters
    let base_asset = parse_asset(base_asset_str)?;
    let quote_asset = parse_asset(quote_asset_str)?;

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    // Get best bid and ask
    let (bid, ask) = darkswap.get_best_bid_ask(&base_asset, &quote_asset).await?;

    // Print market data
    println!("Market data for {}/{}", base_asset, quote_asset);
    println!("Best bid: {}", bid.map_or("None".to_string(), |b| b.to_string()));
    println!("Best ask: {}", ask.map_or("None".to_string(), |a| a.to_string()));
    println!("Spread: {}", match (bid, ask) {
        (Some(bid), Some(ask)) => (ask - bid).to_string(),
        _ => "N/A".to_string(),
    });

    // Stop DarkSwap
    darkswap.stop().await?;

    Ok(())
}

/// Connect wallet
async fn connect_wallet(
    _config: Config,
    _wallet_type: &str,
    _private_key: Option<&str>,
    _mnemonic: Option<&str>,
    _derivation_path: Option<&str>,
) -> Result<()> {
    // TODO: Implement wallet connection
    println!("Wallet connection not implemented yet");
    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    // Parse command line arguments
    let cli = Cli::parse();

    // Load or create configuration
    let config = load_or_create_config(cli.config, &cli.network)?;

    // Execute command
    match cli.command {
        Commands::Daemon { listen } => {
            start_daemon(config, &listen).await?;
        }
        Commands::CreateOrder {
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            expiry,
        } => {
            create_order(config, &base_asset, &quote_asset, &side, &amount, &price, expiry).await?;
        }
        Commands::CancelOrder { order_id } => {
            cancel_order(config, &order_id).await?;
        }
        Commands::TakeOrder { order_id, amount } => {
            take_order(config, &order_id, &amount).await?;
        }
        Commands::ListOrders {
            base_asset,
            quote_asset,
            side,
            status,
        } => {
            list_orders(config, base_asset.as_deref(), quote_asset.as_deref(), &side, &status).await?;
        }
        Commands::Market {
            base_asset,
            quote_asset,
        } => {
            get_market_data(config, &base_asset, &quote_asset).await?;
        }
        Commands::ConnectWallet {
            wallet_type,
            private_key,
            mnemonic,
            derivation_path,
        } => {
            connect_wallet(config, &wallet_type, private_key.as_deref(), mnemonic.as_deref(), derivation_path.as_deref()).await?;
        }
    }

    Ok(())
}