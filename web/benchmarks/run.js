/**
 * Benchmark runner for DarkSwap
 * 
 * This script runs all benchmarks and reports the results.
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Configuration
const ITERATIONS = 100;
const WARMUP_ITERATIONS = 10;
const BENCHMARK_DIR = __dirname;
const RESULTS_DIR = path.join(__dirname, 'results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Get all benchmark files
const benchmarkFiles = fs.readdirSync(BENCHMARK_DIR)
  .filter(file => file.endsWith('.bench.js'))
  .map(file => path.join(BENCHMARK_DIR, file));

console.log(`Found ${benchmarkFiles.length} benchmark files`);

// Run all benchmarks
async function runBenchmarks() {
  const results = {};
  
  for (const file of benchmarkFiles) {
    const benchmarkName = path.basename(file, '.bench.js');
    console.log(`\nRunning benchmark: ${benchmarkName}`);
    
    try {
      const benchmark = require(file);
      const benchmarkResults = await runBenchmark(benchmark, benchmarkName);
      results[benchmarkName] = benchmarkResults;
    } catch (error) {
      console.error(`Error running benchmark ${benchmarkName}:`, error);
    }
  }
  
  // Save results
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultsFile = path.join(RESULTS_DIR, `benchmark-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  console.log(`\nResults saved to ${resultsFile}`);
  
  // Print summary
  console.log('\nBenchmark Summary:');
  console.log('=================');
  
  for (const [benchmarkName, benchmarkResults] of Object.entries(results)) {
    console.log(`\n${benchmarkName}:`);
    
    for (const [testName, testResult] of Object.entries(benchmarkResults)) {
      console.log(`  ${testName}:`);
      console.log(`    Average: ${testResult.average.toFixed(4)} ms`);
      console.log(`    Min: ${testResult.min.toFixed(4)} ms`);
      console.log(`    Max: ${testResult.max.toFixed(4)} ms`);
      console.log(`    Std Dev: ${testResult.stdDev.toFixed(4)} ms`);
    }
  }
}

// Run a single benchmark
async function runBenchmark(benchmark, benchmarkName) {
  const results = {};
  
  for (const [testName, testFn] of Object.entries(benchmark)) {
    if (typeof testFn !== 'function') continue;
    
    console.log(`  Running test: ${testName}`);
    
    // Warm up
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
      await testFn();
    }
    
    // Run benchmark
    const durations = [];
    
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      await testFn();
      const end = performance.now();
      durations.push(end - start);
    }
    
    // Calculate statistics
    const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const variance = durations.reduce((sum, duration) => sum + Math.pow(duration - average, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    
    results[testName] = { average, min, max, stdDev, durations };
    
    console.log(`    Average: ${average.toFixed(4)} ms`);
  }
  
  return results;
}

// Run benchmarks
runBenchmarks().catch(error => {
  console.error('Error running benchmarks:', error);
  process.exit(1);
});