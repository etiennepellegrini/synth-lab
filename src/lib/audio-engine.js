// ======================================================================
// Shared Web Audio Engine for Synth Lab
// ======================================================================
//
// Provides a unified AudioContext, master output chain, and voice
// management for both the synthesizer and course applications.
//

// ─── Note Frequency Utilities ──────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert note name and octave to frequency in Hz
 * @param {string} note - Note name ('C', 'C#', 'D', etc.)
 * @param {number} octave - Octave number (0-8)
 * @returns {number} Frequency in Hz
 */
export function noteToFreq(note, octave) {
  const idx = NOTE_NAMES.indexOf(note);
  if (idx === -1) return 440; // Default to A4
  const midi = (octave + 1) * 12 + idx;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Convert frequency to nearest note and octave
 * @param {number} freq - Frequency in Hz
 * @returns {{note: string, octave: number, cents: number}}
 */
export function freqToNote(freq) {
  const midi = 69 + 12 * Math.log2(freq / 440);
  const midiRounded = Math.round(midi);
  const cents = Math.round((midi - midiRounded) * 100);
  const octave = Math.floor(midiRounded / 12) - 1;
  const note = NOTE_NAMES[midiRounded % 12];
  return { note, octave, cents };
}

// ─── AudioEngine (Singleton) ───────────────────────────────────────

/**
 * Singleton audio engine managing shared AudioContext and master output
 */
export class AudioEngine {
  constructor() {
    if (AudioEngine.instance) {
      return AudioEngine.instance;
    }

    this.ctx = null;
    this.masterGainNode = null;
    this.limiterNode = null;
    this.analyserNode = null;
    this._ready = false;
    this._muted = false;

    AudioEngine.instance = this;
  }

  /**
   * Initialize AudioContext and master signal chain
   * Must be called from user gesture (browser requirement)
   */
  async init() {
    if (this.ctx) {
      await this.ctx.resume();
      this._ready = true;
      return;
    }

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain for volume control
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = 0.4;

      // Limiter for protection against clipping
      this.limiterNode = this.ctx.createDynamicsCompressor();
      this.limiterNode.threshold.value = -6;
      this.limiterNode.knee.value = 12;
      this.limiterNode.ratio.value = 8;
      this.limiterNode.attack.value = 0.001;
      this.limiterNode.release.value = 0.1;

      // Shared analyser for visualizations
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.7;

      // Connect: master → limiter → analyser → destination
      this.masterGainNode.connect(this.limiterNode);
      this.limiterNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);

      this._ready = true;
    } catch (err) {
      console.error('Failed to initialize AudioEngine:', err);
      throw err;
    }
  }

  /** Resume suspended AudioContext */
  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /** @returns {boolean} Is engine initialized and ready? */
  get ready() {
    return this._ready && this.ctx && this.ctx.state === 'running';
  }

  /** @returns {AudioContext} Raw AudioContext reference */
  get context() {
    return this.ctx;
  }

  /** @returns {GainNode} Master gain node for connecting sources */
  get masterGain() {
    return this.masterGainNode;
  }

  /** @returns {AnalyserNode} Shared analyser for visualizations */
  get analyser() {
    return this.analyserNode;
  }

  /**
   * Set master volume
   * @param {number} value - Volume (0-1)
   */
  setMasterVolume(value) {
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  /**
   * Set master mute state
   * @param {boolean} muted - Mute state
   */
  setMasterMute(muted) {
    this._muted = muted;
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = muted ? 0 : 0.4;
    }
  }

  /** @returns {boolean} Is master muted? */
  get muted() {
    return this._muted;
  }

  /**
   * Create a Voice instance for synthesizer use
   * @returns {Voice} New voice instance
   */
  createVoice() {
    if (!this.ready) {
      throw new Error('AudioEngine not initialized. Call init() first.');
    }
    return new Voice(this);
  }

  /**
   * Play a simple tone (for course demos)
   * @param {number} freq - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {string} waveType - Waveform type ('sine', 'sawtooth', 'square', 'triangle')
   * @returns {Promise<void>} Resolves when tone finishes
   */
  async playTone(freq, duration = 0.3, waveType = 'sine') {
    if (!this.ready) {
      await this.init();
    }

    return new Promise((resolve) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveType;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + duration + 0.01);

      setTimeout(resolve, duration * 1000 + 50);
    });
  }

  /**
   * Play a note by name (for course demos)
   * @param {string} note - Note name ('C', 'D', etc.)
   * @param {number} octave - Octave (0-8)
   * @param {number} duration - Duration in seconds
   * @param {string} waveType - Waveform type
   * @returns {Promise<void>}
   */
  async playNote(note, octave, duration = 0.3, waveType = 'sawtooth') {
    const freq = noteToFreq(note, octave);
    return this.playTone(freq, duration, waveType);
  }
}

