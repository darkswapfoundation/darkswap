import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { formatNumber } from '../utils/formatters';

interface AssetCardProps {
  symbol: string;
  balance: number;
  icon: ImageSourcePropType;
  selected?: boolean;
  onPress?: () => void;
  showBalance?: boolean;
  showPrice?: boolean;
  price?: number;
  change24h?: number;
}

const AssetCard: React.FC<AssetCardProps> = ({
  symbol,
  balance,
  icon,
  selected = false,
  onPress,
  showBalance = true,
  showPrice = false,
  price,
  change24h
}) => {
  const { theme, isDark } = useTheme();
  
  // Format change percentage
  const formatChange = (change: number | undefined) => {
    if (change === undefined) return '';
    
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
  };
  
  // Get change color
  const getChangeColor = (change: number | undefined) => {
    if (change === undefined) return '#888888';
    return change >= 0 ? '#4caf50' : '#f44336';
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          borderColor: selected ? (isDark ? '#3f51b5' : '#2196f3') : 'transparent'
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Asset Icon */}
      <View style={styles.iconContainer}>
        <Image source={icon} style={styles.icon} />
      </View>
      
      {/* Asset Details */}
      <View style={styles.detailsContainer}>
        {/* Symbol */}
        <Text style={[styles.symbol, { color: isDark ? '#ffffff' : '#000000' }]}>
          {symbol}
        </Text>
        
        {/* Balance */}
        {showBalance && (
          <Text style={[styles.balance, { color: isDark ? '#aaaaaa' : '#666666' }]}>
            {formatNumber(balance, 8)}
          </Text>
        )}
        
        {/* Price and Change */}
        {showPrice && price !== undefined && (
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: isDark ? '#ffffff' : '#000000' }]}>
              ${formatNumber(price, 2)}
            </Text>
            
            {change24h !== undefined && (
              <Text style={[styles.change, { color: getChangeColor(change24h) }]}>
                {formatChange(change24h)}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 120,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  detailsContainer: {
    flex: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balance: {
    fontSize: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
  },
  change: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AssetCard;