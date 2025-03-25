use darkswap_sdk::bitcoin_utils::{self, Keypair};
use bitcoin::{
    Address, Network, PrivateKey, PublicKey,
    psbt::{Psbt, KeyRequest},
    secp256k1::{Secp256k1, SecretKey, Signing},
};
use std::str::FromStr;

#[test]
fn test_keypair_creation() {
    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&[0; 32]).unwrap();
    let public_key = PublicKey::from_secret_key(&secp, &secret_key);
    
    let keypair = Keypair {
        secret_key,
        public_key,
    };
    
    assert_eq!(keypair.public_key, public_key);
}

#[test]
fn test_get_key() {
    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&[0; 32]).unwrap();
    let public_key = PublicKey::from_secret_key(&secp, &secret_key);
    
    let keypair = Keypair {
        secret_key,
        public_key,
    };
    
    let key_request = KeyRequest::Pubkey(public_key.inner);
    let result = (&keypair).get_key(key_request, &secp);
    
    assert!(result.is_ok());
    let private_key_option = result.unwrap();
    assert!(private_key_option.is_some());
    
    let private_key = private_key_option.unwrap();
    assert_eq!(private_key.to_bytes(), secret_key.secret_bytes());
}