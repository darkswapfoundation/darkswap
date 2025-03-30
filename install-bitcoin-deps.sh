#!/bin/bash

# Install Bitcoin, Runes, and Alkanes related dependencies
echo "Installing Bitcoin, Runes, and Alkanes related dependencies..."
npm install bitcoinjs-lib tiny-secp256k1 bip32 ecpair bip39 @scure/bip39

# Install other dependencies
echo "Installing other dependencies..."
npm install

echo "Done! You can now run the application with 'npm start'"
echo "Note: For full Runes and Alkanes functionality, you'll need to connect to a Bitcoin node with Runes and Alkanes support."