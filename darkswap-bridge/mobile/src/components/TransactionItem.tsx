import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { Transaction, TransactionStatus } from '../utils/types';
import { formatRelativeTime, formatBTC } from '../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  showAsset?: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
  showAsset = true
}) => {
  const { theme, isDark } = useTheme();
  
  // Get transaction icon based on type and status
  const getTransactionIcon = () => {
    if (transaction.status === 'pending' || transaction.status === 'confirming') {
      return 'clock-outline';
    }
    
    if (transaction.status === 'failed') {
      return 'alert-circle-outline';
    }
    
    switch (transaction.type) {
      case 'deposit':
        return 'arrow-down';
      case 'withdrawal':
        return 'arrow-up';
      case 'trade':
        return 'swap-horizontal';
      default:
        return 'circle-outline';
    }
  };
  
  // Get transaction icon color based on type and status
  const getTransactionIconColor = () => {
    if (transaction.status === 'failed') {
      return '#f44336';
    }
    
    if (transaction.status === 'pending' || transaction.status === 'confirming') {
      return '#ff9800';
    }
    
    switch (transaction.type) {
      case 'deposit':
        return '#4caf50';
      case 'withdrawal':
        return '#f44336';
      case 'trade':
        return '#2196f3';
      default:
        return '#9e9e9e';
    }
  };
  
  // Get transaction title based on type
  const getTransactionTitle = () => {
    switch (transaction.type) {
      case 'deposit':
        return 'Received';
      case 'withdrawal':
        return 'Sent';
      case 'trade':
        return 'Traded';
      default:
        return 'Transaction';
    }
  };
  
  // Get transaction amount prefix based on type
  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'deposit':
        return '+';
      case 'withdrawal':
        return '-';
      default:
        return '';
    }
  };
  
  // Get transaction status text
  const getStatusText = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirming':
        return `Confirming (${transaction.confirmations}/${transaction.requiredConfirmations})`;
      case 'confirmed':
        return 'Confirmed';
      case 'failed':
        return 'Failed';
      default:
        return '';
    }
  };
  
  // Get transaction status color
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
      case 'confirming':
        return '#ff9800';
      case 'confirmed':
        return '#4caf50';
      case 'failed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Transaction Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getTransactionIconColor() + '20' } // 20% opacity
        ]}
      >
        <Icon
          name={getTransactionIcon()}
          size={24}
          color={getTransactionIconColor()}
        />
      </View>
      
      {/* Transaction Details */}
      <View style={styles.detailsContainer}>
        {/* Title and Time */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
            {getTransactionTitle()}
          </Text>
          <Text style={[styles.time, { color: isDark ? '#aaaaaa' : '#666666' }]}>
            {formatRelativeTime(transaction.timestamp)}
          </Text>
        </View>
        
        {/* Status */}
        <View style={styles.statusRow}>
          <Text style={[styles.status, { color: getStatusColor(transaction.status) }]}>
            {getStatusText(transaction.status)}
          </Text>
          {transaction.txid && (
            <Text style={[styles.txid, { color: isDark ? '#aaaaaa' : '#666666' }]}>
              {`${transaction.txid.substring(0, 8)}...${transaction.txid.substring(transaction.txid.length - 8)}`}
            </Text>
          )}
        </View>
      </View>
      
      {/* Transaction Amount */}
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            {
              color:
                transaction.type === 'deposit'
                  ? '#4caf50'
                  : transaction.type === 'withdrawal'
                  ? '#f44336'
                  : isDark
                  ? '#ffffff'
                  : '#000000'
            }
          ]}
        >
          {`${getAmountPrefix()}${formatBTC(transaction.amount, 8).replace(' BTC', '')}`}
        </Text>
        {showAsset && (
          <Text style={[styles.asset, { color: isDark ? '#aaaaaa' : '#666666' }]}>
            {transaction.asset}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  txid: {
    fontSize: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  asset: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default TransactionItem;