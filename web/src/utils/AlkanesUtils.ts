/**
 * Alkanes Utilities
 * 
 * This utility provides functionality for working with Alkanes.
 * It includes methods for fetching alkane information, creating alkane transactions,
 * and managing alkane balances.
 */

import { BitcoinTransactionUtils, TransactionInput, TransactionOutput, TransactionOptions } from './BitcoinTransactionUtils';

/**
 * Alkane interface
 */
export interface Alkane {
  id: string;
  ticker: string;
  name: string;
  decimals: number;
  supply: string;
  limit?: string;
  description?: string;
  creator: string;
  timestamp: number;
  properties?: {
    [key: string]: string;
  };
}

/**
 * Alkane balance interface
 */
export interface AlkaneBalance {
  alkaneId: string;
  ticker: string;
  name: string;
  balance: string;
  decimals: number;
}

/**
 * Alkane transaction interface
 */
export interface AlkaneTransaction {
  txid: string;
  alkaneId: string;
  ticker: string;
  amount: string;
  from: string;
  to: string;
  timestamp: number;
  confirmed: boolean;
  metadata?: {
    [key: string]: string;
  };
}

/**
 * Alkane transfer options interface
 */
export interface AlkaneTransferOptions extends TransactionOptions {
  memo?: string;
  metadata?: {
    [key: string]: string;
  };
}

/**
 * Alkanes Utilities
 */
export class AlkanesUtils {
  // Mock data for development
  private static mockAlkanes: Alkane[] = [
    {
      id: 'alkane1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3lfcg5',
      ticker: 'METH',
      name: 'Methane',
      decimals: 8,
      supply: '100000000',
      limit: '100000000',
      description: 'The simplest alkane',
      creator: 'bc1q84nj8u6c82wz3pj3tvkf73085ej3qtgvzsy8r2',
      timestamp: 1672531200000,
      properties: {
        formula: 'CH4',
        carbonAtoms: '1',
        hydrogenAtoms: '4',
      },
    },
    {
      id: 'alkane1qygnpnqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqxve9c0',
      ticker: 'ETH',
      name: 'Ethane',
      decimals: 8,
      supply: '50000000',
      description: 'The second simplest alkane',
      creator: 'bc1q84nj8u6c82wz3pj3tvkf73085ej3qtgvzsy8r2',
      timestamp: 1672531200000,
      properties: {
        formula: 'C2H6',
        carbonAtoms: '2',
        hydrogenAtoms: '6',
      },
    },
    {
      id: 'alkane1qd3n9yjqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8n6chs',
      ticker: 'PROP',
      name: 'Propane',
      decimals: 8,
      supply: '25000000',
      limit: '25000000',
      description: 'The third simplest alkane',
      creator: 'bc1q84nj8u6c82wz3pj3tvkf73085ej3qtgvzsy8r2',
      timestamp: 1672531200000,
      properties: {
        formula: 'C3H8',
        carbonAtoms: '3',
        hydrogenAtoms: '8',
      },
    },
    {
      id: 'alkane1q5n9yjqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8n6chs',
      ticker: 'BUT',
      name: 'Butane',
      decimals: 8,
      supply: '12500000',
      limit: '12500000',
      description: 'The fourth simplest alkane',
      creator: 'bc1q84nj8u6c82wz3pj3tvkf73085ej3qtgvzsy8r2',
      timestamp: 1672531200000,
      properties: {
        formula: 'C4H10',
        carbonAtoms: '4',
        hydrogenAtoms: '10',
      },
    },
  ];

  private static mockBalances: { [address: string]: AlkaneBalance[] } = {};

  /**
   * Get all alkanes
   * @returns Array of alkanes
   */
  static async getAllAlkanes(): Promise<Alkane[]> {
    try {
      // In a real implementation, this would fetch alkanes from an API
      // For now, we'll return mock data
      return this.mockAlkanes;
    } catch (error) {
      console.error('Error getting alkanes:', error);
      throw error;
    }
  }

