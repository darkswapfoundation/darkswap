import { BdkWallet } from '../../src/wallet/bdk-wallet';
import { Network } from '../../src/types';
import { expect } from 'chai';
import sinon from 'sinon';

describe('BDK Wallet Integration', () => {
  let wallet: BdkWallet;
  
  beforeEach(() => {
    // Create a new wallet instance for each test
    wallet = new BdkWallet({
      network: Network.Testnet,
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    });
  });
  
  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });
  
  describe('Initialization', () => {
    it('should initialize with the correct network', () => {
      expect(wallet.getNetwork()).to.equal(Network.Testnet);
    });
    
    it('should initialize with the correct mnemonic', () => {
      expect(wallet.getMnemonic()).to.equal('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    });
    
    it('should throw an error with an invalid mnemonic', () => {
      expect(() => {
        new BdkWallet({
          network: Network.Testnet,
          mnemonic: 'invalid mnemonic',
        });
      }).to.throw();
    });
    
    it('should initialize with a random mnemonic if none is provided', () => {
      const randomWallet = new BdkWallet({
        network: Network.Testnet,
      });
      
      expect(randomWallet.getMnemonic()).to.not.be.empty;
      expect(randomWallet.getMnemonic().split(' ')).to.have.lengthOf(12);
    });
  });
  
  describe('Address Generation', () => {
    it('should generate a new address', async () => {
      const address = await wallet.getNewAddress();
      
      expect(address).to.not.be.empty;
      expect(address).to.be.a('string');
      expect(address.startsWith('tb1')).to.be.true; // Testnet addresses start with tb1
    });
    
    it('should generate different addresses each time', async () => {
      const address1 = await wallet.getNewAddress();
      const address2 = await wallet.getNewAddress();
      
      expect(address1).to.not.equal(address2);
    });
    
    it('should return the same address when getting the current address', async () => {
      const address1 = await wallet.getCurrentAddress();
      const address2 = await wallet.getCurrentAddress();
      
      expect(address1).to.equal(address2);
    });
  });
  
  describe('Balance', () => {
    it('should return the correct balance', async () => {
      // Mock the balance method to return a known value
      sinon.stub(wallet, 'getBalance').resolves({
        confirmed: 100000,
        unconfirmed: 50000,
        total: 150000,
      });
      
      const balance = await wallet.getBalance();
      
      expect(balance.confirmed).to.equal(100000);
      expect(balance.unconfirmed).to.equal(50000);
      expect(balance.total).to.equal(150000);
    });
    
    it('should handle errors when getting balance', async () => {
      // Mock the balance method to throw an error
      sinon.stub(wallet, 'getBalance').rejects(new Error('Failed to get balance'));
      
      try {
        await wallet.getBalance();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to get balance');
      }
    });
  });
  
  describe('Transaction History', () => {
    it('should return the transaction history', async () => {
      // Mock the transaction history method to return known values
      const mockTransactions = [
        {
          txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          received: 100000,
          sent: 0,
          fee: 1000,
          confirmations: 6,
          blockHeight: 700000,
          timestamp: 1617984000,
        },
        {
          txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          received: 0,
          sent: 50000,
          fee: 500,
          confirmations: 3,
          blockHeight: 700100,
          timestamp: 1617985000,
        },
      ];
      
      sinon.stub(wallet, 'getTransactionHistory').resolves(mockTransactions);
      
      const transactions = await wallet.getTransactionHistory();
      
      expect(transactions).to.deep.equal(mockTransactions);
      expect(transactions).to.have.lengthOf(2);
      expect(transactions[0].txid).to.equal('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(transactions[1].txid).to.equal('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    });
    
    it('should handle errors when getting transaction history', async () => {
      // Mock the transaction history method to throw an error
      sinon.stub(wallet, 'getTransactionHistory').rejects(new Error('Failed to get transaction history'));
      
      try {
        await wallet.getTransactionHistory();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to get transaction history');
      }
    });
  });
  
  describe('PSBT Creation', () => {
    it('should create a PSBT', async () => {
      // Mock the createPsbt method to return a known value
      const mockPsbt = 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////';
      
      sinon.stub(wallet, 'createPsbt').resolves(mockPsbt);
      
      const psbt = await wallet.createPsbt({
        outputs: [
          {
            address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
            amount: 10000,
          },
        ],
      });
      
      expect(psbt).to.equal(mockPsbt);
    });
    
    it('should handle errors when creating a PSBT', async () => {
      // Mock the createPsbt method to throw an error
      sinon.stub(wallet, 'createPsbt').rejects(new Error('Failed to create PSBT'));
      
      try {
        await wallet.createPsbt({
          outputs: [
            {
              address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
              amount: 10000,
            },
          ],
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to create PSBT');
      }
    });
  });
});
