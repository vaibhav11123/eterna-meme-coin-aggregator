#!/usr/bin/env node

/**
 * Dual-Token WebSocket Live Feed (Bloomberg Terminal Style)
 * 
 * Minimal, professional dual-column display for two tokens
 * 
 * Usage: node examples/websocket-live-dual.js [token1] [token2]
 * Example: node examples/websocket-live-dual.js So11111111111111111111111111111111111111112 DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL
 */

const WebSocket = require('ws');
const chalk = require('chalk');
const boxen = require('boxen');
const readline = require('readline');

const WS_URL = process.env.WS_URL || 'ws://localhost:3000/ws';

// Default tokens: SOL and BONK
const TOKENS = process.argv.length >= 4 
  ? [process.argv[2], process.argv[3]]
  : [
      'So11111111111111111111111111111111111111112', // SOL
      'DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL'  // BONK
    ];

const ws = new WebSocket(WS_URL);
const tokenData = new Map();
let updateCount = 0;

function header() {
  const title = chalk.bold.whiteBright('ETERNA • Dual Token Live Feed');
  console.clear();
  console.log(
    boxen(title, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 1, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'gray',
      backgroundColor: '#0d0d0d',
    })
  );
}

function priceDiff(current, prev) {
  if (!prev) return chalk.gray('-');
  const diff = current - prev;
  const percent = ((diff / prev) * 100).toFixed(2);
  if (diff > 0) return chalk.green(`▲ +${percent}%`);
  if (diff < 0) return chalk.red(`▼ ${percent}%`);
  return chalk.gray('±0.00%');
}

function formatVolume(value) {
  if (!value || value === 0) return chalk.gray('N/A');
  if (value >= 1e9) return chalk.cyan(`$${(value / 1e9).toFixed(2)}B`);
  if (value >= 1e6) return chalk.cyan(`$${(value / 1e6).toFixed(2)}M`);
  if (value >= 1e3) return chalk.cyan(`$${(value / 1e3).toFixed(2)}K`);
  return chalk.cyan(`$${value.toFixed(2)}`);
}

function formatPrice(price) {
  if (!price || price === 0) return chalk.gray('N/A');
  // Format based on price magnitude
  if (price >= 1) return chalk.whiteBright(`$${price.toFixed(6)}`);
  if (price >= 0.01) return chalk.whiteBright(`$${price.toFixed(8)}`);
  return chalk.whiteBright(`$${price.toFixed(10)}`);
}

function render() {
  header();
  
  const tokens = Array.from(tokenData.values());
  if (tokens.length < 2) {
    console.log(chalk.gray('Waiting for both tokens...'));
    console.log(chalk.dim(`Subscribed to: ${TOKENS.join(', ')}`));
    return;
  }

  const [a, b] = tokens;
  const colWidth = 48;

  const formatBlock = (t) => {
    const p = t.priceData;
    const change = priceDiff(p.price, t.lastPrice);
    t.lastPrice = p.price;
    
    const symbol = t.token.symbol || 'N/A';
    const name = t.token.name || 'Unknown Token';
    const address = t.token.address ? t.token.address.slice(0, 10) + '…' : 'N/A';
    
    return (
      chalk.bold.white(symbol) + chalk.gray(` (${name})\n`) +
      chalk.dim('Address:') + ` ${chalk.gray(address)}\n\n` +
      `${chalk.bold('Price')}   ${formatPrice(p.price)}  ${change}\n` +
      `${chalk.bold('Vol 24h')} ${formatVolume(p.volume24h || t.totalVolume24h)}\n` +
      `${chalk.bold('Liq')}     ${formatVolume(p.liquidity || t.totalLiquidity)}\n` +
      (p.marketCap ? `${chalk.bold('MCap')}   ${formatVolume(p.marketCap)}\n` : '') +
      `\n` +
      `${chalk.bold('Source')}  ${chalk.white((t.sources || []).join(', ') || 'N/A')}\n` +
      `${chalk.bold('Chain')}   ${chalk.white((t.chains || []).join(', ') || 'N/A')}\n`
    );
  };

  const pad = (str, len) => str.split('\n').map(l => l.padEnd(len)).join('\n');
  const left = pad(formatBlock(a), colWidth);
  const right = formatBlock(b).split('\n');
  const leftLines = left.split('\n');

  console.log(chalk.gray('──────────────────────────────────────────────────────────────'));
  for (let i = 0; i < Math.max(leftLines.length, right.length); i++) {
    const l = leftLines[i] || '';
    const r = right[i] || '';
    console.log(`${l}   ${r}`);
  }
  console.log(chalk.gray('──────────────────────────────────────────────────────────────'));
  console.log(
    chalk.dim(
      `Updated • ${new Date().toLocaleTimeString()}  |  Update #${updateCount}`
    )
  );
}

ws.on('open', () => {
  header();
  console.log(chalk.gray(`Connected to ${WS_URL}`));
  console.log(chalk.dim(`Subscribing to ${TOKENS.length} tokens...\n`));
  
  ws.send(JSON.stringify({
    type: 'subscribe',
    tokenAddresses: TOKENS,
  }));
});

ws.on('message', (msg) => {
  try {
    const payload = JSON.parse(msg);
    
    // Handle different message types
    if (payload.type === 'connected') {
      console.log(chalk.green(`✓ Connected (Client ID: ${payload.clientId})`));
      return;
    }
    
    if (payload.type === 'subscribed') {
      console.log(chalk.green(`✓ Subscribed to ${payload.tokenAddresses.length} token(s)\n`));
      return;
    }
    
    if (payload.type === 'update' && Array.isArray(payload.data)) {
      // Update token data map
      for (const token of payload.data) {
        if (token.token && token.token.symbol) {
          tokenData.set(token.token.symbol, token);
        } else if (token.token && token.token.address) {
          // Use address as key if no symbol
          tokenData.set(token.token.address, token);
        }
      }
      updateCount++;
      render();
      return;
    }
    
    if (payload.type === 'pong') {
      // Heartbeat - silent
      return;
    }
    
    if (payload.type === 'error') {
      console.log(chalk.red(`Error: ${payload.message}`));
      return;
    }
  } catch (error) {
    console.error(chalk.red(`Parse error: ${error.message}`));
  }
});

ws.on('close', () => {
  console.log(chalk.red('\nDisconnected'));
  process.exit(0);
});

ws.on('error', (err) => {
  console.log(chalk.red(`Error: ${err.message}`));
  console.log(chalk.yellow('Make sure the server is running on port 3000'));
  process.exit(1);
});

// Send ping every 30 seconds to keep connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nDisconnecting...'));
  ws.close();
  process.exit(0);
});

