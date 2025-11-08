# WebSocket Live Price Feed Demo

## 🚀 Quick Start

### 1. Start the Server
```bash
npm run dev
```

### 2. Run the WebSocket Test Client
In a new terminal:
```bash
npm run ws:test
```

Or with a specific token:
```bash
node examples/websocket-live-test.js DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL
```

## 📊 What You'll See

The test client will display:
- **Real-time price updates** every 30 seconds (or when data changes)
- **Current price, best price, average price**
- **24h price change** with color coding (green for up, red for down)
- **Volume and liquidity** data
- **Source information** (which APIs provided the data)
- **Update counter** to track how many updates you've received

## 🎯 Example Output

```
╔════════════════════════════════════════════════════════════╗
║  🚀 ETERNA MEME COIN AGGREGATOR - LIVE PRICE FEED  ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOL (Wrapped SOL)
Address: So11111111111111111...

💰 Price Data:
   Current:     $161.98
   Best Price:  $162.15
   Avg Price:   $161.81
   24h Change:  📈 +2.45%

📊 Market Data:
   Volume 24h:  $548.72M
   Liquidity:   $1.2B
   Market Cap:  $75.3B

🔗 Sources: dexscreener, geckoterminal
⛓️  Chains: solana

🕐 Last Updated: 3:45:23 PM
📡 Update #42
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔧 Testing Multiple Tokens

Test several tokens at once:
```bash
npm run test:tokens
```

This will test:
- Wrapped SOL
- BONK
- USDC

## 📡 WebSocket API

### Connect
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
```

### Subscribe
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  tokenAddresses: ['So11111111111111111111111111111111111111112']
}));
```

### Receive Updates
```javascript
ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'update') {
    console.log('Price update:', message.data);
  }
});
```

## 🎬 Demo Video Tips

1. **Start the server** in one terminal
2. **Run the WebSocket client** in another terminal
3. **Show the live updates** refreshing every 30 seconds
4. **Test with different tokens** to show it works for any Solana token
5. **Show the cache working** - first request takes time, subsequent ones are instant

## 🚀 Production Features

- ✅ Real-time price updates
- ✅ Multi-source aggregation
- ✅ Automatic reconnection
- ✅ Heartbeat/ping to keep connection alive
- ✅ Graceful error handling
- ✅ Beautiful terminal output with colors

Enjoy your live price feed! 🎉

