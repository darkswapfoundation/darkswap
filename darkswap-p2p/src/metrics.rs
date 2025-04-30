//! Metrics collection and reporting for the P2P network
//!
//! This module provides functionality for collecting and reporting metrics
//! about the P2P network, including connection statistics, relay performance,
//! and network health.

use crate::{
    connection_pool::ConnectionPoolStats,
    relay_connection_pool::{RelayConnectionPool, RelayConnectionStatus},
    relay_discovery::RelayInfo,
};
use libp2p::PeerId;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tracing::{debug, info, warn};

/// Metric type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum MetricType {
    /// Counter metric (monotonically increasing)
    Counter,
    /// Gauge metric (can go up and down)
    Gauge,
    /// Histogram metric (distribution of values)
    Histogram,
}

/// Metric value
#[derive(Debug, Clone)]
pub enum MetricValue {
    /// Counter value
    Counter(u64),
    /// Gauge value
    Gauge(f64),
    /// Histogram values
    Histogram(Vec<f64>),
}

/// Metric
#[derive(Debug, Clone)]
pub struct Metric {
    /// Metric name
    pub name: String,
    /// Metric type
    pub metric_type: MetricType,
    /// Metric value
    pub value: MetricValue,
    /// Metric labels
    pub labels: HashMap<String, String>,
    /// Metric timestamp
    pub timestamp: Instant,
}

/// Metrics registry
pub struct MetricsRegistry {
    /// Metrics
    metrics: Mutex<HashMap<String, Metric>>,
    /// Start time
    start_time: Instant,
}

impl MetricsRegistry {
    /// Create a new metrics registry
    pub fn new() -> Self {
        Self {
            metrics: Mutex::new(HashMap::new()),
            start_time: Instant::now(),
        }
    }
    
    /// Register a counter metric
    pub fn register_counter(&self, name: &str, labels: HashMap<String, String>) {
        let mut metrics = self.metrics.lock().unwrap();
        metrics.insert(
            name.to_string(),
            Metric {
                name: name.to_string(),
                metric_type: MetricType::Counter,
                value: MetricValue::Counter(0),
                labels,
                timestamp: Instant::now(),
            },
        );
    }
    
    /// Register a gauge metric
    pub fn register_gauge(&self, name: &str, labels: HashMap<String, String>) {
        let mut metrics = self.metrics.lock().unwrap();
        metrics.insert(
            name.to_string(),
            Metric {
                name: name.to_string(),
                metric_type: MetricType::Gauge,
                value: MetricValue::Gauge(0.0),
                labels,
                timestamp: Instant::now(),
            },
        );
    }
    
    /// Register a histogram metric
    pub fn register_histogram(&self, name: &str, labels: HashMap<String, String>) {
        let mut metrics = self.metrics.lock().unwrap();
        metrics.insert(
            name.to_string(),
            Metric {
                name: name.to_string(),
                metric_type: MetricType::Histogram,
                value: MetricValue::Histogram(Vec::new()),
                labels,
                timestamp: Instant::now(),
            },
        );
    }
    
    /// Increment a counter metric
    pub fn increment_counter(&self, name: &str, value: u64) {
        let mut metrics = self.metrics.lock().unwrap();
        if let Some(metric) = metrics.get_mut(name) {
            if let MetricValue::Counter(counter) = &mut metric.value {
                *counter += value;
                metric.timestamp = Instant::now();
            }
        }
    }
    
    /// Set a gauge metric
    pub fn set_gauge(&self, name: &str, value: f64) {
        let mut metrics = self.metrics.lock().unwrap();
        if let Some(metric) = metrics.get_mut(name) {
            if let MetricValue::Gauge(gauge) = &mut metric.value {
                *gauge = value;
                metric.timestamp = Instant::now();
            }
        }
    }
    
    /// Observe a histogram metric
    pub fn observe_histogram(&self, name: &str, value: f64) {
        let mut metrics = self.metrics.lock().unwrap();
        if let Some(metric) = metrics.get_mut(name) {
            if let MetricValue::Histogram(histogram) = &mut metric.value {
                histogram.push(value);
                metric.timestamp = Instant::now();
            }
        }
    }
    
    /// Get a metric
    pub fn get_metric(&self, name: &str) -> Option<Metric> {
        let metrics = self.metrics.lock().unwrap();
        metrics.get(name).cloned()
    }
    
