/**
 * Staging environment configuration for DarkSwap
 */

module.exports = {
  // API configuration
  api: {
    baseUrl: 'https://staging-api.darkswap.io',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
  
  // WebSocket configuration
  websocket: {
    url: 'wss://staging-ws.darkswap.io',
    reconnectionAttempts: 5,
    reconnectionDelay: 1000, // 1 second
    reconnectionDelayMax: 5000, // 5 seconds
    timeout: 20000, // 20 seconds
  },
  
  // Wallet configuration
  wallet: {
    defaultNetwork: 'testnet',
    confirmations: 1,
    feeRate: 'medium', // 'low', 'medium', 'high'
    dustThreshold: 546, // satoshis
  },
  
  // P2P configuration
  p2p: {
    bootstrapPeers: [
      '/dns4/staging-relay1.darkswap.io/tcp/443/wss/p2p/QmStaging1',
      '/dns4/staging-relay2.darkswap.io/tcp/443/wss/p2p/QmStaging2',
    ],
    maxPeers: 10,
    connectionTimeout: 10000, // 10 seconds
  },
  
  // Orderbook configuration
  orderbook: {
    maxOrders: 1000,
    orderExpiry: 86400, // 24 hours in seconds
    orderRefreshInterval: 60000, // 1 minute
  },
  
  // Trade configuration
  trade: {
    maxTradeAmount: 1.0, // BTC
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
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  },
  
  // Security configuration
  security: {
    csrfProtectionEnabled: true,
    rateLimitingEnabled: true,
    maxRequestsPerMinute: 100,
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://staging-cdn.darkswap.io'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://staging-cdn.darkswap.io'],
      imgSrc: ["'self'", 'data:', 'https://staging-cdn.darkswap.io'],
      connectSrc: ["'self'", 'https://staging-api.darkswap.io', 'wss://staging-ws.darkswap.io'],
    },
  },
  
  // Cache configuration
  cache: {
    enabled: true,
    ttl: 60, // 60 seconds
    maxSize: 100, // 100 items
  },
};