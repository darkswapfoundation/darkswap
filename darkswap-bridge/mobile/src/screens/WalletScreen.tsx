import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Transaction } from '../utils/types';
import { formatBTC, formatAddress } from '../utils/formatters';
import { StackNavigationProp } from '@react-navigation/stack';
import { WalletStackParamList } from '../navigation/types';

type WalletScreenNavigationProp = StackNavigationProp<WalletStackParamList, 'WalletHome'>;

interface WalletScreenProps {
  navigation: WalletScreenNavigationProp;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { wallet, balance, transactions, connect, disconnect, refreshBalance } = useWallet();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  
  // Set default selected asset
  useEffect(() => {
    if (wallet && Object.keys(balance).length > 0 && !selectedAsset) {
      setSelectedAsset(Object.keys(balance)[0]);
    }
  }, [wallet, balance, selectedAsset]);
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      await refreshBalance();
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle connect wallet
  const handleConnectWallet = () => {
    connect();
  };
  
  // Handle send
  const handleSend = () => {
    if (selectedAsset) {
      navigation.navigate('Send', { asset: selectedAsset });
    }
  };
  
  // Handle receive
  const handleReceive = () => {
    if (selectedAsset) {
      navigation.navigate('Receive', { asset: selectedAsset });
    }
  };
  
  // Filter transactions by selected asset
  const filteredTransactions = selectedAsset
    ? transactions.filter(tx => tx.asset === selectedAsset)
    : transactions;
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
    >
      {wallet ? (
        <>
          {/* Wallet Info */}
          <View style={[styles.walletInfo, { backgroundColor: theme.surface }]}>
            <Text style={[styles.walletName, { color: theme.text.primary }]}>
              {wallet.name}
            </Text>
            <Text style={[styles.walletAddress, { color: theme.text.secondary }]}>
              {formatAddress(Object.values(wallet.addresses)[0] || '', 8, 8)}
            </Text>
          </View>
          
          {/* Asset Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.assetSelector}
          >
            {Object.entries(balance).map(([asset, amount]) => (
              <TouchableOpacity
                key={asset}
                style={[
                  styles.assetButton,
                  {
                    backgroundColor: selectedAsset === asset ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setSelectedAsset(asset)}
              >
                <Text
                  style={[
                    styles.assetButtonText,
                    {
                      color: selectedAsset === asset ? '#ffffff' : theme.text.primary,
                    },
                  ]}
                >
                  {asset}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Selected Asset Balance */}
          {selectedAsset && (
            <View style={[styles.balanceCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.balanceLabel, { color: theme.text.secondary }]}>
                Balance
              </Text>
              <Text style={[styles.balanceAmount, { color: theme.text.primary }]}>
                {formatBTC(balance[selectedAsset] || 0)}
              </Text>
              
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={handleSend}
                >
                  <Text style={styles.actionButtonText}>Send</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={handleReceive}
                >
                  <Text style={styles.actionButtonText}>Receive</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Transactions
            </Text>
            
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction: Transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={[styles.transactionItem, { backgroundColor: theme.surface }]}
                  onPress={() => {
                    navigation.navigate('TransactionDetails', { id: transaction.id });
                  }}
                >
                  <View style={styles.transactionHeader}>
                    <Text style={[styles.transactionType, { color: theme.text.primary }]}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Text>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color:
                            transaction.type === 'deposit'
                              ? theme.chart.positive
                              : transaction.type === 'withdrawal'
                              ? theme.chart.negative
                              : theme.text.primary,
                        },
                      ]}
                    >
                      {transaction.type === 'deposit' ? '+' : transaction.type === 'withdrawal' ? '-' : ''}
                      {formatBTC(transaction.amount)}
                    </Text>
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionDate, { color: theme.text.secondary }]}>
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </Text>
                    <View style={styles.transactionStatus}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              transaction.status === 'confirmed'
                                ? theme.chart.positive
                                : transaction.status === 'pending'
                                ? theme.warning
                                : transaction.status === 'failed'
                                ? theme.error
                                : theme.info,
                          },
                        ]}
                      />
                      <Text style={[styles.statusText, { color: theme.text.secondary }]}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>
                  No transactions found
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.connectWalletContainer}>
          <Text style={[styles.connectWalletTitle, { color: theme.text.primary }]}>
            Connect Your Wallet
          </Text>
          <Text style={[styles.connectWalletDescription, { color: theme.text.secondary }]}>
            Connect your wallet to view your balance and transactions
          </Text>
          
          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: theme.primary }]}
            onPress={handleConnectWallet}
          >
            <Text style={styles.connectButtonText}>Connect Wallet</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  walletInfo: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  walletName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  walletAddress: {
    fontSize: 14,
  },
  assetSelector: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  assetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  assetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  balanceCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  transactionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  transactionItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionDate: {
    fontSize: 14,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
  },
  connectWalletContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  connectWalletTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  connectWalletDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  connectButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WalletScreen;