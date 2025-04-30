import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';

interface TradeFormProps {
  symbol?: string;
  onSubmit?: (order: { type: 'buy' | 'sell'; amount: number; price: number }) => void;
}

/**
 * A component for submitting buy and sell orders
 */
const TradeForm: React.FC<TradeFormProps> = ({
  symbol = 'BTC',
  onSubmit,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [total, setTotal] = useState('0');

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && price) {
      const totalValue = parseFloat(value) * parseFloat(price);
      setTotal(totalValue.toFixed(2));
    } else {
      setTotal('0');
    }
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);
    if (amount && value) {
      const totalValue = parseFloat(amount) * parseFloat(value);
      setTotal(totalValue.toFixed(2));
    } else {
      setTotal('0');
    }
  };

  const handleSubmit = () => {
    if (!amount || !price || !onSubmit) return;
    
    onSubmit({
      type: activeTab,
      amount: parseFloat(amount),
      price: parseFloat(price),
    });
    
    // Reset form
    setAmount('');
    setPrice('');
    setTotal('0');
  };

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: isDark ? '#2A2D3E' : '#F5F5F5' }
      ]}
      testID="trade-form"
    >
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'buy' && styles.activeTab,
            activeTab === 'buy' && { backgroundColor: '#4CAF50' }
          ]}
          onPress={() => setActiveTab('buy')}
          testID="buy-button"
        >
          <Text style={[
            styles.tabText,
            activeTab === 'buy' && styles.activeTabText,
            { color: activeTab === 'buy' ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000' }
          ]}>
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sell' && styles.activeTab,
            activeTab === 'sell' && { backgroundColor: '#F44336' }
          ]}
          onPress={() => setActiveTab('sell')}
          testID="sell-button"
        >
          <Text style={[
            styles.tabText,
            activeTab === 'sell' && styles.activeTabText,
            { color: activeTab === 'sell' ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000' }
          ]}>
            Sell
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Amount ({symbol})
        </Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: isDark ? '#1E2132' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#000000',
              borderColor: isDark ? '#444' : '#DDD'
            }
          ]}
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          placeholder={`Enter ${symbol} amount`}
          placeholderTextColor={isDark ? '#888' : '#AAA'}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Price (USD)
        </Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: isDark ? '#1E2132' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#000000',
              borderColor: isDark ? '#444' : '#DDD'
            }
          ]}
          value={price}
          onChangeText={handlePriceChange}
          keyboardType="numeric"
          placeholder="Enter price in USD"
          placeholderTextColor={isDark ? '#888' : '#AAA'}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Total (USD)
        </Text>
        <Text style={[
          styles.totalValue,
          { color: isDark ? '#FFFFFF' : '#000000' }
        ]}>
          ${total}
        </Text>
      </View>
      
      <Button
        title={activeTab === 'buy' ? `Buy ${symbol}` : `Sell ${symbol}`}
        variant={activeTab === 'buy' ? 'success' : 'danger'}
        onPress={handleSubmit}
        disabled={!amount || !price}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  totalValue: {
    height: 48,
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 12,
  },
});

export default TradeForm;