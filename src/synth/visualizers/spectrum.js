// ======================================================================
// Spectrum Analyzer Visualizer
// ======================================================================

import { audioEngine } from '../../lib/audio-engine.js';

export function renderSpectrum() {
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
}
