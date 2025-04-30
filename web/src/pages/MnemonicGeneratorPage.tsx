import React, { useState } from 'react';
import MnemonicGenerator from '../components/MnemonicGenerator';
import { MnemonicStrength, MnemonicLanguage, mnemonicToSeed } from '../utils/BIP39MnemonicGenerator';
import '../styles/MnemonicGeneratorPage.css';

/**
 * Mnemonic generator page
 */
const MnemonicGeneratorPage: React.FC = () => {
  // State
  const [mnemonic, setMnemonic] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [seed, setSeed] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState<string>('');
  const [isGeneratingSeed, setIsGeneratingSeed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Handle mnemonic change
   * @param mnemonic New mnemonic
   */
  const handleMnemonicChange = (mnemonic: string) => {
    setMnemonic(mnemonic);
    setSeed(null);
  };
  
  /**
   * Handle mnemonic validation
   * @param isValid Whether the mnemonic is valid
   */
  const handleMnemonicValidation = (isValid: boolean) => {
    setIsValid(isValid);
    if (!isValid) {
      setSeed(null);
    }
  };
  
  /**
   * Handle passphrase change
   * @param e Change event
   */
  const handlePassphraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassphrase(e.target.value);
    setSeed(null);
  };
  
  /**
   * Handle generate seed click
   */
  const handleGenerateSeedClick = async () => {
    try {
      setIsGeneratingSeed(true);
      setError(null);
      
      // Generate seed
      const seed = await mnemonicToSeed(mnemonic, passphrase);
      
      // Set seed
      setSeed(seed);
    } catch (error: any) {
      console.error('Failed to generate seed:', error);
      setError(error.message || 'Failed to generate seed');
      setSeed(null);
    } finally {
      setIsGeneratingSeed(false);
    }
  };
  
  return (
    <div className="mnemonic-generator-page">
      <h1>Mnemonic Generator</h1>
      
      <div className="mnemonic-generator-page-description">
        <p>
          This page allows you to generate and validate BIP39 mnemonic phrases.
          BIP39 is a standard for creating mnemonic phrases that can be used to derive deterministic keys.
        </p>
        <p>
          You can use the generated mnemonic phrase to create a new wallet or recover an existing wallet.
          The mnemonic phrase is a human-readable representation of your wallet's seed, which is used to
          derive all of your wallet's keys and addresses.
        </p>
        <p>
          <strong>Important:</strong> Keep your mnemonic phrase safe and secure. Anyone who has access to
          your mnemonic phrase can access your wallet and funds.
        </p>
      </div>
      
      <div className="mnemonic-generator-page-content">
        <div className="mnemonic-generator-page-section">
          <h2>Generate Mnemonic</h2>
          <MnemonicGenerator
            defaultStrength={MnemonicStrength.Low}
            defaultLanguage={MnemonicLanguage.English}
            onMnemonicChange={handleMnemonicChange}
            onMnemonicValidation={handleMnemonicValidation}
          />
        </div>
        
        <div className="mnemonic-generator-page-section">
          <h2>Generate Seed</h2>
          <p>
            You can generate a seed from your mnemonic phrase. The seed is used to derive all of your
            wallet's keys and addresses. You can optionally provide a passphrase for additional security.
          </p>
          
          <div className="mnemonic-generator-page-passphrase">
            <label htmlFor="passphrase">Passphrase (optional):</label>
            <input
              type="password"
              id="passphrase"
              value={passphrase}
              onChange={handlePassphraseChange}
              placeholder="Enter passphrase..."
              disabled={!isValid || isGeneratingSeed}
            />
          </div>
          
          <button
            className="mnemonic-generator-page-button"
            onClick={handleGenerateSeedClick}
            disabled={!isValid || isGeneratingSeed}
          >
            {isGeneratingSeed ? 'Generating...' : 'Generate Seed'}
          </button>
          
          {error && (
            <div className="mnemonic-generator-page-error">
              {error}
            </div>
          )}
          
          {seed && (
            <div className="mnemonic-generator-page-seed">
              <h3>Seed (hex):</h3>
              <div className="mnemonic-generator-page-seed-value">
                {seed}
              </div>
            </div>
          )}
        </div>
        
        <div className="mnemonic-generator-page-section">
          <h2>What is a Mnemonic Phrase?</h2>
          <p>
            A mnemonic phrase, also known as a seed phrase or recovery phrase, is a list of words that
            can be used to recover your wallet. It's a human-readable representation of your wallet's
            seed, which is used to derive all of your wallet's keys and addresses.
          </p>
          <p>
            The mnemonic phrase is typically 12, 15, 18, 21, or 24 words long, depending on the level
            of security you want. The more words, the more secure your wallet is.
          </p>
          <p>
            When you create a new wallet, you'll be given a mnemonic phrase. It's important to write
            this phrase down and keep it in a safe place. If you lose access to your wallet, you can
            use the mnemonic phrase to recover it.
          </p>
        </div>
        
        <div className="mnemonic-generator-page-section">
          <h2>Security Tips</h2>
          <ul className="mnemonic-generator-page-security-tips">
            <li>
              <strong>Write down your mnemonic phrase on paper.</strong> Don't store it digitally,
              as digital storage is more vulnerable to hacking.
            </li>
            <li>
              <strong>Keep your mnemonic phrase in a safe place.</strong> Consider using a fireproof
              and waterproof container.
            </li>
            <li>
              <strong>Never share your mnemonic phrase with anyone.</strong> Anyone who has access to
              your mnemonic phrase can access your wallet and funds.
            </li>
            <li>
              <strong>Consider using a passphrase.</strong> A passphrase adds an extra layer of security
              to your mnemonic phrase. Even if someone gets access to your mnemonic phrase, they won't
              be able to access your wallet without the passphrase.
            </li>
            <li>
              <strong>Consider using a hardware wallet.</strong> Hardware wallets are the most secure
              way to store your cryptocurrency.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MnemonicGeneratorPage;