import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useSDK } from '../contexts/SDKContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import WebSocketStatus from '../components/WebSocketStatus';

// Icons
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  UserGroupIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  const { isConnected, connect } = useWallet();
  const { isInitialized } = useSDK();
  const { connectionStatus } = useWebSocket();

  // Features list
  const features = [
    {
      icon: <ShieldCheckIcon className="w-8 h-8 text-twilight-neon-blue" />,
      title: 'Secure Trading',
      description: 'Trade with confidence using Partially Signed Bitcoin Transactions (PSBTs) for maximum security.',
    },
    {
      icon: <CurrencyDollarIcon className="w-8 h-8 text-twilight-neon-green" />,
      title: 'Bitcoin, Runes & Alkanes',
      description: 'Trade Bitcoin, runes, and alkanes in a decentralized peer-to-peer marketplace.',
    },
    {
      icon: <LockClosedIcon className="w-8 h-8 text-twilight-neon-purple" />,
      title: 'Self-Custody',
      description: 'Your keys, your coins. Always maintain full control of your assets.',
    },
    {
      icon: <UserGroupIcon className="w-8 h-8 text-twilight-neon-orange" />,
      title: 'Peer-to-Peer',
      description: 'Trade directly with other users without intermediaries or centralized exchanges.',
    },
    {
      icon: <GlobeAltIcon className="w-8 h-8 text-twilight-neon-yellow" />,
      title: 'Global Access',
      description: 'Access the marketplace from anywhere in the world, with no restrictions.',
    },
  ];

  // Stats
  const stats = [
    { label: 'Active Users', value: '1,234+' },
    { label: 'Total Volume', value: '$12.3M+' },
    { label: 'Available Pairs', value: '50+' },
    { label: 'Countries', value: '120+' },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-twilight-primary to-twilight-darker opacity-20 rounded-3xl" />
        
        {/* Content */}
        <div className="relative z-10 py-16 px-8 md:px-16 rounded-3xl border border-twilight-dark">
          <div className="max-w-3xl">
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-white">Decentralized Trading</span>
              <br />
              <span className="text-twilight-neon-blue">for Bitcoin, Runes & Alkanes</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              DarkSwap is a peer-to-peer trading platform that enables secure, 
              non-custodial trading of Bitcoin, runes, and alkanes.
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isConnected ? (
                <Link to="/trade" className="btn btn-primary btn-lg">
                  Start Trading
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              ) : (
                <button onClick={connect} className="btn btn-primary btn-lg">
                  Connect Wallet
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
              )}
              
              <Link to="/about" className="btn btn-outline btn-lg">
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Network Status */}
      <section className="card p-6">
        <h2 className="text-2xl font-display font-bold mb-6">Network Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center p-4 bg-twilight-darker rounded-lg border border-twilight-dark">
            <div className="mr-4">
              <WebSocketStatus />
            </div>
            <div>
              <h3 className="font-medium">Connection Status</h3>
              <p className="text-sm text-gray-400">
                {connectionStatus === 'connected' ? 'Connected to the network' : 
                 connectionStatus === 'connecting' ? 'Connecting to the network...' :
                 connectionStatus === 'reconnecting' ? 'Reconnecting to the network...' :
                 'Disconnected from the network'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-twilight-darker rounded-lg border border-twilight-dark">
            <div className="w-10 h-10 rounded-full bg-twilight-primary flex items-center justify-center mr-4">
              <UserGroupIcon className="w-6 h-6 text-twilight-neon-blue" />
            </div>
            <div>
              <h3 className="font-medium">Active Peers</h3>
              <p className="text-sm text-gray-400">
                {isInitialized ? '32 peers online' : 'Initializing...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-twilight-darker rounded-lg border border-twilight-dark">
            <div className="w-10 h-10 rounded-full bg-twilight-primary flex items-center justify-center mr-4">
              <CurrencyDollarIcon className="w-6 h-6 text-twilight-neon-green" />
            </div>
            <div>
              <h3 className="font-medium">Open Orders</h3>
              <p className="text-sm text-gray-400">
                {isInitialized ? '156 orders available' : 'Initializing...'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="card p-6">
        <h2 className="text-2xl font-display font-bold mb-6">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="p-6 bg-twilight-darker rounded-lg border border-twilight-dark"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-display font-medium mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="card p-6">
        <h2 className="text-2xl font-display font-bold mb-6">Platform Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="text-3xl font-display font-bold text-twilight-neon-blue mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="card p-8 bg-gradient-to-br from-twilight-primary to-twilight-darker">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Ready to start trading?
          </h2>
          <p className="text-gray-300 mb-6">
            Join the DarkSwap community and start trading Bitcoin, runes, and alkanes today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isConnected ? (
              <Link to="/trade" className="btn btn-primary btn-lg">
                Start Trading
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
            ) : (
              <button onClick={connect} className="btn btn-primary btn-lg">
                Connect Wallet
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </button>
            )}
            
            <Link to="/about" className="btn btn-outline btn-lg">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;