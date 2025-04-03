import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TradeForm } from '../components/TradeForm';
import { useBitcoinBalance, useRuneBalance, useAlkaneBalance } from '../hooks/useTradeHooks';
import { useCreateTradeOffer } from '../hooks/useTradeHooks';

// Mock the hooks
jest.mock('../hooks/useTradeHooks', () => ({
  useBitcoinBalance: jest.fn(),
  useRuneBalance: jest.fn(),
  useAlkaneBalance: jest.fn(),
  useCreateTradeOffer: jest.fn(),
}));

const mockUseBitcoinBalance = useBitcoinBalance as jest.MockedFunction<typeof useBitcoinBalance>;
const mockUseRuneBalance = useRuneBalance as jest.MockedFunction<typeof useRuneBalance>;
const mockUseAlkaneBalance = useAlkaneBalance as jest.MockedFunction<typeof useAlkaneBalance>;
const mockUseCreateTradeOffer = useCreateTradeOffer as jest.MockedFunction<typeof useCreateTradeOffer>;

describe('TradeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock values
    mockUseBitcoinBalance.mockReturnValue({ balance: 100000000, isLoading: false });
    mockUseRuneBalance.mockReturnValue({ balance: 1000, isLoading: false });
    mockUseAlkaneBalance.mockReturnValue({ balance: 500, isLoading: false });
    mockUseCreateTradeOffer.mockReturnValue({ create: jest.fn().mockResolvedValue('offer-id'), isCreating: false, error: null });
  });
  
  it('should render the form', () => {
    render(<TradeForm />);
    
    expect(screen.getByText('Create Trade Offer')).toBeInTheDocument();
    expect(screen.getByLabelText('You Send:')).toBeInTheDocument();
    expect(screen.getByLabelText('You Receive:')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount:')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount:')).toBeInTheDocument();
    expect(screen.getByLabelText('Expiration (seconds):')).toBeInTheDocument();
    expect(screen.getByText('Create Offer')).toBeInTheDocument();
  });
  
  it('should update form state when inputs change', () => {
    render(<TradeForm />);
    
    // Change maker asset type
    fireEvent.change(screen.getByLabelText('You Send:').closest('select')!, {
      target: { value: 'rune' },
    });
    
    // Change maker asset ID
    const makerAssetIdInput = screen.getByPlaceholderText('Rune ID');
    fireEvent.change(makerAssetIdInput, {
      target: { value: 'rune-id' },
    });
    
    // Change maker amount
    fireEvent.change(screen.getByLabelText('Amount:'), {
      target: { value: '500' },
    });
    
    // Change taker asset type
    fireEvent.change(screen.getByLabelText('You Receive:').closest('select')!, {
      target: { value: 'alkane' },
    });
    
    // Change taker asset ID
    const takerAssetIdInput = screen.getByPlaceholderText('Alkane ID');
    fireEvent.change(takerAssetIdInput, {
      target: { value: 'alkane-id' },
    });
    
    // Change taker amount
    const takerAmountInput = screen.getAllByLabelText('Amount:')[1];
    fireEvent.change(takerAmountInput, {
      target: { value: '250' },
    });
    
    // Change expiration
    fireEvent.change(screen.getByLabelText('Expiration (seconds):'), {
      target: { value: '7200' },
    });
    
    // Check that the form state has been updated
    expect(screen.getByLabelText('You Send:').closest('select')).toHaveValue('rune');
    expect(makerAssetIdInput).toHaveValue('rune-id');
    expect(screen.getByLabelText('Amount:')).toHaveValue('500');
    expect(screen.getByLabelText('You Receive:').closest('select')).toHaveValue('alkane');
    expect(takerAssetIdInput).toHaveValue('alkane-id');
    expect(takerAmountInput).toHaveValue('250');
    expect(screen.getByLabelText('Expiration (seconds):')).toHaveValue('7200');
  });
  
  it('should show asset ID input when rune or alkane is selected', () => {
    render(<TradeForm />);
    
    // Initially, no asset ID inputs should be visible
    expect(screen.queryByPlaceholderText('Rune ID')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Alkane ID')).not.toBeInTheDocument();
    
    // Change maker asset type to rune
    fireEvent.change(screen.getByLabelText('You Send:').closest('select')!, {
      target: { value: 'rune' },
    });
    
    // Rune ID input should be visible
    expect(screen.getByPlaceholderText('Rune ID')).toBeInTheDocument();
    
    // Change maker asset type to alkane
    fireEvent.change(screen.getByLabelText('You Send:').closest('select')!, {
      target: { value: 'alkane' },
    });
    
    // Alkane ID input should be visible
    expect(screen.getByPlaceholderText('Alkane ID')).toBeInTheDocument();
    
    // Change maker asset type to bitcoin
    fireEvent.change(screen.getByLabelText('You Send:').closest('select')!, {
      target: { value: 'bitcoin' },
    });
    
    // No asset ID inputs should be visible
    expect(screen.queryByPlaceholderText('Rune ID')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Alkane ID')).not.toBeInTheDocument();
  });
  
  it('should call create when form is submitted', async () => {
    const mockCreate = jest.fn().mockResolvedValue('offer-id');
    mockUseCreateTradeOffer.mockReturnValue({ create: mockCreate, isCreating: false, error: null });
    
    const onSuccess = jest.fn();
    
    render(<TradeForm onSuccess={onSuccess} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('You Send:').closest('select')!, {
      target: { value: 'bitcoin' },
    });
    
    fireEvent.change(screen.getByLabelText('Amount:'), {
      target: { value: '0.01' },
    });
    
    fireEvent.change(screen.getByLabelText('You Receive:').closest('select')!, {
      target: { value: 'rune' },
    });
    
    const takerAssetIdInput = screen.getByPlaceholderText('Rune ID');
    fireEvent.change(takerAssetIdInput, {
      target: { value: 'rune-id' },
    });
    
    const takerAmountInput = screen.getAllByLabelText('Amount:')[1];
    fireEvent.change(takerAmountInput, {
      target: { value: '1000' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Offer'));
    
    // Wait for the form submission to complete
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        { type: 'bitcoin' },
        1000000, // 0.01 BTC in satoshis
        { type: 'rune', id: 'rune-id' },
        1000
      );
      expect(onSuccess).toHaveBeenCalledWith('offer-id');
    });
  });
  
  it('should show error when form submission fails', async () => {
    const mockCreate = jest.fn().mockRejectedValue(new Error('Failed to create offer'));
    mockUseCreateTradeOffer.mockReturnValue({ create: mockCreate, isCreating: false, error: null });
    
    const onError = jest.fn();
    
    render(<TradeForm onError={onError} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Amount:'), {
      target: { value: '0.01' },
    });
    
    const takerAmountInput = screen.getAllByLabelText('Amount:')[1];
    fireEvent.change(takerAmountInput, {
      target: { value: '1000' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Offer'));
    
    // Wait for the form submission to complete
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(new Error('Failed to create offer'));
    });
  });
  
  it('should disable the submit button when creating', () => {
    mockUseCreateTradeOffer.mockReturnValue({ create: jest.fn(), isCreating: true, error: null });
    
    render(<TradeForm />);
    
    expect(screen.getByText('Creating...').closest('button')).toBeDisabled();
  });
  
  it('should validate form inputs', async () => {
    const mockCreate = jest.fn().mockResolvedValue('offer-id');
    mockUseCreateTradeOffer.mockReturnValue({ create: mockCreate, isCreating: false, error: null });
    
    render(<TradeForm />);
    
    // Submit the form without filling it out
    fireEvent.click(screen.getByText('Create Offer'));
    
    // Wait for validation
    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
      expect(screen.getByText('Please enter an amount')).toBeInTheDocument();
    });
    
    // Fill out the form with invalid values
    fireEvent.change(screen.getByLabelText('Amount:'), {
      target: { value: '-0.01' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Offer'));
    
    // Wait for validation
    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
      expect(screen.getByText('Amount must be positive')).toBeInTheDocument();
    });
  });
  
  it('should check balance before submitting', async () => {
    mockUseBitcoinBalance.mockReturnValue({ balance: 500000, isLoading: false }); // 0.005 BTC
    
    const mockCreate = jest.fn().mockResolvedValue('offer-id');
    mockUseCreateTradeOffer.mockReturnValue({ create: mockCreate, isCreating: false, error: null });
    
    render(<TradeForm />);
    
    // Fill out the form with an amount greater than the balance
    fireEvent.change(screen.getByLabelText('Amount:'), {
      target: { value: '0.01' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Offer'));
    
    // Wait for validation
    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
      expect(screen.getByText('Insufficient balance')).toBeInTheDocument();
    });
  });
});