import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeType } from '../utils/types';

// Define light theme colors
const lightTheme = {
  primary: '#2196f3',
  secondary: '#6c757d',
  background: '#ffffff',
  surface: '#f5f5f5',
  error: '#f44336',
  warning: '#ff9800',
  success: '#4caf50',
  info: '#2196f3',
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#9e9e9e',
    hint: '#9e9e9e',
  },
  border: '#e0e0e0',
  divider: '#e0e0e0',
  elevation: {
    0: 'transparent',
    1: 'rgba(0, 0, 0, 0.05)',
    2: 'rgba(0, 0, 0, 0.07)',
    3: 'rgba(0, 0, 0, 0.08)',
    4: 'rgba(0, 0, 0, 0.09)',
    5: 'rgba(0, 0, 0, 0.1)',
  },
  chart: {
    grid: '#e0e0e0',
    axis: '#9e9e9e',
    positive: '#4caf50',
    negative: '#f44336',
  },
};

// Define dark theme colors
const darkTheme = {
  primary: '#3f51b5',
  secondary: '#6c757d',
  background: '#121212',
  surface: '#1e1e1e',
  error: '#b71c1c',
  warning: '#ff8f00',
  success: '#1b5e20',
  info: '#0d47a1',
  text: {
    primary: '#ffffff',
    secondary: '#b0bec5',
    disabled: '#78909c',
    hint: '#78909c',
  },
  border: '#424242',
  divider: '#424242',
  elevation: {
    0: 'transparent',
    1: 'rgba(255, 255, 255, 0.05)',
    2: 'rgba(255, 255, 255, 0.07)',
    3: 'rgba(255, 255, 255, 0.08)',
    4: 'rgba(255, 255, 255, 0.09)',
    5: 'rgba(255, 255, 255, 0.1)',
  },
  chart: {
    grid: '#424242',
    axis: '#78909c',
    positive: '#4caf50',
    negative: '#f44336',
  },
};

// Define theme interface
interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    hint: string;
  };
  border: string;
  divider: string;
  elevation: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
  chart: {
    grid: string;
    axis: string;
    positive: string;
    negative: string;
  };
}

// Define theme context interface
interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  isDark: boolean;
  setThemeType: (themeType: ThemeType) => void;
  toggleTheme: () => void;
}

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeType;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'system',
}) => {
  // Get system color scheme
  const colorScheme = useColorScheme();
  
  // State for theme type
  const [themeType, setThemeType] = useState<ThemeType>(initialTheme);
  
  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // In a real app, you would use AsyncStorage
        // const savedTheme = await AsyncStorage.getItem('theme');
        // if (savedTheme) {
        //   setThemeType(savedTheme as ThemeType);
        // }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Save theme to storage when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        // In a real app, you would use AsyncStorage
        // await AsyncStorage.setItem('theme', themeType);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };
    
    saveTheme();
  }, [themeType]);
  
  // Determine if dark mode is active
  const isDark = themeType === 'dark' || (themeType === 'system' && colorScheme === 'dark');
  
  // Get current theme
  const theme = isDark ? darkTheme : lightTheme;
  
  // Toggle theme
  const toggleTheme = () => {
    setThemeType(prevTheme => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light';
    });
  };
  
  // Context value
  const value: ThemeContextType = {
    theme,
    themeType,
    isDark,
    setThemeType,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for using theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};