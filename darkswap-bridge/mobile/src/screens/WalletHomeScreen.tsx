import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Surface, useTheme, ActivityIndicator, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { WalletStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define navigation prop type
type WalletHomeScreenNavigationProp = StackNavigationProp<WalletStackParamList, 'WalletHome'>;

// Define wallet balance type
interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
}

// Define transaction type
interface Transaction {
  txid: string;
  amount: number;
  recipient: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// Wallet home screen component
const WalletHomeScreen: React.FC = () => {
  const navigation = useNavigation<WalletHomeScreenNavigationProp>();
  const { api, loading, error } = useApi();
  const { addNotification } = useNotification();
  const theme = useTheme();
  const [walletStatus, setWalletStatus] = useState<any>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch data on mount
  useEffect(() => {
    fetchWalletStatus();
  }, []);

  // Fetch wallet status
  const fetchWalletStatus = async () => {
    try {
      const response = await api.get('/bridge/wallet/status');
      setWalletStatus(response.data);

      if (response.data.open) {
        fetchWalletData();
      }
    } catch (error) {
      console.error('Error fetching wallet status:', error);
      addNotification('error', 'Failed to fetch wallet status');
    }
  };

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      // Fetch balance
      const balanceResponse = await api.get('/bridge/wallet/balance');
      setBalance(balanceResponse.data);

      // Fetch transactions
      const transactionsResponse = await api.get('/bridge/wallet/transactions');
      setTransactions(transactionsResponse.data.transactions || []);

      // Fetch addresses
      const addressesResponse = await api.get('/bridge/wallet/addresses');
      setAddresses(addressesResponse.data.addresses || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      addNotification('error', 'Failed to fetch wallet data');
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletStatus();
    setRefreshing(false);
  };

  // Format satoshis as BTC
  const formatBTC = (satoshis: number) => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Format timestamp as date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Handle create wallet
  const handleCreateWallet = () => {
    navigation.navigate('CreateWallet');
  };

  // Handle open wallet
  const handleOpenWallet = () => {
    navigation.navigate('OpenWallet');
  };

  // Handle close wallet
  const handleCloseWallet = async () => {
    try {
      await api.post('/bridge/wallet', {
        command: 'CloseWallet',
      });

      addNotification('success', 'Wallet closed successfully');
      fetchWalletStatus();
    } catch (error) {
      console.error('Error closing wallet:', error);
      addNotification('error', 'Failed to close wallet');
    }
  };

  // Handle send transaction
  const handleSendTransaction = () => {
    navigation.navigate('SendTransaction');
  };

  // Handle receive transaction
  const handleReceiveTransaction = () => {
    navigation.navigate('ReceiveTransaction');
  };

  // Handle view transaction history
  const handleViewTransactionHistory = () => {
    navigation.navigate('TransactionHistory');
  };

  // Handle view transaction details
  const handleViewTransactionDetails = (txid: string) => {
    navigation.navigate('TransactionDetails', { txId: txid });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.title, { color: theme.colors.primary }]}>Wallet</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading && !walletStatus ? (
          <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
        ) : walletStatus?.open ? (
          <>
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text style={styles.cardTitle}>Wallet Information</Text>
                <Text style={styles.cardText}>
                  Name: {walletStatus.name}
                </Text>
                <Text style={styles.cardText}>
                  Status: {walletStatus.connected ? 'Connected' : 'Disconnected'}
                </Text>
                <Button
                  mode="outlined"
                  onPress={handleCloseWallet}
                  style={styles.button}
                >
                  Close Wallet
                </Button>
              </Card.Content>
            </Card>

            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text style={styles.cardTitle}>Balance</Text>
                {loading ? (
                  <ActivityIndicator animating={true} color={theme.colors.primary} />
                ) : balance ? (
                  <>
                    <Text style={styles.balanceText}>
                      {formatBTC(balance.confirmed + balance.unconfirmed)} BTC
                    </Text>
                    <Text style={styles.cardText}>
                      Confirmed: {formatBTC(balance.confirmed)} BTC
                    </Text>
                    <Text style={styles.cardText}>
                      Unconfirmed: {formatBTC(balance.unconfirmed)} BTC
                    </Text>
                  </>
                ) : (
                  <Text style={styles.cardText}>No balance data available</Text>
                )}
              </Card.Content>
            </Card>

            <View style={styles.actionButtonsContainer}>
              <Button
                mode="contained"
                icon="arrow-up"
                onPress={handleSendTransaction}
                style={styles.actionButton}
              >
                Send
              </Button>
              <Button
                mode="contained"
                icon="arrow-down"
                onPress={handleReceiveTransaction}
                style={styles.actionButton}
              >
                Receive
              </Button>
            </View>

            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>Recent Transactions</Text>
                  <Button
                    mode="text"
                    onPress={handleViewTransactionHistory}
                    disabled={transactions.length === 0}
                  >
                    View All
                  </Button>
                </View>
                {loading ? (
                  <ActivityIndicator animating={true} color={theme.colors.primary} />
                ) : transactions.length > 0 ? (
                  transactions.slice(0, 5).map((tx) => (
                    <Surface
                      key={tx.txid}
                      style={[styles.listItem, { backgroundColor: theme.colors.background }]}
                      onTouchEnd={() => handleViewTransactionDetails(tx.txid)}
                    >
                      <View style={styles.listItemContent}>
                        <Text style={styles.listItemTitle}>
                          {tx.amount > 0 ? 'Received' : 'Sent'} {formatBTC(Math.abs(tx.amount))} BTC
                        </Text>
                        <Text style={styles.listItemSubtitle}>
                          {formatDate(tx.timestamp)}
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
                              ? theme.colors.warning
                              : theme.colors.error
                          }
                        />
                      </View>
                    </Surface>
                  ))
                ) : (
                  <Text style={styles.cardText}>No transactions available</Text>
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          <View style={styles.noWalletContainer}>
            <Text style={styles.noWalletText}>No wallet is currently open</Text>
            <View style={styles.actionButtonsContainer}>
              <Button
                mode="contained"
                icon="wallet-plus"
                onPress={handleCreateWallet}
                style={styles.actionButton}
              >
                Create Wallet
              </Button>
              <Button
                mode="outlined"
                icon="wallet"
                onPress={handleOpenWallet}
                style={styles.actionButton}
              >
                Open Wallet
              </Button>
            </View>
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
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardText: {
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  button: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontWeight: 'bold',
  },
  listItemSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  listItemStatus: {
    marginLeft: 8,
  },
  noWalletContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noWalletText: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
});

export default WalletHomeScreen;