// ======================================================================
// Spectrum Analyzer Visualizer
// ======================================================================

import { audioEngine } from '../../lib/audio-engine.js';

let lfoPhaseSpectrum = 0;
let lastFrameTimeSpectrum = performance.now();

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

export function renderSpectrum(now = performance.now()) {
  const canvas = document.getElementById('specCanvas');
  if (!canvas || !audioEngine.analyser) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const bufferLength = audioEngine.analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  audioEngine.analyser.getByteFrequencyData(dataArray);

  // Clear canvas
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, width, height);

  // Only show first ~quarter (up to ~5kHz)
  const usable = Math.floor(bufferLength * 0.25);
  const barWidth = width / usable;

  for (let i = 0; i < usable; i++) {
    const v = dataArray[i] / 255;
    const barHeight = v * height * 0.9;
    const hue = 180 + v * 40; // cyan to blue-ish

    ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.4 + v * 0.6})`;
    ctx.fillRect(i * barWidth, height - barHeight, Math.max(barWidth - 0.5, 1), barHeight);
  }

  // --- Draw LFO indicator when targeting filter ---

  const synthState = window.synthState;
  if (synthState && synthState.lfoOn && synthState.lfoTarget === 'filter') {
    // Update LFO phase
    const dt = (now - lastFrameTimeSpectrum) / 1000;
    lfoPhaseSpectrum += dt * synthState.lfoRate;
    lfoPhaseSpectrum = lfoPhaseSpectrum % 1;
    lastFrameTimeSpectrum = now;

    // Calculate current LFO value (-1 to 1)
    const lfoValue = generateLFOValue(lfoPhaseSpectrum, synthState.lfoWave);

    // Calculate filter cutoff position with LFO modulation
    // LFO depth for filter is: lfoDepth * 80 Hz (from audio-engine.js)
    const baseCutoff = synthState.filterCutoff;
    const modulation = lfoValue * synthState.lfoDepth * 80;
    const currentCutoff = Math.max(20, Math.min(20000, baseCutoff + modulation));

    // Map frequency to x position on spectrum
    // Spectrum shows frequencies from 0 to (sampleRate / 2)
    // We're displaying first 1/4 of bins, so 0 to (sampleRate / 8)
    const sampleRate = audioEngine.context.sampleRate;
    const maxFreqDisplayed = sampleRate / 8; // ~6kHz at 48kHz sample rate
    const freqRatio = currentCutoff / maxFreqDisplayed;
    const cutoffX = freqRatio * width;

    // Draw vertical line at filter cutoff position
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cutoffX, 0);
    ctx.lineTo(cutoffX, height);
    ctx.stroke();

    // Draw glow
    ctx.strokeStyle = '#f59e0b40';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cutoffX, 0);
    ctx.lineTo(cutoffX, height);
    ctx.stroke();

    // Draw label
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px monospace';
    ctx.fillText(`LFO → ${Math.round(currentCutoff)}Hz`, 8, 16);
  }
}
