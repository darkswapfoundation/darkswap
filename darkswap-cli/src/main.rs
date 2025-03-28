//! DarkSwap CLI
//!
//! This is the command-line interface for DarkSwap, a decentralized peer-to-peer
//! trading platform for Bitcoin, runes, and alkanes.

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use darkswap_sdk::{
    config::{BitcoinNetwork, Config},
    types::{Asset, AlkaneId},
    orderbook::{Order, OrderId, OrderSide, OrderStatus},
    DarkSwap, types::Event,
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
        let id_num = id.parse::<u128>().map_err(|_| anyhow::anyhow!("Invalid rune ID: {}", id))?;
        Ok(Asset::Rune(id_num))
    } else if asset_str.starts_with("ALKANE:") {
        let id = asset_str.strip_prefix("ALKANE:").unwrap();
        let alkane_id = AlkaneId(format!("ALKANE:{}", id));
        Ok(Asset::Alkane(alkane_id))
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
    use colored::*;
    use indicatif::{ProgressBar, ProgressStyle};
    use std::time::Duration;

    println!("{}", "Starting DarkSwap daemon...".green().bold());
    println!("  Listen address: {}", listen_addr.cyan());
    println!("  Network: {}", config.bitcoin.network.to_string().cyan());

    // Show a spinner while starting
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_strings(&["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"])
            .template("{spinner:.blue} {msg}")
            .unwrap(),
    );
    spinner.set_message("Initializing DarkSwap...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    spinner.set_message("Connecting to P2P network...");

    // Start DarkSwap
    darkswap.start().await?;

    // Stop the spinner and show success message
    spinner.finish_with_message("DarkSwap daemon started successfully!".green().to_string());

    // Print daemon info
    println!("\n{}", "Daemon Information:".bold());
    println!("  Status:       {}", "Running".green());
    println!("  Listen Addr:  {}", listen_addr);
    println!("  Peer ID:      {}", darkswap.network.as_ref().map_or("Unknown".to_string(), |n| {
        let network = n.read().now_or_never().unwrap();
        network.local_peer_id().to_string()
    }).cyan());
    println!("  Press Ctrl+C to stop the daemon");

    // Create a channel for shutdown signal
    let (shutdown_sender, mut shutdown_receiver) = mpsc::channel::<()>(1);

    // Handle Ctrl+C
    let shutdown_sender_clone = shutdown_sender.clone();
    tokio::spawn(async move {
        signal::ctrl_c().await.expect("Failed to listen for Ctrl+C");
        println!("\n{}", "Received Ctrl+C, shutting down...".yellow().bold());
        let _ = shutdown_sender_clone.send(()).await;
    });

    // Create a table for events
    use prettytable::{format, Table, row, cell};
    let mut event_table = Table::new();
    event_table.set_format(*format::consts::FORMAT_NO_BORDER_LINE_SEPARATOR);
    event_table.add_row(row![
        "Time".bold(),
        "Event Type".bold(),
        "Details".bold()
    ]);

    println!("\n{}", "Event Log:".bold());
    event_table.printstd();

    // Process events
    loop {
        tokio::select! {
            event = darkswap.next_event() => {
                if let Some(event) = event {
                    // Get current time
                    let now = chrono::Local::now().format("%H:%M:%S").to_string();
                    
                    // Create a new table for this event
                    let mut table = Table::new();
                    table.set_format(*format::consts::FORMAT_NO_BORDER_LINE_SEPARATOR);
                    
                    match event {
                        Event::Network(network_event) => {
                            table.add_row(row![
                                now,
                                "Network".blue(),
                                format!("{:?}", network_event)
                            ]);
                        }
                        Event::OrderCreated(order) => {
                            let side_str = match order.side {
                                OrderSide::Buy => "BUY".green(),
                                OrderSide::Sell => "SELL".red(),
                            };
                            
                            table.add_row(row![
                                now,
                                "Order Created".green(),
                                format!("{} | {} {} {} @ {}",
                                    order.id.to_string().cyan(),
                                    side_str,
                                    order.amount.to_string(),
                                    order.base_asset.to_string(),
                                    order.price.to_string()
                                )
                            ]);
                        }
                        Event::OrderCanceled(order_id) => {
                            table.add_row(row![
                                now,
                                "Order Canceled".yellow(),
                                order_id.to_string().cyan()
                            ]);
                        }
                        Event::OrderFilled(order_id) => {
                            table.add_row(row![
                                now,
                                "Order Filled".green(),
                                order_id.to_string().cyan()
                            ]);
                        }
                        Event::TradeStarted(trade) => {
                            table.add_row(row![
                                now,
                                "Trade Started".blue(),
                                format!("Trade: {} | Order: {}",
                                    trade.id.to_string().cyan(),
                                    trade.order_id.to_string().cyan()
                                )
                            ]);
                        }
                        Event::TradeCompleted(trade) => {
                            table.add_row(row![
                                now,
                                "Trade Completed".green(),
                                format!("Trade: {} | Order: {} | Amount: {} {}",
                                    trade.id.to_string().cyan(),
                                    trade.order_id.to_string().cyan(),
                                    trade.amount.to_string(),
                                    trade.base_asset.to_string()
                                )
                            ]);
                        }
                        Event::TradeFailed(trade) => {
                            table.add_row(row![
                                now,
                                "Trade Failed".red(),
                                format!("Trade: {} | Order: {}",
                                    trade.id.to_string().cyan(),
                                    trade.order_id.to_string().cyan()
                                )
                            ]);
                        }
                    }
                    
                    // Print the table
                    table.printstd();
                }
            }
            _ = shutdown_receiver.recv() => {
                // Show a spinner while shutting down
                let spinner = ProgressBar::new_spinner();
                spinner.set_style(
                    ProgressStyle::default_spinner()
                        .tick_strings(&["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"])
                        .template("{spinner:.blue} {msg}")
                        .unwrap(),
                );
                spinner.set_message("Shutting down DarkSwap daemon...");
                spinner.enable_steady_tick(Duration::from_millis(100));
                
                darkswap.stop().await?;
                
                spinner.finish_with_message("DarkSwap daemon stopped successfully!".green().to_string());
                break;
            }
        }
    }

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
    use colored::*;
    use indicatif::{ProgressBar, ProgressStyle};

    // Parse parameters
    let base_asset = parse_asset(base_asset_str)?;
    let quote_asset = parse_asset(quote_asset_str)?;
    let side = parse_order_side(side_str)?;
    let amount = Decimal::from_str(amount_str).context("Invalid amount")?;
    let price = Decimal::from_str(price_str).context("Invalid price")?;

    println!("{}", "Creating order...".green().bold());
    println!("  {} {} {} at {} {}",
        match side {
            OrderSide::Buy => "Buying".green(),
            OrderSide::Sell => "Selling".red(),
        },
        amount.to_string().cyan(),
        base_asset.to_string().cyan(),
        price.to_string().cyan(),
        quote_asset.to_string().cyan()
    );

    // Show a spinner while connecting
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_strings(&["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"])
            .template("{spinner:.blue} {msg}")
            .unwrap(),
    );
    spinner.set_message("Connecting to DarkSwap network...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    spinner.set_message("Creating order...");

    // Create order
    let order = darkswap.create_order(base_asset, quote_asset, side, amount, price, expiry).await?;

    // Stop the spinner
    spinner.finish_with_message("Order created successfully!".green().to_string());

    // Print order details
    println!("\n{}", "Order Details:".bold());
    println!("  ID:     {}", order.id.to_string().green());
    println!("  Side:   {}", match order.side {
        OrderSide::Buy => "BUY".green(),
        OrderSide::Sell => "SELL".red(),
    });
    println!("  Amount: {} {}", order.amount.to_string().cyan(), order.base_asset);
    println!("  Price:  {} {}", order.price.to_string().cyan(), order.quote_asset);
    println!("  Status: {}", "OPEN".green());
    
    // Calculate total value
    let total_value = order.amount * order.price;
    println!("  Total:  {} {}", total_value.to_string().cyan(), order.quote_asset);

    // Stop DarkSwap
    spinner.set_message("Disconnecting from DarkSwap network...");
    darkswap.stop().await?;
    spinner.finish_and_clear();

    Ok(())
}

