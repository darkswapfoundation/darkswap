import React from 'react';
import { Button } from 'react-bootstrap';
import { BsSun, BsMoon } from 'react-icons/bs';
import { useTheme } from '../contexts/ThemeContext';

// Theme toggle component
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={theme === 'light' ? 'outline-dark' : 'outline-light'}
      size="sm"
      onClick={toggleTheme}
      className="ms-2"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <BsMoon /> : <BsSun />}
    </Button>
  );
};

export default ThemeToggle;