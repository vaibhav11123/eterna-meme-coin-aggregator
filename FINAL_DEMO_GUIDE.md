# 🎬 Final Cinematic Demo Guide

## ✨ The Complete Experience

Your cinematic demo now includes:
- ✅ **Splash Screen** - 2-second intro with loading animation
- ✅ **Heartbeat Pulse** - Pulsing indicator (● → ○) synced with updates
- ✅ **Fade Effects** - Smooth transitions
- ✅ **3-Column Grid** - Professional Bloomberg-style layout
- ✅ **Auto-Demo Mode** - Perfect for one-take recordings

## 🚀 Quick Start

### Interactive Cinematic Mode
```bash
npm run ws:cinematic
```

**What happens:**
1. Splash screen appears (2 seconds)
2. Screen clears
3. Live feed loads with heartbeat pulse
4. Updates every 30 seconds
5. Press Ctrl+C to exit

### Auto-Demo Mode (YouTube Ready)
```bash
npm run ws:demo
```

**What happens:**
1. Splash screen (2 seconds)
2. Live feed (15 seconds)
3. Auto-fade out with closing message
4. Clean exit

## 🎥 The Complete Flow

### Phase 1: Splash Screen (0-2s)
```
╭───────────────────────────────╮
│ ETERNA TERMINAL               │
╰───────────────────────────────╯
Initializing Real-Time Intelligence...
Loading ⠸
```

### Phase 2: Transition
- Screen clears
- Brief pause (0.3s)
- Ready for live feed

### Phase 3: Live Feed
```
╭───────────────────────────────────────────────╮
│ ETERNA • Market Intelligence Grid             │
╰───────────────────────────────────────────────╯
   ● Connected  ← Heartbeat pulses here!

──────────────────────────────────────────────────────────────────────────────
SOL (Wrapped SOL)                 BONK (Bonk)                      USDC (USD Coin)
Address: So11111111…             Address: DezXAZ8z7…              Address: EPjFWdd5A…

Price    $162.032001  ▲ +0.12%   Price    $0.000024  ▼ -0.44%     Price    $1.000012  ▲ +0.01%
Vol 24h  $548.11M                Vol 24h  $82.09M                 Vol 24h  $98.32M
Liq      $129.64M                Liq      $42.10M                 Liq      $87.05M

Source   dexscreener             Source   dexscreener             Source   geckoterminal
Chain    solana                  Chain    solana                  Chain    solana
──────────────────────────────────────────────────────────────────────────────
Updated • 3:22:31 PM  |  Update #9
```

## 💚 The Heartbeat Pulse

The heartbeat indicator is the **hypnotic rhythm** that makes your system feel alive:

- **Green ●** = Active/connected (bright pulse)
- **Gray ○** = Pulse state (subtle)
- **Location**: Next to "Connected" text
- **Behavior**: Pulses with every WebSocket update
- **Effect**: Creates a rhythmic, breathing quality

Watch it: ● → ○ → ● → ○ (synced with price updates)

## 🎬 Recording Setup

### Terminal Configuration
- **Font**: Fira Code or JetBrains Mono (14-16pt)
- **Size**: 150+ columns width, 40+ rows height
- **Background**: Pure black (#000000 or #0d0d0d)
- **Full Screen**: No distractions

### Recording Steps

**For Auto-Demo (Recommended):**
```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Start recording, then:
npm run ws:demo

# It will:
# - Show splash (2s)
# - Show live feed (15s)
# - Fade out (2s)
# - Exit cleanly
# Total: ~19 seconds of perfect footage
```

**For Interactive:**
```bash
# Start server
npm run dev

# Start cinematic client
npm run ws:cinematic

# Let it run for 20-30 seconds
# Show heartbeat pulsing
# Show 2-3 price updates
# Press Ctrl+C when done
```

## 🎵 Optional Enhancements

### Background Music
- **Muted synthwave** (80s retro vibe)
- **Slow lofi** (chill, professional)
- **Ambient electronic** (futuristic)
- Keep volume at 20-30% so text is clear

### Text Overlay (Video Editor)
Add this at the start:
```
"Eterna — Building real-time intelligence for markets."
```
Fade in over splash, fade out as feed appears.

## 🎯 The Money Shot

The most cinematic moments:

1. **Splash Screen Transition**
   - Loading animation
   - Smooth fade to live feed

2. **Heartbeat Pulse**
   - ● → ○ → ● (rhythmic, hypnotic)
   - Synced with every update
   - Makes system feel alive

3. **Price Updates**
   - ▲/▼ indicators changing
   - Flicker effect on price changes
   - Smooth, professional updates

4. **Auto-Demo Fade Out**
   - Clean closing message
   - Professional exit
   - Perfect for looping

## 📊 All Available Commands

```bash
# Interactive modes
npm run ws:cinematic    # Full cinematic with heartbeat
npm run ws:dual         # Dual-column view
npm run ws:grid         # 3-column grid
npm run ws:test         # Single token detailed

# Auto-demo
npm run ws:demo         # 15-second auto-demo
node examples/websocket-live-demo.js 30  # Custom duration

# Testing
npm run test:tokens     # Test multiple tokens
```

## 💡 Pro Tips

1. **Record in 4K** - Terminal text looks crisp
2. **Use screen recording** - Not camera (better quality)
3. **Let heartbeat pulse** - Show 2-3 pulses for effect
4. **Show price changes** - The ▲/▼ indicators are key
5. **Full screen terminal** - No distractions
6. **Auto-demo mode** - Perfect for one-take recordings
7. **Loop the video** - Auto-demo creates perfect loop

## 🎥 Final Checklist

Before recording:
- [ ] Server running (`npm run dev`)
- [ ] Terminal full screen
- [ ] Font set to Fira Code/JetBrains Mono
- [ ] Background pure black
- [ ] Screen recorder ready
- [ ] Auto-demo mode selected (`npm run ws:demo`)

During recording:
- [ ] Let splash play fully (2s)
- [ ] Show heartbeat pulsing (2-3 pulses)
- [ ] Show at least 1 price update
- [ ] Let fade-out complete (2s)

You're ready to create that cinematic demo! 🎬✨

