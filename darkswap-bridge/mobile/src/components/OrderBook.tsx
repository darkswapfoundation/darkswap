import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface Order {
  id: string;
  price: number;
  amount: number;
  total: number;
  type: 'buy' | 'sell';
}

interface OrderBookProps {
  buyOrders?: Order[];
  sellOrders?: Order[];
  maxOrders?: number;
}

/**
 * A component that displays the order book for a trading pair
 */
const OrderBook: React.FC<OrderBookProps> = ({
  buyOrders = [],
  sellOrders = [],
  maxOrders = 5,
}) => {
  const { isDark } = useTheme();

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderRow}>
      <Text style={[
        styles.orderText, 
        { color: item.type === 'buy' ? '#4CAF50' : '#F44336' }
      ]}>
        {item.price.toFixed(2)}
      </Text>
      <Text style={[styles.orderText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
        {item.amount.toFixed(8)}
      </Text>
      <Text style={[styles.orderText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
        {item.total.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: isDark ? '#2A2D3E' : '#F5F5F5' }
      ]}
      testID="order-book"
    >
      <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
        Order Book
      </Text>
      
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { color: isDark ? '#FFFFFF' : '#000000' }]}>Price</Text>
        <Text style={[styles.headerText, { color: isDark ? '#FFFFFF' : '#000000' }]}>Amount</Text>
        <Text style={[styles.headerText, { color: isDark ? '#FFFFFF' : '#000000' }]}>Total</Text>
      </View>
      
      <View style={styles.sellOrdersContainer}>
        <FlatList
          data={sellOrders.slice(0, maxOrders)}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>
      
      <View style={[styles.spreadContainer, { backgroundColor: isDark ? '#1E2132' : '#E0E0E0' }]}>
        <Text style={[styles.spreadText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Spread: {sellOrders.length > 0 && buyOrders.length > 0 
            ? (sellOrders[0].price - buyOrders[0].price).toFixed(2) 
            : '0.00'}
        </Text>
      </View>
      
      <View style={styles.buyOrdersContainer}>
        <FlatList
          data={buyOrders.slice(0, maxOrders)}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  sellOrdersContainer: {
    marginTop: 8,
  },
  buyOrdersContainer: {
    marginTop: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  orderText: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  spreadContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 4,
  },
  spreadText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default OrderBook;