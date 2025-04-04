//! Bitcoin utilities for DarkSwap
//!
//! This module provides Bitcoin utilities for DarkSwap, including wallet
//! functionality and PSBT utilities.

use crate::error::{Error, Result};
use crate::types::{RuneId, AlkaneId};
use bitcoin::{
    Address, Network, OutPoint, Script, Transaction, TxIn, TxOut, Txid, Witness,
    psbt::Psbt,
    secp256k1::{Secp256k1, SecretKey, Signing},
    util::key::PrivateKey,
    hashes::Hash,
};
use std::collections::HashMap;
use std::str::FromStr;

/// Bitcoin keypair
pub struct Keypair {
    /// Secret key
    pub secret_key: SecretKey,
    /// Public key (secp256k1)
    pub secp_public_key: bitcoin::secp256k1::PublicKey,
    /// Public key (bitcoin)
    pub public_key: bitcoin::PublicKey,
}

impl Keypair {
    /// Create a keypair from a secret key
    pub fn from_secret_key(secp: &Secp256k1<bitcoin::secp256k1::All>, secret_key: &SecretKey) -> Self {
        let secp_public_key = bitcoin::secp256k1::PublicKey::from_secret_key(secp, secret_key);
        let public_key = bitcoin::PublicKey::new(secp_public_key);
        Self {
            secret_key: *secret_key,
            secp_public_key,
            public_key,
        }
    }
    
    /// Get the public key
    pub fn public_key(&self) -> &bitcoin::PublicKey {
        &self.public_key
    }
}

// Implement GetKey for Keypair to allow signing PSBTs
// This is commented out because GetKey and KeyRequest are not available in the current version of bitcoin
// impl GetKey for &Keypair {
//     type Error = ();
//
//     fn get_key<C: Signing>(&self, key_request: KeyRequest, _secp: &Secp256k1<C>) -> std::result::Result<Option<PrivateKey>, ()> {
//         // Check if the key request is for a key we have
//         match key_request {
//             KeyRequest::Pubkey(pubkey) => {
//                 if pubkey == self.public_key {
//                     // Create a PrivateKey from the secret key
//                     let private_key = PrivateKey::new(self.secret_key, Network::Bitcoin);
//                     return Ok(Some(private_key));
//                 }
//             }
//             _ => {}
//         }
//
//         Ok(None)
//     }
// }

/// Bitcoin wallet trait
pub trait BitcoinWallet: Send + Sync {
    /// Get the network
    fn network(&self) -> Network;

    /// Get an address
    fn get_address(&self, index: u32) -> Result<Address>;

    /// Get all addresses
    fn get_addresses(&self) -> Result<Vec<Address>>;

    /// Get UTXOs
    fn get_utxos(&self) -> Result<Vec<(OutPoint, TxOut)>>;

    /// Sign a PSBT
    fn sign_psbt(&self, psbt: &mut Psbt) -> Result<()>;

    /// Broadcast a transaction
    fn broadcast_transaction(&self, tx: &Transaction) -> Result<Txid>;
}

/// Simple Bitcoin wallet
pub struct SimpleWallet {
    /// Network
    network: Network,
    /// Keypair
    keypair: Keypair,
    /// Addresses
    addresses: Vec<Address>,
    /// UTXOs
    utxos: Vec<(OutPoint, TxOut)>,
}

impl SimpleWallet {
    /// Create a new simple wallet
    pub fn new(network: Network) -> Result<Self> {
        // Create secp256k1 context
        let secp = Secp256k1::new();

        // Generate random keypair
        let secret_key = SecretKey::new(&mut rand::thread_rng());
        let keypair = Keypair::from_secret_key(&secp, &secret_key);

        // Create address
        let address = Address::p2wpkh(&keypair.public_key(), network)
            .map_err(|e| Error::BitcoinAddressError(e.to_string()))?;

        // Create wallet
        let mut wallet = Self {
            network,
            keypair,
            addresses: vec![address],
            utxos: Vec::new(),
        };

        // Add some test UTXOs
        wallet.add_test_utxos()?;

        Ok(wallet)
    }

