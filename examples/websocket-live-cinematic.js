#!/usr/bin/env node

/**
 * Eterna Cinematic Grid - Final Version (with Heartbeat Pulse)
 * 
 * Professional Bloomberg-style terminal with:
 * - Cinematic splash screen
 * - Live heartbeat pulse indicator
 * - Fade-in text effects
 * - 3-column grid layout
 * 
 * Usage: node examples/websocket-live-cinematic.js
 */

const WebSocket = require('ws');
const chalk = require('chalk');
const boxen = require('boxen');
const readline = require('readline');
const ansiEscapes = require('ansi-escapes');

const WS_URL = process.env.WS_URL || 'ws://localhost:3000/ws';

// Default tokens: SOL, BONK, USDC
const TOKENS = process.argv.length >= 5
  ? [process.argv[2], process.argv[3], process.argv[4]]
  : [
      'So11111111111111111111111111111111111111112', // SOL
      'DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL',  // BONK
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'   // USDC
    ];

const ws = new WebSocket(WS_URL);
const tokenMap = new Map();
let updateCount = 0;
let heartbeatState = true;

// ════════════════════════════════════════════════════════
// Splash Screen — cinematic intro loader
// ════════════════════════════════════════════════════════
async function splashScreen() {
  console.clear();
  const title = chalk.whiteBright.bold('ETERNA TERMINAL');
  const subtitle = chalk.dim('Initializing Real-Time Intelligence...');

  console.log(
    boxen(title, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 2, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'gray',
      backgroundColor: '#0d0d0d',
    })
  );
  console.log(chalk.gray(subtitle));

  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      readline.cursorTo(process.stdout, 0, 6);
      process.stdout.write(chalk.gray(`Loading ${spinner[i++ % spinner.length]}`));
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      console.clear();
      resolve();
    }, 2000);
  });
}

// ════════════════════════════════════════════════════════
// Helper Functions
// ════════════════════════════════════════════════════════

function fadePrint(str, delay = 8) {
  let i = 0;
  const interval = setInterval(() => {
    if (i < str.length) {
      process.stdout.write(str[i++]);
    } else {
      clearInterval(interval);
    }
  }, delay);
}

function heartbeat() {
  heartbeatState = !heartbeatState;
  const color = heartbeatState ? chalk.greenBright('●') : chalk.gray('○');
  readline.cursorTo(process.stdout, 2, 0);
  process.stdout.write(` ${color} ${chalk.dim('Connected')}`);
}

function printHeader() {
  const header = chalk.whiteBright.bold('ETERNA • Market Intelligence Grid');
  const box = boxen(header, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 1, bottom: 1 },
    borderStyle: 'round',
    borderColor: 'gray',
    backgroundColor: '#0d0d0d',
  });
  console.log(box);
  process.stdout.write('   ');
  heartbeat(); // initial pulse
}

function priceChange(current, prev) {
  if (!prev) return chalk.gray('-');
  const diff = current - prev;
  const percent = ((diff / prev) * 100).toFixed(2);
  if (diff > 0) return chalk.greenBright(`▲ +${percent}%`);
  if (diff < 0) return chalk.redBright(`▼ ${percent}%`);
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
  if (price >= 1) return chalk.whiteBright(`$${price.toFixed(6)}`);
  if (price >= 0.01) return chalk.whiteBright(`$${price.toFixed(8)}`);
  return chalk.whiteBright(`$${price.toFixed(10)}`);
}

function formatTokenBlock(t) {
  if (!t) {
    return (
      chalk.gray('Waiting...\n') +
      chalk.gray('──────────\n\n') +
      chalk.gray('─\n') +
      chalk.gray('─\n') +
      chalk.gray('─\n') +
      `\n` +
      chalk.gray('─\n') +
      chalk.gray('─\n')
    );
  }
  
  const p = t.priceData;
  const change = priceChange(p.price, t.lastPrice);
  const flicker = (p.price !== t.lastPrice)
    ? chalk.bgBlackBright.whiteBright
    : (x) => x;

  t.lastPrice = p.price;

  const symbol = t.token.symbol || 'N/A';
  const name = t.token.name || 'Unknown Token';
  const address = t.token.address ? t.token.address.slice(0, 10) + '…' : 'N/A';
  const volume = p.volume24h || t.totalVolume24h || 0;
  const liquidity = p.liquidity || t.totalLiquidity || 0;

  return (
    chalk.bold.white(symbol) + chalk.gray(` (${name})\n`) +
    chalk.dim('Address:') + ` ${chalk.gray(address)}\n\n` +
    `${chalk.bold('Price')}   ${flicker(formatPrice(p.price))}  ${change}\n` +
    `${chalk.bold('Vol 24h')} ${formatVolume(volume)}\n` +
    `${chalk.bold('Liq')}     ${formatVolume(liquidity)}\n\n` +
    `${chalk.bold('Source')}  ${chalk.white((t.sources || []).join(', ') || 'N/A')}\n` +
    `${chalk.bold('Chain')}   ${chalk.white((t.chains || []).join(', ') || 'N/A')}\n`
  );
}

