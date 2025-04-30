import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Text, Card, Button, Surface, useTheme, ActivityIndicator, List, Divider, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { TradesStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define navigation prop type
type TradesHomeScreenNavigationProp = StackNavigationProp<TradesStackParamList, 'TradesHome'>;

// Define trade type
interface Trade {
  id: string;
  order_id: string;
  maker: string;
  taker: string;
  sell_asset: string;
  sell_amount: number;
  buy_asset: string;
  buy_amount: number;
  status: 'Created' | 'Accepted' | 'Executed' | 'Confirmed' | 'Failed' | 'Cancelled';
  created_at: number;
  updated_at: number;
}

// Trades home screen component
const TradesHomeScreen: React.FC = () => {
  const navigation = useNavigation<TradesHomeScreenNavigationProp>();
  const { api, loading, error } = useApi();
  const { addNotification } = useNotification();
  const theme = useTheme();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchTrades();
  }, []);

  // Fetch trades
  const fetchTrades = async () => {
    try {
      const response = await api.get('/bridge/trades');
      const tradesList = response.data.trades || [];
      setTrades(tradesList);
      
      // Apply filters
      applyFilters(tradesList);
    } catch (error) {
      console.error('Error fetching trades:', error);
      addNotification('error', 'Failed to fetch trades');
    }
  };

  // Apply filters
  const applyFilters = (tradesList: Trade[]) => {
    let filtered = tradesList;
    
    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter((trade) => trade.status === selectedStatus);
    }
    
    setFilteredTrades(filtered);
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrades();
    setRefreshing(false);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    if (selectedStatus === status) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status);
    }
    applyFilters(trades);
  };

  // Handle view trade details
  const handleViewTradeDetails = (tradeId: string) => {
    navigation.navigate('TradeDetails', { tradeId });
  };

  // Handle accept trade
  const handleAcceptTrade = (tradeId: string) => {
    navigation.navigate('AcceptTrade', { tradeId });
  };

  // Handle execute trade
  const handleExecuteTrade = (tradeId: string) => {
    navigation.navigate('ExecuteTrade', { tradeId });
  };

  // Handle confirm trade
  const handleConfirmTrade = (tradeId: string) => {
    navigation.navigate('ConfirmTrade', { tradeId });
  };

  // Format satoshis as BTC
  const formatBTC = (satoshis: number) => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Format timestamp as date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Created':
        return theme.colors.primary;
      case 'Accepted':
        return theme.colors.accent;
      case 'Executed':
        return theme.colors.success || '#28a745';
      case 'Confirmed':
        return theme.colors.success || '#28a745';
      case 'Failed':
        return theme.colors.error;
      case 'Cancelled':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  // Get next action button
  const getNextActionButton = (trade: Trade) => {
    switch (trade.status) {
      case 'Created':
        return (
          <Button
            mode="contained"
            onPress={() => handleAcceptTrade(trade.id)}
            style={styles.tradeActionButton}
          >
            Accept
          </Button>
        );
      case 'Accepted':
        return (
          <Button
            mode="contained"
            onPress={() => handleExecuteTrade(trade.id)}
            style={styles.tradeActionButton}
          >
            Execute
          </Button>
        );
      case 'Executed':
        return (
          <Button
            mode="contained"
            onPress={() => handleConfirmTrade(trade.id)}
            style={styles.tradeActionButton}
          >
            Confirm
          </Button>
        );
      default:
        return null;
    }
  };

  // Render trade item
  const renderTradeItem = ({ item }: { item: Trade }) => (
    <Surface
      style={[styles.tradeItem, { backgroundColor: theme.colors.surface }]}
      onTouchEnd={() => handleViewTradeDetails(item.id)}
    >
      <View style={styles.tradeHeader}>
        <Chip
          mode="outlined"
          style={[
            styles.tradeStatusChip,
            {
              backgroundColor: getStatusColor(item.status) + '20',
              borderColor: getStatusColor(item.status),
            },
          ]}
          textStyle={{
            color: getStatusColor(item.status),
          }}
        >
          {item.status}
        </Chip>
        <Text style={styles.tradeId}>
          ID: {item.id.substring(0, 8)}...
        </Text>
      </View>
      
      <View style={styles.tradeContent}>
        <View style={styles.tradeAssets}>
          <Text style={styles.tradeAssetText}>
            {formatBTC(item.sell_amount)} {item.sell_asset}
          </Text>
          <Icon name="arrow-right" size={16} color={theme.colors.text} />
          <Text style={styles.tradeAssetText}>
            {formatBTC(item.buy_amount)} {item.buy_asset}
          </Text>
        </View>
        
        <View style={styles.tradePeers}>
          <Text style={styles.tradePeerText}>
            Maker: {item.maker.substring(0, 8)}...
          </Text>
          <Text style={styles.tradePeerText}>
            Taker: {item.taker ? item.taker.substring(0, 8) + '...' : 'None'}
          </Text>
        </View>
        
        <Text style={styles.tradeDate}>
          Created: {formatDate(item.created_at)}
        </Text>
      </View>
      
      <View style={styles.tradeActions}>
        {getNextActionButton(item)}
        <Button
          mode="outlined"
          onPress={() => handleViewTradeDetails(item.id)}
          style={styles.tradeActionButton}
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
        <Text style={[styles.title, { color: theme.colors.primary }]}>Trades</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <Chip
              selected={selectedStatus === 'Created'}
              onPress={() => handleStatusFilter('Created')}
              style={styles.filterChip}
              selectedColor={theme.colors.primary}
            >
              Created
            </Chip>
            <Chip
              selected={selectedStatus === 'Accepted'}
              onPress={() => handleStatusFilter('Accepted')}
              style={styles.filterChip}
              selectedColor={theme.colors.accent}
            >
              Accepted
            </Chip>
            <Chip
              selected={selectedStatus === 'Executed'}
              onPress={() => handleStatusFilter('Executed')}
              style={styles.filterChip}
              selectedColor={theme.colors.success || '#28a745'}
            >
              Executed
            </Chip>
            <Chip
              selected={selectedStatus === 'Confirmed'}
              onPress={() => handleStatusFilter('Confirmed')}
              style={styles.filterChip}
              selectedColor={theme.colors.success || '#28a745'}
            >
              Confirmed
            </Chip>
            <Chip
              selected={selectedStatus === 'Failed'}
              onPress={() => handleStatusFilter('Failed')}
              style={styles.filterChip}
              selectedColor={theme.colors.error}
            >
              Failed
            </Chip>
            <Chip
              selected={selectedStatus === 'Cancelled'}
              onPress={() => handleStatusFilter('Cancelled')}
              style={styles.filterChip}
              selectedColor={theme.colors.error}
            >
              Cancelled
            </Chip>
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator animating={true} color={theme.colors.primary} style={styles.loading} />
        ) : filteredTrades.length > 0 ? (
          <FlatList
            data={filteredTrades}
            renderItem={renderTradeItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={styles.emptyText}>No trades found</Text>
            </Card.Content>
          </Card>
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
  filtersContainer: {
    marginBottom: 16,
  },
  filtersScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
  },
  tradeItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeStatusChip: {
    height: 28,
  },
  tradeId: {
    fontSize: 12,
    opacity: 0.7,
  },
  tradeContent: {
    marginBottom: 12,
  },
  tradeAssets: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeAssetText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  tradePeers: {
    marginBottom: 4,
  },
  tradePeerText: {
    fontSize: 12,
    opacity: 0.7,
  },
  tradeDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  tradeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeActionButton: {
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
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  loading: {
    marginVertical: 32,
  },
});

export default TradesHomeScreen;