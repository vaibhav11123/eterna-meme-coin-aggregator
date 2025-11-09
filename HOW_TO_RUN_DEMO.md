# 🎬 How to Run the Eterna Demo

Complete guide to running the WebSocket live price feed demo yourself.

---

## 🚀 Quick Start (Easiest Way)

### Option 1: Grid View (Bloomberg-Style) - **Recommended**

```bash
npm run ws:grid
```

**What it does:**
- ✅ Connects to production automatically
- ✅ Loads data instantly (no waiting)
- ✅ Shows beautiful Bloomberg-style table
- ✅ Real-time price updates

**Press `Ctrl+C` to stop**

---

### Option 2: Simple Demo (Always Works)

```bash
npm run ws:simple
```

**What it does:**
- ✅ Reliable terminal output
- ✅ Works in all terminals
- ✅ Shows real-time data
- ✅ Clean table layout

**Press `Ctrl+C` to stop**

---

### Option 3: Cinematic Demo (Advanced)

```bash
npm run ws:cinematic
```

**What it does:**
- ✅ Splash screen animation
- ✅ Heartbeat pulse indicator
- ✅ 3-column grid layout
- ✅ Fade-in effects

**Press `Ctrl+C` to stop**

---

## 📋 Step-by-Step Guide

### Step 1: Navigate to Project Directory

```bash
cd /Users/vaibhavsingh/Downloads/Eterna
```

### Step 2: Choose Your Demo

Pick one of the three options above based on what you want to see.

### Step 3: Watch the Magic

The terminal will:
1. Connect to the production WebSocket server
2. Load cached data instantly (1-2 seconds)
3. Display real-time token prices
4. Update automatically as prices change

---

## 🎯 What You'll See

### Grid View Output:
```
╭───────────────────────────────────────────────────────────────╮
│            🧠  ETERNA • REAL-TIME MARKET TERMINAL              │
╰───────────────────────────────────────────────────────────────╯

┏━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━┓
┃ TOKEN            ┃ PRICE (USD)  ┃ VOL (24H)    ┃ LIQ.       ┃ CONF.    ┃ SRC                ┃
┣━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━╋━━━━━━━━━━━━╋━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━┫
┃ SOL    Wrapped … ┃ $159.1420    ┃ 119.06M      ┃ 43.40M     ┃ 94.5%    ┃ Dexscreener, Geck… ┃
┃ TRUMP  OFFICIAL… ┃ $7.4700      ┃ 72.11M       ┃ 320.08M    ┃ 100.0%   ┃ Dexscreener        ┃
┃ USDC   USD Coin  ┃ $1.0001      ┃ 7.64M        ┃ 4.39M      ┃ 99.0%    ┃ Dexscreener, Geck… ┃
┗━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━┻━━━━━━━━━━━━┻━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🔧 Advanced Options

### Custom Token Addresses

You can specify custom tokens:

```bash
node examples/websocket-live-grid.js <token1> <token2> <token3>
```

**Example:**
```bash
node examples/websocket-live-grid.js So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### Use Local Server (Development)

If running locally:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run demo
WS_URL=ws://localhost:3000/ws npm run ws:grid
```

### Use Different Production URL

```bash
WS_URL=wss://your-server.com/ws npm run ws:grid
```

---

## 🐛 Troubleshooting

### Problem: "Waiting for market data..."

**Solution:** The server might be cold starting. Wait 30-60 seconds and try again.

**Or manually warm the cache:**
```bash
curl -s "https://eterna-aggregator.onrender.com/api/tokens?addresses=So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" > /dev/null
npm run ws:grid
```

### Problem: "WebSocket error: AggregateError"

**Solution:** Server is spinning up (Render free tier). Wait 30-60 seconds.

**Check if server is ready:**
```bash
curl -s "https://eterna-aggregator.onrender.com/api/health"
```

If it responds, try the demo again.

### Problem: No data showing

**Solution:** Use the simple demo instead:
```bash
npm run ws:simple
```

---

## 📊 Available Demo Commands

| Command | Description | Best For |
|---------|-------------|----------|
| `npm run ws:grid` | Bloomberg-style table | **Demo videos** |
| `npm run ws:simple` | Simple reliable view | Troubleshooting |
| `npm run ws:cinematic` | Advanced animations | Showcase |
| `npm run ws:test` | Basic connection test | Testing |
| `npm run ws:dual` | Dual view mode | Comparison |

---

## 🎥 For Demo Video Recording

### Recommended Sequence:

1. **Start with API test:**
   ```bash
   curl -s "https://eterna-aggregator.onrender.com/api/status" | jq '.'
   ```

2. **Show cache warmup:**
   ```bash
   curl -s "https://eterna-aggregator.onrender.com/api/tokens?addresses=So11111111111111111111111111111111111111112" | jq '.data[0].token.symbol'
   ```

3. **Launch grid demo:**
   ```bash
   npm run ws:grid
   ```

4. **Let it run for 15-20 seconds** to show real-time updates

5. **Press Ctrl+C** to stop

---

## ✅ Quick Reference

**Most Common Command:**
```bash
npm run ws:grid
```

**If that doesn't work:**
```bash
npm run ws:simple
```

**Check server status:**
```bash
curl -s "https://eterna-aggregator.onrender.com/api/health" | jq '.'
```

**Stop the demo:**
Press `Ctrl+C`

---

## 🎯 What Each Demo Shows

### Grid View (`ws:grid`)
- ✅ Professional Bloomberg-style terminal
- ✅ Real-time price updates
- ✅ Multi-source aggregation
- ✅ Confidence scores
- ✅ Volume and liquidity data

### Simple Demo (`ws:simple`)
- ✅ Clean table layout
- ✅ Reliable in all terminals
- ✅ Real-time updates
- ✅ Easy to read

### Cinematic Demo (`ws:cinematic`)
- ✅ Splash screen
- ✅ Heartbeat animation
- ✅ 3-column grid
- ✅ Fade effects

---

## 💡 Pro Tips

1. **Full-screen terminal** looks best for demos
2. **Black background** enhances the Bloomberg aesthetic
3. **Let it run 15-20 seconds** to show multiple updates
4. **Use grid view** for demo videos (most impressive)
5. **Warm cache first** if server was idle (prevents delays)

---

## 🎉 You're Ready!

Just run:
```bash
npm run ws:grid
```

And watch the real-time market data flow! 🚀

