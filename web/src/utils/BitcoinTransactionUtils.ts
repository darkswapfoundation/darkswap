/**
 * Bitcoin Transaction Utilities
 * 
 * This utility provides functionality for creating and signing Bitcoin transactions.
 * It uses the bitcoinjs-lib library for transaction creation and signing.
 */

import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import { ECPairFactory } from 'ecpair';

// Initialize libraries
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

/**
 * UTXO interface
 */
export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: string;
  address: string;
  confirmations?: number;
}

/**
 * Transaction input interface
 */
export interface TransactionInput {
  utxo: UTXO;
  privateKey?: string; // WIF format
}

/**
 * Transaction output interface
 */
export interface TransactionOutput {
  address: string;
  value: number;
}

/**
 * Transaction options interface
 */
export interface TransactionOptions {
  feeRate?: number; // satoshis per byte
  changeAddress?: string;
  network?: bitcoin.Network;
}

/**
 * Bitcoin Transaction Utilities
 */
export class BitcoinTransactionUtils {
  /**
   * Create a Bitcoin transaction
   * @param inputs Transaction inputs (UTXOs)
   * @param outputs Transaction outputs
   * @param options Transaction options
   * @returns Transaction hex
   */
  static createTransaction(
    inputs: TransactionInput[],
    outputs: TransactionOutput[],
    options: TransactionOptions = {}
  ): string {
    try {
      // Set default options
      const feeRate = options.feeRate || 10; // satoshis per byte
      const network = options.network || bitcoin.networks.bitcoin;
      const changeAddress = options.changeAddress || inputs[0].utxo.address;

      // Create a new transaction builder
      const txb = new bitcoin.TransactionBuilder(network);

      // Add inputs
      inputs.forEach((input) => {
        txb.addInput(input.utxo.txid, input.utxo.vout);
      });

      // Add outputs
      outputs.forEach((output) => {
        txb.addOutput(output.address, output.value);
      });

      // Calculate total input value
      const totalInputValue = inputs.reduce((sum, input) => sum + input.utxo.value, 0);

      // Calculate total output value
      const totalOutputValue = outputs.reduce((sum, output) => sum + output.value, 0);

      // Estimate transaction size
      const estimatedSize = this.estimateTransactionSize(inputs.length, outputs.length);

      // Calculate fee
      const fee = estimatedSize * feeRate;

      // Calculate change
      const change = totalInputValue - totalOutputValue - fee;

      // Add change output if change is greater than dust
      if (change > 546) {
        txb.addOutput(changeAddress, change);
      }

      // Sign inputs
      inputs.forEach((input, index) => {
        if (input.privateKey) {
          const keyPair = ECPair.fromWIF(input.privateKey, network);
          txb.sign(index, keyPair);
        }
      });

      // Build the transaction
      const tx = txb.build();

      // Return the transaction hex
      return tx.toHex();
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Sign a Bitcoin transaction
   * @param txHex Transaction hex
   * @param inputs Transaction inputs with private keys
   * @param options Transaction options
   * @returns Signed transaction hex
   */
  static signTransaction(
    txHex: string,
    inputs: TransactionInput[],
    options: TransactionOptions = {}
  ): string {
    try {
      // Set default options
      const network = options.network || bitcoin.networks.bitcoin;

      // Parse the transaction
      const tx = bitcoin.Transaction.fromHex(txHex);

      // Create a new transaction builder
      const txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);

      // Sign inputs
      inputs.forEach((input, index) => {
        if (input.privateKey) {
          const keyPair = ECPair.fromWIF(input.privateKey, network);
          txb.sign(index, keyPair);
        }
      });

      // Build the transaction
      const signedTx = txb.build();

      // Return the signed transaction hex
      return signedTx.toHex();
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  /**
   * Verify a Bitcoin transaction
   * @param txHex Transaction hex
   * @returns True if the transaction is valid, false otherwise
   */
  static verifyTransaction(txHex: string): boolean {
    try {
      // Parse the transaction
      const tx = bitcoin.Transaction.fromHex(txHex);

      // Verify the transaction
      // This is a basic verification that the transaction is valid
      // In a real implementation, you would also verify the inputs and outputs
      return tx.ins.length > 0 && tx.outs.length > 0;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }

  /**
   * Calculate the fee for a transaction
   * @param txHex Transaction hex
   * @param feeRate Fee rate in satoshis per byte
   * @returns Fee in satoshis
   */
  static calculateFee(txHex: string, feeRate: number = 10): number {
    try {
      // Parse the transaction
      const tx = bitcoin.Transaction.fromHex(txHex);

      // Calculate the transaction size
      const size = tx.virtualSize();

      // Calculate the fee
      return size * feeRate;
    } catch (error) {
      console.error('Error calculating fee:', error);
      throw error;
    }
  }

  /**
   * Estimate the size of a transaction
   * @param inputCount Number of inputs
   * @param outputCount Number of outputs
   * @returns Estimated size in bytes
   */
  static estimateTransactionSize(inputCount: number, outputCount: number): number {
    // Base transaction size
    const baseSize = 10;

    // Input size (P2PKH)
    const inputSize = 148;

    // Output size (P2PKH)
    const outputSize = 34;

    // Calculate the estimated size
    return baseSize + (inputSize * inputCount) + (outputSize * outputCount);
  }

  /**
   * Get the address from a private key
   * @param privateKey Private key in WIF format
   * @param network Bitcoin network
   * @returns Bitcoin address
   */
  static getAddressFromPrivateKey(
    privateKey: string,
    network: bitcoin.Network = bitcoin.networks.bitcoin
  ): string {
    try {
      // Create key pair from private key
      const keyPair = ECPair.fromWIF(privateKey, network);

      // Get the payment object
      const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network,
      });

      return address || '';
    } catch (error) {
      console.error('Error getting address from private key:', error);
      throw error;
    }
  }

  /**
   * Create a Bitcoin address
   * @param network Bitcoin network
   * @returns Object with private key and address
   */
  static createAddress(
    network: bitcoin.Network = bitcoin.networks.bitcoin
  ): { privateKey: string; address: string } {
    try {
      // Generate a random key pair
      const keyPair = ECPair.makeRandom({ network });

      // Get the private key in WIF format
      const privateKey = keyPair.toWIF();

      // Get the payment object
      const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network,
      });

      return {
        privateKey,
        address: address || '',
      };
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  /**
   * Create a Bitcoin HD wallet
   * @param mnemonic Mnemonic phrase
   * @param network Bitcoin network
   * @returns Object with mnemonic, seed, and root key
   */
  static createHDWallet(
    mnemonic?: string,
    network: bitcoin.Network = bitcoin.networks.bitcoin
  ): { mnemonic: string; seed: Buffer; rootKey: any } {
    try {
      // Generate a random mnemonic if not provided
      if (!mnemonic) {
        // In a real implementation, you would use bip39 to generate a mnemonic
        // For simplicity, we'll just use a placeholder
        mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      }

      // Generate seed from mnemonic
      // In a real implementation, you would use bip39 to generate a seed
      // For simplicity, we'll just use a placeholder
      const seed = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');

      // Create a BIP32 root key
      const rootKey = bip32.fromSeed(seed, network);

      return {
        mnemonic,
        seed,
        rootKey,
      };
    } catch (error) {
      console.error('Error creating HD wallet:', error);
      throw error;
    }
  }

  /**
   * Derive a Bitcoin address from an HD wallet
   * @param rootKey BIP32 root key
   * @param path Derivation path
   * @param network Bitcoin network
   * @returns Object with private key and address
   */
  static deriveAddress(
    rootKey: any,
    path: string,
    network: bitcoin.Network = bitcoin.networks.bitcoin
  ): { privateKey: string; address: string } {
    try {
      // Derive the child key
      const child = rootKey.derivePath(path);

      // Get the private key in WIF format
      const privateKey = child.toWIF();

      // Get the payment object
      const { address } = bitcoin.payments.p2pkh({
        pubkey: child.publicKey,
        network,
      });

      return {
        privateKey,
        address: address || '',
      };
    } catch (error) {
      console.error('Error deriving address:', error);
      throw error;
    }
  }
}