# DarkSwap Component Reference

This document provides a comprehensive reference for the DarkSwap web interface components, including their props, usage examples, and best practices.

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
  - [TradeForm](#tradeform)
  - [TradeList](#tradelist)
  - [WalletBalance](#walletbalance)
  - [PeerStatus](#peerstatus)
  - [TradeHistory](#tradehistory)
  - [PriceChart](#pricechart)
- [Layout Components](#layout-components)
  - [Navigation](#navigation)
  - [Footer](#footer)
  - [Layout](#layout)
- [Data Integration Components](#data-integration-components)
  - [WebSocketStatus](#websocketstatus)
  - [WebSocketManager](#websocketmanager)
- [Notification Components](#notification-components)
  - [Notifications](#notifications)
  - [NotificationTest](#notificationtest)
- [Utility Components](#utility-components)
  - [ThemeToggle](#themetoggle)
  - [OptimizedImage](#optimizedimage)
- [Context Providers](#context-providers)
  - [ApiContext](#apicontext)
  - [WebSocketContext](#websocketcontext)
  - [DarkSwapContext](#darkswapcontext)
  - [NotificationContext](#notificationcontext)
  - [ThemeContext](#themecontext)
- [Best Practices](#best-practices)
  - [Performance Optimization](#performance-optimization)
  - [Accessibility](#accessibility)
  - [Testing](#testing)

## Overview

The DarkSwap web interface is built using React and TypeScript. It follows a component-based architecture, with each component responsible for a specific part of the user interface. The components are organized into the following categories:

- **Core Components**: The main components that provide the core functionality of the DarkSwap platform.
- **Layout Components**: Components that define the structure and layout of the application.
- **Data Integration Components**: Components that handle data fetching and real-time updates.
- **Notification Components**: Components that handle user notifications.
- **Utility Components**: Helper components that provide common functionality.
- **Context Providers**: Components that provide data and functionality to other components via React Context.

## Core Components

### TradeForm

The `TradeForm` component allows users to create and submit trade orders.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| baseAsset | string | The base asset for the trade (e.g., BTC) | Required |
| quoteAsset | string | The quote asset for the trade (e.g., RUNE:123) | Required |
| initialSide | 'buy' \| 'sell' | The initial side of the trade | 'buy' |
| initialAmount | string | The initial amount for the trade | '' |
| initialPrice | string | The initial price for the trade | '' |
| onSubmit | (order: Order) => void | Callback function called when the form is submitted | Required |
| onCancel | () => void | Callback function called when the form is canceled | () => {} |
| isLoading | boolean | Whether the form is in a loading state | false |
| error | string | Error message to display | '' |

#### Usage

```tsx
import { TradeForm } from '../components/TradeForm';

function TradePage() {
  const handleSubmit = (order) => {
    console.log('Order submitted:', order);
    // Submit the order to the API
  };

  return (
    <div>
      <h1>Create Order</h1>
      <TradeForm
        baseAsset="BTC"
        quoteAsset="RUNE:123"
        initialSide="buy"
        initialAmount="0.1"
        initialPrice="20000"
        onSubmit={handleSubmit}
        onCancel={() => console.log('Canceled')}
      />
    </div>
  );
}
```

### TradeList

The `TradeList` component displays a list of open orders.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| baseAsset | string | Filter by base asset | undefined |
| quoteAsset | string | Filter by quote asset | undefined |
| side | 'buy' \| 'sell' \| undefined | Filter by side | undefined |
| limit | number | Maximum number of orders to display | 10 |
| onOrderSelect | (order: Order) => void | Callback function called when an order is selected | Required |
| onOrderTake | (order: Order) => void | Callback function called when an order is taken | Required |
| isLoading | boolean | Whether the list is in a loading state | false |
| error | string | Error message to display | '' |

#### Usage

```tsx
import { TradeList } from '../components/TradeList';

function OrdersPage() {
  const handleOrderSelect = (order) => {
    console.log('Order selected:', order);
    // Navigate to order details page
  };

  const handleOrderTake = (order) => {
    console.log('Order taken:', order);
    // Open take order modal
  };

  return (
    <div>
      <h1>Open Orders</h1>
      <TradeList
        baseAsset="BTC"
        quoteAsset="RUNE:123"
        side="buy"
        limit={20}
        onOrderSelect={handleOrderSelect}
        onOrderTake={handleOrderTake}
      />
    </div>
  );
}
```

### WalletBalance

The `WalletBalance` component displays the user's wallet balance.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| walletId | string | The ID of the wallet to display | Required |
| showDetails | boolean | Whether to show detailed balance information | false |
| onRefresh | () => void | Callback function called when the refresh button is clicked | () => {} |
| isLoading | boolean | Whether the component is in a loading state | false |
| error | string | Error message to display | '' |

#### Usage

```tsx
import { WalletBalance } from '../components/WalletBalance';

function WalletPage() {
  return (
    <div>
      <h1>Wallet</h1>
      <WalletBalance
        walletId="wallet-123"
        showDetails={true}
        onRefresh={() => console.log('Refreshing...')}
      />
    </div>
  );
}
```

### PeerStatus

The `PeerStatus` component displays the status of connected peers.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| showDetails | boolean | Whether to show detailed peer information | false |
| onRefresh | () => void | Callback function called when the refresh button is clicked | () => {} |
| isLoading | boolean | Whether the component is in a loading state | false |
| error | string | Error message to display | '' |

#### Usage

```tsx
import { PeerStatus } from '../components/PeerStatus';

function NetworkPage() {
  return (
    <div>
      <h1>Network</h1>
      <PeerStatus
        showDetails={true}
        onRefresh={() => console.log('Refreshing...')}
      />
    </div>
  );
}
```

### TradeHistory

The `TradeHistory` component displays a history of completed trades.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| baseAsset | string | Filter by base asset | undefined |
| quoteAsset | string | Filter by quote asset | undefined |
| limit | number | Maximum number of trades to display | 10 |
| onTradeSelect | (trade: Trade) => void | Callback function called when a trade is selected | Required |
| isLoading | boolean | Whether the component is in a loading state | false |
| error | string | Error message to display | '' |

#### Usage

```tsx
import { TradeHistory } from '../components/TradeHistory';

function HistoryPage() {
  const handleTradeSelect = (trade) => {
    console.log('Trade selected:', trade);
    // Navigate to trade details page
  };

  return (
    <div>
      <h1>Trade History</h1>
      <TradeHistory
        baseAsset="BTC"
        quoteAsset="RUNE:123"
        limit={20}
        onTradeSelect={handleTradeSelect}
      />
    </div>
  );
}
```

### PriceChart

The `PriceChart` component displays a price chart for a trading pair.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| baseAsset | string | The base asset for the chart (e.g., BTC) | Required |
| quoteAsset | string | The quote asset for the chart (e.g., RUNE:123) | Required |
| period | '1m' \| '5m' \| '15m' \| '30m' \| '1h' \| '4h' \| '1d' \| '1w' | The time period for the chart | '1h' |
| height | number | The height of the chart in pixels | 400 |
| width | number | The width of the chart in pixels | 800 |
| theme | 'light' \| 'dark' | The theme of the chart | 'dark' |
| isLoading | boolean | Whether the component is in a loading state | false |
| error | string | Error message to display | '' |

#### Usage

```tsx
import { PriceChart } from '../components/PriceChart';

function ChartPage() {
  return (
    <div>
      <h1>Price Chart</h1>
      <PriceChart
        baseAsset="BTC"
        quoteAsset="RUNE:123"
        period="1h"
        height={500}
        width={1000}
        theme="dark"
      />
    </div>
  );
}
```

## Layout Components

### Navigation

The `Navigation` component displays the main navigation menu.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| items | Array<{ label: string, path: string, icon?: ReactNode }> | The navigation items to display | Required |
| activeItem | string | The path of the active item | '' |
| onItemClick | (path: string) => void | Callback function called when an item is clicked | Required |
| isCollapsed | boolean | Whether the navigation is collapsed | false |
| onToggleCollapse | () => void | Callback function called when the collapse button is clicked | () => {} |

#### Usage

```tsx
import { Navigation } from '../components/Navigation';
import { useNavigate, useLocation } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'Trade', path: '/trade', icon: <TradeIcon /> },
    { label: 'Orders', path: '/orders', icon: <OrdersIcon /> },
    { label: 'Wallet', path: '/wallet', icon: <WalletIcon /> },
  ];

  return (
    <div>
      <Navigation
        items={navigationItems}
        activeItem={location.pathname}
        onItemClick={(path) => navigate(path)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      {/* Rest of the application */}
    </div>
  );
}
```

### Footer

The `Footer` component displays the footer of the application.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| links | Array<{ label: string, url: string }> | The links to display in the footer | [] |
| copyright | string | The copyright text to display | '© 2025 DarkSwap' |
| version | string | The version of the application | '1.0.0' |

#### Usage

```tsx
import { Footer } from '../components/Footer';

function App() {
  const footerLinks = [
    { label: 'Terms', url: '/terms' },
    { label: 'Privacy', url: '/privacy' },
    { label: 'Contact', url: '/contact' },
  ];

  return (
    <div>
      {/* Rest of the application */}
      <Footer
        links={footerLinks}
        copyright="© 2025 DarkSwap"
        version="1.0.0"
      />
    </div>
  );
}
```

## Best Practices

### Performance Optimization

To optimize the performance of your components, follow these best practices:

1. **Use Memoization**: Use `React.memo` to prevent unnecessary re-renders of components that don't need to update when their parent re-renders.

2. **Optimize Hooks**: Use `useMemo` for expensive computations and `useCallback` for event handlers passed to child components.

3. **Lazy Load Components**: Use `React.lazy` and `Suspense` to lazy load components that are not needed immediately.

4. **Optimize Context Usage**: Split large contexts into smaller, more focused contexts and use context selectors to prevent unnecessary re-renders.

5. **Use Web Workers**: Use web workers for CPU-intensive tasks to avoid blocking the main thread.

### Accessibility

To ensure your components are accessible, follow these best practices:

1. **Use Semantic HTML**: Use semantic HTML elements to provide meaning and structure to your content.

2. **Add ARIA Attributes**: Use ARIA attributes to provide additional information to assistive technologies.

3. **Ensure Keyboard Navigation**: Make sure all interactive elements can be accessed and operated using a keyboard.

4. **Provide Text Alternatives**: Provide text alternatives for non-text content.

5. **Use Sufficient Color Contrast**: Ensure there is sufficient contrast between text and background colors.

### Testing

To ensure your components are reliable and maintainable, follow these testing best practices:

1. **Write Unit Tests**: Write unit tests for individual components to verify they render correctly and handle user interactions as expected.

2. **Write Integration Tests**: Write integration tests to verify that components work together as expected.

3. **Use Test Utilities**: Use testing utilities like React Testing Library to write tests that simulate user behavior.

4. **Test Accessibility**: Use tools like axe-core to test for accessibility issues.

5. **Test Performance**: Use tools like React DevTools Profiler to test for performance issues.
