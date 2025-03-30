/**
 * Jest configuration for DarkSwap tests
 */

module.exports = {
  // The root directory that Jest should scan for tests and modules
  rootDir: '.',
  
  // The test environment that will be used for testing
  testEnvironment: 'node',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  
  // An array of regexp pattern strings that are matched against all test paths
  // matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  
  // An array of regexp pattern strings that are matched against all source file paths
  // matched files will be transformed
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // An array of regexp pattern strings that are matched against all source file paths
  // matched files will not be transformed
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$',
  ],
  
  // A map from regular expressions to module names that allow to stub out resources
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/mocks/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/tests/mocks/fileMock.js',
  },
  
  // Setup files that will be run before each test file
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
  ],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/',
    '/build/',
  ],
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'text',
    'lcov',
    'clover',
  ],
  
  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',
  
  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};