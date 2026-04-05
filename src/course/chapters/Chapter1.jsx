import { useState, useEffect, useRef, useMemo } from 'react';
import { useAudio } from '../audio/AudioProvider.jsx';
import { VolcaCallout } from '../components/VolcaCallout.jsx';
import { DiveDeeper } from '../components/DiveDeeper.jsx';
import { Slider } from '../components/Slider.jsx';
import { WaveformSVG } from '../components/WaveformSVG.jsx';
import { ListenToggle } from '../components/ListenToggle.jsx';

export function Chapter1() {
  const audio = useAudio();
  const [freq, setFreq] = useState(2);
  const [amp, setAmp] = useState(0.8);
  const [phase, setPhase] = useState(0);
  const animRef = useRef();
  const [listening, setListening] = useState(false);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const width = 560,
    height = 180;

  // Animation loop for phase
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      setPhase((p) => (p + 0.02) % (Math.PI * 20));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Audio: sine wave
  useEffect(() => {
    if (listening && audio.ready && audio.ctx.current) {
      const ctx = audio.ctx.current;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 220 * freq; // map visual freq to audible range
      g.gain.value = amp * 0.3;
      osc.connect(g);
      g.connect(audio.master.current);
      osc.start();
      oscRef.current = osc;
      gainRef.current = g;
      return () => {
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        setTimeout(() => {
          try {
            osc.stop();
          } catch (e) {}
        }, 80);
        oscRef.current = null;
      };
    }
  }, [listening, audio.ready]);

  // Update freq/amp in real time
  useEffect(() => {
    if (oscRef.current) oscRef.current.frequency.value = 220 * freq;
  }, [freq]);
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = amp * 0.3;
  }, [amp]);

  useEffect(() => () => setListening(false), []); // cleanup on unmount

  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 300; i++) {
      const x = i / 300;
      pts.push({ x, y: amp * Math.sin(x * Math.PI * 2 * freq + phase) });
    }
    return pts;
  }, [freq, amp, phase]);

  return (
    <div className="chapter-content">
      <p>
        Every sound you've ever heard — from the lowest bass drum to the highest flute trill — is{' '}
        <strong>air vibrating</strong>. When you blew into your flute, your breath set a column of
        air into rapid oscillation: compressing and decompressing hundreds of times per second. A
        synthesizer does the exact same thing, but with electricity instead of breath.
      </p>
      <p>
        We visualize these vibrations as <strong>waveforms</strong>. The height of the wave is its{' '}
        <strong>amplitude</strong> (loudness). How many cycles it completes per second is its{' '}
        <strong>frequency</strong> (pitch), measured in Hertz (Hz). Concert A — the note orchestras
        tune to — vibrates at 440 Hz.
      </p>
      <div className="viz-container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <ListenToggle on={listening} onToggle={setListening} />
          {listening && (
            <span
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-3)' }}
            >
              ~{(220 * freq).toFixed(0)} Hz
            </span>
          )}
        </div>
        <WaveformSVG points={points} width={width} height={height} color="var(--cyan)" strokeWidth={2.5} />
        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
          <Slider label="Frequency" value={freq} onChange={setFreq} min={0.5} max={6} step={0.1} suffix=" cycles" />
          <Slider label="Amplitude" value={amp} onChange={setAmp} min={0.1} max={1} step={0.05} />
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 12, marginBottom: 0 }}>
          ↑ A moving sine wave. Toggle 🔊 to hear it. Drag sliders to change pitch and volume in
          real time.
        </p>
      </div>
      <p>
        Notice: more cycles in the same space = higher pitch. Taller waves = louder. This is the
        foundation of everything in synthesis.
      </p>
      <VolcaCallout>
        <p>
          The Volca Keys has 3 oscillators, each generating these kinds of vibrations
          electronically. The <strong>OCTAVE</strong> knob shifts the frequency range — just like
          moving between the registers on your flute.
        </p>
      </VolcaCallout>
      <DiveDeeper>
        <p>
          <strong>Frequency and musical pitch have a logarithmic relationship.</strong> When you
          double a frequency, you go up exactly one octave. A₄ is 440 Hz, A₅ is 880 Hz, A₃ is 220
          Hz. Our perception of pitch is proportional, not linear.
        </p>
        <p>
          <strong>Phase</strong> is where in its cycle a wave starts. Two identical waves at
          different phases can cancel or reinforce each other. When the Volca Keys stacks three
          oscillators in Unison mode, slight phase differences create that rich, fat sound.
        </p>
        <p>
          <strong>The harmonic series</strong> — when a string vibrates, it produces the
          fundamental AND integer multiples simultaneously. The relative strength of each harmonic
          gives an instrument its <strong>timbre</strong>. Synthesizers let you construct or sculpt
          that harmonic recipe directly.
        </p>
      </DiveDeeper>
    </div>
  );
}
