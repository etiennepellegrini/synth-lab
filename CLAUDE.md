# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Repository Overview

**synth-lab** is an interactive synthesizer simulator and synthesis fundamentals course, created for learning sound design basics with a focus on the Korg Volca Keys. The repository contains three web applications built with Vite and deployed as a Progressive Web App.

**Live demo:** https://YOUR_USERNAME.github.io/synth-lab/

---

## Development Workflow

**Setup:**
```bash
# Install dependencies (uses pnpm)
pnpm install

# Development server with hot reload
pnpm run dev
# Visit http://localhost:5173

# Production build
pnpm run build

# Preview production build locally
pnpm run preview
```

**Development Notes:**
- Vite dev server at http://localhost:5173 with HMR
- Changes to `.jsx` files hot-reload instantly
- Changes to `.html` or `.js` files require browser refresh
- Build output goes to `dist/` directory
- Web Audio API requires user interaction before playing sound (browser security)
- Test audio on Safari to catch suspended AudioContext state issues

**Deployment:**
- Automatic via GitHub Actions on push to `main` branch
- Deploys to GitHub Pages at `/synth-lab/` path
- Service worker auto-updates on new deployment

---

## Architecture

### Build System

**Vite + React + PWA:**
- **Vite 5.4**: Multi-page build with three entry points
- **React 18**: Course chapters with pre-compiled JSX (no Babel runtime)
- **vite-plugin-pwa**: Workbox service worker with offline support
- **pnpm 9**: Fast, disk-efficient package manager

**Key Configuration (vite.config.js):**
- Root directory: `src/`
- Public assets: `public/`
- Base path: `/` (dev) or `/synth-lab/` (production)
- Three HTML entry points: index, synth, course
- PWA with auto-update and Google Fonts caching

### Three Applications

#### 1. Landing Page (`src/index.html`)
- Static page with gradient hero and card navigation
- Links to synthesizer and course
- Minimal JavaScript, fully responsive

#### 2. Synthesizer (`src/synth.html` + `src/synth/*`)
- **Framework:** Vanilla JavaScript (no React overhead)
- **Architecture:** Modular with shared audio engine
- **Modules:**
  - `synth-app.js`: Main orchestrator, state management
  - `keyboard.js`: Touch keyboard + QWERTY input
  - `modules/envelope.js`: ADSR controls and visualization
  - `visualizers/oscilloscope.js`: Real-time scope rendering
  - `visualizers/spectrum.js`: FFT frequency display

**Audio Architecture:**
- Uses shared `AudioEngine` from `src/lib/audio-engine.js`
- Single `Voice` instance manages full signal chain
- Persistent oscillator with frequency modulation (no clicks)
- Frame-based envelope via requestAnimationFrame
- LFO dynamically routed to pitch/filter/amplitude

#### 3. Course (`src/course.html` + `src/course/*`)
- **Framework:** React 18 with pre-compiled JSX
- **Entry Point:** `src/course/main.jsx` (imports `course-app.jsx`)
- **Structure:** 7 chapter components with interactive demos
- **Chapters:**
  - Chapter 1: Sound Basics (waveforms, frequency)
  - Chapter 2: Oscillators (VCO fundamentals)
  - Chapter 3: Filters (VCF cutoff, resonance)
  - Chapter 4: Envelopes (ADSR shaping)
  - Chapter 5: LFO (modulation routing)
  - Chapter 6: Voice Modes (poly, unison, ring mod)
  - Chapter 7: Sequencer & Delay

**Course Architecture:**
- `AudioProvider` context wraps app (shared AudioContext)
- Each chapter is self-contained with own audio nodes
- Cleanup via useEffect return functions
- Hash-based routing: `#chapter-1` through `#chapter-7`

### Shared Audio Engine (`src/lib/audio-engine.js`)

**Singleton pattern providing:**
- `AudioEngine` class: Shared AudioContext, master gain, limiter, analyser
- `Voice` class: Complete synthesizer voice (VCO, VCF, envelope, LFO, delay)

**Signal Flow:**
```
Voice:
  osc → filter → ampGain (envelope) → delay split → voiceOut
                                         ↓
                                    delayNode → feedback ⟲ → delayWet

Master:
  voiceOut → masterGain → limiter → analyser → destination
```

