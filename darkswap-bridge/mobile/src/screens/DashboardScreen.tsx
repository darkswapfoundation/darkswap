import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Surface, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { MainTabParamList } from '../navigation/types';
import { formatBTC, formatRelativeTime } from '../utils/formatters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define navigation prop type
type DashboardScreenNavigationProp = StackNavigationProp<MainTabParamList>;

// Define dashboard data type
interface DashboardData {
  wallet: {
    status: 'open' | 'closed';
    balance: {
      confirmed: number;
      unconfirmed: number;
    };
    recentTransactions: Array<{
      txid: string;
      amount: number;
      timestamp: number;
      status: 'pending' | 'confirmed' | 'failed';
    }>;
  };
  network: {
    status: 'connected' | 'disconnected';
    peerCount: number;
  };
  orderBook: {
    openOrders: number;
    recentOrders: Array<{
      id: string;
      type: 'buy' | 'sell';
      sellAsset: string;
      sellAmount: number;
      buyAsset: string;
      buyAmount: number;
      timestamp: number;
    }>;
  };
  trades: {
    activeTrades: number;
    recentTrades: Array<{
      id: string;
      sellAsset: string;
      sellAmount: number;
      buyAsset: string;
      buyAmount: number;
      status: 'created' | 'accepted' | 'executed' | 'confirmed' | 'failed' | 'cancelled';
      timestamp: number;
    }>;
  };
}

