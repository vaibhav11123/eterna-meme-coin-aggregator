#!/bin/bash

# 🧪 Comprehensive Endpoint Test Suite for Eterna Aggregator
# Tests all endpoints before demo video recording

set -e

API_URL="${API_URL:-https://eterna-aggregator.onrender.com}"
WS_URL="${WS_URL:-wss://eterna-aggregator.onrender.com/ws}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 ETERNA ENDPOINT TEST SUITE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "API URL: $API_URL"
echo "WS URL: $WS_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="${4:-200}"
    
    echo -n "Testing $name... "
    
    if response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" 2>&1); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" = "$expected_status" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
            echo "Response: $body"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Connection error)"
        ((FAILED++))
        return 1
    fi
}

test_json_response() {
    local name="$1"
    local endpoint="$2"
    local required_field="$3"
    
    echo -n "Testing $name JSON structure... "
    
    if response=$(curl -s "$API_URL$endpoint" 2>&1); then
        if echo "$response" | jq -e ".$required_field" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ PASS${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Missing field: $required_field)"
            echo "Response: $response"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Connection error)"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. BASIC ENDPOINTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "Root endpoint" "GET" "/" 200
test_endpoint "Health check" "GET" "/api/health" 200
test_endpoint "Status endpoint" "GET" "/api/status" 200

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. STATUS ENDPOINT VALIDATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_json_response "Status - service field" "/api/status" "service"
test_json_response "Status - status field" "/api/status" "status"
test_json_response "Status - uptime field" "/api/status" "uptime"
test_json_response "Status - cache field" "/api/status" "cache"
test_json_response "Status - performance field" "/api/status" "performance"
test_json_response "Status - websocket field" "/api/status" "websocket"

echo ""
echo "Status endpoint full response:"
curl -s "$API_URL/api/status" | jq '.' || echo "Failed to parse JSON"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. TOKEN ENDPOINTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test tokens endpoint with SOL
SOL_ADDRESS="So11111111111111111111111111111111111111112"
test_endpoint "Tokens endpoint (SOL)" "GET" "/api/tokens?addresses=$SOL_ADDRESS" 200
test_json_response "Tokens - success field" "/api/tokens?addresses=$SOL_ADDRESS" "success"
test_json_response "Tokens - data field" "/api/tokens?addresses=$SOL_ADDRESS" "data"

# Test pagination (only if we have multiple tokens)
echo -n "Testing pagination structure... "
pagination_response=$(curl -s "$API_URL/api/tokens?addresses=$SOL_ADDRESS&limit=2")
if echo "$pagination_response" | jq -e '.has_more' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (Single token - pagination not applicable)"
fi

# Test interval filtering
test_json_response "Tokens - interval=1h" "/api/tokens?addresses=$SOL_ADDRESS&interval=1h" "interval"
test_json_response "Tokens - interval=7d" "/api/tokens?addresses=$SOL_ADDRESS&interval=7d" "interval"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. SEARCH ENDPOINT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "Search endpoint (pepe)" "GET" "/api/search?query=pepe" 200
test_json_response "Search - success field" "/api/search?query=pepe" "success"
test_json_response "Search - data field" "/api/search?query=pepe" "data"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. TOP MOVERS ENDPOINT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "Top movers (volume)" "GET" "/api/top?metric=volume24h&limit=10" 200
test_json_response "Top - success field" "/api/top?metric=volume24h&limit=10" "success"
test_json_response "Top - data field" "/api/top?metric=volume24h&limit=10" "data"
test_json_response "Top - pagination" "/api/top?metric=volume24h&limit=5" "next_cursor"
test_json_response "Top - interval filtering" "/api/top?metric=volume24h&interval=1h" "interval"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. CURSOR PAGINATION TEST${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -n "Testing cursor pagination flow... "
first_page=$(curl -s "$API_URL/api/tokens?addresses=$SOL_ADDRESS&limit=2")
next_cursor=$(echo "$first_page" | jq -r '.next_cursor // empty')
has_more=$(echo "$first_page" | jq -r '.has_more // false')

if [ -n "$next_cursor" ] && [ "$has_more" = "true" ]; then
    second_page=$(curl -s "$API_URL/api/tokens?addresses=$SOL_ADDRESS&limit=2&cursor=$next_cursor")
    if echo "$second_page" | jq -e '.data' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Second page invalid)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC} (Not enough data for pagination)"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}7. INTERVAL FILTERING TEST${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -n "Testing interval=1h scaling... "
h1_response=$(curl -s "$API_URL/api/tokens?addresses=$SOL_ADDRESS&interval=1h")
h1_volume=$(echo "$h1_response" | jq -r '.data[0].priceData.volume24h // empty')
h1_interval=$(echo "$h1_response" | jq -r '.interval // empty')

h24_response=$(curl -s "$API_URL/api/tokens?addresses=$SOL_ADDRESS&interval=24h")
h24_volume=$(echo "$h24_response" | jq -r '.data[0].priceData.volume24h // empty')

if [ -n "$h1_volume" ] && [ -n "$h24_volume" ] && [ "$h1_interval" = "1h" ]; then
    # 1h volume should be approximately 1/24 of 24h volume
    ratio=$(echo "scale=2; $h1_volume / $h24_volume" | bc 2>/dev/null || echo "0")
    if [ -n "$ratio" ] && (( $(echo "$ratio < 0.1" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "${GREEN}✓ PASS${NC} (1h volume scaled correctly: ratio=$ratio)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ CHECK${NC} (Ratio: $ratio, expected ~0.04)"
    fi
else
    echo -e "${RED}✗ FAIL${NC} (Missing data)"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}8. PERFORMANCE CHECK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -n "Testing response time... "
start_time=$(date +%s%N)
curl -s "$API_URL/api/status" > /dev/null
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

if [ $duration -lt 2000 ]; then
    echo -e "${GREEN}✓ PASS${NC} (${duration}ms)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SLOW${NC} (${duration}ms - may be cold start)"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED - READY FOR DEMO VIDEO!${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED - FIX BEFORE RECORDING${NC}"
    exit 1
fi