function render() {
  console.clear();
  printHeader();

  const tokens = Array.from(tokenMap.values());
  if (tokens.length === 0) {
    console.log(chalk.gray('Loading live market data...'));
    return;
  }

  // Get tokens, pad with null if needed
  const [a, b, c] = [
    tokens[0] || null,
    tokens[1] || null,
    tokens[2] || null
  ];
  
  if (!a) {
    console.log(chalk.gray(`Loading... (${tokens.length} token(s) received)`));
    return;
  }
  const colWidth = 42;
  const pad = (s, len) => s.split('\n').map(l => l.padEnd(len)).join('\n');
  const aLines = pad(formatTokenBlock(a), colWidth).split('\n');
  const bLines = pad(formatTokenBlock(b), colWidth).split('\n');
  const cLines = formatTokenBlock(c).split('\n');

  console.log(chalk.gray('──────────────────────────────────────────────────────────────────────────────'));
  for (let i = 0; i < Math.max(aLines.length, bLines.length, cLines.length); i++) {
    const l = aLines[i] || '';
    const m = bLines[i] || '';
    const r = cLines[i] || '';
    console.log(`${l}   ${m}   ${r}`);
  }
  console.log(chalk.gray('──────────────────────────────────────────────────────────────────────────────'));
  console.log(
    chalk.dim(`Updated • ${new Date().toLocaleTimeString()}  |  Update #${updateCount}`)
  );
}

// ════════════════════════════════════════════════════════
// WebSocket Event Flow
// ════════════════════════════════════════════════════════
(async () => {
  await splashScreen();

  ws.on('open', () => {
    printHeader();
    console.log(chalk.gray(`Connecting to ${WS_URL}...\n`));
    console.log(chalk.dim(`Subscribing to: ${TOKENS.join(', ')}\n`));
    ws.send(JSON.stringify({
      type: 'subscribe',
      tokenAddresses: TOKENS,
    }));
  });

  ws.on('message', (msg) => {
    try {
      const payload = JSON.parse(msg);

      if (payload.type === 'connected') {
        console.log(chalk.green(`✓ Connected (Client ID: ${payload.clientId})`));
        return;
      }

      if (payload.type === 'subscribed') {
        console.log(chalk.green(`✓ Subscribed to ${payload.tokenAddresses.length} token(s)\n`));
        return;
      }

      if (payload.type === 'update' && Array.isArray(payload.data)) {
        const receivedSymbols = payload.data.map(t => t.token?.symbol || t.token?.address?.slice(0, 8)).join(', ');
        if (process.env.DEBUG) {
          console.log(chalk.dim(`[DEBUG] Update: ${receivedSymbols}`));
        }
        
        for (const t of payload.data) {
          if (t.token && t.token.symbol) {
            tokenMap.set(t.token.symbol, t);
          } else if (t.token && t.token.address) {
            tokenMap.set(t.token.address, t);
          }
        }
        updateCount++;
        heartbeat(); // Pulse with every update - this is the hypnotic rhythm!
        process.stdout.write(ansiEscapes.cursorTo(0, 0));
        render();
        return;
      }

      if (payload.type === 'leaderboard_update') {
        // Leaderboard updates received (can be displayed if needed)
        if (process.env.SHOW_LEADERBOARD) {
          logger.debug(`Leaderboard update: ${payload.data?.topByVolume?.length || 0} tokens`);
        }
        return;
      }

      if (payload.type === 'pong') {
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
})();

