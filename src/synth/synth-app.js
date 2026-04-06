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
// Logarithmic Scaling Helpers
// ======================================================================

/**
 * Convert linear slider position (0-1) to logarithmic value
 * @param {number} position - Linear position (0-1)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Logarithmic value
 */
function logScale(position, min, max) {
  const minLog = Math.log(min);
  const maxLog = Math.log(max);
  return Math.exp(minLog + position * (maxLog - minLog));
}

/**
 * Convert logarithmic value to linear slider position (0-1)
 * @param {number} value - Logarithmic value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Linear position (0-1)
 */
function invLogScale(value, min, max) {
  const minLog = Math.log(min);
  const maxLog = Math.log(max);
  return (Math.log(value) - minLog) / (maxLog - minLog);
}

// ======================================================================
// State Management
// ======================================================================

export const state = {
  // OSC
  oscWave: 'sawtooth',
  oscDetune: 0,

  // Filter
  filterOn: true,
  filterCutoff: 2000, // Changed from 8000 to be visible in spectrum (which shows up to ~5kHz)
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
  lfoRate: 1, // Changed from 4 to 1Hz for more visible modulation
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
  latchMode: false,

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

export function noteOff(force = false) {
  if (state.latchMode && !force) return;
  if (voice) voice.noteOff();
  state.activeNote = null;
  updateKeyboardVisuals();
}

export function toggleLatch() {
  state.latchMode = !state.latchMode;
  if (!state.latchMode) noteOff(true);
  render();
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
  // Update value display only (now an input element)
  const detuneInput = document.querySelector('.knob-group:has(input[min="-100"]) input.knob-value');
  if (detuneInput) {
    detuneInput.value = `${state.oscDetune}¢`;
    detuneInput.dataset.raw = state.oscDetune;
  }
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
  // Update display (now an input element)
  const resInput = document.querySelector('.knob-group:has(input[max="25"]) input.knob-value');
  if (resInput) {
    resInput.value = Number(state.filterRes).toFixed(1);
    resInput.dataset.raw = state.filterRes;
  }
}

// Logarithmic filter cutoff slider
export function setFilterCutoffLog(position) {
  const value = logScale(parseFloat(position), 40, 16000);
  state.filterCutoff = value;
  if (voice) voice.setFilterCutoff(value);
  // Update text display
  const textInput = document.querySelector('.knob-group input[data-raw].knob-value[onblur*="commitFilterCutoff"]');
  if (textInput) {
    textInput.value = formatFreq(value);
    textInput.dataset.raw = value;
  }
}

// Commit manual text edit for filter cutoff
export function commitFilterCutoff(input) {
  const text = input.value.trim().toLowerCase();
  let value;

  // Parse various formats: "2k", "2.5kHz", "500", "500 Hz", etc.
  if (text.includes('k')) {
    value = parseFloat(text) * 1000;
  } else {
    value = parseFloat(text);
  }

  // Clamp to valid range
  value = Math.max(40, Math.min(16000, value));

  if (!isNaN(value)) {
    state.filterCutoff = value;
    if (voice) voice.setFilterCutoff(value);

    // Update slider position
    const slider = document.querySelector('.knob-group input[type="range"][data-log="true"][data-min="40"]');
    if (slider) {
      slider.value = invLogScale(value, 40, 16000);
    }

    // Update text display
    input.value = formatFreq(value);
    input.dataset.raw = value;
  } else {
    // Invalid input - revert to previous value
    const raw = parseFloat(input.dataset.raw);
    input.value = formatFreq(raw);
  }
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
  // Update display (now an input element)
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Attack') {
      const valueInput = knob.querySelector('input.knob-value');
      if (valueInput) {
        valueInput.value = formatTime(state.envA);
        valueInput.dataset.raw = state.envA;
      }
    }
  });
}

export function setEnvDecay(value) {
  state.envD = parseFloat(value);
  if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
  // Update display (now an input element)
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Decay') {
      const valueInput = knob.querySelector('input.knob-value');
      if (valueInput) {
        valueInput.value = formatTime(state.envD);
        valueInput.dataset.raw = state.envD;
      }
    }
  });
}

