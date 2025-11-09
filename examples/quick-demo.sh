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
curl -s "$API_URL/api/tokens?addresses=$SOL,$USDC,$BONK" | jq -r '.data[] | "  ✓ \(.token.symbol) - $\(.priceData.price) - Sources: \([.sources[]] | join(", "))"' 2>/dev/null | head -3

echo ""
echo "Verifying cache (second call should be faster)..."
curl -s "$API_URL/api/tokens?addresses=$SOL,$USDC,$BONK" > /dev/null 2>&1

CACHE_INFO=$(curl -s "$API_URL/api/status" | jq -r '.cache | "Hit Rate: \(.hit_rate) (Hits: \(.hits), Misses: \(.misses))"' 2>/dev/null)
echo -e "${GREEN}✓ Cache ready: $CACHE_INFO${NC}"
echo ""
sleep 1

# Step 2: Launch cinematic
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}⚡ Step 2: Launching Cinematic WebSocket Feed${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Cache is pre-warmed, so you'll see data immediately!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""
sleep 2

# Launch cinematic with production URL
WS_URL="$WS_URL" npm run ws:cinematic

