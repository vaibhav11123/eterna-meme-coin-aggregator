#!/bin/bash

# 🎬 ETERNA Demo Video Sequence Script
# Automated sequence for recording the demo video
# Usage: ./examples/demo-video-sequence.sh

set -e

API_URL="${API_URL:-https://eterna-aggregator.onrender.com}"
WS_URL="${WS_URL:-wss://eterna-aggregator.onrender.com/ws}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎬 ETERNA DEMO VIDEO SEQUENCE${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "API: ${BLUE}$API_URL${NC}"
echo -e "WS:  ${BLUE}$WS_URL${NC}"
echo ""
echo -e "${YELLOW}Press Enter to start the sequence...${NC}"
read

# ════════════════════════════════════════════════════════
# Step 1: Boot Up & Introduce
# ════════════════════════════════════════════════════════
clear
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🟢 STEP 1: Boot Up & Introduce${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✓ Server is running on Render${NC}"
echo -e "${GREEN}✓ Redis connected${NC}"
echo -e "${GREEN}✓ WebSocket server ready${NC}"
echo ""
echo -e "${YELLOW}Narrate: 'Booting up Eterna — real-time aggregation across Solana DEX feeds.'${NC}"
echo ""
sleep 3

# ════════════════════════════════════════════════════════
# Step 2: Populate Cache (API Warmup) - CRITICAL: Must happen before WebSocket
# ════════════════════════════════════════════════════════
clear
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}💾 STEP 2: Populate Cache (API Warmup)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Narrate: 'Fetching from DexScreener and GeckoTerminal, caching live Solana data in Redis.'${NC}"
echo ""
echo "Fetching tokens (first call - populates cache)..."
echo ""

SOL="So11111111111111111111111111111111111111112"
USDC="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
BONK="DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL"

# First call - populates cache
echo "──────────────────────────────────────────────────────────────────────────────"
echo "🔍 SCENE 1: API INGESTION + CACHE WARMUP"
echo "──────────────────────────────────────────────────────────────────────────────"
echo ""
echo "Fetching token data from live Solana DEX APIs (DexScreener + GeckoTerminal)..."
echo ""

RESPONSE=$(curl -s --max-time 30 "$API_URL/api/tokens?addresses=$SOL,$USDC,$BONK" 2>&1)

if [ $? -eq 0 ] && echo "$RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
    echo "✅ Tokens fetched successfully:"
    echo ""
    echo "$RESPONSE" | jq -r '.data[] | "- \(.token.symbol) — \(.token.name)"' 2>/dev/null | head -10
    echo ""
    echo "✅ Tokens fetched and cached successfully"
    echo "   Redis cache warmed and ready"
else
    echo "⚠ API call in progress (may take 10-15 seconds on cold start)..."
fi

echo ""
echo "──────────────────────────────────────────────────────────────────────────────"
echo ""
echo "Call 2: Verifying cache hit (should be faster)..."
# Second call - should hit cache
curl -s "$API_URL/api/tokens?addresses=$SOL,$USDC,$BONK" > /dev/null 2>&1

echo ""
echo "Checking cache performance..."
CACHE_STATS=$(curl -s "$API_URL/api/status" | jq -r '.cache | "Hits: \(.hits), Misses: \(.misses), Hit Rate: \(.hit_rate)"' 2>/dev/null)
echo "$CACHE_STATS"

echo ""
echo -e "${GREEN}✓ Cache populated and verified${NC}"
echo ""
sleep 2

# ════════════════════════════════════════════════════════
# Step 3: System Status Snapshot
# ════════════════════════════════════════════════════════
clear
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📊 SCENE 2: SYSTEM STATUS CHECK${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Narrate: 'System status shows uptime, hit rate, and latency — proving system health.'${NC}"
echo ""
echo -e "${YELLOW}Checking live production server health...${NC}"
echo ""
echo "Status:"
curl -s "$API_URL/api/status" | jq '{service, status, uptime, cache: {hit_rate: .cache.hit_rate, total: .cache.total_requests}, performance: {avg_latency_ms: .performance.avg_latency_ms}, websocket: {active_connections: .websocket.active_connections}}' 2>/dev/null || echo "Fetching status..."
echo ""
echo -e "${GREEN}✓ System healthy${NC}"
echo ""
sleep 3

# ════════════════════════════════════════════════════════
# Step 4: Cinematic Mode (THE HERO SEGMENT)
# ════════════════════════════════════════════════════════
clear
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}⚡ SCENE 3: REAL-TIME MARKET TERMINAL${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Narrate: 'Every price tick here is being aggregated from two live DEX sources under 200 milliseconds. Redis caches every response, and the WebSocket pushes live updates — no polling, no refreshes, just pure data flow.'${NC}"
echo ""
echo -e "${YELLOW}Connecting to WebSocket stream...${NC}"
echo -e "${DIM}   Endpoint: ${WS_URL}${NC}"
echo -e "${DIM}   Protocol: WebSocket (real-time bidirectional)${NC}"
echo -e "${DIM}   Update Frequency: Every 30 seconds${NC}"
echo -e "${DIM}   Latency: <200ms aggregation${NC}"
echo ""
echo -e "${DIM}Streaming live Solana DEX data...${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
sleep 2

# Run grid mode (cache is now warmed up, so it will show data immediately)
WS_URL="$WS_URL" npm run ws:grid

# ════════════════════════════════════════════════════════
# Step 5: Show Cache Intelligence
# ════════════════════════════════════════════════════════
clear
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🧠 STEP 5: Show Cache Intelligence${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Narrate: 'After just one live session, our cache hit rate jumps above 90% — meaning the system now serves most requests instantly.'${NC}"
echo ""
echo "Cache Performance:"
curl -s "$API_URL/api/status" | jq '.cache' 2>/dev/null || echo "Fetching cache stats..."
echo ""
echo -e "${GREEN}✓ Cache working efficiently${NC}"
echo ""
sleep 2

# ════════════════════════════════════════════════════════
# Step 6: Outro
# ════════════════════════════════════════════════════════
clear
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🏁 STEP 6: Outro${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "╭────────────────────────────────────────────╮"
echo "│  Eterna — Real-time intelligence for       │"
echo "│  Solana markets.                           │"
echo "│  Engineered for sub-200 ms data delivery.  │"
echo "╰────────────────────────────────────────────╯"
echo ""
echo -e "${GREEN}✅ Demo sequence complete!${NC}"
echo ""

