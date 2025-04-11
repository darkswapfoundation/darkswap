import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import winston from 'winston';
import {
  logger,
  stream,
  LogLevel,
  setLogLevel,
  getLogLevel,
  createChildLogger,
  logError,
  logWarning,
  logInfo,
  logDebug,
  logVerbose,
  logHttp,
  logSilly,
} from '../../../src/utils/logger';

describe('Logger Utils', () => {
  // Create stubs for winston logger
  let infoStub: sinon.SinonStub;
  let errorStub: sinon.SinonStub;
  let warnStub: sinon.SinonStub;
  let debugStub: sinon.SinonStub;
  let verboseStub: sinon.SinonStub;
  let httpStub: sinon.SinonStub;
  let sillyStub: sinon.SinonStub;
  let childStub: sinon.SinonStub;
  
  beforeEach(() => {
    // Create stubs for logger methods
    infoStub = sinon.stub(logger, 'info');
    errorStub = sinon.stub(logger, 'error');
    warnStub = sinon.stub(logger, 'warn');
    debugStub = sinon.stub(logger, 'debug');
    verboseStub = sinon.stub(logger, 'verbose');
    httpStub = sinon.stub(logger, 'http');
    sillyStub = sinon.stub(logger, 'silly');
    childStub = sinon.stub(logger, 'child');
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('stream', () => {
    it('should call logger.info with the trimmed message', () => {
      // Call the stream.write method
      stream.write('test message\n');
      
      // Check that logger.info was called with the correct arguments
      expect(infoStub.calledOnceWith('test message')).to.be.true;
    });
  });
  
  describe('setLogLevel', () => {
    it('should set the log level', () => {
      // Set the log level
      setLogLevel(LogLevel.DEBUG);
      
      // Check that the log level was set
      expect(logger.level).to.equal(LogLevel.DEBUG);
    });
  });
  
  describe('getLogLevel', () => {
    it('should get the log level', () => {
      // Set the log level
      logger.level = LogLevel.DEBUG;
      
      // Get the log level
      const level = getLogLevel();
      
      // Check that the log level was returned
      expect(level).to.equal(LogLevel.DEBUG);
    });
  });
  
  describe('createChildLogger', () => {
    it('should create a child logger', () => {
      // Create a mock child logger
      const childLogger = { level: LogLevel.DEBUG };
      
      // Stub logger.child to return the mock child logger
      childStub.returns(childLogger);
      
      // Create a child logger
      const result = createChildLogger({ component: 'test' });
      
      // Check that logger.child was called with the correct arguments
      expect(childStub.calledOnceWith({ component: 'test' })).to.be.true;
      
      // Check that the child logger was returned
      expect(result).to.equal(childLogger);
    });
  });
  
  describe('logError', () => {
    it('should log an error with stack trace', () => {
      // Create an error
      const error = new Error('test error');
      error.stack = 'test stack';
      
      // Log the error
      logError('test message', error);
      
      // Check that logger.error was called with the correct arguments
      expect(errorStub.calledOnceWith('test message', {
        error: {
          message: 'test error',
          stack: 'test stack',
        },
      })).to.be.true;
    });
  });
  
  describe('logWarning', () => {
    it('should log a warning', () => {
      // Log a warning
      logWarning('test message');
      
      // Check that logger.warn was called with the correct arguments
      expect(warnStub.calledOnceWith('test message', undefined)).to.be.true;
    });
    
    it('should log a warning with metadata', () => {
      // Log a warning with metadata
      logWarning('test message', { key: 'value' });
      
      // Check that logger.warn was called with the correct arguments
      expect(warnStub.calledOnceWith('test message', { key: 'value' })).to.be.true;
    });
  });
  
  describe('logInfo', () => {
    it('should log an info message', () => {
      // Log an info message
      logInfo('test message');
      
      // Check that logger.info was called with the correct arguments
      expect(infoStub.calledOnceWith('test message', undefined)).to.be.true;
    });
    
    it('should log an info message with metadata', () => {
      // Log an info message with metadata
      logInfo('test message', { key: 'value' });
      
      // Check that logger.info was called with the correct arguments
      expect(infoStub.calledOnceWith('test message', { key: 'value' })).to.be.true;
    });
  });
  
  describe('logDebug', () => {
    it('should log a debug message', () => {
      // Log a debug message
      logDebug('test message');
      
      // Check that logger.debug was called with the correct arguments
      expect(debugStub.calledOnceWith('test message', undefined)).to.be.true;
    });
    
    it('should log a debug message with metadata', () => {
      // Log a debug message with metadata
      logDebug('test message', { key: 'value' });
      
      // Check that logger.debug was called with the correct arguments
      expect(debugStub.calledOnceWith('test message', { key: 'value' })).to.be.true;
    });
  });
  
  describe('logVerbose', () => {
    it('should log a verbose message', () => {
      // Log a verbose message
      logVerbose('test message');
      
      // Check that logger.verbose was called with the correct arguments
      expect(verboseStub.calledOnceWith('test message', undefined)).to.be.true;
    });
    
    it('should log a verbose message with metadata', () => {
      // Log a verbose message with metadata
      logVerbose('test message', { key: 'value' });
      
      // Check that logger.verbose was called with the correct arguments
      expect(verboseStub.calledOnceWith('test message', { key: 'value' })).to.be.true;
    });
  });
  
  describe('logHttp', () => {
    it('should log an HTTP request', () => {
      // Log an HTTP request
      logHttp('test message');
      
      // Check that logger.http was called with the correct arguments
      expect(httpStub.calledOnceWith('test message', undefined)).to.be.true;
    });
    
    it('should log an HTTP request with metadata', () => {
      // Log an HTTP request with metadata
      logHttp('test message', { key: 'value' });
      
      // Check that logger.http was called with the correct arguments
      expect(httpStub.calledOnceWith('test message', { key: 'value' })).to.be.true;
    });
  });
  
  describe('logSilly', () => {
    it('should log a silly message', () => {
      // Log a silly message
      logSilly('test message');
      
      // Check that logger.silly was called with the correct arguments
      expect(sillyStub.calledOnceWith('test message', undefined)).to.be.true;
    });
    
    it('should log a silly message with metadata', () => {
      // Log a silly message with metadata
      logSilly('test message', { key: 'value' });
      
      // Check that logger.silly was called with the correct arguments
      expect(sillyStub.calledOnceWith('test message', { key: 'value' })).to.be.true;
    });
  });
  
  describe('logger configuration', () => {
    it('should have the correct log level', () => {
      // Check that the log level is set correctly
      expect(logger.level).to.equal(process.env.LOG_LEVEL || 'info');
    });
    
    it('should have the correct format', () => {
      // Create a spy for winston.format.combine
      const combineStub = sinon.spy(winston.format, 'combine');
      
      // Create a new logger with the same configuration
      const { loggerConfig } = require('../../../src/utils/logger');
      winston.createLogger(loggerConfig);
      
      // Check that winston.format.combine was called with the correct arguments
      expect(combineStub.calledWith(
        winston.format.timestamp(),
        winston.format.json()
      )).to.be.true;
    });
    
    it('should have the correct transports', () => {
      // Create spies for winston.transports
      const consoleStub = sinon.spy(winston.transports, 'Console');
      const fileStub = sinon.spy(winston.transports, 'File');
      
      // Create a new logger with the same configuration
      const { loggerConfig } = require('../../../src/utils/logger');
      winston.createLogger(loggerConfig);
      
      // Check that winston.transports.Console was called
      expect(consoleStub.called).to.be.true;
      
      // Check that winston.transports.File was called twice
      expect(fileStub.calledTwice).to.be.true;
      
      // Check that the first call to winston.transports.File was for error.log
      expect(fileStub.firstCall.args[0]).to.have.property('filename', 'error.log');
      expect(fileStub.firstCall.args[0]).to.have.property('level', 'error');
      
      // Check that the second call to winston.transports.File was for combined.log
      expect(fileStub.secondCall.args[0]).to.have.property('filename', 'combined.log');
    });
  });
});