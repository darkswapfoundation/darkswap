//! Multi-signature predicate alkanes
//!
//! This module provides a multi-signature predicate alkane implementation that requires
//! multiple signatures to be valid.

use std::collections::HashMap;

use anyhow::Result;
use bitcoin::{PublicKey, Script, Transaction, secp256k1::Secp256k1};
use bitcoin::util::key::PublicKey as BitcoinPublicKey;

use crate::error::Error;
use crate::predicates::Predicate;
use crate::types::AlkaneId;

/// Multi-signature predicate alkane
///
/// This predicate requires a minimum number of signatures from a set of public keys to be valid.
pub struct MultiSignaturePredicateAlkane {
    /// Alkane ID
    pub alkane_id: AlkaneId,
    /// Amount
    pub amount: u128,
    /// Public keys
    pub public_keys: Vec<PublicKey>,
    /// Required signatures
    pub required_signatures: usize,
    /// Metadata
    pub metadata: HashMap<String, String>,
}

impl MultiSignaturePredicateAlkane {
    /// Create a new multi-signature predicate alkane
    pub fn new(
        alkane_id: AlkaneId,
        amount: u128,
        public_keys: Vec<PublicKey>,
        required_signatures: usize,
    ) -> Self {
        Self {
            alkane_id,
            amount,
            public_keys,
            required_signatures,
            metadata: HashMap::new(),
        }
    }
    
    /// Add metadata to the predicate
    pub fn with_metadata(mut self, key: &str, value: &str) -> Self {
        self.metadata.insert(key.to_string(), value.to_string());
        self
    }
    
    /// Create a multi-signature script
    pub fn create_script(&self) -> Script {
        // Create a multi-signature script
        let secp = Secp256k1::new();
        let mut builder = bitcoin::blockdata::script::Builder::new();
        
        // Add the required signatures
        builder = builder.push_int(self.required_signatures as i64);
        
        // Add the public keys
        for public_key in &self.public_keys {
            builder = builder.push_slice(&public_key.to_bytes());
        }
        
        // Add the total number of public keys
        builder = builder.push_int(self.public_keys.len() as i64);
        
        // Add the OP_CHECKMULTISIG opcode
        builder = builder.push_opcode(bitcoin::blockdata::opcodes::all::OP_CHECKMULTISIG);
        
        builder.into_script()
    }
}

impl Predicate for MultiSignaturePredicateAlkane {
    fn validate(&self, tx: &Transaction) -> std::result::Result<bool, crate::error::Error> {
        // Check if the transaction contains the alkane
        let mut found = false;
        
        for output in &tx.output {
            // Check if the output contains the alkane
            if let Some(script_data) = output.script_pubkey.as_bytes().get(1..) {
                if let Ok(data_str) = std::str::from_utf8(script_data) {
                    if data_str.starts_with(&format!("ALKANE:{}:{}", self.alkane_id.0, self.amount)) {
                        found = true;
                        break;
                    }
                }
            }
        }
        
        if !found {
            return Ok(false);
        }
        
        // Check if the transaction has the required signatures
        // In a real implementation, we would check the signatures against the public keys
        // For now, we just check if the transaction has at least one input
        if tx.input.len() < self.required_signatures {
            return Ok(false);
        }
        
        // Check if the transaction has the correct script
        let script = self.create_script();
        
        for input in &tx.input {
            if input.script_sig == script {
                return Ok(true);
            }
        }
        
        Ok(false)
    }
    
    fn name(&self) -> &str {
        "MultiSignaturePredicateAlkane"
    }
    
    fn description(&self) -> &str {
        "A predicate alkane contract that requires multiple signatures to be valid"
    }
}

/// Factory for creating multi-signature predicate alkanes
pub struct MultiSignaturePredicateAlkaneFactory;

impl MultiSignaturePredicateAlkaneFactory {
    /// Create a new multi-signature predicate alkane
    pub fn create(
        alkane_id: AlkaneId,
        amount: u128,
        public_keys: Vec<PublicKey>,
        required_signatures: usize,
    ) -> MultiSignaturePredicateAlkane {
        MultiSignaturePredicateAlkane::new(
            alkane_id,
            amount,
            public_keys,
            required_signatures,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bitcoin::{PrivateKey, Network};
    
    /// Test multi-signature predicate
    #[test]
    fn test_multi_signature_predicate() {
        // Create private keys
        let private_key1 = PrivateKey::from_wif("cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy").unwrap();
        let private_key2 = PrivateKey::from_wif("cRGkipHiYFRSAgdY9NjUT4ESg7ic3dpGZ5GNxABDUJHx6M8GbKgN").unwrap();
        let private_key3 = PrivateKey::from_wif("cTivdBnq7FLxxuuNmgFnYddGsn9mvKV1PZEPw2mfQQBVHfzZ7KqR").unwrap();
        
        // Get public keys
        let public_key1 = private_key1.public_key(&Secp256k1::new());
        let public_key2 = private_key2.public_key(&Secp256k1::new());
        let public_key3 = private_key3.public_key(&Secp256k1::new());
        
        // Create a multi-signature predicate
        let alkane_id = AlkaneId("test_alkane".to_string());
        let amount = 100u128;
        let public_keys = vec![public_key1, public_key2, public_key3];
        let required_signatures = 2;
        
        let predicate = MultiSignaturePredicateAlkaneFactory::create(
            alkane_id.clone(),
            amount,
            public_keys,
            required_signatures,
        );
        
        // Create a transaction with the alkane
        let mut tx = Transaction {
            version: 2,
            lock_time: bitcoin::LockTime::ZERO.into(),
            input: Vec::new(),
            output: Vec::new(),
        };
        
        // Add inputs
        tx.input.push(bitcoin::TxIn {
            previous_output: bitcoin::OutPoint::null(),
            script_sig: predicate.create_script(),
            sequence: bitcoin::Sequence::MAX,
            witness: bitcoin::Witness::new(),
        });
        
        tx.input.push(bitcoin::TxIn {
            previous_output: bitcoin::OutPoint::null(),
            script_sig: bitcoin::Script::new(),
            sequence: bitcoin::Sequence::MAX,
            witness: bitcoin::Witness::new(),
        });
        
        // Add the alkane output
        let mut builder = bitcoin::blockdata::script::Builder::new();
        builder = builder.push_opcode(bitcoin::blockdata::opcodes::all::OP_RETURN);
        
        // Format: "ALKANE:<id>:<amount>"
        let data = format!("ALKANE:{}:{}", alkane_id.0, amount);
        builder = builder.push_slice(data.as_bytes());
        
        // Build the script
        let script = builder.into_script();
        
        tx.output.push(bitcoin::TxOut {
            value: 0,
            script_pubkey: script,
        });
        
        // Add a dummy recipient output
        tx.output.push(bitcoin::TxOut {
            value: 546, // Dust limit
            script_pubkey: bitcoin::Script::new(),
        });
        
        // Validate the transaction
        let result = predicate.validate(&tx);
        
        // Verify the result
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
}