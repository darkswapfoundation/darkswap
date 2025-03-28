//! Runestone implementation
//!
//! This module provides the implementation of the Runestone structure and related functionality.

use bitcoin::{
    ScriptBuf, Transaction,
};
use crate::error::{Error, Result};
use std::collections::HashMap;

/// Runestone structure
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Runestone {
    /// Edicts
    pub edicts: Vec<Edict>,
    /// Etching
    pub etching: Option<Etching>,
    /// Default output
    pub default_output: Option<u32>,
    /// Burn flag
    pub burn: bool,
}

/// Edict structure
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Edict {
    /// Rune ID
    pub id: u128,
    /// Amount
    pub amount: u128,
    /// Output
    pub output: u32,
}

/// Etching structure
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Etching {
    /// Rune
    pub rune: u128,
    /// Symbol
    pub symbol: Option<String>,
    /// Decimals
    pub decimals: Option<u8>,
    /// Spacers
    pub spacers: u32,
    /// Amount
    pub amount: u128,
    /// Terms
    pub terms: Option<Terms>,
}

/// Terms structure
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Terms {
    /// Cap
    pub cap: Option<u128>,
    /// Height
    pub height: Option<u32>,
    /// Amount
    pub amount: Option<u128>,
}

impl Runestone {
    /// Create a new Runestone
    pub fn new(
        edicts: Vec<Edict>,
        etching: Option<Etching>,
        default_output: Option<u32>,
        burn: bool,
    ) -> Self {
        Self {
            edicts,
            etching,
            default_output,
            burn,
        }
    }

    /// Parse a Runestone from a transaction
    pub fn parse(tx: &Transaction) -> Option<Self> {
        // Look for OP_RETURN outputs with the rune protocol prefix
        for output in &tx.output {
            if output.script_pubkey.is_op_return() {
                // Extract the data from the OP_RETURN output
                let script = &output.script_pubkey;
                
                // Reconstruct the data from the script
                let mut data = Vec::new();
                let mut instructions = script.instructions();
                
                // Skip the OP_RETURN
                let _ = instructions.next();
                
                // Collect all push operations
                for instruction in instructions {
                    if let Ok(bitcoin::blockdata::script::Instruction::PushBytes(bytes)) = instruction {
                        data.extend_from_slice(bytes.as_bytes());
                    }
                }
                
                // Check if the data starts with the rune protocol prefix
                if data.len() >= 4 && &data[0..4] == b"RUNE" {
                    // Parse the data according to the rune protocol specification
                    return parse_runestone_data(&data[4..]);
                }
            }
        }
        
        None
    }

    /// Convert the Runestone to a script
    pub fn to_script(&self) -> ScriptBuf {
        // Create a script with the rune protocol prefix
        let mut data = Vec::with_capacity(1024);
        data.extend_from_slice(b"RUNE");
        
        // Add the Runestone data
        self.serialize_to(&mut data);
        
        // Create an OP_RETURN script with the data
        // We need to use a fixed-size array that implements AsRef<PushBytes>
        let mut script = ScriptBuf::new();
        script.push_opcode(bitcoin::opcodes::all::OP_RETURN);
        
        // Add the data in chunks of 75 bytes (max size for a standard push)
        for chunk in data.chunks(75) {
            // Convert the chunk to a fixed-size array that implements AsRef<PushBytes>
            match chunk.len() {
                1 => script.push_slice(&[chunk[0]]),
                2 => script.push_slice(&[chunk[0], chunk[1]]),
                3 => script.push_slice(&[chunk[0], chunk[1], chunk[2]]),
                4 => script.push_slice(&[chunk[0], chunk[1], chunk[2], chunk[3]]),
                5 => script.push_slice(&[chunk[0], chunk[1], chunk[2], chunk[3], chunk[4]]),
                // Add more cases as needed for larger chunks
                _ => {
                    // For larger chunks, we'll push bytes individually
                    for &byte in chunk {
                        script.push_slice(&[byte]);
                    }
                }
            }
        }
        
        script
    }

