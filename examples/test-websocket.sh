#!/bin/bash

# 🧪 WebSocket Connection Test
# Tests WebSocket connectivity and message flow
# 
# IMPORTANT: This script warms the cache first to ensure data is available

set -e

API_URL="${API_URL:-https://eterna-aggregator.onrender.com}"
WS_URL="${WS_URL:-wss://eterna-aggregator.onrender.com/ws}"

# Warm up cache first (critical for WebSocket to receive data)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 Warming up cache before WebSocket test..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SOL="So11111111111111111111111111111111111111112"
USDC="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

echo "Fetching tokens to populate cache..."
curl -s "$API_URL/api/tokens?addresses=$SOL,$USDC" > /dev/null 2>&1
echo "✓ Cache warmed"
echo ""
sleep 1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 WEBSOCKET CONNECTION TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "WS URL: $WS_URL"
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required for WebSocket testing"
    exit 1
fi

# Create a temporary test script
cat > /tmp/ws-test.js << 'EOF'
const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'wss://eterna-aggregator.onrender.com/ws';
const TOKEN = 'So11111111111111111111111111111111111111112'; // SOL

let connected = false;
let subscribed = false;
let updateReceived = false;
let errorOccurred = false;
let timeout;

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✓ WebSocket connection opened');
  connected = true;
  
  // Subscribe to token
  ws.send(JSON.stringify({
    type: 'subscribe',
    tokenAddresses: [TOKEN],
  }));
  
  // Set timeout for test
  timeout = setTimeout(() => {
    if (!updateReceived) {
      console.log('⚠ No updates received within 10 seconds (may be normal if no price changes)');
      ws.close();
      process.exit(updateReceived ? 0 : 1);
    }
  }, 10000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    
    switch (msg.type) {
      case 'connected':
        console.log(`✓ Connected message received (Client ID: ${msg.clientId})`);
        break;
        
      case 'subscribed':
        console.log(`✓ Subscribed to ${msg.tokenAddresses.length} token(s)`);
        subscribed = true;
        break;
        
      case 'update':
        if (Array.isArray(msg.data) && msg.data.length > 0) {
          console.log(`✓ Update received: ${msg.data.length} token(s)`);
          const token = msg.data[0];
          if (token.token && token.priceData) {
            console.log(`  Token: ${token.token.symbol || token.token.address}`);
            console.log(`  Price: $${token.priceData.price}`);
            console.log(`  Sources: ${(token.sources || []).join(', ')}`);
          }
          updateReceived = true;
          clearTimeout(timeout);
          setTimeout(() => {
            ws.close();
            process.exit(0);
          }, 1000);
        }
        break;
        
      case 'pong':
        // Heartbeat - silent
        break;
        
      case 'error':
        console.error(`✗ Error: ${msg.message}`);
        errorOccurred = true;
        clearTimeout(timeout);
        ws.close();
        process.exit(1);
        break;
        
      default:
        console.log(`⚠ Unknown message type: ${msg.type}`);
    }
  } catch (error) {
    console.error(`✗ Parse error: ${error.message}`);
    errorOccurred = true;
    clearTimeout(timeout);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', (error) => {
  console.error(`✗ WebSocket error: ${error.message}`);
  errorOccurred = true;
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n✓ WebSocket connection closed');
  if (connected && subscribed && (updateReceived || !errorOccurred)) {
    console.log('\n✅ WebSocket test PASSED');
    process.exit(0);
  } else {
    console.log('\n❌ WebSocket test FAILED');
    process.exit(1);
  }
});

// Send ping every 5 seconds
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 5000);
EOF

echo "Testing WebSocket connection..."
WS_URL="$WS_URL" node /tmp/ws-test.js

# Cleanup
rm -f /tmp/ws-test.js

