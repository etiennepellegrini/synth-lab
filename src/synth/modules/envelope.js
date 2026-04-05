// ======================================================================
// Envelope Visualization Module
// ======================================================================

import { state, getVoice } from '../synth-app.js';

export function renderEnvelopeViz() {
  const canvas = document.getElementById('envCanvas');
  if (!canvas) return;

  const voice = getVoice();
  if (!voice) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear
  ctx.fillStyle = '#0e0e16';
  ctx.fillRect(0, 0, width, height);

  if (!state.envOn) {
    ctx.fillStyle = '#66667a';
    ctx.font = '20px "Source Code Pro"';
    ctx.textAlign = 'center';
    ctx.fillText('ENVELOPE OFF', width / 2, height / 2 + 8);
    return;
  }

  const s = state;
  const m = 8;
  const totalTime = s.envA + s.envD + 0.25 + s.envR;
  const scale = (width - 2 * m) / totalTime;
  const yTop = m;
  const yBottom = height - m;

  // Calculate envelope shape points
  const x0 = m;
  const x1 = m + s.envA * scale;
  const x2 = x1 + s.envD * scale;
  const x3 = x2 + 0.25 * scale;
  const x4 = x3 + s.envR * scale;
  const ySustain = yBottom - s.envS * (yBottom - yTop);

  // Draw envelope shape
  ctx.strokeStyle = '#22d3ee80';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, yBottom);
  ctx.lineTo(x1, yTop);
  ctx.lineTo(x2, ySustain);
  ctx.lineTo(x3, ySustain);
  ctx.lineTo(x4, yBottom);
  ctx.stroke();

  // Draw level indicator
  const level = voice.envLevel || 0;
  const yLevel = yBottom - level * (yBottom - yTop);

  const phaseColors = {
    idle: '#66667a',
    attack: '#34d399',
    decay: '#f5a623',
    sustain: '#22d3ee',
    release: '#f06050',
  };

  ctx.fillStyle = phaseColors[voice.envPhase] || '#66667a';
  ctx.beginPath();
  ctx.arc(m + 4, yLevel, 6, 0, Math.PI * 2);
  ctx.fill();
}
