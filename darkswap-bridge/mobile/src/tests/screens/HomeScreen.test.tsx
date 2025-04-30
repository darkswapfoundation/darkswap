import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';
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
      balance: { BTC: 1.5, ETH: 10 },
      refreshBalance: jest.fn(),
    }),
  };
});

// Mock the API context
jest.mock('../../contexts/ApiContext', () => {
  const originalModule = jest.requireActual('../../contexts/ApiContext');
  return {
    ...originalModule,
    useApi: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation((url) => {
        if (url === '/api/assets') {
          return Promise.resolve({
            success: true,
            data: [
              { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 50000, change24h: 2.5, marketCap: 1000000000, volume24h: 50000000 },
              { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3000, change24h: -1.2, marketCap: 500000000, volume24h: 25000000 },
            ],
          });
        }
        return Promise.resolve({ success: false, error: 'Not found' });
      }),
      post: jest.fn(),
      loading: false,
      error: null,
      clearError: jest.fn(),
    }),
  };
});

// Skip this test file for now
describe.skip('HomeScreen', () => {
  const renderWithProviders = () => {
    return render(
      <ApiProvider>
        <WebSocketProvider url="wss://test.example.com">
          <WalletProvider>
            <NotificationProvider>
              <ThemeProvider>
                <HomeScreen navigation={mockNavigation} />
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

  it('renders correctly', async () => {
    const { getByText, queryByTestId } = renderWithProviders();
    
    await waitFor(() => {
      expect(getByText('Market Overview')).toBeTruthy();
      expect(getByText('Your Assets')).toBeTruthy();
      expect(queryByTestId('price-chart')).toBeTruthy();
    });
  });

  it('displays loading state when fetching data', () => {
    // Mock API loading state
    const useApiMock = require('../../contexts/ApiContext').useApi;
    useApiMock.mockReturnValueOnce({
      get: jest.fn(),
      post: jest.fn(),
      loading: true,
      error: null,
      clearError: jest.fn(),
    });
    
    const { getByTestId } = renderWithProviders();
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays assets when data is loaded', async () => {
    const { findAllByTestId } = renderWithProviders();
    
    const assetCards = await findAllByTestId('asset-card');
    expect(assetCards.length).toBe(2);
  });

  it('navigates to asset details when asset is pressed', async () => {
    const { findAllByTestId } = renderWithProviders();
    
    const assetCards = await findAllByTestId('asset-card');
    fireEvent.press(assetCards[0]);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AssetDetails', { assetId: 'btc' });
  });

  it('displays message when wallet is not connected', async () => {
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
    
    const { findByText } = renderWithProviders();
    
    const message = await findByText('Connect your wallet to see your assets');
    expect(message).toBeTruthy();
  });

  it('displays error message when API request fails', async () => {
    // Mock API error
    const useApiMock = require('../../contexts/ApiContext').useApi;
    useApiMock.mockReturnValueOnce({
      get: jest.fn().mockRejectedValue(new Error('Failed to fetch')),
      post: jest.fn(),
      loading: false,
      error: 'Failed to fetch assets',
      clearError: jest.fn(),
    });
    
    const { findByText } = renderWithProviders();
    
    const errorMessage = await findByText('Failed to fetch assets');
    expect(errorMessage).toBeTruthy();
  });
});