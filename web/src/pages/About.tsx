import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Icons
import {
  ShieldCheckIcon,
  CubeTransparentIcon,
  BoltIcon,
  LockClosedIcon,
  UserGroupIcon,
  CodeBracketIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

const About: React.FC = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-twilight-neon-blue opacity-10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-twilight-neon-purple opacity-10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="text-white">About </span>
              <span className="neon-text-blue">DarkSwap</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
              A decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section>
        <div className="max-w-5xl mx-auto">
          <div className="card p-8">
            <h2 className="text-3xl font-display font-bold mb-6 text-center">Our Mission</h2>
            <p className="text-xl text-gray-300 mb-6 text-center max-w-3xl mx-auto">
              DarkSwap is built on the belief that trading should be secure, private, and free from intermediaries.
              We're creating a platform where users can trade directly with each other, maintaining full control of their assets.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-twilight-primary bg-opacity-20 flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="w-8 h-8 text-twilight-neon-blue" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Security</h3>
                <p className="text-gray-400">
                  Built on Bitcoin's secure blockchain with Partially Signed Bitcoin Transactions (PSBTs) for maximum security.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-twilight-primary bg-opacity-20 flex items-center justify-center mb-4">
                  <LockClosedIcon className="w-8 h-8 text-twilight-neon-purple" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Privacy</h3>
                <p className="text-gray-400">
                  Trade directly with peers without exposing your personal information to centralized entities.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-twilight-primary bg-opacity-20 flex items-center justify-center mb-4">
                  <CubeTransparentIcon className="w-8 h-8 text-twilight-neon-green" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Decentralization</h3>
                <p className="text-gray-400">
                  No central authority or intermediaries. Just pure peer-to-peer trading on a distributed network.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-display font-bold mb-6 text-center">
            <span className="text-white">Our </span>
            <span className="neon-text-purple">Technology</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 text-center max-w-3xl mx-auto">
            DarkSwap combines cutting-edge technologies to create a secure, fast, and reliable trading platform.
          </p>

          <div className="space-y-12">
            {/* P2P Network */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="card p-8"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 rounded-full bg-twilight-primary bg-opacity-20 flex-shrink-0 flex items-center justify-center">
                  <GlobeAltIcon className="w-12 h-12 text-twilight-neon-blue" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-4">P2P Network</h3>
                  <p className="text-gray-300 mb-4">
                    DarkSwap is built on a robust peer-to-peer network using WebRTC for direct browser-to-browser communication.
                    This allows users to connect directly without relying on central servers.
                  </p>
                  <ul className="list-disc list-inside text-gray-400 space-y-2">
                    <li>Direct peer connections using WebRTC</li>
                    <li>Distributed orderbook using gossip protocol</li>
                    <li>Circuit relay for NAT traversal</li>
                    <li>Peer discovery through distributed hash tables</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Bitcoin Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="card p-8"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 rounded-full bg-twilight-primary bg-opacity-20 flex-shrink-0 flex items-center justify-center">
                  <ShieldCheckIcon className="w-12 h-12 text-twilight-neon-purple" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-4">Bitcoin Integration</h3>
                  <p className="text-gray-300 mb-4">
                    DarkSwap leverages Bitcoin's security and functionality through Partially Signed Bitcoin Transactions (PSBTs).
                    This allows for secure, atomic swaps between different assets.
                  </p>
                  <ul className="list-disc list-inside text-gray-400 space-y-2">
                    <li>Secure trading with PSBTs</li>
                    <li>Support for Bitcoin, runes, and alkanes</li>
                    <li>Atomic swaps for trustless trading</li>
                    <li>Self-custody of assets at all times</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="card p-8"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 rounded-full bg-twilight-primary bg-opacity-20 flex-shrink-0 flex items-center justify-center">
                  <BoltIcon className="w-12 h-12 text-twilight-neon-green" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-4">Performance</h3>
                  <p className="text-gray-300 mb-4">
                    DarkSwap is designed for speed and efficiency, with a high-performance trading engine that can handle thousands of orders per second.
                  </p>
                  <ul className="list-disc list-inside text-gray-400 space-y-2">
                    <li>Fast order matching and execution</li>
                    <li>Efficient peer discovery and connection</li>
                    <li>Optimized data structures for orderbook management</li>
                    <li>Real-time updates and notifications</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-display font-bold mb-6 text-center">
            <span className="text-white">Our </span>
            <span className="neon-text-pink">Team</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 text-center max-w-3xl mx-auto">
            DarkSwap is built by a team of experienced developers and blockchain enthusiasts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="card p-6 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-twilight-primary bg-opacity-20 mx-auto flex items-center justify-center mb-4">
                <UserGroupIcon className="w-12 h-12 text-twilight-neon-blue" />
              </div>
              <h3 className="text-xl font-display font-bold mb-1">Alex Darkwood</h3>
              <p className="text-twilight-neon-blue mb-4">Founder & Lead Developer</p>
              <p className="text-gray-400 text-sm">
                Blockchain developer with 8+ years of experience in Bitcoin and Ethereum development.
              </p>
            </motion.div>

            {/* Team Member 2 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="card p-6 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-twilight-primary bg-opacity-20 mx-auto flex items-center justify-center mb-4">
                <CodeBracketIcon className="w-12 h-12 text-twilight-neon-purple" />
              </div>
              <h3 className="text-xl font-display font-bold mb-1">Samantha Cipher</h3>
              <p className="text-twilight-neon-purple mb-4">P2P Network Architect</p>
              <p className="text-gray-400 text-sm">
                Distributed systems expert specializing in peer-to-peer networks and cryptography.
              </p>
            </motion.div>

            {/* Team Member 3 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="card p-6 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-twilight-primary bg-opacity-20 mx-auto flex items-center justify-center mb-4">
                <ShieldCheckIcon className="w-12 h-12 text-twilight-neon-green" />
              </div>
              <h3 className="text-xl font-display font-bold mb-1">Marcus Secure</h3>
              <p className="text-twilight-neon-green mb-4">Security Specialist</p>
              <p className="text-gray-400 text-sm">
                Blockchain security expert with a focus on secure transaction protocols and smart contract auditing.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-display font-bold mb-6 text-center">
            <span className="text-white">Join Our </span>
            <span className="neon-text-blue">Community</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 text-center max-w-3xl mx-auto">
            DarkSwap is more than just a trading platform—it's a community of like-minded individuals who believe in the power of decentralization.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="https://discord.gg/darkswap"
              target="_blank"
              rel="noopener noreferrer"
              className="card p-6 flex items-center justify-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-twilight-primary bg-opacity-20 flex items-center justify-center">
                <svg className="w-6 h-6 text-twilight-neon-blue" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold">Join our Discord</h3>
                <p className="text-gray-400">Connect with the community and get support</p>
              </div>
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.05 }}
              href="https://twitter.com/darkswap"
              target="_blank"
              rel="noopener noreferrer"
              className="card p-6 flex items-center justify-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-twilight-primary bg-opacity-20 flex items-center justify-center">
                <svg className="w-6 h-6 text-twilight-neon-blue" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold">Follow on Twitter</h3>
                <p className="text-gray-400">Stay updated with the latest news</p>
              </div>
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.05 }}
              href="https://github.com/darkswap"
              target="_blank"
              rel="noopener noreferrer"
              className="card p-6 flex items-center justify-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-twilight-primary bg-opacity-20 flex items-center justify-center">
                <svg className="w-6 h-6 text-twilight-neon-blue" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold">Contribute on GitHub</h3>
                <p className="text-gray-400">Help us build the future of decentralized trading</p>
              </div>
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.05 }}
              href="https://docs.darkswap.io"
              target="_blank"
              rel="noopener noreferrer"
              className="card p-6 flex items-center justify-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-twilight-primary bg-opacity-20 flex items-center justify-center">
                <svg className="w-6 h-6 text-twilight-neon-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold">Read the Docs</h3>
                <p className="text-gray-400">Learn how to use DarkSwap</p>
              </div>
            </motion.a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <div className="max-w-5xl mx-auto">
          <div className="card-glass p-12 relative overflow-hidden">
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
                Start Trading Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;