# DarkSwap SDK Tutorial: Building a Trading Bot

This tutorial will guide you through the process of building a simple trading bot using the DarkSwap SDK. The bot will monitor the market, make trading decisions based on predefined strategies, and execute trades automatically.

## Prerequisites

Before you begin, make sure you have:

- Node.js v16 or later installed
- npm v7 or later installed
- Basic knowledge of JavaScript/TypeScript
- A DarkSwap account (for authentication)
- Completed the [Basic Trading Tutorial](basic-trading.md)

## Installation

First, install the DarkSwap SDK and other required packages:

```bash
npm install @darkswap/sdk winston node-cron
```

or

```bash
yarn add @darkswap/sdk winston node-cron
```

We'll use:
- `@darkswap/sdk` for interacting with DarkSwap
- `winston` for logging
- `node-cron` for scheduling tasks

## Project Structure

Let's create a simple project structure:

```
trading-bot/
├── src/
│   ├── config.js
│   ├── logger.js
│   ├── strategies/
│   │   ├── index.js
│   │   ├── simple-market-making.js
│   │   └── trend-following.js
│   ├── utils.js
│   └── index.js
├── package.json
└── README.md
```

## Setting Up the Configuration

Create a file called `src/config.js` with the following content:

```javascript
module.exports = {
  // DarkSwap configuration
  darkswap: {
    network: 'testnet', // 'testnet' or 'mainnet'
    apiKey: process.env.DARKSWAP_API_KEY || '',
    email: process.env.DARKSWAP_EMAIL || '',
    password: process.env.DARKSWAP_PASSWORD || '',
  },
  
  // Trading configuration
  trading: {
    // Trading pairs to monitor
    pairs: [
      {
        baseAsset: 'BTC',
        quoteAsset: 'RUNE',
        strategy: 'simple-market-making',
        config: {
          spread: 0.02, // 2% spread
          quantity: 0.001, // 0.001 BTC per order
          maxOrders: 5, // Maximum number of orders per side
          minProfitPercent: 0.005, // 0.5% minimum profit
          updateInterval: 60000, // Update orders every 60 seconds
        },
      },
      {
        baseAsset: 'BTC',
        quoteAsset: 'ALKANE',
        strategy: 'trend-following',
        config: {
          shortPeriod: 5, // 5-minute moving average
          longPeriod: 15, // 15-minute moving average
          quantity: 0.001, // 0.001 BTC per order
          stopLossPercent: 0.02, // 2% stop loss
          takeProfitPercent: 0.05, // 5% take profit
          updateInterval: 300000, // Check trend every 5 minutes
        },
      },
    ],
    
    // Global trading limits
    limits: {
      maxExposure: {
        BTC: 0.01, // Maximum 0.01 BTC exposure
        RUNE: 1000, // Maximum 1000 RUNE exposure
        ALKANE: 500, // Maximum 500 ALKANE exposure
      },
      dailyLossLimit: 0.001, // Stop trading if daily loss exceeds 0.001 BTC
      dailyProfitTarget: 0.002, // Take a break if daily profit exceeds 0.002 BTC
    },
  },
  
  // Bot configuration
  bot: {
    name: 'DarkSwap Trading Bot',
    version: '1.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
    dataDir: process.env.DATA_DIR || './data',
    healthCheckInterval: 300000, // Check bot health every 5 minutes
    restartOnFailure: true,
  },
};
```

## Setting Up Logging

Create a file called `src/logger.js` with the following content:

```javascript
const winston = require('winston');
const config = require('./config');
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
if (!fs.existsSync(config.bot.dataDir)) {
  fs.mkdirSync(config.bot.dataDir, { recursive: true });
}

// Create logger
const logger = winston.createLogger({
  level: config.bot.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: config.bot.name },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File transport
    new winston.transports.File({
      filename: path.join(config.bot.dataDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(config.bot.dataDir, 'combined.log'),
    }),
  ],
});

module.exports = logger;
```

## Creating Utility Functions

Create a file called `src/utils.js` with the following content:

