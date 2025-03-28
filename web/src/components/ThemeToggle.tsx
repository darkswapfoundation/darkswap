import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Icons
import {
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors duration-200 ${className} ${
        theme === 'dark'
          ? 'bg-twilight-dark text-yellow-400 hover:bg-twilight-darker'
          : 'bg-gray-200 text-indigo-600 hover:bg-gray-300'
      }`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;