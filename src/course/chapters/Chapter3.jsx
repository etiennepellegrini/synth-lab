import { useState, useEffect, useRef, useMemo } from 'react';
import { useAudio } from '../audio/AudioProvider.jsx';
import { filterMagnitude } from '../audio/helpers.js';
import { VolcaCallout } from '../components/VolcaCallout.jsx';
import { DiveDeeper } from '../components/DiveDeeper.jsx';
import { Slider } from '../components/Slider.jsx';
import { ListenToggle } from '../components/ListenToggle.jsx';

export function Chapter3() {
  const audio = useAudio();
  const [cutoff, setCutoff] = useState(2000);
  const [resonance, setResonance] = useState(0.2);
  const [listening, setListening] = useState(false);
  const oscRef = useRef(null);
  const filterRef = useRef(null);
  const gainRef = useRef(null);
  const width = 560,
    height = 200,
    margin = 40;

  // Audio: sawtooth through biquad filter
  useEffect(() => {
    if (listening && audio.ready && audio.ctx.current) {
      const ctx = audio.ctx.current;

      // Resume AudioContext if suspended (Safari)
      const initAudio = async () => {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const osc = ctx.createOscillator();
        const filt = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 110;
        filt.type = 'lowpass';
        filt.frequency.value = cutoff;
        filt.Q.value = resonance * 25;
        g.gain.value = 0.25;
        osc.connect(filt);
        filt.connect(g);
        g.connect(audio.master.current);
        osc.start();
        oscRef.current = osc;
        filterRef.current = filt;
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
        filterRef.current = null;
      };
    }
  }, [listening, audio.ready]);

  useEffect(() => {
    if (filterRef.current) filterRef.current.frequency.value = cutoff;
  }, [cutoff]);
  useEffect(() => {
    if (filterRef.current) filterRef.current.Q.value = resonance * 25;
  }, [resonance]);
  useEffect(() => () => setListening(false), []);

  const responseCurve = useMemo(() => {
    const pts = [];
    const Q = 0.5 + resonance * 20;
    for (let i = 0; i < 200; i++) {
      const x = i / 200;
      const freq = 20 * Math.pow(1000, x);
      const mag = filterMagnitude(freq, cutoff, Q);
      const dB = 20 * Math.log10(Math.max(mag, 0.001));
      pts.push({ x, y: Math.max(-36, Math.min(24, dB)) });
    }
    return pts;
  }, [cutoff, resonance]);

  const pathD = useMemo(
    () =>
      responseCurve
        .map((p, i) => {
          const x = margin + p.x * (width - 2 * margin);
          const yN = (p.y - -36) / (24 - -36);
          const y = height - margin - yN * (height - 2 * margin);
          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        })
        .join(' '),
    [responseCurve]
  );

  const cutoffX = margin + (Math.log10(cutoff / 20) / 3) * (width - 2 * margin);

  return (
    <div className="chapter-content">
      <p>
        If oscillators are the raw ingredients, the <strong>filter</strong> is the sculptor. A{' '}
        <strong>low-pass filter</strong> lets frequencies below a cutoff pass through while
        attenuating everything above. It's the single most expressive tool on most synths.
      </p>
      <p>
        <strong>Resonance</strong> ("Peak" on the Volca Keys) boosts frequencies right at the
        cutoff. Push it far enough and the filter <strong>self-oscillates</strong>.
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
          <ListenToggle
            on={listening}
            onToggle={setListening}
            label={listening ? 'Filtered Saw' : 'Listen (Saw→Filter)'}
          />
        </div>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
          {[-24, -12, 0, 12].map((db) => {
            const y = height - margin - ((db - -36) / (24 - -36)) * (height - 2 * margin);
            return (
              <g key={db}>
                <line
                  x1={margin}
                  y1={y}
                  x2={width - margin}
                  y2={y}
                  stroke="var(--surface-3)"
                  strokeWidth="1"
                  strokeDasharray={db === 0 ? 'none' : '3,3'}
                />
                <text x={margin - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-3)">
                  {db}dB
                </text>
              </g>
            );
          })}
          {[100, 1000, 10000].map((f) => {
            const x = margin + (Math.log10(f / 20) / 3) * (width - 2 * margin);
            return (
              <g key={f}>
                <line
                  x1={x}
                  y1={margin}
                  x2={x}
                  y2={height - margin}
                  stroke="var(--surface-3)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <text x={x} y={height - margin + 14} textAnchor="middle" fontSize="9" fill="var(--text-3)">
                  {f >= 1000 ? `${f / 1000}k` : f} Hz
                </text>
              </g>
            );
          })}
          <line
            x1={cutoffX}
            y1={margin}
            x2={cutoffX}
            y2={height - margin}
            stroke="var(--amber)"
            strokeWidth="1.5"
            strokeDasharray="5,4"
            opacity="0.6"
          />
          <text x={cutoffX} y={margin - 6} textAnchor="middle" fontSize="9" fill="var(--amber)">
            cutoff
          </text>
          <path d={pathD} fill="none" stroke="var(--cyan)" strokeWidth="2.5" strokeLinejoin="round" />
          <path
            d={`${pathD} L${width - margin},${height - margin} L${margin},${height - margin} Z`}
            fill="var(--cyan)"
            opacity="0.06"
          />
        </svg>
        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
          <Slider label="Cutoff" value={cutoff} onChange={setCutoff} min={40} max={16000} step={10} suffix=" Hz" />
          <Slider label="Resonance" value={resonance} onChange={setResonance} min={0} max={0.95} step={0.01} />
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 12, marginBottom: 0 }}>
          ↑ Toggle 🔊 to hear a sawtooth through this filter. Sweep cutoff and resonance in real
          time!
        </p>
      </div>
      <VolcaCallout>
        <p>
          The Volca Keys filter is a <strong>12dB/oct low-pass</strong> modeled on the Korg
          miniKORG 700S from 1974. The <strong>CUTOFF</strong> and <strong>PEAK</strong> knobs are
          your most important sound-shaping controls.
        </p>
      </VolcaCallout>
      <DiveDeeper>
        <p>
          <strong>Filter slope — "12dB per octave":</strong> For every doubling of frequency past
          the cutoff, the signal drops by 12dB. A 24dB/oct filter (Moog ladder) drops twice as
          fast. The Volca's 12dB slope is more subtle, letting more harmonics bleed through.
        </p>
        <p>
          <strong>Self-oscillation</strong> happens when resonance feedback becomes so strong the
          filter generates its own sine wave. On the Volca Keys, this pitch doesn't track the
          keyboard — it stays wherever the Cutoff knob is set.
        </p>
        <p>
          <strong>The Korg 700S "diode ring" circuit</strong> has a distinctive aggressive
          resonance character — grittier than Moog or Roland designs. This is a big part of the
          Volca Keys' sonic personality.
        </p>
      </DiveDeeper>
    </div>
  );
}