    /// Serialize the Runestone to a byte vector
    fn serialize_to(&self, data: &mut Vec<u8>) {
        // Add the burn flag
        if self.burn {
            data.push(0x01);
        } else {
            data.push(0x00);
        }
        
        // Add the default output if present
        if let Some(output) = self.default_output {
            data.push(0x01);
            data.extend_from_slice(&output.to_le_bytes());
        } else {
            data.push(0x00);
        }
        
        // Add the etching if present
        if let Some(ref etching) = self.etching {
            data.push(0x01);
            
            // Add the rune
            data.extend_from_slice(&etching.rune.to_le_bytes());
            
            // Add the symbol if present
            if let Some(ref symbol) = etching.symbol {
                data.push(0x01);
                data.push(symbol.len() as u8);
                data.extend_from_slice(symbol.as_bytes());
            } else {
                data.push(0x00);
            }
            
            // Add the decimals if present
            if let Some(decimals) = etching.decimals {
                data.push(0x01);
                data.push(decimals);
            } else {
                data.push(0x00);
            }
            
            // Add the spacers
            data.extend_from_slice(&etching.spacers.to_le_bytes());
            
            // Add the amount
            data.extend_from_slice(&etching.amount.to_le_bytes());
            
            // Add the terms if present
            if let Some(ref terms) = etching.terms {
                data.push(0x01);
                
                // Add the cap if present
                if let Some(cap) = terms.cap {
                    data.push(0x01);
                    data.extend_from_slice(&cap.to_le_bytes());
                } else {
                    data.push(0x00);
                }
                
                // Add the height if present
                if let Some(height) = terms.height {
                    data.push(0x01);
                    data.extend_from_slice(&height.to_le_bytes());
                } else {
                    data.push(0x00);
                }
                
                // Add the amount if present
                if let Some(amount) = terms.amount {
                    data.push(0x01);
                    data.extend_from_slice(&amount.to_le_bytes());
                } else {
                    data.push(0x00);
                }
            } else {
                data.push(0x00);
            }
        } else {
            data.push(0x00);
        }
        
        // Add the edicts
        data.extend_from_slice(&(self.edicts.len() as u32).to_le_bytes());
        for edict in &self.edicts {
            // Add the id
            data.extend_from_slice(&edict.id.to_le_bytes());
            
            // Add the amount
            data.extend_from_slice(&edict.amount.to_le_bytes());
            
            // Add the output
            data.extend_from_slice(&edict.output.to_le_bytes());
        }
    }
}