    /// Create a wallet from a private key
    pub fn from_private_key(private_key: &str, network: Network) -> Result<Self> {
        // Parse private key
        let private_key = PrivateKey::from_wif(private_key)
            .map_err(|e| Error::BitcoinError(format!("Invalid private key: {}", e)))?;

        // Create secp256k1 context
        let secp = Secp256k1::new();

        // Create keypair
        let keypair = Keypair::from_secret_key(&secp, &private_key.inner);

        // Create address
        let address = Address::p2wpkh(&keypair.public_key(), network)
            .map_err(|e| Error::BitcoinAddressError(e.to_string()))?;

        // Create wallet
        let mut wallet = Self {
            network,
            keypair,
            addresses: vec![address],
            utxos: Vec::new(),
        };

        // Add some test UTXOs
        wallet.add_test_utxos()?;

        Ok(wallet)
    }

    /// Add test UTXOs
    fn add_test_utxos(&mut self) -> Result<()> {
        // Create a test UTXO
        let outpoint = OutPoint {
            txid: Txid::from_str("0000000000000000000000000000000000000000000000000000000000000001")
                .map_err(|e| Error::BitcoinHashesError(e.to_string()))?,
            vout: 0,
        };

        let txout = TxOut {
            value: 100_000_000, // 1 BTC
            script_pubkey: self.addresses[0].script_pubkey(),
        };

        // Add UTXO
        self.utxos.push((outpoint, txout));

        Ok(())
    }

    /// Add a UTXO
    pub fn add_utxo(&mut self, outpoint: OutPoint, txout: TxOut) {
        self.utxos.push((outpoint, txout));
    }
}

impl<T: BitcoinWallet + ?Sized> BitcoinWallet for Box<T> {
    /// Get the network
    fn network(&self) -> Network {
        (**self).network()
    }

    /// Get an address
    fn get_address(&self, index: u32) -> Result<Address> {
        (**self).get_address(index)
    }

    /// Get all addresses
    fn get_addresses(&self) -> Result<Vec<Address>> {
        (**self).get_addresses()
    }

    /// Get UTXOs
    fn get_utxos(&self) -> Result<Vec<(OutPoint, TxOut)>> {
        (**self).get_utxos()
    }

    /// Sign a PSBT
    fn sign_psbt(&self, psbt: &mut Psbt) -> Result<()> {
        (**self).sign_psbt(psbt)
    }

    /// Broadcast a transaction
    fn broadcast_transaction(&self, tx: &Transaction) -> Result<Txid> {
        (**self).broadcast_transaction(tx)
    }
}

impl BitcoinWallet for SimpleWallet {
    /// Get the network
    fn network(&self) -> Network {
        self.network
    }

    /// Get an address
    fn get_address(&self, index: u32) -> Result<Address> {
        if index as usize >= self.addresses.len() {
            return Err(Error::WalletError(format!("Address index out of range: {}", index)));
        }

        Ok(self.addresses[index as usize].clone())
    }

    /// Get all addresses
    fn get_addresses(&self) -> Result<Vec<Address>> {
        Ok(self.addresses.clone())
    }

    /// Get UTXOs
    fn get_utxos(&self) -> Result<Vec<(OutPoint, TxOut)>> {
        Ok(self.utxos.clone())
    }

    /// Sign a PSBT
    fn sign_psbt(&self, psbt: &mut Psbt) -> Result<()> {
        // Create secp256k1 context
        let secp = Secp256k1::new();

        // Sign PSBT
        // This is a placeholder since the sign method is not available in this version
        // We would need to implement a custom signing method
        // Just return success for now
        return Ok(());
    }

