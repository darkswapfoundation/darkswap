//! Price feed integration for DarkSwap Bridge
//!
//! This module provides integration with external price feed services
//! to get real-time price data for cryptocurrencies.

use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::collections::HashMap;
use std::error::Error;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::time;
use log::{debug, error, info, warn};

/// Price feed provider
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PriceFeedProvider {
    /// CoinGecko API
    CoinGecko,
    /// CoinMarketCap API
    CoinMarketCap,
    /// Binance API
    Binance,
    /// Custom API
    Custom,
}

/// Price data for a single asset
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceData {
    /// Asset symbol (e.g., "BTC")
    pub symbol: String,
    /// Price in USD
    pub price_usd: f64,
    /// Price change percentage in 24h
    pub price_change_24h: f64,
    /// Market cap in USD
    pub market_cap_usd: f64,
    /// 24h trading volume in USD
    pub volume_24h_usd: f64,
    /// Last updated timestamp
    pub last_updated: u64,
}

/// Price feed configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceFeedConfig {
    /// Provider to use
    pub provider: PriceFeedProvider,
    /// API key (if required)
    pub api_key: Option<String>,
    /// API URL (for custom provider)
    pub api_url: Option<String>,
    /// Update interval in seconds
    pub update_interval: u64,
    /// Assets to track
    pub assets: Vec<String>,
}

impl Default for PriceFeedConfig {
    fn default() -> Self {
        Self {
            provider: PriceFeedProvider::CoinGecko,
            api_key: None,
            api_url: None,
            update_interval: 60,
            assets: vec!["BTC".to_string(), "RUNE".to_string()],
        }
    }
}

/// Price feed service
pub struct PriceFeedService {
    /// HTTP client
    client: Client,
    /// Configuration
    config: PriceFeedConfig,
    /// Cache of price data
    cache: Arc<Mutex<HashMap<String, PriceData>>>,
    /// Last update time
    last_update: Arc<Mutex<Instant>>,
}

impl PriceFeedService {
    /// Create a new price feed service
    pub fn new(config: PriceFeedConfig) -> Self {
        Self {
            client: Client::new(),
            config,
            cache: Arc::new(Mutex::new(HashMap::new())),
            last_update: Arc::new(Mutex::new(Instant::now())),
        }
    }

    /// Start the price feed service
    pub async fn start(&self) -> Result<(), Box<dyn Error>> {
        info!("Starting price feed service with provider: {:?}", self.config.provider);
        
        // Initial update
        self.update_prices().await?;
        
        // Start update loop
        let config = self.config.clone();
        let cache = self.cache.clone();
        let last_update = self.last_update.clone();
        let client = self.client.clone();
        
        tokio::spawn(async move {
            let mut interval = time::interval(Duration::from_secs(config.update_interval));
            
            loop {
                interval.tick().await;
                
                match update_prices_internal(&client, &config).await {
                    Ok(prices) => {
                        let mut cache_lock = cache.lock().unwrap();
                        *cache_lock = prices;
                        
                        let mut last_update_lock = last_update.lock().unwrap();
                        *last_update_lock = Instant::now();
                        
                        debug!("Updated price feed cache with {} assets", cache_lock.len());
                    }
                    Err(e) => {
                        error!("Failed to update price feed: {}", e);
                    }
                }
            }
        });
        
        Ok(())
    }

    /// Update prices immediately
    pub async fn update_prices(&self) -> Result<(), Box<dyn Error>> {
        let prices = update_prices_internal(&self.client, &self.config).await?;
        
        let mut cache_lock = self.cache.lock().unwrap();
        *cache_lock = prices;
        
        let mut last_update_lock = self.last_update.lock().unwrap();
        *last_update_lock = Instant::now();
        
        Ok(())
    }

    /// Get price data for an asset
    pub fn get_price(&self, symbol: &str) -> Option<PriceData> {
        let cache_lock = self.cache.lock().unwrap();
        cache_lock.get(symbol).cloned()
    }

    /// Get all price data
    pub fn get_all_prices(&self) -> HashMap<String, PriceData> {
        let cache_lock = self.cache.lock().unwrap();
        cache_lock.clone()
    }

