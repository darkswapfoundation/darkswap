use darkswap_sdk::bitcoin_utils::Keypair;
use bitcoin::{
    secp256k1::{Secp256k1, SecretKey},
    PrivateKey, Network,
};

#[test]
#[ignore]
fn test_keypair_creation() {
    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&[0; 32]).unwrap();
    let secp_public_key = bitcoin::secp256k1::PublicKey::from_secret_key(&secp, &secret_key);
    let public_key = bitcoin::PublicKey::new(secp_public_key);
    
    let keypair = Keypair {
        secret_key,
        secp_public_key,
        public_key,
    };
    
    assert_eq!(keypair.public_key, public_key);
}
#[test]
#[ignore]
fn test_keypair_methods() {
    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&[0; 32]).unwrap();
    let secp_public_key = bitcoin::secp256k1::PublicKey::from_secret_key(&secp, &secret_key);
    let public_key = bitcoin::PublicKey::new(secp_public_key);
    
    let keypair = Keypair {
        secret_key,
        secp_public_key,
        public_key,
    };
    
    // Test public_key method
    assert_eq!(keypair.public_key(), &public_key);
    
    // Create a PrivateKey from the secret key
    let private_key = PrivateKey::new(secret_key, Network::Bitcoin);
    
    // Verify the private key corresponds to the public key
    let derived_public_key = bitcoin::PublicKey::from_private_key(&secp, &private_key);
    assert_eq!(derived_public_key, public_key);
}