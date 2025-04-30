import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { useApi } from '../contexts/ApiContext';
import PriceChart from '../components/PriceChart';
import OrderBook from '../components/OrderBook';
import TradeForm from '../components/TradeForm';
import Button from '../components/Button';

interface TradeScreenProps {
  navigation: any;
}

interface MarketData {
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface Order {
  id: string;
  price: number;
  amount: number;
  total: number;
  type: 'buy' | 'sell';
}

interface OrderBookData {
  buyOrders: Order[];
  sellOrders: Order[];
}

const TradeScreen: React.FC<TradeScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { wallet, connect } = useWallet();
  const { get, loading, error } = useApi();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchMarketData();
    fetchOrderBook();
  }, []);

  const fetchMarketData = async () => {
    try {
      const response = await get('/api/market/btc');
      if (response.success && response.data) {
        setMarketData(response.data as MarketData);
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    }
  };

  const fetchOrderBook = async () => {
    try {
      const response = await get('/api/orderbook/btc');
      if (response.success && response.data) {
        const orderBookData = response.data as OrderBookData;
        setBuyOrders(orderBookData.buyOrders);
        setSellOrders(orderBookData.sellOrders);
      }
    } catch (err) {
      console.error('Failed to fetch order book:', err);
    }
  };

  const handleOrderSubmit = (order: { type: 'buy' | 'sell'; amount: number; price: number }) => {
    navigation.navigate('OrderConfirmation', order);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1A1D2E' : '#FFFFFF' }]}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} testID="loading-indicator" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1A1D2E' : '#FFFFFF' }]}>
      <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>Trade</Text>
      
      <ScrollView style={styles.scrollView}>
        <PriceChart 
          symbol="BTC" 
          timeframe="24h" 
          height={200} 
        />
        
        <OrderBook 
          buyOrders={buyOrders}
          sellOrders={sellOrders}
          maxOrders={5}
        />
        
        {wallet ? (
          <TradeForm 
            symbol="BTC" 
            onSubmit={handleOrderSubmit} 
          />
        ) : (
          <View style={styles.connectWalletContainer}>
            <Text style={[styles.connectWalletText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Connect wallet to trade
            </Text>
            <Button 
              title="Connect Wallet" 
              onPress={connect} 
              variant="primary"
            />
          </View>
        )}
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  connectWalletContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  connectWalletText: {
    fontSize: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    marginVertical: 16,
    textAlign: 'center',
  },
});

export default TradeScreen;