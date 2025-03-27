use darkswap_sdk::runestone::{Runestone, Edict, Etching, Terms};
use bitcoin::{
    Transaction, TxOut, ScriptBuf,
    opcodes::all::OP_RETURN,
};
use darkswap_sdk::error::Result;

#[test]
fn test_runestone_creation() -> Result<()> {
    // Create a runestone
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
    
    // Convert to script
    let script = runestone.to_script();
    
    // Check that it's an OP_RETURN script
    assert!(script.is_op_return());
    
    Ok(())
}

#[test]
fn test_runestone_with_etching() -> Result<()> {
    // Create a runestone with an etching
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
    
    // Convert to script
    let script = runestone.to_script();
    
    // Check that it's an OP_RETURN script
    assert!(script.is_op_return());
    
    Ok(())
}

#[test]
fn test_runestone_with_terms() -> Result<()> {
    // Create a runestone with an etching and terms
    let runestone = Runestone {
        edicts: vec![],
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
        default_output: None,
        burn: false,
    };
    
    // Convert to script
    let script = runestone.to_script();
    
    // Check that it's an OP_RETURN script
    assert!(script.is_op_return());
    
    Ok(())
}

#[test]
fn test_runestone_parsing() -> Result<()> {
    // Create a runestone
    let original_runestone = Runestone {
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
    
    // Create a transaction with the runestone
    let script = original_runestone.to_script();
    
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            TxOut {
                value: 0,
                script_pubkey: script,
            },
        ],
    };
    
    // Parse the runestone from the transaction
    let parsed_runestone = Runestone::parse(&tx).unwrap();
    
    // Check that the parsed runestone matches the original
    assert_eq!(parsed_runestone.edicts.len(), 1);
    assert_eq!(parsed_runestone.edicts[0].id, 123456789);
    assert_eq!(parsed_runestone.edicts[0].amount, 1000000000);
    assert_eq!(parsed_runestone.edicts[0].output, 1);
    assert_eq!(parsed_runestone.etching, None);
    assert_eq!(parsed_runestone.default_output, None);
    assert_eq!(parsed_runestone.burn, false);
    
    Ok(())
}

#[test]
fn test_runestone_with_etching_parsing() -> Result<()> {
    // Create a runestone with an etching
    let original_runestone = Runestone {
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
    
    // Create a transaction with the runestone
    let script = original_runestone.to_script();
    
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            TxOut {
                value: 0,
                script_pubkey: script,
            },
        ],
    };
    
    // Parse the runestone from the transaction
    let parsed_runestone = Runestone::parse(&tx).unwrap();
    
    // Check that the parsed runestone matches the original
    assert_eq!(parsed_runestone.edicts.len(), 0);
    assert!(parsed_runestone.etching.is_some());
    let etching = parsed_runestone.etching.unwrap();
    assert_eq!(etching.rune, 123456789);
    assert_eq!(etching.symbol, Some("TEST".to_string()));
    assert_eq!(etching.decimals, Some(8));
    assert_eq!(etching.spacers, 0);
    assert_eq!(etching.amount, 21000000);
    assert!(etching.terms.is_none());
    assert_eq!(parsed_runestone.default_output, None);
    assert_eq!(parsed_runestone.burn, false);
    
    Ok(())
}

#[test]
fn test_runestone_with_terms_parsing() -> Result<()> {
    // Create a runestone with an etching and terms
    let original_runestone = Runestone {
        edicts: vec![],
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
        default_output: None,
        burn: false,
    };
    
    // Create a transaction with the runestone
    let script = original_runestone.to_script();
    
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            TxOut {
                value: 0,
                script_pubkey: script,
            },
        ],
    };
    
    // Parse the runestone from the transaction
    let parsed_runestone = Runestone::parse(&tx).unwrap();
    
    // Check that the parsed runestone matches the original
    assert_eq!(parsed_runestone.edicts.len(), 0);
    assert!(parsed_runestone.etching.is_some());
    let etching = parsed_runestone.etching.unwrap();
    assert_eq!(etching.rune, 123456789);
    assert_eq!(etching.symbol, Some("TEST".to_string()));
    assert_eq!(etching.decimals, Some(8));
    assert_eq!(etching.spacers, 0);
    assert_eq!(etching.amount, 21000000);
    assert!(etching.terms.is_some());
    let terms = etching.terms.unwrap();
    assert_eq!(terms.cap, Some(21000000));
    assert_eq!(terms.height, Some(100000));
    assert_eq!(terms.amount, Some(10000));
    assert_eq!(parsed_runestone.default_output, None);
    assert_eq!(parsed_runestone.burn, false);
    
    Ok(())
}

#[test]
fn test_runestone_with_default_output() -> Result<()> {
    // Create a runestone with a default output
    let original_runestone = Runestone {
        edicts: vec![
            Edict {
                id: 123456789,
                amount: 1000000000,
                output: 1,
            },
        ],
        etching: None,
        default_output: Some(2),
        burn: false,
    };
    
    // Create a transaction with the runestone
    let script = original_runestone.to_script();
    
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            TxOut {
                value: 0,
                script_pubkey: script,
            },
        ],
    };
    
    // Parse the runestone from the transaction
    let parsed_runestone = Runestone::parse(&tx).unwrap();
    
    // Check that the parsed runestone matches the original
    assert_eq!(parsed_runestone.edicts.len(), 1);
    assert_eq!(parsed_runestone.edicts[0].id, 123456789);
    assert_eq!(parsed_runestone.edicts[0].amount, 1000000000);
    assert_eq!(parsed_runestone.edicts[0].output, 1);
    assert_eq!(parsed_runestone.etching, None);
    assert_eq!(parsed_runestone.default_output, Some(2));
    assert_eq!(parsed_runestone.burn, false);
    
    Ok(())
}

#[test]
fn test_runestone_with_burn() -> Result<()> {
    // Create a runestone with burn flag
    let original_runestone = Runestone {
        edicts: vec![
            Edict {
                id: 123456789,
                amount: 1000000000,
                output: 1,
            },
        ],
        etching: None,
        default_output: None,
        burn: true,
    };
    
    // Create a transaction with the runestone
    let script = original_runestone.to_script();
    
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            TxOut {
                value: 0,
                script_pubkey: script,
            },
        ],
    };
    
    // Parse the runestone from the transaction
    let parsed_runestone = Runestone::parse(&tx).unwrap();
    
    // Check that the parsed runestone matches the original
    assert_eq!(parsed_runestone.edicts.len(), 1);
    assert_eq!(parsed_runestone.edicts[0].id, 123456789);
    assert_eq!(parsed_runestone.edicts[0].amount, 1000000000);
    assert_eq!(parsed_runestone.edicts[0].output, 1);
    assert_eq!(parsed_runestone.etching, None);
    assert_eq!(parsed_runestone.default_output, None);
    assert_eq!(parsed_runestone.burn, true);
    
    Ok(())
}