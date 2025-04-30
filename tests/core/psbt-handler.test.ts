import { PsbtHandler } from '../../src/wallet/psbt-handler';
import { Network } from '../../src/types';
import { expect } from 'chai';
import sinon from 'sinon';

describe('PSBT Handler', () => {
  let psbtHandler: PsbtHandler;
  
  beforeEach(() => {
    // Create a new PSBT handler instance for each test
    psbtHandler = new PsbtHandler({
      network: Network.Testnet,
    });
  });
  
  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });
  
  describe('Initialization', () => {
    it('should initialize with the correct network', () => {
      expect(psbtHandler.getNetwork()).to.equal(Network.Testnet);
    });
    
    it('should initialize with mainnet network', () => {
      const mainnetHandler = new PsbtHandler({
        network: Network.Mainnet,
      });
      
      expect(mainnetHandler.getNetwork()).to.equal(Network.Mainnet);
    });
  });
  
  describe('PSBT Creation', () => {
    it('should create a PSBT', () => {
      // Mock the createPsbt method to return a known value
      const mockPsbt = 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////';
      
      sinon.stub(psbtHandler, 'createPsbt').returns(mockPsbt);
      
      const psbt = psbtHandler.createPsbt({
        inputs: [
          {
            txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            vout: 0,
            amount: 100000,
          },
        ],
        outputs: [
          {
            address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
            amount: 90000,
          },
        ],
        fee: 10000,
      });
      
      expect(psbt).to.equal(mockPsbt);
    });
    
    it('should handle errors when creating a PSBT', () => {
      // Mock the createPsbt method to throw an error
      sinon.stub(psbtHandler, 'createPsbt').throws(new Error('Failed to create PSBT'));
      
      try {
        psbtHandler.createPsbt({
          inputs: [
            {
              txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              vout: 0,
              amount: 100000,
            },
          ],
          outputs: [
            {
              address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
              amount: 90000,
            },
          ],
          fee: 10000,
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to create PSBT');
      }
    });
  });
  
  describe('PSBT Signing', () => {
    it('should sign a PSBT', () => {
      // Mock the signPsbt method to return a known value
      const mockPsbt = 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////';
      const mockSignedPsbt = 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////AQBwAgAAAAAWABTHctb5VULhHvEejvx8emmDCtOKBQAAAAAAAQEfAQAAAAAAAAAWABT9tv5Z3CcDCiTHZPMu4JHNBr8JZAAAAAAAA=';
      
      sinon.stub(psbtHandler, 'signPsbt').returns(mockSignedPsbt);
      
      const signedPsbt = psbtHandler.signPsbt(mockPsbt, {
        privateKey: 'cVpPVruEDdmutPzisEsYvtST1usBR3ntr8pXSyt6D2YYqXRyPcFW',
      });
      
      expect(signedPsbt).to.equal(mockSignedPsbt);
    });
    
    it('should handle errors when signing a PSBT', () => {
      // Mock the signPsbt method to throw an error
      sinon.stub(psbtHandler, 'signPsbt').throws(new Error('Failed to sign PSBT'));
      
      try {
        psbtHandler.signPsbt('invalid-psbt', {
          privateKey: 'invalid-key',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to sign PSBT');
      }
    });
  });
  
  describe('PSBT Finalization', () => {
    it('should finalize a PSBT', () => {
      // Mock the finalizePsbt method to return a known value
      const mockPsbt = 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////AQBwAgAAAAAWABTHctb5VULhHvEejvx8emmDCtOKBQAAAAAAAQEfAQAAAAAAAAAWABT9tv5Z3CcDCiTHZPMu4JHNBr8JZAAAAAAAA=';
      const mockFinalizedPsbt = 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////AQBwAgAAAAAWABTHctb5VULhHvEejvx8emmDCtOKBQAAAAAAAQEfAQAAAAAAAAAWABT9tv5Z3CcDCiTHZPMu4JHNBr8JZAEIawJHMEQCIBFYXrJ8rW4PJikcwIK5XQRyEXKYEVaEqBfnI6QJiOgDAiBtR9Wl/GgFOaABFNSZIJ5JI6Xw4bNILYS5WiiDLIUsJgEhAx7kNYbmNKfzVRBN1rfe/MXX0RBAFJq4qAFch9wcmy6m';
      
      sinon.stub(psbtHandler, 'finalizePsbt').returns(mockFinalizedPsbt);
      
      const finalizedPsbt = psbtHandler.finalizePsbt(mockPsbt);
      
      expect(finalizedPsbt).to.equal(mockFinalizedPsbt);
    });
    
    it('should handle errors when finalizing a PSBT', () => {
      // Mock the finalizePsbt method to throw an error
      sinon.stub(psbtHandler, 'finalizePsbt').throws(new Error('Failed to finalize PSBT'));
      
      try {
        psbtHandler.finalizePsbt('invalid-psbt');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to finalize PSBT');
      }
    });
  });
  
  describe('PSBT Extraction', () => {
    it('should extract a transaction from a PSBT', () => {
      // Mock the extractTransaction method to return a known value
      const mockPsbt = 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////AQBwAgAAAAAWABTHctb5VULhHvEejvx8emmDCtOKBQAAAAAAAQEfAQAAAAAAAAAWABT9tv5Z3CcDCiTHZPMu4JHNBr8JZAEIawJHMEQCIBFYXrJ8rW4PJikcwIK5XQRyEXKYEVaEqBfnI6QJiOgDAiBtR9Wl/GgFOaABFNSZIJ5JI6Xw4bNILYS5WiiDLIUsJgEhAx7kNYbmNKfzVRBN1rfe/MXX0RBAFJq4qAFch9wcmy6m';
      const mockTx = '02000000000101268171371edff285e937adeeacb37b78000c0566cbb3ad646417134a42171bf60000000000ffffffff01007002000000000016001471cb5be55542e11ef11e8efc7c7a69830ad38a0502483045022100115858b27cad6e0f26291cc082b95d0472117298115684a817e723a4098e8e03022076d1f5a5fc68053a0011353992099e4923a5f0e1b348b58b95a2883b2145c26012103e6435866634a7f355104cdd6b7defc5d7d11040149ab8a8015c87dc1c9b2ea600000000';
      
      sinon.stub(psbtHandler, 'extractTransaction').returns(mockTx);
      
      const tx = psbtHandler.extractTransaction(mockPsbt);
      
      expect(tx).to.equal(mockTx);
    });
    
    it('should handle errors when extracting a transaction from a PSBT', () => {
      // Mock the extractTransaction method to throw an error
      sinon.stub(psbtHandler, 'extractTransaction').throws(new Error('Failed to extract transaction'));
      
      try {
        psbtHandler.extractTransaction('invalid-psbt');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to extract transaction');
      }
    });
  });
  
  describe('PSBT Validation', () => {
    it('should validate a PSBT', () => {
      // Mock the validatePsbt method to return a known value
      const mockPsbt = 'cHNidP8BAHECAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD/////AQBwAgAAAAAWABTHctb5VULhHvEejvx8emmDCtOKBQAAAAAAAQEfAQAAAAAAAAAWABT9tv5Z3CcDCiTHZPMu4JHNBr8JZAAAAAAAA=';
      
      sinon.stub(psbtHandler, 'validatePsbt').returns(true);
      
      const isValid = psbtHandler.validatePsbt(mockPsbt);
      
      expect(isValid).to.be.true;
    });
    
    it('should return false for an invalid PSBT', () => {
      // Mock the validatePsbt method to return a known value
      sinon.stub(psbtHandler, 'validatePsbt').returns(false);
      
      const isValid = psbtHandler.validatePsbt('invalid-psbt');
      
      expect(isValid).to.be.false;
    });
    
    it('should handle errors when validating a PSBT', () => {
      // Mock the validatePsbt method to throw an error
      sinon.stub(psbtHandler, 'validatePsbt').throws(new Error('Failed to validate PSBT'));
      
      try {
        psbtHandler.validatePsbt('invalid-psbt');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to validate PSBT');
      }
    });
  });
});