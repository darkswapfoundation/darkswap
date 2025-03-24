import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Icons
import {
  ShieldCheckIcon,
  CubeTransparentIcon,
  BoltIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Mock stats
  const stats = [
    { label: 'Trading Volume', value: '$12.5M+' },
    { label: 'Active Traders', value: '2,500+' },
    { label: 'Completed Trades', value: '45,000+' },
  ];

  // Mock recent orders
  const recentOrders = [
    { id: 1, pair: 'BTC/RUNE', type: 'buy', price: '20,000', amount: '0.5' },
    { id: 2, pair: 'BTC/ALKANE', type: 'sell', price: '19,800', amount: '0.75' },
    { id: 3, pair: 'RUNE/ALKANE', type: 'buy', price: '0.5', amount: '1,000' },
  ];

  // Mock recent trades
  const recentTrades = [
    { id: 1, pair: 'BTC/RUNE', price: '19,950', amount: '0.25', time: '2 mins ago' },
    { id: 2, pair: 'BTC/ALKANE', price: '19,800', amount: '0.5', time: '5 mins ago' },
    { id: 3, pair: 'RUNE/ALKANE', price: '0.48', amount: '500', time: '10 mins ago' },
  ];

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-twilight-neon-blue opacity-10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-twilight-neon-purple opacity-10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1"
            >
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
                <span className="text-white">Trade </span>
                <span className="neon-text-blue">Bitcoin</span>
                <span className="text-white">, </span>
                <span className="neon-text-purple">Runes</span>
                <span className="text-white">, & </span>
                <span className="neon-text-green">Alkanes</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-10">
                Secure, private, peer-to-peer trading with no intermediaries.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/trade" className="btn btn-primary btn-lg">
                  Start Trading
                </Link>
                <Link to="/about" className="btn btn-secondary btn-lg">
                  Learn More
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-display font-bold neon-text-blue">
                      {stat.value}
                    </div>
                    <div className="text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex-1 flex justify-center"
            >
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-twilight-primary bg-opacity-50 backdrop-blur-md rounded-full border border-twilight-accent shadow-lg flex items-center justify-center">
                  <div className="w-3/4 h-3/4 relative">
                    {/* Bitcoin */}
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                      className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2"
                    >
                      <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center shadow-neon-blue">
                        <span className="font-bold text-white text-2xl">₿</span>
                      </div>
                    </motion.div>

                    {/* Rune */}
                    <motion.div
                      animate={{
                        y: [0, 10, 0],
                        rotate: [0, -5, 0],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: 0.5,
                      }}
                      className="absolute top-1/2 right-0 transform translate-x-1/4"
                    >
                      <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center shadow-neon-purple">
                        <span className="font-bold text-white text-xl">R</span>
                      </div>
                    </motion.div>

                    {/* Alkane */}
                    <motion.div
                      animate={{
                        y: [0, 8, 0],
                        rotate: [0, 3, 0],
                      }}
                      transition={{
                        duration: 4.5,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: 1,
                      }}
                      className="absolute bottom-0 left-1/3 transform -translate-x-1/2 translate-y-1/4"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center shadow-neon-blue">
                        <span className="font-bold text-white text-lg">A</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.h2 variants={itemVariants} className="text-3xl font-display font-bold mb-4">
              <span className="text-white">Advanced </span>
              <span className="neon-text-blue">Technology</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl text-gray-300 max-w-3xl mx-auto">
              DarkSwap combines cutting-edge technologies to create a secure, fast, and reliable trading platform.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* P2P Network */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="card p-6"
            >
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-twilight-primary bg-opacity-50 flex-shrink-0 flex items-center justify-center mr-4">
                  <CubeTransparentIcon className="w-6 h-6 text-twilight-neon-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2">P2P Network</h3>
                  <p className="text-gray-400">
                    Trade directly with peers over a decentralized network with no central servers or intermediaries.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Secure Trading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-twilight-primary bg-opacity-50 flex-shrink-0 flex items-center justify-center mr-4">
                  <ShieldCheckIcon className="w-6 h-6 text-twilight-neon-purple" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2">Secure Trading</h3>
                  <p className="text-gray-400">
                    Built on Bitcoin's secure blockchain with Partially Signed Bitcoin Transactions (PSBTs) for maximum security.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Lightning Fast */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card p-6"
            >
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-twilight-primary bg-opacity-50 flex-shrink-0 flex items-center justify-center mr-4">
                  <BoltIcon className="w-6 h-6 text-twilight-neon-green" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2">Lightning Fast</h3>
                  <p className="text-gray-400">
                    Experience rapid order matching and execution with our high-performance trading engine.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Self-Custody */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card p-6"
            >
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-twilight-primary bg-opacity-50 flex-shrink-0 flex items-center justify-center mr-4">
                  <LockClosedIcon className="w-6 h-6 text-twilight-neon-pink" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2">Self-Custody</h3>
                  <p className="text-gray-400">
                    Maintain full control of your assets at all times. Your keys, your coins.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Marketplace Section */}
      <section>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.h2 variants={itemVariants} className="text-3xl font-display font-bold mb-4">
              <span className="text-white">Live </span>
              <span className="neon-text-purple">Marketplace</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl text-gray-300 max-w-3xl mx-auto">
              See what's happening in the DarkSwap marketplace right now.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="card p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-display font-bold">Recent Orders</h3>
                <Link to="/trade" className="text-twilight-neon-blue hover:text-white transition-colors duration-200 flex items-center">
                  <span className="text-sm">View All</span>
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-3 bg-twilight-dark rounded-lg">
                    <div>
                      <div className="font-medium">{order.pair}</div>
                      <div className={`text-sm ${order.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                        {order.type.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${order.price}</div>
                      <div className="text-sm text-gray-400">{order.amount} units</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Trades */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-display font-bold">Recent Trades</h3>
                <Link to="/trade" className="text-twilight-neon-purple hover:text-white transition-colors duration-200 flex items-center">
                  <span className="text-sm">View All</span>
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-4">
                {recentTrades.map((trade) => (
                  <div key={trade.id} className="flex justify-between items-center p-3 bg-twilight-dark rounded-lg">
                    <div>
                      <div className="font-medium">{trade.pair}</div>
                      <div className="text-sm text-gray-400">{trade.time}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${trade.price}</div>
                      <div className="text-sm text-gray-400">{trade.amount} units</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="card-glass p-12 relative overflow-hidden"
          >
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-twilight-neon-blue opacity-10 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-twilight-neon-purple opacity-10 rounded-full filter blur-3xl"></div>
            </div>

            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Ready to Start Trading?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Join thousands of traders on the most advanced decentralized trading platform for Bitcoin, runes, and alkanes.
              </p>
              <Link to="/trade" className="btn btn-primary btn-lg">
                <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
                Start Trading Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;