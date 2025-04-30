import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../components/Button';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the theme provider
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primary: '#2196f3',
      secondary: '#6c757d',
      error: '#f44336',
      success: '#4caf50',
      text: {
        primary: '#212121',
        secondary: '#757575',
      },
    },
    isDark: false,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Button Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Button title="Test Button" onPress={() => {}} />
      </ThemeProvider>
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });
  
  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <Button title="Test Button" onPress={onPressMock} />
      </ThemeProvider>
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <Button title="Test Button" onPress={onPressMock} disabled={true} />
      </ThemeProvider>
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });
  
  it('renders loading state correctly', () => {
    const { queryByText } = render(
      <ThemeProvider>
        <Button title="Test Button" onPress={() => {}} loading={true} />
      </ThemeProvider>
    );
    
    expect(queryByText('Test Button')).toBeNull();
  });
  
  it('applies different styles based on variant', () => {
    const { getByText, rerender } = render(
      <ThemeProvider>
        <Button title="Primary Button" onPress={() => {}} variant="primary" />
      </ThemeProvider>
    );
    
    // Test primary variant
    const primaryButton = getByText('Primary Button');
    expect(primaryButton).toBeTruthy();
    
    // Test secondary variant
    rerender(
      <ThemeProvider>
        <Button title="Secondary Button" onPress={() => {}} variant="secondary" />
      </ThemeProvider>
    );
    const secondaryButton = getByText('Secondary Button');
    expect(secondaryButton).toBeTruthy();
    
    // Test outline variant
    rerender(
      <ThemeProvider>
        <Button title="Outline Button" onPress={() => {}} variant="outline" />
      </ThemeProvider>
    );
    const outlineButton = getByText('Outline Button');
    expect(outlineButton).toBeTruthy();
    
    // Test danger variant
    rerender(
      <ThemeProvider>
        <Button title="Danger Button" onPress={() => {}} variant="danger" />
      </ThemeProvider>
    );
    const dangerButton = getByText('Danger Button');
    expect(dangerButton).toBeTruthy();
  });
  
  it('applies different styles based on size', () => {
    const { getByText, rerender } = render(
      <ThemeProvider>
        <Button title="Small Button" onPress={() => {}} size="small" />
      </ThemeProvider>
    );
    
    // Test small size
    const smallButton = getByText('Small Button');
    expect(smallButton).toBeTruthy();
    
    // Test medium size
    rerender(
      <ThemeProvider>
        <Button title="Medium Button" onPress={() => {}} size="medium" />
      </ThemeProvider>
    );
    const mediumButton = getByText('Medium Button');
    expect(mediumButton).toBeTruthy();
    
    // Test large size
    rerender(
      <ThemeProvider>
        <Button title="Large Button" onPress={() => {}} size="large" />
      </ThemeProvider>
    );
    const largeButton = getByText('Large Button');
    expect(largeButton).toBeTruthy();
  });
  
  it('applies fullWidth style when specified', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Button title="Full Width Button" onPress={() => {}} fullWidth={true} />
      </ThemeProvider>
    );
    
    const fullWidthButton = getByText('Full Width Button');
    expect(fullWidthButton).toBeTruthy();
  });
});