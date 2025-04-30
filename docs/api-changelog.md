# DarkSwap API Changelog

This document tracks changes to the DarkSwap API across versions. It includes additions, modifications, and deprecations to help developers stay up-to-date with API changes.

## v1.0.0 (2025-04-01)

Initial release of the DarkSwap API.

### Endpoints

#### Authentication
- `POST /auth/login`: Authenticate a user and return a JWT token
- `POST /auth/register`: Register a new user
- `POST /auth/refresh`: Refresh an expired JWT token

#### Orders
- `POST /orders`: Create a new order
- `GET /orders`: Get a list of orders
- `GET /orders/:id`: Get a specific order by ID
- `POST /orders/:id/cancel`: Cancel an order

#### Trades
- `GET /trades`: Get a list of trades
- `GET /trades/:id`: Get a specific trade by ID
- `POST /trades/:id/sign`: Sign a trade PSBT

#### Wallet
- `GET /wallet/balance`: Get the wallet balance
- `GET /wallet/transactions`: Get a list of wallet transactions
- `GET /wallet/deposit-address/:asset`: Get a deposit address for a specific asset
- `POST /wallet/withdraw`: Initiate a withdrawal

#### Market Data
- `GET /market/ticker`: Get the ticker for all trading pairs
- `GET /market/orderbook/:baseAsset/:quoteAsset`: Get the orderbook for a specific trading pair
- `GET /market/trades/:baseAsset/:quoteAsset`: Get recent trades for a specific trading pair

### WebSocket API
- Authentication via token
- Subscription to orderbook updates
- Subscription to trade updates
- Subscription to user order updates
- Subscription to user trade updates
- Subscription to user balance updates

## v1.1.0 (2025-05-15)

### Added
- `GET /market/price-history/:baseAsset/:quoteAsset`: Get historical price data for a specific trading pair
- `GET /market/assets`: Get a list of supported assets
- `GET /market/pairs`: Get a list of supported trading pairs
- `GET /wallet/address-book`: Get the user's address book
- `POST /wallet/address-book`: Add an address to the address book
- `DELETE /wallet/address-book/:id`: Remove an address from the address book
- WebSocket subscription to price updates

### Changed
- `GET /orders` now supports additional filter parameters: `from` and `to` for date range filtering
- `GET /trades` now supports additional filter parameters: `from` and `to` for date range filtering
- `GET /wallet/transactions` now supports additional filter parameters: `from` and `to` for date range filtering

### Fixed
- Fixed an issue where `GET /market/orderbook/:baseAsset/:quoteAsset` would return stale data in some cases
- Fixed an issue where `POST /trades/:id/sign` would return a 500 error when the trade was already fully signed

## v1.2.0 (2025-06-30)

### Added
- `GET /p2p/peers`: Get a list of available P2P peers
- `POST /p2p/connect`: Connect to a P2P peer
- `GET /p2p/connections`: Get a list of active P2P connections
- `DELETE /p2p/connections/:id`: Disconnect from a P2P peer
- `POST /p2p/message`: Send a message to a P2P peer
- `GET /p2p/invite`: Generate a P2P invite link
- `POST /p2p/trade`: Create a P2P trade
- `GET /p2p/trades`: Get a list of P2P trades
- `GET /p2p/trades/:id`: Get a specific P2P trade
- `POST /p2p/trades/:id/accept`: Accept a P2P trade
- `POST /p2p/trades/:id/reject`: Reject a P2P trade
- `POST /p2p/trades/:id/sign`: Sign a P2P trade
- WebSocket subscription to P2P connection events
- WebSocket subscription to P2P message events
- WebSocket subscription to P2P trade events

### Changed
- `POST /orders` now supports additional parameters for advanced order types: `stopPrice` and `timeInForce`
- `GET /market/ticker` now includes 24-hour volume and price change percentage
- WebSocket API now uses a more efficient binary protocol for orderbook updates

### Deprecated
- `GET /market/trades/:baseAsset/:quoteAsset` is deprecated in favor of the new `GET /market/trades/:baseAsset/:quoteAsset/recent` endpoint, which provides more options for filtering and pagination

## v1.3.0 (2025-08-15)

### Added
- `GET /wallet/fee-estimates`: Get fee estimates for Bitcoin transactions
- `POST /wallet/psbt`: Create a PSBT for a custom transaction
- `POST /wallet/psbt/sign`: Sign a PSBT
- `POST /wallet/psbt/broadcast`: Broadcast a fully signed PSBT
- `GET /wallet/utxos`: Get a list of UTXOs in the wallet
- `POST /orders/batch`: Create multiple orders in a single request
- `POST /orders/cancel-all`: Cancel all open orders
- `GET /market/depth/:baseAsset/:quoteAsset`: Get market depth data for a specific trading pair
- `GET /market/summary`: Get a summary of all markets
- WebSocket subscription to UTXO updates

