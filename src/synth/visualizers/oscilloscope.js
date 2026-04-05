// ======================================================================
// Oscilloscope Visualizer
// ======================================================================

import { audioEngine } from '../../lib/audio-engine.js';
import { renderSpectrum } from './spectrum.js';
import { renderEnvelopeViz } from '../modules/envelope.js';

let animationFrameId = null;
let lfoPhase = 0;
let lastFrameTime = performance.now();

export function startOscilloscopeLoop() {
  if (animationFrameId) return; // Already running

  function draw(now) {
    renderOscilloscope(now);
    renderSpectrum(); // Also render spectrum in same loop
    renderEnvelopeViz(); // And envelope visualization
    animationFrameId = requestAnimationFrame(draw);
  }

  animationFrameId = requestAnimationFrame(draw);
}

export function stopOscilloscopeLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Find zero-crossing trigger point for stable waveform display
 * @param {Uint8Array} data - Time domain data
 * @returns {number} Index of trigger point, or 0 if not found
 */
function findTriggerPoint(data) {
  const midpoint = 128;
  const threshold = 2; // Hysteresis threshold

  // Look for upward zero crossing (going from below to above midpoint)
  for (let i = 1; i < data.length / 2; i++) {
    if (
      data[i - 1] < midpoint - threshold &&
      data[i] >= midpoint + threshold
    ) {
      return i;
    }
  }

  return 0; // No trigger found, start at beginning
}

/**
 * Generate LFO waveform value at given phase (0-1)
 * @param {number} phase - Phase position (0-1)
 * @param {string} waveType - Waveform type
 * @returns {number} Value between -1 and 1
 */
function generateLFOValue(phase, waveType) {
  const t = phase % 1;

  switch (waveType) {
    case 'triangle':
      return 4 * Math.abs(t - 0.5) - 1;
    case 'sawtooth':
      return 2 * t - 1;
    case 'square':
      return t < 0.5 ? 1 : -1;
    case 'sine':
      return Math.sin(2 * Math.PI * t);
    default:
      return 0;
  }
}

export function renderOscilloscope(now = performance.now()) {
  const canvas = document.getElementById('scopeCanvas');
  if (!canvas || !audioEngine.analyser) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const bufferLength = audioEngine.analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);
  audioEngine.analyser.getByteTimeDomainData(dataArray);

  // Clear canvas
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, width, height);

  // Draw grid
  ctx.strokeStyle = '#1a1a28';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  for (let i = 1; i < 4; i++) {
    ctx.moveTo((width * i) / 4, 0);
    ctx.lineTo((width * i) / 4, height);
  }
  ctx.stroke();

  // --- Draw main waveform (with triggering for stability) ---

  const triggerPoint = findTriggerPoint(dataArray);
  const displaySamples = Math.min(bufferLength - triggerPoint, bufferLength);
  const sliceWidth = width / displaySamples;

  // Draw waveform
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  let x = 0;
  for (let i = 0; i < displaySamples; i++) {
    const idx = triggerPoint + i;
    if (idx >= bufferLength) break;

    const v = dataArray[idx] / 128.0;
    const y = (v * height) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.stroke();

  // Draw glow
  ctx.strokeStyle = '#22d3ee40';
  ctx.lineWidth = 6;
  ctx.beginPath();

  x = 0;
  for (let i = 0; i < displaySamples; i++) {
    const idx = triggerPoint + i;
    if (idx >= bufferLength) break;

    const v = dataArray[idx] / 128.0;
    const y = (v * height) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.stroke();

  // --- Draw LFO waveform overlay (if LFO is enabled) ---

  // Access state from synth-app.js
  const synthState = window.synthState;
  if (synthState && synthState.lfoOn) {
    // Update LFO phase based on time
    const dt = (now - lastFrameTime) / 1000;
    lfoPhase += dt * synthState.lfoRate;
    lfoPhase = lfoPhase % 1;
    lastFrameTime = now;

    // Draw LFO waveform in amber color
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const lfoPoints = 200; // Number of points to draw
    const lfoSliceWidth = width / lfoPoints;

    for (let i = 0; i < lfoPoints; i++) {
      const phase = (lfoPhase + i / lfoPoints) % 1;
      const value = generateLFOValue(phase, synthState.lfoWave);

      // Scale LFO to fit in the display (use 30% of height)
      const lfoX = i * lfoSliceWidth;
      const lfoY = height / 2 - (value * height * 0.15);

      if (i === 0) {
        ctx.moveTo(lfoX, lfoY);
      } else {
        ctx.lineTo(lfoX, lfoY);
      }
    }

    ctx.stroke();

    // Draw LFO glow
    ctx.strokeStyle = '#f59e0b30';
    ctx.lineWidth = 5;
    ctx.beginPath();

    for (let i = 0; i < lfoPoints; i++) {
      const phase = (lfoPhase + i / lfoPoints) % 1;
      const value = generateLFOValue(phase, synthState.lfoWave);

      const lfoX = i * lfoSliceWidth;
      const lfoY = height / 2 - (value * height * 0.15);

      if (i === 0) {
        ctx.moveTo(lfoX, lfoY);
      } else {
        ctx.lineTo(lfoX, lfoY);
      }
    }

    ctx.stroke();

    // Draw LFO label
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px monospace';
    ctx.fillText('LFO', 8, 16);
  }
}