/// Cancel an order
async fn cancel_order(config: Config, order_id_str: &str) -> Result<()> {
    use colored::*;
    use indicatif::{ProgressBar, ProgressStyle};

    // Parse parameters
    let order_id = OrderId(order_id_str.to_string());

    println!("{}", "Canceling order...".yellow().bold());
    println!("  Order ID: {}", order_id.to_string().cyan());

    // Show a spinner while connecting
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_strings(&["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"])
            .template("{spinner:.blue} {msg}")
            .unwrap(),
    );
    spinner.set_message("Connecting to DarkSwap network...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    spinner.set_message("Canceling order...");

    // Cancel order
    darkswap.cancel_order(&order_id).await?;

    // Stop the spinner
    spinner.finish_with_message("Order canceled successfully!".green().to_string());

    // Stop DarkSwap
    spinner.set_message("Disconnecting from DarkSwap network...");
    darkswap.stop().await?;
    spinner.finish_and_clear();

    Ok(())
}

/// Take an order
async fn take_order(config: Config, order_id_str: &str, amount_str: &str) -> Result<()> {
    use colored::*;
    use indicatif::{ProgressBar, ProgressStyle};

    // Parse parameters
    let order_id = OrderId(order_id_str.to_string());
    let amount = Decimal::from_str(amount_str).context("Invalid amount")?;

    println!("{}", "Taking order...".green().bold());
    println!("  Order ID: {}", order_id.to_string().cyan());
    println!("  Amount:   {}", amount.to_string().cyan());

    // Show a spinner while connecting
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_strings(&["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"])
            .template("{spinner:.blue} {msg}")
            .unwrap(),
    );
    spinner.set_message("Connecting to DarkSwap network...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    spinner.set_message("Taking order...");

    // Take order
    let trade = darkswap.take_order(&order_id, amount).await?;

    // Stop the spinner
    spinner.finish_with_message("Order taken successfully!".green().to_string());

    // Print trade details
    println!("\n{}", "Trade Details:".bold());
    println!("  Trade ID:  {}", trade.id.to_string().green());
    println!("  Order ID:  {}", trade.order_id.to_string().cyan());
    println!("  Amount:    {} {}", trade.amount.to_string().cyan(), trade.base_asset);
    println!("  Price:     {} {}", trade.price.to_string().cyan(), trade.quote_asset);
    println!("  Status:    {}", "PENDING".yellow());
    
    // Calculate total value
    let total_value = trade.amount * trade.price;
    println!("  Total:     {} {}", total_value.to_string().cyan(), trade.quote_asset);

    // Stop DarkSwap
    spinner.set_message("Disconnecting from DarkSwap network...");
    darkswap.stop().await?;
    spinner.finish_and_clear();

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
    use colored::*;
    use prettytable::{format, Table, row, cell};

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    // Get orders
    let orders = if let (Some(base_asset_str), Some(quote_asset_str)) = (base_asset_str, quote_asset_str) {
        let base_asset = parse_asset(base_asset_str)?;
        let quote_asset = parse_asset(quote_asset_str)?;
        println!("Fetching orders for {}/{} pair...", base_asset.to_string().cyan(), quote_asset.to_string().cyan());
        darkswap.get_orders(&base_asset, &quote_asset).await?
    } else {
        println!("Fetching all orders...");
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

    // Create a table for orders
    let mut table = Table::new();
    table.set_format(*format::consts::FORMAT_NO_BORDER_LINE_SEPARATOR);
    
    // Add header row
    table.add_row(row![
        "ID".bold(),
        "Side".bold(),
        "Amount".bold(),
        "Asset".bold(),
        "Price".bold(),
        "Status".bold(),
        "Created".bold()
    ]);

    // Add order rows
    for order in filtered_orders {
        let side_str = match order.side {
            OrderSide::Buy => "BUY".green(),
            OrderSide::Sell => "SELL".red(),
        };
        
        let status_str = match order.status {
            OrderStatus::Open => "OPEN".green(),
            OrderStatus::Filled => "FILLED".blue(),
            OrderStatus::Canceled => "CANCELED".yellow(),
            OrderStatus::Expired => "EXPIRED".red(),
        };
        
        // Format timestamp as date/time
        let timestamp = chrono::NaiveDateTime::from_timestamp_opt(order.timestamp as i64, 0)
            .unwrap_or_default()
            .format("%Y-%m-%d %H:%M:%S")
            .to_string();
        
        table.add_row(row![
            order.id.to_string(),
            side_str,
            order.amount.to_string(),
            order.base_asset.to_string(),
            format!("{} {}", order.price, order.quote_asset),
            status_str,
            timestamp
        ]);
    }

    // Print the table
    if table.len() > 1 {
        table.printstd();
    } else {
        println!("{}", "No orders found matching the criteria.".yellow());
    }

    // Stop DarkSwap
    darkswap.stop().await?;

    Ok(())
}

/// Get market data
async fn get_market_data(config: Config, base_asset_str: &str, quote_asset_str: &str) -> Result<()> {
    use colored::*;
    use prettytable::{format, Table, row, cell};

    // Parse parameters
    let base_asset = parse_asset(base_asset_str)?;
    let quote_asset = parse_asset(quote_asset_str)?;

    println!("Fetching market data for {}/{} pair...", base_asset.to_string().cyan(), quote_asset.to_string().cyan());

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    // Get best bid and ask
    let (bid, ask) = darkswap.get_best_bid_ask(&base_asset, &quote_asset).await?;

    // Create a table for market data
    let mut table = Table::new();
    table.set_format(*format::consts::FORMAT_NO_BORDER_LINE_SEPARATOR);
    
    // Add header
    table.add_row(row![
        format!("Market Data for {}/{}", base_asset.to_string().cyan(), quote_asset.to_string().cyan()).bold()
    ]);
    
    // Add bid and ask
    table.add_row(row![
        "Best Bid",
        bid.map_or("None".yellow().to_string(), |b| format!("{}", b.to_string().green()))
    ]);
    
    table.add_row(row![
        "Best Ask",
        ask.map_or("None".yellow().to_string(), |a| format!("{}", a.to_string().red()))
    ]);
    
    // Add spread
    let spread = match (bid, ask) {
        (Some(bid), Some(ask)) => {
            let spread = ask - bid;
            let spread_pct = (spread / bid) * Decimal::from(100);
            format!("{} ({:.2}%)", spread, spread_pct)
        },
        _ => "N/A".to_string(),
    };
    
    table.add_row(row![
        "Spread",
        spread.blue()
    ]);
    
    // Print the table
    table.printstd();

    // Get recent trades (if available)
    // This is a placeholder for future implementation
    println!("\n{}", "Recent Trades".bold());
    println!("{}", "No recent trades available.".yellow());

    // Stop DarkSwap
    darkswap.stop().await?;

    Ok(())
}

/// Connect wallet
async fn connect_wallet(
    mut config: Config,
    wallet_type: &str,
    private_key: Option<&str>,
    mnemonic: Option<&str>,
    derivation_path: Option<&str>,
) -> Result<()> {
    use colored::*;
    use dialoguer::{Input, Password, Select};
    use std::fs::File;
    use std::io::Write;
    use std::path::Path;

    println!("{}", "Connecting wallet...".green().bold());

    // Determine wallet type
    let wallet_type = match wallet_type.to_lowercase().as_str() {
        "simple" => "simple",
        "bdk" => "bdk",
        "external" => "external",
        _ => {
            let options = vec!["Simple (in-memory wallet)", "BDK (Bitcoin Development Kit)", "External (hardware wallet)"];
            let selection = Select::new()
                .with_prompt("Select wallet type")
                .items(&options)
                .default(0)
                .interact()?;
            
            match selection {
                0 => "simple",
                1 => "bdk",
                2 => "external",
                _ => unreachable!(),
            }
        }
    };

    println!("Selected wallet type: {}", wallet_type.green());

    // Handle wallet connection based on type
    match wallet_type {
        "simple" => {
            // For simple wallet, we need a private key or mnemonic
            let private_key = if let Some(key) = private_key {
                key.to_string()
            } else if let Some(mnemonic) = mnemonic {
                // Convert mnemonic to private key (simplified for now)
                format!("derived_from_mnemonic_{}", mnemonic)
            } else {
                // Ask for private key or mnemonic
                let input_type = Select::new()
                    .with_prompt("Select input type")
                    .items(&["Private Key", "Mnemonic"])
                    .default(0)
                    .interact()?;
                
                if input_type == 0 {
                    // Ask for private key
                    Password::new()
                        .with_prompt("Enter private key")
                        .interact()?
                } else {
                    // Ask for mnemonic
                    let mnemonic = Password::new()
                        .with_prompt("Enter mnemonic")
                        .interact()?;
                    
                    // Convert mnemonic to private key (simplified for now)
                    format!("derived_from_mnemonic_{}", mnemonic)
                }
            };

            // Update config with wallet information
            config.wallet.wallet_type = "simple".to_string();
            config.wallet.private_key = Some(private_key);
            
            println!("{}", "Simple wallet connected successfully!".green().bold());
        }
        "bdk" => {
            // For BDK wallet, we need a mnemonic and derivation path
            let mnemonic = if let Some(m) = mnemonic {
                m.to_string()
            } else {
                // Ask for mnemonic
                Password::new()
                    .with_prompt("Enter mnemonic")
                    .interact()?
            };
            
            let derivation_path = if let Some(path) = derivation_path {
                path.to_string()
            } else {
                // Ask for derivation path or use default
                Input::<String>::new()
                    .with_prompt("Enter derivation path")
                    .default("m/84'/0'/0'/0/0".to_string())
                    .interact()?
            };
            
            // Update config with wallet information
            config.wallet.wallet_type = "bdk".to_string();
            config.wallet.mnemonic = Some(mnemonic);
            config.wallet.derivation_path = Some(derivation_path);
            
            println!("{}", "BDK wallet connected successfully!".green().bold());
        }
        "external" => {
            println!("{}", "External wallet support is not yet implemented.".yellow().bold());
            println!("This will allow connection to hardware wallets and other external wallet providers.");
            return Ok(());
        }
        _ => {
            anyhow::bail!("Invalid wallet type: {}", wallet_type);
        }
    }
    
    // Save the updated configuration
    if let Some(path) = config.config_path.as_ref() {
        config.to_file(path)?;
        println!("Wallet configuration saved to {}", path.display().to_string().blue());
    } else {
        // If no config path is set, ask the user if they want to save the configuration
        let save = dialoguer::Confirm::new()
            .with_prompt("Do you want to save the wallet configuration?")
            .default(true)
            .interact()?;
        
        if save {
            let home_dir = dirs::home_dir().ok_or_else(|| anyhow::anyhow!("Could not determine home directory"))?;
            let config_dir = home_dir.join(".darkswap");
            
            // Create config directory if it doesn't exist
            if !config_dir.exists() {
                std::fs::create_dir_all(&config_dir)?;
            }
            
            let config_path = config_dir.join("config.json");
            config.to_file(&config_path)?;
            println!("Wallet configuration saved to {}", config_path.display().to_string().blue());
        }
    }
    
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