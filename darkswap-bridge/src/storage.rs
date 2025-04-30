//! Storage utilities for DarkSwap Bridge
//!
//! This module provides utilities for persistent storage.

use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use serde::{de::DeserializeOwned, Serialize};

use crate::auth::{Auth, AuthKey};
use crate::error::{Error, Result};

/// Storage manager
pub struct Storage {
    /// Storage directory
    storage_dir: PathBuf,
}

impl Storage {
    /// Create a new storage manager
    pub fn new<P: AsRef<Path>>(storage_dir: P) -> Result<Self> {
        let storage_dir = storage_dir.as_ref().to_path_buf();
        
        // Create storage directory if it doesn't exist
        if !storage_dir.exists() {
            fs::create_dir_all(&storage_dir).map_err(|e| {
                Error::StorageError(format!("Failed to create storage directory: {}", e))
            })?;
        }
        
        Ok(Self { storage_dir })
    }

    /// Save data to a file
    pub fn save<T: Serialize>(&self, name: &str, data: &T) -> Result<()> {
        let path = self.get_path(name);
        
        // Create parent directories if they don't exist
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent).map_err(|e| {
                    Error::StorageError(format!("Failed to create directory: {}", e))
                })?;
            }
        }
        
        // Serialize data
        let serialized = serde_json::to_string(data).map_err(|e| {
            Error::SerializationError(format!("Failed to serialize data: {}", e))
        })?;
        
        // Write data to file
        let mut file = File::create(&path).map_err(|e| {
            Error::StorageError(format!("Failed to create file: {}", e))
        })?;
        
        file.write_all(serialized.as_bytes()).map_err(|e| {
            Error::StorageError(format!("Failed to write to file: {}", e))
        })?;
        
        Ok(())
    }

    /// Load data from a file
    pub fn load<T: DeserializeOwned>(&self, name: &str) -> Result<T> {
        let path = self.get_path(name);
        
        // Check if file exists
        if !path.exists() {
            return Err(Error::NotFoundError(format!("File not found: {}", path.display())));
        }
        
        // Read data from file
        let mut file = File::open(&path).map_err(|e| {
            Error::StorageError(format!("Failed to open file: {}", e))
        })?;
        
        let mut contents = String::new();
        file.read_to_string(&mut contents).map_err(|e| {
            Error::StorageError(format!("Failed to read file: {}", e))
        })?;
        
        // Deserialize data
        let deserialized = serde_json::from_str(&contents).map_err(|e| {
            Error::DeserializationError(format!("Failed to deserialize data: {}", e))
        })?;
        
        Ok(deserialized)
    }

    /// Save encrypted data to a file
    pub fn save_encrypted<T: Serialize>(&self, name: &str, data: &T, key: &AuthKey) -> Result<()> {
        let path = self.get_path(name);
        
        // Create parent directories if they don't exist
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent).map_err(|e| {
                    Error::StorageError(format!("Failed to create directory: {}", e))
                })?;
            }
        }
        
        // Serialize data
        let serialized = serde_json::to_string(data).map_err(|e| {
            Error::SerializationError(format!("Failed to serialize data: {}", e))
        })?;
        
        // Encrypt data
        let encrypted = Auth::encrypt(key, serialized.as_bytes())?;
        
        // Write data to file
        let mut file = File::create(&path).map_err(|e| {
            Error::StorageError(format!("Failed to create file: {}", e))
        })?;
        
        file.write_all(&encrypted).map_err(|e| {
            Error::StorageError(format!("Failed to write to file: {}", e))
        })?;
        
        Ok(())
    }

    /// Load encrypted data from a file
    pub fn load_encrypted<T: DeserializeOwned>(&self, name: &str, key: &AuthKey) -> Result<T> {
        let path = self.get_path(name);
        
        // Check if file exists
        if !path.exists() {
            return Err(Error::NotFoundError(format!("File not found: {}", path.display())));
        }
        
        // Read data from file
        let mut file = File::open(&path).map_err(|e| {
            Error::StorageError(format!("Failed to open file: {}", e))
        })?;
        
        let mut encrypted = Vec::new();
        file.read_to_end(&mut encrypted).map_err(|e| {
            Error::StorageError(format!("Failed to read file: {}", e))
        })?;
        
        // Decrypt data
        let decrypted = Auth::decrypt(key, &encrypted)?;
        
        // Deserialize data
        let deserialized = serde_json::from_slice(&decrypted).map_err(|e| {
            Error::DeserializationError(format!("Failed to deserialize data: {}", e))
        })?;
        
        Ok(deserialized)
    }

    /// Check if a file exists
    pub fn exists(&self, name: &str) -> bool {
        self.get_path(name).exists()
    }

    /// Delete a file
    pub fn delete(&self, name: &str) -> Result<()> {
        let path = self.get_path(name);
        
        // Check if file exists
        if !path.exists() {
            return Ok(());
        }
        
        // Delete file
        fs::remove_file(&path).map_err(|e| {
            Error::StorageError(format!("Failed to delete file: {}", e))
        })?;
        
        Ok(())
    }

    /// List files in a directory
    pub fn list(&self, dir: &str) -> Result<Vec<String>> {
        let path = self.get_path(dir);
        
        // Check if directory exists
        if !path.exists() {
            return Ok(Vec::new());
        }
        
        // List files
        let entries = fs::read_dir(&path).map_err(|e| {
            Error::StorageError(format!("Failed to read directory: {}", e))
        })?;
        
        let mut files = Vec::new();
        for entry in entries {
            let entry = entry.map_err(|e| {
                Error::StorageError(format!("Failed to read directory entry: {}", e))
            })?;
            
            let file_name = entry.file_name();
            let file_name = file_name.to_string_lossy().to_string();
            
            files.push(file_name);
        }
        
        Ok(files)
    }

    /// Get the path for a file
    fn get_path(&self, name: &str) -> PathBuf {
        self.storage_dir.join(name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};
    use tempfile::tempdir;
    
    #[derive(Debug, Serialize, Deserialize, PartialEq)]
    struct TestData {
        name: String,
        value: i32,
    }
    
    #[test]
    fn test_save_load() {
        let dir = tempdir().unwrap();
        let storage = Storage::new(dir.path()).unwrap();
        
        let data = TestData {
            name: "test".to_string(),
            value: 42,
        };
        
        storage.save("test.json", &data).unwrap();
        
        let loaded: TestData = storage.load("test.json").unwrap();
        assert_eq!(loaded, data);
    }
    
    #[test]
    fn test_save_load_encrypted() {
        let dir = tempdir().unwrap();
        let storage = Storage::new(dir.path()).unwrap();
        let key = AuthKey::new_random();
        
        let data = TestData {
            name: "test".to_string(),
            value: 42,
        };
        
        storage.save_encrypted("test.enc", &data, &key).unwrap();
        
        let loaded: TestData = storage.load_encrypted("test.enc", &key).unwrap();
        assert_eq!(loaded, data);
        
        let wrong_key = AuthKey::new_random();
        assert!(storage.load_encrypted::<TestData>("test.enc", &wrong_key).is_err());
    }
    
    #[test]
    fn test_exists_delete() {
        let dir = tempdir().unwrap();
        let storage = Storage::new(dir.path()).unwrap();
        
        let data = TestData {
            name: "test".to_string(),
            value: 42,
        };
        
        assert!(!storage.exists("test.json"));
        
        storage.save("test.json", &data).unwrap();
        assert!(storage.exists("test.json"));
        
        storage.delete("test.json").unwrap();
        assert!(!storage.exists("test.json"));
    }
    
    #[test]
    fn test_list() {
        let dir = tempdir().unwrap();
        let storage = Storage::new(dir.path()).unwrap();
        
        let data = TestData {
            name: "test".to_string(),
            value: 42,
        };
        
        storage.save("test1.json", &data).unwrap();
        storage.save("test2.json", &data).unwrap();
        
        let files = storage.list("").unwrap();
        assert_eq!(files.len(), 2);
        assert!(files.contains(&"test1.json".to_string()));
        assert!(files.contains(&"test2.json".to_string()));
    }
}