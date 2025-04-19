#!/bin/bash

# Test script for DarkSwap P2P Network
# This script tests all aspects of the P2P network functionality

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set test parameters
TEST_TIMEOUT=30 # seconds
PEER_COUNT=3
MESSAGE_COUNT=10
RELAY_TEST=true
DIRECT_TEST=true
SIGNALING_TEST=true
STRESS_TEST=true
RECOVERY_TEST=true

# Function to print section header
print_header() {
    echo -e "\n${YELLOW}=======================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}=======================================${NC}\n"
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info message
print_info() {
    echo -e "ℹ $1"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    local missing_deps=false
    
    if ! command_exists curl; then
        print_error "curl is not installed"
        missing_deps=true
    else
        print_success "curl is installed"
    fi
    
    if ! command_exists jq; then
        print_error "jq is not installed"
        missing_deps=true
    else
        print_success "jq is installed"
    fi
    
    if ! command_exists netstat; then
        print_error "netstat is not installed"
        missing_deps=true
    else
        print_success "netstat is installed"
    fi
    
    if ! command_exists darkswap-cli; then
        print_error "darkswap-cli is not installed"
        missing_deps=true
    else
        print_success "darkswap-cli is installed"
    fi
    
    # Check optional dependencies
    if ! command_exists darkswap-relay; then
        print_warning "darkswap-relay is not installed (relay tests will be skipped)"
        RELAY_TEST=false
    else
        print_success "darkswap-relay is installed"
    fi
    
    if ! command_exists darkswap-signaling; then
        print_warning "darkswap-signaling is not installed (signaling tests will be skipped)"
        SIGNALING_TEST=false
    else
        print_success "darkswap-signaling is installed"
    fi
    
    if [ "$missing_deps" = true ]; then
        echo -e "\n${RED}Missing dependencies. Please install them and try again.${NC}"
        exit 1
    fi
}

# Check if services are running
check_services() {
    print_header "Checking Services"
    
    # Check if daemon is running
    if pgrep -f "darkswap-daemon" > /dev/null; then
        print_success "DarkSwap daemon is running"
    else
        print_error "DarkSwap daemon is not running"
        print_info "Starting DarkSwap daemon..."
        # Start the daemon without the --daemon flag
        nohup darkswap-daemon > /dev/null 2>&1 &
        sleep 5
        if pgrep -f "darkswap-daemon" > /dev/null; then
            print_success "DarkSwap daemon started successfully"
        else
            print_error "Failed to start DarkSwap daemon"
            exit 1
        fi
    fi
    
    # Check if relay server is running (if available)
    if command_exists darkswap-relay; then
        if pgrep -f "darkswap-relay" > /dev/null; then
            print_success "DarkSwap relay server is running"
        else
            print_error "DarkSwap relay server is not running"
            print_info "Starting DarkSwap relay server..."
            # Start the relay server
            nohup darkswap-relay > /dev/null 2>&1 &
            sleep 5
            if pgrep -f "darkswap-relay" > /dev/null; then
                print_success "DarkSwap relay server started successfully"
            else
                print_error "Failed to start DarkSwap relay server"
                RELAY_TEST=false
            fi
        fi
    else
        print_warning "DarkSwap relay server is not installed (relay tests will be skipped)"
        RELAY_TEST=false
    fi
    
    # Check if signaling server is running (if available)
    if command_exists darkswap-signaling; then
        if pgrep -f "darkswap-signaling" > /dev/null; then
            print_success "DarkSwap signaling server is running"
        else
            print_error "DarkSwap signaling server is not running"
            print_info "Starting DarkSwap signaling server..."
            # Start the signaling server
            nohup darkswap-signaling > /dev/null 2>&1 &
            sleep 5
            if pgrep -f "darkswap-signaling" > /dev/null; then
                print_success "DarkSwap signaling server started successfully"
            else
                print_error "Failed to start DarkSwap signaling server"
                SIGNALING_TEST=false
            fi
        fi
    else
        print_warning "DarkSwap signaling server is not installed (signaling tests will be skipped)"
        SIGNALING_TEST=false
    fi
}

# Test peer discovery
test_peer_discovery() {
    print_header "Testing Peer Discovery"
    
    # Test if darkswap-cli p2p discover command exists
    if ! darkswap-cli p2p discover --help > /dev/null 2>&1; then
        print_error "darkswap-cli p2p discover command not available"
        return
    fi
    
    # Test DHT-based discovery
    print_info "Testing DHT-based discovery..."
    local dht_result=$(darkswap-cli p2p discover --method dht --json 2>/dev/null || echo '{"peers": []}')
    local dht_peers=$(echo "$dht_result" | jq '.peers | length')
    if [ "$dht_peers" -gt 0 ]; then
        print_success "DHT-based discovery found $dht_peers peers"
    else
        print_error "DHT-based discovery found no peers"
    fi
    
    # Test relay-based discovery
    if [ "$RELAY_TEST" = true ]; then
        print_info "Testing relay-based discovery..."
        local relay_result=$(darkswap-cli p2p discover --method relay --json 2>/dev/null || echo '{"peers": []}')
        local relay_peers=$(echo "$relay_result" | jq '.peers | length')
        if [ "$relay_peers" -gt 0 ]; then
            print_success "Relay-based discovery found $relay_peers peers"
        else
            print_error "Relay-based discovery found no peers"
        fi
    else
        print_warning "Skipping relay-based discovery test (relay server not available)"
    fi
    
    # Test local network discovery
    print_info "Testing local network discovery..."
    local local_result=$(darkswap-cli p2p discover --method local --json 2>/dev/null || echo '{"peers": []}')
    local local_peers=$(echo "$local_result" | jq '.peers | length')
    print_info "Local network discovery found $local_peers peers"
    
    # Test combined discovery
    print_info "Testing combined discovery..."
    local combined_result=$(darkswap-cli p2p discover --json 2>/dev/null || echo '{"peers": []}')
    local combined_peers=$(echo "$combined_result" | jq '.peers | length')
    if [ "$combined_peers" -gt 0 ]; then
        print_success "Combined discovery found $combined_peers peers"
    else
        print_error "Combined discovery found no peers"
    fi
}

# Test direct connections
test_direct_connections() {
    if [ "$DIRECT_TEST" != true ]; then
        print_warning "Skipping direct connection tests"
        return
    fi
    
    print_header "Testing Direct Connections"
    
    # Test if darkswap-cli p2p connect command exists
    if ! darkswap-cli p2p connect --help > /dev/null 2>&1; then
        print_error "darkswap-cli p2p connect command not available"
        return
    fi
    
    # Get a list of peers
    local peers_result=$(darkswap-cli p2p discover --json 2>/dev/null || echo '{"peers": []}')
    local peers=$(echo "$peers_result" | jq -r '.peers[0:'"$PEER_COUNT"'] | .[].id // empty')
    
    if [ -z "$peers" ]; then
        print_error "No peers found for direct connection test"
        return
    fi
    
    # Test connecting to each peer
    for peer in $peers; do
        print_info "Testing direct connection to peer $peer..."
        local result=$(darkswap-cli p2p connect --peer-id "$peer" --timeout "$TEST_TIMEOUT" --json 2>/dev/null || echo '{"success": false}')
        local success=$(echo "$result" | jq -r '.success')
        local connection_type=$(echo "$result" | jq -r '.connectionType // "unknown"')
        
        if [ "$success" = "true" ] && [ "$connection_type" = "direct" ]; then
            print_success "Successfully established direct connection to peer $peer"
            
            # Test sending a message
            print_info "Testing message sending to peer $peer..."
            local message="Hello from test script at $(date)"
            local send_result=$(darkswap-cli p2p send --peer-id "$peer" --message "$message" --json 2>/dev/null || echo '{"success": false}')
            local send_success=$(echo "$send_result" | jq -r '.success')
            
            if [ "$send_success" = "true" ]; then
                print_success "Successfully sent message to peer $peer"
            else
                print_error "Failed to send message to peer $peer"
            fi
            
            # Disconnect from peer
            darkswap-cli p2p disconnect --peer-id "$peer" > /dev/null 2>&1
        else
            print_error "Failed to establish direct connection to peer $peer"
        fi
    done
}

# Test relay connections
test_relay_connections() {
    if [ "$RELAY_TEST" != true ]; then
        print_warning "Skipping relay connection tests"
        return
    fi
    
    print_header "Testing Relay Connections"
    
    # Test if darkswap-cli p2p connect command exists
    if ! darkswap-cli p2p connect --help > /dev/null 2>&1; then
        print_error "darkswap-cli p2p connect command not available"
        return
    fi
    
    # Get a list of peers
    local peers_result=$(darkswap-cli p2p discover --json 2>/dev/null || echo '{"peers": []}')
    local peers=$(echo "$peers_result" | jq -r '.peers[0:'"$PEER_COUNT"'] | .[].id // empty')
    
    if [ -z "$peers" ]; then
        print_error "No peers found for relay connection test"
        return
    fi
    
    # Test connecting to each peer via relay
    for peer in $peers; do
        print_info "Testing relay connection to peer $peer..."
        local result=$(darkswap-cli p2p connect --peer-id "$peer" --force-relay --timeout "$TEST_TIMEOUT" --json 2>/dev/null || echo '{"success": false}')
        local success=$(echo "$result" | jq -r '.success')
        local connection_type=$(echo "$result" | jq -r '.connectionType // "unknown"')
        
        if [ "$success" = "true" ] && [ "$connection_type" = "relay" ]; then
            print_success "Successfully established relay connection to peer $peer"
            
            # Test sending a message
            print_info "Testing message sending via relay to peer $peer..."
            local message="Hello from test script via relay at $(date)"
            local send_result=$(darkswap-cli p2p send --peer-id "$peer" --message "$message" --json 2>/dev/null || echo '{"success": false}')
            local send_success=$(echo "$send_result" | jq -r '.success')
            
            if [ "$send_success" = "true" ]; then
                print_success "Successfully sent message via relay to peer $peer"
            else
                print_error "Failed to send message via relay to peer $peer"
            fi
            
            # Disconnect from peer
            darkswap-cli p2p disconnect --peer-id "$peer" > /dev/null 2>&1
        else
            print_error "Failed to establish relay connection to peer $peer"
        fi
    done
}

# Test WebRTC signaling
test_webrtc_signaling() {
    if [ "$SIGNALING_TEST" != true ]; then
        print_warning "Skipping WebRTC signaling tests"
        return
    fi
    
    print_header "Testing WebRTC Signaling"
    
    # Test if darkswap-cli p2p test-webrtc command exists
    if ! darkswap-cli p2p test-webrtc --help > /dev/null 2>&1; then
        print_error "darkswap-cli p2p test-webrtc command not available"
        return
    fi
    
    # Check if signaling server is reachable
    print_info "Testing signaling server reachability..."
    local signaling_url=$(darkswap-cli config get p2p.signaling_url 2>/dev/null || echo "unknown")
    
    if [ "$signaling_url" = "unknown" ]; then
        print_error "Could not get signaling URL from config"
        return
    fi
    
    # Extract hostname from URL
    local signaling_host=$(echo "$signaling_url" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')
    
    if ping -c 1 "$signaling_host" > /dev/null 2>&1; then
        print_success "Signaling server $signaling_host is reachable"
    else
        print_error "Signaling server $signaling_host is not reachable"
        return
    fi
    
    # Test WebRTC connection establishment
    print_info "Testing WebRTC connection establishment..."
    local webrtc_test=$(darkswap-cli p2p test-webrtc --timeout "$TEST_TIMEOUT" --json 2>/dev/null || echo '{"success": false}')
    local webrtc_success=$(echo "$webrtc_test" | jq -r '.success')
    
    if [ "$webrtc_success" = "true" ]; then
        print_success "WebRTC connection establishment test passed"
        
        # Get details
        local ice_gathering_time=$(echo "$webrtc_test" | jq -r '.iceGatheringTime // "unknown"')
        local connection_time=$(echo "$webrtc_test" | jq -r '.connectionTime // "unknown"')
        local data_channel_time=$(echo "$webrtc_test" | jq -r '.dataChannelTime // "unknown"')
        
        print_info "ICE gathering time: $ice_gathering_time ms"
        print_info "Connection establishment time: $connection_time ms"
        print_info "Data channel establishment time: $data_channel_time ms"
    else
        print_error "WebRTC connection establishment test failed"
        local error_message=$(echo "$webrtc_test" | jq -r '.error // "unknown error"')
        print_info "Error: $error_message"
    fi
}

# Test message broadcasting
test_message_broadcasting() {
    print_header "Testing Message Broadcasting"
    
    # Test if darkswap-cli p2p broadcast command exists
    if ! darkswap-cli p2p broadcast --help > /dev/null 2>&1; then
        print_error "darkswap-cli p2p broadcast command not available"
        return
    fi
    
    # Broadcast a message
    print_info "Broadcasting a message to the network..."
    local message="Broadcast test message from test script at $(date)"
    local broadcast_result=$(darkswap-cli p2p broadcast --message "$message" --json 2>/dev/null || echo '{"success": false, "recipientCount": 0}')
    local broadcast_success=$(echo "$broadcast_result" | jq -r '.success')
    local recipient_count=$(echo "$broadcast_result" | jq -r '.recipientCount')
    
    if [ "$broadcast_success" = "true" ]; then
        print_success "Successfully broadcast message to $recipient_count peers"
    else
        print_error "Failed to broadcast message"
    fi
}

# Test stress conditions
test_stress_conditions() {
    if [ "$STRESS_TEST" != true ]; then
        print_warning "Skipping stress tests"
        return
    fi
    
    print_header "Testing Stress Conditions"
    
    # Test if darkswap-cli p2p connect and send commands exist
    if ! darkswap-cli p2p connect --help > /dev/null 2>&1 || ! darkswap-cli p2p send --help > /dev/null 2>&1; then
        print_error "darkswap-cli p2p connect or send commands not available"
        return
    fi
    
    # Get a peer for stress testing
    local peers_result=$(darkswap-cli p2p discover --json 2>/dev/null || echo '{"peers": []}')
    local peer=$(echo "$peers_result" | jq -r '.peers[0].id // empty')
    
    if [ -z "$peer" ]; then
        print_error "No peers found for stress test"
        return
    fi
    
    # Connect to the peer
    print_info "Connecting to peer $peer for stress test..."
    local connect_result=$(darkswap-cli p2p connect --peer-id "$peer" --timeout "$TEST_TIMEOUT" --json 2>/dev/null || echo '{"success": false}')
    local connect_success=$(echo "$connect_result" | jq -r '.success')
    
    if [ "$connect_success" != "true" ]; then
        print_error "Failed to connect to peer for stress test"
        return
    fi
    
    print_success "Connected to peer $peer for stress test"
    
    # Send multiple messages in rapid succession
    print_info "Sending $MESSAGE_COUNT messages in rapid succession..."
    local success_count=0
    
    for i in $(seq 1 $MESSAGE_COUNT); do
        local message="Stress test message $i at $(date)"
        local send_result=$(darkswap-cli p2p send --peer-id "$peer" --message "$message" --json 2>/dev/null || echo '{"success": false}')
        local send_success=$(echo "$send_result" | jq -r '.success')
        
        if [ "$send_success" = "true" ]; then
            success_count=$((success_count + 1))
        fi
        
        # Don't wait between messages to stress the connection
    done
    
    local success_rate=$((success_count * 100 / MESSAGE_COUNT))
    
    if [ "$success_count" -eq "$MESSAGE_COUNT" ]; then
        print_success "Successfully sent all $MESSAGE_COUNT messages (100% success rate)"
    else
        print_info "Sent $success_count out of $MESSAGE_COUNT messages ($success_rate% success rate)"
    fi
    
    # Disconnect from peer
    darkswap-cli p2p disconnect --peer-id "$peer" > /dev/null 2>&1
}

# Test connection recovery
test_connection_recovery() {
    if [ "$RECOVERY_TEST" != true ]; then
        print_warning "Skipping recovery tests"
        return
    fi
    
    print_header "Testing Connection Recovery"
    
    # Test if darkswap-cli p2p restart command exists
    if ! darkswap-cli p2p restart --help > /dev/null 2>&1; then
        print_error "darkswap-cli p2p restart command not available"
        return
    fi
    
    # Get a peer for recovery testing
    local peers_result=$(darkswap-cli p2p discover --json 2>/dev/null || echo '{"peers": []}')
    local peer=$(echo "$peers_result" | jq -r '.peers[0].id // empty')
    
    if [ -z "$peer" ]; then
        print_error "No peers found for recovery test"
        return
    fi
    
    # Connect to the peer
    print_info "Connecting to peer $peer for recovery test..."
    local connect_result=$(darkswap-cli p2p connect --peer-id "$peer" --timeout "$TEST_TIMEOUT" --json 2>/dev/null || echo '{"success": false}')
    local connect_success=$(echo "$connect_result" | jq -r '.success')
    
    if [ "$connect_success" != "true" ]; then
        print_error "Failed to connect to peer for recovery test"
        return
    fi
    
    print_success "Connected to peer $peer for recovery test"
    
    # Simulate network interruption by restarting the P2P service
    print_info "Simulating network interruption..."
    darkswap-cli p2p restart > /dev/null 2>&1
    sleep 5
    
    # Check if the connection was recovered
    print_info "Checking if connection was recovered..."
    local status_result=$(darkswap-cli p2p status --json 2>/dev/null || echo '{"connections": []}')
    local connection_status=$(echo "$status_result" | jq -r '.connections[] | select(.peerId == "'"$peer"'") | .status // "disconnected"')
    
    if [ "$connection_status" = "connected" ]; then
        print_success "Connection was successfully recovered after network interruption"
    else
        print_error "Connection was not recovered after network interruption"
    fi
    
    # Try to send a message after recovery
    print_info "Trying to send a message after recovery..."
    local message="Recovery test message at $(date)"
    local send_result=$(darkswap-cli p2p send --peer-id "$peer" --message "$message" --json 2>/dev/null || echo '{"success": false}')
    local send_success=$(echo "$send_result" | jq -r '.success')
    
    if [ "$send_success" = "true" ]; then
        print_success "Successfully sent message after recovery"
    else
        print_error "Failed to send message after recovery"
    fi
    
    # Disconnect from peer
    darkswap-cli p2p disconnect --peer-id "$peer" > /dev/null 2>&1
}

# Test network metrics
test_network_metrics() {
    print_header "Testing Network Metrics"
    
    # Test if darkswap-cli p2p metrics command exists
    if ! darkswap-cli p2p metrics --help > /dev/null 2>&1; then
        print_error "darkswap-cli p2p metrics command not available"
        return
    fi
    
    # Get network metrics
    print_info "Getting network metrics..."
    local metrics=$(darkswap-cli p2p metrics --json 2>/dev/null || echo '{"peerCount": 0, "connectedPeers": 0, "messagesSent": 0, "messagesReceived": 0, "directConnections": 0, "relayConnections": 0, "averageLatency": 0}')
    
    # Extract and display key metrics
    local peer_count=$(echo "$metrics" | jq -r '.peerCount')
    local connected_peers=$(echo "$metrics" | jq -r '.connectedPeers')
    local messages_sent=$(echo "$metrics" | jq -r '.messagesSent')
    local messages_received=$(echo "$metrics" | jq -r '.messagesReceived')
    local direct_connections=$(echo "$metrics" | jq -r '.directConnections')
    local relay_connections=$(echo "$metrics" | jq -r '.relayConnections')
    local average_latency=$(echo "$metrics" | jq -r '.averageLatency')
    
    print_info "Peer count: $peer_count"
    print_info "Connected peers: $connected_peers"
    print_info "Messages sent: $messages_sent"
    print_info "Messages received: $messages_received"
    print_info "Direct connections: $direct_connections"
    print_info "Relay connections: $relay_connections"
    print_info "Average latency: $average_latency ms"
    
    # Check if metrics are reasonable
    if [ "$peer_count" -gt 0 ] && [ "$messages_sent" -gt 0 ] && [ "$messages_received" -gt 0 ]; then
        print_success "Network metrics look reasonable"
    else
        print_error "Network metrics may indicate issues"
    fi
}

# Generate test report
generate_report() {
    print_header "Generating Test Report"
    
    local report_file="p2p_network_test_report_$(date +%Y%m%d_%H%M%S).json"
    
    # Collect system information
    local os_info=$(uname -a)
    local darkswap_version=$(darkswap-cli --version 2>/dev/null | head -n 1 || echo "unknown")
    local network_info=$(darkswap-cli config get network 2>/dev/null || echo '"unknown"')
    
    # Collect P2P metrics
    local p2p_metrics=$(darkswap-cli p2p metrics --json 2>/dev/null || echo '{}')
    
    # Create report JSON
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "system": {
    "os": "$os_info",
    "darkswapVersion": "$darkswap_version",
    "network": $network_info
  },
  "p2pMetrics": $p2p_metrics,
  "testResults": {
EOF

    # Add peer discovery results if available
    if darkswap-cli p2p discover --help > /dev/null 2>&1; then
        cat >> "$report_file" << EOF
    "peerDiscovery": {
      "dhtDiscovery": $(darkswap-cli p2p discover --method dht --json 2>/dev/null || echo '{"peers": []}'),
      "relayDiscovery": $(darkswap-cli p2p discover --method relay --json 2>/dev/null || echo '{"peers": []}'),
      "localDiscovery": $(darkswap-cli p2p discover --method local --json 2>/dev/null || echo '{"peers": []}')
    },
EOF
    fi

    # Add connection status if available
    if darkswap-cli p2p status --help > /dev/null 2>&1; then
        cat >> "$report_file" << EOF
    "connectionStatus": $(darkswap-cli p2p status --json 2>/dev/null || echo '{}'),
EOF
    fi

    # Add WebRTC test results if available
    if [ "$SIGNALING_TEST" = true ] && darkswap-cli p2p test-webrtc --help > /dev/null 2>&1; then
        cat >> "$report_file" << EOF
    "webrtcTest": $(darkswap-cli p2p test-webrtc --json 2>/dev/null || echo '{}')
EOF
    else
        # Remove trailing comma if this is the last item
        sed -i '$ s/,$//' "$report_file"
    fi

    # Close the JSON
    cat >> "$report_file" << EOF
  }
}
EOF
    
    print_success "Test report generated: $report_file"
}

# Main function
main() {
    echo -e "${YELLOW}DarkSwap P2P Network Test${NC}"
    echo -e "${YELLOW}$(date)${NC}\n"
    
    check_dependencies
    check_services
    test_peer_discovery
    test_direct_connections
    test_relay_connections
    test_webrtc_signaling
    test_message_broadcasting
    test_stress_conditions
    test_connection_recovery
    test_network_metrics
    generate_report
    
    echo -e "\n${GREEN}P2P Network Test Completed${NC}"
}

# Run the main function
main