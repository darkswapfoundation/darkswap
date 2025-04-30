import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TradeList } from '../components/TradeList';
import { useTradeOffers, TradeOffer, AssetType } from '../hooks/useDarkSwap';
import { useAcceptTradeOffer } from '../hooks/useTradeHooks';

// Mock the hooks
jest.mock('../hooks/useDarkSwap', () => ({
  useTradeOffers: jest.fn(),
  TradeOffer: jest.fn(),
  AssetType: jest.fn(),
}));

jest.mock('../hooks/useTradeHooks', () => ({
  useAcceptTradeOffer: jest.fn(),
}));

const mockUseTradeOffers = useTradeOffers as jest.MockedFunction<typeof useTradeOffers>;
const mockUseAcceptTradeOffer = useAcceptTradeOffer as jest.MockedFunction<typeof useAcceptTradeOffer>;

describe('TradeList', () => {
  const mockTradeOffers: TradeOffer[] = [
    {
      id: 'offer-1',
      maker: 'peer-1',
      makerAsset: { type: 'bitcoin' } as AssetType,
      makerAmount: 100000000, // 1 BTC
      takerAsset: { type: 'rune', id: 'rune-id' } as AssetType,
      takerAmount: 1000,
      expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      status: 'open',
    },
    {
      id: 'offer-2',
      maker: 'peer-2',
      makerAsset: { type: 'rune', id: 'rune-id' } as AssetType,
      makerAmount: 500,
      takerAsset: { type: 'bitcoin' } as AssetType,
      takerAmount: 50000000, // 0.5 BTC
      expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      status: 'open',
    },
    {
      id: 'offer-3',
      maker: 'peer-3',
      makerAsset: { type: 'alkane', id: 'alkane-id' } as AssetType,
      makerAmount: 200,
      takerAsset: { type: 'rune', id: 'rune-id' } as AssetType,
      takerAmount: 400,
      expiry: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      status: 'open',
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock values
    mockUseTradeOffers.mockReturnValue({
      tradeOffers: mockTradeOffers,
      isLoading: false,
    } as any);
    
    mockUseAcceptTradeOffer.mockReturnValue({
      accept: jest.fn().mockResolvedValue(true),
      isAccepting: false,
      error: null,
    });
  });
  
  it('should render the trade list', () => {
    render(<TradeList />);
    
    expect(screen.getByText('Trade Offers')).toBeInTheDocument();
    expect(screen.getByText('Maker')).toBeInTheDocument();
    expect(screen.getByText('You Send')).toBeInTheDocument();
    expect(screen.getByText('You Receive')).toBeInTheDocument();
    expect(screen.getByText('Expiration')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    
    // Check that the trade offers are rendered
    expect(screen.getByText('peer-1...')).toBeInTheDocument();
    expect(screen.getByText('peer-2...')).toBeInTheDocument();
    expect(screen.getByText('peer-3...')).toBeInTheDocument();
    
    // Check that the amounts are formatted correctly
    expect(screen.getByText('1000 RUNE')).toBeInTheDocument();
    expect(screen.getByText('0.50000000 BTC')).toBeInTheDocument();
    expect(screen.getByText('400 RUNE')).toBeInTheDocument();
    expect(screen.getByText('1.00000000 BTC')).toBeInTheDocument();
    expect(screen.getByText('500 RUNE')).toBeInTheDocument();
    expect(screen.getByText('200 ALKANE')).toBeInTheDocument();
    
    // Check that the expired offer is marked as expired
    expect(screen.getByText('Expired')).toBeInTheDocument();
    
    // Check that the accept buttons are rendered
    expect(screen.getAllByText('Accept')).toHaveLength(2); // 2 non-expired offers
    expect(screen.getByText('Accept', { selector: 'button[disabled]' })).toBeInTheDocument(); // 1 expired offer
  });
  
  it('should show a message when there are no trade offers', () => {
    mockUseTradeOffers.mockReturnValue({
      tradeOffers: [],
      isLoading: false,
    } as any);
    
    render(<TradeList />);
    
    expect(screen.getByText('No trade offers available')).toBeInTheDocument();
  });
  
  it('should call accept when accept button is clicked', async () => {
    const mockAccept = jest.fn().mockResolvedValue(true);
    mockUseAcceptTradeOffer.mockReturnValue({
      accept: mockAccept,
      isAccepting: false,
      error: null,
    });
    
    const onAcceptSuccess = jest.fn();
    
    render(<TradeList onAcceptSuccess={onAcceptSuccess} />);
    
    // Click the accept button for the first offer
    fireEvent.click(screen.getAllByText('Accept')[0]);
    
    // Wait for the accept function to be called
    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalledWith('offer-1');
      expect(onAcceptSuccess).toHaveBeenCalledWith('offer-1');
    });
  });
  
  it('should show error when accept fails', async () => {
    const mockAccept = jest.fn().mockRejectedValue(new Error('Failed to accept offer'));
    mockUseAcceptTradeOffer.mockReturnValue({
      accept: mockAccept,
      isAccepting: false,
      error: null,
    });
    
    const onAcceptError = jest.fn();
    
    render(<TradeList onAcceptError={onAcceptError} />);
    
    // Click the accept button for the first offer
    fireEvent.click(screen.getAllByText('Accept')[0]);
    
    // Wait for the accept function to be called
    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalledWith('offer-1');
      expect(onAcceptError).toHaveBeenCalledWith(new Error('Failed to accept offer'));
      expect(screen.getByText('Failed to accept offer')).toBeInTheDocument();
    });
  });
  
  it('should disable the accept button when accepting', async () => {
    mockUseAcceptTradeOffer.mockReturnValue({
      accept: jest.fn().mockResolvedValue(true),
      isAccepting: true,
      error: null,
    });
    
    render(<TradeList />);
    
    // Check that the accept button is disabled
    expect(screen.getByText('Accepting...')).toBeDisabled();
  });
  
  it('should format asset types correctly', () => {
    render(<TradeList />);
    
    // Check that the asset types are formatted correctly
    expect(screen.getByText('1.00000000 BTC')).toBeInTheDocument();
    expect(screen.getByText('1000 RUNE')).toBeInTheDocument();
    expect(screen.getByText('200 ALKANE')).toBeInTheDocument();
  });
  
  it('should format expiration correctly', () => {
    // Mock Date.now to return a fixed value
    const now = 1617235200; // 2021-04-01T00:00:00Z
    jest.spyOn(Date, 'now').mockImplementation(() => now * 1000);
    
    // Create trade offers with different expiration times
    const mockTradeOffersWithExpiry: TradeOffer[] = [
      {
        ...mockTradeOffers[0],
        expiry: now + 30, // 30 seconds from now
      },
      {
        ...mockTradeOffers[1],
        expiry: now + 120, // 2 minutes from now
      },
      {
        ...mockTradeOffers[2],
        expiry: now + 3600, // 1 hour from now
      },
      {
        ...mockTradeOffers[0],
        id: 'offer-4',
        expiry: now + 86400, // 1 day from now
      },
      {
        ...mockTradeOffers[1],
        id: 'offer-5',
        expiry: now - 3600, // 1 hour ago (expired)
      },
    ];
    
    mockUseTradeOffers.mockReturnValue({
      tradeOffers: mockTradeOffersWithExpiry,
      isLoading: false,
    } as any);
    
    render(<TradeList />);
    
    // Check that the expiration times are formatted correctly
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('2m 0s')).toBeInTheDocument();
    expect(screen.getByText('1h 0m')).toBeInTheDocument();
    expect(screen.getByText('1d 0h')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });
  
  it('should mark expired offers as expired', () => {
    render(<TradeList />);
    
    // Check that the expired offer is marked as expired
    const expiredRow = screen.getByText('peer-3...').closest('tr');
    expect(expiredRow).toHaveClass('expired');
    
    // Check that the accept button for the expired offer is disabled
    const expiredButton = screen.getByText('Accept', { selector: 'button[disabled]' });
    expect(expiredButton).toBeDisabled();
  });
});