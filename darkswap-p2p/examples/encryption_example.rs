use darkswap_p2p::{
    encryption::{EncryptionConfig, EncryptionManager, KeyExchangeAlgorithm, EncryptionAlgorithm},
    error::Error,
};
use libp2p::PeerId;
use std::{
    sync::Arc,
    time::Duration,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();
    
    println!("Starting encryption example");
    
    // Create peer IDs
    let alice_id = PeerId::random();
    let bob_id = PeerId::random();
    
    println!("Alice's peer ID: {}", alice_id);
    println!("Bob's peer ID: {}", bob_id);
    
    // Create encryption configuration
    let config = EncryptionConfig {
        key_exchange_algorithm: KeyExchangeAlgorithm::X25519,
        encryption_algorithm: EncryptionAlgorithm::AesGcm256,
        key_rotation_interval: Duration::from_secs(3600),
        use_forward_secrecy: true,
        use_ephemeral_keys: true,
    };
    
    // Create encryption managers for Alice and Bob
    println!("\nCreating encryption managers...");
    let alice_encryption_manager = EncryptionManager::new(config.clone())?;
    let bob_encryption_manager = EncryptionManager::new(config)?;
    
    // Generate ephemeral key pairs
    println!("\nGenerating ephemeral key pairs...");
    let alice_public_key = alice_encryption_manager.generate_ephemeral_key_pair(&bob_id)?;
    let bob_public_key = bob_encryption_manager.generate_ephemeral_key_pair(&alice_id)?;
    
    println!("Alice's public key: {:?}", alice_public_key);
    println!("Bob's public key: {:?}", bob_public_key);
    
    // Perform key exchange
    println!("\nPerforming key exchange...");
    alice_encryption_manager.perform_key_exchange(&bob_id, &bob_public_key)?;
    bob_encryption_manager.perform_key_exchange(&alice_id, &alice_public_key)?;
    
    // Alice encrypts a message for Bob
    let plaintext = b"Hello, Bob! This is a secret message from Alice.";
    println!("\nAlice's plaintext message: {}", String::from_utf8_lossy(plaintext));
    
    println!("\nAlice encrypts the message for Bob...");
    let ciphertext = alice_encryption_manager.encrypt(&bob_id, plaintext)?;
    println!("Ciphertext: {:?}", ciphertext);
    
    // Bob decrypts the message from Alice
    println!("\nBob decrypts the message from Alice...");
    let decrypted = bob_encryption_manager.decrypt(&alice_id, &ciphertext)?;
    println!("Decrypted message: {}", String::from_utf8_lossy(&decrypted));
    
    // Verify that the decrypted message matches the original plaintext
    assert_eq!(plaintext, decrypted.as_slice());
    println!("\nVerification successful: Decrypted message matches original plaintext");
    
    // Bob encrypts a response for Alice
    let response_plaintext = b"Hello, Alice! I received your secret message. This is Bob's response.";
    println!("\nBob's plaintext response: {}", String::from_utf8_lossy(response_plaintext));
    
    println!("\nBob encrypts the response for Alice...");
    let response_ciphertext = bob_encryption_manager.encrypt(&alice_id, response_plaintext)?;
    println!("Response ciphertext: {:?}", response_ciphertext);
    
    // Alice decrypts the response from Bob
    println!("\nAlice decrypts the response from Bob...");
    let response_decrypted = alice_encryption_manager.decrypt(&bob_id, &response_ciphertext)?;
    println!("Decrypted response: {}", String::from_utf8_lossy(&response_decrypted));
    
    // Verify that the decrypted response matches the original response plaintext
    assert_eq!(response_plaintext, response_decrypted.as_slice());
    println!("\nVerification successful: Decrypted response matches original response plaintext");
    
    // Demonstrate key rotation
    println!("\nDemonstrating key rotation...");
    println!("Waiting for 2 seconds...");
    tokio::time::sleep(Duration::from_secs(2)).await;
    
    println!("Rotating keys...");
    alice_encryption_manager.rotate_keys()?;
    bob_encryption_manager.rotate_keys()?;
    
    // Generate new ephemeral key pairs
    println!("\nGenerating new ephemeral key pairs...");
    let alice_public_key = alice_encryption_manager.generate_ephemeral_key_pair(&bob_id)?;
    let bob_public_key = bob_encryption_manager.generate_ephemeral_key_pair(&alice_id)?;
    
    // Perform key exchange again
    println!("\nPerforming key exchange again...");
    alice_encryption_manager.perform_key_exchange(&bob_id, &bob_public_key)?;
    bob_encryption_manager.perform_key_exchange(&alice_id, &alice_public_key)?;
    
    // Alice encrypts another message for Bob
    let plaintext2 = b"Hello again, Bob! This is another secret message from Alice after key rotation.";
    println!("\nAlice's new plaintext message: {}", String::from_utf8_lossy(plaintext2));
    
    println!("\nAlice encrypts the new message for Bob...");
    let ciphertext2 = alice_encryption_manager.encrypt(&bob_id, plaintext2)?;
    println!("New ciphertext: {:?}", ciphertext2);
    
    // Bob decrypts the new message from Alice
    println!("\nBob decrypts the new message from Alice...");
    let decrypted2 = bob_encryption_manager.decrypt(&alice_id, &ciphertext2)?;
    println!("Decrypted new message: {}", String::from_utf8_lossy(&decrypted2));
    
    // Verify that the decrypted message matches the original plaintext
    assert_eq!(plaintext2, decrypted2.as_slice());
    println!("\nVerification successful: Decrypted new message matches original new plaintext");
    
    // Demonstrate pruning expired keys
    println!("\nDemonstrating pruning expired keys...");
    alice_encryption_manager.prune_expired_keys();
    bob_encryption_manager.prune_expired_keys();
    println!("Expired keys pruned successfully");
    
    println!("\nEncryption example completed successfully");
    
    Ok(())
}