    /// Get all metrics
    pub fn get_metrics(&self) -> Vec<Metric> {
        let metrics = self.metrics.lock().unwrap();
        metrics.values().cloned().collect()
    }
    
    /// Get uptime
    pub fn uptime(&self) -> Duration {
        self.start_time.elapsed()
    }
}

/// P2P network metrics
pub struct P2PMetrics {
    /// Metrics registry
    registry: Arc<MetricsRegistry>,
    /// Relay connection pool
    relay_pool: Option<Arc<RelayConnectionPool>>,
    /// Last update time
    last_update: Mutex<Instant>,
    /// Update interval
    update_interval: Duration,
}

impl P2PMetrics {
    /// Create a new P2P metrics collector
    pub fn new(update_interval: Duration) -> Self {
        let registry = Arc::new(MetricsRegistry::new());
        
        // Register metrics
        registry.register_counter("p2p_connections_total", HashMap::new());
        registry.register_gauge("p2p_connections_active", HashMap::new());
        registry.register_gauge("p2p_connections_idle", HashMap::new());
        registry.register_counter("p2p_connection_attempts", HashMap::new());
        registry.register_counter("p2p_connection_successes", HashMap::new());
        registry.register_counter("p2p_connection_failures", HashMap::new());
        registry.register_gauge("p2p_relay_connections", HashMap::new());
        registry.register_histogram("p2p_connection_latency_ms", HashMap::new());
        registry.register_gauge("p2p_relay_score", HashMap::new());
        
        Self {
            registry,
            relay_pool: None,
            last_update: Mutex::new(Instant::now()),
            update_interval,
        }
    }
    
    /// Set the relay connection pool
    pub fn set_relay_pool(&mut self, relay_pool: Arc<RelayConnectionPool>) {
        self.relay_pool = Some(relay_pool);
    }
    
    /// Get the metrics registry
    pub fn registry(&self) -> Arc<MetricsRegistry> {
        self.registry.clone()
    }
    
    /// Update metrics
    pub fn update_metrics(&self) {
        // Check if it's time to update
        let mut last_update = self.last_update.lock().unwrap();
        if last_update.elapsed() < self.update_interval {
            return;
        }
        *last_update = Instant::now();
        
        // Update connection pool metrics
        if let Some(relay_pool) = &self.relay_pool {
            let stats = relay_pool.get_connection_stats();
            
            self.registry.set_gauge("p2p_connections_total", stats.total_connections as f64);
            self.registry.set_gauge("p2p_connections_active", stats.in_use_connections as f64);
            self.registry.set_gauge("p2p_connections_idle", stats.idle_connections as f64);
            
            // Update relay metrics
            let relay_connections = relay_pool.get_relay_connections();
            self.registry.set_gauge("p2p_relay_connections", relay_connections.len() as f64);
            
            // Update relay scores
            let relay_discovery = relay_pool.relay_discovery();
            let relays = relay_discovery.get_relays();
            for relay in relays {
                let mut labels = HashMap::new();
                labels.insert("peer_id".to_string(), relay.peer_id.to_string());
                
                let metric_name = format!("p2p_relay_score_{}", relay.peer_id);
                self.registry.register_gauge(&metric_name, labels.clone());
                self.registry.set_gauge(&metric_name, relay.score());
            }
        }
    }
    
    /// Record a connection attempt
    pub fn record_connection_attempt(&self) {
        self.registry.increment_counter("p2p_connection_attempts", 1);
    }
    
    /// Record a successful connection
    pub fn record_connection_success(&self, latency_ms: u64) {
        self.registry.increment_counter("p2p_connection_successes", 1);
        self.registry.observe_histogram("p2p_connection_latency_ms", latency_ms as f64);
    }
    
    /// Record a failed connection
    pub fn record_connection_failure(&self) {
        self.registry.increment_counter("p2p_connection_failures", 1);
    }
    
