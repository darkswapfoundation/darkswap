use darkswap_sdk::bitcoin_utils::Keypair;
use bitcoin::{
    psbt::{KeyRequest, GetKey},
    secp256k1::{Secp256k1, SecretKey},
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
fn test_get_key() {
    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&[0; 32]).unwrap();
    let secp_public_key = bitcoin::secp256k1::PublicKey::from_secret_key(&secp, &secret_key);
    let public_key = bitcoin::PublicKey::new(secp_public_key);
    
    let keypair = Keypair {
        secret_key,
        secp_public_key,
        public_key,
    };
    
    let key_request = KeyRequest::Pubkey(public_key);
    let result = (&keypair).get_key(key_request, &secp);
    
    assert!(result.is_ok());
    let private_key_option = result.unwrap();
    assert!(private_key_option.is_some());
    
    let private_key = private_key_option.unwrap();
    assert_eq!(private_key.to_bytes(), secret_key.secret_bytes());
}