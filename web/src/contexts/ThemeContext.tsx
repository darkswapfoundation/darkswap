/**
 * ThemeContext - Context for managing theme
 * 
 * This context provides theme management functionality for the application,
 * including light/dark mode and system preference detection.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  /** Current theme */
  theme: Theme;
  /** Current active theme (light or dark) */
  activeTheme: 'light' | 'dark';
  /** Set theme */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  /** Initial theme */
  initialTheme?: Theme;
  /** Children components */
  children: ReactNode;
}

/**
 * ThemeProvider component
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  initialTheme = 'system',
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light');

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Update active theme
  const updateActiveTheme = (newTheme: Theme) => {
    const computedTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
    setActiveTheme(computedTheme);
    
    // Update document attributes
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', computedTheme);
      
      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          computedTheme === 'dark' ? '#121212' : '#ffffff'
        );
      }
    }
  };

  // Set theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    updateActiveTheme(newTheme);
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(getSystemTheme() === 'light' ? 'dark' : 'light');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme) {
        setThemeState(savedTheme);
        updateActiveTheme(savedTheme);
      } else {
        updateActiveTheme(initialTheme);
      }
    }
  }, [initialTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        updateActiveTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Context value
  const contextValue: ThemeContextType = {
    theme,
    activeTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme hook
 * @returns Theme context
 * @throws Error if used outside of ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;