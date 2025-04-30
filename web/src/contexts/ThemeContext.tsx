import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

interface ThemeProviderProps {
  defaultTheme?: Theme;
  storageKey?: string;
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  defaultTheme = 'dark',
  storageKey = 'darkswap-theme',
  children,
}) => {
  // Initialize theme from localStorage or defaultTheme
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem(storageKey);
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : defaultTheme;
  });
  
  // Toggle theme
  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  // Set theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  // Update localStorage and document body class when theme changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem(storageKey, theme);
    
    // Update document body class
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        theme === 'light' ? '#ffffff' : '#121220'
      );
    }
  }, [theme, storageKey]);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;