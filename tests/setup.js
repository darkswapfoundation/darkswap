/**
 * Test Setup
 * 
 * This file contains setup code for the test environment.
 */

// Mock browser APIs
global.WebSocket = require('ws');
global.RTCPeerConnection = require('wrtc').RTCPeerConnection;
global.RTCSessionDescription = require('wrtc').RTCSessionDescription;
global.RTCIceCandidate = require('wrtc').RTCIceCandidate;

// Mock localStorage
global.localStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value.toString();
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

// Mock window
global.window = {
  localStorage: global.localStorage,
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
  },
  navigator: {
    userAgent: 'node',
  },
};

// Mock document
global.document = {
  createElement: () => ({
    style: {},
    setAttribute: () => {},
    appendChild: () => {},
  }),
  body: {
    appendChild: () => {},
  },
};

// Mock crypto
global.crypto = {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    digest: async () => new Uint8Array(32),
  },
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();

// Restore console methods after tests
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});