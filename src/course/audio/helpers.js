/**
 * Audio and visualization helpers for the course.
 * Extracted from original monolithic course.html.
 */

/**
 * Play a short UI feedback blip
 */
export function playBlip(ctx, master, freq = 880, dur = 0.06) {
  if (!ctx.current) return;
  const o = ctx.current.createOscillator();
  const g = ctx.current.createGain();
  o.frequency.value = freq;
  o.type = 'sine';
  g.gain.setValueAtTime(0.15, ctx.current.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.current.currentTime + dur);
  o.connect(g);
  g.connect(master.current);
  o.start();
  o.stop(ctx.current.currentTime + dur + 0.01);
}

/**
 * Note frequencies for sequencer (Chapter 7)
 */
export const NOTE_FREQS = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.0,
  A: 440.0,
  B: 493.88,
  "C'": 523.25,
};

/**
 * Generate visual waveform points for SVG rendering
 */
export function generateWaveform(type, numPoints = 300, cycles = 2) {
  const pts = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * cycles;
    const phase = t * Math.PI * 2;
    let y;
    switch (type) {
      case 'sine':
        y = Math.sin(phase);
        break;
      case 'saw':
        y = 2 * (t % 1) - 1;
        break;
      case 'square':
        y = (t % 1) < 0.5 ? 1 : -1;
        break;
      case 'triangle':
        y = 4 * Math.abs((t % 1) - 0.5) - 1;
        break;
      default:
        y = 0;
    }
    pts.push({ x: i / numPoints, y });
  }
  return pts;
}

/**
 * Calculate harmonic amplitudes for a given waveform type
 */
export function getHarmonics(type, count = 16) {
  const h = [];
  for (let n = 1; n <= count; n++) {
    let a;
    switch (type) {
      case 'sine':
        a = n === 1 ? 1 : 0;
        break;
      case 'saw':
        a = 1 / n;
        break;
      case 'square':
        a = n % 2 === 1 ? 1 / n : 0;
        break;
      case 'triangle':
        a = n % 2 === 1 ? 1 / (n * n) : 0;
        break;
      default:
        a = 0;
    }
    h.push({ n, amp: a });
  }
  return h;
}

/**
 * Calculate filter magnitude response at a given frequency
 */
export function filterMagnitude(freq, cutoff, Q) {
  const w = freq / cutoff;
  const d = Math.sqrt(Math.pow(1 - w * w, 2) + Math.pow(w / Q, 2));
  return d > 0 ? 1 / d : 1;
}

/**
 * Convert array of {x, y} points to SVG path data
 */
export function pointsToPath(pts, w, h, m = 0) {
  return pts
    .map((p, i) => {
      const x = m + p.x * (w - 2 * m);
      const y = h / 2 - p.y * (h / 2 - m);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}
