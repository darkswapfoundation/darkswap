import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { formatBTC, formatPercent } from '../utils/formatters';

interface AssetCardProps {
  symbol: string;
  balance?: number;
  price?: number;
  change24h?: number;
  icon?: { uri: string };
  showBalance?: boolean;
  showPrice?: boolean;
  onPress?: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({
  symbol,
  balance = 0,
  price,
  change24h,
  icon,
  showBalance = true,
  showPrice = true,
  onPress,
}) => {
  const { theme, isDark } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.surface },
        onPress ? styles.pressable : null,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {icon ? (
            <Image source={icon} style={styles.icon} />
          ) : (
            <View
              style={[
                styles.placeholderIcon,
                { backgroundColor: isDark ? '#333333' : '#f0f0f0' },
              ]}
            >
              <Text style={[styles.placeholderText, { color: theme.text.primary }]}>
                {symbol.substring(0, 1)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.symbol, { color: theme.text.primary }]}>
            {symbol}
          </Text>
        </View>
      </View>
      
      {showBalance && (
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceLabel, { color: theme.text.secondary }]}>
            Balance
          </Text>
          <Text style={[styles.balanceValue, { color: theme.text.primary }]}>
            {formatBTC(balance)}
          </Text>
        </View>
      )}
      
      {showPrice && price !== undefined && (
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: theme.text.secondary }]}>
            Price
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceValue, { color: theme.text.primary }]}>
              {formatBTC(price)}
            </Text>
            
            {change24h !== undefined && (
              <Text
                style={[
                  styles.changeValue,
                  {
                    color:
                      change24h > 0
                        ? theme.chart.positive
                        : change24h < 0
                        ? theme.chart.negative
                        : theme.text.secondary,
                  },
                ]}
              >
                {formatPercent(change24h)}
              </Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 8,
    width: 160,
  },
  pressable: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 8,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  placeholderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceContainer: {
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  priceContainer: {},
  priceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  changeValue: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AssetCard;