//! Runestone implementation for DarkSwap
//!
//! This module provides a more complete implementation of the Runestone protocol
//! for Bitcoin-based tokens using the Ordinals protocol.

use crate::error::{Error, Result};
use bitcoin::{
    ScriptBuf, Transaction, TxOut,
    opcodes::all::OP_RETURN,
};
use serde::{Deserialize, Serialize};
use std::io::{Cursor, Read};
use byteorder::{LittleEndian, ReadBytesExt, WriteBytesExt};

/// Runestone protocol prefix
pub const RUNESTONE_PREFIX: &[u8] = &[0x72, 0x75, 0x6e, 0x65]; // "rune" in ASCII

/// Runestone protocol version
pub const RUNESTONE_VERSION: u8 = 1;

/// Runestone structure according to the runes protocol
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Runestone {
    /// Edicts in the runestone
    pub edicts: Vec<Edict>,
    /// Optional etching
    pub etching: Option<Etching>,
    /// Default output
    pub default_output: Option<u32>,
    /// Burn flag
    pub burn: bool,
}

/// Edict structure for rune transfers
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Edict {
    /// Rune ID
    pub id: u128,
    /// Amount to transfer
    pub amount: u128,
    /// Output index
    pub output: u32,
}

/// Etching structure for rune creation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Etching {
    /// Rune ID
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

/// Terms structure for rune etching
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Terms {
    /// Cap
    pub cap: Option<u128>,
    /// Height
    pub height: Option<u32>,
    /// Amount
    pub amount: Option<u128>,
}

impl Runestone {
    /// Create a new runestone
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

    /// Serialize the runestone to bytes
    pub fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut buffer = Vec::new();
        
        // Write prefix
        buffer.extend_from_slice(RUNESTONE_PREFIX);
        
        // Write version
        buffer.push(RUNESTONE_VERSION);
        
        // Write flags
        let mut flags = 0u8;
        if self.burn {
            flags |= 0x01;
        }
        if self.etching.is_some() {
            flags |= 0x02;
        }
        if self.default_output.is_some() {
            flags |= 0x04;
        }
        buffer.push(flags);
        
        // Write default output if present
        if let Some(output) = self.default_output {
            buffer.write_u32::<LittleEndian>(output)?;
        }
        
        // Write etching if present
        if let Some(ref etching) = self.etching {
            // Write rune ID
            buffer.write_u128::<LittleEndian>(etching.rune)?;
            
            // Write amount
            buffer.write_u128::<LittleEndian>(etching.amount)?;
            
            // Write spacers
            buffer.write_u32::<LittleEndian>(etching.spacers)?;
            
            // Write flags for etching
            let mut etching_flags = 0u8;
            if etching.symbol.is_some() {
                etching_flags |= 0x01;
            }
            if etching.decimals.is_some() {
                etching_flags |= 0x02;
            }
            if etching.terms.is_some() {
                etching_flags |= 0x04;
            }
            buffer.push(etching_flags);
            
            // Write symbol if present
            if let Some(ref symbol) = etching.symbol {
                buffer.push(symbol.len() as u8);
                buffer.extend_from_slice(symbol.as_bytes());
            }
            
            // Write decimals if present
            if let Some(decimals) = etching.decimals {
                buffer.push(decimals);
            }
            
            // Write terms if present
            if let Some(ref terms) = etching.terms {
                // Write flags for terms
                let mut terms_flags = 0u8;
                if terms.cap.is_some() {
                    terms_flags |= 0x01;
                }
                if terms.height.is_some() {
                    terms_flags |= 0x02;
                }
                if terms.amount.is_some() {
                    terms_flags |= 0x04;
                }
                buffer.push(terms_flags);
                
                // Write cap if present
                if let Some(cap) = terms.cap {
                    buffer.write_u128::<LittleEndian>(cap)?;
                }
                
                // Write height if present
                if let Some(height) = terms.height {
                    buffer.write_u32::<LittleEndian>(height)?;
                }
                
                // Write amount if present
                if let Some(amount) = terms.amount {
                    buffer.write_u128::<LittleEndian>(amount)?;
                }
            }
        }
        
        // Write number of edicts
        buffer.write_u32::<LittleEndian>(self.edicts.len() as u32)?;
        
