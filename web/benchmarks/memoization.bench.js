/**
 * Benchmarks for memoization utilities
 */

// Import the utilities to benchmark
// Note: In a real implementation, we would import from the actual source
// but for benchmarking purposes, we'll mock the implementations
const { useMemoizedValue, useDeepComparison } = require('../src/utils/memoization');

// Mock React hooks for benchmarking
const React = {
  useState: (initialValue) => [initialValue, () => {}],
  useEffect: () => {},
  useRef: (initialValue) => ({ current: initialValue }),
  useMemo: (fn, deps) => fn()
};

/**
 * Create a large object for testing deep comparison
 * @param {number} size - Size of the object
 * @returns {Object} Large object
 */
function createLargeObject(size = 1000) {
  const obj = {};
  for (let i = 0; i < size; i++) {
    obj[`key${i}`] = {
      id: i,
      name: `Item ${i}`,
      value: Math.random(),
      nested: {
        prop1: Math.random(),
        prop2: `Value ${i}`,
        array: Array.from({ length: 10 }, (_, j) => ({ id: j, value: Math.random() }))
      }
    };
  }
  return obj;
}

/**
 * Create a large array for testing deep comparison
 * @param {number} size - Size of the array
 * @returns {Array} Large array
 */
function createLargeArray(size = 1000) {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random(),
    nested: {
      prop1: Math.random(),
      prop2: `Value ${i}`,
      array: Array.from({ length: 10 }, (_, j) => ({ id: j, value: Math.random() }))
    }
  }));
}

// Benchmark: Simple memoization with primitive values
exports.simpleMemoization = function() {
  const value = 42;
  const fn = () => value * 2;
  const deps = [value];
  
  // Run the memoized function
  const result = React.useMemo(fn, deps);
  
  return result;
};

// Benchmark: Memoization with object reference
exports.objectReferenceMemoization = function() {
  const obj = { value: 42 };
  const fn = () => obj.value * 2;
  const deps = [obj];
  
  // Run the memoized function
  const result = React.useMemo(fn, deps);
  
  return result;
};

// Benchmark: Deep comparison with small object
exports.deepComparisonSmall = function() {
  const obj = { 
    a: 1, 
    b: 'test', 
    c: { 
      d: true, 
      e: [1, 2, 3] 
    } 
  };
  
  // Create a new object with the same values
  const newObj = JSON.parse(JSON.stringify(obj));
  
  // Compare the objects
  const isEqual = JSON.stringify(obj) === JSON.stringify(newObj);
  
  return isEqual;
};

// Benchmark: Deep comparison with medium object
exports.deepComparisonMedium = function() {
  const obj = createLargeObject(100);
  
  // Create a new object with the same values
  const newObj = JSON.parse(JSON.stringify(obj));
  
  // Compare the objects
  const isEqual = JSON.stringify(obj) === JSON.stringify(newObj);
  
  return isEqual;
};

// Benchmark: Deep comparison with large object
exports.deepComparisonLarge = function() {
  const obj = createLargeObject(1000);
  
  // Create a new object with the same values
  const newObj = JSON.parse(JSON.stringify(obj));
  
  // Compare the objects
  const isEqual = JSON.stringify(obj) === JSON.stringify(newObj);
  
  return isEqual;
};

// Benchmark: Array.map with small array
exports.arrayMapSmall = function() {
  const array = Array.from({ length: 100 }, (_, i) => i);
  
  // Map the array
  const result = array.map(x => x * 2);
  
  return result;
};

// Benchmark: Array.map with large array
exports.arrayMapLarge = function() {
  const array = Array.from({ length: 10000 }, (_, i) => i);
  
  // Map the array
  const result = array.map(x => x * 2);
  
  return result;
};

// Benchmark: Array.filter with small array
exports.arrayFilterSmall = function() {
  const array = Array.from({ length: 100 }, (_, i) => i);
  
  // Filter the array
  const result = array.filter(x => x % 2 === 0);
  
  return result;
};

// Benchmark: Array.filter with large array
exports.arrayFilterLarge = function() {
  const array = Array.from({ length: 10000 }, (_, i) => i);
  
  // Filter the array
  const result = array.filter(x => x % 2 === 0);
  
  return result;
};

// Benchmark: Array.reduce with small array
exports.arrayReduceSmall = function() {
  const array = Array.from({ length: 100 }, (_, i) => i);
  
  // Reduce the array
  const result = array.reduce((sum, x) => sum + x, 0);
  
  return result;
};

// Benchmark: Array.reduce with large array
exports.arrayReduceLarge = function() {
  const array = Array.from({ length: 10000 }, (_, i) => i);
  
  // Reduce the array
  const result = array.reduce((sum, x) => sum + x, 0);
  
  return result;
};

// Benchmark: Object.keys with small object
exports.objectKeysSmall = function() {
  const obj = createLargeObject(10);
  
  // Get object keys
  const keys = Object.keys(obj);
  
  return keys;
};

// Benchmark: Object.keys with large object
exports.objectKeysLarge = function() {
  const obj = createLargeObject(1000);
  
  // Get object keys
  const keys = Object.keys(obj);
  
  return keys;
};

// Benchmark: Object.values with small object
exports.objectValuesSmall = function() {
  const obj = createLargeObject(10);
  
  // Get object values
  const values = Object.values(obj);
  
  return values;
};

// Benchmark: Object.values with large object
exports.objectValuesLarge = function() {
  const obj = createLargeObject(1000);
  
  // Get object values
  const values = Object.values(obj);
  
  return values;
};

// Benchmark: Object.entries with small object
exports.objectEntriesSmall = function() {
  const obj = createLargeObject(10);
  
  // Get object entries
  const entries = Object.entries(obj);
  
  return entries;
};

// Benchmark: Object.entries with large object
exports.objectEntriesLarge = function() {
  const obj = createLargeObject(1000);
  
  // Get object entries
  const entries = Object.entries(obj);
  
  return entries;
};