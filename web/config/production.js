/**
 * Production environment configuration for DarkSwap
 */

module.exports = {
  // API configuration
  api: {
    baseUrl: 'https://api.darkswap.io',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
  
  // WebSocket configuration
  websocket: {
    url: 'wss://ws.darkswap.io',
    reconnectionAttempts: 5,
    reconnectionDelay: 1000, // 1 second
    reconnectionDelayMax: 5000, // 5 seconds
    timeout: 20000, // 20 seconds
  },
  
  // Wallet configuration
  wallet: {
    defaultNetwork: 'mainnet',
    confirmations: 2,
    feeRate: 'medium', // 'low', 'medium', 'high'
    dustThreshold: 546, // satoshis
  },
  
  // P2P configuration
  p2p: {
    bootstrapPeers: [
      '/dns4/relay1.darkswap.io/tcp/443/wss/p2p/QmProd1',
      '/dns4/relay2.darkswap.io/tcp/443/wss/p2p/QmProd2',
      '/dns4/relay3.darkswap.io/tcp/443/wss/p2p/QmProd3',
    ],
    maxPeers: 20,
    connectionTimeout: 10000, // 10 seconds
  },
  
  // Orderbook configuration
  orderbook: {
    maxOrders: 5000,
    orderExpiry: 86400, // 24 hours in seconds
    orderRefreshInterval: 60000, // 1 minute
  },
  
  // Trade configuration
  trade: {
    maxTradeAmount: 10.0, // BTC
    minTradeAmount: 0.0001, // BTC
    tradeTimeout: 3600, // 1 hour in seconds
  },
  
  // UI configuration
  ui: {
    theme: 'dark',
    animationsEnabled: true,
    notificationDuration: 5000, // 5 seconds
    maxNotifications: 5,
    chartRefreshInterval: 30000, // 30 seconds
  },
  
  // Feature flags
  features: {
    runesEnabled: true,
    alkanesEnabled: true,
    advancedTradingEnabled: true,
    chartingEnabled: true,
    multiWalletEnabled: true,
    historyEnabled: true,
  },
  
  // Monitoring configuration
  monitoring: {
    errorReportingEnabled: true,
    performanceMonitoringEnabled: true,
    analyticsEnabled: true,
    logLevel: 'error', // 'debug', 'info', 'warn', 'error'
  },
  
  // Security configuration
  security: {
    csrfProtectionEnabled: true,
    rateLimitingEnabled: true,
    maxRequestsPerMinute: 60,
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.darkswap.io'],
      styleSrc: ["'self'", 'https://cdn.darkswap.io'],
      imgSrc: ["'self'", 'data:', 'https://cdn.darkswap.io'],
      connectSrc: ["'self'", 'https://api.darkswap.io', 'wss://ws.darkswap.io'],
    },
  },
  
  // Cache configuration
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    maxSize: 500, // 500 items
  },
  
  // Performance optimization
  performance: {
    webAssemblyOptimized: true,
    lazyLoadingEnabled: true,
    componentMemoizationEnabled: true,
    apiCachingEnabled: true,
    websocketBatchingEnabled: true,
  },
  
  // CDN configuration
  cdn: {
    enabled: true,
    baseUrl: 'https://cdn.darkswap.io',
    assets: {
      js: 'https://cdn.darkswap.io/js',
      css: 'https://cdn.darkswap.io/css',
      images: 'https://cdn.darkswap.io/images',
      fonts: 'https://cdn.darkswap.io/fonts',
    },
  },
};