# 🚀 Deploy to Render

## Quick Deploy Guide

### Option 1: Using Render Dashboard (Recommended)

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
   - Sign up/login if needed

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `vaibhav11123/eterna-meme-coin-aggregator`
   - Select the repository

3. **Configure Service**
   - **Name:** `eterna-aggregator`
   - **Region:** `Oregon` (or closest to you)
   - **Branch:** `main`
   - **Root Directory:** (leave empty)
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

4. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   CACHE_TTL_SECONDS=30
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_WINDOW_MS=60000
   ```

5. **Create Redis Database**
   - Click "New +" → "Redis"
   - **Name:** `eterna-redis`
   - **Plan:** Free
   - **Region:** Same as web service
   - Copy the connection details

6. **Add Redis Environment Variables to Web Service**
   ```
   REDIS_HOST=<from Redis service>
   REDIS_PORT=<from Redis service>
   REDIS_PASSWORD=<from Redis service>
   ```

7. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete (~2-3 minutes)

### Option 2: Using render.yaml (Infrastructure as Code)

1. **The `render.yaml` file is already in your repo**
2. **Go to Render Dashboard**
3. **Click "New +" → "Blueprint"**
4. **Connect your GitHub repo**
5. **Render will automatically detect `render.yaml`**
6. **Review and deploy**

## Post-Deployment

### Test Your Deployment

```bash
# Health check
curl https://your-app.onrender.com/api/health

# Get token data
curl "https://your-app.onrender.com/api/tokens?addresses=So11111111111111111111111111111111111111112"

# WebSocket (use wscat or similar)
wscat -c wss://your-app.onrender.com/ws
```

### Update Your README

Add your Render URL to the README:
```markdown
🔗 **Live API:** https://eterna-aggregator.onrender.com
```

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (should be 20+)

### Redis Connection Issues
- Verify Redis environment variables are set correctly
- Check Redis service is running
- Ensure Redis host/port/password match

### WebSocket Not Working
- Render free tier has WebSocket support
- Check that your WebSocket path is `/ws`
- Verify CORS settings if accessing from browser

## Free Tier Limitations

- **Sleeps after 15 minutes of inactivity** (wakes on first request)
- **750 hours/month** of runtime
- **512MB RAM**
- **WebSocket support:** ✅ Yes

## Upgrade to Paid Tier

For production use, consider upgrading:
- No sleep (always on)
- More resources
- Better performance
- Custom domains

