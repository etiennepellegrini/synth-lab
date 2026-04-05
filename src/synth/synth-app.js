// ======================================================================
// Synth Lab - Main Application
// ======================================================================

import { audioEngine } from '../lib/audio-engine.js';
import { formatFreq, formatTime } from '../lib/utils.js';
import { renderOscilloscope, startOscilloscopeLoop } from './visualizers/oscilloscope.js';
import { renderSpectrum } from './visualizers/spectrum.js';
import { renderEnvelopeViz } from './modules/envelope.js';
import { initKeyboard } from './keyboard.js';

// ======================================================================
// State Management
// ======================================================================

export const state = {
  // OSC
  oscWave: 'sawtooth',
  oscDetune: 0,

  // Filter
  filterOn: true,
  filterCutoff: 8000,
  filterRes: 0,

  // Envelope
  envOn: true,
  envA: 0.01,
  envD: 0.15,
  envS: 0.7,
  envR: 0.3,

  // LFO
  lfoOn: false,
  lfoWave: 'triangle',
  lfoRate: 4,
  lfoDepth: 30,
  lfoTarget: 'pitch',

  // Delay
  delayOn: false,
  delayTime: 0.3,
  delayFB: 0.3,
  delayMix: 0.3,

  // Keyboard
  octave: 4,
  activeNote: null,

  // UI
  scopeOpen: true,
  spectrumOpen: false,
  masterVol: 0.4,

  // Collapse states for modules
  oscCollapsed: false,
  filterCollapsed: false,
  envCollapsed: false,
  lfoCollapsed: false,
  delayCollapsed: false,
};

// Voice instance
let voice = null;

// ======================================================================
// Audio Initialization
// ======================================================================

export async function initAudio() {
  if (audioEngine.ready && voice) {
    return; // Already initialized
  }

  try {
    if (!audioEngine.ready) {
      await audioEngine.init();
    }

    if (!voice) {
      voice = audioEngine.createVoice();

      // Initialize voice with current state
      voice.setWaveform(state.oscWave);
      voice.setDetune(state.oscDetune);
      voice.setFilterEnabled(state.filterOn);
      voice.setFilterCutoff(state.filterCutoff);
      voice.setFilterResonance(state.filterRes);
      voice.setEnvelopeEnabled(state.envOn);
      voice.setADSR(state.envA, state.envD, state.envS, state.envR);
      voice.setLFOEnabled(state.lfoOn);
      voice.setLFOWave(state.lfoWave);
      voice.setLFORate(state.lfoRate);
      voice.setLFODepth(state.lfoDepth);
      voice.setLFOTarget(state.lfoTarget);
      voice.setDelayEnabled(state.delayOn);
      voice.setDelayTime(state.delayTime);
      voice.setDelayFeedback(state.delayFB);
      voice.setDelayMix(state.delayMix);
    }

    // Start visualization loops
    startOscilloscopeLoop();

    audioEngine.setMasterVolume(state.masterVol);
  } catch (err) {
    console.error('Failed to initialize audio:', err);
    // TODO: Show user-friendly error message in UI
    // Common causes: Safari private mode, permissions denied, browser doesn't support Web Audio API
    return;
  }
}

// ======================================================================
// Note Control (called by keyboard module)
// ======================================================================

export async function noteOn(note, octave) {
  // Ensure audio is initialized before playing
  if (!audioEngine.ready || !voice) {
    await initAudio();
  }

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const idx = NOTE_NAMES.indexOf(note);
  const midi = (octave + 1) * 12 + idx;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);

  voice.noteOn(freq);
  state.activeNote = note;
  updateKeyboardVisuals();
}

export function noteOff() {
  if (voice) {
    voice.noteOff();
  }
  state.activeNote = null;
  updateKeyboardVisuals();
}

// Update only keyboard visual state without full re-render
function updateKeyboardVisuals() {
  const kb = document.getElementById('keyboard');
  if (!kb) return;

  const keys = kb.querySelectorAll('.key-white, .key-black');
  keys.forEach((key) => {
    const note = key.dataset.note;
    if (note === state.activeNote) {
      key.classList.add('active');
    } else {
      key.classList.remove('active');
    }
  });
}