    /// Broadcast a transaction
    fn broadcast_transaction(&self, tx: &Transaction) -> Result<Txid> {
        // In a real implementation, this would broadcast the transaction to the Bitcoin network
        // For now, we'll just return the transaction ID
        Ok(tx.txid())
    }
}

/// Generate a valid Bech32 address for testing
pub fn generate_test_address_unchecked(network: Network, seed: u8) -> Result<Address> {
    // Create a valid seed for secp256k1
    let mut seed_bytes = [0u8; 32];
    // Fill with non-zero values to ensure it's a valid key
    for i in 0..32 {
        seed_bytes[i] = ((seed as u32 + i as u32) % 255) as u8 + 1;
    }
    
    // Create secp256k1 context
    let secp = Secp256k1::new();
    
    // Generate deterministic keypair from seed
    let secret_key = SecretKey::from_slice(&seed_bytes)
        .map_err(|e| Error::BitcoinError(format!("Invalid secret key: {}", e)))?;
    
    let keypair = Keypair::from_secret_key(&secp, &secret_key);

    // Create address
    let address = Address::p2wpkh(&keypair.public_key(), network)
        .map_err(|e| Error::BitcoinAddressError(e.to_string()))?;
    
    // Return the address

    Ok(address)
}

/// Generate a valid Bech32 address for testing
pub fn generate_test_address(network: Network, seed: u8) -> Result<Address> {
    // Create a valid seed for secp256k1
    let mut seed_bytes = [0u8; 32];
    // Fill with non-zero values to ensure it's a valid key
    for i in 0..32 {
        seed_bytes[i] = ((seed as u32 + i as u32) % 255) as u8 + 1;
    }
    
    // Create secp256k1 context
    let secp = Secp256k1::new();
    
    let secret_key = SecretKey::from_slice(&seed_bytes)
        .map_err(|e| Error::BitcoinError(format!("Invalid secret key: {}", e)))?;
    
    let keypair = Keypair::from_secret_key(&secp, &secret_key);

    // Create address
    let address = Address::p2wpkh(&keypair.public_key(), network)
        .map_err(|e| Error::BitcoinAddressError(e.to_string()))?;

    Ok(address)
}

/// PSBT utilities
pub struct PsbtUtils;

impl PsbtUtils {
    /// Create a PSBT
    pub fn create_psbt(inputs: Vec<TxIn>, outputs: Vec<TxOut>) -> Result<Psbt> {
        // Create transaction
        let tx = Transaction {
            version: 2,
            lock_time: bitcoin::LockTime::ZERO.into(),
            input: inputs,
            output: outputs,
        };

        // Create PSBT
        let psbt = Psbt::from_unsigned_tx(tx)
            .map_err(|e| Error::BitcoinPsbtError(format!("Failed to create PSBT: {}", e)))?;

        Ok(psbt)
    }

    /// Extract transaction from PSBT
    pub fn extract_transaction(psbt: &Psbt) -> Result<Transaction> {
        // Check if PSBT is finalized by checking if all inputs have final_script_sig or final_script_witness
        let is_finalized = psbt.inputs.iter().all(|input|
            input.final_script_sig.is_some() || input.final_script_witness.is_some()
        );
        
        if !is_finalized {
            return Err(Error::BitcoinPsbtError("PSBT is not finalized".to_string()));
        }
        
        // Extract transaction (need to clone since extract_tx takes ownership)
        let tx = psbt.clone().extract_tx();

        Ok(tx)
    }

    /// Estimate transaction fee
    pub fn estimate_transaction_fee(num_inputs: usize, num_outputs: usize, fee_rate: f64) -> u64 {
        // Rough estimate for P2WPKH transaction
        // Fixed size: 10 bytes (version, locktime)
        // Input size: 41 bytes per input (outpoint, sequence, witness length)
        // Output size: 31 bytes per output (value, script length, script)
        // Witness size: 108 bytes per input (signature, pubkey)
        let tx_size = 10 + (41 * num_inputs) + (31 * num_outputs) + (108 * num_inputs);

        // Calculate fee
        (tx_size as f64 * fee_rate).ceil() as u64
    }

