import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: (newMode: ThemeMode) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Get saved theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    return savedTheme || 'dark';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Update theme when mode changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    let resolvedMode: 'light' | 'dark';
    
    if (mode === 'system') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedMode = systemPrefersDark ? 'dark' : 'light';
    } else {
      resolvedMode = mode;
    }
    
    // Add new theme class
    root.classList.add(resolvedMode);
    
    // Save to localStorage
    localStorage.setItem('theme', mode);
    
    // Update isDarkMode state
    setIsDarkMode(resolvedMode === 'dark');
  }, [mode]);

  // Listen for system preference changes if mode is 'system'
  useEffect(() => {
    if (mode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const root = window.document.documentElement;
      const systemPrefersDark = mediaQuery.matches;
      
      root.classList.remove('light', 'dark');
      root.classList.add(systemPrefersDark ? 'dark' : 'light');
      
      setIsDarkMode(systemPrefersDark);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const toggleMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};