// ─── Voice (Synthesizer Signal Chain) ─────────────────────────────

/**
 * Complete synthesizer voice with VCO, VCF, envelope, LFO, and delay
 */
export class Voice {
  constructor(engine) {
    this.engine = engine;
    this.ctx = engine.context;

    // Create nodes
    this._createOscillator();
    this._createFilter();
    this._createEnvelope();
    this._createLFO();
    this._createDelay();

    // Connect signal chain: osc → filter → ampGain → delay → output
    this.osc.connect(this.filter);
    this.filter.connect(this.ampGain);
    this.ampGain.connect(this.delayDry);
    this.ampGain.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);

    // Output node (connect to engine.masterGain)
    this.outputGain = this.ctx.createGain();
    this.outputGain.gain.value = 1;
    this.delayDry.connect(this.outputGain);
    this.delayWet.connect(this.outputGain);
    this.outputGain.connect(this.engine.masterGain);

    // State
    this.gateOn = false;
    this.envPhase = 'idle';
    this.envLevel = 0;
    this._disposed = false;

    // Start envelope loop
    this._startEnvelopeLoop();
  }

  // ─── Node Creation ─────────────────────────────────────────────

  _createOscillator() {
    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = 0;
    this.osc.detune.value = 0;
    this.osc.start();
  }

  _createFilter() {
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 8000;
    this.filter.Q.value = 0;
    this._filterEnabled = true;
  }

  _createEnvelope() {
    this.ampGain = this.ctx.createGain();
    this.ampGain.gain.value = 0;
    this._envEnabled = true;
    this._attack = 0.01;
    this._decay = 0.15;
    this._sustain = 0.7;
    this._release = 0.3;
  }

  _createLFO() {
    this.lfoOsc = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.lfoOsc.type = 'triangle';
    this.lfoOsc.frequency.value = 4;
    this.lfoGain.gain.value = 0;
    this.lfoOsc.connect(this.lfoGain);
    this.lfoOsc.start();
    this._lfoEnabled = false;
    this._lfoTarget = 'pitch';
    this._lfoDepth = 30;
  }

  _createDelay() {
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayFeedback = this.ctx.createGain();
    this.delayWet = this.ctx.createGain();
    this.delayDry = this.ctx.createGain();

    this.delayNode.delayTime.value = 0.3;
    this.delayFeedback.gain.value = 0.3;
    this.delayWet.gain.value = 0;
    this.delayDry.gain.value = 1;
    this._delayEnabled = false;
  }

  // ─── Envelope Processing (Frame-Based) ────────────────────────

  _startEnvelopeLoop() {
    let lastTime = performance.now();

    const tick = (now) => {
      if (this._disposed) return;

      const dt = (now - lastTime) / 1000;
      lastTime = now;

      this._processEnvelope(dt);
      this._envLoopId = requestAnimationFrame(tick);
    };

    this._envLoopId = requestAnimationFrame(tick);
  }

  _processEnvelope(dt) {
    if (!this._envEnabled) {
      // No envelope: gate directly controls volume
      if (this.gateOn) {
        this.envLevel = 1;
      } else {
        this.envLevel = Math.max(0, this.envLevel - dt * 10);
      }
      this.ampGain.gain.value = this.envLevel * 0.35;
      this.envPhase = this.gateOn ? 'sustain' : (this.envLevel > 0.01 ? 'release' : 'idle');
      return;
    }

    // ADSR envelope
    switch (this.envPhase) {
      case 'attack':
        this.envLevel += dt / Math.max(this._attack, 0.005);
        if (this.envLevel >= 1) {
          this.envLevel = 1;
          this.envPhase = 'decay';
        }
        break;

      case 'decay':
        this.envLevel -= dt / Math.max(this._decay, 0.005) * (1 - this._sustain);
        if (this.envLevel <= this._sustain) {
          this.envLevel = this._sustain;
          this.envPhase = 'sustain';
        }
        break;

      case 'sustain':
        this.envLevel = this._sustain;
        break;

      case 'release':
        this.envLevel -= dt / Math.max(this._release, 0.005) * this.envLevel;
        if (this.envLevel < 0.003) {
          this.envLevel = 0;
          this.envPhase = 'idle';
        }
        break;

      default:
        this.envLevel = 0;
    }

    this.ampGain.gain.value = this.envLevel * 0.35;
  }

  // ─── LFO Routing ───────────────────────────────────────────────

  _applyLFORouting() {
    // Disconnect LFO
    try {
      this.lfoGain.disconnect();
    } catch (e) {
      // Ignore if not connected
    }

    if (!this._lfoEnabled) {
      this.lfoGain.gain.value = 0;
      return;
    }

    // Route to target
    if (this._lfoTarget === 'pitch') {
      this.lfoGain.gain.value = this._lfoDepth;
      this.lfoGain.connect(this.osc.frequency);
    } else if (this._lfoTarget === 'filter') {
      this.lfoGain.gain.value = this._lfoDepth * 80;
      this.lfoGain.connect(this.filter.frequency);
    } else if (this._lfoTarget === 'amplitude') {
      this.lfoGain.gain.value = this._lfoDepth * 0.01;
      this.lfoGain.connect(this.ampGain.gain);
    }
  }

  // ─── Public API ────────────────────────────────────────────────

  // --- Oscillator

  setWaveform(type) {
    this.osc.type = type;
  }

  setDetune(cents) {
    this.osc.detune.value = cents;
  }

  setFrequency(hz) {
    this.osc.frequency.value = hz;
  }

  // --- Filter

  setFilterEnabled(enabled) {
    this._filterEnabled = enabled;
    this.filter.frequency.value = enabled ? this.filter.frequency.value : 20000;
  }

  setFilterCutoff(hz) {
    if (this._filterEnabled) {
      this.filter.frequency.value = Math.max(20, Math.min(20000, hz));
    }
  }

  setFilterResonance(q) {
    this.filter.Q.value = Math.max(0, Math.min(30, q));
  }

  // --- Envelope

  setEnvelopeEnabled(enabled) {
    this._envEnabled = enabled;
  }

  setADSR(attack, decay, sustain, release) {
    this._attack = Math.max(0.001, attack);
    this._decay = Math.max(0.001, decay);
    this._sustain = Math.max(0, Math.min(1, sustain));
    this._release = Math.max(0.001, release);
  }

  // --- LFO

  setLFOEnabled(enabled) {
    this._lfoEnabled = enabled;
    this._applyLFORouting();
  }

  setLFOWave(type) {
    this.lfoOsc.type = type;
  }

  setLFORate(hz) {
    this.lfoOsc.frequency.value = Math.max(0.1, Math.min(20, hz));
  }

  setLFODepth(amount) {
    this._lfoDepth = Math.max(0, Math.min(100, amount));
    this._applyLFORouting();
  }

  setLFOTarget(target) {
    this._lfoTarget = target;
    this._applyLFORouting();
  }

  // --- Delay

  setDelayEnabled(enabled) {
    this._delayEnabled = enabled;
    this.delayWet.gain.value = enabled ? this.delayWet.gain.value : 0;
  }

  setDelayTime(seconds) {
    this.delayNode.delayTime.value = Math.max(0.02, Math.min(2, seconds));
  }

  setDelayFeedback(amount) {
    this.delayFeedback.gain.value = Math.max(0, Math.min(0.95, amount));
  }

  setDelayMix(amount) {
    if (this._delayEnabled) {
      this.delayWet.gain.value = Math.max(0, Math.min(1, amount));
    }
  }

  // --- Gate Control

  noteOn(frequency) {
    this.osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    this.gateOn = true;
    this.envPhase = 'attack';
  }

  noteOff() {
    this.gateOn = false;
    if (this.envPhase !== 'idle') {
      this.envPhase = 'release';
    }
  }

  // --- Cleanup

  dispose() {
    this._disposed = true;

    if (this._envLoopId) {
      cancelAnimationFrame(this._envLoopId);
    }

    // Ramp down and stop
    this.ampGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    setTimeout(() => {
      try {
        this.osc.stop();
        this.lfoOsc.stop();
        this.outputGain.disconnect();
      } catch (e) {
        // Already stopped/disconnected
      }
    }, 100);
  }
}

// Export singleton instance
export const audioEngine = new AudioEngine();
