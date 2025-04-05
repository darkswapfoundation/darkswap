import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Text, Card, Button, Surface, useTheme, ActivityIndicator, List, Divider, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { NetworkStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define navigation prop type
type NetworkHomeScreenNavigationProp = StackNavigationProp<NetworkStackParamList, 'NetworkHome'>;

// Define peer type
interface Peer {
  id: string;
  address: string;
  connected_since: number;
  last_seen: number;
  status: 'Connected' | 'Disconnected';
  direction: 'Inbound' | 'Outbound';
}

// Network home screen component
const NetworkHomeScreen: React.FC = () => {
  const navigation = useNavigation<NetworkHomeScreenNavigationProp>();
  const { api, loading, error } = useApi();
  const { connected } = useWebSocket();
  const { addNotification } = useNotification();
  const theme = useTheme();
  const [networkStatus, setNetworkStatus] = useState<any>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch data on mount
  useEffect(() => {
    fetchNetworkStatus();
  }, []);

  // Fetch network status
  const fetchNetworkStatus = async () => {
    try {
      const response = await api.get('/bridge/network/status');
      setNetworkStatus(response.data);

      if (response.data.connected) {
        fetchPeers();
      }
    } catch (error) {
      console.error('Error fetching network status:', error);
      addNotification('error', 'Failed to fetch network status');
    }
  };

  // Fetch peers
  const fetchPeers = async () => {
    try {
      const response = await api.get('/bridge/network/peers');
      setPeers(response.data.peers || []);
    } catch (error) {
      console.error('Error fetching peers:', error);
      addNotification('error', 'Failed to fetch peers');
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNetworkStatus();
    setRefreshing(false);
  };

  // Handle connect to peer
  const handleConnectToPeer = () => {
    navigation.navigate('ConnectPeer');
  };

  // Handle view peer details
  const handleViewPeerDetails = (peerId: string) => {
    navigation.navigate('PeerDetails', { peerId });
  };

  // Handle disconnect from peer
  const handleDisconnectFromPeer = async (peerId: string) => {
    try {
      await api.post('/bridge/network', {
        command: 'Disconnect',
        peer_id: peerId,
      });

      addNotification('success', `Disconnected from peer ${peerId.substring(0, 8)}... successfully`);
      fetchPeers();
    } catch (error: any) {
      addNotification('error', error.response?.data?.message || 'Failed to disconnect from peer');
    }
  };

  // Format timestamp as date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Calculate time since
  const timeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() / 1000 - timestamp));
    
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hours`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days} days`;
  };

  // Render peer item
  const renderPeerItem = ({ item }: { item: Peer }) => (
    <List.Item
      title={item.id.substring(0, 16) + '...'}
      description={`${item.address}\nConnected: ${formatDate(item.connected_since)}\nLast seen: ${timeSince(item.last_seen)} ago`}
      left={props => (
        <List.Icon
          {...props}
          icon={item.direction === 'Inbound' ? 'arrow-down' : 'arrow-up'}
          color={item.status === 'Connected' ? theme.colors.primary : theme.colors.error}
        />
      )}
      right={props => (
        <View style={styles.peerActions}>
          <Button
            mode="text"
            onPress={() => handleViewPeerDetails(item.id)}
            style={styles.peerActionButton}
          >
            Details
          </Button>
          {item.status === 'Connected' && (
            <Button
              mode="text"
              onPress={() => handleDisconnectFromPeer(item.id)}
              style={styles.peerActionButton}
              color={theme.colors.error}
            >
              Disconnect
            </Button>
          )}
        </View>
      )}
      style={styles.peerItem}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.title, { color: theme.colors.primary }]}>Network</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={styles.cardTitle}>Network Status</Text>
            {loading ? (
              <ActivityIndicator animating={true} color={theme.colors.primary} />
            ) : networkStatus ? (
              <>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Connected:</Text>
                  <View style={styles.statusValue}>
                    <Icon
                      name={networkStatus.connected ? 'check-circle' : 'close-circle'}
                      size={20}
                      color={networkStatus.connected ? theme.colors.primary : theme.colors.error}
                      style={styles.statusIcon}
                    />
                    <Text>{networkStatus.connected ? 'Yes' : 'No'}</Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Peer Count:</Text>
                  <Text style={styles.statusValue}>{networkStatus.peer_count}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>WebSocket:</Text>
                  <View style={styles.statusValue}>
                    <Icon
                      name={connected ? 'check-circle' : 'close-circle'}
                      size={20}
                      color={connected ? theme.colors.primary : theme.colors.error}
                      style={styles.statusIcon}
                    />
                    <Text>{connected ? 'Connected' : 'Disconnected'}</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.cardText}>No data available</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Connected Peers</Text>
              <Button
                mode="text"
                onPress={fetchPeers}
                disabled={loading}
              >
                Refresh
              </Button>
            </View>
            {loading ? (
              <ActivityIndicator animating={true} color={theme.colors.primary} />
            ) : peers.length > 0 ? (
              <View style={styles.peerList}>
                <FlatList
                  data={peers}
                  renderItem={renderPeerItem}
                  keyExtractor={(item) => item.id}
                  ItemSeparatorComponent={() => <Divider />}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <Text style={styles.noPeersText}>No peers connected</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={styles.cardTitle}>Network Diagnostics</Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('NetworkSettings')}
              style={styles.diagnosticsButton}
              icon="tune"
            >
              Network Settings
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={handleConnectToPeer}
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontWeight: 'bold',
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 4,
  },
  peerList: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  peerItem: {
    borderRadius: 4,
  },
  peerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  peerActionButton: {
    marginHorizontal: 4,
  },
  diagnosticsButton: {
    marginTop: 8,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  noPeersText: {
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default NetworkHomeScreen;