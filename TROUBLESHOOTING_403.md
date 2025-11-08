# Troubleshooting 403 Forbidden Errors

## Issue
You're getting `403 Forbidden` errors when trying to fetch data from DexScreener and GeckoTerminal APIs.

## Root Cause
The APIs are blocking requests, likely due to:
- **Network firewall/proxy** (Cisco Umbrella detected in headers)
- **VPN interference**
- **Corporate network restrictions**
- **IP-based blocking**

## Solutions

### 1. Test from Different Network
Try running the server from:
- Mobile hotspot
- Different WiFi network
- Home network (if currently on corporate network)

### 2. Check VPN
If you're using a VPN:
- Try disconnecting the VPN
- Try a different VPN server location
- Some VPNs are blocked by APIs

### 3. Test API Directly in Browser
Open these URLs in your browser:
- `https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112`
- `https://api.geckoterminal.com/api/v2/networks/solana/tokens/So11111111111111111111111111111111111111112`

If they work in browser but not in Node.js, it's likely a User-Agent or network issue.

### 4. Use Proxy (if needed)
If you must use a proxy, configure it in the axios clients:
```typescript
const HttpsProxyAgent = require('https-proxy-agent');
const agent = new HttpsProxyAgent('http://proxy-server:port');
// Add to axios config
```

### 5. Check Server Logs
After restarting the server, check the logs for:
```
[error]: DexScreener 403 Forbidden - Possible network/firewall block
```

This confirms the 403 is happening.

### 6. Alternative: Use Mock Data for Testing
If APIs are blocked, you can temporarily use mock data to test the aggregator logic:

```typescript
// In dexscreener.client.ts, temporarily return mock data
if (process.env.USE_MOCK_DATA === 'true') {
  return [/* mock data */];
}
```

## Verification

After applying fixes, restart your server and check logs:
```bash
npm run dev
# In another terminal:
curl "http://localhost:3000/api/tokens?addresses=So11111111111111111111111111111111111111112"
```

Look for these log messages:
- ✅ `[info]: DexScreener returned X pairs` - Success!
- ❌ `[error]: DexScreener 403 Forbidden` - Still blocked

## Next Steps

1. **Restart server** with new User-Agent headers
2. **Test from different network** if 403 persists
3. **Check browser** - if APIs work there, it's a Node.js/network config issue
4. **Contact network admin** if on corporate network

The code is now ready - the 403 is a network/infrastructure issue, not a code issue.

