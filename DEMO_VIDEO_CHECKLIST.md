# 🎬 Demo Video Checklist

Complete checklist for recording your 1-2 minute Eterna demo video.

## ✅ Pre-Recording Setup

- [ ] Terminal with black background (for cinematic look)
- [ ] Full-screen terminal window
- [ ] Screen recording software ready (OBS, QuickTime, etc.)
- [ ] Audio recording ready (optional voiceover)
- [ ] Production API is live: `https://eterna-aggregator.onrender.com`
- [ ] Cache warmed up (run `curl` to `/api/tokens` first)

## 📹 Video Scenes (Total: ~1m 30s)

### Scene 1: Intro (5s)
- [ ] Full-screen terminal
- [ ] Say: "This is Eterna — a real-time meme coin aggregator"
- [ ] Show: `npm run demo:complete` or manual sequence

### Scene 2: API Ingestion + Cache Warmup (15s)
- [ ] Run: `curl` to `/api/tokens` with multiple addresses
- [ ] Show formatted output (use `jq` for clean JSON)
- [ ] Narrate: "Fetching from DexScreener and GeckoTerminal, caching live Solana data in Redis"

### Scene 3: Caching Performance Test (10s)
- [ ] Run: 5 rapid API calls showing response times
- [ ] Show: First call (cache miss) vs subsequent calls (cache hits)
- [ ] Narrate: "Notice how subsequent calls are served from Redis cache in under 50ms"

### Scene 4: Real-Time WebSocket Grid (30s) ⭐ HERO SEGMENT
- [ ] Run: `npm run ws:grid` or `npm run ws:cinematic`
- [ ] Let it stream for 15-20 seconds showing live updates
- [ ] Show: Price changes, volume updates, confidence scores
- [ ] Narrate: "Every price tick here is being aggregated from two live DEX sources under 200 milliseconds. Redis caches every response, and the WebSocket pushes live updates — no polling, no refreshes, just pure data flow."

### Scene 5: Filtering & Sorting (10s)
- [ ] Run: `/api/top?metric=volume24h&limit=5`
- [ ] Run: `/api/top?metric=priceChangePercent24h&limit=5`
- [ ] Show: Different sorting results
- [ ] Narrate: "Flexible filtering and sorting by volume, price change, market cap, or liquidity"

### Scene 6: System Status (10s)
- [ ] Run: `curl /api/status | jq`
- [ ] Show: Uptime, cache hit rate, latency, WebSocket connections
- [ ] Narrate: "After just one live session, our cache hit rate jumps above 90% — meaning the system now serves most requests instantly"

### Scene 7: Outro (5s)
- [ ] Show: Final summary or tagline
- [ ] Display: "Engineered for sub-200ms aggregated price delivery"
- [ ] Show: GitHub repo link
- [ ] Fade out

## 🎯 Key Points to Emphasize

1. **Multi-Source Aggregation**: "Combines data from DexScreener, GeckoTerminal, and Jupiter"
2. **Real-Time Updates**: "WebSocket streaming eliminates polling overhead"
3. **Performance**: "Sub-200ms latency with Redis caching"
4. **Production-Ready**: "Live deployment on Render with comprehensive observability"

## 🛠️ Alternative: Automated Demo Script

Instead of manual recording, use the automated script:

```bash
npm run demo:complete
```

This script runs all scenes automatically with proper labeling and pauses.

## 📝 Post-Recording

- [ ] Edit video (trim, add transitions)
- [ ] Add background music (optional, chill synthwave works well)
- [ ] Upload to YouTube
- [ ] Add link to README.md
- [ ] Update README.md with video link

## 🎬 Multi-Client WebSocket Demo (Optional Bonus)

For extra credit, show two terminals side-by-side:

```bash
# Terminal 1
npm run ws:grid

# Terminal 2 (in another terminal)
npm run ws:simple
```

Both should show synchronized updates, proving real-time broadcast works.

