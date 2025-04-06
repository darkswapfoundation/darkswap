/**
 * ThemeToggle - Component for toggling between light and dark themes
 * 
 * This component provides a button to toggle between light and dark themes.
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export interface ThemeToggleProps {
  /** CSS class name */
  className?: string;
}

/**
 * ThemeToggle component
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { activeTheme, toggleTheme } = useTheme();
  
  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${activeTheme === 'light' ? 'dark' : 'light'} theme`}
    >
      {activeTheme === 'light' ? (
        // Moon icon for dark mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="theme-toggle-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="theme-toggle-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;