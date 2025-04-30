import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useWallet } from '../contexts/WalletContext';
import AssetCard from '../components/AssetCard';
import PriceChart from '../components/PriceChart';

interface HomeScreenProps {
  navigation: any;
}

interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  icon?: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { get, loading, error } = useApi();
  const { wallet, balance } = useWallet();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [featuredAsset, setFeaturedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await get('/api/assets');
      if (response.success && response.data) {
        const assetData = response.data as Asset[];
        setAssets(assetData);
        
        // Set BTC as featured asset
        const btc = assetData.find(asset => asset.symbol === 'BTC');
        if (btc) {
          setFeaturedAsset(btc);
        }
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    }
  };

  const handleAssetPress = (asset: Asset) => {
    navigation.navigate('AssetDetails', { assetId: asset.id });
  };

  const renderAssetCard = ({ item }: { item: Asset }) => {
    const assetBalance = balance && balance[item.symbol] ? balance[item.symbol] : 0;
    
    return (
      <AssetCard
        symbol={item.symbol}
        price={item.price}
        change24h={item.change24h}
        balance={assetBalance}
        icon={item.icon ? { uri: item.icon } : undefined}
        onPress={() => handleAssetPress(item)}
      />
    );
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
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Market Overview
        </Text>
        
        {featuredAsset && (
          <View style={styles.chartContainer}>
            <PriceChart 
              symbol={featuredAsset.symbol} 
              timeframe="24h" 
              height={200} 
            />
          </View>
        )}
        
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Your Assets
        </Text>
        
        {wallet ? (
          <FlatList
            data={assets}
            renderItem={renderAssetCard}
            keyExtractor={(item) => item.id}
            horizontal={false}
            scrollEnabled={false}
          />
        ) : (
          <Text style={[styles.emptyText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
            Connect your wallet to see your assets
          </Text>
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
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  chartContainer: {
    marginVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 24,
    fontSize: 16,
  },
  errorText: {
    color: '#F44336',
    marginVertical: 16,
    textAlign: 'center',
  },
});

export default HomeScreen;