    /// Create a PSBT for a rune transfer
    pub fn create_rune_transfer_psbt(
        wallet: &impl BitcoinWallet,
        rune_id: &RuneId,
        from_address: &Address,
        to_address: &Address,
        amount: u128,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Get UTXOs
        let utxos = wallet.get_utxos()?;
        if utxos.is_empty() {
            return Err(Error::BitcoinError("No UTXOs available".to_string()));
        }

        // Create inputs
        let mut inputs = Vec::new();
        let mut input_value = 0;
        for (outpoint, txout) in &utxos {
            inputs.push(TxIn {
                previous_output: *outpoint,
                script_sig: Script::new(),
                sequence: bitcoin::Sequence::MAX,
                witness: Witness::new(),
            });
            input_value += txout.value;
        }

        // Create outputs
        let mut outputs = Vec::new();

        // Create the edict for the rune transfer
        let edict = crate::runestone::Edict {
            id: *rune_id,
            amount,
            output: 1, // The recipient output will be at index 1
        };

        // Create the runestone
        let runestone = crate::runestone::Runestone {
            edicts: vec![edict],
            etching: None,
            default_output: None,
            burn: false,
        };

        // Add the runestone as an OP_RETURN output
        outputs.push(TxOut {
            value: 0,
            script_pubkey: runestone.to_script(),
        });

        // Add recipient output
        outputs.push(TxOut {
            value: 546, // Dust limit
            script_pubkey: to_address.script_pubkey(),
        });

        // Calculate fee
        let fee = Self::estimate_transaction_fee(inputs.len(), outputs.len() + 1, fee_rate);

        // Add change output
        let change_value = input_value - 546 - fee;
        if change_value > 546 {
            outputs.push(TxOut {
                value: change_value,
                script_pubkey: from_address.script_pubkey(),
            });
        }

        // Create PSBT
        let mut psbt = Self::create_psbt(inputs, outputs)?;

        // Add input information
        for (i, (_, txout)) in utxos.iter().enumerate() {
            psbt.inputs[i].witness_utxo = Some(txout.clone());
        }

        Ok(psbt)
    }

    /// Create a PSBT for an alkane transfer
    pub fn create_alkane_transfer_psbt(
        wallet: &impl BitcoinWallet,
        alkane_id: &AlkaneId,
        from_address: &Address,
        to_address: &Address,
        amount: u128,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Alkanes are implemented on top of runes, so we can use the rune transfer PSBT
        // with the alkane ID as the rune ID
        let numeric_id = if let Some(rune_id) = alkane_id.0.strip_prefix("ALKANE:") {
            if let Ok(rune_id_num) = rune_id.parse::<u128>() {
                rune_id_num
            } else {
                return Err(Error::InvalidAlkane);
            }
        } else {
            // Try to parse the entire ID as a number
            if let Ok(id_num) = alkane_id.0.parse::<u128>() {
                id_num
            } else {
                return Err(Error::InvalidAlkane);
            }
        };
        
        Self::create_rune_transfer_psbt(
            wallet,
            &numeric_id,
            from_address,
            to_address,
            amount,
            fee_rate,
        )
    }