```javascript
const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Calculate the moving average of an array of prices
 * @param {Array<number>} prices - Array of prices
 * @param {number} period - Period for the moving average
 * @returns {number} - The moving average
 */
function calculateMA(prices, period) {
  if (prices.length < period) {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }
  
  const slice = prices.slice(prices.length - period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

/**
 * Save data to a JSON file
 * @param {string} filename - The filename
 * @param {any} data - The data to save
 */
function saveData(filename, data) {
  const filePath = path.join(config.bot.dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Load data from a JSON file
 * @param {string} filename - The filename
 * @param {any} defaultData - Default data if file doesn't exist
 * @returns {any} - The loaded data
 */
function loadData(filename, defaultData = {}) {
  const filePath = path.join(config.bot.dataDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return defaultData;
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return defaultData;
  }
}

/**
 * Calculate the profit/loss of a trade
 * @param {Object} trade - The trade object
 * @returns {number} - The profit/loss in the quote asset
 */
function calculatePnL(trade) {
  if (trade.side === 'buy') {
    // For a buy trade, we spend the quote asset to get the base asset
    return -parseFloat(trade.price) * parseFloat(trade.amount);
  } else {
    // For a sell trade, we get the quote asset by selling the base asset
    return parseFloat(trade.price) * parseFloat(trade.amount);
  }
}

/**
 * Format a number with a specific number of decimal places
 * @param {number} num - The number to format
 * @param {number} decimals - The number of decimal places
 * @returns {string} - The formatted number
 */
function formatNumber(num, decimals = 8) {
  return num.toFixed(decimals);
}

module.exports = {
  calculateMA,
  saveData,
  loadData,
  calculatePnL,
  formatNumber,
};
```

## Implementing Trading Strategies

For brevity, we'll focus on implementing a simple market making strategy. In a real-world scenario, you would implement multiple strategies.

Create a file called `src/strategies/simple-market-making.js` with the following content:

```javascript
/**
 * Simple Market Making Strategy
 * 
 * This strategy places buy and sell orders around the current market price
 * with a specified spread. It continuously updates the orders to maintain
 * the spread as the market price changes.
 */
class SimpleMarketMaking {
  /**
   * Constructor
   * @param {Object} config - The strategy configuration
   * @param {Object} darkswap - The DarkSwap SDK instance
   * @param {Object} logger - The logger instance
   */
  constructor(config, darkswap, logger) {
    this.config = config;
    this.darkswap = darkswap;
    this.logger = logger;
    this.orders = {
      buy: [],
      sell: [],
    };
    this.lastPrice = null;
  }
  
  /**
   * Initialize the strategy
   * @param {string} baseAsset - The base asset
   * @param {string} quoteAsset - The quote asset
   */
  async init(baseAsset, quoteAsset) {
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
    
    this.logger.info(`Initializing Simple Market Making strategy for ${baseAsset}/${quoteAsset}`);
    
    // Cancel any existing orders for this pair
    await this.cancelAllOrders();
    
    // Get the current market price
    await this.updateMarketPrice();
    
    // Create initial orders
    await this.updateOrders();
  }
  
  /**
   * Update the market price
   */
  async updateMarketPrice() {
    try {
      const ticker = await this.darkswap.market.getTicker(this.baseAsset, this.quoteAsset);
      this.lastPrice = parseFloat(ticker.last);
      this.logger.debug(`Updated market price for ${this.baseAsset}/${this.quoteAsset}: ${this.lastPrice}`);
    } catch (error) {
      this.logger.error(`Error updating market price: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update orders
   */
  async updateOrders() {
    try {
      // Update the market price
      await this.updateMarketPrice();
      
      // Cancel existing orders
      await this.cancelAllOrders();
      
      // Calculate buy and sell prices
      const buyPrice = this.lastPrice * (1 - this.config.spread / 2);
      const sellPrice = this.lastPrice * (1 + this.config.spread / 2);
      
      // Create new orders
      this.orders.buy = [];
      this.orders.sell = [];
      
      for (let i = 0; i < this.config.maxOrders; i++) {
        // Calculate prices with increasing spread
        const buyPriceWithLevel = buyPrice * (1 - i * 0.005);
        const sellPriceWithLevel = sellPrice * (1 + i * 0.005);
        
        // Create buy order
        const buyOrder = await this.darkswap.orders.create({
          type: 'buy',
          baseAsset: this.baseAsset,
          quoteAsset: this.quoteAsset,
          price: buyPriceWithLevel.toString(),
          amount: this.config.quantity.toString(),
        });
        
        this.orders.buy.push(buyOrder);
        
        // Create sell order
        const sellOrder = await this.darkswap.orders.create({
          type: 'sell',
          baseAsset: this.baseAsset,
          quoteAsset: this.quoteAsset,
          price: sellPriceWithLevel.toString(),
          amount: this.config.quantity.toString(),
        });
        
        this.orders.sell.push(sellOrder);
      }
      
      this.logger.info(`Created ${this.orders.buy.length} buy orders and ${this.orders.sell.length} sell orders for ${this.baseAsset}/${this.quoteAsset}`);
    } catch (error) {
      this.logger.error(`Error updating orders: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Cancel all orders
   */
  async cancelAllOrders() {
    try {
      // Get all open orders for this pair
      const openOrders = await this.darkswap.orders.getAll({
        baseAsset: this.baseAsset,
        quoteAsset: this.quoteAsset,
        status: 'open',
      });
      
      // Cancel each order
      for (const order of openOrders) {
        await this.darkswap.orders.cancel(order.id);
        this.logger.debug(`Cancelled order ${order.id}`);
      }
      
      this.logger.info(`Cancelled ${openOrders.length} orders for ${this.baseAsset}/${this.quoteAsset}`);
    } catch (error) {
      this.logger.error(`Error cancelling orders: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Execute the strategy
   */
  async execute() {
    try {
      await this.updateOrders();
    } catch (error) {
      this.logger.error(`Error executing strategy: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Stop the strategy
   */
  async stop() {
    try {
      await this.cancelAllOrders();
      this.logger.info(`Stopped Simple Market Making strategy for ${this.baseAsset}/${this.quoteAsset}`);
    } catch (error) {
      this.logger.error(`Error stopping strategy: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SimpleMarketMaking;
```

## Implementing the Main Bot Logic

Create a file called `src/index.js` with the following content:

```javascript
const { DarkSwap, Network } = require('@darkswap/sdk');
const cron = require('node-cron');
const config = require('./config');
const logger = require('./logger');
const SimpleMarketMaking = require('./strategies/simple-market-making');
const { loadData, saveData, calculatePnL } = require('./utils');

// Initialize DarkSwap SDK
const darkswap = new DarkSwap({
  network: config.darkswap.network === 'mainnet' ? Network.MAINNET : Network.TESTNET,
  apiKey: config.darkswap.apiKey,
});

// Initialize strategies
const strategies = [];

// Trading state
let tradingEnabled = true;
let dailyStats = {
  date: new Date().toISOString().split('T')[0],
  profit: 0,
  loss: 0,
  trades: 0,
};

/**
 * Initialize the bot
 */
async function init() {
  try {
    logger.info(`Starting ${config.bot.name} v${config.bot.version}`);
    
    // Connect to DarkSwap
    await darkswap.connect();
    logger.info('Connected to DarkSwap');
    
    // Authenticate
    if (config.darkswap.apiKey) {
      logger.info('Authenticating with API key');
      await darkswap.auth.loginWithApiKey(config.darkswap.apiKey);
    } else {
      logger.info('Authenticating with email and password');
      await darkswap.auth.login(config.darkswap.email, config.darkswap.password);
    }
    logger.info('Authentication successful');
    
    // Initialize strategies
    for (const pair of config.trading.pairs) {
      if (pair.strategy === 'simple-market-making') {
        const strategy = new SimpleMarketMaking(
          pair.config,
          darkswap,
          logger
        );
        
        await strategy.init(pair.baseAsset, pair.quoteAsset);
        
        strategies.push({
          pair,
          strategy,
        });
      }
    }
    
    // Load daily stats
    const today = new Date().toISOString().split('T')[0];
    const savedStats = loadData('daily-stats.json', { date: today, profit: 0, loss: 0, trades: 0 });
    
    // Reset stats if it's a new day
    if (savedStats.date !== today) {
      dailyStats = {
        date: today,
        profit: 0,
        loss: 0,
        trades: 0,
      };
      saveData('daily-stats.json', dailyStats);
    } else {
      dailyStats = savedStats;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Schedule strategy execution
    scheduleStrategies();
    
    // Schedule health check
    scheduleHealthCheck();
    
    logger.info('Bot initialization complete');
  } catch (error) {
    logger.error(`Error initializing bot: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Listen for trade events
  darkswap.events.on('trade', (trade) => {
    logger.info(`New trade: ${trade.id}`);
    
    // Update daily stats
    const pnl = calculatePnL(trade);
    
    if (pnl > 0) {
      dailyStats.profit += pnl;
    } else {
      dailyStats.loss += Math.abs(pnl);
    }
    
    dailyStats.trades += 1;
    
    // Save daily stats
    saveData('daily-stats.json', dailyStats);
    
    // Check trading limits
    checkTradingLimits();
  });
  
  // Listen for order events
  darkswap.events.on('order', (order) => {
    logger.debug(`Order update: ${order.id}, status: ${order.status}`);
  });
}

/**
 * Check trading limits
 */
function checkTradingLimits() {
  // Check daily loss limit
  if (dailyStats.loss >= config.trading.limits.dailyLossLimit) {
    logger.warn(`Daily loss limit reached: ${dailyStats.loss}. Disabling trading.`);
    tradingEnabled = false;
    return;
  }
  
  // Check daily profit target
  if (dailyStats.profit >= config.trading.limits.dailyProfitTarget) {
    logger.info(`Daily profit target reached: ${dailyStats.profit}. Taking a break.`);
    tradingEnabled = false;
    return;
  }
  
  // Trading is enabled
  tradingEnabled = true;
}

/**
 * Schedule strategy execution
 */
function scheduleStrategies() {
  for (const { pair, strategy } of strategies) {
    // Schedule strategy execution based on the update interval
    const minutes = Math.floor(pair.config.updateInterval / 60000);
    const cronExpression = `*/${minutes} * * * *`; // Run every X minutes
    
    cron.schedule(cronExpression, async () => {
      if (!tradingEnabled) {
        logger.info(`Trading is disabled, skipping strategy execution for ${pair.baseAsset}/${pair.quoteAsset}`);
        return;
      }
      
      try {
        logger.info(`Executing ${pair.strategy} strategy for ${pair.baseAsset}/${pair.quoteAsset}`);
        await strategy.execute();
      } catch (error) {
        logger.error(`Error executing strategy: ${error.message}`);
      }
    });
    
    logger.info(`Scheduled ${pair.strategy} strategy for ${pair.baseAsset}/${pair.quoteAsset}`);
  }
}

/**
 * Schedule health check
 */
function scheduleHealthCheck() {
  cron.schedule(`*/${Math.floor(config.bot.healthCheckInterval / 60000)} * * * *`, async () => {
    try {
      logger.info('Performing health check');
      
      // Check DarkSwap connection
      const isConnected = darkswap.isConnected();
      
      if (!isConnected) {
        logger.error('DarkSwap connection lost. Attempting to reconnect...');
        
        try {
          await darkswap.connect();
          logger.info('Reconnected to DarkSwap');
        } catch (error) {
          logger.error(`Failed to reconnect to DarkSwap: ${error.message}`);
          
          if (config.bot.restartOnFailure) {
            logger.warn('Restarting bot due to connection failure');
            process.exit(1); // Process manager should restart the bot
          }
        }
      }
      
      // Check wallet balance
      try {
        const balance = await darkswap.wallet.getBalance();
        logger.info('Wallet balance:', balance);
      } catch (error) {
        logger.error(`Failed to get wallet balance: ${error.message}`);
      }
      
      logger.info('Health check complete');
    } catch (error) {
      logger.error(`Error during health check: ${error.message}`);
    }
  });
  
  logger.info('Scheduled health check');
}

// Start the bot
init();
```

## Running the Bot

Create a file called `package.json` with the following content:

```json
{
  "name": "darkswap-trading-bot",
  "version": "1.0.0",
  "description": "A trading bot for DarkSwap",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "@darkswap/sdk": "^1.0.0",
    "node-cron": "^3.0.0",
    "winston": "^3.3.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.15"
  }
}
```

To run the bot:

```bash
npm start
```

## Extending the Bot

This is a basic implementation of a trading bot. Here are some ways you could extend it:

### Additional Strategies

Implement more sophisticated trading strategies:

- Trend following
- Mean reversion
- Arbitrage
- Grid trading
- VWAP (Volume-Weighted Average Price)
- TWAP (Time-Weighted Average Price)

### Risk Management

Enhance the risk management capabilities:

- Position sizing based on volatility
- Dynamic stop-loss and take-profit levels
- Portfolio rebalancing
- Correlation analysis
- Drawdown management

### Performance Analysis

Add tools for analyzing the bot's performance:

- Performance metrics (Sharpe ratio, Sortino ratio, etc.)
- Backtesting framework
- Visualization of trading results
- Trade journal

### Monitoring and Alerts

Improve monitoring and alerting:

- Email or SMS alerts for critical events
- Dashboard for real-time monitoring
- Integration with monitoring services
- Automatic error recovery

## Best Practices

When building a trading bot, keep these best practices in mind:

1. **Start Small**: Begin with small amounts until you're confident in your bot's performance.
2. **Test Thoroughly**: Test your bot extensively in a testnet environment before using real funds.
3. **Monitor Continuously**: Always monitor your bot's performance and be ready to intervene if necessary.
4. **Implement Safeguards**: Use stop-loss orders, position limits, and other risk management techniques.
5. **Keep It Simple**: Start with simple strategies and gradually add complexity as you gain confidence.
6. **Document Everything**: Keep detailed records of your bot's trades and performance.
7. **Stay Informed**: Keep up with market news and adjust your strategies accordingly.

## Conclusion

In this tutorial, you learned how to build a simple trading bot using the DarkSwap SDK. You implemented a market making strategy, set up logging and scheduling, and added basic risk management features.

This is just the beginning of what you can do with the DarkSwap SDK. As you become more comfortable with the platform, you can implement more sophisticated strategies and features to enhance your trading bot.

Remember to always test your bot thoroughly in a testnet environment before using it with real funds, and never risk more than you can afford to lose.

Happy trading!
