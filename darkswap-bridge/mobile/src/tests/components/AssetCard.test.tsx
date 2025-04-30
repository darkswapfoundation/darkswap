import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Image } from 'react-native';
import AssetCard from '../../components/AssetCard';
import { ThemeProvider } from '../../contexts/ThemeContext';

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

describe('AssetCard Component', () => {
  it('renders correctly with minimal props', () => {
    const { getByText } = render(
      <ThemeProvider>
        <AssetCard symbol="BTC" />
      </ThemeProvider>
    );
    
    expect(getByText('BTC')).toBeTruthy();
  });
  
  it('renders balance when provided', () => {
    const { getByText } = render(
      <ThemeProvider>
        <AssetCard symbol="BTC" balance={1.5} />
      </ThemeProvider>
    );
    
    expect(getByText('Balance')).toBeTruthy();
    expect(getByText('1.50000000')).toBeTruthy();
  });
  
  it('does not render balance when showBalance is false', () => {
    const { queryByText } = render(
      <ThemeProvider>
        <AssetCard symbol="BTC" balance={1.5} showBalance={false} />
      </ThemeProvider>
    );
    
    expect(queryByText('Balance')).toBeNull();
  });
  
  it('renders price when provided', () => {
    const { getByText } = render(
      <ThemeProvider>
        <AssetCard symbol="BTC" price={50000} />
      </ThemeProvider>
    );
    
    expect(getByText('Price')).toBeTruthy();
    expect(getByText('50000.00000000')).toBeTruthy();
  });
  
  it('does not render price when showPrice is false', () => {
    const { queryByText } = render(
      <ThemeProvider>
        <AssetCard symbol="BTC" price={50000} showPrice={false} />
      </ThemeProvider>
    );
    
    expect(queryByText('Price')).toBeNull();
  });
  
  it('renders positive price change with green color', () => {
    const { getByText } = render(
      <ThemeProvider>
        <AssetCard symbol="BTC" price={50000} change24h={5.25} />
      </ThemeProvider>
    );
    
    const changeElement = getByText('+5.25%');
    expect(changeElement).toBeTruthy();
  });
  
  it('renders negative price change with red color', () => {
    const { getByText } = render(
      <ThemeProvider>
        <AssetCard symbol="BTC" price={50000} change24h={-3.75} />
      </ThemeProvider>
    );
    
    const changeElement = getByText('-3.75%');
    expect(changeElement).toBeTruthy();
  });
  
  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <AssetCard symbol="BTC" onPress={onPressMock} />
      </ThemeProvider>
    );
    
    fireEvent.press(getByText('BTC'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
  
  it('renders icon when provided', () => {
    const { UNSAFE_getAllByType } = render(
      <ThemeProvider>
        <AssetCard symbol="BTC" icon={{ uri: 'https://example.com/btc.png' }} />
      </ThemeProvider>
    );
    
    const images = UNSAFE_getAllByType(Image);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].props.source).toEqual({ uri: 'https://example.com/btc.png' });
  });
  
  it('renders placeholder when no icon is provided', () => {
    const { getByText } = render(
      <ThemeProvider>
        <AssetCard symbol="BTC" />
      </ThemeProvider>
    );
    
    expect(getByText('B')).toBeTruthy();
  });
});