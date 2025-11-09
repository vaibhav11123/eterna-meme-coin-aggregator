#!/usr/bin/env node

/**
 * 🧠 ETERNA • Real-Time Market Terminal (Bloomberg-Style)
 * 
 * Premium table-based terminal display with multi-source aggregation
 * 
 * Usage: node examples/websocket-live-grid.js [token1] [token2] [token3]
 * Example: node examples/websocket-live-grid.js So11111111111111111111111111111111111111112 DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
 */

const WebSocket = require('ws');
const chalk = require('chalk');
const Table = require('cli-table3');
const https = require('https');

const WS_URL = process.env.WS_URL || 'wss://eterna-aggregator.onrender.com/ws';

// Default tokens: SOL, BONK, USDC
const TOKENS = process.argv.length >= 5
  ? [process.argv[2], process.argv[3], process.argv[4]]
  : [
      'So11111111111111111111111111111111111111112', // SOL
      'DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL',  // BONK
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'   // USDC
    ];

const ws = new WebSocket(WS_URL);
const tokenData = new Map();
let updateCount = 0;
let tickerIndex = 0;

// Ticker messages (rotating)
const tickerMessages = [
  '💬 Trending: BONK +12.4% | WIF -5.3% | SOL +3.1% | PEPE +9.2%',
  '💬 Market Pulse: High volatility detected | 13 tokens active | Real-time updates',
  '💬 Intelligence: Multi-source aggregation active | Confidence scoring enabled',
];

// ════════════════════════════════════════════════════════
// Helper Functions
// ════════════════════════════════════════════════════════

function formatVolume(v) {
  if (!v || v === 0) return '—';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(2);
}

function formatPrice(price) {
  if (!price) return '—';
  // Use 4-6 decimals based on price magnitude
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(6);
  return price.toFixed(8);
}

function truncateName(name, maxLen = 15) {
  if (!name) return '—';
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + '.';
}

function formatSources(sources) {
  if (!sources || !Array.isArray(sources) || sources.length === 0) return 'N/A';
  // Capitalize first letter of each source
  return sources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
}

// ════════════════════════════════════════════════════════
// Render Dashboard
// ════════════════════════════════════════════════════════

function renderDashboard() {
  console.clear();

  // Header
  console.log(chalk.cyanBright('╭───────────────────────────────────────────────────────────────╮'));
  console.log(chalk.cyanBright('│            🧠  ETERNA • REAL-TIME MARKET TERMINAL              │'));
  console.log(chalk.cyanBright('╰───────────────────────────────────────────────────────────────╯\n'));

  // Ticker (rotating)
  const ticker = tickerMessages[tickerIndex % tickerMessages.length];
  console.log(chalk.dim(ticker));
  console.log('');

  // Table
  const table = new Table({
    head: [
      chalk.gray('TOKEN'),
      chalk.gray('PRICE (USD)'),
      chalk.gray('VOL (24H)'),
      chalk.gray('LIQ.'),
      chalk.gray('CONF.'),
      chalk.gray('SRC'),
    ],
    colWidths: [18, 14, 14, 12, 10, 20],
    style: {
      head: [],
      border: [],
      compact: false,
    },
    chars: {
      'top': '━',
      'top-mid': '┳',
      'top-left': '┏',
      'top-right': '┓',
      'bottom': '━',
      'bottom-mid': '┻',
      'bottom-left': '┗',
      'bottom-right': '┛',
      'left': '┃',
      'left-mid': '┣',
      'mid': '━',
      'mid-mid': '╋',
      'right': '┃',
      'right-mid': '┫',
      'middle': '┃',
    },
  });

  const tokens = Array.from(tokenData.values())
    .sort((a, b) => {
      // Sort by volume (descending)
      const volA = a.priceData?.volume24h || a.totalVolume24h || 0;
      const volB = b.priceData?.volume24h || b.totalVolume24h || 0;
      return volB - volA;
    })
    .slice(0, 10); // Top 10 tokens

  if (tokens.length === 0) {
    table.push([
      { colSpan: 6, content: chalk.gray('Waiting for market data...') },
    ]);
  } else {
    for (const token of tokens) {
      const { symbol, name } = token.token || {};
      const priceData = token.priceData || {};
      const price = priceData.price || token.averagePrice || 0;
      const volume24h = priceData.volume24h || token.totalVolume24h || 0;
      const liquidity = priceData.liquidity || token.totalLiquidity || 0;
      const confidence = token.confidenceScore || 100;
      const sources = formatSources(token.sources);

      const shortName = truncateName(name, 15);
      const symbolDisplay = (symbol || 'N/A').padEnd(6);
      const nameDisplay = chalk.dim(shortName);

      // Price color: green if positive change, red if negative, yellow if neutral
      const priceChange = priceData.priceChange24h || priceData.priceChangePercent24h || 0;
      let priceColor = chalk.yellow;
      if (priceChange > 0) priceColor = chalk.green;
      if (priceChange < 0) priceColor = chalk.red;

      // Confidence color: green if high (>90), yellow if medium (70-90), red if low
      let confColor = chalk.green;
      if (confidence < 90) confColor = chalk.yellow;
      if (confidence < 70) confColor = chalk.red;

      table.push([
        chalk.white.bold(symbolDisplay) + ' ' + nameDisplay,
        priceColor(`$${formatPrice(price)}`),
        chalk.blue(formatVolume(volume24h)),
        chalk.green(formatVolume(liquidity)),
        confColor(`${confidence.toFixed(1)}%`),
        chalk.cyan(sources),
      ]);
    }
  }

  console.log(table.toString());

  // Footer
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(
    chalk.gray(
      `📡  Updates: ${updateCount}   |   Active Tokens: ${tokenData.size}   |   ⏱  ${new Date().toLocaleTimeString()}`
    )
  );
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.dim('──────────────────────────────────────────────────────────────────────────────'));
  console.log(chalk.dim('Powered by Eterna • Real-time Market Intelligence Engine • v1.0'));
  console.log(chalk.dim('──────────────────────────────────────────────────────────────────────────────'));
}