    /// Get time since last update
    pub fn time_since_update(&self) -> Duration {
        let last_update_lock = self.last_update.lock().unwrap();
        last_update_lock.elapsed()
    }
}

/// Update prices from the configured provider
async fn update_prices_internal(client: &Client, config: &PriceFeedConfig) -> Result<HashMap<String, PriceData>, Box<dyn Error>> {
    match config.provider {
        PriceFeedProvider::CoinGecko => update_prices_coingecko(client, config).await,
        PriceFeedProvider::CoinMarketCap => update_prices_coinmarketcap(client, config).await,
        PriceFeedProvider::Binance => update_prices_binance(client, config).await,
        PriceFeedProvider::Custom => update_prices_custom(client, config).await,
    }
}

/// Update prices from CoinGecko
async fn update_prices_coingecko(client: &Client, config: &PriceFeedConfig) -> Result<HashMap<String, PriceData>, Box<dyn Error>> {
    let mut result = HashMap::new();
    
    // Convert asset symbols to CoinGecko IDs
    let asset_ids = config.assets.iter()
        .map(|symbol| match symbol.as_str() {
            "BTC" => "bitcoin",
            "ETH" => "ethereum",
            "RUNE" => "thorchain",
            _ => symbol.to_lowercase().as_str(),
        })
        .collect::<Vec<&str>>()
        .join(",");
    
    // Build URL
    let url = format!(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids={}&order=market_cap_desc&per_page=100&page=1&sparkline=false",
        asset_ids
    );
    
    // Make request
    let response = client.get(&url).send().await?;
    
    // Check status
    if !response.status().is_success() {
        return Err(format!("CoinGecko API returned error: {}", response.status()).into());
    }
    
    // Parse response
    let data: Vec<CoinGeckoResponse> = response.json().await?;
    
    // Convert to PriceData
    for item in data {
        let symbol = item.symbol.to_uppercase();
        
        result.insert(symbol.clone(), PriceData {
            symbol,
            price_usd: item.current_price,
            price_change_24h: item.price_change_percentage_24h.unwrap_or(0.0),
            market_cap_usd: item.market_cap,
            volume_24h_usd: item.total_volume,
            last_updated: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        });
    }
    
    Ok(result)
}

/// Update prices from CoinMarketCap
async fn update_prices_coinmarketcap(client: &Client, config: &PriceFeedConfig) -> Result<HashMap<String, PriceData>, Box<dyn Error>> {
    let mut result = HashMap::new();
    
    // Check if API key is provided
    let api_key = config.api_key.as_ref()
        .ok_or("CoinMarketCap API key is required")?;
    
    // Convert asset symbols to a comma-separated string
    let symbols = config.assets.join(",");
    
    // Build URL
    let url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";
    
    // Make request
    let response = client.get(url)
        .header("X-CMC_PRO_API_KEY", api_key)
        .query(&[("symbol", symbols)])
        .send()
        .await?;
    
    // Check status
    if !response.status().is_success() {
        return Err(format!("CoinMarketCap API returned error: {}", response.status()).into());
    }
    
    // Parse response
    let data: CoinMarketCapResponse = response.json().await?;
    
    // Convert to PriceData
    for (symbol, item) in data.data {
        result.insert(symbol.clone(), PriceData {
            symbol,
            price_usd: item.quote.usd.price,
            price_change_24h: item.quote.usd.percent_change_24h,
            market_cap_usd: item.quote.usd.market_cap,
            volume_24h_usd: item.quote.usd.volume_24h,
            last_updated: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        });
    }
    
    Ok(result)
}

