import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface PriceChartProps {
  symbol?: string;
  timeframe?: '1h' | '24h' | '7d' | '30d' | '1y';
  height?: number;
  width?: number;
}

/**
 * A component that displays a price chart for a cryptocurrency
 */
const PriceChart: React.FC<PriceChartProps> = ({
  symbol = 'BTC',
  timeframe = '24h',
  height = 200,
  width = 350,
}) => {
  const { isDark } = useTheme();

  return (
    <View 
      style={[
        styles.container, 
        { 
          height, 
          width,
          backgroundColor: isDark ? '#2A2D3E' : '#F5F5F5',
        }
      ]}
      testID="price-chart"
    >
      <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
        {symbol} Price Chart ({timeframe})
      </Text>
      <View style={styles.chartPlaceholder}>
        <Text style={[styles.placeholderText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Chart data loading...
        </Text>
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
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
  },
});

export default PriceChart;