**Key Patterns:**
- Persistent oscillator (modulate frequency, never stop/start)
- Frame-based envelope (rAF loop for visualization sync)
- LFO routing via disconnect/reconnect pattern (see NOTE in code)
- Safari compatibility: Check `ctx.state === 'suspended'`, call `ctx.resume()`
- Error handling: Wrap exponentialRampToValueAtTime in try-catch

**Voice API:**
```javascript
const engine = new AudioEngine();
await engine.init();

const voice = engine.createVoice();
voice.setWaveform('sawtooth');
voice.setFilterCutoff(2000);
voice.setADSR(0.01, 0.3, 0.7, 0.5);
voice.noteOn(440); // Play A4
voice.noteOff();   // Release
voice.dispose();   // Cleanup
```

### PWA Support

**Full Progressive Web App implementation:**
- **Manifest:** `public/manifest.json` with shortcuts to synth and course
- **Service Worker:** Workbox-generated with precaching + runtime caching
- **Auto-update:** Detects new SW, shows banner, reloads on user click
- **Offline:** All pages work offline after first visit
- **Installable:** Add to Home Screen on iOS/Android

**Caching Strategy:**
- Precache: All JS, CSS, HTML, fonts (from build output)
- Runtime cache: Google Fonts (CacheFirst, 1 year TTL)
- Cleanup: Removes outdated caches automatically

---

## File Structure

```
synth-lab/
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions CI/CD
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # PWA icons (192×192, 512×512)
├── src/
│   ├── index.html              # Landing page
│   ├── synth.html              # Synthesizer entry point
│   ├── course.html             # Course entry point
│   ├── lib/
│   │   ├── audio-engine.js     # Shared Web Audio engine (AudioEngine + Voice)
│   │   └── utils.js            # Shared utilities
│   ├── synth/
│   │   ├── synth-app.js        # Synth orchestrator, state management
│   │   ├── keyboard.js         # Touch keyboard + QWERTY
│   │   ├── modules/
│   │   │   └── envelope.js     # ADSR controls + viz
│   │   └── visualizers/
│   │       ├── oscilloscope.js # Time-domain scope
│   │       └── spectrum.js     # Frequency-domain FFT
│   └── course/
│       ├── main.jsx            # React entry point
│       ├── course-app.jsx      # Main app component with routing
│       ├── audio/
│       │   ├── AudioProvider.jsx   # AudioContext wrapper
│       │   └── helpers.js          # Note frequencies, viz helpers
│       ├── chapters/
│       │   ├── Chapter1.jsx    # Sound Basics
│       │   ├── Chapter2.jsx    # Oscillators
│       │   ├── Chapter3.jsx    # Filters
│       │   ├── Chapter4.jsx    # Envelopes
│       │   ├── Chapter5.jsx    # LFO
│       │   ├── Chapter6.jsx    # Voice Modes
│       │   └── Chapter7.jsx    # Sequencer & Delay
│       └── components/
│           ├── Navigation.jsx      # Chapter nav
│           ├── Slider.jsx          # Parameter slider
│           ├── WaveformSVG.jsx     # Waveform visualization
│           ├── ListenToggle.jsx    # Audio play/stop button
│           ├── VolcaCallout.jsx    # Volca-specific tips
│           └── DiveDeeper.jsx      # Advanced concepts
├── vite.config.js              # Vite multi-page config
├── package.json                # Dependencies + scripts (pnpm)
├── pnpm-lock.yaml              # Lockfile
├── first-session.md            # Volca Keys tutorial (45-60 min)
└── cheat-sheet.md              # Volca Keys quick reference
```

---

## Implementation Patterns

### Web Audio API

**AudioContext initialization:**
```javascript
// Always check state before creating nodes (Safari requirement)
const ctx = new (window.AudioContext || window.webkitAudioContext)();

if (ctx.state === 'suspended') {
  await ctx.resume();
}
```

**Cleanup pattern:**
```javascript
useEffect(() => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  // ... setup nodes ...
  osc.start();

  return () => {
    // Wrap ramp in try-catch (may throw if context closed)
    try {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    } catch (e) {
      // AudioContext closed or suspended
    }

    setTimeout(() => {
      try { osc.stop(); } catch (e) {}
    }, 80);
  };
}, [dependencies]);
```

