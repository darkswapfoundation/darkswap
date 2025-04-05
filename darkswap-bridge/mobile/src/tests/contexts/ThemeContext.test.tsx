import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

// Mock the useColorScheme hook
jest.mock('react-native', () => {
  const originalModule = jest.requireActual('react-native');
  return {
    ...originalModule,
    useColorScheme: jest.fn(),
  };
});

describe('ThemeContext', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  it('provides default theme values', () => {
    // Mock useColorScheme to return 'light'
    (useColorScheme as jest.Mock).mockReturnValue('light');
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.themeType).toBe('system');
    expect(result.current.isDark).toBe(false);
    expect(result.current.theme).toBeDefined();
    expect(typeof result.current.toggleTheme).toBe('function');
    expect(typeof result.current.setThemeType).toBe('function');
  });
  
  it('uses light theme when themeType is light', () => {
    // Mock useColorScheme to return 'dark' to ensure it's not using system preference
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider initialTheme="light">{children}</ThemeProvider>
    );
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.themeType).toBe('light');
    expect(result.current.isDark).toBe(false);
  });
  
  it('uses dark theme when themeType is dark', () => {
    // Mock useColorScheme to return 'light' to ensure it's not using system preference
    (useColorScheme as jest.Mock).mockReturnValue('light');
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider initialTheme="dark">{children}</ThemeProvider>
    );
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.themeType).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });
  
  it('uses system preference when themeType is system', () => {
    // Mock useColorScheme to return 'dark'
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider initialTheme="system">{children}</ThemeProvider>
    );
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.themeType).toBe('system');
    expect(result.current.isDark).toBe(true);
    
    // Change system preference to light
    act(() => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
    });
    
    // Re-render with new system preference
    const { result: updatedResult } = renderHook(() => useTheme(), { wrapper });
    
    expect(updatedResult.current.themeType).toBe('system');
    expect(updatedResult.current.isDark).toBe(false);
  });
  
  it('toggles theme correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider initialTheme="light">{children}</ThemeProvider>
    );
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Initial state
    expect(result.current.themeType).toBe('light');
    
    // Toggle from light to dark
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.themeType).toBe('dark');
    
    // Toggle from dark to system
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.themeType).toBe('system');
    
    // Toggle from system to light
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.themeType).toBe('light');
  });
  
  it('sets theme type correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Set to light
    act(() => {
      result.current.setThemeType('light');
    });
    
    expect(result.current.themeType).toBe('light');
    expect(result.current.isDark).toBe(false);
    
    // Set to dark
    act(() => {
      result.current.setThemeType('dark');
    });
    
    expect(result.current.themeType).toBe('dark');
    expect(result.current.isDark).toBe(true);
    
    // Set to system
    act(() => {
      result.current.setThemeType('system');
    });
    
    expect(result.current.themeType).toBe('system');
  });
  
  it('throws error when used outside of ThemeProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    // Restore console.error
    console.error = originalError;
  });
});