    /// Get metrics as Prometheus format
    pub fn get_prometheus_metrics(&self) -> String {
        let mut output = String::new();
        
        // Update metrics first
        self.update_metrics();
        
        // Get all metrics
        let metrics = self.registry.get_metrics();
        
        // Convert to Prometheus format
        for metric in metrics {
            // Add metric help
            output.push_str(&format!("# HELP {} {}\n", metric.name, metric.name));
            
            // Add metric type
            let type_str = match metric.metric_type {
                MetricType::Counter => "counter",
                MetricType::Gauge => "gauge",
                MetricType::Histogram => "histogram",
            };
            output.push_str(&format!("# TYPE {} {}\n", metric.name, type_str));
            
            // Add metric value
            match metric.value {
                MetricValue::Counter(value) => {
                    let labels_str = format_labels(&metric.labels);
                    output.push_str(&format!("{}{} {}\n", metric.name, labels_str, value));
                }
                MetricValue::Gauge(value) => {
                    let labels_str = format_labels(&metric.labels);
                    output.push_str(&format!("{}{} {}\n", metric.name, labels_str, value));
                }
                MetricValue::Histogram(values) => {
                    // Calculate histogram buckets
                    let mut buckets = HashMap::new();
                    let bucket_bounds = [1.0, 5.0, 10.0, 50.0, 100.0, 500.0, 1000.0, 5000.0, 10000.0];
                    
                    for &bound in &bucket_bounds {
                        let count = values.iter().filter(|&&v| v <= bound).count();
                        buckets.insert(bound, count);
                    }
                    
                    // Add histogram buckets
                    for (&bound, &count) in &buckets {
                        let mut labels = metric.labels.clone();
                        labels.insert("le".to_string(), bound.to_string());
                        let labels_str = format_labels(&labels);
                        output.push_str(&format!("{}_bucket{} {}\n", metric.name, labels_str, count));
                    }
                    
                    // Add histogram sum
                    let sum: f64 = values.iter().sum();
                    let labels_str = format_labels(&metric.labels);
                    output.push_str(&format!("{}_sum{} {}\n", metric.name, labels_str, sum));
                    
                    // Add histogram count
                    output.push_str(&format!("{}_count{} {}\n", metric.name, labels_str, values.len()));
                }
            }
        }
        
        output
    }
}

/// Format labels as Prometheus format
fn format_labels(labels: &HashMap<String, String>) -> String {
    if labels.is_empty() {
        return "".to_string();
    }
    
    let labels_str = labels
        .iter()
        .map(|(k, v)| format!("{}=\"{}\"", k, v))
        .collect::<Vec<_>>()
        .join(",");
    
    format!("{{{}}}", labels_str)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_metrics_registry() {
        let registry = MetricsRegistry::new();
        
        // Register metrics
        registry.register_counter("test_counter", HashMap::new());
        registry.register_gauge("test_gauge", HashMap::new());
        registry.register_histogram("test_histogram", HashMap::new());
        
        // Update metrics
        registry.increment_counter("test_counter", 5);
        registry.set_gauge("test_gauge", 10.5);
        registry.observe_histogram("test_histogram", 100.0);
        registry.observe_histogram("test_histogram", 200.0);
        
        // Get metrics
        let counter = registry.get_metric("test_counter").unwrap();
        let gauge = registry.get_metric("test_gauge").unwrap();
        let histogram = registry.get_metric("test_histogram").unwrap();
        
        // Check values
        match counter.value {
            MetricValue::Counter(value) => assert_eq!(value, 5),
            _ => panic!("Expected counter value"),
        }
        
        match gauge.value {
            MetricValue::Gauge(value) => assert_eq!(value, 10.5),
            _ => panic!("Expected gauge value"),
        }
        
        match histogram.value {
            MetricValue::Histogram(values) => {
                assert_eq!(values.len(), 2);
                assert_eq!(values[0], 100.0);
                assert_eq!(values[1], 200.0);
            }
            _ => panic!("Expected histogram value"),
        }
    }
    
    #[test]
    fn test_prometheus_format() {
        let metrics = P2PMetrics::new(Duration::from_secs(1));
        
        // Record some metrics
        metrics.record_connection_attempt();
        metrics.record_connection_success(50);
        metrics.record_connection_failure();
        
        // Get Prometheus metrics
        let prometheus_metrics = metrics.get_prometheus_metrics();
        
        // Check that the output contains the expected metrics
        assert!(prometheus_metrics.contains("p2p_connection_attempts"));
        assert!(prometheus_metrics.contains("p2p_connection_successes"));
        assert!(prometheus_metrics.contains("p2p_connection_failures"));
        assert!(prometheus_metrics.contains("p2p_connection_latency_ms"));
    }
}