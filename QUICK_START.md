# 🚀 Quick Start Guide

## Your Aggregator is LIVE! 🎉

Everything is working:
- ✅ DexScreener API integration
- ✅ GeckoTerminal API integration  
- ✅ Data aggregation & merging
- ✅ Redis caching
- ✅ WebSocket real-time updates
- ✅ Express REST API

## 🎬 Demo Commands

### 1. Test REST API
```bash
# Single token
curl "http://localhost:3000/api/tokens?addresses=So11111111111111111111111111111111111111112"

# Multiple tokens
curl "http://localhost:3000/api/tokens?addresses=So11111111111111111111111111111111111111112,DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL"
```

### 2. Test WebSocket Live Feed
```bash
# In a new terminal (while server is running)
npm run ws:test

# Or with a specific token
node examples/websocket-live-test.js DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL
```

### 3. Test Multiple Tokens
```bash
npm run test:tokens
```

### 4. Test Cache Performance
```bash
# First request (hits APIs)
time curl "http://localhost:3000/api/tokens?addresses=So11111111111111111111111111111111111111112"

# Second request (from cache - should be < 50ms)
time curl "http://localhost:3000/api/tokens?addresses=So11111111111111111111111111111111111111112"
```

## 📊 What You're Seeing

### REST API Response
```json
{
  "success": true,
  "data": [{
    "token": {
      "address": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "name": "Wrapped SOL"
    },
    "priceData": {
      "price": 161.98,
      "volume24h": 548724744.54
    },
    "sources": ["dexscreener", "geckoterminal"],
    "bestPrice": 161.98,
    "averagePrice": 161.81,
    "totalVolume24h": 548724744.54,
    "lastUpdated": 1762546123123
  }],
  "count": 1
}
```

### WebSocket Updates
- Real-time price changes
- Volume updates
- Multi-source aggregation
- Automatic refresh every 30 seconds

## 🎯 Demo Flow

1. **Start server**: `npm run dev`
2. **Show REST API**: Make a curl request
3. **Show WebSocket**: Run `npm run ws:test` in another terminal
4. **Show caching**: Make the same request twice, show speed difference
5. **Show multiple tokens**: Test with BONK, USDC, etc.

## 🔥 Production Ready Features

- ✅ Error handling & retry logic
- ✅ Rate limiting protection
- ✅ Redis caching (30s TTL)
- ✅ Graceful degradation (works without Redis)
- ✅ Comprehensive logging
- ✅ WebSocket heartbeat/keepalive
- ✅ Multi-source data merging
- ✅ TypeScript type safety

## 📈 Next Steps (Optional)

- Add Jupiter price API for additional price sources
- Add Prometheus metrics
- Add rate limit monitoring dashboard
- Add more chains (Ethereum, BSC, etc.)

Your aggregator is **production-ready** and **fully operational**! 🚀