// Update individual value displays without full re-render
function updateValueDisplay(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

// ======================================================================
// UI Event Handlers
// ======================================================================

// --- Oscillator

export function setOscWave(type) {
  state.oscWave = type;
  if (voice) voice.setWaveform(type);
  // Update button active states
  document.querySelectorAll('.wave-sel button').forEach((btn) => {
    const btnText = btn.textContent.toLowerCase();
    const waveText = type === 'sawtooth' ? 'saw' : type;
    btn.classList.toggle('active', btnText === waveText);
  });
}

export function setDetune(value) {
  state.oscDetune = Number(value);
  if (voice) voice.setDetune(Number(value));
  // Update value display only (find the detune value span)
  const detuneSpan = document.querySelector('.knob-group:has(input[min="-100"]) .knob-value');
  if (detuneSpan) detuneSpan.textContent = `${state.oscDetune}¢`;
}

export function toggleOscModule() {
  state.oscCollapsed = !state.oscCollapsed;
  render();
}

// --- Filter

export function toggleFilter() {
  state.filterOn = !state.filterOn;
  if (voice) voice.setFilterEnabled(state.filterOn);
  render();
}

export function setFilterCutoff(value) {
  state.filterCutoff = Number(value);
  if (voice) voice.setFilterCutoff(Number(value));
  // Update display
  const cutoffSpan = document.querySelector('.knob-group:has(input[max="16000"]) .knob-value');
  if (cutoffSpan) cutoffSpan.textContent = formatFreq(state.filterCutoff);
}

export function setFilterRes(value) {
  state.filterRes = Number(value);
  if (voice) voice.setFilterResonance(Number(value));
  // Update display
  const resSpan = document.querySelector('.knob-group:has(input[max="25"]) .knob-value');
  if (resSpan) resSpan.textContent = Number(state.filterRes).toFixed(1);
}

export function toggleFilterModule() {
  state.filterCollapsed = !state.filterCollapsed;
  render();
}

// --- Envelope

export function toggleEnv() {
  state.envOn = !state.envOn;
  if (voice) voice.setEnvelopeEnabled(state.envOn);
  render();
}

export function setEnvAttack(value) {
  state.envA = parseFloat(value);
  if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
  // Update display
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Attack') {
      const valueSpan = knob.querySelector('.knob-value');
      if (valueSpan) valueSpan.textContent = formatTime(state.envA);
    }
  });
}

export function setEnvDecay(value) {
  state.envD = parseFloat(value);
  if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
  // Update display
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Decay') {
      const valueSpan = knob.querySelector('.knob-value');
      if (valueSpan) valueSpan.textContent = formatTime(state.envD);
    }
  });
}

export function setEnvSustain(value) {
  state.envS = parseFloat(value);
  if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
  // Update display
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Sustain') {
      const valueSpan = knob.querySelector('.knob-value');
      if (valueSpan) valueSpan.textContent = `${Math.round(state.envS * 100)}%`;
    }
  });
}

export function setEnvRelease(value) {
  state.envR = parseFloat(value);
  if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
  // Update display
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Release') {
      const valueSpan = knob.querySelector('.knob-value');
      if (valueSpan) valueSpan.textContent = formatTime(state.envR);
    }
  });
}

export function toggleEnvModule() {
  state.envCollapsed = !state.envCollapsed;
  render();
}

// --- LFO

export function toggleLfo() {
  state.lfoOn = !state.lfoOn;
  if (voice) voice.setLFOEnabled(state.lfoOn);
  render();
}

export function setLfoWave(type) {
  state.lfoWave = type;
  if (voice) voice.setLFOWave(type);
  render();
}

export function setLfoRate(value) {
  state.lfoRate = parseFloat(value);
  if (voice) voice.setLFORate(parseFloat(value));
  // Update display
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Rate') {
      const valueSpan = knob.querySelector('.knob-value');
      if (valueSpan) valueSpan.textContent = `${Number(state.lfoRate).toFixed(1)} Hz`;
    }
  });
}

export function setLfoDepth(value) {
  state.lfoDepth = parseFloat(value);
  if (voice) voice.setLFODepth(parseFloat(value));
  // Update display
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Depth') {
      const valueSpan = knob.querySelector('.knob-value');
      if (valueSpan) valueSpan.textContent = `${state.lfoDepth}`;
    }
  });
}

export function setLfoTarget(target) {
  state.lfoTarget = target;
  if (voice) voice.setLFOTarget(target);
  render();
}

export function toggleLfoModule() {
  state.lfoCollapsed = !state.lfoCollapsed;
  render();
}

// --- Delay

export function toggleDelay() {
  state.delayOn = !state.delayOn;
  if (voice) voice.setDelayEnabled(state.delayOn);
  render();
}

export function setDelayTime(value) {
  state.delayTime = parseFloat(value);
  if (voice) voice.setDelayTime(parseFloat(value));
  // Update display
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Time') {
      const valueSpan = knob.querySelector('.knob-value');
      if (valueSpan) valueSpan.textContent = `${(state.delayTime * 1000).toFixed(0)}ms`;
    }
  });
}

