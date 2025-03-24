import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import WalletConnect from './WalletConnect';

// Icons
import {
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const location = useLocation();
  const { mode, toggleMode } = useTheme();
  const { isConnected } = useWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const navLinks = [
    { name: 'Trade', path: '/trade' },
    { name: 'Orders', path: '/orders' },
    { name: 'Vault', path: '/vault' },
    { name: 'About', path: '/about' },
    { name: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-twilight-primary bg-opacity-80 backdrop-blur-md border-b border-twilight-accent sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="font-display font-bold text-2xl"
            >
              <span className="text-white">Dark</span>
              <span className="neon-text-blue">Swap</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'bg-twilight-accent text-white'
                    : 'text-gray-400 hover:text-white hover:bg-twilight-dark'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => toggleMode(mode === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {mode === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>

            {/* Wallet Connect */}
            <WalletConnect
              onConnect={(address) => console.log('Connected:', address)}
              onDisconnect={() => console.log('Disconnected')}
              isConnected={isConnected}
              address={isConnected ? 'bc1q...xyz' : undefined}
            />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-twilight-primary border-t border-twilight-accent"
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'bg-twilight-accent text-white'
                      : 'text-gray-400 hover:text-white hover:bg-twilight-dark'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center justify-between pt-4 border-t border-twilight-dark">
              {/* Theme Toggle */}
              <button
                onClick={() => toggleMode(mode === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200 flex items-center"
                aria-label="Toggle theme"
              >
                {mode === 'dark' ? (
                  <>
                    <SunIcon className="w-5 h-5 mr-2" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <MoonIcon className="w-5 h-5 mr-2" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile Wallet Connect */}
            <div className="pt-4">
              <WalletConnect
                onConnect={(address) => {
                  console.log('Connected:', address);
                  setIsMobileMenuOpen(false);
                }}
                onDisconnect={() => console.log('Disconnected')}
                isConnected={isConnected}
                address={isConnected ? 'bc1q...xyz' : undefined}
              />
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;