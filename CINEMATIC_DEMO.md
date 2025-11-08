# 🎬 Cinematic Demo Guide

## 🎯 Two Demo Modes

### 1. Interactive Cinematic Mode
**Perfect for:** Live demos, presentations, investor meetings

```bash
npm run ws:cinematic
```

**Features:**
- Cinematic splash screen with loading animation
- Live heartbeat pulse (●) that syncs with updates
- Fade-in text effects
- Runs until you press Ctrl+C
- Full interactive experience

### 2. Auto-Demo Mode (YouTube Ready)
**Perfect for:** Video recordings, automated demos, social media

```bash
npm run ws:demo
```

**Features:**
- Same cinematic splash screen
- Runs for exactly 15 seconds (configurable)
- Auto-fades out with closing message
- No manual intervention needed
- Perfect for one-take recordings

**Custom Duration:**
```bash
# Run for 30 seconds
node examples/websocket-live-demo.js 30

# Run for 10 seconds with custom tokens
node examples/websocket-live-demo.js 10 <token1> <token2> <token3>
```

## 🎥 Demo Flow

### Interactive Mode Flow:
1. **Splash Screen** (2 seconds)
   ```
   ╭───────────────────────────────╮
   │ ETERNA TERMINAL               │
   ╰───────────────────────────────╯
   Initializing Real-Time Intelligence...
   Loading ⠹
   ```

2. **Live Feed** (runs until Ctrl+C)
   - Heartbeat pulse: ● → ○ → ● (syncs with updates)
   - Real-time price updates
   - 3-column grid layout
   - Update counter

3. **Manual Exit** (Ctrl+C)
   - Graceful disconnect

### Auto-Demo Mode Flow:
1. **Splash Screen** (2 seconds)
2. **Live Feed** (15 seconds default)
   - Shows countdown timer
   - All same features as interactive
3. **Fade Out** (2 seconds)
   ```
   ╭───────────────────────────────────────────────╮
   │ Session ended — Data stream disconnected.     │
   │                                               │
   │ Eterna — Building real-time intelligence     │
   │ for markets.                                  │
   ╰───────────────────────────────────────────────╯
   ```

## 🎨 Visual Features

### Heartbeat Pulse
- **Green ●** = Active/connected
- **Gray ○** = Pulse (alternates with each update)
- Located next to "Connected" text
- Creates rhythmic, hypnotic effect

### Price Flicker
- Prices briefly highlight when they change
- Subtle visual feedback for updates
- Not distracting, just informative

### Color Coding
- **Green ▲** = Price up
- **Red ▼** = Price down
- **Gray** = Neutral/no change
- **Cyan** = Volume/liquidity metrics

## 📹 Recording Tips

### Setup
1. **Terminal Settings:**
   - Font: Fira Code or JetBrains Mono (14-16pt)
   - Width: 150+ columns
   - Height: 40+ rows
   - Background: Pure black (#000000 or #0d0d0d)
   - Full screen terminal

2. **Screen Recording:**
   - Use built-in screen recorder (macOS: Cmd+Shift+5)
   - Record at 60fps if possible
   - 4K resolution for crisp text
   - No mouse cursor visible

### For Auto-Demo Mode:
```bash
# Start server in one terminal
npm run dev

# In another terminal, start recording, then:
npm run ws:demo

# It will automatically:
# - Show splash (2s)
# - Show live feed (15s)
# - Fade out (2s)
# - Exit cleanly
```

### For Interactive Mode:
```bash
# Start server
npm run dev

# Start cinematic client
npm run ws:cinematic

# Let it run for 20-30 seconds
# Show the heartbeat pulsing
# Show price updates
# Press Ctrl+C when done
```

## 🎵 Optional: Background Music

For your demo video, consider:
- **Muted synthwave** (80s retro vibe)
- **Slow lofi** (chill, professional)
- **Ambient electronic** (futuristic)
- Keep volume low (20-30%) so terminal text is clear

## 📝 Optional: Text Overlay

Add this text overlay at the start (in video editor):
```
"Eterna — Building real-time intelligence for markets."
```

Fade in over the splash screen, fade out as feed appears.

## 🚀 Quick Commands

```bash
# Interactive cinematic (manual exit)
npm run ws:cinematic

# Auto-demo (15 seconds, auto-exit)
npm run ws:demo

# Auto-demo with custom duration (30 seconds)
node examples/websocket-live-demo.js 30

# Auto-demo with custom tokens
node examples/websocket-live-demo.js 15 <token1> <token2> <token3>
```

## 💡 Pro Tips

1. **Record in 4K** - Terminal text looks crisp
2. **Use screen recording** - Not camera (better quality)
3. **Let heartbeat pulse** - Show 2-3 pulses for effect
4. **Show price changes** - The ▲/▼ indicators are key
5. **Full screen** - No distractions, just the feed
6. **Auto-demo mode** - Perfect for one-take recordings

## 🎬 The Money Shot

The most cinematic moment:
- Heartbeat pulsing: ● → ○ → ●
- Price updates with ▲/▼ indicators
- Smooth, rhythmic updates every 30 seconds
- Clean, professional Bloomberg-style layout

That's your cinematic money shot! 🎥✨