export function setEnvSustain(value) {
  state.envS = parseFloat(value);
  if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
  // Update display (now an input element)
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Sustain') {
      const valueInput = knob.querySelector('input.knob-value');
      if (valueInput) {
        valueInput.value = `${Math.round(state.envS * 100)}%`;
        valueInput.dataset.raw = state.envS;
      }
    }
  });
}

export function setEnvRelease(value) {
  state.envR = parseFloat(value);
  if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
  // Update display (now an input element)
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Release') {
      const valueInput = knob.querySelector('input.knob-value');
      if (valueInput) {
        valueInput.value = formatTime(state.envR);
        valueInput.dataset.raw = state.envR;
      }
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
  // Update display (now an input element)
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Rate') {
      const valueInput = knob.querySelector('input.knob-value');
      if (valueInput) {
        valueInput.value = `${Number(state.lfoRate).toFixed(1)} Hz`;
        valueInput.dataset.raw = state.lfoRate;
      }
    }
  });
}

export function setLfoDepth(value) {
  state.lfoDepth = parseFloat(value);
  if (voice) voice.setLFODepth(parseFloat(value));
  // Update display (now an input element)
  const knobs = document.querySelectorAll('.knob-group');
  knobs.forEach((knob) => {
    const label = knob.querySelector('.knob-label');
    if (label && label.textContent === 'Depth') {
      const valueInput = knob.querySelector('input.knob-value');
      if (valueInput) {
        valueInput.value = `${state.lfoDepth}`;
        valueInput.dataset.raw = state.lfoDepth;
      }
    }
  });
}

// Logarithmic LFO rate slider
export function setLfoRateLog(position) {
  const value = logScale(parseFloat(position), 0.1, 20);
  state.lfoRate = value;
  if (voice) voice.setLFORate(value);
  // Update text display
  const textInput = document.querySelector('.knob-group input[data-raw].knob-value[onblur*="commitLfoRate"]');
  if (textInput) {
    textInput.value = `${value.toFixed(1)} Hz`;
    textInput.dataset.raw = value;
  }
}

// Commit manual text edit for LFO rate
export function commitLfoRate(input) {
  const text = input.value.trim().toLowerCase();
  let value;

  // Parse various formats: "1", "0.5 Hz", "2Hz", etc.
  value = parseFloat(text);

  // Clamp to valid range
  value = Math.max(0.1, Math.min(20, value));

  if (!isNaN(value)) {
    state.lfoRate = value;
    if (voice) voice.setLFORate(value);

    // Update slider position
    const slider = document.querySelector('.knob-group input[type="range"][data-log="true"][data-min="0.1"]');
    if (slider) {
      slider.value = invLogScale(value, 0.1, 20);
    }

    // Update text display
    input.value = `${value.toFixed(1)} Hz`;
    input.dataset.raw = value;
  } else {
    // Invalid input - revert to previous value
    const raw = parseFloat(input.dataset.raw);
    input.value = `${raw.toFixed(1)} Hz`;
  }
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
      const valueInput = knob.querySelector('input.knob-value');
      if (valueInput) {
        valueInput.value = `${(state.delayTime * 1000).toFixed(0)}ms`;
        valueInput.dataset.raw = state.delayTime;
      }
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
      const valueInput = knob.querySelector('input.knob-value');
      if (valueInput) {
        valueInput.value = `${Math.round(state.delayFB * 100)}%`;
        valueInput.dataset.raw = state.delayFB;
      }
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
      const valueInput = knob.querySelector('input.knob-value');
      if (valueInput) {
        valueInput.value = `${Math.round(state.delayMix * 100)}%`;
        valueInput.dataset.raw = state.delayMix;
      }
    }
  });
}

export function toggleDelayModule() {
  state.delayCollapsed = !state.delayCollapsed;
  render();
}

// ======================================================================
// Text Input Commit Handlers (for editable value labels)
// ======================================================================

