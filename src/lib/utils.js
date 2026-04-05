// ======================================================================
// Shared Utilities for Synth Lab
// ======================================================================

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Map a value from one range to another
 * @param {number} value - Input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value
 */
export function map(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/**
 * Check if device is mobile/touch-enabled
 * @returns {boolean} True if mobile
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format frequency for display
 * @param {number} freq - Frequency in Hz
 * @returns {string} Formatted string (e.g., "1.2k Hz" or "440 Hz")
 */
export function formatFreq(freq) {
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(1)}k Hz`;
  }
  return `${Math.round(freq)} Hz`;
}

/**
 * Format time for display
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted string (e.g., "150ms" or "1.2s")
 */
export function formatTime(seconds) {
  if (seconds < 0.1) {
    return `${Math.round(seconds * 1000)}ms`;
  }
  return `${seconds.toFixed(2)}s`;
}

/**
 * Generate waveform points for visualization
 * @param {string} type - Waveform type ('sine', 'saw', 'square', 'triangle')
 * @param {number} numPoints - Number of points to generate
 * @param {number} cycles - Number of cycles to display
 * @returns {Array<{x: number, y: number}>} Array of {x, y} points
 */
export function generateWaveform(type, numPoints = 300, cycles = 2) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * cycles;
    const phase = t * Math.PI * 2;
    let y;

    switch (type) {
      case 'sine':
        y = Math.sin(phase);
        break;
      case 'saw':
      case 'sawtooth':
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

    points.push({ x: i / numPoints, y });
  }
  return points;
}

/**
 * Calculate harmonic amplitudes for a waveform
 * @param {string} type - Waveform type
 * @param {number} count - Number of harmonics to calculate
 * @returns {Array<{n: number, amp: number}>} Array of harmonic data
 */
export function getHarmonics(type, count = 16) {
  const harmonics = [];
  for (let n = 1; n <= count; n++) {
    let amp;
    switch (type) {
      case 'sine':
        amp = n === 1 ? 1 : 0;
        break;
      case 'saw':
      case 'sawtooth':
        amp = 1 / n;
        break;
      case 'square':
        amp = n % 2 === 1 ? 1 / n : 0;
        break;
      case 'triangle':
        amp = n % 2 === 1 ? 1 / (n * n) : 0;
        break;
      default:
        amp = 0;
    }
    harmonics.push({ n, amp });
  }
  return harmonics;
}

/**
 * Calculate filter magnitude response at a frequency
 * @param {number} freq - Frequency in Hz
 * @param {number} cutoff - Cutoff frequency in Hz
 * @param {number} Q - Filter Q/resonance
 * @returns {number} Magnitude (linear scale)
 */
export function filterMagnitude(freq, cutoff, Q) {
  const w = freq / cutoff;
  const d = Math.sqrt(Math.pow(1 - w * w, 2) + Math.pow(w / Q, 2));
  return d > 0 ? 1 / d : 1;
}

/**
 * Convert SVG points array to path string
 * @param {Array<{x: number, y: number}>} points - Array of points (x, y in 0-1 range)
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @param {number} margin - Margin around the edges
 * @returns {string} SVG path string
 */
export function pointsToPath(points, width, height, margin = 0) {
  return points
    .map((p, i) => {
      const x = margin + p.x * (width - 2 * margin);
      const y = height / 2 - p.y * (height / 2 - margin);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}
