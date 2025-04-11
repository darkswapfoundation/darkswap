import React, { useState, useEffect } from 'react';
import {
  generateMnemonic,
  validateMnemonic,
  MnemonicStrength,
  MnemonicLanguage,
  getWordCount,
  getWordList,
  getSupportedLanguages,
} from '../utils/BIP39MnemonicGenerator';
import '../styles/MnemonicGenerator.css';

/**
 * Mnemonic generator props
 */
interface MnemonicGeneratorProps {
  /**
   * Default mnemonic strength
   */
  defaultStrength?: MnemonicStrength;
  
  /**
   * Default mnemonic language
   */
  defaultLanguage?: MnemonicLanguage;
  
  /**
   * Whether to show the language selector
   */
  showLanguageSelector?: boolean;
  
  /**
   * Whether to show the strength selector
   */
  showStrengthSelector?: boolean;
  
  /**
   * Whether to show the validation status
   */
  showValidationStatus?: boolean;
  
  /**
   * Whether to show the word count
   */
  showWordCount?: boolean;
  
  /**
   * Whether to show the copy button
   */
  showCopyButton?: boolean;
  
  /**
   * Whether to show the regenerate button
   */
  showRegenerateButton?: boolean;
  
  /**
   * On mnemonic change callback
   */
  onMnemonicChange?: (mnemonic: string) => void;
  
  /**
   * On mnemonic validation callback
   */
  onMnemonicValidation?: (isValid: boolean) => void;
}

/**
 * Mnemonic generator component
 * @param props Component props
 * @returns Component
 */
const MnemonicGenerator: React.FC<MnemonicGeneratorProps> = ({
  defaultStrength = MnemonicStrength.Low,
  defaultLanguage = MnemonicLanguage.English,
  showLanguageSelector = true,
  showStrengthSelector = true,
  showValidationStatus = true,
  showWordCount = true,
  showCopyButton = true,
  showRegenerateButton = true,
  onMnemonicChange,
  onMnemonicValidation,
}) => {
  // State
  const [mnemonic, setMnemonic] = useState<string>('');
  const [strength, setStrength] = useState<MnemonicStrength>(defaultStrength);
  const [language, setLanguage] = useState<MnemonicLanguage>(defaultLanguage);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Generate mnemonic
   */
  const generateNewMnemonic = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate mnemonic
      const newMnemonic = await generateMnemonic(strength, language);
      
      // Set mnemonic
      setMnemonic(newMnemonic);
      
      // Validate mnemonic
      const isValid = validateMnemonic(newMnemonic, language);
      setIsValid(isValid);
      
      // Call onMnemonicChange callback
      onMnemonicChange?.(newMnemonic);
      
      // Call onMnemonicValidation callback
      onMnemonicValidation?.(isValid);
    } catch (error: any) {
      console.error('Failed to generate mnemonic:', error);
      setError(error.message || 'Failed to generate mnemonic');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle mnemonic change
   * @param e Change event
   */
  const handleMnemonicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMnemonic = e.target.value;
    
    // Set mnemonic
    setMnemonic(newMnemonic);
    
    // Validate mnemonic
    const isValid = validateMnemonic(newMnemonic, language);
    setIsValid(isValid);
    
    // Call onMnemonicChange callback
    onMnemonicChange?.(newMnemonic);
    
    // Call onMnemonicValidation callback
    onMnemonicValidation?.(isValid);
  };
  
  /**
   * Handle strength change
   * @param e Change event
   */
  const handleStrengthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStrength(parseInt(e.target.value) as MnemonicStrength);
  };
  
  /**
   * Handle language change
   * @param e Change event
   */
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as MnemonicLanguage);
  };
  
  /**
   * Handle copy button click
   */
  const handleCopyClick = () => {
    // Copy mnemonic to clipboard
    navigator.clipboard.writeText(mnemonic);
    
    // Show copied message
    setIsCopied(true);
    
    // Hide copied message after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  /**
   * Generate mnemonic on mount
   */
  useEffect(() => {
    generateNewMnemonic();
  }, [strength, language]);
  
  /**
   * Get word count
   */
  const wordCount = getWordCount(strength);
  
  /**
   * Get supported languages
   */
  const supportedLanguages = getSupportedLanguages();
  
  return (
    <div className="mnemonic-generator">
      <div className="mnemonic-generator-header">
        <h2>Mnemonic Generator</h2>
        
        <div className="mnemonic-generator-controls">
          {showStrengthSelector && (
            <div className="mnemonic-generator-control">
              <label htmlFor="mnemonic-strength">Strength:</label>
              <select
                id="mnemonic-strength"
                value={strength}
                onChange={handleStrengthChange}
                disabled={isLoading}
              >
                <option value={MnemonicStrength.Low}>12 words (128 bits)</option>
                <option value={MnemonicStrength.Medium}>15 words (160 bits)</option>
                <option value={MnemonicStrength.High}>18 words (192 bits)</option>
                <option value={MnemonicStrength.VeryHigh}>21 words (224 bits)</option>
                <option value={MnemonicStrength.Highest}>24 words (256 bits)</option>
              </select>
            </div>
          )}
          
          {showLanguageSelector && (
            <div className="mnemonic-generator-control">
              <label htmlFor="mnemonic-language">Language:</label>
              <select
                id="mnemonic-language"
                value={language}
                onChange={handleLanguageChange}
                disabled={isLoading}
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      
      <div className="mnemonic-generator-content">
        <textarea
          className="mnemonic-generator-textarea"
          value={mnemonic}
          onChange={handleMnemonicChange}
          placeholder="Enter or generate a mnemonic phrase..."
          rows={3}
          disabled={isLoading}
        />
        
        <div className="mnemonic-generator-info">
          {showWordCount && (
            <div className="mnemonic-generator-word-count">
              Word count: {mnemonic.trim().split(/\s+/).filter(Boolean).length} / {wordCount}
            </div>
          )}
          
          {showValidationStatus && (
            <div className={`mnemonic-generator-validation ${isValid ? 'valid' : 'invalid'}`}>
              {isValid ? 'Valid mnemonic' : 'Invalid mnemonic'}
            </div>
          )}
        </div>
        
        {error && (
          <div className="mnemonic-generator-error">
            {error}
          </div>
        )}
        
        <div className="mnemonic-generator-actions">
          {showRegenerateButton && (
            <button
              className="mnemonic-generator-button"
              onClick={generateNewMnemonic}
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate New Mnemonic'}
            </button>
          )}
          
          {showCopyButton && (
            <button
              className="mnemonic-generator-button"
              onClick={handleCopyClick}
              disabled={isLoading || !mnemonic}
            >
              {isCopied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MnemonicGenerator;