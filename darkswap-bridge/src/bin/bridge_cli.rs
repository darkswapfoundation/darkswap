//! Command-line interface for the DarkSwap bridge.
//!
//! This binary provides a command-line interface for interacting with the bridge.

use anyhow::Result;
use darkswap_bridge::{
    BridgeClient, BridgeError, BridgeMessage, NetworkMessage, SystemMessage, WalletMessage,
};
use log::{debug, error, info, warn};
use std::env;
use std::io::{self, BufRead, Write};
use std::process::exit;
use std::thread;
use std::time::Duration;

fn main() -> Result<(), BridgeError> {
    // Initialize logging
    env_logger::init();

    // Create bridge client
    let mut client = BridgeClient::new()?;

    info!("Bridge CLI started");

    // Start a thread to receive messages from the bridge
    let receiver_thread = thread::spawn(move || {
        loop {
            match client.receive() {
                Ok(message) => {
                    println!("Received message: {:?}", message);
                }
                Err(e) => {
                    error!("Error receiving message: {}", e);
                    break;
                }
            }
        }
    });

    // Main loop
    let stdin = io::stdin();
    let mut stdout = io::stdout();
    loop {
        print!("> ");
        stdout.flush().unwrap();

        let mut line = String::new();
        stdin.lock().read_line(&mut line).unwrap();
        let line = line.trim();

        if line.is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        let command = parts[0];

        match command {
            "help" => {
                println!("Available commands:");
                println!("  help                                  - Show this help message");
                println!("  exit                                  - Exit the CLI");
                println!("  wallet create <name> <passphrase>     - Create a new wallet");
                println!("  wallet open <name> <passphrase>       - Open an existing wallet");
                println!("  wallet close <name>                   - Close a wallet");
                println!("  wallet balance <name>                 - Get the balance of a wallet");
                println!("  wallet address <name>                 - Create a new address");
                println!("  wallet send <name> <recipient> <amount> <fee_rate> - Create and send a transaction");
                println!("  network connect <address>             - Connect to a peer");
                println!("  network disconnect <address>          - Disconnect from a peer");
                println!("  network send <address> <message>      - Send a message to a peer");
                println!("  network broadcast <message>           - Broadcast a message to all peers");
                println!("  network peers                         - Get the list of connected peers");
                println!("  system ping                           - Ping the system");
            }
            "exit" => {
                info!("Exiting CLI");
                break;
            }
            "wallet" => {
                if parts.len() < 2 {
                    println!("Error: Missing wallet subcommand");
                    continue;
                }

                let subcommand = parts[1];
                match subcommand {
                    "create" => {
                        if parts.len() < 4 {
                            println!("Error: Missing wallet name or passphrase");
                            continue;
                        }

                        let name = parts[2].to_string();
                        let passphrase = parts[3].to_string();

                        let message = BridgeMessage::Wallet(WalletMessage::CreateWallet {
                            name,
                            passphrase,
                        });
                        client.send_to_wallet(message)?;
                    }
                    "open" => {
                        if parts.len() < 4 {
                            println!("Error: Missing wallet name or passphrase");
                            continue;
                        }

                        let name = parts[2].to_string();
                        let passphrase = parts[3].to_string();

                        let message = BridgeMessage::Wallet(WalletMessage::OpenWallet {
                            name,
                            passphrase,
                        });
                        client.send_to_wallet(message)?;
                    }
                    "close" => {
                        if parts.len() < 3 {
                            println!("Error: Missing wallet name");
                            continue;
                        }

                        let name = parts[2].to_string();

                        let message = BridgeMessage::Wallet(WalletMessage::CloseWallet { name });
                        client.send_to_wallet(message)?;
                    }
                    "balance" => {
                        if parts.len() < 3 {
                            println!("Error: Missing wallet name");
                            continue;
                        }

                        let name = parts[2].to_string();

                        let message = BridgeMessage::Wallet(WalletMessage::GetBalance { name });
                        client.send_to_wallet(message)?;
                    }
                    "address" => {
                        if parts.len() < 3 {
                            println!("Error: Missing wallet name");
                            continue;
                        }

                        let name = parts[2].to_string();

                        let message = BridgeMessage::Wallet(WalletMessage::CreateAddress { name });
                        client.send_to_wallet(message)?;
                    }
                    "send" => {
                        if parts.len() < 6 {
                            println!("Error: Missing parameters");
                            continue;
                        }

                        let name = parts[2].to_string();
                        let recipient = parts[3].to_string();
                        let amount = parts[4].parse::<u64>().unwrap_or(0);
                        let fee_rate = parts[5].parse::<u64>().unwrap_or(0);

                        let message = BridgeMessage::Wallet(WalletMessage::CreateTransaction {
                            name,
                            recipient,
                            amount,
                            fee_rate,
                        });
                        client.send_to_wallet(message)?;
                    }
                    _ => {
                        println!("Error: Unknown wallet subcommand: {}", subcommand);
                    }
                }
            }
            "network" => {
                if parts.len() < 2 {
                    println!("Error: Missing network subcommand");
                    continue;
                }

                let subcommand = parts[1];
                match subcommand {
                    "connect" => {
                        if parts.len() < 3 {
                            println!("Error: Missing peer address");
                            continue;
                        }

                        let address = parts[2].to_string();

                        let message = BridgeMessage::Network(NetworkMessage::Connect { address });
                        client.send_to_network(message)?;
                    }
                    "disconnect" => {
                        if parts.len() < 3 {
                            println!("Error: Missing peer address");
                            continue;
                        }

                        let address = parts[2].to_string();

                        let message = BridgeMessage::Network(NetworkMessage::Disconnect { address });
                        client.send_to_network(message)?;
                    }
                    "send" => {
                        if parts.len() < 4 {
                            println!("Error: Missing peer address or message");
                            continue;
                        }

                        let address = parts[2].to_string();
                        let message_text = parts[3..].join(" ");

                        let message = BridgeMessage::Network(NetworkMessage::SendMessage {
                            address,
                            message: message_text.as_bytes().to_vec(),
                        });
                        client.send_to_network(message)?;
                    }
                    "broadcast" => {
                        if parts.len() < 3 {
                            println!("Error: Missing message");
                            continue;
                        }

                        let message_text = parts[2..].join(" ");

                        let message = BridgeMessage::Network(NetworkMessage::BroadcastMessage {
                            message: message_text.as_bytes().to_vec(),
                        });
                        client.send_to_network(message)?;
                    }
                    "peers" => {
                        let message = BridgeMessage::Network(NetworkMessage::GetPeers);
                        client.send_to_network(message)?;
                    }
                    _ => {
                        println!("Error: Unknown network subcommand: {}", subcommand);
                    }
                }
            }
            "system" => {
                if parts.len() < 2 {
                    println!("Error: Missing system subcommand");
                    continue;
                }

                let subcommand = parts[1];
                match subcommand {
                    "ping" => {
                        let message = BridgeMessage::System(SystemMessage::Ping);
                        client.send_to_wallet(message.clone())?;
                        client.send_to_network(message)?;
                    }
                    _ => {
                        println!("Error: Unknown system subcommand: {}", subcommand);
                    }
                }
            }
            _ => {
                println!("Error: Unknown command: {}", command);
            }
        }
    }

    // Shutdown the bridge client
    client.shutdown()?;

    // Wait for the receiver thread to exit
    let _ = receiver_thread.join();

    Ok(())
}