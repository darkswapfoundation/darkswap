/**
 * ErrorDisplay.test.tsx - Tests for the ErrorDisplay component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorDisplay from '../../components/ErrorDisplay';
import { DarkSwapError, ErrorCode } from '../../utils/ErrorHandling';

describe('ErrorDisplay', () => {
  it('should render an error message', () => {
    const error = new Error('Test error');
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
  
  it('should render a DarkSwapError with code', () => {
    const error = new DarkSwapError('Test error', ErrorCode.NotInitialized);
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText('DarkSwapError')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText(`Error Code: ${ErrorCode.NotInitialized}`)).toBeInTheDocument();
  });
  
  it('should render error details when showDetails is true', () => {
    const error = new DarkSwapError('Test error', ErrorCode.NotInitialized, { foo: 'bar' });
    
    render(<ErrorDisplay error={error} showDetails={true} />);
    
    expect(screen.getByText('Hide Details')).toBeInTheDocument();
    expect(screen.getByText(JSON.stringify({ foo: 'bar' }, null, 2))).toBeInTheDocument();
  });
  
  it('should toggle error details when details button is clicked', () => {
    const error = new DarkSwapError('Test error', ErrorCode.NotInitialized, { foo: 'bar' });
    
    render(<ErrorDisplay error={error} />);
    
    // Initially, details are hidden
    expect(screen.getByText('Show Details')).toBeInTheDocument();
    expect(screen.queryByText(JSON.stringify({ foo: 'bar' }, null, 2))).not.toBeInTheDocument();
    
    // Click to show details
    fireEvent.click(screen.getByText('Show Details'));
    
    expect(screen.getByText('Hide Details')).toBeInTheDocument();
    expect(screen.getByText(JSON.stringify({ foo: 'bar' }, null, 2))).toBeInTheDocument();
    
    // Click to hide details
    fireEvent.click(screen.getByText('Hide Details'));
    
    expect(screen.getByText('Show Details')).toBeInTheDocument();
    expect(screen.queryByText(JSON.stringify({ foo: 'bar' }, null, 2))).not.toBeInTheDocument();
  });
  
  it('should call onDismiss when dismiss button is clicked', () => {
    const error = new Error('Test error');
    const onDismiss = jest.fn();
    
    render(<ErrorDisplay error={error} onDismiss={onDismiss} />);
    
    fireEvent.click(screen.getByText('×'));
    
    expect(onDismiss).toHaveBeenCalled();
  });
  
  it('should call onRetry when retry button is clicked', () => {
    const error = new Error('Test error');
    const onRetry = jest.fn();
    
    render(<ErrorDisplay error={error} showRetry={true} onRetry={onRetry} />);
    
    fireEvent.click(screen.getByText('Retry'));
    
    expect(onRetry).toHaveBeenCalled();
  });
  
  it('should not render retry button when showRetry is false', () => {
    const error = new Error('Test error');
    
    render(<ErrorDisplay error={error} showRetry={false} />);
    
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });
  
  it('should auto-dismiss after timeout', async () => {
    jest.useFakeTimers();
    
    const error = new Error('Test error');
    const onDismiss = jest.fn();
    
    render(
      <ErrorDisplay
        error={error}
        autoDismiss={true}
        autoDismissTimeout={1000}
        onDismiss={onDismiss}
      />
    );
    
    // Fast-forward timers
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });
    
    jest.useRealTimers();
  });
  
  it('should not auto-dismiss when autoDismiss is false', async () => {
    jest.useFakeTimers();
    
    const error = new Error('Test error');
    const onDismiss = jest.fn();
    
    render(
      <ErrorDisplay
        error={error}
        autoDismiss={false}
        autoDismissTimeout={1000}
        onDismiss={onDismiss}
      />
    );
    
    // Fast-forward timers
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(onDismiss).not.toHaveBeenCalled();
    });
    
    jest.useRealTimers();
  });
  
  it('should apply the correct severity class based on error code', () => {
    // Critical error
    const criticalError = new DarkSwapError('Critical error', ErrorCode.WasmLoadFailed);
    const { container: criticalContainer, unmount: unmountCritical } = render(
      <ErrorDisplay error={criticalError} />
    );
    expect(criticalContainer.querySelector('.error-display.critical')).toBeInTheDocument();
    unmountCritical();
    
    // Error error
    const errorError = new DarkSwapError('Error error', ErrorCode.OrderCreationFailed);
    const { container: errorContainer, unmount: unmountError } = render(
      <ErrorDisplay error={errorError} />
    );
    expect(errorContainer.querySelector('.error-display.error')).toBeInTheDocument();
    unmountError();
    
    // Warning error
    const warningError = new DarkSwapError('Warning error', ErrorCode.OrderNotFound);
    const { container: warningContainer, unmount: unmountWarning } = render(
      <ErrorDisplay error={warningError} />
    );
    expect(warningContainer.querySelector('.error-display.warning')).toBeInTheDocument();
    unmountWarning();
    
    // Info error
    const infoError = new DarkSwapError('Info error', ErrorCode.AlreadyInitialized);
    const { container: infoContainer } = render(
      <ErrorDisplay error={infoError} />
    );
    expect(infoContainer.querySelector('.error-display.info')).toBeInTheDocument();
  });
  
  it('should not render anything when error is null', () => {
    const { container } = render(<ErrorDisplay error={null} />);
    
    expect(container.firstChild).toBeNull();
  });
});