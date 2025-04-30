import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Transaction, TransactionStatus } from '../utils/types';
import { formatBTC, formatDate, formatTxHash } from '../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const { theme, isDark } = useTheme();
  
  // Get status color
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return '#f39c12'; // Orange
      case 'confirming':
        return '#3498db'; // Blue
      case 'confirmed':
        return theme.chart.positive; // Green
      case 'failed':
        return theme.chart.negative; // Red
      default:
        return theme.text.secondary;
    }
  };
  
  // Get transaction icon based on type
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'deposit':
        return '↓';
      case 'withdrawal':
        return '↑';
      case 'trade':
        return '↔';
      default:
        return '•';
    }
  };
  
  // Format transaction amount with sign
  const formatAmount = () => {
    const sign = transaction.type === 'deposit' ? '+' : transaction.type === 'withdrawal' ? '-' : '';
    return `${sign}${formatBTC(transaction.amount)}`;
  };
  
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
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: isDark ? '#333333' : '#f0f0f0',
            },
          ]}
        >
          <Text style={[styles.iconText, { color: theme.text.primary }]}>
            {getTransactionIcon()}
          </Text>
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <Text style={[styles.type, { color: theme.text.primary }]}>
            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
          </Text>
          <Text
            style={[
              styles.amount,
              {
                color:
                  transaction.type === 'deposit'
                    ? theme.chart.positive
                    : transaction.type === 'withdrawal'
                    ? theme.chart.negative
                    : theme.text.primary,
              },
            ]}
          >
            {formatAmount()}
          </Text>
        </View>
        
        <View style={styles.middleRow}>
          <Text style={[styles.hash, { color: theme.text.secondary }]}>
            {transaction.txid ? formatTxHash(transaction.txid) : 'No TXID'}
          </Text>
          <Text style={[styles.date, { color: theme.text.secondary }]}>
            {formatDate(transaction.timestamp)}
          </Text>
        </View>
        
        <View style={styles.bottomRow}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(transaction.status) },
              ]}
            />
            <Text style={[styles.status, { color: theme.text.secondary }]}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Text>
          </View>
          
          {transaction.status === 'confirming' && (
            <Text style={[styles.confirmations, { color: theme.text.secondary }]}>
              {transaction.confirmations}/{transaction.requiredConfirmations} confirmations
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  pressable: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  iconContainer: {
    marginRight: 16,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  type: {
    fontSize: 16,
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hash: {
    fontSize: 14,
  },
  date: {
    fontSize: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  status: {
    fontSize: 14,
  },
  confirmations: {
    fontSize: 14,
  },
});

export default TransactionItem;