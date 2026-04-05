# Synth Lab — Interactive Synthesizer & Course

Learn synthesis fundamentals with hands-on audio demos and a playable web synthesizer. Built specifically for the Korg Volca Keys but applicable to any subtractive synthesizer.

**[Live Demo →](#)** *(Update with your GitHub Pages URL)*

---

## Features

### 🎹 Interactive Synthesizer
- Full-featured web synthesizer with VCO, VCF, envelope, LFO, and delay
- Play via touch keyboard or QWERTY keys (A-K = notes, Z/X = octaves)
- Real-time oscilloscope, spectrum analyzer, and envelope visualization
- Mobile-optimized touch interface

### 📚 7-Chapter Interactive Course
- **Chapter 1:** What Is Sound? (frequency, amplitude, waveforms)
- **Chapter 2:** Oscillators & Waveforms (sine, saw, square, triangle, harmonics)
- **Chapter 3:** Filters (cutoff, resonance, frequency response)
- **Chapter 4:** Envelopes (ADSR, attack/decay/sustain/release)
- **Chapter 5:** LFO & Modulation (vibrato, wah, tremolo)
- **Chapter 6:** Signal Flow (VCO → VCF → VCA architecture)
- **Chapter 7:** Sequencer & Effects (step sequencing, delay)

Each chapter includes:
- Live audio demos with real-time parameter control
- Interactive visualizations (waveforms, spectrums, envelopes)
- "On Your Volca Keys" callouts linking concepts to hardware
- "Dive Deeper" sections for advanced topics

### ✨ PWA Features
- Installable on iOS and Android
- Works fully offline
- PWA shortcuts to jump directly to synthesizer or course
- Auto-updates when new versions deploy

---

## Local Development

### Prerequisites
- **Node.js** 20+
- **pnpm** 9+ (package manager)

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/synth-course.git
cd synth-course

# Install dependencies
pnpm install

# Start dev server
pnpm run dev
```

Visit:
- `http://localhost:5173/` — Landing page
- `http://localhost:5173/synth.html` — Synthesizer
- `http://localhost:5173/course.html` — Course

### Build for Production

```bash
# Build optimized bundles
pnpm run build

# Preview production build locally
pnpm run preview
```

Output in `dist/` directory.

---

## Architecture

### Tech Stack
- **Vite** — Build tool with multi-entry setup
- **React 18** — Course UI (JSX pre-compiled, no runtime Babel)
- **Vanilla JS** — Synthesizer (no framework overhead)
- **Web Audio API** — Shared audio engine
- **Workbox** — PWA service worker via vite-plugin-pwa

### Project Structure

```
synth-course/
├── src/
│   ├── index.html                  # Landing page
│   ├── synth.html                  # Synthesizer entry point
│   ├── course.html                 # Course entry point
│   ├── lib/
│   │   ├── audio-engine.js         # Shared Web Audio engine
│   │   └── utils.js                # Shared utilities
│   ├── styles/
│   │   ├── tokens.css              # CSS custom properties
│   │   ├── synth.css               # Synthesizer styles
│   │   └── course.css              # Course styles
│   ├── synth/
│   │   ├── synth-app.js            # Main orchestrator
│   │   ├── keyboard.js             # Touch keyboard + QWERTY
│   │   ├── modules/                # OSC, filter, envelope, LFO, delay
│   │   └── visualizers/            # Oscilloscope, spectrum, envelope viz
│   └── course/
│       ├── main.jsx                # Course entry point
│       ├── course-app.jsx          # Main app with routing
│       ├── audio/
│       │   ├── AudioProvider.jsx   # React context wrapper
│       │   └── helpers.js          # Audio utilities
│       ├── components/             # Shared UI components
│       └── chapters/               # Chapter1.jsx through Chapter7.jsx
├── public/
│   └── manifest.json               # PWA manifest
├── .github/workflows/
│   └── deploy.yml                  # Auto-deploy to GitHub Pages
├── vite.config.js                  # Build configuration
└── package.json
```

### Audio Signal Flow

**Synthesizer:**
```
osc (persistent) → filter → ampGain (envelope) → delay → master → limiter → analyser
```

**Course chapters:**
```
osc (per demo) → filter/gain → master → limiter → analyser
```

### Key Implementation Details

- **Shared audio engine:** `AudioEngine` singleton with `Voice` class for full signal chains
- **Persistent oscillator:** Synthesizer uses one oscillator with frequency modulation (avoids clicks)
- **Frame-based envelope:** Custom ADSR using `requestAnimationFrame` (easier visualization)
- **Hash-based routing:** Course supports deep linking (`#chapter-3`)
- **Targeted DOM updates:** Synthesizer updates only value displays, not full re-renders
- **Event delegation:** Keyboard module uses flags to prevent slider release from stopping notes

---

## Bundle Size

| Component | Size | Gzipped | Notes |
|-----------|------|---------|-------|
| Course | 183KB | 58KB | React + 7 chapters |
| Synth | 21KB | 5.5KB | Vanilla JS, no framework |
| Audio Engine | 8KB | 2.5KB | Shared by both apps |
| **Total Precached** | **226KB** | **~67KB** | All offline assets |

**Eliminated 800KB Babel runtime** by pre-compiling JSX with Vite.

---

## Deployment

### GitHub Pages (Automatic)

1. Push to `main` branch — GitHub Actions auto-builds and deploys
2. Enable GitHub Pages in repo settings:
   - Settings → Pages → Source: **GitHub Actions**
3. Your site will be live at `https://YOUR_USERNAME.github.io/synth-course/`

### Manual Deployment

```bash
pnpm run build
# Upload dist/ to any static host
```

**Important:** If deploying to a subdirectory, update `base` in `vite.config.js`.

---

## Browser Support

- **Chrome/Edge** 90+ (full support)
- **Firefox** 88+ (full support)
- **Safari** 14+ (full support)
- **iOS Safari** 14+ (PWA installable)
- **Chrome Android** 90+ (PWA installable)

**Requirements:**
- Web Audio API
- ES2020+ features (async/await, optional chaining)
- CSS custom properties

---

## Companion Materials

- **[first-session.md](first-session.md)** — Guided 45-60 minute hands-on tutorial for Volca Keys beginners
- **[cheat-sheet.md](cheat-sheet.md)** — Quick reference for Volca Keys controls and key combos

---

## Contributing

This project was built as a personal learning tool. If you find bugs or have suggestions:

1. Open an issue describing the problem
2. Fork the repo and create a feature branch
3. Submit a pull request with a clear description

---

## License

MIT License — see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [Claude Code](https://claude.ai/code) (AI pair programming)
- Inspired by the [Korg Volca Keys](https://www.korg.com/us/products/dj/volca_keys/) analog synthesizer
- Web Audio API reference: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**Made with 🎵 by [Your Name]**
