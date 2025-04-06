/**
 * ErrorToast.test.tsx - Tests for the ErrorToast component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ErrorToast,
  ErrorToastContainer,
  ErrorToastManager,
  useErrorToast,
  ErrorToastContext,
} from '../../components/ErrorToast';
import { DarkSwapError, ErrorCode } from '../../utils/ErrorHandling';

describe('ErrorToast', () => {
  it('should render an error toast', () => {
    const error = new Error('Test error');
    const onRemove = jest.fn();
    
    render(
      <ErrorToast
        id="test-toast"
        error={error}
        onRemove={onRemove}
      />
    );
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
  
  it('should call onRemove when dismiss button is clicked', () => {
    const error = new Error('Test error');
    const onRemove = jest.fn();
    const onDismiss = jest.fn();
    
    render(
      <ErrorToast
        id="test-toast"
        error={error}
        onRemove={onRemove}
        onDismiss={onDismiss}
      />
    );
    
    fireEvent.click(screen.getByText('×'));
    
    expect(onRemove).toHaveBeenCalledWith('test-toast');
    expect(onDismiss).toHaveBeenCalled();
  });
  
  it('should auto-dismiss after timeout', async () => {
    jest.useFakeTimers();
    
    const error = new Error('Test error');
    const onRemove = jest.fn();
    
    render(
      <ErrorToast
        id="test-toast"
        error={error}
        onRemove={onRemove}
        autoDismiss={true}
        autoDismissTimeout={1000}
      />
    );
    
    // Fast-forward timers
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith('test-toast');
    });
    
    jest.useRealTimers();
  });
});

describe('ErrorToastContainer', () => {
  it('should create a portal container', () => {
    render(<ErrorToastContainer />);
    
    const container = document.getElementById('error-toast-container');
    
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('error-toast-container');
  });
  
  it('should apply custom class name', () => {
    render(<ErrorToastContainer className="custom-class" />);
    
    const container = document.getElementById('error-toast-container');
    
    expect(container).toHaveClass('error-toast-container');
    expect(container).toHaveClass('custom-class');
  });
  
  it('should remove container on unmount', () => {
    const { unmount } = render(<ErrorToastContainer />);
    
    const container = document.getElementById('error-toast-container');
    expect(container).toBeInTheDocument();
    
    unmount();
    
    expect(document.getElementById('error-toast-container')).not.toBeInTheDocument();
  });
});

describe('ErrorToastManager', () => {
  it('should render children', () => {
    render(
      <ErrorToastManager>
        <div>Test content</div>
      </ErrorToastManager>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('should create toast container', () => {
    render(<ErrorToastManager />);
    
    const container = document.getElementById('error-toast-container');
    
    expect(container).toBeInTheDocument();
  });
  
  it('should provide context value', () => {
    const TestComponent: React.FC = () => {
      const { addToast } = useErrorToast();
      
      return (
        <button onClick={() => addToast({ error: new Error('Test error') })}>
          Add toast
        </button>
      );
    };
    
    render(
      <ErrorToastManager>
        <TestComponent />
      </ErrorToastManager>
    );
    
    fireEvent.click(screen.getByText('Add toast'));
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
  
  it('should add and remove toasts', () => {
    const TestComponent: React.FC = () => {
      const { addToast, removeToast } = useErrorToast();
      const [toastId, setToastId] = React.useState<string | null>(null);
      
      return (
        <div>
          <button
            onClick={() => {
              const id = addToast({ error: new Error('Test error') });
              setToastId(id);
            }}
          >
            Add toast
          </button>
          
          <button
            onClick={() => {
              if (toastId) {
                removeToast(toastId);
                setToastId(null);
              }
            }}
          >
            Remove toast
          </button>
        </div>
      );
    };
    
    render(
      <ErrorToastManager>
        <TestComponent />
      </ErrorToastManager>
    );
    
    // Add toast
    fireEvent.click(screen.getByText('Add toast'));
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    // Remove toast
    fireEvent.click(screen.getByText('Remove toast'));
    
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });
});

describe('useErrorToast', () => {
  it('should throw error when used outside of ErrorToastManager', () => {
    // Suppress console errors during test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    const TestComponent: React.FC = () => {
      useErrorToast();
      return null;
    };
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useErrorToast must be used within an ErrorToastManager');
    
    console.error = originalConsoleError;
  });
  
  it('should return context value when used inside ErrorToastManager', () => {
    const TestComponent: React.FC = () => {
      const context = useErrorToast();
      
      return (
        <div>
          <div>Has context: {context ? 'yes' : 'no'}</div>
        </div>
      );
    };
    
    render(
      <ErrorToastManager>
        <TestComponent />
      </ErrorToastManager>
    );
    
    expect(screen.getByText('Has context: yes')).toBeInTheDocument();
  });
});

describe('ErrorToastContext', () => {
  it('should be defined', () => {
    expect(ErrorToastContext).toBeDefined();
  });
  
  it('should have undefined as default value', () => {
    expect(ErrorToastContext.Provider).toBeDefined();
    expect(ErrorToastContext.Consumer).toBeDefined();
    expect(ErrorToastContext.displayName).toBeUndefined();
    
    // Create a component that consumes the context
    const TestComponent: React.FC = () => {
      const context = React.useContext(ErrorToastContext);
      
      return (
        <div>
          <div>Context is undefined: {context === undefined ? 'yes' : 'no'}</div>
        </div>
      );
    };
    
    render(<TestComponent />);
    
    expect(screen.getByText('Context is undefined: yes')).toBeInTheDocument();
  });
});