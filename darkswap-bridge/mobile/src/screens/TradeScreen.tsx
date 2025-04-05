import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { useApi } from '../contexts/ApiContext';
import { Price, OrderType } from '../utils/types';
import { formatPrice, formatPercent } from '../utils/formatters';

const TradeScreen = () => {
  const { theme, isDark } = useTheme();
  const { wallet, balance } = useWallet();
  const { get } = useApi();
  
  // State
  const [prices, setPrices] = useState<Price[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('BTC/USD');
  const [orderType, setOrderType] = useState<OrderType>('buy');
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
        
        // Set default selected pair if not already set
        if (!selectedPair && response.data.length > 0) {
          setSelectedPair(response.data[0].pair);
        }
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
      await fetchPrices();
    } finally {
      setRefreshing(false);
    }
  };
  
  // Get selected price
  const selectedPrice = prices.find(price => price.pair === selectedPair);
  
  // Get base and quote assets from pair
  const [baseAsset, quoteAsset] = selectedPair ? selectedPair.split('/') : ['', ''];
  
  // Get base and quote balances
  const baseBalance = balance[baseAsset] || 0;
  const quoteBalance = balance[quoteAsset] || 0;
  
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
      {/* Pair Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pairSelector}
      >
        {prices.map(price => (
          <TouchableOpacity
            key={price.pair}
            style={[
              styles.pairButton,
              {
                backgroundColor: selectedPair === price.pair ? theme.primary : theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setSelectedPair(price.pair)}
          >
            <Text
              style={[
                styles.pairButtonText,
                {
                  color: selectedPair === price.pair ? '#ffffff' : theme.text.primary,
                },
              ]}
            >
              {price.pair}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Price Card */}
      {selectedPrice && (
        <View style={[styles.priceCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.pairTitle, { color: theme.text.primary }]}>
            {selectedPair}
          </Text>
          
          <Text style={[styles.price, { color: theme.text.primary }]}>
            {formatPrice(selectedPrice.price)}
          </Text>
          
          <Text
            style={[
              styles.priceChange,
              {
                color:
                  selectedPrice.change24h > 0
                    ? theme.chart.positive
                    : selectedPrice.change24h < 0
                    ? theme.chart.negative
                    : theme.text.secondary,
              },
            ]}
          >
            {formatPercent(selectedPrice.change24h)} (24h)
          </Text>
          
          <View style={styles.priceStats}>
            <View style={styles.priceStat}>
              <Text style={[styles.priceStatLabel, { color: theme.text.secondary }]}>
                24h High
              </Text>
              <Text style={[styles.priceStatValue, { color: theme.text.primary }]}>
                {formatPrice(selectedPrice.high24h)}
              </Text>
            </View>
            
            <View style={styles.priceStat}>
              <Text style={[styles.priceStatLabel, { color: theme.text.secondary }]}>
                24h Low
              </Text>
              <Text style={[styles.priceStatValue, { color: theme.text.primary }]}>
                {formatPrice(selectedPrice.low24h)}
              </Text>
            </View>
            
            <View style={styles.priceStat}>
              <Text style={[styles.priceStatLabel, { color: theme.text.secondary }]}>
                24h Volume
              </Text>
              <Text style={[styles.priceStatValue, { color: theme.text.primary }]}>
                {formatPrice(selectedPrice.volume24h)}
              </Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Order Type Tabs */}
      <View style={[styles.orderTypeTabs, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[
            styles.orderTypeTab,
            {
              borderBottomColor: orderType === 'buy' ? theme.primary : 'transparent',
            },
          ]}
          onPress={() => setOrderType('buy')}
        >
          <Text
            style={[
              styles.orderTypeText,
              {
                color: orderType === 'buy' ? theme.primary : theme.text.secondary,
              },
            ]}
          >
            Buy
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.orderTypeTab,
            {
              borderBottomColor: orderType === 'sell' ? theme.primary : 'transparent',
            },
          ]}
          onPress={() => setOrderType('sell')}
        >
          <Text
            style={[
              styles.orderTypeText,
              {
                color: orderType === 'sell' ? theme.primary : theme.text.secondary,
              },
            ]}
          >
            Sell
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Trade Form */}
      <View style={[styles.tradeForm, { backgroundColor: theme.surface }]}>
        {/* In a real app, you would implement a proper trade form here */}
        <Text style={[styles.tradeFormTitle, { color: theme.text.primary }]}>
          {orderType === 'buy' ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
        </Text>
        
        <Text style={[styles.balanceText, { color: theme.text.secondary }]}>
          {orderType === 'buy'
            ? `Available: ${quoteBalance} ${quoteAsset}`
            : `Available: ${baseBalance} ${baseAsset}`}
        </Text>
        
        {/* Placeholder for trade form inputs */}
        <View style={[styles.formPlaceholder, { backgroundColor: theme.background }]}>
          <Text style={[styles.placeholderText, { color: theme.text.secondary }]}>
            Trade form inputs would go here
          </Text>
        </View>
        
        {/* Trade Button */}
        <TouchableOpacity
          style={[
            styles.tradeButton,
            {
              backgroundColor: orderType === 'buy' ? theme.chart.positive : theme.chart.negative,
            },
          ]}
          disabled={!wallet}
        >
          <Text style={styles.tradeButtonText}>
            {orderType === 'buy' ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
          </Text>
        </TouchableOpacity>
        
        {!wallet && (
          <Text style={[styles.connectWalletText, { color: theme.text.secondary }]}>
            Connect your wallet to trade
          </Text>
        )}
      </View>
      
      {/* Order Book Placeholder */}
      <View style={[styles.orderBookSection, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Order Book
        </Text>
        
        <View style={[styles.formPlaceholder, { backgroundColor: theme.background }]}>
          <Text style={[styles.placeholderText, { color: theme.text.secondary }]}>
            Order book would go here
          </Text>
        </View>
      </View>
      
      {/* Recent Trades Placeholder */}
      <View style={[styles.recentTradesSection, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Recent Trades
        </Text>
        
        <View style={[styles.formPlaceholder, { backgroundColor: theme.background }]}>
          <Text style={[styles.placeholderText, { color: theme.text.secondary }]}>
            Recent trades would go here
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pairSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pairButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  pairButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pairTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceChange: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  priceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  priceStat: {
    alignItems: 'center',
  },
  priceStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceStatValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderTypeTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderTypeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  orderTypeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tradeForm: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  tradeFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 14,
    marginBottom: 16,
  },
  formPlaceholder: {
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 14,
  },
  tradeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  connectWalletText: {
    fontSize: 14,
    textAlign: 'center',
  },
  orderBookSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  recentTradesSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default TradeScreen;