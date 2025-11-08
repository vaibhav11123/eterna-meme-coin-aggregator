# 🎬 Terminal Demo Scripts

Professional Bloomberg-style terminal displays for your demo video.

## 📊 Available Views

### 1. Dual-Column View (Minimal Bloomberg Style)
**Perfect for:** Side-by-side comparison of two tokens

```bash
npm run ws:dual
```

**Features:**
- Clean dual-column layout
- Price change indicators (▲/▼)
- Volume and liquidity metrics
- Minimal, professional design
- 48-character column width

**Sample Output:**
```
╭─────────────────────────────────────────────╮
│ ETERNA • Dual Token Live Feed               │
╰─────────────────────────────────────────────╯

──────────────────────────────────────────────────────────────
SOL (Wrapped SOL)                             BONK (Bonk)
Address: So11111111…                          Address: DezXAZ8z7P…

Price    $161.932000  ▲ +0.08%                Price    $0.000024  ▼ -0.45%
Vol 24h  $547.34M                             Vol 24h  $82.19M
Liq      $129.68M                             Liq      $42.13M

Source   dexscreener                          Source   dexscreener
Chain    solana                               Chain    solana
──────────────────────────────────────────────────────────────
Updated • 3:04:17 PM  |  Update #7
```

### 2. 3-Column Grid View (Trading Terminal Style)
**Perfect for:** Dashboard-style multi-token monitoring

```bash
npm run ws:grid
```

**Features:**
- 3-column matrix layout
- Compact design for multiple tokens
- Trading terminal aesthetic
- Perfect for "top trending" displays

**Sample Output:**
```
╭──────────────────────────────────────────────────────────────╮
│ ETERNA • Trading Terminal Dashboard                          │
╰──────────────────────────────────────────────────────────────╯

──────────────────────────────────────────────────────────────────────────────
SOL (Wrapped SOL)      BONK (Bonk)            USDC (USD Coin)
Addr: So1111111…       Addr: DezXAZ8z…        Addr: EPjFWdd5…

Price  $161.932000  ▲  Price  $0.000024  ▼   Price  $1.000000  ±
Vol    $547.34M         Vol    $82.19M         Vol    $1.2B
Liq    $129.68M         Liq    $42.13M         Liq    $500M

Src    dexscreener      Src    dexscreener      Src    dexscreener
Chain  solana           Chain  solana           Chain  solana
──────────────────────────────────────────────────────────────────────────────
Updated • 3:04:17 PM  |  Update #7  |  3 tokens active
```

### 3. Single Token Detailed View
**Perfect for:** Deep dive into one token

```bash
npm run ws:test
```

## 🎯 Demo Video Setup

### Recommended Terminal Settings
- **Font:** Fira Code or JetBrains Mono
- **Size:** 150+ columns width
- **Background:** Black (#0d0d0d)
- **Theme:** Dark with subtle colors

### Demo Flow

1. **Start Server**
   ```bash
   npm run dev
   ```

2. **Show Dual-Column View**
   ```bash
   npm run ws:dual
   ```
   - Let it run for 15-20 seconds
   - Show price updates in real-time
   - Highlight the clean, professional design

3. **Switch to Grid View**
   ```bash
   npm run ws:grid
   ```
   - Show 3 tokens updating simultaneously
   - Demonstrate scalability

4. **Show REST API** (in another terminal)
   ```bash
   curl "http://localhost:3000/api/tokens?addresses=So11111111111111111111111111111111111111112" | jq
   ```

## 🎨 Design Philosophy

- **Minimalist:** No emoji clutter, only essential data
- **Professional:** Bloomberg terminal aesthetic
- **Readable:** Balanced whitespace and typography
- **Color-coded:** Green for gains, red for losses, gray for neutral
- **Symmetrical:** Equal column widths for visual balance

## 🚀 Customization

### Use Different Tokens

**Dual View:**
```bash
node examples/websocket-live-dual.js <token1> <token2>
```

**Grid View:**
```bash
node examples/websocket-live-grid.js <token1> <token2> <token3>
```

### Example with Custom Tokens
```bash
# SOL vs USDC
npm run ws:dual So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# SOL, BONK, USDC grid
npm run ws:grid So11111111111111111111111111111111111111112 DezXQkJ8VNVoU8HEHrAxeRBxyvRkrLNzdeqjVqm3Z6vL EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

## 💡 Pro Tips

1. **Record in 4K** for crisp terminal text
2. **Use screen recording** (not camera) for best quality
3. **Let it run** for 20-30 seconds to show live updates
4. **Show price changes** - the ▲/▼ indicators are the money shot
5. **Full screen terminal** - no distractions, just the feed

## 📦 Installation

Dependencies are already in package.json:
- `chalk` - Terminal colors
- `boxen` - Box drawing

Just run:
```bash
npm install
```

Then start your demos! 🎬