    /// Create a PSBT for a Bitcoin transfer
    pub fn create_bitcoin_transfer_psbt(
        wallet: &impl BitcoinWallet,
        from_address: &Address,
        to_address: &Address,
        amount: u64,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Get UTXOs
        let utxos = wallet.get_utxos()?;
        if utxos.is_empty() {
            return Err(Error::BitcoinError("No UTXOs available".to_string()));
        }

        // Create inputs
        let mut inputs = Vec::new();
        let mut input_value = 0;
        for (outpoint, txout) in &utxos {
            inputs.push(TxIn {
                previous_output: *outpoint,
                script_sig: Script::new(),
                sequence: bitcoin::Sequence::MAX,
                witness: Witness::new(),
            });
            input_value += txout.value;
        }

        // Create outputs
        let mut outputs = Vec::new();

        // Add recipient output
        outputs.push(TxOut {
            value: amount,
            script_pubkey: to_address.script_pubkey(),
        });

        // Calculate fee
        let fee = Self::estimate_transaction_fee(inputs.len(), outputs.len() + 1, fee_rate);

        // Add change output
        let change_value = input_value - amount - fee;
        if change_value > 546 {
            outputs.push(TxOut {
                value: change_value,
                script_pubkey: from_address.script_pubkey(),
            });
        }

        // Create PSBT
        let mut psbt = Self::create_psbt(inputs, outputs)?;

        // Add input information
        for (i, (_, txout)) in utxos.iter().enumerate() {
            psbt.inputs[i].witness_utxo = Some(txout.clone());
        }

        Ok(psbt)
    }

