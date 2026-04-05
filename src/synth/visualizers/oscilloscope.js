// ======================================================================
// Oscilloscope Visualizer
// ======================================================================

import { audioEngine } from '../../lib/audio-engine.js';
import { renderSpectrum } from './spectrum.js';
import { renderEnvelopeViz } from '../modules/envelope.js';

let animationFrameId = null;

export function startOscilloscopeLoop() {
  if (animationFrameId) return; // Already running

  function draw() {
    renderOscilloscope();
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

export function renderOscilloscope() {
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

  // Draw waveform
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  const sliceWidth = width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
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
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * height) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.stroke();
}
