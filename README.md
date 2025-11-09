#  Eterna Meme Coin Aggregator

**Real-time aggregation of Solana meme coin data from multiple DEX sources** — DexScreener, GeckoTerminal, and Jupiter — with Redis caching and WebSocket live updates.

> **Engineered for institutional-grade speed** — sub-200ms aggregated price delivery across live Solana DEX feeds.

> *Eterna's aggregator merges 3 live DEX feeds under 200ms median latency using a Redis-backed caching layer.*

 **Live API:** https://eterna-aggregator.onrender.com  
 **Demo Video:** https://youtu.be/G21dH75YuZU  
 **Tech:** Node.js • TypeScript • Redis • WebSockets • Docker

##  Key Features

-  **Real-time Updates**: WebSocket support for live price updates (30s refresh)
-  **Multi-Source Aggregation**: Combines data from DexScreener, GeckoTerminal, and Jupiter
-  **Redis Caching**: Sub-100ms response times with 30s TTL caching
-  **Rate Limiting**: Built-in rate limiting with exponential backoff
-  **Metrics & Observability**: Built-in metrics endpoint for performance monitoring
-  **Cursor-based Pagination**: Efficient pagination with `limit` and `next_cursor` for large datasets
-  **Time Period Filtering**: Supports `1h`, `24h`, and `7d` intervals with adaptive scaling
-  **Advanced Sorting**: Sort by volume, price change, market cap, or liquidity
-  **Docker Support**: One-command deployment with Docker Compose
-  **Type-Safe**: Full TypeScript implementation with strict types
-  **Tested**: Comprehensive test suite with CI/CD integration
-  **Cinematic Demos**: Professional terminal clients for showcasing

##  System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│  (Web Frontend / Mobile / Terminal Clients / WebSocket)     │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    HTTP REST API          WebSocket (ws://)
         │                       │
┌────────▼────────┐    ┌─────────▼─────────┐
│  Express Server │    │  WebSocket Server │
│  (Port 3000)    │    │  (Real-time Push) │
└────────┬────────┘    └─────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │  Aggregator Service   │
         │  (Data Merging Logic) │
         └───────────┬───────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼────┐    ┌──────▼──────┐  ┌─────▼─────┐
│DexScreener│ │GeckoTerminal│  │  Jupiter  │
│   API     │ │    API      │  │   API     │
└──────────┘  └──────────────┘ └───────────┘
    │                │                │
    └────────────────┼────────────────┘
                     │
            ┌────────▼────────┐
            │  Redis Cache    │
            │  (30s TTL)      │
            │  (Rate Limiting)│
            └─────────────────┘
```

### Key Design Decisions

- **Multi-Source Aggregation**: Merges data from 3 independent APIs for accuracy
- **Redis Caching**: 30-second TTL reduces API calls by ~95%
- **WebSocket Updates**: Real-time push eliminates polling overhead
- **Rate Limiting**: Exponential backoff protects against API throttling
- **Graceful Degradation**: Works without Redis (just slower)

### Request Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                                 │
│              Average Latency: ~45ms (cached)                    │
│              Average Latency: ~180ms (cache miss)              │
└─────────────────────────────────────────────────────────────────┘

1. Client Request
   ↓
2. Express API Layer (Rate Limiting + Validation)
   ↓
3. Aggregator Service
   ├─→ Check Redis Cache (30s TTL)
   │   ├─ Cache Hit → Return (< 50ms) ✅
   │   └─ Cache Miss → Continue
   ↓
4. Parallel API Fetching
   ├─→ DexScreener API (price, volume, liquidity)
   ├─→ GeckoTerminal API (price, volume, liquidity)
   └─→ Jupiter API (price validation)
   ↓
5. Data Merging & Enrichment
   ├─→ Merge duplicate tokens by address
   ├─→ Calculate average price from all sources
   ├─→ Compute confidence score (price agreement)
   ├─→ Aggregate volumes & liquidities
   └─→ Enrich missing fields from best source
   ↓
6. Cache Result (Redis, 30s TTL)
   ↓
7. Return Aggregated Data

┌─────────────────────────────────────────────────────────────────┐
│                    WEBSOCKET FLOW                               │
└─────────────────────────────────────────────────────────────────┘

1. Client Connects → WebSocket Server
   ↓
2. Client Subscribes to Token Addresses
   ↓
3. Server Sends Initial Snapshot (from cache)
   ↓
4. Update Loop (every 30s)
   ├─→ Fetch fresh data via Aggregator Service
   ├─→ Compare with cached data
   └─→ Broadcast updates to subscribed clients
   ↓
5. Real-time Push to All Connected Clients

┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-SOURCE MERGING                         │
└─────────────────────────────────────────────────────────────────┘

Token Address: 0xABC...

DexScreener Data:        GeckoTerminal Data:      Jupiter Data:
├─ Price: $1.50          ├─ Price: $1.52         └─ Price: $1.51
├─ Volume: $1M           ├─ Volume: $800K
└─ Liquidity: $500K      └─ Liquidity: $450K
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ↓
                    Aggregator Service
                                 ↓
                    ┌────────────────────┐
                    │  Merged Result     │
                    ├────────────────────┤
                    │ Price: $1.51       │ (average)
                    │ Volume: $1.8M      │ (sum)
                    │ Liquidity: $950K   │ (sum)
                    │ Sources: [dex,     │
                    │         gecko,     │
                    │         jupiter]   │
                    │ Confidence: 98.5%  │ (price spread)
                    └────────────────────┘
                                 ↓
                    Cache in Redis (30s)
                                 ↓
                    Return to Client
```

