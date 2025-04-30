import React from 'react';
import { render, screen } from '@testing-library/react';
import { Layout } from '../components/Layout';
import { Outlet } from 'react-router-dom';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Outlet: jest.fn(() => <div data-testid="outlet" />),
  useLocation: jest.fn(() => ({ pathname: '/' })),
}));

// Mock the Navigation component
jest.mock('../components/Navigation', () => ({
  Navigation: () => <nav data-testid="navigation" />,
}));

// Mock the Footer component
jest.mock('../components/Footer', () => ({
  Footer: () => <footer data-testid="footer" />,
}));

describe('Layout', () => {
  it('should render the layout with navigation, outlet, and footer', () => {
    render(<Layout />);
    
    // Check that the layout container is rendered
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    
    // Check that the navigation is rendered
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    
    // Check that the outlet is rendered
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    
    // Check that the footer is rendered
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
  
  it('should apply the correct styles', () => {
    render(<Layout />);
    
    // Check that the layout container has the correct styles
    const layoutContainer = screen.getByTestId('layout');
    expect(layoutContainer).toHaveClass('layout');
    
    // Check that the main content container has the correct styles
    const mainContent = screen.getByTestId('main-content');
    expect(mainContent).toHaveClass('main-content');
  });
  
  it('should render the outlet content', () => {
    // Mock the Outlet component to render specific content
    (Outlet as jest.Mock).mockImplementation(() => <div data-testid="custom-outlet">Custom Outlet Content</div>);
    
    render(<Layout />);
    
    // Check that the custom outlet content is rendered
    expect(screen.getByTestId('custom-outlet')).toBeInTheDocument();
    expect(screen.getByText('Custom Outlet Content')).toBeInTheDocument();
  });
});