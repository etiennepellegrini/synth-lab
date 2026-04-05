import { useState, useEffect, useRef, useMemo } from 'react';
import { useAudio } from '../audio/AudioProvider.jsx';
import { generateWaveform, getHarmonics } from '../audio/helpers.js';
import { VolcaCallout } from '../components/VolcaCallout.jsx';
import { DiveDeeper } from '../components/DiveDeeper.jsx';
import { WaveformSVG } from '../components/WaveformSVG.jsx';
import { ListenToggle } from '../components/ListenToggle.jsx';

export function Chapter2() {
  const audio = useAudio();
  const [waveType, setWaveType] = useState('saw');
  const [listening, setListening] = useState(false);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const width = 560,
    height = 160;

  // Audio: continuous tone with waveform type
  useEffect(() => {
    if (listening && audio.ready && audio.ctx.current) {
      const ctx = audio.ctx.current;

      // Resume AudioContext if suspended (Safari)
      const initAudio = async () => {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = waveType === 'saw' ? 'sawtooth' : waveType;
        osc.frequency.value = 220;
        g.gain.value = 0.2;
        osc.connect(g);
        g.connect(audio.master.current);
        osc.start();
        oscRef.current = osc;
        gainRef.current = g;
      };

      initAudio();
      return () => {
        try {
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        } catch (e) {
          // AudioContext may be closed or suspended
        }
        setTimeout(() => {
          try {
            osc.stop();
          } catch (e) {}
        }, 80);
        oscRef.current = null;
      };
    }
  }, [listening, audio.ready, waveType]);

  useEffect(() => () => setListening(false), []);

  const wavePoints = useMemo(() => generateWaveform(waveType, 300, 2), [waveType]);
  const harmonics = useMemo(() => getHarmonics(waveType, 16), [waveType]);

  const desc = {
    sine: 'Pure tone. No harmonics — just the fundamental. Smooth and hollow, like a tuning fork.',
    saw: 'Contains ALL harmonics (1/n amplitude). Bright, buzzy, aggressive. The classic synth waveform.',
    square:
      'Only ODD harmonics (1/n amplitude). Hollow, woody, clarinet-like.',
    triangle:
      'Only odd harmonics (1/n² — much weaker). Soft, muted, flute-like.',
  };

  const bw = 28,
    bg = 8,
    baw = 560,
    bh = 100;

  return (
    <div className="chapter-content">
      <p>
        An <strong>oscillator</strong> (VCO) is the engine of a synthesizer. It generates the raw
        waveform that everything else shapes. Different <strong>waveshapes</strong> have different
        harmonic recipes, giving them radically different characters.
      </p>
      <p>
        What makes a sawtooth sound different from a square wave? <strong>Harmonics</strong> —
        simple sine waves stacked at integer multiples of the fundamental.
      </p>
      <div className="viz-container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {['sine', 'saw', 'square', 'triangle'].map((w) => (
              <button
                key={w}
                className={`wave-btn ${waveType === w ? 'active' : ''}`}
                onClick={() => setWaveType(w)}
              >
                {w.charAt(0).toUpperCase() + w.slice(1)}
              </button>
            ))}
          </div>
          <ListenToggle on={listening} onToggle={setListening} />
        </div>
        <WaveformSVG points={wavePoints} width={width} height={height} />
        <p
          style={{
            color: 'var(--text-2)',
            fontSize: '0.85rem',
            margin: '12px 0 16px',
            minHeight: '2.5em',
          }}
        >
          {desc[waveType]}
        </p>
        <div style={{ marginTop: 8 }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Harmonic Content
          </p>
          <svg width="100%" viewBox={`0 0 ${baw} ${bh + 20}`}>
            {harmonics.map((h, i) => {
              const x = i * (bw + bg) + 10;
              const barH = h.amp * bh;
              return (
                <g key={h.n}>
                  <rect
                    x={x}
                    y={bh - barH}
                    width={bw}
                    height={barH}
                    fill={h.amp > 0 ? 'var(--cyan)' : 'var(--surface-3)'}
                    opacity={h.amp > 0 ? 0.7 : 0.3}
                    rx="2"
                  />
                  <text x={x + bw / 2} y={bh + 14} textAnchor="middle" fontSize="9" fill="var(--text-3)">
                    {h.n}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <VolcaCallout>
        <p>
          The Volca Keys uses <strong>sawtooth</strong> in Poly/Unison/Octave/Fifth modes, and{' '}
          <strong>square</strong> in Ring modes. The sawtooth's rich harmonic content is why it
          responds so dramatically to the filter.
        </p>
      </VolcaCallout>
      <DiveDeeper>
        <p>
          <strong>Why the sawtooth is king:</strong> It contains all harmonics, giving you maximum
          raw material for the filter to sculpt. A square wave is missing even harmonics, producing
          a more hollow, woodwind-like family of tones.
        </p>
        <p>
          <strong>Subtractive synthesis</strong> — start harmonically rich, subtract with a filter.
          The opposite, <strong>additive synthesis</strong>, builds sounds by stacking individual
          sine waves. Subtractive won because it's intuitive: start bright, remove what you don't
          want.
        </p>
        <p>
          <strong>Analog oscillators:</strong> The Volca Keys uses digitally controlled analog
          oscillators — analog waveform generation with digital pitch control via a 10-bit DAC.
          Self-tuning constantly corrects temperature-induced drift.
        </p>
        <p>
          <strong>Ring modulation</strong> multiplies two signals, producing sum and difference
          frequencies. This creates metallic, bell-like, dissonant tones — why the Ring voice modes
          sound so alien.
        </p>
      </DiveDeeper>
    </div>
  );
}
