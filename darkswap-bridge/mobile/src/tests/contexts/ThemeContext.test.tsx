import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe.skip('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides default theme state', async () => {
    // Mock AsyncStorage to return null (no saved theme)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useTheme(), { wrapper });

    // Wait for the useEffect to complete
    await waitForNextUpdate();

    expect(result.current).toEqual(
      expect.objectContaining({
        isDark: false,
        theme: expect.any(Object),
        toggleTheme: expect.any(Function),
      })
    );
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('theme');
  });

  it('loads saved theme from AsyncStorage', async () => {
    // Mock AsyncStorage to return 'dark'
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('dark');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useTheme(), { wrapper });

    // Wait for the useEffect to complete
    await waitForNextUpdate();

    expect(result.current.isDark).toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('theme');
  });

  it('toggles theme from light to dark', async () => {
    // Mock AsyncStorage to return null (default to light theme)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useTheme(), { wrapper });

    // Wait for the useEffect to complete
    await waitForNextUpdate();

    expect(result.current.isDark).toBe(false);

    // Toggle theme
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDark).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('toggles theme from dark to light', async () => {
    // Mock AsyncStorage to return 'dark'
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('dark');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useTheme(), { wrapper });

    // Wait for the useEffect to complete
    await waitForNextUpdate();

    expect(result.current.isDark).toBe(true);

    // Toggle theme
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDark).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('provides different theme objects based on isDark', async () => {
    // Mock AsyncStorage to return null (default to light theme)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useTheme(), { wrapper });

    // Wait for the useEffect to complete
    await waitForNextUpdate();

    const lightTheme = result.current.theme;

    // Toggle theme
    act(() => {
      result.current.toggleTheme();
    });

    const darkTheme = result.current.theme;

    // Themes should be different objects
    expect(lightTheme).not.toEqual(darkTheme);
    
    // Light theme should have light colors
    expect(lightTheme.background).not.toBe(darkTheme.background);
    expect(lightTheme.text).not.toBe(darkTheme.text);
  });
});