/**
 * Example WebSocket client for testing the meme coin aggregator
 * 
 * Usage: node examples/websocket-client.js
 */

const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Subscribe to token addresses
  ws.send(JSON.stringify({
    type: 'subscribe',
    tokenAddresses: [
      '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // PEPE example
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT example
    ]
  }));
  
  console.log('Subscribed to tokens');
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  switch (message.type) {
    case 'connected':
      console.log('Connection confirmed:', message);
      break;
      
    case 'subscribed':
      console.log('Subscription confirmed:', message.tokenAddresses);
      break;
      
    case 'update':
      console.log('\n=== Price Update ===');
      message.data.forEach((coin) => {
        console.log(`${coin.token.symbol} (${coin.token.name}):`);
        console.log(`  Price: $${coin.priceData.price}`);
        console.log(`  Sources: ${coin.sources.join(', ')}`);
        console.log(`  Volume 24h: $${coin.totalVolume24h.toLocaleString()}`);
        console.log(`  Liquidity: $${coin.totalLiquidity.toLocaleString()}`);
        console.log('');
      });
      break;
      
    case 'pong':
      console.log('Pong received');
      break;
      
    case 'error':
      console.error('Error:', message.message);
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
  process.exit(0);
});

// Send ping every 30 seconds
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nClosing connection...');
  ws.close();
});