/// Parse Runestone data
fn parse_runestone_data(data: &[u8]) -> Option<Runestone> {
    if data.is_empty() {
        return None;
    }
    
    let mut index = 0;
    
    // Parse the burn flag
    if index >= data.len() {
        return None;
    }
    let burn = data[index] != 0;
    index += 1;
    
    // Parse the default output
    if index >= data.len() {
        return None;
    }
    let has_default_output = data[index] != 0;
    index += 1;
    
    let default_output = if has_default_output {
        if index + 4 > data.len() {
            return None;
        }
        let mut bytes = [0u8; 4];
        bytes.copy_from_slice(&data[index..index + 4]);
        index += 4;
        Some(u32::from_le_bytes(bytes))
    } else {
        None
    };
    
    // Parse the etching
    if index >= data.len() {
        return None;
    }
    let has_etching = data[index] != 0;
    index += 1;
    
    let etching = if has_etching {
        // Parse the rune
        if index + 16 > data.len() {
            return None;
        }
        let mut bytes = [0u8; 16];
        bytes.copy_from_slice(&data[index..index + 16]);
        let rune = u128::from_le_bytes(bytes);
        index += 16;
        
        // Parse the symbol
        if index >= data.len() {
            return None;
        }
        let has_symbol = data[index] != 0;
        index += 1;
        
        let symbol = if has_symbol {
            if index >= data.len() {
                return None;
            }
            let symbol_len = data[index] as usize;
            index += 1;
            
            if index + symbol_len > data.len() {
                return None;
            }
            let symbol_bytes = &data[index..index + symbol_len];
            index += symbol_len;
            
            match std::str::from_utf8(symbol_bytes) {
                Ok(s) => Some(s.to_string()),
                Err(_) => return None,
            }
        } else {
            None
        };
        
        // Parse the decimals
        if index >= data.len() {
            return None;
        }
        let has_decimals = data[index] != 0;
        index += 1;
        
        let decimals = if has_decimals {
            if index >= data.len() {
                return None;
            }
            let decimals = data[index];
            index += 1;
            Some(decimals)
        } else {
            None
        };
        
        // Parse the spacers
        if index + 4 > data.len() {
            return None;
        }
        let mut bytes = [0u8; 4];
        bytes.copy_from_slice(&data[index..index + 4]);
        let spacers = u32::from_le_bytes(bytes);
        index += 4;
        
        // Parse the amount
        if index + 16 > data.len() {
            return None;
        }
        let mut bytes = [0u8; 16];
        bytes.copy_from_slice(&data[index..index + 16]);
        let amount = u128::from_le_bytes(bytes);
        index += 16;
        
        // Parse the terms
        if index >= data.len() {
            return None;
        }
        let has_terms = data[index] != 0;
        index += 1;
        
        let terms = if has_terms {
            // Parse the cap
            if index >= data.len() {
                return None;
            }
            let has_cap = data[index] != 0;
            index += 1;
            
            let cap = if has_cap {
                if index + 16 > data.len() {
                    return None;
                }
                let mut bytes = [0u8; 16];
                bytes.copy_from_slice(&data[index..index + 16]);
                let cap = u128::from_le_bytes(bytes);
                index += 16;
                Some(cap)
            } else {
                None
            };
            
            // Parse the height
            if index >= data.len() {
                return None;
            }
            let has_height = data[index] != 0;
            index += 1;
            
            let height = if has_height {
                if index + 4 > data.len() {
                    return None;
                }
                let mut bytes = [0u8; 4];
                bytes.copy_from_slice(&data[index..index + 4]);
                let height = u32::from_le_bytes(bytes);
                index += 4;
                Some(height)
            } else {
                None
            };
            
            // Parse the amount
            if index >= data.len() {
                return None;
            }
            let has_amount = data[index] != 0;
            index += 1;
            
            let amount = if has_amount {
                if index + 16 > data.len() {
                    return None;
                }
                let mut bytes = [0u8; 16];
                bytes.copy_from_slice(&data[index..index + 16]);
                let amount = u128::from_le_bytes(bytes);
                index += 16;
                Some(amount)
            } else {
                None
            };
            
            Some(Terms {
                cap,
                height,
                amount,
            })
        } else {
            None
        };
        
        Some(Etching {
            rune,
            symbol,
            decimals,
            spacers,
            amount,
            terms,
        })
    } else {
        None
    };
    
    // Parse the edicts
    if index + 4 > data.len() {
        return None;
    }
    let mut bytes = [0u8; 4];
    bytes.copy_from_slice(&data[index..index + 4]);
    let edict_count = u32::from_le_bytes(bytes) as usize;
    index += 4;
    
    let mut edicts = Vec::with_capacity(edict_count);
    for _ in 0..edict_count {
        // Parse the id
        if index + 16 > data.len() {
            return None;
        }
        let mut bytes = [0u8; 16];
        bytes.copy_from_slice(&data[index..index + 16]);
        let id = u128::from_le_bytes(bytes);
        index += 16;
        
        // Parse the amount
        if index + 16 > data.len() {
            return None;
        }
        let mut bytes = [0u8; 16];
        bytes.copy_from_slice(&data[index..index + 16]);
        let amount = u128::from_le_bytes(bytes);
        index += 16;
        
        // Parse the output
        if index + 4 > data.len() {
            return None;
        }
        let mut bytes = [0u8; 4];
        bytes.copy_from_slice(&data[index..index + 4]);
        let output = u32::from_le_bytes(bytes);
        index += 4;
        
        edicts.push(Edict {
            id,
            amount,
            output,
        });
    }
    
    Some(Runestone {
        edicts,
        etching,
        default_output,
        burn,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_runestone_serialization() {
        // Create a Runestone
        let runestone = Runestone {
            edicts: vec![
                Edict {
                    id: 123456789,
                    amount: 1000000000,
                    output: 1,
                },
                Edict {
                    id: 987654321,
                    amount: 2000000000,
                    output: 2,
                },
            ],
            etching: Some(Etching {
                rune: 123456789,
                symbol: Some("TEST".to_string()),
                decimals: Some(8),
                spacers: 0,
                amount: 21000000,
                terms: Some(Terms {
                    cap: Some(21000000),
                    height: Some(100000),
                    amount: Some(10000),
                }),
            }),
            default_output: Some(0),
            burn: false,
        };
        
        // Serialize the Runestone
        let mut data = Vec::new();
        data.extend_from_slice(b"RUNE");
        runestone.serialize_to(&mut data);
        
        // Parse the Runestone
        let parsed = parse_runestone_data(&data[4..]).unwrap();
        
        // Check that the parsed Runestone matches the original
        assert_eq!(parsed, runestone);
    }
    
    #[test]
    fn test_runestone_to_script() {
        // Create a Runestone
        let runestone = Runestone {
            edicts: vec![
                Edict {
                    id: 123456789,
                    amount: 1000000000,
                    output: 1,
                },
            ],
            etching: None,
            default_output: None,
            burn: false,
        };
        
        // Convert the Runestone to a script
        let script = runestone.to_script();
        
        // Check that the script is an OP_RETURN script
        assert!(script.is_op_return());
    }
    
    #[test]
    fn test_runestone_with_etching() {
        // Create a Runestone with an etching
        let runestone = Runestone {
            edicts: vec![],
            etching: Some(Etching {
                rune: 123456789,
                symbol: Some("TEST".to_string()),
                decimals: Some(8),
                spacers: 0,
                amount: 21000000,
                terms: None,
            }),
            default_output: None,
            burn: false,
        };
        
        // Serialize the Runestone
        let mut data = Vec::new();
        data.extend_from_slice(b"RUNE");
        runestone.serialize_to(&mut data);
        
        // Parse the Runestone
        let parsed = parse_runestone_data(&data[4..]).unwrap();
        
        // Check that the parsed Runestone matches the original
        assert_eq!(parsed, runestone);
    }
}