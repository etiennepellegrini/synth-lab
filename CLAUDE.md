# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Repository Overview

**synth-course** is an interactive course about sound/music synthesis, geared towards beginners, and especially made for Etienne who just bought a Korg Volca Keys. The repository contains two main interactive web applications plus supporting documentation.

The first draft of all files was created in Claude's chat interface.

---

## Development Workflow

**Running the applications:**
```bash
# Option 1: Open directly in browser
open synth.html
open synth-course.html

# Option 2: Serve with Python (for PWA features to work properly)
python3 -m http.server 8000
# Then visit http://localhost:8000/synth.html or synth-course.html
```

**No build process exists** — these are self-contained HTML files with embedded CSS and JavaScript. Changes take effect immediately on browser refresh.

**Testing:** Open in Chrome/Firefox/Safari and test with browser DevTools open. Web Audio API requires user interaction before playing sound (browser security policy).

---

## Architecture

### Two Self-Contained Applications

Both applications are **single-file, zero-dependency** web apps. All CSS and JavaScript are embedded directly in the HTML.

#### 1. `synth-course.html` — Interactive Course
- **Framework:** React 18 (loaded via CDN: unpkg.com)
- **Transpilation:** Babel Standalone (for JSX)
- **Structure:** 7 chapters, each as a React component
- **Audio Engine:** Web Audio API with shared AudioContext provider
- **Key Pattern:** Each chapter manages its own audio nodes (oscillators, filters, gains) with cleanup on unmount
- **Visual Elements:** SVG visualizations rendered inline (waveforms, frequency response curves, ADSR envelopes)

**React Architecture:**
- `AudioProvider` context wraps the entire app, providing shared `AudioContext`, master gain, and limiter
- Each chapter component (`Chapter1` through `Chapter7`) is self-contained with its own state and audio node management
- `useEffect` hooks handle audio node lifecycle (creation on mount, cleanup on unmount)
- Real-time parameter updates use refs to audio nodes, allowing slider changes without recreating nodes

#### 2. `synth.html` — Synthesizer Simulator
- **Framework:** Vanilla JavaScript (no React)
- **Architecture:** Single persistent audio graph with state-driven rendering
- **UI Pattern:** Full re-render on state change (innerHTML replacement)
- **Audio Graph:** Persistent oscillator/filter/amp chain initialized once, controlled via state updates
- **Envelope:** Frame-based ADSR processing using requestAnimationFrame

**Audio Signal Flow:**
```
osc (persistent) → filter → ampGain (envelope) → delay split → masterGain → limiter → analyser → destination
                                                   ↓
                                          delayNode → feedback loop
```

**Key Implementation Details:**
- **Oscillator:** Single persistent oscillator (never stopped) with frequency modulated on note changes
- **Envelope:** Custom ADSR implemented with requestAnimationFrame loop, not using Web Audio envelope nodes
- **LFO:** Separate oscillator routed to pitch or filter frequency via gain node
- **Delay:** Feedback loop using delay node + gain node
- **Scope:** Real-time oscilloscope using analyser node + canvas

### Web Audio API Patterns

**Common pattern in both files:**
```javascript
// 1. Initialize AudioContext on user interaction (browser requirement)
const ctx = new (window.AudioContext || window.webkitAudioContext)();

// 2. Create master gain + limiter for safety
const master = ctx.createGain();
const limiter = ctx.createDynamicsCompressor();
limiter.threshold.value = -6;
limiter.ratio.value = 8;

// 3. Build signal chain
osc.connect(filter);
filter.connect(gain);
gain.connect(master);
master.connect(limiter);
limiter.connect(ctx.destination);
```

**Cleanup pattern (synth-course.html):**
```javascript
useEffect(() => {
  // Setup audio nodes
  const osc = ctx.createOscillator();
  osc.start();

  return () => {
    // Cleanup: ramp gain to zero, then stop
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    setTimeout(() => osc.stop(), 80);
  };
}, [dependencies]);
```

### PWA Setup

`synth.html` is installable as a Progressive Web App:
- **manifest.json:** Defines app name, icons, theme colors, display mode
- **sw.js:** Service Worker with network-first caching strategy
- Cache includes both synth.html and manifest.json
- Offline fallback message when network unavailable

---

## File Structure

| File | Purpose |
|------|---------|
| `synth-course.html` | 7-chapter interactive course with Web Audio demos |
| `synth.html` | Full synthesizer simulator (PWA-enabled) |
| `first-session.md` | Guided 45-60 min tutorial for Volca Keys beginners |
| `cheat-sheet.md` | Quick reference for Volca Keys controls and key combos |
| `manifest.json` | PWA manifest for synth.html |
| `sw.js` | Service Worker for offline capability |

---

## Implementation Notes

**When modifying audio code:**
- Always test in multiple browsers (Safari uses webkit prefix for some APIs)
- Remember exponentialRampToValueAtTime cannot ramp to zero (use 0.001)
- User gesture required before AudioContext starts (call on button click, not on page load)
- Avoid creating/destroying oscillators rapidly — use persistent oscillators with frequency changes when possible

**When modifying synth.html:**
- State changes trigger full re-render via `render()` function
- Must re-acquire canvas contexts after each render
- Audio nodes persist across renders (stored in module-level variables)

**When modifying synth-course.html:**
- Each chapter is independent — changes to one don't affect others
- Audio cleanup is critical to prevent overlapping sounds when switching chapters
- SVG viewBox dimensions are hardcoded in each visualization — maintain aspect ratios
