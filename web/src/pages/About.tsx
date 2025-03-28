import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Icons
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

const About: React.FC = () => {
  // Team members
  const team = [
    {
      name: 'Alex Johnson',
      role: 'Lead Developer',
      bio: 'Blockchain developer with 8+ years of experience in Bitcoin and cryptocurrency projects.',
      avatar: 'AJ',
    },
    {
      name: 'Sarah Chen',
      role: 'Product Manager',
      bio: 'Former fintech product manager with a passion for decentralized finance and user experience.',
      avatar: 'SC',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Security Engineer',
      bio: 'Cryptography expert specializing in secure transaction protocols and wallet security.',
      avatar: 'MR',
    },
    {
      name: 'Priya Patel',
      role: 'Frontend Developer',
      bio: 'Web3 developer focused on creating intuitive and responsive user interfaces for DeFi applications.',
      avatar: 'PP',
    },
  ];

  // FAQ items
  const faqItems = [
    {
      question: 'What is DarkSwap?',
      answer: 'DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. It enables secure, non-custodial trading without intermediaries or centralized exchanges.',
    },
    {
      question: 'How does DarkSwap ensure security?',
      answer: 'DarkSwap uses Partially Signed Bitcoin Transactions (PSBTs) for secure trading. All transactions are executed on the Bitcoin blockchain, ensuring maximum security and transparency. Your private keys never leave your device.',
    },
    {
      question: 'What are runes and alkanes?',
      answer: 'Runes and alkanes are token protocols built on top of Bitcoin. Runes are fungible tokens that can represent various assets, while alkanes are a specific type of token with unique properties designed for specific use cases.',
    },
    {
      question: 'Is DarkSwap open source?',
      answer: 'Yes, DarkSwap is fully open source. The codebase is available on GitHub and contributions from the community are welcome. We believe in transparency and collaborative development.',
    },
    {
      question: 'How do I get started with DarkSwap?',
      answer: 'To get started, connect your Bitcoin wallet, browse the available orders, and start trading. You can also create your own orders by specifying the assets you want to trade and the desired price.',
    },
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
              <span className="text-white">About</span>
              <br />
              <span className="text-twilight-neon-blue">DarkSwap</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              DarkSwap is a revolutionary peer-to-peer trading platform built on Bitcoin.
              Our mission is to enable secure, non-custodial trading of Bitcoin, runes, and alkanes
              without intermediaries or centralized exchanges.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="card p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">Our Mission</h2>
            <p className="text-gray-300 mb-4">
              Our mission is to democratize access to Bitcoin-based assets by providing a secure,
              decentralized platform for peer-to-peer trading. We believe in financial sovereignty
              and aim to build tools that empower individuals to trade without intermediaries.
            </p>
            <p className="text-gray-300">
              By leveraging the security of Bitcoin and the innovation of runes and alkanes,
              we're creating a new paradigm for decentralized exchange that prioritizes security,
              privacy, and user control.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">Our Vision</h2>
            <p className="text-gray-300 mb-4">
              We envision a future where anyone can trade Bitcoin-based assets directly with others,
              without relying on centralized exchanges or intermediaries. A world where users have
              full control over their assets and can trade securely and efficiently.
            </p>
            <p className="text-gray-300">
              DarkSwap aims to be the leading platform for decentralized trading of Bitcoin, runes,
              and alkanes, setting the standard for security, usability, and innovation in the space.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="card p-8">
        <h2 className="text-2xl font-display font-bold mb-6">Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-twilight-darker rounded-lg border border-twilight-dark">
            <ShieldCheckIcon className="w-8 h-8 text-twilight-neon-blue mb-4" />
            <h3 className="text-lg font-display font-medium mb-2">Security First</h3>
            <p className="text-gray-400">
              We prioritize security in everything we do. From our code to our transaction protocols,
              security is never compromised.
            </p>
          </div>
          
          <div className="p-6 bg-twilight-darker rounded-lg border border-twilight-dark">
            <LockClosedIcon className="w-8 h-8 text-twilight-neon-green mb-4" />
            <h3 className="text-lg font-display font-medium mb-2">Self-Custody</h3>
            <p className="text-gray-400">
              We believe in the principle of "not your keys, not your coins." Users always maintain
              full control of their assets.
            </p>
          </div>
          
          <div className="p-6 bg-twilight-darker rounded-lg border border-twilight-dark">
            <CodeBracketIcon className="w-8 h-8 text-twilight-neon-purple mb-4" />
            <h3 className="text-lg font-display font-medium mb-2">Open Source</h3>
            <p className="text-gray-400">
              We're committed to transparency and collaboration. All our code is open source and
              available for review and contribution.
            </p>
          </div>
          
          <div className="p-6 bg-twilight-darker rounded-lg border border-twilight-dark">
            <UserGroupIcon className="w-8 h-8 text-twilight-neon-orange mb-4" />
            <h3 className="text-lg font-display font-medium mb-2">Community Driven</h3>
            <p className="text-gray-400">
              We believe in the power of community. DarkSwap is built by and for the community,
              with decisions guided by user feedback.
            </p>
          </div>
          
          <div className="p-6 bg-twilight-darker rounded-lg border border-twilight-dark">
            <GlobeAltIcon className="w-8 h-8 text-twilight-neon-yellow mb-4" />
            <h3 className="text-lg font-display font-medium mb-2">Global Access</h3>
            <p className="text-gray-400">
              We believe in financial inclusion. DarkSwap is designed to be accessible to anyone,
              anywhere in the world.
            </p>
          </div>
          
          <div className="p-6 bg-twilight-darker rounded-lg border border-twilight-dark">
            <ScaleIcon className="w-8 h-8 text-twilight-neon-blue mb-4" />
            <h3 className="text-lg font-display font-medium mb-2">Fairness</h3>
            <p className="text-gray-400">
              We're committed to creating a level playing field for all users, with transparent
              fees and fair trading practices.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="card p-8">
        <h2 className="text-2xl font-display font-bold mb-6">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <motion.div 
              key={index}
              className="p-6 bg-twilight-darker rounded-lg border border-twilight-dark text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="w-20 h-20 rounded-full bg-twilight-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-white">{member.avatar}</span>
              </div>
              <h3 className="text-lg font-display font-medium mb-1">{member.name}</h3>
              <p className="text-twilight-neon-blue text-sm mb-2">{member.role}</p>
              <p className="text-gray-400 text-sm">{member.bio}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="card p-8">
        <h2 className="text-2xl font-display font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <motion.div 
              key={index}
              className="p-6 bg-twilight-darker rounded-lg border border-twilight-dark"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3 className="text-lg font-display font-medium mb-2">{item.question}</h3>
              <p className="text-gray-400">{item.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="card p-8 bg-gradient-to-br from-twilight-primary to-twilight-darker">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Join the DarkSwap Community
          </h2>
          <p className="text-gray-300 mb-6">
            Ready to experience the future of decentralized trading? Start trading Bitcoin, runes, and alkanes today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/trade" className="btn btn-primary btn-lg">
              Start Trading
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
            
            <a 
              href="https://github.com/darkswap" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline btn-lg"
            >
              GitHub
              <CodeBracketIcon className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;