export function setDelayFB(value) {
  state.delayFB = parseFloat(value);
  if (voice) voice.setDelayFeedback(parseFloat(value));
  // Update display
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Feedback') {
      const valueSpan = knob.querySelector('.knob-value');
      if (valueSpan) valueSpan.textContent = `${Math.round(state.delayFB * 100)}%`;
    }
  });
}

export function setDelayMix(value) {
  state.delayMix = parseFloat(value);
  if (voice) voice.setDelayMix(parseFloat(value));
  // Update display
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Mix') {
      const valueSpan = knob.querySelector('.knob-value');
      if (valueSpan) valueSpan.textContent = `${Math.round(state.delayMix * 100)}%`;
    }
  });
}

export function toggleDelayModule() {
  state.delayCollapsed = !state.delayCollapsed;
  render();
}

// --- Scope/Spectrum

export function toggleScope() {
  state.scopeOpen = !state.scopeOpen;
  render();
}

export function toggleSpectrum() {
  state.spectrumOpen = !state.spectrumOpen;
  render();
}

// --- Keyboard

export function changeOctave(delta) {
  state.octave = Math.max(1, Math.min(7, state.octave + delta));
  render();
}

// ======================================================================
// Main Render Function
// ======================================================================

// NOTE: Using innerHTML for controlled template rendering (no user input)
export function render() {
  const app = document.getElementById('app');
  const s = state;

  app.innerHTML = `
    <!-- Signal flow -->
    <div class="signal-flow">
      <div class="node on">OSC</div><span class="arrow">→</span>
      <div class="node ${s.filterOn ? 'on' : ''}">FILTER</div><span class="arrow">→</span>
      <div class="node ${s.envOn ? 'on' : ''}">ENV</div><span class="arrow">→</span>
      <div class="node ${s.delayOn ? 'on' : ''}">DELAY</div><span class="arrow">→</span>
      <div class="node on">OUT</div>
      ${s.lfoOn ? `<span class="arrow" style="margin-left:8px">↻</span><div class="node" style="border-color:var(--purple);color:var(--purple)">LFO→${s.lfoTarget}</div>` : ''}
    </div>

    <!-- Oscilloscope -->
    <div class="scope-wrap">
      <div class="scope-head" onclick="window.toggleScope()">
        <span class="module-title" style="color:var(--cyan)">OSCILLOSCOPE</span>
        <span style="font-size:0.6rem;color:var(--text-3)">${s.scopeOpen ? '▼' : '▶'}</span>
      </div>
      ${s.scopeOpen ? '<canvas id="scopeCanvas" height="140"></canvas>' : ''}
    </div>

    <!-- Spectrum -->
    <div class="scope-wrap">
      <div class="scope-head" onclick="window.toggleSpectrum()">
        <span class="module-title" style="color:var(--purple)">FREQUENCY SPECTRUM</span>
        <span style="font-size:0.6rem;color:var(--text-3)">${s.spectrumOpen ? '▼' : '▶'}</span>
      </div>
      ${s.spectrumOpen ? '<canvas id="specCanvas" height="90"></canvas>' : ''}
    </div>

    <!-- OSC Module -->
    <div class="module">
      <div class="module-head" onclick="window.toggleOscModule()">
        <span class="module-title" style="color:var(--cyan)">OSCILLATOR</span>
        <span style="font-size:0.6rem;color:var(--text-3)">${s.oscCollapsed ? '▶' : '▼'}</span>
      </div>
      <div class="module-body ${s.oscCollapsed ? 'collapsed' : ''}">
        <div>
          <div class="knob-label">Waveform</div>
          <div class="wave-sel">
            ${['sine', 'sawtooth', 'square', 'triangle'].map(w => `<button class="${s.oscWave === w ? 'active' : ''}" onclick="window.setOscWave('${w}')">${w === 'sawtooth' ? 'Saw' : w.charAt(0).toUpperCase() + w.slice(1)}</button>`).join('')}
          </div>
        </div>
        <div class="knob-group">
          <span class="knob-label">Detune</span>
          <input type="range" class="knob-input" min="-100" max="100" value="${s.oscDetune}" oninput="window.setDetune(this.value)"/>
          <span class="knob-value">${s.oscDetune}¢</span>
        </div>
      </div>
    </div>

    <!-- Filter Module -->
    <div class="module">
      <div class="module-head">
        <span class="module-title" style="color:var(--amber)" onclick="window.toggleFilterModule()">FILTER</span>
        <div class="module-toggle ${s.filterOn ? 'on' : ''}" onclick="window.toggleFilter()"></div>
      </div>
      <div class="module-body ${s.filterCollapsed || !s.filterOn ? 'collapsed' : ''}">
        <div class="knob-group">
          <span class="knob-label">Cutoff</span>
          <input type="range" class="knob-input" min="40" max="16000" value="${s.filterCutoff}" oninput="window.setFilterCutoff(this.value)"/>
          <span class="knob-value">${formatFreq(s.filterCutoff)}</span>
        </div>
        <div class="knob-group">
          <span class="knob-label">Resonance</span>
          <input type="range" class="knob-input" min="0" max="25" step="0.5" value="${s.filterRes}" oninput="window.setFilterRes(this.value)"/>
          <span class="knob-value">${Number(s.filterRes).toFixed(1)}</span>
        </div>
      </div>
    </div>

    <!-- Envelope Module -->
    <div class="module">
      <div class="module-head">
        <span class="module-title" style="color:var(--green)" onclick="window.toggleEnvModule()">ENVELOPE</span>
        <div class="module-toggle ${s.envOn ? 'on' : ''}" onclick="window.toggleEnv()"></div>
      </div>
      <div class="module-body ${s.envCollapsed || !s.envOn ? 'collapsed' : ''}" style="flex-direction:column;gap:8px;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div class="knob-group">
            <span class="knob-label">Attack</span>
            <input type="range" class="knob-input" min="0.005" max="2" step="0.005" value="${s.envA}" oninput="window.setEnvAttack(this.value)"/>
            <span class="knob-value">${formatTime(s.envA)}</span>
          </div>
          <div class="knob-group">
            <span class="knob-label">Decay</span>
            <input type="range" class="knob-input" min="0.005" max="2" step="0.005" value="${s.envD}" oninput="window.setEnvDecay(this.value)"/>
            <span class="knob-value">${formatTime(s.envD)}</span>
          </div>
          <div class="knob-group">
            <span class="knob-label">Sustain</span>
            <input type="range" class="knob-input" min="0" max="1" step="0.01" value="${s.envS}" oninput="window.setEnvSustain(this.value)"/>
            <span class="knob-value">${Math.round(s.envS * 100)}%</span>
          </div>
          <div class="knob-group">
            <span class="knob-label">Release</span>
            <input type="range" class="knob-input" min="0.005" max="3" step="0.005" value="${s.envR}" oninput="window.setEnvRelease(this.value)"/>
            <span class="knob-value">${formatTime(s.envR)}</span>
          </div>
        </div>
        <canvas id="envCanvas" height="48" class="env-viz"></canvas>
      </div>
    </div>

    <!-- LFO Module -->
    <div class="module">
      <div class="module-head">
        <span class="module-title" style="color:var(--purple)" onclick="window.toggleLfoModule()">LFO</span>
        <div class="module-toggle ${s.lfoOn ? 'on' : ''}" onclick="window.toggleLfo()"></div>
      </div>
      <div class="module-body ${s.lfoCollapsed || !s.lfoOn ? 'collapsed' : ''}">
        <div>
          <div class="knob-label">Wave</div>
          <div class="wave-sel">
            ${['triangle', 'sawtooth', 'square'].map(w => `<button class="${s.lfoWave === w ? 'active' : ''}" onclick="window.setLfoWave('${w}')">${w === 'sawtooth' ? 'Saw' : w.charAt(0).toUpperCase() + w.slice(1)}</button>`).join('')}
          </div>
        </div>
        <div>
          <div class="knob-label">Target</div>
          <div class="wave-sel target-sel">
            ${['pitch', 'filter'].map(t => `<button class="${s.lfoTarget === t ? 'active' : ''}" onclick="window.setLfoTarget('${t}')">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`).join('')}
          </div>
        </div>
        <div class="knob-group">
          <span class="knob-label">Rate</span>
          <input type="range" class="knob-input" min="0.1" max="20" step="0.1" value="${s.lfoRate}" oninput="window.setLfoRate(this.value)"/>
          <span class="knob-value">${Number(s.lfoRate).toFixed(1)} Hz</span>
        </div>
        <div class="knob-group">
          <span class="knob-label">Depth</span>
          <input type="range" class="knob-input" min="0" max="100" step="1" value="${s.lfoDepth}" oninput="window.setLfoDepth(this.value)"/>
          <span class="knob-value">${s.lfoDepth}</span>
        </div>
      </div>
    </div>

    <!-- Delay Module -->
    <div class="module">
      <div class="module-head">
        <span class="module-title" style="color:var(--red)" onclick="window.toggleDelayModule()">DELAY</span>
        <div class="module-toggle ${s.delayOn ? 'on' : ''}" onclick="window.toggleDelay()"></div>
      </div>
      <div class="module-body ${s.delayCollapsed || !s.delayOn ? 'collapsed' : ''}">
        <div class="knob-group">
          <span class="knob-label">Time</span>
          <input type="range" class="knob-input" min="0.02" max="1.5" step="0.01" value="${s.delayTime}" oninput="window.setDelayTime(this.value)"/>
          <span class="knob-value">${(s.delayTime * 1000).toFixed(0)}ms</span>
        </div>
        <div class="knob-group">
          <span class="knob-label">Feedback</span>
          <input type="range" class="knob-input" min="0" max="0.9" step="0.01" value="${s.delayFB}" oninput="window.setDelayFB(this.value)"/>
          <span class="knob-value">${Math.round(s.delayFB * 100)}%</span>
        </div>
        <div class="knob-group">
          <span class="knob-label">Mix</span>
          <input type="range" class="knob-input" min="0" max="1" step="0.01" value="${s.delayMix}" oninput="window.setDelayMix(this.value)"/>
          <span class="knob-value">${Math.round(s.delayMix * 100)}%</span>
        </div>
      </div>
    </div>

    <!-- Keyboard -->
    <div class="keyboard-wrap" id="keyboardWrap">
      <div class="octave-ctrl">
        <button onclick="window.changeOctave(-1)">◀</button>
        <span>Octave ${s.octave}</span>
        <button onclick="window.changeOctave(1)">▶</button>
      </div>
      <div class="keyboard-row" id="keyboard"></div>
      <div class="qwerty-hint">QWERTY: A W S E D F T G Y H U J = C C# D D# E F F# G G# A A# B</div>
    </div>
  `;

  // Re-acquire canvas contexts
  const scopeCanvas = document.getElementById('scopeCanvas');
  if (scopeCanvas) {
    scopeCanvas.width = scopeCanvas.offsetWidth * 2;
    scopeCanvas.height = 280;
    renderOscilloscope(); // Initial render
  }

  const specCanvas = document.getElementById('specCanvas');
  if (specCanvas) {
    specCanvas.width = specCanvas.offsetWidth * 2;
    specCanvas.height = 180;
  }

  const envCanvas = document.getElementById('envCanvas');
  if (envCanvas) {
    envCanvas.width = envCanvas.offsetWidth * 2;
    envCanvas.height = 96;
  }

  // Re-initialize keyboard after render
  initKeyboard();

  // Visualizations are rendered in continuous loop by startOscilloscopeLoop()
  // No need to call them here
}