  /**
   * Get an alkane by ID
   * @param alkaneId Alkane ID
   * @returns Alkane
   */
  static async getAlkaneById(alkaneId: string): Promise<Alkane | undefined> {
    try {
      // In a real implementation, this would fetch an alkane from an API
      // For now, we'll return mock data
      return this.mockAlkanes.find((alkane) => alkane.id === alkaneId);
    } catch (error) {
      console.error('Error getting alkane:', error);
      throw error;
    }
  }

  /**
   * Get an alkane by ticker
   * @param ticker Alkane ticker
   * @returns Alkane
   */
  static async getAlkaneByTicker(ticker: string): Promise<Alkane | undefined> {
    try {
      // In a real implementation, this would fetch an alkane from an API
      // For now, we'll return mock data
      return this.mockAlkanes.find((alkane) => alkane.ticker === ticker);
    } catch (error) {
      console.error('Error getting alkane:', error);
      throw error;
    }
  }

  /**
   * Get alkane balances for an address
   * @param address Bitcoin address
   * @returns Array of alkane balances
   */
  static async getAlkaneBalances(address: string): Promise<AlkaneBalance[]> {
    try {
      // In a real implementation, this would fetch alkane balances from an API
      // For now, we'll return mock data
      if (!this.mockBalances[address]) {
        // Generate random balances for the address
        this.mockBalances[address] = this.mockAlkanes.map((alkane) => ({
          alkaneId: alkane.id,
          ticker: alkane.ticker,
          name: alkane.name,
          balance: (Math.random() * 1000).toFixed(alkane.decimals),
          decimals: alkane.decimals,
        }));
      }
      
      return this.mockBalances[address];
    } catch (error) {
      console.error('Error getting alkane balances:', error);
      throw error;
    }
  }

  /**
   * Get alkane transactions for an address
   * @param address Bitcoin address
   * @returns Array of alkane transactions
   */
  static async getAlkaneTransactions(address: string): Promise<AlkaneTransaction[]> {
    try {
      // In a real implementation, this would fetch alkane transactions from an API
      // For now, we'll return mock data
      const transactions: AlkaneTransaction[] = [];
      
      // Generate random transactions
      for (let i = 0; i < 5; i++) {
        const alkane = this.mockAlkanes[Math.floor(Math.random() * this.mockAlkanes.length)];
        const isIncoming = Math.random() > 0.5;
        
        transactions.push({
          txid: `txid_${Date.now()}_${i}`,
          alkaneId: alkane.id,
          ticker: alkane.ticker,
          amount: (Math.random() * 100).toFixed(alkane.decimals),
          from: isIncoming ? `bc1q${Math.random().toString(36).substring(2, 15)}` : address,
          to: isIncoming ? address : `bc1q${Math.random().toString(36).substring(2, 15)}`,
          timestamp: Date.now() - Math.floor(Math.random() * 1000000),
          confirmed: Math.random() > 0.2,
          metadata: {
            type: 'transfer',
            note: 'Test transaction',
          },
        });
      }
      
      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting alkane transactions:', error);
      throw error;
    }
  }

