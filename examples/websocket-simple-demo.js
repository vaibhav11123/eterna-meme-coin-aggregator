#!/usr/bin/env node

/**
 * Simple WebSocket Demo - Shows data without aggressive terminal clearing
 * This version works reliably in all terminals
 */

const WebSocket = require('ws');
const chalk = require('chalk');

const WS_URL = process.env.WS_URL || 'wss://eterna-aggregator.onrender.com/ws';

// Default tokens: SOL, BONK, USDC
const TOKENS = [
  'So11111111111111111111111111111111111111112', // SOL
  'DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL',  // BONK
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'   // USDC
];

const ws = new WebSocket(WS_URL);
const tokenMap = new Map();
let updateCount = 0;
let hasRendered = false;

function formatPrice(price) {
  if (!price || price === 0) return chalk.gray('N/A');
  if (price >= 1) return chalk.whiteBright(`$${price.toFixed(6)}`);
  if (price >= 0.01) return chalk.whiteBright(`$${price.toFixed(8)}`);
  return chalk.whiteBright(`$${price.toFixed(10)}`);
}

function formatVolume(vol) {
  if (!vol || vol === 0) return chalk.gray('N/A');
  if (vol >= 1e9) return chalk.cyan(`$${(vol / 1e9).toFixed(2)}B`);
  if (vol >= 1e6) return chalk.cyan(`$${(vol / 1e6).toFixed(2)}M`);
  if (vol >= 1e3) return chalk.cyan(`$${(vol / 1e3).toFixed(1)}K`);
  return chalk.cyan(`$${vol.toFixed(2)}`);
}

function render() {
  // Only clear on first render, then update in place
  if (!hasRendered) {
    console.clear();
    hasRendered = true;
  } else {
    // Move cursor up to overwrite previous output
    process.stdout.write('\x1b[2J\x1b[H');
  }

  console.log(chalk.cyan.bold('╭───────────────────────────────────────────────────────────────╮'));
  console.log(chalk.cyan.bold('│ 🧠 ETERNA • REAL-TIME MARKET TERMINAL                         │'));
  console.log(chalk.cyan.bold('╰───────────────────────────────────────────────────────────────╯'));
  console.log('');

  const tokens = Array.from(tokenMap.values());
  
  if (tokens.length === 0) {
    console.log(chalk.gray('⏳ Waiting for market data...'));
    console.log('');
    return;
  }

  // Display tokens in a simple table
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.gray('TOKEN          PRICE (USD)      VOL (24H)      LIQ.        SOURCES'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

  tokens.slice(0, 10).forEach(token => {
    const symbol = (token.token?.symbol || 'N/A').padEnd(12);
    const price = formatPrice(token.priceData?.price || 0);
    const volume = formatVolume(token.priceData?.volume24h || 0);
    const liquidity = formatVolume(token.priceData?.liquidity || 0);
    const sources = (token.sources || []).join(', ') || 'N/A';
    
    console.log(`${chalk.white.bold(symbol)} ${price.toString().padEnd(18)} ${volume.toString().padEnd(15)} ${liquidity.toString().padEnd(12)} ${chalk.cyan(sources)}`);
  });

  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.dim(`📡 Updates: ${updateCount} | Active Tokens: ${tokens.length} | ⏱ ${new Date().toLocaleTimeString()}`));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log('');
  console.log(chalk.dim('──────────────────────────────────────────────────────────────────────────────'));
  console.log(chalk.dim('Powered by Eterna • Real-time Market Intelligence Engine • v1.0'));
  console.log(chalk.dim('──────────────────────────────────────────────────────────────────────────────'));
  console.log('');
  console.log(chalk.yellow('Press Ctrl+C to stop'));
}

ws.on('open', () => {
  console.log(chalk.green('✓ Connected to WebSocket server'));
  console.log(chalk.gray(`Subscribing to ${TOKENS.length} token(s)...\n`));
  
  ws.send(JSON.stringify({
    type: 'subscribe',
    tokenAddresses: TOKENS,
  }));
});

ws.on('message', (msg) => {
  try {
    const payload = JSON.parse(msg);

    if (payload.type === 'connected') {
      // Already handled in 'open'
      return;
    }

    if (payload.type === 'subscribed') {
      console.log(chalk.green(`✓ Subscribed to ${payload.tokenAddresses.length} token(s)\n`));
      console.log(chalk.gray('Waiting for initial data...\n'));
      return;
    }

    if (payload.type === 'update' && Array.isArray(payload.data)) {
      // Store tokens
      for (const t of payload.data) {
        if (t.token && t.token.symbol) {
          tokenMap.set(t.token.symbol, t);
        } else if (t.token && t.token.address) {
          tokenMap.set(t.token.address, t);
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

ws.on('error', (error) => {
  console.error(chalk.red(`WebSocket error: ${error.message}`));
  console.log(chalk.yellow('Make sure the server is running'));
  process.exit(1);
});

ws.on('close', () => {
  console.log(chalk.yellow('\n\nDisconnected'));
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
  console.log(chalk.yellow('\n\nDisconnecting...'));
  ws.close();
  process.exit(0);
});

