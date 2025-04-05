import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { Peer, NetworkStats } from '../utils/types';
import { formatRelativeTime } from '../utils/formatters';
import { StackNavigationProp } from '@react-navigation/stack';
import { NetworkStackParamList } from '../navigation/types';

type NetworkScreenNavigationProp = StackNavigationProp<NetworkStackParamList, 'NetworkHome'>;

interface NetworkScreenProps {
  navigation: NetworkScreenNavigationProp;
}

const NetworkScreen: React.FC<NetworkScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { get } = useApi();
  
  // State
  const [peers, setPeers] = useState<Peer[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Fetch network data on mount
  useEffect(() => {
    fetchNetworkData();
  }, []);
  
  // Fetch network data
  const fetchNetworkData = async () => {
    try {
      // Fetch peers
      const peersResponse = await get<Peer[]>('/network/peers');
      
      if (peersResponse.success && peersResponse.data) {
        setPeers(peersResponse.data);
      }
      
      // Fetch network stats
      const statsResponse = await get<NetworkStats>('/network/stats');
      
      if (statsResponse.success && statsResponse.data) {
        setNetworkStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      await fetchNetworkData();
    } finally {
      setRefreshing(false);
    }
  };
  
  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
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
      {/* Network Stats */}
      <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Network Status
        </Text>
        
        {networkStats ? (
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text.primary }]}>
                {networkStats.connectedPeers}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
                Connected Peers
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text.primary }]}>
                {networkStats.totalPeers}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
                Total Peers
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text.primary }]}>
                {networkStats.averageLatency.toFixed(0)} ms
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
                Avg. Latency
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text.primary }]}>
                {formatUptime(networkStats.uptime)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
                Uptime
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text.primary }]}>
                {networkStats.messagesSent.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
                Messages Sent
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text.primary }]}>
                {networkStats.messagesReceived.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
                Messages Received
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
            Loading network stats...
          </Text>
        )}
      </View>
      
      {/* Peers */}
      <View style={styles.peersSection}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Connected Peers
        </Text>
        
        {loading ? (
          <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
            Loading peers...
          </Text>
        ) : peers.length > 0 ? (
          peers.map(peer => (
            <TouchableOpacity
              key={peer.id}
              style={[styles.peerCard, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('PeerDetails', { id: peer.id })}
            >
              <View style={styles.peerHeader}>
                <Text style={[styles.peerId, { color: theme.text.primary }]}>
                  {peer.id.substring(0, 8)}...{peer.id.substring(peer.id.length - 8)}
                </Text>
                <View
                  style={[
                    styles.connectionStatus,
                    {
                      backgroundColor: peer.connected ? theme.chart.positive : theme.chart.negative,
                    },
                  ]}
                />
              </View>
              
              <View style={styles.peerDetails}>
                <View style={styles.peerDetail}>
                  <Text style={[styles.peerDetailLabel, { color: theme.text.secondary }]}>
                    Address
                  </Text>
                  <Text style={[styles.peerDetailValue, { color: theme.text.primary }]}>
                    {peer.address}
                  </Text>
                </View>
                
                <View style={styles.peerDetail}>
                  <Text style={[styles.peerDetailLabel, { color: theme.text.secondary }]}>
                    Direction
                  </Text>
                  <Text style={[styles.peerDetailValue, { color: theme.text.primary }]}>
                    {peer.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                  </Text>
                </View>
                
                <View style={styles.peerDetail}>
                  <Text style={[styles.peerDetailLabel, { color: theme.text.secondary }]}>
                    Latency
                  </Text>
                  <Text style={[styles.peerDetailValue, { color: theme.text.primary }]}>
                    {peer.latency} ms
                  </Text>
                </View>
                
                <View style={styles.peerDetail}>
                  <Text style={[styles.peerDetailLabel, { color: theme.text.secondary }]}>
                    Last Seen
                  </Text>
                  <Text style={[styles.peerDetailValue, { color: theme.text.primary }]}>
                    {formatRelativeTime(peer.lastSeen)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>
              No peers connected
            </Text>
          </View>
        )}
      </View>
      
      {/* Network Actions */}
      <View style={[styles.actionsCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Network Actions
        </Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              // In a real app, you would implement this functionality
              // For example: api.post('/network/connect-seed');
            }}
          >
            <Text style={styles.actionButtonText}>
              Connect to Seed
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              navigation.navigate('NetworkStats');
            }}
          >
            <Text style={styles.actionButtonText}>
              View Stats
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  peersSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  peerCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  peerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  peerId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectionStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  peerDetails: {
    marginBottom: 12,
  },
  peerDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  peerDetailLabel: {
    fontSize: 14,
  },
  peerDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  actionsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NetworkScreen;