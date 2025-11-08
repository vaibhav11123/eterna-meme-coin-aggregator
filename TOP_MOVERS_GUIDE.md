# 🔥 Top Movers Leaderboard

## 🎯 What It Does

The `/api/top` endpoint provides a **real-time leaderboard** of tokens ranked by:
- **Volume 24h** - Highest trading volume
- **Price Change %** - Biggest price movers
- **Market Cap** - Largest market capitalization
- **Liquidity** - Highest liquidity pools

All data comes from **Redis cache** - blazing fast (< 50ms response time).

## 🚀 Quick Start

### REST API

```bash
# Top 10 by volume (default)
curl "http://localhost:3000/api/top?metric=volume24h&limit=10"

# Top 5 biggest price movers
curl "http://localhost:3000/api/top?metric=priceChangePercent24h&limit=5"

# Top 20 by market cap
curl "http://localhost:3000/api/top?metric=marketCap&limit=20"
```

### WebSocket Streaming

The leaderboard automatically streams via WebSocket every **60 seconds**:

```javascript
ws.on('message', (msg) => {
  const payload = JSON.parse(msg);
  
  if (payload.type === 'leaderboard_update') {
    console.log('Top by Volume:', payload.data.topByVolume);
    console.log('Top by Change:', payload.data.topByChange);
  }
});
```

## 📊 Example Response

```json
{
  "success": true,
  "count": 10,
  "metric": "volume24h",
  "interval": "24h",
  "data": [
    {
      "rank": 1,
      "token": {
        "address": "So11111111111111111111111111111111111111112",
        "symbol": "SOL",
        "name": "Wrapped SOL"
      },
      "priceData": {
        "price": 161.98,
        "volume24h": 548724744.54,
        "priceChange24h": 5.2,
        "priceChangePercent24h": 3.21,
        "liquidity": 1296800000,
        "marketCap": 0
      },
      "sources": ["dexscreener", "geckoterminal"],
      "chains": ["solana"],
      "lastUpdated": 1762546123123
    }
  ],
  "timestamp": 1762546123123
}
```

## 🎬 Demo Usage

### For Your Video

1. **Show REST API:**
   ```bash
   curl "http://localhost:3000/api/top?metric=volume24h&limit=5" | jq
   ```

2. **Show WebSocket Streaming:**
   - Connect to WebSocket
   - Wait 60 seconds
   - Show `leaderboard_update` messages arriving

3. **Compare Metrics:**
   ```bash
   # Volume leaders
   curl "http://localhost:3000/api/top?metric=volume24h&limit=5"
   
   # Price movers
   curl "http://localhost:3000/api/top?metric=priceChangePercent24h&limit=5"
   ```

## 💡 Use Cases

- **Trading Dashboard**: Show "Top Movers" widget
- **Analytics**: Identify trending tokens
- **Research**: Find high-volume pairs
- **Demo**: Showcase filtering & sorting capabilities

## ⚡ Performance

- **Response Time**: < 50ms (from Redis cache)
- **Update Frequency**: Every 60 seconds via WebSocket
- **Data Source**: All cached tokens from Redis
- **Max Results**: 100 tokens per request

## 🔧 Configuration

The leaderboard uses all tokens currently cached in Redis. To populate:

1. Make API calls to `/api/tokens` with various token addresses
2. Tokens get cached automatically
3. Leaderboard reads from cache

## 🎯 Next Steps

Want to extend it? Easy additions:
- Add time-based filtering (1h, 24h, 7d)
- Add chain filtering (Solana, Ethereum, etc.)
- Add price range filtering
- Add custom sorting combinations

The foundation is there - just extend the sorting logic! 🚀

