# Render 502 Bad Gateway Troubleshooting Guide

## Quick Diagnosis

### 1. Check Render Logs
Go to **Render Dashboard → Your Service → Logs** and look for:
- Build errors (TypeScript compilation failures)
- Startup errors (Redis connection, port binding)
- Runtime crashes

### 2. Common Issues & Fixes

#### Issue: App Not Starting
**Symptoms:** 502 error, no logs showing "Server running on port 10000"

**Fixes:**
- Verify `PORT=10000` is set in Render environment variables
- Check if `npm run build` completes successfully
- Ensure `dist/index.js` exists after build

#### Issue: Redis Connection Failing
**Symptoms:** Logs show "Redis ping failed" or connection errors

**Fixes:**
- Verify `REDIS_URL` is set correctly (should be auto-injected from database)
- Check if Redis database is running
- App should still work without Redis (just slower)

#### Issue: Health Check Failing
**Symptoms:** Render shows "Health check failed"

**Fixes:**
- Verify `/api/health` endpoint exists
- Check if app is listening on the correct port
- Ensure health check path is `/api/health` in render.yaml

### 3. Manual Verification Steps

1. **Check Build:**
   ```bash
   npm run build
   ```
   Should create `dist/` folder with compiled JavaScript

2. **Test Locally:**
   ```bash
   PORT=10000 npm start
   ```
   Should show: "🚀 Server running on port 10000"

3. **Test Health Endpoint:**
   ```bash
   curl http://localhost:10000/api/health
   ```
   Should return: `{"status":"healthy","timestamp":...,"uptime":...}`

### 4. Render-Specific Fixes

#### Fix 1: Ensure PORT is Set
In Render Dashboard → Environment:
- `PORT` = `10000` (must match render.yaml)

#### Fix 2: Check Build Command
In render.yaml:
```yaml
buildCommand: npm install && npm run build
```
Should complete without errors

#### Fix 3: Verify Start Command
In render.yaml:
```yaml
startCommand: npm start
```
Should run `node dist/index.js`

#### Fix 4: Redis Connection
The app should work even if Redis fails (graceful degradation).
If Redis is required, check:
- Redis database is running
- `REDIS_URL` is set correctly
- Connection string format is valid

### 5. Debug Endpoints (Development Only)

If you can access the service, try:
- `GET /api/health` - Basic health check
- `GET /debug/health` - Detailed health (dev only)
- `GET /debug/test-redis` - Test Redis connection (dev only)

### 6. Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module` | Build failed | Run `npm run build` locally |
| `Port already in use` | Port conflict | Change PORT in render.yaml |
| `ECONNREFUSED` (Redis) | Redis not available | App should still work (check logs) |
| `Health check failed` | App not responding | Check if server is listening |

### 7. Force Redeploy

If nothing works:
1. Go to Render Dashboard → Your Service
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Watch logs for errors

### 8. Contact Render Support

If issue persists:
- Include full logs from Render
- Include your render.yaml
- Mention the Request ID from 502 error page