// Dashboard screen component
const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { api, loading, error } = useApi();
  const { addNotification } = useNotification();
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/bridge/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addNotification('error', 'Failed to fetch dashboard data');
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Navigate to wallet
  const navigateToWallet = () => {
    navigation.navigate('Wallet');
  };

  // Navigate to network
  const navigateToNetwork = () => {
    navigation.navigate('Network');
  };

  // Navigate to order book
  const navigateToOrderBook = () => {
    navigation.navigate('OrderBook');
  };

  // Navigate to trades
  const navigateToTrades = () => {
    navigation.navigate('Trades');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.title, { color: theme.colors.primary }]}>Dashboard</Text>

        {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}

        {loading && !dashboardData ? (
          <ActivityIndicator animating={true} color={theme.colors.primary} size="large" style={styles.loading} />
        ) : dashboardData ? (
          <>
            {/* Wallet Section */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Title
                title="Wallet"
                subtitle={dashboardData.wallet.status === 'open' ? 'Open' : 'Closed'}
                left={(props) => <Icon name="wallet" {...props} />}
                right={(props) => (
                  <Button
                    mode="text"
                    onPress={navigateToWallet}
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    View
                  </Button>
                )}
              />
              <Card.Content>
                {dashboardData.wallet.status === 'open' ? (
                  <>
                    <View style={styles.balanceContainer}>
                      <Text style={styles.balanceLabel}>Balance:</Text>
                      <Text style={[styles.balanceValue, { color: theme.colors.primary }]}>
                        {formatBTC(
                          dashboardData.wallet.balance.confirmed +
                            dashboardData.wallet.balance.unconfirmed
                        )}{' '}
                        BTC
                      </Text>
                    </View>
                    {dashboardData.wallet.recentTransactions.length > 0 && (
                      <>
                        <Divider style={styles.divider} />
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        {dashboardData.wallet.recentTransactions.map((tx) => (
                          <Surface
                            key={tx.txid}
                            style={[styles.listItem, { backgroundColor: theme.colors.background }]}
                          >
                            <View style={styles.listItemContent}>
                              <Text style={styles.listItemTitle}>
                                {tx.amount > 0 ? 'Received' : 'Sent'}{' '}
                                {formatBTC(Math.abs(tx.amount))} BTC
                              </Text>
                              <Text style={styles.listItemSubtitle}>
                                {formatRelativeTime(tx.timestamp)}
                              </Text>
                            </View>
                            <View style={styles.listItemStatus}>
                              <Icon
                                name={
                                  tx.status === 'confirmed'
                                    ? 'check-circle'
                                    : tx.status === 'pending'
                                    ? 'clock-outline'
                                    : 'alert-circle'
                                }
                                size={24}
                                color={
                                  tx.status === 'confirmed'
                                    ? theme.colors.primary
                                    : tx.status === 'pending'
                                    ? theme.colors.warning || '#ffc107'
                                    : theme.colors.error
                                }
                              />
                            </View>
                          </Surface>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>Wallet is closed</Text>
                    <Button
                      mode="contained"
                      onPress={navigateToWallet}
                      style={styles.emptyStateButton}
                    >
                      Open Wallet
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Network Section */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Title
                title="Network"
                subtitle={
                  dashboardData.network.status === 'connected'
                    ? `Connected (${dashboardData.network.peerCount} peers)`
                    : 'Disconnected'
                }
                left={(props) => <Icon name="access-point-network" {...props} />}
                right={(props) => (
                  <Button
                    mode="text"
                    onPress={navigateToNetwork}
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    View
                  </Button>
                )}
              />
              <Card.Content>
                {dashboardData.network.status === 'connected' ? (
                  <View style={styles.networkStatusContainer}>
                    <Icon
                      name="check-circle"
                      size={24}
                      color={theme.colors.primary}
                      style={styles.networkStatusIcon}
                    />
                    <Text style={styles.networkStatusText}>
                      Connected to {dashboardData.network.peerCount} peers
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>Network is disconnected</Text>
                    <Button
                      mode="contained"
                      onPress={navigateToNetwork}
                      style={styles.emptyStateButton}
                    >
                      Connect
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* OrderBook Section */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Title
                title="Order Book"
                subtitle={`${dashboardData.orderBook.openOrders} open orders`}
                left={(props) => <Icon name="book-open" {...props} />}
                right={(props) => (
                  <Button
                    mode="text"
                    onPress={navigateToOrderBook}
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    View
                  </Button>
                )}
              />
              <Card.Content>
                {dashboardData.orderBook.recentOrders.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Recent Orders</Text>
                    {dashboardData.orderBook.recentOrders.map((order) => (
                      <Surface
                        key={order.id}
                        style={[styles.listItem, { backgroundColor: theme.colors.background }]}
                      >
                        <View style={styles.listItemContent}>
                          <Text style={styles.listItemTitle}>
                            {order.type === 'buy' ? 'Buy' : 'Sell'}{' '}
                            {formatBTC(order.buyAmount)} {order.buyAsset}
                          </Text>
                          <Text style={styles.listItemSubtitle}>
                            {formatRelativeTime(order.timestamp)}
                          </Text>
                        </View>
                        <View style={styles.listItemStatus}>
                          <Icon
                            name={order.type === 'buy' ? 'arrow-down' : 'arrow-up'}
                            size={24}
                            color={
                              order.type === 'buy'
                                ? theme.colors.primary
                                : theme.colors.error
                            }
                          />
                        </View>
                      </Surface>
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>No recent orders</Text>
                    <Button
                      mode="contained"
                      onPress={navigateToOrderBook}
                      style={styles.emptyStateButton}
                    >
                      Create Order
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Trades Section */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Title
                title="Trades"
                subtitle={`${dashboardData.trades.activeTrades} active trades`}
                left={(props) => <Icon name="swap-horizontal" {...props} />}
                right={(props) => (
                  <Button
                    mode="text"
                    onPress={navigateToTrades}
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    View
                  </Button>
                )}
              />
              <Card.Content>
                {dashboardData.trades.recentTrades.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Recent Trades</Text>
                    {dashboardData.trades.recentTrades.map((trade) => (
                      <Surface
                        key={trade.id}
                        style={[styles.listItem, { backgroundColor: theme.colors.background }]}
                      >
                        <View style={styles.listItemContent}>
                          <Text style={styles.listItemTitle}>
                            {formatBTC(trade.sellAmount)} {trade.sellAsset} ⟷{' '}
                            {formatBTC(trade.buyAmount)} {trade.buyAsset}
                          </Text>
                          <Text style={styles.listItemSubtitle}>
                            {formatRelativeTime(trade.timestamp)}
                          </Text>
                        </View>
                        <View style={styles.listItemStatus}>
                          <Icon
                            name={
                              trade.status === 'confirmed'
                                ? 'check-circle'
                                : trade.status === 'created' || trade.status === 'accepted'
                                ? 'clock-outline'
                                : trade.status === 'executed'
                                ? 'progress-check'
                                : 'alert-circle'
                            }
                            size={24}
                            color={
                              trade.status === 'confirmed'
                                ? theme.colors.primary
                                : trade.status === 'created' || trade.status === 'accepted' || trade.status === 'executed'
                                ? theme.colors.warning || '#ffc107'
                                : theme.colors.error
                            }
                          />
                        </View>
                      </Surface>
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>No recent trades</Text>
                    <Button
                      mode="contained"
                      onPress={navigateToTrades}
                      style={styles.emptyStateButton}
                    >
                      View Trades
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No dashboard data available</Text>
            <Button
              mode="contained"
              onPress={onRefresh}
              style={styles.emptyStateButton}
            >
              Refresh
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  listItemSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  listItemStatus: {
    marginLeft: 8,
  },
  networkStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkStatusIcon: {
    marginRight: 8,
  },
  networkStatusText: {
    fontSize: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
  },
  emptyStateButton: {
    minWidth: 150,
  },
  error: {
    marginBottom: 16,
  },
  loading: {
    marginVertical: 32,
  },
});

export default DashboardScreen;