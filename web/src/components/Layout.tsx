import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import WebSocketStatus from './WebSocketStatus';
import ThemeToggle from './ThemeToggle';

// Icons
import {
  HomeIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isConnected, connect, disconnect, address, balance } = useWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items
  const navItems = [
    { path: '/', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
    { path: '/trade', label: 'Trade', icon: <ArrowsRightLeftIcon className="w-5 h-5" /> },
    { path: '/orders', label: 'Orders', icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
    { path: '/vault', label: 'Vault', icon: <ShieldCheckIcon className="w-5 h-5" /> },
    { path: '/about', label: 'About', icon: <InformationCircleIcon className="w-5 h-5" /> },
    { path: '/settings', label: 'Settings', icon: <Cog6ToothIcon className="w-5 h-5" /> },
  ];

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Format address for display
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-twilight-darkest text-white">
      {/* Header */}
      <header className="bg-twilight-darker border-b border-twilight-dark">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-twilight-primary flex items-center justify-center mr-2">
                <span className="text-xl font-bold">DS</span>
              </div>
              <span className="text-xl font-display font-bold">DarkSwap</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg flex items-center ${
                    location.pathname === item.path
                      ? 'bg-twilight-primary text-white'
                      : 'text-gray-400 hover:text-white hover:bg-twilight-dark'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Wallet Connection and Theme Toggle (Desktop) */}
            <div className="hidden md:flex items-center space-x-2">
              <ThemeToggle />
              {isConnected ? (
                <div className="flex items-center">
                  <div className="mr-4 text-right">
                    <div className="text-sm text-gray-400">Connected</div>
                    <div className="font-medium">{formatAddress(address)}</div>
                  </div>
                  <div className="mr-4 text-right">
                    <div className="text-sm text-gray-400">Balance</div>
                    <div className="font-medium">{balance} BTC</div>
                  </div>
                  <button
                    onClick={disconnect}
                    className="btn btn-sm btn-outline flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1" />
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  className="btn btn-sm btn-primary flex items-center"
                >
                  <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-1" />
                  Connect Wallet
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark"
              onClick={toggleMobileMenu}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-twilight-darkest md:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="p-4 border-b border-twilight-dark flex justify-between items-center">
                <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
                  <div className="w-10 h-10 rounded-full bg-twilight-primary flex items-center justify-center mr-2">
                    <span className="text-xl font-bold">DS</span>
                  </div>
                  <span className="text-xl font-display font-bold">DarkSwap</span>
                </Link>
                <button
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark"
                  onClick={closeMobileMenu}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-4 py-3 rounded-lg flex items-center ${
                        location.pathname === item.path
                          ? 'bg-twilight-primary text-white'
                          : 'text-gray-400 hover:text-white hover:bg-twilight-dark'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Mobile Wallet Connection */}
              <div className="p-4 border-t border-twilight-dark">
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400">Connected</div>
                        <div className="font-medium">{formatAddress(address)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Balance</div>
                        <div className="font-medium">{balance} BTC</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        closeMobileMenu();
                      }}
                      className="btn btn-outline w-full flex items-center justify-center"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      connect();
                      closeMobileMenu();
                    }}
                    className="btn btn-primary w-full flex items-center justify-center"
                  >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
                    Connect Wallet
                  </button>
                )}
              </div>

              {/* Theme Toggle */}
              <div className="p-4 border-t border-twilight-dark">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Theme</span>
                  <ThemeToggle />
                </div>
              </div>

              {/* Connection Status */}
              <div className="p-4 border-t border-twilight-dark">
                <div className="flex items-center">
                  <WebSocketStatus />
                  <span className="ml-2 text-sm text-gray-400">Network Status</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-twilight-darker border-t border-twilight-dark py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-twilight-primary flex items-center justify-center mr-2">
                  <span className="text-xl font-bold">DS</span>
                </div>
                <span className="text-xl font-display font-bold">DarkSwap</span>
              </Link>
              <p className="mt-4 text-gray-400">
                A decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes.
                Trade securely without intermediaries.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-display font-medium mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3 className="text-lg font-display font-medium mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/darkswap"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com/darkswap"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/darkswap"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@darkswap.io"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-twilight-dark text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} DarkSwap. All rights reserved.</p>
            <p className="mt-2">
              DarkSwap is open source software licensed under the MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;