**LFO routing (from audio-engine.js):**
```javascript
// Disconnect all connections before routing to new target
// NOTE: disconnect() without args is intentional - removes all connections
// so we can cleanly route to a new target. Modern browsers efficiently
// garbage-collect disconnected nodes.
try {
  this.lfoGain.disconnect();
} catch (e) {
  // Not connected yet
}

// Route to new target
if (target === 'pitch') {
  this.lfoGain.connect(this.osc.frequency);
} else if (target === 'filter') {
  this.lfoGain.connect(this.filter.frequency);
}
```

### React + Audio

**Best practices for course chapters:**
- Use `useEffect` for audio node lifecycle
- Store node refs to avoid recreating on parameter changes
- Always implement cleanup function
- Check `audio.ready` before accessing AudioContext
- Wrap Web Audio operations in try-catch
- Test on Safari (different AudioContext behavior)

**Shared AudioContext pattern:**
```jsx
// In AudioProvider.jsx
export const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const audioEngine = useRef(new AudioEngine());
  // ... initialization logic ...

  return (
    <AudioContext.Provider value={{ engine: audioEngine.current, ... }}>
      {children}
    </AudioContext.Provider>
  );
}

// In Chapter component
const audio = useContext(AudioContext);

useEffect(() => {
  if (!audio.ready) return;

  const ctx = audio.ctx.current;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  // ... create nodes ...
}, [audio.ready]);
```

### Memory Leak Prevention

**Event listeners in synth/keyboard.js:**
```javascript
// Use flag to prevent duplicate registration on re-render
let documentListenersAdded = false;

export function initKeyboard() {
  // ... keyboard rendering ...

  if (!documentListenersAdded) {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    documentListenersAdded = true;
  }
}
```

---

## Testing & Debugging

**Browser testing checklist:**
- Chrome: Full feature support, baseline testing
- Safari iOS/macOS: Check AudioContext state handling
- Firefox: Verify Web Audio compatibility
- Mobile touch: Test keyboard touch targets (44×44px minimum)

**Common issues:**
- **Silent audio:** AudioContext not resumed (Safari)
- **Console errors on navigation:** Missing try-catch around ramps
- **Memory leak:** Event listeners not properly flagged
- **Clicks/pops:** Oscillator stop/start instead of frequency modulation
- **Build fails:** Check Node 20+, pnpm 9+

**Debug tools:**
- Chrome DevTools → Performance tab for audio graph analysis
- Safari Web Inspector → Sources tab for debugging suspended state
- Lighthouse audit for PWA compliance (target 90+ all categories)

---

## Deployment

**GitHub Actions workflow (`.github/workflows/deploy.yml`):**
- Triggers on push to `main` or manual dispatch
- Installs pnpm dependencies with cache
- Builds production bundle
- Deploys to GitHub Pages

**Bundle size (production):**
- Total: ~226KB raw (~67KB gzipped)
- React + ReactDOM: ~45KB gzipped
- Audio engine + modules: ~15KB gzipped
- Course chapters: ~20KB gzipped (code-split)
- Workbox SW: ~21KB

**Performance targets:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse PWA score: 90+

---

## Common Tasks

**Add a new course chapter:**
1. Create `src/course/chapters/Chapter8.jsx`
2. Import and add to `chapters` array in `course-app.jsx`
3. Add navigation button in `Navigation.jsx`
4. Follow existing chapter structure for audio cleanup

**Modify synthesizer module:**
1. Edit corresponding file in `src/synth/modules/` or `src/synth/visualizers/`
2. Use `Voice` API from audio-engine.js
3. Test with `pnpm run dev`
4. Verify no console errors on parameter changes

**Update PWA manifest:**
1. Edit `public/manifest.json`
2. Update icons in `public/icons/` if needed
3. Rebuild and test "Add to Home Screen"

**Debug audio issues:**
1. Open DevTools console
2. Check for AudioContext state errors
3. Verify try-catch around Web Audio operations
4. Test on Safari if iOS-specific issue
