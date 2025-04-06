/**
 * ErrorHandlingUI.test.tsx - Integration tests for error handling UI components
 * 
 * This file contains integration tests for the error handling UI components,
 * testing how they work together in a realistic scenario.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorToastManager, useErrorToast } from '../../components/ErrorToast';
import ErrorBoundary from '../../components/ErrorBoundary';
import { DarkSwapError, ErrorCode } from '../../utils/ErrorHandling';
import { reportError } from '../../utils/ErrorReporting';

// Mock reportError
jest.mock('../../utils/ErrorReporting', () => ({
  reportError: jest.fn().mockResolvedValue(undefined),
}));

// Test component that throws an error
const ErrorComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new DarkSwapError('Test error', ErrorCode.Unknown);
  }
  
  return <div>No error</div>;
};

// Test component that uses error toast
const ToastComponent: React.FC = () => {
  const { addToast } = useErrorToast();
  
  const handleClick = () => {
    addToast({
      error: new DarkSwapError('Toast error', ErrorCode.Unknown),
      showDetails: true,
      autoDismiss: true,
      autoDismissTimeout: 2000,
    });
  };
  
  return (
    <button onClick={handleClick}>Show error toast</button>
  );
};

describe('Error Handling UI Integration', () => {
  // Suppress console errors during tests
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    console.error = jest.fn();
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });
  
  it('should catch errors and display error boundary', () => {
    render(
      <ErrorToastManager>
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      </ErrorToastManager>
    );
    
    // Error boundary should catch the error and display it
    expect(screen.getByText('DarkSwapError')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    // Error should be reported
    expect(reportError).toHaveBeenCalled();
  });
  
  it('should display error toast when triggered', async () => {
    render(
      <ErrorToastManager>
        <ToastComponent />
      </ErrorToastManager>
    );
    
    // Click the button to show error toast
    fireEvent.click(screen.getByText('Show error toast'));
    
    // Error toast should be displayed
    expect(screen.getByText('DarkSwapError')).toBeInTheDocument();
    expect(screen.getByText('Toast error')).toBeInTheDocument();
    
    // Error should not be reported (toasts don't report errors by default)
    expect(reportError).not.toHaveBeenCalled();
  });
  
  it('should reset error boundary when retry button is clicked', () => {
    const TestComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      React.useEffect(() => {
        // Set up a listener for the retry button
        const handleRetry = () => {
          setShouldThrow(false);
        };
        
        // Add event listener to document
        document.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).textContent === 'Retry') {
            handleRetry();
          }
        });
      }, []);
      
      return (
        <ErrorBoundary>
          {shouldThrow ? (
            <ErrorComponent />
          ) : (
            <div>Error resolved</div>
          )}
        </ErrorBoundary>
      );
    };
    
    render(
      <ErrorToastManager>
        <TestComponent />
      </ErrorToastManager>
    );
    
    // Error boundary should catch the error and display it
    expect(screen.getByText('DarkSwapError')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    // Click retry button
    fireEvent.click(screen.getByText('Retry'));
    
    // Error should be resolved
    expect(screen.getByText('Error resolved')).toBeInTheDocument();
  });
  
  it('should auto-dismiss error toast after timeout', async () => {
    jest.useFakeTimers();
    
    render(
      <ErrorToastManager>
        <ToastComponent />
      </ErrorToastManager>
    );
    
    // Click the button to show error toast
    fireEvent.click(screen.getByText('Show error toast'));
    
    // Error toast should be displayed
    expect(screen.getByText('DarkSwapError')).toBeInTheDocument();
    expect(screen.getByText('Toast error')).toBeInTheDocument();
    
    // Fast-forward timers
    jest.advanceTimersByTime(2000);
    
    // Wait for toast to be removed
    await waitFor(() => {
      expect(screen.queryByText('DarkSwapError')).not.toBeInTheDocument();
      expect(screen.queryByText('Toast error')).not.toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });
  
  it('should handle multiple error toasts', () => {
    const MultipleToastComponent: React.FC = () => {
      const { addToast } = useErrorToast();
      
      const handleClick1 = () => {
        addToast({
          error: new DarkSwapError('Toast error 1', ErrorCode.Unknown),
          autoDismiss: false,
        });
      };
      
      const handleClick2 = () => {
        addToast({
          error: new DarkSwapError('Toast error 2', ErrorCode.NotInitialized),
          autoDismiss: false,
        });
      };
      
      return (
        <div>
          <button onClick={handleClick1}>Show error toast 1</button>
          <button onClick={handleClick2}>Show error toast 2</button>
        </div>
      );
    };
    
    render(
      <ErrorToastManager>
        <MultipleToastComponent />
      </ErrorToastManager>
    );
    
    // Click the first button to show error toast 1
    fireEvent.click(screen.getByText('Show error toast 1'));
    
    // Error toast 1 should be displayed
    expect(screen.getByText('Toast error 1')).toBeInTheDocument();
    
    // Click the second button to show error toast 2
    fireEvent.click(screen.getByText('Show error toast 2'));
    
    // Both error toasts should be displayed
    expect(screen.getByText('Toast error 1')).toBeInTheDocument();
    expect(screen.getByText('Toast error 2')).toBeInTheDocument();
  });
  
  it('should handle nested error boundaries', () => {
    const NestedComponent: React.FC = () => {
      return (
        <ErrorBoundary componentName="Outer">
          <div>Outer content</div>
          <ErrorBoundary componentName="Inner">
            <ErrorComponent />
          </ErrorBoundary>
        </ErrorBoundary>
      );
    };
    
    render(
      <ErrorToastManager>
        <NestedComponent />
      </ErrorToastManager>
    );
    
    // Inner error boundary should catch the error
    expect(screen.getByText('DarkSwapError')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    // Outer content should still be visible
    expect(screen.getByText('Outer content')).toBeInTheDocument();
    
    // Error should be reported once
    expect(reportError).toHaveBeenCalledTimes(1);
  });
  
  it('should handle error boundary and error toast together', () => {
    const CombinedComponent: React.FC = () => {
      const { addToast } = useErrorToast();
      
      const handleClick = () => {
        addToast({
          error: new DarkSwapError('Toast error', ErrorCode.Unknown),
          autoDismiss: false,
        });
      };
      
      return (
        <ErrorBoundary componentName="Combined">
          <div>
            <button onClick={handleClick}>Show error toast</button>
            <ErrorComponent />
          </div>
        </ErrorBoundary>
      );
    };
    
    render(
      <ErrorToastManager>
        <CombinedComponent />
      </ErrorToastManager>
    );
    
    // Error boundary should catch the error
    expect(screen.getByText('DarkSwapError')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    // Error should be reported
    expect(reportError).toHaveBeenCalled();
  });
});