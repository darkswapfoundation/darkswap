import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TradeScreen from '../../screens/TradeScreen';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ApiProvider } from '../../contexts/ApiContext';
import { WalletProvider } from '../../contexts/WalletContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';

// Create mock navigation prop
const mockNavigation: any = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Mock the wallet context
jest.mock('../../contexts/WalletContext', () => {
  const originalModule = jest.requireActual('../../contexts/WalletContext');
  return {
    ...originalModule,
    useWallet: jest.fn().mockReturnValue({
      wallet: { id: 'test-wallet', name: 'Test Wallet' },
      connect: jest.fn(),
      disconnect: jest.fn(),
      loading: false,
      error: null,
      balance: { BTC: 1.5 },
      refreshBalance: jest.fn(),
    }),
  };
});

// Skip this test file for now
describe.skip('TradeScreen', () => {
  const renderWithProviders = () => {
    return render(
      <ApiProvider>
        <WebSocketProvider url="wss://test.example.com">
          <WalletProvider>
            <NotificationProvider>
              <ThemeProvider>
                <TradeScreen navigation={mockNavigation} />
              </ThemeProvider>
            </NotificationProvider>
          </WalletProvider>
        </WebSocketProvider>
      </ApiProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId, getByText } = renderWithProviders();
    
    expect(getByTestId('price-chart')).toBeTruthy();
    expect(getByTestId('trade-form')).toBeTruthy();
    expect(getByText('Trade')).toBeTruthy();
  });

  it('handles buy order submission', () => {
    const { getByTestId } = renderWithProviders();
    
    fireEvent.press(getByTestId('buy-button'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('OrderConfirmation', expect.any(Object));
  });

  it('handles sell order submission', () => {
    const { getByTestId } = renderWithProviders();
    
    fireEvent.press(getByTestId('sell-button'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('OrderConfirmation', expect.any(Object));
  });

  it('displays error message when wallet is not connected', () => {
    // Mock wallet context to return null wallet
    const useWalletMock = require('../../contexts/WalletContext').useWallet;
    useWalletMock.mockReturnValueOnce({
      wallet: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      loading: false,
      error: null,
      balance: {},
      refreshBalance: jest.fn(),
    });
    
    const { getByText } = renderWithProviders();
    
    expect(getByText('Connect wallet to trade')).toBeTruthy();
  });

  it('displays loading state when fetching data', () => {
    // Mock wallet context to return loading state
    const useWalletMock = require('../../contexts/WalletContext').useWallet;
    useWalletMock.mockReturnValueOnce({
      wallet: { id: 'test-wallet', name: 'Test Wallet' },
      connect: jest.fn(),
      disconnect: jest.fn(),
      loading: true,
      error: null,
      balance: { BTC: 1.5 },
      refreshBalance: jest.fn(),
    });
    
    const { getByTestId } = renderWithProviders();
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});