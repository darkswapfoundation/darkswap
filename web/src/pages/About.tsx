import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="about-page">
      <h1>About DarkSwap</h1>
      
      <div className="about-section">
        <h2>What is DarkSwap?</h2>
        <p>
          DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes.
          It enables users to trade directly with each other without the need for intermediaries,
          providing a secure, private, and censorship-resistant trading experience.
        </p>
      </div>
      
      <div className="about-section">
        <h2>How it Works</h2>
        <p>
          DarkSwap uses WebRTC for direct peer-to-peer connections, allowing users to trade
          directly with each other without going through a central server. For users behind NATs,
          DarkSwap uses circuit relay to establish connections.
        </p>
        <p>
          Trades are executed using Partially Signed Bitcoin Transactions (PSBTs), which ensure
          that trades are atomic and secure. Both parties must sign the transaction for it to be valid,
          preventing either party from cheating.
        </p>
      </div>
      
      <div className="about-section">
        <h2>Features</h2>
        <ul>
          <li>Decentralized peer-to-peer trading</li>
          <li>Support for Bitcoin, runes, and alkanes</li>
          <li>Direct WebRTC connections</li>
          <li>Circuit relay for NAT traversal</li>
          <li>Atomic swaps using PSBTs</li>
          <li>No KYC or registration required</li>
          <li>Open source and transparent</li>
        </ul>
      </div>
      
      <div className="about-section">
        <h2>Security</h2>
        <p>
          DarkSwap prioritizes security and privacy. All communications are encrypted end-to-end,
          and no personal information is collected or stored. Trades are executed using PSBTs,
          which ensure that both parties must sign the transaction for it to be valid.
        </p>
        <p>
          The platform is open source, allowing anyone to audit the code and verify that it works
          as advertised. We encourage security researchers to review our code and report any
          vulnerabilities they find.
        </p>
      </div>
      
      <div className="about-section">
        <h2>Technology Stack</h2>
        <div className="tech-stack">
          <div className="tech-item">
            <h3>Backend</h3>
            <ul>
              <li>Rust</li>
              <li>libp2p</li>
              <li>WebRTC</li>
              <li>Bitcoin Development Kit (BDK)</li>
            </ul>
          </div>
          <div className="tech-item">
            <h3>Frontend</h3>
            <ul>
              <li>TypeScript</li>
              <li>React</li>
              <li>WebAssembly</li>
              <li>CSS</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="about-section">
        <h2>Open Source</h2>
        <p>
          DarkSwap is open source software, released under the MIT license. You can find the
          source code on GitHub:
        </p>
        <div className="github-link">
          <a href="https://github.com/darkswap/darkswap" target="_blank" rel="noopener noreferrer">
            github.com/darkswap/darkswap
          </a>
        </div>
        <p>
          We welcome contributions from the community. If you're interested in contributing,
          please check out our contribution guidelines on GitHub.
        </p>
      </div>
      
      <div className="about-section">
        <h2>Contact</h2>
        <p>
          If you have any questions, suggestions, or feedback, please reach out to us:
        </p>
        <ul className="contact-list">
          <li>
            <strong>Email:</strong> <a href="mailto:info@darkswap.io">info@darkswap.io</a>
          </li>
          <li>
            <strong>Twitter:</strong> <a href="https://twitter.com/darkswap" target="_blank" rel="noopener noreferrer">@darkswap</a>
          </li>
          <li>
            <strong>Discord:</strong> <a href="https://discord.gg/darkswap" target="_blank" rel="noopener noreferrer">discord.gg/darkswap</a>
          </li>
          <li>
            <strong>Telegram:</strong> <a href="https://t.me/darkswap" target="_blank" rel="noopener noreferrer">t.me/darkswap</a>
          </li>
        </ul>
      </div>
      
      <div className="about-section">
        <h2>Version</h2>
        <p>
          DarkSwap v1.0.0
        </p>
        <p className="build-info">
          Build: {new Date().toISOString().split('T')[0]}
        </p>
      </div>
      
      <style>
        {`
          .about-page {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .about-page h1 {
            margin-bottom: 20px;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          
          .about-section {
            margin-bottom: 30px;
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .about-section h2 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
            font-size: 1.5rem;
          }
          
          .about-section p {
            margin-bottom: 15px;
            line-height: 1.6;
            color: #555;
          }
          
          .about-section p:last-child {
            margin-bottom: 0;
          }
          
          .about-section ul {
            padding-left: 20px;
            margin-bottom: 0;
          }
          
          .about-section li {
            margin-bottom: 8px;
            line-height: 1.6;
            color: #555;
          }
          
          .about-section li:last-child {
            margin-bottom: 0;
          }
          
          .tech-stack {
            display: flex;
            gap: 30px;
          }
          
          .tech-item {
            flex: 1;
          }
          
          .tech-item h3 {
            margin-top: 0;
            margin-bottom: 10px;
            color: #333;
            font-size: 1.2rem;
          }
          
          .github-link {
            margin: 15px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            text-align: center;
          }
          
          .github-link a {
            color: #007bff;
            text-decoration: none;
            font-weight: 500;
          }
          
          .github-link a:hover {
            text-decoration: underline;
          }
          
          .contact-list {
            list-style: none;
            padding: 0;
          }
          
          .contact-list li {
            margin-bottom: 10px;
          }
          
          .contact-list a {
            color: #007bff;
            text-decoration: none;
          }
          
          .contact-list a:hover {
            text-decoration: underline;
          }
          
          .build-info {
            color: #6c757d;
            font-size: 0.9rem;
          }
          
          @media (max-width: 768px) {
            .tech-stack {
              flex-direction: column;
              gap: 15px;
            }
          }
        `}
      </style>
    </div>
  );
};