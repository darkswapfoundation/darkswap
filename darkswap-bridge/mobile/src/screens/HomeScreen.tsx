import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { useApi } from '../contexts/ApiContext';
import { Price } from '../utils/types';
import { formatPrice, formatPercent } from '../utils/formatters';
import AssetCard from '../components/AssetCard';

const HomeScreen = () => {
  const { theme, isDark } = useTheme();
  const { wallet, balance, refreshBalance } = useWallet();
  const { get } = useApi();
  
  const [prices, setPrices] = useState<Price[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Fetch prices on mount
  useEffect(() => {
    fetchPrices();
  }, []);
  
  // Fetch prices
  const fetchPrices = async () => {
    try {
      const response = await get<Price[]>('/market/prices');
      
      if (response.success && response.data) {
        setPrices(response.data);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      await Promise.all([
        refreshBalance(),
        fetchPrices()
      ]);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Get top assets by market cap
  const topAssets = prices
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 5);
  
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>
          DarkSwap
        </Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
          Decentralized Trading
        </Text>
      </View>
      
      {/* Wallet Section */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Your Wallet
        </Text>
        
        {wallet ? (
          <View>
            <Text style={[styles.walletName, { color: theme.text.primary }]}>
              {wallet.name}
            </Text>
            <Text style={[styles.walletAddress, { color: theme.text.secondary }]}>
              {Object.values(wallet.addresses)[0] || 'No address available'}
            </Text>
            
            {/* Balance Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.balanceCards}
            >
              {Object.entries(balance).map(([asset, amount]) => (
                <AssetCard
                  key={asset}
                  symbol={asset}
                  balance={amount}
                  icon={{ uri: `https://api.darkswap.io/assets/${asset.toLowerCase()}.png` }}
                  showBalance
                  showPrice
                  price={prices.find(p => p.pair === `${asset}/BTC`)?.price}
                  change24h={prices.find(p => p.pair === `${asset}/BTC`)?.change24h}
                />
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.connectWallet}>
            <Text style={[styles.connectWalletText, { color: theme.text.primary }]}>
              Connect your wallet to start trading
            </Text>
            {/* In a real app, you would add a connect button here */}
          </View>
        )}
      </View>
      
      {/* Market Section */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Market Overview
        </Text>
        
        {loading ? (
          <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
            Loading market data...
          </Text>
        ) : (
          <View style={styles.marketTable}>
            {/* Table Header */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeaderCell, { color: theme.text.secondary }]}>Asset</Text>
              <Text style={[styles.tableHeaderCell, { color: theme.text.secondary }]}>Price</Text>
              <Text style={[styles.tableHeaderCell, { color: theme.text.secondary }]}>24h Change</Text>
            </View>
            
            {/* Table Rows */}
            {topAssets.map((price) => (
              <View key={price.pair} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.tableCell, { color: theme.text.primary }]}>
                  {price.pair.split('/')[0]}
                </Text>
                <Text style={[styles.tableCell, { color: theme.text.primary }]}>
                  {formatPrice(price.price)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    {
                      color:
                        price.change24h > 0
                          ? theme.chart.positive
                          : price.change24h < 0
                          ? theme.chart.negative
                          : theme.text.primary
                    }
                  ]}
                >
                  {formatPercent(price.change24h)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    marginBottom: 16,
  },
  balanceCards: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  connectWallet: {
    alignItems: 'center',
    padding: 20,
  },
  connectWalletText: {
    fontSize: 16,
    marginBottom: 16,
  },
  marketTable: {
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
  },
});

export default HomeScreen;