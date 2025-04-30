//! Performance optimization module for DarkSwap
//!
//! This module provides utilities for profiling and optimizing performance in DarkSwap.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::Result;
use log::{debug, info, warn};
use tokio::sync::RwLock;

/// Performance metrics
#[derive(Debug, Clone)]
pub struct PerformanceMetrics {
    /// Operation name
    pub operation: String,
    /// Total duration
    pub total_duration: Duration,
    /// Number of calls
    pub calls: u64,
    /// Average duration
    pub average_duration: Duration,
    /// Minimum duration
    pub min_duration: Duration,
    /// Maximum duration
    pub max_duration: Duration,
}

/// Performance profiler
pub struct PerformanceProfiler {
    /// Metrics
    metrics: Arc<RwLock<HashMap<String, PerformanceMetrics>>>,
    /// Enabled
    enabled: bool,
}

impl PerformanceProfiler {
    /// Create a new performance profiler
    pub fn new(enabled: bool) -> Self {
        Self {
            metrics: Arc::new(RwLock::new(HashMap::new())),
            enabled,
        }
    }
    
    /// Enable profiling
    pub fn enable(&mut self) {
        self.enabled = true;
    }
    
    /// Disable profiling
    pub fn disable(&mut self) {
        self.enabled = false;
    }
    
    /// Reset metrics
    pub async fn reset(&self) {
        let mut metrics = self.metrics.write().await;
        metrics.clear();
    }
    
    /// Profile an operation
    pub async fn profile<F, T>(&self, operation: &str, f: F) -> Result<T>
    where
        F: FnOnce() -> Result<T>,
    {
        if !self.enabled {
            return f();
        }
        
        let start = Instant::now();
        let result = f();
        let duration = start.elapsed();
        
        // Update metrics
        let mut metrics = self.metrics.write().await;
        let metric = metrics.entry(operation.to_string()).or_insert_with(|| PerformanceMetrics {
            operation: operation.to_string(),
            total_duration: Duration::from_secs(0),
            calls: 0,
            average_duration: Duration::from_secs(0),
            min_duration: Duration::from_secs(u64::MAX),
            max_duration: Duration::from_secs(0),
        });
        
        metric.total_duration += duration;
        metric.calls += 1;
        metric.average_duration = metric.total_duration.div_f64(metric.calls as f64);
        metric.min_duration = std::cmp::min(metric.min_duration, duration);
        metric.max_duration = std::cmp::max(metric.max_duration, duration);
        
        result
    }
    
    /// Get metrics
    pub async fn get_metrics(&self) -> Vec<PerformanceMetrics> {
        let metrics = self.metrics.read().await;
        metrics.values().cloned().collect()
    }
    
    /// Get metrics for an operation
    pub async fn get_operation_metrics(&self, operation: &str) -> Option<PerformanceMetrics> {
        let metrics = self.metrics.read().await;
        metrics.get(operation).cloned()
    }
    
    /// Print metrics
    pub async fn print_metrics(&self) {
        let metrics = self.metrics.read().await;
        
        info!("Performance Metrics:");
        info!("-------------------");
        
        for metric in metrics.values() {
            info!(
                "{}: {} calls, total: {:?}, avg: {:?}, min: {:?}, max: {:?}",
                metric.operation,
                metric.calls,
                metric.total_duration,
                metric.average_duration,
                metric.min_duration,
                metric.max_duration,
            );
        }
    }
}

/// Performance optimization
pub struct PerformanceOptimizer {
    /// Profiler
    profiler: Arc<PerformanceProfiler>,
    /// Cache
    cache: Arc<RwLock<HashMap<String, Arc<RwLock<HashMap<String, Vec<u8>>>>>>>,
}