// ======================================================================
// Initialization
// ======================================================================

// Export functions to window for inline event handlers
window.setOscWave = setOscWave;
window.setDetune = setDetune;
window.toggleOscModule = toggleOscModule;
window.toggleFilter = toggleFilter;
window.setFilterCutoff = setFilterCutoff;
window.setFilterRes = setFilterRes;
window.toggleFilterModule = toggleFilterModule;
window.toggleEnv = toggleEnv;
window.setEnvAttack = setEnvAttack;
window.setEnvDecay = setEnvDecay;
window.setEnvSustain = setEnvSustain;
window.setEnvRelease = setEnvRelease;
window.toggleEnvModule = toggleEnvModule;
window.toggleLfo = toggleLfo;
window.setLfoWave = setLfoWave;
window.setLfoRate = setLfoRate;
window.setLfoDepth = setLfoDepth;
window.setLfoTarget = setLfoTarget;
window.toggleLfoModule = toggleLfoModule;
window.toggleDelay = toggleDelay;
window.setDelayTime = setDelayTime;
window.setDelayFB = setDelayFB;
window.setDelayMix = setDelayMix;
window.toggleDelayModule = toggleDelayModule;
window.toggleScope = toggleScope;
window.toggleSpectrum = toggleSpectrum;
window.changeOctave = changeOctave;

// Expose state for visualizers (oscilloscope needs LFO state)
window.synthState = state;

// Master volume control
document.addEventListener('DOMContentLoaded', () => {
  const masterVolInput = document.getElementById('masterVol');
  if (masterVolInput) {
    masterVolInput.addEventListener('input', function () {
      state.masterVol = this.value / 100;
      audioEngine.setMasterVolume(state.masterVol);
    });
  }

  // Initial render
  render();
});

// Export voice for visualizers
export function getVoice() {
  return voice;
}