### Performance Characteristics

- **Cache Hit Latency**: < 50ms (Redis in-memory)
- **Cache Miss Latency**: 150-300ms (parallel API calls + merge)
- **WebSocket Update Frequency**: 30 seconds
- **Cache Hit Rate**: ~85-95% (30s TTL)
- **API Call Reduction**: ~95% (thanks to caching)
- **Multi-Source Confidence**: 70-100% (based on price agreement)

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (optional)
- Redis (or use Docker Compose)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vaibhav11123/eterna-meme-coin-aggregator.git
cd eterna-meme-coin-aggregator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start Redis (if not using Docker):
```bash
redis-server
```

5. Build and run:
```bash
npm run build
npm start
```

Or for development:
```bash
npm run dev
```

### Docker Setup

1. Build and start all services:
```bash
docker-compose up -d
```

2. View logs:
```bash
docker-compose logs -f app
```

3. Stop services:
```bash
docker-compose down
```

## API Endpoints

### REST API

#### GET `/api/tokens`
Get aggregated token data for specific addresses with cursor-based pagination and time period filtering.

**Query Parameters:**
- `addresses` (required): Comma-separated list of token addresses
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `cursor` (optional): Base64-encoded cursor for pagination (from previous response)
- `interval` (optional): Time period filter - `1h` | `24h` | `7d` (default: `24h`)

**Example:**
```bash
# First page
curl "http://localhost:3000/api/tokens?addresses=0x123,0x456&limit=20&interval=24h"

# Next page using cursor
curl "http://localhost:3000/api/tokens?addresses=0x123,0x456&limit=20&cursor=eyJpbmRleCI6MjB9"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "token": {
        "address": "0x123",
        "symbol": "PEPE",
        "name": "Pepe Token"
      },
      "priceData": {
        "price": 0.001,
        "priceChange24h": 5.2,
        "volume24h": 1000000,
        "liquidity": 500000
      },
      "sources": ["dexscreener", "geckoterminal"],
      "chains": ["ethereum"],
      "bestPrice": 0.001,
      "averagePrice": 0.001,
      "totalVolume24h": 1000000,
      "totalLiquidity": 500000,
      "lastUpdated": 1234567890
    }
  ],
  "count": 1,
  "next_cursor": "eyJpbmRleCI6MjB9",
  "has_more": true,
  "interval": "24h",
  "timestamp": 1234567890
}
```

#### GET `/api/search`
Search for tokens by name or symbol with cursor-based pagination and time period filtering.

**Query Parameters:**
- `query` (required): Search query string
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `cursor` (optional): Base64-encoded cursor for pagination (from previous response)
- `interval` (optional): Time period filter - `1h` | `24h` | `7d` (default: `24h`)

**Example:**
```bash
curl "http://localhost:3000/api/search?query=pepe&limit=20&interval=1h"
```

#### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890,
  "uptime": 3600
}
```

#### GET `/api/status`
Comprehensive service status and observability endpoint. Returns real-time metrics, cache performance, WebSocket connections, and system health.

**Response:**
```json
{
  "service": "Eterna Meme Coin Aggregator",
  "version": "1.0.0",
  "status": "healthy",
  "uptime": "2h 15m",
  "uptime_seconds": 8100,
  "cache": {
    "hits": 142,
    "misses": 6,
    "hit_rate": "95.93%",
    "total_requests": 148
  },
  "performance": {
    "avg_latency_ms": 45,
    "requests_last_minute": 12,
    "source_latencies": {
      "dexscreener": 120,
      "geckoterminal": 135
    }
  },
  "websocket": {
    "active_connections": 3
  },
  "timestamp": "2025-11-08T18:47:32.112Z"
}
```

**Example:**
```bash
curl "http://localhost:3000/api/status"
```

#### GET `/api/top`
Top Movers Leaderboard - Ranked tokens by volume, price change, or market cap with cursor-based pagination and time period filtering.

**Query Parameters:**
- `metric` (optional): `volume24h` | `priceChangePercent24h` | `marketCap` | `liquidity` (default: `volume24h`)
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `cursor` (optional): Base64-encoded cursor for pagination (from previous response)
- `interval` (optional): `1h` | `24h` | `7d` (default: `24h`) - applies adaptive scaling to metrics

**Example:**
```bash
# First page
curl "http://localhost:3000/api/top?metric=volume24h&limit=20&interval=24h"