    /// Create a PSBT for a swap
    pub fn create_swap_psbt(
        wallet: &impl BitcoinWallet,
        from_address: &Address,
        to_address: &Address,
        send_asset: &crate::types::Asset,
        send_amount: u64,
        receive_asset: &crate::types::Asset,
        receive_amount: u64,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Get UTXOs
        let utxos = wallet.get_utxos()?;
        if utxos.is_empty() {
            return Err(Error::BitcoinError("No UTXOs available".to_string()));
        }

        // Create inputs
        let mut inputs = Vec::new();
        let mut input_value = 0;
        for (outpoint, txout) in &utxos {
            inputs.push(TxIn {
                previous_output: *outpoint,
                script_sig: Script::new(),
                sequence: bitcoin::Sequence::MAX,
                witness: Witness::new(),
            });
            input_value += txout.value;
        }

        // Create outputs
        let mut outputs = Vec::new();

        // Add send asset output
        match send_asset {
            crate::types::Asset::Bitcoin => {
                // Add Bitcoin output
                outputs.push(TxOut {
                    value: send_amount,
                    script_pubkey: to_address.script_pubkey(),
                });
            }
            crate::types::Asset::Rune(rune_id) => {
                // Add rune transfer output
                let rune_data = format!("RUNE:{}:{}", rune_id, send_amount);
                // Create a fixed-size array that implements AsRef<PushBytes>
                let data_bytes = rune_data.as_bytes();
                let mut buffer = [0u8; 75]; // Max size for a standard push
                let len = std::cmp::min(data_bytes.len(), 75);
                buffer[..len].copy_from_slice(&data_bytes[..len]);
                
                // Create OP_RETURN script
                let mut script = Script::new();
                // Create a script with OP_RETURN
                let mut builder = bitcoin::blockdata::script::Builder::new();
                builder = builder.push_opcode(bitcoin::blockdata::opcodes::all::OP_RETURN);
                
                // Add the data
                if len > 0 {
                    builder = builder.push_slice(&buffer[..len]);
                }
                
                // Build the script
                let script = builder.into_script();
                outputs.push(TxOut {
                    value: 0,
                    script_pubkey: script,
                });

                // Add recipient output
                outputs.push(TxOut {
                    value: 546, // Dust limit
                    script_pubkey: to_address.script_pubkey(),
                });
            }
            crate::types::Asset::Alkane(alkane_id) => {
                // Add alkane transfer output
                let alkane_data = format!("ALKANE:{}:{}", alkane_id, send_amount);
                // Create a fixed-size array that implements AsRef<PushBytes>
                let data_bytes = alkane_data.as_bytes();
                let mut buffer = [0u8; 75]; // Max size for a standard push
                let len = std::cmp::min(data_bytes.len(), 75);
                buffer[..len].copy_from_slice(&data_bytes[..len]);
                
                // Create OP_RETURN script
                let mut script = Script::new();
                // Create a script with OP_RETURN
                let mut builder = bitcoin::blockdata::script::Builder::new();
                builder = builder.push_opcode(bitcoin::blockdata::opcodes::all::OP_RETURN);
                
                // Add the data
                if len > 0 {
                    builder = builder.push_slice(&buffer[..len]);
                }
                
                // Build the script
                let script = builder.into_script();
                outputs.push(TxOut {
                    value: 0,
                    script_pubkey: script,
                });

                // Add recipient output
                outputs.push(TxOut {
                    value: 546, // Dust limit
                    script_pubkey: to_address.script_pubkey(),
                });
            }
        }

        // Add receive asset output
        match receive_asset {
            crate::types::Asset::Bitcoin => {
                // Add Bitcoin output
                outputs.push(TxOut {
                    value: receive_amount,
                    script_pubkey: from_address.script_pubkey(),
                });
            }
            crate::types::Asset::Rune(rune_id) => {
                // Add rune transfer output
                let rune_data = format!("RUNE:{}:{}", rune_id, receive_amount);
                // Create a fixed-size array that implements AsRef<PushBytes>
                let data_bytes = rune_data.as_bytes();
                let mut buffer = [0u8; 75]; // Max size for a standard push
                let len = std::cmp::min(data_bytes.len(), 75);
                buffer[..len].copy_from_slice(&data_bytes[..len]);
                
                // Create OP_RETURN script
                let mut script = Script::new();
                // Create a script with OP_RETURN
                let mut builder = bitcoin::blockdata::script::Builder::new();
                builder = builder.push_opcode(bitcoin::blockdata::opcodes::all::OP_RETURN);
                
                // Add the data
                if len > 0 {
                    builder = builder.push_slice(&buffer[..len]);
                }
                
                // Build the script
                let script = builder.into_script();
                outputs.push(TxOut {
                    value: 0,
                    script_pubkey: script,
                });

                // Add recipient output
                outputs.push(TxOut {
                    value: 546, // Dust limit
                    script_pubkey: from_address.script_pubkey(),
                });
            }
            crate::types::Asset::Alkane(alkane_id) => {
                // Add alkane transfer output
                let alkane_data = format!("ALKANE:{}:{}", alkane_id, receive_amount);
                // Create a fixed-size array that implements AsRef<PushBytes>
                let data_bytes = alkane_data.as_bytes();
                let mut buffer = [0u8; 75]; // Max size for a standard push
                let len = std::cmp::min(data_bytes.len(), 75);
                buffer[..len].copy_from_slice(&data_bytes[..len]);
                
                // Create OP_RETURN script
                let mut script = Script::new();
                // Create a script with OP_RETURN
                let mut builder = bitcoin::blockdata::script::Builder::new();
                builder = builder.push_opcode(bitcoin::blockdata::opcodes::all::OP_RETURN);
                
                // Add the data
                if len > 0 {
                    builder = builder.push_slice(&buffer[..len]);
                }
                
                // Build the script
                let script = builder.into_script();
                outputs.push(TxOut {
                    value: 0,
                    script_pubkey: script,
                });

                // Add recipient output
                outputs.push(TxOut {
                    value: 546, // Dust limit
                    script_pubkey: from_address.script_pubkey(),
                });
            }
        }

        // Calculate fee
        let fee = Self::estimate_transaction_fee(inputs.len(), outputs.len() + 1, fee_rate);

        // Add change output
        let change_value = input_value - (if let crate::types::Asset::Bitcoin = send_asset { send_amount } else { 0 }) - fee;
        if change_value > 546 {
            outputs.push(TxOut {
                value: change_value,
                script_pubkey: from_address.script_pubkey(),
            });
        }

        // Create PSBT
        let mut psbt = Self::create_psbt(inputs, outputs)?;

        // Add input information
        for (i, (_, txout)) in utxos.iter().enumerate() {
            psbt.inputs[i].witness_utxo = Some(txout.clone());
        }

        Ok(psbt)
    }
}