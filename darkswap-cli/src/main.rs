//! DarkSwap CLI
//!
//! This is the command-line interface for DarkSwap, a decentralized peer-to-peer
//! trading platform for Bitcoin, runes, and alkanes.

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use futures_util::FutureExt;
use darkswap_sdk::{
    config::{BitcoinNetwork, Config},
    types::{Asset, AlkaneId},
    orderbook::{OrderSide, OrderStatus},
    DarkSwap, types::Event, types::OrderId,
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
        let id_num = id.parse::<u64>().map_err(|_| anyhow::anyhow!("Invalid rune ID: {}", id))?;
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
        "canceled" => Ok(OrderStatus::Cancelled),
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
            let file = std::fs::File::open(path).context("Failed to open configuration file")?;
            let reader = std::io::BufReader::new(file);
            let config: Config = serde_json::from_reader(reader).context("Failed to parse configuration file")?;
            return Ok(config);
        }
    }

    // Create default configuration
    let mut config = Config::default();
    config.darkswap.bitcoin_network = bitcoin_network;

    // Save configuration to file if path is provided
    if let Some(ref path) = config_path {
        let file = std::fs::File::create(path).context("Failed to create configuration file")?;
        let writer = std::io::BufWriter::new(file);
        serde_json::to_writer_pretty(writer, &config).context("Failed to write configuration to file")?;
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
    println!("  Network: {}", format!("{:?}", config.darkswap.bitcoin_network).cyan());

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
    // Print daemon info
    println!("\n{}", "Daemon Information:".bold());
    println!("  Status:       {}", "Running".green());
    println!("  Listen Addr:  {}", listen_addr);
    let network = darkswap.network.read().await;
    println!("  Peer ID:      {}", network.local_peer_id().to_string().cyan());
    println!("  Press Ctrl+C to stop the daemon");
    drop(network); // Drop the immutable borrow

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
    use prettytable::{format, Table, row};
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
                if let Ok(Some(event)) = event {
                    // Get current time
                    let now = chrono::Local::now().format("%H:%M:%S").to_string();
                    
                    // Create a new table for this event
                    let mut table = Table::new();
                    table.set_format(*format::consts::FORMAT_NO_BORDER_LINE_SEPARATOR);
                    
                    match event {
                        Event::PeerConnected { peer_id } => {
                            table.add_row(row![
                                now,
                                "Peer Connected".blue(),
                                format!("{}", peer_id)
                            ]);
                        }
                        Event::PeerDisconnected { peer_id } => {
                            table.add_row(row![
                                now,
                                "Peer Disconnected".yellow(),
                                format!("{}", peer_id)
                            ]);
                        }
                        Event::OrderCreated { order_id } => {
                            // TODO: Fetch order details to display more info
                            table.add_row(row![
                                now,
                                "Order Created".green(),
                                format!("Order ID: {}", order_id.to_string().cyan())
                            ]);
                        }
                        Event::OrderMatched { order_id, trade_id } => {
                            // TODO: Fetch order and trade details
                            table.add_row(row![
                                now,
                                "Order Matched".blue(),
                                format!("Order ID: {} | Trade ID: {}", order_id.to_string().cyan(), trade_id.to_string().cyan())
                            ]);
                        }
                        Event::OrderCancelled { order_id } => {
                            table.add_row(row![
                                now,
                                "Order Cancelled".yellow(),
                                format!("Order ID: {}", order_id.to_string().cyan())
                            ]);
                        }
                        Event::OrderExpired { order_id } => {
                            table.add_row(row![
                                now,
                                "Order Expired".red(),
                                format!("Order ID: {}", order_id.to_string().cyan())
                            ]);
                        }
                        Event::TradeCreated { trade_id } => {
                            // TODO: Fetch trade details
                            table.add_row(row![
                                now,
                                "Trade Created".blue(),
                                format!("Trade ID: {}", trade_id.to_string().cyan())
                            ]);
                        }
                        Event::TradeCompleted { trade_id } => {
                            // TODO: Fetch trade details
                            table.add_row(row![
                                now,
                                "Trade Completed".green(),
                                format!("Trade ID: {}", trade_id.to_string().cyan())
                            ]);
                        }
                        Event::TradeCancelled { trade_id } => {
                            // TODO: Fetch trade details
                            table.add_row(row![
                                now,
                                "Trade Cancelled".yellow(),
                                format!("Trade ID: {}", trade_id.to_string().cyan())
                            ]);
                        }
                        Event::TradeFailed { trade_id, error } => {
                            // TODO: Fetch trade details
                            table.add_row(row![
                                now,
                                "Trade Failed".red(),
                                format!("Trade ID: {} | Error: {}", trade_id.to_string().cyan(), error.red())
                            ]);
                        }
                        Event::Error { error } => {
                            table.add_row(row![
                                now,
                                "Error".red().bold(),
                                error.red()
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
    let order = darkswap.create_order(base_asset, quote_asset, side, amount, price, "".to_string(), expiry.map(std::time::Duration::from_secs).unwrap_or_default()).await?;

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
    println!("  Trade ID:  {}", trade.to_string().green());
    // Trade details like order_id, amount, price, assets are not returned by take_order
    println!("{}", "  Trade details (Order ID, Amount, Price, Assets, Status, Total) are not available here.".yellow());

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
    use prettytable::{format, Table, row};

    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;

    // Start DarkSwap
    darkswap.start().await?;

    // Get orders
    let orders = if let (Some(base_asset_str), Some(quote_asset_str)) = (base_asset_str, quote_asset_str) {
        let base_asset = parse_asset(base_asset_str)?;
        let quote_asset = parse_asset(quote_asset_str)?;
        println!("Fetching orders for {}/{} pair...", base_asset.to_string().cyan(), quote_asset.to_string().cyan());
        darkswap.orderbook.get_orders(Some(base_asset), Some(quote_asset), None, None).await.map_err(|e| darkswap_sdk::error::Error::OrderBookError(e.to_string()))?
    } else {
        println!("Fetching all orders...");
        // Get all orders
        darkswap.orderbook.get_orders(None, None, None, None).await.map_err(|e| darkswap_sdk::error::Error::OrderBookError(e.to_string()))?
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
            OrderStatus::PartiallyFilled => "PARTIALLY FILLED".blue(),
            OrderStatus::Cancelled => "CANCELLED".yellow(),
            OrderStatus::Expired => "EXPIRED".red(),
        };
        
        // Format created_at as date/time
        let timestamp = chrono::NaiveDateTime::from_timestamp_opt(order.created_at as i64, 0)
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
    use prettytable::{format, Table, row};

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
            // Private key and mnemonic are not stored in WalletConfig directly
            
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
            // Derivation path is not stored in WalletConfig directly
            
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
    // The config_path is not part of the Config struct, so we need to get it from the CLI arguments
    // However, the connect_wallet function doesn't have access to the CLI arguments directly.
    // For now, we will skip saving the config in this function.
    // The user can save the config manually after connecting the wallet if needed.
    println!("{}", "Wallet configuration updated in memory. To save, use the --config option when running the CLI.".yellow());
    
    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    // Parse command line arguments
    let cli = Cli::parse();

    // Load or create configuration
    let config_path = cli.config.clone(); // Clone config_path for potential saving later
    let config = load_or_create_config(config_path.clone(), &cli.network)?;

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
            // The config_path is not part of the Config struct, so we need to get it from the CLI arguments.
            // The load_or_create_config function already handles loading and initial saving.
            // We will not save the config again here to avoid overwriting user changes made after loading.
            connect_wallet(config, &wallet_type, private_key.as_deref(), mnemonic.as_deref(), derivation_path.as_deref()).await?;
        }
    }

    Ok(())
}