# Next page with 1-hour interval
curl "http://localhost:3000/api/top?metric=priceChangePercent24h&limit=20&interval=1h&cursor=eyJpbmRleCI6MjB9"
```

**Response:**
```json
{
  "success": true,
  "count": 5,
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
        "liquidity": 1296800000
      },
      "sources": ["dexscreener", "geckoterminal"],
      "chains": ["solana"],
      "lastUpdated": 1762546123123
    }
  ],
  "timestamp": 1762546123123
}
```

**Performance:** Returns instantly from Redis cache (< 50ms)

#### GET `/api/metrics`
Analytics dashboard endpoint with performance metrics.

**Response:**
```json
{
  "requests_last_min": 140,
  "requests_total": 1250,
  "cache_hit_rate": 0.83,
  "cache_hits": 116,
  "cache_misses": 24,
  "avg_latency_ms": 212,
  "source_latencies": {
    "dexscreener": 182,
    "geckoterminal": 201,
    "jupiter": 45
  },
  "timestamp": 1762546123123
}
```

#### GET `/debug/health` (Development Only)
Enhanced health check with Redis status and metrics.

#### GET `/debug/sources` (Development Only)
Shows active API sources with latency statistics.

#### GET `/debug/cache/:key` (Development Only)
Inspect cached data for a specific key.

### WebSocket API

Connect to `ws://localhost:3000/ws` for real-time updates.

#### Messages

**Subscribe to tokens:**
```json
{
  "type": "subscribe",
  "tokenAddresses": ["0x123", "0x456"]
}
```

**Unsubscribe:**
```json
{
  "type": "unsubscribe",
  "tokenAddresses": ["0x123"]
}
```

**Ping (heartbeat):**
```json
{
  "type": "ping"
}
```

#### Server Messages

**Connected:**
```json
{
  "type": "connected",
  "clientId": "client_1234567890_abc123",
  "timestamp": 1234567890
}
```

**Update:**
```json
{
  "type": "update",
  "data": [
    {
      "token": { "address": "0x123", "symbol": "PEPE" },
      "priceData": { "price": 0.001 },
      "sources": ["dexscreener"],
      "lastUpdated": 1234567890
    }
  ],
  "timestamp": 1234567890
}
```

**Pong:**
```json
{
  "type": "pong",
  "timestamp": 1234567890
}
```

## Configuration

Environment variables (see `.env.example`):

- `PORT`: Server port (default: 3000)
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `CACHE_TTL_SECONDS`: Cache TTL in seconds (default: 30)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: 60000)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

**Test Coverage:**
-  API client tests (DexScreener, GeckoTerminal, Jupiter)
-  Aggregator service tests (merging logic)
-  Cache TTL tests
-  Rate limiting tests
-  Metrics collection tests
-  API route tests

**CI/CD:** Tests run automatically on push via GitHub Actions

## Project Structure

```
Eterna/
├── src/
│   ├── clients/          # API clients (DexScreener, GeckoTerminal)
│   ├── services/         # Business logic (Aggregator, Redis, WebSocket)
│   ├── routes/           # Express routes
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utilities (logger, etc.)
│   ├── config/           # Configuration
│   ├── types/            # TypeScript types
│   └── index.ts          # Entry point
├── tests/                # Test files
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile           # Docker image definition
└── package.json         # Dependencies and scripts
```

## Rate Limiting

The API implements rate limiting using Redis:
- Default: 100 requests per 60 seconds per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Status: 429 Too Many Requests when exceeded

## Caching Strategy

- **Cache TTL**: 30 seconds (configurable)
- **Cache Keys**: Prefixed with `meme_coin:`
- **Cache Invalidation**: Automatic TTL expiration
- **Cache Layers**: 
  - Individual API responses
  - Aggregated results
  - Search results

## Error Handling

- All errors are logged with Winston
- API errors return appropriate HTTP status codes
- WebSocket errors send error messages to clients
- Graceful degradation if one data source fails

## Performance

- Parallel API calls to multiple sources
- Redis caching reduces external API calls
- WebSocket for efficient real-time updates
- Connection pooling for Redis

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.