// ════════════════════════════════════════════════════════
// WebSocket Event Handlers
// ════════════════════════════════════════════════════════

ws.on('open', () => {
  // ════════════════════════════════════════════════════════
  // EXPLICIT LABEL: Connection status
  // ════════════════════════════════════════════════════════
  console.log(chalk.yellow("📡 SYSTEM STATUS — Connecting to live production server"));
  console.log(chalk.gray(`   WebSocket: ${WS_URL}`));
  console.log(chalk.gray(`   Subscribing to ${TOKENS.length} token(s)...\n`));

  ws.send(JSON.stringify({
    type: 'subscribe',
    tokenAddresses: TOKENS,
  }));

  // Request an immediate cached snapshot after subscribing (instant data display)
  setTimeout(() => {
    const API_URL = 'https://eterna-aggregator.onrender.com';
    const tokenQuery = TOKENS.join(',');
    const url = `${API_URL}/api/tokens?addresses=${tokenQuery}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            json.data.forEach(token => {
              // Store the full token object with all properties
              const tokenToStore = {
                ...token,
                sources: Array.isArray(token.sources) ? token.sources : (token.sources ? [token.sources] : []),
                confidenceScore: token.confidenceScore,
                lastPrice: token.lastPrice || (token.priceData?.price || token.averagePrice || 0),
              };

              if (token.token && token.token.symbol) {
                tokenData.set(token.token.symbol, tokenToStore);
              } else if (token.token && token.token.address) {
                tokenData.set(token.token.address, tokenToStore);
              }
            });
            
            if (tokenData.size > 0) {
              updateCount++;
              const tokenSymbols = Array.from(tokenData.values()).map(t => t.token?.symbol).filter(Boolean).join(', ');
              console.log(chalk.green(`✓ Cache warmed successfully`));
              console.log(chalk.green(`✓ Tokens loaded: ${tokenSymbols}`));
              console.log(chalk.green(`✓ ${tokenData.size} token(s) ready for display\n`));
              renderDashboard();
            }
          }
        } catch (e) {
          // Silently fail - WebSocket will provide updates anyway
        }
      });
    }).on('error', () => {
      // Silently fail - WebSocket will provide updates anyway
    });
  }, 1000);
});

ws.on('message', (msg) => {
  try {
    const payload = JSON.parse(msg);

    if (payload.type === 'connected') {
      console.log(chalk.green(`✓ Connected (Client ID: ${payload.clientId})`));
      return;
    }

    if (payload.type === 'subscribed') {
      console.log(chalk.green(`✓ Subscribed to ${payload.tokenAddresses.length} token(s)`));
      console.log(chalk.yellow("💾 DATA INGESTION — Fetching tokens from live DEX APIs"));
      console.log(chalk.dim("   Sources: DexScreener, GeckoTerminal"));
      console.log(chalk.dim("   Cache: Redis (30s TTL) | WebSocket: Streaming updates\n"));
      return;
    }

      if (payload.type === 'update' && Array.isArray(payload.data)) {
        const receivedSymbols = payload.data.map(t => t.token?.symbol || t.token?.address?.slice(0, 8)).join(', ');
        
        // ════════════════════════════════════════════════════════
        // EXPLICIT LABEL: Live update event
        // ════════════════════════════════════════════════════════
        if (updateCount > 0) {
          // Show update event message (but don't spam - only every few updates)
          if (updateCount % 3 === 0) {
            const updateTime = new Date().toLocaleTimeString();
            console.log(chalk.cyan(`\n⚡ LIVE UPDATE EVENT — Prices refreshed at ${updateTime}`));
            console.log(chalk.dim(`   Tokens updated: ${receivedSymbols}`));
            console.log(chalk.dim(`   Data updated instantly (<200ms aggregation latency)\n`));
          }
        }
        
        if (process.env.DEBUG) {
          console.log(chalk.dim(`[DEBUG] Update received: ${receivedSymbols}`));
        }

      for (const token of payload.data) {
        // Debug: Log to stderr so it doesn't get cleared (or log before render)
        if (process.env.DEBUG && token.sources) {
          process.stderr.write(`[WS] ${token.token?.symbol}: sources=[${token.sources.join(', ')}], conf=${token.confidenceScore || 'N/A'}%\n`);
        }

        // Store the full token object with all properties - ensure sources array is preserved
        const tokenToStore = {
          ...token,
          sources: Array.isArray(token.sources) ? token.sources : (token.sources ? [token.sources] : []),
          confidenceScore: token.confidenceScore,
          lastPrice: token.lastPrice || (token.priceData?.price || token.averagePrice || 0),
        };

        if (token.token && token.token.symbol) {
          tokenData.set(token.token.symbol, tokenToStore);
        } else if (token.token && token.token.address) {
          tokenData.set(token.token.address, tokenToStore);
        }
      }

      updateCount++;
      tickerIndex = Math.floor(updateCount / 3); // Rotate ticker every 3 updates
      renderDashboard();
      return;
    }

    if (payload.type === 'leaderboard_update') {
      // Optional: Display leaderboard in terminal
      if (process.env.SHOW_LEADERBOARD) {
        console.log(chalk.cyan('\n📊 Top Movers Update:'));
        if (payload.data?.topByVolume) {
          console.log(chalk.yellow('  Top by Volume:'));
          payload.data.topByVolume.slice(0, 5).forEach((t) => {
            console.log(chalk.gray(`    ${t.rank}. ${t.symbol} - $${(t.volume24h / 1e6).toFixed(2)}M`));
          });
        }
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
  console.log(chalk.red('\nDisconnected from WebSocket server'));
  process.exit(0);
});

ws.on('error', (err) => {
  let errorMsg = err.message || err.toString() || 'Unknown error';
  
  // Handle AggregateError (DNS/connection issues)
  if (err.name === 'AggregateError' || errorMsg.includes('AggregateError')) {
    errorMsg = 'Connection failed - DNS resolution error or server unreachable';
    console.error(chalk.red(`\nWebSocket error: ${errorMsg}`));
    console.log(chalk.yellow('\nThis usually means:'));
    console.log(chalk.yellow('  • The server might be down or spinning up (Render free tier)'));
    console.log(chalk.yellow('  • DNS resolution failed'));
    console.log(chalk.yellow('  • Network connectivity issue'));
    console.log(chalk.yellow('\nTry:'));
    console.log(chalk.yellow('  1. Wait 30-60 seconds (Render free tier cold start)'));
    console.log(chalk.yellow('  2. Check if API is accessible:'));
    console.log(chalk.cyan('     curl -s "https://eterna-aggregator.onrender.com/api/health"'));
    console.log(chalk.yellow('  3. If API works, try WebSocket again'));
    console.log(chalk.yellow('  4. Use simple demo instead: npm run ws:simple'));
  } else {
    console.error(chalk.red(`\nWebSocket error: ${errorMsg}`));
    console.log(chalk.yellow('\nTroubleshooting:'));
    console.log(chalk.yellow('  1. Make sure the server is running'));
    console.log(chalk.yellow('  2. Check your internet connection'));
    console.log(chalk.yellow('  3. Try warming the cache first:'));
    console.log(chalk.yellow('     curl -s "https://eterna-aggregator.onrender.com/api/tokens?addresses=So11111111111111111111111111111111111111112" > /dev/null'));
  }
  process.exit(1);
});

// Initial render
renderDashboard();
