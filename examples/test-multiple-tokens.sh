#!/bin/bash

# Test script to check multiple tokens at once

echo "🧪 Testing Eterna Aggregator with Multiple Tokens"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test tokens (Solana addresses)
declare -a tokens=(
  "So11111111111111111111111111111111111111112"  # Wrapped SOL
  "DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL"  # BONK
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"  # USDC
)

for token in "${tokens[@]}"; do
  echo -e "${BLUE}Testing token: ${token}${NC}"
  echo "----------------------------------------"
  
  response=$(curl -s "http://localhost:3000/api/tokens?addresses=${token}")
  
  success=$(echo $response | grep -o '"success":true' || echo "")
  count=$(echo $response | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
  
  if [ ! -z "$success" ] && [ "$count" -gt "0" ]; then
    echo -e "${GREEN}✅ Success! Found ${count} token(s)${NC}"
    
    # Extract key data
    symbol=$(echo $response | grep -o '"symbol":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "N/A")
    price=$(echo $response | grep -o '"price":[0-9.]*' | head -1 | cut -d':' -f2 || echo "N/A")
    volume=$(echo $response | grep -o '"totalVolume24h":[0-9.]*' | head -1 | cut -d':' -f2 || echo "N/A")
    
    echo "   Symbol: $symbol"
    echo "   Price: \$$price"
    echo "   Volume 24h: \$$volume"
  else
    echo -e "${YELLOW}⚠️  No data returned${NC}"
  fi
  
  echo ""
done

echo "================================================"
echo "✅ Testing complete!"

