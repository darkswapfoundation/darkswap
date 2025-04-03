import React from 'react';
import { render, screen } from '@testing-library/react';
import { WalletBalance } from '../components/WalletBalance';
import { useBitcoinBalance, useRuneBalance, useAlkaneBalance } from '../hooks/useTradeHooks';

// Mock the hooks
jest.mock('../hooks/useTradeHooks', () => ({
  useBitcoinBalance: jest.fn(),
  useRuneBalance: jest.fn(),
  useAlkaneBalance: jest.fn(),
}));

const mockUseBitcoinBalance = useBitcoinBalance as jest.MockedFunction<typeof useBitcoinBalance>;
const mockUseRuneBalance = useRuneBalance as jest.MockedFunction<typeof useRuneBalance>;
const mockUseAlkaneBalance = useAlkaneBalance as jest.MockedFunction<typeof useAlkaneBalance>;

describe('WalletBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock values
    mockUseBitcoinBalance.mockReturnValue({ balance: 100000000, isLoading: false }); // 1 BTC
    mockUseRuneBalance.mockReturnValue({ balance: 1000, isLoading: false });
    mockUseAlkaneBalance.mockReturnValue({ balance: 500, isLoading: false });
  });
  
  it('should render the wallet balance', () => {
    render(<WalletBalance />);
    
    expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('1.00000000 BTC')).toBeInTheDocument();
    expect(screen.getByText('$65000.00')).toBeInTheDocument();
  });
  
  it('should render rune balances when runeIds are provided', () => {
    mockUseRuneBalance
      .mockReturnValueOnce({ balance: 1000, isLoading: false })
      .mockReturnValueOnce({ balance: 2000, isLoading: false });
    
    render(<WalletBalance runeIds={['rune-1', 'rune-2']} />);
    
    expect(screen.getByText('Runes')).toBeInTheDocument();
    expect(screen.getByText('rune-1')).toBeInTheDocument();
    expect(screen.getByText('1000 RUNE')).toBeInTheDocument();
    expect(screen.getByText('rune-2')).toBeInTheDocument();
    expect(screen.getByText('2000 RUNE')).toBeInTheDocument();
    
    expect(mockUseRuneBalance).toHaveBeenCalledWith('rune-1');
    expect(mockUseRuneBalance).toHaveBeenCalledWith('rune-2');
  });
  
  it('should render alkane balances when alkaneIds are provided', () => {
    mockUseAlkaneBalance
      .mockReturnValueOnce({ balance: 500, isLoading: false })
      .mockReturnValueOnce({ balance: 1000, isLoading: false });
    
    render(<WalletBalance alkaneIds={['alkane-1', 'alkane-2']} />);
    
    expect(screen.getByText('Alkanes')).toBeInTheDocument();
    expect(screen.getByText('alkane-1')).toBeInTheDocument();
    expect(screen.getByText('500 ALKANE')).toBeInTheDocument();
    expect(screen.getByText('alkane-2')).toBeInTheDocument();
    expect(screen.getByText('1000 ALKANE')).toBeInTheDocument();
    
    expect(mockUseAlkaneBalance).toHaveBeenCalledWith('alkane-1');
    expect(mockUseAlkaneBalance).toHaveBeenCalledWith('alkane-2');
  });
  
  it('should render both rune and alkane balances when both are provided', () => {
    mockUseRuneBalance.mockReturnValue({ balance: 1000, isLoading: false });
    mockUseAlkaneBalance.mockReturnValue({ balance: 500, isLoading: false });
    
    render(<WalletBalance runeIds={['rune-1']} alkaneIds={['alkane-1']} />);
    
    expect(screen.getByText('Runes')).toBeInTheDocument();
    expect(screen.getByText('rune-1')).toBeInTheDocument();
    expect(screen.getByText('1000 RUNE')).toBeInTheDocument();
    
    expect(screen.getByText('Alkanes')).toBeInTheDocument();
    expect(screen.getByText('alkane-1')).toBeInTheDocument();
    expect(screen.getByText('500 ALKANE')).toBeInTheDocument();
  });
  
  it('should not render runes section when no runeIds are provided', () => {
    render(<WalletBalance alkaneIds={['alkane-1']} />);
    
    expect(screen.queryByText('Runes')).not.toBeInTheDocument();
  });
  
  it('should not render alkanes section when no alkaneIds are provided', () => {
    render(<WalletBalance runeIds={['rune-1']} />);
    
    expect(screen.queryByText('Alkanes')).not.toBeInTheDocument();
  });
  
  it('should format bitcoin balance correctly', () => {
    mockUseBitcoinBalance.mockReturnValue({ balance: 123456789, isLoading: false }); // 1.23456789 BTC
    
    render(<WalletBalance />);
    
    expect(screen.getByText('1.23456789 BTC')).toBeInTheDocument();
    expect(screen.getByText('$80246.91')).toBeInTheDocument(); // 1.23456789 * 65000 = 80246.91285
  });
  
  it('should handle loading state for bitcoin balance', () => {
    mockUseBitcoinBalance.mockReturnValue({ balance: 0, isLoading: true });
    
    render(<WalletBalance />);
    
    expect(screen.getByText('0.00000000 BTC')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
  
  it('should handle loading state for rune balance', () => {
    mockUseRuneBalance.mockReturnValue({ balance: 0, isLoading: true });
    
    render(<WalletBalance runeIds={['rune-1']} />);
    
    expect(screen.getByText('0 RUNE')).toBeInTheDocument();
  });
  
  it('should handle loading state for alkane balance', () => {
    mockUseAlkaneBalance.mockReturnValue({ balance: 0, isLoading: true });
    
    render(<WalletBalance alkaneIds={['alkane-1']} />);
    
    expect(screen.getByText('0 ALKANE')).toBeInTheDocument();
  });
});