  /**
   * Create an alkane transfer transaction
   * @param alkaneId Alkane ID
   * @param amount Amount to transfer
   * @param fromAddress Sender address
   * @param toAddress Recipient address
   * @param inputs Transaction inputs
   * @param options Transaction options
   * @returns Transaction hex
   */
  static async createAlkaneTransferTransaction(
    alkaneId: string,
    amount: string,
    fromAddress: string,
    toAddress: string,
    inputs: TransactionInput[],
    options?: AlkaneTransferOptions
  ): Promise<string> {
    try {
      // In a real implementation, this would create an alkane transfer transaction
      // using the Alkanes protocol
      // For now, we'll create a simple Bitcoin transaction with OP_RETURN data
      
      // Get the alkane
      const alkane = await this.getAlkaneById(alkaneId);
      if (!alkane) {
        throw new Error(`Alkane ${alkaneId} not found`);
      }
      
      // Create outputs
      const outputs: TransactionOutput[] = [
        {
          address: toAddress,
          value: 546, // Dust amount
        },
      ];
      
      // Set change address if not provided
      const txOptions: TransactionOptions = {
        ...options,
        changeAddress: options?.changeAddress || fromAddress,
      };
      
      // Create the transaction
      const txHex = BitcoinTransactionUtils.createTransaction(inputs, outputs, txOptions);
      
      // In a real implementation, we would add the alkane transfer data to the transaction
      // For now, we'll just return the transaction hex
      
      return txHex;
    } catch (error) {
      console.error('Error creating alkane transfer transaction:', error);
      throw error;
    }
  }

  /**
   * Parse alkane data from a transaction
   * @param txHex Transaction hex
   * @returns Alkane data
   */
  static parseAlkaneData(txHex: string): { alkaneId: string; amount: string } | undefined {
    try {
      // In a real implementation, this would parse alkane data from a transaction
      // For now, we'll return mock data
      return {
        alkaneId: this.mockAlkanes[0].id,
        amount: '100',
      };
    } catch (error) {
      console.error('Error parsing alkane data:', error);
      return undefined;
    }
  }

  /**
   * Format alkane amount
   * @param amount Amount in smallest unit
   * @param decimals Number of decimal places
   * @returns Formatted amount
   */
  static formatAlkaneAmount(amount: string, decimals: number): string {
    try {
      // Convert amount to number
      const amountNum = parseFloat(amount);
      
      // Divide by 10^decimals
      const formattedAmount = amountNum / Math.pow(10, decimals);
      
      // Format with the correct number of decimal places
      return formattedAmount.toFixed(decimals);
    } catch (error) {
      console.error('Error formatting alkane amount:', error);
      return amount;
    }
  }

  /**
   * Parse alkane amount
   * @param amount Formatted amount
   * @param decimals Number of decimal places
   * @returns Amount in smallest unit
   */
  static parseAlkaneAmount(amount: string, decimals: number): string {
    try {
      // Convert amount to number
      const amountNum = parseFloat(amount);
      
      // Multiply by 10^decimals
      const parsedAmount = amountNum * Math.pow(10, decimals);
      
      // Return as string
      return parsedAmount.toString();
    } catch (error) {
      console.error('Error parsing alkane amount:', error);
      return amount;
    }
  }

  /**
   * Get alkane properties
   * @param alkaneId Alkane ID
   * @returns Alkane properties
   */
  static async getAlkaneProperties(alkaneId: string): Promise<{ [key: string]: string } | undefined> {
    try {
      // In a real implementation, this would fetch alkane properties from an API
      // For now, we'll return mock data
      const alkane = await this.getAlkaneById(alkaneId);
      return alkane?.properties;
    } catch (error) {
      console.error('Error getting alkane properties:', error);
      throw error;
    }
  }

  /**
   * Get alkane metadata
   * @param alkaneId Alkane ID
   * @returns Alkane metadata
   */
  static async getAlkaneMetadata(alkaneId: string): Promise<{ [key: string]: string } | undefined> {
    try {
      // In a real implementation, this would fetch alkane metadata from an API
      // For now, we'll return mock data
      const alkane = await this.getAlkaneById(alkaneId);
      if (!alkane) return undefined;
      
      return {
        name: alkane.name,
        ticker: alkane.ticker,
        description: alkane.description || '',
        creator: alkane.creator,
        timestamp: alkane.timestamp.toString(),
        supply: alkane.supply,
        limit: alkane.limit || '',
        decimals: alkane.decimals.toString(),
        ...alkane.properties,
      };
    } catch (error) {
      console.error('Error getting alkane metadata:', error);
      throw error;
    }
  }
}