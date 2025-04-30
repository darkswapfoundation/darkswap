import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { startServer, stopServer } from '../../src/server';
import dbConnection from '../../src/db';
import { logger } from '../../src/utils/logger';
import { verifyAuthToken } from '../../src/utils/auth';

// Import routes
import authRoutes from '../../src/routes/auth';
import orderRoutes from '../../src/routes/orders';
import tradeRoutes from '../../src/routes/trades';
import assetRoutes from '../../src/routes/assets';
import walletRoutes from '../../src/routes/wallet';
import marketRoutes from '../../src/routes/market';
import p2pRoutes from '../../src/routes/p2p';

describe('Server', () => {
  // Create stubs
  let dbConnectionStub: sinon.SinonStub;
  let expressStub: sinon.SinonStub;
  let httpStub: sinon.SinonStub;
  let socketIOStub: sinon.SinonStub;
  let loggerInfoStub: sinon.SinonStub;
  let loggerErrorStub: sinon.SinonStub;
  let verifyAuthTokenStub: sinon.SinonStub;
  
  // Create mock objects
  let mockApp: any;
  let mockServer: any;
  let mockIO: any;
  let mockSocket: any;
  
  beforeEach(() => {
    // Create stubs
    dbConnectionStub = sinon.stub(dbConnection, 'connect').resolves();
    loggerInfoStub = sinon.stub(logger, 'info');
    loggerErrorStub = sinon.stub(logger, 'error');
    verifyAuthTokenStub = sinon.stub({ verifyAuthToken }, 'verifyAuthToken');
    
    // Create mock objects
    mockApp = {
      use: sinon.stub(),
      get: sinon.stub(),
      post: sinon.stub(),
      put: sinon.stub(),
      delete: sinon.stub(),
    };
    mockServer = {
      listen: sinon.stub().callsFake((port, callback) => {
        callback();
        return mockServer;
      }),
      address: sinon.stub().returns({ port: 3000 }),
      close: sinon.stub().callsFake((callback) => {
        callback();
      }),
    };
    mockSocket = {
      id: 'socket-id',
      join: sinon.stub(),
      leave: sinon.stub(),
      on: sinon.stub(),
    };
    mockIO = {
      on: sinon.stub().callsFake((event, callback) => {
        if (event === 'connection') {
          callback(mockSocket);
        }
      }),
    };
    
    // Stub express
    expressStub = sinon.stub().returns(mockApp);
    sinon.stub(express, 'json').returns(() => {});
    sinon.stub(express, 'urlencoded').returns(() => {});
    
    // Stub http.createServer
    httpStub = sinon.stub(http, 'createServer').returns(mockServer);
    
    // Stub Socket.IO
    socketIOStub = sinon.stub().returns(mockIO);
    sinon.stub(global, 'require').callsFake((module) => {
      if (module === 'socket.io') {
        return { Server: socketIOStub };
      }
      return require(module);
    });
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('startServer', () => {
    it('should start the server', async () => {
      // Call the startServer function
      const server = await startServer();
      
      // Check that dbConnection.connect was called
      expect(dbConnectionStub.calledOnce).to.be.true;
      
      // Check that express was called
      expect(expressStub.calledOnce).to.be.true;
      
      // Check that middleware was set up
      expect(mockApp.use.called).to.be.true;
      
      // Check that routes were set up
      expect(mockApp.use.calledWith('/api/auth', authRoutes)).to.be.true;
      expect(mockApp.use.calledWith('/api/orders', sinon.match.func, orderRoutes)).to.be.true;
      expect(mockApp.use.calledWith('/api/trades', sinon.match.func, tradeRoutes)).to.be.true;
      expect(mockApp.use.calledWith('/api/assets', assetRoutes)).to.be.true;
      expect(mockApp.use.calledWith('/api/wallet', sinon.match.func, walletRoutes)).to.be.true;
      expect(mockApp.use.calledWith('/api/market', marketRoutes)).to.be.true;
      expect(mockApp.use.calledWith('/api/p2p', p2pRoutes)).to.be.true;
      
      // Check that http.createServer was called
      expect(httpStub.calledOnceWith(mockApp)).to.be.true;
      
      // Check that Socket.IO was set up
      expect(socketIOStub.calledOnce).to.be.true;
      expect(mockIO.on.calledOnceWith('connection', sinon.match.func)).to.be.true;
      
      // Check that the server was started
      expect(mockServer.listen.calledOnceWith(3000, sinon.match.func)).to.be.true;
      
      // Check that logger.info was called
      expect(loggerInfoStub.calledWith('Server listening on port 3000')).to.be.true;
      
      // Check that the server was returned
      expect(server).to.equal(mockServer);
    });
    
    it('should start the server on the specified port', async () => {
      // Call the startServer function with a port
      await startServer(4000);
      
      // Check that the server was started on the specified port
      expect(mockServer.listen.calledOnceWith(4000, sinon.match.func)).to.be.true;
    });
    
    it('should handle socket connections', async () => {
      // Call the startServer function
      await startServer();
      
      // Check that socket event handlers were set up
      expect(mockSocket.on.calledWith('disconnect', sinon.match.func)).to.be.true;
      expect(mockSocket.on.calledWith('join', sinon.match.func)).to.be.true;
      expect(mockSocket.on.calledWith('leave', sinon.match.func)).to.be.true;
      
      // Call the join event handler
      const joinHandler = mockSocket.on.args.find(args => args[0] === 'join')[1];
      joinHandler('room-id');
      
      // Check that socket.join was called
      expect(mockSocket.join.calledOnceWith('room-id')).to.be.true;
      
      // Call the leave event handler
      const leaveHandler = mockSocket.on.args.find(args => args[0] === 'leave')[1];
      leaveHandler('room-id');
      
      // Check that socket.leave was called
      expect(mockSocket.leave.calledOnceWith('room-id')).to.be.true;
    });
    
    it('should throw an error if the server fails to start', async () => {
      // Stub dbConnection.connect to throw an error
      dbConnectionStub.rejects(new Error('Connection error'));
      
      // Call the startServer function and check that it throws an error
      try {
        await startServer();
        expect.fail('Expected startServer to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('Connection error');
      }
      
      // Check that logger.error was called
      expect(loggerErrorStub.calledOnce).to.be.true;
      expect(loggerErrorStub.firstCall.args[0]).to.equal('Failed to start server');
      expect(loggerErrorStub.firstCall.args[1]).to.be.an.instanceOf(Error);
      expect(loggerErrorStub.firstCall.args[1].message).to.equal('Connection error');
    });
  });
  
  describe('stopServer', () => {
    it('should stop the server', async () => {
      // Create a mock server
      const mockServer = {
        close: sinon.stub().callsFake((callback) => {
          callback();
        }),
      };
      
      // Stub dbConnection.disconnect
      const dbDisconnectStub = sinon.stub(dbConnection, 'disconnect').resolves();
      
      // Call the stopServer function
      await stopServer(mockServer);
      
      // Check that server.close was called
      expect(mockServer.close.calledOnce).to.be.true;
      
      // Check that dbConnection.disconnect was called
      expect(dbDisconnectStub.calledOnce).to.be.true;
      
      // Check that logger.info was called
      expect(loggerInfoStub.calledWith('Server stopped')).to.be.true;
    });
    
    it('should throw an error if the server fails to close', async () => {
      // Create a mock server
      const mockServer = {
        close: sinon.stub().callsFake((callback) => {
          callback(new Error('Close error'));
        }),
      };
      
      // Call the stopServer function and check that it throws an error
      try {
        await stopServer(mockServer);
        expect.fail('Expected stopServer to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('Close error');
      }
      
      // Check that logger.error was called
      expect(loggerErrorStub.calledOnce).to.be.true;
      expect(loggerErrorStub.firstCall.args[0]).to.equal('Failed to stop server');
      expect(loggerErrorStub.firstCall.args[1]).to.be.an.instanceOf(Error);
      expect(loggerErrorStub.firstCall.args[1].message).to.equal('Close error');
    });
    
    it('should throw an error if the database fails to disconnect', async () => {
      // Create a mock server
      const mockServer = {
        close: sinon.stub().callsFake((callback) => {
          callback();
        }),
      };
      
      // Stub dbConnection.disconnect to throw an error
      sinon.stub(dbConnection, 'disconnect').rejects(new Error('Disconnect error'));
      
      // Call the stopServer function and check that it throws an error
      try {
        await stopServer(mockServer);
        expect.fail('Expected stopServer to throw an error');
      } catch (error: any) {
        expect(error.message).to.equal('Disconnect error');
      }
      
      // Check that logger.error was called
      expect(loggerErrorStub.calledOnce).to.be.true;
      expect(loggerErrorStub.firstCall.args[0]).to.equal('Failed to stop server');
      expect(loggerErrorStub.firstCall.args[1]).to.be.an.instanceOf(Error);
      expect(loggerErrorStub.firstCall.args[1].message).to.equal('Disconnect error');
    });
  });
  
  describe('authenticate middleware', () => {
    it('should authenticate a valid token', () => {
      // Create mock request, response, and next
      const req = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();
      
      // Stub verifyAuthToken to return a user ID
      verifyAuthTokenStub.returns('user-id');
      
      // Call the authenticate middleware
      const authenticateMiddleware = mockApp.use.args.find(
        args => args[0] === '/api/orders'
      )[1];
      authenticateMiddleware(req, res, next);
      
      // Check that verifyAuthToken was called with the correct arguments
      expect(verifyAuthTokenStub.calledOnceWith('valid-token')).to.be.true;
      
      // Check that the user ID was added to the request
      expect(req.userId).to.equal('user-id');
      
      // Check that next was called
      expect(next.calledOnce).to.be.true;
    });
    
    it('should return an error if there is no authorization header', () => {
      // Create mock request, response, and next
      const req = {
        headers: {},
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();
      
      // Call the authenticate middleware
      const authenticateMiddleware = mockApp.use.args.find(
        args => args[0] === '/api/orders'
      )[1];
      authenticateMiddleware(req, res, next);
      
      // Check that res.status was called with 401
      expect(res.status.calledOnceWith(401)).to.be.true;
      
      // Check that res.json was called with an error message
      expect(res.json.calledOnceWith({ error: 'No authorization header' })).to.be.true;
      
      // Check that next was not called
      expect(next.called).to.be.false;
    });
    
    it('should return an error if there is no token', () => {
      // Create mock request, response, and next
      const req = {
        headers: {
          authorization: 'Bearer',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();
      
      // Call the authenticate middleware
      const authenticateMiddleware = mockApp.use.args.find(
        args => args[0] === '/api/orders'
      )[1];
      authenticateMiddleware(req, res, next);
      
      // Check that res.status was called with 401
      expect(res.status.calledOnceWith(401)).to.be.true;
      
      // Check that res.json was called with an error message
      expect(res.json.calledOnceWith({ error: 'No token provided' })).to.be.true;
      
      // Check that next was not called
      expect(next.called).to.be.false;
    });
    
    it('should return an error if the token is invalid', () => {
      // Create mock request, response, and next
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      const next = sinon.stub();
      
      // Stub verifyAuthToken to return null
      verifyAuthTokenStub.returns(null);
      
      // Call the authenticate middleware
      const authenticateMiddleware = mockApp.use.args.find(
        args => args[0] === '/api/orders'
      )[1];
      authenticateMiddleware(req, res, next);
      
      // Check that verifyAuthToken was called with the correct arguments
      expect(verifyAuthTokenStub.calledOnceWith('invalid-token')).to.be.true;
      
      // Check that res.status was called with 401
      expect(res.status.calledOnceWith(401)).to.be.true;
      
      // Check that res.json was called with an error message
      expect(res.json.calledOnceWith({ error: 'Invalid token' })).to.be.true;
      
      // Check that next was not called
      expect(next.called).to.be.false;
    });
  });
});