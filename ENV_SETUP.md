# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the project root with the following:

```env
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379

# API Base URLs
DEXSCREENER_BASE_URL=https://api.dexscreener.com/latest/dex
GECKO_BASE_URL=https://api.geckoterminal.com/api/v2/networks/solana
JUPITER_BASE_URL=https://price.jup.ag/v4

# Optional: Rate Limiting
DEXSCREENER_RATE_LIMIT_PER_MINUTE=60
GECKOTERMINAL_RATE_LIMIT_PER_MINUTE=60

# Optional: Cache Settings
CACHE_TTL_SECONDS=30
CACHE_KEY_PREFIX=meme_coin:
```

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   # Edit .env with the values above
   ```

2. **Start Redis:**
   ```bash
   # Using Docker
   docker-compose up -d redis
   
   # Or using local Redis
   redis-server
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

## Testing Real API Calls

Test with real Solana token addresses:

```bash
# Wrapped SOL
curl "http://localhost:3000/api/tokens?addresses=So11111111111111111111111111111111111111112"

# Example meme coin
curl "http://localhost:3000/api/tokens?addresses=DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL"
```

Expected response format:
```json
{
  "success": true,
  "data": [
    {
      "token": {
        "address": "So11111111111111111111111111111111111111112",
        "symbol": "SOL",
        "name": "Wrapped SOL"
      },
      "priceData": {
        "price": 162.31,
        "volume24h": 123456.7,
        "liquidity": 500000
      },
      "sources": ["dexscreener", "geckoterminal"],
      "chains": ["solana"],
      "averagePrice": 162.31,
      "totalVolume24h": 123456.7,
      "lastUpdated": 1762546123123
    }
  ],
  "count": 1,
  "timestamp": 1762546123123
}
```

## Features

✅ **Real API Integration**: Fetches live data from DexScreener, GeckoTerminal, and Jupiter  
✅ **Exponential Backoff**: Automatic retry with backoff for rate limit errors (429, 503)  
✅ **Redis Caching**: 30-second cache to reduce API calls  
✅ **Error Handling**: Graceful degradation if one source fails  
✅ **Rate Limiting**: Built-in rate limiting to stay under API limits  

## Rate Limiting

The fetchers include:
- **Exponential backoff**: 300ms, 600ms, 900ms delays on retry
- **Max 3 attempts** per request
- **Only retries** on 429 (Too Many Requests) and 503 (Service Unavailable)
- **Per-minute limits**: Configurable via environment variables

## Troubleshooting

### Empty data arrays
- Check that Redis is running: `redis-cli ping` should return `PONG`
- Verify API endpoints are accessible
- Check logs for API errors

### Rate limit errors
- Increase `CACHE_TTL_SECONDS` to cache longer
- Reduce concurrent requests
- Check rate limit settings in `.env`

### Connection errors
- Ensure Redis is accessible at `REDIS_HOST:REDIS_PORT`
- Check network connectivity to API endpoints
- Verify API base URLs in `.env`

