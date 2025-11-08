# Debugging Guide

## Issue: Empty Data Arrays

If you're getting `{"success":true,"data":[],"count":0}`, follow these steps:

## Step 1: Check Logs

When you run `npm run dev`, you should now see detailed logs like:

```
[info]: Aggregating data for 1 token(s): So11111111111111111111111111111111111111112
[info]: Fetching from DexScreener for address: So11111111111111111111111111111111111111112
[info]: DexScreener returned 3 pairs for So11111111111111111111111111111111111111112
[info]: Transformed 3 meme coins from DexScreener
[info]: DexScreener returned 3 results
[info]: Total data collected: 3 items from all sources
[info]: Merged into 1 aggregated token(s)
```

## Step 2: Test API Endpoints Directly

### Test DexScreener:
```bash
curl "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112"
```

Expected: JSON with `"pairs": [...]` array

### Test GeckoTerminal:
```bash
curl "https://api.geckoterminal.com/api/v2/networks/solana/tokens/So11111111111111111111111111111111111111112"
```

Expected: JSON with `"data": {...}` object

## Step 3: Check Environment Variables

Verify your `.env` file has:
```env
DEXSCREENER_BASE_URL=https://api.dexscreener.com/latest/dex
GECKO_BASE_URL=https://api.geckoterminal.com/api/v2/networks/solana
JUPITER_BASE_URL=https://price.jup.ag/v4
```

## Step 4: Check Redis Cache

If Redis has cached empty results, clear it:
```bash
redis-cli FLUSHDB
```

Or check what's cached:
```bash
redis-cli KEYS "meme_coin:*"
```

## Step 5: Common Issues

### Issue: "DexScreener response missing pairs data"
**Cause**: API response structure changed or endpoint incorrect
**Fix**: Check the actual API response structure in logs

### Issue: "No data collected from any source"
**Cause**: All API calls failed or returned empty
**Fix**: Check network connectivity and API status

### Issue: "GeckoTerminal response missing data"
**Cause**: Token not found on Solana network or wrong endpoint
**Fix**: Verify token address is a valid Solana address

## Step 6: Enable Debug Logging

Set log level to debug in your code or environment:
```env
NODE_ENV=development
```

This will show:
- Full API URLs being called
- Response status codes
- Response data structure
- Transformation steps

## Step 7: Test with Known Working Addresses

Try these Solana addresses that should always return data:

```bash
# Wrapped SOL
curl "http://localhost:3000/api/tokens?addresses=So11111111111111111111111111111111111111112"

# USDC on Solana
curl "http://localhost:3000/api/tokens?addresses=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
```

## Step 8: Check Network/Firewall

If direct curl works but the app doesn't:
- Check if the app can reach external APIs
- Verify no corporate firewall blocking requests
- Check DNS resolution

## Still Not Working?

1. **Check the actual error messages** in the logs
2. **Verify the response structure** matches what the code expects
3. **Test each client individually** by temporarily calling them directly
4. **Check if Redis is running** and accessible

The enhanced logging should now show exactly where the data flow breaks!

