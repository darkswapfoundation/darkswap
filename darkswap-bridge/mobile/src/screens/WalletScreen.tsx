import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Transaction } from '../utils/types';
import { formatBTC, formatAddress } from '../utils/formatters';
import TransactionItem from '../components/TransactionItem';

const WalletScreen = () => {
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
  
  // Handle disconnect wallet
  const handleDisconnectWallet = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: disconnect,
        },
      ]
    );
  };
  
  // Handle send
  const handleSend = () => {
    // In a real app, you would navigate to the send screen
    // navigation.navigate('Send', { asset: selectedAsset });
  };
  
  // Handle receive
  const handleReceive = () => {
    // In a real app, you would navigate to the receive screen
    // navigation.navigate('Receive', { asset: selectedAsset });
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
            
            <TouchableOpacity
              style={[styles.disconnectButton, { borderColor: theme.error }]}
              onPress={handleDisconnectWallet}
            >
              <Text style={[styles.disconnectButtonText, { color: theme.error }]}>
                Disconnect
              </Text>
            </TouchableOpacity>
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
              filteredTransactions.map(transaction => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onPress={() => {
                    // In a real app, you would navigate to the transaction details screen
                    // navigation.navigate('TransactionDetails', { id: transaction.id });
                  }}
                />
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
    marginBottom: 16,
  },
  disconnectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '500',
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