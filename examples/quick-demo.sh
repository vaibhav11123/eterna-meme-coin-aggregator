#!/bin/bash

# 🎬 Quick Demo Script - Warms cache then launches cinematic
# This ensures the WebSocket feed shows data immediately

set -e

API_URL="${API_URL:-https://eterna-aggregator.onrender.com}"
WS_URL="${WS_URL:-wss://eterna-aggregator.onrender.com/ws}"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎬 ETERNA QUICK DEMO${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Warm up cache (CRITICAL - must happen before WebSocket)
echo -e "${YELLOW}Step 1: Warming up cache...${NC}"
echo ""

SOL="So11111111111111111111111111111111111111112"
USDC="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
BONK="DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL"

echo "Fetching tokens (populating cache)..."
echo "  (This may take 10-15 seconds on first call due to cold start...)"
RESPONSE=$(curl -s --max-time 30 "$API_URL/api/tokens?addresses=$SOL,$USDC,$BONK" 2>&1)

if [ $? -eq 0 ] && echo "$RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
    echo "$RESPONSE" | jq -r '.data[] | "  ✓ \(.token.symbol) - $\(.priceData.price) - Sources: \([.sources[]] | join(", "))"' 2>/dev/null | head -3
    echo ""
    echo "Verifying cache (second call should be faster)..."
    curl -s --max-time 15 "$API_URL/api/tokens?addresses=$SOL,$USDC,$BONK" > /dev/null 2>&1
    
    CACHE_INFO=$(curl -s --max-time 10 "$API_URL/api/status" | jq -r '.cache | "Hit Rate: \(.hit_rate) (Hits: \(.hits), Misses: \(.misses))"' 2>/dev/null)
    if [ -n "$CACHE_INFO" ]; then
        echo -e "${GREEN}✓ Cache ready: $CACHE_INFO${NC}"
    else
        echo -e "${YELLOW}⚠ Cache status unavailable, but proceeding...${NC}"
    fi
else
    echo -e "${YELLOW}⚠ API call failed or timed out. This might be a cold start.${NC}"
    echo -e "${YELLOW}   The WebSocket will still work, but may take longer to show data.${NC}"
    echo -e "${YELLOW}   Continuing anyway...${NC}"
fi
echo ""
sleep 2

# Step 2: Launch cinematic
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}⚡ Step 2: Launching Cinematic WebSocket Feed${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Cache is pre-warmed, so you'll see data immediately!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""
sleep 2

# Launch WebSocket demo (using simple version for reliability)
echo -e "${YELLOW}Choose demo mode:${NC}"
echo "  1. Simple demo (recommended - always works)"
echo "  2. Cinematic demo (Bloomberg-style)"
echo ""
read -p "Enter choice (1 or 2, default 1): " choice
choice=${choice:-1}

if [ "$choice" = "2" ]; then
    WS_URL="$WS_URL" npm run ws:cinematic
else
    WS_URL="$WS_URL" npm run ws:simple
fi

