import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Text, Card, Button, Surface, useTheme, ActivityIndicator, List, Divider, FAB, Chip, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { OrderBookStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define navigation prop type
type OrderBookHomeScreenNavigationProp = StackNavigationProp<OrderBookStackParamList, 'OrderBookHome'>;

// Define order type
interface Order {
  id: string;
  creator: string;
  order_type: 'Buy' | 'Sell';
  sell_asset: string;
  sell_amount: number;
  buy_asset: string;
  buy_amount: number;
  status: 'Open' | 'Filled' | 'Cancelled' | 'Expired';
  created_at: number;
  expires_at: number;
}

// OrderBook home screen component
const OrderBookHomeScreen: React.FC = () => {
  const navigation = useNavigation<OrderBookHomeScreenNavigationProp>();
  const { api, loading, error } = useApi();
  const { addNotification } = useNotification();
  const theme = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'Buy' | 'Sell' | null>(null);
  const [assets, setAssets] = useState<string[]>([]);

  // Fetch data on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await api.get('/bridge/orders');
      const ordersList = response.data.orders || [];
      setOrders(ordersList);
      
      // Extract unique assets
      const uniqueAssets = new Set<string>();
      ordersList.forEach((order: Order) => {
        uniqueAssets.add(order.sell_asset);
        uniqueAssets.add(order.buy_asset);
      });
      setAssets(Array.from(uniqueAssets));
      
      // Apply filters
      applyFilters(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      addNotification('error', 'Failed to fetch orders');
    }
  };

  // Apply filters
  const applyFilters = (ordersList: Order[]) => {
    let filtered = ordersList;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.creator.toLowerCase().includes(query) ||
          order.sell_asset.toLowerCase().includes(query) ||
          order.buy_asset.toLowerCase().includes(query)
      );
    }
    
    // Filter by asset
    if (selectedAsset) {
      filtered = filtered.filter(
        (order) =>
          order.sell_asset === selectedAsset || order.buy_asset === selectedAsset
      );
    }
    
    // Filter by type
    if (selectedType) {
      filtered = filtered.filter((order) => order.order_type === selectedType);
    }
    
    setFilteredOrders(filtered);
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Handle search
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(orders);
  };

  // Handle asset filter
  const handleAssetFilter = (asset: string) => {
    if (selectedAsset === asset) {
      setSelectedAsset(null);
    } else {
      setSelectedAsset(asset);
    }
    applyFilters(orders);
  };

  // Handle type filter
  const handleTypeFilter = (type: 'Buy' | 'Sell') => {
    if (selectedType === type) {
      setSelectedType(null);
    } else {
      setSelectedType(type);
    }
    applyFilters(orders);
  };

  // Handle create order
  const handleCreateOrder = () => {
    navigation.navigate('CreateOrder');
  };

  // Handle view order details
  const handleViewOrderDetails = (orderId: string) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  // Handle take order
  const handleTakeOrder = (orderId: string) => {
    navigation.navigate('TakeOrder', { orderId });
  };

  // Format satoshis as BTC
  const formatBTC = (satoshis: number) => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Format timestamp as date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Calculate time remaining
  const timeRemaining = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = timestamp - now;
    
    if (remaining <= 0) {
      return 'Expired';
    }
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Render order item
  const renderOrderItem = ({ item }: { item: Order }) => (
    <Surface
      style={[styles.orderItem, { backgroundColor: theme.colors.surface }]}
      onTouchEnd={() => handleViewOrderDetails(item.id)}
    >
      <View style={styles.orderHeader}>
        <Chip
          mode="outlined"
          style={[
            styles.orderTypeChip,
            {
              backgroundColor:
                item.order_type === 'Buy'
                  ? theme.colors.primary + '20'
                  : theme.colors.error + '20',
              borderColor:
                item.order_type === 'Buy'
                  ? theme.colors.primary
                  : theme.colors.error,
            },
          ]}
          textStyle={{
            color:
              item.order_type === 'Buy'
                ? theme.colors.primary
                : theme.colors.error,
          }}
        >
          {item.order_type}
        </Chip>
        <Text style={styles.orderExpiry}>
          {timeRemaining(item.expires_at)}
        </Text>
      </View>
      
      <View style={styles.orderContent}>
        <View style={styles.orderAssets}>
          <Text style={styles.orderAssetText}>
            {formatBTC(item.sell_amount)} {item.sell_asset}
          </Text>
          <Icon name="arrow-right" size={16} color={theme.colors.text} />
          <Text style={styles.orderAssetText}>
            {formatBTC(item.buy_amount)} {item.buy_asset}
          </Text>
        </View>
        
        <Text style={styles.orderCreator}>
          Creator: {item.creator.substring(0, 8)}...
        </Text>
        
        <Text style={styles.orderDate}>
          Created: {formatDate(item.created_at)}
        </Text>
      </View>
      
      <View style={styles.orderActions}>
        <Button
          mode="contained"
          onPress={() => handleTakeOrder(item.id)}
          disabled={item.status !== 'Open'}
          style={styles.orderActionButton}
        >
          Take Order
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleViewOrderDetails(item.id)}
          style={styles.orderActionButton}
        >
          Details
        </Button>
      </View>
    </Surface>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.title, { color: theme.colors.primary }]}>Order Book</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Searchbar
          placeholder="Search orders..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <Chip
              selected={selectedType === 'Buy'}
              onPress={() => handleTypeFilter('Buy')}
              style={styles.filterChip}
              selectedColor={theme.colors.primary}
            >
              Buy Orders
            </Chip>
            <Chip
              selected={selectedType === 'Sell'}
              onPress={() => handleTypeFilter('Sell')}
              style={styles.filterChip}
              selectedColor={theme.colors.error}
            >
              Sell Orders
            </Chip>
            {assets.map((asset) => (
              <Chip
                key={asset}
                selected={selectedAsset === asset}
                onPress={() => handleAssetFilter(asset)}
                style={styles.filterChip}
                selectedColor={theme.colors.primary}
              >
                {asset}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator animating={true} color={theme.colors.primary} style={styles.loading} />
        ) : filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={styles.emptyText}>No orders found</Text>
              <Button
                mode="contained"
                onPress={handleCreateOrder}
                style={styles.emptyButton}
              >
                Create Order
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={handleCreateOrder}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
    paddingBottom: 80, // Add padding for FAB
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
  },
  orderItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTypeChip: {
    height: 28,
  },
  orderExpiry: {
    fontSize: 12,
    opacity: 0.7,
  },
  orderContent: {
    marginBottom: 12,
  },
  orderAssets: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderAssetText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  orderCreator: {
    fontSize: 12,
    opacity: 0.7,
  },
  orderDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderActionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  separator: {
    height: 8,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    alignSelf: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  loading: {
    marginVertical: 32,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default OrderBookHomeScreen;