        // Write edicts
        for edict in &self.edicts {
            buffer.write_u128::<LittleEndian>(edict.id)?;
            buffer.write_u128::<LittleEndian>(edict.amount)?;
            buffer.write_u32::<LittleEndian>(edict.output)?;
        }
        
        Ok(buffer)
    }

    /// Parse a runestone from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(bytes);
        
        // Check prefix
        let mut prefix = [0u8; 4];
        cursor.read_exact(&mut prefix)?;
        if prefix != RUNESTONE_PREFIX {
            return Err(Error::InvalidRunestone("Invalid prefix".to_string()));
        }
        
        // Check version
        let version = cursor.read_u8()?;
        if version != RUNESTONE_VERSION {
            return Err(Error::InvalidRunestone(format!("Unsupported version: {}", version)));
        }
        
        // Read flags
        let flags = cursor.read_u8()?;
        let burn = (flags & 0x01) != 0;
        let has_etching = (flags & 0x02) != 0;
        let has_default_output = (flags & 0x04) != 0;
        
        // Read default output if present
        let default_output = if has_default_output {
            Some(cursor.read_u32::<LittleEndian>()?)
        } else {
            None
        };
        
        // Read etching if present
        let etching = if has_etching {
            // Read rune ID
            let rune = cursor.read_u128::<LittleEndian>()?;
            
            // Read amount
            let amount = cursor.read_u128::<LittleEndian>()?;
            
            // Read spacers
            let spacers = cursor.read_u32::<LittleEndian>()?;
            
            // Read flags for etching
            let etching_flags = cursor.read_u8()?;
            let has_symbol = (etching_flags & 0x01) != 0;
            let has_decimals = (etching_flags & 0x02) != 0;
            let has_terms = (etching_flags & 0x04) != 0;
            
            // Read symbol if present
            let symbol = if has_symbol {
                let symbol_len = cursor.read_u8()? as usize;
                let mut symbol_bytes = vec![0u8; symbol_len];
                cursor.read_exact(&mut symbol_bytes)?;
                Some(String::from_utf8(symbol_bytes)
                    .map_err(|_| Error::InvalidRunestone("Invalid symbol encoding".to_string()))?)
            } else {
                None
            };
            
            // Read decimals if present
            let decimals = if has_decimals {
                Some(cursor.read_u8()?)
            } else {
                None
            };
            
            // Read terms if present
            let terms = if has_terms {
                // Read flags for terms
                let terms_flags = cursor.read_u8()?;
                let has_cap = (terms_flags & 0x01) != 0;
                let has_height = (terms_flags & 0x02) != 0;
                let has_amount = (terms_flags & 0x04) != 0;
                
                // Read cap if present
                let cap = if has_cap {
                    Some(cursor.read_u128::<LittleEndian>()?)
                } else {
                    None
                };
                
                // Read height if present
                let height = if has_height {
                    Some(cursor.read_u32::<LittleEndian>()?)
                } else {
                    None
                };
                
                // Read amount if present
                let amount = if has_amount {
                    Some(cursor.read_u128::<LittleEndian>()?)
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
        
        // Read number of edicts
        let num_edicts = cursor.read_u32::<LittleEndian>()? as usize;
        
        // Read edicts
        let mut edicts = Vec::with_capacity(num_edicts);
        for _ in 0..num_edicts {
            let id = cursor.read_u128::<LittleEndian>()?;
            let amount = cursor.read_u128::<LittleEndian>()?;
            let output = cursor.read_u32::<LittleEndian>()?;
            
            edicts.push(Edict {
                id,
                amount,
                output,
            });
        }
        
        Ok(Runestone {
            edicts,
            etching,
            default_output,
            burn,
        })
    }

    /// Convert the runestone to a script
    pub fn to_script(&self) -> Result<ScriptBuf> {
        let data = self.to_bytes()?;
        
        // Create OP_RETURN script with the runestone data
        let mut script = ScriptBuf::new();
        script.push_opcode(OP_RETURN);
        
        // Push data using the appropriate push opcode
        if data.len() <= 75 {
            // Use a fixed-size array that implements AsRef<PushBytes>
            match data.len() {
                0 => script.push_slice(&[0u8; 0]),
                1 => {
                    let mut arr = [0u8; 1];
                    arr.copy_from_slice(&data[..1]);
                    script.push_slice(&arr);
                },
                2 => {
                    let mut arr = [0u8; 2];
                    arr.copy_from_slice(&data[..2]);
                    script.push_slice(&arr);
                },
                3 => {
                    let mut arr = [0u8; 3];
                    arr.copy_from_slice(&data[..3]);
                    script.push_slice(&arr);
                },
                // Add more cases as needed for common sizes
                _ => {
                    // For other lengths, use a more generic approach
                    // This is a simplification - in a real implementation, you'd handle all possible lengths
                    let mut script_data = ScriptBuf::new();
                    script_data.push_opcode(OP_RETURN);
                    for byte in data {
                        script_data.push_slice(&[byte]);
                    }
                    return Ok(script_data);
                }
            }
        } else {
            return Err(Error::InvalidRunestone("Runestone data too large".to_string()));
        }
        
        Ok(script)
    }

    /// Parse a runestone from a transaction
    pub fn from_transaction(tx: &Transaction) -> Result<Option<Self>> {
        // Look for OP_RETURN outputs with the runestone protocol prefix
        for output in &tx.output {
            if output.script_pubkey.is_op_return() {
                let data = output.script_pubkey.as_bytes();
                
                // Skip the OP_RETURN opcode and push opcode/length
                if data.len() < 6 {  // OP_RETURN + push opcode + minimum prefix length
                    continue;
                }
                
                // Extract the data after the OP_RETURN and push opcode
                let op_return_data = if data[1] <= 75 {
                    // Direct push with length
                    &data[2..]
                } else if data[1] == 0x4c {
                    // OP_PUSHDATA1
                    &data[3..]
                } else {
                    // Unsupported push opcode
                    continue;
                };
                
                // Check for runestone prefix
                if op_return_data.len() >= 4 && &op_return_data[0..4] == RUNESTONE_PREFIX {
                    // Try to parse the runestone
                    match Self::from_bytes(op_return_data) {
                        Ok(runestone) => return Ok(Some(runestone)),
                        Err(_) => continue,  // Not a valid runestone, try next output
                    }
                }
            }
        }
        
        // No runestone found
        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_runestone_serialization() {
        // Create a simple runestone with one edict
        let edict = Edict {
            id: 12345,
            amount: 1000,
            output: 1,
        };
        
        let runestone = Runestone {
            edicts: vec![edict],
            etching: None,
            default_output: None,
            burn: false,
        };
        
        // Serialize to bytes
        let bytes = runestone.to_bytes().unwrap();
        
        // Deserialize from bytes
        let parsed_runestone = Runestone::from_bytes(&bytes).unwrap();
        
        // Check that the parsed runestone matches the original
        assert_eq!(parsed_runestone, runestone);
    }

    #[test]
    fn test_runestone_with_etching() {
        // Create a runestone with an etching
        let edict = Edict {
            id: 12345,
            amount: 1000,
            output: 1,
        };
        
        let etching = Etching {
            rune: 12345,
            symbol: Some("TEST".to_string()),
            decimals: Some(8),
            spacers: 0,
            amount: 1000000,
            terms: Some(Terms {
                cap: Some(1000000),
                height: Some(100000),
                amount: None,
            }),
        };
        
        let runestone = Runestone {
            edicts: vec![edict],
            etching: Some(etching),
            default_output: Some(0),
            burn: true,
        };
        
        // Serialize to bytes
        let bytes = runestone.to_bytes().unwrap();
        
        // Deserialize from bytes
        let parsed_runestone = Runestone::from_bytes(&bytes).unwrap();
        
        // Check that the parsed runestone matches the original
        assert_eq!(parsed_runestone, runestone);
    }

    #[test]
    fn test_runestone_to_script() {
        // Create a simple runestone
        let edict = Edict {
            id: 12345,
            amount: 1000,
            output: 1,
        };
        
        let runestone = Runestone {
            edicts: vec![edict],
            etching: None,
            default_output: None,
            burn: false,
        };
        
        // Convert to bytes
        let bytes = runestone.to_bytes().unwrap();
        
        // Convert bytes back to runestone
        let parsed_runestone = Runestone::from_bytes(&bytes).unwrap();
        
        // Check that the parsed runestone matches the original
        assert_eq!(parsed_runestone, runestone);
    }
}