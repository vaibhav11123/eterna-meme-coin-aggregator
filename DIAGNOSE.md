# Diagnostic Steps

## Quick Diagnosis

Run these commands to identify the issue:

### 1. Check if Redis is running
```bash
redis-cli ping
# Should return: PONG
```

If Redis is not running:
```bash
# Start Redis (if installed)
redis-server

# Or use Docker
docker-compose up -d redis
```

### 2. Test Redis Connection
```bash
curl "http://localhost:3000/debug/test-redis"
```

Expected: `{"success":true,"redisConnected":true}`

### 3. Test DexScreener API Directly
```bash
curl "http://localhost:3000/debug/test-dexscreener/So11111111111111111111111111111111111111112"
```

This will show:
- If the API call is being made
- What response is received
- Any errors

### 4. Test GeckoTerminal API Directly
```bash
curl "http://localhost:3000/debug/test-gecko/So11111111111111111111111111111111111111112"
```

### 5. Clear Cache (if Redis has stale empty data)
```bash
curl "http://localhost:3000/debug/clear-cache"
```

### 6. Check Server Logs

When you make a request, watch the server logs for:
- `[info]: Aggregating data for...`
- `[info]: Fetching from DexScreener...`
- `[error]: DexScreener 403 Forbidden` ← This is the problem
- `[warn]: No data collected from any source`

## Common Issues Found

### Issue 1: Redis Not Running
**Symptoms**: 
- Cache operations fail silently
- No "Redis client connected" in logs

**Fix**: Start Redis
```bash
redis-server
# or
docker-compose up -d redis
```

### Issue 2: 403 Forbidden (Network Block)
**Symptoms**:
- `[error]: DexScreener 403 Forbidden`
- `[error]: GeckoTerminal 403 Forbidden`

**Fix**: 
- Try different network (mobile hotspot)
- Disable VPN
- Check firewall settings

### Issue 3: Cached Empty Results
**Symptoms**:
- First request returns empty
- Subsequent requests also empty (cached)

**Fix**: Clear cache
```bash
curl "http://localhost:3000/debug/clear-cache"
```

### Issue 4: API Endpoint Wrong
**Symptoms**:
- `[warn]: DexScreener response missing pairs data`

**Fix**: Check if API structure changed

## Full Diagnostic Flow

1. **Check Redis**: `curl http://localhost:3000/debug/test-redis`
2. **Clear Cache**: `curl http://localhost:3000/debug/clear-cache`
3. **Test DexScreener**: `curl http://localhost:3000/debug/test-dexscreener/So11111111111111111111111111111111111111112`
4. **Test GeckoTerminal**: `curl http://localhost:3000/debug/test-gecko/So111111111111111111111111111111111111112`
5. **Check Logs**: Look at server console output
6. **Test Main Endpoint**: `curl "http://localhost:3000/api/tokens?addresses=So11111111111111111111111111111111111111112"`

The debug endpoints will show you exactly what's happening at each step!