impl PerformanceOptimizer {
    /// Create a new performance optimizer
    pub fn new(profiler: Arc<PerformanceProfiler>) -> Self {
        Self {
            profiler,
            cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Enable caching for a specific category
    pub async fn enable_cache(&self, category: &str) {
        let mut cache = self.cache.write().await;
        cache.insert(category.to_string(), Arc::new(RwLock::new(HashMap::new())));
    }
    
    /// Disable caching for a specific category
    pub async fn disable_cache(&self, category: &str) {
        let mut cache = self.cache.write().await;
        cache.remove(category);
    }
    
    /// Clear cache for a specific category
    pub async fn clear_cache(&self, category: &str) {
        let cache = self.cache.read().await;
        if let Some(category_cache) = cache.get(category) {
            let mut category_cache = category_cache.write().await;
            category_cache.clear();
        }
    }
    
    /// Clear all caches
    pub async fn clear_all_caches(&self) {
        let cache = self.cache.read().await;
        for category_cache in cache.values() {
            let mut category_cache = category_cache.write().await;
            category_cache.clear();
        }
    }
    
    /// Get cached value
    pub async fn get_cached<T: serde::de::DeserializeOwned>(&self, category: &str, key: &str) -> Option<T> {
        let cache = self.cache.read().await;
        if let Some(category_cache) = cache.get(category) {
            let category_cache = category_cache.read().await;
            if let Some(value) = category_cache.get(key) {
                if let Ok(value) = serde_json::from_slice(value) {
                    return Some(value);
                }
            }
        }
        
        None
    }
    
    /// Set cached value
    pub async fn set_cached<T: serde::Serialize>(&self, category: &str, key: &str, value: &T) -> Result<()> {
        let cache = self.cache.read().await;
        if let Some(category_cache) = cache.get(category) {
            let mut category_cache = category_cache.write().await;
            let serialized = serde_json::to_vec(value)?;
            category_cache.insert(key.to_string(), serialized);
        }
        
        Ok(())
    }
    
    /// Execute with caching
    pub async fn with_cache<F, T>(&self, category: &str, key: &str, f: F) -> Result<T>
    where
        F: FnOnce() -> Result<T>,
        T: serde::Serialize + serde::de::DeserializeOwned,
    {
        // Check if caching is enabled for this category
        let cache = self.cache.read().await;
        if !cache.contains_key(category) {
            return self.profiler.profile(category, f).await;
        }
        
        // Check if value is cached
        if let Some(value) = self.get_cached(category, key).await {
            return Ok(value);
        }
        
        // Execute function
        let result = self.profiler.profile(category, f).await?;
        
        // Cache result
        self.set_cached(category, key, &result).await?;
        
        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    
    #[tokio::test]
    async fn test_performance_profiler() {
        // Create a profiler
        let profiler = PerformanceProfiler::new(true);
        
        // Profile an operation
        let result = profiler.profile("test_operation", || {
            // Simulate some work
            thread::sleep(Duration::from_millis(100));
            Ok(42)
        }).await;
        
        // Check result
        assert_eq!(result.unwrap(), 42);
        
        // Check metrics
        let metrics = profiler.get_operation_metrics("test_operation").await.unwrap();
        assert_eq!(metrics.operation, "test_operation");
        assert_eq!(metrics.calls, 1);
        assert!(metrics.total_duration >= Duration::from_millis(100));
        assert!(metrics.average_duration >= Duration::from_millis(100));
        assert!(metrics.min_duration >= Duration::from_millis(100));
        assert!(metrics.max_duration >= Duration::from_millis(100));
    }
    
    #[tokio::test]
    async fn test_performance_optimizer() {
        // Create a profiler
        let profiler = Arc::new(PerformanceProfiler::new(true));
        
        // Create an optimizer
        let optimizer = PerformanceOptimizer::new(profiler.clone());
        
        // Enable caching
        optimizer.enable_cache("test_category").await;
        
        // Execute with caching
        let result1 = optimizer.with_cache("test_category", "test_key", || {
            // Simulate some work
            thread::sleep(Duration::from_millis(100));
            Ok(42)
        }).await;
        
        // Check result
        assert_eq!(result1.unwrap(), 42);
        
        // Execute again with caching
        let result2 = optimizer.with_cache("test_category", "test_key", || {
            // This should not be executed
            thread::sleep(Duration::from_millis(100));
            Ok(43)
        }).await;
        
        // Check result (should be cached)
        assert_eq!(result2.unwrap(), 42);
        
        // Check metrics
        let metrics = profiler.get_operation_metrics("test_category").await.unwrap();
        assert_eq!(metrics.operation, "test_category");
        assert_eq!(metrics.calls, 1);
    }
}