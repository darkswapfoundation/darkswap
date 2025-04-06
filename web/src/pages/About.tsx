/**
 * About - About page component
 * 
 * This page provides information about the DarkSwap project,
 * its mission, team, and technology.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components/MemoizedComponents';
import LazyImage from '../components/LazyImage';

/**
 * About component
 */
const About: React.FC = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About DarkSwap</h1>
          <p className="about-subtitle">
            A decentralized trading platform for Bitcoin, runes, and alkanes
          </p>
        </div>
      </section>

      <section className="about-mission">
        <h2>Our Mission</h2>
        <div className="mission-content">
          <div className="mission-text">
            <p>
              DarkSwap was created with a simple but powerful mission: to enable truly
              decentralized, peer-to-peer trading of Bitcoin and Bitcoin-based assets
              without compromising on security, privacy, or user experience.
            </p>
            <p>
              We believe that trading should be accessible to everyone, without
              gatekeepers, intermediaries, or centralized points of failure. By
              leveraging cutting-edge technologies like WebRTC and WebAssembly,
              we've built a platform that connects traders directly, keeping your
              assets in your control at all times.
            </p>
          </div>
          <div className="mission-image">
            <LazyImage
              src="/images/mission.png"
              alt="DarkSwap Mission"
              placeholder="/images/mission-placeholder.png"
              width="100%"
              height="auto"
            />
          </div>
        </div>
      </section>

      <section className="about-technology">
        <h2>Our Technology</h2>
        <div className="technology-grid">
          <Card title="Peer-to-Peer Network" className="technology-card">
            <p>
              DarkSwap uses a fully decentralized peer-to-peer network built on
              libp2p and WebRTC, allowing direct connections between traders
              without relying on central servers.
            </p>
          </Card>
          <Card title="WebAssembly Performance" className="technology-card">
            <p>
              Our core trading engine is compiled to WebAssembly, providing
              near-native performance in the browser while maintaining the
              security of running in a sandboxed environment.
            </p>
          </Card>
          <Card title="Bitcoin Integration" className="technology-card">
            <p>
              DarkSwap integrates directly with Bitcoin using Partially Signed
              Bitcoin Transactions (PSBTs), enabling secure, non-custodial
              trading of Bitcoin and Bitcoin-based assets.
            </p>
          </Card>
          <Card title="Privacy-Focused" className="technology-card">
            <p>
              We've designed DarkSwap with privacy in mind, minimizing the
              collection and sharing of user data and implementing privacy-enhancing
              technologies throughout the platform.
            </p>
          </Card>
        </div>
      </section>

      <section className="about-team">
        <h2>Our Team</h2>
        <p className="team-intro">
          DarkSwap is built by a team of experienced developers, cryptographers,
          and blockchain enthusiasts passionate about decentralization and privacy.
        </p>
        <div className="team-grid">
          <div className="team-member">
            <LazyImage
              src="/images/team-member-1.png"
              alt="Team Member"
              placeholder="/images/team-placeholder.png"
              width="150px"
              height="150px"
            />
            <h3>Alex Chen</h3>
            <p>Founder & Lead Developer</p>
          </div>
          <div className="team-member">
            <LazyImage
              src="/images/team-member-2.png"
              alt="Team Member"
              placeholder="/images/team-placeholder.png"
              width="150px"
              height="150px"
            />
            <h3>Sarah Johnson</h3>
            <p>Cryptography Specialist</p>
          </div>
          <div className="team-member">
            <LazyImage
              src="/images/team-member-3.png"
              alt="Team Member"
              placeholder="/images/team-placeholder.png"
              width="150px"
              height="150px"
            />
            <h3>Michael Rodriguez</h3>
            <p>UI/UX Designer</p>
          </div>
          <div className="team-member">
            <LazyImage
              src="/images/team-member-4.png"
              alt="Team Member"
              placeholder="/images/team-placeholder.png"
              width="150px"
              height="150px"
            />
            <h3>Emily Zhang</h3>
            <p>Blockchain Engineer</p>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <h2>Ready to start trading?</h2>
        <p>
          Experience the future of decentralized trading with DarkSwap.
        </p>
        <div className="cta-buttons">
          <Link to="/trade">
            <Button variant="primary" size="large">
              Start Trading
            </Button>
          </Link>
          <a href="https://docs.darkswap.io" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="large">
              Read Documentation
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;
