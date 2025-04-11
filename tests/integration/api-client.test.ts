import { ApiClient } from '../../src/utils/ApiClient';
import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';

describe('API Client Integration Tests', () => {
  let apiClient: ApiClient;
  let axiosStub: sinon.SinonStub;
  
  beforeEach(() => {
    // Create a new API client instance for each test
    apiClient = new ApiClient({
      baseUrl: 'https://api.darkswap.io',
    });
    
    // Stub axios to prevent actual API calls
    axiosStub = sinon.stub(axios, 'request');
  });
  
  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });
  
  describe('Initialization', () => {
    it('should initialize with the correct base URL', () => {
      expect(apiClient.getBaseUrl()).to.equal('https://api.darkswap.io');
    });
    
    it('should initialize with custom headers', () => {
      const clientWithHeaders = new ApiClient({
        baseUrl: 'https://api.darkswap.io',
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });
      
      expect(clientWithHeaders.getHeaders()).to.have.property('X-Custom-Header', 'custom-value');
    });
    
    it('should initialize with a custom timeout', () => {
      const clientWithTimeout = new ApiClient({
        baseUrl: 'https://api.darkswap.io',
        timeout: 5000,
      });
      
      expect(clientWithTimeout.getTimeout()).to.equal(5000);
    });
  });
  
  describe('Authentication', () => {
    it('should set the authentication token', () => {
      apiClient.setAuthToken('test-token');
      
      expect(apiClient.getHeaders()).to.have.property('Authorization', 'Bearer test-token');
    });
    
    it('should clear the authentication token', () => {
      apiClient.setAuthToken('test-token');
      apiClient.clearAuthToken();
      
      expect(apiClient.getHeaders()).to.not.have.property('Authorization');
    });
    
    it('should check if authenticated', () => {
      expect(apiClient.isAuthenticated()).to.be.false;
      
      apiClient.setAuthToken('test-token');
      
      expect(apiClient.isAuthenticated()).to.be.true;
    });
  });
  
  describe('GET Requests', () => {
    it('should make a GET request', async () => {
      // Mock the axios response
      axiosStub.resolves({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      const response = await apiClient.get('/test');
      
      expect(response).to.deep.equal({ success: true });
      expect(axiosStub.calledOnce).to.be.true;
      expect(axiosStub.firstCall.args[0]).to.have.property('method', 'get');
      expect(axiosStub.firstCall.args[0]).to.have.property('url', 'https://api.darkswap.io/test');
    });
    
    it('should make a GET request with query parameters', async () => {
      // Mock the axios response
      axiosStub.resolves({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      const response = await apiClient.get('/test', { param1: 'value1', param2: 'value2' });
      
      expect(response).to.deep.equal({ success: true });
      expect(axiosStub.calledOnce).to.be.true;
      expect(axiosStub.firstCall.args[0]).to.have.property('method', 'get');
      expect(axiosStub.firstCall.args[0]).to.have.property('url', 'https://api.darkswap.io/test');
      expect(axiosStub.firstCall.args[0]).to.have.property('params');
      expect(axiosStub.firstCall.args[0].params).to.deep.equal({ param1: 'value1', param2: 'value2' });
    });
    
    it('should handle GET request errors', async () => {
      // Mock the axios error
      axiosStub.rejects({
        response: {
          data: { error: 'Not found' },
          status: 404,
          statusText: 'Not Found',
          headers: {},
          config: {},
        },
      });
      
      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).to.equal(404);
        expect(error.data).to.deep.equal({ error: 'Not found' });
      }
    });
  });
  
  describe('POST Requests', () => {
    it('should make a POST request', async () => {
      // Mock the axios response
      axiosStub.resolves({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      const response = await apiClient.post('/test', { data: 'test-data' });
      
      expect(response).to.deep.equal({ success: true });
      expect(axiosStub.calledOnce).to.be.true;
      expect(axiosStub.firstCall.args[0]).to.have.property('method', 'post');
      expect(axiosStub.firstCall.args[0]).to.have.property('url', 'https://api.darkswap.io/test');
      expect(axiosStub.firstCall.args[0]).to.have.property('data');
      expect(axiosStub.firstCall.args[0].data).to.deep.equal({ data: 'test-data' });
    });
    
    it('should handle POST request errors', async () => {
      // Mock the axios error
      axiosStub.rejects({
        response: {
          data: { error: 'Bad request' },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: {},
        },
      });
      
      try {
        await apiClient.post('/test', { data: 'test-data' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).to.equal(400);
        expect(error.data).to.deep.equal({ error: 'Bad request' });
      }
    });
  });
  
  describe('PUT Requests', () => {
    it('should make a PUT request', async () => {
      // Mock the axios response
      axiosStub.resolves({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      const response = await apiClient.put('/test', { data: 'test-data' });
      
      expect(response).to.deep.equal({ success: true });
      expect(axiosStub.calledOnce).to.be.true;
      expect(axiosStub.firstCall.args[0]).to.have.property('method', 'put');
      expect(axiosStub.firstCall.args[0]).to.have.property('url', 'https://api.darkswap.io/test');
      expect(axiosStub.firstCall.args[0]).to.have.property('data');
      expect(axiosStub.firstCall.args[0].data).to.deep.equal({ data: 'test-data' });
    });
    
    it('should handle PUT request errors', async () => {
      // Mock the axios error
      axiosStub.rejects({
        response: {
          data: { error: 'Bad request' },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: {},
        },
      });
      
      try {
        await apiClient.put('/test', { data: 'test-data' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).to.equal(400);
        expect(error.data).to.deep.equal({ error: 'Bad request' });
      }
    });
  });
  
  describe('DELETE Requests', () => {
    it('should make a DELETE request', async () => {
      // Mock the axios response
      axiosStub.resolves({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      const response = await apiClient.delete('/test');
      
      expect(response).to.deep.equal({ success: true });
      expect(axiosStub.calledOnce).to.be.true;
      expect(axiosStub.firstCall.args[0]).to.have.property('method', 'delete');
      expect(axiosStub.firstCall.args[0]).to.have.property('url', 'https://api.darkswap.io/test');
    });
    
    it('should handle DELETE request errors', async () => {
      // Mock the axios error
      axiosStub.rejects({
        response: {
          data: { error: 'Not found' },
          status: 404,
          statusText: 'Not Found',
          headers: {},
          config: {},
        },
      });
      
      try {
        await apiClient.delete('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).to.equal(404);
        expect(error.data).to.deep.equal({ error: 'Not found' });
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Mock a network error
      axiosStub.rejects(new Error('Network Error'));
      
      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Network Error');
      }
    });
    
    it('should handle timeout errors', async () => {
      // Mock a timeout error
      axiosStub.rejects(new Error('timeout of 30000ms exceeded'));
      
      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('timeout of 30000ms exceeded');
      }
    });
    
    it('should handle server errors', async () => {
      // Mock a server error
      axiosStub.rejects({
        response: {
          data: { error: 'Internal server error' },
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {},
        },
      });
      
      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).to.equal(500);
        expect(error.data).to.deep.equal({ error: 'Internal server error' });
      }
    });
  });
  
  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      // Mock the axios response
      axiosStub.resolves({
        data: {
          userId: '123456789',
          username: 'user123',
          email: 'user@example.com',
          token: 'jwt-token',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      const response = await apiClient.post('/api/auth/register', {
        username: 'user123',
        email: 'user@example.com',
        password: 'securepassword',
      });
      
      expect(response).to.have.property('userId', '123456789');
      expect(response).to.have.property('username', 'user123');
      expect(response).to.have.property('email', 'user@example.com');
      expect(response).to.have.property('token', 'jwt-token');
    });
    
    it('should log in a user', async () => {
      // Mock the axios response
      axiosStub.resolves({
        data: {
          userId: '123456789',
          username: 'user123',
          email: 'user@example.com',
          token: 'jwt-token',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      const response = await apiClient.post('/api/auth/login', {
        email: 'user@example.com',
        password: 'securepassword',
      });
      
      expect(response).to.have.property('userId', '123456789');
      expect(response).to.have.property('username', 'user123');
      expect(response).to.have.property('email', 'user@example.com');
      expect(response).to.have.property('token', 'jwt-token');
    });
    
    it('should verify a token', async () => {
      // Mock the axios response
      axiosStub.resolves({
        data: {
          valid: true,
          userId: '123456789',
          username: 'user123',
          email: 'user@example.com',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      apiClient.setAuthToken('jwt-token');
      
      const response = await apiClient.get('/api/auth/verify');
      
      expect(response).to.have.property('valid', true);
      expect(response).to.have.property('userId', '123456789');
      expect(response).to.have.property('username', 'user123');
      expect(response).to.have.property('email', 'user@example.com');
    });
    
    it('should refresh a token', async () => {
      // Mock the axios response
      axiosStub.resolves({
        data: {
          token: 'new-jwt-token',
          expiresAt: '2025-04-11T12:00:00.000Z',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      const response = await apiClient.post('/api/auth/refresh', {
        token: 'jwt-token',
      });
      
      expect(response).to.have.property('token', 'new-jwt-token');
      expect(response).to.have.property('expiresAt', '2025-04-11T12:00:00.000Z');
    });
  });
});