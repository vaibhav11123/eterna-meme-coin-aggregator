#!/usr/bin/env node

/**
 * Live WebSocket Test Client
 * 
 * Connects to the aggregator WebSocket and displays real-time price updates
 * 
 * Usage: node examples/websocket-live-test.js [tokenAddress]
 * Example: node examples/websocket-live-test.js So11111111111111111111111111111111111111112
 */

const WebSocket = require('ws');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

const WS_URL = process.env.WS_URL || 'ws://localhost:3000/ws';
const TOKEN_ADDRESS = process.argv[2] || 'So11111111111111111111111111111111111111112'; // Default: Wrapped SOL

let updateCount = 0;
let lastUpdate = null;

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(price);
}

function formatVolume(volume) {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
  return `$${volume.toFixed(2)}`;
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

function displayUpdate(data) {
  // Clear previous output (works on most terminals)
  process.stdout.write('\x1b[2J\x1b[H');
  
  console.log(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║${colors.reset}  ${colors.bright}🚀 ETERNA MEME COIN AGGREGATOR - LIVE PRICE FEED${colors.reset}  ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  if (!data || data.length === 0) {
    console.log(`${colors.yellow}⏳ Waiting for data...${colors.reset}\n`);
    return;
  }

  data.forEach((coin, index) => {
    const change24h = coin.priceData.priceChangePercent24h || 0;
    const changeColor = change24h >= 0 ? colors.green : colors.red;
    const changeSymbol = change24h >= 0 ? '📈' : '📉';
    
    console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}${coin.token.symbol}${colors.reset} ${colors.cyan}(${coin.token.name})${colors.reset}`);
    console.log(`${colors.bright}Address:${colors.reset} ${coin.token.address.substring(0, 20)}...`);
    console.log();
    
    console.log(`${colors.bright}💰 Price Data:${colors.reset}`);
    console.log(`   Current:     ${colors.bright}${formatPrice(coin.priceData.price)}${colors.reset}`);
    console.log(`   Best Price:  ${colors.green}${formatPrice(coin.bestPrice)}${colors.reset}`);
    console.log(`   Avg Price:   ${formatPrice(coin.averagePrice)}`);
    console.log(`   24h Change:  ${changeColor}${changeSymbol} ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%${colors.reset}`);
    console.log();
    
    console.log(`${colors.bright}📊 Market Data:${colors.reset}`);
    console.log(`   Volume 24h:  ${colors.yellow}${formatVolume(coin.totalVolume24h)}${colors.reset}`);
    console.log(`   Liquidity:   ${formatVolume(coin.totalLiquidity)}`);
    if (coin.priceData.marketCap) {
      console.log(`   Market Cap:  ${formatVolume(coin.priceData.marketCap)}`);
    }
    console.log();
    
    console.log(`${colors.bright}🔗 Sources:${colors.reset} ${coin.sources.map(s => `${colors.cyan}${s}${colors.reset}`).join(', ')}`);
    if (coin.chains.length > 0) {
      console.log(`${colors.bright}⛓️  Chains:${colors.reset} ${coin.chains.join(', ')}`);
    }
    console.log();
    
    console.log(`${colors.bright}🕐 Last Updated:${colors.reset} ${new Date(coin.lastUpdated).toLocaleTimeString()}`);
    console.log(`${colors.bright}📡 Update #${colors.reset} ${updateCount}`);
    
    if (index < data.length - 1) {
      console.log();
    }
  });

  console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}Press Ctrl+C to exit${colors.reset}\n`);
}

function connect() {
  console.log(`${colors.bright}${colors.cyan}Connecting to ${WS_URL}...${colors.reset}\n`);
  
  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log(`${colors.green}✅ Connected!${colors.reset}\n`);
    console.log(`${colors.yellow}Subscribing to token: ${TOKEN_ADDRESS}${colors.reset}\n`);
    
    // Subscribe to the token
    ws.send(JSON.stringify({
      type: 'subscribe',
      tokenAddresses: [TOKEN_ADDRESS],
    }));
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'connected':
          console.log(`${colors.green}✅ Connected (Client ID: ${message.clientId})${colors.reset}\n`);
          break;
          
        case 'subscribed':
          console.log(`${colors.green}✅ Subscribed to ${message.tokenAddresses.length} token(s)${colors.reset}\n`);
          console.log(`${colors.cyan}Waiting for price updates...${colors.reset}\n`);
          break;
          
        case 'update':
          updateCount++;
          lastUpdate = Date.now();
          displayUpdate(message.data);
          break;
          
        case 'pong':
          // Heartbeat response - silent
          break;
          
        case 'error':
          console.error(`${colors.red}❌ Error: ${message.message}${colors.reset}\n`);
          break;
          
        default:
          console.log(`${colors.yellow}Unknown message type: ${message.type}${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}Error parsing message: ${error.message}${colors.reset}`);
    }
  });

  ws.on('error', (error) => {
    console.error(`${colors.red}❌ WebSocket error: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Make sure the server is running on port 3000${colors.reset}`);
  });

  ws.on('close', () => {
    console.log(`\n${colors.yellow}Connection closed${colors.reset}`);
    process.exit(0);
  });

  // Send ping every 30 seconds to keep connection alive
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Disconnecting...${colors.reset}`);
    ws.close();
    process.exit(0);
  });
}

// Start connection
connect();

