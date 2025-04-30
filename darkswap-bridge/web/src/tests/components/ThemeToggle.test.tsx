import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../../components/ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the react-bootstrap Button component
jest.mock('react-bootstrap', () => ({
  Button: ({ children, onClick, variant, size, className, 'aria-label': ariaLabel }: any) => (
    <button
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${className}`}
      aria-label={ariaLabel}
      data-testid="theme-toggle-button"
    >
      {children}
    </button>
  ),
}));

// Mock the react-icons components
jest.mock('react-icons/bs', () => ({
  BsSun: () => <span data-testid="sun-icon">Sun</span>,
  BsMoon: () => <span data-testid="moon-icon">Moon</span>,
}));

describe('ThemeToggle', () => {
  test('renders with light theme', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    // Check if the button is rendered
    const button = screen.getByTestId('theme-toggle-button');
    expect(button).toBeInTheDocument();
    
    // Check if the moon icon is rendered (for light theme)
    const moonIcon = screen.getByTestId('moon-icon');
    expect(moonIcon).toBeInTheDocument();
    
    // Check if the sun icon is not rendered
    expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
    
    // Check button classes
    expect(button).toHaveClass('btn-outline-dark');
  });
  
  test('toggles theme when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    // Get the button
    const button = screen.getByTestId('theme-toggle-button');
    
    // Click the button to toggle theme
    fireEvent.click(button);
    
    // Check if the sun icon is rendered (for dark theme)
    const sunIcon = screen.getByTestId('sun-icon');
    expect(sunIcon).toBeInTheDocument();
    
    // Check if the moon icon is not rendered
    expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
    
    // Check button classes
    expect(button).toHaveClass('btn-outline-light');
    
    // Click the button again to toggle back to light theme
    fireEvent.click(button);
    
    // Check if the moon icon is rendered (for light theme)
    const moonIcon = screen.getByTestId('moon-icon');
    expect(moonIcon).toBeInTheDocument();
    
    // Check if the sun icon is not rendered
    expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
    
    // Check button classes
    expect(button).toHaveClass('btn-outline-dark');
  });
});