### Changed
- `POST /wallet/withdraw` now supports batch withdrawals
- `GET /wallet/balance` now includes pending deposits and withdrawals
- `GET /market/orderbook/:baseAsset/:quoteAsset` now supports different levels of detail via the `depth` parameter
- Rate limits have been increased for authenticated users

### Fixed
- Fixed an issue where WebSocket connections would sometimes drop after 10 minutes of inactivity
- Fixed an issue where `POST /trades/:id/sign` would fail for large PSBTs

## v1.4.0 (2025-10-01)

### Added
- `GET /user/profile`: Get the user's profile information
- `PUT /user/profile`: Update the user's profile information
- `POST /user/2fa/enable`: Enable two-factor authentication
- `POST /user/2fa/disable`: Disable two-factor authentication
- `POST /user/2fa/verify`: Verify a two-factor authentication code
- `GET /user/activity`: Get the user's activity log
- `GET /user/api-keys`: Get the user's API keys
- `POST /user/api-keys`: Create a new API key
- `DELETE /user/api-keys/:id`: Delete an API key
- `GET /market/candles/:baseAsset/:quoteAsset`: Get candlestick data for a specific trading pair
- WebSocket subscription to user activity events

### Changed
- Authentication now supports API keys in addition to JWT tokens
- `POST /auth/login` now supports 2FA verification
- `GET /wallet/transactions` now includes more detailed transaction information
- WebSocket API now supports compression for reduced bandwidth usage

### Deprecated
- `GET /market/price-history/:baseAsset/:quoteAsset` is deprecated in favor of the new `GET /market/candles/:baseAsset/:quoteAsset` endpoint

## v1.5.0 (2025-12-15)

### Added
- `POST /orders/:id/modify`: Modify an existing order
- `GET /orders/history`: Get historical orders
- `GET /trades/history`: Get historical trades
- `GET /market/liquidity/:baseAsset/:quoteAsset`: Get liquidity data for a specific trading pair
- `GET /market/volume`: Get volume data for all trading pairs
- `GET /market/volume/:baseAsset/:quoteAsset`: Get volume data for a specific trading pair
- `GET /system/status`: Get system status information
- `GET /system/time`: Get server time
- WebSocket subscription to system status events

### Changed
- `GET /orders` and `GET /trades` now use cursor-based pagination for better performance
- `GET /market/ticker` now includes additional metrics like 24-hour high, low, and open prices
- Rate limiting now uses a more sophisticated algorithm that considers endpoint complexity

### Fixed
- Fixed an issue where `POST /orders` would sometimes return before the order was fully processed
- Fixed an issue where WebSocket subscriptions would not properly handle reconnections

### Deprecated
- The `page` and `limit` parameters for `GET /orders` and `GET /trades` are deprecated in favor of cursor-based pagination

## v2.0.0 (2026-03-01)

### Breaking Changes
- All deprecated endpoints and parameters from v1.x have been removed
- API base URL changed from `/v1` to `/v2`
- Authentication now requires API keys for all endpoints except public market data
- WebSocket API now uses a new connection URL and protocol

### Added
- `GET /market/analytics`: Get advanced market analytics
- `GET /market/correlation`: Get correlation data between trading pairs
- `GET /market/heatmap`: Get market heatmap data
- `POST /orders/strategy`: Create a strategy order (e.g., TWAP, VWAP)
- `GET /orders/strategy`: Get strategy orders
- `GET /orders/strategy/:id`: Get a specific strategy order
- `POST /orders/strategy/:id/cancel`: Cancel a strategy order
- `GET /wallet/portfolio`: Get portfolio analytics
- `GET /wallet/performance`: Get performance metrics
- `POST /wallet/sweep`: Sweep small balances into a single asset
- WebSocket subscription to strategy order events

### Changed
- All timestamps are now in ISO 8601 format
- All numeric values are now returned as strings to preserve precision
- Rate limits are now based on a credit system rather than simple request counting
- WebSocket API now supports multiple subscription levels for different data granularity

## Future Plans

The following features are planned for future API versions:

- Advanced order types (e.g., trailing stop, OCO)
- Margin trading support
- Lending and borrowing functionality
- Integration with Layer 2 solutions
- Cross-chain trading support
- Advanced analytics and reporting
- Algorithmic trading interfaces
- Social trading features