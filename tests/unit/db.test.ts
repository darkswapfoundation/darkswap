import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { MongoClient, Db, Collection } from 'mongodb';
import dbConnection, { db } from '../../src/db';
import { logger } from '../../src/utils/logger';

describe('Database Connection', () => {
  // Create stubs for MongoDB
  let mongoClientStub: sinon.SinonStub;
  let dbInstanceStub: sinon.SinonStub;
  let collectionStub: sinon.SinonStub;
  let loggerInfoStub: sinon.SinonStub;
  let loggerErrorStub: sinon.SinonStub;
  
  beforeEach(() => {
    // Create stubs for MongoDB
    mongoClientStub = sinon.stub(MongoClient, 'connect');
    
    // Create stubs for logger
    loggerInfoStub = sinon.stub(logger, 'info');
    loggerErrorStub = sinon.stub(logger, 'error');
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('connect', () => {
    it('should connect to the database', async () => {
      // Create mock objects
      const mockCollection = {} as Collection;
      const mockDb = {
        collection: sinon.stub().returns(mockCollection),
      } as unknown as Db;
      const mockClient = {
        db: sinon.stub().returns(mockDb),
      } as unknown as MongoClient;
      
      // Stub MongoClient.connect to return the mock client
      mongoClientStub.resolves(mockClient);
      
      // Call the connect method
      await dbConnection.connect();
      
      // Check that MongoClient.connect was called with the correct arguments
      expect(mongoClientStub.calledOnce).to.be.true;
      expect(mongoClientStub.firstCall.args[0]).to.equal('mongodb://localhost:27017/darkswap');
      
      // Check that client.db was called
      expect(mockClient.db.calledOnce).to.be.true;
      
      // Check that db.collection was called for each collection
      expect(mockDb.collection.callCount).to.equal(9);
      expect(mockDb.collection.calledWith('users')).to.be.true;
      expect(mockDb.collection.calledWith('orders')).to.be.true;
      expect(mockDb.collection.calledWith('trades')).to.be.true;
      expect(mockDb.collection.calledWith('assets')).to.be.true;
      expect(mockDb.collection.calledWith('wallets')).to.be.true;
      expect(mockDb.collection.calledWith('transactions')).to.be.true;
      expect(mockDb.collection.calledWith('sessions')).to.be.true;
      expect(mockDb.collection.calledWith('apiKeys')).to.be.true;
      expect(mockDb.collection.calledWith('twoFactorSecrets')).to.be.true;
      
      // Check that logger.info was called
      expect(loggerInfoStub.calledOnceWith('Connected to database')).to.be.true;
    });
    
    it('should use the MongoDB URI from environment variables', async () => {
      // Set the MongoDB URI environment variable
      const originalEnv = process.env;
      process.env = { ...originalEnv, MONGODB_URI: 'mongodb://test:27017/test' };
      
      // Create mock objects
      const mockCollection = {} as Collection;
      const mockDb = {
        collection: sinon.stub().returns(mockCollection),
      } as unknown as Db;
      const mockClient = {
        db: sinon.stub().returns(mockDb),
      } as unknown as MongoClient;
      
      // Stub MongoClient.connect to return the mock client
      mongoClientStub.resolves(mockClient);
      
      // Call the connect method
      await dbConnection.connect();
      
      // Check that MongoClient.connect was called with the correct arguments
      expect(mongoClientStub.calledOnce).to.be.true;
      expect(mongoClientStub.firstCall.args[0]).to.equal('mongodb://test:27017/test');
      
      // Restore the environment variables
      process.env = originalEnv;
    });
    
    it('should throw an error if the connection fails', async () => {
      // Stub MongoClient.connect to throw an error
      mongoClientStub.rejects(new Error('Connection error'));
      
      // Call the connect method and check that it throws an error
      try {
        await dbConnection.connect();
        expect.fail('Expected connect to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('Connection error');
      }
      
      // Check that logger.error was called
      expect(loggerErrorStub.calledOnce).to.be.true;
      expect(loggerErrorStub.firstCall.args[0]).to.equal('Failed to connect to database');
      expect(loggerErrorStub.firstCall.args[1]).to.be.an.instanceOf(Error);
      expect(loggerErrorStub.firstCall.args[1].message).to.equal('Connection error');
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect from the database', async () => {
      // Create mock objects
      const mockClient = {
        close: sinon.stub().resolves(),
      } as unknown as MongoClient;
      
      // Set the client property
      (dbConnection as any).client = mockClient;
      
      // Call the disconnect method
      await dbConnection.disconnect();
      
      // Check that client.close was called
      expect(mockClient.close.calledOnce).to.be.true;
      
      // Check that the client property was set to null
      expect((dbConnection as any).client).to.be.null;
      
      // Check that the dbInstance property was set to null
      expect((dbConnection as any).dbInstance).to.be.null;
      
      // Check that the db property was set to null
      expect((dbConnection as any).db).to.be.null;
      
      // Check that logger.info was called
      expect(loggerInfoStub.calledOnceWith('Disconnected from database')).to.be.true;
    });
    
    it('should do nothing if the client is null', async () => {
      // Set the client property to null
      (dbConnection as any).client = null;
      
      // Call the disconnect method
      await dbConnection.disconnect();
      
      // Check that logger.info was not called
      expect(loggerInfoStub.called).to.be.false;
    });
    
    it('should throw an error if the disconnection fails', async () => {
      // Create mock objects
      const mockClient = {
        close: sinon.stub().rejects(new Error('Disconnection error')),
      } as unknown as MongoClient;
      
      // Set the client property
      (dbConnection as any).client = mockClient;
      
      // Call the disconnect method and check that it throws an error
      try {
        await dbConnection.disconnect();
        expect.fail('Expected disconnect to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('Disconnection error');
      }
      
      // Check that logger.error was called
      expect(loggerErrorStub.calledOnce).to.be.true;
      expect(loggerErrorStub.firstCall.args[0]).to.equal('Failed to disconnect from database');
      expect(loggerErrorStub.firstCall.args[1]).to.be.an.instanceOf(Error);
      expect(loggerErrorStub.firstCall.args[1].message).to.equal('Disconnection error');
    });
  });
  
  describe('getDb', () => {
    it('should return the database instance', () => {
      // Create a mock database
      const mockDb = { users: {} } as any;
      
      // Set the db property
      (dbConnection as any).db = mockDb;
      
      // Call the getDb method
      const result = dbConnection.getDb();
      
      // Check that the database instance was returned
      expect(result).to.equal(mockDb);
    });
    
    it('should throw an error if the database is not connected', () => {
      // Set the db property to null
      (dbConnection as any).db = null;
      
      // Call the getDb method and check that it throws an error
      try {
        dbConnection.getDb();
        expect.fail('Expected getDb to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('Database not connected');
      }
    });
  });
  
  describe('db', () => {
    it('should be exported', () => {
      // Check that db is exported
      expect(db).to.exist;
    });
  });
});