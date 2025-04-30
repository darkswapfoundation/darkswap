/**
 * ErrorBoundary.test.tsx - Tests for the ErrorBoundary component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary, { withErrorBoundary } from '../../components/ErrorBoundary';
import { reportError } from '../../utils/ErrorReporting';

// Mock reportError
jest.mock('../../utils/ErrorReporting', () => ({
  reportError: jest.fn().mockResolvedValue(undefined),
}));

// Component that throws an error
const ErrorComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console errors during tests
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    console.error = jest.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });
  
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('should render error display when there is an error', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
  
  it('should render fallback when there is an error and fallback is provided', () => {
    render(
      <ErrorBoundary fallback={<div>Fallback content</div>}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Fallback content')).toBeInTheDocument();
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });
  
  it('should render fallback function when there is an error and fallback is a function', () => {
    render(
      <ErrorBoundary
        fallback={(error, resetError) => (
          <div>
            <div>Fallback function: {error.message}</div>
            <button onClick={resetError}>Reset</button>
          </div>
        )}
      >
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Fallback function: Test error')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });
  
  it('should reset error when retry button is clicked', () => {
    const TestComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      return (
        <ErrorBoundary>
          {shouldThrow ? (
            <ErrorComponent />
          ) : (
            <div>
              <div>No error</div>
              <button onClick={() => setShouldThrow(true)}>Throw again</button>
            </div>
          )}
        </ErrorBoundary>
      );
    };
    
    render(<TestComponent />);
    
    // Initially, there is an error
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    // Click retry button
    fireEvent.click(screen.getByText('Retry'));
    
    // Now, there is no error
    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    
    // Throw again
    fireEvent.click(screen.getByText('Throw again'));
    
    // Error is back
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
  
  it('should report error when reportErrors is true', () => {
    render(
      <ErrorBoundary reportErrors={true} componentName="TestComponent">
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(reportError).toHaveBeenCalled();
  });
  
  it('should not report error when reportErrors is false', () => {
    render(
      <ErrorBoundary reportErrors={false}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(reportError).not.toHaveBeenCalled();
  });
  
  it('should call onError when there is an error', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
  });
  
  it('should show error details when showErrorDetails is true', () => {
    render(
      <ErrorBoundary showErrorDetails={true}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Hide Details')).toBeInTheDocument();
  });
  
  it('should not show error details when showErrorDetails is false', () => {
    render(
      <ErrorBoundary showErrorDetails={false}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('Hide Details')).not.toBeInTheDocument();
    expect(screen.getByText('Show Details')).toBeInTheDocument();
  });
  
  it('should show retry button when showRetry is true', () => {
    render(
      <ErrorBoundary showRetry={true}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
  
  it('should not show retry button when showRetry is false', () => {
    render(
      <ErrorBoundary showRetry={false}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });
});

describe('withErrorBoundary', () => {
  // Suppress console errors during tests
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    console.error = jest.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });
  
  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(ErrorComponent, {
      componentName: 'WrappedErrorComponent',
    });
    
    render(<WrappedComponent />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
  
  it('should pass props to wrapped component', () => {
    const TestComponent: React.FC<{ message: string }> = ({ message }) => {
      return <div>{message}</div>;
    };
    
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent message="Hello, world!" />);
    
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });
  
  it('should use component display name', () => {
    const TestComponent: React.FC = () => {
      return <div>Test component</div>;
    };
    
    TestComponent.displayName = 'CustomDisplayName';
    
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(CustomDisplayName)');
  });
});