/// Update prices from Binance
async fn update_prices_binance(client: &Client, config: &PriceFeedConfig) -> Result<HashMap<String, PriceData>, Box<dyn Error>> {
    let mut result = HashMap::new();
    
    // Make request for ticker prices
    let url = "https://api.binance.com/api/v3/ticker/24hr";
    let response = client.get(url).send().await?;
    
    // Check status
    if !response.status().is_success() {
        return Err(format!("Binance API returned error: {}", response.status()).into());
    }
    
    // Parse response
    let data: Vec<BinanceTickerResponse> = response.json().await?;
    
    // Convert to PriceData
    for item in data {
        // Extract base symbol from symbol pair (e.g., "BTCUSDT" -> "BTC")
        let symbol = if item.symbol.ends_with("USDT") {
            item.symbol.strip_suffix("USDT").unwrap()
        } else if item.symbol.ends_with("BUSD") {
            item.symbol.strip_suffix("BUSD").unwrap()
        } else {
            continue; // Skip non-USD pairs
        };
        
        // Check if this is an asset we're tracking
        if !config.assets.contains(&symbol.to_string()) {
            continue;
        }
        
        let price_usd = item.last_price.parse::<f64>().unwrap_or(0.0);
        let price_change_24h = item.price_change_percent.parse::<f64>().unwrap_or(0.0);
        let volume_24h_usd = item.quote_volume.parse::<f64>().unwrap_or(0.0);
        
        result.insert(symbol.to_string(), PriceData {
            symbol: symbol.to_string(),
            price_usd,
            price_change_24h,
            market_cap_usd: 0.0, // Binance doesn't provide market cap
            volume_24h_usd,
            last_updated: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        });
    }
    
    Ok(result)
}

/// Update prices from a custom API
async fn update_prices_custom(client: &Client, config: &PriceFeedConfig) -> Result<HashMap<String, PriceData>, Box<dyn Error>> {
    let mut result = HashMap::new();
    
    // Check if API URL is provided
    let api_url = config.api_url.as_ref()
        .ok_or("Custom API URL is required")?;
    
    // Make request
    let response = client.get(api_url).send().await?;
    
    // Check status
    if !response.status().is_success() {
        return Err(format!("Custom API returned error: {}", response.status()).into());
    }
    
    // Parse response as JSON
    let data: serde_json::Value = response.json().await?;
    
    // Extract price data based on the custom API format
    // This is just an example and should be adapted to the actual API format
    if let Some(prices) = data.get("prices").and_then(|p| p.as_object()) {
        for (symbol, price_data) in prices {
            if !config.assets.contains(&symbol.to_uppercase()) {
                continue;
            }
            
            let price_usd = price_data.get("price_usd")
                .and_then(|p| p.as_f64())
                .unwrap_or(0.0);
                
            let price_change_24h = price_data.get("price_change_24h")
                .and_then(|p| p.as_f64())
                .unwrap_or(0.0);
                
            let market_cap_usd = price_data.get("market_cap_usd")
                .and_then(|p| p.as_f64())
                .unwrap_or(0.0);
                
            let volume_24h_usd = price_data.get("volume_24h_usd")
                .and_then(|p| p.as_f64())
                .unwrap_or(0.0);
            
            result.insert(symbol.to_uppercase(), PriceData {
                symbol: symbol.to_uppercase(),
                price_usd,
                price_change_24h,
                market_cap_usd,
                volume_24h_usd,
                last_updated: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            });
        }
    }
    
    Ok(result)
}

/// CoinGecko API response format
#[derive(Debug, Deserialize)]
struct CoinGeckoResponse {
    id: String,
    symbol: String,
    name: String,
    current_price: f64,
    market_cap: f64,
    market_cap_rank: Option<u64>,
    total_volume: f64,
    price_change_24h: Option<f64>,
    price_change_percentage_24h: Option<f64>,
}

/// CoinMarketCap API response format
#[derive(Debug, Deserialize)]
struct CoinMarketCapResponse {
    data: HashMap<String, CoinMarketCapData>,
}

#[derive(Debug, Deserialize)]
struct CoinMarketCapData {
    id: u64,
    name: String,
    symbol: String,
    quote: CoinMarketCapQuote,
}

#[derive(Debug, Deserialize)]
struct CoinMarketCapQuote {
    usd: CoinMarketCapUsdData,
}

#[derive(Debug, Deserialize)]
struct CoinMarketCapUsdData {
    price: f64,
    volume_24h: f64,
    percent_change_24h: f64,
    market_cap: f64,
}

/// Binance API response format
#[derive(Debug, Deserialize)]
struct BinanceTickerResponse {
    symbol: String,
    #[serde(rename = "lastPrice")]
    last_price: String,
    #[serde(rename = "priceChangePercent")]
    price_change_percent: String,
    #[serde(rename = "quoteVolume")]
    quote_volume: String,
}