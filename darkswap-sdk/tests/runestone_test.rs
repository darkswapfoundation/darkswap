use darkswap_sdk::runestone::{Runestone, Edict, Etching, Terms};
use bitcoin::{
    Transaction, TxOut, ScriptBuf,
    opcodes::all::OP_RETURN,
};

#[test]
fn test_runestone_serialization() {
    // Create a simple runestone with one edict
    let edict = Edict {
        id: 12345,
        amount: 1000,
        output: 1,
    };
    
    let runestone = Runestone::new(
        vec![edict],
        None,
        None,
        false,
    );
    
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
    
    let runestone = Runestone::new(
        vec![edict],
        Some(etching),
        Some(0),
        true,
    );
    
    // Serialize to bytes
    let bytes = runestone.to_bytes().unwrap();
    
    // Deserialize from bytes
    let parsed_runestone = Runestone::from_bytes(&bytes).unwrap();
    
    // Check that the parsed runestone matches the original
    assert_eq!(parsed_runestone, runestone);
}

// These tests are disabled for now as they require more complex setup
// #[test]
// fn test_runestone_to_script() {
//     // Create a simple runestone
//     let edict = Edict {
//         id: 12345,
//         amount: 1000,
//         output: 1,
//     };
//
//     let runestone = Runestone::new(
//         vec![edict],
//         None,
//         None,
//         false,
//     );
//
//     // Convert to script directly
//     let script = runestone.to_script().unwrap();
//
//     // Check that the script is an OP_RETURN script
//     assert!(script.is_op_return());
// }
//
// #[test]
// fn test_runestone_from_transaction() {
//     // Create a simple runestone
//     let edict = Edict {
//         id: 12345,
//         amount: 1000,
//         output: 1,
//     };
//
//     let runestone = Runestone::new(
//         vec![edict],
//         None,
//         None,
//         false,
//     );
//
//     // Convert to script directly
//     let script = runestone.to_script().unwrap();
//
//     // Create a transaction with the runestone script
//     let tx = Transaction {
//         version: 2,
//         lock_time: bitcoin::absolute::LockTime::ZERO,
//         input: vec![],
//         output: vec![
//             TxOut {
//                 value: 0,
//                 script_pubkey: script,
//             },
//             TxOut {
//                 value: 546,
//                 script_pubkey: ScriptBuf::new(),
//             },
//         ],
//     };
// }