/**
 * BIP39 Mnemonic Generator
 * 
 * This module provides utilities for generating and validating BIP39 mnemonic phrases.
 * BIP39 is a standard for creating mnemonic phrases that can be used to derive deterministic keys.
 * 
 * @see https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
 */

import * as bip39 from 'bip39';
import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Mnemonic strength
 */
export enum MnemonicStrength {
  /**
   * 12 words (128 bits)
   */
  Low = 128,
  
  /**
   * 15 words (160 bits)
   */
  Medium = 160,
  
  /**
   * 18 words (192 bits)
   */
  High = 192,
  
  /**
   * 21 words (224 bits)
   */
  VeryHigh = 224,
  
  /**
   * 24 words (256 bits)
   */
  Highest = 256,
}

/**
 * Mnemonic language
 */
export enum MnemonicLanguage {
  /**
   * English
   */
  English = 'english',
  
  /**
   * Japanese
   */
  Japanese = 'japanese',
  
  /**
   * Korean
   */
  Korean = 'korean',
  
  /**
   * Spanish
   */
  Spanish = 'spanish',
  
  /**
   * Chinese Simplified
   */
  ChineseSimplified = 'chinese_simplified',
  
  /**
   * Chinese Traditional
   */
  ChineseTraditional = 'chinese_traditional',
  
  /**
   * French
   */
  French = 'french',
  
  /**
   * Italian
   */
  Italian = 'italian',
  
  /**
   * Czech
   */
  Czech = 'czech',
  
  /**
   * Portuguese
   */
  Portuguese = 'portuguese',
}

/**
 * Generate a random mnemonic phrase
 * @param strength Mnemonic strength (default: 128 bits / 12 words)
 * @param language Mnemonic language (default: English)
 * @returns Mnemonic phrase
 */
export async function generateMnemonic(
  strength: MnemonicStrength = MnemonicStrength.Low,
  language: MnemonicLanguage = MnemonicLanguage.English
): Promise<string> {
  return tryAsync(async () => {
    try {
      // Set the wordlist
      const wordlist = bip39.wordlists[language];
      
      // Generate mnemonic
      const mnemonic = bip39.generateMnemonic(strength, undefined, wordlist);
      
      return mnemonic;
    } catch (error: any) {
      throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to generate mnemonic: ${error.message}`);
    }
  }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to generate mnemonic');
}

/**
 * Validate a mnemonic phrase
 * @param mnemonic Mnemonic phrase to validate
 * @param language Mnemonic language (default: English)
 * @returns Whether the mnemonic is valid
 */
export function validateMnemonic(
  mnemonic: string,
  language: MnemonicLanguage = MnemonicLanguage.English
): boolean {
  try {
    // Set the wordlist
    const wordlist = bip39.wordlists[language];
    
    // Validate mnemonic
    return bip39.validateMnemonic(mnemonic, wordlist);
  } catch (error) {
    return false;
  }
}

/**
 * Get the word count for a mnemonic strength
 * @param strength Mnemonic strength
 * @returns Word count
 */
export function getWordCount(strength: MnemonicStrength): number {
  return strength / 32 * 3;
}

/**
 * Get the mnemonic strength from a word count
 * @param wordCount Word count
 * @returns Mnemonic strength
 */
export function getStrengthFromWordCount(wordCount: number): MnemonicStrength {
  switch (wordCount) {
    case 12:
      return MnemonicStrength.Low;
    case 15:
      return MnemonicStrength.Medium;
    case 18:
      return MnemonicStrength.High;
    case 21:
      return MnemonicStrength.VeryHigh;
    case 24:
      return MnemonicStrength.Highest;
    default:
      throw new DarkSwapError(ErrorCode.INVALID_ARGUMENT, `Invalid word count: ${wordCount}`);
  }
}

/**
 * Convert a mnemonic to a seed
 * @param mnemonic Mnemonic phrase
 * @param passphrase Optional passphrase (default: empty string)
 * @returns Seed as a hex string
 */
export async function mnemonicToSeed(mnemonic: string, passphrase: string = ''): Promise<string> {
  return tryAsync(async () => {
    try {
      // Validate mnemonic
      if (!validateMnemonic(mnemonic)) {
        throw new DarkSwapError(ErrorCode.INVALID_ARGUMENT, 'Invalid mnemonic');
      }
      
      // Convert mnemonic to seed
      const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
      
      // Convert seed to hex
      return seed.toString('hex');
    } catch (error: any) {
      if (error instanceof DarkSwapError) {
        throw error;
      }
      
      throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to convert mnemonic to seed: ${error.message}`);
    }
  }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to convert mnemonic to seed');
}

/**
 * Convert a mnemonic to entropy
 * @param mnemonic Mnemonic phrase
 * @returns Entropy as a hex string
 */
export function mnemonicToEntropy(mnemonic: string): string {
  try {
    // Validate mnemonic
    if (!validateMnemonic(mnemonic)) {
      throw new DarkSwapError(ErrorCode.INVALID_ARGUMENT, 'Invalid mnemonic');
    }
    
    // Convert mnemonic to entropy
    return bip39.mnemonicToEntropy(mnemonic);
  } catch (error: any) {
    if (error instanceof DarkSwapError) {
      throw error;
    }
    
    throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to convert mnemonic to entropy: ${error.message}`);
  }
}

/**
 * Convert entropy to a mnemonic
 * @param entropy Entropy as a hex string
 * @param language Mnemonic language (default: English)
 * @returns Mnemonic phrase
 */
export function entropyToMnemonic(
  entropy: string,
  language: MnemonicLanguage = MnemonicLanguage.English
): string {
  try {
    // Set the wordlist
    const wordlist = bip39.wordlists[language];
    
    // Convert entropy to mnemonic
    return bip39.entropyToMnemonic(entropy, wordlist);
  } catch (error: any) {
    throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to convert entropy to mnemonic: ${error.message}`);
  }
}

/**
 * Get the word list for a language
 * @param language Mnemonic language (default: English)
 * @returns Word list
 */
export function getWordList(language: MnemonicLanguage = MnemonicLanguage.English): string[] {
  return bip39.wordlists[language];
}

/**
 * Get all supported languages
 * @returns Supported languages
 */
export function getSupportedLanguages(): MnemonicLanguage[] {
  return Object.values(MnemonicLanguage);
}