export function commitDetune(input) {
  const value = parseInt(input.value);
  if (!isNaN(value)) {
    const clamped = Math.max(-100, Math.min(100, value));
    state.oscDetune = clamped;
    if (voice) voice.setDetune(clamped);
    const slider = input.parentElement.querySelector('input[type="range"]');
    if (slider) slider.value = clamped;
    input.value = `${clamped}¢`;
    input.dataset.raw = clamped;
  } else {
    input.value = `${input.dataset.raw}¢`;
  }
}

export function commitFilterRes(input) {
  const value = parseFloat(input.value);
  if (!isNaN(value)) {
    const clamped = Math.max(0, Math.min(25, value));
    state.filterRes = clamped;
    if (voice) voice.setFilterResonance(clamped);
    const slider = input.parentElement.querySelector('input[type="range"]');
    if (slider) slider.value = clamped;
    input.value = clamped.toFixed(1);
    input.dataset.raw = clamped;
  } else {
    input.value = Number(input.dataset.raw).toFixed(1);
  }
}

export function commitEnvAttack(input) {
  const text = input.value.trim().toLowerCase();
  let value = text.includes('ms') ? parseFloat(text) / 1000 : parseFloat(text);
  if (!isNaN(value)) {
    const clamped = Math.max(0.005, Math.min(2, value));
    state.envA = clamped;
    if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
    const slider = input.parentElement.querySelector('input[type="range"]');
    if (slider) slider.value = clamped;
    input.value = formatTime(clamped);
    input.dataset.raw = clamped;
  } else {
    input.value = formatTime(parseFloat(input.dataset.raw));
  }
}

export function commitEnvDecay(input) {
  const text = input.value.trim().toLowerCase();
  let value = text.includes('ms') ? parseFloat(text) / 1000 : parseFloat(text);
  if (!isNaN(value)) {
    const clamped = Math.max(0.005, Math.min(2, value));
    state.envD = clamped;
    if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
    const slider = input.parentElement.querySelector('input[type="range"]');
    if (slider) slider.value = clamped;
    input.value = formatTime(clamped);
    input.dataset.raw = clamped;
  } else {
    input.value = formatTime(parseFloat(input.dataset.raw));
  }
}

export function commitEnvSustain(input) {
  const value = parseInt(input.value) / 100;
  if (!isNaN(value)) {
    const clamped = Math.max(0, Math.min(1, value));
    state.envS = clamped;
    if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
    const slider = input.parentElement.querySelector('input[type="range"]');
    if (slider) slider.value = clamped;
    input.value = `${Math.round(clamped * 100)}%`;
    input.dataset.raw = clamped;
  } else {
    input.value = `${Math.round(parseFloat(input.dataset.raw) * 100)}%`;
  }
}

export function commitEnvRelease(input) {
  const text = input.value.trim().toLowerCase();
  let value = text.includes('ms') ? parseFloat(text) / 1000 : parseFloat(text);
  if (!isNaN(value)) {
    const clamped = Math.max(0.005, Math.min(3, value));
    state.envR = clamped;
    if (voice) voice.setADSR(state.envA, state.envD, state.envS, state.envR);
    const slider = input.parentElement.querySelector('input[type="range"]');
    if (slider) slider.value = clamped;
    input.value = formatTime(clamped);
    input.dataset.raw = clamped;
  } else {
    input.value = formatTime(parseFloat(input.dataset.raw));
  }
}

export function commitLfoDepth(input) {
  const value = parseInt(input.value);
  if (!isNaN(value)) {
    const clamped = Math.max(0, Math.min(100, value));
    state.lfoDepth = clamped;
    if (voice) voice.setLFODepth(clamped);
    const slider = input.parentElement.querySelector('input[type="range"]');
    if (slider) slider.value = clamped;
    input.value = clamped;
    input.dataset.raw = clamped;
  } else {
    input.value = input.dataset.raw;
  }
}

export function commitDelayTime(input) {
  const value = parseFloat(input.value) / 1000; // Convert ms to seconds
  if (!isNaN(value)) {
    const clamped = Math.max(0.02, Math.min(1.5, value));
    state.delayTime = clamped;
    if (voice) voice.setDelayTime(clamped);
    const slider = input.parentElement.querySelector('input[type="range"]');
    if (slider) slider.value = clamped;
    input.value = `${(clamped * 1000).toFixed(0)}ms`;
    input.dataset.raw = clamped;
  } else {
    input.value = `${(parseFloat(input.dataset.raw) * 1000).toFixed(0)}ms`;
  }
}

