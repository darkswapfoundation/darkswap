import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  comparePassword,
  generateAuthToken,
  verifyAuthToken,
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  resetPassword,
  generatePasswordResetToken,
} from '../../../src/utils/auth';
import { db } from '../../../src/db';

describe('Auth Utils', () => {
  // Create stubs for database operations
  let dbStub: sinon.SinonStub;
  
  beforeEach(() => {
    // Create a stub for the database
    dbStub = sinon.stub(db.users);
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      // Stub bcrypt.genSalt
      const genSaltStub = sinon.stub(bcrypt, 'genSalt').resolves('salt');
      
      // Stub bcrypt.hash
      const hashStub = sinon.stub(bcrypt, 'hash').resolves('hashed-password');
      
      // Call the function
      const result = await hashPassword('password');
      
      // Check the result
      expect(result).to.equal('hashed-password');
      
      // Check that bcrypt.genSalt was called with the correct arguments
      expect(genSaltStub.calledOnceWith(10)).to.be.true;
      
      // Check that bcrypt.hash was called with the correct arguments
      expect(hashStub.calledOnceWith('password', 'salt')).to.be.true;
    });
    
    it('should throw an error if bcrypt.genSalt fails', async () => {
      // Stub bcrypt.genSalt to throw an error
      sinon.stub(bcrypt, 'genSalt').rejects(new Error('genSalt error'));
      
      // Call the function and check that it throws an error
      try {
        await hashPassword('password');
        expect.fail('Expected hashPassword to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('genSalt error');
      }
    });
    
    it('should throw an error if bcrypt.hash fails', async () => {
      // Stub bcrypt.genSalt
      sinon.stub(bcrypt, 'genSalt').resolves('salt');
      
      // Stub bcrypt.hash to throw an error
      sinon.stub(bcrypt, 'hash').rejects(new Error('hash error'));
      
      // Call the function and check that it throws an error
      try {
        await hashPassword('password');
        expect.fail('Expected hashPassword to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('hash error');
      }
    });
  });
  
  describe('comparePassword', () => {
    it('should return true if the password matches the hash', async () => {
      // Stub bcrypt.compare
      sinon.stub(bcrypt, 'compare').resolves(true);
      
      // Call the function
      const result = await comparePassword('password', 'hash');
      
      // Check the result
      expect(result).to.be.true;
    });
    
    it('should return false if the password does not match the hash', async () => {
      // Stub bcrypt.compare
      sinon.stub(bcrypt, 'compare').resolves(false);
      
      // Call the function
      const result = await comparePassword('password', 'hash');
      
      // Check the result
      expect(result).to.be.false;
    });
    
    it('should throw an error if bcrypt.compare fails', async () => {
      // Stub bcrypt.compare to throw an error
      sinon.stub(bcrypt, 'compare').rejects(new Error('compare error'));
      
      // Call the function and check that it throws an error
      try {
        await comparePassword('password', 'hash');
        expect.fail('Expected comparePassword to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('compare error');
      }
    });
  });
  
  describe('generateAuthToken', () => {
    it('should generate an authentication token', () => {
      // Stub process.env
      const originalEnv = process.env;
      process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
      
      // Stub jwt.sign
      const signStub = sinon.stub(jwt, 'sign').returns('token');
      
      // Call the function
      const result = generateAuthToken('user-id');
      
      // Check the result
      expect(result).to.equal('token');
      
      // Check that jwt.sign was called with the correct arguments
      expect(signStub.calledOnceWith(
        { userId: 'user-id' },
        'test-secret',
        { expiresIn: '1d' }
      )).to.be.true;
      
      // Restore process.env
      process.env = originalEnv;
    });
    
    it('should use the default secret if JWT_SECRET is not set', () => {
      // Stub process.env
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.JWT_SECRET;
      
      // Stub jwt.sign
      const signStub = sinon.stub(jwt, 'sign').returns('token');
      
      // Call the function
      const result = generateAuthToken('user-id');
      
      // Check the result
      expect(result).to.equal('token');
      
      // Check that jwt.sign was called with the correct arguments
      expect(signStub.calledOnceWith(
        { userId: 'user-id' },
        'default-secret',
        { expiresIn: '1d' }
      )).to.be.true;
      
      // Restore process.env
      process.env = originalEnv;
    });
  });
  
  describe('verifyAuthToken', () => {
    it('should return the user ID if the token is valid', () => {
      // Stub process.env
      const originalEnv = process.env;
      process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
      
      // Stub jwt.verify
      sinon.stub(jwt, 'verify').returns({ userId: 'user-id' });
      
      // Call the function
      const result = verifyAuthToken('token');
      
      // Check the result
      expect(result).to.equal('user-id');
      
      // Restore process.env
      process.env = originalEnv;
    });
    
    it('should return null if the token is invalid', () => {
      // Stub process.env
      const originalEnv = process.env;
      process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
      
      // Stub jwt.verify to throw an error
      sinon.stub(jwt, 'verify').throws(new Error('invalid token'));
      
      // Call the function
      const result = verifyAuthToken('token');
      
      // Check the result
      expect(result).to.be.null;
      
      // Restore process.env
      process.env = originalEnv;
    });
    
    it('should use the default secret if JWT_SECRET is not set', () => {
      // Stub process.env
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.JWT_SECRET;
      
      // Stub jwt.verify
      const verifyStub = sinon.stub(jwt, 'verify').returns({ userId: 'user-id' });
      
      // Call the function
      const result = verifyAuthToken('token');
      
      // Check the result
      expect(result).to.equal('user-id');
      
      // Check that jwt.verify was called with the correct arguments
      expect(verifyStub.calledOnceWith('token', 'default-secret')).to.be.true;
      
      // Restore process.env
      process.env = originalEnv;
    });
  });
  
  describe('registerUser', () => {
    it('should register a new user', async () => {
      // Stub db.users.findOne
      dbStub.findOne = sinon.stub().resolves(null);
      
      // Stub db.users.insertOne
      dbStub.insertOne = sinon.stub().resolves();
      
      // Stub hashPassword
      const hashPasswordStub = sinon.stub().resolves('hashed-password');
      const authModule = require('../../../src/utils/auth');
      authModule.hashPassword = hashPasswordStub;
      
      // Stub generateAuthToken
      const generateAuthTokenStub = sinon.stub().returns('token');
      authModule.generateAuthToken = generateAuthTokenStub;
      
      // Stub uuid.v4
      const uuidStub = sinon.stub().returns('user-id');
      const uuid = require('uuid');
      uuid.v4 = uuidStub;
      
      // Call the function
      const result = await registerUser('username', 'email', 'password');
      
      // Check the result
      expect(result).to.deep.equal({
        userId: 'user-id',
        token: 'token',
      });
      
      // Check that db.users.findOne was called with the correct arguments
      expect(dbStub.findOne.calledOnceWith({ email: 'email' })).to.be.true;
      
      // Check that hashPassword was called with the correct arguments
      expect(hashPasswordStub.calledOnceWith('password')).to.be.true;
      
      // Check that db.users.insertOne was called with the correct arguments
      expect(dbStub.insertOne.calledOnce).to.be.true;
      const insertOneArgs = dbStub.insertOne.firstCall.args[0];
      expect(insertOneArgs).to.have.property('id', 'user-id');
      expect(insertOneArgs).to.have.property('username', 'username');
      expect(insertOneArgs).to.have.property('email', 'email');
      expect(insertOneArgs).to.have.property('password', 'hashed-password');
      expect(insertOneArgs).to.have.property('createdAt');
      expect(insertOneArgs).to.have.property('updatedAt');
      
      // Check that generateAuthToken was called with the correct arguments
      expect(generateAuthTokenStub.calledOnceWith('user-id')).to.be.true;
    });
    
    it('should throw an error if the email is already in use', async () => {
      // Stub db.users.findOne
      dbStub.findOne = sinon.stub().resolves({ id: 'existing-user-id' });
      
      // Call the function and check that it throws an error
      try {
        await registerUser('username', 'email', 'password');
        expect.fail('Expected registerUser to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('Email already in use');
      }
      
      // Check that db.users.findOne was called with the correct arguments
      expect(dbStub.findOne.calledOnceWith({ email: 'email' })).to.be.true;
    });
  });
  
  describe('loginUser', () => {
    it('should login a user with valid credentials', async () => {
      // Stub db.users.findOne
      dbStub.findOne = sinon.stub().resolves({
        id: 'user-id',
        email: 'email',
        password: 'hashed-password',
      });
      
      // Stub comparePassword
      const comparePasswordStub = sinon.stub().resolves(true);
      const authModule = require('../../../src/utils/auth');
      authModule.comparePassword = comparePasswordStub;
      
      // Stub generateAuthToken
      const generateAuthTokenStub = sinon.stub().returns('token');
      authModule.generateAuthToken = generateAuthTokenStub;
      
      // Call the function
      const result = await loginUser('email', 'password');
      
      // Check the result
      expect(result).to.deep.equal({
        userId: 'user-id',
        token: 'token',
      });
      
      // Check that db.users.findOne was called with the correct arguments
      expect(dbStub.findOne.calledOnceWith({ email: 'email' })).to.be.true;
      
      // Check that comparePassword was called with the correct arguments
      expect(comparePasswordStub.calledOnceWith('password', 'hashed-password')).to.be.true;
      
      // Check that generateAuthToken was called with the correct arguments
      expect(generateAuthTokenStub.calledOnceWith('user-id')).to.be.true;
    });
    
    it('should throw an error if the user is not found', async () => {
      // Stub db.users.findOne
      dbStub.findOne = sinon.stub().resolves(null);
      
      // Call the function and check that it throws an error
      try {
        await loginUser('email', 'password');
        expect.fail('Expected loginUser to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('Invalid credentials');
      }
      
      // Check that db.users.findOne was called with the correct arguments
      expect(dbStub.findOne.calledOnceWith({ email: 'email' })).to.be.true;
    });
    
    it('should throw an error if the password is incorrect', async () => {
      // Stub db.users.findOne
      dbStub.findOne = sinon.stub().resolves({
        id: 'user-id',
        email: 'email',
        password: 'hashed-password',
      });
      
      // Stub comparePassword
      const comparePasswordStub = sinon.stub().resolves(false);
      const authModule = require('../../../src/utils/auth');
      authModule.comparePassword = comparePasswordStub;
      
      // Call the function and check that it throws an error
      try {
        await loginUser('email', 'password');
        expect.fail('Expected loginUser to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('Invalid credentials');
      }
      
      // Check that db.users.findOne was called with the correct arguments
      expect(dbStub.findOne.calledOnceWith({ email: 'email' })).to.be.true;
      
      // Check that comparePassword was called with the correct arguments
      expect(comparePasswordStub.calledOnceWith('password', 'hashed-password')).to.be.true;
    });
  });
});