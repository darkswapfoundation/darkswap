import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TransactionItem from '../../components/TransactionItem';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Transaction } from '../../utils/types';

// Mock the theme provider
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      surface: '#ffffff',
      text: {
        primary: '#212121',
        secondary: '#757575',
      },
      chart: {
        positive: '#4caf50',
        negative: '#f44336',
      },
    },
    isDark: false,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock formatters
jest.mock('../../utils/formatters', () => ({
  formatBTC: (value: number) => `${value.toFixed(8)}`,
  formatDate: (timestamp: number) => '2025-01-01',
  formatTxHash: (hash: string) => hash.length > 16 ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` : hash,
}));

describe('TransactionItem Component', () => {
  const mockDepositTransaction: Transaction = {
    id: 'tx1',
    txid: '0123456789abcdef0123456789abcdef',
    type: 'deposit',
    status: 'confirmed',
    amount: 1.5,
    asset: 'BTC',
    timestamp: 1704067200000, // January 1, 2025
  };
  
  const mockWithdrawalTransaction: Transaction = {
    id: 'tx2',
    txid: '0123456789abcdef0123456789abcdef',
    type: 'withdrawal',
    status: 'pending',
    amount: 0.5,
    asset: 'BTC',
    timestamp: 1704067200000, // January 1, 2025
  };
  
  const mockTradeTransaction: Transaction = {
    id: 'tx3',
    txid: '0123456789abcdef0123456789abcdef',
    type: 'trade',
    status: 'confirming',
    amount: 2.0,
    asset: 'BTC',
    timestamp: 1704067200000, // January 1, 2025
    confirmations: 3,
    requiredConfirmations: 6,
  };
  
  it('renders deposit transaction correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <TransactionItem transaction={mockDepositTransaction} />
      </ThemeProvider>
    );
    
    expect(getByText('Deposit')).toBeTruthy();
    expect(getByText('+1.50000000')).toBeTruthy();
    expect(getByText('2025-01-01')).toBeTruthy();
    expect(getByText('Confirmed')).toBeTruthy();
  });
  
  it('renders withdrawal transaction correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <TransactionItem transaction={mockWithdrawalTransaction} />
      </ThemeProvider>
    );
    
    expect(getByText('Withdrawal')).toBeTruthy();
    expect(getByText('-0.50000000')).toBeTruthy();
    expect(getByText('2025-01-01')).toBeTruthy();
    expect(getByText('Pending')).toBeTruthy();
  });
  
  it('renders trade transaction correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <TransactionItem transaction={mockTradeTransaction} />
      </ThemeProvider>
    );
    
    expect(getByText('Trade')).toBeTruthy();
    expect(getByText('2.00000000')).toBeTruthy();
    expect(getByText('2025-01-01')).toBeTruthy();
    expect(getByText('Confirming')).toBeTruthy();
    expect(getByText('3/6 confirmations')).toBeTruthy();
  });
  
  it('renders transaction without txid correctly', () => {
    const transactionWithoutTxid = {
      ...mockDepositTransaction,
      txid: undefined,
    };
    
    const { getByText } = render(
      <ThemeProvider>
        <TransactionItem transaction={transactionWithoutTxid} />
      </ThemeProvider>
    );
    
    expect(getByText('No TXID')).toBeTruthy();
  });
  
  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <TransactionItem transaction={mockDepositTransaction} onPress={onPressMock} />
      </ThemeProvider>
    );
    
    fireEvent.press(getByText('Deposit'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onPress when not provided', () => {
    const { getByText } = render(
      <ThemeProvider>
        <TransactionItem transaction={mockDepositTransaction} />
      </ThemeProvider>
    );
    
    // This should not throw an error
    fireEvent.press(getByText('Deposit'));
  });
  
  it('renders different status colors', () => {
    const confirmedTransaction = { ...mockDepositTransaction, status: 'confirmed' as const };
    const pendingTransaction = { ...mockDepositTransaction, status: 'pending' as const };
    const confirmingTransaction = { ...mockDepositTransaction, status: 'confirming' as const };
    const failedTransaction = { ...mockDepositTransaction, status: 'failed' as const };
    
    const { rerender, getByText } = render(
      <ThemeProvider>
        <TransactionItem transaction={confirmedTransaction} />
      </ThemeProvider>
    );
    
    expect(getByText('Confirmed')).toBeTruthy();
    
    rerender(
      <ThemeProvider>
        <TransactionItem transaction={pendingTransaction} />
      </ThemeProvider>
    );
    
    expect(getByText('Pending')).toBeTruthy();
    
    rerender(
      <ThemeProvider>
        <TransactionItem transaction={confirmingTransaction} />
      </ThemeProvider>
    );
    
    expect(getByText('Confirming')).toBeTruthy();
    
    rerender(
      <ThemeProvider>
        <TransactionItem transaction={failedTransaction} />
      </ThemeProvider>
    );
    
    expect(getByText('Failed')).toBeTruthy();
  });
});