export function commitDelayFB(input) {
  const value = parseInt(input.value) / 100;
  if (!isNaN(value)) {
    const clamped = Math.max(0, Math.min(0.9, value));
    state.delayFB = clamped;
    if (voice) voice.setDelayFeedback(clamped);
    const slider = input.parentElement.querySelector('input[type="range"]');
    if (slider) slider.value = clamped;
    input.value = `${Math.round(clamped * 100)}%`;
    input.dataset.raw = clamped;
  } else {
    input.value = `${Math.round(parseFloat(input.dataset.raw) * 100)}%`;
  }
}

export function commitDelayMix(input) {
  const value = parseInt(input.value) / 100;
  if (!isNaN(value)) {
    const clamped = Math.max(0, Math.min(1, value));
    state.delayMix = clamped;
    if (voice) voice.setDelayMix(clamped);
    const slider = input.parentElement.querySelector('input[type="range"]');
    if (slider) slider.value = clamped;
    input.value = `${Math.round(clamped * 100)}%`;
    input.dataset.raw = clamped;
  } else {
    input.value = `${Math.round(parseFloat(input.dataset.raw) * 100)}%`;
  }
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
          <input type="text" class="knob-value" data-raw="${s.oscDetune}" value="${s.oscDetune}¢" onclick="this.select()" onblur="window.commitDetune(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
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
          <input type="range" class="knob-input" data-log="true" data-min="40" data-max="16000" min="0" max="1" step="0.001" value="${invLogScale(s.filterCutoff, 40, 16000)}" oninput="window.setFilterCutoffLog(this.value)"/>
          <input type="text" class="knob-value" data-raw="${s.filterCutoff}" value="${formatFreq(s.filterCutoff)}" onclick="this.select()" onblur="window.commitFilterCutoff(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
        </div>
        <div class="knob-group">
          <span class="knob-label">Resonance</span>
          <input type="range" class="knob-input" min="0" max="25" step="0.5" value="${s.filterRes}" oninput="window.setFilterRes(this.value)"/>
          <input type="text" class="knob-value" data-raw="${s.filterRes}" value="${Number(s.filterRes).toFixed(1)}" onclick="this.select()" onblur="window.commitFilterRes(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
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
            <input type="text" class="knob-value" data-raw="${s.envA}" value="${formatTime(s.envA)}" onclick="this.select()" onblur="window.commitEnvAttack(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
          </div>
          <div class="knob-group">
            <span class="knob-label">Decay</span>
            <input type="range" class="knob-input" min="0.005" max="2" step="0.005" value="${s.envD}" oninput="window.setEnvDecay(this.value)"/>
            <input type="text" class="knob-value" data-raw="${s.envD}" value="${formatTime(s.envD)}" onclick="this.select()" onblur="window.commitEnvDecay(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
          </div>
          <div class="knob-group">
            <span class="knob-label">Sustain</span>
            <input type="range" class="knob-input" min="0" max="1" step="0.01" value="${s.envS}" oninput="window.setEnvSustain(this.value)"/>
            <input type="text" class="knob-value" data-raw="${s.envS}" value="${Math.round(s.envS * 100)}%"  onclick="this.select()" onblur="window.commitEnvSustain(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
          </div>
          <div class="knob-group">
            <span class="knob-label">Release</span>
            <input type="range" class="knob-input" min="0.005" max="3" step="0.005" value="${s.envR}" oninput="window.setEnvRelease(this.value)"/>
            <input type="text" class="knob-value" data-raw="${s.envR}" value="${formatTime(s.envR)}" onclick="this.select()" onblur="window.commitEnvRelease(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
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
          <input type="range" class="knob-input" data-log="true" data-min="0.1" data-max="20" min="0" max="1" step="0.001" value="${invLogScale(s.lfoRate, 0.1, 20)}" oninput="window.setLfoRateLog(this.value)"/>
          <input type="text" class="knob-value" data-raw="${s.lfoRate}" value="${Number(s.lfoRate).toFixed(1)} Hz" onclick="this.select()" onblur="window.commitLfoRate(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
        </div>
        <div class="knob-group">
          <span class="knob-label">Depth</span>
          <input type="range" class="knob-input" min="0" max="100" step="1" value="${s.lfoDepth}" oninput="window.setLfoDepth(this.value)"/>
          <input type="text" class="knob-value" data-raw="${s.lfoDepth}" value="${s.lfoDepth}" onclick="this.select()" onblur="window.commitLfoDepth(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
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
          <input type="text" class="knob-value" data-raw="${s.delayTime}" value="${(s.delayTime * 1000).toFixed(0)}ms" onclick="this.select()" onblur="window.commitDelayTime(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
        </div>
        <div class="knob-group">
          <span class="knob-label">Feedback</span>
          <input type="range" class="knob-input" min="0" max="0.9" step="0.01" value="${s.delayFB}" oninput="window.setDelayFB(this.value)"/>
          <input type="text" class="knob-value" data-raw="${s.delayFB}" value="${Math.round(s.delayFB * 100)}%" onclick="this.select()" onblur="window.commitDelayFB(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
        </div>
        <div class="knob-group">
          <span class="knob-label">Mix</span>
          <input type="range" class="knob-input" min="0" max="1" step="0.01" value="${s.delayMix}" oninput="window.setDelayMix(this.value)"/>
          <input type="text" class="knob-value" data-raw="${s.delayMix}" value="${Math.round(s.delayMix * 100)}%" onclick="this.select()" onblur="window.commitDelayMix(this)" onkeydown="if(event.key==='Enter') this.blur()"/>
        </div>
      </div>
    </div>

    <!-- Keyboard -->
    <div class="keyboard-wrap" id="keyboardWrap">
      <div class="octave-ctrl">
        <button onclick="window.changeOctave(-1)">◀</button>
        <span>Octave ${s.octave}</span>
        <button onclick="window.changeOctave(1)">▶</button>
        <button class="wave-btn ${s.latchMode ? 'active' : ''}" onclick="window.toggleLatch()" style="margin-left: auto; padding: 4px 10px;">
          ${s.latchMode ? '🔒 LATCHED' : '🔓 LATCH'}
        </button>
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
window.commitDetune = commitDetune;
window.toggleOscModule = toggleOscModule;
window.toggleFilter = toggleFilter;
window.setFilterCutoff = setFilterCutoff;
window.setFilterCutoffLog = setFilterCutoffLog;
window.commitFilterCutoff = commitFilterCutoff;
window.setFilterRes = setFilterRes;
window.commitFilterRes = commitFilterRes;
window.toggleFilterModule = toggleFilterModule;
window.toggleEnv = toggleEnv;
window.setEnvAttack = setEnvAttack;
window.commitEnvAttack = commitEnvAttack;
window.setEnvDecay = setEnvDecay;
window.commitEnvDecay = commitEnvDecay;
window.setEnvSustain = setEnvSustain;
window.commitEnvSustain = commitEnvSustain;
window.setEnvRelease = setEnvRelease;
window.commitEnvRelease = commitEnvRelease;
window.toggleEnvModule = toggleEnvModule;
window.toggleLfo = toggleLfo;
window.setLfoWave = setLfoWave;
window.setLfoRate = setLfoRate;
window.setLfoRateLog = setLfoRateLog;
window.commitLfoRate = commitLfoRate;
window.setLfoDepth = setLfoDepth;
window.commitLfoDepth = commitLfoDepth;
window.setLfoTarget = setLfoTarget;
window.toggleLfoModule = toggleLfoModule;
window.toggleDelay = toggleDelay;
window.setDelayTime = setDelayTime;
window.commitDelayTime = commitDelayTime;
window.setDelayFB = setDelayFB;
window.commitDelayFB = commitDelayFB;
window.setDelayMix = setDelayMix;
window.commitDelayMix = commitDelayMix;
window.toggleDelayModule = toggleDelayModule;
window.toggleScope = toggleScope;
window.toggleSpectrum = toggleSpectrum;
window.changeOctave = changeOctave;
window.toggleLatch = toggleLatch;

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
